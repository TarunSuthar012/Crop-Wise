# Mandi Intelligence API - Quick Start Guide

## 🚀 New ML-Based API (ml_api.py)

### Starting the Server

```bash
cd c:\Users\Yatrik\Desktop\BeejRakshak\mandi_intelligence
uvicorn api.ml_api:app --reload --port 8001
```

### Available Endpoints

#### 1. `/response` - Get ML-Based Recommendations (POST)

Get optimized mandi recommendations based on ML price predictions.

**Request:**
```json
POST http://localhost:8000/response
Content-Type: application/json

{
  "crop": "Onion",
  "quantity": 1000,
  "farmer_location": "Gandhinagar"
}
```

**Response:**
```json
{
  "crop": "Onion",
  "quantity": 1000,
  "best_option": {
    "mandi_name": "Rajkot",
    "distance_km": 237,
    "current_price": 45.5,
    "predicted_price_7d": 47.2,
    "gross_revenue": 47200,
    "transport_cost": 1185,
    "storage_cost": 350,
    "net_profit": 45665,
    "recommendation": "Wait 3 days, then sell"
  },
  "alternatives": [...]
}
```

#### 2. `/respond` - Submit Farmer Feedback (POST)

Submit actual sale data to improve the model.

**Request:**
```json
POST http://localhost:8001/respond
Content-Type: application/json

{
  "farmer_id": "FARMER_001",
  "mandi_name": "Rajkot",
  "crop": "Onion",
  "quantity": 1000,
  "actual_price": 46.8,
  "sale_date": "2025-05-25",
  "feedback": "Got good price, recommendation was accurate!"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Thank you! Your sale data has been recorded...",
  "farmer_id": "FARMER_001"
}
```

#### 3. `/health` - Health Check (GET)

```bash
GET http://localhost:8001/health
```

#### 4. `/mandis` - List All Mandis (GET)

```bash
GET http://localhost:8001/mandis
```

## 📚 Interactive Documentation

Visit: `http://localhost:8001/docs` for Swagger UI

## 🔧 What's New

### Training Improvements:
- ✅ Automatically skips mandi-crop combinations with <30 records
- ✅ Clean output without warning messages
- ✅ Only trains viable models

### API Features:
- ✅ ML-based price predictions (7-day forecast)
- ✅ Net profit optimization
- ✅ Farmer feedback collection
- ✅ Model improvement pipeline

## 🧪 Testing

### Using cURL:

```bash
# Get Recommendation
curl -X POST "http://localhost:8001/recommend" \
  -H "Content-Type: application/json" \
  -d "{\"crop\":\"Onion\",\"quantity\":1000}"

# Submit Feedback
curl -X POST "http://localhost:8001/respond" \
  -H "Content-Type: application/json" \
  -d "{\"mandi_name\":\"Rajkot\",\"crop\":\"Onion\",\"quantity\":1000,\"actual_price\":46.5,\"sale_date\":\"2025-05-25\"}"
```

### Using Python:

```python
import requests

# Get recommendation
response = requests.post(
    "http://localhost:8001/recommend",
    json={"crop": "Onion", "quantity": 1000}
)
print(response.json())

# Submit feedback
response = requests.post(
    "http://localhost:8001/respond",
    json={
        "mandi_name": "Rajkot",
        "crop": "Onion",
        "quantity": 1000,
        "actual_price": 46.5,
        "sale_date": "2025-05-25"
    }
)
print(response.json())
```
