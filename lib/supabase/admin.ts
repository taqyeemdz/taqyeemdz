// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,          // URL du projet
  process.env.SUPABASE_SERVICE_ROLE_KEY!,         // Service Role Key (⚠️ très sensible)
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
