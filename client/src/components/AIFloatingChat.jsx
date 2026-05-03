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
