import React, { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Building2,
  CreditCard,
  Smartphone,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Loader2,
  TrendingUp
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useUser } from '../context/UserContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

export default function Banking() {
  const { user, transactions, depositFunds, withdrawFunds, resetBanking } = useUser();
  
  // Computed Balances from Global State
  const balance = user?.balance || 0;
  const totalDeposited = user?.totalDeposited || 0;
  const totalWithdrawn = user?.totalWithdrawn || 0;

  // State: Form
  const [activeTab, setActiveTab] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Bank Transfer');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  
  const [filter, setFilter] = useState('All');

  // Computed: Chart Data
  const chartData = useMemo(() => {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    let data = [balance];
    let runningBalance = balance;
    
    for (let i = 0; i < Math.min(5, transactions.length); i++) {
      const tx = transactions[i];
      const change = ['Deposit', 'SELL'].includes(tx.type) ? (tx.amount || tx.total || 0) : -(tx.amount || tx.total || 0);
      runningBalance -= change;
      data.unshift(runningBalance);
    }
    
    while (data.length < 6) {
      data.unshift(data[0]);
    }

    return {
      labels,
      datasets: [{
        fill: true,
        label: 'Balance History',
        data,
        borderColor: '#6C63FF',
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2
      }]
    };
  }, [balance, transactions]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#FFFFFF',
        titleColor: '#6B7280',
        bodyColor: '#1F2937',
        borderColor: '#D1D5DB',
        borderWidth: 1,
      }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  // Computed: Filtered Transactions
  const filteredTransactions = useMemo(() => {
    if (filter === 'All') return transactions;
    return transactions.filter(tx => tx.type === filter);
  }, [transactions, filter]);

  // Handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid amount greater than 0.' });
      return;
    }

    if (activeTab === 'withdraw' && numAmount > balance) {
      setFeedback({ type: 'error', message: 'Insufficient funds for this withdrawal.' });
      return;
    }

    setLoading(true);

    // Simulate API Delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (activeTab === 'deposit') {
      depositFunds(numAmount, method);
      setFeedback({ type: 'success', message: `Successfully deposited $${numAmount.toLocaleString()}` });
    } else {
      const res = withdrawFunds(numAmount, method);
      if (res && !res.success) {
        setFeedback({ type: 'error', message: res.message });
        setLoading(false);
        return;
      }
      setFeedback({ type: 'success', message: `Successfully withdrew $${numAmount.toLocaleString()}` });
    }

    setAmount('');
    setLoading(false);

    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 4000);
  };

  const exportCSV = () => {
    const headers = ['Type', 'Amount', 'Method', 'Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(tx =>
        `${tx.type},${tx.amount || tx.total},${tx.method || tx.symbol || 'N/A'},${new Date(tx.date).toLocaleDateString()},${tx.status || 'Completed'}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-neu-bg p-4 md:p-8 text-neu-primary font-dm-sans animate-fadeIn">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-black text-neu-primary font-jakarta tracking-tight">Banking Hub</h1>
            <p className="text-neu-muted font-dm-sans mt-2 text-lg">Manage liquidity and audit your transaction history.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={exportCSV}
              className="bg-neu-bg shadow-neu hover:shadow-neu-inset transition-all p-3 rounded-xl text-neu-primary"
              title="Export Transactions"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              onClick={resetBanking}
              className="bg-neu-bg shadow-neu hover:shadow-neu-inset transition-all px-6 py-3 rounded-xl text-rose-500 font-bold text-xs uppercase tracking-widest"
            >
              System Reset
            </button>
          </div>
        </div>

        {/* Top Cards: Balance & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Balance Summary */}
          <div className="lg:col-span-7 bg-neu-bg rounded-[2.5rem] p-10 shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
            <div className="relative z-10">
              <h2 className="text-neu-muted font-dm-sans font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-4">
                <Wallet className="w-4 h-4 text-neu-accent" />
                Available Capital
              </h2>
              <div className="text-6xl font-black text-neu-primary font-jakarta mt-2 mb-10 tracking-tighter">
                ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 relative z-10">
              <div className="flex-1 bg-neu-bg rounded-[1.5rem] p-5 shadow-neu-inset">
                <div className="text-neu-muted font-dm-sans text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> Deposits
                </div>
                <div className="text-emerald-500 font-black text-xl font-jakarta">
                  +${totalDeposited.toLocaleString()}
                </div>
              </div>
              <div className="flex-1 bg-neu-bg rounded-[1.5rem] p-5 shadow-neu-inset">
                <div className="text-neu-muted font-dm-sans text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-rose-500" /> Withdrawals
                </div>
                <div className="text-rose-500 font-black text-xl font-jakarta">
                  -${totalWithdrawn.toLocaleString()}
                </div>
              </div>
            </div>
            <Wallet size={180} className="absolute -bottom-10 -right-10 text-neu-accent/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
          </div>

          {/* Mini Chart */}
          <div className="lg:col-span-5 bg-neu-bg rounded-[2.5rem] p-10 shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 flex flex-col">
            <h2 className="text-neu-muted font-dm-sans font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-8">
              <TrendingUp className="w-4 h-4 text-neu-accent" />
              Equity Curve
            </h2>
            <div className="flex-1 min-h-[180px] relative">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Action Form */}
          <div className="bg-neu-bg rounded-[2.5rem] p-8 shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 h-fit lg:col-span-1">
            {/* Tabs */}
            <div className="flex bg-neu-bg shadow-neu-inset rounded-2xl p-2 mb-8">
              <button
                onClick={() => { setActiveTab('deposit'); setFeedback({ type: '', message: '' }); setAmount(''); }}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'deposit'
                  ? 'bg-neu-bg shadow-neu text-emerald-500'
                  : 'text-neu-muted font-dm-sans hover:text-neu-primary'
                  }`}
              >
                Deposit
              </button>
              <button
                onClick={() => { setActiveTab('withdraw'); setFeedback({ type: '', message: '' }); setAmount(''); }}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'withdraw'
                  ? 'bg-neu-bg shadow-neu text-rose-500'
                  : 'text-neu-muted font-dm-sans hover:text-neu-primary'
                  }`}
              >
                Withdraw
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-neu-muted font-dm-sans mb-2">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neu-muted font-dm-sans font-medium">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-neu-bg shadow-neu-inset rounded-xl py-3 pl-8 pr-4 text-neu-primary font-bold focus:outline-none focus:ring-2 focus:ring-neu-accent transition-all placeholder-gray-400"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-3">
                  {[1000, 5000, 10000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val.toString())}
                      className="flex-1 bg-neu-bg shadow-neu hover:shadow-neu-inset text-neu-primary rounded-lg py-2 font-bold text-xs transition-colors"
                    >
                      +${val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Method Selection */}
              <div>
                <label className="block text-sm font-medium text-neu-muted font-dm-sans mb-2">
                  {activeTab === 'deposit' ? 'Payment Method' : 'Withdrawal Method'}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'Bank Transfer', label: 'Bank', icon: Building2 },
                    { id: 'Card', label: 'Card', icon: CreditCard },
                    { id: 'UPI', label: 'UPI', icon: Smartphone }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border border-transparent transition-all duration-200 ${method === m.id
                        ? 'bg-neu-bg shadow-neu-inset text-neu-accent font-bold'
                        : 'bg-neu-bg shadow-neu text-neu-muted font-dm-sans hover:text-neu-primary hover:shadow-neu-inset'
                        }`}
                    >
                      <m.icon className="w-5 h-5 mb-1.5" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Message */}
              {feedback.message && (
                <div className={`p-3 rounded-xl flex items-start gap-2.5 text-sm animate-in fade-in slide-in-from-top-2 ${feedback.type === 'error' ? 'bg-red-100 text-red-600 border border-red-200 shadow-md' : 'bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-md'
                  }`}>
                  {feedback.type === 'error' ? <XCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                  <p className="mt-0.5 font-medium leading-tight">{feedback.message}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-bold text-neu-primary font-jakarta transition-all shadow-neu flex justify-center items-center gap-2 ${activeTab === 'deposit'
                  ? 'text-emerald-500 hover:shadow-neu-inset'
                  : 'text-rose-500 hover:shadow-neu-inset'
                  } focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    {activeTab === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Transaction History */}
          <div className="bg-neu-bg rounded-[2.5rem] shadow-neu hover:-translate-y-1 hover:shadow-neu-hover transition-all duration-300 flex flex-col h-[650px] lg:col-span-2 overflow-hidden">
            <div className="p-8 border-b border-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <h3 className="text-xl font-black text-neu-primary font-jakarta flex items-center gap-3">
                <Clock className="w-5 h-5 text-neu-muted font-dm-sans" /> Transaction Ledger
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex bg-neu-bg shadow-neu-inset rounded-xl p-1.5">
                  {['All', 'Deposit', 'Withdraw', 'BUY', 'SELL'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-neu-bg shadow-neu text-neu-accent' : 'text-neu-muted font-dm-sans hover:text-neu-primary'
                        }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-neu-bg z-10 shadow-[0_4px_10px_rgba(163,177,198,0.2)]">
                  <tr className="border-b border-transparent text-neu-muted font-dm-sans text-xs uppercase tracking-wider font-semibold">
                    <th className="px-6 py-4">Transaction</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 hidden sm:table-cell">Method</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300 text-sm">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-neu-muted font-dm-sans">No transactions found.</td>
                    </tr>
                  ) : (
                    filteredTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-gray-200/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${['Deposit', 'SELL'].includes(tx.type) ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                              }`}>
                              {['Deposit', 'SELL'].includes(tx.type) ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-semibold text-neu-primary">{tx.type}</p>
                              <p className="text-xs text-neu-muted font-dm-sans mt-0.5">{tx.status || 'Completed'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-neu-muted font-dm-sans font-medium">
                          {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-neu-muted font-dm-sans hidden sm:table-cell">
                          <span className="bg-neu-bg shadow-neu-inset px-2.5 py-1 rounded-md text-xs border border-transparent font-medium">
                            {tx.method || tx.symbol || 'System'}
                          </span>
                        </td>
                        <td className={`px-6 py-4 font-bold text-right text-base tracking-tight ${['Deposit', 'SELL'].includes(tx.type) ? 'text-emerald-500' : 'text-rose-500'
                          }`}>
                          {['Deposit', 'SELL'].includes(tx.type) ? '+' : '-'}${(tx.amount || tx.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Optional: Add custom scrollbar styles via a style tag for this component to keep it single-file */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #E0E5EC; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #A0AEC0; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6B7280; 
        }
      `}} />
    </div>
  );
}
