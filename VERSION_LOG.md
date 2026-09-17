# Version Log: Inside the Computer

This file records every update to the project, with the prompts that asked for it.

Times are in UTC, with Dhaka time (UTC+6) in brackets. Prompt times come from the saved conversation record, where they were recorded to the second. Delivery times come from the finished files.

Add a new section at the top of "Versions" for each future update.

## Summary

| Version | Date (UTC) | Delivered | Main change |
|---|---|---|---|
| 3.0.1 | 2026-09-11 | 02:55 (08:55) | Complete icon set and web manifest, refreshed preview image, clearer Power supply label, full package |
| 3.0.0 | 2026-09-11 | 02:35 (08:35) | Working 8086 emulator, 34 real chips with pinouts and internal views, text labels, 1.5 s tooltips |
| 2.1.0 | 2026-09-10 | 20:34 (02:34 next day) | Larger text, WCAG contrast in both themes, draggable parts, input and output devices |
| 2.0.0 | 2026-09-10 | 15:40 (21:40) | Split into separate files with a build step, bigger ALU, one page per part |
| 1.0.0 | 2026-09-10 | 10:49 (16:49) | First version of the interactive website |

---

## Versions

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
