/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mock for ai.streamText
const mockStreamTextFn = vi.fn();
vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    streamText: (...args: any[]) => mockStreamTextFn(...args),
  };
});

import {
  normalizePromptForCache,
  validateComponentNode,
  HeaderSchema,
  StatisticSchema,
  DataTableSchema,
  CardSchema,
  GridSchema,
  ButtonActionSchema,
} from "@/lib/validation";
import { createCopilotStream, CopilotProvider } from "@/lib/copilot-pipeline";

describe("PHASE 2 — Copilot Pipeline & Failover Hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. Cache Key Normalization Tests
  // =========================================================================
  describe("Cache Key Normalization", () => {
    it("collapses internal whitespace, tabs, and newlines into a single space", () => {
      const input = "Create   a\n\tdashboard   for\r\n\tsales";
      expect(normalizePromptForCache(input)).toBe("create a dashboard for sales");
    });

    it("strips trailing punctuation (.?!,;:)", () => {
      expect(normalizePromptForCache("Build an admin panel???")).toBe("build an admin panel");
      expect(normalizePromptForCache("Build an admin panel.")).toBe("build an admin panel");
      expect(normalizePromptForCache("Build an admin panel!!!")).toBe("build an admin panel");
      expect(normalizePromptForCache("Build an admin panel,;:.")).toBe("build an admin panel");
    });

    it("normalizes diverse user inputs to identical cache keys", () => {
      const p1 = "  Generate a CRM app with contacts and deals!  ";
      const p2 = "generate a CRM app with contacts and deals";
      const p3 = "generate\ta   crm app\nwith contacts and deals.";
      const key1 = normalizePromptForCache(p1);
      const key2 = normalizePromptForCache(p2);
      const key3 = normalizePromptForCache(p3);

      expect(key1).toBe("generate a crm app with contacts and deals");
      expect(key1).toBe(key2);
      expect(key2).toBe(key3);
    });

    it("handles empty and non-string gracefully", () => {
      expect(normalizePromptForCache("")).toBe("");
      expect(normalizePromptForCache("   ")).toBe("");
    });
  });

  // =========================================================================
  // 2. Per-Component Zod Schemas
  // =========================================================================
  describe("Per-Component Zod Schemas & Fallback Verification", () => {
    it("validates valid Header node", () => {
      const valid = { type: "Header", title: "Overview", subtitle: "Metrics", size: "lg" };
      expect(HeaderSchema.safeParse(valid).success).toBe(true);
      const check = validateComponentNode(valid);
      expect(check.valid).toBe(true);
    });

    it("rejects invalid Header size enum", () => {
      const invalid = { type: "Header", title: "Overview", size: "extra-large" };
      const check = validateComponentNode(invalid);
      expect(check.valid).toBe(false);
      expect(check.issues?.[0].path).toBe("size");
    });

    it("validates valid Statistic node with both object and string trends", () => {
      const s1 = { type: "Statistic", label: "ARR", value: "$4.2M", trend: "up", trendValue: "+12%" };
      const s2 = {
        type: "Statistic",
        label: "Churn",
        value: "1.2%",
        trend: { value: "-0.4%", label: "MoM", sentiment: "positive" },
      };
      expect(StatisticSchema.safeParse(s1).success).toBe(true);
      expect(StatisticSchema.safeParse(s2).success).toBe(true);
    });

    it("validates valid DataTable with structured columns and data records", () => {
      const valid = {
        type: "DataTable",
        columns: [
          { key: "id", label: "ID", type: "id" },
          { key: "name", label: "Customer", type: "text" },
          { key: "status", label: "Status", type: "badge" },
        ],
        data: [{ id: "1", name: "Acme", status: "Active" }],
      };
      const check = validateComponentNode(valid);
      expect(check.valid).toBe(true);
    });

    it("validates Card with nested components and ButtonAction", () => {
      const valid = {
        type: "Card",
        title: "Quick Actions",
        content: [
          { type: "ButtonAction", label: "Create Invoice", variant: "default", icon: "plus" },
        ],
      };
      const check = validateComponentNode(valid);
      expect(check.valid).toBe(true);
    });

    it("rejects unknown component types with descriptive issue", () => {
      const invalid = { type: "SuperFancyCustomCarousel3D", data: [] };
      const check = validateComponentNode(invalid);
      expect(check.valid).toBe(false);
      expect(check.issues?.[0].message).toContain("Unknown component type");
    });
  });

  // =========================================================================
  // 3. Multi-Provider Streaming & Failover Only Before First Chunk
  // =========================================================================
  describe("Streaming Pipeline Failover Semantics", () => {
    it("fails over to secondary provider when primary fails BEFORE the first chunk is sent", async () => {
      // Provider 1 fails immediately before yielding any chunks
      mockStreamTextFn.mockImplementationOnce(() => {
        return {
          textStream: {
            [Symbol.asyncIterator]() {
              return {
                async next() {
                  throw new Error("Groq 429: Rate limit exceeded");
                },
              };
            },
          },
        };
      });

      // Provider 2 succeeds
      mockStreamTextFn.mockImplementationOnce(() => {
        const chunks = ['[{"type":', '"Header",', '"title":"Recovered"}]'];
        let idx = 0;
        return {
          textStream: {
            [Symbol.asyncIterator]() {
              return {
                async next() {
                  if (idx < chunks.length) {
                    return { done: false, value: chunks[idx++] };
                  }
                  return { done: true, value: undefined };
                },
              };
            },
          },
        };
      });

      const providers: CopilotProvider[] = [
        { name: "Groq Primary", model: {} as any },
        { name: "Gemini Fallback", model: {} as any },
      ];

      const failoverSpy = vi.fn();

      const stream = createCopilotStream(
        {
          prompt: "build dashboard",
          providers,
          systemPrompt: "sys",
        },
        { onFailover: failoverSpy }
      );

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value);
      }

      // Verifies fallback provider received the call and produced output
      expect(failoverSpy).toHaveBeenCalledTimes(1);
      expect(failoverSpy).toHaveBeenCalledWith(
        "Groq Primary",
        "Gemini Fallback",
        expect.any(Error)
      );
      expect(accumulated).toBe('[{"type":"Header","title":"Recovered"}]');
      expect(mockStreamTextFn).toHaveBeenCalledTimes(2);
    });

    it("STRICTLY TERMINATES with clean terminal error on MID-STREAM failure (NEVER fails over, NEVER concatenates)", async () => {
      // Provider 1 yields chunk 1, then crashes on chunk 2 mid-stream
      mockStreamTextFn.mockImplementationOnce(() => {
        let callCount = 0;
        return {
          textStream: {
            [Symbol.asyncIterator]() {
              return {
                async next() {
                  callCount++;
                  if (callCount === 1) {
                    return { done: false, value: '[{"type":"Header"' };
                  }
                  throw new Error("Groq Mid-Stream Connection Reset");
                },
              };
            },
          },
        };
      });

      // Provider 2 should NEVER be called!
      const provider2Model = {} as any;
      const providers: CopilotProvider[] = [
        { name: "Groq Primary", model: {} as any },
        { name: "Gemini Fallback", model: provider2Model },
      ];

      const failoverSpy = vi.fn();
      const midStreamErrorSpy = vi.fn();

      const stream = createCopilotStream(
        {
          prompt: "build analytics",
          providers,
          systemPrompt: "sys",
        },
        {
          onFailover: failoverSpy,
          onMidStreamError: midStreamErrorSpy,
        }
      );

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let firstChunkReceived = "";
      let caughtTerminalError: Error | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          firstChunkReceived += decoder.decode(value);
        }
      } catch (err: any) {
        caughtTerminalError = err;
      }

      // 1. Client received the first chunk before the mid-stream drop
      expect(firstChunkReceived).toBe('[{"type":"Header"');

      // 2. Mid-stream error callback was triggered
      expect(midStreamErrorSpy).toHaveBeenCalledWith(
        "Groq Primary",
        expect.objectContaining({ message: "Groq Mid-Stream Connection Reset" })
      );

      // 3. Failover was NEVER invoked!
      expect(failoverSpy).not.toHaveBeenCalled();

      // 4. Stream terminated with clean terminal error
      expect(caughtTerminalError).toBeDefined();
      expect(caughtTerminalError?.message).toContain("Stream failed mid-way on Groq Primary");

      // 5. streamText was called exactly ONCE (never attempted Provider 2)
      expect(mockStreamTextFn).toHaveBeenCalledTimes(1);
    });
  });
});
