# Scénarios ciblés : siège d'une ville humaine par l'IA (combat interactif côté défenseur), victoire, défaite.
import asyncio,sys,os,json
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page,capturer
from playwright.async_api import async_playwright
JEU=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
FERMER="()=>{const ms=document.querySelectorAll('body > .modal');if(ms.length){const m=ms[ms.length-1];const b=m.querySelector('.fen > .btns .btn.or')||m.querySelector('.fen > .btns .btn');if(b)b.click();}if(CB&&CB.attente&&!CB.auto){CB.auto=true;CB.attente(iaCombat(CB.C));}return ms.length;}"
async def main():
    out=sys.argv[1] if len(sys.argv)>1 else '/tmp/scen'
    base=serveur(JEU,8785);bilan={}
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,base+'index.html?graine=7&taille=36&joueurs=2',1100,760)
        await pg.wait_for_function("()=>ECRAN==='aventure'",timeout=120000);await pg.wait_for_timeout(800)
        await pg.evaluate("()=>{ACCEL=8;}")
        # 1. siège : un héros IA fort à côté de la ville humaine, garnison humaine + héros humain absent
        await pg.evaluate("""()=>{const v=villesDe(0)[0];const h0=herosDe(0)[0];poserHeros(h0,h0.x,h0.y);G.hpos[idx(h0.x,h0.y)]=0;h0.x=v.x+3;h0.y=v.y+3;G.hpos[idx(h0.x,h0.y)]=h0.id;
          v.garn[0]={c:'piquier',n:30};v.garn[1]={c:'archer',n:12};
          const e=herosDe(1)[0];G.hpos[idx(e.x,e.y)]=0;e.x=v.x;e.y=v.y+2;G.hpos[idx(e.x,e.y)]=e.id;e.armee=[{c:'chevnoir',n:6},{c:'vampire',n:15},{c:'squelette',n:60},null,null,null,null];e.mp=2000;
          window._siege=(async()=>{const ch=chemin(e,idx(v.x,v.y),{toutVoir:true});await deplacer(e,ch.ch);return {prop:v.prop,heros:!!heroPar(e.id)};})();}""")
        await pg.wait_for_timeout(1500);await capturer(pg,f'{out}/siege_combat.png')
        bilan['ecran_pendant_siege']=await pg.evaluate("ECRAN")
        bilan['camp_humain']=await pg.evaluate("CB?CB.humain:null")
        for k in range(80):
            n=await pg.evaluate(FERMER);await pg.wait_for_timeout(300)
            if await pg.evaluate("()=>ECRAN==='aventure'&&!document.querySelector('body > .modal')"):break
        bilan['siege']=await pg.evaluate("window._siege")
        # 2. victoire : on retire tout au rival
        await pg.evaluate("""()=>{for(const v of villesDe(1))v.prop=0;for(const h of herosDe(1))retirerHeros(h,0);}""")
        bilan['fini']=await pg.evaluate("G&&G.fini")
        await pg.evaluate("()=>{finTour();}");await pg.wait_for_timeout(1500);await capturer(pg,f'{out}/victoire.png')
        bilan['titre_fin']=await pg.evaluate("()=>{const m=document.querySelector('body > .modal h2');return m&&m.textContent;}")
        await pg.evaluate(FERMER);await pg.wait_for_timeout(500)
        bilan['ecran_final']=await pg.evaluate("ECRAN")
        bilan['erreurs']=pg.erreurs+await pg.evaluate("TK.erreurs")
        print(json.dumps(bilan,ensure_ascii=False))
        await nav.close()
asyncio.run(main())
