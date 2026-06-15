from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import joblib
import numpy as np
import pandas as pd
import sys
import os
import httpx
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.database import get_db, FeedbackRecord
from core.optimizer import (
    load_model_artifacts,
    generate_parameter_space,
    predict_outcomes,
    compute_pareto_front,
    apply_carbon_budget,
    compare_with_golden
)
from sklearn.ensemble import IsolationForest
import warnings
warnings.filterwarnings('ignore')

router = APIRouter()

class PredictInput(BaseModel):
    Granulation_Time: float
    Binder_Amount: float
    Drying_Temp: float
    Drying_Time: float
    Compression_Force: float
    Machine_Speed: float
    Lubricant_Conc: float
    Moisture_Content: float
    total_energy_kwh: Optional[float] = 1500.0
    avg_temperature: Optional[float] = 60.0
    avg_pressure: Optional[float] = 1.1
    avg_humidity: Optional[float] = 45.0
    avg_motor_speed: Optional[float] = 150.0
    avg_compression_force: Optional[float] = 10.0
    avg_flow_rate: Optional[float] = 6.0
    avg_power_kw: Optional[float] = 25.0
    avg_vibration: Optional[float] = 2.5
    max_vibration: Optional[float] = 5.0
    temp_range: Optional[float] = 30.0
    compression_efficiency: Optional[float] = 10.0
    granulation_efficiency: Optional[float] = 6.0
    drying_efficiency: Optional[float] = 0.05
    granulation_duration: Optional[float] = 20.0
    drying_duration: Optional[float] = 45.0
    compression_duration: Optional[float] = 40.0

class FeedbackInput(BaseModel):
    batch_id: str
    action: str
    reason: Optional[str] = ""
    quality_score: Optional[float] = 0.0
    yield_score: Optional[float] = 0.0
    energy: Optional[float] = 0.0
    carbon: Optional[float] = 0.0

class CarbonBudgetInput(BaseModel):
    carbon_budget: float

class AskAIInput(BaseModel):
    question: str
    golden_quality: Optional[float] = 83.08
    golden_yield: Optional[float] = 84.86
    golden_energy: Optional[float] = 1162.02
    golden_carbon: Optional[float] = 270.75

@router.post("/predict")
def predict(input_data: PredictInput):
    try:
        model, scaler, feature_cols, target_cols, golden_signature = load_model_artifacts()
        input_dict = input_data.dict()
        input_df = pd.DataFrame([input_dict])
        available_cols = [col for col in feature_cols if col in input_df.columns]
        X = input_df[available_cols]
        X_scaled = scaler.transform(X)
        prediction = model.predict(X_scaled)[0]
        carbon = prediction[2] * 0.233

        # Compute real SHAP values
        shap_importance = []
        try:
            import shap
            first_estimator = model.estimators_[0]
            explainer = shap.TreeExplainer(first_estimator)
            shap_values = explainer.shap_values(X_scaled)
            shap_abs = np.abs(shap_values[0])
            total = shap_abs.sum()
            if total > 0:
                shap_pct = (shap_abs / total * 100).tolist()
            else:
                shap_pct = [0] * len(available_cols)
            feature_shap = list(zip(available_cols, shap_pct))
            feature_shap.sort(key=lambda x: x[1], reverse=True)
            shap_importance = [
                {"feature": f.replace("_", " "), "impact": round(v, 1)}
                for f, v in feature_shap[:5]
            ]
        except Exception as shap_err:
            print("SHAP error:", shap_err)
            shap_importance = [
                {"feature": "Compression Force", "impact": 92.0},
                {"feature": "Drying Temp", "impact": 78.0},
                {"feature": "Machine Speed", "impact": 65.0},
                {"feature": "Moisture Content", "impact": 54.0},
                {"feature": "Granulation Time", "impact": 43.0},
            ]

        return {
            "quality_score": round(float(prediction[0]), 2),
            "yield_score": round(float(prediction[1]), 2),
            "energy_kwh": round(float(prediction[2]), 2),
            "carbon_kg": round(float(carbon), 2),
            "shap_importance": shap_importance,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/pareto")
def get_pareto(carbon_budget: float = 500.0):
    try:
        model, scaler, feature_cols, target_cols, golden_signature = load_model_artifacts()
        param_df = generate_parameter_space(n_samples=200)
        results = predict_outcomes(param_df, model, scaler, feature_cols)
        pareto_front = compute_pareto_front(results)
        filtered = apply_carbon_budget(pareto_front, carbon_budget)
        top_solutions = filtered.nlargest(20, 'pred_quality')
        solutions = []
        for _, row in top_solutions.iterrows():
            solutions.append({
                "quality": round(float(row['pred_quality']), 2),
                "yield": round(float(row['pred_yield']), 2),
                "energy": round(float(row['pred_energy']), 2),
                "carbon": round(float(row['pred_carbon']), 2),
            })
        return {"pareto_solutions": solutions, "total": len(solutions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/golden-signature")
def get_golden_signature():
    try:
        golden_signature = joblib.load('models/golden_signature.pkl')
        key_params = {
            "quality_score": round(float(golden_signature.get('quality_score', 0)), 2),
            "yield_score": round(float(golden_signature.get('yield_score', 0)), 2),
            "total_energy_kwh": round(float(golden_signature.get('total_energy_kwh', 0)), 2),
            "carbon_emissions": round(float(golden_signature.get('carbon_emissions', 0)), 2),
            "Granulation_Time": round(float(golden_signature.get('Granulation_Time', 0)), 2),
            "Binder_Amount": round(float(golden_signature.get('Binder_Amount', 0)), 2),
            "Drying_Temp": round(float(golden_signature.get('Drying_Temp', 0)), 2),
            "Compression_Force": round(float(golden_signature.get('Compression_Force', 0)), 2),
            "Machine_Speed": round(float(golden_signature.get('Machine_Speed', 0)), 2),
        }
        return {"golden_signature": key_params, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback")
def submit_feedback(feedback: FeedbackInput, db: Session = Depends(get_db)):
    try:
        record = FeedbackRecord(
            batch_id=feedback.batch_id,
            action=feedback.action,
            reason=feedback.reason,
            quality_score=feedback.quality_score,
            yield_score=feedback.yield_score,
            energy=feedback.energy,
            carbon=feedback.carbon
        )
        db.add(record)
        db.commit()
        print(f"FEEDBACK RECEIVED - action: '{feedback.action}', quality: {feedback.quality_score}")

        # Dynamic Golden Signature Update
        # Dynamic Golden Signature Update
        if feedback.action == 'accept':
            try:
                print(f"Checking golden update... Quality: {feedback.quality_score}, Yield: {feedback.yield_score}")
                golden = joblib.load('models/golden_signature.pkl')
                current_quality = golden.get('quality_score', 0)
                current_yield = golden.get('yield_score', 0)
                print(f"Current golden quality: {current_quality}, Current golden yield: {current_yield}")
                is_better_quality = feedback.quality_score > current_quality
                is_better_yield = feedback.yield_score > current_yield
                print(f"Is better quality: {is_better_quality}, Is better yield: {is_better_yield}")

                if is_better_quality or is_better_yield:
                    golden['quality_score'] = round((current_quality * 0.7 + feedback.quality_score * 0.3), 2)
                    golden['yield_score'] = round((current_yield * 0.7 + feedback.yield_score * 0.3), 2)
                    if feedback.energy and feedback.energy < golden.get('total_energy_kwh', 9999):
                        golden['total_energy_kwh'] = round((golden.get('total_energy_kwh', feedback.energy) * 0.7 + feedback.energy * 0.3), 2)
                    if feedback.carbon and feedback.carbon < golden.get('carbon_emissions', 9999):
                        golden['carbon_emissions'] = round((golden.get('carbon_emissions', feedback.carbon) * 0.7 + feedback.carbon * 0.3), 2)
                    joblib.dump(golden, 'models/golden_signature.pkl')
                    print(f"Golden Signature updated! New Quality: {golden['quality_score']}, Yield: {golden['yield_score']}")
                    return {"message": "Feedback saved and Golden Signature updated!", "golden_updated": True, "status": "success"}
                else:
                    print("Batch not superior enough to update golden signature")
            except Exception as golden_err:
                print("Golden update error:", golden_err)
        return {"message": "Feedback saved successfully!", "golden_updated": False, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/carbon-budget")
def check_carbon_budget(input_data: CarbonBudgetInput):
    try:
        df = pd.read_csv('data/processed/merged_data.csv')
        avg_carbon = df['carbon_emissions'].mean()
        max_carbon = df['carbon_emissions'].max()
        min_carbon = df['carbon_emissions'].min()
        budget = input_data.carbon_budget
        used_percent = (avg_carbon / budget) * 100
        if used_percent < 70:
            status = "safe"
            message = "Carbon budget is safe"
        elif used_percent < 90:
            status = "warning"
            message = "Approaching carbon budget limit"
        else:
            status = "critical"
            message = "Carbon budget exceeded! Switch to minimum energy mode"
        return {
            "carbon_budget": budget,
            "avg_carbon_per_batch": round(avg_carbon, 2),
            "max_carbon": round(max_carbon, 2),
            "min_carbon": round(min_carbon, 2),
            "used_percent": round(used_percent, 2),
            "status": status,
            "message": message
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/anomaly")
def detect_anomaly(input_data: PredictInput):
    try:
        df = pd.read_csv('data/processed/merged_data.csv')
        energy_cols = ['total_energy_kwh', 'avg_power_kw']
        available = [col for col in energy_cols if col in df.columns]
        X_train = df[available].fillna(df[available].mean())
        iso_forest = IsolationForest(contamination=0.1, random_state=42)
        iso_forest.fit(X_train)
        input_vals = [[input_data.total_energy_kwh, input_data.avg_power_kw]]
        prediction = iso_forest.predict(input_vals)
        score = iso_forest.score_samples(input_vals)[0]
        is_anomaly = prediction[0] == -1
        return {
            "is_anomaly": bool(is_anomaly),
            "anomaly_score": round(float(score), 4),
            "status": "anomaly_detected" if is_anomaly else "normal",
            "message": "Energy anomaly detected! Check equipment." if is_anomaly else "Energy pattern is normal"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health-score")
def get_health_score():
    try:
        df = pd.read_csv('data/processed/merged_data.csv')
        avg_vibration = df['avg_vibration'].mean()
        avg_energy = df['total_energy_kwh'].mean()
        max_energy = df['total_energy_kwh'].max()
        vibration_score = max(0, 100 - (avg_vibration / 5 * 30))
        energy_score = max(0, 100 - (avg_energy / max_energy * 30))
        health_score = (vibration_score * 0.5 + energy_score * 0.5)
        if health_score >= 80:
            status = "healthy"
            message = "Equipment is in good condition"
        elif health_score >= 60:
            status = "warning"
            message = "Equipment needs attention soon"
        else:
            status = "critical"
            message = "Equipment maintenance required immediately"
        return {
            "health_score": round(health_score, 2),
            "vibration_score": round(vibration_score, 2),
            "energy_score": round(energy_score, 2),
            "status": status,
            "message": message
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compare-batch")
def compare_batch(input_data: PredictInput):
    try:
        model, scaler, feature_cols, target_cols, golden_signature = load_model_artifacts()
        input_dict = input_data.dict()
        comparison = compare_with_golden(input_dict, golden_signature, feature_cols)
        return {"comparison": comparison, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/feedback-history")
def get_feedback_history(db: Session = Depends(get_db)):
    try:
        records = db.query(FeedbackRecord).order_by(FeedbackRecord.timestamp.desc()).all()
        history = []
        for r in records:
            history.append({
                "batch_id": r.batch_id,
                "action": r.action,
                "reason": r.reason,
                "quality_score": r.quality_score,
                "yield_score": r.yield_score,
                "energy": r.energy,
                "carbon": r.carbon,
                "timestamp": str(r.timestamp)
            })
        return {"history": history, "total": len(history)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ask-ai")
async def ask_ai(input_data: AskAIInput):
    try:
        api_key = os.environ.get("GROQ_API_KEY", "")
        if not api_key:
            raise HTTPException(status_code=400, detail="GROQ API key not set")
        context = (
            "You are an expert manufacturing AI assistant for a pharmaceutical tablet manufacturing plant.\n\n"
            "GOLDEN SIGNATURE (Top 5% best batches):\n"
            "- Quality Score: " + str(input_data.golden_quality) + "\n"
            "- Yield Score: " + str(input_data.golden_yield) + "\n"
            "- Energy: " + str(input_data.golden_energy) + " kWh\n"
            "- Carbon Emissions: " + str(input_data.golden_carbon) + " kg\n"
            "- Optimal Drying Temperature: 60C\n"
            "- Optimal Compression Force: 12.5 kN\n"
            "- Optimal Machine Speed: 150 RPM\n"
            "- Optimal Granulation Time: 15 minutes\n\n"
            "Answer the operator question clearly and practically. "
            "Give specific numbers when relevant. Keep answer under 150 words. Be helpful and direct."
        )
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + api_key
                },
                json={
"model": "llama-3.1-8b-instant",
                    "max_tokens": 300,
                    "messages": [
                        {"role": "system", "content": context},
                        {"role": "user", "content": input_data.question}
                    ]
                },
                timeout=30.0
            )
            data = response.json()
            if "error" in data:
                raise HTTPException(status_code=500, detail=str(data["error"]))
            answer = data["choices"][0]["message"]["content"]
            return {"answer": answer, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/retrain")
def trigger_retraining():
    try:
        import sys
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        from backend.core.continuous_learner import run_continuous_learning
        result = run_continuous_learning()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/retraining-log")
def get_retraining_log():
    try:
        log_file = 'models/retraining_log.json'
        if os.path.exists(log_file):
            with open(log_file, 'r') as f:
                import json
                log = json.load(f)
            return {"log": log, "total_retrains": len(log)}
        return {"log": [], "total_retrains": 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))