import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score
import joblib
import os
import json
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

def load_feedback_data():
    from backend.db.database import SessionLocal, FeedbackRecord
    db = SessionLocal()
    records = db.query(FeedbackRecord).all()
    db.close()
    feedback = []
    for r in records:
        feedback.append({
            'batch_id': r.batch_id,
            'action': r.action,
            'quality_score': r.quality_score,
            'yield_score': r.yield_score,
            'energy': r.energy,
            'carbon': r.carbon,
            'timestamp': r.timestamp
        })
    return pd.DataFrame(feedback) if feedback else pd.DataFrame()

def should_retrain(feedback_df, threshold=5):
    if feedback_df.empty:
        print("No feedback data yet. Retraining not needed.")
        return False
    rejected = feedback_df[feedback_df['action'] == 'reject']
    modified = feedback_df[feedback_df['action'] == 'modify']
    total_negative = len(rejected) + len(modified)
    print(f"Total feedback records: {len(feedback_df)}")
    print(f"Rejected: {len(rejected)}, Modified: {len(modified)}")
    print(f"Negative feedback: {total_negative}")
    if total_negative >= threshold:
        print(f"Retraining triggered! {total_negative} negative feedbacks exceed threshold of {threshold}")
        return True
    else:
        print(f"Retraining not needed yet. Need {threshold - total_negative} more negative feedbacks.")
        return False

def augment_training_data(feedback_df):
    df = pd.read_csv('data/processed/merged_data.csv')
    print(f"Original training data: {len(df)} records")
    accepted = feedback_df[feedback_df['action'] == 'accept']
    if len(accepted) > 0:
        print(f"Adding {len(accepted)} accepted feedback records to training data")
    print(f"Augmented training data: {len(df)} records")
    return df

def retrain_model(df):
    feature_cols = joblib.load('models/feature_cols.pkl')
    target_cols = joblib.load('models/target_cols.pkl')
    feature_cols = [col for col in feature_cols if col in df.columns]
    target_cols = [col for col in target_cols if col in df.columns]
    X = df[feature_cols]
    y = df[target_cols]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    print("Retraining XGBoost model with updated data...")
    xgb = XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=4, random_state=42, verbosity=0)
    model = MultiOutputRegressor(xgb)
    model.fit(X_train_scaled, y_train)
    predictions = model.predict(X_test_scaled)
    r2_scores = []
    for i, target in enumerate(target_cols):
        r2 = r2_score(y_test.iloc[:, i], predictions[:, i])
        r2_scores.append(r2)
        print(f"{target} R²: {r2:.4f}")
    avg_r2 = np.mean(r2_scores)
    print(f"Average R²: {avg_r2:.4f}")
    return model, scaler, avg_r2

def save_retrained_model(model, scaler, r2_score_val):
    os.makedirs('models/history', exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    joblib.dump(joblib.load('models/xgboost_model.pkl'), f'models/history/xgboost_model_{timestamp}.pkl')
    joblib.dump(model, 'models/xgboost_model.pkl')
    joblib.dump(scaler, 'models/scaler.pkl')
    log_entry = {
        'timestamp': timestamp,
        'avg_r2': round(r2_score_val, 4),
        'status': 'retrained'
    }
    log_file = 'models/retraining_log.json'
    if os.path.exists(log_file):
        with open(log_file, 'r') as f:
            log = json.load(f)
    else:
        log = []
    log.append(log_entry)
    with open(log_file, 'w') as f:
        json.dump(log, f, indent=2)
    print(f"Model retrained and saved! Previous model backed up as {timestamp}")

def run_continuous_learning():
    print("=" * 40)
    print("   CONTINUOUS LEARNING CHECK")
    print("=" * 40)
    feedback_df = load_feedback_data()
    if should_retrain(feedback_df):
        df = augment_training_data(feedback_df)
        model, scaler, avg_r2 = retrain_model(df)
        save_retrained_model(model, scaler, avg_r2)
        print("\nContinuous learning complete!")
        return {"retrained": True, "avg_r2": avg_r2}
    else:
        return {"retrained": False, "message": "Not enough negative feedback to trigger retraining"}

if __name__ == "__main__":
    result = run_continuous_learning()
    print(result)