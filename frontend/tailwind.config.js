/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f2faf5',
          100: '#dff3e4',
          200: '#b9e4c9',
          300: '#84cca2',
          400: '#4aad79',
          500: '#2e8b57',
          600: '#237046',
          700: '#1a5a37',
          800: '#0f5132',
          900: '#0a3b24',
        },
        cream: '#F7F8F3',
        gold:  '#D9A441',
        ink:   '#172033',
        muted: '#E6E8DD',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(23,32,51,0.06), 0 1px 2px -1px rgba(23,32,51,0.04)',
        'card-md': '0 4px 12px 0 rgba(23,32,51,0.08), 0 1px 3px 0 rgba(23,32,51,0.04)',
        'card-lg': '0 8px 24px 0 rgba(23,32,51,0.10), 0 2px 6px 0 rgba(23,32,51,0.06)',
      },
    }
  },
  plugins: []
}
