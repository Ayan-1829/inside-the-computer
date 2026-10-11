/* ==========================================================
   panel.js
   Builds the HTML for the info panel, breadcrumb, level indicator
   and overview tree. Pure functions (no DOM), so build/build.mjs
   can use exactly the same code to pre-render every page.
   `href(id)` must return the URL for a part.
   ========================================================== */
var ACCURACY = 'Modern CPUs do not contain 74xx chips. Their gates are transistors only a few nanometres wide, etched directly into the silicon die, with billions on one chip. A 74-series chip shows the same logic at a size you can hold and wire up yourself.';
var SITE_NAME = 'Inside the Computer';

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function plain(s){ return String(s).replace(/<[^>]+>/g,''); }
function link(href, id, cls, inner){ return '<a class="' + cls + '" href="' + href(id) + '" data-go="' + id + '">' + inner + '</a>'; }
/* Small Back / Pause-Play / Step buttons for the power-on walkthrough (run = also the "Power on" button). */
function pwControls(run){
  var svg = function(inner, cls){ return '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + '>' + inner + '</svg>'; };
  var ic = function(act, label, inner, dis){ return '<button type="button" class="pw-btn pw-ic" data-pw="' + act + '" aria-label="' + label + '" title="' + label + '"' + (dis ? ' disabled' : '') + '>' + inner + '</button>'; };
  return '<div class="pw-ctrl">' + (run ? '<button type="button" class="pw-btn pw-run" data-pw="run">Power on</button>' : '') +
    ic('back', 'Previous step', svg('<rect x="3" y="3" width="2" height="10"/><path d="M13 3 6 8l7 5z"/>'), true) +
    ic('pause', 'Pause', svg('<rect x="4" y="3" width="3" height="10"/><rect x="9" y="3" width="3" height="10"/>', 'i-pause') + svg('<path d="M5 3l8 5-8 5z"/>', 'i-play'), true) +
    ic('step', 'Next step', svg('<path d="M3 3l7 5-7 5z"/><rect x="11" y="3" width="2" height="10"/>')) +
    '<button type="button" class="pw-btn pw-ic sfx-btn" data-sfx="toggle" aria-label="Sound on or off" title="Sound on or off"></button></div>';   /* icon filled in by sfx.js */
}
/* what the two dot colours mean in the power-on walkthrough */
function pwKey(){ return '<div class="pw-key"><i class="k-pow"></i>Power<i class="k-sig"></i>Signals and data</div>'; }
function sec(t, h){ return h ? '<section class="p-sec"><h3>' + t + '</h3>' + h + '</section>' : ''; }
/* "Learn more": a video and/or an article that explains this part (data/learn.js).
   Each entry is ['v', title, channel, YouTube id, length] or ['w', Wikipedia article title].
   Nothing is shown for a part that has none. Links open in a new tab. */
function escapeHtml(t){ return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
var PLAY_ICON = '<svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M7 4.5v11l9-5.5z"/></svg>';
var PAGE_ICON = '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 2.5h7l3 3v12H5z"/><path d="M12 2.5v3h3M7.5 9h5M7.5 12h5M7.5 15h3"/></svg>';
var OPEN_ICON = '<svg class="lk-go" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3M11 4h5v5M16 4l-7 7"/></svg>';
/* the video's thumbnail (YouTube's image server, loaded lazily) with a small play badge */
function thumb(id){
  return '<span class="lk-thumb" aria-hidden="true"><img src="https://i.ytimg.com/vi/' + id + '/mqdefault.jpg" alt="" loading="lazy" width="120" height="68">' +
    '<span class="lk-thumb-play">' + PLAY_ICON + '</span></span>';
}
/* Videos whose owners don't allow them to be played on other websites (YouTube's embed check
   answers 401): these stay ordinary links that open YouTube. Checked for every video on 2026-09-28. */
var NO_EMBED = {'bwRe7JxuNHw': 1};
function learnItems(id){
  var L = typeof LEARN !== 'undefined' && LEARN[id];
  if (!L || !L.length) return '';
  return L.map(function(l){
    var isVideo = l[0] === 'v';
    /* a video plays in a window on this page (engine.js); the link still works without JavaScript */
    if (isVideo && !NO_EMBED[l[3]]){
      return '<li><a class="lk lk-v" href="https://www.youtube.com/watch?v=' + l[3] + '" target="_blank" rel="noopener noreferrer" data-yt="' + l[3] + '"' +
        ' data-yt-title="' + escapeHtml(l[1]) + '" data-yt-by="' + escapeHtml(l[2]) + '">' +
        thumb(l[3]) +
        '<span class="lk-t">' + escapeHtml(l[1]) + '<em>Video · ' + escapeHtml(l[2]) + (l[4] ? ' · ' + l[4] : '') + '</em></span>' +
        '<span class="sr-only"> (plays in a window on this page)</span></a></li>';
    }
    var url = isVideo ? 'https://www.youtube.com/watch?v=' + l[3]
      : 'https://en.wikipedia.org/wiki/' + encodeURIComponent(l[1].replace(/ /g, '_')).replace(/%28/g, '(').replace(/%29/g, ')');
    var title = isVideo ? l[1] : l[1];
    var meta = isVideo ? 'Video on YouTube · ' + escapeHtml(l[2]) + (l[4] ? ' · ' + l[4] : '') : 'Article on Wikipedia';
    return '<li><a class="lk ' + (isVideo ? 'lk-v' : 'lk-w') + '" href="' + url + '" target="_blank" rel="noopener noreferrer">' +
      (isVideo ? thumb(l[3]) : '<span class="lk-ic" aria-hidden="true">' + PAGE_ICON + '</span>') +
      '<span class="lk-t">' + escapeHtml(title) + '<em>' + meta + '</em></span>' + OPEN_ICON +
      '<span class="sr-only"> (opens in a new tab)</span></a></li>';
  }).join('');
}
function learnHTML(id){
  var items = learnItems(id);
  return items ? sec('Learn more', '<ul class="learn">' + items + '</ul><p class="note learn-note">Videos play here, from YouTube; articles open Wikipedia in a new tab.</p>') : '';
}

function metaTitle(id){
  var n = N[id];
  return id === 'computer' ? 'Inside the Computer: Interactive Explorer from PC Parts to Logic Gates'
    : n.name + ': ' + plain(n.short).replace(/\.$/,'') + ' | ' + SITE_NAME;
}
function metaDesc(id){
  var n = N[id];
  if (id === 'computer') return 'Explore a computer layer by layer. Zoom from the case into the CPU, ALU, adders and logic gates, down to real 74xx logic chips, with truth tables and real hardware examples.';
  var s = plain(n.short + ' ' + n.what);
  return s.length > 158 ? s.slice(0,157).replace(/\s+\S*$/,'') + '…' : s;
}

var DATASHEET = 'Pin diagrams follow the classic manufacturer datasheets, and the inside views are simplified block diagrams. Always check the datasheet for your exact part before wiring a circuit.';
function miniDip(pins, to220){
  if (to220) return '<svg viewBox="0 0 92 52" aria-hidden="true"><rect x="30" y="2" width="32" height="12" rx="2" fill="var(--i-metal)"/><rect x="28" y="10" width="36" height="24" rx="3" fill="var(--i-chip)"/>' +
    [36,46,56].map(function(x){ return '<rect x="'+(x-2)+'" y="34" width="4" height="16" rx="1" fill="var(--i-metal)"/>'; }).join('') + '</svg>';
  var per = pins/2, pitch = 80/per, pw = Math.min(5, pitch - 1.2), s = '';
  for (var i=0;i<per;i++){ var x = 6+pitch*(i+.5)-pw/2; s += '<rect x="'+x+'" y="4" width="'+pw+'" height="8" rx="1" fill="var(--i-metal)"/><rect x="'+x+'" y="40" width="'+pw+'" height="8" rx="1" fill="var(--i-metal)"/>'; }
  return '<svg viewBox="0 0 92 52" aria-hidden="true">' + s + '<rect x="6" y="11" width="80" height="30" rx="4" fill="var(--i-chip)"/><path d="M6 20a6 6 0 0 1 0 12Z" fill="var(--i-chip-edge)"/></svg>';
}
function icCard(id, href){
  var c = CHIPS[id], pins = c.labels.length, pkg = c.pkg || ('DIP-' + pins);
  return link(href, id, 'ic-card', miniDip(pins, c.to220) + '<div><b>' + c.part + '</b><span>' + c.desc + (c.gate && c.gate !== 'NOT' ? ' gates' : '') + ' · ' + pkg + '</span><em>' + (c.inside ? 'Pinout and inside view' : 'View the pinout') + '</em></div>');
}
function truthTable(n){
  var g = n.gate, one = g === 'NOT', rows = one ? [[0],[1]] : [[0,0],[0,1],[1,0],[1,1]];
  return '<table class="tt"><thead><tr>' + (one ? '<th>A</th>' : '<th>A</th><th>B</th>') + '<th class="out">Y</th></tr></thead><tbody>' +
    rows.map(function(r){ var y = one ? GFN.NOT(r[0]) : GFN[g](r[0], r[1]);
      return '<tr data-row="' + r.join('') + '">' + r.map(function(v){ return '<td>' + v + '</td>'; }).join('') + '<td class="out' + (y ? ' one' : '') + '">' + y + '</td></tr>'; }).join('') +
    '</tbody></table>';
}
function adderTable(){
  var rows = '';
  for (var i=0;i<8;i++){ var a=i>>2&1, b=i>>1&1, c=i&1, t=a+b+c;
    rows += '<tr data-row="'+a+b+c+'"><td>'+a+'</td><td>'+b+'</td><td>'+c+'</td><td class="out'+(t&1?' one':'')+'">'+(t&1)+'</td><td class="'+(t>>1?'one':'')+'">'+(t>>1)+'</td></tr>'; }
  return '<table class="tt"><thead><tr><th>A</th><th>B</th><th>C<sub>in</sub></th><th class="out">Sum</th><th>C<sub>out</sub></th></tr></thead><tbody>' + rows + '</tbody></table>';
}

/* Most levels share one name (LEVELS[n.level]), but a node can set its own
   levelLabel where that generic name would be misleading -- e.g. an SSD or
   hard drive's internal parts aren't "Digital logic" the way a logic gate
   or adder is, even though they sit at the same depth in the tree. */
function levelName(n){ return n.levelLabel || LEVELS[n.level]; }
function detailsHeadHTML(n){
  return '<div class="dp-head"><p class="dp-lvl">Level ' + n.level + ': ' + levelName(n) + '</p>' +
    '<h4 class="dp-title">' + n.name + '</h4></div>';
}
function detailsHTML(n){
  return detailsHeadHTML(n) +
    '<div class="dp-scroll">' + photoStrip(n) + '<p class="dp-short">' + n.short + '</p>' +
    '<div class="dp-body"><p>' + n.does + '</p></div>' +
    '<p class="dp-hint">' + (n.scene ? icon('zoom') + '<b>Click to go inside</b>' : '<b>Click for the full details</b>') + '<span>Right-click for more options</span></p></div>';
}
function detailsFullHTML(n){
  var h = '<p>' + n.what + '</p><p>' + n.does + '</p><p>' + n.why + '</p>';
  if (n.specs.length) h += '<dl class="dp-specs">' + n.specs.map(function(s){ return '<dt>' + s[0] + '</dt><dd>' + s[1] + '</dd>'; }).join('') + '</dl>';
  if (n.fact) h += '<p class="dp-fact"><b>Fun fact.</b> ' + n.fact + '</p>';
  var learn = learnItems(n.id);
  if (learn) h += '<p class="dp-learn-h"><b>Learn more</b></p><ul class="learn">' + learn + '</ul>';
  return h;
}
function detailsExamplesHTML(n){
  if (!n.ex.length) return '<p class="dp-empty">No real-life examples listed.</p>';
  return '<ul class="ex">' + n.ex.map(function(e){ return '<li><b>' + e[0] + '</b><span>' + e[1] + '</span></li>'; }).join('') + '</ul>';
}
/* The right-click action card: concise text plus buttons that reveal one
   section at a time in the empty .dp-section below them. */
function actionCardHTML(n){
  var h = detailsHeadHTML(n) +
    '<div class="dp-scroll">' + photoStrip(n) + '<p class="dp-short">' + n.short + '</p>' +
    '<div class="dp-actions"><button type="button" class="dp-act" data-act="full">Details</button>';
  /* "Inside" only makes sense when going there actually shows something new:
     a part with its own dedicated diagram (n.scene) -- including every real
     IC chip, which all have scene:'ic'. A part whose only "child" is a real
     chip it happens to be built from (e.g. Clock -> the NE555) has no
     diagram of its own, so the button would just re-focus the same box you
     already clicked -- not worth offering. */
  if (n.scene) h += '<button type="button" class="dp-act" data-act="inside">Inside</button>';
  if (n.ex.length) h += '<button type="button" class="dp-act" data-act="examples">Examples</button>';
  if (n.id === 'webcam') h += '<button type="button" class="dp-act" data-act="try">Try camera</button>';
  else if (n.id === 'mic') h += '<button type="button" class="dp-act" data-act="try">Try mic</button>';
  else if (n.id === 'power-button') h += '<button type="button" class="dp-act" data-act="try">Power on</button>';
  h += '</div><div class="dp-section"></div></div>';
  return h;
}
/* Small line icons for the levels (and for the way down in the welcome card), drawn on a 24-unit grid
   in the current text colour. Also used by js/guide.js for the depth gauge and the zoom badges. */
var ICON = {
  computer: '<rect x="2.5" y="4" width="13" height="10" rx="1.5"/><path d="M6.5 18h5M9 14v4"/><rect x="17.5" y="4" width="4" height="15" rx="1"/><path d="M19.5 7.5v.01"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5" rx=".6"/><path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3"/>',
  blocks: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
  alu: '<path d="M2.5 5h7.5l2 3.2L14 5h7.5l-5.2 14H7.7Z"/>',
  gate: '<path d="M7 5h5a7 7 0 0 1 0 14H7Z"/><path d="M2 9h5M2 15h5M19 12h3"/>',
  dip: '<rect x="7" y="3" width="10" height="18" rx="1.5"/><path d="M4 6.5h3M4 10h3M4 14h3M4 17.5h3M17 6.5h3M17 10h3M17 14h3M17 17.5h3"/><circle cx="12" cy="6" r=".9"/>',
  zoom: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M7.5 10.5h6M10.5 7.5v6"/>',
  camera: '<path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.3l1.4-2h7.6l1.4 2h2.3A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5Z"/><circle cx="12" cy="12.5" r="3.6"/>',
};
var LEVEL_ICON = {1:'computer', 2:'chip', 3:'blocks', 4:'gate', 5:'dip'};
function icon(name, cls){ return '<svg class="' + (cls || 'ico') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[name] + '</svg>'; }

/* Real photos (data/photos.js). In the browser engine.js sets PHOTO_BASE; the build passes
   page-relative links, so the base is taken from the link to the home page. */
function photoBase(href){ return href ? href('computer').replace(/index\.html$/, '') + 'img/photos/' : (typeof PHOTO_BASE !== 'undefined' ? PHOTO_BASE : 'img/photos/'); }
function photosFor(id){ return typeof PHOTOS !== 'undefined' && PHOTOS[id] ? PHOTOS[id] : null; }
function photoCredit(p){
  return 'Photo: ' + esc(p[4]) + ', ' + (p[6] ? '<a href="' + p[6] + '" target="_blank" rel="noopener">' + p[5] + '</a>' : p[5]) +
    ', <a href="' + p[7] + '" target="_blank" rel="noopener">Wikimedia Commons</a>';
}
function photosHTML(id, href){
  var ps = photosFor(id); if (!ps) return '';
  var base = photoBase(href), p = ps[0];
  return '<figure class="ph"><button type="button" class="ph-main" data-photo="' + id + '" data-i="0" aria-label="See the real photos of the ' + esc(N[id].name) + '">' +
      '<img src="' + base + p[0] + '" width="' + p[1] + '" height="' + p[2] + '" alt="' + esc(p[3]) + '" loading="lazy" decoding="async">' +
      '<span class="ph-tag">' + icon('camera') + 'Real photo' + (ps.length > 1 ? 's · ' + ps.length : '') + '</span></button>' +
    (ps.length > 1 ? '<div class="ph-row">' + ps.slice(1).map(function(q, i){
      return '<button type="button" class="ph-th" data-photo="' + id + '" data-i="' + (i + 1) + '" aria-label="Photo ' + (i + 2) + ': ' + esc(q[3]) + '"><img src="' + base + q[0] + '" alt="" loading="lazy" decoding="async"></button>'; }).join('') + '</div>' : '') +
    '<figcaption>' + p[3] + '<span class="ph-by">' + photoCredit(p) + '</span></figcaption></figure>';
}
function photoStrip(n){
  var ps = photosFor(n.id); if (!ps) return '';
  return '<button type="button" class="dp-photo" data-photo="' + n.id + '" data-i="0" aria-label="See the real photos"><img src="' + photoBase() + ps[0][0] + '" alt="" decoding="async"><span>' + icon('camera') + 'Real photo</span></button>';
}

/* The home page's "start here" card: what the site is, what to do, and the way down
   from the whole computer to one real chip. Its buttons are run by js/guide.js. */
var JOURNEY = ['computer', 'cpu', 'alu', 'logic-unit', 'and-gate', 'ic-7408'];
var JOURNEY_ICON = {computer:'computer', cpu:'chip', alu:'alu', 'logic-unit':'blocks', 'and-gate':'gate', 'ic-7408':'dip'};
function welcomeHTML(href){
  var chips = ORDER.filter(function(c){ return N[c].ic; }).length;
  var steps = JOURNEY.filter(function(c){ return N[c]; }).map(function(c, i){
    return '<li style="--c:var(--lv-' + N[c].level + ')">' + link(href, c, 'wl-step' + (i ? '' : ' here'),
      '<i>' + icon(JOURNEY_ICON[c]) + '</i><b>' + N[c].name + '</b><small>' + (i ? 'Level ' + N[c].level : 'You are here') + '</small>') + '</li>'; }).join('');
  return '<section class="welcome" aria-label="Start here">' +
    '<p class="wl-eyebrow">Interactive · free · no sign-up</p>' +
    '<p class="wl-title">Open up a real computer and zoom inside, all the way down to a single chip</p>' +
    '<p class="wl-sub"><b>Every part in the picture is clickable.</b> Click one to go inside it, then keep going: ' +
    '5 levels deep, ' + ORDER.length + ' parts, ' + chips + ' real chips and a working Intel 8086.</p>' +
    '<div class="wl-acts">' +
      '<button type="button" class="btn btn-p wl-go" data-guide="tour"><svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6 4.2v11.6a.6.6 0 0 0 .9.5l9-5.8a.6.6 0 0 0 0-1L6.9 3.7a.6.6 0 0 0-.9.5Z"/></svg>Take the 30-second tour</button>' +
      '<button type="button" class="btn" data-guide="power"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M10 2.8v6.4M6 5.3a6.2 6.2 0 1 0 8 0"/></svg>Watch it boot</button>' +
      link(href, 'i8086', 'btn', '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="5" width="10" height="10" rx="1.5"/><path d="M8 2.5V5M12 2.5V5M8 15v2.5M12 15v2.5M2.5 8H5M2.5 12H5M15 8h2.5M15 12h2.5"/></svg>Run real 8086 code') +
    '</div>' +
    '<p class="wl-path-h">The way down: each click zooms one level deeper</p><ol class="wl-path">' + steps + '</ol>' +
  '</section>';
}
/* "Go inside": the parts you can click in this part's own picture, near the top of the panel */
function goInsideHTML(n, href){
  if (!n.scene || n.id === 'computer') return '';
  var kids = n.children.filter(function(c){ return !N[c].ic; });
  if (!kids.length) return '';
  var more = kids.length - 4;
  return '<div class="go-in"><p><b>' + (n.scene === 'ic' ? 'Look closer:' : 'Go deeper:') + '</b> click a part in the picture, or start with</p><div class="chips">' +
    kids.slice(0, 4).map(function(c){ return link(href, c, 'chip', '<i></i>' + N[c].name); }).join('') +
    (more > 0 ? '<span class="go-more">+' + more + ' more</span>' : '') + '</div></div>';
}
function panelHTML(id, href){
  var n = N[id];
  var h = (id === 'computer' ? welcomeHTML(href) : '') +
    '<p class="p-level">Level ' + n.level + ': ' + levelName(n) + '</p><h1 class="p-title">' + n.name + '</h1><p class="p-short">' + n.short + '</p>' + goInsideHTML(n, href);
  if (n.device) h += '<span class="p-badge"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="5" fill="var(--' + (n.device === 'input' ? 'accent' : 'out') + ')"/></svg>' + (n.device === 'input' ? 'Input device' : 'Output device') + '</span>';
  h += photosHTML(id, href);
  h += sec('What is it?', '<p>' + n.what + '</p>');
  h += sec('What does it do?', '<p>' + n.does + '</p>');
  h += sec('Why it matters', '<p>' + n.why + '</p>');
  if (n.id === 'power-button') h += '<section class="p-sec pw-sec"><div class="pw-head"><h3>Power-on steps</h3>' + pwControls(true) + '</div>' +
    '<p class="pw-hint">Press the power button in the diagram, or use these controls.</p>' + pwKey() + '<ol class="pw-log" data-pw-log aria-live="polite"></ol></section>';

  /* interactive "Try it" sections */
  if (n.gate) h += sec('Try it', '<p class="expr">' + n.expr + '</p><p class="hintline">' + TT + '</p>' + truthTable(n));
  else if (n.scene === 'adder') h += sec('Try it', '<p>' + n.try + '</p>' + adderTable());
  else if (n.scene === 'mux') h += sec('Try it', '<p class="expr">Y = D<sub>S1S0</sub></p><p class="hintline">Flip S0 and S1 to choose which of the four inputs reaches the output.</p>' +
    '<table class="tt"><thead><tr><th>S1</th><th>S0</th><th class="out">Y</th></tr></thead><tbody>' +
    '<tr data-row="00"><td>0</td><td>0</td><td class="out">D0</td></tr>' +
    '<tr data-row="01"><td>0</td><td>1</td><td class="out">D1</td></tr>' +
    '<tr data-row="10"><td>1</td><td>0</td><td class="out">D2</td></tr>' +
    '<tr data-row="11"><td>1</td><td>1</td><td class="out">D3</td></tr></tbody></table>');
  else if (n.scene === 'control') h += sec('Try it', '<p>' + n.try + '</p><div class="live" data-live="control" aria-live="polite">Press <b>Next step</b> to begin.</div>');
  else if (n.try) h += sec('Try it', '<p>' + n.try + '</p>' + (n.scene === 'alu' ? '<div class="live" data-live="alu" aria-live="polite"></div>' : ''));

  var kids = n.children.filter(function(c){ return !N[c].ic && !N[c].device; });
  if (kids.length) h += sec('Inside it', '<div class="chips">' + kids.map(function(c){ return link(href, c, 'chip', '<i></i>' + N[c].name); }).join('') + '</div>');
  var devs = n.children.filter(function(c){ return N[c].device; });
  if (devs.length){
    var grp = function(kind, title){ var d = devs.filter(function(c){ return N[c].device === kind; });
      return d.length ? '<p class="p-sub">' + title + '</p><div class="chips">' + d.map(function(c){ return link(href, c, 'chip', '<i class="' + (kind === 'input' ? 'in' : 'out') + '"></i>' + N[c].name); }).join('') + '</div>' : ''; };
    h += sec('Connected devices', grp('input', 'Input: information goes into the computer') + grp('output', 'Output: results come out of the computer'));
  }
  var chipKids = n.children.filter(function(c){ return N[c].ic; });
  if (chipKids.length){
    var logicOnly = chipKids.every(function(c){ return /^74/.test(CHIPS[c].part); });
    h += sec(chipKids.length > 1 ? 'Real chips' : 'Real chip', '<div class="ic-list">' + chipKids.map(function(c){ return icCard(c, href); }).join('') + '</div>' +
      '<p class="note"><b>Real-world illustration.</b> ' + (logicOnly ? ACCURACY : DATASHEET) + '</p>');
  }
  if (n.instr){
    h += sec('Instructions in this group', '<table class="instr"><thead><tr><th>Instruction</th><th>What it does</th></tr></thead><tbody>' +
      INSTR[n.instr].map(function(r){ return '<tr><td><code>' + r[0] + '</code></td><td>' + r[1] + '</td></tr>'; }).join('') + '</tbody></table>');
  }
  if (n.chipNote) h += sec('Real chip', '<p>' + n.chipNote + '</p><p class="note"><b>Real-world illustration.</b> ' + ACCURACY + '</p>');
  if (n.ic){
    var c = CHIPS[id], par = N[n.parent], concept = par.name.toLowerCase(), isGate = !!par.gate;
    h += sec('Concept vs. physical chip', '<div class="cmp"><div><b>The concept</b>' + (isGate ? 'A ' + concept + ' is an idea: a rule you can write as a truth table or draw as a symbol.' : 'The ' + concept + ' is a job inside a computer, described by what goes in and what comes out.') +
      '</div><div><b>The physical part</b>The ' + c.part + ' is a real component with pins, a supply voltage, a speed limit and a price.</div></div>' +
      '<p class="note"><b>Accuracy note.</b> ' + (/^74/.test(c.part) ? ACCURACY + ' ' : '') + DATASHEET + '</p>');
  }
  if (n.ex.length) h += sec('Real-life examples', '<ul class="ex">' + n.ex.map(function(e){ return '<li><b>' + e[0] + '</b><span>' + e[1] + '</span></li>'; }).join('') + '</ul>');
  if (n.specs.length) h += sec('Key specifications', '<dl class="specs">' + n.specs.map(function(s){ return '<dt>' + s[0] + '</dt><dd>' + s[1] + '</dd>'; }).join('') + '</dl>');
  var rel = n.rel.filter(function(r){ return N[r[0]]; });
  if (rel.length) h += sec('How it connects', '<ul class="rel">' + rel.map(function(r){ return '<li>' + link(href, r[0], '', '<b>' + N[r[0]].name + '</b><span>' + r[1] + '</span>') + '</li>'; }).join('') + '</ul>');
  if (n.fact) h += '<div class="fact"><h3>Fun fact</h3><p>' + n.fact + '</p></div>';
  h += learnHTML(id);
  return h;
}
function crumbsHTML(id, href){
  var p = pathTo(id);
  return p.map(function(c, i){ return '<li style="--c:var(--lv-' + N[c].level + ')"><a href="' + href(c) + '" data-go="' + c + '"' + (i === p.length-1 ? ' aria-current="page"' : '') + '>' + N[c].name + '</a></li>'; }).join('');
}
function treeHTML(id, cur, href){
  var n = N[id];
  return '<li><a href="' + href(id) + '" data-go="' + id + '"' + (id === cur ? ' class="cur"' : '') + '>' + n.name + ' <small>L' + n.level + '</small></a>' +
    (n.children.length ? '<ul>' + n.children.map(function(c){ return treeHTML(c, cur, href); }).join('') + '</ul>' : '') + '</li>';
}
/* Parts that are clickable in the current drawing (mobile strip) */
function stripHTML(id, href){
  var own = ownerOf(id), kids = N[own].children.filter(function(c){ return !N[c].ic; }), chip = N[own].children.filter(function(c){ return N[c].ic; });
  kids = kids.concat(chip);
  if (!kids.length) return '';
  return '<span class="strip-label">In this view</span>' + kids.map(function(c){ return '<a class="chip' + (c === id ? ' cur' : '') + '" href="' + href(c) + '" data-go="' + c + '"><i></i>' + N[c].name + '</a>'; }).join('');
}

/* ---------- structured data (schema.org JSON-LD) for a part page ---------- */
function pageURL(id, site){ return site + (id === 'computer' ? '' : 'parts/' + id + '.html'); }
function jsonLD(id, site){
  var n = N[id], url = pageURL(id, site), graph = [
    {'@type':'WebSite','@id':site + '#website','url':site,'name':SITE_NAME,'inLanguage':'en'}
  ];
  var res = {'@type': id === 'computer' ? ['LearningResource','WebApplication'] : 'LearningResource',
    '@id':url + '#resource','url':url,'name': id === 'computer' ? 'Inside the Computer: Interactive Component Explorer' : n.name,
    'description':metaDesc(id),'inLanguage':'en','isAccessibleForFree':true,
    'learningResourceType':['Interactive resource','Diagram'],'interactivityType':'active',
    'educationalLevel':['High school','Undergraduate'],
    'audience':{'@type':'EducationalAudience','educationalRole':'student'},
    'about':{'@type':'Thing','name':n.name},'isPartOf':{'@id':site + '#website'},
    'image':site + 'og-image.png'};
  if (id === 'computer'){ res.applicationCategory = 'EducationalApplication'; res.operatingSystem = 'Any (web browser)';
    res.offers = {'@type':'Offer','price':'0','priceCurrency':'USD'}; }
  if (n.children.length) res.hasPart = n.children.map(function(c){ return {'@type':'LearningResource','name':N[c].name,'url':pageURL(c, site)}; });
  graph.push(res);
  graph.push({'@type':'BreadcrumbList','itemListElement':pathTo(id).map(function(c, i){ return {'@type':'ListItem','position':i+1,'name':N[c].name,'item':pageURL(c, site)}; })});
  return {'@context':'https://schema.org','@graph':graph};
}
