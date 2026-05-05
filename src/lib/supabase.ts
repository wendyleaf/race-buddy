import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

// Browser/anon client — read-only when RLS is enabled
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server client — uses service role key when available, falls back to anon
// for local dev. Use this for server-side writes (API routes, scripts).
export function createServerClient() {
  const key = supabaseServiceKey || supabaseAnonKey
  return createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
