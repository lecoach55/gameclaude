# Captures du donjon 3D par type de donjon (exploration, combat, gardien) : identité visuelle.
# python3 vues3d.py dossier [types] [largeur hauteur]   (construire avant : donjon3d/build.py)
import asyncio,sys,os,json
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page
from playwright.async_api import async_playwright
ICI=os.path.dirname(os.path.abspath(__file__));B=os.path.join(ICI,'../build')
OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp/tdbv'
TYPES=(sys.argv[2] if len(sys.argv)>2 else 'crypte,foret,mine,glace,antre,marais,egouts,catacombes,arene').split(',')
L,H=(int(sys.argv[3]),int(sys.argv[4])) if len(sys.argv)>4 else (1280,800)
MAISON={'c1':'#c8632a','c2':'#f2d7a0','emb':'tour'};ADV={'c1':'#8e1b1b','c2':'#e8b04a','emb':'dragon'}
async def main():
    base=serveur(B,8781);os.makedirs(OUT,exist_ok=True)
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,base+'donjon3d.html',L,H)
        await pg.add_script_tag(path=os.path.join(ICI,'../donjon3d/pont.js'))
        await pg.wait_for_function("()=>window.__expe&&window.G3&&G3.isReady()",timeout=180000)
        for ty in TYPES:
            cfg=await pg.evaluate("""([ty,m,a])=>{Math.random=(()=>{let s=7;return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646;};})();
              const c=PONT3D.configExpedition({heros:{classe:'chevalier',nom:'Émeric',niveau:6,equip:{arme:{rar:'magique'}}},compagnon:{type:'pretresse',nom:'Sœur Alix'},type:ty==='arene'?'arene':ty,niveau:6,etages:3,arene:ty==='arene'?{n:8}:null,maison:m,adverse:a});return c;}""",[ty,MAISON,ADV])
            await pg.evaluate("c=>window.__expe.debut(c)",cfg);await pg.wait_for_timeout(7000)
            if ty!='arene':
                await pg.screenshot(path=f'{OUT}/{ty}_explo.png')
                await pg.evaluate("()=>{const e=VD.E.find(e=>!e.boss);VD.P.x=e.x;VD.P.y=e.y;}")
            await pg.wait_for_function("()=>VD.B&&document.querySelectorAll('#bact button').length>0",timeout=60000);await pg.wait_for_timeout(800)
            await pg.screenshot(path=f'{OUT}/{ty}_combat.png')
            if ty!='arene':
                await pg.evaluate("()=>window.__expe.fin('fuite')");await pg.wait_for_timeout(500)
                await pg.evaluate("c=>{c.combat={mem:['boss'],boss:1};window.__expe.debut(c)}",cfg)
                await pg.wait_for_function("()=>VD.B&&VD.B.boss",timeout=30000);await pg.wait_for_timeout(9000)
                await pg.screenshot(path=f'{OUT}/{ty}_gardien.png')
            await pg.evaluate("()=>window.__expe.fin('fuite')");await pg.wait_for_timeout(500)
            print(ty,'ok',pg.erreurs[-2:] if pg.erreurs else '')
        await nav.close()
asyncio.run(main())
