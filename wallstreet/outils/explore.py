# Testeur au doigt pour Wall Street (adapté de couronnes-et-lignees/outils/tests/explore.py) :
# touche au hasard les vrais boutons visibles (ordinateur ou téléphone), remplit les quantités et les ordres,
# relève erreurs JavaScript, blocages, débordements horizontaux et invariants (argent fini, patrimoine cohérent).
# usage : python3 explore.py bourse6.html [minutes=3] [graine=7] [m]   (m = téléphone 390×844)
import sys, os, random, json, time
from playwright.sync_api import sync_playwright
html=os.path.abspath(sys.argv[1]); minutes=float(sys.argv[2]) if len(sys.argv)>2 else 3; rng=random.Random(int(sys.argv[3]) if len(sys.argv)>3 else 7); mob=len(sys.argv)>4 and sys.argv[4]=='m'
EVITER=['Commencer une partie','Mesurer la fluidité','Signaler','Envoyer à Claude','Lecture auto']
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':390,'height':844} if mob else {'width':1366,'height':860},reduced_motion='reduce',has_touch=mob)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    pg.add_init_script("try{if(!sessionStorage.getItem('x')){localStorage.clear();sessionStorage.setItem('x','1')}localStorage.setItem('wallst-tuto','1');localStorage.setItem('wallst-sound','0')}catch(e){}")
    pg.goto('file://'+html); pg.wait_for_timeout(700); pg.click('#sGo'); pg.wait_for_timeout(500)
    t0=time.time(); clics=0; same=0; last=''; vus={}; blocages=0; debord=set(); invar=[]; trades=0
    while time.time()-t0<minutes*60:
        st=pg.evaluate("(()=>{const W=window.__wst,G=W.G;return JSON.stringify([G.day,G.tx.length,[...document.querySelectorAll('.modal')].filter(m=>!m.hidden).map(m=>m.id).join(),document.activeElement&&document.activeElement.id,scrollY|0]);})()")
        if st==last: same+=1
        else: same=0; last=st
        if same>60:
            blocages+=1; errs.append('BLOCAGE '+st); pg.evaluate("document.querySelectorAll('.modal').forEach(m=>m.hidden=true)"); same=0
        iv=pg.evaluate("(()=>{const W=window.__wst,G=W.G,v=W.value();const bad=[];if(!isFinite(v))bad.push('patrimoine '+v);if(!isFinite(G.cash))bad.push('cash '+G.cash);for(const t in G.pos){const q=G.pos[t].q!=null?G.pos[t].q:G.pos[t];if(!isFinite(q))bad.push('pos '+t);}return bad.concat(document.documentElement.scrollWidth>innerWidth+2?['DEBORD '+document.documentElement.scrollWidth+' onglet '+(document.querySelector('.tab[aria-selected=true]')||{}).textContent]:[]);})()")
        for x in iv:
            (debord.add(x) if x.startswith('DEBORD') else invar.append(x))
        cands=pg.evaluate("""(ev)=>{const v=[...document.querySelectorAll('button, [role=tab], tr[data-t], .tab, input[type=checkbox], input[type=radio], select, input[type=number], input[type=text]:not(#q)')].filter(e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height||r.bottom<0||r.top>innerHeight)return false;if(e.disabled||e.closest('[hidden]'))return false;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.pointerEvents==='none')return false;const t=(e.innerText||e.value||'').trim();return !ev.some(x=>t.includes(x));});
          return v.map((e,i)=>{e.dataset.ex=i;return [(e.innerText||e.getAttribute('aria-label')||e.id||e.tagName).trim().split('\\n')[0].slice(0,40),!!e.closest('.modal:not([hidden])'),e.tagName,e.type||''];});}""",EVITER)
        if not cands:
            pg.mouse.wheel(0,rng.choice([-600,600])); continue
        modal=[i for i,c in enumerate(cands) if c[1]]
        i=rng.choice(modal) if modal and rng.random()<0.85 else rng.randrange(len(cands))
        nom,_,tag,typ=cands[i]; vus[nom]=vus.get(nom,0)+1; loc=pg.locator(f'[data-ex="{i}"]').first
        try:
            if tag=='INPUT' and typ in('number','text'): loc.fill(str(rng.choice([1,3,10,50,0,-5,99999,'1.5','abc']))),
            elif tag=='SELECT':
                opts=loc.evaluate("e=>[...e.options].map(o=>o.value)"); loc.select_option(rng.choice(opts)) if opts else None
            else: loc.click(timeout=2000)
        except Exception: pass
        if 'Acheter' in nom or 'Vendre' in nom or 'Confirmer' in nom: trades+=1
        clics+=1; pg.wait_for_timeout(rng.choice([40,90,200]))
        if rng.random()<0.04: pg.mouse.wheel(0,rng.choice([-900,500,900]))
    fin=pg.evaluate("(()=>{const G=window.__wst.G;return {seance:G.day,operations:G.tx.length,patrimoine:Math.round(window.__wst.value())};})()")
    res={'appareil':'téléphone' if mob else 'ordinateur','minutes':minutes,'touches':clics,'fin':fin,'boutons_distincts':len(vus),'blocages':blocages,'debordements':sorted(debord)[:6],'invariants':invar[:6],'erreurs':errs[:10]}
    print(json.dumps(res,ensure_ascii=False,indent=1)); print('plus touchés :',sorted(vus.items(),key=lambda x:-x[1])[:15])
    b.close()
