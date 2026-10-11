/* ==========================================================
   guide.js
   Shows a visitor what to do. Runs after engine.js, which gives it
   window.ITC and an 'itc:nav' event after every navigation.
   - A guided tour: a spotlight and a card, one step at a time. It
     starts once on the first visit (after the start screen), and
     again from "How to use" or the welcome card's button.
   - "Click me" signals: a glow sweeps across every clickable part,
     and a pulsing ring with a hand sits on one suggested part. Both
     are strongest for newcomers and calm down as they explore.
   - Progress: parts explored (top bar), ticks in the Overview, and
     a short note the first time each new level is reached.
   Remembered in this browser only: itc-visited (part ids) and
   itc-tour ('seen'). Add ?tour to the address to see the tour again.
   ========================================================== */
(function(){
if (!window.ITC) return;
const $ = s => document.querySelector(s);
const html = document.documentElement, stage = $('#stage'), scroller = $('#scroller'), bar = $('#stage-bar');
const TOTAL = ORDER.length;
const NEWCOMER = 4;                    /* below this many parts explored, the signals stay on */
const store = {
  get(k){ try { return localStorage.getItem(k); } catch(_){ return null; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch(_){} },
};
const track = (n, d) => { if (window.trackEvent) window.trackEvent(n, d); };
const touch = () => ITC.coarse.matches;
const quiet = () => ITC.introPending || tour || ITC.busy() || document.hidden;

/* ---------- progress ---------- */
let visited = new Set();
try { visited = new Set(JSON.parse(store.get('itc-visited') || '[]').filter(id => N[id])); } catch(_){}
let deepest = Math.max(1, ...[...visited].map(id => N[id].level));
const progBtn = $('#btn-progress');
function drawProgress(){
  if (!progBtn) return;
  $('#prog-n').textContent = visited.size;
  $('#prog-t').textContent = TOTAL;
  progBtn.querySelector('.prog-fg').setAttribute('stroke-dasharray', `${Math.max(visited.size / TOTAL * 100, 3)} 100`);
  progBtn.setAttribute('aria-label', `${visited.size} of ${TOTAL} parts explored. Open the overview`);
  progBtn.title = 'Parts you have explored. Open the overview to see them all';
  progBtn.hidden = visited.size < 2;
}
if (progBtn) progBtn.addEventListener('click', () => $('#btn-overview').click());
/* engine.js builds the overview tree in its own click handler, which runs first */
$('#btn-overview').addEventListener('click', () => {
  document.querySelectorAll('#tree a[data-go]').forEach(a => a.classList.toggle('seen', visited.has(a.dataset.go)));
});

/* ---------- a short note at the top of the diagram ---------- */
const toast = document.createElement('div');
toast.className = 'g-toast';
toast.setAttribute('role', 'status');
bar.insertBefore(toast, $('#hint'));
let toastT = 0;
function say(h, ms = 4200){
  toast.innerHTML = h;
  toast.classList.add('show');
  clearTimeout(toastT);
  if (ms) toastT = setTimeout(() => toast.classList.remove('show'), ms);
}
const unsay = () => { clearTimeout(toastT); toast.classList.remove('show'); };
const LEVEL_NOTE = {
  2: 'You are inside the computer. Keep clicking to go deeper.',
  3: 'Now you see how a part is built from smaller blocks.',
  4: 'Digital logic: the gates every computer is made of.',
  5: 'The bottom: a real chip you could buy and wire up.',
};

/* ---------- the glow that sweeps across the clickable parts ---------- */
let waveT = 0, lastAct = Date.now();
const svgLayer = () => { const l = ITC.layer(); return l && l.tagName === 'svg' ? l : null; };
function wave(){
  const l = svgLayer();
  if (!l || quiet() || l.matches('.focus-mode,.select-dim')) return;
  const hs = [...l.querySelectorAll('.hot')]
    .filter(h => h.querySelector(':scope > .hl'))
    .map(h => [h, h.getBoundingClientRect()])
    .filter(([, r]) => r.width > 0);
  if (!hs.length) return;
  hs.sort((a, b) => (a[1].left + a[1].top * .4) - (b[1].left + b[1].top * .4));   /* left to right, a little top-down */
  const STEP = Math.min(80, 1400 / hs.length);
  hs.forEach(([h], i) => h.style.setProperty('--bk-d', Math.round(i * STEP) + 'ms'));
  l.classList.remove('beckon'); void l.getBoundingClientRect(); l.classList.add('beckon');
  clearTimeout(waveT);
  waveT = setTimeout(() => l.classList.remove('beckon'), hs.length * STEP + 1500);
}
['pointerdown', 'keydown', 'wheel'].forEach(t => addEventListener(t, () => { lastAct = Date.now(); }, {passive: true, capture: true}));
setInterval(() => { if (visited.size < NEWCOMER * 2 && Date.now() - lastAct > 6000) wave(); }, 9000);

/* ---------- the "click me" ring on one suggested part ---------- */
const ring = document.createElement('div');
ring.className = 'g-ring';
ring.setAttribute('aria-hidden', 'true');
ring.innerHTML = '<i></i><i></i><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
  '<path class="g-hand-o" d="M8 13V4.5a1.5 1.5 0 0 1 3 0V12m0-.5v-2a1.5 1.5 0 0 1 3 0V12m0-1.5a1.5 1.5 0 0 1 3 0V12m0-.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-2 .2a6 6 0 0 1-5-2.7l-.2-.3c-.3-.5-1.4-2.4-3.3-5.7a1.5 1.5 0 0 1 .5-2 1.9 1.9 0 0 1 2.3.3L8 13"/>' +
  '<path class="g-hand" d="M8 13V4.5a1.5 1.5 0 0 1 3 0V12m0-.5v-2a1.5 1.5 0 0 1 3 0V12m0-1.5a1.5 1.5 0 0 1 3 0V12m0-.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-2 .2a6 6 0 0 1-5-2.7l-.2-.3c-.3-.5-1.4-2.4-3.3-5.7a1.5 1.5 0 0 1 .5-2 1.9 1.9 0 0 1 2.3.3L8 13"/></svg><span></span>';
document.body.appendChild(ring);             /* placed in window coordinates: it can point outside the picture too */
let ringFor = null, ringT = 0;
/* the part to suggest: on the home page the CPU (the deepest path); elsewhere an unexplored part with its own picture */
/* The way down (JOURNEY in panel.js: Computer → CPU → ALU → Logic unit → AND gate): on each of these pictures the
   ring points at the next step, for every visitor until they have worked a gate. On a gate it points at the input
   switches, A then B. Remembered as itc-journey = 'done'. */
const JOURNEY_NEXT = {};
JOURNEY.forEach((id, i) => { if (JOURNEY[i + 1] && N[JOURNEY[i + 1]].scene !== 'ic') JOURNEY_NEXT[id] = JOURNEY[i + 1]; });
const journeyOn = () => store.get('itc-journey') !== 'done';
const onGate = () => { const o = N[ITC.owner()]; return !!o && o.scene === 'gate'; };
function suggest(){
  const l = svgLayer(), own = N[ITC.owner()];
  if (!l || !own) return null;
  const kids = own.children.filter(c => !N[c].ic);
  const cand = (JOURNEY_NEXT[own.id] ? [JOURNEY_NEXT[own.id]] : [])
    .concat(kids.filter(c => N[c].scene && !visited.has(c)), kids.filter(c => !visited.has(c)), kids);
  for (const id of cand){
    const h = l.querySelector(`.hot[data-id="${id}"]`);
    if (h && h.getBoundingClientRect().width > 0) return h;
  }
  return null;
}
/* a point on the part where a click really reaches it: its centre, unless a smaller part drawn inside it
   is on top there (the logic unit's gates, say); then the free point nearest the centre */
function ringPoint(el){
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const hits = (x, y) => { const e = document.elementFromPoint(x, y); return !!e && e.closest && e.closest('.hot,.sw,a,button') === el; };
  if (hits(cx, cy)) return [cx, cy];
  let best = null, bd = Infinity;
  for (let i = 1; i < 10; i++) for (let j = 1; j < 10; j++){
    const x = r.left + r.width * i / 10, y = r.top + r.height * j / 10, d = (x - cx) ** 2 + (y - cy) ** 2;
    if (d < bd && hits(x, y)){ bd = d; best = [x, y]; }
  }
  return best || [cx, cy];
}
function placeRing(){
  if (!ringFor) return;
  if (!ringFor.isConnected){ hideRing(); return; }
  const [x, y] = ringPoint(ringFor);
  ring.style.left = x + 'px';
  ring.style.top = y + 'px';
  ring.classList.toggle('flip', x > innerWidth - 170);    /* the label goes on the left near the right edge */
}
const isOn = sw => !!sw && sw.getAttribute('aria-checked') === 'true';
/* what the ring points at now, and its label */
let homeHint = false;                                     /* set when a gate has just been worked: lead back to the start */
function homeLink(){
  const a = $('#crumbs li:first-child a'), nav = $('.crumbs');
  if (a && nav){ const r = a.getBoundingClientRect(), k = nav.getBoundingClientRect(); if (r.width && r.left >= k.left - 1 && r.right <= k.right + 1) return a; }
  return $('#btn-home');                                  /* the first name is scrolled out of sight (phones) */
}
function coachTarget(){
  if (homeHint && ITC.cur() !== 'computer') return {el: homeLink(), label: 'Back to the computer'};
  const l = svgLayer(); if (!l) return null;
  if (onGate()){
    if (!journeyOn()) return null;
    const a = l.querySelector('.sw[data-k="a"]'), b = l.querySelector('.sw[data-k="b"]');
    if (a && !isOn(a)) return {el: a, label: touch() ? 'Tap to flip A' : 'Flip A'};
    if (b && !isOn(b)) return {el: b, label: touch() ? 'Now tap B' : 'Now flip B'};
    return null;
  }
  const h = suggest();
  return h ? {el: h, label: touch() ? 'Tap me' : 'Click me'} : null;
}
const onJourney = () => journeyOn() && (!!JOURNEY_NEXT[ITC.owner()] || onGate());
function showRing(force){
  const l = svgLayer();
  if (quiet() || !l || l.matches('.focus-mode,.select-dim') || (!force && !onJourney() && visited.size >= NEWCOMER)) return;
  const t = coachTarget(); if (!t) return;
  ringFor = t.el;
  ring.querySelector('span').textContent = t.label;
  placeRing();
  ring.classList.add('show');
}
/* after a switch on a gate is flipped: point at the next one, or celebrate once both are on.
   Listened for while capturing: the switches stop their clicks from bubbling. */
function afterFlip(e){
  if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
  if (!onGate() || !journeyOn() || !(e.target.closest && e.target.closest('.sw'))) return;
  setTimeout(() => {
    const l = svgLayer(); if (!l) return;
    const a = l.querySelector('.sw[data-k="a"]'), b = l.querySelector('.sw[data-k="b"]');
    if (isOn(a) && (!b || isOn(b))){
      store.set('itc-journey', 'done'); hideRing(); track('guide', 'journey_done');
      const n = N[ITC.owner()];
      say(n.gate === 'AND'
        ? '<b>You made the AND gate work.</b><span>Both inputs are 1, so the output is 1. Every computer is built from billions of these.</span>'
        : `<b>That is the ${esc(n.name)} at work.</b><span>Watch output Y, and the matching row of the truth table in the panel.</span>`, 7000);
      homeHint = true;
      ringT = setTimeout(() => showRing(true), 2500);       /* then: the way back up to the whole computer */
    } else showRing(true);
  }, 350);
}
stage.addEventListener('click', afterFlip, true);
stage.addEventListener('keydown', afterFlip, true);
function hideRing(){ clearTimeout(ringT); ring.classList.remove('show'); ringFor = null; }
stage.addEventListener('pointerdown', hideRing);
addEventListener('resize', placeRing);
addEventListener('scroll', placeRing, {passive: true, capture: true});   /* the picture or the page scrolling */

/* ---------- zoom badges: a small magnifier on every part that has a picture of its own inside ---------- */
const SVGNS_ = 'http://www.w3.org/2000/svg';
function addBadges(){
  const l = svgLayer(); if (!l || l.dataset.badged) return;
  l.dataset.badged = '1';
  /* a badge never covers a name: it tries each corner of the part in turn, and is left out if all four would */
  const texts = [...l.querySelectorAll('text')].map(t => t.getBoundingClientRect()).filter(r => r.width > 0);
  const placed = [];
  const clear = r => !texts.concat(placed).some(t => r.left < t.right && r.right > t.left && r.top < t.bottom && r.bottom > t.top);
  l.querySelectorAll('.hot').forEach(h => {
    const n = N[h.dataset.id], hl = h.querySelector(':scope > .hl');
    if (!n || !n.scene || n.id === 'power-button' || !hl) return;
    const x = +hl.getAttribute('x'), y = +hl.getAttribute('y'), w = +hl.getAttribute('width'), ht = +hl.getAttribute('height');
    if (!(w >= 46 && ht >= 34)) return;                  /* too small: the badge would hide the part */
    const g = document.createElementNS(SVGNS_, 'g');
    g.setAttribute('class', 'zb'); g.setAttribute('aria-hidden', 'true');
    g.innerHTML = `<circle r="11"/><g transform="translate(-6.7 -6.7) scale(.56)" fill="none" stroke-width="3" stroke-linecap="round">${ICON.zoom}</g>`;
    h.appendChild(g);
    const spots = [[x + w - 3, y + 3], [x + 3, y + 3], [x + w - 3, y + ht - 3], [x + 3, y + ht - 3]];
    for (const [cx, cy] of spots){
      g.setAttribute('transform', `translate(${cx} ${cy})`);
      const r = g.getBoundingClientRect();
      if (clear(r)){ placed.push(r); return; }
    }
    g.remove();
  });
}

/* ---------- real photos: a button in the bar under the picture, and the photo viewer ---------- */
const photoBtn = document.createElement('button');
photoBtn.type = 'button'; photoBtn.className = 'g-photo'; photoBtn.hidden = true;
bar.insertBefore(photoBtn, bar.firstChild);
function drawPhotoBtn(id){
  const pid = photosFor(id) ? id : photosFor(ITC.owner()) ? ITC.owner() : null;
  photoBtn.hidden = !pid;
  if (!pid) return;
  const ps = PHOTOS[pid];
  photoBtn.dataset.photo = pid; photoBtn.dataset.i = '0';
  photoBtn.innerHTML = `<img src="${PHOTO_BASE + ps[0][0]}" alt="" decoding="async"><span><b>${icon('camera')}Real photo${ps.length > 1 ? 's' : ''}</b><small>of the ${esc(N[pid].name.toLowerCase())}</small></span>`;
  photoBtn.setAttribute('aria-label', `See ${ps.length} real photo${ps.length > 1 ? 's' : ''} of the ${N[pid].name}`);
}
const phv = $('#photos'), phImg = $('#phv-img');
let phv_id = null, phv_i = 0;
function showPhoto(i){
  const ps = PHOTOS[phv_id]; phv_i = (i + ps.length) % ps.length;
  const p = ps[phv_i];
  phImg.src = PHOTO_BASE + p[0]; phImg.width = p[1]; phImg.height = p[2]; phImg.alt = p[3];
  $('#phv-n').textContent = ps.length > 1 ? `Photo ${phv_i + 1} of ${ps.length}` : 'Photo';
  $('#phv-cap').innerHTML = p[3] + '<span class="ph-by">' + photoCredit(p) + '</span>';
  $('#phv-thumbs').querySelectorAll('button').forEach((b, k) => b.classList.toggle('on', k === phv_i));
}
function openPhotos(id, i){
  const ps = photosFor(id); if (!ps) return;
  phv_id = id;
  $('#phv-title').textContent = 'Real photos: ' + N[id].name;
  phv.querySelectorAll('.phv-nav').forEach(b => { b.hidden = ps.length < 2; });
  $('#phv-thumbs').innerHTML = ps.length < 2 ? '' : ps.map((p, k) => `<button type="button" data-k="${k}" aria-label="Photo ${k + 1}"><img src="${PHOTO_BASE + p[0]}" alt=""></button>`).join('');
  showPhoto(i);
  if (!phv.open) phv.showModal();
  track('photo', id);
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-photo]');
  if (!b) return;
  e.preventDefault();
  openPhotos(b.dataset.photo, +b.dataset.i || 0);
});
phv.querySelector('.prev').addEventListener('click', () => showPhoto(phv_i - 1));
phv.querySelector('.next').addEventListener('click', () => showPhoto(phv_i + 1));
$('#phv-thumbs').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) showPhoto(+b.dataset.k); });
$('#phv-close').addEventListener('click', () => phv.close());
phv.addEventListener('click', e => { if (e.target === phv) phv.close(); });
phv.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft'){ e.preventDefault(); showPhoto(phv_i - 1); }
  else if (e.key === 'ArrowRight'){ e.preventDefault(); showPhoto(phv_i + 1); }
});

/* ---------- after every navigation ---------- */
function onNav(id, changed, first){
  visited.add(id);
  store.set('itc-visited', JSON.stringify([...visited]));
  drawProgress();
  html.classList.toggle('g-new', visited.size < NEWCOMER);
  const lv = N[id].level;
  if (lv > deepest){
    deepest = lv;
    if (!first && !tour && LEVEL_NOTE[lv]){
      say(`<b>Level ${lv} of 5 · ${esc(levelName(N[id]))}</b><span>${LEVEL_NOTE[lv]}</span>`);
      track('guide', 'level_' + lv);
    }
  }
  hideRing();
  if (id === 'computer') homeHint = false;
  drawPhotoBtn(id);
  html.classList.toggle('g-html', !svgLayer());
  if (changed){
    addBadges();
    setTimeout(wave, 900);
    ringT = setTimeout(() => showRing(false), onJourney() ? 1300 : 2600);
  }
}
addEventListener('itc:nav', e => onNav(e.detail.id, e.detail.changed, false));
onNav(ITC.cur(), true, true);           /* the first page was opened before this file loaded */

/* nothing over the diagram while an animation plays */
setInterval(() => {
  const busy = ITC.busy();
  if (busy !== html.classList.contains('g-busy')){ html.classList.toggle('g-busy', busy); if (busy) hideRing(); }
}, 400);

/* ---------- the tour's little animated pictures (styles: .ill in css/styles.css) ---------- */
const CUR = '<path class="il-arrow" d="M0 0v15l4-3.6 2.6 6 2.6-1.2-2.6-5.8h5.4Z"/>';
const ILL = {
  /* parts lighting up one after another */
  stage: '<svg class="ill ill-stage" viewBox="0 0 300 96" aria-hidden="true"><rect class="il-frame" x="1" y="1" width="298" height="94" rx="12"/>' +
    [[22,20,64,56],[100,30,46,38],[160,16,58,64],[232,34,48,30]].map(([x,y,w,h], i) =>
      `<g class="il-p" style="animation-delay:${i * .35}s"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7"/></g>`).join('') + '</svg>',
  /* a pointer clicks the CPU, and the picture zooms into it */
  click: '<svg class="ill ill-click" viewBox="0 0 300 96" aria-hidden="true"><rect class="il-frame" x="1" y="1" width="298" height="94" rx="12"/>' +
    '<g class="il-a"><rect class="il-box" x="24" y="16" width="86" height="64" rx="7"/><text x="67" y="52">Monitor</text>' +
    '<rect class="il-box" x="128" y="12" width="150" height="72" rx="8"/><rect class="il-tgt" x="176" y="30" width="44" height="36" rx="5"/><text x="198" y="52">CPU</text></g>' +
    '<g class="il-b"><text class="il-cap" x="150" y="20">Inside the CPU</text>' +
    [['ALU',34],['Registers',112],['Cache',190]].map(([t, x]) => `<rect class="il-box" x="${x}" y="30" width="72" height="48" rx="7"/><text x="${x + 36}" y="58">${t}</text>`).join('') + '</g>' +
    '<circle class="il-rip" cx="198" cy="48" r="8"/><g class="il-cur">' + CUR + '</g></svg>',
  /* a part in the picture, and its explanation filling in beside it */
  panel: '<svg class="ill ill-panel" viewBox="0 0 300 96" aria-hidden="true"><rect class="il-frame" x="1" y="1" width="298" height="94" rx="12"/>' +
    '<rect class="il-box" x="16" y="14" width="150" height="68" rx="8"/><rect class="il-tgt il-blink" x="60" y="30" width="54" height="36" rx="5"/><text x="87" y="52">CPU</text>' +
    '<rect class="il-pan" x="180" y="14" width="104" height="68" rx="8"/><rect class="il-h" x="192" y="24" width="50" height="8" rx="4"/>' +
    [38,50,62,74].map((y, i) => `<rect class="il-l" style="animation-delay:${.3 + i * .25}s" x="192" y="${y}" width="${[80, 72, 78, 50][i]}" height="5" rx="2.5"/>`).join('') + '</svg>',
  /* the map of every part, ticking off the ones you have seen */
  overview: '<svg class="ill ill-ov" viewBox="0 0 300 96" aria-hidden="true"><rect class="il-frame" x="1" y="1" width="298" height="94" rx="12"/>' +
    '<path class="il-tree" d="M40 26v50M40 40h24M40 58h24M40 76h24M150 40v36M150 58h24M150 76h24"/>' +
    [[22,18,'Computer',1],[70,34,'CPU',2],[70,52,'RAM',2],[70,70,'GPU',2],[180,52,'ALU',3],[180,70,'Cache',3]].map(([x, y, t, k], i) =>
      `<g class="il-n" style="animation-delay:${i * .4}s"><circle cx="${x}" cy="${y + 8}" r="5" style="fill:var(--lv-${k})"/><text x="${x + 10}" y="${y + 12}" text-anchor="start">${t}</text><path class="il-tick" d="M${x + 74} ${y + 8}l3 3 6-6"/></g>`).join('') + '</svg>',

};

/* ---------- the guided tour ---------- */
let tour = null;
const union = els => {
  const rs = els.filter(Boolean).map(e => e.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0);
  if (!rs.length) return null;
  const x1 = Math.min(...rs.map(r => r.left)), y1 = Math.min(...rs.map(r => r.top));
  return {left: x1, top: y1, width: Math.max(...rs.map(r => r.right)) - x1, height: Math.max(...rs.map(r => r.bottom)) - y1};
};
const wide = () => innerWidth > 980;
const STEPS = [
  {el: () => [stage], title: () => ITC.owner() === 'computer' ? 'This is a real computer, opened up' : `This is the ${N[ITC.owner()].name}`,
    text: () => {
      if (ITC.owner() === 'computer') return `Everything in this picture is a real part, and <b>every part is clickable</b>. Watch them light up.`;
      if (suggest()) return `Every part with a name is clickable and takes you one level deeper. Watch them light up.`;
      const h = $('#hint').textContent;
      return `This picture is live${h ? `: <b>${esc(h.toLowerCase())}</b>` : ''}. The panel explains what you see.`;
    },
    on: () => setTimeout(wave, 400), pad: 4, ill: 'stage'},
  {el: () => [suggest()], title: () => touch() ? 'Tap a part, then press Inside' : 'Click a part to go inside it',
    text: () => {
      const n = tour && tour.part ? N[tour.part] : null, name = n ? `the <b>${esc(n.name)}</b>` : 'a part';
      return touch()
        ? `Tap ${name} to see what it is, then press <b>Inside</b> to zoom into it. Keep going: you can reach a single logic gate and the real chip it is built from.`
        : `Click ${name} and the picture zooms into it. Then click again, and again: you can reach a single logic gate and the real chip it is built from.`;
    }, pad: 12, ill: 'click'},
  {el: () => wide() ? ['.p-level', '.p-title', '.p-short', '.p-sec'].map(q => $('#panel-inner ' + q)) : [$('#panel-inner .p-level'), $('#panel-inner .p-short')],
    title: () => `Read about the ${N[ITC.cur()].name}`,
    prep: () => {                                           /* bring the description to the top of the panel, past the welcome card */
      const pl = $('#panel-inner .p-level'), panel = $('#panel');
      if (!wide() || !pl) return;
      const d = pl.getBoundingClientRect().top - panel.getBoundingClientRect().top - 14;
      if (Math.abs(d) > 2){ panel.scrollTo({top: panel.scrollTop + d, behavior: 'instant'}); tour.panelMoved = true; }
    },
    clip: () => wide() ? $('#panel') : null,
    text: 'Every part has its own description: what it is, what it does and why it matters, with real examples and photos. Live circuits have a <b>Try it</b> section.', pad: 8, ill: 'panel'},
  {el: () => [$('#btn-overview')], title: 'Jump anywhere',
    text: () => `<b>Overview</b> lists all ${TOTAL} parts as a map. The parts you have explored get a tick.`, pad: 6, ill: 'overview'},
  {el: () => [$('#btn-guide')], title: 'You are ready',
    text: 'See this tour again any time with <b>How to use</b>. Now pick a part and dive in.', pad: 6, last: true},
];
function startTour(from){
  if (tour) return;
  unsay(); hideRing();
  const el = document.createElement('div');
  el.className = 'tour';
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'tour-t');
  el.innerHTML = '<div class="tour-spot"></div><div class="tour-card"><div class="tour-ill"></div><p class="tour-n"></p><h2 id="tour-t"></h2><p class="tour-x"></p>' +
    '<div class="tour-foot"><div class="tour-dots" aria-hidden="true"></div><button type="button" class="tour-skip">Skip tour</button>' +
    '<button type="button" class="btn tour-back">Back</button><button type="button" class="btn btn-p tour-next">Next</button></div></div>';
  document.body.appendChild(el);
  const sug = suggest();
  tour = {el, i: -1, part: sug ? sug.dataset.id : null, steps: STEPS.filter(s => union(s.el())), from};
  html.classList.add('touring');
  el.querySelector('.tour-next').addEventListener('click', () => step(+1));
  el.querySelector('.tour-back').addEventListener('click', () => step(-1));
  el.querySelector('.tour-skip').addEventListener('click', () => endTour(false));
  el.querySelector('.tour-dots').innerHTML = tour.steps.map(() => '<i></i>').join('');
  addEventListener('keydown', onTourKey, true);
  addEventListener('resize', placeTour);
  store.set('itc-tour', 'seen');
  track('guide', 'tour_start_' + from);
  requestAnimationFrame(() => { el.classList.add('show'); step(+1); });
}
function step(d){
  if (!tour) return;
  const i = tour.i + d;
  if (i >= tour.steps.length){ endTour(true); return; }
  if (i < 0) return;
  tour.i = i;
  const s = tour.steps[i], el = tour.el, val = v => typeof v === 'function' ? v() : v;
  el.querySelector('.tour-n').textContent = `Step ${i + 1} of ${tour.steps.length}`;
  el.querySelector('#tour-t').textContent = val(s.title);
  el.querySelector('.tour-x').innerHTML = val(s.text);
  el.querySelector('.tour-ill').innerHTML = s.ill ? ILL[s.ill] : '';
  el.querySelector('.tour-back').hidden = i === 0;
  el.querySelector('.tour-next').textContent = i === tour.steps.length - 1 ? 'Start exploring' : 'Next';
  el.querySelectorAll('.tour-dots i').forEach((dot, k) => dot.classList.toggle('on', k === i));
  if (s.prep) s.prep();
  /* bring the target into view first (on phones the page scrolls) */
  const first = s.el().find(Boolean);
  if (first){
    const r = first.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight * (wide() ? 1 : .55)) first.scrollIntoView({block: wide() ? 'nearest' : 'start', behavior: 'instant'});
  }
  placeTour();
  if (s.on) s.on();
  el.querySelector('.tour-next').focus({preventScroll: true});
}
function placeTour(){
  if (!tour || tour.i < 0) return;
  const s = tour.steps[tour.i], el = tour.el;
  let r = union(s.el());
  const c = s.clip && s.clip();
  if (r && c){                                              /* only the part of it that shows inside the panel */
    const k = c.getBoundingClientRect(), foot = c.querySelector('.panel-foot'), fb = foot ? foot.getBoundingClientRect().height : 0;
    const top = Math.max(r.top, k.top), bot = Math.min(r.top + r.height, k.bottom - fb);
    r = {left: r.left, top, width: r.width, height: Math.max(0, bot - top)};
  }
  const spot = el.querySelector('.tour-spot'), card = el.querySelector('.tour-card');
  if (!r){ step(+1); return; }
  const p = s.pad || 6, vw = innerWidth, vh = innerHeight;
  const sx = Math.max(4, r.left - p), sy = Math.max(4, r.top - p);
  const sw = Math.min(vw - 4, r.left + r.width + p) - sx, sh = Math.min(vh - 4, r.top + r.height + p) - sy;
  Object.assign(spot.style, {left: sx + 'px', top: sy + 'px', width: sw + 'px', height: sh + 'px'});
  if (vw <= 600) return;                                  /* phones: the card is fixed at the bottom (CSS) */
  const cw = card.offsetWidth, ch = card.offsetHeight, g = 16;
  const opts = [
    [sx + sw / 2 - cw / 2, sy + sh + g, vh - (sy + sh) >= ch + g + 8],   /* below */
    [sx + sw / 2 - cw / 2, sy - g - ch, sy >= ch + g + 8],               /* above */
    [sx + sw + g, sy + sh / 2 - ch / 2, vw - (sx + sw) >= cw + g + 8],   /* right */
    [sx - g - cw, sy + sh / 2 - ch / 2, sx >= cw + g + 8],               /* left */
  ];
  let [x, y] = (opts.find(o => o[2]) || [vw - cw - 20, vh - ch - 20]);
  x = Math.max(12, Math.min(vw - cw - 12, x)); y = Math.max(12, Math.min(vh - ch - 12, y));
  card.style.left = x + 'px'; card.style.top = y + 'px';
}
function onTourKey(e){
  if (!tour) return;
  if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); endTour(false); }
  else if (e.key === 'ArrowRight'){ e.preventDefault(); e.stopPropagation(); step(+1); }
  else if (e.key === 'ArrowLeft'){ e.preventDefault(); e.stopPropagation(); step(-1); }
  else if (e.key === 'Tab'){                              /* keep focus on the card's buttons */
    const bs = [...tour.el.querySelectorAll('button')].filter(b => !b.hidden);
    const k = bs.indexOf(document.activeElement);
    e.preventDefault(); e.stopPropagation();
    bs[(k + (e.shiftKey ? -1 : 1) + bs.length) % bs.length].focus();
  }
}
function endTour(done){
  if (!tour) return;
  const el = tour.el;
  track('guide', done ? 'tour_done' : 'tour_skip_' + (tour.i + 1));
  removeEventListener('keydown', onTourKey, true);
  removeEventListener('resize', placeTour);
  el.classList.remove('show');
  setTimeout(() => el.remove(), 350);
  if (tour.panelMoved) $('#panel').scrollTo({top: 0, behavior: 'instant'});
  tour = null;
  html.classList.remove('touring');
  if (!wide()) scrollTo({top: 0, behavior: 'instant'});
  setTimeout(() => { wave(); showRing(visited.size < NEWCOMER * 2); }, 450);
}

/* ---------- buttons: "How to use", and the welcome card's ---------- */
$('#btn-guide').addEventListener('click', () => startTour('help'));
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-guide]');
  if (!b) return;
  e.preventDefault();
  if (b.dataset.guide === 'tour') startTour('welcome');
  else if (b.dataset.guide === 'power'){
    track('guide', 'welcome_power');
    if (!wide()) stage.scrollIntoView({block: 'start', behavior: 'instant'});
    if (ITC.owner() !== 'computer'){ ITC.go('computer'); setTimeout(ITC.powerOn, 900); }
    else ITC.powerOn();
  }
});

/* ---------- the first visit ---------- */
function firstVisit(){
  const q = new URLSearchParams(location.search);
  if (!q.has('tour') && store.get('itc-tour') === 'seen') return;
  if (ITC.cur() === 'computer' || q.has('tour')){ setTimeout(() => startTour('auto'), 500); return; }
  /* opened straight on a part's page (from a search, say): offer the tour instead of starting it */
  store.set('itc-tour', 'seen');
  say(`<b>New here?</b><span>Every part in the picture is clickable.</span><button type="button" class="g-toast-go">Show me how</button>` +
    `<button type="button" class="g-toast-x" aria-label="Close">×</button>`, 14000);
  toast.querySelector('.g-toast-go').addEventListener('click', () => startTour('invite'));
  toast.querySelector('.g-toast-x').addEventListener('click', unsay);
}
if (ITC.introPending) addEventListener('itc:intro-done', firstVisit, {once: true});
else setTimeout(firstVisit, 900);
})();
