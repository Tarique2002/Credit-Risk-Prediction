/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#080c16",
          card: "rgba(16, 24, 48, 0.6)",
          border: "rgba(255, 255, 255, 0.08)",
          teal: "#0d9488",
          green: "#10b981",
          amber: "#d97706",
          orange: "#ea580c",
          red: "#dc2626",
          cyan: "#06b6d4",
          blue: "#2563eb",
          muted: "#94a3b8",
          glow: "rgba(6, 182, 212, 0.15)"
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-glow': '0 0 20px rgba(6, 182, 212, 0.25)',
        'cyber-glow': '0 0 15px rgba(16, 185, 129, 0.2)'
      }
    },
  },
  plugins: [],
}
