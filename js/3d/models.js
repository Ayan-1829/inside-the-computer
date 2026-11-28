/* ==========================================================
   3d/models.js
   Which part has a 3D model, and the whole computer on a desk
   (the home page's model), put together from the others.
   build(id) returns {root, labels, ticks, view} for 3d/viewer.js.
   The list of ids here must match MODELS_3D in js/model3d.js.
   ========================================================== */
import { makeKit } from './kit.js';
import { mouse, keyboard, joystick, gamepad, webcam, mic, powerButton } from './models-input.js';
import { monitor, speakers, speaker, printer } from './models-output.js';
import { cpu, motherboard, ram, gpu, ssd, hdd, storage, psu, cooling, io, fanBlades } from './models-hw.js';

const PI = Math.PI;

/* ---------------- The whole computer ---------------- */
function computer(K){
  const Q = K.quiet(), { g, at, box, cyl } = K, T = K.T;
  const wood = K.print(150, 75, (x, w, h, s) => {
    x.fillStyle = '#7a5434'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++){ const y = Math.random() * h; x.strokeStyle = `rgba(${Math.random() < .5 ? '60,36,18' : '150,110,70'},${.08 + Math.random() * .12})`;
      x.lineWidth = .5 + Math.random() * 2; x.beginPath(); x.moveTo(0, y); for (let px = 0; px <= w; px += 40) x.lineTo(px, y + Math.sin(px / 90 + i) * 3); x.stroke(); }
  }, { px: 1024, mat: { roughness: .55 } });
  const desk = at(box(150, 3, 75, wood, .6), 0, -1.5, 0);

  /* on the desk */
  const mon = monitor(Q); mon.position.set(-8, 0, -18);
  const cam = webcam(Q); cam.position.set(-8, 42.85, -18);
  const kb = keyboard(Q); kb.position.set(-8, 0, 12);
  const ms = mouse(Q); ms.position.set(27, 0, 13); ms.rotation.y = PI;
  const spL = speaker(Q, false); spL.position.set(-50, 0, -15); spL.rotation.y = .35;
  const spR = speaker(Q, false); spR.position.set(34, 0, -15); spR.rotation.y = -.35;
  const mc = mic(Q); mc.position.set(-56, 0, 12); mc.rotation.y = .5;

  /* the tower, its window (glass) facing the desk, its front facing you */
  const caseM = K.metal(0x1d2025, .5);
  const frontTex = K.print(21, 46, (x, w, h, s) => { x.fillStyle = '#1a1d21'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#0c0d0f'; for (let i = 0; i < 46; i++) for (let j = 0; j < 20; j++) x.fillRect((1.2 + j * .95) * s, (2 + i * .92) * s, .55 * s, .5 * s);
    x.fillStyle = '#34d399'; x.fillRect(0, 0, .25 * s, h); x.fillRect(w - .25 * s, 0, .25 * s, h); }, { mat: { roughness: .6 } });
  const tower = g(
    at(box(.5, 46, 45, caseM), 10.25, 23, 0), at(box(21, .5, 45, caseM), 0, 45.75, 0), at(box(21, .5, 45, caseM), 0, .25, 0),
    at(K.mesh(new T.BoxGeometry(21, 46, .8), [caseM, caseM, caseM, caseM, frontTex, caseM]), 0, 23, 22.1), at(box(21, 46, .5, caseM), 0, 23, -22.25),
    ...[[-9, -20], [9, -20], [-9, 20], [9, 20]].map(([x, z]) => at(cyl(1, 1.2, .8, K.rubber(), 16), x, -.4, z)));
  const glass = at(box(.4, 45, 44, K.glass(0xbfd0dc, .12)), -10.3, 23, 0); glass.userData.see = true; glass.castShadow = false;
  const pbtn = g(at(cyl(.9, .9, .3, K.metal(0xc0c6cc, .3), 32), 0, 46.15, 18), at(K.torus(1.05, .09, K.glow(0x3b82f6, 2.5), 8, 32), 0, 46.05, 18, PI / 2, 0, 0));
  const caseFan = (y, z) => { const fs = K.rrect(12, 12, 1.2); fs.holes.push(K.circle(5.6));
    const f = g(at(K.extrude(fs, 2.2, K.plastic(0x23272d, .55), .1), 0, 0, -1.1)), b = fanBlades(Q, 5.4, 7, 0x2b3038, null);
    K.spin(b, 'z', 5); f.add(b); f.position.set(0, y, z); return f; };
  const fans = [caseFan(14, 20.4), caseFan(27, 20.4), caseFan(37, -20.6)];

  /* the motherboard stands against the far side; its parts face the glass */
  const mb = motherboard(Q);
  mb.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3(0, 0, 1), new T.Vector3(-1, 0, 0), new T.Vector3(0, -1, 0)));
  mb.position.set(9.9, 31, -6.5);
  const S = mb.userData.slots;
  const cool = cooling(Q); cool.position.set(S.socket[0], S.socket[1], S.socket[2]); cool.rotation.y = PI / 2;
  const sticks = [1, 3].map(i => { const r = ram(Q); r.position.set(S.ram[i], .45, S.ramZ); r.rotation.y = PI / 2; return r; });
  const card = gpu(Q); card.position.set(S.pcie[0] + 7.5, 1.36, S.pcie[2]);
  const m2 = ssd(Q); m2.scale.setScalar(.5); m2.position.set(...S.m2);
  mb.add(cool, ...sticks, card, m2);
  const p = psu(Q, { cables: false }); p.position.set(0, .5, -14.5); p.rotation.y = PI;
  const h = hdd(Q, { quietLabels: true }); h.position.set(0, 1.0, 12.5);
  const inside = g(tower, glass, pbtn, ...fans, mb, p, h);
  inside.position.set(58, .8, -6);

  K.label('monitor', mon, -22, 46.5, .7);
  K.label('webcam', cam, 0, 9.1, 0);
  K.label('keyboard', kb, -15, 3.4, -3);
  K.label('mouse', ms, 0, 3.6, 0);
  K.label('speakers', spL, 0, 18.4, 2);
  K.label('mic', mc, 0, 21.2, 0);
  K.label('power-button', pbtn, 0, 46.4, 18);
  K.label('cooling', cool, 0, 17.2, 0);
  K.label('cpu', cool, 2.2, .3, 2.2);
  K.label('ram', sticks[1], 4, 3.4, 0);
  K.label('gpu', card, 6, 11.2, 2);
  K.label('motherboard', mb, 12, .3, 11);
  K.label('io', mb, -13.6, 3.9, -6);
  K.label('storage', h, -2, 2.8, 2);
  K.label('psu', p, -3, 9.4, 0);
  const m = g(desk, mon, cam, kb, ms, spL, spR, mc, inside);
  m.userData.view = [-.42, .55, 1];
  return m;
}

const BUILD = { computer, cpu, motherboard, ram, gpu, storage, ssd, hdd, psu, cooling, io,
  monitor, speakers, printer, keyboard, mouse, joystick, gamepad, 'power-button': powerButton, webcam, mic };
export const IDS = Object.keys(BUILD);
export function build(id){
  const K = makeKit();
  const root = BUILD[id](K);
  return { root, labels: K.labels, ticks: K.ticks, view: root.userData.view || [.55, .45, 1] };
}
