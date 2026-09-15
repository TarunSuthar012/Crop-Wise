# SAR Processing — BeejRakshak

Pipeline that computes **Sentinel-1 SAR** backscatter statistics per field, derives 7-day deltas and anomaly flags, and stores results in PostgreSQL (PostGIS).

---

## What It Does

- Reads field polygons from PostGIS table **`fields`** (id, geometry).
- For each field, fetches **VV and VH** mean backscatter from **Google Earth Engine** (`COPERNICUS/S1_GRD`, IW mode) for current and previous 7-day windows.
- Computes **7-day deltas** (current − previous); classifies **moisture anomaly** (high/normal/low) from VV delta vs threshold; sets **flood flag** from VV/VH heuristics.
- Writes one row per (field_id, date) into **`sar_features`**: vv_mean, vh_mean, vv_delta_7d, vh_delta_7d, moisture_anomaly, flood_flag.

---

## Tech Stack

- **Python**: 3.10+ (pyproject.toml / uv).
- **Dependencies**: `earthengine-api`, `psycopg2-binary`, `python-dotenv`, `shapely`. Dev: black, pytest, ruff.
- **Data**: GEE collection `COPERNICUS/S1_GRD`; PostgreSQL with PostGIS (`fields`, `sar_features`).

---

## Dataset / Data Source

- **No local SAR file**. Input geometry from DB; SAR from GEE. Config: `SAR_SCALE_METERS` (e.g. 10), `SAR_LOOKBACK_DAYS` (e.g. 90), `MOISTURE_DELTA_THRESHOLD` (e.g. 1.5).

---

## Models / Logic

- **No ML model**. Rule-based only:
  - **Moisture anomaly**: `vv_delta_7d > threshold` → high, `< -threshold` → low, else normal.
  - **Flood**: `vv_mean < -18 and vh_mean < -22` → True.

---

## Layout

```
sar_processing/
├── config.py       # DB_URL, DB_SSLMODE, SAR_*, ENABLE_GEE, ENV, LOG_LEVEL
├── db.py           # get_connection, fetch_fields, insert_sar_features
├── gee_client.py   # get_sar_means(field_geometry, start_date, end_date) → {vv_mean, vh_mean}
├── feature_extractor.py  # compute_deltas(current, previous) → vv_delta_7d, vh_delta_7d
├── anomaly_detection.py  # detect_moisture_anomaly, detect_flood
├── worker.py       # run(): for each field, GEE → deltas → anomaly → insert_sar_features
├── bootstrap_db.py # PostGIS + farmers, fields, sar_features
├── pyproject.toml  # deps: earthengine-api, psycopg2-binary, python-dotenv, shapely
└── main.py         # placeholder entrypoint
```

---

## Setup & Run

1. **Env**: `DATABASE_URL`, optional `DB_SSLMODE`, `SAR_LOOKBACK_DAYS`, `SAR_SCALE_METERS`, `MOISTURE_DELTA_THRESHOLD`, `ENABLE_GEE`. Use `.env` or export.
2. **GEE**: Authenticate (`earthengine authenticate`) if using live GEE; otherwise stub values in `gee_client` when GEE is unavailable.
3. **DB**: Run `bootstrap_db.py` to create PostGIS, `farmers`, `fields`, `sar_features`.
4. **Install**: `uv sync` (or `pip install -e .`) in `sar_processing/`.
5. **Run worker**: `python worker.py` (e.g. from cron for daily runs).

---

Part of **BeejRakshak**. See root `README.md` for full project.
