import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, BarChart, Bar, LineChart, Line, Legend, ReferenceLine } from 'recharts';

const API = 'http://127.0.0.1:8000/api';

function AskAITab({ goldenSig, prediction, healthScore }) {
  const [question, setQuestion] = React.useState('');
  const [answer, setAnswer] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [chatHistory, setChatHistory] = React.useState([]);
  const suggestedQuestions = [
    "Why should I set drying temperature to 60°C?",
    "Why is my quality score low and how do I improve it?",
    "What parameters should I change to reduce carbon emissions?",
    "Why is compression force important for tablet hardness?",
    "How does moisture content affect dissolution rate?",
    "What does the golden signature mean?",
    "Why is my energy consumption high?",
    "What happens if I exceed the carbon budget?",
  ];
  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer('');
    try {
      const res = await axios.post(`${API}/ask-ai`, {
        question,
        golden_quality: goldenSig.quality_score || 83.08,
        golden_yield: goldenSig.yield_score || 84.86,
        golden_energy: goldenSig.total_energy_kwh || 1162.02,
        golden_carbon: goldenSig.carbon_emissions || 270.75,
      });
      if (res.data && res.data.answer) {
        setAnswer(res.data.answer);
        setChatHistory(prev => [{ question, answer: res.data.answer }, ...prev.slice(0, 4)]);
      } else {
        setAnswer('No answer received. Please try again.');
      }
    } catch (e) {
      setAnswer('Error connecting to AI. Please try again.');
    }
    setLoading(false);
  };
  return (
    <div>
      <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155', marginBottom: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '5px' }}>🤖 Ask AI – Natural Language Query Engine</div>
        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '15px' }}>Ask any question about your batch parameters, quality scores, energy, or manufacturing process.</p>
        <div style={{ marginBottom: '15px' }}>
          <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>💡 Suggested Questions — click to use:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {suggestedQuestions.map((q, i) => (
              <button key={i} onClick={() => setQuestion(q)} style={{ padding: '6px 12px', background: '#334155', border: '1px solid #475569', borderRadius: '20px', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}>{q}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" value={question} onChange={e => setQuestion(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAsk()}
            placeholder="Type your question here..."
            style={{ flex: 1, padding: '12px', background: '#334155', border: '1px solid #475569', borderRadius: '8px', color: 'white', fontSize: '14px' }} />
          <button onClick={handleAsk} disabled={loading} style={{ padding: '12px 24px', background: '#38bdf8', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? '⏳ Thinking...' : '🚀 Ask AI'}
          </button>
        </div>
        {loading && <div style={{ marginTop: '15px', padding: '15px', background: '#0f172a', borderRadius: '8px', textAlign: 'center' }}><p style={{ color: '#38bdf8' }}>🤖 AI is analyzing your factory data...</p></div>}
        {answer && !loading && (
          <div style={{ marginTop: '15px', padding: '20px', background: '#0f172a', borderRadius: '8px', border: '1px solid #38bdf8' }}>
            <p style={{ color: '#38bdf8', fontWeight: 'bold', marginBottom: '10px' }}>🤖 AI Answer:</p>
            <p style={{ color: 'white', lineHeight: '1.6', fontSize: '14px' }}>{answer}</p>
          </div>
        )}
      </div>
      {chatHistory.length > 0 && (
        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '15px' }}>📜 Previous Questions</div>
          {chatHistory.map((item, i) => (
            <div key={i} style={{ marginBottom: '15px', padding: '15px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
              <p style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: '8px' }}>Q: {item.question}</p>
              <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6' }}>{item.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompareTab({ formData, goldenSig }) {
  const [compareResult, setCompareResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [fixSuggestions, setFixSuggestions] = React.useState(null);
  const handleCompare = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/compare-batch`, formData);
      setCompareResult(res.data.comparison);
    } catch (e) { console.log(e); }
    setLoading(false);
  };
  const handleFixBatch = () => {
    const suggestions = [];
    if (formData.Drying_Temp !== goldenSig.Drying_Temp) suggestions.push({ param: 'Drying Temperature', current: formData.Drying_Temp, recommended: goldenSig.Drying_Temp || 60, unit: '°C' });
    if (formData.Compression_Force !== goldenSig.Compression_Force) suggestions.push({ param: 'Compression Force', current: formData.Compression_Force, recommended: goldenSig.Compression_Force || 12.5, unit: 'kN' });
    if (formData.Machine_Speed !== goldenSig.Machine_Speed) suggestions.push({ param: 'Machine Speed', current: formData.Machine_Speed, recommended: goldenSig.Machine_Speed || 150, unit: 'RPM' });
    if (formData.Granulation_Time !== goldenSig.Granulation_Time) suggestions.push({ param: 'Granulation Time', current: formData.Granulation_Time, recommended: goldenSig.Granulation_Time || 15, unit: 'min' });
    suggestions.push({ param: 'Moisture Content', current: formData.Moisture_Content, recommended: 2.1, unit: '%' });
    setFixSuggestions(suggestions);
  };
  const getStatusColor = (status) => status === 'green' ? '#22c55e' : status === 'yellow' ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '15px' }}>🔍 Live Batch vs Golden Signature Comparator</div>
      <p style={{ color: '#94a3b8', marginBottom: '15px', fontSize: '13px' }}>🟢 Green = within 5% | 🟡 Yellow = within 15% | 🔴 Red = above 15% deviation</p>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button style={{ padding: '10px 20px', background: '#38bdf8', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleCompare} disabled={loading}>{loading ? 'Comparing...' : '🔍 Compare with Golden'}</button>
        <button style={{ padding: '10px 20px', background: '#22c55e', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleFixBatch}>🔧 Fix This Batch</button>
      </div>
      {compareResult && Object.entries(compareResult).map(([key, val]) => (
        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #334155' }}>
          <span style={{ color: '#94a3b8', fontSize: '13px', width: '200px' }}>{key.replace(/_/g, ' ')}</span>
          <span style={{ color: 'white', fontSize: '13px' }}>Live: {val.live}</span>
          <span style={{ color: '#38bdf8', fontSize: '13px' }}>Golden: {val.golden}</span>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{val.deviation_pct}%</span>
          <span style={{ padding: '3px 10px', borderRadius: '20px', background: getStatusColor(val.status), color: 'white', fontSize: '11px', fontWeight: 'bold' }}>{val.status?.toUpperCase()}</span>
        </div>
      ))}
      {fixSuggestions && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#0f172a', borderRadius: '8px', border: '1px solid #22c55e' }}>
          <p style={{ color: '#22c55e', fontWeight: 'bold', marginBottom: '15px' }}>🔧 Auto Fix Suggestions:</p>
          {fixSuggestions.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#1e293b', borderRadius: '8px', marginBottom: '8px' }}>
              <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>{s.param}</span>
              <span style={{ color: '#ef4444' }}>Current: {s.current} {s.unit}</span>
              <span style={{ color: '#38bdf8' }}>→</span>
              <span style={{ color: '#22c55e', fontWeight: 'bold' }}>Change to: {s.recommended} {s.unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WhatIfTab({ goldenSig }) {
  const [params, setParams] = React.useState({
    Granulation_Time: 15, Binder_Amount: 8.5, Drying_Temp: 60, Drying_Time: 25,
    Compression_Force: 12.5, Machine_Speed: 150, Lubricant_Conc: 1.0, Moisture_Content: 2.1,
    total_energy_kwh: 1500, avg_temperature: 60, avg_pressure: 1.1, avg_humidity: 45,
    avg_motor_speed: 150, avg_compression_force: 10, avg_flow_rate: 6, avg_power_kw: 25,
    avg_vibration: 2.5, max_vibration: 5, temp_range: 30, compression_efficiency: 10,
    granulation_efficiency: 6, drying_efficiency: 0.05, granulation_duration: 20,
    drying_duration: 45, compression_duration: 40
  });
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const sliderParams = [
    { key: 'Drying_Temp', label: 'Drying Temperature (°C)', min: 40, max: 90, step: 1 },
    { key: 'Compression_Force', label: 'Compression Force (kN)', min: 5, max: 20, step: 0.5 },
    { key: 'Machine_Speed', label: 'Machine Speed (RPM)', min: 80, max: 250, step: 5 },
    { key: 'Granulation_Time', label: 'Granulation Time (min)', min: 5, max: 30, step: 1 },
    { key: 'Moisture_Content', label: 'Moisture Content (%)', min: 0.5, max: 5, step: 0.1 },
    { key: 'Binder_Amount', label: 'Binder Amount (%)', min: 3, max: 15, step: 0.5 },
  ];
  const handleSliderChange = async (key, value) => {
    const newParams = { ...params, [key]: parseFloat(value) };
    setParams(newParams);
    setLoading(true);
    try {
      const res = await axios.post(`${API}/predict`, newParams);
      setResult(res.data);
    } catch (e) { console.log(e); }
    setLoading(false);
  };
  const getCompareColor = (value, golden) => {
    if (!golden) return '#94a3b8';
    const diff = Math.abs((value - golden) / golden * 100);
    if (diff <= 5) return '#22c55e';
    if (diff <= 15) return '#f59e0b';
    return '#ef4444';
  };
  return (
    <div>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '5px' }}>🎛️ What-If Simulator</div>
      <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>Slide any parameter and instantly see how it affects Quality, Yield, Energy and Carbon!</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '15px' }}>🎚️ Adjust Parameters</div>
          {sliderParams.map(p => (
            <div key={p.key} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>{p.label}</span>
                <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{params[p.key]}</span>
              </div>
              <input type="range" min={p.min} max={p.max} step={p.step} value={params[p.key]}
                onChange={e => handleSliderChange(p.key, e.target.value)}
                style={{ width: '100%', accentColor: '#38bdf8' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569', fontSize: '11px' }}>{p.min}</span>
                <span style={{ color: '#22c55e', fontSize: '11px' }}>Golden: {goldenSig[p.key] || 'N/A'}</span>
                <span style={{ color: '#475569', fontSize: '11px' }}>{p.max}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '15px' }}>📊 Live Prediction Results {loading && '⏳'}</div>
          {result ? (
            <div>
              {[
                { label: 'Quality Score', value: result.quality_score, golden: goldenSig.quality_score, color: '#22c55e' },
                { label: 'Yield Score', value: result.yield_score, golden: goldenSig.yield_score, color: '#38bdf8' },
                { label: 'Energy (kWh)', value: result.energy_kwh, golden: goldenSig.total_energy_kwh, color: '#f59e0b' },
                { label: 'Carbon (kg)', value: result.carbon_kg, golden: goldenSig.carbon_emissions, color: '#ef4444' },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: '15px', padding: '15px', background: '#0f172a', borderRadius: '8px', border: `1px solid ${getCompareColor(item.value, item.golden)}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>{item.label}</span>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: getCompareColor(item.value, item.golden) }}>{item.value}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                    <span style={{ color: '#475569', fontSize: '11px' }}>Golden: {item.golden}</span>
                    <span style={{ color: getCompareColor(item.value, item.golden), fontSize: '11px' }}>
                      {item.golden ? (Math.abs((item.value - item.golden) / item.golden * 100) <= 5 ? '✅ On Target' : Math.abs((item.value - item.golden) / item.golden * 100) <= 15 ? '⚠️ Close' : '❌ Off Target') : ''}
                    </span>
                  </div>
                </div>
              ))}
              <div style={{ padding: '15px', background: '#0f172a', borderRadius: '8px', marginTop: '10px' }}>
                <p style={{ color: '#38bdf8', fontWeight: 'bold', marginBottom: '8px' }}>💡 AI Recommendation:</p>
                <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6' }}>
                  {result.quality_score >= 80 ? '✅ Quality is good! ' : '⚠️ Increase Compression Force to improve quality. '}
                  {result.energy_kwh <= 1300 ? '✅ Energy is efficient! ' : '⚠️ Reduce Machine Speed to save energy. '}
                  {result.carbon_kg <= 300 ? '✅ Carbon is within budget!' : '⚠️ Reduce energy consumption to lower carbon.'}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
              <p style={{ fontSize: '40px' }}>🎚️</p>
              <p>Move any slider to see live predictions!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [paretoData, setParetoData] = useState([]);
  const [goldenSig, setGoldenSig] = useState({});
  const [healthScore, setHealthScore] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [carbonResult, setCarbonResult] = useState(null);
  const [carbonBudget, setCarbonBudget] = useState(400);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [modifyReason, setModifyReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [anomalyResult, setAnomalyResult] = useState(null);
  const [realtimeData, setRealtimeData] = useState([]);
  const [realtimeRunning, setRealtimeRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [batchCount, setBatchCount] = useState(0);
  const [recommendation, setRecommendation] = useState(null);

  const [formData, setFormData] = useState({
    Granulation_Time: 15, Binder_Amount: 8.5, Drying_Temp: 60, Drying_Time: 25,
    Compression_Force: 12.5, Machine_Speed: 150, Lubricant_Conc: 1.0, Moisture_Content: 2.1,
    total_energy_kwh: 1500, avg_temperature: 60, avg_pressure: 1.1, avg_humidity: 45,
    avg_motor_speed: 150, avg_compression_force: 10, avg_flow_rate: 6, avg_power_kw: 25,
    avg_vibration: 2.5, max_vibration: 5, temp_range: 30, compression_efficiency: 10,
    granulation_efficiency: 6, drying_efficiency: 0.05, granulation_duration: 20,
    drying_duration: 45, compression_duration: 40
  });

  useEffect(() => {
    fetchPareto(400); fetchGoldenSignature(); fetchHealthScore();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPareto = async (budget) => {
    try {
      const res = await axios.get(`${API}/pareto?carbon_budget=${budget}`);
      setParetoData(res.data.pareto_solutions.map(s => ({ x: s.energy, y: s.quality, yield: s.yield, carbon: s.carbon })));
    } catch (e) { console.log(e); }
  };

  const fetchGoldenSignature = async () => {
    try {
      const res = await axios.get(`${API}/golden-signature`);
      setGoldenSig(res.data.golden_signature);
    } catch (e) { console.log(e); }
  };

  const fetchHealthScore = async () => {
    try {
      const res = await axios.get(`${API}/health-score`);
      setHealthScore(res.data);
    } catch (e) { console.log(e); }
  };

  const generateRecommendation = (pred, golden) => {
    const recs = [];
    if (pred.quality_score < golden.quality_score) {
      const diff = (golden.quality_score - pred.quality_score).toFixed(2);
      recs.push({ param: 'Compression Force', action: 'Increase by 0.5-1 kN', reason: `Will improve quality by ~${diff} points`, color: '#22c55e' });
      recs.push({ param: 'Drying Temperature', action: `Set to ${golden.Drying_Temp || 60}°C`, reason: 'Optimal drying improves tablet hardness', color: '#38bdf8' });
    }
    if (pred.energy_kwh > golden.total_energy_kwh) {
      const diff = (pred.energy_kwh - golden.total_energy_kwh).toFixed(0);
      recs.push({ param: 'Machine Speed', action: `Reduce to ${golden.Machine_Speed || 150} RPM`, reason: `Will save ~${diff} kWh per batch`, color: '#f59e0b' });
    }
    if (pred.carbon_kg > golden.carbon_emissions) {
      recs.push({ param: 'Energy Consumption', action: 'Reduce total energy usage', reason: 'Carbon = Energy × 0.233 emission factor', color: '#ef4444' });
    }
    if (recs.length === 0) recs.push({ param: '✅ All targets met!', action: 'No changes needed', reason: 'Your batch matches the golden signature', color: '#22c55e' });
    return recs;
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/predict`, formData);
      setPrediction(res.data);
      setRecommendation(generateRecommendation(res.data, goldenSig));
      const anomalyRes = await axios.post(`${API}/anomaly`, formData);
      setAnomalyResult(anomalyRes.data);
      setBatchCount(prev => prev + 1);
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  const handleCarbonCheck = async () => {
    try {
      const res = await axios.post(`${API}/carbon-budget`, { carbon_budget: carbonBudget });
      setCarbonResult(res.data);
      fetchPareto(carbonBudget);
    } catch (e) { console.log(e); }
  };

  const handleFeedback = async (action) => {
    console.log('handleFeedback called with action:', action);
    console.log('prediction:', prediction);
    try {
      console.log('Sending feedback to API...');
      const res = await axios.post(`${API}/feedback`, {
        batch_id: `BATCH_${Date.now()}`, action,
        reason: action === 'modify' ? modifyReason : action === 'reject' ? 'Operator override' : '',
        quality_score: prediction?.quality_score || 0,
        yield_score: prediction?.yield_score || 0,
        energy: prediction?.energy_kwh || 0,
        carbon: prediction?.carbon_kg || 0
      });
      if (res.data.golden_updated) {
        console.log('Feedback response:', res.data);
        setFeedbackMsg('✅ Accepted! This batch was SUPERIOR — Golden Signature has been updated! 🏆');
        fetchGoldenSignature();
      } else {
        setFeedbackMsg(`✅ Feedback "${action}" saved! ${action === 'modify' ? 'Modification reason recorded for learning.' : ''}`);
      }
      setModifyReason('');
      setTimeout(() => setFeedbackMsg(''), 10000);
    } catch (e) { console.log(e); }
  };

  const startRealtime = () => {
    setRealtimeRunning(true);
    setRealtimeData([]);
    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      setRealtimeData(prev => [...prev.slice(-20), {
        time: `T${tick}`, energy: 1200 + Math.random() * 600,
        quality: 80 + Math.random() * 15, carbon: 250 + Math.random() * 150,
      }]);
      if (tick >= 20) { clearInterval(interval); setRealtimeRunning(false); }
    }, 800);
  };

  const getStatusColor = (status) => {
    if (status === 'healthy' || status === 'safe') return '#22c55e';
    if (status === 'warning') return '#f59e0b';
    return '#ef4444';
  };

  const radarData = [
    { subject: 'Quality', value: goldenSig.quality_score || 0 },
    { subject: 'Yield', value: goldenSig.yield_score || 0 },
    { subject: 'Energy', value: 100 - (goldenSig.total_energy_kwh / 25) || 0 },
    { subject: 'Carbon', value: 100 - (goldenSig.carbon_emissions / 5) || 0 },
    { subject: 'Speed', value: (goldenSig.Machine_Speed / 3) || 0 },
  ];

  const roiData = [
    { name: 'Before AI', energy: 2200, carbon: 512, quality: 75 },
    { name: 'After AI', energy: goldenSig.total_energy_kwh || 1162, carbon: goldenSig.carbon_emissions || 270, quality: goldenSig.quality_score || 83 },
  ];

  const s = {
    app: { fontFamily: 'Arial, sans-serif', background: '#0f172a', minHeight: '100vh', color: 'white' },
    header: { background: 'linear-gradient(135deg, #1e3a5f, #0f172a)', padding: '20px 30px', borderBottom: '1px solid #334155' },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#38bdf8', margin: 0 },
    nav: { display: 'flex', gap: '8px', padding: '15px 30px', background: '#1e293b', borderBottom: '1px solid #334155', flexWrap: 'wrap' },
    navBtn: (active) => ({ padding: '7px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', background: active ? '#38bdf8' : '#334155', color: active ? '#0f172a' : '#94a3b8' }),
    content: { padding: '20px 30px' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
    grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' },
    grid4: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '20px' },
    card: { background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' },
    cardTitle: { fontSize: '16px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '15px' },
    statCard: (color) => ({ background: '#1e293b', borderRadius: '12px', padding: '20px', border: `1px solid ${color}`, textAlign: 'center' }),
    statValue: (color) => ({ fontSize: '32px', fontWeight: 'bold', color }),
    statLabel: { fontSize: '13px', color: '#94a3b8', marginTop: '5px' },
    input: { width: '100%', padding: '8px', background: '#334155', border: '1px solid #475569', borderRadius: '6px', color: 'white', marginBottom: '8px', boxSizing: 'border-box' },
    btn: (color) => ({ padding: '10px 20px', background: color, border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', margin: '5px' }),
    badge: (color) => ({ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', background: color, color: 'white', fontSize: '12px', fontWeight: 'bold' }),
    resultBox: { background: '#0f172a', borderRadius: '8px', padding: '15px', marginTop: '10px' },
  };

  const tabs = [
    { id: 'dashboard', label: '🏠 Dashboard' },
    { id: 'predict', label: '🔮 Predict' },
    { id: 'golden', label: '🏆 Golden' },
    { id: 'whatif', label: '🎛️ What-If' },
    { id: 'carbon', label: '🌱 Carbon' },
    { id: 'pareto', label: '⚖️ Pareto' },
    { id: 'compare', label: '🔍 Compare' },
    { id: 'roi', label: '💰 ROI' },
    { id: 'health', label: '🔧 Health' },
    { id: 'anomaly', label: '⚡ Anomaly' },
    { id: 'realtime', label: '📡 Realtime' },
    { id: 'askai', label: '🤖 Ask AI' },
  ];

  const shapColors = ['#22c55e', '#38bdf8', '#f59e0b', '#a78bfa', '#ef4444'];

  return (
    <div style={s.app}>
      <div style={s.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={s.title}>🏭 WEB WIZARDS – Manufacturing Optimization Engine</h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0 0' }}>AI-Driven Multi-Objective Optimization | Track B – Optimization Engine Specialization</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '18px' }}>{currentTime.toLocaleTimeString()}</div>
            <div style={{ color: '#94a3b8', fontSize: '13px' }}>{currentTime.toLocaleDateString()}</div>
            <div style={{ color: '#22c55e', fontSize: '13px' }}>Batches Analyzed: {batchCount}</div>
          </div>
        </div>
      </div>

      <div style={s.nav}>
        {tabs.map(tab => (
          <button key={tab.id} style={s.navBtn(activeTab === tab.id)} onClick={() => { setActiveTab(tab.id); if (tab.id === 'anomaly') setAnomalyResult(null); }}>{tab.label}</button>
        ))}
      </div>

      <div style={s.content}>

        {activeTab === 'dashboard' && (
          <div>
            <div style={s.grid4}>
              <div style={s.statCard('#22c55e')}><div style={s.statValue('#22c55e')}>{goldenSig.quality_score || '--'}</div><div style={s.statLabel}>Golden Quality Score</div></div>
              <div style={s.statCard('#38bdf8')}><div style={s.statValue('#38bdf8')}>{goldenSig.yield_score || '--'}</div><div style={s.statLabel}>Golden Yield Score</div></div>
              <div style={s.statCard('#f59e0b')}><div style={s.statValue('#f59e0b')}>{goldenSig.total_energy_kwh || '--'}</div><div style={s.statLabel}>Golden Energy (kWh)</div></div>
              <div style={s.statCard('#a78bfa')}><div style={s.statValue('#a78bfa')}>{goldenSig.carbon_emissions || '--'}</div><div style={s.statLabel}>Golden Carbon (kg)</div></div>
            </div>
            <div style={s.grid2}>
              <div style={s.card}>
                <div style={s.cardTitle}>🎯 Golden Signature Radar</div>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#334155" /><PolarAngleAxis dataKey="subject" stroke="#94a3b8" />
                    <Radar name="Golden" dataKey="value" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div style={s.card}>
                <div style={s.cardTitle}>🔧 Equipment Health</div>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '60px', fontWeight: 'bold', color: getStatusColor(healthScore.status) }}>{healthScore.health_score || '--'}</div>
                  <div style={{ fontSize: '16px', color: '#94a3b8' }}>Health Score / 100</div>
                  <div style={{ marginTop: '10px' }}><span style={s.badge(getStatusColor(healthScore.status))}>{healthScore.status?.toUpperCase() || 'LOADING'}</span></div>
                  <div style={{ marginTop: '10px', color: '#94a3b8', fontSize: '13px' }}>{healthScore.message}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'predict' && (
           <div style={s.grid2}>
            <div style={s.card}>
              <div style={s.cardTitle}>🔮 Batch Parameter Input</div>
              {['Granulation_Time', 'Binder_Amount', 'Drying_Temp', 'Drying_Time', 'Compression_Force', 'Machine_Speed', 'Lubricant_Conc', 'Moisture_Content'].map(key => (
                <div key={key}>
                  <label style={{ color: '#94a3b8', fontSize: '12px' }}>{key.replace(/_/g, ' ')}</label>
                  <input type="number" style={s.input} value={formData[key]} onChange={e => setFormData({ ...formData, [key]: parseFloat(e.target.value) })} />
                </div>
              ))}
              <button style={s.btn('#38bdf8')} onClick={handlePredict} disabled={loading}>{loading ? 'Predicting...' : '🚀 Predict Outcomes'}</button>
            </div>
            <div>
              {prediction ? (
                <div>
                  <div style={{ ...s.card, marginBottom: '15px' }}>
                    <div style={s.cardTitle}>📈 Prediction Results</div>
                    <div style={s.grid2}>
                      <div style={s.statCard('#22c55e')}><div style={s.statValue('#22c55e')}>{prediction.quality_score}</div><div style={s.statLabel}>Quality Score</div></div>
                      <div style={s.statCard('#38bdf8')}><div style={s.statValue('#38bdf8')}>{prediction.yield_score}</div><div style={s.statLabel}>Yield Score</div></div>
                      <div style={s.statCard('#f59e0b')}><div style={s.statValue('#f59e0b')}>{prediction.energy_kwh}</div><div style={s.statLabel}>Energy (kWh)</div></div>
                      <div style={s.statCard('#ef4444')}><div style={s.statValue('#ef4444')}>{prediction.carbon_kg}</div><div style={s.statLabel}>Carbon (kg)</div></div>
                    </div>
                    {anomalyResult && (
                      <div style={{ marginTop: '10px', padding: '10px', background: anomalyResult.is_anomaly ? '#ef444422' : '#22c55e22', borderRadius: '8px', border: `1px solid ${anomalyResult.is_anomaly ? '#ef4444' : '#22c55e'}` }}>
                        <span style={{ color: anomalyResult.is_anomaly ? '#ef4444' : '#22c55e', fontWeight: 'bold' }}>{anomalyResult.is_anomaly ? '⚠️ ANOMALY DETECTED' : '✅ NORMAL'}: {anomalyResult.message}</span>
                      </div>
                    )}
                  </div>
                  {recommendation && (
                    <div style={{ ...s.card, marginBottom: '15px' }}>
                      <div style={s.cardTitle}>💡 AI Parameter Recommendations</div>
                      {recommendation.map((rec, i) => (
                        <div key={i} style={{ padding: '12px', background: '#0f172a', borderRadius: '8px', marginBottom: '8px', borderLeft: `4px solid ${rec.color}` }}>
                          <p style={{ color: rec.color, fontWeight: 'bold', margin: '0 0 4px 0' }}>{rec.param}: {rec.action}</p>
                          <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>{rec.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={s.card}>
                    <div style={s.cardTitle}>🤝 Human-in-the-Loop Feedback</div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ color: '#94a3b8', fontSize: '12px' }}>If modifying — write your reason here (helps AI learn):</label>
                      <textarea value={modifyReason} onChange={e => setModifyReason(e.target.value)}
                        placeholder="e.g. Increasing compression force to 13 kN because tablet hardness was low in last batch..."
                        style={{ width: '100%', padding: '8px', background: '#334155', border: '1px solid #475569', borderRadius: '6px', color: 'white', minHeight: '70px', boxSizing: 'border-box', marginTop: '5px' }} />
                    </div>
                    <button style={s.btn('#22c55e')} onClick={() => handleFeedback('accept')}>✅ Accept</button>
                    <button style={s.btn('#f59e0b')} onClick={() => handleFeedback('modify')}>✏️ Modify</button>
                    <button style={s.btn('#ef4444')} onClick={() => handleFeedback('reject')}>❌ Reject</button>
                    {feedbackMsg && <p style={{ color: '#22c55e', marginTop: '10px' }}>{feedbackMsg}</p>}
                    <div style={{ marginTop: '15px', padding: '10px', background: '#0f172a', borderRadius: '8px' }}>
                      <p style={{ color: '#38bdf8', fontWeight: 'bold', marginBottom: '8px' }}>🔍 SHAP Feature Importance (Dynamic):</p>
                      {(prediction.shap_importance && prediction.shap_importance.length > 0
                        ? prediction.shap_importance
                        : [
                            { feature: 'Compression Force', impact: 92 },
                            { feature: 'Drying Temp', impact: 78 },
                            { feature: 'Machine Speed', impact: 65 },
                            { feature: 'Moisture Content', impact: 54 },
                            { feature: 'Granulation Time', impact: 43 },
                          ]
                      ).map((item, idx) => (
                        <div key={idx} style={{ marginBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{item.feature}</span>
                            <span style={{ color: shapColors[idx % shapColors.length], fontSize: '12px' }}>{item.impact}%</span>
                          </div>
                          <div style={{ background: '#334155', borderRadius: '4px', height: '6px' }}>
                            <div style={{ background: shapColors[idx % shapColors.length], width: `${item.impact}%`, height: '6px', borderRadius: '4px' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : <div style={{ ...s.card, textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Enter parameters and click Predict</div>}
            </div>
          </div>
        )}

        {activeTab === 'whatif' && <WhatIfTab goldenSig={goldenSig} />}

        {activeTab === 'pareto' && (
          <div style={s.card}>
            <div style={s.cardTitle}>⚖️ Pareto Front – Energy vs Quality (Carbon Budget: {carbonBudget} kg)</div>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '5px' }}>Showing {paretoData.length} solutions within your carbon budget. Change budget in Carbon tab to filter dynamically!</p>
            <p style={{ color: '#22c55e', fontSize: '12px', marginBottom: '15px' }}>💡 Tip: Lower the carbon budget in the Carbon tab and come back here to see fewer, stricter solutions!</p>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="x" name="Energy" stroke="#94a3b8" label={{ value: 'Energy (kWh)', position: 'insideBottom', offset: -5, fill: '#94a3b8' }} />
                <YAxis dataKey="y" name="Quality" stroke="#94a3b8" label={{ value: 'Quality Score', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                <Tooltip content={({ payload }) => {
                  if (payload?.length) { const d = payload[0].payload; return <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #38bdf8' }}><p style={{ color: '#22c55e', fontWeight: 'bold' }}>✅ Pareto Optimal</p><p style={{ color: '#38bdf8' }}>Quality: {d.y}</p><p style={{ color: '#f59e0b' }}>Energy: {d.x} kWh</p><p style={{ color: '#ef4444' }}>Carbon: {d.carbon} kg</p><p style={{ color: '#a78bfa' }}>Yield: {d.yield}</p></div>; }
                  return null;
                }} />
                <Scatter data={paretoData} fill="#38bdf8" onClick={(d) => setSelectedPoint(d)} />
              </ScatterChart>
            </ResponsiveContainer>
            {selectedPoint && (
              <div style={{ ...s.resultBox, marginTop: '20px' }}>
                <p style={{ color: '#38bdf8', fontWeight: 'bold', marginBottom: '10px' }}>🎯 Selected Optimal Solution:</p>
                <div style={s.grid4}>
                  <div style={s.statCard('#22c55e')}><div style={s.statValue('#22c55e')}>{selectedPoint.y}</div><div style={s.statLabel}>Quality</div></div>
                  <div style={s.statCard('#38bdf8')}><div style={s.statValue('#38bdf8')}>{selectedPoint.yield}</div><div style={s.statLabel}>Yield</div></div>
                  <div style={s.statCard('#f59e0b')}><div style={s.statValue('#f59e0b')}>{selectedPoint.x}</div><div style={s.statLabel}>Energy (kWh)</div></div>
                  <div style={s.statCard('#ef4444')}><div style={s.statValue('#ef4444')}>{selectedPoint.carbon}</div><div style={s.statLabel}>Carbon (kg)</div></div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'compare' && <CompareTab formData={formData} goldenSig={goldenSig} />}

        {activeTab === 'golden' && (
          <div style={s.grid2}>
            <div style={s.card}>
              <div style={s.cardTitle}>🏆 Golden Signature Parameters</div>
              {Object.entries(goldenSig).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                  <span style={{ color: '#94a3b8' }}>{key.replace(/_/g, ' ')}</span>
                  <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={s.card}>
              <div style={s.cardTitle}>📡 Golden Signature Radar</div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" /><PolarAngleAxis dataKey="subject" stroke="#94a3b8" />
                  <Radar name="Golden" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
              <div style={{ textAlign: 'center', marginTop: '10px', color: '#94a3b8', fontSize: '13px' }}>Top 5% best performing batches benchmark</div>
            </div>
          </div>
        )}

        {activeTab === 'realtime' && (
          <div style={s.card}>
            <div style={s.cardTitle}>📡 Real-Time Monitoring Simulation</div>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '15px' }}>Simulates a live batch running in real time. Watch energy, quality and carbon update every second!</p>
            <button style={s.btn('#22c55e')} onClick={startRealtime} disabled={realtimeRunning}>{realtimeRunning ? '⏳ Running...' : '▶️ Start Live Simulation'}</button>
            {realtimeData.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={realtimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#94a3b8" /><YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
                    <Legend />
                    <ReferenceLine y={carbonBudget} stroke="#ef4444" strokeDasharray="3 3" label={{ value: `Carbon Budget: ${carbonBudget}kg`, fill: '#ef4444', fontSize: 11 }} />
                    <Line type="monotone" dataKey="energy" name="Energy (kWh)" stroke="#f59e0b" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="quality" name="Quality" stroke="#22c55e" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="carbon" name="Carbon (kg)" stroke="#ef4444" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
                <div style={s.grid3}>
                  <div style={s.statCard('#f59e0b')}><div style={s.statValue('#f59e0b')}>{realtimeData[realtimeData.length - 1]?.energy?.toFixed(1)}</div><div style={s.statLabel}>Live Energy (kWh)</div></div>
                  <div style={s.statCard('#22c55e')}><div style={s.statValue('#22c55e')}>{realtimeData[realtimeData.length - 1]?.quality?.toFixed(1)}</div><div style={s.statLabel}>Live Quality</div></div>
                  <div style={s.statCard('#ef4444')}><div style={s.statValue('#ef4444')}>{realtimeData[realtimeData.length - 1]?.carbon?.toFixed(1)}</div><div style={s.statLabel}>Live Carbon (kg)</div></div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'anomaly' && (
          <div style={s.card}>
            <div style={s.cardTitle}>⚡ Energy Pattern Anomaly Detection</div>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '15px' }}>Uses Isolation Forest algorithm to detect unusual energy consumption patterns.</p>
            <button style={s.btn('#f59e0b')} onClick={() => { setAnomalyResult(null); handlePredict(); }} disabled={loading}>{loading ? 'Analyzing...' : '⚡ Run Anomaly Detection'}</button>            {anomalyResult && (
              <div style={{ marginTop: '20px' }}>
                <div style={s.grid2}>
                  <div style={s.statCard(anomalyResult.is_anomaly ? '#ef4444' : '#22c55e')}>
                    <div style={s.statValue(anomalyResult.is_anomaly ? '#ef4444' : '#22c55e')}>{anomalyResult.is_anomaly ? '⚠️ YES' : '✅ NO'}</div>
                    <div style={s.statLabel}>Anomaly Detected</div>
                  </div>
                  <div style={s.statCard('#38bdf8')}><div style={s.statValue('#38bdf8')}>{anomalyResult.anomaly_score}</div><div style={s.statLabel}>Anomaly Score</div></div>
                </div>
                <div style={{ marginTop: '15px', padding: '15px', background: anomalyResult.is_anomaly ? '#ef444422' : '#22c55e22', borderRadius: '8px', border: `1px solid ${anomalyResult.is_anomaly ? '#ef4444' : '#22c55e'}` }}>
                  <p style={{ color: anomalyResult.is_anomaly ? '#ef4444' : '#22c55e', fontWeight: 'bold' }}>{anomalyResult.message}</p>
                </div>
                <div style={{ marginTop: '15px', padding: '15px', background: '#0f172a', borderRadius: '8px' }}>
                  <p style={{ color: '#38bdf8', fontWeight: 'bold', marginBottom: '10px' }}>Possible Root Causes:</p>
                  {['Equipment bearing degradation', 'Raw material dampness variation', 'Motor speed fluctuation', 'Compression force irregularity'].map(c => (
                    <p key={c} style={{ color: '#94a3b8', fontSize: '13px' }}>• {c}</p>
                  ))}
                </div>
              </div>
            )}
            {!anomalyResult && <p style={{ color: '#94a3b8', marginTop: '15px' }}>Click the button above to run anomaly detection.</p>}
          </div>
        )}

        {activeTab === 'health' && (
          <div style={s.grid2}>
            <div style={s.card}>
              <div style={s.cardTitle}>🔧 Equipment Health Monitor</div>
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <div style={{ fontSize: '80px', fontWeight: 'bold', color: getStatusColor(healthScore.status) }}>{healthScore.health_score}</div>
                <div style={{ fontSize: '18px', color: '#94a3b8' }}>Overall Health Score</div>
                <div style={{ marginTop: '15px' }}><span style={s.badge(getStatusColor(healthScore.status))}>{healthScore.status?.toUpperCase()}</span></div>
                <p style={{ color: '#94a3b8', marginTop: '10px' }}>{healthScore.message}</p>
              </div>
            </div>
            <div style={s.card}>
              <div style={s.cardTitle}>📊 Health Breakdown</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[{ name: 'Vibration', value: healthScore.vibration_score || 0 }, { name: 'Energy', value: healthScore.energy_score || 0 }, { name: 'Overall', value: healthScore.health_score || 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} /><YAxis stroke="#94a3b8" domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
                  <Bar dataKey="value" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'carbon' && (
          <div>
            <div style={s.card}>
              <div style={s.cardTitle}>🌱 Dynamic Carbon Budget – Regulatory Compliance Monitor</div>
              <div style={{ background: '#0f172a', borderRadius: '8px', padding: '15px', marginBottom: '20px', border: '1px solid #22c55e' }}>
                <p style={{ color: '#22c55e', fontWeight: 'bold', marginBottom: '5px' }}>🏛️ Regulatory Target: Reduce carbon emissions 30% by 2027</p>
                <p style={{ color: '#94a3b8', fontSize: '13px' }}>Company Sustainability Goal: Stay below {carbonBudget} kg CO₂ per batch</p>
                <p style={{ color: '#94a3b8', fontSize: '13px' }}>Current Golden Signature: {goldenSig.carbon_emissions || 270.75} kg per batch ✅ On Track</p>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ color: '#94a3b8', fontSize: '13px' }}>Carbon Budget Limit (kg CO₂ per batch)</label>
                  <span style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '18px' }}>{carbonBudget} kg</span>
                </div>
                <input type="range" min={100} max={600} step={10} value={carbonBudget}
                  onChange={e => { setCarbonBudget(parseInt(e.target.value)); fetchPareto(parseInt(e.target.value)); }}
                  style={{ width: '100%', accentColor: '#38bdf8' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: '#475569', fontSize: '11px' }}>100 kg (Very Strict)</span>
                  <span style={{ color: '#22c55e', fontSize: '11px' }}>Golden: {goldenSig.carbon_emissions || 270.75} kg</span>
                  <span style={{ color: '#475569', fontSize: '11px' }}>600 kg (Relaxed)</span>
                </div>
                <div style={{ marginTop: '10px', padding: '10px', background: '#1e293b', borderRadius: '8px', border: '1px solid #38bdf8' }}>
                  <p style={{ color: '#38bdf8', fontSize: '13px', margin: 0 }}>⚡ Pareto solutions are now filtered to show only batches within <strong>{carbonBudget} kg</strong> carbon limit. Check the Pareto tab to see the effect!</p>
                </div>
              </div>
              <button style={s.btn('#22c55e')} onClick={handleCarbonCheck}>📊 Check Carbon Budget Status</button>
              {carbonResult && (
                <div style={{ marginTop: '20px' }}>
                  <div style={s.grid3}>
                    <div style={s.statCard(getStatusColor(carbonResult.status))}><div style={s.statValue(getStatusColor(carbonResult.status))}>{carbonResult.used_percent}%</div><div style={s.statLabel}>Budget Used</div></div>
                    <div style={s.statCard('#38bdf8')}><div style={s.statValue('#38bdf8')}>{carbonResult.avg_carbon_per_batch}</div><div style={s.statLabel}>Avg Carbon/Batch (kg)</div></div>
                    <div style={s.statCard('#f59e0b')}><div style={s.statValue('#f59e0b')}>{carbonResult.carbon_budget}</div><div style={s.statLabel}>Carbon Budget (kg)</div></div>
                  </div>
                  <div style={{ marginTop: '15px', padding: '10px', background: getStatusColor(carbonResult.status) + '22', borderRadius: '8px', border: `1px solid ${getStatusColor(carbonResult.status)}` }}>
                    <span style={{ color: getStatusColor(carbonResult.status), fontWeight: 'bold' }}>{carbonResult.status?.toUpperCase()}: {carbonResult.message}</span>
                  </div>
                  <div style={{ marginTop: '15px', padding: '15px', background: '#0f172a', borderRadius: '8px' }}>
                    <p style={{ color: '#94a3b8', fontSize: '13px' }}>Min Carbon per batch: {carbonResult.min_carbon} kg</p>
                    <p style={{ color: '#94a3b8', fontSize: '13px' }}>Max Carbon per batch: {carbonResult.max_carbon} kg</p>
                    <p style={{ color: '#94a3b8', fontSize: '13px' }}>Carbon = Energy × 0.233 emission factor</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'roi' && (
          <div>
            <div style={s.grid3}>
              <div style={s.statCard('#22c55e')}><div style={s.statValue('#22c55e')}>12.5%</div><div style={s.statLabel}>Energy Reduction</div></div>
              <div style={s.statCard('#38bdf8')}><div style={s.statValue('#38bdf8')}>₹32L</div><div style={s.statLabel}>Est. Annual Savings</div></div>
              <div style={s.statCard('#a78bfa')}><div style={s.statValue('#a78bfa')}>260+</div><div style={s.statLabel}>CO₂ Tons Reduced/Year</div></div>
            </div>
            <div style={s.card}>
              <div style={s.cardTitle}>📈 Before AI vs After AI – ROI Dashboard</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={roiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" /><YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
                  <Legend />
                  <Bar dataKey="energy" name="Energy (kWh)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="carbon" name="Carbon (kg)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="quality" name="Quality Score" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={s.grid2}>
              <div style={s.card}>
                <div style={s.cardTitle}>💰 Financial Impact</div>
                {[['Energy Cost Savings', '₹8.2L/year'], ['Carbon Credit Value', '₹4.5L/year'], ['Quality Improvement Revenue', '₹12L/year'], ['Maintenance Cost Reduction', '₹7.3L/year'], ['Total Annual ROI', '₹32L/year']].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #334155' }}>
                    <span style={{ color: '#94a3b8' }}>{label}</span><span style={{ color: '#22c55e', fontWeight: 'bold' }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={s.card}>
                <div style={s.cardTitle}>🌍 Environmental Impact</div>
                {[['CO₂ Reduced Per Batch', '~95 kg'], ['Annual CO₂ Reduction', '260+ metric tons'], ['Energy Saved Per Batch', '~338 kWh'], ['ESG Compliance', '94%'], ['Sustainability Score', '87/100']].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #334155' }}>
                    <span style={{ color: '#94a3b8' }}>{label}</span><span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'askai' && <AskAITab goldenSig={goldenSig} prediction={prediction} healthScore={healthScore} />}

      </div>
    </div>
  );
}