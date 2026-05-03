# Smart Investment Advisor: AI-Powered Financial Intelligence

Welcome to **Smart Investment Advisor**, a sophisticated, full-stack financial platform designed to bridge the gap between complex market data and actionable investment strategies. This project leverages cutting-edge Artificial Intelligence to provide users with a premium, data-driven experience for managing and growing their wealth.

## 🌟 Project Vision

In today's fast-paced financial world, retail investors are often overwhelmed by the sheer volume of data. **Smart Investment Advisor** was created to simplify this process. By combining real-time market analysis with advanced LLMs (Large Language Models), the platform acts as a 24/7 personal financial consultant, helping users simulate trades, track assets, and receive personalized advice tailored to their specific financial goals and risk tolerance.

## 🚀 Key Features

### 1. Interactive Financial Dashboard
The heart of the application is a beautifully crafted dashboard that provides a bird's-eye view of your financial health. Using **Chart.js**, we provide dynamic visualizations of your portfolio performance, recent transactions, and market trends. The UI is built with a "Glassmorphism" aesthetic, ensuring a premium feel that rivals top-tier fintech applications.

### 2. AI Financial Advisor & Personality
Unlike generic bots, our AI Advisor is powered by the **Groq SDK** and **Google Gemini 1.5 Pro**. It doesn't just calculate numbers; it interprets them. Whether you're asking about the latest tech stocks or seeking a long-term retirement strategy, the AI provides nuanced, context-aware recommendations. It features a persistent persona, currently branded as "Fund Cr," ensuring a consistent and engaging user experience.

### 3. Real-Time Investment Simulator
The Simulator allows users to practice trading without real-world risk. Integrated with the **Yahoo Finance API**, it uses live market prices to simulate buying and selling. This feature is perfect for beginners looking to learn the ropes or experienced traders testing new hypotheses.

### 4. Advanced Market Analytics
The "Market" page offers a deep dive into various asset classes. We pull real-time data to show top gainers, losers, and trending stocks. Each asset includes detailed historical charts and technical indicators, allowing users to perform their own due diligence alongside AI insights.

### 5. Intelligent Banking & Wallet Management
Manage your virtual capital with ease. The banking module tracks every transaction, from simulated stock purchases to balance adjustments. It provides a clean ledger of your financial history, ensuring transparency in your simulated investment journey.

### 6. Persistent AI Chat Assistant
A floating chat interface is available on every page, allowing for immediate interaction. If you see a spike in a chart on the Market page, you can instantly ask the AI, "Why is this stock rising?" and get a data-backed response without leaving the page.

## 🛠️ Technical Architecture

The platform is built on a robust **MERN-like stack** optimized for performance and scalability:

- **Frontend**: Developed with **React 19** and **Vite** for lightning-fast HMR (Hot Module Replacement). Styling is handled via **Tailwind CSS**, utilizing custom color palettes and glassmorphism effects for a modern, high-end look.
- **Backend**: A scalable **Node.js/Express** server handles API requests, authentication logic, and orchestration between the database and external AI services.
- **Database**: A **MySQL** relational database stores user profiles, transaction history, and portfolio snapshots, ensuring data integrity and fast query performance.
- **AI Layer**: Dual-integration with **Groq** (for low-latency chat responses) and **Google Generative AI** (for deep financial forecasting and complex analysis).

## 📂 Project Structure

```text
smart-investment-advisor/
├── client/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI Components
│   │   │   ├── ui/             # Atomic UI elements (Buttons, Inputs, etc.)
│   │   │   ├── AIFloatingChat.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Charts.jsx
│   │   │   └── ...
│   │   ├── pages/              # Main Application Screens
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Market.jsx
│   │   │   ├── Simulator.jsx
│   │   │   └── ...
│   │   ├── context/            # State Management (User, Market)
│   │   ├── services/           # API & Mock Data Services
│   │   ├── App.jsx             # Main App Component
│   │   └── main.jsx            # Entry point
│   ├── public/                 # Static assets
│   ├── tailwind.config.js      # Styling configuration
│   └── vite.config.js          # Build configuration
├── server/                     # Node.js Backend (Express)
│   ├── config/                 # DB & API Configurations
│   │   ├── db.js
│   │   └── dbConfig.js
│   ├── controllers/            # Request Handlers & AI Logic
│   │   ├── aiController.js
│   │   ├── marketController.js
│   │   └── advisorController.js
│   ├── routes/                 # API Endpoint Definitions
│   │   └── advisorRoutes.js
│   ├── app.js                  # Express App Setup
│   └── package.json            # Server Dependencies
└── database/                   # Database Scripts
    └── schema.sql              # MySQL Schema Definition
```


## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MySQL Server (v8.0+)
- API keys for Google Gemini and Groq

### 1. Database Initialization
Create a database named `investment_db` and run the provided schema:
```bash
mysql -u your_user -p investment_db < database/schema.sql
```

### 2. Server Setup
```bash
cd server
npm install
# Create a .env file with your DB credentials and API keys
npm start
```

### 3. Client Setup
```bash
cd client
npm install
npm run dev
```

## 📈 Future Roadmap
- **Social Trading**: Follow and copy the strategies of top-performing simulators.
- **Crypto Integration**: Expand market data to include major cryptocurrencies.
- **Mobile Application**: Port the UI to React Native for on-the-go financial tracking.
- **Predictive Modeling**: Enhance the "Six Month Forecast" with more complex algorithmic modeling.

## 📄 License
This project is licensed under the **ISC License**.

---
*Created by [Woonna Jeevan](https://github.com/woonnajeevan7-coder)*
