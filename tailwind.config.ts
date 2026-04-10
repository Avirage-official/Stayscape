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
        gold: '#C9A84C',
        'gold-light': '#D4B85C',
        'gold-muted': '#8A7A3A',
        dark: '#0A0A0A',
        'dark-card': '#151515',
        'dark-border': '#222222',
        charcoal: '#131313',
        'charcoal-light': '#1A1A1A',
        surface: '#151515',
        'surface-raised': '#1C1C1C',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.25)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.3)',
        'gold-glow': '0 0 20px rgba(201, 168, 76, 0.15)',
        'search': '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      borderRadius: {
        'editorial': '6px',
      },
    },
  },
  plugins: [],
};
export default config;
