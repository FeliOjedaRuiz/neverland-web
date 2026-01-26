/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neverland-green': '#24635A',
        'energy-orange': '#F07D3E',
        'sun-yellow': '#F9C835',
        'rec-blue': '#4B8CC8',
        'silhouette-green': '#2D5A4C',
        'cream-bg': '#FDEBD0',
        'text-black': '#1A1A1A',
      },
      fontFamily: {
        // Will set up fonts next
      }
    },
  },
  plugins: [
    require('tailwind-animations'),
  ],
}
