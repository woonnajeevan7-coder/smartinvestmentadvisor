import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeUser } from "../services/api";
import { useUser } from "../context/UserContext";
import LineChart from "../components/LineChart";
import { 
  User, 
  Wallet, 
  PiggyBank, 
  Target,
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Heart,
  BarChart3,
  Lightbulb,
  Zap,
  CheckCircle2,
  Info
} from 'lucide-react';

export default function InputForm() {
  const navigate = useNavigate();
  const { updateRiskProfile, setUser } = useUser();

  const [form, setForm] = useState({
    age: "25",
    income: "5000",
    savings: "15000",
    goalAmount: "250000",
    duration: "Mid Term",
    risk: 5
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // 1. Live Intelligence Engine
  const metrics = useMemo(() => {
    const age = Number(form.age) || 0;
    const income = Number(form.income) || 0;
    const savings = Number(form.savings) || 0;
    const risk = Number(form.risk) || 5;

    // Savings Ratio
    const savingsRatio = income > 0 ? (savings / (income * 12)) * 100 : 0;
    
    // Financial Health Score (1-10)
    let score = 0;
    if (savingsRatio > 20) score += 4;
    else if (savingsRatio > 10) score += 2;
    if (income > 8000) score += 3;
    else if (income > 4000) score += 2;
    if (age > 20 && age < 45) score += 3;
    else score += 1;
    const healthScore = Math.min(10, Math.max(1, score));

    // Dynamic Insights
    const insights = [];
    if (savingsRatio < 15) insights.push("Try to increase your savings-to-income ratio.");
    if (age < 30 && risk < 7) insights.push("Youth is on your side; consider higher risk for growth.");
    if (form.duration === 'Short Term' && risk > 6) insights.push("Short duration with high risk is volatile.");
    if (savingsRatio > 40) insights.push("Excellent liquidity! You're ready for aggressive assets.");
    if (insights.length === 0) insights.push("Maintain your current disciplined financial approach.");

    // Mini Preview Chart Data (10-year projection)
    const labels = Array.from({length: 11}, (_, i) => `Y${i}`);
    const rate = risk >= 8 ? 0.12 : risk >= 4 ? 0.08 : 0.06;
    const dataPoints = [savings];
    let balance = savings;
    for(let i=1; i<=10; i++) {
        balance = balance * (1 + rate) + (income * 0.1 * 12); // Assume 10% income SIP
        dataPoints.push(Math.round(balance));
    }

    return { healthScore, savingsRatio, insights, chartData: { labels, dataPoints }, rate };
  }, [form]);

  // Validation
  const isValid = useMemo(() => {
    return form.age && form.income && form.savings && form.goalAmount && Number(form.age) > 18;
  }, [form]);

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const data = await analyzeUser(form);
      updateRiskProfile(data.score, data.category);
      setUser(prev => ({ ...prev, goalAmount: Number(form.goalAmount) }));
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch(err) {
      updateRiskProfile(form.risk, form.duration);
      setUser(prev => ({ ...prev, goalAmount: Number(form.goalAmount) }));
      setTimeout(() => navigate("/dashboard"), 1000);
    }
  };

  const autofill = () => {
    setForm({ age: "32", income: "8500", savings: "45000", goalAmount: "500000", duration: "Long Term", risk: 7 });
  };

  return (
    <div className="min-h-screen bg-neu-bg flex items-center justify-center p-4 md:p-8 selection:bg-blue-500/30 font-sans">
      {/* Decorative BG */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-transparent rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-transparent rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Intelligence Dashboard */}
        <div className="lg:col-span-5 space-y-6 animate-fadeIn">
          
          {/* Health Score Card */}
          <div className="bg-neu-bg shadow-neu border-transparent p-6 rounded-[2rem] border border-white/5 hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-neu-muted font-dm-sans text-[10px] font-black uppercase tracking-widest mb-1">Financial Health Score</p>
                <div className="flex items-center gap-3">
                  <h2 className="text-5xl font-black text-neu-primary font-jakarta">{metrics.healthScore}</h2>
                  <span className="text-neu-muted font-dm-sans text-lg font-bold">/ 10</span>
                </div>
              </div>
              <div className={`p-3 rounded-2xl ${metrics.healthScore > 7 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-neu-accent'}`}>
                <Heart size={24} className={metrics.healthScore > 7 ? 'animate-pulse' : ''} />
              </div>
            </div>
            
            {/* Savings Ratio Visualizer */}
            <div className="space-y-2 mb-2 relative z-10">
               <div className="flex justify-between text-[10px] font-bold text-neu-muted font-dm-sans uppercase tracking-tighter">
                 <span>Savings Health</span>
                 <span>{metrics.savingsRatio.toFixed(1)}% Ratio</span>
               </div>
               <div className="h-3 w-full bg-slate-800/50 rounded-full overflow-hidden border border-transparent p-[2px]">
                 <div 
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      metrics.savingsRatio > 50 ? 'bg-emerald-500' : metrics.savingsRatio > 20 ? 'bg-blue-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, metrics.savingsRatio)}%` }}
                 />
               </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
          </div>

          {/* Mini Preview Chart */}
          <div className="bg-neu-bg shadow-neu border-transparent p-6 rounded-[2rem] border border-white/5 hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
               <h4 className="text-xs font-bold text-neu-primary font-jakarta uppercase flex items-center gap-2">
                 <BarChart3 size={14} className="text-neu-accent" />
                 10-Year Growth Preview
               </h4>
               <span className="text-[10px] text-neu-muted font-dm-sans font-mono">{(metrics.rate*100).toFixed(0)}% Proj.</span>
            </div>
            <div className="h-32 w-full opacity-80 hover:opacity-100 transition-opacity">
               <LineChart 
                  dataPoints={metrics.chartData.dataPoints} 
                  labels={metrics.chartData.labels}
                  color={metrics.healthScore > 5 ? '#3b82f6' : '#94a3b8'}
               />
            </div>
          </div>

          {/* Smart Insights */}
          <div className="bg-neu-bg shadow-neu border-transparent p-6 rounded-[2rem] border border-white/5 hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300">
             <h4 className="text-xs font-bold text-neu-primary font-jakarta uppercase flex items-center gap-2 mb-4">
               <Lightbulb size={14} className="text-orange-400" />
               AI Insights
             </h4>
             <div className="space-y-3">
               {metrics.insights.map((insight, i) => (
                 <div key={i} className="flex gap-3 items-start animate-slideIn">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <p className="text-xs text-neu-muted font-dm-sans leading-relaxed font-medium">{insight}</p>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Right Side: Main Form Card */}
        <div className="lg:col-span-7 bg-neu-bg shadow-neu border-transparent p-8 md:p-10 rounded-[2.5rem] border border-white/5 hover:shadow-neu-hover transition-all duration-500 relative overflow-hidden group">
          
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-black text-neu-primary font-jakarta flex items-center gap-3">
                Profile Builder
                <Zap size={24} className="text-neu-accent fill-blue-500" />
              </h1>
              <p className="text-neu-muted font-dm-sans text-sm mt-1">Fine-tune your financial projection parameters.</p>
            </div>
            <button 
              onClick={autofill}
              className="px-3 py-1.5 bg-neu-bg shadow-neu hover:shadow-neu-inset text-neu-accent border border-transparent rounded-xl text-[10px] font-black font-jakarta transition-all uppercase tracking-widest"
            >
              Smart Fill
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10">
            {/* Inputs with micro-validation and icons */}
            {[
              { id: 'age', label: 'Age', icon: <User size={18}/>, placeholder: '18+' },
              { id: 'income', label: 'Monthly Income ($)', icon: <Wallet size={18}/>, placeholder: 'USD' },
              { id: 'savings', label: 'Current Savings ($)', icon: <PiggyBank size={18}/>, placeholder: 'USD' },
              { id: 'goalAmount', label: 'Investment Goal ($)', icon: <Target size={18}/>, placeholder: 'e.g. 250000' },
            ].map(field => (
              <div key={field.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-neu-muted font-dm-sans text-[10px] font-black uppercase tracking-wider ml-1">{field.label}</label>
                  {!form[field.id] && <span className="text-red-500 text-[8px] font-bold uppercase italic">Required</span>}
                </div>
                <div className="relative group/input">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neu-muted font-dm-sans group-focus-within/input:text-neu-accent transition-colors">
                    {field.icon}
                  </div>
                  <input 
                    className="w-full bg-neu-bg shadow-neu-inset border-transparent border border-transparent rounded-2xl py-4 pl-12 pr-4 text-neu-primary font-jakarta focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-sm"
                    type="number"
                    placeholder={field.placeholder}
                    value={form[field.id]}
                    onChange={e => setForm({...form, [field.id]: e.target.value})}
                  />
                </div>
              </div>
            ))}

            {/* Investment Horizon */}
            <div className="space-y-2">
              <label className="text-neu-muted font-dm-sans text-[10px] font-black uppercase tracking-wider ml-1">Investment Horizon</label>
              <div className="relative group/input">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-neu-muted font-dm-sans group-focus-within/input:text-neu-accent transition-colors z-10" size={18} />
                <select 
                  className="w-full bg-neu-bg shadow-neu-inset border-transparent border border-transparent rounded-2xl py-4 pl-12 pr-4 text-neu-primary font-jakarta focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-sm appearance-none cursor-pointer"
                  value={form.duration}
                  onChange={e => setForm({...form, duration: e.target.value})}
                >
                  <option>Short Term</option>
                  <option>Mid Term</option>
                  <option>Long Term</option>
                  <option>Retirement</option>
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none rotate-90" size={18} />
              </div>
            </div>

            {/* Risk Selection */}
            <div className="md:col-span-2 bg-neu-bg shadow-neu-inset border-transparent p-6 rounded-[2rem] border border-transparent relative overflow-hidden group/risk">
               <div className="flex justify-between items-center mb-6 relative z-10">
                 <div className="flex items-center gap-2">
                   <TrendingUp size={16} className="text-neu-accent" />
                   <span className="text-xs font-bold text-neu-muted font-dm-sans uppercase tracking-widest">Risk Preference</span>
                 </div>
                 <div className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-tighter ${
                   form.risk >= 8 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                   form.risk >= 4 ? 'bg-blue-500/10 text-neu-accent border border-blue-500/20' : 
                   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                 }`}>
                   {form.risk >= 8 ? 'Aggressive' : form.risk >= 4 ? 'Balanced' : 'Safe Asset'}
                 </div>
               </div>
               <div className="relative h-6 flex items-center group-hover/risk:px-1 transition-all duration-300">
                  <div className="absolute inset-x-0 h-1.5 bg-slate-800 rounded-full" />
                  <div 
                    className={`absolute left-0 h-1.5 rounded-full transition-all duration-500 ${
                       form.risk >= 8 ? 'bg-red-500' : form.risk >= 4 ? 'bg-blue-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${(form.risk - 1) * 11.11}%` }}
                  />
                  <input 
                    type="range" min="1" max="10" 
                    className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                    value={form.risk}
                    onChange={e => setForm({...form, risk: Number(e.target.value)})}
                  />
                  <div 
                    className="absolute w-5 h-5 bg-white border-[4px] border-blue-600 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all pointer-events-none duration-200"
                    style={{ left: `calc(${(form.risk - 1) * 11.11}% - 10px)` }}
                  />
               </div>
               <div className="flex justify-between text-[8px] text-neu-muted font-dm-sans font-black uppercase mt-4 tracking-[0.2em]">
                 <span>Conservative (6%)</span>
                 <span>Market Return (8%)</span>
                 <span>Growth Focus (12%)</span>
               </div>
            </div>
          </div>

          {/* Validation Tooltip / Warning */}
          {!isValid && (
            <div className="mb-6 flex items-center gap-2 p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10 text-orange-400/80 text-[10px] font-bold uppercase animate-bounce">
               <Info size={14} /> Please fill all fields to generate a valid projection.
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !isValid}
            className={`w-full p-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 active:scale-95 relative overflow-hidden ${
              !isValid 
                ? 'bg-neu-bg shadow-neu-inset text-neu-muted cursor-not-allowed opacity-50' 
                : 'bg-neu-bg shadow-neu hover:shadow-neu-inset text-neu-primary font-jakarta'
            }`}
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Analyze & Build Strategy
                <ArrowRight size={20} className={isValid ? 'translate-x-0 group-hover:translate-x-1 transition-transform' : ''} />
              </>
            )}
            {isValid && !loading && (
              <div className="absolute top-0 -right-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:right-full transition-all duration-700 pointer-events-none" />
            )}
          </button>

          <p className="mt-8 text-center text-[10px] text-neu-muted font-dm-sans font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <CheckCircle2 size={12} className="text-emerald-500" />
            Real-time Calculation Enabled
          </p>
        </div>
      </div>
    </div>
  );
}


