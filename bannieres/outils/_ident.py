import asyncio,sys,os,json
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page,avancer,attendre
from playwright.async_api import async_playwright
JEU=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
async def main():
    base=serveur(JEU,8796)
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,base+'index.html?graine=7&taille=54&q3d=2',1280,800,figer=12345)
        await attendre(pg,"typeof ECRAN!=='undefined'&&ECRAN==='aventure'&&(!V.m3||R3.actif)",delai=240)
        r=await pg.evaluate("""()=>{const h=herosDe(0)[0];return G.objs.filter(o=>Math.abs(o.x-h.x)<=9&&Math.abs(o.y-h.y)<=9).map(o=>[o.t,o.sous||o.b||o.res||o.cre||'',o.x-h.x,o.y-h.y]);}""")
        print(json.dumps(r,ensure_ascii=False))
        await nav.close()
asyncio.run(main())
