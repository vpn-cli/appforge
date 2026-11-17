import { createInsforgeServer } from "@/lib/insforge-server";
import { authorizeAppAccess } from "@/lib/app-access";
import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ appId: string; entity: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const { appId, entity } = await params;
  
  const authResult = await authorizeAppAccess(appId, entity, "read");
  if (authResult.error) return authResult.error;

  const { tableName } = authResult;
  const supabase = await createInsforgeServer();

  const url = new URL(request.url);
  const limit = Math.min(Math.max(1, parseInt(url.searchParams.get("limit") || "100", 10)), 1000);
  const orderBy = url.searchParams.get("order") || "created_at";
  const ascending = url.searchParams.get("ascending") === "true";

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .order(orderBy, { ascending })
    .limit(limit);

  if (error) {
    // If table doesn't exist yet in the database, return empty array gracefully
    if (
      error.code === "42P01" ||
      error.code === "PGRST205" ||
      error.message?.includes("does not exist") ||
      error.message?.includes("schema cache")
    ) {
      return NextResponse.json([]);
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
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const supabase = await createInsforgeServer();
  const { data, error } = await supabase.from(tableName).insert(body).select().single();

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
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id") || (body.id as string | undefined);
  if (!id) {
    return NextResponse.json({ error: "Missing record id to update" }, { status: 400 });
  }

  const supabase = await createInsforgeServer();
  const { data, error } = await supabase
    .from(tableName)
    .update(body)
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
