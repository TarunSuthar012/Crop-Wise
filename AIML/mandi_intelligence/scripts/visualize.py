"""
Visualization Script for Mandi Comparison

Prints a console table comparing Gross Earnings vs Net Profit for each mandi.
Demonstrates that the algorithm correctly factors in costs beyond just price.
"""

import json
import sys
from pathlib import Path
from typing import List, Dict

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from core.profit_calculator import rank_mandis


def format_currency(amount: float) -> str:
    """Format amount as Indian currency"""
    return f"₹{amount:,.0f}"


def print_header():
    """Print the table header"""
    print("\n" + "=" * 100)
    print("MANDI ARBITRAGE ENGINE - PROFIT COMPARISON".center(100))
    print("=" * 100)


def print_table(crop: str, quantity: float, ranked_mandis: List[Dict]):
    """
    Print a formatted comparison table.
    
    Args:
        crop: Crop name
        quantity: Quantity in kg
        ranked_mandis: Ranked list from rank_mandis()
    """
    if not ranked_mandis:
        print(f"\n❌ No mandis found for {crop}\n")
        return
    
    # Table header
    print(f"\n📊 Crop: {crop} | Quantity: {quantity:,.0f} kg\n")
    print("-" * 100)
    print(f"{'Rank':<6} {'Mandi Name':<25} {'Dist':<8} {'Price':<10} {'Gross':<15} {'Transport':<12} {'Perish':<12} {'Net Profit':<15}")
    print(f"{'':6} {'':25} {'(km)':<8} {'(₹/kg)':<10} {'Earnings':<15} {'Cost':<12} {'Cost':<12} {'(₹)':<15}")
    print("-" * 100)
    
    # Table rows
    for i, mandi in enumerate(ranked_mandis, 1):
        rank_icon = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f"{i}."
        
        print(
            f"{rank_icon:<6} "
            f"{mandi['mandi_name'][:24]:<25} "
            f"{mandi['distance_km']:<8.0f} "
            f"{mandi['price_per_kg']:<10.0f} "
            f"{format_currency(mandi['gross_earnings']):<15} "
            f"{format_currency(mandi['transport_cost']):<12} "
            f"{format_currency(mandi['perishability_cost']):<12} "
            f"{format_currency(mandi['net_profit']):<15}"
        )
    
    print("-" * 100)
    
    # Key insights
    best = ranked_mandis[0]
    print(f"\n✅ BEST CHOICE: {best['mandi_name']} ({best['distance_km']}km)")
    print(f"   Net Profit: {format_currency(best['net_profit'])}")
    
    # Show that distance doesn't always mean lower profit
    furthest = max(ranked_mandis, key=lambda x: x['distance_km'])
    closest = min(ranked_mandis, key=lambda x: x['distance_km'])
    
    print(f"\n💡 KEY INSIGHT:")
    print(f"   Closest Mandi ({closest['mandi_name']}, {closest['distance_km']}km): {format_currency(closest['net_profit'])}")
    print(f"   Furthest Mandi ({furthest['mandi_name']}, {furthest['distance_km']}km): {format_currency(furthest['net_profit'])}")
    
    if furthest['net_profit'] > closest['net_profit']:
        diff = furthest['net_profit'] - closest['net_profit']
        print(f"   → Going {furthest['distance_km']}km instead of {closest['distance_km']}km earns you {format_currency(diff)} MORE! 🚀")
    else:
        print(f"   → Closer is better in this case!")
    
    print("\n" + "=" * 100 + "\n")


def load_mandi_data() -> List[Dict]:
    """Load mandi data from JSON"""
    data_path = Path(__file__).parent.parent / "data" / "mandi_data.json"
    
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    return data["mandis"]


def main():
    """Main function to run visualizations"""
    print_header()
    
    # Load data
    mandis = load_mandi_data()
    print(f"\n✅ Loaded {len(mandis)} mandis from database")
    
    # Test scenarios
    scenarios = [
        ("Onion", 1500),
        ("Tomato", 1200),
        ("Potato", 2000),
    ]
    
    for crop, quantity in scenarios:
        ranked = rank_mandis(crop, quantity, mandis)
        print_table(crop, quantity, ranked)
    
    print("\n🎯 Analysis complete! The table above proves that NET PROFIT ≠ GROSS EARNINGS")
    print("   Transportation and perishability costs significantly impact the final profit.\n")


if __name__ == "__main__":
    main()
