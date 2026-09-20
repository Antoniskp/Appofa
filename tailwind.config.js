/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ivory: '#F7F5F0',
        charcoal: '#252627',
        copper: '#955438',
        'brand-border': '#DCD8D0',
        // Compatibility palette for existing brand utilities across the app.
        blue: {
          50: '#F7F5F0',
          100: '#EAE4DA',
          200: '#DCD8D0',
          300: '#C3B5A8',
          400: '#A77A63',
          500: '#955438',
          600: '#80462F',
          700: '#693A28',
          800: '#49352C',
          900: '#252627',
          950: '#18191A',
        },
        seafoam: '#EAE4DA',
        sand: '#EAE4DA',
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-in-out',
        'vote-pop': 'vote-pop 0.22s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'vote-pop': {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.18)' },
          '70%':  { transform: 'scale(0.94)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
