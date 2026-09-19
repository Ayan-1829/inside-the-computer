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
    ic('step', 'Next step', svg('<path d="M3 3l7 5-7 5z"/><rect x="11" y="3" width="2" height="10"/>')) + '</div>';
}
function sec(t, h){ return h ? '<section class="p-sec"><h3>' + t + '</h3>' + h + '</section>' : ''; }

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
    '<div class="dp-scroll"><p class="dp-short">' + n.short + '</p>' +
    '<div class="dp-body"><p>' + n.does + '</p></div>' +
    '<p class="dp-hint">Right-click for more options</p></div>';
}
function detailsFullHTML(n){
  var h = '<p>' + n.what + '</p><p>' + n.does + '</p><p>' + n.why + '</p>';
  if (n.specs.length) h += '<dl class="dp-specs">' + n.specs.map(function(s){ return '<dt>' + s[0] + '</dt><dd>' + s[1] + '</dd>'; }).join('') + '</dl>';
  if (n.fact) h += '<p class="dp-fact"><b>Fun fact.</b> ' + n.fact + '</p>';
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
    '<div class="dp-scroll"><p class="dp-short">' + n.short + '</p>' +
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
function panelHTML(id, href){
  var n = N[id];
  var h = '<p class="p-level">Level ' + n.level + ': ' + levelName(n) + '</p><h1 class="p-title">' + n.name + '</h1><p class="p-short">' + n.short + '</p>';
  if (n.device) h += '<span class="p-badge"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="5" fill="var(--' + (n.device === 'input' ? 'accent' : 'out') + ')"/></svg>' + (n.device === 'input' ? 'Input device' : 'Output device') + '</span>';
  h += sec('What is it?', '<p>' + n.what + '</p>');
  h += sec('What does it do?', '<p>' + n.does + '</p>');
  h += sec('Why it matters', '<p>' + n.why + '</p>');
  if (n.id === 'power-button') h += '<section class="p-sec pw-sec"><div class="pw-head"><h3>Power-on steps</h3>' + pwControls(true) + '</div>' +
    '<p class="pw-hint">Press the power button in the diagram, or use these controls.</p><ol class="pw-log" data-pw-log aria-live="polite"></ol></section>';

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
  return h;
}
function crumbsHTML(id, href){
  var p = pathTo(id);
  return p.map(function(c, i){ return '<li><a href="' + href(c) + '" data-go="' + c + '"' + (i === p.length-1 ? ' aria-current="page"' : '') + '>' + N[c].name + '</a></li>'; }).join('');
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
