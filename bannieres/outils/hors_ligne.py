# La page construite (un seul fichier) fonctionne-t-elle hors ligne, ouverte par double-clic ?
import asyncio,os
from playwright.async_api import async_playwright
F=os.path.abspath(os.path.join(os.path.dirname(__file__),'../build/bannieres.html'))
async def main():
    async with async_playwright() as p:
        nav=await p.chromium.launch();ctx=await nav.new_context(offline=True);pg=await ctx.new_page();err=[];pg.on('pageerror',lambda e:err.append(str(e)))
        await pg.goto('file://'+F);await pg.wait_for_timeout(800);await pg.click('#bTest');await pg.wait_for_function("()=>ECRAN==='aventure'",timeout=60000)
        print('hors ligne OK, jour',await pg.evaluate('G.jour'),'erreurs',err);await nav.close()
asyncio.run(main())
