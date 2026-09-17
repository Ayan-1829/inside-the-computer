/* ==========================================================
   scenes/alu.js
   A working 4-bit ALU model, the barrel shifter and the comparator.
   ========================================================== */
const bitsOf = (st, p, n=4) => { let v = 0; for (let i=n-1;i>=0;i--) v = v*2 + (st[p+i] ? 1 : 0); return v; };
const bin = (v, n=4) => v.toString(2).padStart(n,'0');

/* ---------------- 4-bit ALU ---------------- */
const ALU_OPS = ['ADD','SUB','AND','OR','XOR','NOT','SHL','SHR','CMP'];
function aluEval(A, B, op, lop, sop){
  const logic = {AND:A&B, OR:A|B, XOR:A^B, NOT:(~A)&15};
  const sub = ['SUB','CMP'].includes(op);
  const t = sub ? A + ((~B)&15) + 1 : A + B, arith = t & 15;
  const shl = (A<<1)&15, shr = A>>1;
  let unit, r, c = 0, v = 0;
  if (['ADD','SUB','CMP'].includes(op)){ unit = 'arith'; r = arith; c = t > 15 ? 1 : 0;
    v = sub ? (((A^B)&(A^r)&8) ? 1 : 0) : (((A^r)&(B^r)&8) ? 1 : 0); }
  else if (logic[op] !== undefined){ unit = 'logic'; r = logic[op]; }
  else { unit = 'shift'; r = op === 'SHL' ? shl : shr; c = op === 'SHL' ? (A>>3)&1 : A&1; }
  return {unit, r, c, v, z: r === 0 ? 1 : 0, n: (r>>3)&1, arith, logic: logic[lop], shift: sop === 'SHL' ? shl : shr, sub};
}
const OPSYM = {ADD:'+', SUB:'−', AND:'AND', OR:'OR', XOR:'XOR', CMP:'−'};

SCENES.alu = (n) => {
  let s = '';
  /* operation decoder column */
  s += hot('alu-control',[30,84,112,540], R(30,84,112,540,14,'m-panel') + T(86,114,'Operation','t t-sm t-mid') + T(86,134,'decoder','t t-sm t-mid'),{rx:18});
  /* operand + result registers (one hotspot, three frames) */
  s += hot('alu-registers',[[160,84,310,76],[530,84,310,76],[320,580,300,66]],
    R(160,84,310,76,12,'m-block') + T(182,132,'A','t t-lg') + R(530,84,310,76,12,'m-block') + T(552,132,'B','t t-lg') +
    R(320,580,300,66,12,'m-block') + T(336,620,'Result','t'),{label:'Operand and result registers'});
  /* buses */
  s += `<g class="bg">
    <path class="ln" d="M315 160V188M160 188H900" style="stroke-width:3"/><path class="ln" d="M685 160V206M160 206H900" style="stroke-width:3;opacity:.7"/>
    ${T(154,192,'A','t t-xs t-mut t-end')}${T(154,212,'B','t t-xs t-mut t-end')}
    <path class="ln" d="M285 188V240M315 206V240M510 188V240M540 206V240M690 188V240M828 188V240M858 206V240"/>
    <path class="ln-dash" d="M142 520H316"/>${T(230,510,'select','t t-xs t-mut t-mid')}
    <path class="arr" d="M620 613H658"/></g>`;
  /* arithmetic unit with nested parts */
  s += hot('arithmetic-unit',[160,240,280,212],
    R(160,240,280,212,16,'m-panel','data-act="arith"') + T(176,266,'Arithmetic unit','t') +
    hot('subtractor',[172,282,74,138], R(172,282,74,138,10,'m-block','data-act="sub"') + T(209,334,'B','t t-sm t-mid') + T(209,354,'invert','t t-xs t-mid') + T(209,398,'XOR','t t-xs t-mut t-mid'),{pad:4,rx:12,label:'Subtractor (B inverter)'}) +
    hot('adder',[258,282,170,44], R(258,282,170,44,10,'m-block','data-act="adder"') + T(343,309,'Adder','t t-sm t-mid'),{pad:4,rx:12}) +
    hot('carry-lookahead',[258,334,170,40], R(258,334,170,40,10,'m-block','data-act="cla"') + T(343,359,'Carry lookahead','t t-sm t-mid'),{pad:4,rx:12}) +
    hot('multiplier',[258,382,170,38], R(258,382,170,38,10,'m-block') + T(343,406,'Multiplier','t t-sm t-mid'),{pad:4,rx:12}) +
    T(300,442,'','unit-out t-mid','data-txt="oa" data-s="u-arith" text-anchor="middle"'),{rx:20});
  /* logic unit with four mini gates */
  const mg = [['AND',468,282],['OR',532,282],['XOR',468,348],['NOT',532,348]];
  s += hot('logic-unit',[455,240,140,212],
    R(455,240,140,212,16,'m-panel','data-act="logic"') + T(471,266,'Logic unit','t') +
    mg.map(([g,x,y]) => { const sym = gsym(g, x+8, y+8, .4, 2); const id = g.toLowerCase()+'-gate';
      return hot(id,[x,y,58,58], R(x,y,58,58,8,'m-block',`data-act="g-${g}"`) + sym.svg + T(x+29,y+52,g,'t t-xs t-mid'),{pad:3,rx:10}); }).join('') +
    T(525,442,'','unit-out','data-txt="ol" data-s="u-logic" text-anchor="middle"'),{rx:20});
  /* shifter */
  let sh = ''; for (let i=0;i<4;i++){ sh += R(634+i*30,300,24,24,4,'m-block') + R(634+i*30,370,24,24,4,'m-block'); if (i<3) sh += `<line class="ln" x1="${676+i*30-30+12}" y1="324" x2="${676+i*30-30+42}" y2="370"/>`; }
  s += hot('shifter',[610,240,160,212], R(610,240,160,212,16,'m-panel','data-act="shift"') + T(626,266,'Shifter','t') + sh + T(690,420,'1 place','t t-xs t-mut t-mid') +
    T(690,442,'','unit-out','data-txt="os" data-s="u-shift" text-anchor="middle"'),{rx:20});
  /* comparator */
  s += hot('comparator',[785,240,125,212], R(785,240,125,212,16,'m-panel','data-act="cmp"') + T(800,266,'Comparator','t') +
    ['&gt;','=','&lt;'].map((q,i) => R(800+i*34,300,28,28,6,'m-block') + T(814+i*34,320,q,'t t-sm t-mid')).join('') + T(847,370,'A ? B','t t-sm t-mut t-mid') +
    T(847,442,'','unit-out','data-txt="oc" data-s="cmpo" text-anchor="middle"'),{rx:20});
  /* unit outputs into the result multiplexer */
  s += W([[300,452],[300,470],[350,470],[350,492]],'u-arith') + W([[525,452],[525,470],[470,470],[470,492]],'u-logic') + W([[690,452],[690,470],[590,470],[590,492]],'u-shift');
  s += W([[847,452],[847,580]],'cmpo');
  s += hot('multiplexer',[318,492,304,54], P('M318 492H622L592 546H348Z','m-acc-soft') + T(470,525,'Result MUX','t t-mid'),{label:'Result multiplexer'});
  s += W([[470,546],[470,580]],'wb');
  /* flags */
  s += hot('flag-logic',[660,580,250,66], R(660,580,250,66,12,'m-block') + T(676,620,'Flags','t') +
    ['z','n','c','v'].map((f,i) => `<g class="flag" data-s="f${f}">${R(740+i*42,592,36,40,7,'')}${T(758+i*42,618,f.toUpperCase(),'')}</g>`).join(''));
  /* interactive controls (drawn last so they sit on top) */
  for (let i=0;i<4;i++){ const b = 3-i;
    s += bitCell(210+i*52,98,'a'+b,`A bit ${b}`) + bitCell(580+i*52,98,'b'+b,`B bit ${b}`) + bitCell(410+i*52,590,'r'+b,`Result bit ${b}`,true,46,46); }
  s += T(420,130,'','t t-sm t-mut','data-txt="da"') + T(790,130,'','t t-sm t-mut','data-txt="db"');
  ALU_OPS.forEach((op,i) => { s += btnS(38,148+i*50,96,42,op,`data-op="${op}" aria-label="Operation ${op}"`); });
  s += T(930,686,'','t t-sm t-end','data-txt="expr"');
  return {svg:s, init: el => {
    const sim = bindSim(el, n.id, {a3:0,a2:1,a1:1,a0:0,b3:0,b2:0,b1:1,b0:0,op:'ADD',lop:'AND',sop:'SHL',res:8}, st => {
      const A = bitsOf(st,'a'), B = bitsOf(st,'b'), e = aluEval(A,B,st.op,st.lop,st.sop);
      if (st.op !== 'CMP') st.res = e.r;
      const sig = {da:`= ${A}`, db:`= ${B}`, oa:bin(e.arith), ol:bin(e.logic), os:bin(e.shift),
        oc: A > B ? 'A &gt; B' : A === B ? 'A = B' : 'A &lt; B',
        'u-arith': e.unit==='arith' && st.op!=='CMP', 'u-logic': e.unit==='logic', 'u-shift': e.unit==='shift', cmpo: st.op==='CMP', wb: st.op!=='CMP',
        fz:e.z, fn:e.n, fc:e.c, fv:e.v, key:''};
      for (let b=0;b<4;b++) sig['r'+b] = (st.res>>b)&1;
      const exprs = {ADD:`${bin(A)} + ${bin(B)} = ${bin(e.r)}  (${A} + ${B} = ${A+B}${e.c ? ', too big for 4 bits so it wraps and C = 1' : ''})`,
        SUB:`${bin(A)} − ${bin(B)} = ${bin(e.r)}  (${A} − ${B} = ${A-B}${A<B ? ', stored in two’s complement' : ''})`,
        CMP:`CMP ${A}, ${B}: result not stored, flags Z=${e.z} N=${e.n} C=${e.c} V=${e.v}`,
        AND:`${bin(A)} AND ${bin(B)} = ${bin(e.r)}`, OR:`${bin(A)} OR ${bin(B)} = ${bin(e.r)}`, XOR:`${bin(A)} XOR ${bin(B)} = ${bin(e.r)}`,
        NOT:`NOT ${bin(A)} = ${bin(e.r)}`, SHL:`${bin(A)} shifted left = ${bin(e.r)}  (${A} → ${e.r})`, SHR:`${bin(A)} shifted right = ${bin(e.r)}  (${A} → ${e.r})`};
      sig.expr = exprs[st.op];
      const act = [];
      if (e.unit === 'arith'){ act.push('arith','adder','cla'); if (e.sub) act.push('sub'); }
      if (e.unit === 'logic') act.push('logic','g-' + st.op);
      if (e.unit === 'shift') act.push('shift');
      if (st.op === 'CMP') act.push('cmp');
      sig.act = act;
      return sig;
    }, {after: (sig, st) => {
      el.querySelectorAll('[data-act]').forEach(e => e.classList.toggle('active', sig.act.includes(e.dataset.act)));
      el.querySelectorAll('[data-op]').forEach(b => { b.classList.toggle('on', b.dataset.op === st.op); b.setAttribute('aria-pressed', b.dataset.op === st.op ? 'true' : 'false'); });
      const flagTxt = `Z=${sig.fz} N=${sig.fn} C=${sig.fc} V=${sig.fv}`;
      setLive('alu', `<b>${st.op}</b>: ${sig.expr}.<br>Flags: ${flagTxt}. ${st.op==='CMP' ? 'CMP subtracts but throws the result away; only the flags change.' : 'The multiplexer passes the ' + ({arith:'arithmetic unit',logic:'logic unit',shift:'shifter'})[ {ADD:'arith',SUB:'arith',AND:'logic',OR:'logic',XOR:'logic',NOT:'logic',SHL:'shift',SHR:'shift'}[st.op] ] + '’s answer to the result register.'}`);
    }});
    el.querySelectorAll('[data-op]').forEach(b => onPress(b, () => { const op = b.dataset.op; sim.st.op = op;
      if (['AND','OR','XOR','NOT'].includes(op)) sim.st.lop = op; if (op === 'SHL' || op === 'SHR') sim.st.sop = op; sim.upd(false); }));
  }};
};

/* ---------------- 8-bit barrel shifter ---------------- */
SCENES.shifter = (n) => {
  const cx = i => 275 + i*70, rows = [150, 250, 360, 470], outY = 520, K = [1,2,4];
  let s = `<g class="bg">${T(240,132,'Input','t t-end')}${T(240,552,'Output','t t-end')}${T(88,200,'Shift by','t t-sm t-mut')}</g>`;
  /* lines between rows: key L{layer}_{col}, value = bit arriving at that node */
  for (let l=0;l<3;l++){
    for (let i=0;i<8;i++){
      const y0 = rows[l], y1 = rows[l+1] - 10;
      s += `<g data-ly="${l}" data-kd="S">${W([[cx(i),y0],[cx(i),y1]], `S${l}_${i}`)}</g>`;
      const left = i + K[l], right = i - K[l];
      s += `<g data-ly="${l}" data-kd="L">${left <= 7 ? W([[cx(left),y0],[cx(i),y1]], `L${l}_${i}`) : W([[cx(i)+30,y0+16],[cx(i),y1]], `L${l}_${i}`) + T(cx(i)+34,y0+18,'0','t t-xs t-mut')}</g>`;
      s += `<g data-ly="${l}" data-kd="R">${right >= 0 ? W([[cx(right),y0],[cx(i),y1]], `R${l}_${i}`) : W([[cx(i)-30,y0+16],[cx(i),y1]], `R${l}_${i}`) + T(cx(i)-44,y0+18,'0','t t-xs t-mut')}</g>`;
      s += `<circle class="junc" data-s="N${l}_${i}" cx="${cx(i)}" cy="${rows[l+1]-6}" r="7"/>`;
    }
    s += `<g class="bg">${T(830,rows[l+1],`layer ${l+1}: ±${K[l]}`,'t t-xs t-mut')}</g>`;
  }
  for (let i=0;i<8;i++){
    s += W([[cx(i),rows[3]],[cx(i),outY]],`O_${i}`);
    s += bitCell(cx(i)-25,100,'i'+(7-i),`Input bit ${7-i}`,false,50,50) + bitCell(cx(i)-25,outY,'o'+(7-i),`Output bit ${7-i}`,true,50,50);
  }
  s += T(805,132,'','t t-sm t-mut','data-txt="din"') + T(805,552,'','t t-sm t-mut','data-txt="dout"');
  K.forEach((k,l) => { s += sw(120, rows[l+1]-22, 'l'+k, `${k}`); });
  s += btnS(96,590,150,44,'Shift left','data-dir="0"') + btnS(256,590,150,44,'Shift right','data-dir="1"');
  s += T(440,618,'','t','data-txt="msg"');
  s += `<g class="bg">${T(440,648,'Each layer is a row of 2-to-1 multiplexers (drawn as dots).','t t-xs t-mut')}</g>`;
  return {svg:s, init: el => {
    const sim = bindSim(el, n.id, {i7:0,i6:0,i5:0,i4:1,i3:0,i2:1,i1:1,i0:0,l1:1,l2:0,l4:0,dir:0}, st => {
      const sig = {key:''}; let v = [];
      for (let i=0;i<8;i++) v.push(st['i'+(7-i)] ? 1 : 0);              /* column order: MSB first */
      const vin = parseInt(v.join(''),2);
      K.forEach((k,l) => {
        const on = st['l'+k], nv = [];
        for (let i=0;i<8;i++){
          const src = st.dir ? i - k : i + k, val = on ? (src >= 0 && src <= 7 ? v[src] : 0) : v[i];
          nv.push(val);
          sig[`S${l}_${i}`] = !on && v[i];
          sig[`L${l}_${i}`] = on && !st.dir && val; sig[`R${l}_${i}`] = on && st.dir && val;
          sig[`N${l}_${i}`] = val;
        }
        v = nv;
      });
      for (let i=0;i<8;i++){ sig['o'+(7-i)] = v[i]; sig[`O_${i}`] = v[i]; }
      const amt = (st.l1?1:0) + (st.l2?2:0) + (st.l4?4:0), vout = parseInt(v.join(''),2);
      sig.din = `= ${vin}`; sig.dout = `= ${vout}`;
      sig.msg = amt ? `Shift ${st.dir ? 'right' : 'left'} by ${amt}: ${vin} → ${vout}` : 'No layers on: bits pass straight through';
      return sig;
    }, {after: (sig, st) => {
      el.querySelectorAll('[data-dir]').forEach(b => b.classList.toggle('on', +b.dataset.dir === st.dir));
      /* show only the path each layer takes: straight when off, diagonal in the chosen direction when on */
      el.querySelectorAll('[data-kd]').forEach(g => { const on = st['l'+K[+g.dataset.ly]];
        g.style.display = g.dataset.kd === (!on ? 'S' : st.dir ? 'R' : 'L') ? '' : 'none'; });
    }});
    el.querySelectorAll('[data-dir]').forEach(b => onPress(b, () => { sim.st.dir = +b.dataset.dir; sim.upd(false); }));
  }};
};

/* ---------------- 4-bit magnitude comparator ---------------- */
SCENES.comparator = (n) => {
  const cx = i => 300 + i*130;
  let s = `<g class="bg">${T(250,142,'A','t t-lg t-end')}${T(250,222,'B','t t-lg t-end')}${T(236,318,'Same?','t t-sm t-mut t-end')}</g>`;
  for (let i=0;i<4;i++){
    const b = 3-i, x = cx(i), g = gsym('XNOR', x-40, 290, .7, 2.5);
    s += `<rect class="colhl" data-s="first${b}" x="${x-58}" y="92" width="${146}" height="330" rx="14"/>`;
    s += W([[x-14,160],[x-14,176],[x-44,176],[x-44,g.a[1]],g.a],'a'+b) + W([[x,240],[x,262],[x-34,262],[x-34,g.b[1]],g.b],'b'+b);
    s += W([g.o,[x+52,g.o[1]]],'e'+b) + g.svg + `<circle class="led-c" data-led="e${b}" cx="${x+64}" cy="${g.o[1]}" r="12"/>`;
    s += bitCell(x-28,110,'a'+b,`A bit ${b}`,false,56,50) + bitCell(x-28,190,'b'+b,`B bit ${b}`,false,56,50);
    s += T(x+14,402,`bit ${b}`,'t t-xs t-mut t-mid') + T(x+14,378,'','t t-xs t-mid',`data-txt="t${b}"`);
  }
  s += T(830,142,'','t t-sm t-mut','data-txt="da"') + T(830,222,'','t t-sm t-mut','data-txt="db"');
  s += led(360,480,'gt','A &gt; B') + led(500,480,'eq','A = B') + led(640,480,'lt','A &lt; B');
  s += `<text class="t" x="90" y="604" data-txt="why"></text>`;
  s += chipHot('ic-7485',760,566);
  return {svg:s, init: el => bindSim(el, n.id, {a3:0,a2:1,a1:1,a0:0,b3:0,b2:1,b1:0,b0:1}, st => {
    const A = bitsOf(st,'a'), B = bitsOf(st,'b'), sig = {key:'', da:`= ${A}`, db:`= ${B}`};
    let first = -1;
    for (let b=3;b>=0;b--){ const a = st['a'+b]?1:0, bb = st['b'+b]?1:0; sig['a'+b]=a; sig['b'+b]=bb; sig['e'+b] = a===bb ? 1 : 0;
      sig['t'+b] = a === bb ? 'same' : 'differs'; if (first < 0 && a !== bb) first = b; }
    for (let b=0;b<4;b++) sig['first'+b] = b === first;
    sig.gt = A > B; sig.eq = A === B; sig.lt = A < B;
    const lines = first < 0 ? ['All four bits are the same, so A = B.']
      : [`${first === 2 ? 'Bit 3 is the same. ' : first < 2 ? `Bits 3–${first+1} are the same. ` : ''}Bit ${first} is the first to differ:`,
         `A has ${st['a'+first]?1:0} and B has ${st['b'+first]?1:0}, so A ${A > B ? '&gt;' : '&lt;'} B. Later bits do not matter.`];
    sig.why = tspans(lines, 90, 26);
    return sig;
  })};
};
