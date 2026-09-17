/* Writes every operand combination the 8086 ALU view can produce, with the
   instruction text and the machine code from encode86(). Used by
   build/test-alu86-encoding.py, which checks the bytes with a disassembler. */
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = vm.createContext({});
for (const f of ['js/sim/i8086.js', 'js/scenes/alu86.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, {filename: f});
const out = vm.runInContext(`(() => {
  const cases = [];
  for (const [, , ops] of ALU86_GROUPS) for (const label of ops) for (const w of [8, 16]){
    const op = label.split(' ')[0], R = rules86(op);
    const dsts = R.dst === 'fixed' ? ['A'] : R.dst.split(''), srcs = R.src === 'count' ? ['1','CL'] : R.src ? R.src.split('') : [null];
    for (const d of dsts) for (const s of srcs) for (const imm of (s === 'I' ? [5, 300, 0xFFF0] : [5])) for (const addr of [4, 7]){
      const st = Object.assign(A86_DEFAULT(), {w, dst:d, src: R.src === 'count' ? 'B' : (s || 'B'), cnt: R.src === 'count' ? s : '1', imm, addr, op: label});
      const o = run86(st); if (o.error && !o.divErr) continue;
      if (o.divErr) continue;
      const bytes = encode86(o, st);
      cases.push({asm: o.asm, op, w, bytes: bytes.map(b => b[0]), roles: bytes.map(b => b[1])});
    }
  }
  return JSON.stringify(cases);
})()`, ctx);
fs.writeFileSync('/tmp/alu86-cases.json', out);
console.log(JSON.parse(out).length + ' instruction encodings written');
