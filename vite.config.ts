import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  server: {
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 3000,
    open: true,
    allowedHosts: ["beta.homelabinator.com", "homelabinator.com"]
  },
  build: {
    outDir: 'dist'
  },
  define: {
    'process.env.ENV_NAME': JSON.stringify(process.env.ENV_NAME)
  },
  plugins: [
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        if (process.env.ENV_NAME === 'prod') {
          return html.replace(
            '</head>',
            `  <script defer src="/assets/script.js" data-website-id="bc26115b-5c1c-4edf-a12b-6bd60ec8e182" data-host-url="https://umami.homelabinator.com" ></script>\n</head>`
          )
        }
        return html
      }
    }
  ]
})
