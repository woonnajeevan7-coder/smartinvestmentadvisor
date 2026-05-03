import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getMarketData } from '../services/api';

const MarketContext = createContext();

const SEED_DATA = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 175.50, change: '+1.2%', isPositive: true, sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 420.10, change: '+0.8%', isPositive: true, sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 890.00, change: '+3.5%', isPositive: true, sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 170.20, change: '-2.1%', isPositive: false, sector: 'Automotive' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 185.30, change: '+0.5%', isPositive: true, sector: 'Consumer Cyclical' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 155.60, change: '+0.3%', isPositive: true, sector: 'Technology' },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 480.00, change: '-1.2%', isPositive: false, sector: 'Technology' },
  { symbol: 'BTC', name: 'Bitcoin', price: 65400.00, change: '+4.2%', isPositive: true, sector: 'Crypto' },
  { symbol: 'ETH', name: 'Ethereum', price: 3450.00, change: '+2.8%', isPositive: true, sector: 'Crypto' },
  { symbol: 'SPY', name: 'S&P 500 ETF', price: 510.45, change: '+0.2%', isPositive: true, sector: 'Index' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', price: 440.20, change: '+0.6%', isPositive: true, sector: 'Index' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 195.30, change: '+1.1%', isPositive: true, sector: 'Finance' },
  { symbol: 'V', name: 'Visa Inc.', price: 275.80, change: '+0.4%', isPositive: true, sector: 'Finance' },
  { symbol: 'WMT', name: 'Walmart Inc.', price: 60.50, change: '-0.1%', isPositive: false, sector: 'Retail' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: 155.00, change: '-0.3%', isPositive: false, sector: 'Healthcare' },
  { symbol: 'XOM', name: 'Exxon Mobil Corp.', price: 118.20, change: '+1.5%', isPositive: true, sector: 'Energy' },
];

export function MarketProvider({ children }) {
  const [marketData, setMarketData] = useState(() => {
    try {
      const cached = localStorage.getItem('market_data_cache');
      return cached ? JSON.parse(cached) : SEED_DATA;
    } catch (e) {
      console.error("Cache parse error", e);
      return SEED_DATA;
    }
  });
  const [loading, setLoading] = useState(false);

  const fetchMarketData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMarketData();
      if (data && Array.isArray(data) && data.length > 0) {
        setMarketData(data);
        localStorage.setItem('market_data_cache', JSON.stringify(data));
      } else {
        console.warn("⚠️ Received invalid or empty market data from backend, keeping current state.");
      }
    } catch (error) {
      console.error("❌ Market Data Fetch Error (Backend):", error.message);
      // Fallback is already handled by keeping existing state or using cache
    } finally {
      // Ensure loading is ALWAYS set to false, even on errors
      setLoading(false);
    }
  }, []);

  // 1. Initial Load & Background Sync
  useEffect(() => {
    fetchMarketData(); // Initial load
    const interval = setInterval(fetchMarketData, 30000); // Sync every 30s
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  // 2. Removed Real-time Price Fluctuation Simulation to prevent UI jitter
  // The UI will now update strictly every 30 seconds as requested.

  return (
    <MarketContext.Provider value={{ marketData, loading, fetchMarketData }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  return useContext(MarketContext);
}

