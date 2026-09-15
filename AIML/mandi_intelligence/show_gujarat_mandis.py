import pandas as pd

# Load dataset
df = pd.read_csv('dataset/commodity_price.csv')

# Filter for Gujarat
gujarat = df[df['State'].str.contains('Gujarat', case=False, na=False)]

print("="*70)
print("GUJARAT MANDIS AVAILABLE IN DATASET")
print("="*70)
print(f"\nTotal Gujarat records: {len(gujarat)}")
print(f"Unique mandis: {len(gujarat['Market'].unique())}\n")

# Show all mandis with record counts
print("Available Markets:")
for market in sorted(gujarat['Market'].unique()):
    count = len(gujarat[gujarat['Market'] == market])
    # Show sample commodities
    commodities = gujarat[gujarat['Market'] == market]['Commodity'].unique()
    print(f"  {market:30} - {count:3} records | Crops: {', '.join(commodities[:5])}")

# Show crops available
print(f"\n\nAvailable Crops in Gujarat ({len(gujarat['Commodity'].unique())} unique):")
crop_counts = gujarat['Commodity'].value_counts()
for crop, count in crop_counts.items():
    print(f"  {crop:30} - {count} records")
