import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import yahooFinanceModule from 'yahoo-finance2';
import { getCachedMarketData } from './marketController.js';

const YahooFinance = yahooFinanceModule.default || yahooFinanceModule;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// ---------- Smart Rule-Based Fallback ----------
function ruleBasedRecommendation(quote) {
  const changePercent = quote.regularMarketChangePercent || 0;
  const price = quote.regularMarketPrice || 0;
  const fiftyTwoWeekHigh = quote.fiftyTwoWeekHigh || price;
  const fiftyTwoWeekLow = quote.fiftyTwoWeekLow || price;
  const pe = quote.trailingPE;
  const distFromHigh = ((fiftyTwoWeekHigh - price) / fiftyTwoWeekHigh) * 100;
  const distFromLow = ((price - fiftyTwoWeekLow) / fiftyTwoWeekLow) * 100;

  let signal = 'HOLD';
  let confidence = 50;
  let reasons = [];

  if (changePercent > 2) { reasons.push(`Strong momentum: +${changePercent.toFixed(2)}% today`); }
  if (changePercent < -3) { reasons.push(`Selling pressure: ${changePercent.toFixed(2)}% today`); }
  if (distFromLow < 10) { reasons.push('Near 52-week low — potential value buy'); confidence += 20; }
  if (distFromHigh < 5) { reasons.push('Near 52-week high — consider taking profits'); confidence += 10; }
  if (pe && pe < 20) { reasons.push(`Attractive P/E of ${pe.toFixed(1)}`); confidence += 15; }
  if (pe && pe > 50) { reasons.push(`High P/E of ${pe.toFixed(1)} — overvalued risk`); confidence += 10; }

  if (distFromLow < 15 && (pe == null || pe < 30) && changePercent > -1) {
    signal = 'BUY';
    confidence = Math.min(90, 60 + (15 - distFromLow));
  } else if (distFromHigh < 5 || changePercent < -4 || (pe && pe > 60)) {
    signal = 'SELL';
    confidence = Math.min(85, 55 + Math.abs(changePercent) * 3);
  } else {
    signal = 'HOLD';
    confidence = 55;
  }

  if (reasons.length === 0) reasons.push('No strong signals — market is neutral');

  return { signal, confidence: Math.round(confidence), reasons };
}

// ---------- GET STOCK RECOMMENDATIONS ----------
export const getRecommendations = async (req, res) => {
  try {
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BTC-USD', 'ETH-USD', 'RELIANCE.NS', 'TCS.NS', 'INFY.NS'];
    let quotes = await getCachedMarketData();
    
    // If cache is simplified data, we might need raw quotes for the rule-based engine or AI
    // However, let's try to use what we have or fetch if missing
    if (!quotes) {
      quotes = await yahooFinance.quote(symbols);
    }

    const stockSummaries = quotes.map(q => ({
      symbol: q.symbol,
      name: q.shortName || q.name || q.symbol,
      price: q.regularMarketPrice || q.price,
      changePercent: q.regularMarketChangePercent || parseFloat(q.change) || 0,
      pe: q.trailingPE,
      fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: q.fiftyTwoWeekLow,
      marketCap: q.marketCap,
      currency: q.currency
    }));

    if (!groq && !genAI) {
      // Rule-based fallback if no AI is available
      const recommendations = quotes.map(q => {
        const rec = ruleBasedRecommendation(q);
        return {
          symbol: q.symbol,
          name: q.shortName || q.name || q.symbol,
          price: q.regularMarketPrice || q.price,
          changePercent: q.regularMarketChangePercent || parseFloat(q.change) || 0,
          currency: q.currency,
          ...rec
        };
      });
      return res.json({ recommendations, source: 'rule-based' });
    }

    // AI Analysis (Prioritize Groq for speed/quota)
    let aiRecs = [];
    let source = 'rule-based';

    if (groq) {
      const prompt = `
You are an expert quantitative stock analyst with 15 years of experience.
Analyze this real-time market data and provide BUY, SELL, or HOLD recommendations.

Market Data:
${JSON.stringify(stockSummaries, null, 2)}

Respond ONLY with a JSON array of ${stockSummaries.length} objects:
[
  {
    "symbol": "AAPL",
    "signal": "BUY/SELL/HOLD",
    "confidence": 0-100,
    "shortReason": "string",
    "reasons": ["string"],
    "risk": "Low/Medium/High"
  }
]`.trim();

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });
      
      const content = completion.choices[0]?.message?.content;
      const parsed = JSON.parse(content);
      aiRecs = Array.isArray(parsed) ? parsed : (parsed.recommendations || []);
      source = 'groq (llama-3.3)';
    } else if (genAI) {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = `Analyze market data: ${JSON.stringify(stockSummaries)}. Return JSON array of recommendations.`;
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleanJson = text.replace(/```json|```/g, '').trim();
      aiRecs = JSON.parse(cleanJson);
      source = 'gemini';
    }

    const recommendations = aiRecs.map((rec, idx) => {
      const original = stockSummaries.find(s => s.symbol === rec.symbol) || stockSummaries[idx];
      return {
        ...rec,
        price: original?.price,
        changePercent: original?.changePercent,
        currency: original?.currency,
        name: original?.name || rec.symbol
      };
    });

    res.json({ recommendations, source });

  } catch (err) {
    console.error('❌ AI Recommendation Error:', err.message);
    
    // Immediate Fallback to rule-based engine
    try {
      const currentMarketData = await getCachedMarketData();
      let quotesToAnalyze = currentMarketData;
      
      if (!quotesToAnalyze) {
        const fallbackSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BTC-USD', 'ETH-USD', 'RELIANCE.NS'];
        quotesToAnalyze = await yahooFinance.quote(fallbackSymbols);
      }

      const recommendations = (quotesToAnalyze || []).map(q => {
        const rec = ruleBasedRecommendation(q);
        return { 
          symbol: q.symbol, 
          name: q.shortName || q.name || q.symbol, 
          price: q.regularMarketPrice || q.price, 
          changePercent: q.regularMarketChangePercent || parseFloat(q.change) || 0, 
          currency: q.currency,
          shortReason: rec.reasons[0] || 'Based on technical indicators',
          risk: q.sector === 'Crypto' ? 'High' : 'Medium',
          ...rec 
        };
      });
      
      return res.json({ 
        recommendations, 
        source: 'rule-based', 
        note: 'AI service temporarily unavailable - switched to local analysis engine' 
      });
    } catch (fallbackErr) {
      console.error('❌ Critical Fallback Error:', fallbackErr.message);
      return res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  }
};

// ---------- AI CHATBOT ----------
const chatSessions = new Map(); // sessionId -> history

export const chatWithAI = async (req, res) => {
  const { message, sessionId } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  const sid = sessionId || 'default';

  try {
    // 1. Get cached market data for context (MUCH FASTER than fresh fetch)
    let contextData = await getCachedMarketData();
    
    // If cache is empty, do a limited quick fetch
    if (!contextData) {
      const symbols = ['AAPL', 'MSFT', 'BTC-USD', 'ETH-USD', 'RELIANCE.NS'];
      const quotes = await yahooFinance.quote(symbols);
      contextData = quotes.map(q => ({
        symbol: q.symbol,
        name: q.shortName || q.symbol,
        price: q.regularMarketPrice,
        change: q.regularMarketChangePercent?.toFixed(2) + '%',
      }));
    }

    if (!groq && !genAI) {
      // Rule-based chatbot fallback
      const msg = message.toLowerCase();
      let reply = '';
      if (msg.includes('buy') && msg.includes('stock')) {
        reply = `📊 **Stock Buying Strategy**\n\nHere's my framework for buying stocks:\n\n1. **Value Criteria** — Look for stocks trading within 15% of their 52-week low with a P/E below 25.\n2. **Momentum** — Positive daily change (+1% to +3%) with above-average volume is a healthy signal.\n3. **Fundamentals** — Strong companies like Apple, Microsoft, and Reliance tend to recover from dips.\n4. **Diversify** — Never put more than 10% of your capital in a single stock.\n\n*Current picks based on rule-based signals:* Check the "Smart Signals" tab for live BUY recommendations!`;
      } else if (msg.includes('sell')) {
        reply = `📉 **When to Sell**\n\nSell signals I watch:\n\n1. Stock is within 3-5% of its 52-week high — consider taking profits\n2. P/E ratio exceeds 60 — potential overvaluation\n3. Sustained daily losses > 3% for multiple days\n4. Better opportunity found elsewhere\n\n*Rule of thumb:* Set a stop-loss at 7-8% below your buy price to limit downside.`;
      } else if (msg.includes('crypto') || msg.includes('bitcoin') || msg.includes('btc')) {
        reply = `₿ **Crypto Insights**\n\nCrypto is a high-risk, high-reward asset class:\n\n- **Bitcoin (BTC)** — Digital gold, best for long-term hold\n- **Ethereum (ETH)** — Smart contract platform, strong fundamentals\n- **Solana (SOL)** — High-speed transactions, growing ecosystem\n\n⚠️ Never invest more than 5-15% of your portfolio in crypto. It's volatile!`;
      } else if (msg.includes('portfolio') || msg.includes('invest')) {
        reply = `💼 **Portfolio Building Strategy**\n\nA balanced portfolio for most investors:\n\n| Asset Class | Allocation |\n|---|---|\n| Large-cap stocks (AAPL, MSFT) | 40% |\n| Mid-cap growth stocks | 20% |\n| Indian blue-chips (Reliance, TCS) | 20% |\n| Crypto (BTC, ETH) | 10% |\n| Cash / Bonds | 10% |\n\nRebalance every quarter!`;
      } else if (msg.includes('risk')) {
        reply = `⚖️ **Risk Management**\n\nGolden rules:\n1. Never invest money you can't afford to lose\n2. Diversify across sectors and geographies\n3. Use stop-losses (7-8% below buy price)\n4. Keep 6 months of expenses as emergency fund\n5. Your risk score from our questionnaire determines your category — use the Input Form!`;
      } else {
        reply = `🤖 **AI Investment Advisor**\n\nI can help you with:\n- 📈 **Which stocks to buy or sell** — Ask "which stocks should I buy?"\n- 💼 **Portfolio advice** — Ask "how should I build my portfolio?"\n- ₿ **Crypto analysis** — Ask "tell me about Bitcoin"\n- ⚖️ **Risk management** — Ask "how do I manage risk?"\n- 📊 **Market insights** — Ask anything about investing!\n\nWhat would you like to know?`;
      }
      return res.json({ reply, sessionId: sid });
    }

    let reply = '';
    
    if (groq) {
      // Groq Chat with deep platform awareness
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are "Advisor AI", an elite financial analyst and strategic guide for the "Smart Investment Advisor" platform. Your mission is to provide institutional-grade investment insights and act as a comprehensive "Wealth Terminal Encyclopedia."

### 🌏 Real-Time Market Context: 
${JSON.stringify(contextData)}

### 🧠 YOUR COMPONENT KNOWLEDGE BASE (Product Guide):

1. **Dashboard (/dashboard) - The Strategic Hub**:
   - **KPI Stat Cards**: *What*: Real-time counts of Wealth, Cash, and Assets. *Why*: Provides an instant health-check of your liquidity and net worth.
   - **Capital Trajectory Chart**: *What*: A high-fidelity line graph of historical balance. *Why*: Helps you visualize long-term growth and identify where major gains/losses occurred.
   - **Sector Allocation (Pie Chart)**: *What*: Visual distribution of assets by category. *Why*: Essential for "Diversification Audit" to ensure you aren't over-exposed to a single sector like Tech or Crypto.
   - **Live Portfolio Ledger**: *What*: A mini-feed of latest trades. *Why*: Keeps your recent activity top-of-mind without leaving the main view.

2. **Market Feed (/market) - The Trade Desk**:
   - **Market Feed Cards**: *What*: Live price tickers for Stocks/Crypto. *Why*: Real-time data is the foundation of any execution strategy.
   - **Smart Signals**: *What*: AI labels (BUY/SELL/HOLD). *Why*: They provide an objective second opinion based on technical RSI and Volume analysis, reducing emotional trading.
   - **Sector Tabs**: *What*: Category filters. *Why*: Allows you to focus on specific investment themes (e.g., "Just Tech" or "Just Crypto").

3. **Transaction History (/history) - Behavioral Intelligence**:
   - **Activity Heatmap**: *What*: 28-day intensity tracker. *Why*: Detects "Over-trading." Too many trades in a short window usually lead to high fees and emotional exhaustion.
   - **Behavioral Audit Panel**: *What*: AI-driven risk alerts (FOMO, Panic-sell). *Why*: This is your "Investor Psychologist." It tells you if you are buying tops or selling bottoms so you can correct your behavior.
   - **Projected Delta**: *What*: A 30-day forecast. *Why*: Shows you the "path of least resistance" for your balance, encouraging disciplined saving.

4. **Risk Simulator (/simulator) - Forward Strategy**:
   - **SIP Projection Engine**: *What*: A compounding calculator. *Why*: Demonstrates the "Magic of Compounding." It shows how small monthly additions grow into millions over time.
   - **Inflation Toggle**: *What*: A purchasing-power adjustment. *Why*: Essential for "Real-world Planning." It shows what $1M today will actually buy you in 30 years.
   - **Goal Tracker**: *What*: Visual milestone line. *Why*: Keeps you focused on your target (Retirement, House, etc.) rather than short-term market noise.

5. **Profile Builder (/) - Risk DNA**:
   - **Health Score Gauge**: *What*: Financial stability audit. *Why*: Prevents you from taking on more risk than your income and age allow.
   - **Growth Preview**: *What*: Onboarding chart. *Why*: Gives you immediate positive reinforcement of what's possible with the right strategy.

### 📜 EXECUTION GUIDELINES:
1. **Explain the "Why"**: If a user asks about a component, always explain its strategic value (e.g., "We use the Heatmap to detect over-trading...").
2. **Be Precise**: Refer to components by their exact names as listed above.
3. **Data-Driven**: Use the Market Context for real prices.
4. **Markdown Mastery**: Use tables, bold text, and bullet points.
5. **Tone**: Senior Investment Partner. Professional, educational, and authoritative.`
          },
          { role: 'user', content: message }
        ],
        model: 'llama-3.3-70b-versatile',
      });
      reply = completion.choices[0]?.message?.content;
    } else if (genAI) {
      // Gemini Chat Fallback
      if (!chatSessions.has(sid)) chatSessions.set(sid, []);
      const history = chatSessions.get(sid);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash',
        systemInstruction: `You are "Advisor AI", an elite financial advisor. Context: ${JSON.stringify(contextData)}. Use Markdown. Be professional and data-driven.`
      });
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(message);
      reply = result.response.text();
    }

    res.json({ reply, sessionId: sid });

  } catch (err) {
    console.error('Chat error:', err.message);
    // Fallback rule-based chat on quota/rate-limit
    const msg = (req.body.message || '').toLowerCase();
    let reply = '';
    if (msg.includes('buy')) reply = '📈 **BUY Strategy**: Look for stocks near 52-week lows with P/E below 25 and positive momentum. Check the Smart Signals tab for live AI picks!';
    else if (msg.includes('sell')) reply = '📉 **SELL Strategy**: Consider selling when a stock is within 5% of its 52-week high or P/E exceeds 60. Always set stop-losses at 7-8% below your buy price.';
    else if (msg.includes('crypto') || msg.includes('bitcoin')) reply = '₿ **Crypto**: Bitcoin is digital gold — best for long-term holds. Ethereum has strong fundamentals. Never invest more than 10-15% of portfolio in crypto due to volatility.';
    else if (msg.includes('portfolio')) reply = '💼 **Portfolio**: A balanced mix — 40% large-cap stocks, 20% growth stocks, 20% Indian blue-chips, 10% crypto, 10% cash/bonds. Rebalance quarterly!';
    else reply = '⚡ The AI quota is temporarily rate-limited (free tier). Smart rule-based answers are still available! Ask me about buy/sell strategy, crypto, or portfolio advice.';
    return res.json({ reply, sessionId: req.body.sessionId || 'default' });
  }
};
