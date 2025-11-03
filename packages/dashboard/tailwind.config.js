/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'x402-purple': '#9333ea',
        'x402-blue': '#3b82f6',
        'x402-green': '#10b981',
      }
    },
  },
  plugins: [],
}
