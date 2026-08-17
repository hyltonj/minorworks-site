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
        // Sampled directly from the live product sites, same approach as sylly above.
        margin: "#cf5727",
        highlightr: "#97792c",
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
        slideBar: {
          "0%, 100%": { left: "20%" },
          "50%": { left: "70%" },
        },
        popScale: {
          "0%, 100%": { transform: "scale(0.85)", opacity: "0.5" },
          "50%": { transform: "scale(1.08)", opacity: "1" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.06)" },
        },
        snapIn: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        ringExpand: {
          "0%": { transform: "scale(0.3)", opacity: "0.9" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        syllyMerge: {
          "0%, 15%": { transform: "translateX(-10px)", opacity: "0.5" },
          "45%, 65%": { transform: "translateX(0)", opacity: "1" },
          "85%, 100%": { transform: "translateX(-10px)", opacity: "0.5" },
        },
        syllyMergeRight: {
          "0%, 15%": { transform: "translateX(10px)", opacity: "0.5" },
          "45%, 65%": { transform: "translateX(0)", opacity: "1" },
          "85%, 100%": { transform: "translateX(10px)", opacity: "0.5" },
        },
        marble: {
          "0%": { transform: "translate(-22px, -22px)" },
          "25%": { transform: "translate(-11px, -11px)" },
          "50%": { transform: "translate(0px, 0px)" },
          "75%": { transform: "translate(11px, 11px)" },
          "100%": { transform: "translate(22px, 22px)" },
        },
        flip: {
          "0%, 100%": { transform: "rotateY(0deg)" },
          "50%": { transform: "rotateY(180deg)" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        sweep: {
          "0%": { transform: "translateX(-120%)", opacity: "0" },
          "15%": { opacity: "1" },
          "85%": { opacity: "1" },
          "100%": { transform: "translateX(120%)", opacity: "0" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-6px)" },
          "40%": { transform: "translateX(6px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(4px)" },
        },
        circleIn: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "0.94" },
        },
      },
      animation: {
        drift: "drift 18s ease-in-out infinite",
        "drift-slow": "driftSlow 24s ease-in-out infinite",
        "slide-bar": "slideBar 2.4s ease-in-out infinite",
        "pop-scale": "popScale 1.8s ease-in-out infinite",
        breathe: "breathe 2.6s ease-in-out infinite",
        "snap-in": "snapIn 1.6s ease-in-out infinite",
        "ring-expand": "ringExpand 2.2s ease-out infinite",
        "sylly-merge": "syllyMerge 3.2s ease-in-out infinite",
        "sylly-merge-right": "syllyMergeRight 3.2s ease-in-out infinite",
        marble: "marble 2.4s ease-in-out infinite alternate",
        flip: "flip 1.4s ease-in-out infinite",
        orbit: "orbit 3s linear infinite",
        sweep: "sweep 1.6s ease-in-out infinite",
        shake: "shake 0.4s ease-in-out",
        "circle-in": "circleIn 0.45s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
