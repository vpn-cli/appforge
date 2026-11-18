import { createInsforgeServer } from "@/lib/insforge-server";
import { authorizeAppAccess } from "@/lib/app-access";
import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ appId: string; entity: string }>;
};

export type OperationMode = "insert" | "update" | "delete";

export type NormalizeResult =
  | { success: true; data: Record<string, unknown> | Record<string, unknown>[] }
  | { success: false; error: string };

/**
 * Resolves a request key to the exact PostgreSQL column name in the schema,
 * trying direct lowercase, snake_case conversion, and stripped-underscore matching.
 */
function resolveColumn(key: string, allowedColumns: Set<string>): string {
  const direct = key.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
  if (allowedColumns.has(direct)) return direct;

  // Try snake_case conversion (e.g. firstName -> first_name)
  const snake = key
    .replace(/[^a-zA-Z0-9_]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
  if (allowedColumns.has(snake)) return snake;

  // Try stripping underscores (e.g. first_name -> firstname)
  const stripped = direct.replace(/_/g, "");
  if (allowedColumns.has(stripped)) return stripped;

  return direct || key.toLowerCase();
}

function normalizeSingleObject(
  item: Record<string, unknown>,
  allowedColumns: Set<string>,
  entityName: string,
  mode: OperationMode
): { data?: Record<string, unknown>; error?: string } {
  const normalized: Record<string, unknown> = {};
  const seenCleanKeys = new Map<string, string>(); // cleanKey -> raw original key

  for (const [key, value] of Object.entries(item)) {
    const targetCol = resolveColumn(key, allowedColumns);
    const canonicalKey = key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

    // 1. Collision check: reject when two keys collapse to the same column (e.g. firstName + first_name)
    const existingKey = seenCleanKeys.get(targetCol) || seenCleanKeys.get(canonicalKey);
    if (existingKey && existingKey !== key) {
      return {
        error: `Payload contains conflicting keys: '${existingKey}' and '${key}' collapse to the same column '${targetCol}'`,
      };
    }
    seenCleanKeys.set(targetCol, key);
    if (canonicalKey) {
      seenCleanKeys.set(canonicalKey, key);
    }

    // 2. Handle id and created_at:
    // On insert: ignore (strip) so database defaults (gen_random_uuid, NOW()) are used
    // On update/delete: allow id and created_at in body
    if (targetCol === "id" || targetCol === "created_at") {
      if (mode === "insert") {
        continue;
      }
      normalized[targetCol] = value;
      continue;
    }

    // 3. Schema check: return 400 for fields not in the entity schema, not a database error
    if (!allowedColumns.has(targetCol)) {
      return {
        error: `Field '${key}' does not exist in schema for entity '${entityName}'`,
      };
    }

    normalized[targetCol] = value;
  }

  return { data: normalized };
}

/**
 * Normalizes request payload keys to lowercase alphanumeric/underscore,
 * validates against the entity schema, and rejects collapsing duplicate keys.
 * In insert mode, id and created_at are ignored (stripped) to preserve system defaults.
 * In update/delete mode, id and created_at are allowed in request bodies.
 */
export function normalizePayload(
  payload: unknown,
  schemaDefinition: Record<string, unknown> | undefined,
  entityName: string,
  mode: OperationMode = "insert"
): NormalizeResult {
  const allowedColumns = new Set<string>(["id", "created_at"]);
  if (schemaDefinition && typeof schemaDefinition === "object") {
    for (const field of Object.keys(schemaDefinition)) {
      const clean = field.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
      if (clean) allowedColumns.add(clean);
    }
  }

  if (Array.isArray(payload)) {
    const normalizedArray: Record<string, unknown>[] = [];
    for (const item of payload) {
      if (typeof item !== "object" || item === null) {
        return { success: false, error: "Array items must be JSON objects" };
      }
      const res = normalizeSingleObject(item as Record<string, unknown>, allowedColumns, entityName, mode);
      if (res.error) return { success: false, error: res.error };
      normalizedArray.push(res.data!);
    }
    return { success: true, data: normalizedArray };
  }

  if (typeof payload === "object" && payload !== null) {
    const res = normalizeSingleObject(payload as Record<string, unknown>, allowedColumns, entityName, mode);
    if (res.error) return { success: false, error: res.error };
    return { success: true, data: res.data! };
  }

  return { success: false, error: "Payload must be a valid JSON object or array" };
}

export async function GET(request: Request, { params }: RouteParams) {
  const { appId, entity } = await params;
  
  const authResult = await authorizeAppAccess(appId, entity, "read");
  if (authResult.error) return authResult.error;

  const { tableName, schemaDefinition } = authResult;
  const supabase = await createInsforgeServer();

  const url = new URL(request.url);
  const limit = Math.min(Math.max(1, parseInt(url.searchParams.get("limit") || "100", 10)), 1000);
  const rawOrderBy = url.searchParams.get("order") || "created_at";
  const orderBy = rawOrderBy.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() || "created_at";
  const ascending = url.searchParams.get("ascending") === "true";

  // Validate order column against schema definition to prevent database errors
  if (orderBy !== "created_at" && orderBy !== "id") {
    const allowedColumns = new Set<string>(["id", "created_at"]);
    if (schemaDefinition && typeof schemaDefinition === "object") {
      for (const field of Object.keys(schemaDefinition)) {
        const clean = field.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
        if (clean) allowedColumns.add(clean);
      }
    }
    if (!allowedColumns.has(orderBy)) {
      return NextResponse.json(
        { error: `Order field '${rawOrderBy}' does not exist in schema for entity '${entity}'` },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .order(orderBy, { ascending })
    .limit(limit);

  if (error) {
    // If entity is registered in app_schemas but physical table does not exist in Postgres
    if (
      error.code === "42P01" ||
      error.code === "PGRST205" ||
      error.message?.includes("does not exist") ||
      error.message?.includes("schema cache")
    ) {
      return NextResponse.json(
        { error: `Entity table '${entity}' is registered in schema but physical table does not exist` },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request, { params }: RouteParams) {
  const { appId, entity } = await params;

  const authResult = await authorizeAppAccess(appId, entity, "write");
  if (authResult.error) return authResult.error;

  const { tableName, schemaDefinition } = authResult;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const normResult = normalizePayload(body, schemaDefinition, entity, "insert");
  if (!normResult.success) {
    return NextResponse.json({ error: normResult.error }, { status: 400 });
  }

  const supabase = await createInsforgeServer();
  const { data, error } = await supabase.from(tableName).insert(normResult.data).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { appId, entity } = await params;

  const authResult = await authorizeAppAccess(appId, entity, "write");
  if (authResult.error) return authResult.error;

  const { tableName, schemaDefinition } = authResult;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const normResult = normalizePayload(body, schemaDefinition, entity, "update");
  if (!normResult.success) {
    return NextResponse.json({ error: normResult.error }, { status: 400 });
  }

  const normalizedBody = (Array.isArray(normResult.data) ? normResult.data[0] : normResult.data) || {};
  const url = new URL(request.url);
  const id = url.searchParams.get("id") || (normalizedBody.id as string | undefined);
  if (!id) {
    return NextResponse.json({ error: "Missing record id to update" }, { status: 400 });
  }

  // Remove primary key and created_at from update payload to prevent reassigning primary key column or creation timestamp
  const { id: _unusedId, created_at: _unusedCreatedAt, ...updateFields } = normalizedBody;

  const supabase = await createInsforgeServer();
  const { data, error } = await supabase
    .from(tableName)
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  return PUT(request, { params });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { appId, entity } = await params;

  const authResult = await authorizeAppAccess(appId, entity, "write");
  if (authResult.error) return authResult.error;

  const { tableName, schemaDefinition } = authResult;
  const url = new URL(request.url);
  let id = url.searchParams.get("id");

  // Allow id to be supplied in JSON request body for DELETE
  if (!id) {
    try {
      const body = await request.json();
      const normResult = normalizePayload(body, schemaDefinition, entity, "delete");
      if (normResult.success) {
        const normBody = (Array.isArray(normResult.data) ? normResult.data[0] : normResult.data) || {};
        if (normBody.id) {
          id = String(normBody.id);
        }
      }
    } catch {
      // Body is optional on DELETE
    }
  }

  if (!id) {
    return NextResponse.json({ error: "Missing record id to delete" }, { status: 400 });
  }

  const supabase = await createInsforgeServer();
  const { error } = await supabase.from(tableName).delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
