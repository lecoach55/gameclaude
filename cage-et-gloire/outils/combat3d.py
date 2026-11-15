#!/usr/bin/env python3
"""Soirée de combat en 3D : présentation, rounds, coin, ralenti d'un KO, résultat. python3 outils/combat3d.py page dossier"""
import sys,os,asyncio
from playwright.async_api import async_playwright
html=os.path.abspath(sys.argv[1]);out=sys.argv[2];os.makedirs(out,exist_ok=True)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
    pg=await b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+html);await pg.wait_for_timeout(4000);await pg.click('#bTest');await pg.wait_for_timeout(400)
    # chercher un combat dont l'issue est un KO (graine) pour tester le ralenti
    cid=await pg.evaluate("""(()=>{for(let w=0;w<40;w++){Moteur.avancer();if(G.popup)Moteur.choisir(0);for(const o of [...G.offres])if(o.type==='combat')Moteur.accepterCombat(o.id);
      for(const cid of G.aJouer){const t=Moteur.trouverCombat(cid);for(let k=0;k<60;k++){t.c.seed=1000+k;const s=Moteur.preparerSim(cid,'pression');if(s.res.m==='ko'||s.res.m==='tko'){t.c.plan='pression';return cid;}}}
      for(const cid of [...G.aJouer])Moteur.jouerMonCombat(cid,Moteur.preparerSim(cid,'equi'));}return null;})()""")
    print('combat',cid)
    await pg.evaluate("rendre()");await pg.evaluate(f"preCombat('{cid}')");await pg.wait_for_timeout(300);await pg.click('#bVoir')
    for i,t in enumerate([1000,2200,3000,3000]):
      await pg.wait_for_timeout(t);await pg.screenshot(path=f'{out}/intro{i}.png')
    await pg.evaluate("document.querySelector('#ctrl [data-v=\"2\"]').click()")
    k=0;rep=0
    for s in range(240):
      await pg.wait_for_timeout(500)
      if await pg.evaluate("!document.getElementById('coin').classList.contains('cache')"):await pg.click('#cGo')
      ban=await pg.evaluate("document.getElementById('banniere').textContent")
      if 'RALENTI' in ban and rep<3:rep+=1;await pg.wait_for_timeout(700);await pg.screenshot(path=f'{out}/ralenti{rep}.png')
      if s%20==0:k+=1;await pg.screenshot(path=f'{out}/c{k}.png')
      if await pg.evaluate("!!document.getElementById('rOk')"):break
    await pg.screenshot(path=f'{out}/resultat.png')
    await pg.evaluate("document.querySelector('#modal .boite').scrollTop=2000");await pg.wait_for_timeout(200);await pg.screenshot(path=f'{out}/resultat2.png')
    print('erreurs',errs[:6]);await b.close()
asyncio.run(main())
