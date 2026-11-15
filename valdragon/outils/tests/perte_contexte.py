import asyncio
from PIL import Image,ImageStat
def lum(f): return round(ImageStat.Stat(Image.open(f).convert('L')).mean[0],1)
from playwright.async_api import async_playwright
SK="()=>{const s=document.getElementById('story');if(s&&s.style.display==='block'){const k=s.querySelector('.sskip');if(k)k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));}}"
LUM="()=>{const c=G3._d().renderer.domElement,t=document.createElement('canvas');t.width=60;t.height=120;const x=t.getContext('2d');x.drawImage(c,0,0,60,120);const d=x.getImageData(0,0,60,120).data;let s=0;for(let i=0;i<d.length;i+=4)s+=d[i]+d[i+1]+d[i+2];return Math.round(s/(d.length/4)/3)}"
async def m():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg=await b.new_page(viewport={'width':390,'height':780})
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
        await pg.add_init_script("try{localStorage.clear();localStorage.setItem('vd_q2','1')}catch(e){}")
        await pg.goto('http://localhost:8765/index_local.html',timeout=180000);await pg.wait_for_timeout(1500)
        await pg.click('#nw');await pg.wait_for_function("window.VD&&VD.P");await pg.wait_for_timeout(2500)
        for i in range(4): await pg.evaluate(SK);await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{VD.P.story.push('prologue','biome0','biome1','biome2','biome3','pre0','pre1','pre2','pre3');VD.startFloor(6);}")
        await pg.wait_for_timeout(5000)
        for sc in ['explo','combat']:
            if sc=='combat':
                await pg.evaluate("()=>{const e=VD.E.find(e=>!e.boss);VD.P.x=e.x;VD.P.y=e.y+.4;}")
                for i in range(12): await pg.wait_for_timeout(600);await pg.evaluate(SK)
            await pg.evaluate("()=>{window.__x=G3._d().renderer.getContext().getExtension('WEBGL_lose_context');}")
            await pg.screenshot(path=f'/tmp/lost_{sc}_a.png');print(sc,'avant',lum(f'/tmp/lost_{sc}_a.png'))
            await pg.evaluate("()=>__x.loseContext()");await pg.wait_for_timeout(1000)
            await pg.evaluate("()=>__x.restoreContext()");await pg.wait_for_timeout(6000)
            await pg.screenshot(path=f'/tmp/lost_{sc}_b.png');print(sc,'après',lum(f'/tmp/lost_{sc}_b.png'),'perdu',await pg.evaluate("()=>G3.lost"),'message',await pg.evaluate("()=>{const d=document.getElementById('glLost');return d?d.style.display:'-'}"))
        print('erreurs',errs[:5])
        await b.close()
asyncio.run(m())
