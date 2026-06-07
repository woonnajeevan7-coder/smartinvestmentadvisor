import React from 'react';

export default function EmptyState({ 
  title = "No Data Found", 
  message = "There are no records available to display in this section.",
  actionText,
  onAction
}) {
  return (
    <div className="w-full flex flex-col items-center justify-center p-8 md:p-12 bg-neu-bg rounded-[24px] shadow-neu-inset border border-white/20 text-center animate-fade-in">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 text-neu-muted shadow-neu">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-neu-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-black text-neu-primary font-jakarta uppercase tracking-wider mb-2">
        {title}
      </h3>
      
      <p className="text-neu-muted font-medium text-xs max-w-[320px] leading-relaxed mb-6 font-dm-sans">
        {message}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-neu-bg shadow-neu hover:shadow-neu-inset text-neu-primary font-jakarta text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98]"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
