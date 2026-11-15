# Banc reproductible de Sedes Petri : coût de construction de la carte, du rendu et du tour de jeu.
# usage : python3 perf.py sortie.json [ralenti_cpu=4] [dossier_jeu]
# ralenti_cpu=4 imite un téléphone milieu de gamme (CDP Emulation.setCPUThrottlingRate).
import asyncio,json,sys,os
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur
from playwright.async_api import async_playwright
OUT=sys.argv[1] if len(sys.argv)>1 else 'perf.json'; RAL=float(sys.argv[2]) if len(sys.argv)>2 else 4
JEU=sys.argv[3] if len(sys.argv)>3 else os.path.join(os.path.dirname(__file__),'../jeu')
async def main():
    base=serveur(os.path.abspath(JEU),8771)
    async with async_playwright() as p:
        nav=await p.chromium.launch(executable_path='/usr/bin/google-chrome' if os.path.exists('/usr/bin/google-chrome') else None,args=['--no-sandbox'])
        res={}
        for nom,vp in [('telephone',{'width':390,'height':844}),('mac',{'width':1440,'height':860})]:
            pg=await nav.new_page(viewport=vp); err=[]; pg.on('pageerror',lambda e:err.append(str(e)))
            cdp=await pg.context.new_cdp_session(pg)
            await cdp.send('Emulation.setCPUThrottlingRate',{'rate':RAL if nom=='telephone' else 1.5})
            await pg.add_init_script("localStorage.setItem('sp_welcome','1');window.__t0=performance.now();")
            await pg.goto(base+'index.html?graine=7')
            await pg.wait_for_function("document.getElementById('start') && !document.getElementById('start').hidden",timeout=120000)
            charge=await pg.evaluate("performance.now()-window.__t0")
            carte=await pg.evaluate("window.__tCarte||null")
            await pg.click('#stStart'); await pg.wait_for_timeout(800)
            r=await pg.evaluate("""()=>{const t=[];const modes=['relations','ferveur','heresie','royaumes'];
              for(let i=0;i<8;i++){MAP.mode=modes[i%4];MAP.lastKey=null;const a=performance.now();renderAll();t.push(performance.now()-a);}
              const t2=[];for(let i=0;i<8;i++){const a=performance.now();renderAll();t2.push(performance.now()-a);}
              const t3=[];for(let i=0;i<12;i++){const a=performance.now();endSeason();t3.push(performance.now()-a);S.events=[];if(S.pendingConclave){const cv=conclaveSetup();while(!cv.done)conclaveRound(cv);electPope(cv,'Pie');}}
              const m=a=>+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1);
              return {rendu_carte_ms:m(t),rendu_sans_carte_ms:m(t2),tour_moteur_ms:m(t3),taille_sauvegarde_ko:Math.round(JSON.stringify(S).length/1024)};}""")
            res[nom]=dict(chargement_ms=round(charge),construction_carte_ms=carte and round(carte),**r,erreurs=err)
            await pg.close()
        await nav.close()
    json.dump(res,open(OUT,'w'),indent=1,ensure_ascii=False); print(json.dumps(res,indent=1,ensure_ascii=False))
asyncio.run(main())
