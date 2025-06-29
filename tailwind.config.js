module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        oxanium: ['Oxanium', 'sans-serif'],
        body: ['Oxanium', 'sans-serif'],
      },
      fontWeight: {
        extralight: '200',
        semibold: '600',
      },
      colors: {
        textlight: '#ccccff',
        headinglight: '#ffffff',
      },
      backgroundImage: {
        stars: "url('./img/background.png')",
      }
    },
  },
  plugins: [],
};
