/* ==========================================================
   data/alu.js
   Everything inside the ALU. The ALU drawing (js/scenes/alu.js) is a
   working 4-bit model; each block below is clickable in it.
   Edit the text here, then run: node build/build.mjs
   ========================================================== */

/* ---------------- Arithmetic unit ---------------- */
def('arithmetic-unit',{name:'Arithmetic unit',parent:'alu',level:3,tip:'Adding, subtracting and multiplying',
 short:'The half of the ALU that does maths: adding, subtracting, comparing and (in a separate unit) multiplying.',
 what:'The arithmetic unit is built around a binary adder. A row of XOR gates in front of it can invert operand B, so the same adder also subtracts. Carry-lookahead logic makes the adder fast, and a separate, larger multiplier handles multiplication.',
 does:'It adds the two operands bit by bit, passing carries between bit positions, and reports whether the result was zero, negative or too big (overflow) through the flag logic.',
 why:'Loops, prices and physics all come down to integer arithmetic, and the address of almost every memory access is calculated here too.',
 ex:[['ADD, SUB, INC, CMP','Everyday arithmetic instructions'],['Address calculation','base + offset for arrays'],['74LS283','A 4-bit adder chip used in hobby CPUs']],
 specs:[['Core circuit','full adders, one per bit'],['Carry method','carry-lookahead in real CPUs'],['Latency','usually 1 cycle for add and subtract']],
 fact:'Comparing two numbers is really a subtraction whose result is thrown away. Only the flags are kept, and the next instruction checks them.',
 rel:[['logic-unit','The other main half of the ALU'],['flag-logic','Turns its carry and result into flags']]});

def('adder',{name:'Full adder',parent:'arithmetic-unit',level:4,scene:'adder',tip:'Adds three bits: A, B and carry-in',
 short:'A small circuit that adds three bits and produces a sum bit and a carry bit.',
 what:'A full adder adds bit A, bit B and a carry-in from the previous bit. It is built from two XOR gates, two AND gates and one OR gate.',
 does:'Sum = A XOR B XOR Cin. Carry-out is 1 when at least two of the three inputs are 1. Chaining 64 full adders, carry-out to carry-in, adds two 64-bit numbers.',
 why:'The full adder is the building block of all computer arithmetic. Multiplication, for example, is built from many adders.',
 try:'Flip A, B and C<sub>in</sub>. Watch the change travel through the gates one layer at a time: the sum is ready after 2 gate delays, the carry after 3. Turn on <b>Slow motion</b> to see each step.',
 ex:[['Ripple-carry adder','Full adders in a chain; simple but slow'],['Carry-lookahead adder','Extra logic works out carries in advance'],['74LS283','Four full adders with fast carry in one chip']],
 specs:[['Inputs','A, B, carry-in'],['Outputs','sum, carry-out'],['Gates','2 XOR, 2 AND, 1 OR'],['Gate delays','2 for the sum, 3 for the carry'],['CMOS transistors','about 28 in a standard design']],
 fact:'In binary, 1 + 1 = 10: the sum bit is 0 and a 1 is carried to the next column, just like carrying in decimal.',
 rel:[['xor-gate','Produces the sum bit'],['and-gate','Detects carries'],['carry-lookahead','Speeds up chains of adders']]});

def('subtractor',{name:'Subtractor',parent:'arithmetic-unit',level:4,tip:'A − B using the adder and XOR gates',
 short:'Subtracts one binary number from another by reusing the adder, with a row of XOR gates that can invert B.',
 what:'CPUs rarely have a separate subtractor. Instead, each bit of B passes through an XOR gate controlled by a SUB signal. When SUB = 1 the XORs invert B, and the adder’s carry-in is set to 1.',
 does:'This calculates A + (NOT B) + 1, which equals A − B in two’s complement. For example, 6 − 2 in 4 bits: 0110 + 1101 + 1 = 0100, which is 4 (the final carry is ignored).',
 why:'Sharing one circuit for both operations saves space and power, and the same trick handles negative numbers automatically.',
 ex:[['SUB and CMP','x86 and ARM subtract and compare instructions'],['Adder-subtractor','A classic digital-logic lab circuit'],['74LS283 + 74LS86','Builds a 4-bit adder-subtractor from real chips']],
 specs:[['Method','two’s complement'],['Control','a SUB signal drives the XORs and the carry-in'],['4-bit signed range','−8 to +7']],
 fact:'In two’s complement, 1111 means −1. Add 1 and it rolls over to 0000, just like a car’s odometer.',
 rel:[['adder','Does the actual work'],['xor-gate','Inverts B when subtracting'],['flag-logic','Reports borrows and overflow']]});

def('carry-lookahead',{name:'Carry lookahead',parent:'arithmetic-unit',level:4,tip:'Works out all carries at once for fast adding',
 short:'Extra logic that works out all the carries at once, so wide additions do not have to wait.',
 what:'In a simple ripple-carry adder, each bit waits for the carry from the bit before it, so a 64-bit add would wait through 64 steps. Carry-lookahead logic computes a “generate” signal (A AND B) and a “propagate” signal (A XOR B) for every bit, and uses them to predict each carry directly.',
 does:'The carry into the next bit is G + P·C: a carry is generated here, or an incoming carry is passed along. Expanding this lets every carry be calculated straight from the inputs. Groups of 4 bits are combined in a tree, so the delay grows with log₂ of the width instead of the width itself.',
 why:'This is what lets a 64-bit addition finish within a single clock cycle lasting only a few hundred picoseconds.',
 ex:[['74LS182','Look-ahead carry generator chip, used with the 74181 ALU'],['Kogge–Stone adder','A very fast parallel-prefix design'],['Carry-select adder','Computes both possible results and picks one']],
 specs:[['Generate','G = A · B'],['Propagate','P = A ⊕ B'],['Delay','grows with log₂(width)']],
 fact:'A 64-bit ripple adder would pass its carry through 64 stages one after another; a lookahead tree cuts that to about 6 levels of logic.',
 rel:[['adder','The circuit it speeds up'],['and-gate','Makes the generate signals'],['xor-gate','Makes the propagate signals']]});

def('multiplier',{name:'Multiplier',parent:'arithmetic-unit',level:4,tip:'Shift-and-add multiplication in hardware',
 short:'Multiplies two numbers by adding shifted copies, many of them at the same time.',
 what:'Binary multiplication is shift-and-add: for every 1 bit in B, add a copy of A shifted to that position. Hardware multipliers make all these partial products at once with AND gates, then add them in a tree of adders.',
 does:'For example, 0110 × 0011 = 0110 + 01100 = 10010 (6 × 3 = 18). Large multipliers use tricks such as Booth encoding and Wallace trees to reduce the number of additions.',
 why:'Multiplication is essential for graphics, audio, AI and address calculations. In modern CPUs it is usually a separate execution unit next to the simple ALUs, because it is bigger and slower.',
 ex:[['x86 IMUL','about 3 cycles on modern cores'],['Wallace tree','Adds partial products in parallel'],['GPU tensor cores','Huge arrays of multipliers for AI']],
 specs:[['Partial products','one per bit of B'],['Built from','AND gates + adders'],['Latency','about 3–4 cycles for 64-bit integers']],
 fact:'Early microprocessors such as the 6502 and Z80 had no multiply instruction at all. Programs multiplied with loops of shifts and adds.',
 rel:[['adder','Many of them inside'],['shifter','Shifting is half of shift-and-add']]});

/* ---------------- Logic unit ---------------- */
def('logic-unit',{name:'Logic unit',parent:'alu',level:3,scene:'logic',tip:'Bitwise AND, OR, XOR and NOT',
 short:'The half of the ALU that works on bits directly, using logic gates.',
 what:'The logic unit applies a logic gate to every pair of bits in the two operands at the same time. A 64-bit AND is simply 64 AND gates working side by side.',
 does:'It performs bitwise operations such as AND, OR, XOR and NOT. Programs use these to mask out bits, set flags, combine permissions, or quickly flip or clear values.',
 why:'Bitwise logic is fast and everywhere: graphics, encryption, compression and network code all rely on it.',
 ex:[['AND masking','x AND 0x0F keeps the low 4 bits'],['XOR in encryption','Data is combined with a key stream'],['NOT','Flips every bit']],
 specs:[['Operations','AND, OR, XOR, NOT and their inverses'],['Width','64 bits at once in a 64-bit CPU'],['Latency','1 clock cycle']],
 fact:'XOR-ing a register with itself always gives zero. Compilers often write XOR EAX, EAX instead of loading zero, because that instruction is shorter.',
 rel:[['arithmetic-unit','The other main half of the ALU'],['multiplexer','Chooses between the results']]});

/* ---------------- Shifter ---------------- */
def('shifter',{name:'Shifter',parent:'alu',level:4,scene:'shifter',tip:'Moves bits left or right',
 short:'Moves all the bits of a number left or right by one or more places in a single step.',
 what:'A shifter slides bits sideways. Shifting left by one place doubles an unsigned number; shifting right halves it. A barrel shifter can shift by any amount at once, using layers of multiplexers.',
 does:'Each layer either passes the bits straight through or shifts them by 1, 2, 4, 8 … places. An 8-bit barrel shifter needs 3 layers (1 + 2 + 4 covers every shift from 0 to 7), and a 64-bit one needs 6.',
 why:'Shifts give fast multiplication and division by powers of two, and are used for packing and unpacking bits, encryption, graphics and compression.',
 try:'Click the input bits, choose a direction, then switch the layers on. Each layer shifts by 1, 2 or 4 places, so together they can shift by any amount from 0 to 7.',
 ex:[['SHL / SHR','x86 shift instructions'],['LSL / LSR / ASR','ARM shifts; ARM can shift an operand for free in many instructions'],['ROL / ROR','Rotates wrap bits around instead of dropping them']],
 specs:[['Operations','shift left, shift right, rotate'],['Built from','layers of 2-to-1 multiplexers'],['Layers','log₂(width): 6 for 64 bits'],['Latency','1 cycle']],
 fact:'Shifting left by 3 places multiplies by 8, so compilers often turn “x * 8” into a shift, which is cheaper than a real multiplication.',
 rel:[['multiplexer','Each layer is a row of muxes'],['multiplier','Uses shifted copies of A']]});

/* ---------------- Comparator ---------------- */
def('comparator',{name:'Comparator',parent:'alu',level:4,scene:'comparator',tip:'Is A equal to, greater than or less than B?',
 short:'Tells whether one number is equal to, greater than or less than another.',
 what:'A magnitude comparator examines two binary numbers bit by bit, starting from the most significant bit. XNOR gates check which bits are equal; AND and OR gates find the first place where they differ.',
 does:'It outputs three signals: A = B, A > B and A < B. Exactly one of them is 1 at a time.',
 why:'Comparisons drive every if-statement, loop and sort. General-purpose CPUs usually compare by subtracting and reading the flags, but dedicated comparators appear in caches, branch units and simple controllers.',
 try:'Click the bits of A and B. The comparator scans from the left and stops at the first bit that differs: that bit alone decides the answer.',
 ex:[['74LS85','4-bit magnitude comparator chip'],['Cache tag check','Equality comparators on every lookup'],['Thermostat controller','Is the temperature above the set point?']],
 specs:[['Inputs','A3–A0 and B3–B0'],['Outputs','A>B, A=B, A<B'],['Equality check','4 XNOR gates + 1 AND gate'],['Wider numbers','chips can be chained (cascaded)']],
 fact:'Comparing binary numbers works like comparing words in a dictionary: the first differing position from the left decides the answer, and everything after it is ignored.',
 rel:[['xnor-gate','Checks each pair of bits for equality'],['flag-logic','The CPU’s usual way to compare']]});

/* ---------------- Result multiplexer ---------------- */
def('multiplexer',{name:'Multiplexer',parent:'alu',level:4,scene:'mux',tip:'Picks which unit’s result leaves the ALU',
 short:'A digital switch: it picks one of several inputs and passes it to the output.',
 what:'A multiplexer (mux) has data inputs, select inputs and one output, usually drawn as the trapezoid block shown here rather than the gates inside it. The select bits choose which input gets through. A 2-to-1 mux can be built from two AND gates, one OR gate and one NOT gate. This one is a 4-to-1 mux: it needs three data inputs to choose between, so inside it is really three of those 2-to-1 muxes in a small tree, two picking with select bit a and a third picking between their answers with select bit b.',
 does:'In the ALU, every unit calculates its answer at the same time. The result mux then passes only the one the operation asked for, based on select lines from the operation decoder.',
 why:'Muxes let one set of wires carry many possible values. They appear everywhere hardware has to make a choice.',
 ex:[['ALU result select','Chooses add, AND, shift … by opcode'],['74LS157','Quad 2-to-1 multiplexer chip'],['74LS151','8-to-1 multiplexer chip']],
 specs:[['2-to-1','1 select line, 2 data inputs'],['4-to-1','2 select lines, 4 data inputs, built here from three 2-to-1 muxes'],['Expression',`Y = D<sub>S1S0</sub>`]],
 fact:'A 4-to-1 mux whose inputs are wired to fixed 0s and 1s acts as a tiny lookup table that can copy any 2-input gate. FPGAs are built on this idea.',
 rel:[['alu-control','Drives its select lines'],['and-gate','Two of them inside'],['not-gate','Makes the inverted select line'],['alu86-mux','The 8086 ALU’s own wider version']]});

def('alu86-mux',{name:'8086 result multiplexer',parent:'alu',level:4,scene:'mux8',tip:'Picks which of the 8086 ALU’s 8 units drives the 16-bit result',
 short:'An 8-to-1 multiplexer: the 8086 ALU’s version, picking one of eight 16-bit unit results.',
 what:'The 8086 ALU groups its work into eight units — the adder, the logic unit, the shifter, multiply/divide, decimal adjust, move, the jump condition test and flag logic — and all eight compute at once, every instruction. This mux is built the same way as the simpler 4-to-1 mux, just with one more layer of 2-to-1 muxes to reach 8 inputs, and every path is 16 bits wide instead of 1, since the 8086 works in 16-bit words.',
 does:'Three select bits, set by the operation decoder from the opcode, choose 1 of the 8 units. Only that unit’s 16-bit answer reaches the result register; the other seven were computed for nothing.',
 why:'A real ALU does many different kinds of work but can only write one result back each cycle. Widening the same mux idea to 8 inputs and 16 bits is what lets one output register serve all of them.',
 ex:[['8086 ALU result select','Chooses the adder, logic unit, shifter … by opcode'],['74LS151','8-to-1 multiplexer chip'],['74LS257','Quad 2-to-1 multiplexer, tri-state output']],
 specs:[['8-to-1','3 select lines, 8 data inputs'],['Width','16 bits per input, matching the 8086’s word size'],['Expression','Y = D<sub>S2S1S0</sub>']],
 fact:'Widening a mux from 1 bit to 16 just means running 16 of them side by side, sharing the same select lines — the select logic itself does not get any bigger.',
 rel:[['multiplexer','The simpler 4-to-1, 1-bit version'],['alu-control','Drives its select lines'],['ic-74151','A real 8-to-1 multiplexer chip']]});

/* ---------------- Operation decoder ---------------- */
def('alu-control',{name:'Operation decoder',parent:'alu',level:4,tip:'Turns the opcode into ALU control signals',
 short:'Turns the instruction’s operation code into the control signals that set up the ALU.',
 what:'The ALU does not “know” which operation to perform. A small decoder takes the operation code from the control unit and drives a handful of control lines.',
 does:'For SUB it sets “invert B” and “carry-in = 1” and selects the arithmetic result. For AND it selects the logic unit’s AND gates. For SHL it selects the shifter and sets the direction.',
 why:'This is why one piece of hardware can perform many instructions: the same adder, gates and shifter are reused, and only the control signals change.',
 ex:[['74181','5 control pins (S0–S3, M) choose among 32 functions'],['RISC-V funct3 / funct7','Bits in the instruction select the ALU operation'],['Microcoded CPUs','Control words drive the ALU directly']],
 specs:[['Input','opcode bits from the control unit'],['Outputs','result select, invert B, carry-in, gate select, shift direction'],['Built from','a decoder of AND and NOT gates']],
 fact:'The 74181 chip from 1970 could perform 32 operations on 4-bit numbers, chosen by just five control pins. It was the arithmetic heart of many 1970s minicomputers.',
 rel:[['control-unit','Sends it the opcode'],['multiplexer','Receives its select signals'],['decoder','The CPU-level instruction decoder']]});

/* ---------------- Flag logic ---------------- */
def('flag-logic',{name:'Flag logic',parent:'alu',level:4,tip:'Zero, carry, negative and overflow flags',
 short:'Circuits that describe each result with status bits: zero, carry, negative and overflow.',
 what:'Next to the result sits a little extra logic. A wide NOR gate checks whether every result bit is 0 (Z), the top bit gives the sign (N), the adder’s final carry gives C, and an XOR of the last two carries detects signed overflow (V).',
 does:'Every operation updates these flags, which are stored in the flags register. Conditional branches such as “jump if zero” read them to decide what happens next.',
 why:'Flags are how an if-statement becomes hardware: the ALU compares, the flags record the outcome, and the control unit chooses the next instruction.',
 ex:[['x86 RFLAGS','ZF, CF, SF (sign) and OF (overflow)'],['ARM NZCV','Negative, Zero, Carry, oVerflow'],['6502 status register','N, V, Z, C and more in the classic 1975 chip']],
 specs:[['Z','1 when every result bit is 0'],['N','copy of the top (sign) bit'],['C','carry out of the top bit'],['V','signed overflow: carry into top bit ⊕ carry out']],
 fact:'After a subtraction, ARM sets C = 1 when there was no borrow, while x86 sets its carry flag when there was a borrow. Same hardware, opposite conventions. The model in this diagram shows the adder’s raw carry, as ARM does.',
 rel:[['alu-registers','Flags are stored next to the result'],['control-unit','Reads them for branches'],['comparator','A dedicated alternative for comparisons']]});

/* ---------------- Operand & result registers ---------------- */
def('alu-registers',{name:'Operand registers',parent:'alu',level:4,tip:'Hold inputs A and B and the result',
 short:'Hold the two inputs (A and B) and the result of each operation.',
 what:'At the ALU’s inputs sit latches for operand A and operand B, filled from the register file. The output goes to a result latch and is then written back.',
 does:'They hold values steady for the whole clock cycle while the ALU works, then capture the new result on the clock edge.',
 why:'Without these latches, inputs changing mid-calculation would ripple through the circuit and produce garbage.',
 ex:[['Register file ports','Read 2 values and write 1 per operation'],['Bypass network','Feeds a result straight into the next operation'],['Pipeline latches','Separate each stage of the CPU pipeline']],
 specs:[['Width','64 bits in modern CPUs (4 bits in this model)'],['Built from','D flip-flops'],['Timing','updated on each clock edge']],
 fact:'Modern CPUs often do not wait for a result to be written back: a bypass (forwarding) network sends it straight to the next instruction’s inputs, saving time.',
 rel:[['registers','The main register file'],['d-flip-flop','Each bit is a flip-flop'],['flag-logic','Flags sit beside the result']]});
