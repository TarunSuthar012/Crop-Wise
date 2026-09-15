# 🌾 Mandi Recommendation System - Quick Start

## For Farmers: Get Selling Recommendations

### Simple Usage (3 Steps):

1. **Open terminal in the `mandi_intelligence` folder**
2. **Run the command:**
   ```bash
   python get_recommendation.py
   ```
3. **Answer 2 questions:**
   - What crop? (Onion/Tomato/Potato)
   - How much quantity? (in kg)
4. **Get your recommendation!**

The system will tell you:
- Which mandi to sell at
- Whether to sell now or wait
- Your expected net profit

---

## Example:

```bash
C:\Users\Yatrik\Desktop\BeejRakshak\mandi_intelligence> python get_recommendation.py

==============================================================================
       BEEJ RAKSHAK - MANDI PRICE RECOMMENDATION SYSTEM
==============================================================================

Available crops:
  1. Onion
  2. Tomato
  3. Potato

Enter crop number (1-3): 1
Enter quantity in kg: 1000

... (system analyzes) ...

YOUR PERSONALIZED RECOMMENDATION:
  Wait 1 days, then sell at Rajkot
  NET PROFIT: Rs.64,738.30
```

---

## What Makes This System Special?

✅ **Uses Real Data** - 2,733 actual mandi price records from Kaggle  
✅ **ML-Powered** - XGBoost predicts prices 7 days ahead  
✅ **Calculates Net Profit** - Not just price, but profit after:
   - Transport costs (Rs.5/km)
   - Storage costs (Rs.0.50/kg/day)
   - Spoilage (varies by crop)
   - Traffic delays  
✅ **Dual Optimization** - Finds best mandi AND best timing

---

## Files:

- **`get_recommendation.py`** ← USE THIS (farmer interface)
- **`FARMER_GUIDE.md`** - Detailed guide
- **`quick_test.py`** - System test / model training
- **`ml_arbitrage/`** - Core engine (9 trained models)

---

## For Developers:

### Test the System:
```bash
python quick_test.py
```

### Full Demo (all scenarios):
```bash
python ml_arbitrage/main.py
```

### API Integration:
See existing FastAPI service in `api/main.py`

---

**📱 Ready for mobile app integration!**
