import React, { useState, useMemo, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useMarket } from "../context/MarketContext";
import AllocationChart from "../components/Charts";
import LineChart from "../components/LineChart";
import {
  ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Activity,
  Shield, Zap, Target, List, BarChart, Globe, ChevronRight,
  Sparkles, PieChart as PieIcon, Clock, History as HistoryIcon,
  Download, AlertCircle, MessageSquare, RefreshCw,
  Layers, FileText, Send, Star
} from 'lucide-react';
import { useNavigate } from "react-router-dom";

/**
 * Dashboard Page Component
 * 
 * The main strategic hub of the application, featuring:
 * - Real-time Portfolio Health and Net Worth stats
 * - AI-driven 6-month financial forecasting
 * - Interactive Performance Modeling charts
 * - Strategic AI rebalancing suggestions and system alerts
 * - Comprehensive Portfolio Ledger and Transaction History
 */
export default function Dashboard() {
  // --- Context & Navigation ---
  const { user, holdings, transactions, balanceHistory, watchlist } = useUser();
  const { marketData } = useMarket();
  const navigate = useNavigate();

  // --- UI State ---
  const [activeTab, setActiveTab] = useState('Overview'); // Controls main section tabs
  const [scenario, setScenario] = useState('Normal'); // Controls market scenario for modeling (Bear/Normal/Bull)

  /**
   * AI Analytics Engine (useMemo)
   * 
   * Calculates all high-level financial metrics, including:
   * - Current Portfolio Value based on live market data
   * - ROI and Profit/Loss aggregation
   * - Health Score (diversification and risk audit)
   * - Asset Concentration warnings
   * - Predictive Forecasts based on market scenarios
   * - Strategic Rebalancing steps
   */
  const aiAnalytics = useMemo(() => {
    const safeHoldings = holdings || [];
    const safeMarket = marketData || [];

    const totalInvested = safeHoldings.reduce((sum, h) => sum + ((h.avgPrice || 0) * (h.quantity || 0)), 0);
    const currentPortfolioValue = safeHoldings.reduce((sum, h) => {
      const liveAsset = safeMarket.find(m => m.symbol === h.symbol);
      const currentPrice = liveAsset ? liveAsset.price : (h.avgPrice || 0) * 1.12;
      return sum + (currentPrice * (h.quantity || 0));
    }, 0);
    const totalProfit = currentPortfolioValue - totalInvested;
    const roi = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    let healthScore = 75;
    if (safeHoldings.length > 5) healthScore += 10;
    if (roi > 5) healthScore += 5;
    if (user?.riskScore > 8) healthScore -= 5;
    healthScore = Math.min(100, Math.max(0, healthScore));

    const concentration = safeHoldings.map(h => ({
      symbol: h.symbol,
      pct: totalInvested > 0 ? ((h.avgPrice * h.quantity) / totalInvested) * 100 : 0
    })).sort((a, b) => b.pct - a.pct);

    const warnings = [];
    if (concentration[0]?.pct > 50) warnings.push(`High Concentration: ${concentration[0].symbol} makes up ${concentration[0].pct.toFixed(0)}% of your portfolio.`);
    if (safeHoldings.length > 0 && safeHoldings.length < 3) warnings.push("Poor Diversification: Consider adding more assets to reduce systematic risk.");

    const monthlyGrowth = 0.008;
    const scenarioMultipliers = { 'Normal': 1, 'Bull': 1.8, 'Bear': 0.4 };
    const currentWealth = (user?.balance || 0) + currentPortfolioValue;
    const forecastValue = currentWealth * Math.pow(1 + (monthlyGrowth * (scenarioMultipliers[scenario] || 1)), 6);

    const goalTarget = user?.goalAmount || 250000;
    const gap = goalTarget - currentWealth;
    const yearsToGoal = gap > 0 ? (gap / (currentWealth * 0.1 || 1000)).toFixed(1) : 0;

    const rebalanceSteps = [];
    if (concentration[0]?.pct > 40) rebalanceSteps.push(`Trim ${concentration[0].symbol} by 15% and allocate to index funds.`);
    if (user?.balance > 50000) rebalanceSteps.push("Excess Liquidity: Invest 20% of your cash into low-volatility bonds.");

    // Analytics: sector breakdown by asset class (mock logic based on symbol)
    const sectorMap = {};
    safeHoldings.forEach(h => {
      const sector = h.sector || 'Uncategorized';
      if (!sectorMap[sector]) sectorMap[sector] = 0;
      sectorMap[sector] += (h.avgPrice || 0) * (h.quantity || 0);
    });

    return {
      totalInvested, currentPortfolioValue, totalProfit, roi,
      healthScore, warnings, forecastValue, yearsToGoal, rebalanceSteps,
      concentration, currentWealth, sectorMap
    };
  }, [holdings, user, marketData, scenario]);

  const chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  /**
   * Performance Chart Simulation
   * 
   * Generates chart data points by applying scenario multipliers 
   * to historical or base balance history.
   */
  const simulatedChartData = useMemo(() => {
    const base = (balanceHistory && balanceHistory.length > 5)
      ? balanceHistory
      : [85000, 89000, 87000, 92000, 95000, 93000, 98000, 100000, 105000, 103000, 108000, 115000];
    const multiplier = scenario === 'Bull' ? 1.2 : scenario === 'Bear' ? 0.8 : 1;
    return base.map(val => val * multiplier);
  }, [balanceHistory, scenario]);

  // Navigation handlers
  const handleMarketJump = () => navigate('/market');

  if (!user) return (
    <div className="p-20 text-center text-neu-primary font-jakarta bg-neu-bg min-h-screen">
      Initializing Intelligence...
    </div>
  );

  const safeHoldings = holdings || [];
  const safeTransactions = transactions || [];
  const safeMarket = marketData || [];

  return (
    <div className="p-4 md:p-8 pb-32 bg-neu-bg min-h-screen text-neu-primary font-dm-sans selection:bg-neu-accent/30">

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
        <div className="animate-fadeIn">
          <div className="flex items-center gap-3 mb-2">
            <span className="shadow-neu-inset text-neu-accent text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-tighter border border-transparent">System Live</span>
            <span className="bg-emerald-600/20 text-emerald-400 text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-tighter border border-emerald-500/20">AI Synchronized</span>
          </div>
          <h1 className="text-4xl font-black text-neu-primary font-jakarta flex items-center gap-3">
            Wealth Terminal <Activity className="text-neu-accent" size={32} />
          </h1>
          <p className="text-neu-muted font-dm-sans text-sm font-medium">Advanced AI Analytics & Predictive Financial Modeling</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-neu-bg shadow-neu/50 p-1 rounded-2xl border border-transparent">
            {['Overview', 'Analytics', 'History'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === tab ? 'bg-neu-bg shadow-neu-inset text-neu-accent font-jakarta' : 'text-neu-muted font-dm-sans hover:text-neu-primary'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-neu-bg hover:shadow-neu-inset text-neu-primary font-jakarta px-5 py-2.5 rounded-2xl text-xs font-black transition-all border border-transparent shadow-neu"
          >
            <FileText size={16} /> PDF Report
          </button>
        </div>
      </div>

      {/* ─── Overview Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'Overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="bg-neu-bg p-6 rounded-[32px] shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 cursor-pointer relative overflow-hidden group">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black text-neu-muted font-dm-sans uppercase tracking-widest">Portfolio Health</span>
                <div className="p-2 bg-blue-500/10 rounded-xl text-neu-accent"><Shield size={16} /></div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-3xl font-black text-neu-primary font-jakarta">{aiAnalytics.healthScore}%</div>
                <div>
                  <p className="text-xs font-black text-neu-muted font-dm-sans uppercase tracking-tighter">Status</p>
                  <p className="text-sm font-bold text-emerald-400">{aiAnalytics.healthScore > 80 ? 'EXCELLENT' : 'OPTIMAL'}</p>
                </div>
              </div>
            </div>

            <div className="bg-neu-bg p-6 rounded-[32px] shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 cursor-pointer">
              <span className="text-[10px] font-black text-neu-muted font-dm-sans uppercase tracking-widest block mb-4">AI Valuated Net Worth</span>
              <h2 className="text-4xl font-black text-neu-primary font-jakarta mb-2 leading-none tracking-tight">
                ${((user?.balance || 0) + aiAnalytics.currentPortfolioValue).toLocaleString()}
              </h2>
              <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase">
                <ArrowUpRight size={14} /> +$1,240 Today
              </div>
            </div>

            <div className="bg-neu-bg p-6 rounded-[2.5rem] border border-transparent shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 cursor-pointer relative overflow-hidden group">
              <span className="text-[10px] font-black text-neu-accent uppercase tracking-widest block mb-4">6-Month AI Forecast</span>
              <h2 className="text-3xl font-black text-neu-primary font-jakarta mb-2 leading-none tracking-tight">
                ${aiAnalytics.forecastValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h2>
              <p className="text-[10px] text-neu-accent/60 font-bold uppercase">Confidence Level: 84%</p>
            </div>

            <div className="bg-neu-bg p-6 rounded-[32px] shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 cursor-pointer">
              <span className="text-[10px] font-black text-neu-muted font-dm-sans uppercase tracking-widest block mb-4">Goal Estimation</span>
              <div className="flex items-end gap-2 mb-3">
                <h2 className="text-3xl font-black text-neu-primary font-jakarta leading-none">{aiAnalytics.yearsToGoal}</h2>
                <span className="text-neu-muted font-dm-sans font-black mb-1 uppercase text-[10px]">Years to ${(user?.goalAmount || 250000).toLocaleString()}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500"
                  style={{ width: `${Math.min(((user?.balance || 0) / (user?.goalAmount || 250000)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">

              <div className="bg-neu-bg p-6 rounded-[32px] shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 relative">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
                  <h3 className="text-2xl font-black text-neu-primary font-jakarta flex items-center gap-3">
                    <TrendingUp size={24} className="text-neu-accent" /> Performance Modeling
                  </h3>
                  <div className="flex bg-neu-bg p-1.5 rounded-2xl border border-transparent">
                    {['Bear', 'Normal', 'Bull'].map(s => (
                      <button
                        key={s}
                        onClick={() => setScenario(s)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${scenario === s ? 'shadow-neu-inset text-neu-accent font-jakarta' : 'text-neu-muted font-dm-sans hover:text-neu-primary'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-[400px] w-full">
                  <LineChart
                    dataPoints={simulatedChartData}
                    labels={chartLabels}
                    color={scenario === 'Bull' ? '#38B2AC' : scenario === 'Bear' ? '#ef4444' : '#6C63FF'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-neu-bg shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-500 p-7 rounded-[2.5rem] relative overflow-hidden group border border-white/5">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <span className="text-[10px] font-black text-neu-muted font-dm-sans uppercase tracking-widest block mb-1">Portfolio Intelligence</span>
                      <h4 className="text-xl font-black text-neu-primary font-jakarta uppercase tracking-tight">System Alerts</h4>
                    </div>
                    <div className="p-2.5 bg-red-500/10 rounded-2xl text-red-400 shadow-neu-inset">
                      <AlertCircle size={20} />
                    </div>
                  </div>
                  
                  <div className="space-y-4 relative z-10">
                    {aiAnalytics.warnings.length === 0 ? (
                      <div className="flex gap-4 p-4 rounded-[1.5rem] bg-emerald-500/5 border border-emerald-500/10 shadow-neu-inset items-center">
                        <Shield className="text-emerald-400 shrink-0" size={18} />
                        <p className="text-xs text-neu-primary font-bold font-jakarta uppercase tracking-tight">All systems optimal</p>
                      </div>
                    ) : (
                      aiAnalytics.warnings.map((w, i) => (
                        <div key={i} className="flex gap-4 p-5 rounded-[1.8rem] bg-red-500/5 border border-red-500/10 shadow-neu-inset group/alert hover:bg-red-500/10 transition-colors">
                          <AlertCircle className="text-red-400 shrink-0" size={20} />
                          <div>
                            <p className="text-[11px] text-red-400 font-black uppercase tracking-wider mb-1">High Priority</p>
                            <p className="text-xs text-neu-primary font-bold leading-relaxed">{w}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-neu-bg shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-500 p-7 rounded-[2.5rem] relative overflow-hidden group border border-white/5">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <span className="text-[10px] font-black text-neu-muted font-dm-sans uppercase tracking-widest block mb-1">Strategic Advice</span>
                      <h4 className="text-xl font-black text-neu-primary font-jakarta uppercase tracking-tight">AI Suggestions</h4>
                    </div>
                    <div className="p-2.5 bg-neu-accent/10 rounded-2xl text-neu-accent shadow-neu-inset">
                      <Zap size={20} />
                    </div>
                  </div>

                  <div className="space-y-3 relative z-10">
                    {aiAnalytics.rebalanceSteps.length === 0 ? (
                      <div className="p-6 text-center bg-neu-bg shadow-neu-inset rounded-[2rem] border border-white/5">
                        <p className="text-xs text-neu-muted font-black uppercase tracking-widest">Equilibrium Achieved</p>
                      </div>
                    ) : (
                      aiAnalytics.rebalanceSteps.map((step, i) => (
                        <div key={i} className="flex items-center justify-between p-5 rounded-[1.8rem] bg-neu-bg shadow-neu hover:shadow-neu-inset transition-all cursor-pointer group/step border border-transparent hover:border-neu-accent/20">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-xl bg-neu-bg shadow-neu flex items-center justify-center text-neu-accent group-hover/step:rotate-12 transition-transform">
                              <Target size={14} />
                            </div>
                            <p className="text-xs text-neu-primary font-bold font-jakarta leading-tight max-w-[180px]">{step}</p>
                          </div>
                          <div className="p-2 bg-neu-bg shadow-neu rounded-full text-neu-muted group-hover/step:text-neu-accent group-hover/step:translate-x-1 transition-all">
                            <ChevronRight size={14} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="bg-neu-bg shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 p-8 rounded-[3rem] border border-transparent">
                <h4 className="text-neu-primary font-jakarta font-black text-sm uppercase tracking-wider mb-8 flex items-center gap-2">
                  <Sparkles size={18} className="text-neu-accent" /> Strategy Profile
                </h4>
                <div className="space-y-6">
                  <div className="flex gap-4 p-5 rounded-2xl bg-neu-bg shadow-neu-inset">
                    <Zap className="text-yellow-400 shrink-0" size={20} />
                    <div>
                      <p className="text-neu-primary font-jakarta font-bold text-xs mb-1">Growth Pattern</p>
                      <p className="text-[10px] text-neu-muted font-dm-sans leading-relaxed">System detects high-utility focus with growth objectives.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-neu-bg p-6 rounded-[32px] shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300">
                <h4 className="text-neu-primary font-jakarta font-black text-sm uppercase tracking-wider mb-10 flex items-center gap-2">
                  <Layers size={18} className="text-purple-400" /> Sector Analysis
                </h4>
                <div className="h-64 flex items-center justify-center">
                  {safeHoldings.length > 0 ? (
                    <AllocationChart suggestions={safeHoldings.map(h => ({ asset_name: h.symbol, weight: h.quantity }))} />
                  ) : (
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30">No Data Available</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neu-bg p-6 rounded-[32px] shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 overflow-hidden">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black text-neu-primary font-jakarta">Live Portfolio Ledger</h2>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-neu-muted font-dm-sans text-[10px] font-black uppercase border-b border-transparent">
                  <tr>
                    <th className="pb-6">Ticker</th>
                    <th className="pb-6">Position</th>
                    <th className="pb-6 text-right">Cost</th>
                    <th className="pb-6 text-right">Market</th>
                    <th className="pb-6 text-right">P/L</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {safeHoldings.map((h, i) => {
                    const live = safeMarket.find(m => m.symbol === h.symbol);
                    const curPrice = live ? live.price : (h.avgPrice || 0) * 1.12;
                    const change = h.avgPrice && h.avgPrice !== 0 ? ((curPrice - h.avgPrice) / h.avgPrice) * 100 : 0;
                    return (
                      <tr
                        key={i}
                        className="border-b border-transparent/50 hover:bg-slate-800/20 transition-all cursor-pointer"
                        onClick={() => navigate('/market')}
                      >
                        <td className="py-6 font-black text-neu-primary font-jakarta uppercase">{h.symbol}</td>
                        <td className="py-6 font-bold text-neu-muted font-dm-sans">{h.quantity}</td>
                        <td className="py-6 text-right font-bold text-neu-muted font-dm-sans">${(Number(h.avgPrice) || 0).toFixed(2)}</td>
                        <td className="py-6 text-right font-black text-neu-primary font-jakarta">${(Number(curPrice) || 0).toFixed(2)}</td>
                        <td className="py-6 text-right">
                          <span className={`px-4 py-1.5 rounded-xl font-black text-[10px] ${(change || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {(change || 0) >= 0 ? '+' : ''}{(change || 0).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Analytics Tab (FIXED: was missing) ────────────────────────────── */}
      {activeTab === 'Analytics' && (
        <div className="space-y-8">

          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neu-bg p-6 rounded-[32px] shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 cursor-pointer">
              <span className="text-[10px] font-black text-neu-muted font-dm-sans uppercase tracking-widest block mb-4">Total Invested</span>
              <h2 className="text-3xl font-black text-neu-primary font-jakarta">${aiAnalytics.totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h2>
            </div>
            <div className="bg-neu-bg p-6 rounded-[32px] shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 cursor-pointer">
              <span className="text-[10px] font-black text-neu-muted font-dm-sans uppercase tracking-widest block mb-4">Total P&L</span>
              <h2 className={`text-3xl font-black ${aiAnalytics.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {aiAnalytics.totalProfit >= 0 ? '+' : ''}${aiAnalytics.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h2>
            </div>
            <div className="bg-neu-bg p-6 rounded-[32px] shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 cursor-pointer">
              <span className="text-[10px] font-black text-neu-muted font-dm-sans uppercase tracking-widest block mb-4">Return on Investment</span>
              <h2 className={`text-3xl font-black ${aiAnalytics.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {aiAnalytics.roi >= 0 ? '+' : ''}{aiAnalytics.roi.toFixed(2)}%
              </h2>
            </div>
          </div>

          {/* Concentration Breakdown */}
          <div className="bg-neu-bg p-6 rounded-[32px] shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300">
            <h3 className="text-2xl font-black text-neu-primary font-jakarta mb-8 flex items-center gap-3">
              <BarChart size={22} className="text-purple-400" /> Asset Concentration
            </h3>
            <div className="space-y-5">
              {aiAnalytics.concentration.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-black text-neu-primary font-jakarta uppercase">{item.symbol}</span>
                    <span className="text-xs font-bold text-neu-muted font-dm-sans">{item.pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
              {aiAnalytics.concentration.length === 0 && (
                <p className="text-neu-muted font-dm-sans text-sm font-medium">No holdings to analyze.</p>
              )}
            </div>
          </div>

          {/* Risk vs Return Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-neu-bg p-6 rounded-[32px] shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300">
              <h4 className="text-neu-primary font-jakarta font-black text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                <Target size={18} className="text-yellow-400" /> Risk Profile
              </h4>
              <div className="space-y-4">
                {[
                  { label: 'Risk Score', value: user?.riskScore ?? 0, max: 10, color: 'from-yellow-500 to-red-500' },
                  { label: 'Portfolio Health', value: aiAnalytics.healthScore, max: 100, color: 'from-blue-500 to-emerald-500' },
                  { label: 'Diversification', value: Math.min(safeHoldings.length * 10, 100), max: 100, color: 'from-purple-500 to-blue-500' },
                ].map(({ label, value, max, color }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-bold text-neu-muted font-dm-sans">{label}</span>
                      <span className="text-xs font-black text-neu-primary font-jakarta">{value}/{max}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${color}`}
                        style={{ width: `${(value / max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-neu-bg p-6 rounded-[32px] shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300">
              <h4 className="text-neu-primary font-jakarta font-black text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                <Globe size={18} className="text-neu-accent" /> Wealth Snapshot
              </h4>
              <div className="space-y-4 text-sm">
                {[
                  { label: 'Cash Balance', value: `$${(user?.balance || 0).toLocaleString()}` },
                  { label: 'Portfolio Value', value: `$${aiAnalytics.currentPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                  { label: 'Total Net Worth', value: `$${aiAnalytics.currentWealth.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                  { label: `Goal ($${(user?.goalAmount || 250000).toLocaleString()}) Progress`, value: `${Math.min(((aiAnalytics.currentWealth / (user?.goalAmount || 250000)) * 100), 100).toFixed(1)}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-3 border-b border-transparent">
                    <span className="text-neu-muted font-dm-sans font-medium">{label}</span>
                    <span className="text-neu-primary font-jakarta font-black">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── History Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'History' && (
        <div className="bg-neu-bg p-6 rounded-[32px] shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 overflow-hidden">
          <h2 className="text-2xl font-black text-neu-primary font-jakarta mb-10">Transaction Audit</h2>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-neu-muted font-dm-sans text-[10px] font-black uppercase border-b border-transparent">
                <tr>
                  <th className="pb-6">Type</th>
                  <th className="pb-6">Asset</th>
                  <th className="pb-6">Qty</th>
                  <th className="pb-6 text-right">Price</th>
                  <th className="pb-6 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {safeTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-neu-muted font-dm-sans font-bold">No transactions found.</td>
                  </tr>
                ) : (
                  safeTransactions.map((tx, i) => (
                    <tr key={i} className="border-b border-transparent/50 hover:bg-slate-800/10">
                      <td className={`py-6 font-black text-[10px] ${tx.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{tx.type}</td>
                      <td className="py-6 font-black text-neu-primary font-jakarta uppercase">{tx.symbol}</td>
                      <td className="py-6 font-bold text-neu-muted font-dm-sans">{tx.quantity}</td>
                      <td className="py-6 text-right font-black text-slate-200">${tx.price?.toFixed(2)}</td>
                      <td className="py-6 text-right text-neu-muted font-dm-sans text-xs font-bold">{new Date(tx.date).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
