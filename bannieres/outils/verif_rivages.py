"""Contrôle du dessin de l'eau sur la carte 3D (24/11) : l'eau dessinée doit correspondre aux cases d'eau du jeu.
Pour chaque graine : centres de cases de terre sous l'eau, centres de cases d'eau hors de l'eau, et « faux lacs »
(points de terre sous l'eau à plus de 0,6 case de toute case d'eau). Usage : python3 verif_rivages.py [graines]  → code 1 si un défaut."""
import asyncio, sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../outils-communs'))
from atelier import serveur, navigateur, page, attendre
from playwright.async_api import async_playwright
JEU = os.environ.get('JEU') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '../jeu')
JS = """()=>{const c=G.carte,N=c.N,E=i=>c.ter[i]===EAU;let terre=0,eau=0,faux=0,n=0;const ex=[];
 const prochEau=(x,z)=>{for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const tx=Math.floor(x+dx*.6),tz=Math.floor(z+dz*.6);if(tx>=0&&tz>=0&&tx<N&&tz<N&&E(tz*N+tx))return true;}return false;};
 for(let z=0;z<N;z++)for(let x=0;x<N;x++){const i=z*N+x,hc=R3._h(x+.5,z+.5);if(E(i)){if(hc>-.12){eau++;if(ex.length<6)ex.push('eau '+x+','+z+' '+hc.toFixed(2));}}else if(!c.obs[i]&&hc<-.1){terre++;if(ex.length<6)ex.push('terre '+x+','+z+' '+hc.toFixed(2));}
  for(const [ax,az] of [[.15,.15],[.85,.15],[.15,.85],[.85,.85],[.5,.15],[.15,.5]]){const px=x+ax,pz=z+az;if(E(i))continue;n++;if(R3._h(px,pz)<-.1&&!prochEau(px,pz)){faux++;if(ex.length<8)ex.push('faux '+px.toFixed(2)+','+pz.toFixed(2)+' '+R3._h(px,pz).toFixed(2));}}}
 return {terre,eau,faux,n,ex};}"""
async def main():
    graines = [int(g) for g in (sys.argv[1] if len(sys.argv) > 1 else '7,11,23,31,42').split(',')]
    base = serveur(JEU, 8893); mauvais = 0
    async with async_playwright() as p:
        nav = await navigateur(p)
        for g in graines:
            pg = await page(nav, base + f'index.html?graine={g}&taille=54&q3d=2', 800, 600, figer=12345)
            await attendre(pg, "typeof ECRAN!=='undefined'&&ECRAN==='aventure'&&(!V.m3||R3.actif)", delai=240)
            r = await pg.evaluate(JS); ok = r['terre'] == 0 and r['eau'] == 0 and r['faux'] == 0
            mauvais += not ok; print(g, 'OK' if ok else 'DÉFAUT', json.dumps(r, ensure_ascii=False)); await pg.close()
        await nav.close()
    sys.exit(1 if mauvais else 0)
asyncio.run(main())
