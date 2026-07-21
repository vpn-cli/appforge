import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { rateLimit } from "@/lib/rate-limit";

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

    // 4. Initialize Multi-Key Waterfall Failover array
    const apiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
    ].filter(Boolean) as string[];

    if (apiKeys.length === 0) {
      return NextResponse.json({ error: "No GEMINI_API_KEY is defined in environment variables." }, { status: 500 });
    }

    let responseStream;
    let fallbackError = null;

    // 5. Sequentially iterate keys to bypass 429 Quota Exhaustions
    for (let i = 0; i < apiKeys.length; i++) {
      try {
        const ai = new GoogleGenAI({ apiKey: apiKeys[i] });
        responseStream = await ai.models.generateContentStream({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.1, // Keep it highly deterministic
          },
        });
        
        // Success! Clear error state and break out to streaming
        fallbackError = null;
        break;
      } catch (err) {
        fallbackError = err;
        const e = err as Error;
        if (e.message && (e.message.includes("429") || e.message.includes("Resource has been exhausted"))) {
          console.warn(`[Copilot Failover] AI Key ${i + 1} exhausted daily quota. Attempting rotation...`);
          continue;
        }
        // If it's a 500 parse failure or bad request, do not swallow it
        throw e;
      }
    }

    // 6. If the entire waterfall array failed, throw the final captured exception
    if (fallbackError || !responseStream) {
      throw fallbackError || new Error("Failed to generate content across all provided GenAI keys.");
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
          controller.close();
        } catch (error: unknown) {
          console.error("[Copilot Streaming Error]", error);
          controller.enqueue(encoder.encode(`\n[ERROR]: ${(error as Error).message}`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: unknown) {
    console.error("[Copilot API Error]", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
