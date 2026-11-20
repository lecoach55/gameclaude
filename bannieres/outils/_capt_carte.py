# Captures de référence (vues fixes, graine 7) : python3 capt.py dossier [largeur hauteur]   Q3D=0/1/2 (qualité 3D, 2 par défaut)
# Horloge figée (atelier figer=… + avancer) : deux séries de suite donnent les mêmes images ; comparer avec
#   python3 ../../outils-communs/compare.py ../references dossier planche.png --strict --json r.json
import asyncio,sys,os
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page,avancer,attendre
from playwright.async_api import async_playwright
JEU=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
async def capturer(pg,chemin):  # rendu logiciel lent (carte 3D ≈ 1 s par image en 1280×800) : délai long
    os.makedirs(os.path.dirname(chemin) or '.',exist_ok=True);await pg.screenshot(path=chemin,timeout=240000)
async def main():
    out=sys.argv[1];W=int(sys.argv[2]) if len(sys.argv)>2 else 1280;H=int(sys.argv[3]) if len(sys.argv)>3 else 800
    base=serveur(JEU,int(os.environ.get('PORT','8784')))
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,base+'index.html?graine=7&taille=54&q3d='+os.environ.get('Q3D','2'),W,H,figer=12345)
        await attendre(pg,"typeof ECRAN!=='undefined'&&ECRAN==='aventure'&&(!V.m3||R3.actif)",delai=240);await avancer(pg,30,1000/60)
        await pg.evaluate("()=>{const t=document.querySelector('div[style*=monospace]');if(t)t.remove();}")
        await avancer(pg,16,162);await capturer(pg,f'{out}/carte.png')
        if os.environ.get("FORTS"):
            for fac in ['bastion','horde','necro','sylve']:
                await pg.evaluate("(f)=>{const v=villesDe(0)[0];v.fac=f;v.bat['_c'+f]=1;centrer(v.x,v.y,true);if(typeof majUI==='function')majUI();}",fac);await avancer(pg,24,162)
                await capturer(pg,f'{out}/fort_{fac}.png')
        if os.environ.get("CARTE_SEULE"):
            if pg.erreurs:print("erreurs",pg.erreurs)
            await nav.close();return
        for fac in ['bastion','sylve','necro','horde']:
            await pg.evaluate("(f)=>{const v=villesDe(0)[0];v.fac=f;for(const b of BAT_ORDRE)if(!BAT[b].unique)v.bat[b]=1;ouvrirVille(v);}",fac);await avancer(pg,16,162)
            await capturer(pg,f'{out}/ville_{fac}.png');await pg.evaluate("()=>VI.fermer()")
        await pg.evaluate("()=>{const h=herosDe(0)[0];combatInteractif({heros:h,armee:['griffon','cavalier','ange','moine','croise','archer','piquier'].map(c=>({c,n:5})),joueur:0},{heros:null,armee:['behemoth','cyclope','roc','ogre','orque','chevloup2','gobelin2'].map(c=>({c,n:4})),joueur:-1},{terrain:(window._ter||'herbe'),banc:true});setTimeout(()=>{CB.auto=false;},10)}")
        await avancer(pg,16,162);await capturer(pg,f'{out}/combat.png')
        await pg.evaluate("()=>{CB.auto=true;CB.banc=false;ACCEL=2;if(CB.attente)CB.attente(iaCombat(CB.C));}");await avancer(pg,56,162);await capturer(pg,f'{out}/combat_suite.png')
        if pg.erreurs:print('erreurs',pg.erreurs)
        await nav.close()
asyncio.run(main())
