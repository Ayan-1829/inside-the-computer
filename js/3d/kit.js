/* ==========================================================
   3d/kit.js
   The building blocks the 3D models (3d/models.js) are made of:
   materials, simple shapes, textures drawn on a canvas (circuit
   boards, chip markings, stickers), and three things the viewer
   (3d/viewer.js) reads back from a model:
     K.label(id, obj, x, y, z, inside)  a label for part `id`, pinned to obj
                                        (inside: shown only once it is opened up; an optional 7th argument is
                                        the label's own text, instead of the part's name)
     K.ex(obj, x, y, z)                 where obj moves to when the model is
                                        "opened up" (an exploded view)
     K.tick(fn)                         called every frame: fans spin, an arm swings
   Sizes are in centimetres, y is up, and a model's front faces +z.
   Loaded only when someone presses "3D view" (js/model3d.js).
   ========================================================== */
import * as T from '../vendor/three.js';
import { RoundedBoxGeometry } from '../vendor/three.js';

/* a small seeded random generator, so every board's traces come out the same each time */
export function rng(seed){
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const FONT = '"Schibsted Grotesk", "Helvetica Neue", Arial, sans-serif';
const MONO = '"JetBrains Mono", Menlo, Consolas, monospace';

export function makeKit(){
  const mats = new Map(), labels = [], ticks = [];
  const K = { T, labels, ticks, quiet: false, FONT, MONO };

  /* ---------- materials (shared by key, so a model reuses them) ---------- */
  const std = (key, o, Cls = T.MeshStandardMaterial) => { if (!mats.has(key)) mats.set(key, new Cls(o)); return mats.get(key); };
  K.plastic = (c, r = .55) => std(`p${c}/${r}`, { color: c, roughness: r, metalness: 0 });
  K.metal = (c, r = .35) => std(`m${c}/${r}`, { color: c, roughness: r, metalness: 1 });
  K.rubber = (c = 0x16181b) => std(`r${c}`, { color: c, roughness: .95, metalness: 0 });
  K.glow = (c, i = 2) => std(`g${c}/${i}`, { color: c, emissive: c, emissiveIntensity: i, roughness: .4 });
  K.glass = (c = 0xd8e6ee, o = .18) => std(`gl${c}/${o}`, { color: c, roughness: .03, metalness: 0, transparent: true, opacity: o,
    depthWrite: false, envMapIntensity: 1.6, side: T.DoubleSide }, T.MeshPhysicalMaterial);
  K.tmat = (map, o = {}) => new T.MeshStandardMaterial(Object.assign({ map, roughness: .55, metalness: 0 }, o));
  K.c = {
    black: 0x1b1e22, dark: 0x2a2f36, grey: 0x7d8792, light: 0xd9dee3, white: 0xeef1f3,
    alu: 0xc9ced3, steel: 0x8f979f, gunmetal: 0x3d434b, copper: 0xc07a45, gold: 0xd9a84e,
    pcb: 0x11694f, chip: 0x17191c,
  };
  K.alu = () => K.metal(K.c.alu, .32);
  K.gold = () => K.metal(K.c.gold, .22);
  K.copper = () => K.metal(K.c.copper, .28);

  /* ---------- shapes ---------- */
  K.mesh = (geo, m) => { const o = new T.Mesh(geo, m); o.castShadow = true; o.receiveShadow = true; return o; };
  K.box = (w, h, d, m, r = 0) => K.mesh(r > 0
    ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3))
    : new T.BoxGeometry(w, h, d), m);
  K.cyl = (rt, rb, h, m, seg = 32, open = false, ts = 0, tl = Math.PI * 2) => K.mesh(new T.CylinderGeometry(rt, rb, h, seg, 1, open, ts, tl), m);
  K.sph = (r, m, ws = 32, hs = 16, ps = 0, pl = Math.PI * 2, ts = 0, tl = Math.PI) => K.mesh(new T.SphereGeometry(r, ws, hs, ps, pl, ts, tl), m);
  K.torus = (R, r, m, rs = 12, ts = 48, arc = Math.PI * 2) => K.mesh(new T.TorusGeometry(R, r, rs, ts, arc), m);
  K.lathe = (pts, m, seg = 48) => K.mesh(new T.LatheGeometry(pts.map(p => new T.Vector2(p[0], p[1])), seg), m);
  K.curve = pts => new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], p[2])));
  K.tube = (pts, r, m, seg = 64, rs = 10) => K.mesh(new T.TubeGeometry(K.curve(pts), seg, r, rs, false), m);
  K.extrude = (shape, depth, m, bevel = 0, bseg = 3, cseg = 24) => K.mesh(new T.ExtrudeGeometry(shape,
    { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: bseg, curveSegments: cseg }), m);
  K.plane = (w, h, m) => { const o = new T.Mesh(new T.PlaneGeometry(w, h), m); o.receiveShadow = true; return o; };
  K.shape = () => new T.Shape();
  K.path = () => new T.Path();
  /* a rounded rectangle as a Shape (or a hole Path), centred on cx, cy */
  K.rrect = (w, h, r, cx = 0, cy = 0, P = T.Shape) => {
    const s = new P(), x = cx - w / 2, y = cy - h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  };
  K.circle = (r, cx = 0, cy = 0, P = T.Path) => { const p = new P(); p.absarc(cx, cy, r, 0, Math.PI * 2, true); return p; };
  /* bend a geometry's points with fn(v) (v: a Vector3 it may change) */
  K.deform = (geo, fn) => {
    const p = geo.attributes.position, v = new T.Vector3();
    for (let i = 0; i < p.count; i++){ v.fromBufferAttribute(p, i); fn(v); p.setXYZ(i, v.x, v.y, v.z); }
    geo.computeVertexNormals(); return geo;
  };
  K.at = (o, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); return o; };
  K.g = (...kids) => { const g = new T.Group(); kids.forEach(k => k && g.add(k)); return g; };
  /* many copies of one shape: list of [x, y, z, rx, ry, rz, sx, sy, sz] */
  K.inst = (geo, m, list) => {
    const o = new T.InstancedMesh(geo, m, list.length), M = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler();
    list.forEach((a, i) => { e.set(a[3] || 0, a[4] || 0, a[5] || 0); q.setFromEuler(e);
      M.compose(new T.Vector3(a[0], a[1], a[2]), q, new T.Vector3(a[6] || 1, a[7] || a[6] || 1, a[8] || a[6] || 1)); o.setMatrixAt(i, M); });
    o.castShadow = o.receiveShadow = true; o.computeBoundingBox(); o.computeBoundingSphere(); return o;
  };

  /* ---------- what the viewer reads back ---------- */
  K.label = (id, obj, x = 0, y = 0, z = 0, inside = false, text = '') => {
    const a = new T.Object3D(); a.position.set(x, y, z); obj.add(a); labels.push({ id, anchor: a, inside, text });
  };
  K.ex = (obj, x, y, z) => { obj.userData.ex = new T.Vector3(x, y, z); return obj; };
  K.tick = fn => ticks.push(fn);
  /* turn obj about its own x, y or z axis */
  K.spin = (obj, axis, speed) => { const f = { x: 'rotateX', y: 'rotateY', z: 'rotateZ' }[axis]; K.tick(dt => { obj[f](speed * dt); }); };
  /* the same kit for a model drawn inside another (the whole computer): no labels, no opening up */
  K.quiet = () => Object.assign(Object.create(K), { quiet: true, label(){}, ex: o => o });

  /* ---------- textures drawn on a canvas ---------- */
  K.canvas = (w, h, draw, o = {}) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); draw(x, w, h);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
    if (o.wrap){ t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(o.wrap[0], o.wrap[1]); }
    return t;
  };
  /* canvas size for a w × h cm surface: about `px` pixels on the long side */
  const dims = (w, h, px = 1024) => { const s = px / Math.max(w, h); return [Math.max(16, Math.round(w * s)), Math.max(16, Math.round(h * s)), s]; };
  K.font = (px, weight = 600, mono = false) => `${weight} ${px}px ${mono ? MONO : FONT}`;

  /* a printed circuit board, w × h cm. o: {seed, color, trace, fingers: {x0, x1, h} (gold edge contacts, cm), silk: [[text, x, y, px]], px} */
  K.pcbTex = (w, h, o = {}) => {
    const [cw, ch, s] = dims(w, h, o.px || 1024), R = rng(o.seed || 7);
    return K.canvas(cw, ch, (x) => {
      x.fillStyle = o.color || '#0f5f47'; x.fillRect(0, 0, cw, ch);
      x.strokeStyle = o.trace || 'rgba(70,190,140,.45)'; x.lineCap = 'round'; x.lineJoin = 'round';
      const n = Math.round((o.density || 1) * w * h * .9);
      for (let i = 0; i < n; i++){
        x.lineWidth = (R() < .8 ? .045 : .11) * s;
        let px = R() * cw, py = R() * ch; x.beginPath(); x.moveTo(px, py);
        for (let k = 0; k < 3; k++){
          const len = (.4 + R() * 2.4) * s, dir = Math.floor(R() * 8) * Math.PI / 4;
          px += Math.cos(dir) * len; py += Math.sin(dir) * len; x.lineTo(px, py);
        }
        x.stroke();
        x.fillStyle = 'rgba(210,180,90,.8)'; x.beginPath(); x.arc(px, py, .06 * s, 0, 7); x.fill();
      }
      x.fillStyle = 'rgba(235,240,235,.75)';
      for (let i = 0; i < w * h * .08; i++){ x.fillRect(R() * cw, R() * ch, (.3 + R() * .5) * s, .04 * s); }
      (o.silk || []).forEach(([t, sx, sy, pxs]) => { x.font = K.font((pxs || .35) * s, 700); x.fillText(t, sx * s, sy * s); });
      if (o.fingers){
        const f = o.fingers, pitch = (f.pitch || .1) * s;
        x.fillStyle = '#d9a84e';
        for (let px = f.x0 * s; px < f.x1 * s - pitch * .4; px += pitch) x.fillRect(px + pitch * .15, ch - f.h * s, pitch * .7, f.h * s);
      }
    });
  };
  /* a chip: a black box with its maker's marks printed on top */
  K.chip = (w, h, d, text = '', o = {}) => {
    const body = K.plastic(o.color || K.c.chip, .42);
    if (!text) return K.box(w, h, d, body, o.r || 0);
    const [cw, ch] = dims(w, d, 256);
    const top = K.tmat(K.canvas(cw, ch, (x) => {
      x.fillStyle = o.top || '#1b1e22'; x.fillRect(0, 0, cw, ch);
      x.fillStyle = o.ink || '#a9b1ba'; x.textAlign = 'center'; x.textBaseline = 'middle';
      const lines = text.split('\n'), fs = Math.min(ch / (lines.length + 1.2), cw / Math.max(...lines.map(l => l.length)) * 1.5);
      x.font = K.font(fs, 700, true);
      lines.forEach((l, i) => x.fillText(l, cw / 2, ch / 2 + (i - (lines.length - 1) / 2) * fs * 1.15));
      x.beginPath(); x.arc(Math.min(cw, ch) * .12, Math.min(cw, ch) * .12, Math.min(cw, ch) * .05, 0, 7); x.fillStyle = '#0c0d0f'; x.fill();
    }), { roughness: .45 });
    return K.mesh(new T.BoxGeometry(w, h, d), [body, body, top, body, body, body]);
  };
  /* a flat sticker or printed panel: w × h cm, draw(ctx, cw, ch, s) with s pixels per cm */
  K.print = (w, h, draw, o = {}) => {
    const [cw, ch, s] = dims(w, h, o.px || 512);
    return K.tmat(K.canvas(cw, ch, (x) => draw(x, cw, ch, s)), Object.assign({ roughness: .6 }, o.mat || {}));
  };
  /* stripes, for ribbed rubber or fins: a repeating texture */
  K.stripes = (a, b, n = 16, frac = .5) => K.canvas(64, 64, (x) => {
    x.fillStyle = a; x.fillRect(0, 0, 64, 64); x.fillStyle = b;
    for (let i = 0; i < n; i++) x.fillRect(i * 64 / n, 0, 64 / n * frac, 64);
  }, { wrap: [1, 1] });
  /* a grille: dark holes in a hex pattern, for speakers and microphones (used as an alpha map) */
  K.holes = (n = 24, r = .32) => K.canvas(256, 256, (x) => {
    x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 256); x.fillStyle = '#000';
    const p = 256 / n;
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++){ x.beginPath(); x.arc(i * p + (j % 2) * p / 2, j * p, p * r, 0, 7); x.fill(); }
  }, { wrap: [1, 1] });
  return K;
}
