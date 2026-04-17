/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          DEFAULT: "#4f46e5",
          dark: "#3730a3",
        },
        accent: { DEFAULT: "#ec4899" },
        surface: "#f8fafc",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.03)",
        pop:  "0 10px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.05)",
        glow: "0 0 0 3px rgb(99 102 241 / 0.15)",
      },
      backgroundImage: {
        'gradient-sidebar': 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        'gradient-brand':   'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
        'gradient-success': 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
        'gradient-warn':    'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
        'gradient-danger':  'linear-gradient(135deg, #ef4444 0%, #f43f5e 100%)',
        'gradient-info':    'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
