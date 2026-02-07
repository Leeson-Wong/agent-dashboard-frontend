import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'shared'),
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: true
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
})
