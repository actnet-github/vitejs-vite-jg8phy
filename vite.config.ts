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
    proxy: {
      '/rcms-api': {
        target: 'https://qiss-nwes.g.kuroco.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/rcms-api/, '/rcms-api'),
        headers: {
          'Origin': 'https://qiss-nwes.g.kuroco.app',
          'Referer': 'https://qiss-nwes.g.kuroco.app'
        },
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', {
              method: proxyReq.method,
              path: proxyReq.path,
              headers: proxyReq.getHeaders()
            });
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', {
              statusCode: proxyRes.statusCode,
              headers: proxyRes.headers
            });
          });
        },
      }
    },
    cors: {
      origin: 'https://qiss-nwes.g.kuroco.app',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'x-rcms-api-access-token',
        'X-Request-ID',
        'Origin',
        'Accept',
      ],
    }
  }
});