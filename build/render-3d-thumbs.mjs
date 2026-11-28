#!/usr/bin/env node
/* ==========================================================
   build/render-3d-thumbs.mjs
   Makes the small 3D previews shown at the top left of a part's
   picture (js/model3d.js): one still of each 3D model, as the 3D
   view first shows it, saved as img/3d/<id>.webp (transparent).
   Run it again after changing a model in js/3d/.
   Needs playwright-core and a Chromium it can use:
     PLAYWRIGHT_CORE=/path/to/node_modules/playwright-core \
     PLAYWRIGHT_BROWSERS_PATH=~/Library/Caches/ms-playwright node build/render-3d-thumbs.mjs
   ========================================================== */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const W = 400, H = 300;                       /* twice the size shown, for sharp screens */

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(path.join(ROOT, p), (e, d) => { if (e){ r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); r.end(d); });
}).listen(0);
const port = server.address().port;

const src = fs.readFileSync(path.join(ROOT, 'js/3d/models.js'), 'utf8');
const ids = src.match(/const BUILD = \{([^}]*)\}/)[1].split(',').map(k => k.split(':')[0].trim().replace(/'/g, '')).filter(Boolean)
  .filter(id => id !== 'computer');           /* the home page has no preview */

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
await page.route(/fonts\.(googleapis|gstatic)|workers\.dev/, r => r.abort());
await page.goto(`http://localhost:${port}/build/template.html`, { waitUntil: 'domcontentloaded' }).catch(() => {});
fs.mkdirSync(path.join(ROOT, 'img/3d'), { recursive: true });
for (const id of ids){
  const url = await page.evaluate(async ({ id, W, H }) => {
    if (!window.__v){
      const mod = await import('/js/3d/viewer.js');
      const host = document.createElement('div'); host.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px`;
      const labels = document.createElement('div'); host.appendChild(labels); document.body.appendChild(host);
      window.__v = mod.createViewer(host, labels, { reduce: () => true, nameOf: x => x, onLabel(){}, onAuto(){}, onOpen(){} });
    }
    window.__v.show(id);
    return window.__v.snapshot(W, H);
  }, { id, W, H });
  const buf = Buffer.from(url.split(',')[1], 'base64');
  fs.writeFileSync(path.join(ROOT, 'img/3d', id + '.webp'), buf);
  console.log(id.padEnd(14), (buf.length / 1024).toFixed(1) + ' KB');
}
await browser.close(); server.close();
