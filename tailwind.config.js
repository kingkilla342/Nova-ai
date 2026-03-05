/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        hud: {
          green: '#00ff6a',
          'green-dim': '#00cc55',
          'green-dark': '#00883a',
          bg: '#020a04',
          panel: '#051a0c',
          surface: '#082210',
          text: '#b0f0c8',
          'text-dim': '#4a8a5e',
          'text-bright': '#d0ffe0',
          amber: '#ffaa00',
          red: '#ff3344',
          cyan: '#00ddff',
        }
      },
      fontFamily: {
        display: ['"Orbitron"', 'sans-serif'],
        sans: ['"Rajdhani"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Share Tech Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
