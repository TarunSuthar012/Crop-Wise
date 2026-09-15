# BeejRakshak Web Client

React SPA for farmer registration, dashboard, government schemes, and (via proxy) Mandi and Scheme APIs.

---

## What It Does

- **Auth**: Login/signup at `/login` (mobile OTP primary, email/password optional) via Supabase Auth.
- **Registration**: Multi-step form (Aadhaar, language, village, district, state, location, land, crop, satellite consent, market preference); stored in Supabase (e.g. `registrations` table).
- **Dashboard**: Post-registration landing; can show scheme recommendations and link to Mandi/Scheme flows.
- **Government schemes**: UI to request scheme recommendations (state, land size, category) and display results; optional claim flow.
- **i18n**: Translation layer (e.g. `translation/`: languages, provider, translator, Google Translate widget).

---

## Tech Stack

- **React** 18, **Vite** 5, **Tailwind CSS** 3.
- **Routing**: React Router DOM v6.
- **Auth & DB**: Supabase JS client (`@supabase/supabase-js`).
- **Build**: Vite; env from repo root (e.g. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

---

## Proxy (vite.config.js)

- `/api` → `http://localhost:3001` (Express backend).
- `/mandi-api` → `http://localhost:8000` (strip prefix; Mandi/Schemes API).
- `/schemes-api` → `http://localhost:8000/schemes` (strip prefix).

Backend and AIML (port 8000) must be running for Mandi/Schemes to work.

---

## Layout

```
client/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── public/           # tea.png, vite.svg
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── pages/         # Login, Registration, Dashboard
    ├── components/     # e.g. GovernmentSchemes
    ├── hooks/          # useAuth
    ├── lib/            # supabase, registration
    └── translation/    # languages, translator, provider, widget
```

---

## Setup & Run

1. **Env**: In repo root, set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
2. **Install**: From root `npm run install:all` or in `client/`: `npm install`.
3. **Run**: From root `npm run dev` or in `client/`: `npm run dev` → http://localhost:5173.
4. **Build**: `npm run build`; output in `dist/`.

---

Part of **BeejRakshak**. See root `README.md` for full project.
