/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
        'dm-sans': ['DM Sans', 'sans-serif'],
      },
      colors: {
        dark: '#0f172a',
        darker: '#020617',
        primary: '#3b82f6',
        secondary: '#10b981',
        card: '#1e293b',
        border: '#334155',
        neu: {
          bg: '#E0E5EC',
          primary: '#1F2937',
          muted: '#4B5563',
          accent: '#6C63FF',
        },
      },
      boxShadow: {
        'neu': '8px 8px 16px #c8ccd1, -8px -8px 16px #ffffff',
        'neu-inset': 'inset 6px 6px 10px #c8ccd1, inset -6px -6px 10px #ffffff',
        'neu-hover': '12px 12px 24px #c8ccd1, -12px -12px 24px #ffffff',
      }
    },
  },
  plugins: [],
}
