/* Assembles every example program plus a synthetic set covering all addressing
   modes, and writes each instruction's address, bytes and expected operands.
   build/test-8086-encoding.py then checks the bytes with the Capstone disassembler.
   Run: node build/gen-8086-encodings.mjs && python3 build/test-8086-encoding.py */
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = vm.createContext({});
for (const f of ['js/core.js', 'js/data/hardware.js', 'js/data/cpu.js', 'js/data/i8086.js', 'js/sim/i8086.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, {filename: f});
const { INSTR, I8086 } = vm.runInContext('({INSTR, I8086})', ctx);
const SYN = `var DW 1234h
buf DB 8 DUP(0)
MOV AX, [BX]
MOV AX, [BX+SI]
MOV AX, [BX+DI+4]
MOV AL, [BP]
MOV AL, [BP+DI-2]
MOV [SI+300], CX
MOV WORD PTR [DI], 1234h
MOV BYTE PTR ES:[DI], 7
MOV AX, ES:[BX]
MOV AX, SS:[BP]
MOV AX, CS:[SI]
MOV AX, DS:[BP+2]
MOV DS, AX
MOV AX, ES
MOV [BX], DS
MOV AX, var
MOV var, AX
MOV buf[SI], AL
MOV CL, buf+3
PUSH DS
POP ES
PUSH WORD PTR [BX]
POP WORD PTR [SI+2]
ADD BYTE PTR [BX+SI+1], 5
ADD WORD PTR [BP-4], 1000
ADD WORD PTR [BX], -1
ADD AX, -1
ADD SP, 2
SUB AX, [SI]
CMP [DI], AL
AND CL, [BX+DI+100h]
OR DX, 8000h
XOR BH, 0Fh
SBB SI, 1
ADC BYTE PTR var, 1
TEST BYTE PTR [SI], 80h
TEST [BX], CX
TEST AX, 1
TEST DL, 1
XCHG [BX], AX
XCHG CL, [SI]
XCHG SI, DI
XCHG BX, AX
INC BYTE PTR [DI]
DEC WORD PTR [BX+2]
INC SP
DEC AL
NEG WORD PTR [SI]
NOT BYTE PTR [BX]
MUL BYTE PTR [SI]
IDIV WORD PTR [BX+DI]
SHL WORD PTR [BX], 1
SAR BYTE PTR [SI], CL
ROL AX, CL
RCR DH, 1
LEA SI, [BX+DI+10]
LEA DX, var
LDS BX, [SI]
LES DI, [BP+2]
IN AX, DX
OUT DX, AX
IN AL, 60h
OUT 43h, AL
MOV DX, 3F8h
MOV BP, SP
CALL sub1
JMP BX
CALL SI
REP STOSW
REPNE SCASW
REPE CMPSW
LOCK INC WORD PTR [BX]
sub1: RET 4
RETN
INT 3
INT 21h
AAM 16
AAD 8
XLATB`;
/* a JMP that must become near, and loops at the edge of the short range */
const far = 'start: MOV CX, 3\nJMP over\n' + 'NOP\n'.repeat(140) + 'over: NOP\nLOOP over\nJE over\nJMP start\n';
const programs = [['synthetic', SYN], ['long jump', far]];
for (const [g, rows] of Object.entries(INSTR)) for (const [mn, , ex] of rows) programs.push([g + ' ' + mn, ex]);
const out = [];
for (const [name, src] of programs){
  const c = new I8086.CPU(); c.assemble(src);
  const P = c.prog;
  for (const I of P.ins){
    const ops = (I.ops || []).map(o => o.t === 'r' || o.t === 's' ? {k:'reg', v:o.name.toLowerCase()} : o.t === 'i' ? {k:'imm', v:o.v, size:o.size} :
      o.t === 'l' ? {k:'target', v:P.addr[o.v]} : {k:'mem', base:o.base, idx:o.idx, disp:o.disp & 0xFFFF, seg: o.ovr && o.ovr !== (o.base === 'BP' ? 'SS' : 'DS') ? o.ovr : null});
    out.push({prog:name, text:I.text, mn:I.mn, prefix:I.prefix || null, addr:I.addr, bytes:I.bytes.map(b => b[0]), roles:I.bytes.map(b => b[1]), ops, size: (I.ops[0] && I.ops[0].size) || (I.ops[1] && I.ops[1].size) || 16});
  }
}
/* the assembler must refuse a conditional jump that is out of range */
let farErr = '';
try { new I8086.CPU().assemble('top: NOP\n' + 'NOP\n'.repeat(140) + 'JE top'); } catch (e){ farErr = e.message; }
fs.writeFileSync('/tmp/8086-cases.json', JSON.stringify({cases: out, farErr}));
console.log(`${out.length} instructions from ${programs.length} programs written`);
