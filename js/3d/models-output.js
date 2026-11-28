/* ==========================================================
   3d/models-output.js
   3D models of the output devices: monitor, speakers and printer.
   Same conventions as 3d/models-input.js.
   ========================================================== */
const PI = Math.PI;

/* what the monitor shows: a desktop with this site open */
function screenTex(K){
  return K.canvas(1024, 576, (x, w, h) => {
    const bg = x.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#04352a'); bg.addColorStop(.55, '#0b5c4a'); bg.addColorStop(1, '#0e3e5c');
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,.06)';
    for (let i = 0; i < 9; i++){ x.beginPath(); x.arc(w * .82, h * .2, 60 + i * 55, 0, 7); x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,.05)'; x.stroke(); }
    /* a window */
    x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 30; x.fillStyle = '#f5f7fa'; x.fillRect(150, 70, 620, 380); x.shadowBlur = 0;
    x.fillStyle = '#dfe5ec'; x.fillRect(150, 70, 620, 34);
    ['#e5533d', '#f2b705', '#3cb44b'].forEach((c, i) => { x.fillStyle = c; x.beginPath(); x.arc(172 + i * 22, 87, 7, 0, 7); x.fill(); });
    x.fillStyle = '#0f1a24'; x.font = K.font(30, 800); x.fillText('Inside the Computer', 180, 160);
    x.fillStyle = '#4f5f70'; x.font = K.font(18, 500); x.fillText('Click any part to look inside it', 180, 192);
    /* a little tower drawing in the window */
    x.fillStyle = '#d6dde5'; x.fillRect(190, 225, 150, 200); x.fillStyle = '#11694f'; x.fillRect(205, 240, 120, 150);
    x.fillStyle = '#1e252d'; x.fillRect(240, 270, 40, 40); x.fillStyle = '#e39a12'; x.fillRect(290, 260, 10, 60); x.fillRect(305, 260, 10, 60);
    x.fillStyle = '#047857'; for (let i = 0; i < 4; i++) x.fillRect(380, 240 + i * 50, 340, 30);
    /* taskbar */
    x.fillStyle = 'rgba(10,16,22,.78)'; x.fillRect(0, h - 40, w, 40);
    for (let i = 0; i < 6; i++){ x.fillStyle = ['#34d399', '#5db2ff', '#ffb23a', '#e7eef5', '#c084fc', '#22d3ee'][i]; x.fillRect(w / 2 - 150 + i * 52, h - 30, 22, 22); }
    x.fillStyle = '#e7eef5'; x.font = K.font(16, 600); x.fillText('10:42', w - 70, h - 14);
  });
}

/* ---------------- Monitor ---------------- */
export function monitor(K){
  const { g, at, box, cyl } = K, T = K.T;
  const W = 62, H = 36, Y = 30;
  const black = K.plastic(0x1a1d21, .45), back = K.plastic(0x23272d, .55), stand = K.metal(0x5d646c, .4);
  const base = at(box(26, 1.0, 19, stand, .45), 0, .5, -3);
  const neck = at(box(7, 28, 2.4, stand, .8), 0, 14.5, -5.5, -.04, 0, 0);
  /* the case at the back (stays on the stand), with the video inputs on a small board */
  const shell = g(at(box(W, H, .8, back, .4), 0, 0, -1.05), at(box(46, 26, 3.2, back, 1.2), 0, 1, -2.6));
  const vents = K.inst(new T.BoxGeometry(5, .25, .2), K.plastic(0x101214), Array.from({ length: 12 }, (_, i) => [-15 + (i % 6) * 6, 10.5 - Math.floor(i / 6) * 1.2, -4.25]));
  const ports = g(at(box(8.5, 1.2, 1.5, K.plastic(0x15171a)), 0, 0, 0),
    ...[[-2.8, 'hdmi'], [-.6, 'dp'], [1.6, 'dp'], [3.4, 'usb']].map(([x, k]) => at(box(k === 'usb' ? .8 : 1.5, .55, .3, K.metal(0xc0c6cc, .3)), x, -.62, 0)));
  ports.position.set(5, -11.8, -2.6);
  /* the layers inside, front to back: LCD panel and bezel, backlight, then the boards on a metal sheet */
  const scr = screenTex(K);
  const lcd = at(K.plane(W - 1.6, H - 1.6, new T.MeshStandardMaterial({ map: scr, emissiveMap: scr, emissive: 0xffffff, emissiveIntensity: .9, roughness: .22, metalness: 0 })), 0, 0, .52);
  const bezelShape = K.rrect(W, H, .7); bezelShape.holes.push(K.rrect(W - 1.6, H - 1.6, .2, 0, 0, T.Path));
  const bezel = at(K.extrude(bezelShape, .9, black, .12, 2), 0, 0, -.45);
  const logo = at(box(3, .35, .05, K.metal(0x9aa2aa, .3)), 0, -H / 2 + .4, .58);
  const front = g(lcd, bezel, logo); K.ex(front, -24, 4, 22);
  const blM = new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf2f7ff, emissiveIntensity: .9, roughness: .5 });
  const backlight = g(at(box(W - 2, H - 2, .3, blM), 0, 0, -.1),
    K.inst(new T.BoxGeometry(.6, .35, .35), K.glow(0xfff3c4, 3), Array.from({ length: 44 }, (_, i) => [-W / 2 + 2 + i * 1.33, -H / 2 + 1.3, .15])));
  K.ex(backlight, -12, 2, 12);
  const chassis = at(box(W - 4, H - 4, .15, K.metal(0x9aa2aa, .45)), 0, 0, -.45);
  const ctrl = at(box(16, 9, .14, K.tmat(K.pcbTex(16, 9, { seed: 61 }))), 9, -7, -.6);
  const scaler = at(K.chip(2.4, 2.4, .25, 'SCALER'), 7, -6.5, -.8, -PI / 2, 0, 0);
  const pwr = at(box(14, 9, .14, K.tmat(K.pcbTex(14, 9, { seed: 63, color: '#1d3f73', trace: 'rgba(120,170,240,.4)' }))), -10, -7, -.6);
  const caps = [[-14, -5], [-12, -5]].map(([x, y]) => at(cyl(.9, .9, 2.6, K.plastic(0x1b2a4a, .4), 20), x, y, -1.95, PI / 2, 0, 0));
  const xf = at(box(2.6, 2.6, 2.2, K.plastic(0xe0b021, .6)), -7.5, -8, -1.75);
  const boards = g(chassis, ctrl, scaler, pwr, ...caps, xf); K.ex(boards, 0, 0, 4);
  K.label('monitor-panel', front, -18, 10, .6);
  K.label('monitor-backlight', backlight, -20, -H / 2 + 1.6, .3, true);
  K.label('monitor-controller', scaler, 0, .2, 0, true);
  K.label('monitor-power', xf, 0, 0, -1.2, true);
  K.label('monitor-ports', ports, -2.8, -.7, 0);
  const panel = g(shell, vents, ports, front, backlight, boards); panel.position.set(0, Y, 0);
  const m = g(base, neck, panel);
  m.userData.view = [.55, .3, 1];
  return m;
}

/* ---------------- Speakers ---------------- */
export function speaker(K, labels){
  const { g, at, box, cyl } = K, T = K.T;
  const W = 11, H = 18, D = 13;
  const cab = at(box(W, H, D, K.plastic(0x24201d, .6), .8), 0, H / 2, 0);
  /* the front panel, with holes for the woofer and the tweeter */
  const bs = K.rrect(W - .4, H - .4, .7); bs.holes.push(K.circle(4.0, 0, -2.2), K.circle(1.25, 0, 5.2));
  const baffle = at(K.extrude(bs, .5, K.plastic(0x141517, .7), .1), 0, H / 2, D / 2 - .2);
  const tweeter = g(at(K.torus(1.3, .2, K.plastic(0x2a2d31, .5), 10, 40), 0, 0, 0),
    at(K.sph(1.05, K.metal(0xb8c0c8, .3), 32, 12, 0, PI * 2, 0, PI / 2), 0, 0, -.3, PI / 2, 0, 0));
  tweeter.position.set(0, H / 2 + 5.2, D / 2 + .2);
  const knob = at(cyl(.7, .7, .7, K.metal(0x9aa2aa, .35), 32), -3.6, 1.9, D / 2 + .5, PI / 2, 0, 0);
  const led = at(cyl(.15, .15, .1, K.glow(0x3b82f6, 3), 12), 3.6, 1.9, D / 2 + .4, PI / 2, 0, 0);
  /* the woofer, front to back: surround and cone, voice coil, magnet */
  const coneM = K.plastic(0x1c1d20, .85); coneM.side = T.DoubleSide;
  const cone = g(at(K.lathe([[1.1, -1.4], [2.0, -1.0], [3.0, -.45], [3.7, 0]], coneM, 48), 0, 0, 0, PI / 2, 0, 0),
    at(K.torus(3.85, .28, K.rubber(0x111214), 10, 48), 0, 0, 0),
    at(K.sph(1.2, K.plastic(0x2a2c30, .4), 32, 10, 0, PI * 2, 0, PI / 3), 0, 0, -2.0, PI / 2, 0, 0));
  cone.position.set(0, H / 2 - 2.2, D / 2 + .1); K.ex(cone, 0, 0, 10);
  const coil = g(at(cyl(1.05, 1.05, 1.6, K.copper(), 32, true), 0, 0, 0, PI / 2, 0, 0), at(cyl(1.08, 1.08, .9, K.metal(0xd58a4e, .2), 32, true), 0, 0, -.2, PI / 2, 0, 0));
  coil.position.set(0, H / 2 - 2.2, D / 2 - 1.9); coil.children.forEach(c => { c.material.side = T.DoubleSide; });
  K.ex(coil, 0, 0, 6.5);
  const magnet = g(at(cyl(2.6, 2.6, 1.2, K.plastic(0x2e3134, .5), 40), 0, 0, 0, PI / 2, 0, 0),
    at(cyl(2.7, 2.7, .3, K.metal(0x9aa2aa, .4), 40), 0, 0, .75, PI / 2, 0, 0), at(cyl(.95, .95, 1.8, K.metal(0xb8c0c8, .35), 24), 0, 0, .5, PI / 2, 0, 0));
  magnet.position.set(0, H / 2 - 2.2, D / 2 - 3.6); K.ex(magnet, 0, 0, 3);
  /* the amplifier board at the back, with its DAC */
  const amp = at(box(.14, 7, 9, K.tmat(K.pcbTex(7, 9, { seed: 71 }))), 0, 0, 0);
  const dac = at(K.chip(.2, 1.0, 1.0, ''), .17, 1.6, 2.2);
  const dacTop = at(K.plane(1.0, 1.0, K.print(1, 1, (x, w, h) => { x.fillStyle = '#1b1e22'; x.fillRect(0, 0, w, h); x.fillStyle = '#a9b1ba'; x.font = K.font(h / 4, 700, true); x.textAlign = 'center'; x.fillText('DAC', w / 2, h / 2 + h / 10); })), .28, 1.6, 2.2, 0, PI / 2, 0);
  const ampChip = at(K.chip(.25, 1.4, 1.8, ''), .2, -.4, -.8);
  const sink = at(box(1.4, 2.6, 2.4, K.metal(0x9aa2aa, .4)), 1.0, -.4, -.8);
  const capsA = [[1.6, 2.6, -2.8], [1.6, 2.6, -1.6]].map(([y, z]) => at(cyl(.5, .5, 1.6, K.plastic(0x1b2a4a, .4), 16), .9, y, z, 0, 0, PI / 2));
  const ampG = g(amp, dac, dacTop, ampChip, sink, ...capsA); ampG.position.set(W / 2 - 2.5, 6, -D / 2 + 5.5);
  K.ex(ampG, 0, 15, 0);
  if (labels){
    K.label('speaker-cone', cone, -2.2, 2.0, -.6);
    K.label('speaker-coil', coil, 0, 1.1, 0, true);
    K.label('speaker-magnet', magnet, 0, 2.7, 0, true);
    K.label('speaker-amp', sink, 0, 1.3, 0, true);
    K.label('speaker-dac', dacTop, 0, 0, 0, true);
  }
  return g(cab, baffle, tweeter, knob, led, cone, coil, magnet, ampG);
}
export function speakers(K){
  const quiet = K.quiet();
  const l = speaker(K, true), r = speaker(quiet, false);
  l.position.x = -9; l.rotation.y = .18; r.position.x = 9; r.rotation.y = -.18;
  r.children[3].visible = r.children[4].visible = false;     /* the volume knob and light are on the left one only */
  const cable = K.tube([[-6, .4, -6], [0, .3, -9], [6, .4, -6]], .15, K.rubber(0x1d1f22), 32, 6);
  const m = K.g(l, r, cable);
  m.userData.view = [.35, .45, 1];
  return m;
}

/* ---------------- Printer ---------------- */
export function printer(K){
  const { g, at, box, cyl } = K, T = K.T;
  const W = 44, D = 32;
  const bodyM = K.plastic(0x2d3137, .5), lightM = K.plastic(0x3a3f46, .45);
  const body = at(box(W, 8, D, bodyM, .9), 0, 4, 0);
  const slot = at(box(W - 10, 1.0, .4, K.plastic(0x08090a, .9)), 0, 5.2, D / 2);
  const out = at(box(W - 14, .25, 9, lightM, .1), 0, 4.0, D / 2 + 4.3, .04, 0, 0);
  const paperOut = at(box(21, .05, 7, K.plastic(0xf8f8f8, .9)), 0, 4.2, D / 2 + 3.6, .04, 0, 0);
  /* the paper tray at the back, with a few sheets */
  const tray = at(box(W - 16, 13, .3, lightM, .1), 0, 16, -D / 2 + 2.5, -.32, 0, 0);
  const sheets = at(box(21, 12, .25, K.plastic(0xf8f8f8, .9)), 0, 16.4, -D / 2 + 3.0, -.32, 0, 0);
  /* the top cover with the control panel; it lifts off to show the inside */
  const panelTex = K.print(9, 3, (x, w, h) => { x.fillStyle = '#16181b'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#1d6fd6'; x.fillRect(w * .05, h * .18, w * .45, h * .64); x.fillStyle = '#e7eef5'; x.font = K.font(h * .22, 700); x.fillText('Ready', w * .1, h * .58);
    ['#3cb44b', '#e7eef5', '#e5533d'].forEach((c, i) => { x.fillStyle = c; x.beginPath(); x.arc(w * (.62 + i * .13), h * .5, h * .14, 0, 7); x.fill(); }); }, { mat: { roughness: .25 } });
  const cover = g(at(box(W - 1, 8, D - 6, lightM, 1.0), 0, 12.0, -2.5), at(box(9, .2, 3, panelTex), 13, 16.1, 7.0, -.08, 0, 0),
    at(box(W - 1.2, .6, 4, bodyM, .25), 0, 8.4, D / 2 - 2.5));
  K.ex(cover, 0, 15, 0);
  /* inside: a guide rod and belt, the carriage with two cartridges, the rollers and the controller board */
  const rod = at(cyl(.3, .3, W - 4, K.metal(0xd0d4d8, .2), 20), 0, 11.5, -1.5, 0, 0, PI / 2);
  const belt = at(box(W - 6, .6, .12, K.rubber(0x111214)), 0, 12.6, -2.6);
  const cartTex = c => K.print(2.6, 4, (x, w, h) => { x.fillStyle = '#e8ecef'; x.fillRect(0, 0, w, h);
    (c === 'k' ? ['#111'] : ['#00a3e0', '#e0218a', '#ffe000']).forEach((col, i, a) => { x.fillStyle = col; x.fillRect(0, h * .55 + i * h * .45 / a.length, w, h * .45 / a.length); });
    x.fillStyle = '#333'; x.font = K.font(h * .14, 800); x.fillText(c === 'k' ? 'BLACK' : 'COLOUR', w * .1, h * .3); });
  const cart = (x, c) => at(K.mesh(new T.BoxGeometry(2.6, 4, 3.4), [K.plastic(0x30343a), K.plastic(0x30343a), K.plastic(0x30343a), K.plastic(0x30343a), cartTex(c), K.plastic(0x30343a)]), x, 12.4, 0);
  const carriage = g(at(box(7.5, 2.8, 5.6, K.plastic(0x5a6068, .5), .3), 0, 10.6, -.4), cart(-1.6, 'k'), cart(1.6, 'c'));
  carriage.position.x = -6;
  K.tick((dt, t) => { carriage.position.x = Math.sin(t * .9) * 12; });
  const rollerM = K.rubber(0x1c1e21);
  const rollers = g(at(cyl(.9, .9, W - 8, rollerM, 24), 0, 8.9, 4.5, 0, 0, PI / 2),
    at(cyl(.6, .6, W - 8, rollerM, 24), 0, 8.6, 9.5, 0, 0, PI / 2),
    ...[-12, -4, 4, 12].map(x => at(cyl(.45, .45, .2, K.metal(0xb8c0c8, .3), 10), x, 9.4, 9.5, 0, 0, PI / 2)));
  rollers.children.slice(0, 2).forEach(r => K.spin(r, 'y', 2));
  const board = at(box(8, .14, 12, K.tmat(K.pcbTex(8, 12, { seed: 81 }))), 16.5, 8.1, -6.5);
  const soc = at(K.chip(2.0, .25, 2.0, 'PRINT\nCPU'), 16.5, 8.3, -7.5);
  const paper = at(box(21, .05, 14, K.plastic(0xf8f8f8, .9)), 0, 8.06, 3);
  K.label('printer-cartridge', carriage, -1.6, 14.6, .2, true);
  K.label('printer-carriage', rod, 0, 14, 0, true);
  K.label('printer-rollers', rollers.children[1], 0, -8, .6, true);
  K.label('printer-board', soc, 0, .2, 0, true);
  const m = g(body, slot, out, paperOut, tray, sheets, cover, rod, belt, carriage, rollers, board, soc, paper);
  m.userData.view = [.55, .7, 1];
  return m;
}
