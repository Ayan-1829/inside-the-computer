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
  /* animation speed is a single 0-100 slider (0 = instant, 100 = slowest),
     not a handful of fixed presets -- SPEED_MIN/MAX set the ends of that
     range, and "slow" is now a lot slower than the old fixed preset was */
  const SPEED_MIN = 300, SPEED_MAX = 3400;
  const speedMs = v => v <= 0 ? 0 : Math.round(SPEED_MIN + (v/100)*(SPEED_MAX - SPEED_MIN));
  const speedLabel = v => v <= 0 ? 'Instant' : v < 25 ? 'Fast' : v < 60 ? 'Normal' : v < 90 ? 'Slow' : 'Slowest';
  const MAXINS = 22;                       /* instructions planned ahead */
  const hx = (v, n) => I8086.hex(v, n);
  const h2 = v => hx(v & 255, 2), h4 = v => hx(v & 0xFFFF, 4), h5 = v => hx(v & 0xFFFFF, 5);
  const SHORTROLE = {'interrupt number':'int no.','address low':'addr lo','address high':'addr hi','displacement low':'disp lo','displacement high':'disp hi','displacement':'disp','jump offset':'jump','offset low':'off lo','offset high':'off hi','data low':'data lo','data high':'data hi'};
  const role = r => SHORTROLE[r] || r;
  const DESC = {};
  for (const g of GROUP_IDS) for (const row of INSTR[g]) row[0].split(/\s*[\/,]\s*/).forEach(m => DESC[m.trim()] = row[1]);

  /* ---------- the programs offered first ---------- */
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
    {n:'Use the stack', d:'PUSH and POP move SP and write into the stack segment. The stack fills downward, toward lower addresses, from a high starting point.',
     s:"      MOV AX, 1234h\n      PUSH AX\n      MOV AX, 0\n      POP BX\n      HLT"},
    {n:'Copy a byte through memory', d:'SI holds the offset, so the adder works on DS and SI.',
     s:"src DB 41h\ndst DB 00h\n\n    MOV SI, OFFSET src\n    MOV AL, [SI]\n    MOV [dst], AL\n    HLT"},
    {n:'Print with DOS', d:'INT 21h hands the string to the operating system, which prints it.',
     s:"msg DB 'Hello$'\n\n    MOV DX, OFFSET msg\n    MOV AH, 09h\n    INT 21h\n    HLT"},
    {n:'A stack frame with BP', d:'BP addresses the stack directly, without moving SP — the same trick every compiler uses for local variables.',
     s:"      MOV AX, 1234h\n      PUSH AX\n      MOV BP, SP\n      MOV BX, [BP]\n      HLT"},
    {n:'Copy a string with MOVSB', d:'MOVSB moves SI and DI together, one byte at a time, using DS:SI and ES:DI.',
     s:"src DB 'AB'\ndst DB '  '\n\n    MOV SI, OFFSET src\n    MOV DI, OFFSET dst\n    MOVSB\n    MOVSB\n    HLT"},
    {n:'Shift, rotate and the flags', d:'SHR and ROL both move bits through the carry flag, but only ROL keeps every bit that leaves.',
     s:"      MOV AL, 0F0h\n      SHR AL, 1\n      ROL AL, 1\n      HLT"},
    {n:'Call a subroutine', d:'CALL pushes the return address just like PUSH would, and RET pops it back into IP.',
     s:"      MOV AX, 5\n      CALL double\n      HLT\ndouble:\n      ADD AX, AX\n      RET"},
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
  /* "enlarge the middle CPU" -- every chip coordinate below is scaled up
     from the chip's own top-left corner (which stays put, so the gap
     already tuned to the left column doesn't need retuning), and every
     width/height/margin scales the same way, so the diagram grows as a
     whole rather than just its outer box. */
  const CHIP_OX = 420, CHIP_OY = 56, CHIP_SCALE = 1.18;
  const cx = v => CHIP_OX + (v - CHIP_OX)*CHIP_SCALE;
  const cy = v => CHIP_OY + (v - CHIP_OY)*CHIP_SCALE;
  const sc = v => v*CHIP_SCALE;
  const CHIP = {x:CHIP_OX, y:CHIP_OY, w:sc(480), h:sc(800)};
  const BIU  = {x:cx(434), y:cy(72), w:sc(452), h:sc(318)};
  const EU   = {x:cx(434), y:cy(404), w:sc(452), h:sc(444)};
  const MEMIF = {x:cx(676), y:cy(126), w:sc(190), h:sc(30)};
  const SUM  = {t:cy(148), b:cy(194), l:cx(446), r:cx(622)};
  const SEG  = {x:cx(446), y:cy(244), w:sc(176), h:sc(25), dy:sc(27)};
  const QUE  = {x:cx(676), y:cy(202), w:sc(190), h:sc(25), dy:sc(28)};
  const CU   = {x:cx(656), y:cy(440), w:sc(220), h:sc(46)};
  /* the internal bus sits below the control unit, not overlapping it --
     derived from CU's own bottom edge (with a fixed margin) rather than a
     separate hand-picked number, so the two can never drift back into each
     other if CU is ever resized or the chip scale changes again. This was
     also, before this fix, the one coordinate in the whole chip still using
     the x-scale helper (cx) on what is really a y-position -- a leftover
     bug from the chip-enlarging pass that put the line well above where it
     belonged. */
  const IBUS = CU.y + CU.h + sc(24);
  const REG  = {x:cx(446), y:cy(538), w:sc(182), h:sc(24), dy:sc(26)};
  const ALU  = {t:cy(560), b:cy(648), l:cx(656), r:cx(876), bl:cx(680), br:cx(852)};
  const OPB  = {x:cx(656), y:cy(676), w:sc(220), h:sc(40)};
  const FLG  = {x:cx(656), y:cy(788), w:sc(220), h:sc(40), dx:sc(24.4), cw:sc(23)};
  const OUT  = {x:cx(446), y:cy(762), w:sc(182), h:sc(76)};
  const BUSX = {addr:cx(946), data:cx(981), ctrl:cx(1016)};
  const BUS_KEY_X0 = cx(904), BUS_KEY_X1 = cx(934), BUS_KEY_Y = cy(788), BUS_KEY_DY = sc(24);
  /* the coloured trunk lines used to run almost all the way down to the
     legend's own same-coloured swatches, just below them -- close enough
     that the line read as running straight into the legend rather than
     stopping clear of it. They now stop a fixed margin above the legend,
     however that legend is positioned, instead of at a fixed y of their own. */
  const BUS_LINE_TOP = cy(104), BUS_LINE_BOT = BUS_KEY_Y - sc(70);
  /* the RAM column shows all four segments as four boxed HTML lists: CS
     above DS, both at the same left edge (so a data access lands at the
     same x the code fetch already uses -- one entry point into RAM, not
     two), and SS above ES in a second column to their right. Each box is a
     real scrollable list (a foreignObject, not fixed SVG rows), showing
     every row this program's run has actually touched -- however many
     that is -- rather than a fixed window; past MAX_ROWS it just scrolls,
     the same way the flow list on the left already does. Since a row's
     on-screen position now depends on where the box happens to be
     scrolled to, the travelling dot's destination is the box itself (a
     single fixed point), not a specific row -- the row that matters is
     found by highlighting and scrolling to it, the same way the flow list
     points at the current step without a dot of its own. */
  const ROW_H = 34;                            /* one row's height, in the bigger, easier-to-read type */
  const MAX_ROWS = 6;                          /* rows visible before a box scrolls */
  const BOX_HEAD_H = 60;                       /* the label + column-header strip inside a box */
  const BOX_H = BOX_HEAD_H + MAX_ROWS*ROW_H;
  /* one gap, used everywhere: the RAM panel's own left/right/top/bottom
     margin around the four boxes, and the gap between them (both the two
     stacked rows and the two side-by-side columns) -- previously the left
     margin (14) and the gap between the CS/SS column and the DS/ES column
     (44) were quite different sizes, which read as CS/DS sitting jammed
     against the panel's edge while a much bigger gap opened up next to them */
  const BOX_PAD = 24;
  const RAM  = {x:Math.round(BUSX.ctrl + 54), y:56, w:0, h:0};  /* w/h finalised below, once every box is placed */
  const COD  = {x:RAM.x + BOX_PAD, y:RAM.y + BOX_PAD, w:460, h:BOX_H};
  const DAT  = {x:COD.x, y:COD.y + COD.h + BOX_PAD, w:COD.w, h:BOX_H};
  const RCOL_X = COD.x + Math.max(COD.w, DAT.w) + BOX_PAD;
  const SSW  = {x:RCOL_X, y:COD.y, w:300, h:BOX_H};
  const ESW  = {x:RCOL_X, y:DAT.y, w:300, h:BOX_H};
  RAM.w = Math.max(DAT.x + DAT.w, ESW.x + ESW.w) - RAM.x + BOX_PAD;
  RAM.h = Math.max(DAT.y + DAT.h, ESW.y + ESW.h) - RAM.y + BOX_PAD;
  /* sized for what actually gets drawn inside it: a title, up to 6 wrapped
     description lines, a rule, and up to 3 wrapped formula lines */
  const NOTE = {x:RAM.x, y:RAM.y + RAM.h + 20, w:RAM.w, h:312};
  const VB = [RAM.x + RAM.w + 16, NOTE.y + NOTE.h + 20];
  /* the left column (examples, flow, buttons) is widened to close most of
     the gap to the chip, and stretched (via the flow list's own height,
     which just shows more before it needs to scroll) so its bottom lands
     level with the RAM+description column's bottom instead of well short of it */
  const LCOLW = 350;
  const LCOLW_EXTRA = Math.max(0, (NOTE.y + NOTE.h) - (846 + 40));

  /* the one fixed point a store/read/fetch dot travels to for a given box,
     since an individual row no longer has a fixed position of its own --
     it scrolls freely within the box, which is what the dot really finds */
  const boxAnchor = G => G.y + G.h/2;
  const queY  = i => QUE.y + i*QUE.dy + 12.5;
  const segY  = i => SEG.y + i*SEG.dy + 12.5;

  /* ---------- the paths the travelling dot follows ---------- */
  /* ADRY routes the address-bus spur above the "Memory interface" pill, and DJY
     sits under the queue's bottom slot ("1") and above the control unit, so the
     data-bus spur into the chip's internal wiring never crosses a label */
  const ADRY = MEMIF.y - sc(16), DJY = QUE.y + 6*QUE.dy + sc(16);
  const P_SEG2SUM = [[cx(606), SEG.y], [cx(606), SUM.b]];
  /* every box's data/address/control wiring meets the bus at that box's own
     left edge -- CS and DS share one edge (RAM.x), SS and ES share another
     (RCOL_X) further right, so a store's dot always finishes inside the
     box it actually wrote to, not off to the side of it */
  const pAddr  = (y, x = RAM.x) => [[cx(592), SUM.t], [cx(592), ADRY], [BUSX.addr, ADRY], [BUSX.addr, y], [x, y]];
  const pCtrl  = (y, x = RAM.x) => [[CU.x + CU.w, cy(463)], [BUSX.ctrl, cy(463)], [BUSX.ctrl, y], [x, y]];
  const pData2Q = i => [[RAM.x, boxAnchor(COD)], [BUSX.data, boxAnchor(COD)], [BUSX.data, DJY], [cx(876), DJY], [cx(876), queY(i)], [cx(866), queY(i)]];
  const pData2EU = (y, x = RAM.x) => [[x, y], [BUSX.data, y], [BUSX.data, DJY], [cx(648), DJY], [cx(648), IBUS], [cx(700), IBUS], [cx(700), ALU.t]];
  /* Every path that touches "the register file" used to land on one fixed
     point (AX's row) no matter which register the instruction actually
     used. regRowY looks up the real row -- AL/AH etc. count as their
     16-bit parent, since they share the same row -- so the dot always
     travels to the register that's really changing. */
  const REG_ROW = {}; GP.forEach((r, i) => REG_ROW[r] = i); PT.forEach((r, i) => REG_ROW[r] = i + 4);
  const regRowY = r => REG.y + (REG_ROW[String(r).replace(/^([A-D])[HL]$/, '$1X')] || 0) * REG.dy;
  const pData2Reg = (y, r, x = RAM.x) => [[x, y], [BUSX.data, y], [BUSX.data, DJY], [cx(648), DJY], [cx(648), IBUS], [cx(534), IBUS], [cx(534), regRowY(r)]];
  const pDataOut = (y, r, x = RAM.x) => [[cx(534), regRowY(r)], [cx(534), IBUS], [cx(648), IBUS], [cx(648), DJY], [BUSX.data, DJY], [BUSX.data, y], [x, y]];
  const P_Q2CU  = [[cx(786), QUE.y + 5*QUE.dy + QUE.h], [cx(786), CU.y]];
  const P_EA    = [[cx(786), CU.y + CU.h], [cx(786), IBUS], [cx(648), IBUS], [cx(648), cy(226)], [cx(598), cy(226)], [cx(598), SUM.b]];
  const pReg2ALU = r => [[cx(534), regRowY(r)], [cx(534), IBUS], [cx(840), IBUS], [cx(840), ALU.t]];
  /* the operands already arrived at the ALU's top edge (pReg2ALU); execute shows
     the computed result leaving from the ALU's bottom/output point into Result */
  const P_ALU   = [[cx(770), ALU.b], [cx(770), OPB.y]];
  const pWB     = r => [[ALU.br, ALU.b - sc(20)], [cx(884), ALU.b - sc(20)], [cx(884), IBUS], [cx(534), IBUS], [cx(534), regRowY(r)]];
  /* a plain (non-ALU) move: the value is already on the internal bus by the
     time this step plays, so it travels in from there, not backwards out of
     the ALU like an arithmetic write-back does */
  const pToReg  = r => [[cx(648), IBUS], [cx(534), IBUS], [cx(534), regRowY(r)]];
  const P_OUT   = [[cx(700), OPB.y + OPB.h], [cx(700), cy(754)], [cx(540), cy(754)], [cx(540), OUT.y]];
  const P_IPNEW = [[cx(534), segY(4)], [cx(534), cy(448)], [cx(700), cy(448)], [cx(700), QUE.y + 3*QUE.dy]];

  /* ==========================================================
     planning the whole run before it is shown
     ========================================================== */
  /* every segment gets its own snapshot of its *whole* 64 KB, not just its
     first 64 bytes -- the stack starts at SP = 0100h and grows downward
     from there, nowhere near offset 0, so a small window anchored at the
     segment's start could never scroll far enough to show a single PUSH
     or POP. .slice() makes a real, independent copy (unlike .subarray(),
     a view that would silently follow every later write), so a step
     always shows memory exactly as it stood at that point in the run. */
  function snapOf(cpu, dsB, ssB, esB){
    return {r:{...cpu.r}, s:{...cpu.s}, ip:cpu.ip, flags:cpu.flags, out:cpu.out,
            dmem:cpu.mem.slice(dsB, dsB + 0x10000),
            smem:cpu.mem.slice(ssB, ssB + 0x10000),
            emem:cpu.mem.slice(esB, esB + 0x10000)};
  }
  function buildStory(cpu){
    const prog = cpu.prog, ST = [];
    if (!prog) return ST;
    let q = [], first = true, flushed = false, n = 0, capped = false;

    while (!cpu.halted && n < MAXINS){
      const k = prog.at[cpu.ip];
      if (k === undefined) break;
      const ins = prog.ins[k];
      /* every segment can move mid-program (LDS/LES/MOV to a segment register),
         so the base of each 64-byte display window is recomputed each step */
      const dsB = cpu.phys(cpu.s.DS, 0), ssB = cpu.phys(cpu.s.SS, 0), esB = cpu.phys(cpu.s.ES, 0);
      const before = snapOf(cpu, dsB, ssB, esB);
      const cs = cpu.s.CS, at = ins.addr, pa = (cs << 4) + at;
      const bytes = ins.bytes.map(b => b[0]), hexb = bytes.map(h2).join(' ');
      const full = ins.text.trim(), cu = full.length > 20 ? full.slice(0, 19) + '…' : full;
      const mkpa = (sn, sv, on, ov) => ({sn, sv, on, ov});
      const base = {ins, insIdx: n, snap: before, pa: mkpa('CS', cs, 'IP', at), q: q.slice(0, 6)};
      const put = o => ST.push(Object.assign({qtake:0, cu:'', alu:'', hi:{}}, base, o));

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
        bus:'addr', path:pAddr(boxAnchor(COD)), label:h5(pa), hi:{memif:true, sum:true, code:[k]}, rowBox:'CS', rowKey:k, rowEnd:'end'});

      /* 3 — the control bus says "read" */
      if (first || flushed) put({title:'Control bus · memory read',
        desc:'The control unit asserts the memory-read signal. Address and control are now both valid, so RAM drives the bytes it holds onto the data bus.',
        formula:'MEMR asserted',
        bus:'ctrl', path:pCtrl(boxAnchor(COD)), label:'MEMR', hi:{cu:true, code:[k]}, rowBox:'CS', rowKey:k, rowEnd:'end'});

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
        bus:'data', path:pData2Q(5), label:hexb, hi:{code:[k], queue:ins.size, memif:true}, rowBox:'CS', rowKey:k, rowEnd:'start'});
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
      const after = snapOf(cpu, cpu.phys(cpu.s.DS, 0), cpu.phys(cpu.s.SS, 0), cpu.phys(cpu.s.ES, 0));
      const rd = [...cpu.reads].sort((a, b) => a - b);
      const wr = [...cpu.written].sort((a, b) => a - b);
      const memOp = (ins.ops || []).find(o => o && o.t === 'm');
      /* which segment a memory access really belongs to: an explicit override
         (memOp.seg) wins; failing that, anything the stack instructions touch
         is SS, a string instruction's destination is ES, and everything else
         defaults to DS -- the same rule the real BIU applies */
      const stackMn = /^(PUSH|POP|CALL|RET|INT|IRET|PUSHF|POPF)/.test(ins.mn);
      const rdSeg = memOp ? memOp.seg : stackMn ? 'SS' : 'DS';
      const wrSeg = memOp ? memOp.seg : stackMn ? 'SS' : /^(MOVS|STOS)/.test(ins.mn) ? 'ES' : 'DS';
      const SEGWIN = {DS:{base:dsB, x:DAT.x, box:DAT}, SS:{base:ssB, x:SSW.x, box:SSW}, ES:{base:esB, x:ESW.x, box:ESW}};
      const segOffsets = (addrs, sname) => { const b = SEGWIN[sname].base; return addrs.filter(a => a >= b && a < b + 0x10000).map(a => a - b); };
      const segX  = sname => SEGWIN[sname].x;
      const segBoxY = sname => boxAnchor(SEGWIN[sname].box);
      const rdOff = segOffsets(rd, rdSeg);
      const wrOff = segOffsets(wr, wrSeg);
      const regs = res.changed.filter(r => GP.includes(r) || PT.includes(r));
      const aluIns = /^(ADD|ADC|SUB|SBB|CMP|INC|DEC|NEG|MUL|IMUL|DIV|IDIV|AND|OR|XOR|NOT|TEST|SHL|SAL|SHR|SAR|ROL|ROR|RCL|RCR|CBW|CWD|LOOP)$/.test(ins.mn);
      /* whichever register this instruction actually names (its one register
         operand, whether that's the source or the destination) -- this is
         what every register-file path below should point at, not always AX */
      const regOpN = (ins.ops || []).find(o => o && o.t === 'r');
      const opReg = regOpN ? regOpN.name.replace(/^([A-D])[HL]$/, '$1X') : (regs[0] || 'AX');
      /* a plain (non-ALU) read straight into a register -- MOV reg,[mem],
         POP, LODS -- already animates its own dot all the way to that
         register's row as part of the read itself (see pData2Reg below), so
         it must not *also* get a second, redundant write-back dot: that
         was the "data reaches BX twice" bug in POP, since POP changes both
         the destination register and SP, and the destination register was
         being delivered once by the read and then again by its own
         write-back step. An ALU instruction still needs the write-back --
         its read only goes as far as the ALU, not the register. */
      const deliveredReg = (!aluIns && rd.length && rdOff.length) ? opReg : null;
      q = q.slice(ins.size);
      const rest = {snap:mid, q:q.slice(), cu};

      /* a snapshot that reveals only what has actually been delivered by a
         dot so far this instruction -- everything else `after` changed
         (flags, other registers, memory) is real and correct, but every
         register named in heldRegs and every address named in heldMem is
         held back at its `before` value until the step whose own dot
         carries it arrives. Used below by the read (for a plain register
         load), ALU-execute, write-back and store steps, which each
         deliver a little more of `after` than the last -- so nothing
         already shows a value nothing has carried there yet. */
      const withheld = (heldRegs, heldMem) => {
        const patchMem = (key, base) => { const cur = after[key], was = before[key]; let copy = null;
          heldMem.forEach(a => { const o = a - base; if (o >= 0 && o < cur.length && cur[o] !== was[o]){ if (!copy) copy = cur.slice(); copy[o] = was[o]; } });
          return copy || cur; };
        const r = Object.assign({}, after.r);
        heldRegs.forEach(rr => { r[rr] = before.r[rr]; });
        return Object.assign({}, after, {r, dmem:patchMem('dmem', dsB), smem:patchMem('smem', ssB), emem:patchMem('emem', esB)});
      };

      /* 6 — an operand read */
      if (rd.length && rdOff.length){
        const sname = rdSeg, sval = before.s[sname];
        const off = rd[0] - (sval << 4);
        const P = mkpa(sname, sval, 'EA', off);
        put(Object.assign({}, rest, {pa:P,
          title:'BIU · effective address → physical address',
          desc: sname === 'SS' && stackMn
            ? 'A pop reads before it moves anything: SP still points at the value being taken off the stack, at the lowest address currently in use. Only after the read does SP move back up, to a higher address, since the stack empties upward as it shrinks.'
            : `This is a data access, so the same adder pairs the effective address with ${sname} instead of CS. One adder, a different segment register.`,
          formula:`PA = ${sname}×10h + EA = ${h5(sval << 4)} + ${h4(off)} = ${h5(rd[0])}h`,
          bus:'addr', path:P_EA, label:h4(off), hi:{seg:[sname], sum:true}}));
        put(Object.assign({}, rest, {pa:P,
          title:'Address bus · operand address out',
          desc:`The data address goes out on the address bus and picks the operand out of the ${sname === 'SS' ? 'stack' : sname === 'ES' ? 'extra' : 'data'} segment.`,
          formula:`address bus ← ${h5(rd[0])}h`,
          bus:'addr', path:pAddr(segBoxY(sname), segX(sname)), label:h5(rd[0]), hi:{memif:true, sum:true, [sname.toLowerCase()]:rdOff}, rowBox:sname, rowKey:rdOff[0], rowEnd:'end'}));
        put(Object.assign({}, rest, {pa:P,
          title:'Control bus · memory read',
          desc:'MEMR again, this time for data rather than for code. RAM cannot tell the difference: it simply drives the addressed bytes onto the data bus.',
          formula:'MEMR asserted',
          bus:'ctrl', path:pCtrl(segBoxY(sname), segX(sname)), label:'MEMR', hi:{cu:true, [sname.toLowerCase()]:rdOff}, rowBox:sname, rowKey:rdOff[0], rowEnd:'end'}));
        const val = rd.map(a => h2(cpu.mem[a])).join(' ');
        /* a plain (non-ALU) load's own dot already travels all the way into
           the destination register -- see deliveredReg above -- so this is
           the one step that actually commits that register's new value;
           an ALU instruction's read only reaches the ALU, so the register
           file stays untouched here and waits for its own write-back step */
        put(Object.assign({}, rest, {pa:P, alu:aluIns ? 'operand' : '',
          snap: deliveredReg ? withheld(regs.filter(r => r !== deliveredReg), wr) : mid,
          title:'Data bus · operand into the EU',
          desc:'The bytes return on the data bus, cross the memory interface and run down the internal bus into the execution unit.',
          formula:`operand ← ${val}`,
          bus:'data', path:aluIns ? pData2EU(segBoxY(sname), segX(sname)) : pData2Reg(segBoxY(sname), opReg, segX(sname)), label:val,
          hi:{[sname.toLowerCase()]:rdOff, memif:true, alu:aluIns, regs:deliveredReg ? [deliveredReg] : undefined},
          rowBox:sname, rowKey:rdOff[0], rowEnd:'start'}));
      }

      /* 7 — the ALU */
      if (aluIns){
        put(Object.assign({}, rest, {alu:ins.mn,
          title:'Register file → ALU',
          desc:'The other operand comes out of the register file over the internal bus. Both ALU inputs are now latched.',
          formula:`${ins.mn} inputs ready`,
          path:pReg2ALU(opReg), label:ins.mn,
          hi:{alu:true, regs:(ins.ops || []).filter(o => o && o.t === 'r').map(o => o.name.replace(/^([A-D])[HL]$/, '$1X'))}}));
        put(Object.assign({}, rest, {snap:withheld(regs, wr), alu:ins.mn,
          title:'ALU · execute',
          desc:`The ALU performs ${ins.mn}${res.flagsChanged.length ? ' and writes the flags it changed' : ', which leaves the flags alone'}.`,
          formula:`${full}${res.flagsChanged.length ? '  ·  flags ' + res.flagsChanged.join(' ') : ''}`,
          path:P_ALU, label:ins.mn, hi:{alu:true, flags:res.flagsChanged}}));
      }

      /* 8 — write back. Some instructions change more than one register at
         once (MUL leaves its product in DX:AX; XCHG swaps two outright) --
         these used to be announced together but only ever animated a single
         dot to the first one, while the second silently already showed its
         new value with nothing having visibly carried it there. Every
         changed register now gets its own dot and its own step, and a
         register whose turn hasn't come up yet still shows its old value --
         and, since a store (if this instruction also has one) hasn't
         happened yet either, memory is still held back too here. */
      const wbRegs = regs.filter(r => r !== deliveredReg);
      wbRegs.forEach((r, i) => {
        put(Object.assign({}, rest, {snap:withheld(wbRegs.slice(i + 1), wr), alu:aluIns ? ins.mn : '',
          title:'Write back to the register file',
          desc:`The result travels back along the internal bus into ${r}.`,
          formula:`${r} = ${h4(after.r[r])}h`,
          path:aluIns ? pWB(r) : pToReg(r), label:h4(after.r[r]), hi:{regs:[r]}}));
      });

      /* 9 — a store */
      if (wr.length && wrOff.length){
        const sname = wrSeg, sval = before.s[sname];
        const off = wr[0] - (sval << 4);
        const P = mkpa(sname, sval, 'EA', off);
        const wReg = stackMn ? 'SP' : opReg;
        /* the address and control steps only point at where the store will
           land -- the data hasn't travelled there yet, so the byte shown at
           that row must still be its *old* value. Only the third step (the
           one whose dot actually carries the data across) may show the new
           one. Every register write-back has already happened by now, so
           only memory is still held back here. */
        put(Object.assign({}, rest, {snap:withheld([], wr), pa:P,
          title:'BIU · address for the store',
          desc:'The destination offset is added to the shifted segment to give the physical address the write will use.',
          formula:`PA = ${sname}×10h + EA = ${h5(sval << 4)} + ${h4(off)} = ${h5(wr[0])}h`,
          bus:'addr', path:pAddr(segBoxY(sname), segX(sname)), label:h5(wr[0]), hi:{seg:[sname], sum:true, memif:true}, rowBox:sname, rowKey:wrOff[0], rowEnd:'end'}));
        put(Object.assign({}, rest, {snap:withheld([], wr), pa:P,
          title:'Control bus · memory write',
          desc:'For a store the control unit asserts memory-write instead, telling RAM to latch whatever appears on the data bus at the addressed place.',
          formula:'MEMW asserted',
          bus:'ctrl', path:pCtrl(segBoxY(sname), segX(sname)), label:'MEMW', hi:{cu:true, [sname.toLowerCase()]:wrOff}, rowBox:sname, rowKey:wrOff[0], rowEnd:'end'}));
        put(Object.assign({}, rest, {snap:after, pa:P,
          title: sname === 'SS' ? 'Data bus · out to the stack' : 'Data bus · out to memory',
          desc: sname === 'SS'
            ? 'A push moves SP first: down by two, to a lower address than anything already on the stack, since the stack fills downward from a high starting point. Only once SP has moved does the value get written, at the new, lower address it now points to.'
            : 'Now the data bus carries information outward. The bytes leave the register file, cross the memory interface and are written into RAM, low byte first.',
          formula:wr.map(a => `[${h5(a)}] ← ${h2(cpu.mem[a])}h`).join('  ·  '),
          bus:'data', path:pDataOut(segBoxY(sname), wReg, segX(sname)), label:wr.map(a => h2(cpu.mem[a])).join(' '),
          hi:{[sname.toLowerCase()]:wrOff, memif:true, regs:stackMn ? ['SP'] : undefined},
          rowBox:sname, rowKey:wrOff[0], rowEnd:'end'}));
      } else if (wr.length){                                   /* a write this simulator's 64-byte
        display windows don't currently cover (e.g. a far segment jump/return target) --
        keep the run narratable without pretending it landed in a visible row */
        put(Object.assign({}, rest, {snap:after,
          title:'Data bus · out to memory',
          desc:'The value is written to memory outside the windows shown here.',
          formula:wr.map(a => `[${h5(a)}] ← ${h2(cpu.mem[a])}h`).join('  ·  '),
          bus:'data', path:pDataOut(boxAnchor(SSW), 'SP', SSW.x), label:h4(after.r.SP),
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
    ST.push({ins:null, insIdx:n, snap:snapOf(cpu, cpu.phys(cpu.s.DS, 0), cpu.phys(cpu.s.SS, 0), cpu.phys(cpu.s.ES, 0)), q:[], qtake:0, cu:'', alu:'', hi:{},
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
      SIM.x86 = {speed:40, idx:0};
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
       just clear of the chip column (LCOLW is sized to close most of that gap
       without crowding it), and shaded a touch darker (below) since it is the
       UI around the simulation, not the processor itself. Its bottom is
       stretched to land level with the RAM+description column's own bottom
       (see NOTE below), instead of stopping well short of it. ---------- */
    s += T(30, 40, 'Example program', 'ttl');
    s += `<foreignObject x="30" y="52" width="${LCOLW}" height="64"><div xmlns="http://www.w3.org/1999/xhtml" class="x86-cur" data-excur tabindex="0" role="button" aria-haspopup="listbox" aria-label="Choose an example program"></div></foreignObject>`;
    s += T(30, 148, 'Flow of this program', 'ttl') + T(30 + LCOLW, 148, '', 'lab t-end', 'data-txt="count"');
    s += `<foreignObject x="30" y="160" width="${LCOLW}" height="${LCOLW_EXTRA + 488}"><div xmlns="http://www.w3.org/1999/xhtml" class="x86-flow" data-flow=""></div></foreignObject>`;
    const LY = y => y + LCOLW_EXTRA;
    s += btnS(30, LY(664), 111, 40, 'Play', 'data-a="play" aria-label="Play the whole flow"');
    s += btnS(149, LY(664), 111, 40, 'Step', 'data-a="step" aria-label="Show the next move"');
    s += btnS(268, LY(664), 112, 40, 'Reset', 'data-a="reset" aria-label="Go back to the first move"');
    s += T(30, LY(736), 'Animation speed', 'lab') + T(30 + LCOLW, LY(736), '', 'lab t-end', 'data-txt="speedlab"');
    s += `<foreignObject x="30" y="${LY(744)}" width="${LCOLW}" height="34"><div xmlns="http://www.w3.org/1999/xhtml" class="x86-speed"><input type="range" min="0" max="100" step="1" data-speed aria-label="Animation speed, 0 is instant and 100 is slowest"></div></foreignObject>`;
    s += btnS(30, LY(798), 171, 40, 'Instruction set', 'data-a="ops" aria-label="Open the opcode reference" style="font-size:17px"');
    s += btnS(209, LY(798), 171, 40, 'Write your own', 'data-a="edit" aria-label="Write your own program" style="font-size:17px"');
    s += btnS(30, LY(846), LCOLW, 40, 'Segments & memory', 'data-a="segs" aria-label="Open the segment register and memory map reference" style="font-size:17px"');

    /* ---------- 2. the chip ---------- */
    s += T(CHIP.x, 44, 'Intel 8086', 'ttl') + lbl(CHIP.x + 155, 44, 'inside the chip');
    s += R(CHIP.x, CHIP.y, CHIP.w, CHIP.h, 18, 'm-panel');
    s += R(BIU.x, BIU.y, BIU.w, BIU.h, 14, 'band-biu');
    s += T(BIU.x + sc(12), cy(96), 'BIU', 'ttl biu-t') + lbl(BIU.x + sc(62), cy(96), 'Bus interface unit');
    s += R(EU.x, EU.y, EU.w, EU.h, 14, 'band-eu');
    s += T(EU.x + sc(12), cy(428), 'EU', 'ttl eu-t') + lbl(EU.x + sc(54), cy(428), 'Execution unit');

    s += R(MEMIF.x, MEMIF.y, MEMIF.w, MEMIF.h, 15, 'm-acc-soft', 'data-act="memif"');
    s += T(MEMIF.x + MEMIF.w/2, MEMIF.y + sc(20), 'Memory interface', 'sn t-mid');

    s += lbl(SUM.l, SUM.t - sc(8), 'Address adder');
    s += P(`M${SUM.l} ${SUM.b}H${SUM.r}L${SUM.r - sc(24)} ${SUM.t}H${SUM.l + sc(24)}Z`, 'm-acc-soft', 'data-act="sum"');
    s += T(SUM.l + sc(38), SUM.b - sc(15), 'Σ', 'sig t-mid');
    s += T(SUM.l + sc(118), SUM.b - sc(16), '—', 'val t-mid', 'data-txt="sum"');

    s += lbl(SEG.x, cy(236), 'Segment registers');
    SEGR.forEach((r, i) => { const y = SEG.y + i*SEG.dy;
      s += `<g data-seg="${r}">${R(SEG.x, y, SEG.w, SEG.h, 5, 'm-block')}${T(SEG.x + sc(10), y + sc(17), r, 'sn')}${T(SEG.x + SEG.w - sc(10), y + sc(17), '0000', 'val t-end', 'data-sv')}</g>`; });

    s += lbl(QUE.x, QUE.y - sc(4), 'Instruction queue');
    /* drawn top to bottom, but numbered 6 down to 1 — byte 1 (the one closest to
       decode) sits at the bottom, next to where the data bus feeds it in */
    for (let i = 0; i < 6; i++){ const y = QUE.y + i*QUE.dy;
      s += `<g class="qcell" data-q="${i}">${R(QUE.x, y, QUE.w, QUE.h, 5, '')}${T(QUE.x + sc(10), y + sc(17), String(6 - i), 'lab')}` +
        `${T(QUE.x + sc(64), y + sc(17), '', 'val', 'data-qb')}${T(QUE.x + QUE.w - sc(10), y + sc(17), '', 'lab t-end', 'data-qr')}</g>`; }

    s += R(CU.x, CU.y, CU.w, CU.h, 8, 'm-block', 'data-act="cu"');
    s += T(CU.x + sc(12), CU.y + sc(19), 'Control unit', 'sn') + T(CU.x + sc(12), CU.y + sc(38), 'idle', 'val', 'data-txt="cu"');

    s += lbl(EU.x + sc(10), IBUS - sc(10), 'Internal data bus · 16 bits');
    s += `<path class="bus86" d="M${EU.x + sc(10)} ${IBUS}H${EU.x + EU.w - sc(4)}"/>`;

    s += T(REG.x + sc(64), cy(531), 'AH', 'lab t-mid') + T(REG.x + sc(144), cy(531), 'AL', 'lab t-mid');
    GP.forEach((r, i) => { const y = REG.y + i*REG.dy;
      s += `<g data-reg="${r}">${T(REG.x + sc(2), y + sc(17), r, 'sn')}${R(REG.x + sc(26), y, sc(76), REG.h, 4, 'm-block', 'data-half="H"')}${R(REG.x + sc(106), y, sc(76), REG.h, 4, 'm-block', 'data-half="L"')}` +
        `${T(REG.x + sc(96), y + sc(17), '00', 'val t-end', 'data-hv')}${T(REG.x + sc(176), y + sc(17), '00', 'val t-end', 'data-lv')}</g>`; });
    PT.forEach((r, i) => { const y = REG.y + (i + 4)*REG.dy;
      s += `<g data-reg="${r}">${T(REG.x + sc(2), y + sc(17), r, 'sn')}${R(REG.x + sc(26), y, sc(156), REG.h, 4, 'm-block')}${T(REG.x + sc(176), y + sc(17), '0000', 'val t-end', 'data-lv')}</g>`; });

    s += P(`M${ALU.l} ${ALU.t}H${ALU.r}L${ALU.br} ${ALU.b}H${ALU.bl}Z`, 'm-acc-soft alu86', 'data-act="alu"');
    s += T(cx(766), cy(594), 'Arithmetic', 'sn t-mid') + T(cx(766), cy(612), 'logic unit', 'sn t-mid');
    s += T(cx(766), cy(636), '—', 'val t-mid', 'data-txt="alu"');

    s += R(OPB.x, OPB.y, OPB.w, OPB.h, 8, 'm-block', 'data-act="opb"');
    s += T(OPB.x + sc(12), OPB.y + sc(25), 'Result', 'sn') + T(OPB.x + OPB.w - sc(12), OPB.y + sc(25), '—', 'val t-end', 'data-txt="res"');

    s += T(FLG.x + FLG.w, FLG.y - sc(8), 'Flags', 'lab t-end');
    FLAGS.forEach((f, i) => { const x = FLG.x + i*FLG.dx;
      s += `<g class="flag" data-flag="${f}"><title>${FLAG_NAME_X[f]} flag</title>${R(x, FLG.y, FLG.cw, FLG.h, 5, '')}` +
        `<text class="fn" x="${x + FLG.cw/2}" y="${FLG.y + sc(15)}">${f}</text><text class="fv" x="${x + FLG.cw/2}" y="${FLG.y + sc(33)}" data-fv>0</text></g>`; });

    s += R(OUT.x, OUT.y, OUT.w, OUT.h, 8, 'm-block');
    s += T(OUT.x + sc(10), OUT.y + sc(20), 'Output', 'sn') + T(OUT.x + OUT.w - sc(10), OUT.y + sc(20), 'INT 21h', 'lab t-end');
    s += `<foreignObject x="${OUT.x + sc(8)}" y="${OUT.y + sc(28)}" width="${OUT.w - sc(16)}" height="${sc(42)}"><div xmlns="http://www.w3.org/1999/xhtml" class="x86-outbox" data-out=""></div></foreignObject>`;

    /* wiring inside the chip */
    s += wire([[cx(606), SEG.y], [cx(606), SUM.b]], 'a');
    s += wire([[cx(592), SUM.t], [cx(592), ADRY], [BUSX.addr, ADRY]], 'a');
    /* memory interface's own data-bus tap stays at its own height, clear to the
       right of the queue box, instead of running down through it */
    s += wire([[MEMIF.x + MEMIF.w, MEMIF.y + MEMIF.h/2], [BUSX.data, MEMIF.y + MEMIF.h/2]], 'd');
    s += wire([[cx(648), DJY], [BUSX.data, DJY]], 'd');
    /* the spine runs up from below the queue and taps in at the bottom row —
       byte 1's slot — right where the data bus now meets the internal wiring */
    s += wire([[cx(876), DJY], [cx(876), queY(5)]], 'd');
    s += wire([[cx(876), queY(5)], [cx(866), queY(5)]], 'd t');
    s += wire([[cx(648), DJY], [cx(648), IBUS]], 'd');
    s += wire([[cx(786), QUE.y + 5*QUE.dy + QUE.h], [cx(786), CU.y]], 'd');
    s += wire([[cx(786), CU.y + CU.h], [cx(786), IBUS]], 'd');
    s += wire([[cx(534), IBUS], [cx(534), REG.y]], 'd');
    s += wire([[cx(700), IBUS], [cx(700), ALU.t]], 'd') + wire([[cx(840), IBUS], [cx(840), ALU.t]], 'd');
    s += wire([[cx(770), ALU.b], [cx(770), OPB.y]], 'd');
    s += wire([[ALU.br, ALU.b - sc(20)], [cx(884), ALU.b - sc(20)], [cx(884), IBUS]], 'd');
    s += wire([[cx(700), OPB.y + OPB.h], [cx(700), cy(754)], [cx(540), cy(754)], [cx(540), OUT.y]], 'd');
    s += wire([[CU.x + CU.w, cy(463)], [BUSX.ctrl, cy(463)]], 'c');

    /* ---------- 3. the three buses ---------- */
    [['addr','Address bus','20 lines, one way: the 8086 says which byte it wants'],
     ['data','Data bus','16 lines, both ways: the bytes themselves'],
     ['ctrl','Control bus','read or write, memory or I/O, and the other timing signals']].forEach(([k, name, what], i) => {
      s += `<g class="busline" data-bus="${k}" tabindex="0" role="img" aria-label="${name}: ${what}"><title>${name} — ${what}</title>` +
        `<rect class="bus-hit" x="${BUSX[k] - 16}" y="${BUS_LINE_TOP - sc(4)}" width="32" height="${BUS_LINE_BOT - BUS_LINE_TOP + sc(8)}"/>` +
        `<path class="bus-line b-${k}" d="M${BUSX[k]} ${BUS_LINE_TOP}V${BUS_LINE_BOT}"/></g>`;
      const y = BUS_KEY_Y + i*BUS_KEY_DY;
      /* the label is right-aligned to a fixed stop short of RAM.x, not left-aligned
         after the tick -- so "Address bus"/"Control bus" never run into the RAM
         panel regardless of how tight that gap is tuned or how long the name is */
      s += `<path class="bus-key b-${k}" d="M${BUS_KEY_X0} ${y}H${BUS_KEY_X1}"/>` + T(RAM.x - 20, y + 5, name, 'lab t-end');
    });

    /* ---------- 4. RAM, the sum, and the story ---------- */
    /* four boxed segments: CS above DS at the panel's left edge (a data
       access then lands at the same x the code fetch already uses), SS
       above ES in a second, narrower column to their right. Each box is a
       real scrollable HTML list -- not fixed SVG rows -- showing every row
       this run has actually touched, however many that is; past MAX_ROWS
       it scrolls, exactly like the flow list on the left already does. */
    s += T(RAM.x, 44, 'RAM', 'ttl ram-t') + lbl(RAM.x + 62, 44, 'outside the chip');
    s += R(RAM.x, RAM.y, RAM.w, RAM.h, 14, 'm-panel ram-panel');
    const boxFrame = (G, cls) => R(G.x - 8, G.y - 8, G.w + 16, G.h + 16, 10, 'm-block seg-box ' + cls);
    const segBox = (G, seg, cls) => boxFrame(G, cls) +
      `<foreignObject x="${G.x}" y="${G.y}" width="${G.w}" height="${G.h}"><div xmlns="http://www.w3.org/1999/xhtml" class="x86-segbox" data-segbox="${seg}"></div></foreignObject>`;

    s += segBox(COD, 'CS', 'seg-cs');
    s += segBox(DAT, 'DS', 'seg-ds');
    s += segBox(SSW, 'SS', 'seg-ss');
    s += segBox(ESW, 'ES', 'seg-es');

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
      /* a segment box's rows now live in a scrollable HTML list, so a
         particular row no longer sits at one fixed, precomputed point the
         way it did before that box became scrollable -- it can be scrolled
         anywhere. To still land the dot on the exact row (not just
         somewhere in the box), the row named by a step's rowBox/rowKey is
         scrolled into view and its real, current on-screen position is
         read back and spliced onto that end of the path, right before the
         dot sets off -- the row list itself never changes shape once
         built, so the row is always there to find, even before this step
         has been drawn. */
      const svgRoot = grp.ownerSVGElement;
      const rowPoint = (box, key) => {
        const host = $(`[data-segbox="${box}"]`); if (!host || !svgRoot) return null;
        const row = box === 'CS' ? host.querySelector(`[data-ins="${key}"]`) : host.querySelector(`[data-off="${key}"]`);
        if (!row) return null;
        row.scrollIntoView({block:'nearest'});
        const r = row.getBoundingClientRect();
        if (!r.width && !r.height) return null;
        const pt = svgRoot.createSVGPoint(); pt.x = r.left; pt.y = r.top + r.height/2;
        const ctm = svgRoot.getScreenCTM(); if (!ctm) return null;
        const p = pt.matrixTransform(ctm.inverse());
        return [p.x, p.y];
      };
      const pathFor = st => {
        if (st.rowBox == null || st.rowKey == null) return st.path;
        const p = rowPoint(st.rowBox, st.rowKey);
        if (!p) return st.path;
        const path = st.path.slice();
        const i = st.rowEnd === 'start' ? 0 : path.length - 1;
        path[i] = [p[0], p[1]];
        return path;
      };
      const travel = (st, done) => {
        if (raf) cancelAnimationFrame(raf);
        const ms = speedMs(S.speed);
        if (!st || !st.path || !ms || REDUCED){ hideDot(); return done(); }
        const path = pathFor(st);
        const m = measure(path), dur = Math.max(340, m.L*1.5) * (ms/850);
        dot.setAttribute('class', 'flow-dot b-' + (st.bus || 'int'));
        track.setAttribute('class', 'flow-track b-' + (st.bus || 'int'));
        dotL.textContent = st.label || '';
        dot.setAttribute('opacity', '1'); dotL.setAttribute('opacity', '1'); track.setAttribute('opacity', '1');
        let t0 = null;
        const fr = ts => { if (t0 === null) t0 = ts;
          const f = Math.min(1, (ts - t0)/dur), q = at(path, m, f);
          dot.setAttribute('cx', q[0]); dot.setAttribute('cy', q[1]);
          track.setAttribute('d', 'M' + laid(path, m, f).map(p => p.join(' ')).join('L'));
          dotL.setAttribute('x', Math.max(40, Math.min(q[0], VB[0] - 46))); dotL.setAttribute('y', q[1] - 16);
          if (f < 1) raf = requestAnimationFrame(fr); else { hideDot(); done(); } };
        raf = requestAnimationFrame(fr);
      };

      /* ---------- drawing one move ---------- */
      /* every segment box is a real HTML list rebuilt on every draw -- not
         fixed SVG rows -- showing every row this run has actually touched
         (segTouchedRange, defined below with the rest of the overlay code),
         however many that is; past MAX_ROWS the box's own scrollbar takes
         over, and the currently highlighted row scrolls into view the same
         way the flow list on the left already does. Every value shown comes
         from this step's own snapshot when there is one, not from S.cpu
         (which, since the whole run is planned before it is ever shown, has
         already reached the *end* of the program) -- falling back to S.cpu
         only applies before any story exists at all. */
      const drawCode = st => {
        const p = S.cpu.prog, cur = st && st.ins ? st.ins.index : -1;
        const csv = st && st.snap ? st.snap.s.CS : S.cpu.s.CS;
        const lit = (st && st.hi.code) || [];
        let rows = '';
        if (p) p.ins.forEach((I, k) => {
          const at = I.text.trim(), mc = I.bytes.map(b => h2(b[0]));
          const cls = ['x86-crow', lit.includes(k) && 'lit', k === cur && 'cur', cur >= 0 && k < cur && 'done'].filter(Boolean).join(' ');
          rows += `<div class="${cls}" data-ins="${k}" tabindex="0" role="button" aria-label="Show how this instruction is encoded">` +
            `<span class="a">${h5((csv << 4) + I.addr)}</span><span class="t">${esc(at.length > 24 ? at.slice(0, 23) + '…' : at)}</span>` +
            `<span class="m">${esc(mc.length > 4 ? mc.slice(0, 4).join(' ') + ' …' : mc.join(' '))}</span></div>`;
        });
        const el = $('[data-segbox="CS"]');
        el.innerHTML = `<div class="x86-seghead"><b>Code segment</b><span>CS = ${h4(csv)}h</span></div>` +
          '<div class="x86-segcols"><span>address</span><span>assembly</span><span>machine code</span></div>' +
          `<div class="x86-segrows">${rows || '<p class="x86-segempty">No instructions to show.</p>'}</div>`;
        el.querySelectorAll('[data-ins]').forEach(g => onPress(g, () => { const I = p.ins[+g.dataset.ins]; if (I) openOps(OPKEY(I.bytes[0][0])); }));
        const cur86 = el.querySelector('.cur') || el.querySelector('.lit'); if (cur86) cur86.scrollIntoView({block:'nearest'});
      };
      const drawSeg = (seg, name, boxKey, memKey) => st => {
        const sv = st && st.snap ? st.snap.s[seg] : S.cpu.s[seg], base = S.cpu.phys(sv, 0);
        const mem = st && st.snap ? st.snap[memKey] : null;
        const lit = (st && st.hi[seg.toLowerCase()]) || [];
        const names = {};
        if (seg === 'DS'){ const p = S.cpu.prog; if (p) for (const k in p.data) names[p.data[k].off] = k.toLowerCase(); }
        const [lo, hi] = segTouchedRange(seg);
        let rows = '';
        for (let off = lo; off <= hi; off++){
          const v = (mem ? mem[off] : S.cpu.mem[base + off]) || 0;
          const nm = names[off] || '', nmShort = nm.length > 18 ? nm.slice(0, 17) + '…' : nm;
          rows += `<div class="x86-srow${lit.includes(off) ? ' lit' : ''}" data-off="${off}">` +
            `<span class="a">${h5(base + off)}</span><span class="v">${h2(v)}</span>${seg === 'DS' ? `<span class="n">${esc(nmShort)}</span>` : ''}</div>`;
        }
        const el = $(`[data-segbox="${seg}"]`);
        el.innerHTML = `<div class="x86-seghead"><b>${name}</b><span>${seg} = ${h4(sv)}h</span></div>` +
          `<div class="x86-segcols"><span>address</span><span>value</span>${seg === 'DS' ? '<span>name</span>' : ''}</div>` +
          `<div class="x86-segrows">${rows}</div>`;
        const litEl = el.querySelector('.lit'); if (litEl) litEl.scrollIntoView({block:'nearest'});
      };
      const drawData = drawSeg('DS', 'Data segment', 'DS', 'dmem');
      const drawSS = drawSeg('SS', 'Stack segment', 'SS', 'smem');
      const drawES = drawSeg('ES', 'Extra segment', 'ES', 'emem');
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
        drawCode(st); drawData(st); drawSS(st); drawES(st); drawChip(st); drawNote(st); markFlow();
        $('[data-a="play"]').querySelector('text').textContent = playing ? 'Pause' : 'Play';
        const speedEl = $('[data-speed]'); if (speedEl && speedEl.value != S.speed) speedEl.value = S.speed;
        txt('speedlab', speedLabel(S.speed));
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
        travel(S.story[S.idx], () => { draw(); if (playing) timer = setTimeout(advance, Math.max(110, speedMs(S.speed)*0.3) + ARRIVE_PAUSE); });
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
        ovb.innerHTML = `<div class="ovh"><h3>Choose an example</h3>${CLOSE_BTN}</div>` +
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
      /* the same cross-sign close button everywhere on the site (the details
         card, the overview dialog) uses, instead of a text "Close" that only
         these five overlays had */
      const CLOSE_BTN = '<button type="button" data-ovx aria-label="Close"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg></button>';
      const openOps = key => {
        ov.style.display = ''; grp.appendChild(ov);   /* repaint above the travelling dot/wire */
        ovb.innerHTML = `<div class="ovh"><h3>8086 opcode encoding</h3>${CLOSE_BTN}</div>` +
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
        ovb.innerHTML = `<div class="ovh"><h3>Write your own program</h3>${CLOSE_BTN}</div>` +
          `<textarea class="x86-ta" spellcheck="false" aria-label="Assembly program">${esc(S.src)}</textarea>` +
          '<div class="ovf"><button type="button" class="prim" data-ovrun>Assemble and load</button>' +
          '<span>8086 assembly: DB and DW data, labels, and every documented instruction.</span></div>';
        onPress(ovb.querySelector('[data-ovx]'), closeOv);
        onPress(ovb.querySelector('[data-ovrun]'), () => {
          const v = ovb.querySelector('.x86-ta').value;
          closeOv(); reload(v, 'Your program', 'own');
        });
      };
      const openSegs = () => {
        ov.style.display = ''; grp.appendChild(ov);   /* repaint above the travelling dot/wire */
        const ORDER = ['ES', 'SS', 'CS', 'DS'];
        const rows = ORDER.map(n => {
          const base = S.cpu.s[n] << 4, left = base / 0x100000 * 100, w = 0x10000 / 0x100000 * 100;
          return `<div class="x86-segtrack"><b>${n}</b><div class="x86-segrail"><span class="x86-segbar seg-${n.toLowerCase()}" style="left:${left}%;width:${w}%"></span></div><em>${h5(base)}h–${h5(base + 0xFFFF)}h</em></div>`;
        }).join('');
        ovb.innerHTML = `<div class="ovh"><h3>Segments and the 1 MB memory map</h3>${CLOSE_BTN}</div>` +
          '<div class="x86-segref">' +
          '<table class="x86-segtab"><thead><tr><th>Segment</th><th>Offset registers</th><th>Function</th></tr></thead><tbody>' +
          '<tr><td>CS</td><td>IP</td><td>Address of the next instruction</td></tr>' +
          '<tr><td>DS</td><td>BX, DI, SI</td><td>Address of data</td></tr>' +
          '<tr><td>SS</td><td>SP, BP</td><td>Address in the stack</td></tr>' +
          '<tr><td>ES</td><td>BX, DI, SI</td><td>Address of destination data (string operations)</td></tr>' +
          '</tbody></table>' +
          '<p class="x86-segnote">Every physical address is <b>segment × 10h + offset</b>. A segment register holds only the upper 16 bits of a 20-bit address, so each segment is a 64 KB window that can start on any 16-byte boundary in the 1 MB space — in a real program these four windows often overlap, or even sit exactly on top of each other.</p>' +
          '<p class="x86-segnote">The stack segment is the one exception to "offsets start at zero and grow up." SP starts high in its segment and <b>PUSH moves it down first, then writes</b> — so the stack fills toward lower addresses as more goes onto it, and POP reads first, then moves SP back up as things come off.</p>' +
          '<p class="x86-segnote">Where this program’s four segments currently sit, drawn to scale across 00000h–FFFFFh:</p>' +
          `<div class="x86-segmap">${rows}</div>` +
          `<p class="x86-segfoot">CS = ${h4(S.cpu.s.CS)}h &nbsp; DS = ${h4(S.cpu.s.DS)}h &nbsp; SS = ${h4(S.cpu.s.SS)}h &nbsp; ES = ${h4(S.cpu.s.ES)}h</p>` +
          '</div>';
        onPress(ovb.querySelector('[data-ovx]'), closeOv);
      };
      /* which part of a 64 KB segment this particular program actually
         uses -- CS from its own instructions, DS from its declared bytes
         plus whatever's actually been read or written, SS/ES from whatever
         PUSH/POP/MOVS-family offsets have shown up anywhere in the run.
         Showing the whole 64 KB was mostly blank space no example here
         ever touches; a program that never touches the stack at all still
         gets a small peek around SP's starting point instead of nothing. */
      const segTouchedRange = seg => {
        if (seg === 'CS'){
          const p = S.cpu.prog;
          if (!p || !p.ins.length) return [0, 0x0F];
          const last = p.ins[p.ins.length - 1];
          return [0, Math.max(0x0F, last.addr + last.size - 1)];
        }
        const key = {DS:'ds', SS:'ss', ES:'es'}[seg];
        let lo = Infinity, hi = -Infinity;
        S.story.forEach(st => { const offs = st.hi && st.hi[key];
          if (offs && offs.length) offs.forEach(o => { if (o < lo) lo = o; if (o > hi) hi = o; }); });
        if (seg === 'DS'){ const p = S.cpu.prog;
          if (p) for (const k in p.data){ const d = p.data[k], end = d.off + (d.size || 1) - 1;
            if (d.off < lo) lo = d.off; if (end > hi) hi = end; } }
        if (lo === Infinity){ const c = seg === 'SS' ? 0x0100 : 0; lo = c; hi = c; }
        return [Math.max(0, lo - 8), Math.min(0xFFFF, hi + 8)];
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
      onPress($('[data-a="segs"]'), openSegs);
      { const speedEl = $('[data-speed]'); if (speedEl){
        speedEl.value = S.speed;
        speedEl.addEventListener('input', () => { S.speed = +speedEl.value; txt('speedlab', speedLabel(S.speed)); });
      } }
      onPress($('.scrim86'), closeOv);

      drawCur(); buildFlow(); show(S.idx, false);
    }};
  };
})();
