/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "rgb(var(--color-primary) / <alpha-value>)",
        "primary-dark": "rgb(var(--color-primary-dark) / <alpha-value>)",
        "background": "rgb(var(--color-background) / <alpha-value>)",
        "surface": "rgb(var(--color-surface) / <alpha-value>)",
        "surface-lighter": "rgb(var(--color-surface-lighter) / <alpha-value>)",
        "border": "rgb(var(--color-border) / <alpha-value>)",
        "text-main": "rgb(var(--color-text-main) / <alpha-value>)",
        "text-sub": "rgb(var(--color-text-sub) / <alpha-value>)",
        "success": "rgb(var(--color-success) / <alpha-value>)",
        "danger": "rgb(var(--color-danger) / <alpha-value>)",
        "warning": "rgb(var(--color-warning) / <alpha-value>)"
      },
      fontFamily: {
        "sans": ["Inter", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
}
