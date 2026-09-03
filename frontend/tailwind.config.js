/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: '#111111',
        muted: '#888888',
        faint: '#f8f7f4',
        stone: '#e5e2db',
        accent: '#7c3aed',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        float: '0 8px 30px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
