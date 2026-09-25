import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        background: "var(--bg)",
        panel: "var(--panel)",
        "panel-2": "var(--panel-2)",
        border: "var(--border)",
        text: "var(--text)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        "accent-2": "var(--accent-2)",
        "on-accent": "var(--on-accent)",
        strong: "var(--strong)",
        surface: "var(--surface)",
        "surface-strong": "var(--surface-strong)",
        hover: "var(--hover)",
        "hover-strong": "var(--hover-strong)",
        "line-strong": "var(--line-strong)",
        "glow-accent": "var(--glow-accent)",
        "glow-accent-2": "var(--glow-accent-2)",
        cyber: { yellow: "#fcee0a", blue: "#00f0ff", pink: "#ff00ff", black: "#0a0a0a" },
      },
      animation: { scanline: "scanline 8s linear infinite" },
      keyframes: {
        scanline: { "0%": { backgroundPosition: "0% 0%" }, "100%": { backgroundPosition: "0% 100%" } },
      },
    },
  },
  // `light:` styles apply only on light themes (tones tuned for dark backgrounds fail contrast on light ones).
  plugins: [plugin(({ addVariant }) => addVariant("light", ':root[data-theme="bluloco-light"] &'))],
};
export default config;
