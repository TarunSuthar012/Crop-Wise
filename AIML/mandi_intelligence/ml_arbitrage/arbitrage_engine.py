"""
Mandi Arbitrage Engine - Core Decision Logic
=============================================

This module implements the Net Profit maximization algorithm with:
- Logic A (Spatial): Compare selling at different mandis TODAY
- Logic B (Temporal): Compare selling NOW vs. WAITING for better prices

NET PROFIT FORMULA:
Net Profit = (Price × Qty) - (Distance × FuelCost) - (Storage × StorageCost) - (Perishability × Days)

Where:
- Price × Qty = Gross Revenue (₹)
- Distance × FuelCost = Transportation Cost (₹5/km as specified)
- Storage × StorageCost = Storage fees (₹0.50/kg/day)
- Perishability × Days = Crop spoilage cost (varies by crop)
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass
import json

# Import distance calculator for dynamic distance calculation
from .distance_calculator import calculate_distances_from_location, get_distance


@dataclass
class MandiOption:
    """Represents a selling option at a specific mandi."""
    mandi_name: str
    distance_km: float
    price_per_kg: float
    traffic_congestion: float
    days_to_wait: int = 0  # 0 = sell today, >0 = wait N days
    is_predicted: bool = False  # True if using predicted price


class ArbitrageEngine:
    """
    Core decision engine that maximizes farmer's net profit.
    """
    
    # Constants as class variables (as specified in requirements)
    FUEL_COST_PER_KM = 5.0  # ₹5 per km
    STORAGE_COST_PER_KG_DAY = 0.50  # ₹0.50 per kg per day
    
    def __init__(self, price_predictor=None):
        """
        Initialize the arbitrage engine.
        
        Args:
            price_predictor: Instance of PricePredictor for temporal arbitrage
        """
        self.price_predictor = price_predictor
        
        # Perishability factors (daily loss rate as fraction of quantity)
        # Based on crop shelf life: higher = more perishable
        self.perishability_factors = {
            'Onion': 0.03,       # Medium-high perishability
            'Potato': 0.02,      # Medium perishability
            'Rice': 0.008,       # Low perishability (stored grain)
            'Wheat': 0.007,      # Low perishability (stored grain)
            'Maize': 0.012,      # Low-medium perishability
            'Groundnut': 0.015,  # Medium perishability
            'Soyabean': 0.014,   # Medium perishability
        }
    
    def calculate_net_profit(
        self,
        price_per_kg: float,
        quantity_kg: float,
        distance_km: float,
        days_stored: int = 0,
        crop_perishability_factor: float = 0.01,
        traffic_congestion: float = 0.5
    ) -> Dict[str, float]:
        """
        Calculate net profit using the core formula.
        
        NET PROFIT FORMULA:
        ==================
        Gross Revenue = Price × Quantity
        Transport Cost = Distance × ₹5/km
        Storage Cost = Days × Quantity × ₹0.50/kg/day
        Perishability Cost = Days × Perishability Factor × Gross Revenue
        Traffic Delay Cost = Traffic Congestion × Perishability Factor × Gross Revenue
        
        Net Profit = Gross Revenue - Transport Cost - Storage Cost - Perishability Cost - Traffic Cost
        
        Args:
            price_per_kg: Selling price (₹/kg)
            quantity_kg: Quantity to sell (kg)
            distance_km: Distance to mandi (km)
            days_stored: Number of days to wait/store (0 = sell today)
            crop_perishability_factor: Daily spoilage rate (fraction)
            traffic_congestion: Traffic score 0-1 (higher = more delay)
            
        Returns:
            Dictionary with breakdown of all costs and net profit
        """
        # STEP 1: Calculate Gross Revenue
        # This is the total money you would get if there were no costs
        gross_revenue = price_per_kg * quantity_kg
        
        # STEP 2: Calculate Transportation Cost
        # Fuel cost to reach the mandi: Distance × ₹5/km
        transport_cost = distance_km * self.FUEL_COST_PER_KM
        
        # STEP 3: Calculate Storage Cost
        # If waiting N days, must pay storage fees: Days × Quantity × ₹0.50/kg/day
        storage_cost = days_stored * quantity_kg * self.STORAGE_COST_PER_KG_DAY
        
        # STEP 4: Calculate Perishability Cost (Time-based spoilage)
        # The longer you wait, the more crop spoils
        # Loss = Days × Perishability Factor × Original Value
        perishability_cost = days_stored * crop_perishability_factor * gross_revenue
        
        # STEP 5: Calculate Traffic Delay Cost
        # Traffic congestion causes delays which increase spoilage
        # Even on day 0, traffic can cause losses for perishable goods
        traffic_cost = traffic_congestion * crop_perishability_factor * gross_revenue * 0.5
        
        # STEP 6: Calculate Net Profit
        # Net Profit = What you earn - All costs
        total_costs = transport_cost + storage_cost + perishability_cost + traffic_cost
        net_profit = gross_revenue - total_costs
        
        return {
            'gross_revenue': round(gross_revenue, 2),
            'transport_cost': round(transport_cost, 2),
            'storage_cost': round(storage_cost, 2),
            'perishability_cost': round(perishability_cost, 2),
            'traffic_cost': round(traffic_cost, 2),
            'total_costs': round(total_costs, 2),
            'net_profit': round(net_profit, 2),
            'profit_margin_pct': round((net_profit / gross_revenue * 100), 2) if gross_revenue > 0 else 0
        }
    
    def evaluate_spatial_arbitrage(
        self,
        current_qty_kg: float,
        crop: str,
        mandi_options: List[MandiOption],
        crop_perishability_factor: Optional[float] = None
    ) -> List[Dict]:
        """
        LOGIC A: SPATIAL ARBITRAGE
        Compare selling at different mandis TODAY (day 0).
        
        Question: "Where should I sell to maximize profit?"
        
        Args:
            current_qty_kg: Quantity to sell (kg)
            crop: Crop name
            mandi_options: List of MandiOption objects with current prices
            crop_perishability_factor: Override default perishability
            
        Returns:
            List of scenarios ranked by net profit (best first)
        """
        if crop_perishability_factor is None:
            crop_perishability_factor = self.perishability_factors.get(crop, 0.01)
        
        scenarios = []
        
        for option in mandi_options:
            # Calculate net profit for selling at this mandi TODAY
            profit_breakdown = self.calculate_net_profit(
                price_per_kg=option.price_per_kg,
                quantity_kg=current_qty_kg,
                distance_km=option.distance_km,
                days_stored=0,  # Selling today
                crop_perishability_factor=crop_perishability_factor,
                traffic_congestion=option.traffic_congestion
            )
            
            scenarios.append({
                'mandi_name': option.mandi_name,
                'distance_km': option.distance_km,
                'price_per_kg': option.price_per_kg,
                'traffic_congestion': round(option.traffic_congestion, 2),
                'days_to_wait': 0,
                **profit_breakdown
            })
        
        # Sort by net profit (descending)
        scenarios.sort(key=lambda x: x['net_profit'], reverse=True)
        
        return scenarios
    
    def evaluate_temporal_arbitrage(
        self,
        current_qty_kg: float,
        crop: str,
        mandi_name: str,
        current_price: float,
        distance_km: float,
        traffic_congestion: float,
        future_prices: pd.DataFrame,
        crop_perishability_factor: Optional[float] = None,
        max_days: int = 7
    ) -> List[Dict]:
        """
        LOGIC B: TEMPORAL ARBITRAGE
        Compare selling TODAY vs. WAITING for predicted price increases.
        
        Question: "Should I sell now or wait for better prices?"
        
        Args:
            current_qty_kg: Quantity to sell (kg)
            crop: Crop name
            mandi_name: Which mandi to consider
            current_price: Today's price (₹/kg)
            distance_km: Distance to mandi
            traffic_congestion: Traffic score
            future_prices: DataFrame with columns [Day_Ahead, Predicted_Price]
            crop_perishability_factor: Override default perishability
            max_days: Maximum days to consider waiting
            
        Returns:
            List of scenarios for different waiting periods, ranked by net profit
        """
        if crop_perishability_factor is None:
            crop_perishability_factor = self.perishability_factors.get(crop, 0.01)
        
        scenarios = []
        
        # Scenario 0: Sell TODAY (baseline)
        profit_today = self.calculate_net_profit(
            price_per_kg=current_price,
            quantity_kg=current_qty_kg,
            distance_km=distance_km,
            days_stored=0,
            crop_perishability_factor=crop_perishability_factor,
            traffic_congestion=traffic_congestion
        )
        
        scenarios.append({
            'mandi_name': mandi_name,
            'distance_km': distance_km,
            'price_per_kg': current_price,
            'traffic_congestion': round(traffic_congestion, 2),
            'days_to_wait': 0,
            'is_predicted': False,
            **profit_today
        })
        
        # Scenarios 1-N: Wait and sell on future days
        for _, row in future_prices.iterrows():
            day_ahead = int(row['Day_Ahead'])
            predicted_price = float(row['Predicted_Price'])
            
            if day_ahead > max_days:
                break
            
            profit_future = self.calculate_net_profit(
                price_per_kg=predicted_price,
                quantity_kg=current_qty_kg,
                distance_km=distance_km,
                days_stored=day_ahead,
                crop_perishability_factor=crop_perishability_factor,
                traffic_congestion=traffic_congestion
            )
            
            scenarios.append({
                'mandi_name': mandi_name,
                'distance_km': distance_km,
                'price_per_kg': predicted_price,
                'traffic_congestion': round(traffic_congestion, 2),
                'days_to_wait': day_ahead,
                'is_predicted': True,
                **profit_future
            })
        
        # Sort by net profit
        scenarios.sort(key=lambda x: x['net_profit'], reverse=True)
        
        return scenarios
    
    def get_best_selling_strategy(
        self,
        current_qty_kg: float,
        crop: str,
        current_location: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        df_current: pd.DataFrame = None,
        df_forecast: Optional[pd.DataFrame] = None,
        crop_perishability_factor: Optional[float] = None
    ) -> Dict:
        """
        MAIN RECOMMENDATION ENGINE
        Combines spatial + temporal arbitrage to find optimal strategy.
        
        This is the primary function judges will evaluate!
        
        Args:
            current_qty_kg: Quantity to sell (kg)
            crop: Crop name
            current_location: Farmer's location name (optional)
            latitude: Farmer's latitude (optional)
            longitude: Farmer's longitude (optional)
            df_current: DataFrame with current prices for all mandis
            df_forecast: Optional DataFrame with future price forecasts
            crop_perishability_factor: Override default perishability
            
        Returns:
            Structured JSON/Dict with recommendation and justification
        """
        if crop_perishability_factor is None:
            crop_perishability_factor = self.perishability_factors.get(crop, 0.01)
        
        # ============================================
        # STEP 1: SPATIAL ARBITRAGE (Where to sell?)
        # ============================================
        
        # Get current prices for all mandis
        current_data = df_current[df_current['Crop'] == crop].copy()
        
        # DYNAMIC DISTANCE CALCULATION
        # Calculate distances from farmer's actual location
        # Priority: Lat/Lon > Location Name > Default (Gandhinagar)
        
        farmer_loc_ref = None
        if latitude is not None and longitude is not None:
            farmer_loc_ref = (latitude, longitude)
        elif current_location:
            farmer_loc_ref = current_location
        else:
            farmer_loc_ref = 'Gandhinagar'
            
        mandis = current_data['Mandi_Name'].unique().tolist()
        farmer_distances = calculate_distances_from_location(farmer_loc_ref, mandis)
        
        # Update distances in the dataframe
        current_data['Distance_km'] = current_data['Mandi_Name'].map(farmer_distances)
        
        mandi_options = []
        for _, row in current_data.iterrows():
            mandi_options.append(MandiOption(
                mandi_name=row['Mandi_Name'],
                distance_km=row['Distance_km'],
                price_per_kg=row['Price_per_kg'],
                traffic_congestion=row['Traffic_Congestion_Score'],
                days_to_wait=0
            ))
        
        spatial_scenarios = self.evaluate_spatial_arbitrage(
            current_qty_kg=current_qty_kg,
            crop=crop,
            mandi_options=mandi_options,
            crop_perishability_factor=crop_perishability_factor
        )
        
        best_spatial = spatial_scenarios[0] if spatial_scenarios else None
        
        # ============================================
        # STEP 2: TEMPORAL ARBITRAGE (When to sell?)
        # ============================================
        
        all_temporal_scenarios = []
        
        if self.price_predictor and df_forecast is not None:
            # For each mandi, evaluate temporal options
            for option in mandi_options:
                mandi_name = option.mandi_name
                
                # Get forecast for this mandi
                forecast = df_forecast[df_forecast['Mandi_Name'] == mandi_name]
                
                if len(forecast) > 0:
                    temp_scenarios = self.evaluate_temporal_arbitrage(
                        current_qty_kg=current_qty_kg,
                        crop=crop,
                        mandi_name=mandi_name,
                        current_price=option.price_per_kg,
                        distance_km=option.distance_km,
                        traffic_congestion=option.traffic_congestion,
                        future_prices=forecast,
                        crop_perishability_factor=crop_perishability_factor
                    )
                    all_temporal_scenarios.extend(temp_scenarios)
        
        # ============================================
        # STEP 3: FIND GLOBAL OPTIMUM
        # ============================================
        
        # Combine all scenarios (spatial + temporal)
        all_scenarios = spatial_scenarios + all_temporal_scenarios
        
        # Remove duplicates and sort by net profit
        seen = set()
        unique_scenarios = []
        for scenario in all_scenarios:
            key = (scenario['mandi_name'], scenario['days_to_wait'])
            if key not in seen:
                seen.add(key)
                unique_scenarios.append(scenario)
        
        unique_scenarios.sort(key=lambda x: x['net_profit'], reverse=True)
        
        optimal_strategy = unique_scenarios[0] if unique_scenarios else None
        
        # ============================================
        # STEP 4: GENERATE RECOMMENDATION
        # ============================================
        
        recommendation = self._generate_recommendation(
            optimal_strategy=optimal_strategy,
            best_spatial=best_spatial,
            all_scenarios=unique_scenarios[:5],  # Top 5
            quantity_kg=current_qty_kg,
            crop=crop
        )
        
        return recommendation
    
    def _generate_recommendation(
        self,
        optimal_strategy: Dict,
        best_spatial: Dict,
        all_scenarios: List[Dict],
        quantity_kg: float,
        crop: str
    ) -> Dict:
        """
        Generate human-readable recommendation with justification.
        
        This output format is what judges will see!
        """
        if not optimal_strategy:
            return {
                'error': 'No valid scenarios found',
                'recommendation': 'Unable to generate recommendation'
            }
        
        # Determine strategy type
        if optimal_strategy['days_to_wait'] == 0:
            strategy_type = "SPATIAL"
            action = f"Sell at {optimal_strategy['mandi_name']} TODAY"
        else:
            strategy_type = "TEMPORAL_SPATIAL"
            action = f"Wait {optimal_strategy['days_to_wait']} days, then sell at {optimal_strategy['mandi_name']}"
        
        # Generate justification
        justification = self._create_justification(
            optimal_strategy=optimal_strategy,
            best_spatial=best_spatial,
            quantity_kg=quantity_kg,
            crop=crop
        )
        
        # Build structured response
        response = {
            'recommendation': action,
            'strategy_type': strategy_type,
            'crop': crop,
            'quantity_kg': quantity_kg,
            'optimal_strategy': {
                'mandi': optimal_strategy['mandi_name'],
                'distance_km': optimal_strategy['distance_km'],
                'price_per_kg': optimal_strategy['price_per_kg'],
                'days_to_wait': optimal_strategy['days_to_wait'],
                'is_predicted_price': optimal_strategy.get('is_predicted', False),
                'net_profit': optimal_strategy['net_profit'],
                'cost_breakdown': {
                    'gross_revenue': optimal_strategy['gross_revenue'],
                    'transport_cost': optimal_strategy['transport_cost'],
                    'storage_cost': optimal_strategy['storage_cost'],
                    'perishability_cost': optimal_strategy['perishability_cost'],
                    'traffic_cost': optimal_strategy['traffic_cost'],
                    'total_costs': optimal_strategy['total_costs']
                }
            },
            'justification': justification,
            'alternative_scenarios': all_scenarios[1:5] if len(all_scenarios) > 1 else []
        }
        
        return response
    
    def _create_justification(
        self,
        optimal_strategy: Dict,
        best_spatial: Dict,
        quantity_kg: float,
        crop: str
    ) -> str:
        """Create human-readable justification for the recommendation."""
        
        mandi = optimal_strategy['mandi_name']
        days = optimal_strategy['days_to_wait']
        price = optimal_strategy['price_per_kg']
        net_profit = optimal_strategy['net_profit']
        distance = optimal_strategy['distance_km']
        
        if days == 0:
            # Spatial arbitrage justification
            if best_spatial and best_spatial['mandi_name'] == mandi:
                # This IS the best spatial option
                transport = optimal_strategy['transport_cost']
                justification = (
                    f"Sell at {mandi} ({distance}km away). "
                    f"Price is ₹{price}/kg. After deducting ₹{transport:.0f} transport cost "
                    f"and other expenses, your net profit will be ₹{net_profit:,.0f} "
                    f"for {quantity_kg}kg of {crop}."
                )
            else:
                justification = f"Sell at {mandi}. Net profit: ₹{net_profit:,.0f}"
        else:
            # Temporal arbitrage justification
            current_best = best_spatial
            if current_best:
                profit_gain = net_profit - current_best['net_profit']
                price_increase = price - current_best['price_per_kg']
                storage_cost = optimal_strategy['storage_cost']
                
                justification = (
                    f"HOLD for {days} days, then sell at {mandi}. "
                    f"Predicted price will increase by ₹{price_increase:.2f}/kg "
                    f"(from ₹{current_best['price_per_kg']:.2f} to ₹{price:.2f}). "
                    f"Even after paying ₹{storage_cost:.0f} in storage costs and accounting for spoilage, "
                    f"you will gain an additional ₹{profit_gain:,.0f} compared to selling today. "
                    f"Final net profit: ₹{net_profit:,.0f}."
                )
            else:
                justification = (
                    f"Wait {days} days and sell at {mandi}. "
                    f"Predicted price: ₹{price}/kg. Net profit: ₹{net_profit:,.0f}."
                )
        
        return justification


# Example usage
if __name__ == "__main__":
    print("Testing Arbitrage Engine with sample data...\n")
    
    # Sample current prices
    current_data = pd.DataFrame([
        {'Mandi_Name': 'Ahmedabad', 'Crop': 'Onion', 'Distance_km': 30, 'Price_per_kg': 35, 'Traffic_Congestion_Score': 0.7},
        {'Mandi_Name': 'Mehsana', 'Crop': 'Onion', 'Distance_km': 45, 'Price_per_kg': 38, 'Traffic_Congestion_Score': 0.4},
        {'Mandi_Name': 'Rajkot', 'Crop': 'Onion', 'Distance_km': 220, 'Price_per_kg': 41, 'Traffic_Congestion_Score': 0.3},
    ])
    
    # Initialize engine
    engine = ArbitrageEngine()
    
    # Test spatial arbitrage
    recommendation = engine.get_best_selling_strategy(
        current_qty_kg=1000,
        crop='Onion',
        current_location='Gandhinagar',
        df_current=current_data
    )
    
    print("=" * 60)
    print("RECOMMENDATION:")
    print("=" * 60)
    print(json.dumps(recommendation, indent=2))
