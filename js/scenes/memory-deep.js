/* ==========================================================
   scenes/memory-deep.js
   "Inside" drawings of the memory parts: a DRAM chip, one DRAM cell, SRAM, the SPD chip,
   the CPU caches and NAND flash. The parts they draw are defined in data/memory-deep.js.
   Helpers (ld, TITLE, NOTE, FLOW) come from scenes/devices.js.
   ========================================================== */

/* ---------------- Inside a DRAM chip ---------------- */
SCENES.dram = () => {
  let s = TITLE('DRAM chip, floorplan of the silicon die (simplified)');
  s += `<g class="bg">${R(100,125,650,400,10,'m-die')}</g>`;
  const xs = [0,1,2,3].map(i => 126 + i*158), rows = [[135,259],[395,379]];   /* bank y, sense-amp y */
  let banks = '', dec = '', amps = '', boxB = [], boxD = [], boxA = [];
  rows.forEach(([by, ay]) => xs.forEach(x => {
    const bank = [x,by,130,120], d = [x-14,by,10,120], a = [x,ay,130,12];
    banks += R(...bank,4,'m-die-block') + T(x+65,by+96,'Bank','t t-xs t-die t-mid');
    dec += R(...d,2,'m-die-cell'); amps += R(...a,2,'m-die-cell'); boxB.push(bank); boxD.push(d); boxA.push(a);
  }));
  s += hot('dram-banks', boxB, banks, {pad:3, rx:6});
  s += hot('dram-row-decoder', boxD, dec, {pad:3, rx:4});
  s += hot('dram-sense-amps', boxA, amps, {pad:3, rx:4});
  s += hot('dram-control', [126,292,270,66], R(126,292,270,66,5,'m-die-block') + T(261,325,'Command decoder, refresh, timing','t t-xs t-die t-mid'));
  s += hot('dram-column-io', [416,292,186,66], R(416,292,186,66,5,'m-die-block') + T(509,318,'Column select + data','t t-xs t-die t-mid'));
  s += hot('dram-io', [622,292,110,66], R(622,292,110,66,5,'m-die-block') + T(677,325,'I/O, data pins','t t-xs t-die t-mid'));
  s += ld(750,385,732,385) + ld(275,113,275,138);
  s += FLOW(600, [[170,'Command + address'],[330,'Row opens'],[490,'Sense amps read the row'],[660,'Column picks bits'],[850,'Data on the pins']]);
  return {svg: s + LAYER(LB(191,167,'Memory banks',{for:'dram-banks',tone:'inv'}) + LB(270,104,'Row decoders',{for:'dram-row-decoder'}) +
    LB(768,385,'Sense amplifiers',{for:'dram-sense-amps',anchor:'start'}) + LB(261,343,'Control',{for:'dram-control',tone:'inv',size:16}) +
    LB(509,343,'Column I/O',{for:'dram-column-io',tone:'inv',size:16}) + LB(677,343,'I/O',{for:'dram-io',tone:'inv',size:16}))};
};

/* ---------------- Inside one DRAM cell ---------------- */
SCENES.cells = () => {
  let s = TITLE('One DRAM cell: a transistor and a capacitor (schematic)');
  s += hot('cell-transistor', [410,285,110,80], R(410,285,110,80,6,'m-chip') + T(465,352,'Transistor','t t-xs t-inv t-mid'));
  s += `<g class="bg"><path class="ln" d="M520 305H608V285"/><path class="ln" d="M608 365V420"/><path class="ln" d="M590 420H626M598 430H618M604 440H612"/>${T(608,462,'Ground','t t-xs t-mut t-mid')}</g>`;
  s += hot('cell-capacitor', [590,285,40,80], R(590,285,8,80,1,'m-metal2') + R(622,285,8,80,1,'m-metal2') + R(598,290,24,70,0,'m-on','style="opacity:.35"'));
  s += hot('cell-bitline', [388,150,24,450], R(388,150,24,450,3,'m-metal2'));
  s += hot('cell-wordline', [150,318,700,14], R(150,318,700,14,3,'m-accent'));
  s += `<g class="bg">${T(608,268,'Charge = the bit','t t-xs t-mut t-mid')}</g>`;
  s += NOTE('Word line high: the capacitor connects to the bit line. Charged is 1, empty is 0.');
  return {svg: s + LAYER(LB(400,128,'Bit line',{for:'cell-bitline'}) + LB(850,296,'Word line',{for:'cell-wordline',anchor:'end'}) +
    LB(608,236,'Capacitor',{for:'cell-capacitor'}) + LB(465,392,'Access transistor',{for:'cell-transistor'}))};
};

/* ---------------- Inside SRAM ---------------- */
SCENES.sram = () => {
  let s = TITLE('SRAM array and one six-transistor cell (simplified)');
  let cells = '', wl = '', bl = '';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) cells += R(130 + c*66, 170 + r*66, 56, 56, 6, 'm-chip') + T(158 + c*66, 203 + r*66, '6T', 't t-xs t-inv t-mid');
  for (let r = 0; r < 4; r++) wl += `<line class="ln-thin" x1="122" y1="${198 + r*66}" x2="392" y2="${198 + r*66}"/>`;
  for (let c = 0; c < 4; c++) bl += `<line class="ln-thin" x1="${158 + c*66}" y1="166" x2="${158 + c*66}" y2="440"/>`;
  const a = gsym('NOT',650,230,.8,2.5);
  const zoom = `${R(526,184,320,286,10,'m-panel')}${R(520,190,340,10,2,'m-accent')}${R(534,200,8,270,2,'m-metal2')}${R(830,200,8,270,2,'m-metal2')}
    ${a.svg}<g transform="translate(1364 0) scale(-1 1)">${gsym('NOT',650,340,.8,2.5).svg}</g>
    <path class="ln" d="M714 262H740V372H714M650 372H626V262H650"/>
    <path class="ln" d="M626 317H606M740 317H760"/>
    ${R(566,300,40,34,5,'m-chip')}${T(586,322,'T','t t-xs t-inv t-mid')}${R(760,300,40,34,5,'m-chip')}${T(780,322,'T','t t-xs t-inv t-mid')}
    <path class="ln" d="M566 317H542M800 317H830"/><path class="ln-thin" d="M586 200V300M780 200V300"/>
    ${T(686,428,'Two inverters hold each other','t t-xs t-mut t-mid')}${T(686,448,'6 transistors, no refresh','t t-xs t-mut t-mid')}`;
  s += hot('sram-cell', [[126,166,262,262],[526,184,320,286]], `<g class="bg"><path class="ln-dash" d="M318 236L526 184M318 292L526 470"/></g>` + cells + wl + bl + zoom, {pad:4});
  s += hot('sram-decoder', [72,166,44,262], R(72,166,44,262,5,'m-chip') + T(94,300,'Row','t t-xs t-inv t-mid'));
  s += hot('sram-sense', [126,440,262,34], R(126,440,262,34,5,'m-chip') + T(257,462,'Sense amplifiers','t t-xs t-inv t-mid'));
  s += FLOW(590, [[94,'Row address'],[257,'Word line on'],[420,'Cells drive bit lines'],[690,'Sense amp reads'],[880,'Data out']]);
  return {svg: s + LAYER(LB(94,146,'Row decoder',{for:'sram-decoder'}) + LB(257,146,'Array of cells',{for:'sram-cell'}) + LB(686,164,'Six-transistor cell',{for:'sram-cell'}) + LB(257,492,'Sense amps',{for:'sram-sense'}))};
};

/* ---------------- Inside the SPD chip ---------------- */
SCENES.spd = () => {
  let s = TITLE('SPD hub chip on a memory module (simplified)');
  s += `<g class="bg">${R(330,230,300,200,10,'m-chip')}${R(745,260,170,140,8,'m-board')}${T(830,336,'Motherboard','t t-sm t-inv t-mid')}${T(830,358,'memory controller','t t-xs t-inv t-mid')}</g>`;
  s += hot('spd-eeprom', [350,270,120,120], R(350,270,120,120,6,'m-panel') + T(410,318,'Speed','t t-xs t-mid') + T(410,338,'Timings','t t-xs t-mid') + T(410,358,'Size, maker','t t-xs t-mid'));
  s += hot('spd-sensor', [490,270,120,50], R(490,270,120,50,6,'m-panel') + T(550,301,'Thermometer','t t-xs t-mid'));
  s += hot('spd-bus', [[490,340,120,50],[610,340,150,40]], R(490,340,120,50,6,'m-panel') + T(550,371,'Bus interface','t t-xs t-mid') +
    `<path class="ln" d="M610 352H760"/><path class="ln" d="M610 376H760"/>${T(700,346,'SDA','t t-xs t-mut t-mid')}${T(700,394,'SCL','t t-xs t-mut t-mid')}`);
  s += FLOW(560, [[410,'Stored table'],[550,'Temperature'],[690,'Two-wire bus'],[830,'Read at start-up']]);
  return {svg: s + LAYER(LB(410,250,'EEPROM',{for:'spd-eeprom',size:16,tone:'inv'}) + LB(550,250,'Sensor',{for:'spd-sensor',size:16,tone:'inv'}) + LB(690,318,'Serial bus',{for:'spd-bus',size:16}))};
};

/* ---------------- The CPU cache hierarchy ---------------- */
SCENES.cache = () => {
  let s = TITLE('CPU cache levels, and what one cache line holds (simplified)');
  const arr = (x1,x2,y) => `<path class="arr" d="M${x1} ${y}H${x2}"/><path class="arr-h" d="M${x2} ${y-6}l10 6-10 6Z"/>`;
  s += `<g class="bg">${R(90,190,110,100,8,'m-chip')}${T(145,244,'Core','t t-sm t-inv t-mid')}${R(710,160,190,160,8,'m-board')}${T(805,244,'RAM','t t-sm t-inv t-mid')}
    ${arr(200,236,240)}${arr(330,356,240)}${arr(470,496,240)}${arr(650,706,240)}
    ${T(285,330,'~4 cycles','t t-xs t-mut t-mid')}${T(415,330,'~14 cycles','t t-xs t-mut t-mid')}${T(575,330,'~40 cycles','t t-xs t-mut t-mid')}${T(805,340,'~200+ cycles','t t-xs t-mut t-mid')}</g>`;
  s += hot('cache-l1', [240,200,90,80], R(240,200,90,80,6,'m-chip') + T(285,246,'L1','t t-sm t-inv t-mid'));
  s += hot('cache-l2', [360,185,110,110], R(360,185,110,110,6,'m-chip') + T(415,246,'L2','t t-sm t-inv t-mid'));
  s += hot('cache-l3', [500,170,150,140], R(500,170,150,140,6,'m-chip') + T(575,246,'L3','t t-sm t-inv t-mid'));
  let rows = '';
  [0,1,2].forEach(i => rows += R(240,432+i*32,40,26,3,'m-on') + R(286,432+i*32,120,26,3,'m-chip') + R(412,432+i*32,260,26,3,'m-panel') + T(542,450+i*32,i === 1 ? '64 bytes of data' : '…','t t-xs t-mid'));
  s += `<g class="bg"><path class="ln-dash" d="M415 295L340 410"/>${T(260,420,'Valid','t t-xs t-mut t-mid')}${T(346,420,'Tag','t t-xs t-mut t-mid')}${T(542,420,'Data','t t-xs t-mut t-mid')}</g>`;
  s += hot('cache-tags', [240,432,166,90], rows, {pad:6});
  return {svg: s + LAYER(LB(285,150,'L1 cache',{for:'cache-l1'}) + LB(415,150,'L2 cache',{for:'cache-l2'}) + LB(575,150,'L3 cache',{for:'cache-l3'}) + LB(323,560,'Tag and valid bit',{for:'cache-tags'}))};
};

/* ---------------- Inside NAND flash ---------------- */
SCENES.nand = () => {
  let s = TITLE('NAND flash die: plane, block, page (simplified)');
  s += hot('nand-plane', [90,150,260,300], R(90,150,260,300,10,'m-panel'));
  let blocks = ''; for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) blocks += R(106 + c*58, 166 + r*46, 50, 38, 4, (r === 2 && c === 1) ? 'm-on' : 'm-chip');
  s += `<g class="bg">${blocks}<path class="ln-dash" d="M212 250L420 150M212 288L420 400"/></g>`;
  s += hot('nand-block', [420,150,220,250], R(420,150,220,250,8,'m-panel'));
  let pages = ''; for (let i = 0; i < 8; i++) pages += R(430,158 + i*28,200,24,3,'m-chip') + T(530,176 + i*28,'Page ' + (i+1),'t t-xs t-inv t-mid');
  s += hot('nand-page', [430,160,200,224], pages, {pad:4});
  let bl = ''; [450,490,530,570,610].forEach(x => bl += `<line class="ln-thin" x1="${x}" y1="400" x2="${x}" y2="430"/>`);
  s += bl + hot('nand-buffer', [420,430,220,40], R(420,430,220,40,6,'m-chip') + T(530,455,'Page buffer','t t-xs t-inv t-mid'));
  s += `<g class="bg">${T(690,240,'Read or write:','t t-xs t-mut')}${T(690,262,'one page at a time','t t-sm t-mut')}${T(690,320,'Erase:','t t-xs t-mut')}${T(690,342,'a whole block at once','t t-sm t-mut')}</g>`;
  s += NOTE('The SSD controller copies live pages elsewhere before it erases a block.');
  return {svg: s + LAYER(LB(220,128,'Plane',{for:'nand-plane'}) + LB(530,128,'Block (erase unit)',{for:'nand-block'}) + LB(690,204,'Pages',{for:'nand-page',anchor:'start'}) + LB(530,494,'Page buffer',{for:'nand-buffer'}))};
};
