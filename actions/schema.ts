"use server";
// Acts as a parser for the app config and generates DDL commands for the app
import { createInsforgeServer } from "@/lib/insforge-server";
import { authorizeAppAccess } from "@/lib/app-access";
import { isSandboxAppId } from "@/lib/sandbox";

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

// Postgres limit 63 - 41 prefix chars ("app_<uuid>_") = 22 max entity chars
const ENTITY_MAX_LENGTH = 22;
const COLUMN_MAX_LENGTH = 63;
const ENTITY_IDENTIFIER_RE = /^[a-zA-Z0-9_]{1,22}$/;
const COLUMN_IDENTIFIER_RE = /^[a-zA-Z0-9_]{1,63}$/;

export async function syncAppSchema(appId: string, entities: unknown, userId: string | null) {
  if (isSandboxAppId(appId)) {
    return {
      success: false,
      message: "Sandbox demo and template schemas cannot be synchronized to the database.",
    };
  }

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
    // Enforce 22-char entity name length limit to prevent silent truncation & collision
    if (entityName.length > ENTITY_MAX_LENGTH) {
      return {
        success: false,
        message: `Entity name "${entityName}" exceeds maximum length of ${ENTITY_MAX_LENGTH} characters.`,
      };
    }

    // Sanitize entity name
    const validEntityName = entityName.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    if (!validEntityName || !ENTITY_IDENTIFIER_RE.test(validEntityName)) {
      return {
        success: false,
        message: `Invalid entity name "${entityName}". Must be alphanumeric/underscore only.`,
      };
    }

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

    // Process fields with strict identifier validation and type whitelisting
    const sanitizedFields: Record<string, string> = {};
    const seenColNames = new Map<string, string>();

    if (fields && typeof fields === "object") {
      for (const [fieldName, rawType] of Object.entries(fields as Record<string, unknown>)) {
        if (fieldName.length > COLUMN_MAX_LENGTH) {
          return {
            success: false,
            message: `Column name "${fieldName}" exceeds maximum length of ${COLUMN_MAX_LENGTH} characters.`,
          };
        }

        const cleanFieldName = String(fieldName).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        if (!cleanFieldName || !COLUMN_IDENTIFIER_RE.test(cleanFieldName)) {
          return {
            success: false,
            message: `Invalid column name "${fieldName}". Must be alphanumeric/underscore only.`,
          };
        }
        if (cleanFieldName === 'id' || cleanFieldName === 'created_at') continue;

        // Check for duplicate column collisions (e.g. firstName and first_name)
        const prevField = seenColNames.get(cleanFieldName);
        if (prevField && prevField !== fieldName) {
          return {
            success: false,
            message: `Duplicate column collision: "${fieldName}" and "${prevField}" collapse to the same column "${cleanFieldName}".`,
          };
        }
        seenColNames.set(cleanFieldName, fieldName);

        const stringType = typeof rawType === "string" ? rawType.toLowerCase() : "";
        const pgType = COLUMN_TYPE_WHITELIST[stringType];
        if (!pgType) {
          return {
            success: false,
            message: `Invalid or unknown type "${rawType}" for field "${fieldName}". Allowed types are string, number, boolean, date.`,
          };
        }

        sanitizedFields[cleanFieldName] = pgType;
      }
    }

    // Execute structured RPC call: execute_app_ddl(app_id, entity_name, fields)
    // No raw query string, no string concatenation, no string blacklists
    const { error: ddlError } = await supabase.rpc('execute_app_ddl', {
      app_id: appId,
      entity_name: validEntityName,
      fields: sanitizedFields,
    });

    if (ddlError) {
      console.error("[syncAppSchema] Failed DDL execution:", ddlError);
      return { success: false, message: ddlError.message };
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
