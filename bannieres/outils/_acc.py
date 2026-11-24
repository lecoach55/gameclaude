import asyncio,sys,os
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page
from playwright.async_api import async_playwright
JEU=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
async def main():
    base=serveur(JEU,8803)
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,base+'index.html',1280,800)
        await pg.wait_for_timeout(25000);await pg.screenshot(path='/tmp/acc2.png')
        await nav.close()
asyncio.run(main())
