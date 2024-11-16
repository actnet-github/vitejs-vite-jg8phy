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
        secure: true,
        credentials: true,
        configure: (proxy, options) => {
          // プロキシインスタンスの設定をカスタマイズ
        },
        headers: {
          // プロキシリクエストに追加するヘッダー
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
        },
      },
    },
  },
  cors: {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'x-rcms-api-access-token',
      'X-Request-ID',
    ],
  },
});
