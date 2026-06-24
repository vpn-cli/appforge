import { createBrowserClient } from '@supabase/ssr'

export function createInsforgeClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_INSFORGE_URL!,
    process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!
  )
}
