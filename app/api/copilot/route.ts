import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

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
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not defined in environment variables." }, { status: 500 });
    }

    // Initialize the new Google GenAI SDK
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Ensure we use flash for fast latency
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.1, // Keep it highly deterministic
      },
    });

    let jsonString = response.text || "[]";
    
    // Strip markdown formatting if the AI ignores our rule
    if (jsonString.startsWith("\`\`\`json")) {
        jsonString = jsonString.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    }
    if (jsonString.startsWith("\`\`\`")) {
        jsonString = jsonString.replace(/\`\`\`/g, "").trim();
    }

    // Validate if it parses safely
    let parsedArray = [];
    try {
       parsedArray = JSON.parse(jsonString);
    } catch (e: any) {
       console.error("AI returned malformed JSON:", jsonString);
       return NextResponse.json({ error: "AI output syntax error." }, { status: 500 });
    }

    return NextResponse.json({ components: parsedArray }, { status: 200 });

  } catch (error: any) {
    console.error("[Copilot API Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
