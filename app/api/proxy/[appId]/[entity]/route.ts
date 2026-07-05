import { createInsforgeServer } from "@/lib/insforge-server";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ appId: string, entity: string }> }) {
  const { appId, entity } = await params;
  const supabase = await createInsforgeServer();
  
  const cleanAppId = appId.replace(/-/g, '_');
  const validEntityName = entity.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
  const tableName = `app_${cleanAppId}_${validEntityName}`;

  if (process.env.NODE_ENV === "development") {
    // DEV BYPASS FALLBACK
    return NextResponse.json([{ id: "mock-record-1", name: "Mock Row", _table: tableName }]);
  }

  const { data, error } = await supabase.from(tableName).select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(data);
}

export async function POST(request: Request, { params }: { params: Promise<{ appId: string, entity: string }> }) {
  const { appId, entity } = await params;
  const body = await request.json();
  const supabase = await createInsforgeServer();
  
  const cleanAppId = appId.replace(/-/g, '_');
  const validEntityName = entity.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
  const tableName = `app_${cleanAppId}_${validEntityName}`;

  if (process.env.NODE_ENV === "development") {
    return NextResponse.json({ id: "mock-record-2", ...body, _table: tableName }, { status: 201 });
  }

  const { data, error } = await supabase.from(tableName).insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(data, { status: 201 });
}
