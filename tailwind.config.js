/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        lab: {
          950: '#050a14',
          900: '#070d1a',
          850: '#0a1222',
          800: '#0e1830',
          700: '#152340',
          600: '#1d3055',
          500: '#2a4270',
          400: '#3d5c92',
        },
        beam: {
          50: '#eff9ff',
          100: '#def2ff',
          200: '#b6e6ff',
          300: '#75d4ff',
          400: '#2cbeff',
          500: '#03a3f0',
          600: '#0082cd',
          700: '#0067a6',
          800: '#065789',
          900: '#0b4871',
        },
      },
      fontFamily: {
        display: ['"Rajdhani"', '"Pretendard"', 'system-ui', 'sans-serif'],
        sans: [
          '"Pretendard"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'system-ui',
          'sans-serif',
        ],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px -4px rgba(44, 190, 255, 0.55)',
        'glow-lg': '0 0 48px -6px rgba(44, 190, 255, 0.65)',
        panel: '0 18px 40px -24px rgba(0, 0, 0, 0.9)',
      },
      keyframes: {
        'shake-x': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-10px)' },
          '40%': { transform: 'translateX(9px)' },
          '60%': { transform: 'translateX(-6px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.75' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'grid-drift': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '40px 40px' },
        },
      },
      animation: {
        'shake-x': 'shake-x 0.45s cubic-bezier(.36,.07,.19,.97) both',
        'pulse-ring': 'pulse-ring 1.1s ease-out infinite',
        float: 'float 4s ease-in-out infinite',
        'grid-drift': 'grid-drift 12s linear infinite',
      },
    },
  },
  plugins: [],
}
