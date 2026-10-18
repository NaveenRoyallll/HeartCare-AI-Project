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
        navy: {
          50: "#EFF3FF",
          100: "#DBE4FF",
          200: "#BFD0FF",
          300: "#93B1FD",
          400: "#608BF9",
          500: "#3B69F2",
          600: "#254DE5",
          700: "#1D3AC6",
          800: "#1E32A0",
          900: "#1B2A4A",
          950: "#0F172A",
        },
        teal: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
          950: "#042F2E",
        },
        cardio: {
          danger: "#EF4444",
          warning: "#F59E0B",
          success: "#10B981",
          info: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
