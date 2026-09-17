/* ==========================================================
   scenes/common.js
   SVG drawing helpers shared by every scene.
   Each scene is a function SCENES[key](node) returning
   { svg: '<svg markup inside a 1000×700 viewBox>', init?(svgEl, node) }.
   Clickable parts use hot(id, box, inner); interactive controls
   use the class "ctl" so clicks on them never navigate.
   ========================================================== */
var SCENES = {};
var SIM = {};                         /* remembered switch states per part */
var SVGNS = 'http://www.w3.org/2000/svg';
var REDUCED = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const R = (x,y,w,h,rx,c,e='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="${c}" ${e}/>`;
const T = (x,y,s,c='t',e='') => `<text x="${x}" y="${y}" class="${c}" ${e}>${s}</text>`;
const C = (cx,cy,r,c,e='') => `<circle cx="${cx}" cy="${cy}" r="${r}" class="${c}" ${e}/>`;
const P = (d,c,e='') => `<path d="${d}" class="${c}" ${e}/>`;

/* Clickable part. boxes: [x,y,w,h] or a list of them (highlight rings). */
function hot(id, boxes, inner, o={}){
  const n = N[id]; if (!n) return inner;
  if (typeof boxes[0] === 'number') boxes = [boxes];
  const pad = o.pad ?? 8;
  const hl = boxes.map(b => `<rect class="hl" x="${b[0]-pad}" y="${b[1]-pad}" width="${b[2]+2*pad}" height="${b[3]+2*pad}" rx="${o.rx ?? 12}"/>`).join('');
  const hit = o.hit ? boxes.map(b => R(b[0]-4,b[1]-4,b[2]+8,b[3]+8,8,'hit')).join('') : '';
  const label = (o.label || n.name).replace(/"/g,'');
  return `<g class="hot${o.flat?' flat':''}" data-id="${id}" tabindex="0" role="button" aria-label="${label}. ${(n.tip||'').replace(/"/g,'')}">${hit}${inner}${hl}</g>`;
}

/* ---------- logic-gate symbols (ANSI shapes, 80 units tall) ---------- */
const GS = {
  AND:{p:'M0 0H50A40 40 0 0 1 50 80H0Z',o:90,i:0},
  OR:{p:'M0 0C40 0 75 15 95 40C75 65 40 80 0 80C15 55 15 25 0 0Z',o:95,i:10},
  XOR:{p:'M12 0C52 0 87 15 107 40C87 65 52 80 12 80C27 55 27 25 12 0Z',back:'M0 0C15 25 15 55 0 80',o:107,i:22},
  NOT:{p:'M0 6L80 40L0 74Z',o:80,i:0},
};
const EXPR_SVG = {AND:'A · B',OR:'A + B',NOT:'<tspan class="ol">A</tspan>',NAND:'<tspan class="ol">A · B</tspan>',
  NOR:'<tspan class="ol">A + B</tspan>',XOR:'A ⊕ B',XNOR:'<tspan class="ol">A ⊕ B</tspan>'};
/* depth: gate-delay stage used by the propagation animation */
function gsym(type, x, y, s=1, sw=2.5, depth=0){
  const base = type === 'XNOR' ? 'XOR' : type.replace(/^N(?=AND|OR)/,'');
  const g = GS[base], bub = /^(NAND|NOR|XNOR|NOT)$/.test(type), out = g.o + (bub ? 13.5 : 0);
  const ve = `stroke-width="${sw}" vector-effect="non-scaling-stroke"`;
  let svg = `<g class="gate-g"${depth?` data-gd="${depth}"`:''} transform="translate(${x} ${y}) scale(${s})">`;
  if (g.back) svg += `<path d="${g.back}" class="g-back" ${ve}/>`;
  svg += `<path d="${g.p}" class="g-body" ${ve}/>`;
  if (bub) svg += `<circle cx="${g.o+6.5}" cy="40" r="6.5" class="g-bub" ${ve}/>`;
  svg += '</g>';
  const ix = x + (g.i+4)*s;
  return {svg, a:[ix,y+20*s], b:[ix,y+60*s], i:[ix,y+40*s], o:[x+out*s,y+40*s], w:out*s};
}

/* Wires: `sig` names the signal; `d` is the gate-delay stage at which it updates.
   A second polyline shows gently moving dashes while the wire carries a 1. */
function W(pts, sig, d=0){
  const p = pts.map(q => q.join(',')).join(' ');
  return `<polyline class="wire" data-s="${sig}"${d?` data-d="${d}"`:''} points="${p}"/><polyline class="flow" points="${p}"/>`;
}
const J = (x,y,sig,d=0) => `<circle class="junc" data-s="${sig}"${d?` data-d="${d}"`:''} cx="${x}" cy="${y}" r="5"/>`;

function sw(x, y, k, label, sub='', showLabel=true){
  return `${showLabel ? `<text class="t t-lg t-end" x="${x-12}" y="${y+24}">${label}${sub?`<tspan class="t-sm" dy="5">${sub}</tspan>`:''}</text>` : ''}
  <g class="ctl sw" data-k="${k}" role="switch" tabindex="0" aria-checked="false" aria-label="Input ${label}${sub}">
  <rect class="hit" x="${x-8}" y="${y-8}" width="74" height="48" rx="20"/>
  <rect class="sw-track" x="${x}" y="${y}" width="58" height="32" rx="16"/><circle class="sw-knob" cx="${x+16}" cy="${y+16}" r="11"/>
  <text class="sw-val" x="${x+16}" y="${y+21}">0</text></g>`;
}
function led(cx, cy, k, label, d=0, below=true){
  const dd = d ? ` data-d="${d}"` : '';
  return `<circle class="led-c" data-led="${k}"${dd} cx="${cx}" cy="${cy}" r="22"/><text class="led-v" data-lv="${k}"${dd} x="${cx}" y="${cy+5.5}">0</text>
  ${T(cx, below ? cy+50 : cy-34, label, 't t-mid')}`;
}
/* Clickable bit cell (k = state key). ro = read-only display. */
function bitCell(x, y, k, label, ro=false, w=48, h=48){
  return `<g class="bitc${ro?' ro':''}" ${ro?`data-bit="${k}"`:`data-k="${k}" role="switch" tabindex="0" aria-checked="false" aria-label="${label}"`}>
    ${R(x,y,w,h,8,'')}<text x="${x+w/2}" y="${y+h/2+8}">0</text></g>`;
}
function btnS(x, y, w, h, label, attrs=''){
  return `<g class="ctl btn-s" role="button" tabindex="0" ${attrs}>${R(x,y,w,h,10,'')}${T(x+w/2,y+h/2+5.5,label,'')}</g>`;
}
function dip(x, y, w, h, pins){
  const per = pins/2, pitch = w/per; let s = '';
  for (let i=0;i<per;i++){ const px = x+pitch*(i+.5)-4; s += R(px,y-9,8,10,1.5,'m-pin') + R(px,y+h-1,8,10,1.5,'m-pin'); }
  return s + R(x,y,w,h,5,'m-ic') + P(`M${x} ${y+h/2-9}a9 9 0 0 1 0 18Z`,'m-notch');
}
function chipHot(id, x, y){
  const c = CHIPS[id]; if (!c) return '';
  return hot(id,[x-10,y-26,180,114], `${T(x,y-6,'Real chip','t t-sm t-mut')}${dip(x,y+12,150,50,c.labels.length)}${T(x+75,y+43,c.part,'t t-sm t-inv t-mid')}`, {hit:true, label:`${c.part} chip`});
}
/* Split text into lines of at most `max` characters */
function wrap(text, max){
  const words = text.split(' '), lines = ['']; 
  words.forEach(w => { const l = lines[lines.length-1]; if ((l + ' ' + w).trim().length > max) lines.push(w); else lines[lines.length-1] = (l + ' ' + w).trim(); });
  return lines;
}
function tspans(lines, x, lh){ return lines.map((l,i) => `<tspan x="${x}" dy="${i ? lh : 0}">${l}</tspan>`).join(''); }

/* Toggle handler for any element with data-k (switches and bit cells) */
function onToggle(el, fn){
  el.querySelectorAll('.sw,.bitc[data-k]').forEach(s => {
    const tog = e => { e.stopPropagation(); fn(s.dataset.k); };
    s.addEventListener('click', tog);
    s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); tog(e); } });
  });
}
function onPress(elm, fn){
  const act = e => { e.stopPropagation(); fn(e); };
  elm.addEventListener('click', act);
  elm.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); act(e); } });
}

/* Connect a circuit to its state.
   compute(st) returns a map of signal values plus `key` (truth-table row).
   opts.step(st) = ms per gate delay; elements with data-d update after d steps. */
function bindSim(el, id, init, compute, opts={}){
  const st = SIM[id] || (SIM[id] = Object.assign({}, init));
  let timers = [];
  const setEl = (e, sig) => {
    if (e.dataset.s !== undefined) e.classList.toggle('on', !!sig[e.dataset.s]);
    if (e.dataset.led !== undefined) e.classList.toggle('on', !!sig[e.dataset.led]);
    if (e.dataset.lv !== undefined) e.textContent = sig[e.dataset.lv] ? 1 : 0;
    if (e.dataset.txt !== undefined) e.innerHTML = sig[e.dataset.txt] ?? '';
    if (e.dataset.bit !== undefined){ const v = sig[e.dataset.bit] ? 1 : 0; e.classList.toggle('on', !!v); e.querySelector('text').textContent = v; }
  };
  const upd = (animate) => {
    const sig = compute(st);
    timers.forEach(clearTimeout); timers = [];
    el.querySelectorAll('.sw,.bitc[data-k]').forEach(s => { const v = st[s.dataset.k] ? 1 : 0; s.classList.toggle('on', !!v); s.setAttribute('aria-checked', v ? 'true' : 'false');
      const t = s.querySelector('.sw-val') || s.querySelector('text'); if (t) t.textContent = v; });
    const step = opts.step ? opts.step(st) : 0;
    const els = el.querySelectorAll('[data-s],[data-led],[data-lv],[data-txt],[data-bit]');
    el.querySelectorAll('.gate-g.eval').forEach(g => g.classList.remove('eval'));
    if (!animate || !step || REDUCED) els.forEach(e => setEl(e, sig));
    else {
      els.forEach(e => { const d = +(e.dataset.d || 0); if (!d) setEl(e, sig); else timers.push(setTimeout(() => setEl(e, sig), d*step)); });
      el.querySelectorAll('.gate-g[data-gd]').forEach(g => { const d = +g.dataset.gd;
        timers.push(setTimeout(() => g.classList.add('eval'), (d-1)*step + 20));
        timers.push(setTimeout(() => g.classList.remove('eval'), d*step)); });
    }
    if (typeof syncTable === 'function') syncTable(id, sig.key);
    if (opts.after) opts.after(sig, st);
  };
  onToggle(el, k => { st[k] ^= 1; upd(true); });
  upd(false);
  return {st, upd};
}

/* ---------- name labels (pills) ----------
   Put labels in a final <g class="labels"> so they are painted on top of every
   component. data-for links a label to its part: hovering or clicking the label
   acts on the part, and the label follows the part when it is dragged. */
const plainLen = s => s.replace(/<[^>]+>/g,'').replace(/&[a-z]+;/g,'x').length;
function LB(x, y, text, o={}){
  const size = o.size || 16, dot = o.dot ? 16 : 0;
  const w = Math.round(plainLen(text) * size * 0.6 + 22 + dot), h = size + 14;
  const x0 = o.anchor === 'start' ? x : o.anchor === 'end' ? x - w : x - w/2;
  return `<g class="lbl"${o.for ? ` data-for="${o.for}"` : ''}>${R(x0, y-h/2, w, h, h/2, '')}` +
    (o.dot ? `<circle class="lbl-dot ${o.dot}" cx="${x0+15}" cy="${y}" r="5.5"/>` : '') +
    `<text x="${x0 + 11 + dot}" y="${y + size*0.36}" style="font-size:${size}px">${text}</text></g>`;
}
const LAYER = labels => `<g class="labels">${labels}</g>`;
/* Wrap a part so the user can drag it */
const DW = (id, markup) => `<g class="dragwrap" data-drag="${id}">${markup}</g>`;
