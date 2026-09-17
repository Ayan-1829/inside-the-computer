/* ==========================================================
   data/cpu.js
   Level 3: what is inside the CPU core.
   Edit the text here, then run: node build/build.mjs
   ========================================================== */
/* ---------------- Level 3: inside the CPU ---------------- */
def('control-unit',{name:'Control unit',parent:'cpu',level:3,scene:'control',model:true,tip:'Directs the fetch-decode-execute cycle',
 try:'Press <b>Next step</b> to walk through a tiny program one stage at a time, or <b>Run</b> to watch it loop. Each instruction is fetched, decoded and then executed; watch the zero flag decide whether the jump is taken.',
 short:'The part of the CPU that directs everything else, step by step.',
 what:'The control unit is a large block of logic that reads each decoded instruction and generates control signals telling the rest of the core what to do and when.',
 does:'For an instruction like ADD R1, R2 it tells the registers to send their values to the ALU, tells the ALU to add, and tells the result where to go. It also handles jumps, branches and interrupts.',
 why:'Without the control unit, the ALU and registers would be an orchestra with no conductor. Modern control logic also predicts branches and reorders instructions to keep every unit busy.',
 ex:[['Branch predictor','Guesses which way an if-statement will go'],['Microcode','Some complex x86 instructions run as small internal programs'],['Intel 4004 (1971)','An early CPU with the whole control unit on one chip']],
 specs:[['Cycle','fetch → decode → execute → write back'],['In flight','hundreds of instructions in modern cores'],['Outputs','enable, select and write signals']],
 fact:'Modern cores guess the outcome of branches before it is known, and are right well over 90% of the time. A wrong guess means throwing work away and starting again.',
 rel:[['decoder','Decodes each instruction for it'],['alu','Performs the calculations it orders'],['registers','Hold the values it works on'],['clock','Steps forward on every tick']]});

def('decoder',{name:'Instruction decoder',parent:'cpu',level:3,tip:'Turns instruction bits into actions',
 short:'Translates binary instruction codes into signals the CPU can act on.',
 what:'Every instruction arrives as a pattern of bits. The decoder recognises the pattern and works out the operation (the opcode) and which registers or values it uses (the operands). For example, the x86-64 bytes 48 01 D8 mean “add register RBX to RAX”.',
 does:'It splits each instruction into its parts and passes them to the control unit. Many x86 CPUs first translate complex instructions into simpler internal micro-operations.',
 why:'The decoder is where software meets hardware: it defines which instruction set (x86, ARM or RISC-V) a chip can run.',
 ex:[['x86-64','Intel and AMD PCs; instructions are 1–15 bytes long'],['ARM64','Apple M-series and phones; fixed 4-byte instructions'],['RISC-V','Open standard used in microcontrollers and research']],
 specs:[['Decode width','about 4–8 instructions per cycle'],['Output','opcode, register numbers, constant values'],['Built from','decoder circuits made of logic gates']],
 fact:'A simple 2-to-4 decoder is just four AND gates and two NOT gates: it turns a 2-bit code into one of four control lines.',
 rel:[['control-unit','Hands it the decoded instruction'],['registers','Selects which registers are used']]});

def('alu',{name:'ALU',parent:'cpu',level:3,scene:'alu',model:true,tip:'Arithmetic Logic Unit: does the calculations',
 try:'Use the switch at the top of the diagram to choose a mode. <b>Simple 4-bit ALU</b>: click the bits of A and B and pick one of nine operations; every unit calculates at the same time and the result multiplexer passes on the one you picked. <b>8086 ALU</b>: 8-bit or 16-bit A and B, and tabs on the left with all 59 operations the 8086 performs on its operands, including multiply, divide, decimal adjust, flag instructions and all 16 jump conditions. You can also set the flags going in, see which flags change, and see how many clock cycles the real chip needs. The 8086 mode hides this panel to give the diagram the full width; press <b>Show details</b> to bring it back.',
 short:'The Arithmetic Logic Unit: the calculator inside every CPU core.',
 what:'The ALU is a circuit that performs arithmetic (add, subtract) and logic operations (AND, OR, XOR, NOT) on binary numbers. A modern core has several ALUs working side by side.',
 does:'It takes two numbers (operands) from registers plus an operation code from the control unit, computes the result, usually within one clock cycle, and sets flags such as zero or carry.',
 why:'Almost every instruction, from adding prices to comparing passwords to moving a game character, eventually becomes simple ALU operations.',
 ex:[['74181 (1970)','A classic 4-bit ALU on a single chip'],['Integer execution units','Several per core in current desktop CPUs'],['Pocket calculator','Its chip contains a small ALU too']],
 specs:[['Width','64 bits in modern PC CPUs; 16 bits in the 8086'],['Operations','add, subtract, AND, OR, XOR, NOT, shift, compare; the 8086 mode shows all 59 of its operand operations'],['Speed','most operations take 1 clock cycle'],['Outputs','result + flags (zero, carry, negative, overflow)']],
 fact:'Computers subtract by adding: to calculate A − B, the ALU inverts the bits of B, adds 1, and adds the result to A. This is called two’s complement.',
 rel:[['registers','Supply its inputs and store its results'],['control-unit','Chooses the operation'],['cache','Keeps its data close by'],['i8086','Try every 8086 arithmetic and logic instruction']]});

def('registers',{name:'Registers',parent:'cpu',level:3,scene:'registers',model:true,tip:'Tiny, ultra-fast storage slots',
 try:'Set the four D switches, then press <b>Clock</b>. All four flip-flops copy their inputs at the same instant and keep that value until the next clock pulse, even if you change the switches.',
 short:'Tiny, ultra-fast storage slots right next to the ALU.',
 what:'Registers are the smallest and fastest memory in the computer. Each holds one value, for example a 64-bit number, and is built from flip-flops: one per bit.',
 does:'Instructions work on registers: load values from memory into registers, calculate with them in the ALU, and store results back. Special registers track the next instruction (program counter) and the ALU flags.',
 why:'A register can be read within a single clock cycle, faster than even the L1 cache. Keeping values in registers is a big reason code runs fast.',
 ex:[['x86-64','16 general-purpose 64-bit registers (RAX, RBX …)'],['ARM64','31 general-purpose 64-bit registers'],['Program counter','Holds the address of the next instruction'],['Flags register','Zero, carry, sign and overflow bits']],
 specs:[['Size','usually 64 bits each'],['Access time','about one clock cycle'],['Built from','flip-flops (one per bit)']],
 fact:'Modern cores keep hundreds of hidden physical registers and rename them on the fly, so different instructions can use “RAX” at the same time without clashing.',
 rel:[['alu','Feeds it operands'],['cache','Next, larger level of memory'],['clock','Loads new values on each tick']]});

def('cache',{name:'Cache',parent:'cpu',level:3,tip:'On-chip SRAM holding recently used data',
 short:'Small, very fast memory on the CPU chip that keeps copies of recently used data.',
 what:'Cache is SRAM built into the processor, arranged in levels: a small, very fast L1 cache in each core, a larger L2, and a big L3 shared by the cores.',
 does:'When the CPU needs data, it checks L1, then L2, then L3, and only then goes to RAM. Because programs reuse nearby data, most requests are found in cache (a “hit”).',
 why:'Fetching from RAM takes around 70–100 ns, hundreds of clock cycles. An L1 hit takes about 1 ns. Without cache, the CPU would spend most of its time waiting.',
 ex:[['AMD 3D V-Cache','Extra L3 stacked on the chip (Ryzen X3D)'],['Intel Smart Cache','L3 shared across cores'],['Apple M-series','Large shared L2 and system cache']],
 specs:[['L1','32–64 KB per core, about 1 ns'],['L2','0.5–3 MB per core, about 3–5 ns'],['L3','8–100+ MB shared, about 10–20 ns'],['Built from','SRAM, 6 transistors per bit']],
 fact:'The Ryzen 7 7800X3D stacks an extra 64 MB of cache on top of its CPU die, giving it 96 MB of L3 and a big boost in many games.',
 rel:[['sram','The memory type cache is built from'],['ram','Where data comes from on a miss'],['registers','The faster level above it']]});

def('clock',{name:'Clock',parent:'cpu',level:3,tip:'The timing signal that keeps everything in step',
 short:'The heartbeat of the CPU: a precise signal that keeps every part in step.',
 what:'The clock is a signal that switches between 0 and 1 billions of times per second. A quartz crystal on the motherboard provides a steady reference, and a phase-locked loop (PLL) inside the CPU multiplies it up.',
 does:'Each tick lets flip-flops capture new values, so every part moves forward together. For example, a 100 MHz base clock multiplied by 50 gives 5.0 GHz.',
 why:'Faster clocks mean more steps per second, but also more heat. CPUs change their clock speed many times a second to balance speed and power.',
 ex:[['Base clock (BCLK)','100 MHz reference on PCs'],['Boost clock','up to 5.7 GHz on a Ryzen 9 9950X'],['Quartz crystal','The same idea as in a wristwatch']],
 specs:[['Typical speed','3–6 GHz'],['One cycle at 5 GHz','0.2 ns'],['Control','dynamic frequency scaling']],
 fact:'A wristwatch crystal vibrates 32,768 times a second. That is 2¹⁵, so a chain of 15 flip-flops divides it down to exactly one tick per second.',
 rel:[['d-flip-flop','Captures data on each tick'],['control-unit','Steps through instructions in time with it']]});

def('bus-interface',{name:'Bus interface',parent:'cpu',level:3,tip:'Connects the core to memory and the system',
 short:'The CPU core’s doorway to caches, memory and the rest of the system.',
 what:'The bus interface connects the core to the shared parts of the chip and to the outside world. Modern chips use on-chip networks (ring buses, meshes or fabrics) plus memory controllers and PCIe links.',
 does:'It carries addresses and data between the core, the shared L3 cache, the memory controller (to RAM) and the PCIe lanes (to the GPU and SSDs), and keeps copies of data consistent between cores.',
 why:'A fast core is useless if it cannot get data. The width and speed of these connections are a big part of real-world performance.',
 ex:[['AMD Infinity Fabric','Links chiplets in Ryzen and EPYC'],['Intel ring bus / mesh','Connects cores and cache slices'],['Integrated memory controller','In the CPU (AMD since 2003, Intel since 2008)']],
 specs:[['Memory channels','2 in typical desktops'],['PCIe lanes','about 20–28 from a desktop CPU'],['Addresses','48- or 57-bit virtual addresses (x86-64)']],
 fact:'Early PCs connected the CPU to everything through one shared “front-side bus”. Today the memory controller and many PCIe lanes are built into the CPU itself.',
 rel:[['ram','Reached through the memory controller'],['cache','Shared L3 sits on the same network'],['pcie','Lanes to the GPU and SSDs']]});

