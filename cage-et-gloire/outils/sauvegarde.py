#!/usr/bin/env python3
"""Sauvegarde locale compressée : nouvelle partie, 30 semaines, rechargement, Continuer. python3 outils/sauvegarde.py page"""
import sys,os,asyncio
from playwright.async_api import async_playwright
html=os.path.abspath(sys.argv[1])
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files'])
    ctx=await b.new_context(viewport={'width':390,'height':844});pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+html);await pg.wait_for_timeout(3500)
    await pg.click('#bNouv');await pg.wait_for_timeout(200);await pg.click('#bGo');await pg.wait_for_timeout(300);await pg.evaluate('fermerModal()')
    for i in range(30):
      await pg.evaluate("avancer(1);0");await pg.wait_for_timeout(150);await pg.evaluate("document.querySelectorAll('#modal [data-i]').forEach((b,i)=>{if(i===0)b.click()})")
      await pg.evaluate("for(const o of [...G.offres])if(o.type==='combat')Moteur.accepterCombat(o.id);for(const c of [...G.aJouer])Moteur.jouerMonCombat(c,Moteur.preparerSim(c,'equi'));sauver()")
    await pg.wait_for_timeout(800)
    av=await pg.evaluate("JSON.stringify({sem:G.sem,arg:Math.round(G.argent),n:Object.keys(G.F).length})")
    taille=await pg.evaluate("(localStorage.getItem('cage-gloire-v1z')||'').length")
    await pg.reload();await pg.wait_for_timeout(3500);await pg.screenshot(path='/tmp/acc_sauv.png')
    await pg.click('#bCont');await pg.wait_for_timeout(500)
    ap=await pg.evaluate("JSON.stringify({sem:G.sem,arg:Math.round(G.argent),n:Object.keys(G.F).length})")
    print('avant',av,'après',ap,'identique',av==ap,'taille compressée',taille,'erreurs',errs[:4]);await b.close()
asyncio.run(main())
