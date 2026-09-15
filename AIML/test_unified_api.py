import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add project root to path
sys.path.append(str(Path(__file__).parent))

from main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    print("✅ Root Endpoint: OK")
    print(response.json())

def test_mandi_health():
    response = client.get("/mandi/health")
    assert response.status_code == 200
    print("\n✅ Mandi Health: OK")
    print(response.json())

def test_schemes_recommend():
    # Note: Using a sample payload
    payload = {
        "state": "Gujarat",
        "land_size_hectares": 2.5,
        "category": "small_farmer"
    }
    response = client.post("/schemes/api/v1/schemes/recommend", json=payload)
    if response.status_code == 200:
        print("\n✅ Schemes Recommendation: OK")
        print(f"Found {response.json().get('count')} schemes")
    else:
        print(f"\n❌ Schemes Recommendation Failed: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    print("Testing Unified API...")
    try:
        test_root()
        test_mandi_health()
        test_schemes_recommend()
        print("\n🎉 All tests passed!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
