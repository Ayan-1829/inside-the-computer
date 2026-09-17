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
      crumbsEl = $('#crumbs'), scroller = $('#scroller'), zoomBtn = $('#btn-zoom'), depthEl = $('#depth'), hintEl = $('#hint'), badge = $('#model-badge'), tools = $('#stage-tools'), announce = $('#announce'), stripEl = $('#strip');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const coarse = matchMedia('(pointer: coarse)');
const HTTP = /^https?:$/.test(location.protocol);
const ROOT = new URL(html.dataset.root || './', location.href);
const SITE = html.dataset.site || ROOT.href;
let cur = null, curOwner = null, layer = null;
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
  const svg = document.createElementNS(SVGNS,'svg');
  svg.setAttribute('viewBox','0 0 1000 700');
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  svg.setAttribute('class','layer scene');
  svg.setAttribute('role','group');
  svg.setAttribute('aria-label', n.name + ', interactive diagram');
  svg.innerHTML = sc.svg;
  return {svg, init: sc.init, drag: !!sc.drag};
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
  layersEl.querySelectorAll('.leaving').forEach(e => e.remove());
  const {svg, init, drag} = buildLayer(own);
  if (!old || !animate){
    if (old) old.remove();
    layersEl.appendChild(svg);
  } else {
    const dir = isAncestor(oldOwn, own) ? 'in' : isAncestor(own, oldOwn) ? 'out' : 'fade';
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
function applyFocus(){
  const svg = layer;
  svg.classList.remove('focus-mode');
  svg.querySelectorAll('.focused,.focus-anc').forEach(e => e.classList.remove('focused','focus-anc'));
  svg.querySelectorAll('.lbl.focused').forEach(e => e.classList.remove('focused'));
  if (cur === curOwner) return;
  let n = N[cur], els = [];
  while (n && n.id !== curOwner){ els = [...svg.querySelectorAll(`.hot[data-id="${n.id}"]`)]; if (els.length) break; n = N[n.parent]; }
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
function centerScroll(){ if (stage.classList.contains('magnified')) scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2; }
zoomBtn.addEventListener('click', () => {
  const on = stage.classList.toggle('magnified');
  zoomBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  zoomBtn.querySelector('span').textContent = on ? 'Fit diagram' : 'Zoom diagram';
  requestAnimationFrame(() => { centerScroll(); padTargets(layer); });
});

/* ---------- touch targets: make every control at least 44 CSS px ---------- */
function padTargets(svg){
  if (!svg || !svg.isConnected) return;
  svg.querySelectorAll('.tap-pad').forEach(e => e.remove());
  if (!coarse.matches && innerWidth > 600) return;
  const m = svg.getScreenCTM(); if (!m) return;
  const k = m.a, min = 44 / k;
  svg.querySelectorAll('.ctl, .hot, .bitc[data-k]').forEach(el => {
    let b; try { b = el.getBBox(); } catch(_) { return; }
    if (b.width >= min && b.height >= min) return;
    const w = Math.max(b.width, min), h = Math.max(b.height, min);
    const r = document.createElementNS(SVGNS,'rect');
    r.setAttribute('class','tap-pad'); r.setAttribute('x', b.x - (w-b.width)/2); r.setAttribute('y', b.y - (h-b.height)/2);
    r.setAttribute('width', w); r.setAttribute('height', h);
    el.insertBefore(r, el.firstChild);
  });
}
let rsz; addEventListener('resize', () => { clearTimeout(rsz); rsz = setTimeout(() => padTargets(layer), 200); });

/* ---------- navigation ---------- */
function go(id, opts = {}){
  if (!N[id]) id = 'computer';
  if (id === cur && layer) return;
  cur = id;
  const own = ownerOf(id);
  if (own !== curOwner) swapLayer(own, opts.animate !== false && !!layer && !reduce.matches);
  applyFocus();
  hideTip();
  renderPanel(id);
  crumbsEl.innerHTML = crumbsHTML(id, urlFor);
  crumbsEl.parentElement.scrollLeft = crumbsEl.parentElement.scrollWidth;
  depthEl.innerHTML = depthHTML(N[id].level);
  stripEl.innerHTML = stripHTML(id, urlFor);
  const c = stripEl.querySelector('.cur'); if (c) stripEl.scrollLeft = c.offsetLeft - 40;
  updateMeta(id);
  const oN = N[own];
  badge.classList.toggle('show', !!oN.model);
  hintEl.textContent = hintFor(oN);
  $('#btn-back').disabled = id === 'computer';
  if (!opts.fromHistory){
    if (HTTP){ const u = urlFor(id); if (u !== location.href) history[opts.replace ? 'replaceState' : 'pushState']({id}, '', u); }
    else if (location.hash.slice(2) !== id && !(opts.replace && id === html.dataset.node)){
      if (opts.replace) history.replaceState({id}, '', '#/' + id); else location.hash = '/' + id;
    }
  }
  announce.textContent = `${N[id].name}. Level ${N[id].level}, ${LEVELS[N[id].level]}.`;
}
function hintFor(n){
  const tap = coarse.matches ? 'Tap' : 'Click';
  if (n.scene === 'gate' || n.scene === 'adder' || n.scene === 'mux') return `${tap} the switches to change the inputs`;
  if (n.scene === 'alu') return `${tap} the bits and pick an operation`;
  if (n.scene === 'shifter' || n.scene === 'comparator') return `${tap} the bits to change the numbers`;
  if (n.scene === 'registers') return 'Set the D switches, then press Clock';
  if (n.scene === 'control') return 'Press Next step or Run';
  if (n.scene === 'ic') return `${tap} a button to highlight its pins`;
  if (n.scene === 'pc' || n.scene === 'board') return `${tap} a part to open it, or drag it to move it`;
  return `${tap} a part to zoom in`;
}
function renderPanel(id){
  inner.innerHTML = panelHTML(id, urlFor);
  panel.scrollTop = 0;
  inner.querySelectorAll('[data-live]').forEach(e => { if (LIVE[e.dataset.live]) e.innerHTML = LIVE[e.dataset.live]; });
  if (LASTKEY[id] !== undefined) syncTable(id, LASTKEY[id]);
}
function setMeta(sel, attr, val){ const e = document.querySelector(sel); if (e) e.setAttribute(attr, val); }
function updateMeta(id){
  const t = metaTitle(id), d = metaDesc(id), u = canonicalFor(id);
  document.title = t;
  setMeta('meta[name="description"]','content',d);
  setMeta('link[rel="canonical"]','href',u);
  setMeta('meta[property="og:title"]','content',t); setMeta('meta[property="og:description"]','content',d); setMeta('meta[property="og:url"]','content',u);
  setMeta('meta[name="twitter:title"]','content',t); setMeta('meta[name="twitter:description"]','content',d);
  const ld = $('#ld-page'); if (ld) ld.textContent = JSON.stringify(jsonLD(id, SITE));
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
function showTip(el, x, y){
  const n = N[el.dataset.id]; if (!n) return;
  tip.innerHTML = `<b>${n.name}</b><span>${n.tip || ''}</span>`;
  const sr = stage.getBoundingClientRect();
  if (x === undefined){ const r = el.getBoundingClientRect(); x = r.left + r.width/2; y = r.bottom; }
  const tw = tip.offsetWidth || 240, th = tip.offsetHeight || 54;
  let lx = x - sr.left + 14, ly = y - sr.top + 18;
  if (lx + tw > sr.width - 8) lx = x - sr.left - tw - 14;
  if (ly + th > sr.height - 8) ly = y - sr.top - th - 14;
  tip.style.left = Math.max(8, lx) + 'px'; tip.style.top = Math.max(8, ly) + 'px';
  tip.classList.add('show');
}
function hideTip(){ tip.classList.remove('show'); setHover(null); }

layersEl.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch') return;
  if (drag && drag.moved) return;
  const h = layer ? hotAt(e.target) : null;
  if (h && layer.contains(h) && !e.target.closest('.ctl,.bitc')){ setHover(h); showTip(h, e.clientX, e.clientY); }
  else hideTip();
});
layersEl.addEventListener('pointerleave', hideTip);
layersEl.addEventListener('click', e => {
  if (!layer || !layer.contains(e.target)) return;
  if (e.target.closest('.ctl,.bitc')) return;
  if (suppressClick){ suppressClick = false; return; }
  const h = hotAt(e.target);
  if (h){ go(h.dataset.id); return; }
  if (cur !== curOwner) go(curOwner);
});
layersEl.addEventListener('keydown', e => {
  const h = e.target.closest && e.target.closest('.hot');
  if (h && e.target === h && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); go(h.dataset.id); }
  const wrap = h && h.closest('.dragwrap');
  const dirs = {ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1]};
  if (wrap && e.shiftKey && dirs[e.key]){                 /* Shift + arrows moves a draggable part */
    e.preventDefault(); e.stopPropagation();
    const o = offsetsFor(curOwner)[wrap.dataset.drag] || [0,0];
    setOffset(wrap, o[0] + dirs[e.key][0]*14, o[1] + dirs[e.key][1]*14, true);
  }
});
layersEl.addEventListener('focusin', e => { const h = e.target.closest && e.target.closest('.hot'); if (h && e.target === h){ setHover(h); showTip(h); } });
layersEl.addEventListener('focusout', hideTip);

/* ---------- links & buttons ---------- */
document.addEventListener('click', e => {
  const a = e.target.closest('[data-go]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  const fromPanel = panel.contains(a) || stripEl.contains(a), inDialog = a.closest('dialog');
  if (inDialog) $('#overview').close();
  go(a.dataset.go);
  if ((fromPanel || inDialog) && innerWidth <= 980 && !stripEl.contains(a)) stage.scrollIntoView({behavior: reduce.matches ? 'auto' : 'smooth', block:'start'});
});
$('#btn-back').addEventListener('click', () => { const p = N[cur].parent; if (p) go(p); });
$('#btn-home').addEventListener('click', () => {
  for (const k in SIM) delete SIM[k];
  for (const k in LASTKEY) delete LASTKEY[k];
  for (const k in LIVE) delete LIVE[k];
  if (layer){ layer.remove(); layer = null; } curOwner = null; cur = null;
  go('computer');
});
$('.brand').addEventListener('click', e => { if (e.button === 0 && !e.metaKey && !e.ctrlKey){ e.preventDefault(); go('computer'); } });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#overview').open && !(e.target.closest && e.target.closest('input,textarea'))){ const p = N[cur].parent; if (p) go(p); }
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
