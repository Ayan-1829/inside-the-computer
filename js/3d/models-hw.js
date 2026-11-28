/* ==========================================================
   3d/models-hw.js
   3D models of the parts inside the tower: CPU, motherboard, RAM,
   graphics card, storage (SSD and hard drive), power supply,
   cooling and the I/O ports. Same conventions as 3d/models-input.js.
   Builders take (K, o): o holds options used when a part is drawn
   inside the whole computer (3d/models.js).
   ========================================================== */
const PI = Math.PI;

/* ---------------- CPU (drawn 4 times life size) ---------------- */
/* the die's floor plan, in die units (x −4…4, z −3…3): [x0, z0, x1, z1, colour, part] */
function dieRegions(){
  const r = [[-4, -.7, 2.6, .7, '#55607a', 'cache'], [2.6, -3, 4, 3, '#6d5a33', 'bus-interface'], [2.85, .9, 3.75, 1.8, '#8a6a2a', 'clock']];
  for (let i = 0; i < 4; i++){
    const x0 = -4 + i * 1.65;
    [[-3, -.7, 1], [3, .7, -1]].forEach(([edge, inner, s]) => {
      /* a core: execution units (ALU), registers, control unit and decoder, then its own L2 next to the shared cache */
      const zA = edge, zB = edge + s * 1.0, zC = edge + s * 1.8, zD = inner;
      const [a0, a1] = [zA, zB].sort((p, q) => p - q), [b0, b1] = [zB, zC].sort((p, q) => p - q), [c0, c1] = [zC, zD].sort((p, q) => p - q);
      r.push([x0 + .04, a0, x0 + .85, a1, '#b5652a', 'alu']);
      r.push([x0 + .85, a0, x0 + 1.61, a1, '#2f6fb0', 'registers']);
      r.push([x0 + .04, b0, x0 + 1.61, b1, '#6a4bb0', 'control-unit']);
      r.push([x0 + .04, c0, x0 + 1.61, c1, '#4a5468', 'l2']);
    });
  }
  return r;
}
function cpuChip(K, o = {}){
  const { g, at, box } = K, T = K.T;
  /* the green substrate, gold pads underneath */
  const subTex = K.pcbTex(15, 15, { seed: 91, color: '#1d5a3a', density: .5 });
  const pads = K.canvas(512, 512, (x) => { x.fillStyle = '#1d5a3a'; x.fillRect(0, 0, 512, 512); x.fillStyle = '#d9a84e';
    for (let i = 0; i < 40; i++) for (let j = 0; j < 40; j++) if (!(i > 15 && i < 24 && j > 15 && j < 24)) { x.beginPath(); x.arc(10 + i * 12.3, 10 + j * 12.3, 3.6, 0, 7); x.fill(); } });
  const subM = K.tmat(subTex, { roughness: .5 }), edge = K.plastic(0x1d5a3a, .5);
  const sub = at(K.mesh(new T.BoxGeometry(15, .5, 15), [edge, edge, subM, K.tmat(pads, { metalness: .6, roughness: .35 }), edge, edge]), 0, .25, 0);
  const caps = K.inst(new T.BoxGeometry(.5, .25, .28), K.metal(0xb0905a, .3), Array.from({ length: 24 }, (_, i) => [-6.6 + (i % 12) * 1.2, .62, i < 12 ? -6.9 : 6.9]));
  /* the die and its floor plan */
  const R = dieRegions();
  const dieTex = K.canvas(800, 600, (x, w, h) => {
    const sx = w / 8, sz = h / 6;
    x.fillStyle = '#20252f'; x.fillRect(0, 0, w, h);
    R.forEach(([x0, z0, x1, z1, c, id]) => {
      x.fillStyle = c; x.fillRect((x0 + 4) * sx + 1, (z0 + 3) * sz + 1, (x1 - x0) * sx - 2, (z1 - z0) * sz - 2);
      x.fillStyle = 'rgba(255,255,255,.07)';
      const cell = id === 'cache' || id === 'l2' ? 4 : 9;
      for (let px = (x0 + 4) * sx + 2; px < (x1 + 4) * sx - 2; px += cell) x.fillRect(px, (z0 + 3) * sz + 2, 1, (z1 - z0) * sz - 4);
    });
  });
  const dieM = K.tmat(dieTex, { roughness: .18, metalness: .35 }), dieSide = K.plastic(0x2a2f3a, .3);
  const die = at(K.mesh(new T.BoxGeometry(8, .3, 6), [dieSide, dieSide, dieM, dieSide, dieSide, dieSide]), 0, .65, 0);
  die.scale.set(1.2, 1, 1.2);
  /* the metal lid (integrated heat spreader) with its markings */
  const lidTop = K.print(13, 13, (x, w, h, s) => {
    const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#d7dce1'); gr.addColorStop(1, '#b4bbc2'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(40,46,54,.75)'; x.font = K.font(1.2 * s, 800); x.fillText('CPU', 1.2 * s, 3 * s);
    x.font = K.font(.75 * s, 600); x.fillText('8 CORES · 16 THREADS', 1.2 * s, 4.4 * s); x.fillText('4.5 GHz · 32 MB CACHE', 1.2 * s, 5.5 * s);
    x.font = K.font(.6 * s, 600, true); x.fillText('X1A7-2026  0042', 1.2 * s, 7.2 * s);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i * 7 + j * 3) % 5 < 2) x.fillRect(9.5 * s + i * .35 * s, 9 * s + j * .35 * s, .32 * s, .32 * s);
  }, { mat: { metalness: .85, roughness: .32 } });
  const lidM = K.metal(0xc4cad0, .35);
  const lid = g(at(K.mesh(new T.BoxGeometry(13, .55, 13), [lidM, lidM, lidTop, lidM, lidM, lidM]), 0, 1.3, 0),
    ...[[0, -6.25, 13, .5], [0, 6.25, 13, .5], [-6.25, 0, .5, 12], [6.25, 0, .5, 12]].map(([x, z, w, d]) => at(box(w, .55, d, lidM), x, .76, z)));
  K.ex(lid, 0, 7, -15);
  if (!o.quietLabels){
    const lab = (id, i) => { const [x0, z0, x1, z1] = R.filter(r => r[5] === id)[i]; K.label(id, die, (x0 + x1) / 2, .16, (z0 + z1) / 2, true); };
    lab('alu', 0); lab('registers', 2); lab('control-unit', 5); lab('cache', 0); lab('bus-interface', 0);
  }
  return g(sub, caps, die, lid);
}
export function cpu(K){
  const m = cpuChip(K);
  m.userData.view = [.45, 1.25, 1];
  return m;
}

/* ---------------- Motherboard ---------------- */
export function motherboard(K){
  const { g, at, box, cyl } = K, T = K.T;
  const pcb = at(box(30.5, .16, 24.4, K.tmat(K.pcbTex(30.5, 24.4, { seed: 101, px: 1600, color: '#10583f',
    silk: [['ATX-Z790', 1, 23.4, .6], ['CPU_FAN', 15.2, .9, .3], ['PCIEX16_1', 2.6, 15.2, .3], ['SATA', 27, 18.6, .3], ['BAT', 12.4, 23.6, .3]] }), { roughness: .55 })), 0, .08, 0);
  const T0 = .16, black = K.plastic(0x15171a, .5), grey = K.plastic(0x6b737c, .45), gun = K.metal(0x3b4148, .45);
  /* rear I/O cover and the port blocks behind it */
  const rio = g(at(box(2.6, 3.6, 15, K.plastic(0x2b3037, .4), .3), -13.6, T0 + 1.8, -4.5),
    at(box(.4, 3.0, 13.6, K.metal(0x8f979f, .4)), -15.1, T0 + 1.6, -4.5));
  /* the voltage regulators: chokes under two finned heatsinks */
  const chokes = K.inst(new T.BoxGeometry(1, 1, 1), K.plastic(0x4b5058, .5), [
    ...Array.from({ length: 8 }, (_, i) => [-8 + i * 1.3, T0 + .5, -8.7]), ...Array.from({ length: 5 }, (_, i) => [-8.6, T0 + .5, -7.2 + i * 1.3])]);
  const finGeo = new T.BoxGeometry(.32, 2.3, 2.4);
  const vrmTop = g(at(box(12, .8, 2.4, gun), -3, T0 + .4, -10.6), K.inst(finGeo, gun, Array.from({ length: 19 }, (_, i) => [-8.7 + i * .63, T0 + 1.9, -10.6])));
  const vrmLeft = g(at(box(2.4, .8, 9, gun), -10.6, T0 + .4, -4.5), K.inst(new T.BoxGeometry(2.4, 2.3, .32), gun, Array.from({ length: 14 }, (_, i) => [-10.6, T0 + 1.9, -8.7 + i * .63])));
  /* the CPU socket: a pin field in a black frame, with its lever */
  const pinTex = K.canvas(256, 300, (x) => { x.fillStyle = '#2a2017'; x.fillRect(0, 0, 256, 300); x.fillStyle = '#d9a84e';
    for (let i = 0; i < 40; i++) for (let j = 0; j < 46; j++) if (!(i > 14 && i < 25 && j > 16 && j < 29)) x.fillRect(8 + i * 6, 8 + j * 6.2, 3, 3); });
  const sockM = K.tmat(pinTex, { metalness: .5, roughness: .35 });
  const socket = g(at(K.mesh(new T.BoxGeometry(4.6, .45, 5.4), [black, black, sockM, black, black, black]), 0, T0 + .22, 0),
    at(box(5.6, .2, .5, K.metal(0xaab2ba, .3)), 0, T0 + .55, -2.9), at(box(5.6, .2, .5, K.metal(0xaab2ba, .3)), 0, T0 + .55, 2.9),
    at(cyl(.08, .08, 6, K.metal(0xc0c6cc, .3), 8), 3.1, T0 + .45, 0, PI / 2, 0, 0));
  socket.position.set(-3, 0, -4.5);
  /* four memory slots */
  const slots = [4.2, 5.2, 6.5, 7.5].map((x, i) => g(at(box(.75, 1.0, 13.6, i % 2 ? grey : black), x, T0 + .5, -4.5),
    at(box(.85, 1.35, .6, K.plastic(0xd7dde3)), x, T0 + .68, 2.45), at(box(.85, 1.35, .6, K.plastic(0xd7dde3)), x, T0 + .68, -11.45)));
  const atx = at(K.mesh(new T.BoxGeometry(1.8, 1.4, 5.2), [black, black, K.tmat(K.canvas(64, 192, (x) => { x.fillStyle = '#15171a'; x.fillRect(0, 0, 64, 192);
    x.fillStyle = '#000'; for (let i = 0; i < 2; i++) for (let j = 0; j < 12; j++) x.fillRect(10 + i * 26, 6 + j * 15.5, 18, 12); })), black, black, black]), 13.9, T0 + .7, -2.5);
  /* expansion slots: two PCIe x16 (the first one armoured) and an x1 */
  const pcie = (x, z, len, armour) => g(at(box(len, 1.1, .85, black), x, T0 + .55, z), armour ? at(box(len + .2, .9, 1.0, K.metal(0xb8c0c8, .3)), x, T0 + .45, z) : null,
    at(box(.6, 1.3, 1.0, K.plastic(0xd7dde3)), x + len / 2 + .3, T0 + .65, z));
  const x16a = pcie(-8, 3.5, 8.9, true), x16b = pcie(-8, 9.5, 8.9, false), x1 = pcie(-10.5, 6.5, 2.5, false);
  const m2 = g(at(box(.6, .4, 2.2, black), -6.3, T0 + .2, 6.5), at(cyl(.25, .25, .3, K.metal(0xc0c6cc, .3), 12), 1.9, T0 + .15, 6.5));
  /* the chipset under its heatsink, the BIOS chip, the CMOS battery, SATA ports and a fan header */
  const csTop = K.print(5.5, 5.5, (x, w, h, s) => { x.fillStyle = '#2a2f36'; x.fillRect(0, 0, w, h); x.strokeStyle = '#34d399'; x.lineWidth = .12 * s;
    x.beginPath(); x.moveTo(.6 * s, 4.8 * s); x.lineTo(2.2 * s, 1.2 * s); x.lineTo(4.9 * s, 1.2 * s); x.stroke(); x.fillStyle = '#c9ced3'; x.font = K.font(.55 * s, 800); x.fillText('CHIPSET', .7 * s, 3.4 * s); }, { mat: { metalness: .7, roughness: .4 } });
  const chipset = at(K.mesh(new T.BoxGeometry(5.5, 1.2, 5.5), [gun, gun, csTop, gun, gun, gun]), 8, T0 + .6, 7);
  const bios = at(K.chip(1.0, .25, .8, 'BIOS'), 3, T0 + .13, 10.8);
  const cmos = g(at(cyl(1.15, 1.15, .2, black, 32), 0, T0 + .1, 0), at(cyl(1.0, 1.0, .32, K.metal(0xd0d4d8, .22), 40), 0, T0 + .36, 0));
  cmos.position.set(-1, 0, 10.9);
  const sata = g(...[[6.5, 0], [6.5, 1], [8.2, 0], [8.2, 1]].map(([z, r]) => at(box(1.4, .85, 1.0, K.plastic(0x1d2025, .5)), 14.4, T0 + .45 + r * .95, z)));
  const fan = g(at(box(1.0, .6, .5, K.plastic(0xe8e8e8, .5)), 0, T0 + .3, 0), K.inst(new T.BoxGeometry(.08, .55, .08), K.gold(), [-.36, -.12, .12, .36].map(x => [x, T0 + .55, 0])));
  fan.position.set(1.5, 0, -11.4);
  const codec = at(K.chip(1.0, .2, 1.0, 'AUDIO'), -12.5, T0 + .1, 9.5);
  const lan = at(K.chip(.9, .2, .9, 'LAN'), -12.3, T0 + .1, 5.8);
  const capPos = [[-6.2, -1], [-6.2, -2], [-6.2, -3], [.2, -.6], [.9, -.6], [-11.8, 1.2], [-11.8, 2.2], [11.8, -9], [11.8, -8], [10, 3]];
  const capsT = K.inst(new T.CylinderGeometry(.32, .32, .8, 16), K.plastic(0x1b1e22, .4), capPos.map(([x, z]) => [x, T0 + .4, z]));
  const capsTop = K.inst(new T.CylinderGeometry(.3, .3, .02, 16), K.metal(0xc0c6cc, .3), capPos.map(([x, z]) => [x, T0 + .81, z]));
  const holes = K.inst(new T.TorusGeometry(.32, .1, 8, 20), K.metal(0xc0c6cc, .3), [[-14.4, -11.3], [-14.4, 11.3], [8.4, -11.3], [8.4, 11.3], [-2, -11.3], [13.6, 11.3], [-2, 11.3]].map(([x, z]) => [x, T0 + .02, z, PI / 2]));
  K.label('cpu-socket', socket, 0, .5, 0);
  K.label('ram-slots', slots[0], 4.2, 1.2, -9.5);
  K.label('vrm', vrmTop, -6, 3.0, -10.6);
  K.label('rear-io', rio, -13.6, 3.8, -9);
  K.label('atx-power', atx, 0, .8, 0);
  K.label('pcie', x16a, -9.5, 1.3, 3.5);
  K.label('chipset', chipset, 0, .7, 0);
  K.label('bios', bios, 0, .15, 0);
  K.label('cmos', cmos, 0, .55, 0);
  K.label('sata-ports', sata, 14.4, 2.1, 7.3);
  K.label('fan-header', fan, 0, .7, 0);
  const m = g(pcb, rio, chokes, vrmTop, vrmLeft, socket, ...slots, atx, x16a, x16b, x1, m2, chipset, bios, cmos, sata, fan, codec, lan, capsT, capsTop, holes);
  m.userData.slots = { socket: [-3, T0 + .45, -4.5], ram: [4.2, 5.2, 6.5, 7.5], ramZ: -4.5, pcie: [-8, T0 + 1.1, 3.5], m2: [-2.3, T0 + .45, 6.5] };
  m.userData.view = [.3, 1.2, 1];
  return m;
}

/* ---------------- RAM ---------------- */
export function ram(K){
  const { g, at, box } = K, T = K.T;
  const L = 13.34, H = 3.1;
  const s = K.shape(); s.moveTo(-L / 2, 0); s.lineTo(-1.05, 0); s.lineTo(-1.05, .4); s.lineTo(-.75, .4); s.lineTo(-.75, 0);
  s.lineTo(L / 2, 0); s.lineTo(L / 2, H); s.lineTo(-L / 2, H); s.lineTo(-L / 2, 0);
  const tex = K.pcbTex(L, H, { seed: 111, fingers: { x0: .25, x1: L - .25, h: .32, pitch: .085 }, density: .6 });
  tex.repeat.set(1 / L, 1 / H); tex.offset.set(.5, 0);
  const pcb = at(K.extrude(s, .13, K.tmat(tex, { roughness: .5 })), 0, 0, -.065);
  const chips = Array.from({ length: 8 }, (_, i) => at(K.chip(1.05, .12, 1.15, 'DDR5\n16Gb'), -5.6 + i * 1.6 + (i > 3 ? .1 : 0), 1.85, .125, PI / 2, 0, 0));
  const spd = at(K.chip(.45, .1, .35, ''), .35, .8, .115, PI / 2, 0, 0);
  const pmic = at(K.chip(.6, .1, .6, ''), -2.2, .85, .115, PI / 2, 0, 0);
  /* heat spreaders on both sides */
  const spread = K.print(13.2, 2.9, (x, w, h, sc) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a4048'); gr.addColorStop(1, '#24282e');
    x.fillStyle = gr; x.fillRect(0, 0, w, h); x.fillStyle = '#34d399'; x.fillRect(0, h * .12, w, .12 * sc);
    x.fillStyle = '#d7dde3'; x.font = K.font(.5 * sc, 800); x.fillText('DDR5  ·  16 GB  ·  6000 MT/s', .6 * sc, 1.6 * sc);
    x.fillStyle = '#8a939c'; x.font = K.font(.32 * sc, 600); x.fillText('CL30  1.35 V', .6 * sc, 2.2 * sc); }, { mat: { metalness: .75, roughness: .35 } });
  const sideM = K.metal(0x2c3138, .4);
  const plate = z => at(K.mesh(new T.BoxGeometry(13.2, 2.9, .12), [sideM, sideM, sideM, sideM, spread, spread]), 0, 1.85, z);
  const front = plate(.33), back = plate(-.33); back.rotation.y = PI;
  K.ex(front, 0, 0, 3.2); K.ex(back, 0, 0, -3.2);
  K.label('dram', chips[2], 0, .1, 0, true);
  K.label('memory-cells', chips[6], 0, .1, 0, true);
  K.label('spd', spd, 0, .1, 0, true);
  const m = g(pcb, ...chips, spd, pmic, front, back);
  m.userData.view = [.45, .5, 1];
  return m;
}

/* ---------------- Fan (used by the graphics card, cooler, power supply and case) ---------------- */
export function fanBlades(K, r, n, color, hubTex){
  const { g, at, box, cyl } = K, T = K.T;
  const bm = K.plastic(color, .5); bm.side = T.DoubleSide;
  const hubSide = K.plastic(color, .5);
  const hub = at(K.mesh(new T.CylinderGeometry(r * .32, r * .32, r * .18, 32), hubTex ? [hubSide, K.tmat(hubTex), hubSide] : hubSide), 0, 0, 0, PI / 2, 0, 0);
  /* a swept blade, tilted about its own length */
  const bs = K.shape(); bs.moveTo(r * .28, -r * .1); bs.quadraticCurveTo(r * .62, -r * .26, r * .96, -r * .1);
  bs.quadraticCurveTo(r * 1.0, r * .05, r * .93, r * .16); bs.quadraticCurveTo(r * .6, r * .1, r * .28, r * .12); bs.lineTo(r * .28, -r * .1);
  const blade = new T.ExtrudeGeometry(bs, { depth: r * .02, bevelEnabled: false, curveSegments: 10 }); blade.translate(0, 0, -r * .01);
  const blades = Array.from({ length: n }, (_, i) => { const p = new T.Group(); p.rotation.z = i * PI * 2 / n;
    const b = K.mesh(blade, bm); b.rotation.x = .5; p.add(b); return p; });
  return g(hub, ...blades);
}

/* ---------------- Graphics card ---------------- */
export function gpu(K){
  const { g, at, box, cyl } = K, T = K.T;
  /* the board, with the PCIe contacts on a tab along the bottom, near the bracket (−x). Seen from the fans with the
     contacts down, the bracket is on the left, as on a real card */
  const s = K.shape(); s.moveTo(-14.5, 0); s.lineTo(-12, 0); s.lineTo(-12, -.9); s.lineTo(-3, -.9); s.lineTo(-3, 0); s.lineTo(14.5, 0); s.lineTo(14.5, 11); s.lineTo(-14.5, 11); s.lineTo(-14.5, 0);
  const tex = K.pcbTex(29, 11.9, { seed: 121, color: '#141a1f', trace: 'rgba(110,130,150,.35)', fingers: { x0: 2.6, x1: 11.4, h: .85, pitch: .1 }, px: 1400 });
  tex.repeat.set(1 / 29, 1 / 11.9); tex.offset.set(.5, .9 / 11.9);
  const pcb = at(K.extrude(s, .16, K.tmat(tex, { roughness: .5 })), 0, 0, -.08);
  /* the GPU chip with its memory chips around it, and the power stages */
  const subst = at(box(4.6, 4.6, .16, K.plastic(0x2c5a3c, .5)), -1, 5.5, .16);
  const dieTex = K.canvas(256, 220, (x, w, h) => { x.fillStyle = '#2a2f3a'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++){ x.fillStyle = (i + j) % 3 ? '#3d5a7a' : '#4a6a4a'; x.fillRect(8 + i * 30, 8 + j * 34, 26, 30); }
    x.fillStyle = '#6a5a3a'; x.fillRect(8, 100, 240, 16); });
  const dieSide = K.plastic(0x2a2f3a, .25);
  const die = at(K.mesh(new T.BoxGeometry(2.8, 2.4, .14), [dieSide, dieSide, dieSide, dieSide, K.tmat(dieTex, { roughness: .15, metalness: .4 }), dieSide]), -1, 5.5, .3);
  const vram = [[-4.7, 3.4], [-4.7, 7.6], [2.7, 3.4], [2.7, 7.6], [-2.9, 9.4], [.9, 9.4], [-2.9, 1.6], [.9, 1.6]].map(([x, y]) => at(K.chip(1.4, .12, 1.2, 'GDDR6X'), x, y, .14, PI / 2, 0, 0));
  const stages = K.inst(new T.BoxGeometry(.8, .8, .12), K.plastic(0x1b1e22, .4), Array.from({ length: 10 }, (_, i) => [5.6 + (i % 5) * 1.3, 8.6 + Math.floor(i / 5) * 1.0, .14]));
  const chokes = K.inst(new T.BoxGeometry(1.0, 1.0, .9), K.plastic(0x4b5058, .5), Array.from({ length: 5 }, (_, i) => [5.6 + i * 1.3, 6.7, .53]));
  const powerTop = K.canvas(96, 48, (x) => { x.fillStyle = '#15171a'; x.fillRect(0, 0, 96, 48); x.fillStyle = '#000'; for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) x.fillRect(6 + i * 15, 6 + j * 20, 11, 15); });
  const power = at(K.mesh(new T.BoxGeometry(2.6, 1.2, 1.0), [K.plastic(0x15171a), K.plastic(0x15171a), K.tmat(powerTop), K.plastic(0x15171a), K.plastic(0x15171a), K.plastic(0x15171a)]), 9.5, 11.5, .5);
  /* the bracket with the display outputs */
  const steel = K.metal(0xb8c0c8, .35);
  const portTex = kind => K.canvas(128, 48, (x) => { x.fillStyle = '#c0c6cc'; x.fillRect(0, 0, 128, 48); x.fillStyle = '#0b0c0e';
    if (kind === 'hdmi'){ x.beginPath(); x.moveTo(8, 8); x.lineTo(120, 8); x.lineTo(120, 30); x.lineTo(108, 40); x.lineTo(20, 40); x.lineTo(8, 30); x.fill(); }
    else { x.beginPath(); x.moveTo(8, 8); x.lineTo(120, 8); x.lineTo(120, 40); x.lineTo(20, 40); x.lineTo(8, 28); x.fill(); }
    x.fillStyle = '#2a2d33'; x.fillRect(24, 20, 80, 8); });
  const port = (y, kind) => at(K.mesh(new T.BoxGeometry(.5, 1.5, .55), [steel, K.tmat(portTex(kind), { metalness: .6, roughness: .35 }), steel, steel, steel, steel]), -14.95, y, 1.0, 0, 0, 0);
  const bracket = g(at(box(.12, 12.6, 4.4, steel), -14.75, 5.1, 1.5), at(box(1.4, .12, 4.4, steel), -14.1, 11.35, 1.5),
    ...[2.0, 4.0, 6.0].map(y => port(y, 'dp')), port(8.0, 'hdmi'),
    K.inst(new T.BoxGeometry(.06, .25, 1.4), K.plastic(0x0b0c0e), Array.from({ length: 8 }, (_, i) => [-14.82, 1.0 + i * 1.2, 2.8])));
  /* the cooler: copper plate and heat pipes, a stack of fins, then the shroud with three fans */
  const base = at(box(5.2, 5.2, .35, K.copper()), -1, 5.5, .55);
  const pipes = g(...[3.2, 5.5, 7.8].map(y => at(K.cyl(.3, .3, 27, K.copper(), 16), 0, y, .95, 0, 0, PI / 2)));
  const fins = K.inst(new T.BoxGeometry(.07, 10.2, 2.8), K.metal(0xc9ced3, .35), Array.from({ length: 76 }, (_, i) => [-13.5 + i * .36, 5.6, 2.1]));
  const sink = g(base, pipes, fins); K.ex(sink, 0, 12, 3);
  const shroudShape = K.rrect(29.2, 11.6, 1.4); [-9.5, 0, 9.5].forEach(x => shroudShape.holes.push(K.circle(4.35, x, 0)));
  const shroud = at(K.extrude(shroudShape, .5, K.plastic(0x23272d, .45), .2), 0, 5.6, 3.6);
  const accents = K.inst(new T.BoxGeometry(2.2, .14, .05), K.glow(0x34d399, 1.2), [[-14, 5.6, 4.32], [14, 5.6, 4.32], [-4.75, 10.9, 4.32], [4.75, 10.9, 4.32]].map(a => a));
  const hubTex = K.canvas(128, 128, (x) => { x.fillStyle = '#1b1e22'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#34d399'; x.lineWidth = 6; x.beginPath(); x.arc(64, 64, 40, 0, 7); x.stroke(); });
  const fans = [-9.5, 0, 9.5].map((x, i) => { const f = fanBlades(K, 4.25, 11, 0x1e2126, hubTex); f.position.set(x, 5.6, 3.9); K.spin(f, 'z', (i % 2 ? -1 : 1) * 4.5); return f; });
  const rings = [-9.5, 0, 9.5].map(x => at(K.torus(4.3, .12, K.plastic(0x15171a), 8, 48), x, 5.6, 4.0));
  const top = g(shroud, accents, ...fans, ...rings); K.ex(top, 0, 24, 7);
  const back = at(box(29, 11, .2, K.print(29, 11, (x, w, h, sc) => { x.fillStyle = '#2a2f36'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#3a4048'; for (let i = 0; i < 30; i++) x.fillRect(i * sc, 0, .05 * sc, h); x.fillStyle = '#c9ced3'; x.font = K.font(1 * sc, 800); x.fillText('GRAPHICS', 2 * sc, 6 * sc); }, { mat: { metalness: .7, roughness: .4 } })), 0, 5.5, -.45);
  back.rotation.y = PI;
  K.ex(back, 0, 0, -4);
  K.label('compute-units', die, 0, 0, .1, true);
  K.label('vram', vram[2], 0, .1, 0, true);
  K.label('gpu-power', power, 0, .6, 0);
  K.label('gpu-pcie', pcb, -7.5, -.9, .1);
  K.label('display-outputs', bracket, -15.0, 9.4, 1.0);
  const m = g(pcb, subst, die, ...vram, stages, chokes, power, bracket, sink, top, back);
  m.userData.view = [.45, .35, 1];
  return m;
}

/* ---------------- SSD (M.2 2280, drawn 2 times life size) ---------------- */
export function ssd(K){
  const { g, at, box } = K, T = K.T;
  const s = K.shape(); s.moveTo(-4, -1.1); s.lineTo(4, -1.1); s.lineTo(4, -.35); s.absarc(4, 0, .35, -PI / 2, PI / 2, true);
  s.lineTo(4, 1.1); s.lineTo(-4, 1.1); s.lineTo(-4, -.15); s.lineTo(-3.55, -.15); s.lineTo(-3.55, -.4); s.lineTo(-4, -.4); s.lineTo(-4, -1.1);
  const tex = K.pcbTex(8, 2.2, { seed: 131, color: '#123d2e', density: .8 });
  { const x = tex.image.getContext('2d'), sc = tex.image.width / 8; x.fillStyle = '#d9a84e';
    for (let y = .08; y < 2.1; y += .1) if (y < 1.2 || y > 1.55) x.fillRect(0, y * sc, .4 * sc, .06 * sc); tex.needsUpdate = true; }
  tex.repeat.set(1 / 8, 1 / 2.2); tex.offset.set(.5, .5);
  const pcb = K.extrude(s, .08, K.tmat(tex, { roughness: .5 })); pcb.rotation.x = -PI / 2;
  const ctrl = at(K.chip(1.4, .15, 1.4, 'NVMe\nCTRL'), -2.2, .155, 0);
  const dram = at(K.chip(.9, .12, 1.1, 'DRAM'), -.65, .14, 0);
  const nand = [.95, 2.75].map(x => at(K.chip(1.6, .14, 1.6, 'NAND\n1TB'), x, .15, 0));
  const sticker = at(box(6.4, .02, 1.9, K.print(6.4, 1.9, (x, w, h, sc) => { x.fillStyle = '#15171a'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#34d399'; x.fillRect(0, 0, .25 * sc, h); x.fillStyle = '#e7eef5'; x.font = K.font(.36 * sc, 800); x.fillText('NVMe SSD  1 TB', .5 * sc, .75 * sc);
    x.fillStyle = '#93a3b4'; x.font = K.font(.22 * sc, 600); x.fillText('PCIe 4.0 x4  ·  M.2 2280', .5 * sc, 1.2 * sc); x.fillText('7000 MB/s', .5 * sc, 1.6 * sc); })), -.2, .245, 0);
  K.ex(sticker, 0, 1.6, 0);
  K.label('ssd', sticker, 1.6, .02, -.4);
  K.label('m2-connector', pcb, -3.8, .75, -.1);
  K.label('ssd-controller', ctrl, 0, .1, 0, true);
  K.label('dram-cache', dram, 0, .07, 0, true);
  K.label('nand-flash', nand[1], 0, .08, 0, true);
  const m = g(pcb, ctrl, dram, ...nand, sticker);
  m.scale.setScalar(2);
  const w = g(m); w.userData.view = [.35, .9, 1];
  return w;
}

/* ---------------- Hard drive (3.5 inch) ---------------- */
export function hdd(K, o = {}){
  const { g, at, box, cyl } = K, T = K.T;
  const cast = K.metal(0xb9c0c7, .5);
  const base = g(at(box(10.2, .3, 14.7, cast), 0, .15, 0), at(box(.4, 2.2, 14.7, cast), -4.9, 1.4, 0), at(box(.4, 2.2, 14.7, cast), 4.9, 1.4, 0),
    at(box(10.2, 2.2, .4, cast), 0, 1.4, -7.15), at(box(10.2, 2.2, .4, cast), 0, 1.4, 7.15));
  const mirror = K.metal(0xe6eaee, .06);
  const platters = g(at(cyl(4.6, 4.6, .1, mirror, 64), 0, 1.0, 0), at(cyl(4.6, 4.6, .1, mirror, 64), 0, .6, 0)); platters.position.z = -2.3;
  const spindle = g(at(cyl(1.5, 1.5, .5, K.metal(0xd0d4d8, .2), 40), 0, 1.3, 0),
    K.inst(new T.CylinderGeometry(.14, .14, .08, 12), K.metal(0x9aa2aa, .3), Array.from({ length: 6 }, (_, i) => [Math.cos(i * PI / 3) * 1.0, 1.58, Math.sin(i * PI / 3) * 1.0])));
  spindle.position.z = -2.3;
  K.spin(platters, 'y', 3); K.spin(spindle, 'y', 3);
  /* the actuator: an arm that swings the head across the platter, driven by a voice coil between magnets */
  const armS = K.shape(); armS.moveTo(-.7, 0); armS.lineTo(.7, 0); armS.lineTo(.16, 5.3); armS.lineTo(-.16, 5.3); armS.lineTo(-.7, 0);
  const arm = K.extrude(armS, .12, K.metal(0xc9ced3, .3)); arm.rotation.x = -PI / 2;
  const head = at(box(.3, .12, .45, K.plastic(0x2a2d33, .4)), 0, -.1, -5.2);
  const coil = at(box(1.0, .25, 1.6, K.copper()), 0, 0, 1.2);
  const pivot = at(cyl(.65, .65, 1.4, K.metal(0x9aa2aa, .3), 24), 0, -.3, 0);
  const act = g(arm, head, coil, pivot); act.position.set(3.4, 1.35, 4.6);
  act.rotation.y = .35; K.tick((dt, t) => { act.rotation.y = .35 + .17 * Math.sin(t * 1.7); });
  const magnet = at(box(2.6, .6, 1.6, K.plastic(0x3a3f46, .4)), 3.0, .9, 6.0);
  const sata = g(at(box(4.2, .8, .6, K.plastic(0x15171a, .5)), 1.2, .55, 7.6), at(box(1.6, .8, .6, K.plastic(0x15171a, .5)), -2.6, .55, 7.6));
  const cover = at(K.mesh(new T.BoxGeometry(10.2, .15, 14.7), [cast, cast, K.print(10.2, 14.7, (x, w, h, sc) => {
    x.fillStyle = '#c4cad0'; x.fillRect(0, 0, w, h); x.fillStyle = '#f4f6f8'; x.fillRect(.8 * sc, 1.2 * sc, 8.6 * sc, 7.4 * sc);
    x.fillStyle = '#0f1a24'; x.font = K.font(.8 * sc, 800); x.fillText('HARD DRIVE', 1.3 * sc, 2.6 * sc);
    x.font = K.font(.5 * sc, 600); x.fillText('4 TB  ·  7200 RPM  ·  SATA 6 Gb/s', 1.3 * sc, 3.6 * sc); x.fillText('3.5 inch  ·  256 MB cache', 1.3 * sc, 4.4 * sc);
    for (let i = 0; i < 40; i++) x.fillRect(1.3 * sc + i * .17 * sc, 5.4 * sc, (i % 3 ? .06 : .11) * sc, 1.4 * sc);
    x.fillStyle = '#9aa2aa'; [[.6, .6], [9.6, .6], [.6, 14.1], [9.6, 14.1]].forEach(([a, b]) => { x.beginPath(); x.arc(a * sc, b * sc, .25 * sc, 0, 7); x.fill(); });
  }, { mat: { metalness: .5, roughness: .45 } }), cast, cast, cast]), 0, 2.58, 0);
  K.ex(cover, 0, 10, -3);
  const board = g(at(box(9.4, .14, 10, K.tmat(K.pcbTex(9.4, 10, { seed: 141 }))), 0, -.1, 1.5),
    at(K.chip(1.6, .2, 1.6, 'HDD\nCTRL'), -1.5, -.25, 2), at(K.chip(1.0, .2, 1.4, 'CACHE'), 1.2, -.25, 2), at(K.chip(1.4, .2, 1.0, 'MOTOR'), -1, -.25, 4.5));
  board.children.slice(1).forEach(c => { c.rotation.x = PI; });
  K.ex(board, 0, -6, 0);
  if (!o.quietLabels){
    K.label('hdd', cover, -2, .1, -3);
    K.label('hdd-platter', platters, -3.0, 1.1, 1.5, true);
    K.label('hdd-spindle', spindle, 0, 1.6, 0, true);
    K.label('hdd-arm', act, 0, .1, -2.4, true);
    K.label('hdd-head', head, 0, .1, 0, true);
    K.label('hdd-controller-board', board, 3, -.3, 1.5, true);
  }
  const m = g(base, platters, spindle, act, magnet, sata, cover, board);
  m.userData.view = [.4, 1.0, 1];
  return m;
}

/* ---------------- Storage: an SSD in front of a hard drive ---------------- */
export function storage(K){
  const h = hdd(K), s = ssd(K);
  h.position.set(-6, 0, -2); s.position.set(13, 0, 5); s.rotation.y = -.35;
  const m = K.g(h, s);
  m.userData.view = [.35, .95, 1];
  return m;
}

/* ---------------- Power supply ---------------- */
export function psu(K, o = {}){
  const { g, at, box, cyl } = K, T = K.T;
  const W = 15, H = 8.6, D = 14;
  const caseM = K.metal(0x1c1f23, .55);
  const rearTex = K.print(W, H, (x, w, h, s) => { x.fillStyle = '#1c1f23'; x.fillRect(0, 0, w, h); x.fillStyle = '#060708';
    for (let j = 0; j < 14; j++) for (let i = 0; i < 26; i++){ const cx = (5.6 + i * .34 + (j % 2) * .17) * s, cy = (.8 + j * .5) * s; if (cx < (W - .5) * s) { x.beginPath();
      for (let k = 0; k < 6; k++) x.lineTo(cx + Math.cos(k * PI / 3) * .14 * s, cy + Math.sin(k * PI / 3) * .14 * s); x.fill(); } }
    x.fillStyle = '#e7eef5'; x.font = K.font(.32 * s, 700); x.fillText('100-240V~  50/60Hz  8A', .6 * s, (H - .5) * s); }, { mat: { metalness: .6, roughness: .5 } });
  const rear = at(K.mesh(new T.BoxGeometry(W, H, .15), [caseM, caseM, caseM, caseM, rearTex, caseM]), 0, H / 2, D / 2 - .075);
  const socket = g(at(box(2.8, 1.8, .4, K.plastic(0x101113, .5), .15), 0, 0, 0), K.inst(new T.BoxGeometry(.2, .5, .1), K.plastic(0x000000), [[-.7, -.1, .2], [0, -.1, .2], [.7, -.1, .2]]));
  socket.position.set(-4.6, H / 2 - .6, D / 2 + .15);
  const sw = g(at(box(1.3, 1.7, .35, K.plastic(0x101113, .5), .1), 0, 0, 0), at(box(1.0, 1.4, .3, K.plastic(0x2a2d33, .5), .1), 0, 0, .15, .2, 0, 0));
  sw.position.set(-1.6, H / 2 - .6, D / 2 + .1);
  const shell = g(at(box(W, .12, D, caseM), 0, .06, 0), at(box(.12, H, D, caseM), -W / 2 + .06, H / 2, 0), at(box(.12, H, D, caseM), W / 2 - .06, H / 2, 0),
    rear, at(box(W, H, .15, caseM), 0, H / 2, -D / 2 + .075), socket, sw);
  /* the top, with the fan and its grille; it lifts off */
  const topS = K.rrect(W, D, .2); topS.holes.push(K.circle(6.0, 0, 0));
  const topPlate = at(K.extrude(topS, .12, caseM, 0), 0, H, 0, -PI / 2, 0, 0);
  const grille = g(...[1.8, 3.6, 5.6].map(r => at(K.torus(r, .06, K.metal(0x8a939c, .3), 6, 64), 0, 0, 0, PI / 2, 0, 0)),
    ...[0, 1, 2, 3].map(i => at(box(12, .1, .12, K.metal(0x8a939c, .3)), 0, 0, 0, 0, i * PI / 4, 0)));
  grille.position.y = H + .14;
  const hub = K.canvas(128, 128, (x) => { x.fillStyle = '#1b1e22'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#c9ced3'; x.font = K.font(18, 800); x.textAlign = 'center'; x.fillText('850 W', 64, 60); x.font = K.font(13, 600); x.fillText('80+ GOLD', 64, 80); });
  const fan = fanBlades(K, 5.8, 9, 0x22262b, hub); fan.rotation.x = -PI / 2; fan.position.y = H - 1.2;
  const fanSpin = g(fan); K.tick(dt => { fan.rotation.z += 5 * dt; });
  const top = g(topPlate, grille, fanSpin); K.ex(top, 0, 12, -13);
  /* inside: board, heatsinks, the big filter capacitor, the transformer, the bridge rectifier and the DC-DC regulator board */
  const pcb = at(box(W - .6, .14, D - .6, K.tmat(K.pcbTex(14.4, 13.4, { seed: 151, color: '#3a3527', trace: 'rgba(200,180,120,.35)' }))), 0, .26, 0);
  const alu = K.metal(0xc9ced3, .35);
  const sinkA = g(at(box(.3, 4.6, 8, alu), 0, 2.6, 0), K.inst(new T.BoxGeometry(1.6, 4.4, .12), alu, Array.from({ length: 12 }, (_, i) => [.9, 2.6, -3.6 + i * .66])));
  sinkA.position.set(-3, 0, 1);
  const sinkB = g(at(box(.3, 4.2, 7, alu), 0, 2.4, 0), K.inst(new T.BoxGeometry(1.4, 4.0, .12), alu, Array.from({ length: 10 }, (_, i) => [-.8, 2.4, -3.0 + i * .66])));
  sinkB.position.set(4.2, 0, .5);
  const capTex = K.print(7, 3.6, (x, w, h, s) => { x.fillStyle = '#16233d'; x.fillRect(0, 0, w, h); x.fillStyle = '#d7dde3'; x.fillRect(0, 0, .5 * s, h);
    x.font = K.font(.45 * s, 700); x.fillText('470µF 400V', 1.2 * s, 1.6 * s); x.fillText('105°C', 1.2 * s, 2.4 * s); });
  const capTop = K.print(2.2, 2.2, (x, w, h) => { x.fillStyle = '#b8c0c8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#6a737c'; x.lineWidth = w * .05;
    x.beginPath(); x.moveTo(w / 2, h * .1); x.lineTo(w / 2, h * .9); x.moveTo(w * .1, h / 2); x.lineTo(w * .9, h / 2); x.stroke(); }, { mat: { metalness: .8, roughness: .3 } });
  const filter = at(K.mesh(new T.CylinderGeometry(1.1, 1.1, 3.6, 40), [capTex, capTop, capTex]), -5.6, 2.15, -3.6);
  const smallCaps = K.inst(new T.CylinderGeometry(.4, .4, 1.4, 16), K.plastic(0x1b1e22, .4), [[2.6, 1.0, -4.8], [3.5, 1.0, -4.8], [2.6, 1.0, 4.6], [6.2, 1.0, 4.6], [6.2, 1.0, 3.6]]);
  const xf = g(at(box(2.6, 2.6, 2.6, K.plastic(0xe6c34a, .6)), 0, 0, 0), at(box(.5, 3.0, 2.7, K.plastic(0x2a2d31, .5)), -1.5, 0, 0), at(box(.5, 3.0, 2.7, K.plastic(0x2a2d31, .5)), 1.5, 0, 0));
  xf.position.set(.6, 1.85, -1.8);
  const rect = at(K.chip(.4, 2.2, 1.5, ''), -5.6, 1.4, .2);
  const rectFace = at(K.plane(1.4, 2.0, K.print(1.4, 2, (x, w, h) => { x.fillStyle = '#1b1e22'; x.fillRect(0, 0, w, h); x.fillStyle = '#a9b1ba'; x.font = K.font(w / 4.5, 800, true);
    x.textAlign = 'center'; x.fillText('GBU', w / 2, h * .4); x.fillText('~ + −', w / 2, h * .65); })), -5.39, 1.4, .2, 0, PI / 2, 0);
  const dcdc = g(at(box(.14, 3.0, 4.2, K.tmat(K.pcbTex(4.2, 3, { seed: 153 }))), 0, 1.8, 0),
    at(K.torus(.6, .25, K.plastic(0xe6c34a, .6), 10, 24), .5, 2.2, -.9, 0, PI / 2, 0), at(K.torus(.6, .25, K.plastic(0x2a2d31, .6), 10, 24), .5, 2.2, .9, 0, PI / 2, 0),
    at(K.chip(.2, .8, .8, ''), .2, 1.0, 0));
  dcdc.position.set(6.3, 0, -3.8);
  const cables = o.cables === false ? null : g(...[[-4.5, 3.0, .5], [-2.6, 2.4, .42], [-1.0, 2.6, .35], [.6, 2.2, .35], [2.2, 2.6, .35]].map(([x, y, r], i) =>
    K.tube([[x, y, -D / 2], [x, y - .4, -D / 2 - 3], [x * .7, .6, -D / 2 - 8 - i], [x * .5 - 4, .45, -D / 2 - 12 - i * 1.5]], r, K.rubber(0x15171a), 40, 8)),
    at(box(5.4, 1.4, 2.0, K.plastic(0x15171a, .5)), -5.8, .7, -D / 2 - 12.6, 0, .9, 0));
  K.label('filter-caps', filter, 0, 1.85, 0, true);
  K.label('transformer', xf, 0, 1.35, 0, true);
  K.label('rectifier', rectFace, 0, .6, 0, true);
  K.label('voltage-regulation', dcdc, 0, 3.3, 0, true);
  const m = g(shell, top, pcb, sinkA, sinkB, filter, smallCaps, xf, rect, rectFace, dcdc, cables);
  m.userData.view = [.5, .85, 1];
  return m;
}

/* ---------------- Cooling: a tower cooler on a CPU ---------------- */
export function cooling(K, o = {}){
  const { g, at, box, cyl } = K, T = K.T;
  /* a CPU at life size under it, with thermal paste */
  const chip = g(at(box(4.5, .15, 4.5, K.plastic(0x1d5a3a, .5)), 0, .075, 0), at(box(3.7, .4, 3.7, K.metal(0xc4cad0, .35), .08), 0, .35, 0));
  const paste = at(K.sph(1.5, K.plastic(0x9aa2aa, .7), 32, 12), 0, .55, 0); paste.scale.set(1, .07, 1);
  /* the cooler: copper base, heat pipes, fin stack and fan */
  const base = g(at(box(4.0, .8, 4.0, K.copper()), 0, .4, 0), at(box(9.0, .3, 1.2, K.metal(0x8f979f, .4)), 0, .95, 0));
  const pipes = g(...[0, 1, 2, 3].map(i => { const z = -1.6 + i * 1.07, xe = 2.0 + i * .75;
    return K.tube([[-xe, 16.4, z], [-xe, 4.0, z], [-xe * .6, 1.3, z], [-xe * .25, .55, z], [xe * .25, .55, z], [xe * .6, 1.3, z], [xe, 4.0, z], [xe, 16.4, z]], .3, K.copper(), 96, 12); }));
  const fins = K.inst(new T.BoxGeometry(12, .05, 5.2), K.metal(0xd0d5da, .3), Array.from({ length: 41 }, (_, i) => [0, 3.5 + i * .3, 0]));
  const lid = at(K.mesh(new T.BoxGeometry(12.2, .4, 5.4), [K.plastic(0x1b1e22), K.plastic(0x1b1e22), K.print(12.2, 5.4, (x, w, h, s) => {
    x.fillStyle = '#1b1e22'; x.fillRect(0, 0, w, h); for (let i = 0; i < h; i += 3){ x.fillStyle = 'rgba(255,255,255,.04)'; x.fillRect(0, i, w, 1); }
    x.fillStyle = '#34d399'; x.fillRect(.5 * s, 2.5 * s, 11.2 * s, .08 * s); x.fillStyle = '#c9ced3'; x.font = K.font(.6 * s, 800); x.fillText('TOWER COOLER', .5 * s, 2 * s); }, { mat: { metalness: .6, roughness: .4 } }),
    K.plastic(0x1b1e22), K.plastic(0x1b1e22), K.plastic(0x1b1e22)]), 0, 15.95, 0);
  const caps = K.inst(new T.SphereGeometry(.3, 12, 8), K.copper(), [0, 1, 2, 3].flatMap(i => { const z = -1.6 + i * 1.07, xe = 2.0 + i * .75; return [[-xe, 16.4, z], [xe, 16.4, z]]; }));
  const cooler = g(base, pipes, fins, caps, lid);
  /* the fan, on the front of the fins */
  const fs = K.rrect(12, 12, 1.2); fs.holes.push(K.circle(5.6));
  const frame = at(K.extrude(fs, 2.2, K.plastic(0x23272d, .55), .1), 0, 0, -1.1);
  const blades = fanBlades(K, 5.4, 7, 0x2b3038, null);
  K.spin(blades, 'z', 6);
  const fan = g(frame, blades); fan.position.set(0, 9.6, 3.85);
  const all = g(cooler, fan); all.position.y = .58;
  K.ex(cooler, 0, 7, 0); K.ex(fan, 0, 7, 9);
  K.label('heatsink', fins, -5.4, 12, -2.6);
  K.label('heat-pipes', pipes, 2.75, 16.7, -.53);
  K.label('fan', fan, 0, 3.5, 1.2);
  K.label('thermal-paste', paste, 0, .5, 0, true);
  const m = g(chip, paste, all);
  m.userData.view = [.75, .55, 1];
  return m;
}

/* ---------------- I/O ports: the back panel ---------------- */
export function io(K){
  const { g, at, box, cyl } = K, T = K.T;
  const steel = K.metal(0xc0c6cc, .32);
  /* each port's opening is drawn on the front of a box */
  const face = (w, h, draw) => K.canvas(Math.round(w * 64), Math.round(h * 64), (x, cw, ch) => { x.fillStyle = '#c0c6cc'; x.fillRect(0, 0, cw, ch); draw(x, cw, ch); });
  const portM = new Map();
  const port = (kind, w, h, d, draw) => { if (!portM.has(kind)) portM.set(kind, K.tmat(face(w, h, draw), { metalness: .5, roughness: .35 })); return K.mesh(new T.BoxGeometry(w, h, d), [steel, steel, steel, steel, portM.get(kind), steel]); };
  const usbA = c => (x, w, h) => { x.fillStyle = '#0b0c0e'; x.fillRect(w * .08, h * .12, w * .84, h * .76); x.fillStyle = c; x.fillRect(w * .14, h * .2, w * .72, h * .3); };
  const usbC = (x, w, h) => { x.fillStyle = '#0b0c0e'; const r = h * .32; x.beginPath(); x.roundRect(w * .1, h * .18, w * .8, h * .64, r); x.fill(); x.fillStyle = '#2a2d33'; x.fillRect(w * .25, h * .44, w * .5, h * .12); };
  const items = [];
  const put = (o, xx, y) => { o.position.set(xx, y, -.6); items.push(o); return o; };
  /* Wi-Fi antenna sockets */
  [1.6, 3.6].forEach(y => { const a = at(cyl(.32, .32, 1.4, K.gold(), 20), -7.1, y, .1, PI / 2, 0, 0); items.push(a); });
  ['#15171a', '#15171a', '#15171a', '#15171a'].forEach((c, i) => put(port('usbA' + c, 1.35, .62, 1.6, usbA(c)), -5.4, 1.2 + i * .95));
  const hdmi = put(port('hdmi', 1.5, .62, 1.6, (x, w, h) => { x.fillStyle = '#0b0c0e'; x.beginPath(); x.moveTo(w * .06, h * .15); x.lineTo(w * .94, h * .15); x.lineTo(w * .94, h * .6);
    x.lineTo(w * .84, h * .85); x.lineTo(w * .16, h * .85); x.lineTo(w * .06, h * .6); x.fill(); x.fillStyle = '#2a2d33'; x.fillRect(w * .2, h * .42, w * .6, h * .14); }), -3.3, 1.3);
  put(port('dp', 1.5, .62, 1.6, (x, w, h) => { x.fillStyle = '#0b0c0e'; x.beginPath(); x.moveTo(w * .06, h * .15); x.lineTo(w * .94, h * .15); x.lineTo(w * .94, h * .85);
    x.lineTo(w * .18, h * .85); x.lineTo(w * .06, h * .6); x.fill(); x.fillStyle = '#2a2d33'; x.fillRect(w * .2, h * .42, w * .6, h * .14); }), -3.3, 2.4);
  const blue = '#2b6fd6';
  const usb = put(port('usbA' + blue, 1.35, .62, 1.6, usbA(blue)), -1.2, 1.2); put(port('usbA' + blue, 1.35, .62, 1.6, usbA(blue)), -1.2, 2.15);
  put(port('usbC', 1.0, .42, 1.6, usbC), -1.2, 3.3);
  const red = '#d33b2a';
  put(port('usbA' + red, 1.35, .62, 1.6, usbA(red)), 1.3, 1.2); put(port('usbA' + red, 1.35, .62, 1.6, usbA(red)), 1.3, 2.15);
  const rj = put(port('rj45', 1.6, 1.4, 2.0, (x, w, h) => { x.fillStyle = '#0b0c0e'; x.fillRect(w * .16, h * .2, w * .68, h * .62); x.fillRect(w * .38, h * .82, w * .24, h * .1);
    x.fillStyle = '#c9a54a'; for (let i = 0; i < 8; i++) x.fillRect(w * (.22 + i * .07), h * .24, w * .03, h * .12);
    x.fillStyle = '#3cb44b'; x.fillRect(w * .04, h * .05, w * .12, h * .1); x.fillStyle = '#f2b705'; x.fillRect(w * .84, h * .05, w * .12, h * .1); }), 1.3, 3.55);
  put(port('usbC', 1.0, .42, 1.6, usbC), 3.7, 1.2); put(port('usbC', 1.0, .42, 1.6, usbC), 3.7, 1.9);
  put(port('usbA#15171a', 1.35, .62, 1.6, usbA('#15171a')), 3.7, 2.9); put(port('usbA#15171a', 1.35, .62, 1.6, usbA('#15171a')), 3.7, 3.85);
  /* audio jacks: coloured rings in two columns, and an optical output */
  const jack = (c, xx, y) => { const j = g(at(box(.95, .95, 1.6, K.plastic(0x1b1e22, .5)), 0, 0, 0), at(K.torus(.27, .1, K.plastic(c, .4), 10, 24), 0, 0, .82), at(cyl(.2, .2, .05, K.plastic(0x000000), 16), 0, 0, .81, PI / 2, 0, 0));
    j.position.set(xx, y, -.6); items.push(j); return j; };
  const audio = jack(0x3cb44b, 6.0, 2.4);
  jack(0x3b82f6, 6.0, 1.3); jack(0xe36fa5, 6.0, 3.5); jack(0xf28c28, 7.1, 1.3); jack(0x1b1e22, 7.1, 2.4); jack(0x9aa2aa, 7.1, 3.5);
  put(port('spdif', .8, .8, 1.6, (x, w, h) => { x.fillStyle = '#0b0c0e'; x.fillRect(w * .2, h * .2, w * .6, h * .6); x.fillStyle = '#e5533d'; x.fillRect(w * .4, h * .4, w * .2, h * .2); }), 7.1, 4.35);
  /* the I/O shield in front, and the edge of the motherboard behind */
  const shield = at(box(15.9, 4.45, .08, K.print(15.9, 4.45, (x, w, h, s) => { const gr = x.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#2c3138'); gr.addColorStop(1, '#3b4148'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.fillStyle = '#93a3b4'; x.font = K.font(.22 * s, 700); [['WIFI', .4], ['USB 2.0', 1.95], ['HDMI · DP', 3.9], ['USB 3.2', 6.3], ['LAN 2.5G', 8.9], ['USB-C', 11.3], ['AUDIO', 13.9]].forEach(([t, xx]) => x.fillText(t, xx * s, .3 * s)); }, { mat: { metalness: .6, roughness: .4 } })), 0, 2.62, .05);
  const pcb = at(box(16.5, .16, 7, K.tmat(K.pcbTex(16.5, 7, { seed: 161, color: '#10583f' }))), 0, .32, -3.3);
  K.label('usb', usb, 0, .32, .9);
  K.label('video-out', hdmi, 0, .32, .9);
  K.label('ethernet', rj, 0, .72, .9);
  K.label('audio', audio, 0, .48, .9);
  const m = g(pcb, shield, ...items);
  m.userData.view = [.3, .35, 1];
  return m;
}
