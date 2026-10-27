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

/* Programs in the textbook (MASM/TASM) style the "Write your own" editor also accepts: .MODEL, .STACK,
   .DATA, .CODE, PROC/ENDP, MOV AX, @DATA and END <label>. */
const TEXTBOOK = [
  ['Hello, textbook style', `.model small        ; Allocates up to 64KB for code and 64KB for data
.stack 100h         ; Reserves 256 bytes (100h) for the program stack

.data               ; --- DATA SEGMENT: Declare variables here ---
    msg db 'Hello from the textbook!$', 0Dh, 0Ah   ; '$' marks the end of string for DOS

.code               ; --- CODE SEGMENT: Executable instructions go here ---
main proc
    mov ax, @data   ; Load the memory address of the data section into AX
    mov ds, ax      ; Move it into DS (cannot move directly to DS)
    mov dx, offset msg  ; Point DX to the memory address of our string
    mov ah, 09h         ; DOS function 09h: Write string to standard output
    int 21h             ; Trigger the interrupt to execute the print
    mov ah, 4Ch     ; DOS function 4Ch: Terminate process
    mov al, 00h     ; Return exit code 0 (success)
    int 21h         ; Trigger the interrupt to exit
main endp

end main            ; Tells the compiler where the program ends and starts`,
   c => c.out === 'Hello from the textbook!' && c.s.DS === 0x0100],
  ['Add two variables, textbook style', `.model small
.stack 100h
.data
    num1 db 15      ; Define first byte variable with a value of 15
    num2 db 20      ; Define second byte variable with a value of 20
    result db ?     ; '?' reserves 1 byte of uninitialized space for the answer
.code
main proc
    mov ax, @data
    mov ds, ax
    mov al, num1     ; Move the value of num1 (15) into the AL register
    add al, num2     ; Add the value of num2 (20) to AL (AL now equals 35)
    mov result, al   ; Store the final answer into the 'result' memory variable
    mov ah, 4Ch
    int 21h
main endp
end main`,
   c => c.mem[c.phys(c.s.DS, 2)] === 35 && c.reg('AL') === 35],
  ['A start label after a subroutine, .STACK 200h, and ; inside quotes', `.model small
.stack 200h
.data
    note db 'a;b$'
.code
helper proc
    mov dl, '!'
    mov ah, 02h
    int 21h
    ret
helper endp
main proc
    mov ax, @data
    mov ds, ax
    mov dx, offset note
    mov ah, 09h
    int 21h
    call helper
    mov ah, 4Ch
    int 21h
main endp
end main
anything after END is not assembled`,
   c => c.out === 'a;b!' && c.r.SP === 0x0200],
];
let tbad = 0;
for (const [name, src, check] of TEXTBOOK){
  const c = new I8086.CPU();
  try {
    c.assemble(src);
    let n = 0; while (!c.halted && n < 2000){ if (!c.step()) break; n++; }
    if (!c.halted || !/asked DOS to end/.test(c.note || '') || !check(c)){ tbad++; console.log(`FAIL "${name}": out=${JSON.stringify(c.out)} AX=${I8086.hex(c.r.AX,4)} SP=${I8086.hex(c.r.SP,4)} note: ${c.note}`); }
  } catch (e){ tbad++; console.log(`FAIL "${name}": ${e.message}`); }
}
{ const c = new I8086.CPU(); let msg = '';
  try { c.assemble('.code\nmain proc\n  mov ah, 4Ch\n  int 21h\nmain endp\nend mian'); } catch (e){ msg = e.message; }
  if (!/Line 6: END names MIAN/.test(msg)){ tbad++; console.log(`FAIL "END with a misspelled label": expected an error on line 6, got: ${msg || 'none'}`); } }
console.log(tbad ? `${tbad} textbook-style checks failed.` : `All ${TEXTBOOK.length + 1} textbook-style checks passed.`);
process.exit(bad || tbad ? 1 : 0);
