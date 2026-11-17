"use server";
// Acts as a parser for the app config and generates DDL commands for the app
import { createInsforgeServer } from "@/lib/insforge-server";
import { authorizeAppAccess } from "@/lib/app-access";

export async function syncAppSchema(appId: string, entities: unknown, userId: string | null) {
  const supabase = await createInsforgeServer();

  // If there's no Clerk userId (e.g. guest mode)
  if (!userId) {
    // Explicit opt-in dev bypass (never active in production)
    if (process.env.NODE_ENV !== "production" && process.env.DEV_AUTH_BYPASS === "true") {
      console.log("[DEV BYPASS] Mocking Schema Extraction for:", appId);
      return { success: true, message: "Mock schema generated successfully." };
    }
    return { success: false, message: "Unauthorized" };
  }

  if (!entities || typeof entities !== "object") {
    return { success: false, message: "No entities defined in config." };
  }

  for (const [entityName, fields] of Object.entries(entities)) {
    // Sanitize entity name
    const validEntityName = entityName.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    if (!validEntityName) continue;

    // Verify ownership and write authorization before executing structural DDL.
    // skipEntityCheck is explicitly used here because the entity table is about to be created/synced.
    const authResult = await authorizeAppAccess(appId, validEntityName, "write", { skipEntityCheck: true });
    if (authResult.error) {
      const status = authResult.error.status;
      return {
        success: false,
        message: status === 401 ? "Unauthorized" : "App not found or not owned by user",
      };
    }

    const tableName = authResult.tableName;
    
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

    // Execute generated DDL statement using RPC
    const { error: ddlError } = await supabase.rpc('execute_app_ddl', { app_id: appId, query: ddl });
    if (ddlError) {
      console.error("[syncAppSchema] Failed DDL execution:", ddlError);
      return { success: false, message: `Failed to create tables: ${ddlError.message}` };
    }

    // Upsert a row in app_schemas after successful DDL using consistent validEntityName
    const { error: upsertError } = await supabase
      .from("app_schemas")
      .upsert(
        {
          app_id: appId,
          table_name: validEntityName,
          schema_definition: fields,
        },
        { onConflict: "app_id,table_name" }
      );

    if (upsertError) {
      console.error("[syncAppSchema] Failed to upsert app_schemas:", upsertError);
      return { success: false, message: `Failed to record schema definition: ${upsertError.message}` };
    }
  }

  return { success: true, message: "Database schemas synchronized." };
}
