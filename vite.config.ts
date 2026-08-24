import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // The creative studio is served by DramaClaw behind the TG origin.
      // Rewriting only at the dev proxy keeps localhost:5174 invisible to the browser.
      '/criativo': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        ws: true,
      },
      '/api/v1': {
        target: 'http://localhost:8780',
        changeOrigin: true,
        ws: true,
      },
      '/static': {
        target: 'http://localhost:8780',
        changeOrigin: true,
      },
      '/brand': { target: 'http://localhost:5174', changeOrigin: true },
      '/fonts': { target: 'http://localhost:5174', changeOrigin: true },
      '/images': { target: 'http://localhost:5174', changeOrigin: true },
      '/locales': { target: 'http://localhost:5174', changeOrigin: true },
      '/login-cinematic': { target: 'http://localhost:5174', changeOrigin: true },
      '/petdex': { target: 'http://localhost:5174', changeOrigin: true },
      '/piko': { target: 'http://localhost:5174', changeOrigin: true },
      '/video': { target: 'http://localhost:5174', changeOrigin: true },
      '/viewer-kit': { target: 'http://localhost:5174', changeOrigin: true },
      '/icons.svg': { target: 'http://localhost:5174', changeOrigin: true },
      '/version.json': { target: 'http://localhost:5174', changeOrigin: true },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
