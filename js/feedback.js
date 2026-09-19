/* Shared feedback box -- copy this exact file, unchanged, into every project.
   Adds a small "Feedback" button at the bottom right that opens a message box.
   The message goes to the same Cloudflare Worker as analytics.js (data-endpoint),
   which holds the real secret and stores it in the Google Sheet; nothing secret
   lives in this file. Project identity comes from the <script> tag's data-project. */
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
@keyframes fbk-pulse{0%{box-shadow:0 0 0 4px var(--accent-soft,rgba(15,107,79,.12)),0 0 0 0 var(--accent-glow,rgba(15,107,79,.4))}100%{box-shadow:0 0 0 4px var(--accent-soft,rgba(15,107,79,.12)),0 0 0 18px rgba(0,0,0,0)}}
@media (prefers-reduced-motion:reduce){.fbk-btn{animation:none}}
@media (max-width:980px){.fbk-btn{bottom:14px;height:46px;padding:0 22px;font-size:16px}.fbk-btn svg{width:21px;height:21px}}
.fbk-dlg{width:min(440px,calc(100vw - 32px));padding:0;border:1px solid var(--line,#d5dcd8);border-radius:20px;background:var(--surface,#fff);color:var(--ink,#16201c);
  box-shadow:0 30px 80px -30px rgba(0,0,0,.5);font-family:var(--font-ui,system-ui,sans-serif)}
.fbk-dlg::backdrop{background:rgba(10,18,15,.45);backdrop-filter:blur(2px)}
.fbk-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:18px 22px 4px}
.fbk-head h2{margin:0;font-size:21px;letter-spacing:-.02em}
.fbk-head p{margin:3px 0 0;font-size:14.5px;line-height:1.4;color:var(--ink-3,#66746e)}
.fbk-x{flex:none;width:34px;height:34px;border-radius:10px;border:1px solid var(--line,#d5dcd8);background:var(--surface,#fff);color:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center}
.fbk-x:hover,.fbk-x:focus-visible{border-color:var(--accent,#0f6b4f)}
.fbk-x svg{width:16px;height:16px}
.fbk-form{padding:12px 22px 20px}
.fbk-form textarea{display:block;width:100%;box-sizing:border-box;min-height:120px;resize:vertical;padding:11px 13px;border-radius:12px;border:1px solid var(--line,#d5dcd8);
  background:var(--bg,#f6f8f7);color:inherit;font:15px/1.45 var(--font-ui,system-ui,sans-serif)}
.fbk-form textarea:focus{outline:2px solid var(--accent,#0f6b4f);outline-offset:1px}
.fbk-meta{display:flex;justify-content:space-between;gap:12px;margin:6px 2px 0;font-size:12.5px;color:var(--ink-3,#66746e)}
.fbk-status{margin:10px 0 0;min-height:1.4em;font-size:14px;line-height:1.4;color:var(--ink-2,#3b4743)}
.fbk-status.err{color:#b3261e}.fbk-status.ok{color:var(--accent,#0f6b4f);font-weight:600}
.fbk-actions{display:flex;gap:10px;margin-top:12px}
.fbk-actions button{height:36px;padding:0 16px;border-radius:10px;border:1px solid var(--line,#d5dcd8);background:var(--surface,#fff);color:inherit;font:600 15px var(--font-ui,system-ui,sans-serif);cursor:pointer}
.fbk-actions .fbk-send{background:var(--accent,#0f6b4f);border-color:var(--accent,#0f6b4f);color:var(--accent-ink,#fff)}
.fbk-actions button:disabled{opacity:.45;cursor:default}
.fbk-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
.fbk-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}`;
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

  /* Ask the Worker once whether it can store feedback, so a message is never sent to a
     Worker that would drop it. Only a real answer is remembered; a network error is retried next time. */
  let supported = null;
  const checkSupport = () => supported !== null ? Promise.resolve(supported)
    : fetch(ENDPOINT, {method: 'GET'})
        .then(r => r.ok ? r.json().catch(() => null) : null)
        .then(j => (supported = !!(j && j.feedback === true)))
        .catch(() => false);

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
    if (statusEl.classList.contains('err') && supported) say('');
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const message = ta.value.trim();
    if (!message){ say('Please write a message first.', 'err'); ta.focus(); return; }
    let last = 0; try { last = Number(sessionStorage.getItem('_fbk') || 0); } catch (_) {}
    if (Date.now() - last < COOLDOWN_MS){ say('Please wait a few seconds before sending another message.', 'err'); return; }
    send.disabled = true; say('Sending…');
    const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, signal: ctrl.signal,
        body: JSON.stringify({project: PROJECT, event: 'feedback', message, page: location.pathname, device, website: hp.value})
      });
      const j = await res.json();
      if (!res.ok || !j || j.feedback !== true) throw new Error('not stored');
      try { sessionStorage.setItem('_fbk', String(Date.now())); } catch (_) {}
      ta.value = ''; count.textContent = '0/' + MAX;
      say('Thank you! Your message was sent.', 'ok');
      setTimeout(close, 1600);
    } catch (_) {
      say('Sorry, your message could not be sent. Please try again later.', 'err');
      send.disabled = false;
    } finally { clearTimeout(timer); }
  });

  document.body.appendChild(btn);
  document.body.appendChild(dlg);
})();
