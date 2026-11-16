#!/usr/bin/env python3
"""Robot qui clique au hasard dans l'interface (vrais clics) pour débusquer les erreurs et les écrans bloquants.
usage : python3 outils/monkey.py build/index.html dossier [clics] [l h] [graine]
Rapporte : erreurs JS, écrans où plus aucun bouton n'est cliquable, semaines jouées, combats vus."""
import sys,os,asyncio,random,json
from playwright.async_api import async_playwright
html=os.path.abspath(sys.argv[1]);out=sys.argv[2];os.makedirs(out,exist_ok=True)
N=int(sys.argv[3]) if len(sys.argv)>3 else 400
W=int(sys.argv[4]) if len(sys.argv)>4 else 390;H=int(sys.argv[5]) if len(sys.argv)>5 else 844
SEED=int(sys.argv[6]) if len(sys.argv)>6 else 1
random.seed(SEED)
JS_CIBLES="""()=>{const vis=e=>{const r=e.getBoundingClientRect();if(r.width<4||r.height<4||r.bottom<0||r.top>innerHeight)return false;const s=getComputedStyle(e);if(s.visibility==='hidden'||s.display==='none'||+s.opacity<.05)return false;
 const x=r.left+r.width/2,y=r.top+r.height/2;const t=document.elementFromPoint(x,y);return t&&(t===e||e.contains(t));};
 const L=[...document.querySelectorAll('button,.btn,[data-v],[data-i],[data-f],[onclick],a,.carte,select,input[type=range]')].filter(e=>!['mBanc','mBug'].includes(e.id)&&!/Mesurer la fluidit|Signaler/.test(e.textContent||'')).filter(vis);
 return L.map((e,i)=>{e.dataset.mk=i;const r=e.getBoundingClientRect();return {i,x:r.left+r.width/2,y:r.top+r.height/2,t:(e.textContent||e.id||e.className||'').trim().slice(0,30),tag:e.tagName};});}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':W,'height':H},device_scale_factor=1)
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]));pg.on('console',lambda m:errs.append('console:'+m.text[:300]) if m.type=='error' else None)
    pg.on('dialog',lambda d:asyncio.ensure_future(d.accept()))
    await pg.add_init_script("localStorage.setItem('cg-qual','0');window.TEST_MONKEY=1;")
    await pg.goto('file://'+html);await pg.wait_for_timeout(5000)
    await pg.click('#bNouv');await pg.wait_for_timeout(300);await pg.click('#bGo');await pg.wait_for_timeout(600)
    bloque=0;hist=[];sems=set();combats=0;nerr=0
    for k in range(N):
      try:c=await pg.evaluate(JS_CIBLES)
      except Exception:
        rech=locals().get('rech',0)+1;await pg.wait_for_timeout(4000);continue
      if not c:
        bloque+=1;await pg.wait_for_timeout(700)
        if bloque in (3,10):await pg.screenshot(path=f'{out}/bloque_{k}.png')
        if bloque>45:print('BLOQUÉ : plus rien de cliquable',hist[-5:]);break
        continue
      bloque=0
      # privilégier le bouton « semaine suivante » pour faire avancer la partie
      av=[x for x in c if 'SEMAINE' in x['t'].upper() or 'RÉSULTAT' in x['t'].upper() or 'ON Y VA' in x['t'].upper() or 'VOIR LE COMBAT' in x['t'].upper() or 'CAGE' in x['t'].upper() or 'SUIVANT' in x['t'].upper()]
      ch=random.choice(av) if av and random.random()<.35 else random.choice(c)
      hist.append(ch['t']);
      try:
        if ch['tag']=='SELECT':await pg.select_option(f'[data-mk="{ch["i"]}"]',index=0)
        else:await pg.mouse.click(ch['x'],ch['y'])
      except Exception as e:errs.append('clic:'+str(e)[:120])
      await pg.wait_for_timeout(random.choice([60,120,250,600]))
      try:
        s=await pg.evaluate("typeof G!=='undefined'&&G?G.sem:0");sems.add(s)
        if await pg.evaluate("!!document.querySelector('#arene:not(.cache), #combat:not(.cache)')"):combats+=1
      except Exception:pass
      if len(errs)>nerr:
        print('ERREUR après clic',repr(ch['t']),'→',errs[nerr:][:2],flush=True);await pg.screenshot(path=f'{out}/erreur_{k}.png');nerr=len(errs)
    await pg.screenshot(path=f'{out}/fin.png')
    from collections import Counter
    rap={'top_clics':Counter(hist).most_common(25),'clics':k+1,'semaines':max(sems) if sems else 0,'images_en_combat':combats,'erreurs':errs[:30],'nb_erreurs':len(errs)}
    print(json.dumps(rap,ensure_ascii=False,indent=1));json.dump(rap,open(out+'/rapport.json','w'),ensure_ascii=False,indent=1)
    await b.close()
asyncio.run(main())
