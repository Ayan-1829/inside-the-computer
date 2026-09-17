/* ==========================================================
   scenes/chips.js
   The physical-chip view. Two views, switched with buttons:
   - Pin diagram: DIP packages up to 20 pins are drawn horizontally,
     24–40 pins vertically (like a datasheet), 3-pin regulators as TO-220.
   - Inside the chip: gate chips show each gate wired to its real pins;
     other chips show a block diagram built from CHIPS[id].inside.
   ========================================================== */
const PIN_KIND = {i:'in', o:'out', b:'bi', p:'pwr', n:'nc'};
const pinLabel = l => l.split('/').map(p => p.startsWith('~') ? `<tspan class="ol">${esc(p.slice(1))}</tspan>` : esc(p)).join('/');
const plainPin = l => l.replace(/~/g,'not ');

function chipUnits(c){
  const n = c.labels.length, power = c.power || [n/2, n];
  return power.length ? c.units.concat([['Power', power]]) : c.units.slice();
}
function describeUnit(c, name, ps){
  const lst = a => a.length > 1 ? a.slice(0,-1).join(', ') + ' and ' + a[a.length-1] : a[0];
  if (name === 'Power') return 'Power: ' + ps.map(p => `pin ${p} (${c.labels[p-1]})`).join(', ') + '.';
  const by = k => ps.filter(p => c.kinds[p-1] === k), parts = [];
  [['i','input'],['o','output'],['b','two-way (in and out)'],['n','other']].forEach(([k, word]) => { const a = by(k);
    if (a.length) parts.push(`${word}${a.length > 1 && k !== 'b' && k !== 'n' ? 's' : ''} on pin${a.length > 1 ? 's' : ''} ${lst(a)}`); });
  return `${name}: ${parts.join('; ')}.`;
}

/* ---------- pin diagram ---------- */
function pinViewH(c){
  const pins = c.labels.length, per = pins/2, w = pins <= 16 ? 500 : 600, x0 = 500 - w/2, pitch = w/per;
  let s = `<g class="bg">${T(500,140,'Top view, notch on the left. Pins count anticlockwise from pin 1.','t t-sm t-mut t-mid')}</g>`;
  s += R(x0,240,w,160,10,'m-ic') + P(`M${x0} 302a18 18 0 0 1 0 36Z`,'m-notch') + C(x0+26,376,7,'m-dot');
  s += T(500,320,c.part,'t t-xl t-inv t-mid') + T(500,352,c.desc,'t t-sm t-inv t-mid','style="opacity:.8"');
  for (let p = 1; p <= pins; p++){
    const bottom = p <= per, i = bottom ? p-1 : pins-p, cx = x0 + pitch*(i+.5);
    const py = bottom ? 400 : 204, ly = bottom ? 470 : 186, ny = bottom ? 390 : 263, lab = c.labels[p-1], two = lab.includes(' ');
    const txt = two ? (([a,b]) => `<tspan x="${cx}" dy="${bottom ? 0 : -17}">${pinLabel(a)}</tspan><tspan x="${cx}" dy="17">${esc(b)}</tspan>`)(lab.split(' ')) : pinLabel(lab);
    s += `<g class="pin ${PIN_KIND[c.kinds[p-1]]}" data-pin="${p}"><title>Pin ${p}: ${esc(plainPin(lab))}</title>${R(cx-12,py,24,36,3,'m-pin')}
      <text class="pin-l" x="${cx}" y="${ly}"${two || lab.length > 5 ? ' style="font-size:15px"' : ''}>${txt}</text>${T(cx,ny,p,'t t-xs t-inv t-mid t-num')}</g>`;
  }
  const units = chipUnits(c), bw = Math.min(124, 820/units.length - 10), total = units.length*(bw+10)-10, bx = 500-total/2;
  units.forEach(([name],i) => { s += `<g class="ctl btn-s ukey" data-u="${i}" role="button" tabindex="0" aria-label="Highlight ${esc(name)} pins">${R(bx+i*(bw+10),512,bw,44,10,'')}${T(bx+i*(bw+10)+bw/2,539,esc(name),'', name.length > 11 ? 'style="font-size:13.5px"' : '')}</g>`; });
  s += `<g class="bg">${T(500,600,'','t t-sm t-mid','data-info="1"')}</g>`;
  return s + legend(500, 648);
}
function pinViewV(c){
  const pins = c.labels.length, per = pins/2, top = 132, h = 492, pitch = h/per;
  let s = `<g class="bg">${T(40,150,'Top view, notch at the top.','t t-sm t-mut')}${T(40,172,'Pin 1 is top left; pins count','t t-sm t-mut')}${T(40,194,'down the left and up the right.','t t-sm t-mut')}</g>`;
  s += R(420,top,160,h,10,'m-ic') + P(`M482 ${top}a18 18 0 0 0 36 0Z`,'m-notch') + C(440,top+22,7,'m-dot');
  s += `<text class="t t-xl t-inv t-mid" transform="translate(508 ${top+h/2}) rotate(-90)">${c.part}</text><text class="t t-sm t-inv t-mid" style="opacity:.8" transform="translate(540 ${top+h/2}) rotate(-90)">${esc(c.desc)}</text>`;
  for (let p = 1; p <= pins; p++){
    const left = p <= per, k = left ? p-1 : pins-p, cy = top + pitch*(k+.5), lab = c.labels[p-1];
    const px = left ? 398 : 580, lx = left ? 390 : 610, nx = left ? 434 : 566;
    s += `<g class="pin ${PIN_KIND[c.kinds[p-1]]}" data-pin="${p}"><title>Pin ${p}: ${esc(plainPin(lab))}</title>${R(px,cy-5,22,10,2,'m-pin')}
      <text class="pin-l" x="${lx}" y="${cy+5.5}" style="text-anchor:${left ? 'end' : 'start'};font-size:${pitch < 30 ? 15 : 16}px">${pinLabel(lab)}</text>${T(nx,cy+5,p,'t t-xs t-inv t-mid t-num', pitch < 30 ? 'style="font-size:12px"' : '')}</g>`;
  }
  const units = chipUnits(c);
  units.forEach(([name],i) => { s += `<g class="ctl btn-s ukey" data-u="${i}" role="button" tabindex="0" aria-label="Highlight ${esc(name)} pins">${R(760,140+i*48,210,40,10,'')}${T(865,165+i*48,esc(name),'', name.length > 18 ? 'style="font-size:14px"' : '')}</g>`; });
  s += `<text class="t t-sm" x="40" y="250" data-info="1" data-wrap="30"></text>`;
  return s + legend(40, 520, true);
}
function pinViewTO220(c){
  let s = `<g class="bg">${T(740,250,'Front view, legs down.','t t-sm t-mut')}${T(740,274,'Pin 1 is on the left.','t t-sm t-mut')}</g>`;
  s += R(420,124,160,64,6,'m-metal') + C(500,152,14,'','style="fill:var(--surface)"') + R(410,176,180,170,8,'m-ic');
  s += T(500,256,c.part,'t t-xl t-inv t-mid') + T(500,288,esc(c.desc),'t t-sm t-inv t-mid','style="opacity:.8"');
  [440,500,560].forEach((x,i) => { const p = i+1;
    s += `<g class="pin ${PIN_KIND[c.kinds[i]]}" data-pin="${p}"><title>Pin ${p}: ${c.labels[i]}</title>${R(x-8,346,16,150,3,'m-pin')}
      <text class="pin-l" x="${x}" y="524">${esc(c.labels[i])}</text>${T(x,548,p,'t t-xs t-mut t-mid t-num')}</g>`; });
  const units = chipUnits(c), bw = 150, bx = 500 - (units.length*(bw+10)-10)/2;
  units.forEach(([name],i) => { s += `<g class="ctl btn-s ukey" data-u="${i}" role="button" tabindex="0" aria-label="Highlight ${esc(name)} pin">${R(bx+i*(bw+10),572,bw,42,10,'')}${T(bx+i*(bw+10)+bw/2,598,esc(name),'')}</g>`; });
  s += `<g class="bg">${T(500,650,'','t t-sm t-mid','data-info="1"')}</g>`;
  return s;
}
function legend(x, y, vertical){
  const items = [['var(--pin-in)','Input'],['var(--pin-out)','Output'],['var(--pin-bi)','Two-way'],['var(--pin-pwr)','Power'],['var(--pin-nc)','Other']];
  return `<g class="bg">${items.map(([col,t],i) => { const ix = vertical ? x : x - 250 + i*110, iy = vertical ? y + i*26 : y;
    return `<circle cx="${ix+7}" cy="${iy-5}" r="7" style="fill:${col}"/>${T(ix+20,iy,t,'t t-xs')}`; }).join('')}</g>`;
}

/* ---------- inside: gate chips (logic diagram) ---------- */
function insideGates(c){
  const pins = c.labels.length, per = pins/2, w = 560, x0 = 220, pitch = w/per, yT = 196, yB = 470;
  const px = p => { const bottom = p <= per, i = bottom ? p-1 : pins-p; return x0 + pitch*(i+.5); };
  let s = `<g class="bg">${T(500,650,'Logic diagram from the datasheet: every gate is wired to its own pins.','t t-sm t-mut t-mid')}</g>`;
  s += R(x0,yT,w,yB-yT,12,'chip-body-in') + P(`M${x0} ${(yT+yB)/2-18}a18 18 0 0 1 0 36Z`,'m-notch');
  for (let p = 1; p <= pins; p++){
    const bottom = p <= per, x = px(p), lab = c.labels[p-1];
    s += `<g class="pin ${PIN_KIND[c.kinds[p-1]]}" data-pin="${p}">${R(x-10, bottom ? yB : yT-30, 20, 30, 3,'m-pin')}
      <text class="pin-l" x="${x}" y="${bottom ? yB+54 : yT-40}" style="font-size:15px">${pinLabel(lab)}</text>${T(x, bottom ? yB+76 : yT-62, p, 't t-xs t-mut t-mid t-num')}</g>`;
  }
  const g = c.gate, wires = [], syms = [];
  c.units.forEach(([, ps]) => {
    const ins = ps.slice(0, -1), out = ps[ps.length-1], bottom = out <= per;
    const xs = ps.map(px), cx = xs.reduce((a,b) => a+b, 0) / xs.length, mirror = px(out) < ins.map(px).reduce((a,b) => a+b, 0) / ins.length;
    const sc = .6, sym = gsym(g, 0, 0, sc, 2.4), gw = sym.w, gh = 80*sc, gy = bottom ? yB - 110 : yT + 110 - gh, gx = cx - gw/2;
    const tf = mirror ? `translate(${gx + gw} ${gy}) scale(-1 1)` : `translate(${gx} ${gy})`;
    syms.push(`<g transform="${tf}">${sym.svg}</g>`);
    const map = ([x, y]) => mirror ? [gx + gw - x, gy + y] : [gx + x, gy + y];
    const term = ins.length === 1 ? [map(sym.i)] : [map(sym.a), map(sym.b)], o = map(sym.o), edge = bottom ? yB : yT, dir = bottom ? 1 : -1;
    ins.forEach((p, k) => { const [tx, ty] = term[k], jx = tx + (mirror ? 14 + k*7 : -14 - k*7), jy = (bottom ? gy + gh : gy) + dir*(14 + k*10);
      wires.push(`M${px(p)} ${edge}V${jy}H${jx}V${ty}H${tx}`); });
    const ox = o[0] + (mirror ? -14 : 14), jy = (bottom ? gy + gh : gy) + dir*34;
    wires.push(`M${o[0]} ${o[1]}H${ox}V${jy}H${px(out)}V${edge}`);
  });
  s += `<path class="ia" d="${wires.join('')}"/>` + syms.join('');
  const vcc = c.labels.indexOf('VCC') + 1, gnd = c.labels.indexOf('GND') + 1;
  s += `<g class="bg">${T(500, (yT+yB)/2 + 6, `Pin ${vcc} (VCC) and pin ${gnd} (GND) power every gate.`, 't t-xs t-mut t-mid')}</g>`;
  return s;
}

/* ---------- inside: block diagram ---------- */
function insideBlocks(c){
  const D = c.inside, T0 = 156, H = 392;
  const maxLen = list => Math.max(0, ...(list || []).map(e => e[0].length));
  const L = D.left ? Math.max(130, 52 + maxLen(D.left) * 8.4) : 110, Rr = D.right ? Math.min(870, 948 - maxLen(D.right) * 8.4) : 890;
  const B = {}, nC = D.cols.length, colW = (Rr - L) / nC, bw = Math.min(colW - 44, 196);
  D.cols.forEach((col, j) => {
    const n = col.length, gap = 28, bh = Math.min(118, (H - (n-1)*gap) / n), y0 = T0 + (H - (n*bh + (n-1)*gap)) / 2;
    col.forEach((b, i) => { const x = L + colW*j + (colW - bw)/2, y = y0 + i*(bh + gap); B[b.id] = Object.assign({x, y, w:bw, h:bh, cx:x + bw/2, cy:y + bh/2, col:j, last:i === n-1}, b); });
  });
  const head = (x, y, dir) => ({r:`M${x-9} ${y-5}L${x} ${y}L${x-9} ${y+5}Z`, l:`M${x+9} ${y-5}L${x} ${y}L${x+9} ${y+5}Z`,
    d:`M${x-5} ${y-9}L${x} ${y}L${x+5} ${y-9}Z`, u:`M${x-5} ${y+9}L${x} ${y}L${x+5} ${y+9}Z`})[dir];
  const flip = {r:'l', l:'r', u:'d', d:'u'};
  let lines = '', heads = '';
  const seen = new Set();
  (D.arrows || []).forEach(([a, b, both]) => {
    const A = B[a], Z = B[b]; if (!A || !Z) return;
    const off = seen.has(b + '>' + a) ? 10 : 0; seen.add(a + '>' + b);
    let d, end, start;
    if (Z.col > A.col){ const sx = A.x + A.w, ex = Z.x, sy = A.cy + off, ey = Z.cy + off, mx = (sx + ex)/2; d = `M${sx} ${sy}H${mx}V${ey}H${ex}`; end = [ex, ey, 'r']; start = [sx, sy, 'l']; }
    else if (Z.col < A.col){ const sx = A.x, ex = Z.x + Z.w, sy = A.cy + off, ey = Z.cy + off, mx = (sx + ex)/2; d = `M${sx} ${sy}H${mx}V${ey}H${ex}`; end = [ex, ey, 'l']; start = [sx, sy, 'r']; }
    else { const down = Z.y > A.y, x = A.cx + off, sy = down ? A.y + A.h : A.y, ey = down ? Z.y : Z.y + Z.h; d = `M${x} ${sy}V${ey}`; end = [x, ey, down ? 'd' : 'u']; start = [x, sy, down ? 'u' : 'd']; }
    lines += d; heads += P(head(...end),'ia-h'); if (both) heads += P(head(...start),'ia-h');
  });
  const pinArrow = (kind, into) => kind === 'out' ? (into ? 'from' : 'to') : kind === 'bi' ? 'both' : (into ? 'to' : 'from');
  let labels = '';
  const side = (list, isLeft) => {
    const byT = {};
    list.forEach(e => { const t = Array.isArray(e[2]) ? e[2][0] : e[2]; (byT[t] = byT[t] || []).push(e); });
    Object.values(byT).forEach(group => group.forEach((e, k) => {
      const [label, kind, tgt] = e, targets = Array.isArray(tgt) ? tgt : [tgt], first = B[targets[0]];
      const ly = first.cy + (k - (group.length-1)/2) * 30, lx = isLeft ? L - 26 : Rr + 26;
      labels += `<text class="ipin ${kind}" x="${lx}" y="${ly+5}" text-anchor="${isLeft ? 'end' : 'start'}">${esc(label)}</text>`;
      targets.forEach((id, t) => { const Z = B[id], ex = isLeft ? Z.x : Z.x + Z.w, ey = Math.max(Z.y + 10, Math.min(Z.y + Z.h - 10, Z.cy + (ly - first.cy))), tx = isLeft ? L - 18 : Rr + 18;
        const edge = isLeft ? Z.col === 0 : Z.col === nC - 1;
        if (edge){ const mx = isLeft ? Math.min(ex - 12, tx + 14 + k*6) : Math.max(ex + 12, tx - 14 - k*6); lines += `M${tx} ${ly}H${mx}V${ey}H${ex}`; }
        else {   /* the target is not in the outer column: run the wire below all the blocks */
          const yb = T0 + H + 12 + (k + t) * 7, gx = isLeft ? Z.x - 12 - t*5 : Z.x + Z.w + 12 + t*5, sx = isLeft ? tx + 8 : tx - 8;
          lines += `M${tx} ${ly}H${sx}V${yb}H${gx}V${ey}H${ex}`; }
        const dirIn = isLeft ? 'r' : 'l', how = pinArrow(kind, true);
        if (how === 'to' || how === 'both') heads += P(head(ex, ey, dirIn),'ia-h');
        if (how === 'from' || how === 'both') heads += P(head(tx, ly, flip[dirIn]),'ia-h'); });
    }));
  };
  if (D.left) side(D.left, true);
  if (D.right) side(D.right, false);
  (D.bottom || []).forEach((e, k) => {
    const [label, kind, tgt] = e, targets = Array.isArray(tgt) ? tgt : [tgt], n = (D.bottom || []).length;
    const lx = 500 + (k - (n-1)/2) * Math.min(230, 780 / n), ly = 612;
    labels += `<text class="ipin ${kind}" x="${lx}" y="${ly}" text-anchor="middle">${esc(label)}</text>`;
    targets.forEach((id, t) => { const Z = B[id], ex = Z.cx + (t - (targets.length-1)/2) * 16;
      if (Z.last){ lines += `M${lx} ${ly-18}V${ly-30}H${ex}V${Z.y + Z.h}`; }
      else { const sx = Z.x - 12; lines += `M${lx} ${ly-18}V${ly-30}H${sx}V${Z.cy}H${Z.x}`; }
      const end = Z.last ? [ex, Z.y + Z.h, 'u'] : [Z.x, Z.cy, 'r'];
      if (kind !== 'out') heads += P(head(...end),'ia-h'); else heads += P(head(lx, ly - 18, 'd'),'ia-h'); });
  });
  let groups = '';
  (D.groups || []).forEach(([title, ids]) => { const bs = ids.map(i => B[i]);
    const x = Math.min(...bs.map(b => b.x)) - 14, y = Math.min(...bs.map(b => b.y)) - 14, x2 = Math.max(...bs.map(b => b.x + b.w)) + 14, y2 = Math.max(...bs.map(b => b.y + b.h)) + 14;
    groups += `<rect x="${x}" y="${y}" width="${x2-x}" height="${y2-y}" rx="16" class="ln-dash" style="fill:none"/>${T(x+8, y-8, esc(title), 't t-xs t-mut')}`; });
  let blocks = '';
  Object.values(B).forEach(b => {
    const tl = b.t.split('\n'), sl = b.s ? b.s.split('\n') : [], tot = tl.length*18 + sl.length*16, y0 = b.cy - tot/2 + 13;
    blocks += R(b.x, b.y, b.w, b.h, 10, 'ib' + (b.k ? ' ' + b.k : ''));
    tl.forEach((t, i) => blocks += `<text class="ib-t" x="${b.cx}" y="${y0 + i*18}">${esc(t)}</text>`);
    sl.forEach((t, i) => blocks += `<text class="ib-s" x="${b.cx}" y="${y0 + tl.length*18 + i*16 + 2}">${esc(t)}</text>`);
  });
  return `${groups}<path class="ia" d="${lines}"/>${heads}${blocks}${labels}<g class="bg">${T(500,668,'Simplified block diagram of the inside of the chip.','t t-xs t-mut t-mid')}</g>`;
}

SCENES.ic = (n) => {
  const c = CHIPS[n.id];
  const pinsSvg = c.to220 ? pinViewTO220(c) : c.labels.length >= 24 ? pinViewV(c) : pinViewH(c);
  const inside = c.inside === 'gates' ? insideGates(c) : c.inside ? insideBlocks(c) : '';
  let s = `<g class="icv" data-view="pins">${pinsSvg}</g>`;
  if (inside) s += `<g class="icv" data-view="inside" style="display:none">${inside}</g>` +
    btnS(372,62,138,40,'Pin diagram','data-show="pins" aria-pressed="true"') + btnS(520,62,168,40,'Inside the chip','data-show="inside" aria-pressed="false"');
  return {svg:s, init: el => {
    const key = 'icview:' + n.id, units = chipUnits(c), info = el.querySelector('[data-info]');
    const setInfo = t => { if (!info) return; if (info.dataset.wrap) info.innerHTML = tspans(wrap(t, +info.dataset.wrap), 40, 22); else info.textContent = t; };
    const setView = v => { SIM[key] = v; el.querySelectorAll('.icv').forEach(g => g.style.display = g.dataset.view === v ? '' : 'none');
      el.querySelectorAll('[data-show]').forEach(b => { b.classList.toggle('on', b.dataset.show === v); b.setAttribute('aria-pressed', b.dataset.show === v ? 'true' : 'false'); }); };
    el.querySelectorAll('[data-show]').forEach(b => onPress(b, () => setView(b.dataset.show)));
    setView(SIM[key] || 'pins');
    let locked = null;
    const show = i => {
      el.classList.toggle('ic-dim', i !== null);
      el.querySelectorAll('.pin').forEach(p => p.classList.remove('lit'));
      el.querySelectorAll('.ukey').forEach(k => k.classList.remove('lit','on'));
      if (i === null){ setInfo(`Choose a group to see which pins it uses. ${describeUnit(c, 'Power', c.power || (c.to220 ? [] : [c.labels.length/2, c.labels.length])).replace('Power: ','Power comes in on ')}`.replace('Power comes in on .','')); return; }
      const [name, ps] = units[i];
      ps.forEach(p => el.querySelectorAll(`.pin[data-pin="${p}"]`).forEach(e => e.classList.add('lit')));
      el.querySelector(`.ukey[data-u="${i}"]`).classList.add('lit','on');
      setInfo(describeUnit(c, name, ps));
    };
    el.querySelectorAll('.ukey').forEach(k => { const i = +k.dataset.u;
      k.addEventListener('pointerenter', () => { if (locked === null) show(i); });
      k.addEventListener('pointerleave', () => { if (locked === null) show(null); });
      onPress(k, () => { locked = locked === i ? null : i; show(locked); });
    });
    show(null);
  }};
};
