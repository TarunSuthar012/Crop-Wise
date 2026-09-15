"""
Insight Generator Module

Generates human-readable recommendations explaining why a particular mandi
is the best choice based on the net profit calculations.
"""

from typing import Dict, Optional


def generate_comparison_insight(
    best_mandi: Dict,
    second_best_mandi: Optional[Dict] = None
) -> str:
    """
    Generate a human-readable insight for the top recommendation.
    
    Args:
        best_mandi: Top-ranked mandi with profit breakdown
        second_best_mandi: Second-best mandi for comparison (optional)
    
    Returns:
        String explaining why this mandi is recommended
    """
    name = best_mandi["mandi_name"]
    distance = best_mandi["distance_km"]
    price = best_mandi["price_per_kg"]
    net_profit = best_mandi["net_profit"]
    
    # Base recommendation
    insight = f"Go to {name} ({distance}km). "
    
    # If there's a second-best mandi, compare them
    if second_best_mandi:
        second_name = second_best_mandi["mandi_name"]
        second_distance = second_best_mandi["distance_km"]
        second_price = second_best_mandi["price_per_kg"]
        second_net_profit = second_best_mandi["net_profit"]
        
        price_diff = price - second_price
        profit_diff = net_profit - second_net_profit
        distance_diff = distance - second_distance
        
        # Case 1: Best mandi is further but more profitable
        if distance > second_distance:
            insight += (
                f"Even though it is {abs(distance_diff):.0f}km further than {second_name}, "
                f"the price is ₹{price_diff:.0f}/kg higher, "
                f"so you will make ₹{profit_diff:,.0f} more profit after fuel costs."
            )
        # Case 2: Best mandi is closer AND more profitable
        elif distance < second_distance:
            insight += (
                f"It is {abs(distance_diff):.0f}km closer than {second_name} "
                f"and offers ₹{price_diff:.0f}/kg better price, "
                f"giving you ₹{profit_diff:,.0f} more profit."
            )
        # Case 3: Same distance but better price
        else:
            insight += (
                f"At the same distance as {second_name}, "
                f"it offers ₹{price_diff:.0f}/kg better price, "
                f"giving you ₹{profit_diff:,.0f} more profit."
            )
    else:
        # No comparison available, just state the profit
        insight += f"You will earn a net profit of ₹{net_profit:,.0f}."
    
    # Add crowd level warning if high
    if best_mandi["crowd_level"].upper() == "HIGH":
        perishability_cost = best_mandi["perishability_cost"]
        insight += f" Note: High crowd level may cause ₹{perishability_cost:,.0f} in perishability losses."
    
    return insight


def generate_summary_table(ranked_mandis: list) -> str:
    """
    Generate a simple text summary of all ranked mandis.
    
    Args:
        ranked_mandis: List of ranked mandis from rank_mandis()
    
    Returns:
        Multi-line string with summary
    """
    if not ranked_mandis:
        return "No mandis available for this crop."
    
    lines = ["MANDI RANKINGS:\n"]
    
    for i, mandi in enumerate(ranked_mandis, 1):
        lines.append(
            f"{i}. {mandi['mandi_name']} - "
            f"Net Profit: ₹{mandi['net_profit']:,.0f} "
            f"(Distance: {mandi['distance_km']}km, "
            f"Price: ₹{mandi['price_per_kg']}/kg)"
        )
    
    return "\n".join(lines)
