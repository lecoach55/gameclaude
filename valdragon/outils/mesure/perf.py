# Banc de mesure reproductible : même donjon (graine fixe), mêmes vues, niveaux de qualité 1 et 2.
# Sortie : temps moyen par image (rendu logiciel = indicateur relatif du coût GPU), appels, triangles, programmes.
import asyncio,json,sys,os,statistics as S
from playwright.async_api import async_playwright
SK="()=>{const s=document.getElementById('story');if(s.style.display==='block'){const k=s.querySelector('.sskip');if(k)k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));}}"
MEAS="""async(n)=>{const d=G3._d();const gl=d.renderer.getContext(),px=new Uint8Array(4);d.composer.render(.016);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);
 d.renderer.info.autoReset=false;d.renderer.info.reset();const ts=[];for(let i=0;i<n;i++){if(window.__SHALL)d.renderer.shadowMap.needsUpdate=true;const t0=performance.now();d.composer.render(.016);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);ts.push(performance.now()-t0);}
 ts.sort((a,b)=>a-b);const r=d.renderer.info;const o={ms:+ts[n>>1].toFixed(1),calls:Math.round(r.render.calls/n),tris:Math.round(r.render.triangles/n),prog:r.programs.length,geo:r.memory.geometries,tex:r.memory.textures};d.renderer.info.autoReset=true;return o;}"""
SCN=[('explo F2','explo',2),('explo F6','explo',6),('explo F10','explo',10),('explo F14','explo',14),('combat F6','battle',6),('boss F8','boss',8)]
async def main():
    out=sys.argv[1] if len(sys.argv)>1 else 'perf.json'
    levels=[int(x) for x in (sys.argv[2] if len(sys.argv)>2 else '1,2').split(',')]
    only=sys.argv[3].split(',') if len(sys.argv)>3 else None
    res={}
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        errs=[]
        for lvl in levels:
            for tag,kind,F in SCN:
                if only and not any(o in tag for o in only): continue
                pg=await b.new_page(viewport={'width':390,'height':780},device_scale_factor=1)
                pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
                await pg.add_init_script("try{localStorage.clear();localStorage.setItem('vd_q2','%d')}catch(e){}window.__noAutoQ=1;"%lvl)
                await pg.goto('http://localhost:8765/index_local.html',timeout=180000);await pg.wait_for_timeout(1500)
                await pg.click('#nw',timeout=120000);await pg.wait_for_function("window.VD&&VD.P",timeout=60000);await pg.wait_for_timeout(2500)
                for i in range(4): await pg.evaluate(SK);await pg.wait_for_timeout(300)
                await pg.evaluate("()=>{VD.P.story.push('prologue','biome0','biome1','biome2','biome3','pre0','pre1','pre2','pre3');}")
                await pg.evaluate(f"()=>{{G3.setLevel({lvl});Math.random=(()=>{{let s=99;return()=>{{s=(s*16807)%2147483647;return (s-1)/2147483646;}};}})();VD.newGame(VD.P,4242+{F});VD.startFloor({F});}}")
                if kind=='explo':
                    await pg.evaluate("()=>{VD.E.length=0;const r=VD.rooms[1];VD.P.x=r.x+r.w/2;VD.P.y=r.y+r.h/2;}")
                    await pg.wait_for_timeout(3500)
                else:
                    await pg.evaluate("()=>{const e=VD.E.find(e=>"+("e.boss" if kind=='boss' else "!e.boss")+");VD.P.x=e.x;VD.P.y=e.y+(e.boss?1:.4);}")
                    await pg.wait_for_timeout(6000)
                    await pg.evaluate("()=>{const d=G3._d();d.BT.cine=null;d.BT.camT=9;}")
                    await pg.wait_for_timeout(1500)
                for i in range(2): await pg.evaluate(SK);await pg.wait_for_timeout(200)
                if os.environ.get('SHALL'): await pg.evaluate('()=>{window.__SHALL=1}')
                m=await pg.evaluate(MEAS,10)
                await pg.screenshot(path=f'/tmp/perf_{lvl}_{tag.replace(" ","_")}.png')
                res[f'{lvl}|{tag}']=m;print(lvl,tag,m,flush=True)
                await pg.close()
        await b.close()
    json.dump(res,open(out,'w'),indent=1)
    if errs: print('ERREURS',errs[:5])
asyncio.run(main())
