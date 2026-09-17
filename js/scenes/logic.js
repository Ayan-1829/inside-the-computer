/* ==========================================================
   scenes/logic.js
   Digital-logic circuits: gate gallery, single gates, the full adder
   (with gate-by-gate signal propagation), the multiplexer and the
   physical IC pinout view.
   ========================================================== */
const GATE_STEP = 150;                 /* ms per gate delay (normal speed) */

/* ---------------- Logic unit: gate gallery ---------------- */
SCENES.logic = () => {
  const G = ['AND','OR','XOR','NOT','NAND','NOR','XNOR'];
  let s = '';
  G.forEach((g,i) => {
    const row = i < 4 ? 0 : 1, col = row ? i-4 : i, x = row ? 185+col*220 : 75+col*220, y = row ? 368 : 96;
    const sym = gsym(g, x+48, y+42, 0.95, 2.5), id = g.toLowerCase()+'-gate';
    const wires = g === 'NOT' ? `<line class="ln" x1="${x+20}" y1="${sym.i[1]}" x2="${sym.i[0]}" y2="${sym.i[1]}"/>`
      : `<line class="ln" x1="${x+20}" y1="${sym.a[1]}" x2="${sym.a[0]}" y2="${sym.a[1]}"/><line class="ln" x1="${x+20}" y1="${sym.b[1]}" x2="${sym.b[0]}" y2="${sym.b[1]}"/>`;
    s += hot(id,[x,y,190,236], R(x,y,190,236,14,'m-panel') + wires + `<line class="ln" x1="${sym.o[0]}" y1="${sym.o[1]}" x2="${x+172}" y2="${sym.o[1]}"/>` + sym.svg +
      T(x+95,y+172,g,'t t-lg t-mid') + T(x+95,y+206,'Y = '+EXPR_SVG[g],'t t-sm t-mid t-mut'),{rx:18});
  });
  s += `<g class="bg">${T(500,650,'Each bit of the ALU has gates like these working in parallel. Choose one to try it.','t t-sm t-mut t-mid')}</g>`;
  return {svg:s};
};

/* ---------------- Single gate ---------------- */
SCENES.gate = (n) => {
  const g = n.gate, one = g === 'NOT', sym = gsym(g,400,262,2.2,3,1);
  let s = `<g class="bg">${T(505,566,'Y = '+EXPR_SVG[g],'t t-expr t-mid')}${T(505,604,'Conceptual logic symbol (ANSI style)','t t-sm t-mut t-mid')}</g>`;
  if (one) s += W([[168,350],sym.i],'a');
  else s += W([[168,250],[330,250],[330,sym.a[1]],sym.a],'a') + W([[168,450],[330,450],[330,sym.b[1]],sym.b],'b');
  s += W([sym.o,[808,350]],'y',1) + sym.svg;
  s += one ? sw(110,334,'a','A') : sw(110,234,'a','A') + sw(110,434,'b','B');
  s += led(830,350,'y','Output Y',1);
  s += n.chip ? chipHot(n.chip,720,572) : `<g class="bg">${T(890,590,'Real chip: 74LS266','t t-sm t-end')}${T(890,612,'details in the panel','t t-xs t-mut t-end')}</g>`;
  return {svg:s, init: el => bindSim(el, n.id, {a:0,b:0}, st => {
    const y = one ? GFN.NOT(st.a) : GFN[g](st.a, st.b);
    return {a:st.a, b:st.b, y, key: one ? `${st.a}` : `${st.a}${st.b}`};
  }, {step: () => GATE_STEP*2})};
};

/* ---------------- Full adder with signal propagation ---------------- */
SCENES.adder = (n) => {
  const x1 = gsym('XOR',300,146,1.2,2.5,1), a1 = gsym('AND',300,330,1.2,2.5,1),
        x2 = gsym('XOR',560,170,1.2,2.5,2), a2 = gsym('AND',560,450,1.2,2.5,2), o1 = gsym('OR',720,396,1.2,2.5,3);
  let s = `<g class="bg">${T(360,118,'delay 1','t t-xs t-mut t-mid')}${T(620,118,'delay 2','t t-xs t-mut t-mid')}${T(780,118,'delay 3','t t-xs t-mut t-mid')}
    <path class="ln-dash" d="M490 104V560M700 104V380" style="opacity:.5"/></g>`;
  s += W([[148,170],x1.a],'a') + W([[225,170],[225,a1.a[1]],a1.a],'a') + J(225,170,'a');
  s += W([[148,218],x1.b],'b') + W([[255,218],[255,a1.b[1]],a1.b],'b') + J(255,218,'b');
  s += W([x1.o,x2.a],'x',1) + W([[480,x1.o[1]],[480,a2.a[1]],a2.a],'x',1) + J(480,x1.o[1],'x',1);
  s += W([[148,522],a2.b],'c') + W([[520,522],[520,x2.b[1]],x2.b],'c') + J(520,522,'c');
  s += W([a1.o,[690,a1.o[1]],[690,o1.a[1]],o1.a],'p',1) + W([a2.o,[690,a2.o[1]],[690,o1.b[1]],o1.b],'q',2);
  s += W([x2.o,[878,x2.o[1]]],'s',2) + W([o1.o,[878,o1.o[1]]],'co',3);
  s += x1.svg + x2.svg + a1.svg + a2.svg + o1.svg;
  s += `<g class="bg">${T(360,260,'XOR','t t-xs t-mut t-mid')}${T(620,284,'XOR','t t-xs t-mut t-mid')}${T(355,444,'AND','t t-xs t-mut t-mid')}${T(615,564,'AND','t t-xs t-mut t-mid')}${T(780,510,'OR','t t-xs t-mut t-mid')}
    ${T(90,604,'','t t-lg','data-txt="sum" data-d="3"')}${T(90,636,'Sum = A ⊕ B ⊕ C<tspan class="t-xs" dy="4">in</tspan>','t t-sm t-mut')}${T(90,662,'Carry out = A·B + C<tspan class="t-xs" dy="4">in</tspan><tspan dy="-4">·(A ⊕ B)</tspan>','t t-sm t-mut')}</g>`;
  s += sw(90,154,'a','A') + sw(90,202,'b','B') + sw(90,506,'c','C','in');
  s += led(900,x2.o[1],'s','Sum',2) + led(900,o1.o[1],'co','Carry out',3);
  s += btnS(806,66,160,40,'Slow motion','id="slow-btn" aria-pressed="false"');
  s += chipHot('ic-74283',720,578);
  return {svg:s, init: el => {
    const sim = bindSim(el, n.id, {a:1,b:1,c:0,slow:0}, st => {
      const x = st.a^st.b, p = st.a&st.b, q = x&st.c, sm = x^st.c, co = p|q;
      return {a:st.a,b:st.b,c:st.c,x,p,q,s:sm,co,key:`${st.a}${st.b}${st.c}`,
        sum:`${st.a} + ${st.b} + ${st.c} = ${co}${sm}<tspan class="t-sm" dy="5">two</tspan><tspan class="t-sm t-mut" dy="-5">  (${st.a+st.b+st.c} in decimal)</tspan>`};
    }, {step: st => st.slow ? 650 : GATE_STEP, after: (sig, st) => { const b = el.querySelector('#slow-btn'); b.classList.toggle('on', !!st.slow); b.setAttribute('aria-pressed', st.slow ? 'true' : 'false'); }});
    onPress(el.querySelector('#slow-btn'), () => { sim.st.slow ^= 1; sim.upd(true); });
  }};
};

/* ---------------- 2-to-1 multiplexer ---------------- */
SCENES.mux = (n) => {
  const a1 = gsym('AND',520,166,1.2,2.5,2), a2 = gsym('AND',520,326,1.2,2.5,2), nt = gsym('NOT',330,512,1.2,2.5,1), o1 = gsym('OR',700,246,1.2,2.5,3);
  let s = '';
  s += W([[148,190],a1.a],'d0') + W([[148,350],a2.a],'d1');
  s += W([[148,560],nt.i],'s') + W([[260,560],[260,a2.b[1]],a2.b],'s') + J(260,560,'s');
  s += W([nt.o,[470,nt.o[1]],[470,a1.b[1]],a1.b],'ns',1);
  s += W([a1.o,[660,a1.o[1]],[660,o1.a[1]],o1.a],'p',2) + W([a2.o,[660,a2.o[1]],[660,o1.b[1]],o1.b],'q',2) + W([o1.o,[878,o1.o[1]]],'y',3);
  s += a1.svg + a2.svg + nt.svg + o1.svg;
  s += `<g class="bg">${T(455,596,'<tspan class="ol">S</tspan>','t t-sm t-mut')}${T(90,656,'','t t-lg','data-txt="msg" data-d="3"')}${T(90,122,'Y = <tspan class="ol">S</tspan>·D0 + S·D1','t t-sm t-mut')}</g>`;
  s += sw(90,174,'d0','D','0') + sw(90,334,'d1','D','1') + sw(90,544,'s','S');
  s += led(900,o1.o[1],'y','Output Y',3);
  s += chipHot('ic-74157',720,566);
  return {svg:s, init: el => bindSim(el, n.id, {d0:1,d1:0,s:0}, st => {
    const ns = st.s^1, p = st.d0&ns, q = st.d1&st.s, y = p|q;
    return {d0:st.d0,d1:st.d1,s:st.s,ns,p,q,y,key:`${st.s}`,msg:`S = ${st.s}, so Y follows D${st.s}`};
  }, {step: () => GATE_STEP})};
};

