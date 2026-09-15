"""
Data Loader for Real Kaggle Mandi Price Data
=============================================

This module loads and processes the "Daily Wholesale Commodity Prices - India Mandis" 
dataset from Kaggle/AGMARKNET. It filters data for selected mandis and prepares it 
for the ML arbitrage engine.

Dataset fields:
- Arrival_Date: Date of price record
- State: State name
- District: District name  
- Market: Mandi/Market name
- Commodity: Crop name
- Variety: Specific variety
- Min_Price: Minimum price (₹/quintal)
- Max_Price: Maximum price (₹/quintal)
- Modal_Price: Most common/modal price (₹/quintal)
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Optional


class MandiDataLoader:
    """
    Loads and processes real mandi price data from Kaggle dataset.
    """
    
    def __init__(self, data_path: Optional[str] = None):
        """
        Initialize the data loader.
        
        Args:
            data_path: Path to the Kaggle CSV file. If None, will look in data/ directory.
        """
        self.data_path = data_path
        self.raw_data = None
        self.processed_data = None
        
        # Mandi configuration with distances from Gandhinagar (Gujarat)
        # These are realistic mandis in Gujarat with actual distances
        self.mandi_config = {
            'Ahmedabad': {'distance_km': 26, 'state': 'Gujarat', 'district': 'Ahmedabad'},
            'Mehsana': {'distance_km': 62, 'state': 'Gujarat', 'district': 'Mahesana'},
            'Rajkot': {'distance_km': 237, 'state': 'Gujarat', 'district': 'Rajkot'},
            'Surat': {'distance_km': 273, 'state': 'Gujarat', 'district': 'Surat'},
            'Anand': {'distance_km': 98, 'state': 'Gujarat', 'district': 'Anand'},
            'Bharuch': {'distance_km': 211, 'state': 'Gujarat', 'district': 'Bharuch'},
            'Amreli': {'distance_km': 277, 'state': 'Gujarat', 'district': 'Amreli'}
        }
        
        # Supported crops for mandi recommendations.
        self.target_crops = [
            'Onion',
            'Potato',
            'Rice',
            'Wheat',
            'Maize',
            'Groundnut',
            'Soyabean',
        ]
        # Alias patterns allow matching AGMARKNET naming variants.
        self.crop_aliases = {
            'Onion': ['onion'],
            'Potato': ['potato'],
            'Rice': ['rice', 'paddy', 'dhan'],
            'Wheat': ['wheat'],
            'Maize': ['maize', 'corn'],
            'Groundnut': ['groundnut', 'ground nut'],
            'Soyabean': ['soyabean', 'soybean', 'soya'],
        }
        
    def load_data(self, csv_path: str) -> pd.DataFrame:
        """
        Load raw CSV data from Kaggle dataset.
        
        Args:
            csv_path: Path to the CSV file
            
        Returns:
            Raw DataFrame with all records
        """
        print(f"📊 Loading data from: {csv_path}")
        self.raw_data = pd.read_csv(csv_path)
        print(f"✅ Loaded {len(self.raw_data):,} records")
        print(f"   Columns: {list(self.raw_data.columns)}")
        return self.raw_data
    
    def filter_and_process(
        self, 
        days: int = None,  # None = use ALL available data
        end_date: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Filter data for target mandis and crops, then add features.
        
        IMPROVED: Now uses ALL available historical data by default for better training.
        
        Args:
            days: Number of days of historical data to use (None = ALL data for best accuracy)
            end_date: End date for filtering (format: 'YYYY-MM-DD'). If None, uses latest date.
            
        Returns:
            Processed DataFrame ready for model training
        """
        if self.raw_data is None:
            raise ValueError("Must call load_data() first!")
        
        df = self.raw_data.copy()
        
        # Clean URL-encoded column names (real Kaggle data has Min_x0020_Price format)
        df.columns = df.columns.str.replace('_x0020_', '_', regex=False)
        
        # Standardize column names (some datasets vary)
        column_mapping = {
            'arrival_date': 'Arrival_Date',
            'state': 'State',
            'district': 'District', 
            'market': 'Market',
            'commodity': 'Commodity',
            'variety': 'Variety',
            'min_price': 'Min_Price',
            'max_price': 'Max_Price',
            'modal_price': 'Modal_Price'
        }
        df.rename(columns={k: v for k, v in column_mapping.items() if k in df.columns}, inplace=True)
        
        # Convert date column
        date_col = 'Arrival_Date' if 'Arrival_Date' in df.columns else 'Date'
        df[date_col] = pd.to_datetime(df[date_col], format='%d/%m/%Y', errors='coerce')
        df = df.dropna(subset=[date_col])
        df.rename(columns={date_col: 'Date'}, inplace=True)
        
        # Filter for Gujarat state
        if 'State' in df.columns:
            df = df[df['State'].str.contains('Gujarat', case=False, na=False)]
        
        # NO LONGER FILTERING BY SPECIFIC MANDIS - Include ALL Gujarat mandis!
        # This expands dataset from 7 records to ~214 records
        
        commodity_col = 'Commodity' if 'Commodity' in df.columns else 'Crop'

        # Standardize market and commodity names, then retain only supported crops.
        market_col = 'Market' if 'Market' in df.columns else 'Mandi'
        df['Mandi_Name'] = df[market_col].apply(self._standardize_market_name)
        df['Crop'] = df[commodity_col].apply(self._standardize_crop_name)
        
        # Keep only records with valid mandi names
        df = df[df['Mandi_Name'].notna() & df['Crop'].notna()]
        
        # Use Modal_Price as the primary price (convert from ₹/quintal to ₹/kg)
        price_col = 'Modal_Price' if 'Modal_Price' in df.columns else 'Price'
        df[price_col] = pd.to_numeric(df[price_col], errors='coerce')  # Convert to numeric
        df = df.dropna(subset=[price_col])  # Drop invalid prices
        df['Price_per_kg'] = df[price_col] / 100  # 1 quintal = 100 kg
        
        # Filter for recent data (or ALL data if days=None)
        if end_date:
            end = pd.to_datetime(end_date)
        else:
            end = df['Date'].max()
        
        if days is not None:
            start = end - timedelta(days=days)
            df = df[(df['Date'] >= start) & (df['Date'] <= end)]
            print(f"   Using last {days} days of data")
        else:
            # Use ALL available data for maximum training accuracy
            df = df[df['Date'] <= end]
            print(f"   Using ALL available historical data")
        
        # Add mandi features - Use district-based distance estimation
        df['District'] = df['District'] if 'District' in df.columns else 'Unknown'
        df['Distance_km'] = df.apply(
            lambda row: self._estimate_distance_from_district(row.get('District', 'Unknown'), row['Mandi_Name']),
            axis=1
        )
        
        # Add traffic congestion score (synthetic but realistic)
        # Higher for closer mandis (more urban), varies by day of week
        df['Day_of_Week'] = df['Date'].dt.dayofweek
        df['Traffic_Congestion_Score'] = df.apply(
            lambda row: self._calculate_traffic_score(row['Distance_km'], row['Day_of_Week']),
            axis=1
        )
        
        # Select final columns
        self.processed_data = df[[
            'Date', 'Mandi_Name', 'Crop', 'Distance_km', 
            'Price_per_kg', 'Traffic_Congestion_Score'
        ]].copy()
        
        # Sort by date
        self.processed_data = self.processed_data.sort_values('Date').reset_index(drop=True)
        
        print(f"\n✅ Processed {len(self.processed_data):,} records")
        print(f"   Date range: {self.processed_data['Date'].min()} to {self.processed_data['Date'].max()}")
        print(f"   Mandis: {self.processed_data['Mandi_Name'].unique().tolist()}")
        print(f"   Crops: {self.processed_data['Crop'].unique().tolist()}")
        
        return self.processed_data
    
    def _standardize_market_name(self, market_name: str) -> Optional[str]:
        """Clean and standardize market name."""
        if pd.isna(market_name):
            return None
        
        # Return cleaned market name (remove extra spaces, standardize format)
        cleaned = str(market_name).strip()
        
        # Remove parenthetical suffixes for cleaner names
        # e.g., "Rajkot(Veg.Sub Yard)" -> "Rajkot"
        if '(' in cleaned:
            cleaned = cleaned.split('(')[0].strip()
        
        return cleaned if cleaned else None
    
    def _standardize_crop_name(self, commodity: str) -> Optional[str]:
        """Map various commodity formats to standard crop names."""
        if pd.isna(commodity):
            return None
        
        commodity_lower = str(commodity).strip().lower()
        for crop, aliases in self.crop_aliases.items():
            if any(alias in commodity_lower for alias in aliases):
                return crop
        return None
    
    def _calculate_traffic_score(self, distance: float, day_of_week: int) -> float:
        """
        Calculate synthetic traffic congestion score (0-1).
        
        Logic:
        - Closer mandis (urban) have higher base congestion
        - Weekdays (Mon-Fri) have higher traffic than weekends
        - Random variation added for realism
        
        Args:
            distance: Distance from base location in km
            day_of_week: 0=Monday, 6=Sunday
            
        Returns:
            Congestion score between 0 and 1
        """
        # Base congestion: higher for closer (urban) markets
        if distance < 50:
            base = 0.7
        elif distance < 150:
            base = 0.4
        else:
            base = 0.2
        
        # Weekday multiplier
        if day_of_week < 5:  # Monday-Friday
            weekday_factor = 1.2
        else:  # Weekend
            weekday_factor = 0.7
        
        # Add small random noise
        noise = np.random.uniform(-0.1, 0.1)
        
        score = base * weekday_factor + noise
        return np.clip(score, 0, 1)
    
    def _estimate_distance_from_district(self, district: str, mandi_name: str) -> float:
        """
        Estimate distance from Gandhinagar based on district.
        
        Uses approximate distances of district headquarters from Gandhinagar.
        This is a reasonable approximation when exact mandi locations are unknown.
        
        Args:
            district: District name
            mandi_name: Mandi/Market name
            
        Returns:
            Estimated distance in km
        """
        # First check if we have exact distance in config
        if mandi_name in self.mandi_config:
            return self.mandi_config[mandi_name]['distance_km']
        
        # District-to-Gandhinagar approximate distances (km)
        district_distances = {
            'Ahmedabad': 30,
            'Gandhinagar': 5,
            'Mahesana': 45,  # Also "Mehsana"
            'Mehsana': 45,
            'Rajkot': 220,
            'Surat': 265,
            'Vadodara': 100,
            'Anand': 65,
            'Bharuch': 180,
            'Amreli': 240,
            'Bhavnagar': 200,
            'Jamnagar': 330,
            'Junagadh': 330,
            'Kutch': 350,
            'Patan': 120,
            'Porbandar': 400,
            'Sabarkantha': 90,
            'Surendranagar': 160,
            'Tapi': 300,
            'Dang': 200,
            'Narmada': 150,
            'Navsari': 280,
            'Valsad': 300,
            'Medinipur': 150,  # Fallback
        }
        
        # Clean district name
        district_clean = str(district).strip() if district else 'Unknown'
        
        # Try exact match first
        if district_clean in district_distances:
            return district_distances[district_clean]
        
        # Try partial match (case-insensitive)
        district_lower = district_clean.lower()
        for dist_name, dist_km in district_distances.items():
            if dist_name.lower() in district_lower or district_lower in dist_name.lower():
                return dist_km
        
        # Default: medium distance if unknown
        return 150
    
    
    def generate_synthetic_data(self, days: int = 90) -> pd.DataFrame:
        """
        Generate synthetic data if real data is not available.
        This is a fallback option for testing.
        
        Args:
            days: Number of days to generate
            
        Returns:
            DataFrame with synthetic price data
        """
        print(f"⚠️  Generating synthetic data (fallback mode)")
        
        dates = pd.date_range(end=datetime.now(), periods=days, freq='D')
        data = []
        
        # Base prices (₹/kg)
        base_prices = {
            'Onion': 35,
            'Potato': 33,
            'Rice': 32,
            'Wheat': 28,
            'Maize': 24,
            'Groundnut': 60,
            'Soyabean': 42,
        }
        
        for date in dates:
            for mandi, config in self.mandi_config.items():
                for crop in self.target_crops:
                    # Add trend and seasonality
                    trend = (date - dates[0]).days * 0.02
                    seasonal = 5 * np.sin(2 * np.pi * (date - dates[0]).days / 30)
                    noise = np.random.normal(0, 2)
                    
                    # Price increases with distance (economic principle)
                    distance_premium = config['distance_km'] * 0.05
                    
                    price = base_prices[crop] + trend + seasonal + noise + distance_premium
                    price = max(price, base_prices[crop] * 0.8)  # Floor price
                    
                    data.append({
                        'Date': date,
                        'Mandi_Name': mandi,
                        'Crop': crop,
                        'Distance_km': config['distance_km'],
                        'Price_per_kg': round(price, 2),
                        'Traffic_Congestion_Score': self._calculate_traffic_score(
                            config['distance_km'], 
                            date.dayofweek
                        )
                    })
        
        self.processed_data = pd.DataFrame(data)
        print(f"✅ Generated {len(self.processed_data):,} synthetic records")
        
        return self.processed_data
    
    def get_summary_stats(self) -> Dict:
        """Get summary statistics of the processed data."""
        if self.processed_data is None:
            return {}
        
        df = self.processed_data
        
        stats = {
            'total_records': len(df),
            'date_range': {
                'start': str(df['Date'].min()),
                'end': str(df['Date'].max()),
                'days': (df['Date'].max() - df['Date'].min()).days
            },
            'mandis': df['Mandi_Name'].unique().tolist(),
            'crops': df['Crop'].unique().tolist(),
            'price_stats': df.groupby('Crop')['Price_per_kg'].agg(['min', 'max', 'mean']).to_dict()
        }
        
        return stats
    
    def save_processed_data(self, output_path: str):
        """Save processed data to CSV."""
        if self.processed_data is not None:
            self.processed_data.to_csv(output_path, index=False)
            print(f"💾 Saved processed data to: {output_path}")


# Example usage
if __name__ == "__main__":
    loader = MandiDataLoader()
    
    # Try to load real data (update path as needed)
    try:
        loader.load_data("data/mandi_prices.csv")
        df = loader.filter_and_process(days=90)
    except FileNotFoundError:
        print("Real data not found, generating synthetic data...")
        df = loader.generate_synthetic_data(days=90)
    
    # Show summary
    print("\n📈 Summary Statistics:")
    import json
    print(json.dumps(loader.get_summary_stats(), indent=2))
    
    # Save processed data
    loader.save_processed_data("ml_arbitrage/processed_mandi_data.csv")
