import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import path from 'path';

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: 3000,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true
      }
    }
  },
  build: {
    target: 'ES2022',
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    reportCompressedSize: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@boot': path.resolve(__dirname, './src/boot'),
      '@core': path.resolve(__dirname, './src/core'),
      '@services': path.resolve(__dirname, './src/services'),
      '@shell': path.resolve(__dirname, './src/shell'),
      '@usr': path.resolve(__dirname, './src/usr'),
      '@include': path.resolve(__dirname, './src/include'),
      '@theme': path.resolve(__dirname, './src/theme'),
      '@dev': path.resolve(__dirname, './src/dev')
    }
  }
});
