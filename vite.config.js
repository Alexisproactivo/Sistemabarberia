import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' para que funcione en GitHub Pages en cualquier subruta
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
        },
      },
    },
  },
})
