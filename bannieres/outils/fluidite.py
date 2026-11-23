# Mesure de la fluidité de jeu (temps d'attente réels du joueur, animations à vitesse normale) :
#   [VIT=1|2|3] [OPT='&v3d=0'] python3 fluidite.py [jours_avant]   → tours de l'ordinateur, ouverture de ville, combat complet, marche d'un héros
# Les jours_avant sont joués vite par le robot (comme parcours.py) pour mesurer aussi en milieu de partie.
import asyncio,sys,os,json,time
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page
from playwright.async_api import async_playwright
JEU=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
FERMER='''()=>{window._fer=setInterval(()=>{try{const ms=document.querySelectorAll('body > .modal');if(ms.length){const m=ms[ms.length-1];const b=m.querySelector('.fen > .btns .btn.or')||m.querySelector('.fen > .btns .btn');if(b)b.click();}
 if(CB&&CB.attente&&!CB.auto){CB.auto=true;CB.attente(iaCombat(CB.C));}if(VI&&ECRAN==='ville')VI.fermer();}catch(e){}},100);}'''
async def main():
    avant=int(sys.argv[1]) if len(sys.argv)>1 else 3;res={}
    base=serveur(JEU,8791)
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,base+'index.html?graine=11&taille=54&test=1'+os.environ.get('OPT',''),1280,800)
        await pg.wait_for_function("()=>typeof ECRAN!=='undefined'&&ECRAN==='aventure'&&G&&G.joueurs[G.courant].humain&&!V.occupe",timeout=240000)
        await pg.evaluate(FERMER)
        if os.environ.get('VIT'):await pg.evaluate('()=>changerVitesse(%s)'%os.environ['VIT'])  # vitesse choisie par le joueur
        # ouverture de ville
        t=await pg.evaluate("async()=>{const t0=performance.now();const v=villesDe(G.courant)[0];clearInterval(window._fer);const pr=ouvrirVille(v);await new Promise(r=>{const f=()=>ECRAN==='ville'&&VI?r():setTimeout(f,10);f();});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const dt=performance.now()-t0;VI.fermer();return dt;}")
        res['ville_ouverture_ms']=round(t)
        t=await pg.evaluate("async()=>{const t0=performance.now();const v=villesDe(G.courant)[0];const pr=ouvrirVille(v);await new Promise(r=>{const f=()=>ECRAN==='ville'&&VI?r():setTimeout(f,10);f();});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const dt=performance.now()-t0;VI.fermer();return dt;}")
        res['ville_reouverture_ms']=round(t);await pg.evaluate(FERMER)
        # tours de l'ordinateur (jour 1)
        async def tours_ia():
            return await pg.evaluate("async()=>{const t0=performance.now();const c0=V.cpt;window._ct=c0;finTour();await new Promise(r=>setTimeout(r,60));await new Promise(r=>{const f=()=>(G.joueurs[G.courant].humain&&!V.occupe)?r():setTimeout(f,20);f();});window._img=V.cpt-c0;return performance.now()-t0;}")
        res['tours_ia_j1_ms']=round(await tours_ia())
        # avance rapide de quelques jours
        await pg.evaluate("()=>{ACCEL=25;V.rapide=true;}")
        for _ in range(avant):
            await pg.evaluate("async()=>{V.occupe=true;await tourIA(G.courant);V.occupe=false;}");await tours_ia()
        await pg.evaluate("()=>{ACCEL=1;V.rapide=false;}")
        j=await pg.evaluate("()=>G.jour");res['tours_ia_j%d_ms'%j]=round(await tours_ia());res['tours_ia_images']=await pg.evaluate('()=>window._img')
        # marche d'un héros : 8 cases tracées puis parties
        t=await pg.evaluate("""async()=>{const h=herosDe(G.courant).find(h=>h.mp>0);if(!h)return null;h.mp=h.mpMax||2000;let best=null;
          for(let dy=-8;dy<=8;dy++)for(let dx=-8;dx<=8;dx++){const x=h.x+dx,y=h.y+dy;if(x<0||y<0||x>=G.carte.N||y>=G.carte.N)continue;const c=chemin(h,idx(x,y));if(c&&c.ch&&c.ch.length>=6&&c.ch.length<=9&&!G.occ[idx(x,y)]){best={c,dest:idx(x,y)};break;}if(best)break;}
          if(!best)return null;V.chemin=Object.assign(best.c,{h:h.id,dest:best.dest});const n=best.c.ch.length;const t0=performance.now();await avancer();return {ms:performance.now()-t0,cases:n};}""")
        res['marche']=t
        # combat complet 7 contre 7 en automatique, animations normales
        t=await pg.evaluate("""async()=>{const h=herosDe(G.courant)[0];const t0=performance.now();
          await combatInteractif({heros:h,armee:['piquier','archer','griffon','croise','moine','cavalier','ange'].map(c=>({c,n:6})),joueur:G.courant},{heros:null,armee:['gobelin','loup','orque','ogre','roc','cyclope','behemoth'].map(c=>({c,n:4})),joueur:-1},{terrain:'herbe'});
          return performance.now()-t0;}""")
        res['combat_7v7_ms']=round(t)
        res['erreurs']=pg.erreurs[:5]
        await nav.close()
    print(json.dumps(res,ensure_ascii=False))
asyncio.run(main())
