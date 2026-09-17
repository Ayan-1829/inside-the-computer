/* ==========================================================
   scenes/hardware.js
   Level 1 and Level 2 drawings: the PC, motherboard, RAM, GPU,
   storage, power supply, cooling and rear I/O panel.
   ========================================================== */
/* ---------------- Level 1: the PC ---------------- */
SCENES.pc = () => {
  let s = `<g class="bg">
  ${R(262,668,60,10,3,'m-case')}${R(698,668,60,10,3,'m-case')}
  ${R(240,60,540,612,18,'m-case')}${R(262,82,476,568,8,'m-cavity')}
  ${C(759,112,9,'m-panel')}${R(752,140,14,4,2,'m-accent')}
  ${R(262,520,476,130,6,'m-case')}${T(500,512,'','t')}</g>`;
  // motherboard (flat hotspot, drawn first)
  let traces = '';
  [[330,300,420,300,420,215],[330,330,560,330,560,145],[540,480,540,440,600,440],[340,470,340,450,500,450],[600,150,600,120,470,120]].forEach(p=>traces += `<polyline class="ln-trace" points="${p.join(',')}"/>`);
  s += hot('motherboard',[300,100,330,400], R(300,100,330,400,6,'m-board')+traces+T(314,488,'Motherboard','t t-sm t-inv'),{flat:true});
  s += `<g class="ov"><path class="m-cable" d="M470 560 C 470 500, 640 500, 624 330"/><path class="m-cable" d="M430 560 C 420 520, 380 470, 355 300" style="stroke-width:8"/></g>`;
  // I/O
  let ports = ''; [120,146,172,198].forEach((y,i)=>ports += R(273,y,30,18,3,'m-slot')); ports += C(288,232,6,'m-slot')+C(288,250,6,'m-slot');
  s += hot('io',[268,110,40,152], R(268,110,40,152,5,'m-metal')+ports+T(288,100,'I/O','t t-sm t-mid'));
  // CPU
  s += hot('cpu',[420,165,100,100], R(420,165,100,100,8,'m-metal-lt')+R(434,179,72,72,6,'m-metal')+T(470,221,'CPU','t t-lg t-mid'));
  // RAM
  let sticks = ''; [553,569,585,601].forEach(x => sticks += R(x,140,10,200,2,'m-chip')+R(x+2,148,6,184,1,'m-plastic'));
  s += hot('ram',[550,136,64,208], sticks + T(582,130,'RAM','t t-sm t-inv t-mid'));
  // cooling: front intake fans
  const fan = (cx,cy,r) => { let b=''; for(let i=0;i<5;i++) b += `<path transform="rotate(${i*72} ${cx} ${cy})" d="M${cx} ${cy} C ${cx+r*.25} ${cy-r*.6}, ${cx+r*.7} ${cy-r*.6}, ${cx+r*.82} ${cy-r*.28} C ${cx+r*.5} ${cy-r*.26}, ${cx+r*.25} ${cy-r*.1}, ${cx} ${cy}Z"/>`;
    return R(cx-r-4,cy-r-4,2*r+8,2*r+8,10,'m-fan')+`<g class="blades">${b}</g>`+C(cx,cy,r*.24,'m-hub'); };
  s += hot('cooling',[638,110,96,240], fan(686,160,44)+fan(686,300,44)+T(686,372,'Cooling','t t-sm t-mid'));
  // GPU
  s += hot('gpu',[300,378,410,62], R(296,372,14,72,2,'m-metal')+R(310,380,400,56,8,'m-chip')+
      C(450,408,21,'m-plastic')+C(570,408,21,'m-plastic')+C(450,408,6,'m-hub')+C(570,408,6,'m-hub')+T(345,414,'GPU','t t-lg t-inv'));
  // PSU
  let grille=''; for(let i=-2;i<=2;i++) grille += `<line class="ln-thin" x1="${322+i*9}" y1="${552}" x2="${322+i*9}" y2="${608}"/>`;
  s += hot('psu',[272,534,210,92], R(272,534,210,92,6,'m-metal2')+C(322,580,32,'m-metal-lt')+grille+T(372,576,'Power','t t-sm')+T(372,594,'supply','t t-sm'));
  // storage
  s += hot('storage',[562,536,164,86], R(566,540,156,38,5,'m-metal')+C(592,559,12,'m-metal-lt')+T(614,564,'HDD','t t-xs')+R(566,586,156,30,5,'m-metal-lt')+T(578,606,'SSD','t t-xs')+T(644,532,'Storage','t t-sm t-mid'));
  return {svg:s};
};

/* ---------------- Motherboard ---------------- */
SCENES.board = () => {
  let tr=''; [[300,340,400,340,400,420],[610,200,700,200],[520,330,520,380,600,380],[300,560,360,560,360,620],[720,420,720,540],[430,470,600,470]].forEach(p=>tr+=`<polyline class="ln-trace" points="${p.join(',')}"/>`);
  let s = `<g class="bg">${R(250,70,480,590,10,'m-board')}${tr}
    ${R(262,90,50,210,5,'m-metal')}${[100,130,160,190,220].map(y=>R(270,y,34,20,3,'m-slot')).join('')}${T(287,318,'Rear I/O','t t-xs t-inv t-mid')}
    ${R(706,180,16,120,3,'m-slot')}${T(700,318,'24-pin','t t-xs t-inv t-mid')}
    ${[560,585,610].map(y=>R(690,y,28,16,3,'m-slot')).join('')}${T(704,645,'SATA','t t-xs t-inv t-mid')}</g>`;
  let fins=''; for(let i=0;i<9;i++) fins += `<line class="ln-thin" x1="334" y1="${122+i*24}" x2="376" y2="${122+i*24}"/>`;
  s += hot('vrm',[330,110,80,220], R(330,110,50,220,6,'m-metal2')+fins+[130,170,210,250,290].map(y=>R(388,y,20,20,3,'m-metal')).join('')+T(370,352,'VRM','t t-sm t-inv t-mid'));
  let grid=''; for(let r=0;r<9;r++) for(let c=0;c<9;c++) grid += C(466+c*11,186+r*11,2,'m-gold');
  s += hot('cpu-socket',[430,150,160,160], R(430,150,160,160,10,'m-metal-lt')+R(450,170,120,120,6,'m-metal2')+grid+`<line class="ln" x1="596" y1="160" x2="596" y2="300" style="stroke-width:4"/>`+T(510,334,'CPU socket','t t-sm t-inv t-mid'));
  s += hot('ram-slots',[620,98,80,284], [625,645,665,685].map(x=>R(x,100,10,280,2,'m-slot')+R(x-1,94,12,8,2,'m-metal-lt')+R(x-1,378,12,8,2,'m-metal-lt')).join('')+T(660,404,'RAM slots','t t-sm t-inv t-mid'));
  s += hot('pcie',[286,398,312,124], R(290,400,300,18,3,'m-slot')+R(290,450,60,14,3,'m-slot')+R(380,448,200,22,3,'m-metal-lt')+C(596,459,6,'m-metal')+T(480,464,'M.2','t t-xs t-mid')+R(290,500,300,18,3,'m-slot')+T(290,540,'PCIe slots','t t-sm t-inv'));
  s += hot('chipset',[612,440,90,90], R(612,440,90,90,8,'m-metal2')+[0,1,2,3,4].map(i=>`<line class="ln-thin" x1="${626+i*15}" y1="452" x2="${626+i*15}" y2="518"/>`).join('')+T(657,548,'Chipset','t t-sm t-inv t-mid'));
  s += hot('bios',[372,566,140,50], C(398,591,22,'m-metal-lt')+T(398,596,'3V','t t-xs t-mid')+R(462,578,40,26,3,'m-chip')+T(442,634,'BIOS / UEFI','t t-sm t-inv t-mid'));
  return {svg:s};
};

/* ---------------- RAM ---------------- */
SCENES.ram = () => {
  let gold=''; for (let x=122;x<878;x+=11){ if (x>495 && x<522) continue; gold += R(x,238,7,22,1.5,'m-gold'); }
  let s = `<g class="bg">${R(110,90,780,170,6,'m-board')}${gold}${R(498,244,20,20,3,'','style="fill:var(--surface)"')}
    ${T(110,285,'DDR5 memory stick (DIMM)','t t-sm t-mut')}
    <path class="ln-dash" d="M295 215L110 330M365 215L510 330"/></g>`;
  const chips = [135,215,295,375,555,635,715,795].map(x => R(x,115,70,100,4,'m-chip')+T(x+35,172,'DRAM','t t-xs t-inv t-mid','style="opacity:.6"')).join('');
  s += hot('dram',[[135,115,310,100],[555,115,310,100]], chips);
  s += hot('spd',[472,120,56,70], R(478,126,44,30,3,'m-chip')+R(484,166,32,20,3,'m-chip')+T(500,206,'SPD','t t-xs t-inv t-mid'));
  let cells=''; const on = (r,c) => ((r*7+c*3)%5)<2;
  for (let r=0;r<7;r++) cells += `<line class="ln-thin" x1="140" y1="${400+r*30}" x2="484" y2="${400+r*30}"/>`;
  for (let c=0;c<12;c++) cells += `<line class="ln-thin" x1="${150+c*28}" y1="388" x2="${150+c*28}" y2="592"/>`;
  for (let r=0;r<7;r++) for (let c=0;c<12;c++) cells += R(143+c*28,393+r*30,14,14,3,'bit'+(on(r,c)?' on':''));
  s += hot('memory-cells',[110,330,400,310], R(110,330,400,310,14,'m-panel')+T(130,360,'Memory cell array','t')+cells+T(130,620,'Rows = word lines, columns = bit lines. Charged cell = 1','t t-xs t-mut'));
  const i1 = gsym('NOT',650,420,.8,2.5);
  s += hot('sram',[560,330,330,310], R(560,330,330,310,14,'m-panel')+T(580,360,'SRAM cell (used in cache)','t')+
    `<g transform="translate(1455 0) scale(-1 1)">${gsym('NOT',650,480,.8,2.5).svg}</g>`+
    `<path class="ln" d="M${i1.o[0]} ${i1.o[1]}H842V512H802M731 512H618V452H654"/>`+i1.svg+
    R(590,540,46,34,6,'m-block')+T(613,562,'T','t t-xs t-mid')+R(794,540,46,34,6,'m-block')+T(817,562,'T','t t-xs t-mid')+
    T(580,610,'Two inverters hold each other in place.','t t-xs t-mut')+T(580,628,'6 transistors per bit, no refresh needed.','t t-xs t-mut'));
  return {svg:s};
};

/* ---------------- GPU ---------------- */
SCENES.gpu = () => {
  let s = `<g class="bg">${R(70,180,420,290,8,'m-board')}${[0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(i=>R(206+i*15,472,10,16,1.5,'m-gold')).join('')}
    ${R(430,190,46,22,3,'m-slot')}${T(70,520,'Graphics card, cooler removed','t t-sm t-mut')}
    <path class="ln-dash" d="M325 270L540 110M325 370L540 630"/></g>`;
  s += hot('display-outputs',[48,170,24,310], R(48,170,22,310,3,'m-metal')+[200,250,300].map(y=>R(52,y,14,34,3,'m-slot')).join('')+R(52,360,14,40,3,'m-slot')+T(40,500,'Outputs','t t-xs t-mut'));
  const vr = [[190,200,48,34],[250,200,48,34],[310,200,48,34],[190,406,48,34],[250,406,48,34],[310,406,48,34],[372,258,34,48],[372,334,34,48]];
  s += hot('vram',[180,196,232,248], vr.map(v=>R(...v,3,'m-chip')).join('')+T(420,432,'VRAM','t t-sm t-inv'),{label:'VRAM chips'});
  s += `<g class="bg">${R(200,245,150,150,8,'m-chip')}${R(225,270,100,100,5,'m-die')}${T(275,325,'GPU','t t-sm t-die t-mid')}</g>`;
  s += `<g class="bg">${R(540,110,400,520,12,'m-die')}${R(605,485,270,56,6,'m-die-block')}${T(740,518,'L2 cache','t t-sm t-die t-mid')}
    ${R(605,556,130,54,6,'m-die-block')}${T(670,588,'Display, media','t t-xs t-die t-mid')}${R(745,556,130,54,6,'m-die-block')}${T(810,588,'PCIe link','t t-xs t-die t-mid')}
    ${T(740,660,'GPU die, simplified floorplan','t t-sm t-mut t-mid')}</g>`;
  let mc=''; for (let i=0;i<6;i++){ mc += R(556,130+i*80,34,70,4,'m-die-block') + R(890,130+i*80,34,70,4,'m-die-block'); }
  s += hot('memory-controller',[[556,130,34,470],[890,130,34,470]], mc+`<text class="t t-xs t-die t-mid" transform="translate(577 365) rotate(-90)">Memory controllers</text>`,{pad:5});
  let cu=''; for (let r=0;r<6;r++) for (let c=0;c<5;c++){ const x=608+c*54, y=132+r*56; cu += R(x,y,48,50,4,'m-die-block')+R(x+6,y+8,36,8,2,'m-die-cell')+R(x+6,y+22,36,8,2,'m-die-cell')+R(x+6,y+36,36,8,2,'m-die-cell'); }
  s += hot('compute-units',[606,130,272,340], cu,{pad:5});
  return {svg:s};
};

/* ---------------- Storage ---------------- */
SCENES.storage = () => {
  let s = '';
  s += hot('ssd',[64,240,430,210],
    T(80,262,'M.2 NVMe SSD','t')+R(80,290,400,100,6,'m-board')+[0,1,2,3,4,5].map(i=>R(68,300+i*13,14,8,1.5,'m-gold')).join('')+C(480,340,9,'m-hole')+
    R(120,310,60,60,4,'m-chip')+R(195,318,40,44,3,'m-chip')+R(255,305,95,70,4,'m-chip')+R(362,305,95,70,4,'m-chip')+
    T(305,345,'NAND','t t-xs t-inv t-mid')+T(410,345,'NAND','t t-xs t-inv t-mid')+
    T(150,414,'Controller','t t-xs t-mut t-mid')+T(215,432,'DRAM cache','t t-xs t-mut t-mid')+T(357,414,'NAND flash memory','t t-xs t-mut t-mid')+
    `<path class="ln-thin" d="M150 372V402M215 364V420M305 377V402M410 377V402"/>`,{rx:16});
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
    ${T(938,325,'+12 V','t t-xs')}${T(938,355,'+5 V','t t-xs')}${T(938,385,'+3.3 V','t t-xs')}
    ${T(80,112,'Power supply, lid and fan removed (simplified)','t t-sm t-mut')}
    <path class="arr" d="M90 600H900"/><path class="arr-h" d="M900 594l10 6-10 6Z"/>
    ${T(110,630,'Mains AC','t t-xs t-mut t-mid')}${T(290,630,'High-voltage DC','t t-xs t-mut t-mid')}${T(505,630,'Switched at ~100 kHz','t t-xs t-mut t-mid')}${T(720,630,'Steady 12 V, 5 V, 3.3 V','t t-xs t-mut t-mid')}</g>`;
  const fins = (x) => [0,1,2,3,4,5,6,7,8,9].map(i=>`<line class="ln-thin" x1="${x+4}" y1="${212+i*24}" x2="${x+22}" y2="${212+i*24}"/>`).join('');
  s += hot('rectifier',[150,200,100,260], R(150,200,26,260,4,'m-metal2')+fins(150)+R(186,300,60,60,6,'m-chip')+T(216,336,'~ +','t t-xs t-inv t-mid')+T(200,486,'Rectifier','t t-sm t-inv t-mid'));
  const cap = (cx,cy,r) => C(cx,cy,r,'m-metal')+C(cx,cy,r-10,'m-metal-lt')+`<path class="ln-thin" d="M${cx-12} ${cy}h24M${cx} ${cy-12}v24"/>`;
  s += hot('filter-caps',[268,198,104,244], cap(320,250,50)+cap(320,390,50)+T(320,486,'Capacitors','t t-sm t-inv t-mid'));
  s += hot('transformer',[420,200,170,260], R(420,200,26,260,4,'m-metal2')+fins(420)+R(470,262,110,136,8,'m-chip')+R(478,300,94,60,4,'m-gold')+T(525,336,'Transformer','t t-xs t-mid')+T(505,486,'Switching + transformer','t t-sm t-inv t-mid'));
  s += hot('voltage-regulation',[620,200,210,260], R(620,200,26,260,4,'m-metal2')+fins(620)+R(670,210,140,90,8,'m-panel')+T(740,260,'DC-to-DC','t t-xs t-mid')+
    [690,730,770,810].map(x=>C(x,370,16,'m-metal')+C(x,370,8,'m-metal-lt')).join('')+[700,750,800].map(x=>R(x-14,410,28,28,4,'m-chip')).join('')+T(725,486,'Regulation','t t-sm t-inv t-mid'));
  return {svg:s};
};

/* ---------------- Cooling ---------------- */
SCENES.cooling = () => {
  let s = `<g class="bg">${R(150,600,700,30,4,'m-board')}${R(400,585,200,15,3,'m-metal-lt')}${R(420,565,160,20,3,'m-board')}${R(435,550,130,15,3,'m-metal-lt')}${T(500,622,'Motherboard','t t-xs t-inv t-mid')}
    ${T(150,100,'CPU tower cooler, side view (simplified)','t t-sm t-mut')}
    ${[200,300,400].map(y=>`<path class="arr" d="M170 ${y}H236"/><path class="arr-h" d="M236 ${y-6}l10 6-10 6Z"/><path class="arr" d="M690 ${y}H770"/><path class="arr-h" d="M770 ${y-6}l10 6-10 6Z"/>`).join('')}
    ${T(170,180,'Cool air','t t-xs t-mut')}${T(700,180,'Warm air','t t-xs t-mut')}</g>`;
  let fins=''; for (let i=0;i<22;i++) fins += R(330,124+i*16,340,5,2,'m-metal-lt');
  s += hot('heatsink',[330,120,340,354], fins+T(680,150,'Heatsink fins','t t-sm'),{pad:6});
  s += hot('heat-pipes',[362,132,276,404], `<path d="M375 140V470Q375 528 435 528H565Q625 528 625 470V140M430 140V480Q430 512 460 512H540Q570 512 570 480V140" style="fill:none;stroke:var(--i-copper);stroke-width:11;stroke-linecap:round"/>`+T(640,470,'Heat pipes','t t-sm'),{pad:4});
  s += hot('thermal-paste',[436,536,128,14], R(438,540,124,9,3,'m-metal2')+R(425,508,150,30,4,'m-copper')+T(362,532,'Copper base','t t-xs t-end')+T(580,556,'Thermal paste','t t-xs'),{hit:true,pad:4,label:'Thermal paste'});
  s += hot('fan',[250,130,64,330], R(256,130,54,330,10,'m-fan')+R(266,250,34,90,6,'m-hub')+[160,200,380,420].map(y=>`<line class="ln-thin" x1="262" y1="${y}" x2="304" y2="${y+14}"/>`).join('')+T(283,484,'Fan','t t-sm t-mid'));
  return {svg:s};
};

/* ---------------- Rear I/O ---------------- */
SCENES.io = () => {
  let s = `<g class="bg">${R(140,140,720,420,16,'m-metal-lt')}${T(140,122,'Rear I/O panel of the motherboard','t t-sm t-mut')}
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
