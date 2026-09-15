"""
Analyze what data is actually available in the Kaggle dataset
"""
import pandas as pd

df = pd.read_csv('dataset/commodity_price.csv')
df.columns = df.columns.str.replace('_x0020_', '_')

print("=" * 80)
print("FULL DATASET ANALYSIS")
print("=" * 80)
print(f"Total records: {len(df):,}")
print(f"Date range: {df['Arrival_Date'].min()} to {df['Arrival_Date'].max()}")
print()

# Gujarat data
gujarat = df[df['State'].str.contains('Gujarat', case=False, na=False)]
print(f"Gujarat records: {len(gujarat):,}")
print()

# Check each target crop
for crop in ['Onion', 'Tomato', 'Potato']:
    crop_data = gujarat[gujarat['Commodity'].str.contains(crop, case=False, na=False)]
    if len(crop_data) > 0:
        print(f"{crop}:")
        print(f"  Records: {len(crop_data)}")
        print(f"  Markets: {crop_data['Market'].unique()[:10].tolist()}")
        print()

# Check all Gujarat commodities
print("All Gujarat Commodities (top 20 by count):")
print("-" * 80)
commodities = gujarat['Commodity'].value_counts().head(20)
for commodity, count in commodities.items():
    print(f"  {commodity}: {count}")

print()
print("All Gujarat Markets (top 20 by count):")
print("-" * 80)
markets = gujarat['Market'].value_counts().head(20)
for market, count in markets.items():
    print(f"  {market}: {count}")
