# Captures de référence à vues fixes (graine fixe) pour compare.py — usage : python3 refs.py fichier.html dossier
import asyncio,sys,os
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import navigateur,page,capturer
from playwright.async_api import async_playwright
SEED="(()=>{let a=777;Math.random=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})()"
async def main():
    url='file://'+os.path.abspath(sys.argv[1]);d=sys.argv[2]
    async with async_playwright() as p:
        nav=await navigateur(p)
        for nom,(w,h) in {'telephone':(390,780),'portable':(1180,720),'grand':(1440,900)}.items():
            pg=await page(nav,url,w,h);await pg.add_init_script(SEED);await pg.goto(url);await pg.wait_for_timeout(700)
            await pg.click('#go');await pg.wait_for_timeout(2800)
            await pg.evaluate("()=>{document.querySelectorAll('*').forEach(e=>e.getAnimations&&e.getAnimations().forEach(a=>a.finish()))}")
            await capturer(pg,f'{d}/{nom}.png')
            await pg.evaluate("()=>{vb={x:150,y:150,w:VB0.w/2.6,h:0};applyVB()}");await pg.wait_for_timeout(300)
            await capturer(pg,f'{d}/{nom}_zoom.png');await pg.close()
        await nav.close()
asyncio.run(main())
