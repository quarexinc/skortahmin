import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05080f',
          900: '#070d1a',
          800: '#0c1424',
          700: '#111c33',
          600: '#1a2947',
          500: '#24365c',
        },
        accent: {
          DEFAULT: '#22c55e',
          soft: '#4ade80',
          dim: '#15803d',
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out',
        pop: 'pop 0.18s ease-out',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        blob: 'blob 18s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'word-in': 'wordIn 0.5s cubic-bezier(.2,.8,.2,1)',
        'spin-slow': 'spin 24s linear infinite',
        glow: 'glow 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(.97)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        blob: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(40px,-30px) scale(1.1)' },
          '66%': { transform: 'translate(-30px,25px) scale(.95)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        wordIn: {
          '0%': { opacity: '0', transform: 'translateY(60%)', filter: 'blur(6px)' },
          '100%': { opacity: '1', transform: 'none', filter: 'none' },
        },
        glow: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(34,197,94,.35)' },
          '50%': { boxShadow: '0 0 0 10px rgba(34,197,94,0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
