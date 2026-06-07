import { createContext, useState, useEffect, useContext } from 'react';
import { 
  registerUser, 
  loginUser,
  fetchProfile, 
  fetchHoldings, 
  buyStockApi, 
  sellStockApi, 
  updateWalletApi, 
  fetchHistory 
} from '../services/api';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState({
    id: null,
    name: 'Guest User',
    email: '',
    riskScore: 0,
    category: 'Not Calculated',
    balance: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    goalAmount: 250000
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [balanceHistory, setBalanceHistory] = useState([0]);
  const [watchlist, setWatchlist] = useState([]);

  // Restore secure session from JWT on startup
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('auth_token');
      if (token && token !== 'active') {
        try {
          const profileData = await fetchProfile();
          const { user: dbUser, profile } = profileData;
          
          setUser({
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            balance: parseFloat(dbUser.balance) || 0,
            totalDeposited: parseFloat(dbUser.totalDeposited) || 0,
            totalWithdrawn: parseFloat(dbUser.totalWithdrawn) || 0,
            riskScore: profile?.risk_preference || 0,
            category: profile?.investment_duration ? `${profile.investment_duration} Term` : 'Not Calculated',
            goalAmount: 250000
          });

          // Sync holdings and history
          const dbHoldings = await fetchHoldings();
          setHoldings(dbHoldings || []);

          const dbHistory = await fetchHistory();
          setTransactions(dbHistory || []);

          setIsAuthenticated(true);
        } catch (err) {
          console.error("⚠️ Failed to restore secure session:", err.message);
          logout();
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  // Listen for global auth-logout events (e.g. from 401 response interceptor)
  useEffect(() => {
    const handleAuthLogout = () => {
      console.warn("Session invalidated. Performing automated secure logout...");
      logout();
    };
    window.addEventListener('auth-logout', handleAuthLogout);
    return () => window.removeEventListener('auth-logout', handleAuthLogout);
  }, []);

  const syncUserData = async () => {
    try {
      const profileData = await fetchProfile();
      const { user: dbUser, profile } = profileData;
      setUser(prev => ({
        ...prev,
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        balance: parseFloat(dbUser.balance) || 0,
        totalDeposited: parseFloat(dbUser.totalDeposited) || 0,
        totalWithdrawn: parseFloat(dbUser.totalWithdrawn) || 0,
        riskScore: profile?.risk_preference || prev.riskScore,
        category: profile?.investment_duration ? `${profile.investment_duration} Term` : prev.category
      }));

      const dbHoldings = await fetchHoldings();
      setHoldings(dbHoldings || []);

      const dbHistory = await fetchHistory();
      setTransactions(dbHistory || []);
    } catch (err) {
      console.error("❌ Failed to sync user data from backend:", err.message);
    }
  };

  const updateRiskProfile = (score, category) => {
    setUser(prev => ({ ...prev, riskScore: score, category }));
  };

  const buyStock = async (stock, quantity, price) => {
    const numPrice = parseFloat(price);
    const numQty = parseInt(quantity);
    const totalCost = numQty * numPrice;
    const currentBalance = parseFloat(user.balance) || 0;

    if (currentBalance < totalCost) {
      return { success: false, message: `Insufficient balance. Need $${totalCost.toLocaleString()}, have $${currentBalance.toLocaleString()}` };
    }

    try {
      await buyStockApi({ symbol: stock.symbol, name: stock.name, quantity: numQty, price: numPrice });
      await syncUserData();
      return { success: true };
    } catch (err) {
      console.error("❌ Buy execution failed:", err.message);
      return { success: false, message: err.response?.data?.error || "Transaction failed" };
    }
  };

  const sellStock = async (symbol, quantity, price) => {
    const numPrice = parseFloat(price);
    const numQty = parseInt(quantity);
    const totalGain = numQty * numPrice;
    const holding = holdings.find(h => h.symbol === symbol);

    if (!holding || holding.quantity < numQty) {
      return { success: false, message: 'Insufficient shares to sell' };
    }

    try {
      await sellStockApi({ symbol, quantity: numQty, price: numPrice });
      await syncUserData();
      return { success: true };
    } catch (err) {
      console.error("❌ Sell execution failed:", err.message);
      return { success: false, message: err.response?.data?.error || "Transaction failed" };
    }
  };

  const depositFunds = async (amount, method) => {
    const numAmount = parseFloat(amount);
    try {
      await updateWalletApi({ type: 'Deposit', amount: numAmount, method });
      await syncUserData();
      return { success: true };
    } catch (err) {
      console.error("❌ Deposit failed:", err.message);
      return { success: false, message: err.response?.data?.error || "Transaction failed" };
    }
  };

  const withdrawFunds = async (amount, method) => {
    const numAmount = parseFloat(amount);
    const currentBalance = parseFloat(user.balance) || 0;
    if (currentBalance < numAmount) return { success: false, message: 'Insufficient funds' };

    try {
      await updateWalletApi({ type: 'Withdraw', amount: numAmount, method });
      await syncUserData();
      return { success: true };
    } catch (err) {
      console.error("❌ Withdrawal failed:", err.message);
      return { success: false, message: err.response?.data?.error || "Transaction failed" };
    }
  };

  const login = async (userData) => {
    setLoading(true);
    try {
      let res;
      if (userData.isSignup) {
        // Registration flow
        await registerUser({
          name: userData.name,
          email: userData.email,
          password: userData.password
        });
        
        // Log in after registration
        res = await loginUser({
          email: userData.email,
          password: userData.password
        });
      } else {
        // Login flow
        res = await loginUser({
          email: userData.email,
          password: userData.password
        });
      }

      if (res?.token) {
        localStorage.setItem('auth_token', res.token);
        setIsAuthenticated(true);
        
        // Fetch user data immediately
        const profileData = await fetchProfile();
        const { user: dbUser, profile } = profileData;

        setUser({
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          balance: parseFloat(dbUser.balance) || 0,
          totalDeposited: parseFloat(dbUser.totalDeposited) || 0,
          totalWithdrawn: parseFloat(dbUser.totalWithdrawn) || 0,
          riskScore: profile?.risk_preference || 0,
          category: profile?.investment_duration ? `${profile.investment_duration} Term` : 'Not Calculated',
          goalAmount: 250000
        });

        const dbHoldings = await fetchHoldings();
        setHoldings(dbHoldings || []);

        const dbHistory = await fetchHistory();
        setTransactions(dbHistory || []);
      }
    } catch (err) {
      console.error("❌ Authentication error:", err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleWatchlist = (symbol) => {
    setWatchlist(prev => prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUser({
      id: null,
      name: 'Guest User',
      email: '',
      riskScore: 0,
      category: 'Not Calculated',
      balance: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      goalAmount: 250000
    });
    setHoldings([]);
    setTransactions([]);
    setBalanceHistory([0]);
  };

  return (
    <UserContext.Provider value={{ 
      user, holdings, transactions, balanceHistory, watchlist, isAuthenticated, loading,
      updateRiskProfile, buyStock, sellStock, toggleWatchlist,
      depositFunds, withdrawFunds, login, logout, setUser, syncUserData 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
