# Banc A/B Valdragon (avant/après dans la même minute) : pour chaque scène, ancienne puis nouvelle version (ordre alterné par passe).
# Appareil ordinateur (600x600, dpr 1.5), qualité fixée, graine fixe. Usage : banc_ab.py sortie.json passes niveaux [filtre]
import asyncio,json,sys,os
from playwright.async_api import async_playwright
URLS={'avant':'http://localhost:8766/index_local.html','apres':'http://localhost:8765/index_local.html'}
SK="()=>{const s=document.getElementById('story');if(s.style.display==='block'){const k=s.querySelector('.sskip');if(k)k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));}}"
MEAS="""async(n)=>{const d=G3._d();const gl=d.renderer.getContext(),px=new Uint8Array(4);d.composer.render(.016);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);
 d.renderer.info.autoReset=false;d.renderer.info.reset();const ts=[];for(let i=0;i<n;i++){const t0=performance.now();d.composer.render(.016);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);ts.push(performance.now()-t0);}
 ts.sort((a,b)=>a-b);const r=d.renderer.info;const o={ms:+ts[n>>1].toFixed(1),calls:Math.round(r.render.calls/n),tris:Math.round(r.render.triangles/n),prog:r.programs.length,geo:r.memory.geometries,tex:r.memory.textures};d.renderer.info.autoReset=true;return o;}"""
RAF="()=>{window.__fr=[];let l=performance.now();const f=t=>{window.__fr.push(t-l);l=t;if(window.__fr.length<2000)requestAnimationFrame(f)};requestAnimationFrame(f);}"
SCN=[('explo F2','explo',2),('explo F6','explo',6),('explo F10','explo',10),('explo F14','explo',14),
     ('combat F2','battle',2),('combat F6','battle',6),('combat F10','battle',10),('combat F14','battle',14),
     ('boss F4','boss',4),('boss F8','boss',8),('boss F12','boss',12),('boss F16','boss',16)]
async def one(b,url,lvl,kind,F,errs):
    pg=await b.new_page(viewport={'width':600,'height':600},device_scale_factor=1)
    pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    await pg.add_init_script("try{localStorage.clear();localStorage.setItem('vd_q2','%d');localStorage.setItem('vd_mute','1')}catch(e){}window.__noAutoQ=1;"%lvl)
    await pg.goto(url,timeout=180000);await pg.wait_for_timeout(1500)
    await pg.click('#nw',timeout=120000);await pg.wait_for_function("window.VD&&VD.P",timeout=60000);await pg.wait_for_timeout(2500)
    for i in range(4): await pg.evaluate(SK);await pg.wait_for_timeout(300)
    await pg.evaluate("()=>{VD.P.story.push('prologue','biome0','biome1','biome2','biome3','pre0','pre1','pre2','pre3');}")
    await pg.evaluate(f"()=>{{G3.setLevel({lvl});Math.random=(()=>{{let s=99;return()=>{{s=(s*16807)%2147483647;return (s-1)/2147483646;}};}})();VD.newGame(VD.P,4242+{F});VD.startFloor({F});}}")
    g={}
    if kind=='explo':
        await pg.evaluate("()=>{VD.E.length=0;const r=VD.rooms[1];VD.P.x=r.x+r.w/2;VD.P.y=r.y+r.h/2;}")
        await pg.wait_for_timeout(3500)
    else:
        await pg.wait_for_timeout(2500)
        p0=await pg.evaluate("()=>G3._d().renderer.info.programs.length")
        await pg.evaluate(RAF)
        await pg.evaluate("()=>{const e=VD.E.find(e=>"+("e.boss" if kind=='boss' else "!e.boss")+");VD.P.x=e.x;VD.P.y=e.y+(e.boss?1:.4);}")
        await pg.wait_for_timeout(5000)
        fr=await pg.evaluate("()=>window.__fr.slice()")
        p1=await pg.evaluate("()=>G3._d().renderer.info.programs.length")
        g={'prog_av':p0,'prog_ap':p1,'nouv_prog':p1-p0,'pire_img':round(max(fr) if fr else 0),'img_6s':len(fr)}
        await pg.evaluate("()=>{const d=G3._d();d.BT.cine=null;d.BT.camT=9;}")
        await pg.wait_for_timeout(1500)
    for i in range(2): await pg.evaluate(SK);await pg.wait_for_timeout(200)
    m=await pg.evaluate(MEAS,5);m.update(g)
    await pg.close();return m
async def main():
    out=sys.argv[1];passes=int(sys.argv[2]);levels=[int(x) for x in sys.argv[3].split(',')]
    only=sys.argv[4].split(',') if len(sys.argv)>4 else None
    res=json.load(open(out)) if os.path.exists(out) else {}
    errs=[]
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        for ps in range(passes):
            for lvl in levels:
                for tag,kind,F in SCN:
                    if only and not any(o==tag for o in only): continue
                    order=['avant','apres'] if (ps+len(res))%2==0 else ['apres','avant']
                    for v in order:
                        try: m=await one(b,URLS[v],lvl,kind,F,errs)
                        except Exception as e: m={'err':str(e)[:150]}
                        res.setdefault(f'{lvl}|{tag}',{}).setdefault(v,[]).append(m)
                        print(lvl,tag,v,m,flush=True)
                    json.dump(res,open(out,'w'),indent=1)
        await b.close()
    if errs: print('ERREURS',errs[:8])
asyncio.run(main())
