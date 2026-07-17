"use server";
//acts as a parser for the app config and generates the ddl commands for the app
import { createInsforgeServer } from "@/lib/insforge-server";

export async function syncAppSchema(appId: string, entities: unknown) {
  const supabase = await createInsforgeServer();
  const { data: { user } } = await supabase.auth.getUser();

  // DEV BYPASS FALLBACK ( for dev mode only)
  if (process.env.NODE_ENV === "development" && !user) {
    console.log("[DEV BYPASS] Mocking Schema Extraction for:", appId);
    return { success: true, message: "Mock schema generated successfully." };
  }

  if (!user) throw new Error("Unauthorized");
  if (!entities || typeof entities !== "object") {
    return { success: false, message: "No entities defined in config." };
  }

  const cleanAppId = appId.replace(/-/g, '_');
  const ddlCommands = [];

  for (const [entityName, fields] of Object.entries(entities)) {
    // Sanitize entity name
    const validEntityName = entityName.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    if (!validEntityName) continue;

    const tableName = `app_${cleanAppId}_${validEntityName}`;
    
    // Default columns
    const columns = [
      `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`,
      `created_at TIMESTAMPTZ DEFAULT NOW()`
    ];

    // Map JSON types to Postgres types
    for (const [fieldName, fieldType] of Object.entries(fields as Record<string, string>)) {
      const validFieldName = fieldName.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      if (!validFieldName || validFieldName === 'id' || validFieldName === 'created_at') continue;

      let pgType = "TEXT";
      if (fieldType === "number") pgType = "NUMERIC";
      if (fieldType === "boolean") pgType = "BOOLEAN";
      if (fieldType === "date") pgType = "TIMESTAMPTZ";

      columns.push(`${validFieldName} ${pgType}`);
    }

    const ddl = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.join(', ')});`;
    ddlCommands.push(ddl);
  }

  // Execute each generated DDL statement using our custom RPC function
  for (const query of ddlCommands) {
    const { error } = await supabase.rpc('execute_app_ddl', { app_id: appId, query });
    if (error) {
      console.error("[syncAppSchema] Failed DDL execution:", error);
      return { success: false, message: `Failed to create tables: ${error.message}` };
    }
  }

  return { success: true, message: "Database schemas synchronized." };
}
