/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: 'rgb(var(--obsidian-950) / <alpha-value>)',
          900: 'rgb(var(--obsidian-900) / <alpha-value>)',
          850: 'rgb(var(--obsidian-850) / <alpha-value>)',
          800: 'rgb(var(--obsidian-800) / <alpha-value>)',
          700: 'rgb(var(--obsidian-700) / <alpha-value>)',
          600: 'rgb(var(--obsidian-600) / <alpha-value>)',
        },
        gold: {
          300: '#F5E4B2',
          400: '#E6CB85',
          500: '#D4AF37',
          600: '#B89225',
          700: '#8C6C16',
        },
        electric: {
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        editorial: {
          surface: 'rgb(var(--editorial-surface) / <alpha-value>)',
          border: 'var(--editorial-border)',
          'border-gold': 'rgba(212, 175, 55, 0.25)',
          'border-electric': 'rgba(99, 102, 241, 0.25)',
          subtle: 'var(--editorial-subtle)',
          muted: 'var(--editorial-muted)',
        }
      },
      fontFamily: {
        serif: ['"Cinzel"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'gold-glow': '0 0 25px -5px rgba(212, 175, 55, 0.3)',
        'electric-glow': '0 0 25px -5px rgba(99, 102, 241, 0.35)',
        'inner-glow': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'pulse-subtle': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
