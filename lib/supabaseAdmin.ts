import { createClient } from '@supabase/supabase-js'

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  throw new Error('❌ Missing Supabase environment variables')
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // server-side only!
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
