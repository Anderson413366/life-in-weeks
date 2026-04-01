/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: { poppins: ['Poppins', 'sans-serif'] },
      colors: {
        'primary':      '#00d4ff',
        'primary-dark':  '#0097b5',
        'primary-glow':  'rgba(0, 212, 255, 0.3)',
        'accent':        '#ff6b6b',
        'accent-glow':   'rgba(255, 107, 107, 0.3)',
        'bg-dark':       '#0c0a14',
        'bg-light':      '#12101f',
        'text-main':     '#ffffff',
        'text-muted':    '#b4b4c7',
        'box-border':    'rgba(120, 80, 200, 0.12)',
        'card-bg':       'rgba(22, 18, 38, 0.9)',
        'decade-marker': '#ffd700',
        'gemini-button-bg':       '#8e44ad',
        'gemini-button-hover-bg': '#732d91',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'pulse-slow': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '.7' } },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'pulse-slow': 'pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
