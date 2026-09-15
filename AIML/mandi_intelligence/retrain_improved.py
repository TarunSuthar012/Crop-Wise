"""
Retrain models with improved accuracy settings
"""
import sys
sys.path.insert(0, '.')

from ml_arbitrage.data_loader import MandiDataLoader
from ml_arbitrage.price_predictor import PricePredictor

print("=" * 80)
print("  RETRAINING MODELS WITH IMPROVED ACCURACY")
print("=" * 80)
print()

# Load ALL available data (not just 90 days)
print("Step 1: Loading ALL available historical data...")
loader = MandiDataLoader()
loader.load_data("dataset/commodity_price.csv")
df = loader.filter_and_process(days=None)  # None = use ALL data

print()
print("Step 2: Preparing features...")
predictor = PricePredictor()
df_featured = predictor.prepare_features(df)

print()
print("Step 3: Training improved models...")
print("  (Using 200 estimators, optimized hyperparameters)")
print()

results = predictor.train_all_models(df_featured)

print()
print("=" * 80)
print("  TRAINING RESULTS")
print("=" * 80)
print()

trained_count = 0
for result in results:
    if isinstance(result, dict) and 'error' not in result:
        trained_count += 1
        print(f"{result['mandi']} - {result['crop']}:")
        print(f"  MAE:  Rs.{result['mae']:.2f}/kg")
        print(f"  RMSE: Rs.{result['rmse']:.2f}/kg")
        print(f"  MAPE: {result['mape']:.2f}%")
        print(f"  R2:   {result.get('r2', 0):.3f}")
        print()
    else:
        print(f"ERROR: Model training failed - {result}")

print("=" * 80)
print(f"Successfully trained {trained_count}/{len(results)} models")
print("Models saved to: ml_arbitrage/models/")
print("=" * 80)
