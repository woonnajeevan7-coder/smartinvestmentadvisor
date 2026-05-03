import { createContext, useState, useEffect, useContext } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const safeParse = (key, fallback) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      console.error(`Error parsing localStorage key "${key}":`, e);
      return fallback;
    }
  };

  // Global User State
  const [user, setUser] = useState(() => safeParse('user_data', {
    name: 'Guest User',
    riskScore: 0,
    category: 'Not Calculated',
    balance: 125000,
    totalDeposited: 150000,
    totalWithdrawn: 25000,
    goalAmount: 250000
  }));

  const [isAuthenticated, setIsAuthenticated] = useState(() => 
    localStorage.getItem('auth_token') === 'active'
  );

  const [balanceHistory, setBalanceHistory] = useState(() => 
    safeParse('user_balance_history', [100000])
  );

  const [holdings, setHoldings] = useState(() => 
    safeParse('user_holdings', [])
  );

  const [transactions, setTransactions] = useState(() => 
    safeParse('user_transactions', [
      { id: '1', type: 'Deposit', amount: 50000, method: 'Bank Transfer', date: '2026-04-28T10:00:00Z', status: 'Completed' },
      { id: '2', type: 'Withdraw', amount: 25000, method: 'Bank Transfer', date: '2026-04-25T14:30:00Z', status: 'Completed' },
      { id: '3', type: 'Deposit', amount: 100000, method: 'UPI', date: '2026-04-20T09:15:00Z', status: 'Completed' },
    ])
  );

  const [watchlist, setWatchlist] = useState(() => 
    safeParse('user_watchlist', [])
  );

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('user_data', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('user_holdings', JSON.stringify(holdings));
  }, [holdings]);

  useEffect(() => {
    localStorage.setItem('user_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('user_balance_history', JSON.stringify(balanceHistory));
  }, [balanceHistory]);

  useEffect(() => {
    localStorage.setItem('user_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const recordBalance = (newBalance) => {
    setBalanceHistory(prev => {
      const history = [...prev, newBalance];
      if (history.length > 20) history.shift(); // Keep last 20 points
      return history;
    });
  };

  // Actions
  const updateRiskProfile = (score, category) => {
    setUser(prev => ({ ...prev, riskScore: score, category }));
  };

  const buyStock = (stock, quantity, price) => {
    const numPrice = parseFloat(price);
    const numQty = parseInt(quantity);
    if (isNaN(numPrice) || isNaN(numQty)) return { success: false, message: 'Invalid price or quantity' };

    const totalCost = numQty * numPrice;
    const currentBalance = parseFloat(user.balance);

    if (currentBalance < totalCost) {
      return { success: false, message: `Insufficient balance. Need $${totalCost.toLocaleString()}, have $${currentBalance.toLocaleString()}` };
    }

    // Update Balance
    const newBal = Number((currentBalance - totalCost).toFixed(2));
    setUser(prev => ({ ...prev, balance: newBal }));
    recordBalance(newBal);

    // Update Holdings
    setHoldings(prev => {
      const existing = prev.find(h => h.symbol === stock.symbol);
      if (existing) {
        const newQty = existing.quantity + numQty;
        const newAvgPrice = (existing.avgPrice * existing.quantity + totalCost) / newQty;
        return prev.map(h => h.symbol === stock.symbol 
          ? { ...h, quantity: newQty, avgPrice: newAvgPrice }
          : h
        );
      }
      return [...prev, { symbol: stock.symbol, name: stock.name, quantity: numQty, avgPrice: numPrice }];
    });

    // Add Transaction
    const newTx = {
      id: Date.now(),
      type: 'BUY',
      symbol: stock.symbol,
      name: stock.name,
      quantity: numQty,
      price: numPrice,
      total: totalCost,
      date: new Date().toISOString()
    };
    setTransactions(prev => [newTx, ...prev]);

    return { success: true };
  };

  const sellStock = (symbol, quantity, price) => {
    const numPrice = parseFloat(price);
    const numQty = parseInt(quantity);
    if (isNaN(numPrice) || isNaN(numQty)) return { success: false, message: 'Invalid price or quantity' };

    const holding = holdings.find(h => h.symbol === symbol);
    if (!holding || holding.quantity < numQty) {
      return { success: false, message: 'Not enough shares' };
    }

    const totalGain = numQty * numPrice;
    const currentBalance = parseFloat(user.balance);

    // Update Balance
    const newBal = Number((currentBalance + totalGain).toFixed(2));
    setUser(prev => ({ ...prev, balance: newBal }));
    recordBalance(newBal);

    // Update Holdings
    setHoldings(prev => {
      return prev.map(h => h.symbol === symbol 
        ? { ...h, quantity: h.quantity - numQty }
        : h
      ).filter(h => h.quantity > 0);
    });

    // Add Transaction
    const newTx = {
      id: Date.now(),
      type: 'SELL',
      symbol: symbol,
      quantity: numQty,
      price: numPrice,
      total: totalGain,
      date: new Date().toISOString()
    };
    setTransactions(prev => [newTx, ...prev]);

    return { success: true };
  };

  const toggleWatchlist = (symbol) => {
    setWatchlist(prev => {
      if (prev.includes(symbol)) {
        return prev.filter(s => s !== symbol);
      }
      return [...prev, symbol];
    });
  };

  const depositFunds = (amount, method) => {
    const numAmount = parseFloat(amount);
    const currentBalance = parseFloat(user.balance || 0);
    const newBal = Number((currentBalance + numAmount).toFixed(2));
    
    setUser(prev => ({ 
      ...prev, 
      balance: newBal,
      totalDeposited: (prev.totalDeposited || 0) + numAmount
    }));
    recordBalance(newBal);

    const newTx = {
      id: Date.now().toString(),
      type: 'Deposit',
      amount: numAmount,
      method: method,
      date: new Date().toISOString(),
      status: Math.random() > 0.1 ? 'Completed' : 'Pending'
    };
    setTransactions(prev => [newTx, ...prev]);
    return { success: true };
  };

  const withdrawFunds = (amount, method) => {
    const numAmount = parseFloat(amount);
    const currentBalance = parseFloat(user.balance || 0);
    
    if (currentBalance < numAmount) {
      return { success: false, message: 'Insufficient funds' };
    }

    const newBal = Number((currentBalance - numAmount).toFixed(2));
    
    setUser(prev => ({ 
      ...prev, 
      balance: newBal,
      totalWithdrawn: (prev.totalWithdrawn || 0) + numAmount
    }));
    recordBalance(newBal);

    const newTx = {
      id: Date.now().toString(),
      type: 'Withdraw',
      amount: numAmount,
      method: method,
      date: new Date().toISOString(),
      status: 'Completed'
    };
    setTransactions(prev => [newTx, ...prev]);
    return { success: true };
  };

  const resetBanking = () => {
    setUser(prev => ({ ...prev, balance: 0, totalDeposited: 0, totalWithdrawn: 0 }));
    setTransactions([]);
    setBalanceHistory([0]);
  };

  const login = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
    setIsAuthenticated(true);
    localStorage.setItem('auth_token', 'active');
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('auth_token');
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      holdings, 
      transactions, 
      balanceHistory,
      watchlist,
      isAuthenticated,
      updateRiskProfile, 
      buyStock, 
      sellStock,
      toggleWatchlist,
      depositFunds,
      withdrawFunds,
      resetBanking,
      login,
      logout,
      setUser 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
