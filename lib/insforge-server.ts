import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createInsforgeServer() {
  const serviceRoleKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (or TEST_SUPABASE_SERVICE_ROLE_KEY) is required for server database operations. Missing or empty service role key."
    );
  }

  const supabaseUrl = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_INSFORGE_URL;
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_INSFORGE_URL (or TEST_SUPABASE_URL) is missing.");
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
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}
