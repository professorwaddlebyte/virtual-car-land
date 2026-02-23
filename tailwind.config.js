/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'dubai-blue': '#0055A4',
        'dubai-gold': '#FFD700',
        'dubai-blue-light': '#3366CC',
        'dubai-gold-light': '#FFED4E',
        'dubai-blue-dark': '#003366',
        'dubai-gold-dark': '#CCA300',
      },
      backgroundImage: {
        'gradient-dubai': 'linear-gradient(135deg, #0055A4 0%, #FFD700 100%)',
        'gradient-dubai-light': 'linear-gradient(135deg, rgba(0, 85, 164, 0.1) 0%, rgba(255, 215, 0, 0.1) 100%)',
        'gradient-dubai-dark': 'linear-gradient(135deg, #003366 0%, #CCA300 100%)',
      },
      fontFamily: {
        'inter': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'dubai': '0 10px 40px rgba(0, 85, 164, 0.15)',
        'dubai-lg': '0 20px 60px rgba(0, 85, 164, 0.2)',
        'dubai-xl': '0 25px138px rgba(0, 85, 164, 0.25)',
      },
      animation: {
        'pulse-dubai': 'pulse-dubai 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.3s ease-out',
      },
      keyframes: {
        'pulse-dubai': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(0, 85, 164, 0.4)',
          },
          '50%': {
            boxShadow: '0 0 0 10px rgba(0, 85, 164, 0)',
          },
        },
        'slide-in-right': {
          from: {
            transform: 'translateX(100%)',
            opacity: '0',
          },
          to: {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        'slide-in-left': {
          from: {
            transform: 'translateX(-100%)',
            opacity: '0',
          },
          to: {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        'fade-in-up': {
          from: {
            transform: 'translateY(10px)',
            opacity: '0',
          },
          to: {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}