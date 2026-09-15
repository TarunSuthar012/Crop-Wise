import { supabase, isSupabaseConfigured } from './supabase'
import {
  localHasRegistration,
  localSaveRegistration,
  localGetRegistration,
  localUpdateRegistration,
} from './localDb'

const REGISTRATION_TABLE = 'registrations'

const COLUMNS = {
  user_id: 'user_id',
  farmer_name: 'farmer_name',
  aadhaar: 'aadhaar',
  mobile: 'mobile',
  preferred_language: 'preferred_language',
  village: 'village',
  district: 'district',
  state: 'state',
  latitude: 'latitude',
  longitude: 'longitude',
  land_area: 'land_area',
  land_unit: 'land_unit',
  primary_crop: 'primary_crop',
  crop_stage: 'crop_stage',
  satellite_consent: 'satellite_consent',
  market_preference: 'market_preference',
}

/**
 * Check if the user has completed registration (has a row in the table).
 * @param {string} userId - auth.uid()
 * @returns {Promise<boolean>}
 */
export async function hasCompletedRegistration(userId) {
  if (!userId) return false
  if (!isSupabaseConfigured()) return localHasRegistration(userId)
  const { data, error } = await supabase
    .from(REGISTRATION_TABLE)
    .select(COLUMNS.user_id)
    .eq(COLUMNS.user_id, userId)
    .maybeSingle()
  if (error) return false
  return !!data
}

/**
 * Save or update registration for the current user.
 * @param {string} userId - auth.uid()
 * @param {Object} data - form fields mapped to column names
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function loadRegistration(userId) {
  if (!userId) return null
  if (!isSupabaseConfigured()) return localGetRegistration(userId)
  const { data, error } = await supabase
    .from(REGISTRATION_TABLE)
    .select('*')
    .eq(COLUMNS.user_id, userId)
    .maybeSingle()
  if (error) {
    console.error('[registration] load failed', error)
    return null
  }
  return data
}

export async function updateRegistration(userId, partial) {
  if (!userId) return { data: null, error: { message: 'Not signed in.' } }
  if (!isSupabaseConfigured()) return localUpdateRegistration(userId, partial)
  const { data, error } = await supabase
    .from(REGISTRATION_TABLE)
    .update(partial)
    .eq(COLUMNS.user_id, userId)
    .select('*')
    .maybeSingle()
  if (error) return { data: null, error }
  return { data: data || { user_id: userId, ...partial }, error: null }
}

export async function saveRegistration(userId, data) {
  if (!userId) return { ok: false, error: 'Not signed in.' }
  if (!isSupabaseConfigured()) return localSaveRegistration(userId, data)
  const row = {
    [COLUMNS.user_id]: userId,
    [COLUMNS.farmer_name]: data.farmerName ?? null,
    [COLUMNS.aadhaar]: data.aadhaar ?? '',
    [COLUMNS.mobile]: data.mobile ?? null,
    [COLUMNS.preferred_language]: data.preferredLanguage ?? null,
    [COLUMNS.village]: data.village ?? null,
    [COLUMNS.district]: data.district ?? null,
    [COLUMNS.state]: data.state ?? null,
    [COLUMNS.latitude]: data.latitude ?? null,
    [COLUMNS.longitude]: data.longitude ?? null,
    [COLUMNS.land_area]: data.landArea != null ? Number(data.landArea) : null,
    [COLUMNS.land_unit]: data.landUnit ?? null,
    [COLUMNS.primary_crop]: data.primaryCrop ?? null,
    [COLUMNS.crop_stage]: data.cropStage ?? null,
    [COLUMNS.satellite_consent]: Boolean(data.satelliteConsent),
    [COLUMNS.market_preference]: data.marketPreference ?? null,
  }
  const { error } = await supabase
    .from(REGISTRATION_TABLE)
    .upsert(row, { onConflict: COLUMNS.user_id })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
