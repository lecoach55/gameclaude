import asyncio
from playwright.async_api import async_playwright
async def handle(pg):
    for _ in range(6):
        if await pg.is_visible('#mEvent:not([hidden])'): await pg.click('#evDlg .choice:not([disabled])')
        elif await pg.is_visible('#mInfo:not([hidden])'): await pg.click('#infoDlg [data-close]')
        else: break
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg=await b.new_page(viewport={'width':1440,'height':1000})
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file:///home/claude/bourse6.html'); await pg.wait_for_timeout(500)
        await pg.evaluate("localStorage.removeItem('wallst-tuto')")
        await pg.screenshot(path='k0.png')
        await pg.click('#diffCaps label:nth-child(3)'); await pg.click('#sGo'); await pg.wait_for_timeout(900)
        await pg.screenshot(path='k1.png')
        for i in range(2): await pg.click('#coach [data-co=next]'); await pg.wait_for_timeout(350)
        await pg.screenshot(path='k2.png')
        await pg.click('#coach [data-co=skip]')
        await pg.click('#quick button[data-p=".25"]'); await pg.click('#bExec'); await handle(pg)
        await pg.click('#fStar')
        await pg.click('#modeSeg button[data-mode=cond]'); await pg.click('.side button[data-side=V]')
        await pg.fill('#qty','20'); await pg.click('#cQuick button[data-cq="0.1"]'); await pg.click('#bExec')
        await pg.click('.side button[data-side=V]'); await pg.click('#modeSeg button[data-mode=cond]'); await pg.fill('#qty','20'); await pg.click('#cQuick button[data-cq="-0.1"]'); await pg.click('#bExec')
        await pg.click('.side button[data-side=A]'); await pg.click('#modeSeg button[data-mode=cond]'); await pg.fill('#qty','5'); await pg.click('#cQuick button[data-cq="-0.05"]')
        await pg.evaluate("window.scrollTo(0,330)"); await pg.wait_for_timeout(300)
        await pg.screenshot(path='k3.png')
        await pg.evaluate("__wst.G.start=__wst.G.day-250")
        for k in range(4):
            if await pg.is_visible('#mInfo:not([hidden])'): break
            await pg.click('#bNext'); await pg.wait_for_timeout(150)
            if await pg.is_visible('#mEvent:not([hidden])'): await pg.click('#evDlg .choice:not([disabled])')
        await pg.wait_for_timeout(400)
        await pg.screenshot(path='k4.png')
        await handle(pg)
        for k in range(14): await pg.click('#bMonth'); await handle(pg)
        await pg.click('.tab[data-tab=missions]'); await pg.evaluate("window.scrollTo(0,700)"); await pg.wait_for_timeout(300); await pg.screenshot(path='k5.png')
        print(errs, await pg.evaluate("({orders:__wst.G.game.orders.length,prog:__wst.G.tx.filter(x=>x.prog).length,diff:__wst.G.game.diff,fav:Object.keys(__wst.G.game.fav)})"))
        await b.close()
asyncio.run(main())
