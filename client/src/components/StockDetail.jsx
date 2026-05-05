import { useState, useEffect, useMemo } from 'react';

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { X, TrendingUp, TrendingDown, ShoppingCart, DollarSign, BarChart2, Calendar, ArrowUpRight, ArrowDownRight, AlertCircle, Wallet, Activity, Plus, Minus } from 'lucide-react';
import { useUser } from '../context/UserContext';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend);

const PERIODS = ['1w', '1mo', '3mo', '6mo', '1y', '5y'];

function fmt(num, decimals = 2) {
  if (!num && num !== 0) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtMarketCap(n) {
  if (!n) return 'N/A';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n}`;
}

function fmtVolume(n) {
  if (!n) return 'N/A';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n;
}

/**
 * StockDetail Overlay Component
 * 
 * Provides an in-depth view of a specific asset, including:
 * - Real-time price and performance visualization (Chart.js)
 * - Historical data modeling for various time periods
 * - Comprehensive market metrics (Cap, PE, 52W High/Low)
 * - Interactive Trading Desk for BUY and SELL orders
 * - Portfolio integration via UserContext
 */
export default function StockDetail({ stock, onClose }) {
  // --- Context & Navigation ---
  const { symbol, name } = stock;
  const { user, holdings, buyStock, sellStock } = useUser();

  // --- Data & Loading State ---
  const [data, setData] = useState(null); // Detailed market and history data
  const [loading, setLoading] = useState(true); // Fetching state
  const [period, setPeriod] = useState('6mo'); // Active chart time range (1w, 1mo, etc.)

  // --- Trading State ---
  const [quantity, setQuantity] = useState(1); // Amount of shares to trade
  const [orderType, setOrderType] = useState('Market'); // Market or Limit
  const [limitPrice, setLimitPrice] = useState(''); // Specific price for limit orders
  const [activeTab, setActiveTab] = useState('BUY'); // BUY or SELL mode toggle
  const [status, setStatus] = useState({ success: false, message: '', type: '' }); // Transaction feedback

  // Get current holding for this symbol
  const currentHolding = useMemo(() => holdings.find(h => h.symbol === symbol), [holdings, symbol]);

  /**
   * History Simulation Effect
   * 
   * Fetches/Simulates historical price points and detailed metrics 
   * whenever the selected period or symbol changes.
   */
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        // Simulation of network request
        await new Promise(resolve => setTimeout(resolve, 600)); 
        const points = period === '1w' ? 7 : period === '1mo' ? 30 : period === '3mo' ? 90 : period === '6mo' ? 180 : period === '1y' ? 365 : 1825;
        const currentPrice = stock.price || 150;
        let volatility = stock.sector === 'Crypto' ? 0.05 : 0.02;
        let history = [];
        let price = currentPrice;
        
        // Algorithmic random walk to generate historical trend
        for (let i = points; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          history.push({
            date: date.toISOString().split('T')[0],
            close: price
          });
          price = price / (1 + (Math.random() * volatility * 2 - volatility));
        }

        const firstPrice = history[0].close;
        const lastPrice = history[history.length - 1].close;
        const change = lastPrice - firstPrice;
        const changePercent = (change / firstPrice) * 100;

        setData({
          symbol: stock.symbol,
          name: stock.name,
          price: lastPrice,
          change: change.toFixed(2),
          changePercent: changePercent.toFixed(2),
          currency: 'USD',
          marketCap: currentPrice * 1000000000 * (1 + Math.random()),
          pe: 15 + Math.random() * 20,
          high: lastPrice * 1.05,
          low: lastPrice * 0.95,
          fiftyTwoWeekHigh: lastPrice * 1.3,
          fiftyTwoWeekLow: lastPrice * 0.7,
          volume: 5000000 + Math.random() * 10000000,
          history: history
        });
      } catch (err) {
        console.error("❌ History Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [symbol, period, stock]);

  const isPositive = data ? (data.changePercent || 0) >= 0 : true;
  const chartColor = isPositive ? '#34d399' : '#f87171';

  const chartData = data ? {
    labels: data.history.map(h => {
      const d = new Date(h.date);
      return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
    }),
    datasets: [{
      label: 'Price',
      data: data.history.map(h => h.close),
      borderColor: chartColor,
      backgroundColor: isPositive ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: chartColor,
      borderWidth: 2,
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        titleColor: '#64748b',
        bodyColor: '#1e293b',
        callbacks: {
          label: ctx => ` $${ctx.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.03)' },
        ticks: { color: '#64748b', font: { size: 11 }, maxTicksLimit: 8 }
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { color: '#64748b', font: { size: 11 }, callback: val => `$${val.toFixed(0)}` }
      }
    }
  };

  /**
   * Order Execution Logic
   * 
   * Processes the BUY or SELL request through the UserContext
   * providing instant feedback to the user.
   */
  const handleTransaction = () => {
    const currentPrice = data?.price || stock.price;
    
    if (!currentPrice) {
      setStatus({ success: false, message: 'Current price not available. Please wait...', type: activeTab });
      return;
    }

    const tradePrice = orderType === 'Limit' && limitPrice ? parseFloat(limitPrice) : currentPrice;
    if (isNaN(tradePrice) || tradePrice <= 0) {
        setStatus({ success: false, message: 'Invalid trade price', type: activeTab });
        return;
    }

    let result;
    if (activeTab === 'BUY') {
      result = buyStock({ symbol, name: data?.name || stock.name }, quantity, tradePrice);
    } else {
      result = sellStock(symbol, quantity, tradePrice);
    }
    
    setStatus({ 
      success: result.success, 
      message: result.success 
        ? `Successfully ${activeTab === 'BUY' ? 'bought' : 'sold'} ${quantity} shares!` 
        : result.message,
      type: activeTab
    });
    
    // Auto-dismiss feedback message after success
    if (result.success) {
      setTimeout(() => {
          setStatus({ success: false, message: '', type: '' });
          if (activeTab === 'BUY') setQuantity(1);
      }, 3000);
    }
  };

  const tradeValue = (data || stock.price)
    ? ((orderType === 'Limit' && limitPrice ? parseFloat(limitPrice) : (data?.price || stock.price)) * (parseInt(quantity) || 0)).toFixed(2)
    : '0.00';

  return (
    <div
      className="fixed inset-0 z-50 flex"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative ml-auto w-full max-w-4xl h-full bg-neu-bg border-l border-transparent overflow-y-auto flex flex-col animate-slideIn text-neu-primary font-dm-sans selection:bg-neu-accent/30">

        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-neu-bg/95 backdrop-blur border-b border-transparent shadow-sm px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-neu-accent flex items-center justify-center text-white font-bold text-sm uppercase shadow-md">
              {symbol.slice(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-neu-primary font-jakarta">{data?.name || name}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-neu-bg shadow-neu-inset text-neu-muted px-2 py-0.5 rounded font-mono uppercase tracking-widest">{symbol}</span>
                {currentHolding && (
                  <span className="text-[10px] bg-blue-500/10 text-neu-accent px-2 py-0.5 rounded font-bold">
                    OWNED: {currentHolding.quantity}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-neu-bg shadow-neu hover:shadow-neu-inset transition-all text-neu-muted hover:text-neu-primary border border-transparent">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 px-8 py-6 flex flex-col gap-8">

          {/* Price Hero */}
          {loading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-slate-200 rounded w-40 mb-3"></div>
              <div className="h-5 bg-slate-200 rounded w-24"></div>
            </div>
          ) : data && (
            <div className="flex items-end gap-6">
              <div>
                <p className="text-5xl font-black text-neu-primary font-jakarta tracking-tighter">
                  {data.currency === 'INR' ? '₹' : '$'}{fmt(data.price)}
                </p>
                <div className={`flex items-center gap-2 mt-2 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isPositive ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  <span className="text-base font-bold">
                    {isPositive ? '+' : ''}{fmt(data.change)} ({isPositive ? '+' : ''}{fmt(data.changePercent)}%)
                  </span>
                  <span className="text-neu-muted font-dm-sans text-sm ml-2">Market is open</span>
                </div>
              </div>
            </div>
          )}

          {/* Period Selector */}
          <div className="flex gap-2">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${period === p ? 'bg-neu-accent text-white shadow-md' : 'bg-neu-bg shadow-neu hover:shadow-neu-inset text-neu-muted hover:text-neu-primary border border-transparent'}`}>
                {p}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-neu-bg rounded-[2.5rem] p-6 border border-transparent shadow-neu">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : chartData ? (
              <div style={{ height: '300px' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            ) : null}
          </div>

          {/* Trade Control Panel */}
          {(data || stock.price) && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Order Form */}
              <div className="lg:col-span-7 bg-neu-bg border border-transparent rounded-[2.5rem] p-8 shadow-neu">
                <div className="flex items-center gap-2 mb-8 bg-neu-bg shadow-neu-inset p-1.5 rounded-2xl border border-transparent">
                  {['BUY', 'SELL'].map(type => (
                    <button 
                      key={type}
                      onClick={() => setActiveTab(type)}
                      className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                        activeTab === type 
                          ? (type === 'BUY' ? 'bg-emerald-500 text-white shadow-md' : 'bg-red-500 text-white shadow-md') 
                          : 'text-neu-muted hover:text-neu-primary'
                      }`}
                    >
                      {type} ORDER
                    </button>
                  ))}
                </div>

                {status.message && (
                  <div className={`mb-6 rounded-2xl p-4 text-sm font-bold flex items-center gap-2 border animate-pulse ${
                    status.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500'
                  }`}>
                    {status.success ? '✅' : <AlertCircle size={16}/>} {status.message}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Stats Row */}
                  <div className="flex justify-between items-center bg-neu-bg shadow-neu p-4 rounded-2xl border border-transparent">
                    <div className="text-center px-4">
                      <p className="text-[10px] text-neu-muted font-black uppercase mb-1">Available</p>
                      <p className="text-neu-primary font-bold">${user.balance.toLocaleString()}</p>
                    </div>
                    <div className="w-[1px] h-8 bg-slate-300" />
                    <div className="text-center px-4">
                      <p className="text-[10px] text-neu-muted font-black uppercase mb-1">Owned</p>
                      <p className="text-neu-primary font-bold">{currentHolding?.quantity || 0} Shares</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-neu-muted text-[10px] font-black uppercase mb-2 block tracking-widest">Order Mode</label>
                      <select 
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value)}
                        className="w-full bg-neu-bg shadow-neu-inset border border-transparent rounded-xl px-4 py-3 text-sm text-neu-primary font-bold outline-none focus:border-blue-500 transition-colors"
                      >
                        <option>Market</option>
                        <option>Limit</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-neu-muted text-[10px] font-black uppercase tracking-widest">Quantity</label>
                        <div className="flex gap-1">
                          {[25, 50, 100].map(pct => (
                            <button
                              key={pct}
                              onClick={() => {
                                const price = orderType === 'Limit' && limitPrice ? parseFloat(limitPrice) : (data?.price || stock.price);
                                if (activeTab === 'BUY') {
                                  const maxQty = Math.floor(user.balance / price);
                                  setQuantity(Math.floor(maxQty * (pct / 100)) || 1);
                                } else {
                                  const owned = currentHolding?.quantity || 0;
                                  setQuantity(Math.floor(owned * (pct / 100)) || 1);
                                }
                              }}
                              className="text-[8px] font-black bg-neu-bg shadow-neu text-neu-muted px-1.5 py-0.5 rounded hover:bg-blue-500 hover:text-white transition-all border border-transparent"
                            >
                              {pct === 100 ? 'MAX' : `${pct}%`}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center bg-neu-bg shadow-neu-inset border border-transparent rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors">
                        <button 
                          onClick={() => setQuantity(prev => Math.max(1, (parseInt(prev) || 1) - 1))}
                          className="p-3 text-neu-muted hover:text-neu-primary hover:bg-slate-200 transition-all"
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="number" min="1"
                          value={quantity}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === "") setQuantity("");
                            else setQuantity(Math.max(1, parseInt(val) || 1));
                          }}
                          className="w-full bg-transparent py-3 text-sm text-neu-primary font-bold outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button 
                          onClick={() => setQuantity(prev => (parseInt(prev) || 0) + 1)}
                          className="p-3 text-neu-muted hover:text-neu-primary hover:bg-slate-200 transition-all"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      {activeTab === 'BUY' && tradeValue > user.balance && (
                        <p className="text-[9px] text-red-400 font-bold mt-1 animate-pulse">Exceeds available balance!</p>
                      )}
                    </div>
                  </div>

                  {orderType === 'Limit' && (
                    <div>
                      <label className="text-neu-muted text-[10px] font-black uppercase mb-2 block tracking-widest">Limit Price ($)</label>
                      <input
                        type="number"
                        placeholder={`Current: $${fmt(data.price)}`}
                        value={limitPrice}
                        onChange={e => setLimitPrice(e.target.value)}
                        className="w-full bg-neu-bg shadow-neu-inset border border-transparent rounded-xl px-4 py-3 text-sm text-neu-primary font-bold outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  )}

                  <div className="bg-neu-bg shadow-neu border border-transparent rounded-2xl p-5">
                    <div className="flex justify-between text-xs mb-3">
                      <span className="text-neu-muted font-bold uppercase">Est. {activeTab === 'BUY' ? 'Total Cost' : 'Sale Proceeds'}</span>
                      <span className="text-neu-primary font-black text-lg">${tradeValue}</span>
                    </div>
                    <button
                      onClick={handleTransaction}
                      className={`w-full py-4 rounded-2xl font-black text-sm text-white transition-all shadow-xl flex items-center justify-center gap-2 ${
                        activeTab === 'BUY' 
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-emerald-900/20 hover:scale-[1.02]' 
                          : 'bg-gradient-to-r from-red-600 to-red-500 shadow-red-900/20 hover:scale-[1.02]'
                      }`}
                    >
                      <ShoppingCart size={18} />
                      CONFIRM {activeTab} ORDER
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats & Info */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                 {data && [
                  { label: 'Day High', value: `$${fmt(data.high)}`, icon: <ArrowUpRight size={14} className="text-emerald-500" /> },
                  { label: 'Day Low', value: `$${fmt(data.low)}`, icon: <ArrowDownRight size={14} className="text-red-500" /> },
                  { label: 'Market Cap', value: fmtMarketCap(data.marketCap), icon: <DollarSign size={14} /> },
                  { label: 'P/E Ratio', value: fmt(data.pe), icon: <TrendingUp size={14} /> },
                  { label: '52W High', value: `$${fmt(data.fiftyTwoWeekHigh)}`, icon: <ArrowUpRight size={14} /> },
                  { label: '52W Low', value: `$${fmt(data.fiftyTwoWeekLow)}`, icon: <ArrowDownRight size={14} /> },
                  { label: 'Volume', value: fmtVolume(data.volume), icon: <BarChart2 size={14} /> },
                  { label: 'EPS', value: '3.42', icon: <Activity size={14} /> },
                ].map(s => (
                  <div key={s.label} className="bg-neu-bg shadow-neu border border-transparent rounded-[1.5rem] p-4 hover:-translate-y-1 transition-all">
                    <p className="text-neu-muted text-[10px] font-black uppercase flex items-center gap-1 mb-1">{s.icon}{s.label}</p>
                    <p className="text-neu-primary font-jakarta font-black text-sm">{s.value}</p>
                  </div>
                ))}
                {!data && Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-neu-bg shadow-neu border border-transparent rounded-[1.5rem] p-4 animate-pulse">
                    <div className="h-2 bg-slate-200 rounded w-16 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

