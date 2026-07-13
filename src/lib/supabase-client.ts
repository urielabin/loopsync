import { createClient } from '@supabase/supabase-js'

const url = import.meta.env['VITE_SUPABASE_URL'] as string
const anonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string

if (!url || !anonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set')
}

// No accounts, no auth session -- every client is anonymous, and the
// `rooms` table's RLS policies are deliberately permissive (anyone with a
// room code can read/write it). Safe to expose the anon key; that's the
// entire point of the anon role.
export const supabase = createClient(url, anonKey)
