# Temps de chargement (graine 7, carte moyenne) : page prête (accueil), carte générée, carte 3D prête ; avec ralenti CPU.
# python3 chargement.py [ralenti=4] [répétitions=2] [sortie.json]   largeur 390×780 (téléphone) puis 1280×800
import asyncio,sys,os,json,time
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur
from playwright.async_api import async_playwright
JEU=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
async def une(nav,base,ral,W,H,url):
    pg=await nav.new_page(viewport={'width':W,'height':H});err=[];pg.on('pageerror',lambda e:err.append(str(e)[:200]))
    cdp=await pg.context.new_cdp_session(pg);await cdp.send('Emulation.setCPUThrottlingRate',{'rate':ral})
    t0=time.time();await pg.goto(base+url,timeout=300000)
    await pg.wait_for_function("()=>typeof ECRAN!=='undefined'&&ECRAN",polling=50,timeout=300000);t1=time.time()
    await pg.wait_for_function("()=>ECRAN==='aventure'",polling=50,timeout=300000);t2=time.time()
    await pg.wait_for_function("()=>!V.m3||R3.actif",polling=50,timeout=300000);t3=time.time()
    r={'page_ms':round((t1-t0)*1000),'carte_ms':round((t2-t0)*1000),'carte3d_ms':round((t3-t0)*1000),'tGen':await pg.evaluate('V.tGen'),
       'tas_Mo':await pg.evaluate("performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null"),'erreurs':err}
    await pg.close();return r
async def main():
    ral=float(sys.argv[1]) if len(sys.argv)>1 else 4;n=int(sys.argv[2]) if len(sys.argv)>2 else 2;out=sys.argv[3] if len(sys.argv)>3 else None
    base=serveur(JEU,int(os.environ.get('PORT','8784')));res={'ralenti':ral,'poids_Ko':round(os.path.getsize(os.path.join(JEU,'../build/bannieres.html'))/1024) if os.path.exists(os.path.join(JEU,'../build/bannieres.html')) else None}
    async with async_playwright() as p:
        nav=await navigateur(p)
        for nom,W,H in (('telephone',390,780),('ordinateur',1280,800)):
            l=[await une(nav,base,ral,W,H,'index.html?graine=7&taille=54') for _ in range(n)]
            res[nom]={k:sorted(x[k] for x in l)[len(l)//2] if isinstance(l[0][k],(int,float)) else l[0][k] for k in l[0]}
        await nav.close()
    s=json.dumps(res,ensure_ascii=False);print(s)
    if out:open(out,'w').write(s)
asyncio.run(main())
