import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/hubs': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: '../backend/wwwroot',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router') ||
              id.includes('scheduler')
            ) {
              return 'vendor-react';
            }
            if (id.includes('@radix-ui') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'vendor-ui';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('@microsoft/signalr')) {
              return 'vendor-signalr';
            }
          }
        },
      },
    },
  },
})
