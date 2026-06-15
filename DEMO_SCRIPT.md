# WEB WIZARDS – Demo Script for Judges

## Team: WEB WIZARDS
## Track: Track B – Optimization Engine Specialization

---

## DEMO FLOW (5 minutes)

### 1. DASHBOARD (30 seconds)
- Show Golden Quality Score: 83.08
- Show Golden Yield Score: 84.86
- Show Equipment Health: 81.84 HEALTHY
- Show Pareto Front chart
- Say: "This is our real-time manufacturing dashboard powered by XGBoost AI with 99% accuracy"

### 2. PREDICT TAB (60 seconds)
- Enter batch parameters and click Predict
- Show Quality, Yield, Energy, Carbon predictions
- Show SHAP feature importance bars
- Click Accept button
- Say: "Our AI predicts all 4 objectives simultaneously with 99% accuracy"

### 3. PARETO TAB (30 seconds)
- Click on any dot on the chart
- Show the 4 optimal values appearing
- Say: "Each point is a Pareto optimal solution — operator picks which tradeoff they prefer"

### 4. GOLDEN TAB (30 seconds)
- Show golden signature parameters and radar chart
- Say: "Computed from top 5% best batches — our performance benchmark"

### 5. CARBON TAB (30 seconds)
- Click Check Carbon Budget button
- Show the green SAFE status
- Say: "We track carbon emissions in real time against a configurable budget"

### 6. ANOMALY TAB (30 seconds)
- Click Run Anomaly Detection
- Show normal or anomaly result
- Say: "Isolation Forest detects unusual energy patterns before they cause batch failures"

### 7. ROI TAB (30 seconds)
- Show Before AI vs After AI chart
- Show Rs 32L annual savings
- Say: "Our system delivers measurable ROI through energy reduction and quality improvement"

### 8. REALTIME TAB (30 seconds)
- Click Start Live Simulation
- Watch the live chart update
- Say: "This simulates real-time monitoring of a live batch in progress"

### 9. ASK AI TAB (60 seconds)
- Click suggested question about drying temperature
- Show the AI answer
- Say: "Operators can ask WHY in plain English and get expert answers instantly"

### 10. HISTORY + COMPARE (30 seconds)
- Show feedback history table
- Click Compare with Golden Signature
- Show green/yellow/red deviation indicators
- Say: "Every operator decision is logged and compared against our golden benchmark"

---

## KEY NUMBERS TO REMEMBER
- Model Accuracy: 99.1% (R2 = 0.9910)
- Golden Quality Score: 83.08
- Golden Yield Score: 84.86
- Energy Saved: 12.5% vs baseline
- Annual ROI: Rs 32 Lakhs
- Carbon Reduced: 260+ metric tons/year
- Equipment Health: 81.84/100
- API Endpoints: 10
- Dashboard Tabs: 14
- Features Built: 25+

---

## ANSWERS TO JUDGE QUESTIONS

Q: How does the Pareto front work?
A: We generate 200+ parameter combinations, predict outcomes using XGBoost, then find solutions where you cannot improve one objective without hurting another. This gives operators optimal tradeoffs to choose from.

Q: What is the Golden Signature?
A: Average parameters of top 5% best performing batches historically. It is the benchmark all new batches are compared against.

Q: How does continuous learning work?
A: Every operator feedback is stored. When negative feedback exceeds a threshold, the system automatically retrains the XGBoost model with new data.

Q: What is Human-in-the-Loop?
A: AI makes recommendations but operator has final say. They Accept, Modify or Reject any recommendation. Humans stay in control while benefiting from AI optimization.

Q: What algorithms did you use?
A: XGBoost for multi-target prediction, NSGA-II inspired Pareto optimization, Isolation Forest for anomaly detection, and Llama 3 LLM for natural language queries.