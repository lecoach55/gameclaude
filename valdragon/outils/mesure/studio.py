#!/usr/bin/env python3
"""Valdragon Studio — capture standardisée des scènes + mesure du coût de rendu.
usage: python3 studio.py [preset ...]   (défaut : all)
presets: title, explo0..3, battle0..3, boss0..3, fx, menu
Produit studio_<preset>.png et studio_sheet.png (planche) + temps de rendu par scène."""
import asyncio, sys, subprocess
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw

SK = "()=>{const s=document.getElementById('story');if(s.style.display==='block'){s.querySelector('.sskip').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));return 1}return 0}"
MEAS = """()=>{const d=G3._d();const gl=d.renderer.getContext(),px=new Uint8Array(4);d.renderer.info.autoReset=false;d.renderer.info.reset();
 const t0=performance.now();for(let i=0;i<3;i++){d.composer.render(.016);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);}
 const r={ms:(performance.now()-t0)/3,calls:d.renderer.info.render.calls/3|0,tris:d.renderer.info.render.triangles/3|0};d.renderer.info.autoReset=true;return r;}"""
FLOORS = [2, 6, 10, 14]
BOSS = [4, 8, 12, 16]
MONS = ['sq+ar+gob', 'sp+ch+gob', 'py+go+wy', 'sq+ar+wy']

async def skip(pg, n=4):
    for _ in range(n):
        await pg.evaluate(SK); await pg.wait_for_timeout(250)

async def fresh(b):
    pg = await b.new_page(viewport={'width': 390, 'height': 780}, device_scale_factor=1)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    await pg.goto('http://localhost:8765/index_local.html', timeout=180000); await pg.wait_for_timeout(1200)
    await pg.evaluate("()=>{try{localStorage.setItem('vd_q2','2')}catch(e){}}")
    return pg, errs

async def start(pg):
    await pg.click('#nw',timeout=120000); await pg.wait_for_function("window.VD&&VD.P", timeout=60000); await pg.wait_for_timeout(2500); await skip(pg)
    await pg.evaluate("()=>{VD.P.story.push('prologue','biome0','biome1','biome2','biome3','pre0','pre1','pre2','pre3');}")

async def shot(pg, name, wait=2500):
    await pg.wait_for_timeout(wait); await skip(pg, 2)
    m = await pg.evaluate(MEAS)
    await pg.screenshot(path=f'studio_{name}.png')
    return m

async def run(preset, b):
    pg, errs = await fresh(b)
    if preset == 'title':
        await pg.wait_for_timeout(2500); await pg.screenshot(path='studio_title.png'); m = {'ms': 0, 'calls': 0, 'tris': 0}
        return m, errs
    await start(pg)
    if preset == 'heroes':
        await pg.evaluate("()=>{VD.startFloor(2);const e=VD.E.find(e=>!e.boss);VD.P.x=e.x;VD.P.y=e.y+.4;}")
        await pg.wait_for_timeout(6000)
        await pg.evaluate("()=>{const d=G3._d();d.BT.focus=null;window.__cz=setInterval(()=>{const R=[...d.BT.units.values()].find(r=>r.kind==='hero');if(!R)return;const p=R.root.position;d.cam.position.set(p.x+1.6,1.5,p.z+2.4);d.cam.lookAt(p.x,.75,p.z);},16);}")
        return await shot(pg, 'heroes', 800), errs
    if preset in ('portraits','mons'):
        await pg.wait_for_timeout(1500)
        if preset=='mons': await pg.evaluate("()=>{window.PK=['mon:boss','fire','ice'];}")
        await pg.evaluate("()=>{document.body.innerHTML='';document.body.style.background='#222';for(const k of (window.PK||['guerrier','mage','rodeuse'])){const c=G3.portrait(k);c.style.width='190px';document.body.appendChild(c);}}")
        await pg.wait_for_timeout(800)
        await pg.screenshot(path='studio_'+preset+'.png'); return {'ms':0,'calls':0,'tris':0}, errs
    if preset == 'skills':
        await pg.evaluate("()=>{VD.startFloor(2);const e=VD.E.find(e=>!e.boss);VD.P.x=e.x;VD.P.y=e.y+.4;}")
        for i in range(30):
            await pg.wait_for_timeout(1500)
            if await pg.evaluate("()=>document.querySelectorAll('.sk').length>0"): break
        return await shot(pg, 'skills', 500), errs
    if preset == 'audit':
        await pg.wait_for_timeout(1500)
        keys=['guerrier','mage','rodeuse','mon:gob','mon:ch','mon:py','mon:sq','mon:ar','mon:sp','mon:go','mon:wy','mon:boss','borin','prop:barrel_large','prop:crates_stacked','prop:chest','prop:table_medium_decorated_A','prop:banner_patternA_red','prop:pillar','prop:candle_triple','prop:torch_lit','prop:keg_decorated','prop:trunk_large_A']
        r = await pg.evaluate('''(keys)=>{const out={};document.body.innerHTML='';document.body.style.cssText='margin:0;background:#1a1a1a;display:flex;flex-wrap:wrap;width:1170px';
         for(const k of keys){let c=null;try{c=G3.portrait(k);}catch(e){out[k]={err:String(e)};continue;}if(!c){out[k]={err:'null'};continue;}
          const g=c.getContext('2d'),W=c.width,H=c.height,d=g.getImageData(0,0,W,H).data;const L=new Float32Array(W*H),A=new Uint8Array(W*H);let n=0,sl=0,ss=0,sl2=0;
          for(let i=0;i<W*H;i++){const a=d[i*4+3];if(a<40)continue;const r=d[i*4]/255,gg=d[i*4+1]/255,b=d[i*4+2]/255;const mx=Math.max(r,gg,b),mn=Math.min(r,gg,b);const l=.2126*r+.7152*gg+.0722*b;L[i]=l;A[i]=1;n++;sl+=l;sl2+=l*l;ss+=mx>0?(mx-mn)/mx:0;}
          let hf=0,hn=0;for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(!A[i]||!A[i-1]||!A[i+1]||!A[i-W]||!A[i+W])continue;hf+=Math.abs(4*L[i]-L[i-1]-L[i+1]-L[i-W]-L[i+W]);hn++;}
          const m=sl/n;out[k]={lum:+m.toFixed(3),sat:+(ss/n).toFixed(3),con:+Math.sqrt(Math.max(0,sl2/n-m*m)).toFixed(3),hf:+(hf/Math.max(1,hn)).toFixed(4),cov:+(n/(W*H)).toFixed(2)};
          const w=document.createElement('div');w.style.cssText='width:195px;color:#ddd;font:10px sans-serif';c.style.width='190px';w.appendChild(c);w.appendChild(document.createTextNode(k));document.body.appendChild(w);}
         return out;}''',keys)
        import json as _j;open('audit.json','w').write(_j.dumps(r,indent=1));await pg.set_viewport_size({'width':1170,'height':1100});await pg.wait_for_timeout(500);await pg.screenshot(path='studio_audit.png',full_page=True)
        return {'ms':0,'calls':0,'tris':0}, errs
    if preset == 'xinfo':
        await pg.evaluate("()=>{VD.startFloor(2);const e=VD.E.find(e=>!e.boss);VD.P.x=e.x;VD.P.y=e.y+.4;}")
        await pg.wait_for_timeout(7000)
        r = await pg.evaluate("()=>{const d=G3._d();const res=[];d.scB.traverse(o=>{if(o.isSkinnedMesh){const m=o.material;res.push([o.name,m.type,m.customProgramCacheKey&&m.customProgramCacheKey(),'map',!!m.map,m.map&&m.map.image&&m.map.image.width,'nm',!!m.normalMap,m.normalScale&&m.normalScale.x,'col',m.color.getHexString(),'met',m.metalness,'r',m.roughness,'tr',m.transparent,m.opacity,'vc',m.vertexColors].join(' '));}});return res.filter(x=>/_[0-9]+ /.test(x)).slice(0,20)}")
        print('\n'.join(r)); return {'ms':0,'calls':0,'tris':0}, errs
    if preset.startswith('explo'):
        t = int(preset[-1]); F = FLOORS[t]
        await pg.evaluate(f"()=>{{VD.startFloor({F});VD.E.length=0;const r=VD.rooms[1];VD.P.x=r.x+r.w/2;VD.P.y=r.y+r.h/2;}}")
        return await shot(pg, preset, 3000), errs
    if preset.startswith('battle'):
        t = int(preset[-1]); F = FLOORS[t]; ks = MONS[t]
        await pg.evaluate(f"()=>{{VD.startFloor({F});const e=VD.E.find(e=>!e.boss);const ks='{ks}'.split('+');e.k=ks[0];e.mem=ks;e.cnt=ks.length;e.elite=null;e.mods=[];VD.P.x=e.x;VD.P.y=e.y+.4;}}")
        return await shot(pg, preset, 6500), errs
    if preset.startswith('boss'):
        t = int(preset[-1]); F = BOSS[t]
        await pg.evaluate(f"()=>{{VD.P.lvl={F}+2;VD.calcAll();VD.startFloor({F});const e=VD.E.find(e=>e.boss);VD.P.x=e.x;VD.P.y=e.y+1;}}")
        return await shot(pg, preset, int(__import__('os').environ.get('BW','7000'))), errs
    if preset == 'fx':
        await pg.evaluate("()=>{VD.startFloor(6);const e=VD.E.find(e=>!e.boss);VD.P.x=e.x;VD.P.y=e.y+.4;}")
        await pg.wait_for_timeout(6000)
        await pg.evaluate("()=>{const f=VD.B.foes,h=VD.P.heroes;G3.FX.explode(f[0],0xff8a2a,1.4);G3.FX.projectile(h[1],f[f.length-1],0x9fe0ff,3,'orb');f[0].st.burn=3;if(f[1])f[1].st.poison=3;G3.flash(.15);}")
        return await shot(pg, 'fx', 1200), errs
    if preset == 'bag':
        await pg.evaluate("()=>{for(let i=0;i<14;i++)VD.P.bag.push(VD.mkItem(3+i*2,i%4));document.getElementById('bBag').click();}")
        await pg.wait_for_timeout(600)
        await pg.evaluate("()=>{const b=[...document.querySelectorAll('button')].find(b=>/Sac/.test(b.textContent));if(b)b.click();}")
        return await shot(pg, 'bag', 1200), errs
    if preset == 'menu':
        await pg.evaluate("()=>document.getElementById('bBag').click()")
        return await shot(pg, 'menu', 1200), errs
    raise SystemExit('preset inconnu ' + preset)

async def main():
    subprocess.run(['./srv.sh'])
    presets = sys.argv[1:] or ['title', 'explo0', 'explo1', 'explo2', 'explo3', 'battle0', 'battle1', 'battle2', 'battle3', 'boss0', 'boss1', 'boss2', 'boss3', 'fx']
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        res = {}
        sem = asyncio.Semaphore(1)
        async def one(pr):
            async with sem:
                try:
                    m, errs = await run(pr, b); res[pr] = (m, errs)
                except Exception as e:
                    res[pr] = ({'ms': -1, 'calls': 0, 'tris': 0}, [str(e)[:200]])
        await asyncio.gather(*[one(p_) for p_ in presets])
        await b.close()
    ims = []
    for pr in presets:
        m, errs = res[pr]
        print(f"{pr:8s} {m['ms']:7.1f} ms  calls={m['calls']:4d} tris={m['tris']:7d}  {'ERR '+errs[0] if errs else ''}")
        try:
            im = Image.open(f'studio_{pr}.png').convert('RGB').resize((260, 520))
            d = ImageDraw.Draw(im); d.rectangle([0, 0, 260, 18], fill=(0, 0, 0)); d.text((4, 3), f"{pr}  {m['ms']:.0f}ms {m['tris']//1000}k", fill=(255, 220, 120))
            ims.append(im)
        except Exception:
            pass
    cols = min(7, len(ims)); rows = (len(ims) + cols - 1) // cols
    sheet = Image.new('RGB', (260 * cols, 520 * rows), (20, 20, 20))
    for i, im in enumerate(ims):
        sheet.paste(im, ((i % cols) * 260, (i // cols) * 520))
    sheet.save('studio_sheet.png')

if __name__=='__main__':
    asyncio.run(main())
