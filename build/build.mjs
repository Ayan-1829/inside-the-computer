#!/usr/bin/env node
/* ==========================================================
   build/build.mjs  —  no dependencies, Node 18+
   Generates:
     index.html            the Computer (home) page
     parts/<id>.html       one page per part, with its own title,
                           description, canonical URL, Open Graph tags,
                           JSON-LD and the full panel text pre-rendered
     sitemap.xml, robots.txt, favicon.svg
   Also checks that the other site icons and site.webmanifest are present.
   Usage:   node build/build.mjs
            SITE_URL=https://your.domain/ node build/build.mjs
   The site URL can also be set in build/site.config.json.
   ========================================================== */
import { checkChips } from './check-chips.mjs';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/site.config.json'), 'utf8'));
let SITE = process.env.SITE_URL || cfg.siteUrl;
if (!SITE.endsWith('/')) SITE += '/';

/* Load the same data + panel code the browser uses */
const ctx = vm.createContext({ console });
for (const f of ['js/core.js','js/data/hardware.js','js/data/devices.js','js/data/cpu.js','js/data/i8086.js','js/data/alu.js','js/data/logic.js','js/data/chips.js','js/panel.js'])
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
vm.runInContext('linkTree()', ctx);
const { N, ORDER } = ctx;
const call = (fn, ...a) => ctx[fn](...a);

/* sanity checks: every relation and chip must point at a real part */
const problems = [];
for (const id of ORDER){
  const n = N[id];
  n.rel.forEach(([r]) => { if (!N[r]) problems.push(`${id}: related part "${r}" does not exist`); });
  if (n.chip && !N[n.chip]) problems.push(`${id}: chip "${n.chip}" does not exist`);
}
if (problems.length){ console.error('Data problems:\n  ' + problems.join('\n  ')); process.exit(1); }

/* contrast check: text colours must reach 4.5:1 (WCAG AA) in both themes */
const css = fs.readFileSync(path.join(ROOT, 'css/styles.css'), 'utf8');
const tokens = block => Object.fromEntries([...block.matchAll(/--([\w-]+):(#[0-9A-Fa-f]{6})/g)].map(m => [m[1], m[2]]));
const light = tokens(css.slice(css.indexOf(':root{'), css.indexOf('[data-theme="dark"]{')));
const dark = { ...light, ...tokens(css.slice(css.indexOf('[data-theme="dark"]{'), css.indexOf('*{box-sizing'))) };
const lum = h => { const c = [1,3,5].map(i => parseInt(h.slice(i,i+2),16)/255).map(v => v <= .03928 ? v/12.92 : ((v+.055)/1.055)**2.4); return .2126*c[0] + .7152*c[1] + .0722*c[2]; };
const ratio = (a,b) => { const [x,y] = [lum(a), lum(b)].sort((p,q) => q-p); return (x+.05)/(y+.05); };
const TEXT_PAIRS = [['ink','surface'],['ink-2','surface'],['ink-3','surface'],['ink-3','bg'],['accent','surface'],['out','surface'],['lbl-ink','lbl-bg'],
  ['i-text','i-panel'],['i-text','i-block'],['i-text','i-case'],['i-text','i-metal'],['i-text','i-metal-lt'],['i-text-mut','i-panel'],['i-text-mut','i-block'],
  ['i-text-mut','i-case'],['i-text-mut','surface'],['i-text-inv','i-board'],['i-text-inv','i-chip'],['i-text-inv','i-metal-2'],['i-text-inv','i-screen'],['i-die-text','i-die-block'],
  ['on-accent','accent'],['lbl-hi','surface'],['lbl-hi-inv','i-board'],['pin-in','surface'],['pin-out','surface'],['pin-bi','surface'],['pin-pwr','surface'],['pin-nc','surface'],['pin-in','bg'],['pin-out','bg'],
  ['i-text','g-panel-a'],['i-text','g-panel-b'],['i-text','g-block-a'],['i-text','g-block-b'],['i-text-mut','g-panel-b'],['i-text-mut','g-block-b'],
  ['ink','g-panel-b'],['ink-2','g-panel-b'],['ink-3','g-panel-b'],['ink-3','g-stage-b'],['ink-3','g-stage-c'],
  ['on-accent','g-on-a'],['on-accent','g-on-b'],['i-text-inv','g-board-a'],['i-text-inv','g-board-b'],['accent','g-panel-b']];
const weak = [];
for (const [name, t] of [['light', light], ['dark', dark]])
  for (const [a,b] of TEXT_PAIRS){ const r = ratio(t[a], t[b]); if (r < 4.5) weak.push(`${name}: --${a} on --${b} is ${r.toFixed(2)}:1`); }
if (weak.length) console.warn('Contrast warnings (text should be at least 4.5:1):\n  ' + weak.join('\n  '));

const chipErrors = checkChips(ROOT);
if (chipErrors.length){ console.error('Chip definition errors:\n  ' + chipErrors.join('\n  ')); process.exit(1); }

/* site icons: static files kept in the project root (see README, "Site icons") */
const ICONS = ['favicon.svg','favicon.ico','favicon-16x16.png','favicon-32x32.png','apple-touch-icon.png','android-chrome-192x192.png','android-chrome-512x512.png','maskable-512x512.png','site.webmanifest'];
const missingIcons = ICONS.filter(f => f !== 'favicon.svg' && !fs.existsSync(path.join(ROOT, f)));
if (missingIcons.length) console.warn('Missing icon files (browsers will fall back to favicon.svg): ' + missingIcons.join(', '));
fs.writeFileSync(path.join(ROOT, 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#16654F"/><rect x="14" y="14" width="36" height="36" rx="5" fill="#0D0D0D"/><path d="M24 8v6M32 8v6M40 8v6M24 50v6M32 50v6M40 50v6M8 24h6M8 32h6M8 40h6M50 24h6M50 32h6M50 40h6" stroke="#0D0D0D" stroke-width="3" stroke-linecap="round"/><text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-size="17" font-weight="800" letter-spacing="-.5" font-family="Arial, sans-serif" fill="#E39A12">AS</text></svg>\n`);

const tpl = fs.readFileSync(path.join(ROOT, 'build/template.html'), 'utf8');
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const BASE_KEYWORDS = 'how a computer works, computer architecture, logic gates, interactive learning';

/* A short hash of the icon files' own bytes, appended to every icon/manifest
   link as ?v=. Browsers cache favicons very aggressively (sometimes for the
   life of the profile), so without this a changed icon can keep showing the
   old one indefinitely; this changes automatically whenever an icon file does. */
const iconHash = crypto.createHash('sha1');
for (const f of ICONS) { const p = path.join(ROOT, f); if (fs.existsSync(p)) iconHash.update(fs.readFileSync(p)); }
const ICON_V = iconHash.digest('hex').slice(0, 8);

function render(id){
  const n = N[id], home = id === 'computer', rootRel = home ? '' : '../';
  const href = t => t === 'computer' ? rootRel + 'index.html' : (home ? 'parts/' : '') + t + '.html';
  const canonical = call('pageURL', id, SITE);
  const keywords = home
    ? 'computer components, parts of a computer, computer architecture, how a CPU works, ALU, arithmetic logic unit, logic gates, truth table, full adder, multiplexer, barrel shifter, flip-flop, 7400 series, RAM, cache, GPU, SSD, power supply, motherboard, digital logic, interactive learning'
    : [n.name, ...n.children.map(c => N[c].name), N[n.parent]?.name, BASE_KEYWORDS].filter(Boolean).join(', ');
  const vals = {
    ROOT: rootRel, SITE, ID: id, LEVEL: String(n.level), HOME: href('computer'), V: ICON_V, YEAR: String(new Date().getFullYear()),
    TITLE: esc(call('metaTitle', id)), DESC: esc(call('metaDesc', id)), KEYWORDS: esc(keywords),
    CANONICAL: canonical, OGTYPE: home ? 'website' : 'article',
    JSONLD: JSON.stringify(call('jsonLD', id, SITE)).replace(/</g,'\\u003c'),
    CRUMBS: call('crumbsHTML', id, href),
    STRIP: call('stripHTML', id, href), PANEL: call('panelHTML', id, href),
    TREE: '<ul>' + call('treeHTML', 'computer', id, href) + '</ul>',
  };
  return tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => { if (!(k in vals)) throw new Error('Unknown placeholder ' + m); return vals[k]; });
}

fs.mkdirSync(path.join(ROOT, 'parts'), { recursive: true });
for (const f of fs.readdirSync(path.join(ROOT, 'parts'))) if (f.endsWith('.html')) fs.unlinkSync(path.join(ROOT, 'parts', f));
for (const id of ORDER){
  const out = id === 'computer' ? 'index.html' : `parts/${id}.html`;
  fs.writeFileSync(path.join(ROOT, out), render(id));
}

const today = new Date().toISOString().slice(0,10);
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  ORDER.map(id => `  <url><loc>${call('pageURL', id, SITE)}</loc><lastmod>${today}</lastmod><priority>${id === 'computer' ? '1.0' : (Math.max(0.4, 1 - N[id].level*0.12)).toFixed(1)}</priority></url>`).join('\n') +
  '\n</urlset>\n');
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);

console.log(`Built ${ORDER.length} pages for ${SITE}`);
