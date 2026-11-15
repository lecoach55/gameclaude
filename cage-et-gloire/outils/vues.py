#!/usr/bin/env python3
"""Avance une partie de test (robot, N semaines) puis capture tous les écrans : python3 outils/vues.py page dossier [semaines] [l h]"""
import sys,os,asyncio
from playwright.async_api import async_playwright
html=os.path.abspath(sys.argv[1]);out=sys.argv[2];os.makedirs(out,exist_ok=True)
N=int(sys.argv[3]) if len(sys.argv)>3 else 60;W=int(sys.argv[4]) if len(sys.argv)>4 else 390;H=int(sys.argv[5]) if len(sys.argv)>5 else 844
BOT="""(n)=>{for(let w=0;w<n;w++){Moteur.avancer();if(G.popup)Moteur.choisir(0);
 for(const o of [...G.offres]){if(o.type==='combat')Moteur.accepterCombat(o.id);else{const f=G.F[o.f];const cur=f.org?Moteur.ORG(f.org).tier:-1;if(Moteur.ORG(o.org).tier>=cur)Moteur.accepterContrat(o.id);}}
 for(const cid of [...G.aJouer])Moteur.jouerMonCombat(cid,Moteur.preparerSim(cid,'equi'));
 const S=Moteur.SALLES[G.salle.niv+1];if(S&&G.argent>S.prix*1.3)Moteur.ameliorerSalle();}rendre();return G.sem;}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':W,'height':H});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file://'+html);await pg.wait_for_timeout(4000)
    await pg.click('#bTest');await pg.wait_for_timeout(500)
    print('semaine',await pg.evaluate(BOT,N))
    async def shot(n):await pg.wait_for_timeout(250);await pg.screenshot(path=f'{out}/{n}.png')
    for v in ['ecurie','combattants','offres','salle']:
      await pg.evaluate(f"VUE='{v}';rendre();document.getElementById('vue').scrollTop=0");await shot('v_'+v)
    await pg.evaluate("VUE='ecurie';rendre();document.getElementById('vue').scrollTop=900");await shot('v_ecurie2')
    for lv in ['org','p4p','gp','prix']:
      await pg.evaluate(f"VUE='ligues';SEL.lv='{lv}';rendre();document.getElementById('vue').scrollTop=0");await shot('l_'+lv)
    fid=await pg.evaluate("Moteur.mes().sort((a,b)=>b.traits.length-a.traits.length)[0].id")
    await pg.evaluate(f"fiche('{fid}')");await shot('f_haut')
    await pg.evaluate("document.querySelector('#modal .boite').scrollTop=1300");await shot('f_bas')
    await pg.evaluate("fermerModal()")
    cid=await pg.evaluate("(()=>{for(const e of G.ev)for(const c of e.combats)if(c.mine&&c.ok&&!c.res)return c.id;return null})()")
    if cid:
      await pg.evaluate(f"preCombat('{cid}')");await shot('p_pre')
      await pg.evaluate("document.querySelector('#modal .boite').scrollTop=900");await shot('p_pre2')
    print('erreurs',errs[:6]);await b.close()
asyncio.run(main())
