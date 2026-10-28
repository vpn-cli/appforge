import { createInsforgeServer } from "@/lib/insforge-server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Status-only database check used by the keep-alive workflow.
// Returns no row data.
export async function GET() {
  try {
    const supabase = await createInsforgeServer();
    const { error } = await supabase.from("apps").select("id").limit(1);
    if (error) {
      return NextResponse.json({ ok: false }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
