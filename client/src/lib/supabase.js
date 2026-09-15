import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const PLACEHOLDER_PATTERNS = [
  /YOUR_PROJECT_REF/i,
  /your-supabase-anon-key/i,
  /example\.com/i,
]

export function isSupabaseConfigured() {
  if (!supabaseUrl?.trim() || !supabaseAnonKey?.trim()) return false
  const combined = `${supabaseUrl} ${supabaseAnonKey}`
  return !PLACEHOLDER_PATTERNS.some((re) => re.test(combined))
}

export const supabase = createClient(
  supabaseUrl || 'http://localhost',
  supabaseAnonKey || 'local-dev-key',
)

/** Maps PostgREST / Supabase errors to actionable messages for login/signup. */
export function formatSupabaseQueryError(err) {
  if (!err) return 'Something went wrong. Please try again.'
  const m = err.message || String(err)
  if (!isSupabaseConfigured()) {
    return 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the repo root .env, run docs/registration-table.sql in Supabase, then restart the dev server.'
  }
  if (/failed to fetch|networkerror|network request failed|load failed/i.test(m)) {
    return 'Cannot reach Supabase. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, your internet connection, and restart the dev server.'
  }
  if (/does not exist|schema cache|Could not find the table|relation.*farmers/i.test(m)) {
    return 'Database not set up: in Supabase → SQL Editor, run docs/registration-table.sql (creates the farmers table and policies).'
  }
  if (/Invalid API key|JWT|jwt|Malformed|authorization/i.test(m)) {
    return 'Supabase rejected the API key: copy the anon key from Project Settings → API into .env and restart the dev server.'
  }
  if (/row-level security|RLS|permission denied for table/i.test(m)) {
    return 'Row security blocked access: run docs/registration-table.sql in the SQL editor (includes policies for farmers).'
  }
  return m
}

// Simple localStorage session (no Supabase Auth needed)
const SESSION_KEY = 'beejrakshak_session'

export function getLocalSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.id && parsed?.mobile) return parsed
    return null
  } catch {
    return null
  }
}

export function setLocalSession(farmer) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    id: farmer.id,
    name: farmer.name,
    mobile: farmer.mobile,
  }))
}

export function clearLocalSession() {
  localStorage.removeItem(SESSION_KEY)
}
