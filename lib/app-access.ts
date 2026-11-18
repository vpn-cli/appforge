import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createInsforgeServer } from "@/lib/insforge-server";
import { rateLimit } from "@/lib/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ENTITY_MAX_LENGTH = 22;
const ENTITY_RE = /^[a-z][a-z0-9_]{0,21}$/;

export type AccessMode = "read" | "write";

export interface AuthorizeOptions {
  skipEntityCheck?: boolean;
  clientIp?: string;
}

export type AuthorizeResult =
  | { error: NextResponse; tableName?: undefined; isOwner?: undefined; schemaDefinition?: undefined }
  | { error?: undefined; tableName: string; isOwner: boolean; schemaDefinition?: Record<string, unknown> };

export async function authorizeAppAccess(
  appId: string,
  entity: string,
  mode: AccessMode,
  options?: AuthorizeOptions
): Promise<AuthorizeResult> {
  // 1. Validate App UUID format
  if (!UUID_RE.test(appId)) {
    return { error: NextResponse.json({ error: "Invalid app id" }, { status: 400 }) };
  }

  // 2. Sanitize and validate entity name (max 22 chars to fit 63-char Postgres identifier limit)
  if (entity.length > ENTITY_MAX_LENGTH) {
    return { error: NextResponse.json({ error: `Invalid entity: maximum length is ${ENTITY_MAX_LENGTH} characters` }, { status: 400 }) };
  }
  const cleanEntity = entity.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
  if (!ENTITY_RE.test(cleanEntity)) {
    return { error: NextResponse.json({ error: "Invalid entity" }, { status: 400 }) };
  }

  // 3. Authenticate user session
  const { userId } = await auth();
  if (!userId) {
    // Writes and DDL operations strictly require authentication
    if (mode !== "read" || options?.skipEntityCheck) {
      return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    // Apply per-IP rate limit on unauthenticated public reads before querying the database
    const ipKey = `proxy_public_read:${options?.clientIp ?? "127.0.0.1"}`;
    const { success, limit, remaining, reset } = await rateLimit.limit(ipKey);
    if (!success) {
      return {
        error: NextResponse.json(
          { error: "Too many requests. Please slow down and try again shortly." },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
            },
          }
        ),
      };
    }
  }

  // 4. Retrieve app metadata
  const supabase = await createInsforgeServer();
  const { data: app, error } = await supabase
    .from("apps")
    .select("id, user_id, published_config")
    .eq("id", appId)
    .maybeSingle();

  if (error) {
    return { error: NextResponse.json({ error: "Server error" }, { status: 500 }) };
  }

  const isOwner = Boolean(userId && app?.user_id === userId);
  const isPublished = app?.published_config != null;

  // 5. Enforce access authorization rules
  // If skipEntityCheck is requested (only for DDL sync in actions/schema.ts),
  // strictly enforce that only the owner with mode='write' can proceed.
  if (options?.skipEntityCheck) {
    if (!app || !isOwner || mode !== "write") {
      return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
    }
  } else {
    // Standard access rule:
    // - App owner has full access (read & write)
    // - Non-owners have read-only access (GET), and strictly ONLY on published apps
    // - Non-owner writes or access to private apps returns 404 (prevents app id enumeration)
    const allowed = isOwner || (mode === "read" && isPublished);
    if (!app || !allowed) {
      return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
    }
  }

  const tableName = `app_${appId.replace(/-/g, "_")}_${cleanEntity}`;

  // 6. Verify entity exists in app_schemas unless explicitly bypassed for DDL creation
  let schemaDefinition: Record<string, unknown> | undefined;
  if (!options?.skipEntityCheck) {
    const { data: schemaRow, error: schemaError } = await supabase
      .from("app_schemas")
      .select("id, schema_definition")
      .eq("app_id", appId)
      .in("table_name", [cleanEntity, tableName])
      .maybeSingle();

    if (schemaError) {
      return { error: NextResponse.json({ error: "Server error" }, { status: 500 }) };
    }

    if (!schemaRow) {
      return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
    }

    schemaDefinition = (schemaRow.schema_definition as Record<string, unknown>) || undefined;
  }

  return { tableName, isOwner, schemaDefinition };
}
