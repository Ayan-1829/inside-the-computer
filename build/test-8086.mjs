/* Assembles and runs every example program in data/i8086.js and checks
   a set of known results against real 8086 behaviour.
   Run: node build/test-8086.mjs */
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = vm.createContext({});
for (const f of ['js/core.js','js/data/hardware.js','js/data/cpu.js','js/data/i8086.js','js/sim/i8086.js'])
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, {filename:f});
const { INSTR, I8086 } = vm.runInContext('({INSTR, I8086})', ctx);
let bad = 0, count = 0;
const run = src => { const c = new I8086.CPU(); c.assemble(src); let n = 0; while (!c.halted && n < 5000){ if (!c.step()) break; n++; if (c.paused) break; } return c; };
for (const [g, rows] of Object.entries(INSTR)) for (const [mn, , ex] of rows){
  count++;
  try { const c = run(ex); if (/error|unknown|cannot/i.test(c.note)) { bad++; console.log(`${g} ${mn}: ${c.note}`); } }
  catch (e){ bad++; console.log(`${g} ${mn}: ${e.message}`); }
}
/* known results (values checked against 8086 documentation) */
const H = I8086.hex, checks = [
  ['ADD AX,20h from FFF0', 'MOV AX, 0FFF0h\nADD AX, 20h', c => c.r.AX === 0x0010 && c.F('CF') === 1 && c.F('ZF') === 0],
  ['SUB 5-7', 'MOV AL, 5\nSUB AL, 7', c => c.reg('AL') === 0xFE && c.F('CF') === 1 && c.F('SF') === 1 && c.F('AF') === 1],
  ['signed overflow', 'MOV AL, 7Fh\nADD AL, 1', c => c.reg('AL') === 0x80 && c.F('OF') === 1 && c.F('CF') === 0 && c.F('AF') === 1],
  ['INC keeps CF', 'STC\nMOV AX, 0FFFFh\nINC AX', c => c.r.AX === 0 && c.F('CF') === 1 && c.F('ZF') === 1],
  ['NEG 5', 'MOV AX, 5\nNEG AX', c => c.r.AX === 0xFFFB && c.F('CF') === 1],
  ['MUL 8', 'MOV AL, 20\nMOV BL, 30\nMUL BL', c => c.r.AX === 600 && c.F('CF') === 1 && c.F('OF') === 1],
  ['MUL 16', 'MOV AX, 1000h\nMOV BX, 100h\nMUL BX', c => c.r.AX === 0 && c.r.DX === 0x10],
  ['IMUL -4*3', 'MOV AL, -4\nMOV BL, 3\nIMUL BL', c => c.r.AX === 0xFFF4 && c.F('CF') === 0],
  ['DIV 100/7', 'MOV AX, 100\nMOV BL, 7\nDIV BL', c => c.reg('AL') === 14 && c.reg('AH') === 2],
  ['IDIV -100/7', 'MOV AX, -100\nMOV BL, 7\nIDIV BL', c => c.reg('AL') === 0xF2 && c.reg('AH') === 0xFE],
  ['DIV by zero halts', 'MOV AX, 1\nMOV BL, 0\nDIV BL', c => c.halted && /Divide error/.test(c.note)],
  ['IDIV -128 errors on 8086', 'MOV AX, -128\nMOV BL, 1\nIDIV BL', c => c.halted && /Divide error/.test(c.note)],
  ['DAA 38+45', 'MOV AL, 38h\nADD AL, 45h\nDAA', c => c.reg('AL') === 0x83 && c.F('CF') === 0],
  ['DAA 99+01', 'MOV AL, 99h\nADD AL, 01h\nDAA', c => c.reg('AL') === 0x00 && c.F('CF') === 1],
  ['DAS 52-24', 'MOV AL, 52h\nSUB AL, 24h\nDAS', c => c.reg('AL') === 0x28],
  ['AAA 9+5', 'MOV AX, 0009h\nADD AL, 5\nAAA', c => c.r.AX === 0x0104 && c.F('CF') === 1],
  ['AAS 12-5', 'MOV AX, 0102h\nSUB AL, 5\nAAS', c => c.r.AX === 0x0007],
  ['AAM 42', 'MOV AL, 42\nAAM', c => c.r.AX === 0x0402],
  ['AAD 47', 'MOV AX, 0407h\nAAD', c => c.r.AX === 47],
  ['CBW', 'MOV AL, -2\nCBW', c => c.r.AX === 0xFFFE], ['CWD', 'MOV AX, -2\nCWD', c => c.r.DX === 0xFFFF],
  ['SHL 81', 'MOV AL, 81h\nSHL AL, 1', c => c.reg('AL') === 0x02 && c.F('CF') === 1 && c.F('OF') === 1],
  ['SHR 81', 'MOV AL, 81h\nSHR AL, 1', c => c.reg('AL') === 0x40 && c.F('CF') === 1 && c.F('OF') === 1],
  ['SAR 80 by 3', 'MOV AL, 80h\nMOV CL, 3\nSAR AL, CL', c => c.reg('AL') === 0xF0 && c.F('CF') === 0],
  ['ROL 81', 'MOV AL, 81h\nROL AL, 1', c => c.reg('AL') === 0x03 && c.F('CF') === 1],
  ['ROR 81', 'MOV AL, 81h\nROR AL, 1', c => c.reg('AL') === 0xC0 && c.F('CF') === 1],
  ['RCL 80 with CF', 'STC\nMOV AL, 80h\nRCL AL, 1', c => c.reg('AL') === 0x01 && c.F('CF') === 1],
  ['RCR 01 with CF', 'STC\nMOV AL, 01h\nRCR AL, 1', c => c.reg('AL') === 0x80 && c.F('CF') === 1],
  ['rotate keeps ZF', 'MOV AL, 0\nCMP AL, 0\nMOV AL, 1\nROL AL, 1', c => c.F('ZF') === 1],
  ['AND clears CF', 'STC\nMOV AL, 0F5h\nAND AL, 0Fh', c => c.reg('AL') === 5 && c.F('CF') === 0 && c.F('PF') === 1],
  ['XLAT', 'sq DB 0,1,4,9,16\nMOV BX, OFFSET sq\nMOV AL, 4\nXLAT', c => c.reg('AL') === 16],
  ['LAHF', 'STC\nLAHF', c => (c.reg('AH') & 0xD5) === 0x01],
  ['PUSHF sets top bits', 'PUSHF\nPOP AX', c => (c.r.AX & 0xF000) === 0xF000],
  ['PUSH SP pushes new SP', 'PUSH SP\nPOP AX', c => c.r.AX === 0x00FE],
  ['REP MOVSB', "s DB 'COPY'\nd DB 4 DUP(0)\nMOV SI, OFFSET s\nMOV DI, OFFSET d\nMOV CX, 4\nREP MOVSB", c => c.rd8(c.phys(c.s.DS, 7)) === 'Y'.charCodeAt(0) && c.r.CX === 0],
  ['REPE CMPSB stops at mismatch', "a DB 'CAT'\nb DB 'CAR'\nMOV SI, OFFSET a\nMOV DI, OFFSET b\nMOV CX, 3\nREPE CMPSB", c => c.r.CX === 0 && c.F('ZF') === 0 && c.F('CF') === 0],
  ['REPNE SCASB finds L', "t DB 'HELLO'\nMOV DI, OFFSET t\nMOV AL, 'L'\nMOV CX, 5\nREPNE SCASB", c => c.r.DI === 3 && c.r.CX === 2],
  ['STD counts down', "b DB 3 DUP(0)\nSTD\nMOV DI, 2\nMOV AL, 9\nMOV CX, 3\nREP STOSB", c => c.r.DI === 0xFFFF],
  ['LOOP sum', 'MOV CX, 5\nMOV AX, 0\ns: ADD AX, CX\nLOOP s', c => c.r.AX === 15 && c.r.CX === 0],
  ['CALL/RET', 'MOV AX, 3\nCALL d\nHLT\nd: ADD AX, AX\nRET', c => c.r.AX === 6 && c.r.SP === 0x100],
  ['INT 21h 09h', "m DB 'Hi!$'\nMOV DX, OFFSET m\nMOV AH, 09h\nINT 21h", c => c.out === 'Hi!'],
  ['INT handler + IRET', 'INT 5\nMOV AX, 1\nHLT\nINT5: MOV BX, 5\nIRET', c => c.r.BX === 5 && c.r.AX === 1 && c.r.SP === 0x100],
  ['JL signed', 'MOV AL, -5\nCMP AL, 2\nJL x\nMOV BL, 9\nHLT\nx: MOV BL, 1', c => c.reg('BL') === 1],
  ['JA unsigned', 'MOV AL, -5\nCMP AL, 2\nJA x\nMOV BL, 9\nHLT\nx: MOV BL, 1', c => c.reg('BL') === 1],
  ['LDS', 'p DW 0010h, 0120h\nLDS SI, p', c => c.r.SI === 0x10 && c.s.DS === 0x120],
  ['BP uses SS', 'MOV BP, SP\nMOV AX, 1234h\nPUSH AX\nMOV BX, [BP-2]', c => c.r.BX === 0x1234],
  ['segment override', 'MOV AX, 0300h\nMOV ES, AX\nMOV BYTE PTR ES:[0], 7\nMOV AL, ES:[0]', c => c.reg('AL') === 7],
];
const asmErrs = [['MOV DS, 100h','segment register'],['MOV AX, [CX]','BX, BP, SI and DI'],['SHL AL, 3','1 or CL'],['MOV [BX], 5','size is unclear'],['PUSH 5','16-bit'],['MOV AL, BX','different sizes'],['ADD [BX], [SI]','two memory']];
for (const [name, src, ok] of checks){ count++; try { const c = run(src); if (!ok(c)){ bad++; console.log('FAIL', name, 'AX=' + H(c.r.AX), 'BX=' + H(c.r.BX), 'flags=' + H(c.flags), c.note); } } catch (e){ bad++; console.log('FAIL', name, e.message); } }
for (const [src, want] of asmErrs){ count++; try { run(src); bad++; console.log('FAIL should reject:', src); } catch (e){ if (!e.message.includes(want)){ bad++; console.log('FAIL wrong message for', src, '→', e.message); } } }
console.log(bad ? `${bad} of ${count} checks failed.` : `All ${count} 8086 checks passed.`);
process.exit(bad ? 1 : 0);
