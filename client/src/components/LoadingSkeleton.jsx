import React from 'react';

export default function LoadingSkeleton({ type = 'card', count = 1 }) {
  const renderItems = () => {
    const items = [];
    for (let i = 0; i < count; i++) {
      if (type === 'list') {
        items.push(
          <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-100 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded-md w-[40%]" />
              <div className="h-3 bg-gray-150 rounded-md w-[20%]" />
            </div>
            <div className="w-16 h-6 bg-gray-200 rounded-md" />
          </div>
        );
      } else if (type === 'chart') {
        items.push(
          <div key={i} className="w-full h-[300px] bg-neu-bg shadow-neu-inset rounded-[24px] p-6 flex items-end gap-3 animate-pulse border border-white/30">
            {[40, 60, 45, 80, 55, 90, 70, 85, 65, 95].map((h, idx) => (
              <div key={idx} className="flex-1 bg-gray-200 rounded-t-lg" style={{ height: `${h}%` }} />
            ))}
          </div>
        );
      } else {
        // default card skeleton
        items.push(
          <div key={i} className="bg-neu-bg rounded-[24px] p-6 shadow-neu border border-white/50 animate-pulse space-y-4">
            <div className="flex justify-between items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-xl" />
              <div className="w-20 h-4 bg-gray-200 rounded-md" />
            </div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-250 rounded-md w-[60%]" />
              <div className="h-4 bg-gray-200 rounded-md w-[80%]" />
            </div>
          </div>
        );
      }
    }
    return items;
  };

  return <div className="space-y-4 w-full">{renderItems()}</div>;
}
