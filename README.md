# Smart Investment Advisor

A comprehensive AI-powered financial dashboard and investment simulator. This application helps users track market trends, simulate investments, and get AI-driven financial advice.

## 🚀 Features

- **Interactive Dashboard**: Overview of your financial status and market highlights.
- **AI Financial Advisor**: Personalized investment recommendations and insights powered by Groq and Google Gemini.
- **Investment Simulator**: Test your investment strategies in a safe environment.
- **Real-time Market Data**: Track stock performance and market trends using Yahoo Finance integration.
- **Banking & Wallet**: Manage your virtual balance and transaction history.
- **AI Chatbot**: A persistent AI assistant available across all pages for quick queries.
- **Responsive Design**: Modern, premium UI built with Tailwind CSS.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Charts**: Chart.js & React-Chartjs-2
- **Icons**: Lucide React
- **Routing**: React Router DOM

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: MySQL
- **AI Integration**: Groq SDK, Google Generative AI
- **Market Data**: Yahoo Finance API

## 📂 Project Structure

```text
smart-investment-advisor/
├── client/              # React frontend
├── server/              # Node.js backend
└── database/            # SQL schema and database scripts
```

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- MySQL
- API Keys (Groq / Google Gemini)

### 1. Database Setup
Import the schema into your MySQL instance:
```bash
mysql -u your_user -p < database/schema.sql
```

### 2. Backend Configuration
Navigate to the `server` directory and install dependencies:
```bash
cd server
npm install
```
Create a `.env` file in the `server` folder:
```env
PORT=5000
DB_HOST=localhost
DB_USER=your_username
DB_PASS=your_password
DB_NAME=investment_db
GROQ_API_KEY=your_key
GEMINI_API_KEY=your_key
```

### 3. Frontend Configuration
Navigate to the `client` directory and install dependencies:
```bash
cd client
npm install
```

## 🏃 Running the Application

### Start the Backend
```bash
cd server
npm run dev
```

### Start the Frontend
```bash
cd client
npm run dev
```

The application will be available at `http://localhost:5173`.

## 📄 License
ISC
