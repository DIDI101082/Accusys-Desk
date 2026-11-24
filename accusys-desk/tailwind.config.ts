import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Accusys dark theme palette
        background: "#0f1117",
        surface: "#1a1d27",
        "surface-2": "#22263a",
        "surface-3": "#2a2f45",
        border: "#2e3348",
        "border-light": "#3d4460",
        primary: "#4f7cff",
        "primary-hover": "#3a68f0",
        "primary-muted": "#1e3a8a",
        accent: "#7c3aed",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
        "text-primary": "#e8eaf6",
        "text-secondary": "#9ba3c0",
        "text-muted": "#6b7280",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [],
};

export default config;
