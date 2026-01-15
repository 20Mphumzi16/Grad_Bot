module.exports = {
  // Tailwind CSS v4 moved the PostCSS plugin into @tailwindcss/postcss.
  // Autoprefixer is included by default, so we only need this one plugin.
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
