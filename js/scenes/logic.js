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
/* A 4-to-1 mux, built the way real chips do it: two 2-to-1 muxes pick between
   D0/D1 and D2/D3 using S0, then a third 2-to-1 mux picks between those two
   halves using S1. Every "mux" here is the same two-AND/one-OR/one-NOT cell
   as a plain 2-to-1 multiplexer, just wired in a small tree. */
/* Drawn as the standard block symbol (a trapezoid, wide on the input side,
   narrow on the output side) rather than exploded into gates — the "what"
   text below still explains that it is built from AND/OR/NOT gates inside. */
SCENES.mux = (n) => {
  const xL = 280, xR = 580, yT = 90, yB = 540, rh = 180;         /* trapezoid corners */
  const rowY = [150, 260, 370, 480];                             /* D0..D3 entry rows */
  const oT = yT + (yB - yT - rh)/2, oB = yB - (yB - yT - rh)/2, oY = (oT + oB)/2;  /* output edge */
  const selX = [460, 520], selT = sx => oB + (sx - xR)/(xL - xR) * (yB - oB);      /* a, b entry points on the slanted bottom edge */
  const path = `M${xL} ${yT}L${xR} ${oT}L${xR} ${oB}L${xL} ${yB}Z`;
  let s = '';
  s += W([[112,rowY[0]],[xL,rowY[0]]],'d0') + W([[112,rowY[1]],[xL,rowY[1]]],'d1') +
       W([[112,rowY[2]],[xL,rowY[2]]],'d2') + W([[112,rowY[3]],[xL,rowY[3]]],'d3');
  const swX = selX.map(x => x - 29);                                              /* switch centred under its entry point */
  s += W([[selX[0],610],[selX[0],selT(selX[0])]],'s0') + W([[selX[1],610],[selX[1],selT(selX[1])]],'s1');
  s += W([[xR,oY],[690,oY]],'y');
  s += `${P(path,'m-acc-soft','data-act="mux"')}${T(430,oY - 8,'&#8805;1','sig t-mid')}${T(430,oY + 16,'MUX','t t-xs t-mut t-mid')}`;
  rowY.forEach((y,i) => s += T(xL + 16, y + 5, i, 't t-sm t-mut'));
  s += `<g class="bg">${T(88,110,'Inputs','t t-sm t-mut')}${T((selX[0]+selX[1])/2,578,'Select','t t-sm t-mut t-mid')}
    ${T(90,656,'','t t-lg','data-txt="msg"')}${T(90,36,'A 4-to-1 mux: two select bits, a, b, choose which of D0–D3 reaches Y.','t t-sm t-mut')}</g>`;
  s += sw(48,rowY[0]-16,'d0','D','0') + sw(48,rowY[1]-16,'d1','D','1') + sw(48,rowY[2]-16,'d2','D','2') + sw(48,rowY[3]-16,'d3','D','3');
  s += sw(swX[0],610,'s0','a','',false) + sw(swX[1],610,'s1','b','',false);
  s += T(selX[0],602,'a','t t-sm t-mid') + T(selX[1],602,'b','t t-sm t-mid');
  s += led(690,oY,'y','Output Y');
  s += chipHot('ic-74157',700,90);
  return {svg:s, vb:[900,700], init: el => bindSim(el, n.id, {d0:1,d1:0,d2:0,d3:1,s0:0,s1:0}, st => {
    const idx = st.s1*2 + st.s0, y = st['d'+idx];
    return {d0:st.d0,d1:st.d1,d2:st.d2,d3:st.d3,s0:st.s0,s1:st.s1,y,key:`${st.s1}${st.s0}`,
      msg:`a b = ${st.s0}${st.s1}, so Y follows D${idx}`};
  })};
};

/* The 8086 ALU's own mux: the same trapezoid block, but 8-to-1 (three select
   bits) and 16 bits wide per path, since it picks the result among the 8086
   ALU's 8 units (see scenes/alu86.js) rather than 4 single bits. The inputs
   are demo values — this page is about how the mux itself works, not a live
   instruction — the real 8086 ALU page shows those units actually computing. */
const MUX8_DEMO = [0x1333, 0x0204, 0x2468, 0x0BB8, 0x0042, 0x00FF, 0x0001, 0x0046];
SCENES.mux8 = (n) => {
  const xL = 280, xR = 650, yT = 70, yB = 760, rh = 260;
  const rowY = [120, 202, 284, 366, 448, 530, 612, 694];
  const oT = yT + (yB - yT - rh)/2, oB = yB - (yB - yT - rh)/2, oY = (oT + oB)/2;
  const selX = [430, 490, 550], selT = sx => oB + (sx - xR)/(xL - xR) * (yB - oB);
  const path = `M${xL} ${yT}L${xR} ${oT}L${xR} ${oB}L${xL} ${yB}Z`;
  let s = '';
  ALU86_UNITS.forEach(([u, name], i) => { const y = rowY[i];
    s += T(150, y + 5, name, 't t-sm t-end t-mut') + `<path class="bus86" data-s="sel${i}" d="M170 ${y}H${xL}"/>` + T(xL + 16, y + 5, i, 't t-sm t-mut'); });
  const swX = selX.map(x => x - 29);
  s += W([[selX[0],820],[selX[0],selT(selX[0])]],'a') + W([[selX[1],820],[selX[1],selT(selX[1])]],'b') + W([[selX[2],820],[selX[2],selT(selX[2])]],'c');
  s += `<path class="bus86" data-s="y" d="M${xR} ${oY}H770"/>`;
  s += `${P(path,'m-acc-soft','data-act="mux"')}${T(465,oY - 8,'&#8805;1','sig t-mid')}${T(465,oY + 16,'8-TO-1','t t-xs t-mut t-mid')}`;
  s += `<g class="bg">${T(150,90,'Inputs · 16 bits each','t t-sm t-mut t-end')}${T((selX[0]+selX[1]+selX[2])/3,798,'Select','t t-sm t-mut t-mid')}${T(770,oY + 30,'Output Y · 16 bits','t t-sm t-mut')}
    ${T(90,896,'','t t-lg','data-txt="msg"')}${T(90,36,'The 8086 ALU’s mux: three select bits, a, b, c, choose which of 8 unit results (16 bits each) reaches Y.','t t-sm t-mut')}</g>`;
  s += T(790,oY - 10,'','val t-mid','data-txt="yhex"');
  s += sw(swX[0],820,'a','a','',false) + sw(swX[1],820,'b','b','',false) + sw(swX[2],820,'c','c','',false);
  s += T(selX[0],812,'a','t t-sm t-mid') + T(selX[1],812,'b','t t-sm t-mid') + T(selX[2],812,'c','t t-sm t-mid');
  s += chipHot('ic-74151',770,90);
  return {svg:s, vb:[980,920], init: el => bindSim(el, n.id, {a:0,b:0,c:0}, st => {
    const idx = st.c*4 + st.b*2 + st.a, sig = {a:st.a,b:st.b,c:st.c,key:`${st.c}${st.b}${st.a}`};
    ALU86_UNITS.forEach((u, i) => sig['sel' + i] = i === idx);
    sig.y = true;
    const hex = I8086.hex(MUX8_DEMO[idx], 4) + 'h';
    sig.yhex = hex;
    sig.msg = `c b a = ${st.c}${st.b}${st.a}, so Y follows ${ALU86_UNITS[idx][1]} (${hex})`;
    return sig;
  })};
};

