import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: { '/api': 'http://localhost:3001' },
    // Permite abrir la aplicacion desde un tunel de Cloudflare para probarla en el telefono.
    allowedHosts: ['.trycloudflare.com'],
  },
  preview: {
    proxy: { '/api': 'http://localhost:3001' },
    allowedHosts: ['.trycloudflare.com'],
  },
})
