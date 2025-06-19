import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  base: './', // ✅ makes asset paths relative
  plugins: [vue()],
  build: {
    minify: false, // temporarily disable
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

})
