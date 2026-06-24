import { z } from "zod";

const BaseComponentSchema = z.object({
  type: z.string({
    required_error: "Component 'type' is required",
    invalid_type_error: "Component 'type' must be a string",
  }),
}).passthrough();

const PageSchema = z.object({
  components: z.array(BaseComponentSchema).optional().default([]),
}).passthrough();

const AppConfigSchema = z.object({
  app: z.string().optional(),
  pages: z.array(PageSchema).optional().default([]),
  entities: z.record(z.any()).optional()
}).passthrough();

export function validateConfig(configStr: string): { errors: string[], warnings: string[] } {
  try {
    const raw = JSON.parse(configStr);
    const result = AppConfigSchema.safeParse(raw);
    
    if (!result.success) {
      return {
        errors: result.error.errors.map(e => `${e.path.join('.') || 'root'}: ${e.message}`),
        warnings: []
      };
    }
    
    // Custom logic warnings without breaking validation
    const warnings: string[] = [];
    if (!raw.app) warnings.push("App name ('app') is missing. A layout fallback will be used.");
    if (!raw.pages || raw.pages.length === 0) warnings.push("No pages defined. App will load completely blank.");
    
    return { errors: [], warnings };
  } catch (e: any) {
    return {
      errors: [`Invalid JSON Syntax: ${e.message}`],
      warnings: []
    }
  }
}
