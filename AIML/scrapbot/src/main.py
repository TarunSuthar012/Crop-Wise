import base64
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, Any

# Import our modules
from .claim_generator import generate_insurance_claim
from .scheme_matcher import get_recommended_schemes
from .scheme_scraper import scrape_schemes

app = FastAPI(title="Krishi-Sahayak API")

# Path setup
BASE_DIR = Path(__file__).resolve().parent.parent  # .../scrapbot
STATIC_DIR = BASE_DIR / "static"
DB_PATH = BASE_DIR / "src" / "schemes_db.json"

# When mounted at /schemes on the unified app, PDFs are served at /schemes/static/...
def _pdf_public_path(relative_static_path: str) -> str:
    return f"/schemes/{relative_static_path}" if not relative_static_path.startswith("/") else relative_static_path

# Mount 'static' folder so PDFs are accessible via URL
if not STATIC_DIR.exists():
    STATIC_DIR.mkdir(parents=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# --- Models ---
class ClaimRequest(BaseModel):
    farmer: Dict[str, Any]
    crop: Dict[str, Any]
    incident: Dict[str, Any]

class SchemeRequest(BaseModel):
    state: str
    land_size_hectares: float
    category: str # 'small_farmer', 'large_farmer'

# --- Endpoints ---

@app.on_event("startup")
async def startup_event():
    # Run scraper on startup to ensure DB exists
    if not DB_PATH.exists():
        scrape_schemes()

@app.post("/api/v1/claims/generate")
async def create_claim(
    request: ClaimRequest,
    format: str = Query("json", description='Use "pdf" to return raw PDF bytes (best for download).'),
):
    try:
        # Simple Logic: If rain > 100mm, it's a valid claim
        try:
            rain_mm = float(request.incident.get("detected_rainfall_mm", 0) or 0)
        except (TypeError, ValueError):
            rain_mm = 0.0
        loss_percent = "85%" if rain_mm > 100 else "10%"
        risk_level = "CRITICAL" if rain_mm > 100 else "LOW"

        damage_report = {
            "type": request.incident.get('type', 'Unknown'),
            "date": request.incident.get('timestamp', 'Today'),
            "loss_percentage": loss_percent,
            "rainfall_mm": rain_mm
        }

        # Generate PDF — returns (relative path, raw bytes)
        pdf_path, pdf_bytes = generate_insurance_claim(request.farmer, request.crop, damage_report)

        fmt = (format or "json").lower().strip()
        if fmt == "pdf":
            # Raw PDF: avoids JSON/base64 limits and static /schemes/static 404s in dev
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
        public_url = _pdf_public_path(pdf_path)

        return {
            "status": "success",
            "ai_assessment": {
                "risk_level": risk_level,
                "loss_percentage": loss_percent
            },
            "pdf_url": public_url,
            "pdf_base64": pdf_base64,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/schemes/recommend")
async def recommend_schemes(request: SchemeRequest):
    profile = {
        "state": request.state,
        "category": request.category
    }
    
    matches = get_recommended_schemes(profile)
    
    return {
        "status": "success",
        "farmer_profile": profile,
        "count": len(matches),
        "schemes": matches
    }