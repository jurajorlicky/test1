import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/test1/',          // <- názov repozitára
  build: { outDir: 'docs' } // <- build výstup do /docs
})
