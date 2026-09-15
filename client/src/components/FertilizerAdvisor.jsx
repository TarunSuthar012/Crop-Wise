import { useEffect, useMemo, useState } from "react";
import { fetchFarmWeatherBundle } from "../lib/farmWeather";
const mandiBase = import.meta.env.VITE_MANDI_API_BASE || "/mandi-api";

/* ── Crop list with Emojis ── */
const CROP_OPTIONS = [
  { value: "Wheat",     emoji: "🌾", gradient: "from-amber-500 to-orange-600" },
  { value: "Rice",      emoji: "🍚", gradient: "from-emerald-500 to-teal-600" },
  { value: "Potato",    emoji: "🥔", gradient: "from-amber-600 to-yellow-700" },
  { value: "Onion",     emoji: "🧅", gradient: "from-red-500 to-rose-600" },
  { value: "Maize",     emoji: "🌽", gradient: "from-yellow-500 to-amber-600" },
  { value: "Groundnut", emoji: "🥜", gradient: "from-orange-500 to-amber-700" },
  { value: "Soybean",   emoji: "🫘", gradient: "from-lime-500 to-emerald-700" },
];

const SEASON_OPTIONS = [
  { value: "Kharif",      emoji: "🌧️", gradient: "from-emerald-500 to-green-600" },
  { value: "Rabi",        emoji: "❄️",  gradient: "from-blue-500 to-indigo-600" },
  { value: "Summer",      emoji: "☀️", gradient: "from-orange-500 to-red-500" },
  { value: "Winter",      emoji: "🌨️", gradient: "from-sky-500 to-blue-600" },
  { value: "Late Kharif", emoji: "🌦️", gradient: "from-teal-500 to-emerald-600" },
];

const NPK_CONFIG = {
  N: { label: "Nitrogen",   emoji: "🟢", color: "from-green-400 to-green-600",   bg: "bg-green-50",  border: "border-green-200", text: "text-green-700" },
  P: { label: "Phosphorus", emoji: "🟠", color: "from-orange-400 to-orange-600", bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
  K: { label: "Potassium",  emoji: "🔵", color: "from-blue-400 to-blue-600",     bg: "bg-blue-50",   border: "border-blue-200",  text: "text-blue-700" },
};

/* ── Helpers ── */
function getCurrentSeason() {
  const m = new Date().getMonth();
  if (m >= 5 && m <= 9) return "kharif";
  if (m >= 10 || m <= 2) return "rabi";
  return "zaid";
}

function normalizeSeasonLabel(seasonKey) {
  const key = String(seasonKey || "").toLowerCase();
  if (key === "kharif") return "Kharif";
  if (key === "rabi") return "Rabi";
  if (key === "zaid") return "Summer";
  return "Kharif";
}

function toLandSizeHa(profile) {
  const area = Number(profile?.land_area ?? 0);
  if (!Number.isFinite(area) || area <= 0) return 1;
  const isAcre = String(profile?.land_unit || "").toLowerCase().includes("acre");
  return isAcre ? area * 0.4047 : area;
}

function inferRainfall(weather) {
  const oneHour = Number(weather?.rain?.["1h"]);
  if (Number.isFinite(oneHour) && oneHour >= 0) return oneHour * 24 * 30;
  const threeHour = Number(weather?.rain?.["3h"]);
  if (Number.isFinite(threeHour) && threeHour >= 0) return threeHour * 8 * 30;
  return 750;
}

function inferNdvi(profile) {
  for (const key of ["ndvi", "latest_ndvi", "sar_ndvi", "ndvi_score"]) {
    const value = Number(profile?.[key]);
    if (Number.isFinite(value) && value >= 0 && value <= 1) return value;
  }
  return 0.4;
}

function normalizeDistrictName(value) {
  const district = String(value || "").trim();
  const aliases = {
    mehasana: "Mehsana",
    ahmedbad: "Ahmedabad",
    banaskanta: "Banaskantha",
  };
  return aliases[district.toLowerCase()] || district;
}

/* ══════════════ COMPONENT ══════════════ */
export default function FertilizerAdvisor({ profile }) {
  /* ── Weather fetching (self-contained) ── */
  const [weather, setWeather] = useState(null);
  const [weatherForecast, setWeatherForecast] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchWeather = async () => {
      setWeatherLoading(true);
      try {
        const { weather: w, forecast } = await fetchFarmWeatherBundle(profile);
        if (!cancelled) {
          setWeather(w);
          setWeatherForecast(forecast);
        }
      } catch {
        if (!cancelled) {
          setWeather(null);
          setWeatherForecast(null);
        }
      }
      finally { if (!cancelled) setWeatherLoading(false); }
    };
    fetchWeather();
    return () => { cancelled = true; };
  }, [profile?.latitude, profile?.longitude, profile?.village, profile?.district, profile?.state]);

  const seasonKey = getCurrentSeason();

  /* ── Form state ── */
  const defaultCrop = useMemo(() => {
    const current = String(profile?.primary_crop || "").trim().toLowerCase();
    const match = CROP_OPTIONS.find((c) => c.value.toLowerCase() === current);
    return match?.value || "Wheat";
  }, [profile?.primary_crop]);

  const [crop, setCrop] = useState(defaultCrop);
  const [season, setSeason] = useState(normalizeSeasonLabel(seasonKey));
  const [landSizeHa, setLandSizeHa] = useState(() =>
    toLandSizeHa(profile).toFixed(2).replace(/\.00$/, ""),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => { setCrop(defaultCrop); }, [defaultCrop]);
  useEffect(() => { setSeason(normalizeSeasonLabel(seasonKey)); }, [seasonKey]);
  useEffect(() => {
    setLandSizeHa(toLandSizeHa(profile).toFixed(2).replace(/\.00$/, ""));
  }, [profile?.land_area, profile?.land_unit]);

  const district = useMemo(
    () => normalizeDistrictName(profile?.district),
    [profile?.district],
  );
  const ndvi = useMemo(() => inferNdvi(profile), [profile]);
  const rainfall = useMemo(() => {
    const forecastRain = (weatherForecast?.list || []).reduce(
      (total, item) => total + Number(item?.rain?.["3h"] || 0),
      0,
    );
    return forecastRain > 0 ? forecastRain : inferRainfall(weather);
  }, [weather, weatherForecast]);

  const currentCrop = CROP_OPTIONS.find((c) => c.value === crop) || CROP_OPTIONS[0];
  const currentSeason = SEASON_OPTIONS.find((s) => s.value === season) || SEASON_OPTIONS[0];

  /* ── API call ── */
  const fetchFertilizerPlan = async () => {
    const area = Number(landSizeHa);
    if (!crop || !season || !district || !Number.isFinite(area) || area <= 0) {
      setError("Please complete your crop, season, district, and a valid land size in registration.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const params = new URLSearchParams({
        crop, season, land_size_ha: String(area), district,
        ndvi: String(ndvi), rainfall: String(rainfall),
      });
      let res = await fetch(`${mandiBase}/api/fertilizer/recommend?${params}`);
      if (res.status === 404) {
       res = await fetch(`${mandiBase}/mandi/api/fertilizer/recommend?${params}`);
      }
      if (!res.ok) {
        const body = await res.text();
        let message = body || `Fertilizer API error (${res.status})`;
        try {
          const parsed = JSON.parse(body);
          message = parsed.detail || message;
        } catch {
          // Preserve the raw response when the server does not return JSON.
        }
        if (res.status === 404 && /not found/i.test(message)) {
          message = "We could not match your district to the soil database. Check the district spelling in your registration.";
        }
        throw new Error(message);
      }
      setResult(await res.json());
    } catch (err) {
      setError(err?.message || "Failed to generate fertilizer plan.");
    } finally {
      setLoading(false);
    }
  };

  /* ── NPK bar max for visual scaling ── */
  const npkMax = result
    ? Math.max(result.npk_per_ha?.N || 0, result.npk_per_ha?.P || 0, result.npk_per_ha?.K || 0, 1)
    : 1;

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <span className="text-3xl">🧪</span> Fertilizer Plan
          </h2>
        </div>
        <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
          <span className="text-sm">{currentSeason.emoji}</span>
          <span className="text-xs font-bold text-emerald-700">{season}</span>
        </span>
      </div>

      {/* ═══ Hero banner ═══ */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.05] rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/[0.03] rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-base">🌿</span> Smart Nutrient Engine
          </p>
          <h3 className="text-xl font-bold mt-2">
            What fertilizer does your crop need?
          </h3>
          <p className="text-emerald-100/70 text-sm mt-2 max-w-xl">
            We analyze <span className="text-white font-semibold">soil data</span> for{" "}
            <span className="text-white font-semibold">{district}</span>,
            live <span className="text-white font-semibold">weather</span> (
            {weather?.main?.temp?.toFixed(0) ?? "--"}°C), and{" "}
            <span className="text-white font-semibold">satellite NDVI</span> to
            recommend precise NPK quantities for your farm.
          </p>
          <div className="flex gap-5 mt-4 text-emerald-200/80 text-sm flex-wrap">
            <span className="flex items-center gap-1.5">📍 {district}</span>
            <span className="flex items-center gap-1.5">🛰️ NDVI: {ndvi.toFixed(2)}</span>
            <span className="flex items-center gap-1.5">🌧️ {rainfall.toFixed(0)} mm</span>
          </div>
        </div>
      </div>

      {/* ═══ Input card ═══ */}
      <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3">
          <span className="text-2xl">📝</span>
          <div>
            <h3 className="font-bold text-stone-800">Plan Your Fertilizer</h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Select crop, season, and land size — we handle the rest automatically
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Crop */}
            <label className="block">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                🌱 Crop
              </span>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all font-medium"
              >
                {CROP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.emoji} {o.value}</option>
                ))}
              </select>
            </label>

            {/* Season */}
            <label className="block">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                📅 Season
              </span>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all font-medium"
              >
                {SEASON_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.emoji} {o.value}</option>
                ))}
              </select>
            </label>

            {/* Land size */}
            <label className="block">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                📐 Land Size (ha)
              </span>
              <input
                type="number"
                min="0.1"
                step="0.01"
                value={landSizeHa}
                onChange={(e) => setLandSizeHa(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all font-medium"
              />
            </label>

            {/* Button */}
            <button
              type="button"
              onClick={fetchFertilizerPlan}
              disabled={loading}
              className="self-end px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Building Plan...
                </>
              ) : (
                <>
                  <span className="text-base">🚀</span>
                  Get Fertilizer Plan
                </>
              )}
            </button>
          </div>

          {/* Auto-detected context bar */}
          <div className="flex items-center gap-4 flex-wrap text-[11px] text-stone-500 bg-stone-50 rounded-xl px-4 py-2.5 border border-stone-100">
            <span className="flex items-center gap-1">
              📍 District: <span className="font-semibold text-stone-700">{district}</span>
            </span>
            <span className="flex items-center gap-1">
              🛰️ NDVI: <span className="font-semibold text-stone-700">{ndvi.toFixed(2)}</span>
            </span>
            <span className="flex items-center gap-1">
              🌧️ Rainfall: <span className="font-semibold text-stone-700">{rainfall.toFixed(0)} mm</span>
            </span>
            <span className="ml-auto text-[10px] italic text-stone-400">
              {weatherLoading ? "Loading weather context..." : "Auto-detected from your profile"}
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm flex items-center gap-2 font-medium">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Results ═══ */}
      {result && (
        <div className="space-y-5 animate-fade-in">
          {/* ── Summary banner ── */}
          <div className="rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 flex items-start gap-4">
            <div className="text-4xl">✅</div>
            <div className="flex-1 mt-1">
              <p className="text-sm font-bold text-emerald-800">{result.summary}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1.5 font-medium text-emerald-700 text-xs">
                  <span className="text-sm">{currentCrop.emoji}</span> {result.crop}
                </span>
                <span className="flex items-center gap-1.5 font-medium text-emerald-700 text-xs">
                  <span className="text-sm">{currentSeason.emoji}</span> {result.season}
                </span>
                <span className="text-xs font-medium text-emerald-700">📐 {result.land_size_ha} ha</span>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider ${
                  result.irrigation_type === "Irrigated"
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-amber-100 text-amber-700 border border-amber-200"
                }`}>
                  {result.irrigation_type === "Irrigated" ? "💧" : "🌾"} {result.irrigation_type}
                </span>
              </div>
            </div>
          </div>

          {/* ── NPK Requirements ── */}
          <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center gap-3">
              <span className="text-2xl">⚗️</span>
              <div>
                <h4 className="font-bold text-stone-800 text-sm">NPK Requirements</h4>
                <p className="text-[10px] text-stone-400">Adjusted for soil, weather, NDVI & irrigation</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {["N", "P", "K"].map((key) => {
                const cfg = NPK_CONFIG[key];
                const perHa = result.npk_per_ha?.[key] || 0;
                const total = result.npk_total_kg?.[key] || 0;
                const pct = Math.min((perHa / npkMax) * 100, 100);
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-3xl ml-1">{cfg.emoji}</span>
                    <div className="flex-1 min-w-0 ml-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-stone-700">{cfg.label} ({key})</span>
                        <span className="text-xs font-semibold text-stone-500">{perHa} kg/ha</span>
                      </div>
                      <div className="h-3 rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${cfg.color} transition-all duration-1000`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-24 text-right shrink-0">
                      <p className="text-sm font-extrabold text-stone-800">{total} <span className="text-[10px] font-medium text-stone-400">kg</span></p>
                      <p className="text-[9px] font-semibold text-stone-400 uppercase tracking-widest">Total</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Fertilizer Products ── */}
          <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center gap-3">
              <span className="text-2xl">🧴</span>
              <div>
                <h4 className="font-bold text-stone-800 text-sm">Fertilizer Products to Buy</h4>
                <p className="text-[10px] text-stone-400">Calculated for {result.land_size_ha} hectares</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { name: "Urea",  emoji: "🟡", value: result.fertilizer_products?.urea_kg, desc: "46% Nitrogen",   bg: "bg-yellow-50",  border: "border-yellow-200" },
                { name: "DAP",   emoji: "🟤", value: result.fertilizer_products?.dap_kg,  desc: "46% Phosphorus", bg: "bg-orange-50", border: "border-orange-200" },
                { name: "MOP",   emoji: "🔴", value: result.fertilizer_products?.mop_kg,  desc: "60% Potassium",  bg: "bg-blue-50",  border: "border-blue-200" },
              ].map((fert) => (
                <div key={fert.name} className={`rounded-2xl ${fert.bg} border ${fert.border} p-6 text-center hover-lift transition-all shadow-sm`}>
                  <div className="text-4xl mb-3 hover:scale-110 transition-transform cursor-default">{fert.emoji}</div>
                  <p className="text-xs text-stone-500 uppercase tracking-widest font-bold">
                    {fert.name}
                  </p>
                  <p className="text-3xl font-black text-stone-800 mt-2 tracking-tight">
                    {fert.value}
                    <span className="text-xs font-bold text-stone-500 ml-1">kg</span>
                  </p>
                  <p className="text-[10px] font-semibold text-stone-400 mt-1 uppercase tracking-wider">{fert.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Application Schedule ── */}
          <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <h4 className="font-bold text-stone-800 text-sm">Application Schedule</h4>
                <p className="text-[10px] text-stone-400">When and how to apply your fertilizers</p>
              </div>
            </div>
            <div className="p-6">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[20px] top-4 bottom-4 w-[3px] bg-stone-100 rounded-full" />
                <div className="space-y-6">
                  {(result.application_schedule || []).map((step, idx) => {
                    const stageEmojis = ["🌱", "🌿", "🌾", "🪴"];
                    return (
                      <div key={`${step.stage}-${idx}`} className="flex gap-5 relative group">
                        <div className="w-11 h-11 rounded-full bg-white border-4 border-stone-100 text-stone-500 text-sm font-bold flex items-center justify-center z-10 shrink-0 shadow-sm group-hover:border-emerald-200 group-hover:bg-emerald-50 transition-colors">
                          <span className="text-lg">{stageEmojis[idx] || "🌿"}</span>
                        </div>
                        <div className="flex-1 rounded-2xl bg-stone-50 border border-stone-100 p-5 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors shadow-sm">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <p className="text-md font-extrabold text-stone-800">{step.stage}</p>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                              <span>⏰</span> {step.timing}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-stone-600 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── Soil Info ── */}
          <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center gap-3">
              <span className="text-2xl">🏔️</span>
              <h4 className="font-bold text-stone-800 text-sm">Soil Information</h4>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="rounded-2xl bg-orange-50 border border-orange-100 p-5 text-center hover-lift shadow-sm">
                  <span className="text-4xl block mb-2">🪨</span>
                  <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mt-2">Soil Type</p>
                  <p className="text-lg font-black text-stone-800 mt-1">{result.soil_type}</p>
                </div>
                <div className="rounded-2xl bg-purple-50 border border-purple-100 p-5 text-center hover-lift shadow-sm">
                  <span className="text-4xl block mb-2">🧪</span>
                  <p className="text-[10px] text-purple-600 font-bold uppercase tracking-widest mt-2">Soil pH</p>
                  <p className="text-lg font-black text-stone-800 mt-1">{result.soil_ph}</p>
                </div>
                <div className="rounded-2xl bg-blue-50 border border-blue-100 p-5 text-center hover-lift shadow-sm">
                  <span className="text-4xl block mb-2">{result.irrigation_type === "Irrigated" ? "💧" : "🌾"}</span>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-2">Irrigation</p>
                  <p className="text-lg font-black text-stone-800 mt-1">{result.irrigation_type}</p>
                </div>
              </div>
              <p className="text-xs font-medium text-stone-500 mt-4 text-center flex items-center justify-center gap-1.5">
                <span>📍</span>
                Based on your location — <span className="font-bold text-stone-700">{result.district}</span> district data
              </p>
            </div>
          </div>

          {/* ── Advisory boxes ── */}
          <div className="space-y-4">
            {/* Soil Advisory - Yellow */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 flex items-start gap-4 shadow-sm">
              <span className="text-2xl mt-0.5">⚠️</span>
              <div>
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">Soil Advisory</p>
                <p className="text-sm font-medium text-amber-900 mt-1.5 leading-relaxed">{result.soil_advisory}</p>
              </div>
            </div>

            {/* Micronutrient Advisory - Orange */}
            {result.micronutrient_advisory && (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 px-6 py-5 flex items-start gap-4 shadow-sm">
                <span className="text-2xl mt-0.5">🔬</span>
                <div>
                  <p className="text-[11px] font-bold text-orange-700 uppercase tracking-widest">Micronutrient Advisory</p>
                  <p className="text-sm font-medium text-orange-900 mt-1.5 leading-relaxed">{result.micronutrient_advisory}</p>
                </div>
              </div>
            )}

            {/* Special Notes - Blue */}
            {result.special_notes && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-6 py-5 flex items-start gap-4 shadow-sm">
                <span className="text-2xl mt-0.5">💡</span>
                <div>
                  <p className="text-[11px] font-bold text-sky-700 uppercase tracking-widest">Special Notes for {result.crop}</p>
                  <p className="text-sm font-medium text-sky-900 mt-1.5 leading-relaxed">{result.special_notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!result && !error && (
        <div className="rounded-3xl bg-white border border-stone-200/80 shadow-sm p-16 text-center">
          <span className="text-6xl mb-6 block animate-bounce-slow">🌾</span>
          <h3 className="text-xl font-black text-stone-800 mt-4 tracking-tight">Ready to plan your fertilizer</h3>
          <p className="text-sm font-medium text-stone-500 mt-3 max-w-md mx-auto leading-relaxed">
            Select your crop, season, and land size above, then click{" "}
            <span className="font-bold text-emerald-600">Get Fertilizer Plan</span> to receive a
            customized fertilizer recommendation based on your soil and precise location.
          </p>
        </div>
      )}
    </div>
  );
}
