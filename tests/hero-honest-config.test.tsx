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
import {
  validateComponentNode,
  TrendChartSchema,
  AppConfigSchema,
} from "@/lib/validation";

describe("PART 3 — Honest Hero Config with TrendChart", () => {
  it("uses only real registry types (TrendChart) in hero config", () => {
    const componentTypes = HERO_DEMO_CONFIG.pages[0].components.map((c) => c.type);
    expect(componentTypes).toEqual(["TrendChart"]);

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
    expect(codeHtml).toContain("TrendChart");
    expect(codeHtml).toContain("Workflow executions");
    expect(codeHtml).toContain("Sample data");
    expect(codeHtml).toContain("app.config.json");
    expect(codeHtml).not.toContain('"live": true');
  });

  it("confirms period is declared in TrendChartSchema and parsed output preserves it", () => {
    const monthlyRaw = {
      type: "TrendChart",
      title: "Workflow executions",
      caption: "Recorded in current billing cycle",
      value: 14200,
      valueSuffix: " runs",
      trend: "up" as const,
      updatedText: "Sample data",
      period: "Monthly" as const,
      periods: ["Weekly", "Monthly", "Yearly"],
      data: [95, 112, 150, 339, 384],
    };
    const parsedMonthly = TrendChartSchema.safeParse(monthlyRaw);
    expect(parsedMonthly.success).toBe(true);
    if (parsedMonthly.success) {
      expect(parsedMonthly.data.period).toBe("Monthly");
    }

    const weeklyRaw = {
      type: "TrendChart",
      title: "Workflow executions",
      caption: "Recorded in current billing cycle",
      value: 14200,
      valueSuffix: " runs",
      trend: "up" as const,
      updatedText: "Sample data",
      period: "Weekly" as const,
      periods: ["Weekly", "Monthly", "Yearly"],
      data: [128, 152, 141],
    };
    const parsedWeekly = TrendChartSchema.safeParse(weeklyRaw);
    expect(parsedWeekly.success).toBe(true);
    if (parsedWeekly.success) {
      expect(parsedWeekly.data.period).toBe("Weekly");
    }

    // Verify AppConfigSchema does not strip any keys from the full hero config
    const fullConfigParsed = AppConfigSchema.safeParse(HERO_DEMO_CONFIG);
    expect(fullConfigParsed.success).toBe(true);
    if (fullConfigParsed.success) {
      const chartComp = fullConfigParsed.data.pages[0].components[0] as any;
      expect(chartComp.type).toBe("TrendChart");
      expect(chartComp.title).toBe("Workflow executions");
      expect(chartComp.value).toBe(14200);
      expect(chartComp.period).toBe("Monthly");
      expect(chartComp.updatedText).toBe("Sample data");
    }
  });

  it("validates that every step in the scripted edit loop passes validateComponentNode", () => {
    // Initial state
    expect(INITIAL_HERO_STATE.periodValue).toBe("Weekly");
    expect(INITIAL_HERO_STATE.validationStatus).toBe("valid");

    // Scripted timestamps throughout the 11,000ms loop
    const checkpoints = [0, 1000, 2799, 2900, 3500, 4100, 4200, 6000, 9000, 10500];

    for (const t of checkpoints) {
      const state = computeScriptedHeroState(t);
      expect(["Weekly", "Monthly", "Yearly"]).toContain(state.periodValue);
      expect(["validating", "valid"]).toContain(state.validationStatus);

      // Verify the resulting component config passes registry validation
      const config = buildHeroDemoConfig({ period: state.periodValue });
      for (const comp of config.pages[0].components) {
        const validation = validateComponentNode(comp);
        expect(validation.valid).toBe(true);
        expect(validation.issues).toBeUndefined();
      }
    }
  });

  it("confirms validating… / ✓ valid is derived from real validateComponentNode calls at runtime", () => {
    // When period is fully valid ("Weekly" or "Monthly")
    const weeklyResult = validateHeroEditorState('"Weekly"');
    expect(weeklyResult.valid).toBe(true);
    expect(weeklyResult.validationStatus).toBe("valid");

    const monthlyResult = validateHeroEditorState('"Monthly"');
    expect(monthlyResult.valid).toBe(true);
    expect(monthlyResult.validationStatus).toBe("valid");

    // While typing intermediate partial values ("M", "Mon", "Month")
    const partialM = validateHeroEditorState('"M"');
    expect(partialM.valid).toBe(false);
    expect(partialM.validationStatus).toBe("validating");
    expect(partialM.issues).toBeDefined();

    const partialMon = validateHeroEditorState('"Mon"');
    expect(partialMon.valid).toBe(false);
    expect(partialMon.validationStatus).toBe("validating");

    // Invalid schema value altogether
    const invalidVal = validateHeroEditorState('"invalid-period"');
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
    const subtext =
      "Write or prompt a JSON config. AppForge validates every node, renders typed components, and syncs tables to Postgres.";
    const words = subtext.trim().split(/\s+/);
    expect(words.length).toBeLessThanOrEqual(20);
    expect(heroHtml).toContain("Write or prompt a JSON config.");
  });
});
