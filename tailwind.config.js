/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#1D4ED8',
        'primary-dark': '#1E3A5F',
        accent: '#D97706',
        background: '#0F172A',
        surface: '#1E293B',
        elevated: '#334155',
        border: '#475569',
        success: '#16A34A',
        error: '#DC2626',
        warning: '#D97706',
        'text-primary': '#F8FAFC',
        'text-secondary': '#94A3B8',
        'text-muted': '#64748B',
      },
    },
  },
  plugins: [],
};
