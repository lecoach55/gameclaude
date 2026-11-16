# Vue d'ensemble d'un étage (outil) : tout l'étage révélé, caméra reculée, brouillard allégé.
# Sert à juger l'architecture et l'habillage des salles (éboulis, mobilier, bannières…).
# usage : python3 vue_haute.py sortie.png [étages=2,6,10,14] [recul=0.42] [niveau=1]
import asyncio,sys
from playwright.async_api import async_playwright
from PIL import Image
import os as _os;VD_URL=_os.environ.get('VD_URL','http://localhost:8765/index_local.html')  # autre version du jeu : VD_URL=http://localhost:8766/index_local.html
SK="()=>{const s=document.getElementById('story');if(s&&s.style.display==='block'){const k=s.querySelector('.sskip');if(k)k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));}}"
async def main():
    out=sys.argv[1];FL=[int(x) for x in (sys.argv[2] if len(sys.argv)>2 else '2,6,10,14').split(',')];Z=float(sys.argv[3]) if len(sys.argv)>3 else .42;lvl=int(sys.argv[4]) if len(sys.argv)>4 else 1
    ims=[]
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        for F in FL:
            pg=await b.new_page(viewport={'width':700,'height':700})
            await pg.add_init_script("try{localStorage.clear();localStorage.setItem('vd_q2','%d')}catch(e){}window.__noAutoQ=1;"%lvl)
            await pg.goto(VD_URL,timeout=180000);await pg.wait_for_timeout(1500)
            await pg.click('#nw');await pg.wait_for_function("window.VD&&VD.P");await pg.wait_for_timeout(2500)
            for i in range(4): await pg.evaluate(SK);await pg.wait_for_timeout(300)
            await pg.evaluate("()=>{VD.P.story.push('prologue','biome0','biome1','biome2','biome3','pre0','pre1','pre2','pre3');}")
            await pg.evaluate(f"()=>{{Math.random=(()=>{{let s=99;return()=>{{s=(s*16807)%2147483647;return (s-1)/2147483646;}};}})();VD.newGame(VD.P,4242+{F});VD.startFloor({F});}}")
            await pg.evaluate("()=>{VD.E.length=0;const r=VD.rooms[1];VD.P.x=r.x+r.w/2;VD.P.y=r.y+r.h/2;}");await pg.wait_for_timeout(2500)
            await pg.evaluate(f"()=>{{VD.seen.fill(1);if(VD.vis)VD.vis.fill(1);G3.camZoom={Z};const d=G3._d();if(d.scW.fog)d.scW.fog.density*=.35;document.querySelectorAll('#hud,.rb,#mm,#party,#bag,#act').forEach(e=>e.style.visibility='hidden');}}")
            await pg.wait_for_timeout(3500)
            for i in range(2): await pg.evaluate(SK);await pg.wait_for_timeout(200)
            f=f'/tmp/vh_{F}.png';await pg.screenshot(path=f);ims.append(Image.open(f).convert('RGB'));await pg.close()
        await b.close()
    w,h=ims[0].size;c=Image.new('RGB',(w*min(2,len(ims)),h*((len(ims)+1)//2)))
    for i,im in enumerate(ims):c.paste(im,((i%2)*w,(i//2)*h))
    c.save(out);print('ok',out)
asyncio.run(main())
