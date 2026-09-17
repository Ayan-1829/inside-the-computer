/* ==========================================================
   data/logic.js
   Level 4: logic gates and the D flip-flop.
   Edit the text here, then run: node build/build.mjs
   ========================================================== */
/* ---------------- Level 4: logic gates ---------------- */
def('and-gate',{name:'AND gate',parent:'logic-unit',level:4,scene:'gate',gate:'AND',chip:'ic-7408',tip:'1 only if both inputs are 1',
 short:'Outputs 1 only when all of its inputs are 1.', expr:'Y = A · B',
 what:'AND is one of the basic logic gates. Its symbol has a flat back and a round front. In CMOS it is built from a NAND gate followed by an inverter: 6 transistors.',
 does:'The output is 1 only if A is 1 and B is 1; otherwise it is 0. Think of two switches in series: the lamp lights only when both are closed.',
 why:'AND gates make decisions that need several conditions. They form the carry logic in adders and the masking logic in the ALU.',
 ex:[['Adders','Carry-out uses AND gates'],['Bit masking','Keeps only selected bits'],['Enable signals','Let data through only when enabled'],['Safety interlock','Machine runs only if the door is shut AND the button is pressed']],
 specs:[['Expression','Y = A · B'],['CMOS transistors','6'],['Real chip','74LS08 (quad 2-input AND)']],
 fact:'The idea predates electronics: in 1886 the logician Charles Peirce suggested that logical operations could be carried out by electrical switching circuits.',
 rel:[['nand-gate','AND followed by NOT'],['adder','Uses AND for carries']]});

def('or-gate',{name:'OR gate',parent:'logic-unit',level:4,scene:'gate',gate:'OR',chip:'ic-7432',tip:'1 if at least one input is 1',
 short:'Outputs 1 when at least one input is 1.', expr:'Y = A + B',
 what:'OR is a basic gate with a curved back and a pointed front. In CMOS it is built from a NOR gate followed by an inverter: 6 transistors.',
 does:'The output is 0 only when both inputs are 0. Think of two switches side by side (in parallel): either one lights the lamp.',
 why:'OR combines alternatives, such as “interrupt the CPU if the timer OR the keyboard needs attention”. It also merges the two carry paths in a full adder.',
 ex:[['Full adder carry','Combines the two carry paths'],['Interrupt requests','Any source can trigger'],['Setting bits','x OR 0x80 sets the top bit']],
 specs:[['Expression','Y = A + B'],['CMOS transistors','6'],['Real chip','74LS32 (quad 2-input OR)']],
 fact:'In Boolean algebra, + means OR, so 1 + 1 = 1. That is different from binary addition, where 1 + 1 = 10.',
 rel:[['nor-gate','OR followed by NOT'],['xor-gate','Like OR, but 0 when both are 1']]});

def('not-gate',{name:'NOT gate',parent:'logic-unit',level:4,scene:'gate',gate:'NOT',chip:'ic-7404',tip:'Inverter: flips 0 and 1',
 short:'Flips its single input: 0 becomes 1, and 1 becomes 0.', expr:`Y = ${OL('A')}`,
 what:'NOT, also called an inverter, has one input and one output. Its symbol is a triangle with a small circle, the “bubble”, which means inversion. In CMOS it takes just 2 transistors.',
 does:'The output is always the opposite of the input.',
 why:'Inverters are everywhere: they turn NAND into AND, create the inverted select line in multiplexers, and chains of them form oscillators.',
 ex:[['Ring oscillator','An odd number of inverters in a loop'],['Mux select','Creates the inverted select signal'],['Subtraction','Inverts the bits of B']],
 specs:[['Expression',`Y = ${OL('A')}`],['Inputs','1'],['CMOS transistors','2 (one PMOS, one NMOS)'],['Real chip','74LS04 (hex inverter)']],
 fact:'Connect an odd number of inverters in a loop and the circuit can never settle, so it oscillates. Chip makers use these “ring oscillators” to measure how fast their transistors are.',
 rel:[['nand-gate','AND plus NOT'],['sram','Two inverters in a loop store a bit']]});

def('nand-gate',{name:'NAND gate',parent:'logic-unit',level:4,scene:'gate',gate:'NAND',chip:'ic-7400',tip:'0 only if both inputs are 1',
 short:'Outputs 0 only when all inputs are 1: an AND followed by NOT.', expr:`Y = ${OL('A · B')}`,
 what:'NAND means NOT-AND. Its symbol is the AND shape with a bubble on the output. In CMOS it is the simplest two-input gate, using only 4 transistors.',
 does:'The output is 1 unless both inputs are 1.',
 why:'NAND is “universal”: any logic circuit, including a whole CPU, can be built from NAND gates alone. The flash memory in SSDs is also called NAND, because its cells are chained in a similar way.',
 ex:[['Universal gate','NOT, AND and OR can all be made from NAND'],['NAND flash','Memory in SSDs and USB sticks'],['SR latch','Two cross-coupled NANDs store a bit']],
 specs:[['Expression',`Y = ${OL('A · B')}`],['CMOS transistors','4'],['Real chip','74LS00 (quad 2-input NAND)']],
 fact:'The popular course “From NAND to Tetris” has students build a complete working computer, starting from nothing but NAND gates.',
 rel:[['and-gate','NAND without the bubble'],['d-flip-flop','Can be built from NAND gates'],['ssd','Uses NAND flash']]});

def('nor-gate',{name:'NOR gate',parent:'logic-unit',level:4,scene:'gate',gate:'NOR',chip:'ic-7402',tip:'1 only if both inputs are 0',
 short:'Outputs 1 only when all inputs are 0: an OR followed by NOT.', expr:`Y = ${OL('A + B')}`,
 what:'NOR means NOT-OR. Its symbol is the OR shape with a bubble. Like NAND, it uses 4 transistors in CMOS and is universal.',
 does:'The output is 1 only when both inputs are 0.',
 why:'NOR can build any other gate. Two cross-coupled NOR gates make an SR latch, the simplest circuit that remembers a bit.',
 ex:[['SR latch','A basic memory element'],['Apollo Guidance Computer','Logic built from NOR gates'],['Zero detection','Output is 1 only when all bits are 0']],
 specs:[['Expression',`Y = ${OL('A + B')}`],['CMOS transistors','4'],['Real chip','74LS02 (quad 2-input NOR)']],
 fact:'The Apollo Guidance Computer that flew to the Moon used about 2,800 integrated circuits, each containing two 3-input NOR gates.',
 rel:[['or-gate','NOR without the bubble'],['d-flip-flop','Latches can be built from NOR gates']]});

def('xor-gate',{name:'XOR gate',parent:'logic-unit',level:4,scene:'gate',gate:'XOR',chip:'ic-7486',tip:'1 if the inputs are different',
 short:'Outputs 1 when the inputs are different.', expr:'Y = A ⊕ B',
 what:'XOR means exclusive OR. Its symbol is the OR shape with an extra curved line at the back. A typical CMOS XOR uses about 8 to 12 transistors.',
 does:'The output is 1 if exactly one input is 1, and 0 if both inputs are the same.',
 why:'XOR is the heart of binary addition, where it produces the sum bit. It is also used for parity checks, error detection and encryption.',
 ex:[['Adder sum bit','Sum = A ⊕ B ⊕ Cin'],['Parity and RAID','Detect or rebuild lost data'],['Encryption','Data XOR key stream'],['Controlled inverter','Flips B when subtracting']],
 specs:[['Expression','Y = A ⊕ B'],['CMOS transistors','about 8–12'],['Real chip','74LS86 (quad 2-input XOR)']],
 fact:'XOR undoes itself: (A XOR K) XOR K = A. Encrypt a message with a key, apply the same key again, and the original comes back.',
 rel:[['adder','Makes the sum bit'],['subtractor','Inverts B on demand'],['xnor-gate','XOR with the output inverted']]});

def('xnor-gate',{name:'XNOR gate',parent:'logic-unit',level:4,scene:'gate',gate:'XNOR',tip:'1 if the inputs are the same',
 short:'Outputs 1 when the inputs are the same: an equality detector.', expr:`Y = ${OL('A ⊕ B')}`,
 what:'XNOR means exclusive NOR, the opposite of XOR. Its symbol is the XOR shape with a bubble on the output.',
 does:'The output is 1 when A and B are both 0 or both 1.',
 why:'XNOR checks equality bit by bit. Comparators combine many XNOR outputs to test whether two numbers are equal.',
 ex:[['Equality comparators','Is A equal to B?'],['Cache tag check','Compares stored and requested addresses'],['Binary neural networks','XNOR replaces multiplication']],
 specs:[['Expression',`Y = ${OL('A ⊕ B')}`],['CMOS transistors','about 8–12'],['Real chip','74LS266 (open-collector outputs)']],
 fact:'An 8-bit equality checker is just 8 XNOR gates feeding one 8-input AND gate.',
 chipNote:'The 74LS266 contains four 2-input XNOR gates. Its outputs are open-collector, so each output needs a pull-up resistor to produce a proper logic 1. It is less common than the other chips, so no pinout is shown here.',
 rel:[['xor-gate','XNOR without the bubble'],['comparator','Uses XNOR gates to test equality'],['cache','Tag comparison uses XNOR-style logic']]});

/* ---------------- Registers → flip-flop ---------------- */
def('d-flip-flop',{name:'D flip-flop',parent:'registers',level:4,tip:'1-bit memory that updates on the clock edge',
 short:'A 1-bit memory cell that captures its input on the rising clock edge.',
 what:'A D flip-flop is built from about six logic gates (NAND or NOR) connected in feedback loops, which let it hold a value. It has a data input D, a clock input and an output Q.',
 does:'When the clock rises from 0 to 1, Q copies whatever is on D. Between clock edges, Q stays the same no matter how D changes.',
 why:'Flip-flops let a computer remember its state from one clock tick to the next. Registers, counters and pipelines are all rows of flip-flops.',
 ex:[['CPU registers','One flip-flop per bit'],['Counters','Flip-flops chained together'],['74LS74','Dual D flip-flop chip']],
 specs:[['Inputs','D, clock (plus preset and clear)'],['Outputs',`Q and ${OL('Q')}`],['Trigger','rising clock edge'],['Gates','about 6 NANDs in the classic design']],
 fact:'The feedback loop is what memory really is: gates that keep each other in the same state until something forces a change.',
 rel:[['registers','Rows of flip-flops'],['clock','Tells it when to capture'],['nand-gate','Its building block']]});

