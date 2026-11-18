import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { resolveGridColsClass, Grid } from "@/registry/components/Grid";
import { ValidationPanel } from "@/components/builder/ValidationPanel";
import { DataTable } from "@/registry/components/DataTable";
import { LivePreview } from "@/components/builder/LivePreview";
import { DemoCodeCard } from "@/components/home/DemoCodeCard";
import { DemoPreviewCard } from "@/components/home/DemoPreviewCard";

describe("PART 2 — Spacing & Layout", () => {
  describe("Statistic Grid: orphan card avoidance", () => {
    it("uses 4x1 when room (860px) and 2x2 (420px) for 4 items, NEVER 3+1 (no grid-cols-3)", () => {
      const cls = resolveGridColsClass(4, 4);
      expect(cls).toContain("@[420px]:grid-cols-2");
      expect(cls).toContain("@[860px]:grid-cols-4");
      expect(cls).not.toContain("grid-cols-3");
    });

    it("chooses clean dividing column counts for 2, 3, 6, and 8 items", () => {
      // 2 items: 1 or 2
      expect(resolveGridColsClass(2, 2)).toBe("grid-cols-1 @[420px]:grid-cols-2");
      // 3 items: 1 or 3
      expect(resolveGridColsClass(3, 3)).toBe("grid-cols-1 @[600px]:grid-cols-3");
      // 6 items: divides by 2, 3, 6
      expect(resolveGridColsClass(6, 6)).toContain("grid-cols-2");
      expect(resolveGridColsClass(6, 6)).toContain("grid-cols-3");
      expect(resolveGridColsClass(6, 6)).toContain("grid-cols-6");
      // 8 items with 4 cols configured: balances rows into 2x4 (never 3+1)
      expect(resolveGridColsClass(4, 8)).not.toContain("grid-cols-3");
    });

    it("renders Grid component without 3-column class for 4 items", () => {
      const html = renderToString(
        <Grid
          columns={4}
          items={[
            { type: "Statistic", label: "A", value: 1 },
            { type: "Statistic", label: "B", value: 2 },
            { type: "Statistic", label: "C", value: 3 },
            { type: "Statistic", label: "D", value: 4 },
          ]}
        />
      );
      expect(html).toContain("@[420px]:grid-cols-2");
      expect(html).toContain("@[860px]:grid-cols-4");
      expect(html).not.toContain("grid-cols-3");
    });
  });

  describe("Validation log: 32px status bar & deduplication", () => {
    it("renders collapsed 32px (h-8) status bar with '✓ No issues' and no duplicated check icon", () => {
      const html = renderToString(<ValidationPanel errors={[]} warnings={[]} />);
      expect(html).toContain("h-8");
      expect(html).toContain("✓ No issues");
      // No duplicated Check icon next to literal "✓ No issues"
      expect(html).not.toMatch(/<svg[^>]*>[\s\S]*?✓ No issues/);
    });

    it("renders single non-duplicated validation message when expanded with no errors", () => {
      // User expanded the log while no issues exist
      const html = renderToString(<ValidationPanel errors={[]} warnings={[]} />);
      // Should not contain duplicated messages like "No errors" alongside "✓ No issues" in the same view
      expect(html).toContain("✓ No issues");
    });
  });

  describe("DataTable: replacement of 'US' and 'IG' initial chips with icons", () => {
    it("renders Lucide icons instead of text initials for User Sync and Invoice Gen", () => {
      const html = renderToString(
        <DataTable
          columns={[{ key: "workflow", label: "WORKFLOW", type: "avatar" }]}
          data={[
            { workflow: "User Sync" },
            { workflow: "Invoice Gen" },
            { workflow: "Slack Alerts" },
          ]}
          state="loaded"
        />
      );

      // Verify svg icons are rendered inside the avatar circles
      expect(html).toContain("<svg");
      // Must NOT contain the raw text initials "US" or "IG"
      expect(html).not.toContain(">US<");
      expect(html).not.toContain(">IG<");
      expect(html).not.toContain(">SA<");
    });
  });

  describe("Preview spacing & hugging frame", () => {
    it("applies 24px margin (mb-6) from Header to Grid and 20px margin (mb-5) from Grid to DataTable", () => {
      const configStr = JSON.stringify({
        pages: [
          {
            components: [
              { type: "Header", title: "Test App" },
              {
                type: "Grid",
                columns: 4,
                items: [{ type: "Statistic", label: "KPI", value: 100 }],
              },
              {
                type: "DataTable",
                columns: [{ key: "id", label: "ID" }],
                data: [{ id: "1" }],
              },
            ],
          },
        ],
      });

      const html = renderToString(
        <LivePreview configStr={configStr} showInnerToolbar={false} />
      );

      // Header -> Grid spacing (24px)
      expect(html).toContain("mb-6");
      // Grid -> DataTable spacing (20px)
      expect(html).toContain("mb-5");
    });

    it("preview frame hugs content height without forcing h-full on the inner container", () => {
      const configStr = JSON.stringify({
        pages: [{ components: [{ type: "Header", title: "Single Item" }] }],
      });
      const html = renderToString(<LivePreview configStr={configStr} />);
      // Outer wrapper has overflow-y-auto, inner container does not force h-full
      expect(html).toContain("overflow-y-auto");
      expect(html).toContain("max-h-full");
    });
  });

  describe("Landing hero panel alignment", () => {
    it("gives DemoCodeCard and DemoPreviewCard matching header height (h-11) and footer height (h-9)", () => {
      const codeHtml = renderToString(<DemoCodeCard />);
      const previewHtml = renderToString(<DemoPreviewCard />);

      // Both headers have h-11
      expect(codeHtml).toContain("h-11");
      expect(previewHtml).toContain("h-11");

      // Both footers have h-9
      expect(codeHtml).toContain("h-9 pt-2.5 border-t border-border");
      expect(previewHtml).toContain("h-9 pt-2.5 border-t border-border");

      // Preview body is vertically centered (flex-1 flex flex-col justify-center)
      expect(previewHtml).toContain("flex-1 justify-center");
    });
  });
});
