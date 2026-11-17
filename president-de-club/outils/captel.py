# Captures téléphone + ordinateur : accueil, classement, match en direct (couleurs proches forcées)
import asyncio,sys
from playwright.async_api import async_playwright
HTML=sys.argv[1]; OUT=sys.argv[2]; import os; os.makedirs(OUT,exist_ok=True)
CLOSE="UI.queue=[];document.getElementById('modal').classList.add('hidden');UI.modalOpen=false;"
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); errs=[]
    for name,ctxo in [('tel',dict(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)),('pc',dict(viewport={'width':1280,'height':800},device_scale_factor=1))]:
      ctx=await b.new_context(**ctxo); pg=await ctx.new_page(); pg.on('pageerror',lambda e,n=name:errs.append(n+': '+str(e)))
      await pg.goto('file://'+HTML); await pg.wait_for_timeout(400)
      await pg.evaluate("UI.setup.diff=1;document.getElementById('cTown').value='Clichy';document.getElementById('cName').value='US Clichy';A.create()"); await pg.wait_for_timeout(500)
      await pg.evaluate(CLOSE+"S.club.c1='#ffffff';S.club.c2='#1b6b3a';render()")
      for i in range(4):
        await pg.evaluate(CLOSE+"S.autoReport=true;A.play()"); await pg.wait_for_timeout(100)
      await pg.evaluate(CLOSE+"A.tab('accueil');scrollTo(0,0)"); await pg.wait_for_timeout(300)
      await pg.screenshot(path=f'{OUT}/{name}_accueil.png')
      m=await pg.evaluate("(()=>{const r=document.querySelector('header,.top,#top');return r?Math.round(r.getBoundingClientRect().height):-1})()")
      await pg.evaluate("A.tab('classement');scrollTo(0,0)"); await pg.wait_for_timeout(300)
      await pg.screenshot(path=f'{OUT}/{name}_classement.png')
      await pg.evaluate("A.tab('effectif');scrollTo(0,0)"); await pg.wait_for_timeout(300)
      await pg.screenshot(path=f'{OUT}/{name}_effectif.png')
      ov=await pg.evaluate("document.documentElement.scrollWidth>innerWidth+2")
      # match : adversaire le plus proche du blanc
      await pg.evaluate(CLOSE+"""A.tab('accueil');const opp=S.teams.filter(t=>!t.user).sort((a,b)=>kitDist(teamLook(a.name)[0],'#ffffff')-kitDist(teamLook(b.name)[0],'#ffffff'))[0];
        coachDecide(opp);const d=userMatch(true,opp,strength(),false,false);d.opp={name:opp.name,rating:opp.rating};d.comp='Essai';d.home=true;S.speed=1;S.autoReport=false;UI.queue=[{type:'report',d}];nextQueue();""")
      await pg.wait_for_timeout(4000)
      await pg.screenshot(path=f'{OUT}/{name}_match.png')
      el=await pg.query_selector('#rsLive')
      if el: await el.screenshot(path=f'{OUT}/{name}_terrain.png')
      kit=await pg.evaluate("UI.rep&&UI.rep.live?{hc:UI.rep.live.hc,ac:UI.rep.live.ac,gk:UI.rep.live.gk,vert:UI.rep.live.vert,cw:document.getElementById('rsLive').clientWidth,ch:document.getElementById('rsLive').clientHeight}:null")
      print(name,'entête',m,'débordement',ov,'kit',kit)
      await ctx.close()
    print('erreurs',errs); await b.close()
asyncio.run(main())
