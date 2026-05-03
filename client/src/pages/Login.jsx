import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PieChart, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  Zap,
  Globe,
  Sparkles,
  Activity
} from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useUser();
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    agree: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      login({
        name: isSignup ? formData.name : (formData.email.split('@')[0] || 'User'),
        email: formData.email,
      });
      
      setLoading(false);
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neu-bg p-4 md:p-8 relative overflow-hidden font-sans">
      
      {/* ─── ATMOSPHERIC BACKGROUND ─── */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-transparent rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-transparent rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-neu-bg opacity-40" 
             style={{ backgroundImage: 'radial-gradient(#1e293b 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
      </div>

      <div className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 bg-neu-bg rounded-[40px] shadow-[20px_20px_60px_#c8ccd1,-20px_-20px_60px_#ffffff] border-transparent overflow-hidden">
        
        {/* ─── LEFT SIDE: BRAND & FEATURES ─── */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-neu-bg shadow-neu-inset">
          <div>
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-neu-bg rounded-xl flex items-center justify-center shadow-neu text-neu-accent">
                <PieChart size={24} className="text-neu-primary font-jakarta" />
              </div>
              <span className="text-xl font-black text-neu-primary font-jakarta tracking-tighter uppercase">Fund Cr</span>
            </div>
            
            <h2 className="text-4xl font-black text-neu-primary font-jakarta leading-[1.1] mb-6 tracking-tight">
              Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Financial Destiny</span> with AI.
            </h2>
            <p className="text-neu-muted font-dm-sans text-lg font-medium leading-relaxed mb-12">
              Join the elite circle of data-driven investors. Professional tools, real-time analytics, and AI insights—now at your fingertips.
            </p>

            <div className="space-y-6">
              {[
                { icon: <ShieldCheck size={20} className="text-emerald-400" />, title: 'Institutional Security', desc: 'Bank-grade encryption for your data.' },
                { icon: <Zap size={20} className="text-yellow-400" />, title: 'Real-time Tickers', desc: 'Global market sync every second.' },
                { icon: <Sparkles size={20} className="text-purple-400" />, title: 'AI-Powered Logic', desc: 'Personalized risk and growth modeling.' }
              ].map((feat, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1">{feat.icon}</div>
                  <div>
                    <h4 className="text-sm font-black text-neu-primary font-jakarta uppercase tracking-wider">{feat.title}</h4>
                    <p className="text-xs text-neu-muted font-dm-sans font-medium">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-12 border-t border-transparent">
             <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-neu-bg bg-neu-bg shadow-neu-inset flex items-center justify-center text-[10px] font-bold text-neu-muted font-dm-sans">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
             </div>
             <p className="text-xs font-bold text-neu-muted font-dm-sans uppercase tracking-widest">Joined by 12k+ Investors</p>
          </div>
        </div>

        {/* ─── RIGHT SIDE: AUTH FORM ─── */}
        <div className="p-8 md:p-12">
          <div className="mb-10 text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
               <div className="w-12 h-12 bg-neu-bg rounded-2xl flex items-center justify-center shadow-neu text-neu-accent">
                  <PieChart size={24} className="text-neu-primary font-jakarta" />
               </div>
            </div>
            <h3 className="text-3xl font-black text-neu-primary font-jakarta tracking-tighter mb-2">
              {isSignup ? 'Create Portfolio' : 'Welcome Back'}
            </h3>
            <p className="text-neu-muted font-dm-sans font-medium">
              {isSignup ? 'Start your journey to financial freedom today.' : 'Enter your credentials to access your terminal.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignup && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neu-muted font-dm-sans uppercase tracking-widest ml-1">Full Identity</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-neu-accent transition-colors" size={18} />
                  <input 
                    type="text" 
                    required
                    className="w-full bg-neu-bg shadow-neu-inset rounded-2xl py-4 pl-12 pr-4 text-sm text-neu-primary font-bold focus:outline-none focus:ring-2 focus:ring-neu-accent transition-all placeholder-gray-400"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-neu-muted font-dm-sans uppercase tracking-widest ml-1">Digital Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-neu-accent transition-colors" size={18} />
                <input 
                  type="email" 
                  required
                  className="w-full bg-neu-bg shadow-neu-inset rounded-2xl py-4 pl-12 pr-4 text-sm text-neu-primary font-bold focus:outline-none focus:ring-2 focus:ring-neu-accent transition-all placeholder-gray-400"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-neu-muted font-dm-sans uppercase tracking-widest ml-1">Access Credential</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-neu-accent transition-colors" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  className="w-full bg-neu-bg shadow-neu-inset rounded-2xl py-4 pl-12 pr-12 text-sm text-neu-primary font-bold focus:outline-none focus:ring-2 focus:ring-neu-accent transition-all placeholder-gray-400"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-neu-muted font-dm-sans transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isSignup && (
              <div className="flex justify-end">
                 <button type="button" className="text-xs font-bold text-neu-accent hover:text-neu-accent uppercase tracking-widest">Forgot Access?</button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neu-bg shadow-neu hover:shadow-neu-inset text-neu-primary font-jakarta rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignup ? 'Initialize Account' : 'Establish Session'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-transparent text-center">
            <p className="text-neu-muted font-dm-sans text-xs font-bold uppercase tracking-widest">
              {isSignup ? 'Already a Member?' : 'New Strategic Investor?'}
              <button 
                onClick={() => setIsSignup(!isSignup)}
                className="ml-2 text-neu-primary font-jakarta hover:text-neu-accent transition-colors underline underline-offset-4"
              >
                {isSignup ? 'Sign In' : 'Create Account'}
              </button>
            </p>
          </div>
          
          <div className="mt-8 flex justify-center gap-6 opacity-30 grayscale hover:opacity-60 transition-all">
             <Globe size={16} className="text-neu-primary font-jakarta" />
             <Activity size={16} className="text-neu-primary font-jakarta" />
             <ShieldCheck size={16} className="text-neu-primary font-jakarta" />
          </div>
        </div>

      </div>
    </div>
  );
}
