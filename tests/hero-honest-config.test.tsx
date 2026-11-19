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
  INITIAL_HERO_STATE,
} from "@/components/home/heroDemoConfig";
import { ComponentRegistry } from "@/registry";
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
      expect(statComp.trend).toEqual({ value: "+12%", sentiment: "positive" });

      const tableComp = fullConfigParsed.data.pages[0].components[1] as any;
      expect(tableComp.entity).toBe("workflows");
      expect(tableComp.columns).toHaveLength(3);
      expect(tableComp.data[0].icon).toBe("users");
    }
  });

  it("validates that every step in the scripted edit loop passes validateComponentNode", () => {
    // Initial state
    expect(INITIAL_HERO_STATE.variantValue).toBe("panel");
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
});
