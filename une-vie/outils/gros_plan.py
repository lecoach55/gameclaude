# Gros plans (personnages, intérieur) : python3 gros_plan.py dossier [scenes] [zoom]
# Caméra rapprochée sur l'intérieur pour juger personnages et mobilier (capture 2x).
import sys,asyncio,os
from playwright.async_api import async_playwright
from scenes import ouvrir,scene,SCENES
async def main():
    out=sys.argv[1];noms=sys.argv[2].split(',') if len(sys.argv)>2 else ['ville1','appart2','villa4','nuit'];z=float(sys.argv[3]) if len(sys.argv)>3 else 2.2
    os.makedirs(out,exist_ok=True)
    async with async_playwright() as p:
        nav,pg=await ouvrir(p)
        for n in noms:
            await scene(pg,n,2500)
            await pg.evaluate(f"()=>{{const c=W3._dbg().chars;const m=c.find(x=>x.me)||c[0];W3._cam({z},undefined,m?m.g.position.x:0,m?m.g.position.z:0)}}")
            await pg.wait_for_timeout(2500)
            await pg.screenshot(path=f'{out}/{n}_gp.png',clip={'x':0,'y':0,'width':390,'height':330})
        print('erreurs',len(pg.erreurs),pg.erreurs[:2]);await nav.close()
asyncio.run(main())
