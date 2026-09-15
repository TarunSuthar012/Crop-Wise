"""
Mandi Intelligence API
=====================

Main FastAPI application for the Mandi Intelligence module.
Provides endpoints for price predictions (`/response`) and feedback (`/respond`).
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from pathlib import Path
import sys
import base64
import os
import re
import subprocess
import pandas as pd

# Add parent directory to path to import core logic
sys.path.append(str(Path(__file__).parent.parent))

from ml_arbitrage.data_loader import MandiDataLoader
from ml_arbitrage.price_predictor import PricePredictor
from ml_arbitrage.arbitrage_engine import ArbitrageEngine

# Initialize FastAPI
app = FastAPI(
    title="Mandi Intelligence API",
    description="ML-powered mandi price predictions and recommendations for farmers",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://beej-rakshak.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:8081",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount scrapbot static so PMFBY claim PDFs are served at /static/Claim_*.pdf
_scrapbot_static = Path(__file__).resolve().parent.parent.parent / "scrapbot" / "static"
if _scrapbot_static.exists():
    app.mount("/static", StaticFiles(directory=str(_scrapbot_static)), name="static")
else:
    _scrapbot_static.mkdir(parents=True, exist_ok=True)
    app.mount("/static", StaticFiles(directory=str(_scrapbot_static)), name="static")

# Global instances (loaded on startup)
data_loader = None
predictor = None
engine = None
latest_data = None


# Request/Response Models
class RecommendRequest(BaseModel):
    """Request model for mandi recommendations"""
    crop: str = Field(..., min_length=1, description="Crop name")
    quantity: float = Field(..., gt=0, description="Quantity to sell in kg")
    farmer_location: Optional[str] = Field(None, description="Farmer's current location")
    latitude: Optional[float] = Field(None, description="Farmer's latitude")
    longitude: Optional[float] = Field(None, description="Farmer's longitude")


class MandiOption(BaseModel):
    """Individual mandi option with profit details"""
    mandi_name: str
    distance_km: float
    current_price: float
    predicted_price_7d: Optional[float]
    gross_revenue: float
    transport_cost: float
    storage_cost: float
    net_profit: float
    recommendation: str  # "Sell Now" or "Wait X days"


class RecommendResponse(BaseModel):
    """Response model for recommendations"""
    crop: str
    quantity: float
    best_option: MandiOption
    alternatives: List[MandiOption]
    summary: str


class RespondRequest(BaseModel):
    """Request model for submitting farmer feedback/data"""
    farmer_id: Optional[str] = Field(None, description="Unique farmer identifier")
    mandi_name: str = Field(..., description="Mandi where the crop was sold")
    crop: str = Field(..., description="Crop name")
    quantity: float = Field(..., gt=0, description="Quantity sold in kg")
    actual_price: float = Field(..., gt=0, description="Actual price received per kg")
    sale_date: str = Field(..., description="Date of sale (YYYY-MM-DD)")
    feedback: Optional[str] = Field(None, description="Optional feedback from farmer")


class RespondResponse(BaseModel):
    """Response for feedback submission"""
    status: str
    message: str
    farmer_id: str


@app.on_event("startup")
async def startup_event():
    """Load models and data on startup"""
    global data_loader, predictor, engine, latest_data
    
    # Windows terminals may not support emoji in stdout encoding; keep logs ASCII.
    print("Loading Mandi Intelligence System...")
    
    # Initialize data loader
    data_loader = MandiDataLoader()
    
    try:
        # Load dataset (use parent directory path)
        dataset_path = Path(__file__).parent.parent / 'dataset' / 'commodity_price.csv'
        print(f"DEBUG: Dataset Path: {dataset_path}")
        print(f"DEBUG: Exists? {dataset_path.exists()}")
        
        data_loader.load_data(str(dataset_path))
        df = data_loader.filter_and_process(days=90)
        
        # Initialize predictor
        predictor = PricePredictor()
        df_featured = predictor.prepare_features(df)
        
        # Train models
        print("Training ML models...")
        predictor.train_all_models(df_featured)
        
        # Initialize arbitrage engine
        engine = ArbitrageEngine()
        
        # Store latest data
        latest_data = df_featured
        
        print("System ready!")
        
    except Exception as e:
        print(f"Error during startup: {e}")
        import traceback
        traceback.print_exc()
        print("   System will operate in fallback mode")


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "service": "Mandi Intelligence API",
        "version": "2.0.0",
        "status": "operational",
        "endpoints": {
            "/response": "POST - Get ML-based mandi recommendations",
            "/respond": "POST - Submit farmer feedback and actual sale data",
            "/health": "GET - Health check",
            "/mandis": "GET - List all available mandis",
            "/docs": "GET - Interactive API documentation"
        }
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": predictor is not None,
        "data_loaded": latest_data is not None,
        "records_count": len(latest_data) if latest_data is not None else 0
    }


@app.post("/response", response_model=RecommendResponse, tags=["Recommendations"])
async def get_response(request: RecommendRequest):
    """
    Get ML-based mandi recommendations (previously /recommend).
    
    This endpoint:
    1. Analyzes current prices across all mandis
    2. Predicts prices for the next 7 days
    3. Calculates net profit after all costs
    4. Recommends the best mandi and timing
    
    Returns the best option plus alternative choices.
    """
    if latest_data is None or engine is None:
        raise HTTPException(
            status_code=503,
            detail="System not ready. Models are still loading."
        )
    
    # Validate crop against actual dataset (not hardcoded list)
    available_crops = latest_data['Crop'].dropna().unique().tolist()
    crop_aliases = {
        "soybean": "Soyabean",
        "soya bean": "Soyabean",
        "ground nut": "Groundnut",
    }
    requested_crop = crop_aliases.get(request.crop.strip().lower(), request.crop.strip().title())
    crop_match = next(
        (crop for crop in available_crops if str(crop).strip().lower() == requested_crop.lower()),
        None,
    )
    if crop_match is None:
        raise HTTPException(
            status_code=400,
            detail=f"Crop '{request.crop}' not found in database. Available crops: {', '.join(map(str, available_crops))}",
        )
    request.crop = crop_match
    
    try:
        # 1. Get latest prices (df_current)
        latest_date = latest_data['Date'].max()
        df_current = latest_data[latest_data['Date'] == latest_date].copy()
        
        # 2. Generate forecasts (df_forecast)
        df_forecast = None
        try:
            forecasts = predictor.get_price_forecast_all_mandis(latest_data, request.crop, days_ahead=7)
            # Flatten forecast dict to DataFrame
            forecast_list = []
            for mandi, fcast_df in forecasts.items():
                for _, row in fcast_df.iterrows():
                    forecast_list.append({
                        'Mandi_Name': mandi,
                        'Crop': request.crop,
                        'Day_Ahead': row['Day_Ahead'],
                        'Predicted_Price': row['Predicted_Price']
                    })
            if forecast_list:
                df_forecast = pd.DataFrame(forecast_list)
        except Exception as e:
            print(f"Warning: Forecast generation failed: {e}")

        # 3. Get recommendation (passed explicit arguments)
        result = engine.get_best_selling_strategy(
            current_qty_kg=request.quantity,
            crop=request.crop,
            current_location=request.farmer_location,
            latitude=request.latitude,
            longitude=request.longitude,
            df_current=df_current,
            df_forecast=df_forecast
        )
        
        # Format best option
        best = result['optimal_strategy']
        best_option = MandiOption(
            mandi_name=best['mandi'],
            distance_km=best.get('distance_km', 0),
            current_price=best.get('price_per_kg', 0),
            predicted_price_7d=best.get('price_per_kg') if best.get('is_predicted_price') else None,
            gross_revenue=best['cost_breakdown']['gross_revenue'],
            transport_cost=best['cost_breakdown']['transport_cost'],
            storage_cost=best['cost_breakdown']['storage_cost'],
            net_profit=best['net_profit'],
            recommendation=result['recommendation']  # Use the main recommendation string
        )
        
        # Format alternatives
        alternatives = []
        for alt in result.get('alternative_scenarios', [])[:3]:  # Top 3 alternatives
            # Determine recommendation string for alternative
            days = alt.get('days_to_wait', 0)
            rec_str = f"Sell at {alt['mandi_name']}" if days == 0 else f"Wait {days} days, sell at {alt['mandi_name']}"
            
            alternatives.append(MandiOption(
                mandi_name=alt['mandi_name'],
                distance_km=alt.get('distance_km', 0),
                current_price=alt.get('price_per_kg', 0),
                predicted_price_7d=None,
                gross_revenue=alt.get('gross_revenue', 0),
                transport_cost=alt.get('transport_cost', 0),
                storage_cost=alt.get('storage_cost', 0),
                net_profit=alt['net_profit'],
                recommendation=rec_str
            ))
        
        return RecommendResponse(
            crop=request.crop,
            quantity=request.quantity,
            best_option=best_option,
            alternatives=alternatives,
            summary=result.get('justification', 'Recommendation generated successfully')
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating recommendation: {str(e)}"
        )


@app.post("/respond", response_model=RespondResponse, tags=["Feedback"])
async def submit_response(request: RespondRequest):
    """
    Submit farmer feedback and actual sale data.
    
    This endpoint allows farmers to report:
    - Actual prices received at mandis
    - Quantities sold
    - Feedback on the experience
    
    This data can be used to:
    - Improve ML model accuracy
    - Validate predictions
    - Track farmer success stories
    """
    # Generate or use provided farmer ID
    farmer_id = request.farmer_id or f"FARMER_{hash(request.mandi_name + request.sale_date) % 10000:04d}"
    
    # Here you would typically save to database
    # For now, we'll just acknowledge receipt
    
    print(f"Received feedback from {farmer_id}")
    print(f"   Mandi: {request.mandi_name}")
    print(f"   Crop: {request.crop} ({request.quantity} kg)")
    print(f"   Price: ₹{request.actual_price}/kg")
    print(f"   Date: {request.sale_date}")
    
    if request.feedback:
        print(f"   Feedback: {request.feedback}")
    
    # TODO: Save to database for model retraining
    
    return RespondResponse(
        status="success",
        message=f"Thank you! Your sale data has been recorded and will help improve recommendations for other farmers.",
        farmer_id=farmer_id
    )


@app.get("/mandis", tags=["Data"])
async def list_mandis():
    """List all available mandis with current crop availability"""
    if latest_data is None:
        raise HTTPException(status_code=503, detail="Data not loaded")
    
    # Group by mandi and show available crops
    mandis_info = []
    for mandi in latest_data['Mandi_Name'].unique():
        mandi_data = latest_data[latest_data['Mandi_Name'] == mandi]
        mandis_info.append({
            "mandi_name": str(mandi),
            "distance_km": float(mandi_data['Distance_km'].iloc[0]),
            "available_crops": mandi_data['Crop'].unique().tolist(),
            "record_count": int(len(mandi_data))
        })
    
    return {
        "total_mandis": len(mandis_info),
        "mandis": mandis_info
    }


# ─── Government Schemes (runs on same server as Mandi, no extra port) ───
class SchemeRequest(BaseModel):
    """Request for scheme recommendation (Govt Schemes tab)."""
    state: str = "Gujarat"
    land_size_hectares: float = 2.0
    category: str = "small_farmer"


@app.post("/schemes/api/v1/schemes/recommend", tags=["Government Schemes"])
async def schemes_recommend(request: SchemeRequest):
    """Recommend government schemes by state and farmer category. Served alongside Mandi on port 8000."""
    try:
        scrapbot_src = Path(__file__).resolve().parent.parent.parent / "scrapbot" / "src"
        if str(scrapbot_src) not in sys.path:
            sys.path.insert(0, str(scrapbot_src))
        from scheme_matcher import get_recommended_schemes
    except ImportError:
        raise HTTPException(status_code=503, detail="Scheme matcher not available")
    profile = {"state": request.state, "category": request.category}
    matches = get_recommended_schemes(profile)
    return {"status": "success", "farmer_profile": profile, "count": len(matches), "schemes": matches}


class ClaimRequest(BaseModel):
    """Request for PMFBY insurance claim PDF generation."""
    farmer: Dict[str, Any]
    crop: Dict[str, Any]
    incident: Dict[str, Any]


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


@app.post("/yield/predict-batch", tags=["Yield"])
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


@app.post("/schemes/api/v1/claims/generate", tags=["Government Schemes"])
async def claims_generate(
    request: ClaimRequest,
    format: str = Query("json", description='Use "pdf" for raw PDF bytes.'),
):
    """Generate PMFBY insurance claim PDF with AI damage assessment. Requires fpdf: pip install fpdf."""
    try:
        scrapbot_src = Path(__file__).resolve().parent.parent.parent / "scrapbot" / "src"
        if str(scrapbot_src) not in sys.path:
            sys.path.insert(0, str(scrapbot_src))
        from claim_generator import generate_insurance_claim
    except ImportError as e:
        raise HTTPException(
            status_code=503,
            detail="Claim PDF generation unavailable. Install: pip install fpdf",
        ) from e
    try:
        try:
            rain_mm = float(request.incident.get("detected_rainfall_mm", 0) or 0)
        except (TypeError, ValueError):
            rain_mm = 0.0
        loss_percent = "85%" if rain_mm > 100 else "10%"
        risk_level = "CRITICAL" if rain_mm > 100 else "LOW"
        damage_report = {
            "type": request.incident.get("type", "Unknown"),
            "date": request.incident.get("timestamp", "Today"),
            "loss_percentage": loss_percent,
            "rainfall_mm": rain_mm,
        }
        pdf_path, pdf_bytes = generate_insurance_claim(request.farmer, request.crop, damage_report)
        fmt = (format or "json").lower().strip()
        if fmt == "pdf":
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": 'attachment; filename="PMFBY_Claim.pdf"',
                    "X-Claim-Risk": risk_level,
                    "X-Claim-Loss": loss_percent,
                },
            )
        pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")
        return {
            "status": "success",
            "ai_assessment": {
                "risk_level": risk_level,
                "loss_percentage": loss_percent,
            },
            "pdf_url": f"/schemes/{pdf_path}",
            "pdf_base64": pdf_base64,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
