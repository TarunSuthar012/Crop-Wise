/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#047857',
          light: '#d1fae5',
          dark: '#064e3b',
        },
        accent: {
          yellow: '#f59e0b',
          amber: '#fbbf24',
        },
      },
      boxShadow: {
        agri: '0 4px 20px -4px rgba(5, 150, 105, 0.15), 0 0 0 1px rgba(5, 150, 105, 0.06)',
        'agri-lg': '0 20px 40px -12px rgba(5, 150, 105, 0.2), 0 0 0 1px rgba(5, 150, 105, 0.08)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glass-lg': '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.08)',
        'glow-emerald': '0 0 40px rgba(16, 185, 129, 0.3)',
        'glow-amber': '0 0 40px rgba(245, 158, 11, 0.3)',
        'card-hover': '0 20px 40px -12px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'blob': 'blob 8s infinite alternate',
        'blob-slow': 'blob 12s infinite alternate-reverse',
        'blob-slower': 'blob 16s infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-slower': 'float 10s ease-in-out infinite',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up-delay': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-delay': 'fadeIn 0.5s ease-out 0.2s both',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'radar': 'radar 3s linear infinite',
        'gradient-xy': 'gradientXY 6s ease infinite',
        'spin-slow': 'spin 6s linear infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(15px, -10px) scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(16, 185, 129, 0.35)' },
        },
        radar: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        gradientXY: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backgroundSize: {
        '300%': '300%',
      },
    },
  },
  plugins: [],
}
