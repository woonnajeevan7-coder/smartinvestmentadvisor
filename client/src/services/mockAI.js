// Mock AI Service for Frontend-Only SaaS
// Simulates a robust AI backend

const RESPONSES = [
  {
    keywords: ['buy', 'invest', 'top', 'recommend'],
    response: `Based on current market momentum, here are some top assets to consider right now:
**1. NVIDIA (NVDA)**
- **Why**: Continued dominance in AI chip market. Strong earnings growth.
- **Risk**: Moderate to High (Valuation is stretched).

**2. Bitcoin (BTC)**
- **Why**: Institutional adoption and favorable macroeconomic trends.
- **Risk**: High (Volatility).

**3. S&P 500 ETF (SPY)**
- **Why**: Core holding for any diversified portfolio. 
- **Risk**: Low

*Remember to align any purchases with your personal risk profile and investment horizon.*`
  },
  {
    keywords: ['risk', 'profile', 'conservative', 'aggressive'],
    response: `Your **Risk Profile** determines how much volatility you can stomach in exchange for potential returns.

### Understanding Risk
- **Conservative**: Focus on capital preservation (Bonds, High-Yield Savings, Blue-chip Dividend stocks).
- **Moderate**: A balanced approach, typically a 60/40 split between equities and fixed income.
- **Aggressive**: Focus on maximum growth (Tech stocks, Crypto, Small-caps).

You can update your risk settings at any time in your **Profile** tab. I recommend keeping your portfolio aligned with your calculated score for optimal long-term results.`
  },
  {
    keywords: ['crypto', 'bitcoin', 'ethereum', 'btc', 'eth'],
    response: `**Cryptocurrency Analysis ⚡**

The crypto market operates 24/7 and is highly sensitive to macroeconomic news and regulatory shifts.

**Current Sentiment**: **BULLISH**
- **BTC**: Strong support around current levels. Institutional inflows via ETFs continue to provide a floor.
- **ETH**: Smart contract adoption and Layer 2 scaling solutions are driving on-chain activity.

**AI Advice**: Cap your crypto exposure to **5-10%** of your total portfolio unless you have a highly aggressive risk tolerance.`
  },
  {
    keywords: ['portfolio', 'health', 'diversify', 'diversification'],
    response: `### Portfolio Health & Diversification 🛡️

A healthy portfolio avoids "putting all eggs in one basket". Here is my standard checklist for optimal health:

1. **Sector Allocation**: Ensure you aren't over-exposed to just Tech or just Finance.
2. **Asset Classes**: Blend Equities (Stocks) with fixed-income (Bonds) or alternatives (Real Estate, Crypto).
3. **Geographic Diversity**: Consider international ETFs (like VXUS) alongside domestic ones.

If your Dashboard shows a health score below 70%, consider trimming your largest positions and reallocating to an index fund.`
  },
  {
    keywords: ['sell', 'liquidate', 'exit'],
    response: `**When to Sell an Asset 📉**

It's natural to want to lock in profits or cut losses, but selling should be strategic:
1. **Has the fundamental thesis changed?** If the reason you bought the stock is no longer true, it's time to sell.
2. **Is your portfolio too concentrated?** If one stock grew so much that it's now 40% of your net worth, trim the position.
3. **Do you need the cash?** If you have a short-term liquidity need, liquidate your least volatile assets first.

Try not to panic-sell during standard market corrections! Let me know if you want me to analyze a specific ticker.`
  },
  {
    keywords: ['hi', 'hello', 'hey', 'who are you'],
    response: `Hello! I'm your **Advisor AI**. I analyze market signals, risk parameters, and your portfolio data in real-time to provide actionable insights. 

How can I assist your wealth-building journey today?`
  },
  {
    keywords: ['market', 'today', 'news', 'forecast'],
    response: `**Market Intelligence Briefing 🌏**

Currently, we are seeing a **rotation into value stocks** as inflation data cools. 
- **Equities**: S&P 500 is testing new resistance levels.
- **Yields**: Treasury yields are stabilizing, which is positive for growth stocks.
- **Sentiment**: Greed Index is currently at 65 (Moderately Greed).

Would you like me to scan for specific trade opportunities in the Tech or Energy sectors?`
  },
  {
    keywords: ['help', 'how to', 'guide'],
    response: `### AI Advisor Quick Guide 📖

I can help you with:
- **Risk Analysis**: Type "analyze my risk".
- **Stock Picks**: Type "what should I buy?".
- **Diversification**: Type "am I diversified?".
- **Market Trends**: Type "market update".

Simply ask a question and I'll scan your portfolio and the live market data to give you the best answer.`
  }
];

const DEFAULT_RESPONSE = `I've analyzed your query, but I need a bit more detail to give you a precise signal. 🚀

I'm currently specialized in:
- **Asset Recommendations** ("What should I buy?")
- **Risk Mitigation** ("Explain my risk profile")
- **Market Sentiment** ("Crypto analysis" or "Market update")
- **Strategic Balancing** ("How to diversify")

*Please refine your question or ask about one of the topics above for an instant AI audit.*`;

const PAGE_GUIDES = {
  'Input Form': `### Profile Builder: Component Breakdown 🧬
1. **Risk DNA Form**: Multi-step questionnaire to build your psychological profile.
2. **Health Score Gauge**: Real-time audit of your financial stability.
3. **Growth Preview Chart**: Dynamic projection of your 10-year wealth based on current inputs.
4. **AI Insights Panel**: Real-time advice on how to improve your score.
5. **Progress Tracker**: Top bar showing your journey through the 3-step setup.`,
  
  'Dashboard': `### Wealth Terminal: Component Breakdown 🚀
1. **KPI Stat Cards**: Instant view of Total Wealth, Balance, Assets, and Growth.
2. **Capital Trajectory**: High-fidelity line chart showing your net worth history.
3. **Sector Allocation**: Pie chart visualizing your diversification strategy.
4. **Strategy Profile**: Summary of your active Risk DNA and investment style.
5. **Sector Analysis**: Detailed breakdown of sector weightings (Tech, Crypto, etc.).
6. **Portfolio Ledger**: Quick-access table for your 4 most recent transactions.
7. **Intelligence Tabs**: Switch between Overview, Analytics, and Full History.`,

  'Market': `### Trade Desk: Component Breakdown 📊
1. **Market Summary Stats**: Real-time scan of total assets and Fear/Greed index.
2. **Sector Tabs**: Quick-filter the market by Tech, Crypto, or Equity.
3. **Search Bar**: Instant lookup for specific tickers (e.g., AAPL, BTC).
4. **Market Cards**: Individual ticker summaries with AI signals, prices, and charts.
5. **Trade Buttons**: Actionable BUY/SELL triggers on every asset card.`,

  'History': `### Transaction Intelligence: Component Breakdown 📜
1. **Capital Trajectory**: Full-screen view of your portfolio's growth path.
2. **Projected Delta**: AI forecast of your 30-day balance trajectory.
3. **Activity Heatmap**: Visual intensity tracker for your trading frequency.
4. **Behavioral Audit Panel**: Cards detailing FOMO, over-trading, and risk alerts.
5. **Sector Alpha Pie**: Distribution of your assets by market category.
6. **Intelligence Ledger**: Searchable, sortable list of every historical move.`,

  'Simulator': `### Risk Simulator: Component Breakdown 📈
1. **Investment Parameters**: Inputs for SIP amount, time, and expected return.
2. **Projection Summary**: High-level result showing total wealth at retirement.
3. **30-Year Wealth Chart**: Visual representation of principal vs compound growth.
4. **Smart Insights**: AI-generated roadmap to hitting your financial goals.
5. **Yearly Breakdown**: Detailed expandable table showing year-by-year accumulation.`,

  'AI Advisor': `### Smart Signal Hub: Component Breakdown 🤖
1. **Signal Summary Stats**: Counts of active Buy, Sell, and Hold recommendations.
2. **Recommendation Cards**: Deep-dive analysis for specific high-conviction assets.
3. **Confidence Gauge**: Visualization of the AI's certainty for each signal.
4. **Risk Audit Tag**: Classification of asset risk (Low, Moderate, High).
5. **Reasoning List**: Bulleted points explaining the "Why" behind every signal.`,

  'Profile': `### User Settings: Component Breakdown ⚙️
1. **Risk Tolerance Selector**: Toggle between Conservative, Moderate, and Aggressive.
2. **Balance Summary**: Detailed view of your current liquid cash vs deposits.
3. **Account Details**: Management of your user ID and security parameters.`
};

export const mockAIChat = async (message, context = '') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const lowerMessage = message.toLowerCase();
      let matchedResponse = DEFAULT_RESPONSE;

      // 1. Keyword Matching (with word boundaries to avoid partial matches like 'this' triggering 'hi')
      for (const item of RESPONSES) {
        const hasMatch = item.keywords.some(kw => {
          const regex = new RegExp(`\\b${kw}\\b`, 'i');
          return regex.test(lowerMessage);
        });
        
        if (hasMatch) {
          matchedResponse = item.response;
          break;
        }
      }

      // 2. Comprehensive Page & Feature Intelligence Logic
      const isAskingAboutPage = lowerMessage.includes('this page') || 
                               lowerMessage.includes('here') || 
                               lowerMessage.includes('help') || 
                               lowerMessage.includes('guide') || 
                               lowerMessage.includes('components') || 
                               lowerMessage.includes('what are') || 
                               lowerMessage.includes('explain') || 
                               lowerMessage.includes('how to use');

      if (isAskingAboutPage) {
        // Detect specific feature/component mentions first
        if (lowerMessage.includes('heatmap')) matchedResponse = `The **Activity Heatmap** is a 28-day visual tracker. Blue blocks indicate high activity (3+ trades/day), helping you spot "Over-trading" habits.`;
        else if (lowerMessage.includes('behavioral') || lowerMessage.includes('audit')) matchedResponse = `The **Behavioral Audit** scans your history for emotional patterns. It looks for "FOMO" (buying at peaks) and "Panic-selling" (selling at troughs).`;
        else if (lowerMessage.includes('risk dna') || lowerMessage.includes('dna')) matchedResponse = `**Risk DNA** is your unique investment fingerprint. It uses your Age, Income, and Goals to calculate your tolerance and set AI signal boundaries.`;
        else if (lowerMessage.includes('signals')) matchedResponse = `**Smart Signals** (BUY/SELL/HOLD) are generated by our proprietary AI. They scan price action, RSI, and Volume to provide institutional-grade direction.`;
        else if (lowerMessage.includes('kpi') || lowerMessage.includes('stats')) matchedResponse = `The **KPI Stat Cards** give you an instant pulse on your empire: Total Wealth, Available Cash, and current Growth trajectory.`;
        else if (lowerMessage.includes('trajectory') || lowerMessage.includes('chart')) matchedResponse = `The **Capital Trajectory Chart** is a historical record of your net worth growth. It updates in real-time with every trade and market price shift.`;
        else if (lowerMessage.includes('ledger')) matchedResponse = `The **Intelligence Ledger** is your permanent audit log. It records execution price, quantity, and the exact terminal balance at the time of trade.`;
        else if (lowerMessage.includes('sip') || lowerMessage.includes('projection')) matchedResponse = `The **SIP Projection Engine** simulates 30 years of wealth creation. It accounts for monthly principal, compound growth, and optional inflation adjustments.`;
        else if (lowerMessage.includes('health') || lowerMessage.includes('score')) matchedResponse = `The **Financial Health Score** is a real-time audit of your setup. A score above 80 indicates strong diversification and risk alignment.`;
        
        // If no specific component, provide the full page breakdown
        else {
          for (const [pageName, guide] of Object.entries(PAGE_GUIDES)) {
            if (context.includes(pageName)) {
              matchedResponse = guide;
              break;
            }
          }
        }
      }

      // 3. Prepend Context-Aware Header
      if (context.includes('Dashboard')) {
         matchedResponse = `*Analyzing your Wealth Terminal...* \n\n` + matchedResponse;
      } else if (context.includes('Market')) {
         matchedResponse = `*Scanning the Trade Desk...* \n\n` + matchedResponse;
      } else if (context.includes('History')) {
         matchedResponse = `*Audit logs retrieved...* \n\n` + matchedResponse;
      } else if (context.includes('Simulator')) {
         matchedResponse = `*Simulation engine active...* \n\n` + matchedResponse;
      }

      resolve({ reply: matchedResponse });
    }, 600); 
  });
};

export const mockAIRecommend = async (marketData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate signals for all stocks passed in (crucial for Targeted Mode)
      const recommendations = marketData.map((asset, index) => {
        let signal = 'HOLD';
        let confidence = 50 + Math.floor(Math.random() * 30);
        let reasons = [];
        let shortReason = '';
        let risk = 'Moderate';

        // Simple mock logic - Buy if price ends in odd digit, Sell if ends in 4, Else Hold
        // This keeps it deterministic for the user session
        const priceStr = asset.price.toString();
        const lastDigit = parseInt(priceStr[priceStr.length - 1]);

        if (lastDigit % 2 !== 0) {
          signal = 'BUY';
          confidence += 15;
          shortReason = 'Strong upward momentum and institutional accumulation.';
          reasons = ['MACD crossover detected', 'Volume increasing on up days', 'Sector is outperforming'];
          risk = 'Low';
        } else if (lastDigit === 4) {
          signal = 'SELL';
          confidence += 10;
          shortReason = 'Overbought conditions and fading volume.';
          reasons = ['RSI above 80', 'Testing major resistance', 'Negative divergence'];
          risk = 'High';
        } else {
          shortReason = 'Consolidating in current price range.';
          reasons = ['Trading near moving averages', 'Neutral sentiment', 'Wait for breakout confirmation'];
        }

        return {
          symbol: asset.symbol,
          name: asset.name,
          price: asset.price,
          changePercent: parseFloat(asset.change) || 0,
          currency: asset.currency || 'USD',
          signal,
          confidence: Math.min(99, confidence),
          shortReason,
          reasons,
          risk
        };
      });

      resolve({
        source: 'local-mock-ai',
        recommendations
      });
    }, 1000);
  });
};
