# Version Log: Inside the Computer

This file records every update to the project, with the prompts that asked for it.

Times are in UTC, with Dhaka time (UTC+6) in brackets. Prompt times come from the saved conversation record, where they were recorded to the second. Delivery times come from the finished files.

Add a new section at the top of "Versions" for each future update.

## Summary

| Version | Date (UTC) | Delivered | Main change |
|---|---|---|---|
| 5.19.0 | 2026-09-18 | — | Site-wide: the 5.18.0 fix turned out not to actually help — measured again and found the deferred setup work was still landing in the same animation frame as the crossfade's start, and a second stall of the same size in `go()`'s panel/breadcrumb rebuild that 5.18.0 hadn't touched at all; both are now deferred correctly (confirmed with fresh throttled-CPU measurements, not just re-applying the same fix) |
| 5.18.0 | 2026-09-18 | — | Site-wide: measured the mobile transition under a throttled CPU and found the real cause — a 100ms+ main-thread stall building and wiring up the new diagram, blocking the crossfade's first frame — deferred that work by one frame so the fade starts on time regardless; also hardened GPU-compositing hints and fixed a viewport-height unit that could jump when a phone's browser bar shows or hides |
| 5.17.0 | 2026-09-18 | — | Site-wide: fixed the transition flicker on mobile between parts — a page-level smooth-scroll was animating at the same time as the diagram's own cross-fade, competing for the same frames; the transitioning layer now hints the browser to composite it ahead of time; meta-tag lookups on every navigation are now cached instead of re-queried |
| 5.16.0 | 2026-09-18 | — | Site-wide: the "turn your phone sideways" banner removed again — it didn't look right and wasn't reliably dismissible in a mobile browser |
| 5.15.0 | 2026-09-18 | — | Site-wide: a dismissible "turn your phone sideways" banner on narrow touch screens held in portrait |
| 5.14.0 | 2026-09-18 | — | Site-wide: the stale white-chip favicon/app-install icons replaced with the real black-chip-on-green mark, and the logo's "AS" given an actual gold gradient instead of a flat fill |
| 5.13.0 | 2026-09-18 | — | 8086: the animated dot lands on the exact memory row again — reading its real, current on-screen position (the box scrolled to it first) right before each step's dot sets off, instead of a generic point in the box, which is what the scrollable-list redesign had temporarily lost |
| 5.12.0 | 2026-09-18 | — | 8086: the RAM panel's four boxes now use one consistent gap for the panel's left/right/top/bottom margins and the space between boxes, instead of a cramped 14px margin next to a much wider 44px gap between the two columns |
| 5.11.0 | 2026-09-18 | — | 8086: the CS/DS/SS/ES popup and its buttons removed — each RAM-panel box is now a real scrollable list showing every row the program actually touched, in bigger type; fixed a genuine duplicate-animation bug where POP (and any plain register load) sent two dots to the same register; all four segment boxes now share one colour; hover box-shadows added to buttons site-wide |
| 5.10.0 | 2026-09-18 | — | 8086: two real value-updates-too-early bugs found by re-reading buildStory() end to end — a store's destination byte used to flip to its new value two steps before the dot carrying the data arrived, and an instruction changing two registers at once (MUL, XCHG) revealed both immediately even though only one got an animated dot |
| 5.9.0 | 2026-09-18 | — | 8086: fonts sized up across the diagram; SS/ES boxes widened so their full labels fit; the segment memory popup now shows only the part of the 64 KB a program actually uses (with a bigger font), instead of always dumping all 65,536 bytes; every popup's close button is now the same cross-sign icon the rest of the site already uses, instead of some saying "Close" |
| 5.7.0 | 2026-09-18 | — | 8086: the stack box's window no longer snaps back to offset 0 the step after a PUSH scrolled it to SP — it now stays put until something scrolls it again; CS/DS/SS/ES are now clickable, opening a full 64 KB hex dump of that segment |
| 5.6.0 | 2026-09-18 | — | 8086: PUSH/POP direction (stack fills toward lower addresses) now spelled out explicitly, not just "grows downwards"; wider gap between the three bus lines; the four speed-preset buttons replaced with a single slider, slowest setting now well past the old "Slow" preset |
| 5.5.0 | 2026-09-18 | — | 8086: fixed the real reason the stack box never showed a PUSH/POP (its snapshot only ever covered a segment's first 64 bytes, but SP starts at 0100h); every segment/register value shown now comes from that step's own snapshot instead of the program's already-finished end state; fixed a coordinate bug that put the internal data bus line in the wrong place, and moved it to sit cleanly below the control unit |
| 5.4.0 | 2026-09-18 | — | 8086: the chip diagram itself enlarged 18%; CS and DS boxes matched to the same width with wider DS column gaps; CS widened so more of the machine code shows before truncating; the bus-line legend no longer runs into the RAM panel |
| 5.3.0 | 2026-09-18 | — | 8086 layout pass: the four segment labels no longer spill outside the RAM panel, all four boxes are now the same height, DS's name column is left-aligned instead of floating at the right edge, the description box is sized to its own text instead of guessed, the left column is widened and stretched to meet its bottom, and the gaps to the chip on both sides are tightened |
| 5.2.0 | 2026-09-18 | — | 8086 RAM panel redrawn again: CS and DS as two boxed tables sharing the panel's left edge (SS and ES boxed to their right), each shown as a handful of live rows + "…" + the segment's real top address, instead of a long scrolling list; CS narrowed and its text truncated to fit; DS regained a variable-name column; every dot path now finishes inside the correct box |
| 5.1.0 | 2026-09-18 | — | 8086: register-destination flow bug fixed (the dot now travels to the register that's really changing, not always AX); a "Segments & memory" reference overlay added; the RAM panel rebuilt as a 2x2 CS/DS/SS/ES grid, each with its own live 64-byte window and correct segment attribution for reads/writes/stack traffic |
| 5.0.0 | 2026-09-18 | — | v5: touch users can now reach the right-click details card (press and hold); the 8086's three bus lines narrowed, and SS/ES added alongside CS/DS in the RAM view |
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

### 5.19.0: The 5.18.0 fix didn't actually work — here's what did

**Prompt** (2026-09-18, exact time not in the saved record):
> The screen still flickers in mobile brower.

**Changes**
- Re-measured the 5.18.0 fix under the same throttled-CPU conditions instead of assuming it worked, and it hadn't: `requestAnimationFrame(settle)` and the pre-existing `requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.remove(...)))` that actually starts the crossfade were both queued in the same synchronous tick, so both landed in the *same* upcoming frame — the heavy setup work still blocked that frame's paint exactly as before, just one frame later than it used to. Same stall, moved, not shrunk.
- Fixed properly this time: the two chains are merged into one — `requestAnimationFrame(() => requestAnimationFrame(() => { svg.classList.remove(...); setTimeout(settle, 0); }))` — so the class removal (which starts the fade) gets to paint *before* `setTimeout(...,0)` lets the heavy setup work run, instead of racing it.
- That alone still didn't fully fix it: a second measurement pass found an equally large stall one level up, in `go()` — after `swapLayer()` returns, `go()` was still synchronously rebuilding the detail panel, breadcrumb trail and "in this view" strip in the very same tick, which turned out to be exactly as capable of blocking the crossfade's first frame as the thing 5.18.0 fixed. That block is now deferred behind the same rAF/rAF/setTimeout chain, only when an actual cross-scene fade is about to play (a plain in-scene update still runs it immediately, since there's no fade to protect there).
- Verified with fresh throttled-CPU measurements after each change (not just re-running the same test): the stall on Computer→CPU dropped from ~233ms to ~200ms, and a heavy-panel transition (Computer→motherboard) dropped to ~33ms — close to a single frame budget. One transition (CPU→ALU) is still sitting at ~166ms and didn't move at all across any of these fixes, which points to a different, not-yet-found cost specific to that scene pair (most likely inside its own scene-build step, which runs earlier and outside all three fixes above) — flagged for a follow-up look rather than declared fixed.
- Confirmed no regressions: normal-speed (unthrottled) devices still get a clean ~16–17ms frame cadence with zero stall, and rapid back-to-back navigation (clicking through three parts before any deferred work has even run) still lands on the correct final diagram, breadcrumb and panel content, with no stale-content flash.

### 5.18.0: The actual stall behind "it still flickers"

**Prompt** (2026-09-18, exact time not in the saved record):
> The screen still flickers in mobile brower.

**Changes**
- The 5.17.0 fix (competing scroll animation, compositing hints) was real, but a report that it "still flickers" meant there was more to find — and the previous verification pass had tested on a fast desktop CPU with just a phone-sized *viewport*, which doesn't reproduce a slow phone's actual CPU.
- **Re-tested with the CPU deliberately throttled** (Chrome DevTools Protocol, 6× slowdown) to approximate a real budget Android phone, sampling frame-by-frame. At normal speed every transition was a clean 16–17ms cadence with no stall at all — confirming the 5.17.0 fix was correct and the earlier "no issue found" result wasn't wrong, just measured under the wrong conditions. Under throttling, a very different, previously-invisible problem showed up: a single ~100–130ms stretch, right after the new diagram's SVG is inserted, where the main thread was still busy (building/wiring up the new scene) *before* the crossfade's very first animated frame — a real freeze, not a compositing glitch, and severe enough on an actually slow device to read exactly like a flicker.
- That setup work (the scene's own `init()`, drag-position restore, the "moved parts" toolbar) now runs one frame later instead of in the same synchronous block as inserting the new diagram — imperceptible on a fast device (it already finished within one frame there), but on a slow one it lets the browser paint the newly-inserted diagram and start the already-scheduled crossfade on schedule, instead of holding that first paint hostage until all of it finishes.
- Also hardened the GPU-compositing hints so they survive a zoom transition's own inline transform (which fully replaces, rather than merges with, the CSS transform that carried them), and changed a `vh`-based mobile stage height to prefer `dvh`, so the diagram no longer resizes if a phone's address bar shows or hides mid-navigation.

### 5.17.0: Finding the real cause of the mobile transition flicker

**Prompt** (2026-09-18, exact time not in the saved record):
> When the app is opened in mobile browsers, changing pages (entering the tree-CPU to ALU, ALU to Logic gates) flickers the screen. A smooth transition is needed. Make sure unnecessary calls, loads are avoid and smooth trasition is ensured

**Changes**
- This site never actually reloads the page for internal navigation — `go()` swaps an SVG/HTML layer in place and updates the URL with `pushState`, with a custom cross-fade/zoom CSS transition between the old and new diagram. That part was already working as intended.
- **Found the real cause of the flicker**: clicking a link inside the details panel (the "Inside it" list, on mobile — where the panel sits below the diagram) triggered the diagram's cross-fade AND a separate `stage.scrollIntoView({behavior:'smooth'})` page-scroll *at the same time* — two competing animations fighting for the same frames, which is what actually read as flicker on a mobile device. That scroll is now instant (`behavior:'auto'`); the diagram's own cross-fade still provides the sense of motion on its own.
- The transitioning layer now carries `will-change:opacity,transform` and `backface-visibility:hidden`, so mobile browsers promote it to its own compositor layer ahead of the transition instead of partway through it — the other common cause of a visible flash on weaker mobile GPUs.
- **Unnecessary calls**: `updateMeta()` (title, description, canonical, Open Graph, Twitter, JSON-LD) was re-running `document.querySelector` for seven separate elements on every single navigation, even though none of them are ever removed from the page. They're now looked up once and reused by reference.

### 5.16.0: The rotate-phone banner, removed

**Prompt** (2026-09-18, exact time not in the saved record):
> The rotating text is not looking good. It is hardly coded and cannot be removed from the mobile browser. Remove this note.

**Changes**
- The banner added in 5.15.0 didn't look right and, on an actual mobile browser, wasn't reliably dismissible — so it's removed entirely rather than patched: the markup, its CSS (including the spin animation), and its dismiss-wiring in `js/engine.js` are all gone. No visible or behavioural trace of it remains on any page.

### 5.15.0: Rotate your phone

**Prompt** (2026-09-18, exact time not in the saved record):
> Also for the mobile use only instruct to rotate the phone to use the app smoothly. Instruct this to the mobile browser too.

**Changes**
- Every diagram on this site is wide, so a phone held upright is a cramped way to use it. A small banner ("This works best in landscape — turn your phone sideways", with a rotating-phone icon) now appears on any narrow, touch (coarse-pointer) screen held in portrait — desktop, laptop, and anything already in landscape never see it at all, since that's a pure CSS media query (`max-width:980px`, `orientation:portrait`, `pointer:coarse`), not a device-name sniff.
- It's on every page (added once, in the shared template), works identically in a plain mobile browser tab and once installed as an app, and can be dismissed (✕) — dismissing only hides it for the rest of that browsing session, so it comes back next time rather than being silenced forever after the first tap.

### 5.14.0: The real logo, everywhere it should have been

**Prompt** (2026-09-18, exact time not in the saved record):
> then maintain the same logo. installing logo shows white ic. But everyther it should be Black IC on green background and a golden AS on top. Try to add gold effect on the AS. Push this directly to github

**Changes**
- **Found why the installed icon looked different from the site's own logo**: the header logo (and `favicon.svg`) had already been updated to the current black-chip-on-green design a while back, but the actual icon *files* — `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`, `maskable-512x512.png` — were never regenerated after that change, and were still the old design (a white/off-white chip). Every one of them is now rendered fresh from the current mark, including a maskable variant with the extra safe-zone padding Android's adaptive-icon mask needs.
- **The "AS" now has a real gold gradient** (light gold at the top fading to a deeper amber at the bottom, with a thin bronze outline for definition at small sizes) instead of a single flat gold fill — applied everywhere the mark appears: the page header, `favicon.svg`, and all the regenerated icon files.
- Pushed directly to the public repo per request.

### 5.13.0: The dot finds its row again, even though rows can now scroll

**Prompt** (2026-09-18, exact time not in the saved record):
> the data is not taken to the exact memory location (row) to the segments. But it used to do it correctly. Please adjust the positions.

**Changes**
- When the CS/DS/SS/ES boxes became scrollable HTML lists (5.11.0), a row no longer has one fixed position the way it did when the boxes were static SVG — so the animated dot was changed to aim at a generic point in the box instead of the specific row, which was a real regression from how it used to land exactly on the byte or instruction involved.
- Each step that touches a specific row now carries which one (which instruction, for CS, or which byte offset, for DS/SS/ES) and which end of its path that row is. Right before the dot sets off, that row is scrolled into view and its real, current on-screen position is read back and spliced onto the path — so the dot still finds the exact row, even though the row's position can no longer be worked out in advance.

### 5.12.0: One consistent gap around and between the four boxes

**Prompt** (2026-09-18, exact time not in the saved record):
> for the CS, DS, SS, ES, keep side space similar. the CS, DS are too left that is so near the outer box. But there is a gap between CS, SS. Maintain equal distance from top, left, bottom, left.

**Changes**
- The RAM panel's left/right margins (14px), top/bottom margins (30px/20px), and the gap between the two box columns (44px) were four different numbers, which read as CS and DS sitting jammed against the panel's edge while a noticeably bigger gap opened up between the columns. All of that is now one constant (24), used for every margin and every gap alike.

### 5.11.0: The popup is gone, the boxes scroll on their own, and a real duplicate-dot bug

**Prompts** (2026-09-18, exact times not in the saved record):
> Remove the pop-up showing option for all the memory data in CS, SS, DS, ES in pop-up with much larger text. if more than 6 rows apears, then keep a scrolling option inside the present sectin. Remove the button style on top of each segment.
>
> sometimes, flow is having bug (like in stack push pop problem) while poping, the data coming to BX has two flow (repeat)
>
> Make all the segment colour yellow (same). hovering over the components should create box shadow to highlight (dark shadow in light mode, light shadow in dark mode) that part a bit.
>
> dark shadow in light mode, light shadow in dark mode. Maintain this theme to every components of this website (all pages)

**Changes**
- **The click-a-segment popup is gone entirely** — no more `.segreg` click on the chip's segment registers, no more button header on each RAM-panel box. In its place, each of the four boxes is now a genuinely scrollable HTML list, showing every row the currently-loaded program has actually touched (not a fixed 6-row window with a "…" and a fake top-of-segment row — that whole device is gone, because it no longer needs to exist). Past 6 rows, the box scrolls on its own, the same way the flow list on the left already did. Text throughout is bigger.
- **Found the real cause of "the data reaching BX has two flows."** A plain register load from memory — `POP BX`, or `MOV BX,[mem]` — already animates its own dot all the way into the destination register as part of the read itself. But the write-back step that follows was *also* animating a second, separate dot to that same register, because POP changes both the destination register and SP, and the destination register's own delivery wasn't being recognised as already handled. The write-back step now skips whichever register the read step itself already delivered.
- **All four segment boxes now share one colour** (the same amber/yellow used for a highlighted value elsewhere), instead of a different colour per segment.
- **Buttons across the whole site (not just this page) now cast a shadow on hover** — `.btn-s`, the shared button style used everywhere a scene draws its own controls, not just here.
- Since rows can now scroll to anywhere in a long list, a memory access's animated dot no longer aims at one specific row's exact pixel position (which no longer has a fixed one) — it aims at the box itself, and the specific row is found afterwards by highlighting it and scrolling it into view.
- A verification pass caught one CSS bug from the rewrite: DS's row (address/value/name, three columns) shares a class with SS/ES's row (address/value, two columns), and the two-column rule meant only for the narrower SS/ES boxes was also collapsing DS's name column onto its own overlapping line. Scoped that rule to SS/ES specifically.

### 5.10.0: Two real "updates before the dot arrives" bugs, found by reading buildStory end to end

**Prompts** (2026-09-18, exact times not in the saved record):
> The values in the memory/registers should update when the data carrying dot reaches the destination. There are inconsistancy. Find them everywhere and fix it. Give a deep look to each code.

**Changes**
- **A store's destination byte was revealing its new value two steps early.** A memory write plays out as three steps — the address going out, the control bus asserting a write, and finally the data itself crossing the data bus into RAM — but the first two were already showing the *post-write* byte the instant their own dot (which only carries an address or a control signal, not the data) arrived. Every store now carries a snapshot with just the bytes about to be written held back at their old value; everything else that instruction already changed (a register write-back, flags) still shows correctly throughout, since those aren't what's being held back.
- **An instruction that changes two registers in one move revealed both of them on a single step.** `MUL BX` leaves its product in DX and AX together, and `XCHG` swaps two outright — both used to get one "write back" step whose dot only ever travelled to the first register, while the second's new value appeared anyway with nothing having visibly carried it there. Each changed register now gets its own step and its own dot, in turn.
- **The most far-reaching one, caught by a verification pass on the first two fixes**: the "ALU · execute" step itself revealed the destination register (and any memory it wrote to) immediately — one step before the write-back/store steps whose dots are the ones that actually deliver those values — even though the ALU-execute step's own dot only travels to the "Result" display box. This affected *every* arithmetic instruction, not just the two special cases above. A single `withheld()` helper now threads through the ALU-execute, write-back and store steps, each revealing a little more of the instruction's real effect than the last, while flags (which the ALU-execute step's dot genuinely does deliver) still update at that same step.

### 5.9.0: Bigger type, a fitted popup, and one close button everywhere

**Prompts** (2026-09-18, exact times not in the saved record):
> Make the fonts a bit bigger where is possible. For SS and ES take label a bit left (increase the width a bit) so that the label doesn't cross the box.
>
> In pop up memory, only show the memory locations of that particular section (increase the font too)
>
> Some tabs has cross sign, some has cross text. Make them consistent to all places (cross-sign)

**Changes**
- **Font sizes increased** across the chip diagram's labels, register/segment values, assembly/machine-code text and titles.
- **SS and ES widened** (230→300) rather than shortening their labels again — this restores the fuller "Stack segment · SS = …h" / "Extra segment · ES = …h" wording (shortened in the previous version to fix an overflow) now that the box is wide enough to hold it.
- **The segment memory popup no longer dumps the whole 64 KB.** It now works out which part of that segment the *currently loaded program* actually reads, writes, or declares — CS from its own instructions, DS from declared bytes plus anything touched, SS/ES from whatever offsets ever showed up in a PUSH/POP/string-instruction step across the whole run — and shows only that (with a little padding for context), instead of thousands of mostly-empty lines. Its font size was also increased.
- **Every popup in this file now closes with the same "×" icon** the rest of the site already used elsewhere (the details card, the overview dialog) — the five here (example picker, opcode reference, write-your-own, segments-and-memory, and the new per-segment memory view) previously all said "Close" in text instead.

### 5.8.0: Four more examples, all cross-checked, and a button on every segment

**Prompts** (2026-09-18, exact times not in the saved record):
> Add more example codes in the example set. Cross-verify all of them. Did you implement pop-up for every segement? add a button style on the top of each segment.

**Changes**
- **Four new example programs**, on top of the original eight: a stack frame built with BP (`MOV BP, SP` then `[BP]`, the addressing mode real compilers use for local variables), a string copy done with the actual `MOVSB` instruction rather than a hand-written loop, a shift/rotate example (`SHR` then `ROL`, showing the difference between a bit that's lost and one that's kept), and a `CALL`/`RET` subroutine (which pushes and pops the return address the same way `PUSH`/`POP` do, just automatically).
- **Added `build/test-8086-examples.mjs`**, a standalone check (like the existing `build/test-8086.mjs`, but for the example picker specifically) that assembles and runs every one of the 12 examples and checks its final register/memory state against hand-worked-out expected values. All 12 pass. Building it caught two mistakes in my own first-guess expected values (not simulator bugs) before they could be mistaken for real ones.
- **Confirmed the "click a segment to see all of it" feature already covered CS, DS, SS and ES** — only IP was ever excluded, since it isn't a memory segment.
- **Added a second way to reach that same popup**: a small button now sits right on top of each segment's own box in the RAM panel, colour-matched to that box's border, so it can be opened from wherever its data already is instead of only from the chip's segment-register list.
- The SS and ES buttons are narrower than CS and DS (230px vs 460px), and their full label ("Stack segment · SS = 0200h") ran past the button's own edge there. Shortened to "Stack · SS = 0200h" / "Extra · ES = 0100h" for those two only.

### 5.7.0: The stack window stops resetting itself, and every byte is now one click away

**Prompts** (2026-09-18, exact times not in the saved record):
> the stack (SS) is updated to show position (02000) but the data is saved at 00FE. So, the data is not shown. So, keep the memory location fixed to 020FE to show the stored data for the specific program.
>
> Add clickable option over the segments. Clicking the segements should pop-up the whole memory section of that section in a pop-up window. so, anyone can see all the memory values of that segement.

**Changes**
- **Found the real bug behind this**: a PUSH correctly scrolled the stack box down to SP for the one step where the write happened, but every *other* step's window defaulted back to 0 regardless of what the box was already showing — so one step later, the pushed byte scrolled straight back out of view even though it was still sitting there in memory. Each box's window is now sticky: it carries forward from the last step that actually scrolled it, and only moves again when a later access needs it to.
- **CS, DS, SS and ES are now clickable** (in the chip's own "Segment registers" box — IP is left alone, since it isn't a memory segment). Clicking one opens a full hex dump of that segment's entire 64 KB, all 4096 lines built as a single block of text rather than one element per byte, so it opens and scrolls without any per-byte DOM overhead. CS reads live (its bytes never change once loaded), DS/SS/ES read from the currently-displayed step's own snapshot, same as the small windows in the RAM panel.

### 5.6.0: Which way the stack really goes, more room between the buses, a slider

**Prompts** (2026-09-18, exact times not in the saved record):
> Cross-check the stack push pop example. is it okay with the memory address? does it push pop from below (higher memory address this case)? If so, then maintain it carefully and mention about the this in the description. Maintain SP, BP correctly.
>
> Increse the gap between the buses those are vertically present in between the CPU chip and the RAM.
>
> for slow option, slow down the the process more. and instead of button add slider.

**Changes**
- **Checked the stack mechanics directly against the simulator's own PUSH/POP code** (`cpu.push`/`cpu.pop` in `js/sim/i8086.js`) and the assembler's addressing rule (a `[BP+…]` operand already defaults to the SS segment, exactly like real hardware, unless it names another segment explicitly) — both were already correct: SP starts at 0100h and PUSH moves it down (to a lower address) before writing; POP reads first, then moves it back up. The gap wasn't in the mechanics, it was in the wording: "the stack grows downwards" doesn't say which way "down" is in address terms. The PUSH step, the POP step, the "Use the stack" example blurb, and the "Segments & memory" reference all now say explicitly that the stack fills toward *lower* addresses from a high starting point.
- **The three bus lines were spaced 20 units apart** (24 once the chip's own 1.18× scale was applied) — now 35 units (41 scaled), a clearer gap between Address/Data/Control. As a side effect this also fixes their invisible hover/click hit-areas, which at the old spacing slightly overlapped each other.
- **The four fixed speed presets (Instant/Slow/Normal/Fast) are now one continuous slider** (0 = instant, 100 = slowest), with a word underneath it (Fast/Normal/Slow/Slowest) so it still reads at a glance. The slowest setting is now meaningfully slower than the old fixed "Slow" preset was (up from 1500ms per step to roughly 3400ms at the top of the slider).

### 5.5.0: The stack box finally shows a PUSH — the real bug, not the symptom

**Prompts** (2026-09-18, exact times not in the saved record):
> The values in the stack is not updated properly. Adjust All the segment/ memory/ register values for the given examples properly. Cross-check every flow.
>
> Lower the internal data bus line (take it under the control unit). Adjust the 'Internal data bus' remain above it (adjust accordingly so that no overlap happens).
>
> Every register/memory value should update after the dot(data) reaches the position. Values are updated instantly.

**Changes**
- **Found the actual reason the stack box never updated.** Every segment's per-step snapshot only ever captured its first 64 bytes (offsets 0–63) — fine for CS (a program's instructions start at offset 0) and fine for DS (declared data usually does too), but the stack starts at SP = 0100h and grows *downward* from there, nowhere near offset 0. No amount of the box's own row-scrolling could ever reach a byte that was never captured in the first place. Every segment now snapshots its *entire* 64 KB per step (a real, independent copy, not a live view), so the stack box can now show a PUSH or POP wherever SP actually is.
- **Segment values, base addresses, and "top of segment" bytes were being read from the CPU's live, already-finished state instead of that step's own snapshot.** Since the whole run is planned to completion before any of it is shown, "live" state is always the *end* of the program — this didn't visibly matter for the current examples (none of them change a segment register mid-run) but was still the wrong source, and would have shown wrong values the moment an example did change one. Every one of these now reads from the step's own snapshot, falling back to live state only when there's no story yet at all.
- **Fixed a real coordinate bug from the chip-enlarging pass**: the internal data bus line's y-position had the x-scale helper applied to it by mistake, leaving it in the wrong place relative to the control unit. It's now derived directly from the control unit's own bottom edge plus a fixed margin — genuinely "under the control unit," and it can't drift back out of place if the control unit or the chip's scale changes again — with its label repositioned to sit just above it.
- **The three coloured bus lines ran almost all the way down to their own same-coloured legend**, close enough (about 39px) to read as running straight into it. They now stop with a bigger, fixed margin above wherever the legend is, instead of at a fixed length of their own.

### 5.4.0: A bigger chip, a matched CS/DS, and a legend that stays in its lane

**Prompts** (2026-09-18, exact times not in the saved record):
> the width of the DS should be similar as CS. Increase the gaps between the columns in the DS. Widen the CS a bit so the machine codes are shown properly. Enlarge the middle CPU (both height and width).
>
> Ensure the Address bus, control bus labels are not overlapped. Equidistance the middle three vertical lines with the Inside the chip and outside of the chip (RAM).

**Changes**
- **The chip diagram is 18% bigger**, top-left corner held in place. Every one of its internal coordinates — BIU/EU bands, the address adder, segment registers, instruction queue, register file, ALU, flags, output box, and every point the animated dot's wires pass through — is now computed from a single `cx()`/`cy()`/`sc()` scale helper instead of being a hand-picked pixel number, so the wiring and the diagram it lands on scale together. (Previously these were ~40 independent literals; scaling "by hand" would have meant retuning each one and risking the dot drifting off its target.)
- **DS is now the same width as CS** (460, both), instead of noticeably narrower, and its address/value/name columns are spaced much further apart.
- **CS is also wider**, so the machine-code column shows more bytes before truncating (4 bytes + "…" instead of 3).
- **The bus-line legend ("Address bus"/"Data bus"/"Control bus") no longer runs into the RAM panel.** It used to be left-aligned starting right after a small tick mark, so a long name like "Control bus" could reach past the RAM panel's left edge depending on exactly how tight that gap was tuned. It's now right-aligned to a fixed stop just short of the panel, so this can't recur regardless of future gap or scale changes.
- The gap between the chip and the RAM panel is re-derived from the chip's own (now bigger) right edge, keeping the two things equally spaced from each other on both sides rather than one fixed number that assumed the old, smaller chip.

### 5.3.0: Fixing the fit — label containment, equal heights, tighter gaps

**Prompts** (2026-09-18, exact times not in the saved record):
> The UI is not fixed properly for the four segments. Maintain similar height for the segments as all have 6 rows with continuety and last row (if any example has more than 6 rows then make all the segments similar to that. Maintain gaps inside the segments for address, data, and others (columnwise gap) the labels for the segments (CS, SS) going out of the RAM box.
>
> You can shorten the description box (bottom-right) height to match with the left tabs lower point or enlarge the left tabs.
>
> Reduce gaps with the left program flow and middle. also reduce gap with middle CPU with RAM and Description box.

**Changes**
- **The CS/SS labels really were spilling above the RAM panel's own background.** CS and DS's row height (28px) didn't match SS and ES's (26px), and the label position above a box wasn't accounted for when the panel's own top edge was placed — so the label could sit right at or above the panel's border. All four boxes now share one row height, and the whole vertical layout (label → header → rows → next box's label, and the panel's own top margin) is computed from a small set of named gaps (`TOP_PAD`, `LBL_OFF`, `BOX_GAP`) instead of scattered hand-picked numbers, so the label is always guaranteed room inside the panel.
- **DS's name column was right-aligned to the box edge**, so its left edge (and so its gap from the value column) drifted with every name's length. It's now left-aligned at a fixed x, truncated to fit, so the column reads as an actual column.
- **The description box was sized by guesswork** (260px, then 312px) rather than by what it actually draws (a title, up to 6 wrapped description lines, a rule, up to 3 wrapped formula lines) — 260px would have clipped a full three-line formula. It's now sized to that content exactly.
- **The left column (examples, flow list, buttons) was noticeably shorter than the RAM+description column beside it.** Rather than shrink the description box and risk clipping its text again, the left column was widened (310→350px, closing most of the gap to the chip in the same move) and stretched via the flow list's own height so its last button now lands level with the description box's bottom.
- The gap between the chip and the RAM panel was tightened by moving the RAM column left; the chip's own internal wiring wasn't touched, so nothing inside it needed re-deriving.

### 5.2.0: Four boxed segment tables, laid out for pointing, not spreading

**Prompts** (2026-09-18, exact times not in the saved record):
> Add four block (boxed shape) inside the ram for four segments. Follow the dots to exact memory location when need. keep the segement name outside top of the box with initial memory address. Reduce the width of the CS as much as possible untill the texts are not overlapped.
>
> Continue with the following changes: keep the CS and DS at left. It will be easier to point then. Name the variables beside the DS blocks, and remove unnessary memory row. Keep starting 5/6 rows then 3 vertical dots (to represent continiuty) then the last memory address of the section.

**Changes**
- The single 2x2 grid from 5.1.0 is replaced with **four bordered boxes**, each in its own accent colour: CS and DS stacked at the RAM panel's left edge (sharing one x, so a data access and a code fetch both land at the same entry point into the panel — easier to follow than two separate columns), SS and ES stacked in a second column to their right.
- Each box now shows a **fixed, short shape** instead of a long scroll: 6 live rows (still the same scrolling window as before, so PUSH/POP/CALL/RET/MOVS/STOS still land exactly where the access happened), a static "…" row, and a final row pinned to that segment's real last byte (base × 10h + FFFFh) — so every box stays compact regardless of how far the touched offset is from the start, while still showing where the segment actually ends.
- The segment name and its current base address sit **above** each box, outside it, rather than inside as a header line.
- **DS's row table gained back a name column**, showing the label of any declared byte at that address (e.g. `msg`, `result`) beside its value.
- CS's box is narrower: assembly text truncates to 16 characters and the machine-code column to 3 bytes plus "…" for longer encodings, freeing width that a full 24-character/6-byte worst case would have needed.
- **Every dot path that reads or writes memory now finishes at the box it actually landed in.** Previously a data access always finished at the RAM panel's outer edge, which only lined up with whichever box happened to sit there — once SS and ES moved to their own column in 5.1.0, a stack or string access would have finished short of its real box. Path helpers (`pAddr`, `pCtrl`, `pData2EU`, `pData2Reg`, `pDataOut`) now take the target box's x explicitly.

### 5.1.0: The 8086's register flow fixed, and a real segment/memory map

**Prompts** (2026-09-18, exact times not in the saved record):
> I think the loading (dot flow) of AX, BX registers is not correct. Suppose, if I code MOV AX, 05h, then the dot should follow towards AX to load.
>
> Try to add the memory structure that I have given, also the registers along with the different segements.
>
> Recheck everything, flow, IP, Instruction registers. and rearrange components for better visibility.
>
> Try to show both SS, ES as CS, DS is shown. You can create vertical columns for them. Shrink the CS, DS a little and add the new column for SS, ES. […] 1, 2 can given to CS, DS with more vertical Space and 3, 4 to SS, ES for less vertical space. The 2, 4 may also have less horizontal space depending on the data. As machine code is written on the CS, it takes more space. You can remove the details tab for this I8086 and utilize the whole space.

**Changes**
- **Register write-back/read paths always pointed at AX's row.** `MOV BX, 5h` (and every instruction naming any register other than AX) animated the dot into AX's row in the register file, not the register that actually changed; a plain (non-ALU) write-back also reused the ALU's own outbound path instead of a real inbound one. Fixed with a `regRowY(r)` lookup and register-parameterized path functions, so the dot always lands on the true destination — verified for both an AX case and a BX case.
- **Reads and writes were always attributed to DS**, even when the real access was through SS (PUSH/POP/CALL/RET) or ES (MOVS/STOS/a segment-override operand). This meant a POP's memory read was silently skipped from the flow entirely whenever DS and SS didn't share the same base, and a PUSH's write was only ever shown by the "stack traffic" fallback, by accident of which branch it happened to fall into — not because the segment was identified correctly. Now each access is attributed to its real segment (an explicit override wins, then stack instructions → SS, string destinations → ES, else DS), and every one of the three segment windows scrolls and highlights independently.
- **The RAM panel is now a real 2x2 grid**, not just CS and DS stacked with SS/ES mentioned in passing: CS (top-left, wide, machine code needs the room) and DS (top-right, narrower) share the taller row band; SS (bottom-left) and ES (bottom-right) share a shorter one below. Each of the four now has its own live 64-byte address/value window (`dmem`/`smem`/`emem` in the per-step snapshot), so stepping through `PUSH AX` / `POP BX` now visibly scrolls the stack table to the right address near SP, and a string instruction would do the same for ES around DI.
- Added a **"Segments & memory" overlay** (next to "Instruction set" and "Write your own"): the CS/DS/SS/ES ↔ offset-register ↔ purpose reference table, plus a to-scale bar showing where this program's four segments currently sit across the 1 MB address space (00000h–FFFFFh) — drawn from the program's live CS/DS/SS/ES values, not a fixed illustration, so it also shows when segments overlap.
- The 8086 page already asks for the details panel to fold away via the existing `requestWide(true)` mechanism, so no separate change was needed there to make room for the wider RAM panel.

---

### 5.0.0: v5 — better mobile interactivity, and two 8086 fixes

**Prompts** (2026-09-18, exact times not in the saved record):
> Adjust every components for the better mobile view and interactivity.
>
> for the i8086, can you narrow the vertical bus line section and add SS, ES along with CS, DS?
>
> This might be a big change. So create v5 to maintain version.

**Changes**
- New version folder, copied from v4, since this batch (a mobile pass plus an 8086 change) was flagged as a bigger change than a normal in-place update.
- **Touch devices could not reach the right-click details card at all** — a touchscreen has no separate hover or right-click gesture — so a real gap in mobile interactivity, not previously called out in this log, is now fixed: pressing and holding a part (about half a second) opens the same concise-card-with-buttons a right-click does on a mouse; a normal short tap still opens the part as before. Verified this doesn't fire on an ordinary tap, and doesn't conflict with dragging a part.
- Checked the whole-computer page, the 8086 page, SSD and the motherboard at a phone width: the existing responsive layout (stage/panel stacking, the "Zoom diagram" magnifier, and the touch-target padding already applied to every control) already held up well; no further layout changes were needed there.
- On the 8086 page, the three vertical bus lines are now drawn closer together (the wires already reference this spacing symbolically, so nothing else needed to move).
- The RAM panel now also shows **"Stack segment · SS = …"** and **"Extra segment · ES = …"**, next to the existing Code and Data segment displays — the segment register box itself already listed all five registers (CS, DS, SS, ES, IP), but RAM's own header text only ever mentioned CS and DS.

**On keeping this file up to date.** Asked directly whether this log gets updated every time a change is made: honestly, no — it fell behind for a long stretch (see the note that used to sit here about 4.10.0–4.15.0, now folded into their own entries above). From this version on, every change is written up here as it's delivered, not batched up and reconstructed afterward.

---

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
