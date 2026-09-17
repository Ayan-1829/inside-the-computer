# Inside the Computer

An interactive, zoomable guide to how a computer is built: from the case, through the CPU and ALU, down to logic gates and real 74-series chips.

## Quick start

Open `index.html` in a browser. Everything works from disk, with part links using `#/part-id`.

Put the folder on any static web host (GitHub Pages, Netlify, Cloudflare Pages, Apache, nginx) to get the full version, where every part has its own real URL (`/parts/and-gate.html`).

## Before publishing

1. Put your real domain in `build/site.config.json` (keep the trailing slash).
2. Run `node build/build.mjs` (Node 18 or newer, no packages needed).
3. Upload the whole folder.

The build regenerates `index.html`, all 73 pages in `parts/`, `sitemap.xml`, `robots.txt` and `favicon.svg`.

## Folder structure

```
index.html              generated home page (the whole computer)
parts/<id>.html         generated page for every part
sitemap.xml, robots.txt generated
og-image.png            social-media preview image (1200 × 630)

css/styles.css          all styling: colours, type, layout, diagram styles

js/core.js              shared helpers: def(), level names, gate logic
js/data/hardware.js     text for the computer, hardware and their parts
js/data/cpu.js          text for the parts inside the CPU core
js/data/alu.js          text for everything inside the ALU
js/data/logic.js        text for logic gates and the D flip-flop
js/data/chips.js        74-series chips and their pinouts
js/panel.js             builds the info panel, breadcrumb and metadata
                        (shared by the browser and the build script)

js/scenes/common.js     drawing helpers: gates, switches, wires, LEDs
js/scenes/hardware.js   PC, motherboard, RAM, GPU, storage, PSU, cooling, I/O
js/scenes/cpu.js        CPU die, fetch-decode-execute walkthrough, register
js/scenes/alu.js        working 4-bit ALU, barrel shifter, comparator
js/scenes/logic.js      gate gallery, single gates, full adder, mux, IC pinouts

js/engine.js            navigation, zoom transitions, routing, tooltips

build/template.html     HTML used for every generated page
build/build.mjs         the page generator
build/site.config.json  your site URL
```

## Common edits

**Change the text for a part.** Find its `def('part-id', {...})` in `js/data/`, edit it, and run the build.

**Add a new part.** Add a `def()` call with a `parent`. It then appears automatically in the parent's "Inside it" list, the overview, the breadcrumb, the sitemap and its own page.
- To make it clickable in the parent's drawing, add `hot('part-id', [x, y, w, h], ...)` to that scene.
- Without a hotspot, it is still reachable from the panel.
- To give it its own drawing, set `scene: 'name'` and add `SCENES.name` to a file in `js/scenes/`.

**Add a chip.** Add its pinout to `CHIPS` in `js/data/chips.js` and call `icDef()`. Pin labels are listed from pin 1; `kinds` marks each pin as `i` input, `o` output or `p` power. A label starting with `~` is drawn with an overline (active-low).

**Change colours or text sizes.** Edit the variables at the top of `css/styles.css`. Diagram text sizes are the `.t`, `.t-sm`, `.t-xs` and `.t-lg` rules.

**Change the page layout or metadata tags.** Edit `build/template.html` and rebuild.

The build stops with a clear message if a part refers to a parent, related part or chip that does not exist.

## Interactive features

- Seven single-gate circuits with live truth tables.
- A full adder where the signal moves through one layer of gates at a time, with a slow-motion toggle.
- A 2-to-1 multiplexer and a 4-bit register with a clock.
- A working 4-bit ALU with nine operations, parallel units, a result multiplexer and Z/N/C/V flags.
- An 8-bit barrel shifter and a 4-bit magnitude comparator.
- A fetch-decode-execute walkthrough of a small looping program.
- Pinouts for ten 74LS chips.

## Accessibility and devices

- Every part and control can be reached with the keyboard: Tab to move, Enter or Space to activate, Escape to go up a level.
- On phones:
  - a strip under the diagram lists every part in the current view as large buttons
  - small controls get invisible 44 px touch areas
  - "Zoom diagram" doubles the diagram size, and you can scroll it sideways
- Reduced-motion settings turn off transitions and signal animations.
