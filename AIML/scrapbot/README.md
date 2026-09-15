# Scrapbot — Scheme Assistant

Government scheme recommendation and PMFBY insurance claim PDF generation. Runs as part of the unified AIML FastAPI app under `/schemes`.

---

## What It Does

- **Scheme scraping**: Populates `schemes_db.json` with scheme name, description, scope (Central/Gujarat/Maharashtra/etc.), tags (e.g. small_farmer, all_farmers). Current source: mock/curated list (Vikaspedia-style); `scheme_scraper` detects state scope from text.
- **Eligibility matching**: `scheme_matcher.get_recommended_schemes(profile)` filters by state and category, scores by scope (state vs Central) and tag match, returns sorted list.
- **Claim PDF**: `claim_generator.generate_insurance_claim(farmer, crop, damage_report)` produces PMFBY-style PDF (FPDF) with farmer/crop/incident and AI assessment; saved under `static/Claim_<uid>.pdf`.

---

## Dataset

- **File**: `src/schemes_db.json`.
- **Structure**: Array of objects: id, name, description, scope, tags, eligibility_text. Created/updated by `scheme_scraper.scrape_schemes()` (run on first startup if file missing).

---

## Tech Stack

- **API**: FastAPI (mounted from AIML `main.py`).
- **PDF**: FPDF (`pip install fpdf`).
- **Logic**: Pure Python; no ML. State scope from keyword detection; claim loss % from simple rule (e.g. rain > 100 mm → 85% else 10%).

---

## Layout

```
scrapbot/
├── src/
│   ├── main.py           # FastAPI app: /api/v1/schemes/recommend, /api/v1/claims/generate; static mount
│   ├── scheme_scraper.py # scrape_schemes() → schemes_db.json
│   ├── scheme_matcher.py # get_recommended_schemes(profile) → list of schemes with match_score
│   ├── claim_generator.py # PMFBYClaimPDF, generate_insurance_claim() → static/Claim_<uid>.pdf
│   └── schemes_db.json   # Generated/cached scheme list
└── static/               # Output PDFs (Claim_*.pdf)
```

---

## Run

- **With unified API**: From `AIML/`, `python main.py`; schemes at `/schemes` (and root fallbacks if scrapbot loads). Install `fpdf` for claim generation.
- **Standalone**: `cd scrapbot/src && python main.py` (optional; normally used via mount).

---

Part of **BeejRakshak**. See root `README.md` and `AIML/README.md`.
