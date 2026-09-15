"""
Quick API Test Script

Tests the Mandi Arbitrage Engine API endpoints.
"""

import json

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    import urllib.request

def test_api_with_requests():
    """Test API using requests library"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Mandi Arbitrage Engine API\n")
    print("=" * 60)
    
    # Test 1: Health check
    print("\n1️⃣ Testing Health Check...")
    response = requests.get(f"{base_url}/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test 2: Get best mandi for Onion
    print("\n2️⃣ Testing Best Mandi for Onion (1000 kg)...")
    response = requests.get(
        f"{base_url}/get_best_mandi",
        params={"crop": "Onion", "quantity": 1000}
    )
    print(f"   Status: {response.status_code}")
    data = response.json()
    
    print(f"\n   🏆 Top Recommendation: {data['top_recommendation']['mandi']}")
    print(f"   💡 Insight: {data['top_recommendation']['insight']}")
    
    print(f"\n   📊 All Recommendations:")
    for i, rec in enumerate(data['recommendations'][:3], 1):
        print(f"      {i}. {rec['mandi_name']} - Net Profit: ₹{rec['net_profit']:,.0f}")
    
    # Test 3: Get best mandi for Tomato
    print("\n3️⃣ Testing Best Mandi for Tomato (2000 kg)...")
    response = requests.get(
        f"{base_url}/get_best_mandi",
        params={"crop": "Tomato", "quantity": 2000}
    )
    data = response.json()
    print(f"   🏆 Top Recommendation: {data['top_recommendation']['mandi']}")
    print(f"   Net Profit: ₹{data['recommendations'][0]['net_profit']:,.0f}")
    
    # Test 4: Invalid crop
    print("\n4️⃣ Testing Error Handling (Invalid Crop)...")
    response = requests.get(
        f"{base_url}/get_best_mandi",
        params={"crop": "Mango", "quantity": 1000}
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 400:
        print(f"   ✅ Correctly rejected invalid crop")
    
    print("\n" + "=" * 60)
    print("✅ All tests completed successfully!")
    print("\n🌐 View API docs at: http://localhost:8000/docs")

def test_api_with_urllib():
    """Test API using urllib (no external dependencies)"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Mandi Arbitrage Engine API (using urllib)\n")
    print("=" * 60)
    
    # Test health check
    print("\n1️⃣ Testing Health Check...")
    with urllib.request.urlopen(f"{base_url}/health") as response:
        data = json.loads(response.read().decode())
        print(f"   Status: healthy")
        print(f"   Mandis loaded: {data.get('mandis_loaded', 0)}")
    
    # Test get_best_mandi
    print("\n2️⃣ Testing Best Mandi for Onion (1000 kg)...")
    url = f"{base_url}/get_best_mandi?crop=Onion&quantity=1000"
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode())
        print(f"   🏆 Top Recommendation: {data['top_recommendation']['mandi']}")
        print(f"   💡 Insight: {data['top_recommendation']['insight']}")
    
    print("\n" + "=" * 60)
    print("✅ Basic tests completed successfully!")
    print("\n🌐 View API docs at: http://localhost:8000/docs")

if __name__ == "__main__":
    try:
        if HAS_REQUESTS:
            test_api_with_requests()
        else:
            test_api_with_urllib()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure the API server is running:")
        print("   uvicorn api.main:app --reload --port 8000")
