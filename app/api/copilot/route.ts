import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { streamText } from "ai";
import { groq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Redis } from "@upstash/redis";

const redisClient = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) 
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    : null;

const SYSTEM_PROMPT = `Return ONLY a valid JSON array matching this schema structure. No markdown wrappers.
Types:
- Header: {type:"Header",title:string,subtitle?:string,size?:"sm"|"md"|"lg"}
- ButtonAction: {type:"ButtonAction",label:string,variant?:"default"|"outline"|"secondary"|"ghost",icon?:"arrow-right"|"save"|"play"|"plus"|"search"}
- Card: {type:"Card",title:string,subtitle?:string,content:any[],footer?:any[]}
- Grid: {type:"Grid",columns?:1|2|3|4,gap?:number,items:any[]}
- Statistic: {type:"Statistic",label:string,value:string,trend?:"up"|"down"|"neutral",trendValue?:string}
- DataTable: {type:"DataTable",columns:string[],data:Record<string,string|number>[]}
Rules: Compose recursively. Omit markdown backticks.`;

export async function POST(req: Request) {
  try {
    // 1. Resolve Client Origin
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    
    // 2. Validate against sliding window threshold (10 req / 10s)
    const { success, limit, remaining, reset } = await rateLimit.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many AI generation requests. Please slow down and try again shortly." },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString()
          }
        }
      );
    }

    // 3. Extract parameters
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // --- Enterprise Upstash Cache Lookup ---
    if (redisClient) {
      const cacheKey = `copilot_cache:${prompt.trim().toLowerCase()}`;
      try {
        const cachedResponse = await redisClient.get(cacheKey);
        if (cachedResponse) {
          console.log(`[Copilot Cache] HIT for prompt: "${prompt}"`);
          const stream = new ReadableStream({
            start(controller) {
              const textOutput = typeof cachedResponse === "string" ? cachedResponse : JSON.stringify(cachedResponse);
              controller.enqueue(new TextEncoder().encode(textOutput));
              controller.close();
            }
          });
          return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
        }
      } catch (err) {
        console.error("[Copilot Cache Error] Failed to read from Redis:", err);
      }
    }

    // 4. Initialize Multi-Provider Fallback (Groq Primary -> Gemini Backups)
    const geminiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
    ].filter(Boolean) as string[];

    const models: import("ai").LanguageModel[] = [];
    
    // Attempt Groq first if key exists (Lightning Fast Free Tier)
    if (process.env.GROQ_API_KEY) {
      models.push(groq("llama-3.3-70b-versatile"));
    }

    // Append Gemini backups by explicitly building the provider with specific keys
    for (const key of geminiKeys) {
      const googleProvider = createGoogleGenerativeAI({ apiKey: key });
      models.push(googleProvider("gemini-2.5-flash"));
    }

    if (models.length === 0) {
      return NextResponse.json({ error: "No AI API Keys are configured." }, { status: 500 });
    }

    // 5. Custom stream multiplexer for Native Failover
    const streamFallback = new ReadableStream({
      async start(controller) {
        let lastError = null;

        for (const activeModel of models) {
          try {
            const responseResult = streamText({
              model: activeModel,
              system: SYSTEM_PROMPT,
              prompt: prompt,
              temperature: 0.1,
            });

            // Extract the raw byte stream returned by the AI SDK
            const reader = responseResult.toTextStreamResponse().body?.getReader();
            if (!reader) {
              lastError = new Error("Failed to extract reader from stream.");
              continue;
            }

            // Await the first stream chunk! 
            // Vercel AI SDK throws underlying API HTTP errors here (like 429 Quota Exceeded)
            const firstChunk = await reader.read();
            if (firstChunk.done) {
               lastError = new Error("Stream closed instantly with no data.");
               continue; 
            }

            // Connection is alive and generating data. Forward the first chunk!
            controller.enqueue(firstChunk.value);
            
            let streamTextAccumulator = "";
            const decoder = new TextDecoder("utf-8");
            streamTextAccumulator += decoder.decode(firstChunk.value, { stream: true });
            
            // Forward the rest of the stream transparently
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              controller.enqueue(value);
              streamTextAccumulator += decoder.decode(value, { stream: true });
            }

            // Optionally push the finalized AST to the Redis cache
            if (redisClient && streamTextAccumulator.trim()) {
              const cacheKey = `copilot_cache:${prompt.trim().toLowerCase()}`;
              await redisClient.set(cacheKey, streamTextAccumulator, { ex: 604800 }).catch(console.error);
            }

            controller.close();
            return; // Successfully streamed! Break out of the fallback loop forever

          } catch (err) {
            console.warn(`[Copilot Failover] Model failed, actively shifting to backup...`, (err as Error).message);
            lastError = err;
            continue; // Move to next model
          }
        }

        // If all configured activeModels failed
        controller.error(lastError || new Error("All backup AI models failed on this payload."));
      }
    });

    return new Response(streamFallback, {
      status: 200,
      headers: { 
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache"
      },
    });

  } catch (error: unknown) {
    console.error("[Copilot API Error]", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
