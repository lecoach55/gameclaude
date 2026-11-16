# Décompose les appels de dessin d une scène (ombres, objets groupés par nom ou géométrie) : python3 appels.py explo|combat|boss étage [niveau]
import asyncio,json,sys,os
from playwright.async_api import async_playwright
URL=os.environ.get('VD_URL','http://localhost:8765/index_local.html')
SK="()=>{const s=document.getElementById('story');if(s.style.display==='block'){const k=s.querySelector('.sskip');if(k)k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));}}"
kind=sys.argv[1];F=int(sys.argv[2]);lvl=int(sys.argv[3]) if len(sys.argv)>3 else 1
JS="""()=>{const d=G3._d(),THREE=d.THREE,r=d.renderer,sc=d.rp.scene,cam=d.rp.camera||d.cam;const out={};
 const one=(tag,f)=>{f&&f();r.info.autoReset=false;r.info.reset();r.shadowMap.needsUpdate=true;d.composer.render(.016);out[tag]=r.info.render.calls;r.info.autoReset=true;};
 one('total');const sh=r.shadowMap.enabled;r.shadowMap.autoUpdate=false;r.info.autoReset=false;r.info.reset();d.composer.render(.016);out['sans maj ombres']=r.info.render.calls;r.info.autoReset=true;
 // objets visibles groupés
 const fr=new THREE.Frustum(),m=new THREE.Matrix4();const c=d.rp.camera||d.cam;c.updateMatrixWorld();m.multiplyMatrices(c.projectionMatrix,c.matrixWorldInverse);fr.setFromProjectionMatrix(m);
 const g={};let lights=[];sc.traverseVisible(o=>{if(o.isLight){lights.push(o.type+(o.castShadow?'*':''));return;}if(!(o.isMesh||o.isPoints||o.isLine||o.isSprite))return;if(o.frustumCulled&&o.geometry&&!o.isSkinnedMesh&&!fr.intersectsObject(o))return;
  let a=o;const names=[];while(a&&a!==sc){if(a.name)names.push(a.name);a=a.parent;}const k=(names.length?'':'«'+(o.geometry&&o.geometry.type)+' v'+(o.geometry&&o.geometry.attributes.position?o.geometry.attributes.position.count:0)+' '+(o.material&&o.material.color?o.material.color.getHexString():'')+' parent:'+(o.parent&&o.parent.type)+'/'+(o.parent&&o.parent.children.length)+'» ')+(o.isSkinnedMesh?'[skin] ':'')+(o.isInstancedMesh?'[inst] ':'')+(names.slice(-2).join('/')||o.material&&o.material.type||'?');const n=Array.isArray(o.material)?o.material.length:1;g[k]=(g[k]||0)+n;});
 out.lights=lights;out.groupes=Object.entries(g).sort((a,b)=>b[1]-a[1]).slice(0,45);return out;}"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':390,'height':780},device_scale_factor=1)
        await pg.add_init_script("try{localStorage.clear();localStorage.setItem('vd_q2','%d')}catch(e){}window.__noAutoQ=1;"%lvl)
        await pg.goto(URL,timeout=180000);await pg.wait_for_timeout(1500)
        await pg.click('#nw',timeout=120000);await pg.wait_for_function("window.VD&&VD.P",timeout=60000);await pg.wait_for_timeout(2500)
        for i in range(4): await pg.evaluate(SK);await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{VD.P.story.push('prologue','biome0','biome1','biome2','biome3','pre0','pre1','pre2','pre3');}")
        await pg.evaluate(f"()=>{{G3.setLevel({lvl});VD.newGame(VD.P,4242+{F});VD.startFloor({F});}}")
        if kind=='explo':
            await pg.evaluate("()=>{VD.E.length=0;const r=VD.rooms[1];VD.P.x=r.x+r.w/2;VD.P.y=r.y+r.h/2;}");await pg.wait_for_timeout(3500)
        else:
            await pg.evaluate("()=>{const e=VD.E.find(e=>"+("e.boss" if kind=='boss' else "!e.boss")+");VD.P.x=e.x;VD.P.y=e.y+(e.boss?1:.4);}")
            await pg.wait_for_timeout(6000);await pg.evaluate("()=>{const d=G3._d();d.BT.cine=null;d.BT.camT=9;}");await pg.wait_for_timeout(1500)
        for i in range(2): await pg.evaluate(SK);await pg.wait_for_timeout(200)
        has=await pg.evaluate("()=>typeof THREE!=='undefined'")
        if not has: print('THREE non global');
        r=await pg.evaluate(JS)
        print(json.dumps({k:v for k,v in r.items() if k!='groupes'},ensure_ascii=False))
        for k,v in r['groupes']: print(f'{v:4d}  {k}')
        await b.close()
asyncio.run(main())
