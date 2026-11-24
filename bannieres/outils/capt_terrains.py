# Captures d'un combat par terrain (graine 7, banc figé) : python3 capt_terrains.py dossier neige,sable,marais,lave,terre,rude,herbe
import asyncio,sys,os
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page,avancer,attendre
from playwright.async_api import async_playwright
JEU=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
async def main():
    out=sys.argv[1];ters=sys.argv[2].split(',')
    base=serveur(JEU,8797)
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,base+'index.html?graine=7&taille=54&q3d=2',1280,800,figer=12345)
        await attendre(pg,"typeof ECRAN!=='undefined'&&ECRAN==='aventure'&&(!V.m3||R3.actif)",delai=240);await avancer(pg,10,1000/60)
        for t in ters:
            await pg.evaluate("(t)=>{const h=herosDe(0)[0];combatInteractif({heros:h,armee:['griffon','cavalier','ange','moine','croise','archer','piquier'].map(c=>({c,n:5})),joueur:0},{heros:null,armee:['squelette','zombie','spectre','vampire','liche','chevnoir','dragonos'].map(c=>({c,n:4})),joueur:-1},{terrain:t,banc:true});setTimeout(()=>{CB.auto=false;},10)}",t)
            await avancer(pg,16,162);os.makedirs(out,exist_ok=True);await pg.screenshot(path=f'{out}/combat_{t}.png',timeout=240000)
            await pg.evaluate("()=>{CB.abandon=true;CB=null;ecran('aventure');}");await avancer(pg,4,162)
        await nav.close()
asyncio.run(main())
