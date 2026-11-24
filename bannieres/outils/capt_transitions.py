"""Gros plans des limites entre terrains de la carte 3D (24/11) : trois endroits par graine où au moins deux terrains se touchent.
Usage : python3 capt_transitions.py dossier [graines] [zoom]  → dossier/transitions_<graine>.png"""
import asyncio, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../outils-communs'))
from atelier import serveur, navigateur, page, attendre, avancer
from playwright.async_api import async_playwright
from PIL import Image
JEU = os.environ.get('JEU') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '../jeu')
CHOIX = """()=>{const c=G.carte,N=c.N,E=i=>c.ter[i]===EAU;const p=[];for(let z=3;z<N-3;z++)for(let x=3;x<N-3;x++){const i=z*N+x;if(E(i)||c.obs[i])continue;const ts=new Set();for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const j=i+dz*N+dx;if(!E(j))ts.add(c.ter[j]);}if(ts.size>=2)p.push([x,z]);}
 const r=[];for(const q of p){if(r.every(o=>Math.hypot(o[0]-q[0],o[1]-q[1])>12))r.push(q);if(r.length>=3)break;}
 for(let z=0;z<N;z++)for(let x=0;x<N;x++)G.vu&&0;return r;}"""
async def main():
    out = sys.argv[1]; graines = (sys.argv[2] if len(sys.argv) > 2 else '7,11,23').split(','); zoom = float(sys.argv[3]) if len(sys.argv) > 3 else 1.6
    os.makedirs(out, exist_ok=True); base = serveur(JEU, 8895)
    async with async_playwright() as p:
        nav = await navigateur(p)
        for g in graines:
            pg = await page(nav, base + f'index.html?graine={g}&taille=54&q3d=2', 1280, 800, figer=12345)
            await attendre(pg, "typeof ECRAN!=='undefined'&&ECRAN==='aventure'&&(!V.m3||R3.actif)", delai=240)
            await pg.evaluate("()=>{for(const j of G.joueurs){if(j.vu)j.vu.fill(1);}V.fogDirty=true;}")
            pts = await pg.evaluate(CHOIX); ims = []
            for k, (x, z) in enumerate(pts):
                await pg.evaluate(f"()=>{{V.zoom={zoom};R3.centrer({x},{z});}}"); await avancer(pg, 12, 100)
                f = f'{out}/_r{g}_{k}.png'; await pg.screenshot(path=f, clip={'x': 0, 'y': 0, 'width': 1040, 'height': 770}); ims.append(Image.open(f).resize((520, 385)))
            pl = Image.new('RGB', (520 * len(ims), 385))
            for k, im in enumerate(ims): pl.paste(im, (k * 520, 0))
            pl.save(f'{out}/transitions_{g}.png'); print(g, pts, pg.erreurs); await pg.close()
        await nav.close()
asyncio.run(main())
