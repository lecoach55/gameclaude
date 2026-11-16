# Test de fumée : écran titre -> création -> royaume -> événements -> expédition automatique -> captures
# python3 fumee.py dossier_captures [largeur hauteur]
import asyncio,sys,os
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page,capturer
from playwright.async_api import async_playwright
JEU=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
async def main():
    out=sys.argv[1] if len(sys.argv)>1 else '/tmp/tdb'
    W=int(sys.argv[2]) if len(sys.argv)>2 else 1280; H=int(sys.argv[3]) if len(sys.argv)>3 else 800
    base=serveur(JEU,8771)
    async with async_playwright() as p:
        nav=await navigateur(p); pg=await page(nav,base+'index.html?graine=7',W,H)
        await pg.wait_for_timeout(1200); await capturer(pg,f'{out}/01_titre.png')
        await pg.click('#bNouvelle'); await pg.wait_for_timeout(600); await capturer(pg,f'{out}/02_creation.png')
        await pg.click('.carte-classe[data-c="chevalier"]'); await pg.click('#cGo'); await pg.wait_for_timeout(1000); await pg.evaluate("()=>{JEU.G.options.d3=false}")  # donjon 2D (le 3D a son propre test : expe3d.py)
        await capturer(pg,f'{out}/03_intro.png')
        await pg.click('#fen .pied .btn >> nth=0'); await pg.wait_for_timeout(300); await pg.click('#fen .pied .btn >> nth=0'); await pg.wait_for_timeout(600)
        # sélectionner Val-Sombre
        await pg.evaluate("()=>{JEU.UI.sel='valsombre';}"); await pg.evaluate("()=>document.querySelector('#carte').dispatchEvent(new PointerEvent('pointermove'))")
        await pg.evaluate("()=>{const p=JEU.G.provinces.find(p=>p.id==='valsombre');JEU.UI.sel=p.id;}"); await pg.evaluate("()=>panneau()")
        await pg.wait_for_timeout(400); await capturer(pg,f'{out}/04_royaume.png')
        # expédition en combat automatique
        await pg.evaluate("()=>{JEU.UI.auto=true;}")
        await pg.click('#panneau [data-a="expedition"]'); await pg.wait_for_timeout(2500); await capturer(pg,f'{out}/05_donjon.png')
        await pg.wait_for_timeout(9000); await capturer(pg,f'{out}/06_combat.png')
        etat=await pg.evaluate("()=>({A:!!JEU.A,mobs:JEU.A&&JEU.A.mobs.filter(m=>!m.mort).length,pv:JEU.A&&JEU.A.p.pv,t:JEU.A&&JEU.A.t})")
        print('etat donjon',etat)
        await pg.keyboard.press('KeyI'); await pg.wait_for_timeout(500); await capturer(pg,f'{out}/07_sac.png'); await pg.keyboard.press('Escape')
        # accélérer : laisser le robot finir l'expédition (temps simulé)
        for i in range(40):
            fini=await pg.evaluate("()=>{const A=JEU.A;if(!A)return true;for(let k=0;k<300&&!A.fini;k++)majDonjon(A,1/30,botEntree(A));if(A.fini&&A.X.resultat==='etage'){finEtage();}else if(A.fini){finEtage();}return !JEU.A||JEU.A.fini;}")
            if fini: break
        await pg.wait_for_timeout(2000); await capturer(pg,f'{out}/08_resume.png')
        txt=await pg.evaluate("()=>document.querySelector('#fen')?.innerText.slice(0,300)")
        print('resume:',txt)
        await pg.evaluate("()=>{JEU.UI.auto=false;}")
        # armurerie, maisons, fin de saison
        await pg.evaluate("()=>fermer()"); await pg.click('#bArm'); await pg.wait_for_timeout(400); await capturer(pg,f'{out}/09_armurerie.png'); await pg.evaluate("()=>fermer()")
        await pg.click('#bMais'); await pg.wait_for_timeout(400); await capturer(pg,f'{out}/10_maisons.png'); await pg.evaluate("()=>fermer()")
        for s in range(6):
            await pg.click('#finSaison'); await pg.wait_for_timeout(300)
            for k in range(6):
                vis=await pg.evaluate("()=>document.querySelector('#voile').classList.contains('on')")
                if not vis: break
                await pg.click('#fen .pied .btn:not([disabled]) >> nth=0'); await pg.wait_for_timeout(250)
                if await pg.evaluate("()=>!!JEU.A"):
                    await pg.evaluate("()=>{const A=JEU.A;A.X.resultat='victoire';A.fini=true;finEtage();}"); await pg.wait_for_timeout(1200)
        await capturer(pg,f'{out}/11_saisons.png')
        # attaque
        await pg.evaluate("()=>{const G=JEU.G;const p=G.provinces.find(p=>p.id==='saulaies');JEU.UI.sel=p.id;panneau();}")
        await pg.wait_for_timeout(300)
        b=await pg.query_selector('#panneau [data-a="attaquer"]:not([disabled])')
        if b:
            await b.click(); await pg.wait_for_timeout(500); await capturer(pg,f'{out}/12_assaut.png')
            await pg.click('#aGo'); await pg.wait_for_timeout(2500); await capturer(pg,f'{out}/13_bataille.png')
        print('erreurs',pg.erreurs)
        await nav.close()
asyncio.run(main())
