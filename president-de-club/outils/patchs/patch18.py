p='/home/claude/president/index.html';s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a));s=s.replace(a,b)
mod=open('/home/claude/t/mod_ui.js').read()
rep("function migrate(){",mod+"\nfunction migrate(){")
rep("const KEY='president-club-save-v1';","let KEY='president-club-save-v1';")
rep("  if(!saved){try{const t=localStorage.getItem(KEY);if(t)saved=JSON.parse(t);}catch(e){}}",
    "  try{const n=+(localStorage.getItem('president-club-slot')||1);if(n>=1&&n<=SLOTS)KEY=keyFor(n);}catch(e){}\n  if(!saved){try{const t=localStorage.getItem(KEY);if(t)saved=JSON.parse(t);}catch(e){}}")
rep("A.create=function(){\n","A.create=function(){\n  {let n=UI.setup.slot;try{if(!n)n=[1,2,3].find(k=>!localStorage.getItem(keyFor(k)))||+(localStorage.getItem('president-club-slot')||1);localStorage.setItem('president-club-slot',String(n));}catch(e){n=n||1;}KEY=keyFor(n);UI.setup.slot=null;}\n")
rep("  setupSeason();\n  news('Vous êtes élu président de '+name+'. Bienvenue au club !','g');",
    "  S.club.start=S.year;\n  {const cb=careerBonus();if(cb){S.confidence=clamp(S.confidence+cb,0,100);S.rep=clamp(S.rep+cb/4,0,100);S.flags.careerSp=1+cb/100;}}\n  setupSeason();\n  news('Vous êtes élu président de '+name+'. Bienvenue au club !','g');if(S.flags.careerSp)news('Votre réputation de président vous précède : confiance et partenaires au rendez-vous.','g');")
rep("  S.sponsorAnnual=Math.round(L.spons*(1+.08*slvl('commercial'))*(.8+S.rep/250));",
    "  S.sponsorAnnual=Math.round(L.spons*(1+.08*slvl('commercial'))*(.8+S.rep/250)*(S.flags.careerSp||1));")
rep("  <p class=\"lede\">Vous reprenez un petit club",
    "  ${(()=>{try{return [1,2,3].some(k=>localStorage.getItem(keyFor(k)))||careerGet().length?startSlotsHtml():'';}catch(e){return '';}})()}\n  <p class=\"lede\">Vous reprenez un petit club")
rep("function showOver(){\n","function showOver(){\n  careerAdd(S.over.t);save();\n")
rep("  <div class=\"row\"><button class=\"btn pri\" onclick=\"A.reset()\">Nouvelle partie</button></div>`);",
    "  <div class=\"row\"><button class=\"btn pri\" onclick=\"A.toMenu()\">Mes parties</button><button class=\"btn\" onclick=\"A.reset()\">Effacer et recommencer ici</button></div>`);")
rep("<button class=\"btn\" onclick=\"A.exportSave()\">Exporter</button>",
    "<button class=\"btn pri\" onclick=\"A.toMenu()\">Mes parties</button><button class=\"btn\" onclick=\"A.exportSave()\">Exporter</button>")
rep("<button class=\"btn dan\" onclick=\"A.confirmReset()\">Nouvelle partie</button></div></div>`;",
    "<button class=\"btn dan\" onclick=\"A.resign()\">Démissionner</button><button class=\"btn dan\" onclick=\"A.confirmReset()\">Effacer cette partie</button></div></div>`;")
rep("  enhanceTables(document.getElementById('main'),UI.tab);\n  if(UI.enter)",
    "  enhanceTables(document.getElementById('main'),UI.tab);cmpBar();\n  if(UI.enter)")
rep("   <div class=\"card\"><h3>À surveiller</h3>","   ${licenceCard()}\n   <div class=\"card\"><h3>À surveiller</h3>")
rep("  <p class=\"muted\" style=\"margin:0\">Meilleur buteur du championnat :","  ${seasonVisual()}\n  <p class=\"muted\" style=\"margin:0\">Meilleur buteur du championnat :")
i=s.index('onclick="A.scoutP');j=s.rindex('<button',0,i)
s=s[:j]+'<button class="btn sm cmpb ${UI.cmp.includes(p.id)?\'on\':\'\'}" data-cmp="${p.id}" onclick="A.cmpToggle(${p.id})" title="Ajouter au comparateur" aria-label="Comparer">⇄</button>'+s[j:]
css="""
.cmpbar{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:60;display:flex;align-items:center;gap:10px;padding:8px 10px 8px 16px;border-radius:999px;background:#0d1611f2;border:1px solid var(--flood);box-shadow:0 12px 40px #000b;font-size:13.5px;max-width:calc(100vw - 24px)}
.cmpbar span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.btn.cmpb.on{border-color:var(--flood);color:var(--flood);background:#2a2610}
.cmp-head{display:grid;gap:10px;text-align:center}.cmp-head>div{display:grid;justify-items:center;gap:4px;padding:10px;border-radius:8px;border-top:3px solid var(--cc);background:#ffffff08}
.cmp-head .ovr{font-size:26px;color:var(--cc)}
table.cmp td{text-align:center}table.cmp td:first-child{text-align:left}
.slots{display:grid;gap:8px}.slot{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:#ffffff05}.slot.empty{border-style:dashed}.slot.on{border-color:var(--flood)}
.career{display:grid;gap:10px}
.lic .lic-list{display:grid;gap:10px}.lic .li{display:grid;grid-template-columns:1fr auto;gap:4px 10px;font-size:13.5px}
.lic .lbar{grid-column:1/-1;height:6px;border-radius:3px;background:#ffffff10;overflow:hidden}.lic .lbar i{display:block;height:100%;background:var(--good)}
.lic .li.late .lbar i{background:var(--bad)}.lic small{grid-column:1/-1;font-size:12px}
.sv{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
.sv-c{border:1px solid var(--line);border-radius:8px;padding:12px;background:#ffffff05;display:grid;gap:8px;align-content:start}
.sv-c h4{margin:0;font:800 14px/1 var(--display);letter-spacing:.08em;text-transform:uppercase;color:var(--flood);display:flex;gap:6px;align-items:center}
.sv-c.euro h4{color:var(--ec)}
.awards{display:grid;gap:8px}.award{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:center}.award small{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}.award b{display:block}
.fbars{display:grid;gap:10px}.fbar{display:grid;grid-template-columns:minmax(90px,38%) 1fr auto;gap:8px;align-items:center;font-size:12.5px}.fbar span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fbar>div{height:8px;border-radius:4px;background:#ffffff0d;overflow:hidden}.fbar i{display:block;height:100%;border-radius:4px}.fbar i.good{background:var(--good)}.fbar i.bad{background:var(--bad)}
</style>"""
s=s.replace("</style>",css,1)
open(p,'w').write(s);print('ok')
