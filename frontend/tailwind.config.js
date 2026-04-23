/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0faf4',
          100: '#dcf5e7',
          200: '#bbebd0',
          300: '#8edab0',
          400: '#5cc28a',
          500: '#37a86c',
          600: '#278a56',
          700: '#1e6e45',
          800: '#1a5738',
          900: '#164830',
        }
      }
    }
  },
  plugins: []
}
