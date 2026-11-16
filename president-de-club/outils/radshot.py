import asyncio
from playwright.async_api import async_playwright
SETUP="(()=>{localStorage.clear();A.create();UI.queue=[];document.getElementById('modal').classList.add('hidden');UI.modalOpen=false;UI.multiRun=true;UI.multiLog=[];for(let g=0;g<8;g++){UI.queue=[];UI.modalOpen=false;A.play();}UI.queue=[];UI.multiRun=false;UI.modalOpen=false;document.getElementById('modal').classList.add('hidden');})()"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        for vw,tag in [((1280,900),'d'),((390,844),'m')]:
            pg=await b.new_page(viewport={'width':vw[0],'height':vw[1]})
            await pg.goto('file:///home/claude/president/index.html');await pg.wait_for_timeout(300)
            await pg.evaluate(SETUP)
            await pg.evaluate("A.sheet(strength().xi.find(e=>e.slot==='A').p.id,'apercu')");await pg.wait_for_timeout(400)
            await pg.evaluate("document.querySelector('#mbox .radwrap').scrollIntoView({block:'start'})");await pg.wait_for_timeout(200)
            await pg.screenshot(path=f'/home/claude/night/apres/radar_{tag}.png')
        await b.close()
asyncio.run(main())
