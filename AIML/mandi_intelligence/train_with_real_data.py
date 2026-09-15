"""
Train ML Arbitrage Engine with Real Kaggle Dataset
===================================================

This script trains the XGBoost models using the real downloaded dataset
from BeejRakshak/dataset/commodity_price.csv
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath('.'))

from ml_arbitrage.data_loader import MandiDataLoader
from ml_arbitrage.price_predictor import PricePredictor
from ml_arbitrage.arbitrage_engine import ArbitrageEngine
import json

def main():
    print("=" * 80)
    print("  TRAINING WITH REAL KAGGLE DATASET")
    print("=" * 80)
    print()
    
    # Initialize loader
    loader = MandiDataLoader()
    
    # Load real dataset
    print("📊 Loading real Kaggle dataset...")
    dataset_path = "dataset/commodity_price.csv"
    
    try:
        df_raw = loader.load_data(dataset_path)
        print(f"✅ Successfully loaded {len(df_raw):,} records from real dataset")
        print()
        
        # Process and filter data
        print("🔧 Processing and filtering data for Gujarat mandis...")
        df_processed = loader.filter_and_process(days=90)
        
        if len(df_processed) == 0:
            print("⚠️  No data found for target mandis after filtering.")
            print("   Falling back to synthetic data generation...")
            df_processed = loader.generate_synthetic_data(days=90)
        
        # Show summary
        stats = loader.get_summary_stats()
        print("\n📈 Data Summary:")
        print(json.dumps(stats, indent=2))
        
        # Save processed data
        output_path = "ml_arbitrage/processed_mandi_data_real.csv"
        loader.save_processed_data(output_path)
        
    except Exception as e:
        print(f"❌ Error loading real data: {e}")
        print("   Falling back to synthetic data generation...")
        df_processed = loader.generate_synthetic_data(days=90)
        stats = loader.get_summary_stats()
    
    print("\n" + "=" * 80)
    print("  TRAINING XGBOOST MODELS")
    print("=" * 80)
    print()
    
    # Initialize predictor
    predictor = PricePredictor()
    
    # Prepare features
    print("🔧 Engineering time-series features...")
    df_featured = predictor.prepare_features(df_processed)
    print(f"   Features created: {len(df_featured.columns)} columns")
    print()
    
    # Train all models
    print("🤖 Training XGBoost models for all Mandi-Crop combinations...")
    print()
    results = predictor.train_all_models(df_featured)
    
    # Summary
    print("\n" + "=" * 80)
    print("  TRAINING COMPLETE")
    print("=" * 80)
    print()
    
    successful = [r for r in results if 'error' not in r]
    print(f"✅ Successfully trained {len(successful)} models")
    print(f"   Models saved in: ml_arbitrage/models/")
    print()
    
    print("📊 Model Performance:")
    print("-" * 80)
    for result in successful:
        print(f"  {result['mandi']:12s} - {result['crop']:8s} | "
              f"MAE: ₹{result['mae']:5.2f}/kg | "
              f"RMSE: ₹{result['rmse']:5.2f}/kg | "
              f"MAPE: {result['mape']:5.1f}%")
    
    print()
    print("=" * 80)
    print("  Ready to generate recommendations!")
    print("  Run: python ml_arbitrage/main.py")
    print("=" * 80)

if __name__ == "__main__":
    main()
