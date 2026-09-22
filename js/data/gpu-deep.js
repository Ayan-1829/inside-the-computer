/* ==========================================================
   data/gpu-deep.js
   Going deeper inside the graphics card: the parts of the card and its chip, the inside of a
   compute unit, a shader core's multiply-add, VRAM, the memory controller and the display
   engine. Drawn by scenes/gpu-deep.js. Uses deep() from data/memory-deep.js.
   Edit the text here, then run: node build/build.mjs
   ========================================================== */

/* ---------------- More parts of the graphics card ---------------- */
deep('gpu','gpu-l2cache',3,'L2 cache','A large on-chip cache between the cores and the memory',
 'A big shared cache on the GPU chip that keeps frequently used data close to the compute units.',
 'A block of SRAM, split into slices, sitting on the chip between the compute units and the memory controllers. It has grown a lot: the RTX 3090 has 6 MB, the RTX 4090 has 72 MB, and AMD’s Radeon RX 7900 XTX has 6 MB of L2 plus 96 MB of Infinity Cache.',
 'Every load and store from the compute units goes through it. If the data is there (a hit), it is returned in a few dozen cycles, without using the much slower and more power-hungry VRAM.',
 'Memory bandwidth limits many graphics and AI programs. A large cache turns many VRAM accesses into on-chip ones, so a card can do more with a narrower memory bus.',
 [['NVIDIA RTX 4090','72 MB of L2 cache'],['NVIDIA RTX 3090','6 MB of L2 cache'],['AMD Radeon RX 7900 XTX','96 MB Infinity Cache + 6 MB L2'],['NVIDIA H100','50 MB of L2 cache']],
 [['Size','6 to 96+ MB'],['Made of','SRAM'],['Shared by','all compute units']],
 'The RTX 4090’s L2 cache is 12 times bigger than the RTX 3090’s, and both have a 384-bit memory bus: the larger cache means fewer requests have to go out to VRAM.',
 [['compute-units','Its main users'],['memory-controller','Where a miss goes next'],['cache','The same idea inside a CPU']]);

deep('gpu','gpu-media',3,'Video and display engines','Fixed circuits that encode, decode and show video',
 'Dedicated hardware on the chip for video encoding and decoding, and for sending frames to the screen.',
 'Separate from the compute units, the chip has blocks that do only one job: the video decoder and encoder (NVIDIA NVENC and NVDEC, AMD VCN, Intel’s Xe Media Engine) and the display engine that reads finished frames and sends them to the connectors.',
 'When you watch a video, the decoder unpacks each frame (H.264, HEVC, AV1) without using the compute units. When you stream or record, the encoder compresses the picture in real time. The display engine feeds the monitor at its refresh rate.',
 'Doing these jobs in fixed circuits uses a tiny fraction of the power a general-purpose core would need, so video plays for hours on a laptop, and recording a game barely slows it down.',
 [['NVIDIA NVENC / NVDEC','Encoder and decoder blocks'],['AMD VCN','Video Core Next engine'],['Intel Xe Media Engine','Intel Arc’s video block, with AV1 encoding'],['Apple media engine','Video blocks in M-series chips']],
 [['Codecs','H.264, HEVC, VP9, AV1'],['Encoders','1 to 3 on recent cards'],['Independent of','the compute units']],
 'Intel’s Arc cards were the first consumer graphics cards with hardware AV1 encoding, in 2022; NVIDIA’s RTX 40 series and AMD’s RX 7000 series followed.',
 [['display-outputs','Where the finished frames go'],['memory-controller','Reads and writes the video data'],['gpu-pcie','Brings in the compressed video']]);

deep('gpu','gpu-pcie',3,'PCIe interface','The link between the graphics card and the rest of the computer',
 'The circuits that connect the GPU to the CPU and system memory over the PCI Express slot.',
 'A block on the chip with 16 PCIe lanes, plus DMA (direct memory access) engines that copy data without the CPU’s help. A PCIe 4.0 x16 link carries about 32 GB/s in each direction, and a PCIe 5.0 x16 link about 63 GB/s.',
 'The CPU sends commands and data to the card through it, and the card reads textures and models from system memory when they do not fit in VRAM. With “Resizable BAR”, the CPU can access all of the card’s VRAM at once.',
 'The link is much slower than the card’s own memory (about 1 TB/s on a fast card), so a good program keeps its data in VRAM and uses the slot as little as possible.',
 [['RTX 4090','PCIe 4.0 x16'],['Radeon RX 7900 XTX','PCIe 4.0 x16'],['RTX 5090','PCIe 5.0 x16'],['Resizable BAR','Lets the CPU see all of the VRAM at once']],
 [['Lanes','16'],['PCIe 4.0 x16','about 32 GB/s each way'],['PCIe 5.0 x16','about 63 GB/s each way']],
 'A modern graphics card’s memory is about 30 times faster than its PCIe link, which is why running out of VRAM slows games down so sharply.',
 [['pcie','The slot on the motherboard'],['vram','Much faster than this link'],['cpu','The other end of the link']]);

deep('gpu','gpu-power',3,'Power delivery','Turns the 12 V from the power supply into the voltages the chip needs',
 'The voltage regulator on the card that converts 12 V to about 1 V at hundreds of amps for the chip, and the voltages for the memory.',
 'A row of power stages (a MOSFET pair with a driver), each with an inductor and capacitors, next to the GPU. A large card can have 20 or more phases. Power comes from the slot (75 W) and one or more cables: an 8-pin connector adds 150 W, and the 16-pin 12VHPWR (or 12V-2x6) up to 600 W.',
 'A controller switches the power stages on in turn, many hundreds of thousands of times a second, and each one delivers a slice of the current. The output is a steady voltage close to 1 V, adjusted many times a second as the load changes.',
 'A GPU chip can draw over 300 A. Delivering it without a large voltage drop, and without wasting much power as heat, takes a large and carefully designed regulator.',
 [['DrMOS power stage','Driver and MOSFETs in one package'],['Inductor (choke)','Stores energy in each phase'],['12VHPWR / 12V-2x6','16-pin connector, up to 600 W'],['8-pin PCIe power','150 W per connector']],
 [['Core voltage','about 0.8 to 1.1 V'],['Current','over 300 A on a high-end card'],['Slot power','75 W']],
 'The 16-pin connector on high-end cards carries 600 W at 12 V, which is 50 amps, through a plug barely bigger than a matchbox.',
 [['vrm','The same idea on the motherboard'],['psu','Supplies the 12 V'],['voltage-regulation','How the conversion works']]);

/* ---------------- Inside a compute unit (streaming multiprocessor) ---------------- */
deep('compute-units','sm-scheduler',4,'Warp scheduler and dispatch','Picks which group of threads runs next',
 'The controller that chooses which group of 32 threads (a warp) issues an instruction on each clock cycle.',
 'A GPU runs its threads in groups of 32 called warps (AMD calls them waves). An NVIDIA Ada compute unit (SM) has four schedulers, one in each quarter of the SM, each tracking up to a dozen warps and feeding its own set of cores.',
 'Every cycle, each scheduler looks for a warp that is ready (its data has arrived), and sends its next instruction to all 32 lanes at once. If a warp is waiting for memory, the scheduler simply switches to another, and no time is lost.',
 'This switching is how a GPU hides the long delays of memory. A CPU uses big caches and clever prediction; a GPU keeps thousands of threads ready and always finds one that can run.',
 [['NVIDIA Ada SM','Four warp schedulers per SM'],['AMD RDNA 3','Wave32 and wave64 execution'],['Intel Xe-core','Vector engines with their own thread control'],['SIMT','Single instruction, multiple threads']],
 [['Warp size','32 threads (NVIDIA)'],['Threads per SM','up to 1,536 (Ada)'],['Issue','one warp instruction per scheduler per cycle']],
 'An RTX 4090 keeps up to about 196,000 threads in flight at once, so that some of them are always ready when others are waiting for memory.',
 [['sm-cores','Where the instructions run'],['sm-registers','Where each thread’s values live'],['control-unit','The CPU’s version of this idea']]);

deep('compute-units','sm-cores',4,'Shader cores (CUDA cores)','The arithmetic units that do the floating-point maths',
 'Many small arithmetic units, each able to do one multiply-add on 32-bit numbers per clock.',
 'An Ada SM has 128 of them (16,384 on a whole RTX 4090). AMD calls them stream processors, and Intel calls them vector engine lanes. Each is simple and has no cache or predictor of its own; the parts around it keep it fed.',
 'When a warp’s instruction is issued, 32 of these units each perform the same operation on their own thread’s data, for example a fused multiply-add (a × b + c). At a 2.5 GHz clock, an RTX 4090 does about 80 trillion of these operations per second.',
 'Graphics and AI both consist of vast numbers of identical multiply-adds on different data. Using thousands of small simple units, instead of a few complex ones, makes a GPU far faster at them than a CPU.',
 [['NVIDIA CUDA cores','128 per Ada SM'],['AMD stream processors','64 or more per compute unit'],['Intel Xe vector engines','Intel Arc’s units'],['RTX 4090','16,384 CUDA cores']],
 [['Per SM (Ada)','128 FP32 lanes'],['Per clock','one fused multiply-add each'],['RTX 4090 speed','about 82 TFLOPS in FP32']],
 'At about 82 trillion operations a second, an RTX 4090 does in a single second what a person with a calculator doing one a second would need over two and a half million years for.',
 [['fma-multiplier','What one core does first'],['sm-scheduler','Feeds the cores'],['alu','The CPU’s counterpart']]);

deep('compute-units','sm-tensor',4,'Tensor cores (matrix engines)','Multiply small grids of numbers in one step',
 'Special units that multiply and add whole small matrices at once, mainly for AI.',
 'An Ada SM has four of them (4th-generation Tensor Cores). Each takes small tiles of numbers, for example 16 × 16, in low-precision formats such as FP16, BF16, FP8 or INT8, multiplies two of them, and adds the result to a third. AMD has AI Accelerators, and Intel has XMX engines.',
 'They do in a single instruction what would take hundreds of ordinary multiply-adds. They power the matrix multiplications of neural networks, and features such as NVIDIA DLSS, which uses AI to upscale a game’s picture.',
 'Modern AI is mostly matrix multiplication. Tensor cores make a GPU many times faster at it than its normal cores, which is why GPUs run today’s AI models.',
 [['NVIDIA Tensor Cores','4th generation in the Ada SM'],['AMD AI Accelerators','In RDNA 3 compute units'],['Intel XMX engines','In Arc GPUs'],['NVIDIA DLSS','AI upscaling that runs on them']],
 [['Per SM (Ada)','4'],['Tile size','for example 16 × 16'],['Formats','FP16, BF16, FP8, INT8']],
 'Tensor cores gained their speed by using low-precision numbers: an 8-bit multiplier is a small fraction of the size of a 32-bit one, so many more fit on the chip.',
 [['sm-cores','The normal arithmetic units'],['multiplier','A multiplier circuit is repeated many times inside'],['adder','And an adder collects the results']]);

deep('compute-units','sm-rt',4,'Ray-tracing core','Hardware that finds where light rays hit the scene',
 'A dedicated unit that tests rays of light against the objects in a 3D scene.',
 'A scene is stored as a tree of nested boxes (a BVH, bounding volume hierarchy). The RT core walks that tree in hardware and tests rays against boxes and triangles. An Ada SM has one (3rd-generation) RT core; AMD has a Ray Accelerator in each compute unit, and Intel has a Ray Tracing Unit.',
 'For each ray, the RT core quickly decides which triangle it hits first, and returns the result to the shader cores. This is the costly step of ray tracing, which produces realistic reflections, shadows and light.',
 'Ray tracing needs billions of ray tests per second. Doing them in fixed hardware makes them roughly an order of magnitude faster than running the same search on the shader cores.',
 [['NVIDIA RT Cores','3rd generation in the Ada SM'],['AMD Ray Accelerators','One per compute unit'],['Intel Ray Tracing Unit','In Arc Xe-cores'],['BVH','Tree of nested bounding boxes']],
 [['Per SM (Ada)','1'],['Tests','ray–box and ray–triangle'],['Data','the BVH, held in VRAM']],
 'The first games with real-time ray tracing appeared in 2018, when NVIDIA’s RTX 20 series added RT cores to consumer graphics cards.',
 [['sm-cores','Use its results'],['vram','Holds the scene tree'],['gpu','The card it is part of']]);

deep('compute-units','sm-registers',4,'Register file','A huge private store for every thread’s values',
 'A very large, fast memory that holds the registers of all the threads running on the compute unit.',
 'An NVIDIA SM has 65,536 32-bit registers, which is 256 KB (as much as an entire small CPU’s L2 cache), for the threads on it. Each thread has its own registers, and they stay there for the thread’s whole life.',
 'When the warp scheduler issues an instruction, the operands are read from this file, and the results are written back. The register file is split into banks so that many reads can happen in a cycle.',
 'Holding every thread’s values on the chip is what lets the GPU switch warps instantly, without saving anything. It also limits how many threads can run: more registers per thread means fewer threads fit.',
 [['NVIDIA Ada SM','256 KB of registers per SM'],['AMD RDNA 3','Vector register file per SIMD'],['Register pressure','Using too many registers cuts the number of threads'],['Register spilling','Extra values spill to slower memory']],
 [['Size','256 KB per SM (Ada)'],['Registers','65,536 × 32 bit'],['Access','many reads per cycle']],
 'The register files of a whole RTX 4090 add up to about 32 MB, as much as the L3 cache of many desktop CPUs.',
 [['registers','A CPU has just a few dozen'],['sm-scheduler','Decides who reads next'],['sram-cell','The register file is made of SRAM cells']]);

deep('compute-units','sm-shared',4,'Shared memory and L1 cache','A fast scratchpad the threads of a block can share',
 'A fast on-chip memory that a group of threads can use to share data, that also works as an L1 cache.',
 'About 128 KB per SM on Ada, split by the program between a scratchpad (shared memory) that threads control directly, and an L1 cache that works automatically. It is built from SRAM in many banks so that 32 threads can read in a single cycle.',
 'A program loads a tile of data from VRAM into shared memory once, and then the threads of the block reuse it many times at high speed, instead of asking VRAM each time. That cuts the traffic to the slow memory.',
 'Careful use of shared memory is one of the main tricks for making programs fast on a GPU: it turns many slow reads into one slow read and many quick ones.',
 [['NVIDIA shared memory','Programmable scratchpad, in CUDA'],['AMD LDS','Local data share'],['Intel SLM','Shared local memory'],['Memory banks','32 banks, so 32 threads can read at once']],
 [['Size','about 128 KB per SM (Ada)'],['Latency','about 20 to 30 cycles'],['Banks','32']],
 'If two threads try to read different words from the same bank in one cycle, they take turns: this “bank conflict” is a common reason GPU programs run slower than expected.',
 [['gpu-l2cache','The next level'],['sm-registers','Even faster, but private to a thread'],['sram','What it is made of']]);

deep('compute-units','sm-texture',4,'Texture units','Fetch and blend the pixels of images (textures)',
 'Units that read texture images and blend nearby pixels to get a smooth result at any angle and distance.',
 'An Ada SM has four. A texture unit takes texture coordinates (which may fall between pixels of the image), fetches the nearest texels, and blends them with bilinear, trilinear or anisotropic filtering. It has its own small cache, and can decompress compressed textures on the fly.',
 'When a game draws a surface, each pixel asks for a colour from a texture. The texture unit does the reading, choosing the right detail level and blending in hardware, so that the shader cores can go on with other work.',
 'Filtering is what stops textures looking blocky or shimmering when they are close up or seen at a slant. Doing it in hardware, once per pixel, is essential for real-time graphics.',
 [['Bilinear filtering','Blends the 4 nearest texels'],['Anisotropic filtering','Sharp textures at slanted angles'],['BC / ASTC compression','Compressed texture formats decoded in hardware'],['Mipmaps','Pre-shrunk copies of a texture for distant surfaces']],
 [['Per SM (Ada)','4'],['Filtering','bilinear, trilinear, anisotropic'],['Own cache','a small texture cache']],
 'GPUs are still built around texture units, because graphics began with drawing textured triangles, and they are one of the reasons “GPU” still means “graphics”.',
 [['sm-shared','Shares the on-chip memory'],['gpu-l2cache','Texture data is cached here too'],['vram','Where textures are stored']]);

/* ---------------- Inside a shader core: the fused multiply-add ---------------- */
deep('sm-cores','fma-multiplier',5,'Multiplier','Multiplies the two numbers’ mantissas',
 'The first step of a fused multiply-add: multiply the two 24-bit mantissas and add the exponents.',
 'A 32-bit floating-point number has a sign, an 8-bit exponent and a 23-bit fraction (plus a hidden leading 1, giving a 24-bit mantissa). The multiplier forms a 48-bit product of two mantissas, using a tree of adders (like the binary multiplier), and adds the two exponents.',
 'It produces the full, unrounded product and its exponent, and passes them on. A “fused” multiply-add keeps all 48 bits, so nothing is rounded until the very end.',
 'Fusing avoids rounding twice, which makes results more accurate and lets a program do a multiply and an add in one instruction. It is the basic operation in graphics, physics and AI.',
 [['IEEE 754 binary32','The 32-bit floating-point format'],['Booth encoding','Cuts the number of partial products'],['Wallace tree','Adds the partial products quickly'],['NVIDIA fmaf()','A CUDA function for a fused multiply-add']],
 [['Input','two 24-bit mantissas'],['Output','a 48-bit product'],['Exponent','the two exponents are added']],
 'Every pixel of a modern game needs hundreds of these multiplications, and a fast GPU does tens of trillions of them each second.',
 [['multiplier','The binary multiplier this is built from'],['fma-align','Next step: align the addend'],['sm-cores','The core it is inside']]);

deep('sm-cores','fma-align',5,'Alignment shifter','Lines up the third number with the product',
 'A shifter that moves the addend’s mantissa so that its exponent matches the product’s.',
 'To add two floating-point numbers, their binary points must line up. While the multiplier works, this circuit compares the addend’s exponent with the product’s, and shifts the smaller number right by the difference, using a barrel shifter.',
 'It runs at the same time as the multiplication, so that it costs no extra time. Any bits shifted out are kept as “guard” and “sticky” bits, so the final rounding is exact.',
 'Without alignment, the numbers could not be added, because their digits would mean different powers of two. Doing it in parallel with the multiplier is what makes a fused multiply-add as fast as a plain multiply.',
 [['Barrel shifter','Shifts by any amount in one step'],['Guard bit','First bit shifted out, kept for rounding'],['Sticky bit','Records whether any lower bit was non-zero'],['Exponent comparator','Finds which number is smaller']],
 [['Shift range','up to the width of the mantissa'],['Extra bits kept','guard and sticky'],['Runs','in parallel with the multiplier']],
 'A number that is far smaller than the product just shifts out of the window entirely, and only leaves its sticky bit behind.',
 [['shifter','The barrel shifter this uses'],['comparator','The exponents are compared'],['fma-adder','Adds the aligned numbers']]);

deep('sm-cores','fma-adder',5,'Adder','Adds the product and the aligned number',
 'A wide adder that adds the 48-bit product to the aligned addend.',
 'A wide carry-propagate adder (typically about 74 bits with the extra bits) built from a fast design such as carry-lookahead. It also handles the sign: if the signs differ, it subtracts, using two’s complement.',
 'It adds the two aligned numbers and delivers a sum that may need to be normalised: it might be much smaller (if the numbers nearly cancelled) or have one extra bit at the top.',
 'This is the step that does the actual addition. It has to be very fast, because it sits in the middle of the shortest path of every floating-point operation.',
 [['Carry-lookahead adder','A fast adder design'],['Kogge–Stone adder','Very fast, larger adder'],['Carry-save adder','Used inside the multiplier tree'],['Two’s complement','Used to subtract']],
 [['Width','about 74 bits'],['Design','carry-lookahead or similar'],['Also does','subtraction']],
 'If two nearly equal numbers are subtracted, the leading digits cancel, and the answer has fewer accurate digits: this “catastrophic cancellation” is a well-known trap of floating-point.',
 [['adder','The basic full adder'],['carry-lookahead','How a wide adder is made fast'],['subtractor','How it subtracts']]);

deep('sm-cores','fma-normalise',5,'Normalise and round','Tidies up the result into a valid number',
 'The last step: shift the result so it starts with a 1, adjust the exponent, and round it to 24 bits.',
 'A leading-zero counter finds how many places the sum must be shifted left to start with a 1. A shifter does it, the exponent is adjusted, and then the result is rounded to the nearest representable value (with ties going to the even neighbour), and packed into the 32-bit format.',
 'It also detects special cases: overflow (too big, giving infinity), underflow (too small), and not-a-number results, and sets the matching flags.',
 'Rounding once, at the end, is the reason a fused multiply-add gives a more accurate answer than a separate multiply and add, each of which rounds.',
 [['Leading-zero anticipator','Predicts the shift while the addition runs'],['Round to nearest even','IEEE 754’s default rounding'],['Denormal numbers','Very small numbers that fill the gap near zero'],['IEEE 754 exceptions','Overflow, underflow, invalid, inexact']],
 [['Rounding','to nearest, ties to even'],['Output','32-bit floating-point number'],['Special values','infinity, NaN, zero']],
 'The IEEE 754 standard was published in 1985, and a fused multiply-add was added in its 2008 revision.',
 [['shifter','Shifts the result into place'],['fma-adder','Supplies the raw sum'],['flag-logic','Sets flags like a CPU’s ALU']]);

/* ---------------- Inside VRAM ---------------- */
deep('vram','vram-chip',4,'GDDR memory chip','The chips soldered around the GPU',
 'A GDDR chip: a very fast DRAM designed for graphics, with a 32-bit interface, placed close to the GPU.',
 'Modern cards use GDDR6, GDDR6X and now GDDR7 chips, each 1 to 3 GB with a 32-bit connection. They are BGA packages soldered right around the GPU, so the connections are short. Inside, they are DRAM, like the chips on a memory stick, but tuned for speed.',
 'A GDDR6 chip transfers 14 to 24 bits on each pin every second (billions of transfers), for a total of up to about 96 GB/s per chip. A card places 8 to 12 of them in parallel to reach hundreds of GB/s.',
 'The card’s memory speed decides how fast it can move textures, frames and data. GDDR trades some latency and power for a great deal of bandwidth compared with normal DDR memory.',
 [['Micron GDDR6X','21 Gbit/s per pin, on RTX 30 and 40 cards'],['Samsung GDDR6','Up to 24 Gbit/s per pin'],['SK hynix GDDR6','Used on many Radeon cards'],['GDDR7','Newest generation, RTX 50 series']],
 [['Interface','32 bits per chip'],['Speed per pin','14 to 24+ Gbit/s'],['Per chip','up to about 96 GB/s (GDDR6)']],
 'GDDR stands for “graphics double data rate”, and although it shares its name with the memory on your RAM stick, it has been a separate design since GDDR3.',
 [['dram','The same technology in a different design'],['vram-bus','How the chips connect'],['memory-controller','Talks to them']]);

deep('vram','vram-bus',4,'Memory bus and PHY','The wide set of wires from the GPU to the memory chips',
 'The many connections between the GPU’s memory controllers and the memory chips.',
 'Each GDDR chip adds 32 bits, so the bus width is 32 times the number of chips: 192 bits (6 chips), 256 bits (8 chips), or 384 bits (12 chips). The traces are drawn with matched lengths so all bits of a group arrive together, and their speed is set by a high-speed interface (PHY) on the chip.',
 'Bandwidth is simply the width times the speed per pin: a 384-bit bus at 21 Gbit/s gives 384 × 21 ÷ 8 = 1,008 GB/s, which is what the RTX 4090 has. An RTX 4070, on a 192-bit bus at the same speed, has 504 GB/s.',
 'Bandwidth is what many graphics workloads need most. A wide bus needs many pins, many traces and a large chip, which is one reason high-end cards are so big and expensive.',
 [['RTX 4090','384-bit bus, about 1,008 GB/s'],['RTX 4070','192-bit bus, about 504 GB/s'],['Radeon RX 7900 XTX','384-bit bus, about 960 GB/s'],['Length-matched traces','Wires of equal length so the bits arrive together']],
 [['Width','32 bits per chip'],['Bandwidth','width × speed ÷ 8'],['Layers','many-layer circuit board']],
 'The wires between the GPU and each memory chip are less than a few centimetres long, and are designed to be exactly the same length, to within a fraction of a millimetre.',
 [['vram-chip','What it connects'],['mc-phy','The circuit at the GPU end'],['pcie','A different, slower link on the same card']]);

deep('vram','vram-hbm',4,'HBM stacks','Memory chips stacked on top of each other, beside the GPU',
 'High-bandwidth memory: layers of DRAM stacked in a tower, connected to the GPU through a silicon board.',
 'An HBM stack is 8 or 12 DRAM dies piled on a base die, connected vertically by thousands of through-silicon vias (TSVs). It sits beside the GPU on a silicon interposer, and has a 1,024-bit interface (a GDDR chip has 32). Cards for AI use 4 to 8 stacks.',
 'Each pin is slower than GDDR’s, but there are 32 times as many of them, so one HBM3 stack delivers about 819 GB/s. The NVIDIA H100 (80 GB, 5 stacks active) reaches 3.35 TB/s, and the AMD Instinct MI300X (192 GB) 5.3 TB/s.',
 'Stacking gives a lot of bandwidth in little space and with little energy per bit. It is costly to build, so it is used on data-centre AI accelerators rather than on gaming cards.',
 [['NVIDIA H100','80 GB of HBM3, 3.35 TB/s'],['AMD Instinct MI300X','192 GB of HBM3, 5.3 TB/s'],['SK hynix HBM3E','A newer, faster generation'],['Samsung HBM3','Another maker of stacked memory']],
 [['Interface','1,024 bits per stack'],['HBM3','about 819 GB/s per stack'],['Height','8 or 12 dies']],
 'A chip of HBM has thousands of tiny holes drilled right through it, each filled with metal, to send signals up to the layer above.',
 [['vram-chip','The other kind of graphics memory'],['dram','Each layer is a DRAM chip'],['memory-controller','Manages the many channels']]);

/* ---------------- Inside a GDDR chip ---------------- */
deep('vram-chip','gddr-channels',5,'Channels','Two separate memory chips in one package',
 'A GDDR6 chip is really two independent 16-bit memory channels that work at the same time.',
 'Each channel has its own address and command signals, its own banks and its own 16 data pins. The two do not have to work on the same thing, so the chip can handle two different requests at once.',
 'The memory controller sends separate commands to each channel, and each answers in its own time. Because the chip’s transfers are smaller (16 bits per channel, 32 bytes at a time), it wastes less when a program asks for small, scattered pieces of data.',
 'Small independent channels are better suited to graphics, in which many different cores ask for small amounts of data, than a single wide one.',
 [['GDDR6','2 channels of 16 bits per chip'],['LPDDR5','Also uses narrow channels'],['DDR5 DIMM','Two 32-bit subchannels per module'],['Pseudo-channels in HBM','A similar split inside a stack']],
 [['Channels','2 per GDDR6 chip'],['Width','16 bits each'],['Access size','32 bytes per burst']],
 'DDR5 memory sticks use the same idea: each stick is split into two independent 32-bit channels.',
 [['gddr-banks','Each channel has its own banks'],['mc-scheduler','Schedules requests to the channels'],['dram-banks','The same idea inside a normal DRAM chip']]);

deep('vram-chip','gddr-banks',5,'Banks and bank groups','Many arrays that can be opened in parallel',
 'Each channel is divided into 16 banks, arranged in bank groups.',
 'The banks are like those of ordinary DRAM: separate arrays with their own row decoders and sense amplifiers. The controller can open a row in one bank while reading from another. The bank groups let it interleave accesses without waiting for shared circuits to recover.',
 'While a row in one bank is being opened or closed, the chip can be transferring data from another, so the data pins stay busy. A good controller spreads consecutive addresses over the banks to make this possible.',
 'Bank-level parallelism is the reason a memory can keep up with its pins: each individual step is slow, but many of them overlap.',
 [['GDDR6','16 banks per channel'],['Bank groups','Groups that share some circuits'],['Row buffer','The open row in each bank'],['Address interleaving','Spreads addresses across banks']],
 [['Banks','16 per channel'],['Groups','4 bank groups'],['Row size','about 1 to 2 KB']],
 'Accessing the same bank twice in a row is many times slower than alternating between banks, so memory controllers try hard never to do it.',
 [['dram-banks','The same idea in DRAM'],['dram-sense-amps','Each bank has its own'],['mc-scheduler','Picks banks to keep busy']]);

deep('vram-chip','gddr-signalling',5,'High-speed interface','How the pins send billions of bits a second',
 'The circuits that send and receive data at 14 to 32 billion bits a second on each pin.',
 'A fast write clock (WCK) runs at twice the speed of the command clock, and data moves on both its edges. GDDR6X uses PAM4 (four voltage levels, so 2 bits for every signal change), and GDDR7 uses PAM3 (three levels). Equalizers and training circuits clean up the signal.',
 'Each data pin sends symbols at a rate of several gigahertz, and the receiver samples them in the middle of each symbol. Before use, the chip and the GPU run a training sequence to find the best timing and voltage for every pin.',
 'Faster pins mean more bandwidth from the same number of wires. Using more voltage levels doubles the data on each wire, but makes the signal more sensitive to noise.',
 [['GDDR6','14 to 24 Gbit/s per pin, 2 levels'],['GDDR6X','PAM4: 4 levels, about 21 Gbit/s per pin'],['GDDR7','PAM3: 3 levels, 28 to 32+ Gbit/s per pin'],['WCK clock','A fast clock that carries the data timing']],
 [['GDDR6','up to about 24 Gbit/s per pin'],['GDDR6X','PAM4 signalling'],['GDDR7','PAM3 signalling']],
 'GDDR6X’s four voltage levels are closer together than the two levels of ordinary signalling, so the receiving circuit has to tell them apart more precisely and the signal is more sensitive to noise.',
 [['dram-io','The normal DRAM version'],['mc-phy','The GPU end of the link'],['vram-bus','The wires the signals travel on']]);

/* ---------------- Inside the GPU's memory controller ---------------- */
deep('memory-controller','mc-scheduler',4,'Request scheduler','Decides the order of memory requests',
 'The circuit that reorders requests to the memory chips to keep them busy and cut waiting.',
 'Requests arrive from the L2 cache into queues, one for each memory channel. The scheduler does not serve them in order: a common policy, “first-ready, first-come-first-served”, prefers requests to a row that is already open, then the oldest.',
 'By grouping reads together, batching writes to avoid switching direction too often, and spreading requests across banks, it gets much more data out of the same chips than a simple queue would.',
 'A memory chip’s bandwidth is only reached if requests are arranged to suit it. The scheduler is the part that does it, and a good one can be worth as much as a faster chip.',
 [['FR-FCFS','First-ready, first-come-first-served policy'],['Read/write batching','Groups reads and writes to avoid switching'],['Bank-aware scheduling','Spreads accesses over banks'],['Refresh management','Slots refresh commands in']],
 [['Queues','one set per channel'],['Policy','row-hit first, then oldest'],['Goal','maximise bandwidth, bound the delay']],
 'Turning the bus around from reading to writing wastes tens of cycles, so a controller collects many writes and sends them together.',
 [['dram-control','Enforces the chip’s timing rules'],['gddr-banks','What it keeps busy'],['gpu-l2cache','Where the requests come from']]);

deep('memory-controller','mc-interleave',4,'Address interleaving','Spreads memory across all the channels',
 'The mapping that spreads consecutive addresses over all the memory channels, so they can work in parallel.',
 'The GPU’s address space is split into small chunks (for example 256 bytes) and dealt out to the memory controllers in turn, using a hash of the address bits. An RTX 4090 has 12 controllers, one for each 32-bit chip.',
 'When a program reads a large block of data, each of the controllers supplies a part of it at the same time, and the total bandwidth is the sum of all of them. The hash also stops unlucky patterns of addresses from all landing on one channel.',
 'If the addresses were laid out simply, the GPU could end up using only one of the 12 channels at times. Interleaving makes the whole memory bus available to every kind of program.',
 [['RTX 4090','12 memory controllers of 32 bits'],['Address hashing','Mixes address bits to avoid hot spots'],['Channel interleave','Alternating chunks between channels'],['Memory partitions','Each controller has its own L2 slice']],
 [['Chunk size','for example 256 bytes'],['Controllers','6 to 12 or more'],['Effect','all channels used in parallel']],
 'On many GPUs, each memory controller is paired with its own slice of the L2 cache, so a chunk’s cache and its memory are on the same side of the chip.',
 [['vram-bus','The wires it spreads the load over'],['gpu-l2cache','Each slice is paired with a controller'],['mc-scheduler','Works on each channel']]);

deep('memory-controller','mc-phy',4,'PHY and link training','The analog circuit that talks to the memory chips',
 'The high-speed interface circuits that drive the wires to the memory, and tune them for the best timing.',
 'For each data pin, the PHY has a driver, a receiver, delay lines and equalization. Each memory controller has one, at the edge of the chip, beside the pins that lead to the memory chips.',
 'When the card powers up, and from time to time after that, the PHY runs a training routine. It sends test patterns and adjusts each pin’s delay and voltage until the data is reliable, taking into account the traces’ lengths, the temperature and the chip.',
 'At tens of gigabits per second, every pin behaves differently. Training makes hundreds of pins agree on where each bit starts, and is why a memory overclock can be unstable.',
 [['Write leveling','Aligns the data with the clock at the chip'],['Read training','Finds the best time to sample each bit'],['Equalization','Cleans up the degraded signal'],['On-die termination','Stops signal reflections']],
 [['Per pin','driver, receiver, delay and equalizer'],['Training','at start-up and periodically'],['Tunes','timing and voltage of each pin']],
 'That pause when a graphics card first turns on the screen is partly the PHY training its memory connections, so that billions of bits per second arrive intact.',
 [['dram-io','The chip’s end of the link'],['vram-bus','The wires it drives'],['gddr-signalling','The signals it handles']]);

deep('memory-controller','mc-ecc',4,'Error protection','Detects and fixes errors in stored and transferred data',
 'Circuits that add check bits to the data, so that errors on the wires or in the chips can be detected and fixed.',
 'GDDR6 adds a CRC (error-detecting code) to the data on the bus; if a transfer is corrupted, the controller simply sends it again. HBM and data-centre GPUs also use ECC (error-correcting code) on the stored data, with a few extra bits per word.',
 'When the controller writes data, it computes and stores the check bits. When it reads, it recomputes them. A mismatch means an error: a single flipped bit can be corrected on the spot, and a larger one is reported.',
 'At these speeds and densities, a small number of bits are wrong from time to time. Protecting the data makes long computations and AI training runs reliable.',
 [['GDDR6 EDC','Error-detecting CRC on the link'],['HBM ECC','Error correction on stored data'],['NVIDIA data-centre GPUs','ECC memory on by default'],['SECDED','Single-error correct, double-error detect']],
 [['GDDR6 link','CRC-8 with retry'],['ECC','single-bit correct, double-bit detect'],['Cost','a few extra bits per word']],
 'Cosmic rays can flip a bit in memory: on a large cluster of GPUs, such a flip happens often enough that ECC is worth its cost.',
 [['dram-io','The chip end of the link'],['vram-hbm','Uses ECC'],['dram','ECC is also used on server DRAM']]);

/* ---------------- Inside the display outputs ---------------- */
deep('display-outputs','disp-scanout',4,'Scan-out engine','Reads the finished picture and feeds it to the screen',
 'The circuit that reads the frame from VRAM, line by line, and turns it into a stream of pixels.',
 'The display engine reads the frame buffer at exactly the screen’s refresh rate (for example 144 times a second), row by row. On the way it can scale the picture, apply colour correction and gamma, and blend overlays such as the mouse pointer.',
 'For every frame, it fetches millions of pixels in order and adds the blanking intervals the screen expects. With variable refresh rate (G-SYNC, FreeSync), it waits for the new frame to be ready, instead of sticking to a fixed timing.',
 'The screen needs a continuous stream of pixels at a fixed pace. A separate engine, with a small buffer, keeps it going even while the compute units are busy.',
 [['NVIDIA G-SYNC','Variable refresh rate'],['AMD FreeSync','Variable refresh rate'],['VESA Adaptive-Sync','The open standard behind them'],['Hardware cursor','An overlay drawn by the display engine']],
 [['Reads','the frame buffer in VRAM'],['Rate','the refresh rate (60 to 360 Hz)'],['Data','for 4K at 144 Hz, about 30 Gbit/s']],
 'A 4K screen at 144 Hz needs the display engine to read about 1.2 billion pixels every second, without ever missing one.',
 [['vram','Where the frame is stored'],['disp-encoder','Where the pixels go next'],['monitor-controller','The screen’s end of the chain']]);

deep('display-outputs','disp-encoder',4,'Link encoder and PHY','Packs the pixels for the cable and sends them at high speed',
 'The circuit that turns the pixel stream into the HDMI or DisplayPort signal.',
 'For HDMI 2.1 it packs pixels into FRL packets sent over four lanes of up to 12 Gbit/s each (48 Gbit/s in all). For DisplayPort it forms packets on 4 lanes at 8.1 Gbit/s (HBR3) or up to 20 Gbit/s (UHBR20), 80 Gbit/s in all. It can apply Display Stream Compression (DSC) to fit high resolutions into the link.',
 'It adds error protection, encodes the bits for the wire (so the receiver can recover the clock), and drives the differential pairs. With DSC, it compresses each frame about 3 to 1 with no visible loss.',
 'A 4K 240 Hz picture would need more bandwidth than any cable offers uncompressed. The encoder’s job is to fit it, so that the cable and screen support each other’s limits.',
 [['HDMI 2.1 FRL','Up to 48 Gbit/s'],['DisplayPort 1.4 (HBR3)','About 32 Gbit/s'],['DisplayPort 2.1 (UHBR20)','80 Gbit/s'],['VESA DSC','About 3:1 visually lossless compression']],
 [['HDMI 2.1','48 Gbit/s'],['DP 1.4','32.4 Gbit/s'],['DP 2.1','80 Gbit/s']],
 'Display Stream Compression works on small groups of lines, with only a line or two of delay, so it does not add noticeable lag.',
 [['disp-scanout','Supplies the pixels'],['disp-ports','The connectors and what they report'],['display-outputs','The outputs as a whole']]);

deep('display-outputs','disp-ports',4,'Connectors, EDID and hot-plug','The sockets, and how the card learns what is plugged in',
 'The connectors, plus the small side channel the card uses to ask the screen what it can show.',
 'A typical card has three DisplayPort and one HDMI connector. Alongside the main data, each cable has a small side channel (DDC on HDMI, AUX on DisplayPort) and a hot-plug wire.',
 'When you plug in a monitor, the hot-plug wire signals the card. The card reads the screen’s EDID (a small table listing its resolutions, refresh rates and colour formats) through the side channel, and picks a mode that both sides support. It can also negotiate protection (HDCP).',
 'This is why a new monitor usually works the moment it is plugged in: it tells the card what it can do, so nobody has to type in settings.',
 [['EDID','A table in the monitor describing its modes'],['HDCP','Copy protection negotiated over the link'],['DDC / AUX channel','The side channels used to read EDID'],['DisplayID','A newer, more flexible format than EDID']],
 [['EDID size','128 bytes plus extensions'],['Side channel','I²C (HDMI) or AUX (DisplayPort)'],['Hot-plug','detected by a voltage on a pin']],
 'The EDID of a monitor is just a 128-byte table, and it is the reason a wrong or damaged EDID can make a screen show only a low-resolution picture.',
 [['display-outputs','The outputs as a whole'],['monitor-ports','The other end of the cable'],['spd-bus','A similar idea: read a small table over a slow bus']]);

/* the two parts here that are themselves drawn as scenes */
N['sm-cores'].scene = 'fma';
N['vram-chip'].scene = 'gddr';
