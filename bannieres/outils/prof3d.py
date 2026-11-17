# Profil du rendu 3D de la carte (rendu logiciel : valeurs RELATIVES) : ms par image (synchronisée) selon ce qu'on masque.
# python3 prof3d.py [sortie.json] [largeur hauteur]   Graine 7, carte moyenne ; chaque variante : 6 images, médiane.
import asyncio,sys,os,json
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page
from playwright.async_api import async_playwright
JEU=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
JS="""async()=>{const ren=R3._ren(),sc=R3._scene(),gl=ren.getContext();const px=new Uint8Array(4);
 const t1=()=>{const l=[];for(let i=0;i<6;i++){const t=performance.now();R3.rendre();gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);l.push(performance.now()-t);}l.sort((a,b)=>a-b);return +l[3].toFixed(1);};
 const r={};t1();r.base=t1();r.info=R3.info();
 const sol=sc.children.find(o=>o.isDirectionalLight);const sh=sol.castShadow;sol.castShadow=false;r.sans_ombres=t1();sol.castShadow=sh;
 const kids=sc.children.filter(o=>!o.isLight);r.enfants={};
 kids.forEach((o,i)=>{const nm=(o.name||o.type)+'#'+i+(o.isMesh?'('+(o.geometry.index?o.geometry.index.count/3:o.geometry.attributes.position.count/3|0)+'t)':'('+o.children.length+')');const v=o.visible;o.visible=false;r.enfants[nm]=+(r.base-t1()).toFixed(1);o.visible=v;});
 const pr=ren.getPixelRatio();r.dpr=pr;
 const env=sc.environment;sc.environment=null;r.sans_env=t1();sc.environment=env;
 return r;}"""
async def main():
    out=sys.argv[1] if len(sys.argv)>1 else None;W=int(sys.argv[2]) if len(sys.argv)>2 else 800;H=int(sys.argv[3]) if len(sys.argv)>3 else 500
    base=serveur(JEU,int(os.environ.get('PORT','8783')));res={}
    async with async_playwright() as p:
        nav=await navigateur(p)
        for q in os.environ.get('Q','2,1,0').split(','):
            pg=await page(nav,base+'index.html?graine=7&taille=54&q3d='+q,W,H)
            await pg.wait_for_function("()=>ECRAN==='aventure'",timeout=120000);await pg.wait_for_function("()=>!V.m3||R3.actif",timeout=60000);await pg.wait_for_timeout(1500)
            await pg.evaluate("()=>{ECRAN='bancprof';const h=herosDe(0)[0];V.zoom=1;centrer(h.x,h.y);}")
            res['q'+q]=await pg.evaluate(JS)
            await pg.evaluate("()=>{const h=herosDe(0)[0];V.zoom=.55;centrer(h.x,h.y);for(const p of G.joueurs)p.vu.fill(1);V.fogDirty=true;}")
            res['q'+q+'_dezoom']=await pg.evaluate(JS)
            res['erreurs_q'+q]=pg.erreurs;await pg.close()
        await nav.close()
    s=json.dumps(res,ensure_ascii=False,indent=1);print(s)
    if out:open(out,'w').write(s)
asyncio.run(main())
