import sys
import os
import re
import subprocess
from pathlib import Path
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Prevent UnicodeEncodeError on Windows (default console encoding may be cp1252)
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

# Configure Paths so sub-modules can be imported
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
sys.path.append(str(BASE_DIR / "ml"))
sys.path.append(str(BASE_DIR / "mandi_intelligence"))
sys.path.append(str(BASE_DIR / "scrapbot" / "src"))

# Import the sub-applications (schemes optional if fpdf etc. missing)
from mandi_intelligence.api.main import app as mandi_app
from mandi_intelligence.api.main import (
    list_mandis as mandi_list_mandis,
    get_response as mandi_get_response,
    submit_response as mandi_submit_response,
    health_check as mandi_health_check,
    RecommendRequest,
    RespondRequest,
)
from fertilizer_router import router as fertilizer_router
from chatbot.main import router as chatbot_router

try:
    from scrapbot.src.main import app as scrapbot_app
    scrapbot_loaded = True
except Exception as e:
    scrapbot_loaded = False
    scrapbot_app = None
    # Windows terminals may not support emoji in stdout encoding; keep logs ASCII.
    print("WARNING: Scheme assistant not loaded (install fpdf for full support):", e)

# Create the Master App
app = FastAPI(
    title="BeejRakshak Unified API",
    description="Unified API for Mandi Intelligence and Government Scheme Assistance",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://crop-wise-lime.vercel.app",
        "https://beej-rakshak.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:8081",
    ],
    allow_origin_regex=r"https://crop-wise.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Claim-Risk", "X-Claim-Loss", "Content-Disposition"],
)

# Mount the sub-applications
app.mount("/mandi", mandi_app)
if scrapbot_loaded:
    app.mount("/schemes", scrapbot_app)
app.include_router(fertilizer_router, prefix="/api")
app.include_router(chatbot_router, prefix="/chatbot")

@app.on_event("startup")
async def startup_event():
    """Trigger startup events for mounted sub-applications"""
    print("Starting BeejRakshak Unified API...")
    
    # Manually trigger mandi_app startup
    # FastAPI mounted apps don't auto-run their startup events
    from mandi_intelligence.api.main import startup_event as mandi_startup
    await mandi_startup()
    
    print("All services initialized!")

@app.get("/")
def root():
    return {
        "message": "Welcome to BeejRakshak Unified API",
        "modules": {
            "mandi_intelligence": "/mandi/docs",
            "scheme_assistant": "/schemes/docs"
        },
        "status": "operational"
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/mandis")
async def mandis_root_alias():
    return await mandi_list_mandis()


@app.post("/response")
async def response_root_alias(request: dict):
    crop_aliases = {
        "soybean": "Soyabean",
        "soya bean": "Soyabean",
        "ground nut": "Groundnut",
    }
    crop = str(request.get("crop", "")).strip()
    request["crop"] = crop_aliases.get(crop.lower(), crop.title())
    return await mandi_get_response(RecommendRequest(**request))


@app.post("/respond")
async def respond_root_alias(request: dict):
    return await mandi_submit_response(RespondRequest(**request))


@app.get("/mandi-health")
async def mandi_health_root_alias():
    return await mandi_health_check()


# Schemes recommend fallback when scrapbot app failed to load (e.g. missing fpdf)
class SchemeRequest(BaseModel):
    state: str
    land_size_hectares: float
    category: str


class YieldBatchRequest(BaseModel):
    state: str
    district: str
    season: str
    year: str
    area: float
    area_units: str = "Hectare"
    crops: List[str]


_DEFAULT_YIELD_MODEL_DIR = Path(
    r"C:\Users\Hardik\OneDrive\Desktop\Agency\yield_model\deploy_no_production"
)
_FLOAT_RE = re.compile(r"[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?")


def _yield_model_dir() -> Path:
    return Path(os.getenv("YIELD_MODEL_DIR", str(_DEFAULT_YIELD_MODEL_DIR)))


def _yield_model_path() -> Path:
    default_model = _yield_model_dir() / "yield_model_no_production.bin"
    return Path(os.getenv("YIELD_MODEL_PATH", str(default_model)))


def _run_yield_prediction(
    *,
    state: str,
    district: str,
    crop: str,
    year: str,
    season: str,
    area: float,
    area_units: str,
) -> float:
    model_dir = _yield_model_dir()
    model_path = _yield_model_path()
    java_bin = os.getenv("YIELD_JAVA_BIN", "java")
    timeout_sec = float(os.getenv("YIELD_PREDICT_TIMEOUT_SEC", "12"))

    if not model_dir.exists():
        raise FileNotFoundError(f"Yield model directory not found: {model_dir}")
    if not model_path.exists():
        raise FileNotFoundError(f"Yield model file not found: {model_path}")

    cmd = [
        java_bin,
        "PredictYield",
        "--model",
        str(model_path),
        "--state",
        state,
        "--district",
        district,
        "--crop",
        crop,
        "--year",
        year,
        "--season",
        season,
        "--area",
        str(area),
        "--area-units",
        area_units,
    ]

    completed = subprocess.run(
        cmd,
        cwd=str(model_dir),
        capture_output=True,
        text=True,
        timeout=timeout_sec,
        check=False,
    )
    if completed.returncode != 0:
        err = (completed.stderr or completed.stdout or "").strip()
        if not err:
            err = f"PredictYield exited with code {completed.returncode}"
        raise RuntimeError(err)

    output = (completed.stdout or "").strip()
    if not output:
        raise RuntimeError("PredictYield returned empty output")

    lines = [line.strip() for line in output.splitlines() if line.strip()]
    candidate = lines[-1] if lines else output
    try:
        return float(candidate)
    except ValueError:
        match = _FLOAT_RE.search(candidate)
        if not match:
            raise RuntimeError(f"Could not parse model output: {candidate}") from None
        return float(match.group(0))


@app.post("/yield/predict-batch")
def yield_predict_batch(request: YieldBatchRequest):
    if request.area <= 0:
        raise HTTPException(status_code=400, detail="area must be > 0")

    crops = [c.strip() for c in request.crops if c and c.strip()]
    if not crops:
        raise HTTPException(status_code=400, detail="crops list is empty")

    predictions = []
    for crop in crops:
        try:
            pred = _run_yield_prediction(
                state=request.state,
                district=request.district,
                crop=crop,
                year=request.year,
                season=request.season,
                area=request.area,
                area_units=request.area_units,
            )
            predictions.append({"crop": crop, "predicted_yield": pred})
        except Exception as exc:
            predictions.append(
                {"crop": crop, "predicted_yield": None, "error": str(exc)}
            )

    return {
        "status": "success",
        "input": {
            "state": request.state,
            "district": request.district,
            "season": request.season,
            "year": request.year,
            "area": request.area,
            "area_units": request.area_units,
        },
        "predictions": predictions,
    }


if not scrapbot_loaded:
    from scrapbot.src.scheme_matcher import get_recommended_schemes

    @app.post("/schemes/api/v1/schemes/recommend")
    async def schemes_recommend_fallback(request: SchemeRequest):
        profile = {"state": request.state, "category": request.category}
        matches = get_recommended_schemes(profile)
        return {"status": "success", "farmer_profile": profile, "count": len(matches), "schemes": matches}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
