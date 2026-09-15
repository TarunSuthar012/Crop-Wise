import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { config } from './config'

const supabaseUrl = config.SUPABASE_URL
const supabaseAnonKey = config.SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: false,
    autoRefreshToken: false,
  },
})

export function formatSupabaseQueryError(err) {
  if (!err) return 'Something went wrong. Please try again.'
  const m = err.message || String(err)
  if (!supabaseUrl || !supabaseAnonKey) {
    return 'Missing Supabase env: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env.'
  }
  if (/does not exist|schema cache|Could not find the table|relation.*farmers/i.test(m)) {
    return 'Database not set up: in Supabase → SQL Editor, run docs/registration-table.sql (creates the farmers table).'
  }
  if (/Invalid API key|JWT|jwt|Malformed|authorization/i.test(m)) {
    return 'Supabase rejected the API key: copy the anon key from Project Settings → API into mobile/.env.'
  }
  if (/row-level security|RLS|permission denied for table/i.test(m)) {
    return 'Row security blocked access: run docs/registration-table.sql in the SQL editor (includes policies for farmers).'
  }
  return m
}

const SESSION_KEY = 'beejrakshak_session'

export async function getLocalSession() {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.id && parsed?.mobile) return parsed
    return null
  } catch {
    return null
  }
}

export async function setLocalSession(farmer) {
  await AsyncStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      id: farmer.id,
      name: farmer.name,
      mobile: farmer.mobile,
    }),
  )
}

export async function clearLocalSession() {
  await AsyncStorage.removeItem(SESSION_KEY)
}
