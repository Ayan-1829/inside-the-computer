/* ==========================================================
   scenes/devices.js
   "Inside" drawings of the input and output devices: microphone, speakers,
   monitor, keyboard, mouse, joystick, game controller, printer and webcam.
   The parts they draw are defined in data/devices-inside.js.
   ========================================================== */
/* Part names in these diagrams are a quarter bigger than elsewhere, to read clearly, and point at their part:
   o.to = [x, y] (or a list of them) is the point on the part; a short arrow runs there from the edge of the
   name. The arrow belongs to the name, so it lights up and dims with it. */
const DLB = (x, y, text, o = {}) => {
  const size = Math.round((o.size || 16) * 1.25), s = LB(x, y, text, Object.assign({}, o, {size}));
  if (!o.to) return s;
  const f = v => Math.round(v * 10) / 10, a = o.anchor || 'middle';
  const hw = plainLen(text) * size * 0.29, hh = size * 0.55, cx = a === 'start' ? x + hw : a === 'end' ? x - hw : x;
  const ptr = (typeof o.to[0] === 'number' ? [o.to] : o.to).map(([tx, ty]) => {
    const dx = tx - cx, dy = ty - y, k = Math.min(dx ? (hw + 5) / Math.abs(dx) : Infinity, dy ? (hh + 4) / Math.abs(dy) : Infinity);
    const sx = cx + dx * k, sy = y + dy * k, len = Math.hypot(tx - sx, ty - sy) || 1, ux = (tx - sx) / len, uy = (ty - sy) / len;
    const ex = tx - ux * 2, ey = ty - uy * 2, bx = ex - ux * 9, by = ey - uy * 9;
    return `<path class="lbl-ptr" d="M${f(sx)} ${f(sy)}L${f(bx)} ${f(by)}"/>` +
      `<path class="lbl-ptr-h" d="M${f(ex)} ${f(ey)}L${f(bx - uy * 4.5)} ${f(by + ux * 4.5)}L${f(bx + uy * 4.5)} ${f(by - ux * 4.5)}Z"/>`;
  }).join('');
  return s.replace(/<\/g>$/, ptr + '</g>');
};
const TITLE = t => `<g class="bg scene-title">${T(90,70,t,'t t-sm t-mut')}</g>`;   /* hidden while "How it works" plays: its note says more */
const NOTE = t => `<g class="bg">${T(90,655,t,'t t-sm t-mut')}</g>`;
/* the same note for the device diagrams, whose text is bigger: split into two lines when long */
const DNOTE = t => {
  if (t.length <= 72) return `<g class="bg">${T(90,700,t,'t t-sm t-mut')}</g>`;
  let cut = t.lastIndexOf(' ', Math.ceil(t.length / 2) + 6); if (cut < 20) cut = t.indexOf(' ', t.length / 2);
  return `<g class="bg">${T(90,690,t.slice(0, cut),'t t-sm t-mut')}${T(90,716,t.slice(cut + 1),'t t-sm t-mut')}</g>`;
};
/* an arrow along the bottom with a short caption under each stage: caps = [[x, text], ...] */
const FLOW = (y, caps) => `<g class="bg"><path class="arr" d="M90 ${y}H900"/><path class="arr-h" d="M900 ${y-6}l10 6-10 6Z"/>${caps.map(([x,t]) => T(x,y+30,t,'t t-xs t-mut t-mid')).join('')}</g>`;
const WAVE = (x, y1, y2, bulge) => `<path d="M${x} ${y1}Q${x+bulge} ${(y1+y2)/2} ${x} ${y2}" style="fill:none;stroke:var(--accent);stroke-width:3;stroke-linecap:round"/>`;

/* ---------------- Inside the microphone ---------------- */
SCENES.mic = () => {
  let s = TITLE('USB condenser microphone, cutaway (simplified)');
  s += `<g class="bg">${WAVE(150,250,350,-26)}${WAVE(122,235,365,-32)}${WAVE(94,220,380,-40)}${T(118,418,'Sound','t t-xs t-mut t-mid')}</g>`;
  s += R(380,230,470,140,10,'m-board');
  s += `<g class="bg"><polyline class="ln-trace" points="340,300 410,300"/><polyline class="ln-trace" points="500,300 560,300"/><polyline class="ln-trace" points="650,300 700,300"/><polyline class="ln-trace" points="760,300 850,300"/></g>`;
  let mesh = ''; [188,204,220].forEach(x => mesh += `<line class="ln-thin" x1="${x}" y1="210" x2="${x}" y2="390"/>`);
  s += hot('mic-capsule',[170,190,170,220], R(170,190,170,220,70,'m-metal-lt') + mesh + R(238,235,8,130,3,'m-accent') + R(276,235,12,130,2,'m-metal2'));
  s += `<g class="bg">${T(254,435,'Diaphragm','t t-xs t-mut t-end')}${T(266,435,'Backplate','t t-xs t-mut')}</g>`;
  s += hot('mic-preamp',[410,270,90,60], R(410,270,90,60,6,'m-chip') + T(455,305,'AMP','t t-xs t-inv t-mid'));
  s += hot('mic-adc',[560,270,90,60], R(560,270,90,60,6,'m-chip') + T(605,305,'ADC','t t-xs t-inv t-mid'));
  s += hot('mic-usb',[700,262,220,76], R(700,270,60,60,6,'m-chip') + R(850,266,70,68,8,'m-metal') + R(868,284,34,10,2,'m-slot') + R(868,304,34,10,2,'m-slot'));
  s += FLOW(560, [[255,'Sound waves'],[455,'Weak voltage'],[590,'Stronger voltage'],[758,'Digital numbers'],[905,'USB data']]);
  return {svg: s + LAYER(DLB(255,150,'Capsule',{for:'mic-capsule',to:[255,188]}) + DLB(455,205,'Preamp',{for:'mic-preamp',to:[455,268]}) + DLB(605,205,'ADC',{for:'mic-adc',to:[605,268]}) + DLB(810,205,'USB interface',{for:'mic-usb',to:[[735,268],[885,264]]}))};
};

/* ---------------- Inside the speakers ---------------- */
SCENES.speakers = () => {
  let s = TITLE('Powered USB speaker, cutaway (simplified)');
  s += R(90,230,370,160,10,'m-board') + R(56,290,34,40,4,'m-metal');
  s += `<g class="bg"><polyline class="ln-trace" points="90,310 130,310"/><polyline class="ln-trace" points="230,310 280,310"/><polyline class="ln-trace" points="390,310 460,310"/>${T(73,352,'In','t t-xs t-mut t-mid')}</g>`;
  s += hot('speaker-dac',[130,270,100,80], R(130,270,100,80,6,'m-chip') + T(180,315,'DAC','t t-xs t-inv t-mid'));
  s += hot('speaker-amp',[280,262,110,96], R(280,262,110,96,6,'m-chip') + T(335,315,'AMP','t t-xs t-inv t-mid'));
  s += `<path class="m-cable" d="M460 310H590V210H765V276" style="stroke-width:5"/>`;
  s += hot('speaker-magnet',[640,240,104,140], R(640,240,90,140,6,'m-metal2') + R(730,240,14,32,3,'m-metal') + R(730,348,14,32,3,'m-metal'));
  s += hot('speaker-cone',[796,180,120,260], P('M800 282L905 190V430L800 338Z','m-metal-lt') + R(898,178,16,22,4,'m-plastic') + R(898,420,16,22,4,'m-plastic') + R(796,282,10,56,3,'m-metal'));
  let wind = ''; [752,764,776,788].forEach(x => wind += `<line class="ln-thin" x1="${x}" y1="284" x2="${x}" y2="340"/>`);
  s += hot('speaker-coil',[744,276,60,72], R(744,280,56,64,3,'m-gold') + wind);
  s += `<g class="bg">${WAVE(935,260,360,26)}${WAVE(955,235,385,34)}</g>`;
  s += FLOW(560, [[175,'Digital audio'],[345,'Small voltage'],[540,'Strong current'],[735,'Coil moves'],[900,'Sound waves']]);
  return {svg: s + LAYER(DLB(180,207,'DAC',{for:'speaker-dac',to:[180,268]}) + DLB(335,207,'Amplifier',{for:'speaker-amp',to:[335,260]}) + DLB(682,418,'Magnet',{for:'speaker-magnet',to:[682,382]}) +
    DLB(795,406,'Voice coil',{for:'speaker-coil',to:[772,350]}) + DLB(882,456,'Cone',{for:'speaker-cone',to:[880,412]}))};
};

/* ---------------- Inside the monitor ---------------- */
SCENES.monitor = () => {
  let s = TITLE('Monitor, side view with the layers pulled apart (simplified)');
  let rays = ''; [250,330,410].forEach(y => rays += `<path class="ln-dash" d="M290 ${y}H690"/><path class="arr-h" d="M690 ${y-6}l10 6-10 6Z"/>`);
  s += `<g class="bg">${rays}</g>`;
  s += hot('monitor-power',[110,180,50,130], R(110,180,50,130,5,'m-board') + [200,236,272].map(y => R(120,y,30,22,3,'m-chip')).join(''));
  s += hot('monitor-controller',[110,340,50,130], R(110,340,50,130,5,'m-board') + R(120,362,30,30,3,'m-chip') + R(120,410,30,30,3,'m-chip'));
  s += hot('monitor-ports',[60,405,50,50], R(64,410,46,40,4,'m-slot') + [416,428,440].map(y => R(72,y,30,6,1,'m-metal-lt')).join(''));
  s += hot('monitor-backlight',[230,160,56,362], R(230,160,56,330,6,'m-panel') + R(230,492,56,28,3,'m-metal') + C(258,506,7,'m-on'));
  let cf = ''; for (let i = 0; i < 10; i++) cf += R(406,170+i*30,14,30,0,'',`style="fill:${['#E5533D','#3CB371','#3B82F6'][i%3]}"`);
  s += hot('monitor-panel',[330,170,110,300], R(330,170,10,300,2,'m-metal-lt') + R(350,170,14,300,2,'m-panel') + R(374,170,22,300,2,'m-block') + cf + R(430,170,10,300,2,'m-metal-lt'));
  s += `<g class="bg"><path d="M700 330Q750 285 800 330Q750 375 700 330Z" class="m-panel"/>${C(750,330,17,'m-chip')}${C(750,330,6,'m-hub')}${T(750,400,'You','t t-sm t-mut t-mid')}</g>`;
  s += `<g class="bg">${T(385,592,'Polarizer, transistor glass, liquid crystal,','t t-xs t-mut t-mid')}${T(385,614,'colour filter, polarizer','t t-xs t-mut t-mid')}</g>` + DNOTE('The backlight makes the light. The liquid crystal only decides how much of it each subpixel lets through.');
  return {svg: s + LAYER(DLB(135,140,'Power board',{for:'monitor-power',to:[135,178]}) + DLB(135,506,'Controller board',{for:'monitor-controller',to:[135,472]}) + DLB(72,368,'Inputs',{for:'monitor-ports',to:[84,407]}) +
    DLB(258,560,'Backlight',{for:'monitor-backlight',to:[258,522]}) + DLB(385,134,'LCD panel',{for:'monitor-panel',to:[385,168]}))};
};

/* ---------------- Inside the keyboard ---------------- */
SCENES.keyboard = () => {
  let s = TITLE('Keyboard, cross-section of two keys and the circuit board (simplified)');
  let grid = '', dots = '';
  [190,230,270,310].forEach(y => grid += `<line class="ln-thin" x1="560" y1="${y}" x2="800" y2="${y}"/>`);
  [580,630,680,730,780].forEach(x => grid += `<line class="ln-thin" x1="${x}" y1="180" x2="${x}" y2="320"/>`);
  [190,230,270,310].forEach(y => [580,630,680,730,780].forEach(x => dots += C(x,y,4,(x === 680 && y === 270) ? 'm-on' : 'm-metal')));
  s += hot('kb-matrix',[[90,372,840,28],[550,170,260,160]], R(90,372,840,28,4,'m-board') + grid + dots + T(650,352,'A pressed key joins one row to one column','t t-xs t-mut t-mid'));
  /* one key: housing, contact pad, plunger, spring, keycap. dy lowers a pressed key. */
  const key = (x, dy, pad) => R(x+20,296,90,76,4,'m-panel') + R(x+42,364,46,8,2,pad) + R(x+50,252+dy,30,70,3,'m-plastic') +
    `<path class="ln-thin" d="M${x+65} 300l-14 8 28 8 -28 8 28 8 -14 8"/>` + P(`M${x} ${190+dy}h130l-16 62h-98z`,'m-case');
  s += hot('kb-keys',[[170,190,130,190],[330,190,130,190]], key(170,0,'m-gold') + key(330,28,'m-on'));
  s += hot('kb-controller',[840,318,90,60], R(840,318,90,60,6,'m-chip') + T(885,352,'MCU','t t-xs t-inv t-mid'));
  s += `<g class="bg"><polyline class="ln-trace" points="885,400 885,420"/></g>`;
  s += hot('kb-usb',[850,410,70,120], R(860,420,50,40,4,'m-metal') + R(870,430,30,14,2,'m-slot') + `<path class="m-cable" d="M885 460V530" style="stroke-width:6"/>`);
  s += `<g class="bg">${T(395,232,'Pressed','t t-xs t-mut t-mid')}</g>`;
  s += FLOW(610, [[250,'Key pressed'],[480,'Row and column found'],[720,'Key code'],[880,'USB report']]);
  return {svg: s + LAYER(DLB(315,150,'Keys and switches',{for:'kb-keys',to:[[235,188],[372,216]]}) + DLB(300,440,'Switch matrix',{for:'kb-matrix',to:[300,402]}) + DLB(885,282,'Controller',{for:'kb-controller',to:[885,316]}) + DLB(838,500,'USB interface',{for:'kb-usb',anchor:'end',to:[860,456]}))};
};

/* ---------------- Inside the mouse ---------------- */
SCENES.mouse = () => {
  let s = TITLE('Optical mouse, side view with the shell cut away (simplified)');
  s += P('M110 430C110 290 210 195 370 190L650 190C790 200 850 300 850 430Z','m-case');
  s += R(190,395,580,22,3,'m-board') + R(300,472,320,8,3,'m-metal2');
  s += `<g class="bg"><path class="arr" d="M282 150V326"/><path class="arr-h" d="M276 326l6 10 6-10Z"/></g>`;
  s += hot('mouse-buttons',[250,332,70,64], R(250,353,64,42,5,'m-metal2') + R(272,336,20,17,2,'m-metal-lt') + `<path class="ln-thin" d="M262 362h40"/>`);
  s += hot('mouse-wheel',[482,262,112,76], C(520,300,36,'m-metal-lt') + `<path class="ln-thin" d="M520 264V336M484 300H556M494 274L546 326M546 274L494 326"/>` + C(520,300,7,'m-hub') + R(566,282,24,36,3,'m-chip'));
  s += hot('mouse-controller',[660,357,80,38], R(660,357,80,38,4,'m-chip') + T(700,381,'MCU','t t-xs t-inv t-mid'));
  s += hot('mouse-sensor',[380,395,150,90], R(420,417,90,26,3,'m-chip') + C(395,426,7,'m-on') + `<path class="ln-dash" d="M395 434L455 472L490 445"/>`);
  s += `<path class="m-cable" d="M770 406H940" style="stroke-width:6"/><g class="bg">${T(890,440,'To the computer','t t-xs t-mut t-mid')}</g>`;
  s += DNOTE('Light from the LED bounces off the desk into the sensor, which photographs the texture thousands of times a second.');
  return {svg: s + LAYER(DLB(262,300,'Buttons',{for:'mouse-buttons',anchor:'end',to:[256,348]}) + DLB(520,226,'Scroll wheel',{for:'mouse-wheel',to:[520,262]}) + DLB(455,522,'Optical sensor',{for:'mouse-sensor',to:[455,487]}) + DLB(700,452,'Controller',{for:'mouse-controller',to:[700,397]}))};
};

/* ---------------- Inside the joystick ---------------- */
SCENES.joystick = () => {
  let s = TITLE('Joystick, side view with the base cut away (simplified)');
  s += R(250,430,500,130,14,'m-case') + R(268,448,464,96,8,'m-cavity');
  s += hot('joy-stick',[450,110,100,370], R(490,190,20,270,6,'m-chip') + `<ellipse cx="500" cy="462" rx="54" ry="20" class="ln-thin"/>` + R(450,110,100,120,34,'m-chip') + C(500,456,22,'m-metal'));
  s += hot('joy-buttons',[[420,146,36,72],[284,414,32,32],[684,414,32,32]], R(424,150,28,64,10,'m-accent') + C(300,430,16,'m-accent') + C(700,430,16,'m-accent'));
  s += hot('joy-sensors',[[290,478,64,50],[646,478,64,50]], R(290,478,64,50,6,'m-metal2') + R(646,478,64,50,6,'m-metal2') + `<path class="ln-thin" d="M354 495L482 464M646 495L518 464"/>`);
  s += `<g class="bg"><polyline class="ln-trace" points="475,513 520,513 520,538 735,538 735,520"/></g>`;
  s += hot('joy-controller',[395,494,80,38], R(395,494,80,38,4,'m-chip') + T(435,517,'MCU','t t-xs t-inv t-mid'));
  s += `<path class="m-cable" d="M735 520H940" style="stroke-width:6"/>`;
  s += `<g class="bg">${T(570,205,'Tilt in any direction','t t-xs t-mut')}</g>`;
  s += DNOTE('Tilting the stick moves the sensors, and they report the angle as a voltage.');
  return {svg: s + LAYER(DLB(578,150,'Stick and gimbal',{for:'joy-stick',anchor:'start',to:[552,150]}) + DLB(392,180,'Trigger',{for:'joy-buttons',anchor:'end',to:[422,180]}) + DLB(300,378,'Buttons',{for:'joy-buttons',to:[300,412]}) + DLB(700,378,'Buttons',{for:'joy-buttons',to:[700,412]}) +
    DLB(296,588,'Position sensors',{for:'joy-sensors',to:[318,530]}) + DLB(704,588,'Position sensors',{for:'joy-sensors',to:[682,530]}) + DLB(470,588,'Controller',{for:'joy-controller',to:[442,534]}))};
};

/* ---------------- Inside the game controller ---------------- */
SCENES.gamepad = () => {
  let s = TITLE('Game controller, seen from above with the top shell removed (simplified)');
  s += P('M250 170H750A110 110 0 0 1 860 280L900 430A60 60 0 0 1 790 480L720 400H280L210 480A60 60 0 0 1 100 430L140 280A110 110 0 0 1 250 170Z','m-case');
  s += R(262,205,476,180,30,'m-board');
  s += `<g class="bg"><polyline class="ln-trace" points="470,237 300,237 300,300 265,300"/><polyline class="ln-trace" points="530,237 700,237 700,300 733,300"/></g>`;
  s += hot('pad-buttons',[[175,255,90,90],[733,248,104,104]], P('M205 255h30v30h30v30h-30v30h-30v-30h-30v-30h30z','m-metal-lt') +
    [[785,265],[785,335],[750,300],[820,300]].map(([x,y]) => C(x,y,17,'m-metal-lt')).join(''));
  s += hot('pad-sticks',[[368,298,84,84],[548,298,84,84]], C(410,340,40,'m-metal2') + C(410,340,24,'m-metal') + C(590,340,40,'m-metal2') + C(590,340,24,'m-metal'));
  s += hot('pad-rumble',[[140,395,64,32],[796,395,64,32]], R(140,395,64,32,14,'m-metal2') + C(178,411,9,'m-hub') + R(796,395,64,32,14,'m-metal2') + C(822,411,9,'m-hub'));
  s += hot('pad-controller',[[470,215,60,44],[430,268,140,40],[486,160,28,20]], R(470,215,60,44,5,'m-chip') + R(430,268,140,40,8,'m-plastic') + T(500,293,'Battery','t t-xs t-inv t-mid') + R(486,164,28,12,3,'m-metal'));
  s += DNOTE('Every input is read by the controller board many times a second and sent to the computer.');
  return {svg: s + LAYER(DLB(220,218,'D-pad',{for:'pad-buttons',to:[220,253]}) + DLB(785,212,'Buttons',{for:'pad-buttons',to:[785,246]}) + DLB(500,126,'Controller and battery',{for:'pad-controller',to:[500,162]}) +
    DLB(410,434,'Thumbstick',{for:'pad-sticks',to:[410,382]}) + DLB(590,434,'Thumbstick',{for:'pad-sticks',to:[590,382]}) + DLB(172,540,'Rumble motor',{for:'pad-rumble',to:[172,429]}) + DLB(828,540,'Rumble motor',{for:'pad-rumble',to:[828,429]}))};
};

/* ---------------- Inside the printer ---------------- */
SCENES.printer = () => {
  let s = TITLE('Inkjet printer, seen from above with the lid removed (simplified)');
  s += R(230,110,540,520,16,'m-case');
  let text = ''; [325,349,373,397].forEach(y => text += `<line class="ln-thin" x1="330" y1="${y}" x2="${y === 397 ? 520 : 650}" y2="${y}"/>`);
  s += R(300,300,380,300,3,'m-panel') + text;
  s += `<g class="bg"><path class="arr" d="M735 590V345"/><path class="arr-h" d="M729 353l6-10 6 10Z"/></g>`;
  s += hot('printer-rollers',[[280,296,420,16],[280,592,420,16]], R(280,296,420,16,8,'m-metal') + R(280,592,420,16,8,'m-metal'));
  s += hot('printer-board',[238,330,36,240], R(238,330,36,240,4,'m-board') + R(244,380,24,30,3,'m-chip') + R(244,430,24,30,3,'m-chip'));
  s += hot('printer-carriage',[250,180,510,70], R(250,190,500,10,5,'m-metal2') + `<path class="ln-thin" d="M262 232H738"/>` + C(262,232,12,'m-metal') + C(738,232,16,'m-chip') + C(738,232,6,'m-hub') + R(440,180,100,64,8,'m-chip'));
  let ink = ''; ['#20B5E6','#E4419B','#F6D523','#2B2B2B'].forEach((c,i) => ink += R(444+i*24,246,20,30,3,'',`style="fill:${c}"`));
  s += hot('printer-cartridge',[440,244,100,40], ink);
  return {svg: s + LAYER(DLB(212,450,'Controller board',{for:'printer-board',anchor:'end',to:[236,450]}) + DLB(212,304,'Paper rollers',{for:'printer-rollers',anchor:'end',to:[278,304]}) + DLB(212,600,'Paper rollers',{for:'printer-rollers',anchor:'end',to:[278,600]}) +
    DLB(785,205,'Carriage and belt',{for:'printer-carriage',anchor:'start',to:[760,205]}) + DLB(566,262,'Ink cartridges',{for:'printer-cartridge',anchor:'start',to:[542,262]}))};
};

/* ---------------- Inside the webcam ---------------- */
SCENES.webcam = () => {
  let s = TITLE('Webcam, side view cut through the middle (simplified)');
  s += R(190,190,620,280,40,'m-case');
  s += `<g class="bg"><path class="ln-dash" d="M90 250L260 290L420 330"/><path class="ln-dash" d="M90 330H420"/><path class="ln-dash" d="M90 410L260 370L420 330"/></g>`;
  let lens = ''; [285,310,335].forEach(x => lens += `<ellipse cx="${x}" cy="330" rx="10" ry="70" class="m-panel"/>`);
  s += hot('webcam-lens',[260,240,140,180], R(260,240,110,180,10,'m-metal') + lens + R(385,250,8,160,1,'m-accent'));
  s += `<g class="bg"><polyline class="ln-trace" points="475,330 520,330"/><polyline class="ln-trace" points="600,330 650,330"/></g>`;
  let px = ''; [280,300,320,340,360].forEach(y => px += R(426,y,18,10,1,'m-gold'));
  s += hot('webcam-sensor',[410,260,66,140], R(455,235,20,190,3,'m-board') + R(420,270,30,120,3,'m-chip') + px);
  s += hot('webcam-isp',[520,280,80,100], R(520,280,80,100,6,'m-chip') + T(560,335,'ISP','t t-xs t-inv t-mid'));
  s += hot('webcam-usb',[[650,290,80,80],[212,222,28,28]], R(650,290,80,80,6,'m-chip') + T(690,335,'USB','t t-xs t-inv t-mid') + C(226,236,8,'m-on'));
  s += `<path class="m-cable" d="M730 330H940" style="stroke-width:7"/>`;
  s += FLOW(560, [[170,'Light'],[315,'Focused'],[435,'Pixel values'],[560,'Video'],[690,'USB data']]);
  return {svg: s + LAYER(DLB(226,160,'LED',{for:'webcam-usb',to:[226,220]}) + DLB(315,160,'Lens',{for:'webcam-lens',to:[315,238]}) + DLB(425,160,'Sensor',{for:'webcam-sensor',to:[435,268]}) + DLB(562,160,'Image processor',{for:'webcam-isp',to:[560,278]}) + DLB(712,160,'USB chip',{for:'webcam-usb',to:[690,288]}))};
};

/* Room for "How it works": its step note sits along the top of these diagrams while it plays, and its
   controls at the bottom right. */
['mic', 'speakers', 'monitor', 'keyboard', 'mouse', 'joystick', 'gamepad', 'printer', 'webcam'].forEach(k => {
  const draw = SCENES[k];
  /* At rest the drawing is big, with just a slim strip at the bottom for the "How it works" button. When the
     animation starts, the view widens smoothly to vbPlay (engine.js), leaving room for the caption at the
     top and the controls at the bottom. Phones and tablets put the caption below the diagram, so there the
     view stays as it is, with a taller strip for the controls. */
  SCENES[k] = n => Object.assign({cls: 'devscene', vb: innerWidth <= 980 ? [0, 0, 1000, 850] : [0, 0, 1000, 770],
    vbPlay: innerWidth <= 980 ? null : [0, -120, 1000, 900]}, draw(n));
});
