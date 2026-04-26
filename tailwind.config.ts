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
        gold: '#C17F3A',
        'gold-light': '#D4956A',
        'gold-muted': '#E8C9A8',
        'gold-subtle': 'rgba(193,127,58,0.10)',
        warm: '#FAF8F5',
        'warm-surface': '#F5F2EE',
        'warm-border': '#EDE8E1',
        dark: '#1C1A17',
        'dark-card': '#FFFFFF',
        'dark-border': '#EDE8E1',
        charcoal: '#F0EBE3',
        'charcoal-light': '#F7F4F0',
        surface: '#FFFFFF',
        'surface-raised': '#F5F2EE',
        'text-primary': '#1C1A17',
        'text-secondary': '#6B6158',
        'text-muted': '#9E9389',
        'map-dark': '#0F0E0C',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        'soft': '0 2px 12px rgba(28,26,23,0.08)',
        'medium': '0 8px 32px rgba(28,26,23,0.14)',
        'gold-glow': '0 0 20px rgba(193,127,58,0.20)',
        'card': '0 2px 12px rgba(28,26,23,0.08)',
        'card-hover': '0 8px 32px rgba(28,26,23,0.14)',
        'input-focus': '0 0 0 3px rgba(193,127,58,0.15)',
        'search': '0 4px 24px rgba(28,26,23,0.10)',
      },
      borderRadius: {
        'editorial': '6px',
      },
    },
  },
  plugins: [],
};
export default config;
