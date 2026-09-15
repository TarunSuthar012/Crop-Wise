"""
Test the trained models with real data and generate recommendations
"""

import sys
import os
import json

# Add parent directory to path
sys.path.insert(0, os.path.abspath('.'))

from ml_arbitrage.data_loader import MandiDataLoader
from ml_arbitrage.price_predictor import PricePredictor
from ml_arbitrage.arbitrage_engine import ArbitrageEngine
import pandas as pd

def main():
    print("=" * 80)
    print("  TESTING ML ARBITRAGE ENGINE WITH REAL DATA")
    print("=" * 80)
    print()
    
    # Load processed data
    print("📊 Loading processed data...")
    try:
        df = pd.read_csv("ml_arbitrage/processed_mandi_data.csv", parse_dates=['Date'])
        print(f"✅ Loaded {len(df)} records")
        print(f"   Date range: {df['Date'].min()} to {df['Date'].max()}")
        print(f"   Mandis: {df['Mandi_Name'].unique().tolist()}")
        print(f"   Crops: {df['Crop'].unique().tolist()}")
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        return
    
    # Initialize predictor and load models
    print("\n🤖 Loading trained models...")
    predictor = PricePredictor()
    
    # Prepare features
    df_featured = predictor.prepare_features(df)
    
    # Get latest data for current prices
    latest_date = df_featured['Date'].max()
    df_current = df_featured[df_featured['Date'] == latest_date].copy()
    
    print(f"✅ Models loaded from ml_arbitrage/models/")
    print(f"   Using latest date: {latest_date}")
    
    # Generate forecasts
    print("\n🔮 Generating 7-day price forecasts...")
    forecasts_data = []
    
    for crop in df_current['Crop'].unique():
        forecasts = predictor.get_price_forecast_all_mandis(df_featured, crop, days_ahead=7)
        for mandi, forecast in forecasts.items():
            for _, row in forecast.iterrows():
                forecasts_data.append({
                    'Mandi_Name': mandi,
                    'Crop': crop,
                    'Day_Ahead': row['Day_Ahead'],
                    'Predicted_Price': row['Predicted_Price']
                })
    
    df_forecast = pd.DataFrame(forecasts_data)
    print(f"✅ Generated {len(df_forecast)} predictions")
    
    # Initialize engine
    engine = ArbitrageEngine(price_predictor=predictor)
    
    # Test scenarios
    print("\n" + "=" * 80)
    print("  SCENARIO: Onion Farmer - 1000 kg")
    print("=" * 80)
    print()
    
    recommendation = engine.get_best_selling_strategy(
        current_qty_kg=1000,
        crop='Onion',
        current_location='Gandhinagar',
        df_current=df_current,
        df_forecast=df_forecast,
        crop_perishability_factor=0.03
    )
    
    print(json.dumps(recommendation, indent=2, ensure_ascii=False))
    
    print("\n" + "=" * 80)
    print("  SUCCESS: Models working with real data!")
    print("=" * 80)
    print()
    print("📁 Trained models location: ml_arbitrage/models/")
    print("📊 Processed data: ml_arbitrage/processed_mandi_data.csv")
    print()
    print("To run full demo with all scenarios:")
    print("  python ml_arbitrage/main.py")

if __name__ == "__main__":
    main()
