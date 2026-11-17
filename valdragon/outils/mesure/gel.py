# Gel au changement de qualité, en TEMPS RÉEL (le banc à temps figé ne le voit pas).
# Scénario du Mac de Victor : partie démarrée en Normale, puis passage en Haute (bouton ✨ ou banc 🧪), puis nouvel étage.
# Mesure, après chaque changement : plus longue image (écart entre deux rAF), plus longue tâche bloquante,
# délai jusqu'à la 1re image vraiment dessinée (appels > 0), programmes avant/après, programmes compilés APRÈS
# la préparation (= compilés en synchrone pendant le jeu : doit être 0).
# usage : python3 gel.py sortie.json [url]   (VD_URL ou 2e argument ; défaut http://localhost:8765/index_local.html)
import asyncio,json,sys,os
from playwright.async_api import async_playwright
URL=sys.argv[2] if len(sys.argv)>2 else os.environ.get('VD_URL','http://localhost:8765/index_local.html')
SK="()=>{const s=document.getElementById('story');if(s&&s.style.display==='block'){const k=s.querySelector('.sskip');if(k)k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));}}"
SONDE="""()=>{window.__gel={gaps:[],lt:[],fr:[]};const g=window.__gel;let l=0;const f=t=>{if(l)g.gaps.push([t,t-l]);l=t;requestAnimationFrame(f);};requestAnimationFrame(f);
 try{new PerformanceObserver(L=>{for(const e of L.getEntries())g.lt.push([e.startTime,e.duration]);}).observe({entryTypes:['longtask']});}catch(e){}
 const R=G3._d().renderer,o=G3.render;G3.render=function(t,dt){const f0=R.info.render.frame,p0=R.info.programs.length,t0=performance.now();const r=o(t,dt);
  g.fr.push([t0,performance.now()-t0,R.info.render.frame>f0?1:0,R.info.programs.length-p0]);return r;};}"""
ETAT="()=>{const d=G3._d();return {prog:d.renderer.info.programs.length,niveau:G3.level}}"
# fr = [début, durée, image dessinée ?, programmes créés pendant l'appel]
LIRE="""(t0)=>{const g=window.__gel;const gp=g.gaps.filter(x=>x[0]>=t0),lt=g.lt.filter(x=>x[0]+x[1]>=t0),fr=g.fr.filter(x=>x[0]>=t0);
 const des=fr.filter(x=>x[2]),pre=fr.filter(x=>!x[2]);const first=des[0];
 return {pire_image_ms:Math.round(Math.max(0,...gp.map(x=>x[1]))),pire_tache_ms:Math.round(Math.max(0,...lt.map(x=>x[1]))),
  attente_ms:first?Math.round(first[0]-t0):null,premiere_image_ms:first?Math.round(first[1]):null,pire_image_dessinee_ms:Math.round(Math.max(0,...des.map(x=>x[1]))),
  prog_prepares:pre.reduce((a,x)=>a+x[3],0),prog_compiles_en_jeu:des.reduce((a,x)=>a+x[3],0),appels_render:fr.length,images_dessinees:des.length}}"""
async def etape(pg,nom,js,res,ms=9000):
    t0=await pg.evaluate("()=>performance.now()")
    p0=await pg.evaluate(ETAT)
    await pg.evaluate(js)
    await pg.wait_for_timeout(ms)
    r=await pg.evaluate(LIRE,t0);r['prog_avant']=p0['prog'];res[nom]=r;print(nom,r,flush=True)
async def main():
    out=sys.argv[1] if len(sys.argv)>1 else 'gel.json'
    res={}
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':600,'height':600},device_scale_factor=1.5)
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
        await pg.add_init_script("try{localStorage.clear();localStorage.setItem('vd_mute','1')}catch(e){}window.__noAutoQ=1;")
        await pg.goto(URL,timeout=180000);await pg.wait_for_function("document.getElementById('nw')&&window.G3&&G3.isReady()",timeout=180000)
        res['ext_parallele']=await pg.evaluate("()=>!!G3._d().renderer.extensions.has('KHR_parallel_shader_compile')")
        await pg.evaluate("()=>{G3.setLevel(1)}")  # comme le panneau de 449 px : départ en Normale
        await pg.click('#nw');await pg.wait_for_function("window.VD&&VD.P&&VD.rooms",timeout=90000);await pg.wait_for_timeout(2500)
        for i in range(6): await pg.evaluate(SK);await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{VD.P.story.push('prologue','biome0','biome1','biome2','biome3','pre0','pre1','pre2','pre3');VD.E.length=0;}")
        await pg.wait_for_timeout(6000)
        await pg.evaluate(SONDE)
        await etape(pg,'1 Normale→Haute (même étage)',"()=>{G3.setLevel(2)}",res)
        await etape(pg,'2 nouvel étage 2 en Haute',"()=>{VD.startFloor(2);VD.E.length=0;const r=VD.rooms[1];VD.P.x=r.x+r.w/2;VD.P.y=r.y+r.h/2;}",res)
        await etape(pg,'3 Haute→Maximale',"()=>{G3.setLevel(3)}",res)
        await etape(pg,'4 Maximale→Économie',"()=>{G3.setLevel(0)}",res,6000)
        res['erreurs']=errs
        await b.close()
    json.dump(res,open(out,'w'),indent=1,ensure_ascii=False)
asyncio.run(main())
