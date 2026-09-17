/* ==========================================================
   core.js
   Shared definitions used by the data files, the panel renderer,
   the scenes, and the build script (build/build.mjs).
   No DOM access in this file.
   ========================================================== */
var LEVELS = {1:'Computer',2:'Hardware',3:'Component architecture',4:'Digital logic',5:'Physical logic ICs'};

/* Every explorable part is one object in N, created with def().
   Fields:
     name, parent, level (1–5)
     scene   – key in SCENES if the part has its own drawing (otherwise it is
               highlighted inside its parent's drawing)
     tip     – one-line tooltip
     short, what, does, why – panel text
     ex      – [[name, note], …]   real-life examples
     specs   – [[label, value], …] key specifications
     rel     – [[id, reason], …]   related parts
     fact    – fun fact
     model   – true if the drawing is a simplified educational model
     gate    – 'AND' | 'OR' | … for logic-gate pages
     try     – extra "Try it" text for interactive scenes          */
var N = {};
var ORDER = [];
function def(id, o){
  if (N[id]) throw new Error('Duplicate part id: ' + id);
  N[id] = Object.assign({id:id, children:[], ex:[], specs:[], rel:[]}, o);
  ORDER.push(id);
}
function linkTree(){
  ORDER.forEach(function(id){ N[id].children = []; });
  ORDER.forEach(function(id){
    var p = N[id].parent;
    if (p){ if (!N[p]) throw new Error('Unknown parent "' + p + '" for ' + id); N[p].children.push(id); }
  });
}
function ownerOf(id){ var n = N[id]; while (n && !n.scene) n = N[n.parent]; return n ? n.id : 'computer'; }
function pathTo(id){ var p = [], n = N[id]; while (n){ p.unshift(n.id); n = N[n.parent]; } return p; }
function isAncestor(a, b){ var n = N[b]; while (n){ if (n.id === a) return true; n = N[n.parent]; } return false; }

/* Overline helper for HTML text (NOT, NAND …) */
function OL(s){ return '<span class="bar">' + s + '</span>'; }

/* Logic functions for the seven basic gates */
var GFN = {
  AND:function(a,b){return a&b;}, OR:function(a,b){return a|b;}, NOT:function(a){return a^1;},
  NAND:function(a,b){return (a&b)^1;}, NOR:function(a,b){return (a|b)^1;},
  XOR:function(a,b){return a^b;}, XNOR:function(a,b){return (a^b)^1;}
};
var TT = 'Flip the input switches in the diagram. The matching truth-table row lights up.';
