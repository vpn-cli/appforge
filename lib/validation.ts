import { z } from "zod";

const BaseComponentSchema = z.object({
  type: z.string({
    message: "Component 'type' is required and must be a string",
  }),
}).passthrough();

const PageSchema: any = z.object({
  components: z.array(BaseComponentSchema as any).optional().default([] as any),
}).passthrough();

const AppConfigSchema: any = z.object({
  app: z.string().optional(),
  pages: z.array(PageSchema as any).optional().default([] as any),
  entities: z.record(z.string(), z.any()).optional()
}).passthrough();

export function validateConfig(configStr: string): { errors: string[], warnings: string[] } {
  try {
    const raw = JSON.parse(configStr);
    const result = AppConfigSchema.safeParse(raw);
    
    if (!result.success) {
      return {
        errors: (result.error.errors || result.error.issues || []).map((e: any) => `${(e.path && e.path.join('.')) || 'root'}: ${e.message}`),
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
