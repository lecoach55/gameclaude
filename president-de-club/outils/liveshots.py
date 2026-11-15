import asyncio,sys,json
from playwright.async_api import async_playwright
out=sys.argv[1]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        res={}
        for vw,tag in [((1280,900),'d'),((390,844),'m')]:
            pg=await b.new_page(viewport={'width':vw[0],'height':vw[1]});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto('file:///home/claude/president/index.html');await pg.wait_for_timeout(300)
            await pg.evaluate("localStorage.clear();A.create();UI.queue=[];document.getElementById('modal').classList.add('hidden');UI.modalOpen=false;S.autoReport=false;")
            await pg.evaluate("A.play()");await pg.wait_for_timeout(1800)
            await pg.evaluate("document.getElementById('rsLive').scrollIntoView({block:'center'})");await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'{out}/live1_{tag}.png')
            await pg.evaluate("UI.rep&&UI.rep.live&&liveGoal(UI.rep.live,true,'Lucas Moreau')");await pg.wait_for_timeout(500)
            await pg.screenshot(path=f'{out}/live_goal_{tag}.png')
            await pg.wait_for_timeout(2200)
            await pg.evaluate("UI.rep&&UI.rep.live&&typeof liveChance==='function'&&(liveChance(UI.rep.live,'occ',UI.rep.d.home),liveMsg(UI.rep.live,'Occasion · Valentin Henry trouve le poteau'))");await pg.wait_for_timeout(450)
            await pg.screenshot(path=f'{out}/live_occ_{tag}.png')
            ms=await pg.evaluate("(()=>{const M=UI.rep&&UI.rep.live;if(!M)return -1;const t0=performance.now();for(let i=0;i<300;i++){liveStep(M,1/60);liveDraw(M);}return (performance.now()-t0)/300;})()")
            res[tag]={'err':errs,'ms_image':round(ms,3)}
        print(json.dumps(res));await b.close()
asyncio.run(main())
