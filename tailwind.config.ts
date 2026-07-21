import type { Config } from "tailwindcss";

// Tokens pulled from ~/dev/games-clean/shared/src/theme/brand.ts (BRAND)
// so the marketing site matches Ballpark/Venny exactly rather than
// inventing a new palette.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        mw: {
          primary: "#1e293b", // deep slate
          secondary: "#64748b", // muted blue-gray
          accent: "#f97316", // bright orange — CTAs, highlights
          success: "#4caf50",
          error: "#ef4444",
          background: "#f8fafc",
          card: "#ffffff",
          border: "#e2e8f0",
          borderSoft: "#f1f5f9",
          text: {
            dark: "#1e293b",
            muted: "#64748b",
            light: "#94a3b8",
          },
        },
        venny: {
          1: "#304193",
          2: "#9446ED",
          3: "#E64A41",
          4: "#F28D35",
          5: "#88C041",
        },
        sylly: "#84cc16",
        // Dappled's real design tokens, pulled from its actual build spec
        // (studio-brief-complete.md) — not guessed.
        dappled: {
          paper: "#F8F5EE",
          ink: "#3A362F",
          fade: "#8A8478",
          pink: "#FF48B0",
          orange: "#FF6C2F",
          yellow: "#FFD900",
          green: "#00A95C",
          blue: "#0078BF",
          indigo: "#3A4FD8",
          purple: "#765BA7",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        mw: "22px",
        "mw-sm": "16px",
      },
      boxShadow: {
        mw: "0 10px 22px rgba(2, 8, 23, 0.06)",
        "mw-lift": "0 12px 26px rgba(2, 8, 23, 0.14)",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(2%, -3%) scale(1.03)" },
        },
        driftSlow: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-3%, 2%) scale(1.05)" },
        },
      },
      animation: {
        drift: "drift 18s ease-in-out infinite",
        "drift-slow": "driftSlow 24s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
