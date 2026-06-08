import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0b0d12",
          800: "#11131a",
          700: "#161922",
          600: "#1c2030",
          500: "#252a3a",
        },
        brand: {
          DEFAULT: "#2fbf71",
          dark: "#249a5b",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
