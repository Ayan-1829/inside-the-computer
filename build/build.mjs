#!/usr/bin/env node
/* ==========================================================
   build/build.mjs  —  no dependencies, Node 18+
   Generates:
     index.html            the Computer (home) page
     parts/<id>.html       one page per part, with its own title,
                           description, canonical URL, Open Graph tags,
                           JSON-LD and the full panel text pre-rendered
     sitemap.xml, robots.txt, favicon.svg
   Usage:   node build/build.mjs
            SITE_URL=https://your.domain/ node build/build.mjs
   The site URL can also be set in build/site.config.json.
   ========================================================== */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/site.config.json'), 'utf8'));
let SITE = process.env.SITE_URL || cfg.siteUrl;
if (!SITE.endsWith('/')) SITE += '/';

/* Load the same data + panel code the browser uses */
const ctx = vm.createContext({ console });
for (const f of ['js/core.js','js/data/hardware.js','js/data/cpu.js','js/data/alu.js','js/data/logic.js','js/data/chips.js','js/panel.js'])
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

const tpl = fs.readFileSync(path.join(ROOT, 'build/template.html'), 'utf8');
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const BASE_KEYWORDS = 'how a computer works, computer architecture, logic gates, interactive learning';

function render(id){
  const n = N[id], home = id === 'computer', rootRel = home ? '' : '../';
  const href = t => t === 'computer' ? rootRel + 'index.html' : (home ? 'parts/' : '') + t + '.html';
  const canonical = call('pageURL', id, SITE);
  const keywords = home
    ? 'computer components, parts of a computer, computer architecture, how a CPU works, ALU, arithmetic logic unit, logic gates, truth table, full adder, multiplexer, barrel shifter, flip-flop, 7400 series, RAM, cache, GPU, SSD, power supply, motherboard, digital logic, interactive learning'
    : [n.name, ...n.children.map(c => N[c].name), N[n.parent]?.name, BASE_KEYWORDS].filter(Boolean).join(', ');
  const vals = {
    ROOT: rootRel, SITE, ID: id, HOME: href('computer'),
    TITLE: esc(call('metaTitle', id)), DESC: esc(call('metaDesc', id)), KEYWORDS: esc(keywords),
    CANONICAL: canonical, OGTYPE: home ? 'website' : 'article',
    JSONLD: JSON.stringify(call('jsonLD', id, SITE)).replace(/</g,'\\u003c'),
    CRUMBS: call('crumbsHTML', id, href), DEPTH: call('depthHTML', n.level),
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
fs.writeFileSync(path.join(ROOT, 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#16654F"/><rect x="18" y="18" width="28" height="28" rx="4" fill="#EDF0EC"/><path d="M24 10v8M32 10v8M40 10v8M24 46v8M32 46v8M40 46v8M10 24h8M10 32h8M10 40h8M46 24h8M46 32h8M46 40h8" stroke="#EDF0EC" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="32" r="5" fill="#E39A12"/></svg>\n`);

console.log(`Built ${ORDER.length} pages for ${SITE}`);
