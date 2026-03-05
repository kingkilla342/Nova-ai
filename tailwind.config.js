/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        nova: {
          bg: '#0a0f0a',
          panel: '#111a11',
          surface: '#162016',
          border: '#1e3a1e',
          'border-light': '#2a5a2a',
          accent: '#3ddc84',
          'accent-dim': '#2a9d5e',
          'accent-glow': '#3ddc8440',
          text: '#d4e8d4',
          'text-dim': '#7a9a7a',
          'text-bright': '#e8ffe8',
          olive: '#1a2614',
          'olive-light': '#243420',
          amber: '#d4a843',
          red: '#dc3d3d',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['"DM Sans"', '"IBM Plex Sans"', 'sans-serif'],
        display: ['"Orbitron"', '"Rajdhani"', 'sans-serif'],
      },
      boxShadow: {
        'nova-glow': '0 0 20px rgba(61, 220, 132, 0.15)',
        'nova-glow-strong': '0 0 40px rgba(61, 220, 132, 0.25)',
        'nova-inner': 'inset 0 1px 0 rgba(61, 220, 132, 0.1)',
      },
      backdropBlur: {
        'nova': '12px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'materialize': 'materialize 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        materialize: {
          '0%': { opacity: '0', transform: 'scale(0.95)', filter: 'blur(4px)' },
          '100%': { opacity: '1', transform: 'scale(1)', filter: 'blur(0)' },
        },
      }
    },
  },
  plugins: [],
};
