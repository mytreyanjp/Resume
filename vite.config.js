import { defineConfig, transformWithOxc } from 'vite';
import react from '@vitejs/plugin-react';

// Custom plugin to transpile JSX in .js files before oxc parses them
const forceJsx = () => ({
  name: 'force-jsx',
  enforce: 'pre',
  async transform(code, id) {
    if (id.endsWith('.js') && !id.includes('node_modules')) {
      // Spoof the filename extension so oxc automatically enables JSX parsing
      return transformWithOxc(code, id.replace(/\.js$/, '.jsx'));
    }
  }
});

export default defineConfig({
  plugins: [forceJsx(), react({ include: "**/*.{jsx,js}" })],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
  },
  define: {
    // Mock global variables that some React Native libraries expect
    global: 'window',
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});