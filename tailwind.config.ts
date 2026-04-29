import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#1e3a5f",
          trust: "#3b82f6",
          cta: "#f59e0b",
          bg: "#f8fafc",
          text: "#0f172a",
          success: "#22c55e",
          error: "#ef4444",
          warning: "#f59e0b",
          border: "#e2e8f0",
          surface: "#f1f5f9",
          muted: "#64748b",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "float": "float 6s ease-in-out infinite",
        "slide-in-right": "slide-in-right 150ms ease-out",
        "radar-ping": "radar-ping 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "radar-ping-delayed": "radar-ping 2.5s cubic-bezier(0.4, 0, 0.2, 1) 1.25s infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(59,130,246,0.1)" },
          "100%": { boxShadow: "0 0 40px rgba(59,130,246,0.3)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(10px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "radar-ping": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "70%": { transform: "scale(2.2)", opacity: "0" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
