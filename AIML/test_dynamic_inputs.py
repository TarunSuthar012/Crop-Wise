import sys
from pathlib import Path
import pandas as pd
import json
import inspect

# Add parent directory to path to import modules
current_dir = Path(__file__).resolve().parent
sys.path.append(str(current_dir))
sys.path.append(str(current_dir.parent))

# Redirect stdout to file
log_file = open('test_debug.log', 'w', encoding='utf-8')
sys.stdout = log_file
sys.stderr = log_file

print(f"sys.path: {sys.path}")

try:
    from mandi_intelligence.ml_arbitrage.distance_calculator import get_distance, LOCATION_COORDINATES
    from mandi_intelligence.ml_arbitrage.arbitrage_engine import ArbitrageEngine

    print(f"ArbitrageEngine loaded from: {ArbitrageEngine.__module__}")
    print(f"ArbitrageEngine file: {inspect.getfile(ArbitrageEngine)}")

    def test_arbitrage_engine():
        print("\nTesting Arbitrage Engine with Lat/Lon...")
        
        engine = ArbitrageEngine()
        
        data = [
            {'Mandi_Name': 'Ahmedabad', 'Crop': 'Onion', 'Price_per_kg': 20, 'Traffic_Congestion_Score': 0},
            {'Mandi_Name': 'Rajkot', 'Crop': 'Onion', 'Price_per_kg': 25, 'Traffic_Congestion_Score': 0},
            {'Mandi_Name': 'Surat', 'Crop': 'Onion', 'Price_per_kg': 20, 'Traffic_Congestion_Score': 0}
        ]
        df_current = pd.DataFrame(data)
        
        raj_lat, raj_lon = LOCATION_COORDINATES['Rajkot']
        print(f"Using Coords: {raj_lat}, {raj_lon}")
        
        result_raj = engine.get_best_selling_strategy(
            current_qty_kg=1000,
            crop='Onion',
            latitude=raj_lat,
            longitude=raj_lon,
            df_current=df_current
        )
        
        best_mandi_raj = result_raj['optimal_strategy']['mandi']
        print(f"Best Mandi from Rajkot: {best_mandi_raj}")
        actual_dist = result_raj['optimal_strategy']['distance_km']
        print(f"Distance: {actual_dist:.2f} km")
        
        if actual_dist >= 5:
            print(f"❌ FAILURE: Distance for Rajkot farmer to Rajkot mandi is {actual_dist}, expected < 5")
        else:
            print("Distance check passed.")
        
        assert actual_dist < 5, f"Distance {actual_dist} too high"
        print("Arbitrage Engine Tests Passed! ✅")

    if __name__ == "__main__":
        test_arbitrage_engine()

except Exception as e:
    print(f"EXCEPTION: {e}")
    import traceback
    traceback.print_exc()
finally:
    log_file.close()
