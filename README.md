# Inside the Computer

An interactive, zoomable guide to how a computer is built: from the case, through the CPU and ALU, down to logic gates and real chips. It includes a working Intel 8086 emulator.

Changes between versions are recorded in `VERSION_LOG.md`.

## Quick start

Open `index.html` in a browser. Everything works from disk, with part links using `#/part-id`.

Put the folder on any static web host (GitHub Pages, Netlify, Cloudflare Pages, Apache, nginx) to get the full version, where every part has its own real URL (`/parts/and-gate.html`).

## Before publishing

1. Put your real domain in `build/site.config.json` (keep the trailing slash).
2. Run `node build/build.mjs` (Node 18 or newer, no packages needed).
3. Upload the whole folder.

The build regenerates `index.html`, all 112 pages in `parts/`, `sitemap.xml`, `robots.txt` and `favicon.svg`.

## Folder structure

```
index.html              generated home page (the whole computer)
parts/<id>.html         generated page for every part
sitemap.xml, robots.txt generated
og-image.png            social-media preview image (1200 × 630)
favicon.svg             site icon (written by the build)
favicon.ico, favicon-16x16.png, favicon-32x32.png
                        icon fallbacks for browsers without SVG favicons
apple-touch-icon.png    iPhone and iPad home-screen icon (180 × 180)
android-chrome-*.png, maskable-512x512.png
                        Android and install icons
site.webmanifest        app name, colours and icons for "Add to home screen"

css/styles.css          all styling: colours, type, layout, diagram styles

js/core.js              shared helpers: def(), level names, gate logic
js/data/hardware.js     text for the computer, hardware and their parts
js/data/devices.js      input and output devices (monitor, keyboard, joystick …)
js/data/cpu.js          text for the parts inside the CPU core
js/data/i8086.js        the Intel 8086 page, its six instruction groups and the
                        instruction reference with an example for each
js/data/alu.js          text for everything inside the ALU
js/data/logic.js        text for logic gates and the D flip-flop
js/data/chips.js        all real chips: pinouts, pin groups, internal structure
js/panel.js             builds the info panel, breadcrumb and metadata
                        (shared by the browser and the build script)

js/scenes/common.js     drawing helpers: gates, switches, wires, LEDs
js/scenes/hardware.js   desk with tower and devices, motherboard, RAM, GPU,
                        storage, PSU, cooling, I/O
js/scenes/cpu.js        CPU die, fetch-decode-execute walkthrough, register
js/scenes/alu.js        working 4-bit ALU, barrel shifter, comparator,
                        and the switch between the two ALU modes
js/scenes/alu86.js      the 8086 ALU mode: a small 8086 with registers, memory and
                        every operand operation
js/scenes/logic.js      gate gallery, single gates, full adder, mux
js/scenes/chips.js      chip pin diagrams and "Inside the chip" views
js/scenes/i8086.js      the 8086 emulator screen (HTML, not SVG)

js/sim/i8086.js         the 8086 emulator itself: assembler and instructions

js/engine.js            navigation, zoom transitions, routing, tooltips

build/template.html     HTML used for every generated page
build/build.mjs         the page generator (also checks chips and contrast)
build/check-chips.mjs   checks every chip definition
build/test-8086.mjs     runs every 8086 example and 48 known-result checks
build/site.config.json  your site URL
```

## Common edits

**Change the text for a part.** Find its `def('part-id', {...})` in `js/data/`, edit it, and run the build.

**Add a new part.** Add a `def()` call with a `parent`. It then appears automatically in the parent's "Inside it" list, the overview, the breadcrumb, the sitemap and its own page.
- To make it clickable in the parent's drawing, add `hot('part-id', [x, y, w, h], ...)` to that scene.
- Without a hotspot, it is still reachable from the panel.
- To give it its own drawing, set `scene: 'name'` and add `SCENES.name` to a file in `js/scenes/`.

**Add a chip.** Add an entry to `CHIPS` in `js/data/chips.js`, then create its page. Use `icDef()` for 74-series logic, which writes the text for you. Use `chipDef()` for anything else, and supply the text yourself. Each entry has:
- `labels`: pin names, starting at pin 1. A name starting with `~` gets an overline (active-low); in `DT/~R` only the `R` does.
- `kinds`: one letter per pin: `i` input, `o` output, `b` two-way, `p` power, `n` other.
- `units`: the groups shown as highlight buttons.
- `power`: the power pins, if they are not the usual last pin and middle pin.
- `pkg`: the package name; add `to220: true` for 3-pin regulators.
- `inside`: `'gates'` draws gate chips automatically. Otherwise give a block diagram: columns of blocks, arrows between them, and pin labels on the left, right or bottom.

Chips with 24 or more pins are drawn upright, like a datasheet. Run `node build/check-chips.mjs` to check your entry.

**Change colours or text sizes.** Edit the variables at the top of `css/styles.css`. There is one block for light mode and one for dark mode. Diagram text sizes are the `.t`, `.t-sm`, `.t-xs` and `.t-lg` rules.

The build checks that every text colour pair reaches a 4.5:1 contrast ratio in both themes. It prints a warning naming any pair that falls short.

**Add a device.** Add a `def()` call in `js/data/devices.js` with `device: 'input'` or `device: 'output'`. It is then listed under "Connected devices" with the right colour tag. To show it on the desk, draw it in `SCENES.pc`:
- wrap the drawing in `DW('id', hot('id', …))` so it can be dragged
- add a label with `LB(x, y, 'Name', {for: 'id', dot: 'in'})`

**Name labels.** Part names in the hardware drawings are plain-text labels made with `LB()`. Add `tone:'inv'` for light text over a dark surface. They go in the final `LAYER()` group, so they always sit on top of the components. A label with `for:` lights up when its part is hovered, opens the part when clicked, and follows it when dragged.

**Tooltip delay.** Tooltips appear after the pointer rests on a part for 1.5 seconds. Change `TIP_DELAY` in `js/engine.js`.

**Site icons.** The icon is the chip logo in `favicon.svg`. The PNG and ICO versions are ready-made copies of it at fixed sizes. If you change the logo, export new PNGs at the same file names and sizes; the build warns if any icon file is missing.

**Change the page layout or metadata tags.** Edit `build/template.html` and rebuild.

The build stops with a clear message if a part refers to a parent, related part or chip that does not exist, or if a chip definition is inconsistent. It warns if a colour pair falls below a 4.5:1 contrast ratio.

After changing the emulator or the 8086 examples, run `node build/test-8086.mjs`.

## Interactive features

- Seven single-gate circuits with live truth tables.
- A full adder where the signal moves through one layer of gates at a time, with a slow-motion toggle.
- A 2-to-1 multiplexer and a 4-bit register with a clock.
- An ALU with two modes, chosen with the switch at the top of the ALU diagram:
  - **Simple 4-bit ALU**: nine operations, parallel units, a result multiplexer and Z/N/C/V flags.
  - **8086 ALU**: a small working 8086. It has:
    - registers AX, BX, CX and DX, and 16 bytes of memory at DS:0000
    - A (destination) and B (source), each a register, a memory address or a number, following the 8086's rules
    - tabs on the left with all 59 operations the 8086 performs on its operands
    - a preview of which registers and memory bytes will change, and **Execute** to write them back
    - flags going in and coming out, with undefined flags marked "?"
    - real 8086 clock cycles, including memory access time

    Results come from the emulator, so the two always agree.
- An 8-bit barrel shifter and a 4-bit magnitude comparator.
- A fetch-decode-execute walkthrough of a small looping program.
- 34 real chips with pin diagrams and an "Inside the chip" view: processors, memory, firmware, timing, bus, ALU, shifter, regulators, audio and serial chips.
- A working Intel 8086 emulator. It covers:
  - every documented instruction, with 8086 flag rules
  - all addressing modes, including segment overrides
  - DB/DW data and labels
  - string operations with REP
  - DOS text output through INT 21h
  - step, run and run-to-end, with changed registers, flags and memory highlighted

  In this model the instruction pointer counts instructions, not bytes.

## Going back

**Back** returns to the part you were looking at before, even if you jumped there from a link in another part's panel. It works like your browser's back button, and the two stay in step. If you opened a part's page directly, so there is nothing to go back to, Back goes up one level instead; its tooltip says which. **Escape** always goes up one level, and the breadcrumb takes you to any level above.

## Hiding the details panel

On wide screens, **Hide details** (right of the breadcrumb) gives the diagram the full width of the window, and **Show details** brings the panel back. The choice is remembered between visits.

Most diagrams are limited by the height of the window, so they grow only a little. The 8086 ALU is drawn wider on purpose: with the panel hidden it is 30–50% larger. It hides the panel automatically, and gives it back when you switch to the simple ALU or leave, unless you pressed the button yourself.

On phones the panel sits below the diagram, so the button is not shown. There, **Zoom diagram** on the 8086 ALU opens at the operations on the left.

## Moving parts around

On the desk (home) view and the motherboard view, every part can be dragged to see what is underneath. A click still opens the part.
- Dragged parts come to the front.
- Their positions are kept while you explore.
- **Reset positions** puts everything back.
- With the keyboard, Tab to a part and press Shift and an arrow key to move it.

## Accessibility and devices

- Every part and control can be reached with the keyboard: Tab to move, Enter or Space to activate, Escape to go up a level (the Back button returns to the previous part).
- On phones:
  - a strip under the diagram lists every part in the current view as large buttons
  - small controls get invisible 44 px touch areas
  - "Zoom diagram" doubles the diagram size, and you can scroll it sideways
- Reduced-motion settings turn off transitions and signal animations.
