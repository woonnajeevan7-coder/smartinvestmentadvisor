import * as React from "react";

/**
 * AILoader Component
 * A premium, animated loader for AI-driven processes.
 * 
 * @param {number} size - Diameter of the loader in pixels.
 * @param {string} text - The loading text to display letter-by-letter.
 */
export const AILoader = ({ size = 180, text = "Generating" }) => {
  const letters = text.split("");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-b from-[#1a3379]/90 via-[#0f172a] to-black backdrop-blur-md">
      <div
        className="relative flex items-center justify-center font-inter select-none"
        style={{ width: size, height: size }}
      >
        {/* Animated Letters */}
        <div className="flex gap-1 items-center justify-center z-10">
          {letters.map((letter, index) => (
            <span
              key={index}
              className="inline-block text-white opacity-40 animate-loaderLetter text-lg font-black tracking-widest uppercase font-jakarta"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* Pulsing Light Field */}
        <div
          className="absolute inset-0 rounded-full animate-loaderCircle opacity-80"
        ></div>
      </div>
    </div>
  );
};
