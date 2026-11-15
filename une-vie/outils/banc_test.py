# Vérifie le mode test (🧪) et le bouton 🐞 dans le navigateur local (sans base : envoi non fait, c'est normal)
import asyncio,sys
from playwright.async_api import async_playwright
from scenes import serveur,navigateur,page,BUILD
async def main():
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,serveur(BUILD,8790)+'index.html')
        await pg.wait_for_timeout(800)
        await pg.click("text=🧪 Mode test");await pg.wait_for_timeout(65000)
        txt=await pg.evaluate("()=>[...document.querySelectorAll('.end .row')].map(r=>r.innerText.replace(/\\n/g,' : '))")
        print("\n".join(txt))
        print("localStorage mesures:",bool(await pg.evaluate("()=>localStorage.getItem('une-vie_mesures')")))
        r=await pg.evaluate("()=>TK.signaler()");print("signalement (sans base):",r, "erreurs:",pg.erreurs[:3])
        await nav.close()
asyncio.run(main())
