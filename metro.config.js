const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for html2pdf.js and pdfjs-dist
config.resolver.alias = {
  ...config.resolver.alias,
  'html2pdf.js': require.resolve('html2pdf.js'),
  'pdfjs-dist': require.resolve('pdfjs-dist'),
};

// Ensure these modules are not treated as external
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'html2pdf.js': require.resolve('html2pdf.js'),
  'pdfjs-dist': require.resolve('pdfjs-dist'),
};

module.exports = config;