/* ==========================================================
   scenes/alu86.js
   The ALU in "8086" mode: the same idea as the simple 4-bit ALU
   (inputs A and B, pick an operation, watch the result and flags),
   but as a small 8086 machine:
   - registers AX, BX, CX, DX and 16 bytes of memory (DS:0000–000F)
   - A (destination) and B (source) can be any register, a memory
     address or a number, following the 8086's rules
   - every operation the 8086 performs on its operands (59, in tabs)
   - a preview of what will change, and Execute to write it back
   - flags going in and coming out ("?" = undefined on the 8086)
   - real 8086 clock cycles, including memory access time
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
const ALU86_UNITS = [          /* [key, short name, full name, part it links to] */
  ['arith','Adder','Adder / subtractor','arithmetic-unit'], ['logic','Logic','Logic unit','logic-unit'], ['shift','Shifter','Shifter / rotator','shifter'],
  ['muldiv','Mul / Div','Multiply / divide (microcode)','multiplier'], ['bcd','BCD','Decimal adjust',null], ['move','Move','Move / sign extend',null],
  ['cond','Jump test','Condition test for jumps','comparator'], ['flags','Flags','Flag logic','flag-logic']];
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
/* ---------------- the little 8086 machine ---------------- */
const A86_REGS = ['A','B','C','D'];
const A86_MEM = 16;                                   /* bytes of memory shown, at DS:0000 */
const A86_DEFAULT = () => ({w:16, regs:{A:0x1234, B:0x00FF, C:0x0003, D:0x0000},
  mem:[0x10,0x20,0x30,0x40,0x34,0x12,0x78,0x56,0x05,0x00,0xFF,0x7F,0x00,0x80,0x01,0x00],
  flags:0x0002, dst:'A', src:'B', cnt:'1', addr:4, imm:5, op:'ADD', grp:'arith', execs:0, last:'', ip:0});
const SHIFTS = ['SHL','SHR','SAR','ROL','ROR','RCL','RCR'];
const opOf = label => label.split(' ')[0];

/* Which operands an operation takes. dst/src list the allowed choices:
   A B C D = registers, M = memory, I = a number; 'fixed' = set by the instruction. */
function rules86(op){
  if (['ADD','ADC','SUB','SBB','CMP','AND','OR','XOR','TEST','MOV'].includes(op) || op[0] === 'J') return {dst:'ABCDM', src:'ABCDMI'};
  if (op === 'XCHG') return {dst:'ABCDM', src:'ABCDM'};
  if (['INC','DEC','NEG','NOT'].includes(op)) return {dst:'ABCDM', src:''};
  if (SHIFTS.includes(op)) return {dst:'ABCDM', src:'count'};
  if (['MUL','IMUL','DIV','IDIV'].includes(op)) return {dst:'fixed', src:'ABCDM'};
  return {dst:'fixed', src:''};
}
const regName = (k, w) => k + (w === 8 ? 'L' : 'X');
const memName = a => `[${I8086.hex(a, 4)}h]`;
function memAddr(st, w){ return w === 16 ? Math.min(st.addr, A86_MEM - 2) : st.addr; }
function readOp(st, k, w){
  if (k === 'I') return st.imm & (2**w - 1);
  if (k === 'M'){ const a = memAddr(st, w); return w === 8 ? st.mem[a] : st.mem[a] | (st.mem[a+1] << 8); }
  return st.regs[k] & (w === 8 ? 0xFF : 0xFFFF);
}
function writeOp(st, k, w, v){
  if (k === 'I'){ st.imm = v; return; }
  if (k === 'M'){ const a = memAddr(st, w); st.mem[a] = v & 255; if (w === 16) st.mem[a+1] = (v >> 8) & 255; return; }
  st.regs[k] = w === 8 ? (st.regs[k] & 0xFF00) | (v & 255) : v & 0xFFFF;
}
function asmOp(st, k, w, other){
  if (k === 'I') return String(st.imm & (2**w - 1));
  if (k === 'M') return (other === 'I' || !other ? (w === 8 ? 'BYTE PTR ' : 'WORD PTR ') : '') + memName(memAddr(st, w));
  return regName(k, w);
}

/* Build the instruction and run it on the emulator. Nothing in `st` is changed. */
function run86(st){
  const op = opOf(st.op), w = FORCE_W[op] || st.w, m = 2**w - 1, R = rules86(op);
  const d = R.dst === 'fixed' ? null : st.dst, s = R.src === 'count' ? st.cnt : R.src ? st.src : null;
  const o = {op, w, d, s, undef: new Set(UNDEF[op] || [])};
  if (d === 'M' && s === 'M'){ o.error = 'The 8086 cannot use two memory operands in one instruction. Choose a register for A or B.'; o.asm = `${op} ${memName(st.addr)}, ${memName(st.addr)}`; return o; }
  let prog;
  if (R.src === 'count') prog = `${op} ${asmOp(st, d, w)}, ${s === 'CL' ? 'CL' : '1'}`;
  else if (R.dst === 'fixed' && s) prog = `${op} ${asmOp(st, s, w)}`;
  else if (R.dst === 'fixed') prog = op;
  else if (!s) prog = `${op} ${asmOp(st, d, w)}`;
  else prog = `${op === 'MOV' || op === 'XCHG' || op[0] !== 'J' ? op : 'CMP'} ${asmOp(st, d, w, s)}, ${asmOp(st, s, w, d)}`;
  o.asm = prog;
  const cpu = new I8086.CPU();
  cpu.assemble(prog);
  cpu.r.AX = st.regs.A; cpu.r.BX = st.regs.B; cpu.r.CX = st.regs.C; cpu.r.DX = st.regs.D;
  for (let i = 0; i < A86_MEM; i++) cpu.mem[cpu.phys(cpu.s.DS, i)] = st.mem[i];
  o.fin = (st.flags & 0x0FD5) | 2; cpu.flags = o.fin;
  cpu.step();
  o.divErr = /Divide error/.test(cpu.note);
  if (o.divErr){ o.error = `Divide error: ${readOp(st, s, w) === 0 ? 'dividing by 0' : 'the quotient does not fit in ' + (w === 8 ? 'AL' : 'AX')}. The 8086 would jump to interrupt 0, and nothing is written.`; return o; }
  o.regs = {A:cpu.r.AX, B:cpu.r.BX, C:cpu.r.CX, D:cpu.r.DX};
  o.mem = Array.from({length: A86_MEM}, (_, i) => cpu.mem[cpu.phys(cpu.s.DS, i)]);
  o.flags = cpu.flags;
  if (op[0] === 'J'){                                  /* test the jump condition on the flags from CMP */
    const j = new I8086.CPU(); j.assemble(`${op} t\nHLT\nt: HLT`); j.flags = cpu.flags; j.step(); o.taken = j.ip === 2;
  }
  const count = s === 'CL' ? st.regs.C & 255 : 1;
  o.count = count;
  if (SHIFTS.includes(op)){ if (count !== 1) o.undef.add('OF'); if (count === 0) o.undef.clear(); }
  if (['ROL','ROR','RCL','RCR'].includes(op)) o.undef = count && count !== 1 ? new Set(['OF']) : new Set();
  /* what to show in the A, B, result and second rows */
  const after = {...st, regs: o.regs, mem: o.mem};
  o.dv = d ? readOp(st, d, w) : null; o.sv = s && s !== '1' && s !== 'CL' ? readOp(st, s, w) : s === 'CL' ? st.regs.C & 255 : s === '1' ? 1 : null;
  const lo = k => o.regs[k] & 0xFF, hi = k => o.regs[k] >> 8;
  if (d && !['CMP','TEST'].includes(op) && op[0] !== 'J') o.res = {v: readOp(after, d, w), w, name: d === 'M' ? memName(memAddr(st, w)) : regName(d, w), stored: true};
  if (op === 'CMP' || op[0] === 'J') o.res = {v: (o.dv - o.sv) & m, w, name: 'not stored', stored: false};
  if (op === 'TEST') o.res = {v: o.dv & o.sv, w, name: 'not stored', stored: false};
  if (op === 'XCHG') o.hi = {v: readOp(after, s, w), w, name: (s === 'M' ? memName(memAddr(st, w)) : regName(s, w)) + ' (was A)'};
  if (op === 'MUL' || op === 'IMUL'){ o.res = {v: w === 8 ? lo('A') : o.regs.A, w, name: w === 8 ? 'AL' : 'AX', stored: true}; o.hi = {v: w === 8 ? hi('A') : o.regs.D, w, name: w === 8 ? 'AH high half' : 'DX high half'}; }
  if (op === 'DIV' || op === 'IDIV'){ o.res = {v: w === 8 ? lo('A') : o.regs.A, w, name: (w === 8 ? 'AL' : 'AX') + ' quotient', stored: true}; o.hi = {v: w === 8 ? hi('A') : o.regs.D, w, name: (w === 8 ? 'AH' : 'DX') + ' remainder'}; }
  if (['DAA','DAS'].includes(op)) o.res = {v: lo('A'), w: 8, name: 'AL', stored: true};
  if (['AAA','AAS','AAM','AAD','CBW'].includes(op)) o.res = {v: o.regs.A, w: 16, name: 'AX', stored: true};
  if (op === 'CWD'){ o.res = {v: o.regs.A, w: 16, name: 'AX', stored: true}; o.hi = {v: o.regs.D, w: 16, name: 'DX sign copy'}; }
  if (op === 'LAHF') o.res = {v: hi('A'), w: 8, name: 'AH', stored: true};
  if (!o.res) o.res = {v: 0, w, name: op[0] === 'J' ? 'not stored' : 'flags only', stored: false, none: true};
  if (op[0] === 'J') o.res.none = true;
  o.regsChanged = A86_REGS.filter(k => o.regs[k] !== st.regs[k]);
  o.memChanged = o.mem.map((v, i) => v !== st.mem[i] ? i : -1).filter(i => i >= 0);
  o.cycles = cycles86(o, st);
  return o;
}

/* Clock cycles on a real 8086 (Intel 8086 user's manual). A direct address
   such as [0004h] takes 6 more (the "EA" time); each word read or written at
   an odd address takes 4 more. */
function cycles86(o, st){
  const {op, w, d, s} = o, mem = d === 'M' || s === 'M', EA = 6;
  const isA = k => k === 'A';
  let base, words = 0, form = d === 'M' ? (s === 'I' ? 'mi' : 'mr') : s === 'M' ? 'rm' : s === 'I' ? 'ri' : 'rr';
  const alu = {rr:3, ri:4, rm:9, mr:16, mi:17}, cmp = {rr:3, ri:4, rm:9, mr:9, mi:10}, tst = {rr:3, ri:5, rm:9, mr:9, mi:11}, mov = {rr:2, ri:4, rm:8, mr:9, mi:10};
  const K = op[0] === 'J' ? 'CMP' : op;
  if (['ADD','ADC','SUB','SBB','AND','OR','XOR'].includes(K)){ base = alu[form]; words = form === 'rm' ? 1 : form === 'mr' || form === 'mi' ? 2 : 0; }
  else if (K === 'CMP'){ base = cmp[form]; words = mem ? 1 : 0; }
  else if (K === 'TEST'){ base = tst[form] - (form === 'ri' && isA(d) ? 1 : 0); words = mem ? 1 : 0; }
  else if (K === 'MOV'){ if ((form === 'rm' && isA(d)) || (form === 'mr' && isA(s))){ base = 10; words = 1; return fmtCyc(base, 0, words, w, st); }
    base = mov[form]; words = mem ? 1 : 0; }
  else if (K === 'XCHG'){ base = mem ? 17 : (isA(d) || isA(s)) && w === 16 ? 3 : 4; words = mem ? 2 : 0; }
  else if (K === 'INC' || K === 'DEC'){ base = d === 'M' ? 15 : w === 16 ? 2 : 3; words = d === 'M' ? 2 : 0; }
  else if (K === 'NEG' || K === 'NOT'){ base = d === 'M' ? 16 : 3; words = d === 'M' ? 2 : 0; }
  else if (SHIFTS.includes(K)){ const byCL = s === 'CL', per = byCL ? 4 * o.count : 0;
    base = (d === 'M' ? (byCL ? 20 : 15) : (byCL ? 8 : 2)) + per; words = d === 'M' ? 2 : 0; }
  else if (['MUL','IMUL','DIV','IDIV'].includes(K)){
    const T = {MUL:[[70,77],[118,133],[76,83],[124,139]], IMUL:[[80,98],[128,154],[86,104],[134,160]], DIV:[[80,90],[144,162],[86,96],[150,168]], IDIV:[[101,112],[165,184],[107,118],[171,190]]}[K];
    const r = T[(s === 'M' ? 2 : 0) + (w === 16 ? 1 : 0)];
    return fmtCyc(r, s === 'M' ? EA : 0, s === 'M' ? 1 : 0, w, st, true);
  }
  else base = {DAA:4,DAS:4,AAA:4,AAS:4,AAM:83,AAD:60,CBW:2,CWD:5,CLC:2,STC:2,CMC:2,CLD:2,STD:2,CLI:2,STI:2,LAHF:4,SAHF:4}[K];
  const out = fmtCyc(base, mem ? EA : 0, words, w, st);
  if (op[0] === 'J'){ const j = o.taken ? 16 : 4; out.text = `CMP ${out.text} + ${op} ${j}`; out.lo += j; out.hi += j; out.total = String(out.lo);
    out.time = `${(out.lo * 0.2).toFixed(1)} µs at 5 MHz`; }
  return out;
}
function fmtCyc(base, ea, words, w, st, range){
  const odd = w === 16 && words && (memAddr(st, w) % 2) ? 4 * words : 0;
  const lo = (range ? base[0] : base) + ea + odd, hi = (range ? base[1] : base) + ea + odd;
  const parts = [range ? `${base[0]}–${base[1]}` : String(base)];
  if (ea) parts.push(`${ea} address`); if (odd) parts.push(`${odd} odd address`);
  const total = lo === hi ? String(lo) : `${lo}–${hi}`;
  return {text: `${parts.join(' + ')}${parts.length > 1 ? ' = ' + total : ''}`, total, lo, hi, time: lo === hi ? `${(lo * 0.2).toFixed(1)} µs at 5 MHz` : `${(lo * 0.2).toFixed(1)}–${(hi * 0.2).toFixed(1)} µs at 5 MHz`};
}

function explain86(o, st){
  const {op, w} = o, hx = (v, bw = w) => I8086.hex(v, bw/4) + 'h', F = k => (o.flags >> I8086.FB[k]) & 1, cin = o.fin & 1;
  const d = (Object.values(INSTR).flat().find(r => r[0].split(/\s*[\/,]\s*/).includes(op)) || [,''])[1];
  if (o.error) return {title: o.asm, desc: d, text: o.error};
  const dN = o.d ? (o.d === 'M' ? memName(memAddr(st, w)) : regName(o.d, w)) : '', sN = o.s === 'M' ? memName(memAddr(st, w)) : o.s === 'I' ? 'the number' : o.s === 'CL' ? 'CL' : o.s === '1' ? '1' : o.s ? regName(o.s, w) : '';
  const r = o.res.v, rs = hx(r, o.res.w), dv = o.dv, sv = o.sv, sg = (v, bw = w) => v >= 2**(bw-1) ? v - 2**bw : v;
  let x = '';
  switch (op){
    case 'ADD': case 'ADC': x = `${dN} = ${hx(dv)} + ${hx(sv)}${op === 'ADC' ? ` + CF (${cin})` : ''} = ${rs}   (${dv} + ${sv}${op === 'ADC' ? ' + ' + cin : ''} = ${dv + sv + (op === 'ADC' ? cin : 0)}${F('CF') ? `, too big for ${w} bits, so CF = 1` : ''}${F('OF') ? '; as signed numbers it overflows, so OF = 1' : ''}).`; break;
    case 'SUB': case 'SBB': case 'CMP': x = `${hx(dv)} − ${hx(sv)}${op === 'SBB' ? ` − CF (${cin})` : ''} = ${rs}   (${dv} − ${sv}${op === 'SBB' ? ' − ' + cin : ''} = ${dv - sv - (op === 'SBB' ? cin : 0)}${F('CF') ? ', a borrow was needed, so CF = 1' : ''}).${op === 'CMP' ? ' Nothing is written; only the flags change.' : ` The answer goes into ${dN}.`}`; break;
    case 'INC': case 'DEC': x = `${dN} = ${hx(dv)} ${op === 'INC' ? '+' : '−'} 1 = ${rs}. INC and DEC leave CF unchanged.`; break;
    case 'NEG': x = `${dN} = 0 − ${hx(dv)} = ${rs}   (${sg(dv)} becomes ${sg(r)}).`; break;
    case 'NOT': x = `${dN} = NOT ${hx(dv)} = ${rs}. NOT changes no flags.`; break;
    case 'AND': case 'OR': case 'XOR': case 'TEST': x = `${hx(dv)} ${op === 'TEST' ? 'AND' : op} ${hx(sv)} = ${rs}.${op === 'TEST' ? ' Nothing is written; only the flags change.' : ` The answer goes into ${dN}.`} CF and OF are cleared.`; break;
    case 'MOV': x = `${dN} gets a copy of ${sN}: ${rs}. MOV changes no flags.`; break;
    case 'XCHG': x = `${dN} and ${sN} swap: ${dN} becomes ${rs} and ${sN} becomes ${hx(o.hi.v)}. No flags change.`; break;
    case 'MUL': case 'IMUL': { const a = w === 8 ? st.regs.A & 255 : st.regs.A;
      x = `${w === 8 ? 'AL' : 'AX'} × ${sN} = ${op === 'IMUL' ? sg(a) : a} × ${op === 'IMUL' ? sg(sv) : sv} = ${op === 'IMUL' ? sg(a) * sg(sv) : a * sv}. The answer fills ${w === 8 ? 'AX (AH:AL)' : 'DX:AX'}: high ${hx(o.hi.v)}, low ${rs}. CF = OF = ${F('CF')}.`; break; }
    case 'DIV': case 'IDIV': { const n = w === 8 ? st.regs.A : st.regs.D * 65536 + st.regs.A, nn = op === 'IDIV' ? (w === 8 ? sg(n, 16) : (n >= 2**31 ? n - 2**32 : n)) : n;
      x = `${w === 8 ? 'AX' : 'DX:AX'} ÷ ${sN} = ${nn} ÷ ${op === 'IDIV' ? sg(sv) : sv} = ${op === 'IDIV' ? sg(r) : r} remainder ${op === 'IDIV' ? sg(o.hi.v) : o.hi.v}. Quotient into ${w === 8 ? 'AL' : 'AX'}, remainder into ${w === 8 ? 'AH' : 'DX'}.`; break; }
    case 'SHL': case 'SHR': case 'SAR': case 'ROL': case 'ROR': case 'RCL': case 'RCR': x = o.count === 0 ? 'CL is 0, so nothing changes, not even the flags.' :
      `${dN} = ${hx(dv)} ${op} by ${o.count}${o.s === 'CL' ? ' (the count in CL)' : ''} = ${rs}. The last bit moved out went into CF (${F('CF')}).${o.count !== 1 ? ' OF is only defined for a count of 1.' : ''}${['ROL','ROR','RCL','RCR'].includes(op) ? ' Rotates do not change SF, ZF or PF.' : ''}`; break;
    case 'DAA': case 'DAS': x = `Fixes AL after ${op === 'DAA' ? 'adding' : 'subtracting'} two packed-BCD bytes: ${hx(st.regs.A & 255, 8)} becomes ${rs}, so each hex digit is back in 0–9.`; break;
    case 'AAA': case 'AAS': x = `Fixes AL after ${op === 'AAA' ? 'adding' : 'subtracting'} unpacked BCD digits: AX ${hx(st.regs.A, 16)} becomes ${rs}.`; break;
    case 'AAM': x = `AH = AL ÷ 10 and AL = AL mod 10: AX ${hx(st.regs.A, 16)} becomes ${rs}.`; break;
    case 'AAD': x = `AL = AH × 10 + AL and AH = 0: AX ${hx(st.regs.A, 16)} becomes ${rs}, ready for DIV.`; break;
    case 'CBW': x = `The sign bit of AL fills AH: AX becomes ${rs} (${sg(st.regs.A & 255, 8)} is still ${sg(r, 16)}).`; break;
    case 'CWD': x = `The sign bit of AX fills DX: DX becomes ${hx(o.hi.v, 16)}, so DX:AX holds ${sg(st.regs.A, 16)} as 32 bits.`; break;
    case 'LAHF': x = `AH gets SF, ZF, AF, PF and CF from the flags going in: ${rs}.`; break;
    case 'SAHF': x = `SF, ZF, AF, PF and CF are loaded from AH (${hx(st.regs.A >> 8, 8)}).`; break;
    case 'CLC': case 'STC': case 'CMC': case 'CLD': case 'STD': case 'CLI': case 'STI': x = `${d} Only that flag changes.`; break;
    default: if (op[0] === 'J'){ const [cond, meaning] = JCOND[op];
      x = `CMP ${dN}, ${sN === 'the number' ? st.imm : sN} sets the flags, then ${op} tests ${cond}: ${o.taken ? 'true, so the jump is taken' : 'false, so the jump is not taken'}. It means “jump if ${meaning}”.`; }
  }
  return {title: o.asm + (op[0] === 'J' ? ` then ${op} …` : ''), desc: d, text: x};
}

/* ---------------- machine code: the bytes the BIU puts in the queue ----------------
   Standard 8086 encodings. A memory operand here is always a direct address
   (ModR/M mod = 00, r/m = 110, then a 16-bit address). Checked against the
   Capstone disassembler (build/test-alu86-encoding.py). */
const RCODE = {A:0, C:1, D:2, B:3};
const ALU_N = {ADD:0, OR:1, ADC:2, SBB:3, AND:4, SUB:5, XOR:6, CMP:7};
const GRP3 = {NOT:2, NEG:3, MUL:4, IMUL:5, DIV:6, IDIV:7};
const SH_N = {ROL:0, ROR:1, RCL:2, RCR:3, SHL:4, SHR:5, SAR:7};
const JCC_N = {JO:0, JNO:1, JB:2, JAE:3, JE:4, JNE:5, JBE:6, JA:7, JS:8, JNS:9, JP:10, JNP:11, JL:12, JGE:13, JLE:14, JG:15};
const ONE_BYTE = {DAA:0x27, DAS:0x2F, AAA:0x37, AAS:0x3F, CBW:0x98, CWD:0x99, LAHF:0x9F, SAHF:0x9E, CLC:0xF8, STC:0xF9, CMC:0xF5, CLD:0xFC, STD:0xFD, CLI:0xFA, STI:0xFB};
function encode86(o, st){
  const {op, w, d, s} = o, W = w === 16 ? 1 : 0, addr = memAddr(st, w), out = [];
  const B = (b, role) => out.push([b & 255, role]);
  const modrm = (mod, reg, rm) => (mod << 6) | (reg << 3) | rm;
  const mem = () => { B(addr & 255, 'address low'); B(addr >> 8, 'address high'); };
  const imm = (v, wide) => { B(v & 255, wide ? 'data low' : 'data'); if (wide) B((v >> 8) & 255, 'data high'); };
  const rm = (k, ext) => { if (k === 'M'){ B(modrm(0, ext, 6), 'ModR/M'); mem(); } else B(modrm(3, ext, RCODE[k]), 'ModR/M'); };
  const K = op[0] === 'J' ? 'CMP' : op;
  if (ONE_BYTE[K] !== undefined) B(ONE_BYTE[K], 'opcode');
  else if (K === 'AAM' || K === 'AAD'){ B(K === 'AAM' ? 0xD4 : 0xD5, 'opcode'); B(0x0A, 'base 10'); }
  else if (ALU_N[K] !== undefined || K === 'TEST' || K === 'MOV'){
    const iv = st.imm & (2**w - 1);
    if (s === 'I'){
      if (K === 'MOV'){ if (d === 'M'){ B(0xC6 | W, 'opcode'); B(modrm(0, 0, 6), 'ModR/M'); mem(); } else B(0xB0 + W*8 + RCODE[d], 'opcode'); imm(iv, W); }
      else if (K === 'TEST'){ if (d === 'A') B(0xA8 | W, 'opcode'); else { B(0xF6 | W, 'opcode'); rm(d, 0); } imm(iv, W); }
      else { const n = ALU_N[K];
        if (d === 'A'){ B(n*8 + 4 + W, 'opcode'); imm(iv, W); }
        else { const small = W && (iv < 0x80 || iv >= 0xFF80); B(W ? (small ? 0x83 : 0x81) : 0x80, 'opcode'); rm(d, n); imm(iv, W && !small); } }
    }
    else if (K === 'MOV' && d === 'A' && s === 'M'){ B(0xA0 | W, 'opcode'); mem(); }
    else if (K === 'MOV' && d === 'M' && s === 'A'){ B(0xA2 | W, 'opcode'); mem(); }
    else { const base = K === 'MOV' ? 0x88 : K === 'TEST' ? 0x84 : ALU_N[K]*8;
      if (d === 'M'){ B(base | W, 'opcode'); B(modrm(0, RCODE[s], 6), 'ModR/M'); mem(); }
      else if (s === 'M'){ B(base | (K === 'TEST' ? 0 : 2) | W, 'opcode'); B(modrm(0, RCODE[d], 6), 'ModR/M'); mem(); }
      else { B(base | W, 'opcode'); B(modrm(3, RCODE[s], RCODE[d]), 'ModR/M'); } }
  }
  else if (K === 'XCHG'){
    if (W && d !== 'M' && s !== 'M' && (d === 'A' || s === 'A')) B(0x90 + RCODE[d === 'A' ? s : d], 'opcode');
    else if (d === 'M' || s === 'M'){ B(0x86 | W, 'opcode'); B(modrm(0, RCODE[d === 'M' ? s : d], 6), 'ModR/M'); mem(); }
    else { B(0x86 | W, 'opcode'); B(modrm(3, RCODE[s], RCODE[d]), 'ModR/M'); }
  }
  else if (K === 'INC' || K === 'DEC'){
    if (W && d !== 'M') B((K === 'INC' ? 0x40 : 0x48) + RCODE[d], 'opcode'); else { B(0xFE | W, 'opcode'); rm(d, K === 'INC' ? 0 : 1); } }
  else if (GRP3[K] !== undefined){ B(0xF6 | W, 'opcode'); rm(K === 'NOT' || K === 'NEG' ? d : s, GRP3[K]); }
  else if (SH_N[K] !== undefined){ B((s === 'CL' ? 0xD2 : 0xD0) | W, 'opcode'); rm(d, SH_N[K]); }
  if (op[0] === 'J'){ B(0x70 + JCC_N[op], 'opcode'); out.push([null, 'jump offset']); }
  return out;
}

/* ---------------- the drawing: 8086 architecture (BIU above, EU below) ----------------
   Laid out like the classic 8086 block diagram: memory outside the chip at the top;
   the BIU with the address adder (Σ), segment registers and instruction queue; the
   internal bus; and the EU with the register file, control unit, ALU and flags.
   Execute animates the five stages: fetch, decode, operands, execute, write back. */
const SEGS86 = {CS:0x0000, DS:0x0100, ES:0x0100, SS:0x0200};      /* same as the emulator */
const UNIT_WORD = {arith:'adder', logic:'logic', shift:'shifter', muldiv:'microcode loop', bcd:'decimal adjust', move:'move', cond:'compare', flags:'flag logic'};
const FLOW_STAGES = ['fetch', 'decode', 'operands', 'execute', 'write'];

function alu86Scene(n){
  const VB = [1320, 800];
  let s = '';
  const badge = (k, x, y) => `<g class="step-badge" data-stage="${k + 1}"><circle cx="${x}" cy="${y}" r="11"/><text x="${x}" y="${y + 5}">${k + 1}</text></g>`;
  /* ---- left: width, operation tabs, Execute ---- */
  s += hot('alu-control',[10,66,262,726], R(10,66,262,726,16,'m-panel') + T(24,90,'Operations','t t-sm'),{rx:20, label:'Operation decoder: every 8086 operation'});
  s += btnS(20,100,118,32,'8-bit','data-w="8" aria-label="8-bit operands (AL, BL, CL, DL)"') + btnS(144,100,118,32,'16-bit','data-w="16" aria-label="16-bit operands (AX, BX, CX, DX)"');
  ALU86_GROUPS.forEach(([g, name], i) => { s += btnS(20 + (i % 2)*124, 142 + Math.floor(i/2)*38, 118, 32, name, `data-grp="${g}" aria-label="${name} operations" style="font-size:14px"`); });
  s += `<path class="ln" d="M20 300H262" style="opacity:.5"/>`;
  ALU86_GROUPS.forEach(([g, , ops]) => { s += `<g data-set="${g}">` + ops.map((o, i) => btnS(20 + (i % 2)*124, 310 + Math.floor(i/2)*38, 118, 33, o, `data-op="${o}" aria-label="Operation ${o}" style="font-size:14.5px"`)).join('') + '</g>'; });
  s += btnS(20,628,242,44,'Execute','data-exec aria-label="Execute the instruction and show the flow"');
  s += btnS(20,680,118,32,'Random','data-rand aria-label="Random values in registers and memory" style="font-size:14px"') + btnS(144,680,118,32,'Reset','data-reset aria-label="Reset registers, memory and flags" style="font-size:14px"');
  s += T(24,736,'','t t-xs t-mut','data-txt="execs"') + T(24,756,'','t t-xs t-mut','data-txt="execs2"');
  /* ---- memory, outside the chip ---- */
  s += R(286,66,714,80,12,'m-block') + T(300,86,'Memory <tspan class="t-xs t-mut" style="font-weight:500">outside the 8086 · click a byte</tspan>','t t-sm') + T(990,86,'','t t-xs t-mut t-end','data-txt="mnote"');
  for (let a = 0; a < A86_MEM; a++){ const x = 340 + a*40;
    s += `<g class="ctl memc" data-addr="${a}" role="button" tabindex="0" aria-label="Memory byte at offset ${I8086.hex(a, 4)}h"><title>Offset ${I8086.hex(a, 4)}h (physical address ${I8086.hex(SEGS86.DS*16 + a, 5)}h)</title>${R(x, 94, 34, 28, 5, '')}<text x="${x + 17}" y="${113}" data-mv style="font-size:14px">00</text></g>` +
         T(x + 17, 138, I8086.hex(a, 2), 't t-xs t-mut t-mid', 'style="font-size:11.5px"'); }
  /* ---- BIU ---- */
  s += R(286,152,1024,172,16,'band-biu') + T(300,174,'BIU','t t-sm') + T(338,174,'Bus interface unit','t t-xs t-mut');
  s += W([[650,188],[650,146]], 'w-addr') + T(658,168,'20-bit address','t t-xs t-mut');
  s += P('M578 216H722L698 188H602Z','m-acc-soft','data-act="sum"') + T(650,209,'Σ','t t-sm t-mid');
  s += T(570,206,'address adder','t t-xs t-mut t-end');
  s += W([[650,222],[650,216]], 'w-seg');
  ['CS','DS','ES','SS','IP'].forEach((r, i) => { const y = 222 + i*19;
    s += `<g data-seg="${r}">${R(580, y, 140, 18, 3, 'm-block')}${T(592, y + 14, r, 't t-xs')}${T(708, y + 14, '', 't t-xs t-num t-end', 'data-sv')}</g>`; });
  s += W([[760,334],[760,202],[710,202]], 'w-off') + T(768,300,'offset','t t-xs t-mut');
  s += T(800,208,'','t t-xs t-mut','data-txt="pa1"') + T(800,230,'','t t-sm t-num','data-txt="pa2"') + T(800,252,'','t t-sm t-num','data-txt="pa3"');
  s += W([[520,146],[520,334]], 'w-mem-rd') + W([[520,334],[520,146]], 'w-mem-wr') + T(512,244,'16-bit','t t-xs t-mut t-end') + T(512,262,'data bus','t t-xs t-mut t-end');
  s += W([[1000,108],[1205,108],[1205,196]], 'w-fetch') + T(1014,100,'instruction bytes','t t-xs t-mut') + badge(0, 1188, 128);
  s += T(1196,190,'Instruction queue','t t-xs t-end') + T(1216,190,'6 bytes','t t-xs t-mut');
  for (let q = 0; q < 6; q++){ const y = 196 + q*20;
    s += `<g class="qcell" data-q="${q}">${R(1110, y, 190, 19, 3, '')}${T(1124, y + 15, '', 't t-xs t-num', 'data-qb')}${T(1156, y + 15, '', 't t-xs t-mut', 'data-qr')}</g>`; }
  /* ---- internal bus ---- */
  s += `<path class="bus86" data-s="w-bus" d="M296 334H1300"/>` + T(318,326,'internal bus, 16 bits','t t-xs t-mut') + badge(2, 300, 334);
  /* ---- EU ---- */
  s += R(286,346,1024,446,16,'band-eu') + T(300,368,'EU','t t-sm') + T(328,368,'Execution unit','t t-xs t-mut');
  s += W([[440,382],[440,334]], 'w-reg-rd') + W([[440,334],[440,382]], 'w-reg-wr');   /* read: up to the bus; write: down */
  A86_REGS.forEach((k, i) => { const y = 384 + i*38;
    s += `<g data-reg="${k}">${T(306, y + 23, k + 'X', 't t-sm')}${R(336, y, 94, 34, 6, 'm-block', 'data-half="H"')}${R(434, y, 94, 34, 6, 'm-block', 'data-half="L"')}` +
         `${T(344, y + 22, k + 'H', 't t-xs t-mut')}${T(420, y + 23, '', 't t-sm t-num t-end', 'data-hv')}${T(442, y + 22, k + 'L', 't t-xs t-mut')}${T(518, y + 23, '', 't t-sm t-num t-end', 'data-lv')}` +
         `${T(536, y + 14, '', 't t-xs', 'data-rr')}${T(536, y + 30, '', 't t-xs t-num', 'data-rn')}</g>`; });
  [['SI','0000h'],['DI','0000h'],['BP','0000h'],['SP','0100h']].forEach(([r, v], i) => { const y = 540 + i*32;
    s += `${T(306, y + 20, r, 't t-sm')}${R(336, y, 192, 28, 6, 'm-block')}${T(518, y + 20, v, 't t-sm t-num t-end')}`; });
  s += T(306,684,'SI, DI, BP and SP hold addresses; not used here.','t t-xs t-mut');
  /* operand latches A and B, fed from the bus */
  const latch = (k, x, w, chips) => {
    let g = R(x, 390, w, 106, 12, 'm-panel', `data-latch="${k}"`) + T(x + 10, 414, k.toUpperCase(), 't t-sm');
    const pitch = w === 244 ? 36 : 41, cw = w === 244 ? 34 : 38, idx = {dst:0, src:0, cnt:0};
    chips.forEach(([key, label]) => { const row = k === 'a' ? 'dst' : (key === '1' || key === 'CL') ? 'cnt' : 'src', i = idx[row]++;
      g += btnS(x + 28 + i*pitch, 396, cw, 24, label, `data-pick="${row}" data-k="${key}" style="font-size:12.5px"`); });
    for (const [row, y] of [['h', 426], ['l', 450]]){
      g += T(x + 44, y + 15, '', 't t-xs t-mut t-end', `data-rl="${k}${row}"`);
      for (let c = 0; c < 8; c++){ const b = (row === 'h' ? 15 : 7) - c, cx = x + 48 + c*24;
        g += `<g class="bitc" data-row="${k}" data-b="${b}" role="switch" tabindex="0" aria-checked="false" aria-label="${k.toUpperCase()} bit ${b}">${R(cx, y, 21, 20, 4, '')}<text x="${cx + 10.5}" y="${y + 15}" style="font-size:13.5px">0</text></g>`; } }
    return g + T(x + 10, 488, '', 't t-xs t-mut', `data-txt="${k}x"`);
  };
  s += W([[786,334],[786,390]], 'w-a') + W([[1038,334],[1038,390]], 'w-b');
  s += hot('alu-registers', [[668,390,236,106],[916,390,244,106],[700,610,300,72]], '', {label:'Operand and result registers'});
  s += latch('a', 668, 236, [['A','AX'],['B','BX'],['C','CX'],['D','DX'],['M','Mem']]);
  s += latch('b', 916, 244, [['A','AX'],['B','BX'],['C','CX'],['D','DX'],['M','Mem'],['I','Num'],['1','1'],['CL','CL']]);
  /* ALU */
  s += W([[786,496],[786,516]], 'w-ain') + W([[1038,496],[1038,516]], 'w-bin');
  s += P('M700 516H868L908 548L948 516H1116L1052 592H764Z','m-acc-soft alu86','data-act="alu"') + T(908,572,'ALU','t t-sm t-mid') + T(908,588,'','t t-xs t-mid','data-txt="aluop"') + badge(3, 730, 540);
  /* control unit, under the queue */
  s += W([[1205,316],[1205,380]], 'w-q2cu') + badge(1, 1224, 360);
  s += R(1164,380,136,84,12,'m-panel','data-act="cu"') + T(1174,400,'Control unit','t t-xs') + T(1174,420,'','t t-xs t-num','data-txt="cu1"') + T(1174,438,'','t t-xs t-mut','data-txt="cu2"') + T(1174,456,'','t t-xs t-mut','data-txt="cu3"');
  s += W([[1180,464],[1180,530],[1106,530]], 'w-cu2alu');
  /* result, high half / remainder, flags */
  s += W([[908,592],[908,610]], 'w-res');
  s += R(700,610,300,72,12,'m-block','data-act="res"') + T(710,628,'','t t-xs','data-txt="rn"') + T(990,628,'','t t-sm t-num t-end','data-txt="rx"');
  for (const [row, y] of [['h', 636], ['l', 658]]){
    s += T(772, y + 14, '', 't t-xs t-mut t-end', `data-rl="r${row}"`);
    for (let c = 0; c < 8; c++){ const b = (row === 'h' ? 15 : 7) - c, cx = 780 + c*24;
      s += `<g class="bitc ro" data-row="r" data-b="${b}">${R(cx, y, 21, 19, 4, '')}<text x="${cx + 10.5}" y="${y + 14}" style="font-size:13px">0</text></g>`; } }
  s += `<g data-hibox>${R(1010,610,144,72,12,'m-block')}${T(1020,630,'','t t-xs','data-txt="hn1"')}${T(1020,648,'','t t-xs t-mut','data-txt="hn2"')}${T(1144,672,'','t t-sm t-num t-end','data-txt="hx"')}</g>`;
  s += W([[700,646],[656,646],[656,334]], 'w-wb') + badge(4, 656, 700 - 40);
  s += W([[1066,575],[1164,575]], 'w-flags');
  s += hot('flag-logic',[1164,556,136,140], R(1164,556,136,140,12,'m-block') + T(1174,574,'Flag register','t t-xs'), {label:'Flag register'});
  FLAG_ORDER.forEach((f, i) => { const x = 1170 + (i % 3)*42, y = 582 + Math.floor(i/3)*37;
    s += `<g class="ctl flag fin" data-fin="${f}" role="switch" tabindex="0" aria-checked="false" aria-label="${FLAG_NAME[f]} flag"><title>${FLAG_NAME[f]} flag</title>${R(x, y, 38, 33, 6, '')}${T(x + 19, y + 13, f, '', 'style="font-size:11.5px"')}<text x="${x + 19}" y="${y + 28}" data-fv style="font-size:13px">0</text></g>`; });
  s += T(1164,712,'? = undefined','t t-xs t-mut');
  /* explanation */
  s += T(300,736,'','t t-sm','data-txt="ex1"') + T(300,758,'','t t-sm t-mut','data-txt="ex2"') + T(300,780,'','t t-sm t-mut','data-txt="ex3"');
  s += aluModeSwitch(VB[0]/2 + 10, '8086');
  return {svg: s, vb: VB, init: el => {
    requestWide(true);
    el.dataset.scrollStart = 'left';
    const st = SIM.alu86 && SIM.alu86.regs ? SIM.alu86 : (SIM.alu86 = A86_DEFAULT());
    if (st.ip === undefined) st.ip = 0;
    let flash = null, flashTimer = null, anim = null;
    const txt = (k, v) => { const e = el.querySelector(`[data-txt="${k}"]`); if (e) e.innerHTML = v; };
    const fmt = (v, bw) => `${I8086.hex(v, bw/4)}h`;
    const regLabel = (k, bw, half) => k === 'M' ? (half === 'h' ? 'hi' : 'lo') : k === 'I' ? (half === 'h' ? 'hi' : 'lo') : k === 'CL' || k === '1' ? '' : bw === 8 ? k + 'L' : k + (half === 'h' ? 'H' : 'L');
    const showBits = (k, val, bw, on, lbl) => {
      el.querySelectorAll(`.bitc[data-row="${k}"]`).forEach(c => { const b = +c.dataset.b, vis = bw && b < bw;
        c.style.display = vis ? '' : 'none'; const bit = (val >> b) & 1; c.classList.toggle('on', !!bit && on !== false); c.querySelector('text').textContent = bit;
        if (c.getAttribute('role')) c.setAttribute('aria-checked', bit ? 'true' : 'false'); c.style.opacity = on === false ? .35 : ''; });
      const h = el.querySelector(`[data-rl="${k}h"]`), l = el.querySelector(`[data-rl="${k}l"]`);
      if (h) h.textContent = bw === 16 ? lbl[0] : ''; if (l) l.textContent = bw ? lbl[1] : '';
    };
    const aSpec = (op, w) => {
      const R = rules86(op);
      if (R.dst !== 'fixed') return [st.dst, w];
      if (['MUL','IMUL','DAA','DAS','CBW'].includes(op)) return ['A', ['MUL','IMUL'].includes(op) ? w : 8];
      if (['DIV','IDIV','AAA','AAS','AAM','AAD','CWD'].includes(op)) return ['A', 16];
      if (op === 'SAHF') return ['AH', 8];
      return [null, w];
    };
    /* which paths an instruction uses, per stage */
    const paths = o => {
      const R = rules86(o.op), mem = (o.d === 'M' || o.s === 'M');
      const writes = o.res && o.res.stored, memWrite = writes && o.d === 'M' && !['CMP','TEST'].includes(o.op);
      const regWrite = (o.regsChanged || []).length > 0;
      return {
        fetch: ['w-fetch', 'q'], decode: ['w-q2cu', 'cu'],
        operands: ['w-bus', 'w-a', ...(R.src && (o.s !== '1') ? ['w-b'] : []), ...(A86_REGS.includes(o.d) || A86_REGS.includes(o.s) || o.s === 'CL' || R.dst === 'fixed' ? ['w-reg-rd'] : []), ...(mem ? ['w-mem-rd', 'w-addr', 'w-seg', 'w-off', 'sum'] : [])],
        execute: ['w-ain', ...(R.src ? ['w-bin'] : []), 'w-cu2alu', 'alu', 'w-flags', 'flags'],
        write: [...(writes || regWrite ? ['w-res', 'res', 'w-wb', 'w-bus'] : []), ...(regWrite ? ['w-reg-wr'] : []), ...(memWrite ? ['w-mem-wr', 'w-addr', 'w-seg', 'w-off', 'sum'] : [])],
      };
    };
    const light = keys => {
      el.querySelectorAll('.wire[data-s], .bus86').forEach(x => x.classList.toggle('on', keys.includes(x.dataset.s)));
      el.querySelectorAll('[data-act]').forEach(x => x.classList.toggle('active', keys.includes(x.dataset.act)));
      el.querySelectorAll('.qcell').forEach(x => x.classList.toggle('on', keys.includes('q')));
      el.querySelector('[data-hibox]').classList.toggle('lit', keys.includes('res'));
    };
    const stageText = (k, o, code) => {
      const bytes = code.filter(b => b[0] !== null).map(b => I8086.hex(b[0], 2)).join(' ');
      const dN = o.d ? (o.d === 'M' ? memName(memAddr(st, o.w)) : regName(o.d, o.w)) : '', sN = o.s === 'M' ? memName(memAddr(st, o.w)) : o.s === 'I' ? String(st.imm & (2**o.w - 1)) : o.s === 'CL' ? 'CL' : o.s === '1' ? '1' : o.s ? regName(o.s, o.w) : '';
      const operandsWord = [o.d && !['MUL','IMUL','DIV','IDIV'].includes(o.op) ? dN : (aSpec(o.op, o.w)[0] ? (aSpec(o.op, o.w)[1] === 16 ? 'AX' : 'AL') : ''), sN].filter(Boolean);
      return {
        fetch: `1 · Fetch: the BIU reads ${code.filter(b => b[0] !== null).length} byte${code.length > 1 ? 's' : ''} (${bytes}) at CS × 16 + IP into the queue.`,
        decode: `2 · Decode: the control unit turns ${bytes} into ${o.asm}.`,
        operands: operandsWord.length ? `3 · Operands: ${operandsWord.join(' and ')} go${operandsWord.length === 1 ? 'es' : ''} over the internal bus to the ALU${(o.d === 'M' || o.s === 'M') ? `; the BIU reads memory at ${I8086.hex(SEGS86.DS*16 + memAddr(st, o.w), 5)}h` : ''}.` : '3 · Operands: this instruction works on the flags only.',
        execute: `4 · Execute: the ALU does ${o.op}${o.res && !o.res.none ? ` and gets ${fmt(o.res.v, o.res.w)}` : ''}, and the flags are updated.`,
        write: o.op[0] === 'J' ? `5 · The jump is ${o.taken ? 'taken: IP moves to the jump target' : 'not taken: IP moves to the next instruction'}.` :
          o.res && o.res.stored ? `5 · Write back: the result goes over the bus into ${o.res.name}.` : '5 · Nothing to write back: only the flags change.',
      }[k];
    };
    const upd = () => {
      const op = opOf(st.op), R = rules86(op), w = FORCE_W[op] || st.w;
      if (R.dst !== 'fixed' && !R.dst.includes(st.dst)) st.dst = 'A';
      if (R.src && R.src !== 'count' && !R.src.includes(st.src)) st.src = 'B';
      const o = run86(st), ex = explain86(o, st), code = o.error ? [] : encode86(o, st);
      el._last = o;
      /* A latch */
      const [ak, aw] = aSpec(op, w);
      const aval = ak === 'AH' ? st.regs.A >> 8 : ak === 'A' && R.dst === 'fixed' ? (aw === 8 ? st.regs.A & 255 : st.regs.A) : ak ? readOp(st, ak, aw) : 0;
      showBits('a', aval, ak ? aw : 0, !!ak, ak === 'AH' ? ['', 'AH'] : [regLabel(ak, aw, 'h'), regLabel(ak, aw, 'l')]);
      txt('ax', ak ? `${fmt(aval, aw)} = ${aval}${R.dst === 'fixed' ? ` · always ${ak === 'AH' ? 'AH' : aw === 8 ? 'AL' : ['DIV','IDIV'].includes(op) && w === 16 ? 'DX:AX' : 'AX'}` : ''}` : 'not used');
      /* B latch */
      const bk = R.src === 'count' ? st.cnt : R.src ? st.src : null, bw = R.src === 'count' ? 8 : w;
      const bval = bk === '1' ? 1 : bk === 'CL' ? st.regs.C & 255 : bk ? readOp(st, bk, bw) : 0;
      showBits('b', bval, bk ? bw : 0, !!bk, [regLabel(bk, bw, 'h'), bk === 'CL' ? 'CL' : bk === '1' ? '' : regLabel(bk, bw, 'l')]);
      el.querySelectorAll('.bitc[data-row="b"]').forEach(c => c.classList.toggle('ro', bk === '1'));
      txt('bx', bk ? `${fmt(bval, bw)} = ${bval}${R.src === 'count' ? ' · the count' : ''}` : 'not used');
      el.querySelectorAll('[data-pick]').forEach(b => { const row = b.dataset.pick, k = b.dataset.k;
        const show = row === 'dst' ? R.dst !== 'fixed' : row === 'src' ? !!R.src && R.src !== 'count' : R.src === 'count';
        b.style.display = show ? '' : 'none';
        const cur = row === 'dst' ? st.dst : row === 'src' ? st.src : st.cnt, allowed = row === 'cnt' || (row === 'dst' ? R.dst : R.src).includes(k);
        b.classList.toggle('on', show && cur === k); b.classList.toggle('dis', !allowed); b.setAttribute('aria-pressed', cur === k);
        if (row !== 'cnt' && k !== 'M' && k !== 'I') b.querySelector('text').textContent = regName(k, w); });
      /* ALU, control unit, queue */
      const unit = o.error ? null : {ADD:'arith',ADC:'arith',SUB:'arith',SBB:'arith',CMP:'arith',INC:'arith',DEC:'arith',NEG:'arith',AND:'logic',OR:'logic',XOR:'logic',NOT:'logic',TEST:'logic',
        MUL:'muldiv',IMUL:'muldiv',DIV:'muldiv',IDIV:'muldiv',AAM:'muldiv',AAD:'muldiv',DAA:'bcd',DAS:'bcd',AAA:'bcd',AAS:'bcd',MOV:'move',XCHG:'move',CBW:'move',CWD:'move'}[op] || (SHIFTS.includes(op) ? 'shift' : op[0] === 'J' ? 'cond' : 'flags');
      txt('aluop', o.error ? '' : `${op[0] === 'J' ? 'CMP' : op} · ${UNIT_WORD[unit]}`);
      txt('cu1', o.error ? 'cannot encode' : op[0] === 'J' ? `CMP, then ${op}` : `decodes ${op}`);
      const range = !o.error && o.cycles.total.includes('–');
      txt('cu2', o.error ? '' : `${o.cycles.total} ${range ? 'cycles' : 'clock cycles'}`);
      txt('cu3', o.error ? '' : range ? o.cycles.time.replace(' at 5 MHz', '') : o.cycles.time);
      el.querySelector('[data-act="cu"]').parentNode.querySelector('title')?.remove();
      if (!o.error){ const t = document.createElementNS('http://www.w3.org/2000/svg', 'title'); t.textContent = `Clock cycles on a real 8086: ${o.cycles.text}`; el.querySelector('[data-act="cu"]').appendChild(t); }
      el.querySelectorAll('.qcell').forEach((c, q) => { const b = code[q];
        c.querySelector('[data-qb]').textContent = b ? (b[0] === null ? '??' : I8086.hex(b[0], 2)) : '';
        c.querySelector('[data-qr]').textContent = b ? b[1] : (q === 0 ? '' : ''); c.classList.toggle('empty', !b); });
      if (code.length > 6) el.querySelector('.qcell[data-q="5"] [data-qr]').textContent += ` (+${code.length - 6} more)`;
      /* BIU: segment registers and the physical address */
      el.querySelectorAll('[data-seg]').forEach(g => { const r = g.dataset.seg; g.querySelector('[data-sv]').textContent = fmt(r === 'IP' ? st.ip : SEGS86[r], 16); });
      const memUsed = !o.error && (o.d === 'M' || o.s === 'M');
      el.querySelector('[data-seg="DS"]').classList.toggle('use', memUsed);
      el.querySelector('[data-seg="CS"]').classList.toggle('use', !memUsed);
      el.querySelector('[data-seg="IP"]').classList.toggle('use', !memUsed);
      const off = memAddr(st, w);
      if (memUsed){ txt('pa1', 'Data address = DS × 16 + offset'); txt('pa2', `${fmt(SEGS86.DS, 16)} × 16 + ${fmt(off, 16)}`); txt('pa3', `= ${I8086.hex(SEGS86.DS*16 + off, 5)}h`); }
      else { txt('pa1', 'Next instruction = CS × 16 + IP'); txt('pa2', `${fmt(SEGS86.CS, 16)} × 16 + ${fmt(st.ip, 16)}`); txt('pa3', `= ${I8086.hex(SEGS86.CS*16 + st.ip, 5)}h`); }
      /* result and high half */
      const Rz = o.res || {v:0, w, none:true, name:''};
      showBits('r', Rz.v, Rz.none || o.error ? 0 : Rz.w, !o.error && Rz.stored, Rz.w === 16 ? ['high', 'low'] : ['', '']);
      txt('rn', o.error ? 'Not possible' : Rz.stored ? `Result → ${Rz.name}` : Rz.none ? (op[0] === 'J' ? 'CMP result not stored' : 'Flags only') : 'Result (not stored)');
      txt('rx', o.error ? '<tspan style="fill:var(--pin-pwr)">Error</tspan>' : op[0] === 'J' ? `<tspan style="fill:var(--${o.taken ? 'accent' : 'ink-3'})">${o.taken ? 'Jump taken' : 'Not taken'}</tspan>` : Rz.none ? '' : fmt(Rz.v, Rz.w));
      const H = !o.error && o.hi, hb = el.querySelector('[data-hibox]');
      hb.style.display = H ? '' : 'none';
      if (H){ const [n1, ...rest] = H.name.split(' '); txt('hn1', '→ ' + n1); txt('hn2', rest.join(' ')); txt('hx', fmt(H.v, H.w)); }
      /* register file: values, roles, value after Execute */
      const roles = {A:[], B:[], C:[], D:[]};
      if (R.dst !== 'fixed' && A86_REGS.includes(st.dst)) roles[st.dst].push('A');
      if (bk && A86_REGS.includes(bk)) roles[bk].push('B');
      if (bk === 'CL') roles.C.push('count');
      if (R.dst === 'fixed' && aSpec(op, w)[0]) roles.A.push('A');
      if ((['MUL','IMUL','DIV','IDIV'].includes(op) && w === 16) || op === 'CWD') roles.D.push(op === 'CWD' || op === 'MUL' || op === 'IMUL' ? 'high' : 'dividend');
      A86_REGS.forEach(k => { const g = el.querySelector(`[data-reg="${k}"]`), v = st.regs[k], nv = o.regs ? o.regs[k] : v, will = !o.error && nv !== v;
        g.querySelector('[data-hv]').textContent = I8086.hex(v >> 8, 2); g.querySelector('[data-lv]').textContent = I8086.hex(v & 255, 2);
        g.querySelector('[data-rr]').innerHTML = roles[k].length ? `<tspan style="fill:var(--accent);font-weight:700">${roles[k].join(', ')}</tspan>` : '';
        g.querySelector('[data-rn]').innerHTML = will ? `<tspan style="fill:var(--accent)">→ ${fmt(nv, 16)}</tspan>` : '';
        g.querySelectorAll('[data-half]').forEach(r => { const hv = r.dataset.half === 'H' ? [v >> 8, nv >> 8] : [v & 255, nv & 255];
          r.classList.toggle('will', will && hv[0] !== hv[1]); r.classList.toggle('flash', !!(flash && flash.regs.includes(k))); }); });
      /* memory */
      const ma = memAddr(st, w), memSel = memUsed;
      el.querySelectorAll('.memc').forEach(c => { const a = +c.dataset.addr, nv = o.mem ? o.mem[a] : st.mem[a];
        c.querySelector('[data-mv]').textContent = I8086.hex(st.mem[a], 2);
        c.classList.toggle('sel', memSel && (a === ma || (w === 16 && a === ma + 1)));
        c.classList.toggle('pick', !memSel && a === ma);
        c.classList.toggle('will', !o.error && nv !== st.mem[a]); c.classList.toggle('flash', !!(flash && flash.mem.includes(a))); });
      const mv = readOp(st, 'M', w);
      txt('mnote', `Mem = ${memName(ma)} = ${fmt(mv, w)}${w === 16 ? ` · low byte first: ${I8086.hex(st.mem[ma], 2)}, ${I8086.hex(st.mem[ma + 1], 2)}` : ''}`);
      /* flags: current value, and the value after Execute */
      FLAG_ORDER.forEach(f => { const bit = I8086.FB[f], vin = (st.flags >> bit) & 1, vout = o.error ? vin : (o.flags >> bit) & 1, und = !o.error && o.undef.has(f);
        const g = el.querySelector(`[data-fin="${f}"]`); g.classList.toggle('on', !!vin); g.setAttribute('aria-checked', vin ? 'true' : 'false');
        g.querySelector('[data-fv]').textContent = und ? `${vin}→?` : vout !== vin ? `${vin}→${vout}` : vin;
        g.classList.toggle('chg', vout !== vin && !und); g.classList.toggle('und', und);
        g.querySelector('title').textContent = `${FLAG_NAME[f]} flag is ${vin}. ${und ? `After ${op} it is undefined on the 8086.` : vout !== vin ? `${op} changes it to ${vout}.` : `${op} leaves it at ${vin}.`} Click to change it.`; });
      /* buttons and words */
      txt('execs', st.execs ? `Done: ${st.execs} instruction${st.execs > 1 ? 's' : ''}` : 'Nothing written yet.');
      txt('execs2', st.execs ? esc(st.last.length > 34 ? st.last.slice(0, 33) + '…' : st.last) : 'Execute plays the 5 steps.');
      const ex_ = el.querySelector('[data-exec]'); ex_.classList.toggle('dis', !!o.error); ex_.classList.add('on');
      ex_.querySelector('text').textContent = anim ? 'Skip to the end' : 'Execute';
      el.querySelectorAll('[data-grp]').forEach(b => { const on = b.dataset.grp === st.grp; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      el.querySelectorAll('[data-set]').forEach(g => g.style.display = g.dataset.set === st.grp ? '' : 'none');
      el.querySelectorAll('[data-op]').forEach(b => { const on = b.dataset.op === st.op; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      el.querySelectorAll('[data-w]').forEach(b => { const on = +b.dataset.w === w; b.classList.toggle('on', on); b.classList.toggle('dis', !!FORCE_W[op]); });
      const e1 = `<tspan style="font-weight:700">${esc(ex.title)}</tspan>${ex.desc ? ` — ${esc(ex.desc)}` : ''}`;
      const lines = wrap(ex.text, 118);
      txt('ex1', anim ? `<tspan style="font-weight:700;fill:var(--accent)">${esc(stageText(FLOW_STAGES[anim.stage], o, code))}</tspan>` : e1);
      txt('ex2', esc(lines[0] || '')); txt('ex3', esc(lines.slice(1).join(' ')));
      if (typeof setLive === 'function') setLive('alu', `<b>${esc(ex.title)}</b>: ${esc(ex.text)}`);
      /* paths: during the animation only the current stage; otherwise everything this instruction uses */
      el.querySelectorAll('.step-badge').forEach(b => b.classList.toggle('on', !!anim && +b.dataset.stage === anim.stage + 1));
      if (anim) light(paths(o)[FLOW_STAGES[anim.stage]]);
      else if (o.error) light([]);
      else { const P = paths(o); light([...new Set(FLOW_STAGES.flatMap(k => P[k]))].filter(k => !['q', 'cu', 'alu', 'flags', 'res', 'sum'].includes(k))); }
    };
    /* Execute: play the five stages, then write the result back */
    const commit = () => {
      const o = run86(st); if (o.error) return;
      const code = encode86(o, st);
      flash = {regs: o.regsChanged, mem: o.memChanged};
      st.regs = {...o.regs}; st.mem = o.mem.slice(); st.flags = o.flags; st.execs++;
      st.ip = (st.ip + code.length) & 0xFFFF;
      st.last = o.asm + (o.op[0] === 'J' ? ` then ${o.op} (${o.taken ? 'taken' : 'not taken'})` : '');
      anim = null; upd();
      clearTimeout(flashTimer); flashTimer = setTimeout(() => { flash = null; if (el.isConnected) upd(); }, 1600);
    };
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    onPress(el.querySelector('[data-exec]'), () => {
      if (anim){ clearTimeout(anim.timer); commit(); return; }
      if (el._last && el._last.error) return;
      if (reduceMotion){ commit(); return; }
      anim = {stage: 0};
      const next = () => { if (!el.isConnected){ anim = null; return; }
        if (anim.stage >= FLOW_STAGES.length - 1){ anim.timer = setTimeout(commit, 900); return; }
        anim.stage++; upd(); anim.timer = setTimeout(next, 1100); };
      upd(); anim.timer = setTimeout(next, 1100);
    });
    const stopAnim = () => { if (anim){ clearTimeout(anim.timer); anim = null; } };
    el.querySelectorAll('.bitc[data-row="a"],.bitc[data-row="b"]').forEach(c => onPress(c, () => {
      if (c.classList.contains('ro')) return; stopAnim();
      const op = opOf(st.op), R = rules86(op), w = FORCE_W[op] || st.w, bit = 1 << +c.dataset.b;
      if (c.dataset.row === 'a'){ const [ak, aw] = aSpec(op, w); if (!ak) return;
        if (ak === 'AH') st.regs.A ^= bit << 8; else if (R.dst === 'fixed') st.regs.A ^= bit; else writeOp(st, ak, aw, readOp(st, ak, aw) ^ bit); }
      else { const bk = R.src === 'count' ? st.cnt : R.src ? st.src : null; if (!bk || bk === '1') return;
        if (bk === 'CL') st.regs.C ^= bit; else writeOp(st, bk, w, readOp(st, bk, w) ^ bit); }
      flash = null; upd(); }));
    el.querySelectorAll('[data-pick]').forEach(b => onPress(b, () => { if (b.classList.contains('dis')) return; stopAnim(); st[b.dataset.pick] = b.dataset.k; flash = null; upd(); }));
    el.querySelectorAll('.memc').forEach(c => onPress(c, () => { stopAnim(); st.addr = +c.dataset.addr; flash = null; upd(); }));
    el.querySelectorAll('[data-w]').forEach(b => onPress(b, () => { if (!b.classList.contains('dis')){ stopAnim(); st.w = +b.dataset.w; upd(); } }));
    el.querySelectorAll('[data-fin]').forEach(g => onPress(g, () => { stopAnim(); st.flags ^= 1 << I8086.FB[g.dataset.fin]; upd(); }));
    el.querySelectorAll('[data-grp]').forEach(b => onPress(b, () => { stopAnim(); st.grp = b.dataset.grp; const ops = ALU86_GROUPS.find(g => g[0] === st.grp)[2];
      if (!ops.includes(st.op)) st.op = ops[0]; flash = null; upd(); if (window.refreshTapTargets) refreshTapTargets(); }));
    el.querySelectorAll('[data-op]').forEach(b => onPress(b, () => { stopAnim(); st.op = b.dataset.op; flash = null; upd(); }));
    onPress(el.querySelector('[data-rand]'), () => { stopAnim(); A86_REGS.forEach(k => st.regs[k] = Math.floor(Math.random() * 65536)); st.mem = st.mem.map(() => Math.floor(Math.random() * 256)); flash = null; upd(); });
    onPress(el.querySelector('[data-reset]'), () => { stopAnim(); const keep = {op: st.op, grp: st.grp, w: st.w}; Object.assign(st, A86_DEFAULT(), keep); flash = null; upd(); });
    bindModeSwitch(el);
    upd();
  }};
}
