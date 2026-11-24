"""Contrôle de l'élimination hors champ (24/11) : rend la carte 3D à plusieurs zooms et positions, une fois normalement et une fois
avec frustumCulled=false partout ; toute différence = objet éliminé à tort (bug v131 : montagnes et forêts invisibles en vue large).
Usage : python3 verif_culling.py [graines]  → code 1 si plus de 0,2 % des pixels diffèrent."""
import asyncio, sys, os, io
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../outils-communs'))
from atelier import serveur, navigateur, page, attendre, avancer
from playwright.async_api import async_playwright
from PIL import Image, ImageChops, ImageFilter
JEU = os.environ.get('JEU') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '../jeu')
VUES = [(.45, .5, .5), (1, .2, .2), (1, .8, .7), (1.6, .5, .9), (.7, .1, .9)]
async def main():
    graines = (sys.argv[1] if len(sys.argv) > 1 else '7,11').split(','); base = serveur(JEU, 8896); pire = 0
    async with async_playwright() as p:
        nav = await navigateur(p)
        for g in graines:
            pg = await page(nav, base + f'index.html?graine={g}&taille=54&q3d=2', 1280, 800, figer=12345)
            await attendre(pg, "typeof ECRAN!=='undefined'&&ECRAN==='aventure'&&(!V.m3||R3.actif)", delai=240)
            await pg.evaluate("()=>{for(const j of G.joueurs)if(j.vu)j.vu.fill(1);V.fogDirty=true;window.OIS_K=2;}")
            for z, fx, fy in VUES:
                await pg.evaluate(f"()=>{{V.zoom={z};R3.centrer(Math.round(G.carte.N*{fx}),Math.round(G.carte.N*{fy}));R3._scene().traverse(o=>{{if(o.userData.__fc!==undefined){{o.frustumCulled=o.userData.__fc;}}}});}}")
                await avancer(pg, 6, 100); a = Image.open(io.BytesIO(await pg.screenshot(clip={'x': 0, 'y': 0, 'width': 1040, 'height': 770}))).convert('RGB')
                await pg.evaluate("()=>{R3._scene().traverse(o=>{if(o.userData.__fc===undefined)o.userData.__fc=o.frustumCulled;o.frustumCulled=false;});}")
                await avancer(pg, 6, 100); b = Image.open(io.BytesIO(await pg.screenshot(clip={'x': 0, 'y': 0, 'width': 1040, 'height': 770}))).convert('RGB')
                d = ImageChops.difference(a, b).convert('L').point(lambda v: 255 if v > 40 else 0).filter(ImageFilter.MinFilter(7)); frac = d.histogram()[255] / (1040 * 770)  # érosion : les liserés (vent, sous-pixel) disparaissent, un objet manquant reste
                pire = max(pire, frac); print(g, (z, fx, fy), f'{frac*100:.3f} %', 'OK' if frac < .002 else 'DÉFAUT')
                if frac >= .002: d.save(f'/tmp/culling_{g}_{z}_{fx}_{fy}.png')
            await pg.close()
        await nav.close()
    sys.exit(1 if pire >= .002 else 0)
asyncio.run(main())
