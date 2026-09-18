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
  return `translate(${tx}px, ${ty}px) scale(${s})`;
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
    requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.remove('enter-in','enter-fade')));
    setTimeout(() => old.remove(), 700);
  }
  layer = svg; curOwner = own;
  if (init) init(svg, N[own]);
  if (drag) restoreOffsets(svg, own);
  tools.classList.toggle('show', drag && hasOffsets(own));
  svg.dataset.drag = drag ? '1' : '';
  centerScroll();
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
  if (cur === curOwner) return;
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
  cur = id;
  const own = ownerOf(id);
  if (own !== curOwner) swapLayer(own, opts.animate !== false && !!layer && !reduce.matches);
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

/* ---------- touch: press and hold opens the same details a right-click
   does on a mouse, since a touchscreen has no separate hover or right-click
   gesture of its own. A short tap still just opens the part, as before. ---------- */
let pressTimer = null, pressXY = null;
function cancelPress(){ if (pressTimer){ clearTimeout(pressTimer); pressTimer = null; } }
layersEl.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch' || !layer || !layer.contains(e.target)) return;
  if (e.target.closest('.ctl,.bitc,.html-scene')) return;
  const h = hotAt(e.target);
  if (!h) return;
  pressXY = [e.clientX, e.clientY];
  pressTimer = setTimeout(() => {
    pressTimer = null;
    suppressClick = true; setTimeout(() => { suppressClick = false; }, 500);
    setSelected(h); showActions(h, pressXY[0], pressXY[1]);
  }, 550);
});
layersEl.addEventListener('pointermove', e => {
  if (pressTimer && pressXY && Math.hypot(e.clientX - pressXY[0], e.clientY - pressXY[1]) > 10) cancelPress();
});
layersEl.addEventListener('pointerup', cancelPress);
layersEl.addEventListener('pointercancel', cancelPress);
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
  if (drag && drag.moved) return;
  if (tipPinned) return;
  const h = layer ? hotAt(e.target) : null;
  if (h && layer.contains(h) && !e.target.closest('.ctl,.bitc')){ setHover(h); scheduleTip(h, e.clientX, e.clientY); }
  else hideTip();
});
layersEl.addEventListener('pointerleave', hideTip);
layersEl.addEventListener('contextmenu', e => {
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
   leaving the current diagram. */
layersEl.addEventListener('click', e => {
  if (!layer || !layer.contains(e.target)) return;
  if (e.target.closest('.ctl,.bitc,.html-scene')) return;
  if (suppressClick){ suppressClick = false; return; }
  const h = hotAt(e.target);
  if (h){
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
  if (h && e.target === h && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); go(h.dataset.id, {from: h}); }
  const wrap = h && h.closest('.dragwrap');
  const dirs = {ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1]};
  if (wrap && e.shiftKey && dirs[e.key]){                 /* Shift + arrows moves a draggable part */
    e.preventDefault(); e.stopPropagation();
    const o = offsetsFor(curOwner)[wrap.dataset.drag] || [0,0];
    setOffset(wrap, o[0] + dirs[e.key][0]*14, o[1] + dirs[e.key][1]*14, true);
  }
});
layersEl.addEventListener('focusin', e => { const h = e.target.closest && e.target.closest('.hot'); if (h && e.target === h){ setHover(h); scheduleTip(h); } });
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
      const el = layer && layer.querySelector(`.hot[data-id="${id}"]`);
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
    const LEG_MS = 800, PAUSE_MS = {cpu: 650, ram: 250};
    function runFlow(kind, onArrive){
      const ids = ROUTE_IDS[kind];
      const route = ids && ids.map(id => ({id, pt: hotCenter(id)})).filter(w => w.pt);
      if (!layer || !route || route.length < 2){ onArrive(); return; }
      const dot = document.createElementNS(SVGNS, 'circle');
      dot.setAttribute('r', '7'); dot.setAttribute('class', 'device-flow-dot');
      layer.appendChild(dot);
      const highlight = id => { const h = layer.querySelector(`.hot[data-id="${id}"]`); if (h) setSelected(h); };
      highlight(route[0].id);
      let leg = 0, start = null;
      function frame(ts){
        if (!start) start = ts;
        const t = Math.min(1, (ts - start) / LEG_MS);
        const [x1, y1] = route[leg].pt, [x2, y2] = route[leg + 1].pt;
        dot.setAttribute('cx', x1 + (x2 - x1) * t); dot.setAttribute('cy', y1 + (y2 - y1) * t);
        if (t < 1){ requestAnimationFrame(frame); return; }
        leg++; start = null;
        highlight(route[leg].id);
        if (leg < route.length - 1){
          setTimeout(() => requestAnimationFrame(frame), PAUSE_MS[route[leg].id] || 120);
          return;
        }
        dot.remove();
        onArrive();
        setTimeout(() => setSelected(null), 5000);   /* keep the destination lit while its result shows, then clear */
      }
      requestAnimationFrame(frame);
    }
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

    runDeviceTest = kind => { if (kind === 'webcam') openCamera(); else if (kind === 'mic') openMic(); };
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
