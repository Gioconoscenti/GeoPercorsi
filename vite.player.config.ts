// Costruisce il "player" autonomo (un unico file HTML) usato per l'export per gli alunni.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    outDir: 'public/player',
    emptyOutDir: true,
    rollupOptions: { input: 'player.html' },
  },
})
