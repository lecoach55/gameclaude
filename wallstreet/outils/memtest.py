import asyncio,json
from playwright.async_api import async_playwright
YEAR=r"""
async ()=>{const W=__wst;const G=()=>W.G;const s=G().day;
 function resolve(){for(let k=0;k<8;k++){const ev=document.querySelector('#mEvent:not([hidden])'),inf=document.querySelector('#mInfo:not([hidden])');if(ev){[...ev.querySelectorAll('.choice:not([disabled])')].pop().click();}else if(inf){inf.querySelector('[data-close]').click();}else break;}}
 while(G().day-s<252){W.step(5);resolve();}
 const g=G();return{day:g.day-g.start,heap:performance.memory?Math.round(performance.memory.usedJSHeapSize/1e6):0,dom:document.getElementsByTagName('*').length,size:Math.round(JSON.stringify(g).length/1000),news:g.news.length,tx:g.tx.length,msgs:g.game.msgs.length,hist:g.game.hist.length,pend:g.game.pend.length,toasts:document.querySelectorAll('.toast').length,fw:0};}
"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--enable-precise-memory-info'])
        pg=await b.new_page(viewport={'width':1280,'height':900})
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('crash',lambda:print('CRASH'))
        await pg.goto('file:///home/claude/bourse6.html');await pg.wait_for_timeout(400)
        await pg.evaluate("document.querySelector('#bSound').click();__wst.newGame(50000)")
        for y in range(10):
            r=await pg.evaluate(YEAR);print(r,flush=True)
        print(errs[:3])
        await b.close()
asyncio.run(main())
