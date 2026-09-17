# Version Log: Inside the Computer

This file records every update to the project, with the prompts that asked for it.

Times are in UTC, with Dhaka time (UTC+6) in brackets. Prompt times come from the saved conversation record, where they were recorded to the second. Delivery times come from the finished files.

Add a new section at the top of "Versions" for each future update.

## Summary

| Version | Date (UTC) | Delivered | Main change |
|---|---|---|---|
| 4.15.0 | 2026-09-18 | — | Motherboard gets real extra components (24-pin, SATA, CMOS battery, fan header, rear I/O); tower reordered (RAM before CPU, cooling beside it); PSU cables routed to specific parts; more decorative traces |
| 4.14.0 | 2026-09-18 | — | Bug sweep: "Inside" button no longer shown where there's nothing to see inside; Escape no longer double-fires; the dashed device cables and the captured photo now paint in the right order; storage sub-parts no longer mislabelled "Digital logic" |
| 4.13.0 | 2026-09-18 | — | Webcam and mic became interactive: right-click "Try it" opens a live camera/mic test, then an animated dot carries the result device → I/O → RAM → CPU → RAM → I/O → screen or speakers, with the current stage highlighted the whole way, computed from the diagram's real geometry so it still works if a part has been dragged |
| 4.12.0 | 2026-09-18 | — | Single click again opens a part (as it did before this session's experiments); right-click keeps the concise-card-with-buttons behaviour; with the details panel hidden, a single click opens that same card instead of navigating |
| 4.11.0 | 2026-09-18 | — | SSD and hard drive gained a real internal layer (controller, NAND, DRAM cache, connector; platter, head, arm, spindle, controller board), each with its own diagram and full write-up |
| 4.10.0 | 2026-09-18 | — | Visual polish: the always-on card shadows on the stage and the details panel removed (shadows now only appear on an actual highlighted part); the purple wire colour replaced; the site logo simplified to a fixed black/green mark in both themes |
| 4.9.0 | 2026-09-17 | — | Site icons (favicon set, apple-touch, android-chrome, maskable) redrawn for the new "AS" logo |
| 4.8.0 | 2026-09-17 | — | The copyright, name and portfolio link in the page footer are highlighted |
| 4.7.0 | 2026-09-17 | — | A copyright-style developer credit added to the foot of every page |
| 4.6.0 | 2026-09-17 | — | Hovering shows a short summary, right-click shows full details; the developer credit gained a title and affiliation |
| 4.5.0 | 2026-09-17 | — | Part details on hover (1.5 s) or right-click, working in full screen; the "Simplified educational model" badge no longer overlaps the full-screen button |
| 4.4.0 | 2026-09-17 | — | The logo's centre dot became "AS", with the chip die enlarged to fit it |
| 4.3.0 | 2026-09-17 | — | A full-screen mode, and a developer credit with a portfolio link |
| 4.2.0 | 2026-09-17 | — | Real gate-level internal views for the 74151 and 74157; popup z-index, wire-tracking and left-column layout fixes |
| 4.1.0 | 2026-09-17 | — | The multiplexer redrawn as a real trapezoid symbol (4-to-1 and, for the 8086 ALU, 8-to-1); the favicon caching problem fixed |
| 4.0.0 | 2026-09-17 | — | v4: both ALU modes restored (4-bit and 8086), the "extra box" hover bug fixed, and an engine-wide bug where one click highlighted every box sharing a part's id |
| 3.5.1 | 2026-09-16 | — | Larger text on the 8086 page; theme back to green, with a colour of its own for each level and for each part of the 8086 |
| 3.5.0 | 2026-09-15 | — | 8086 page redrawn from the reference block diagram, with example selection and the whole flow on the left; vibrant violet-and-tangerine theme |
| 3.4.0 | 2026-09-12 | 02:19 (08:19) | 8086 architecture moved to the 8086 page and runs real programs with an animated data flow; ALU back to 4-bit |
| 3.3.0 | 2026-09-11 | 08:55 (14:55) | 8086 shown as BIU/EU architecture with animated flow; lighter corner labels; shifter 0 inputs; gradients; no overlapping text |
| 3.2.0 | 2026-09-11 | 07:20 (13:20) | 8086 ALU with CX, DX and memory; Back returns to the previous part; level indicator removed |
| 3.1.0 | 2026-09-11 | 03:26 (09:26) | 8086 mode for the ALU with all 59 operand operations; collapsible details panel |
| 3.0.1 | 2026-09-11 | 02:55 (08:55) | Complete icon set and web manifest, refreshed preview image, clearer Power supply label, full package |
| 3.0.0 | 2026-09-11 | 02:35 (08:35) | Working 8086 emulator, 34 real chips with pinouts and internal views, text labels, 1.5 s tooltips |
| 2.1.0 | 2026-09-10 | 20:34 (02:34 next day) | Larger text, WCAG contrast in both themes, draggable parts, input and output devices |
| 2.0.0 | 2026-09-10 | 15:40 (21:40) | Split into separate files with a build step, bigger ALU, one page per part |
| 1.0.0 | 2026-09-10 | 10:49 (16:49) | First version of the interactive website |

---

## Versions

> **A gap in this log.** Everything from 4.10.0 to 4.15.0 below happened across several prompts on 2026-09-18 that were not written up at the time — they are recorded here after the fact, grouped by topic rather than prompt-by-prompt, once the gap was noticed and pointed out. From 5.0.0 onward this file is kept current with every change again.

### 4.15.0: Motherboard gets real parts, and the tower is reordered

**Prompts** (2026-09-18, exact times not in the saved record):
> Can you take the RAM to the left of the CPU. then it will be easier for showing the flow. Also change the structure inside motherboard.html. it will be more appropriate as the fan also remain close to the CPU.
>
> Re-write the power supply cabbles, take power supply to the specific components. Like motherboard need, GPU needs, Storage needs.
>
> Take the PCIe Slots a bit lower in the motherboard.html so that is should not overlap with the RAM Slots text
>
> change the bluish purple color of the wires, take the ram a bit right and also the cpu on the mother board on the home page motherboard. in the motherboard.html, add details for the ports. Add more connecting lines on the motherboard to look it more cool (technological)

**Changes**
- On the whole-computer page, RAM now sits between the I/O port and the CPU (previously to its right), with the cooling fan moved beside the CPU and then out to fill the case's own empty right-hand gap.
- `motherboard.html` reordered to match (RAM between VRM and the CPU socket), and gained four components that were previously either missing or just decoration: the **24-pin ATX connector**, the **SATA ports**, a new **CMOS battery** (split out from what used to be a combined "BIOS/UEFI" label), and a new **fan header** — each now a real, described part. The **Rear I/O panel** was also turned from decoration into a described part.
- The power supply's cables were redrawn as three separate wires, each ending at the part that actually needs it (motherboard, GPU, storage) instead of two generic curves; the motherboard's own cable was rerouted twice more after review, first to avoid crossing over RAM/CPU/cooling, then to land at the board's bottom-right corner instead of cutting across the middle.
- PCIe slots moved down slightly so its label stops touching "RAM slots".
- The wire colour changed from a bluish purple to a dark charcoal-green.
- More decorative copper traces and via-dots added across `motherboard.html`'s open background areas for a busier, more "technological" PCB look.

---

### 4.14.0: A bug sweep across everything built so far

**Prompt** (2026-09-18, exact time not in the saved record):
> Clicking the ic-chip in hide details mode, doesn't show the inside button. Fix this. Also the inside pin diagram has tangled connection lines. Make them simple, un-overlapped. […] Again some components like (bus, clock) doesn't have anything inside but it shows the button. Re-check every componets that has the clicable inside button and remove the inside button if the components doesn't have.

**Changes**
- The "Inside" button (right-click card) was gated on whether a part had tree children, which is the wrong test — a part like Clock or Bus interface has a real chip as a "child" but no diagram of its own, so the button did nothing. It's now gated on `n.scene` (does this part have its own diagram at all), which correctly covers every real IC chip too.
- Found and fixed while testing that: pressing Escape to close a pinned details card was *also* silently navigating up a level, because a second, older Escape handler didn't know about the new pinned-card state.
- The 74151's gate-level "inside the chip" view had its select-line trunks decluttered: they're spaced further apart, and each one now only runs as high as the topmost row that actually taps it, instead of every trunk spanning the full height regardless of use.
- Storage sub-parts (Actuator arm, Platter, NAND flash, etc.) were labelled "Level 4: Digital logic", which is accurate for a logic gate but not for a mechanical or electronic part. They now carry their own level name, "Internal components".

---

### 4.13.0: Webcam and mic become interactive

**Prompts** (2026-09-18, exact times not in the saved record):
> For more interactivity, one can use the webcam and the mic. right clicking the webcam should add a new button test that will ask the brower to allow camera permission and if given it should pop-up a window that can capture a photo […] Then the pop up tab should be closed and a flow from the webcam to cpu/gpu should be shown slowly, then from the gpu to the monitor. […] the photo should not be saved anywhere. Maintain enough security for the camera and mic permissions. do the same for mic for audio recording.
>
> Camera should mirror the image. The image should be open in a tab like structure inside the monitor. For mic remove the play back button […] While moving the dots for the flow, take the dot exactly on the cpu/gpu and send back to the output. follow the path from input devices (webcam/mic) to i/o ports, i/o ports to cpu/gpu, cpu/gpu to i/o ports, i/o ports to output devices […] The focus should be shifted to specific components.
>
> The dot is not positioned to CPU properly. […] If any components are moved, then prefix the positions automatically before sending data from input to output. […] Remove the photo ayan.png as it is not rendered properly.
>
> the flow doesn't go from i/o to cpu directly right? it should go to the ram first, then cpu, then ram to i/o.

**Changes**
- Right-clicking the webcam or mic now offers a **Try the camera** / **Try the microphone** button, which requests permission, shows a live preview, and lets you capture a photo or record a short clip — every track is stopped the instant capture finishes, and nothing captured is ever written to storage, uploaded, or kept past the few seconds it takes to show it.
- The result travels as a glowing dot along the real path — device → I/O port → RAM → CPU → RAM → I/O port → the screen or speakers — pausing briefly at the CPU, with the part it is currently at lit up (not the destination the whole time, which was the first version's bug).
- The photo is mirrored (matching the live preview) and opens as a third browser-style tab inside the monitor, matching the two already there, then closes on its own after a few seconds.
- Every waypoint's position is now read live from the diagram's actual geometry (`getBBox` + a corrected relative transform matrix) rather than hand-picked coordinates, so the flow still lands exactly on a part even after it's been dragged elsewhere — this also fixed the dot not landing exactly on the CPU.
- The developer's own photo turned out not to render reliably, so the avatar tab reverted to the simpler "AS" initials badge, and the unused image file was removed.

---

### 4.12.0: Single click opens a part again

**Prompts** (2026-09-18, exact times not in the saved record):
> You miss understand the single click details. When single click is done, open the right sidebar details.
>
> When the right side pannel is hidden, only then single clicking on any components should open the details.

**Changes**
- Earlier the same day, single click had been changed to only *select* a part (ring + dim, no navigation), based on a misreading of an earlier request. That's reverted: a single click opens a part exactly as it always has, updating the right-hand details panel.
- Right-click keeps the concise-card-with-action-buttons behaviour from 4.6.0, for glancing at a part without leaving the current diagram.
- New: with the details panel hidden (nowhere for a normal click to show anything), a single click now opens that same right-click card instead of navigating, since a full navigation would have nothing to update.

---

### 4.11.0: SSD and hard drive get a real internal layer

**Prompt** (2026-09-18, exact time not in the saved record):
> Explain the enternal structure of SSD, Harddisk with another layer. Describe every components.

**Changes**
- The SSD gained its own diagram and four new described parts: the **M.2 connector**, the **SSD controller**, the **DRAM cache**, and **NAND flash memory**.
- The hard drive gained its own diagram and five new described parts: the **platter**, the **read/write head**, the **actuator arm**, the **spindle motor**, and the **controller board**.
- Both drives previously only appeared as a single highlighted box inside the storage overview; each now has its own dedicated, clickable diagram with all of the above as real hot regions.

---

### 4.10.0: Shadows, wire colour and the logo, cleaned up

**Prompt** (2026-09-18, exact time not in the saved record):
> you have added some shades on the cards (whole desktop setup, details at bottom right). It looks unprofessional. Remove all thes type of shades. You can only use shadows under the components while highlighted.

**Changes**
- The always-on `box-shadow` on the stage (the whole diagram area) and on the details panel was removed. Shadows now only ever appear as part of an interactive, highlighted state (like a part glowing on hover), never as a static resting effect on a big container.

---

### 4.9.0: Site icons redrawn for the new logo

**Prompt**

- 2026-09-17 (the exact time is not in the saved record yet):
  > Change the logos for android chrome, apple touch etc.

**Changes**

`favicon-16x16.png`, `favicon-32x32.png`, `android-chrome-192x192.png` and
`android-chrome-512x512.png` were still the old orange-dot chip logo, left
over from before the "AS" redesign in 4.4.0 — only `favicon.svg` had been
updated. All of the icon files were regenerated from the current logo:

- the four files above, direct renders of the rounded chip logo;
- `apple-touch-icon.png` (180 px), a full-bleed square with no rounded
  corners (iOS applies its own mask), matching the file it replaced;
- `maskable-512x512.png`, full-bleed background with the chip icon scaled to
  62% and centred, so it survives Android's circular or squircle mask;
- `favicon.ico`, rebuilt as a proper multi-resolution icon (16, 32 and 48 px)
  packed from the new PNGs.

The build's SHA1 cache-busting hash (added in 4.1.0) picked up the new file
bytes automatically on the next `node build/build.mjs`, so browsers fetch
the new icons instead of a cached copy of the old ones.

---

### 4.8.0: Footer emphasis

**Prompt**

- 2026-09-17 (the exact time is not in the saved record yet):
  > highlight copyright, name and portfolio link

**Changes**

In the page footer added in 4.7.0, the copyright mark and year, the name
"Ayan Sarkar", and the portfolio link are now bold and stand out from the
muted job title and affiliation text around them; the link additionally uses
the section accent colour. Checked in both light and dark themes.

---

### 4.7.0: A copyright footer on every page

**Prompt**

- 2026-09-17 (the exact time is not in the saved record yet):
  > add a copyright style developer info at the foot of the webpage.

**Changes**

The developer credit until now only appeared inside the Overview dialog. A
slim footer bar was added to the bottom of every page: "© {year} Ayan
Sarkar, Lecturer, CSE, Green University of Bangladesh · [portfolio link]".
The app's layout (`.app`) is a fixed-height grid filling the viewport, so
the footer was added as a fourth grid row (`auto`) rather than an overlay,
which shrinks the diagram/panel area by the footer's height instead of
covering anything. The year is written in at build time
(`new Date().getFullYear()` in `build/build.mjs`, a new `{{YEAR}}`
placeholder). Checked at desktop and phone widths, where the line wraps
without breaking the layout.

---

### 4.6.0: Precise details on hover, full details on right-click

**Prompt**

- 2026-09-17 (the exact time is not in the saved record yet):
  > take the left tabs a bit right for a compact view (not very much)
  >
  > For hovering, add precise details. For right button click show full details.
  >
  > Where is the developers information?
  > Ayan Sarkar, Lecturer, CSE, Green Univerisity of Bangladesh. Portfolio - ayan-1829.github.io/portfolio

**Changes**

- The details popover introduced in 4.5.0 showed the same full content for
  both triggers. It now gives two levels: **hovering** for 1.5 seconds shows
  a short card (the part's name and what it does, with a "Right-click for
  full details" hint) that closes as soon as the pointer leaves; **right-click**
  pins open the full card (what it is, what it does and why it matters) until
  it is closed, clicked outside, or dismissed with Escape.
- The "Simplified educational model" badge, which still crowded the
  full-screen button after 4.5.0's fix, was moved to sit to its left on the
  same row instead of below it.
- The developer credit line, added in 4.5.0 as "Built by Ayan Sarkar", now
  reads "Ayan Sarkar, Lecturer, CSE, Green University of Bangladesh" with the
  portfolio link, in the Overview dialog's footer.

---

### 4.5.0: Details in full screen, and the badge/button overlap

**Prompt**

- 2026-09-17 (the exact time is not in the saved record yet):
  > the simplified educational model is overlapped with the full screen button. fix this.
  >
  > Also, add option on right click/hovering after 1.5 seconds to see the details of each components. There is no option for seeing details in full screen mode.

**Changes**

- The full-screen button added in 4.3.0 sat under the "Simplified educational
  model" badge in the same corner of the stage; the badge was moved down out
  of the way.
- Until now, the only way to read a part's full description (what it is,
  what it does, why it matters) was the side panel, which is not part of the
  full-screen element and so disappears in full-screen mode. The 1.5-second
  hover tooltip was rebuilt into a details card carrying that same text, and
  a right-click on any part opens it immediately and pins it open — useful
  exactly where the side panel is unavailable, since the card lives inside
  `#stage` and is included when the stage goes full screen. Closes on
  Escape, on its own close button, or by clicking outside it.

---

### 4.4.0: A lettered logo

**Prompt**

- 2026-09-17 (the exact time is not in the saved record yet):
  > now for the logo, instead of the dot at middle, write AS. Enlarge the chip shape to adjust the latters properly.

**Changes**

The chip-shaped logo's centre LED dot became the initials "AS", in the same
gold. The chip's die was enlarged (28×28 units to 36×36, in the 64×64 logo)
and its pins shortened to match, giving the letters room without crowding
the pins. Applied to the topbar logo (`build/template.html`) and the
generated `favicon.svg` (`build/build.mjs`) alike.

---

### 4.3.0: Full screen, and a developer credit

**Prompt**

- 2026-09-17 (the exact time is not in the saved record yet):
  > add a full screen mode like youtube playing video. Add developers information with personal website https://ayan-1829.github.io/portfolio

**Changes**

- A full-screen button was added to the stage, using the Fullscreen API
  (with the Safari-prefixed fallback). It swaps between an expand and a
  compress icon, and the stage fills the viewport with its border and
  corner rounding removed while active.
- A developer credit — "Built by Ayan Sarkar" with a link to
  `ayan-1829.github.io/portfolio` — was added as a footer inside the
  Overview dialog.

---

### 4.2.0: Real chip internals for the 74151 and 74157, and small 8086 fixes

**Prompt**

- 2026-09-17 (the exact time is not in the saved record yet), with a
  gate-level 74LS151 datasheet schematic attached:
  > there a vertical line when the example is loaded in i8086. Keep the z-index high for the pop-up window of example loading.
  >
  > in between address adder and segment register, there is a line. But when data (dot) is moving it is not following this line. Follow this line when data is passed.
  >
  > take the left tabs a bit right for a compact view (not very much)
  >
  > Try to give the given internal chip structure for all the chip with pin diagram.
- Answered by choosing **"Just 74151 and 74157 (Recommended)"** when asked
  which chips to scope the internal-structure work to.

**Changes**

- **Real internal schematics** for the 74151 (8-to-1 multiplexer) and 74157
  (quad 2-to-1 multiplexer), built gate by gate (AND/OR/NOT) from their
  actual logic rather than a block diagram, matching the reference
  datasheet's pin numbering (`js/scenes/chips.js`, `js/data/chips.js`).
- The example-loading popup in the 8086 page could show a stray vertical
  line, because SVG has no z-index — stacking follows document order, and
  the travelling dot's wire was defined after the popup in the markup. The
  popup group is now re-appended to the end of its parent every time it
  opens, so it always paints on top.
- The wire between the address adder and a segment register didn't line up
  with the dot animation; the animation's path was moved from x 592 to
  x 606 to match the wire actually drawn.
- The left-hand controls (example picker, flow list, buttons) were shifted
  14 px to the right for a slightly more compact look.

---

### 4.1.0: The multiplexer as a real 4-to-1 (and 8-to-1) symbol; favicon caching fixed

**Prompt**

- 2026-09-17 (the exact time is not in the saved record yet), with a
  reference image of an IEC-style trapezoid multiplexer symbol attached:
  > The favicon is not working propoerly. Re-check the meta-data and do better for SEO portions in the code.
  >
  > Use the given example multiplexer structure for the project. If there is any multiplexer used, then show it like the reference in the details part. Now at ALU, it is okay, but when the multiplexers are clicked, the structure is like box, I want this representation (trapizoid shape).

**Changes**

- The multiplexer diagram (`SCENES.mux` in `js/scenes/logic.js`) is now
  drawn as the classic trapezoid block symbol — inputs down the slanted
  side, "≥1" and select lines a/b — matching the reference image, in place
  of the earlier gate-tree drawing.
- A second, dedicated 8-to-1, 16-bit-wide multiplexer (`SCENES.mux8`) was
  added for the 8086 ALU's result multiplexer, wired to the eight
  arithmetic/logic units it actually chooses between.
- The favicon code, paths and MIME types were all found to be correct — the
  real cause of "the favicon isn't updating" is that browsers cache
  favicons unusually aggressively. `build/build.mjs` now computes a SHA1
  hash of the icon files' bytes and appends it as a `?v=` query string to
  every icon and manifest link, so a changed icon is always re-fetched.

---

### 4.0.0: v4 — both ALU modes back, and a multi-highlight bug fixed

**Prompt**

- 2026-09-17 (the exact time is not in the saved record yet):
  > I did a mistake, there are no option for both 8086 and 4-bit ALU inside the ALU. Take the configuration from the v3_2 version, there are two options in ALU. bring back that to a new version v4. Keep the i8086 (chip click) same. So, there will be two 8086.
- Later, with a screenshot showing an empty highlighted box under the Result row:
  > There is an extra box which has nothing. Remove the box from the 8086 ALU. Lower the result register a bit, adjust the gap.
  >
  > Inside the Multiplexer, implement 3x1 (4x1 actually) for 4-bit ALU as it takes 3 inputs.

**Changes**

- **v4** was created as a copy of v3_5 (which keeps the rebuilt Intel 8086
  page), with the dual-mode ALU from v3_2 (`js/scenes/alu86.js`) ported back
  in and reconciled with v4's real machine-code 8086 emulator — for example
  jump-taken detection, which v3_2 read from an old instruction-counting
  `ip`, now reads the `jumped` flag the real byte-addressed emulator
  returns. The ALU page again offers **Simple 4-bit ALU** and **8086 ALU**.
- A hover bug showed an empty dashed highlight box beneath the Result
  register; the bundled four-row hotspot was split into one `hot()` call per
  row (A, B, Result, High/remainder), each with its own single highlight
  box.
- **A site-wide bug, not just an 8086 one**: clicking any part whose
  highlight is drawn as several disjoint boxes sharing one id (for example
  a register split across two rows) highlighted every box with that id, not
  just the one clicked. `applyFocus()` in `js/engine.js` now takes the
  clicked element itself (via a new `focusOrigin`, set from the click/keydown
  handler) and highlights only that one, falling back to the old
  "every box with this id" behaviour for navigation that didn't come from a
  direct click (breadcrumbs, history, the part tree) — where that is still
  the wanted behaviour.
- The Result register and its multiplexer were moved down slightly with an
  even gap between them.

---

### 3.5.1: Bigger type on the 8086, and green again with a colour per section

**Prompt**

- 2026-09-16:
  > Make the text a bit bigger in 8086. Give me only the updated files without a zip.
  >
  > Change the overall theme to greenish as before. But different sections may have different colours

**Changes**

**Larger type on the 8086 page.** Every size in the diagram went up by roughly
one to two points: headings 15.5 → 17.5, labels 12.5 → 14, block names 13 → 14.5,
values 12.5 → 14, the story text 13 → 14.5, and the lists on the left with them.
Four pieces of the layout had to move to keep the larger text clear of
everything else:

- the flag cells are taller (34 → 40) so the name and the digit no longer touch;
- the assembly column in RAM starts further in, and an instruction longer than
  26 characters is shortened, so it can never run into the machine code;
- the output box says "INT 21h" rather than "DOS · INT 21h";
- the wires in and out of the address adder were moved right, from x 520/534/548
  to 578/592/606, so they no longer cross the words "Address adder" and
  "Segment registers".

Checked by sweeping all 97 example programs and every move of each — 2,107
states in all — and testing every pair of text boxes for overlap. None.

**Green again, with a colour for each section.** The palette from 3.4.0 is back
unchanged: deep green primary, amber for anything switched on, green circuit
board. The site icons and the preview image are the 3.4.0 ones again.

On top of that, each level of the site now carries its own hue, held in
`--section` and set from `data-level` on `<html>`: green for Level 1, teal for
Level 2, blue for Level 3, violet for Level 4 and amber-brown for Level 5. It
shows on the level line in the details panel, the underline on the current
breadcrumb and the current chip in the mobile strip. `build/build.mjs` writes
the level into the page and `go()` in `js/engine.js` keeps it in step when the
page changes without a reload.

The 8086 page gives its own parts their own colours too: the BIU amber, the EU
green, RAM teal, and the address, data and control buses blue, green and amber.

The build's contrast check passes with no warnings in either theme, and all
143 8086 checks still pass.

---

### 3.5.0: The 8086 block diagram, a visible flow, and a vibrant theme

**Prompt**

- 2026-09-15:
  > Modify the present 8086 part with the given 8086.html. Try to avoid overlapping components, sections, and text. Add an extra feature above the 8086.html refference that is: example code selection and the corresponding flow on the left.
  >
  > Modify the whole theme for the zipped project (use more vibrant colours).

**Changes**

**The 8086 page (`js/scenes/i8086.js`, rewritten)**

The page now follows the reference block diagram. It is laid out as four
columns that never share space, so no box, label or number sits on top of
another one:

1. **Example programs, then the flow.** Eight complete stories are offered
   first, each short enough that the whole run fits in one list, followed by
   the per-instruction examples grouped as before. Under them is the new
   flow: every move the program will make, grouped by instruction, with the
   address of each instruction and a coloured dot showing which bus that move
   uses. The current move is highlighted, past moves are dimmed, and clicking
   any line jumps straight to that moment.
2. **The chip.** The BIU holds the memory interface, the Σ address adder, the
   five segment registers and the six queue slots; the EU holds the control
   unit, the internal 16-bit bus, the register file with its AH/AL halves,
   the ALU, the result, the nine flags and the screen output.
3. **The three buses**, each in its own colour in its own channel, with a key
   underneath. Hovering or focusing one still names it.
4. **RAM outside the chip**: the assembled program in the code segment, one
   row per instruction with its address, assembly and machine code, and the
   bytes of the data segment with their labels and characters. Under it the
   physical-address sum, and under that the story of the current move.

Other changes on the page:

- The whole run is planned before it is shown, so **Step** now moves one move
  at a time in either direction, the flow list can be used to jump, and
  Reset returns to the first move instead of reassembling.
- Each move carries the state of the chip that goes with it, so the registers,
  flags, queue and memory shown always match the sentence being read.
- The physical-address strip spells out segment × 10h + offset for every
  address the chip forms, whether it came from CS:IP, DS:EA or SS:SP.
- Clicking a row of RAM, or the **Instruction set** button, opens the opcode
  encoding reference at the matching entry.
- **Write your own** opens the assembler in the same overlay.
- Speed is now Instant, Slow, Normal or Fast; Instant skips the dot entirely.

**The theme (`css/styles.css`, `build/template.html`, `build/build.mjs`, `site.webmanifest`)**

Every colour token was replaced with a more vivid set: electric violet as the
primary, tangerine for anything switched on, and a teal-cyan circuit board.
The three 8086 buses each keep their own hue (blue, green, orange) as new
`--bus-a`, `--bus-d` and `--bus-c` tokens. The favicon, the manifest and the
`theme-color` tags follow the new palette. Every site icon (favicon.ico, the
16, 32, 180, 192 and 512 pixel PNGs and the maskable icon) was redrawn in the
new violet, and the preview image was retaken from the rebuilt home page.

The build's contrast check passes with no warnings in either theme, all 143
8086 checks still pass, and about 95 lines of CSS left over from the previous
8086 layout were removed.

**One correction**: the ALU page still told the reader to "use the switch at
the top of the diagram to choose a mode". That switch was removed in 3.4.0,
so the text now describes the 4-bit ALU as it actually is and points at the
Intel 8086 page for the 16-bit one.

---

### 3.4.0: The 8086 page becomes the working architecture

**Prompt**

- 2026-09-12 (the exact time is not in the saved record yet):
  > You did a great job. Now work on the 8086 part. Actually take the structure of the 8086 Structure completely to the 8086 chip. Replace the present condition of the 8086 chip with the present structure of the ALU. The ALU should contain 4 bit implementation now.
  >
  > Add one more thing to the the present 8086 structure. the incstuction queue should come from the example code as given in 8086 chip now. And show the flow of data with a moving dot (high-lighted). A controller (slider) to match control the speed.
  >
  > Hovering over the bus should show the names (Address bus/ data bus / control bus).
- Later:
  > continue

**Changes**

*The 8086 page is now the architecture, running real programs*
- The BIU/EU architecture has moved from the ALU to the Intel 8086 page, replacing the old text-panel emulator. It keeps the program listing, the example programs for all 89 instructions, and the editor.
- The layout follows the classic 8086 block diagram: memory outside the chip; the BIU with the address adder (Σ), CS, DS, SS, ES and IP, and the 6-byte instruction queue; the address, data and control buses between them; and the EU with the register file, control unit, ALU, flags and the DOS output.
- **The queue holds the running program's real machine code.** Each cell shows a byte and what it is (opcode, ModR/M, address low, data high …), taken from the program you chose or wrote.
- Memory shows the assembled program at CS:0000, with the byte IP points at outlined, or your DB and DW data at DS:0000. A button switches between them.

*Animated data flow*
- Each instruction plays as a series of moves: fetch the address, the bytes come back, decode, read operands, execute, write back, write to memory, print output, and refill the queue after a jump.
- A bright dot travels along the path carrying the data, labelled with the value it carries, while the parts it touches light up.
- **Speed**: Off, Slow, Normal, Fast and Fastest. Off applies each instruction at once, with no animation.
- **Step** moves to the next stage; **Run** plays continuously and turns into Pause.

*Bus names on hover*
- Hovering or focusing a bus shows its name and a short explanation: the address bus (20 lines, one way), the data bus (16 lines, both ways), and the control bus (read, write, memory or I/O).

*The ALU returns to 4 bits*
- The ALU page is the simple 4-bit model again, with its nine operations, parallel units and flags. The mode switch is gone, and a note points to the 8086 page for a real 16-bit ALU.

*Emulator: real machine code*
- The assembler now produces real 8086 machine code and places it in memory at CS:0000, so **IP counts bytes** exactly like the real chip, and CALL, RET and INT push real addresses. This replaces the old simplification where IP counted instructions.
- Short jumps that cannot reach their label are refused with a clear message, and a JMP too far for one byte becomes a near jump automatically.
- The assembler also accepts `label+3` style operands.
- 516 instructions, covering every example program plus a synthetic program that exercises all addressing modes, segment overrides, prefixes and both jump sizes, are checked byte for byte against the Capstone disassembler: opcode, registers, memory operands and jump targets all match.
- All 89 example programs were also stepped through the page itself, checking that the queue and the bytes in memory always match the real machine code.

---

### 3.3.0: 8086 architecture and flow, gradients, tidier labels

**Prompts**

- 2026-09-11, after 3.2.0 (the exact time is not in the saved record yet), with an image of the classic 8086 architecture diagram attached:
  > In for 8086 part, try to use this structure to make student understand the flow.
  >
  > Make the text 'Simplified educational model' look transparent and small. Take it to top-right of the box. Do the same for 'Click the bits...' at bottom-left.
  >
  > For the shifter.html, reduce the length of the pins with 0 input when shifted right or left. Use the same angle for them or connect them together to a common 0.
  >
  > Try to avoid overlaping texts.
  >
  > Use some colour gradients to look the app more attractive. You can use differents shades of Green, yellow
- Later:
  > Continue

**Changes**

*8086 drawn like its architecture diagram, with the flow animated*
- The 8086 ALU view now follows the classic block diagram:
  - memory outside the chip, at the top
  - the **BIU**: the address adder (Σ) above CS, DS, ES, SS and IP, and the 6-byte instruction queue
  - the thick internal bus
  - the **EU**: the register file (AH|AL … DH|DL, SI, DI, BP, SP), the A and B inputs, the ALU, the result, the control unit below the queue, and the flag register
- **Execute** plays the five steps: 1 fetch, 2 decode, 3 operands, 4 execute, 5 write back. Each step lights only its own paths and numbered badge, and describes itself in words. "Skip to the end" finishes at once, and people who prefer reduced motion get the result straight away.
- The queue shows the instruction's real 8086 machine code, labelled byte by byte (opcode, ModR/M, address, data). All 4,646 combinations the view can produce were checked against the Capstone disassembler.
- The BIU works out the 20-bit address, for example DS × 16 + 0004h = 01004h. IP advances by the instruction's length on each Execute.
- The flag register shows each flag's current value and what it will become (for example 0→1, or 0→? when undefined). Click a flag to change it.
- 24 functional checks pass, and all 590 operation and operand combinations were checked for overlapping text.

*Corner labels*
- "Simplified educational model" (top-right) and the hint text (bottom-left) are now small, with no box or border, tucked into the corners of the diagram.

*Shifter*
- The 0 inputs used when bits shift in from outside now run at the same angle as each layer's other wires, are short, and join one shared "0" source per layer. They no longer cross other wires.

*Colour gradients*
- Soft green-to-yellow gradients on the page, the diagram area and the details panel.
- Richer gradients on diagram blocks, active buttons, lit bits, flags, the MUX, the BIU and EU areas, and the logo.
- Everything follows light and dark mode, and the build's contrast check covers every gradient colour.

*No overlapping text*
- A new check looked at every view (60) at three screen sizes, with the details panel shown and hidden. It checked text against text, and the corner labels against the diagrams. The one clash found (a long button label on the 4164 chip) is fixed.

*Phones*
- Enlarged tap areas for small buttons no longer spread over neighbouring buttons, and they are recalculated after "Zoom diagram". Before, tapping SUB in the dense 8086 operation grid could select CMP. All 118 operation taps (fitted and zoomed) now select the right operation, and no tap area blocks another control on any view.

---

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
