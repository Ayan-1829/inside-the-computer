/* ==========================================================
   engine.js
   Navigation, zoom transitions, hover/tooltip, panel updates,
   routing and page metadata. Runs after all data and scene files.
   Routing: on http(s) every part has a real URL (parts/<id>.html)
   and the History API is used; when opened from disk (file://)
   it falls back to #/<id> hashes.
   ========================================================== */
(function(){
linkTree();

const $ = s => document.querySelector(s);
const html = document.documentElement;
html.classList.add('js');
const stage = $('#stage'), layersEl = $('#layers'), panel = $('#panel'), inner = $('#panel-inner'), tip = $('#tip'),
      crumbsEl = $('#crumbs'), scroller = $('#scroller'), zoomBtn = $('#btn-zoom'), hintEl = $('#hint'), tools = $('#stage-tools'), announce = $('#announce'), stripEl = $('#strip');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const coarse = matchMedia('(pointer: coarse)');
const HTTP = /^https?:$/.test(location.protocol);
const ROOT = new URL(html.dataset.root || './', location.href);
const SITE = html.dataset.site || ROOT.href;
let cur = null, curOwner = null, layer = null, sceneFocus = null;
const LASTKEY = {}, LIVE = {};

const urlFor = id => new URL(id === 'computer' ? (HTTP ? './' : 'index.html') : `parts/${id}.html`, ROOT).href;
const canonicalFor = id => SITE + (id === 'computer' ? '' : `parts/${id}.html`);

/* called by scenes */
window.syncTable = function(id, key){
  LASTKEY[id] = key;
  if (cur !== id) return;
  inner.querySelectorAll('tr[data-row]').forEach(r => r.classList.toggle('on', r.dataset.row === key));
};
window.setLive = function(key, h){
  LIVE[key] = h;
  document.querySelectorAll(`[data-live="${key}"]`).forEach(e => e.innerHTML = h);
};

/* ---------- layers & zoom ---------- */
function buildLayer(ownId){
  const n = N[ownId], sc = SCENES[n.scene](n);
  if (sc.html !== undefined){                          /* HTML scene (e.g. the 8086 emulator) */
    const div = document.createElement('div');
    div.className = 'layer scene html-scene';
    div.setAttribute('role','group');
    div.setAttribute('aria-label', n.name + ', interactive');
    div.innerHTML = sc.html;
    return {svg: div, init: sc.init, drag: false, focus: sc.focus};
  }
  const svg = document.createElementNS(SVGNS,'svg');
  svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink');
  svg.setAttribute('viewBox','0 0 ' + (sc.vb || [1000,700]).join(' '));   /* scenes may be wider than 1000 */
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  svg.setAttribute('class','layer scene');
  svg.setAttribute('role','group');
  svg.setAttribute('aria-label', n.name + ', interactive diagram');
  svg.innerHTML = sc.svg;
  return {svg, init: sc.init, drag: !!sc.drag, focus: sc.focus};
}
/* Transform that makes `target` fill the visible stage. The layer scales about its own
   centre, which differs from the visible centre when the diagram is magnified and scrolled. */
function zoomTo(target, lay){
  const sr = scroller.getBoundingClientRect(), lr = lay.getBoundingClientRect(), r = target.getBoundingClientRect();
  const s = Math.max(1.5, Math.min(6, Math.min(sr.width/Math.max(r.width,1), sr.height/Math.max(r.height,1)) * .75));
  const cx = lr.left + lr.width/2, cy = lr.top + lr.height/2, vx = sr.left + sr.width/2, vy = sr.top + sr.height/2;
  const tx = vx - cx - s*(r.left + r.width/2 - cx), ty = vy - cy - s*(r.top + r.height/2 - cy);
  /* translateZ(0) keeps the layer on its own GPU-composited surface through
     this inline transform too -- an inline style completely replaces the
     CSS transform (it doesn't merge with it), so without this the CSS
     translateZ(0) hint above would quietly disappear for exactly the zoom
     transitions where mobile browsers most need it */
  return `translate(${tx}px, ${ty}px) scale(${s}) translateZ(0)`;
}
function findHot(svg, id, stopAt){
  let n = N[id];
  while (n && n.id !== stopAt){ const el = svg.querySelector(`.hot[data-id="${n.id}"]`); if (el) return el; n = N[n.parent]; }
  return null;
}
function swapLayer(own, animate){
  const old = layer, oldOwn = curOwner;
  selectedEl = null;
  layersEl.querySelectorAll('.leaving').forEach(e => e.remove());
  if (panelAuto && own !== oldOwn) requestWide(false);          /* give back a panel that a wide scene hid */
  const {svg, init, drag, focus} = buildLayer(own);
  sceneFocus = focus || null;
  stage.classList.toggle('is-html', svg.tagName !== 'svg');   /* HTML scenes (the 8086 emulator) size themselves */
  if (!old || !animate){
    if (old) old.remove();
    layersEl.appendChild(svg);
  } else {
    const dir = own === oldOwn ? 'fade' : isAncestor(oldOwn, own) ? 'in' : isAncestor(own, oldOwn) ? 'out' : 'fade';
    if (dir === 'in'){
      const t = findHot(old, own, oldOwn);
      if (t){ t.classList.add('sel'); old.classList.add('zooming'); old.style.transform = zoomTo(t, old); }
      old.classList.add('leaving'); old.style.opacity = '0';
      svg.classList.add('enter-in');
      layersEl.appendChild(svg);
    } else if (dir === 'out'){
      svg.style.transition = 'none'; svg.style.opacity = '0';
      layersEl.appendChild(svg);
      const t = findHot(svg, oldOwn, own);
      if (t) svg.style.transform = zoomTo(t, svg);
      old.classList.add('leaving','leave-out');
      svg.getBoundingClientRect();
      svg.style.transition = '';
      requestAnimationFrame(() => requestAnimationFrame(() => { svg.style.transform = ''; svg.style.opacity = ''; }));
    } else {
      old.classList.add('leaving','leave-fade');
      svg.classList.add('enter-fade');
      layersEl.appendChild(svg);
    }
    svg.getBoundingClientRect();
    setTimeout(() => old.remove(), 700);
  }
  layer = svg; curOwner = own;
  /* everything below reads or writes the DOM, and for a scene-heavy diagram
     it can take longer than a single frame -- profiling on a throttled
     mobile CPU found this exact block blocking the main thread for over
     100ms right after the new layer was inserted. A single requestAnimationFrame
     wasn't enough to dodge it: that callback runs in the *same* frame as the
     rAF below that starts the crossfade (both get queued in this same tick),
     so the heavy work still delayed that frame's paint by as much as before --
     it just moved the freeze from "before insertion" to "after insertion,
     before the fade is visible". Chaining it with setTimeout(...,0) off the
     back of the class-removal rAF instead lets that frame paint the fade's
     first step *before* this work ever runs. */
  const settle = () => {
    if (init) init(svg, N[own]);
    if (drag) restoreOffsets(svg, own);
    tools.classList.toggle('show', drag && hasOffsets(own));
    svg.dataset.drag = drag ? '1' : '';
    centerScroll();
  };
  if (animate && old){
    requestAnimationFrame(() => requestAnimationFrame(() => {
      svg.classList.remove('enter-in','enter-fade');
      setTimeout(settle, 0);
    }));
  } else settle();
  setTimeout(() => padTargets(svg), animate ? 720 : 0);
}
/* Set (only) by a direct click/Enter on a specific hotspot, so that when several
   hotspots share one id (one logical part drawn as several disjoint boxes, e.g.
   the 8086 ALU's A/B/Result/high rows), focusing rings just the one actually
   picked instead of every box that shares its id. Anything that navigates
   without a specific origin (tree, breadcrumbs, history) still rings all of them. */
let focusOrigin = null;
function applyFocus(){
  const svg = layer;
  if (sceneFocus){ sceneFocus(svg, cur); if (svg.tagName !== 'svg') return; }
  svg.classList.remove('focus-mode');
  svg.querySelectorAll('.focused,.focus-anc').forEach(e => e.classList.remove('focused','focus-anc'));
  svg.querySelectorAll('.lbl.focused').forEach(e => e.classList.remove('focused'));
  if (cur === curOwner || cur === 'power-button') return;
  let n = N[cur], els = [], first = true;
  while (n && n.id !== curOwner){
    els = (first && focusOrigin && focusOrigin.dataset.id === n.id && svg.contains(focusOrigin))
      ? [focusOrigin] : [...svg.querySelectorAll(`.hot[data-id="${n.id}"]`)];
    if (els.length) break;
    n = N[n.parent]; first = false;
  }
  if (!els.length) return;
  svg.classList.add('focus-mode');
  els.forEach(e => { e.classList.add('focused'); let p = e.parentElement.closest('.hot'); while (p){ p.classList.add('focus-anc'); p = p.parentElement.closest('.hot'); } });
  svg.querySelectorAll(`.lbl[data-for="${els[0].dataset.id}"]`).forEach(l => l.classList.add('focused'));
  if (stage.classList.contains('magnified')){
    const r = els[0].getBoundingClientRect(), sr = scroller.getBoundingClientRect();
    scroller.scrollBy({left: (r.left + r.width/2) - (sr.left + sr.width/2), behavior: reduce.matches ? 'auto' : 'smooth'});
  }
}

/* ---------- magnified diagram on phones ---------- */
function centerScroll(){
  if (!stage.classList.contains('magnified')) return;
  /* a scene can ask to start at its left edge (the 8086 ALU keeps its operations there) */
  scroller.scrollLeft = layer && layer.dataset.scrollStart === 'left' ? 0 : (scroller.scrollWidth - scroller.clientWidth) / 2;
}
zoomBtn.addEventListener('click', () => {
  const on = stage.classList.toggle('magnified');
  zoomBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  zoomBtn.querySelector('span').textContent = on ? 'Fit diagram' : 'Zoom diagram';
  setTimeout(() => padTargets(layer), 350);
  requestAnimationFrame(() => { centerScroll(); padTargets(layer); });
});

/* ---------- full screen (like a video player's own fullscreen button) ---------- */
const fsBtn = $('#btn-fullscreen');
if (fsBtn){
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  const canFs = stage.requestFullscreen || stage.webkitRequestFullscreen;
  if (!canFs) fsBtn.hidden = true;
  else {
    const EXPAND = 'M7 3H4a1 1 0 0 0-1 1v3M13 3h3a1 1 0 0 1 1 1v3M17 13v3a1 1 0 0 1-1 1h-3M3 13v3a1 1 0 0 0 1 1h3';
    const COMPRESS = 'M8 3v3a1 1 0 0 1-1 1H4M12 3v3a1 1 0 0 0 1 1h3M8 17v-3a1 1 0 0 0-1-1H4M12 17v-3a1 1 0 0 1 1-1h3';
    const stageNav = $('#stage-nav');
    const syncFs = () => { const on = fsEl() === stage;
      fsBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      fsBtn.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
      fsBtn.querySelector('[data-fs-icon]').innerHTML = `<path d="${on ? COMPRESS : EXPAND}"/>`;
      if (stageNav) stageNav.classList.toggle('show', on);
      requestAnimationFrame(() => { centerScroll(); padTargets(layer); }); };
    fsBtn.addEventListener('click', () => {
      if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else (stage.requestFullscreen || stage.webkitRequestFullscreen).call(stage);
    });
    document.addEventListener('fullscreenchange', syncFs);
    document.addEventListener('webkitfullscreenchange', syncFs);
  }
  $('#btn-back-fs')?.addEventListener('click', () => $('#btn-back').click());
  $('#btn-home-fs')?.addEventListener('click', () => $('#btn-home').click());
}

/* ---------- touch targets: make every control at least 44 CSS px ---------- */
function padTargets(svg){
  if (!svg || !svg.isConnected || svg.tagName !== 'svg') return;
  svg.querySelectorAll('.tap-pad').forEach(e => e.remove());
  if (!coarse.matches && innerWidth > 600) return;
  const m = svg.getScreenCTM(); if (!m) return;
  const k = m.a, min = 44 / k;
  /* every visible target and its own box */
  const items = [];
  svg.querySelectorAll('.ctl, .hot, .bitc[data-k], .bitc[role]').forEach(el => {
    let b; try { b = el.getBBox(); } catch(_) { return; }
    if (!b.width || !b.height || !el.getClientRects().length) return;
    items.push({el, b});
  });
  /* Grow small targets to about 44 px, but never over a neighbouring target:
     a gap between two targets is split down the middle. */
  items.forEach(it => {
    const b = it.b;
    if (b.width >= min && b.height >= min) return;
    let x0 = b.x - Math.max(0, min - b.width)/2, x1 = b.x + b.width + Math.max(0, min - b.width)/2;
    let y0 = b.y - Math.max(0, min - b.height)/2, y1 = b.y + b.height + Math.max(0, min - b.height)/2;
    items.forEach(o => {
      if (o === it || o.el.contains(it.el) || it.el.contains(o.el)) return;
      const c = o.b, ovX = c.x < b.x + b.width && c.x + c.width > b.x, ovY = c.y < b.y + b.height && c.y + c.height > b.y;
      const hitsPad = c.x < x1 && c.x + c.width > x0 && c.y < y1 && c.y + c.height > y0;
      if (!hitsPad) return;
      if (ovY && c.x >= b.x + b.width) x1 = Math.min(x1, (b.x + b.width + c.x) / 2);
      else if (ovY && c.x + c.width <= b.x) x0 = Math.max(x0, (c.x + c.width + b.x) / 2);
      else if (ovX && c.y >= b.y + b.height) y1 = Math.min(y1, (b.y + b.height + c.y) / 2);
      else if (ovX && c.y + c.height <= b.y) y0 = Math.max(y0, (c.y + c.height + b.y) / 2);
      else if (!ovX && !ovY){          /* diagonal neighbour: trim the axis with the bigger gap */
        const gx = c.x >= b.x + b.width ? c.x - (b.x + b.width) : b.x - (c.x + c.width), gy = c.y >= b.y + b.height ? c.y - (b.y + b.height) : b.y - (c.y + c.height);
        if (gx >= gy){ if (c.x > b.x) x1 = Math.min(x1, (b.x + b.width + c.x) / 2); else x0 = Math.max(x0, (c.x + c.width + b.x) / 2); }
        else { if (c.y > b.y) y1 = Math.min(y1, (b.y + b.height + c.y) / 2); else y0 = Math.max(y0, (c.y + c.height + b.y) / 2); }
      }
    });
    const r = document.createElementNS(SVGNS,'rect');
    r.setAttribute('class','tap-pad'); r.setAttribute('x', x0); r.setAttribute('y', y0);
    r.setAttribute('width', x1 - x0); r.setAttribute('height', y1 - y0);
    it.el.insertBefore(r, it.el.firstChild);
  });
}
window.refreshTapTargets = () => padTargets(layer);
let rsz; addEventListener('resize', () => { clearTimeout(rsz); rsz = setTimeout(() => padTargets(layer), 200); });

/* ---------- navigation ---------- */
/* Back returns to the part you came from (like a browser's back button).
   With nothing to go back to (e.g. a part page opened directly) it goes up one level. */
let trail = [];
function updateBack(){
  const b = $('#btn-back'), prev = trail.length > 1 ? N[trail[trail.length - 2]] : null, up = N[N[cur].parent];
  b.disabled = !prev && !up;
  b.setAttribute('aria-label', prev ? `Go back to ${prev.name}` : up ? `Go up to ${up.name}` : 'Nothing to go back to');
  b.title = prev ? `Back to ${prev.name}` : up ? `Up to ${up.name}` : '';
}
function goBack(){
  if (trail.length > 1) history.back();          /* the popstate/hashchange handler moves the trail back */
  else { const p = N[cur].parent; if (p) go(p); }
}
function go(id, opts = {}){
  if (!N[id]) id = 'computer';
  focusOrigin = opts.from || null;
  if (id === cur && layer) return;
  if (id !== 'power-button') powerStop();
  cur = id;
  const own = ownerOf(id);
  const changingLayer = own !== curOwner;
  const animated = opts.animate !== false && !!layer && !reduce.matches;
  if (changingLayer) swapLayer(own, animated);
  /* renderPanel/crumbs/strip below rebuild a good chunk of DOM (esp. the detail
     panel) -- on a throttled CPU that was enough, on its own, to reproduce the
     exact same crossfade-blocking freeze that swapLayer's settle() used to
     cause, just one level up. Same fix, same reason: when there's an actual
     layer crossfade playing, defer this work behind the same rAF+rAF+setTimeout
     chain so it runs after that frame has painted the fade's first step,
     instead of before it. */
  const rest = () => {
    applyFocus();
    tipPinned = false; hideTip(); setSelected(null);
    renderPanel(id);
    crumbsEl.innerHTML = crumbsHTML(id, urlFor);
    crumbsEl.parentElement.scrollLeft = crumbsEl.parentElement.scrollWidth;
    stripEl.innerHTML = stripHTML(id, urlFor);
    const c = stripEl.querySelector('.cur'); if (c) stripEl.scrollLeft = c.offsetLeft - 40;
    updateMeta(id);
    html.dataset.level = N[id].level;      /* each level of the site has its own hue */
    const oN = N[own];
    hintEl.textContent = hintFor(oN);
    hintEl.hidden = !hintEl.textContent;
  };
  if (changingLayer && animated){
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(rest, 0)));
  } else rest();
  /* the trail of visited parts, kept in step with the browser history */
  if (opts.fromHistory){ if (trail.length > 1 && trail[trail.length - 2] === id) trail.pop(); else trail.push(id); }
  else if (opts.replace || !trail.length) trail = [id];
  else trail.push(id);
  updateBack();
  if (!opts.fromHistory){
    if (HTTP){ const u = urlFor(id); if (u !== location.href) history[opts.replace ? 'replaceState' : 'pushState']({id}, '', u); }
    else if (location.hash.slice(2) !== id && !(opts.replace && id === html.dataset.node)){
      if (opts.replace) history.replaceState({id}, '', '#/' + id); else location.hash = '/' + id;
    }
  }
  announce.textContent = `${N[id].name}. Level ${N[id].level}, ${levelName(N[id])}.`;
}
function hintFor(n){
  const tap = coarse.matches ? 'Tap' : 'Click';
  if (n.scene === 'gate' || n.scene === 'adder' || n.scene === 'mux') return `${tap} the switches to change the inputs`;
  if (n.scene === 'alu') return SIM['alu:mode'] === '8086' ? '' : `${tap} the bits and pick an operation`;
  if (n.scene === 'shifter' || n.scene === 'comparator') return `${tap} the bits to change the numbers`;
  if (n.scene === 'registers') return 'Set the D switches, then press Clock';
  if (n.scene === 'control') return 'Press Next step or Run';
  if (n.scene === 'ic') return CHIPS[n.id].inside ? `${tap} a button to highlight pins, or open Inside the chip` : `${tap} a button to highlight its pins`;
  if (n.scene === 'i8086') return '';
  if (n.scene === 'pc' || n.scene === 'board') return `${tap} a part to open it, or drag it to move it`;
  return `${tap} a part to zoom in`;
}
function renderPanel(id){
  inner.innerHTML = panelHTML(id, urlFor);
  panel.scrollTop = 0;
  inner.querySelectorAll('[data-live]').forEach(e => { if (LIVE[e.dataset.live]) e.innerHTML = LIVE[e.dataset.live]; });
  if (LASTKEY[id] !== undefined) syncTable(id, LASTKEY[id]);
  powerSync();
}
/* looked up once, not re-queried from the whole document on every single
   navigation -- these elements are fixed in the page and never removed */
const METAEL = {
  desc: document.querySelector('meta[name="description"]'),
  canon: document.querySelector('link[rel="canonical"]'),
  ogTitle: document.querySelector('meta[property="og:title"]'),
  ogDesc: document.querySelector('meta[property="og:description"]'),
  ogUrl: document.querySelector('meta[property="og:url"]'),
  twTitle: document.querySelector('meta[name="twitter:title"]'),
  twDesc: document.querySelector('meta[name="twitter:description"]'),
  ld: $('#ld-page'),
};
const setMeta = (e, attr, val) => { if (e) e.setAttribute(attr, val); };
function updateMeta(id){
  const t = metaTitle(id), d = metaDesc(id), u = canonicalFor(id);
  document.title = t;
  setMeta(METAEL.desc,'content',d);
  setMeta(METAEL.canon,'href',u);
  setMeta(METAEL.ogTitle,'content',t); setMeta(METAEL.ogDesc,'content',d); setMeta(METAEL.ogUrl,'content',u);
  setMeta(METAEL.twTitle,'content',t); setMeta(METAEL.twDesc,'content',d);
  if (METAEL.ld) METAEL.ld.textContent = JSON.stringify(jsonLD(id, SITE));
}

/* ---------- draggable parts ----------
   Offsets are stored per drawing in SIM['drag:<owner>'] = {partId: [dx, dy]}
   in the part's own coordinates. Labels for a part move with it. */
let drag = null, suppressClick = false;
const offsetsFor = own => SIM['drag:' + own] || (SIM['drag:' + own] = {});
const hasOffsets = own => Object.values(offsetsFor(own)).some(([x,y]) => Math.abs(x) + Math.abs(y) > 0.5);
function labelScale(wrap){
  const a = wrap.parentNode.getScreenCTM(), b = layer.getScreenCTM();
  return a && b ? a.a / b.a : 1;
}
function setOffset(wrap, dx, dy, save){
  const id = wrap.dataset.drag, k = labelScale(wrap);
  wrap.style.transform = dx || dy ? `translate(${dx}px, ${dy}px)` : '';
  layer.querySelectorAll(`.lbl[data-for="${id}"]`).forEach(l => l.style.transform = dx || dy ? `translate(${dx*k}px, ${dy*k}px)` : '');
  if (save){ offsetsFor(curOwner)[id] = [dx, dy]; }
  const moved = hasOffsets(curOwner) || Math.abs(dx) + Math.abs(dy) > 0.5;
  layer.classList.toggle('moved', moved);
  tools.classList.toggle('show', moved);
}
function restoreOffsets(svg, own){
  const o = offsetsFor(own);
  Object.keys(o).forEach(id => { const w = svg.querySelector(`.dragwrap[data-drag="${id}"]`); if (w){ w.classList.add('dragging');
    const [dx, dy] = o[id]; w.style.transform = `translate(${dx}px, ${dy}px)`; } });
  requestAnimationFrame(() => {
    Object.keys(o).forEach(id => { const w = svg.querySelector(`.dragwrap[data-drag="${id}"]`); if (!w) return;
      const k = labelScale(w), [dx, dy] = o[id];
      svg.querySelectorAll(`.lbl[data-for="${id}"]`).forEach(l => { l.classList.add('dragging'); l.style.transform = `translate(${dx*k}px, ${dy*k}px)`; });
      requestAnimationFrame(() => { w.classList.remove('dragging'); svg.querySelectorAll('.lbl.dragging').forEach(l => l.classList.remove('dragging')); }); });
    svg.classList.toggle('moved', hasOffsets(own));
  });
}
layersEl.addEventListener('pointerdown', e => {
  if (!layer || (e.pointerType === 'mouse' && e.button !== 0) || e.target.closest('.ctl,.bitc')) return;
  let wrap = e.target.closest('.dragwrap');
  const lb = e.target.closest('.lbl[data-for]');
  if (!wrap && lb) wrap = layer.querySelector(`.dragwrap[data-drag="${lb.dataset.for}"]`);
  if (!wrap || !layer.contains(wrap)) return;
  const m = wrap.parentNode.getScreenCTM(); if (!m) return;
  const o = offsetsFor(curOwner)[wrap.dataset.drag] || [0,0];
  const area = (stage.classList.contains('magnified') ? layer : scroller).getBoundingClientRect(), r = wrap.getBoundingClientRect();
  drag = {wrap, sx:e.clientX, sy:e.clientY, ox:o[0], oy:o[1], k:m.a, moved:false, id:e.pointerId,
    minX: area.left - r.left + 4, maxX: area.right - r.right - 4, minY: area.top - r.top + 4, maxY: area.bottom - r.bottom - 4};
});
layersEl.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  let px = e.clientX - drag.sx, py = e.clientY - drag.sy;
  if (!drag.moved){
    if (Math.hypot(px, py) < 6) return;
    drag.moved = true; hideTip();
    try { layersEl.setPointerCapture(e.pointerId); } catch(_){}
    drag.wrap.classList.add('dragging');
    layer.querySelectorAll(`.lbl[data-for="${drag.wrap.dataset.drag}"]`).forEach(l => l.classList.add('dragging'));
    /* bring the part to the front: last in its group, and its group just below the labels */
    const w = drag.wrap, labels = layer.querySelector('.labels');
    w.parentNode.appendChild(w);
    let top = w; while (top.parentNode !== layer) top = top.parentNode;
    if (top !== w && labels) layer.insertBefore(top, labels); else if (labels) layer.insertBefore(w, labels);
  }
  px = Math.min(Math.max(px, Math.min(drag.minX, 0)), Math.max(drag.maxX, 0));
  py = Math.min(Math.max(py, Math.min(drag.minY, 0)), Math.max(drag.maxY, 0));
  setOffset(drag.wrap, drag.ox + px/drag.k, drag.oy + py/drag.k, false);
  e.preventDefault();
});
function endDrag(e){
  if (!drag || (e && e.pointerId !== drag.id)) return;
  if (drag.moved){
    const t = drag.wrap.style.transform.match(/-?[\d.]+/g) || [0,0];
    offsetsFor(curOwner)[drag.wrap.dataset.drag] = [+t[0], +t[1]];
    drag.wrap.classList.remove('dragging');
    layer.querySelectorAll('.lbl.dragging').forEach(l => l.classList.remove('dragging'));
    suppressClick = true; setTimeout(() => { suppressClick = false; }, 0);
    announce.textContent = `${N[drag.wrap.dataset.drag].name} moved.`;
  }
  drag = null;
}
layersEl.addEventListener('pointerup', endDrag);
layersEl.addEventListener('pointercancel', endDrag);

$('#btn-reset-layout').addEventListener('click', () => {
  if (!layer) return;
  layer.querySelectorAll('.dragwrap').forEach(w => setOffset(w, 0, 0, true));
  SIM['drag:' + curOwner] = {};
  tools.classList.remove('show');
  announce.textContent = 'All parts moved back.';
});

/* ---------- tooltip & hover ---------- */
let hoverEl = null;
function setHover(el){
  if (hoverEl === el) return;
  if (hoverEl) hoverEl.classList.remove('is-hover');
  if (layer) layer.querySelectorAll('.lbl.hover').forEach(l => l.classList.remove('hover'));
  hoverEl = el;
  if (el){ el.classList.add('is-hover'); layer.querySelectorAll(`.lbl[data-for="${el.dataset.id}"]`).forEach(l => l.classList.add('hover')); }
}
/* The part under the pointer: a hotspot, or the part a name label belongs to */
function hotAt(t){
  const lb = t.closest && t.closest('.lbl[data-for]');
  if (lb) return layer.querySelector(`.hot[data-id="${lb.dataset.for}"]`);
  return t.closest ? t.closest('.hot') : null;
}
/* A concise details card appears after the pointer rests on a part for 1.5
   seconds. Right-click instead opens the same concise card with action
   buttons (Full details, See inside, Real-life examples), pinned open --
   useful in full screen, where the side panel isn't visible. */
const TIP_DELAY = 1500;
let tipTimer = null, tipFor = null, tipXY = null, tipPinned = false;
function scheduleTip(el, x, y){
  if (tipPinned) return;
  tipXY = x === undefined ? null : [x, y];
  if (tipFor === el){ if (tip.classList.contains('show') && tipXY) placeTip(el, x, y); return; }
  clearTimeout(tipTimer); tip.classList.remove('show'); tipFor = el;
  tipTimer = setTimeout(() => { if (tipFor === el) showTip(el, ...(tipXY || [])); }, TIP_DELAY);
}
function placeTip(el, x, y){
  const sr = stage.getBoundingClientRect();
  if (x === undefined){ const r = el.getBoundingClientRect(); x = r.left + r.width/2; y = r.bottom; }
  const tw = tip.offsetWidth || 240, th = tip.offsetHeight || 54;
  let lx = x - sr.left + 14, ly = y - sr.top + 18;
  if (lx + tw > sr.width - 8) lx = x - sr.left - tw - 14;
  if (ly + th > sr.height - 8) ly = y - sr.top - th - 14;
  tip.style.left = Math.max(8, lx) + 'px'; tip.style.top = Math.max(8, ly) + 'px';
}
/* The heading (level, name) stays put while the text below it scrolls; a
   shadow appears under it as soon as that text scrolls up under it. */
function wireTipScroll(){
  const head = tip.querySelector('.dp-head'), scroller = tip.querySelector('.dp-scroll');
  if (!head || !scroller) return;
  scroller.addEventListener('scroll', () => head.classList.toggle('scrolled', scroller.scrollTop > 1));
}
function showTip(el, x, y){
  const n = N[el.dataset.id]; if (!n) return;
  tipFor = el;
  tip.innerHTML = detailsHTML(n) + '<button class="dp-close" type="button" aria-label="Close details">×</button>';
  tip.querySelector('.dp-close').addEventListener('click', () => { tipPinned = false; hideTip(); });
  wireTipScroll();
  tip.classList.remove('pinned');
  placeTip(el, x, y);
  tip.classList.add('show');
}
function hideTip(){ if (tipPinned) return; clearTimeout(tipTimer); tipFor = null; tip.classList.remove('show'); setHover(null); }
function showActions(el, x, y){
  const n = N[el.dataset.id]; if (!n) return;
  clearTimeout(tipTimer); tipPinned = false; setHover(el); tipFor = el;
  tip.innerHTML = actionCardHTML(n) + '<button class="dp-close" type="button" aria-label="Close details">×</button>';
  wireTipScroll();
  tip.classList.add('pinned');
  const section = tip.querySelector('.dp-section');
  tip.querySelectorAll('.dp-act').forEach(btn => btn.addEventListener('click', () => {
    if (btn.dataset.act === 'inside'){ tipPinned = false; hideTip(); go(el.dataset.id, {from: el}); return; }
    if (btn.dataset.act === 'try'){ tipPinned = false; hideTip(); runDeviceTest(el.dataset.id); return; }
    tip.querySelectorAll('.dp-act').forEach(b => b.classList.toggle('on', b === btn));
    section.innerHTML = btn.dataset.act === 'full' ? detailsFullHTML(n) : detailsExamplesHTML(n);
    placeTip(el, x, y);                    /* the card just grew: keep it inside the stage */
  }));
  tip.querySelector('.dp-close').addEventListener('click', () => { tipPinned = false; hideTip(); });
  placeTip(el, x, y);
  tip.classList.add('show');
  tipPinned = true;
}
/* Right-click rings a part and dims everything else in the current diagram
   while its action card is open, so the eye isn't drawn elsewhere. Clicking
   the background (or navigating away) clears it again. */
let selectedEl = null;
function setSelected(el){
  if (selectedEl) selectedEl.classList.remove('selected');
  if (layer) layer.querySelectorAll('.selected-lbl').forEach(l => l.classList.remove('selected-lbl'));
  selectedEl = el;
  if (el && layer){
    el.classList.add('selected');
    layer.classList.add('select-dim');
    layer.querySelectorAll(`.lbl[data-for="${el.dataset.id}"]`).forEach(l => l.classList.add('selected-lbl'));
  } else if (layer) layer.classList.remove('select-dim');
}
function clearSelection(){
  setSelected(null);
  tipPinned = false; hideTip();
}

layersEl.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch') return;
  if (simRunning()){ if (hoverEl) setHover(null); clearTimeout(tipTimer); return; }   /* no hover highlight or card mid-simulation */
  if (drag && drag.moved) return;
  if (tipPinned) return;
  const h = layer ? hotAt(e.target) : null;
  if (h && layer.contains(h) && !e.target.closest('.ctl,.bitc')){ setHover(h); scheduleTip(h, e.clientX, e.clientY); }
  else hideTip();
});
layersEl.addEventListener('pointerleave', hideTip);
/* Right-click on a mouse opens the details card. On a touchscreen a long press also fires this event, but there a
   tap is the only gesture (it opens the part and the details panel), so it is ignored. */
layersEl.addEventListener('contextmenu', e => {
  if (e.pointerType === 'touch' || (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents)) return;
  if (!layer || !layer.contains(e.target)) return;
  if (e.target.closest('.ctl,.bitc,.html-scene')) return;
  const h = hotAt(e.target);
  if (h){ e.preventDefault(); setSelected(h); showActions(h, e.clientX, e.clientY); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && tipPinned) clearSelection(); });
document.addEventListener('click', e => {
  if (tipPinned && !e.target.closest('#tip') && !(layer && layer.contains(e.target))) clearSelection();
});
/* A click opens the part: it navigates there and updates the details panel
   on the right. Right-click (above) is the way to glance at a part without
   leaving the current diagram. On a touchscreen there is no right-click, so
   a tap opens that same details card instead of navigating away -- a tap is
   the mobile equivalent of a computer's right-click, not its left-click. */
layersEl.addEventListener('click', e => {
  if (!layer || !layer.contains(e.target)) return;
  if (e.target.closest('.ctl,.bitc,.html-scene')) return;
  if (suppressClick){ suppressClick = false; return; }
  const h = hotAt(e.target);
  if (h){
    if (coarse.matches){ setSelected(h); showActions(h, e.clientX, e.clientY); return; }
    if (h.dataset.id === 'power-button'){ powerToggle(); return; }
    /* With the details panel hidden there's nowhere for a normal click's
       navigation to show up, so it opens the same details card a right-click
       does instead of navigating away. */
    if (html.classList.contains('panel-hidden')){ setSelected(h); showActions(h, e.clientX, e.clientY); return; }
    go(h.dataset.id, {from: h}); return;
  }
  clearSelection();
  if (cur !== curOwner) go(curOwner);
});
layersEl.addEventListener('keydown', e => {
  const h = e.target.closest && e.target.closest('.hot');
  if (h && e.target === h && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); if (h.dataset.id === 'power-button') powerToggle(); else go(h.dataset.id, {from: h}); }
  const wrap = h && h.closest('.dragwrap');
  const dirs = {ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1]};
  if (wrap && e.shiftKey && dirs[e.key]){                 /* Shift + arrows moves a draggable part */
    e.preventDefault(); e.stopPropagation();
    const o = offsetsFor(curOwner)[wrap.dataset.drag] || [0,0];
    setOffset(wrap, o[0] + dirs[e.key][0]*14, o[1] + dirs[e.key][1]*14, true);
  }
});
layersEl.addEventListener('focusin', e => { const h = e.target.closest && e.target.closest('.hot'); if (h && e.target === h && !simRunning()){ setHover(h); scheduleTip(h); } });
layersEl.addEventListener('focusout', hideTip);

/* Rebuild the current scene in place (used when a scene switches mode) */
window.rebuildScene = function(){
  swapLayer(curOwner, true);
  applyFocus();
  hintEl.textContent = hintFor(N[curOwner]); hintEl.hidden = !hintEl.textContent;
};

/* ---------- collapsible details panel ----------
   "Hide details" gives the diagram the full width. The choice is remembered.
   A wide scene (the 8086 ALU) can ask for the full width with requestWide(true);
   a panel hidden that way comes back when you leave, unless you chose yourself. */
const panelBtn = $('#btn-panel');
let panelAuto = false, panelUserChose = false;
function setPanelHidden(hide){
  html.classList.toggle('panel-hidden', hide);
  if (!panelBtn) return;
  panelBtn.setAttribute('aria-expanded', hide ? 'false' : 'true');
  panelBtn.querySelector('span').textContent = hide ? 'Show details' : 'Hide details';
}
window.requestWide = function(on){
  if (on){ if (!html.classList.contains('panel-hidden') && !panelUserChose){ panelAuto = true; setPanelHidden(true); } }
  else if (panelAuto){ panelAuto = false; setPanelHidden(false); }
};
if (panelBtn){
  setPanelHidden(html.classList.contains('panel-hidden'));
  panelBtn.addEventListener('click', () => {
    const hide = !html.classList.contains('panel-hidden');
    panelAuto = false; panelUserChose = true; setPanelHidden(hide);
    try { localStorage.setItem('itc-panel', hide ? 'hidden' : 'shown'); } catch(_){}
  });
}

/* ---------- links & buttons ---------- */
document.addEventListener('click', e => {
  const a = e.target.closest('[data-go]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  const fromPanel = panel.contains(a) || stripEl.contains(a), inDialog = a.closest('dialog');
  if (inDialog) $('#overview').close();
  go(a.dataset.go);
  /* jump straight there, instantly -- the diagram's own cross-fade already
     provides the sense of motion, and animating the page scroll *at the same
     time* as that cross-fade was two competing animations fighting for the
     same frames, which is what actually read as a flicker on mobile */
  if ((fromPanel || inDialog) && innerWidth <= 980 && !stripEl.contains(a)) stage.scrollIntoView({behavior:'auto', block:'start'});
});
$('#btn-back').addEventListener('click', goBack);
$('#btn-home').addEventListener('click', () => {
  for (const k in SIM) delete SIM[k];
  for (const k in LASTKEY) delete LASTKEY[k];
  for (const k in LIVE) delete LIVE[k];
  if (layer){ layer.remove(); layer = null; } curOwner = null; cur = null;
  go('computer');
});
$('.brand').addEventListener('click', e => { if (e.button === 0 && !e.metaKey && !e.ctrlKey){ e.preventDefault(); go('computer'); } });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !tipPinned && !$('#overview').open && !(e.target.closest && e.target.closest('input,textarea'))){ const p = N[cur].parent; if (p) go(p); }
});
addEventListener('popstate', e => {
  const id = (e.state && e.state.id) || idFromLocation();
  if (N[id] && id !== cur) go(id, {fromHistory:true});
});
addEventListener('hashchange', () => { const id = location.hash.slice(2); if (N[id] && id !== cur) go(id, {fromHistory:true}); });
function idFromLocation(){
  const h = location.hash.slice(2); if (N[h]) return h;
  const m = location.pathname.match(/parts\/([a-z0-9-]+)\.html$/); if (m && N[m[1]]) return m[1];
  return html.dataset.node || 'computer';
}

/* overview tree */
const dlg = $('#overview');
$('#btn-overview').addEventListener('click', () => {
  $('#tree').innerHTML = `<ul>${treeHTML('computer', cur, urlFor)}</ul>`;
  dlg.showModal();
  const c = dlg.querySelector('.cur'); if (c) c.scrollIntoView({block:'center'});
});
$('#ov-close').addEventListener('click', () => dlg.close());
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

/* ---------- webcam / mic live test ("Try the camera" / "Try the microphone") ----------
   Camera and microphone access is only ever requested after this direct button
   click (never on load or on hover). Every track is stopped the instant capture
   finishes, so the camera/mic indicator light goes off right away, and nothing
   captured is written to storage, uploaded, or kept past the short animation that
   plays it back on screen -- it lives in memory for a few seconds and is then
   discarded (object URLs revoked, canvases cleared, variables set to null). */
var runDeviceTest = () => {};
var simRunning = () => false;    /* true while the power-on walkthrough or a webcam / mic flow is playing */
var powerToggle = () => {}, powerSync = () => {}, powerStop = () => {};   /* set by the power-on walkthrough below */
{
  const dt = $('#device-test');
  if (dt){
    const dTitle = $('#dt-title'), dSub = $('#dt-sub'), video = $('#dt-video'), canvasEl = $('#dt-canvas'),
          photoEl = $('#dt-photo'), meter = $('#dt-meter'), meterFill = $('#dt-meter-fill'),
          audioEl = $('#dt-audio'), statusEl = $('#dt-status'), actionsEl = $('#dt-actions'), dtClose = $('#dt-close');
    let stream = null, recorder = null, chunks = [], audioCtx = null, meterRaf = null, recordTimer = null;

    function stopStream(){
      if (stream){ stream.getTracks().forEach(t => t.stop()); stream = null; }
      if (meterRaf){ cancelAnimationFrame(meterRaf); meterRaf = null; }
      if (audioCtx){ audioCtx.close().catch(() => {}); audioCtx = null; }
      clearTimeout(recordTimer); recordTimer = null;
    }
    function resetDialog(){
      stopStream();
      video.hidden = true; video.srcObject = null;
      photoEl.hidden = true; photoEl.src = '';
      meter.hidden = true; meterFill.style.width = '0%';
      audioEl.hidden = true; audioEl.pause(); audioEl.removeAttribute('src'); audioEl.load();
      chunks = []; recorder = null; statusEl.textContent = '';
    }
    function setActions(buttons){
      actionsEl.innerHTML = '';
      buttons.forEach(({label, primary, onClick}) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn' + (primary ? ' btn-primary' : '');
        b.textContent = label;
        b.addEventListener('click', onClick);
        actionsEl.appendChild(b);
      });
    }
    function closeDialog(){ resetDialog(); dt.close(); }
    dtClose.addEventListener('click', closeDialog);
    dt.addEventListener('cancel', closeDialog);
    dt.addEventListener('click', e => { if (e.target === dt) closeDialog(); });

    function unsupported(){
      return !window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia;
    }

    function openCamera(){
      dTitle.textContent = 'Try the camera';
      dSub.textContent = 'Nothing is saved or sent anywhere — the photo only travels through this page for a few seconds.';
      resetDialog();
      dt.showModal();
      setActions([{label: 'Cancel', onClick: closeDialog}]);
      if (unsupported()){
        statusEl.textContent = 'The camera needs a secure connection and browser support that isn’t available here.';
        return;
      }
      statusEl.textContent = 'Asking your browser for camera access…';
      navigator.mediaDevices.getUserMedia({video: {width: 320, height: 240}})
        .then(s => {
          if (!dt.open){ s.getTracks().forEach(t => t.stop()); return; }  /* closed while waiting */
          stream = s;
          video.srcObject = s; video.hidden = false;
          statusEl.textContent = 'Camera on — smile!';
          setActions([
            {label: 'Take photo', primary: true, onClick: takePhoto},
            {label: 'Cancel', onClick: closeDialog},
          ]);
        })
        .catch(err => {
          statusEl.textContent = err && err.name === 'NotAllowedError'
            ? 'Camera access was blocked. Allow it in your browser’s site settings to try this.'
            : 'Couldn’t reach a camera on this device.';
        });
    }
    function takePhoto(){
      if (!stream) return;
      canvasEl.width = video.videoWidth || 320; canvasEl.height = video.videoHeight || 240;
      const ctx = canvasEl.getContext('2d');
      ctx.translate(canvasEl.width, 0); ctx.scale(-1, 1);   /* mirror, so the photo matches the on-screen preview */
      ctx.drawImage(video, 0, 0, canvasEl.width, canvasEl.height);
      const dataUrl = canvasEl.toDataURL('image/png');
      stopStream();                                        /* camera light off immediately */
      video.hidden = true;
      photoEl.src = dataUrl; photoEl.hidden = false;
      statusEl.textContent = 'Captured — not saved anywhere.';
      setActions([
        {label: 'Send to the screen', primary: true, onClick: () => { dt.close(); runFlow('webcam', () => showPhotoOnMonitor(dataUrl)); }},
        {label: 'Retake', onClick: openCamera},
        {label: 'Cancel', onClick: closeDialog},
      ]);
    }

    function openMic(){
      dTitle.textContent = 'Try the microphone';
      dSub.textContent = 'Nothing is saved or sent anywhere — the clip only travels through this page for a few seconds.';
      resetDialog();
      dt.showModal();
      setActions([{label: 'Cancel', onClick: closeDialog}]);
      if (unsupported()){
        statusEl.textContent = 'The microphone needs a secure connection and browser support that isn’t available here.';
        return;
      }
      statusEl.textContent = 'Asking your browser for microphone access…';
      navigator.mediaDevices.getUserMedia({audio: true})
        .then(s => {
          if (!dt.open){ s.getTracks().forEach(t => t.stop()); return; }
          stream = s;
          meter.hidden = false;
          try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const src = audioCtx.createMediaStreamSource(s);
            const analyser = audioCtx.createAnalyser(); analyser.fftSize = 256;
            src.connect(analyser);
            const data = new Uint8Array(analyser.frequencyBinCount);
            const draw = () => {
              analyser.getByteFrequencyData(data);
              const avg = data.reduce((a, b) => a + b, 0) / data.length;
              meterFill.style.width = Math.min(100, avg / 1.3) + '%';
              meterRaf = requestAnimationFrame(draw);
            };
            draw();
          } catch(_){}
          statusEl.textContent = 'Microphone on — say something!';
          setActions([
            {label: 'Start recording', primary: true, onClick: startRecording},
            {label: 'Cancel', onClick: closeDialog},
          ]);
        })
        .catch(err => {
          statusEl.textContent = err && err.name === 'NotAllowedError'
            ? 'Microphone access was blocked. Allow it in your browser’s site settings to try this.'
            : 'Couldn’t reach a microphone on this device.';
        });
    }
    function startRecording(){
      if (!stream) return;
      chunks = [];
      try { recorder = new MediaRecorder(stream); }
      catch(_){ statusEl.textContent = 'Recording isn’t supported in this browser.'; return; }
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, {type: recorder.mimeType || 'audio/webm'});
        const url = URL.createObjectURL(blob);
        stopStream();
        meter.hidden = true;
        statusEl.textContent = 'Recorded — not saved anywhere.';
        setActions([
          {label: 'Send to the speakers', primary: true, onClick: () => { dt.close(); runFlow('mic', () => playAudioAtSpeakers(url)); }},
          {label: 'Retry', onClick: openMic},
          {label: 'Cancel', onClick: () => { URL.revokeObjectURL(url); closeDialog(); }},
        ]);
      };
      recorder.start();
      let t = 5;
      const tick = () => {
        statusEl.textContent = `Recording… (${t}s left)`;
        if (t-- <= 0){ if (recorder && recorder.state !== 'inactive') recorder.stop(); return; }
        recordTimer = setTimeout(tick, 1000);
      };
      setActions([{label: 'Stop recording', primary: true, onClick: () => { if (recorder.state !== 'inactive') recorder.stop(); }}]);
      tick();
    }

    /* ---- the flow: a bright dot travels device -> I/O port -> CPU/GPU -> I/O
       port -> the output device, and the part it is currently at is the one
       lit up (everything else dims), so the highlight follows the data
       instead of staying on the input the whole time. It rests briefly at
       the CPU/GPU before heading back out.
       Every waypoint's position is read fresh from the actual diagram (via
       getBBox + getCTM, which already includes the tower's own scaling and
       any offset from dragging a part around) right before the flow starts,
       so it always matches wherever the parts currently are -- never a
       stale, hand-picked coordinate that could drift out of sync. */
    /* getCTM() on an element maps it all the way to CSS pixels, including the
       root <svg>'s own viewBox-to-viewport scaling -- but the flow dot's
       cx/cy (like everything else drawn in a scene) live in the *viewBox's*
       coordinate space. Dividing out the root's own CTM cancels that outer
       scaling, leaving just the part's own position within the viewBox. */
    function relativeCTM(el){
      const own = layer.getCTM(), theirs = el.getCTM();
      if (!own || !theirs) return theirs || null;
      return own.inverse().multiply(theirs);
    }
    function hotCenter(id){
      const el = layer && layer.querySelector(`.hot[data-id="${id}"], [data-flow="${id}"]`);
      if (!el || typeof el.getBBox !== 'function') return null;
      try {
        const box = el.getBBox(), ctm = relativeCTM(el);
        if (!ctm) return [box.x + box.width / 2, box.y + box.height / 2];
        const pt = layer.createSVGPoint();
        pt.x = box.x + box.width / 2; pt.y = box.y + box.height / 2;
        const p = pt.matrixTransform(ctm);
        return [p.x, p.y];
      } catch(_){ return null; }
    }
    const ROUTE_IDS = {
      webcam: ['webcam', 'io', 'ram', 'cpu', 'ram', 'io', 'monitor'],
      mic: ['mic', 'io', 'ram', 'cpu', 'ram', 'io', 'speakers'],
    };
    const PAUSE_MS = {cpu: 650, ram: 250};
    let flowBusy = 0;                                  /* webcam / mic flows currently playing */
    function runFlow(kind, onArrive){
      const ids = ROUTE_IDS[kind];
      const route = ids && layer ? routePts(ids) : null;
      if (!layer || !route || route.length < 2){ onArrive(); return; }
      const lay = layer;
      flowBusy++; setHover(null); clearTimeout(tipTimer);
      let over = false;
      const finish = () => { if (!over){ over = true; flowBusy--; } };
      const dot = document.createElementNS(SVGNS, 'circle');
      dot.setAttribute('r', '7'); dot.setAttribute('class', 'device-flow-dot');
      dot.setAttribute('cx', route[0].pt[0]); dot.setAttribute('cy', route[0].pt[1]);
      lay.appendChild(dot);
      const highlight = id => { if (id.startsWith('via-')) return; const h = lay.querySelector(`.hot[data-id="${id}"]`); if (h) setSelected(h); };
      highlight(route[0].id);
      let leg = 0, start = null;
      const legMs = k => Math.max(90, Math.hypot(route[k + 1].pt[0] - route[k].pt[0], route[k + 1].pt[1] - route[k].pt[1]) / SPEED);
      function frame(ts){
        if (layer !== lay){ dot.remove(); finish(); return; }      /* the visitor navigated away mid-flow */
        if (!start) start = ts;
        const t = Math.min(1, (ts - start) / legMs(leg));
        const [x1, y1] = route[leg].pt, [x2, y2] = route[leg + 1].pt;
        dot.setAttribute('cx', x1 + (x2 - x1) * t); dot.setAttribute('cy', y1 + (y2 - y1) * t);
        if (t < 1){ requestAnimationFrame(frame); return; }
        leg++; start = null;
        const w = route[leg], real = !w.id.startsWith('via-');
        highlight(w.id);
        if (leg < route.length - 1){
          const pause = real ? (PAUSE_MS[w.id] || 120) : 0;         /* rests at parts, not at points along a cable */
          if (pause) setTimeout(() => requestAnimationFrame(frame), pause); else requestAnimationFrame(frame);
          return;
        }
        dot.remove();
        onArrive();
        setTimeout(() => { setSelected(null); finish(); }, 5000);   /* keep the destination lit while its result shows, then clear */
      }
      requestAnimationFrame(frame);
    }

    /* ---- the power-on walkthrough ----
       Pressing the tower's power button (or "Power on" in its panel / card, or Step)
       plays these steps. Each step shows a one-line `note` at the top of the diagram
       and adds its full text `x` to a log that keeps every earlier step: in the
       details panel normally, or in a pop-up beside the tower when the panel isn't
       visible (full screen, or "Hide details"). `**bold**` marks signal names.
       A step's `routes` are several paths played at the same time, one dot each, so
       a signal that reaches many parts (the PSU's power, the I/O port's signals to
       every device) fans out from a shared start. Route entries are ids of parts,
       or of the invisible "via" points and the wall plug drawn by the scene.
       `kind: 'power'` draws the dots and lines blue (power); everything else is yellow
       (signals and data). Step 1 has no routes: standby power is always there, so instead of a dot the
       cord, the PSU cable and the PWR_SW# wire are lit (`lit` glows the named parts).
       Pressing the button drops that wire LOW (step 2), and the main rails light up
       from step 4. Pause holds after the current step; Step / Back move one. */
    const T_PSU = ['psu', 'via-cable', 'via-cable2', 'atx-power'];   /* PSU to the 24-pin connector, along its cable */
    const T_FW = ['bios', 'chipset', 'cpu'];                         /* firmware chip to the CPU, through the chipset */
    const T_OS = ['ram', 'cpu'];                                     /* the running OS: RAM to the CPU */
    const POWER_STEPS = [
      {t: 'AC Power → PSU → +5VSB → Motherboard', note: 'Standby power is always on, even when the PC is “off”.',
       x: 'The PSU receives AC power from the wall and converts it into DC power. Even when the PC is off, it provides **+5VSB standby power**. The motherboard receives it, so its power-management circuitry stays active and can detect the power button.',
       routes: [], lit: ['ac', 'psu', 'atx-power', 'chipset'], kind: 'power'},
      {t: 'Power Button → PWR_SW# → Power Logic', note: 'Pressing the button pulls PWR_SW# LOW; the board’s power logic sees it.',
       x: 'When you press the power button, the switch momentarily connects the **PWR_SW# signal to ground**. The motherboard’s power-control circuitry recognizes the change and decides to start the system.',
       routes: [['power-button', 'via-w1', 'via-w2', 'via-w3', 'chipset']]},
      {t: 'Motherboard → PS_ON# → PSU', note: 'The board pulls PS_ON# LOW: “turn on”.',
       x: 'The motherboard pulls the **PS_ON# signal LOW**, telling the PSU to turn on its main power outputs.',
       routes: [['chipset', 'atx-power', 'via-cable2', 'via-cable', 'psu']]},
      {t: 'PSU → Main Power Rails', note: '+12 V, +5 V and +3.3 V go out to every part.',
       x: 'The PSU starts supplying **+12V, +5V, and +3.3V** to the motherboard and other components. The CPU gets its power through the motherboard’s voltage regulators (VRM), and the RAM and fans through the board too; the graphics card and drives also have their own cables, and USB devices such as the keyboard and mouse get 5 V through the I/O ports. The monitor, printer and most speakers have their own wall plugs, so the PC does not power them.',
       routes: [...['motherboard', 'cpu', 'ram', 'chipset', 'bios', 'cooling', 'io'].map(id => [...T_PSU, id]),
                ...['keyboard', 'mouse', 'webcam', 'mic', 'joystick', 'gamepad'].map(id => [...T_PSU, 'io', id]),
                ['psu', 'via-gpu1', 'via-gpu2', 'via-gpu3', 'gpu'], ['psu', 'via-sto', 'storage']], kind: 'power'},
      {t: 'PSU → PWR_OK → CPU Reset Release', note: '“Power OK”: the board releases the CPU from reset.',
       x: 'After the power rails become stable, the PSU sends **PWR_OK** to tell the motherboard that the power is within the required range. The motherboard’s reset circuitry then completes the startup sequence and releases the CPU from **RESET**.',
       routes: [[...T_PSU, 'chipset', 'cpu']]},
      {t: 'CPU → Firmware (UEFI)', note: 'The CPU starts running the UEFI firmware.',
       x: 'The CPU starts executing instructions from the system firmware. Modern PCs generally use **UEFI**, although it is commonly still called “BIOS.”',
       routes: [['cpu', 'chipset', 'bios']]},
      {t: 'UEFI → Hardware Initialization & POST', note: 'It sets up RAM, GPU, drives and USB; the first picture appears.',
       x: 'UEFI initializes and trains the RAM, then sets up essential hardware such as the GPU, storage controllers, USB controllers, and other devices. The **Power-On Self-Test (POST)** checks that they work well enough to continue booting. Once the graphics card is ready, the first picture (usually the maker’s logo) appears on the monitor.',
       routes: [...['ram', 'storage', 'io'].map(id => [...T_FW, id]), [...T_FW, 'gpu', 'io', 'monitor']]},
      {t: 'Boot Device → Bootloader → OS Kernel', note: 'It finds the boot drive and loads the OS into RAM.',
       x: 'UEFI checks the configured boot order and finds a bootable device, such as an NVMe SSD or SATA drive. The firmware loads the bootloader into memory and hands control to it, and the bootloader loads the operating-system kernel and required initial components into RAM.',
       routes: [[...T_FW, 'storage', 'ram']]},
      {t: 'CPU → Operating System → Drivers → Desktop', note: 'The OS starts, loads drivers, and every device gets its signal.',
       x: 'The CPU begins executing the OS kernel, which initializes memory management, processes, drivers, and other system services. The operating system loads device drivers so it can communicate with the GPU, keyboard, mouse, storage, network hardware, and other devices. Finally, the OS starts the graphical environment and presents the **login screen or desktop** to the user.',
       routes: [[...T_OS, 'gpu', 'io', 'monitor'], [...T_OS, 'storage'],
                ...['keyboard', 'mouse', 'webcam', 'mic', 'joystick', 'gamepad', 'printer', 'speakers'].map(id => [...T_OS, 'io', id])]},
    ];
    const SPEED = 0.42;                                              /* diagram units per millisecond */
    const FX_CLASSES = ['pw-standby', 'pw-low', 'pw-rails', 'pw-kind-power', 'pw-screen', 'pw-boot', 'pw-spin'];
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const fmt = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    const isFs = () => (document.fullscreenElement || document.webkitFullscreenElement) === stage;
    const usePop = () => isFs() || html.classList.contains('panel-hidden');

    /* the one-line note at the top of the diagram */
    const flowNote = document.createElement('div');
    flowNote.className = 'flow-note'; flowNote.hidden = true; flowNote.setAttribute('role', 'status');
    flowNote.innerHTML = '<span class="fn-step"></span><span class="fn-txt"></span>';
    stage.appendChild(flowNote);
    const showFlowNote = (text, i, paused) => {
      flowNote.firstChild.textContent = `${i + 1}/${POWER_STEPS.length}${paused ? ' · paused' : ''}`;
      flowNote.lastChild.textContent = text;
    };
    const hideFlowNote = () => { flowNote.hidden = true; };

    /* the pop-up step log, for when the details panel isn't visible */
    const pop = document.createElement('aside');
    pop.className = 'flow-pop'; pop.hidden = true; pop.setAttribute('aria-label', 'Power-on steps');
    pop.innerHTML = '<div class="fp-head"><b>Power-on steps</b><div class="fp-tools">' + pwControls(false) +
      '<button type="button" class="fp-close" aria-label="Close the steps">×</button></div></div><ol class="pw-log" aria-live="polite"></ol>' +
      '<span class="fp-rs fp-rs-e" data-rs="e" aria-hidden="true"></span><span class="fp-rs fp-rs-s" data-rs="s" aria-hidden="true"></span><span class="fp-rs fp-rs-se" data-rs="se" title="Drag to resize" aria-hidden="true"></span>';
    stage.appendChild(pop);
    const popList = pop.querySelector('.pw-log');
    /* keep the pop-up just left of the tower (not far off at the stage's edge) without covering it */
    const stagePad = () => { const r = stage.getBoundingClientRect(); return {left: r.left + stage.clientLeft, top: r.top + stage.clientTop, width: stage.clientWidth, height: stage.clientHeight}; };
    let popMoved = false;                       /* the visitor dragged the pop-up: leave it where they put it */
    function placePop(){
      if (pop.hidden) return;
      const sr = stagePad();
      if (popMoved){                            /* only keep it inside the stage (it may have been resized) */
        const pr = pop.getBoundingClientRect();
        pop.style.left = Math.min(Math.max(pr.left - sr.left, 0), Math.max(0, sr.width - pr.width)) + 'px';
        pop.style.top = Math.min(Math.max(pr.top - sr.top, 0), Math.max(0, sr.height - pr.height)) + 'px';
        return;
      }
      const t = layer && layer.querySelector('[data-flow="tower"]');
      if (!t) return;
      const tr = t.getBoundingClientRect(), w = pop.offsetWidth || Math.min(420, sr.width - 32);
      pop.style.left = Math.max(16, Math.min(tr.left - sr.left - w - 12, sr.width - w - 16)) + 'px';
    }

    const popHead = pop.querySelector('.fp-head');
    popHead.title = 'Drag to move';
    popHead.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.closest('button')) return;
      const sr = stagePad(), pr = pop.getBoundingClientRect(), dx = e.clientX - pr.left, dy = e.clientY - pr.top;
      popHead.setPointerCapture(e.pointerId); pop.classList.add('dragging');
      const move = ev => {
        pop.style.left = Math.min(Math.max(ev.clientX - dx - sr.left, 0), Math.max(0, sr.width - pr.width)) + 'px';
        pop.style.top = Math.min(Math.max(ev.clientY - dy - sr.top, 0), Math.max(0, sr.height - pr.height)) + 'px';
        pop.style.bottom = 'auto'; popMoved = true;
      };
      const up = () => { pop.classList.remove('dragging'); popHead.removeEventListener('pointermove', move); popHead.removeEventListener('pointerup', up); popHead.removeEventListener('pointercancel', up); };
      popHead.addEventListener('pointermove', move); popHead.addEventListener('pointerup', up); popHead.addEventListener('pointercancel', up);
      e.preventDefault();
    });

    /* resize from the corner (both), the right edge (width) or the bottom edge (height); the top-left corner stays put */
    const POP_MIN_W = 260, POP_MIN_H = 170;
    pop.querySelectorAll('.fp-rs').forEach(h => h.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      const dir = h.dataset.rs, sr = stagePad(), pr = pop.getBoundingClientRect();
      const left = pr.left - sr.left, top = pr.top - sr.top, w0 = pr.width, h0 = pr.height, x0 = e.clientX, y0 = e.clientY;
      pop.style.left = left + 'px'; pop.style.top = top + 'px'; pop.style.bottom = 'auto'; popMoved = true;
      h.setPointerCapture(e.pointerId); pop.classList.add('dragging');
      const move = ev => {
        if (dir.includes('e')) pop.style.width = Math.min(Math.max(w0 + ev.clientX - x0, POP_MIN_W), sr.width - left) + 'px';
        if (dir.includes('s')) pop.style.height = Math.min(Math.max(h0 + ev.clientY - y0, POP_MIN_H), sr.height - top) + 'px';
      };
      const up = () => { pop.classList.remove('dragging'); h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up); };
      h.addEventListener('pointermove', move); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
      e.preventDefault(); e.stopPropagation();
    }));

    /* pw: the running walkthrough {lay, dots, sel, i, timer, raf, paused, holding, animating}; pwDone: steps shown so far */
    let pw = null, pwDone = 0, popClosed = false;
    simRunning = () => !!pw || flowBusy > 0;
    const stepLi = i => {
      const st = POWER_STEPS[i], li = document.createElement('li');
      li.innerHTML = `<span class="pw-n">${i + 1}</span><div><b>${esc(st.t)}</b><p>${fmt(st.x)}</p></div>`;
      return li;
    };
    const fillList = list => {
      if (!list) return;
      while (list.children.length > pwDone) list.lastChild.remove();
      while (list.children.length < pwDone) list.appendChild(stepLi(list.children.length));
    };
    const syncControls = root => {
      if (!root) return;
      root.querySelectorAll('[data-pw]').forEach(b => {
        const a = b.dataset.pw;
        if (a === 'run') b.textContent = pw ? 'Stop' : pwDone ? 'Replay' : 'Power on';
        else if (a === 'pause'){
          const play = !!(pw && pw.paused), label = play ? 'Play' : 'Pause';
          b.classList.toggle('is-play', play); b.setAttribute('aria-label', label); b.title = label; b.disabled = !pw;
        } else if (a === 'back') b.disabled = !pw || pw.i <= 0;
      });
    };
    powerSync = () => {
      fillList(inner.querySelector('[data-pw-log]')); fillList(popList);
      pop.hidden = !(pwDone > 0 && !popClosed && usePop());
      if (!pop.hidden) placePop();
      syncControls(inner); syncControls(pop);
      if (pw) flowNote.firstChild.textContent = `${pw.i + 1}/${POWER_STEPS.length}${pw.paused ? ' · paused' : ''}`;
      /* the steps are already on screen in the pop-up or the side panel; the short note is only needed
         on a phone, where the panel sits below the diagram */
      flowNote.hidden = !(pw && innerWidth <= 980 && pop.hidden);
    };
    const revealLatest = () => {
      popList.scrollTop = popList.scrollHeight;
      const l = inner.querySelector('[data-pw-log]');
      /* only where the panel scrolls on its own; on a phone it sits below the diagram and scrolling would pull the page away from it */
      if (l && l.lastChild && innerWidth > 980) l.lastChild.scrollIntoView({block: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth'});
    };

    const litSel = id => `.hot[data-id="${id}"], [data-flow="${id}"]`;
    function clearLight(){
      pw.sel.forEach(e => e.classList.remove('selected'));
      pw.lay.querySelectorAll('.selected-lbl').forEach(l => l.classList.remove('selected-lbl'));
      pw.lay.querySelectorAll('.flow-lit').forEach(e => e.classList.remove('flow-lit'));
      pw.lay.classList.remove('select-dim');
      pw.sel = [];
    }
    /* 'dim': the parts the dots are at stand out and everything else fades; 'glow': just glow the named parts */
    function powerLight(ids, mode){
      clearLight();
      ids.forEach(id => {
        if (id.startsWith('via-')) return;
        const el = pw.lay.querySelector(litSel(id));
        if (!el) return;
        if (mode === 'dim' && el.classList.contains('hot')){
          el.classList.add('selected'); pw.sel.push(el);
          pw.lay.querySelectorAll(`.lbl[data-for="${id}"]`).forEach(l => l.classList.add('selected-lbl'));
        } else el.classList.add('flow-lit');
      });
      if (mode === 'dim' && pw.sel.length) pw.lay.classList.add('select-dim');
    }
    /* the monitor while the walkthrough runs: 'off' is black, 'boot' the firmware's start-up page, 'spin' the same
       page with the loading spinner, 'welcome' the normal welcome message */
    const SCREENS = {off: ['pw-screen'], boot: ['pw-screen', 'pw-boot'], spin: ['pw-screen', 'pw-boot', 'pw-spin'], welcome: []};
    function setScreen(state){
      const c = pw.lay.classList;
      ['pw-screen', 'pw-boot', 'pw-spin'].forEach(k => c.toggle(k, SCREENS[state].includes(k)));
    }
    /* what is powered / what the press changed, as a function of the step */
    function powerFx(i){
      const c = pw.lay.classList;
      c.add('pw-standby');                       /* +5VSB never goes away */
      c.toggle('pw-low', i === 1);               /* PWR_SW# is pulled LOW while the button is pressed */
      c.toggle('pw-rails', i >= 3);              /* the main rails are on from step 4 */
      c.toggle('pw-kind-power', POWER_STEPS[i].kind === 'power');
      setScreen(i <= 6 ? 'off' : 'spin');       /* black until the first picture; the boot page (with its spinner) until the desktop */
    }
    function powerCleanup(){
      if (!pw) return;
      clearTimeout(pw.timer); cancelAnimationFrame(pw.raf);
      pw.g.remove();
      clearLight();
      pw.lay.classList.remove(...FX_CLASSES);
      if (layer === pw.lay) setSelected(null);
      pw = null; hideFlowNote();
    }
    const powerDot = k => {
      while (pw.dots.length <= k){
        const d = document.createElementNS(SVGNS, 'circle');
        d.setAttribute('r', '7'); d.setAttribute('class', 'device-flow-dot pw-dot');
        pw.dg.appendChild(d); pw.dots.push(d);
      }
      return pw.dots[k];
    };
    /* the "current": a glowing line behind each dot with beads that keep flowing along it */
    const powerTrail = k => {
      while (pw.trails.length <= k){
        const n = pw.trails.length, id = 'pw-tail-' + n, mk = (tag, attrs) => { const e = document.createElementNS(SVGNS, tag); for (const a in attrs) e.setAttribute(a, attrs[a]); return e; };
        const grad = mk('linearGradient', {id, gradientUnits: 'userSpaceOnUse'});
        const s0 = mk('stop', {offset: '0', 'stop-opacity': '0'}), s1 = mk('stop', {offset: '1', 'stop-opacity': '1'});
        grad.append(s0, s1); pw.defs.appendChild(grad);
        const g = mk('g', {}), glow = mk('polyline', {}), line = mk('polyline', {});
        glow.style.stroke = line.style.stroke = `url(#${id})`;
        g.append(glow, line); pw.tg.appendChild(g);
        pw.trails.push({g, glow, line, grad, s0, s1});
      }
      return pw.trails[k];
    };
    /* points along a device's dotted cable, from the device end to the I/O port end; null once parts have been
       moved (the cables are hidden then, so the dot goes straight) */
    function cablePts(dev){
      const path = layer.querySelector(`.conn path[data-dev="${dev}"]`);
      if (!path || layer.classList.contains('moved')) return null;
      const len = path.getTotalLength(), n = 14, out = [];
      for (let k = 0; k <= n; k++){ const q = path.getPointAtLength(len * k / n); out.push([q.x, q.y]); }
      return out;
    }
    /* the points of a route (read fresh, so they follow dragged parts). Between the I/O port and a
       device that has a dotted cable in the drawing, the route follows that cable. */
    function routePts(ids){
      const pts = [];
      ids.forEach((id, k) => {
        const pt = hotCenter(id);
        if (!pt) return;
        let via = null;
        if (ids[k - 1] === 'io'){ via = cablePts(id); if (via) via.reverse(); }          /* port to device */
        else if (id === 'io') via = cablePts(ids[k - 1]);                                  /* device to port */
        if (via) via.forEach((q, j) => pts.push({id: 'via-cable-' + j, pt: q}));
        pts.push({id, pt});
      });
      return orthogonal(pts);
    }
    /* Between two parts the route runs along straight horizontal and vertical lines (an "L"), like traces on a
       board, instead of cutting diagonally: vertical first when the parts are further apart up-and-down than
       side-to-side, horizontal first otherwise. Points along a drawn cable or wire (ids starting "via-") are
       left exactly as drawn. */
    function orthogonal(pts){
      const out = [pts[0]];
      for (let k = 1; k < pts.length; k++){
        const a = pts[k - 1], b = pts[k];
        if (!a.id.startsWith('via-') && !b.id.startsWith('via-')){
          const dx = b.pt[0] - a.pt[0], dy = b.pt[1] - a.pt[1];
          if (Math.abs(dx) > 2 && Math.abs(dy) > 2)
            out.push({id: 'via-o', pt: Math.abs(dy) >= Math.abs(dx) ? [a.pt[0], b.pt[1]] : [b.pt[0], a.pt[1]]});
        }
        out.push(b);
      }
      return out;
    }
    function buildRoutes(st){
      return st.routes.map(ids => {
        const pts = routePts(ids);
        const cum = [0];
        for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k].pt[0] - pts[k - 1].pt[0], pts[k].pt[1] - pts[k - 1].pt[1]));
        return {pts, cum, total: cum[cum.length - 1]};
      }).filter(r => r.pts.length);
    }
    const TAIL_LEN = 150, TAIL_FADE_MS = 800;                         /* length of a dot's tail (diagram units) and how long it takes to fade after arrival */
    function routePos(r, d){
      let a = 0; while (a < r.pts.length - 1 && r.cum[a + 1] <= d) a++;
      const b = Math.min(a + 1, r.pts.length - 1), seg = r.cum[b] - r.cum[a], f = seg > 0 ? (d - r.cum[a]) / seg : 1;
      const [x1, y1] = r.pts[a].pt, [x2, y2] = r.pts[b].pt;
      return [x1 + (x2 - x1) * f, y1 + (y2 - y1) * f];
    }
    function routeBetween(r, from, to){
      const out = [routePos(r, from)];
      for (let k = 1; k < r.pts.length; k++) if (r.cum[k] > from && r.cum[k] < to) out.push(r.pts[k].pt);
      out.push(routePos(r, to));
      return out;
    }
    const stepDwell = st => 700 + st.x.split(/\s+/).length * 75;      /* time to read the step */
    function powerStep(i){
      if (!pw) return;
      if (layer !== pw.lay){ powerCleanup(); powerSync(); return; }   /* the visitor left the computer's diagram */
      clearTimeout(pw.timer); cancelAnimationFrame(pw.raf);
      pw.holding = false;
      if (i >= POWER_STEPS.length){ powerCleanup(); powerSync(); return; }
      i = Math.max(0, i);
      pw.i = i; pwDone = i + 1; pw.animating = true;
      const st = POWER_STEPS[i];
      powerFx(i); showFlowNote(st.note, i, pw.paused); powerSync(); revealLatest();
      const routes = buildRoutes(st);
      pw.dots.forEach(d => { d.style.visibility = 'hidden'; });
      pw.trails.forEach(t => { t.g.style.visibility = 'hidden'; });
      if (!routes.length){ powerLight(st.lit || [], 'glow'); powerStepDone(); return; }
      const power = st.kind === 'power', tone = power ? ' is-power' : '';
      routes.forEach((r, k) => {
        const d = powerDot(k), t = powerTrail(k);
        d.setAttribute('class', 'device-flow-dot pw-dot' + tone);
        t.glow.setAttribute('class', 'pw-trail-glow' + tone); t.line.setAttribute('class', 'pw-trail' + tone);
        t.s0.style.stopColor = t.s1.style.stopColor = power ? 'var(--power)' : 'var(--signal)';
        d.style.visibility = t.g.style.visibility = 'visible'; t.g.style.opacity = '1';
        d.setAttribute('cx', r.pts[0].pt[0]); d.setAttribute('cy', r.pts[0].pt[1]);
        t.glow.setAttribute('points', ''); t.line.setAttribute('points', '');
      });
      const longest = Math.max(...routes.map(r => r.total));
      let t0 = null, litKey = null, shown = false, done = false;
      const fadeEnd = longest / SPEED + TAIL_FADE_MS;
      const frame = ts => {
        if (!pw) return;
        if (layer !== pw.lay){ powerCleanup(); powerSync(); return; }
        if (t0 === null) t0 = ts;
        const elapsed = ts - t0, dist = elapsed * SPEED, stops = new Set();
        routes.forEach((r, k) => {
          const d = Math.min(dist, r.total), [cx, cy] = routePos(r, d);
          let a = 0; while (a < r.pts.length - 1 && r.cum[a + 1] <= d) a++;
          /* The part this dot last reached. Points along a wire or cable (via-…) aren't parts, so between two
             parts the focus stays on the last one instead of dropping out and coming back. */
          let ra = a; while (ra > 0 && r.pts[ra].id.startsWith('via-')) ra--;
          stops.add(r.pts[ra].id);
          pw.dots[k].setAttribute('cx', cx); pw.dots[k].setAttribute('cy', cy);
          /* the tail: the last TAIL_LEN units behind the dot, clear at its far end; once the dot has arrived it
             draws in toward the dot and fades out */
          const gone = dist > r.total ? Math.min(1, (elapsed - r.total / SPEED) / TAIL_FADE_MS) : 0;
          const head = Math.max(0, d - TAIL_LEN), from = head + (d - head) * gone;
          const pts = routeBetween(r, from, d), str = pts.map(q => q[0] + ',' + q[1]).join(' '), t = pw.trails[k];
          t.glow.setAttribute('points', str); t.line.setAttribute('points', str);
          t.grad.setAttribute('x1', pts[0][0]); t.grad.setAttribute('y1', pts[0][1]); t.grad.setAttribute('x2', cx); t.grad.setAttribute('y2', cy);
          t.g.style.opacity = String(1 - gone);
        });
        if (!shown && stops.has('monitor')){                 /* the picture reaches the monitor */
          shown = true;
          if (i === 6) setScreen('boot'); else if (i === 8) setScreen('welcome');
        }
        const key = [...stops].join('|');
        if (key !== litKey){ litKey = key; powerLight([...stops], 'dim'); }
        if (!done && dist >= longest){ done = true; powerStepDone(); }
        if (elapsed < fadeEnd) pw.raf = requestAnimationFrame(frame);
      };
      pw.raf = requestAnimationFrame(frame);
    }
    /* a step's animation is over: wait to be read and go on, or hold here if paused */
    function powerStepDone(){
      if (!pw) return;
      const i = pw.i;
      pw.animating = false;
      if (pw.paused){ pw.holding = true; powerSync(); return; }
      pw.timer = setTimeout(() => powerStep(i + 1), stepDwell(POWER_STEPS[i]));
    }
    function powerStart(paused){
      if (pw || !layer || !layer.querySelector('.hot[data-id="power-button"]')) return;
      if (cur !== 'power-button') go('power-button');   /* so the panel shows the button's page, where the steps collect */
      const g = document.createElementNS(SVGNS, 'g'), tg = document.createElementNS(SVGNS, 'g'), dg = document.createElementNS(SVGNS, 'g');
      const defs = document.createElementNS(SVGNS, 'defs');
      g.setAttribute('class', 'pw-flow'); g.append(defs, tg, dg); layer.appendChild(g);       /* trails first, so the dots sit on top */
      pw = {lay: layer, g, defs, tg, dg, dots: [], trails: [], sel: [], i: -1, timer: null, raf: 0, paused: !!paused, holding: false, animating: false};
      pwDone = 0; popClosed = false; popMoved = false; pop.style.top = ''; pop.style.bottom = '';
      setHover(null); clearTimeout(tipTimer); powerSync();
      powerStep(0);
    }
    powerToggle = () => { if (pw){ powerCleanup(); powerSync(); } else powerStart(); };
    powerStop = () => { powerCleanup(); popClosed = true; powerSync(); };
    const powerPause = () => {
      if (!pw) return;
      pw.paused = !pw.paused;
      if (pw.paused){
        if (!pw.animating && !pw.holding){ clearTimeout(pw.timer); pw.holding = true; }   /* stop waiting; hold here */
      } else if (pw.holding){
        pw.holding = false;
        pw.timer = setTimeout(() => powerStep(pw.i + 1), 400);
      }
      showFlowNote(POWER_STEPS[pw.i].note, pw.i, pw.paused); powerSync();
    };
    const powerStepBy = d => {
      if (!pw){ if (d > 0) powerStart(true); return; }          /* Step from rest starts a paused walkthrough */
      pw.paused = true;
      powerStep(pw.i + d);
    };
    const powerControl = e => {
      const b = e.target.closest('[data-pw]');
      if (!b || b.disabled) return;
      const a = b.dataset.pw;
      if (a === 'run') powerToggle(); else if (a === 'pause') powerPause();
      else if (a === 'step') powerStepBy(1); else if (a === 'back') powerStepBy(-1);
    };
    inner.addEventListener('click', powerControl);
    pop.addEventListener('click', powerControl);
    pop.querySelector('.fp-close').addEventListener('click', () => { powerCleanup(); popClosed = true; powerSync(); });
    document.addEventListener('fullscreenchange', () => { powerSync(); setTimeout(placePop, 250); });
    document.addEventListener('webkitfullscreenchange', () => { powerSync(); setTimeout(placePop, 250); });
    addEventListener('resize', () => { if (!pop.hidden) placePop(); powerSync(); });
    if (panelBtn) panelBtn.addEventListener('click', () => setTimeout(powerSync, 0));
    /* Reads an element's actual rectangle in the diagram's own coordinate
       space (again via getBBox + getCTM), so overlays line up with a part
       even after it has been dragged somewhere else. */
    function hotRect(el){
      if (!el || typeof el.getBBox !== 'function') return null;
      try {
        const box = el.getBBox(), ctm = relativeCTM(el);
        if (!ctm) return {x: box.x, y: box.y, w: box.width, h: box.height};
        const p1 = layer.createSVGPoint(); p1.x = box.x; p1.y = box.y;
        const p2 = layer.createSVGPoint(); p2.x = box.x + box.width; p2.y = box.y + box.height;
        const a = p1.matrixTransform(ctm), b = p2.matrixTransform(ctm);
        return {x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y)};
      } catch(_){ return null; }
    }
    /* A third, front-most "tab" opens on the monitor to show the photo,
       exactly like the two tabs already there, then closes on its own. */
    function showPhotoOnMonitor(dataUrl){
      if (!layer) return;
      const screen = hotRect(layer.querySelector('#monitor-screen'));
      if (!screen) return;
      const mk = (tag, attrs) => {
        const el = document.createElementNS(SVGNS, tag);
        for (const k in attrs) el.setAttribute(k, attrs[k]);
        return el;
      };
      const m = 8, barH = 22;
      const px = screen.x + m, py = screen.y + m, pw = screen.w - m * 2, ph = screen.h - m * 2;
      const g = mk('g', {class: 'monitor-photo-ov'});
      g.appendChild(mk('rect', {x: px, y: py, width: pw, height: ph, rx: 6, class: 'm-panel'}));
      g.appendChild(mk('rect', {x: px, y: py, width: pw, height: barH, rx: 6, class: 'm-block'}));
      ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => g.appendChild(mk('circle', {cx: px + 13 + i * 11, cy: py + 11, r: 3.2, fill: c})));
      const label = mk('text', {x: px + pw / 2, y: py + 15, class: 't t-xs t-inv t-mid'}); label.textContent = 'Photo'; g.appendChild(label);
      const ix = px + 8, iy = py + barH + 8, iw = pw - 16, ih = ph - barH - 16;
      const clipId = 'mp-clip-' + Date.now();
      const clip = mk('clipPath', {id: clipId});
      clip.appendChild(mk('rect', {x: ix, y: iy, width: iw, height: ih, rx: 4}));
      g.appendChild(clip);
      const img = mk('image', {x: ix, y: iy, width: iw, height: ih, preserveAspectRatio: 'xMidYMid slice', 'clip-path': `url(#${clipId})`});
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', dataUrl);
      img.setAttribute('href', dataUrl);
      g.appendChild(img);
      layer.appendChild(g);
      setTimeout(() => g.remove(), 5000);
    }
    function playAudioAtSpeakers(url){
      const speakerHot = layer && layer.querySelector('.hot[data-id="speakers"]');
      if (speakerHot) speakerHot.classList.add('device-playing');
      audioEl.hidden = false; audioEl.src = url; audioEl.play().catch(() => {});
      const stopAll = () => { if (speakerHot) speakerHot.classList.remove('device-playing'); audioEl.pause(); URL.revokeObjectURL(url); };
      audioEl.onended = stopAll;
      setTimeout(stopAll, 5000);
    }

    runDeviceTest = kind => { if (kind === 'webcam') openCamera(); else if (kind === 'mic') openMic(); else if (kind === 'power-button') powerToggle(); };
  }
}

/* theme */
const themeBtn = $('#btn-theme');
const MOON = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M16.5 12.2A7 7 0 0 1 7.8 3.5a7 7 0 1 0 8.7 8.7Z"/></svg>';
const SUN = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="3.6"/><path d="M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"/></svg>';
function setTheme(t){
  html.dataset.theme = t;
  themeBtn.innerHTML = t === 'dark' ? SUN : MOON;
  themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  try { localStorage.setItem('itc-theme', t); } catch(_){}
}
setTheme(html.dataset.theme || 'light');
themeBtn.addEventListener('click', () => setTheme(html.dataset.theme === 'dark' ? 'light' : 'dark'));

/* start */
go(idFromLocation(), {animate:false, replace:true});
})();
