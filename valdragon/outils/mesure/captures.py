# Captures de référence reproductibles (graine fixe) : mêmes scènes que le banc perf.py
# usage : python3 captures.py dossier [niveau]
import asyncio,sys,os
from playwright.async_api import async_playwright
SK="()=>{const s=document.getElementById('story');if(s&&s.style.display==='block'){const k=s.querySelector('.sskip');if(k)k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));}}"
SCN=[('explo_F2','explo',2),('explo_F6','explo',6),('explo_F10','explo',10),('explo_F14','explo',14),('combat_F6','battle',6),('boss_F8','boss',8)]
async def one(b,out,lvl,tag,kind,F):
    pg=await b.new_page(viewport={'width':390,'height':780})
    await pg.add_init_script("try{localStorage.clear();localStorage.setItem('vd_q2','%d')}catch(e){}window.__noAutoQ=1;"%lvl)
    await pg.goto('http://localhost:8765/index_local.html',timeout=180000);await pg.wait_for_timeout(1500)
    await pg.click('#nw',timeout=120000);await pg.wait_for_function("window.VD&&VD.P",timeout=60000);await pg.wait_for_timeout(2500)
    for i in range(4): await pg.evaluate(SK);await pg.wait_for_timeout(300)
    await pg.evaluate("()=>{VD.P.story.push('prologue','biome0','biome1','biome2','biome3','pre0','pre1','pre2','pre3');}")
    await pg.evaluate(f"()=>{{G3.setLevel({lvl});Math.random=(()=>{{let s=99;return()=>{{s=(s*16807)%2147483647;return (s-1)/2147483646;}};}})();VD.newGame(VD.P,4242+{F});VD.startFloor({F});}}")
    if kind=='explo':
        await pg.evaluate("()=>{VD.E.length=0;const r=VD.rooms[1];VD.P.x=r.x+r.w/2;VD.P.y=r.y+r.h/2;}");await pg.wait_for_timeout(4000)
    else:
        await pg.evaluate("()=>{const e=VD.E.find(e=>"+("e.boss" if kind=='boss' else "!e.boss")+");VD.P.x=e.x;VD.P.y=e.y+(e.boss?1:.4);}")
        await pg.wait_for_timeout(6000);await pg.evaluate("()=>{const d=G3._d();d.BT.cine=null;d.BT.camT=9;}");await pg.wait_for_timeout(5000)
    for i in range(2): await pg.evaluate(SK);await pg.wait_for_timeout(200)
    await pg.screenshot(path=os.path.join(out,tag+'.png'));await pg.close()
async def main():
    out=sys.argv[1];lvl=int(sys.argv[2]) if len(sys.argv)>2 else 1;os.makedirs(out,exist_ok=True)
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        for tag,kind,F in SCN:
            await one(b,out,lvl,tag,kind,F);print('capture',tag,flush=True)
        await b.close()
asyncio.run(main())
