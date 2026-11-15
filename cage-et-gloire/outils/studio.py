#!/usr/bin/env python3
"""Studio des poses de l'arène : une capture par pose (vue serrée). usage : python3 outils/studio.py build/index.html dossier [poses]"""
import sys,os,asyncio
from playwright.async_api import async_playwright
html=os.path.abspath(sys.argv[1]);out=sys.argv[2];os.makedirs(out,exist_ok=True)
P=(sys.argv[3].split(',') if len(sys.argv)>3 else ['garde','jab','cross','hook','upper','lowkick','bodykick','headkick','knee','shoot','sprawl','clinch','sol','solFrappe','soum','ko','victoire','arbitre'])
JS="""(n)=>{const A=Arene,P=A.POSES;const O=ORGS[4];const mk=i=>({id:'s'+i,sexe:'H',div:'mm',app:{peau:[1,4][i],chev:[2,0][i],cc:0,short:['#c1121f','#1d4ed8'][i],gant:'#111'}});
 A.preparer(O,[mk(0),mk(1)]);A.demarrer();const F=A.perso();const st=A.ST;st.pos='S';st.dist=1.35;st.ang=0;st.c.set(0,0,0);
 const pose={garde:['garde','garde'],jab:['jab','coupTete'],cross:['cross','bloque'],hook:['hook','esquive'],upper:['upper','coupCorps'],lowkick:['lowkick','coupJambe'],bodykick:['bodykick','coupCorps'],headkick:['headkick','coupTete'],knee:['knee','clinch'],
  shoot:['shoot','sprawl'],sprawl:['shoot','sprawl'],clinch:['clinch','clinch'],ko:['victoire','basKO'],victoire:['victoire','attente'],arbitre:['garde','garde'],sol:['haut','bas'],solFrappe:['hautFrappe','basProtege'],soum:['hautSoum','basProtege']}[n];
 if(n==='clinch'||n==='knee')st.pos='C';if(n==='sol'||n==='solFrappe'||n==='soum'){st.pos='G';st.top=0;}
 A.placer(true);F[0].idle=()=>P[pose[0]](0);F[1].idle=()=>P[pose[1]](0);F.forEach(h=>h.seq=[]);
 if(n==='ko'){F[1].ttilt=-Math.PI/2+.08;F[1].ty=.14;F[1].tilt=F[1].ttilt;}
 A.cam(n==='arbitre'?'large':n.startsWith('sol')||n==='soum'||n==='ko'?'sol':'serre');}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':640,'height':480})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+html);await pg.wait_for_timeout(5000)
    await pg.evaluate("document.getElementById('accueil').classList.add('cache')")
    for n in P:
      await pg.evaluate(JS,n);await pg.wait_for_timeout(2600);await pg.screenshot(path=f'{out}/{n}.png')
    print('erreurs',errs[:5]);await b.close()
asyncio.run(main())
