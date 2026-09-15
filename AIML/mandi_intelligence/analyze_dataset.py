import pandas as pd

# Load full dataset
df = pd.read_csv('dataset/commodity_price.csv')

print("="*70)
print("COMPLETE DATASET ANALYSIS")
print("="*70)

print(f"\n📊 TOTAL RECORDS: {len(df):,}")

# Gujarat analysis
gujarat = df[df['State'].str.contains('Gujarat', case=False, na=False)]
print(f"\n🏛️  GUJARAT RECORDS: {len(gujarat):,}")

# Available mandis in Gujarat
print(f"\n📍 GUJARAT MANDIS ({len(gujarat['Market'].unique())} unique):")
for market in sorted(gujarat['Market'].unique()):
    count = len(gujarat[gujarat['Market'] == market])
    print(f"   - {market}: {count} records")

# Crops in Gujarat
print(f"\n🌾 CROPS IN GUJARAT ({len(gujarat['Commodity'].unique())} unique):")
crop_counts = gujarat['Commodity'].value_counts()
for crop, count in crop_counts.head(20).items():
    print(f"   - {crop}: {count} records")

# Check for target mandis
target_mandis = ['Ahmedabad', 'Rajkot', 'Surat', 'Mehsana', 'Anand', 'Bharuch', 'Amreli']
print(f"\n🎯 TARGET MANDIS AVAILABILITY:")
for mandi in target_mandis:
    matches = gujarat[gujarat['Market'].str.contains(mandi, case=False, na=False)]
    if len(matches) > 0:
        print(f"   ✅ {mandi}: {len(matches)} records")
        # Show crops available
        crops = matches['Commodity'].unique()
        print(f"      Crops: {', '.join(crops[:5])}")
    else:
        print(f"   ❌ {mandi}: No data")

# Check for target crops
target_crops = ['Onion', 'Tomato', 'Potato']
print(f"\n🥔 TARGET CROPS AVAILABILITY:")
for crop in target_crops:
    matches = gujarat[gujarat['Commodity'].str.contains(crop, case=False, na=False)]
    if len(matches) > 0:
        print(f"   ✅ {crop}: {len(matches)} records")
        print(f"      Markets: {', '.join(matches['Market'].unique())}")
    else:
        print(f"   ❌ {crop}: No data")

# Final filtered count
print(f"\n🔍 AFTER FILTERING (Current Configuration):")
filtered = gujarat.copy()

# Filter by target mandis
mandi_pattern = '|'.join(target_mandis)
filtered = filtered[filtered['Market'].str.contains(mandi_pattern, case=False, na=False)]
print(f"   After mandi filter: {len(filtered)} records")

# Filter by target crops
crop_pattern = '|'.join(target_crops)
filtered = filtered[filtered['Commodity'].str.contains(crop_pattern, case=False, na=False)]
print(f"   After crop filter: {len(filtered)} records")

print(f"\n📅 DATE RANGE:")
if len(filtered) > 0:
    filtered['Arrival_Date'] = pd.to_datetime(filtered['Arrival_Date'], format='%d/%m/%Y', errors='coerce')
    print(f"   Earliest: {filtered['Arrival_Date'].min()}")
    print(f"   Latest: {filtered['Arrival_Date'].max()}")
    print(f"   Unique dates: {filtered['Arrival_Date'].nunique()}")
    
    print(f"\n📋 FINAL BREAKDOWN:")
    for mandi in filtered['Market'].unique():
        for crop in filtered['Commodity'].unique():
            subset = filtered[(filtered['Market'] == mandi) & (filtered['Commodity'] == crop)]
            if len(subset) > 0:
                print(f"   {mandi} - {crop}: {len(subset)} records")

print("\n" + "="*70)
