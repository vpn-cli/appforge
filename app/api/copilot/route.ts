import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { rateLimit } from "@/lib/rate-limit";
import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Redis } from "@upstash/redis";
import { normalizePromptForCache } from "@/lib/validation";
import { createCopilotStream, CopilotProvider } from "@/lib/copilot-pipeline";
import { COPILOT_SYSTEM_PROMPT } from "@/lib/copilot-prompt";

const redisClient =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

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
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }

    // 3. Extract parameters
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // --- Normalized Upstash Cache Lookup ---
    const normalizedKey = `copilot_cache:${normalizePromptForCache(prompt)}`;

    if (redisClient) {
      try {
        const cachedResponse = await redisClient.get(normalizedKey);
        if (cachedResponse) {
          console.log(`[Copilot Cache] HIT for normalized prompt: "${normalizedKey}"`);
          const stream = new ReadableStream({
            start(controller) {
              const textOutput =
                typeof cachedResponse === "string"
                  ? cachedResponse
                  : JSON.stringify(cachedResponse);
              controller.enqueue(new TextEncoder().encode(textOutput));
              controller.close();
            },
          });
          return new Response(stream, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }
      } catch (err) {
        console.error("[Copilot Cache Error] Failed to read from Redis:", err);
      }
    }

    // 4. Build Provider List: Groq as Primary, Gemini as Fallback
    const providers: CopilotProvider[] = [];

    // Primary: Groq LPU
    const rawGroqKey = process.env.GROQ_API_KEY || "";
    const cleanGroqKey = rawGroqKey.trim().replace(/^["']|["']$/g, "");
    if (cleanGroqKey) {
      const groqProvider = createGroq({ apiKey: cleanGroqKey });
      const groqModelName = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
      providers.push({
        name: `Groq (${groqModelName})`,
        model: groqProvider(groqModelName),
      });
    }

    // Fallback: Gemini Providers
    const geminiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
    ]
      .map((k) => (k || "").trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);

    for (let i = 0; i < geminiKeys.length; i++) {
      const googleProvider = createGoogleGenerativeAI({ apiKey: geminiKeys[i] });
      providers.push({
        name: `Gemini (gemini-2.5-flash key ${i + 1})`,
        model: googleProvider("gemini-2.5-flash"),
      });
    }

    if (providers.length === 0) {
      return NextResponse.json({ error: "No AI API Keys are configured." }, { status: 500 });
    }

    // 5. Execute Multi-Provider Pipeline (Groq Primary -> Gemini Fallback; Failover ONLY before first chunk)
    const stream = createCopilotStream({
      prompt,
      providers,
      systemPrompt: COPILOT_SYSTEM_PROMPT,
      temperature: 0.1,
      onCacheSet: async (key, val) => {
        if (redisClient) {
          // 7-day TTL (604,800 seconds)
          await redisClient.set(key, val, { ex: 604800 }).catch(console.error);
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: unknown) {
    console.error("[Copilot API Error]", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
