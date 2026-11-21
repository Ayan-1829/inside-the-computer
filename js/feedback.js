/* Shared feedback box -- copy this exact file, unchanged, into every project.
   Adds a small "Feedback" button at the bottom right that opens a message box.
   The message goes to the same Cloudflare Worker as analytics.js (data-endpoint),
   which holds the real secret and stores it in the Google Sheet; nothing secret
   lives in this file. Project identity comes from the <script> tag's data-project.

   Optional rating question: a dialog in the middle of the screen, with the page behind it
   blurred, asking for 1 to 5 stars (and room for a comment) once a visit has gone on for a while. A site turns it on with
   attributes on the same <script> tag; without them nothing changes:
     data-rate-pages="15"    ask after more than this many pages in one visit
     data-rate-minutes="5"   ... or after more than this many minutes with the site on screen
     data-rate-name="…"      the site's name in the question (default "this site")
     data-rate-wait="sel"    wait while an element matches this CSS selector
                             (for example while a tour or an animation is running)
   A visit ends after 30 minutes away. The question is shown at most once: after a rating
   it never comes back, after "Not now" or closing it, not for 30 days. The count and
   the answer are kept in this browser only (localStorage). It is only shown when the
   Worker says it can store ratings (its GET answer has ratings: true). */
(function () {
  const script = document.currentScript;
  const ENDPOINT = script && script.dataset.endpoint;
  const PROJECT = script && script.dataset.project;
  if (!ENDPOINT || !PROJECT || typeof HTMLDialogElement === 'undefined') return;

  const MAX = 1000, COOLDOWN_MS = 20000;
  const device = /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';

  const style = document.createElement('style');
  style.textContent = `
.fbk-btn{position:fixed;right:16px;bottom:4px;z-index:20;display:inline-flex;align-items:center;gap:8px;height:38px;padding:0 20px;border-radius:999px;
  border:2px solid var(--accent,#0f6b4f);background:var(--accent,#0f6b4f);color:var(--accent-ink,#fff);font:700 15px var(--font-ui,system-ui,sans-serif);cursor:pointer;
  box-shadow:0 0 0 4px var(--accent-soft,rgba(15,107,79,.12)),0 10px 24px -8px rgba(0,0,0,.55);transition:transform .15s,box-shadow .15s,filter .15s;
  animation:fbk-pulse 2.4s ease-out 1.5s 3}
:root[data-theme="dark"] .fbk-btn{box-shadow:0 0 0 4px var(--accent-soft,rgba(77,195,156,.12)),0 0 22px -2px var(--accent-glow,rgba(77,195,156,.42)),0 8px 24px -8px rgba(255,255,255,.3)}
.fbk-btn:hover,.fbk-btn:focus-visible{filter:brightness(1.1);transform:translateY(-1px);box-shadow:0 0 0 6px var(--accent-glow,rgba(15,107,79,.4)),0 14px 28px -8px rgba(0,0,0,.6)}
:root[data-theme="dark"] .fbk-btn:hover,:root[data-theme="dark"] .fbk-btn:focus-visible{box-shadow:0 0 0 6px var(--accent-glow,rgba(77,195,156,.42)),0 0 30px 0 var(--accent-glow,rgba(77,195,156,.42))}
.fbk-btn svg{width:19px;height:19px;flex:none}
.fbk-btn.fbk-inline{position:static;height:26px;padding:0 13px;gap:6px;border-width:1px;font-size:13px;box-shadow:none;animation:none}
.fbk-btn.fbk-inline svg{width:15px;height:15px}
.fbk-btn.fbk-inline:hover,.fbk-btn.fbk-inline:focus-visible{box-shadow:0 0 0 3px var(--accent-soft,rgba(15,107,79,.12))}
@keyframes fbk-pulse{0%{box-shadow:0 0 0 4px var(--accent-soft,rgba(15,107,79,.12)),0 0 0 0 var(--accent-glow,rgba(15,107,79,.4))}100%{box-shadow:0 0 0 4px var(--accent-soft,rgba(15,107,79,.12)),0 0 0 18px rgba(0,0,0,0)}}
@media (prefers-reduced-motion:reduce){.fbk-btn{animation:none}}
@media (max-width:980px){.fbk-btn{bottom:14px;height:46px;padding:0 22px;font-size:17px}.fbk-btn svg{width:21px;height:21px}}
.fbk-dlg{width:min(440px,calc(100vw - 32px));padding:0;border:1px solid var(--line,#d5dcd8);border-radius:20px;background:var(--surface,#fff);color:var(--ink,#16201c);
  box-shadow:0 30px 80px -30px rgba(0,0,0,.5);font-family:var(--font-ui,system-ui,sans-serif)}
.fbk-dlg::backdrop{background:rgba(10,18,15,.45);backdrop-filter:blur(2px)}
.fbk-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:18px 22px 4px}
.fbk-head h2{margin:0;font-size:20px;letter-spacing:-.02em}
.fbk-head p{margin:3px 0 0;font-size:15px;line-height:1.4;color:var(--ink-3,#66746e)}
.fbk-x{flex:none;width:34px;height:34px;border-radius:10px;border:1px solid var(--line,#d5dcd8);background:var(--surface,#fff);color:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center}
.fbk-x:hover,.fbk-x:focus-visible{border-color:var(--accent,#0f6b4f)}
.fbk-x svg{width:16px;height:16px}
.fbk-form{padding:12px 22px 20px}
.fbk-form textarea{display:block;width:100%;box-sizing:border-box;min-height:120px;resize:vertical;padding:11px 13px;border-radius:12px;border:1px solid var(--line,#d5dcd8);
  background:var(--bg,#f6f8f7);color:inherit;font:15px/1.45 var(--font-ui,system-ui,sans-serif)}
.fbk-form textarea:focus{outline:2px solid var(--accent,#0f6b4f);outline-offset:1px}
.fbk-meta{display:flex;justify-content:space-between;gap:12px;margin:6px 2px 0;font-size:13px;color:var(--ink-3,#66746e)}
.fbk-status{margin:10px 0 0;min-height:1.4em;font-size:15px;line-height:1.4;color:var(--ink-2,#3b4743)}
.fbk-status.err{color:#b3261e}.fbk-status.ok{color:var(--accent,#0f6b4f);font-weight:600}
.fbk-actions{display:flex;gap:10px;margin-top:12px}
.fbk-actions button{height:36px;padding:0 16px;border-radius:10px;border:1px solid var(--line,#d5dcd8);background:var(--surface,#fff);color:inherit;font:600 15px var(--font-ui,system-ui,sans-serif);cursor:pointer}
.fbk-actions .fbk-send{background:var(--accent,#0f6b4f);border-color:var(--accent,#0f6b4f);color:var(--accent-ink,#fff)}
.fbk-actions button:disabled{opacity:.45;cursor:default}
.fbk-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
.fbk-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.fbk-rate{--fbk-star:#B86E00;width:min(420px,calc(100vw - 32px));box-sizing:border-box;margin:auto;padding:22px 22px 20px;text-align:center;
  border:1px solid var(--line,#d5dcd8);border-radius:20px;background:var(--surface,#fff);color:var(--ink,#16201c);font-family:var(--font-ui,system-ui,sans-serif);
  box-shadow:0 30px 80px -24px rgba(0,0,0,.55),0 0 0 4px var(--accent-soft,rgba(15,107,79,.12));animation:fbk-in .3s ease-out}
.fbk-rate::backdrop{background:rgba(10,18,15,.35);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px)}
:root[data-theme="dark"] .fbk-rate{--fbk-star:#F5B83D}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .fbk-rate{--fbk-star:#F5B83D}}
.fbk-rate .fbk-x{position:absolute;right:14px;top:14px}
.fbk-rate h2{margin:0 34px;font-size:20px;line-height:1.3;letter-spacing:-.01em}
.fbk-rate>p{margin:6px 0 0;font-size:15px;line-height:1.4;color:var(--ink-3,#66746e)}
.fbk-stars{display:flex;justify-content:center;align-items:center;gap:4px;margin:14px 0 0}
.fbk-star{display:flex;align-items:center;justify-content:center;width:50px;height:50px;padding:0;border:0;border-radius:12px;background:none;color:var(--ink-3,#66746e);cursor:pointer}
.fbk-star svg{width:36px;height:36px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linejoin:round;transition:transform .12s}
.fbk-star.on{color:var(--fbk-star)}
.fbk-star.on svg{fill:currentColor}
.fbk-star:hover svg{transform:scale(1.12)}
.fbk-star:focus-visible{outline:2px solid var(--accent,#0f6b4f);outline-offset:-2px}
.fbk-rate .fbk-word{min-height:22px;margin:2px 0 0;font-size:15px;font-weight:600;color:var(--ink-2,#3b4743)}
.fbk-rate textarea{display:block;width:100%;box-sizing:border-box;min-height:78px;margin-top:10px;resize:vertical;padding:9px 11px;border-radius:12px;text-align:left;
  border:1px solid var(--line,#d5dcd8);background:var(--bg,#f6f8f7);color:inherit;font:15px/1.45 var(--font-ui,system-ui,sans-serif)}
.fbk-rate textarea:focus{outline:2px solid var(--accent,#0f6b4f);outline-offset:1px}
.fbk-rate .fbk-status{margin-top:10px;min-height:0}
.fbk-rate .fbk-status:empty{display:none}
.fbk-rate .fbk-actions{justify-content:center;margin-top:14px}
.fbk-rate.fbk-done .fbk-stars,.fbk-rate.fbk-done .fbk-word,.fbk-rate.fbk-done textarea,.fbk-rate.fbk-done .fbk-actions{display:none}
@keyframes fbk-in{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.fbk-rate{animation:none}.fbk-star svg{transition:none}}`;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'fbk-btn'; btn.setAttribute('aria-haspopup', 'dialog');
  btn.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/></svg><span>Feedback</span>';

  const dlg = document.createElement('dialog');
  dlg.className = 'fbk-dlg'; dlg.setAttribute('aria-labelledby', 'fbk-title');
  dlg.innerHTML = `
<div class="fbk-head"><div><h2 id="fbk-title">Send feedback</h2><p>Found a mistake, or have an idea? Tell me.</p></div>
  <button type="button" class="fbk-x" aria-label="Close"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15"/></svg></button></div>
<form class="fbk-form" novalidate>
  <label class="fbk-sr" for="fbk-msg">Your message</label>
  <textarea id="fbk-msg" maxlength="${MAX}" placeholder="Write your message here…"></textarea>
  <input class="fbk-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
  <div class="fbk-meta"><span>Please don’t include personal details.</span><span class="fbk-count">0/${MAX}</span></div>
  <p class="fbk-status" role="status"></p>
  <div class="fbk-actions"><button type="submit" class="fbk-send" disabled>Send</button><button type="button" class="fbk-cancel">Cancel</button></div>
</form>`;

  const form = dlg.querySelector('form'), ta = dlg.querySelector('textarea'), hp = dlg.querySelector('.fbk-hp'),
        count = dlg.querySelector('.fbk-count'), statusEl = dlg.querySelector('.fbk-status'), send = dlg.querySelector('.fbk-send');
  const say = (text, kind) => { statusEl.textContent = text; statusEl.className = 'fbk-status' + (kind ? ' ' + kind : ''); };
  const close = () => { if (dlg.open) dlg.close(); };

  /* Ask the Worker once what it can store ({feedback: true, ratings: true}), so nothing is sent to a
     Worker that would drop it. Only a real answer is remembered; a network error is retried next time. */
  let info = null;
  const ask = () => info ? Promise.resolve(info)
    : fetch(ENDPOINT, {method: 'GET'})
        .then(r => r.ok ? r.json().catch(() => ({})) : ({}))
        .then(j => (info = j || {}))
        .catch(() => ({}));
  const checkSupport = () => ask().then(j => j.feedback === true);
  const supported = () => !!(info && info.feedback === true);
  const here = () => location.pathname + location.hash;

  /* Sends a message or a rating; true once the Worker has accepted it */
  async function post(fields) {
    const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, signal: ctrl.signal,
        body: JSON.stringify(Object.assign({project: PROJECT, event: 'feedback', page: here(), device}, fields))
      });
      const j = await res.json();
      return !!(res.ok && j && j.feedback === true);
    } catch (_) { return false; } finally { clearTimeout(timer); }
  }
  const cooling = () => { let last = 0; try { last = Number(sessionStorage.getItem('_fbk') || 0); } catch (_) {} return Date.now() - last < COOLDOWN_MS; };
  const sent = () => { try { sessionStorage.setItem('_fbk', String(Date.now())); } catch (_) {} };

  btn.addEventListener('click', () => {
    say(''); send.disabled = true;
    dlg.showModal(); ta.focus();
    checkSupport().then(ok => {
      if (!dlg.open) return;
      if (ok) send.disabled = false; else say('Feedback isn’t available right now. Please try again later.', 'err');
    });
  });
  dlg.querySelector('.fbk-x').addEventListener('click', close);
  dlg.querySelector('.fbk-cancel').addEventListener('click', close);
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  ta.addEventListener('input', () => {
    count.textContent = ta.value.length + '/' + MAX;
    if (statusEl.classList.contains('err') && supported()) say('');
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const message = ta.value.trim();
    if (!message){ say('Please write a message first.', 'err'); ta.focus(); return; }
    if (cooling()){ say('Please wait a few seconds before sending another message.', 'err'); return; }
    send.disabled = true; say('Sending…');
    if (await post({message, website: hp.value})) {
      sent();
      ta.value = ''; count.textContent = '0/' + MAX;
      say('Thank you! Your message was sent.', 'ok');
      setTimeout(close, 1600);
    } else {
      say('Sorry, your message could not be sent. Please try again later.', 'err');
      send.disabled = false;
    }
  });

  /* a page can give the button a place of its own (an element with data-fbk-slot, e.g. in its footer);
     otherwise it floats in the bottom-right corner */
  const slot = document.querySelector('[data-fbk-slot]');
  if (slot){ btn.classList.add('fbk-inline'); slot.appendChild(btn); } else document.body.appendChild(btn);
  document.body.appendChild(dlg);

  /* ---------- the rating question (opt-in, see the top of this file) ---------- */
  const RATE_PAGES = Number(script.dataset.ratePages) || 0, RATE_MIN = Number(script.dataset.rateMinutes) || 0;
  if (RATE_PAGES > 0 || RATE_MIN > 0) rateLater();

  function rateLater() {
    const KEY = 'fbk-rate:' + PROJECT, VISIT = 'fbk-visit:' + PROJECT;
    const GAP = 30 * 60000, LATER = 30 * 86400000, TICK = 5000;
    const WAIT = script.dataset.rateWait || '', NAME = script.dataset.rateName || 'this site';
    const load = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } };
    const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (_) { return false; } };
    const answered = () => { const s = load(KEY); return !!(s && (s.rated || (s.later && Date.now() - s.later < LATER))); };
    /* without storage the card couldn't remember that it was shown and would come back on every page: don't ask */
    if (!save('fbk-test', 1)) return;
    try { localStorage.removeItem('fbk-test'); } catch (_) {}
    if (answered()) return;

    /* this visit so far, shared by the site's open tabs: pages opened and time with the site on screen */
    const visit = () => { const v = load(VISIT); return v && Date.now() - v.last < GAP ? v : {pages: 0, ms: 0, last: Date.now()}; };
    const update = f => { const v = visit(); f(v); v.last = Date.now(); save(VISIT, v); check(v); };

    /* a page counts once its address has stayed for a moment, so an address tidied up on load is one page (as in analytics.js) */
    let counted = null, pageT = 0;
    const route = () => { clearTimeout(pageT); pageT = setTimeout(() => { if (here() !== counted){ counted = here(); update(v => { v.pages++; }); } }, 600); };
    ['pushState', 'replaceState'].forEach(m => { const orig = history[m]; history[m] = function () { const r = orig.apply(this, arguments); route(); return r; }; });
    addEventListener('popstate', route);
    addEventListener('hashchange', route);
    route();

    let tickAt = Date.now();
    setInterval(() => {
      const now = Date.now(), d = now - tickAt; tickAt = now;
      if (document.visibilityState === 'visible' && d < TICK * 3) update(v => { v.ms += d; });
    }, TICK);
    document.addEventListener('visibilitychange', () => { tickAt = Date.now(); });

    let armed = false;
    function check(v) {
      if (armed) return;
      const byPages = RATE_PAGES > 0 && v.pages > RATE_PAGES, byTime = RATE_MIN > 0 && v.ms > RATE_MIN * 60000;
      if (!byPages && !byTime) return;
      armed = true;
      setTimeout(() => show(byPages ? v.pages + ' pages' : Math.floor(v.ms / 60000) + ' minutes'), 2500);
    }

    const track = what => { if (window.trackEvent) window.trackEvent('rating_prompt', what); };
    const waiting = () => { if (!WAIT) return false; try { return !!document.querySelector(WAIT); } catch (_) { return false; } };
    /* never over a tour, an animation, an open dialog or a full-screen view: try again a little later */
    const busy = () => document.visibilityState !== 'visible' || !!document.fullscreenElement || !!document.querySelector('dialog[open]') || waiting();
    function show(asked) {
      if (answered()) return;
      if (busy()){ setTimeout(() => show(asked), 2000); return; }
      ask().then(j => {
        if (j.ratings !== true || answered()) return;       /* this Worker can't store ratings yet: don't ask */
        if (busy()) setTimeout(() => show(asked), 2000); else open(asked);
      });
    }

    function open(asked) {
      save(KEY, {later: Date.now()});      /* asked: not again for 30 days, and never once a rating is sent */
      track('shown after ' + asked);
      const WORDS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
      const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9Z"/></svg>';
      const name = NAME.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      /* a modal dialog in the middle of the screen; everything behind it is dimmed and blurred (::backdrop) */
      const card = document.createElement('dialog');
      card.className = 'fbk-rate'; card.setAttribute('aria-labelledby', 'fbk-rate-t');
      card.innerHTML = `
<button type="button" class="fbk-x" aria-label="Close the rating question"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15"/></svg></button>
<h2 id="fbk-rate-t">How would you rate ${name}?</h2>
<p>A quick rating helps me make it better.</p>
<div class="fbk-stars" role="group" aria-label="Your rating, from 1 to 5 stars">${WORDS.map((w, i) =>
  `<button type="button" class="fbk-star" aria-pressed="false" aria-label="${i + 1} star${i ? 's' : ''}: ${w}">${STAR}</button>`).join('')}</div>
<p class="fbk-word" aria-hidden="true"></p>
<form novalidate>
  <label class="fbk-sr" for="fbk-rate-msg">Anything to add? (optional)</label>
  <textarea id="fbk-rate-msg" maxlength="${MAX}" placeholder="What did you like, or what would make it better? (optional)" hidden></textarea>
  <input class="fbk-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
  <p class="fbk-status" role="status"></p>
  <div class="fbk-actions"><button type="submit" class="fbk-send" disabled>Send rating</button><button type="button" class="fbk-later">Not now</button></div>
</form>`;
      const stars = [...card.querySelectorAll('.fbk-star')], word = card.querySelector('.fbk-word'), note = card.querySelector('textarea'),
            trap = card.querySelector('.fbk-hp'), status = card.querySelector('.fbk-status'), go = card.querySelector('.fbk-send');
      const tell = (text, kind) => { status.textContent = text; status.className = 'fbk-status' + (kind ? ' ' + kind : ''); };
      let value = 0;
      const paint = n => { stars.forEach((s, i) => s.classList.toggle('on', i < n)); word.textContent = n ? WORDS[n - 1] : ''; };
      stars.forEach((s, i) => {
        s.addEventListener('click', () => {
          value = i + 1; paint(value); go.disabled = false; note.hidden = false;
          stars.forEach((t, k) => t.setAttribute('aria-pressed', String(k === i)));
          if (status.classList.contains('err')) tell('');
        });
        s.addEventListener('pointerenter', () => paint(i + 1));
        s.addEventListener('pointerleave', () => paint(value));
      });
      const close = how => { if (how) track(how); if (card.open) card.close(); card.remove(); };
      card.querySelector('.fbk-x').addEventListener('click', () => close('closed'));
      card.querySelector('.fbk-later').addEventListener('click', () => close('not now'));
      card.addEventListener('cancel', e => { e.preventDefault(); close('closed'); });          /* Escape */
      card.addEventListener('keydown', e => { if (e.key === 'Escape') e.stopPropagation(); });   /* not the page's own Escape (going up a level) */
      card.addEventListener('click', e => {                                                       /* a click outside the card, on the blurred page */
        const r = card.getBoundingClientRect();
        if (e.target === card && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) close('closed');
      });
      card.querySelector('form').addEventListener('submit', async e => {
        e.preventDefault();
        if (!value) return;
        if (cooling()){ tell('Please wait a few seconds, then try again.', 'err'); return; }
        go.disabled = true; tell('Sending…');
        if (await post({rating: value, message: note.value.trim(), asked, website: trap.value})) {
          sent(); save(KEY, {rated: Date.now()}); track('sent ' + value);
          card.classList.add('fbk-done'); tell('Thank you! Your rating was sent.', 'ok');
          setTimeout(() => close(), 2400);
        } else {
          tell('Sorry, your rating could not be sent. Please try again later.', 'err');
          go.disabled = false;
        }
      });
      document.body.appendChild(card);
      card.showModal();
      stars[0].focus({preventScroll: true});
    }
  }
})();
