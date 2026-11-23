import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Status-only database and backend check used by keep-alive workflows.
// Verifies Supabase platform reachability using the anon public key
// without depending on any application data tables (apps, app_schemas, dynamic tables).
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
    const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ ok: false, error: "Missing config" }, { status: 503 });
    }

    const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: anonKey },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
