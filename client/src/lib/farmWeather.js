/**
 * Farm weather: OpenWeatherMap when VITE_OPENWEATHER_API_KEY is set,
 * otherwise Open-Meteo (no API key, free for non-commercial use).
 */

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse'
const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast'
const OPEN_METEO_AIR = 'https://air-quality-api.open-meteo.com/v1/air-quality'

function hasValidCoords(lat, lon) {
  const la = Number(lat)
  const lo = Number(lon)
  return Number.isFinite(la) && Number.isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180
}

export function formatFarmLocationName(profile, geo = null) {
  const parts = [profile?.village, profile?.district, profile?.state].filter(Boolean)
  if (parts.length) return parts.join(', ')
  if (geo) {
    const geoParts = [geo.name, geo.admin2 || geo.admin1, geo.country].filter(Boolean)
    if (geoParts.length) return geoParts.join(', ')
  }
  return 'Your farm'
}

async function safeFetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) return null
  return res.json()
}

function pickIndiaResult(results, stateHint) {
  if (!results?.length) return null
  const inResults = results.filter(
    (r) => r.country_code === 'IN' || /india/i.test(r.country || ''),
  )
  const pool = inResults.length ? inResults : results
  if (stateHint) {
    const hint = stateHint.toLowerCase()
    const stateMatch = pool.find((r) =>
      [r.admin1, r.admin2, r.admin3].some((part) => {
        if (!part) return false
        const p = String(part).toLowerCase()
        return p.includes(hint) || hint.includes(p)
      }),
    )
    if (stateMatch) return stateMatch
  }
  return pool[0] ?? null
}

async function reverseGeocode(lat, lon) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'json',
    addressdetails: '1',
    'accept-language': 'en',
  })
  try {
    const res = await fetch(`${NOMINATIM_REVERSE_URL}?${params}`, {
      headers: { 'User-Agent': 'CropWise/1.0 (farm weather)' },
    })
    if (!res.ok) return null
    const data = await res.json()
    const addr = data?.address
    if (!addr) return null
    return {
      name: addr.village || addr.town || addr.city || addr.suburb || addr.county || data.name,
      admin1: addr.state || addr.region || null,
      admin2: addr.state_district || addr.county || null,
      country: addr.country || 'India',
      country_code: (addr.country_code || 'IN').toUpperCase(),
      latitude: lat,
      longitude: lon,
    }
  } catch {
    return null
  }
}

async function forwardGeocode(queries, stateHint) {
  for (const q of queries) {
    if (!q?.trim()) continue
    const params = new URLSearchParams({
      name: q.trim(),
      count: '8',
      language: 'en',
      format: 'json',
      countryCode: 'IN',
    })
    const data = await safeFetchJson(`${GEOCODE_URL}?${params}`)
    const match = pickIndiaResult(data?.results ?? [], stateHint)
    if (match) return match
  }
  return null
}

export async function resolveFarmCoords(profile) {
  const lat = profile?.latitude
  const lon = profile?.longitude

  if (hasValidCoords(lat, lon)) {
    const geo = await reverseGeocode(Number(lat), Number(lon))
    return {
      lat: Number(lat),
      lon: Number(lon),
      name: formatFarmLocationName(profile, geo),
      geo,
    }
  }

  // Open-Meteo search works best with short place names — not "Village, District, India".
  const queries = [
    profile?.village,
    profile?.district,
    [profile?.village, profile?.district].filter(Boolean).join(' '),
    [profile?.district, profile?.state].filter(Boolean).join(' '),
    profile?.state,
    'Gandhinagar',
  ].filter((q) => q?.trim())

  const geo = await forwardGeocode(queries, profile?.state)
  if (!geo) {
    throw new Error(
      'No coordinates found for your farm. Update your village, district, and state in your profile, or capture GPS location during registration.',
    )
  }

  return {
    lat: geo.latitude,
    lon: geo.longitude,
    name: formatFarmLocationName(profile, geo),
    geo,
  }
}

function wmoDescription(code) {
  if (code === 0) return 'Clear sky'
  if (code === 1) return 'Mainly clear'
  if (code === 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if (code <= 48) return 'Fog'
  if (code <= 57) return 'Drizzle'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Rain showers'
  if (code <= 86) return 'Snow showers'
  if (code >= 95) return 'Thunderstorm'
  return 'Weather'
}

function wmoIcon(code, day) {
  const s = day ? 'd' : 'n'
  if (code === 0 || code === 1) return `01${s}`
  if (code === 2) return `02${s}`
  if (code === 3) return `04${s}`
  if (code <= 48) return `50${s}`
  if (code <= 57) return `09${s}`
  if (code <= 67) return `10${s}`
  if (code <= 77) return `13${s}`
  if (code <= 82) return `09${s}`
  return `11${s}`
}

function meteoLocalIsoToUnix(iso, utcOffsetSeconds) {
  if (!iso) return Math.floor(Date.now() / 1000)
  if (iso.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(iso)) {
    return Math.floor(new Date(iso).getTime() / 1000)
  }
  const off = Number(utcOffsetSeconds) || 0
  const sign = off >= 0 ? '+' : '-'
  const abs = Math.abs(off)
  const hh = String(Math.floor(abs / 3600)).padStart(2, '0')
  const mm = String(Math.floor((abs % 3600) / 60)).padStart(2, '0')
  return Math.floor(new Date(`${iso}${sign}${hh}:${mm}`).getTime() / 1000)
}

function mapOpenMeteoHourlyToOwmList(data) {
  const h = data.hourly
  if (!h?.time?.length) return []
  const off = data.utc_offset_seconds ?? 0
  return h.time.map((t, i) => {
    const dt = meteoLocalIsoToUnix(t, off)
    const timePart = t.split('T')[1] || '12:00'
    const localH = parseInt(timePart.split(':')[0], 10) || 0
    const day = localH >= 6 && localH < 20
    const code = h.weather_code[i] ?? 0
    const windKmh = h.wind_speed_10m[i] ?? 0
    const precip = h.precipitation[i] ?? 0
    const popPct = h.precipitation_probability?.[i] ?? 0
    return {
      dt,
      dt_txt: t.replace('T', ' '),
      main: {
        temp: h.temperature_2m[i],
        humidity: h.relative_humidity_2m[i],
      },
      wind: { speed: windKmh / 3.6, deg: h.wind_direction_10m[i] ?? 0 },
      weather: [{ icon: wmoIcon(code, day), description: wmoDescription(code) }],
      clouds: { all: h.cloud_cover[i] ?? 0 },
      pop: popPct / 100,
      rain: precip > 0.01 ? { '3h': Math.min(precip * 3, 50) } : undefined,
    }
  })
}

function mapOpenMeteoCurrent(data, locationName) {
  const c = data.current
  const daily = data.daily
  const off = data.utc_offset_seconds ?? 0
  let sunrise = Math.floor(Date.now() / 1000)
  let sunset = sunrise + 43200
  if (daily?.sunrise?.[0]) sunrise = meteoLocalIsoToUnix(daily.sunrise[0], off)
  if (daily?.sunset?.[0]) sunset = meteoLocalIsoToUnix(daily.sunset[0], off)
  const code = c.weather_code ?? 0
  const hour = new Date().getHours()
  const day = hour >= 6 && hour < 20
  return {
    coord: { lat: data.latitude, lon: data.longitude },
    name: locationName,
    main: {
      temp: c.temperature_2m,
      feels_like: c.apparent_temperature ?? c.temperature_2m,
      humidity: c.relative_humidity_2m,
      pressure: Math.round(c.pressure_msl ?? 1013),
    },
    wind: {
      speed: (c.wind_speed_10m ?? 0) / 3.6,
      deg: c.wind_direction_10m ?? 0,
    },
    clouds: { all: c.cloud_cover ?? 0 },
    visibility: 10000,
    weather: [{ icon: wmoIcon(code, day), description: wmoDescription(code) }],
    sys: { sunrise, sunset },
  }
}

function mapOpenMeteoAirQuality(raw) {
  const c = raw?.current
  if (!c) return null
  const pm25 = c.pm2_5 ?? 0
  const aqi = c.us_aqi ?? (pm25 > 100 ? 4 : pm25 > 50 ? 3 : pm25 > 25 ? 2 : 1)
  return {
    list: [
      {
        main: { aqi: Math.min(5, Math.max(1, Math.ceil(aqi / 20))) },
        components: {
          pm2_5: pm25,
          pm10: c.pm10 ?? 0,
          o3: c.ozone ?? 0,
        },
      },
    ],
  }
}

async function fetchOpenMeteoAirQuality(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: 'auto',
    current: 'pm10,pm2_5,ozone,us_aqi',
  })
  const raw = await safeFetchJson(`${OPEN_METEO_AIR}?${params}`)
  return mapOpenMeteoAirQuality(raw)
}

async function fetchOpenMeteoBundle(profile) {
  const { lat, lon, name } = await resolveFarmCoords(profile)
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: 'auto',
    forecast_days: '5',
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'weather_code',
      'cloud_cover',
      'wind_speed_10m',
      'wind_direction_10m',
      'pressure_msl',
    ].join(','),
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'weather_code',
      'cloud_cover',
      'wind_speed_10m',
      'wind_direction_10m',
      'precipitation',
      'precipitation_probability',
    ].join(','),
    daily: 'sunrise,sunset',
  })
  const raw = await safeFetchJson(`${OPEN_METEO_FORECAST}?${params}`)
  if (!raw) throw new Error('Weather service unavailable (Open-Meteo).')
  const airQuality = await fetchOpenMeteoAirQuality(lat, lon)
  return {
    weather: mapOpenMeteoCurrent(raw, name),
    forecast: { list: mapOpenMeteoHourlyToOwmList(raw) },
    airQuality,
    location: { lat, lon, name },
  }
}

function buildOpenWeatherQuery(profile) {
  const lat = profile?.latitude
  const lon = profile?.longitude
  if (hasValidCoords(lat, lon)) return `lat=${Number(lat)}&lon=${Number(lon)}`
  const q = [profile?.village, profile?.district, profile?.state, 'IN']
    .filter(Boolean)
    .join(',')
  return `q=${encodeURIComponent(q || 'Gandhinagar,Gujarat,IN')}`
}

async function fetchOpenWeatherBundle(profile, apiKey) {
  const params = buildOpenWeatherQuery(profile)
  const [cRes, fRes] = await Promise.all([
    fetch(`https://api.openweathermap.org/data/2.5/weather?${params}&appid=${apiKey}&units=metric`),
    fetch(`https://api.openweathermap.org/data/2.5/forecast?${params}&appid=${apiKey}&units=metric`),
  ])
  if (!cRes.ok || !fRes.ok) {
    const t = await cRes.text().catch(() => '')
    throw new Error(t || 'OpenWeatherMap request failed')
  }
  const weather = await cRes.json()
  const forecast = await fRes.json()
  weather.name = formatFarmLocationName(profile, {
    name: weather.name,
    admin1: profile?.state,
    country: 'India',
  })
  let airQuality = null
  const aLat = weather.coord?.lat
  const aLon = weather.coord?.lon
  if (aLat != null && aLon != null) {
    const aRes = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${aLat}&lon=${aLon}&appid=${apiKey}`,
    )
    if (aRes.ok) airQuality = await aRes.json()
  }
  return {
    weather,
    forecast,
    airQuality,
    location: {
      lat: aLat,
      lon: aLon,
      name: weather.name,
    },
  }
}

/**
 * @returns {Promise<{ weather: object, forecast: { list: array }, airQuality: object | null, location: object }>}
 */
export async function fetchFarmWeatherBundle(profile) {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY?.trim()
  if (apiKey) {
    try {
      return await fetchOpenWeatherBundle(profile, apiKey)
    } catch (e) {
      console.warn('[farmWeather] OpenWeather failed, using Open-Meteo', e)
    }
  }
  return fetchOpenMeteoBundle(profile)
}
