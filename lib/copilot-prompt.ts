import {
  ComponentSchemas,
  StatusColorToneSchema,
  DataTableColumnSchema,
  WHITELISTED_ROW_ICONS,
} from "./validation";
import { z } from "zod";

export const PROMPT_VERSION = "v1.2.0";

/**
 * Introspects a Zod schema to extract its shape, handling lazy schemas.
 */
export function getComponentSchemaShape(schema: z.ZodTypeAny): Record<string, z.ZodTypeAny> {
  const unwrapped =
    typeof (schema as any)._def?.getter === "function"
      ? (schema as any)._def.getter()
      : schema;
  return unwrapped.shape || {};
}

/**
 * Returns the exact allowed keys for a given component type from ComponentSchemas.
 */
export function getComponentAllowedKeys(typeName: string): string[] {
  const schema = ComponentSchemas[typeName];
  if (!schema) return [];
  const shape = getComponentSchemaShape(schema);
  return Object.keys(shape);
}

/**
 * Recursively unwraps optional/default/effects to extract enum options if present.
 */
export function extractEnumValues(zodType: any): string[] | null {
  if (!zodType) return null;
  if (zodType.options && Array.isArray(zodType.options)) {
    return zodType.options;
  }
  if (zodType._def?.type === "enum" && zodType.options) {
    return zodType.options;
  }
  if (zodType._def?.type === "optional" || zodType._def?.typeName === "ZodOptional") {
    return extractEnumValues(zodType._def.innerType || zodType._def.schema);
  }
  if (zodType._def?.type === "default" || zodType._def?.typeName === "ZodDefault") {
    return extractEnumValues(zodType._def.innerType || zodType._def.schema);
  }
  return null;
}

/**
 * Generates exact type and key specification for every registered component type
 * directly from the authoritative Zod schemas to guarantee 0 drift.
 */
export function generateComponentSchemaSpecs(): Record<
  string,
  { allowedKeys: string[]; enums: Record<string, string[]> }
> {
  const specs: Record<string, { allowedKeys: string[]; enums: Record<string, string[]> }> = {};

  for (const [typeName, schema] of Object.entries(ComponentSchemas)) {
    const shape = getComponentSchemaShape(schema);
    const allowedKeys = Object.keys(shape);
    const enums: Record<string, string[]> = {};

    for (const [key, fieldSchema] of Object.entries(shape)) {
      const enumOpts = extractEnumValues(fieldSchema);
      if (enumOpts) {
        enums[key] = enumOpts;
      }
    }

    specs[typeName] = { allowedKeys, enums };
  }

  return specs;
}

/**
 * Builds dynamic documentation string listing exact allowed keys and enums for all components.
 */
export function buildSchemaDocumentation(): string {
  const specs = generateComponentSchemaSpecs();
  const statusTones = StatusColorToneSchema.options.map((t) => `"${t}"`).join(" | ");

  const lines: string[] = [
    "Allowed Component Types (STRICT SCHEMA — every node is validated with .strict(); unrecognized keys are rejected):",
  ];

  for (const [typeName, { allowedKeys, enums }] of Object.entries(specs)) {
    const keyParts = allowedKeys.map((key) => {
      if (key === "type") return `type: "${typeName}"`;
      if (enums[key]) {
        return `${key}?: ${enums[key].map((o) => `"${o}"`).join(" | ")}`;
      }
      if (key === "trend") {
        return `trend?: "up" | "down" | "neutral" | { value?: string, label?: string, direction?: "up" | "down" | "neutral", sentiment?: "positive" | "negative" | "neutral" }`;
      }
      if (key === "columns") {
        return `columns: (string | { key: string, label?: string, type?: "text" | "number" | "currency" | "id" | "code" | "badge" | "status" | "avatar" | "icon", colors?: Record<string, ${statusTones}>, align?: "left" | "right" | "center" })[]`;
      }
      if (key === "data" || key === "rows") {
        return `${key}?: Record<string, unknown>[]`;
      }
      if (key === "content" || key === "footer" || key === "items") {
        return `${key}?: ComponentNode[]`;
      }
      return `${key}?: string | number | boolean`;
    });

    lines.push(`- ${typeName}: { ${keyParts.join(", ")} }`);
  }

  return lines.join("\n");
}

export function buildCopilotSystemPrompt(): string {
  const schemaDoc = buildSchemaDocumentation();
  const statusTonesList = StatusColorToneSchema.options.map((t) => `"${t}"`).join(" | ");

  return `Return ONLY a valid JSON array of UI component AST nodes. No markdown wrappers, no conversational commentary.

${schemaDoc}

CRITICAL COMPONENT CONSTRAINTS:
1. Statistic: STRICTLY for numeric KPIs and aggregated metrics (e.g. "$42.8K", "99.98%", "14"). At most 4 statistics in a Grid row. NEVER use Statistic for names, labels, individual records, or text descriptions. Allowed variant: "default" | "panel" | "gradient".
2. DataTable: Any collection or list of records (incidents, users, orders, tickets, servers, fleet units) MUST be rendered as a DataTable with structured columns, NEVER as Cards of Statistics. For status columns, ALWAYS use type: "status" with an explicit \`colors\` map assigning each status value to one of ${statusTonesList} (e.g. { key: "status", label: "Status", type: "status", colors: { Running: "success", Pending: "warning", Critical: "danger", Idle: "info" } }).
3. Card: Card title is primary (semibold, larger); subtitle is secondary description.
4. Grid: Responsive grid layout. Allowed columns and gap. Never exceed 4 columns for KPI rows.
5. Strict Keys: NEVER emit unrecognized or custom attributes (such as onClick, dangerouslySetInnerHTML, style, or arbitrary properties). Component schemas are strictly checked.

Architectural Rules:
1. Top-level layout typically starts with a Header.
2. Below the Header, use a Grid (columns: 3 or 4) containing at most 3-4 numeric Statistic KPIs.
3. For lists of records (e.g. incidents, orders, users, tickets), always render a DataTable with a status column using type: "status" and a \`colors\` map mapping every status value to ${statusTonesList}.
4. Mock data dates: If including date/timestamp values in mock data (e.g. DataTable rows, timestamps), always use recent dates relative to today (current year 2026), NEVER outdated dates.
5. Entity and Database Names: When generating, naming, or referencing schema entities or database tables, entity names MUST be snake_case (e.g. "incident_reports", "user_tasks") and at most 22 characters in length. Never exceed 22 characters.
6. Output must be a direct JSON array, e.g. [{ type: "Header", ... }, { type: "Grid", ... }, { type: "DataTable", ... }]`;
}

export const COPILOT_SYSTEM_PROMPT = buildCopilotSystemPrompt();
