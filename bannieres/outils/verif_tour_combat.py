"""Contrôle du dessin du combat pendant le tour du joueur (24/11) : portée, survol, mode sort, à l'ordinateur et au téléphone, sur plusieurs terrains.
Les robots (parcours, scen) jouent en automatique et ne passent jamais par ce dessin. Usage : python3 verif_tour_combat.py [dossier_captures]  → code 1 si une erreur."""
import asyncio, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../outils-communs'))
from atelier import serveur, navigateur, page, avancer, attendre
from playwright.async_api import async_playwright
JEU = os.environ.get('JEU') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '../jeu')
TEST = """(t)=>{const h=herosDe(0)[0];combatInteractif({heros:h,armee:['griffon','cavalier','ange','moine','croise','archer','piquier'].map(c=>({c,n:5})),joueur:0},{heros:null,armee:['squelette','zombie','spectre','vampire','liche','chevnoir','dragonos'].map(c=>({c,n:4})),joueur:-1},{terrain:t,banc:true});setTimeout(()=>{CB.auto=false;},10);}"""
ETAPES = """()=>{const r=[];const f=(n,fn)=>{try{fn();dessinerCombat();r.push(n+':ok');}catch(e){r.push(n+':'+String(e).slice(0,160));}};CB.humain[0]=true;CB.auto=false;CB.attente=CB.attente||(()=>{});
 for(const c of ['cavalier','archer','ange'])f('portee_'+c,()=>{CB.C.actif=CB.C.piles.find(q=>q.cote===0&&q.c===c);CB.mode=null;CB.survol=-1;});
 f('survol',()=>{CB.survol=CB.C.piles.find(q=>q.cote===1).h;});f('sort',()=>{CB.mode='fleche';});f('benediction',()=>{CB.mode='benediction';});CB.mode=null;return r;}"""
async def main():
    out = sys.argv[1] if len(sys.argv) > 1 else None; base = serveur(JEU, 8898); mauvais = 0
    async with async_playwright() as p:
        nav = await navigateur(p)
        for (W, H, q) in [(1280, 800, 2), (390, 844, 0)]:
            pg = await page(nav, base + f'index.html?graine=7&taille=54&q3d={q}', W, H, figer=12345)
            await attendre(pg, "typeof ECRAN!=='undefined'&&ECRAN==='aventure'&&(!V.m3||R3.actif)", delai=240); await avancer(pg, 10, 1000 / 60)
            for t in ['herbe', 'neige', 'lave']:
                await pg.evaluate(TEST, t); await avancer(pg, 16, 162); r = await pg.evaluate(ETAPES)
                bad = [x for x in r if not x.endswith(':ok')]; mauvais += len(bad); print(W, t, 'OK' if not bad else bad)
                if out: os.makedirs(out, exist_ok=True); await pg.evaluate("()=>{CB.C.actif=CB.C.piles.find(q=>q.cote===0&&q.c==='cavalier');}"); await avancer(pg, 2, 50); await pg.screenshot(path=f'{out}/tour_{W}_{t}.png')
                await pg.evaluate("()=>{CB.abandon=true;CB=null;ecran('aventure');}"); await avancer(pg, 4, 162)
            if pg.erreurs: print('erreurs page', pg.erreurs[:3]); mauvais += 1
            await pg.close()
        await nav.close()
    sys.exit(1 if mauvais else 0)
asyncio.run(main())
