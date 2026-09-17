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
  flags:0x0002, dst:'A', src:'B', cnt:'1', addr:4, imm:5, op:'ADD', grp:'arith', execs:0, last:''});
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
    const j = new I8086.CPU(); j.assemble(`${op} t\nHLT\nt: HLT`); j.flags = cpu.flags;
    const jr = j.step(); o.taken = !!(jr && jr.jumped);
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
  if (op[0] === 'J') out.text = `CMP ${out.text.replace(/ \(.*$/, '')} + ${op} ${o.taken ? 16 : 4}`;
  return out;
}
function fmtCyc(base, ea, words, w, st, range){
  const odd = w === 16 && words && (memAddr(st, w) % 2) ? 4 * words : 0;
  const lo = (range ? base[0] : base) + ea + odd, hi = (range ? base[1] : base) + ea + odd;
  const parts = [range ? `${base[0]}–${base[1]}` : String(base)];
  if (ea) parts.push(`${ea} address`); if (odd) parts.push(`${odd} odd address`);
  const total = lo === hi ? String(lo) : `${lo}–${hi}`;
  return {text: `${parts.join(' + ')}${parts.length > 1 ? ' = ' + total : ''}`, time: lo === hi ? `${(lo * 0.2).toFixed(1)} µs at 5 MHz` : `${(lo * 0.2).toFixed(1)}–${(hi * 0.2).toFixed(1)} µs at 5 MHz`};
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

function alu86Scene(n){
  const VB = [1300, 724];
  let s = '';
  /* ---- left: width and operation tabs ---- */
  s += hot('alu-control',[16,64,288,628], R(16,64,288,628,16,'m-panel') + T(32,90,'Operations','t t-sm'),{rx:20, label:'Operation decoder: every 8086 operation'});
  s += btnS(28,100,130,34,'8-bit','data-w="8" aria-label="8-bit operands (AL, BL, CL, DL)"') + btnS(164,100,130,34,'16-bit','data-w="16" aria-label="16-bit operands (AX, BX, CX, DX)"');
  ALU86_GROUPS.forEach(([g, name], i) => { s += btnS(28 + (i % 2)*136, 146 + Math.floor(i/2)*40, 130, 34, name, `data-grp="${g}" aria-label="${name} operations" style="font-size:14.5px"`); });
  s += `<path class="ln" d="M28 312H292" style="opacity:.5"/>`;
  ALU86_GROUPS.forEach(([g, , ops]) => { s += `<g data-set="${g}">` + ops.map((o, i) => btnS(28 + (i % 2)*136, 322 + Math.floor(i/2)*40, 130, 36, o, `data-op="${o}" aria-label="Operation ${o}"`)).join('') + '</g>'; });
  /* ---- A and B rows with operand choices ---- */
  const rows = {a:64, b:158, r:460, h:520};
  /* one hot() per row — bundling all four into one made hovering any of them
     (Result included) also ring-highlight the others, even a hidden empty one */
  const rowLabel = {a:'Operand A register', b:'Operand B register', r:'Result register', h:'High/remainder register'};
  s += ['a','b','r','h'].map(k => hot('alu-registers',[320,rows[k],640,54], R(320,rows[k],640,54,12,'m-block', `data-row="${k}"`), {label:rowLabel[k]})).join('');
  const cellX = i => 448 + i*24 + Math.floor(i/4)*5;
  const rowBits = (k, ro) => { let c = ''; for (let i = 0; i < 16; i++){ const b = 15 - i;
      c += `<g class="bitc${ro ? ' ro' : ''}" data-row="${k}" data-b="${b}" ${ro ? '' : `role="switch" tabindex="0" aria-checked="false" aria-label="${k.toUpperCase()} bit ${b}"`}>${R(cellX(i), rows[k] + 11, 22, 32, 5, '')}<text x="${cellX(i) + 11}" y="${rows[k] + 33}" style="font-size:16px">0</text></g>`; }
    return c; };
  s += T(332,rows.a+36,'A','t t-lg') + T(356,rows.a+24,'','t t-xs t-mut','data-txt="an1"') + T(356,rows.a+42,'','t t-sm','data-txt="an2"') + rowBits('a');
  s += T(332,rows.b+36,'B','t t-lg') + T(356,rows.b+24,'','t t-xs t-mut','data-txt="bn1"') + T(356,rows.b+42,'','t t-sm','data-txt="bn2"') + rowBits('b');
  s += T(332,rows.r+24,'Result','t t-sm') + T(332,rows.r+44,'','t t-xs t-mut','data-txt="rn"') + rowBits('r', true);
  s += `<g data-hirow>` + T(332,rows.h+24,'','t t-sm','data-txt="hn1"') + T(332,rows.h+44,'','t t-xs t-mut','data-txt="hn2"') + rowBits('h', true) + '</g>';
  ['a','b','r','h'].forEach(k => { s += T(854,rows[k]+26,'','t','data-txt="' + k + 'x"') + T(854,rows[k]+44,'','t t-xs t-mut','data-txt="' + k + 'd"'); });
  const chip = (row, key, label, x, y) => btnS(x, y, 50, 30, label, `data-pick="${row}" data-k="${key}" style="font-size:14px"`);
  s += T(334,142,'A is','t t-xs t-mut','data-lbl="dst"') + ['A','B','C','D','M'].map((k, i) => chip('dst', k, k === 'M' ? 'Mem' : k + 'X', 372 + i*54, 122)).join('') + T(372,142,'','t t-xs t-mut','data-txt="dnote"');
  s += T(334,236,'B is','t t-xs t-mut','data-lbl="src"') + ['A','B','C','D','M','I'].map((k, i) => chip('src', k, k === 'M' ? 'Mem' : k === 'I' ? 'Num' : k + 'X', 372 + i*54, 216)).join('') +
       ['1','CL'].map((k, i) => chip('cnt', k, k, 372 + i*54, 216)).join('') + T(704,236,'','t t-xs t-mut','data-txt="snote"');
  /* ---- flags in ---- */
  s += T(334,280,'Flags in','t t-sm');
  FLAG_ORDER.forEach((f, i) => { s += `<g class="ctl flag fin" data-fin="${f}" role="switch" tabindex="0" aria-checked="false" aria-label="${FLAG_NAME[f]} flag going in"><title>${FLAG_NAME[f]} flag before the instruction</title>${R(414 + i*46, 256, 40, 36, 7, '')}${T(434 + i*46, 271, f, '', 'style="font-size:12px"')}<text x="${434 + i*46}" y="${287}" data-fv="${f}" style="font-size:14px">0</text></g>`; });
  /* ---- units ---- */
  ALU86_UNITS.forEach(([u, name, full, node], i) => {
    const x = 320 + i*80.6, y = 302, cx = x + 38;
    const art = {arith:'+ −', logic:'& | ^', shift:'≪ ≫', muldiv:'× ÷', bcd:'+6', move:'→', cond:'?', flags:'set'}[u];
    const body = `<title>${full}</title>` + R(x, y, 76, 96, 12, 'm-panel', `data-act="${u}"`) + T(cx, y + 24, name, 't t-xs t-mid') +
      T(cx, y + 56, art, 't t-sm t-mid') + T(cx, y + 84, '—', 't t-xs t-mid t-num', `data-txt="u-${u}"`);
    s += node ? hot(node, [x, y, 76, 96], body, {rx:14, label: full}) : `<g>${body}</g>`;
    s += W([[cx, y+96],[cx, 404],[560 + i*20, 404],[560 + i*20, 418]], 'w-' + u);
  });
  /* mux sits an equal gap below the units and above Result (both 20px) */
  s += hot('alu86-mux',[420,418,440,22], P('M420 418H860L840 440H440Z','m-acc-soft') + T(640,434,'Result MUX','t t-xs t-mid'),{label:'8086 result multiplexer'});
  s += W([[640,440],[640,460]], 'w-res');
  /* ---- flags out ---- */
  s += hot('flag-logic',[320,580,640,46], R(320,580,640,46,12,'m-block') + T(334,608,'Flags out','t t-sm'), {label:'Flags produced by the operation'});
  FLAG_ORDER.forEach((f, i) => { s += `<g class="flag fout" data-fout="${f}"><title>${FLAG_NAME[f]} flag</title>${R(414 + i*46, 584, 40, 38, 7, '')}${T(434 + i*46, 599, f, '', 'style="font-size:12px"')}<text x="${434 + i*46}" y="${616}" data-fo="${f}" style="font-size:14px">0</text></g>`; });
  s += T(832,600,'? = undefined','t t-xs t-mut') + T(832,618,'on the 8086','t t-xs t-mut');
  /* ---- right: registers, memory, Execute ---- */
  s += R(976,64,308,546,14,'m-panel') + T(990,88,'Registers','t t-sm');
  A86_REGS.forEach((k, i) => { const y = 98 + i*42;
    s += `<g data-reg="${k}">${R(986, y, 288, 38, 8, 'm-block')}${T(998, y + 25, k + 'X', 't t-sm')}${T(1034, y + 20, '', 't t-sm t-num', 'data-rv')}${T(1034, y + 34, '', 't t-xs t-mut', 'data-rh')}` +
         `${T(1112, y + 20, '', 't t-sm t-num', 'data-rn')}${T(1266, y + 20, '', 't t-xs t-end', 'data-rr')}</g>`; });
  s += T(990,286,'Memory at DS:0000 <tspan class="t-xs t-mut" style="font-weight:500">· click a byte</tspan>','t t-sm');
  for (let c = 0; c < 8; c++) s += T(1046 + c*29, 304, c, 't t-xs t-mut t-mid');
  for (let r = 0; r < 2; r++){ s += T(990, 330 + r*36, I8086.hex(r*8, 4), 't t-xs t-mut t-num');
    for (let c = 0; c < 8; c++){ const a = r*8 + c;
      s += `<g class="ctl memc" data-addr="${a}" role="button" tabindex="0" aria-label="Memory byte at ${I8086.hex(a, 4)}h"><title>Address ${I8086.hex(a, 4)}h</title>${R(1033 + c*29, 312 + r*36, 26, 28, 5, '')}<text x="${1046 + c*29}" y="${331 + r*36}" data-mv style="font-size:13.5px">00</text></g>`; } }
  s += T(990,400,'','t t-xs t-mut','data-txt="mnote1"') + T(990,418,'','t t-xs t-mut','data-txt="mnote2"');
  s += btnS(986,432,288,44,'Execute','data-exec aria-label="Execute the instruction"');
  s += btnS(986,484,140,34,'Random','data-rand aria-label="Random values in registers and memory" style="font-size:14px"') + btnS(1134,484,140,34,'Reset','data-reset aria-label="Reset registers, memory and flags" style="font-size:14px"');
  s += T(990,540,'Clock cycles on a real 8086','t t-xs t-mut') + T(990,560,'','t t-sm','data-txt="cyc"') + T(990,578,'','t t-xs t-mut','data-txt="cyc2"') + T(990,600,'','t t-xs t-mut','data-txt="execs"');
  /* ---- explanation ---- */
  s += T(320,650,'','t t-sm','data-txt="ex1"') + T(320,672,'','t t-sm t-mut','data-txt="ex2"') + T(320,694,'','t t-sm t-mut','data-txt="ex3"');
  s += aluModeSwitch(VB[0]/2 + 10, '8086');
  return {svg: s, vb: VB, init: el => {
    requestWide(true);
    el.dataset.scrollStart = 'left';
    const st = SIM.alu86 && SIM.alu86.regs ? SIM.alu86 : (SIM.alu86 = A86_DEFAULT());
    let flash = null, flashTimer = null;
    const txt = (k, v) => { const e = el.querySelector(`[data-txt="${k}"]`); if (e) e.innerHTML = v; };
    const fmt = (v, bw) => `${I8086.hex(v, bw/4)}h`, dec = (v, bw) => `${v}${v >= 2**(bw-1) ? ` · ${v - 2**bw}` : ''}`;
    const showRow = (k, val, bw, on) => el.querySelectorAll(`.bitc[data-row="${k}"]`).forEach(c => { const b = +c.dataset.b, vis = b < bw;
      c.style.display = vis ? '' : 'none'; const bit = (val >> b) & 1; c.classList.toggle('on', !!bit && on !== false); c.querySelector('text').textContent = bit;
      if (c.getAttribute('role')) c.setAttribute('aria-checked', bit ? 'true' : 'false'); c.style.opacity = on === false ? .35 : ''; });
    /* what the A and B rows show and edit: [kind, width, label line 1, label line 2] */
    const aSpec = (op, w) => {
      const R = rules86(op);
      if (R.dst !== 'fixed') return [st.dst, w, 'destination', st.dst === 'M' ? memName(memAddr(st, w)) : regName(st.dst, w)];
      if (['MUL','IMUL'].includes(op)) return ['A', w, 'always', w === 8 ? 'AL' : 'AX'];
      if (['DIV','IDIV'].includes(op)) return ['A', 16, 'dividend', w === 8 ? 'AX' : 'DX:AX'];
      if (['DAA','DAS','CBW'].includes(op)) return ['A', 8, 'always', 'AL'];
      if (['AAA','AAS','AAM','AAD','CWD'].includes(op)) return ['A', 16, 'always', 'AX'];
      if (op === 'SAHF') return ['AH', 8, 'always', 'AH'];
      return [null, w, '', 'not used'];
    };
    const upd = () => {
      const op = opOf(st.op), R = rules86(op), w = FORCE_W[op] || st.w;
      /* keep the operand choices valid for this operation */
      if (R.dst !== 'fixed' && !R.dst.includes(st.dst)) st.dst = 'A';
      if (R.src && R.src !== 'count' && !R.src.includes(st.src)) st.src = 'B';
      const o = run86(st), ex = explain86(o, st);
      /* A row */
      const [ak, aw, a1, a2] = aSpec(op, w);
      const aval = ak === 'AH' ? st.regs.A >> 8 : ak === 'A' && R.dst === 'fixed' ? (aw === 8 ? st.regs.A & 255 : st.regs.A) : ak ? readOp(st, ak, aw) : 0;
      showRow('a', aval, ak ? aw : 16, !!ak); txt('an1', a1); txt('an2', a2);
      txt('ax', ak ? fmt(aval, aw) : ''); txt('ad', ak ? dec(aval, aw) : '');
      /* B row */
      const bk = R.src === 'count' ? st.cnt : R.src ? st.src : null, bw = R.src === 'count' ? 8 : w;
      const bval = bk === '1' ? 1 : bk === 'CL' ? st.regs.C & 255 : bk ? readOp(st, bk, bw) : 0;
      showRow('b', bval, bk ? bw : 16, !!bk);
      el.querySelectorAll('.bitc[data-row="b"]').forEach(c => c.classList.toggle('ro', bk === '1'));
      txt('bn1', bk ? (R.src === 'count' ? 'count' : 'source') : ''); txt('bn2', !bk ? 'not used' : bk === 'I' ? 'number' : bk === 'M' ? memName(memAddr(st, bw)) : bk === '1' ? '1' : bk === 'CL' ? 'CL' : regName(bk, bw));
      txt('bx', bk ? fmt(bval, bw) : ''); txt('bd', bk ? dec(bval, bw) : '');
      /* operand choice buttons */
      el.querySelectorAll('[data-pick]').forEach(b => { const row = b.dataset.pick, k = b.dataset.k;
        const show = row === 'dst' ? R.dst !== 'fixed' : row === 'src' ? !!R.src && R.src !== 'count' : R.src === 'count';
        b.style.display = show ? '' : 'none';
        const cur = row === 'dst' ? st.dst : row === 'src' ? st.src : st.cnt, allowed = row === 'cnt' || (row === 'dst' ? R.dst : R.src).includes(k);
        b.classList.toggle('on', show && cur === k); b.classList.toggle('dis', !allowed); b.setAttribute('aria-pressed', cur === k);
        if (row !== 'cnt' && k !== 'M' && k !== 'I') b.querySelector('text').textContent = regName(k, w); });
      const fixedNote = {MUL:`MUL always multiplies ${w === 8 ? 'AL; the answer fills AX' : 'AX; the answer fills DX:AX'}`, IMUL:`IMUL always multiplies ${w === 8 ? 'AL; the answer fills AX' : 'AX; the answer fills DX:AX'}`,
        DIV:`DIV always divides ${w === 8 ? 'AX (quotient AL, remainder AH)' : 'DX:AX (quotient AX, remainder DX)'}`, IDIV:`IDIV always divides ${w === 8 ? 'AX (quotient AL, remainder AH)' : 'DX:AX (quotient AX, remainder DX)'}`}[op];
      txt('dnote', R.dst !== 'fixed' ? '' : fixedNote || (aSpec(op, w)[0] ? `${op} always works on ${aSpec(op, w)[3]}` : `${op} has no operands`));
      el.querySelector('[data-lbl="dst"]').style.display = R.dst === 'fixed' ? 'none' : '';
      el.querySelector('[data-lbl="src"]').style.display = R.src ? '' : 'none';
      el.querySelector('[data-txt="snote"]').setAttribute('x', R.src === 'count' ? 488 : 704);
      txt('snote', R.src === 'count' ? 'the 8086 shifts by 1 or by CL' : '');
      /* results */
      const Rz = o.res || {v:0, w, none:true, name:''};
      showRow('r', Rz.v, Rz.none || o.error ? 0 : Rz.w, !o.error && Rz.stored);
      txt('rn', o.error ? 'not possible' : Rz.stored ? '→ ' + Rz.name : Rz.name);
      txt('rx', o.error ? '<tspan style="fill:var(--pin-pwr)">Error</tspan>' : op[0] === 'J' ? `<tspan style="fill:var(--${o.taken ? 'accent' : 'ink-3'})">${o.taken ? 'Jump taken' : 'Not taken'}</tspan>` : Rz.none ? '' : fmt(Rz.v, Rz.w));
      txt('rd', o.error || Rz.none ? '' : dec(Rz.v, Rz.w));
      const H = !o.error && o.hi, hr = el.querySelector('[data-hirow]');
      hr.style.display = H ? '' : 'none'; el.querySelector('[data-row="h"].m-block').style.display = H ? '' : 'none';
      if (H){ showRow('h', H.v, H.w, true); const [n1, ...rest] = H.name.split(' '); txt('hn1', '→ ' + n1); txt('hn2', rest.join(' ')); txt('hx', fmt(H.v, H.w)); txt('hd', dec(H.v, H.w)); }
      else { txt('hx', ''); txt('hd', ''); }
      /* units and wires */
      const unit = o.error ? null : {ADD:'arith',ADC:'arith',SUB:'arith',SBB:'arith',CMP:'arith',INC:'arith',DEC:'arith',NEG:'arith',AND:'logic',OR:'logic',XOR:'logic',NOT:'logic',TEST:'logic',
        MUL:'muldiv',IMUL:'muldiv',DIV:'muldiv',IDIV:'muldiv',AAM:'muldiv',AAD:'muldiv',DAA:'bcd',DAS:'bcd',AAA:'bcd',AAS:'bcd',MOV:'move',XCHG:'move',CBW:'move',CWD:'move'}[op] || (SHIFTS.includes(op) ? 'shift' : op[0] === 'J' ? 'cond' : 'flags');
      ALU86_UNITS.forEach(([u]) => { const on = u === unit || (op[0] === 'J' && u === 'arith' && !o.error);
        el.querySelector(`[data-act="${u}"]`).classList.toggle('active', on);
        txt('u-' + u, on ? (u === 'cond' ? (o.taken ? 'taken' : 'not') : u === 'flags' ? 'flags' : u === 'arith' && op[0] === 'J' ? fmt(Rz.v, Rz.w) : Rz.none ? '—' : fmt(Rz.v, Rz.w)) : '—');
        el.querySelectorAll(`.wire[data-s="w-${u}"]`).forEach(x => x.classList.toggle('on', on)); });
      el.querySelectorAll('.wire[data-s="w-res"]').forEach(x => x.classList.toggle('on', !o.error && Rz.stored));
      /* flags */
      FLAG_ORDER.forEach(f => { const bit = I8086.FB[f], vin = (st.flags >> bit) & 1, vout = o.error ? vin : (o.flags >> bit) & 1, und = !o.error && o.undef.has(f);
        const gi = el.querySelector(`[data-fin="${f}"]`); gi.classList.toggle('on', !!vin); gi.setAttribute('aria-checked', vin ? 'true' : 'false'); gi.querySelector('[data-fv]').textContent = vin;
        const go = el.querySelector(`[data-fout="${f}"]`); go.classList.toggle('on', !!vout && !und); go.classList.toggle('chg', vout !== vin && !und); go.classList.toggle('keep', und);
        go.querySelector('[data-fo]').textContent = und ? '?' : vout;
        go.querySelector('title').textContent = `${FLAG_NAME[f]} flag: ${und ? 'undefined after ' + op + ' (the 8086 manual does not say what it will be)' : vout !== vin ? 'changes to ' + vout : 'unchanged'}`; });
      /* registers and memory: current value, value after Execute, and roles */
      const roles = {A:[], B:[], C:[], D:[]};
      if (R.dst !== 'fixed' && A86_REGS.includes(st.dst)) roles[st.dst].push('A');
      if (bk && A86_REGS.includes(bk)) roles[bk].push('B');
      if (bk === 'CL') roles.C.push('count');
      if (R.dst === 'fixed' && aSpec(op, w)[0]) roles.A.push('A');
      if ((['MUL','IMUL','DIV','IDIV'].includes(op) && w === 16) || op === 'CWD') roles.D.push(op === 'CWD' || op === 'MUL' || op === 'IMUL' ? 'high' : 'dividend');
      A86_REGS.forEach(k => { const g = el.querySelector(`[data-reg="${k}"]`), v = st.regs[k], nv = o.regs ? o.regs[k] : v, will = !o.error && nv !== v;
        g.querySelector('[data-rv]').textContent = fmt(v, 16);
        g.querySelector('[data-rh]').textContent = `${k}H ${I8086.hex(v >> 8, 2)} · ${k}L ${I8086.hex(v & 255, 2)}`;
        g.querySelector('[data-rn]').innerHTML = will ? `<tspan style="fill:var(--accent)">→ ${fmt(nv, 16)}</tspan>` : '';
        g.querySelector('[data-rr]').textContent = roles[k].join(', ');
        g.classList.toggle('will', will); g.classList.toggle('flash', !!(flash && flash.regs.includes(k))); });
      const mw = (d => d)(w), ma = memAddr(st, w), memUsed = (R.dst !== 'fixed' && st.dst === 'M') || bk === 'M';
      el.querySelectorAll('.memc').forEach(c => { const a = +c.dataset.addr, nv = o.mem ? o.mem[a] : st.mem[a];
        c.querySelector('[data-mv]').textContent = I8086.hex(st.mem[a], 2);
        c.classList.toggle('sel', memUsed && (a === ma || (mw === 16 && a === ma + 1)));
        c.classList.toggle('pick', !memUsed && a === ma);
        c.classList.toggle('will', !o.error && nv !== st.mem[a]); c.classList.toggle('flash', !!(flash && flash.mem.includes(a))); });
      const mv = readOp(st, 'M', w);
      txt('mnote1', `Mem = ${memName(ma)} = ${fmt(mv, w)}`);
      txt('mnote2', w === 16 ? `Stored low byte first: ${I8086.hex(st.mem[ma], 2)}, then ${I8086.hex(st.mem[ma+1], 2)}` : 'A single byte');
      /* cycles, buttons, words */
      txt('cyc', o.error ? '—' : o.cycles.text); txt('cyc2', o.error ? '' : o.cycles.time);
      txt('execs', st.execs ? `Done ${st.execs}: ${esc(st.last.length > 30 ? st.last.slice(0, 29) + '…' : st.last)}` : 'Press Execute to write it back');
      const ex_ = el.querySelector('[data-exec]'); ex_.classList.toggle('dis', !!o.error); ex_.classList.add('on');
      el.querySelectorAll('[data-grp]').forEach(b => { const on = b.dataset.grp === st.grp; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      el.querySelectorAll('[data-set]').forEach(g => g.style.display = g.dataset.set === st.grp ? '' : 'none');
      el.querySelectorAll('[data-op]').forEach(b => { const on = b.dataset.op === st.op; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      el.querySelectorAll('[data-w]').forEach(b => { const on = +b.dataset.w === w; b.classList.toggle('on', on); b.classList.toggle('dis', !!FORCE_W[op]); });
      const e1 = `<tspan style="font-weight:700">${esc(ex.title)}</tspan>${ex.desc ? ` — ${esc(ex.desc)}` : ''}`;
      const lines = wrap(ex.text, 108);
      txt('ex1', e1); txt('ex2', esc(lines[0] || '')); txt('ex3', esc(lines.slice(1).join(' ')));
      if (typeof setLive === 'function') setLive('alu', `<b>${esc(ex.title)}</b>: ${esc(ex.text)}`);
      el._last = o;
    };
    /* controls */
    el.querySelectorAll('.bitc[data-row="a"],.bitc[data-row="b"]').forEach(c => onPress(c, () => {
      if (c.classList.contains('ro')) return;
      const op = opOf(st.op), R = rules86(op), w = FORCE_W[op] || st.w, bit = 1 << +c.dataset.b;
      if (c.dataset.row === 'a'){ const [ak, aw] = aSpec(op, w); if (!ak) return;
        if (ak === 'AH') st.regs.A ^= bit << 8; else if (R.dst === 'fixed') st.regs.A = aw === 8 ? st.regs.A ^ bit : st.regs.A ^ bit; else writeOp(st, ak, aw, readOp(st, ak, aw) ^ bit); }
      else { const bk = R.src === 'count' ? st.cnt : R.src ? st.src : null; if (!bk || bk === '1') return;
        if (bk === 'CL') st.regs.C ^= bit; else { const bw = w; writeOp(st, bk, bw, readOp(st, bk, bw) ^ bit); } }
      flash = null; upd(); }));
    el.querySelectorAll('[data-pick]').forEach(b => onPress(b, () => { if (b.classList.contains('dis')) return; st[b.dataset.pick] = b.dataset.k; flash = null; upd(); }));
    el.querySelectorAll('.memc').forEach(c => onPress(c, () => { st.addr = +c.dataset.addr; flash = null; upd(); }));
    el.querySelectorAll('[data-w]').forEach(b => onPress(b, () => { if (!b.classList.contains('dis')){ st.w = +b.dataset.w; upd(); } }));
    el.querySelectorAll('[data-fin]').forEach(g => onPress(g, () => { st.flags ^= 1 << I8086.FB[g.dataset.fin]; upd(); }));
    el.querySelectorAll('[data-grp]').forEach(b => onPress(b, () => { st.grp = b.dataset.grp; const ops = ALU86_GROUPS.find(g => g[0] === st.grp)[2];
      if (!ops.includes(st.op)) st.op = ops[0]; flash = null; upd(); }));
    el.querySelectorAll('[data-op]').forEach(b => onPress(b, () => { st.op = b.dataset.op; flash = null; upd(); }));
    onPress(el.querySelector('[data-exec]'), () => {
      const o = run86(st); if (o.error) return;
      flash = {regs: o.regsChanged, mem: o.memChanged};
      st.regs = {...o.regs}; st.mem = o.mem.slice(); st.flags = o.flags; st.execs++; st.last = o.asm + (o.op[0] === 'J' ? ` then ${o.op} (${o.taken ? 'taken' : 'not taken'})` : '');
      upd(); clearTimeout(flashTimer); flashTimer = setTimeout(() => { flash = null; if (el.isConnected) upd(); }, 1600);
    });
    onPress(el.querySelector('[data-rand]'), () => { A86_REGS.forEach(k => st.regs[k] = Math.floor(Math.random() * 65536)); st.mem = st.mem.map(() => Math.floor(Math.random() * 256)); flash = null; upd(); });
    onPress(el.querySelector('[data-reset]'), () => { const keep = {op: st.op, grp: st.grp, w: st.w}; Object.assign(st, A86_DEFAULT(), keep); flash = null; upd(); });
    bindModeSwitch(el);
    upd();
  }};
}
