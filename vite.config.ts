import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { resolve } from 'node:path'

// В разработке адреса /admin/... отдают страницу админки (в проде это делает vercel.json)
const adminFallback = (): Plugin => ({
  name: 'admin-fallback',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const url = req.url ?? ''
      if (/^\/admin(\/|$|\?)/.test(url) && !/\.[a-z0-9]+(\?|$)/i.test(url.split('?')[0])) req.url = '/admin/index.html'
      next()
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), adminFallback()],
  build: {
    rollupOptions: {
      input: { main: resolve(__dirname, 'index.html'), admin: resolve(__dirname, 'admin/index.html') },
    },
  },
})
