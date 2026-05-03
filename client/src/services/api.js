import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// User Analysis & Onboarding
export const analyzeUser = async (userData) => {
  try {
    const response = await api.post('/analyze-user', userData);
    return response.data;
  } catch (error) {
    console.error('API Error (analyzeUser):', error);
    throw error;
  }
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
    console.error('API Error (getAIRecommendations):', error);
    throw error;
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
