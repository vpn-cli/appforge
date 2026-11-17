import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
import { rateLimit } from "@/lib/rate-limit";
import { streamText } from "ai";
import { groq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Redis } from "@upstash/redis";

const redisClient = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) 
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    : null;

const SYSTEM_PROMPT = `Return ONLY a valid JSON array of UI component AST nodes. No markdown wrappers, no conversational commentary.
Allowed Component Types:
- Header: { type: "Header", title: string, subtitle?: string, size?: "sm" | "md" | "lg" }
- Statistic: { type: "Statistic", label: string, value: string | number, trend?: { value?: string, label?: string, direction?: "up" | "down" | "neutral", sentiment?: "positive" | "negative" | "neutral" } | "up" | "down" | "neutral", trendValue?: string }
  CRITICAL: Statistic is STRICTLY for numeric KPIs and aggregated metrics (e.g. "$42.8K", "99.98%", "14"). At most 4 statistics in a Grid row. NEVER use Statistic for names, labels, individual records, or text descriptions.
- DataTable: { type: "DataTable", columns: (string | { key: string, label?: string, type?: "text" | "number" | "currency" | "badge" | "id" | "code", align?: "left" | "right" | "center" })[], data: Record<string, unknown>[] }
  CRITICAL: Any collection or list of records (incidents, users, orders, tickets, servers, fleet units) MUST be rendered as a DataTable with structured columns, NEVER as Cards of Statistics. Use column type "badge" for status columns (e.g. "Active", "Pending", "Critical", "Investigating", "Resolved", "Degraded").
- Card: { type: "Card", title: string, subtitle?: string, content?: unknown[], footer?: unknown[] }
  NOTE: Card title is primary (semibold, larger); subtitle is secondary description.
- Grid: { type: "Grid", columns?: 1 | 2 | 3 | 4, gap?: 2 | 3 | 4 | 6, items: unknown[] }
- ButtonAction: { type: "ButtonAction", label: string, variant?: "default" | "outline" | "secondary" | "ghost", icon?: "arrow-right" | "save" | "play" | "plus" | "search" }

Architectural Rules:
1. Top-level layout typically starts with a Header.
2. Below the Header, use a Grid (columns: 3 or 4) containing at most 3-4 numeric Statistic KPIs.
3. For lists of records (e.g. incidents, orders, users, tickets), always render a DataTable with a "status" column typed as "badge".
4. Output must be a direct JSON array, e.g. [{ type: "Header", ... }, { type: "Grid", ... }, { type: "DataTable", ... }]`;

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

    // 4. Initialize Multi-Provider Fallback (Gemini Primary -> Backup Keys)
    const geminiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
    ].filter(Boolean) as string[];

    const models: import("ai").LanguageModel[] = [];
    
    // Append Gemini providers (gemini-2.5-flash is verified active & sub-second fast)
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
        const encoder = new TextEncoder();

        for (const activeModel of models) {
          try {
            const responseResult = streamText({
              model: activeModel,
              system: SYSTEM_PROMPT,
              prompt: prompt,
              temperature: 0.1,
            });

            let streamTextAccumulator = "";

            for await (const textChunk of responseResult.textStream) {
              controller.enqueue(encoder.encode(textChunk));
              streamTextAccumulator += textChunk;
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
