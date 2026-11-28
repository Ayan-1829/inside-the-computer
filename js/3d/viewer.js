/* ==========================================================
   3d/viewer.js
   Draws one 3D model (3d/models.js) in the "3D view" window that
   js/model3d.js opens: soft studio light and shadows, turn by
   dragging (or the arrow keys), zoom with the wheel, pinch or + and −.
   - Labels: a name pinned to each labelled part. Clicking one opens
     that part's page. Labels for parts inside show once it is opened.
   - Open it up: the parts move apart (an exploded view) and back.
   - Fans spin, a hard drive's arm swings and a printer's carriage
     moves, unless the visitor prefers reduced motion.
   One WebGL renderer is kept for the page and reused for every model.
   ========================================================== */
import * as T from '../vendor/three.js';
import { OrbitControls, RoomEnvironment } from '../vendor/three.js';
import { build, IDS } from './models.js';

export { IDS };
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function createViewer(host, labelsEl, o){
  /* o: {reduce: () => bool, nameOf(id), onLabel(id), onAuto(on), onOpen(open)} */
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFShadowMap;
  const canvas = renderer.domElement; canvas.className = 'm3d-canvas';
  host.prepend(canvas);

  const scene = new T.Scene();
  const pmrem = new T.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environment = envTex; scene.environmentIntensity = .85;
  const camera = new T.PerspectiveCamera(32, 1, .1, 5000);
  const key = new T.DirectionalLight(0xffffff, 1.9);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0005; key.shadow.normalBias = .03; key.shadow.radius = 4;
  const rim = new T.DirectionalLight(0xbfe9ff, .7);
  scene.add(key, key.target, rim, new T.HemisphereLight(0xffffff, 0x3a4450, .35));
  const ground = new T.Mesh(new T.PlaneGeometry(1, 1), new T.ShadowMaterial({ opacity: .2 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = .08; controls.screenSpacePanning = true;
  controls.autoRotateSpeed = 1.1; controls.rotateSpeed = .8; controls.zoomSpeed = .9;
  controls.addEventListener('start', () => { if (controls.autoRotate){ controls.autoRotate = false; o.onAuto(false); } });

  let cur = null;            /* {id, root, labels, ticks, movers, fit0, fit1, hasOpen} */
  let exT = 0, exGoal = 0, running = false, raf = 0, last = 0, frame = 0, showLabels = true, focusId = null;
  const v = new T.Vector3(), ray = new T.Raycaster();

  function dispose(root){
    root.traverse(n => {
      if (n.geometry) n.geometry.dispose();
      const ms = n.material ? [].concat(n.material) : [];
      ms.forEach(m => { ['map', 'emissiveMap', 'alphaMap', 'roughnessMap', 'metalnessMap'].forEach(k => m[k] && m[k].dispose()); m.dispose(); });
    });
  }
  /* how far the camera must be, looking at the middle of box b from direction dir (default: where it is now),
     for every corner of the box to be in view with a small margin */
  function fitFor(b, dir){
    const c = b.getCenter(new T.Vector3()), r = b.getSize(new T.Vector3()).length() / 2;
    const d = (dir || camera.position.clone().sub(controls.target)).clone().normalize();
    const right = new T.Vector3().crossVectors(d, new T.Vector3(0, 1, 0)).normalize(), up = new T.Vector3().crossVectors(right, d);
    const tv = Math.tan(camera.fov * Math.PI / 360) * .88, th = tv * camera.aspect;
    let D = 0;
    for (let i = 0; i < 8; i++){
      const p = new T.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).sub(c);
      const a = p.dot(d);
      D = Math.max(D, a + Math.abs(p.dot(right)) / th, a + Math.abs(p.dot(up)) / tv);
    }
    return { c, d: Math.max(D, r * 1.2), r };
  }
  function applyEx(t){
    const e = ease(t);
    cur.movers.forEach(m => m.obj.position.copy(m.base).addScaledVector(m.obj.userData.ex, e));
  }
  function boxAt(t){ applyEx(t); cur.root.updateMatrixWorld(true); return new T.Box3().setFromObject(cur.root); }

  function show(id, focus){
    if (cur){ scene.remove(cur.root); dispose(cur.root); }
    const b = build(id);
    const movers = [];
    b.root.traverse(n => { if (n.userData.ex) movers.push({ obj: n, base: n.position.clone() }); });
    cur = { id, root: b.root, labels: b.labels, ticks: b.ticks, movers, hasOpen: movers.length > 0 };
    scene.add(b.root);
    exT = exGoal = 0;
    const b0 = boxAt(0), b1 = cur.hasOpen ? boxAt(1) : b0.clone(); applyEx(0);
    cur.box0 = b0; cur.box1 = b1;
    const all = b0.clone().union(b1), size = all.getSize(new T.Vector3()), R = size.length() / 2;
    ground.position.set(all.getCenter(v).x, all.min.y - .02, all.getCenter(v).z); ground.scale.setScalar(R * 12);
    /* the key light from the upper front left, its shadow box sized to the model */
    const c = all.getCenter(new T.Vector3());
    key.position.copy(c).add(new T.Vector3(-.55, 1.15, .7).normalize().multiplyScalar(R * 3));
    key.target.position.copy(c);
    rim.position.copy(c).add(new T.Vector3(.8, .5, -1).normalize().multiplyScalar(R * 3));
    const sc = key.shadow.camera; sc.left = sc.bottom = -R * 1.15; sc.right = sc.top = R * 1.15; sc.near = R * .5; sc.far = R * 6; sc.updateProjectionMatrix();
    cur.dir = new T.Vector3(...b.view).normalize();
    cur.R = R;
    /* labels */
    labelsEl.textContent = '';
    focusId = focus && cur.labels.some(l => l.id === focus) ? focus : null;
    cur.labels.forEach(l => {
      const el = document.createElement('button');
      el.type = 'button'; el.className = 'm3d-lab' + (l.id === focusId ? ' cur' : '') + (l.inside ? ' in' : '');
      el.innerHTML = '<i></i><span></span>'; el.lastChild.textContent = l.text || o.nameOf(l.id);
      el.title = 'Open the ' + o.nameOf(l.id) + ' page';
      el.addEventListener('click', () => o.onLabel(l.id));
      labelsEl.appendChild(el); l.el = el; l.hidden = false; l.behind = false;
    });
    resize(); reset();
    const fl = focusId && cur.labels.find(l => l.id === focusId);
    if (fl && fl.inside) setOpen(true);
    return { hasOpen: cur.hasOpen, labels: cur.labels.length, insideOnly: cur.labels.length > 0 && cur.labels.every(l => l.inside) };
  }
  function reset(){
    if (!cur) return;
    const f = fitFor(exGoal ? cur.box1 : cur.box0, cur.dir);
    controls.target.copy(f.c);
    camera.position.copy(f.c).addScaledVector(cur.dir, f.d);
    camera.near = f.r / 50; camera.far = f.r * 60; camera.updateProjectionMatrix();
    controls.minDistance = f.d * .25; controls.maxDistance = f.d * 3.5;
    controls.update();
  }
  function setOpen(on){
    if (!cur || !cur.hasOpen) return;
    exGoal = on ? 1 : 0;
    if (o.reduce()){ exT = exGoal; applyEx(exT); reframe(on ? 0 : 1, exT); }
    o.onOpen(on);
  }
  /* keep the model in view while it opens: move the camera with the change in its size */
  function reframe(from, to){
    const a = fitFor(cur.box0), b = fitFor(cur.box1);
    const lerp = (t) => ({ c: a.c.clone().lerp(b.c, t), d: a.d + (b.d - a.d) * t });
    const p = lerp(ease(from)), q = lerp(ease(to));
    const off = camera.position.clone().sub(controls.target);
    const k = q.d / p.d;
    controls.target.add(q.c.clone().sub(p.c));
    camera.position.copy(controls.target).addScaledVector(off, k);
    controls.minDistance = Math.min(a.d, b.d) * .25; controls.maxDistance = Math.max(a.d, b.d) * 3.5;
  }
  function resize(){
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(host);

  function placeLabels(){
    if (!cur) return;
    const w = host.clientWidth, h = host.clientHeight, open = exT > .6, check = frame % 8 === 0;
    let shown = 0;
    cur.labels.forEach(l => {
      const hide = !showLabels || (l.inside && !open);
      if (hide !== l.hidden){ l.el.classList.toggle('off', hide); l.hidden = hide; }
      if (hide) return;
      shown++;
      v.setFromMatrixPosition(l.anchor.matrixWorld);
      if (check){
        /* dim a label whose part is hidden behind the model from this side */
        const d = camera.position.distanceTo(v);
        ray.set(camera.position, v.clone().sub(camera.position).normalize()); ray.far = d;
        const hit = ray.intersectObject(cur.root, true).find(i => !i.object.userData.see && !(i.object.material && (i.object.material.transparent || i.object.material.alphaTest)));
        const behind = !!hit && hit.distance < d - cur.R * .03;
        if (behind !== l.behind){ l.el.classList.toggle('behind', behind); l.behind = behind; }
      }
      v.project(camera);
      const x = (v.x + 1) / 2 * w, y = (1 - v.y) / 2 * h;
      l.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
      l.el.style.zIndex = String(1000 - Math.round(v.z * 900));
    });
    o.onShown && o.onShown(shown);
  }

  function loop(now){
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now; frame++;
    if (cur && exT !== exGoal){
      const from = exT;
      exT = exGoal > exT ? Math.min(exGoal, exT + dt / .9) : Math.max(exGoal, exT - dt / .9);
      applyEx(exT); reframe(from, exT);
    }
    if (cur && !o.reduce()) cur.ticks.forEach(f => f(dt, now / 1000));
    controls.update();
    renderer.render(scene, camera);
    placeLabels();
  }
  function start(){ if (running) return; running = true; last = 0; raf = requestAnimationFrame(loop); }
  function stop(){ running = false; cancelAnimationFrame(raf); }

  /* the keyboard: arrows turn, + and − zoom, 0 resets */
  function orbit(dAz, dPol){
    const off = camera.position.clone().sub(controls.target), s = new T.Spherical().setFromVector3(off);
    s.theta += dAz; s.phi = Math.min(Math.PI - .05, Math.max(.05, s.phi + dPol));
    off.setFromSpherical(s); camera.position.copy(controls.target).add(off);
  }
  function zoom(f){
    const off = camera.position.clone().sub(controls.target), d = off.length() * f;
    off.setLength(Math.min(controls.maxDistance, Math.max(controls.minDistance, d))); camera.position.copy(controls.target).add(off);
  }
  host.addEventListener('keydown', e => {
    if (e.target !== host) return;
    const k = e.key, step = Math.PI / 18;
    if (k === 'ArrowLeft') orbit(-step, 0); else if (k === 'ArrowRight') orbit(step, 0);
    else if (k === 'ArrowUp') orbit(0, -step); else if (k === 'ArrowDown') orbit(0, step);
    else if (k === '+' || k === '=') zoom(.85); else if (k === '-' || k === '_') zoom(1 / .85);
    else if (k === '0') reset();
    else return;
    e.preventDefault();
    if (controls.autoRotate){ controls.autoRotate = false; o.onAuto(false); }
  });

  return {
    show, reset, setOpen, start, stop, zoom,
    setAuto(on){ controls.autoRotate = on; },
    setLabels(on){ showLabels = on; },
    /* a still picture of the model as it is now, w × h pixels with a transparent background
       (build/render-3d-thumbs.mjs makes the small previews on the parts' pictures with it) */
    snapshot(w, h, type = 'image/webp', q = .9){
      const pr = renderer.getPixelRatio();
      renderer.setPixelRatio(1); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      reset(); renderer.render(scene, camera);
      const url = canvas.toDataURL(type, q);
      renderer.setPixelRatio(pr); resize(); reset();
      return url;
    },
    destroy(){ stop(); ro.disconnect(); if (cur) dispose(cur.root); envTex.dispose(); pmrem.dispose(); renderer.dispose(); },
  };
}
