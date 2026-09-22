/* ==========================================================
   data/memory-deep.js
   Going deeper inside the memory parts: a DRAM chip, a memory cell, SRAM, the SPD chip,
   the CPU's caches and NAND flash. Each part here is drawn by a scene of the same
   name in scenes/memory-deep.js (the scene names are set on the parts in
   data/hardware.js, data/cpu.js). Edit the text here, then run: node build/build.mjs
   ========================================================== */
function deep(parent, id, level, name, tip, short, what, does, why, ex, specs, fact, rel){
  def(id, {name:name, parent:parent, level:level, levelLabel:'Internal components', tip:tip, short:short, what:what, does:does, why:why, ex:ex, specs:specs, fact:fact, rel:rel});
}

/* ---------------- Inside a DRAM chip ---------------- */
deep('dram','dram-banks',4,'Memory banks','Big arrays of cells, each able to work on its own',
 'A DRAM chip is split into banks: separate arrays of memory cells that can be worked on at the same time.',
 'Each bank is a huge grid of cells (billions of them on a whole chip) with its own row decoder and its own row of sense amplifiers. A DDR4 chip has 16 banks in 4 bank groups; a DDR5 chip has 32 banks in 8 bank groups.',
 'While one bank is busy opening a row, the memory controller can already be reading from another bank. Spreading requests over many banks hides the slow steps and keeps the data pins busy.',
 'Opening a row takes tens of nanoseconds, far longer than moving data once a row is open. Banks are how a chip delivers billions of transfers a second anyway.',
 [['Micron MT40A family','DDR4 SDRAM chips with 16 banks'],['Micron MT60B family','DDR5 SDRAM chips with 32 banks'],['JEDEC DDR4 (JESD79-4)','The standard that defines the bank layout'],['JEDEC DDR5 (JESD79-5)','The standard that defines the bank layout']],
 [['DDR4','16 banks in 4 bank groups'],['DDR5','32 banks in 8 bank groups'],['Cells per chip','billions']],
 'Two reads to different bank groups can follow each other faster than two reads to the same group: the chip’s shared circuits need a short recovery time.',
 [['dram-row-decoder','Picks the row in a bank'],['dram-sense-amps','Reads the row that is opened'],['memory-cells','What a bank is made of']]);

deep('dram','dram-row-decoder',4,'Row decoder','Turns a row address into one active word line',
 'The circuit that opens exactly one row of a bank by raising one word line.',
 'It takes the row address sent by the memory controller (about 16 bits, so tens of thousands of rows) and drives one word line high. The word-line drivers raise the voltage above the chip’s supply so that every access transistor in the row opens fully.',
 'When the controller sends an ACTIVATE command, the row decoder selects one row, and all the cells of that row (8,192 or more) connect to their bit lines at the same moment.',
 'A DRAM can only read a whole row at a time, so the row decoder is the first step of every access. Its speed is part of the delay called tRCD.',
 [['Wordline driver','Boosts the word-line voltage above the supply'],['Hierarchical word lines','Short local word lines split off long global ones'],['Buried word line','Word line buried in the silicon, used in modern DRAM'],['DDR5 chip','Row address of about 16 bits']],
 [['Rows per bank','tens of thousands'],['Word-line voltage','above the supply (VPP)'],['Speed','a few nanoseconds to decode']],
 'The boosted word-line voltage is called VPP. Older DRAM made it inside the chip with a charge pump; DDR4 and DDR5 modules supply it separately (2.5 V for DDR4, 1.8 V for DDR5).',
 [['dram-banks','The array the decoder works on'],['cell-wordline','The wire the decoder drives'],['dram-sense-amps','Read the row once it is open']]);

deep('dram','dram-sense-amps',4,'Sense amplifiers','Read the tiny charges and hold the open row',
 'One amplifier per bit line that detects the tiny voltage change from a cell and turns it into a clean 0 or 1.',
 'Under each bank is a strip of sense amplifiers, one for every bit line. Each is a small circuit with two cross-coupled inverters, like an SRAM cell. Together they hold a copy of the open row, called the row buffer.',
 'When a row opens, each cell shares its charge with its bit line, changing the voltage by only a few tens of millivolts. The sense amplifier pushes it to a full 0 or 1, which also puts the charge back into the cell (reading DRAM destroys the stored value, so it has to be rewritten).',
 'Without sense amplifiers a DRAM cell’s tiny charge could not be read at all. The row buffer is also why reading several bits from the same row is much faster than switching rows.',
 [['Row buffer hit','A read to the row that is already open: fast'],['Row buffer miss','A read to another row: precharge, then activate'],['Open-page policy','Leaves a row open, hoping for more hits'],['Closed-page policy','Closes a row right after using it']],
 [['Count','one per bit line, about 8,000 per bank row'],['Signal in','tens of millivolts'],['Job','sense, amplify and restore the row']],
 'A row buffer read is “destructive”: the cells are drained by being read, and it is the sense amplifiers that refill them.',
 [['cell-bitline','The wire each amplifier senses'],['dram-column-io','Chooses bits from the row buffer'],['sram-sense','A similar amplifier in SRAM']]);

deep('dram','dram-column-io',4,'Column decoder and I/O gating','Chooses which bits of the open row go to the pins',
 'After a row is open, this circuit picks the few bits (for example 8 or 16) that are sent out.',
 'It reads a column address and connects the selected sense amplifiers to the chip’s internal data path. A DDR5 chip fetches 16 transfers for each read (a “16n prefetch”), and a DDR4 chip fetches 8.',
 'For a read, it gates a group of bits from the row buffer onto the internal data bus. For a write, it does the opposite and forces the chosen sense amplifiers to the new values.',
 'It lets the chip run its slow core at a fraction of the speed of the pins: the core reads many bits at once and the I/O circuits send them out one after another, twice per clock.',
 [['8n prefetch','DDR3 and DDR4 read 8 words per access'],['16n prefetch','DDR5 reads 16 words per access'],['Burst length','8 transfers in DDR4, 16 in DDR5'],['x4 / x8 / x16 chips','How many data pins a chip has']],
 [['Prefetch','8n (DDR4), 16n (DDR5)'],['Column address','about 10 bits'],['Delay','tCL, the CAS latency, in clock cycles']],
 'The number after “CL” on a RAM stick (such as CL30) is the number of clock cycles this step takes from the moment the column is chosen.',
 [['dram-sense-amps','Where the bits come from'],['dram-io','Where the bits go next'],['ram','The stick these chips are on']]);

deep('dram','dram-control',4,'Command decoder and refresh control','Runs the chip’s timing and keeps the cells alive',
 'The logic that decodes commands from the memory controller, times every step, and refreshes the cells.',
 'A small state machine decodes commands such as activate, read, write, precharge and refresh, and enforces the minimum times between them. It holds the mode registers that set the chip’s latency and modes, and a counter that walks through every row to refresh it.',
 'Every row must be read and rewritten before its charge leaks away: about every 64 ms in normal use (32 ms when hot). The chip refreshes a few rows each time the controller sends a REFRESH command, roughly every 7.8 microseconds in DDR4 and 3.9 microseconds in DDR5.',
 'DRAM cells leak, so without refresh the memory would lose its contents in a fraction of a second. Refresh takes a few percent of the chip’s time, which is the price of its tiny cell.',
 [['Auto-refresh','The controller sends a refresh command regularly'],['Self-refresh','The chip refreshes itself in sleep or standby'],['Mode registers','Set CAS latency, burst length and more'],['Target row refresh (TRR)','Defends against the “Rowhammer” attack']],
 [['Refresh interval','about 7.8 µs (DDR4) or 3.9 µs (DDR5)'],['Every row refreshed','every 64 ms (32 ms when hot)'],['Commands','ACT, RD, WR, PRE, REF']],
 'The “Rowhammer” attack repeatedly opens the same row, and the electrical disturbance can flip bits in nearby rows; chips now include defences against it.',
 [['memory-controller','The other side of the commands'],['cell-capacitor','What leaks and needs refreshing'],['spd','Tells the computer these timings']]);

deep('dram','dram-io',4,'Data I/O, DLL and pins','The fast interface that talks to the memory controller',
 'The data pins, strobe signals and timing circuits that send and receive data at billions of transfers a second.',
 'Each data pin (DQ) has a driver, a receiver and on-die termination (ODT) that stops signal reflections. A strobe signal (DQS) travels with the data. A delay-locked loop (DLL) lines the chip’s output up with the clock, and the data moves on both edges of the clock: this is “double data rate”.',
 'On a read, the chip sends out the bits it has prefetched, timed to the strobe. On a write, it uses the strobe from the controller to capture each bit at the right instant.',
 'The pins are the fastest part of the chip. Getting a signal to arrive cleanly at 4,800 to 8,000 megatransfers a second, over a circuit board, takes careful timing and matching.',
 [['On-die termination (ODT)','Resistors inside the chip that absorb reflections'],['DQS strobe','Timing signal that travels with the data'],['DLL / PLL','Aligns the chip’s timing with the clock'],['Decision feedback equalizer','DDR5 chips clean up the received signal']],
 [['Speed','DDR5-4800 to about DDR5-8000+'],['Data pins','4, 8 or 16 per chip'],['Data on','both clock edges']],
 'DDR5 chips add an equalizer to every data pin: the signal has degraded so much by the time it arrives that the receiver has to clean it up.',
 [['dram-column-io','Supplies the bits'],['memory-controller','The far end of the link'],['ram-slots','Where the module plugs in']]);

/* ---------------- Inside a memory cell ---------------- */
deep('memory-cells','cell-transistor',5,'Access transistor','The switch that connects a cell to its bit line',
 'A tiny transistor that connects the storage capacitor to the bit line when the word line is on.',
 'An NMOS transistor with its gate connected to the word line, one side to the bit line and the other side to the capacitor. Modern DRAM builds it in a trench, with the channel buried in the silicon, so it fits in a very small area.',
 'When the word line goes high, the transistor turns on and charge can flow between the capacitor and the bit line. When the word line is low, the transistor is off and the capacitor is left alone.',
 'The transistor keeps a cell’s charge from being disturbed by its neighbours. Its small leakage current is also why the charge slowly drains away, and why refresh is needed.',
 [['Recessed-channel array transistor','Trench-style access transistor in DRAM'],['Buried word line','The gate is buried in the silicon'],['Low-leakage transistor','Designed to leak as little as possible'],['1T1C cell','One transistor and one capacitor']],
 [['Type','NMOS'],['Per cell','1'],['Gate','connected to the word line']],
 'A DRAM cell is one of the simplest circuits in a computer: one transistor and one capacitor. That is why billions fit on a chip.',
 [['cell-capacitor','What it connects to'],['cell-wordline','What controls it'],['cell-bitline','What it connects to']]);

deep('memory-cells','cell-capacitor',5,'Storage capacitor','A tiny bucket of charge that holds one bit',
 'The capacitor that stores a bit as charge: full for 1, empty for 0.',
 'A capacitor of roughly ten to thirty femtofarads (a femtofarad is a millionth of a billionth of a farad), built as a tall thin cylinder or pillar in the silicon to get a large surface in a small area, with a very thin insulating layer between its plates.',
 'When the cell is written, the bit line charges the capacitor to about the supply voltage (a 1) or drains it (a 0). The charge is only some tens of thousands of electrons, and it slowly leaks away, so the cell has to be refreshed.',
 'Everything a DRAM remembers is held in these tiny capacitors. Making them small enough but still able to hold a readable charge is one of the hardest problems in memory design.',
 [['Cylinder capacitor','Tall, thin cup-shaped capacitor'],['High-k dielectric','Insulator that holds more charge per area'],['Stacked capacitor','Built above the transistor'],['eDRAM','DRAM built into a logic chip, used in some CPUs']],
 [['Capacitance','about 10 to 30 fF'],['Charge','tens of thousands of electrons'],['Retention','tens of milliseconds']],
 'The capacitors in a modern DRAM are tall thin cups, many tens of times taller than they are wide, packed side by side like a forest of skyscrapers.',
 [['cell-transistor','The switch that fills and drains it'],['dram-control','Refreshes it in time'],['dram-sense-amps','Read its tiny voltage']]);

deep('memory-cells','cell-wordline',5,'Word line','The wire that switches on a whole row of cells',
 'A wire that runs along a row and connects to the gate of every access transistor in it.',
 'A long metal or polysilicon line, driven by the row decoder. Each DRAM row is thousands of cells wide (8,192 or more), so a word line is a heavy electrical load and has to be driven strongly.',
 'When the row decoder raises a word line, every transistor along it turns on at once, and all the cells of that row connect to their bit lines. Only one word line in a bank is on at a time.',
 'The word line is what makes a memory “random access”: it can switch on any row directly, without going through the rows before it.',
 [['Global and local word lines','A hierarchy that keeps each wire short'],['Wordline driver','Boosts the voltage above the supply'],['Row hammer','Repeatedly switching a word line disturbs its neighbours'],['Sub-wordline driver','A small driver for a short section']],
 [['Cells per row','8,192 or more'],['Voltage','boosted above the supply'],['Driven by','the row decoder']],
 'A row of a DRAM bank is called a “page”, because a single row of 8,192 bits (1 KB) is read at a time, whether or not you needed all of it.',
 [['dram-row-decoder','Drives it'],['cell-transistor','The gates it controls'],['cell-bitline','Crosses it at each cell']]);

deep('memory-cells','cell-bitline',5,'Bit line','The wire that carries a cell’s charge to the sense amplifier',
 'A wire that runs along a column and connects many cells to one sense amplifier.',
 'A long thin wire, crossing all the word lines in a column of a bank (typically 512 or 1,024 cells). It has much more capacitance than a single cell, several times as much.',
 'Before a read, the bit line is precharged to half the supply voltage. When a cell connects, its charge is shared with the bit line and changes the voltage very slightly. The sense amplifier compares it with a reference and amplifies the difference.',
 'The size of the bit line’s capacitance compared with the cell’s decides how big the signal is. That is why the number of cells on a bit line is limited: too many and the signal disappears in the noise.',
 [['Folded bit line','Each amplifier compares two neighbouring bit lines'],['Open bit line','Compares lines from two separate arrays'],['Precharge','Sets the line to half the supply before a read'],['Bit-line pair','Two lines used together by one sense amplifier']],
 [['Cells per bit line','about 512 to 1,024'],['Precharge','half the supply voltage'],['Signal','tens of millivolts']],
 'The bit line is precharged to exactly half the supply, so that a stored 1 pushes it up a little and a stored 0 pulls it down a little, and the amplifier only has to decide which way.',
 [['dram-sense-amps','Read this wire'],['cell-transistor','Connects a cell to it'],['cell-wordline','Selects which cell connects']]);

/* ---------------- Inside SRAM ---------------- */
deep('sram','sram-cell',4,'Six-transistor cell','Two inverters that hold a bit by holding each other',
 'A memory cell made of six transistors: two inverters that hold each other’s state, and two access transistors.',
 'Two inverters are connected in a loop, so each one’s output is the other’s input. That loop has two stable states, which store a 0 or a 1. Two more transistors connect the loop to a pair of bit lines (BL and BL̄) when the word line is on.',
 'The loop holds its value as long as it has power, so SRAM needs no refresh. To read, the word line opens the access transistors and the cell pulls one bit line slightly lower than the other. To write, the bit lines force the loop into the new state.',
 'SRAM is much faster than DRAM, because there is no capacitor to charge, and no refresh. It costs six transistors per bit, so it is used where speed matters most: inside processors, as cache.',
 [['6T SRAM cell','The standard cell'],['8T SRAM cell','Adds a separate read port'],['TSMC N5 SRAM bit cell','About 0.021 square micrometres'],['Cypress CY62256','A 32K × 8 SRAM chip made of these cells']],
 [['Transistors','6 per bit'],['Refresh','not needed'],['Speed','about a nanosecond inside a processor']],
 'A 6T cell on a modern 5 nm-class process is about 0.02 square micrometres, so a 32 MB cache holds over a quarter of a billion of them.',
 [['sram-decoder','Selects its row'],['sram-sense','Reads it'],['not-gate','A cell is two of these in a loop']]);

deep('sram','sram-decoder',4,'Row and column decoders','Pick one cell out of the array',
 'Circuits that use an address to pick which row of the array is on and which column is read.',
 'A row decoder turns an address into one word line, using layers of AND-style gates. A column multiplexer, controlled by the rest of the address, picks which bit lines are connected to the sense amplifiers.',
 'Given an address, the row decoder raises exactly one word line, and every cell on that row connects to its bit lines. The column multiplexer then chooses which of those bit lines to read out.',
 'Decoders are what allow any address to be reached in the same time: they turn a binary number into one selected row.',
 [['74LS138','A real 3-to-8 decoder chip'],['Predecoder','First stage that splits the address into groups'],['Column multiplexer','Chooses among many bit lines'],['Wordline driver','Powers the selected row']],
 [['Address bits','for example 10 for 1,024 rows'],['Outputs','one word line active at a time'],['Delay','a few gate delays']],
 'A decoder for 1,024 rows does not have 1,024 huge gates: it is built in stages, so that each gate only has a few inputs.',
 [['dram-row-decoder','The same job in DRAM'],['ic-74138','A real decoder chip'],['decoder','A CPU instruction decoder is a related idea']]);

deep('sram','sram-sense',4,'Sense amplifier and write drivers','Read the small difference and force new values in',
 'Circuits at the bottom of each column that read the small voltage difference from a cell and drive new values into it.',
 'A sense amplifier compares the two bit lines of a column. A write driver, on the same column, can pull one bit line hard to ground to overwrite the cell.',
 'When a row is selected, the cell only pulls one bit line down a little. The sense amplifier detects that small difference early and amplifies it to a full 0 or 1, so the read is finished quickly.',
 'Detecting a small difference quickly is what lets SRAM be fast: the amplifier does not have to wait for the bit line to swing all the way.',
 [['Differential sense amplifier','Compares the two bit lines'],['Write driver','Pulls a bit line to ground to write'],['Precharge circuit','Resets the bit lines before each access'],['Latch-type sense amplifier','A fast, low-power design']],
 [['Signal in','tens of millivolts'],['Output','full logic levels'],['Per column','one amplifier and one driver']],
 'By using a differential pair, an SRAM read can be finished when the bit lines have moved only a tenth of the way, saving time and power.',
 [['dram-sense-amps','The DRAM version'],['sram-cell','What it reads'],['comparator','A related idea: compare two signals']]);

/* ---------------- Inside the SPD chip ---------------- */
deep('spd','spd-eeprom',4,'SPD memory','A small table of facts about the memory stick',
 'A small non-volatile memory that stores the module’s size, timings and speed profiles.',
 'A DDR4 module has a 512-byte table, and a DDR5 module a 1,024-byte one. It holds the memory type, capacity, number of ranks, the timing values (such as CAS latency), voltages, the maker’s name and serial number, and optional overclocking profiles (Intel XMP or AMD EXPO).',
 'At every start-up, the BIOS reads this table and sets up the memory controller to match. If a profile such as XMP is turned on, the BIOS uses its faster timings instead of the safe standard ones.',
 'It is how any RAM stick works in any motherboard: the board does not need to know about the module beforehand, it just reads what the stick says about itself.',
 [['DDR4 SPD','512 bytes, EE1004 type'],['DDR5 SPD','1,024 bytes in the SPD hub'],['Intel XMP 3.0','Up to five profiles on DDR5'],['AMD EXPO','AMD’s overclocking profile format']],
 [['DDR4 size','512 bytes'],['DDR5 size','1,024 bytes'],['Read by','the BIOS at start-up']],
 'The SPD table includes a checksum, so the BIOS can tell if the data has been corrupted or edited badly.',
 [['spd-bus','How it is read'],['bios','The firmware that reads it'],['ic-24c02','A real EEPROM of this kind']]);

deep('spd','spd-sensor',4,'Temperature sensor','Reports how hot the memory is',
 'A small sensor that reports the temperature of the memory module.',
 'DDR5 modules have a temperature sensor inside the SPD hub chip, and DDR4 modules could have one in the SPD chip. It gives a reading with a resolution of a fraction of a degree, that the system can read at any time.',
 'The computer can read the temperature to slow the memory down or increase its refresh rate when the module gets hot. Monitoring tools show it too.',
 'DRAM leaks faster when it is hot, so a hot module needs more frequent refreshes. Temperature information keeps overclocked memory safe.',
 [['Renesas SPD5118','DDR5 SPD hub with a temperature sensor'],['Microchip AT30TSE004A','DDR4 SPD with a temperature sensor'],['HWiNFO','A tool that shows the sensor value'],['Extended temperature range','Some memory refreshes twice as often when hot']],
 [['Accuracy','about ±1 °C'],['Interface','SMBus or I3C'],['Used for','throttling and refresh rate']],
 'Above about 85 °C, standard DRAM has to refresh its cells twice as often, which costs some performance.',
 [['spd-bus','How the reading is sent'],['dram-control','Uses the refresh rate'],['cooling','The fans and heatsinks that keep it cool']]);

deep('spd','spd-bus',4,'Bus interface','How the motherboard talks to the SPD chip',
 'The slow serial bus (SMBus, I²C or I3C) the motherboard uses to read the SPD chip.',
 'DDR4 modules use the two-wire SMBus (a form of I²C), with an address that depends on the slot. DDR5 modules use an SPD hub, on a two-wire I3C bus with a higher speed, that also acts as a gateway to the module’s other small chips.',
 'The motherboard’s controller sends the module’s address and reads the SPD table byte by byte. This happens before the main memory bus is working, so it uses the slow bus that needs only two wires.',
 'A separate slow bus lets the computer find out what memory is installed before it can use it. The memory itself cannot be used until its timings are known.',
 [['SMBus / I²C','Two wires, up to 400 kHz'],['MIPI I3C','Faster successor used by DDR5'],['SPD hub','Chip on DDR5 modules that manages the small chips'],['Slot address','Chosen by pins on each memory slot']],
 [['Wires','2 (clock and data)'],['Speed','100 to 400 kHz (SMBus), up to 12.5 MHz (I3C)'],['Address','set by the slot']],
 'Tools that read and write SPD chips use this bus, which is also how RGB memory lighting is sometimes controlled.',
 [['spd-eeprom','What it reads'],['io','A bus of the same family carries other small devices'],['bios','Uses it at boot']]);

/* ---------------- The CPU caches ---------------- */
deep('cache','cache-l1',4,'L1 cache','The smallest and fastest cache, private to each core',
 'A very small, very fast cache inside each core, split into one part for instructions and one for data.',
 'Typically 32 to 64 KB for each half. A Golden Cove core has 32 KB for instructions and 48 KB for data; an Apple Firestorm core has 192 KB for instructions and 128 KB for data. It is made of SRAM right beside the execution units.',
 'It answers most of the core’s loads and instruction fetches within about 4 or 5 clock cycles. Splitting instructions from data lets the core fetch an instruction and load a value in the same cycle.',
 'A core could only run at full speed if it never had to wait for memory. L1 is what makes that possible for the data it is using right now.',
 [['Intel Golden Cove','32 KB instruction + 48 KB data per core'],['AMD Zen 4','32 KB instruction + 32 KB data per core'],['Apple Firestorm','192 KB instruction + 128 KB data'],['ARM Cortex-A78','32 or 64 KB per half']],
 [['Size','32 to 192 KB per half'],['Latency','about 4 to 5 cycles'],['Shared by','one core']],
 'In the 0.8 nanoseconds an L1 hit takes on a 5 GHz core, light travels only about 24 centimetres.',
 [['cache-l2','The next level down'],['sram-cell','What it is made of'],['registers','Even closer to the core']]);

deep('cache','cache-l2',4,'L2 cache','A larger cache that backs up the L1',
 'A bigger, slightly slower cache for each core (or small group of cores).',
 'Typically 256 KB to 2 MB per core: AMD Zen 4 has 1 MB per core, Intel Golden Cove 1.25 MB (2 MB on server chips), and Apple’s M-series shares 12 MB or more between cores in a cluster. It is still made of SRAM, but arranged for capacity.',
 'It catches what the L1 misses, at a cost of about 12 to 15 clock cycles. Data evicted from the L1 goes here, and data fetched from further away passes through it.',
 'The gap between L1 and main memory is enormous. L2 fills part of that gap so a miss in L1 rarely means a trip to RAM.',
 [['AMD Zen 4','1 MB per core'],['Intel Golden Cove','1.25 MB per core (desktop)'],['Apple M-series','Large L2 shared by a cluster of cores'],['ARM Cortex-X4','Up to 2 MB per core']],
 [['Size','256 KB to a few MB'],['Latency','about 12 to 15 cycles'],['Shared by','one core, or a small cluster']],
 'When AMD doubled the L2 cache per core from Zen 3 to Zen 4 (512 KB to 1 MB), many programs got faster just because they missed less.',
 [['cache-l1','The level above'],['cache-l3','The level below'],['cache-tags','How it finds a line']]);

deep('cache','cache-l3',4,'L3 cache','A large cache shared by all the cores',
 'A big cache shared by all cores, that also helps them share data with each other.',
 'Typically 16 to 128 MB on desktop chips (36 MB on a Core i9-14900K, 64 MB on a Ryzen 9 7950X, and 128 MB on a 7950X3D with 3D V-Cache), and more than 1 GB on some server chips. It sits on the chip’s internal network, split into slices.',
 'It catches what the L2 caches miss, in about 40 to 50 clock cycles, still far faster than main memory. When one core writes data that another core needs, it usually passes through the L3.',
 'L3 is the last line of defence before slow main memory, and it lets many cores work on the same data without going out to RAM each time.',
 [['Intel Smart Cache','Shared L3 on Core processors'],['AMD 3D V-Cache','An extra layer of L3 stacked on the chip'],['AMD Infinity Cache','L3-style cache on Radeon graphics cards'],['AMD EPYC 9684X','About 1.1 GB of L3 cache']],
 [['Size','16 to 128+ MB'],['Latency','about 40 to 50 cycles'],['Shared by','all the cores']],
 'AMD’s 3D V-Cache stacks a second layer of cache on top of the CPU die, like a cake, to triple the L3 without making the chip wider.',
 [['cache-l2','The level above'],['memory-controller','The next stop is main memory'],['bus-interface','The network that links the slices']]);

deep('cache','cache-tags',4,'Tags and cache lines','How a cache knows what it is holding',
 'The small labels that tell a cache which piece of memory each of its stored blocks holds.',
 'A cache stores data in blocks of 64 bytes called lines. Next to each line is a tag: the top bits of its address, plus status bits. The cache is divided into sets, and each set holds a few lines (its “ways”, typically 8 or 12).',
 'On a load, the cache uses part of the address to pick a set, then compares the tags of all the lines in that set with the rest of the address. A match is a “hit” and returns the data; no match is a “miss”, and the line is fetched from the next level, replacing an old one.',
 'Tags are what let a small cache stand in for a huge memory. The design of the sets and ways decides how often unlucky addresses push each other out.',
 [['8-way set associative','Common L1 and L2 design'],['MESI protocol','Keeps caches of different cores consistent'],['LRU replacement','Evicts the line used least recently'],['64-byte cache line','The unit of transfer on x86']],
 [['Line size','64 bytes'],['Ways','8 to 16 per set'],['Status bits','valid, dirty, sharing state']],
 'A “miss” costs so much that programs which walk through memory in order are far faster than ones that jump around: whole 64-byte lines are fetched at a time.',
 [['cache-l1','A cache that uses tags'],['sram-cell','Tags are stored in SRAM too'],['comparator','The tags are compared by comparators']]);

/* ---------------- Inside NAND flash ---------------- */
deep('nand-flash','nand-plane',5,'Dies and planes','The parts of a flash chip that work in parallel',
 'A flash chip has several dies, each split into planes that can be read or written at the same time.',
 'A NAND package holds a stack of dies (2, 4, 8 or more). Each die has 2 to 4 planes, and each plane has thousands of blocks, its own page buffer and its own row decoder, so that the planes work independently.',
 'The controller sends commands to several dies and planes at once, so that while one is slowly programming its cells, others are being read. This is called interleaving.',
 'A single flash operation is slow (tens to hundreds of microseconds). An SSD is fast because it runs a great many of them in parallel.',
 [['Micron 232-layer NAND','3D flash with 232 layers'],['Kioxia BiCS8','218-layer 3D flash'],['SK hynix 238-layer NAND','238-layer 3D flash'],['Samsung V-NAND','Vertically stacked flash']],
 [['Dies per package','2 to 16'],['Planes per die','2 to 6'],['Blocks per plane','thousands']],
 'A single NAND package can hold 16 dies stacked on top of each other, each only a few tens of micrometres thick, in a chip smaller than a postage stamp.',
 [['nand-block','What a plane is made of'],['ssd-controller','Schedules the parallel work'],['nand-buffer','Each plane has its own']]);

deep('nand-flash','nand-block',5,'Block','The smallest part of flash that can be erased',
 'A group of pages that must be erased together before any of them can be written again.',
 'A block is a large array of cells (several megabytes, 256 to 2,000 or more pages). In each vertical string, many cells are connected in series between two select transistors. In modern 3D NAND, each string is a tall column with a layer of cells at each level.',
 'To erase a block, the controller applies a high voltage to the whole block, which clears every cell in it at once. Blocks wear out: after some thousands of erase cycles (fewer for QLC) they stop holding charge reliably.',
 'Flash cannot overwrite data in place: it can only write to an erased page. This is why an SSD has a controller that moves data around and erases blocks in the background (garbage collection).',
 [['NAND string','Cells connected in series between select gates'],['3D NAND','Strings built as vertical columns'],['Erase cycle','About 3,000 for TLC, fewer for QLC'],['Wear levelling','Spreads erases evenly across blocks']],
 [['Size','several MB (hundreds of pages)'],['Erase cycles','about 1,000 to 100,000, depending on type'],['Erase time','a few milliseconds']],
 'Deleting a file on an SSD normally does not erase anything: the drive is only told the data is no longer needed, and erases the block later.',
 [['nand-page','What a block is made of'],['ssd-controller','Manages erasing'],['memory-cells','The kind of cell inside it']]);

deep('nand-flash','nand-page',5,'Page','The smallest part of flash that can be read or written',
 'A row of cells, typically 16 KB, read and written as one unit.',
 'A page is all the cells along one word line of a block, typically 16 KB of data plus some extra bytes for error-correcting codes. In multi-level flash, each cell stores 2, 3 or 4 bits (MLC, TLC, QLC), spread over several logical pages.',
 'Reads and writes (“programs”) happen a page at a time. A page must be erased before it is written, and pages within a block are written in order. A read takes tens of microseconds, and a program hundreds.',
 'The page size is why small writes are costly on an SSD: changing one byte means the controller has to write a whole new page somewhere else.',
 [['16 KB page','Typical page size of current NAND'],['Spare area','Extra bytes for error correction'],['TLC page set','3 bits per cell across 3 pages'],['QLC page set','4 bits per cell across 4 pages']],
 [['Size','about 16 KB plus spare bytes'],['Read time','tens of microseconds'],['Program time','hundreds of microseconds']],
 'Reading a TLC page means checking the cell’s charge against several reference voltage levels in turn, so some pages are quicker to read than others.',
 [['nand-block','Contains many pages'],['nand-buffer','Holds the page while it is worked on'],['ssd-controller','Adds error correction to each page']]);

deep('nand-flash','nand-buffer',5,'Page buffer and sense circuits','Hold the page and read the cells’ charges',
 'Latches at the edge of each plane that hold a page in transit and detect each cell’s state.',
 'Below the array is a row of page-buffer circuits, one for each bit line. Each has a sense amplifier that can tell whether a cell conducts at a certain reference voltage, and a few latches that hold the bits.',
 'To read, the chip applies a reference voltage to the selected word line and each sense circuit records whether its cell conducted. For a multi-bit cell it repeats this with several voltages. To write, the latches hold the data while pulses of voltage move charge into the cells.',
 'The page buffer is the connection between the slow, analog world of trapped charge and the fast digital bus. It is also why a whole page is moved at a time.',
 [['Sense amplifier','Detects if the cell conducts'],['Data latches','Hold the bits being read or written'],['Read retry','Repeats the read with adjusted voltages'],['ONFI / Toggle interface','Buses that carry pages in and out']],
 [['Per bit line','one sense circuit and several latches'],['Reference levels','1 (SLC) to 15 (QLC)'],['Interface','ONFI or Toggle, up to several Gbit/s']],
 'As flash ages, the stored charges drift. Many drives re-read a failing page with slightly shifted reference voltages until the data can be decoded.',
 [['nand-page','The data it holds'],['nand-plane','Each plane has its own'],['sram-sense','A sense amplifier of a different kind']]);
