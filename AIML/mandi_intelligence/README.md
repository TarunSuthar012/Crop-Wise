# Mandi Intelligence

ML-powered mandi price recommendations and net-profit arbitrage for BeejRakshak. FastAPI service + data loader + XGBoost predictor + arbitrage engine.

---

## What It Does

- **Price prediction**: XGBoost models per (Mandi, Crop) forecast prices up to 7 days ahead.
- **Net-profit arbitrage**: Best mandi and best timing (sell now vs wait) using transport (e.g. ₹5/km), storage (e.g. ₹0.50/kg/day), perishability, and traffic.
- **API**: `POST /response` (recommendations), `POST /respond` (farmer feedback), `GET /mandis`, `GET /health`.

---

## Dataset

- **Path**: `dataset/commodity_price.csv`.
- **Source**: AGMARKNET-style daily wholesale commodity prices (Date, State, District, Market, Commodity, Variety, Min/Max/Modal_Price in ₹/quintal).
- **Usage**: Loaded by `MandiDataLoader`; filtered for target mandis (e.g. Ahmedabad, Mehsana, Rajkot) and crops (Onion, Tomato, Potato); converted to ₹/kg; optional traffic/congestion; 90-day or full history for training.

---

## Models

- **Algorithm**: XGBoost Regressor (per Mandi–Crop pair).
- **Features**: day_of_week, day_of_month, week_of_year, month, days_since_start; price lags 1/7/14; 7/14-day rolling mean and std.
- **Training**: Time-series split; models saved under `ml_arbitrage/models/` (e.g. `Ahmedabad_Onion_model.pkl`). Retrained on startup from `commodity_price.csv`.
- **Inference**: Recursive 7-day forecast; fed into arbitrage engine for net profit and recommendation.

---

## Tech Stack

- **API**: FastAPI, Uvicorn, Pydantic.
- **ML**: Pandas, XGBoost, scikit-learn.
- **Dependencies**: `mandi_intelligence/requirements.txt` (fastapi, uvicorn, pydantic, pandas, xgboost, scikit-learn).

---

## Layout

```
mandi_intelligence/
├── api/main.py        # FastAPI app: /response, /respond, /mandis, /health; startup loads data & trains
├── dataset/commodity_price.csv
├── ml_arbitrage/
│   ├── data_loader.py    # MandiDataLoader: load, filter, normalize; mandi_config, target_crops
│   ├── price_predictor.py # PricePredictor: feature prep, train, get_price_forecast_all_mandis
│   ├── arbitrage_engine.py # Net profit; best mandi + timing; justification
│   ├── distance_calculator.py
│   └── models/            # *.pkl per Mandi_Crop
├── data/mandi_data.json  # Optional legacy mock
└── requirements.txt
```

---

## Run

- **As part of unified API**: From `AIML/`, `python main.py` (mounts at `/mandi`).
- **Standalone**: `cd mandi_intelligence && uvicorn api.main:app --reload --port 8000`.

Ensure `dataset/commodity_price.csv` exists; models are (re)trained on startup.

---

Part of **BeejRakshak**. See root `README.md` and `AIML/README.md`.
