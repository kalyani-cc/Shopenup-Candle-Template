import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  /* Avoid fighting Bootstrap + Lumin template resets */
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {}
  },
  plugins: []
};

export default config;
