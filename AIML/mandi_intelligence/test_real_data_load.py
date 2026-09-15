"""
Simple test to verify real dataset loading works
"""
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.abspath('.'))

from ml_arbitrage.data_loader import MandiDataLoader

def main():
    print("=" * 80)
    print("  TESTING REAL DATASET LOADING")
    print("=" * 80)
    print()
    
    loader = MandiDataLoader()
    
    # Try to load dataset
    dataset_path = "dataset/commodity_price.csv"
    
    try:
        print(f"Loading: {dataset_path}")
        df_raw = loader.load_data(dataset_path)
        print(f"SUCCESS: Loaded {len(df_raw):,} records")
        print()
        
        # Process the data
        print("Processing data for Gujarat mandis...")
        df_processed = loader.filter_and_process(days=90)
        
        print(f"Processed: {len(df_processed):,} records")
        print(f"Mandis: {df_processed['Mandi_Name'].unique().tolist()}")
        print(f"Crops: {df_processed['Crop'].unique().tolist()}")
        print(f"Date range: {df_processed['Date'].min()} to {df_processed['Date'].max()}")
        print()
        
        # Save
        output = "ml_arbitrage/processed_mandi_data.csv"
        loader.save_processed_data(output)
        
        print("=" * 80)
        print("SUCCESS - Real data loaded and processed!")
        print("=" * 80)
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
