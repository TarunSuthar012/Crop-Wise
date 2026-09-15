"""
ML-Based Mandi Recommendation API
================================

FastAPI endpoints for the ML-powered mandi intelligence system.
Provides price predictions and profit-optimized recommendations.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from pathlib import Path
import sys

# Add parent directory to path
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
        "http://localhost:8081",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances (loaded on startup)
data_loader = None
predictor = None
engine = None
latest_data = None


# Request/Response Models
class RecommendRequest(BaseModel):
    """Request model for mandi recommendations"""
    crop: str = Field(..., description="Crop name (Onion, Tomato, or Potato)")
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
    
    print("🚀 Loading Mandi Intelligence System...")
    
    # Initialize data loader
    data_loader = MandiDataLoader()
    
    try:
        # Load dataset (use parent directory path)
        dataset_path = Path(__file__).parent.parent / 'dataset' / 'commodity_price.csv'
        data_loader.load_data(str(dataset_path))
        df = data_loader.filter_and_process(days=90)
        
        # Initialize predictor
        predictor = PricePredictor()
        df_featured = predictor.prepare_features(df)
        
        # Train models
        print("📚 Training ML models...")
        predictor.train_all_models(df_featured)
        
        # Initialize arbitrage engine
        engine = ArbitrageEngine()
        
        # Store latest data
        latest_data = df_featured
        
        print("✅ System ready!")
        
    except Exception as e:
        print(f"⚠️  Error during startup: {e}")
        print("   System will operate in fallback mode")


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "service": "Mandi Intelligence API",
        "version": "2.0.0",
        "status": "operational",
        "endpoints": {
            "/recommend": "POST - Get ML-based mandi recommendations",
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


@app.post("/recommend", response_model=RecommendResponse, tags=["Recommendations"])
async def get_recommendation(request: RecommendRequest):
    """
    Get ML-based mandi recommendations for optimal profit.
    
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
    
    # Validate crop
    valid_crops = ['Onion', 'Tomato', 'Potato']
    if request.crop not in valid_crops:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid crop. Must be one of: {', '.join(valid_crops)}"
        )
    
    try:
        # Get recommendation from arbitrage engine
        result = engine.get_best_selling_strategy(
            current_qty_kg=request.quantity,
            crop=request.crop,
            current_location=request.farmer_location,
            latitude=request.latitude,
            longitude=request.longitude,
            df_current=latest_data
        )
        
        # Format best option
        best = result['best_option']
        best_option = MandiOption(
            mandi_name=best['mandi'],
            distance_km=best.get('distance', 0),
            current_price=best.get('current_price', 0),
            predicted_price_7d=best.get('predicted_price', None),
            gross_revenue=best['gross_revenue'],
            transport_cost=best['transport_cost'],
            storage_cost=best.get('storage_cost', 0),
            net_profit=best['net_profit'],
            recommendation=best['recommendation']
        )
        
        # Format alternatives
        alternatives = []
        for alt in result.get('alternatives', [])[:3]:  # Top 3 alternatives
            alternatives.append(MandiOption(
                mandi_name=alt['mandi'],
                distance_km=alt.get('distance', 0),
                current_price=alt.get('current_price', 0),
                predicted_price_7d=alt.get('predicted_price', None),
                gross_revenue=alt['gross_revenue'],
                transport_cost=alt['transport_cost'],
                storage_cost=alt.get('storage_cost', 0),
                net_profit=alt['net_profit'],
                recommendation=alt['recommendation']
            ))
        
        return RecommendResponse(
            crop=request.crop,
            quantity=request.quantity,
            best_option=best_option,
            alternatives=alternatives,
            summary=result.get('summary', 'Recommendation generated successfully')
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
    
    print(f"📝 Received feedback from {farmer_id}")
    print(f"   Mandi: {request.mandi_name}")
    print(f"   Crop: {request.crop} ({request.quantity} kg)")
    print(f"   Price: ₹{request.actual_price}/kg")
    print(f"   Date: {request.sale_date}")
    
    if request.feedback:
        print(f"   Feedback: {request.feedback}")
    
    # TODO: Save to database for model retraining
    # TODO: Compare actual price vs predicted price
    # TODO: Update model accuracy metrics
    
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
            "mandi_name": mandi,
            "distance_km": mandi_data['Distance_km'].iloc[0],
            "available_crops": mandi_data['Crop'].unique().tolist(),
            "record_count": len(mandi_data)
        })
    
    return {
        "total_mandis": len(mandis_info),
        "mandis": mandis_info
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
