"use server";
// Acts as a parser for the app config and generates DDL commands for the app
import { createInsforgeServer } from "@/lib/insforge-server";
import { authorizeAppAccess } from "@/lib/app-access";

// Whitelist of valid PostgreSQL column types for runtime entities
const COLUMN_TYPE_WHITELIST: Record<string, string> = {
  string: "TEXT",
  text: "TEXT",
  number: "NUMERIC",
  numeric: "NUMERIC",
  boolean: "BOOLEAN",
  date: "TIMESTAMPTZ",
  timestamptz: "TIMESTAMPTZ",
};

const IDENTIFIER_RE = /^[a-zA-Z0-9_]{1,63}$/;

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
    if (!validEntityName || !IDENTIFIER_RE.test(validEntityName)) continue;

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

    const cleanAppId = appId.replace(/-/g, "_");
    const sanitizedTableName = `app_${cleanAppId}_${validEntityName}`;

    // Process fields with strict identifier validation and type whitelisting
    const sanitizedFields: Record<string, string> = {};
    const columnDefinitions: string[] = [
      `"id" UUID PRIMARY KEY DEFAULT gen_random_uuid()`,
      `"created_at" TIMESTAMPTZ DEFAULT NOW()`
    ];

    if (fields && typeof fields === "object") {
      for (const [fieldName, rawType] of Object.entries(fields as Record<string, unknown>)) {
        const cleanFieldName = String(fieldName).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        if (!cleanFieldName || !IDENTIFIER_RE.test(cleanFieldName)) continue;
        if (cleanFieldName === 'id' || cleanFieldName === 'created_at') continue;

        const stringType = typeof rawType === "string" ? rawType.toLowerCase() : "string";
        const pgType = COLUMN_TYPE_WHITELIST[stringType] || "TEXT";

        sanitizedFields[cleanFieldName] = pgType;
        // Identifiers quoted safely with double quotes (equivalent to format('%I'))
        columnDefinitions.push(`"${cleanFieldName}" ${pgType}`);
      }
    }

    // Try structured RPC call first: execute_app_ddl(app_id, entity_name, fields)
    const { error: structuredErr } = await supabase.rpc('execute_app_ddl', {
      app_id: appId,
      entity_name: validEntityName,
      fields: sanitizedFields
    });

    if (structuredErr) {
      // Fallback to safely parameterized single CREATE TABLE statement if structured overload isn't deployed yet
      const safeDdl = `CREATE TABLE IF NOT EXISTS "${sanitizedTableName}" (${columnDefinitions.join(', ')});`;
      const { error: fallbackErr } = await supabase.rpc('execute_app_ddl', {
        app_id: appId,
        query: safeDdl
      });

      if (fallbackErr) {
        console.error("[syncAppSchema] Failed DDL execution:", fallbackErr);
        return { success: false, message: `Failed to create tables: ${fallbackErr.message}` };
      }
    }

    // Upsert a row in app_schemas after successful DDL using consistent validEntityName
    const { error: upsertError } = await supabase
      .from("app_schemas")
      .upsert(
        {
          app_id: appId,
          table_name: validEntityName,
          schema_definition: sanitizedFields,
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
