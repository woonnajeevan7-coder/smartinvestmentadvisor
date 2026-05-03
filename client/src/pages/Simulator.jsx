import React, { useState, useMemo, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useMarket } from '../context/MarketContext';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Target, 
  Zap, 
  RefreshCcw, 
  CheckCircle2, 
  XCircle, 
  Info, 
  ChevronDown, 
  ArrowRight,
  ShieldAlert,
  Percent
} from 'lucide-react';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler
);

export default function Simulator() {
  // Input States
  const [initialInvestment, setInitialInvestment] = useState(5000);
  const [monthlySIP, setMonthlySIP] = useState(500);
  const [duration, setDuration] = useState(10);
  const [riskLevel, setRiskLevel] = useState(5);
  const [targetGoal, setTargetGoal] = useState(150000);
  const [adjustInflation, setAdjustInflation] = useState(false);
  const [showTable, setShowTable] = useState(false);

  // Financial Constants
  const INFLATION_RATE = 0.05; // 5% average
  const CONSERVATIVE_RATE = 0.06;
  const AGGRESSIVE_RATE = 0.12;

  const selectedRate = useMemo(() => {
    if (riskLevel <= 3) return 0.06;
    if (riskLevel <= 6) return 0.08;
    return 0.12;
  }, [riskLevel]);

  // Defensive formatting for currency
  const formatCompact = (val) => {
    if (val >= 10000000) return `$${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return `$${val.toFixed(0)}`;
  };

  // Calculations Engine
  const simulation = useMemo(() => {
    // Sanitize inputs
    const init = Math.max(0, Number(initialInvestment) || 0);
    const sip = Math.max(0, Number(monthlySIP) || 0);
    const dur = Math.max(1, Math.min(50, Number(duration) || 1));
    const target = Math.max(0, Number(targetGoal) || 0);

    const years = Array.from({ length: dur + 1 }, (_, i) => i);
    const labels = years.map(y => `Year ${y}`);
    
    const calculateGrowth = (annualRate) => {
      const monthlyRate = annualRate / 12;
      let balance = init;
      const history = [balance];
      
      for (let i = 1; i <= dur; i++) {
        // Monthly compounding for 12 months
        for (let m = 0; m < 12; m++) {
          balance = (balance + sip) * (1 + monthlyRate);
        }
        
        // Adjust for inflation (at year end) if toggled
        const value = adjustInflation ? balance / Math.pow(1 + INFLATION_RATE, i) : balance;
        history.push(Math.round(value));
      }
      return history;
    };

    const moderate = calculateGrowth(selectedRate);
    const conservative = calculateGrowth(CONSERVATIVE_RATE);
    const aggressive = calculateGrowth(AGGRESSIVE_RATE);

    const totalInvested = init + (sip * 12 * dur);
    const finalValue = moderate[moderate.length - 1];
    const totalProfit = Math.max(0, finalValue - totalInvested);
    const growthPercent = totalInvested > 0 ? ((finalValue - totalInvested) / totalInvested) * 100 : 0;

    return {
      labels,
      conservative,
      moderate,
      aggressive,
      totalInvested,
      finalValue,
      totalProfit,
      growthPercent,
      isGoalAchieved: finalValue >= target,
      sanitized: { init, sip, dur, target }
    };
  }, [initialInvestment, monthlySIP, duration, selectedRate, adjustInflation, targetGoal]);

  // Chart Config
  const chartData = useMemo(() => ({
    labels: simulation.labels,
    datasets: [
      {
        label: 'Conservative (6%)',
        data: simulation.conservative,
        borderColor: '#94a3b8',
        backgroundColor: 'rgba(148, 163, 184, 0.05)',
        borderDash: [5, 5],
        tension: 0.4,
        fill: false,
        pointRadius: 0,
      },
      {
        label: `Projected (${(selectedRate * 100).toFixed(0)}%)`,
        data: simulation.moderate,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 4,
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 6,
      },
      {
        label: 'Aggressive (12%)',
        data: simulation.aggressive,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.05)',
        tension: 0.4,
        fill: false,
        pointRadius: 0,
      },
    ],
  }), [simulation, selectedRate]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#64748b', font: { size: 11, weight: '600' }, usePointStyle: true, padding: 20 },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#3b82f6',
        bodyColor: '#f1f5f9',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        bodyFont: { weight: 'bold' },
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { color: '#64748b', font: { size: 10 } } 
      },
      y: { 
        grid: { color: 'rgba(148, 163, 184, 0.1)' }, 
        ticks: { 
          color: '#64748b', 
          font: { size: 10 },
          callback: (v) => formatCompact(v)
        } 
      },
    },
  }), []);

  const reset = () => {
    setInitialInvestment(5000);
    setMonthlySIP(500);
    setDuration(10);
    setRiskLevel(5);
    setTargetGoal(150000);
  };

  return (
    <div className="p-6 md:p-8 pb-24 min-h-screen bg-neu-bg text-neu-primary font-dm-sans font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-neu-primary font-jakarta tracking-tight flex items-center gap-3">
          <Zap className="text-neu-accent fill-blue-500" size={32} />
          Investment Simulator
        </h1>
        <p className="text-neu-muted font-dm-sans mt-2 text-lg">Compound your future with professional risk-based projections.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Panel: Inputs */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-neu-bg shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-500 p-6 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-neu-primary font-jakarta font-bold text-lg flex items-center gap-2">
                <Target size={20} className="text-neu-accent" />
                Parameters
              </h3>
              <button onClick={reset} className="text-neu-muted font-dm-sans hover:text-neu-primary font-jakarta transition-colors">
                <RefreshCcw size={16} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Initial Investment */}
              <div>
                <label className="text-neu-muted font-dm-sans text-xs font-bold uppercase mb-2 block">Initial Investment</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-neu-muted font-dm-sans" size={18} />
                  <input 
                    type="number" 
                    min="0"
                    step="100"
                    value={initialInvestment}
                    onChange={(e) => setInitialInvestment(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    className="w-full bg-neu-bg shadow-neu-inset border border-white/20 rounded-xl py-3 pl-10 pr-4 text-neu-primary font-jakarta focus:border-blue-500 outline-none transition-all font-bold" 
                  />
                </div>
              </div>

              {/* Monthly SIP */}
              <div>
                <label className="text-neu-muted font-dm-sans text-xs font-bold uppercase mb-2 block">Monthly SIP Contribution</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-neu-muted font-dm-sans" size={18} />
                  <input 
                    type="number" 
                    min="0"
                    step="50"
                    value={monthlySIP}
                    onChange={(e) => setMonthlySIP(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    className="w-full bg-neu-bg shadow-neu-inset border border-white/20 rounded-xl py-3 pl-10 pr-4 text-neu-primary font-jakarta focus:border-blue-500 outline-none transition-all font-bold" 
                  />
                </div>
              </div>

              {/* Duration Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-neu-muted font-dm-sans text-xs font-bold uppercase block">Investment Period</label>
                  <span className="text-neu-accent font-bold">{duration} Years</span>
                </div>
                <input 
                  type="range" min="1" max="40" 
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                />
              </div>

              {/* Risk Level Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-neu-muted font-dm-sans text-xs font-bold uppercase block">Risk Level (1-10)</label>
                  <span className={`font-bold ${riskLevel >= 7 ? 'text-red-400' : riskLevel >= 4 ? 'text-neu-accent' : 'text-emerald-400'}`}>
                    {riskLevel >= 7 ? 'Aggressive' : riskLevel >= 4 ? 'Moderate' : 'Conservative'}
                  </span>
                </div>
                <input 
                  type="range" min="1" max="10" 
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                />
              </div>

              {/* Target Goal */}
              <div>
                <label className="text-neu-muted font-dm-sans text-xs font-bold uppercase mb-2 block">Target Financial Goal</label>
                <div className="relative">
                  <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-neu-muted font-dm-sans" size={18} />
                  <input 
                    type="number" 
                    min="0"
                    step="1000"
                    value={targetGoal}
                    onChange={(e) => setTargetGoal(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    className="w-full bg-neu-bg shadow-neu-inset border border-white/20 rounded-xl py-3 pl-10 pr-4 text-neu-primary font-jakarta focus:border-blue-500 outline-none transition-all font-bold" 
                  />
                </div>
              </div>

              {/* Advanced Toggles */}
              <div className="pt-4 border-t border-transparent flex items-center justify-between">
                <label className="text-sm text-neu-muted font-dm-sans flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={adjustInflation} 
                    onChange={() => setAdjustInflation(!adjustInflation)}
                    className="w-4 h-4 rounded border-transparent bg-slate-800 accent-blue-500" 
                  />
                  Adjust for Inflation (5%)
                </label>
              </div>
            </div>
          </div>

          {/* Money Doubling Logic */}
          <div className="bg-neu-bg shadow-neu-inset hover:shadow-neu transition-all duration-300 p-5 rounded-2xl border border-white/5">
            <h4 className="text-neu-accent font-bold text-sm uppercase flex items-center gap-2 mb-2">
              <Percent size={14} /> Rule of 72
            </h4>
            <p className="text-neu-primary font-dm-sans text-sm">
              At your selected <strong>{(selectedRate * 100).toFixed(0)}%</strong> rate, your money will double approximately every 
              <span className="text-neu-primary font-jakarta font-bold mx-1">{Math.round(72 / (selectedRate * 100))} years</span>.
            </p>
          </div>
        </div>

        {/* Right Panel: Charts & Results */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Main Chart Card */}
          <div className="bg-neu-bg shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-500 p-6 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-neu-primary font-jakarta font-bold text-lg">Portfolio Projection</h3>
              {simulation.isGoalAchieved ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-neu-bg shadow-neu-inset text-emerald-500 rounded-full text-xs font-bold">
                  <CheckCircle2 size={14} /> GOAL ACHIEVED
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-neu-bg shadow-neu-inset text-red-500 rounded-full text-xs font-bold">
                  <XCircle size={14} /> GOAL SHORTFALL
                </div>
              )}
            </div>
            <div className="h-[350px] w-full">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neu-bg shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-500 p-6 rounded-2xl border border-white/5">
              <p className="text-neu-muted font-dm-sans text-xs font-bold uppercase mb-1">Final Balance</p>
              <h2 className="text-3xl font-extrabold text-neu-primary font-jakarta">${simulation.finalValue.toLocaleString()}</h2>
            </div>
            <div className="bg-neu-bg shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-500 p-6 rounded-2xl border border-white/5">
              <p className="text-neu-muted font-dm-sans text-xs font-bold uppercase mb-1">Total Invested</p>
              <h2 className="text-3xl font-extrabold text-neu-primary font-dm-sans">${simulation.totalInvested.toLocaleString()}</h2>
            </div>
            <div className="bg-neu-bg shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-500 p-6 rounded-2xl border border-white/5">
              <p className="text-neu-muted font-dm-sans text-xs font-bold uppercase mb-1">Total Returns</p>
              <h2 className="text-3xl font-extrabold text-emerald-400">+${simulation.totalProfit.toLocaleString()}</h2>
              <span className="text-[10px] text-emerald-500 font-bold">({simulation.growthPercent.toFixed(1)}% GROWTH)</span>
            </div>
          </div>

          {/* Breakdown & Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-neu-bg shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-500 p-6 rounded-2xl border border-white/5">
              <h4 className="text-neu-primary font-jakarta font-bold mb-4 flex items-center gap-2">
                <Info size={18} className="text-neu-accent" />
                Capital Breakdown
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-neu-muted font-dm-sans mb-1">
                    <span>Principal Invested</span>
                    <span>{((simulation.totalInvested / simulation.finalValue) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-500 transition-all duration-500" 
                      style={{ width: `${(simulation.totalInvested / simulation.finalValue) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-neu-muted font-dm-sans mb-1">
                    <span>Compounded Profits</span>
                    <span>{((simulation.totalProfit / simulation.finalValue) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500" 
                      style={{ width: `${(simulation.totalProfit / simulation.finalValue) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-neu-bg shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-500 p-6 rounded-2xl border border-white/5">
              <h4 className="text-neu-primary font-jakarta font-bold mb-4 flex items-center gap-2">
                <ShieldAlert size={18} className="text-orange-400" />
                Strategy Insights
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-neu-muted font-dm-sans">
                  <ArrowRight size={14} className="mt-1 text-neu-accent shrink-0" />
                  <span>Increasing duration by 5 years would boost returns by <strong>${(simulation.finalValue * 0.4).toLocaleString()}</strong>.</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-neu-muted font-dm-sans">
                  <ArrowRight size={14} className="mt-1 text-neu-accent shrink-0" />
                  <span>Your SIP accounts for <strong>{((monthlySIP * 12 * duration / simulation.totalInvested) * 100).toFixed(0)}%</strong> of your principal.</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-neu-muted font-dm-sans">
                  <ArrowRight size={14} className="mt-1 text-neu-accent shrink-0" />
                  <span>{simulation.isGoalAchieved ? 'Maintain current pace to hit your target.' : 'Increase SIP by $200 to bridge the goal gap.'}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Expandable Table */}
          <div className="bg-neu-bg shadow-neu hover:shadow-neu-hover transition-all duration-300 rounded-2xl border border-white/5 overflow-hidden">
             <button 
                onClick={() => setShowTable(!showTable)}
                className="w-full p-4 flex justify-between items-center hover:bg-slate-800/50 transition-colors"
             >
                <span className="font-bold text-sm text-neu-primary font-jakarta uppercase tracking-wider">Year-by-Year Growth Table</span>
                <ChevronDown size={20} className={`text-neu-muted font-dm-sans transition-transform ${showTable ? 'rotate-180' : ''}`} />
             </button>
             {showTable && (
               <div className="overflow-x-auto p-4 border-t border-transparent">
                 <table className="w-full text-left text-sm">
                   <thead className="text-neu-muted font-dm-sans font-bold uppercase text-[10px]">
                     <tr>
                       <th className="pb-3 px-2">Year</th>
                       <th className="pb-3 px-2">Total Invested</th>
                       <th className="pb-3 px-2">Portfolio Value</th>
                       <th className="pb-3 px-2">Growth</th>
                     </tr>
                   </thead>
                   <tbody className="text-neu-primary font-dm-sans">
                     {simulation.labels.map((label, i) => {
                        const invested = initialInvestment + (monthlySIP * 12 * i);
                        const value = simulation.moderate[i];
                        return (
                          <tr key={label} className="border-t border-transparent hover:bg-slate-800/20">
                            <td className="py-3 px-2 font-bold text-neu-primary font-jakarta">{label}</td>
                            <td className="py-3 px-2">${invested.toLocaleString()}</td>
                            <td className="py-3 px-2 font-bold text-neu-accent">${value.toLocaleString()}</td>
                            <td className="py-3 px-2 text-emerald-500">+{((value - invested)/invested*100 || 0).toFixed(1)}%</td>
                          </tr>
                        )
                     })}
                   </tbody>
                 </table>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

