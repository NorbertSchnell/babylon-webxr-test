import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3443,
    https: true,
    host: '192.168.178.23',
  },
})
