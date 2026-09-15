"""
FARMER-FACING RECOMMENDATION SYSTEM
====================================

Simple interface for farmers to get selling recommendations.

Usage:
    python get_recommendation.py

The farmer will be asked:
1. What crop they have (Onion, Tomato, or Potato)
2. How much quantity (in kg)
3. System will recommend where and when to sell for maximum profit
"""

import sys
import os
sys.path.insert(0, '.')

from ml_arbitrage.data_loader import MandiDataLoader
from ml_arbitrage.price_predictor import PricePredictor
from ml_arbitrage.arbitrage_engine import ArbitrageEngine
import pandas as pd

def print_banner():
    """Print welcome banner"""
    print()
    print("=" * 70)
    print("       BEEJ RAKSHAK - MANDI PRICE RECOMMENDATION SYSTEM")
    print("=" * 70)
    print()
    print("This system helps you maximize your profit by recommending:")
    print("  - Which mandi to sell at")
    print("  - Whether to sell now or wait for better prices")
    print()

def get_farmer_input():
    """Get input from farmer"""
    print("-" * 70)
    print("Please provide your details:")
    print("-" * 70)
    print()
    
    # Location selection
    print("Your current location:")
    print("  1. Gandhinagar")
    print("  2. Ahmedabad")
    print("  3. Mehsana")
    print("  4. Rajkot")
    print("  5. Surat")
    print("  6. Other")
    print()
    
    location_choice = input("Enter location number (1-6): ").strip()
    location_map = {
        '1': 'Gandhinagar',
        '2': 'Ahmedabad',
        '3': 'Mehsana',
        '4': 'Rajkot',
        '5': 'Surat',
        '6': None
    }
    location = location_map.get(location_choice, 'Gandhinagar')
    
    if location is None:
        location = input("Enter your city name: ").strip() or 'Gandhinagar'
    
    print()
    
    # Crop selection
    print("Available crops:")
    print("  1. Onion")
    print("  2. Tomato")
    print("  3. Potato")
    print()
    
    crop_choice = input("Enter crop number (1-3): ").strip()
    crop_map = {'1': 'Onion', '2': 'Tomato', '3': 'Potato'}
    crop = crop_map.get(crop_choice, 'Onion')
    
    # Quantity
    try:
        quantity = float(input("Enter quantity in kg: ").strip())
    except:
        quantity = 1000
        print(f"Using default: {quantity} kg")
    
    print()
    return location, crop, quantity

def load_models():
    """Load trained models and data"""
    print("Loading trained models and latest prices...")
    print()
    
    # Load data
    loader = MandiDataLoader()
    loader.load_data("dataset/commodity_price.csv")
    df = loader.filter_and_process(days=90)
    
    # Initialize predictor and load models
    predictor = PricePredictor()
    df_featured = predictor.prepare_features(df)
    
    # Load existing models (they should already be trained)
    # If not trained, train them
    try:
        # Try to use existing models
        predictor.models  # This will load models if they exist
    except:
        # Train if needed
        print("Training models (first time only)...")
        predictor.train_all_models(df_featured)
    
    return df_featured, predictor

def generate_recommendation(df_featured, predictor, location, crop, quantity):
    """Generate recommendation for farmer"""
    
    # Get latest prices
    latest_date = df_featured['Date'].max()
    df_current = df_featured[df_featured['Date'] == latest_date]
    
    # Generate forecasts
    forecasts_data = []
    try:
        forecasts = predictor.get_price_forecast_all_mandis(df_featured, crop, days_ahead=7)
        for mandi, forecast in forecasts.items():
            for _, row in forecast.iterrows():
                forecasts_data.append({
                    'Mandi_Name': mandi,
                    'Crop': crop,
                    'Day_Ahead': row['Day_Ahead'],
                    'Predicted_Price': row['Predicted_Price']
                })
    except Exception as e:
        print(f"Note: Could not generate forecasts - {e}")
    
    df_forecast = pd.DataFrame(forecasts_data) if forecasts_data else None
    
    # Initialize engine
    engine = ArbitrageEngine(price_predictor=predictor)
    
    # Get recommendation (use farmer's actual location)
    recommendation = engine.get_best_selling_strategy(
        current_qty_kg=quantity,
        crop=crop,
        current_location=location,  # Dynamic location!
        df_current=df_current,
        df_forecast=df_forecast
    )
    
    return recommendation

def display_recommendation(recommendation, location, crop, quantity):
    """Display recommendation in farmer-friendly format"""
    print()
    print("="  * 70)
    print("       YOUR PERSONALIZED RECOMMENDATION")
    print("=" * 70)
    print()
    
    if 'error' in recommendation:
        print(f"Sorry, could not generate recommendation: {recommendation.get('error')}")
        return
    
    print(f"Your Location: {location}")
    print(f"Crop: {crop}")
    print(f"Quantity: {quantity:,.0f} kg")
    print()
    
    print("-" * 70)
    print("RECOMMENDATION:")
    print("-" * 70)
    print(f"  {recommendation['recommendation']}")
    print()
    
    if 'optimal_strategy' in recommendation:
        opt = recommendation['optimal_strategy']
        breakdown = opt['cost_breakdown']
        
        print("-" * 70)
        print("PROFIT BREAKDOWN:")
        print("-" * 70)
        print(f"  Market (Mandi):        {opt['mandi']}")
        print(f"  Distance:              {opt['distance_km']} km")
        print(f"  Selling Price:         Rs.{opt['price_per_kg']:.2f}/kg")
        if opt['days_to_wait'] > 0:
            print(f"  Days to Wait:          {opt['days_to_wait']} days")
        print()
        print(f"  Gross Revenue:         Rs.{breakdown['gross_revenue']:,.2f}")
        print(f"  - Transport Cost:      Rs.{breakdown['transport_cost']:,.2f}")
        print(f"  - Storage Cost:        Rs.{breakdown['storage_cost']:,.2f}")
        print(f"  - Spoilage Cost:       Rs.{breakdown['perishability_cost']:,.2f}")
        print(f"  - Traffic Delay:       Rs.{breakdown['traffic_cost']:,.2f}")
        print(f"  " + "-" * 50)
        print(f"  NET PROFIT:            Rs.{opt['net_profit']:,.2f}")
        print()
        
        print("-" * 70)
        print("WHY THIS RECOMMENDATION:")
        print("-" * 70)
        print(f"  {recommendation['justification']}")
        print()
    
    # Show alternatives
    if recommendation.get('alternative_scenarios'):
        print("-" * 70)
        print("ALTERNATIVE OPTIONS:")
        print("-" * 70)
        for i, alt in enumerate(recommendation['alternative_scenarios'][:3], 1):
            wait_text = f"Wait {alt['days_to_wait']} days, " if alt['days_to_wait'] > 0 else ""
            print(f"  {i}. {wait_text}Sell at {alt['mandi_name']} - Net Profit: Rs.{alt['net_profit']:,.2f}")
        print()
    
    print("=" * 70)

def main():
    """Main function"""
    print_banner()
    
    # Get farmer input
    location, crop, quantity = get_farmer_input()
    
    # Load models
    try:
        df_featured, predictor = load_models()
        print(f"Ready! Using latest market data for {crop}")
        print()
    except Exception as e:
        print(f"Error loading models: {e}")
        print("Please make sure the dataset is in dataset/commodity_price.csv")
        return
    
    # Generate recommendation
    print(f"Analyzing market conditions from {location} and generating recommendation...")
    print()
    
    try:
        recommendation = generate_recommendation(df_featured, predictor, location, crop, quantity)
        display_recommendation(recommendation, location, crop, quantity)
    except Exception as e:
        print(f"Error generating recommendation: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
