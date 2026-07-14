import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET() {
  try {
    throw new Error("🚀 AppForge Global Error Test [Sentry Observability Pipeline Verified]");
  } catch (err) {
    // We explicitly capture and flush the exception for the Development Server 
    // because Next.js sometimes aggressively swallows 500 errors locally to power its fancy red overlay!
    Sentry.captureException(err);
    await Sentry.flush(2000); 
    
    return NextResponse.json({ success: false, error: "Crash forcefully logged to Sentry!" }, { status: 500 });
  }
}
