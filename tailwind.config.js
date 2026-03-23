/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E8651A',
        'primary-dark': '#C4530F',
        secondary: '#3D1F0D',
        accent: '#F5A623',
        'bg-warm': '#FDF6EE',
        'bg-card': '#FFFAF5',
        'text-main': '#2C1A0E',
        'text-muted': '#7A5C45',
        success: '#2D7A40',
        danger: '#C0392B',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Nunito', 'sans-serif'],
      },
      boxShadow: {
        warm: '0 4px 24px rgba(232,101,26,0.10)',
        card: '0 2px 16px rgba(61,31,13,0.08)',
      },
    },
  },
  plugins: [],
}
