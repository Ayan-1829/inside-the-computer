/* ==========================================================
   scenes/devices.js
   "Inside" drawings of the input and output devices: microphone, speakers,
   monitor, keyboard, mouse, joystick, game controller, printer and webcam.
   The parts they draw are defined in data/devices-inside.js.
   ========================================================== */
const ld = (x1,y1,x2,y2) => `<g class="bg"><path class="ln-thin" d="M${x1} ${y1}L${x2} ${y2}"/></g>`;   /* leader line from a part to its label */
const TITLE = t => `<g class="bg">${T(90,70,t,'t t-sm t-mut')}</g>`;
const NOTE = t => `<g class="bg">${T(90,655,t,'t t-sm t-mut')}</g>`;
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
  s += `<g class="bg">${T(242,435,'Diaphragm','t t-xs t-mut t-mid')}${T(322,435,'Backplate','t t-xs t-mut t-mid')}</g>`;
  s += hot('mic-preamp',[410,270,90,60], R(410,270,90,60,6,'m-chip') + T(455,305,'AMP','t t-xs t-inv t-mid'));
  s += hot('mic-adc',[560,270,90,60], R(560,270,90,60,6,'m-chip') + T(605,305,'ADC','t t-xs t-inv t-mid'));
  s += hot('mic-usb',[700,262,220,76], R(700,270,60,60,6,'m-chip') + R(850,266,70,68,8,'m-metal') + R(868,284,34,10,2,'m-slot') + R(868,304,34,10,2,'m-slot'));
  s += FLOW(560, [[255,'Sound waves'],[455,'Weak voltage'],[605,'Stronger voltage'],[730,'Digital numbers'],[885,'USB data']]);
  return {svg: s + LAYER(LB(255,160,'Capsule',{for:'mic-capsule'}) + LB(455,205,'Preamp',{for:'mic-preamp'}) + LB(605,205,'ADC',{for:'mic-adc'}) + LB(810,205,'USB interface',{for:'mic-usb'}))};
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
  s += `<g class="bg">${WAVE(935,260,360,26)}${WAVE(955,235,385,34)}</g>` + ld(772,344,772,390);
  s += FLOW(560, [[175,'Digital audio'],[345,'Small voltage'],[540,'Strong current'],[735,'Coil moves'],[900,'Sound waves']]);
  return {svg: s + LAYER(LB(180,207,'DAC',{for:'speaker-dac'}) + LB(335,207,'Amplifier',{for:'speaker-amp'}) + LB(685,412,'Magnet',{for:'speaker-magnet'}) +
    LB(790,404,'Voice coil',{for:'speaker-coil'}) + LB(880,470,'Cone',{for:'speaker-cone'}))};
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
  s += `<g class="bg">${T(385,600,'Polarizer, transistor glass, liquid crystal, colour filter, polarizer','t t-xs t-mut t-mid')}</g>` + NOTE('The backlight makes the light. The liquid crystal only decides how much of it each subpixel lets through.');
  return {svg: s + LAYER(LB(135,152,'Power board',{for:'monitor-power'}) + LB(135,492,'Controller board',{for:'monitor-controller'}) + LB(104,388,'Video inputs',{for:'monitor-ports',anchor:'end'}) +
    LB(258,548,'Backlight',{for:'monitor-backlight'}) + LB(385,148,'LCD panel',{for:'monitor-panel'}))};
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
  return {svg: s + LAYER(LB(315,155,'Keys and switches',{for:'kb-keys'}) + LB(300,440,'Switch matrix',{for:'kb-matrix'}) + LB(885,296,'Controller',{for:'kb-controller'}) + LB(838,500,'USB interface',{for:'kb-usb',anchor:'end'}))};
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
  s += ld(520,262,520,178);
  s += NOTE('Light from the LED bounces off the desk into the sensor, which photographs the texture thousands of times a second.');
  return {svg: s + LAYER(LB(282,125,'Buttons',{for:'mouse-buttons'}) + LB(520,160,'Scroll wheel',{for:'mouse-wheel'}) + LB(455,510,'Optical sensor',{for:'mouse-sensor'}) + LB(700,458,'Controller',{for:'mouse-controller'}))};
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
  s += `<g class="bg">${T(570,205,'Tilt in any direction','t t-xs t-mut')}</g>` + ld(322,528,322,575) + ld(678,528,678,575) + ld(435,532,435,575);
  s += NOTE('Tilting the stick moves the sensors, and they report the angle as a voltage.');
  return {svg: s + LAYER(LB(575,150,'Stick and gimbal',{for:'joy-stick',anchor:'start'}) + LB(415,180,'Trigger',{for:'joy-buttons',anchor:'end'}) + LB(300,395,'Buttons',{for:'joy-buttons'}) +
    LB(322,592,'Position sensors',{for:'joy-sensors'}) + LB(678,592,'Position sensors',{for:'joy-sensors'}) + LB(450,592,'Controller',{for:'joy-controller'}))};
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
  s += ld(220,255,220,158) + ld(785,248,785,158) + ld(500,160,500,146) + ld(410,380,410,530) + ld(590,380,590,530) + ld(172,427,172,530) + ld(828,427,828,530);
  s += NOTE('Every input is read by the controller board many times a second and sent to the computer.');
  return {svg: s + LAYER(LB(220,140,'D-pad',{for:'pad-buttons'}) + LB(785,140,'Buttons',{for:'pad-buttons'}) + LB(500,130,'Controller and battery',{for:'pad-controller'}) +
    LB(410,545,'Thumbstick',{for:'pad-sticks'}) + LB(590,545,'Thumbstick',{for:'pad-sticks'}) + LB(172,545,'Rumble motor',{for:'pad-rumble'}) + LB(828,545,'Rumble motor',{for:'pad-rumble'}))};
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
  s += ld(238,450,220,450) + ld(280,304,220,304) + ld(280,600,220,600) + ld(750,205,780,205) + ld(540,262,780,262);
  return {svg: s + LAYER(LB(215,450,'Controller board',{for:'printer-board',anchor:'end'}) + LB(215,304,'Paper rollers',{for:'printer-rollers',anchor:'end'}) + LB(215,600,'Paper rollers',{for:'printer-rollers',anchor:'end'}) +
    LB(785,205,'Carriage and belt',{for:'printer-carriage',anchor:'start'}) + LB(785,262,'Ink cartridges',{for:'printer-cartridge',anchor:'start'}))};
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
  s += ld(226,222,226,175) + ld(315,240,315,175) + ld(433,260,433,175) + ld(560,280,560,175) + ld(690,290,690,175);
  s += FLOW(560, [[170,'Light'],[315,'Focused'],[435,'Pixel values'],[560,'Video'],[690,'USB data']]);
  return {svg: s + LAYER(LB(226,160,'LED',{for:'webcam-usb'}) + LB(315,160,'Lens',{for:'webcam-lens'}) + LB(433,160,'Sensor',{for:'webcam-sensor'}) + LB(560,160,'Image processor',{for:'webcam-isp'}) + LB(690,160,'USB and LED',{for:'webcam-usb'}))};
};
