# How Farmers Use the Mandi Recommendation System

## Quick Start (For Farmers)

### Step 1: Run the Recommendation System

```bash
cd c:\Users\Yatrik\Desktop\BeejRakshak\mandi_intelligence
python get_recommendation.py
```

### Step 2: Enter Your Details

The system will ask you:
1. **What crop do you have?** (Onion, Tomato, or Potato)
2. **How much quantity?** (in kg)

### Step 3: Get Your Recommendation

The system will tell you:
- **Which mandi to sell at** (Ahmedabad, Mehsana, or Rajkot)
- **When to sell** (today or wait X days)
- **Your expected net profit** (after all costs)
- **Why** this is the best option

---

## Example Output

```
==============================================================================
       YOUR PERSONALIZED RECOMMENDATION
==============================================================================

Crop: Onion
Quantity: 1,000 kg

------------------------------------------------------------------------------
RECOMMENDATION:
------------------------------------------------------------------------------
  Wait 1 days, then sell at Rajkot

------------------------------------------------------------------------------
PROFIT BREAKDOWN:
------------------------------------------------------------------------------
  Market (Mandi):        Rajkot
  Distance:              220 km
  Selling Price:         Rs.67.90/kg
  Days to Wait:          1 days

  Gross Revenue:         Rs.67,900.00
  - Transport Cost:      Rs.1,100.00
  - Storage Cost:        Rs.500.00
  - Spoilage Cost:       Rs.1,358.00
  - Traffic Delay:       Rs.203.70
  --------------------------------------------------
  NET PROFIT:            Rs.64,738.30

------------------------------------------------------------------------------
WHY THIS RECOMMENDATION:
------------------------------------------------------------------------------
  HOLD for 1 days, then sell at Rajkot. Predicted price will increase by 
  Rs.1.60/kg (from Rs.66.30 to Rs.67.90). Even after paying Rs.500 in 
  storage costs and accounting for spoilage, you will gain an additional 
  Rs.760 compared to selling today. Final net profit: Rs.64,738.
```

---

## How It Works (Simple Explanation)

### 1. **Data Collection**
The system uses real market price data from all major Gujarat mandis (Ahmedabad, Mehsana, Rajkot).

### 2. **Price Prediction**
Using Machine Learning (XGBoost), the system predicts prices for the next 7 days.

### 3. **Profit Calculation**
For each option, the system calculates your **NET PROFIT**:

```
Net Profit = (Selling Price × Quantity) - ALL COSTS

Costs include:
- Transport cost: Rs.5 per km
- Storage cost: Rs.0.50 per kg per day
- Spoilage cost: Based on crop type (vegetables spoil faster)
- Traffic delay cost: Higher in urban areas
```

### 4. **Best Recommendation**
The system compares:
- **WHERE** to sell (which mandi gives best price minus transport)
- **WHEN** to sell (is it worth waiting for higher prices?)

Then recommends the option with **highest net profit**.

---

## Benefits for Farmers

✅ **Maximize Profit** - Not just highest price, but highest profit after costs  
✅ **Save Time** - No need to call multiple mandis  
✅ **Data-Driven** - Based on real market data and predictions  
✅ **Easy to Use** - Simple questions, clear recommendations  
✅ **Considers Everything** - Transport, storage, spoilage all factored in

---

## Technical Details (For Developers)

### Files Structure:
```
mandi_intelligence/
├── get_recommendation.py          # Farmer interface (USE THIS)
├── quick_test.py                  # Quick system test
├── dataset/
│   └── commodity_price.csv        # Real Kaggle data (2,733 records)
├── ml_arbitrage/
│   ├── data_loader.py            # Loads and processes data
│   ├── price_predictor.py        # XGBoost forecasting
│   ├── arbitrage_engine.py       # Net Profit optimization
│   ├── main.py                   # Full demo script
│   └── models/                   # 9 trained XGBoost models
└── FARMER_GUIDE.md               # This file
```

### How to Retrain Models:

If you get new data or want to refresh models:

```bash
python quick_test.py
```

This will:
1. Load your latest dataset
2. Train all 9 models (3 mandis × 3 crops)
3. Save them to `ml_arbitrage/models/`

---

## API Integration (Future)

For mobile app integration, the system can be wrapped as an API:

```python
POST /api/recommend
{
  "crop": "Onion",
  "quantity_kg": 1000,
  "location": "Gandhinagar"
}

Response:
{
  "recommendation": "Wait 1 days, then sell at Rajkot",
  "net_profit": 64738.30,
  "mandi": "Rajkot",
  ...
}
```

---

## Support

For questions or issues:
1. Check that `dataset/commodity_price.csv` exists
2. Make sure models are trained (`quick_test.py`)
3. Run `python get_recommendation.py` for farmer interface

---

**Built with ❤️ for Indian Farmers**
