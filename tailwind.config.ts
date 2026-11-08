import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        brand: {
          gold: {
            DEFAULT: '#B8860B',
            light: '#D4A843',
            dark: '#8B6914',
          },
          espresso: {
            DEFAULT: '#2C1810',
            light: '#42281D',
            dark: '#1A0E0A',
          },
          ivory: {
            DEFAULT: '#FAF3E0',
            dark: '#EEDDC0',
          },
          burgundy: {
            DEFAULT: '#722F37',
            light: '#8B3A42',
            dark: '#541F25',
          },
          pearl: '#F8F6F3',
          charcoal: '#333333',
          forest: {
            DEFAULT: '#2E7D32',
            light: '#388E3C',
          },
        },
        primary: {
          DEFAULT: '#B8860B',
          foreground: '#FAF3E0',
        },
        secondary: {
          DEFAULT: '#FAF3E0',
          foreground: '#2C1810',
        },
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F3EFEA',
          foreground: '#666666',
        },
        accent: {
          DEFAULT: '#722F37',
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#2C1810',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        accent: ['var(--font-cormorant)', 'serif'],
      },
      borderRadius: {
        soft: '8px',
        card: '12px',
        modal: '16px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(44, 24, 16, 0.08)',
        'card-hover': '0 12px 32px rgba(44, 24, 16, 0.16)',
        elevated: '0 16px 48px rgba(44, 24, 16, 0.20)',
        gold: '0 0 25px rgba(184, 134, 11, 0.35)',
      },
      backgroundImage: {
        'gradient-cta': 'linear-gradient(135deg, #B8860B 0%, #722F37 100%)',
        'gradient-cta-hover': 'linear-gradient(135deg, #D4A843 0%, #8B3A42 100%)',
        'gradient-gold': 'linear-gradient(135deg, #FAF3E0 0%, #D4A843 50%, #B8860B 100%)',
        'gradient-dark': 'linear-gradient(180deg, rgba(44, 24, 16, 0.85) 0%, rgba(44, 24, 16, 0.98) 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
