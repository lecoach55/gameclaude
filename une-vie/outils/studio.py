# Captures de vues fixes : python3 studio.py dossier [scenes,...]  (toutes par défaut) + ui (arbre, bilan)
import sys,asyncio,os
from playwright.async_api import async_playwright
from scenes import ouvrir,scene,SCENES,capturer,attente
FIGER=os.environ.get('FIGER','1')!='0'  # horloge virtuelle par défaut (captures reproductibles) ; FIGER=0 pour l'ancien comportement
async def main():
    out=sys.argv[1];noms=sys.argv[2].split(',') if len(sys.argv)>2 else list(SCENES)+['arbre','bilan']
    os.makedirs(out,exist_ok=True)
    async with async_playwright() as p:
        nav,pg=await ouvrir(p,figer=FIGER)
        pile=[];pg.on('pageerror',lambda e:pile.append(str(getattr(e,'stack',e))[:500]))
        if FIGER and noms and noms[0] in SCENES:await scene(pg,noms[0])  # 1re scène jouée deux fois : le déménagement depuis la vie tirée (fondu en setTimeout réel) rendait son cadrage variable
        for n in noms:
            avant=len(pg.erreurs)
            if n in SCENES:
                await scene(pg,n);await pg.screenshot(path=f'{out}/{n}.png',clip={'x':0,'y':0,'width':390,'height':470})
            elif n=='arbre':
                await scene(pg,'maison3',800);await pg.add_style_tag(content='.tree{animation:none!important}');await pg.evaluate("()=>{S.lineage=[{f:'🇳🇬',n:'Moussa',y0:1990,a:71,s:63}];S.gen=2;openTree()}");await attente(pg,500);await capturer(pg,f'{out}/arbre.png');await pg.evaluate("()=>document.getElementById('tree').remove()")
            elif n=='bilan':
                await scene(pg,'maison3',800);await pg.evaluate("()=>{S.deathAge=S.age;die()}");await attente(pg,2500);await pg.evaluate("()=>document.querySelector('.end').scrollIntoView()");await attente(pg,400);await capturer(pg,f'{out}/bilan.png')
            if len(pg.erreurs)>avant:print('  erreurs dans',n,len(pg.erreurs)-avant)
        print('erreurs',len(pg.erreurs),pile[:1])
        await nav.close()
asyncio.run(main())
