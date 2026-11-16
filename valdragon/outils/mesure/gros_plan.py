# Gros plan haute définition d une scène d exploration (matières de près). usage : python3 gros_plan.py étage sortie.png [zoom=1.6] [niveau=2] [statue]
import asyncio,sys
from playwright.async_api import async_playwright
SK="()=>{const s=document.getElementById('story');if(s&&s.style.display==='block'){const k=s.querySelector('.sskip');if(k)k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));}}"
async def main():
    F=int(sys.argv[1]);out=sys.argv[2];z=float(sys.argv[3]) if len(sys.argv)>3 else 1.6;lvl=int(sys.argv[4]) if len(sys.argv)>4 else 2
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg=await b.new_page(viewport={'width':600,'height':600},device_scale_factor=1)
        await pg.add_init_script("try{localStorage.clear();localStorage.setItem('vd_q2','%d')}catch(e){}window.__noAutoQ=1;"%lvl)
        await pg.goto('http://localhost:8765/index_local.html',timeout=180000);await pg.wait_for_timeout(1500)
        await pg.click('#nw');await pg.wait_for_function("window.VD&&VD.P");await pg.wait_for_timeout(2500)
        for i in range(4): await pg.evaluate(SK);await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{VD.P.story.push('prologue','biome0','biome1','biome2','biome3','pre0','pre1','pre2','pre3');}")
        await pg.evaluate(f"()=>{{G3.setLevel({lvl});Math.random=(()=>{{let s=99;return()=>{{s=(s*16807)%2147483647;return (s-1)/2147483646;}};}})();VD.newGame(VD.P,4242+{F});VD.startFloor({F});VD.E.length=0;const r=VD.rooms[1];VD.P.x=r.x+r.w/2;VD.P.y=r.y+r.h/2;G3.camZoom={z};document.querySelectorAll('#hud,.rb,#mm,#party,#bag,#act').forEach(e=>e.style.visibility='hidden');}}")
        await pg.wait_for_timeout(3000)
        if len(sys.argv)>5 and sys.argv[5]=='statue':
            await pg.evaluate("()=>{const p=G3._d().EX.pills.find(x=>x.children.length>1);if(p){const [x,y]=p.userData.c;for(const[dx,dy]of[[0,1],[0,-1],[1,0],[-1,0],[1,1],[0,2]]){const v=VD.at(x+dx,y+dy);if(v===1||v===2){VD.P.x=x+dx+.5;VD.P.y=y+dy+.5;break;}}}}")
            await pg.wait_for_timeout(3000)
        await pg.wait_for_timeout(2000)
        for i in range(2): await pg.evaluate(SK);await pg.wait_for_timeout(200)
        await pg.screenshot(path=out);await b.close()
asyncio.run(main())
