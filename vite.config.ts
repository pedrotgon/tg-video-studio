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
    allowedHosts: true,
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
      // Legacy CSS and third-party components still emit root-relative assets.
      // DramaClaw's Vite base is /criativo/, so root requests must be rewritten
      // before being forwarded; otherwise the browser receives a 404.
      '/brand': { target: 'http://localhost:5174', changeOrigin: true, rewrite: (path) => `/criativo${path}` },
      '/fonts': { target: 'http://localhost:5174', changeOrigin: true, rewrite: (path) => `/criativo${path}` },
      '/images': { target: 'http://localhost:5174', changeOrigin: true, rewrite: (path) => `/criativo${path}` },
      '/locales': { target: 'http://localhost:5174', changeOrigin: true, rewrite: (path) => `/criativo${path}` },
      '/login-cinematic': { target: 'http://localhost:5174', changeOrigin: true, rewrite: (path) => `/criativo${path}` },
      '/petdex': { target: 'http://localhost:5174', changeOrigin: true, rewrite: (path) => `/criativo${path}` },
      '/piko': { target: 'http://localhost:5174', changeOrigin: true, rewrite: (path) => `/criativo${path}` },
      '/video': { target: 'http://localhost:5174', changeOrigin: true, rewrite: (path) => `/criativo${path}` },
      '/viewer-kit': { target: 'http://localhost:5174', changeOrigin: true, rewrite: (path) => `/criativo${path}` },
      '/icons.svg': { target: 'http://localhost:5174', changeOrigin: true, rewrite: (path) => `/criativo${path}` },
      '/version.json': { target: 'http://localhost:5174', changeOrigin: true, rewrite: (path) => `/criativo${path}` },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/tasks': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
