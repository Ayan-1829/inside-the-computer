/* Checks what the narrator says: every "How it works" caption (js/scenes/device-anims.js) and every
   power-on walkthrough caption (POWER_STEPS in js/engine.js) goes through SFX.pieces() in js/sfx.js,
   exactly as the voice gets it. A decimal point ("3.3 V", "0.1 ms") or a name like "M.2" must never be
   taken for the end of a sentence, units and abbreviations must be spoken in words, and no symbols may
   be left over.
   Run: node build/test-speech.mjs */
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* sfx.js with just enough of a browser around it (no audio, no voices) */
const ctx = vm.createContext({ console, setTimeout, clearTimeout,
  localStorage: { getItem: () => null, setItem() {} }, document: { addEventListener() {}, querySelectorAll: () => [] }, addEventListener() {} });
ctx.window = ctx;
vm.runInContext(read('js/sfx.js'), ctx, { filename: 'js/sfx.js' });
const { SFX } = vm.runInContext('({SFX})', ctx);
const say = t => SFX.pieces(t).join(' | ');

let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.log('FAIL ' + msg); } };
const expect = (text, want) => { const got = say(text); check(got === want, `${JSON.stringify(text)}\n     said: ${JSON.stringify(got)}\n     want: ${JSON.stringify(want)}`); };

/* the cases that went wrong, and others like them */
expect('Full **12 V, 5 V and 3.3 V** power flows in.', 'Full 12 volts, 5 volts and 3.3 volts power flows in.');
expect('Reading back takes about **0.1 ms**. The controller spreads writes.', 'Reading back takes about 0.1 milliseconds. The controller spreads writes.');
expect('through the gold contacts of the **M.2 connector**.', 'through the gold contacts of the M dot 2 connector.');
expect('The VRM turns 12 V into about 1 V, for the CPU.', 'The VRM turns 12 volts into about 1 volt, for the CPU.');
expect('the power supply sends **+5VSB** standby power, so', 'the power supply sends 5 volt standby power, so');
expect('how far the mouse moved: **dx** and **dy**.', 'how far the mouse moved: D X and D Y.');
expect('the fast **DRAM cache**, SRAM and VRAM chips', 'the fast D RAM cache, S RAM and V RAM chips');
expect('over **PCIe**, the rear I/O ports, the **UEFI** firmware and the LED', 'over P C I Express, the rear I O ports, the U E F I firmware and the L E D');
expect('hundreds of GB a second, sent as 0s and 1s.', 'hundreds of gigabytes a second, sent as zeros and ones.');
expect('open the **Intel 8086**, or the 8088.', 'open the Intel 80 86, or the 80 88.');
expect('pulls **PWR_SW#** low, then **PS_ON#**; then **PWR_OK**.', 'pulls power switch low, then P S on; then power OK.');
expect('A 3.5 mm jack. USB 3.0 and PCIe 4.0 slots! Version 1.2? Yes.', 'A 3.5 millimetres jack. USB 3.0 and P C I Express 4.0 slots! Version 1.2? Yes.');
/* a long text is still cut at the ends of sentences, never inside a number */
const long = 'The first sentence talks about 3.3 volts and 0.1 milliseconds at some length, so that it is long. '.repeat(4).trim();
const ps = SFX.pieces(long);
check(ps.length > 1 && ps.every(p => p.length <= 220 && /[.!?]$/.test(p)), 'a long text is cut into pieces at sentence ends: ' + JSON.stringify(ps));

/* every caption the site narrates */
const dctx = vm.createContext({ console });
vm.runInContext(read('js/scenes/device-anims.js'), dctx, { filename: 'js/scenes/device-anims.js' });
const { DEVICE_ANIMS } = vm.runInContext('({DEVICE_ANIMS})', dctx);
const captions = [];
for (const [k, a] of Object.entries(DEVICE_ANIMS)) a.steps.forEach((st, i) => captions.push([`${k} step ${i + 1}`, st.x]));
[...read('js/engine.js').matchAll(/say: '((?:[^'\\]|\\.)*)'/g)].forEach((m, i) => captions.push([`power-on step ${i + 1}`, m[1]]));
check(captions.length > 80, 'found the captions (' + captions.length + ')');
for (const [where, text] of captions) {
  const ps = SFX.pieces(text), all = ps.join(' ');
  const bad = [
    [/\d\.\s+\d/, 'a decimal number cut in two'], [/\b1 volts\b/, '"1 volts"'], [/\b(\w+) \1\b/i, 'a word said twice'],
    [/\*\*|#|_|→|×/, 'a symbol left over'], [/\bdx\b|\bdy\b/, 'dx or dy'], [/\b[DSV]RAM\b|\bPCIe\b|\bUEFI\b|\bI\/O\b|\bLED\b|\bM\.2\b|\b808[68]\b/, 'an abbreviation or a number a voice gets wrong'],
    [/\d\s?(?:V|ms|GB|MB)\b/, 'a unit not in words']
  ].filter(([re]) => re.test(all)).map(([, msg]) => msg);
  check(!bad.length, `${where}: ${bad.join(', ')}\n     said: ${JSON.stringify(all)}`);
  check(ps.every(p => p.length <= 220), `${where}: a piece longer than 220 characters`);
}
if (fails) { console.log(`${fails} speech check(s) failed.`); process.exit(1); }
console.log(`All speech checks passed (${captions.length} narrated captions).`);
