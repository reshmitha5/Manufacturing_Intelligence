import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os
import warnings
warnings.filterwarnings('ignore')

def load_data():
    df = pd.read_csv('data/processed/merged_data.csv')
    print(f"Loaded data shape: {df.shape}")
    return df

def prepare_features(df):
    # These are the input features (what the model learns from)
    feature_cols = [
        'Granulation_Time', 'Binder_Amount', 'Drying_Temp', 'Drying_Time',
        'Compression_Force', 'Machine_Speed', 'Lubricant_Conc', 'Moisture_Content',
        'avg_temperature', 'avg_pressure', 'avg_humidity', 'avg_motor_speed',
        'avg_compression_force', 'avg_flow_rate', 'total_energy_kwh',
        'avg_power_kw', 'avg_vibration', 'max_vibration',
        'temp_range', 'compression_efficiency', 'granulation_efficiency',
        'drying_efficiency', 'granulation_duration', 'drying_duration',
        'compression_duration'
    ]

    # These are the target outputs (what the model predicts)
    target_cols = [
        'quality_score',
        'yield_score',
        'total_energy_kwh',
        'carbon_emissions'
    ]

    # Only keep columns that exist in our data
    feature_cols = [col for col in feature_cols if col in df.columns]
    target_cols = [col for col in target_cols if col in df.columns]

    X = df[feature_cols]
    y = df[target_cols]

    print(f"Features: {len(feature_cols)}")
    print(f"Targets: {target_cols}")

    return X, y, feature_cols, target_cols

def train_model(X, y):
    # Split data into training and testing
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"Training samples: {len(X_train)}")
    print(f"Testing samples: {len(X_test)}")

    # Scale the features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train XGBoost model
    print("\nTraining XGBoost model...")
    xgb = XGBRegressor(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=4,
        random_state=42,
        verbosity=0
    )

    model = MultiOutputRegressor(xgb)
    model.fit(X_train_scaled, y_train)
    print("Model training complete!")

    return model, scaler, X_test_scaled, y_test

def evaluate_model(model, X_test_scaled, y_test, target_cols):
    predictions = model.predict(X_test_scaled)

    print("\n===== MODEL EVALUATION =====")
    for i, target in enumerate(target_cols):
        actual = y_test.iloc[:, i]
        predicted = predictions[:, i]

        mae = mean_absolute_error(actual, predicted)
        rmse = np.sqrt(mean_squared_error(actual, predicted))
        r2 = r2_score(actual, predicted)

        print(f"\n{target}:")
        print(f"  MAE  : {mae:.4f}")
        print(f"  RMSE : {rmse:.4f}")
        print(f"  R²   : {r2:.4f}")

    return predictions

def save_model(model, scaler, feature_cols, target_cols):
    os.makedirs('models', exist_ok=True)
    joblib.dump(model, 'models/xgboost_model.pkl')
    joblib.dump(scaler, 'models/scaler.pkl')
    joblib.dump(feature_cols, 'models/feature_cols.pkl')
    joblib.dump(target_cols, 'models/target_cols.pkl')
    print("\nModel and scaler saved to models/ folder!")

def compute_golden_signature(df, target_cols):
    # Golden signature = top 5% best performing batches
    df['composite_score'] = (
        df['quality_score'] * 0.3 +
        df['yield_score'] * 0.3 +
        (1 - df['total_energy_kwh'] / df['total_energy_kwh'].max()) * 0.2 +
        (1 - df['carbon_emissions'] / df['carbon_emissions'].max()) * 0.2
    )

    threshold = df['composite_score'].quantile(0.95)
    golden_batches = df[df['composite_score'] >= threshold]

    if len(golden_batches) == 0:
        threshold = df['composite_score'].quantile(0.80)
        golden_batches = df[df['composite_score'] >= threshold]

    golden_signature = golden_batches.mean(numeric_only=True).to_dict()

    joblib.dump(golden_signature, 'models/golden_signature.pkl')
    print(f"\nGolden Signature computed from top {len(golden_batches)} batches!")
    print(f"Golden Quality Score: {golden_signature.get('quality_score', 0):.2f}")
    print(f"Golden Yield Score: {golden_signature.get('yield_score', 0):.2f}")
    print(f"Golden Energy: {golden_signature.get('total_energy_kwh', 0):.2f} kWh")
    print(f"Golden Carbon: {golden_signature.get('carbon_emissions', 0):.2f} kg")

    return golden_signature

def run_training():
    print("=" * 40)
    print("   WEB WIZARDS - MODEL TRAINING")
    print("=" * 40)

    df = load_data()
    X, y, feature_cols, target_cols = prepare_features(df)
    model, scaler, X_test_scaled, y_test = train_model(X, y)
    evaluate_model(model, X_test_scaled, y_test, target_cols)
    save_model(model, scaler, feature_cols, target_cols)
    compute_golden_signature(df, target_cols)

    print("\n" + "=" * 40)
    print("   TRAINING COMPLETE!")
    print("=" * 40)

if __name__ == "__main__":
    run_training()