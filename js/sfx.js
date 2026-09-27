/* ==========================================================
   sfx.js
   Sound effects for the animations (the I/O devices' "How it works" and the
   power-on walkthrough). Every sound is made in the browser with the Web
   Audio API (oscillators, filtered noise), so there are no audio files to
   download. Voices use the browser's own speech voices (speechSynthesis),
   preferring a natural-sounding English one.

   Nothing plays until the visitor presses a button that starts an animation
   (browsers only allow sound after a click or tap). The speaker button in the
   animation controls opens a volume slider; the one volume applies to every
   animation and is remembered in this browser (localStorage 'itc-volume'),
   like the theme.

   SFX.cue(list)  stops what was playing and starts the sounds of one step.
                  Each entry is a name ('click', 'motor', ...), 'loop:name' for
                  a sound that repeats until the next step, or 'say:text' /
                  'say-soft:text' / 'say-loud:text' for a voice.
   SFX.pause() / SFX.resume() / SFX.stop()
   ========================================================== */
var SFX = (function(){
  /* One volume for every animation, 0 to 1, remembered in this browser (localStorage 'itc-volume',
     in percent). 0 is muted. The older on/off setting ('itc-sound') is read once so a mute carries over. */
  const KEY = 'itc-volume', DEF = 1;          /* 100 % unless the visitor has chosen a level */
  let vol = DEF;
  try {
    const v = localStorage.getItem(KEY);
    if (v !== null && !isNaN(+v)) vol = Math.max(0, Math.min(1, +v / 100));
    else if (localStorage.getItem('itc-sound') === 'off') vol = 0;
  } catch(_){}
  let lastVol = vol || DEF;                   /* what unmuting goes back to */
  const on = () => vol > 0;
  const gainFor = v => v * .8;                /* the slider scales evenly from 0 (silent) to 100 % (full) */
  let ctx = null, master = null, noiseBuf = null, unlocked = false, talking = false;
  let loops = [], timers = [], voiceTimer = null;

  function ac(){
    if (ctx) return ctx;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain(); master.gain.value = gainFor(vol);
    /* a gentle limiter, so overlapping sounds at full volume never distort */
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -10; lim.knee.value = 6; lim.ratio.value = 8; lim.attack.value = .003; lim.release.value = .2;
    master.connect(lim); lim.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  const now = () => ctx.currentTime;

  /* ---- building blocks ---- */
  function env(g, t, a, peak, hold, rel){           /* attack, hold, release on a gain node */
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel);
  }
  function tone(type, freq, t, dur, peak, o = {}){
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    env(g, t, o.a || .005, peak, Math.max(0, dur - (o.a || .005) - (o.r || .05)), o.r || .05);
    osc.connect(g); g.connect(o.out || master);
    osc.start(t); osc.stop(t + dur + .05);
    return osc;
  }
  function noise(t, dur, peak, filter, freq, q, o = {}){
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf; src.loop = true;
    f.type = filter; f.frequency.setValueAtTime(freq, t); f.Q.value = q || 1;
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    env(g, t, o.a || .003, peak, Math.max(0, dur - (o.a || .003) - (o.r || .04)), o.r || .04);
    src.connect(f); f.connect(g); g.connect(o.out || master);
    src.start(t, Math.random()); src.stop(t + dur + .05);
  }

  /* ---- one-shot sounds ---- */
  /* Plain, realistic sounds only: short filtered-noise ticks and clicks, steady tones, soft hums.
     Nothing slides up or down in pitch, and nothing plays little melodies, so nothing sounds cartoonish. */
  const SHOTS = {
    click(t){ noise(t, .02, .3, 'bandpass', 1400, 1.5); },                                                    /* a small switch */
    clack(t){ noise(t, .03, .4, 'bandpass', 1500, 1.2); tone('sine', 120, t, .04, .18); },                     /* a key reaching the bottom */
    thock(t){ noise(t, .025, .22, 'bandpass', 1100, 1.2); },                                                    /* the key coming back up */
    relay(t){ noise(t, .02, .3, 'bandpass', 1300, 2); noise(t + .03, .02, .22, 'bandpass', 1000, 2); },
    beep(t){ tone('sine', 880, t, .25, .1, {a: .01, r: .06}); },                                                /* one short POST beep */
    blip(t){ tone('sine', 660, t, .06, .06); },                                                                 /* a single soft data tick */
    chirp(t){ tone('sine', 800, t, .05, .05); tone('sine', 800, t + .09, .05, .04); },                          /* two soft pips: a radio packet */
    ding(t){ tone('sine', 784, t, .6, .1, {r: .55}); tone('sine', 1175, t, .45, .03, {r: .4}); },
    shutter(t){ noise(t, .03, .35, 'bandpass', 1100, 1); noise(t + .09, .04, .3, 'bandpass', 900, 1); },
    whoosh(t){ noise(t, .8, .12, 'bandpass', 500, .8, {a: .3, r: .4}); },                                       /* a soft rush of air */
    drop(t){ noise(t, .012, .12, 'bandpass', 2400, 2); },                                                       /* an ink nozzle firing: a tiny tick */
    chime(t){ [523.25, 659.25, 783.99].forEach(f => tone('sine', f, t, 1.6, .07, {a: .05, r: 1.3})); },       /* a soft chord, all at once */
    zap(t){ tone('sine', 100, t, .7, .06, {a: .25, r: .35}); }                                                  /* power coming on: a low swell */
  };

  /* ---- sounds that repeat until the step ends: each returns a stop function ---- */
  function every(ms, fn){ fn(); const id = setInterval(fn, ms); timers.push(id); return () => clearInterval(id); }
  function held(build){                                   /* a continuous sound, faded in and out */
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now()); g.gain.exponentialRampToValueAtTime(1, now() + .25); g.connect(master);
    const nodes = build(g);
    return () => { const t = now(); g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value || .0001, t); g.gain.exponentialRampToValueAtTime(.0001, t + .2);
      nodes.forEach(n => { try { n.stop(t + .25); } catch(_){} }); };
  }
  const osc = (type, f, out, gain) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f; g.gain.value = gain; o.connect(g); g.connect(out); o.start(); return o; };
  const noiseSrc = (out, type, f, q, gain) => { const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true; fl.type = type; fl.frequency.value = f; fl.Q.value = q; g.gain.value = gain; s.connect(fl); fl.connect(g); g.connect(out); s.start(); return s; };
  const LOOPS = {
    bits: () => every(180, () => { const t = now(); tone('sine', 620, t, .035, .035); }),                          /* data: even, quiet ticks */
    'bits-fast': () => every(110, () => { const t = now(); tone('sine', 620, t, .03, .03); }),
    hum: () => held(g => [osc('sine', 100, g, .06), osc('sine', 200, g, .02)]),                          /* mains and electronics */
    'tone-weak': () => held(g => [osc('sine', 330, g, .025)]),                                             /* the signal, before amplifying */
    'tone-strong': () => held(g => [osc('sine', 330, g, .12), osc('sine', 660, g, .03)]),                 /* and after */
    steps: () => every(130, () => { const t = now(); tone('sine', 330, t, .04, .045); }),                          /* samples being taken: a steady tick */   /* samples: a stepped tone */
    buzz: () => held(g => [osc('sine', 110, g, .08), osc('sine', 220, g, .015)]),                                               /* current in the voice coil */
    motor: () => held(g => { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400; lp.connect(g);
      return [osc('sawtooth', 90, lp, .08), noiseSrc(g, 'bandpass', 900, 1, .03)]; }),                         /* a small motor, steady */
    roller: () => held(g => [noiseSrc(g, 'lowpass', 400, .7, .5), osc('triangle', 60, g, .06)]),
    rumble: () => held(g => { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 150; lp.connect(g);
      return [osc('sawtooth', 48, lp, .3)]; }),                                                                  /* a vibration motor: a low, even buzz */
    drops: () => every(110, () => SHOTS.drop(now())),
    scan: () => every(260, () => { const t = now(); tone('sine', 440, t, .04, .045); }),
    clicks: () => every(800, () => { SHOTS.click(now()); }),
    keys: () => every(2000, () => { SHOTS.clack(now()); timers.push(setTimeout(() => ctx && SHOTS.thock(now()), 1000)); }),
    waves: () => every(700, () => SHOTS.whoosh(now())),
    radio: () => every(600, () => SHOTS.chirp(now())),
    blink: () => every(800, () => SHOTS.blip(now()))
  };

  /* ---- voices ---- */
  let voice = null;
  /* Google's voices (Chrome, Android) first, then other natural-sounding ones: Microsoft's "Natural" online
     voices (Edge) and Apple's (Safari). Voices that sound robotic (eSpeak on Linux, Microsoft's old desktop
     voices, Apple's novelty voices) are never used: without a good voice, the step just plays its other sounds. */
  const GOOD = [/^Google US English/, /^Google UK English Female/, /^Google UK English Male/, /^Google/,
    /Microsoft (Aria|Jenny|Ava|Emma|Andrew|Brian|Guy|Sonia|Libby|Natasha).*(Natural|Online)/,
    /^(Samantha|Ava|Zoe|Allison|Susan|Nicky|Evan|Tom|Serena|Daniel|Karen|Moira|Tessa|Kate|Oliver|Stephanie)( \((Enhanced|Premium)\))?$/,
    /(Enhanced|Premium|Neural|Natural)/];
  const ROBOTIC = /eSpeak|espeak|Microsoft (David|Zira|Mark|Hazel|George|Susan) Desktop|^(Fred|Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Hysterical|Jester|Junior|Kathy|Organ|Pipe Organ|Princess|Ralph|Superstar|Trinoids|Whisper|Wobble|Zarvox)\b/;
  function pickVoice(){
    const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    const en = vs.filter(v => /^en(-|_|$)/i.test(v.lang) && !ROBOTIC.test(v.name));
    voice = null;
    for (const re of GOOD){ voice = en.find(v => re.test(v.name) && /en[-_]US/i.test(v.lang)) || en.find(v => re.test(v.name)); if (voice) break; }
  }
  if (window.speechSynthesis){ pickVoice(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', pickVoice); }
  function speakNow(text, volume){
    speechSynthesis.cancel(); speechSynthesis.resume();   /* a paused queue would hold the new words back */
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice; u.lang = voice.lang;
    u.volume = Math.min(1, volume * vol); u.rate = .95; u.pitch = 1;
    talking = true; u.onend = u.onerror = () => { talking = false; };
    speechSynthesis.speak(u);
  }
  function say(text, volume, delay){
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    if (!voice) pickVoice();        /* the list can arrive late */
    if (!voice) return;             /* no natural-sounding voice here: better silent than robotic */
    clearTimeout(voiceTimer);
    if (delay) voiceTimer = setTimeout(() => speakNow(text, volume), delay);
    else speakNow(text, volume);    /* at once: the first step's words start with the click itself */
  }
  /* Get the voice ready before it is needed: a silent, empty sentence in the chosen voice. Google's
     voices are fetched over the network, so the first real sentence would otherwise start late. It also
     unlocks speech on iPhone and iPad, which only allow it to start during a tap. */
  function warm(){
    if (!on() || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    if (!voice) pickVoice();
    const u = new SpeechSynthesisUtterance(' '); u.volume = 0;
    if (voice){ u.voice = voice; u.lang = voice.lang; }
    speechSynthesis.speak(u); unlocked = true;
  }

  function stop(){
    loops.forEach(f => { try { f(); } catch(_){} }); loops = [];
    timers.forEach(id => { clearInterval(id); clearTimeout(id); }); timers = [];
    clearTimeout(voiceTimer);
    if (window.speechSynthesis && talking){ speechSynthesis.cancel(); talking = false; }   /* a silent warm-up is left to finish */
  }
  /* Safari on iPhone and iPad only lets a page speak if its first sentence starts during a tap:
     an empty, silent one on the first cue (which runs inside the "How it works" or power-button click)
     unlocks the voice for the later steps, which start on a timer. */
  function unlockVoice(){
    if (unlocked || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); unlocked = true;
  }
  function cue(list){
    stop();
    if (on()) unlockVoice();
    if (!on() || !list || !list.length || !ac()) return;
    if (ctx.state === 'suspended') ctx.resume();
    list.forEach((e, i) => {
      const m = /^(say|say-soft|say-loud):(.*)$/.exec(e);
      if (m){ say(m[2], m[1] === 'say-soft' ? .45 : 1, 0); return; }
      const l = /^loop:(.+)$/.exec(e);
      if (l){ if (LOOPS[l[1]]) loops.push(LOOPS[l[1]]()); return; }
      const d = /^(\w+)@([\d.]+)$/.exec(e);                 /* 'beep@0.6': a one-shot after a delay (seconds) */
      if (d){ if (SHOTS[d[1]]) SHOTS[d[1]](now() + +d[2]); return; }
      if (SHOTS[e]) SHOTS[e](now() + .02 + i * .01);
    });
  }
  function pause(){ if (ctx && ctx.state === 'running') ctx.suspend(); if (window.speechSynthesis) speechSynthesis.pause(); }
  function resume(){ if (ctx && ctx.state === 'suspended' && on()) ctx.resume(); if (window.speechSynthesis) speechSynthesis.resume(); }

  /* ---- the volume: a speaker button in every animation's controls opens a small slider ----
     Every speaker button shows the same level, and a change made from one of them applies to
     all the animations at once (and to sounds already playing). */
  const WAVES = ['', '<path d="M11 5.8a3.2 3.2 0 0 1 0 4.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
    '<path d="M11 5.2a4 4 0 0 1 0 5.6M12.8 3.4a6.5 6.5 0 0 1 0 9.2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'];
  const icon = () => '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2 6h3l4-3v10l-4-3H2z"/>' +
    (vol <= 0 ? '<path d="M11 6l4 4M15 6l-4 4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' : WAVES[vol < .45 ? 1 : 2]) + '</svg>';
  function syncButtons(){
    const pct = Math.round(vol * 100), label = vol > 0 ? `Sound volume ${pct}%` : 'Sound muted';
    document.querySelectorAll('[data-sfx]').forEach(b => {
      b.innerHTML = icon(); b.setAttribute('aria-label', label + ' (click to change)'); b.title = label;
      b.setAttribute('aria-haspopup', 'dialog'); b.classList.toggle('is-off', vol <= 0);
    });
    if (pop){ pop.querySelector('input').value = pct; pop.querySelector('output').textContent = vol > 0 ? pct + '%' : 'Muted';
      const m = pop.querySelector('.sfx-mute'); m.innerHTML = icon(); m.setAttribute('aria-label', vol > 0 ? 'Mute' : 'Unmute'); m.title = vol > 0 ? 'Mute' : 'Unmute'; }
  }
  let saveTimer = null, tickAt = 0;
  function setVolume(v, o = {}){
    vol = Math.max(0, Math.min(1, v));
    if (vol > 0) lastVol = vol;
    if (master) master.gain.setTargetAtTime(gainFor(vol), ctx.currentTime, .03);   /* sounds already playing follow at once */
    if (vol <= 0 && window.speechSynthesis) speechSynthesis.cancel();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, String(Math.round(vol * 100))); } catch(_){} }, 200);
    syncButtons();
    if (o.preview && vol > 0 && ac()){                 /* a soft tick so the new level can be heard, at most a few times a second */
      if (ctx.state === 'suspended') ctx.resume();
      if (performance.now() - tickAt > 180){ tickAt = performance.now(); SHOTS.blip(ctx.currentTime + .01); }
    }
  }
  const toggle = () => setVolume(vol > 0 ? 0 : lastVol, {preview: true});

  let pop = null, popFor = null;
  function buildPop(){
    pop = document.createElement('div');
    pop.className = 'sfx-pop'; pop.hidden = true;
    pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Sound volume');
    /* a narrow vertical panel: the level on top, the slider (up is louder), mute nearest the speaker icon */
    pop.innerHTML = '<output></output><input type="range" min="0" max="100" step="5" aria-label="Volume" aria-orientation="vertical" orient="vertical">' +
      '<button type="button" class="pw-btn pw-ic sfx-mute"></button>';
    pop.querySelector('input').addEventListener('input', e => setVolume(+e.target.value / 100, {preview: true}));
    pop.querySelector('.sfx-mute').addEventListener('click', toggle);
    syncButtons();
  }
  /* above the speaker icon, centred on it; below it only when there is no room above */
  function placePop(btn){
    const r = btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    const above = r.top - 8 - h >= 8;
    pop.classList.toggle('below', !above);
    pop.style.left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8)) + 'px';
    pop.style.top = (above ? r.top - 8 - h : r.bottom + 8) + 'px';
  }
  function openPop(btn){
    if (!pop) buildPop();
    (document.fullscreenElement || document.webkitFullscreenElement || document.body).appendChild(pop);   /* visible in full screen too */
    pop.hidden = false; popFor = btn;
    placePop(btn);
    btn.setAttribute('aria-expanded', 'true');
    pop.querySelector('input').focus();
  }
  function closePop(){
    if (!pop || pop.hidden) return;
    pop.hidden = true;
    if (popFor){ popFor.setAttribute('aria-expanded', 'false'); if (document.activeElement && pop.contains(document.activeElement)) popFor.focus(); }
    popFor = null;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-sfx]');
    if (b){ e.preventDefault(); if (pop && !pop.hidden && popFor === b) closePop(); else openPop(b); return; }
    if (pop && !pop.hidden && !e.composedPath().includes(pop)) closePop();   /* the path, not contains(): the mute icon is redrawn by its own click */
  });
  /* Escape closes the slider only (caught first, so it doesn't also go up a level) */
  addEventListener('keydown', e => { if (e.key === 'Escape' && pop && !pop.hidden){ closePop(); e.stopPropagation(); } }, true);
  addEventListener('resize', closePop);
  addEventListener('scroll', () => { if (pop && !pop.hidden && popFor) placePop(popFor); }, true);

  return { cue, stop, pause, resume, toggle, setVolume, syncButtons, warm, isOn: on, volume: () => vol };
})();
