
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  appType: 'spa', // 👈 fuerza a que Vite sirva index.html en rutas desconocidas
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '127.0.0.1+3-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '127.0.0.1+3.pem')),
    },
    proxy: {
      '/api': {
        target: 'https://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: path => path.replace(/^\/api/, '')
      }
    }
  },
  plugins: [react()],
})
