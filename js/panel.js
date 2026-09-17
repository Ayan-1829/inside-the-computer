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

function miniDip(pins){
  var per = pins/2, pitch = 80/per, s = '';
  for (var i=0;i<per;i++){ var x = 6+pitch*(i+.5)-2.5; s += '<rect x="'+x+'" y="4" width="5" height="8" rx="1" fill="var(--i-metal)"/><rect x="'+x+'" y="40" width="5" height="8" rx="1" fill="var(--i-metal)"/>'; }
  return '<svg viewBox="0 0 92 52" aria-hidden="true">' + s + '<rect x="6" y="11" width="80" height="30" rx="4" fill="var(--i-chip)"/><path d="M6 20a6 6 0 0 1 0 12Z" fill="var(--i-chip-edge)"/></svg>';
}
function icCard(id, href){
  var c = CHIPS[id], pins = c.labels.length;
  return link(href, id, 'ic-card', miniDip(pins) + '<div><b>' + c.part + '</b><span>' + c.desc + (c.gate && c.gate !== 'NOT' ? ' gates' : '') + ' in one ' + pins + '-pin package</span><em>View the pinout</em></div>');
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

function panelHTML(id, href){
  var n = N[id], own = N[ownerOf(id)], model = own.model && !n.ic;
  var h = '<p class="p-level">Level ' + n.level + ': ' + LEVELS[n.level] + '</p><h1 class="p-title">' + n.name + '</h1><p class="p-short">' + n.short + '</p>';
  if (model) h += '<span class="p-badge"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="M8 7.2v4M8 4.6v.1"/></svg>Diagram is a simplified educational model</span>';
  h += sec('What is it?', '<p>' + n.what + '</p>');
  h += sec('What does it do?', '<p>' + n.does + '</p>');
  h += sec('Why it matters', '<p>' + n.why + '</p>');

  /* interactive "Try it" sections */
  if (n.gate) h += sec('Try it', '<p class="expr">' + n.expr + '</p><p class="hintline">' + TT + '</p>' + truthTable(n));
  else if (n.scene === 'adder') h += sec('Try it', '<p>' + n.try + '</p>' + adderTable());
  else if (n.scene === 'mux') h += sec('Try it', '<p class="expr">Y = ' + OL('S') + '·D0 + S·D1</p><p class="hintline">Flip S to choose which input reaches the output.</p>' +
    '<table class="tt"><thead><tr><th>S</th><th class="out">Y</th></tr></thead><tbody><tr data-row="0"><td>0</td><td class="out">D0</td></tr><tr data-row="1"><td>1</td><td class="out">D1</td></tr></tbody></table>');
  else if (n.scene === 'control') h += sec('Try it', '<p>' + n.try + '</p><div class="live" data-live="control" aria-live="polite">Press <b>Next step</b> to begin.</div>');
  else if (n.try) h += sec('Try it', '<p>' + n.try + '</p>' + (n.scene === 'alu' ? '<div class="live" data-live="alu" aria-live="polite"></div>' : ''));

  var kids = n.children.filter(function(c){ return !N[c].ic; });
  if (kids.length) h += sec('Inside it', '<div class="chips">' + kids.map(function(c){ return link(href, c, 'chip', '<i></i>' + N[c].name); }).join('') + '</div>');
  var chipKid = n.children.filter(function(c){ return N[c].ic; })[0];
  if (chipKid) h += sec('Real chip', icCard(chipKid, href) + '<p class="note"><b>Real-world illustration.</b> ' + ACCURACY + '</p>');
  if (n.chipNote) h += sec('Real chip', '<p>' + n.chipNote + '</p><p class="note"><b>Real-world illustration.</b> ' + ACCURACY + '</p>');
  if (n.ic){
    var c = CHIPS[id], concept = N[n.parent].name.toLowerCase();
    h += sec('Concept vs. physical chip', '<div class="cmp"><div><b>The concept</b>A ' + concept + ' is an idea: a rule you can write as a truth table or draw as a symbol.</div><div><b>The physical part</b>The ' + c.part + ' is a real component with pins, a 5 V supply, a speed limit and a price.</div></div><p class="note"><b>Accuracy note.</b> ' + ACCURACY + '</p>');
  }
  if (n.ex.length) h += sec('Real-life examples', '<ul class="ex">' + n.ex.map(function(e){ return '<li><b>' + e[0] + '</b><span>' + e[1] + '</span></li>'; }).join('') + '</ul>');
  if (n.specs.length) h += sec('Key specifications', '<dl class="specs">' + n.specs.map(function(s){ return '<dt>' + s[0] + '</dt><dd>' + s[1] + '</dd>'; }).join('') + '</dl>');
  var rel = n.rel.filter(function(r){ return N[r[0]]; });
  if (rel.length) h += sec('How it connects', '<ul class="rel">' + rel.map(function(r){ return '<li>' + link(href, r[0], '', '<b>' + N[r[0]].name + '</b><span>' + r[1] + '</span>') + '</li>'; }).join('') + '</ul>');
  if (n.fact) h += '<div class="fact"><h3>Fun fact</h3><p>' + n.fact + '</p></div>';
  if (model) h += '<p class="p-foot">Diagrams on this level are simplified educational models. Real chips are laid out differently and are far more complex.</p>';
  return h;
}
function crumbsHTML(id, href){
  var p = pathTo(id);
  return p.map(function(c, i){ return '<li><a href="' + href(c) + '" data-go="' + c + '"' + (i === p.length-1 ? ' aria-current="page"' : '') + '>' + N[c].name + '</a></li>'; }).join('');
}
function depthHTML(level){
  return [1,2,3,4,5].map(function(l){ return '<li class="' + (l < level ? 'past' : l === level ? 'on' : '') + '"' + (l === level ? ' aria-current="step"' : '') + '><span class="d-dot"></span><span class="d-txt">Level ' + l + ': ' + LEVELS[l] + '</span></li>'; }).join('');
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
