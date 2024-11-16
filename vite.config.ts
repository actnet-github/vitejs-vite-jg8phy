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
            // Cookieをプロキシリクエストに含める
            const cookies = req.headers.cookie;
            if (cookies) {
              proxyReq.setHeader('Cookie', cookies);
            }

            console.log('Sending Request to the Target:', {
              method: proxyReq.method,
              path: proxyReq.path,
              headers: proxyReq.getHeaders()
            });
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // レスポンスCookieを保持
            const cookies = proxyRes.headers['set-cookie'];
            if (cookies) {
              res.setHeader('Set-Cookie', cookies);
            }

            console.log('Received Response from the Target:', {
              statusCode: proxyRes.statusCode,
              headers: proxyRes.headers
            });
          });
        },
      }
    },
    cors: false  // プロキシ側でCORSを処理
  }
});