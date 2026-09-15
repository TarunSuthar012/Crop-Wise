# BeejRakshak AIML — Unified API

Single FastAPI application that mounts **Mandi Intelligence** and **Scrapbot (Scheme Assistant)**. One server, two modules.

---

## What It Does

- **Mandi** (`/mandi`): ML-based mandi price recommendations and farmer feedback. Uses `commodity_price.csv`, XGBoost per mandi–crop, arbitrage engine (net profit with transport/storage/perishability).
- **Schemes** (`/schemes`): Government scheme recommendations by state/category; PMFBY claim PDF generation (FPDF). Serves scrapbot static files (e.g. claim PDFs at `/static/`).

---

## Tech Stack

- **Runtime**: Python 3.x, FastAPI, Uvicorn.
- **Mandi**: Pandas, XGBoost, scikit-learn. Dataset: `mandi_intelligence/dataset/commodity_price.csv` (AGMARKNET-style). Models in `mandi_intelligence/ml_arbitrage/models/` (pickled XGBoost).
- **Scrapbot**: FPDF (claim PDFs), JSON `schemes_db.json`; scheme_scraper, scheme_matcher, claim_generator.

---

## Layout

```
AIML/
├── main.py                    # Unified app: CORS, mount /mandi, /schemes; root /health, /mandis, /response, /respond
├── mandi_intelligence/       # Mandi API + ml_arbitrage + dataset (see mandi_intelligence/README.md)
└── scrapbot/                  # Scheme API + scraper + matcher + claims (see scrapbot/README.md)
```

---

## Run

From repo root or `AIML/`:

```bash
# Dependencies (in AIML or mandi_intelligence)
pip install -r mandi_intelligence/requirements.txt
pip install fpdf   # for claim PDFs

# Start unified API (default port 8000)
python main.py
# or: uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- **Docs**: http://localhost:8000/docs  
- **Mandi**: http://localhost:8000/mandi/docs  
- **Schemes**: http://localhost:8000/schemes/docs (if scrapbot loaded)

If FPDF is missing, schemes mount may be skipped; a fallback route for `/schemes/api/v1/schemes/recommend` can still serve scheme recommendations via `scheme_matcher`.

---

## Endpoints (root)

- `GET /`, `GET /health` — status.
- `GET /mandis` — list mandis (from Mandi).
- `POST /response` — mandi recommendation (body: crop, quantity, optional farmer_location, latitude, longitude).
- `POST /respond` — submit farmer feedback/sale data.
- `GET /mandi-health` — Mandi health.
- Schemes: under `/schemes/` (e.g. recommend, claims/generate) when scrapbot is loaded.

---

Part of **BeejRakshak**. See root `README.md` for full project overview.
