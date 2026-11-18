#!/usr/bin/env python3
"""Anciennes parties : joue N semaines sur l'ancienne page (sauvegarde locale), recharge la NOUVELLE page sur la même sauvegarde,
« Continuer », puis joue encore (soirées ouvertes au doigt, résultat immédiat). Vérifie : rien de perdu, aucune erreur.
usage : python3 outils/anciennes.py ancienne.html nouvelle.html [semaines=40] [capture.png]"""
import sys,os,asyncio,json
from playwright.async_api import async_playwright
old=os.path.abspath(sys.argv[1]);new=os.path.abspath(sys.argv[2]);N=int(sys.argv[3]) if len(sys.argv)>3 else 40;capt=sys.argv[4] if len(sys.argv)>4 else '/tmp/anciennes.png'
JOUE="""for(const o of [...G.offres])if(o.type==='combat')Moteur.accepterCombat(o.id);"""
async def semaines(pg,n,doigt=False):
  for i in range(n):
    await pg.evaluate("avancer(1);0");await pg.wait_for_timeout(120)
    for j in range(5):
      if not await pg.evaluate("!!document.querySelector('#modal [data-i]')"):break
      await pg.evaluate("document.querySelector('#modal [data-i]').click()");await pg.wait_for_timeout(80)
    await pg.evaluate(JOUE)
    if await pg.evaluate("G.aJouer.length"):
      if doigt:
        await pg.evaluate("fermerModal();preCombat(G.aJouer[0])");await pg.wait_for_timeout(250)
        await pg.evaluate("document.getElementById('bSim').click()");await pg.wait_for_timeout(250)
        if await pg.evaluate("!!document.getElementById('rOk')"):await pg.click('#rOk')
      await pg.evaluate("for(const c of [...G.aJouer])Moteur.jouerMonCombat(c,Moteur.preparerSim(c,'equi'));fermerModal()")
    await pg.evaluate("sauver()")
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files'])
    ctx=await b.new_context(viewport={'width':390,'height':844});pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+old);await pg.wait_for_timeout(3000)
    await pg.click('#bNouv');await pg.wait_for_timeout(200);await pg.click('#bGo');await pg.wait_for_timeout(300);await pg.evaluate('fermerModal()')
    await semaines(pg,N);await pg.wait_for_timeout(800)
    av=json.loads(await pg.evaluate("JSON.stringify({sem:G.sem,arg:Math.round(G.argent),n:Object.keys(G.F).length,mes:Moteur.mes().length,v:G.stats.v,d:G.stats.d,rival:!!G.rival})"))
    errs_old=list(errs)
    await pg.goto('file://'+new);await pg.wait_for_timeout(3000);await pg.click('#bCont');await pg.wait_for_timeout(600)
    ap=json.loads(await pg.evaluate("JSON.stringify({sem:G.sem,arg:Math.round(G.argent),n:Object.keys(G.F).length,mes:Moteur.mes().length,v:G.stats.v,d:G.stats.d,rival:!!G.rival})"))
    riv=await pg.evaluate("G.rival?G.rival.nom+' '+G.rival.ids.length+' combattants':'aucun'")
    await semaines(pg,20,True);await pg.evaluate("fermerModal();rendre()");await pg.screenshot(path=capt)
    fin=await pg.evaluate("JSON.stringify({sem:G.sem,arg:Math.round(G.argent),v:G.stats.v,d:G.stats.d,rival:G.rival&&(G.rival.v+'-'+G.rival.d)})")
    same=all(av[k]==ap[k] for k in ['sem','arg','n','mes','v','d'])
    print('ancienne',av,'\nnouvelle',ap,'rival',riv,'\nidentique',same,'\naprès 20 semaines',fin,'\nerreurs',errs[:6])
    await b.close();sys.exit(0 if same and not errs else 1)
asyncio.run(main())
