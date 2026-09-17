/* ==========================================================
   data/chips.js
   Level 5: real 74-series chips. Pinouts: labels[i] is pin i+1; kinds: i=input, o=output, p=power.
   Edit the text here, then run: node build/build.mjs
   ========================================================== */
/* ---------------- Level 5: physical logic ICs ---------------- */
var GATE14 = {labels:['1A','1B','1Y','2A','2B','2Y','GND','3Y','3A','3B','4Y','4A','4B','VCC'],kinds:'iioiiopoiioiip',
  units:[['Gate 1',[1,2,3]],['Gate 2',[4,5,6]],['Gate 3',[9,10,8]],['Gate 4',[12,13,11]]]};
var CHIPS = {
 'ic-7408':Object.assign({part:'74LS08',desc:'Quad 2-input AND',gate:'AND'},GATE14),
 'ic-7432':Object.assign({part:'74LS32',desc:'Quad 2-input OR',gate:'OR'},GATE14),
 'ic-7400':Object.assign({part:'74LS00',desc:'Quad 2-input NAND',gate:'NAND'},GATE14),
 'ic-7486':Object.assign({part:'74LS86',desc:'Quad 2-input XOR',gate:'XOR'},GATE14),
 'ic-7402':{part:'74LS02',desc:'Quad 2-input NOR',gate:'NOR',labels:['1Y','1A','1B','2Y','2A','2B','GND','3A','3B','3Y','4A','4B','4Y','VCC'],kinds:'oiioiipiioiiop',
   units:[['Gate 1',[2,3,1]],['Gate 2',[5,6,4]],['Gate 3',[8,9,10]],['Gate 4',[11,12,13]]]},
 'ic-7404':{part:'74LS04',desc:'Hex inverter',gate:'NOT',labels:['1A','1Y','2A','2Y','3A','3Y','GND','4Y','4A','5Y','5A','6Y','6A','VCC'],kinds:'ioioiopoioioip',
   units:[['1',[1,2]],['2',[3,4]],['3',[5,6]],['4',[9,8]],['5',[11,10]],['6',[13,12]]]},
 'ic-74283':{part:'74LS283',desc:'4-bit binary full adder',labels:['Σ2','B2','A2','Σ1','A1','B1','C0','GND','C4','Σ4','B4','A4','Σ3','A3','B3','VCC'],kinds:'oiioiiipooiioiip',
   units:[['Bit 1',[5,6,4]],['Bit 2',[3,2,1]],['Bit 3',[14,15,13]],['Bit 4',[12,11,10]],['Carry',[7,9]]]},
 'ic-74157':{part:'74LS157',desc:'Quad 2-to-1 multiplexer',labels:['A/B','1A','1B','1Y','2A','2B','2Y','GND','3Y','3B','3A','4Y','4B','4A','~G','VCC'],kinds:'iiioiiopoiioiiip',
   units:[['Mux 1',[2,3,4]],['Mux 2',[5,6,7]],['Mux 3',[11,10,9]],['Mux 4',[14,13,12]],['Control',[1,15]]]},
 'ic-7485':{part:'74LS85',desc:'4-bit magnitude comparator',labels:['B3','A<B in','A=B in','A>B in','A>B out','A=B out','A<B out','GND','B0','A0','B1','A1','A2','B2','A3','VCC'],kinds:'iiiiooopiiiiiiip',
   units:[['Bit 3',[15,1]],['Bit 2',[13,14]],['Bit 1',[12,11]],['Bit 0',[10,9]],['Outputs',[5,6,7]],['Cascade',[2,3,4]]]},
 'ic-7474':{part:'74LS74',desc:'Dual D flip-flop',labels:['~1CLR','1D','1CLK','~1PRE','1Q','~1Q','GND','~2Q','2Q','~2PRE','2CLK','2D','~2CLR','VCC'],kinds:'iiiioopooiiiip',
   units:[['Flip-flop 1',[1,2,3,4,5,6]],['Flip-flop 2',[13,12,11,10,9,8]]]},
};
function icDef(id, parent, extra){
  const c = CHIPS[id], pins = c.labels.length, vcc = pins, gnd = pins/2;
  const lc = c.desc[0].toLowerCase()+c.desc.slice(1), what = lc + (c.gate && c.gate!=='NOT' ? ' gates' : '');
  def(id, Object.assign({name:c.part+' chip',parent,level:5,scene:'ic',tip:`Real ${pins}-pin chip: ${what}`,
   short:`A real ${pins}-pin chip: ${what}.`,
   what:`The ${c.part} is an integrated circuit you can buy for a few cents and plug into a breadboard. Its ${pins}-pin package contains ${extra.inside}, sharing one power supply.`,
   does:`Connect +5 V to pin ${vcc} and ground to pin ${gnd}. ${extra.does}`,
   why:'Discrete logic chips let you see and test the same ideas that are hidden inside a processor. They are widely used in teaching labs and hobby-built computers.',
   ex:[[c.part,'Low-power Schottky TTL, 5 V'],[c.part.replace('LS','HC'),'CMOS version, 2–6 V, lower power'],[c.part.replace('LS','HCT'),'CMOS with TTL-compatible inputs'],['Makers','Texas Instruments, Nexperia, onsemi and others']],
   specs:[['Family','LS-TTL (low-power Schottky)'],['Supply','5 V (4.75–5.25 V)'],['Package',`DIP-${pins} (also surface-mount)`],['Contents',extra.contents],['Delay',extra.delay||'about 10–20 ns']],
   fact:extra.fact, ic:true, rel:[[parent,'The concept this chip implements']]}, extra.o||{}));
}

/* ---------------- Chips (Level 5) ---------------- */
var GATE_DOES = 'Each gate then works on its own: put logic levels on its input pins and read the result on its output pin.';
icDef('ic-7408','and-gate',{inside:'four separate 2-input AND gates',does:GATE_DOES,contents:'4 × 2-input AND',
  fact:'7400-series chips have been made since the 1960s, and many students still build complete 8-bit breadboard computers from them.'});
icDef('ic-7432','or-gate',{inside:'four separate 2-input OR gates',does:GATE_DOES,contents:'4 × 2-input OR',
  fact:'The 74LS32 has exactly the same pin layout as the 74LS08 and 74LS00, so a wrong chip in the right socket still “fits”. Always check the label.'});
icDef('ic-7404','not-gate',{inside:'six separate inverters (NOT gates)',does:'Each inverter has one input and one output. Unused inputs should be tied to a fixed level rather than left floating.',contents:'6 × inverter',
  fact:'Because it has six gates instead of four, the 74LS04 is called a “hex” inverter.'});
icDef('ic-7400','nand-gate',{inside:'four separate 2-input NAND gates',does:GATE_DOES,contents:'4 × 2-input NAND',
  fact:'The 7400 gave its number to the whole 7400 family, and since NAND is universal, a pile of 7400 chips alone is enough to build any logic circuit.'});
icDef('ic-7402','nor-gate',{inside:'four separate 2-input NOR gates',does:'Note that the 74LS02 has a different pin layout from the 74LS00: each output comes before its inputs.',contents:'4 × 2-input NOR',
  fact:'Unlike most 14-pin gate chips, the 74LS02 puts each gate’s output pin before its two inputs, a classic trap when wiring a breadboard.'});
icDef('ic-7486','xor-gate',{inside:'four separate 2-input XOR gates',does:GATE_DOES,contents:'4 × 2-input XOR',
  fact:'Paired with a 74LS283 adder, one 74LS86 turns the adder into a 4-bit adder-subtractor: the XOR gates invert B when you want to subtract.'});
icDef('ic-74283','adder',{inside:'a complete 4-bit adder with fast carry',does:'Put two 4-bit numbers on A1–A4 and B1–B4 and a carry on C0. The sum appears on Σ1–Σ4, and the carry-out on C4.',contents:'4-bit adder with fast carry',
  delay:'about 15–25 ns',fact:'Chain two 74LS283s, C4 into C0, and you have an 8-bit adder: exactly how many hobby breadboard CPUs do their arithmetic.'});
icDef('ic-74157','multiplexer',{inside:'four 2-to-1 multiplexers that share one select pin',does:'When the select pin (A/B, pin 1) is 0, every Y output copies its A input; when it is 1, the B inputs are passed. The enable pin (G, pin 15) must be held low.',contents:'4 × 2-to-1 mux, shared select'});
N['ic-74157'].fact = 'Because all four muxes share one select pin, a single 74LS157 can switch a whole 4-bit number between two sources at once.';
icDef('ic-7474','d-flip-flop',{inside:'two separate D flip-flops with preset and clear inputs',does:'On each rising edge of CLK, Q copies D. The active-low PRE and CLR pins force Q to 1 or 0 immediately.',contents:'2 × D flip-flop',
  fact:'Four 74LS74 chips give you eight flip-flops: enough to build one 8-bit register by hand.'});
icDef('ic-7485','comparator',{inside:'a complete 4-bit magnitude comparator',does:'Put the two numbers on A3–A0 and B3–B0. For a single chip, tie the cascade input “A=B in” (pin 3) high and the other two cascade inputs low. The answer appears on pins 5, 6 and 7.',contents:'4-bit magnitude comparator',
  delay:'about 20–30 ns',fact:'The three cascade inputs let several 74LS85 chips be chained: the chip handling the lower bits passes its verdict up to the next one, so you can compare 8, 12 or 16-bit numbers.'});

/* ==========================================================
   More real chips, with pin diagrams and internal structure.
   Fields: part, desc, labels (pin 1 first), kinds (one letter per pin:
   i input, o output, b bidirectional, p power, n not connected / other),
   units ([[name, [pins]]] for the highlight buttons), power (pins),
   pkg (package name), to220 (3-pin regulator drawing),
   inside: 'gates' (drawn automatically from the gate units) or a block
   diagram {cols:[[{id,t,s,k}]], arrows:[[from,to,'both']], left/right/bottom:
   [[label, kind, blockId(s)]], groups:[[title,[ids]]]}. "\n" breaks lines.
   Pinouts follow the classic manufacturer datasheets. Always check the
   datasheet for your exact part before wiring a circuit.
   ========================================================== */
['ic-7408','ic-7432','ic-7400','ic-7486','ic-7402','ic-7404'].forEach(id => CHIPS[id].inside = 'gates');
Object.assign(CHIPS['ic-74283'], {inside:{cols:[[{id:'a',t:'Inputs A1–A4\nand B1–B4'}],[{id:'fa',t:'4 full adders',s:'one per bit',k:'acc'},{id:'cla',t:'Fast carry\nlogic',s:'look-ahead'}],[{id:'s',t:'Sum outputs'},{id:'co',t:'Carry out'}]],
  arrows:[['a','fa'],['fa','s'],['a','cla'],['cla','fa'],['cla','co']], left:[['A1–A4, B1–B4','in','a']], right:[['Σ1–Σ4','out','s'],['C4','out','co']], bottom:[['C0 (carry in)','in','cla']]}});
Object.assign(CHIPS['ic-74157'], {inside:{cols:[[{id:'in',t:'Inputs',s:'1A–4A, 1B–4B'}],[{id:'m1',t:'2-to-1 mux',s:'× 4',k:'acc'}],[{id:'y',t:'Outputs',s:'1Y–4Y'}]],
  arrows:[['in','m1'],['m1','y']], left:[['1A–4A, 1B–4B','in','in']], right:[['1Y–4Y','out','y']], bottom:[['A/B select, G enable','in','m1']]}});
Object.assign(CHIPS['ic-7474'], {inside:{cols:[[{id:'f1',t:'D flip-flop 1',s:'positive-edge triggered',k:'acc'},{id:'f2',t:'D flip-flop 2',s:'positive-edge triggered',k:'acc'}]],
  arrows:[], left:[['1D, 1CLK, 1PRE, 1CLR','in','f1'],['2D, 2CLK, 2PRE, 2CLR','in','f2']], right:[['1Q, 1Q̄','out','f1'],['2Q, 2Q̄','out','f2']]}});
Object.assign(CHIPS['ic-7485'], {inside:{cols:[[{id:'in',t:'A3–A0, B3–B0'}],[{id:'eq',t:'Bit compare',s:'4 XNOR gates',k:'acc'},{id:'mag',t:'Magnitude logic',s:'first differing bit wins'}],[{id:'cas',t:'Cascade logic'}]],
  arrows:[['in','eq'],['eq','mag'],['mag','cas']], left:[['A3–A0, B3–B0','in','in']], right:[['A>B, A=B, A<B','out','cas']], bottom:[['cascade inputs','in','cas']]}});
CHIPS['ic-7404'].units.forEach(u => u[0] = 'Inverter ' + u[0]);

const GATE_INSIDE = 'gates';
Object.assign(CHIPS, {
 'ic-74266':{part:'74LS266',desc:'Quad 2-input XNOR, open collector',gate:'XNOR',labels:['1A','1B','1Y','2Y','2A','2B','GND','3A','3B','3Y','4Y','4A','4B','VCC'],kinds:'iiooiipiiooiip',
   units:[['Gate 1',[1,2,3]],['Gate 2',[5,6,4]],['Gate 3',[8,9,10]],['Gate 4',[12,13,11]]],inside:GATE_INSIDE},
 'ic-8086':{part:'8086',desc:'16-bit microprocessor',labels:['GND','AD14','AD13','AD12','AD11','AD10','AD9','AD8','AD7','AD6','AD5','AD4','AD3','AD2','AD1','AD0','NMI','INTR','CLK','GND',
   'RESET','READY','~TEST','~INTA','ALE','~DEN','DT/~R','M/~IO','~WR','HLDA','HOLD','~RD','MN/~MX','~BHE/S7','A19/S6','A18/S5','A17/S4','A16/S3','AD15','VCC'],
   kinds:'pbbbbbbbbbbbbbbbiiipiiioooooooioiooooobp', power:[1,20,40], pkg:'DIP-40',
   units:[['Address/data',[2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,39]],['Address/status',[34,35,36,37,38]],['Bus control',[24,25,26,27,28,29,32]],['Interrupts',[17,18,23]],['Clock, reset',[19,21,22]],['Bus hold',[30,31]],['Mode',[33]]],
   inside:{groups:[['Bus interface unit (BIU)',['bus','sum','seg','ip','q']],['Execution unit (EU)',['ctl','alu','flags','regs']]],
     cols:[[{id:'bus',t:'Bus control',s:'multiplexed bus',k:'acc'},{id:'sum',t:'Address adder',s:'segment × 16\n+ offset'}],
           [{id:'seg',t:'Segment regs',s:'CS DS SS ES'},{id:'ip',t:'IP'},{id:'q',t:'Instruction\nqueue',s:'6 bytes'}],
           [{id:'ctl',t:'EU control',s:'decodes\ninstructions'},{id:'alu',t:'ALU',s:'16-bit',k:'acc'},{id:'flags',t:'Flags',s:'O D I T S Z A P C'}],
           [{id:'regs',t:'General\nregisters',s:'AX BX CX DX\nSP BP SI DI'}]],
     arrows:[['sum','bus'],['seg','sum'],['ip','sum'],['bus','q'],['q','ctl'],['ctl','alu'],['alu','regs','both'],['alu','flags']],
     left:[['AD0–AD15','bi','bus'],['A16–A19, BHE','out','bus'],['RD, WR, M/IO, ALE','out','bus']], bottom:[['CLK, RESET, READY','in','ctl'],['NMI, INTR','in','ctl']]}},
 'ic-8088':{part:'8088',desc:'16-bit CPU, 8-bit bus',labels:['GND','A14','A13','A12','A11','A10','A9','A8','AD7','AD6','AD5','AD4','AD3','AD2','AD1','AD0','NMI','INTR','CLK','GND',
   'RESET','READY','~TEST','~INTA','ALE','~DEN','DT/~R','IO/~M','~WR','HLDA','HOLD','~RD','MN/~MX','~SS0','A19/S6','A18/S5','A17/S4','A16/S3','A15','VCC'],
   kinds:'pooooooobbbbbbbbiiipiiioooooooioioooooop', power:[1,20,40], pkg:'DIP-40',
   units:[['Address/data',[9,10,11,12,13,14,15,16]],['Address',[2,3,4,5,6,7,8,39,35,36,37,38]],['Bus control',[24,25,26,27,28,29,32,34]],['Interrupts',[17,18,23]],['Clock, reset',[19,21,22]],['Bus hold',[30,31]],['Mode',[33]]],
   inside:{groups:[['Bus interface unit (BIU)',['bus','sum','seg','ip','q']],['Execution unit (EU)',['ctl','alu','flags','regs']]],
     cols:[[{id:'bus',t:'Bus control',s:'8-bit data bus',k:'acc'},{id:'sum',t:'Address adder',s:'segment × 16\n+ offset'}],
           [{id:'seg',t:'Segment regs',s:'CS DS SS ES'},{id:'ip',t:'IP'},{id:'q',t:'Instruction\nqueue',s:'4 bytes'}],
           [{id:'ctl',t:'EU control',s:'decodes\ninstructions'},{id:'alu',t:'ALU',s:'16-bit',k:'acc'},{id:'flags',t:'Flags',s:'O D I T S Z A P C'}],
           [{id:'regs',t:'General\nregisters',s:'AX BX CX DX\nSP BP SI DI'}]],
     arrows:[['sum','bus'],['seg','sum'],['ip','sum'],['bus','q'],['q','ctl'],['ctl','alu'],['alu','regs','both'],['alu','flags']],
     left:[['AD0–AD7','bi','bus'],['A8–A19','out','bus'],['RD, WR, IO/M, ALE','out','bus']], bottom:[['CLK, RESET, READY','in','ctl'],['NMI, INTR','in','ctl']]}},
 'ic-z80':{part:'Z80',desc:'8-bit microprocessor',labels:['A11','A12','A13','A14','A15','CLK','D4','D3','D5','D6','+5V','D2','D7','D0','D1','~INT','~NMI','~HALT','~MREQ','~IORQ',
   '~RD','~WR','~BUSACK','~WAIT','~BUSREQ','~RESET','~M1','~RFSH','GND','A0','A1','A2','A3','A4','A5','A6','A7','A8','A9','A10'],
   kinds:'oooooibbbbpbbbbiiooooooiiioopooooooooooo', power:[11,29], pkg:'DIP-40',
   units:[['Address bus',[30,31,32,33,34,35,36,37,38,39,40,1,2,3,4,5]],['Data bus',[14,15,12,8,7,9,10,13]],['Memory / I/O',[19,20,21,22,27,28]],['Interrupts',[16,17]],['CPU control',[18,24,26]],['Bus sharing',[23,25]],['Clock',[6]]],
   inside:{cols:[[{id:'dbi',t:'Data bus\ninterface',k:'acc'}],[{id:'ir',t:'Instruction\nregister'},{id:'dec',t:'Decoder and\ncontrol'}],[{id:'alu',t:'ALU',s:'8-bit',k:'acc'},{id:'regs',t:'Registers',s:'A F B C D E H L\n+ a second set,\nIX, IY, SP'}],[{id:'addr',t:'Address\nbuffers',s:'PC, SP'}]],
     arrows:[['dbi','ir'],['ir','dec'],['dec','alu'],['alu','regs','both'],['regs','addr'],['dbi','alu','both']],
     left:[['D0–D7','bi','dbi']], right:[['A0–A15','out','addr']], bottom:[['RD, WR, MREQ, IORQ, M1','out','dec'],['INT, NMI, WAIT, RESET','in','dec']]}},
 'ic-6502':{part:'6502',desc:'8-bit microprocessor',labels:['VSS','RDY','Φ1','~IRQ','NC','~NMI','SYNC','VCC','A0','A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11',
   'VSS','A12','A13','A14','A15','D7','D6','D5','D4','D3','D2','D1','D0','R/~W','NC','NC','Φ0','SO','Φ2','~RES'],
   kinds:'pioiniopoooooooooooopoooobbbbbbbbonniioi', power:[1,8,21], pkg:'DIP-40',
   units:[['Address bus',[9,10,11,12,13,14,15,16,17,18,19,20,22,23,24,25]],['Data bus',[26,27,28,29,30,31,32,33]],['Interrupts',[4,6]],['Control',[2,7,34,38,40]],['Clock',[3,37,39]],['Not connected',[5,35,36]]],
   inside:{cols:[[{id:'dbb',t:'Data bus\nbuffer',k:'acc'}],[{id:'ir',t:'Instruction\nregister'},{id:'pla',t:'Decode (PLA)\nand timing'}],[{id:'alu',t:'ALU',s:'8-bit',k:'acc'},{id:'regs',t:'Registers',s:'A  X  Y  S  P'}],[{id:'pc',t:'Program\ncounter',s:'16-bit'},{id:'ab',t:'Address\nbuffers'}]],
     arrows:[['dbb','ir'],['ir','pla'],['pla','alu'],['alu','regs','both'],['pc','ab'],['dbb','alu','both']],
     left:[['D0–D7','bi','dbb']], right:[['A0–A15','out','ab']], bottom:[['IRQ, NMI, RES, RDY','in','pla'],['R/W, SYNC','out','pla']]}},
 'ic-6116':{part:'6116',desc:'2K × 8 static RAM',labels:['A7','A6','A5','A4','A3','A2','A1','A0','D0','D1','D2','GND','D3','D4','D5','D6','D7','~CS','A10','~OE','~WE','A9','A8','VCC'],
   kinds:'iiiiiiiibbbpbbbbbiiiiiip', pkg:'DIP-24', units:[['Address',[8,7,6,5,4,3,2,1,23,22,19]],['Data',[9,10,11,13,14,15,16,17]],['Control',[18,20,21]]],
   inside:{cols:[[{id:'row',t:'Row decoder'},{id:'cd',t:'Column decoder'}],[{id:'arr',t:'Memory array',s:'16,384 SRAM cells',k:'acc'},{id:'col',t:'Column I/O',s:'sense amplifiers'}],[{id:'io',t:'Data buffers'},{id:'ctl',t:'Control logic',s:'read / write'}]],
     arrows:[['row','arr'],['cd','col'],['arr','col','both'],['col','io','both'],['ctl','io']], left:[['A0–A10','in',['row','cd']]], right:[['D0–D7','bi','io']], bottom:[['CS, OE, WE','in','ctl']]}},
 'ic-62256':{part:'62256',desc:'32K × 8 static RAM',labels:['A14','A12','A7','A6','A5','A4','A3','A2','A1','A0','D0','D1','D2','GND','D3','D4','D5','D6','D7','~CS','A10','~OE','A11','A9','A8','A13','~WE','VCC'],
   kinds:'iiiiiiiiiibbbpbbbbbiiiiiiiip', pkg:'DIP-28', units:[['Address',[10,9,8,7,6,5,4,3,25,24,21,23,2,26,1]],['Data',[11,12,13,15,16,17,18,19]],['Control',[20,22,27]]],
   inside:{cols:[[{id:'row',t:'Row decoder'},{id:'cd',t:'Column decoder'}],[{id:'arr',t:'Memory array',s:'262,144 SRAM cells',k:'acc'},{id:'col',t:'Column I/O',s:'sense amplifiers'}],[{id:'io',t:'Data buffers'},{id:'ctl',t:'Control logic',s:'read / write'}]],
     arrows:[['row','arr'],['cd','col'],['arr','col','both'],['col','io','both'],['ctl','io']], left:[['A0–A14','in',['row','cd']]], right:[['D0–D7','bi','io']], bottom:[['CS, OE, WE','in','ctl']]}},
 'ic-4164':{part:'4164',desc:'64K × 1 dynamic RAM',labels:['NC','D','~W','~RAS','A0','A2','A1','VCC','A7','A5','A4','A3','A6','Q','~CAS','VSS'],
   kinds:'niiiiiipiiiiioip', power:[8,16], pkg:'DIP-16', units:[['Address (row, then column)',[5,7,6,12,11,10,13,9]],['Data in / out',[2,14]],['Strobes',[4,15,3]]],
   inside:{cols:[[{id:'ral',t:'Row\nlatch',s:'captured\nby RAS'},{id:'cal',t:'Column\nlatch',s:'captured\nby CAS'}],[{id:'rd',t:'Row\ndecoder'},{id:'cd',t:'Column\ndecoder'}],[{id:'arr',t:'Memory\narray',s:'65,536 cells:\ntransistor +\ncapacitor',k:'acc'},{id:'sa',t:'Sense amps\nand refresh'}],[{id:'io',t:'Data in / out'}]],
     arrows:[['ral','rd'],['cal','cd'],['rd','arr'],['cd','sa'],['arr','sa','both'],['sa','io','both']], left:[['A0–A7','in',['ral','cal']],['RAS','in','ral'],['CAS','in','cal']], right:[['D in, Q out','bi','io']], bottom:[['W (write)','in','io']]}},
 'ic-27c256':{part:'27C256',desc:'32K × 8 EPROM',labels:['VPP','A12','A7','A6','A5','A4','A3','A2','A1','A0','O0','O1','O2','GND','O3','O4','O5','O6','O7','~CE','A10','~OE','A11','A9','A8','A13','A14','VCC'],
   kinds:'piiiiiiiiiooopoooooiiiiiiiip', power:[1,14,28], pkg:'DIP-28', units:[['Address',[10,9,8,7,6,5,4,3,25,24,21,23,2,26,27]],['Data out',[11,12,13,15,16,17,18,19]],['Control',[20,22]]],
   inside:{cols:[[{id:'row',t:'Row decoder'},{id:'cd',t:'Column decoder'}],[{id:'arr',t:'EPROM array',s:'262,144 floating-\ngate cells',k:'acc'},{id:'col',t:'Column select',s:'and programming'}],[{id:'out',t:'Output\nbuffers'},{id:'ctl',t:'Chip and\noutput enable'}]],
     arrows:[['row','arr'],['cd','col'],['arr','col'],['col','out'],['ctl','out']], left:[['A0–A14','in',['row','cd']]], right:[['O0–O7','out','out']], bottom:[['VPP (program)','pwr','col'],['CE, OE','in','ctl']]}},
 'ic-w25q128':{part:'W25Q128',desc:'128 Mbit SPI flash',labels:['~CS','DO','~WP','GND','DI','CLK','~HOLD','VCC'],kinds:'ioipiiip', pkg:'SOIC-8',
   units:[['SPI bus',[1,2,5,6]],['Protect / hold',[3,7]]],
   inside:{cols:[[{id:'spi',t:'SPI interface\nand control',k:'acc'}],[{id:'st',t:'Status\nregisters'},{id:'adr',t:'Address\ncounter'}],[{id:'buf',t:'Page buffer',s:'256 bytes'},{id:'hv',t:'High-voltage\ngenerator'}],[{id:'arr',t:'Flash array',s:'16 MB',k:'acc'}]],
     arrows:[['spi','st','both'],['spi','adr'],['adr','buf'],['buf','arr','both'],['hv','arr']], left:[['CS, CLK, DI','in','spi'],['DO','out','spi']], bottom:[['WP, HOLD','in','spi']]}},
 'ic-24c02':{part:'24C02',desc:'2 Kbit I²C EEPROM',labels:['A0','A1','A2','GND','SDA','SCL','WP','VCC'],kinds:'iiipbiip', pkg:'DIP-8 / SOIC-8',
   units:[['Chip address',[1,2,3]],['I²C bus',[5,6]],['Write protect',[7]]],
   inside:{cols:[[{id:'i2c',t:'I²C interface',s:'start / stop,\nacknowledge',k:'acc'}],[{id:'cnt',t:'Word address\ncounter'},{id:'cmp',t:'Device address\ncompare'}],[{id:'arr',t:'EEPROM array',s:'256 × 8',k:'acc'},{id:'wp',t:'Write control',s:'charge pump'}]],
     arrows:[['i2c','cnt','both'],['i2c','cmp'],['cnt','arr','both'],['wp','arr']], left:[['SDA','bi','i2c'],['SCL','in','i2c']], bottom:[['A0–A2','in','cmp'],['WP','in','wp']]}},
 'ic-555':{part:'NE555',desc:'Timer',labels:['GND','TRIG','OUT','~RESET','CTRL','THR','DIS','VCC'],kinds:'pioiiiop', power:[1,8], pkg:'DIP-8',
   units:[['Timing inputs',[2,6]],['Output',[3]],['Discharge',[7]],['Reset, control',[4,5]]],
   inside:{cols:[[{id:'div',t:'Voltage divider',s:'three 5 kΩ resistors:\n⅓ and ⅔ of VCC'}],[{id:'c1',t:'Comparator 1',s:'THR above ⅔ VCC?'},{id:'c2',t:'Comparator 2',s:'TRIG below ⅓ VCC?'}],[{id:'ff',t:'Flip-flop',s:'set / reset',k:'acc'}],[{id:'out',t:'Output stage'},{id:'dis',t:'Discharge\ntransistor'}]],
     arrows:[['div','c1'],['div','c2'],['c1','ff'],['c2','ff'],['ff','out'],['ff','dis']], left:[['CTRL','in','div']], right:[['OUT','out','out'],['DIS','out','dis']], bottom:[['THR','in','c1'],['TRIG','in','c2'],['RESET','in','ff']]}},
 'ic-74161':{part:'74LS161',desc:'4-bit binary counter',labels:['~CLR','CLK','A','B','C','D','ENP','GND','~LOAD','ENT','QD','QC','QB','QA','RCO','VCC'],kinds:'iiiiiiipiiooooop',
   units:[['Load inputs',[3,4,5,6]],['Outputs',[14,13,12,11]],['Count control',[2,7,10,15]],['Load, clear',[1,9]]],
   inside:{cols:[[{id:'in',t:'Load inputs',s:'A B C D'}],[{id:'nx',t:'Next-state logic',s:'count up or load'},{id:'ca',t:'Carry logic'}],[{id:'ff',t:'4 flip-flops',k:'acc'}]],
     arrows:[['in','nx'],['nx','ff'],['ff','nx'],['ff','ca']], left:[['A–D','in','in']], right:[['QA–QD','out','ff'],['RCO','out','ca']], bottom:[['CLK, CLR, LOAD','in','ff'],['ENP, ENT','in','nx']]}},
 'ic-74138':{part:'74LS138',desc:'3-to-8 line decoder',labels:['A','B','C','~G2A','~G2B','G1','~Y7','GND','~Y6','~Y5','~Y4','~Y3','~Y2','~Y1','~Y0','VCC'],kinds:'iiiiiiopooooooop',
   units:[['Select inputs',[1,2,3]],['Enables',[6,4,5]],['Outputs',[15,14,13,12,11,10,9,7]]],
   inside:{cols:[[{id:'buf',t:'Input buffers',s:'A, B, C and\ntheir inverses'}],[{id:'dec',t:'8 NAND gates',s:'one per output',k:'acc'},{id:'en',t:'Enable logic',s:'G1 · G2A̅ · G2B̅'}],[{id:'y',t:'Outputs',s:'active low'}]],
     arrows:[['buf','dec'],['en','dec'],['dec','y']], left:[['A, B, C','in','buf']], right:[['Y0–Y7','out','y']], bottom:[['G1, G2A, G2B','in','en']]}},
 'ic-74245':{part:'74LS245',desc:'Octal bus transceiver',labels:['DIR','A1','A2','A3','A4','A5','A6','A7','A8','GND','B8','B7','B6','B5','B4','B3','B2','B1','~OE','VCC'],kinds:'ibbbbbbbbpbbbbbbbbip',
   units:[['A side',[2,3,4,5,6,7,8,9]],['B side',[18,17,16,15,14,13,12,11]],['Control',[1,19]]],
   inside:{cols:[[{id:'a',t:'A1–A8'}],[{id:'ab',t:'8 buffers A → B',k:'acc'},{id:'ba',t:'8 buffers B → A',k:'acc'},{id:'ctl',t:'Direction and\nenable logic'}],[{id:'b',t:'B1–B8'}]],
     arrows:[['a','ab'],['ab','b'],['b','ba'],['ba','a'],['ctl','ba']], left:[['A1–A8','bi','a']], right:[['B1–B8','bi','b']], bottom:[['DIR, OE','in','ctl']]}},
 'ic-74373':{part:'74LS373',desc:'Octal latch, 3-state',labels:['~OC','1Q','1D','2D','2Q','3Q','3D','4D','4Q','GND','LE','5Q','5D','6D','6Q','7Q','7D','8D','8Q','VCC'],kinds:'ioiiooiiopioiiooiiop',
   units:[['D inputs',[3,4,7,8,13,14,17,18]],['Q outputs',[2,5,6,9,12,15,16,19]],['Control',[1,11]]],
   inside:{cols:[[{id:'d',t:'D inputs'}],[{id:'lat',t:'8 D latches',s:'transparent while LE = 1',k:'acc'},{id:'ctl',t:'Latch enable'}],[{id:'buf',t:'3-state output\nbuffers'}]],
     arrows:[['d','lat'],['lat','buf'],['ctl','lat']], left:[['1D–8D','in','d']], right:[['1Q–8Q','out','buf']], bottom:[['LE','in','ctl'],['OC (output control)','in','buf']]}},
 'ic-74273':{part:'74LS273',desc:'Octal D flip-flop with clear',labels:['~CLR','1Q','1D','2D','2Q','3Q','3D','4D','4Q','GND','CLK','5Q','5D','6D','6Q','7Q','7D','8D','8Q','VCC'],kinds:'ioiiooiiopioiiooiiop',
   units:[['D inputs',[3,4,7,8,13,14,17,18]],['Q outputs',[2,5,6,9,12,15,16,19]],['Clock, clear',[11,1]]],
   inside:{cols:[[{id:'d',t:'D inputs'}],[{id:'ff',t:'8 D flip-flops',s:'rising-edge triggered',k:'acc'}],[{id:'q',t:'Q outputs'}]],
     arrows:[['d','ff'],['ff','q']], left:[['1D–8D','in','d']], right:[['1Q–8Q','out','q']], bottom:[['CLK, CLR','in','ff']]}},
 'ic-74181':{part:'74LS181',desc:'4-bit ALU, 32 functions',labels:['B0','A0','S3','S2','S1','S0','Cn','M','F0','F1','F2','GND','F3','A=B','P','Cn+4','G','B3','A3','B2','A2','B1','A1','VCC'],kinds:'iiiiiiiiooopoooooiiiiiip',
   units:[['A inputs',[2,23,21,19]],['B inputs',[1,22,20,18]],['Function select',[6,5,4,3,8]],['Carry in',[7]],['F outputs',[9,10,11,13]],['Look-ahead, A=B',[15,16,17,14]]],
   inside:{cols:[[{id:'in',t:'A0–A3, B0–B3'}],[{id:'fn',t:'Function\ngenerator',s:'16 logic or\n16 arithmetic',k:'acc'},{id:'sel',t:'Select decode',s:'S0–S3, M'}],[{id:'cla',t:'Carry\nlook-ahead'},{id:'out',t:'Outputs'}]],
     arrows:[['in','fn'],['sel','fn'],['fn','cla'],['fn','out'],['cla','out']], left:[['A0–A3, B0–B3','in','in']], right:[['F0–F3, A=B','out','out'],['P, G, Cn+4','out','cla']], bottom:[['S0–S3, M','in','sel'],['Cn','in','cla']]}},
 'ic-74194':{part:'74LS194',desc:'4-bit universal shift register',labels:['~CLR','SR','A','B','C','D','SL','GND','S0','S1','CLK','QD','QC','QB','QA','VCC'],kinds:'iiiiiiipiiioooop',
   units:[['Parallel in',[3,4,5,6]],['Serial in',[2,7]],['Mode',[9,10]],['Outputs',[15,14,13,12]],['Clock, clear',[11,1]]],
   inside:{cols:[[{id:'in',t:'Inputs',s:'A–D, SR, SL'}],[{id:'mux',t:'4 × 4-to-1 mux',s:'hold, right, left, load',k:'acc'},{id:'mode',t:'Mode control'}],[{id:'ff',t:'4 flip-flops',k:'acc'}]],
     arrows:[['in','mux'],['mode','mux'],['mux','ff'],['ff','mux']], left:[['A–D, SR, SL','in','in']], right:[['QA–QD','out','ff']], bottom:[['S0, S1','in','mode'],['CLK, CLR','in','ff']]}},
 'ic-74151':{part:'74LS151',desc:'8-to-1 data selector',labels:['D3','D2','D1','D0','Y','~W','~G','GND','C','B','A','D7','D6','D5','D4','VCC'],kinds:'iiiiooipiiiiiiip',
   units:[['Data inputs',[4,3,2,1,15,14,13,12]],['Select',[11,10,9]],['Outputs',[5,6]],['Enable',[7]]],
   inside:{cols:[[{id:'d',t:'D0–D7'}],[{id:'sel',t:'8-to-1 selector',s:'one AND gate per input,\nthen an 8-input OR',k:'acc'},{id:'dec',t:'Select decode',s:'A, B, C'}],[{id:'y',t:'Y and W (= Y̅)'}]],
     arrows:[['d','sel'],['dec','sel'],['sel','y']], left:[['D0–D7','in','d']], right:[['Y, W','out','y']], bottom:[['A, B, C','in','dec'],['G (enable)','in','sel']]}},
 'ic-7805':{part:'7805',desc:'5 V voltage regulator',labels:['IN','GND','OUT'],kinds:'ipo',power:[],pkg:'TO-220',to220:true,
   units:[['Input',[1]],['Ground',[2]],['Output',[3]]],
   inside:{cols:[[{id:'ref',t:'Voltage\nreference',s:'band-gap'}],[{id:'amp',t:'Error\namplifier',k:'acc'},{id:'prot',t:'Protection',s:'current limit,\nthermal shutdown'}],[{id:'pass',t:'Pass\ntransistor',k:'acc'}]],
     arrows:[['ref','amp'],['amp','pass'],['prot','pass'],['pass','amp']], left:[['IN (7–25 V)','in','pass']], right:[['OUT (5 V)','out','pass']], bottom:[['GND','pwr','ref']]}},
 'ic-lm317':{part:'LM317',desc:'Adjustable regulator',labels:['ADJ','OUT','IN'],kinds:'ioi',power:[],pkg:'TO-220',to220:true,
   units:[['Adjust',[1]],['Output',[2]],['Input',[3]]],
   inside:{cols:[[{id:'ref',t:'1.25 V\nreference'}],[{id:'amp',t:'Error\namplifier',k:'acc'},{id:'prot',t:'Protection',s:'current limit,\nthermal shutdown'}],[{id:'pass',t:'Pass\ntransistor',k:'acc'}]],
     arrows:[['ref','amp'],['amp','pass'],['prot','pass'],['pass','amp']], left:[['IN','in','pass']], right:[['OUT','out','pass']], bottom:[['ADJ (to resistor divider)','in','ref']]}},
 'ic-lm386':{part:'LM386',desc:'Low-voltage audio amplifier',labels:['GAIN','−IN','+IN','GND','VOUT','VS','BYPASS','GAIN'],kinds:'iiipopii',power:[4,6],pkg:'DIP-8',
   units:[['Inputs',[2,3]],['Output',[5]],['Gain set',[1,8]],['Bypass',[7]]],
   inside:{cols:[[{id:'in',t:'Differential\ninput stage',k:'acc'}],[{id:'gain',t:'Gain stage',s:'20 × (up to 200 ×)'}],[{id:'out',t:'Push-pull\noutput stage',k:'acc'}]],
     arrows:[['in','gain'],['gain','out']], left:[['+IN, −IN','in','in']], right:[['VOUT','out','out']], bottom:[['GAIN (1, 8)','in','gain'],['BYPASS','in','in']]}},
 'ic-max232':{part:'MAX232',desc:'RS-232 driver / receiver',labels:['C1+','V+','C1−','C2+','C2−','V−','T2OUT','R2IN','R2OUT','T2IN','T1IN','R1OUT','R1IN','T1OUT','GND','VCC'],kinds:'nonnnooioiioiopp',power:[15,16],pkg:'DIP-16',
   units:[['Charge pump',[1,2,3,4,5,6]],['Driver 1',[11,14]],['Driver 2',[10,7]],['Receiver 1',[13,12]],['Receiver 2',[8,9]]],
   inside:{cols:[[{id:'ttl',t:'TTL side',s:'0 V / 5 V'}],[{id:'drv',t:'2 drivers',s:'TTL → RS-232',k:'acc'},{id:'rcv',t:'2 receivers',s:'RS-232 → TTL',k:'acc'},{id:'cp',t:'Charge pump',s:'makes +10 V\nand −10 V'}],[{id:'rs',t:'RS-232 side',s:'±10 V'}]],
     arrows:[['ttl','drv'],['drv','rs'],['rs','rcv'],['rcv','ttl'],['cp','drv']], left:[['T1IN, T2IN','in','ttl'],['R1OUT, R2OUT','out','ttl']], right:[['T1OUT, T2OUT','out','rs'],['R1IN, R2IN','in','rs']], bottom:[['C1±, C2± capacitors','n','cp']]}},
});

/* ---------------- part pages for the new chips ---------------- */
function chipDef(id, parent, o){
  const c = CHIPS[id];
  def(id, Object.assign({name: c.part + ' chip', parent, level:5, scene:'ic', ic:true, tip:`Real chip: ${c.desc}`,
    rel:[[parent, 'Where this kind of chip is used']]}, o));
}
/* 74-series logic (text generated by icDef) */
icDef('ic-74266','xnor-gate',{inside:'four 2-input XNOR gates with open-collector outputs',does:'Each output needs a pull-up resistor (for example 4.7 kΩ to +5 V) to produce a logic 1.',contents:'4 × 2-input XNOR (open collector)',
  fact:'Open-collector outputs can be wired together: any gate pulling low wins. This “wired-AND” trick was common before 3-state buses.'});
N['xnor-gate'].chip = 'ic-74266'; delete N['xnor-gate'].chipNote;
icDef('ic-74161','control-unit',{inside:'a 4-bit synchronous binary counter that can also be loaded with any value',does:'On each clock edge it counts up when ENP and ENT are high, or loads A–D when LOAD is low. RCO goes high at 15 so counters can be chained.',contents:'4-bit counter with parallel load',
  fact:'Breadboard CPUs often use a 74LS161 as the program counter: it counts through instructions and loads a new address for jumps.'});
icDef('ic-74138','decoder',{inside:'a 3-to-8 line decoder with three enable inputs',does:'Put a 3-bit number on A, B and C. With G1 high and G2A, G2B low, exactly one output (Y0–Y7) goes low.',contents:'3-to-8 decoder',
  fact:'Computers use 74LS138s as address decoders: the top address bits choose which memory or I/O chip is switched on.'});
icDef('ic-74245','bus-interface',{inside:'eight bidirectional bus buffers',does:'DIR chooses the direction, A to B or B to A. Pulling OE high disconnects both sides.',contents:'8 × bidirectional buffer',
  fact:'8086 and 8088 systems commonly used 74LS245 chips to buffer the data bus between the processor and the rest of the machine.'});
icDef('ic-74373','bus-interface',{inside:'eight transparent D latches with 3-state outputs',does:'While LE is high the outputs follow the inputs; when LE goes low they hold the value. In 8086 systems the ALE pin drives LE to capture the address from the shared AD pins.',contents:'8 × D latch, 3-state',
  fact:'Three 74LS373 latches are needed to hold the full 20-bit address of an 8086.'});
icDef('ic-74273','registers',{inside:'eight D flip-flops with a shared clock and clear',does:'On each rising clock edge all eight Q outputs copy their D inputs. CLR low resets them all to 0.',contents:'8 × D flip-flop',
  fact:'One 74LS273 is a complete 8-bit register: the same job as a row of eight separate flip-flops.'});
icDef('ic-74181','alu',{inside:'a complete 4-bit ALU',does:'Four select pins (S0–S3) and the mode pin M choose one of 16 logic or 16 arithmetic functions. P and G connect to a 74182 look-ahead carry chip for wider ALUs.',contents:'4-bit ALU, 32 functions',
  fact:'The 74181 was used in the Xerox Alto, the 1973 computer that pioneered the mouse-driven graphical desktop.', o:{ex:[['74LS181','Low-power Schottky TTL'],['74F181','Faster “FAST” TTL version'],['74182','Companion look-ahead carry generator']]}});
icDef('ic-74194','shifter',{inside:'a 4-bit bidirectional universal shift register',does:'S0 and S1 choose the mode: hold, shift right, shift left or parallel load. Each clock edge then moves the bits.',contents:'4-bit shift register',
  fact:'One chip can hold, shift left, shift right or load: a tiny version of the ALU’s shifter.'});
icDef('ic-74151','multiplexer',{inside:'an 8-to-1 data selector',does:'A, B and C choose which of D0–D7 appears on Y; W gives the opposite value. G must be low to enable it.',contents:'8-to-1 multiplexer',
  fact:'With the select pins as inputs and D0–D7 wired to 0 or 1, a 74LS151 can act as any 3-input logic function.'});

/* processors */
chipDef('ic-8086','i8086',{short:'The 40-pin chip that launched the x86 family in 1978.',
 what:'The 8086 is a 16-bit microprocessor with about 29,000 transistors. Inside, two parts work at the same time: the bus interface unit fetches instructions into a 6-byte queue, and the execution unit runs them.',
 does:'To save pins, the lower 16 address lines share pins with the 16 data lines (AD0–AD15). ALE tells external latches, such as the 74LS373, when those pins carry an address. With 20 address lines it can reach 1 MB of memory.',
 why:'Every PC processor since, including today’s Core and Ryzen chips, can still run 8086 instructions. That is where the name “x86” comes from.',
 ex:[['Intel 8086','5, 8 and 10 MHz versions'],['Intel 8088','Same insides, 8-bit bus'],['NEC V30','Faster pin-compatible version'],['Availability','Long discontinued; sold as surplus for retro projects']],
 specs:[['Data bus','16 bits'],['Address bus','20 bits (1 MB)'],['Transistors','about 29,000'],['Clock','5–10 MHz'],['Package','DIP-40'],['Modes','minimum (single CPU) or maximum (with coprocessor)']],
 fact:'Pin 33 (MN/MX) switches the chip’s personality. In maximum mode, pins 24–31 change their jobs so the 8086 can work with an 8087 maths coprocessor and a bus controller chip.'});
chipDef('ic-8088','i8086',{short:'The 8086’s sibling with an 8-bit data bus, used in the original IBM PC.',
 what:'The 8088 has the same registers and instructions as the 8086, but an 8-bit external data bus and a 4-byte instruction queue instead of 6 bytes.',
 does:'Each 16-bit value needs two bus trips, so it is slower, but it could use cheaper 8-bit memory and support chips.',
 why:'IBM chose the 8088 for its 1981 Personal Computer, which is why the PC world grew up on x86.',
 ex:[['IBM PC (5150)','8088 at 4.77 MHz'],['IBM PC/XT','Also 8088'],['NEC V20','Faster pin-compatible version']],
 specs:[['Data bus','8 bits (outside), 16-bit registers inside'],['Address bus','20 bits (1 MB)'],['Instruction queue','4 bytes'],['Package','DIP-40']],
 fact:'The first IBM PC ran at 4.77 MHz: one 14.318 MHz crystal, divided by 3 for the processor and by 4 for the colour-TV signal (3.58 MHz).'});
chipDef('ic-z80','cpu',{short:'An 8-bit processor from 1976 that powered countless home computers and calculators.',
 what:'The Z80 runs all the Intel 8080’s instructions plus many more. Its address bus (A0–A15) and data bus (D0–D7) have their own pins, so no external latch is needed.',
 does:'It can address 64 KB of memory and 256 I/O ports, and has a second set of registers it can swap in instantly when handling interrupts.',
 why:'Its simple, complete pinout made it a favourite for hobby, teaching and embedded computers for decades.',
 ex:[['ZX Spectrum','Sinclair home computer (1982)'],['Amstrad CPC, MSX','Home computers'],['TI-83 / TI-84','Graphing calculators'],['Availability','Zilog announced in 2024 that the standalone Z84C00 would be discontinued']],
 specs:[['Data bus','8 bits'],['Address bus','16 bits (64 KB)'],['Clock','2.5–20 MHz (CMOS versions)'],['Package','DIP-40, also PLCC-44']],
 fact:'The Z80 has a built-in refresh counter (the R register and RFSH pin), so early computers could use cheap dynamic RAM without extra refresh circuits.'});
chipDef('ic-6502','cpu',{short:'The low-cost 8-bit processor inside the Apple II, the Commodore 64 and the NES.',
 what:'The 6502 has very few registers: an accumulator A, index registers X and Y, a stack pointer S, a status register P and the program counter.',
 does:'It uses a 16-bit address bus (64 KB) and an 8-bit data bus. Many instructions work on the first 256 bytes of memory, the “zero page”, which acts like extra registers.',
 why:'It launched at $25 in 1975, far cheaper than rivals such as the Motorola 6800, and helped start the home-computer boom.',
 ex:[['Apple II, BBC Micro','Home computers'],['Commodore 64','Uses the 6510 variant'],['Nintendo NES','Uses the Ricoh 2A03 variant'],['WDC W65C02S','Modern CMOS version, still in production']],
 specs:[['Data bus','8 bits'],['Address bus','16 bits (64 KB)'],['Transistors','about 3,500'],['Package','DIP-40']],
 fact:'Three of its 40 pins are not connected to anything (pins 5, 35 and 36).'});

/* memory and firmware */
chipDef('ic-6116','sram',{short:'A classic 2 KB static RAM chip (2,048 × 8 bits).',
 what:'The 6116 stores 16,384 bits as 2,048 bytes in SRAM cells, so it keeps its data as long as power is on, with no refresh.',
 does:'Put an 11-bit address on A0–A10 and pull CS low to select the chip. Then pull OE low to read, or WE low to write, the byte on D0–D7.',
 why:'One address in, one byte out: it is the textbook example of how memory connects to a processor’s buses.',
 ex:[['6116','2K × 8 SRAM (now obsolete)'],['62256','32K × 8, still made'],['CPU cache','The same SRAM idea on the processor die']],
 specs:[['Organisation','2,048 × 8 bits'],['Access time','about 100–200 ns'],['Package','DIP-24']],
 fact:'The pins tell the story: 11 address pins for 2,048 locations, and 8 data pins because each location holds one byte.'});
chipDef('ic-62256','sram',{short:'A 32 KB static RAM (32,768 × 8), still used in hobby computers.',
 what:'The 62256 is a bigger member of the same family, with 15 address pins (A0–A14) choosing one of 32,768 bytes.',
 does:'It works like the 6116: select with CS, read with OE, write with WE. CMOS versions use so little power when idle that a small battery can keep their data for years.',
 why:'It is the usual RAM chip in breadboard and single-board retro computers.',
 ex:[['Alliance AS6C62256','In current production'],['Battery-backed RAM','Old game cartridges kept saves this way'],['6502 and Z80 projects','Typical main memory']],
 specs:[['Organisation','32,768 × 8 bits'],['Access time','about 55–70 ns'],['Package','DIP-28, also SOP-28']],
 fact:'Its pins follow the JEDEC standard, so they line up with 28-pin ROMs such as the 27C256, and many boards accept either chip.'});
chipDef('ic-4164','dram',{short:'A classic 64 Kbit dynamic RAM chip that shows how DRAM addresses work.',
 what:'The 4164 stores 65,536 bits, one per address. To save pins, the 16-bit address is sent in two halves over the same eight pins (A0–A7): first the row, then the column.',
 does:'The row address is captured when RAS (row address strobe) goes low, and the column address when CAS goes low. Data goes in on D and comes out on Q. Every row must be refreshed every few milliseconds.',
 why:'Modern DDR memory still works this way, with row (activate) and column (read or write) commands.',
 ex:[['4164','Used in many early-1980s computers'],['41256','256 Kbit version'],['DDR5','Still uses row and column addressing']],
 specs:[['Organisation','65,536 × 1 bit'],['Refresh','every row every few milliseconds'],['Package','DIP-16']],
 fact:'Early computers needed eight 4164 chips side by side to store 64 KB: one chip for each bit of every byte.'});
chipDef('ic-27c256','bios',{short:'A 32 KB erasable programmable ROM, the classic home of BIOS code.',
 what:'An EPROM stores bits as charge trapped on floating gates. Versions with a quartz window are erased by shining ultraviolet light through it for about 20 minutes.',
 does:'Reading works like RAM: an address on A0–A14, CE and OE low, and the byte appears on O0–O7. Programming uses a higher voltage on VPP.',
 why:'PC firmware lived on chips like this for years. Today it sits on SPI flash, but the idea of a non-volatile chip holding the start-up code is the same.',
 ex:[['27C256','32K × 8 EPROM'],['27C512','64K × 8 version'],['AT28C256','Electrically erasable (EEPROM) cousin']],
 specs:[['Organisation','32,768 × 8 bits'],['Programming voltage','about 12.5–13 V on VPP'],['Package','DIP-28']],
 fact:'Windowed EPROMs were usually covered with a sticker, because sunlight can slowly erase them.'});
chipDef('ic-w25q128','bios',{short:'The 8-pin flash chip that holds the firmware on many modern motherboards.',
 what:'The W25Q128 stores 128 Mbit (16 MB) of flash memory and talks over SPI: a serial bus with a clock, a chip select and data lines.',
 does:'The chipset sends a read command and a 24-bit address one bit at a time on DI, and data streams back on DO. In quad mode, four pins carry data at once.',
 why:'Serial flash needs only a few pins, which is why it replaced wide parallel ROMs such as the 27C256.',
 ex:[['Winbond W25Q128','Common BIOS / UEFI flash'],['Macronix MX25L series','Similar SPI flash'],['BIOS Flashback','Some boards reprogram this chip from a USB stick']],
 specs:[['Capacity','128 Mbit (16 MB)'],['Interface','SPI, dual and quad SPI'],['Package','SOIC-8, also WSON-8']],
 fact:'Flash can only change bits from 1 to 0 when writing. Turning them back to 1 needs a whole block, at least 4 KB, to be erased at once.'});
chipDef('ic-24c02','spd',{short:'A tiny 2 Kbit I²C EEPROM, the same kind of chip that holds SPD data on memory sticks.',
 what:'The 24C02 stores 256 bytes that survive without power, and talks over I²C: a two-wire bus with a clock (SCL) and a shared data line (SDA).',
 does:'Pins A0–A2 set which of up to eight chips on the bus answers. Holding WP high protects the contents from being changed.',
 why:'I²C lets many small chips share two wires, which is how the firmware reads each memory stick’s details.',
 ex:[['AT24C02','Microchip (formerly Atmel)'],['DDR4 SPD','Uses a 512-byte EE1004-type EEPROM'],['DDR5 SPD hub','Adds a temperature sensor']],
 specs:[['Capacity','2 Kbit (256 × 8)'],['Bus','I²C, 100 or 400 kHz'],['Package','DIP-8, SOIC-8']],
 fact:'Philips invented I²C in 1982 to connect the chips inside television sets.'});

/* timing, power, audio, serial */
chipDef('ic-555','clock',{short:'One of the most popular chips ever made, often used as a slow clock for breadboard computers.',
 what:'The 555 contains two comparators, a flip-flop, a discharge transistor and three resistors that set reference levels at one third and two thirds of the supply voltage.',
 does:'With two resistors and a capacitor it becomes an oscillator that produces a steady square-wave clock. It can also make single timed pulses.',
 why:'A slow, visible clock lets you single-step a homemade CPU and watch every signal change.',
 ex:[['NE555','Original bipolar version'],['TLC555','Low-power CMOS version'],['556','Two 555 timers in one chip']],
 specs:[['Supply','4.5–16 V (NE555)'],['Frequency','under 1 Hz to about 100 kHz'],['Package','DIP-8, SOIC-8']],
 fact:'Designed by Hans Camenzind in 1971, the 555 is often said to be the best-selling integrated circuit of all time.'});
chipDef('ic-7805','voltage-regulation',{short:'A three-pin regulator that turns a higher DC voltage into a steady 5 V.',
 what:'The 7805 is a linear voltage regulator in a TO-220 package, with a metal tab that bolts to a heatsink.',
 does:'Feed about 7–25 V into IN, connect GND, and a steady 5 V comes out of OUT, up to about 1 A. The extra voltage is turned into heat.',
 why:'It is the classic way to power 5 V logic on a breadboard. PCs use much more efficient switching regulators (the VRM) instead.',
 ex:[['7805','Fixed 5 V'],['7812','Fixed 12 V'],['LM1117-3.3','Low-dropout 3.3 V regulator']],
 specs:[['Output','5 V, up to about 1–1.5 A'],['Input','about 7–25 V'],['Package','TO-220']],
 fact:'Dropping 12 V to 5 V at 1 A turns 7 W into heat. That is why it needs a heatsink, and why computers use switching regulators.'});
chipDef('ic-lm317','voltage-regulation',{short:'An adjustable regulator: two resistors set any output from 1.25 V to about 37 V.',
 what:'The LM317 always keeps 1.25 V between its OUT and ADJ pins.',
 does:'With a resistor divider (R1 from OUT to ADJ, R2 from ADJ to ground) the output is about 1.25 V × (1 + R2 ÷ R1).',
 why:'One chip covers almost any voltage you need, which makes it popular in bench power supplies.',
 ex:[['LM317','Adjustable positive regulator'],['LM337','Adjustable negative regulator'],['Bench supplies','Often built around one']],
 specs:[['Output','1.25–37 V, up to 1.5 A'],['Reference','1.25 V'],['Package','TO-220']],
 fact:'Its pin order (ADJ, OUT, IN) differs from the 7805 (IN, GND, OUT). Swapping one for the other without checking is a classic mistake.'});
chipDef('ic-lm386','speakers',{short:'A small audio amplifier that can drive a little speaker directly.',
 what:'The LM386 is a low-voltage audio power amplifier with a built-in gain of 20.',
 does:'A capacitor between pins 1 and 8 raises the gain up to 200. The output drives an 8 Ω speaker with a few hundred milliwatts.',
 why:'It shows the last step of computer sound: after the DAC makes an analog signal, an amplifier makes it strong enough to move a speaker.',
 ex:[['LM386','Low-voltage audio amplifier'],['PAM8403','Tiny class-D stereo amplifier'],['Powered speakers','Contain their own amplifier chips']],
 specs:[['Supply','4–12 V'],['Gain','20 to 200'],['Output','about 0.3–1 W'],['Package','DIP-8, SOIC-8']],
 fact:'The LM386 has been used for decades in hobby radios, mini guitar amps and talking toys.'});
chipDef('ic-max232','io',{short:'Converts 5 V logic to the ±10 V levels of an RS-232 serial port, and back.',
 what:'The MAX232 has a charge pump that makes about +10 V and −10 V from a single 5 V supply, plus two line drivers and two receivers.',
 does:'Four capacitors on C1± and C2± let the charge pump work. Logic signals on T1IN and T2IN leave as RS-232 levels on T1OUT and T2OUT, and RS-232 signals on R1IN and R2IN arrive as logic levels on R1OUT and R2OUT.',
 why:'Serial ports connected modems, mice and terminals for decades, and RS-232 is still common in industrial equipment.',
 ex:[['MAX232','Maxim / Texas Instruments'],['MAX3232','3.3 V version'],['USB-to-serial chips','FTDI FT232 or CH340 on modern PCs']],
 specs:[['Supply','5 V'],['Channels','2 drivers, 2 receivers'],['Package','DIP-16, SOIC-16']],
 fact:'RS-232 uses a negative voltage for logic 1 and a positive voltage for logic 0, the opposite of what you might expect.'});
