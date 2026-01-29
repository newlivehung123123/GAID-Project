/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./dist/**/*.{html,js}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.php"
  ],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
        sans: ['Space Mono', 'monospace'],
      },
      colors: {
        brand: {
          black: '#0a0a0a',
          dark: '#1a1a1a',
          accent: '#1B3D7B', 
        },
        blue: {
          50: '#f0f4fd',
          100: '#e0e9fb',
          200: '#c1d4f7',
          300: '#94b3f0',
          400: '#6490e8',
          500: '#1B3D7B',
          600: '#1B3D7B',
          700: '#163266',
          800: '#122852',
          900: '#0e1d3d',
          950: '#081126',
        }
      }
    }
  },
  plugins: [],
}

