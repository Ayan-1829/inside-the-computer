/* ==========================================================
   model3d.js
   "3D view" on every part that has a 3D model, and on the parts drawn
   inside its picture (a mouse's sensor shows the mouse): a small box
   with a still of the model at the top left of the picture (with the
   real photos in a box under it), or on the home page and on phones
   a button in the bar under the picture.
   It opens a window with the model (js/3d/viewer.js), which can be
   turned, zoomed, labelled and opened up. The 3D code and three.js
   (js/vendor/) load only when the button is first pressed.
   Runs after engine.js and guide.js.
   ========================================================== */
(function(){
if (!window.ITC) return;
const $ = s => document.querySelector(s);
const html = document.documentElement, bar = $('#stage-bar');
if (!bar) return;
/* the parts with a model: must match the list in js/3d/models.js */
const MODELS_3D = ['computer', 'cpu', 'motherboard', 'ram', 'gpu', 'storage', 'ssd', 'hdd', 'psu', 'cooling', 'io',
  'monitor', 'speakers', 'printer', 'keyboard', 'mouse', 'joystick', 'gamepad', 'power-button', 'webcam', 'mic'];
const has = id => MODELS_3D.indexOf(id) >= 0;
const ROOT = new URL(html.dataset.root || './', location.href);
const reduceQ = matchMedia('(prefers-reduced-motion: reduce)');
const track = (n, d) => { if (window.trackEvent) window.trackEvent(n, d); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const name = id => (N[id] ? N[id].name : id);
const lower = id => id === 'cpu' || id === 'gpu' || id === 'ram' || id === 'ssd' ? name(id) : name(id).toLowerCase();
const CUBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M12 2.8 20 7.3v9.4l-8 4.5-8-4.5V7.3Z"/><path d="M4 7.3 12 12l8-4.7M12 12v9.2"/></svg>';

/* ---------- the button under the picture (the home page, and phones) ---------- */
const btn = document.createElement('button');
btn.type = 'button'; btn.className = 'g-3d'; btn.hidden = true;
bar.appendChild(btn);

/* ---------- on a part's own picture: two small boxes at its top left ----------
   a still of the 3D model (img/3d/<id>.webp, made by build/render-3d-thumbs.mjs), which opens the 3D view,
   and under it the first real photo, which opens the photos. Not on the home page, where the whole computer
   is shown, and not on phones (the buttons in the bar stay there). They hide while an animation such as
   "How it works" plays (.g-busy, set by guide.js). */
const stageEl = $('#stage');
const cards = document.createElement('div');
cards.className = 'stage-cards'; cards.id = 'stage-cards';
cards.innerHTML = `<button type="button" class="s-card s-3d"><img alt="" decoding="async" width="200" height="150"><span class="s-card-l">${CUBE}<span>3D view</span></span></button>` +
  `<button type="button" class="s-card s-ph" data-i="0"><img alt="" decoding="async" width="200" height="150"><span class="s-card-l"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.3l1.4-2h7.6l1.4 2h2.3A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5Z"/><circle cx="12" cy="12.5" r="3.6"/></svg><span>Real photos</span></span></button>` +
  `<a class="s-card s-vd" target="_blank" rel="noopener noreferrer"><img alt="" decoding="async" width="200" height="150"><i class="s-play" aria-hidden="true"><svg viewBox="0 0 20 20" fill="currentColor"><path d="M7 5.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L7.9 4.7a.6.6 0 0 0-.9.5Z"/></svg></i><span class="s-card-l"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="3.5"/><path d="m10 9.2 5 2.8-5 2.8Z" fill="currentColor"/></svg><span>Video</span></span></a>`;
if (stageEl) stageEl.appendChild(cards);
const card3d = cards.querySelector('.s-3d'), cardPh = cards.querySelector('.s-ph'), cardVd = cards.querySelector('.s-vd');
card3d.addEventListener('click', () => { if (modelId) open(modelId); });     /* the photo box has data-photo: guide.js opens the viewer */

let modelId = null;
function draw(id){
  const owner = ITC.owner();
  modelId = has(id) ? id : has(owner) ? owner : null;
  btn.hidden = !modelId;
  if (modelId){
    btn.innerHTML = `<span class="g3d-ic">${CUBE}</span><span><b>3D view</b><small>of the ${esc(lower(modelId))}</small></span>`;
    btn.setAttribute('aria-label', `See the ${name(modelId)} in 3D`);
  }
  const boxes = !!modelId && modelId !== 'computer' && owner !== 'computer';
  html.classList.toggle('has-cards', boxes);
  if (!boxes) return;
  const img = card3d.querySelector('img'), src = new URL(`img/3d/${modelId}.webp`, ROOT).href;
  if (img.src !== src) img.src = src;
  card3d.setAttribute('aria-label', `See the ${name(modelId)} in 3D`);
  card3d.title = `Open the ${name(modelId)} in 3D`;
  const pid = typeof photosFor === 'function' ? (photosFor(id) ? id : photosFor(owner) ? owner : null) : null;
  cardPh.hidden = !pid;
  if (pid){
    const ps = PHOTOS[pid], im = cardPh.querySelector('img'), psrc = PHOTO_BASE + ps[0][0];
    if (im.src !== psrc) im.src = psrc;
    cardPh.dataset.photo = pid;
    cardPh.lastChild.lastChild.textContent = ps.length > 1 ? `Real photos · ${ps.length}` : 'Real photo';
    cardPh.setAttribute('aria-label', `See ${ps.length} real photo${ps.length > 1 ? 's' : ''} of the ${N[pid].name}`);
  } else delete cardPh.dataset.photo;
  /* the first "Learn more" video of the part (or of the part whose picture this is): engine.js plays links with
     data-yt in its video window, in YouTube's privacy-enhanced mode */
  const vOf = k => typeof LEARN !== 'undefined' && LEARN[k] ? LEARN[k].find(l => l[0] === 'v') : null;
  const v = vOf(id) || vOf(owner);
  cardVd.hidden = !v;
  if (v){
    const vim = cardVd.querySelector('img'), vsrc = `https://i.ytimg.com/vi/${v[3]}/mqdefault.jpg`;
    if (vim.src !== vsrc) vim.src = vsrc;
    cardVd.href = 'https://www.youtube.com/watch?v=' + v[3];
    cardVd.dataset.yt = v[3]; cardVd.dataset.ytTitle = v[1]; cardVd.dataset.ytBy = v[2];
    cardVd.lastChild.lastChild.textContent = v[4] ? `Video · ${v[4]}` : 'Video';
    cardVd.setAttribute('aria-label', `Watch the video: ${v[1]} (${v[2]}${v[4] ? ', ' + v[4] : ''})`);
    cardVd.title = `${v[1]} · ${v[2]}`;
  }
  fitCards();
}
/* the boxes' size: about a sixth of the picture's width (so they grow with it in full screen), but never so big
   that they don't fit its height; they are spread evenly down the left side (CSS). The drawing's left margin
   follows (--cw on #stage). */
function fitCards(){
  if (!stageEl || !html.classList.contains('has-cards')) return;
  const n = [...cards.children].filter(c => !c.hidden).length || 1;
  const H = cards.clientHeight, W = stageEl.clientWidth;
  if (!H || !W) return;
  const byH = (H - (n + 1) * 10) / n / .94;                          /* a box is about .94 of its width tall */
  const cw = Math.round(Math.max(88, Math.min(W * .163, byH, 320)));
  stageEl.style.setProperty('--cw', cw + 'px');
}
if (stageEl && window.ResizeObserver){ const ro = new ResizeObserver(fitCards); ro.observe(stageEl); ro.observe(cards); }
document.addEventListener('fullscreenchange', () => requestAnimationFrame(fitCards));
addEventListener('itc:nav', e => draw(e.detail.id));
draw(ITC.cur());
/* "How it works" (or the power-on walkthrough) starting: hide the boxes at once, not at guide.js's next check */
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('.dv-run, .pw-run, [data-guide="power"]')) html.classList.add('g-busy'); }, true);

/* ---------- the window ---------- */
const dlg = document.createElement('dialog');
dlg.id = 'model3d'; dlg.className = 'm3d'; dlg.setAttribute('aria-labelledby', 'm3d-title');
dlg.innerHTML =
  '<div class="dlg-head"><div><h2 id="m3d-title">3D view</h2><p id="m3d-sub">Drag to turn it. Scroll or pinch to zoom, right-drag to move it.</p></div>' +
  '<button class="btn icon" id="m3d-close" type="button" aria-label="Close the 3D view"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg></button></div>' +
  '<div class="m3d-stage" id="m3d-stage" tabindex="0" role="application" aria-roledescription="3D model" aria-describedby="m3d-keys">' +
    '<div class="m3d-labels" id="m3d-labels"></div><p class="m3d-msg" id="m3d-msg" role="status"></p>' +
    '<p class="m3d-note" id="m3d-note" hidden>Press <b>Open it up</b> to see the labelled parts inside</p></div>' +
  '<p class="sr-only" id="m3d-keys">Arrow keys turn the model, plus and minus zoom, 0 resets the view. The labels are links to each part.</p>' +
  '<div class="m3d-bar">' +
    '<button class="btn" type="button" data-m3d="open" aria-pressed="false"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8.5 10 5l6 3.5-6 3.5Z"/><path d="M4 12.5 10 16l6-3.5M10 2v1.5"/></svg><span>Open it up</span></button>' +
    '<button class="btn" type="button" data-m3d="labels" aria-pressed="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M3 4.5h8.5l5 5.5-5 5.5H3Z"/><circle cx="7" cy="10" r="1.3"/></svg><span>Labels</span></button>' +
    '<button class="btn" type="button" data-m3d="turn" aria-pressed="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M16 10a6 6 0 1 1-2-4.5"/><path d="M14.5 2.5V6H11"/></svg><span>Turn</span></button>' +
    '<button class="btn" type="button" data-m3d="reset"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10a6 6 0 1 0 2-4.5"/><path d="M4 3.5V6h2.5"/></svg><span>Reset view</span></button>' +
    '<span class="m3d-zoom"><button class="btn icon" type="button" data-m3d="in" aria-label="Zoom in"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M10 5v10M5 10h10"/></svg></button>' +
    '<button class="btn icon" type="button" data-m3d="out" aria-label="Zoom out"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 10h10"/></svg></button></span>' +
    '<span class="m3d-hint">A model drawn to show the parts, not to scale with each other</span>' +
  '</div>';
document.body.appendChild(dlg);
if (ITC.coarse && ITC.coarse.matches) $('#m3d-sub').textContent = 'Drag to turn it. Pinch to zoom, drag with two fingers to move it.';
const stage = $('#m3d-stage'), msg = $('#m3d-msg'), note = $('#m3d-note'), B = k => dlg.querySelector(`[data-m3d="${k}"]`);
const press = (k, on) => B(k).setAttribute('aria-pressed', on ? 'true' : 'false');

let viewer = null, loading = null, info = null, showing = null;
function webgl(){ try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch(_){ return false; } }
function load(){
  if (!loading) loading = import(new URL('js/3d/viewer.js', ROOT).href).then(mod => {
    viewer = mod.createViewer(stage, $('#m3d-labels'), {
      reduce: () => reduceQ.matches,
      nameOf: name,
      onLabel: id => { dlg.close(); track('model3d_part', id); if (id !== ITC.cur()) ITC.go(id); },
      onAuto: on => press('turn', on),
      onOpen: on => { press('open', on); B('open').lastChild.textContent = on ? 'Put it together' : 'Open it up'; },
      onShown: n => { note.hidden = !(info && info.insideOnly && n === 0 && B('labels').getAttribute('aria-pressed') === 'true'); },
    });
    return viewer;
  });
  return loading;
}
async function open(id){
  $('#m3d-title').textContent = '3D view: ' + name(id);
  stage.setAttribute('aria-label', `3D model of the ${name(id)}`);
  B('open').hidden = true; note.hidden = true;
  if (!dlg.open) dlg.showModal();
  stage.focus({preventScroll: true});
  track('model3d', id);
  if (!webgl()){ msg.textContent = 'The 3D view needs WebGL, which is turned off or not available in this browser.'; return; }
  if (!viewer){ msg.textContent = 'Loading the 3D model…'; }
  try { await load(); }
  catch(e){ loading = null; msg.textContent = 'The 3D view could not be loaded. Check the connection and try again.'; return; }
  msg.textContent = '';
  if (!dlg.open) return;
  const focus = ITC.cur() !== id ? ITC.cur() : null;
  if (showing !== id || focus){
    await new Promise(r => requestAnimationFrame(r));                 /* the window has its size now */
    press('open', false); B('open').lastChild.textContent = 'Open it up';
    info = viewer.show(id, focus); showing = focus ? null : id;
  } else viewer.reset();
  B('open').hidden = !info.hasOpen;
  B('labels').hidden = !info.labels;
  const turn = !reduceQ.matches;
  viewer.setAuto(turn); press('turn', turn);
  viewer.start();
}
btn.addEventListener('click', () => { if (modelId) open(modelId); });
$('#m3d-close').addEventListener('click', () => dlg.close());
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
dlg.addEventListener('close', () => { if (viewer) viewer.stop(); });
dlg.querySelector('.m3d-bar').addEventListener('click', e => {
  const b = e.target.closest('[data-m3d]'); if (!b || !viewer) return;
  const k = b.dataset.m3d, on = b.getAttribute('aria-pressed') !== 'true';
  if (k === 'open') viewer.setOpen(on);
  else if (k === 'labels'){ viewer.setLabels(on); press('labels', on); }
  else if (k === 'turn'){ viewer.setAuto(on); press('turn', on); }
  else if (k === 'reset') viewer.reset();
  else if (k === 'in') viewer.zoom(.8);
  else if (k === 'out') viewer.zoom(1.25);
});
/* ?3d on the address opens the current part's 3D view (for links and testing) */
if (ITC.query && ITC.query.has('3d') && modelId) open(modelId);              /* read before the address bar was tidied */
})();
