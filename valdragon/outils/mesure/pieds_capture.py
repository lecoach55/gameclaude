import asyncio,sys,json
sys.path.insert(0,'/home/claude/t3d')
import studio
from playwright.async_api import async_playwright
# Suivi des pieds pendant une marche : glissement du pied d'appui, hauteur minimale, régularité
JS_SETUP=r"""()=>{VD.E.length=0;const fl=v=>v>=1&&v<=4;let best=null,bl=0;
 for(let y=1;y<VD.H-1;y++){let run=0;for(let x=1;x<VD.W-1;x++){if(fl(VD.at(x,y))){run++;if(run>bl){bl=run;best=[x-run+1,y];}}else run=0;}}
 VD.P.x=best[0]+.5;VD.P.y=best[1]+.5;window.__run=bl;
 const d=G3._d();window.__REC=[];const r0=G3.render;
 G3.render=(t,dt)=>{const out={t:performance.now(),dt,party:[]};d.EX.party.forEach((R,i)=>{const f=[];R.model.traverse(b=>{if(b.isBone&&/(LeftFoot|RightFoot|LeftToeBase|RightToeBase)$/.test(b.name)){const v=b.getWorldPosition(d.cam.position.clone());f.push([b.name.replace('mixamorig',''),+v.x.toFixed(4),+v.y.toFixed(4),+v.z.toFixed(4)]);}});
   out.party.push({x:+R.root.position.x.toFixed(4),z:+R.root.position.z.toFixed(4),f});});__REC.push(out);if(window.__RENDER)r0(t,dt);};
 return bl;}"""
async def m():
    render=len(sys.argv)>1 and sys.argv[1]=='r'
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg,errs=await studio.fresh(b); await studio.start(pg)
        await pg.evaluate("()=>VD.startFloor(2)"); await pg.wait_for_timeout(2500)
        bl=await pg.evaluate(JS_SETUP); print('couloir',bl)
        if render: await pg.evaluate("()=>{window.__RENDER=1}")
        await pg.wait_for_timeout(800)
        await pg.evaluate("()=>{__REC.length=0;G3.setYaw(0);}")
        await pg.keyboard.down('d'); await pg.wait_for_timeout(3500); await pg.keyboard.up('d'); await pg.wait_for_timeout(1200)
        rec=await pg.evaluate("()=>__REC")
        json.dump(rec,open('/tmp/feet.json','w')); print('frames',len(rec)); await b.close()
asyncio.run(m())
