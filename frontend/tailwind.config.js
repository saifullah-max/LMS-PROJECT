/** @type {import('tailwindcss').Config} */
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
})

// module.exports = {
//   // ← make sure these globs actually point at your .jsx/.tsx files
//   content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],

//   theme: {
//     extend: {
//       // Makes the `@apply font-sans` utility exist
//       fontFamily: {
//         sans: ["Nunito Sans", "ui-sans-serif", "system-ui", "sans-serif"],
//       },
//       // If you want `bg-neutral`, `text-text`, etc. you must map them here
//       colors: {
//         neutral: "var(--color-neutral)",
//         text: "var(--color-text)",
//         primary: "var(--color-primary)",
//         secondary: "var(--color-secondary)",
//         accent: "var(--color-accent)",
//       },
//     },
//   },

//   plugins: [],
// };
