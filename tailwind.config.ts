import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tipBlack: '#050607',
        tipDark: '#0b0f12',
        tipYellow: '#eab308',
        tipGlow: '#facc15',
        neoLime: '#b6ff1d',
        neoGreen: '#28f27d',
        newsRed: '#cc0000'
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
        display: ['var(--font-plus-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
        mont: ['var(--font-montserrat)', 'Montserrat', 'sans-serif']
      },
      boxShadow: {
        neo: '0 24px 70px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.08)'
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        flame: { '0%,100%': { transform: 'scale(1) rotate(-2deg)' }, '50%': { transform: 'scale(1.12) rotate(2deg)' } }
      },
      animation: { float: 'float 3s ease-in-out infinite', flame: 'flame 1.2s ease-in-out infinite' }
    }
  },
  plugins: []
};
export default config;
