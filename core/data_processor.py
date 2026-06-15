import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import joblib
import os

def load_and_merge_data():
    production = pd.read_csv('data/raw/production_data.csv')
    process = pd.read_csv('data/raw/process_data.csv')
    df = pd.merge(production, process, on='Batch_ID', how='inner')
    print(f"Merged data shape: {df.shape}")
    return df

def clean_data(df):
    # Fill missing values with column mean
    for col in df.select_dtypes(include=[np.number]).columns:
        df[col] = df[col].fillna(df[col].mean())
    # Remove outliers using IQR method
    for col in df.select_dtypes(include=[np.number]).columns:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        df = df[~((df[col] < (Q1 - 3 * IQR)) | (df[col] > (Q3 + 3 * IQR)))]
    print(f"After cleaning shape: {df.shape}")
    return df

def engineer_features(df):
    # Energy features
    df['carbon_emissions'] = df['total_energy_kwh'] * 0.233
    df['energy_efficiency'] = df['Dissolution_Rate'] / df['total_energy_kwh']
    df['energy_per_tablet'] = df['total_energy_kwh'] / 10000

    # Quality score (combining key quality metrics)
    df['quality_score'] = (
        (df['Dissolution_Rate'] / 100) * 0.3 +
        (df['Content_Uniformity'] / 100) * 0.3 +
        (1 - df['Friability'] / 2) * 0.2 +
        (df['Hardness'] / 150) * 0.2
    ) * 100

    # Yield score
    df['yield_score'] = (
        (1 - abs(df['Tablet_Weight'] - 200) / 200) * 0.4 +
        (df['Dissolution_Rate'] / 100) * 0.3 +
        (1 - df['Moisture_Content'] / 5) * 0.3
    ) * 100

    # Process efficiency
    df['process_efficiency'] = df['quality_score'] / (df['total_energy_kwh'] / 1000)

    # Temperature features
    df['temp_range'] = df['max_temperature'] - df['min_temperature']

    # Compression efficiency
    df['compression_efficiency'] = df['Hardness'] / df['Compression_Force']

    # Granulation efficiency
    df['granulation_efficiency'] = df['Dissolution_Rate'] / df['Granulation_Time']

    # Drying efficiency
    df['drying_efficiency'] = (1 - df['Moisture_Content']) / df['Drying_Time']

    # Equipment health indicators
    df['vibration_risk'] = pd.cut(df['max_vibration'],
                                   bins=[0, 3, 6, 100],
                                   labels=[0, 1, 2]).astype(float)

    # Carbon budget features
    df['carbon_per_quality'] = df['carbon_emissions'] / df['quality_score']
    df['sustainability_score'] = 100 - (df['carbon_emissions'] / df['carbon_emissions'].max() * 100)

    print(f"Features after engineering: {df.shape[1]}")
    print(f"New features added: carbon_emissions, quality_score, yield_score, and more!")
    return df

def save_processed_data(df):
    os.makedirs('data/processed', exist_ok=True)
    df.to_csv('data/processed/merged_data.csv', index=False)
    print("Processed data saved to data/processed/merged_data.csv")
    return df

def run_pipeline():
    print("Starting data pipeline...")
    df = load_and_merge_data()
    df = clean_data(df)
    df = engineer_features(df)
    df = save_processed_data(df)
    print("\nData pipeline complete!")
    print(f"Final dataset shape: {df.shape}")
    print(f"\nColumns: {list(df.columns)}")
    return df

if __name__ == "__main__":
    run_pipeline()