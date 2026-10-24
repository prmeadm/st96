import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { resolve } from 'node:path'
import { existsSync, mkdirSync, renameSync, rmSync, readdirSync } from 'node:fs'

// Страницы лежат в site/ и crm/, а в проде отдаются по прежним адресам (/, /admin, /book).
const pages = {
  main: { src: 'site/index.html', out: 'index.html' },
  admin: { src: 'crm/admin/index.html', out: 'admin/index.html' },
  book: { src: 'crm/book/index.html', out: 'book/index.html' },
}

const hasExt = (url: string) => /\.[a-z0-9]+$/i.test(url.split('?')[0])

// В разработке адреса /admin/... и /book отдают свои страницы, остальное — сайт (в проде это делает vercel.json)
const devRoutes = (): Plugin => ({
  name: 'dev-routes',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const url = req.url ?? ''
      if (hasExt(url) || /^\/(@|node_modules|__)/.test(url)) return next()
      if (/^\/admin(\/|$|\?)/.test(url)) req.url = '/crm/admin/index.html'
      else if (/^\/book(\/|$|\?)/.test(url)) req.url = '/crm/book/index.html'
      else req.url = '/site/index.html'
      next()
    })
  },
})

// После сборки кладём страницы на прежние места в dist: /index.html, /admin/index.html, /book/index.html
const flattenPages = (): Plugin => {
  let outDir = ''
  return {
    name: 'flatten-pages',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      for (const { src, out } of Object.values(pages)) {
        const from = resolve(outDir, src)
        if (!existsSync(from)) continue
        const to = resolve(outDir, out)
        mkdirSync(resolve(to, '..'), { recursive: true })
        renameSync(from, to)
      }
      for (const dir of ['site', 'crm']) {
        const full = resolve(outDir, dir)
        if (existsSync(full) && !hasFiles(full)) rmSync(full, { recursive: true })
      }
    },
  }
}

const hasFiles = (dir: string): boolean =>
  readdirSync(dir, { withFileTypes: true }).some((e) => (e.isDirectory() ? hasFiles(resolve(dir, e.name)) : true))

// https://vite.dev/config/
export default defineConfig({
  publicDir: 'site/public',
  plugins: [react(), tailwindcss(), devRoutes(), flattenPages()],
  build: {
    rollupOptions: {
      input: Object.fromEntries(Object.entries(pages).map(([k, v]) => [k, resolve(__dirname, v.src)])),
    },
  },
})
