/* Validates every chip definition: pin counts, pin kinds and unit pin numbers.
   Run: node build/check-chips.mjs  (also run automatically by build.mjs) */
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm'; import { fileURLToPath } from 'node:url';
export function checkChips(ROOT){
  const ctx = vm.createContext({});
  for (const f of ['js/core.js','js/data/hardware.js','js/data/devices.js','js/data/cpu.js','js/data/i8086.js','js/data/alu.js','js/data/logic.js','js/data/chips.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, {filename:f});
  const {CHIPS, N} = ctx, errs = [];
  for (const [id, c] of Object.entries(CHIPS)){
    const n = c.labels.length;
    if (c.kinds.length !== n) errs.push(`${id}: ${n} labels but ${c.kinds.length} kinds`);
    if (/[^iobpn]/.test(c.kinds)) errs.push(`${id}: unknown kind letter in "${c.kinds}"`);
    c.labels.forEach((l, i) => { if (/^(VCC|GND|VSS|\+5V|VS)$/.test(l) && c.kinds[i] !== 'p') errs.push(`${id}: pin ${i+1} (${l}) should be kind p`); });
    for (const [name, pins] of c.units) for (const p of pins) if (p < 1 || p > n) errs.push(`${id}: unit "${name}" uses pin ${p}, but the chip has ${n} pins`);
    if (!N[id]) errs.push(`${id}: defined in CHIPS but has no part page (call icDef/chipDef)`);
  }
  return errs;
}
if (process.argv[1] === fileURLToPath(import.meta.url)){
  const errs = checkChips(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
  console.log(errs.length ? errs.join('\n') : 'All chip definitions look consistent.');
  process.exit(errs.length ? 1 : 0);
}
