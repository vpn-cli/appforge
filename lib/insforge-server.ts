import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createInsforgeServer() {
  const isTestEnvironment = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);

  let serviceRoleKey: string | undefined;
  let supabaseUrl: string | undefined;

  if (isTestEnvironment) {
    // In test mode: REQUIRE dedicated test secrets. Fallback to production live keys is strictly prohibited.
    serviceRoleKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
    supabaseUrl = process.env.TEST_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error(
        "Missing test database secrets: TEST_SUPABASE_SERVICE_ROLE_KEY and TEST_SUPABASE_URL are required in test environment. Falling back to live production database keys is strictly forbidden."
      );
    }

    if (supabaseUrl.includes("upljqampxcmhqjszatrp")) {
      throw new Error(
        "SAFETY VIOLATION: TEST_SUPABASE_URL points to live production project 'upljqampxcmhqjszatrp'. Running tests on live database is strictly prohibited."
      );
    }
  } else {
    // In production / development server runtime
    serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;

    if (!serviceRoleKey) {
      throw new Error(
        "FATAL: SUPABASE_SERVICE_ROLE_KEY is required for server database operations. Fallback to anon key is permanently disabled."
      );
    }
    if (!supabaseUrl) {
      throw new Error("NEXT_PUBLIC_INSFORGE_URL is missing.");
    }
  }

  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    // Graceful handling when invoked outside an active Next.js request context (e.g. background job or test runner)
  }

  return createServerClient(
    supabaseUrl,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return cookieStore ? cookieStore.getAll() : [];
        },
        setAll(cookiesToSet) {
          try {
            if (cookieStore) {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore!.set(name, value, options)
              })
            }
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )
}
