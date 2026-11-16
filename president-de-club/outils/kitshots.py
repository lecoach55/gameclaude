import asyncio,sys,json
from playwright.async_api import async_playwright
out=sys.argv[1]
SETUP="(()=>{localStorage.clear();A.create();UI.queue=[];document.getElementById('modal').classList.add('hidden');UI.modalOpen=false;UI.multiRun=true;UI.multiLog=[];for(let g=0;g<6;g++){UI.queue=[];UI.modalOpen=false;A.play();}UI.queue=[];UI.multiRun=false;UI.modalOpen=false;document.getElementById('modal').classList.add('hidden');})()"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        res={}
        for vw,tag in [((1280,900),'d'),((390,844),'m')]:
            pg=await b.new_page(viewport={'width':vw[0],'height':vw[1]});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto('file:///home/claude/president/index.html');await pg.wait_for_timeout(300)
            await pg.evaluate(SETUP);await pg.wait_for_timeout(300)
            await pg.evaluate("A.tab('club')");await pg.wait_for_timeout(300)
            el=await pg.query_selector('text=Maillots et écusson')
            if el: await el.scroll_into_view_if_needed()
            await pg.screenshot(path=f'{out}/kit_{tag}.png')
            await pg.evaluate("A.tab('infra')");await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'{out}/infra1_{tag}.png')
            await pg.evaluate("Object.assign(S.infra,{stade:6,eclairage:3,pelouse:3,loges:2,commerce:4,entrainement:4,formation:3});render()");await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'{out}/infra6_{tag}.png')
            await pg.evaluate("A.tab('effectif')");await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'{out}/eff_{tag}.png')
            await pg.evaluate("A.tab('classement')");await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'{out}/cls_{tag}.png')
            ms=await pg.evaluate("(()=>{const t0=performance.now();for(let i=0;i<10;i++){A.tab('effectif');A.tab('infra');}return (performance.now()-t0)/20;})()")
            res[tag]={'err':errs,'tab_ms':round(ms,1)}
        print(json.dumps(res));await b.close()
asyncio.run(main())
