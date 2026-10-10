import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // pdf.js non va pre-processato in sviluppo (altrimenti il rendering delle pagine si blocca)
  optimizeDeps: { exclude: ['pdfjs-dist'] },
  test: { environment: 'node' },
})
