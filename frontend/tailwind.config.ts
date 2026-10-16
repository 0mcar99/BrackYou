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
        cream: "#FDF6E8",
        card: "#FFFDF7",
        textPrimary: "#2D1B0E",
        textSecondary: "#6B4F3A",
        textMuted: "#9C8B7A",
        accentOrange: "#E8622B",
        accentTeal: "#2A7A6B",
        accentRed: "#D94F3D",
        accentYellow: "#F5C842",
        accentBrown: "#4A2C1A",
        borderLight: "#E8DCC8",
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        'pill': '50px',
      },
      boxShadow: {
        'tiebreak': '0 4px 0 #4A2C1A',
        'tiebreak-hover': '0 2px 0 #4A2C1A',
        'tiebreak-lg': '0 6px 0 #4A2C1A',
      }
    },
  },
  plugins: [],
};
export default config;
