# BeejRakshak Mobile (Expo)

Cross-platform mobile app (iOS/Android/Web) for farmer login, registration, and dashboard. Uses same Supabase backend as the web client.

---

## What It Does

- **Auth**: Login screen (Supabase); optional registration flow.
- **Registration**: Farmer profile (aligned with web: language, location, land, crop, etc.) via Supabase.
- **Dashboard**: Post-login home with stats/sections (e.g. StatCard, Badge, Section components).
- **Navigation**: React Navigation (native-stack).
- **i18n**: Multi-language support (e.g. `translation/`: LanguageMenu, TranslatedText, TranslationProvider, languages).

---

## Tech Stack

- **Expo** ~50, **React Native** 0.73.
- **Navigation**: `@react-navigation/native`, `@react-navigation/native-stack`, react-native-screens, react-native-safe-area-context.
- **Auth & storage**: `@supabase/supabase-js`, `@react-native-async-storage/async-storage`.
- **Other**: expo-constants, expo-linear-gradient, expo-location, react-native-url-polyfill, react-native-web (for web target).

---

## Layout

```
mobile/
├── App.js
├── app.config.js
├── app.json
├── package.json
├── babel.config.js
├── src/
│   ├── context/     # AuthContext
│   ├── lib/         # config, registration, supabase
│   ├── navigation/  # AppNavigator
│   ├── screens/     # Login, Registration, Dashboard
│   ├── components/  # Badge, Section, StatCard
│   ├── theme.js
│   └── translation/ # LanguageMenu, TranslatedText, TranslationProvider, languages
└── assets/
```

---

## Setup & Run

1. **Install**: `npm install` in `mobile/`.
2. **Env**: Point Supabase in `src/lib/config.js` (or env) to same project as web.
3. **Run**: `npm run start` (Expo dev server); use Expo Go on device or simulator.  
   - `npm run android` / `npm run ios` / `npm run web` as needed.

---

Part of **BeejRakshak**. See root `README.md` for full project.
