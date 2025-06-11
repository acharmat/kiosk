import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174, // or any free port (e.g., 3000, 5175)
    host: '127.0.0.1' // more reliable than 'localhost'
  }
})
