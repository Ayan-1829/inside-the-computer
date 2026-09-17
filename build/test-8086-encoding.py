"""Checks the emulator's machine code with the Capstone disassembler: opcode,
registers, memory operands (base, index, displacement, segment override),
immediates and jump targets. Needs: pip install capstone
Run: node build/gen-8086-encodings.mjs && python3 build/test-8086-encoding.py"""
import json, capstone
from capstone import x86
md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_16); md.detail = True
data = json.load(open('/tmp/8086-cases.json')); cases = data['cases']
ALIAS = {'cwde':'cbw', 'cdq':'cwd', 'sal':'shl', 'xlatb':'xlat', 'int3':'int', 'retn':'ret',
         'jc':'jb','jnae':'jb','jnb':'jae','jnc':'jae','jz':'je','jnz':'jne','jna':'jbe','jnbe':'ja','jnge':'jl','jnl':'jge','jng':'jle','jnle':'jg','jpe':'jp','jpo':'jnp',
         'loopz':'loope','loopnz':'loopne','repz':'repe','repnz':'repne'}
def cs_ops(i):
    res = []
    for o in i.operands:
        if o.type == x86.X86_OP_REG: res.append({'k':'reg', 'v': i.reg_name(o.reg)})
        elif o.type == x86.X86_OP_IMM: res.append({'k':'imm', 'v': o.imm & 0xFFFF})
        elif o.type == x86.X86_OP_MEM:
            m = o.mem
            res.append({'k':'mem', 'base': i.reg_name(m.base).upper() if m.base else None, 'idx': i.reg_name(m.index).upper() if m.index else None,
                        'disp': m.disp & 0xFFFF, 'seg': i.reg_name(m.segment).upper() if m.segment else None})
    return res
def same(e, g, mn, w):
    if e['k'] == 'target': return g['k'] == 'imm' and g['v'] == e['v']
    if e['k'] != g['k']: return False
    if e['k'] == 'reg': return e['v'] == g['v']
    if e['k'] == 'imm': m = 0xFF if w == 8 else 0xFFFF; return (e['v'] & m) == (g['v'] & m)
    # [SI] alone: Capstone names the single register 'base', we call it the index; the mode is the same
    return sorted(filter(None, (e['base'], e['idx']))) == sorted(filter(None, (g['base'], g['idx']))) and e['disp'] == g['disp'] and e['seg'] == g['seg']
bad = []; n = 0
for c in cases:
    code = bytes(c['bytes']); ins = list(md.disasm(code, c['addr'])); n += 1
    if len(ins) != 1 or ins[0].size != len(code):
        bad.append((c['prog'], c['text'], code.hex(' '), 'decodes to ' + '; '.join(f'{x.mnemonic} {x.op_str}' for x in ins))); continue
    i = ins[0]
    if c['mn'] == 'ESC': continue                                  # D8 C0 is an 8087 instruction; any ESC is fine
    got = i.mnemonic.split()
    exp = ([ALIAS.get(c['prefix'].lower(), c['prefix'].lower())] if c['prefix'] and c['prefix'] != 'LOCK' else []) + [c['mn'].lower()]
    if c['prefix'] == 'LOCK': exp = ['lock'] + exp
    exp = [ALIAS.get(x, x) for x in exp]; got = [ALIAS.get(x, x) for x in got]
    if c['prefix'] == 'REP' and c['mn'] in ('CMPSB','CMPSW','SCASB','SCASW'): exp[0] = 'repe'
    if exp != got and not (c['mn'] == 'XCHG' and got[-1] == 'nop'):
        bad.append((c['prog'], c['text'], code.hex(' '), f'mnemonic {i.mnemonic}')); continue
    e, g = c['ops'], cs_ops(i)
    if not e: continue                                             # implicit operands (MOVSB, XLAT, …): the opcode is enough
    if c['mn'] in ('AAM','AAD') and len(g) == 1: g = g if e else []
    if c['mn'] == 'INT' and code == b'\xcc' and not g: continue          # INT 3 is the one-byte CC (int3)
    ok = len(e) == len(g) and all(same(a, b, c['mn'], c['size']) for a, b in zip(e, g))
    if not ok and c['mn'] in ('XCHG', 'TEST') and len(e) == 2 and len(g) == 2: ok = same(e[0], g[1], c['mn'], c['size']) and same(e[1], g[0], c['mn'], c['size'])
    if not ok and c['mn'][:2] in ('SH','SA','RO','RC') and len(e) == 2 and len(g) == 1 and e[1] == {'k':'imm','v':1,'size':None}: ok = same(e[0], g[0], c['mn'], c['size'])
    if not ok and len(e) == 2 and len(g) == 2 and e[1]['k'] == 'imm' and e[1]['v'] == 1 and g[1]['k'] == 'imm': ok = same(e[0], g[0], c['mn'], c['size']) and g[1]['v'] == 1
    if not ok: bad.append((c['prog'], c['text'], code.hex(' '), f'{i.mnemonic} {i.op_str}', e, g))
for b in bad[:25]: print('MISMATCH', b)
far = 'conditional jump out of range is refused: ' + ('yes' if 'can only reach' in data['farErr'] else 'NO')
print(f'{n} instructions checked with Capstone: ' + ('all match' if not bad else f'{len(bad)} mismatches') + '; ' + far)
