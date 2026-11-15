import asyncio,sys,json
from playwright.async_api import async_playwright
out=sys.argv[1];tabs=sys.argv[2].split(',')
SETUP="(()=>{localStorage.clear();A.create();UI.queue=[];document.getElementById('modal').classList.add('hidden');UI.modalOpen=false;S.cash+=40000;S.staff.recruteur={name:'Paul Girard',lvl:3,salary:300,age:40};UI.multiRun=true;UI.multiLog=[];for(let g=0;g<6;g++){UI.queue=[];UI.modalOpen=false;A.play();}UI.queue=[];UI.multiRun=false;UI.modalOpen=false;document.getElementById('modal').classList.add('hidden');})()"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        res={}
        for vw,tag in [((1280,900),'d'),((390,844),'m')]:
            pg=await b.new_page(viewport={'width':vw[0],'height':vw[1]});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto('file:///home/claude/president/index.html');await pg.wait_for_timeout(300)
            await pg.evaluate("Math.random=(()=>{let s=12345;return()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;}})()")
            await pg.evaluate(SETUP);await pg.wait_for_timeout(500)
            for t in tabs:
                await pg.evaluate(f"A.tab('{t}')");await pg.wait_for_timeout(350)
                await pg.screenshot(path=f'{out}/{t}_{tag}.png',full_page=(tag=='d'))
                if tag=='m': await pg.screenshot(path=f'{out}/{t}_{tag}_full.png',full_page=True)
            # mesure : temps de rendu d'un changement d'onglet
            ms=await pg.evaluate("(()=>{const t0=performance.now();for(let i=0;i<10;i++){A.tab('accueil');A.tab('classement');}return (performance.now()-t0)/20;})()")
            res[tag]={'err':errs,'tab_ms':round(ms,1)}
        print(json.dumps(res));await b.close()
asyncio.run(main())
