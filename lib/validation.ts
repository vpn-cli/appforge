/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { preprocessStatusColorsMap } from "./status-colors";

/**
 * Cache Key Normalization:
 * Collapses internal whitespace, tabs, and newlines to a single space,
 * converts to lowercase, trims edges, and strips trailing punctuation (.?!,;:).
 */
export function normalizePromptForCache(prompt: string): string {
  if (!prompt || typeof prompt !== "string") return "";
  return prompt
    .toLowerCase()
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.?!,;:]+$/, "")
    .trim();
}

// ============================================================================
// Per-Component Zod Schemas
// ============================================================================

export const HeaderSchema = z.object({
  type: z.literal("Header"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  size: z.enum(["sm", "md", "lg"]).optional().default("md"),
  className: z.string().optional(),
}).strict();

export const StatisticTrendSchema = z.union([
  z.enum(["up", "down", "neutral"]),
  z.object({
    value: z.string().optional(),
    label: z.string().optional(),
    direction: z.enum(["up", "down", "neutral"]).optional(),
    sentiment: z.enum(["positive", "negative", "neutral"]).optional(),
    series: z.array(z.number()).max(100).optional(),
  }).strict(),
]);

export const StatisticSchema = z.object({
  type: z.literal("Statistic"),
  label: z.string().optional(),
  title: z.string().optional(),
  value: z.union([z.string(), z.number()]).optional().default("0"),
  valueSuffix: z.string().optional(),
  suffix: z.string().optional(),
  format: z.enum(["compact", "full", "auto"]).optional(),
  trend: StatisticTrendSchema.optional(),
  trendValue: z.string().optional(),
  chartWave: z.boolean().optional(),
  icon: z.string().optional(),
  variant: z.enum(["default", "panel", "gradient"]).optional(),
  className: z.string().optional(),
}).strict();
export const StatusColorToneSchema = z.enum([
  "success",
  "warning",
  "danger",
  "info",
  "neutral",
  "violet",
]);

export const WHITELISTED_ROW_ICONS = [
  "users",
  "user",
  "file-text",
  "filetext",
  "bell",
  "sparkles",
  "activity",
  "layers",
  "check-circle",
  "checkcircle",
  "alert-triangle",
  "alerttriangle",
  "shield",
  "database",
  "workflow",
  "clock",
] as const;

export const WhitelistedRowIconSchema = z.enum(WHITELISTED_ROW_ICONS);

export const DataTableColumnSchema = z.union([
  z.string(),
  z.object({
    key: z.string(),
    label: z.string().optional(),
    type: z
      .enum(["text", "number", "currency", "id", "code", "badge", "status", "avatar", "icon"])
      .optional(),
    colors: z.preprocess(
      preprocessStatusColorsMap,
      z.record(z.string(), StatusColorToneSchema).optional()
    ),
    align: z.enum(["left", "right", "center"]).optional(),
  }).strict(),
]);

export const DataTableSchema = z.object({
  type: z.literal("DataTable"),
  columns: z.array(DataTableColumnSchema).optional().default([]),
  data: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  rows: z.array(z.record(z.string(), z.unknown())).optional(),
  entity: z.string().optional(),
  variant: z.enum(["default", "dark-panel"]).optional(),
  state: z.enum(["loading", "loaded", "empty", "error", "degraded"]).optional(),
  errorMessage: z.string().optional(),
  degradedMessage: z.string().optional(),
  isInteractive: z.boolean().optional(),
  className: z.string().optional(),
}).strict();

export const ButtonActionSchema = z.object({
  type: z.literal("ButtonAction"),
  label: z.string().optional(),
  variant: z.enum(["default", "outline", "secondary", "ghost"]).optional().default("default"),
  icon: z.string().optional(),
  className: z.string().optional(),
}).strict();

export const CardSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.literal("Card"),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    content: z.array(ComponentNodeSchema).optional().default([]),
    footer: z.array(ComponentNodeSchema).optional().default([]),
    className: z.string().optional(),
  }).strict()
);

export const GridSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.literal("Grid"),
    columns: z.union([z.number(), z.string()]).optional().default(2),
    gap: z.union([z.number(), z.string()]).optional().default(4),
    items: z.array(ComponentNodeSchema).optional().default([]),
    className: z.string().optional(),
  }).strict()
);

export const ComponentSchemas: Record<string, z.ZodTypeAny> = {
  Header: HeaderSchema,
  Statistic: StatisticSchema,
  DataTable: DataTableSchema,
  Card: CardSchema,
  Grid: GridSchema,
  ButtonAction: ButtonActionSchema,
};

export const ComponentNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    HeaderSchema,
    StatisticSchema,
    DataTableSchema,
    CardSchema,
    GridSchema,
    ButtonActionSchema,
  ])
);

const PageSchema = z.object({
  components: z.array(z.any()).optional().default([]),
  title: z.string().optional(),
  id: z.string().optional(),
}).strict();

export const AppConfigSchema = z.object({
  app: z.string().optional(),
  pages: z.array(PageSchema).optional().default([]),
  entities: z.record(z.string(), z.any()).optional(),
}).strict();

/**
 * Validates a single component AST node against its component-specific Zod schema.
 */
export function validateComponentNode(node: unknown): {
  valid: boolean;
  type?: string;
  data?: any;
  issues?: Array<{ path: string; message: string }>;
} {
  if (!node || typeof node !== "object") {
    return {
      valid: false,
      issues: [{ path: "root", message: "Node must be an object" }],
    };
  }

  const raw = node as { type?: unknown; [key: string]: unknown };
  if (typeof raw.type !== "string" || !raw.type) {
    return {
      valid: false,
      issues: [{ path: "type", message: "Component 'type' is missing or not a string" }],
    };
  }

  const schema = ComponentSchemas[raw.type];
  if (!schema) {
    // Unregistered type
    return {
      valid: false,
      type: raw.type,
      issues: [{ path: "type", message: `Unknown component type '${raw.type}'` }],
    };
  }

  const result = schema.safeParse(node);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      path: i.path.join(".") || "root",
      message: i.message,
    }));
    return {
      valid: false,
      type: raw.type,
      issues,
    };
  }

  return {
    valid: true,
    type: raw.type,
    data: result.data,
  };
}

/**
 * Validates an entire app configuration string or object.
 */
export function validateConfig(configStr: string): { errors: string[]; warnings: string[] } {
  try {
    const raw = typeof configStr === "string" ? JSON.parse(configStr) : configStr;
    const result = AppConfigSchema.safeParse(raw);

    if (!result.success) {
      return {
        errors: result.error.issues.map(
          (e) => `${(e.path && e.path.join(".")) || "root"}: ${e.message}`
        ),
        warnings: [],
      };
    }

    const warnings: string[] = [];
    const errors: string[] = [];

    if (!raw.app) warnings.push("App name ('app') is missing. A layout fallback will be used.");
    if (!raw.pages || raw.pages.length === 0)
      warnings.push("No pages defined. App will load completely blank.");

    // Validate entity names (max 22 characters, alphanumeric/underscore)
    if (raw.entities && typeof raw.entities === "object") {
      for (const entityName of Object.keys(raw.entities)) {
        if (entityName.length > 22) {
          errors.push(
            `Entity name "${entityName}" exceeds maximum length of 22 characters. Database entities must be snake_case and at most 22 characters.`
          );
        }
      }
    }

    // Deep-validate each component against its per-component schema
    if (Array.isArray(raw.pages)) {
      raw.pages.forEach((p: any, pageIdx: number) => {
        if (Array.isArray(p.components)) {
          p.components.forEach((c: any, compIdx: number) => {
            const compCheck = validateComponentNode(c);
            if (!compCheck.valid) {
              compCheck.issues?.forEach((issue) => {
                warnings.push(
                  `Page[${pageIdx}].components[${compIdx}] (${compCheck.type || "unknown"}): ${issue.path} - ${issue.message}`
                );
              });
            }
          });
        }
      });
    }

    return { errors, warnings };
  } catch (e: any) {
    return {
      errors: [`Invalid JSON Syntax: ${e.message}`],
      warnings: [],
    };
  }
}
