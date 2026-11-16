# Banc reproductible (graine 7, carte moyenne, 3 royaumes) : images/s sur la carte, la carte dézoomée, un combat et la ville.
# python3 perf.py sortie.json [ralenti_cpu] [largeur hauteur]   V3D=0 : ancienne carte 2D (par défaut : carte 3D)   (rendu logiciel ici : valeurs RELATIVES, pour comparer deux versions)
import asyncio,sys,os,json
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page,mesurer
from playwright.async_api import async_playwright
JEU=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
async def main():
    out=sys.argv[1];ral=float(sys.argv[2]) if len(sys.argv)>2 else 1;W=int(sys.argv[3]) if len(sys.argv)>3 else 1280;H=int(sys.argv[4]) if len(sys.argv)>4 else 800
    base=serveur(JEU,8783);res={}
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,base+'index.html?graine=7&taille=54&v3d='+os.environ.get('V3D','1'),W,H)
        if ral>1:
            cdp=await pg.context.new_cdp_session(pg);await cdp.send('Emulation.setCPUThrottlingRate',{'rate':ral})
        await pg.wait_for_function("()=>ECRAN==='aventure'",timeout=120000);await pg.wait_for_function("()=>!V.m3||R3.actif",timeout=60000);await pg.wait_for_timeout(1500)
        res['mode3d']=await pg.evaluate('en3D()');res['generation_ms']=await pg.evaluate("V.tGen")
        await pg.evaluate("()=>{const h=herosDe(0)[0];V.zoom=1;centrer(h.x,h.y);}");await pg.wait_for_timeout(800);res['carte']=await mesurer(pg,4000);res['gpu_carte']=await pg.evaluate('R3.info()')
        await pg.evaluate("()=>{const h=herosDe(0)[0];V.zoom=.55;centrer(h.x,h.y);for(const p of G.joueurs)p.vu.fill(1);V.fogDirty=true;}");await pg.wait_for_timeout(800);res['carte_dezoom_tout_vu']=await mesurer(pg,4000);res['gpu_dezoom']=await pg.evaluate('R3.info()')
        await pg.evaluate("()=>{V.zoom=1;const h=herosDe(0)[0];const m=G.objs.find(o=>o.t==='monstre');combatInteractif({heros:h,armee:h.armee.map(s=>s?{c:s.c,n:s.n*4}:null),joueur:0},{heros:null,armee:pileMonstre({cre:'squelette',n:120}),joueur:-1},{terrain:'herbe',banc:true});}")
        await pg.wait_for_timeout(1500);res['combat']=await mesurer(pg,5000)
        await pg.evaluate("()=>{CB.abandon=true;ouvrirVille(villesDe(0)[0]);}");await pg.wait_for_timeout(1200);res['ville']=await mesurer(pg,3000)
        res['erreurs']=pg.erreurs
        await nav.close()
    json.dump(res,open(out,'w'),indent=1,ensure_ascii=False);print(json.dumps(res,ensure_ascii=False))
asyncio.run(main())
