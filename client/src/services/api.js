import axios from 'axios';

// Resolve backend URL from environment variables, fallback to local dev port 5001
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Axios Request Interceptor:
 * Automatically injects the JWT Authorization header on all requests if token exists.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    // Ensure we do not send the placeholder 'active' string to the backend
    if (token && token !== 'active') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Axios Response Interceptor:
 * Intercepts auth errors (401) globally to dispatch a logout event.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('🔒 Session invalid or token expired. Dispatching auth-logout event...');
      window.dispatchEvent(new Event('auth-logout'));
    }
    return Promise.reject(error);
  }
);

/**
 * Onboarding Profiling Survey
 */
export const analyzeUser = async (userData) => {
  try {
    const response = await api.post('/analyze-user', {
      age: userData.age,
      income: userData.income,
      savings: userData.savings,
      duration: userData.duration,
      risk: userData.risk
    });
    return response.data;
  } catch (error) {
    console.error('API Error (analyzeUser):', error);
    throw error;
  }
};

/**
 * Auth Services
 */
export const registerUser = async (userData) => {
  const response = await api.post('/register', {
    name: userData.name,
    email: userData.email,
    password: userData.password
  });
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/login', {
    email: credentials.email,
    password: credentials.password
  });
  return response.data;
};

export const fetchProfile = async () => {
  // Identity resolved directly from JWT claims on the server
  const response = await api.get('/profile');
  return response.data;
};

/**
 * Banking & Trading Simulator Operations (All user ids omitted to prevent IDOR)
 */
export const fetchHoldings = async () => {
  const response = await api.get('/holdings');
  return response.data;
};

export const buyStockApi = async (data) => {
  const response = await api.post('/trade/buy', {
    symbol: data.symbol,
    name: data.name,
    quantity: data.quantity,
    price: data.price
  });
  return response.data;
};

export const sellStockApi = async (data) => {
  const response = await api.post('/trade/sell', {
    symbol: data.symbol,
    quantity: data.quantity,
    price: data.price
  });
  return response.data;
};

export const updateWalletApi = async (data) => {
  const response = await api.post('/wallet/update', {
    type: data.type,
    amount: data.amount,
    method: data.method
  });
  return response.data;
};

export const fetchHistory = async () => {
  const response = await api.get('/history');
  return response.data;
};

/**
 * Market Data Retrievals
 */
export const getMarketData = async () => {
  try {
    const response = await api.get('/market');
    return response.data;
  } catch (error) {
    console.error('API Error (getMarketData):', error);
    throw error;
  }
};

/**
 * AI Recommendation Services
 */
export const getAIRecommendations = async () => {
  const response = await api.get('/ai/recommend');
  return response.data;
};

/**
 * Conversational AI Terminal Chats
 */
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
