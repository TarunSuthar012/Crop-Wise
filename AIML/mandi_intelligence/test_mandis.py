from ml_arbitrage.data_loader import MandiDataLoader

loader = MandiDataLoader()
loader.load_data('dataset/commodity_price.csv')
df = loader.filter_and_process(days=90)

print('\n✨ Updated Results:')
print(f'Total mandis now: {df["Mandi_Name"].nunique()}')
print(f'Total records: {len(df)}')
print(f'\nMandis available:')
for mandi in sorted(df['Mandi_Name'].unique()):
    count = len(df[df['Mandi_Name'] == mandi])
    print(f'  - {mandi}: {count} records')
