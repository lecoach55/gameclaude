# Plus longue image figée à l'entrée en combat et à l'arrivée sur un étage (longues tâches du fil principal)
import asyncio,sys
from playwright.async_api import async_playwright
SK="()=>{const s=document.getElementById('story');if(s&&s.style.display==='block'){const k=s.querySelector('.sskip');if(k)k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));}}"
async def m():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg=await b.new_page(viewport={'width':390,'height':780})
        await pg.add_init_script("try{localStorage.clear();localStorage.setItem('vd_q2','1')}catch(e){}")
        await pg.goto('http://localhost:8765/index_local.html',timeout=180000);await pg.wait_for_timeout(1500)
        await pg.click('#nw',timeout=120000);await pg.wait_for_function("window.VD&&VD.P",timeout=60000);await pg.wait_for_timeout(2500)
        for i in range(4): await pg.evaluate(SK);await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{VD.P.story.push('prologue','biome0','biome1','biome2','biome3','pre0','pre1','pre2','pre3');window.__lt=[];new PerformanceObserver(l=>l.getEntries().forEach(e=>__lt.push(Math.round(e.duration)))).observe({entryTypes:['longtask']});}")
        await pg.wait_for_timeout(1500)
        for tag,js in [('étage 6',"VD.startFloor(6);VD.E.length=0;"),('combat',"const e=VD.E.find(e=>!e.boss)||null;"),('étage 8',"VD.startFloor(8);"),('boss',"")]:
            if tag=='combat': await pg.evaluate("()=>{VD.startFloor(6);}");await pg.wait_for_timeout(4000);await pg.evaluate("()=>{__lt.length=0;const e=VD.E.find(e=>!e.boss);VD.P.x=e.x;VD.P.y=e.y+.4;}")
            elif tag=='boss': await pg.evaluate("()=>{__lt.length=0;const e=VD.E.find(e=>e.boss);VD.P.x=e.x;VD.P.y=e.y+1;}")
            else: await pg.evaluate("()=>{__lt.length=0;"+js+"}")
            for i in range(10): await pg.wait_for_timeout(600);await pg.evaluate(SK)
            lt=await pg.evaluate("()=>__lt.slice()")
            print(f'{tag:8s} plus long blocage {max(lt) if lt else 0} ms · total bloqué {sum(lt)} ms · {len(lt)} blocages')
            if tag in('combat','boss'): await pg.evaluate("()=>{if(VD.B){VD.B.over='win';VD.closeBattle();}}");await pg.wait_for_timeout(1500)
        await b.close()
asyncio.run(m())
