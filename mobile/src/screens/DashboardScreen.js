import React, { useEffect, useMemo, useState } from 'react'
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import * as Location from 'expo-location'
import { colors, spacing } from '../theme'
import Section from '../components/Section'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import { useAuth } from '../context/AuthContext'
import { fetchRegistration } from '../lib/registration'
import { config } from '../lib/config'
import { fetchFarmWeatherBundle } from '../lib/farmWeather'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'mandi', label: 'Mandi' },
  { id: 'advisory', label: 'Advisory' },
  { id: 'alerts', label: 'Alerts' },
]

export default function DashboardScreen() {
  const [tab, setTab] = useState('overview')
  const { session } = useAuth()
  const [profile, setProfile] = useState(null)
  const [coords, setCoords] = useState(null)
  const [weather, setWeather] = useState(null)
  const [forecastDays, setForecastDays] = useState([])
  const [weatherLoading, setWeatherLoading] = useState(false)
  // Refresh source data while the app is open so Alerts/Overview stays updated.
  // (This is "autonomous" in-app, not background push notifications.)
  const ALERT_REFRESH_MS = 10 * 60 * 1000
  const [mandiBase, setMandiBase] = useState(null)
  const [mandiOnline, setMandiOnline] = useState(null)
  const [mandisList, setMandisList] = useState([])
  const [availableCrops, setAvailableCrops] = useState([])
  const [selectedCrop, setSelectedCrop] = useState('')
  const [recommendation, setRecommendation] = useState(null)
  const [mandiLoading, setMandiLoading] = useState(false)
  const [mandiError, setMandiError] = useState('')

  const quantity = useMemo(() => {
    if (profile?.land_area) {
      const unit = String(profile.land_unit || 'acre').toLowerCase()
      const area = Number(profile.land_area) || 1
      return Math.round(unit.includes('hectare') ? area * 2500 : area * 1000)
    }
    return 1000
  }, [profile?.land_area, profile?.land_unit])

  useEffect(() => {
    async function loadProfile() {
      if (!session?.id) return
      const data = await fetchRegistration(session.id)
      setProfile(data)
    }
    loadProfile()
  }, [session?.id])

  useEffect(() => {
    let cancelled = false

    async function resolveCoords() {
      if (profile?.latitude && profile?.longitude) {
        setCoords({ lat: Number(profile.latitude), lon: Number(profile.longitude) })
        return
      }

      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          if (!cancelled) setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
          return
        }
      } catch {}

      try {
        const res = await fetch('https://ipapi.co/json/')
        const data = await res.json()
        if (!cancelled && data?.latitude && data?.longitude) {
          setCoords({ lat: data.latitude, lon: data.longitude })
        }
      } catch {}
    }

    resolveCoords()
    return () => { cancelled = true }
  }, [profile?.latitude, profile?.longitude])

  useEffect(() => {
    let cancelled = false
    const profileWithCoords = profile
      ? {
          ...profile,
          latitude: profile.latitude ?? coords?.lat,
          longitude: profile.longitude ?? coords?.lon,
        }
      : coords
        ? { latitude: coords.lat, longitude: coords.lon }
        : null

    if (!profileWithCoords?.latitude && !profileWithCoords?.longitude && !profileWithCoords?.village) {
      return undefined
    }

    async function loadWeather() {
      setWeatherLoading(true)
      try {
        const { weather: current, forecast } = await fetchFarmWeatherBundle(profileWithCoords)
        if (!cancelled) {
          setWeather(current)
          setForecastDays(buildForecastDays(forecast?.list || []))
        }
      } catch {
        if (!cancelled) setForecastDays([])
      } finally {
        if (!cancelled) setWeatherLoading(false)
      }
    }

    loadWeather()
    const timer = setInterval(loadWeather, ALERT_REFRESH_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [
    profile?.latitude,
    profile?.longitude,
    profile?.village,
    profile?.district,
    profile?.state,
    coords?.lat,
    coords?.lon,
  ])

  useEffect(() => {
    let cancelled = false
    const base = (config.MANDI_API_BASE || 'http://localhost:8000/mandi').replace(/\/$/, '')

    async function initMandi() {
      setMandiLoading(true)
      setMandiError('')
      let resolvedBase = base
      try {
        let healthRes = await fetch(`${base}/health`)
        if (!healthRes.ok && !base.endsWith('/mandi')) {
          const fallback = `${base}/mandi`
          healthRes = await fetch(`${fallback}/health`)
          if (healthRes.ok) resolvedBase = fallback
        }
        if (!healthRes.ok) throw new Error('API not reachable')
        const health = await healthRes.json()
        const modelsLoaded = typeof health.models_loaded === 'boolean' ? health.models_loaded : null
        if (modelsLoaded === false) throw new Error('ML models not loaded yet')
        if (!cancelled) {
          setMandiOnline(true)
          setMandiBase(resolvedBase)
        }

        const mandisRes = await fetch(`${resolvedBase}/mandis`)
        if (mandisRes.ok) {
          const mData = await mandisRes.json()
          const list = mData.mandis || []
          const crops = [...new Set(list.flatMap((m) => m.available_crops || []))]
          if (!cancelled) {
            setMandisList(list)
            setAvailableCrops(crops)
            const farmerCrop = profile?.primary_crop ? cap(profile.primary_crop) : ''
            if (crops.includes(farmerCrop)) setSelectedCrop(farmerCrop)
            else if (crops.length) setSelectedCrop(crops[0])
          }
        }
      } catch (e) {
        if (!cancelled) {
          setMandiOnline(false)
          setMandiError(e?.message || 'Mandi API offline')
        }
      } finally {
        if (!cancelled) setMandiLoading(false)
      }
    }

    initMandi()
    return () => { cancelled = true }
  }, [profile?.primary_crop])

  useEffect(() => {
    let cancelled = false
    if (!mandiBase || !selectedCrop || !quantity) return

    async function loadRecommendation() {
      setMandiLoading(true)
      setMandiError('')
      try {
        const body = {
          crop: selectedCrop,
          quantity,
        }
        if (profile?.latitude && profile?.longitude) {
          body.latitude = Number(profile.latitude)
          body.longitude = Number(profile.longitude)
        }
        if (profile?.village || profile?.district) {
          body.farmer_location = profile?.village || profile?.district
        }
        const res = await fetch(`${mandiBase}/response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.detail || `Request failed (${res.status})`)
        }
        const data = await res.json()
        if (!cancelled) setRecommendation(data)
      } catch (e) {
        if (!cancelled) setMandiError(e?.message || 'Failed to get recommendation')
      } finally {
        if (!cancelled) setMandiLoading(false)
      }
    }

    loadRecommendation()
    const timer = setInterval(loadRecommendation, ALERT_REFRESH_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [mandiBase, selectedCrop, quantity, profile?.latitude, profile?.longitude, profile?.village, profile?.district])

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Header />
        <SearchBar />
        <View style={styles.tabsRow}>
          {TABS.map((t) => (
            <TouchableOpacity key={t.id} onPress={() => setTab(t.id)} style={[styles.tabPill, tab === t.id && styles.tabPillActive]}>
              <Text style={[styles.tabLabel, tab === t.id && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'overview' && (
          <OverviewTab
            profile={profile}
            weather={weather}
            forecastDays={forecastDays}
            recommendation={recommendation}
            weatherLoading={weatherLoading}
          />
        )}
        {tab === 'mandi' && (
          <MandiTab
            profile={profile}
            mandisList={mandisList}
            availableCrops={availableCrops}
            selectedCrop={selectedCrop}
            setSelectedCrop={setSelectedCrop}
            recommendation={recommendation}
            loading={mandiLoading}
            error={mandiError}
            online={mandiOnline}
            quantity={quantity}
          />
        )}
        {tab === 'advisory' && (
          <AdvisoryTab
            profile={profile}
            weather={weather}
            forecastDays={forecastDays}
          />
        )}
        {tab === 'alerts' && (
          <AlertsTab
            profile={profile}
            recommendation={recommendation}
            weather={weather}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>BR</Text>
        </View>
        <View>
          <Text style={styles.title}>Cropwise</Text>
          <Text style={styles.subtitle}>AgriTech Intelligence</Text>
        </View>
      </View>
      <View style={styles.profile}>
        <Text style={styles.profileText}>HM</Text>
      </View>
    </View>
  )
}

function SearchBar() {
  return (
    <View style={styles.searchWrap}>
      <TextInput
        style={styles.search}
        placeholder="Search mandis, alerts, advisories"
        placeholderTextColor="#7FB69B"
      />
    </View>
  )
}

function OverviewTab({ profile, weather, forecastDays, recommendation, weatherLoading }) {
  const cropLabel = profile?.primary_crop ? cap(profile.primary_crop) : 'Onion'
  const stageLabel = profile?.crop_stage ? cap(profile.crop_stage) : 'Vegetative'
  const riskLabel = weather?.main?.temp > 35 ? 'High' : weather?.main?.temp > 30 ? 'Moderate' : 'Low'
  const best = recommendation?.best_option
  const locationName = weather?.name || profile?.village || profile?.district || 'your area'

  return (
    <View>
      <View style={styles.statsRow}>
        <StatCard label="Crop" value={cropLabel} />
        <StatCard label="Stage" value={stageLabel} />
        <StatCard label="Risk" value={riskLabel} accent={riskLabel !== 'Low'} />
      </View>
      <Section title="Mandi Intelligence" subtitle="Price forecasts for Onion, Tomato, Potato">
        <MandiCard best={best} />
      </Section>
      <Section title="Weather Outlook" subtitle={`Next 3 days farmcast · ${locationName}`}>
        {weatherLoading ? (
          <View style={styles.inlineLoader}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.inlineLoaderText}>Loading weather...</Text>
          </View>
        ) : (
          <WeatherRow days={forecastDays} />
        )}
      </Section>
    </View>
  )
}

function MandiTab({ profile, mandisList, availableCrops, selectedCrop, setSelectedCrop, recommendation, loading, error, online, quantity }) {
  const best = recommendation?.best_option
  const crops = availableCrops.length ? availableCrops : ['Onion', 'Tomato', 'Potato']

  return (
    <View>
      <Section title="Best Mandi Today" subtitle="Profit-optimized recommendation" action="">
        {loading ? (
          <View style={styles.inlineLoader}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.inlineLoaderText}>Fetching recommendations...</Text>
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{online === false ? 'Mandi API offline.' : error}</Text>
        ) : (
          <MandiCard best={best} quantity={quantity} />
        )}
      </Section>
      <Section title="Available Crops" subtitle="From ML dataset" action="">
        <View style={styles.pillRow}>
          {crops.map((crop) => (
            <TouchableOpacity key={crop} onPress={() => setSelectedCrop(crop)}>
              <Badge label={crop} tone={crop === selectedCrop ? 'accent' : 'muted'} />
            </TouchableOpacity>
          ))}
        </View>
      </Section>
      <Section title="Mandis" subtitle={`${mandisList.length} mandis loaded`} action="">
        {mandisList.map((m, idx) => (
          <View key={`${m.mandi_name}-${idx}`} style={styles.mandiMini}>
            <View>
              <Text style={styles.mandiName}>{m.mandi_name}</Text>
              <Text style={styles.mandiMeta}>{m.distance_km?.toFixed?.(0) || '?'} km · {m.record_count || 0} records</Text>
            </View>
            <View style={styles.mandiTags}>
              {(m.available_crops || []).map((c) => (
                <Badge key={`${m.mandi_name}-${c}`} label={c} tone={c === selectedCrop ? 'accent' : 'muted'} />
              ))}
            </View>
          </View>
        ))}
      </Section>
    </View>
  )
}

function AdvisoryTab({ profile, weather, forecastDays }) {
  const locationName = weather?.name || profile?.village || profile?.district || 'your area'
  const temp = weather?.main?.temp
  const wind = weather?.wind?.speed ? (weather.wind.speed * 3.6) : null
  const advisoryText = temp
    ? `Current ${temp.toFixed(1)}°C in ${locationName}. ${temp > 32 ? 'Avoid midday spray.' : 'Good window for field tasks.'}`
    : 'Weather insights will appear once data is available.'

  return (
    <View>
      <Section title="Weekly Guidance" subtitle="Actionable advice" action="">
        <View style={styles.advisoryCard}>
          <Text style={styles.cardTitle}>Field Tasks</Text>
          <Text style={styles.advisoryText}>{advisoryText}</Text>
          <View style={styles.pillRow}>
            <Badge label="Irrigation" tone="accent" />
            <Badge label="Spray" tone={wind && wind > 15 ? 'warn' : 'muted'} />
            <Badge label="Harvest" />
          </View>
        </View>
      </Section>
      <Section title="Recommended Crops" subtitle="Based on this week">
        <View style={styles.pillRow}>
          <Badge label="Onion" tone="accent" />
          <Badge label="Tomato" />
          <Badge label="Potato" />
        </View>
      </Section>
    </View>
  )
}

function AlertsTab({ profile, recommendation, weather }) {
  const temp = weather?.main?.temp
  const heatStatus = temp > 35 ? 'High' : temp > 30 ? 'Moderate' : 'Low'
  const heatDetail = temp ? `Temperature at ${temp.toFixed(1)}°C.` : 'No temperature data yet.'
  const best = recommendation?.best_option

  return (
    <View>
      <Section title="Latest Alerts" subtitle="From sensors + ML" action="">
        <AlertItem label="Heat Stress" status={heatStatus} tone={heatStatus === 'High' ? 'warn' : 'accent'} detail={heatDetail} />
        <AlertItem
          label="Mandi Price Window"
          status={best ? 'Active' : 'Standby'}
          tone={best ? 'accent' : 'muted'}
          detail={best ? `${best.mandi_name} offers ₹${Math.round(best.current_price)}/kg today.` : 'Waiting for mandi data.'}
        />
        <AlertItem label="Rain Watch" status={forecastDaysFromWeather(weather) ? 'Low' : 'Standby'} detail="Monitor upcoming rainfall in the forecast." />
      </Section>
    </View>
  )
}

function MandiCard({ best, quantity = 1000 }) {
  if (!best) {
    return (
      <View style={styles.mandiCard}>
        <View>
          <Text style={styles.cardTitle}>Best Mandi Today</Text>
          <Text style={styles.cardValue}>Loading...</Text>
          <Text style={styles.cardMeta}>Fetching latest recommendation</Text>
        </View>
      </View>
    )
  }

  const net = best.net_profit != null ? `Net ₹${Math.round(best.net_profit).toLocaleString('en-IN')}` : 'Net —'
  const price = best.current_price != null ? `₹${Number(best.current_price).toFixed(0)}/kg` : '₹—/kg'

  return (
    <View style={styles.mandiCard}>
      <View>
        <Text style={styles.cardTitle}>{best.mandi_name}</Text>
        <Text style={styles.cardValue}>{price}</Text>
        <Text style={styles.cardMeta}>{best.distance_km?.toFixed?.(0) || '?'} km · {net} · {quantity} kg</Text>
      </View>
      <View style={styles.mandiBadge}>
        <Text style={styles.mandiBadgeText}>ML</Text>
      </View>
    </View>
  )
}

function WeatherRow({ days = [] }) {
  if (!days.length) {
    return (
      <View style={styles.weatherRow}>
        <WeatherCard day="Today" temp="—" status="No data" />
        <WeatherCard day="Tomorrow" temp="—" status="No data" />
        <WeatherCard day="Next" temp="—" status="No data" />
      </View>
    )
  }
  return (
    <View style={styles.weatherRow}>
      {days.map((d) => (
        <WeatherCard key={d.day} day={d.day} temp={`${Math.round(d.temp)}°`} status={d.status} />
      ))}
    </View>
  )
}

function WeatherCard({ day, temp, status }) {
  return (
    <View style={styles.weatherCard}>
      <Text style={styles.weatherDay}>{day}</Text>
      <Text style={styles.weatherTemp}>{temp}</Text>
      <Text style={styles.weatherStatus}>{status}</Text>
    </View>
  )
}

function AlertItem({ label, status, tone, detail }) {
  const toneStyle =
    tone === 'warn'
      ? { backgroundColor: '#2A2216', borderColor: '#6B4E1B', color: colors.warn }
      : tone === 'accent'
      ? { backgroundColor: '#143126', borderColor: '#1F5B43', color: colors.accent }
      : { backgroundColor: colors.cardLight, borderColor: colors.border, color: colors.textMuted }

  return (
    <View style={[styles.alertItem, { borderColor: toneStyle.borderColor, backgroundColor: toneStyle.backgroundColor }]}> 
      <View>
        <Text style={styles.alertLabel}>{label}</Text>
        <Text style={styles.alertDetail}>{detail}</Text>
      </View>
      <Text style={[styles.alertStatus, { color: toneStyle.color }]}>{status}</Text>
    </View>
  )
}

function buildForecastDays(list) {
  if (!Array.isArray(list) || list.length === 0) return []
  const buckets = {}
  list.forEach((item) => {
    const date = item.dt_txt?.split(' ')[0]
    if (!date) return
    if (!buckets[date]) buckets[date] = []
    buckets[date].push(item)
  })

  const days = Object.keys(buckets).slice(0, 3).map((date) => {
    const entries = buckets[date]
    const avgTemp = entries.reduce((sum, e) => sum + (e.main?.temp || 0), 0) / entries.length
    const main = entries[0]?.weather?.[0]?.description || 'Clear'
    const dayLabel = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' })
    return { day: dayLabel, temp: avgTemp, status: cap(main) }
  })
  return days
}

function cap(text) {
  if (!text) return ''
  return String(text).replace(/\b\w/g, (m) => m.toUpperCase())
}

function forecastDaysFromWeather(current) {
  return Boolean(current)
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: colors.text, fontWeight: '700' },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 12 },
  profile: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileText: { color: colors.text, fontWeight: '600' },
  searchWrap: { marginBottom: 16 },
  search: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  tabPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  tabPillActive: { backgroundColor: '#103126', borderColor: colors.accent },
  tabLabel: { color: colors.textMuted, fontSize: 12 },
  tabLabelActive: { color: colors.accent, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  mandiCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  mandiBadge: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#143126', alignItems: 'center', justifyContent: 'center' },
  mandiBadgeText: { color: colors.accent, fontWeight: '700' },
  cardTitle: { color: colors.textMuted, fontSize: 12 },
  cardValue: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 4 },
  cardMeta: { color: colors.textMuted, fontSize: 11, marginTop: 6 },
  weatherRow: { flexDirection: 'row', gap: 12 },
  weatherCard: { flex: 1, backgroundColor: colors.cardLight, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  weatherDay: { color: colors.textMuted, fontSize: 12 },
  weatherTemp: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 6 },
  weatherStatus: { color: colors.textMuted, fontSize: 11, marginTop: 4, textAlign: 'center' },
  advisoryCard: { backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  advisoryText: { color: colors.text, fontSize: 13, marginTop: 8, lineHeight: 18 },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  alertItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  alertLabel: { color: colors.text, fontSize: 14, fontWeight: '600' },
  alertDetail: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  alertStatus: { fontSize: 12, fontWeight: '700' },
  errorText: { color: '#FCA5A5', fontSize: 12, marginTop: 8 },
  inlineLoader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inlineLoaderText: { color: colors.textMuted, fontSize: 12 },
  mandiMini: { backgroundColor: colors.cardLight, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  mandiName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  mandiMeta: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  mandiTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
})
