import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { DataTable } from "@/registry/components/DataTable";
import { resolveStatusColor, type StatusColorTone } from "@/lib/status-colors";
import { DataTableSchema, validateComponentNode } from "@/lib/validation";
import { PROMPT_VERSION, COPILOT_SYSTEM_PROMPT } from "@/lib/copilot-prompt";

describe("PART 1 — DataTable Status Colors", () => {
  describe("DataTableSchema validation", () => {
    it("accepts type: 'status' columns with an explicit colors map across all 6 tones", () => {
      const node = {
        type: "DataTable",
        columns: [
          { key: "name", label: "Name", type: "text" },
          {
            key: "status",
            label: "Status",
            type: "status",
            colors: {
              Live: "success",
              Canary: "warning",
              Halted: "danger",
              Queued: "info",
              Archived: "neutral",
              Experimental: "violet",
            },
          },
        ],
        data: [{ name: "Worker A", status: "Live" }],
      };

      expect(DataTableSchema.safeParse(node).success).toBe(true);
      expect(validateComponentNode(node).valid).toBe(true);
    });

    it("accepts type: 'status' columns without an explicit colors map", () => {
      const node = {
        type: "DataTable",
        columns: [{ key: "status", label: "Status", type: "status" }],
        data: [{ status: "Running" }],
      };

      expect(validateComponentNode(node).valid).toBe(true);
    });

    it("preprocesses color aliases like 'green' and never invalidates DataTable on unknown tones like 'sparkly'", () => {
      const node = {
        type: "DataTable",
        columns: [
          {
            key: "status",
            label: "Status",
            type: "status",
            colors: {
              Strong: "green",
              Weak: "red",
              Balanced: "amber",
              Caution: "yellow",
              Escalating: "orange",
              Scheduled: "blue",
              Archived: "gray",
              Muted: "grey",
              Legendary: "purple",
              Glitter: "sparkly",
            },
          },
        ],
        data: [
          { status: "Strong" },
          { status: "Glitter" },
        ],
      };

      const check = validateComponentNode(node);
      expect(check.valid).toBe(true);
      expect(check.data.columns[0].colors).toEqual({
        Strong: "success",
        Weak: "danger",
        Balanced: "warning",
        Caution: "warning",
        Escalating: "warning",
        Scheduled: "info",
        Archived: "neutral",
        Muted: "neutral",
        Legendary: "violet",
      });
    });
  });

  describe("Resolution path 1: explicit colors map from config", () => {
    it("prioritizes explicit colors map over built-in keywords", () => {
      const explicitColors: Record<string, StatusColorTone> = {
        Running: "violet",
        Failed: "info",
        Pending: "neutral",
      };

      expect(resolveStatusColor("Running", explicitColors)).toBe("violet");
      expect(resolveStatusColor("Failed", explicitColors)).toBe("info");
      expect(resolveStatusColor("Pending", explicitColors)).toBe("neutral");
    });

    it("matches explicit colors map keys case-insensitively and for custom statuses", () => {
      const explicitColors: Record<string, StatusColorTone> = {
        "Tier 1": "danger",
        canary: "warning",
        Beta: "violet",
      };

      expect(resolveStatusColor("Tier 1", explicitColors)).toBe("danger");
      expect(resolveStatusColor("tier 1", explicitColors)).toBe("danger");
      expect(resolveStatusColor("CANARY", explicitColors)).toBe("warning");
      expect(resolveStatusColor("beta", explicitColors)).toBe("violet");
    });

    it("preprocesses color aliases (green, red, yellow/amber/orange, blue, gray/grey, purple) in explicit colors", () => {
      const aliasColors: Record<string, string> = {
        Go: "green",
        Stop: "RED",
        Slow: "yellow",
        Warm: "amber",
        Hot: "orange",
        Cold: "blue",
        Flat: "gray",
        Dim: "grey",
        Special: "purple",
      };

      expect(resolveStatusColor("Go", aliasColors)).toBe("success");
      expect(resolveStatusColor("Stop", aliasColors)).toBe("danger");
      expect(resolveStatusColor("Slow", aliasColors)).toBe("warning");
      expect(resolveStatusColor("Warm", aliasColors)).toBe("warning");
      expect(resolveStatusColor("Hot", aliasColors)).toBe("warning");
      expect(resolveStatusColor("Cold", aliasColors)).toBe("info");
      expect(resolveStatusColor("Flat", aliasColors)).toBe("neutral");
      expect(resolveStatusColor("Dim", aliasColors)).toBe("neutral");
      expect(resolveStatusColor("Special", aliasColors)).toBe("violet");
    });

    it("falls back to keyword or stable hash resolution when explicit tone is unrecognized (e.g. 'sparkly')", () => {
      // Built-in keyword with bad explicit tone -> falls back to keyword map ("success")
      expect(resolveStatusColor("Active", { Active: "sparkly" })).toBe("success");
      expect(resolveStatusColor("Weak", { Weak: "sparkly" })).toBe("danger");

      // Unknown status with bad explicit tone -> falls back to stable hash (neutral or violet)
      const expectedHashTone = resolveStatusColor("Mystic");
      expect(["neutral", "violet"]).toContain(expectedHashTone);
      expect(resolveStatusColor("Mystic", { Mystic: "sparkly" })).toBe(expectedHashTone);
    });
  });

  describe("Resolution path 2: built-in case-insensitive keyword map", () => {
    const keywordExpectations: Array<[StatusColorTone, string[]]> = [
      [
        "success",
        [
          "running",
          "active",
          "completed",
          "done",
          "resolved",
          "published",
          "strong",
          "healthy",
          "good",
        ],
      ],
      ["warning", ["pending", "review", "degraded", "balanced", "warning"]],
      ["danger", ["failed", "error", "critical", "weak", "blocked", "overdue"]],
      ["info", ["idle", "draft", "new", "scheduled", "upcoming"]],
    ];

    for (const [expectedTone, keywords] of keywordExpectations) {
      it(`maps all built-in '${expectedTone}' keywords case-insensitively`, () => {
        for (const keyword of keywords) {
          expect(resolveStatusColor(keyword)).toBe(expectedTone);
          expect(resolveStatusColor(keyword.toUpperCase())).toBe(expectedTone);
          const titleCase = keyword.charAt(0).toUpperCase() + keyword.slice(1);
          expect(resolveStatusColor(`  ${titleCase}  `)).toBe(expectedTone);
        }
      });
    }
  });

  describe("Resolution path 3: stable hash fallback into neutral or violet", () => {
    const unknownStatuses = [
      "Archived",
      "Quarantined",
      "Escalated",
      "Backlog",
      "Triaged",
      "Paused",
      "Snoozed",
      "CustomPhaseAlpha",
      "CustomPhaseBeta",
      "CustomPhaseGamma",
    ];

    it("maps unknown values strictly to neutral or violet deterministically", () => {
      const observed = new Set<StatusColorTone>();

      for (const value of unknownStatuses) {
        const first = resolveStatusColor(value);
        const second = resolveStatusColor(value);
        const upper = resolveStatusColor(value.toUpperCase());

        expect(["neutral", "violet"]).toContain(first);
        expect(second).toBe(first);
        expect(upper).toBe(first);
        observed.add(first);
      }

      // Hash distributes across both neutral and violet
      expect(observed.has("neutral")).toBe(true);
      expect(observed.has("violet")).toBe(true);
    });
  });

  describe("DataTable rendered status pill styling", () => {
    it("renders palette-token pills with 6px dots across all 3 resolution paths", () => {
      const html = renderToString(
        <DataTable
          columns={[
            { key: "name", label: "Service", type: "text" },
            {
              key: "status",
              label: "Status",
              type: "status",
              colors: { Canary: "violet" },
            },
          ]}
          data={[
            { name: "Edge Proxy", status: "Canary" }, // path 1: explicit violet
            { name: "Auth Worker", status: "Healthy" }, // path 2: built-in success
            { name: "Legacy Sync", status: "Archived" }, // path 3: hash neutral/violet
          ]}
          state="loaded"
        />
      );

      // Path 1: explicit violet
      expect(html).toContain('data-status-tone="violet"');
      expect(html).toContain("bg-status-violet-bg");
      expect(html).toContain("text-status-violet-text");
      expect(html).toContain("bg-[var(--status-violet-dot)]");

      // Path 2: built-in success
      expect(html).toContain('data-status-tone="success"');
      expect(html).toContain("bg-status-success-bg");
      expect(html).toContain("text-status-success-text");
      expect(html).toContain("bg-[var(--status-success-dot)]");

      // Path 3: stable hash tone for "Archived"
      const archivedTone = resolveStatusColor("Archived");
      expect(html).toContain(`data-status-tone="${archivedTone}"`);
      expect(html).toContain(`bg-status-${archivedTone}-bg`);

      // 6px dot (w-1.5 h-1.5)
      expect(html).toContain("w-1.5 h-1.5 rounded-full shrink-0");
    });
  });

  describe("Copilot system prompt & PROMPT_VERSION", () => {
    it("bumps PROMPT_VERSION and instructs Copilot to emit type: 'status' with colors map", () => {
      expect(PROMPT_VERSION).toBe("v1.3.0");
      expect(COPILOT_SYSTEM_PROMPT).toContain('type: "status"');
      expect(COPILOT_SYSTEM_PROMPT).toContain("colors");
    });
  });
});
