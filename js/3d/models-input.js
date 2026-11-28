/* ==========================================================
   3d/models-input.js
   3D models of the input devices: mouse, keyboard, joystick,
   game controller, webcam, microphone and the power button.
   Each builder takes the kit (3d/kit.js) and returns a Group;
   sizes in centimetres, y up, the front facing +z.
   Labels name parts by their ids in js/data/devices-inside.js.
   ========================================================== */
const PI = Math.PI;

/* ---------------- Mouse ---------------- */
export function mouse(K){
  const { g, at, box, cyl } = K, T = K.T;
  const S = [3.2, 3.3, 5.8], BASE = .5;
  /* the shell: a dome narrower and lower at the front, split into two buttons and the palm rest */
  const shape = geo => K.deform(geo, v => { v.x *= 1 - .12 * v.z; v.y *= 1 - .3 * Math.max(v.z, 0); });
  const dome = (p0, pl, m) => { const o = K.mesh(shape(new T.SphereGeometry(1, 64, 32, p0, pl, 0, PI / 2)), m); o.scale.set(...S); o.position.y = BASE; return o; };
  const shellM = K.plastic(0x262a30, .48), btnM = K.plastic(0x30353c, .38), gap = .018;
  const left = dome(gap, PI / 2 - 2 * gap, btnM), right = dome(PI / 2 + gap, PI / 2 - 2 * gap, btnM);
  const palm = dome(PI + gap, PI - 2 * gap, shellM);
  const inner = dome(0, PI * 2, K.plastic(0x0d0e10, .9)); inner.scale.multiplyScalar(.985); inner.material.side = T.DoubleSide;
  const slot = at(box(.78, .9, 2.3, K.plastic(0x0b0c0e, .8), .3), 0, 3.05, 2.5);
  const shell = g(left, right, palm, inner, slot);
  K.ex(shell, 0, 7.5, -1.5);
  K.label('mouse-buttons', shell, -2.2, 2.75, 1.0);

  const baseM = K.plastic(0x15181c, .7);
  const base = K.mesh(shape(new T.CylinderGeometry(1, 1, 1, 64)), baseM); base.scale.set(S[0], BASE, S[2]); base.position.y = BASE / 2;
  const glide = at(K.mesh(shape(new T.CylinderGeometry(1, 1, 1, 48)), K.plastic(0xe8e8e8, .3)), 0, .02, 0); glide.scale.set(2.6, .04, 4.9);

  /* inside, on the circuit board */
  const board = at(box(4.4, .16, 8.6, K.tmat(K.pcbTex(4.4, 8.6, { seed: 3 }))), 0, BASE + .1, .2);
  const sensor = at(K.chip(1.3, .45, 1.5, 'OPT\nSENSOR'), 0, BASE + .4, -.2);
  const led = at(box(.28, .28, .28, K.glow(0xff2a2a, 3)), 1.05, BASE + .32, -.2);
  const sw = x => g(at(box(.62, .55, 1.15, K.plastic(0x1d2126)), x, BASE + .45, 3.4), at(box(.22, .16, .22, K.plastic(0xd33b2a)), x, BASE + .8, 3.4));
  const mcu = at(K.chip(1.1, .18, 1.1, 'MCU'), .9, BASE + .27, -2.6);
  const wheel = at(cyl(.85, .85, .58, K.tmat(K.stripes('#24272b', '#101214', 22, .45), { roughness: .9 }), 48), 0, 2.75, 2.5, 0, 0, PI / 2);
  K.spin(wheel, 'y', .6);
  const posts = [-.42, .42].map(x => at(box(.14, 2.1, .7, K.plastic(0x9aa3ab)), x, 1.65, 2.5));
  const enc = at(box(.5, .7, .9, K.plastic(0x1a1d21)), .72, 2.55, 2.5);
  const cable = K.tube([[0, 1.1, 5.6], [0, 1.0, 7], [.4, .5, 8.5], [1.4, .3, 10.5]], .18, K.rubber(0x1d1f22), 48, 8);
  K.label('mouse-wheel', wheel, 0, .85, 0);
  K.label('mouse-sensor', sensor, 0, .25, 0, true);
  K.label('mouse-controller', mcu, 0, .1, 0, true);
  const m = g(base, glide, board, sensor, led, sw(-1.3), sw(1.3), mcu, wheel, ...posts, enc, cable, shell);
  m.userData.view = [1.0, 1.15, -1.25];
  return m;
}

/* ---------------- Keyboard ---------------- */
export function keyboard(K){
  const { g, at, box } = K, T = K.T, u = 1.9;
  /* the keys: [x, row, width, label, height] in key units (u) */
  const keys = [];
  const row = (r, x, spec) => spec.split(' ').forEach(t => { const [l, w] = t.split('|'); const wd = +w || 1; if (l !== '%') keys.push([x, r, wd, l, 1]); x += wd; });
  row(0, 0, 'Esc %|1 F1 F2 F3 F4 %|.5 F5 F6 F7 F8 %|.5 F9 F10 F11 F12');
  row(1.4, 0, '` 1 2 3 4 5 6 7 8 9 0 - = Back|2');
  row(2.4, 0, 'Tab|1.5 Q W E R T Y U I O P [ ] \\|1.5');
  row(3.4, 0, 'Caps|1.75 A S D F G H J K L ; \' Enter|2.25');
  row(4.4, 0, 'Shift|2.25 Z X C V B N M , . / Shift|2.75');
  row(5.4, 0, 'Ctrl|1.25 Win|1.25 Alt|1.25 %|6.25 Alt|1.25 Win|1.25 Menu|1.25 Ctrl|1.25');
  keys.push([3.75, 5.4, 6.25, '', 1]);
  row(0, 15.25, 'PrtSc ScrLk Pause'); row(1.4, 15.25, 'Ins Home PgUp'); row(2.4, 15.25, 'Del End PgDn');
  row(4.4, 16.25, '↑'); row(5.4, 15.25, '← ↓ →');
  row(1.4, 18.5, 'Num / * −'); row(2.4, 18.5, '7 8 9'); row(3.4, 18.5, '4 5 6'); row(4.4, 18.5, '1 2 3'); row(5.4, 18.5, '0|2 .');
  keys.push([21.5, 2.4, 1, '+', 2], [21.5, 4.4, 1, 'Enter', 2]);
  const W = 22.5 * u, D = 6.4 * u, x0 = -W / 2, z0 = -D / 2;
  const kx = k => x0 + (k[0] + k[2] / 2) * u, kz = k => z0 + (k[1] + k[4] / 2) * u;

  const caseM = K.plastic(0x1f2328, .5);
  const kcase = at(box(W + 1.6, 1.3, D + 1.8, caseM, .5), 0, .65, 0);
  const pcb = at(box(W - .2, .14, D - .2, K.tmat(K.canvas(1024, 300, (x, w, h) => {
    x.fillStyle = '#0f5f47'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(90,210,150,.7)'; x.lineWidth = 2;
    const sx = w / 22.5, sz = h / 6.4;
    [0, 1.4, 2.4, 3.4, 4.4, 5.4].forEach(r => { x.beginPath(); x.moveTo(4, (r + .7) * sz); x.lineTo(w - 4, (r + .7) * sz); x.stroke(); });
    x.strokeStyle = 'rgba(240,190,90,.7)';
    for (let c = 0; c < 22.5; c += 1){ x.beginPath(); x.moveTo((c + .5) * sx, 4); x.lineTo((c + .5) * sx, h - 4); x.stroke(); }
    x.fillStyle = '#e8e8e8'; keys.forEach(k => { x.fillRect((k[0] + k[2] / 2) * sx - 5, (k[1] + .5) * sz - 3, 10, 6); });
  }), { roughness: .6 })), 0, 1.37, 0);
  const mcu = at(K.chip(1.6, .2, 1.6, 'KB\nMCU'), (19.5 * u) + x0 + 1.5, 1.54, z0 + .5 * u);
  const plate = at(box(W + .3, .12, D + .3, K.metal(0x3a3f46, .45)), 0, 1.52, 0);

  /* switches and keycaps: one InstancedMesh per keycap width, the legends one texture */
  const capM = K.plastic(0x2c3036, .62), modM = K.plastic(0x202328, .62);
  const sw = K.inst(new T.BoxGeometry(1.4, .75, 1.4), K.plastic(0x2a2d33, .5), keys.map(k => [kx(k), 1.96, kz(k)]));
  const stems = K.inst(new T.BoxGeometry(.4, .3, .4), K.plastic(0xc8352b, .5), keys.map(k => [kx(k), 2.45, kz(k)]));
  const byW = {};
  keys.forEach(k => { const key = k[2] + 'x' + k[4], mod = k[3].length > 1 && !/^F\d|^\d$/.test(k[3]) || k[3] === '';
    (byW[key + (mod ? 'm' : '')] = byW[key + (mod ? 'm' : '')] || { k, mod, list: [] }).list.push([kx(k), 2.42, kz(k)]); });
  const caps = g(...Object.values(byW).map(b => K.inst(capGeo(K, b.k[2] * u - .46, b.k[4] * u - .46), b.mod ? modM : capM, b.list)));
  /* legends: every key's label in one canvas, each on a small plane over its key */
  const cols = 16, cw = 128, ch = 64, rows = Math.ceil(keys.length / cols);
  const atlas = K.canvas(cols * cw, rows * ch, (x) => {
    x.fillStyle = '#e6eaee'; x.textAlign = 'center'; x.textBaseline = 'middle';
    keys.forEach((k, i) => { const l = k[3]; x.font = K.font(l.length > 3 ? 22 : l.length > 1 ? 26 : 38, 600);
      x.fillText(l, (i % cols) * cw + cw / 2, Math.floor(i / cols) * ch + ch / 2); });
  });
  const pos = [], uv = [], idx = [];
  keys.forEach((k, i) => {
    const cx = kx(k), cz = kz(k), hw = .62, hd = .31, y = 3.225, c = i % cols, r = Math.floor(i / cols), b = pos.length / 3;
    pos.push(cx - hw, y, cz - hd, cx + hw, y, cz - hd, cx - hw, y, cz + hd, cx + hw, y, cz + hd);
    const u0 = c / cols, u1 = (c + 1) / cols, v1 = 1 - r / rows, v0 = 1 - (r + 1) / rows;
    uv.push(u0, v1, u1, v1, u0, v0, u1, v0);
    idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
  });
  const lg = new T.BufferGeometry();
  lg.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); lg.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  lg.setIndex(idx); lg.computeVertexNormals();
  const legends = new T.Mesh(lg, new T.MeshStandardMaterial({ map: atlas, transparent: true, roughness: .6, depthWrite: false }));
  caps.add(legends);
  const leds = [0, 1, 2].map(i => at(K.cyl(.14, .14, .08, K.glow(i === 1 ? 0x2bd47d : 0x0f3d2a, i === 1 ? 2.5 : .2), 16), x0 + (19.1 + i * 1.2) * u, 1.6, z0 + .45 * u));
  const cable = K.tube([[0, .7, -D / 2 - .9], [0, .6, -D / 2 - 4], [-2, .4, -D / 2 - 8], [-6, .3, -D / 2 - 10]], .22, K.rubber(0x1d1f22), 40, 8);
  const usb = at(g(box(1.4, .8, 2.6, K.plastic(0x1d1f22, .5), .2), at(box(1.2, .45, 1.2, K.metal(0xc0c6cc, .3)), 0, 0, -1.8)), -7, .3, -D / 2 - 10.3, 0, PI / 2.6, 0);

  const switches = g(sw, stems); K.ex(switches, 0, 5.2, 0);
  K.ex(plate, 0, 2.8, 0); K.ex(caps, 0, 9.5, 0);
  const kIdx = keys.findIndex(k => k[3] === 'K');
  const kLab = new T.Object3D(); kLab.position.set(kx(keys[kIdx]), 3.25, kz(keys[kIdx])); caps.add(kLab);
  K.label('kb-keys', kLab);
  K.label('kb-matrix', pcb, -8, .1, 2, true);
  K.label('kb-controller', mcu, 0, .1, 0, true);
  K.label('kb-usb', usb, 0, .4, 0);
  const m = g(kcase, pcb, mcu, plate, switches, caps, ...leds, cable, usb);
  m.userData.view = [.35, 1.05, 1];
  return m;
}
/* a keycap: a little narrower at the top, with rounded edges */
function capGeo(K, w, d){
  const s = new K.T.Shape(), r = .18, x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d); s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const e = new K.T.ExtrudeGeometry(s, { depth: .55, bevelEnabled: true, bevelThickness: .12, bevelSize: .1, bevelSegments: 2, curveSegments: 4 });
  e.rotateX(-PI / 2); e.translate(0, .12, 0);
  return K.deform(e, v => { const t = Math.max(0, v.y) / .79; v.x *= 1 - .1 * t * (1.2 / Math.max(w, 1.2)); v.z *= 1 - .12 * t; });
}

/* ---------------- Joystick ---------------- */
export function joystick(K){
  const { g, at, box, cyl } = K, T = K.T;
  const black = K.plastic(0x1e2125, .55), dark = K.plastic(0x2b3037, .45);
  const base = at(box(15, 1.8, 17, black, .7), 0, .9, 0);
  const pcb = at(box(11, .16, 12, K.tmat(K.pcbTex(11, 12, { seed: 11 }))), 0, 1.88, 0);
  const mcu = at(K.chip(1.6, .2, 1.6, 'USB\nMCU'), 3.2, 2.06, 3.2);
  /* the gimbal: two crossed arcs that the stick tilts, with a sensor on each axis */
  const arcM = K.metal(0x9aa2aa, .35);
  const arcX = at(K.torus(2.2, .22, arcM, 10, 32, PI), 0, 2.3, 0);
  const arcZ = at(K.torus(2.0, .22, arcM, 10, 32, PI), 0, 2.3, 0, 0, PI / 2, 0);
  const shaft = at(cyl(.32, .32, 5.5, K.metal(0xb8c0c8, .25)), 0, 4.6, 0);
  const sensor = (x, z, ry) => g(at(K.chip(.9, .8, .9, 'HALL'), x, 2.4, z), at(cyl(.35, .35, .5, K.metal(0x6e767f, .3), 16), x * .78, 2.4, z * .78, 0, 0, PI / 2));
  const s1 = sensor(2.9, 0), s2 = sensor(0, 2.9);
  s2.children[1].rotation.set(PI / 2, 0, 0);
  const housing = at(box(14, 2.6, 15.5, dark, .9), 0, 3.1, -.2);
  const ring = at(K.torus(3.3, .35, black, 12, 48), 0, 4.45, 0, PI / 2, 0, 0);
  const btn = (x, z, c) => g(at(cyl(.55, .6, .5, K.plastic(c, .35), 24), x, 4.55, z), at(cyl(.75, .75, .1, black, 24), x, 4.4, z));
  const top = g(housing, ring, btn(-4.6, 4.8, 0xd33b2a), btn(-2.6, 5.7, 0x2b6fd6), btn(4.6, 4.8, 0x2bb673), btn(2.6, 5.7, 0xe0b021));
  K.ex(top, 0, 5.5, 0);
  const boot = K.lathe([[3.2, 0], [3.0, .5], [3.1, .8], [2.5, 1.3], [2.6, 1.6], [1.9, 2.1], [2.0, 2.4], [1.2, 3.0], [.9, 3.2]], K.rubber(0x141619), 48);
  boot.position.y = 4.4; boot.material.side = T.DoubleSide;
  K.ex(boot, 0, 9, 0);
  /* the grip, tilted a little forward, with a trigger and buttons on top */
  const gripM = K.plastic(0x272b31, .6);
  const grip = K.mesh(new T.CapsuleGeometry(1.75, 7.5, 8, 24), gripM); grip.scale.set(1, 1, 1.25); grip.position.y = 5.4;
  const palm = at(box(2.6, 4.6, 1.2, K.plastic(0x1a1d21, .85), .5), 0, 4.8, -2.0);
  const head = at(K.sph(2.0, gripM, 32, 16), 0, 10, -.3); head.scale.set(1, .65, 1.35);
  const hat = at(cyl(.35, .45, .6, K.plastic(0x3a4048), 16), -.7, 11.3, .5);
  const fire = at(cyl(.55, .6, .5, K.plastic(0xd33b2a, .35), 20), .6, 11.25, -.6);
  const trigger = at(box(.8, 1.6, .7, K.plastic(0xd33b2a, .4), .3), 0, 8.4, 2.25, -.35, 0, 0);
  const stick = g(grip, palm, head, hat, fire, trigger); stick.position.y = 5.6; stick.rotation.x = -.1;
  K.ex(stick, 0, 14, 0);
  const cable = K.tube([[0, .9, -8.5], [0, .7, -11], [3, .4, -14], [7, .3, -15]], .22, K.rubber(0x1d1f22), 40, 8);
  K.label('joy-stick', stick, 0, 7, 2.2);
  K.label('joy-buttons', top, 4.6, 4.85, 4.8);
  K.label('joy-sensors', s1, 2.9, 2.9, 0, true);
  K.label('joy-controller', mcu, 0, .1, 0, true);
  const m = g(base, pcb, mcu, arcX, arcZ, shaft, s1, s2, top, boot, stick, cable);
  m.userData.view = [.8, .7, 1];
  return m;
}

/* ---------------- Game controller ---------------- */
export function gamepad(K){
  const { g, at, box, cyl } = K, T = K.T;
  const outline = () => {
    const s = K.shape();
    s.moveTo(-4.5, 4.2); s.lineTo(4.5, 4.2);
    s.bezierCurveTo(6.8, 4.2, 7.6, 3.0, 7.8, 1.2); s.bezierCurveTo(8.2, -1.5, 8.4, -4.2, 7.0, -5.2);
    s.bezierCurveTo(5.8, -6.0, 4.6, -5.2, 4.0, -3.6); s.bezierCurveTo(3.2, -2.0, 2.2, -1.6, 0, -1.6);
    s.bezierCurveTo(-2.2, -1.6, -3.2, -2.0, -4.0, -3.6); s.bezierCurveTo(-4.6, -5.2, -5.8, -6.0, -7.0, -5.2);
    s.bezierCurveTo(-8.4, -4.2, -8.2, -1.5, -7.8, 1.2); s.bezierCurveTo(-7.6, 3.0, -6.8, 4.2, -4.5, 4.2);
    return s;
  };
  const half = (m, bevel) => { const o = K.extrude(outline(), .5, m, bevel, 5, 48); o.rotation.x = -PI / 2; return o; };
  const bodyM = K.plastic(0x2a2e34, .5);
  const bottom = half(K.plastic(0x1d2025, .6), .75); bottom.position.y = .75;
  const top = half(bodyM, .75); top.position.y = 2.0;
  /* laid out like the 2D drawing (scenes/devices.js, 1 cm ≈ 49 of its units): the D-pad at the far left and the
     four buttons at the far right, level with each other; the two thumbsticks side by side in the middle, lower down;
     seen from the player, Y is at the top, A at the bottom, X on the left and B on the right */
  const Y = 3.25, ROW = -.92;
  const dM = K.plastic(0x1a1d21, .45);
  const dpad = g(at(box(1.9, .4, .62, dM, .12), 0, 0, 0), at(box(.62, .4, 1.9, dM, .12), 0, 0, 0)); dpad.position.set(-5.75, Y + .05, ROW);
  const face = [[0, .85, 0x3cb44b, 'A'], [.85, 0, 0xe5533d, 'B'], [-.85, 0, 0x3b82f6, 'X'], [0, -.85, 0xf2b705, 'Y']].map(([dx, dz, c, l]) => {
    const top = K.tmat(K.canvas(64, 64, (k) => { k.fillStyle = '#1e2126'; k.fillRect(0, 0, 64, 64); k.fillStyle = '#' + c.toString(16).padStart(6, '0');
      k.font = K.font(40, 800); k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(l, 32, 34); }), { roughness: .3 });
    const side = K.plastic(0x1e2126, .3);
    /* turned a quarter so the letter reads upright from the player's side (the cap's texture runs along z) */
    return at(K.mesh(new T.CylinderGeometry(.4, .42, .45, 24), [side, top, side]), 5.85 + dx, Y + .1, ROW + dz, 0, PI / 2, 0);
  });
  const home = g(at(cyl(.45, .45, .25, K.plastic(0x3a3f46, .35), 24), 0, Y, -3.4), at(K.torus(.5, .06, K.glow(0xffffff, 1.2), 6, 32), 0, Y + .08, -3.4, PI / 2, 0, 0));
  const shoulder = s => g(at(box(3.6, .8, 1.1, dM, .35), s * 5.3, 3.0, -4.35), at(box(2.4, 1.6, 1.8, K.plastic(0x22262b, .5), .5), s * 5.6, 2.0, -4.1, .25, 0, 0));
  const topShell = g(top, dpad, ...face, home, shoulder(-1), shoulder(1));
  K.ex(topShell, 0, 7, -10.5);
  /* inside: the board with the controller chip and the battery, a thumbstick module on each side (they stay on the
     board when the shell comes off, as in the 2D drawing), traces out to the D-pad and the buttons, the USB port
     on the top edge, and a rumble motor across each grip (a weight spun off-centre) */
  const pcb = at(box(9.8, .14, 4.55, K.tmat(K.pcbTex(9.8, 4.55, { seed: 21 }))), 0, 1.95, -1.05);
  const B0 = 2.02;
  const mcu = at(K.chip(1.25, .2, 1.1, 'PAD\nSoC'), 0, B0 + .1, -2.5);
  const battery = at(K.mesh(new T.BoxGeometry(2.9, .55, 1.0), [K.plastic(0x4b5058, .5), K.plastic(0x4b5058, .5),
    K.print(2.9, 1.0, (x, w, h) => { x.fillStyle = '#4b5058'; x.fillRect(0, 0, w, h); x.fillStyle = '#e7eef5'; x.font = K.font(h * .42, 700);
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('Battery', w / 2, h / 2 + h * .03); }), K.plastic(0x4b5058, .5), K.plastic(0x4b5058, .5), K.plastic(0x4b5058, .5)]), 0, B0 + .28, -1.25);
  const traceM = K.glow(0x3fb68a, .5);
  const trace = pts => g(...pts.slice(1).map((p, i) => { const q = pts[i], len = Math.hypot(p[0] - q[0], p[1] - q[1]) + .08;
    return at(box(q[0] === p[0] ? .08 : len, .02, q[0] === p[0] ? len : .08, traceM), (p[0] + q[0]) / 2, B0 + .01, (p[1] + q[1]) / 2); }));
  const traces = g(trace([[-.62, -2.5], [-4.1, -2.5], [-4.1, ROW], [-4.85, ROW]]), trace([[.62, -2.5], [4.1, -2.5], [4.1, ROW], [4.85, ROW]]));
  const stick = x => g(at(box(1.9, .95, 1.9, K.plastic(0x15171a, .55), .12), x, B0 + .47, .08),
    at(cyl(1.0, 1.1, .3, K.plastic(0x15171a, .6), 32), x, Y, .08),
    at(cyl(.3, .3, 1.0, K.metal(0x8a929a)), x, Y + .5, .08),
    at(cyl(.88, .83, .45, K.rubber(0x1a1c20), 32), x, Y + 1.05, .08), at(K.torus(.72, .11, K.rubber(0x24272c), 8, 32), x, Y + 1.28, .08, PI / 2, 0, 0));
  const ls = stick(-1.85), rs = stick(1.85);
  const usb = at(K.mesh(new T.BoxGeometry(.95, .34, .35), [K.metal(0xc0c6cc, .3), K.metal(0xc0c6cc, .3), K.metal(0xc0c6cc, .3), K.metal(0xc0c6cc, .3), K.metal(0xc0c6cc, .3),
    K.print(.95, .34, (x, w, h) => { x.fillStyle = '#c0c6cc'; x.fillRect(0, 0, w, h); x.fillStyle = '#0b0c0e'; x.beginPath(); x.roundRect(w * .1, h * .2, w * .8, h * .6, h * .3); x.fill(); })]), 0, 2.0, -4.85);
  const motor = s => { const w = at(cyl(.55, .55, .4, K.metal(0xb08d57, .3), 24, false, 0, PI), -s * 1.4, 0, 0, 0, 0, PI / 2);
    const mo = g(at(cyl(.75, .75, 2.3, K.metal(0x9aa2aa, .3), 24), 0, 0, 0, 0, 0, PI / 2), at(cyl(.12, .12, .5, K.metal(0xd0d4d8)), -s * 1.3, 0, 0, 0, 0, PI / 2), w);
    K.tick(dt => { w.rotateY(14 * dt); }); mo.position.set(s * 6.7, 2.2, 1.85); return mo; };
  const r1 = motor(-1), r2 = motor(1);
  /* the same labels as the 2D drawing */
  K.label('pad-buttons', dpad, 0, .3, 0, false, 'D-pad');
  K.label('pad-buttons', face[3], 0, .25, 0, false, 'Buttons');
  K.label('pad-sticks', ls, -1.85, Y + 1.35, .08, false, 'Thumbstick');
  K.label('pad-sticks', rs, 1.85, Y + .3, 1.15, false, 'Thumbstick');
  K.label('pad-rumble', r1, -.6, .8, .4, true, 'Rumble motor');
  K.label('pad-rumble', r2, .2, .8, .4, true, 'Rumble motor');
  K.label('pad-controller', mcu, 0, .12, 0, true, 'Controller and battery');
  const m = g(bottom, pcb, mcu, battery, traces, ls, rs, usb, r1, r2, topShell);
  m.userData.view = [.12, 1.5, 1];
  return m;
}

/* ---------------- Webcam ---------------- */
export function webcam(K){
  const { g, at, box, cyl } = K, T = K.T;
  const body = K.mesh(new T.CapsuleGeometry(1.6, 6.2, 8, 32), K.plastic(0x1f2227, .45)); body.rotation.z = PI / 2; body.position.y = 7.4;
  const front = at(K.mesh(new T.CylinderGeometry(1.625, 1.625, 5.6, 40, 1, true, -.62, 1.24), K.plastic(0x0c0d0f, .12)), 0, 7.4, 0, 0, 0, PI / 2);
  const ring = at(K.torus(.75, .12, K.metal(0xaab2ba, .25), 12, 40), 0, 7.4, 1.62);
  const glass = at(cyl(.7, .7, .05, K.glass(0x223344, .5), 32), 0, 7.4, 1.6, PI / 2, 0, 0);
  const led = at(cyl(.1, .1, .05, K.glow(0xffffff, 1.6), 12), 1.9, 7.4, 1.6, PI / 2, 0, 0);
  const micL = at(cyl(.09, .09, .05, K.plastic(0x050505), 10), -2.6, 7.4, 1.6, PI / 2, 0, 0);
  const micR = at(cyl(.09, .09, .05, K.plastic(0x050505), 10), 2.6, 7.4, 1.6, PI / 2, 0, 0);
  /* the clip that hooks over a monitor */
  const clipM = K.plastic(0x23262b, .6);
  const hinge = at(cyl(.45, .45, 2.4, clipM, 20), 0, 5.75, 0, 0, 0, PI / 2);
  const clip = g(hinge, at(box(2.4, .5, 4.2, clipM, .2), 0, 5.4, -1.2), at(box(2.4, 5.0, .5, clipM, .2), 0, 3.1, -3.3, -.05, 0, 0),
    at(box(2.4, .5, 1.6, K.rubber(0x15171a), .2), 0, 5.2, .5));
  /* inside, in front of each other: lens, image sensor on its board, image processor on the main board */
  const lens = g(at(cyl(.62, .7, 1.1, K.plastic(0x111316, .3), 32), 0, 0, 0, PI / 2, 0, 0),
    at(K.sph(.6, K.glass(0x6a8cff, .45), 24, 12, 0, PI * 2, 0, PI / 5), 0, 0, .3, PI / 2, 0, 0));
  lens.position.set(0, 7.4, .5); K.ex(lens, 0, 0, 12);
  const sensorTex = K.canvas(128, 128, (x) => { const gr = x.createLinearGradient(0, 0, 128, 128);
    gr.addColorStop(0, '#2a1f5a'); gr.addColorStop(.5, '#2b6a6a'); gr.addColorStop(1, '#6a2a5a'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    x.strokeStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 128; i += 4){ x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.stroke(); } });
  const sBoard = at(box(2.6, 2.0, .12, K.tmat(K.pcbTex(2.6, 2.0, { seed: 31 }))), 0, 7.4, .05);
  const sensor = at(K.mesh(new T.BoxGeometry(1.0, .8, .12), [K.plastic(0x222), K.plastic(0x222), K.plastic(0x222), K.plastic(0x222), K.tmat(sensorTex, { roughness: .15, metalness: .4 }), K.plastic(0x222)]), 0, 7.4, .16);
  const sensorG = g(sBoard, sensor); K.ex(sensorG, 0, 0, 8);
  const mBoard = at(box(6.0, 2.0, .12, K.tmat(K.pcbTex(6, 2, { seed: 33 }))), 0, 7.4, -.6);
  const isp = at(K.chip(1.1, 1.1, .16, ''), -1.6, 7.4, -.48);
  isp.material = K.plastic(K.c.chip, .4);
  const ispTop = at(K.plane(1.0, 1.0, K.print(1, 1, (x, w, h) => { x.fillStyle = '#1b1e22'; x.fillRect(0, 0, w, h); x.fillStyle = '#a9b1ba'; x.font = K.font(h / 5, 700, true); x.textAlign = 'center'; x.fillText('ISP', w / 2, h / 2 + h / 12); })), -1.6, 7.4, -.39);
  const mainG = g(mBoard, isp, ispTop); K.ex(mainG, 0, 0, 4.2);
  const cable = K.tube([[3.9, 7.4, -.6], [5.2, 7.0, -1.2], [5.6, 4.0, -3.6], [5.4, -2, -4.2]], .17, K.rubber(0x1d1f22), 40, 8);
  K.label('webcam-lens', ring, 0, .8, 0);
  K.label('webcam-sensor', sensor, 0, .5, 0, true);
  K.label('webcam-isp', isp, 0, .55, 0, true);
  K.label('webcam-usb', cable, 5.55, 3.2, -3.7);
  const m = g(body, front, ring, glass, led, micL, micR, clip, lens, sensorG, mainG, cable);
  m.userData.view = [.55, .35, 1];
  return m;
}

/* ---------------- Microphone ---------------- */
export function mic(K){
  const { g, at, box, cyl } = K, T = K.T;
  const metal = K.metal(0x2d3239, .45), dark = K.plastic(0x1b1e22, .5);
  const base = g(at(cyl(5.5, 6, 1.0, metal, 64), 0, .5, 0), at(cyl(5.2, 5.2, .06, K.rubber(), 64), 0, .02, 0));
  const post = at(cyl(.55, .55, 4.5, metal, 24), 0, 3.2, 0);
  const yoke = at(K.torus(3.5, .32, metal, 12, 48, PI), 0, 9.0, 0, PI, 0, 0);
  const knobs = [-1, 1].map(s => at(cyl(.75, .75, .6, K.plastic(0x15171a, .6), 24), s * 3.75, 9.0, 0, 0, 0, PI / 2));
  /* body: a tube with the electronics, and the grille head with the capsule */
  const bodyM = K.metal(0x24282e, .4);
  const tube = at(cyl(2.8, 2.8, 8, bodyM, 48), 0, 9.6, 0);
  const knob = at(cyl(.6, .6, .5, K.metal(0xb8c0c8, .3), 24), 0, 8.4, 2.85, PI / 2, 0, 0);
  const muteLed = at(cyl(.22, .22, .06, K.glow(0x2bd47d, 2.5), 16), 0, 11.2, 2.82, PI / 2, 0, 0);
  const usb = at(box(1.0, .4, .5, K.metal(0xc8ced4, .3), .15), 0, 6.3, -2.6);
  const grilleM = new T.MeshStandardMaterial({ color: 0x8a939c, metalness: 1, roughness: .35, alphaMap: K.holes(30, .36), alphaTest: .5, side: T.DoubleSide });
  grilleM.alphaMap.repeat.set(3, 2);
  const grilleC = at(cyl(2.85, 2.85, 4.5, grilleM, 48, true), 0, 15.85, 0);
  const cap = at(K.sph(2.85, grilleM, 48, 16, 0, PI * 2, 0, PI / 2), 0, 18.1, 0);
  const band = at(cyl(2.95, 2.95, .6, K.metal(0x9aa2aa, .3), 48), 0, 13.6, 0);
  const head = g(grilleC, cap, band); head.children.forEach(c => { c.userData.see = true; });
  K.ex(head, 0, 9, 0);
  /* the capsule: a gold diaphragm in a ring, facing front (side-address) */
  const capsule = g(at(cyl(1.6, 1.6, .5, K.metal(0x6e767f, .3), 40), 0, 0, 0, PI / 2, 0, 0),
    at(cyl(1.35, 1.35, .06, K.metal(0xe0b65a, .15), 40), 0, 0, .27, PI / 2, 0, 0),
    at(cyl(.25, .25, 3.0, K.metal(0x9aa2aa), 12), 0, -2.0, 0));
  capsule.position.set(0, 16.4, 0);
  /* the boards inside the tube */
  const board = at(box(3.6, 6.2, .14, K.tmat(K.pcbTex(3.6, 6.2, { seed: 41 }))), 0, 9.8, 0);
  const pre = at(K.chip(1.1, 1.1, .2, 'PRE\nAMP'), -.6, 11.2, .16);
  const adc = at(K.chip(1.2, 1.2, .2, 'ADC'), .5, 9.0, .16);
  [pre, adc].forEach(c => { c.rotation.x = PI / 2; });
  const caps = [[-1.2, 8.0], [1.2, 11.6]].map(([x, y]) => at(cyl(.3, .3, .7, K.plastic(0x1f3d7a, .4), 16), x, y, .45, PI / 2, 0, 0));
  const elec = g(board, pre, adc, ...caps); K.ex(elec, 0, 0, 7);
  K.label('mic-capsule', capsule, 0, 1.8, .2, true);
  K.label('mic-preamp', pre, 0, 0, .2, true);
  K.label('mic-adc', adc, 0, 0, .2, true);
  K.label('mic-usb', usb, 0, -.3, -.2);
  const m = g(base, post, yoke, ...knobs, tube, knob, muteLed, usb, head, capsule, elec);
  m.userData.view = [.7, .45, 1];
  return m;
}

/* ---------------- Power button ---------------- */
export function powerButton(K){
  const { g, at, box, cyl } = K, T = K.T;
  /* a corner of the case's front panel, with the button and its light ring */
  const panelM = K.print(18, 24, (x, w, h) => {
    x.fillStyle = '#2a2f36'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < h; i += 2){ x.fillStyle = `rgba(255,255,255,${.02 + Math.random() * .025})`; x.fillRect(0, i, w, 1); }
  }, { mat: { metalness: .8, roughness: .45 } });
  const panel = at(box(18, 24, .9, panelM, .25), 0, 14, 0);
  const symbol = K.print(2.4, 2.4, (x, w, h) => { x.fillStyle = '#c9ced3'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#2b6fd6'; x.lineWidth = w * .07; x.lineCap = 'round';
    x.beginPath(); x.arc(w / 2, h / 2, w * .28, -PI / 2 + .6, -PI / 2 - .6 + PI * 2); x.stroke();
    x.beginPath(); x.moveTo(w / 2, h * .16); x.lineTo(w / 2, h * .5); x.stroke(); }, { mat: { metalness: .9, roughness: .3 } });
  const side = K.metal(0xc9ced3, .3);
  const btn = at(K.mesh(new T.CylinderGeometry(1.2, 1.2, .7, 48), [side, symbol, side]), 0, 19, .8, PI / 2, 0, 0);
  const ledRing = at(K.torus(1.38, .12, K.glow(0x3b82f6, 2.6), 10, 48), 0, 19, .5);
  const reset = at(cyl(.35, .35, .4, K.metal(0x9aa2aa), 20), 0, 16.2, .55, PI / 2, 0, 0);
  const front = g(panel, ledRing, reset);
  K.ex(front, -13, 0, 8); K.ex(btn, -13, 0, 12);
  /* behind: the push switch on a small board, its two wires, the header and the power controller on the motherboard */
  const sBoard = at(box(4, 4, .14, K.tmat(K.pcbTex(4, 4, { seed: 51 }))), 0, 19, -.9);
  const sw = g(at(box(1.2, 1.2, .7, K.plastic(0x1d2025, .5)), 0, 19, -.45), at(cyl(.3, .3, .5, K.plastic(0x2a2d33), 16), 0, 19, .1, PI / 2, 0, 0));
  const led = g(at(cyl(.25, .25, .5, K.glow(0x3b82f6, 1.4), 16), 1.5, 19, -.5, PI / 2, 0, 0));
  const board = at(box(26, .18, 18, K.tmat(K.pcbTex(26, 18, { seed: 53 }))), 2, .09, -11);
  const header = g(at(box(2.8, .25, 1.3, K.plastic(0x1d2025)), 0, .3, 0),
    K.inst(new T.BoxGeometry(.14, .9, .14), K.gold(), [-1.0, -.5, 0, .5, 1.0].flatMap(x => [[x, .75, -.3], [x, .75, .3]])),
    at(box(1.3, .9, 1.0, K.plastic(0xe8e8e8, .5)), -.5, 1.0, 0));
  header.position.set(4.5, .18, -6);
  const ctrl = at(K.chip(2.4, .3, 2.4, 'SUPER\nI/O'), -3, .33, -12);
  const wire = (dx, c) => K.tube([[dx, 19, -1.0], [dx, 18, -2.6], [dx + 1, 10, -4.2], [4.0 + dx, 3, -5.5], [4.0 + dx, 1.4, -6]], .09, K.plastic(c, .5), 64, 6);
  const wires = g(wire(-.5, 0xf2f2f2), wire(-.2, 0x111111));
  K.label('pb-led', ledRing, 1.0, 1.0, .2);
  K.label('pb-switch', sw, 0, 19.7, -.4, true);
  K.label('pb-header', header, -.5, 1.5, 0);
  K.label('pb-controller', ctrl, 0, .2, 0);
  const m = g(front, btn, sBoard, sw, led, board, header, ctrl, wires);
  m.userData.view = [1.0, .55, .8];
  return m;
}
