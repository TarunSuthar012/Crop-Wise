import sys
from pathlib import Path
import json
from fastapi.testclient import TestClient

# Add AIML directory to sys.path to allow importing modules
current_dir = Path(__file__).resolve().parent
sys.path.append(str(current_dir)) 

# Import the SUB-APP directly to ensure startup events run
try:
    from mandi_intelligence.api.main import app as mandi_app
except ImportError:
    try:
        from AIML.mandi_intelligence.api.main import app as mandi_app
    except ImportError as e:
        print(f"Failed to import mandi_app: {e}")
        sys.exit(1)

def test_mandi_response_endpoint():
    print("Testing /response Endpoint (Directly on Sub-App)...")
    
    # Use context manager to trigger startup events
    with TestClient(mandi_app) as client:
        
        # Request Data: Rajkot Farmer selling Onion
        payload = {
            "crop": "Onion",
            "quantity": 1000,
            "latitude": 22.3039,
            "longitude": 70.8022
        }
        
        # Send Request (Note: URL is /response, not /mandi/response)
        response = client.post("/response", json=payload)
        
        # Check Status Code
        if response.status_code != 200:
            print(f"❌ Failed: Status Code {response.status_code}")
            print(f"Response: {response.text}")
            return
            
        print(f"✅ Status Code: {response.status_code}")
        
        data = response.json()
        
        # Verify Structure
        best_option = data.get('best_option')
        print(f"Recommends: {best_option['mandi_name']}")
        print(f"Distance: {best_option['distance_km']:.2f} km")
        
        # Verify Dynamic Distance Logic
        # Rajkot coords -> Rajkot mandi should be ~0 km
        if best_option['mandi_name'] == 'Rajkot':
            if best_option['distance_km'] < 5:
                print("✅ Distance verification passed (Local mandi selected and distance is correct)")
            else:
                print("❌ Distance verification failed (Local mandi selected but distance is wrong)")
        else:
            print(f"Note: Best option is {best_option['mandi_name']}. Checking alternatives for Rajkot...")
            found = False
            for alt in data.get('alternatives', []):
                if alt['mandi_name'] == 'Rajkot':
                    found = True
                    print(f"Found Rajkot in alternatives. Distance: {alt['distance_km']:.2f} km")
                    if alt['distance_km'] < 5:
                        print("✅ Distance verification passed in alternatives")
                    else:
                        print("❌ Distance verification failed in alternatives")
            
            if not found:
                print("⚠️ Rajkot not found in top recommendations.")

if __name__ == "__main__":
    test_mandi_response_endpoint()
