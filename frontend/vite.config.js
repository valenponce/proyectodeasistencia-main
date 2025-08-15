/*import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Eliminar el proxy completamente
  }
})
*/

/*export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // ← permite que otros dispositivos accedan
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://192.168.100.11:5000', // ← reemplazá con tu IP real
        changeOrigin: true,
        secure: false,
      },
    },
  },
})*/

/*export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://192.168.100.11:5000',
        changeOrigin: true,
        secure: false,
        rewrite: path => path.replace(/^\/api/, '') // elimina /api al redirigir
      }
    }
  }
})*/

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '192.168.100.11-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '192.168.100.11.pem')),
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      }
    }
  },
  plugins: [react()]
})

