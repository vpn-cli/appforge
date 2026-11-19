import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { TrendChartSchema, validateComponentNode } from "@/lib/validation";
import { TrendChart } from "@/registry/components/TrendChart";
import { ComponentRegistry, RenderNode } from "@/registry";
import { DemoCodeCard } from "@/components/home/DemoCodeCard";
import { DemoPreviewCard } from "@/components/home/DemoPreviewCard";

describe("TrendChart Component & Schema Verification", () => {
  it("schema accepts a valid TrendChart config", () => {
    const validConfig = {
      type: "TrendChart" as const,
      title: "Workflow executions",
      caption: "Recorded in current billing cycle",
      value: 14200,
      valueSuffix: " runs",
      decimals: 0,
      updatedText: "Sample data",
      trend: "up" as const,
      period: "Monthly" as const,
      periods: ["Weekly", "Monthly", "Yearly"],
      data: [95, 112, 150, 339, 384, 400],
      labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6"],
      accent: "#6D5BF0",
      width: 380,
      loop: 0,
      backdrop: false,
    };

    const result = TrendChartSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("TrendChart");
      expect(result.data.title).toBe("Workflow executions");
      expect(result.data.value).toBe(14200);
      expect(result.data.period).toBe("Monthly");
    }

    const nodeValidation = validateComponentNode(validConfig);
    expect(nodeValidation.valid).toBe(true);
    expect(nodeValidation.issues).toBeUndefined();
  });

  it("schema strictly rejects unknown keys (no passthrough)", () => {
    const invalidConfig = {
      type: "TrendChart" as const,
      title: "Workflow executions",
      value: 14200,
      unknownSlopField: "disallowed_value",
      maliciousPayload: { injection: true },
    };

    const result = TrendChartSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issueKeys = result.error.issues.flatMap((i) =>
        (i as any).keys ? ((i as any).keys as string[]) : [i.path.join(".")]
      );
      expect(issueKeys).toContain("unknownSlopField");
      expect(issueKeys).toContain("maliciousPayload");
    }

    const nodeValidation = validateComponentNode(invalidConfig);
    expect(nodeValidation.valid).toBe(false);
    expect(nodeValidation.issues).toBeDefined();
    expect(
      nodeValidation.issues?.some((i) => i.path.includes("unknownSlopField"))
    ).toBe(true);
  });

  it("is properly registered in ComponentRegistry and rendered via RenderNode", () => {
    expect(ComponentRegistry.TrendChart).toBeDefined();

    const config = {
      type: "TrendChart",
      title: "Workflow executions",
      value: 14200,
      valueSuffix: " runs",
      updatedText: "Sample data",
    };

    const html = renderToString(<RenderNode config={config} />);
    expect(html).toContain("data-testid=\"trend-chart-container\"");
  });

  it("satisfies mandatory component states (loading, empty, error, loaded)", () => {
    // 1. Loading state (static placeholder, zero layout shift)
    const loadingHtml = renderToString(
      <TrendChart state="loading" width={380} />
    );
    expect(loadingHtml).toContain('role="status"');
    expect(loadingHtml).toContain("Trend chart preview");

    // 2. Empty state
    const emptyHtml = renderToString(
      <TrendChart state="empty" data={[]} width={380} />
    );
    expect(emptyHtml).toContain("No data points recorded");

    // 3. Error state
    const errorHtml = renderToString(
      <TrendChart state="error" errorMessage="Network gateway failure" width={380} />
    );
    expect(errorHtml).toContain('role="alert"');
    expect(errorHtml).toContain("Failed to load trend chart");
    expect(errorHtml).toContain("Network gateway failure");
    expect(errorHtml).toContain("Retry");

    // 4. Loaded state
    const loadedHtml = renderToString(
      <TrendChart
        state="loaded"
        title="Active jobs"
        value={1200}
        valueSuffix=" jobs"
        updatedText="Sample data"
      />
    );
    expect(loadedHtml).toContain("trend-chart-container");
  });

  it("verifies equal-height structure: both hero cards use h-auto lg:h-full and matching chrome heights", () => {
    const codeCardHtml = renderToString(<DemoCodeCard />);
    const previewCardHtml = renderToString(<DemoPreviewCard />);

    // Both cards use the exact same root flex container classes
    expect(codeCardHtml).toContain("glass-1 rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-auto lg:h-full");
    expect(previewCardHtml).toContain("glass-1 rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-auto lg:h-full");

    // Both cards have matching 44px header bar (h-11)
    expect(codeCardHtml).toContain("h-11 flex items-center justify-between");
    expect(previewCardHtml).toContain("h-11 flex items-center justify-between");

    // Both cards have matching 36px footer bar (h-9)
    expect(codeCardHtml).toContain("h-9 pt-2.5 border-t border-border");
    expect(previewCardHtml).toContain("h-9 pt-2.5 border-t border-border");
  });
});
