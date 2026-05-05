import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Bot, TrendingUp, TrendingDown, Minus, Zap, Send, RefreshCw, AlertCircle, BarChart2, Brain, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { sendChatMessage, getAIRecommendations } from '../services/api';
import { useMarket } from '../context/MarketContext';
import { ChatLoader } from '../components/ui/chat-loader';

// --- Utils ---
const formatCurrency = (price, currency = 'USD') => {
  if (price === undefined || price === null || isNaN(price)) return 'N/A';
  const numPrice = Number(price);
  try {
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(numPrice);
  } catch (e) {
    return `${currency || '$'} ${numPrice}`;
  }
};

// --- Markdown-like renderer ---
const renderMarkdown = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('# '))  return <h2 key={i} className="text-lg font-extrabold text-neu-primary font-jakarta mt-4 mb-2">{line.slice(2)}</h2>;
    if (line.startsWith('## ')) return <h3 key={i} className="text-base font-extrabold text-neu-accent mt-3 mb-1">{line.slice(3)}</h3>;
    if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold text-neu-primary font-jakarta my-1">{line.slice(2,-2)}</p>;
    if (line.startsWith('- ') || line.startsWith('* '))
      return <li key={i} className="ml-5 text-neu-primary font-dm-sans list-disc mb-1">{parseBold(line.slice(2))}</li>;
    if (line.trim() === '') return <div key={i} className="h-2" />;
    if (line.startsWith('|')) return null; 
    return <p key={i} className="text-neu-primary font-dm-sans leading-relaxed mb-1">{parseBold(line)}</p>;
  });
};

const parseBold = (text) => {
  if (!text) return '';
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') ? <strong key={i} className="text-neu-primary font-jakarta font-bold">{p.slice(2,-2)}</strong> : p
  );
};

// --- Sub-components ---

const SignalBadge = React.memo(({ signal }) => {
  const config = {
    BUY:  { bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600', icon: <TrendingUp size={12} />, label: 'BUY' },
    SELL: { bg: 'bg-red-500/15 border-red-500/30 text-red-600', icon: <TrendingDown size={12} />, label: 'SELL' },
    HOLD: { bg: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-600', icon: <Minus size={12} />, label: 'HOLD' },
  };
  const c = config[signal] || config.HOLD;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black tracking-widest ${c.bg}`}>
      {c.icon}{c.label}
    </span>
  );
});

const ConfBar = React.memo(({ value, signal }) => {
  const color = signal === 'BUY' ? 'bg-emerald-500' : signal === 'SELL' ? 'bg-red-500' : 'bg-yellow-500';
  const displayValue = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="flex-1 h-2 bg-neu-bg shadow-neu-inset rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`} style={{ width: `${displayValue}%` }} />
      </div>
      <span className="text-[10px] text-neu-muted font-black font-jakarta w-8 text-right">{displayValue}%</span>
    </div>
  );
});

/**
 * RecCard Sub-component
 * Displays detailed AI recommendation for an asset with expansion for reasoning.
 */
const RecCard = React.memo(({ rec }) => {
  const [open, setOpen] = useState(false);
  const isPositive = (rec?.changePercent || 0) >= 0;
  
  return (
    <div
      onClick={() => setOpen(o => !o)}
      className={`bg-neu-bg shadow-neu rounded-[2.5rem] p-6 cursor-pointer transition-all duration-500 hover:-translate-y-1.5 hover:shadow-neu-hover group relative overflow-hidden border border-white/5 ${
        open ? 'shadow-neu-inset' : ''
      }`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-neu-accent/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-neu-accent/10 transition-colors" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex-1 mr-2">
          <h4 className="text-neu-primary font-jakarta font-black text-base line-clamp-1 group-hover:text-neu-accent transition-colors">
            {rec?.name || 'Unknown Asset'}
          </h4>
          <p className="text-neu-muted font-dm-sans text-[10px] font-black tracking-widest uppercase opacity-60">
            {rec?.symbol || '---'}
          </p>
        </div>
        <SignalBadge signal={rec?.signal} />
      </div>

      <div className="flex items-end justify-between mb-4 relative z-10">
        <div>
          <p className="text-2xl font-black text-neu-primary font-jakarta tracking-tighter">
            {formatCurrency(rec?.price, rec?.currency)}
          </p>
          <p className={`text-[10px] font-black mt-1 flex items-center gap-1 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(rec?.changePercent || 0).toFixed(2)}% Today
          </p>
        </div>
        <div className="text-right">
          <p className="text-neu-muted font-black text-[9px] uppercase tracking-widest mb-0.5 opacity-60">AI Confidence</p>
          <p className={`text-xl font-black font-jakarta ${rec?.signal === 'BUY' ? 'text-emerald-600' : rec?.signal === 'SELL' ? 'text-red-600' : 'text-yellow-600'}`}>
            {rec?.confidence || 0}%
          </p>
        </div>
      </div>

      <ConfBar value={rec?.confidence} signal={rec?.signal} />

      <div className={`mt-4 pt-4 border-t border-white/10 transition-all duration-500 overflow-hidden ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        {rec?.shortReason && (
          <div className="bg-neu-bg shadow-neu-inset rounded-2xl p-3 mb-4">
            <p className="text-neu-primary font-dm-sans text-xs italic leading-relaxed">
              "{rec.shortReason}"
            </p>
          </div>
        )}
        <ul className="space-y-2">
          {(rec?.reasons || []).map((r, i) => (
            <li key={i} className="text-neu-muted font-dm-sans text-[11px] flex gap-3 items-start leading-relaxed font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-neu-accent mt-1 flex-shrink-0" />
              {r}
            </li>
          ))}
        </ul>
        {rec?.risk && (
          <div className="mt-4 flex items-center justify-between bg-white/5 p-2 rounded-xl">
            <span className="text-neu-muted font-black text-[9px] uppercase tracking-widest">Risk Level</span>
            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
              rec.risk === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
              rec.risk === 'Low'  ? 'bg-emerald-500/10 text-emerald-500 border border-red-500/20' :
              'bg-yellow-500/10 text-yellow-500 border border-red-500/20'
            }`}>
              {rec.risk}
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-3 flex justify-center text-neu-muted group-hover:text-neu-accent transition-colors">
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
    </div>
  );
});

const ChatMsg = React.memo(({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fadeIn mb-6`}>
      <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-xs shadow-neu ${
        isUser ? 'bg-neu-bg text-neu-accent' : 'bg-gradient-to-tr from-purple-600 to-blue-600 text-white'
      }`}>
        {isUser ? <span className="font-black text-sm">U</span> : <Bot size={18} strokeWidth={2.5} />}
      </div>
      <div className={`max-w-[85%] rounded-[2rem] px-6 py-4 text-sm leading-relaxed ${
        isUser 
          ? 'bg-neu-bg shadow-neu text-neu-primary rounded-tr-none border border-white/10 font-medium' 
          : 'bg-neu-bg shadow-neu-inset rounded-tl-none text-neu-primary font-dm-sans'
      }`}>
        {isUser ? msg.content : <div className="space-y-1">{renderMarkdown(msg.content)}</div>}
      </div>
    </div>
  );
});

const TypingIndicator = React.memo(() => (
  <div className="flex gap-4 animate-fadeIn mb-6">
    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-neu">
      <Bot size={18} strokeWidth={2.5} />
    </div>
    <div className="bg-neu-bg shadow-neu-inset rounded-[2rem] rounded-tl-none px-6 py-2 flex items-center border border-transparent">
      <ChatLoader size={30} text="..." />
    </div>
  </div>
));

const SkeletonCard = () => (
  <div className="bg-neu-bg shadow-neu rounded-[2.5rem] p-6 border border-white/10 animate-pulse h-48">
    <div className="flex justify-between items-start mb-6">
      <div className="space-y-3">
        <div className="h-5 bg-slate-300 rounded-lg w-32"></div>
        <div className="h-3 bg-slate-200 rounded-md w-16"></div>
      </div>
      <div className="h-10 w-20 bg-slate-300 rounded-full"></div>
    </div>
    <div className="space-y-4">
      <div className="h-8 bg-slate-300 rounded-xl w-40"></div>
      <div className="h-2 bg-slate-200 rounded-full w-full"></div>
    </div>
  </div>
);

// --- Main Page ---

const SUGGESTED = [
  'Which stocks should I buy right now?',
  'Is Bitcoin a good investment?',
  'How do I build a diversified portfolio?',
  'What are the risks of investing in NVDA?',
  'Explain P/E ratio in simple terms'
];

/**
 * AI Advisor Page Component
 * 
 * A sophisticated dual-mode intelligence interface:
 * 1. Market Signals: Provides AI-driven BUY/SELL/HOLD recommendations with confidence levels.
 * 2. Advisor AI Chat: An interactive conversational interface for deep financial analysis.
 */
export default function AIAdvisor() {
  // --- Global State & Context ---
  const [tab, setTab] = useState('signals'); // Active view (signals or chat)
  const { marketData } = useMarket();

  // --- Market Signals State ---
  const [recs, setRecs] = useState([]); // List of AI recommendations
  const [recsLoading, setRecsLoading] = useState(false); // Fetching state
  const [recsError, setRecsError] = useState(''); // Error feedback
  const [recSource, setRecSource] = useState(''); // Source model identifier (Groq, Gemini, etc.)
  const [filterSig, setFilterSig] = useState('All'); // Signal filter (BUY/SELL/HOLD)
  const [searchQuery, setSearchQuery] = useState(''); // Search text
  const [selectedStocks, setSelectedStocks] = useState([]); // Targeted analysis selection
  const [showStockSelector, setShowStockSelector] = useState(false); // Stock picker visibility

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // --- AI Chat State ---
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      id: 'init',
      content: `👋 Hi! I'm **Fund Cr**, your personal investment analyst powered by **Groq**.\n\nI can help you with:\n- 📈 Which stocks to **buy or sell**\n- 💼 Building a smart **portfolio**\n- ₿ **Crypto** analysis\n- ⚖️ **Risk management** strategies\n- 📊 Explaining any **financial concept**\n\nWhat would you like to know today?`
    }
  ]);
  const [input, setInput] = useState(''); // Current chat input
  const [typing, setTyping] = useState(false); // AI response generation state
  const [sessionId] = useState(() => Math.random().toString(36).slice(2)); // Session persistence key
  
  const chatBottomRef = useRef(null); // Ref for auto-scrolling
  const isFetching = useRef(false); // Throttle guard for API calls
  const lastFetchTime = useRef(0); // Cooldown timer for sync operations

  // Load recommendations
  const loadRecs = useCallback(async (manual = false) => {
    if (!navigator.onLine) return;
    const now = Date.now();
    // Guard: prevent overlapping or too frequent fetches
    if (isFetching.current || (manual && now - lastFetchTime.current < 5000)) return;

    isFetching.current = true;
    setRecsLoading(true);
    setRecsError('');
    
    try {
      const res = await getAIRecommendations();
      let results = res?.recommendations || [];
      
      // Strict filter if targeted stocks are chosen
      if (selectedStocks.length > 0) {
        results = results.filter(r => selectedStocks.includes(r.symbol));
      }
      
      setRecs(results);
      setRecSource(res?.source || 'advisor-backend');
      lastFetchTime.current = Date.now();
    } catch (err) {
      console.error("❌ Recs Load Error:", err);
      setRecsError('AI signals are currently synchronized via local backup models.');
    } finally {
      setRecsLoading(false);
      isFetching.current = false;
    }
  }, [selectedStocks]);

  useEffect(() => {
    if (tab === 'signals') loadRecs();
  }, [tab, loadRecs]);

  // Auto-refresh signals
  useEffect(() => {
    if (tab !== 'signals') return;
    const interval = setInterval(() => {
      loadRecs(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [tab, loadRecs]);

  // Auto-scroll chat
  useEffect(() => {
    if (tab === 'chat' && messages.length > 0) {
      requestAnimationFrame(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [messages, typing, tab]);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    setInput('');
    const userMsgId = window.crypto?.randomUUID?.() || `u-${Date.now()}`;
    setMessages(m => [...m, { role: 'user', content: msg, id: userMsgId }]);
    setTyping(true);
    
    try {
      const res = await sendChatMessage(msg, sessionId);
      setMessages(m => [...m, { 
        role: 'ai', 
        content: res?.reply || 'AI synchronization completed, but no text response was returned.',
        id: `ai-${Date.now()}`
      }]);
    } catch (err) {
      setMessages(m => [...m, { 
        role: 'ai', 
        content: '⚠️ Connectivity issue detected. Please check your network or try again in a few seconds.',
        id: `err-${Date.now()}`
      }]);
    } finally {
      setTyping(false);
    }
  }, [input, sessionId, typing]);

  // Memoized stats & data
  const stats = useMemo(() => {
    const data = recs || [];
    return {
      buy:  data.filter(r => r?.signal === 'BUY').length,
      sell: data.filter(r => r?.signal === 'SELL').length,
      hold: data.filter(r => r?.signal === 'HOLD').length,
    };
  }, [recs]);

  const filteredRecs = useMemo(() => {
    if (!Array.isArray(recs)) return [];
    return recs.filter(r => {
      if (!r) return false;
      const matchesFilter = filterSig === 'All' || r?.signal === filterSig;
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch = (r?.name || "").toLowerCase().includes(searchLower) || 
                           (r?.symbol || "").toLowerCase().includes(searchLower);
      return matchesFilter && matchesSearch;
    });
  }, [recs, filterSig, debouncedSearch]);

  const toggleStock = useCallback((symbol) => {
    setSelectedStocks(prev => 
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  }, []);

  return (
    <div className="min-h-screen p-6 pb-24 bg-neu-bg animate-fadeIn">

      {/* Header */}
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center shadow-neu transform hover:rotate-3 transition-transform">
            <Brain size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-neu-primary font-jakarta tracking-tight">AI Advisor</h1>
            <p className="text-neu-muted font-dm-sans text-sm font-bold opacity-70 tracking-wide uppercase">Institutional-grade market intelligence</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-10 bg-neu-bg shadow-neu-inset rounded-[2rem] p-2 w-fit border border-white/10">
          {[
            { id: 'signals', label: 'Market Signals', icon: <Zap size={16} /> },
            { id: 'chat',    label: 'Advisor AI',       icon: <Bot size={16} /> }
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2.5 px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all ${
                tab === t.id ? 'bg-neu-bg shadow-neu text-neu-accent font-jakarta scale-[1.02]' : 'text-neu-muted font-dm-sans hover:text-neu-primary'
              }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ─── SMART SIGNALS TAB ─── */}
        {tab === 'signals' && (
          <div className="animate-fadeIn">
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-neu-bg shadow-neu rounded-[2rem] p-6 border border-white/10 hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 group">
                <p className="text-neu-muted font-black text-[10px] uppercase tracking-widest mb-2 opacity-60">Assets Analyzed</p>
                <p className="text-3xl font-black text-neu-primary font-jakarta group-hover:text-neu-accent transition-colors tracking-tighter">{recs.length}</p>
              </div>
              <div className="bg-neu-bg shadow-neu rounded-[2rem] p-6 border border-white/10 hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 group">
                <p className="text-emerald-500 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5"><TrendingUp size={14}/>BUY Signals</p>
                <p className="text-3xl font-black text-emerald-600 font-jakarta tracking-tighter">{stats.buy}</p>
              </div>
              <div className="bg-neu-bg shadow-neu rounded-[2rem] p-6 border border-white/10 hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 group">
                <p className="text-red-500 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5"><TrendingDown size={14}/>SELL Signals</p>
                <p className="text-3xl font-black text-red-600 font-jakarta tracking-tighter">{stats.sell}</p>
              </div>
              <div className="bg-neu-bg shadow-neu rounded-[2rem] p-6 border border-white/10 hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 group">
                <p className="text-yellow-500 font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5"><Minus size={14}/>HOLD Signals</p>
                <p className="text-3xl font-black text-yellow-600 font-jakarta tracking-tighter">{stats.hold}</p>
              </div>
            </div>

            {/* Filter + Search */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10">
              <div className="flex flex-wrap gap-2.5 bg-neu-bg shadow-neu-inset p-2 rounded-[1.8rem]">
                {['All', 'BUY', 'SELL', 'HOLD'].map(f => (
                  <button key={f} onClick={() => setFilterSig(f)}
                    className={`px-6 py-2.5 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                      filterSig === f
                        ? f === 'BUY'  ? 'bg-neu-bg shadow-neu text-emerald-600 font-jakarta scale-[1.02]'
                        : f === 'SELL' ? 'bg-neu-bg shadow-neu text-red-600 font-jakarta scale-[1.02]'
                        : f === 'HOLD' ? 'bg-neu-bg shadow-neu text-yellow-600 font-jakarta scale-[1.02]'
                        : 'bg-neu-bg shadow-neu text-neu-accent font-jakarta scale-[1.02]'
                        : 'text-neu-muted font-dm-sans hover:text-neu-primary'
                    }`}
                  >{f}</button>
                ))}
              </div>

              <div className="flex flex-1 xl:max-w-2xl gap-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-neu-muted group-focus-within:text-neu-accent transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Scan intelligence by ticker or company name..."
                    className="w-full bg-neu-bg shadow-neu-inset rounded-[1.5rem] py-4 pl-14 pr-6 text-sm font-bold text-neu-primary font-jakarta outline-none border border-transparent focus:border-neu-accent/30 transition-all placeholder-slate-400"
                  />
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowStockSelector(!showStockSelector)}
                    className={`px-7 py-4 bg-neu-bg shadow-neu hover:shadow-neu-inset rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 ${selectedStocks.length > 0 ? 'text-neu-accent' : 'text-neu-muted'}`}
                  >
                    <BarChart2 size={16} />
                    {selectedStocks.length > 0 ? `${selectedStocks.length} TARGETED` : 'ANALYZE ASSETS'}
                  </button>
                  
                  {showStockSelector && (
                    <div className="absolute top-full right-0 mt-4 w-80 bg-neu-bg shadow-neu rounded-[2.5rem] p-7 z-50 border border-white/10 max-h-[500px] overflow-y-auto animate-fadeIn backdrop-blur-2xl">
                      <div className="flex justify-between items-center mb-6">
                        <p className="text-[10px] font-black text-neu-muted font-dm-sans uppercase tracking-[0.2em] opacity-60">TARGET SELECTION</p>
                        <button onClick={() => setSelectedStocks([])} className="text-[10px] text-red-500 font-black uppercase tracking-widest hover:underline">Reset</button>
                      </div>
                      <div className="space-y-3">
                        {(marketData || []).map((s) => (
                          <div 
                            key={`${s?.symbol}-${s?.name}`} 
                            onClick={() => toggleStock(s?.symbol)}
                            className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-300 ${selectedStocks.includes(s?.symbol) ? 'bg-neu-bg shadow-neu-inset scale-[0.97]' : 'hover:bg-black/5'}`}
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-neu-primary font-jakarta uppercase">{s?.symbol}</span>
                              <span className="text-[9px] text-neu-muted font-bold line-clamp-1 opacity-70">{s?.name}</span>
                            </div>
                            {selectedStocks.includes(s?.symbol) && (
                              <div className="w-2.5 h-2.5 bg-neu-accent rounded-full shadow-[0_0_12px_rgba(108,99,255,0.6)]" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Source + Refresh Bar */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                {recSource && (
                  <span className="text-[10px] text-neu-muted font-black uppercase tracking-widest bg-neu-bg shadow-neu-inset px-4 py-2 rounded-full border border-white/5 flex items-center gap-2">
                    {recSource === 'gemini' ? '🤖 Gemini Pro 1.5' : 
                     recSource.includes('groq') ? <><Zap size={10} className="text-yellow-500 fill-yellow-500"/> Llama 3 (Groq)</> : 
                     '⚙️ Algorithmic Engine'}
                  </span>
                )}
                {selectedStocks.length > 0 && (
                  <span className="text-[10px] text-neu-accent font-black uppercase tracking-widest bg-neu-bg shadow-neu-inset px-4 py-2 rounded-full border border-white/5 animate-pulse">
                    Targeted Intelligence Active
                  </span>
                )}
              </div>
              <button 
                onClick={() => loadRecs(true)} 
                disabled={recsLoading}
                className="flex items-center gap-2.5 bg-neu-bg shadow-neu hover:shadow-neu-inset text-neu-primary font-jakarta text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-[1.2rem] transition-all disabled:opacity-50"
              >
                <RefreshCw size={14} className={recsLoading ? 'animate-spin' : ''} />
                Sync Data
              </button>
            </div>

            {recsError && (
              <div className="flex items-center gap-4 bg-red-500/10 border border-red-500/20 rounded-[1.5rem] p-5 text-red-600 text-xs font-bold mb-8 animate-fadeIn">
                <AlertCircle size={20} strokeWidth={2.5}/>
                <span>{recsError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {recsLoading && recs.length === 0
                ? Array.from({length: 9}).map((_,i) => <SkeletonCard key={i} />)
                : filteredRecs.length === 0
                ? (
                  <div className="col-span-full py-32 flex flex-col items-center justify-center bg-neu-bg shadow-neu-inset rounded-[3rem] border border-white/5 mx-4">
                    <div className="p-6 bg-neu-bg shadow-neu rounded-full mb-6">
                      <BarChart2 size={48} className="text-neu-muted opacity-40" />
                    </div>
                    <p className="text-neu-primary font-jakarta text-xl font-black tracking-tight">No signals found.</p>
                    <p className="text-neu-muted font-dm-sans text-sm mt-3 max-w-sm text-center leading-relaxed opacity-70">
                      Try resetting filters, selecting different assets, or refreshing data to see results.
                    </p>
                    <button 
                      onClick={() => { setSearchQuery(''); setFilterSig('All'); setSelectedStocks([]); }}
                      className="mt-10 px-10 py-4 bg-neu-bg shadow-neu hover:shadow-neu-inset rounded-2xl text-[10px] font-black text-neu-accent uppercase tracking-widest transition-all"
                    >
                      Reset Intelligence Parameters
                    </button>
                  </div>
                )
                : filteredRecs.map((rec) => <RecCard key={`${rec?.symbol}-${rec?.signal}-${rec?.price || '0'}`} rec={rec} />)
              }
            </div>
          </div>
        )}

        {/* ─── AI CHAT TAB ─── */}
        {tab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-280px)] animate-fadeIn">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-4 custom-scrollbar">
              {messages.map((msg) => <ChatMsg key={msg.id} msg={msg} />)}
              {typing && <TypingIndicator />}
              <div ref={chatBottomRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="flex gap-3 flex-wrap mb-6">
                {SUGGESTED.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    disabled={typing}
                    className="text-[10px] bg-neu-bg shadow-neu hover:shadow-neu-inset text-neu-muted hover:text-neu-primary font-black uppercase tracking-widest px-5 py-2.5 rounded-full transition-all disabled:opacity-50">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className={`flex gap-5 items-center bg-neu-bg shadow-neu-inset rounded-[2.5rem] p-4 transition-all focus-within:shadow-neu-hover group border border-white/5 ${typing ? 'opacity-70 pointer-events-none' : ''}`}>
              <div className="p-3 bg-neu-bg shadow-neu rounded-2xl text-neu-accent">
                <Brain size={20} strokeWidth={2.5} />
              </div>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask Advisor AI about market sentiment, portfolio risk, or technical analysis..."
                className="flex-1 bg-transparent text-neu-primary font-jakarta font-bold placeholder-slate-400 text-sm outline-none py-2"
                disabled={typing}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || typing}
                className={`bg-neu-bg shadow-neu hover:shadow-neu-inset text-neu-primary p-5 rounded-2xl transition-all flex items-center justify-center ${!input.trim() || typing ? 'opacity-30' : 'hover:scale-105 active:scale-95 text-neu-accent'}`}
              >
                {typing ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} strokeWidth={2.5} />}
              </button>
            </div>
            
            <div className="mt-6 flex items-center justify-center gap-2 text-neu-muted/40 text-[9px] font-black uppercase tracking-[0.25em]">
              <Info size={12} />
              AI responses can be inaccurate. Always verify critical financial data.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
