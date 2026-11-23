import asyncio,sys,os
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page,avancer,attendre
from playwright.async_api import async_playwright
JEU=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
async def main():
    out=sys.argv[1];ters=sys.argv[2].split(',');os.makedirs(out,exist_ok=True)
    base=serveur(JEU,8798)
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,base+'index.html?graine='+os.environ.get('GR','7')+'&taille=72&q3d=2',1280,800,figer=12345)
        await attendre(pg,"typeof ECRAN!=='undefined'&&ECRAN==='aventure'&&(!V.m3||R3.actif)",delai=240);await avancer(pg,10,1000/60)
        if os.environ.get('ZOOM'):await pg.evaluate('()=>{window.ZOOM=%s}'%os.environ['ZOOM'])
        for t in ters:
            ok=await pg.evaluate("""(t)=>{const c=G.carte,N=c.N,T=TER.indexOf(t);let best=-1,bs=0;for(let y=3;y<N-3;y++)for(let x=3;x<N-3;x++){let s=0;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(c.ter[(y+dy)*N+x+dx]===T)s++;if(s>bs){bs=s;best=y*N+x;}}
              if(best<0)return 0;const p=G.joueurs[0];for(let i=0;i<N*N;i++)p.vu[i]=1;V.fogDirty=true;centrer(best%N,(best/N)|0);if(window.ZOOM)R3.zoomer(window.ZOOM);return bs;}""",t)
            await avancer(pg,16,162);await pg.screenshot(path=f'{out}/carte_{t}.png',timeout=240000);print(t,ok)
        await nav.close()
asyncio.run(main())
