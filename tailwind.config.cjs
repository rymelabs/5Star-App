/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Main red
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Green for accents/decorations
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151', // Dark cards/surfaces
          800: '#000000', // Darker surfaces
          900: '#000000', // Main black background
        },
        // New Design System Colors
        app: '#050816',
        elevated: '#0B1020',
        'elevated-soft': '#111827',
        'brand-purple': {
          DEFAULT: '#6D28D9',
          soft: 'rgba(109,40,217,0.15)',
          dark: '#4C1D95',
        },
        'brand-red': '#ef4444',
        'accent-green': '#22C55E',
      },
      backgroundImage: {
        'purple-gradient': 'linear-gradient(135deg, #6D28D9, #4C1D95)',
        'hero-gradient': 'linear-gradient(to top right, rgba(109, 40, 217, 0.4), transparent)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'live-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'live-pulse': 'live-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}