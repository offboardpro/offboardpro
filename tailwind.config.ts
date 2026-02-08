import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brandNavy: "#1A365D",
        brandGreen: "#84CC16",
        brandSlate: "#F8FAFC",
      },
    },
  },
  plugins: [],
};
export default config;