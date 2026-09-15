"""
XGBoost Price Predictor for Mandi Arbitrage
============================================

This module trains XGBoost models to forecast future mandi prices for temporal arbitrage.
Uses time-series features and historical patterns to predict prices 1-7 days ahead.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import xgboost as xgb
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error
import pickle
from pathlib import Path


class PricePredictor:
    """
    Train and use XGBoost models to predict future mandi prices.
    Each Mandi-Crop combination gets its own model.
    """
    
    def __init__(self, models_dir: str = "ml_arbitrage/models"):
        """
        Initialize the price predictor.
        
        Args:
            models_dir: Directory to save/load trained models
        """
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(parents=True, exist_ok=True)
        
        self.models = {}  # {(mandi, crop): model}
        self.feature_importance = {}
        
    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Engineer time-series features for price prediction.
        
        Features created:
        - Temporal: day_of_week, day_of_month, week_of_year
        - Lag features: price from 1, 7, 14 days ago
        - Rolling statistics: 7-day and 14-day moving average
        - Trend: days since start
        
        Args:
            df: DataFrame with columns [Date, Mandi_Name, Crop, Price_per_kg, Distance_km, Traffic_Congestion_Score]
            
        Returns:
            DataFrame with engineered features
        """
        df = df.copy()
        df = df.sort_values(['Mandi_Name', 'Crop', 'Date']).reset_index(drop=True)
        
        # Temporal features
        df['day_of_week'] = df['Date'].dt.dayofweek
        df['day_of_month'] = df['Date'].dt.day
        df['week_of_year'] = df['Date'].dt.isocalendar().week
        df['month'] = df['Date'].dt.month
        
        # Days since start (trend)
        min_date = df['Date'].min()
        df['days_since_start'] = (df['Date'] - min_date).dt.days
        
        # Group by Mandi-Crop for time-series features
        for (mandi, crop), group in df.groupby(['Mandi_Name', 'Crop']):
            idx = group.index
            
            # Lag features (price from N days ago)
            df.loc[idx, 'price_lag_1'] = group['Price_per_kg'].shift(1)
            df.loc[idx, 'price_lag_7'] = group['Price_per_kg'].shift(7)
            df.loc[idx, 'price_lag_14'] = group['Price_per_kg'].shift(14)
            
            # Rolling statistics
            df.loc[idx, 'price_ma_7'] = group['Price_per_kg'].rolling(window=7, min_periods=1).mean()
            df.loc[idx, 'price_ma_14'] = group['Price_per_kg'].rolling(window=14, min_periods=1).mean()
            df.loc[idx, 'price_std_7'] = group['Price_per_kg'].rolling(window=7, min_periods=1).std()
            
            # Price momentum (rate of change)
            df.loc[idx, 'price_change_7d'] = group['Price_per_kg'].pct_change(periods=7)
        
        # Fill NaN values created by lag/rolling operations
        # Use modern pandas syntax (method parameter deprecated in pandas 2.0+)
        df = df.bfill()  # Backward fill
        df = df.ffill()  # Forward fill
        
        return df
    
    def train_model(
        self, 
        df: pd.DataFrame, 
        mandi: str, 
        crop: str,
        test_size: float = 0.2
    ) -> Dict:
        """
        Train XGBoost model for a specific Mandi-Crop combination.
        
        Args:
            df: DataFrame with features
            mandi: Mandi name
            crop: Crop name
            test_size: Fraction of data for testing
            
        Returns:
            Dictionary with model performance metrics
        """
        # Filter for this Mandi-Crop
        data = df[(df['Mandi_Name'] == mandi) & (df['Crop'] == crop)].copy()
        
        if len(data) < 30:
            # Silently return error for insufficient data
            return {'error': 'insufficient_data'}
        
        # Features for model
        feature_cols = [
            'Distance_km', 'Traffic_Congestion_Score',
            'day_of_week', 'day_of_month', 'week_of_year', 'month',
            'days_since_start',
            'price_lag_1', 'price_lag_7', 'price_lag_14',
            'price_ma_7', 'price_ma_14', 'price_std_7',
            'price_change_7d'
        ]
        
        X = data[feature_cols]
        y = data['Price_per_kg']
        
        # Time-series split (maintain temporal order)
        split_idx = int(len(data) * (1 - test_size))
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        # Train XGBoost model
        print(f"🤖 Training model for {mandi} - {crop}...")
        
        model = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            objective='reg:squarederror'
        )
        
        model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            verbose=False
        )
        
        # Evaluate
        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100
        r2 = model.score(X_test, y_test)  # R-squared score
        
        # Store model
        self.models[(mandi, crop)] = model
        
        # Feature importance
        importance = dict(zip(feature_cols, model.feature_importances_))
        self.feature_importance[(mandi, crop)] = importance
        
        # Save model
        model_path = self.models_dir / f"{mandi}_{crop}_model.pkl"
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        
        print(f"   ✅ MAE: ₹{mae:.2f}/kg | RMSE: ₹{rmse:.2f}/kg | MAPE: {mape:.1f}% | R2: {r2:.3f}")
        
        return {
            'mandi': mandi,
            'crop': crop,
            'train_size': len(X_train),
            'test_size': len(X_test),
            'mae': mae,
            'rmse': rmse,
            'mape': mape,
            'r2': r2,
            'model_path': str(model_path)
        }
    
    def train_all_models(self, df: pd.DataFrame) -> List[Dict]:
        """
        Train models for all Mandi-Crop combinations in the dataset.
        Automatically skips combinations with insufficient data (<30 records).
        
        Args:
            df: DataFrame with features
            
        Returns:
            List of performance metrics for each model
        """
        results = []
        
        # Get unique Mandi-Crop combinations WITH data count
        combinations = df.groupby(['Mandi_Name', 'Crop']).size().reset_index(name='count')
        combinations = combinations[['Mandi_Name', 'Crop', 'count']]
        
        # Filter out combinations with insufficient data
        sufficient_data = combinations[combinations['count'] >= 30]
        skipped = combinations[combinations['count'] < 30]
        
        print(f"\n🚀 Training {len(sufficient_data)} models...")
        if len(skipped) > 0:
            print(f"⏭️  Skipping {len(skipped)} combinations with insufficient data (<30 records)\n")
        
        for _, row in sufficient_data.iterrows():
            mandi = row['Mandi_Name']
            crop = row['Crop']
            
            result = self.train_model(df, mandi, crop)
            if 'error' not in result:  # Only add successful trainings
                results.append(result)
        
        print(f"\n✅ Trained {len(results)} models successfully")
        
        return results
    
    def predict_future_price(
        self, 
        df: pd.DataFrame,
        mandi: str,
        crop: str,
        days_ahead: int = 7
    ) -> pd.DataFrame:
        """
        Predict future prices for a specific Mandi-Crop combination.
        
        Args:
            df: Historical data with features
            mandi: Mandi name
            crop: Crop name
            days_ahead: Number of days to forecast (1-7)
            
        Returns:
            DataFrame with predictions: [Date, Predicted_Price, Day_Ahead]
        """
        key = (mandi, crop)
        
        if key not in self.models:
            # Try to load from disk
            model_path = self.models_dir / f"{mandi}_{crop}_model.pkl"
            if model_path.exists():
                with open(model_path, 'rb') as f:
                    self.models[key] = pickle.load(f)
            else:
                raise ValueError(f"No model found for {mandi}-{crop}. Train first!")
        
        model = self.models[key]
        
        # Get latest data for this Mandi-Crop
        data = df[(df['Mandi_Name'] == mandi) & (df['Crop'] == crop)].copy()
        data = data.sort_values('Date').tail(30)  # Last 30 days for context
        
        # Feature columns
        feature_cols = [
            'Distance_km', 'Traffic_Congestion_Score',
            'day_of_week', 'day_of_month', 'week_of_year', 'month',
            'days_since_start',
            'price_lag_1', 'price_lag_7', 'price_lag_14',
            'price_ma_7', 'price_ma_14', 'price_std_7',
            'price_change_7d'
        ]
        
        # Generate predictions for future days
        predictions = []
        last_date = data['Date'].max()
        
        for day in range(1, days_ahead + 1):
            future_date = last_date + timedelta(days=day)
            
            # Create feature vector for future date
            # Use latest known values and simple extrapolation
            latest = data.iloc[-1]
            
            features = {
                'Distance_km': latest['Distance_km'],
                'Traffic_Congestion_Score': latest['Traffic_Congestion_Score'],
                'day_of_week': future_date.dayofweek,
                'day_of_month': future_date.day,
                'week_of_year': future_date.isocalendar()[1],
                'month': future_date.month,
                'days_since_start': latest['days_since_start'] + day,
                'price_lag_1': latest['Price_per_kg'],  # Most recent price
                'price_lag_7': data.iloc[-min(7, len(data))]['Price_per_kg'],
                'price_lag_14': data.iloc[-min(14, len(data))]['Price_per_kg'],
                'price_ma_7': latest['price_ma_7'],
                'price_ma_14': latest['price_ma_14'],
                'price_std_7': latest['price_std_7'],
                'price_change_7d': latest['price_change_7d']
            }
            
            X_pred = pd.DataFrame([features])[feature_cols]
            predicted_price = model.predict(X_pred)[0]
            
            predictions.append({
                'Date': future_date,
                'Day_Ahead': day,
                'Predicted_Price': round(predicted_price, 2)
            })
            
            # Update data with prediction for next iteration (recursive forecasting)
            new_row = latest.copy()
            new_row['Date'] = future_date
            new_row['Price_per_kg'] = predicted_price
            data = pd.concat([data, pd.DataFrame([new_row])], ignore_index=True)
        
        return pd.DataFrame(predictions)
    
    def get_price_forecast_all_mandis(
        self, 
        df: pd.DataFrame,
        crop: str,
        days_ahead: int = 7
    ) -> Dict[str, pd.DataFrame]:
        """
        Get price forecasts for all mandis for a specific crop.
        
        Args:
            df: Historical data
            crop: Crop name
            days_ahead: Number of days to forecast
            
        Returns:
            Dictionary mapping mandi_name -> forecast DataFrame
        """
        forecasts = {}
        
        mandis = df['Mandi_Name'].unique()
        
        for mandi in mandis:
            try:
                forecast = self.predict_future_price(df, mandi, crop, days_ahead)
                forecasts[mandi] = forecast
            except Exception as e:
                # Silently skip mandis without trained models
                pass
        
        return forecasts


# Example usage
if __name__ == "__main__":
    from data_loader import MandiDataLoader
    
    # Load data
    loader = MandiDataLoader()
    try:
        loader.load_data("data/mandi_prices.csv")
        df = loader.filter_and_process(days=90)
    except:
        df = loader.generate_synthetic_data(days=90)
    
    # Train predictor
    predictor = PricePredictor()
    
    # Prepare features
    df_featured = predictor.prepare_features(df)
    
    # Train all models
    results = predictor.train_all_models(df_featured)
    
    # Test prediction
    print("\n🔮 Sample 7-day forecast for Ahmedabad - Onion:")
    forecast = predictor.predict_future_price(df_featured, 'Ahmedabad', 'Onion', days_ahead=7)
    print(forecast)
