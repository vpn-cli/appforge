import { createInsforgeServer } from "@/lib/insforge-server";
import { authorizeAppAccess } from "@/lib/app-access";
import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ appId: string; entity: string }>;
};

/**
 * Normalizes request payload keys to lowercase alphanumeric/underscore,
 * matching PostgreSQL column normalization in execute_app_ddl and actions/schema.ts.
 */
function normalizePayload(payload: unknown): Record<string, unknown> | Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.map((item) =>
      typeof item === "object" && item !== null
        ? (normalizePayload(item) as Record<string, unknown>)
        : {}
    );
  }
  if (typeof payload === "object" && payload !== null) {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
      normalized[cleanKey || key.toLowerCase()] = value;
    }
    return normalized;
  }
  return {};
}

export async function GET(request: Request, { params }: RouteParams) {
  const { appId, entity } = await params;
  
  const authResult = await authorizeAppAccess(appId, entity, "read");
  if (authResult.error) return authResult.error;

  const { tableName } = authResult;
  const supabase = await createInsforgeServer();

  const url = new URL(request.url);
  const limit = Math.min(Math.max(1, parseInt(url.searchParams.get("limit") || "100", 10)), 1000);
  const rawOrderBy = url.searchParams.get("order") || "created_at";
  const orderBy = rawOrderBy.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() || "created_at";
  const ascending = url.searchParams.get("ascending") === "true";

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

  const { tableName } = authResult;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const normalizedBody = normalizePayload(body);
  const supabase = await createInsforgeServer();
  const { data, error } = await supabase.from(tableName).insert(normalizedBody).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { appId, entity } = await params;

  const authResult = await authorizeAppAccess(appId, entity, "write");
  if (authResult.error) return authResult.error;

  const { tableName } = authResult;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const normalized = normalizePayload(body);
  const normalizedBody = (Array.isArray(normalized) ? normalized[0] : normalized) || {};
  const url = new URL(request.url);
  const id = url.searchParams.get("id") || (normalizedBody.id as string | undefined);
  if (!id) {
    return NextResponse.json({ error: "Missing record id to update" }, { status: 400 });
  }

  // Remove primary key from update payload to prevent reassigning primary key column
  const { id: _unusedId, ...updateFields } = normalizedBody;

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

  const { tableName } = authResult;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
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
