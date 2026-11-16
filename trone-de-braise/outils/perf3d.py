# Banc du combat 3D : appels, triangles, img/s relatives. python3 perf3d.py crypte,mine sortie.json [vd|nous]  (vd = ancienne arène Valdragon)
import asyncio,sys,json
sys.path.insert(0,'/home/claude/gameclaude/outils-communs')
from atelier import serveur,navigateur,page,mesurer
from playwright.async_api import async_playwright
TY=sys.argv[1].split(',')
async def m():
  base=serveur('/home/claude/gameclaude/trone-de-braise/build',8781)
  async with async_playwright() as p:
    nav=await navigateur(p);pg=await page(nav,base+'donjon3d.html',560,350)
    await pg.add_script_tag(path='/home/claude/gameclaude/trone-de-braise/donjon3d/pont.js')
    await pg.wait_for_function("()=>window.__expe&&window.G3&&G3.isReady()",timeout=180000)
    await pg.evaluate("v=>{window.__noAutoQ=1;window.__salleVD=v}",sys.argv[3]=='vd')
    res={}
    for ty in TY:
      await pg.evaluate("t=>{Math.random=(()=>{let s=7;return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646;};})();const c=PONT3D.configExpedition({heros:{classe:'chevalier',nom:'E',niveau:6,equip:{}},type:t,niveau:6,etages:3,arene:t==='arene'?{n:8}:null});c.combat={mem:['gob','gob','sq']};window.__expe.debut(c)}",ty)
      await pg.wait_for_timeout(9000)
      info=await pg.evaluate("async()=>{const d=G3._d(),r=d.renderer;r.info.autoReset=false;r.info.reset();await new Promise(q=>requestAnimationFrame(()=>requestAnimationFrame(q)));const o={appels:r.info.render.calls,triangles:r.info.render.triangles,progs:r.info.programs.length};r.info.autoReset=true;return o;}")
      f=await mesurer(pg,4000);info.update(f);res[ty]=info;print(ty,info)
      await pg.evaluate("()=>window.__expe.fin('fuite')");await pg.wait_for_timeout(500)
    json.dump(res,open(sys.argv[2],'w'),indent=1)
asyncio.run(m())
