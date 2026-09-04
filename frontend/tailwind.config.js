/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: '#0f0f0f',
        muted: '#8a8a8a',
        faint: '#f7f6f3',
        stone: '#e8e5df',
        accent: '#0f0f0f',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06)',
        float: '0 8px 40px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
}
