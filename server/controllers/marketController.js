import yahooFinanceModule from 'yahoo-finance2';

const YahooFinance = yahooFinanceModule.default || yahooFinanceModule;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export const getStockHistory = async (req, res) => {
  const { symbol } = req.params;
  const { period = '6mo' } = req.query;

  // Map period to date range
  const now = new Date();
  const from = new Date();
  if (period === '1w')  from.setDate(now.getDate() - 7);
  else if (period === '1mo') from.setMonth(now.getMonth() - 1);
  else if (period === '3mo') from.setMonth(now.getMonth() - 3);
  else if (period === '6mo') from.setMonth(now.getMonth() - 6);
  else if (period === '1y') from.setFullYear(now.getFullYear() - 1);
  else if (period === '5y') from.setFullYear(now.getFullYear() - 5);

  try {
    const [history, quote] = await Promise.all([
      yahooFinance.historical(symbol, { period1: from, period2: now, interval: period === '1w' ? '1d' : '1wk' }),
      yahooFinance.quote(symbol)
    ]);

    res.json({
      symbol,
      name: quote.shortName || quote.longName || symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      open: quote.regularMarketOpen,
      high: quote.regularMarketDayHigh,
      low: quote.regularMarketDayLow,
      volume: quote.regularMarketVolume,
      marketCap: quote.marketCap,
      pe: quote.trailingPE,
      currency: quote.currency,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      history: history.map(h => ({ date: h.date, close: h.close }))
    });
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
};

let marketCache = {
  data: null,
  timestamp: 0
};
const CACHE_DURATION = 60 * 1000; // 60 seconds

// Internal helper for other controllers to get fresh-enough data without new API calls
export const getCachedMarketData = async () => {
  if (marketCache.data && (Date.now() - marketCache.timestamp < CACHE_DURATION)) {
    return marketCache.data;
  }
  return null; // Signals we need a fresh fetch or the caller can handle fallback
};

export const getMarketData = async (req, res) => {
  try {
    // Return cached data if fresh
    if (marketCache.data && (Date.now() - marketCache.timestamp < CACHE_DURATION)) {
      return res.json(marketCache.data);
    }

    const symbols = [
      // Global Tech
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META',
      // Indian Markets
      'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'SBIN.NS',
      // Crypto
      'BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD',
      // Indices
      '^GSPC', '^DJI', '^IXIC', '^NSEI', '^BSESN',
      // Retail/Finance/Energy
      'JPM', 'V', 'WMT', 'JNJ', 'XOM', 'UNH', 'VOO'
    ];
    
    const results = await yahooFinance.quote(symbols);
    
    // Map data to simpler structure
    const marketData = results.map(q => {
      // Calculate daily change
      const change = q.regularMarketChangePercent || 0;
      const isPositive = change > 0;
      const changeStr = `${isPositive ? '+' : ''}${change.toFixed(2)}%`;
      
      let sector = 'Technology';
      if (['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD'].includes(q.symbol)) sector = 'Crypto';
      else if (['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'SBIN.NS'].includes(q.symbol)) sector = 'Indian Markets';
      else if (['^GSPC', '^DJI', '^IXIC', '^NSEI', '^BSESN', 'VOO', 'SPY', 'QQQ'].includes(q.symbol)) sector = 'Index';
      else if (['JPM', 'V'].includes(q.symbol)) sector = 'Finance';
      else if (['WMT'].includes(q.symbol)) sector = 'Retail';
      else if (['JNJ', 'UNH'].includes(q.symbol)) sector = 'Healthcare';
      else if (['XOM'].includes(q.symbol)) sector = 'Energy';
      else if (['TSLA'].includes(q.symbol)) sector = 'Automotive';

      let category = 'Global Markets';
      if (q.symbol.includes('.NS') || q.symbol === '^NSEI' || q.symbol === '^BSESN') category = 'Indian Markets';
      else if (q.symbol.includes('-USD')) category = 'Crypto';

      return {
        symbol: q.symbol.replace('-USD', ''), // Strip -USD for consistency with frontend
        name: q.shortName || q.longName || q.symbol,
        price: q.regularMarketPrice,
        currency: q.currency,
        change: changeStr,
        isPositive,
        sector,
        category
      };
    });

    marketCache = {
      data: marketData,
      timestamp: Date.now()
    };

    console.log("✅ Market Data Sync Successful");
    res.json(marketData);
  } catch (error) {
    console.error("❌ Market Data Fetch Error:", error.message);
    
    // Comprehensive Fallback Data
    const fallbackData = [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 175.50, currency: 'USD', change: '+1.10%', isPositive: true, sector: 'Technology', category: 'Global Markets' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 420.10, currency: 'USD', change: '+0.85%', isPositive: true, sector: 'Technology', category: 'Global Markets' },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 890.00, currency: 'USD', change: '+3.50%', isPositive: true, sector: 'Technology', category: 'Global Markets' },
      { symbol: 'BTC', name: 'Bitcoin', price: 65000, currency: 'USD', change: '-0.50%', isPositive: false, sector: 'Crypto', category: 'Crypto' },
      { symbol: 'ETH', name: 'Ethereum', price: 3450.00, currency: 'USD', change: '+1.20%', isPositive: true, sector: 'Crypto', category: 'Crypto' },
      { symbol: 'RELIANCE.NS', name: 'Reliance', price: 2900, currency: 'INR', change: '+2.10%', isPositive: true, sector: 'Energy', category: 'Indian Markets' },
      { symbol: 'TCS.NS', name: 'TCS', price: 3800, currency: 'INR', change: '-0.40%', isPositive: false, sector: 'Technology', category: 'Indian Markets' }
    ];

    res.json(fallbackData);
  }
};
