# Test : sauvegarde locale puis reprise après rechargement (même date, même trésor).
import asyncio,sys
sys.path.insert(0,'/home/claude/gameclaude/outils-communs')
from atelier import serveur
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        serveur('/home/claude/gameclaude/sedes-petri/jeu',8771); pg = await b.new_page(viewport={'width':1400,'height':860})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8771/index.html'); await pg.wait_for_timeout(2500)
        await pg.evaluate("localStorage.setItem('sp_welcome','1')")
        await pg.click('[data-scen="1198"]'); await pg.click('#stStart'); await pg.wait_for_timeout(900)
        for i in range(3):
            await pg.evaluate("UI.warned=true"); await pg.click('#endTurn'); await pg.wait_for_timeout(2200)
            for k in range(10):
                if await pg.is_visible('#modal'):
                    el = await pg.query_selector('[data-opt]:not([disabled]),[data-cont],[data-close]')
                    if el: await el.click(); await pg.wait_for_timeout(300)
        y1 = await pg.evaluate("dateStr()+' '+S.treasury")
        await pg.reload(); await pg.wait_for_timeout(2500)
        await pg.click('#stLoad'); await pg.wait_for_timeout(800)
        y2 = await pg.evaluate("dateStr()+' '+S.treasury")
        await pg.evaluate("UI.warned=true"); await pg.click('#endTurn'); await pg.wait_for_timeout(2500)
        print(y1, '|', y2, errs); await b.close()
asyncio.run(main())
