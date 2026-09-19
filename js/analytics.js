/* Shared analytics tracker -- copy this exact file, unchanged, into every
   project. Project identity comes from the <script> tag's data-project
   attribute, so adding a new project never means editing this file.
   No secret lives here -- the Cloudflare Worker at data-endpoint holds
   that server-side. */
(function () {
  const script = document.currentScript;
  const ENDPOINT = script.dataset.endpoint;
  const PROJECT = script.dataset.project;
  if (!ENDPOINT || !PROJECT) return;

  const sessionId = sessionStorage.getItem('_aid') || (() => {
    const id = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    sessionStorage.setItem('_aid', id);
    return id;
  })();

  const device = /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
  const startTime = Date.now();
  let sent = false;

  function send(event, extra) {
    const payload = JSON.stringify(Object.assign({
      project: PROJECT, sessionId, event,
      page: location.pathname, device, referrer: document.referrer
    }, extra));
    navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: 'text/plain' }));
  }

  send('visit_start');

  function sendDuration() {
    if (sent) return;
    sent = true;
    send('visit_end', { duration: Math.round((Date.now() - startTime) / 1000) });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sendDuration();
  });
  addEventListener('pagehide', sendDuration);
})();
