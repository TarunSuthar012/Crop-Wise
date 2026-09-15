import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_connection():
    print(f"Testing connection to {BASE_URL}...")
    
    try:
        # Test Health
        print("\n1. Testing /health endpoint...")
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ API is reachable!")
        else:
            print("❌ API returned error status")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the API. Is the server running?")
        print("Try running: uvicorn api.main:app --reload --port 8000")
        return

    # Test Response Endpoint
    print("\n2. Testing /response endpoint...")
    payload = {
        "crop": "Onion",
        "quantity": 1000,
        "farmer_location": "Ahmedabad"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/response", json=payload)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("✅ /response endpoint working")
            data = response.json()
            print(f"Recommendation: {data['best_option']['recommendation']}")
        else:
            print(f"❌ /response error: {response.text}")
    except Exception as e:
        print(f"Error testing /response: {e}")

if __name__ == "__main__":
    test_connection()
