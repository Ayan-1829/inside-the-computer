/* ==========================================================
   scenes/gpu-deep.js
   "Inside" drawings of the graphics card: a compute unit (streaming multiprocessor), the
   fused multiply-add of one shader core, VRAM (GDDR and HBM), one GDDR chip, the memory
   controller and the display engine. The parts they draw are defined in data/gpu-deep.js.
   Helpers (ld, TITLE, NOTE, FLOW) come from scenes/devices.js.
   ========================================================== */
const ARR = (x1, x2, y) => `<path class="arr" d="M${x1} ${y}H${x2 - 6}"/><path class="arr-h" d="M${x2 - 10} ${y-6}l10 6-10 6Z"/>`;
const ARRD = (x, y1, y2) => `<path class="arr" d="M${x} ${y1}V${y2 - 6}"/><path class="arr-h" d="M${x-6} ${y2-10}l6 10 6-10Z"/>`;

/* ---------------- Inside a compute unit ---------------- */
SCENES.sm = () => {
  let s = TITLE('One compute unit (an NVIDIA SM), block diagram (simplified)');
  s += `<g class="bg">${R(100,120,800,380,10,'m-panel')}</g>`;
  const qx = [120,310,500,690];
  s += hot('sm-scheduler', [120,140,760,38], R(120,140,760,38,5,'m-accent'));
  s += hot('sm-registers', [120,190,760,38], R(120,190,760,38,5,'m-chip'));
  const row = (id, y, h, cls, inner='') => hot(id, [120,y,760,h], R(120,y,760,h,5,cls) + inner + [305,495,685].map(x => R(x-1,y,2,h,0,'m-panel','style="opacity:.35"')).join(''), {pad:3, rx:8});
  let cc = ''; qx.forEach(x => [0,1,2].forEach(i => [0,1,2,3,4,5,6,7].forEach(j => cc += R(x+10+j*21,248+i*18,17,13,2,'m-die-cell'))));
  s += row('sm-cores', 240, 82, 'm-chip', cc);
  s += row('sm-tensor', 332, 42, 'm-accent');
  s += row('sm-texture', 384, 36, 'm-chip');
  s += hot('sm-rt', [120,432,370,44], R(120,432,370,44,5,'m-accent'));
  s += hot('sm-shared', [510,432,370,44], R(510,432,370,44,5,'m-chip'));
  s += NOTE('Each quarter has its own scheduler, cores, tensor core and texture unit.');
  return {svg: s + LAYER(LB(500,159,'Warp schedulers and dispatch',{for:'sm-scheduler',tone:'inv',size:14}) + LB(500,209,'Register file (256 KB)',{for:'sm-registers',tone:'inv',size:14}) +
    LB(500,309,'Shader cores (128 in all)',{for:'sm-cores',tone:'inv',size:14}) + LB(500,353,'Tensor cores (4)',{for:'sm-tensor',tone:'inv',size:14}) +
    LB(500,402,'Texture units (4)',{for:'sm-texture',tone:'inv',size:14}) + LB(305,454,'Ray-tracing core',{for:'sm-rt',tone:'inv',size:14}) + LB(695,454,'Shared memory + L1',{for:'sm-shared',tone:'inv',size:14}))};
};

/* ---------------- Inside a shader core: fused multiply-add ---------------- */
SCENES.fma = () => {
  let s = TITLE('Fused multiply-add: a × b + c, in one step (simplified)');
  const inp = (y, t) => R(80,y,80,34,5,'m-panel') + T(120,y+22,t,'t t-sm t-mid');
  s += `<g class="bg">${inp(190,'a')}${inp(250,'b')}${inp(430,'c')}${ARR(160,230,207)}${ARR(160,230,267)}${ARR(160,230,447)}
    <path class="arr" d="M380 235H420V300H464"/><path class="arr-h" d="M460 294l10 6-10 6Z"/>
    <path class="arr" d="M380 430H420V350H464"/><path class="arr-h" d="M460 344l10 6-10 6Z"/>
    ${ARR(610,690,325)}${ARR(860,930,325)}${T(960,330,'result','t t-xs t-mut t-mid')}
    ${T(305,312,'24-bit × 24-bit','t t-xs t-mut t-mid')}${T(305,332,'gives a 48-bit product','t t-xs t-mut t-mid')}
    ${T(305,492,'shift c to line up','t t-xs t-mut t-mid')}${T(305,512,'with the product','t t-xs t-mut t-mid')}
    ${T(540,404,'one wide add','t t-xs t-mut t-mid')}${T(775,404,'shift, round to 24 bits','t t-xs t-mut t-mid')}</g>`;
  s += hot('fma-multiplier', [230,180,150,110], R(230,180,150,110,8,'m-chip') + `<g class="bg">${T(305,246,'×','t t-lg t-inv t-mid')}</g>`);
  s += hot('fma-align', [230,380,150,100], R(230,380,150,100,8,'m-chip') + `<g class="bg">${T(305,436,'⇆','t t-lg t-inv t-mid')}</g>`);
  s += hot('fma-adder', [470,270,140,110], R(470,270,140,110,8,'m-chip') + `<g class="bg">${T(540,336,'+','t t-lg t-inv t-mid')}</g>`);
  s += hot('fma-normalise', [690,270,170,110], R(690,270,170,110,8,'m-chip') + `<g class="bg">${T(775,336,'1.xxx','t t-sm t-inv t-mid')}</g>`);
  s += NOTE('Fused: nothing is rounded until the last step, so the result is more accurate.');
  return {svg: s + LAYER(LB(305,158,'Multiplier',{for:'fma-multiplier'}) + LB(305,458,'Alignment shifter',{for:'fma-align',tone:'inv',size:13}).replace('y="458"','y="458"') + LB(540,250,'Adder',{for:'fma-adder'}) + LB(775,250,'Normalise and round',{for:'fma-normalise'}))};
};

/* ---------------- VRAM: GDDR chips and HBM stacks ---------------- */
SCENES.vram = () => {
  let s = TITLE('Two ways to attach memory to a GPU (simplified)');
  s += `<g class="bg">${R(200,290,110,110,8,'m-die')}${T(255,349,'GPU','t t-sm t-die t-mid')}${R(540,190,400,260,10,'m-board')}${R(560,250,150,140,8,'m-die')}${T(635,325,'GPU','t t-sm t-die t-mid')}
    ${T(255,590,'Graphics card: GDDR chips','t t-sm t-mut t-mid')}${T(740,590,'AI accelerator: HBM on an interposer','t t-sm t-mut t-mid')}</g>`;
  const cx = [130,210,290]; let chips = '', bus = '', cb = [];
  cx.forEach(x => { [150,470].forEach(y => { chips += R(x,y,60,66,5,'m-chip') + T(x+30,y+38,'GDDR','t t-xs t-inv t-mid'); cb.push([x,y,60,66]); }); });
  cx.forEach((x,i) => [0,1,2,3].forEach(k => { const bx = x + 12 + k*12; bus += `<line class="ln" x1="${bx}" y1="216" x2="${bx}" y2="290"/><line class="ln" x1="${bx}" y1="400" x2="${bx}" y2="470"/>`; }));
  s += hot('vram-bus', [[130,216,220,74],[130,400,220,70]], bus, {pad:4});
  s += hot('vram-chip', cb, chips);
  const st = [[760,210],[850,210],[760,330],[850,330]]; let stacks = '', wires = '';
  st.forEach(([x,y]) => { for (let i = 0; i < 4; i++) stacks += R(x,y+i*26,70,20,3,i === 0 ? 'm-chip' : 'm-chip'); wires += `<line class="ln" x1="710" y1="${y+50}" x2="${x}" y2="${y+50}"/>`; });
  s += `<g class="bg">${wires}</g>` + hot('vram-hbm', st.map(([x,y]) => [x,y,70,100]), stacks);
  return {svg: s + LAYER(LB(240,126,'GDDR chips',{for:'vram-chip'}) + LB(118,254,'Memory bus',{for:'vram-bus',anchor:'end'}) + LB(835,176,'HBM stacks',{for:'vram-hbm'}))};
};

/* ---------------- Inside a GDDR chip ---------------- */
SCENES.gddr = () => {
  let s = TITLE('GDDR6 chip, two independent channels (simplified)');
  s += `<g class="bg">${R(150,130,700,420,12,'m-die')}</g>`;
  let frames = '', banks = '', bb = [];
  [180,510].forEach((x,k) => {
    frames += R(x,170,310,210,8,'m-panel') + T(x+155,192,'16 data pins','t t-xs t-mid');
    [0,1,2,3].forEach(i => {
      const gx = x + 15 + i*74; bb.push([gx,210,66,66]);
      banks += R(gx,210,66,66,5,'m-chip') + [0,1].map(r => [0,1].map(c => R(gx+6+c*29,216+r*29,25,25,3,'m-die-cell')).join('')).join('');
    });
    frames += T(x+155,306,'Each bank has its own decoder','t t-xs t-mut t-mid') + T(x+155,326,'and sense amps; 4 groups of 4','t t-xs t-mut t-mid');
  });
  s += hot('gddr-channels', [[180,170,310,210],[510,170,310,210]], frames);
  s += hot('gddr-banks', bb, banks, {pad:3, rx:8});
  s += hot('gddr-signalling', [180,400,640,70], R(180,400,640,70,6,'m-chip') + T(500,442,'Fast clock, drivers, receivers, training','t t-xs t-inv t-mid'));
  let pins = ''; for (let i = 0; i < 24; i++) pins += R(196+i*26,550,10,22,1,'m-gold');
  s += `<g class="bg">${pins}${T(500,600,'Pins to the GPU','t t-xs t-mut t-mid')}</g>`;
  return {svg: s + LAYER(LB(335,148,'Channel A',{for:'gddr-channels',tone:'inv',size:14}) + LB(665,148,'Channel B',{for:'gddr-channels',tone:'inv',size:14}) +
    LB(500,364,'Banks and bank groups',{for:'gddr-banks',size:14}) + LB(500,488,'High-speed interface',{for:'gddr-signalling',tone:'inv',size:14}))};
};

/* ---------------- The GPU memory controller ---------------- */
SCENES.memctl = () => {
  let s = TITLE('One memory-controller path, from the L2 cache to the memory pins (simplified)');
  let sl = ''; [0,1,2,3].forEach(i => sl += R(84,200+i*60,52,46,4,'m-chip'));
  s += `<g class="bg">${R(70,180,80,260,8,'m-panel')}${sl}${T(110,470,'L2 slices','t t-xs t-mut t-mid')}${R(790,180,110,260,8,'m-board')}${T(845,300,'GDDR','t t-sm t-inv t-mid')}${T(845,322,'chips','t t-sm t-inv t-mid')}
    ${ARR(150,180,310)}${ARR(300,330,310)}${ARR(470,500,310)}${ARR(600,630,310)}${ARR(740,790,310)}</g>`;
  s += hot('mc-interleave', [180,180,120,260], R(180,180,120,260,8,'m-chip') + T(240,290,'Address','t t-xs t-inv t-mid') + T(240,310,'hash:','t t-xs t-inv t-mid') + T(240,330,'spread over','t t-xs t-inv t-mid') + T(240,350,'channels','t t-xs t-inv t-mid'));
  let q = ''; [0,1,2,3].forEach(i => q += R(340,196+i*58,120,44,4,'m-die-cell') + T(400,223+i*58,'queue','t t-xs t-die t-mid'));
  s += hot('mc-scheduler', [330,180,140,260], R(330,180,140,260,8,'m-chip') + q);
  s += hot('mc-ecc', [500,180,100,260], R(500,180,100,260,8,'m-chip') + T(550,300,'Check','t t-xs t-inv t-mid') + T(550,320,'bits','t t-xs t-inv t-mid'));
  s += hot('mc-phy', [630,180,110,260], R(630,180,110,260,8,'m-accent') + T(685,290,'Drivers,','t t-xs t-inv t-mid') + T(685,310,'receivers,','t t-xs t-inv t-mid') + T(685,330,'training','t t-xs t-inv t-mid'));
  s += FLOW(560, [[240,'Which channel'],[400,'Which request first'],[550,'Protect the data'],[685,'Talk to the pins']]);
  return {svg: s + LAYER(LB(240,158,'Interleave',{for:'mc-interleave'}) + LB(400,158,'Scheduler',{for:'mc-scheduler'}) + LB(550,158,'ECC / CRC',{for:'mc-ecc'}) + LB(685,158,'PHY',{for:'mc-phy'}))};
};

/* ---------------- The display engine ---------------- */
SCENES.dispeng = () => {
  let s = TITLE('From the finished frame to the screen (simplified)');
  s += `<g class="bg">${R(70,220,120,200,8,'m-chip')}${T(130,314,'VRAM','t t-sm t-inv t-mid')}${T(130,338,'finished frame','t t-xs t-inv t-mid')}${R(800,240,130,150,8,'m-panel')}${T(865,320,'Monitor','t t-sm t-mid')}
    ${ARR(190,240,320)}${ARR(390,440,320)}${ARR(600,650,320)}${ARR(740,800,320)}
    <path class="ln-dash" d="M865 390V480H695V410"/><path class="arr-h" d="M689 414l6-10 6 10Z"/>${T(780,506,'EDID: what the screen can show','t t-xs t-mut t-mid')}</g>`;
  s += hot('disp-scanout', [240,220,150,200], R(240,220,150,200,8,'m-chip') + T(315,300,'Reads rows','t t-xs t-inv t-mid') + T(315,322,'Scales','t t-xs t-inv t-mid') + T(315,344,'Colour, overlay','t t-xs t-inv t-mid'));
  s += hot('disp-encoder', [440,220,160,200], R(440,220,160,200,8,'m-chip') + T(520,296,'Packs pixels','t t-xs t-inv t-mid') + T(520,318,'HDMI / DisplayPort','t t-xs t-inv t-mid') + T(520,340,'Compression (DSC)','t t-xs t-inv t-mid'));
  s += hot('disp-ports', [650,240,90,160], R(650,240,90,160,6,'m-metal') + R(662,262,66,34,4,'m-slot') + R(662,304,66,34,4,'m-slot') + R(662,346,66,34,4,'m-slot'));
  s += FLOW(590, [[130,'Frame'],[315,'Pixel stream'],[520,'Cable signal'],[695,'Connectors'],[865,'Picture']]);
  return {svg: s + LAYER(LB(315,198,'Scan-out engine',{for:'disp-scanout'}) + LB(520,198,'Link encoder',{for:'disp-encoder'}) + LB(695,218,'Connectors',{for:'disp-ports'}))};
};
