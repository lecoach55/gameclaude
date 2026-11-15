import asyncio
from playwright.async_api import async_playwright
SEASON="(()=>{S.cash+=1e6;S.staff.recruteur={name:'Paul Girard',lvl:3,salary:300,age:40};UI.multiRun=true;UI.multiLog=[];let g=0;while(!S.seasonOver&&g<60){UI.queue=[];UI.modalOpen=false;A.play();g++;}UI.queue=[];UI.modalOpen=false;UI.multiRun=false;showSeasonEnd();})()"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        for vw,tag in [((1280,900),'d'),((390,844),'m')]:
            pg=await b.new_page(viewport={'width':vw[0],'height':vw[1]});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto('file:///home/claude/president/index.html');await pg.wait_for_timeout(300)
            await pg.evaluate("localStorage.clear();A.create();UI.queue=[];document.getElementById('modal').classList.add('hidden');UI.modalOpen=false;")
            await pg.evaluate(SEASON);await pg.wait_for_timeout(2500)
            el=await pg.query_selector('.bxgrid')
            if el: await el.scroll_into_view_if_needed()
            await pg.screenshot(path=f'/home/claude/shots7/bilan_{tag}.png')
            print(tag,errs)
        await b.close()
asyncio.run(main())
