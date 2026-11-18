export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");

    // Fail loudly at startup if SUPABASE_SERVICE_ROLE_KEY is missing in server runtime.
    // Anon-key fallback has been permanently removed; missing service role key prevents server operation.
    if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error(
          "FATAL STARTUP ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is missing. " +
          "Server-side database operations require the service role key. Anon-key fallback has been permanently removed."
        );
      }
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
