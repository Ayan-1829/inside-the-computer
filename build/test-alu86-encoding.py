"""Checks the 8086 ALU view's machine code with the Capstone disassembler.
Run: node build/gen-alu86-encodings.mjs && python3 build/test-alu86-encoding.py
(needs: pip install capstone)"""
import json, re, capstone
md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_16)
cases = json.load(open('/tmp/alu86-cases.json'))
ALIAS = {'cwde':'cbw', 'cdq':'cwd',   # Capstone uses the 32-bit names for 98h and 99h even in 16-bit mode
         'sal':'shl', 'jnae':'jb', 'jc':'jb', 'jnb':'jae', 'jnc':'jae', 'jz':'je', 'jnz':'jne', 'jna':'jbe', 'jnbe':'ja', 'jnge':'jl', 'jnl':'jge', 'jng':'jle', 'jnle':'jg', 'jpe':'jp', 'jpo':'jnp'}
def norm_ops(text, w):
    out = []
    for t in [x.strip() for x in text.split(',')] if text.strip() else []:
        t = t.lower().replace('byte ptr ', '').replace('word ptr ', '')
        m = re.fullmatch(r'\[(0x[0-9a-f]+|[0-9a-f]+h|\d+)\]', t)
        if m:
            v = m.group(1); n = int(v[:-1], 16) if v.endswith('h') else int(v, 0); out.append(('mem', n)); continue
        if re.fullmatch(r'-?(0x[0-9a-f]+|\d+)', t): out.append(('imm', int(t, 0) & (2**w - 1))); continue
        out.append(('reg', t))
    return out
bad, n = [], 0
for c in cases:
    code = bytes(b for b in c['bytes'] if b is not None)
    if c['op'].startswith('J'): code = code[:-1]          # drop the Jcc opcode; the CMP before it is what we check
    ins = list(md.disasm(code, 0))
    n += 1
    if len(ins) != 1 or ins[0].size != len(code):
        bad.append((c['asm'], ' '.join(f'{b:02X}' for b in code), 'decodes to ' + '; '.join(f'{i.mnemonic} {i.op_str}' for i in ins))); continue
    i = ins[0]
    exp_m, _, exp_o = c['asm'].partition(' ')
    exp_m = exp_m.lower(); got_m = ALIAS.get(i.mnemonic, i.mnemonic)
    if c['op'].startswith('J'): exp_m = 'cmp'
    w = 16 if 'word' in i.op_str or re.search(r'\b[abcd]x\b', i.op_str) else c['w']
    e, g = norm_ops(exp_o, w), norm_ops(i.op_str, w)
    same = e == g or (exp_m in ('xchg', 'test') and sorted(e) == sorted(g))       # both are symmetric
    if not same and len(e) == len(g) + 1 and e[-1] == ('imm', 1) and e[:-1] == g: same = True   # shift by 1 printed without ", 1"
    if not same and exp_m in ('aam', 'aad') and g == [('imm', 10)] and not e: same = True        # base 10 shown explicitly
    if exp_m == 'xchg' and e == [('reg','ax'), ('reg','ax')] and got_m == 'nop': continue       # XCHG AX, AX is the NOP byte 90h
    if ALIAS.get(exp_m, exp_m) != got_m or not same:
        bad.append((c['asm'], ' '.join(f'{b:02X}' for b in code), f'{i.mnemonic} {i.op_str}'))
for b in bad[:30]: print('MISMATCH', b)
print(f'{n} encodings checked with Capstone: ' + ('all match' if not bad else f'{len(bad)} mismatches'))
