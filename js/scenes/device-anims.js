/* ==========================================================
   scenes/device-anims.js
   "How it works" animations for the inside views of the input and output
   devices (scenes/devices.js). Pressing "How it works" on one of those
   diagrams plays its steps one by one (engine.js): the parts a step is about
   stay lit while everything else fades, a note at the top says what is
   happening, and the step's effects are drawn over the diagram.

   A step:  {t: title, x: explanation (**bold** allowed), parts: [part ids to light],
             fx: F => SVG markup}
   F is the toolkit below. Its effects are SVG animations (SMIL) that start
   when the step starts; their coordinates are the diagram's own (1000 × 700).
   ========================================================== */

/* The effects toolkit. t0: the diagram's animation clock when the step starts. */
function DEVICE_FX(t0){
  let uid = 0;
  const at = d => `begin="${(t0 + (+d || 0)).toFixed(2)}s"`;
  const C = {sig: 'var(--signal)', pow: 'var(--power)', snd: 'var(--accent)', light: '#FFC83D', red: '#E5533D', green: '#3CB371', blue: '#3B82F6'};
  const col = c => C[c] || c || C.sig;
  const d = pts => 'M' + pts.map(p => p[0] + ' ' + p[1]).join('L');
  const range = n => Array.from({length: n}, (_, i) => i);
  const loop = 'repeatCount="indefinite"';
  const F = {
    /* dots travelling along a path, one after another, again and again */
    dots(pts, o = {}){
      const n = o.n || 3, dur = o.dur || 1.6, r = o.r || 6, c = col(o.c), dl = o.delay || 0;
      return range(n).map(i => `<circle r="${r}" class="dfx-dot" style="fill:${c}" opacity="0">` +
        `<set attributeName="opacity" to="1" ${at(dl + i * dur / n)}/>` +
        `<animateMotion path="${d(pts)}" dur="${dur}s" ${loop} ${at(dl + i * dur / n)}/></circle>`).join('');
    },
    /* a short run of 0s and 1s (or any text) riding along a path */
    bits(pts, text, o = {}){
      const n = o.n || 2, dur = o.dur || 2.2, dl = o.delay || 0;
      return range(n).map(i => `<text class="dfx-bits" text-anchor="middle" dy="4" opacity="0">${text}` +
        `<set attributeName="opacity" to="1" ${at(dl + i * dur / n)}/>` +
        `<animateMotion path="${d(pts)}" dur="${dur}s" ${loop} ${at(dl + i * dur / n)}/></text>`).join('');
    },
    /* sound (or radio) waves: arcs that move away from x,y and fade. dir: 1 right, -1 left; up: vertical */
    waves(x, y, o = {}){
      const n = o.n || 3, dur = o.dur || 1.5, len = o.len || 120, h = o.h || 46, dir = o.dir || 1, c = col(o.c || 'snd');
      const arc = o.up ? `M${x - h} ${y}Q${x} ${y - dir * 16} ${x + h} ${y}` : `M${x} ${y - h}Q${x + dir * 16} ${y} ${x} ${y + h}`;
      const to = o.up ? `0 ${-dir * len}` : `${dir * len} 0`;
      return range(n).map(i => `<path d="${arc}" class="dfx-wave" style="stroke:${c}" opacity="0">` +
        `<animateTransform attributeName="transform" type="translate" from="0 0" to="${to}" dur="${dur}s" ${loop} ${at(i * dur / n)}/>` +
        `<animate attributeName="opacity" values="0;.95;0" dur="${dur}s" ${loop} ${at(i * dur / n)}/></path>`).join('');
    },
    /* shake markup back and forth (a diaphragm, a cone, a motor) */
    shake(markup, dx, dy, dur){
      return `<g>${markup}<animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy};0 0;${-dx} ${-dy};0 0" dur="${dur || .16}s" ${loop} ${at()}/></g>`;
    },
    /* move markup through a list of offsets, e.g. '0 0;0 28;0 0' (a key going down and up) */
    move(markup, values, dur, o = {}){
      return `<g>${markup}<animateTransform attributeName="transform" type="translate" values="${values}" dur="${dur}s" ${o.once ? 'fill="freeze"' : loop} ${at(o.delay)}${o.times ? ` keyTimes="${o.times}"` : ''}/></g>`;
    },
    /* turn markup about cx,cy: all the way round, or swing between a1 and a2 degrees */
    spin(markup, cx, cy, dur, o = {}){
      const v = o.swing ? `values="${o.swing[0]} ${cx} ${cy};${o.swing[1]} ${cx} ${cy};${o.swing[0]} ${cx} ${cy}"` : `from="0 ${cx} ${cy}" to="${o.back ? -360 : 360} ${cx} ${cy}"`;
      return `<g>${markup}<animateTransform attributeName="transform" type="rotate" ${v} dur="${dur}s" ${loop} ${at()}/></g>`;
    },
    /* a softly pulsing highlight over a rectangle (a chip working, an LED on) */
    glow(x, y, w, h, o = {}){
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 6}" class="dfx-glow" style="fill:${col(o.c)}" opacity="0">` +
        `<animate attributeName="opacity" values="${o.lo ?? .08};${o.hi ?? .5};${o.lo ?? .08}" dur="${o.dur || 1.2}s" ${loop} ${at(o.delay)}/></rect>`;
    },
    ring(cx, cy, r, o = {}){
      return `<circle cx="${cx}" cy="${cy}" r="${r}" class="dfx-ring" style="stroke:${col(o.c)}" opacity="0">` +
        `<animate attributeName="r" values="${r};${r + (o.grow || 14)}" dur="${o.dur || 1.2}s" ${loop} ${at(o.delay)}/>` +
        `<animate attributeName="opacity" values=".9;0" dur="${o.dur || 1.2}s" ${loop} ${at(o.delay)}/></circle>`;
    },
    /* a travelling sine wave between x1 and x2 around y: an analog signal. amp: how big */
    sine(x1, x2, y, amp, o = {}){
      const L = o.wl || 40, id = 'dfxc' + (++uid) + Math.round(t0 * 100);
      let p = `M${x1 - L} ${y}`;
      for (let x = x1 - L, k = 0; x < x2; x += L / 2, k++) p += `Q${x + L / 4} ${y + (k % 2 ? amp : -amp) * 2} ${x + L / 2} ${y}`;   /* a quadratic peak reaches half its control height */
      return `<clipPath id="${id}"><rect x="${x1}" y="${y - amp - 4}" width="${x2 - x1}" height="${2 * amp + 8}"/></clipPath>` +
        `<g clip-path="url(#${id})"><path d="${p}" class="dfx-sine" style="stroke:${col(o.c)}">` +
        `<animateTransform attributeName="transform" type="translate" from="0 0" to="${L} 0" dur="${o.dur || .8}s" ${loop} ${at()}/></path></g>`;
    },
    /* a staircase: the same wave measured at fixed moments (samples) and rounded to whole steps */
    stairs(x1, x2, y, amp, o = {}){
      const n = o.n || 12, w = (x2 - x1) / n;
      let p = '', dots = '';
      for (let i = 0; i < n; i++){
        const v = Math.round(Math.sin(i / n * Math.PI * 2 * (o.cycles || 1)) * 3) / 3, yy = y - v * amp;
        p += (i ? `L${x1 + i * w} ${yy}` : `M${x1} ${yy}`) + `H${x1 + (i + 1) * w}`;
        dots += `<circle cx="${x1 + i * w}" cy="${yy}" r="3.5" style="fill:${col(o.c)}" opacity=".25"><animate attributeName="opacity" values=".25;1;.25" dur="${n * .12}s" ${loop} ${at(i * .12)}/></circle>`;
      }
      return `<path d="${p}" class="dfx-sine" style="stroke:${col(o.c)}"/>` + dots;
    },
    /* a small label that appears near the action */
    tag(x, y, text, o = {}){
      const w = text.length * 6.6 + 18, x0 = o.anchor === 'start' ? x : o.anchor === 'end' ? x - w : x - w / 2;
      return `<g class="dfx-tag" opacity="0"><set attributeName="opacity" to="1" ${at(o.delay ?? .3)}/>` +
        `<rect x="${x0}" y="${y - 13}" width="${w}" height="26" rx="13"/><text x="${x0 + w / 2}" y="${y + 4}" text-anchor="middle">${text}</text></g>`;
    },
    /* a list of shapes that light up one after another (pixels, ink drops, key rows) */
    seq(items, o = {}){
      const n = items.length, step = o.step || .15, dur = n * step + (o.hold || .6);
      return items.map((m, i) => `<g opacity="${o.from ?? 0}">${m}<animate attributeName="opacity" values="${o.from ?? 0};1;1;${o.from ?? 0}" keyTimes="0;${(i * step / dur).toFixed(3)};${((i * step + (o.hold || .6)) / dur).toFixed(3)};1" dur="${dur}s" ${loop} ${at()}/></g>`).join('');
    }
  };
  return F;
}

var DEVICE_ANIMS = {
  /* ---------------- microphone: recording a sound ---------------- */
  mic: {name: 'Recording a sound', steps: [
    {t: 'Sound reaches the microphone', parts: ['mic-capsule'],
     x: 'Sound is air pressure going up and down, hundreds or thousands of times a second. Those pressure waves reach the **capsule**.',
     fx: F => F.waves(70, 300, {n: 4, len: 150}) + F.tag(130, 470, 'air pressure waves')},
    {t: 'The diaphragm vibrates', parts: ['mic-capsule'],
     x: 'A thin **diaphragm** moves in and out with the pressure. The gap between it and the fixed **backplate** changes, so the capsule’s capacitance changes with the sound.',
     fx: F => F.waves(70, 300, {n: 3, len: 150}) +
       F.shake('<rect x="238" y="235" width="8" height="130" rx="3" class="dfx-solid" style="fill:var(--accent)"/>', 5, 0, .14) +
       F.tag(255, 500, 'gap changes → capacitance changes')},
    {t: 'A tiny voltage', parts: ['mic-capsule', 'mic-preamp'],
     x: 'That change becomes a very small **analog voltage**, only a few millivolts, that has the same shape as the sound wave.',
     fx: F => F.shake('<rect x="238" y="235" width="8" height="130" rx="3" class="dfx-solid" style="fill:var(--accent)"/>', 4, 0, .14) +
       F.sine(340, 410, 300, 5, {c: 'sig'}) + F.tag(375, 400, 'a few mV')},
    {t: 'The preamp makes it stronger', parts: ['mic-preamp'],
     x: 'The **preamplifier** multiplies the voltage about 100 to 1,000 times, so the signal is big enough to measure accurately.',
     fx: F => F.sine(340, 410, 300, 5) + F.sine(500, 560, 300, 18) + F.glow(410, 270, 90, 60) + F.tag(455, 235, '× 100 to 1,000')},
    {t: 'The ADC turns it into numbers', parts: ['mic-adc'],
     x: 'The **analog-to-digital converter** measures the voltage 48,000 times a second (a **sample**) and writes each measurement as a 16- or 24-bit number.',
     fx: F => F.sine(500, 560, 300, 18) + F.glow(560, 270, 90, 60) + F.stairs(555, 655, 420, 26, {n: 12}) +
       F.bits([[650, 300], [700, 300]], '1011', {n: 1, dur: 1.2}) + F.tag(605, 480, '48,000 samples a second')},
    {t: 'Digital audio goes out over USB', parts: ['mic-usb'],
     x: 'The **USB chip** packs the numbers into small packets, one every millisecond, and sends them down the cable to the computer as a **digital signal**: just 0s and 1s.',
     fx: F => F.bits([[650, 300], [700, 300]], '1011', {n: 1, dur: 1.2}) + F.glow(700, 270, 60, 60) +
       F.bits([[760, 300], [850, 300], [960, 300]], '0110 1011', {n: 2, dur: 1.8}) + F.tag(855, 380, 'to the computer')}
  ]},

  /* ---------------- speakers: playing a sound ---------------- */
  speakers: {name: 'Playing a sound', steps: [
    {t: 'Digital audio arrives', parts: ['speaker-dac'],
     x: 'The computer sends the sound as a stream of **numbers**, tens of thousands of them every second.',
     fx: F => F.bits([[0, 310], [56, 310], [130, 310]], '1101', {n: 2, dur: 1.5}) + F.tag(95, 395, 'digital audio')},
    {t: 'The DAC makes a voltage', parts: ['speaker-dac'],
     x: 'The **digital-to-analog converter** turns each number back into a voltage, and smooths the steps into a continuous **analog** wave.',
     fx: F => F.glow(130, 270, 100, 80) + F.stairs(135, 225, 440, 24, {n: 10}) + F.sine(230, 280, 310, 6) + F.tag(180, 480, 'numbers → smooth wave')},
    {t: 'The amplifier boosts it', parts: ['speaker-amp'],
     x: 'The **amplifier** makes the weak signal strong enough to move the speaker, using power from the USB port or a power adapter.',
     fx: F => F.sine(230, 280, 310, 6) + F.glow(280, 262, 110, 96) + F.sine(390, 460, 310, 20) + F.tag(335, 420, 'weak → strong')},
    {t: 'Current flows through the voice coil', parts: ['speaker-coil', 'speaker-magnet'],
     x: 'The strong current flows through the **voice coil**, turning it into an electromagnet whose north and south swap with the signal. The permanent **magnet** pushes and pulls it.',
     fx: F => F.dots([[460, 310], [590, 310], [590, 210], [765, 210], [765, 276]], {n: 5, dur: 1.4}) +
       F.glow(744, 280, 56, 64, {c: 'sig', hi: .6, dur: .3}) + F.tag(690, 450, 'push, pull, push…')},
    {t: 'The cone pushes the air', parts: ['speaker-cone', 'speaker-coil'],
     x: 'The coil is glued to the **cone**, so the cone moves in and out too. It pushes the air, making pressure waves: **sound** you can hear.',
     fx: F => F.shake('<path d="M800 282L905 190V430L800 338Z" class="dfx-solid" style="fill:var(--accent);opacity:.35"/>', 6, 0, .16) +
       F.waves(925, 310, {n: 4, len: 70, h: 90})}
  ]},

  /* ---------------- monitor: showing a picture ---------------- */
  monitor: {name: 'Showing a picture', steps: [
    {t: 'The video signal arrives', parts: ['monitor-ports'],
     x: 'The graphics card sends every frame through **HDMI** or **DisplayPort**: a fast stream of digital pixel colours, 60 to 240 frames a second.',
     fx: F => F.bits([[0, 430], [64, 430]], '1010', {n: 2, dur: 1.3}) + F.glow(64, 410, 46, 40) + F.tag(86, 575, 'pixel data')},
    {t: 'The controller board decodes it', parts: ['monitor-controller'],
     x: 'The **controller board** receives the signal, scales the picture to the panel’s resolution, and works out which voltage each pixel needs, frame after frame.',
     fx: F => F.dots([[86, 430], [120, 430], [135, 405]], {n: 2, dur: .9}) + F.glow(110, 340, 50, 130) + F.tag(20, 575, 'decode · scale · timing', {anchor: 'start'})},
    {t: 'The power board lights the backlight', parts: ['monitor-power', 'monitor-backlight'],
     x: 'The **power board** turns mains power into the low voltages the monitor needs, and drives the **LED backlight**, which makes all the light you see.',
     fx: F => F.dots([[160, 245], [230, 245]], {c: 'pow', n: 3, dur: .9}) + F.glow(230, 160, 56, 330, {c: 'light', lo: .15, hi: .6, dur: 1.6}) + F.tag(258, 115, 'white light')},
    {t: 'Light passes through the LCD layers', parts: ['monitor-backlight', 'monitor-panel'],
     x: 'The white light shines through a **polarizer**, then the **liquid crystal**. The controller sets a voltage on each subpixel, which twists the crystals to let more or less light through.',
     fx: F => F.glow(230, 160, 56, 330, {c: 'light', lo: .25, hi: .5, dur: 1.6}) +
       [250, 330, 410].map(y => F.dots([[290, y], [440, y]], {c: 'light', n: 2, dur: 1.1})).join('') +
       F.dots([[160, 470], [350, 470], [385, 470]], {n: 2, dur: 1.2}) +
       F.seq([200, 260, 320, 380].map(y => `<rect x="374" y="${y}" width="22" height="50" style="fill:var(--signal);opacity:.55"/>`), {step: .25}) +
       F.tag(385, 625, 'each subpixel: 0 to 255 brightness')},
    {t: 'Coloured light reaches your eyes', parts: ['monitor-panel'],
     x: 'Tiny **red**, **green** and **blue** filters colour each subpixel. Mixed together, millions of them make the picture you see.',
     fx: F => [['red', 250], ['green', 330], ['blue', 410]].map(([c, y]) => F.dots([[440, y], [700, 330]], {c, n: 3, dur: 1.4, r: 7})).join('') + F.tag(750, 440, 'red + green + blue')}
  ]},

  /* ---------------- keyboard: typing a key ---------------- */
  keyboard: {name: 'Typing a key', steps: [
    {t: 'You press a key', parts: ['kb-keys'],
     x: 'Pushing the **keycap** moves the plunger down and squeezes the spring. When you let go, the spring pushes it back up.',
     fx: F => F.move('<path d="M170 190h130l-16 62h-98z" class="dfx-solid" style="fill:var(--accent);opacity:.45"/><rect x="220" y="252" width="30" height="70" rx="3" class="dfx-solid" style="fill:var(--accent);opacity:.3"/>', '0 0;0 28;0 28;0 0;0 0', 2, {times: '0;.2;.55;.75;1'}) +
       F.tag(180, 470, 'about 4 mm of travel')},
    {t: 'The switch closes a circuit', parts: ['kb-keys', 'kb-matrix'],
     x: 'At the bottom of its travel the plunger presses two **contacts** together, and electricity can flow through that key’s switch.',
     fx: F => F.glow(372, 358, 86, 20, {c: 'sig', hi: .9, dur: .6}) + F.dots([[395, 368], [395, 386], [560, 386]], {n: 3, dur: 1}) + F.tag(415, 450, 'contacts closed')},
    {t: 'The controller scans the matrix', parts: ['kb-matrix', 'kb-controller'],
     x: 'The keys are wired in a grid of **rows** and **columns**. The controller turns on one row at a time and checks every column, about 1,000 times a second.',
     fx: F => F.seq([190, 230, 270, 310].map(y => `<rect x="556" y="${y - 7}" width="248" height="14" rx="7" style="fill:var(--signal);opacity:.45"/>`), {step: .35, hold: .35}) +
       F.ring(680, 270, 6, {c: 'sig'}) + F.glow(840, 318, 90, 60) + F.tag(680, 140, 'row by row, 1,000 times a second')},
    {t: 'Row and column give the key code', parts: ['kb-controller'],
     x: 'When a row is on and a column answers, the controller knows exactly which key it is, and looks up its **key code** (for example 0x04 for A).',
     fx: F => F.ring(680, 270, 6, {c: 'sig'}) + F.bits([[800, 270], [885, 270], [885, 318]], '0x04', {n: 2, dur: 1.4}) + F.glow(840, 318, 90, 60)},
    {t: 'A USB report goes to the computer', parts: ['kb-usb', 'kb-controller'],
     x: 'The controller sends a small **USB report** saying which keys are down. The computer reads it and your letter appears.',
     fx: F => F.bits([[885, 380], [885, 420], [885, 560]], '0000 0100', {n: 2, dur: 1.6}) + F.tag(760, 565, 'up to 1,000 reports a second')}
  ]},

  /* ---------------- mouse: moving and clicking ---------------- */
  mouse: {name: 'Moving and clicking', steps: [
    {t: 'An LED lights the desk', parts: ['mouse-sensor'],
     x: 'A red or infrared **LED** shines at a low angle onto the desk, so even a smooth surface shows its tiny bumps and fibres.',
     fx: F => F.glow(385, 416, 20, 20, {c: 'red', hi: .8, dur: .5, rx: 10}) + F.dots([[395, 434], [455, 472]], {c: 'red', n: 3, dur: .9, r: 5})},
    {t: 'The sensor takes pictures', parts: ['mouse-sensor'],
     x: 'The **optical sensor** is a tiny camera. It photographs the desk thousands of times a second and compares each picture with the last one.',
     fx: F => F.dots([[395, 434], [455, 472], [490, 445]], {c: 'red', n: 3, dur: 1.1, r: 5}) +
       F.seq([0, 1, 2, 3].map(i => `<rect x="${424 + i * 22}" y="421" width="18" height="18" rx="2" style="fill:var(--signal);opacity:.6"/>`), {step: .12, hold: .2}) +
       F.tag(465, 540, 'up to 10,000 pictures a second')},
    {t: 'Movement becomes numbers', parts: ['mouse-controller'],
     x: 'From how the pattern shifted between pictures, the sensor works out how far the mouse moved: **dx** and **dy**, in tiny steps.',
     fx: F => F.bits([[510, 420], [600, 404], [660, 376]], 'dx +3', {n: 2, dur: 1.4}) + F.glow(660, 357, 80, 38)},
    {t: 'Clicks and the wheel', parts: ['mouse-buttons', 'mouse-wheel'],
     x: 'Each **button** presses a small switch. The **scroll wheel** turns a slotted disc, and a sensor counts the slots as it goes by.',
     fx: F => F.move('<rect x="250" y="353" width="64" height="42" rx="5" class="dfx-solid" style="fill:var(--accent);opacity:.4"/>', '0 0;0 6;0 0', .8) +
       F.spin('<path class="dfx-spoke" d="M520 264V336M484 300H556M494 274L546 326M546 274L494 326"/>', 520, 300, 1.4) + F.glow(566, 282, 24, 36)},
    {t: 'A report goes to the computer', parts: ['mouse-controller'],
     x: 'The **controller** puts the movement, the buttons and the wheel into a few bytes and sends them to the computer, up to 1,000 times a second.',
     fx: F => F.bits([[740, 380], [770, 406], [960, 406]], '0011 0100', {n: 2, dur: 1.6})}
  ]},

  /* ---------------- joystick ---------------- */
  joystick: {name: 'Tilting the stick', steps: [
    {t: 'You tilt the stick', parts: ['joy-stick'],
     x: 'The stick pivots on a **gimbal** at its base, so it can tilt forwards, backwards, left and right. Springs bring it back to the centre.',
     fx: F => F.spin('<rect x="490" y="190" width="20" height="270" rx="6" class="dfx-solid" style="fill:var(--accent);opacity:.35"/><rect x="450" y="110" width="100" height="120" rx="34" class="dfx-solid" style="fill:var(--accent);opacity:.35"/>', 500, 456, 2.4, {swing: [-14, 14]})},
    {t: 'Sensors measure the angle', parts: ['joy-sensors'],
     x: 'Two **sensors** (potentiometers, or magnetic Hall-effect sensors) follow the gimbal. Each one turns its angle into a **voltage**: one for left–right, one for forwards–backwards.',
     fx: F => F.spin('<rect x="490" y="190" width="20" height="270" rx="6" class="dfx-solid" style="fill:var(--accent);opacity:.25"/>', 500, 456, 2.4, {swing: [-14, 14]}) +
       F.glow(290, 478, 64, 50, {dur: 1.2}) + F.glow(646, 478, 64, 50, {dur: 1.2, delay: .6}) + F.tag(322, 460, 'X: 0 to 3.3 V') + F.tag(678, 460, 'Y: 0 to 3.3 V')},
    {t: 'The controller reads the voltages', parts: ['joy-controller'],
     x: 'The **controller** measures both voltages many times a second with its analog-to-digital converter and turns them into position numbers.',
     fx: F => F.dots([[354, 512], [395, 512]], {n: 2, dur: .8}) + F.dots([[646, 512], [520, 513], [475, 513]], {n: 2, dur: .9}) +
       F.glow(395, 494, 80, 38) + F.tag(435, 470, 'X = 812, Y = 498')},
    {t: 'Buttons and the trigger', parts: ['joy-buttons'],
     x: 'The **trigger** and **buttons** are simple switches: pressed or not, one bit each.',
     fx: F => F.move('<rect x="424" y="150" width="28" height="64" rx="10" class="dfx-solid" style="fill:var(--signal);opacity:.6"/>', '0 0;6 0;0 0', .7) +
       F.ring(300, 430, 16, {c: 'sig'}) + F.ring(700, 430, 16, {c: 'sig', delay: .5})},
    {t: 'Sent to the computer', parts: ['joy-controller'],
     x: 'The controller sends the position and buttons to the computer over **USB**, many times a second, and the game moves your plane or car.',
     fx: F => F.bits([[475, 513], [520, 513], [520, 538], [735, 538], [735, 520], [960, 520]], '1100 1010', {n: 3, dur: 2.2})}
  ]},

  /* ---------------- game controller ---------------- */
  gamepad: {name: 'Playing a game', steps: [
    {t: 'You press buttons and move the sticks', parts: ['pad-buttons', 'pad-sticks'],
     x: 'Each **button** closes a small contact. Each **thumbstick** is two sensors, like a tiny joystick, that report how far it is pushed.',
     fx: F => F.ring(785, 265, 17, {c: 'sig'}) + F.ring(220, 270, 14, {c: 'sig', delay: .6}) +
       ['410', '590'].map(x => `<circle r="14" class="dfx-solid" style="fill:var(--accent);opacity:.55"><animateMotion path="M${x} 328a12 12 0 1 1 0 24a12 12 0 1 1 0 -24" dur="1.6s" repeatCount="indefinite"/></circle>`).join('')},
    {t: 'The controller reads every input', parts: ['pad-controller'],
     x: 'The **controller chip** reads every button and stick hundreds of times a second and packs them into one small report.',
     fx: F => F.dots([[265, 300], [300, 300], [300, 237], [470, 237]], {n: 2, dur: 1.2}) + F.dots([[733, 300], [700, 300], [700, 237], [530, 237]], {n: 2, dur: 1.2}) +
       F.dots([[410, 300], [470, 255]], {n: 2, dur: .9}) + F.dots([[590, 300], [530, 255]], {n: 2, dur: .9}) + F.glow(470, 215, 60, 44)},
    {t: 'The report is sent to the console or PC', parts: ['pad-controller'],
     x: 'The report goes out by **Bluetooth** or a 2.4 GHz radio (or a USB cable), about 125 to 1,000 times a second.',
     fx: F => F.waves(500, 160, {up: true, n: 3, len: 90, h: 40, c: 'sig'}) + F.tag(620, 115, 'radio or USB', {anchor: 'start'})},
    {t: 'The game answers: rumble!', parts: ['pad-rumble'],
     x: 'The game can send a message back. The controller then spins the **rumble motors**: each turns an off-centre weight, which shakes the controller in your hands.',
     fx: F => F.waves(500, 110, {up: true, dir: -1, n: 3, len: 50, h: 40, c: 'sig'}) +
       F.dots([[470, 259], [200, 411]], {c: 'pow', n: 2, dur: 1}) + F.dots([[530, 259], [800, 411]], {c: 'pow', n: 2, dur: 1}) +
       F.shake(F.spin('<circle cx="178" cy="402" r="6" class="dfx-solid" style="fill:var(--signal)"/>', 178, 411, .25), 3, 2, .1) +
       F.shake(F.spin('<circle cx="822" cy="402" r="6" class="dfx-solid" style="fill:var(--signal)"/>', 822, 411, .25), 3, 2, .1)}
  ]},

  /* ---------------- printer: printing a page ---------------- */
  printer: {name: 'Printing a page', steps: [
    {t: 'The page arrives', parts: ['printer-board'],
     x: 'The computer sends the page to the **controller board**, which turns it into rows of dots: where each colour of ink should go.',
     fx: F => F.bits([[0, 525], [238, 525]], '0110', {n: 2, dur: 1.4}) + F.glow(238, 330, 36, 240) + F.tag(120, 490, 'page data')},
    {t: 'The rollers feed the paper', parts: ['printer-rollers'],
     x: 'A motor turns the **rollers**, which pull the paper in and move it forward a tiny, exact step after each pass of the print head.',
     fx: F => ['M290 304H690', 'M290 600H690'].map(p => `<path d="${p}" class="dfx-roll"><animate attributeName="stroke-dashoffset" from="0" to="-24" dur=".5s" repeatCount="indefinite"/></path>`).join('') +
       F.move('<path d="M330 325H650M330 349H650M330 373H650" class="dfx-ink"/>', '0 30;0 0', 2)},
    {t: 'The carriage slides across', parts: ['printer-carriage'],
     x: 'A **belt** and motor slide the **carriage**, carrying the ink cartridges and print head, back and forth across the page.',
     fx: F => F.move('<rect x="440" y="180" width="100" height="64" rx="8" class="dfx-solid" style="fill:var(--accent);opacity:.35"/>', '-170 0;190 0;-170 0', 3) +
       F.spin('<path class="dfx-spoke" d="M738 220V244M726 232H750"/>', 738, 232, .6)},
    {t: 'Nozzles fire tiny drops of ink', parts: ['printer-cartridge', 'printer-carriage'],
     x: 'The print head has hundreds of tiny **nozzles**. Heat or a piezo crystal fires drops of a few picolitres at exactly the right moments as the head passes.',
     fx: F => F.move('<rect x="440" y="180" width="100" height="64" rx="8" class="dfx-solid" style="fill:var(--accent);opacity:.3"/>', '-170 0;190 0;-170 0', 3) +
       F.seq(Array.from({length: 16}, (_, i) => `<circle cx="${320 + i * 22}" cy="${440 + (i % 3) * 8}" r="5" style="fill:${['#20B5E6', '#E4419B', '#F6D523', '#2B2B2B'][i % 4]}"/>`), {step: .09, hold: 1}) +
       F.tag(490, 510, 'drops of a few picolitres')},
    {t: 'Line by line, the page is printed', parts: ['printer-rollers', 'printer-cartridge'],
     x: 'Pass by pass, the head prints a strip, the rollers move the paper on, and the next strip follows, until the whole page is done.',
     fx: F => F.seq([421, 445, 469, 493, 517].map(y => `<path d="M330 ${y}H${y === 517 ? 520 : 650}" class="dfx-ink"/>`), {step: .45, hold: 1.5, from: 0})}
  ]},

  /* ---------------- webcam: taking a picture ---------------- */
  webcam: {name: 'Capturing video', steps: [
    {t: 'Light from the scene enters', parts: ['webcam-lens'],
     x: 'Light bounces off you and your room, and some of it enters the camera’s **lens**.',
     fx: F => [[[90, 250], [260, 290]], [[90, 330], [260, 330]], [[90, 410], [260, 370]]].map(p => F.dots(p, {c: 'light', n: 3, dur: 1})).join('')},
    {t: 'The lens focuses it on the sensor', parts: ['webcam-lens', 'webcam-sensor'],
     x: 'The **lens** bends the light so it forms a sharp, tiny image on the sensor. A filter removes infrared light, which would spoil the colours.',
     fx: F => [[[90, 250], [260, 290], [420, 330]], [[90, 330], [420, 330]], [[90, 410], [260, 370], [420, 330]]].map(p => F.dots(p, {c: 'light', n: 3, dur: 1.3})).join('') +
       F.glow(385, 250, 8, 160, {c: 'red', hi: .6})},
    {t: 'Millions of pixels measure the light', parts: ['webcam-sensor'],
     x: 'The **image sensor** has millions of pixels. Each one collects light for a moment and turns it into a charge: the brighter the light, the bigger the number.',
     fx: F => F.seq([280, 300, 320, 340, 360].map((y, i) => `<rect x="426" y="${y}" width="18" height="10" rx="1" style="fill:#FFF3B0;opacity:${[.9, .5, 1, .35, .75][i]}"/>`), {step: .2, hold: .8}) +
       F.tag(433, 450, '2 million pixels × 30 frames a second')},
    {t: 'The image processor makes a picture', parts: ['webcam-isp'],
     x: 'The **image processor** turns the raw pixel values into a picture: it works out the colours, sets the brightness, reduces noise, and compresses each frame.',
     fx: F => F.bits([[475, 330], [520, 330]], '0101', {n: 2, dur: .9}) + F.glow(520, 280, 80, 100) + F.tag(560, 440, 'colour · exposure · compression')},
    {t: 'Video goes to the computer, and the LED shows it is on', parts: ['webcam-usb'],
     x: 'The **USB chip** sends the video frames to the computer. The **LED** lights whenever the camera is on.',
     fx: F => F.bits([[600, 330], [650, 330]], '0101', {n: 2, dur: .9}) + F.bits([[730, 330], [960, 330]], '1001 0110', {n: 2, dur: 1.6}) +
       F.glow(216, 226, 20, 20, {c: 'green', hi: .9, dur: .8, rx: 10})}
  ]}
};

/* The sounds of each step (sfx.js), in step order. 'say:' is a real voice (the
   browser's speech voices); 'loop:' repeats until the next step; 'name@0.5'
   plays after half a second. */
(function(){
  const SOUNDS = {
    mic:      [['say:Hello! Can you hear me? This is a test recording.'], ['say-soft:Hello! Can you hear me?'], ['loop:tone-weak'],
               ['loop:tone-strong'], ['loop:steps'], ['loop:bits']],
    speakers: [['loop:bits'], ['loop:steps', 'loop:tone-weak'], ['loop:tone-strong'], ['loop:buzz'],
               ['say-loud:Hello! This sound is coming out of the speaker.']],
    monitor:  [['loop:bits'], ['loop:bits'], ['zap', 'loop:hum'], ['loop:hum'], []],
    keyboard: [['loop:keys'], ['clack', 'blip@0.35'], ['loop:scan'], ['blip', 'loop:bits'], ['loop:bits']],
    mouse:    [[], ['shutter', 'loop:scan'], ['loop:bits'], ['loop:clicks'], ['loop:bits']],
    joystick: [['whoosh'], ['loop:tone-weak'], ['loop:bits'], ['loop:clicks'], ['loop:bits']],
    gamepad:  [['loop:clicks'], ['loop:bits'], ['loop:radio'], ['chirp', 'loop:rumble']],
    printer:  [['loop:bits'], ['loop:roller'], ['loop:motor'], ['loop:motor', 'loop:drops'], ['loop:roller', 'loop:drops']],
    webcam:   [['whoosh'], ['whoosh'], ['shutter', 'loop:scan'], ['loop:bits'], ['loop:bits', 'ding@0.3']]
  };
  Object.keys(SOUNDS).forEach(k => SOUNDS[k].forEach((s, i) => { if (DEVICE_ANIMS[k].steps[i]) DEVICE_ANIMS[k].steps[i].sfx = s; }));
})();
