const FARMERS_KEY = 'beejrakshak_local_farmers'
const REGISTRATIONS_KEY = 'beejrakshak_local_registrations'

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function getFarmers() {
  return readJson(FARMERS_KEY, [])
}

function saveFarmers(farmers) {
  writeJson(FARMERS_KEY, farmers)
}

function getRegistrations() {
  return readJson(REGISTRATIONS_KEY, [])
}

function saveRegistrations(regs) {
  writeJson(REGISTRATIONS_KEY, regs)
}

export async function localSignUp(name, mobile) {
  const farmers = getFarmers()
  if (farmers.some((f) => f.mobile === mobile)) {
    return { data: null, error: { code: '23505', message: 'duplicate mobile' } }
  }
  const farmer = {
    id: crypto.randomUUID(),
    name,
    mobile,
    created_at: new Date().toISOString(),
  }
  saveFarmers([...farmers, farmer])
  return { data: farmer, error: null }
}

export async function localLogin(mobile) {
  const farmer = getFarmers().find((f) => f.mobile === mobile) ?? null
  return { data: farmer, error: null }
}

export async function localHasRegistration(userId) {
  return getRegistrations().some((r) => r.user_id === userId)
}

export async function localGetRegistration(userId) {
  return getRegistrations().find((r) => r.user_id === userId) ?? null
}

export async function localUpdateRegistration(userId, partial) {
  const existing = getRegistrations().find((r) => r.user_id === userId)
  if (!existing) return { data: null, error: { message: 'Registration not found.' } }
  const updated = { ...existing, ...partial, user_id: userId, updated_at: new Date().toISOString() }
  const regs = getRegistrations().filter((r) => r.user_id !== userId)
  saveRegistrations([...regs, updated])
  return { data: updated, error: null }
}

export async function localSaveRegistration(userId, data) {
  const row = {
    user_id: userId,
    farmer_name: data.farmerName ?? null,
    aadhaar: data.aadhaar ?? '',
    mobile: data.mobile ?? null,
    preferred_language: data.preferredLanguage ?? null,
    village: data.village ?? null,
    district: data.district ?? null,
    state: data.state ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    land_area: data.landArea != null ? Number(data.landArea) : null,
    land_unit: data.landUnit ?? null,
    primary_crop: data.primaryCrop ?? null,
    crop_stage: data.cropStage ?? null,
    satellite_consent: Boolean(data.satelliteConsent),
    market_preference: data.marketPreference ?? null,
    updated_at: new Date().toISOString(),
  }
  const regs = getRegistrations().filter((r) => r.user_id !== userId)
  saveRegistrations([...regs, row])
  return { ok: true }
}
