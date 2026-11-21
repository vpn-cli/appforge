import { describe, it, expect } from "vitest";
import {
  COPILOT_SYSTEM_PROMPT,
  generateComponentSchemaSpecs,
  getComponentAllowedKeys,
  buildSchemaDocumentation,
} from "@/lib/copilot-prompt";
import { ComponentSchemas } from "@/lib/validation";

describe("Copilot System Prompt — Schema Reflection & Drift Defense", () => {
  it("generates component specifications covering every registered schema in ComponentSchemas", () => {
    const specs = generateComponentSchemaSpecs();
    const registeredTypes = Object.keys(ComponentSchemas);

    expect(Object.keys(specs)).toEqual(registeredTypes);

    for (const type of registeredTypes) {
      expect(specs[type]).toBeDefined();
      expect(specs[type].allowedKeys).toContain("type");
    }
  });

  it("ensures every allowed key declared in ComponentSchemas is explicitly documented in the system prompt", () => {
    const specs = generateComponentSchemaSpecs();

    for (const [typeName, { allowedKeys }] of Object.entries(specs)) {
      // Prompt must mention the component type
      expect(COPILOT_SYSTEM_PROMPT).toContain(typeName);

      // Prompt must mention every single allowed key for this component
      for (const key of allowedKeys) {
        expect(COPILOT_SYSTEM_PROMPT).toContain(key);
      }

      // Verify getComponentAllowedKeys matches exactly
      const runtimeKeys = getComponentAllowedKeys(typeName);
      expect(runtimeKeys).toEqual(allowedKeys);
    }
  });

  it("introspects and documents all schema enums without manual drift", () => {
    const specs = generateComponentSchemaSpecs();

    // Header size enum: sm, md, lg
    expect(specs.Header.enums.size).toEqual(["sm", "md", "lg"]);
    expect(COPILOT_SYSTEM_PROMPT).toContain('"sm" | "md" | "lg"');

    // Statistic format enum: compact, full, auto
    expect(specs.Statistic.enums.format).toEqual(["compact", "full", "auto"]);
    expect(COPILOT_SYSTEM_PROMPT).toContain('"compact" | "full" | "auto"');

    // Statistic variant enum: default, panel (interview-hardening schema)
    expect(specs.Statistic.enums.variant).toEqual(["default", "panel"]);
    expect(COPILOT_SYSTEM_PROMPT).toContain('"default" | "panel"');

    // ButtonAction variant enum: default, outline, secondary, ghost
    expect(specs.ButtonAction.enums.variant).toEqual(["default", "outline", "secondary", "ghost"]);
    expect(COPILOT_SYSTEM_PROMPT).toContain('"default" | "outline" | "secondary" | "ghost"');
  });

  it("strictly prohibits arbitrary / unrecognized keys in prompt documentation", () => {
    const prohibitedKeys = ["dangerouslySetInnerHTML", "onClick", "onMouseOver", "style", "foo", "customProp"];
    for (const badKey of prohibitedKeys) {
      for (const type of Object.keys(ComponentSchemas)) {
        const allowed = getComponentAllowedKeys(type);
        expect(allowed).not.toContain(badKey);
      }
    }
  });
});
