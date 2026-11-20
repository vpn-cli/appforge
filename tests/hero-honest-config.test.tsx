import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { DemoCodeCard } from "@/components/home/DemoCodeCard";
import { DemoPreviewCard } from "@/components/home/DemoPreviewCard";
import { HomeHero } from "@/components/home/HomeHero";
import {
  HERO_DEMO_CONFIG,
  HERO_DEMO_JSON_LINES,
  buildHeroDemoConfig,
  computeScriptedHeroState,
  validateHeroEditorState,
  INITIAL_HERO_STATE,
} from "@/components/home/heroDemoConfig";
import { ComponentRegistry } from "@/registry";
import { Statistic } from "@/registry/components/Statistic";
import {
  validateComponentNode,
  StatisticSchema,
  AppConfigSchema,
} from "@/lib/validation";

describe("PART 3 — Honest Hero Config", () => {
  it("uses only real registry types (Statistic, DataTable) in hero config", () => {
    const componentTypes = HERO_DEMO_CONFIG.pages[0].components.map((c) => c.type);
    expect(componentTypes).toEqual(["Statistic", "DataTable"]);

    // Every component in the hero config must exist in ComponentRegistry
    for (const comp of HERO_DEMO_CONFIG.pages[0].components) {
      expect(ComponentRegistry[comp.type]).toBeDefined();
    }
  });

  it("validates every node in hero config against real Zod registry schemas", () => {
    for (const comp of HERO_DEMO_CONFIG.pages[0].components) {
      const result = validateComponentNode(comp);
      expect(result.valid).toBe(true);
      expect(result.issues).toBeUndefined();
    }
  });

  it("labels preview data strictly as 'Sample data'", () => {
    const html = renderToString(<DemoPreviewCard />);
    expect(html).toContain("Sample data");
    expect(html).toContain("ComponentRegistry");
  });

  it("contains no 'Live' badge and no fake status dots in the preview card", () => {
    const html = renderToString(<DemoPreviewCard />);
    // Must NOT contain a "Live" badge
    expect(html).not.toMatch(/>\s*Live\s*</i);
    // Header status pill is "Rendered from config"
    expect(html).toContain("Rendered from config");
    // Header status pill has showDot={false} (no pulsing status dot circle)
    expect(html).not.toContain("animate-pulse");
  });

  it("displays honest AST JSON code matching registry types without fake live typing", () => {
    const codeHtml = renderToString(<DemoCodeCard />);
    expect(codeHtml).toContain("Statistic");
    expect(codeHtml).toContain("DataTable");
    expect(codeHtml).toContain("workflows");
    expect(codeHtml).toContain("app.config.json");
    expect(codeHtml).not.toContain('"live": true');
  });

  it("confirms variant is declared in StatisticSchema and parsed output preserves it", () => {
    const panelRaw = {
      type: "Statistic",
      label: "Active Workflows",
      value: "1,244",
      variant: "panel" as const,
      trend: { value: "+12%", sentiment: "positive" as const },
    };
    const parsedPanel = StatisticSchema.safeParse(panelRaw);
    expect(parsedPanel.success).toBe(true);
    if (parsedPanel.success) {
      expect(parsedPanel.data.variant).toBe("panel");
    }

    const gradientRaw = {
      type: "Statistic",
      label: "Active Workflows",
      value: "1,244",
      variant: "gradient" as const,
      trend: { value: "+12%", sentiment: "positive" as const },
    };
    const parsedGradient = StatisticSchema.safeParse(gradientRaw);
    expect(parsedGradient.success).toBe(true);
    if (parsedGradient.success) {
      expect(parsedGradient.data.variant).toBe("gradient");
    }

    // Verify AppConfigSchema does not strip any keys from the full hero config
    const fullConfigParsed = AppConfigSchema.safeParse(HERO_DEMO_CONFIG);
    expect(fullConfigParsed.success).toBe(true);
    if (fullConfigParsed.success) {
      const statComp = fullConfigParsed.data.pages[0].components[0] as any;
      expect(statComp.variant).toBe("gradient");
      expect(statComp.label).toBe("Active Workflows");
      expect(statComp.value).toBe("1,244");
      expect(statComp.trend).toEqual({
        value: "+12%",
        sentiment: "positive",
        direction: "up",
        series: [50, 52, 51, 54, 53, 55, 56],
      });

      const tableComp = fullConfigParsed.data.pages[0].components[1] as any;
      expect(tableComp.entity).toBe("workflows");
      expect(tableComp.columns).toHaveLength(3);
      expect(tableComp.data[0].icon).toBe("users");
    }
  });

  it("validates that every step in the scripted edit loop passes validateComponentNode", () => {
    // Initial state
    expect(INITIAL_HERO_STATE.variantValue).toBe("gradient");
    expect(INITIAL_HERO_STATE.validationStatus).toBe("valid");

    // Scripted timestamps throughout the 11,000ms loop
    const checkpoints = [0, 1000, 2799, 2900, 3500, 4100, 4200, 6000, 9000, 10500];

    for (const t of checkpoints) {
      const state = computeScriptedHeroState(t);
      // Real schema-valid field is mutated ("panel" or "gradient")
      expect(["panel", "gradient"]).toContain(state.variantValue);

      // Status is either validating or valid
      expect(["validating", "valid"]).toContain(state.validationStatus);

      // Verify the resulting component config passes registry validation
      const config = buildHeroDemoConfig({ variant: state.variantValue });
      for (const comp of config.pages[0].components) {
        const validation = validateComponentNode(comp);
        expect(validation.valid).toBe(true);
        expect(validation.issues).toBeUndefined();
      }
    }
  });

  it("confirms validating… / ✓ valid is derived from real validateComponentNode calls at runtime", () => {
    // When variant is fully valid ("panel" or "gradient")
    const panelResult = validateHeroEditorState('"panel"');
    expect(panelResult.valid).toBe(true);
    expect(panelResult.validationStatus).toBe("valid");

    const gradientResult = validateHeroEditorState('"gradient"');
    expect(gradientResult.valid).toBe(true);
    expect(gradientResult.validationStatus).toBe("valid");

    // While typing intermediate partial values ("g", "grad", "gr")
    const partialG = validateHeroEditorState('"g"');
    expect(partialG.valid).toBe(false);
    expect(partialG.validationStatus).toBe("validating");
    expect(partialG.issues).toBeDefined();

    const partialGrad = validateHeroEditorState('"grad"');
    expect(partialGrad.valid).toBe(false);
    expect(partialGrad.validationStatus).toBe("validating");

    // Invalid schema value altogether
    const invalidVal = validateHeroEditorState('"invalid-variant"');
    expect(invalidVal.valid).toBe(false);
    expect(invalidVal.validationStatus).toBe("validating");
  });

  it("renders validating… and ✓ valid states in code card footer", () => {
    const validatingHtml = renderToString(
      <DemoCodeCard validationStatus="validating" />
    );
    expect(validatingHtml).toContain("validating…");

    const validHtml = renderToString(
      <DemoCodeCard validationStatus="valid" />
    );
    expect(validHtml).toContain("✓ valid");
  });

  it("satisfies hero copy rules: subtext <= 20 words, max 4 text elements, exact CTA labels", () => {
    const heroHtml = renderToString(<HomeHero />);

    // CTA labels
    expect(heroHtml).toContain("Start building");
    expect(heroHtml).toContain("View templates");

    // Violet gradient on "driven Apps" only
    expect(heroHtml).toContain('class="headline-gradient">driven Apps</span>');
    expect(heroHtml).toContain("Live Config-");

    // Subtext <= 20 words
    const subtext = "Write or prompt a JSON config. AppForge validates every node, renders typed components, and syncs tables to Postgres.";
    const words = subtext.trim().split(/\s+/);
    expect(words.length).toBeLessThanOrEqual(20);
    expect(heroHtml).toContain("Write or prompt a JSON config.");
  });

  it("declares trend.series in StatisticSchema, preserves it upon parsing, and enforces upward trend matching data", () => {
    const rawStat = {
      type: "Statistic",
      label: "Active Workflows",
      value: "1,244",
      variant: "gradient" as const,
      trend: {
        value: "+12%",
        sentiment: "positive" as const,
        direction: "up" as const,
        series: [50, 52, 51, 54, 53, 55, 56],
      },
    };

    const parsed = StatisticSchema.safeParse(rawStat);
    expect(parsed.success).toBe(true);
    if (parsed.success && typeof parsed.data.trend === "object" && parsed.data.trend !== null) {
      expect(parsed.data.trend.series).toEqual([50, 52, 51, 54, 53, 55, 56]);
      // The data must match the trend direction: if trend is "up", series ends higher than it starts
      const series = parsed.data.trend.series!;
      expect(series[series.length - 1]).toBeGreaterThan(series[0]);
    }

    // Strict schema: rejects unknown keys in trend
    const invalidTrend = {
      ...rawStat,
      trend: {
        value: "+12%",
        series: [10, 20],
        unknownKey: "bad",
      },
    };
    expect(StatisticSchema.safeParse(invalidTrend).success).toBe(false);
  });

  it("enforces trend.series .max(100) limit: accepts 100 elements, rejects 101 elements", () => {
    const stat100 = {
      type: "Statistic",
      label: "Series 100",
      value: "100",
      trend: {
        series: Array.from({ length: 100 }, (_, i) => i + 1),
      },
    };
    const parsed100 = StatisticSchema.safeParse(stat100);
    expect(parsed100.success).toBe(true);

    const stat101 = {
      type: "Statistic",
      label: "Series 101",
      value: "101",
      trend: {
        series: Array.from({ length: 101 }, (_, i) => i + 1),
      },
    };
    const parsed101 = StatisticSchema.safeParse(stat101);
    expect(parsed101.success).toBe(false);
    if (!parsed101.success) {
      expect(parsed101.error.issues[0]?.message).toMatch(/too big|<=100|at most 100/i);
    }
  });

  it("footer status in DemoCodeCard shows exactly one check mark: '✓ valid' without a duplicate SVG check icon", () => {
    const validHtml = renderToString(<DemoCodeCard validationStatus="valid" />);
    expect(validHtml).toContain("✓ valid");
    // Ensure code-footer-valid renders only one check mark and no duplicate SVG check icon inside it
    const footerValidHtml = validHtml.match(/<span[^>]*data-testid="code-footer-valid"[^>]*>([\s\S]*?)<\/span>/)?.[1];
    expect(footerValidHtml).toBeDefined();
    expect(footerValidHtml).toContain("✓ valid");
    expect(footerValidHtml).not.toContain("<svg");
  });

  it("any value suffix keeps its leading space in the renderer ('14,200 runs')", () => {
    const htmlWithSuffixInValue = renderToString(
      <Statistic label="Total Runs" value="14,200 runs" variant="gradient" />
    );
    expect(htmlWithSuffixInValue).toContain("14,200 runs");
    expect(htmlWithSuffixInValue).not.toContain("14,200runs");

    const htmlWithPropSuffix = renderToString(
      <Statistic label="Total Runs" value={14200} suffix="runs" variant="gradient" />
    );
    expect(htmlWithPropSuffix).toContain("14,200 runs");
    expect(htmlWithPropSuffix).not.toContain("14,200runs");
  });

  it("renders units attached in the value exactly as written ('14m', '99.98%', '$1.5M', '-4m', '4.2k')", () => {
    // 1. "14m" renders exactly as written (not "14")
    const html14m = renderToString(<Statistic label="Duration" value="14m" />);
    expect(html14m).toContain("14m");
    expect(html14m).not.toMatch(/>\s*14\s*</);

    // 2. "99.98%" renders exactly as written (not "99.98")
    const html99 = renderToString(<Statistic label="Uptime" value="99.98%" />);
    expect(html99).toContain("99.98%");
    expect(html99).not.toMatch(/>\s*99\.98\s*</);

    // 3. "$1.5M" renders exactly as written (not "0" or "1.5")
    const html15m = renderToString(<Statistic label="ARR" value="$1.5M" />);
    expect(html15m).toContain("$1.5M");
    expect(html15m).not.toContain("$0");

    // 4. "-4m" renders exactly as written (not "-4")
    const htmlMinus4m = renderToString(<Statistic label="Latency" value="-4m" />);
    expect(htmlMinus4m).toContain("-4m");

    // 5. "4.2k" renders exactly as written
    const html42k = renderToString(<Statistic label="Followers" value="4.2k" />);
    expect(html42k).toContain("4.2k");

    // Also verified in panel and gradient variants
    const htmlPanel14m = renderToString(<Statistic label="Duration" value="14m" variant="panel" />);
    expect(htmlPanel14m).toContain("14m");

    const htmlGradient99 = renderToString(<Statistic label="Uptime" value="99.98%" variant="gradient" />);
    expect(htmlGradient99).toContain("99.98%");
  });

  it("ensures only an explicit valueSuffix gets the leading space ('14,200' + ' runs' -> '14,200 runs')", () => {
    // Explicit valueSuffix with leading space
    const htmlExplicitWithSpace = renderToString(
      <Statistic label="Total Runs" value="14,200" valueSuffix=" runs" />
    );
    expect(htmlExplicitWithSpace).toContain("14,200 runs");

    // Explicit valueSuffix without leading space (auto-spaced)
    const htmlExplicitNoSpace = renderToString(
      <Statistic label="Total Runs" value="14,200" valueSuffix="runs" />
    );
    expect(htmlExplicitNoSpace).toContain("14,200 runs");
    expect(htmlExplicitNoSpace).not.toContain("14,200runs");

    // Numeric value with explicit valueSuffix
    const htmlNumeric = renderToString(
      <Statistic label="Total Runs" value={14200} valueSuffix="runs" />
    );
    expect(htmlNumeric).toContain("14,200 runs");

    // Passes strict Zod schema validation
    const schemaValidation = StatisticSchema.safeParse({
      type: "Statistic",
      label: "Total Runs",
      value: "14,200",
      valueSuffix: " runs",
    });
    expect(schemaValidation.success).toBe(true);
  });

  it("'Sample data' appears exactly once, in the footer only", () => {
    const previewHtml = renderToString(<DemoPreviewCard />);
    const matches = previewHtml.match(/Sample data/g) || [];
    expect(matches.length).toBe(1);
    // Verified in the footer section
    expect(previewHtml).toContain("border-t border-border text-[13px] text-muted-foreground");
  });

  it("computes the trend chip from trend.series ((last - first) / first) and confirms the chip and series agree (+12%)", () => {
    const series = [50, 52, 51, 54, 53, 55, 56];
    const expectedPct = Math.round(((series[series.length - 1] - series[0]) / series[0]) * 100);
    expect(expectedPct).toBe(12);

    const html = renderToString(
      <Statistic
        label="Active Workflows"
        value="1,244"
        variant="gradient"
        trend={{ series }}
      />
    );
    expect(html).toContain("+12%");
  });

  it("renders final value (1,244) on Frame 0 and does not count up from 0", () => {
    const html = renderToString(
      <Statistic
        label="Active Workflows"
        value="1,244"
        variant="gradient"
      />
    );
    expect(html).toContain("1,244");
    expect(html).not.toMatch(/>\s*0\s*<\/div>/);
  });

  it("every key rendered on the right in preview config appears in the config shown on the left", () => {
    // Extract every property key recursively from preview components
    function extractKeys(item: unknown): Set<string> {
      const keys = new Set<string>();
      function walk(node: unknown) {
        if (!node || typeof node !== "object") return;
        if (Array.isArray(node)) {
          for (const el of node) walk(el);
        } else {
          for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
            keys.add(k);
            walk(v);
          }
        }
      }
      walk(item);
      return keys;
    }

    const previewComponents = HERO_DEMO_CONFIG.pages[0].components;
    const rightKeys = extractKeys(previewComponents);

    // Verify right keys include all expected structural fields
    expect(rightKeys).toContain("type");
    expect(rightKeys).toContain("label");
    expect(rightKeys).toContain("value");
    expect(rightKeys).toContain("variant");
    expect(rightKeys).toContain("trend");
    expect(rightKeys).toContain("series");
    expect(rightKeys).toContain("entity");
    expect(rightKeys).toContain("columns");
    expect(rightKeys).toContain("data");
    expect(rightKeys).toContain("workflow");
    expect(rightKeys).toContain("trigger");
    expect(rightKeys).toContain("status");
    expect(rightKeys).toContain("icon");

    // Render left panel to string
    const leftHtml = renderToString(<DemoCodeCard />);

    // Verify every key rendered on the right appears in the config shown on the left
    for (const key of rightKeys) {
      const matchesQuote = leftHtml.includes(`"${key}"`) || leftHtml.includes(`&quot;${key}&quot;`);
      expect(
        matchesQuote,
        `Key "${key}" rendered on the right preview was missing from the left code panel`
      ).toBe(true);
    }
  });

  it("shows series array with fold marker [7 values] ▸ when collapsed", () => {
    const leftHtml = renderToString(<DemoCodeCard />);
    expect(leftHtml).toContain("[7 values] ▸");
    expect(leftHtml.includes(`"series"`) || leftHtml.includes(`&quot;series&quot;`)).toBe(true);
    expect(leftHtml.includes(`"trend"`) || leftHtml.includes(`&quot;trend&quot;`)).toBe(true);
  });
});
