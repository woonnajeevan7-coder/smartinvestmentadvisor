import React, { useState, useMemo } from "react";
import { useUser } from "../context/UserContext";
import { useMarket } from "../context/MarketContext";
import { 
  History as HistoryIcon, Search, ArrowUpRight, ArrowDownRight, 
  Calendar, Download, Activity, Zap, PieChart as PieIcon, 
  Shield, DollarSign, Briefcase, TrendingDown, Clock, 
  AlertTriangle, Info, Cpu, Flame, Sparkles, Layers
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function History() {
  const { transactions, user } = useUser();
  const { marketData } = useMarket();
  
  // ─── STATE MANAGEMENT ───────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [zoomRange, setZoomRange] = useState("ALL"); // 7D, 30D, ALL
  const [profitView, setProfitView] = useState("REALIZED"); // REALIZED, UNREALIZED

  // ─── DATA ENGINE ────────────────────────────────────────────────────────
  const processedData = useMemo(() => {
    if (!transactions) return { enriched: [], timeline: [], heatmap: {}, sectorVolume: {}, prediction: 100000 };

    // 1. Performance: Market Data Lookup Map (O(1))
    const marketMap = (marketData || []).reduce((acc, m) => {
      if (m.symbol) acc[m.symbol] = m;
      return acc;
    }, {});

    // 2. Sort Transactions (Ascending for timeline accuracy)
    const sortedTx = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let currentCash = 100000; 
    const holdings = {}; // { symbol: { qty: 0, totalCost: 0 } }
    
    const enriched = [];
    const timeline = [];
    const heatmap = {};
    const sectorVolume = { Cash: 0, Tech: 0, Crypto: 0, Equity: 0 };
    
    // Starting point
    const firstDate = sortedTx.length > 0 ? new Date(sortedTx[0].date) : new Date();
    firstDate.setHours(0,0,0,0);
    timeline.push({ date: firstDate.toISOString(), balance: 100000 });

    for (const tx of sortedTx) {
      const { type, symbol, price, quantity, amount, date } = tx;
      const s = symbol || "";
      const isTrade = type === 'BUY' || type === 'SELL';
      
      const numAmount = amount !== null && amount !== undefined ? Number(amount) : null;
      const numPrice = Number(price || 0);
      const numQty = Number(quantity || 0);
      const txValue = numAmount !== null ? numAmount : (numPrice * numQty);

      // Update Portfolio State
      if (type === 'BUY') {
        currentCash -= txValue;
        if (!holdings[s]) holdings[s] = { qty: 0, totalCost: 0 };
        holdings[s].qty += numQty;
        holdings[s].totalCost += txValue;
      } else if (type === 'SELL') {
        currentCash += txValue;
        if (holdings[s] && holdings[s].qty > 0) {
          const avgCost = holdings[s].totalCost / holdings[s].qty;
          const soldCostBasis = avgCost * numQty;
          holdings[s].qty -= numQty;
          holdings[s].totalCost -= soldCostBasis;
        }
      } else if (type === 'Deposit') {
        currentCash += txValue;
      } else if (type === 'Withdraw') {
        currentCash -= txValue;
      }

      // Calculate Current Market Value of all holdings at this point in time
      let mktVal = 0;
      Object.keys(holdings).forEach(sym => {
        const h = holdings[sym];
        const live = marketMap[sym];
        const livePrice = live && live.price !== undefined ? Number(live.price) : (h.totalCost / (h.qty || 1));
        mktVal += h.qty * livePrice;
      });

      const totalWealth = Number((Number(currentCash) + Number(mktVal)).toFixed(2));
      const dateObj = new Date(date);
      const dateKey = `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}`;
      heatmap[dateKey] = (heatmap[dateKey] || 0) + 1;

      // Realized vs Unrealized
      let rPL = 0;
      let uPL = 0;
      if (isTrade) {
        const live = marketMap[s];
        const h = holdings[s];
        const avgCost = h ? (h.totalCost / (h.qty || 1)) : (price || 0);
        
        if (type === 'SELL') {
          rPL = avgCost > 0 ? ((price - avgCost) / avgCost) * 100 : 0;
        }
        uPL = avgCost > 0 && live ? ((live.price - avgCost) / avgCost) * 100 : 0;
      }

      const sector = !isTrade ? 'Cash' : 
                     s.includes('BT') || s.includes('ET') ? 'Crypto' : 
                     ['AAPL', 'MSFT', 'GOOG', 'NVDA', 'TSLA'].includes(s) ? 'Tech' : 'Equity';

      enriched.push({
        ...tx,
        total: txValue,
        runningBalance: totalWealth,
        realizedPL: Number.isFinite(rPL) ? rPL : 0,
        unrealizedPL: Number.isFinite(uPL) ? uPL : 0,
        sector
      });

      timeline.push({ date, balance: totalWealth });
    }

    // Aggregate final sectors
    sectorVolume.Cash = currentCash;
    Object.keys(holdings).forEach(s => {
      const h = holdings[s];
      if (h.qty <= 0) return;
      const live = marketMap[s];
      const val = h.qty * (live?.price || (h.totalCost / h.qty));
      const sector = s.includes('BT') || s.includes('ET') ? 'Crypto' : 
                     ['AAPL', 'MSFT', 'GOOG', 'NVDA', 'TSLA'].includes(s) ? 'Tech' : 'Equity';
      sectorVolume[sector] = (sectorVolume[sector] || 0) + val;
    });

    // Prediction
    const lastPoint = timeline[timeline.length - 1]?.balance || 100000;
    const firstPoint = timeline[0]?.balance || 100000;
    const days = timeline.length > 1 ? (new Date(timeline[timeline.length-1].date) - new Date(timeline[0].date)) / (86400000) : 1;
    const growthPerDay = days > 0 ? (lastPoint - firstPoint) / days : 0;
    const prediction = lastPoint + (growthPerDay * 30);

    return {
      enriched: enriched.reverse(),
      timeline,
      heatmap,
      sectorVolume,
      prediction: Number.isFinite(prediction) ? prediction : lastPoint
    };
  }, [transactions, marketData]);

  // ─── FILTERED DATA ──────────────────────────────────────────────────────
  const filteredLedger = useMemo(() => {
    return processedData.enriched.filter(tx => {
      const matchesSearch = (tx.symbol || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (tx.name || tx.method || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "ALL" || tx.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [processedData.enriched, searchTerm, filterType]);

  // ─── BEHAVIORAL AUDIT ──────────────────────────────────────────────
  const behaviorInsights = useMemo(() => {
    const tx = processedData.enriched;
    const insights = [];
    if (tx.length === 0) return [];

    // FOMO Detection
    const highBuys = tx.filter(t => t.type === 'BUY' && t.unrealizedPL < -3);
    if (highBuys.length >= 2) insights.push({ type: 'warning', title: "FOMO Detection", desc: "Multiple entries detected during local price peaks. Advise DCA." });

    // Activity intensity
    const last30Days = tx.filter(t => (new Date() - new Date(t.date)) < 30 * 24 * 60 * 60 * 1000);
    if (last30Days.length > 10) insights.push({ type: 'danger', title: "Over-trading Alert", desc: "High velocity detected (10+ trades/mo). Monitor fee slippage." });

    // Diversification
    const sectors = Object.keys(processedData.sectorVolume).length;
    if (sectors >= 3) insights.push({ type: 'success', title: "Highly Diversified", desc: "Your capital is spread across multiple sectors, reducing systematic risk." });
    else if (sectors < 2 && tx.length > 5) insights.push({ type: 'warning', title: "Concentration Risk", desc: "Capital is highly concentrated in a single sector. Diversify." });

    // Capital Utilization
    const lastPoint = processedData.timeline[processedData.timeline.length - 1];
    if (user?.balance !== undefined && lastPoint?.balance !== undefined && user.balance < (lastPoint.balance * 0.1)) {
        insights.push({ type: 'info', title: "High Utilization", desc: "Most of your capital is deployed. Ensure you have liquidity for emergencies." });
    }

    // Consistency
    if (tx.length > 3) insights.push({ type: 'info', title: "Strategic Builder", desc: "You are consistently building a portfolio history. Keep it up!" });

    return insights;
  }, [processedData.enriched, processedData.sectorVolume]);

  // ─── CHART CONFIGURATIONS ────────────────────────────────────────────────
  const timelineChartData = useMemo(() => {
    let data = processedData.timeline;
    const now = new Date();
    
    if (zoomRange === '7D' || zoomRange === '30D') {
      const days = zoomRange === '7D' ? 7 : 30;
      const targetDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      // Find historical balance exactly at the target start date
      let balanceAtTarget = 100000;
      for (let i = 0; i < processedData.timeline.length; i++) {
        if (new Date(processedData.timeline[i].date) <= targetDate) {
          balanceAtTarget = processedData.timeline[i].balance;
        } else {
          break;
        }
      }
      
      // Filter points to only those within the time window
      data = data.filter(p => new Date(p.date) >= targetDate);
      
      // Prepend the targetDate to force the chart's X-axis to stretch back exactly 7 or 30 days
      data.unshift({ date: targetDate.toISOString(), balance: balanceAtTarget });
    }

    return {
      labels: data.map(p => {
        const d = new Date(p.date);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + 
               ' ' + 
               d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      }),
      datasets: [{
        label: 'Portfolio Value',
        data: data.map(p => p.balance),
        borderColor: '#6C63FF',
        borderWidth: 3,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
          gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#6C63FF',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#fff'
      }]
    };
  }, [processedData.timeline, zoomRange]);

  const sectorChartData = {
    labels: Object.keys(processedData.sectorVolume),
    datasets: [{
      data: Object.values(processedData.sectorVolume),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
      borderWidth: 0
    }]
  };

  const exportCSV = () => {
    const headers = "Date,Symbol,Type,Price,Quantity,Total,Running Balance,Sector\n";
    const rows = processedData.enriched.map(tx => {
      const dateStr = new Date(tx.date).toLocaleString().replace(/,/g, '');
      return `${dateStr},${tx.symbol || 'N/A'},${tx.type},${(tx.price || 0).toFixed(2)},${tx.quantity || 0},${tx.total.toFixed(2)},${tx.runningBalance.toFixed(2)},${tx.sector}`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transaction_intelligence_report.csv';
    a.click();
  };

  return (
    <div className="p-4 md:p-8 pb-40 bg-neu-bg min-h-screen text-neu-primary font-dm-sans">
      
      {/* ─── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 animate-fadeIn">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-blue-600/20 text-neu-accent text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-tighter border border-blue-500/20">Audit Intelligence</span>
            <span className="bg-purple-600/20 text-purple-400 text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-tighter border border-purple-500/20">v3.0 Stable</span>
          </div>
          <h1 className="text-4xl font-black text-neu-primary font-jakarta flex items-center gap-3">
            Portfolio Intelligence <Cpu className="text-neu-accent" size={32} />
          </h1>
          <p className="text-neu-muted font-dm-sans text-sm font-medium">Data-driven behavioral audit and trajectory analysis.</p>
        </div>

        <button onClick={exportCSV} className="flex items-center gap-2 bg-neu-bg shadow-neu hover:shadow-neu-hover hover:-translate-y-1 text-neu-primary font-jakarta px-6 py-3 rounded-2xl text-xs font-bold transition-all duration-300">
          <Download size={16} /> Export Intelligence
        </button>
      </div>

      {/* ─── ANALYTICS GRID ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        
        {/* Timeline Chart */}
        <div className="lg:col-span-8 bg-neu-bg p-8 rounded-[32px] shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 relative overflow-hidden">
          <div className="flex justify-between items-center mb-8 relative z-10">
            <h3 className="text-xs font-black text-neu-primary font-jakarta uppercase tracking-widest flex items-center gap-2">
              <Activity size={16} className="text-neu-accent" /> Capital Trajectory
            </h3>
            <div className="flex bg-neu-bg shadow-neu rounded-xl p-2">
              {['7D', '30D', 'ALL'].map(r => (
                <button key={r} onClick={() => setZoomRange(r)} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${zoomRange === r ? 'bg-neu-bg shadow-neu-inset text-neu-accent font-jakarta' : 'text-neu-muted font-dm-sans hover:text-neu-primary'}`}>{r}</button>
              ))}
            </div>
          </div>
          <div className="h-64 relative z-10">
            <Line 
                data={timelineChartData} 
                options={{ 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#FFFFFF',
                            titleColor: '#6B7280',
                            bodyColor: '#1F2937',
                            bodyFont: { weight: 'bold' },
                            padding: 12,
                            borderColor: '#D1D5DB',
                            borderWidth: 1,
                            displayColors: false,
                            callbacks: {
                            label: (context) => {
                                const val = context.parsed.y;
                                return ` Portfolio Value: $${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            }
                            }
                        }
                    }, 
                    scales: { 
                        x: { 
                          grid: { display: false },
                          ticks: { color: '#64748b', font: { size: 10, weight: 'bold' } }
                        }, 
                        y: { 
                            grid: { color: 'rgba(51, 65, 85, 0.5)', borderDash: [5, 5] }, 
                            ticks: { 
                                color: '#64748b',
                                font: { weight: 'bold' },
                                callback: (value) => '$' + Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })
                            } 
                        } 
                    } 
                }} 
            />
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20" />
        </div>

        {/* Prediction Card */}
        <div className="lg:col-span-4 bg-gradient-to-br from-indigo-600/20 to-blue-600/20 p-8 rounded-[2.5rem] border border-blue-500/20 shadow-2xl flex flex-col justify-between hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-500">
          <div>
            <h3 className="text-xs font-black text-neu-accent uppercase tracking-widest flex items-center gap-2 mb-6">
              <Sparkles size={16} /> Projected Delta
            </h3>
            <p className="text-[10px] text-neu-muted font-dm-sans font-bold uppercase mb-2">Estimated 30-Day Outlook</p>
            <h2 className="text-4xl font-black text-neu-primary font-jakarta leading-none tracking-tighter">${processedData.prediction.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h2>
          </div>
          <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <p className="text-[10px] text-neu-primary leading-relaxed font-medium">
              <span className="text-neu-accent font-black">AI Insight:</span> Your current velocity indicates a positive trajectory. Maintaining this pattern suggests a {(((processedData.prediction - (processedData.timeline[processedData.timeline.length - 1]?.balance || 100000)) / (processedData.timeline[processedData.timeline.length - 1]?.balance || 100000)) * 100).toFixed(1)}% growth potential.
            </p>
          </div>
        </div>
      </div>

      {/* ─── FILTER DASHBOARD ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="flex bg-neu-bg shadow-neu p-1.5 rounded-2xl border border-transparent">
          {['ALL', 'BUY', 'SELL', 'Deposit', 'Withdraw'].map(t => (
            <button key={t} onClick={() => setFilterType(t)} className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${filterType === t ? 'bg-neu-bg shadow-neu-inset text-neu-accent font-jakarta' : 'text-neu-muted font-dm-sans hover:text-neu-primary'}`}>{t}</button>
          ))}
        </div>
        
        <div className="bg-neu-bg shadow-neu p-1.5 rounded-2xl border border-transparent flex items-center gap-2">
           <button onClick={() => setProfitView(p => p === "REALIZED" ? "UNREALIZED" : "REALIZED")} className="px-5 py-2 bg-neu-bg shadow-neu hover:shadow-neu-inset rounded-xl text-[10px] font-black text-neu-accent border border-transparent flex items-center gap-2 hover:bg-slate-800 transition-all">
             <Layers size={14} /> {profitView} P/L VIEW
           </button>
        </div>

        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neu-muted font-dm-sans group-focus-within:text-neu-accent transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search by ticker or asset name..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-neu-bg shadow-neu-inset rounded-xl py-4 pl-12 pr-4 text-sm text-neu-primary focus:outline-none focus:ring-2 focus:ring-neu-accent transition-all font-bold"
          />
        </div>
      </div>

      {/* ─── BEHAVIOR & DISTRIBUTION ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Real Data Heatmap */}
        <div className="lg:col-span-4 bg-neu-bg p-8 rounded-[32px] shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300">
           <h3 className="text-xs font-black text-neu-primary font-jakarta uppercase tracking-widest flex items-center gap-2 mb-8">
             <Flame size={16} className="text-orange-500" /> Activity Intensity
           </h3>
           <div className="grid grid-cols-7 gap-2">
              {Array.from({length: 28}, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (27 - i));
                const key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
                const intensity = processedData.heatmap[key] || 0;
                return (
                  <div 
                    key={i} 
                    title={`${key}: ${intensity} trades`} 
                    className={`aspect-square rounded-md transition-all duration-500 ${
                        intensity > 2 ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]' : 
                        intensity > 0 ? 'bg-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 
                        'bg-neu-bg shadow-neu-inset'
                    }`} 
                  />
                );
              })}
           </div>
           <p className="mt-6 text-[10px] text-neu-muted font-dm-sans font-bold uppercase tracking-widest text-center">Trailing 28-Day Heatmap</p>
        </div>

        {/* Behavioral Audit Panel */}
        <div className="lg:col-span-5 bg-neu-bg p-8 rounded-[32px] shadow-neu space-y-5 hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300">
           <h3 className="text-xs font-black text-neu-primary font-jakarta uppercase tracking-widest flex items-center gap-2 mb-4">
             <Zap size={16} className="text-yellow-400" /> Behavioral Audit
           </h3>
           {behaviorInsights.length > 0 ? behaviorInsights.map((insight, i) => (
             <div key={i} className="flex gap-4 p-4 bg-neu-bg shadow-neu hover:shadow-neu-inset/50 rounded-2xl border border-transparent hover:border-blue-500/20 transition-all">
                <div className={`p-2 rounded-xl bg-neu-bg shadow-neu hover:shadow-neu-inset ${insight.type === 'danger' ? 'text-red-400' : insight.type === 'warning' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                  {insight.type === 'danger' ? <AlertTriangle size={18} /> : <Info size={18} />}
                </div>
                <div>
                   <h4 className="text-[10px] font-black text-neu-primary font-jakarta uppercase mb-1 tracking-tight">{insight.title}</h4>
                   <p className="text-[10px] text-neu-muted font-dm-sans font-medium leading-relaxed">{insight.desc}</p>
                </div>
             </div>
           )) : (
             <div className="py-12 flex flex-col items-center gap-3 opacity-30">
               <Shield size={32} />
               <p className="text-[10px] font-black uppercase tracking-widest">Collecting Strategy Data</p>
             </div>
           )}
        </div>

        {/* Sector Allocation */}
        <div className="lg:col-span-3 bg-neu-bg p-8 rounded-[32px] shadow-neu flex flex-col items-center hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300">
           <h3 className="text-xs font-black text-neu-primary font-jakarta uppercase tracking-widest self-start mb-8">
             <PieIcon size={16} className="inline mr-2 text-purple-400" /> Sector Alpha
           </h3>
           <div className="w-40 h-40">
             <Pie data={sectorChartData} options={{ plugins: { legend: { display: false } } }} />
           </div>
           <div className="mt-6 grid grid-cols-1 gap-2 w-full">
              {Object.keys(processedData.sectorVolume).map((s, i) => (
                <div key={s} className="flex justify-between items-center text-[9px] font-black uppercase">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: sectorChartData.datasets[0].backgroundColor[i]}} />
                    <span className="text-neu-muted font-dm-sans">{s}</span>
                  </div>
                  <span className="text-neu-primary font-jakarta">${processedData.sectorVolume[s].toLocaleString()}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* ─── INTELLIGENCE LEDGER ────────────────────────────────────────────── */}
      <div className="bg-neu-bg rounded-[32px] shadow-neu overflow-hidden group hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-500">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-neu-muted font-dm-sans text-[10px] font-black uppercase border-b border-transparent">
              <tr>
                <th className="px-8 py-6">Asset Intelligence</th>
                <th className="py-6">Execution</th>
                <th className="py-6">Type</th>
                <th className="py-6 text-right">Basis</th>
                <th className="py-6 text-right">Volume</th>
                <th className="py-6 text-right">{profitView} Gain/Loss</th>
                <th className="px-8 py-6 text-right">Terminal Bal</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredLedger.map((tx, i) => {
                const pl = profitView === "REALIZED" ? tx.realizedPL : tx.unrealizedPL;
                return (
                  <tr key={`${tx.id || i}-${tx.date}`} className="border-b border-gray-300/50 hover:bg-blue-600/5 transition-all group/row">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] ${['BUY', 'Deposit'].includes(tx.type) ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]'}`}>
                          {(tx.symbol || tx.type).charAt(0)}
                        </div>
                        <div>
                          <p className="text-neu-primary font-jakarta font-black uppercase tracking-tight group-hover/row:text-neu-accent transition-colors">{tx.symbol || tx.method || 'System'}</p>
                          <p className="text-[8px] text-neu-muted font-dm-sans font-black uppercase tracking-tighter">{tx.name || tx.sector}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 text-[10px] font-bold text-neu-muted font-dm-sans uppercase">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="py-6">
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                        ['BUY', 'Deposit'].includes(tx.type) ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-6 text-right font-black text-neu-primary">${Number(tx.price || tx.amount || 0).toFixed(2)}</td>
                    <td className="py-6 text-right font-black text-neu-primary font-jakarta">${tx.total?.toLocaleString()}</td>
                    <td className="py-6 text-right">
                      <span className={`px-2 py-1 rounded-lg font-black text-[10px] ${pl >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {pl >= 0 ? '+' : ''}{pl?.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right font-black font-mono text-xs text-neu-primary font-jakarta">
                      ${tx.runningBalance?.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {filteredLedger.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-32 text-center">
                    <div className="opacity-20 flex flex-col items-center gap-4">
                      <Briefcase size={48} />
                      <p className="text-sm font-black uppercase tracking-widest">No Intelligence Logs</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
