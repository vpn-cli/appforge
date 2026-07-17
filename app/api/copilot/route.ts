import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { rateLimit } from "@/lib/rate-limit";

const SYSTEM_PROMPT = `
You are the AppForge AI Copilot. Your role is to translate user natural language requests directly into a valid AppForge JSON configuration array.

The AppForge deterministic engine parses JSON dynamically. You can ONLY use the following components and schemas:

1. "Header"
   Props: title (string), subtitle (string), size ("sm" | "md" | "lg")
2. "ButtonAction"
   Props: label (string), variant ("default" | "outline" | "secondary" | "ghost"), icon (string: "arrow-right", "save", "play", "plus", "search")
3. "Card"
   Props: title (string), subtitle (string), content (array of components), footer (array of components)
4. "Grid"
   Props: columns (number 1-4), gap (number 2, 4, 6, 8), items (array of components)

RULES:
- Return ONLY valid JSON array representing the "components" block.
- Do NOT output markdown code blocks (e.g., no \`\`\`json). Just the raw array.
- Compose components recursively (e.g. Grids contain Cards, Cards contain Headers/Buttons).

Example Output:
[
  {
    "type": "Header",
    "title": "Welcome User",
    "size": "lg"
  },
  {
    "type": "Grid",
    "columns": 2,
    "items": [
      {
        "type": "Card",
        "title": "Analytics",
        "content": [
          { "type": "ButtonAction", "label": "View Report", "icon": "search" }
        ]
      }
    ]
  }
]
`;

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

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not defined in environment variables." }, { status: 500 });
    }

    // Initialize the new Google GenAI SDK
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Use generateContentStream instead for real-time output
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.1, // Keep it highly deterministic
      },
    });

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
