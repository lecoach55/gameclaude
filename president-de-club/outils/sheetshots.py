import asyncio,sys,json
from playwright.async_api import async_playwright
out=sys.argv[1]
SETUP="(()=>{localStorage.clear();A.create();UI.queue=[];document.getElementById('modal').classList.add('hidden');UI.modalOpen=false;UI.multiRun=true;UI.multiLog=[];for(let g=0;g<8;g++){UI.queue=[];UI.modalOpen=false;A.play();}UI.queue=[];UI.multiRun=false;UI.modalOpen=false;document.getElementById('modal').classList.add('hidden');})()"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        res={}
        for vw,tag in [((1280,900),'d'),((390,844),'m')]:
            pg=await b.new_page(viewport={'width':vw[0],'height':vw[1]});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto('file:///home/claude/president/index.html');await pg.wait_for_timeout(300)
            await pg.evaluate(SETUP);await pg.wait_for_timeout(300)
            await pg.evaluate("A.sheet(strength().xi.find(e=>e.slot==='A').p.id,'apercu')");await pg.wait_for_timeout(400)
            await pg.screenshot(path=f'{out}/sheet_{tag}.png')
            await pg.evaluate("document.getElementById('mbox').scrollTop=600");await pg.wait_for_timeout(200);await pg.screenshot(path=f'{out}/sheet2_{tag}.png');await pg.evaluate("(()=>{const b=[...document.querySelectorAll('#mbox button, #mbox .tabs *')].find(x=>/Carrière/.test(x.textContent));if(b)b.click();})()");await pg.wait_for_timeout(300);await pg.screenshot(path=f'{out}/sheet3_{tag}.png')
            await pg.screenshot(path=f'{out}/sheet2_{tag}.png')
            await pg.evaluate("closeModal();A.tab('finances')");await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'{out}/fin_{tag}.png',full_page=(tag=='d'))
            await pg.evaluate("A.tab('stats')");await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'{out}/stats_{tag}.png')
            ms=await pg.evaluate("(()=>{const id=S.players[0].id;const t0=performance.now();for(let i=0;i<10;i++){A.sheet(id);closeModal();}return (performance.now()-t0)/10;})()")
            res[tag]={'err':errs,'sheet_ms':round(ms,1)}
        print(json.dumps(res));await b.close()
asyncio.run(main())
