/* ==========================================================
   scenes/alu86.js
   The ALU in "8086" mode: the same idea as the simple 4-bit ALU
   (inputs A and B, pick an operation, watch the result and flags),
   but with every operation the 8086 performs on its operands.
   - 8-bit (AL, BL) or 16-bit (AX, BX) operands
   - flags going in (for ADC, SBB, RCL, RCR, DAA …) and coming out,
     with changed flags highlighted and undefined flags marked "?"
   - the result, plus the high half / remainder / swapped value
   - real 8086 clock-cycle counts
   Results come from the emulator in sim/i8086.js, so this view and
   the emulator always agree. The drawing is 1300 units wide so it
   gains most from the full-width ("Hide details") layout.
   ========================================================== */
const ALU86_GROUPS = [
  ['arith','Arithmetic',['ADD','ADC','SUB','SBB','CMP','INC','DEC','NEG']],
  ['muldiv','Mul / Div',['MUL','IMUL','DIV','IDIV']],
  ['logic','Logic',['AND','OR','XOR','NOT','TEST']],
  ['shift','Shift / Rotate',['SHL / SAL','SHR','SAR','ROL','ROR','RCL','RCR']],
  ['bcd','Decimal',['DAA','DAS','AAA','AAS','AAM','AAD']],
  ['move','Move',['MOV','XCHG','CBW','CWD']],
  ['flags','Flags',['CLC','STC','CMC','CLD','STD','CLI','STI','LAHF','SAHF']],
  ['jump','Jumps',['JE / JZ','JNE / JNZ','JA / JNBE','JAE / JNB','JB / JNAE','JBE / JNA','JG / JNLE','JGE / JNL','JL / JNGE','JLE / JNG','JO','JNO','JS','JNS','JP / JPE','JNP / JPO']],
];
const ALU86_UNITS = [
  ['arith','Adder /\nsubtractor','arithmetic-unit'], ['logic','Logic','logic-unit'], ['shift','Shifter /\nrotator','shifter'],
  ['muldiv','Multiply /\ndivide','multiplier'], ['bcd','Decimal\nadjust',null], ['move','Move /\nextend',null],
  ['cond','Condition\ntest','comparator'], ['flags','Flag\nlogic','flag-logic']];
const FLAG_ORDER = ['OF','DF','IF','TF','SF','ZF','AF','PF','CF'];
const FLAG_NAME = {OF:'Overflow',DF:'Direction',IF:'Interrupt enable',TF:'Trap (single step)',SF:'Sign',ZF:'Zero',AF:'Auxiliary carry',PF:'Parity',CF:'Carry'};
const JCOND = {JE:['ZF = 1','A = B'], JNE:['ZF = 0','A ≠ B'], JA:['CF = 0 and ZF = 0','A > B as unsigned numbers'], JAE:['CF = 0','A ≥ B as unsigned numbers'],
  JB:['CF = 1','A < B as unsigned numbers'], JBE:['CF = 1 or ZF = 1','A ≤ B as unsigned numbers'], JG:['ZF = 0 and SF = OF','A > B as signed numbers'],
  JGE:['SF = OF','A ≥ B as signed numbers'], JL:['SF ≠ OF','A < B as signed numbers'], JLE:['ZF = 1 or SF ≠ OF','A ≤ B as signed numbers'],
  JO:['OF = 1','A − B overflowed as a signed number'], JNO:['OF = 0','A − B did not overflow'], JS:['SF = 1','A − B is negative'], JNS:['SF = 0','A − B is zero or positive'],
  JP:['PF = 1','the low byte of A − B has an even number of 1 bits'], JNP:['PF = 0','the low byte of A − B has an odd number of 1 bits']};
/* flags the 8086 manual lists as undefined after each instruction */
const UNDEF = {AND:['AF'],OR:['AF'],XOR:['AF'],TEST:['AF'],MUL:['SF','ZF','AF','PF'],IMUL:['SF','ZF','AF','PF'],
  DIV:['OF','SF','ZF','AF','PF','CF'],IDIV:['OF','SF','ZF','AF','PF','CF'],SHL:['AF'],SHR:['AF'],SAR:['AF'],
  DAA:['OF'],DAS:['OF'],AAA:['OF','SF','ZF','PF'],AAS:['OF','SF','ZF','PF'],AAM:['OF','AF','CF'],AAD:['OF','AF','CF']};
const FORCE_W = {DAA:8,DAS:8,SAHF:8,CBW:8,AAA:16,AAS:16,AAM:16,AAD:16,CWD:16};
const NO_OPERANDS = ['CLC','STC','CMC','CLD','STD','CLI','STI','LAHF'];
/* clock cycles on a real 8086 with register operands (Intel 8086 user's manual) */
function cycles86(op, w, count, taken){
  const T = {ADD:3,ADC:3,SUB:3,SBB:3,CMP:3,AND:3,OR:3,XOR:3,TEST:3,NEG:3,NOT:3,DAA:4,DAS:4,AAA:4,AAS:4,AAM:83,AAD:60,CBW:2,CWD:5,MOV:2,XCHG:4,
    CLC:2,STC:2,CMC:2,CLD:2,STD:2,CLI:2,STI:2,LAHF:4,SAHF:4};
  if (op === 'INC' || op === 'DEC') return w === 16 ? '2' : '3';
  if (op === 'MUL') return w === 8 ? '70–77' : '118–133';
  if (op === 'IMUL') return w === 8 ? '80–98' : '128–154';
  if (op === 'DIV') return w === 8 ? '80–90' : '144–162';
  if (op === 'IDIV') return w === 8 ? '101–112' : '165–184';
  if (['SHL','SHR','SAR','ROL','ROR','RCL','RCR'].includes(op)) return String(8 + 4*count);
  if (op[0] === 'J') return `CMP 3 + ${op} ${taken ? 16 : 4}`;
  return String(T[op]);
}
const h86 = (v, w) => I8086.hex(v, w/4) + 'h';
const sgn = (v, w) => v >= 2**(w-1) ? v - 2**w : v;

/* Run one operation on the emulator and describe the outcome */
function run86(opLabel, st){
  const op = opLabel.split(' ')[0], w = FORCE_W[op] || st.w, m = 2**w - 1;
  const A = st.a & m, B = st.b & (op === 'SAHF' ? 0 : m), rA = w === 8 ? 'AL' : 'AX', rB = w === 8 ? 'BL' : 'BX';
  const shiftOp = ['SHL','SHR','SAR','ROL','ROR','RCL','RCR'].includes(op), count = st.b & 255;
  let prog, unit;
  if (['ADD','ADC','SUB','SBB','CMP','AND','OR','XOR','TEST','MOV','XCHG'].includes(op)) prog = `${op} ${rA}, ${rB}`;
  else if (['INC','DEC','NEG','NOT'].includes(op)) prog = `${op} ${rA}`;
  else if (shiftOp) prog = `${op} ${rA}, CL`;
  else if (['MUL','IMUL','DIV','IDIV'].includes(op)) prog = `${op} ${rB}`;
  else if (op[0] === 'J') prog = `CMP ${rA}, ${rB}\n${op} t\nMOV DH, 0\nHLT\nt: MOV DH, 1\nHLT`;
  else prog = op;
  unit = {ADD:'arith',ADC:'arith',SUB:'arith',SBB:'arith',CMP:'arith',INC:'arith',DEC:'arith',NEG:'arith',AND:'logic',OR:'logic',XOR:'logic',NOT:'logic',TEST:'logic',
    MUL:'muldiv',IMUL:'muldiv',DIV:'muldiv',IDIV:'muldiv',AAM:'muldiv',AAD:'muldiv',DAA:'bcd',DAS:'bcd',AAA:'bcd',AAS:'bcd',MOV:'move',XCHG:'move',CBW:'move',CWD:'move'}[op]
    || (shiftOp ? 'shift' : op[0] === 'J' ? 'cond' : 'flags');
  const cpu = new I8086.CPU();
  cpu.assemble(prog);
  const fin = (st.fin & 0x0FD5) | 2;
  cpu.flags = fin;
  if (w === 8){ cpu.r.AX = A; cpu.r.BX = B; } else { cpu.r.AX = A; cpu.r.BX = B; }
  cpu.r.CX = count;
  if (op === 'DIV' || op === 'IDIV'){                       /* dividend = A, extended the usual way */
    const neg = op === 'IDIV' && (A >> (w-1)) & 1;
    if (w === 8) cpu.r.AX = (neg ? 0xFF00 : 0) | A; else { cpu.r.AX = A; cpu.r.DX = neg ? 0xFFFF : 0; }
  }
  if (op === 'SAHF') cpu.r.AX = (A & 255) << 8;
  for (let i = 0; i < 12 && !cpu.halted; i++) if (!cpu.step()) break;
  const out = {op, w, A, B, unit, cycles: '', fin, flags: cpu.flags, undef: new Set(UNDEF[op] || []), note: cpu.note, asm: prog.split('\n')[0]};
  if (shiftOp){ if (count !== 1) out.undef.add('OF'); if (count === 0) out.undef.clear(); }
  if (['ROL','ROR','RCL','RCR'].includes(op) && count !== 1 && count) out.undef = new Set(['OF']);
  out.divErr = /Divide error/.test(cpu.note);
  if (out.divErr){ out.flags = fin; out.undef.clear(); }
  /* results */
  const lo = w === 8 ? cpu.reg('AL') : cpu.r.AX;
  out.res = {v: lo, w, name: rA, stored: true};
  if (op === 'CMP'){ out.res = {v: (A - B) & m, w, name: rA, stored: false}; }
  if (op === 'TEST'){ out.res = {v: A & B, w, name: rA, stored: false}; }
  if (op === 'MUL' || op === 'IMUL'){ out.res.name = w === 8 ? 'AL' : 'AX'; out.hi = {v: w === 8 ? cpu.reg('AH') : cpu.r.DX, w, name: w === 8 ? 'AH (high half)' : 'DX (high half)'}; }
  if (op === 'DIV' || op === 'IDIV'){ out.res.name = (w === 8 ? 'AL' : 'AX') + ' quotient'; out.hi = {v: w === 8 ? cpu.reg('AH') : cpu.r.DX, w, name: (w === 8 ? 'AH' : 'DX') + ' remainder'}; if (out.divErr) out.res.stored = false; }
  if (op === 'XCHG') out.hi = {v: w === 8 ? cpu.reg('BL') : cpu.r.BX, w, name: rB + ' (was A)'};
  if (op === 'CBW') out.res = {v: cpu.r.AX, w: 16, name: 'AX', stored: true};
  if (op === 'CWD'){ out.res = {v: cpu.r.AX, w: 16, name: 'AX', stored: true}; out.hi = {v: cpu.r.DX, w: 16, name: 'DX (sign copy)'}; }
  if (['AAA','AAS','AAM','AAD'].includes(op)) out.res = {v: cpu.r.AX, w: 16, name: 'AX', stored: true};
  if (op === 'LAHF') out.res = {v: cpu.reg('AH'), w: 8, name: 'AH', stored: true};
  if (['CLC','STC','CMC','CLD','STD','CLI','STI','SAHF'].includes(op) || op[0] === 'J') out.res = {v: 0, w, name: '', stored: false, none: true};
  if (op[0] === 'J'){ out.taken = cpu.reg('DH') === 1; out.cmp = (A - B) & m; }
  out.cycles = cycles86(op, w, count, out.taken);
  return out;
}

function explain86(o, st){
  const {op, w, A, B} = o, hx = v => h86(v, w), F = k => (o.flags >> I8086.FB[k]) & 1, cin = (o.fin >> 0) & 1;
  const d = typeof INSTR !== 'undefined' ? (Object.values(INSTR).flat().find(r => r[0].split(/\s*[\/,]\s*/).includes(op)) || [,''])[1] : '';
  const r = o.res.v, rs = h86(r, o.res.w);
  let x = '';
  switch (op){
    case 'ADD': case 'ADC': x = `${hx(A)} + ${hx(B)}${op === 'ADC' ? ` + CF (${cin})` : ''} = ${rs}   (${A} + ${B}${op === 'ADC' ? ' + ' + cin : ''} = ${A + B + (op === 'ADC' ? cin : 0)}${F('CF') ? `, too big for ${w} bits, so it wraps and CF = 1` : ''}${F('OF') ? '; as signed numbers it overflows, so OF = 1' : ''})`; break;
    case 'SUB': case 'SBB': case 'CMP': x = `${hx(A)} − ${hx(B)}${op === 'SBB' ? ` − CF (${cin})` : ''} = ${rs}   (${A} − ${B}${op === 'SBB' ? ' − ' + cin : ''} = ${A - B - (op === 'SBB' ? cin : 0)}${F('CF') ? ', a borrow was needed, so CF = 1' : ''})${op === 'CMP' ? '. The result is not stored; only the flags change.' : ''}`; break;
    case 'INC': case 'DEC': x = `${hx(A)} ${op === 'INC' ? '+' : '−'} 1 = ${rs}. INC and DEC leave CF unchanged.`; break;
    case 'NEG': x = `0 − ${hx(A)} = ${rs}   (${sgn(A, w)} becomes ${sgn(r, w)})`; break;
    case 'AND': case 'OR': case 'XOR': case 'TEST': x = `${hx(A)} ${op === 'TEST' ? 'AND' : op} ${hx(B)} = ${rs}${op === 'TEST' ? '. The result is not stored; only the flags change.' : ''} CF and OF are cleared.`; break;
    case 'NOT': x = `NOT ${hx(A)} = ${rs}. NOT changes no flags.`; break;
    case 'MUL': case 'IMUL': x = `${op === 'IMUL' ? sgn(A, w) : A} × ${op === 'IMUL' ? sgn(B, w) : B} = ${op === 'IMUL' ? sgn(A, w) * sgn(B, w) : A * B}: high half ${h86(o.hi.v, w)}, low half ${rs}. CF = OF = ${F('CF')} (${F('CF') ? 'the high half is needed' : 'the answer fits in the low half'}).`; break;
    case 'DIV': case 'IDIV': x = o.divErr ? `Divide error: ${B === 0 ? 'dividing by 0' : 'the quotient does not fit'} makes the 8086 run interrupt 0.` :
      `${op === 'IDIV' ? sgn(A, w) : A} ÷ ${op === 'IDIV' ? sgn(B, w) : B} = ${op === 'IDIV' ? sgn(r, w) : r} remainder ${op === 'IDIV' ? sgn(o.hi.v, w) : o.hi.v}. The dividend is A extended to ${2*w} bits (${w === 8 ? 'AH' : 'DX'} = ${op === 'IDIV' && (A >> (w-1)) & 1 ? 'all 1s' : '0'}), as after ${op === 'IDIV' ? (w === 8 ? 'CBW' : 'CWD') : (w === 8 ? 'MOV AH, 0' : 'MOV DX, 0')}.`; break;
    case 'SHL': case 'SHR': case 'SAR': case 'ROL': case 'ROR': case 'RCL': case 'RCR': {
      const c = st.b & 255;
      x = c === 0 ? 'The count in CL is 0, so nothing changes, not even the flags.' :
        `${hx(A)} ${op} by ${c} (the count is in CL, taken from B) = ${rs}. The last bit moved out went into CF (${F('CF')}).${c !== 1 ? ' OF is only defined for a count of 1.' : ''}${['ROL','ROR','RCL','RCR'].includes(op) ? ' Rotates do not change SF, ZF or PF.' : ''}`; break; }
    case 'DAA': case 'DAS': x = `Fixes AL after ${op === 'DAA' ? 'adding' : 'subtracting'} two packed-BCD bytes: ${hx(A)} becomes ${rs}. Each hex digit is corrected back into 0–9.`; break;
    case 'AAA': case 'AAS': x = `Fixes AL after ${op === 'AAA' ? 'adding' : 'subtracting'} unpacked BCD digits: AX ${hx(A)} becomes ${rs}.`; break;
    case 'AAM': x = `AH = AL ÷ 10 and AL = AL mod 10: AX ${hx(A)} becomes ${rs} (${A & 255} = ${Math.floor((A & 255) / 10)} tens and ${(A & 255) % 10} units).`; break;
    case 'AAD': x = `AL = AH × 10 + AL, AH = 0: AX ${hx(A)} becomes ${rs}, ready for DIV.`; break;
    case 'MOV': x = `A gets a copy of B: ${rs}. MOV changes no flags.`; break;
    case 'XCHG': x = `A and B swap: A is now ${rs} and B is ${h86(o.hi.v, w)}. No flags change.`; break;
    case 'CBW': x = `AL ${h86(A, 8)} is copied into AX with its sign bit repeated through AH: ${rs} (${sgn(A, 8)} is still ${sgn(r, 16)}).`; break;
    case 'CWD': x = `The sign bit of AX fills all of DX: DX = ${h86(o.hi.v, 16)}. DX:AX now holds ${sgn(A, 16)} as 32 bits.`; break;
    case 'LAHF': x = `AH gets SF, ZF, AF, PF and CF from the flags going in: ${rs}.`; break;
    case 'SAHF': x = `The flags SF, ZF, AF, PF and CF are loaded from AH (A = ${h86(A, 8)}).`; break;
    case 'CLC': case 'STC': case 'CMC': case 'CLD': case 'STD': case 'CLI': case 'STI': x = `${d} Only that flag changes.`; break;
    default: if (op[0] === 'J'){ const [cond, meaning] = JCOND[op];
      x = `CMP ${hx(A)}, ${hx(B)} sets the flags, then ${op} tests ${cond}: ${o.taken ? 'true, so the jump is taken' : 'false, so the jump is not taken'}. It means “jump if ${meaning}”.`; }
  }
  return {title: `${o.asm.replace(/\n.*/s,'')}${op[0] === 'J' ? ` then ${op}` : ''}`, desc: d, text: x};
}

function alu86Scene(n){
  const VB = [1300, 700];
  let s = '';
  /* ---- left: operation tabs ---- */
  s += hot('alu-control',[16,80,288,612], R(16,80,288,612,16,'m-panel') + T(32,106,'Operations','t t-sm'),{rx:20, label:'Operation decoder: every 8086 operation'});
  ALU86_GROUPS.forEach(([g, name], i) => { s += btnS(28 + (i % 2)*136, 118 + Math.floor(i/2)*44, 130, 36, name, `data-grp="${g}" aria-label="${name} operations" style="font-size:14.5px"`); });
  s += `<path class="ln" d="M28 300H292" style="opacity:.5"/>`;
  ALU86_GROUPS.forEach(([g, , ops]) => {
    s += `<g data-set="${g}">` + ops.map((o, i) => btnS(28 + (i % 2)*136, 312 + Math.floor(i/2)*46, 130, 40, o, `data-op="${o}" aria-label="Operation ${o}"`)).join('') + '</g>';
  });
  /* ---- registers (one hotspot, several frames) ---- */
  const rows = {a:80, b:142, r:444, h:506};
  s += hot('alu-registers', [[320,rows.a,964,56],[320,rows.b,964,56],[320,rows.r,964,56],[320,rows.h,964,56]],
    ['a','b','r','h'].map(k => R(320,rows[k],964,56,12,'m-block', `data-row="${k}"`)).join(''), {label:'Operand and result registers'});
  const cellX = i => 432 + i*33 + Math.floor(i/4)*8;
  const rowBits = (k, ro) => { let c = ''; for (let i = 0; i < 16; i++){ const b = 15 - i;
      c += `<g class="bitc${ro ? ' ro' : ''}" data-row="${k}" data-b="${b}" ${ro ? '' : `role="switch" tabindex="0" aria-checked="false" aria-label="${k.toUpperCase()} bit ${b}"`}>${R(cellX(i), rows[k] + 9, 30, 38, 6, '')}<text x="${cellX(i) + 15}" y="${rows[k] + 35}" style="font-size:19px">0</text></g>`; }
    return c; };
  s += T(338,rows.a+37,'A','t t-lg') + T(364,rows.a+35,'','t t-sm t-mut','data-txt="an"') + rowBits('a');
  s += T(338,rows.b+37,'B','t t-lg') + T(364,rows.b+35,'','t t-sm t-mut','data-txt="bn"') + rowBits('b');
  s += T(336,rows.r+26,'Result','t t-sm') + T(336,rows.r+46,'','t t-xs t-mut','data-txt="rn"') + rowBits('r', true);
  s += `<g data-hirow>` + T(336,rows.h+26,'','t t-sm','data-txt="hn1"') + T(336,rows.h+46,'','t t-xs t-mut','data-txt="hn2"') + rowBits('h', true) + '</g>';
  ['a','b','r','h'].forEach(k => { s += T(1000,rows[k]+26,'','t','data-txt="' + k + 'x"') + T(1000,rows[k]+46,'','t t-xs t-mut','data-txt="' + k + 'd"'); });
  s += btnS(1196,rows.a+10,78,36,'Random','data-rnd="a" aria-label="Random value for A" style="font-size:14px"') + btnS(1196,rows.b+10,78,36,'Random','data-rnd="b" aria-label="Random value for B" style="font-size:14px"');
  /* ---- width and flags in ---- */
  s += T(336,232,'Width','t t-sm') + btnS(392,206,104,38,'8-bit','data-w="8" aria-label="8-bit operands (AL, BL)"') + btnS(502,206,104,38,'16-bit','data-w="16" aria-label="16-bit operands (AX, BX)"');
  s += T(640,232,'Flags in','t t-sm');
  FLAG_ORDER.forEach((f, i) => { s += `<g class="ctl flag fin" data-fin="${f}" role="switch" tabindex="0" aria-checked="false" aria-label="${FLAG_NAME[f]} flag going in"><title>${FLAG_NAME[f]} flag before the instruction</title>${R(716 + i*52, 204, 46, 42, 8, '')}${T(739 + i*52, 222, f, '', 'style="font-size:13px"')}<text x="${739 + i*52}" y="${240}" data-fv="${f}" style="font-size:15px">0</text></g>`; });
  /* ---- units ---- */
  s += `<path class="ln" d="M320 262H1284" style="opacity:.45"/>` + T(1284,256,'A, B, flags','t t-xs t-mut t-end');
  ALU86_UNITS.forEach(([u, name, node], i) => {
    const x = 320 + i*121.7, y = 268, cx = x + 56;
    const art = {arith:T(cx,y+76,'+  −','t t-lg t-mid'), logic:T(cx,y+74,'& | ^ ~','t t-mid'), shift:`<path class="ln" d="M${x+26} ${y+58}l14 18M${x+46} ${y+58}l14 18M${x+66} ${y+58}l14 18"/>`,
      muldiv:T(cx,y+76,'×  ÷','t t-lg t-mid'), bcd:T(cx,y+74,'+6, +60h','t t-sm t-mid'), move:T(cx,y+76,'→','t t-lg t-mid'),
      cond:T(cx,y+74,'jump?','t t-sm t-mid'), flags:T(cx,y+74,'set, clear','t t-sm t-mid')}[u];
    const body = R(x, y, 112, 120, 14, 'm-panel', `data-act="${u}"`) + name.split('\n').map((l, j) => T(cx, y + 22 + j*18, l, 't t-sm t-mid')).join('') + art +
      T(cx, y + 106, '—', 't t-sm t-mid t-num', `data-txt="u-${u}"`);
    s += node ? hot(node, [x, y, 112, 120], body, {rx:18}) : body;
    s += W([[cx, y+120],[cx, 396],[640 + i*14, 396],[640 + i*14, 404]], 'w-' + u);
  });
  s += T(1054,412,'The real 8086 has just one','t t-xs t-mut') + T(1054,428,'16-bit ALU for all of these.','t t-xs t-mut');
  s += hot('multiplexer',[560,404,484,28], P('M560 404H1044L1020 432H584Z','m-acc-soft') + T(802,423,'Result MUX','t t-sm t-mid'),{label:'Result multiplexer'});
  s += W([[802,432],[802,444]], 'w-res');
  /* ---- flags out and cycles ---- */
  s += hot('flag-logic',[320,570,560,50], R(320,570,560,50,12,'m-block') + T(336,601,'Flags out','t t-sm'), {label:'Flags produced by the operation'});
  FLAG_ORDER.forEach((f, i) => { s += `<g class="flag fout" data-fout="${f}"><title>${FLAG_NAME[f]} flag</title>${R(420 + i*50, 575, 44, 40, 7, '')}${T(442 + i*50, 591, f, '', 'style="font-size:12.5px"')}<text x="${442 + i*50}" y="${609}" data-fo="${f}" style="font-size:15px">0</text></g>`; });
  s += T(900,589,'Clock cycles on a real 8086','t t-xs t-mut') + T(900,612,'','t t-sm','data-txt="cyc"');
  /* ---- explanation ---- */
  s += T(320,644,'','t t-sm','data-txt="ex1"') + T(320,666,'','t t-sm t-mut','data-txt="ex2"') + T(320,688,'','t t-sm t-mut','data-txt="ex3"');
  s += aluModeSwitch(VB[0]/2 + 10, '8086');
  return {svg: s, vb: VB, init: el => {
    requestWide(true);
    el.dataset.scrollStart = 'left';
    const st = SIM.alu86 || (SIM.alu86 = {w:16, a:0x1234, b:0x00FF, op:'ADD', grp:'arith', fin:0x0002});
    const upd = () => {
      const o = run86(st.op, st), ex = explain86(o, st), w = o.w;
      const txt = (k, v) => { const e = el.querySelector(`[data-txt="${k}"]`); if (e) e.innerHTML = v; };
      const showRow = (k, val, bw, on) => el.querySelectorAll(`.bitc[data-row="${k}"]`).forEach(c => { const b = +c.dataset.b, vis = b < bw;
        c.style.display = vis ? '' : 'none'; const bit = (val >> b) & 1; c.classList.toggle('on', !!bit && on !== false); c.querySelector('text').textContent = bit;
        if (c.getAttribute('role')) c.setAttribute('aria-checked', bit ? 'true' : 'false'); c.style.opacity = on === false ? .35 : ''; });
      const usesB = !['INC','DEC','NEG','NOT','DAA','DAS','AAA','AAS','AAM','AAD','CBW','CWD','LAHF','SAHF','CLC','STC','CMC','CLD','STD','CLI','STI'].includes(o.op);
      const usesA = !NO_OPERANDS.includes(o.op);
      const inW = o.op === 'CBW' ? 8 : w;
      showRow('a', st.a, inW, usesA); showRow('b', st.b, o.op === 'SAHF' ? 0 : (['SHL','SHR','SAR','ROL','ROR','RCL','RCR'].includes(o.op) ? Math.min(w, 8) : w), usesB);
      const aName = {SAHF:'(AH)', CBW:'(AL)', DAA:'(AL)', DAS:'(AL)'}[o.op] || (inW === 8 ? '(AL)' : '(AX)');
      txt('an', usesA ? aName : '(not used)');
      txt('bn', !usesB ? '(not used)' : ['SHL','SHR','SAR','ROL','ROR','RCL','RCR'].includes(o.op) ? '(CL, count)' : w === 8 ? '(BL)' : '(BX)');
      const fmt = (v, bw) => `${I8086.hex(v, bw/4)}h`, dec = (v, bw) => `${v}${v >= 2**(bw-1) ? ` · signed ${v - 2**bw}` : ''}`;
      txt('ax', usesA ? fmt(st.a & (2**inW - 1), inW) : ''); txt('ad', usesA ? dec(st.a & (2**inW - 1), inW) : '');
      const bw2 = ['SHL','SHR','SAR','ROL','ROR','RCL','RCR'].includes(o.op) ? 8 : w;
      txt('bx', usesB ? fmt(st.b & (2**bw2 - 1), bw2) : ''); txt('bd', usesB ? dec(st.b & (2**bw2 - 1), bw2) : '');
      /* result rows */
      const R0 = o.res;
      showRow('r', R0.v, R0.none ? 0 : R0.w, R0.stored);
      txt('rn', R0.none ? (o.op[0] === 'J' ? 'CMP result not stored' : 'flags only') : R0.stored ? R0.name : 'not stored');
      txt('rx', R0.none ? (o.op[0] === 'J' ? `<tspan style="fill:var(--${o.taken ? 'accent' : 'ink-3'})">${o.taken ? 'Jump taken' : 'Not taken'}</tspan>` : '') : fmt(R0.v, R0.w));
      txt('rd', R0.none ? '' : dec(R0.v, R0.w));
      const H = o.hi, hr = el.querySelector('[data-hirow]');
      hr.style.display = H ? '' : 'none'; el.querySelector('[data-row="h"].m-block').style.display = H ? '' : 'none';
      if (H){ showRow('h', H.v, H.w, !o.divErr); const [a1, ...rest] = H.name.split(' '); txt('hn1', a1); txt('hn2', rest.join(' ')); txt('hx', fmt(H.v, H.w)); txt('hd', dec(H.v, H.w)); }
      else { txt('hx', ''); txt('hd', ''); }
      /* units and wires */
      ALU86_UNITS.forEach(([u]) => { const on = u === o.unit || (o.op[0] === 'J' && u === 'arith');
        el.querySelector(`[data-act="${u}"]`).classList.toggle('active', on);
        txt('u-' + u, on ? (u === 'cond' ? (o.taken ? 'taken' : 'not taken') : u === 'flags' ? 'flags' : u === 'arith' && o.op[0] === 'J' ? fmt(o.cmp, w) : fmt(R0.none ? 0 : R0.v, R0.w)) : '—');
        el.querySelectorAll(`.wire[data-s="w-${u}"]`).forEach(x => x.classList.toggle('on', on)); });
      el.querySelectorAll('.wire[data-s="w-res"]').forEach(x => x.classList.toggle('on', R0.stored));
      /* flags */
      FLAG_ORDER.forEach(f => { const bit = I8086.FB[f], vin = (st.fin >> bit) & 1, vout = (o.flags >> bit) & 1, und = o.undef.has(f);
        const gi = el.querySelector(`[data-fin="${f}"]`); gi.classList.toggle('on', !!vin); gi.setAttribute('aria-checked', vin ? 'true' : 'false'); gi.querySelector('[data-fv]').textContent = vin;
        const go = el.querySelector(`[data-fout="${f}"]`); go.classList.toggle('on', !!vout && !und); go.classList.toggle('chg', vout !== vin && !und); go.classList.toggle('keep', und);
        go.querySelector('[data-fo]').textContent = und ? '?' : vout;
        go.querySelector('title').textContent = `${FLAG_NAME[f]} flag: ${und ? 'undefined after ' + o.op + ' (the 8086 manual does not say what it will be)' : vout !== vin ? 'changed to ' + vout : 'unchanged'}`; });
      txt('cyc', `${o.cycles}${/^\d+$/.test(o.cycles) ? ` (${(+o.cycles * 0.2).toFixed(1)} µs at 5 MHz)` : ['MUL','IMUL','DIV','IDIV'].includes(o.op) ? ' (a microcode loop reusing the ALU)' : ''}`);
      /* operation buttons, width buttons */
      el.querySelectorAll('[data-grp]').forEach(b => { const on = b.dataset.grp === st.grp; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      el.querySelectorAll('[data-set]').forEach(g => g.style.display = g.dataset.set === st.grp ? '' : 'none');
      el.querySelectorAll('[data-op]').forEach(b => { const on = b.dataset.op === st.op; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      el.querySelectorAll('[data-w]').forEach(b => { const on = +b.dataset.w === (FORCE_W[o.op] ? w : st.w); b.classList.toggle('on', on); b.classList.toggle('dis', !!FORCE_W[o.op]); });
      /* words */
      const e1 = `<tspan style="font-weight:700">${esc(ex.title)}</tspan>${ex.desc ? ` — ${esc(ex.desc)}` : ''}${FORCE_W[o.op] ? `<tspan class="t-mut"> (always ${o.op === 'CBW' ? 'AL → AX' : o.op === 'CWD' ? 'AX → DX:AX' : w === 8 ? 'AL' : 'AX'})</tspan>` : ''}`;
      const lines = wrap(ex.text, 108);
      txt('ex1', e1); txt('ex2', esc(lines[0] || '')); txt('ex3', esc(lines.slice(1).join(' ')));
      if (typeof setLive === 'function') setLive('alu', `<b>${esc(ex.title)}</b>: ${esc(ex.text)}`);
    };
    /* controls */
    el.querySelectorAll('.bitc[data-row="a"],.bitc[data-row="b"]').forEach(c => onPress(c, () => { const k = c.dataset.row; st[k] ^= 1 << +c.dataset.b; upd(); }));
    el.querySelectorAll('[data-rnd]').forEach(b => onPress(b, () => { st[b.dataset.rnd] = Math.floor(Math.random() * 65536); upd(); }));
    el.querySelectorAll('[data-w]').forEach(b => onPress(b, () => { if (!b.classList.contains('dis')){ st.w = +b.dataset.w; upd(); } }));
    el.querySelectorAll('[data-fin]').forEach(g => onPress(g, () => { st.fin ^= 1 << I8086.FB[g.dataset.fin]; upd(); }));
    el.querySelectorAll('[data-grp]').forEach(b => onPress(b, () => { st.grp = b.dataset.grp; const first = ALU86_GROUPS.find(g => g[0] === st.grp)[2][0];
      if (!ALU86_GROUPS.find(g => g[0] === st.grp)[2].includes(st.op)) st.op = first; upd(); }));
    el.querySelectorAll('[data-op]').forEach(b => onPress(b, () => { st.op = b.dataset.op; upd(); }));
    bindModeSwitch(el);
    upd();
  }};
}
