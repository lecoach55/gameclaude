import asyncio,json
from playwright.async_api import async_playwright
SK="()=>{const s=document.getElementById('story');if(s.style.display==='block'){s.querySelector('.sskip').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));}}"
MEAS="""async()=>{const d=G3._d();const gl=d.renderer.getContext(),px=new Uint8Array(4);d.renderer.info.autoReset=false;d.renderer.info.reset();const t0=performance.now();for(let i=0;i<6;i++){d.composer.render(.016);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);}return ((performance.now()-t0)/6).toFixed(1)+'ms calls='+(d.renderer.info.render.calls/6|0)+' tris='+(d.renderer.info.render.triangles/6|0)+' scene='+(d.rp.scene===d.scW?'W':'B')}"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':390,'height':780},device_scale_factor=1)
        await pg.goto('http://localhost:8765/index_local.html');await pg.wait_for_timeout(1500)
        await pg.evaluate("()=>{localStorage.setItem('vd_q','1')}")
        await pg.click('#nw');await pg.wait_for_function("window.VD&&VD.P",timeout=60000);await pg.wait_for_timeout(2500)
        for i in range(4): await pg.evaluate(SK);await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{VD.startFloor(9);VD.E.length=0;const r=VD.rooms[1];VD.P.x=r.x+r.w/2;VD.P.y=r.y+r.h/2;window.__paused=1;}");await pg.wait_for_timeout(2500)
        for i in range(3): await pg.evaluate(SK);await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{G3.setQuality(true);G3.render=()=>{};}")
        async def run(tag,js):
            await pg.evaluate("()=>{"+js+"}");await pg.evaluate(MEAS);print(tag,await pg.evaluate(MEAS))
        import sys
        if len(sys.argv)>1:
            await pg.evaluate("()=>{VD.startFloor(9);const e=VD.E.find(e=>!e.boss);VD.P.x=e.x;VD.P.y=e.y+.4;}")
            await pg.wait_for_timeout(5000);await pg.evaluate("()=>{G3.render=()=>{};}")
            await run('BATTLE full','')
            await run(' -bloom','G3._d().bloom.enabled=false')
            await run(' -bloom -grade','G3._d().grade.enabled=false')
            await run(' -fog','G3._d().BT.fogP.visible=false')
            await run(' -shadows','G3._d().renderer.shadowMap.enabled=false;G3._d().scB.traverse(o=>{if(o.material)o.material.needsUpdate=true})')
            await run(' -pointlights','G3._d().scB.traverse(o=>{if(o.isPointLight)o.visible=false});G3._d().scB.traverse(o=>{if(o.material)o.material.needsUpdate=true})')
            await b.close();return
        await run('EXPLO full','')
        await run(' -bloom','G3._d().bloom.enabled=false')
        await run(' -bloom -grade','G3._d().grade.enabled=false')
        await run(' -bloom -grade -fog','G3._d().EX.fogP.visible=false')
        await run(' -...-shadows','G3._d().renderer.shadowMap.enabled=false;G3._d().scW.traverse(o=>{if(o.material)o.material.needsUpdate=true})')
        await run(' -...-pointlights','G3._d().scW.traverse(o=>{if(o.isPointLight)o.visible=false});G3._d().scW.traverse(o=>{if(o.material)o.material.needsUpdate=true})')
        await run(' -...-smoke/particles','G3._d().scW.traverse(o=>{if(o.isPoints)o.visible=false})')
        await b.close()
asyncio.run(main())
