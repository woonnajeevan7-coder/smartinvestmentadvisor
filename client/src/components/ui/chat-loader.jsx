import * as React from "react";

export const ChatLoader = ({ size = 40, text = "..." }) => {
  const letters = text.split("");

  return (
    <div
      className="relative flex items-center justify-center font-inter select-none"
      style={{ width: size, height: size }}
    >
      {/* Animated Letters */}
      <div className="flex gap-1 items-center justify-center z-10">
        {letters.map((letter, index) => (
          <span
            key={index}
            className="inline-block text-neu-accent opacity-40 animate-loaderLetter text-sm font-black"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Pulsing Light Field */}
      <div
        className="absolute inset-0 rounded-full animate-loaderCircleChat opacity-80"
      ></div>

      <style>{`
        @keyframes loaderCircleChat {
          0% {
            transform: rotate(90deg);
            box-shadow:
              0 2px 4px 0 #38bdf8 inset,
              0 4px 6px 0 #005dff inset,
              0 12px 12px 0 #1e40af inset,
              0 0 1px 0.5px rgba(56, 189, 248, 0.3),
              0 0 2px 0.5px rgba(0, 93, 255, 0.2);
          }
          50% {
            transform: rotate(270deg);
            box-shadow:
              0 2px 4px 0 #60a5fa inset,
              0 4px 2px 0 #0284c7 inset,
              0 8px 12px 0 #005dff inset,
              0 0 1px 0.5px rgba(56, 189, 248, 0.3),
              0 0 2px 0.5px rgba(0, 93, 255, 0.2);
          }
          100% {
            transform: rotate(450deg);
            box-shadow:
              0 2px 4px 0 #4dc8fd inset,
              0 4px 6px 0 #005dff inset,
              0 12px 12px 0 #1e40af inset,
              0 0 1px 0.5px rgba(56, 189, 248, 0.3),
              0 0 2px 0.5px rgba(0, 93, 255, 0.2);
          }
        }
        .animate-loaderCircleChat {
          animation: loaderCircleChat 5s linear infinite;
        }
      `}</style>
    </div>
  );
};
