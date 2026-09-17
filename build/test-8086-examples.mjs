/* Assembles and runs every program offered in the 8086 page's "Example
   program" picker (FEATURED in js/scenes/i8086.js) and checks each one
   assembles cleanly, runs to HLT without an error note, and reaches a
   sensible final state.
   Run: node build/test-8086-examples.mjs */
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = vm.createContext({});
for (const f of ['js/core.js', 'js/data/hardware.js', 'js/data/cpu.js', 'js/data/i8086.js', 'js/sim/i8086.js'])
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, {filename: f});
const { I8086 } = vm.runInContext('({I8086})', ctx);

const sceneSrc = fs.readFileSync(path.join(ROOT, 'js/scenes/i8086.js'), 'utf8');
const m = sceneSrc.match(/const FEATURED = (\[[\s\S]*?\n  \]);/);
if (!m) throw new Error('FEATURED array not found in js/scenes/i8086.js');
const FEATURED = vm.runInContext(m[1], ctx);

const checks = {
  'Add a number from memory': c => c.r.AX === 0x0F && c.mem[c.phys(c.s.DS, 2)] === 0x0F,
  'Count down with a loop': c => c.r.AX === 6 && c.r.CX === 0,
  'Compare and branch': c => c.r.BX === 0xFFFF,
  'The two halves of a register': c => c.r.AX === 0x1234,
  'Multiply': c => c.r.AX === 0x9000 && c.r.DX === 0x01,
  'Use the stack': c => c.r.AX === 0 && c.r.BX === 0x1234 && c.r.SP === 0x0100,
  'Copy a byte through memory': c => c.mem[c.phys(c.s.DS, 1)] === 0x41,
  'Print with DOS': c => c.out === 'Hello',
  'A stack frame with BP': c => c.r.BX === 0x1234 && c.r.BP === c.r.SP,
  'Copy a string with MOVSB': c => c.mem[c.phys(c.s.ES, 2)] === 0x41 && c.mem[c.phys(c.s.ES, 3)] === 0x42,
  'Shift, rotate and the flags': c => c.reg('AL') === 0xF0,
  'Call a subroutine': c => c.r.AX === 10 && c.r.SP === 0x0100,
};

let bad = 0;
for (const ex of FEATURED){
  const c = new I8086.CPU();
  try {
    c.assemble(ex.s);
    let n = 0; while (!c.halted && n < 2000){ if (!c.step()) break; n++; }
    if (!c.halted){ bad++; console.log(`FAIL "${ex.n}": never halted (note: ${c.note || 'none'})`); continue; }
    if (/error|unknown|cannot/i.test(c.note || '')){ bad++; console.log(`FAIL "${ex.n}": ${c.note}`); continue; }
    const check = checks[ex.n];
    if (!check){ bad++; console.log(`FAIL "${ex.n}": no check registered for this example -- add one`); continue; }
    if (!check(c)){ bad++; console.log(`FAIL "${ex.n}": final state didn't match -- AX=${I8086.hex(c.r.AX,4)} BX=${I8086.hex(c.r.BX,4)} CX=${I8086.hex(c.r.CX,4)} DX=${I8086.hex(c.r.DX,4)} SP=${I8086.hex(c.r.SP,4)} BP=${I8086.hex(c.r.BP,4)} out=${JSON.stringify(c.out)}`); continue; }
  } catch (e){ bad++; console.log(`FAIL "${ex.n}": ${e.message}`); continue; }
}
console.log(bad ? `${bad} of ${FEATURED.length} example programs failed.` : `All ${FEATURED.length} example programs passed.`);
process.exit(bad ? 1 : 0);
