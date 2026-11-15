# Profil du combat : coût de chaque catégorie d'objets (on la masque, on mesure, on la remet)
import asyncio,json,sys
from playwright.async_api import async_playwright
SK="()=>{const s=document.getElementById('story');if(s.style.display==='block'){const k=s.querySelector('.sskip');if(k)k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));}}"
MEAS="""async(n)=>{const d=G3._d();const gl=d.renderer.getContext(),px=new Uint8Array(4);d.composer.render(.016);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);
 d.renderer.info.autoReset=false;d.renderer.info.reset();const ts=[];for(let i=0;i<n;i++){const t0=performance.now();d.composer.render(.016);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);ts.push(performance.now()-t0);}
 ts.sort((a,b)=>a-b);const r=d.renderer.info;const o={ms:+ts[n>>1].toFixed(1),calls:Math.round(r.render.calls/n),tris:Math.round(r.render.triangles/n),prog:r.programs.length,geo:r.memory.geometries,tex:r.memory.textures};d.renderer.info.autoReset=true;return o;}"""
CATS={
 'personnages':"o=>o.userData&&o.userData.__unit",
 'murs arène':"o=>o.children&&o.children[0]&&/^wall/.test(o.children[0].name||'')",
 'piliers':"o=>o.children&&o.children[0]&&/pillar|column/.test(o.children[0].name||'')",
 'rochers/décor':"o=>o.children&&o.children[0]&&/Rock|Grass|Bush|barrel|crate|box|keg|coin|chest|trunk|rubble|table|candle|banner/.test(o.children[0].name||'')",
 'sol (instancié)':"o=>o.isInstancedMesh",
 'effets transparents':"o=>o.material&&!Array.isArray(o.material)&&o.material.transparent",
 'sprites':"o=>o.isSprite",
 'points (particules)':"o=>o.isPoints",
}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg=await b.new_page(viewport={'width':390,'height':780})
        await pg.add_init_script("try{localStorage.clear();localStorage.setItem('vd_q2','1')}catch(e){}")
        await pg.goto('http://localhost:8765/index_local.html',timeout=180000);await pg.wait_for_timeout(1500)
        await pg.click('#nw',timeout=120000);await pg.wait_for_function("window.VD&&VD.P",timeout=60000);await pg.wait_for_timeout(2500)
        for i in range(4): await pg.evaluate(SK);await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{VD.P.story.push('prologue','biome0','biome1','biome2','biome3','pre0','pre1','pre2','pre3');Math.random=(()=>{let s=99;return()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;};})();VD.newGame(VD.P,4248);VD.startFloor(6);const e=VD.E.find(e=>!e.boss);VD.P.x=e.x;VD.P.y=e.y+.4;}")
        await pg.wait_for_timeout(7000)
        await pg.evaluate("()=>{const d=G3._d();d.BT.cine=null;d.BT.camT=9;for(const [u,R] of d.BT.units)R.root.userData.__unit=1;}")
        await pg.wait_for_timeout(1500)
        for i in range(2): await pg.evaluate(SK)
        base=await pg.evaluate(MEAS,8);print('base',base)
        for k,f in CATS.items():
            await pg.evaluate("(f)=>{const fn=eval(f);const d=G3._d();window.__h=[];d.scB.traverse(o=>{if(o!==d.scB&&o.visible&&fn(o)){o.visible=false;__h.push(o);}});}",f)
            m=await pg.evaluate(MEAS,8)
            n=await pg.evaluate("()=>__h.length")
            await pg.evaluate("()=>{__h.forEach(o=>o.visible=true);}")
            print(f'{k:22s} n={n:4d}  {m["ms"]:7.1f} ms ({m["ms"]-base["ms"]:+.1f})  appels {m["calls"]} ({m["calls"]-base["calls"]:+d})  tris {m["tris"]}')
        for k,js in [('ombres',"d.renderer.shadowMap.enabled=false;d.scB.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>m.needsUpdate=true)})"),('lumières ponctuelles',"d.scB.traverse(o=>{if(o.isPointLight)o.intensity=0})"),('étalonnage',"d.grade.enabled=false")]:
            m=await pg.evaluate("async(js)=>{const d=G3._d();eval(js);return 0}",js)
            m=await pg.evaluate(MEAS,8);print(f'{"sans "+k:22s}        {m["ms"]:7.1f} ms ({m["ms"]-base["ms"]:+.1f})')
        await pg.screenshot(path='/tmp/bprof.png');await b.close()
asyncio.run(main())
