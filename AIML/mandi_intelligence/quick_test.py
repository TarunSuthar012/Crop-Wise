"""
Quick test of the complete pipeline with real data
"""
import pandas as pd
import sys
sys.path.insert(0, '.')

from ml_arbitrage.data_loader import MandiDataLoader
from ml_arbitrage.price_predictor import PricePredictor
from ml_arbitrage.arbitrage_engine import ArbitrageEngine

print("=" * 80)
print("  QUICK PIPELINE TEST WITH REAL DATA")
print("=" * 80)
print()

# Load real data
loader = MandiDataLoader()
loader.load_data("dataset/commodity_price.csv")
df = loader.filter_and_process(days=90)

print(f"Loaded {len(df)} records")
print(f"Crops: {df['Crop'].unique().tolist()}")
print(f"Mandis: {df['Mandi_Name'].unique().tolist()}")
print()

# Train models
print("Training models...")
predictor = PricePredictor()
df_featured = predictor.prepare_features(df)
results = predictor.train_all_models(df_featured)

print(f"Trained {len([r for r in results if 'error' not in r])} models")
print()

# Test recommendation
print("Generating test recommendation for Onion...")
engine = ArbitrageEngine(price_predictor=predictor)

latest_date = df_featured['Date'].max()
df_current = df_featured[df_featured['Date'] == latest_date]

# Generate forecasts
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

recommendation = engine.get_best_selling_strategy(
    current_qty_kg=1000,
    crop='Onion',
    current_location='Gandhinagar',
    df_current=df_current,
    df_forecast=df_forecast
)

print("Recommendation keys:", recommendation.keys())
if 'optimal_strategy' in recommendation:
    print("SUCCESS - Recommendation generated!")
    print(f"  Recommendation: {recommendation['recommendation']}")
    print(f"  Net Profit: Rs.{recommendation['optimal_strategy']['net_profit']:,.0f}")
else:
    print("ERROR - No optimal strategy found")
    print(recommendation)

print()
print("=" * 80)
