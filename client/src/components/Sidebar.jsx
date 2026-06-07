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
