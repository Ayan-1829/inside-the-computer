/* ==========================================================
   scenes/i8086.js
   The Intel 8086 page: the chip's own architecture, running real
   programs. The layout follows the classic 8086 block diagram.
     - Memory outside the chip holds the assembled program and data.
     - The BIU prefetches real machine-code bytes into the 6-byte
       instruction queue, works out 20-bit addresses (segment × 16 +
       offset) and drives the address, data and control buses.
     - The EU takes bytes from the queue, decodes them, runs them in
       the ALU and writes results back to registers or memory.
   Each instruction is played as a series of moves. A highlighted dot
   travels along the path carrying the data, and the speed buttons set
   how fast. Hovering a bus names it.
   The CPU state lives in SIM.x86 so it survives navigation.
   ========================================================== */
(function(){
  const GROUP_IDS = ['x86-data','x86-arith','x86-logic','x86-string','x86-control','x86-proc'];
  const FLAGS = ['OF','DF','IF','TF','SF','ZF','AF','PF','CF'];
  const FLAG_NAME_X = {OF:'Overflow',DF:'Direction',IF:'Interrupt enable',TF:'Trap (single step)',SF:'Sign',ZF:'Zero',AF:'Auxiliary carry',PF:'Parity',CF:'Carry'};
  const R16 = ['AX','BX','CX','DX'], PTRS = ['SI','DI','BP','SP'];
  const MEMROWS = 6, PERROW = 8;
  const DEFAULT_SRC = "; Add the numbers 1 to 5, then print a message\nmsg DB 'Sum=$'\n\n      MOV CX, 5       ; loop counter\n      MOV AX, 0\nsum:  ADD AX, CX      ; add, then count down\n      LOOP sum\n      MOV BX, AX      ; keep the total\n      MOV DX, OFFSET msg\n      MOV AH, 09h     ; DOS: print the string\n      INT 21h\n      HLT";
  const SPEEDS = [[0,'Off',0],[1,'Slow',1900],[2,'Normal',1050],[3,'Fast',520],[4,'Fastest',240]];
  const DESC = {};
  for (const g of GROUP_IDS) for (const row of INSTR[g]) row[0].split(/\s*[\/,]\s*/).forEach(m => DESC[m.trim()] = row[1]);
  const hx = (v, n) => I8086.hex(v, n);
  const SHORTROLE = {'interrupt number':'int no.', 'address low':'addr lo', 'address high':'addr hi', 'displacement low':'disp lo', 'displacement high':'disp hi', 'displacement':'disp', 'jump offset':'jump', 'offset low':'off lo', 'offset high':'off hi'};
  const role = r => SHORTROLE[r] || r;
  const ch = c => c >= 32 && c < 127 ? String.fromCharCode(c) : '·';

  function state(){
    if (!SIM.x86 || !SIM.x86.cpu || !SIM.x86.cpu.prog){
      const cpu = new I8086.CPU();
      SIM.x86 = {cpu, src: DEFAULT_SRC, err: null, speed: 2, memView: 'code', done: 0, outBefore: 0};
      try { cpu.assemble(DEFAULT_SRC); } catch (e){ SIM.x86.err = e.message; }
    }
    return SIM.x86;
  }

  /* ---------- the moves that make up one instruction ----------
     Each move is {path, bus, label, note, hi}: `path` is the wire the dot
     travels along, `hi` says what to light up while the move is showing. */
  function planMoves(S, res){
    const cpu = S.cpu, ins = res.ins, M = [];
    const bytes = ins.bytes.map(b => b[0]), roles = ins.bytes.map(b => b[1]);
    const hexb = bytes.map(b => hx(b, 2)).join(' ');
    const at = ins.addr, physCode = (res.before.cs !== undefined ? res.before.cs : cpu.s.CS) * 16 + at;
    const dataSeg = cpu.s.DS * 16;
    const step = (path, bus, label, note, hi) => M.push({path, bus, label, note, hi});
    step('w-addr', 'addr', `${hx(physCode, 5)}h`,
      `Fetch: the BIU puts CS × 16 + IP = ${hx(cpu.s.CS, 4)}h × 16 + ${hx(at, 4)}h = ${hx(physCode, 5)}h on the address bus.`, {code:[at, ins.size], seg:['CS','IP'], sum:true});
    step('w-data-in', 'data', hexb,
      `The ${ins.size} instruction byte${ins.size > 1 ? 's' : ''} come back over the data bus into the queue.`, {code:[at, ins.size], queue:ins.size});
    step('w-q2cu', null, `${hx(bytes[0], 2)} = ${roles[0]}`,
      `Decode: the EU takes the bytes from the queue. The control unit reads ${hexb} as ${ins.text.trim()}.`, {queue:ins.size, cu:true});
    const reads = [...cpu.reads].filter(a => a >= dataSeg && a < dataSeg + 0x10000).sort((a, b) => a - b);
    if (reads.length && reads.length <= 8){
      const off = reads[0] - dataSeg;
      step('w-addr', 'addr', `${hx(reads[0], 5)}h`, `Operand: the BIU asks memory for the data at DS × 16 + ${hx(off, 4)}h.`, {data:[off, reads.length], seg:['DS'], sum:true});
      step('w-data-in', 'data', reads.map(a => hx(cpu.mem[a], 2)).join(' '), 'The data comes back over the data bus.', {data:[off, reads.length]});
    }
    step('w-eu', null, 'operands', 'The operands travel over the internal bus to the ALU.', {alu:true});
    step('w-alu', null, ins.mn, `Execute: the ALU performs ${ins.mn}${res.flagsChanged.length ? ', then the flags are updated' : ''}.`,
      {alu:true, flags:res.flagsChanged});
    const regs = res.changed.filter(k => R16.includes(k) || PTRS.includes(k));
    if (regs.length) step('w-wb', null, regs.map(k => `${k} = ${hx(cpu.r[k], 4)}h`).join(', '),
      `Write back: the result goes into ${regs.join(' and ')}.`, {regs, alu:true});
    const wr = [...cpu.written].filter(a => a >= dataSeg).sort((a, b) => a - b);
    if (wr.length && wr.length <= 8){
      const off = wr[0] - dataSeg;
      step('w-addr', 'addr', `${hx(wr[0], 5)}h`, 'The BIU sends the address of the byte to write.', {data:[off, wr.length], seg:['DS'], sum:true});
      step('w-data-out', 'data', wr.map(a => hx(cpu.mem[a], 2)).join(' '), 'The data goes out over the data bus into memory.', {data:[off, wr.length]});
    }
    if (cpu.out.length > S.outBefore) step('w-out', null, JSON.stringify(cpu.out.slice(S.outBefore)).slice(1, -1),
      'The DOS service prints the text.', {out:true});
    if (res.jumped) step('w-ip', null, `IP = ${hx(cpu.ip, 4)}h`,
      'The jump changes IP, so the queue is thrown away and filled again from the new address.', {queue:'flush', seg:['IP']});
    return M;
  }

  SCENES.i8086 = () => {
    const VB = [1340, 852];
    let s = '';
    const lbl = (x, y, t, cls = 't t-xs t-mut', a = '') => T(x, y, t, cls, a);
    /* ---------- memory ---------- */
    s += R(16, 64, 500, 292, 14, 'm-block');
    s += T(30, 88, 'Memory <tspan class="t-xs t-mut" style="font-weight:500">outside the chip</tspan>', 't t-sm');
    s += btnS(324, 68, 84, 26, 'Code', 'data-mv="code" style="font-size:12.5px"') + btnS(416, 68, 84, 26, 'Data', 'data-mv="data" style="font-size:12.5px"');
    for (let c = 0; c < PERROW; c++) s += lbl(144 + c*38, 116, hx(c, 1), 't t-xs t-mut t-mid');
    for (let r = 0; r < MEMROWS; r++){
      const y = 124 + r*36;
      s += lbl(30, y + 18, '', 't t-xs t-mut t-num', `data-maddr="${r}"`);
      for (let c = 0; c < PERROW; c++){ const i = r*PERROW + c;
        s += `<g class="memb" data-mb="${i}"><title></title>${R(128 + c*38, y, 32, 26, 5, '')}<text x="${144 + c*38}" y="${y + 18}" data-mv style="font-size:13px">00</text></g>`; }
      s += `<text class="t t-xs t-mut t-num" x="436" y="${y + 18}" data-mascii="${r}" style="letter-spacing:2.2px"></text>`;
    }
    s += lbl(30, 350, '', 't t-xs t-mut', 'data-txt="memnote"');
    /* ---------- buses ---------- */
    const busY = {addr: 392, data: 428, ctrl: 464};
    [['addr','Address bus','20 lines, one way: the 8086 says which byte it wants'],
     ['data','Data bus','16 lines, both ways: the bytes themselves'],
     ['ctrl','Control bus','read, write, memory or I/O, and other signals']].forEach(([k, name, what]) => {
      s += `<g class="busline" data-bus="${k}" tabindex="0" role="img" aria-label="${name}: ${what}"><title>${name} — ${what}</title>` +
        `<rect class="bus-hit" x="16" y="${busY[k] - 15}" width="500" height="30"/><path class="bus-line" d="M24 ${busY[k]}H508"/>` +
        `<text class="bus-name" x="24" y="${busY[k] - 12}">${name}</text></g>`;
    });
    /* ---------- the chip ---------- */
    s += R(552, 56, 776, 672, 18, 'm-panel') + T(566, 80, 'Intel 8086', 't t-sm') + lbl(662, 80, 'inside the chip');
    /* BIU */
    s += R(564, 92, 752, 274, 14, 'band-biu') + T(578, 114, 'BIU', 't t-sm') + lbl(614, 114, 'Bus interface unit');
    s += P('M600 186H744L720 156H624Z', 'm-acc-soft', 'data-act="sum"') + T(672, 179, 'Σ', 't t-sm t-mid') + lbl(672, 200, 'address adder', 't t-xs t-mut t-mid');
    ['CS','DS','SS','ES','IP'].forEach((r, i) => { const y = 210 + i*26;
      s += `<g data-seg="${r}">${R(600, y, 144, 24, 4, 'm-block')}${T(612, y + 17, r, 't t-xs')}${T(732, y + 17, '', 't t-xs t-num t-end', 'data-sv')}</g>`; });
    s += lbl(578, 356, '', 't t-xs t-mut', 'data-txt="pa"');
    s += W([[672, 156], [672, 130], [540, 130], [540, 392], [24, 392]], 'w-addr');
    s += W([[24, 428], [552, 428], [552, 142], [826, 142], [826, 172]], 'w-data-in');
    s += W([[826, 172], [826, 142], [552, 142], [552, 428], [24, 428]], 'w-data-out');
    s += T(794, 122, 'Instruction queue <tspan class="t-xs t-mut" style="font-weight:500">· 6 bytes</tspan>', 't t-xs');
    for (let q = 0; q < 6; q++){ const x = 794 + q*84;
      s += `<g class="qcell" data-q="${q}">${R(x, 132, 76, 42, 6, '')}${T(x + 38, 152, '', 't t-sm t-num t-mid', 'data-qb')}${T(x + 38, 167, '', 't t-xs t-mut t-mid', 'data-qr')}</g>`; }
    s += lbl(794, 194, '', 't t-xs t-mut', 'data-txt="qnote"');
    s += R(794, 206, 522, 126, 10, 'm-block') + T(806, 226, 'Program', 't t-xs') + lbl(878, 226, 'address · line');
    s += `<foreignObject x="800" y="232" width="510" height="96"><div xmlns="http://www.w3.org/1999/xhtml" class="x86-listbox"><ol class="x86-list" data-list=""></ol></div></foreignObject>`;
    /* internal bus */
    s += `<path class="bus86" data-s="w-eu" d="M576 386H1306"/>` + lbl(584, 376, 'internal bus, 16 bits');
    /* EU */
    s += R(564, 398, 752, 312, 14, 'band-eu') + T(578, 420, 'EU', 't t-sm') + lbl(606, 420, 'Execution unit');
    R16.forEach((r, i) => { const y = 430 + i*30;
      s += `<g data-reg="${r}">${T(578, y + 21, r, 't t-sm')}${R(612, y, 70, 26, 5, 'm-block', 'data-half="H"')}${R(686, y, 70, 26, 5, 'm-block', 'data-half="L"')}` +
        `${T(620, y + 18, r[0] + 'H', 't t-xs t-mut')}${T(674, y + 18, '', 't t-sm t-num t-end', 'data-hv')}${T(694, y + 18, r[0] + 'L', 't t-xs t-mut')}${T(748, y + 18, '', 't t-sm t-num t-end', 'data-lv')}</g>`; });
    PTRS.forEach((r, i) => { const y = 558 + i*28;
      s += `<g data-reg="${r}">${T(578, y + 19, r, 't t-sm')}${R(612, y, 144, 24, 5, 'm-block')}${T(748, y + 17, '', 't t-sm t-num t-end', 'data-lv')}</g>`; });
    s += W([[684, 386], [684, 430]], 'w-wb');
    s += R(760, 430, 170, 74, 10, 'm-panel', 'data-act="cu"') + T(772, 450, 'Control unit', 't t-xs') + lbl(772, 470, '', 't t-xs t-num', 'data-txt="cu1"') + lbl(772, 490, '', 't t-xs t-mut', 'data-txt="cu2"');
    s += W([[826, 174], [826, 430]], 'w-q2cu');
    s += P('M764 536H884L924 572L964 536H1084L1020 628H828Z', 'm-acc-soft alu86', 'data-act="alu"') + T(924, 592, 'ALU', 't t-sm t-mid') + T(924, 610, '', 't t-xs t-mid', 'data-txt="aluop"');
    s += W([[844, 504], [844, 536]], 'w-alu');
    s += R(960, 430, 352, 88, 10, 'm-block') + T(972, 450, 'Flags', 't t-xs');
    FLAGS.forEach((f, i) => { const x = 972 + i*38;
      s += `<g class="flag" data-flag="${f}"><title>${FLAG_NAME_X[f]} flag</title>${R(x, 458, 34, 48, 6, '')}${T(x + 17, 476, f, '', 'style="font-size:11.5px"')}<text x="${x + 17}" y="496" data-fv style="font-size:14px">0</text></g>`; });
    s += R(1108, 536, 204, 92, 10, 'm-block') + T(1120, 556, 'Output', 't t-xs') + lbl(1182, 556, 'from INT 21h');
    s += `<foreignObject x="1116" y="562" width="192" height="60"><div xmlns="http://www.w3.org/1999/xhtml" class="x86-outbox" data-out=""></div></foreignObject>`;
    s += W([[1020, 582], [1108, 582]], 'w-out');
    s += W([[744, 314], [760, 314]], 'w-ip');
    s += R(16, 744, 1312, 92, 12, 'm-block') + T(32, 772, '', 't t-sm', 'data-txt="step"') + T(32, 796, '', 't t-sm t-mut', 'data-txt="stepb"') + T(32, 820, '', 't t-xs t-mut', 'data-txt="step2"');
    /* ---------- controls ---------- */
    s += btnS(16, 486, 112, 40, 'Step', 'data-a="step" aria-label="Run the next step"');
    s += btnS(136, 486, 112, 40, 'Run', 'data-a="run" aria-label="Run the program"');
    s += btnS(256, 486, 112, 40, 'Reset', 'data-a="reset" aria-label="Start the program again"');
    s += btnS(376, 486, 110, 40, 'Edit', 'data-a="edit" aria-label="Edit the program"');
    s += T(16, 556, 'Animation speed', 't t-xs t-mut');
    SPEEDS.forEach(([v, name], i) => { s += btnS(16 + i*95, 566, 88, 34, name, `data-speed="${v}" aria-label="Animation speed: ${name}" style="font-size:13px"`); });
    s += T(16, 634, 'Example programs <tspan class="t-xs t-mut">· one per instruction</tspan>', 't t-xs t-mut');
    s += `<foreignObject x="12" y="642" width="484" height="160"><div xmlns="http://www.w3.org/1999/xhtml" class="x86-exs" data-exs=""></div></foreignObject>`;
    s += `<foreignObject id="x86-editfo" x="12" y="60" width="478" height="300" style="display:none"><div xmlns="http://www.w3.org/1999/xhtml" class="x86-edit" data-edit=""><textarea spellcheck="false" aria-label="Assembly program"></textarea></div></foreignObject>`;
    return {svg: s, vb: VB, init: el => {
      requestWide(true);
      el.dataset.scrollStart = 'left';
      const S = state();
      let moves = null, mi = 0, timer = null, running = false, hi = {};
      const $ = q => el.querySelector(q), $$ = q => el.querySelectorAll(q);
      const txt = (k, v) => { const e = el.querySelector(`[data-txt="${k}"]`); if (e) e.innerHTML = v; };
      const speed = () => SPEEDS[S.speed][2];
      const editFO = () => el.querySelector('#x86-editfo');
      const setEditing = on => { editFO().style.display = on ? '' : 'none'; };
      const editing = () => editFO().style.display !== 'none';
      const curIns = () => { const c = S.cpu; return !c.halted && c.prog && c.prog.at[c.ip] !== undefined ? c.prog.ins[c.prog.at[c.ip]] : null; };

      const drawMem = () => {
        const cpu = S.cpu, code = S.memView === 'code', seg = code ? cpu.s.CS : cpu.s.DS;
        $$('[data-maddr]').forEach((e, r) => e.textContent = hx(r*PERROW, 4));
        $$('.memb').forEach((g, i) => { const a = (seg << 4) + i, v = cpu.mem[a];
          g.querySelector('[data-mv]').textContent = hx(v, 2);
          g.querySelector('title').textContent = `${code ? 'CS' : 'DS'}:${hx(i, 4)}  =  ${hx(a, 5)}h`;
          g.classList.toggle('code', code && cpu.prog && i < cpu.prog.end);
          const H = hi.code && code && i >= hi.code[0] && i < hi.code[0] + hi.code[1];
          const D = hi.data && !code && i >= hi.data[0] && i < hi.data[0] + hi.data[1];
          g.classList.toggle('lit', !!(H || D));
          g.classList.toggle('ip', code && !cpu.halted && i === cpu.ip);
        });
        $$('[data-mascii]').forEach((e, r) => { let t = '';
          for (let c = 0; c < PERROW; c++) t += ch(cpu.mem[(seg << 4) + r*PERROW + c]); e.textContent = t; });
        $$('[data-mv="code"],[data-mv="data"]').forEach(b => b.classList.toggle('on', (b.dataset.mv === 'code') === code));
        txt('memnote', code ? `Code at CS:0000 · ${cpu.prog ? cpu.prog.end : 0} bytes · the outlined byte is where IP points`
          : 'Data at DS:0000 · the DB and DW values your program declared');
      };
      const drawQueue = () => {
        const cpu = S.cpu, q = [];
        if (!cpu.halted && cpu.prog){ let a = cpu.ip;
          while (q.length < 6 && a < cpu.prog.end){ const k = cpu.prog.at[a];
            if (k === undefined) break;
            const I = cpu.prog.ins[k];
            I.bytes.forEach(b => { if (q.length < 6) q.push(b); });
            a += I.size; } }
        const take = typeof hi.queue === 'number' ? hi.queue : 0;
        $$('.qcell').forEach((c, i) => { const b = q[i];
          c.querySelector('[data-qb]').textContent = b ? hx(b[0], 2) : '';
          c.querySelector('[data-qr]').textContent = b ? role(b[1]) : '';
          c.classList.toggle('empty', !b);
          c.classList.toggle('on', !!b && i < take);
          c.classList.toggle('flush', hi.queue === 'flush');
        });
        txt('qnote', cpu.halted ? 'The processor has stopped.' : hi.queue === 'flush' ? 'A jump empties the queue: those bytes are no longer the ones to run.'
          : 'The BIU fills the queue while the EU is busy.');
      };
      const drawRegs = () => {
        const cpu = S.cpu;
        R16.forEach(r => { const g = el.querySelector(`[data-reg="${r}"]`), v = cpu.r[r];
          g.querySelector('[data-hv]').textContent = hx(v >> 8, 2); g.querySelector('[data-lv]').textContent = hx(v & 255, 2);
          g.querySelectorAll('[data-half]').forEach(e => e.classList.toggle('lit', !!(hi.regs && hi.regs.includes(r)))); });
        PTRS.forEach(r => { const g = el.querySelector(`[data-reg="${r}"]`);
          g.querySelector('[data-lv]').textContent = hx(cpu.r[r], 4);
          g.querySelector('rect').classList.toggle('lit', !!(hi.regs && hi.regs.includes(r))); });
        ['CS','DS','SS','ES','IP'].forEach(r => { const g = el.querySelector(`[data-seg="${r}"]`);
          g.querySelector('[data-sv]').textContent = hx(r === 'IP' ? cpu.ip : cpu.s[r], 4);
          g.querySelector('rect').classList.toggle('lit', !!(hi.seg && hi.seg.includes(r))); });
        FLAGS.forEach(f => { const g = el.querySelector(`[data-flag="${f}"]`), v = cpu.F(f);
          g.querySelector('[data-fv]').textContent = v; g.classList.toggle('on', !!v);
          g.classList.toggle('chg', !!(hi.flags && hi.flags.includes(f))); });
        const ins = curIns();
        txt('pa', ins ? `CS × 16 + IP = ${hx((cpu.s.CS << 4) + cpu.ip, 5)}h` : cpu.halted ? 'stopped' : '');
        txt('cu1', ins ? esc(ins.text.trim().slice(0, 22)) : '');
        txt('cu2', ins ? 'next instruction' : '');
        txt('aluop', moves && moves.ins ? esc(moves.ins.mn) : '');
        el.querySelector('[data-act="cu"]').classList.toggle('active', !!hi.cu);
        el.querySelector('[data-act="alu"]').classList.toggle('active', !!hi.alu);
        el.querySelector('[data-act="sum"]').classList.toggle('active', !!hi.sum);
        const ob = $('[data-out]'); ob.textContent = cpu.out || ''; ob.classList.toggle('lit', !!hi.out);
      };
      const drawList = () => {
        const cpu = S.cpu, cur = curIns(), line = cur ? cur.line : -1;
        $('[data-list]').innerHTML = S.src.split('\n').map((l, i) => {
          const I = cpu.prog && cpu.prog.ins.find(x => x.line === i + 1);
          return `<li class="${i + 1 === line ? 'cur' : ''}"><span class="ln">${I ? hx(I.addr, 4) : ''}</span><code>${esc(l) || '&nbsp;'}</code></li>`;
        }).join('');
        const c = $('[data-list] .cur'); if (c) c.scrollIntoView({block:'nearest'});
      };
      const drawFlow = m => {
        $$('.wire, .bus86').forEach(w => w.classList.toggle('on', !!m && w.dataset.s === m.path));
        $$('.busline').forEach(b => b.classList.toggle('on', !!(m && m.bus === b.dataset.bus)));
        el.querySelectorAll('.flow-dot, .flow-lab').forEach(d => d.remove());
        if (!m) return;
        const w = el.querySelector(`.wire[data-s="${m.path}"], .bus86[data-s="${m.path}"]`) ||
                  el.querySelector(`.busline[data-bus="${m.bus}"] .bus-line`);
        if (!w || !w.getTotalLength) return;
        const NS = 'http://www.w3.org/2000/svg';
        const dot = document.createElementNS(NS, 'circle'); dot.setAttribute('class', 'flow-dot'); dot.setAttribute('r', '10');
        const lab = document.createElementNS(NS, 'text'); lab.setAttribute('class', 'flow-lab'); lab.textContent = m.label || '';
        el.appendChild(dot); el.appendChild(lab);
        const len = w.getTotalLength(), dur = Math.max(240, speed() * 0.75), t0 = performance.now();
        const tick = now => {
          if (!dot.isConnected) return;
          const k = Math.min(1, (now - t0) / dur), p = w.getPointAtLength(len * k);
          dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
          lab.setAttribute('x', Math.min(p.x + 16, VB[0] - 8 - (m.label || '').length * 7.2)); lab.setAttribute('y', p.y - 14);
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      };
      const draw = m => { drawMem(); drawQueue(); drawRegs(); drawList(); drawFlow(m); };

      const showMove = () => {
        const m = moves[mi]; hi = m.hi || {};
        const ins = moves.ins;
        const last = mi === moves.length - 1;
        const note = last && S.cpu.halted ? `${m.note} ${S.cpu.note || 'The processor has stopped.'}` : m.note;
        const lines = wrap(note, 120);
        txt('step', `<tspan style="font-weight:700">${mi + 1}/${moves.length}</tspan>  ${esc(lines[0])}`);
        txt('stepb', esc(lines.slice(1).join(' ')));
        txt('step2', `${esc(ins.text.trim())} · ${hx(ins.addr, 4)}h: ${ins.bytes.map(b => hx(b[0], 2)).join(' ')} · ${esc(DESC[ins.mn] || '')}`);
        draw(m);
      };
      const endInstruction = () => {
        moves = null; hi = {}; mi = 0;
        const cpu = S.cpu;
        txt('step', cpu.halted ? esc(cpu.note || 'The processor has stopped.') : `Ran ${S.done} instruction${S.done === 1 ? '' : 's'}. Press Step for the next one.`);
        txt('stepb', ''); if (cpu.halted) txt('step2', '');
        draw(null); sync();
        if (running && !cpu.halted) timer = setTimeout(step, Math.max(90, speed() * 0.45));
        else if (running){ running = false; sync(); }
      };
      const advance = () => {
        if (!moves) return;
        mi++;
        if (mi >= moves.length){ endInstruction(); return; }
        showMove();
        if (speed()) timer = setTimeout(advance, speed());
      };
      const step = () => {
        clearTimeout(timer);
        const cpu = S.cpu;
        if (S.err || cpu.halted) return;
        S.outBefore = cpu.out.length;
        const res = cpu.step();
        if (!res){ endInstruction(); return; }
        S.done++;
        moves = planMoves(S, res); moves.ins = res.ins; mi = 0;
        if (!speed()){                      /* animation off: show the last state of the instruction */
          mi = moves.length - 1; showMove(); moves = null; hi = {}; mi = 0;
          const c = S.cpu;
          txt('step', c.halted ? esc(c.note || 'The processor has stopped.') : `Ran ${S.done} instruction${S.done === 1 ? '' : 's'}. Press Step for the next one.`);
          txt('stepb', ''); draw(null); sync();
          if (running && !c.halted) timer = setTimeout(step, 40); else if (running){ running = false; sync(); }
          return;
        }
        showMove(); sync();
        timer = setTimeout(advance, speed());
      };
      const stop = () => { clearTimeout(timer); running = false; moves = null; hi = {}; };
      const load = src => {
        stop();
        S.src = src; S.err = null; S.done = 0; S.outBefore = 0;
        S.cpu = new I8086.CPU();
        try { S.cpu.assemble(src); } catch (e){ S.err = e.message; }
        txt('step', S.err ? `<tspan style="fill:var(--pin-pwr);font-weight:700">Cannot run:</tspan> ${esc(S.err)}` : 'Press Step to fetch and run the first instruction.');
        txt('stepb', ''); txt('step2', '');
        draw(null); sync();
      };
      const sync = () => {
        const cpu = S.cpu, dead = !!S.err || cpu.halted || editing();
        $('[data-a="step"]').classList.toggle('dis', dead);
        $('[data-a="run"]').classList.toggle('dis', dead);
        $('[data-a="run"]').querySelector('text').textContent = running ? 'Pause' : 'Run';
        $('[data-a="edit"]').querySelector('text').textContent = editing() ? 'Done' : 'Edit';
        $$('[data-speed]').forEach(b => b.classList.toggle('on', +b.dataset.speed === S.speed));
      };
      onPress($('[data-a="step"]'), () => { if ($('[data-a="step"]').classList.contains('dis')) return;
        running = false; clearTimeout(timer); if (moves) advance(); else step(); });
      onPress($('[data-a="run"]'), () => { if ($('[data-a="run"]').classList.contains('dis')) return;
        running = !running; sync(); if (running){ if (moves) advance(); else step(); } else clearTimeout(timer); });
      onPress($('[data-a="reset"]'), () => load(S.src));
      onPress($('[data-a="edit"]'), () => {
        const ta = $('[data-edit] textarea');
        if (!editing()){ stop(); ta.value = S.src; setEditing(true); ta.focus(); sync(); }
        else { setEditing(false); load(ta.value); }
      });
      $$('[data-speed]').forEach(b => onPress(b, () => { S.speed = +b.dataset.speed; sync(); }));
      $$('[data-mv]').forEach(b => { if (b.dataset.mv) onPress(b, () => { S.memView = b.dataset.mv; drawMem(); }); });
      $('[data-exs]').innerHTML = GROUP_IDS.map(g =>
        `<div class="x86-exg"><b>${esc(N[g].name)}</b>${INSTR[g].map((r, i) => `<button type="button" data-ex="${g}:${i}">${esc(r[0])}</button>`).join('')}</div>`).join('');
      $('[data-exs]').addEventListener('click', ev => { const b = ev.target.closest('[data-ex]'); if (!b) return;
        const [g, i] = b.dataset.ex.split(':');
        setEditing(false);
        $$('[data-ex]').forEach(x => x.classList.toggle('on', x === b));
        load(`; ${INSTR[g][+i][0]} example\n${INSTR[g][+i][2]}`);
      });
      txt('step', S.err ? `<tspan style="fill:var(--pin-pwr);font-weight:700">Cannot run:</tspan> ${esc(S.err)}` : 'Press Step to fetch and run the first instruction.');
      sync(); draw(null);
    }};
  };
})();
