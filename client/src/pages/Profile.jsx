import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Shield,
  Target,
  TrendingUp,
  Activity,
  Bell,
  Lock,
  ChevronRight,
  CheckCircle2,
  Wallet,
  PieChart as PieIcon,
  Fingerprint,
  Smartphone,
  Info,
  Zap,
  Star,
  Layers,
  ArrowRight,
  LineChart as StocksIcon,
  Bitcoin,
  Coins,
  Briefcase,
  History as HistoryIcon
} from 'lucide-react';
import { useUser } from "../context/UserContext";

/**
 * Profile Page Component
 * 
 * Provides a comprehensive view of the user's investment profile, including:
 * - Identity and account information
 * - Financial health scoring
 * - Risk tolerance configuration
 * - Portfolio preferences and settings
 * - Navigation hub to other system components
 */
export default function Profile() {
  // --- Context & Navigation ---
  const { user, holdings, transactions, setUser } = useUser();
  const navigate = useNavigate();

  // --- State Management ---
  const [editing, setEditing] = useState(false); // Controls edit mode for account parameters
  const [formData, setFormData] = useState({
    name: user?.name || "Guest User",
    email: user?.email || "user@example.com",
    risk: user?.riskScore || 5
  });
  const [saved, setSaved] = useState(false); // Controls success feedback animation

  /**
   * Tracks if the form data has changed from the original user data
   * Used to enable/disable the save button
   */
  const isChanged = useMemo(() => {
    return (
      formData.name !== (user?.name || "Guest User") ||
      formData.email !== (user?.email || "user@example.com") ||
      formData.risk !== (user?.riskScore || 5)
    );
  }, [formData, user]);

  // Keep form in sync with global user context
  useEffect(() => {
    if (user && !editing) {
      setFormData({
        name: user.name || "Guest User",
        email: user.email || "user@example.com",
        risk: user.riskScore || 5
      });
    }
  }, [user, editing]);

  // Toggles for Preferences
  const [prefs, setPrefs] = useState({
    stocks: true,
    crypto: true,
    etfs: false,
    bonds: false
  });

  // Notification Switches
  const [notifs, setNotifs] = useState({
    priceAlerts: true,
    portfolioUpdates: true,
    marketNews: false
  });

  // Security Toggles
  const [security, setSecurity] = useState({
    twoFactor: false
  });

  // --- Derived Data & Analytics ---

  /**
   * Categorizes the investor based on their risk score (1-10)
   * Defines UI colors and labels for branding consistency
   */
  const investorType = useMemo(() => {
    if (formData.risk <= 3) return { type: "Conservative", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    if (formData.risk <= 7) return { type: "Balanced", color: "text-neu-accent", bg: "bg-blue-500/10", border: "border-blue-500/20" };
    return { type: "Aggressive", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
  }, [formData.risk]);

  /**
   * Calculates a mock Financial Health Score based on user metrics
   * (Balance, Diversification, Transaction Frequency)
   */
  const healthScore = useMemo(() => {
    let score = 5;
    const balance = user?.balance || 0;
    const holdingsCount = (holdings || []).length;
    const txCount = (transactions || []).length;

    if (balance > 50000) score += 2;
    if (holdingsCount > 3) score += 2;
    if (txCount > 10) score += 1;
    return Math.min(10, score);
  }, [user?.balance, holdings, transactions]);

  // 3. Behavioral Insights
  const behavioralInsight = useMemo(() => {
    if (formData.risk >= 8) return "High-Conviction Strategist: You prefer high-reward assets and are comfortable with market volatility.";
    if (formData.risk <= 3) return "Wealth Preserver: Your focus is on steady, long-term stability and capital protection.";
    return "Balanced Growth Seeker: You maintain a healthy mix of growth and stability in your portfolio.";
  }, [formData.risk]);

  /**
   * Aggregates account-wide statistics for the Account Hub section
   */
  const stats = useMemo(() => {
    const totalInvested = (holdings || []).reduce((acc, h) => acc + (h.avgPrice * h.quantity), 0);
    return {
      totalInvested,
      totalTrades: (transactions || []).length,
      avgReturn: "+12.4%" // Mocked for UI demonstration
    };
  }, [holdings, transactions]);

  /**
   * Saves updated profile parameters to the global UserContext
   */
  const handleSave = () => {
    setUser(prev => ({
      ...prev,
      name: formData.name,
      email: formData.email,
      riskScore: formData.risk,
      category: investorType.type
    }));
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000); // Auto-dismiss success message
  };

  return (
    <div className="p-4 md:p-8 pb-32 bg-neu-bg shadow-neu-inset border-transparent min-h-screen text-neu-primary font-dm-sans font-sans animate-fadeIn">

      {/* ─── TOP SECTION: PROFILE HEADER ─── */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">

        {/* Main Identity Card */}
        <div className="lg:col-span-8 bg-neu-bg shadow-neu p-8 rounded-[2.5rem] border border-transparent shadow-2xl relative overflow-hidden group">
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-1 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                <div className="w-full h-full rounded-full bg-neu-bg shadow-neu flex items-center justify-center text-4xl font-black text-neu-primary font-jakarta">
                  {formData.name.charAt(0)}
                </div>
              </div>
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#1e293b] shadow-lg" />
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h1 className="text-3xl font-black text-neu-primary font-jakarta tracking-tighter">{formData.name}</h1>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${investorType.bg} ${investorType.color} ${investorType.border}`}>
                  {investorType.type} Investor
                </span>
              </div>
              <p className="text-neu-muted font-dm-sans font-medium flex items-center justify-center md:justify-start gap-2">
                <Mail size={16} className="text-neu-accent" /> {formData.email}
              </p>

              <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4">
                <button
                  onClick={() => {
                    if (editing) {
                      setFormData({
                        name: user?.name || "Guest User",
                        email: user?.email || "user@example.com",
                        risk: user?.riskScore || 5
                      });
                      setEditing(false);
                    } else {
                      setEditing(true);
                      setTimeout(() => {
                        document.getElementById('account-parameters')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }
                  }}
                  className="px-6 py-2 bg-neu-bg shadow-neu hover:shadow-neu-inset text-neu-primary font-jakarta rounded-xl text-xs font-black transition-all"
                >
                  {editing ? "Cancel Edit" : "Edit Profile"}
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-neu-bg shadow-neu-inset rounded-xl border border-transparent text-xs font-bold text-emerald-500">
                  <CheckCircle2 size={14} /> Verified Identity
                </div>
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
        </div>

        {/* Financial Summary Card */}
        <div className="lg:col-span-4 bg-neu-bg shadow-neu p-8 rounded-[2.5rem] border border-transparent shadow-2xl flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs font-black text-neu-muted font-dm-sans uppercase tracking-widest">Health Score</h3>
            <Zap size={18} className="text-yellow-400" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-6xl font-black text-neu-primary font-jakarta leading-none">{healthScore}</span>
            <span className="text-xl font-bold text-neu-muted font-dm-sans mb-2">/ 10</span>
          </div>
          <div className="mt-6">
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-1000 relative" style={{ width: `${healthScore * 10}%` }} />
            </div>
            <p className="text-[10px] text-neu-muted font-dm-sans mt-3 font-bold uppercase tracking-tighter">Your financial health is {healthScore >= 7 ? 'Excellent' : 'Stable'}</p>
          </div>
        </div>
      </div>

      {/* ─── MIDDLE SECTION: GRID ─── */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">

        <div className="bg-neu-bg shadow-neu p-8 rounded-[2.5rem] border border-transparent shadow-xl relative overflow-hidden">
          <h3 className="text-xs font-black text-neu-primary font-jakarta uppercase tracking-widest flex items-center gap-2 mb-8">
            <Shield size={16} className="text-neu-accent" /> Risk Architecture
          </h3>
          
          <div className="flex gap-1.5 h-3 mb-6">
            {Array.from({ length: 10 }).map((_, i) => {
              const active = i < formData.risk;
              const color = formData.risk <= 3 ? 'bg-emerald-500' : formData.risk <= 7 ? 'bg-blue-500' : 'bg-red-500';
              return (
                <div 
                  key={i} 
                  className={`flex-1 rounded-sm transition-all duration-500 ${active ? color : 'bg-slate-800'}`}
                  style={{ opacity: active ? (i + 1) / formData.risk : 1 }}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="space-y-1">
              <p className="text-[8px] font-black text-neu-muted font-dm-sans uppercase tracking-widest">Volatility Threshold</p>
              <p className="text-sm font-bold text-neu-primary font-jakarta">{formData.risk * 4.5}% <span className="text-[10px] text-neu-muted font-dm-sans font-medium">Est.</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black text-neu-muted font-dm-sans uppercase tracking-widest">Loss Tolerance</p>
              <p className="text-sm font-bold text-neu-primary font-jakarta">-{formData.risk * 3}% <span className="text-[10px] text-neu-muted font-dm-sans font-medium">Limit</span></p>
            </div>
          </div>

          <div className="p-4 bg-neu-bg shadow-neu-inset rounded-2xl border border-transparent relative z-10">
            <p className="text-[10px] text-neu-muted font-dm-sans font-medium leading-relaxed italic">
              "{behavioralInsight}"
            </p>
          </div>

          <Shield size={120} className="absolute -bottom-10 -right-10 text-neu-primary font-jakarta/[0.02] -rotate-12" />
        </div>

        {/* Investment Goals */}
        <div className="bg-neu-bg shadow-neu p-8 rounded-[2.5rem] border border-transparent shadow-xl">
          <h3 className="text-xs font-black text-neu-primary font-jakarta uppercase tracking-widest flex items-center gap-2 mb-8">
            <Target size={16} className="text-purple-400" /> Strategic Goals
          </h3>
          <div className="space-y-6">
            {[
              { name: "Retirement Fund", target: "$500k", prog: 34, color: "bg-blue-500" },
              { name: "Global Estate", target: "$1.2M", prog: 12, color: "bg-purple-500" }
            ].map(goal => (
              <div key={goal.name}>
                <div className="flex justify-between mb-2">
                  <span className="text-[10px] font-black text-neu-primary font-jakarta uppercase tracking-tight">{goal.name}</span>
                  <span className="text-[10px] font-black text-neu-muted font-dm-sans">{goal.target}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className={`h-full ${goal.color}`} style={{ width: `${goal.prog}%` }} />
                </div>
                <p className="text-[9px] text-neu-muted font-dm-sans mt-1.5 font-bold">{goal.prog}% complete</p>
              </div>
            ))}
          </div>
        </div>

        {/* Account Stats */}
        <div className="bg-neu-bg shadow-neu p-8 rounded-[2.5rem] border border-transparent shadow-xl">
          <h3 className="text-xs font-black text-neu-primary font-jakarta uppercase tracking-widest flex items-center gap-2 mb-8">
            <Activity size={16} className="text-emerald-400" /> Account Hub
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-neu-bg shadow-neu-inset rounded-2xl border border-transparent">
              <p className="text-[8px] text-neu-muted font-dm-sans font-black uppercase mb-1">Total Invested</p>
              <p className="text-lg font-black text-neu-primary font-jakarta">${stats.totalInvested.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-neu-bg shadow-neu-inset rounded-2xl border border-transparent">
              <p className="text-[8px] text-neu-muted font-dm-sans font-black uppercase mb-1">Total Trades</p>
              <p className="text-lg font-black text-neu-primary font-jakarta">{stats.totalTrades}</p>
            </div>
            <div className="p-4 bg-neu-bg shadow-neu-inset rounded-2xl border border-transparent">
              <p className="text-[8px] text-neu-muted font-dm-sans font-black uppercase mb-1">Avg Return</p>
              <p className="text-lg font-black text-emerald-400">{stats.avgReturn}</p>
            </div>
            <div className="p-4 bg-neu-bg shadow-neu-inset rounded-2xl border border-transparent">
              <p className="text-[8px] text-neu-muted font-dm-sans font-black uppercase mb-1">Risk Score</p>
              <p className="text-lg font-black text-neu-accent">{formData.risk}/10</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM SECTION: CONTROLS ─── */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

        <div className="space-y-8">
          <div className="bg-neu-bg shadow-neu p-8 rounded-[2.5rem] border border-transparent shadow-xl">
            <h3 className="text-xs font-black text-neu-primary font-jakarta uppercase tracking-widest flex items-center gap-2 mb-8">
              <Layers size={16} className="text-indigo-400" /> Asset Preferences
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'stocks', icon: <StocksIcon size={14} />, label: 'Stocks' },
                { key: 'crypto', icon: <Bitcoin size={14} />, label: 'Crypto' },
                { key: 'etfs', icon: <Layers size={14} />, label: 'ETFs' },
                { key: 'bonds', icon: <Briefcase size={14} />, label: 'Bonds' }
              ].map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${prefs[key] ? 'bg-neu-bg shadow-neu-inset text-neu-accent border-transparent' : 'bg-neu-bg shadow-neu border-transparent text-neu-muted font-dm-sans hover:text-neu-primary hover:shadow-neu-inset'}`}
                >
                  <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-neu-bg shadow-neu p-8 rounded-[2.5rem] border border-transparent shadow-xl">
            <h3 className="text-xs font-black text-neu-primary font-jakarta uppercase tracking-widest flex items-center gap-2 mb-8">
              <Bell size={16} className="text-yellow-500" /> Communications
            </h3>
            <div className="space-y-4">
              {Object.entries(notifs).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between p-2">
                  <p className="text-xs font-bold text-neu-primary font-jakarta capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <button
                    onClick={() => setNotifs(n => ({ ...n, [key]: !val }))}
                    className={`w-10 h-5 rounded-full relative transition-all duration-300 ${val ? 'bg-emerald-500' : 'bg-slate-800'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${val ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* System Hub */}
          <div className="bg-neu-bg shadow-neu p-8 rounded-[2.5rem] border border-transparent shadow-xl">
            <h3 className="text-xs font-black text-neu-primary font-jakarta uppercase tracking-widest flex items-center gap-2 mb-8">
              <Activity size={16} className="text-neu-accent" /> Strategic Hub
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Dashboard', path: '/dashboard', icon: <PieIcon size={16} />, color: 'bg-blue-500/10 text-neu-accent' },
                { name: 'Market Feed', path: '/market', icon: <TrendingUp size={16} />, color: 'bg-emerald-500/10 text-emerald-400' },
                { name: 'Audit History', path: '/history', icon: <HistoryIcon size={16} />, color: 'bg-purple-500/10 text-purple-400' },
                { name: 'AI Advisor', path: '/ai', icon: <User size={16} />, color: 'bg-indigo-500/10 text-indigo-400' },
                { name: 'Simulator', path: '/simulator', icon: <Activity size={16} />, color: 'bg-orange-500/10 text-orange-400' },
                { name: 'Trade Desk', path: '/input', icon: <Wallet size={16} />, color: 'bg-slate-800 text-neu-primary font-jakarta' }
              ].map(link => (
                <button
                  key={link.name}
                  onClick={() => navigate(link.path)}
                  className="flex items-center gap-3 p-4 bg-neu-bg shadow-neu rounded-2xl border border-transparent hover:shadow-neu-hover hover:-translate-y-1 transition-all group"
                >
                  <div className={`p-2 rounded-xl bg-neu-bg shadow-neu-inset ${link.color.split(' ')[1]}`}>{link.icon}</div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-neu-muted font-dm-sans group-hover:text-neu-primary font-jakarta">{link.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div id="account-parameters" className={`bg-neu-bg shadow-neu p-8 rounded-[2.5rem] border border-transparent shadow-xl transition-all duration-500 ${editing ? 'ring-2 ring-blue-500/50 scale-[1.02]' : 'opacity-80'}`}>
            <h3 className="text-xs font-black text-neu-primary font-jakarta uppercase tracking-widest flex items-center gap-2 mb-8">
              <User size={16} className="text-neu-muted font-dm-sans" /> Account Parameters
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-neu-muted font-dm-sans uppercase mb-2 block">Full Name</label>
                <input
                  disabled={!editing}
                  className={`w-full bg-neu-bg shadow-neu-inset rounded-[1.5rem] py-4 px-6 text-sm font-jakarta font-bold outline-none transition-all ${
                    editing ? 'text-neu-accent border border-neu-accent/30 focus:ring-1 focus:ring-neu-accent/20' : 'text-neu-primary border border-transparent opacity-60'
                  }`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
                  <div>
                    <label className="text-[10px] font-black text-neu-muted font-dm-sans uppercase mb-2 block">Email Address</label>
                    <input
                      disabled={!editing}
                      type="email"
                      className={`w-full bg-neu-bg shadow-neu-inset rounded-[1.5rem] py-4 px-6 text-sm font-jakarta font-bold outline-none transition-all ${
                        editing ? 'text-neu-accent border border-neu-accent/30 focus:ring-1 focus:ring-neu-accent/20' : 'text-neu-primary border border-transparent opacity-60'
                      }`}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-neu-muted font-dm-sans uppercase mb-2 block">Risk Intensity ({formData.risk})</label>
                    <div className={`px-4 py-3 bg-neu-bg shadow-neu-inset rounded-[1.5rem] transition-all border ${editing ? 'border-neu-accent/30' : 'border-transparent opacity-60'}`}>
                      <input
                        disabled={!editing}
                        type="range" min="1" max="10"
                        className={`w-full h-1.5 bg-neu-bg shadow-neu rounded-lg appearance-none cursor-pointer accent-neu-accent transition-all`}
                        value={formData.risk}
                        onChange={(e) => setFormData({ ...formData, risk: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  {editing && (
                    <div className="space-y-4 pt-4">
                      <button
                        onClick={handleSave}
                        disabled={!isChanged || !formData.name.trim()}
                        className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          isChanged && formData.name.trim()
                            ? 'bg-neu-bg shadow-neu hover:shadow-neu-inset text-neu-primary active:scale-[0.98]' 
                            : 'bg-slate-800 text-neu-muted cursor-not-allowed opacity-50'
                        }`}
                      >
                        Save Configuration
                      </button>
                      {!isChanged ? (
                        <p className="text-[10px] text-neu-muted font-bold text-center uppercase tracking-widest animate-pulse">No changes detected</p>
                      ) : !formData.name.trim() ? (
                        <p className="text-[10px] text-red-400 font-bold text-center uppercase tracking-widest">Name cannot be empty</p>
                      ) : null}
                    </div>
                  )}
              {saved && (
                <p className="text-emerald-400 text-xs font-bold mt-2 flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 size={14} /> Profile updated successfully
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
