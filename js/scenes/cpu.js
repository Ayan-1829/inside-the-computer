/* ==========================================================
   scenes/cpu.js
   The CPU die, the control unit's fetch-decode-execute walkthrough
   and the 4-bit register.
   ========================================================== */
/* ---------------- CPU die ---------------- */
SCENES.cpu = () => {
  let pads = ''; for (let i=0;i<9;i++){ pads += C(88+i*22,264,3,'m-gold')+C(88+i*22,446,3,'m-gold'); }
  let s = `<g class="bg">${R(70,250,210,210,10,'m-board')}${pads}${R(125,305,100,100,6,'m-die')}
    ${T(175,490,'CPU package','t t-sm t-mut t-mid')}${T(175,510,'(lid removed)','t t-xs t-mut t-mid')}
    <path class="ln-dash" d="M225 305 L330 90 M225 405 L330 640"/>
    ${R(330,90,610,550,12,'m-die')}${T(635,668,'One core, simplified floorplan','t t-sm t-mut t-mid')}</g>`;
  const blk = (id,x,y,w,h,label,art) => hot(id,[x,y,w,h], R(x,y,w,h,8,'m-die-block')+T(x+14,y+26,label,'t t-die')+art,{rx:10,pad:5});
  s += blk('control-unit',350,110,180,150,'Control unit',
    `${R(370,160,44,26,5,'m-die-cell')}${R(430,160,44,26,5,'m-die-cell')}${R(400,208,44,26,5,'m-die-cell')}
     <path class="ln-die" d="M414 173h16M474 173v48h-30M400 221h-8v-48"/>${T(392,178,'F','t t-xs t-die t-mid')}${T(452,178,'D','t t-xs t-die t-mid')}${T(422,226,'E','t t-xs t-die t-mid')}`);
  s += blk('decoder',545,110,215,150,'Instruction decoder',
    [0,1,2].map(i=>T(565,170+i*27,['01001000','00000001','11011000'][i],'t t-sm t-die t-num')).join('')+`<path class="ln-die" d="M690 165h40M690 192h40M690 219h40"/>`);
  s += blk('clock',775,110,145,150,'Clock',`<path class="ln" style="stroke:var(--i-die-text)" d="M790 215h14v-40h24v40h24v-40h24v40h14"/>`+T(847,246,'PLL','t t-xs t-die t-mid'));
  s += blk('alu',350,275,190,190,'ALU',`<path class="m-die-cell" d="M385 330h50l10 18 10-18h50l-28 90h-64Z"/>`+T(445,395,'A op B','t t-xs t-die t-mid'));
  let regs=''; for(let r=0;r<5;r++) for(let c=0;c<6;c++) regs += R(575+c*26,315+r*28,20,20,3,'m-die-cell');
  s += blk('registers',555,275,190,190,'Registers',regs);
  s += blk('bus-interface',760,275,160,345,'Bus interface',
    [0,1,2,3,4,5].map(i=>`<line class="ln-die" x1="${792+i*16}" y1="310" x2="${792+i*16}" y2="600"/>`).join('')+T(840,612,'to L3 / RAM','t t-xs t-die t-mid'));
  let cells=''; for(let r=0;r<4;r++) for(let c=0;c<22;c++) cells += R(366+c*17,516+r*23,13,17,2,'m-die-cell');
  s += blk('cache',350,480,395,140,'L1 / L2 cache',cells);
  return {svg:s};
};

/* ---------------- 4-bit register, interactive ---------------- */
SCENES.registers = (n) => {
  let s = `<g class="bg"><polyline class="wire" data-s="clk" points="170,420 856,420"/></g>`;
  for (let i=0;i<4;i++){
    const x = 200+i*165, b = 3-i;
    s += `<polyline class="wire" data-s="d${b}" points="${x+65},162 ${x+65},240"/><polyline class="wire" data-s="q${b}" points="${x+65},390 ${x+65},473"/><polyline class="wire" data-s="clk" points="${x+22},420 ${x+22},390"/>`;
    s += hot('d-flip-flop',[x,240,130,150], R(x,240,130,150,12,'m-panel')+T(x+12,268,'D','t t-sm')+T(x+118,290,'Q','t t-sm t-end')+
      P(`M${x} ${366}l14 10-14 10`,'ln')+T(x+65,330,'D flip-flop','t t-xs t-mut t-mid')+T(x+65,350,`bit ${b}`,'t t-xs t-mut t-mid'),{label:`D flip-flop, bit ${b}`,pad:5});
    s += `<text class="t t-sm t-mid" x="${x+65}" y="122">D${b}</text>` + sw(x+36,130,'d'+b,'D'+b,'',false);
    s += led(x+65,495,'q'+b,'Q'+b);
  }
  s += `<g class="ctl btn-s" id="clk-btn" role="button" tabindex="0" aria-label="Send one clock pulse">${R(50,400,110,40,10,'')}${T(105,425,'Clock ↑','')}</g>`;
  s += `<g class="bg">${T(105,466,'Press to load','t t-xs t-mut t-mid')}${T(530,610,'','t t-lg t-mid','data-txt="val"')}</g>`;
  s += chipHot('ic-7474',750,580);
  return {svg:s, init: el => {
    const sim = bindSim(el, n.id, {d3:0,d2:1,d1:0,d0:1,q3:0,q2:0,q1:0,q0:0,clk:0}, st => {
      const sig = {clk:st.clk}; for (let b=0;b<4;b++){ sig['d'+b]=st['d'+b]; sig['q'+b]=st['q'+b]; }
      const q = [3,2,1,0].map(b=>st['q'+b]).join(''); sig.val = `Stored: ${q}<tspan class="t-sm t-mut">  (${parseInt(q,2)} in decimal)</tspan>`; sig.key=''; return sig; });
    const btn = el.querySelector('#clk-btn');
    const pulse = e => { e && e.stopPropagation(); const st = sim.st; st.clk=1; for (let b=0;b<4;b++) st['q'+b]=st['d'+b]; btn.classList.add('on'); sim.upd();
      setTimeout(()=>{ st.clk=0; btn.classList.remove('on'); sim.upd(); }, 320); };
    btn.addEventListener('click', pulse);
    btn.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' '){ e.preventDefault(); pulse(e); } });
  }};
};

/* ---------------- Control unit: fetch → decode → execute ---------------- */
/* A made-up mini instruction set, just for this walkthrough. */
const CU_PROG = [
  {op:'MOV', dst:'r1', imm:3, txt:'MOV R1, #3'},
  {op:'MOV', dst:'r2', imm:1, txt:'MOV R2, #1'},
  {op:'SUB', txt:'SUB R1, R2'},
  {op:'JNZ', addr:2, txt:'JNZ 2'},
  {op:'HALT', txt:'HALT'},
];
const CU_INIT = {pc:0, ir:-1, phase:-1, r1:0, r2:0, z:0, tick:0, halted:false, alu:'', arrows:[], units:[], msg:'Ready. The program counter starts at 0. Press <b>Next step</b> to fetch the first instruction.'};
function cuStep(st){
  if (st.halted) return;
  st.tick++; st.phase = (st.phase + 1) % 3; st.alu = '';
  if (st.phase === 0){                                   /* FETCH */
    const addr = st.pc; st.ir = addr; st.pc = addr + 1;
    st.arrows = ['pc-mem','mem-ir']; st.units = ['pc','ir','mem'];
    st.msg = `<b>Fetch.</b> The program counter holds ${addr}, so the instruction at address ${addr} (${CU_PROG[addr].txt}) is copied from memory into the instruction register. The PC moves on to ${st.pc}.`;
    return;
  }
  const ins = CU_PROG[st.ir];
  if (st.phase === 1){                                   /* DECODE */
    st.arrows = ['ir-dec','dec-cu']; st.units = ['ir','dec','cu'];
    st.msg = ({MOV:() => `<b>Decode.</b> The decoder sees MOV. The destination is ${ins.dst.toUpperCase()}, and the value ${ins.imm} is stored inside the instruction itself.`,
      SUB:() => '<b>Decode.</b> The decoder sees SUB. The control unit will send R1 and R2 to the ALU, tell it to subtract, and write the answer back to R1.',
      JNZ:() => `<b>Decode.</b> JNZ means “jump if not zero”. The target is address ${ins.addr}; the decision depends on the zero flag.`,
      HALT:() => '<b>Decode.</b> HALT tells the control unit to stop fetching instructions.'})[ins.op]();
    return;
  }
  /* EXECUTE */
  if (ins.op === 'MOV'){ st[ins.dst] = ins.imm; st.arrows = ['cu-reg']; st.units = ['cu','reg'];
    st.msg = `<b>Execute.</b> The value ${ins.imm} is written into ${ins.dst.toUpperCase()}. MOV does not change the flags.`; }
  else if (ins.op === 'SUB'){ const a = st.r1, b = st.r2, r = (a - b) & 15; st.r1 = r; st.z = r === 0 ? 1 : 0; st.alu = `${a} − ${b} = ${r}`;
    st.arrows = ['cu-alu','reg-alu','alu-reg','alu-flag']; st.units = ['cu','alu','reg','flags'];
    st.msg = `<b>Execute.</b> The ALU calculates ${a} − ${b} = ${r} and the result goes back into R1. It ${r ? 'is not zero, so the zero flag is 0' : 'is zero, so the zero flag is set to 1'}.`; }
  else if (ins.op === 'JNZ'){ st.arrows = ['flag-cu']; st.units = ['cu','flags'];
    if (!st.z){ st.pc = ins.addr; st.arrows.push('cu-pc'); st.units.push('pc');
      st.msg = `<b>Execute.</b> The zero flag is 0, so the jump is taken: the control unit loads ${ins.addr} into the program counter and the loop runs again.`; }
    else st.msg = '<b>Execute.</b> The zero flag is 1, so the jump is not taken. The CPU simply carries on with the next instruction.'; }
  else { st.halted = true; st.arrows = []; st.units = ['cu'];
    st.msg = '<b>Execute.</b> HALT: the program has finished after counting R1 down to zero. Press <b>Reset</b> to run it again.'; }
}
function cuArrow(key, d, head){
  return `<g class="cu-arr" data-a="${key}"><path class="arr" d="${d}"/><path class="arr-h" d="${head}"/></g>`;
}
const hd = (x,y,dir) => ({r:`M${x-10} ${y-6}L${x} ${y}L${x-10} ${y+6}Z`, l:`M${x+10} ${y-6}L${x} ${y}L${x+10} ${y+6}Z`,
  d:`M${x-6} ${y-10}L${x} ${y}L${x+6} ${y-10}Z`, u:`M${x-6} ${y+10}L${x} ${y}L${x+6} ${y+10}Z`})[dir];

SCENES.control = (n) => {
  let s = '';
  /* memory */
  s += `<g class="bg">${R(60,96,262,330,14,'m-panel','data-u="mem"')}${T(80,126,'Memory','t')}${T(302,126,'address','t t-xs t-mut t-end')}`;
  CU_PROG.forEach((p,i) => { s += `<g class="mem-row" data-row="${i}">${R(70,142+i*54,242,44,8,'')}${T(92,170+i*54,i,'t t-sm t-mut t-num')}${T(124,170+i*54,p.txt,'t t-num')}</g>`; });
  s += `${T(80,412,'A tiny made-up program','t t-xs t-mut')}</g>`;
  /* boxes */
  const box = (u,x,y,w,h,label,inner='') => `${R(x,y,w,h,12,'m-block',`data-u="${u}"`)}${T(x+14,y+26,label,'t t-sm t-mut')}${inner}`;
  s += `<g class="bg">${box('pc',380,96,170,76,'Program counter',T(396,156,'','t t-lg t-num','data-v="pc"'))}
    ${box('ir',600,96,340,76,'Instruction register',T(616,156,'','t t-lg t-num','data-v="ir"'))}
    ${R(380,222,170,112,12,'m-acc-soft','data-u="cu"')}${T(396,250,'Control unit','t t-sm')}${T(396,288,'','t t-lg','data-v="phase"')}${T(396,316,'','t t-xs t-mut','data-v="tick"')}</g>`;
  s += hot('decoder',[600,222,180,112], box('dec',600,222,180,112,'Decoder',T(614,270,'','t','data-v="d1"')+T(614,298,'','t t-sm t-mut','data-v="d2"')),{label:'Instruction decoder'});
  s += hot('clock',[810,222,130,112], box('clk',810,222,130,112,'Clock',`<path class="ln" d="M826 300h14v-30h20v30h20v-30h20v30h14"/>`));
  s += hot('registers',[380,384,170,116], box('reg',380,384,170,116,'Registers',T(396,440,'','t t-num','data-v="r1"')+T(396,474,'','t t-num','data-v="r2"')));
  s += hot('alu',[600,384,180,116], box('alu',600,384,180,116,'ALU',T(614,454,'','t t-num','data-v="alu"')));
  s += hot('flag-logic',[810,384,130,116], box('flags',810,384,130,116,'Flags',`<g class="flag" data-s="z">${R(826,432,44,44,8,'')}${T(848,460,'Z','')}</g>`+T(882,460,'','t t-num','data-v="z"')),{label:'Zero flag'});
  /* arrows */
  s += cuArrow('pc-mem','M380 134H332',hd(322,134,'l'));
  s += cuArrow('mem-ir','M322 104H350V78H770V86',hd(770,96,'d'));
  s += cuArrow('ir-dec','M690 172V212',hd(690,222,'d'));
  s += cuArrow('dec-cu','M600 278H560',hd(550,278,'l'));
  s += cuArrow('cu-reg','M440 334V374',hd(440,384,'d'));
  s += cuArrow('cu-alu','M550 318H575V374H660',hd(660,384,'d'));
  s += cuArrow('reg-alu','M550 442H590',hd(600,442,'r'));
  s += cuArrow('alu-reg','M690 500V530H500V510',hd(500,500,'u'));
  s += cuArrow('alu-flag','M780 442H800',hd(810,442,'r'));
  s += cuArrow('flag-cu','M875 384V356H520V344',hd(520,334,'u'));
  s += cuArrow('cu-pc','M465 222V182',hd(465,172,'u'));
  /* phase pills + controls */
  ['Fetch','Decode','Execute'].forEach((p,i) => { s += `<g class="pill" data-p="${i}">${R(60+i*134,548,124,44,22,'')}${T(122+i*134,576,p,'')}</g>`; });
  s += btnS(520,548,140,44,'Next step','id="cu-next"') + btnS(670,548,120,44,'Run','id="cu-run" aria-pressed="false"') + btnS(800,548,140,44,'Reset','id="cu-reset"');
  s += `<text class="caption" x="60" y="626" data-v="msg"></text>`;
  return {svg:s, init: el => {
    const st = SIM[n.id] || (SIM[n.id] = JSON.parse(JSON.stringify(CU_INIT)));
    let timer = null;
    const v = (k, html) => { const e = el.querySelector(`[data-v="${k}"]`); if (e) e.innerHTML = html; };
    const render = () => {
      v('pc', st.pc); v('ir', st.ir < 0 ? '—' : CU_PROG[st.ir].txt);
      v('phase', st.halted ? 'Stopped' : st.phase < 0 ? 'Ready' : ['Fetching','Decoding','Executing'][st.phase]);
      v('tick', `clock tick ${st.tick}`);
      const ins = st.ir >= 0 && st.phase >= 1 ? CU_PROG[st.ir] : null;
      v('d1', ins ? ins.op : '—'); v('d2', ins ? ({MOV:() => `${ins.dst.toUpperCase()} ← ${ins.imm}`, SUB:() => 'R1 ← R1 − R2', JNZ:() => `target ${ins.addr}`, HALT:() => 'stop'})[ins.op]() : '');
      v('r1', `R1 = ${st.r1}`); v('r2', `R2 = ${st.r2}`); v('alu', st.alu || '<tspan class="t-mut">idle</tspan>'); v('z', `= ${st.z}`);
      v('msg', tspans(wrap(st.msg.replace(/<\/?b>/g,''), 88), 60, 25));
      el.querySelector('.flag').classList.toggle('on', !!st.z);
      el.querySelectorAll('.cu-arr').forEach(a => { const on = st.arrows.includes(a.dataset.a); a.querySelectorAll('path').forEach(p => p.classList.toggle('on', on)); });
      el.querySelectorAll('[data-u]').forEach(u => u.classList.toggle('active', st.units.includes(u.dataset.u)));
      el.querySelectorAll('.mem-row').forEach(r => r.classList.toggle('on', +r.dataset.row === st.ir && st.phase === 0));
      el.querySelectorAll('.pill').forEach(p => p.classList.toggle('on', +p.dataset.p === st.phase && !st.halted));
      const run = el.querySelector('#cu-run'); run.querySelector('text').textContent = timer ? 'Pause' : 'Run';
      run.classList.toggle('on', !!timer); run.setAttribute('aria-pressed', timer ? 'true' : 'false');
      if (typeof setLive === 'function') setLive('control', st.msg);
    };
    const stop = () => { clearInterval(timer); timer = null; };
    const step = () => { if (!el.isConnected){ stop(); return; } cuStep(st); if (st.halted) stop(); render(); };
    onPress(el.querySelector('#cu-next'), () => { stop(); step(); });
    onPress(el.querySelector('#cu-run'), () => { if (timer) stop(); else { if (st.halted) Object.assign(st, JSON.parse(JSON.stringify(CU_INIT))); timer = setInterval(step, REDUCED ? 1800 : 1300); step(); } render(); });
    onPress(el.querySelector('#cu-reset'), () => { stop(); Object.assign(st, JSON.parse(JSON.stringify(CU_INIT))); render(); });
    render();
  }};
};
