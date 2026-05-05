import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useMarket } from '../context/MarketContext';
import { useUser } from '../context/UserContext';
import { Search, TrendingUp, TrendingDown, RefreshCw, Globe, Activity, Star, Info } from 'lucide-react';
import StockDetail from '../components/StockDetail';

// --- Constants ---
const CATEGORIES = ['All Markets', 'Watchlist', 'Global Markets', 'Indian Markets', 'Crypto'];

// --- Utils ---
const formatPrice = (price, currency = 'USD') => {
  if (price === undefined || price === null) return '---';
  try {
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(price);
  } catch (e) {
    return `${currency || '$'} ${price}`;
  }
};

// --- Sub-components ---

const CategoryBadge = React.memo(({ category }) => {
  const colors = {
    'Global Markets': 'bg-blue-500/10 text-neu-accent border border-blue-500/20',
    'Indian Markets': 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    'Crypto': 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    'Technology': 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    'Finance': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  };
  
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${colors[category] || 'bg-slate-300 text-neu-muted border border-slate-400/20'}`}>
      {category}
    </span>
  );
});

const Sparkline = React.memo(({ isPositive }) => (
  <svg width="80" height="36" viewBox="0 0 80 36" fill="none" className="drop-shadow-sm">
    <defs>
      <linearGradient id={`grad-${isPositive}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity="0.3" />
        <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity="0" />
      </linearGradient>
    </defs>
    {isPositive ? (
      <>
        <path d="M0,30 L14,24 L28,20 L42,14 L56,8 L70,4 L80,2" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M0,30 L14,24 L28,20 L42,14 L56,8 L70,4 L80,2 L80,36 L0,36 Z" fill={`url(#grad-${isPositive})`} />
      </>
    ) : (
      <>
        <path d="M0,4 L14,8 L28,6 L42,18 L56,22 L70,28 L80,32" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M0,4 L14,8 L28,6 L42,18 L56,22 L70,28 L80,32 L80,36 L0,36 Z" fill={`url(#grad-${isPositive})`} />
      </>
    )}
  </svg>
));

const SkeletonCard = () => (
  <div className="bg-neu-bg shadow-neu p-6 rounded-[2.5rem] border border-white/20 animate-pulse">
    <div className="flex justify-between items-start mb-6">
      <div className="space-y-3">
        <div className="h-5 bg-slate-300 rounded-lg w-32"></div>
        <div className="h-3 bg-slate-200 rounded-md w-20"></div>
      </div>
      <div className="h-10 w-10 bg-slate-300 rounded-2xl"></div>
    </div>
    <div className="mt-8 space-y-4">
      <div className="h-10 bg-slate-300 rounded-xl w-40"></div>
      <div className="flex justify-between items-end">
        <div className="h-4 bg-slate-200 rounded-md w-24"></div>
        <div className="h-9 w-20 bg-slate-300 rounded-lg"></div>
      </div>
    </div>
  </div>
);

/**
 * MarketCard Sub-component
 * Renders an individual asset's price, change, and performance visual.
 */
const MarketCard = React.memo(({ item, isWatched, onToggleWatch, onClick }) => {
  const isPositive = item?.isPositive ?? (parseFloat(item?.change) >= 0);
  
  return (
    <div
      onClick={onClick}
      className="bg-neu-bg shadow-neu p-6 rounded-[2.5rem] border border-white/10 hover:-translate-y-2 hover:shadow-neu-hover transition-all duration-500 cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-neu-accent/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-neu-accent/10 transition-colors" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-extrabold text-neu-primary font-jakarta leading-tight tracking-tight group-hover:text-neu-accent transition-colors">
              {item?.name || 'Unknown Asset'}
            </h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatch(item?.symbol);
              }}
              className={`p-2.5 rounded-2xl transition-all shadow-neu hover:shadow-neu-inset ${
                isWatched 
                  ? 'text-yellow-500 bg-yellow-400/10' 
                  : 'text-neu-muted hover:text-yellow-500'
              }`}
            >
              <Star size={18} fill={isWatched ? 'currentColor' : 'none'} strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-neu-primary font-jakarta bg-neu-bg shadow-neu-inset px-2.5 py-1 rounded-lg uppercase tracking-widest">
              {item?.symbol || '---'}
            </span>
            <CategoryBadge category={item?.sector || item?.category || 'General'} />
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between relative z-10">
        <div>
          <p className="text-3xl font-black text-neu-primary font-jakarta tracking-tighter">
            {formatPrice(item?.price, item?.currency)}
          </p>
          <div className="flex items-center gap-2 mt-2">
             <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${isPositive ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-600'}`}>
               {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
               {item?.change || '0.00%'}
             </div>
             <span className="text-[10px] text-neu-muted font-bold uppercase tracking-widest opacity-60">
               {item?.currency || 'USD'}
             </span>
          </div>
        </div>
        <div className="opacity-60 group-hover:opacity-100 transition-opacity duration-500 transform group-hover:scale-110">
          <Sparkline isPositive={isPositive} />
        </div>
      </div>
    </div>
  );
});

const StatCard = React.memo(({ title, value, icon: Icon, colorClass, isInset }) => (
  <div className={`${isInset ? 'bg-neu-bg shadow-neu-inset' : 'bg-neu-bg shadow-neu'} rounded-[2rem] p-6 border border-white/10 group hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300`}>
    <p className={`text-[10px] ${colorClass || 'text-neu-muted'} font-black uppercase tracking-widest mb-2 flex items-center gap-1.5`}>
      {Icon && <Icon size={14} />} {title}
    </p>
    <p className={`text-3xl font-black ${colorClass || 'text-neu-primary'} font-jakarta mt-1 tracking-tight`}>
      {value}
    </p>
  </div>
));

const FilterBar = React.memo(({ search, setSearch, category, setCategory, categories }) => (
  <div className="flex flex-col xl:flex-row gap-6">
    <div className="relative flex-1 group">
      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-neu-muted group-focus-within:text-neu-accent transition-colors" size={20} />
      <input
        type="text"
        placeholder="Search assets by name or ticker..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-neu-bg shadow-neu-inset border border-transparent rounded-[1.5rem] pl-14 pr-6 py-4 text-sm text-neu-primary font-jakarta font-bold placeholder-slate-400 focus:outline-none focus:border-neu-accent/30 transition-all"
      />
    </div>
    <div className="flex gap-2 flex-wrap bg-neu-bg shadow-neu-inset p-2 rounded-[1.8rem]">
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => setCategory(cat)}
          className={`px-6 py-3 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${
            category === cat
              ? 'bg-neu-bg shadow-neu text-neu-accent font-jakarta scale-[1.02]'
              : 'text-neu-muted hover:text-neu-primary font-dm-sans'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  </div>
));

// --- Main Component ---

/**
 * Market Terminal Component
 * 
 * Provides a real-time market overview including:
 * - Search and filtering of global assets
 * - Live price tracking and performance sparklines
 * - Watchlist management (Persistence via UserContext)
 * - Detailed asset analysis via StockDetail overlay
 */
export default function Market() {
  // --- Context Hooks ---
  const { marketData, loading, fetchMarketData } = useMarket();
  const { watchlist, toggleWatchlist } = useUser();

  // --- UI & Filter State ---
  const [category, setCategory] = useState('All Markets'); // Active market category
  const [search, setSearch] = useState(''); // Current search query
  const [refreshing, setRefreshing] = useState(false); // Loading state for manual sync
  const [selectedStock, setSelectedStock] = useState(null); // Active stock for detailed view overlay
  
  // Throttle/Overlap Guard
  const lastFetchTime = useRef(0);
  const isFetching = useRef(false);

  // Debounced search for performance
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Memoized derived data
  const filteredData = useMemo(() => {
    if (!marketData) return [];
    return marketData.filter(item => {
      const matchesCategory = category === 'All Markets' 
        ? true 
        : category === 'Watchlist' 
          ? watchlist.includes(item.symbol)
          : (item.category === category || item.sector === category);
          
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch =
        (item.name || "").toLowerCase().includes(searchLower) ||
        (item.symbol || "").toLowerCase().includes(searchLower);
        
      return matchesCategory && matchesSearch;
    });
  }, [marketData, category, watchlist, debouncedSearch]);

  const stats = useMemo(() => {
    const data = marketData || [];
    return {
      total: data.length,
      gainers: data.filter(d => d?.isPositive).length,
      losers: data.filter(d => d && !d.isPositive).length,
    };
  }, [marketData]);

  // Optimized refresh handler
  const handleRefresh = useCallback(async (manual = false) => {
    const now = Date.now();
    // Guard: Prevent overlapping or too frequent calls (5s throttle for manual)
    if (isFetching.current || (manual && now - lastFetchTime.current < 5000)) return;

    isFetching.current = true;
    setRefreshing(true);
    
    try {
      await fetchMarketData();
      lastFetchTime.current = Date.now();
    } finally {
      // Small delay to make the UI transition feel smoother
      setTimeout(() => {
        setRefreshing(false);
        isFetching.current = false;
      }, 800);
    }
  }, [fetchMarketData]);

  // Handle auto-refresh interval (sync with context or manage local)
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [handleRefresh]);

  return (
    <div className="p-6 pb-24 min-h-screen bg-neu-bg animate-fadeIn">
      {/* Header */}
      <div className="mb-12 max-w-[1400px] mx-auto">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-10">
          <div>
            <h1 className="text-4xl font-black text-neu-primary font-jakarta flex items-center gap-4 tracking-tighter">
              <div className="p-3.5 bg-neu-bg shadow-neu rounded-[1.5rem]">
                <Globe className="text-neu-accent" size={32} />
              </div>
              Market Terminal
            </h1>
            <p className="text-neu-muted font-dm-sans text-lg mt-3 opacity-80">
              Live global assets and real-time indices, synchronized every 30 seconds.
            </p>
          </div>

          <button
            onClick={() => handleRefresh(true)}
            disabled={refreshing}
            className={`flex items-center gap-3 bg-neu-bg shadow-neu hover:shadow-neu-inset text-neu-primary font-jakarta text-xs font-black uppercase tracking-widest px-8 py-4 rounded-[1.5rem] transition-all disabled:opacity-70 ${refreshing ? 'text-neu-accent' : ''}`}
          >
            <RefreshCw size={16} className={`${refreshing ? 'animate-spin' : ''} transition-colors`} />
            {refreshing ? 'Syncing...' : 'Force Sync'}
          </button>
        </div>

        {/* Market Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Assets" value={stats.total} isInset={false} />
          <StatCard title="Results Found" value={filteredData.length} isInset={true} colorClass="text-neu-accent" />
          <StatCard title="Market Gainers" value={stats.gainers} icon={TrendingUp} colorClass="text-emerald-600" />
          <StatCard title="Market Losers" value={stats.losers} icon={TrendingDown} colorClass="text-red-600" />
        </div>

        {/* Search + Filter */}
        <FilterBar 
          search={search} 
          setSearch={setSearch} 
          category={category} 
          setCategory={setCategory} 
          categories={CATEGORIES} 
        />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-[1400px] mx-auto">
        {loading && marketData.length === 0
          ? Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
          : filteredData.length === 0
          ? (
            <div className="col-span-full py-24 flex flex-col items-center justify-center bg-neu-bg shadow-neu-inset rounded-[3rem] border border-white/5 mx-4">
              <div className="p-6 bg-neu-bg shadow-neu rounded-full mb-6">
                <Activity size={48} className="text-neu-muted opacity-40" />
              </div>
              <p className="text-neu-primary font-jakarta text-xl font-black tracking-tight">No Market Results Found</p>
              <p className="text-neu-muted font-dm-sans text-sm mt-2 max-w-xs text-center leading-relaxed">
                We couldn't find any assets matching your current search or category filters. Try expanding your search.
              </p>
              <button 
                onClick={() => { setSearch(''); setCategory('All Markets'); }}
                className="mt-8 px-8 py-3 bg-neu-bg shadow-neu hover:shadow-neu-inset rounded-xl text-xs font-black text-neu-accent uppercase tracking-widest transition-all"
              >
                Clear All Filters
              </button>
            </div>
          )
          : filteredData.map((item, i) => (
              <MarketCard 
                key={item?.symbol || i}
                item={item}
                isWatched={watchlist.includes(item?.symbol)}
                onToggleWatch={toggleWatchlist}
                onClick={() => setSelectedStock(item)}
              />
            ))
        }
      </div>

      {/* Info Footer */}
      <div className="mt-16 max-w-[1400px] mx-auto flex items-center justify-center gap-2 text-neu-muted/50 text-[10px] font-bold uppercase tracking-[0.2em]">
        <Info size={12} />
        Market data is provided for informational purposes only. Past performance is not indicative of future results.
      </div>

      {/* Stock Detail Panel */}
      {selectedStock && (
        <StockDetail
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  );
}
