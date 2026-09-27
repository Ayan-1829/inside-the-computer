/* Shared analytics tracker -- copy this exact file, unchanged, into every
   project. Project identity comes from the <script> tag's data-project
   attribute, so adding a new project never means editing this file.
   No secret lives here -- the Cloudflare Worker at data-endpoint holds
   that server-side.

   Cookieless: nothing is stored on the visitor's device. The Worker works
   out an anonymous visitor ID (a hash that changes every day) and the
   approximate location from the network; this file only reports which
   pages were seen and for how long.

   Events:
     page_view       sent when a page is left (another page opened, tab
                     hidden, page closed): seconds on screen, and seconds
                     active (some input in the last 2 minutes)
     outbound_click  a link to another site was followed
     custom          sent by the site itself for something worth counting:
                       window.trackEvent('course_view', 'CSE-203 Digital Logic Design')
                     (a short name, and an optional detail). It isn't defined
                     when tracking is off, so call it through a check:
                       if (window.trackEvent) trackEvent('art_profile_view');
   Pages opened inside the site without a reload (history.pushState or a
   #/hash change) count as pages of their own. Nothing is sent when the
   browser asks for no tracking (Global Privacy Control or Do Not Track). */
(function () {
  const script = document.currentScript;
  const ENDPOINT = script && script.dataset.endpoint;
  const PROJECT = script && script.dataset.project;
  if (!ENDPOINT || !PROJECT) return;
  if (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1') return;

  const IDLE_MS = 120000;       /* no input for this long: the visitor has stopped using the page */
  const MIN_MS = 500;           /* shorter views (an address fixed up during start-up) are not reported */
  const device = /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
  /* groups the pages of this one page load; kept in memory only, never stored */
  const visit = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  let seq = 0, entryPending = true;
  const context = collectContext();

  function send(event, extra) {
    const body = JSON.stringify(Object.assign({ project: PROJECT, event, visit, device }, extra));
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }))) return;
    } catch (_) {}
    try { fetch(ENDPOINT, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }); } catch (_) {}
  }

  /* Sent once, with the first page view of the load */
  function collectContext() {
    const q = new URLSearchParams(location.search), c = { referrer: document.referrer.slice(0, 300) };
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(k => { if (q.get(k)) c[k] = q.get(k).slice(0, 100); });
    try { c.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (_) {}
    c.lang = navigator.language || '';
    c.screen = screen.width + 'x' + screen.height;
    c.viewport = innerWidth + 'x' + innerHeight;
    c.theme = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    c.input = matchMedia('(pointer: coarse)').matches ? 'touch' : 'mouse';
    return c;
  }
  function loadMs() {
    const n = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (!n) return undefined;
    const t = n.loadEventEnd > 0 ? n.loadEventEnd : n.domContentLoadedEventEnd;
    return t > 0 ? Math.round(t) : undefined;
  }

  const pageKey = () => location.pathname + location.hash;

  /* The page being viewed right now; null while the tab is hidden */
  let cur = null;
  function open() {
    if (document.visibilityState === 'hidden') return;
    const now = Date.now();
    cur = { page: pageKey(), title: document.title, start: now, last: now, active: 0 };
    const view = cur;   /* the site sets the new page's title just after the address changes */
    setTimeout(() => { if (cur === view && view.page === pageKey()) view.title = document.title; }, 300);
  }
  function close() {
    if (!cur) return;
    const view = cur, now = Date.now(); cur = null;
    view.active += Math.min(now - view.last, IDLE_MS);
    const ms = now - view.start;
    if (ms < MIN_MS) return;              /* too short to count; the entry flag moves on to the next page */
    const extra = {
      page: view.page.slice(0, 300), title: view.title.slice(0, 150),
      duration: Math.round(ms / 1000), active: Math.round(view.active / 1000),
      seq: ++seq, entry: entryPending
    };
    if (entryPending) { Object.assign(extra, context, { loadMs: loadMs() }); entryPending = false; }
    send('page_view', extra);
  }
  function onInput() {
    if (!cur) return;
    const now = Date.now();
    cur.active += Math.min(now - cur.last, IDLE_MS);
    cur.last = now;
  }
  function onRoute() {
    if (cur && cur.page === pageKey()) return;
    close(); open();
  }

  ['pushState', 'replaceState'].forEach(m => {
    const orig = history[m];
    history[m] = function () { const r = orig.apply(this, arguments); onRoute(); return r; };
  });
  addEventListener('popstate', onRoute);
  addEventListener('hashchange', onRoute);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') close(); else if (!cur) open();
  });
  addEventListener('pagehide', close);
  addEventListener('pageshow', e => { if (e.persisted && !cur) open(); });

  ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(t => addEventListener(t, onInput, { passive: true, capture: true }));

  /* Links that leave the site (for example the "Learn more" videos and articles) */
  /* Events the site reports itself (see "custom" above) */
  window.trackEvent = function (name, detail) {
    if (!name) return;
    send('custom', { page: pageKey().slice(0, 300), name: String(name).slice(0, 60), detail: detail == null ? '' : String(detail).slice(0, 200) });
  };

  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    let url; try { url = new URL(a.href, location.href); } catch (_) { return; }
    if (!/^https?:$/.test(url.protocol) || url.origin === location.origin) return;
    send('outbound_click', { page: pageKey().slice(0, 300), link: url.href.slice(0, 300), linkText: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120) });
  }, true);

  open();
})();
