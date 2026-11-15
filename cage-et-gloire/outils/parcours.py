#!/usr/bin/env python3
"""Parcours automatique : accueil → nouvelle carrière → onglets → offres → combat 3D → résultat. Captures dans le dossier donné.
usage : python3 outils/parcours.py build/index.html captures/ [l h]"""
import sys,os,asyncio,json
from playwright.async_api import async_playwright
page_html=os.path.abspath(sys.argv[1]);out=sys.argv[2];os.makedirs(out,exist_ok=True)
W=int(sys.argv[3]) if len(sys.argv)>3 else 390;H=int(sys.argv[4]) if len(sys.argv)>4 else 844
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':W,'height':H},device_scale_factor=1)
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append('console:'+m.text) if m.type=='error' else None)
    await pg.goto('file://'+page_html);await pg.wait_for_timeout(6000)
    await pg.screenshot(path=out+'/01_accueil.png')
    await pg.click('#bNouv');await pg.wait_for_timeout(300);await pg.click('#bGo');await pg.wait_for_timeout(600)
    await pg.screenshot(path=out+'/02_bienvenue.png');await pg.evaluate('fermerModal()')
    await pg.screenshot(path=out+'/03_ecurie.png')
    for v in ['combattants','ligues','salle','offres']:
      await pg.click(f'#nav [data-v="{v}"]');await pg.wait_for_timeout(300);await pg.screenshot(path=out+f'/04_{v}.png')
    # avancer jusqu'à obtenir une offre de combat, l'accepter
    for k in range(30):
      n=await pg.evaluate("G.offres.filter(o=>o.type==='combat').length")
      if n:break
      await pg.evaluate("avancer(1)");await pg.wait_for_timeout(150)
      await pg.evaluate("document.querySelectorAll('#modal [data-i]').forEach((b,i)=>{if(i===0)b.click()})")
    await pg.click('#nav [data-v="offres"]');await pg.wait_for_timeout(500);await pg.screenshot(path=out+'/05_offres.png')
    await pg.evaluate("G.offres.filter(o=>o.type==='combat').forEach(o=>Moteur.accepterCombat(o.id));rendre()")
    await pg.click('#nav [data-v="ecurie"]');await pg.wait_for_timeout(200)
    for k in range(20):
      if await pg.evaluate("G.aJouer.length"):break
      await pg.evaluate("avancer(1)");await pg.wait_for_timeout(150)
      await pg.evaluate("document.querySelectorAll('#modal [data-i]').forEach((b,i)=>{if(i===0)b.click()})")
    await pg.wait_for_timeout(600);print('precombat',await pg.evaluate('G.sem'),flush=True)
    await pg.screenshot(path=out+'/06_precombat.png')
    fid=await pg.evaluate("Moteur.mes()[0].id");
    ok=await pg.evaluate("!!document.getElementById('bVoir')")
    if ok:
      await pg.click('#bVoir');print('combat',flush=True)
      for i,t in enumerate([2500,3500,4000,4000,5000,6000]):
        await pg.wait_for_timeout(t);await pg.screenshot(path=out+f'/07_combat_{i}.png')
      # accélérer jusqu'à la fin
      await pg.evaluate("document.querySelector('#ctrl [data-v=\"4\"]').click()");print('x4',flush=True)
      for k in range(90):
        await pg.wait_for_timeout(1000)
        if await pg.evaluate("!document.getElementById('coin').classList.contains('cache')"):
          await pg.screenshot(path=out+'/08_coin.png');await pg.click('#cGo')
        if await pg.evaluate("!!document.getElementById('rOk')"):break
      await pg.screenshot(path=out+'/09_resultat.png');await pg.click('#rOk');await pg.wait_for_timeout(500)
    await pg.evaluate(f"fiche('{fid}')");await pg.wait_for_timeout(300);await pg.screenshot(path=out+'/10_fiche.png',full_page=False)
    st=await pg.evaluate("JSON.stringify({sem:G.sem,argent:G.argent,news:G.news.slice(0,4).map(n=>n.t),infos:Arene.infos()})")
    print(st);print('ERREURS',errs[:8])
    await b.close()
asyncio.run(main())
