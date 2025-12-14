/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '375px',    // iPhone SE, small phones
      'sm': '390px',    // iPhone 12/13/14
      'md': '768px',    // Tablets, desktop threshold
      'lg': '1024px',   // Desktop
      'xl': '1280px',   // Large desktop
      '2xl': '1536px',  // Extra large
    },
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {},
      minHeight: {
        'dvh': '100dvh', // Dynamic viewport height
      },
      height: {
        'dvh': '100dvh',
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
}
