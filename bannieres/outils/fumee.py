# Parcours rapide avec captures : python3 fumee.py dossier [largeur hauteur]
import asyncio,sys,os,json
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page,capturer
from playwright.async_api import async_playwright
JEU=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
async def main():
    out=sys.argv[1];W=int(sys.argv[2]) if len(sys.argv)>2 else 1280;H=int(sys.argv[3]) if len(sys.argv)>3 else 800
    base=serveur(JEU,8781)
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,base+'index.html',W,H)
        await pg.wait_for_timeout(1500);await capturer(pg,f'{out}/1_accueil.png')
        await pg.click('#bTest');await pg.wait_for_function("()=>ECRAN==='aventure'",timeout=60000);await pg.wait_for_timeout(2500)
        await capturer(pg,f'{out}/2_carte.png')
        print('gen ms',await pg.evaluate("V.tGen"))
        # ville
        await pg.evaluate("()=>{ouvrirVille(villesDe(0)[0]);}");await pg.wait_for_timeout(1200);await capturer(pg,f'{out}/3_ville.png')
        await pg.evaluate("()=>{fenConstruire();}");await pg.wait_for_timeout(600);await capturer(pg,f'{out}/4_construire.png')
        await pg.evaluate("()=>{document.querySelectorAll('body > .modal').forEach(m=>m.remove());VI.fermer();}");await pg.wait_for_timeout(300)
        # combat
        await pg.evaluate("()=>{const h=herosDe(0)[0];const m=G.objs.find(o=>o.t==='monstre');window._c=combatInteractif({heros:h,armee:h.armee.map(s=>s?{c:s.c,n:s.n}:null),joueur:0},{heros:null,armee:pileMonstre(m),joueur:-1,monstre:m},{terrain:'herbe'});}")
        await pg.wait_for_timeout(1500);await capturer(pg,f'{out}/5_combat.png')
        await pg.evaluate("()=>{CB.auto=true;CB.attente&&CB.attente(iaCombat(CB.C));}");await pg.wait_for_timeout(12000);await capturer(pg,f'{out}/6_combat_fin.png')
        await pg.evaluate("()=>{const b=document.querySelector('body > .modal .btn.or');b&&b.click();}");await pg.wait_for_timeout(800)
        await pg.evaluate("()=>{V.zoom=.6;const h=herosDe(0)[0];centrer(h.x,h.y);}");await pg.wait_for_timeout(500);await capturer(pg,f'{out}/7_dezoom.png')
        # fiche héros
        await pg.evaluate("()=>{V.zoom=1;ouvrirFiche(herosDe(0)[0]);}");await pg.wait_for_timeout(500);await capturer(pg,f'{out}/8_fiche.png')
        await pg.evaluate("()=>{document.querySelectorAll('body > .modal').forEach(m=>m._fermer&&m._fermer(0));}")
        # déplacement : cible = case libre la plus lointaine atteignable aujourd'hui
        r=await pg.evaluate('''()=>{const h=herosDe(0)[0];const D=distances(h);let best=-1,bd=0;for(let i=0;i<D.length;i++){if(D[i]<h.mp&&D[i]>bd&&passable(i)&&!G.occ[i]&&!G.zoc[i]&&!G.hpos[i]){bd=D[i];best=i;}}toucher(best);toucher(best);return [best,h.mp];}''')
        await pg.wait_for_timeout(6000);await capturer(pg,f'{out}/9_deplace.png')
        print('déplacé',r,await pg.evaluate("()=>{const h=herosDe(0)[0];return [h.x,h.y,h.mp]}"))
        await pg.evaluate("()=>{document.querySelectorAll('body > .modal').forEach(m=>m._fermer&&m._fermer(0));finTour();}")
        for k in range(60):
            await pg.wait_for_timeout(1000)
            if await pg.evaluate("()=>G.courant===0&&!V.occupe"):break
            await pg.evaluate("()=>{document.querySelectorAll('body > .modal').forEach(m=>m._fermer&&m._fermer(0));}")
        await capturer(pg,f'{out}/10_jour2.png');print('jour',await pg.evaluate("G.jour"),'attente IA s',k)
        print('erreurs',pg.erreurs,await pg.evaluate("TK.erreurs"))
        await nav.close()
asyncio.run(main())
