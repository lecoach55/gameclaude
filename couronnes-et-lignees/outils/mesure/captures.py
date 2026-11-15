# Captures de vues fixes (graine 1234, mouvement réduit) pour comparer deux versions.
# usage : python3 captures.py chemin/index.html dossier_sortie
# puis   : python3 ../../../outils-communs/compare.py ../../references dossier_sortie planche.png
import sys, os
from playwright.sync_api import sync_playwright
page_html, out = os.path.abspath(sys.argv[1]), sys.argv[2]; os.makedirs(out, exist_ok=True)
VUES = [
 ('titre', "titleScreen()"),
 ('plateau', "closeM();setTab('plateau');fitView()"),
 ('guerre', "catSheet('guerre')"),
 ('batir', "S.gold=200;buildMenu()"),
 ('region', "tapRegion(D.borderTargets(S).find(r=>r.owner!=='rival').i)"),
 ('bataille', "S.army=80;const i=D.borderTargets(S)[0].i;showBattle({won:true,kind:'campagne',tgt:S.regions[i].name,region:i,ours:90,enemy:40,loss:8,tactic:'siege',stance:'retranche'})"),
 ('evenement', "const e=D.EVENTS.find(x=>x.id==='rival_defi');S.event={id:e.id,hist:false,text:e.text(S),choices:e.choices.map(c=>({l:c.l,d:c.d}))};showEvent()"),
 ('education', "S.gold=100;eduMenu()"),
 ('cour', "closeM();setTab('cour')"),
 ('conseil', "closeM();setTab('cour');scrollTo(0,document.querySelector('.council').getBoundingClientRect().top+scrollY-60)"),
 ('voisins', "closeM();setTab('cour');scrollTo(0,document.querySelector('.nbs').getBoundingClientRect().top+scrollY-60)"),
 ('lignee', "closeM();setTab('lignee')"),
 ('chronique', "closeM();setTab('chronique')"),
 ('titres', "closeM();setTab('plateau');titlesSheet()"),
 ('edifices', "closeM();setTab('plateau');S.gold=5000;const cap=S.regions.find(r=>r.cap),o=D.myRegions(S).find(r=>!r.cap);for(const [k,r] of [['moulin',o],['marche',o],['abbaye',o],['donjon',cap],['lices',cap]]){D.playTurn(S,'construire',r.i,k);if(S.event)D.resolveEvent(S,0);}S.event=null;S.cathedral=true;render();const c=D.mapGeom(S.seed).cells[cap.i].c;view={x:c[0]-75,y:c[1]-150,w:150,h:150*844/390};applyView()"),
]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, reduced_motion='reduce')
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.clear();localStorage.setItem('cl_guide','1');localStorage.setItem('cl_sound',JSON.stringify({sfx:false,music:false}))}catch(e){}")
    pg.goto('file://' + page_html); pg.wait_for_timeout(600)
    pg.evaluate("startTest();for(let i=0;i<8;i++){D.playTurn(S,'attendre');if(S.event)D.resolveEvent(S,0);}S.event=null;D.autoCouncil(S);render()")
    pg.evaluate("document.querySelectorAll('[id^=tk],div[style*=\"9999\"]').forEach(e=>e.remove())")
    for nom, js in VUES:
        pg.evaluate("closeM()"); pg.wait_for_timeout(150)
        pg.evaluate(js); pg.wait_for_timeout(700)
        pg.evaluate("document.querySelectorAll('div[style*=\"9999\"]').forEach(e=>e.remove())")
        pg.screenshot(path=f'{out}/{nom}.png')
    # fin de partie
    pg.evaluate("closeM();setTab('plateau');for(let n=0;n<200&&!S.over;n++){D.playTurn(S,'attendre');if(S.event)D.resolveEvent(S,0);}render();showEnd()"); pg.wait_for_timeout(700)
    pg.screenshot(path=f'{out}/fin.png')
    print(len(VUES) + 1, 'vues ->', out, '| erreurs :', errs[:3])
    b.close()
