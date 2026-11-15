import asyncio
from playwright.async_api import async_playwright
exec(open('shots6.py').read().split('async def main')[0])
TABS=['accueil','calendrier','classement','stats','effectif','mercato','staff','infra','finances','coupe','club']
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        errs=[]
        for name,vp,setup in [('r2d',{'width':1280,'height':900},False),('l1m',{'width':390,'height':844},True)]:
            pg=await b.new_page(viewport=vp);pg.on('pageerror',lambda e:errs.append(name+': '+str(e)))
            await pg.goto('file:///home/claude/president/index.html');await pg.wait_for_timeout(300)
            await pg.evaluate("A.create()");await pg.evaluate(CLICK);await pg.wait_for_timeout(1200)
            if setup: await pg.evaluate(SETUP)
            for i in range(6):
                await pg.evaluate(CLICK);await pg.evaluate("S.autoReport=true;A.play()");await pg.wait_for_timeout(120)
            await pg.evaluate(CLICK);await pg.wait_for_timeout(1500)
            await pg.evaluate("UI.queue=[];document.getElementById('modal').classList.add('hidden');UI.modalOpen=false;")
            for t in TABS:
                await pg.evaluate(f"A.tab('{t}')");await pg.wait_for_timeout(150)
                ov=await pg.evaluate("document.documentElement.scrollWidth>window.innerWidth+2")
                if ov: errs.append(name+' débordement horizontal: '+t)
                if name=='l1m': await pg.screenshot(path=f'/home/claude/shots6/m_{t}.png')
            await pg.close()
        print(errs);await b.close()
asyncio.run(main())
