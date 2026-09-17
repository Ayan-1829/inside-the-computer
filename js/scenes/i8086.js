/* ==========================================================
   scenes/i8086.js
   The 8086 emulator screen (an HTML scene, not SVG):
   toolbar, program listing / editor, registers, flags, memory,
   stack, output console, and the instruction reference.
   The CPU lives in SIM.x86 so it survives navigation.
   The six instruction-group parts use the `focus` hook to open
   their tab in the reference.
   ========================================================== */
(function(){
  const START = "; Add the numbers 1 to 5, then print a message\nmsg  DB 'Sum is in AX$'\n\n      MOV CX, 5        ; loop counter\n      MOV AX, 0\nsum:  ADD AX, CX\n      LOOP sum         ; CX = CX - 1, repeat until 0\n      MOV DX, OFFSET msg\n      MOV BX, AX       ; keep the result\n      MOV AH, 09h      ; DOS: print string\n      INT 21h\n      MOV AX, BX\n      HLT";
  const GROUP_IDS = ['x86-data','x86-arith','x86-logic','x86-string','x86-control','x86-proc'];
  const FLAG_INFO = {OF:'Overflow: signed result did not fit',DF:'Direction: string instructions count down when 1',IF:'Interrupt enable',TF:'Trap: single-step mode',
    SF:'Sign: result is negative',ZF:'Zero: result is 0',AF:'Auxiliary carry: carry out of bit 3 (for BCD)',PF:'Parity: even number of 1 bits in the low byte',CF:'Carry: unsigned result did not fit'};
  const DESC = {};
  for (const g of GROUP_IDS) for (const row of INSTR[g]) row[0].split(/\s*[\/,]\s*/).forEach(m => DESC[m.trim()] = row[1]);
  const h4 = hex => I8086.hex(hex);
  const e = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');

  function state(){
    if (!SIM.x86){ const cpu = new I8086.CPU(); SIM.x86 = {cpu, src: START, group: 'x86-data', err: null, msg: 'Press <b>Step</b> to run the first instruction.', changed: [], fchanged: []};
      try { cpu.assemble(START); } catch (err){ SIM.x86.err = err.message; } }
    return SIM.x86;
  }

  SCENES.i8086 = () => {
    const html = `<div class="x86">
      <div class="x86-bar">
        <button class="btn btn-p" data-a="step">Step</button><button class="btn" data-a="run">Run</button><button class="btn" data-a="all">Run to end</button>
        <button class="btn" data-a="reset">Reset</button><button class="btn" data-a="edit">Edit program</button><span class="x86-steps" aria-live="off"></span>
      </div>
      <div class="x86-grid">
        <section class="x86-box x86-prog"><h4>Program</h4><ol class="x86-list"></ol>
          <label class="sr-only" for="x86-src">Assembly program</label><textarea id="x86-src" spellcheck="false" hidden></textarea></section>
        <section class="x86-box"><h4>Registers</h4><div class="x86-regs"></div><h4>Flags</h4><div class="x86-flags"></div></section>
        <section class="x86-box"><h4>Memory at DS:0000</h4><div class="x86-mem"></div><h4>Stack at SS:SP</h4><div class="x86-stack"></div><h4>Output</h4><pre class="x86-out"></pre></section>
      </div>
      <p class="x86-msg" aria-live="polite"></p>
      <section class="x86-ref">
        <div class="x86-tabs" role="tablist" aria-label="Instruction groups">${GROUP_IDS.map(g => `<a href="#/${g}" data-go="${g}" role="tab" data-tab="${g}">${N[g].name}</a>`).join('')}</div>
        <div class="x86-ops"></div><p class="x86-desc"></p>
      </section>
    </div>`;
    let root, timer = null;
    const S = state();
    const $$ = q => root.querySelector(q);
    function renderProg(){
      const cpu = S.cpu, P = cpu.prog, cur = P && !cpu.halted && cpu.ip < P.ins.length ? P.ins[cpu.ip].line : -1;
      $$('.x86-list').innerHTML = S.src.split('\n').map((l, i) => `<li class="${i+1 === cur ? 'cur' : ''}${S.errLine === i+1 ? ' err' : ''}"><span class="ln">${i+1}</span><code>${e(l) || '&nbsp;'}</code></li>`).join('');
      const c = $$('.x86-list .cur'); if (c) c.scrollIntoView({block:'nearest'});
    }
    function renderState(){
      const cpu = S.cpu, ch = new Set(S.changed), cell = (n, v, t) => `<div class="rg${ch.has(n) ? ' ch' : ''}" title="${t || n + ' = ' + v + ' (decimal)'}"><span>${n}</span><b>${h4(v)}</b></div>`;
      const gen = ['AX','BX','CX','DX'].map(n => { const v = cpu.r[n]; return `<div class="rg wide${ch.has(n) ? ' ch' : ''}" title="${n} = ${v} (decimal)"><span>${n}</span><b><i>${I8086.hex(v >> 8, 2)}</i> <i>${I8086.hex(v & 255, 2)}</i></b><small>${n[0]}H · ${n[0]}L</small></div>`; }).join('');
      $$('.x86-regs').innerHTML = gen + ['SI','DI','BP','SP'].map(n => cell(n, cpu.r[n])).join('') + ['CS','DS','SS','ES'].map(n => cell(n, cpu.s[n])).join('') +
        cell('IP', cpu.ip, 'IP: number of the next instruction (in this model IP counts instructions, not bytes)');
      const fc = new Set(S.fchanged);
      $$('.x86-flags').innerHTML = ['OF','DF','IF','TF','SF','ZF','AF','PF','CF'].map(f => `<div class="fl${cpu.F(f) ? ' on' : ''}${fc.has(f) ? ' ch' : ''}" title="${FLAG_INFO[f]}"><span>${f}</span><b>${cpu.F(f)}</b></div>`).join('');
      let m = '';
      for (let row = 0; row < 8; row++){
        const base = row*8; let hx = '', asc = '';
        for (let k = 0; k < 8; k++){ const a = cpu.phys(cpu.s.DS, base + k), v = cpu.mem[a];
          hx += `<i class="${cpu.written.has(a) ? 'ch' : ''}">${I8086.hex(v, 2)}</i>`; asc += v >= 32 && v < 127 ? e(String.fromCharCode(v)) : '·'; }
        m += `<div class="mr"><span>${I8086.hex(base)}</span>${hx}<em>${asc}</em></div>`;
      }
      $$('.x86-mem').innerHTML = m;
      let st = '';
      for (let k = 0; k < 4; k++){ const off = (cpu.r.SP + k*2) & 0xFFFF; st += `<div class="mr"><span>SP+${k*2}</span><i>${h4(cpu.rdw(cpu.s.SS, off))}</i>${k === 0 ? '<em>← top</em>' : ''}</div>`; }
      $$('.x86-stack').innerHTML = st;
      $$('.x86-out').textContent = cpu.out || ' ';
      $$('.x86-steps').textContent = `${cpu.steps} step${cpu.steps === 1 ? '' : 's'}${cpu.halted ? ' · stopped' : ''}`;
      $$('.x86-msg').innerHTML = S.err ? `<b class="bad">Cannot run:</b> ${e(S.err)}` : S.msg;
      root.querySelectorAll('[data-a="step"],[data-a="run"],[data-a="all"]').forEach(b => b.disabled = !!S.err || cpu.halted || editing());
    }
    function renderRef(){
      root.querySelectorAll('[data-tab]').forEach(t => { const on = t.dataset.tab === S.group; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); });
      $$('.x86-ops').innerHTML = INSTR[S.group].map((r, i) => `<button class="op${S.pick === S.group + i ? ' on' : ''}" data-op="${i}">${r[0]}</button>`).join('');
      const r = S.pick && S.pick.startsWith(S.group) ? INSTR[S.group][+S.pick.slice(S.group.length)] : null;
      $$('.x86-desc').innerHTML = r ? `<b>${r[0]}</b>: ${e(r[1])} The example is loaded in the program; press Step.` : 'Choose an instruction to load a short example program that uses it.';
    }
    const render = () => { renderProg(); renderState(); };
    const editing = () => !$$('#x86-src').hidden;
    function load(src){
      stop(); S.src = src; S.err = null; S.errLine = null; S.changed = []; S.fchanged = [];
      S.cpu = new I8086.CPU();
      try { S.cpu.assemble(src); S.msg = 'Program loaded. Press <b>Step</b> to run the first instruction.'; }
      catch (err){ S.err = err.message; S.errLine = err.line || null; }
      render();
    }
    function step(){
      const cpu = S.cpu, res = cpu.step();
      if (!res){ S.changed = []; S.fchanged = []; S.msg = e(cpu.note || 'Stopped.'); render(); return false; }
      S.changed = res.changed; S.fchanged = res.flagsChanged;
      const ins = res.ins, base = ins.mn, d = DESC[base] || DESC[base.replace(/[BW]$/,'')] || '';
      const parts = res.changed.map(r => { const was = r in res.before.r ? res.before.r[r] : res.before.s[r], now = r in cpu.r ? cpu.r[r] : cpu.s[r]; return `${r} ${h4(was)} → <b>${h4(now)}</b>`; });
      const fl = res.flagsChanged.map(f => `${f} → ${cpu.F(f)}`);
      S.msg = `<span class="ln-tag">Line ${ins.line}</span> <code>${e(ins.text)}</code> ${d ? '— ' + e(d) : ''}<br>` +
        (parts.length ? parts.join(', ') : 'No register changed') + (cpu.written.size ? `; ${cpu.written.size} byte${cpu.written.size > 1 ? 's' : ''} of memory written` : '') +
        (fl.length ? `. Flags: ${fl.join(', ')}` : '') + '.' + (cpu.note ? ` <i>${e(cpu.note)}</i>` : '');
      render();
      return !cpu.halted && !cpu.paused;
    }
    function stop(){ if (timer){ clearInterval(timer); timer = null; } const b = root && $$('[data-a="run"]'); if (b) b.textContent = 'Run'; }
    function run(){
      if (timer){ stop(); return; }
      $$('[data-a="run"]').textContent = 'Pause';
      timer = setInterval(() => { if (!root.isConnected || !step()) stop(); }, 380);
    }
    function runAll(){
      stop(); let n = 0, last = null;
      while (!S.cpu.halted && n < 20000){ const r = S.cpu.step(); if (!r) break; last = r; n++; if (S.cpu.paused) break; }
      S.changed = []; S.fchanged = [];
      S.msg = `Ran ${n} instruction${n === 1 ? '' : 's'}. ` + (n >= 20000 ? 'Stopped after 20,000 steps; the program may loop forever.' : e(S.cpu.note || (S.cpu.halted ? 'The program has finished.' : '')));
      if (last && !S.cpu.halted && !S.cpu.paused && n < 20000) S.msg += '';
      render();
    }
    function toggleEdit(){
      const ta = $$('#x86-src'), list = $$('.x86-list'), b = $$('[data-a="edit"]');
      if (!editing()){ stop(); ta.value = S.src; ta.hidden = false; list.hidden = true; b.textContent = 'Done editing'; ta.focus(); renderState(); return; }
      ta.hidden = true; list.hidden = false; b.textContent = 'Edit program'; load(ta.value);
    }
    return {html, init: el => {
      root = el;
      el.querySelector('[data-a="step"]').addEventListener('click', () => { stop(); step(); });
      el.querySelector('[data-a="run"]').addEventListener('click', run);
      el.querySelector('[data-a="all"]').addEventListener('click', runAll);
      el.querySelector('[data-a="reset"]').addEventListener('click', () => { if (editing()) toggleEdit(); else load(S.src); });
      el.querySelector('[data-a="edit"]').addEventListener('click', toggleEdit);
      el.querySelector('.x86-ops').addEventListener('click', ev => { const b = ev.target.closest('[data-op]'); if (!b) return;
        S.pick = S.group + b.dataset.op; if (editing()){ $$('#x86-src').hidden = true; $$('.x86-list').hidden = false; $$('[data-a="edit"]').textContent = 'Edit program'; }
        load('; ' + INSTR[S.group][+b.dataset.op][0] + ' example\n' + INSTR[S.group][+b.dataset.op][2]); renderRef(); });
      render(); renderRef();
    }, focus: (el, id) => { if (GROUP_IDS.includes(id) && S.group !== id){ S.group = id; if (root) renderRef(); } }};
  };
})();
