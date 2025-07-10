import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/test1/', // <-- názov repozitára, dôležité!
  build: {
    outDir: 'docs', // <-- build do docs, nie dist
    target: 'esnext'
  }
})
