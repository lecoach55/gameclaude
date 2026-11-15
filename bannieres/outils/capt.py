# Captures de référence (vues fixes, graine 7) : python3 capt.py dossier [largeur hauteur]
import asyncio,sys,os
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page,capturer
from playwright.async_api import async_playwright
JEU=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
async def main():
    out=sys.argv[1];W=int(sys.argv[2]) if len(sys.argv)>2 else 1280;H=int(sys.argv[3]) if len(sys.argv)>3 else 800
    base=serveur(JEU,8784)
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,base+'index.html?graine=7&taille=54',W,H)
        await pg.wait_for_function("()=>ECRAN==='aventure'",timeout=120000);await pg.wait_for_timeout(1500)
        await pg.evaluate("()=>{const t=document.querySelector('div[style*=monospace]');if(t)t.remove();}")
        await capturer(pg,f'{out}/carte.png')
        for fac in ['bastion','sylve','necro','horde']:
            await pg.evaluate("(f)=>{const v=villesDe(0)[0];v.fac=f;for(const b of BAT_ORDRE)if(!BAT[b].unique)v.bat[b]=1;ouvrirVille(v);}",fac);await pg.wait_for_timeout(1200)
            await capturer(pg,f'{out}/ville_{fac}.png');await pg.evaluate("()=>VI.fermer()")
        await pg.evaluate("()=>{const h=herosDe(0)[0];combatInteractif({heros:h,armee:['griffon','cavalier','ange','moine','croise','archer','piquier'].map(c=>({c,n:5})),joueur:0},{heros:null,armee:['behemoth','cyclope','roc','ogre','orque','chevloup2','gobelin2'].map(c=>({c,n:4})),joueur:-1},{terrain:(window._ter||'herbe'),banc:true});setTimeout(()=>{CB.auto=false;},10)}")
        await pg.wait_for_timeout(1500);await capturer(pg,f'{out}/combat.png')
        await pg.evaluate("()=>{CB.auto=true;CB.banc=false;ACCEL=2;if(CB.attente)CB.attente(iaCombat(CB.C));}");await pg.wait_for_timeout(9000);await capturer(pg,f'{out}/combat_suite.png')
        await nav.close()
asyncio.run(main())
