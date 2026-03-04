import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Selecta Medium"', '"Selecta Medium Placeholder"', 'sans-serif'],
        display: ['"Selecta Medium"', '"Selecta Medium Placeholder"', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f4f6f8',
          100: '#e5e9f0',
          200: '#ccd4df',
          300: '#a3b5c7',
          400: '#758fa8',
          500: '#54728f',
          600: '#3f5875',
          700: '#344760',
          800: '#2d3d52',
          900: '#283445',
          950: '#1b2330',
        },
        // Premium Dark Theme inspired by Acctual
        appit: {
          bg: '#000000',
          card: '#0A0A0A',
          hover: '#141414',
          border: '#1A1A1A',
          text: '#FFFFFF',
          muted: '#888888',
        }
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
