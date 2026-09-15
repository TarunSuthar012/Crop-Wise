"""
Profit Calculator Module

Implements the core Net Profit calculation algorithm for Mandi Arbitrage Engine.
Formula: Net Profit = (Price × Qty) - (Distance × FuelCost) - (WaitTime × PerishabilityFactor)
"""

from typing import Dict, List, Tuple

# Constants
FUEL_COST_PER_KM = 15  # ₹ per km (assumes small truck)
PERISHABILITY_DEDUCTION = 0.05  # 5% deduction for high crowd levels


def calculate_gross_earnings(price: float, quantity: float) -> float:
    """
    Calculate gross earnings from selling produce.
    
    Args:
        price: Price per kg in ₹
        quantity: Quantity in kg
    
    Returns:
        Gross earnings in ₹
    """
    return price * quantity


def calculate_transport_cost(distance: float) -> float:
    """
    Calculate transportation cost based on distance.
    
    Args:
        distance: Distance to mandi in km
    
    Returns:
        Transport cost in ₹
    """
    return distance * FUEL_COST_PER_KM


def calculate_perishability_cost(gross_earnings: float, crowd_level: str) -> float:
    """
    Calculate perishability cost based on wait time (crowd level).
    
    Args:
        gross_earnings: Total gross earnings in ₹
        crowd_level: "Low", "Medium", or "High"
    
    Returns:
        Perishability cost in ₹ (5% of gross if High crowd, else 0)
    """
    if crowd_level.upper() == "HIGH":
        return gross_earnings * PERISHABILITY_DEDUCTION
    return 0.0


def calculate_net_profit(
    price: float,
    quantity: float,
    distance: float,
    crowd_level: str
) -> Dict[str, float]:
    """
    Calculate net profit after all costs.
    
    Args:
        price: Price per kg in ₹
        quantity: Quantity in kg
        distance: Distance to mandi in km
        crowd_level: "Low", "Medium", or "High"
    
    Returns:
        Dictionary with breakdown:
        - gross_earnings
        - transport_cost
        - perishability_cost
        - net_profit
    """
    gross_earnings = calculate_gross_earnings(price, quantity)
    transport_cost = calculate_transport_cost(distance)
    perishability_cost = calculate_perishability_cost(gross_earnings, crowd_level)
    
    net_profit = gross_earnings - transport_cost - perishability_cost
    
    return {
        "gross_earnings": gross_earnings,
        "transport_cost": transport_cost,
        "perishability_cost": perishability_cost,
        "net_profit": net_profit
    }


def rank_mandis(
    crop: str,
    quantity: float,
    mandis_data: List[Dict]
) -> List[Dict]:
    """
    Rank mandis by net profit for a given crop and quantity.
    
    Args:
        crop: Name of the crop (e.g., "Onion", "Tomato", "Potato")
        quantity: Quantity to sell in kg
        mandis_data: List of mandi dictionaries from JSON
    
    Returns:
        List of mandis sorted by net_profit (highest first), each with:
        - All original mandi data
        - profit_breakdown: Dict with gross, costs, and net profit
    """
    ranked = []
    
    for mandi in mandis_data:
        # Check if crop is available at this mandi
        if crop not in mandi.get("crop_prices", {}):
            continue
        
        price = mandi["crop_prices"][crop]
        distance = mandi["distance_km"]
        crowd_level = mandi["crowd_level"]
        
        # Calculate profit breakdown
        profit_breakdown = calculate_net_profit(price, quantity, distance, crowd_level)
        
        # Add to results
        ranked.append({
            "mandi_id": mandi["id"],
            "mandi_name": mandi["name"],
            "location": mandi["location"],
            "distance_km": distance,
            "price_per_kg": price,
            "crowd_level": crowd_level,
            **profit_breakdown
        })
    
    # Sort by net profit (descending)
    ranked.sort(key=lambda x: x["net_profit"], reverse=True)
    
    return ranked
