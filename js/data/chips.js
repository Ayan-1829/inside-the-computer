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
