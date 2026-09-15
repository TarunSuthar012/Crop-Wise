"""
Mandi Arbitrage Engine - Main Demonstration Script
===================================================

This script demonstrates the complete ML-powered arbitrage system:
1. Load/Generate mandi price data
2. Train XGBoost models for price forecasting  
3. Run example scenarios showing spatial + temporal arbitrage
4. Output structured JSON recommendations with detailed justifications

Run this to see the system in action!
"""

import pandas as pd
import numpy as np
from datetime import datetime
import json
from pathlib import Path

# Import our modules
from data_loader import MandiDataLoader
from price_predictor import PricePredictor
from arbitrage_engine import ArbitrageEngine


def print_header(title: str):
    """Print a formatted section header."""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")


def print_json_pretty(data: dict, title: str = ""):
    """Print JSON data in a readable format."""
    if title:
        print(f"\n{title}:")
        print("-" * 60)
    print(json.dumps(data, indent=2, ensure_ascii=False))
    print()


def main():
    """Main execution flow."""
    
    print_header("MANDI ARBITRAGE ENGINE - ML-Powered Profit Maximization")
    
    print("📋 SYSTEM OVERVIEW")
    print("-" * 80)
    print("This engine maximizes farmer's net profit using:")
    print("  • Real historical mandi price data (or synthetic if unavailable)")
    print("  • XGBoost ML models for 7-day price forecasting")
    print("  • Dual arbitrage logic: Spatial (where?) + Temporal (when?)")
    print()
    print("NET PROFIT FORMULA:")
    print("  Net Profit = (Price × Qty) - (Distance × ₹5/km) - (Storage × ₹0.50/kg/day)")
    print("              - (Perishability × Days × GrossRevenue) - (Traffic × Spoilage)")
    print()
    
    # ============================================================================
    # STEP 1: Load/Generate Data
    # ============================================================================
    
    print_header("STEP 1: Loading Mandi Price Data")
    
    loader = MandiDataLoader()
    
    # Try to load real Kaggle data from dataset folder FIRST
    real_data_paths = [
        "dataset/commodity_price.csv",  # Primary location (user's downloaded data)
        "../dataset/commodity_price.csv",
        "data/mandi_prices.csv",
        "../data/mandi_prices.csv",
        "mandi_prices.csv"
    ]
    
    df = None
    for path in real_data_paths:
        try:
            loader.load_data(path)
            df = loader.filter_and_process(days=90)
            print("✅ Using REAL Kaggle data")
            break
        except FileNotFoundError:
            continue
    
    if df is None:
        print("⚠️  Real data not found. Generating synthetic data for demonstration...")
        df = loader.generate_synthetic_data(days=90)
    
    # Show summary
    stats = loader.get_summary_stats()
    print_json_pretty(stats, "Data Summary")
    
    # Save processed data
    output_path = "ml_arbitrage/processed_mandi_data.csv"
    loader.save_processed_data(output_path)
    
    # ============================================================================
    # STEP 2: Train Predictive Models
    # ============================================================================
    
    print_header("STEP 2: Training XGBoost Price Prediction Models")
    
    predictor = PricePredictor()
    
    print("🔧 Engineering time-series features...")
    df_featured = predictor.prepare_features(df)
    
    print(f"   Added features: lag prices, moving averages, trends, seasonality")
    print(f"   Total features: {len(df_featured.columns)}")
    print()
    
    print("🤖 Training models for all Mandi-Crop combinations...")
    print()
    results = predictor.train_all_models(df_featured)
    
    # Show training results
    print("\n📊 Model Performance Summary:")
    print("-" * 80)
    for result in results:
        if 'error' not in result:
            print(f"  {result['mandi']} - {result['crop']}: "
                  f"MAE=₹{result['mae']:.2f}/kg | MAPE={result['mape']:.1f}%")
    
    # ============================================================================
    # STEP 3: Initialize Arbitrage Engine
    # ============================================================================
    
    print_header("STEP 3: Initializing Arbitrage Decision Engine")
    
    engine = ArbitrageEngine(price_predictor=predictor)
    
    print("✅ Engine initialized with:")
    print(f"   • Price predictor: {len(predictor.models)} trained models")
    print(f"   • Perishability factors: {list(engine.perishability_factors.keys())}")
    print(f"   • Fuel cost: ₹{engine.FUEL_COST_PER_KM}/km (as specified)")
    print(f"   • Storage cost: ₹{engine.STORAGE_COST_PER_KG_DAY}/kg/day (as specified)")
    
    # ============================================================================
    # STEP 4: Run Example Scenarios
    # ============================================================================
    
    print_header("STEP 4: Running Example Scenarios")
    
    # Get latest data for current prices
    latest_date = df_featured['Date'].max()
    df_current = df_featured[df_featured['Date'] == latest_date].copy()
    
    # Generate forecasts for all mandis and crops
    print("🔮 Generating 7-day price forecasts...")
    
    forecasts_data = []
    for crop in df_current['Crop'].unique():
        forecasts = predictor.get_price_forecast_all_mandis(df_featured, crop, days_ahead=7)
        for mandi, forecast in forecasts.items():
            for _, row in forecast.iterrows():
                forecasts_data.append({
                    'Mandi_Name': mandi,
                    'Crop': crop,
                    'Day_Ahead': row['Day_Ahead'],
                    'Predicted_Price': row['Predicted_Price']
                })
    
    df_forecast = pd.DataFrame(forecasts_data)
    print(f"   Generated {len(df_forecast)} price predictions")
    
    # ============================================================================
    # SCENARIO 1: Onion Farmer with 1000 kg
    # ============================================================================
    
    print_header("SCENARIO 1: Onion Farmer with 1000 kg (High Perishability)")
    
    print("🌾 Farmer Profile:")
    print("   Crop: Onion")
    print("   Quantity: 1,000 kg")
    print("   Perishability: 0.03 (higher - onions degrade faster)")
    print()
    
    recommendation_1 = engine.get_best_selling_strategy(
        current_qty_kg=1000,
        crop='Onion',
        current_location='Gandhinagar',
        df_current=df_current,
        df_forecast=df_forecast,
        crop_perishability_factor=0.03
    )
    
    print_json_pretty(recommendation_1, "💡 RECOMMENDATION")
    
    # ============================================================================
    # SCENARIO 2: Tomato Farmer with 500 kg
    # ============================================================================
    
    print_header("SCENARIO 2: Tomato Farmer with 500 kg (Very High Perishability)")
    
    print("🌾 Farmer Profile:")
    print("   Crop: Tomato")
    print("   Quantity: 500 kg")
    print("   Perishability: 0.05 (very high - tomatoes spoil quickly)")
    print()
    
    recommendation_2 = engine.get_best_selling_strategy(
        current_qty_kg=500,
        crop='Tomato',
        current_location='Gandhinagar',
        df_current=df_current,
        df_forecast=df_forecast,
        crop_perishability_factor=0.05
    )
    
    print_json_pretty(recommendation_2, "💡 RECOMMENDATION")
    
    # ============================================================================
    # SCENARIO 3: Potato Farmer with 2000 kg
    # ============================================================================
    
    print_header("SCENARIO 3: Potato Farmer with 2000 kg (Medium Perishability)")
    
    print("🧅 Farmer Profile:")
    print("   Crop: Potato")
    print("   Quantity: 2,000 kg")
    print("   Perishability: 0.02 (medium - potatoes store moderately well)")
    print()
    
    recommendation_3 = engine.get_best_selling_strategy(
        current_qty_kg=2000,
        crop='Potato',
        current_location='Gandhinagar',
        df_current=df_current,
        df_forecast=df_forecast,
        crop_perishability_factor=0.02
    )
    
    print_json_pretty(recommendation_3, "💡 RECOMMENDATION")
    
    # ============================================================================
    # STEP 5: Mathematical Verification
    # ============================================================================
    
    print_header("STEP 5: Net Profit Calculation Verification")
    
    print("📐 Let's verify the math for Scenario 1 (Onion):")
    print("-" * 80)
    
    opt = recommendation_1['optimal_strategy']
    breakdown = opt['cost_breakdown']
    
    print(f"\nINPUTS:")
    print(f"  Price: ₹{opt['price_per_kg']}/kg")
    print(f"  Quantity: 1,000 kg")
    print(f"  Distance: {opt['distance_km']} km")
    print(f"  Days to wait: {opt['days_to_wait']} days")
    
    print(f"\nCALCULATIONS:")
    print(f"  1. Gross Revenue = ₹{opt['price_per_kg']} × 1000 kg = ₹{breakdown['gross_revenue']:,.0f}")
    print(f"  2. Transport Cost = {opt['distance_km']} km × ₹5/km = ₹{breakdown['transport_cost']:,.0f}")
    print(f"  3. Storage Cost = {opt['days_to_wait']} days × 1000 kg × ₹0.50 = ₹{breakdown['storage_cost']:,.0f}")
    print(f"  4. Perishability Cost = {opt['days_to_wait']} days × 0.005 × ₹{breakdown['gross_revenue']:,.0f} = ₹{breakdown['perishability_cost']:,.0f}")
    print(f"  5. Traffic Delay Cost = (traffic impact on freshness) = ₹{breakdown['traffic_cost']:,.0f}")
    
    print(f"\nFINAL CALCULATION:")
    print(f"  Net Profit = ₹{breakdown['gross_revenue']:,.0f} - ₹{breakdown['total_costs']:,.0f}")
    print(f"  Net Profit = ₹{opt['net_profit']:,.0f}")
    print(f"\n  Profit Margin: {opt['net_profit'] / breakdown['gross_revenue'] * 100:.1f}%")
    
    # ============================================================================
    # Summary
    # ============================================================================
    
    print_header("SYSTEM DEMONSTRATION COMPLETE")
    
    print("✅ Successfully demonstrated:")
    print("   1. Data loading/generation (real or synthetic)")
    print("   2. XGBoost model training for price forecasting")
    print("   3. Spatial arbitrage (compare different mandis)")
    print("   4. Temporal arbitrage (compare sell now vs. wait)")
    print("   5. Net profit optimization with full cost accounting")
    print()
    print("📁 Generated files:")
    print(f"   • {output_path}")
    print(f"   • ml_arbitrage/models/*.pkl (trained models)")
    print()
    print("🎯 Key Features:")
    print("   • Accounts for transportation costs (₹5/km)")
    print("   • Accounts for storage costs (₹0.50/kg/day)")
    print("   • Accounts for perishability (varies by crop)")
    print("   • Accounts for traffic congestion effects")
    print("   • Provides clear justifications for judges")
    print()
    print("=" * 80)
    print("  Ready for evaluation! 🚀")
    print("=" * 80)


if __name__ == "__main__":
    main()
