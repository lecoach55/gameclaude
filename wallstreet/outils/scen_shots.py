# Captures des feuilletons : fenêtre de pronostic, « À la une », graphique avec marques. python3 scen_shots.py [page] [dossier]
import asyncio,sys
from playwright.async_api import async_playwright
PAGE=sys.argv[1] if len(sys.argv)>1 else '/home/claude/bourse6.html'; OUT=sys.argv[2] if len(sys.argv)>2 else 'shots'
async def run(b,name,vp,mobile,dark):
    ctx=await b.new_context(viewport=vp,device_scale_factor=1,is_mobile=mobile,has_touch=mobile,color_scheme='dark' if dark else 'light')
    pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+PAGE);await pg.wait_for_timeout(400)
    await pg.evaluate("localStorage.setItem('wallst-tuto','1');document.querySelector('#bSound').click();__wst.newGame(50000)")
    async def clear():
        for _ in range(8):
            if await pg.is_visible('#mEvent:not([hidden])'): await pg.click('#evDlg .choice:not([disabled])')
            elif await pg.is_visible('#mInfo:not([hidden])'): await pg.click('#infoDlg [data-close]')
            else: break
    await pg.evaluate("__wst.setSel('AAPL');__wst.doTrade('A',50,true)")
    await pg.evaluate("__wst.step(5)");await clear()
    await pg.evaluate("const g=__wst.G.game;g.scen.next=__wst.G.day;g.scen.last=['elect','fda','opa','strike','tariff'].filter(k=>k!=='%s')"%('trial' if 'b' in name else 'elect'))
    await pg.evaluate("__wst.step(1)");await pg.wait_for_timeout(300)
    await pg.screenshot(path=f'{OUT}/{name}_pronostic.png')
    await pg.click('#evDlg .choice');await clear()
    for k in range(5):
        await pg.evaluate("__wst.step(5)");await clear()
    await pg.evaluate("document.querySelector('#recapCard').hidden=true;document.querySelector('#toasts').innerHTML=''")
    await pg.evaluate("window.scrollTo(0,0)");await pg.wait_for_timeout(300)
    await pg.locator('#une').scroll_into_view_if_needed();await pg.wait_for_timeout(200)
    await pg.locator('#une').screenshot(path=f'{OUT}/{name}_une.png')
    # aller jusqu'au dénouement
    for k in range(20):
        n=await pg.evaluate("__wst.G.game.scen.list.length");
        if not n: break
        await pg.evaluate("__wst.step(5)");await clear()
    await pg.evaluate("const s=__wst.G.news.filter(x=>x.scen&&x.tk).pop();if(s)__wst.setSel(s.tk)")
    await pg.evaluate("document.querySelector('#recapCard').hidden=true;document.querySelector('#toasts').innerHTML='';document.querySelector('#breaking').innerHTML=''")
    await pg.evaluate("__wst.step(1)");await clear();await pg.wait_for_timeout(200)
    await pg.evaluate("document.querySelector('#toasts').innerHTML='';document.querySelector('#breaking').innerHTML=''")
    await pg.locator('#cStock').scroll_into_view_if_needed();await pg.wait_for_timeout(200)
    await pg.locator('#cStock').locator('xpath=../..').screenshot(path=f'{OUT}/{name}_graph.png')
    print(name,'erreurs',errs[:3]);await ctx.close()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        await run(b,'pc',{'width':1440,'height':1000},False,False)
        await run(b,'tel_b',{'width':390,'height':844},True,False)
        await run(b,'pc_b_sombre',{'width':1440,'height':1000},False,True)
        await b.close()
asyncio.run(main())
