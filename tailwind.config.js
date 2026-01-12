/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",        // Файлы в корне (App.tsx, index.tsx)
    "./components/**/*.{ts,tsx}",  // Файлы в папке components
    "./services/**/*.{ts,tsx}",    // Файлы в папке services
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
