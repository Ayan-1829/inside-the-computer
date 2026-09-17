# Version Log: Inside the Computer

This file records every update to the project, with the prompts that asked for it.

Times are in UTC, with Dhaka time (UTC+6) in brackets. Prompt times come from the saved conversation record, where they were recorded to the second. Delivery times come from the finished files.

Add a new section at the top of "Versions" for each future update.

## Summary

| Version | Date (UTC) | Delivered | Main change |
|---|---|---|---|
| 3.2.0 | 2026-09-11 | 07:20 (13:20) | 8086 ALU with CX, DX and memory; Back returns to the previous part; level indicator removed |
| 3.1.0 | 2026-09-11 | 03:26 (09:26) | 8086 mode for the ALU with all 59 operand operations; collapsible details panel |
| 3.0.1 | 2026-09-11 | 02:55 (08:55) | Complete icon set and web manifest, refreshed preview image, clearer Power supply label, full package |
| 3.0.0 | 2026-09-11 | 02:35 (08:35) | Working 8086 emulator, 34 real chips with pinouts and internal views, text labels, 1.5 s tooltips |
| 2.1.0 | 2026-09-10 | 20:34 (02:34 next day) | Larger text, WCAG contrast in both themes, draggable parts, input and output devices |
| 2.0.0 | 2026-09-10 | 15:40 (21:40) | Split into separate files with a build step, bigger ALU, one page per part |
| 1.0.0 | 2026-09-10 | 10:49 (16:49) | First version of the interactive website |

---

## Versions

### 3.2.0: Registers and memory in the 8086 ALU, a real Back button

**Prompt**

- 2026-09-11, after 3.1.0 (the exact time is not in the saved record yet):
  > Along with AX and BX, include CX, DX, and memories for the 8086.
  >
  > Take the label for the current component (dot-indicated navigation) out of the box or remove it (file navigation at the top is enough).
  >
  > Also, the back button should take you to the previous state from which it was derived. Now it takes you to the previous folder. Therefore, any reference from other components is missed.

**Changes**

*8086 ALU: registers and memory*
- The 8086 mode is now a small working machine:
  - four registers, AX, BX, CX and DX, each with its high and low halves (for example AH and AL)
  - 16 bytes of memory at DS:0000–000F
- **A (destination)** can be AX, BX, CX, DX or a memory address. **B (source)** can be any register, a memory address or a number. In 8-bit mode the choices are AL, BL, CL and DL.
- The 8086's rules are followed:
  - no memory-to-memory: it is refused with an explanation, and Execute is disabled
  - no number as the destination
  - shifts count by 1 or by CL
  - MUL and IMUL multiply AL or AX; DIV and IDIV divide AX or the real DX:AX, now that DX exists
- Click any memory byte to choose the address. Words are shown the way the 8086 stores them, low byte first.
- Before anything is written, the registers and memory bytes that will change are outlined, with the new value next to each register. **Execute** writes them back and carries the flags forward, so ADC after ADD uses the real carry. **Random** and **Reset** set up new values.
- Clock cycles now include the 6-cycle address time for a memory operand and the 4-cycle penalty for each word read or written at an odd address. MOV between AX and memory uses the 8086's shorter 10-cycle form.
- Checked:
  - 20 results worked out by hand, covering memory operands, write-back, DX:AX division, shifts by CL, cycles and the operand rules
  - all 590 combinations of operation, width and operand choice, checked for overlapping text

*Level indicator removed*
- The dotted "Level N" indicator at the top-left of every diagram is gone; the breadcrumb above the diagram shows where you are. The panel still names the level.

*Back button*
- **Back** now returns to the part you were looking at before, even when you arrived through a link in another part's panel. It stays in step with the browser's own back and forward buttons, and works the same when the site is opened from files.
- If there is nothing to go back to (a part page opened directly), Back goes up one level. Its tooltip says where it will go.
- **Escape** still goes up one level.

---

### 3.1.0: 8086 ALU mode and a collapsible details panel

**Prompt**

- 2026-09-11, shortly after 3.0.1 (the exact time is not in the saved record yet):
  > It's great that you built. But observe the simple ALU system. You have given (there are two inputs, A and  B, and some arithmetic and logic operations); I want to implement the 8086 like that. You can create two options for that. One for simple CPU operations (at present) and another one for 8086 (in the left operation tabs, include all the operations that the 8086 can perform). To make the canvas bigger (better visibility, you can collapse the description tab.

**Changes**

*Two ALU modes*
- A switch at the top of the ALU diagram chooses **Simple 4-bit ALU** (unchanged) or **8086 ALU**.
- In 8086 mode, eight tabs on the left hold all 59 operations the 8086 performs on its operands:
  - arithmetic: ADD, ADC, SUB, SBB, CMP, INC, DEC, NEG
  - multiply and divide: MUL, IMUL, DIV, IDIV
  - logic: AND, OR, XOR, NOT, TEST
  - shift and rotate: SHL/SAL, SHR, SAR, ROL, ROR, RCL, RCR
  - decimal adjust: DAA, DAS, AAA, AAS, AAM, AAD
  - move and convert: MOV, XCHG, CBW, CWD
  - flags: CLC, STC, CMC, CLD, STD, CLI, STI, LAHF, SAHF
  - all 16 jump conditions, tested after CMP A, B
- The string, stack, input/output and program-flow instructions need memory or a running program, so they stay in the 8086 emulator.
- A and B can be 8-bit (AL, BL) or 16-bit (AX, BX). Click bits or use Random. Instructions that always use one size (DAA, AAA, CBW …) lock the width and say so.
- You can set the nine flags going in. This matters for ADC, SBB, RCL, RCR, CMC, DAA and the others that read flags.
- Flags coming out: changed flags are outlined, and flags the 8086 manual lists as undefined are shown as "?".
- The result row shows whether the result is stored. For CMP and TEST it is not; for jumps it shows whether the jump is taken. A second row shows the high half (MUL), the remainder (DIV), B after XCHG, or DX after CWD.
- Eight units light up along the data path: adder, logic, shifter, multiply/divide, decimal adjust, move/extend, condition test and flag logic.
- Real 8086 clock cycles are shown, for example 3 for ADD, 118–133 for a 16-bit MUL, and 8 + 4 per bit for shifts by CL.
- A plain-English explanation is shown for each result, including divide errors, shift counts of 0 and signed versus unsigned jumps.
- Results come from the tested emulator, so the ALU view and the emulator always agree. 28 results were also checked by hand against documented 8086 behaviour, and all 118 operation and width combinations were checked for layout.

*Collapsible details panel*
- A new **Hide details** / **Show details** button to the right of the breadcrumb gives the diagram the full window width. The choice is remembered.
- The 8086 ALU view is drawn wider (1300 units), so it is 30–50% larger with the panel hidden. It hides the panel automatically, and restores it when you switch back or leave, unless you chose yourself.
- On phones the button is hidden (the panel sits below). Zoom diagram on the 8086 ALU opens at the operations.

---

### 3.0.1: Complete file set with site icons

**Prompt**

- 2026-09-11 about 02:46 (08:46):
  > check the v2 again and apply all the changes to v3 and give me all the files. The presenet v3 is missing some. Like(favicon, etc)

**Checks**
- Every file from version 2.1.0, which already contained everything from 2.0.0, is present in version 3. No earlier change was lost.
- The real gaps were icon files that browsers and phones look for besides `favicon.svg`, and a social preview image that still showed the old bordered labels.

**Changes**
- Added a full icon set in the project root, all drawn from the chip logo:
  - `favicon.ico` (16, 32 and 48 px), `favicon-16x16.png` and `favicon-32x32.png`
  - `apple-touch-icon.png` (180 px)
  - `android-chrome-192x192.png`, `android-chrome-512x512.png` and `maskable-512x512.png`
- The 16 px icon is drawn pixel by pixel so the chip stays sharp; the ICO uses the same drawing.
- Added `site.webmanifest`, with the app name, colours and icons for "Add to home screen".
- Every page now links all icons and the manifest. Links were checked on the home page and on nested part pages.
- The build warns if an icon file goes missing.
- `og-image.png`, the social-media preview, was regenerated from the current home page.
- On the home view, the power supply's fan is smaller and further left, so the "Power supply" name no longer sits on top of it. It was checked at desktop, laptop and phone sizes.
- The README lists the icon files and explains how to replace them.
- Delivered as one complete package with every file.

---

### 3.0.0: 8086 emulator, chip library, label and tooltip changes

**Prompts**

- 2026-09-10 about 20:57 (02:57, 11 Sep):
  > The component's name with a border doesn't look good. Just keep same as before, text only. Hovering over the components should highlight the text along with the components
  >
  > Try to implement all the operations an 8086 processor does. Try to show all available chips for the components on the market with a pin diagram.
  >
  > The chip's internal structure is not shown. Along with the pin diagram, you can show the internal structure of known chips.
  >
  > The hovering texts should appear after 1.5 seconds.
  >
  > Give me only the modified files.
  >
  > Create a Version Log. It will track the updates along with the prompts I have given, with timestamps. Create any md/text file for that.
- 2026-09-11 about 02:32 (08:32):
  > Continue

These two prompt times are approximate, taken from the working session, because they are not in the saved record yet.

**Changes**

*Labels and tooltips*
- Part names are plain text again, with no border or background. They use light text over dark surfaces and still sit on top of the components.
- Hovering a part turns its name green, underlines it and enlarges it slightly. Names inside interactive parts light up too.
- Input and output devices keep a small coloured dot, which matches the legend.
- Tooltips now appear after the pointer rests on a part for 1.5 seconds. The highlight itself is still instant.

*Intel 8086*
- New "Intel 8086" part under the CPU, opened from a card in the CPU drawing.
- A working emulator covers every documented 8086 instruction:
  - data transfer (14)
  - arithmetic (20, including multiply, divide and BCD adjust)
  - logic, shifts and rotates (12)
  - string operations with REP, REPE and REPNE
  - control transfer: all 32 conditional jump names, loops, CALL and RET, INT, INTO and IRET
  - processor control (12)
- It uses the 8086's own flag rules and quirks. For example:
  - PUSH SP stores the new value.
  - PUSHF sets bits 12–15.
  - IDIV rejects a quotient of −128.
  - Shifts count only with 1 or CL.
- A small assembler supports:
  - labels
  - DB, DW and DUP data
  - every 8086 addressing mode
  - BYTE PTR and WORD PTR
  - segment overrides and OFFSET
- Errors are explained in plain words, for example "the 8086 can only use BX, BP, SI and DI inside [ ]".
- The screen shows:
  - the program listing and editor
  - all registers, with high and low bytes
  - the nine flags
  - memory from DS:0000
  - the stack
  - an output console for DOS text output (INT 21h)
- Step, Run and Run to end are available. Changed registers, flags and memory bytes are highlighted.
- Six new pages, one per instruction group. Each lists every instruction with a runnable example.
- Simplification: the instruction pointer counts instructions, not bytes. This is stated on screen.

*Chips*
- The library grew from 10 to 34 real chips, each with its own page. The 24 new ones are:
  - processors: 8086, 8088, Z80, 6502
  - memory and firmware: 6116 and 62256 SRAM, 4164 DRAM, 27C256 EPROM, W25Q128 SPI flash, 24C02 EEPROM
  - timing and power: NE555 timer, 7805 and LM317 regulators
  - audio and serial: LM386 amplifier, MAX232 transceiver
  - logic: 74LS138, 74LS161, 74LS181, 74LS194, 74LS151, 74LS245, 74LS373, 74LS273 and 74LS266. The XNOR gate now links to its real chip.
- Every chip has a "Pin diagram" and an "Inside the chip" view.
  - Gate chips show each gate wired to its actual pins.
  - The others show a block diagram, such as the 8086's bus interface and execution units, or the 555's divider, comparators and flip-flop.
- Pin diagrams:
  - 24 to 40 pins are drawn upright, like a datasheet.
  - Regulators are drawn in their TO-220 package.
  - Pins are coloured as input, output, two-way, power or other.
  - Partial overlines (for example DT/R) are drawn correctly.
- A part's panel now lists all of its real chips, not just the first.
- Chip pages note that pinouts follow the classic datasheets and should be checked before wiring.

*Quality checks*
- `build/check-chips.mjs` checks pin counts, pin types, group pin numbers and that every chip has a page. The build runs it automatically.
- `build/test-8086.mjs` runs every example program, 48 known-result checks and 7 error checks. All 143 pass.
- The contrast check now also covers pin colours, highlight colours and button text.

**Files:** 38 added (including 31 new pages), 95 modified (including 81 regenerated pages), none removed. The full list is in `CHANGED_FILES.md` in the delivery.

---

### 2.1.0: Visibility, contrast, dragging and devices

**Prompts**

- 2026-09-10 16:20:41 (22:20:41):
  > Enlarge some text on the images. Increase the z-index so that it appears on top of the components.
  >
  > Increase some other font sizes for better visibility.
  >
  > The colour contrast for different components and names is not maintained properly for both light and dark mode.
  >
  > Remove the tagline under the Project name at the top-left.
  >
  > On the motherboard at entry, use the drag options to move components for better visibility.
  >
  > Add some input/output devices to the CPU. Like a mouse and monitor, joystick, etc.
- Later the same day (time not in the saved record):
  > continue

**Changes**
- Part names moved into a top layer so they are never hidden by components. They were given pill backgrounds, which version 3.0.0 later removed.
- Interface text was enlarged by 1 px and diagram text by about 10%.
- Every colour pair was measured and the colours were redesigned for both themes:
  - all text reaches at least 4.5:1 (WCAG AA)
  - component edges reach at least 3:1
  - the build now warns about any text pair below 4.5:1
- The tagline under the project name was removed.
- Parts on the home view and the motherboard can be dragged:
  - with a mouse, by touch, or with Shift and the arrow keys
  - the dragged part comes to the front
  - positions are remembered, and a "Reset positions" button restores them
- The home view became a desk scene with 8 input and output devices: monitor, webcam, speakers, keyboard, mouse, joystick, game controller and printer. Each has its own page, and the Computer panel gained a "Connected devices" section.
- The site grew to 82 pages.

---

### 2.0.0: Separate files, larger text, a fuller ALU

**Prompts**

- 2026-09-10 11:01:05 (17:01:05):
  > That looks good. Now implement all the improvement suggestions.
  >
  > Create separate files for easier navigation and modification. Try to enlarge some text.
  >
  > Add more components that a real ALU has.
- 2026-09-10 15:30:11 (21:30:11):
  > Continue

**Changes**
- The single file was split into a project: separate CSS, a data file per level, a scene file per level, the engine, the panel builder, and a build script with no dependencies.
- The build generates a static page for every part, each with its own title, description, canonical URL, Open Graph tags and structured data. It also generates the sitemap and robots.txt.
- Text was enlarged by about 10–15%.
- The ALU gained a shifter, comparator, carry look-ahead, multiplier, operation decoder, flag logic and operand registers.
- A slow-motion signal-flow animation was added to the full adder, and a step-by-step fetch-decode-execute walkthrough to the control unit.

---

### 1.0.0: First version

**Prompts**

- 2026-09-10 05:31:57 (11:31:57), with the detailed specification attached:
  > Follow the instructions to build an interactive website. Use metadata for better SEO
- 2026-09-10 06:04:40 (12:04:40):
  > Continue
- 2026-09-10 10:30:40 (16:30:40):
  > Continue and try to make the initial first, later you can improve

**Changes**
- An interactive website that drills down through five levels: Computer, Hardware, Component architecture, Digital logic and Physical logic chips.
- A clickable desktop-PC illustration with hover highlights and tooltips, and smooth zooming between levels.
- A two-panel layout with a breadcrumb, a level indicator, Back, Home and Overview.
- Light and dark themes.
- Info panels with the same structure for every part, with real-life examples at every level.
- The CPU internals, the ALU, and seven logic gates with truth tables.
- The real 74-series chips 7408, 7432, 7404, 7400, 7402 and 7486, with a note that modern CPUs do not contain them.
- SEO metadata, a responsive mobile layout and keyboard access.
