import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // relative base so the build works under any GitHub Pages project path
  base: './',
  plugins: [react()],
})
