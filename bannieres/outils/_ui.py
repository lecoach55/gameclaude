import asyncio,sys,os
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page
from playwright.async_api import async_playwright
JEU=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
async def main():
    base=serveur(JEU,8802)
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,base+'index.html?graine=7&taille=54&test=1',1280,800)
        await pg.wait_for_function("()=>typeof ECRAN!=='undefined'&&ECRAN==='aventure'&&!V.occupe&&(!V.m3||R3.actif)",timeout=240000)
        await pg.evaluate("()=>{ouvrirFiche(herosDe(0)[0]);}");await pg.wait_for_timeout(1200);await pg.screenshot(path='/tmp/ui_fiche.png')
        await pg.keyboard.press('Escape');await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{const v=villesDe(0)[0];for(const b of BAT_ORDRE)if(!BAT[b].unique)v.bat[b]=1;ouvrirVille(v);}");await pg.wait_for_timeout(15000)
        await pg.click('#vConstruire') if await pg.query_selector('#vConstruire') else None
        await pg.wait_for_timeout(800);await pg.screenshot(path='/tmp/ui_constr.png')
        await nav.close()
asyncio.run(main())
