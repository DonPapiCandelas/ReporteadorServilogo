/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#0ea5e9",
        "primary-dark": "#0284c7",
        "background": "#0a0f14",
        "surface": "#121921",
        "surface-lighter": "#1e2936",
        "border": "#2d3a4b",
        "text-main": "#e2e8f0",
        "text-sub": "#94a3b8",
        "success": "#10b981",
        "danger": "#f43f5e",
        "warning": "#f59e0b"
      },
      fontFamily: {
        "sans": ["Inter", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
}
