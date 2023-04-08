/** @type {import('tailwindcss').Config} */
module.exports = {
  // content: ["./src/**/*.{html,js}"],
  // content: ["./src/pages/Incribe/*.{html,js}"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/react-tailwindcss-select/dist/index.esm.js"
  ]
  theme: {
    extend: {
      boxShadow: {
        'shadow-profile': '0 4px 6px -1px #110528, 0 2px 4px -2px #110528',
      }
    },
  },
  plugins: [],
}
