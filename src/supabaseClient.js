import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Keep the session across reloads, but note that Supabase on its own will
    // refresh a token forever — the idle / absolute limits in lib/session.js
    // are what actually end a session. See that file for the policy.
    persistSession: true,
    autoRefreshToken: true,
    // Needed so invite and password-recovery links in the URL hash are picked up.
    detectSessionInUrl: true,
    storageKey: 'rz.auth',
  },
})
