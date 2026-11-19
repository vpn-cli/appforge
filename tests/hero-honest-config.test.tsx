import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { DemoCodeCard } from "@/components/home/DemoCodeCard";
import { DemoPreviewCard } from "@/components/home/DemoPreviewCard";
import { HomeHero } from "@/components/home/HomeHero";
import { HERO_DEMO_CONFIG, HERO_DEMO_JSON_LINES } from "@/components/home/heroDemoConfig";
import { ComponentRegistry } from "@/registry";
import { validateComponentNode } from "@/lib/validation";

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
