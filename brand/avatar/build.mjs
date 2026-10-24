// Аватар ST96 для Instagram/соцсетей: салатовый фон + чёрный знак, как на обороте визитки Дмитрия.
// Знак — кривые из Unbounded ExtraBold (не текст), поэтому SVG/PNG одинаково чёткие в любом размере.
// Instagram показывает аватар кругом — знак вписан в круг с запасом (проверка: circle-preview.png).
// Запуск: node build.mjs   (нужны Google Chrome и print/business-cards/node_modules — npm install там)
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'

const dir = new URL('.', import.meta.url).pathname
const require = createRequire(dir + '../../print/business-cards/package.json')
const opentype = require('opentype.js')
const font = opentype.loadSync(dir + '../../print/business-cards/fonts/Unbounded-ExtraBold.ttf')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const SIDE = 1080, ACID = '#d8ff3f', INK = '#09090b', LS = -0.04 // межбуквенный, как у крупного знака на визитке

// Путь строки, отцентрованный по реальному контуру букв (а не по ширине набора)
const glyphs = (txt, size) => font.getPath(txt, 0, 0, size, { kerning: true, letterSpacing: LS })
const fit = (txt, width) => { const b = glyphs(txt, 100).getBoundingBox(); return 100 * width / (b.x2 - b.x1) }

const variants = {
  // В строку: ширина знака 68% стороны
  inline: () => {
    const size = fit('ST96', SIDE * 0.68), b = glyphs('ST96', size).getBoundingBox()
    const dx = (SIDE - (b.x2 - b.x1)) / 2 - b.x1, dy = (SIDE - (b.y2 - b.y1)) / 2 - b.y1
    return { d: glyphs('ST96', size).toPathData(2), dx, dy, box: [b.x2 - b.x1, b.y2 - b.y1] }
  },
  // Два этажа ST / 96: ширина 50% стороны, строки выровнены по левому краю, как на визитке Карины — но по центру кадра
  stacked: () => {
    const size = fit('ST', SIDE * 0.5), gap = size * 0.1
    const st = glyphs('ST', size).getBoundingBox(), n96 = glyphs('96', size).getBoundingBox()
    const w = Math.max(st.x2 - st.x1, n96.x2 - n96.x1)
    const h1 = st.y2 - st.y1, h2 = n96.y2 - n96.y1, h = h1 + gap + h2
    const top = (SIDE - h) / 2, left = (SIDE - w) / 2
    const p1 = font.getPath('ST', left - st.x1 + (w - (st.x2 - st.x1)), top - st.y1, size, { kerning: true, letterSpacing: LS })
    const p2 = font.getPath('96', left - n96.x1 + (w - (n96.x2 - n96.x1)), top + h1 + gap - n96.y1, size, { kerning: true, letterSpacing: LS })
    return { d: p1.toPathData(2) + p2.toPathData(2), dx: 0, dy: 0, box: [w, h] }
  },
}

const run = (args) => execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', ...args], { stdio: 'ignore' })
const report = []
for (const [name, make] of Object.entries(variants)) {
  const v = make()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIDE} ${SIDE}" width="${SIDE}" height="${SIDE}">
  <rect width="${SIDE}" height="${SIDE}" fill="${ACID}"/>
  <path fill="${INK}" transform="translate(${v.dx.toFixed(2)} ${v.dy.toFixed(2)})" d="${v.d}"/>
</svg>`
  fs.writeFileSync(`${dir}ST96_avatar_${name}.svg`, svg)
  const html = `${dir}.tmp-${name}.html`
  fs.writeFileSync(html, `<!doctype html><html><body style="margin:0">${svg}</body></html>`)
  run([`--window-size=${SIDE},${SIDE}`, '--force-device-scale-factor=1', `--screenshot=${dir}ST96_avatar_${name}_1080.png`, `file://${html}`])
  fs.rmSync(html)
  // Вписанность в круг: половина диагонали рамки знака относительно радиуса
  report.push(`${name}: знак ${v.box.map((x) => Math.round(x)).join('×')} px, до края круга ${Math.round(100 * Math.hypot(v.box[0] / 2, v.box[1] / 2) / (SIDE / 2))}% радиуса`)
}

// Превью, как это выглядит кружком в профиле
const prev = `${dir}.tmp-prev.html`
fs.writeFileSync(prev, `<!doctype html><html><body style="margin:0;background:#fafafa;font:600 22px Inter,system-ui;display:flex;gap:60px;padding:50px;color:#262626">
${Object.keys(variants).map((n) => `<div style="text-align:center"><img src="ST96_avatar_${n}.svg" style="width:300px;height:300px;border-radius:50%;display:block;border:1px solid #dbdbdb"><p>${n === 'inline' ? 'В строку' : 'Два этажа'}</p>
<div style="display:flex;gap:16px;justify-content:center;align-items:center"><img src="ST96_avatar_${n}.svg" style="width:56px;border-radius:50%"><img src="ST96_avatar_${n}.svg" style="width:32px;border-radius:50%"></div></div>`).join('')}
</body></html>`)
run(['--window-size=820,540', '--force-device-scale-factor=2', `--screenshot=${dir}circle-preview.png`, `file://${prev}`])
fs.rmSync(prev)
console.log(report.join('\n'))
