import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Status-only database check used by the keep-alive workflow.
// Uses the anon public key instead of the service-role key.
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
    const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ ok: false, error: "Missing config" }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, anonKey);
    const { error } = await supabase.from("apps").select("id").limit(1);
    if (error) {
      return NextResponse.json({ ok: false }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
