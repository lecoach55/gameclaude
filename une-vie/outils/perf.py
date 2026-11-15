# Banc reproductible : python3 perf.py sortie.json [hd|sd] [scenes]  -> img/s (rendu logiciel : valeur RELATIVE), appels, triangles
import sys,asyncio,json
from playwright.async_api import async_playwright
from scenes import ouvrir,scene,mesurer,SCENES
async def main():
    out=sys.argv[1];q=sys.argv[2] if len(sys.argv)>2 else 'hd';noms=sys.argv[3].split(',') if len(sys.argv)>3 else ['rural0','appart2','villa4','nuit','hiver']
    res={}
    async with async_playwright() as p:
        nav,pg=await ouvrir(p,qualite=q)
        for n in noms:
            await scene(pg,n,3000);m=await mesurer(pg,4000);i=await pg.evaluate("()=>W3.info()");res[n]={**m,'appels':i['calls'],'tri':i['tris']};print(n,res[n])
        res['_erreurs']=pg.erreurs;await nav.close()
    json.dump(res,open(out,'w'),indent=1)
asyncio.run(main())
