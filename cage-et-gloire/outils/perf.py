#!/usr/bin/env python3
"""Banc de fluidité de l'arène (reproductible) : python3 outils/perf.py page sortie.json [qualite]
Mesure ms/image (rendu logiciel : comparer avant/après, pas en absolu), appels de dessin, triangles, pour 3 scènes."""
import sys,os,asyncio,json
from playwright.async_api import async_playwright
html=os.path.abspath(sys.argv[1]);out=sys.argv[2];Q=sys.argv[3] if len(sys.argv)>3 else ''
SC={'large':"Arene.ST.pos='S';Arene.ST.dist=1.5;Arene.placer(true);Arene.cam('large');",
 'echanges':"Arene.cam('serre');let i=0;window._t=setInterval(()=>{Arene.action({k:['jab','cross','hook','lowkick'][i++%4],a:i%2,h:1,z:'tete',pos:'S'});},700);",
 'sol':"clearInterval(window._t);Arene.action({k:'td',a:0,h:1,pos:'G0'});window._t=setInterval(()=>Arene.action({k:'gnp',a:0,h:1,pos:'G0'}),900);"}
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':771,'height':755},device_scale_factor=2)
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    PX=os.environ.get('PX')
    if PX: await pg.add_init_script(f'window.PX={PX}')
    if Q: await pg.add_init_script(f"localStorage.setItem('cg-qual','{Q}')")
    await pg.goto('file://'+html);await pg.wait_for_timeout(5000)
    await pg.evaluate("""()=>{document.getElementById('accueil').classList.add('cache');Math.random=(()=>{let s=1;return()=>(s=(s*16807)%2147483647)/2147483647;})();
      const O=ORGS[4];const mk=i=>({id:'p'+i,sexe:'H',div:'mm',app:{peau:[1,4][i],chev:[2,0][i],cc:0,short:['#c1121f','#1d4ed8'][i],gant:'#111'}});Arene.preparer(O,[mk(0),mk(1)]);Arene.demarrer();if(window.PX&&Arene.fixer)Arene.fixer(window.PX);}""")
    res={}
    for n,js in SC.items():
      await pg.evaluate(js);await pg.wait_for_timeout(int(os.environ.get('ATT','1500')))
      r=await pg.evaluate("""()=>new Promise(res=>{const a=[];let l=performance.now();const t0=l;function f(t){a.push(t-l);l=t;if(t-t0<5000)requestAnimationFrame(f);else{a.shift();a.sort((x,y)=>x-y);res({ms:+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1),med:+a[a.length>>1].toFixed(1),max:+a[a.length-1].toFixed(0),n:a.length,info:Arene.infos(),px:Arene.px&&Arene.px()});}}requestAnimationFrame(f);})""")
      res[n]=r;print(n,r,flush=True)
    json.dump({'res':res,'erreurs':errs},open(out,'w'),indent=1);print('erreurs',errs[:3]);await b.close()
asyncio.run(main())
