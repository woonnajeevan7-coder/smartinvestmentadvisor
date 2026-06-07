# Smart Investment Advisor - Compiled Source Code

This document contains the complete frontend and backend source code of the Smart Investment Advisor application, compiled for analysis and backups.

---

## 🗄️ Database Schemas

### 1. `database/schema.sql`
```sql
-- Create database
CREATE DATABASE IF NOT EXISTS smartinvestmentadvisor;
USE smartinvestmentadvisor;

-- Table: USER
CREATE TABLE IF NOT EXISTS USER (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: USER_PROFILE
CREATE TABLE IF NOT EXISTS USER_PROFILE (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    age INT NOT NULL,
    monthly_income DECIMAL(15,2) NOT NULL,
    savings DECIMAL(15,2) NOT NULL,
    investment_duration ENUM('Short', 'Mid', 'Long', 'Retirement') NOT NULL,
    risk_preference INT NOT NULL CHECK (risk_preference BETWEEN 1 AND 10),
    FOREIGN KEY (user_id) REFERENCES USER(id) ON DELETE CASCADE
);

-- Table: RISK_CATEGORY
CREATE TABLE IF NOT EXISTS RISK_CATEGORY (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- Table: USER_CATEGORY
CREATE TABLE IF NOT EXISTS USER_CATEGORY (
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (user_id, category_id),
    FOREIGN KEY (user_id) REFERENCES USER(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES RISK_CATEGORY(id) ON DELETE CASCADE
);

-- Table: MARKET_SECTOR
CREATE TABLE IF NOT EXISTS MARKET_SECTOR (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Table: ASSET
CREATE TABLE IF NOT EXISTS ASSET (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ticker VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g., 'Stock', 'Bond', 'ETF', 'Crypto'
    sector_id INT NOT NULL,
    FOREIGN KEY (sector_id) REFERENCES MARKET_SECTOR(id) ON DELETE CASCADE
);

-- Table: ASSET_PERFORMANCE
CREATE TABLE IF NOT EXISTS ASSET_PERFORMANCE (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    return_rate DECIMAL(5,2) NOT NULL, -- e.g., 8.5 for 8.5%
    risk_level VARCHAR(50), -- e.g., 'Low', 'Medium', 'High'
    FOREIGN KEY (asset_id) REFERENCES ASSET(id) ON DELETE CASCADE
);

-- Table: CATEGORY_SUGGESTION
CREATE TABLE IF NOT EXISTS CATEGORY_SUGGESTION (
    category_id INT NOT NULL,
    asset_id INT NOT NULL,
    allocation_percentage DECIMAL(5,2) NOT NULL,
    PRIMARY KEY (category_id, asset_id),
    FOREIGN KEY (category_id) REFERENCES RISK_CATEGORY(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES ASSET(id) ON DELETE CASCADE
);

-- ==========================================
-- Insert Mock Data
-- ==========================================

-- Risk Categories
INSERT IGNORE INTO RISK_CATEGORY (name, description) VALUES
('Short Term', 'Focus on capital preservation and liquidity. Low risk.'),
('Mid Term', 'Balanced approach between growth and security. Moderate risk.'),
('Long Term', 'Focus on capital growth. Higher risk tolerance.'),
('Retirement', 'Aggressive growth early on, shifting to preservation later.');

-- Market Sectors
INSERT IGNORE INTO MARKET_SECTOR (name) VALUES
('Technology'), ('Finance'), ('Healthcare'), ('Government'), ('Crypto'), ('Broad Market');

-- Assets
INSERT IGNORE INTO ASSET (name, ticker, type, sector_id) VALUES
('Apple Inc.', 'AAPL', 'Stock', 1),
('Microsoft Corp.', 'MSFT', 'Stock', 1),
('JPMorgan Chase', 'JPM', 'Stock', 2),
('UnitedHealth Group', 'UNH', 'Stock', 3),
('US Treasury Bond 10Y', 'US10Y', 'Bond', 4),
('Vanguard 500 Index Fund', 'VOO', 'ETF', 6),
('Bitcoin', 'BTC', 'Crypto', 5),
('Ethereum', 'ETH', 'Crypto', 5);

-- Asset Performance
INSERT IGNORE INTO ASSET_PERFORMANCE (asset_id, return_rate, risk_level) VALUES
(1, 15.5, 'Medium'),
(2, 14.2, 'Medium'),
(3, 8.5, 'Medium'),
(4, 9.0, 'Medium'),
(5, 4.2, 'Low'),
(6, 10.0, 'Medium'),
(7, 45.0, 'High'),
(8, 50.0, 'High');

-- Category Suggestions (Allocations)
-- Assuming IDs: 
-- Categories: 1=Short Term, 2=Mid Term, 3=Long Term, 4=Retirement
-- Assets: 1=AAPL, 2=MSFT, 3=JPM, 4=UNH, 5=US10Y, 6=VOO, 7=BTC, 8=ETH

-- Short Term Allocation (mostly bonds, some broad market)
INSERT IGNORE INTO CATEGORY_SUGGESTION (category_id, asset_id, allocation_percentage) VALUES
(1, 5, 80.0), -- 80% Bonds
(1, 6, 20.0); -- 20% S&P 500

-- Mid Term Allocation
INSERT IGNORE INTO CATEGORY_SUGGESTION (category_id, asset_id, allocation_percentage) VALUES
(2, 5, 40.0), -- 40% Bonds
(2, 6, 40.0), -- 40% S&P 500
(2, 1, 10.0), -- 10% AAPL
(2, 2, 10.0); -- 10% MSFT

-- Long Term Allocation
INSERT IGNORE INTO CATEGORY_SUGGESTION (category_id, asset_id, allocation_percentage) VALUES
(3, 6, 50.0), -- 50% S&P 500
(3, 1, 15.0), -- 15% AAPL
(3, 2, 15.0), -- 15% MSFT
(3, 3, 10.0), -- 10% JPM
(3, 7, 10.0); -- 10% Crypto (BTC)

-- Retirement Allocation (very aggressive growth)
INSERT IGNORE INTO CATEGORY_SUGGESTION (category_id, asset_id, allocation_percentage) VALUES
(4, 6, 60.0), -- 60% S&P 500
(4, 1, 10.0), -- 10% AAPL
(4, 4, 10.0), -- 10% UNH
(4, 7, 10.0), -- 10% BTC
(4, 8, 10.0); -- 10% ETH
```

### 2. `database/banking_schema.sql`
```sql
-- Additional schema for banking and trading functionality

USE smartinvestmentadvisor;

-- Add balance to USER table if not exists
ALTER TABLE USER ADD COLUMN IF NOT EXISTS balance DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE USER ADD COLUMN IF NOT EXISTS total_deposited DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE USER ADD COLUMN IF NOT EXISTS total_withdrawn DECIMAL(15,2) DEFAULT 0.00;

-- Table: TRANSACTIONS
CREATE TABLE IF NOT EXISTS TRANSACTIONS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('BUY', 'SELL', 'Deposit', 'Withdraw') NOT NULL,
    symbol VARCHAR(20),
    name VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    quantity INT DEFAULT 0,
    price DECIMAL(15,2) DEFAULT 0.00,
    method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Completed',
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USER(id) ON DELETE CASCADE
);

-- Table: HOLDINGS
CREATE TABLE IF NOT EXISTS HOLDINGS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    avg_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (user_id, symbol),
    FOREIGN KEY (user_id) REFERENCES USER(id) ON DELETE CASCADE
);
```

---

## ⚙️ Backend Server

### 3. `server/app.js`
```javascript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import advisorRoutes from "./routes/advisorRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", advisorRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### 4. `server/config/db.js`
```javascript
import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Bhavan@07",
  database: "smartinvestmentadvisor",
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.error(" Database connection failed:", err.message);
  } else {
    console.log(" Connected to MySQL Database");
  }
});

export default db;
```

### 5. `server/routes/advisorRoutes.js`
```javascript
import express from "express";
import { analyzeUser } from "../controllers/advisorController.js";
import { getMarketData, getStockHistory } from "../controllers/marketController.js";
import { getRecommendations, chatWithAI } from "../controllers/aiController.js";
import { register, getProfile } from "../controllers/authController.js";
import { 
  getHoldings, 
  buyAsset, 
  sellAsset, 
  getHistory, 
  updateWallet 
} from "../controllers/transactionController.js";

const router = express.Router();

// Auth Routes
router.post("/register", register);
router.get("/profile", getProfile);

// Advisor/Analysis
router.post("/analyze-user", analyzeUser);

// Market Data
router.get("/market", getMarketData);
router.get("/market/history/:symbol", getStockHistory);

// Trading & Banking
router.get("/holdings", getHoldings);
router.post("/trade/buy", buyAsset);
router.post("/trade/sell", sellAsset);
router.get("/history", getHistory);
router.post("/wallet/update", updateWallet);

// AI Routes
router.get("/ai/recommend", getRecommendations);
router.post("/ai/chat", chatWithAI);

export default router;
```

### 6. `server/controllers/authController.js`
```javascript
import db from "../config/db.js";

/**
 * Handle user registration or guest session initialization
 */
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const promiseDb = db.promise();
    
    // Check if user already exists
    const [existing] = await promiseDb.query("SELECT * FROM USER WHERE email = ?", [email]);
    
    if (existing.length > 0) {
      return res.json({ 
        message: "Login successful", 
        user: { 
          id: existing[0].id, 
          name: existing[0].name, 
          email: existing[0].email,
          balance: existing[0].balance 
        } 
      });
    }

    // Create new user
    const [result] = await promiseDb.query(
      "INSERT INTO USER (name, email) VALUES (?, ?)",
      [name || "Guest User", email]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: result.insertId,
        name: name || "Guest User",
        email: email,
        balance: 0
      }
    });

  } catch (err) {
    console.error("❌ Registration Error:", err);
    res.status(500).json({ error: "Internal Server Error during registration" });
  }
};

/**
 * Fetch current user profile and stats from database
 */
export const getProfile = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const promiseDb = db.promise();
    const [rows] = await promiseDb.query("SELECT * FROM USER WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0];
    
    // Get profile data
    const [profiles] = await promiseDb.query("SELECT * FROM USER_PROFILE WHERE user_id = ?", [user.id]);
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        totalDeposited: user.total_deposited,
        totalWithdrawn: user.total_withdrawn
      },
      profile: profiles.length > 0 ? profiles[0] : null
    });

  } catch (err) {
    console.error("❌ Profile Fetch Error:", err);
    res.status(500).json({ error: "Internal Server Error fetching profile" });
  }
};
```

### 7. `server/controllers/advisorController.js`
```javascript
import db from "../config/db.js";

export const analyzeUser = async (req, res) => {
  const { age, income, savings, duration, risk, email, name } = req.body;

  const userEmail = email || "guest@example.com";
  const userName = name || "Guest User";
  const a = parseInt(age) || 0;
  const inc = parseInt(income) || 0;
  const sav = parseInt(savings) || 0;
  const r = parseInt(risk) || 5;

  console.log(`🔍 Processing analysis for: ${userEmail}`);

  try {
    const promiseDb = db.promise();

    // 1. Ensure User exists
    await promiseDb.query(
      "INSERT IGNORE INTO USER (name, email) VALUES (?, ?)",
      [userName, userEmail]
    );

    // Get the user ID
    const [rows] = await promiseDb.query("SELECT id FROM USER WHERE email = ?", [userEmail]);
    if (rows.length === 0) throw new Error("User could not be created or found");
    const userId = rows[0].id;

    // 2. Save/Update Profile
    // Check if profile exists
    const [profiles] = await promiseDb.query("SELECT id FROM USER_PROFILE WHERE user_id = ?", [userId]);
    
    const formattedDuration = duration ? duration.split(' ')[0] : 'Short';

    if (profiles.length > 0) {
      // Update existing
      console.log(`Updating profile for user ID: ${userId}`);
      await promiseDb.query(
        `UPDATE USER_PROFILE SET age = ?, monthly_income = ?, savings = ?, investment_duration = ?, risk_preference = ? 
         WHERE user_id = ?`,
        [a, inc, sav, formattedDuration, r, userId]
      );
    } else {
      // Insert new
      console.log(`Creating new profile for user ID: ${userId}`);
      await promiseDb.query(
        `INSERT INTO USER_PROFILE (user_id, age, monthly_income, savings, investment_duration, risk_preference) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, a, inc, sav, formattedDuration, r]
      );
    }

    // --- Logic for score calculation ---
    let ageFactor = a < 25 ? 3 : a <= 40 ? 2 : a <= 60 ? 1 : 0;
    let incomeFactor = inc > 100000 ? 3 : inc >= 50000 ? 2 : 1;
    let savingsFactor = (inc > 0 ? sav / inc : 0) > 0.5 ? 3 : (inc > 0 ? sav / inc : 0) >= 0.2 ? 2 : 1;
    let durationFactor = duration === "Short Term" ? 1 : duration === "Mid Term" ? 2 : duration === "Long Term" ? 3 : 4;
    
    const totalScore = (ageFactor * 2) + (incomeFactor * 2) + (savingsFactor * 2) + (durationFactor * 3) + r;

    let category = "Short Term";
    if (totalScore <= 15) category = "Short Term";
    else if (totalScore <= 25) category = "Mid Term";
    else if (totalScore <= 35) category = "Long Term";
    else category = "Retirement";

    // 3. Fetch Recommendations
    const query = `
      SELECT a.name as asset_name, a.type as asset_type
      FROM ASSET a
      JOIN CATEGORY_SUGGESTION cs ON a.id = cs.asset_id
      JOIN RISK_CATEGORY rc ON cs.category_id = rc.id
      WHERE rc.name = ?
    `;

    const [recommendations] = await promiseDb.query(query, [category]);

    console.log(`✅ Analysis complete for ${userEmail}. Category: ${category}`);

    res.json({
      category,
      score: totalScore,
      recommendations: recommendations.length > 0 ? recommendations : [
        { asset_name: "S&P 500 Index", asset_type: "ETF" },
        { asset_name: "Government Bonds", asset_type: "Bond" }
      ]
    });

  } catch (err) {
    console.error("❌ Database Error details:", err);
    res.status(500).json({ 
      error: "Internal Server Error during analysis",
      details: err.message 
    });
  }
};
```

### 8. `server/controllers/aiController.js`
```javascript
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
  const symbol = quote.symbol || '';
  const changePercent = quote.regularMarketChangePercent || parseFloat(quote.change) || 0;
  const price = quote.regularMarketPrice || quote.price || 0;
  const fiftyTwoWeekHigh = quote.fiftyTwoWeekHigh || price * 1.1;
  const fiftyTwoWeekLow = quote.fiftyTwoWeekLow || price * 0.9;
  const pe = quote.trailingPE;
  
  const distFromHigh = ((fiftyTwoWeekHigh - price) / fiftyTwoWeekHigh) * 100;
  const distFromLow = ((price - fiftyTwoWeekLow) / fiftyTwoWeekLow) * 100;

  let signal = 'HOLD';
  let confidence = 50 + (Math.abs(changePercent) * 2);
  let reasons = [];

  // Logic for BUY
  if (distFromLow < 15) {
    signal = 'BUY';
    confidence = 70 + (15 - distFromLow);
    reasons.push('Trading near 52-week support levels.');
  } else if (changePercent > 1.5) {
    signal = 'BUY';
    confidence = 65 + (changePercent * 2);
    reasons.push(`Strong intraday momentum: +${changePercent.toFixed(2)}%`);
  } else if (pe && pe < 18) {
    signal = 'BUY';
    confidence = 60 + (18 - pe);
    reasons.push(`Undervalued with P/E of ${pe.toFixed(1)}`);
  }

  // Logic for SELL
  if (distFromHigh < 5 && signal !== 'BUY') {
    signal = 'SELL';
    confidence = 75 + (5 - distFromHigh);
    reasons.push('Resistance near 52-week high reached.');
  } else if (changePercent < -2.5) {
    signal = 'SELL';
    confidence = 70 + Math.abs(changePercent);
    reasons.push(`Significant downward pressure: ${changePercent.toFixed(2)}%`);
  } else if (pe && pe > 45 && signal !== 'BUY') {
    signal = 'SELL';
    confidence = 65 + (pe / 10);
    reasons.push(`High valuation risk (P/E: ${pe.toFixed(1)})`);
  }

  // Final check for HOLD if nothing triggered or confidence is too low
  if (reasons.length === 0 || (changePercent > -0.5 && changePercent < 0.5)) {
    signal = 'HOLD';
    confidence = 50 + Math.random() * 10;
    reasons = ['Market consolidation — wait for clear breakout.'];
  }

  return { 
    signal, 
    confidence: Math.min(95, Math.round(confidence)), 
    reasons: reasons.length > 0 ? reasons : ['Neutral market sentiment.']
  };
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
```

### 9. `server/controllers/marketController.js`
```javascript
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
```

### 10. `server/controllers/transactionController.js`
```javascript
import db from "../config/db.js";

/**
 * Get user holdings from DB
 */
export const getHoldings = async (req, res) => {
  const { userId } = req.query;
  try {
    const [rows] = await db.promise().query("SELECT * FROM HOLDINGS WHERE user_id = ?", [userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Handle Buy Asset
 */
export const buyAsset = async (req, res) => {
  const { userId, symbol, name, quantity, price } = req.body;
  const totalCost = quantity * price;

  try {
    const promiseDb = db.promise();
    
    // 1. Check Balance
    const [user] = await promiseDb.query("SELECT balance FROM USER WHERE id = ?", [userId]);
    if (user[0].balance < totalCost) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // 2. Start Transaction (Logical)
    // Update Balance
    await promiseDb.query("UPDATE USER SET balance = balance - ? WHERE id = ?", [totalCost, userId]);

    // Update Holdings
    await promiseDb.query(`
      INSERT INTO HOLDINGS (user_id, symbol, name, quantity, avg_price)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      avg_price = (avg_price * quantity + ?) / (quantity + ?),
      quantity = quantity + ?
    `, [userId, symbol, name, quantity, price, totalCost, quantity, quantity]);

    // Record Transaction
    await promiseDb.query(`
      INSERT INTO TRANSACTIONS (user_id, type, symbol, name, amount, quantity, price)
      VALUES (?, 'BUY', ?, ?, ?, ?, ?)
    `, [userId, symbol, name, totalCost, quantity, price]);

    res.json({ success: true, message: "Purchase successful" });

  } catch (err) {
    console.error("❌ Buy Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Handle Sell Asset
 */
export const sellAsset = async (req, res) => {
  const { userId, symbol, quantity, price } = req.body;
  const totalGain = quantity * price;

  try {
    const promiseDb = db.promise();
    
    // 1. Check Holdings
    const [holding] = await promiseDb.query("SELECT quantity FROM HOLDINGS WHERE user_id = ? AND symbol = ?", [userId, symbol]);
    if (!holding.length || holding[0].quantity < quantity) {
      return res.status(400).json({ error: "Insufficient shares" });
    }

    // 2. Update Balance
    await promiseDb.query("UPDATE USER SET balance = balance + ? WHERE id = ?", [totalGain, userId]);

    // 3. Update Holdings
    if (holding[0].quantity === parseInt(quantity)) {
      await promiseDb.query("DELETE FROM HOLDINGS WHERE user_id = ? AND symbol = ?", [userId, symbol]);
    } else {
      await promiseDb.query("UPDATE HOLDINGS SET quantity = quantity - ? WHERE user_id = ? AND symbol = ?", [quantity, userId, symbol]);
    }

    // 4. Record Transaction
    await promiseDb.query(`
      INSERT INTO TRANSACTIONS (user_id, type, symbol, amount, quantity, price)
      VALUES (?, 'SELL', ?, ?, ?, ?)
    `, [userId, symbol, totalGain, quantity, price]);

    res.json({ success: true, message: "Sale successful" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Handle Wallet Actions (Deposit/Withdraw)
 */
export const updateWallet = async (req, res) => {
  const { userId, type, amount, method } = req.body;
  const numAmount = parseFloat(amount);

  try {
    const promiseDb = db.promise();
    if (type === 'Deposit') {
      await promiseDb.query("UPDATE USER SET balance = balance + ?, total_deposited = total_deposited + ? WHERE id = ?", [numAmount, numAmount, userId]);
    } else {
      const [user] = await promiseDb.query("SELECT balance FROM USER WHERE id = ?", [userId]);
      if (user[0].balance < numAmount) return res.status(400).json({ error: "Insufficient funds" });
      await promiseDb.query("UPDATE USER SET balance = balance - ?, total_withdrawn = total_withdrawn + ? WHERE id = ?", [numAmount, numAmount, userId]);
    }

    await promiseDb.query(`
      INSERT INTO TRANSACTIONS (user_id, type, amount, method)
      VALUES (?, ?, ?, ?)
    `, [userId, type, numAmount, method]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get Transaction History
 */
export const getHistory = async (req, res) => {
  const { userId } = req.query;
  try {
    const [rows] = await db.promise().query("SELECT * FROM TRANSACTIONS WHERE user_id = ? ORDER BY date DESC", [userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

---

## 🎨 Frontend React Client

### 11. `client/src/main.jsx`
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
```

### 12. `client/src/App.jsx`
```javascript
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import InputForm from './pages/InputForm';
import DashboardPage from './pages/DashboardPage';
import Simulator from './pages/Simulator';
import History from './pages/History';
import Market from './pages/Market';
import Profile from './pages/Profile';
import Login from './pages/Login';
import AIAdvisor from './pages/AIAdvisor';
import Banking from './pages/Banking';
import LoaderDemo from './pages/LoaderDemo';
import AIFloatingChat from './components/AIFloatingChat';
import { MarketProvider } from './context/MarketContext';
import { UserProvider, useUser } from './context/UserContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useUser();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppContent() {
  const { isAuthenticated } = useUser();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="flex min-h-screen bg-neu-bg text-neu-primary font-dm-sans selection:bg-neu-accent selection:text-white">
      {isAuthenticated && !isLoginPage && <Sidebar />}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neu-bg">
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
          
          <Route path="/" element={<ProtectedRoute><InputForm /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/simulator" element={<ProtectedRoute><Simulator /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/market" element={<ProtectedRoute><Market /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/ai" element={<ProtectedRoute><AIAdvisor /></ProtectedRoute>} />
          <Route path="/banking" element={<ProtectedRoute><Banking /></ProtectedRoute>} />
          <Route path="/loader-demo" element={<ProtectedRoute><LoaderDemo /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        </Routes>
        {isAuthenticated && <AIFloatingChat />}
      </main>
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <MarketProvider>
        <AppContent />
      </MarketProvider>
    </UserProvider>
  );
}

export default App;
```

### 13. `client/src/context/UserContext.jsx`
```javascript
import { createContext, useState, useEffect, useContext } from 'react';
import { 
  registerUser, 
  fetchProfile, 
  fetchHoldings, 
  buyStockApi, 
  sellStockApi, 
  updateWalletApi, 
  fetchHistory 
} from '../services/api';

const UserContext = createContext();

const safeParse = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) { return fallback; }
};

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => safeParse('user_data', {
    id: null,
    name: 'Guest User',
    email: '',
    riskScore: 0,
    category: 'Not Calculated',
    balance: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    goalAmount: 250000
  }));

  const [isAuthenticated, setIsAuthenticated] = useState(() => 
    localStorage.getItem('auth_token') === 'active'
  );

  const [holdings, setHoldings] = useState(() => safeParse('user_holdings', []));
  const [transactions, setTransactions] = useState(() => safeParse('user_transactions', []));
  const [balanceHistory, setBalanceHistory] = useState(() => safeParse('user_balance_history', [0]));
  const [watchlist, setWatchlist] = useState(() => safeParse('user_watchlist', []));

  // Persist state to localStorage on every change
  useEffect(() => { localStorage.setItem('user_data', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('user_holdings', JSON.stringify(holdings)); }, [holdings]);
  useEffect(() => { localStorage.setItem('user_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('user_balance_history', JSON.stringify(balanceHistory)); }, [balanceHistory]);
  useEffect(() => { localStorage.setItem('user_watchlist', JSON.stringify(watchlist)); }, [watchlist]);

  // Sync from backend silently after login
  const syncUserData = async (email) => {
    try {
      const profileData = await fetchProfile(email);
      const { user: dbUser, profile } = profileData;
      setUser(prev => ({
        ...prev,
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        balance: parseFloat(dbUser.balance) || prev.balance,
        totalDeposited: parseFloat(dbUser.totalDeposited) || prev.totalDeposited,
        totalWithdrawn: parseFloat(dbUser.totalWithdrawn) || prev.totalWithdrawn,
        riskScore: profile?.risk_preference || prev.riskScore,
        category: profile?.investment_duration || prev.category
      }));
      if (dbUser.id) {
        const dbHoldings = await fetchHoldings(dbUser.id);
        if (dbHoldings?.length) setHoldings(dbHoldings);
        const dbHistory = await fetchHistory(dbUser.id);
        if (dbHistory?.length) setTransactions(dbHistory);
      }
    } catch (err) {
      console.warn("Backend sync skipped (offline mode):", err.message);
    }
  };

  const updateRiskProfile = (score, category) => {
    setUser(prev => ({ ...prev, riskScore: score, category }));
  };

  // ── BUY STOCK ── Local-first, backend sync after
  const buyStock = async (stock, quantity, price) => {
    const numPrice = parseFloat(price);
    const numQty = parseInt(quantity);
    const totalCost = numQty * numPrice;
    const currentBalance = parseFloat(user.balance) || 0;

    if (currentBalance < totalCost) {
      return { success: false, message: `Insufficient balance. Need $${totalCost.toLocaleString()}, have $${currentBalance.toLocaleString()}` };
    }

    // Local update immediately
    const newBal = Number((currentBalance - totalCost).toFixed(2));
    setUser(prev => ({ ...prev, balance: newBal }));
    setBalanceHistory(prev => [...prev, newBal].slice(-20));
    setHoldings(prev => {
      const existing = prev.find(h => h.symbol === stock.symbol);
      if (existing) {
        const newQty = existing.quantity + numQty;
        const newAvg = ((existing.avg_price || existing.avgPrice) * existing.quantity + totalCost) / newQty;
        return prev.map(h => h.symbol === stock.symbol ? { ...h, quantity: newQty, avg_price: newAvg, avgPrice: newAvg } : h);
      }
      return [...prev, { symbol: stock.symbol, name: stock.name, quantity: numQty, avg_price: numPrice, avgPrice: numPrice }];
    });
    setTransactions(prev => [{
      id: Date.now(), type: 'BUY', symbol: stock.symbol, name: stock.name,
      amount: totalCost, quantity: numQty, price: numPrice, date: new Date().toISOString(), status: 'Completed'
    }, ...prev]);

    // Backend sync (non-blocking)
    if (user.id) {
      try {
        await buyStockApi({ userId: user.id, symbol: stock.symbol, name: stock.name, quantity: numQty, price: numPrice });
      } catch (err) { console.warn("Buy backend sync failed:", err.message); }
    }
    return { success: true };
  };

  // ── SELL STOCK ── Local-first, backend sync after
  const sellStock = async (symbol, quantity, price) => {
    const numPrice = parseFloat(price);
    const numQty = parseInt(quantity);
    const totalGain = numQty * numPrice;
    const holding = holdings.find(h => h.symbol === symbol);

    if (!holding || holding.quantity < numQty) {
      return { success: false, message: 'Insufficient shares to sell' };
    }

    const newBal = Number(((parseFloat(user.balance) || 0) + totalGain).toFixed(2));
    setUser(prev => ({ ...prev, balance: newBal }));
    setBalanceHistory(prev => [...prev, newBal].slice(-20));
    setHoldings(prev => prev
      .map(h => h.symbol === symbol ? { ...h, quantity: h.quantity - numQty } : h)
      .filter(h => h.quantity > 0)
    );
    setTransactions(prev => [{
      id: Date.now(), type: 'SELL', symbol, amount: totalGain,
      quantity: numQty, price: numPrice, date: new Date().toISOString(), status: 'Completed'
    }, ...prev]);

    if (user.id) {
      try {
        await sellStockApi({ userId: user.id, symbol, quantity: numQty, price: numPrice });
      } catch (err) { console.warn("Sell backend sync failed:", err.message); }
    }
    return { success: true };
  };

  // ── DEPOSIT ── Local-first
  const depositFunds = async (amount, method) => {
    const numAmount = parseFloat(amount);
    const newBal = Number(((parseFloat(user.balance) || 0) + numAmount).toFixed(2));
    setUser(prev => ({
      ...prev,
      balance: newBal,
      totalDeposited: Number(((parseFloat(prev.totalDeposited) || 0) + numAmount).toFixed(2))
    }));
    setTransactions(prev => [{
      id: Date.now(), type: 'Deposit', amount: numAmount,
      method, date: new Date().toISOString(), status: 'Completed'
    }, ...prev]);
    setBalanceHistory(prev => [...prev, newBal].slice(-20));

    if (user.id) {
      try { await updateWalletApi({ userId: user.id, type: 'Deposit', amount: numAmount, method }); }
      catch (err) { console.warn("Deposit backend sync failed:", err.message); }
    }
    return { success: true };
  };

  // ── WITHDRAW ── Local-first
  const withdrawFunds = async (amount, method) => {
    const numAmount = parseFloat(amount);
    const currentBalance = parseFloat(user.balance) || 0;
    if (currentBalance < numAmount) return { success: false, message: 'Insufficient funds' };

    const newBal = Number((currentBalance - numAmount).toFixed(2));
    setUser(prev => ({
      ...prev,
      balance: newBal,
      totalWithdrawn: Number(((parseFloat(prev.totalWithdrawn) || 0) + numAmount).toFixed(2))
    }));
    setTransactions(prev => [{
      id: Date.now(), type: 'Withdraw', amount: numAmount,
      method, date: new Date().toISOString(), status: 'Completed'
    }, ...prev]);
    setBalanceHistory(prev => [...prev, newBal].slice(-20));

    if (user.id) {
      try { await updateWalletApi({ userId: user.id, type: 'Withdraw', amount: numAmount, method }); }
      catch (err) { console.warn("Withdraw backend sync failed:", err.message); }
    }
    return { success: true };
  };

  // ── LOGIN ──
  const login = async (userData) => {
    const localUser = {
      id: null,
      name: userData.name || userData.email?.split('@')[0] || 'User',
      email: userData.email,
      balance: 0, totalDeposited: 0, totalWithdrawn: 0, goalAmount: 250000
    };
    setUser(prev => ({ ...prev, ...localUser }));
    setIsAuthenticated(true);
    localStorage.setItem('auth_token', 'active');
    localStorage.setItem('user_email', userData.email);
    try {
      const res = await registerUser(userData);
      if (res?.user) setUser(prev => ({ ...prev, ...res.user }));
      await syncUserData(userData.email);
    } catch (err) {
      console.warn("Backend login failed, using local mode:", err.message);
    }
  };

  const toggleWatchlist = (symbol) => {
    setWatchlist(prev => prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]);
  };

  const resetBanking = () => {
    setUser(prev => ({ ...prev, balance: 0, totalDeposited: 0, totalWithdrawn: 0 }));
    setTransactions([]);
    setBalanceHistory([0]);
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_holdings');
    localStorage.removeItem('user_transactions');
    setUser({ id: null, name: 'Guest User', email: '', balance: 0, totalDeposited: 0, totalWithdrawn: 0, goalAmount: 250000 });
    setHoldings([]);
    setTransactions([]);
    setBalanceHistory([0]);
  };

  return (
    <UserContext.Provider value={{ 
      user, holdings, transactions, balanceHistory, watchlist, isAuthenticated,
      updateRiskProfile, buyStock, sellStock, toggleWatchlist,
      depositFunds, withdrawFunds, resetBanking, login, logout, setUser 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
```

### 14. `client/src/context/MarketContext.jsx`
```javascript
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
```

### 15. `client/src/services/api.js`
```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// User Onboarding
export const analyzeUser = async (userData) => {
  try {
    const response = await api.post('/analyze-user', userData);
    return response.data;
  } catch (error) {
    console.error('API Error (analyzeUser):', error);
    throw error;
  }
};

// Auth Services
export const registerUser = async (userData) => {
  const response = await api.post('/register', userData);
  return response.data;
};

export const fetchProfile = async (email) => {
  const response = await api.get(`/profile?email=${email}`);
  return response.data;
};

// Banking & Trading
export const fetchHoldings = async (userId) => {
  const response = await api.get(`/holdings?userId=${userId}`);
  return response.data;
};

export const buyStockApi = async (data) => {
  const response = await api.post('/trade/buy', data);
  return response.data;
};

export const sellStockApi = async (data) => {
  const response = await api.post('/trade/sell', data);
  return response.data;
};

export const updateWalletApi = async (data) => {
  const response = await api.post('/wallet/update', data);
  return response.data;
};

export const fetchHistory = async (userId) => {
  const response = await api.get(`/history?userId=${userId}`);
  return response.data;
};

// Market Data
export const getMarketData = async () => {
  try {
    const response = await api.get('/market');
    return response.data;
  } catch (error) {
    console.error('API Error (getMarketData):', error);
    throw error;
  }
};

// AI Recommendations
export const getAIRecommendations = async () => {
  try {
    const response = await api.get('/ai/recommend');
    return response.data;
  } catch (error) {
    console.warn('⚠️ AI Recommendations API failed, using fallback data:', error.message);
    return {
      source: 'local-fallback',
      recommendations: [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          signal: 'BUY',
          confidence: 88,
          price: 175.50,
          changePercent: 1.2,
          currency: 'USD',
          shortReason: 'Strong iPhone 15 sales and growing services revenue.',
          reasons: ['Expanding ecosystem', 'Strong cash flow', 'Growing AI integration'],
          risk: 'Low'
        },
        {
          symbol: 'NVDA',
          name: 'NVIDIA Corp.',
          signal: 'BUY',
          confidence: 94,
          price: 890.00,
          changePercent: 3.5,
          currency: 'USD',
          shortReason: 'Dominant position in the AI chip market.',
          reasons: ['Unprecedented GPU demand', 'High margins', 'Data center growth'],
          risk: 'Medium'
        },
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          signal: 'HOLD',
          confidence: 65,
          price: 65400.00,
          changePercent: 4.2,
          currency: 'USD',
          shortReason: 'Consolidating near all-time highs before the halving.',
          reasons: ['Institutional adoption', 'Finite supply', 'Macro uncertainty'],
          risk: 'High'
        },
        {
          symbol: 'TSLA',
          name: 'Tesla Inc.',
          signal: 'SELL',
          confidence: 72,
          price: 170.20,
          changePercent: -2.1,
          currency: 'USD',
          shortReason: 'Margin compression and slowing EV demand.',
          reasons: ['Increased competition', 'Pricing pressure', 'Delivery shortfalls'],
          risk: 'High'
        }
      ]
    };
  }
};

// AI Chat
export const sendChatMessage = async (message, sessionId) => {
  try {
    const response = await api.post('/ai/chat', { message, sessionId });
    return response.data;
  } catch (error) {
    console.error('API Error (sendChatMessage):', error);
    throw error;
  }
};

export default api;
```

### 16. `client/src/services/mockAI.js`
```javascript
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
1. **KPI Stat Cards**: Instant view of Total Wealth, Balance, Available Cash, and current Growth trajectory.
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
```

### 17. `client/src/components/AIFloatingChat.jsx`
```javascript
import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage } from '../services/api';
import { mockAIChat } from '../services/mockAI';
import { MessageSquare, X, Send, Bot, User, Minimize2, Maximize2, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ChatLoader } from './ui/chat-loader';

const AIFloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Welcome to the Wealth Terminal. I'm Fund Cr, your real-time portfolio strategist. I've scanned the markets and your current risk profile—how can I help you optimize your positions today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const location = useLocation();

  // Page context mapping
  const pageContexts = {
    '/': 'Input Form (Risk Profiling & Initial Analysis)',
    '/dashboard': 'Main Dashboard (Portfolio Wealth, Balance, and Allocation)',
    '/market': 'Live Market Feed (Trade Desk, Stock Prices, and Analysis)',
    '/history': 'Transaction Intelligence (Ledger, Behavioral Audit, and Trajectory)',
    '/simulator': 'Risk Simulator & Investment Strategy',
    '/ai': 'Full AI Advisor (Smart Signals & Recommendations)',
    '/profile': 'User Profile & Risk Settings',
  };

  const currentPage = pageContexts[location.pathname] || 'Unknown Page';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Include page context in the prompt enhancement
      const contextPrompt = `[User is currently on: ${currentPage}]\n${userMessage}`;
      
      let reply = '';
      try {
        // Attempt Real API connection (Groq)
        const res = await sendChatMessage(contextPrompt, 'floating-session');
        reply = res.reply;
      } catch (apiErr) {
        console.warn("Falling back to local Intelligence engine...");
        // Fallback to local Page Intelligence if server is down/mocking
        const fallbackRes = await mockAIChat(contextPrompt, currentPage);
        reply = fallbackRes.reply;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting to the brain." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "What should I do on this page?",
    "Explain my risk profile",
    "Top stocks to buy now?",
    "How do I trade?"
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-neu-bg rounded-full shadow-neu flex items-center justify-center text-neu-accent hover:shadow-neu-inset hover:-translate-y-1 transition-all duration-300 z-50 group border border-transparent active:scale-95"
      >
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-sm animate-pulse" />
        <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col transition-all duration-300 ease-in-out bg-neu-bg rounded-2xl shadow-neu border border-white/40 ${isMinimized ? 'h-14 w-64' : 'h-[550px] w-[380px]'}`}>
      
      {/* Header */}
      <div className="p-4 rounded-t-2xl flex justify-between items-center shadow-neu-inset bg-neu-bg border-b border-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 shadow-neu flex items-center justify-center">
            <Sparkles size={16} className="text-neu-accent" />
          </div>
          <div>
            <h3 className="text-xs font-black text-neu-primary font-jakarta uppercase tracking-widest">Fund Cr</h3>
            <p className="text-[10px] text-neu-muted font-bold flex items-center gap-1 font-dm-sans">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Live & Thinking
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-slate-200/50 rounded-lg text-neu-muted transition-colors">
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-slate-200/50 rounded-lg text-neu-muted transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scroll-smooth" ref={scrollRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm ${msg.role === 'assistant' ? 'bg-neu-bg shadow-neu-inset text-neu-accent' : 'bg-neu-accent text-white'}`}>
                    {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                  </div>
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed font-dm-sans font-medium ${
                    msg.role === 'user' 
                      ? 'bg-neu-accent text-white rounded-tr-none shadow-md font-bold' 
                      : 'bg-neu-bg text-neu-primary shadow-neu-inset border border-transparent rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center bg-neu-bg shadow-neu-inset px-4 py-2 rounded-2xl rounded-tl-none border border-transparent">
                  <ChatLoader size={30} text="..." />
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-2 overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-2">
            {quickQuestions.map(q => (
              <button 
                key={q} 
                onClick={() => { setInput(q); }}
                className="inline-block px-3 py-1.5 bg-neu-bg shadow-neu hover:shadow-neu-inset hover:-translate-y-0.5 rounded-full text-[10px] font-bold text-neu-muted hover:text-neu-primary transition-all duration-300 border border-transparent"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-4 rounded-b-2xl border-t border-transparent flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 bg-neu-bg shadow-neu-inset border border-transparent rounded-xl px-4 py-2.5 text-xs text-neu-primary placeholder-slate-400 font-bold focus:outline-none focus:ring-1 focus:ring-neu-accent transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 bg-neu-accent hover:bg-blue-500 text-white rounded-xl shadow-md flex items-center justify-center transition-all disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        </>
      )}

      {isMinimized && (
        <div className="flex-1 rounded-b-2xl flex items-center px-4 cursor-pointer" onClick={() => setIsMinimized(false)}>
           <p className="text-[10px] text-neu-muted font-bold uppercase tracking-widest">Click to expand chat</p>
        </div>
      )}
    </div>
  );
};

export default AIFloatingChat;
```

### 18. `client/src/components/Sidebar.jsx`
```javascript
import { Link, useLocation } from 'react-router-dom';
import * as Lucide from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import { useUser } from '../context/UserContext';

const Sidebar = () => {
  const location = useLocation();
  const path = location.pathname;
  const { marketData, loading } = useMarket();
  const { user, logout } = useUser();

  // Helper to render icons safely
  const Icon = ({ name, size = 20, className = "" }) => {
    const LucideIcon = Lucide[name] || Lucide.Activity || Lucide.HelpCircle;
    return LucideIcon ? <LucideIcon size={size} className={className} /> : null;
  };

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { name: 'Input Form', path: '/', icon: 'Activity' },
    { name: 'Simulator', path: '/simulator', icon: 'LineChart' },
    { name: 'History', path: '/history', icon: 'History' },
    { name: 'Market', path: '/market', icon: 'TrendingUp' },
    { name: 'Banking', path: '/banking', icon: 'Wallet' },
    { name: 'AI Smart Signals', path: '/ai', icon: 'Brain' },
    { name: 'Profile', path: '/profile', icon: 'Settings' },
  ];

  const userName = user?.name || 'User';
  const userBalance = user?.balance || 0;

  return (
    <aside className="w-64 bg-neu-bg min-h-screen flex flex-col hidden md:flex shrink-0 shadow-[4px_0_15px_rgba(163,177,198,0.3)] z-10">
      <div className="p-8">
        <h1 className="text-2xl font-jakarta font-extrabold text-neu-primary flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-neu-bg shadow-neu flex items-center justify-center text-neu-accent">
            <Icon name="TrendingUp" size={20} strokeWidth={3} />
          </div>
          Fund Cr
        </h1>
      </div>
      <nav className="flex-1 px-6 space-y-4 mt-4">
        {links.map((link) => {
          const isActive = path === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-4 px-5 py-3 rounded-2xl font-dm-sans transition-all duration-300 ${
                isActive 
                  ? 'bg-neu-bg shadow-neu-inset text-neu-accent' 
                  : 'text-neu-muted hover:shadow-neu hover:text-neu-primary hover:-translate-y-1 transition-all duration-300'
              }`}
            >
              <Icon name={link.icon} size={20} />
              <span className="font-bold">{link.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-6 mt-auto">
        <div className="bg-neu-bg shadow-neu rounded-[24px] p-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neu-bg shadow-neu-inset flex items-center justify-center font-jakarta font-bold text-neu-accent">
              {userName.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-jakarta font-bold text-neu-primary truncate">{userName}</p>
              <p className="text-xs font-dm-sans text-neu-muted font-bold">${Number(userBalance).toLocaleString()}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-500 hover:shadow-neu-inset hover:-translate-y-0.5 transition-all duration-300 font-dm-sans font-bold text-sm bg-neu-bg shadow-neu"
          >
            <Icon name="LogOut" size={16} />
            Sign Out
          </button>
        </div>
      </div>
      
      <div className="px-6 pb-6 mt-4">
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-dm-sans font-bold text-neu-muted uppercase tracking-wider flex items-center gap-2">
            <Icon name="RefreshCw" size={12} className={loading ? 'animate-spin' : ''} />
            Live Tickers
          </h3>
          <div className="flex flex-col gap-3">
            {(marketData || []).slice(0, 2).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-neu-bg shadow-neu-inset px-4 py-3 rounded-xl">
                <span className="text-xs font-jakarta font-bold text-neu-primary">{item?.symbol || 'N/A'}</span>
                <span className={`text-xs font-dm-sans font-bold ${item?.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                  {item?.change || '0.00%'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
```

### 19. `client/src/components/Charts.jsx`
```javascript
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const AllocationChart = ({ suggestions }) => {
  const safeSuggestions = suggestions && suggestions.length > 0 ? suggestions : [];
  
  const data = {
    labels: safeSuggestions.map(s => s.asset_name || s.assetName || 'Unknown'),
    datasets: [
      {
        data: safeSuggestions.length > 0 ? safeSuggestions.map(() => 25) : [100],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // primary blue
          'rgba(16, 185, 129, 0.8)', // emerald
          'rgba(245, 158, 11, 0.8)', // amber
          'rgba(139, 92, 246, 0.8)', // violet
          'rgba(236, 72, 153, 0.8)', // pink
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#4B5563', // neu-muted
          font: {
            family: 'DM Sans',
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return ` ${context.label}: ${context.raw}%`;
          }
        }
      }
    },
  };

  return (
    <div className="glass-card p-6 flex flex-col items-center justify-center h-full">
      <h3 className="text-lg font-jakarta font-bold text-neu-primary mb-6 self-start">Portfolio Allocation</h3>
      <div className="w-full max-w-[250px] aspect-square">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
};

export default AllocationChart;
```

### 20. `client/src/components/LineChart.jsx`
```javascript
import { useRef, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export default function LineChart({ dataPoints, labels, color = '#3b82f6', showFill = true }) {
  const chartRef = useRef(null);

  const [chartData, setChartData] = useState({
    datasets: [],
  });

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !chart.ctx) return;

    const ctx = chart.ctx;
    try {
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, `${color}44`);
      gradient.addColorStop(1, `${color}00`);

      setChartData({
        labels: labels || [],
        datasets: [
          {
            label: 'Portfolio Value',
            data: (dataPoints || []).map(d => Number(d) || 0),
            borderColor: color,
            backgroundColor: gradient,
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: color,
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2,
          },
        ],
      });
    } catch (err) {
      console.error("Chart Gradient Error:", err);
    }
  }, [dataPoints, labels, color]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#0f172a',
        titleColor: '#94a3b8',
        bodyColor: '#fff',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        displayColors: false,
        callbacks: {
          label: (context) => `Value: $${context.parsed.y.toLocaleString()}`,
        }
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 10 } }
      },
      y: {
        grid: { color: '#1e293b', drawBorder: false },
        ticks: {
          color: '#64748b',
          font: { size: 10 },
          callback: (value) => `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`
        }
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return <Line ref={chartRef} data={chartData} options={options} />;
}
```

### 21. `client/src/components/StockDetail.jsx`
```javascript
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

export default function StockDetail({ stock, onClose }) {
  const { symbol, name } = stock;
  const { user, holdings, buyStock, sellStock } = useUser();

  const [data, setData] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [period, setPeriod] = useState('6mo'); 

  const [quantity, setQuantity] = useState(1); 
  const [orderType, setOrderType] = useState('Market'); 
  const [limitPrice, setLimitPrice] = useState(''); 
  const [activeTab, setActiveTab] = useState('BUY'); 
  const [status, setStatus] = useState({ success: false, message: '', type: '' }); 

  const currentHolding = useMemo(() => holdings.find(h => h.symbol === symbol), [holdings, symbol]);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 600)); 
        const points = period === '1w' ? 7 : period === '1mo' ? 30 : period === '3mo' ? 90 : period === '6mo' ? 180 : period === '1y' ? 365 : 1825;
        const currentPrice = stock.price || 150;
        let volatility = stock.sector === 'Crypto' ? 0.05 : 0.02;
        let history = [];
        let price = currentPrice;
        
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

  const handleTransaction = async () => {
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
      result = await buyStock({ symbol, name: data?.name || stock.name }, quantity, tradePrice);
    } else {
      result = await sellStock(symbol, quantity, tradePrice);
    }
    
    setStatus({ 
      success: result.success, 
      message: result.success 
        ? `Successfully ${activeTab === 'BUY' ? 'bought' : 'sold'} ${quantity} shares!` 
        : result.message,
      type: activeTab
    });
    
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
```

### 22. `client/src/components/ui/ai-loader.jsx`
```javascript
import * as React from "react";

/**
 * AILoader Component
 * A premium, animated loader for AI-driven processes.
 * 
 * @param {number} size - Diameter of the loader in pixels.
 * @param {string} text - The loading text to display letter-by-letter.
 */
export const AILoader = ({ size = 180, text = "Generating" }) => {
  const letters = text.split("");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-b from-[#1a3379]/90 via-[#0f172a] to-black backdrop-blur-md">
      <div
        className="relative flex items-center justify-center font-inter select-none"
        style={{ width: size, height: size }}
      >
        {/* Animated Letters */}
        <div className="flex gap-1 items-center justify-center z-10">
          {letters.map((letter, index) => (
            <span
              key={index}
              className="inline-block text-white opacity-40 animate-loaderLetter text-lg font-black tracking-widest uppercase font-jakarta"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* Pulsing Light Field */}
        <div
          className="absolute inset-0 rounded-full animate-loaderCircle opacity-80"
        ></div>
      </div>
    </div>
  );
};
```

### 23. `client/src/components/ui/chat-loader.jsx`
```javascript
import * as React from "react";

export const ChatLoader = ({ size = 40, text = "..." }) => {
  const letters = text.split("");

  return (
    <div
      className="relative flex items-center justify-center font-inter select-none"
      style={{ width: size, height: size }}
    >
      {/* Animated Letters */}
      <div className="flex gap-1 items-center justify-center z-10">
        {letters.map((letter, index) => (
          <span
            key={index}
            className="inline-block text-neu-accent opacity-40 animate-loaderLetter text-sm font-black"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Pulsing Light Field */}
      <div
        className="absolute inset-0 rounded-full animate-loaderCircleChat opacity-80"
      ></div>

      <style>{`
        @keyframes loaderCircleChat {
          0% {
            transform: rotate(90deg);
            box-shadow:
              0 2px 4px 0 #38bdf8 inset,
              0 4px 6px 0 #005dff inset,
              0 12px 12px 0 #1e40af inset,
              0 0 1px 0.5px rgba(56, 189, 248, 0.3),
              0 0 2px 0.5px rgba(0, 93, 255, 0.2);
          }
          50% {
            transform: rotate(270deg);
            box-shadow:
              0 2px 4px 0 #60a5fa inset,
              0 4px 2px 0 #0284c7 inset,
              0 8px 12px 0 #005dff inset,
              0 0 1px 0.5px rgba(56, 189, 248, 0.3),
              0 0 2px 0.5px rgba(0, 93, 255, 0.2);
          }
          100% {
            transform: rotate(450deg);
            box-shadow:
              0 2px 4px 0 #4dc8fd inset,
              0 4px 6px 0 #005dff inset,
              0 12px 12px 0 #1e40af inset,
              0 0 1px 0.5px rgba(56, 189, 248, 0.3),
              0 0 2px 0.5px rgba(0, 93, 255, 0.2);
          }
        }
        .animate-loaderCircleChat {
          animation: loaderCircleChat 5s linear infinite;
        }
      `}</style>
    </div>
  );
};
```

### 24. `client/src/pages/LoaderDemo.jsx`
```javascript
import React from 'react';
import { AILoader } from '../components/ui/ai-loader';

export default function LoaderDemo() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-neu-bg shadow-neu p-8 rounded-[2.5rem]">
          <h1 className="text-2xl font-black text-neu-primary font-jakarta uppercase tracking-tighter mb-4">
            AI Loader Integration
          </h1>
          <p className="text-neu-muted mb-8 font-medium">
            This component is a high-fidelity, Neumorphic-aligned loader designed for generative processes.
            It utilizes staggered CSS animations and rotating box-shadows to create a premium "light-field" effect.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-neu-bg shadow-neu-inset rounded-3xl border border-transparent">
              <h3 className="text-xs font-black text-neu-accent uppercase tracking-widest mb-4">Usage Notes</h3>
              <ul className="text-xs space-y-3 text-neu-muted font-bold">
                <li className="flex items-center gap-2">• Responsive size controls via <code>size</code> prop</li>
                <li className="flex items-center gap-2">• Dynamic text sequencing via <code>text</code> prop</li>
                <li className="flex items-center gap-2">• Full-screen overlay with backdrop blur</li>
              </ul>
            </div>
            
            <div className="flex items-center justify-center">
               <button 
                onClick={() => window.location.reload()}
                className="px-8 py-4 bg-neu-bg shadow-neu hover:shadow-neu-inset rounded-2xl text-xs font-black uppercase tracking-widest text-neu-accent transition-all"
               >
                 Replay Full Loader
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* The Loader in action */}
      <AILoader text="Analyzing Market DNA" size={200} />
    </div>
  );
}
```
