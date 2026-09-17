/* ==========================================================
   sim/i8086.js
   A teaching emulator for the Intel 8086 instruction set.
   - Assembles a small program (labels, DB/DW data, all 8086
     addressing modes, BYTE/WORD PTR, segment overrides, OFFSET).
   - Executes every documented 8086 instruction with 8086 flag rules.
   Simplification: code is not stored as machine code. IP counts
   instructions (0, 1, 2 …) instead of bytes, so CALL/RET/INT push
   instruction numbers. Data (DB/DW) and the stack are real memory.
   No DOM access: the scene in scenes/i8086.js draws the state.
   ========================================================== */
var I8086 = (function(){
  const R16 = ['AX','CX','DX','BX','SP','BP','SI','DI'];
  const R8  = {AL:['AX',0],CL:['CX',0],DL:['DX',0],BL:['BX',0],AH:['AX',8],CH:['CX',8],DH:['DX',8],BH:['BX',8]};
  const SEGS = ['ES','CS','SS','DS'];
  const FB = {CF:0,PF:2,AF:4,ZF:6,SF:7,TF:8,IF:9,DF:10,OF:11};
  const JCC = {
    JO:f=>f.OF, JNO:f=>!f.OF, JB:f=>f.CF, JC:f=>f.CF, JNAE:f=>f.CF, JAE:f=>!f.CF, JNB:f=>!f.CF, JNC:f=>!f.CF,
    JE:f=>f.ZF, JZ:f=>f.ZF, JNE:f=>!f.ZF, JNZ:f=>!f.ZF, JBE:f=>f.CF||f.ZF, JNA:f=>f.CF||f.ZF, JA:f=>!f.CF&&!f.ZF, JNBE:f=>!f.CF&&!f.ZF,
    JS:f=>f.SF, JNS:f=>!f.SF, JP:f=>f.PF, JPE:f=>f.PF, JNP:f=>!f.PF, JPO:f=>!f.PF,
    JL:f=>f.SF!==f.OF, JNGE:f=>f.SF!==f.OF, JGE:f=>f.SF===f.OF, JNL:f=>f.SF===f.OF,
    JLE:f=>f.ZF||f.SF!==f.OF, JNG:f=>f.ZF||f.SF!==f.OF, JG:f=>!f.ZF&&f.SF===f.OF, JNLE:f=>!f.ZF&&f.SF===f.OF };
  const hex = (v, n=4) => (v >>> 0).toString(16).toUpperCase().padStart(n,'0');
  const parity = v => { v &= 0xFF; v ^= v >> 4; v ^= v >> 2; v ^= v >> 1; return (~v) & 1; };
  const sx8 = v => (v & 0x80) ? v - 0x100 : v, sx16 = v => (v & 0x8000) ? v - 0x10000 : v;
  class AsmError extends Error { constructor(line, msg){ super(`Line ${line}: ${msg}`); this.line = line; } }
  class RunError extends Error {}

  function CPU(){ this.reset(); }
  CPU.prototype.reset = function(){
    this.r = {AX:0,BX:0,CX:0,DX:0,SP:0x0100,BP:0,SI:0,DI:0};
    this.s = {CS:0x0000, DS:0x0100, ES:0x0100, SS:0x0200};
    this.ip = 0; this.flags = 0x0002; this.mem = new Uint8Array(0x100000); this.ports = new Uint8Array(0x10000);
    this.out = ''; this.halted = false; this.steps = 0; this.written = new Set(); this.note = '';
    if (this.prog) this.loadData();
  };
  CPU.prototype.F = function(n){ return (this.flags >> FB[n]) & 1; };
  CPU.prototype.setF = function(n, v){ if (v) this.flags |= 1 << FB[n]; else this.flags &= ~(1 << FB[n]); };
  CPU.prototype.fl = function(){ const o = {}; for (const k in FB) o[k] = this.F(k); return o; };
  CPU.prototype.szp = function(v, sz){ const m = sz === 8 ? 0xFF : 0xFFFF; v &= m;
    this.setF('ZF', v === 0); this.setF('SF', v & (sz === 8 ? 0x80 : 0x8000)); this.setF('PF', parity(v)); };
  CPU.prototype.reg = function(n){ if (n in this.r) return this.r[n]; if (n in this.s) return this.s[n];
    const [w, sh] = R8[n]; return (this.r[w] >> sh) & 0xFF; };
  CPU.prototype.setReg = function(n, v){
    if (n in this.r){ this.r[n] = v & 0xFFFF; return; }
    if (n in this.s){ this.s[n] = v & 0xFFFF; return; }
    const [w, sh] = R8[n]; this.r[w] = (this.r[w] & (sh ? 0x00FF : 0xFF00)) | ((v & 0xFF) << sh);
  };
  CPU.prototype.phys = function(seg, off){ return ((seg << 4) + (off & 0xFFFF)) & 0xFFFFF; };
  CPU.prototype.rd8 = function(a){ return this.mem[a & 0xFFFFF]; };
  CPU.prototype.wr8 = function(a, v){ a &= 0xFFFFF; this.mem[a] = v & 0xFF; this.written.add(a); };
  CPU.prototype.rdw = function(seg, off){ return this.rd8(this.phys(seg, off)) | (this.rd8(this.phys(seg, off + 1)) << 8); };
  CPU.prototype.wrw = function(seg, off, v){ this.wr8(this.phys(seg, off), v); this.wr8(this.phys(seg, off + 1), v >> 8); };
  CPU.prototype.push = function(v){ this.r.SP = (this.r.SP - 2) & 0xFFFF; this.wrw(this.s.SS, this.r.SP, v); };
  CPU.prototype.pop = function(){ const v = this.rdw(this.s.SS, this.r.SP); this.r.SP = (this.r.SP + 2) & 0xFFFF; return v; };

  /* ---------------- assembler ---------------- */
  function splitOps(s){
    const out = []; let cur = '', q = null, depth = 0;
    for (const ch of s){
      if (q){ cur += ch; if (ch === q) q = null; continue; }
      if (ch === "'" || ch === '"'){ q = ch; cur += ch; continue; }
      if (ch === '[') depth++; if (ch === ']') depth--;
      if (ch === ',' && !depth){ out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function num(tok){
    const t = tok.trim();
    if (/^'.'$|^".\"$/.test(t)) return t.charCodeAt(1);
    if (/^-?[0-9][0-9A-F]*H$/i.test(t)) return parseInt(t.replace(/h$/i,''), 16);
    if (/^-?0X[0-9A-F]+$/i.test(t)) return parseInt(t, 16);
    if (/^-?[01]+B$/i.test(t)) return parseInt(t.replace(/b$/i,''), 2);
    if (/^-?[0-9]+D?$/i.test(t)) return parseInt(t, 10);
    return null;
  }
  CPU.prototype.assemble = function(src){
    this.prog = null;
    const lines = src.replace(/\r/g,'').split('\n');
    const prog = {ins:[], code:{}, data:{}, bytes:[], src:lines};
    let dp = 0;
    const pending = [];
    lines.forEach((raw, i) => {
      const ln = i + 1;
      let s = raw.replace(/;.*$/, '').trim();
      if (!s) return;
      let m;
      while ((m = s.match(/^([A-Za-z_][\w]*)\s*:\s*/))){ const L = m[1].toUpperCase();
        if (prog.code[L] !== undefined || prog.data[L]) throw new AsmError(ln, `label ${m[1]} is defined twice`);
        prog.code[L] = prog.ins.length; s = s.slice(m[0].length); }
      if (!s) return;
      m = s.match(/^(?:([A-Za-z_]\w*)\s+)?(DB|DW)\s+(.+)$/i);
      if (m){
        const size = m[2].toUpperCase() === 'DB' ? 8 : 16;
        if (m[1]) prog.data[m[1].toUpperCase()] = {off: dp, size};
        for (let item of splitOps(m[3])){
          const dup = item.match(/^(.+?)\s+DUP\s*\((.+)\)$/i);
          const reps = dup ? num(dup[1]) : 1, val = dup ? dup[2].trim() : item;
          if (reps === null) throw new AsmError(ln, `cannot read the DUP count in “${item}”`);
          for (let k = 0; k < reps; k++){
            if (/^'.*'$|^".*"$/.test(val) && val.length > 3 && size === 8){ for (const ch of val.slice(1,-1)) prog.bytes.push([dp++, ch.charCodeAt(0)]); continue; }
            if (val === '?'){ dp += size/8; continue; }
            const v = num(val); if (v === null) throw new AsmError(ln, `cannot read the value “${val}”`);
            prog.bytes.push([dp++, v & 0xFF]); if (size === 16) prog.bytes.push([dp++, (v >> 8) & 0xFF]);
          }
        }
        return;
      }
      const parts = s.match(/^([A-Za-z]+)(?:\s+(.*))?$/);
      if (!parts) throw new AsmError(ln, `cannot understand “${s}”`);
      let mn = parts[1].toUpperCase(), rest = (parts[2] || '').trim(), prefix = null;
      if (['REP','REPE','REPZ','REPNE','REPNZ','LOCK'].includes(mn) && rest){
        prefix = mn; const p2 = rest.match(/^([A-Za-z]+)(?:\s+(.*))?$/); mn = p2[1].toUpperCase(); rest = (p2[2] || '').trim(); }
      pending.push({mn, prefix, raw: rest, ops: splitOps(rest), line: ln, text: s});
      prog.ins.push(null);
    });
    this.prog = prog;
    try { pending.forEach((p, k) => { prog.ins[k] = this.compile(p); }); }
    catch (e){ this.prog = null; throw e; }
    this.loadData();
    return prog;
  };
  CPU.prototype.loadData = function(){ for (const [off, v] of this.prog.bytes) this.mem[this.phys(this.s.DS, off)] = v; };

  /* operand parsing */
  CPU.prototype.operand = function(tok, ln){
    let t = tok.trim(), size = null, seg = null, m;
    const U = t.toUpperCase();
    if (R16.includes(U)) return {t:'r', name:U, size:16};
    if (R8[U]) return {t:'r', name:U, size:8};
    if (SEGS.includes(U)) return {t:'s', name:U, size:16};
    if ((m = t.match(/^OFFSET\s+([A-Za-z_]\w*)$/i))){ const d = this.prog.data[m[1].toUpperCase()]; if (!d) throw new AsmError(ln, `unknown data label ${m[1]}`); return {t:'i', v:d.off}; }
    const n = num(t); if (n !== null) return {t:'i', v:n};
    if (this.prog.code[U] !== undefined && !/[\[\]]/.test(t)) return {t:'l', v:this.prog.code[U], name:U};
    if ((m = t.match(/^(BYTE|WORD)\s+PTR\s+(.+)$/i))){ size = m[1].toUpperCase() === 'BYTE' ? 8 : 16; t = m[2].trim(); }
    if ((m = t.match(/^(ES|CS|SS|DS)\s*:\s*(.+)$/i))){ seg = m[1].toUpperCase(); t = m[2].trim(); }
    /* memory: label, label[...], [ ... ] */
    let inner = t, base = null, idx = null, disp = 0, lab = null;
    if ((m = t.match(/^([A-Za-z_]\w*)\s*(\[.*\])?$/)) && !R16.includes(m[1].toUpperCase())){ lab = m[1]; inner = m[2] ? m[2].slice(1,-1) : ''; }
    else if (/^\[.*\]$/.test(t)) inner = t.slice(1,-1);
    else throw new AsmError(ln, `cannot understand the operand “${tok}”`);
    if (lab){ const d = this.prog.data[lab.toUpperCase()]; if (!d) throw new AsmError(ln, `unknown label ${lab}`); disp += d.off; if (!size) size = d.size; }
    const terms = inner.replace(/\s+/g,'').replace(/-/g,'+-').split('+').filter(x => x);
    for (const term of terms){
      const T = term.toUpperCase(), neg = T.startsWith('-'), bare = neg ? T.slice(1) : T;
      if (['BX','BP'].includes(bare) && !neg){ if (base) throw new AsmError(ln, 'only one base register (BX or BP) is allowed'); base = bare; }
      else if (['SI','DI'].includes(bare) && !neg){ if (idx) throw new AsmError(ln, 'only one index register (SI or DI) is allowed'); idx = bare; }
      else if (R16.includes(bare) || R8[bare]) throw new AsmError(ln, `the 8086 can only use BX, BP, SI and DI inside [ ], not ${bare}`);
      else if (this.prog.data[bare]){ disp += (neg ? -1 : 1) * this.prog.data[bare].off; if (!size) size = this.prog.data[bare].size; }
      else { const v = num(bare); if (v === null) throw new AsmError(ln, `cannot understand “${term}” in an address`); disp += neg ? -v : v; }
    }
    const dseg = seg || (base === 'BP' ? 'SS' : 'DS');
    return {t:'m', base, idx, disp, seg:dseg, size, text:tok};
  };
  CPU.prototype.ea = function(op){ let o = op.disp; if (op.base) o += this.r[op.base]; if (op.idx) o += this.r[op.idx]; return o & 0xFFFF; };
  CPU.prototype.get = function(op, sz){
    if (op.t === 'r' || op.t === 's') return this.reg(op.name);
    if (op.t === 'i') return op.v & (sz === 8 ? 0xFF : 0xFFFF);
    if (op.t === 'l') return op.v;
    const off = this.ea(op), sg = this.s[op.seg];
    return (op.size || sz) === 8 ? this.rd8(this.phys(sg, off)) : this.rdw(sg, off);
  };
  CPU.prototype.put = function(op, v, sz){
    if (op.t === 'r' || op.t === 's'){ this.setReg(op.name, v); return; }
    if (op.t !== 'm') throw new RunError('Cannot write to a constant.');
    const off = this.ea(op), sg = this.s[op.seg];
    if ((op.size || sz) === 8) this.wr8(this.phys(sg, off), v); else this.wrw(sg, off, v);
  };

  /* ---------------- flag helpers ---------------- */
  CPU.prototype.add = function(a, b, c, sz){ const m = sz === 8 ? 0xFF : 0xFFFF, sb = sz === 8 ? 0x80 : 0x8000, r = a + b + c, v = r & m;
    this.setF('CF', r > m); this.setF('AF', (a ^ b ^ v) & 0x10); this.setF('OF', (a ^ v) & (b ^ v) & sb); this.szp(v, sz); return v; };
  CPU.prototype.sub = function(a, b, c, sz){ const m = sz === 8 ? 0xFF : 0xFFFF, sb = sz === 8 ? 0x80 : 0x8000, r = a - b - c, v = r & m;
    this.setF('CF', r < 0); this.setF('AF', (a ^ b ^ v) & 0x10); this.setF('OF', (a ^ b) & (a ^ v) & sb); this.szp(v, sz); return v; };
  CPU.prototype.logic = function(v, sz){ this.setF('CF', 0); this.setF('OF', 0); this.setF('AF', 0); this.szp(v, sz); return v & (sz === 8 ? 0xFF : 0xFFFF); };

  /* ---------------- compile one instruction to a closure ---------------- */
  CPU.prototype.compile = function(p){
    const cpu = this, ln = p.line, mn = p.mn, O = p.ops.map(o => cpu.operand(o, ln));
    const need = (n, text) => { if (O.length !== n) throw new AsmError(ln, `${mn} needs ${text}`); };
    const sizeOf = (a, b) => {
      const s = (a && (a.size)) || (b && (b.size)) || null;
      if (a && b && a.size && b.size && a.size !== b.size) throw new AsmError(ln, `the operands of ${mn} are different sizes (${a.size} and ${b.size} bits)`);
      if (!s) throw new AsmError(ln, `operand size is unclear: write BYTE PTR or WORD PTR`);
      return s;
    };
    const noMemMem = () => { if (O[0] && O[1] && O[0].t === 'm' && O[1].t === 'm') throw new AsmError(ln, `the 8086 cannot use two memory operands in one ${mn}`); };
    const target = () => { if (O.length !== 1) throw new AsmError(ln, `${mn} needs one target label`);
      if (O[0].t === 'l') return () => O[0].v; if (O[0].t === 'r' && O[0].size === 16) return () => cpu.r[O[0].name];
      throw new AsmError(ln, `${mn} needs a code label (such as “loop:”)`); };
    const I = {line: ln, text: p.text, mn, prefix: p.prefix};
    const alu2 = (fn, write=true) => { need(2, 'two operands, such as ' + mn + ' AX, BX'); noMemMem();
      if (O[0].t === 'i' || O[0].t === 'l') throw new AsmError(ln, `the first operand of ${mn} cannot be a number`);
      if (O[0].t === 's' || O[1].t === 's') throw new AsmError(ln, `${mn} cannot use segment registers`);
      const sz = sizeOf(O[0], O[1]);
      return () => { const r = fn(cpu.get(O[0], sz), cpu.get(O[1], sz), sz); if (write) cpu.put(O[0], r, sz); }; };
    const unary = fn => { need(1, 'one operand'); if (O[0].t === 'i') throw new AsmError(ln, `${mn} needs a register or memory operand`);
      const sz = sizeOf(O[0]); return () => cpu.put(O[0], fn(cpu.get(O[0], sz), sz), sz); };
    const shift = kind => {
      if (O.length !== 2) throw new AsmError(ln, `${mn} needs a destination and a count (1 or CL)`);
      if (!(O[1].t === 'i' && O[1].v === 1) && !(O[1].t === 'r' && O[1].name === 'CL')) throw new AsmError(ln, 'on the 8086 the shift count must be 1 or CL');
      const sz = sizeOf(O[0]);
      return () => {
        const m = sz === 8 ? 0xFF : 0xFFFF, top = sz === 8 ? 0x80 : 0x8000, n = O[1].t === 'i' ? 1 : cpu.r.CX & 0xFF;
        let v = cpu.get(O[0], sz), cf = cpu.F('CF'); const orig = v;
        if (!n) return;
        for (let k = 0; k < n; k++){
          if (kind === 'SHL'){ cf = (v & top) ? 1 : 0; v = (v << 1) & m; }
          else if (kind === 'SHR'){ cf = v & 1; v >>>= 1; }
          else if (kind === 'SAR'){ cf = v & 1; v = (v >>> 1) | (v & top); }
          else if (kind === 'ROL'){ cf = (v & top) ? 1 : 0; v = ((v << 1) | cf) & m; }
          else if (kind === 'ROR'){ cf = v & 1; v = (v >>> 1) | (cf ? top : 0); }
          else if (kind === 'RCL'){ const t = (v & top) ? 1 : 0; v = ((v << 1) | cf) & m; cf = t; }
          else if (kind === 'RCR'){ const t = v & 1; v = (v >>> 1) | (cf ? top : 0); cf = t; }
        }
        cpu.put(O[0], v, sz); cpu.setF('CF', cf);
        const msb = (v & top) ? 1 : 0, next = (v & (top >> 1)) ? 1 : 0;
        if (n === 1) cpu.setF('OF', kind === 'SHL' || kind === 'ROL' || kind === 'RCL' ? msb ^ cf : kind === 'SHR' ? ((orig & top) ? 1 : 0) : kind === 'SAR' ? 0 : msb ^ next);
        if (['SHL','SHR','SAR'].includes(kind)) cpu.szp(v, sz);
      };
    };
    const divErr = () => cpu.interrupt(0, 'Divide error: the quotient is too big or the divisor is 0.');
    const strOp = (kind, sz) => {
      const d = () => (cpu.F('DF') ? -1 : 1) * (sz / 8), acc = sz === 8 ? 'AL' : 'AX';
      const once = () => {
        const si = cpu.r.SI, di = cpu.r.DI, rdS = () => sz === 8 ? cpu.rd8(cpu.phys(cpu.s.DS, si)) : cpu.rdw(cpu.s.DS, si),
              rdD = () => sz === 8 ? cpu.rd8(cpu.phys(cpu.s.ES, di)) : cpu.rdw(cpu.s.ES, di),
              wrD = v => sz === 8 ? cpu.wr8(cpu.phys(cpu.s.ES, di), v) : cpu.wrw(cpu.s.ES, di, v);
        if (kind === 'MOVS'){ wrD(rdS()); cpu.r.SI = (si + d()) & 0xFFFF; cpu.r.DI = (di + d()) & 0xFFFF; }
        if (kind === 'CMPS'){ cpu.sub(rdS(), rdD(), 0, sz); cpu.r.SI = (si + d()) & 0xFFFF; cpu.r.DI = (di + d()) & 0xFFFF; }
        if (kind === 'SCAS'){ cpu.sub(cpu.reg(acc), rdD(), 0, sz); cpu.r.DI = (di + d()) & 0xFFFF; }
        if (kind === 'LODS'){ cpu.setReg(acc, rdS()); cpu.r.SI = (si + d()) & 0xFFFF; }
        if (kind === 'STOS'){ wrD(cpu.reg(acc)); cpu.r.DI = (di + d()) & 0xFFFF; }
      };
      return () => {
        if (!p.prefix || p.prefix === 'LOCK'){ once(); return; }
        let guard = 0;
        while (cpu.r.CX !== 0){
          once(); cpu.r.CX = (cpu.r.CX - 1) & 0xFFFF;
          if (++guard > 200000) throw new RunError('Stopped a string loop that ran too long.');
          if (kind === 'CMPS' || kind === 'SCAS'){
            if ((p.prefix === 'REPE' || p.prefix === 'REPZ' || p.prefix === 'REP') && !cpu.F('ZF')) break;
            if ((p.prefix === 'REPNE' || p.prefix === 'REPNZ') && cpu.F('ZF')) break;
          }
        }
      };
    };
    let run;
    switch (mn){
      /* ---- data transfer ---- */
      case 'MOV': need(2, 'a destination and a source'); noMemMem();
        if (O[0].t === 's' && O[1].t === 'i') throw new AsmError(ln, 'the 8086 cannot load a segment register with a number directly; copy it through a general register');
        if (O[0].t === 's' && O[0].name === 'CS') throw new AsmError(ln, 'MOV cannot change CS; use a far JMP or CALL');
        if (O[0].t === 's' && O[1].t === 's') throw new AsmError(ln, 'the 8086 cannot copy one segment register straight into another');
        { const sz = sizeOf(O[0], O[1]); run = () => cpu.put(O[0], cpu.get(O[1], sz), sz); } break;
      case 'PUSH': need(1, 'one 16-bit operand');
        if (O[0].size === 8 || O[0].t === 'i') throw new AsmError(ln, 'the 8086 can only push 16-bit registers or memory words');
        run = () => { if (O[0].t === 'r' && O[0].name === 'SP'){ cpu.r.SP = (cpu.r.SP - 2) & 0xFFFF; cpu.wrw(cpu.s.SS, cpu.r.SP, cpu.r.SP); } else cpu.push(cpu.get(O[0], 16)); }; break;
      case 'POP': need(1, 'one 16-bit operand');
        if (O[0].size === 8 || O[0].t === 'i') throw new AsmError(ln, 'POP needs a 16-bit register or memory word');
        if (O[0].t === 's' && O[0].name === 'CS') throw new AsmError(ln, 'POP CS is not a valid instruction');
        run = () => cpu.put(O[0], cpu.pop(), 16); break;
      case 'XCHG': need(2, 'two operands'); noMemMem();
        { const sz = sizeOf(O[0], O[1]); run = () => { const a = cpu.get(O[0], sz), b = cpu.get(O[1], sz); cpu.put(O[0], b, sz); cpu.put(O[1], a, sz); }; } break;
      case 'XLAT': case 'XLATB': run = () => cpu.setReg('AL', cpu.rd8(cpu.phys(cpu.s.DS, cpu.r.BX + cpu.reg('AL')))); break;
      case 'LEA': need(2, 'a register and a memory operand'); if (O[1].t !== 'm' || O[0].t !== 'r' || O[0].size !== 16) throw new AsmError(ln, 'LEA needs a 16-bit register and a memory operand');
        run = () => cpu.setReg(O[0].name, cpu.ea(O[1])); break;
      case 'LDS': case 'LES': need(2, 'a register and a memory operand'); if (O[1].t !== 'm') throw new AsmError(ln, `${mn} needs a memory operand`);
        run = () => { const off = cpu.ea(O[1]), sg = cpu.s[O[1].seg]; cpu.setReg(O[0].name, cpu.rdw(sg, off)); cpu.s[mn === 'LDS' ? 'DS' : 'ES'] = cpu.rdw(sg, off + 2); }; break;
      case 'LAHF': run = () => cpu.setReg('AH', (cpu.flags & 0xD5) | 0x02); break;
      case 'SAHF': run = () => { cpu.flags = (cpu.flags & 0xFF00) | (cpu.reg('AH') & 0xD5) | 0x02; }; break;
      case 'PUSHF': run = () => cpu.push(cpu.flags | 0xF000); break;
      case 'POPF': run = () => { cpu.flags = (cpu.pop() & 0x0FD5) | 0x02; }; break;
      case 'IN': need(2, 'AL or AX, then a port (number or DX)');
        run = () => { const port = O[1].t === 'i' ? O[1].v & 0xFF : cpu.r.DX; cpu.setReg(O[0].name, O[0].size === 8 ? cpu.ports[port] : cpu.ports[port] | (cpu.ports[(port + 1) & 0xFFFF] << 8)); }; break;
      case 'OUT': need(2, 'a port (number or DX), then AL or AX');
        run = () => { const port = O[0].t === 'i' ? O[0].v & 0xFF : cpu.r.DX, v = cpu.reg(O[1].name); cpu.ports[port] = v & 0xFF; if (O[1].size === 16) cpu.ports[(port + 1) & 0xFFFF] = v >> 8;
          cpu.note = `Port ${hex(port, 2)}h ← ${hex(v, O[1].size / 4)}h`; }; break;

      /* ---- arithmetic ---- */
      case 'ADD': run = alu2((a, b, s) => cpu.add(a, b, 0, s)); break;
      case 'ADC': run = alu2((a, b, s) => cpu.add(a, b, cpu.F('CF'), s)); break;
      case 'SUB': run = alu2((a, b, s) => cpu.sub(a, b, 0, s)); break;
      case 'SBB': run = alu2((a, b, s) => cpu.sub(a, b, cpu.F('CF'), s)); break;
      case 'CMP': run = alu2((a, b, s) => cpu.sub(a, b, 0, s), false); break;
      case 'INC': run = unary((v, s) => { const c = cpu.F('CF'), r = cpu.add(v, 1, 0, s); cpu.setF('CF', c); return r; }); break;
      case 'DEC': run = unary((v, s) => { const c = cpu.F('CF'), r = cpu.sub(v, 1, 0, s); cpu.setF('CF', c); return r; }); break;
      case 'NEG': run = unary((v, s) => cpu.sub(0, v, 0, s)); break;
      case 'MUL': case 'IMUL': need(1, 'one operand (the other is AL or AX)'); if (O[0].t === 'i') throw new AsmError(ln, `the 8086 ${mn} cannot multiply by a number directly; put it in a register`);
        { const sz = sizeOf(O[0]); run = () => { const v = cpu.get(O[0], sz);
          if (sz === 8){ const r = mn === 'MUL' ? cpu.reg('AL') * v : sx8(cpu.reg('AL')) * sx8(v); cpu.r.AX = r & 0xFFFF;
            const big = mn === 'MUL' ? (r >> 8) !== 0 : (r < -128 || r > 127); cpu.setF('CF', big); cpu.setF('OF', big); }
          else { const r = mn === 'MUL' ? cpu.r.AX * v : sx16(cpu.r.AX) * sx16(v), u = r < 0 ? r + 0x100000000 : r;
            cpu.r.AX = u % 0x10000; cpu.r.DX = Math.floor(u / 0x10000) & 0xFFFF;
            const big = mn === 'MUL' ? cpu.r.DX !== 0 : (r < -32768 || r > 32767); cpu.setF('CF', big); cpu.setF('OF', big); } }; } break;
      case 'DIV': case 'IDIV': need(1, 'one operand (the divisor)'); if (O[0].t === 'i') throw new AsmError(ln, `the 8086 ${mn} cannot divide by a number directly; put it in a register`);
        { const sz = sizeOf(O[0]); run = () => { const v = cpu.get(O[0], sz); if (v === 0) return divErr();
          if (sz === 8){
            if (mn === 'DIV'){ const n = cpu.r.AX, q = Math.floor(n / v); if (q > 0xFF) return divErr(); cpu.setReg('AL', q); cpu.setReg('AH', n % v); }
            else { const n = sx16(cpu.r.AX), d = sx8(v), q = Math.trunc(n / d); if (q > 127 || q < -127) return divErr(); cpu.setReg('AL', q); cpu.setReg('AH', n - q * d); } }
          else {
            const n = cpu.r.DX * 0x10000 + cpu.r.AX;
            if (mn === 'DIV'){ const q = Math.floor(n / v); if (q > 0xFFFF) return divErr(); cpu.r.AX = q; cpu.r.DX = n % v; }
            else { const sn = n >= 0x80000000 ? n - 0x100000000 : n, d = sx16(v), q = Math.trunc(sn / d); if (q > 32767 || q < -32767) return divErr();
              cpu.r.AX = q & 0xFFFF; cpu.r.DX = (sn - q * d) & 0xFFFF; } } }; } break;
      case 'CBW': run = () => cpu.setReg('AH', (cpu.reg('AL') & 0x80) ? 0xFF : 0); break;
      case 'CWD': run = () => { cpu.r.DX = (cpu.r.AX & 0x8000) ? 0xFFFF : 0; }; break;
      case 'AAA': case 'AAS': run = () => { let al = cpu.reg('AL');
          if ((al & 0x0F) > 9 || cpu.F('AF')){ cpu.setReg('AL', mn === 'AAA' ? al + 6 : al - 6); cpu.setReg('AH', cpu.reg('AH') + (mn === 'AAA' ? 1 : -1)); cpu.setF('AF', 1); cpu.setF('CF', 1); }
          else { cpu.setF('AF', 0); cpu.setF('CF', 0); }
          cpu.setReg('AL', cpu.reg('AL') & 0x0F); }; break;
      case 'DAA': case 'DAS': run = () => { const old = cpu.reg('AL'), oc = cpu.F('CF'); let al = old;
          if ((al & 0x0F) > 9 || cpu.F('AF')){ const t = mn === 'DAA' ? al + 6 : al - 6; cpu.setF('CF', oc || t > 0xFF || t < 0); al = t & 0xFF; cpu.setF('AF', 1); } else cpu.setF('AF', 0);
          if (old > 0x99 || oc){ al = (mn === 'DAA' ? al + 0x60 : al - 0x60) & 0xFF; cpu.setF('CF', 1); } else cpu.setF('CF', 0);
          cpu.setReg('AL', al); cpu.szp(al, 8); }; break;
      case 'AAM': { const base = O.length ? O[0].v : 10; run = () => { if (!base) return divErr(); const al = cpu.reg('AL'); cpu.setReg('AH', Math.floor(al / base)); cpu.setReg('AL', al % base); cpu.szp(cpu.reg('AL'), 8); }; } break;
      case 'AAD': { const base = O.length ? O[0].v : 10; run = () => { cpu.setReg('AL', cpu.reg('AH') * base + cpu.reg('AL')); cpu.setReg('AH', 0); cpu.szp(cpu.reg('AL'), 8); }; } break;

      /* ---- logic, shifts, rotates ---- */
      case 'AND': run = alu2((a, b, s) => cpu.logic(a & b, s)); break;
      case 'OR':  run = alu2((a, b, s) => cpu.logic(a | b, s)); break;
      case 'XOR': run = alu2((a, b, s) => cpu.logic(a ^ b, s)); break;
      case 'TEST': run = alu2((a, b, s) => cpu.logic(a & b, s), false); break;
      case 'NOT': run = unary((v, s) => ~v & (s === 8 ? 0xFF : 0xFFFF)); break;
      case 'SHL': case 'SAL': run = shift('SHL'); break;
      case 'SHR': case 'SAR': case 'ROL': case 'ROR': case 'RCL': case 'RCR': run = shift(mn); break;

      /* ---- strings ---- */
      case 'MOVSB': case 'MOVSW': case 'CMPSB': case 'CMPSW': case 'SCASB': case 'SCASW': case 'LODSB': case 'LODSW': case 'STOSB': case 'STOSW':
        run = strOp(mn.slice(0, 4), mn.endsWith('B') ? 8 : 16); break;

      /* ---- control transfer ---- */
      case 'JMP': { const t = target(); run = () => { cpu.ip = t(); }; } break;
      case 'CALL': { const t = target(); run = () => { cpu.push(cpu.ip); cpu.ip = t(); }; } break;
      case 'RET': case 'RETN': { const n = O.length ? O[0].v : 0; run = () => { cpu.ip = cpu.pop(); cpu.r.SP = (cpu.r.SP + n) & 0xFFFF; }; } break;
      case 'LOOP': case 'LOOPE': case 'LOOPZ': case 'LOOPNE': case 'LOOPNZ': { const t = target(); run = () => { cpu.r.CX = (cpu.r.CX - 1) & 0xFFFF;
          const z = cpu.F('ZF'), go = cpu.r.CX !== 0 && (mn === 'LOOP' || ((mn === 'LOOPE' || mn === 'LOOPZ') ? z : !z)); if (go) cpu.ip = t(); }; } break;
      case 'JCXZ': { const t = target(); run = () => { if (cpu.r.CX === 0) cpu.ip = t(); }; } break;
      case 'INT': need(1, 'an interrupt number, such as INT 21h'); { const n = O[0].v & 0xFF; run = () => cpu.interrupt(n); } break;
      case 'INTO': run = () => { if (cpu.F('OF')) cpu.interrupt(4, 'Overflow (INTO with OF = 1).'); }; break;
      case 'IRET': run = () => { cpu.ip = cpu.pop(); cpu.s.CS = cpu.pop(); cpu.flags = (cpu.pop() & 0x0FD5) | 0x02; }; break;

      /* ---- processor control ---- */
      case 'CLC': run = () => cpu.setF('CF', 0); break;
      case 'STC': run = () => cpu.setF('CF', 1); break;
      case 'CMC': run = () => cpu.setF('CF', !cpu.F('CF')); break;
      case 'CLD': run = () => cpu.setF('DF', 0); break;
      case 'STD': run = () => cpu.setF('DF', 1); break;
      case 'CLI': run = () => cpu.setF('IF', 0); break;
      case 'STI': run = () => cpu.setF('IF', 1); break;
      case 'HLT': run = () => { cpu.halted = true; cpu.note = 'HLT: the processor stops until an interrupt or reset.'; }; break;
      case 'NOP': run = () => {}; break;
      case 'WAIT': run = () => { cpu.note = 'WAIT: checks the TEST pin; in this model it is always ready.'; }; break;
      case 'ESC': run = () => { cpu.note = 'ESC: passes an instruction to a coprocessor such as the 8087; there is none here.'; }; break;
      case 'LOCK': run = () => { cpu.note = 'LOCK: holds the bus for the next instruction (for multiprocessor systems).'; }; break;
      default:
        if (JCC[mn]){ const t = target(), c = JCC[mn]; run = () => { if (c(cpu.fl())) cpu.ip = t(); }; break; }
        throw new AsmError(ln, `unknown instruction ${mn}`);
    }
    I.run = run;
    return I;
  };

  /* software interrupts: a few DOS / BIOS services, or a handler label named INTn */
  CPU.prototype.interrupt = function(n, why){
    const L = this.prog.code['INT' + n];
    if (L !== undefined){ this.push(this.flags); this.push(this.s.CS); this.push(this.ip); this.setF('IF', 0); this.setF('TF', 0); this.ip = L; this.note = why || `INT ${hex(n,2)}h: jumped to the handler INT${n}.`; return; }
    const ah = this.reg('AH');
    if (n === 0x21 && ah === 0x02){ this.out += String.fromCharCode(this.reg('DL')); this.note = 'INT 21h, AH=02h: DOS prints the character in DL.'; return; }
    if (n === 0x21 && ah === 0x09){ let off = this.r.DX, s = '', g = 0; for (;;){ const c = this.rd8(this.phys(this.s.DS, off++)); if (c === 0x24 || ++g > 2000) break; s += String.fromCharCode(c); }
      this.out += s; this.note = 'INT 21h, AH=09h: DOS prints the string at DS:DX up to the $ sign.'; return; }
    if ((n === 0x21 && ah === 0x4C) || n === 0x20){ this.halted = true; this.note = 'The program asked DOS to end it.'; return; }
    if (n === 0x10 && ah === 0x0E){ this.out += String.fromCharCode(this.reg('AL')); this.note = 'INT 10h, AH=0Eh: the BIOS prints the character in AL.'; return; }
    if (n === 3){ this.paused = true; this.note = 'INT 3: breakpoint. Press Step or Run to continue.'; return; }
    if (n === 0 || n === 4){ this.halted = true; this.note = (why || '') + ' No handler label INT' + n + ' was found, so the program stops.'; return; }
    this.note = `INT ${hex(n,2)}h: not simulated here. Add a label INT${n}: to handle it.`;
  };

  /* execute one instruction; returns a description of what changed */
  CPU.prototype.step = function(){
    if (this.halted) return null;
    const P = this.prog;
    if (!P || this.ip >= P.ins.length){ this.halted = true; this.note = 'End of the program.'; return null; }
    const ins = P.ins[this.ip], before = {r:{...this.r}, s:{...this.s}, flags:this.flags};
    this.written = new Set(); this.note = ''; this.paused = false;
    this.ip++;
    try { ins.run(); } catch (e){ this.halted = true; this.note = e.message; }
    this.steps++;
    const changed = [];
    for (const k in this.r) if (this.r[k] !== before.r[k]) changed.push(k);
    for (const k in this.s) if (this.s[k] !== before.s[k]) changed.push(k);
    const fch = Object.keys(FB).filter(k => ((before.flags >> FB[k]) & 1) !== this.F(k));
    return {ins, before, changed, flagsChanged: fch};
  };
  return {CPU, hex, AsmError, R16, FB};
})();
