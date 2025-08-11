/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        severity: {
          low: "#16a34a",
          medium: "#f59e0b",
          high: "#dc2626"
        }
      }
    }
  },
  plugins: []
};


