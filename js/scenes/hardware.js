/* ==========================================================
   scenes/hardware.js
   Level 1 and Level 2 drawings: the PC, motherboard, RAM, GPU,
   storage, power supply, cooling and rear I/O panel.
   ========================================================== */
/* ---------------- Level 1: the computer and its devices ----------------
   The tower is drawn in its own coordinates (the original 1000×700 layout)
   and scaled into place; `tp()` converts tower coordinates to scene
   coordinates for the labels. Every part except the motherboard can be
   dragged (see DW in common.js). */
SCENES.pc = () => {
  const S = .78, TX = 372.8, TY = 103.2, tp = (x,y) => [TX + x*S, TY + y*S];
  let s = '', L = '';
  /* cables from the devices to the tower (hidden once parts are moved) */
  s += `<g class="bg conn">${['M430 236C500 236 520 215 562 215','M256 104C330 60 520 80 562 205','M510 300C535 300 540 240 562 240',
     'M400 440C480 440 520 262 562 262','M468 436C510 420 530 285 562 285','M546 530C556 470 548 320 562 312','M420 566C500 566 540 340 562 338']
     .map(d => `<path class="ln-dash" d="${d}"/>`).join('')}</g>`;

  /* ---- tower ---- */
  s += `<g transform="translate(${TX} ${TY}) scale(${S})">`;
  s += `<g class="bg">${R(262,668,60,10,3,'m-case')}${R(698,668,60,10,3,'m-case')}
    ${R(240,60,540,612,18,'m-case')}${R(262,82,476,568,8,'m-cavity')}
    ${C(759,112,9,'m-panel')}${R(752,140,14,4,2,'m-accent')}${R(262,520,476,130,6,'m-case')}</g>`;
  let traces = '';
  [[330,300,420,300,420,215],[330,330,560,330,560,145],[540,480,540,440,600,440],[340,470,340,450,500,450],[600,150,600,120,470,120]].forEach(p => traces += `<polyline class="ln-trace" points="${p.join(',')}"/>`);
  s += hot('motherboard',[300,100,330,400], R(300,100,330,400,6,'m-board') + traces, {flat:true});
  s += `<g class="ov cables"><path class="m-cable" d="M470 560 C 470 500, 640 500, 624 330"/><path class="m-cable" d="M430 560 C 420 520, 380 470, 355 300" style="stroke-width:8"/></g>`;
  let ports = ''; [120,146,172,198].forEach(y => ports += R(273,y,30,18,3,'m-slot')); ports += C(288,232,6,'m-slot') + C(288,250,6,'m-slot');
  s += DW('io', hot('io',[268,110,40,152], R(268,110,40,152,5,'m-metal') + ports));
  s += DW('cpu', hot('cpu',[420,165,100,100], R(420,165,100,100,8,'m-metal-lt') + R(434,179,72,72,6,'m-metal')));
  let sticks = ''; [553,569,585,601].forEach(x => sticks += R(x,140,10,200,2,'m-chip') + R(x+2,148,6,184,1,'m-plastic'));
  s += DW('ram', hot('ram',[550,136,64,208], sticks));
  const fan = (cx,cy,r) => { let b = ''; for (let i=0;i<5;i++) b += `<path transform="rotate(${i*72} ${cx} ${cy})" d="M${cx} ${cy} C ${cx+r*.25} ${cy-r*.6}, ${cx+r*.7} ${cy-r*.6}, ${cx+r*.82} ${cy-r*.28} C ${cx+r*.5} ${cy-r*.26}, ${cx+r*.25} ${cy-r*.1}, ${cx} ${cy}Z"/>`;
    return R(cx-r-4,cy-r-4,2*r+8,2*r+8,10,'m-fan') + `<g class="blades">${b}</g>` + C(cx,cy,r*.24,'m-hub'); };
  s += DW('cooling', hot('cooling',[638,110,96,240], fan(686,160,44) + fan(686,300,44)));
  s += DW('gpu', hot('gpu',[300,378,410,62], R(296,372,14,72,2,'m-metal') + R(310,380,400,56,8,'m-chip') +
      C(450,408,21,'m-plastic') + C(570,408,21,'m-plastic') + C(450,408,6,'m-hub') + C(570,408,6,'m-hub')));
  /* fan kept to the left so the "Power supply" label has clear space beside it */
  let grille = ''; for (let i=-2;i<=2;i++) grille += `<line class="ln-thin" x1="${300+i*7}" y1="562" x2="${300+i*7}" y2="598"/>`;
  s += DW('psu', hot('psu',[272,534,210,92], R(272,534,210,92,6,'m-metal2') + C(300,580,22,'m-metal-lt') + grille));
  s += DW('storage', hot('storage',[562,536,164,86], R(566,540,156,38,5,'m-metal') + C(592,559,12,'m-metal-lt') + R(566,586,156,30,5,'m-metal-lt')));
  s += `</g>`;

  /* ---- devices ---- */
  s += DW('monitor', hot('monitor',[40,110,390,292], R(40,110,390,250,16,'m-chip') + R(54,124,362,212,6,'m-screen') +
    R(84,146,190,120,6,'m-panel') + R(84,146,190,22,6,'m-block') + R(250,190,140,104,6,'m-panel') + R(54,318,362,18,4,'m-chip') +
    R(214,360,42,32,4,'m-metal') + R(160,390,150,12,6,'m-metal')));
  s += DW('webcam', hot('webcam',[214,94,42,20], R(214,94,42,20,10,'m-chip') + C(235,104,5,'m-screen') + C(235,104,2,'m-metal-lt'), {hit:true, pad:6}));
  s += DW('speakers', hot('speakers',[448,196,62,164], R(448,196,62,164,12,'m-chip') + C(479,236,11,'m-metal2') + C(479,236,4,'m-hub') + C(479,306,24,'m-metal2') + C(479,306,8,'m-hub')));
  let keys = ''; for (let r=0;r<3;r++) for (let c=0;c<14;c++) keys += R(54+c*24.5,436+r*16,20,12,3,'m-metal-lt');
  keys += [54,78.5,103].map(x => R(x,484,20,12,3,'m-metal-lt')).join('') + R(128,484,170,12,3,'m-metal-lt') + [303,327.5,352,376.5].map(x => R(x,484,16,12,3,'m-metal-lt')).join('');
  s += DW('keyboard', hot('keyboard',[40,424,360,82], R(40,424,360,82,12,'m-case') + keys));
  s += DW('mouse', hot('mouse',[420,424,48,76], R(420,424,48,76,24,'m-case') + `<line class="ln-thin" x1="444" y1="424" x2="444" y2="454"/>` + R(440,434,8,14,4,'m-chip')));
  s += DW('joystick', hot('joystick',[482,436,64,118], R(482,520,64,34,10,'m-chip') + `<path d="M514 522V470" style="fill:none;stroke:var(--i-chip);stroke-width:9;stroke-linecap:round"/>` +
    R(501,436,26,46,12,'m-chip') + C(514,447,4.5,'m-accent') + C(532,537,5,'m-metal2')));
  s += DW('gamepad', hot('gamepad',[46,540,168,68], P('M78 540H182A26 26 0 0 1 208 566L214 598A14 14 0 0 1 188 604L172 584H88L72 604A14 14 0 0 1 46 598L52 566A26 26 0 0 1 78 540Z','m-chip') +
    P('M84 556h8v8h8v8h-8v8h-8v-8h-8v-8h8Z','m-metal-lt') + [[170,554],[181,565],[159,565],[170,576]].map(([x,y]) => C(x,y,4.5,'m-metal-lt')).join('') + C(112,580,8,'m-metal2') + C(146,580,8,'m-metal2')));
  s += DW('printer', hot('printer',[240,512,180,88], R(284,512,92,28,2,'m-panel') + R(270,528,120,14,4,'m-metal') + R(240,540,180,60,10,'m-case') + R(268,556,124,6,3,'m-chip') + R(284,560,92,8,1,'m-panel') + C(398,582,6,'m-accent')));

  /* ---- labels (top layer) ---- */
  L += LB(235,296,'Monitor',{for:'monitor',dot:'out',tone:'inv'}) + LB(264,90,'Webcam',{for:'webcam',dot:'in',anchor:'start'}) + LB(479,180,'Speakers',{for:'speakers',dot:'out'}) +
       LB(220,472,'Keyboard',{for:'keyboard',dot:'in'}) + LB(444,410,'Mouse',{for:'mouse',dot:'in'}) + LB(505,572,'Joystick',{for:'joystick',dot:'in'}) +
       LB(130,626,'Game controller',{for:'gamepad',dot:'in'}) + LB(330,626,'Printer',{for:'printer',dot:'out'});
  [['io',288,100,'I/O'],['cpu',470,215,'CPU'],['ram',582,122,'RAM',1],['cooling',686,230,'Cooling'],['gpu',380,408,'GPU',1],
   ['motherboard',470,482,'Motherboard',1],['psu',404,580,'Power supply',1,15],['storage',644,580,'Storage']].forEach(([id,x,y,t,inv,size]) => { const [a,b] = tp(x,y); L += LB(a,b,t,{for:id,size:size||16,tone:inv?'inv':''}); });
  L += `<g class="legend"><circle class="lbl-dot in" cx="604" cy="666" r="6"/>${T(616,672,'Input device','')}<circle class="lbl-dot out" cx="760" cy="666" r="6"/>${T(772,672,'Output device','')}</g>`;
  return {svg: s + LAYER(L), drag: true};
};

/* ---------------- Motherboard ---------------- */
SCENES.board = () => {
  let tr = ''; [[300,340,400,340,400,420],[610,200,700,200],[520,330,520,380,600,380],[300,560,360,560,360,620],[720,420,720,540],[430,470,600,470]].forEach(p => tr += `<polyline class="ln-trace" points="${p.join(',')}"/>`);
  let s = `<g class="bg">${R(250,70,480,590,10,'m-board')}${tr}
    ${R(262,90,50,210,5,'m-metal')}${[100,130,160,190,220].map(y => R(270,y,34,20,3,'m-slot')).join('')}${T(287,320,'Rear I/O','t t-xs t-inv t-mid')}
    ${R(706,180,16,120,3,'m-slot')}<text class="t t-xs t-inv t-mid" transform="translate(744 240) rotate(-90)">24-pin</text>
    ${[560,585,610].map(y => R(690,y,28,16,3,'m-slot')).join('')}${T(704,648,'SATA','t t-xs t-inv t-mid')}</g>`;
  let fins = ''; for (let i=0;i<9;i++) fins += `<line class="ln-thin" x1="334" y1="${122+i*24}" x2="376" y2="${122+i*24}"/>`;
  s += DW('vrm', hot('vrm',[330,110,80,220], R(330,110,50,220,6,'m-metal2') + fins + [130,170,210,250,290].map(y => R(388,y,20,20,3,'m-metal')).join('')));
  let grid = ''; for (let r=0;r<9;r++) for (let c=0;c<9;c++) grid += C(466+c*11,186+r*11,2,'m-gold');
  s += DW('cpu-socket', hot('cpu-socket',[430,150,160,160], R(430,150,160,160,10,'m-metal-lt') + R(450,170,120,120,6,'m-metal2') + grid + `<line class="ln" x1="596" y1="160" x2="596" y2="300" style="stroke-width:4"/>`));
  s += DW('ram-slots', hot('ram-slots',[620,98,80,284], [625,645,665,685].map(x => R(x,100,10,280,2,'m-slot') + R(x-1,94,12,8,2,'m-metal-lt') + R(x-1,378,12,8,2,'m-metal-lt')).join('')));
  s += DW('pcie', hot('pcie',[286,398,312,124], R(290,400,300,18,3,'m-slot') + R(290,450,60,14,3,'m-slot') + R(380,448,200,22,3,'m-metal-lt') + C(596,459,6,'m-metal') + T(480,465,'M.2','t t-xs t-mid') + R(290,500,300,18,3,'m-slot')));
  s += DW('chipset', hot('chipset',[612,440,90,90], R(612,440,90,90,8,'m-metal2') + [0,1,2,3,4].map(i => `<line class="ln-thin" x1="${626+i*15}" y1="452" x2="${626+i*15}" y2="518"/>`).join('')));
  s += DW('bios', hot('bios',[372,566,140,50], C(398,591,22,'m-metal-lt') + T(398,597,'3V','t t-xs t-mid') + R(462,578,40,26,3,'m-chip')));
  const L = LB(370,354,'VRM',{for:'vrm',tone:'inv'}) + LB(510,334,'CPU socket',{for:'cpu-socket',tone:'inv'}) + LB(660,404,'RAM slots',{for:'ram-slots',tone:'inv'}) +
    LB(290,544,'PCIe slots',{for:'pcie',anchor:'start',tone:'inv'}) + LB(657,552,'Chipset',{for:'chipset',tone:'inv'}) + LB(442,638,'BIOS / UEFI',{for:'bios',tone:'inv'});
  return {svg: s + LAYER(L), drag: true};
};

/* ---------------- RAM ---------------- */
SCENES.ram = () => {
  let gold=''; for (let x=122;x<878;x+=11){ if (x>495 && x<522) continue; gold += R(x,238,7,22,1.5,'m-gold'); }
  let s = `<g class="bg">${R(110,90,780,170,6,'m-board')}${gold}${R(498,244,20,20,3,'','style="fill:var(--surface)"')}
    ${T(110,285,'DDR5 memory stick (DIMM)','t t-sm t-mut')}
    <path class="ln-dash" d="M295 215L110 330M365 215L510 330"/></g>`;
  const chips = [135,215,295,375,555,635,715,795].map(x => R(x,115,70,100,4,'m-chip')+T(x+35,172,'DRAM','t t-xs t-inv t-mid')).join('');
  s += hot('dram',[[135,115,310,100],[555,115,310,100]], chips);
  s += hot('spd',[472,120,56,70], R(478,126,44,30,3,'m-chip')+R(484,166,32,20,3,'m-chip'));
  let cells=''; const on = (r,c) => ((r*7+c*3)%5)<2;
  for (let r=0;r<7;r++) cells += `<line class="ln-thin" x1="140" y1="${400+r*30}" x2="484" y2="${400+r*30}"/>`;
  for (let c=0;c<12;c++) cells += `<line class="ln-thin" x1="${150+c*28}" y1="388" x2="${150+c*28}" y2="592"/>`;
  for (let r=0;r<7;r++) for (let c=0;c<12;c++) cells += R(143+c*28,393+r*30,14,14,3,'bit'+(on(r,c)?' on':''));
  s += hot('memory-cells',[110,330,400,310], R(110,330,400,310,14,'m-panel')+T(130,360,'Memory cell array','t')+cells+T(130,612,'Rows are word lines; columns are bit lines.','t t-xs t-mut')+T(130,630,'A charged cell stores a 1.','t t-xs t-mut'));
  const i1 = gsym('NOT',650,420,.8,2.5);
  s += hot('sram',[560,330,330,310], R(560,330,330,310,14,'m-panel')+T(580,360,'SRAM cell (used in cache)','t')+
    `<g transform="translate(1455 0) scale(-1 1)">${gsym('NOT',650,480,.8,2.5).svg}</g>`+
    `<path class="ln" d="M${i1.o[0]} ${i1.o[1]}H842V512H802M731 512H618V452H654"/>`+i1.svg+
    R(590,540,46,34,6,'m-block')+T(613,562,'T','t t-xs t-mid')+R(794,540,46,34,6,'m-block')+T(817,562,'T','t t-xs t-mid')+
    T(580,606,'Two inverters hold each other in place.','t t-xs t-mut')+T(580,626,'6 transistors per bit, no refresh.','t t-xs t-mut'));
  return {svg: s + LAYER(LB(500,214,'SPD',{for:'spd',size:15,tone:'inv'}) + LB(290,228,'DRAM chips',{for:'dram',tone:'inv'}) + LB(710,228,'DRAM chips',{for:'dram',tone:'inv'}))};
};

/* ---------------- GPU ---------------- */
SCENES.gpu = () => {
  let s = `<g class="bg">${R(70,180,420,290,8,'m-board')}${[0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(i=>R(206+i*15,472,10,16,1.5,'m-gold')).join('')}
    ${R(430,190,46,22,3,'m-slot')}${T(40,560,'Graphics card, cooler removed','t t-sm t-mut')}
    <path class="ln-dash" d="M325 270L540 110M325 370L540 630"/></g>`;
  s += hot('display-outputs',[48,170,24,310], R(48,170,22,310,3,'m-metal')+[200,250,300].map(y=>R(52,y,14,34,3,'m-slot')).join('')+R(52,360,14,40,3,'m-slot'));
  const vr = [[190,200,48,34],[250,200,48,34],[310,200,48,34],[190,406,48,34],[250,406,48,34],[310,406,48,34],[372,258,34,48],[372,334,34,48]];
  s += hot('vram',[180,196,232,248], vr.map(v=>R(...v,3,'m-chip')).join(''),{label:'VRAM chips'});
  s += `<g class="bg">${R(200,245,150,150,8,'m-chip')}${R(225,270,100,100,5,'m-die')}${T(275,325,'GPU','t t-sm t-die t-mid')}</g>`;
  s += `<g class="bg">${R(540,110,400,520,12,'m-die')}${R(605,485,270,56,6,'m-die-block')}${T(740,518,'L2 cache','t t-sm t-die t-mid')}
    ${R(605,556,130,54,6,'m-die-block')}${T(670,588,'Display, media','t t-xs t-die t-mid')}${R(745,556,130,54,6,'m-die-block')}${T(810,588,'PCIe link','t t-xs t-die t-mid')}
    ${T(740,660,'GPU die, simplified floorplan','t t-sm t-mut t-mid')}</g>`;
  let mc=''; for (let i=0;i<6;i++){ mc += R(556,130+i*80,34,70,4,'m-die-block') + R(890,130+i*80,34,70,4,'m-die-block'); }
  s += hot('memory-controller',[[556,130,34,470],[890,130,34,470]], mc,{pad:5});
  let cu=''; for (let r=0;r<6;r++) for (let c=0;c<5;c++){ const x=608+c*54, y=132+r*56; cu += R(x,y,48,50,4,'m-die-block')+R(x+6,y+8,36,8,2,'m-die-cell')+R(x+6,y+22,36,8,2,'m-die-cell')+R(x+6,y+36,36,8,2,'m-die-cell'); }
  s += hot('compute-units',[606,130,272,340], cu,{pad:5});
  return {svg: s + LAYER(LB(292,462,'VRAM chips',{for:'vram',tone:'inv'}) + LB(40,512,'Display outputs',{for:'display-outputs',anchor:'start'}) +
    LB(742,300,'Compute units',{for:'compute-units',tone:'inv'}) + LB(556,94,'Memory controllers',{for:'memory-controller',anchor:'start'}))};
};

/* ---------------- Storage ---------------- */
SCENES.storage = () => {
  let s = '';
  s += hot('ssd',[64,240,430,210],
    T(80,262,'M.2 NVMe SSD','t')+R(80,290,400,100,6,'m-board')+[0,1,2,3,4,5].map(i=>R(68,300+i*13,14,8,1.5,'m-gold')).join('')+C(480,340,9,'m-hole')+
    R(120,310,60,60,4,'m-chip')+R(195,318,40,44,3,'m-chip')+R(255,305,95,70,4,'m-chip')+R(362,305,95,70,4,'m-chip')+
    T(305,345,'NAND','t t-xs t-inv t-mid')+T(410,345,'NAND','t t-xs t-inv t-mid')+
    T(150,414,'Controller','t t-xs t-mut t-mid')+T(215,440,'DRAM cache','t t-xs t-mut t-mid')+T(357,414,'NAND flash memory','t t-xs t-mut t-mid')+
    `<path class="ln-thin" d="M150 372V402M215 364V424M305 377V402M410 377V402"/>`,{rx:16});
  s += `<g class="bg">${T(80,490,'Up to about 7,000 MB/s. No moving parts.','t t-sm t-mut')}</g>`;
  let tracks=''; [60,90,120].forEach(r=>tracks += C(730,300,r,'ln-thin','style="fill:none"'));
  s += hot('hdd',[560,110,350,500],
    T(560,95,'Hard disk drive, lid removed','t')+R(560,110,350,500,18,'m-metal')+C(730,300,150,'m-metal-lt')+tracks+C(730,300,36,'m-metal')+C(730,300,14,'m-hub')+
    R(820,470,70,90,10,'m-metal2')+C(855,515,20,'m-metal')+P('M845 505 L742 205 L756 200 L866 500Z','m-metal2')+R(736,192,22,14,3,'m-chip')+
    T(640,480,'Platter','t t-xs t-mut')+T(682,186,'Head','t t-xs t-mut t-end')+T(790,590,'Actuator arm','t t-xs t-mut')+T(730,334,'Spindle','t t-xs t-mut t-mid'),{rx:22});
  s += `<g class="bg">${T(560,640,'About 250 MB/s. The arm must move to each track.','t t-sm t-mut')}</g>`;
  return {svg:s};
};

/* ---------------- Power supply ---------------- */
SCENES.psu = () => {
  let s = `<g class="bg">${R(80,130,840,440,16,'m-metal-lt')}${R(110,160,780,380,8,'m-board')}
    ${R(58,300,44,70,6,'m-chip')}${[312,330,348].map(y=>R(68,y,24,8,2,'m-plastic')).join('')}${T(80,290,'AC in','t t-xs t-mut t-mid')}
    ${R(850,300,40,100,4,'m-slot')}<path class="m-cable" d="M890 320H930M890 350H930M890 380H930" style="stroke-width:8"/>
    ${T(936,326,'+12 V','t t-xs')}${T(936,356,'+5 V','t t-xs')}${T(936,386,'+3.3 V','t t-xs')}
    ${T(80,112,'Power supply, lid and fan removed (simplified)','t t-sm t-mut')}
    <path class="arr" d="M90 600H900"/><path class="arr-h" d="M900 594l10 6-10 6Z"/>
    ${T(110,630,'Mains AC','t t-xs t-mut t-mid')}${T(290,630,'High-voltage DC','t t-xs t-mut t-mid')}${T(505,630,'Switched at ~100 kHz','t t-xs t-mut t-mid')}${T(720,630,'Steady 12 V, 5 V, 3.3 V','t t-xs t-mut t-mid')}</g>`;
  const fins = (x) => [0,1,2,3,4,5,6,7,8,9].map(i=>`<line class="ln-thin" x1="${x+4}" y1="${212+i*24}" x2="${x+22}" y2="${212+i*24}"/>`).join('');
  s += hot('rectifier',[150,200,100,260], R(150,200,26,260,4,'m-metal2')+fins(150)+R(186,300,60,60,6,'m-chip')+T(216,336,'~ +','t t-xs t-inv t-mid'));
  const cap = (cx,cy,r) => C(cx,cy,r,'m-metal')+C(cx,cy,r-10,'m-metal-lt')+`<path class="ln-thin" d="M${cx-12} ${cy}h24M${cx} ${cy-12}v24"/>`;
  s += hot('filter-caps',[268,198,104,244], cap(320,250,50)+cap(320,390,50));
  s += hot('transformer',[420,200,170,260], R(420,200,26,260,4,'m-metal2')+fins(420)+R(470,262,110,136,8,'m-chip')+R(478,300,94,60,4,'m-gold'));
  s += hot('voltage-regulation',[620,200,210,260], R(620,200,26,260,4,'m-metal2')+fins(620)+R(670,210,140,90,8,'m-panel')+T(740,260,'DC-to-DC','t t-xs t-mid')+
    [690,730,770,810].map(x=>C(x,370,16,'m-metal')+C(x,370,8,'m-metal-lt')).join('')+[700,750,800].map(x=>R(x-14,410,28,28,4,'m-chip')).join(''));
  return {svg: s + LAYER(LB(200,488,'Rectifier',{for:'rectifier',tone:'inv'}) + LB(320,488,'Capacitors',{for:'filter-caps',tone:'inv'}) +
    LB(505,488,'Switching + transformer',{for:'transformer',tone:'inv'}) + LB(725,488,'Regulation',{for:'voltage-regulation',tone:'inv'}))};
};

/* ---------------- Cooling ---------------- */
SCENES.cooling = () => {
  let s = `<g class="bg">${R(150,600,700,30,4,'m-board')}${R(400,585,200,15,3,'m-metal-lt')}${R(420,565,160,20,3,'m-board')}${R(435,550,130,15,3,'m-metal-lt')}${T(500,622,'Motherboard','t t-xs t-inv t-mid')}
    ${T(150,100,'CPU tower cooler, side view (simplified)','t t-sm t-mut')}
    ${[200,300,400].map(y=>`<path class="arr" d="M170 ${y}H236"/><path class="arr-h" d="M236 ${y-6}l10 6-10 6Z"/><path class="arr" d="M690 ${y}H770"/><path class="arr-h" d="M770 ${y-6}l10 6-10 6Z"/>`).join('')}
    ${T(170,180,'Cool air','t t-xs t-mut')}${T(700,180,'Warm air','t t-xs t-mut')}</g>`;
  let fins=''; for (let i=0;i<22;i++) fins += R(330,124+i*16,340,5,2,'m-metal-lt');
  s += hot('heatsink',[330,120,340,354], fins,{pad:6});
  s += hot('heat-pipes',[362,132,276,404], `<path d="M375 140V470Q375 528 435 528H565Q625 528 625 470V140M430 140V480Q430 512 460 512H540Q570 512 570 480V140" style="fill:none;stroke:var(--i-copper);stroke-width:11;stroke-linecap:round"/>`,{pad:4});
  s += hot('thermal-paste',[436,536,128,14], R(438,540,124,9,3,'m-metal2')+R(425,508,150,30,4,'m-copper')+T(362,534,'Copper base','t t-xs t-end'),{hit:true,pad:4,label:'Thermal paste'});
  s += hot('fan',[250,130,64,330], R(256,130,54,330,10,'m-fan')+R(266,250,34,90,6,'m-hub')+[160,200,380,420].map(y=>`<line class="ln-thin" x1="262" y1="${y}" x2="304" y2="${y+14}"/>`).join(''));
  return {svg: s + LAYER(LB(690,150,'Heatsink fins',{for:'heatsink',anchor:'start'}) + LB(646,470,'Heat pipes',{for:'heat-pipes',anchor:'start'}) +
    LB(590,552,'Thermal paste',{for:'thermal-paste',anchor:'start'}) + LB(283,494,'Fan',{for:'fan'}))};
};

/* ---------------- Rear I/O ---------------- */
SCENES.io = () => {
  let s = `<g class="bg">${R(140,140,720,420,16,'m-case')}${T(140,122,'Rear I/O panel of the motherboard','t t-sm t-mut')}
    ${C(740,320,14,'m-metal')}${C(800,320,14,'m-metal')}${C(740,320,5,'m-hub')}${C(800,320,5,'m-hub')}${T(770,358,'Wi-Fi antennas','t t-xs t-mut t-mid')}</g>`;
  const usbA = (x,y,blue) => R(x,y,72,30,4,'m-chip')+R(x+8,y+7,56,9,2,'',`style="fill:${blue?'#2F6FD0':'var(--i-metal-lt)'}"`);
  s += hot('usb',[172,180,196,194], [190,236,282,328].map((y,i)=>usbA(180,y,i>1)).join('')+R(290,200,66,24,12,'m-chip')+R(302,209,42,6,3,'m-metal-lt')+R(290,248,66,24,12,'m-chip')+R(302,257,42,6,3,'m-metal-lt')+
    T(270,410,'USB-A and USB-C','t t-mid')+T(270,432,'up to 40 Gbit/s','t t-xs t-mut t-mid'));
  s += hot('video-out',[392,186,112,110], P('M402 196H494V214L484 226H412L402 214Z','m-chip')+R(412,204,72,10,2,'m-metal-lt')+
    P('M402 250H494V282H414L402 270Z','m-chip')+R(412,258,72,10,2,'m-metal-lt')+T(448,410,'HDMI and','t t-mid')+T(448,432,'DisplayPort','t t-xs t-mut t-mid'));
  s += hot('ethernet',[548,186,94,84], R(552,190,86,76,6,'m-chip')+R(572,206,46,40,3,'m-metal-lt')+R(582,244,26,12,2,'m-chip')+R(558,194,12,8,2,'m-on')+R(620,194,12,8,2,'m-accent')+
    T(595,410,'Ethernet','t t-mid')+T(595,432,'RJ45, 1–10 Gbit/s','t t-xs t-mut t-mid'));
  const jack = (cx,cy,col) => C(cx,cy,19,'m-chip')+`<circle cx="${cx}" cy="${cy}" r="12" style="fill:${col}"/>`+C(cx,cy,5,'m-hub');
  s += hot('audio',[688,186,176,52], jack(712,212,'#3BA55C')+jack(762,212,'#E46C9E')+jack(812,212,'#3E7FD6')+T(762,410,'Audio jacks','t t-mid')+T(762,432,'3.5 mm','t t-xs t-mut t-mid'));
  return {svg:s};
};
