# Parcours de non-régression : événement avec combat, charge du champion, mort réelle + succession, sauvegarde/reprise.
# python3 parcours.py
import asyncio,sys,os
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page,capturer
from playwright.async_api import async_playwright
JEU=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
async def cliquer(pg,sel,i=0):
    await pg.click(f'{sel} >> nth={i}'); await pg.wait_for_timeout(250)
async def gagner(pg):
    await pg.wait_for_timeout(400)
    await pg.evaluate("()=>{const A=JEU.A;A.X.resultat='victoire';A.X.sacOr+=50;A.X.butin.push(genObjet(3,'chevalier',{rarete:'legendaire'}));A.fini=true;finEtage();}"); await pg.wait_for_timeout(1200)
async def main():
    base=serveur(JEU,8771); ok=[]
    async with async_playwright() as p:
        nav=await navigateur(p); pg=await page(nav,base+'index.html?graine=21',1280,800)
        await pg.wait_for_timeout(600)
        await cliquer(pg,'#bNouvelle'); await cliquer(pg,'#cMort button[data-v="1"]'); await cliquer(pg,'#cGo')
        await cliquer(pg,'#fen .pied .btn'); await cliquer(pg,'#fen .pied .btn')
        # 1. événement tournoi -> combat -> victoire
        await pg.evaluate("()=>{JEU.G.evts.push({id:'tournoi'});traiterFile();}"); await pg.wait_for_timeout(300)
        await cliquer(pg,'#fen .pied .btn',0); await gagner(pg)
        t=await pg.evaluate("()=>document.querySelector('#fen').innerText"); ok.append(('tournoi', 'remportez le tournoi' in t))
        await cliquer(pg,'#fen .pied .btn',-1)
        # 2. charge du champion sur les Saulaies
        await pg.evaluate("()=>{JEU.G.provinces.find(p=>p.id==='valsombre').t=14;JEU.UI.sel='saulaies';panneau();}")
        await cliquer(pg,'#panneau [data-a="attaquer"]'); await cliquer(pg,'#aCh'); await gagner(pg)
        await pg.wait_for_timeout(6000); t=await pg.evaluate("()=>document.querySelector('#fen').innerText")
        ok.append(('charge',"Bataille" in t or "Victoire" in t)); await capturer(pg,'/tmp/tdb/p_charge.png')
        await pg.evaluate("()=>{fermer();traiterFile();}")
        # 3. mort réelle : le souverain tombe, un enfant hérite
        await pg.evaluate("()=>{const G=JEU.G;G.joueur.enfants.push({nom:'Ysolde',sexe:'f',age:19});fermer();}")
        await pg.evaluate("()=>{JEU.UI.sel='valsombre';const p=JEU.G.provinces.find(p=>p.id==='valsombre');p.nettoye=0;panneau();}")
        await cliquer(pg,'#panneau [data-a="expedition"]'); await pg.wait_for_timeout(500)
        print('A?',await pg.evaluate("()=>!!JEU.A"))
        await pg.evaluate("()=>{const A=JEU.A;A.p.pv=1;blesserJoueur(A,999,null);finEtage();}"); await pg.wait_for_timeout(2500)
        await capturer(pg,'/tmp/tdb/p_mort.png'); print(await pg.evaluate("()=>[MODE,document.querySelector('#voile').className,JEU.G.succession&&1,JEU.A&&JEU.A.fini]"))
        await cliquer(pg,'#fen .pied .btn',-1); await pg.wait_for_timeout(400)
        t=await pg.evaluate("()=>document.querySelector('#fen').innerText"); ok.append(('succession','hérite' in t))
        await capturer(pg,'/tmp/tdb/p_succession.png')
        await cliquer(pg,'#fen .pied .btn',2)
        h=await pg.evaluate("()=>({nom:JEU.G.joueur.heros.nom,classe:JEU.G.joueur.heros.classe,gen:JEU.G.joueur.generation})"); ok.append(('heritier',h['nom']=='Ysolde' and h['gen']==2))
        # 4. sauvegarde puis reprise
        await pg.evaluate("()=>{fermer();sauver();}")
        avant=await pg.evaluate("()=>JSON.stringify({an:JEU.G.an,or:JEU.G.maisons.joueur.or,inv:JEU.G.joueur.inventaire.length})")
        await pg.reload(); await pg.wait_for_timeout(800)
        await cliquer(pg,'#bContinuer'); await pg.wait_for_timeout(500)
        apres=await pg.evaluate("()=>JSON.stringify({an:JEU.G.an,or:JEU.G.maisons.joueur.or,inv:JEU.G.joueur.inventaire.length})")
        ok.append(('reprise',avant==apres))
        # 5. dix saisons d'affilée en choisissant toujours le premier choix possible
        for s in range(10):
            await pg.evaluate("()=>{fermer();}"); await cliquer(pg,'#finSaison')
            for k in range(8):
                if not await pg.evaluate("()=>document.querySelector('#voile').classList.contains('on')"): break
                if not await pg.query_selector('#fen .pied .btn:not([disabled])'):
                    await pg.evaluate("()=>{fermer();traiterFile();}"); continue
                await cliquer(pg,'#fen .pied .btn:not([disabled])',0)
                if await pg.evaluate("()=>!!JEU.A"): await gagner(pg); await cliquer(pg,'#fen .pied .btn',-1)
        ok.append(('saisons',await pg.evaluate("()=>JEU.G.tour")>=10))
        ok.append(('erreurs',not pg.erreurs))
        print(pg.erreurs[:5])
        await nav.close()
    for n,v in ok: print(('OK ' if v else 'ÉCHEC ')+n)
asyncio.run(main())
