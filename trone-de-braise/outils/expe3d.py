# Parcours du donjon 3D au tour par tour depuis le royaume : chargement, exploration, combat, retraite, victoire, mort.
# python3 expe3d.py  (construire avant : donjon3d/build.py puis jeu/build.py)
import asyncio,sys,os,json
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page,capturer
from playwright.async_api import async_playwright
B=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../build')
OUT='/tmp/tdb3d'
async def cadre(pg):
    for f in pg.frames:
        if 'donjon3d' in f.url or f.url.startswith('blob:'): return f
async def attendre(pg,js,ms=120000):
    t=0
    while t<ms:
        if await pg.evaluate(js): return True
        await pg.wait_for_timeout(500); t+=500
    return False
async def main(L=390,H=780,tag='mobile'):
    base=serveur(B,8779); ok=[]
    async with async_playwright() as p:
        nav=await navigateur(p); pg=await page(nav,base+'trone-de-braise.html?graine=5',L,H)
        await pg.wait_for_timeout(600)
        for s in ['#bNouvelle','#cGo']: await pg.click(s); await pg.wait_for_timeout(300)
        for i in range(2): await pg.click('#fen .pied .btn'); await pg.wait_for_timeout(300)
        # 1. expédition dans une province
        await pg.evaluate("()=>{const G=JEU.G;const p=G.provinces.find(p=>p.o==='joueur')||G.provinces[0];p.nettoye=0;JEU.UI.sel=p.id;panneau();}")
        await pg.click('#panneau [data-a="expedition"]'); await pg.wait_for_timeout(400)
        await capturer(pg,f'{OUT}/{tag}_1_chargement.png')
        pret=await attendre(pg,"()=>document.querySelector('#cadre3d')&&document.querySelector('#cadre3d').style.display==='block'")
        ok.append(('chargement 3D',pret)); f=await cadre(pg)
        await pg.wait_for_timeout(4000); await capturer(pg,f'{OUT}/{tag}_2_exploration.png')
        info=await f.evaluate("()=>({F:VD.F,expe:VD.expe&&VD.expe.dernier,heros:VD.P.heroes.map(h=>h.n+' '+h.lvl),packs:VD.E.length,merch:VD.merch.x})")
        print(info); ok.append(('groupe de 3',len(info['heros'])==3)); ok.append(('pas de marchand',info['merch']<0))
        # 2. combat : on rejoint le premier groupe d'ennemis
        await f.evaluate("()=>{const e=VD.E.find(e=>!e.boss);VD.P.x=e.x;VD.P.y=e.y;}")
        okb=await attendre(f.page if False else pg,"()=>{const f=document.querySelector('#cadre3d').contentWindow;return !!(f.VD&&f.VD.B)}",15000)
        ok.append(('combat',okb)); await pg.wait_for_timeout(5000); await capturer(pg,f'{OUT}/{tag}_3_combat.png')
        # tour du joueur : une compétence réelle via les boutons
        await attendre(pg,"()=>{const d=document.querySelector('#cadre3d').contentDocument;return d.querySelectorAll('#bact button').length>0}",30000)
        nb=await f.evaluate("()=>document.querySelectorAll('#bact button').length"); ok.append(('menu de combat',nb>0))
        await f.evaluate("()=>document.querySelector('#bact button').click()"); await pg.wait_for_timeout(600)
        await capturer(pg,f'{OUT}/{tag}_4_cible.png')
        # 3. retraite (⛺ deux fois) hors combat
        await f.evaluate("()=>{VD.B.over='win';}")
        await f.evaluate("()=>{VD.closeBattle();}");
        await f.evaluate("()=>{window.__expe.fin('fuite')}"); await pg.wait_for_timeout(1500)
        t=await pg.evaluate("()=>document.querySelector('#fen').innerText"); ok.append(('retour au royaume (retraite)','rebrouss' in t)); await capturer(pg,f'{OUT}/{tag}_5_retour.png')
        await pg.evaluate("()=>fermer()")
        # 4. victoire : relance (cadre déjà chargé), victoire, butin converti
        or0=await pg.evaluate("()=>JEU.G.maisons.joueur.or")
        await pg.evaluate("()=>{JEU.G.ordres=3;JEU.G.joueur.blesse=0;const p=JEU.G.provinces.find(p=>p.id===JEU.UI.sel);p.nettoye=0;panneau();}")
        await pg.click('#panneau [data-a="expedition"]'); await pg.wait_for_timeout(2500)
        f=await cadre(pg)
        await f.evaluate("()=>{VD.P.gold=500;VD.P.bag.push(VD.mkItem(5,2,'arme','guerrier'));window.__expe.fin('victoire')}"); await pg.wait_for_timeout(1500)
        t=await pg.evaluate("()=>document.querySelector('#fen').innerText"); or1=await pg.evaluate("()=>JEU.G.maisons.joueur.or")
        ok.append(('victoire',('Victoire' in t) and or1>or0)); print('or',or0,'→',or1); await capturer(pg,f'{OUT}/{tag}_6_victoire.png')
        await pg.evaluate("()=>fermer()")
        # 5. mort : blessé, retour
        await pg.evaluate("()=>{JEU.G.ordres=3;JEU.G.joueur.blesse=0;JEU.G.joueur.blesse=0;const p=JEU.G.provinces.find(p=>p.id===JEU.UI.sel);p.nettoye=0;panneau();}")
        await pg.click('#panneau [data-a="expedition"]'); await pg.wait_for_timeout(2500); f=await cadre(pg)
        await f.evaluate("()=>window.__expe.fin('mort')"); await pg.wait_for_timeout(2500)
        t=await pg.evaluate("()=>document.querySelector('#fen').innerText"); ok.append(('défaite',('Défaite' in t) and await pg.evaluate("()=>JEU.G.joueur.blesse>0")))
        # 6. sauvegarde intacte et aucune écriture du donjon
        ls=await pg.evaluate("()=>Object.keys(localStorage)"); ok.append(('pas de sauvegarde Valdragon',not any(k.startswith('valdragon_tb') for k in ls)))
        err=pg.erreurs+[]; print('erreurs',err[:5]); ok.append(('aucune erreur',not err))
        await nav.close()
    for k,v in ok: print(('OK ' if v else 'ÉCHEC ')+k)
    return all(v for k,v in ok)
if __name__=='__main__':
    os.makedirs(OUT,exist_ok=True)
    r=asyncio.run(main(*( [1280,800,'mac'] if 'mac' in sys.argv else [] )))
    sys.exit(0 if r else 1)
