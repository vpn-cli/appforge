import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { TEMPLATES_DATA } from "@/lib/templates-data";
import { POKEMON_TEMPLATE_FIXTURE } from "@/tests/fixtures/pokemon-template";
import { TemplatesStrip } from "@/components/home/TemplatesStrip";
import { TemplatesView } from "@/components/templates/TemplatesView";

describe("Templates catalog and fixtures", () => {
  it("removes 'pokemon' from user-facing TEMPLATES_DATA", () => {
    const templateIds = TEMPLATES_DATA.map((t) => t.id);
    expect(templateIds).not.toContain("pokemon");

    const hasPokemonAnywhere = TEMPLATES_DATA.some(
      (t) =>
        t.title.toLowerCase().includes("pokémon") ||
        t.title.toLowerCase().includes("pokemon") ||
        t.description.toLowerCase().includes("pokemon") ||
        (t.config.entities && "pokemon" in t.config.entities)
    );
    expect(hasPokemonAnywhere).toBe(false);
  });

  it("contains strictly professional starter configs in TEMPLATES_DATA", () => {
    const templateIds = TEMPLATES_DATA.map((t) => t.id);
    expect(templateIds).toEqual(["crm", "incident", "directory", "blank"]);
  });

  it("preserves the Pokemon template only as an isolated test fixture", () => {
    expect(POKEMON_TEMPLATE_FIXTURE).toBeDefined();
    expect(POKEMON_TEMPLATE_FIXTURE.id).toBe("pokemon");
    expect(POKEMON_TEMPLATE_FIXTURE.title).toBe("Pokémon Comparison");
    expect(POKEMON_TEMPLATE_FIXTURE.config.entities).toHaveProperty("pokemon");
  });

  it("does not render Pokemon on the landing TemplatesStrip", () => {
    const html = renderToString(<TemplatesStrip />);
    expect(html).not.toContain("Pokémon");
    expect(html).not.toContain("pokemon");
    expect(html).toContain("Sales Analytics CRM");
    expect(html).toContain("Incident Command Center");
    expect(html).toContain("Employee Directory");
  });

  it("does not render Pokemon on /templates (TemplatesView)", () => {
    const html = renderToString(<TemplatesView />);
    expect(html).not.toContain("Pokémon");
    expect(html).not.toContain("pokemon");
    expect(html).toContain("Sales Analytics CRM");
    expect(html).toContain("Incident Command Center");
    expect(html).toContain("Employee Directory");
    expect(html).toContain("Blank Canvas");
  });
});
