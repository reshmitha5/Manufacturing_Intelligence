import numpy as np
import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

def load_model_artifacts():
    model = joblib.load('models/xgboost_model.pkl')
    scaler = joblib.load('models/scaler.pkl')
    feature_cols = joblib.load('models/feature_cols.pkl')
    target_cols = joblib.load('models/target_cols.pkl')
    golden_signature = joblib.load('models/golden_signature.pkl')
    return model, scaler, feature_cols, target_cols, golden_signature

def generate_parameter_space(n_samples=500):
    np.random.seed(42)
    params = {
        'Granulation_Time': np.random.uniform(9, 27, n_samples),
        'Binder_Amount': np.random.uniform(5.8, 13.5, n_samples),
        'Drying_Temp': np.random.uniform(42, 73, n_samples),
        'Drying_Time': np.random.uniform(15, 48, n_samples),
        'Compression_Force': np.random.uniform(4.5, 18, n_samples),
        'Machine_Speed': np.random.uniform(92, 280, n_samples),
        'Lubricant_Conc': np.random.uniform(0.4, 2.8, n_samples),
        'Moisture_Content': np.random.uniform(0.2, 3.6, n_samples),
        'avg_temperature': np.random.uniform(40, 75, n_samples),
        'avg_pressure': np.random.uniform(0.8, 1.4, n_samples),
        'avg_humidity': np.random.uniform(25, 65, n_samples),
        'avg_motor_speed': np.random.uniform(80, 220, n_samples),
        'avg_compression_force': np.random.uniform(4, 18, n_samples),
        'avg_flow_rate': np.random.uniform(3, 10, n_samples),
        'total_energy_kwh': np.random.uniform(800, 2500, n_samples),
        'avg_power_kw': np.random.uniform(10, 55, n_samples),
        'avg_vibration': np.random.uniform(1, 5, n_samples),
        'max_vibration': np.random.uniform(4, 10, n_samples),
        'temp_range': np.random.uniform(20, 50, n_samples),
        'compression_efficiency': np.random.uniform(3, 25, n_samples),
        'granulation_efficiency': np.random.uniform(3, 12, n_samples),
        'drying_efficiency': np.random.uniform(0.01, 0.2, n_samples),
        'granulation_duration': np.random.uniform(15, 30, n_samples),
        'drying_duration': np.random.uniform(40, 50, n_samples),
        'compression_duration': np.random.uniform(30, 50, n_samples),
    }
    return pd.DataFrame(params)

def predict_outcomes(param_df, model, scaler, feature_cols):
    X = param_df[feature_cols]
    X_scaled = scaler.transform(X)
    predictions = model.predict(X_scaled)
    results = param_df.copy()
    results['pred_quality'] = predictions[:, 0]
    results['pred_yield'] = predictions[:, 1]
    results['pred_energy'] = predictions[:, 2]
    results['pred_carbon'] = predictions[:, 3]
    return results

def compute_pareto_front(results):
    # Pareto front = solutions where you cannot improve one goal without hurting another
    quality = results['pred_quality'].values
    yield_s = results['pred_yield'].values
    energy = results['pred_energy'].values
    carbon = results['pred_carbon'].values

    pareto_mask = []
    n = len(results)

    for i in range(n):
        dominated = False
        for j in range(n):
            if i == j:
                continue
            # Check if solution j dominates solution i
            if (quality[j] >= quality[i] and
                yield_s[j] >= yield_s[i] and
                energy[j] <= energy[i] and
                carbon[j] <= carbon[i] and
                (quality[j] > quality[i] or
                 yield_s[j] > yield_s[i] or
                 energy[j] < energy[i] or
                 carbon[j] < carbon[i])):
                dominated = True
                break
        pareto_mask.append(not dominated)

    pareto_front = results[pareto_mask].copy()
    print(f"Pareto front contains {len(pareto_front)} solutions")
    return pareto_front

def apply_carbon_budget(pareto_front, carbon_budget):
    # Filter solutions that fit within the carbon budget
    filtered = pareto_front[pareto_front['pred_carbon'] <= carbon_budget]
    if len(filtered) == 0:
        print("Warning: No solutions within carbon budget. Returning closest solutions.")
        filtered = pareto_front.nsmallest(5, 'pred_carbon')
    return filtered

def compare_with_golden(batch_params, golden_signature, feature_cols):
    comparison = {}
    for col in feature_cols:
        if col in golden_signature:
            live_val = batch_params.get(col, 0)
            golden_val = golden_signature.get(col, 0)
            if golden_val != 0:
                deviation = ((live_val - golden_val) / golden_val) * 100
            else:
                deviation = 0
            if abs(deviation) <= 5:
                status = 'green'
            elif abs(deviation) <= 15:
                status = 'yellow'
            else:
                status = 'red'
            comparison[col] = {
                'live': round(live_val, 3),
                'golden': round(golden_val, 3),
                'deviation_pct': round(deviation, 2),
                'status': status
            }
    return comparison

def run_optimization(carbon_budget=500):
    print("=" * 40)
    print("   WEB WIZARDS - OPTIMIZATION ENGINE")
    print("=" * 40)

    print("\nLoading model...")
    model, scaler, feature_cols, target_cols, golden_signature = load_model_artifacts()

    print("Generating parameter search space...")
    param_df = generate_parameter_space(n_samples=300)

    print("Predicting outcomes...")
    results = predict_outcomes(param_df, model, scaler, feature_cols)

    print("Computing Pareto front...")
    pareto_front = compute_pareto_front(results)

    print(f"\nApplying carbon budget of {carbon_budget} kg...")
    filtered = apply_carbon_budget(pareto_front, carbon_budget)

    print(f"\nTop 5 Pareto Optimal Solutions:")
    print("-" * 40)
    top5 = filtered.nlargest(5, 'pred_quality')[
        ['pred_quality', 'pred_yield', 'pred_energy', 'pred_carbon']
    ]
    print(top5.round(2).to_string())

    print("\n" + "=" * 40)
    print("   OPTIMIZATION COMPLETE!")
    print("=" * 40)

    return pareto_front

if __name__ == "__main__":
    run_optimization(carbon_budget=500)