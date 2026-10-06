/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ai: {
          darkest: '#191919',
          darker: '#222222',
          panel: '#282828',
          header: '#323232',
          border: '#3c3c3c',
          borderLight: '#4a4a4a',
          hover: '#3f3f3f',
          active: '#4a4a4a',
          accent: '#0d99ff',
          accentHover: '#0085e6',
          textMuted: '#9e9e9e',
          textLight: '#e0e0e0',
          textWhite: '#f5f5f5',
        }
      }
    },
  },
  plugins: [],
}
