import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    open: true,
    allowedHosts: ["beta.homelabinator.com"]
  },
  build: {
    outDir: 'dist'
  }
})
