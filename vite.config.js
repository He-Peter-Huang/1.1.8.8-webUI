import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/1.1.8.8-webUI/',
  plugins: [vue(), tailwindcss()],
})
