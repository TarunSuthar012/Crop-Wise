# BeejRakshak

**Farmer-first AgriTech platform**: mandi recommendations, government scheme matching, SAR-based field monitoring, and registration/auth — web, mobile, and APIs.

---

## What the Project Does

- **Mandi Intelligence** — ML price forecasts and net-profit arbitrage (where/when to sell; transport/storage/perishability costs).
- **Scheme Assistant (Scrapbot)** — Government scheme scraping, eligibility matching by state/category, PMFBY insurance claim PDF generation.
- **SAR Processing** — Sentinel-1 SAR backscatter (VV/VH) via Google Earth Engine; moisture deltas and flood heuristics; results stored in PostGIS.
- **Web & Mobile** — React (Vite) dashboard and Expo app with Supabase auth (OTP/email), registration, and multi-language support.

---

## Tech Stack (Concise)

| Layer | Technologies |
|-------|--------------|
| **Web frontend** | React 18, Vite 5, Tailwind CSS 3, React Router, Supabase JS |
| **Mobile** | Expo ~50, React Native 0.73, React Navigation, Supabase, AsyncStorage, expo-location |
| **Backend / API** | Express (Node), CORS, dotenv; Supabase (Auth + DB) |
| **AI/ML API** | FastAPI, Uvicorn; unified app mounts Mandi + Schemes |
| **Mandi ML** | Pandas, XGBoost, scikit-learn; `commodity_price.csv` (AGMARKNET-style); per–mandi–crop models |
| **Schemes** | FastAPI, FPDF (claim PDFs); `schemes_db.json` (state/scope/tags); scheme_scraper, scheme_matcher, claim_generator |
| **SAR** | Python 3.10+, earthengine-api, psycopg2-binary, Shapely, python-dotenv; GEE `COPERNICUS/S1_GRD` |
| **Data** | Supabase (PostgreSQL); PostGIS + `fields`, `sar_features` for SAR |
| **Run** | npm (root + client + server); uv/pyproject (SAR); venv + pip (AIML) |

---

## Datasets & Data Sources

- **Mandi prices**: `AIML/mandi_intelligence/dataset/commodity_price.csv` — AGMARKNET-style (Date, State, District, Market, Commodity, Variety, Min/Max/Modal_Price ₹/quintal). Used for Onion, Tomato, Potato; mandis include Ahmedabad, Mehsana, Rajkot (and others in config).
- **Scheme data**: `AIML/scrapbot/src/schemes_db.json` — Built by `scheme_scraper` (mock/official-style entries): name, description, scope (Central/Gujarat/Maharashtra/etc.), tags (e.g. small_farmer, all_farmers).
- **SAR**: No local dataset; live **Sentinel-1 GRD** (`COPERNICUS/S1_GRD`, VV/VH) via Google Earth Engine; geometry from DB table `fields` (PostGIS).

---

## Models

- **Mandi**: **XGBoost** regressors per (Mandi, Crop). Features: day_of_week, month, week_of_year, lags (1/7/14 days), 7/14-day rolling mean/std, days_since_start. Trained on `commodity_price.csv`; 7-day recursive forecast; net profit = revenue − transport (e.g. ₹5/km) − storage − perishability − traffic. Persisted under `AIML/mandi_intelligence/ml_arbitrage/models/` (e.g. `Ahmedabad_Onion_model.pkl`).
- **SAR**: **Rule-based** only: moisture anomaly from VV 7-day delta vs threshold; flood flag from VV/VH means (e.g. VV < -18, VH < -22). No trainable model.

---

## SAR (Synthetic Aperture Radar) Pipeline

- **Source**: GEE `COPERNICUS/S1_GRD`, IW mode, VV and VH.
- **Flow**: `worker.py` loads field geometries from `fields`; for each field, fetches current and previous 7-day means via `gee_client.get_sar_means()`; `feature_extractor` computes 7-day deltas; `anomaly_detection` sets moisture (high/normal/low) and flood flag; results written to `sar_features` (field_id, date, vv_mean, vh_mean, vv_delta_7d, vh_delta_7d, moisture_anomaly, flood_flag).
- **Config**: `SAR_LOOKBACK_DAYS`, `SAR_SCALE_METERS`, `MOISTURE_DELTA_THRESHOLD`, `ENABLE_GEE`, `DATABASE_URL`, `DB_SSLMODE` (see `sar_processing/config.py`).

---

## Repository Layout

```
BeejRakshak/
├── client/                 # React (Vite + Tailwind) web app
├── server/                 # Express backend (API, proxy to Supabase)
├── mobile/                 # Expo / React Native app
├── AIML/                   # Unified AI/ML service
│   ├── main.py             # FastAPI app: mounts /mandi, /schemes
│   ├── mandi_intelligence/ # Mandi API + ml_arbitrage + dataset
│   └── scrapbot/           # Scheme scraper, matcher, claim PDFs
├── sar_processing/        # GEE SAR worker, DB, anomaly logic
└── docs/                   # e.g. registration-table.sql
```

---

## Setup & Run

1. **Env**: Root `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `PORT=3001`. SAR: `DATABASE_URL`, optional `ENABLE_GEE=true`. AIML: Python venv, `pip install -r AIML/mandi_intelligence/requirements.txt` (and fpdf for claims).
2. **DB**: Supabase — run `docs/registration-table.sql` (registrations, RLS). SAR: PostGIS + `fields`/`sar_features` (see `sar_processing/bootstrap_db.py`).
3. **Install**: `npm run install:all` (root + client + server). SAR: `uv sync` in `sar_processing/`. AIML: `pip install -r AIML/mandi_intelligence/requirements.txt`.
4. **Run**:
   - Web: `npm run dev` → frontend http://localhost:5173, backend http://localhost:3001; client proxies `/api` → 3001, `/mandi-api` and `/schemes-api` → 8000.
   - AIML: `cd AIML && python main.py` or `uvicorn main:app --host 0.0.0.0 --port 8000` → `/mandi`, `/schemes`, `/docs`.
   - SAR: `cd sar_processing && python worker.py` (after GEE auth and DB bootstrap).

---

## Auth & Registration

- Login/signup at `/login`: Mobile OTP (primary; needs Supabase SMS provider) and/or email/password. Post-login redirect to `/registration` or `/dashboard`.
- Registration table: one row per user keyed by `user_id` (auth.uid()); RLS `auth.uid() = user_id`. Schema in `docs/registration-table.sql`.

---

## Scripts (Root)

| Command | Description |
|---------|-------------|
| `npm run dev` | Frontend + backend |
| `npm run dev:client` | Vite only (port 5173) |
| `npm run dev:server` | Express only (port 3001) |
| `npm run build` | Build client and server |
| `npm run install:all` | Install root, client, server |

---

*BeejRakshak — built for farmers.*
