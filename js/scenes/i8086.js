/* ==========================================================
   scenes/i8086.js
   The Intel 8086 page, drawn as the classic block diagram.

   Left to right, with nothing sharing space:
     1. a column of example programs and, under it, the complete
        flow of moves for whichever program is loaded
     2. the chip: the BIU (memory interface, address adder, segment
        registers, 6-byte queue) above the EU (register file,
        control unit, ALU, flags, screen output)
     3. the three buses, each its own colour, in their own channel
     4. RAM outside the chip: the assembled program in the code
        segment and the bytes of the data segment, then the
        physical-address sum and the story of the current move

   The whole run is planned in advance by buildStory(), so the flow
   list can show every move before it happens, any move can be
   jumped to, and stepping backwards works. Each move carries the
   state of the chip to display while it is on screen.
   ========================================================== */
(function(){
  const GROUP_IDS = ['x86-data','x86-arith','x86-logic','x86-string','x86-control','x86-proc'];
  const FLAGS = ['OF','DF','IF','TF','SF','ZF','AF','PF','CF'];
  const FLAG_NAME_X = {OF:'Overflow',DF:'Direction',IF:'Interrupt enable',TF:'Trap (single step)',SF:'Sign',ZF:'Zero',AF:'Auxiliary carry',PF:'Parity',CF:'Carry'};
  const GP = ['AX','BX','CX','DX'], PT = ['SP','BP','SI','DI'], SEGR = ['CS','DS','SS','ES','IP'];
  const SPEEDS = [[0,'Instant'],[1,'Slow'],[2,'Normal'],[3,'Fast']];
  const SPEED_MS = [0, 1500, 850, 430];
  const MAXINS = 22;                       /* instructions planned ahead */
  const hx = (v, n) => I8086.hex(v, n);
  const h2 = v => hx(v & 255, 2), h4 = v => hx(v & 0xFFFF, 4), h5 = v => hx(v & 0xFFFFF, 5);
  const SHORTROLE = {'interrupt number':'int no.','address low':'addr lo','address high':'addr hi','displacement low':'disp lo','displacement high':'disp hi','displacement':'disp','jump offset':'jump','offset low':'off lo','offset high':'off hi','data low':'data lo','data high':'data hi'};
  const role = r => SHORTROLE[r] || r;
  const DESC = {};
  for (const g of GROUP_IDS) for (const row of INSTR[g]) row[0].split(/\s*[\/,]\s*/).forEach(m => DESC[m.trim()] = row[1]);

  /* ---------- the eight programs offered first ---------- */
  const FEATURED = [
    {n:'Add a number from memory', d:'Every stage once: fetch, decode, operand read, add, store.',
     s:"value  DW 000Ah\nresult DW 0000h\n\n       MOV AX, 0005h\n       ADD AX, [value]\n       MOV [result], AX\n       HLT"},
    {n:'Count down with a loop', d:'The queue is thrown away and refilled every time the jump is taken.',
     s:"      MOV CX, 3\n      MOV AX, 0\nsum:  ADD AX, CX\n      LOOP sum\n      HLT"},
    {n:'Compare and branch', d:'CMP sets the flags and the conditional jump reads them.',
     s:"      MOV AX, 7\n      CMP AX, 9\n      JL  less\n      MOV BX, 1\n      HLT\nless: MOV BX, 0FFFFh\n      HLT"},
    {n:'The two halves of a register', d:'AH and AL make up AX, and each can be written on its own.',
     s:"      MOV AX, 0000h\n      MOV AH, 12h\n      MOV AL, 34h\n      HLT"},
    {n:'Multiply', d:'MUL makes a 32-bit product, so DX and AX both change.',
     s:"      MOV AX, 0190h\n      MOV BX, 0100h\n      MUL BX\n      HLT"},
    {n:'Use the stack', d:'PUSH and POP move SP and write into the stack segment.',
     s:"      MOV AX, 1234h\n      PUSH AX\n      MOV AX, 0\n      POP BX\n      HLT"},
    {n:'Copy a byte through memory', d:'SI holds the offset, so the adder works on DS and SI.',
     s:"src DB 41h\ndst DB 00h\n\n    MOV SI, OFFSET src\n    MOV AL, [SI]\n    MOV [dst], AL\n    HLT"},
    {n:'Print with DOS', d:'INT 21h hands the string to the operating system, which prints it.',
     s:"msg DB 'Hello$'\n\n    MOV DX, OFFSET msg\n    MOV AH, 09h\n    INT 21h\n    HLT"},
  ];

  /* ---------- opcode encoding reference ---------- */
  const OPC = [
    {k:'B8', b:'B8+r', m:'MOV r16, imm16', e:'1011 w reg (w=1)', x:'B8 05 00 → MOV AX, 0005h',
     n:'The register is encoded inside the opcode byte itself, so no ModR/M byte is needed. The low three bits are the register code: 000 AX, 001 CX, 010 DX, 011 BX, 100 SP, 101 BP, 110 SI, 111 DI. Two immediate bytes follow, low byte first.'},
    {k:'B0', b:'B0+r', m:'MOV r8, imm8', e:'1011 w reg (w=0)', x:'B4 09 → MOV AH, 09h',
     n:'The same family with the width bit cleared, so the operand is one byte and the register field names a byte register: 000 AL, 001 CL, 010 DL, 011 BL, 100 AH, 101 CH, 110 DH, 111 BH.'},
    {k:'03', b:'03 /r', m:'ADD r16, r/m16', e:'0000 00dw (d=1, w=1)', x:'03 06 00 00 → ADD AX, [0000h]',
     n:'000000 selects ADD. The d bit gives the direction: d=1 means the register named in the ModR/M byte is the destination. The w bit gives the width: w=1 means 16-bit. A ModR/M byte always follows to name the two operands.'},
    {k:'MODRM', b:'mod r/m', m:'operand byte', e:'mod(2) reg(3) r/m(3)', x:'06h = 00 000 110',
     n:'mod=11 means r/m is a register; mod=00 means memory with no displacement; 01 adds a signed byte displacement; 10 adds a word displacement. The one special case: mod=00 with r/m=110 means a direct 16-bit address, so two displacement bytes follow.'},
    {k:'01', b:'01 /r', m:'ADD r/m16, r16', e:'0000 00dw (d=0)',
     n:'The same ADD opcode with the direction bit cleared, so the memory or r/m operand becomes the destination and the register supplies the value.'},
    {k:'2B', b:'2B /r', m:'SUB r16, r/m16', e:'0010 10dw',
     n:'Arithmetic opcodes share the layout 00 xxx dw, where xxx picks the operation: 000 ADD, 001 OR, 010 ADC, 011 SBB, 100 AND, 101 SUB, 110 XOR, 111 CMP.'},
    {k:'8B', b:'8B /r', m:'MOV r16, r/m16', e:'1000 10dw',
     n:'The general-purpose MOV. Unlike B8 it needs a ModR/M byte, because either operand may be memory or a register.'},
    {k:'A1', b:'A1', m:'MOV AX, [addr]', e:'1010 000w',
     n:'An accumulator-only load from a direct address. Shorter than 8B because AX is implied by the opcode: two offset bytes follow and the BIU adds them to DS × 10h.'},
    {k:'A3', b:'A3', m:'MOV [addr], AX', e:'1010 001w', x:'A3 02 00 → MOV [0002h], AX',
     n:'The store counterpart of A1. The two bytes after the opcode are the offset inside the data segment; the BIU forms DS × 10h + offset and runs a write cycle.'},
    {k:'40', b:'40+r', m:'INC r16', e:'0100 0reg',
     n:'A one-byte increment, with the register packed into the low three bits exactly as in B8. It leaves the carry flag alone, which is what separates it from ADD 1.'},
    {k:'F7', b:'F7 /4', m:'MUL r/m16', e:'1111 011w',
     n:'A group opcode: the reg field of the ModR/M byte picks the operation rather than a register. 100 is MUL, 101 IMUL, 110 DIV, 111 IDIV, 010 NOT, 011 NEG.'},
    {k:'EB', b:'EB cb', m:'JMP short', e:'1110 1011 + rel8',
     n:'Adds a signed byte displacement to IP. Any taken jump makes the BIU flush the queue, because the bytes it prefetched came from the path not taken.'},
    {k:'75', b:'75 cb', m:'JNZ rel8', e:'0111 tttn',
     n:'Conditional jumps share 0111 tttn, where tttn names the condition tested in the flags: 74 JZ, 75 JNZ, 7C JL, 7F JG, and so on.'},
    {k:'E2', b:'E2 cb', m:'LOOP rel8', e:'1110 0010',
     n:'Takes CX down by one and jumps if the result is not zero. One byte does the work of a decrement, a test and a conditional jump.'},
    {k:'CD', b:'CD ib', m:'INT n', e:'1100 1101',
     n:'Pushes the flags and the return address, then loads CS:IP from entry n of the interrupt vector table at the bottom of memory.'},
    {k:'F4', b:'F4', m:'HLT', e:'1111 0100',
     n:'Stops instruction execution. The queue is abandoned and the processor idles until a reset or an unmasked interrupt arrives.'},
  ];
  const OPMAP = {0xB8:'B8',0xB9:'B8',0xBA:'B8',0xBB:'B8',0xBC:'B8',0xBD:'B8',0xBE:'B8',0xBF:'B8',
    0xB0:'B0',0xB1:'B0',0xB2:'B0',0xB3:'B0',0xB4:'B0',0xB5:'B0',0xB6:'B0',0xB7:'B0',
    0x03:'03',0x01:'01',0x2B:'2B',0x8B:'8B',0x89:'8B',0xA1:'A1',0xA3:'A3',0xF7:'F7',0xF6:'F7',
    0xEB:'EB',0xE9:'EB',0xE2:'E2',0xE1:'E2',0xE0:'E2',0xCD:'CD',0xF4:'F4'};
  const OPKEY = b => OPMAP[b] || (b >= 0x40 && b <= 0x47 ? '40' : b >= 0x70 && b <= 0x7F ? '75' : 'MODRM');

  /* ==========================================================
     geometry — every block has its own rectangle
     ========================================================== */
  const VB = [1580, 880];
  const CHIP = {x:420, y:56, w:480, h:800};
  const BIU  = {x:434, y:72, w:452, h:318};
  const EU   = {x:434, y:404, w:452, h:444};
  const MEMIF = {x:676, y:126, w:190, h:30};
  const SUM  = {t:148, b:194, l:446, r:622};
  const SEG  = {x:446, y:244, w:176, h:25, dy:27};
  const QUE  = {x:676, y:202, w:190, h:25, dy:28};
  const CU   = {x:656, y:440, w:220, h:46};
  const IBUS = 508;
  const REG  = {x:446, y:538, w:182, h:24, dy:26};
  const ALU  = {t:560, b:648, l:656, r:876, bl:680, br:852};
  const OPB  = {x:656, y:676, w:220, h:40};
  const FLG  = {x:656, y:788, w:220, h:40, dx:24.4, cw:23};
  const OUT  = {x:446, y:762, w:182, h:76};
  const BUSX = {addr:946, data:986, ctrl:1026};
  const RAM  = {x:1080, y:56, w:484, h:470};
  const COD  = {x:1094, y:112, w:456, h:26, dy:28, n:9};
  const DAT  = {x:1094, y:400, w:456, h:24, dy:26, n:4};
  const NOTE = {x:1080, y:546, w:484, h:310};

  const codeY = i => COD.y + i*COD.dy + 13;
  const dataY = j => DAT.y + j*DAT.dy + 12;
  const queY  = i => QUE.y + i*QUE.dy + 12.5;
  const segY  = i => SEG.y + i*SEG.dy + 12.5;

  /* ---------- the paths the travelling dot follows ---------- */
  /* ADRY routes the address-bus spur above the "Memory interface" pill, and DJY
     sits under the queue's bottom slot ("1") and above the control unit, so the
     data-bus spur into the chip's internal wiring never crosses a label */
  const ADRY = MEMIF.y - 16, DJY = QUE.y + 6*QUE.dy + 16;
  const P_SEG2SUM = [[606, SEG.y], [606, SUM.b]];
  const pAddr  = y => [[592, SUM.t], [592, ADRY], [BUSX.addr, ADRY], [BUSX.addr, y], [RAM.x, y]];
  const pCtrl  = y => [[CU.x + CU.w, 463], [BUSX.ctrl, 463], [BUSX.ctrl, y], [RAM.x, y]];
  const pData2Q = (y, i) => [[RAM.x, y], [BUSX.data, y], [BUSX.data, DJY], [876, DJY], [876, queY(i)], [866, queY(i)]];
  const pData2EU = y => [[RAM.x, y], [BUSX.data, y], [BUSX.data, DJY], [648, DJY], [648, IBUS], [700, IBUS], [700, ALU.t]];
  const pData2Reg = y => [[RAM.x, y], [BUSX.data, y], [BUSX.data, DJY], [648, DJY], [648, IBUS], [534, IBUS], [534, REG.y]];
  const pDataOut = y => [[534, REG.y], [534, IBUS], [648, IBUS], [648, DJY], [BUSX.data, DJY], [BUSX.data, y], [RAM.x, y]];
  const P_Q2CU  = [[786, QUE.y + 5*QUE.dy + QUE.h], [786, CU.y]];
  const P_EA    = [[786, CU.y + CU.h], [786, IBUS], [648, IBUS], [648, 226], [598, 226], [598, SUM.b]];
  const P_REG2ALU = [[534, REG.y], [534, IBUS], [840, IBUS], [840, ALU.t]];
  /* the operands already arrived at the ALU's top edge (P_REG2ALU); execute shows
     the computed result leaving from the ALU's bottom/output point into Result */
  const P_ALU   = [[770, ALU.b], [770, OPB.y]];
  const P_WB    = [[ALU.br, ALU.b - 20], [884, ALU.b - 20], [884, IBUS], [534, IBUS], [534, REG.y]];
  const P_OUT   = [[700, OPB.y + OPB.h], [700, 754], [540, 754], [540, OUT.y]];
  const P_IPNEW = [[534, segY(4)], [534, 448], [700, 448], [700, QUE.y + 3*QUE.dy]];

  /* ==========================================================
     planning the whole run before it is shown
     ========================================================== */
  function snapOf(cpu, dsB){
    return {r:{...cpu.r}, s:{...cpu.s}, ip:cpu.ip, flags:cpu.flags, out:cpu.out,
            dmem:Array.from(cpu.mem.subarray(dsB, dsB + 64))};
  }
  /* which four data rows to show, given the offsets a move touches */
  function win(offs){
    if (!offs.length) return 0;
    const lo = Math.min(...offs), hi = Math.max(...offs);
    return hi < DAT.n ? 0 : Math.max(0, Math.min(lo, hi - (DAT.n - 1)));
  }
  const rowOf = (off, w) => dataY(Math.max(0, Math.min(DAT.n - 1, off - w)));

  function buildStory(cpu){
    const prog = cpu.prog, ST = [];
    if (!prog) return ST;
    const dsB = cpu.phys(cpu.s.DS, 0);
    let q = [], first = true, flushed = false, n = 0, capped = false;

    while (!cpu.halted && n < MAXINS){
      const k = prog.at[cpu.ip];
      if (k === undefined) break;
      const ins = prog.ins[k];
      const before = snapOf(cpu, dsB);
      const cs = cpu.s.CS, at = ins.addr, pa = (cs << 4) + at;
      const bytes = ins.bytes.map(b => b[0]), hexb = bytes.map(h2).join(' ');
      const full = ins.text.trim(), cu = full.length > 20 ? full.slice(0, 19) + '…' : full;
      const mkpa = (sn, sv, on, ov) => ({sn, sv, on, ov});
      const base = {ins, insIdx: n, snap: before, pa: mkpa('CS', cs, 'IP', at), q: q.slice(0, 6)};
      const put = o => ST.push(Object.assign({qtake:0, cu:'', alu:'', dwin:0, hi:{}}, base, o));

      /* 1 — the address adder makes a 20-bit address out of CS and IP */
      put({title:'BIU · physical address calculation',
        desc: first
          ? 'A segment register holds only 16 bits, so the BIU sends CS and IP into the Σ adder. CS is shifted left four bits and IP is added, which is how 16-bit registers reach a 20-bit address.'
          : 'The BIU forms the address of the next instruction the same way: CS shifted left four bits, plus the current IP.',
        formula:`PA = CS×10h + IP = ${h5(cs << 4)} + ${h4(at)} = ${h5(pa)}h`,
        bus:'addr', path:P_SEG2SUM, label:'CS:IP', hi:{seg:['CS','IP'], sum:true}});

      /* 2 — the address goes out */
      put({title:'Address bus · instruction address out',
        desc:'The address leaves the adder, crosses the memory interface and is driven onto the twenty address lines, which pick this instruction out of RAM.',
        formula:`address bus ← ${h5(pa)}h`,
        bus:'addr', path:pAddr(codeY(k)), label:h5(pa), hi:{memif:true, sum:true, code:[k]}});

      /* 3 — the control bus says "read" */
      if (first || flushed) put({title:'Control bus · memory read',
        desc:'The control unit asserts the memory-read signal. Address and control are now both valid, so RAM drives the bytes it holds onto the data bus.',
        formula:'MEMR asserted',
        bus:'ctrl', path:pCtrl(codeY(k)), label:'MEMR', hi:{cu:true, code:[k]}});

      /* 4 — the bytes come back and fill the queue, one instruction at a time —
         the real BIU would also start prefetching the next instruction's bytes
         into any slots left over, but loading strictly one at a time is easier
         to follow and every instruction here still fits in the 6-byte queue */
      q = ins.bytes.map(b => [b[0], b[1]]).slice(0, 6);
      const mid = Object.assign({}, before, {ip:(at + ins.size) & 0xFFFF});
      put({snap:mid, q:q.slice(),
        title:'Data bus · bytes into the queue',
        desc:`All ${ins.size} byte${ins.size > 1 ? 's' : ''} of the instruction come back on the data bus and are latched into the 6-byte queue. IP moves past them at once, so the EU never waits for memory.`,
        formula:`${hexb}  →  queue  ·  IP = ${h4((at + ins.size) & 0xFFFF)}h`,
        bus:'data', path:pData2Q(codeY(k), 5), label:hexb, hi:{code:[k], queue:ins.size, memif:true}});
      flushed = false;

      /* 5 — decode */
      const tail = ins.bytes.slice(1).map(b => role(b[1])).join(', ');
      put({snap:mid, q:q.slice(), qtake:ins.size, cu,
        title:'EU · decode',
        desc:`The control unit takes ${hexb} out of the queue. ${h2(bytes[0])}h is the opcode${tail ? `, and what follows is the ${tail}` : ''}.`,
        formula:`${full}  ·  ${DESC[ins.mn] || ''}`,
        path:P_Q2CU, label:h2(bytes[0]), hi:{queue:ins.size, cu:true}});

      /* run it, then look at what it touched */
      const outBefore = cpu.out.length;
      const res = cpu.step();
      if (!res) break;
      const after = snapOf(cpu, dsB);
      const rd = [...cpu.reads].sort((a, b) => a - b);
      const wr = [...cpu.written].sort((a, b) => a - b);
      const rdOff = rd.filter(a => a >= dsB && a < dsB + 64).map(a => a - dsB);
      const wrOff = wr.filter(a => a >= dsB && a < dsB + 64).map(a => a - dsB);
      const memOp = (ins.ops || []).find(o => o && o.t === 'm');
      const regs = res.changed.filter(r => GP.includes(r) || PT.includes(r));
      const aluIns = /^(ADD|ADC|SUB|SBB|CMP|INC|DEC|NEG|MUL|IMUL|DIV|IDIV|AND|OR|XOR|NOT|TEST|SHL|SAL|SHR|SAR|ROL|ROR|RCL|RCR|CBW|CWD|LOOP)$/.test(ins.mn);
      q = q.slice(ins.size);
      const rest = {snap:mid, q:q.slice(), cu};

      /* 6 — an operand read */
      if (rd.length && rdOff.length){
        const sname = memOp ? memOp.seg : 'DS', sval = before.s[sname];
        const off = rd[0] - (sval << 4), w = win(rdOff), row = rowOf(rdOff[0], w);
        const P = mkpa(sname, sval, 'EA', off);
        put(Object.assign({}, rest, {pa:P, dwin:w,
          title:'BIU · effective address → physical address',
          desc:`This is a data access, so the same adder pairs the effective address with ${sname} instead of CS. One adder, a different segment register.`,
          formula:`PA = ${sname}×10h + EA = ${h5(sval << 4)} + ${h4(off)} = ${h5(rd[0])}h`,
          bus:'addr', path:P_EA, label:h4(off), hi:{seg:[sname], sum:true}}));
        put(Object.assign({}, rest, {pa:P, dwin:w,
          title:'Address bus · operand address out',
          desc:'The data address goes out on the address bus and picks the operand out of the data segment.',
          formula:`address bus ← ${h5(rd[0])}h`,
          bus:'addr', path:pAddr(row), label:h5(rd[0]), hi:{memif:true, sum:true, data:rdOff}}));
        put(Object.assign({}, rest, {pa:P, dwin:w,
          title:'Control bus · memory read',
          desc:'MEMR again, this time for data rather than for code. RAM cannot tell the difference: it simply drives the addressed bytes onto the data bus.',
          formula:'MEMR asserted',
          bus:'ctrl', path:pCtrl(row), label:'MEMR', hi:{cu:true, data:rdOff}}));
        const val = rd.map(a => h2(cpu.mem[a])).join(' ');
        put(Object.assign({}, rest, {pa:P, dwin:w, alu:aluIns ? 'operand' : '',
          title:'Data bus · operand into the EU',
          desc:'The bytes return on the data bus, cross the memory interface and run down the internal bus into the execution unit.',
          formula:`operand ← ${val}`,
          bus:'data', path:aluIns ? pData2EU(row) : pData2Reg(row), label:val,
          hi:{data:rdOff, memif:true, alu:aluIns}}));
      }

      /* 7 — the ALU */
      if (aluIns){
        put(Object.assign({}, rest, {alu:ins.mn,
          title:'Register file → ALU',
          desc:'The other operand comes out of the register file over the internal bus. Both ALU inputs are now latched.',
          formula:`${ins.mn} inputs ready`,
          path:P_REG2ALU, label:ins.mn,
          hi:{alu:true, regs:(ins.ops || []).filter(o => o && o.t === 'r').map(o => o.name.replace(/^([A-D])[HL]$/, '$1X'))}}));
        put(Object.assign({}, rest, {snap:after, alu:ins.mn,
          title:'ALU · execute',
          desc:`The ALU performs ${ins.mn}${res.flagsChanged.length ? ' and writes the flags it changed' : ', which leaves the flags alone'}.`,
          formula:`${full}${res.flagsChanged.length ? '  ·  flags ' + res.flagsChanged.join(' ') : ''}`,
          path:P_ALU, label:ins.mn, hi:{alu:true, flags:res.flagsChanged}}));
      }

      /* 8 — write back */
      if (regs.length) put(Object.assign({}, rest, {snap:after, alu:aluIns ? ins.mn : '',
        title:'Write back to the register file',
        desc:`The result travels back along the internal bus into ${regs.join(' and ')}.`,
        formula:regs.map(r => `${r} = ${h4(after.r[r])}h`).join('  ·  '),
        path:aluIns ? P_WB : P_REG2ALU, label:h4(after.r[regs[0]]), hi:{regs}}));

      /* 9 — a store */
      if (wr.length && wrOff.length){
        const sname = memOp ? memOp.seg : /^(MOVS|STOS)/.test(ins.mn) ? 'ES' : 'DS', sval = before.s[sname];
        const off = wr[0] - (sval << 4), w = win(wrOff), row = rowOf(wrOff[0], w);
        const P = mkpa(sname, sval, 'EA', off);
        put(Object.assign({}, rest, {snap:after, pa:P, dwin:w,
          title:'BIU · address for the store',
          desc:'The destination offset is added to the shifted segment to give the physical address the write will use.',
          formula:`PA = ${sname}×10h + EA = ${h5(sval << 4)} + ${h4(off)} = ${h5(wr[0])}h`,
          bus:'addr', path:pAddr(row), label:h5(wr[0]), hi:{seg:[sname], sum:true, memif:true}}));
        put(Object.assign({}, rest, {snap:after, pa:P, dwin:w,
          title:'Control bus · memory write',
          desc:'For a store the control unit asserts memory-write instead, telling RAM to latch whatever appears on the data bus at the addressed place.',
          formula:'MEMW asserted',
          bus:'ctrl', path:pCtrl(row), label:'MEMW', hi:{cu:true, data:wrOff}}));
        put(Object.assign({}, rest, {snap:after, pa:P, dwin:w,
          title:'Data bus · out to memory',
          desc:'Now the data bus carries information outward. The bytes leave the register file, cross the memory interface and are written into RAM, low byte first.',
          formula:wr.map(a => `[${h5(a)}] ← ${h2(cpu.mem[a])}h`).join('  ·  '),
          bus:'data', path:pDataOut(row), label:wr.map(a => h2(cpu.mem[a])).join(' '),
          hi:{data:wrOff, memif:true}}));
      } else if (wr.length){                                   /* stack traffic */
        put(Object.assign({}, rest, {snap:after,
          title:'Data bus · out to the stack',
          desc:'The value is written into the stack segment at SS × 10h + SP. The stack grows downwards, so SP was taken down by two first.',
          formula:wr.map(a => `[${h5(a)}] ← ${h2(cpu.mem[a])}h`).join('  ·  '),
          bus:'data', path:pDataOut(dataY(0)), label:h4(after.r.SP),
          pa:mkpa('SS', after.s.SS, 'SP', after.r.SP), hi:{regs:['SP'], memif:true}}));
      }

      /* 10 — text printed by DOS */
      if (cpu.out.length > outBefore) put(Object.assign({}, rest, {snap:after,
        title:'INT 21h · the operating system prints',
        desc:'The interrupt hands control to a DOS routine, which reads the string out of memory one byte at a time and sends it to the screen.',
        formula:`output ← ${JSON.stringify(cpu.out.slice(outBefore))}`,
        path:P_OUT, label:'text', hi:{out:true}}));

      /* 11 — a taken jump empties the queue */
      if (res.jumped){
        q = []; flushed = true;
        put(Object.assign({}, rest, {snap:after, q:[],
          title:'Jump taken · the queue is flushed',
          desc:'IP no longer points at the bytes the BIU prefetched, so the queue is thrown away and filled again from the new address.',
          formula:`IP = ${h4(after.ip)}h  ·  queue emptied`,
          path:P_IPNEW, label:h4(after.ip), hi:{seg:['IP'], queue:'flush'}}));
      }
      first = false;
      n++;
      if (n >= MAXINS && !cpu.halted) capped = true;
    }

    /* the closing move */
    const last = ST.length ? ST[ST.length - 1] : null;
    ST.push({ins:null, insIdx:n, snap:snapOf(cpu, dsB), q:[], qtake:0, cu:'', alu:'',
      dwin:last ? last.dwin : 0, hi:{},
      pa:last ? last.pa : {sn:'CS', sv:cpu.s.CS, on:'IP', ov:cpu.ip},
      title: capped ? 'Still running' : cpu.halted ? 'Program complete' : 'End of the program',
      desc: capped ? `The flow shows the first ${MAXINS} instructions of this program. It runs on past this point, so pick a shorter example to see a whole story.`
        : (cpu.note || 'The processor has stopped. Press Reset to run the whole cycle again.'),
      formula:`AX = ${h4(cpu.r.AX)}h · BX = ${h4(cpu.r.BX)}h · CX = ${h4(cpu.r.CX)}h · DX = ${h4(cpu.r.DX)}h`,
      path:null});
    return ST;
  }

  /* ==========================================================
     state kept between visits
     ========================================================== */
  function loadInto(S, src, name, pick){
    S.src = src; S.name = name; S.pick = pick; S.err = null; S.idx = 0;
    let cpu = new I8086.CPU();
    try { cpu.assemble(src); } catch (e){ S.err = e.message; }
    S.story = S.err ? [] : buildStory(cpu);
    cpu = new I8086.CPU();                       /* a fresh chip for the display */
    if (!S.err){ try { cpu.assemble(src); } catch (e){ S.err = e.message; } }
    S.cpu = cpu;
  }
  function state(){
    if (!SIM.x86 || !SIM.x86.cpu){
      SIM.x86 = {speed:2, idx:0};
      loadInto(SIM.x86, FEATURED[0].s, FEATURED[0].n, 'f0');
    }
    return SIM.x86;
  }

  /* ==========================================================
     the drawing
     ========================================================== */
  SCENES.i8086 = () => {
    const lbl = (x, y, t, a = '') => T(x, y, t, 'lab', a);
    const wire = (pts, k) => `<path class="w86 ${k}" d="M${pts.map(p => p.join(' ')).join('L')}"/>`;
    let s = '<g class="s86">';

    /* ---------- 1. examples and flow — a visibly separate control strip, kept
       well clear of the chip column with a wide gap, and shaded a touch darker
       (below) since it is the UI around the simulation, not the processor itself ---------- */
    s += T(30, 40, 'Example program', 'ttl');
    s += `<foreignObject x="30" y="52" width="310" height="64"><div xmlns="http://www.w3.org/1999/xhtml" class="x86-cur" data-excur tabindex="0" role="button" aria-haspopup="listbox" aria-label="Choose an example program"></div></foreignObject>`;
    s += T(30, 148, 'Flow of this program', 'ttl') + T(340, 148, '', 'lab t-end', 'data-txt="count"');
    s += `<foreignObject x="30" y="160" width="310" height="488"><div xmlns="http://www.w3.org/1999/xhtml" class="x86-flow" data-flow=""></div></foreignObject>`;
    s += btnS(30, 664, 98, 40, 'Play', 'data-a="play" aria-label="Play the whole flow"');
    s += btnS(136, 664, 98, 40, 'Step', 'data-a="step" aria-label="Show the next move"');
    s += btnS(242, 664, 98, 40, 'Reset', 'data-a="reset" aria-label="Go back to the first move"');
    s += T(30, 736, 'Animation speed', 'lab');
    SPEEDS.forEach(([v, n], i) => { s += btnS(30 + i*79, 746, 73, 36, n, `data-speed="${v}" aria-label="Animation speed: ${n}" style="font-size:15px"`); });
    s += btnS(30, 798, 151, 40, 'Instruction set', 'data-a="ops" aria-label="Open the opcode reference" style="font-size:17px"');
    s += btnS(189, 798, 151, 40, 'Write your own', 'data-a="edit" aria-label="Write your own program" style="font-size:17px"');

    /* ---------- 2. the chip ---------- */
    s += T(CHIP.x, 44, 'Intel 8086', 'ttl') + lbl(CHIP.x + 155, 44, 'inside the chip');
    s += R(CHIP.x, CHIP.y, CHIP.w, CHIP.h, 18, 'm-panel');
    s += R(BIU.x, BIU.y, BIU.w, BIU.h, 14, 'band-biu');
    s += T(BIU.x + 12, 96, 'BIU', 'ttl biu-t') + lbl(BIU.x + 62, 96, 'Bus interface unit');
    s += R(EU.x, EU.y, EU.w, EU.h, 14, 'band-eu');
    s += T(EU.x + 12, 428, 'EU', 'ttl eu-t') + lbl(EU.x + 54, 428, 'Execution unit');

    s += R(MEMIF.x, MEMIF.y, MEMIF.w, MEMIF.h, 15, 'm-acc-soft', 'data-act="memif"');
    s += T(MEMIF.x + MEMIF.w/2, MEMIF.y + 20, 'Memory interface', 'sn t-mid');

    s += lbl(SUM.l, SUM.t - 8, 'Address adder');
    s += P(`M${SUM.l} ${SUM.b}H${SUM.r}L${SUM.r - 24} ${SUM.t}H${SUM.l + 24}Z`, 'm-acc-soft', 'data-act="sum"');
    s += T(SUM.l + 38, SUM.b - 15, 'Σ', 'sig t-mid');
    s += T(SUM.l + 118, SUM.b - 16, '—', 'val t-mid', 'data-txt="sum"');

    s += lbl(SEG.x, 236, 'Segment registers');
    SEGR.forEach((r, i) => { const y = SEG.y + i*SEG.dy;
      s += `<g data-seg="${r}">${R(SEG.x, y, SEG.w, SEG.h, 5, 'm-block')}${T(SEG.x + 10, y + 17, r, 'sn')}${T(SEG.x + SEG.w - 10, y + 17, '0000', 'val t-end', 'data-sv')}</g>`; });

    s += lbl(QUE.x, QUE.y - 4, 'Instruction queue');
    /* drawn top to bottom, but numbered 6 down to 1 — byte 1 (the one closest to
       decode) sits at the bottom, next to where the data bus feeds it in */
    for (let i = 0; i < 6; i++){ const y = QUE.y + i*QUE.dy;
      s += `<g class="qcell" data-q="${i}">${R(QUE.x, y, QUE.w, QUE.h, 5, '')}${T(QUE.x + 10, y + 17, String(6 - i), 'lab')}` +
        `${T(QUE.x + 64, y + 17, '', 'val', 'data-qb')}${T(QUE.x + QUE.w - 10, y + 17, '', 'lab t-end', 'data-qr')}</g>`; }

    s += R(CU.x, CU.y, CU.w, CU.h, 8, 'm-block', 'data-act="cu"');
    s += T(CU.x + 12, CU.y + 19, 'Control unit', 'sn') + T(CU.x + 12, CU.y + 38, 'idle', 'val', 'data-txt="cu"');

    s += lbl(EU.x + 10, 500, 'Internal data bus · 16 bits');
    s += `<path class="bus86" d="M${EU.x + 10} ${IBUS}H${EU.x + EU.w - 4}"/>`;

    s += T(REG.x + 64, 531, 'AH', 'lab t-mid') + T(REG.x + 144, 531, 'AL', 'lab t-mid');
    GP.forEach((r, i) => { const y = REG.y + i*REG.dy;
      s += `<g data-reg="${r}">${T(REG.x + 2, y + 17, r, 'sn')}${R(REG.x + 26, y, 76, REG.h, 4, 'm-block', 'data-half="H"')}${R(REG.x + 106, y, 76, REG.h, 4, 'm-block', 'data-half="L"')}` +
        `${T(REG.x + 96, y + 17, '00', 'val t-end', 'data-hv')}${T(REG.x + 176, y + 17, '00', 'val t-end', 'data-lv')}</g>`; });
    PT.forEach((r, i) => { const y = REG.y + (i + 4)*REG.dy;
      s += `<g data-reg="${r}">${T(REG.x + 2, y + 17, r, 'sn')}${R(REG.x + 26, y, 156, REG.h, 4, 'm-block')}${T(REG.x + 176, y + 17, '0000', 'val t-end', 'data-lv')}</g>`; });

    s += P(`M${ALU.l} ${ALU.t}H${ALU.r}L${ALU.br} ${ALU.b}H${ALU.bl}Z`, 'm-acc-soft alu86', 'data-act="alu"');
    s += T(766, 594, 'Arithmetic', 'sn t-mid') + T(766, 612, 'logic unit', 'sn t-mid');
    s += T(766, 636, '—', 'val t-mid', 'data-txt="alu"');

    s += R(OPB.x, OPB.y, OPB.w, OPB.h, 8, 'm-block', 'data-act="opb"');
    s += T(OPB.x + 12, OPB.y + 25, 'Result', 'sn') + T(OPB.x + OPB.w - 12, OPB.y + 25, '—', 'val t-end', 'data-txt="res"');

    s += T(FLG.x + FLG.w, FLG.y - 8, 'Flags', 'lab t-end');
    FLAGS.forEach((f, i) => { const x = FLG.x + i*FLG.dx;
      s += `<g class="flag" data-flag="${f}"><title>${FLAG_NAME_X[f]} flag</title>${R(x, FLG.y, FLG.cw, FLG.h, 5, '')}` +
        `<text class="fn" x="${x + FLG.cw/2}" y="${FLG.y + 15}">${f}</text><text class="fv" x="${x + FLG.cw/2}" y="${FLG.y + 33}" data-fv>0</text></g>`; });

    s += R(OUT.x, OUT.y, OUT.w, OUT.h, 8, 'm-block');
    s += T(OUT.x + 10, OUT.y + 20, 'Output', 'sn') + T(OUT.x + OUT.w - 10, OUT.y + 20, 'INT 21h', 'lab t-end');
    s += `<foreignObject x="${OUT.x + 8}" y="${OUT.y + 28}" width="${OUT.w - 16}" height="42"><div xmlns="http://www.w3.org/1999/xhtml" class="x86-outbox" data-out=""></div></foreignObject>`;

    /* wiring inside the chip */
    s += wire([[606, SEG.y], [606, SUM.b]], 'a');
    s += wire([[592, SUM.t], [592, ADRY], [BUSX.addr, ADRY]], 'a');
    /* memory interface's own data-bus tap stays at its own height, clear to the
       right of the queue box, instead of running down through it */
    s += wire([[MEMIF.x + MEMIF.w, MEMIF.y + MEMIF.h/2], [BUSX.data, MEMIF.y + MEMIF.h/2]], 'd');
    s += wire([[648, DJY], [BUSX.data, DJY]], 'd');
    /* the spine runs up from below the queue and taps in at the bottom row —
       byte 1's slot — right where the data bus now meets the internal wiring */
    s += wire([[876, DJY], [876, queY(5)]], 'd');
    s += wire([[876, queY(5)], [866, queY(5)]], 'd t');
    s += wire([[648, DJY], [648, IBUS]], 'd');
    s += wire([[786, QUE.y + 5*QUE.dy + QUE.h], [786, CU.y]], 'd');
    s += wire([[786, CU.y + CU.h], [786, IBUS]], 'd');
    s += wire([[534, IBUS], [534, REG.y]], 'd');
    s += wire([[700, IBUS], [700, ALU.t]], 'd') + wire([[840, IBUS], [840, ALU.t]], 'd');
    s += wire([[770, ALU.b], [770, OPB.y]], 'd');
    s += wire([[ALU.br, ALU.b - 20], [884, ALU.b - 20], [884, IBUS]], 'd');
    s += wire([[700, OPB.y + OPB.h], [700, 754], [540, 754], [540, OUT.y]], 'd');
    s += wire([[CU.x + CU.w, 463], [BUSX.ctrl, 463]], 'c');

    /* ---------- 3. the three buses ---------- */
    [['addr','Address bus','20 lines, one way: the 8086 says which byte it wants'],
     ['data','Data bus','16 lines, both ways: the bytes themselves'],
     ['ctrl','Control bus','read or write, memory or I/O, and the other timing signals']].forEach(([k, name, what], i) => {
      s += `<g class="busline" data-bus="${k}" tabindex="0" role="img" aria-label="${name}: ${what}"><title>${name} — ${what}</title>` +
        `<rect class="bus-hit" x="${BUSX[k] - 16}" y="100" width="32" height="660"/>` +
        `<path class="bus-line b-${k}" d="M${BUSX[k]} 104V756"/></g>`;
      const y = 788 + i*24;
      s += `<path class="bus-key b-${k}" d="M904 ${y}H934"/>` + T(942, y + 5, name, 'lab');
    });

    /* ---------- 4. RAM, the sum, and the story ---------- */
    s += T(RAM.x, 44, 'RAM', 'ttl ram-t') + lbl(RAM.x + 62, 44, 'outside the chip');
    s += R(RAM.x, RAM.y, RAM.w, RAM.h, 14, 'm-panel ram-panel');
    s += lbl(RAM.x + 14, 86, '', 'data-txt="cseg"');
    s += lbl(COD.x + 6, 104, 'address') + lbl(COD.x + 100, 104, 'assembly') + T(COD.x + COD.w - 6, 104, 'machine code', 'lab t-end');
    for (let i = 0; i < COD.n; i++){ const y = COD.y + i*COD.dy;
      s += `<g class="crow" data-crow="${i}" tabindex="0" role="button" aria-label="Show how this instruction is encoded">${R(COD.x, y, COD.w, COD.h, 5, '')}` +
        `${T(COD.x + 8, y + 18, '', 'val t-mut', 'data-ca')}${T(COD.x + 100, y + 18, '', 'asm', 'data-ct')}` +
        `${T(COD.x + COD.w - 8, y + 18, '', 'val t-end', 'data-cb')}</g>`; }
    s += lbl(RAM.x + 14, 386, '', 'data-txt="dseg"');
    for (let j = 0; j < DAT.n; j++){ const y = DAT.y + j*DAT.dy;
      s += `<g class="drow" data-drow="${j}">${R(DAT.x, y, DAT.w, DAT.h, 5, '')}` +
        `${T(DAT.x + 8, y + 17, '', 'val t-mut', 'data-da')}${T(DAT.x + 150, y + 17, '', 'val t-mid', 'data-dv')}` +
        `${T(DAT.x + 196, y + 17, '', 'asm', 'data-dn')}${T(DAT.x + DAT.w - 8, y + 17, '', 'lab t-end', 'data-dc')}</g>`; }

    /* shaded darker than the chip blocks — this is the running narration, not a real part of the processor */
    s += R(NOTE.x, NOTE.y, NOTE.w, NOTE.h, 12, 'm-block meta');
    s += T(NOTE.x + 16, NOTE.y + 30, 'Ready', 'ttl', 'data-txt="title"');
    s += T(NOTE.x + 16, NOTE.y + 58, '', 'story', 'data-txt="desc"');
    s += `<path class="rule86" d="M${NOTE.x + 16} ${NOTE.y + 198}H${NOTE.x + NOTE.w - 16}"/>`;
    s += T(NOTE.x + 16, NOTE.y + 226, '', 'val acc', 'data-txt="form"');

    /* ---------- overlay ---------- */
    s += `<g id="x86-ov" style="display:none"><rect class="scrim86" x="0" y="0" width="${VB[0]}" height="${VB[1]}"/>` +
      `<foreignObject x="430" y="70" width="1120" height="750"><div xmlns="http://www.w3.org/1999/xhtml" class="x86-ov" data-ov=""></div></foreignObject></g>`;
    s += '</g>';

    return {svg: s, vb: VB, init: el => {
      requestWide(true);
      el.dataset.scrollStart = 'left';
      const S = state();
      const $ = q => el.querySelector(q), $$ = q => el.querySelectorAll(q);
      const txt = (k, v) => { const e = $(`[data-txt="${k}"]`); if (e) e.innerHTML = v; };
      let playing = false, timer = null, raf = null;

      /* ---------- the travelling dot, and the wire it lays down behind it ---------- */
      const track = document.createElementNS(SVGNS, 'path');
      track.setAttribute('class', 'flow-track'); track.setAttribute('opacity', '0');
      const dot = document.createElementNS(SVGNS, 'circle');
      dot.setAttribute('class', 'flow-dot'); dot.setAttribute('r', '9'); dot.setAttribute('opacity', '0');
      const dotL = document.createElementNS(SVGNS, 'text');
      dotL.setAttribute('class', 'flow-lab'); dotL.setAttribute('opacity', '0');
      /* appended inside .s86 (not the bare svg root) so the b-addr/b-data/b-ctrl/b-int
         rules — which are scoped to .s86 — actually reach the dot and its wire trail,
         instead of both silently falling back to the generic amber default */
      const grp = $('.s86');
      grp.appendChild(track); grp.appendChild(dot); grp.appendChild(dotL);
      const hideDot = () => { dot.setAttribute('opacity', '0'); dotL.setAttribute('opacity', '0'); track.setAttribute('opacity', '0'); };
      const measure = p => { const seg = []; let L = 0;
        for (let i = 1; i < p.length; i++){ const l = Math.hypot(p[i][0] - p[i-1][0], p[i][1] - p[i-1][1]); seg.push(l); L += l; }
        return {L, seg}; };
      const at = (p, m, f) => { let t = m.L*f, acc = 0;
        for (let i = 0; i < m.seg.length; i++){
          if (acc + m.seg[i] >= t || i === m.seg.length - 1){ const r = m.seg[i] ? (t - acc)/m.seg[i] : 0;
            return [p[i][0] + (p[i+1][0] - p[i][0])*r, p[i][1] + (p[i+1][1] - p[i][1])*r]; }
          acc += m.seg[i]; }
        return p[0]; };
      /* the exact points of the wire already laid down, up to fraction f — so it reaches
         the precise memory row (or register, or ALU input) right as the dot gets there */
      const laid = (p, m, f) => { let t = m.L*f, acc = 0, out = [p[0]];
        for (let i = 0; i < m.seg.length; i++){
          if (acc + m.seg[i] < t){ out.push(p[i+1]); acc += m.seg[i]; }
          else { const r = m.seg[i] ? (t - acc)/m.seg[i] : 0;
            out.push([p[i][0] + (p[i+1][0] - p[i][0])*r, p[i][1] + (p[i+1][1] - p[i][1])*r]); break; } }
        return out; };
      const travel = (st, done) => {
        if (raf) cancelAnimationFrame(raf);
        const ms = SPEED_MS[S.speed];
        if (!st || !st.path || !ms || REDUCED){ hideDot(); return done(); }
        const m = measure(st.path), dur = Math.max(340, m.L*1.5) * (ms/850);
        dot.setAttribute('class', 'flow-dot b-' + (st.bus || 'int'));
        track.setAttribute('class', 'flow-track b-' + (st.bus || 'int'));
        dotL.textContent = st.label || '';
        dot.setAttribute('opacity', '1'); dotL.setAttribute('opacity', '1'); track.setAttribute('opacity', '1');
        let t0 = null;
        const fr = ts => { if (t0 === null) t0 = ts;
          const f = Math.min(1, (ts - t0)/dur), q = at(st.path, m, f);
          dot.setAttribute('cx', q[0]); dot.setAttribute('cy', q[1]);
          track.setAttribute('d', 'M' + laid(st.path, m, f).map(p => p.join(' ')).join('L'));
          dotL.setAttribute('x', Math.max(40, Math.min(q[0], VB[0] - 46))); dotL.setAttribute('y', q[1] - 16);
          if (f < 1) raf = requestAnimationFrame(fr); else { hideDot(); done(); } };
        raf = requestAnimationFrame(fr);
      };

      /* ---------- drawing one move ---------- */
      const codeWin = () => {
        const p = S.cpu.prog; if (!p) return 0;
        const st = S.story[S.idx], k = st && st.ins ? st.ins.index : 0;
        return Math.max(0, Math.min(k - 4, p.ins.length - COD.n));
      };
      const drawCode = st => {
        const p = S.cpu.prog, w = codeWin(), cur = st && st.ins ? st.ins.index : -1;
        const lit = (st && st.hi.code) || [];
        txt('cseg', p ? `Code segment · CS = ${h4(S.cpu.s.CS)}h${p.ins.length > COD.n ? `  ·  instructions ${w + 1}–${Math.min(p.ins.length, w + COD.n)} of ${p.ins.length}` : ''}` : 'Code segment');
        $$('[data-crow]').forEach((g, i) => { const k = w + i, I = p && p.ins[k];
          g.style.display = I ? '' : 'none';
          if (!I) return;
          g.querySelector('[data-ca]').textContent = h5((S.cpu.s.CS << 4) + I.addr);
          const at = I.text.trim();
          g.querySelector('[data-ct]').textContent = at.length > 24 ? at.slice(0, 23) + '…' : at;
          g.querySelector('[data-cb]').textContent = I.bytes.map(b => h2(b[0])).join(' ');
          g.classList.toggle('lit', lit.includes(k));
          g.classList.toggle('cur', k === cur);
          g.classList.toggle('done', cur >= 0 && k < cur);
        });
      };
      const drawData = st => {
        const p = S.cpu.prog, base = (st && st.dwin) || 0, dsB = S.cpu.phys(S.cpu.s.DS, 0);
        const names = {};
        if (p) for (const k in p.data) names[p.data[k].off] = k.toLowerCase();
        const lit = (st && st.hi.data) || [];
        txt('dseg', `Data segment · DS = ${h4(S.cpu.s.DS)}h`);
        $$('[data-drow]').forEach((g, j) => { const off = base + j;
          const v = (st && st.snap ? st.snap.dmem[off] : S.cpu.mem[dsB + off]) || 0;
          g.querySelector('[data-da]').textContent = h5(dsB + off);
          g.querySelector('[data-dv]').textContent = h2(v);
          g.querySelector('[data-dn]').textContent = names[off] || '';
          g.querySelector('[data-dc]').textContent = v >= 32 && v < 127 ? `'${String.fromCharCode(v)}'` : '';
          g.classList.toggle('lit', lit.includes(off));
        });
      };
      const drawChip = st => {
        const sn = st && st.snap ? st.snap : {r:S.cpu.r, s:S.cpu.s, ip:S.cpu.ip, flags:S.cpu.flags, out:S.cpu.out};
        const hi = (st && st.hi) || {};
        SEGR.forEach(r => { const g = $(`[data-seg="${r}"]`);
          g.querySelector('[data-sv]').textContent = h4(r === 'IP' ? sn.ip : sn.s[r]);
          g.querySelector('rect').classList.toggle('lit', !!(hi.seg && hi.seg.includes(r))); });
        GP.forEach(r => { const g = $(`[data-reg="${r}"]`);
          g.querySelector('[data-hv]').textContent = h2(sn.r[r] >> 8);
          g.querySelector('[data-lv]').textContent = h2(sn.r[r]);
          g.querySelectorAll('[data-half]').forEach(e => e.classList.toggle('lit', !!(hi.regs && hi.regs.includes(r)))); });
        PT.forEach(r => { const g = $(`[data-reg="${r}"]`);
          g.querySelector('[data-lv]').textContent = h4(sn.r[r]);
          g.querySelector('rect').classList.toggle('lit', !!(hi.regs && hi.regs.includes(r))); });
        FLAGS.forEach(f => { const g = $(`[data-flag="${f}"]`), v = (sn.flags >> I8086.FB[f]) & 1;
          g.querySelector('[data-fv]').textContent = v;
          g.classList.toggle('on', !!v);
          g.classList.toggle('chg', !!(hi.flags && hi.flags.includes(f))); });
        /* row i is drawn top to bottom but numbered 6..1, so it shows byte q[5-i] —
           byte 1 (q[0], next to decode) ends up in the bottom row, near the data bus */
        const q = (st && st.q) || [], take = st ? st.qtake : 0;
        $$('.qcell').forEach((c, i) => { const b = q[5 - i];
          c.querySelector('[data-qb]').textContent = b ? h2(b[0]) : '';
          c.querySelector('[data-qr]').textContent = b ? role(b[1]) : '';
          c.classList.toggle('empty', !b);
          c.classList.toggle('on', !!b && i >= 6 - take);
          c.classList.toggle('flush', hi.queue === 'flush'); });
        txt('cu', esc((st && st.cu) || 'idle'));
        txt('alu', esc((st && st.alu) || '—'));
        txt('res', st && st.hi.regs && st.hi.regs.length ? esc(h4(sn.r[st.hi.regs[0]]) + 'h') : '—');
        $('[data-act="cu"]').classList.toggle('active', !!hi.cu);
        $('[data-act="alu"]').classList.toggle('active', !!hi.alu);
        $('[data-act="sum"]').classList.toggle('active', !!hi.sum);
        $('[data-act="memif"]').classList.toggle('active', !!hi.memif);
        const ob = $('[data-out]'); ob.textContent = sn.out || ''; ob.classList.toggle('lit', !!hi.out);
        const pa = (st && st.pa) || {sn:'CS', sv:sn.s.CS, on:'IP', ov:sn.ip};
        txt('sum', hi.sum || hi.memif ? h5((pa.sv << 4) + pa.ov) : '—');
        $$('.busline').forEach(b => b.classList.toggle('on', !!(st && st.bus === b.dataset.bus)));
      };
      const drawNote = st => {
        if (S.err){
          txt('title', 'This program cannot be assembled');
          txt('desc', tspans(wrap(esc(S.err), 44).slice(0, 6), NOTE.x + 16, 24));
          txt('form', ''); return;
        }
        if (!st) return;
        txt('title', esc(st.title));
        txt('desc', tspans(wrap(esc(st.desc), 44).slice(0, 6), NOTE.x + 16, 24));
        txt('form', tspans(wrap(esc(st.formula || ''), 43).slice(0, 3), NOTE.x + 16, 23));
      };
      const markFlow = () => {
        $$('[data-fl]').forEach(b => { const i = +b.dataset.fl;
          b.classList.toggle('on', i === S.idx);
          b.classList.toggle('past', i < S.idx); });
        const c = $(`[data-fl="${S.idx}"]`); if (c) c.scrollIntoView({block:'nearest'});
        txt('count', S.story.length ? `${S.idx + 1}/${S.story.length}` : '');
      };
      const draw = () => {
        const st = S.story[S.idx] || null;
        drawCode(st); drawData(st); drawChip(st); drawNote(st); markFlow();
        $('[data-a="play"]').querySelector('text').textContent = playing ? 'Pause' : 'Play';
        $$('[data-speed]').forEach(b => b.classList.toggle('on', +b.dataset.speed === S.speed));
        $('[data-a="step"]').classList.toggle('dis', S.idx >= S.story.length - 1);
        $('[data-a="play"]').classList.toggle('dis', !S.story.length);
      };

      /* ---------- playback ----------
         The highlight (and every value shown) only appears once the dot has
         actually arrived -- draw() runs from travel()'s done callback, not
         before it starts -- and a short pause afterwards, before the next
         move begins, gives the arrival a moment to register instead of
         instantly chaining into the next step. */
      const ARRIVE_PAUSE = 320;
      const stop = () => { playing = false; clearTimeout(timer); if (raf) cancelAnimationFrame(raf); hideDot(); draw(); };
      const show = (i, animate) => {
        S.idx = Math.max(0, Math.min(i, Math.max(0, S.story.length - 1)));
        if (animate) travel(S.story[S.idx], () => draw());
        else draw();
      };
      const advance = () => {
        if (S.idx >= S.story.length - 1){ stop(); return; }
        S.idx++;
        travel(S.story[S.idx], () => { draw(); if (playing) timer = setTimeout(advance, Math.max(110, SPEED_MS[S.speed]*0.3) + ARRIVE_PAUSE); });
      };

      /* ---------- the example picker, collapsed to the current pick ---------- */
      const exampleList = () => {
        let h = '<div class="x86-exg"><b>Complete stories</b>';
        FEATURED.forEach((p, i) => { h += `<button type="button" class="big" data-ex="f${i}"><span>${esc(p.n)}</span><em>${esc(p.d)}</em></button>`; });
        h += '</div>';
        GROUP_IDS.forEach(g => {
          h += `<div class="x86-exg"><b>${esc(N[g].name)}</b>`;
          INSTR[g].forEach((r, i) => { h += `<button type="button" data-ex="${g}:${i}" title="${esc(r[1])}">${esc(r[0])}</button>`; });
          h += '</div>';
        });
        return h;
      };
      const pickExample = k => {
        if (!k.includes(':')){ const p = FEATURED[+k.slice(1)]; reload(p.s, p.n, k); }
        else { const [g, i] = k.split(':'), row = INSTR[g][+i]; reload(`; ${row[0]} — ${row[1]}\n${row[2]}`, row[0] + ' example', k); }
      };
      const drawCur = () => {
        const f = S.pick && /^f\d+$/.test(S.pick) ? FEATURED[+S.pick.slice(1)] : null;
        $('[data-excur]').innerHTML = `<div class="x86-curbox"><div class="x86-curtxt"><b>${esc(S.name)}</b>${f ? `<em>${esc(f.d)}</em>` : ''}</div>` +
          `<svg class="x86-curchev" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m5 8 5 5 5-5"/></svg></div>`;
      };
      const openExamples = () => {
        ov.style.display = ''; grp.appendChild(ov);   /* repaint above the travelling dot/wire */
        ovb.innerHTML = '<div class="ovh"><h3>Choose an example</h3><button type="button" data-ovx aria-label="Close">Close</button></div>' +
          `<div class="x86-exs-ov">${exampleList()}</div>`;
        onPress(ovb.querySelector('[data-ovx]'), closeOv);
        ovb.querySelectorAll('[data-ex]').forEach(b => {
          b.classList.toggle('on', b.dataset.ex === S.pick);
          onPress(b, () => { closeOv(); pickExample(b.dataset.ex); });
        });
      };
      const buildFlow = () => {
        if (S.err){ $('[data-flow]').innerHTML = `<p class="x86-bad">${esc(S.err)}</p>`; return; }
        let h = '', last = -1;
        S.story.forEach((st, i) => {
          if (st.insIdx !== last){ last = st.insIdx;
            h += st.ins
              ? `<div class="fg"><span class="fn">${st.insIdx + 1}</span><code>${esc(st.ins.text.trim())}</code><i>${h4(st.ins.addr)}h</i></div>`
              : '<div class="fg end"><span class="fn">✓</span><code>result</code></div>'; }
          h += `<button type="button" class="fl" data-fl="${i}"><span class="fb b-${st.bus || 'int'}"></span>${esc(st.title.replace(/^[^·]+· /, ''))}</button>`;
        });
        $('[data-flow]').innerHTML = h;
        $$('[data-fl]').forEach(b => onPress(b, () => { stop(); show(+b.dataset.fl, true); }));
      };
      const reload = (src, name, pick) => {
        stop(); loadInto(S, src, name, pick);
        drawCur(); buildFlow(); show(0, false);
      };

      /* ---------- overlay ---------- */
      const ov = $('#x86-ov'), ovb = $('[data-ov]');
      const closeOv = () => { ov.style.display = 'none'; ovb.innerHTML = ''; };
      const openOps = key => {
        ov.style.display = ''; grp.appendChild(ov);   /* repaint above the travelling dot/wire */
        ovb.innerHTML = '<div class="ovh"><h3>8086 opcode encoding</h3><button type="button" data-ovx aria-label="Close">Close</button></div>' +
          '<div class="orow head"><span>Bytes</span><span>Instruction</span><span>Bit pattern</span></div>' +
          '<div class="olist">' + OPC.map((o, i) => `<button type="button" class="orow" data-op="${i}"><span class="mono">${esc(o.b)}</span><span>${esc(o.m)}</span><span class="mono dim">${esc(o.e)}</span></button>`).join('') + '</div>' +
          '<div class="odet" data-odet></div>';
        const sel = i => { const o = OPC[i];
          ovb.querySelectorAll('[data-op]').forEach((b, j) => b.classList.toggle('sel', j === i));
          ovb.querySelector('[data-odet]').innerHTML = `<p class="mono acc">${esc(o.b)} · ${esc(o.e)}${o.x ? ' · ' + esc(o.x) : ''}</p><p>${esc(o.n)}</p>`; };
        ovb.querySelectorAll('[data-op]').forEach(b => onPress(b, () => sel(+b.dataset.op)));
        onPress(ovb.querySelector('[data-ovx]'), closeOv);
        let i = 0; OPC.forEach((o, j) => { if (o.k === key) i = j; });
        sel(i);
      };
      const openEdit = () => {
        ov.style.display = ''; grp.appendChild(ov);   /* repaint above the travelling dot/wire */
        ovb.innerHTML = '<div class="ovh"><h3>Write your own program</h3><button type="button" data-ovx aria-label="Close">Close</button></div>' +
          `<textarea class="x86-ta" spellcheck="false" aria-label="Assembly program">${esc(S.src)}</textarea>` +
          '<div class="ovf"><button type="button" class="prim" data-ovrun>Assemble and load</button>' +
          '<span>8086 assembly: DB and DW data, labels, and every documented instruction.</span></div>';
        onPress(ovb.querySelector('[data-ovx]'), closeOv);
        onPress(ovb.querySelector('[data-ovrun]'), () => {
          const v = ovb.querySelector('.x86-ta').value;
          closeOv(); reload(v, 'Your program', 'own');
        });
      };

      /* ---------- wiring up ---------- */
      onPress($('[data-excur]'), openExamples);
      onPress($('[data-a="play"]'), () => {
        if (!S.story.length) return;
        if (playing){ stop(); return; }
        if (S.idx >= S.story.length - 1) S.idx = 0;
        playing = true; draw(); advance();
      });
      onPress($('[data-a="step"]'), () => {
        if (playing) stop();
        if (S.idx < S.story.length - 1){ S.idx++; travel(S.story[S.idx], () => draw()); }
      });
      onPress($('[data-a="reset"]'), () => { stop(); show(0, false); });
      onPress($('[data-a="ops"]'), () => openOps(S.story[S.idx] && S.story[S.idx].ins ? OPKEY(S.story[S.idx].ins.bytes[0][0]) : 'B8'));
      onPress($('[data-a="edit"]'), openEdit);
      $$('[data-speed]').forEach(b => onPress(b, () => { S.speed = +b.dataset.speed; draw(); }));
      $$('[data-crow]').forEach(g => onPress(g, () => {
        const p = S.cpu.prog; if (!p) return;
        const I = p.ins[codeWin() + (+g.dataset.crow)]; if (I) openOps(OPKEY(I.bytes[0][0]));
      }));
      onPress($('.scrim86'), closeOv);

      drawCur(); buildFlow(); show(S.idx, false);
    }};
  };
})();
