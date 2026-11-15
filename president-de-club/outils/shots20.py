import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        for vw,tag in [((1280,900),'d'),((390,844),'m')]:
            pg=await b.new_page(viewport={'width':vw[0],'height':vw[1]});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto('file:///home/claude/president/index.html');await pg.wait_for_timeout(300)
            await pg.evaluate("localStorage.clear();A.create();UI.queue=[];document.getElementById('modal').classList.add('hidden');UI.modalOpen=false;S.autoReport=false;")
            await pg.evaluate("A.play()");await pg.wait_for_timeout(600)
            await pg.evaluate("A.skipRep&&A.skipRep()");await pg.wait_for_timeout(600)
            el=await pg.query_selector('.motm')
            if el: await el.scroll_into_view_if_needed()
            await pg.screenshot(path=f'/home/claude/shots7/rep_{tag}.png')
            print(tag,errs, bool(el))
        await b.close()
asyncio.run(main())
