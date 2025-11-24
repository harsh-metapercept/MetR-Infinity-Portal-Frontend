/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'source-sans': ['Source Sans Pro', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        'primary-bg': '#f5e6ed',
        'secondary-bg': '#3d3e3f',
        'accent-blue': '#266EF6',
        'accent-green': '#35B535',
        'accent-purple': '#BF00FF',
        'accent-yellow': '#FFD300',
        'accent-orange': '#ff8904',
        'accent-cyan': '#00d5be',
        'accent-light-blue': '#51a2ff',
        'accent-light-purple': '#c27aff',
        'text-primary': '#3d3e3f',
        'text-secondary': '#000347',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      },
    },
  },
  plugins: [],
}