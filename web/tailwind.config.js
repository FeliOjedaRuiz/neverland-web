import tailwindAnimations from 'tailwind-animations';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        'neverland-green': '#24635A', // Tono oscuro UI
        'brand-green-light': '#45B18D', // Tono Logo
        'energy-orange': '#F07D3E',
        'sun-yellow': '#F9C835',
        'rec-blue': '#4B8CC8',

        // Backgrounds & Surfaces
        'cream-bg': '#FDEBD0',
        'surface': '#FFF9F0', // Cards & Modals

        // Semantic/Text
        'text-black': '#1A1A1A',
        'text-muted': '#2D5A4C',
        'silhouette-green': '#2D5A4C', // Keeping legacy name for compatibility
      },
      fontFamily: {
        'sans': ['Nunito', 'sans-serif'], // Body default
        'display': ['Fredoka', 'sans-serif'], // Headings
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(45, 90, 76, 0.08)', // Tinted shadow
      }
    },
  },
  plugins: [
    tailwindAnimations,
  ],
}
