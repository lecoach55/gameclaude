# Gros plan haute définition d'une scène d'exploration, éventuellement centré sur un élément précis.
# usage : python3 gros_plan.py étage sortie.png [zoom=1.6] [niveau=2] [cible]
#   cible : statue | lave | glace | marchand | escalier | coffre | <nom de pièce> (ex. barrel_large, rubble_half)
#   l'outil cherche le premier élément de ce type sur l'étage, place le groupe à côté et masque l'interface.
import asyncio,sys
from playwright.async_api import async_playwright
import os as _os;VD_URL=_os.environ.get('VD_URL','http://localhost:8765/index_local.html')  # autre version du jeu : VD_URL=http://localhost:8766/index_local.html
SK="()=>{const s=document.getElementById('story');if(s&&s.style.display==='block'){const k=s.querySelector('.sskip');if(k)k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));}}"
FIND="""(cible)=>{const d=G3._d(),E=d.EX;let c=null;
 if(cible==='marchand')c=[VD.merch.x|0,VD.merch.y|0];else if(cible==='escalier')c=[VD.stairs.x,VD.stairs.y];
 else if(cible==='coffre'){const o=VD.obj.find(o=>o.t==='chest');if(o)c=[o.x|0,o.y|0];}
 else{const all=[...(E.pills||[]),...(E.props||[]),...(E.kprops||[])];
  const o=all.find(o=>o.userData.kind===cible)||all.find(o=>{let f=false;o.traverse(m=>{if(m.name===cible||(m.parent&&m.parent.name===cible))f=true;});return f;});if(o)c=o.userData.c;}
 if(!c)return 'introuvable';const [x,y]=c;for(const[dx,dy]of[[0,1],[1,1],[-1,1],[0,2],[1,0],[-1,0],[0,-1]]){const v=VD.at(x+dx,y+dy);if(v===1||v===2){VD.P.x=x+dx+.5;VD.P.y=y+dy+.5;return 'ok '+c;}}return 'pas de case libre';}"""
async def main():
    F=int(sys.argv[1]);out=sys.argv[2];z=float(sys.argv[3]) if len(sys.argv)>3 else 1.6;lvl=int(sys.argv[4]) if len(sys.argv)>4 else 2;cible=sys.argv[5] if len(sys.argv)>5 else None
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg=await b.new_page(viewport={'width':600,'height':600},device_scale_factor=1)
        await pg.add_init_script("try{localStorage.clear();localStorage.setItem('vd_q2','%d')}catch(e){}window.__noAutoQ=1;"%lvl)
        await pg.goto(VD_URL,timeout=180000);await pg.wait_for_timeout(1500)
        await pg.click('#nw');await pg.wait_for_function("window.VD&&VD.P");await pg.wait_for_timeout(2500)
        for i in range(4): await pg.evaluate(SK);await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{VD.P.story.push('prologue','biome0','biome1','biome2','biome3','pre0','pre1','pre2','pre3');}")
        await pg.evaluate(f"()=>{{G3.setLevel({lvl});Math.random=(()=>{{let s=99;return()=>{{s=(s*16807)%2147483647;return (s-1)/2147483646;}};}})();VD.newGame(VD.P,4242+{F});VD.startFloor({F});VD.E.length=0;const r=VD.rooms[1];VD.P.x=r.x+r.w/2;VD.P.y=r.y+r.h/2;G3.camZoom={z};document.querySelectorAll('#hud,.rb,#mm,#party,#bag,#act').forEach(e=>e.style.visibility='hidden');}}")
        await pg.wait_for_timeout(3000)
        if cible:
            print(cible,':',await pg.evaluate(FIND,cible));await pg.wait_for_timeout(3000)
        await pg.wait_for_timeout(2000)
        for i in range(2): await pg.evaluate(SK);await pg.wait_for_timeout(200)
        await pg.screenshot(path=out);await b.close()
asyncio.run(main())
