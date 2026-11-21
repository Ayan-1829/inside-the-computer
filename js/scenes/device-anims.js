/* ==========================================================
   scenes/device-anims.js
   "How it works" animations for the inside views of the input and output
   devices and the power button (scenes/devices.js), for the motherboard,
   RAM, graphics card, SSD, hard drive, power supply and cooling (scenes/hardware.js)
   and for the CPU (scenes/cpu.js); each is
   keyed by its scene's name). Pressing "How it works" on one of those
   diagrams plays its steps one by one (engine.js): the parts a step is about
   stay lit while everything else fades, a note at the top says what is
   happening, and the step's effects are drawn over the diagram.

   A step:  {t: a short name for the step (not shown), x: the caption, one or two lines that
             say what happens (**bold** allowed; also what the narrator reads), parts: [part ids to light],
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
      const w = text.length * 8.3 + 24, x0 = o.anchor === 'start' ? x : o.anchor === 'end' ? x - w : x - w / 2;
      return `<g class="dfx-tag" opacity="0"><set attributeName="opacity" to="1" ${at(o.delay ?? .3)}/>` +
        `<rect x="${x0}" y="${y - 16}" width="${w}" height="32" rx="16"/><text x="${x0 + w / 2}" y="${y + 5.5}" text-anchor="middle">${text}</text></g>`;
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
     x: 'Sound is air pressure moving back and forth. These pressure waves reach the **capsule**.',
     fx: F => F.waves(70, 300, {n: 4, len: 150}) + F.tag(130, 470, 'air pressure waves')},
    {t: 'The diaphragm vibrates', parts: ['mic-capsule'],
     x: 'The **diaphragm** vibrates with the sound, changing its gap to the **backplate**, and so the capsule’s capacitance.',
     fx: F => F.waves(70, 300, {n: 3, len: 150}) +
       F.shake('<rect x="238" y="235" width="8" height="130" rx="3" class="dfx-solid" style="fill:var(--accent)"/>', 5, 0, .14) +
       F.tag(255, 500, 'gap changes → capacitance changes')},
    {t: 'A tiny voltage', parts: ['mic-capsule', 'mic-preamp'],
     x: 'That change becomes a tiny **analog voltage**, a few millivolts, shaped like the sound wave.',
     fx: F => F.shake('<rect x="238" y="235" width="8" height="130" rx="3" class="dfx-solid" style="fill:var(--accent)"/>', 4, 0, .14) +
       F.sine(340, 410, 300, 5, {c: 'sig'}) + F.tag(375, 400, 'a few mV')},
    {t: 'The preamp makes it stronger', parts: ['mic-preamp'],
     x: 'The **preamplifier** makes the voltage about 100 to 1,000 times bigger, so it can be measured.',
     fx: F => F.sine(340, 410, 300, 5) + F.sine(500, 560, 300, 18) + F.glow(410, 270, 90, 60) + F.tag(455, 400, '× 100 to 1,000')},
    {t: 'The ADC turns it into numbers', parts: ['mic-adc'],
     x: 'The **ADC** measures the voltage 48,000 times a second and turns each **sample** into a number.',
     fx: F => F.sine(500, 560, 300, 18) + F.glow(560, 270, 90, 60) + F.stairs(555, 655, 420, 26, {n: 12}) +
       F.bits([[650, 300], [700, 300]], '1011', {n: 1, dur: 1.2}) + F.tag(605, 480, '48,000 samples a second')},
    {t: 'Digital audio goes out over USB', parts: ['mic-usb'],
     x: 'The **USB chip** packs the numbers into packets and sends them to the computer as 0s and 1s.',
     fx: F => F.bits([[650, 300], [700, 300]], '1011', {n: 1, dur: 1.2}) + F.glow(700, 270, 60, 60) +
       F.bits([[760, 300], [850, 300], [960, 300]], '0110 1011', {n: 2, dur: 1.8}) + F.tag(855, 380, 'to the computer')}
  ]},

  /* ---------------- speakers: playing a sound ---------------- */
  speakers: {name: 'Playing a sound', steps: [
    {t: 'Digital audio arrives', parts: ['speaker-dac'],
     x: 'The computer sends the sound as a stream of **numbers**, tens of thousands every second.',
     fx: F => F.bits([[0, 310], [56, 310], [130, 310]], '1101', {n: 2, dur: 1.5}) + F.tag(95, 425, 'digital audio')},
    {t: 'The DAC makes a voltage', parts: ['speaker-dac'],
     x: 'The **DAC** turns the numbers back into a smooth **analog** voltage wave.',
     fx: F => F.glow(130, 270, 100, 80) + F.stairs(135, 225, 440, 24, {n: 10}) + F.sine(230, 280, 310, 6) + F.tag(180, 480, 'numbers → smooth wave')},
    {t: 'The amplifier boosts it', parts: ['speaker-amp'],
     x: 'The **amplifier** boosts this weak signal until it is strong enough to move the speaker.',
     fx: F => F.sine(230, 280, 310, 6) + F.glow(280, 262, 110, 96) + F.sine(390, 460, 310, 20) + F.tag(335, 420, 'weak → strong')},
    {t: 'Current flows through the voice coil', parts: ['speaker-coil', 'speaker-magnet'],
     x: 'The current turns the **voice coil** into an electromagnet, and the **magnet** pushes and pulls it.',
     fx: F => F.dots([[460, 310], [590, 310], [590, 210], [765, 210], [765, 276]], {n: 5, dur: 1.4}) +
       F.glow(744, 280, 56, 64, {c: 'sig', hi: .6, dur: .3}) + F.tag(690, 450, 'push, pull, push…')},
    {t: 'The cone pushes the air', parts: ['speaker-cone', 'speaker-coil'],
     x: 'The coil moves the **cone**, which pushes the air and makes the **sound** you hear.',
     fx: F => F.shake('<path d="M800 282L905 190V430L800 338Z" class="dfx-solid" style="fill:var(--accent);opacity:.35"/>', 6, 0, .16) +
       F.waves(925, 310, {n: 4, len: 70, h: 90})}
  ]},

  /* ---------------- monitor: showing a picture ---------------- */
  monitor: {name: 'Showing a picture', steps: [
    {t: 'The video signal arrives', parts: ['monitor-ports'],
     x: 'The graphics card sends each frame through **HDMI** or **DisplayPort**, 60 to 240 times a second.',
     fx: F => F.bits([[0, 430], [64, 430]], '1010', {n: 2, dur: 1.3}) + F.glow(64, 410, 46, 40) + F.tag(86, 575, 'pixel data')},
    {t: 'The controller board decodes it', parts: ['monitor-controller'],
     x: 'The **controller board** decodes the signal, scales it, and works out the voltage for every pixel.',
     fx: F => F.dots([[86, 430], [120, 430], [135, 405]], {n: 2, dur: .9}) + F.glow(110, 340, 50, 130)},
    {t: 'The power board lights the backlight', parts: ['monitor-power', 'monitor-backlight'],
     x: 'The **power board** supplies the low voltages and drives the **LED backlight**, the source of all the light.',
     fx: F => F.dots([[160, 245], [230, 245]], {c: 'pow', n: 3, dur: .9}) + F.glow(230, 160, 56, 330, {c: 'light', lo: .15, hi: .6, dur: 1.6}) + F.tag(258, 115, 'white light')},
    {t: 'Light passes through the LCD layers', parts: ['monitor-backlight', 'monitor-panel'],
     x: 'The light passes through the **liquid crystal**, which lets more or less of it through at each subpixel.',
     fx: F => F.glow(230, 160, 56, 330, {c: 'light', lo: .25, hi: .5, dur: 1.6}) +
       [250, 330, 410].map(y => F.dots([[290, y], [440, y]], {c: 'light', n: 2, dur: 1.1})).join('') +
       F.dots([[160, 470], [350, 470], [385, 470]], {n: 2, dur: 1.2}) +
       F.seq([200, 260, 320, 380].map(y => `<rect x="374" y="${y}" width="22" height="50" style="fill:var(--signal);opacity:.55"/>`), {step: .25}) +
       F.tag(385, 652, 'each subpixel: 0 to 255 brightness')},
    {t: 'Coloured light reaches your eyes', parts: ['monitor-panel'],
     x: '**Red**, **green** and **blue** filters colour the subpixels, and together they make the picture you see.',
     fx: F => [['red', 250], ['green', 330], ['blue', 410]].map(([c, y]) => F.dots([[440, y], [700, 330]], {c, n: 3, dur: 1.4, r: 7})).join('') + F.tag(750, 440, 'red + green + blue')}
  ]},

  /* ---------------- keyboard: typing a key ---------------- */
  keyboard: {name: 'Typing a key', steps: [
    {t: 'You press a key', parts: ['kb-keys'],
     x: 'Pressing the **keycap** pushes the plunger down against the spring, which pushes it back up.',
     fx: F => F.move('<path d="M170 190h130l-16 62h-98z" class="dfx-solid" style="fill:var(--accent);opacity:.45"/><rect x="220" y="252" width="30" height="70" rx="3" class="dfx-solid" style="fill:var(--accent);opacity:.3"/>', '0 0;0 28;0 28;0 0;0 0', 2, {times: '0;.2;.55;.75;1'}) +
       F.tag(180, 470, 'about 4 mm of travel')},
    {t: 'The switch closes a circuit', parts: ['kb-keys', 'kb-matrix'],
     x: 'At the bottom, the plunger presses two **contacts** together and closes the key’s circuit.',
     fx: F => F.glow(372, 358, 86, 20, {c: 'sig', hi: .9, dur: .6}) + F.dots([[395, 368], [395, 386], [560, 386]], {n: 3, dur: 1}) + F.tag(490, 458, 'contacts closed')},
    {t: 'The controller scans the matrix', parts: ['kb-matrix', 'kb-controller'],
     x: 'The controller checks the grid of **rows** and **columns** about 1,000 times a second.',
     fx: F => F.seq([190, 230, 270, 310].map(y => `<rect x="556" y="${y - 7}" width="248" height="14" rx="7" style="fill:var(--signal);opacity:.45"/>`), {step: .35, hold: .35}) +
       F.ring(680, 270, 6, {c: 'sig'}) + F.glow(840, 318, 90, 60) + F.tag(680, 140, 'row by row, 1,000 times a second')},
    {t: 'Row and column give the key code', parts: ['kb-controller'],
     x: 'The row and column that connect tell the controller which key it is, and its **key code**.',
     fx: F => F.ring(680, 270, 6, {c: 'sig'}) + F.bits([[800, 270], [885, 270], [885, 318]], '0x04', {n: 2, dur: 1.4}) + F.glow(840, 318, 90, 60)},
    {t: 'A USB report goes to the computer', parts: ['kb-usb', 'kb-controller'],
     x: 'The controller sends a **USB report** of the pressed keys, and your letter appears.',
     fx: F => F.bits([[885, 380], [885, 420], [885, 560]], '0000 0100', {n: 2, dur: 1.6}) + F.tag(760, 565, 'up to 1,000 reports a second')}
  ]},

  /* ---------------- mouse: moving and clicking ---------------- */
  mouse: {name: 'Moving and clicking', steps: [
    {t: 'An LED lights the desk', parts: ['mouse-sensor'],
     x: 'An **LED** shines at a low angle onto the desk, showing its tiny bumps and fibres.',
     fx: F => F.glow(385, 416, 20, 20, {c: 'red', hi: .8, dur: .5, rx: 10}) + F.dots([[395, 434], [455, 472]], {c: 'red', n: 3, dur: .9, r: 5})},
    {t: 'The sensor takes pictures', parts: ['mouse-sensor'],
     x: 'The **optical sensor**, a tiny camera, photographs the desk thousands of times a second.',
     fx: F => F.dots([[395, 434], [455, 472], [490, 445]], {c: 'red', n: 3, dur: 1.1, r: 5}) +
       F.seq([0, 1, 2, 3].map(i => `<rect x="${424 + i * 22}" y="421" width="18" height="18" rx="2" style="fill:var(--signal);opacity:.6"/>`), {step: .12, hold: .2}) +
       F.tag(465, 572, 'up to 10,000 pictures a second')},
    {t: 'Movement becomes numbers', parts: ['mouse-controller'],
     x: 'By comparing the pictures, the sensor works out how far the mouse moved: **dx** and **dy**.',
     fx: F => F.bits([[510, 420], [600, 404], [660, 376]], 'dx +3', {n: 2, dur: 1.4}) + F.glow(660, 357, 80, 38)},
    {t: 'Clicks and the wheel', parts: ['mouse-buttons', 'mouse-wheel'],
     x: 'Each **button** presses a small switch, and a sensor counts the turns of the **scroll wheel**.',
     fx: F => F.move('<rect x="250" y="353" width="64" height="42" rx="5" class="dfx-solid" style="fill:var(--accent);opacity:.4"/>', '0 0;0 6;0 0', .8) +
       F.spin('<path class="dfx-spoke" d="M520 264V336M484 300H556M494 274L546 326M546 274L494 326"/>', 520, 300, 1.4) + F.glow(566, 282, 24, 36)},
    {t: 'A report goes to the computer', parts: ['mouse-controller'],
     x: 'The **controller** sends the movement, buttons and wheel to the computer, up to 1,000 times a second.',
     fx: F => F.bits([[740, 380], [770, 406], [960, 406]], '0011 0100', {n: 2, dur: 1.6})}
  ]},

  /* ---------------- joystick ---------------- */
  joystick: {name: 'Tilting the stick', steps: [
    {t: 'You tilt the stick', parts: ['joy-stick'],
     x: 'The stick tilts on a **gimbal** in any direction, and springs bring it back to the centre.',
     fx: F => F.spin('<rect x="490" y="190" width="20" height="270" rx="6" class="dfx-solid" style="fill:var(--accent);opacity:.35"/><rect x="450" y="110" width="100" height="120" rx="34" class="dfx-solid" style="fill:var(--accent);opacity:.35"/>', 500, 456, 2.4, {swing: [-14, 14]})},
    {t: 'Sensors measure the angle', parts: ['joy-sensors'],
     x: 'Two **sensors** turn the stick’s angle into **voltages**: one for left–right, one for forwards–backwards.',
     fx: F => F.spin('<rect x="490" y="190" width="20" height="270" rx="6" class="dfx-solid" style="fill:var(--accent);opacity:.25"/>', 500, 456, 2.4, {swing: [-14, 14]}) +
       F.glow(290, 478, 64, 50, {dur: 1.2}) + F.glow(646, 478, 64, 50, {dur: 1.2, delay: .6}) + F.tag(322, 625, 'X: 0 to 3.3 V') + F.tag(678, 625, 'Y: 0 to 3.3 V')},
    {t: 'The controller reads the voltages', parts: ['joy-controller'],
     x: 'The **controller** measures both voltages and turns them into position numbers.',
     fx: F => F.dots([[354, 512], [395, 512]], {n: 2, dur: .8}) + F.dots([[646, 512], [520, 513], [475, 513]], {n: 2, dur: .9}) +
       F.glow(395, 494, 80, 38) + F.tag(450, 625, 'X = 812, Y = 498')},
    {t: 'Buttons and the trigger', parts: ['joy-buttons'],
     x: 'The **trigger** and **buttons** are simple switches: pressed or not, one bit each.',
     fx: F => F.move('<rect x="424" y="150" width="28" height="64" rx="10" class="dfx-solid" style="fill:var(--signal);opacity:.6"/>', '0 0;6 0;0 0', .7) +
       F.ring(300, 430, 16, {c: 'sig'}) + F.ring(700, 430, 16, {c: 'sig', delay: .5})},
    {t: 'Sent to the computer', parts: ['joy-controller'],
     x: 'The position and buttons go to the computer over **USB**, and the game responds.',
     fx: F => F.bits([[475, 513], [520, 513], [520, 538], [735, 538], [735, 520], [960, 520]], '1100 1010', {n: 3, dur: 2.2})}
  ]},

  /* ---------------- game controller ---------------- */
  gamepad: {name: 'Playing a game', steps: [
    {t: 'You press buttons and move the sticks', parts: ['pad-buttons', 'pad-sticks'],
     x: 'Each **button** closes a contact, and each **thumbstick** reports how far it is pushed.',
     fx: F => F.ring(785, 265, 17, {c: 'sig'}) + F.ring(220, 270, 14, {c: 'sig', delay: .6}) +
       ['410', '590'].map(x => `<circle r="14" class="dfx-solid" style="fill:var(--accent);opacity:.55"><animateMotion path="M${x} 328a12 12 0 1 1 0 24a12 12 0 1 1 0 -24" dur="1.6s" repeatCount="indefinite"/></circle>`).join('')},
    {t: 'The controller reads every input', parts: ['pad-controller'],
     x: 'The **controller chip** reads every input hundreds of times a second into one small report.',
     fx: F => F.dots([[265, 300], [300, 300], [300, 237], [470, 237]], {n: 2, dur: 1.2}) + F.dots([[733, 300], [700, 300], [700, 237], [530, 237]], {n: 2, dur: 1.2}) +
       F.dots([[410, 300], [470, 255]], {n: 2, dur: .9}) + F.dots([[590, 300], [530, 255]], {n: 2, dur: .9}) + F.glow(470, 215, 60, 44)},
    {t: 'The report is sent to the console or PC', parts: ['pad-controller'],
     x: 'The report goes to the console or PC by **Bluetooth**, radio or a USB cable.',
     fx: F => F.waves(500, 160, {up: true, n: 3, len: 90, h: 40, c: 'sig'}) + F.tag(620, 115, 'radio or USB', {anchor: 'start'})},
    {t: 'The game answers: rumble!', parts: ['pad-rumble'],
     x: 'The game can reply: the **rumble motors** spin off-centre weights and shake the controller.',
     fx: F => F.waves(500, 110, {up: true, dir: -1, n: 3, len: 50, h: 40, c: 'sig'}) +
       F.dots([[470, 259], [200, 411]], {c: 'pow', n: 2, dur: 1}) + F.dots([[530, 259], [800, 411]], {c: 'pow', n: 2, dur: 1}) +
       F.shake(F.spin('<circle cx="178" cy="402" r="6" class="dfx-solid" style="fill:var(--signal)"/>', 178, 411, .25), 3, 2, .1) +
       F.shake(F.spin('<circle cx="822" cy="402" r="6" class="dfx-solid" style="fill:var(--signal)"/>', 822, 411, .25), 3, 2, .1)}
  ]},

  /* ---------------- printer: printing a page ---------------- */
  printer: {name: 'Printing a page', steps: [
    {t: 'The page arrives', parts: ['printer-board'],
     x: 'The **controller board** turns the page from the computer into rows of ink dots.',
     fx: F => F.bits([[0, 525], [238, 525]], '0110', {n: 2, dur: 1.4}) + F.glow(238, 330, 36, 240) + F.tag(120, 490, 'page data')},
    {t: 'The rollers feed the paper', parts: ['printer-rollers'],
     x: 'The **rollers** pull the paper in and move it forward one exact step at a time.',
     fx: F => ['M290 304H690', 'M290 600H690'].map(p => `<path d="${p}" class="dfx-roll"><animate attributeName="stroke-dashoffset" from="0" to="-24" dur=".5s" repeatCount="indefinite"/></path>`).join('') +
       F.move('<path d="M330 325H650M330 349H650M330 373H650" class="dfx-ink"/>', '0 30;0 0', 2)},
    {t: 'The carriage slides across', parts: ['printer-carriage'],
     x: 'A **belt** and motor slide the **carriage**, with its ink cartridges, across the page.',
     fx: F => F.move('<rect x="440" y="180" width="100" height="64" rx="8" class="dfx-solid" style="fill:var(--accent);opacity:.35"/>', '-170 0;190 0;-170 0', 3) +
       F.spin('<path class="dfx-spoke" d="M738 220V244M726 232H750"/>', 738, 232, .6)},
    {t: 'Nozzles fire tiny drops of ink', parts: ['printer-cartridge', 'printer-carriage'],
     x: 'Tiny **nozzles** in the print head fire drops of ink at exactly the right moments.',
     fx: F => F.move('<rect x="440" y="180" width="100" height="64" rx="8" class="dfx-solid" style="fill:var(--accent);opacity:.3"/>', '-170 0;190 0;-170 0', 3) +
       F.seq(Array.from({length: 16}, (_, i) => `<circle cx="${320 + i * 22}" cy="${440 + (i % 3) * 8}" r="5" style="fill:${['#20B5E6', '#E4419B', '#F6D523', '#2B2B2B'][i % 4]}"/>`), {step: .09, hold: 1}) +
       F.tag(785, 450, 'drops of a few picolitres', {anchor: 'start'})},
    {t: 'Line by line, the page is printed', parts: ['printer-rollers', 'printer-cartridge'],
     x: 'Strip by strip, the head prints and the paper moves on, until the page is done.',
     fx: F => F.seq([421, 445, 469, 493, 517].map(y => `<path d="M330 ${y}H${y === 517 ? 520 : 650}" class="dfx-ink"/>`), {step: .45, hold: 1.5, from: 0})}
  ]},

  /* ---------------- webcam: taking a picture ---------------- */
  webcam: {name: 'Capturing video', steps: [
    {t: 'Light from the scene enters', parts: ['webcam-lens'],
     x: 'Light from you and your room enters the camera’s **lens**.',
     fx: F => [[[90, 250], [260, 290]], [[90, 330], [260, 330]], [[90, 410], [260, 370]]].map(p => F.dots(p, {c: 'light', n: 3, dur: 1})).join('')},
    {t: 'The lens focuses it on the sensor', parts: ['webcam-lens', 'webcam-sensor'],
     x: 'The **lens** focuses the light into a sharp, tiny image on the sensor.',
     fx: F => [[[90, 250], [260, 290], [420, 330]], [[90, 330], [420, 330]], [[90, 410], [260, 370], [420, 330]]].map(p => F.dots(p, {c: 'light', n: 3, dur: 1.3})).join('') +
       F.glow(385, 250, 8, 160, {c: 'red', hi: .6})},
    {t: 'Millions of pixels measure the light', parts: ['webcam-sensor'],
     x: 'Millions of pixels on the **image sensor** turn the light into numbers: the brighter, the bigger.',
     fx: F => F.seq([280, 300, 320, 340, 360].map((y, i) => `<rect x="426" y="${y}" width="18" height="10" rx="1" style="fill:#FFF3B0;opacity:${[.9, .5, 1, .35, .75][i]}"/>`), {step: .2, hold: .8}) +
       F.tag(433, 505, '2 million pixels × 30 frames a second')},
    {t: 'The image processor makes a picture', parts: ['webcam-isp'],
     x: 'The **image processor** turns the raw values into colour video and compresses each frame.',
     fx: F => F.bits([[475, 330], [520, 330]], '0101', {n: 2, dur: .9}) + F.glow(520, 280, 80, 100) + F.tag(560, 505, 'colour · exposure · compression')},
    {t: 'Video goes to the computer, and the LED shows it is on', parts: ['webcam-usb'],
     x: 'The **USB chip** sends the video to the computer, and the **LED** shows the camera is on.',
     fx: F => F.bits([[600, 330], [650, 330]], '0101', {n: 2, dur: .9}) + F.bits([[730, 330], [960, 330]], '1001 0110', {n: 2, dur: 1.6}) +
       F.glow(216, 226, 20, 20, {c: 'green', hi: .9, dur: .8, rx: 10})}
  ]},

  /* ---------------- power button: switching the computer on (its own diagram, scenes/devices.js) ---------------- */
  'power-button': {name: 'Switching the computer on', steps: [
    {t: 'Standby power', parts: ['pb-controller'],
     x: 'While it is plugged in, the power supply keeps a small **standby** voltage on, so the **power controller** stays awake.',
     fx: F => F.dots([[872, 154], [872, 300], [722, 300]], {c: 'pow', n: 3, dur: 1.6}) + F.glow(600, 272, 120, 106, {c: 'pow', lo: .05, hi: .3, dur: 2}) +
       F.tag(760, 470, '+5 V standby, always on')},
    {t: 'You press the button', parts: ['pb-switch'],
     x: 'Pressing the button pushes a plunger that closes two **contacts**. A spring opens them again when you let go.',
     fx: F => F.move('<rect x="100" y="262" width="50" height="76" rx="12" class="dfx-solid" style="fill:var(--accent);opacity:.45"/>' +
         '<rect x="150" y="288" width="70" height="24" rx="4" class="dfx-solid" style="fill:var(--accent);opacity:.35"/>' +
         '<rect x="266" y="268" width="8" height="64" rx="2" class="dfx-solid" style="fill:var(--signal)"/>', '0 0;13 0;13 0;0 0;0 0', 1.6, {times: '0;.12;.5;.62;1'}) +
       F.tag(330, 160, 'springs back when you let go')},
    {t: 'The signal goes to the board', parts: ['pb-switch', 'pb-header'],
     x: 'The closed switch pulls the **PWR_SW#** wire to 0 V, through the cable and the **front-panel header**.',
     fx: F => F.glow(284, 264, 14, 72, {c: 'sig', hi: .9, dur: .8}) + F.dots([[309, 300], [372, 310], [412, 372], [448, 386]], {n: 3, dur: 1.2}) +
       F.ring(466, 386, 12, {c: 'sig'}) + F.tag(480, 205, 'PWR_SW# pulled to 0 V')},
    {t: 'The controller switches the supply on', parts: ['pb-controller'],
     x: 'The **power controller** sees the pulse and pulls **PS_ON#** low, the signal for the power supply to switch on.',
     fx: F => F.dots([[548, 396], [580, 396], [580, 340], [600, 340]], {n: 2, dur: .9}) + F.glow(600, 272, 120, 106, {hi: .45, dur: .8}) +
       F.dots([[720, 340], [872, 340], [872, 154]], {n: 3, dur: 1.4, delay: .4}) + F.tag(760, 470, 'PS_ON# low: switch on')},
    {t: 'Main power, and the light', parts: ['pb-led'],
     x: 'Full **12 V, 5 V and 3.3 V** power flows in, and the board lights the **power LED** through the same header.',
     fx: F => F.dots([[872, 154], [872, 370], [872, 470], [700, 470]], {c: 'pow', n: 5, dur: 1.5}) +
       F.dots([[448, 406], [390, 410], [300, 428], [190, 426]], {n: 2, dur: 1.2}) +
       F.glow(108, 410, 32, 32, {c: 'green', rx: 16, lo: .55, hi: .95, dur: 1.4}) + F.tag(330, 488, 'power light on')},
    {t: 'Pressing it again', parts: ['pb-switch', 'pb-controller'],
     x: 'Pressing it again asks the system to sleep or shut down. Holding it for **4 seconds** forces the power off.',
     fx: F => F.ring(125, 300, 40, {c: 'sig', grow: 20, dur: 1.4}) + F.glow(600, 272, 120, 106, {hi: .35, dur: 1.4}) +
       F.tag(330, 160, 'hold 4 seconds: forced off')}
  ]},

  /* ---------------- power supply: mains AC in, steady DC out (scenes/hardware.js, SCENES.psu) ---------------- */
  psu: {name: 'Turning mains power into steady DC', steps: [
    {t: 'The rectifier', parts: ['rectifier'],
     x: 'Mains **AC** swings back and forth 50 or 60 times a second. The **rectifier**’s diodes make it flow one way only.',
     fx: F => F.sine(102, 150, 335, 12, {c: 'pow', wl: 24}) + F.glow(186, 300, 60, 60, {c: 'pow', hi: .55}) +
       F.dots([[200, 330], [250, 330]], {c: 'pow', n: 2, dur: .9}) + F.tag(205, 180, 'AC in, one way out')},
    {t: 'The capacitors', parts: ['filter-caps'],
     x: 'Large **capacitors** fill up on each pulse and fill in the gaps: a smooth, high-voltage DC of about 325 V.',
     fx: F => F.dots([[246, 320], [290, 252]], {c: 'pow', n: 2, dur: .9}) + F.dots([[246, 340], [290, 388]], {c: 'pow', n: 2, dur: .9}) +
       F.ring(320, 250, 50, {c: 'pow', grow: 8, dur: 1.6}) + F.ring(320, 390, 50, {c: 'pow', grow: 8, dur: 1.6, delay: .8}) + F.tag(320, 180, 'about 325 V DC')},
    {t: 'Switching and the transformer', parts: ['transformer'],
     x: 'Transistors switch it on and off about **100,000 times a second**, so a small **transformer** can step it down.',
     fx: F => F.dots([[370, 330], [420, 330]], {c: 'pow', n: 2, dur: .7}) + F.glow(420, 200, 26, 260, {c: 'sig', lo: .05, hi: .7, dur: .2}) +
       F.glow(470, 262, 110, 136, {c: 'pow', lo: .1, hi: .5, dur: .4}) + F.tag(505, 180, 'on and off, 100,000 times a second')},
    {t: 'Regulation', parts: ['voltage-regulation'],
     x: 'On the low-voltage side the pulses are smoothed, and a controller keeps **12 V, 5 V and 3.3 V** steady.',
     fx: F => F.dots([[580, 330], [620, 330]], {c: 'pow', n: 2, dur: .7}) + F.glow(670, 210, 140, 90, {hi: .45}) +
       [690, 730, 770, 810].map((x, i) => F.ring(x, 370, 16, {c: 'pow', grow: 8, dur: 1.2, delay: i * .3})).join('') + F.tag(725, 180, 'measured and corrected all the time')},
    {t: 'Out to the computer', parts: [],
     x: 'The steady voltages leave through the cables: **12 V** for the CPU and graphics card, **5 V** and **3.3 V** for the rest.',
     fx: F => [320, 350, 380].map((y, i) => F.dots([[850, y], [930, y], [995, y]], {c: 'pow', n: 3, dur: 1.2, delay: i * .2})).join('') +
       F.tag(745, 525, 'to the motherboard and drives')}
  ]},

  /* ---------------- SSD: saving a file (scenes/hardware.js, SCENES.ssd) ---------------- */
  ssd: {name: 'Saving a file on an SSD', steps: [
    {t: 'Through the connector', parts: ['m2-connector'],
     x: 'Data arrives from the computer over **PCIe**, through the gold contacts of the **M.2 connector**.',
     fx: F => F.bits([[0, 325], [112, 325]], '0110 1011', {n: 2, dur: 1.2}) + F.glow(112, 240, 30, 172, {hi: .6}) +
       F.dots([[140, 325], [210, 325]], {n: 2, dur: .7, delay: .6}) + F.tag(300, 180, 'PCIe: up to 7,000 MB/s')},
    {t: 'The controller', parts: ['ssd-controller'],
     x: 'The **controller**, a small processor, splits the file into pages and decides where each one will go.',
     fx: F => F.dots([[140, 325], [210, 325]], {n: 2, dur: .7}) + F.glow(210, 265, 140, 140, {hi: .35}) +
       F.seq([0, 1, 2].flatMap(r => [0, 1, 2].map(c => `<rect x="${230 + c * 36}" y="${285 + r * 36}" width="28" height="28" rx="3" style="fill:var(--signal);opacity:.6"/>`)), {step: .12}) +
       F.tag(300, 180, 'the file, split into pages')},
    {t: 'The DRAM cache', parts: ['dram-cache'],
     x: 'It keeps a map of where every page is stored in the fast **DRAM cache**, so it can find any of them at once.',
     fx: F => F.dots([[350, 318], [380, 318]], {n: 2, dur: .5}) + F.dots([[380, 352], [350, 352]], {n: 2, dur: .5, delay: .25}) +
       F.glow(380, 280, 100, 110, {hi: .55}) + F.tag(430, 180, 'a map: which page is where')},
    {t: 'Written into NAND flash', parts: ['nand-flash'],
     x: 'The pages are written into the **NAND flash** chips as trapped electric charge, which stays with the power off.',
     fx: F => F.dots([[280, 265], [280, 238], [605, 238], [605, 255]], {n: 3, dur: 1.3}) + F.dots([[605, 238], [805, 238], [805, 255]], {n: 2, dur: 1, delay: .6}) +
       F.seq([520, 720].flatMap(x => [0, 1, 2, 3].flatMap(r => [0, 1, 2, 3, 4, 5].map(c => `<rect x="${x + 12 + c * 26}" y="${268 + r * 36}" width="20" height="26" rx="2" style="fill:var(--signal);opacity:.55"/>`))), {step: .04}) +
       F.tag(705, 180, 'charge stays with the power off')},
    {t: 'Reading it back', parts: ['ssd-controller', 'nand-flash'],
     x: 'Reading back takes about **0.1 ms**. The controller also spreads writes over all the cells, so they wear evenly.',
     fx: F => F.bits([[605, 255], [605, 238], [280, 238], [280, 265]], '1101', {n: 2, dur: 1.1}) + F.bits([[210, 345], [140, 345], [0, 345]], '1101', {n: 2, dur: .8, delay: .6}) +
       F.seq([0, 1, 2, 3].flatMap(r => [0, 1, 2, 3, 4, 5].flatMap(c => [520, 720].map(x => `<rect x="${x + 12 + c * 26}" y="${268 + r * 36}" width="20" height="26" rx="2" style="fill:var(--accent);opacity:.45"/>`))), {step: .04}) +
       F.tag(300, 180, 'about 0.1 ms to read')}
  ]},

  /* ---------------- hard drive: saving and finding data (SCENES.hdd) ---------------- */
  hdd: {name: 'Saving and finding data on a hard drive', steps: [
    {t: 'The controller board', parts: ['hdd-controller-board'],
     x: 'Data arrives at the **controller board**, which drives the motor and the arm and turns data into magnetic signals.',
     fx: F => F.bits([[1000, 587], [760, 587]], '0110', {n: 2, dur: 1.2}) + F.dots([[690, 587], [300, 587]], {n: 3, dur: 1.4, delay: .4}) +
       F.glow(244, 572, 50, 30, {hi: .7}) + F.tag(890, 470, 'SATA: about 250 MB/s')},
    {t: 'The platters spin', parts: ['hdd-spindle', 'hdd-platter'],
     x: 'The **spindle motor** spins the **platters** at a steady 5,400 to 7,200 turns a minute.',
     fx: F => F.spin('<path d="M450 315V167" style="stroke:var(--accent);stroke-width:4;opacity:.6"/>' + [260, 225, 190].map(y => `<circle cx="450" cy="${y}" r="5" style="fill:var(--signal)"/>`).join(''), 450, 315, .8) +
       F.ring(450, 315, 40, {c: 'pow', grow: 10}) + F.tag(890, 300, '7,200 turns a minute')},
    {t: 'The arm swings', parts: ['hdd-arm'],
     x: 'The **actuator arm** swings the heads across the platters, moved by a voice coil and a magnet at its pivot.',
     fx: F => F.spin('<path d="M728 468L470 172L484 166L742 462Z" style="fill:var(--accent);opacity:.35"/><rect x="438" y="155" width="24" height="16" rx="3" style="fill:var(--signal)"/>', 690, 505, 1.8, {swing: [0, -14]}) +
       F.glow(650, 460, 80, 90, {hi: .45}) + F.tag(890, 300, 'swung by a voice coil')},
    {t: 'The head reads and writes', parts: ['hdd-head'],
     x: 'The **head** flies nanometres above the surface. It magnetises tiny spots to write, and senses them to read.',
     fx: F => F.spin([0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => `<rect x="446" y="186" width="8" height="10" rx="1.5" transform="rotate(${a} 450 315)" style="fill:var(--signal);opacity:.8"/>`).join(''), 450, 315, 1.2) +
       F.glow(436, 153, 28, 20, {hi: .85}) + F.ring(450, 163, 10, {c: 'sig'}) + F.tag(890, 300, 'nanometres above the platter')},
    {t: 'Finding data takes time', parts: ['hdd-arm', 'hdd-head'],
     x: 'Finding data means moving the arm and waiting for the spin: about **10 ms**, 100 times slower than an SSD.',
     fx: F => F.spin('<path d="M450 315V167" style="stroke:var(--accent);stroke-width:4;opacity:.45"/>', 450, 315, .8) +
       F.spin('<path d="M728 468L470 172L484 166L742 462Z" style="fill:var(--accent);opacity:.3"/>', 690, 505, 2.4, {swing: [0, -10]}) +
       F.bits([[450, 172], [690, 505], [690, 575]], '1101', {n: 2, dur: 2.2}) + F.bits([[750, 587], [1000, 587]], '1101', {n: 2, dur: 1, delay: 1}) +
       F.tag(890, 300, 'about 10 ms to find the data')}
  ]},

  /* ---------------- cooling: carrying heat away from the CPU (scenes/hardware.js, SCENES.cooling) ---------------- */
  cooling: {name: 'Carrying heat away from the CPU', steps: [
    {t: 'The CPU makes heat', parts: [],
     x: 'The **CPU** turns nearly all the power it uses into heat, often 100 watts or more, from a chip the size of a stamp.',
     fx: F => F.glow(435, 550, 130, 15, {c: 'red', lo: .3, hi: .9, dur: 1}) + F.waves(500, 545, {up: true, h: 55, len: 40, c: 'red', n: 3}) +
       F.tag(990, 662, 'often 100 watts or more', {anchor: 'end'})},
    {t: 'Thermal paste', parts: ['thermal-paste'],
     x: '**Thermal paste** fills the tiny air gaps between the CPU and the cooler’s copper base, so the heat can cross.',
     fx: F => [460, 500, 540].map((x, i) => F.dots([[x, 562], [x, 512]], {c: 'red', n: 2, dur: .9, delay: i * .2})).join('') +
       F.glow(438, 540, 124, 9, {c: 'red', hi: .8, dur: .9}) + F.tag(990, 662, 'no air gaps: heat crosses easily', {anchor: 'end'})},
    {t: 'Heat pipes', parts: ['heat-pipes'],
     x: 'In the **heat pipes**, a liquid boils at the hot base, rises as vapour and turns back to liquid in the fins, leaving its heat.',
     fx: F => [375, 625].map(x => F.dots([[x, 500], [x, 140]], {c: 'red', n: 3, dur: 1.8})).join('') +
       [430, 570].map(x => F.dots([[x, 140], [x, 480]], {c: 'blue', n: 3, dur: 1.8, delay: .6})).join('') +
       F.tag(990, 662, 'vapour rises, liquid comes back', {anchor: 'end'})},
    {t: 'Heatsink fins', parts: ['heatsink'],
     x: 'The thin **heatsink fins** spread the heat over a large surface, so that the air can take it away.',
     fx: F => F.seq([...Array(22).keys()].reverse().map(i => `<rect x="330" y="${124 + i * 16}" width="340" height="5" rx="2" style="fill:#E5533D;opacity:.7"/>`), {step: .07, hold: .8}) +
       F.tag(990, 662, 'a large surface for the air', {anchor: 'end'})},
    {t: 'The fan moves the air', parts: ['fan'],
     x: 'The **fan** pushes cool air through the fins, and warm air comes out the other side and leaves the case.',
     fx: F => [200, 300, 400].map((y, i) => F.dots([[150, y], [330, y]], {c: 'blue', n: 2, dur: .9, delay: i * .15}) + F.dots([[670, y], [800, y]], {c: 'red', n: 2, dur: .9, delay: .45 + i * .15})).join('') +
       F.glow(256, 130, 54, 330, {c: 'blue', hi: .35, dur: .6}) + F.tag(990, 662, 'cool air in, warm air out', {anchor: 'end'})},
    {t: 'Speed follows temperature', parts: ['fan'],
     x: 'The motherboard reads the CPU’s temperature and speeds the fan up as it warms, then slows it down to stay quiet.',
     fx: F => F.dots([[283, 600], [283, 460]], {c: 'pow', n: 2, dur: .9}) + F.dots([[283, 460], [283, 600]], {n: 2, dur: .9, delay: .45}) +
       F.glow(256, 130, 54, 330, {c: 'blue', lo: .05, hi: .45, dur: 2.4}) + F.tag(990, 662, 'faster when hot, quiet when cool', {anchor: 'end'})}
  ]},

  /* ---------------- CPU: how it runs an instruction, part by part (scenes/cpu.js, SCENES.cpu) ---------------- */
  cpu: {name: 'How the CPU runs an instruction', steps: [
    {t: 'The clock', parts: ['clock'],
     x: 'The **clock** ticks about 4 billion times a second. On every tick, each part of the core takes one step.',
     fx: F => F.dots([[790, 215], [804, 215], [804, 175], [828, 175], [828, 215], [852, 215], [852, 175], [876, 175], [876, 215], [890, 215]], {n: 2, dur: 1.2}) +
       F.glow(775, 110, 145, 150, {hi: .35, dur: .5}) + F.tag(848, 64, 'about 4 billion ticks a second')},
    {t: 'Bus interface and cache', parts: ['bus-interface', 'cache'],
     x: 'The **bus interface** brings instructions and data in from RAM, and keeps copies close by in the fast **L1 and L2 cache**.',
     fx: F => F.dots([[856, 640], [856, 540], [745, 540]], {n: 3, dur: 1.3}) +
       F.seq([...Array(22).keys()].map(c => `<rect x="${366 + c * 17}" y="539" width="13" height="17" rx="2" style="fill:var(--signal);opacity:.75"/>`), {step: .05}) +
       F.tag(548, 64, 'copies kept close to the core')},
    {t: 'The control unit', parts: ['control-unit'],
     x: 'The **control unit** runs the show: it takes the next instruction and moves it through fetch, decode and execute.',
     fx: F => F.dots([[440, 480], [440, 262]], {n: 2, dur: .9}) +
       F.seq([[370, 160], [430, 160], [400, 208]].map(([x, y]) => `<rect x="${x}" y="${y}" width="44" height="26" rx="5" style="fill:var(--signal);opacity:.7"/>`), {step: .5, hold: .5}) +
       F.tag(440, 64, 'fetch, decode, execute')},
    {t: 'The instruction decoder', parts: ['decoder'],
     x: 'The **instruction decoder** reads the instruction’s bits and works out what to do, and with which registers.',
     fx: F => F.seq([155, 182, 209].map(y => `<rect x="560" y="${y}" width="125" height="22" rx="4" style="fill:var(--signal);opacity:.45"/>`), {step: .35, hold: .4}) +
       [165, 192, 219].map((y, i) => F.dots([[690, y], [730, y]], {n: 1, dur: .6, delay: i * .2})).join('') + F.tag(652, 64, 'bits become control signals')},
    {t: 'The registers', parts: ['registers', 'alu'],
     x: 'The **registers**, the fastest memory in the CPU, hand the two numbers to work on to the **ALU**.',
     fx: F => F.glow(601, 343, 20, 20, {hi: .9, rx: 3}) + F.glow(653, 371, 20, 20, {hi: .9, rx: 3, delay: .3}) +
       F.dots([[601, 353], [500, 355]], {n: 2, dur: .9}) + F.dots([[653, 381], [485, 395]], {n: 2, dur: .9, delay: .3}) + F.tag(548, 64, 'the two numbers to work on')},
    {t: 'The ALU', parts: ['alu', 'registers'],
     x: 'The **ALU** adds, compares or shifts them in a single tick, and the result goes back into a register.',
     fx: F => F.glow(385, 330, 120, 90, {hi: .5, dur: .6}) + F.dots([[445, 420], [445, 452], [640, 452], [640, 440]], {n: 2, dur: 1.1, delay: .4}) +
       F.tag(445, 64, 'one operation per tick')},
    {t: 'See it with real code', parts: ['i8086'],
     x: 'To watch this with real code, open the **Intel 8086**: it runs real programs one instruction at a time.',
     fx: F => F.ring(109, 582, 30, {c: 'sig', grow: 16}) + F.glow(56, 548, 238, 68, {hi: .3, rx: 12}) + F.tag(175, 652, 'open it to run real code')}
  ]},

  /* ---------------- motherboard: connecting every part (SCENES.board) ---------------- */
  board: {name: 'Connecting every part', steps: [
    {t: 'Power for the CPU', parts: ['atx-power', 'vrm'],
     x: 'Power arrives at the **24-pin connector**. The **VRM** turns 12 V into about 1 V, at high current, for the CPU.',
     fx: F => F.dots([[648, 86], [398, 86], [398, 128]], {c: 'pow', n: 4, dur: 1.6}) + F.glow(386, 128, 24, 184, {c: 'pow', hi: .6}) +
       F.dots([[410, 220], [520, 220]], {c: 'pow', n: 3, dur: .9, delay: .6}) + F.tag(865, 250, '12 V in, about 1 V out')},
    {t: 'CPU and memory', parts: ['cpu-socket', 'ram-slots'],
     x: 'The **CPU socket** joins the processor to the board, with short, fast traces to the **RAM slots** beside it.',
     fx: F => F.dots([[520, 226], [430, 226]], {n: 3, dur: .8}) + F.dots([[430, 236], [520, 236]], {n: 3, dur: .8, delay: .4}) +
       F.glow(540, 170, 120, 120, {hi: .4}) + F.tag(865, 250, 'the shortest, fastest path')},
    {t: 'PCIe slots and M.2', parts: ['pcie'],
     x: '**PCIe slots** and the **M.2** slot connect the graphics card and the SSD to the CPU through fast lanes.',
     fx: F => F.dots([[560, 310], [560, 426]], {n: 3, dur: .9}) + F.dots([[610, 310], [610, 476], [580, 476]], {n: 3, dur: 1.1}) +
       F.glow(290, 417, 300, 18, {hi: .55}) + F.glow(380, 465, 200, 22, {hi: .55, delay: .3}) + F.tag(865, 450, 'up to 16 lanes for a graphics card')},
    {t: 'The chipset', parts: ['chipset', 'sata-ports', 'rear-io'],
     x: 'The **chipset** runs the slower links, **SATA** drives, extra USB and the **rear I/O** ports, and joins them to the CPU.',
     fx: F => F.dots([[680, 230], [657, 230], [657, 440]], {n: 3, dur: 1.2}) + F.dots([[657, 530], [657, 560], [684, 560]], {n: 2, dur: .8}) +
       F.dots([[612, 450], [318, 450], [318, 250], [312, 250]], {n: 3, dur: 1.8}) + F.glow(612, 440, 90, 90, {hi: .45}) + F.tag(865, 560, 'USB, SATA, sound, network')},
    {t: 'Firmware and settings', parts: ['bios', 'cmos'],
     x: 'At start-up the CPU loads its firmware from the **BIOS chip**. The **CMOS battery** keeps the clock and settings.',
     fx: F => F.glow(462, 578, 40, 26, {hi: .7}) + F.bits([[502, 591], [580, 591], [580, 520], [612, 520]], '1011', {n: 2, dur: 1.4}) +
       F.dots([[657, 440], [657, 230], [680, 230]], {n: 2, dur: 1, delay: .7}) + F.ring(398, 591, 22, {c: 'pow'}) + F.tag(865, 600, 'firmware first, then the OS')},
    {t: 'Fans and temperature', parts: ['fan-header'],
     x: 'The **fan header** powers the CPU fan and reads its speed, so the board can spin it faster as the CPU warms.',
     fx: F => '<path class="m-cable" d="M722 180H810" style="stroke-width:4"/><circle cx="850" cy="180" r="40" style="fill:none;stroke:var(--i-text-mut);stroke-width:3"/>' +
       F.spin([0, 90, 180, 270].map(a => `<ellipse cx="850" cy="159" rx="9" ry="19" transform="rotate(${a} 850 180)" style="fill:var(--accent);opacity:.7"/>`).join('') + '<circle cx="850" cy="180" r="8" style="fill:var(--i-text-mut)"/>', 850, 180, .6) +
       F.dots([[722, 174], [810, 174]], {c: 'pow', n: 2, dur: .8}) + F.dots([[810, 188], [722, 188]], {n: 2, dur: .8, delay: .4}) + F.tag(850, 260, 'faster as the CPU warms')}
  ]},

  /* ---------------- RAM: storing and reading bits (SCENES.ram) ---------------- */
  ram: {name: 'Storing and reading bits', steps: [
    {t: 'The SPD chip', parts: ['spd'],
     x: 'At start-up the computer reads the stick’s small **SPD chip**: its size, its speed and its timings.',
     fx: F => F.glow(476, 124, 48, 64, {hi: .6}) + F.bits([[500, 190], [500, 300]], '0101', {n: 2, dur: 1.2}) + F.tag(720, 300, 'size, speed, timings')},
    {t: 'Address and data arrive', parts: ['dram'],
     x: 'The CPU’s memory controller sends an **address** through the gold contacts to all the **DRAM chips** at once.',
     fx: F => [135, 215, 295, 375, 555, 635, 715, 795].map(x => F.dots([[x + 35, 262], [x + 35, 212]], {n: 2, dur: .9})).join('') +
       F.tag(720, 300, 'every chip at the same moment')},
    {t: 'A row opens', parts: ['memory-cells'],
     x: 'Inside each chip the address opens one **row**: its **word line** switches on every cell in that row at once.',
     fx: F => F.glow(138, 483, 350, 14, {lo: .4, hi: .8, rx: 7}) + F.tag(300, 662, 'word line: one row at a time')},
    {t: 'Cells hold charge', parts: ['memory-cells'],
     x: 'Each cell is a tiny capacitor: **charged is 1**, empty is 0. The **bit lines** carry each charge out to be read.',
     fx: F => F.glow(138, 483, 350, 14, {lo: .3, hi: .5, rx: 7}) + [0, 3, 5, 8, 10].map(c => F.dots([[150 + c * 28, 497], [150 + c * 28, 592]], {n: 2, dur: 1})).join('') +
       F.ring(150, 490, 10, {c: 'sig'}) + F.tag(300, 662, 'charged is 1, empty is 0')},
    {t: 'Refresh', parts: ['memory-cells'],
     x: 'The charge slowly leaks away, so every row is read and written back, **refreshed**, every 64 milliseconds.',
     fx: F => F.seq([0, 1, 2, 3, 4, 5, 6].map(r => `<rect x="138" y="${393 + r * 30}" width="350" height="14" rx="7" style="fill:var(--signal);opacity:.5"/>`), {step: .3, hold: .3}) +
       F.tag(300, 662, 'every row, every 64 ms')},
    {t: 'SRAM needs no refresh', parts: ['sram'],
     x: 'The CPU’s caches use **SRAM** instead: two inverters hold each bit, so it is faster and never needs refreshing.',
     fx: F => { const o = gsym('NOT', 650, 420, .8, 2.5).o;
       return F.dots([[o[0], o[1]], [842, o[1]], [842, 512], [802, 512]], {n: 3, dur: 1.2}) + F.dots([[731, 512], [618, 512], [618, 452], [654, 452]], {n: 3, dur: 1.2, delay: .6}) +
         F.tag(725, 662, 'holds its bit while powered'); }}
  ]},

  /* ---------------- graphics card: drawing a frame (SCENES.gpu) ---------------- */
  gpu: {name: 'Drawing a frame', steps: [
    {t: 'Power for the GPU', parts: ['gpu-power'],
     x: 'The card’s **power stages** turn 12 V from the slot and its power cable into about 1 V for the GPU.',
     fx: F => F.dots([[453, 190], [453, 246]], {c: 'pow', n: 2, dur: .8}) + F.glow(424, 250, 58, 180, {c: 'pow', hi: .55}) +
       F.dots([[424, 320], [350, 320]], {c: 'pow', n: 3, dur: .9, delay: .4}) + F.tag(300, 150, '12 V in, about 1 V out')},
    {t: 'Commands arrive over PCIe', parts: ['gpu-pcie'],
     x: 'Drawing commands from the CPU arrive through the **PCIe** connector and the GPU’s **PCIe link**.',
     fx: F => F.bits([[300, 520], [300, 470], [285, 395]], '0110', {n: 2, dur: 1.4}) + F.glow(745, 556, 130, 54, {hi: .6}) + F.tag(300, 150, 'up to 32 GB/s')},
    {t: 'Memory controllers fetch data', parts: ['memory-controller', 'vram'],
     x: '**Memory controllers** fetch models and textures from the **VRAM** chips around the GPU, hundreds of GB a second.',
     fx: F => [[[214, 217], [240, 280]], [[274, 217], [275, 280]], [[334, 217], [310, 280]], [[214, 423], [240, 360]], [[274, 423], [275, 360]], [[334, 423], [310, 360]],
         [[389, 282], [320, 300]], [[389, 358], [320, 340]]].map((p, i) => F.dots(p, {n: 2, dur: .7, delay: i * .08})).join('') +
       F.glow(556, 130, 34, 470, {hi: .45}) + F.glow(890, 130, 34, 470, {hi: .45, delay: .3}) + F.tag(300, 150, 'about 500 GB a second')},
    {t: 'The L2 cache', parts: ['gpu-l2cache'],
     x: 'Data the cores need again and again is kept close by, in the on-chip **L2 cache**, so they don’t wait for VRAM.',
     fx: F => F.dots([[590, 513], [605, 513]], {n: 2, dur: .5}) + F.dots([[924, 513], [875, 513]], {n: 2, dur: .7}) + F.glow(605, 485, 270, 56, {hi: .55}) +
       [632, 686, 740, 794, 848].map((x, i) => F.dots([[x, 485], [x, 440]], {n: 1, dur: .7, delay: i * .12})).join('') + F.tag(300, 150, 'kept close to the cores')},
    {t: 'Compute units work in parallel', parts: ['compute-units'],
     x: 'Thousands of cores in the **compute units** work out the colours of millions of pixels, all at the same time.',
     fx: F => F.seq([0, 1, 2, 3, 4, 5].flatMap(r => [0, 1, 2, 3, 4].map(c => `<rect x="${608 + c * 54}" y="${132 + r * 56}" width="48" height="50" rx="4" style="fill:var(--signal);opacity:.5"/>`)), {step: .04, hold: .5}) +
       F.tag(300, 150, 'thousands of pixels at once')},
    {t: 'The frame goes to the screen', parts: ['gpu-media', 'display-outputs'],
     x: 'The **display engine** sends each finished frame out of a **display output** to the monitor, 60 or more times a second.',
     fx: F => F.glow(605, 556, 130, 54, {hi: .6}) + F.bits([[225, 320], [150, 320], [150, 217], [66, 217], [0, 217]], '1010', {n: 2, dur: 1.6}) +
       F.tag(300, 150, '60 or more frames a second')}
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
    webcam:   [['whoosh'], ['whoosh'], ['shutter', 'loop:scan'], ['loop:bits'], ['loop:bits', 'ding@0.3']],
    'power-button': [['loop:hum'], ['loop:clicks'], ['click', 'blip@0.3'], ['relay', 'zap@0.5'], ['zap', 'loop:hum', 'ding@0.8'], ['click']],
    psu:      [['loop:hum'], ['loop:hum'], ['loop:buzz'], ['loop:hum'], ['zap', 'loop:hum']],
    cooling:  [['loop:hum'], [], ['loop:hum'], [], ['loop:motor', 'loop:waves'], ['loop:motor']],
    cpu:      [['loop:scan'], ['loop:bits'], ['loop:steps'], ['loop:bits-fast'], ['loop:bits'], ['blip', 'loop:bits'], ['chime']],
    ssd:      [['loop:bits'], ['loop:bits-fast'], ['loop:bits-fast'], ['loop:steps'], ['loop:bits']],
    hdd:      [['loop:bits'], ['loop:motor'], ['loop:motor', 'loop:clicks'], ['loop:motor', 'loop:scan'], ['loop:motor', 'loop:clicks']],
    board:    [['zap', 'loop:hum'], ['loop:bits-fast'], ['loop:bits-fast'], ['loop:bits'], ['beep'], ['loop:motor']],
    ram:      [['blip', 'loop:bits'], ['loop:bits-fast'], ['click'], ['loop:steps'], ['loop:scan'], ['loop:hum']],
    gpu:      [['zap', 'loop:hum'], ['loop:bits'], ['loop:bits-fast'], ['loop:bits-fast'], ['loop:scan'], ['loop:bits']]
  };
  Object.keys(SOUNDS).forEach(k => SOUNDS[k].forEach((s, i) => { if (DEVICE_ANIMS[k].steps[i]) DEVICE_ANIMS[k].steps[i].sfx = s; }));
})();

/* Spoken before step 1, while the whole diagram shows (no caption, nothing in focus). */
(function(){
  const INTROS = {
    mic: 'This is a simplified inside view of a USB microphone. A microphone is an input device: it turns the sound of your voice into numbers the computer can record or send. Let\'s see how it works.',
    speakers: 'This is a simplified inside view of a powered speaker. A speaker is an output device: it turns the numbers the computer sends back into sound you can hear. Let\'s see how it works.',
    monitor: 'This is a simplified inside view of a monitor, with its layers pulled apart. A monitor is an output device: it turns the computer\'s video signal into the picture you see. Let\'s see how it works.',
    keyboard: 'This is a simplified cross-section of a keyboard. A keyboard is an input device: every key you press becomes a code the computer understands. Let\'s see how it works.',
    mouse: 'This is a simplified inside view of an optical mouse. A mouse is an input device: it tells the computer how you move it, and when you click. Let\'s see how it works.',
    joystick: 'This is a simplified inside view of a joystick. A joystick is an input device: it reports which way, and how far, you tilt the stick. Let\'s see how it works.',
    gamepad: 'This is a simplified inside view of a game controller. A game controller is an input device, and with its rumble motors, an output device too. Let\'s see how it works.',
    printer: 'This is a simplified view inside an inkjet printer, from above. A printer is an output device: it puts the computer\'s pages onto paper, one line of tiny ink drops at a time. Let\'s see how it works.',
    webcam: 'This is a simplified cut-away of a webcam. A webcam is an input device: it turns the light from the scene into video the computer can show or send. Let\'s see how it works.'
  };
  Object.keys(INTROS).forEach(k => { if (DEVICE_ANIMS[k]) DEVICE_ANIMS[k].intro = INTROS[k]; });
})();
