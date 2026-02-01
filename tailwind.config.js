/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          500: '#4f5470',
          600: '#464b65',
          700: '#3b4058',
          800: '#2f344b',
          900: '#262a3d',
        },
        seafoam: '#b7c2b2',
        sand: '#d6d2c4',
      },
    },
  },
  plugins: [],
}
