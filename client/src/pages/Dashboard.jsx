import { useState, useEffect, useRef, useCallback } from "react";
import { loadRegistration, updateRegistration } from "../lib/registration";
import { fetchFarmWeatherBundle } from "../lib/farmWeather";
import { GoogleTranslateWidget } from "../translation";
import GovernmentSchemes from "../components/GovernmentSchemes";
import FertilizerAdvisor from "../components/FertilizerAdvisor";

/* â”€â”€â”€ SVG icon paths â”€â”€â”€ */
const ICONS = {
  home: "M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  weather:
    "M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z",
  mandi:
    "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z",
  satellite:
    "M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
  advisory:
    "M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18",
  alerts:
    "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M13 10h-2v3H8v2h3v3h2v-3h3v-2h-3v-3z",
  calendar:
    "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z",
  imageQuality:
    "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21zM10.5 8.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
  selfTrain:
    "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5",
  fertilizer:
    "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.007.858a2.25 2.25 0 00-.775 1.285l-.814 4.07A2.25 2.25 0 0114.21 22.5H9.79a2.25 2.25 0 01-2.193-1.787l-.814-4.07a2.25 2.25 0 00-.775-1.285L5 14.5m14 0H5",
  signout:
    "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9",
  menu: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5",
  chevronLeft: "M15.75 19.5L8.25 12l7.5-7.5",
  bell: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
  chart:
    "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  schemes:
    "M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z",
};

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: ICONS.home },
  { id: "weather", label: "Weather", icon: ICONS.weather },
  { id: "mandi", label: "Mandi Prices", icon: ICONS.mandi },
  { id: "advisory", label: "Crop Advisory", icon: ICONS.advisory },
  { id: "fertilizer", label: "Fertilizer Plan", icon: ICONS.fertilizer },
  { id: "schemes", label: "Govt Schemes", icon: ICONS.schemes },
  { id: "alerts", label: "Alert System", icon: ICONS.alerts },
  { id: "calendar", label: "Adaptive Calendar", icon: ICONS.calendar },
];

function Icon({ d, className = "w-5 h-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function Dashboard({ session, onSignOut }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState(null);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  useEffect(() => {
    if (!session?.id) return;
    loadRegistration(session.id).then((data) => {
      if (data) setProfile(data);
    });
  }, [session?.id]);

  const initials = (session?.name || "F")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  function handleNav(id) {
    setActiveTab(id);
    setMobileSidebar(false);
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex bg-[#f8faf9] overflow-x-hidden">
      {/* Mobile overlay */}
      {mobileSidebar && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-40 top-0 bottom-0 flex flex-col bg-[#0c1f17] text-white transition-all duration-300 ease-out ${mobileSidebar ? "left-0" : "-left-72 md:left-0"
          } ${sidebarOpen ? "w-64" : "w-[72px]"}`}
      >
        {/* Brand */}
        <div
          className={`flex items-center gap-3 border-b border-white/[0.06] transition-all duration-300 ${sidebarOpen ? "px-5 py-5" : "px-3 py-5 justify-center"}`}
        >
          <img src="/tea.png" alt="Cropwise" className="w-9 h-9 rounded-xl object-cover shadow-lg shrink-0" />
          {sidebarOpen && (
            <div className="animate-fade-in">
              <h1 className="font-extrabold text-sm tracking-tight">
                Cropwise
              </h1>
              <p className="text-[10px] text-emerald-400/60 font-medium">
                AgriTech Platform
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${sidebarOpen ? "px-3 py-3" : "px-0 py-3 justify-center"
                } ${activeTab === item.id
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"
                }`}
            >
              <div className="relative shrink-0">
                <Icon d={item.icon} className="w-5 h-5" />
                {activeTab === item.id && (
                  <div
                    className="absolute -left-[19px] top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-400 rounded-r-full"
                    style={sidebarOpen ? {} : { display: "none" }}
                  />
                )}
              </div>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Profile + signout */}
        <div className="border-t border-white/[0.06] p-3 space-y-2">
          {sidebarOpen && (
            <div className="flex items-center gap-3 px-3 py-2 animate-fade-in">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white/90 truncate">
                  {session?.name || "Farmer"}
                </p>
                <p className="text-[11px] text-white/40 truncate">
                  {session?.mobile || ""}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={onSignOut}
            className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium text-white/40 hover:bg-white/[0.05] hover:text-white/70 transition-all ${sidebarOpen ? "px-3 py-2.5" : "py-2.5 justify-center"
              }`}
          >
            <Icon d={ICONS.signout} className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-stone-200/60 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4 flex-wrap min-w-0">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileSidebar(true)}
            className="md:hidden p-2 rounded-lg hover:bg-stone-100 text-stone-600 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Icon d={ICONS.menu} className="w-5 h-5" />
          </button>
          {/* Desktop collapse */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="hidden md:flex p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors shrink-0"
          >
            <Icon
              d={sidebarOpen ? ICONS.chevronLeft : ICONS.menu}
              className="w-5 h-5"
            />
          </button>

          <div className="flex-1 min-w-0" />

          <div className="shrink-0 max-w-[calc(100vw-8rem)]">
            <GoogleTranslateWidget />
          </div>

          {/* Notification bell */}
          <button
            onClick={() => setActiveTab("alerts")}
            className="relative p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Open Alert System"
            title="Open Alert System"
          >
            <Icon d={ICONS.bell} className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>


          {/* Profile */}
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-stone-200 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[11px] font-bold text-white">
              {initials}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-stone-800 leading-tight">
                {session?.name || "Farmer"}
              </p>
              <p className="text-[11px] text-stone-400">
                {session?.mobile || ""}
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto min-w-0">
          {activeTab === "overview" && (
            <OverviewTab
              session={session}
              profile={profile}
              greeting={greeting}
              onProfileUpdate={setProfile}
            />
          )}
          {activeTab === "weather" && <WeatherTab profile={profile} />}
          {activeTab === "mandi" && <MandiTab profile={profile} />}
          {activeTab === "advisory" && <AdvisoryTab profile={profile} />}
          {activeTab === "fertilizer" && <FertilizerAdvisor profile={profile} />}
          {activeTab === "schemes" && <GovernmentSchemes profile={profile} />}
          {activeTab === "alerts" && <AlertSystemTab profile={profile} />}
          {activeTab === "calendar" && (
            <AdaptiveCalendarTab profile={profile} />
          )}
        </main>
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   WEATHER FARM CALENDAR - CLEAN MONTH VIEW WITH ALERTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const FARM_ACTIVITIES = [
  { id: "irrigation", label: "Irrigation", icon: "💧", short: "Water" },
  { id: "sowing", label: "Sowing / Seeding", icon: "🌱", short: "Sow" },
  { id: "spraying", label: "Pesticide Spray", icon: "🧪", short: "Spray" },
  { id: "harvesting", label: "Harvesting", icon: "🌾", short: "Harvest" },
  { id: "fertilizing", label: "Fertilizing", icon: "🧴", short: "Fertilize" },
];

function scoreActivities(dayData) {
  const avgTemp = dayData.reduce((s, d) => s + d.main.temp, 0) / dayData.length;
  const avgHum =
    dayData.reduce((s, d) => s + d.main.humidity, 0) / dayData.length;
  const maxWind = Math.max(...dayData.map((d) => (d.wind?.speed || 0) * 3.6));
  const avgWind =
    dayData.reduce((s, d) => s + (d.wind?.speed || 0) * 3.6, 0) /
    dayData.length;
  const totalRain = dayData.reduce((s, d) => s + (d.rain?.["3h"] || 0), 0);
  const hasRain = totalRain > 0.5;
  const heavyRain = totalRain > 8;
  const avgClouds =
    dayData.reduce((s, d) => s + (d.clouds?.all || 0), 0) / dayData.length;
  const results = {};

  if (heavyRain) {
    results.irrigation = {
      status: "avoid",
      reason: `Heavy rain (${totalRain.toFixed(0)}mm) - save water`,
      tip: "Let rain handle irrigation naturally",
    };
  } else if (hasRain) {
    results.irrigation = {
      status: "caution",
      reason: `Light rain (${totalRain.toFixed(1)}mm) - reduce watering`,
      tip: "Supplement only if soil is very dry",
    };
  } else if (avgTemp > 30 && avgHum < 50) {
    results.irrigation = {
      status: "go",
      reason: `Hot & dry (${avgTemp.toFixed(0)} C) - crops need water`,
      tip: "Irrigate early morning or late evening",
    };
  } else {
    results.irrigation = {
      status: "go",
      reason: `No rain - good day to irrigate`,
      tip: "Check soil moisture before irrigating",
    };
  }

  if (heavyRain) {
    results.sowing = {
      status: "avoid",
      reason: `Heavy rain will wash away seeds`,
      tip: "Wait for dry spell of 2-3 days",
    };
  } else if (maxWind > 25) {
    results.sowing = {
      status: "avoid",
      reason: `Strong wind (${maxWind.toFixed(0)} km/h) - seeds scatter`,
      tip: "Wait for wind below 15 km/h",
    };
  } else if (avgTemp < 10 || avgTemp > 40) {
    results.sowing = {
      status: "caution",
      reason: `Temp ${avgTemp.toFixed(0)} C outside germination range`,
      tip: "Choose tolerant varieties",
    };
  } else if (!hasRain && avgWind < 15 && avgTemp >= 15 && avgTemp <= 35) {
    results.sowing = {
      status: "go",
      reason: `Calm, good temp (${avgTemp.toFixed(0)} C)`,
      tip: "Ideal - sow in the morning",
    };
  } else {
    results.sowing = {
      status: "caution",
      reason: `Marginal conditions`,
      tip: "Sow if soil is workable",
    };
  }

  if (hasRain) {
    results.spraying = {
      status: "avoid",
      reason: `Rain will wash off chemicals`,
      tip: "Need 4-6 dry hours to absorb",
    };
  } else if (maxWind > 15) {
    results.spraying = {
      status: "avoid",
      reason: `Wind ${maxWind.toFixed(0)} km/h - spray drift`,
      tip: "Wait for calm morning",
    };
  } else if (avgHum > 80) {
    results.spraying = {
      status: "caution",
      reason: `Humidity ${avgHum.toFixed(0)}% - slow drying`,
      tip: "Spray when dew evaporates",
    };
  } else if (avgWind < 10 && !hasRain && avgHum < 70) {
    results.spraying = {
      status: "go",
      reason: `Low wind, dry, moderate humidity`,
      tip: "Perfect spray window",
    };
  } else {
    results.spraying = {
      status: "caution",
      reason: `Acceptable but not ideal`,
      tip: "Spray in calmest hours",
    };
  }

  if (hasRain) {
    results.harvesting = {
      status: "avoid",
      reason: `Wet - high crop moisture`,
      tip: "Wet harvest increases spoilage",
    };
  } else if (avgHum > 80) {
    results.harvesting = {
      status: "caution",
      reason: `Humidity ${avgHum.toFixed(0)}% - slow drying`,
      tip: "Harvest midday when humidity drops",
    };
  } else if (!hasRain && avgHum < 65 && avgClouds < 60) {
    results.harvesting = {
      status: "go",
      reason: `Dry, sunny (${avgHum.toFixed(0)}% hum)`,
      tip: "Excellent harvest day",
    };
  } else {
    results.harvesting = {
      status: "go",
      reason: `Mostly dry - proceed with care`,
      tip: "Check crop moisture first",
    };
  }

  if (heavyRain) {
    results.fertilizing = {
      status: "avoid",
      reason: `Heavy rain causes nutrient runoff`,
      tip: "Apply after rain passes",
    };
  } else if (totalRain > 1 && totalRain <= 8) {
    results.fertilizing = {
      status: "go",
      reason: `Light rain helps absorption`,
      tip: "Apply before rain starts",
    };
  } else if (maxWind > 20) {
    results.fertilizing = {
      status: "caution",
      reason: `Wind ${maxWind.toFixed(0)} km/h - granular scatters`,
      tip: "Use liquid or wait for calm",
    };
  } else if (!hasRain && avgTemp > 35) {
    results.fertilizing = {
      status: "caution",
      reason: `Hot & dry - burn risk`,
      tip: "Irrigate before applying",
    };
  } else {
    results.fertilizing = {
      status: "go",
      reason: `Good conditions`,
      tip: "Apply early morning or evening",
    };
  }

  return {
    results,
    summary: { avgTemp, avgHum, avgWind, maxWind, totalRain, avgClouds },
  };
}

/** Seasonal prediction for any date when real forecast is missing (India-focused). */
function syntheticDayPrediction(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const month = d.getMonth();
  const day = d.getDate();
  const seed = month * 31 + day;
  const vary = (base, range) => base + (seed % range) - (range / 2);

  // Rough Indian seasonal pattern: 0-1 winter, 2-4 summer, 5-8 monsoon, 9-10 post-monsoon, 11 winter
  const isMonsoon = month >= 5 && month <= 8;
  const isSummer = month >= 2 && month <= 4;
  const isWinter = month <= 1 || month === 11;
  const rainMm = isMonsoon ? vary(12, 20) : isWinter ? 0 : vary(2, 6);
  const avgTemp = isSummer ? vary(34, 8) : isMonsoon ? vary(28, 6) : isWinter ? vary(22, 6) : vary(26, 6);
  const avgHum = isMonsoon ? vary(78, 16) : isSummer ? vary(45, 20) : vary(55, 20);
  const avgWind = vary(12, 10);
  const maxWind = avgWind + (seed % 8);
  const avgClouds = isMonsoon ? vary(75, 20) : vary(40, 40);

  const heavyRain = rainMm > 10;
  const hasRain = rainMm > 1;
  const results = {};

  if (heavyRain) {
    results.irrigation = { status: "avoid", reason: `Expected heavy rain (~${Math.round(rainMm)}mm) - save water`, tip: "Let rain handle irrigation naturally" };
    results.sowing = { status: "avoid", reason: "Heavy rain will wash away seeds", tip: "Wait for dry spell" };
    results.spraying = { status: "avoid", reason: "Rain will wash off chemicals", tip: "Need 4-6 dry hours" };
    results.harvesting = { status: "avoid", reason: "Wet - high crop moisture", tip: "Wait for dry window" };
    results.fertilizing = { status: "avoid", reason: "Heavy rain causes nutrient runoff", tip: "Apply after rain passes" };
  } else if (hasRain) {
    results.irrigation = { status: "caution", reason: `Expected rain (~${rainMm.toFixed(0)}mm) - reduce watering`, tip: "Supplement only if soil dry" };
    results.sowing = { status: "caution", reason: "Some rain expected", tip: "Sow if soil workable" };
    results.spraying = { status: "avoid", reason: "Rain will wash off chemicals", tip: "Spray in dry window" };
    results.harvesting = { status: "caution", reason: "Possible rain - check forecast", tip: "Harvest when dry" };
    results.fertilizing = { status: "go", reason: "Light rain helps absorption", tip: "Apply before rain" };
  } else {
    results.irrigation = avgTemp > 30 && avgHum < 50
      ? { status: "go", reason: `Hot & dry (${Math.round(avgTemp)} C) - crops need water`, tip: "Irrigate early morning" }
      : { status: "go", reason: "No rain expected - good day to irrigate", tip: "Check soil moisture" };
    results.sowing = avgTemp >= 15 && avgTemp <= 35 && avgWind < 15
      ? { status: "go", reason: `Calm, good temp (${Math.round(avgTemp)} C)`, tip: "Ideal for sowing" }
      : { status: "caution", reason: `Temp ${Math.round(avgTemp)} C`, tip: "Choose tolerant varieties" };
    results.spraying = avgWind < 10 && avgHum < 70
      ? { status: "go", reason: "Low wind, moderate humidity", tip: "Good spray window" }
      : { status: "caution", reason: "Acceptable conditions", tip: "Spray in calmest hours" };
    results.harvesting = avgHum < 65
      ? { status: "go", reason: "Dry, suitable for harvest", tip: "Harvest when dew clears" }
      : { status: "caution", reason: "Moderate humidity", tip: "Harvest midday" };
    results.fertilizing = avgWind < 20
      ? { status: "go", reason: "Good conditions", tip: "Apply early morning or evening" }
      : { status: "caution", reason: "Wind may scatter granules", tip: "Use liquid or wait" };
  }

  return {
    activities: results,
    summary: {
      avgTemp: Math.round(avgTemp * 10) / 10,
      avgHum: Math.round(avgHum * 10) / 10,
      avgWind: Math.round(avgWind * 10) / 10,
      maxWind: Math.round(maxWind * 10) / 10,
      totalRain: Math.max(0, Math.round(rainMm * 10) / 10),
      avgClouds: Math.round(avgClouds * 10) / 10,
    },
  };
}

function AdaptiveFarmCalendar({ profile, viewingMonth, viewingYear }) {
  const [forecastMap, setForecastMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const detailRef = useRef(null);
  const calRef = useRef(null);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const year =
    viewingYear !== undefined && viewingYear !== null
      ? viewingYear
      : today.getFullYear();
  const month =
    viewingMonth !== undefined && viewingMonth !== null
      ? viewingMonth
      : today.getMonth();
  const monthName = new Date(year, month, 1).toLocaleString("default", {
    month: "long",
  });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      try {
        const { forecast } = await fetchFarmWeatherBundle(profile);
        const data = forecast;
        if (data?.list?.length) {
          const grouped = {};
          data.list.forEach((entry) => {
            const date = (entry.dt_txt || "").split(" ")[0];
            if (!date) return;
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(entry);
          });
          const map = {};
          Object.entries(grouped).forEach(([date, entries]) => {
            const { results, summary } = scoreActivities(entries);
            map[date] = { activities: results, summary };
          });
          setForecastMap(map);
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, [
    profile?.latitude,
    profile?.longitude,
    profile?.village,
    profile?.district,
    profile?.state,
  ]);

  const handleDayClick = (dateStr) => {
    const next = selectedDate === dateStr ? null : dateStr;
    setSelectedDate(next);
    if (next) {
      setTimeout(() => {
        const el = calRef.current;
        if (!el) return;
        const y = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: "smooth" });
      }, 50);
    }
  };

  const statusStyles = {
    go: {
      bg: "bg-emerald-50",
      border: "border-emerald-300",
      badge: "bg-emerald-100 text-emerald-700",
      label: "Go",
    },
    caution: {
      bg: "bg-amber-50",
      border: "border-amber-300",
      badge: "bg-amber-100 text-amber-700",
      label: "Caution",
    },
    avoid: {
      bg: "bg-red-50",
      border: "border-red-300",
      badge: "bg-red-100 text-red-700",
      label: "Avoid",
    },
  };

  const getDayData = (dateStr) =>
    forecastMap[dateStr] || syntheticDayPrediction(dateStr);

  const isRealForecast = (dateStr) => !!forecastMap[dateStr];
  const sel = selectedDate ? getDayData(selectedDate) : null;
  const selIsPredicted = selectedDate ? !isRealForecast(selectedDate) : false;

  // Crop cycle
  const crop = profile?.primary_crop ? cap(profile.primary_crop) : "Crop";
  const stage = profile?.crop_stage ? cap(profile.crop_stage) : "Growing";
  const STAGE_ORDER = [
    "sowing",
    "germination",
    "vegetative",
    "flowering",
    "fruiting",
    "harvesting",
  ];
  const stageIdx = STAGE_ORDER.indexOf(
    (profile?.crop_stage || "vegetative").toLowerCase(),
  );
  const cycleDay =
    stageIdx >= 0 ? stageIdx * 25 + (today.getDate() % 25) : today.getDate();

  return (
    <div
      ref={calRef}
      className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden min-w-0"
    >
      {/* â”€â”€ Top bar â”€â”€ */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-1 flex items-center justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-lg sm:text-xl font-extrabold text-stone-800 tracking-tight truncate">
            {monthName} {year}
          </h3>
          <p className="text-[11px] text-stone-400 mt-0.5">
            {crop} &middot; {stage} &middot; Day {cycleDay}
            {(year !== today.getFullYear() || month !== today.getMonth()) && (
              <span className="ml-1.5 text-amber-600">
                &middot; Seasonal predictions
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap justify-end">
          <span className="flex items-center gap-1.5 text-[10px] text-stone-400">
            <span className="w-[18px] h-[18px] rounded-full border-[1.5px] border-dashed border-red-400 inline-flex" />
            Risk
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-stone-400">
            <span className="w-[18px] h-[18px] rounded-full border-[1.5px] border-dashed border-teal-400 inline-flex" />
            Irrigate
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-stone-400">
            <span className="w-[18px] h-[18px] rounded-full bg-stone-800 inline-flex" />
            Today
          </span>
        </div>
      </div>

      {/* â”€â”€ Weekday row + Day grid (scroll on small screens) â”€â”€ */}
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <div className="min-w-[280px] px-4 sm:px-8">
          <div className="grid grid-cols-7 pt-4 sm:pt-5 pb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, di) => (
              <div
                key={di}
                className="text-center text-[11px] font-bold text-stone-300 tracking-wide"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="pb-6">
            <div className="grid grid-cols-7 gap-y-3 sm:gap-y-[18px]">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate && !isToday;
                const df = getDayData(dateStr);

                const avoidCount = df
                  ? FARM_ACTIVITIES.filter(
                    (a) => df.activities[a.id]?.status === "avoid",
                  ).length
                  : 0;
                const hasAlert = avoidCount > 0;
                const needsIrrigation =
                  df && !hasAlert && df.activities.irrigation?.status === "go";

                let borderColor = "border-red-300";
                if (avoidCount >= 3) borderColor = "border-red-600";
                else if (avoidCount === 2) borderColor = "border-red-500";

                let textColor = "text-red-400";
                if (avoidCount >= 3) textColor = "text-red-700";
                else if (avoidCount === 2) textColor = "text-red-600";

                return (
                  <div key={day} className="flex flex-col items-center gap-[2px]">
                    {isToday && (
                      <span className="text-[7px] font-extrabold text-stone-500 uppercase tracking-[0.12em] leading-none">
                        today
                      </span>
                    )}
                    {!isToday && (
                      <span className="text-[7px] leading-none">&nbsp;</span>
                    )}
                    <div
                      onClick={() => handleDayClick(dateStr)}
                      className={`
                    w-8 h-8 sm:w-[38px] sm:h-[38px] rounded-full flex items-center justify-center text-xs sm:text-[13px] transition-all
                    ${isToday
                          ? "bg-stone-800 text-white font-bold cursor-pointer shadow-lg shadow-stone-800/20"
                          : isSelected
                            ? "bg-stone-100 text-stone-900 font-bold cursor-pointer ring-[2.5px] ring-stone-300"
                            : hasAlert
                              ? `${textColor} font-semibold cursor-pointer border-[2px] border-dashed ${borderColor}`
                              : needsIrrigation
                                ? "text-teal-600 cursor-pointer border-[2px] border-dashed border-teal-300"
                                : df
                                  ? "text-stone-600 cursor-pointer hover:bg-stone-50 active:bg-stone-100"
                                  : "text-stone-300"
                        }
                  `}
                    >
                      {day}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ Detail panel â”€â”€ */}
      {sel && selectedDate && (
        <div ref={detailRef}>
          {/* Divider */}
          <div className="mx-4 sm:mx-6 border-t border-stone-100" />

          {/* Date header */}
          <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-4 flex items-center justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-lg sm:text-[22px] font-extrabold text-stone-800 tracking-tight leading-none">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                    "en-US",
                    { day: "numeric", month: "short" },
                  )}
                  <span className="text-stone-300 font-bold mx-2">&middot;</span>
                  <span className="text-sm font-semibold text-stone-400">
                    {stage} day {cycleDay}
                  </span>
                </h4>
                {selIsPredicted && (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Seasonal prediction
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 mt-1.5">
                {crop} crop cycle &middot;{" "}
                {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                  "en-US",
                  { weekday: "long" },
                )}
              </p>
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-all shrink-0"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Weather chips */}
          <div className="px-6 pb-4 flex gap-2 flex-wrap">
            {[
              { icon: "🌡️", label: `${sel.summary.avgTemp.toFixed(0)} C` },
              { icon: "💧", label: `${sel.summary.avgHum.toFixed(0)}%` },
              { icon: "💨", label: `${sel.summary.avgWind.toFixed(0)} km/h` },
              ...(sel.summary.totalRain > 0.1
                ? [
                  {
                    icon: "🌧️",
                    label: `${sel.summary.totalRain.toFixed(1)}mm`,
                  },
                ]
                : []),
            ].map((c, ci) => (
              <span
                key={ci}
                className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-50 rounded-full px-3 py-1.5 border border-stone-100"
              >
                <span className="text-sm">{c.icon}</span>
                {c.label}
              </span>
            ))}
          </div>

          {/* Activity cards */}
          <div className="px-6 pb-6 space-y-2.5">
            {FARM_ACTIVITIES.map((a) => {
              const act = sel.activities[a.id];
              if (!act) return null;
              const colors = {
                go: {
                  card: "bg-emerald-50/80 border-emerald-200",
                  dot: "bg-emerald-500",
                  badge: "bg-emerald-500 text-white",
                  text: "text-emerald-700",
                },
                caution: {
                  card: "bg-amber-50/80 border-amber-200",
                  dot: "bg-amber-500",
                  badge: "bg-amber-500 text-white",
                  text: "text-amber-700",
                },
                avoid: {
                  card: "bg-red-50/80 border-red-200",
                  dot: "bg-red-500",
                  badge: "bg-red-500 text-white",
                  text: "text-red-700",
                },
              };
              const c = colors[act.status];
              return (
                <div
                  key={a.id}
                  className={`rounded-2xl border ${c.card} p-4 transition-all hover:shadow-sm`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-stone-100 flex items-center justify-center text-lg shadow-sm shrink-0">
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-stone-800">
                          {a.label}
                        </p>
                        <span
                          className={`text-[9px] font-bold px-2 py-[3px] rounded-md ${c.badge}`}
                        >
                          {act.status === "go"
                            ? "Safe"
                            : act.status === "caution"
                              ? "Caution"
                              : "Avoid"}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                        {act.reason}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   OVERVIEW TAB
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PROFILE_CROP_OPTIONS = [
  "Onion",
  "Potato",
  "Rice",
  "Wheat",
  "Maize",
  "Groundnut",
  "Soyabean",
];

const PROFILE_STAGE_OPTIONS = [
  "sowing",
  "germination",
  "seedling",
  "vegetative",
  "flowering",
  "fruiting",
  "maturity",
  "harvesting",
  "post-harvest",
];

const PROFILE_LANGUAGE_OPTIONS = ["english", "hindi", "gujarati"];
const PROFILE_LAND_UNIT_OPTIONS = ["acre", "hectare"];
const PROFILE_MARKET_OPTIONS = [
  "local_mandi",
  "district_mandi",
  "state_mandi",
  "export_market",
];

function OverviewTab({ session, profile, greeting, onProfileUpdate }) {
  const now = new Date();
  const [viewingYear, setViewingYear] = useState(now.getFullYear());
  const [viewingMonth, setViewingMonth] = useState(now.getMonth());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  const buildProfileForm = useCallback(
    (source) => ({
      farmer_name: source?.farmer_name || session?.name || "",
      preferred_language: source?.preferred_language || "",
      primary_crop: source?.primary_crop || "",
      crop_stage: source?.crop_stage || "",
      land_area:
        source?.land_area === null || source?.land_area === undefined
          ? ""
          : String(source.land_area),
      land_unit: source?.land_unit || "",
      village: source?.village || "",
      district: source?.district || "",
      state: source?.state || "",
      market_preference: source?.market_preference || "",
    }),
    [session?.name],
  );

  const [profileForm, setProfileForm] = useState(() => buildProfileForm(profile));

  useEffect(() => {
    if (!isEditingProfile) {
      setProfileForm(buildProfileForm(profile));
    }
  }, [profile, isEditingProfile, buildProfileForm]);

  const cropOptions = Array.from(
    new Set([profileForm.primary_crop, ...PROFILE_CROP_OPTIONS].filter(Boolean)),
  );

  const handleFormField = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const startEditingProfile = () => {
    setSaveStatus(null);
    setProfileForm(buildProfileForm(profile));
    setIsEditingProfile(true);
  };

  const cancelEditingProfile = () => {
    setSaveStatus(null);
    setProfileForm(buildProfileForm(profile));
    setIsEditingProfile(false);
  };

  const saveProfileChanges = async () => {
    if (!session?.id) {
      setSaveStatus({ type: "error", message: "Session expired. Please sign in again." });
      return;
    }

    setSavingProfile(true);
    setSaveStatus(null);
    try {
      const parsedLandArea = Number.parseFloat(profileForm.land_area);
      const payload = {
        farmer_name: profileForm.farmer_name.trim() || null,
        preferred_language: profileForm.preferred_language.trim() || null,
        primary_crop: profileForm.primary_crop.trim() || null,
        crop_stage: profileForm.crop_stage.trim() || null,
        land_area: Number.isFinite(parsedLandArea) ? parsedLandArea : null,
        land_unit: profileForm.land_unit.trim() || null,
        village: profileForm.village.trim() || null,
        district: profileForm.district.trim() || null,
        state: profileForm.state.trim() || null,
        market_preference: profileForm.market_preference.trim() || null,
      };

      const { data, error } = await updateRegistration(session.id, payload);

      if (error) throw error;

      const updatedProfile = data || { ...(profile || {}), ...payload };
      onProfileUpdate?.(updatedProfile);
      setProfileForm(buildProfileForm(updatedProfile));
      setIsEditingProfile(false);
      setSaveStatus({ type: "success", message: "Farm profile updated successfully." });
    } catch (err) {
      setSaveStatus({
        type: "error",
        message: err?.message || "Failed to update farm profile.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const goPrevMonth = () => {
    if (viewingMonth === 0) {
      setViewingMonth(11);
      setViewingYear((y) => y - 1);
    } else {
      setViewingMonth((m) => m - 1);
    }
  };
  const goNextMonth = () => {
    if (viewingMonth === 11) {
      setViewingMonth(0);
      setViewingYear((y) => y + 1);
    } else {
      setViewingMonth((m) => m + 1);
    }
  };
  const isCurrentMonth =
    viewingYear === now.getFullYear() && viewingMonth === now.getMonth();

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/[0.03] rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <p className="text-emerald-200 text-sm font-medium">{greeting}</p>
          <h2 className="text-2xl md:text-3xl font-extrabold mt-1">
            {session?.name || "Farmer"}
          </h2>
          <p className="text-emerald-100/70 text-sm mt-2 max-w-lg">
            Your farm intelligence dashboard. Monitor crops, weather, and market
            prices - all powered by SAR satellite data.
          </p>
        </div>
      </div>

      {/* Month navigator - scroll through the year */}
      <div className="flex items-center justify-center gap-4 py-2">
        <button
          type="button"
          onClick={goPrevMonth}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-700 font-medium hover:bg-stone-50 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Previous month
        </button>
        <div className="min-w-[200px] text-center">
          <span className="text-lg font-bold text-stone-800">
            {MONTH_NAMES[viewingMonth]} {viewingYear}
          </span>
          {isCurrentMonth && (
            <span className="ml-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Current
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={goNextMonth}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-700 font-medium hover:bg-stone-50 transition-colors shadow-sm"
        >
          Next month
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Adaptive Farm Calendar - weather-driven activity planner */}
      <AdaptiveFarmCalendar
        profile={profile}
        viewingMonth={viewingMonth}
        viewingYear={viewingYear}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Location"
          value={profile?.village ? `${profile.village}` : "Not set"}
          sub={profile?.district || ""}
          gradient="from-emerald-500 to-teal-600"
          iconPath={ICONS.home}
        />
        <StatCard
          label="Primary Crop"
          value={profile?.primary_crop ? cap(profile.primary_crop) : "-"}
          sub={profile?.crop_stage ? cap(profile.crop_stage) + " stage" : ""}
          gradient="from-amber-500 to-orange-600"
          iconPath={ICONS.advisory}
        />
        <StatCard
          label="Land Area"
          value={profile?.land_area ? `${profile.land_area}` : "-"}
          sub={profile?.land_unit ? cap(profile.land_unit) + "s" : ""}
          gradient="from-blue-500 to-indigo-600"
          iconPath={ICONS.chart}
        />
        <StatCard
          label="SAR Monitor"
          value={profile?.satellite_consent ? "Active" : "Inactive"}
          sub={
            profile?.satellite_consent ? "All systems go" : "Enable in settings"
          }
          gradient={
            profile?.satellite_consent
              ? "from-teal-500 to-cyan-600"
              : "from-stone-400 to-stone-500"
          }
          iconPath={ICONS.satellite}
        />
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Farm Details */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between gap-3">
            <h3 className="font-bold text-stone-800">Farm Profile</h3>
            {!isEditingProfile ? (
              <button
                type="button"
                onClick={startEditingProfile}
                className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"
              >
                Update Info
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelEditingProfile}
                  disabled={savingProfile}
                  className="text-xs font-semibold text-stone-600 bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-full hover:bg-stone-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveProfileChanges}
                  disabled={savingProfile}
                  className="text-xs font-semibold text-white bg-emerald-600 border border-emerald-600 px-3 py-1.5 rounded-full hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingProfile ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>
          <div className="p-6">
            {saveStatus && (
              <div
                className={`mb-4 rounded-xl border px-3 py-2 text-sm ${saveStatus.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
                  }`}
              >
                {saveStatus.message}
              </div>
            )}

            {isEditingProfile ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <label className="block">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 block">
                    Farmer Name
                  </span>
                  <input
                    type="text"
                    value={profileForm.farmer_name}
                    onChange={(e) => handleFormField("farmer_name", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                  />
                </label>

                <InfoRow
                  label="Mobile"
                  value={profile?.mobile || session?.mobile || "—"}
                />

                <label className="block">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 block">
                    Language
                  </span>
                  <select
                    value={profileForm.preferred_language}
                    onChange={(e) =>
                      handleFormField("preferred_language", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                  >
                    <option value="">Select language...</option>
                    {PROFILE_LANGUAGE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {cap(option)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 block">
                    Primary Crop
                  </span>
                  <select
                    value={profileForm.primary_crop}
                    onChange={(e) => handleFormField("primary_crop", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                  >
                    <option value="">Select crop...</option>
                    {cropOptions.map((crop) => (
                      <option key={crop} value={crop}>
                        {cap(crop)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 block">
                    Crop Stage
                  </span>
                  <select
                    value={profileForm.crop_stage}
                    onChange={(e) => handleFormField("crop_stage", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                  >
                    <option value="">Select stage...</option>
                    {PROFILE_STAGE_OPTIONS.map((stage) => (
                      <option key={stage} value={stage}>
                        {cap(stage.replace(/-/g, " "))}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 block">
                      Land Area
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={profileForm.land_area}
                      onChange={(e) => handleFormField("land_area", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 block">
                      Unit
                    </span>
                    <select
                      value={profileForm.land_unit}
                      onChange={(e) => handleFormField("land_unit", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                    >
                      <option value="">Select unit...</option>
                      {PROFILE_LAND_UNIT_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {cap(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 block">
                    Village
                  </span>
                  <input
                    type="text"
                    value={profileForm.village}
                    onChange={(e) => handleFormField("village", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 block">
                    District
                  </span>
                  <input
                    type="text"
                    value={profileForm.district}
                    onChange={(e) => handleFormField("district", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 block">
                    State
                  </span>
                  <input
                    type="text"
                    value={profileForm.state}
                    onChange={(e) => handleFormField("state", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 block">
                    Market
                  </span>
                  <select
                    value={profileForm.market_preference}
                    onChange={(e) =>
                      handleFormField("market_preference", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                  >
                    <option value="">Select market...</option>
                    {PROFILE_MARKET_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {cap(option.replace(/_/g, " "))}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <InfoRow
                  label="Farmer Name"
                  value={profile?.farmer_name || session?.name || "—"}
                />
                <InfoRow
                  label="Mobile"
                  value={profile?.mobile || session?.mobile || "—"}
                />
                <InfoRow
                  label="Language"
                  value={
                    profile?.preferred_language
                      ? cap(profile.preferred_language)
                      : "—"
                  }
                />
                <InfoRow
                  label="Primary Crop"
                  value={profile?.primary_crop ? cap(profile.primary_crop) : "—"}
                />
                <InfoRow
                  label="Crop Stage"
                  value={profile?.crop_stage ? cap(profile.crop_stage) : "—"}
                />
                <InfoRow
                  label="Land Area"
                  value={
                    profile?.land_area
                      ? `${profile.land_area} ${profile.land_unit || ""}`
                      : "—"
                  }
                />
                <InfoRow label="Village" value={profile?.village || "—"} />
                <InfoRow label="District" value={profile?.district || "—"} />
                <InfoRow label="State" value={profile?.state || "—"} />
                <InfoRow
                  label="Market"
                  value={
                    profile?.market_preference
                      ? cap(profile.market_preference.replace(/_/g, " "))
                      : "—"
                  }
                />
              </div>
            )}
          </div>
        </div>
        {/* SAR Status */}
        <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h3 className="font-bold text-stone-800">SAR Satellite</h3>
          </div>
          <div className="p-6 flex flex-col items-center text-center">
            {/* Radar visual */}
            <div className="relative w-32 h-32 mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-200" />
              <div className="absolute inset-4 rounded-full border border-emerald-200/60" />
              <div className="absolute inset-8 rounded-full border border-emerald-200/40" />
              <div className="absolute inset-[52px] rounded-full bg-emerald-500 animate-pulse" />
              {profile?.satellite_consent && (
                <div className="absolute inset-0 origin-center animate-radar">
                  <div className="w-1/2 h-0.5 bg-gradient-to-r from-emerald-500/80 to-transparent mt-[calc(50%-1px)] ml-[50%]" />
                </div>
              )}
            </div>
            <p className="font-bold text-stone-800">
              {profile?.satellite_consent
                ? "Monitoring Active"
                : "Monitoring Inactive"}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {profile?.latitude
                ? `Coordinates: ${Number(profile.latitude).toFixed(4)}, ${Number(profile.longitude).toFixed(4)}`
                : "No coordinates captured"}
            </p>
            {profile?.satellite_consent && (
              <div className="mt-4 w-full space-y-2">
                <MiniGauge label="Soil Moisture" value={68} color="emerald" />
                <MiniGauge label="Crop Health" value={82} color="teal" />
                <MiniGauge label="Flood Risk" value={12} color="amber" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightCard
          title="Weather Alert"
          desc="Light rainfall expected in the next 48 hours. Good for sowing preparations."
          color="blue"
          icon="RAN"
        />
        <InsightCard
          title="Market Update"
          desc={`${profile?.primary_crop ? cap(profile.primary_crop) : "Crop"} prices holding steady at nearby mandis.`}
          color="amber"
          icon="MKT"
        />
        <InsightCard
          title="Advisory"
          desc={
            profile?.crop_stage === "sowing"
              ? "Optimal window for sowing. Soil conditions favorable."
              : "Monitor crop growth regularly for best results."
          }
          color="emerald"
          icon="TIP"
        />
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   FARMCAST - REAL-TIME AGRICULTURAL WEATHER INTELLIGENCE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

/* â”€â”€ Crop-specific heat/cold thresholds ( C) â”€â”€ */
const CROP_HEAT_THRESHOLDS = {
  onion: { optimal: [13, 30], stress: 36 },
  tomato: { optimal: [18, 32], stress: 38 },
  potato: { optimal: [12, 25], stress: 32 },
  wheat: { optimal: [15, 25], stress: 35 },
  rice: { optimal: [25, 35], stress: 40 },
  cotton: { optimal: [20, 30], stress: 38 },
  soybean: { optimal: [20, 30], stress: 35 },
  maize: { optimal: [18, 27], stress: 35 },
  mustard: { optimal: [15, 25], stress: 35 },
  gram: { optimal: [15, 25], stress: 35 },
  sugarcane: { optimal: [20, 35], stress: 42 },
  groundnut: { optimal: [22, 30], stress: 38 },
};

/* â”€â”€ Agricultural computation engine â”€â”€ */

function computeSprayScore(current, forecastList) {
  if (!current || !forecastList?.length)
    return { score: 0, label: "No data", factors: [] };
  const windKmh = (current.wind?.speed || 0) * 3.6;
  const humidity = current.main?.humidity || 0;
  const factors = [];

  const windScore =
    windKmh < 8 ? 100 : windKmh < 15 ? 70 : windKmh < 25 ? 30 : 0;
  factors.push({
    name: "Wind Speed",
    value: `${windKmh.toFixed(1)} km/h`,
    ok: windKmh < 15,
  });

  const next4h = forecastList.slice(0, 2);
  const rainExpected = next4h.some(
    (f) => (f.pop || 0) > 0.3 || (f.rain?.["3h"] || 0) > 0,
  );
  factors.push({
    name: "Rain (next 4h)",
    value: rainExpected ? "Expected" : "Clear",
    ok: !rainExpected,
  });

  const humScore = humidity < 70 ? 100 : humidity < 85 ? 60 : 20;
  factors.push({ name: "Humidity", value: `${humidity}%`, ok: humidity < 85 });

  const score = Math.round(
    windScore * 0.4 + (rainExpected ? 0 : 100) * 0.35 + humScore * 0.25,
  );
  const label =
    score >= 70
      ? "Safe to Spray"
      : score >= 40
        ? "Use Caution"
        : "Do Not Spray";
  return { score, label, factors };
}

function computeDiseasePressure(current) {
  if (!current) return { score: 0, label: "No data", detail: "" };
  const temp = current.main?.temp || 0;
  const humidity = current.main?.humidity || 0;
  const dewPoint = temp - (100 - humidity) / 5;
  const leafWetness = Math.max(0, 100 - (temp - dewPoint) * 10);

  let score = 0;
  if (humidity > 90) score += 40;
  else if (humidity > 80) score += 30;
  else if (humidity > 70) score += 15;

  if (temp >= 20 && temp <= 30) score += 35;
  else if (temp >= 15 && temp <= 35) score += 20;
  else score += 5;

  score += Math.round(leafWetness * 0.25);
  score = Math.min(100, score);

  const label =
    score >= 70 ? "High Risk" : score >= 40 ? "Moderate" : "Low Risk";
  const detail =
    score >= 70
      ? "Fungal infection likely. Apply preventive fungicide immediately."
      : score >= 40
        ? "Conditions favor disease. Monitor crops closely for symptoms."
        : "Disease pressure is low. Conditions unfavorable for pathogens.";
  return { score, label, detail };
}

function computeHeatStress(current, cropName) {
  if (!current) return { score: 0, label: "No data", detail: "" };
  const temp = current.main?.temp || 0;
  const crop = CROP_HEAT_THRESHOLDS[cropName?.toLowerCase()] || {
    optimal: [20, 30],
    stress: 35,
  };
  const cropLabel = cap(cropName || "crop");

  let score = 0;
  if (temp > crop.stress) score = Math.min(100, 70 + (temp - crop.stress) * 6);
  else if (temp > crop.optimal[1])
    score = Math.round(
      ((temp - crop.optimal[1]) / (crop.stress - crop.optimal[1])) * 70,
    );
  else if (temp < crop.optimal[0] - 5)
    score = Math.min(80, (crop.optimal[0] - 5 - temp) * 8);
  else if (temp < crop.optimal[0])
    score = Math.round(((crop.optimal[0] - temp) / 5) * 25);

  const label = score >= 70 ? "Severe" : score >= 40 ? "Moderate" : "Normal";
  const detail =
    temp > crop.stress
      ? `${temp.toFixed(1)} C exceeds ${cropLabel} tolerance (${crop.stress} C). Yield loss risk.`
      : temp > crop.optimal[1]
        ? `Above optimal range (${crop.optimal[0]}-${crop.optimal[1]} C) for ${cropLabel}.`
        : temp < crop.optimal[0]
          ? `Below optimal range (${crop.optimal[0]}-${crop.optimal[1]} C) for ${cropLabel}.`
          : `${temp.toFixed(1)} C is within optimal range for ${cropLabel} growth.`;
  return { score, label, detail };
}

function computeFrostRisk(current) {
  if (!current) return { score: 0, label: "None", detail: "" };
  const temp = current.main?.temp || 20;
  const humidity = current.main?.humidity || 50;
  const clouds = current.clouds?.all || 0;
  const windSpeed = (current.wind?.speed || 0) * 3.6;

  let score = 0;
  if (temp <= 0) score += 50;
  else if (temp <= 4) score += 40;
  else if (temp <= 8) score += 20;
  else if (temp <= 12) score += 5;

  if (clouds < 20) score += 25;
  else if (clouds < 50) score += 15;
  else score += 5;

  if (windSpeed < 5) score += 15;
  else if (windSpeed < 10) score += 8;

  const dewPoint = temp - (100 - humidity) / 5;
  if (dewPoint < 0) score += 10;

  score = Math.min(100, score);
  const label = score >= 60 ? "High Risk" : score >= 30 ? "Moderate" : "Low";
  const detail =
    score >= 60
      ? "Frost likely. Cover sensitive crops and seedlings tonight."
      : score >= 30
        ? "Some frost risk. Monitor overnight temperatures carefully."
        : "Frost risk is minimal. No protection needed.";
  return { score, label, detail };
}

function computeET0(forecastList) {
  if (!forecastList?.length) return { value: 0, label: "No data", detail: "" };
  const todayStr = new Date().toDateString();
  let temps = forecastList
    .filter((f) => new Date(f.dt * 1000).toDateString() === todayStr)
    .map((f) => f.main.temp);
  if (temps.length < 2)
    temps = forecastList.slice(0, 4).map((f) => f.main.temp);

  const tMax = Math.max(...temps);
  const tMin = Math.min(...temps);
  const tMean = (tMax + tMin) / 2;
  const Ra = 15; // extraterrestrial radiation MJ/m2/day (tropical approx)
  const et0 =
    0.0023 * (tMean + 17.8) * Math.sqrt(Math.max(0.1, tMax - tMin)) * Ra;
  const value = Math.max(0, parseFloat(et0.toFixed(1)));

  const label =
    value > 6
      ? "Very High"
      : value > 4
        ? "High"
        : value > 2
          ? "Moderate"
          : "Low";
  const detail = `Estimated ${value}mm water loss/day. ${value > 4 ? "Increase irrigation frequency." : "Moisture loss is manageable."}`;
  return { value, label, detail };
}

function getGoldenHourData(forecastList) {
  if (!forecastList?.length) return [];
  return forecastList.slice(0, 8).map((f) => {
    const time = new Date(f.dt * 1000);
    const temp = f.main.temp;
    const windKmh = (f.wind?.speed || 0) * 3.6;
    const humidity = f.main.humidity;
    const hasRain = (f.pop || 0) > 0.3 || (f.rain?.["3h"] || 0) > 0;
    let activity, suitability;

    if (hasRain) {
      activity = "Rain expected";
      suitability = "bad";
    } else if (windKmh > 20) {
      activity = "Too windy for spraying";
      suitability = "caution";
    } else if (temp > 38) {
      activity = "Extreme heat - avoid field";
      suitability = "bad";
    } else if (windKmh < 10 && humidity < 80) {
      activity = "Ideal for spraying";
      suitability = "good";
    } else if (temp >= 18 && temp <= 33) {
      activity = "Good for field work";
      suitability = "good";
    } else if (temp < 8) {
      activity = "Too cold for field work";
      suitability = "caution";
    } else {
      activity = "Moderate conditions";
      suitability = "caution";
    }

    return {
      time,
      temp: Math.round(temp),
      windKmh: windKmh.toFixed(0),
      humidity,
      hasRain,
      icon: f.weather?.[0]?.icon,
      desc: f.weather?.[0]?.description,
      activity,
      suitability,
      pop: Math.round((f.pop || 0) * 100),
    };
  });
}

function getAirQualityImpact(airData) {
  if (!airData?.list?.[0]) return null;
  const { components, main } = airData.list[0];
  const pm25 = components.pm2_5 || 0;
  const pm10 = components.pm10 || 0;
  const o3 = components.o3 || 0;

  const photoImpact =
    pm25 > 100
      ? "Severe"
      : pm25 > 50
        ? "Moderate"
        : pm25 > 25
          ? "Mild"
          : "Minimal";
  const photoScore = Math.min(100, Math.round(pm25 * 0.7));
  const ozoneRisk = o3 > 120 ? "High" : o3 > 80 ? "Moderate" : "Low";

  const aqiLabels = ["", "Good", "Fair", "Moderate", "Poor", "Very Poor"];
  const aqiColors = ["", "emerald", "teal", "amber", "orange", "red"];

  return {
    aqi: main.aqi,
    aqiLabel: aqiLabels[main.aqi] || "Unknown",
    aqiColor: aqiColors[main.aqi] || "stone",
    pm25: pm25.toFixed(1),
    pm10: pm10.toFixed(1),
    o3: o3.toFixed(1),
    photoImpact,
    photoScore,
    ozoneRisk,
    detail:
      pm25 > 100
        ? "Heavy particulate matter blocking sunlight. Crop photosynthesis significantly reduced."
        : pm25 > 50
          ? "Moderate air pollution may reduce crop growth over extended exposure."
          : "Air quality is acceptable for healthy crop development.",
  };
}

function get5DayAgricast(forecastList) {
  if (!forecastList?.length) return [];
  const days = {};
  forecastList.forEach((f) => {
    const key = new Date(f.dt * 1000).toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    if (!days[key])
      days[key] = {
        temps: [],
        humidity: [],
        wind: [],
        rain: 0,
        pop: [],
        icons: [],
      };
    const d = days[key];
    d.temps.push(f.main.temp);
    d.humidity.push(f.main.humidity);
    d.wind.push((f.wind?.speed || 0) * 3.6);
    d.rain += f.rain?.["3h"] || 0;
    d.pop.push(f.pop || 0);
    d.icons.push(f.weather?.[0]?.icon);
  });

  return Object.entries(days)
    .slice(0, 5)
    .map(([date, d]) => {
      const maxTemp = Math.round(Math.max(...d.temps));
      const minTemp = Math.round(Math.min(...d.temps));
      const avgHumidity = Math.round(
        d.humidity.reduce((a, b) => a + b, 0) / d.humidity.length,
      );
      const maxWind = Math.round(Math.max(...d.wind));
      const totalRain = d.rain;
      const maxPop = Math.round(Math.max(...d.pop) * 100);
      const iconCounts = {};
      d.icons.forEach((ic) => {
        iconCounts[ic] = (iconCounts[ic] || 0) + 1;
      });
      const mainIcon = Object.entries(iconCounts).sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0];

      let advice,
        adviceType = "info";
      if (totalRain > 10) {
        advice =
          "Heavy rain expected. Secure stored grain. Do not apply pesticides.";
        adviceType = "danger";
      } else if (totalRain > 2) {
        advice =
          "Light rain likely. Good for soil moisture, but avoid pesticide application.";
        adviceType = "warning";
      } else if (maxWind > 20) {
        advice =
          "Strong winds expected. Not suitable for spraying or transplanting.";
        adviceType = "warning";
      } else if (maxTemp > 40) {
        advice =
          "Extreme heat. Irrigate early morning. Avoid midday fieldwork.";
        adviceType = "danger";
      } else if (maxWind < 12 && totalRain < 1 && maxTemp < 36) {
        advice =
          "Excellent conditions for spraying, harvesting, and field work.";
        adviceType = "good";
      } else {
        advice = "Moderate conditions. Suitable for most farming activities.";
        adviceType = "info";
      }

      return {
        date,
        maxTemp,
        minTemp,
        avgHumidity,
        maxWind,
        totalRain: totalRain.toFixed(1),
        maxPop,
        mainIcon,
        advice,
        adviceType,
      };
    });
}

/* â”€â”€ Risk gauge color helpers â”€â”€ */
const RISK_FILLS = {
  emerald: "from-emerald-400 to-emerald-600",
  amber: "from-amber-400 to-amber-600",
  red: "from-red-400 to-red-600",
};
const RISK_BGS = {
  emerald: "bg-emerald-100",
  amber: "bg-amber-100",
  red: "bg-red-100",
};
const RISK_BADGES = {
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
};

function riskColor(score, inverted) {
  const s = inverted ? 100 - score : score;
  if (s >= 70) return "red";
  if (s >= 40) return "amber";
  return "emerald";
}

/* â”€â”€ Main WeatherTab (FarmCast) Component â”€â”€ */
function WeatherTab({ profile }) {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef(null);

  const fetchAll = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    setError(null);
    try {
      const { weather: w, forecast: f, airQuality: aq } =
        await fetchFarmWeatherBundle(profile);
      setWeather(w);
      setForecast(f);
      setAirQuality(aq);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message || "Failed to fetch weather data");
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  }, [
    profile?.latitude,
    profile?.longitude,
    profile?.village,
    profile?.district,
    profile?.state,
  ]);

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(fetchAll, 60000);
    return () => clearInterval(timerRef.current);
  }, [fetchAll]);

  /* Compute agricultural intelligence */
  const cropName = profile?.primary_crop || "";
  const spray = computeSprayScore(weather, forecast?.list);
  const disease = computeDiseasePressure(weather);
  const heat = computeHeatStress(weather, cropName);
  const frost = computeFrostRisk(weather);
  const et0 = computeET0(forecast?.list);
  const goldenHours = getGoldenHourData(forecast?.list);
  const airImpact = getAirQualityImpact(airQuality);
  const agricast = get5DayAgricast(forecast?.list);

  const windDeg = weather?.wind?.deg || 0;
  const DIRS = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const windDir = DIRS[Math.round(windDeg / 22.5) % 16];

  /* â”€â”€ Loading state â”€â”€ */
  if (loading)
    return (
      <div className="flex items-center justify-center py-32 animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-600 font-semibold">
            Loading FarmCast Intelligence...
          </p>
          <p className="text-stone-400 text-sm mt-1">
            Fetching real-time weather data for your farm
          </p>
        </div>
      </div>
    );

  /* â”€â”€ Error state (only if no cached data) â”€â”€ */
  if (error && !weather)
    return (
      <div className="max-w-6xl animate-fade-in">
        <div className="rounded-2xl bg-red-50 border border-red-200 p-8 text-center">
          <p className="text-red-700 font-bold text-lg">
            Weather Data Unavailable
          </p>
          <p className="text-red-500 text-sm mt-2">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchAll();
            }}
            className="mt-4 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* â”€â”€ Header â”€â”€ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">FarmCast</h2>
          <p className="text-xs text-stone-400">
            Real-Time Agricultural Weather Intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
          >
            {refreshing ? "Refreshing..." : "Refresh weather"}
          </button>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-red-600">LIVE</span>
          </span>
          {lastUpdated && (
            <span className="text-[10px] text-stone-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* â”€â”€ Current Weather Hero â”€â”€ */}
      <div className="rounded-2xl bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/4 -translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sky-200 text-sm font-medium">
                  {weather?.name || profile?.village || "Your Location"}
                </span>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              {(profile?.latitude != null && profile?.longitude != null) && (
                <p className="text-sky-200/60 text-xs mb-1">
                  GPS: {Number(profile.latitude).toFixed(4)}, {Number(profile.longitude).toFixed(4)}
                </p>
              )}
              <div className="flex items-end gap-1">
                <span className="text-7xl font-extrabold tracking-tighter">
                  {Math.round(weather?.main?.temp ?? 0)}°
                </span>
                <span className="text-2xl text-sky-200 mb-3">C</span>
              </div>
              <p className="text-sky-100 capitalize text-lg">
                {weather?.weather?.[0]?.description || ""}
              </p>
              <p className="text-sky-200/70 text-sm">
                Feels like {Math.round(weather?.main?.feels_like ?? 0)} C
              </p>
            </div>
            <div className="text-right">
              {weather?.weather?.[0]?.icon && (
                <img
                  src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                  alt={weather.weather[0].description}
                  className="w-32 h-32 -mt-4 -mr-2 drop-shadow-2xl"
                />
              )}
            </div>
          </div>

          {/* Weather detail grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 mt-6 pt-5 border-t border-white/20">
            {[
              ["Humidity", `${weather?.main?.humidity ?? 0}%`],
              [
                "Wind",
                `${((weather?.wind?.speed || 0) * 3.6).toFixed(1)} km/h ${windDir}`,
              ],
              ["Pressure", `${weather?.main?.pressure ?? 0} hPa`],
              [
                "Visibility",
                `${((weather?.visibility ?? 10000) / 1000).toFixed(1)} km`,
              ],
              ["Clouds", `${weather?.clouds?.all ?? 0}%`],
              [
                "Dew Point",
                `${((weather?.main?.temp ?? 0) - (100 - (weather?.main?.humidity ?? 50)) / 5).toFixed(1)} C`,
              ],
              [
                "Sunrise",
                weather?.sys?.sunrise
                  ? new Date(weather.sys.sunrise * 1000).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" },
                  )
                  : "-",
              ],
              [
                "Sunset",
                weather?.sys?.sunset
                  ? new Date(weather.sys.sunset * 1000).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  : "-",
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-sky-300/70 text-[10px] uppercase tracking-wider">
                  {label}
                </p>
                <p className="text-white font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* â”€â”€ Crop Risk Intelligence â”€â”€ */}
      <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-stone-800">Crop Risk Intelligence</h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Real-time agricultural risk indices from live weather data
            </p>
          </div>
          {cropName && (
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200 capitalize">
              {cropName}
            </span>
          )}
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Spray Window */}
          {(() => {
            const c = riskColor(spray.score, true);
            return (
              <div className="rounded-xl border border-stone-200 p-4 hover-lift">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🧪</span>
                    <h4 className="font-bold text-stone-800 text-sm">
                      Spray Window
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${RISK_BADGES[c]}`}
                  >
                    {spray.label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-stone-400">Safety Score</span>
                  <span className="font-bold text-stone-700">
                    {spray.score}%
                  </span>
                </div>
                <div className={`h-2.5 rounded-full ${RISK_BGS[c]}`}>
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${RISK_FILLS[c]} transition-all duration-1000`}
                    style={{ width: `${spray.score}%` }}
                  />
                </div>
                {spray.factors.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-stone-100 space-y-1">
                    {spray.factors.map((f, fi) => (
                      <div
                        key={fi}
                        className="flex items-center justify-between text-[10px]"
                      >
                        <span className="text-stone-400">{f.name}</span>
                        <span
                          className={`font-semibold ${f.ok ? "text-emerald-600" : "text-red-500"}`}
                        >
                          {f.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Disease Pressure */}
          {(() => {
            const c = riskColor(disease.score, false);
            return (
              <div className="rounded-xl border border-stone-200 p-4 hover-lift">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🦠</span>
                    <h4 className="font-bold text-stone-800 text-sm">
                      Disease Pressure
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${RISK_BADGES[c]}`}
                  >
                    {disease.label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-stone-400">Fungal Risk</span>
                  <span className="font-bold text-stone-700">
                    {disease.score}%
                  </span>
                </div>
                <div className={`h-2.5 rounded-full ${RISK_BGS[c]}`}>
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${RISK_FILLS[c]} transition-all duration-1000`}
                    style={{ width: `${disease.score}%` }}
                  />
                </div>
                <p className="text-[10px] text-stone-500 mt-2">
                  {disease.detail}
                </p>
              </div>
            );
          })()}

          {/* Heat Stress */}
          {(() => {
            const c = riskColor(heat.score, false);
            return (
              <div className="rounded-xl border border-stone-200 p-4 hover-lift">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌡️</span>
                    <h4 className="font-bold text-stone-800 text-sm">
                      Heat Stress
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${RISK_BADGES[c]}`}
                  >
                    {heat.label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-stone-400">Stress Level</span>
                  <span className="font-bold text-stone-700">
                    {heat.score}%
                  </span>
                </div>
                <div className={`h-2.5 rounded-full ${RISK_BGS[c]}`}>
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${RISK_FILLS[c]} transition-all duration-1000`}
                    style={{ width: `${heat.score}%` }}
                  />
                </div>
                <p className="text-[10px] text-stone-500 mt-2">{heat.detail}</p>
              </div>
            );
          })()}

          {/* Frost Risk */}
          {(() => {
            const c = riskColor(frost.score, false);
            return (
              <div className="rounded-xl border border-stone-200 p-4 hover-lift">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">❄️</span>
                    <h4 className="font-bold text-stone-800 text-sm">
                      Frost Risk
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${RISK_BADGES[c]}`}
                  >
                    {frost.label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-stone-400">Frost Probability</span>
                  <span className="font-bold text-stone-700">
                    {frost.score}%
                  </span>
                </div>
                <div className={`h-2.5 rounded-full ${RISK_BGS[c]}`}>
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${RISK_FILLS[c]} transition-all duration-1000`}
                    style={{ width: `${frost.score}%` }}
                  />
                </div>
                <p className="text-[10px] text-stone-500 mt-2">
                  {frost.detail}
                </p>
              </div>
            );
          })()}

          {/* Evapotranspiration */}
          {(() => {
            const c =
              et0.value > 5 ? "red" : et0.value > 3 ? "amber" : "emerald";
            return (
              <div className="rounded-xl border border-stone-200 p-4 hover-lift">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💧</span>
                    <h4 className="font-bold text-stone-800 text-sm">
                      Evapotranspiration
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${RISK_BADGES[c]}`}
                  >
                    {et0.label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-stone-400">Water Loss Rate</span>
                  <span className="font-bold text-stone-700">
                    {et0.value} mm/day
                  </span>
                </div>
                <div className={`h-2.5 rounded-full ${RISK_BGS[c]}`}>
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${RISK_FILLS[c]} transition-all duration-1000`}
                    style={{
                      width: `${Math.min(100, (et0.value / 8) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-stone-500 mt-2">{et0.detail}</p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* â”€â”€ Golden Hour Planner â”€â”€ */}
      {goldenHours.length > 0 && (
        <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h3 className="font-bold text-stone-800">Golden Hour Planner</h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Best windows for farming activities over the next 24 hours
            </p>
          </div>
          <div className="p-4 overflow-x-auto">
            <div className="flex gap-3 min-w-max pb-2">
              {goldenHours.map((h, hi) => {
                const cardBg =
                  h.suitability === "good"
                    ? "border-emerald-200 bg-emerald-50"
                    : h.suitability === "caution"
                      ? "border-amber-200 bg-amber-50"
                      : "border-red-200 bg-red-50";
                const dot =
                  h.suitability === "good"
                    ? "bg-emerald-500"
                    : h.suitability === "caution"
                      ? "bg-amber-500"
                      : "bg-red-500";
                return (
                  <div
                    key={hi}
                    className={`w-[140px] shrink-0 rounded-xl border p-3 ${cardBg} hover-lift transition-all`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-stone-700">
                        {h.time.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${dot}`} />
                    </div>
                    {h.icon && (
                      <img
                        src={`https://openweathermap.org/img/wn/${h.icon}.png`}
                        alt=""
                        className="w-10 h-10 mx-auto"
                      />
                    )}
                    <p className="text-lg font-bold text-stone-800 text-center">
                      {h.temp} C
                    </p>
                    <p className="text-[10px] text-stone-500 text-center">
                      {h.windKmh} km/h &middot; {h.humidity}%
                    </p>
                    {h.pop > 0 && (
                      <p className="text-[10px] text-blue-600 font-semibold text-center mt-0.5">
                        Rain {h.pop}%
                      </p>
                    )}
                    <div className="mt-2 pt-2 border-t border-stone-200/60">
                      <p className="text-[10px] font-semibold text-stone-600 text-center leading-tight">
                        {h.activity}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Air Quality Impact on Crops â”€â”€ */}
      {airImpact && (
        <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-800">
                Air Quality Impact on Crops
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Pollution effects on crop photosynthesis and leaf health
              </p>
            </div>
            <span
              className={`px-2.5 py-1 text-xs font-bold rounded-full ${airImpact.aqiColor === "emerald"
                ? "bg-emerald-100 text-emerald-700"
                : airImpact.aqiColor === "teal"
                  ? "bg-teal-100 text-teal-700"
                  : airImpact.aqiColor === "amber"
                    ? "bg-amber-100 text-amber-700"
                    : airImpact.aqiColor === "orange"
                      ? "bg-orange-100 text-orange-700"
                      : airImpact.aqiColor === "red"
                        ? "bg-red-100 text-red-700"
                        : "bg-stone-100 text-stone-700"
                }`}
            >
              AQI: {airImpact.aqiLabel}
            </span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="rounded-xl bg-stone-50 border border-stone-100 p-4">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                  PM2.5
                </p>
                <p className="text-2xl font-bold text-stone-800 mt-1">
                  {airImpact.pm25}{" "}
                  <span className="text-xs font-normal text-stone-400">
                    ug/m3
                  </span>
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Photosynthesis:{" "}
                  <span className="font-semibold">{airImpact.photoImpact}</span>
                </p>
              </div>
              <div className="rounded-xl bg-stone-50 border border-stone-100 p-4">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                  PM10
                </p>
                <p className="text-2xl font-bold text-stone-800 mt-1">
                  {airImpact.pm10}{" "}
                  <span className="text-xs font-normal text-stone-400">
                    ug/m3
                  </span>
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Leaf deposit:{" "}
                  <span className="font-semibold">
                    {parseFloat(airImpact.pm10) > 100
                      ? "Heavy"
                      : parseFloat(airImpact.pm10) > 50
                        ? "Moderate"
                        : "Light"}
                  </span>
                </p>
              </div>
              <div className="rounded-xl bg-stone-50 border border-stone-100 p-4">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                  Ozone (O3)
                </p>
                <p className="text-2xl font-bold text-stone-800 mt-1">
                  {airImpact.o3}{" "}
                  <span className="text-xs font-normal text-stone-400">
                    ug/m3
                  </span>
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Leaf damage:{" "}
                  <span className="font-semibold">{airImpact.ozoneRisk}</span>
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-r from-stone-50 to-stone-100/50 border border-stone-100 p-4">
              <p className="text-sm text-stone-600">{airImpact.detail}</p>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ 5-Day Agricultural Forecast â”€â”€ */}
      {agricast.length > 0 && (
        <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h3 className="font-bold text-stone-800">
              5-Day Agricultural Forecast
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Weather outlook with crop-specific farming recommendations
            </p>
          </div>
          <div className="divide-y divide-stone-100">
            {agricast.map((day, di) => {
              const tc = {
                good: "border-emerald-300 bg-emerald-50",
                warning: "border-amber-300 bg-amber-50",
                danger: "border-red-300 bg-red-50",
                info: "border-blue-300 bg-blue-50",
              };
              return (
                <div
                  key={di}
                  className={`px-6 py-4 border-l-4 ${tc[day.adviceType]} hover:brightness-[0.98] transition-all`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      {day.mainIcon && (
                        <img
                          src={`https://openweathermap.org/img/wn/${day.mainIcon}.png`}
                          alt=""
                          className="w-10 h-10"
                        />
                      )}
                      <div>
                        <p className="font-bold text-stone-800 text-sm">
                          {day.date}
                        </p>
                        <p className="text-xs text-stone-500">
                          {day.minTemp}° - {day.maxTemp}°C
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-stone-500">
                      <span>Humidity {day.avgHumidity}%</span>
                      <span>Wind {day.maxWind} km/h</span>
                      {parseFloat(day.totalRain) > 0 && (
                        <span className="text-blue-600 font-semibold">
                          Rain {day.totalRain}mm
                        </span>
                      )}
                      {day.maxPop > 0 && (
                        <span className="text-blue-500">({day.maxPop}%)</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-stone-600 mt-2 sm:ml-[52px]">
                    {day.advice}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MANDI INTELLIGENCE - ML-POWERED PRICE RECOMMENDATIONS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const MANDI_SUPPORTED_CROPS = [
  "Onion",
  "Potato",
  "Rice",
  "Wheat",
  "Maize",
  "Groundnut",
  "Soyabean",
];

function MandiTab({ profile }) {
  const [apiOnline, setApiOnline] = useState(null); // null=checking, true/false
  const [availableCrops, setAvailableCrops] = useState([]);
  const [mandisList, setMandisList] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState("");
  const [quantity, setQuantity] = useState("");
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mandiBase = (import.meta.env.VITE_MANDI_API_BASE || "/mandi-api").replace(
    /\/$/,
    "",
  );

  /* â”€â”€ Check API health + fetch mandis on mount â”€â”€ */
  const initApi = useCallback(async () => {
    setApiOnline(null);
    try {
      const hRes = await fetch(`${mandiBase}/health`);
      if (!hRes.ok) throw new Error("API not reachable");
      const health = await hRes.json();
      const modelsLoaded =
        typeof health.models_loaded === "boolean" ? health.models_loaded : null;
      const statusOk = health.status === "ok" || health.status === "healthy";
      if (modelsLoaded === false) throw new Error("ML models not loaded yet");
      if (modelsLoaded === null && !statusOk) throw new Error("API not ready");
      setApiOnline(true);

      const mRes = await fetch(`${mandiBase}/mandis`);
      if (mRes.ok) {
        const mData = await mRes.json();
        setMandisList(mData.mandis || []);
        // Extract unique crops from all mandis
        const crops = [
          ...new Set(
            (mData.mandis || []).flatMap((m) => m.available_crops || []),
          ),
        ];
        const normalized = new Set(crops.map((c) => String(c).trim()));
        const supported = MANDI_SUPPORTED_CROPS.filter((c) => normalized.has(c));
        setAvailableCrops(
          supported.length > 0 ? supported : [...MANDI_SUPPORTED_CROPS],
        );
        // Leave crop empty - user selects crop and quantity
        setSelectedCrop("");
      }
    } catch {
      setApiOnline(false);
    }
  }, [mandiBase]);

  useEffect(() => {
    initApi();
  }, [initApi]);

  /* â”€â”€ Fetch ML recommendation â”€â”€ */
  const fetchRecommendation = useCallback(async () => {
    const parsedQuantity = Number(quantity);
    if (!selectedCrop) {
      setError("Please select a crop.");
      return;
    }
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError("Enter a valid quantity greater than 0 kg.");
      return;
    }
    setLoading(true);
    setError(null);
    setRecommendation(null);
    try {
      const body = {
        crop: selectedCrop,
        quantity: parsedQuantity,
      };
      if (profile?.latitude && profile?.longitude) {
        body.latitude = parseFloat(profile.latitude);
        body.longitude = parseFloat(profile.longitude);
      }
      if (profile?.village || profile?.district) {
        body.farmer_location = profile.village || profile.district;
      }

      const res = await fetch(`${mandiBase}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setRecommendation(data);
    } catch (e) {
      setError(e.message || "Failed to get recommendation");
    } finally {
      setLoading(false);
    }
  }, [
    selectedCrop,
    quantity,
    profile?.latitude,
    profile?.longitude,
    profile?.village,
    profile?.district,
  ]);

  const fmt = (n) => {
    if (n == null) return "-";
    return (
      "Rs " + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })
    );
  };
  const fmtKg = (n) => {
    if (n == null) return "-";
    return "Rs " + Number(n).toFixed(2) + "/kg";
  };

  /* â”€â”€ API offline / checking state â”€â”€ */
  if (apiOnline === null)
    return (
      <div className="flex items-center justify-center py-32 animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-600 font-semibold">
            Connecting to Mandi Intelligence...
          </p>
          <p className="text-stone-400 text-sm mt-1">
            Loading ML models and market data
          </p>
        </div>
      </div>
    );

  if (apiOnline === false)
    return (
      <div className="max-w-6xl animate-fade-in">
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-8 text-center">
          <span className="text-4xl mb-4 block">API</span>
          <p className="text-amber-800 font-bold text-lg">
            Mandi Intelligence API Offline
          </p>
          <p className="text-amber-600 text-sm mt-2 max-w-md mx-auto leading-relaxed">
            The ML API must run on{" "}
            <strong className="text-amber-800">port 8001</strong> (Vite proxies{" "}
            <code className="text-amber-900">/mandi-api</code> there). From the
            repo root, either start everything together or only the API:
          </p>
          <code className="mt-3 inline-block bg-amber-100 border border-amber-300 rounded-lg px-3 py-2 text-[11px] font-mono text-left max-w-full whitespace-pre-wrap break-all">
            {["npm run dev", "", "npm run dev:aiml"].join("\n")}
          </code>
          <p className="text-amber-600/90 text-xs mt-3 max-w-md mx-auto">
            Manual: <code className="bg-amber-100/80 px-1 rounded">cd AIML</code> then{" "}
            <code className="bg-amber-100/80 px-1 rounded">py -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload</code>
            <br />
            Needs Python deps:{" "}
            <code className="bg-amber-100/80 px-1 rounded text-[10px]">
              pip install -r AIML/requirements.txt
            </code>
          </p>
          <button
            onClick={initApi}
            className="mt-4 px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );

  const best = recommendation?.best_option;
  const alts = recommendation?.alternatives || [];
  // Combine best + alternatives for comparison, sorted by net profit
  const allOptions = best
    ? [best, ...alts].sort((a, b) => b.net_profit - a.net_profit)
    : [];
  const maxProfit = allOptions.length
    ? Math.max(...allOptions.map((o) => o.net_profit))
    : 1;

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* â”€â”€ Header â”€â”€ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">
            Mandi Intelligence
          </h2>
          <p className="text-xs text-stone-400">
            ML-Powered Price Predictions &amp; Profit Optimization
          </p>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-emerald-700">ML Online</span>
        </span>
      </div>

      {/* â”€â”€ Controls: Crop + Quantity + Button â”€â”€ */}
      <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 min-w-0">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 block">
              Crop
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
            >
              <option value="">Select crop...</option>
              {availableCrops.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 block">
              Quantity (kg)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity (kg)"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
            />
          </div>
          <button
            onClick={fetchRecommendation}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {loading ? "Analyzing..." : "Get Recommendation"}
          </button>
        </div>
        {profile?.village && (
          <p className="text-[10px] text-stone-400 mt-2">
            Location: {profile.village}
            {profile.district ? `, ${profile.district}` : ""}
            {profile.latitude
              ? ` (${Number(profile.latitude).toFixed(4)}, ${Number(profile.longitude).toFixed(4)})`
              : ""}
          </p>
        )}
      </div>

      {/* â”€â”€ Error state â”€â”€ */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-5">
          <p className="text-red-700 font-semibold text-sm">
            Recommendation Failed
          </p>
          <p className="text-red-500 text-xs mt-1">{error}</p>
          <button
            onClick={fetchRecommendation}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* â”€â”€ Loading state â”€â”€ */}
      {loading && !recommendation && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-stone-500 text-sm font-medium">
              Running ML price prediction...
            </p>
            <p className="text-stone-400 text-xs mt-1">
              Analyzing {mandisList.length} mandis for {selectedCrop}
            </p>
          </div>
        </div>
      )}

      {/* â”€â”€ Recommendation Results â”€â”€ */}
      {recommendation && best && (
        <>
          {/* â”€â”€ Best Option Hero â”€â”€ */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 md:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.06] rounded-full -translate-y-1/3 translate-x-1/4" />
            <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white/[0.04] rounded-full translate-y-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-amber-100 text-xs font-semibold uppercase tracking-wider">
                  ML Best Recommendation
                </p>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${best.recommendation?.toLowerCase().includes("wait")
                    ? "bg-white/20 text-amber-100"
                    : "bg-white/30 text-white"
                    }`}
                >
                  {best.recommendation || "Sell Now"}
                </span>
              </div>
              <div className="flex items-end gap-3 mt-2">
                <p className="text-4xl md:text-5xl font-extrabold tracking-tight">
                  {fmt(best.net_profit)}
                </p>
                <p className="text-amber-200 text-sm mb-1.5">net profit</p>
              </div>
              <p className="text-amber-100 text-lg font-semibold mt-2">
                {best.mandi_name}
              </p>
              <div className="flex gap-4 mt-1 text-amber-200/80 text-sm">
                <span>{best.distance_km.toFixed(0)} km away</span>
                <span>{fmtKg(best.current_price)}</span>
                <span>{recommendation.quantity} kg</span>
              </div>
            </div>
          </div>

          {/* â”€â”€ Profit Breakdown â”€â”€ */}
          <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100">
              <h3 className="font-bold text-stone-800">
                Profit Breakdown - {best.mandi_name}
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Full cost analysis for {recommendation.quantity} kg of{" "}
                {recommendation.crop}
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {/* Gross Revenue */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-sm">
                      GR
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-800">
                        Gross Revenue
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {fmtKg(best.current_price)} x {recommendation.quantity}{" "}
                        kg
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-emerald-600">
                    +{fmt(best.gross_revenue)}
                  </p>
                </div>
                {/* Transport Cost */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-sm">
                      TR
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-800">
                        Transport Cost
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {best.distance_km.toFixed(0)} km x Rs 5/km
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-red-500">
                    -{fmt(best.transport_cost)}
                  </p>
                </div>
                {/* Storage Cost */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-sm">
                      ST
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-800">
                        Storage &amp; Spoilage
                      </p>
                      <p className="text-[10px] text-stone-400">
                        Perishability + traffic factors
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-amber-600">
                    -{fmt(best.storage_cost)}
                  </p>
                </div>
                {/* Divider */}
                <div className="border-t-2 border-dashed border-stone-200 my-2" />
                {/* Net Profit */}
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-4 -mx-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-lg shadow-md">
                      OK
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">
                        Net Profit
                      </p>
                      <p className="text-[10px] text-stone-500">
                        After all costs deducted
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-emerald-700">
                    {fmt(best.net_profit)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* â”€â”€ ML Justification â”€â”€ */}
          {recommendation.summary && (
            <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-sm shrink-0 mt-0.5">
                  ML
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                    ML Analysis
                  </p>
                  <p className="text-sm text-stone-700 leading-relaxed">
                    {recommendation.summary}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* â”€â”€ Mandi Comparison â”€â”€ */}
          {allOptions.length > 1 && (
            <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100">
                <h3 className="font-bold text-stone-800">
                  All Mandi Options - Ranked by Net Profit
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Comparing {allOptions.length} mandis for{" "}
                  {recommendation.quantity} kg {recommendation.crop}
                </p>
              </div>
              <div className="divide-y divide-stone-100">
                {allOptions.map((opt, i) => {
                  const isBest =
                    opt.mandi_name === best.mandi_name &&
                    opt.net_profit === best.net_profit;
                  const profitPct =
                    maxProfit > 0 ? (opt.net_profit / maxProfit) * 100 : 0;
                  const isWait = opt.recommendation
                    ?.toLowerCase()
                    .includes("wait");
                  return (
                    <div
                      key={i}
                      className={`px-6 py-4 ${isBest ? "bg-emerald-50/50" : "hover:bg-stone-50"} transition-colors`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${isBest
                              ? "bg-emerald-500 text-white"
                              : "bg-stone-100 text-stone-500"
                              }`}
                          >
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-stone-800 text-sm flex items-center gap-2">
                              {opt.mandi_name}
                              {isBest && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                  BEST
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-stone-400">
                              {opt.distance_km.toFixed(0)} km &middot;{" "}
                              {fmtKg(opt.current_price)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${isBest ? "text-emerald-700" : "text-stone-800"}`}
                          >
                            {fmt(opt.net_profit)}
                          </p>
                          <span
                            className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${isWait
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                              }`}
                          >
                            {opt.recommendation}
                          </span>
                        </div>
                      </div>
                      {/* Profit bar */}
                      <div className="h-2 rounded-full bg-stone-100">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${isBest
                            ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                            : "bg-gradient-to-r from-amber-300 to-amber-500"
                            }`}
                          style={{ width: `${Math.max(5, profitPct)}%` }}
                        />
                      </div>
                      {/* Cost summary row */}
                      <div className="flex gap-4 mt-2 text-[10px] text-stone-400">
                        <span>Revenue: {fmt(opt.gross_revenue)}</span>
                        <span>Transport: -{fmt(opt.transport_cost)}</span>
                        <span>Storage: -{fmt(opt.storage_cost)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* â”€â”€ Available Mandis Info â”€â”€ */}
          {mandisList.length > 0 && (
            <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100">
                <h3 className="font-bold text-stone-800">Connected Mandis</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  {mandisList.length} mandis with live data from Gujarat
                  AGMARKNET
                </p>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {mandisList.map((m, mi) => (
                  <div
                    key={mi}
                    className="rounded-xl bg-stone-50 border border-stone-100 p-3 hover-lift"
                  >
                    <p className="text-sm font-semibold text-stone-800">
                      {m.mandi_name}
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {m.distance_km?.toFixed(0) || "?"} km &middot;{" "}
                      {m.record_count} records
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(m.available_crops || []).map((c) => (
                        <span
                          key={c}
                          className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${c === selectedCrop
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-stone-100 text-stone-500"
                            }`}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CROP ADVISORY - AI-POWERED CROP RECOMMENDATION ENGINE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const CROP_DATABASE = [
  {
    name: "Tomato",
    icon: "🍅",
    season: "zaid",
    tempRange: [20, 30],
    humRange: [50, 80],
    waterNeed: "Medium",
    duration: "60-90 days",
    soilType: "Loamy/Sandy",
    msp: "-",
    gradient: "from-red-500 to-orange-600",
  },
  {
    name: "Onion",
    icon: "🧅",
    season: "rabi",
    tempRange: [13, 30],
    humRange: [40, 70],
    waterNeed: "Medium",
    duration: "120-150 days",
    soilType: "Loamy/Alluvial",
    msp: "-",
    gradient: "from-red-500 to-rose-600",
  },
  {
    name: "Potato",
    icon: "🥔",
    season: "rabi",
    tempRange: [10, 25],
    humRange: [40, 70],
    waterNeed: "Medium",
    duration: "80-120 days",
    soilType: "Sandy Loam",
    msp: "-",
    gradient: "from-amber-600 to-yellow-700",
  },
  {
    name: "Rice",
    icon: "🌾",
    season: "kharif",
    tempRange: [20, 35],
    humRange: [60, 90],
    waterNeed: "High",
    duration: "110-140 days",
    soilType: "Clay/Alluvial",
    msp: "Rs 2,300/qtl",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    name: "Wheat",
    icon: "🌾",
    season: "rabi",
    tempRange: [10, 25],
    humRange: [40, 65],
    waterNeed: "Medium",
    duration: "110-150 days",
    soilType: "Loam/Clay Loam",
    msp: "Rs 2,275/qtl",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    name: "Maize",
    icon: "🌽",
    season: "kharif",
    tempRange: [18, 32],
    humRange: [50, 75],
    waterNeed: "Medium",
    duration: "90-120 days",
    soilType: "Well-drained Loam",
    msp: "Rs 2,225/qtl",
    gradient: "from-yellow-500 to-amber-600",
  },
  {
    name: "Groundnut",
    icon: "🥜",
    season: "kharif",
    tempRange: [22, 32],
    humRange: [45, 70],
    waterNeed: "Medium",
    duration: "100-130 days",
    soilType: "Sandy Loam",
    msp: "Rs 6,783/qtl",
    gradient: "from-orange-500 to-amber-700",
  },
  {
    name: "Soyabean",
    icon: "🫘",
    season: "kharif",
    tempRange: [20, 32],
    humRange: [50, 75],
    waterNeed: "Medium",
    duration: "90-120 days",
    soilType: "Well-drained Loam",
    msp: "Rs 4,892/qtl",
    gradient: "from-lime-500 to-emerald-700",
  },
];

function getCurrentSeason() {
  const m = new Date().getMonth();
  if (m >= 5 && m <= 9) return "kharif";
  if (m >= 10 || m <= 2) return "rabi";
  return "zaid";
}

const YIELD_BENCHMARKS = {
  __default__: {
    Onion: 23.77,
    Potato: 24.66,
    Rice: 3.37,
    Wheat: 3.93,
    Maize: 4.09,
    Groundnut: 2.21,
    Soyabean: 1.61,
  },
  gujarat: {
    Onion: 31.83,
    Potato: 30.0,
    Rice: 3.2,
    Wheat: 3.55,
    Maize: 2.35,
    Groundnut: 2.44,
    Soyabean: 1.5,
  },
};

function normalizeStateKey(state) {
  return String(state || "").trim().toLowerCase();
}

function getStateBenchmarkYield(state, cropName) {
  const stateBenchmarks = YIELD_BENCHMARKS[normalizeStateKey(state)] || {};
  return (
    Number(stateBenchmarks[cropName]) ||
    Number(YIELD_BENCHMARKS.__default__[cropName]) ||
    1
  );
}

function isNearSeason(targetSeason, currentSeason) {
  if (targetSeason === currentSeason) return false;
  if (targetSeason === "kharif") return currentSeason === "zaid";
  if (targetSeason === "rabi") return currentSeason === "zaid";
  if (targetSeason === "zaid") {
    return currentSeason === "kharif" || currentSeason === "rabi";
  }
  return false;
}

function statusFromPoints(points, maxPoints) {
  if (points >= maxPoints * 0.75) return "good";
  if (points > 0) return "caution";
  return "bad";
}

function calculateCropAdvisoryScore(
  crop,
  weather,
  season,
  { predictedYield, state } = {},
) {
  if (!weather) return { score: 0, factors: [], components: [] };

  const temp = weather.main?.temp ?? 25;
  const humidity = weather.main?.humidity ?? 50;
  const windSpeed = (weather.wind?.speed || 0) * 3.6;
  const clouds = weather.clouds?.all ?? 30;
  const [tMin, tMax] = crop.tempRange;
  const [hMin, hMax] = crop.humRange;
  const benchmarkYield = getStateBenchmarkYield(state, crop.name);

  const predicted =
    Number.isFinite(Number(predictedYield)) && Number(predictedYield) > 0
      ? Number(predictedYield)
      : null;
  const aiYieldRaw = predicted ? (predicted / benchmarkYield) * 30 : 0;
  const aiYieldPoints = Math.max(0, Math.min(30, aiYieldRaw));

  let tempPoints = 0;
  if (temp >= tMin && temp <= tMax) {
    tempPoints = 20;
  } else if (temp >= tMin - 3 && temp <= tMax + 3) {
    tempPoints = 10;
  }

  let seasonPoints = 0;
  if (crop.season === season) {
    seasonPoints = 30;
  } else if (isNearSeason(crop.season, season)) {
    seasonPoints = 15;
  }

  const humidityPoints = humidity >= hMin && humidity <= hMax ? 10 : 5;

  const sunlightPoints = clouds <= 70 ? 5 : 0;
  const windPoints = windSpeed < 15 ? 5 : 0;
  const sunWindPoints = sunlightPoints + windPoints;

  const components = [
    {
      id: "ai-yield-potential",
      title: "AI Yield Potential",
      maxPoints: 30,
      points: Number(aiYieldPoints.toFixed(1)),
      status: statusFromPoints(aiYieldPoints, 30),
      trigger: "(Predicted Yield / State Benchmark Yield) x 30",
      observed: predicted
        ? `${predicted.toFixed(2)} / ${benchmarkYield.toFixed(2)} t/ha`
        : `Benchmark ${benchmarkYield.toFixed(2)} t/ha`,
      formula: predicted
        ? `(${predicted.toFixed(2)} / ${benchmarkYield.toFixed(2)}) x 30`
        : "Prediction pending from AI yield model",
      action: predicted
        ? "Higher ratio to benchmark gives stronger score."
        : "Add/verify field profile inputs for live AI yield scoring.",
      value: `${Number(aiYieldPoints.toFixed(1))}/30`,
    },
    {
      id: "temperature-match",
      title: "Temperature Match",
      maxPoints: 20,
      points: tempPoints,
      status: statusFromPoints(tempPoints, 20),
      trigger: `Optimal range ${tMin}-${tMax} C`,
      observed: `${temp.toFixed(1)} C`,
      formula:
        tempPoints === 20
          ? "Inside optimal band"
          : tempPoints === 10
            ? "Slightly outside optimal band"
            : "Extreme mismatch",
      action:
        tempPoints === 20
          ? "Temperature is ideal for growth."
          : tempPoints === 10
            ? "Monitor crop stress and irrigation timing."
            : "Risk of heat/cold damage is high.",
      value: `${tempPoints}/20`,
    },
    {
      id: "season-alignment",
      title: "Season Alignment",
      maxPoints: 30,
      points: seasonPoints,
      status: statusFromPoints(seasonPoints, 30),
      trigger: `Target season: ${cap(crop.season)}`,
      observed: `Current season: ${cap(season)}`,
      formula:
        seasonPoints === 30
          ? "Perfect seasonal alignment"
          : seasonPoints === 15
            ? "Early/Late sowing window"
            : "Wrong season for this crop",
      action:
        seasonPoints === 30
          ? "Season timing is correct."
          : seasonPoints === 15
            ? "Possible but yield may reduce."
            : "Avoid or change crop for this season.",
      value: `${seasonPoints}/30`,
    },
    {
      id: "humidity-match",
      title: "Humidity Match",
      maxPoints: 10,
      points: humidityPoints,
      status: humidityPoints === 10 ? "good" : "caution",
      trigger: `Optimal RH ${hMin}-${hMax}%`,
      observed: `${humidity}% RH`,
      formula:
        humidityPoints === 10
          ? "Optimal humidity"
          : "Outside ideal humidity band",
      action:
        humidityPoints === 10
          ? "Disease pressure is lower."
          : "Watch for fungal or dry stress issues.",
      value: `${humidityPoints}/10`,
    },
    {
      id: "sunlight-wind",
      title: "Sunlight & Wind",
      maxPoints: 10,
      points: sunWindPoints,
      status: statusFromPoints(sunWindPoints, 10),
      trigger: "5 pts sunlight + 5 pts calm wind",
      observed: `Clouds ${clouds}%, Wind ${windSpeed.toFixed(0)} km/h`,
      formula: `Sun ${sunlightPoints}/5 + Wind ${windPoints}/5`,
      action:
        sunWindPoints === 10
          ? "Good photosynthesis and safe spray window."
          : sunWindPoints >= 5
            ? "Moderate field operation window."
            : "Poor operation conditions today.",
      value: `${sunWindPoints}/10`,
    },
  ];

  const totalScore = components.reduce((sum, part) => sum + part.points, 0);
  const factors = components.map((part) => ({
    name: part.title,
    value: part.value,
    detail: part.observed,
    good: part.status === "good",
    status: part.status,
    pts: part.points,
  }));

  return { score: Math.round(totalScore), factors, components };
}

function computeCropSuitability(crop, weather, season, context = {}) {
  return calculateCropAdvisoryScore(crop, weather, season, context);
}

function AdvisoryTab({ profile }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [yieldByCrop, setYieldByCrop] = useState({});
  const [yieldLoading, setYieldLoading] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const { weather: w } = await fetchFarmWeatherBundle(profile);
        setWeather(w);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [
    profile?.latitude,
    profile?.longitude,
    profile?.village,
    profile?.district,
    profile?.state,
  ]);

  const season = getCurrentSeason();
  const seasonLabel = {
    kharif: "Kharif (Jun-Oct)",
    rabi: "Rabi (Nov-Mar)",
    zaid: "Zaid (Mar-Jun)",
  };

  const districtForYield = (
    profile?.district ||
    profile?.village ||
    weather?.name ||
    ""
  ).trim();
  const stateForYield = (profile?.state || "Gujarat").trim();
  const seasonForYield =
    season === "kharif" ? "Kharif" : season === "rabi" ? "Rabi" : "Summer";
  const now = new Date();
  const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fyEndShort = String((fyStart + 1) % 100).padStart(2, "0");
  const yearForYield = `${fyStart}-${fyEndShort}`;
  const areaRaw = Number(profile?.land_area ?? 0);
  const areaInHectare = Number.isFinite(areaRaw)
    ? String(profile?.land_unit || "").toLowerCase().includes("acre")
      ? areaRaw * 0.4047
      : areaRaw
    : 0;
  const areaForYield = areaInHectare > 0 ? areaInHectare : 1;
  const allCropNames = CROP_DATABASE.map((c) => c.name);
  const allCropKey = allCropNames.join("|");

  // Score all crops and sort using the new weighted rule engine.
  const scoredCrops = CROP_DATABASE.map((c) => ({
    ...c,
    ...computeCropSuitability(c, weather, season, {
      predictedYield: yieldByCrop[c.name.toLowerCase()],
      state: stateForYield,
    }),
  })).sort((a, b) => b.score - a.score);

  const topCrops = scoredCrops.filter((c) => c.score >= 60);
  const otherCrops = scoredCrops.filter((c) => c.score < 60);
  const farmerCrop = profile?.primary_crop || "";
  const farmerCropData = scoredCrops.find(
    (c) => c.name.toLowerCase() === farmerCrop.toLowerCase(),
  );

  useEffect(() => {
    let cancelled = false;

    if (!allCropNames.length) {
      setYieldByCrop({});
      setYieldLoading(false);
      return;
    }

    const fetchYieldPredictions = async () => {
      setYieldLoading(true);
      try {
        const payload = {
          state: stateForYield || "Gujarat",
          district: districtForYield || "Unknown",
          season: seasonForYield,
          year: yearForYield,
          area: areaForYield,
          area_units: "Hectare",
          crops: allCropNames,
        };

        // Prefer unified root path; fall back to mounted mandi path for stale backend instances.
        let res = await fetch("/mandi-api/yield/predict-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.status === 404) {
          res = await fetch("/mandi-api/mandi/yield/predict-batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
        if (!res.ok) throw new Error(`Yield API error (${res.status})`);

        const data = await res.json();
        const map = {};
        for (const item of data?.predictions || []) {
          const cropName = String(item?.crop || "").toLowerCase();
          const value = Number(item?.predicted_yield);
          if (cropName && Number.isFinite(value)) {
            map[cropName] = value;
          }
        }
        if (!cancelled) setYieldByCrop(map);
      } catch {
        if (!cancelled) setYieldByCrop({});
      } finally {
        if (!cancelled) setYieldLoading(false);
      }
    };

    fetchYieldPredictions();
    return () => {
      cancelled = true;
    };
  }, [
    allCropKey,
    stateForYield,
    districtForYield,
    seasonForYield,
    yearForYield,
    areaForYield,
  ]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-32 animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-600 font-semibold">
            Analyzing crop suitability...
          </p>
          <p className="text-stone-400 text-sm mt-1">
            Fetching weather data for your location
          </p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">
            AI Crop Advisory
          </h2>
          <p className="text-xs text-stone-400">
            Real-time crop recommendations based on weather, season, and
            location
          </p>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-emerald-700">
            {seasonLabel[season]}
          </span>
        </span>
      </div>

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.05] rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/[0.03] rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wider">
            AI Prediction Engine
          </p>
          <h3 className="text-xl font-bold mt-2">
            What should you grow right now?
          </h3>
          <p className="text-emerald-100/70 text-sm mt-2 max-w-xl">
            We analyzed{" "}
            <span className="text-white font-semibold">live weather</span> (
            {weather?.main?.temp?.toFixed(0) ?? "-"} C,{" "}
            {weather?.main?.humidity ?? "-"}% humidity), current{" "}
            <span className="text-white font-semibold">
              {cap(season)} season
            </span>
            , and your location (
            {weather?.name || profile?.village || "Gujarat"}) to score{" "}
            {CROP_DATABASE.length} crops for suitability.
          </p>
          <div className="flex gap-4 mt-4 text-emerald-200/80 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-300 rounded-full" />{" "}
              {topCrops.length} crops recommended
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-amber-300 rounded-full" />{" "}
              {otherCrops.length} not ideal now
            </span>
          </div>
        </div>
      </div>

      {/* Current conditions summary */}
      {weather && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Temperature",
              value: `${weather.main?.temp?.toFixed(1)} C`,
              icon: "🌡️",
            },
            {
              label: "Humidity",
              value: `${weather.main?.humidity}%`,
              icon: "💧",
            },
            {
              label: "Wind",
              value: `${((weather.wind?.speed || 0) * 3.6).toFixed(0)} km/h`,
              icon: "💨",
            },
            { label: "Season", value: cap(season), icon: "📅" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-white border border-stone-200/80 shadow-sm p-4 text-center hover-lift"
            >
              <span className="text-xl">{item.icon}</span>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mt-1">
                {item.label}
              </p>
              <p className="text-lg font-bold text-stone-800">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Farmer's current crop assessment */}
      {farmerCropData && (
        <div
          className={`rounded-2xl border-2 p-5 ${farmerCropData.score >= 70
            ? "border-emerald-300 bg-emerald-50/50"
            : farmerCropData.score >= 40
              ? "border-amber-300 bg-amber-50/50"
              : "border-red-300 bg-red-50/50"
            }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{farmerCropData.icon}</span>
              <div>
                <p className="font-bold text-stone-800">
                  Your Crop: {farmerCropData.name}
                </p>
                <p className="text-xs text-stone-500">
                  {profile?.crop_stage
                    ? cap(profile.crop_stage) + " stage"
                    : "Currently growing"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`text-2xl font-extrabold ${farmerCropData.score >= 70
                  ? "text-emerald-600"
                  : farmerCropData.score >= 40
                    ? "text-amber-600"
                    : "text-red-600"
                  }`}
              >
                {farmerCropData.score}%
              </p>
              <p className="text-[10px] text-stone-400">suitability</p>
            </div>
          </div>
          <div className="h-2.5 rounded-full bg-stone-200">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${farmerCropData.score >= 70
                ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                : farmerCropData.score >= 40
                  ? "bg-gradient-to-r from-amber-400 to-amber-600"
                  : "bg-gradient-to-r from-red-400 to-red-600"
                }`}
              style={{ width: `${farmerCropData.score}%` }}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
            {farmerCropData.factors.map((f, fi) => (
              <div key={fi} className="text-center">
                <p
                  className={`text-xs font-bold ${f.status === "good"
                    ? "text-emerald-600"
                    : f.status === "bad"
                      ? "text-red-600"
                      : "text-amber-600"
                    }`}
                >
                  {f.pts}pt
                </p>
                <p className="text-[10px] text-stone-500">{f.name}</p>
                <p className="text-[9px] text-stone-400">{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* Recommended crops */}
      <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-stone-800">
              Recommended Crops for Your Farm
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Ranked by AI suitability score - based on weather, season, and
              soil conditions
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {topCrops.length} crops
          </span>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topCrops.map((c, ci) => {
            const isTop = ci === 0;
            return (
              <div
                key={ci}
                className={`rounded-xl border overflow-hidden hover-lift transition-all ${isTop
                  ? "border-emerald-300 ring-2 ring-emerald-200"
                  : "border-stone-200"
                  }`}
              >
                <div className={`h-1.5 bg-gradient-to-r ${c.gradient}`} />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{c.icon}</span>
                      <div>
                        <p className="font-bold text-stone-800 text-sm flex items-center gap-1.5">
                          {c.name}
                          {isTop && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                              TOP PICK
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          {cap(c.season)} &middot; {c.duration}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`text-lg font-extrabold ${c.score >= 80
                        ? "text-emerald-600"
                        : c.score >= 60
                          ? "text-teal-600"
                          : "text-amber-600"
                        }`}
                    >
                      {c.score}%
                    </div>
                  </div>
                  {/* Score bar */}
                  <div className="h-1.5 rounded-full bg-stone-100 mb-3">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${c.gradient} transition-all duration-1000`}
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                  {/* Factor pills */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {c.factors.map((f, fi) => (
                      <span
                        key={fi}
                        className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${f.status === "good"
                          ? "bg-emerald-50 text-emerald-700"
                          : f.status === "bad"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                          }`}
                      >
                        {f.name}: {f.value}
                      </span>
                    ))}
                  </div>
                  {/* Details */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Water</span>
                      <span className="font-semibold text-stone-600">
                        {c.waterNeed}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Soil</span>
                      <span className="font-semibold text-stone-600">
                        {c.soilType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">MSP</span>
                      <span className="font-semibold text-stone-600">
                        {c.msp}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Duration</span>
                      <span className="font-semibold text-stone-600">
                        {c.duration}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Yield (pred.)</span>
                      <span
                        className={`font-semibold ${Number.isFinite(yieldByCrop[c.name.toLowerCase()])
                          ? "text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded-md"
                          : "text-stone-600"
                          }`}
                      >
                        {Number.isFinite(yieldByCrop[c.name.toLowerCase()])
                          ? `${yieldByCrop[c.name.toLowerCase()].toFixed(2)} t/ha`
                          : yieldLoading
                            ? "..."
                            : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Not recommended right now */}
      {otherCrops.length > 0 && (
        <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h3 className="font-bold text-stone-800">Not Ideal Right Now</h3>
            <p className="text-xs text-stone-400 mt-0.5">
              These crops score below 60% suitability for current conditions
            </p>
          </div>
          <div className="divide-y divide-stone-100">
            {otherCrops.map((c, ci) => (
              <div
                key={ci}
                className="px-6 py-3 flex items-center justify-between hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{c.icon}</span>
                  <div>
                    <p className="font-semibold text-stone-700 text-sm">
                      {c.name}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {cap(c.season)} crop &middot; {c.duration}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-1.5 rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-stone-300 to-stone-400 transition-all duration-700"
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-stone-400 w-10 text-right">
                    {c.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seasonal planting guide */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-5">
        <h4 className="font-bold text-stone-800 text-sm mb-3">
          How AI scores are calculated
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs text-stone-600">
          <div className="flex gap-2">
            <span className="text-emerald-600 font-extrabold shrink-0">
              30pt
            </span>
            <span>
              AI Yield Potential - (Predicted Yield / State Benchmark Yield) x
              30
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-emerald-600 font-extrabold shrink-0">
              20pt
            </span>
            <span>
              Temperature Match - 20 perfect, 10 survivable, 0 extreme stress
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-emerald-600 font-extrabold shrink-0">
              30pt
            </span>
            <span>
              Season Alignment - 30 correct season, 15 early/late, 0 wrong
              season
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-emerald-600 font-extrabold shrink-0">
              10pt
            </span>
            <span>Humidity Match - 10 optimal, 5 too humid or too dry</span>
          </div>
          <div className="flex gap-2">
            <span className="text-emerald-600 font-extrabold shrink-0">
              10pt
            </span>
            <span>
              Sunlight &amp; Wind - 5 for adequate sunlight + 5 for calm winds
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   AUTONOMOUS ALERT SYSTEM TAB
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function AlertSystemTab({ profile }) {
  const crop = profile?.primary_crop ? cap(profile.primary_crop) : "Crop";
  const village = profile?.village || "Your area";

  const ALERT_RULES = [
    {
      id: 1,
      name: "Flood Risk Alert",
      trigger: "SAR moisture > 85%",
      status: "active",
      severity: "critical",
      lastTriggered: "12 hours ago",
      desc: "Triggers when soil waterlogging is detected via SAR satellite data",
    },
    {
      id: 2,
      name: "Pest Outbreak Warning",
      trigger: "Humidity > 80% + Temp 25-32 C",
      status: "active",
      severity: "high",
      lastTriggered: "2 days ago",
      desc: "Monitors weather conditions favorable for pest breeding",
    },
    {
      id: 3,
      name: "Frost Alert",
      trigger: "Temp forecast < 4 C",
      status: "active",
      severity: "critical",
      lastTriggered: "Never",
      desc: "Early warning for frost damage risk to standing crops",
    },
    {
      id: 4,
      name: "Mandi Price Drop",
      trigger: `${crop} price drops > 10%`,
      status: "active",
      severity: "medium",
      lastTriggered: "5 days ago",
      desc: "Alerts when market price for your crop drops significantly",
    },
    {
      id: 5,
      name: "Irrigation Needed",
      trigger: "Soil moisture < 30%",
      status: "paused",
      severity: "medium",
      lastTriggered: "1 day ago",
      desc: "Based on SAR soil moisture estimation for your farm coordinates",
    },
    {
      id: 6,
      name: "Optimal Harvest Window",
      trigger: "NDVI plateau + weather clear",
      status: "active",
      severity: "low",
      lastTriggered: "Never",
      desc: "Identifies the best harvest window using satellite and weather data",
    },
  ];

  const RECENT_ALERTS = [
    {
      time: "2h ago",
      title: "Heavy Rainfall Warning",
      text: `${village}: 40mm rainfall expected in next 24h. Secure stored grain.`,
      severity: "critical",
    },
    {
      time: "8h ago",
      title: "Soil Moisture High",
      text: `Your farm plot shows 78% soil moisture. Hold irrigation for 2 days.`,
      severity: "high",
    },
    {
      time: "1d ago",
      title: `${crop} Price Update`,
      text: `${crop} price at nearest mandi increased by Rs 85/quintal.`,
      severity: "low",
    },
    {
      time: "3d ago",
      title: "Growth Anomaly Detected",
      text: "SAR data shows uneven growth in NW quadrant. Inspect for nutrient deficiency.",
      severity: "medium",
    },
  ];

  const severityColors = {
    critical: {
      bg: "bg-red-50",
      border: "border-red-300",
      dot: "bg-red-500",
      text: "text-red-700",
      badge: "bg-red-100 text-red-700",
    },
    high: {
      bg: "bg-orange-50",
      border: "border-orange-300",
      dot: "bg-orange-500",
      text: "text-orange-700",
      badge: "bg-orange-100 text-orange-700",
    },
    medium: {
      bg: "bg-amber-50",
      border: "border-amber-300",
      dot: "bg-amber-500",
      text: "text-amber-700",
      badge: "bg-amber-100 text-amber-700",
    },
    low: {
      bg: "bg-blue-50",
      border: "border-blue-300",
      dot: "bg-blue-500",
      text: "text-blue-700",
      badge: "bg-blue-100 text-blue-700",
    },
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-stone-800">
          Autonomous Alert System
        </h2>
        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          System Active
        </span>
      </div>

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/[0.05] rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/[0.03] rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <p className="text-red-200 text-xs font-semibold uppercase tracking-wider">
            Zero-Human-Intervention
          </p>
          <h3 className="text-xl font-bold mt-2">Smart Alert Engine</h3>
          <p className="text-red-100/70 text-sm mt-2 max-w-xl">
            Autonomous rules engine that monitors SAR satellite data, weather
            feeds, soil sensors, and mandi prices in real-time. Alerts are
            triggered automatically - no manual checking needed.
          </p>
        </div>
      </div>

      {/* Architecture diagram */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Data Sources",
            value: "6",
            sub: "SAR, Weather, Mandi, Soil, NDVI, Govt",
            color: "from-violet-500 to-purple-600",
          },
          {
            label: "Active Rules",
            value: String(
              ALERT_RULES.filter((r) => r.status === "active").length,
            ),
            sub: "Monitoring 24/7",
            color: "from-emerald-500 to-teal-600",
          },
          {
            label: "Alerts Sent",
            value: "14",
            sub: "This month",
            color: "from-amber-500 to-orange-600",
          },
          {
            label: "Avg Response",
            value: "<2m",
            sub: "Detection to alert",
            color: "from-sky-500 to-blue-600",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white border border-stone-200/80 shadow-sm p-5 hover-lift"
          >
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-md`}
            >
              <span className="text-white font-bold text-sm">{s.value}</span>
            </div>
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              {s.label}
            </p>
            <p className="text-lg font-bold text-stone-800 mt-0.5">{s.value}</p>
            <p className="text-xs text-stone-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent alerts feed */}
      <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-bold text-stone-800">Recent Alerts</h3>
          <span className="text-xs text-stone-400">Last 7 days</span>
        </div>
        <div className="divide-y divide-stone-100">
          {RECENT_ALERTS.map((a, i) => {
            const c = severityColors[a.severity];
            return (
              <div
                key={i}
                className={`px-6 py-4 ${c.bg} border-l-4 ${c.border} hover:brightness-[0.98] transition-all`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  <h4 className="font-bold text-stone-800 text-sm">
                    {a.title}
                  </h4>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.badge} ml-auto`}
                  >
                    {a.severity}
                  </span>
                  <span className="text-[10px] text-stone-400">{a.time}</span>
                </div>
                <p className="text-sm text-stone-600 ml-4">{a.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alert rules */}
      <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <h3 className="font-bold text-stone-800">Alert Rules</h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Autonomous rules that run continuously on your farm data
          </p>
        </div>
        <div className="divide-y divide-stone-100">
          {ALERT_RULES.map((rule) => {
            const c = severityColors[rule.severity];
            return (
              <div
                key={rule.id}
                className="px-6 py-4 flex items-center gap-4 hover:bg-stone-50 transition-colors"
              >
                <div className={`w-3 h-3 rounded-full ${c.dot} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-stone-800 text-sm">
                      {rule.name}
                    </p>
                    {rule.status === "paused" && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                        Paused
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">{rule.desc}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-stone-400 font-mono">
                    {rule.trigger}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    Last: {rule.lastTriggered}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ADAPTIVE CALENDAR TAB
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function AdaptiveCalendarTab({ profile }) {
  const crop = profile?.primary_crop ? cap(profile.primary_crop) : "Onion";
  const stage = profile?.crop_stage ? cap(profile.crop_stage) : "Vegetative";

  const today = new Date();
  const monthName = today.toLocaleString("default", { month: "long" });
  const year = today.getFullYear();
  const daysInMonth = new Date(year, today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(year, today.getMonth(), 1).getDay();

  // Generate calendar events (mock but contextual)
  const events = {
    [today.getDate()]: { type: "today", label: "Today" },
    [today.getDate() + 2]: {
      type: "irrigation",
      label: "Irrigation",
      color: "bg-blue-500",
    },
    [today.getDate() + 4]: {
      type: "fertilizer",
      label: "Fertilizer",
      color: "bg-emerald-500",
    },
    [today.getDate() + 7]: {
      type: "pest",
      label: "Pest Spray",
      color: "bg-amber-500",
    },
    [today.getDate() + 12]: {
      type: "harvest",
      label: "Harvest Check",
      color: "bg-orange-500",
    },
    [today.getDate() + 15]: {
      type: "mandi",
      label: "Mandi Visit",
      color: "bg-purple-500",
    },
  };

  const UPCOMING = [
    {
      date: `${monthName} ${today.getDate() + 2}`,
      title: "Scheduled Irrigation",
      desc: "SAR data shows soil moisture dropping to 32%. Irrigate before it reaches critical 25% threshold.",
      icon: "💧",
      color: "border-blue-300 bg-blue-50",
    },
    {
      date: `${monthName} ${today.getDate() + 4}`,
      title: "Nitrogen Application",
      desc: `${crop} in ${stage} stage needs nitrogen boost. Weather window is clear for next 3 days.`,
      icon: "🌿",
      color: "border-emerald-300 bg-emerald-50",
    },
    {
      date: `${monthName} ${today.getDate() + 7}`,
      title: "Preventive Pest Spray",
      desc: "Humidity forecast 82% this week. Apply preventive spray to avoid fungal infection.",
      icon: "🐛",
      color: "border-amber-300 bg-amber-50",
    },
    {
      date: `${monthName} ${today.getDate() + 12}`,
      title: "Pre-Harvest Assessment",
      desc: "NDVI plateau detected. Conduct field inspection to confirm harvest readiness.",
      icon: "📋",
      color: "border-orange-300 bg-orange-50",
    },
    {
      date: `${monthName} ${today.getDate() + 15}`,
      title: "Mandi Price Window",
      desc: `${crop} prices trending up. Optimal selling window projected for this period.`,
      icon: "📊",
      color: "border-purple-300 bg-purple-50",
    },
  ];

  const SEASONS = [
    {
      name: "Kharif",
      months: "Jun - Oct",
      crops: "Rice, Maize, Groundnut, Soyabean",
      active: today.getMonth() >= 5 && today.getMonth() <= 9,
    },
    {
      name: "Rabi",
      months: "Nov - Mar",
      crops: "Onion, Potato, Wheat",
      active: today.getMonth() >= 10 || today.getMonth() <= 2,
    },
    {
      name: "Zaid",
      months: "Mar - Jun",
      crops: "Cucumber, Watermelon, Muskmelon",
      active: today.getMonth() >= 2 && today.getMonth() <= 5,
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-stone-800">Adaptive Calendar</h2>
        <span className="text-xs text-stone-400">
          {crop} &middot; {stage} stage
        </span>
      </div>

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.05] rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="relative z-10">
          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">
            AI-Powered Scheduling
          </p>
          <h3 className="text-xl font-bold mt-2">
            Farm calendar that adapts to your crop, weather, and satellite data
          </h3>
          <p className="text-indigo-100/70 text-sm mt-2 max-w-xl">
            Every task is auto-scheduled based on real-time SAR moisture data,
            weather forecasts, crop growth stage, and market trends. The
            calendar updates itself - you just follow it.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-3 rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-bold text-stone-800">
              {monthName} {year}
            </h3>
            <div className="flex gap-1">
              {[
                { label: "Irrigation", color: "bg-blue-500" },
                { label: "Fertilizer", color: "bg-emerald-500" },
                { label: "Pest", color: "bg-amber-500" },
                { label: "Harvest", color: "bg-orange-500" },
              ].map((l) => (
                <div
                  key={l.label}
                  className="flex items-center gap-1 text-[9px] text-stone-400 px-1.5"
                >
                  <span className={`w-2 h-2 rounded-full ${l.color}`} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
          <div className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-semibold text-stone-400 uppercase py-1"
                >
                  {d}
                </div>
              ))}
            </div>
            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const ev = events[day];
                const isToday = day === today.getDate();
                return (
                  <div
                    key={day}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all ${isToday
                      ? "bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/30"
                      : ev
                        ? "bg-stone-50 font-medium hover:bg-stone-100"
                        : "text-stone-600 hover:bg-stone-50"
                      }`}
                  >
                    {day}
                    {ev && !isToday && (
                      <span
                        className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${ev.color || "bg-emerald-500"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Season timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm p-5">
            <h4 className="font-bold text-stone-800 text-sm mb-3">
              Crop Seasons
            </h4>
            <div className="space-y-3">
              {SEASONS.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${s.active ? "border-emerald-300 bg-emerald-50" : "border-stone-200 bg-stone-50"}`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${s.active ? "bg-emerald-500 animate-pulse" : "bg-stone-300"}`}
                  />
                  <div>
                    <p className="text-sm font-bold text-stone-800">
                      {s.name}{" "}
                      <span className="font-normal text-stone-400">
                        ({s.months})
                      </span>
                    </p>
                    <p className="text-xs text-stone-500">{s.crops}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 p-5">
            <h4 className="font-bold text-stone-800 text-sm">How it adapts</h4>
            <ul className="mt-2 space-y-2 text-xs text-stone-600">
              <li className="flex gap-2">
                <span className="text-indigo-500 font-bold">1.</span>Reads SAR
                moisture + NDVI daily
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-500 font-bold">2.</span>Checks
                7-day weather forecast
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-500 font-bold">3.</span>Matches
                crop stage requirements
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-500 font-bold">4.</span>Reschedules
                tasks automatically
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upcoming tasks */}
      <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <h3 className="font-bold text-stone-800">Upcoming Farm Tasks</h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Auto-generated based on your crop, weather, and satellite data
          </p>
        </div>
        <div className="divide-y divide-stone-100">
          {UPCOMING.map((t, i) => (
            <div
              key={i}
              className={`px-6 py-4 border-l-4 ${t.color} hover:brightness-[0.98] transition-all`}
            >
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xl">{t.icon}</span>
                <div>
                  <p className="font-bold text-stone-800 text-sm">{t.title}</p>
                  <p className="text-[10px] text-stone-400">{t.date}</p>
                </div>
              </div>
              <p className="text-sm text-stone-600 ml-9">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SHARED COMPONENTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function StatCard({ label, value, sub, gradient, iconPath }) {
  return (
    <div className="rounded-2xl bg-white border border-stone-200/80 shadow-sm p-5 hover-lift group">
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon d={iconPath} className="w-5 h-5 text-white" />
      </div>
      <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-lg font-bold text-stone-800 mt-0.5 capitalize">
        {value}
      </p>
      {sub && <p className="text-xs text-stone-400 capitalize">{sub}</p>}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm py-2 border-b border-stone-100 last:border-0">
      <span className="text-stone-400">{label}</span>
      <span className="font-medium text-stone-700 capitalize">{value}</span>
    </div>
  );
}

function MiniGauge({ label, value, color }) {
  const bg =
    color === "emerald"
      ? "bg-emerald-100"
      : color === "teal"
        ? "bg-teal-100"
        : "bg-amber-100";
  const fill =
    color === "emerald"
      ? "bg-emerald-500"
      : color === "teal"
        ? "bg-teal-500"
        : "bg-amber-500";
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-stone-500">{label}</span>
        <span className="font-bold text-stone-700">{value}%</span>
      </div>
      <div className={`h-2 rounded-full ${bg}`}>
        <div
          className={`h-full rounded-full ${fill} transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function GaugeBar({ label, value, max, color, unit }) {
  const pct = (value / max) * 100;
  const fills = {
    emerald: "from-emerald-400 to-emerald-600",
    teal: "from-teal-400 to-teal-600",
    blue: "from-blue-400 to-blue-600",
    amber: "from-amber-400 to-amber-600",
  };
  const bgs = {
    emerald: "bg-emerald-100",
    teal: "bg-teal-100",
    blue: "bg-blue-100",
    amber: "bg-amber-100",
  };
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-stone-500 font-medium">{label}</span>
        <span className="font-bold text-stone-700">
          {value}
          {unit}
        </span>
      </div>
      <div className={`h-3 rounded-full ${bgs[color] || "bg-stone-100"}`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${fills[color]} transition-all duration-1000`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function InsightCard({ title, desc, color, icon }) {
  const styles = {
    blue: "border-blue-200 bg-blue-50",
    amber: "border-amber-200 bg-amber-50",
    emerald: "border-emerald-200 bg-emerald-50",
  };
  return (
    <div
      className={`rounded-2xl border p-5 ${styles[color] || styles.emerald} hover-lift`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <h4 className="font-bold text-stone-800 text-sm">{title}</h4>
      </div>
      <p className="text-sm text-stone-600">{desc}</p>
    </div>
  );
}

function MiniCard({ title, value, sub, accent }) {
  const styles = {
    sky: "border-sky-200 bg-sky-50",
    blue: "border-blue-200 bg-blue-50",
    amber: "border-amber-200 bg-amber-50",
  };
  return (
    <div
      className={`rounded-2xl border p-5 ${styles[accent] || "border-stone-200 bg-white"} hover-lift`}
    >
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
        {title}
      </p>
      <p className="text-2xl font-bold text-stone-800 mt-1">{value}</p>
      <p className="text-xs text-stone-500 mt-0.5">{sub}</p>
    </div>
  );
}

function cap(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
