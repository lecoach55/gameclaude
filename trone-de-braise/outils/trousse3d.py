# Trousse de test dans le donjon 3D : le banc 🧪 (mode test) mesure aussi la 3D, et le 🐞 du donjon 3D arrive dans la base.
# Base de l'artefact simulée (window.claude) : on vérifie QUI écrit QUOI (la page 3D ne doit jamais écrire elle-même,
# aucune écriture de « partie » en mode test, aucune clé localStorage ajoutée par la page 3D).
# python3 trousse3d.py [mac] [sansbanc]   (construire avant : donjon3d/build.py puis jeu/build.py)
import asyncio,sys,os,json,time
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page
from playwright.async_api import async_playwright
B=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../build')
MOCK="""(()=>{window.__ecrits=window.__ecrits||[];const T=window.top||window;
window.claude={use:async n=>n=='user'?{id:async()=>'u1'}:{collection:c=>({doc:d=>({set:async o=>{(T.__ecrits||(T.__ecrits=[])).push({ou:location.href.slice(0,40),doc:c+'/'+d,o:JSON.parse(JSON.stringify(o))});},get:async()=>({exists:false})})})}};})();"""
async def att(pg,js,ms):
    t0=time.time()
    while (time.time()-t0)*1000<ms:
        try:
            if await pg.evaluate(js): return True
        except Exception: pass
        await pg.wait_for_timeout(1000)
    return False
async def main(mac):
    base=serveur(B,8783); ok=[]
    async with async_playwright() as p:
        nav=await navigateur(p)
        L,H=(912,755) if mac else (390,780)
        pg=await page(nav,base+'trone-de-braise.html?graine=5',L,H)
        await pg.add_init_script(MOCK); await pg.reload(); await pg.wait_for_timeout(800)
        ls0=set(await pg.evaluate("()=>Object.keys(localStorage)"))
        await pg.click('#bTest'); await pg.wait_for_timeout(600)
        t0=time.time()
        if not SANSBANC: await pg.evaluate("()=>{window.__banc3dLv=[0,2];banc();}")  # 2 qualités : le rendu logiciel est ~30× plus lent qu'un vrai GPU
        fin=SANSBANC or await att(pg,"()=>{const h=document.querySelector('#fen .tete h2');return h&&h.textContent.includes('Banc de mesure')}",900000)
        print('banc : %.0f s'%(time.time()-t0)); ok.append(('banc terminé',fin))
        E=await pg.evaluate("()=>window.__ecrits")
        m3=[e for e in E if e['doc'].endswith('_3d')]
        if not SANSBANC: ok.append(('mesures 3D envoyées',len(m3)==1))
        if m3:
            r=[x for x in m3[0]['o']['res'] if x.get('scene')]
            for x in r: print('  ',x.get('niveau'),x['scene'],x.get('fps'),'img/s · pire',x.get('pire'),'ms ·',x.get('tris'),'tri ·',x.get('calls'),'appels',flush=True)
            ok.append(('6 scènes 3D mesurées',len(r)==6 and all(x.get('fps') for x in r)))
        m2=[e for e in E if e['doc'].split('/')[-1].startswith('mesures_') and not e['doc'].endswith(('_3d','_echelle'))]
        if not SANSBANC:
            ok.append(('mesures 2D envoyées',len(m2)==1))
            txt=await pg.evaluate("()=>document.querySelector('#fen').innerText"); ok.append(('fenêtre du banc avec la 3D','Donjon 3D' in txt and 'img/s' in txt.split('Donjon 3D')[1]))
            await pg.evaluate("()=>fermer()")
            for k,v in ok: print(('OK   ' if v else 'ÉCHEC ')+k,flush=True)
        # 🐞 depuis le donjon 3D (vraie expédition du mode test)
        await pg.evaluate("()=>{const G=JEU.G;const p=G.provinces.find(p=>p.o==='joueur')||G.provinces[0];p.nettoye=0;JEU.UI.sel=p.id;panneau();}")
        await pg.evaluate("()=>document.querySelector('#panneau [data-a=\"expedition\"]').click()")
        await att(pg,"()=>document.querySelector('#cadre3d').style.display==='block'",120000); await pg.wait_for_timeout(3000)
        f=[x for x in pg.frames if 'donjon3d' in x.url][0]
        vis=await f.evaluate("()=>getComputedStyle(document.getElementById('bugb')).display!=='none'"); ok.append(('🐞 visible dans le donjon 3D',vis))
        n0=len(await pg.evaluate("()=>window.__ecrits"))
        await f.evaluate("()=>document.getElementById('bugb').click()"); await att(pg,"()=>window.__ecrits.some(e=>e.doc.includes('signalement_'))",30000)
        E=await pg.evaluate("()=>window.__ecrits"); s=[e for e in E[n0:] if 'signalement_' in e['doc']]
        ok.append(('🐞 3D reçu dans la base',len(s)==1))
        if s:
            o=s[0]['o']; print('  signalement :',o.get('page'),o.get('expe'),'capture',len(o.get('capture','')),'car.','royaume',o.get('royaume'))
            ok.append(('signalement complet (capture, expédition, royaume)',len(o.get('capture',''))>2000 and o.get('expe') and o.get('royaume')))
            ok.append(('écrit par la page du royaume',all('donjon3d' not in e['ou'] for e in E)))
        ok.append(('aucune écriture de « partie » en mode test',not any(e['doc'].endswith('/partie') for e in E)))
        ls1=set(await pg.evaluate("()=>Object.keys(localStorage)")); nouv=sorted(ls1-ls0)
        print('  clés localStorage ajoutées :',nouv)
        ok.append(('la page 3D n’écrit pas dans localStorage',not any(k.startswith(('valdragon','vd_')) for k in nouv)))
        await nav.close()
    for k,v in ok: print(('OK   ' if v else 'ÉCHEC ')+k)
    sys.exit(0 if all(v for _,v in ok) else 1)
SANSBANC='sansbanc' in sys.argv
asyncio.run(main('mac' in sys.argv))
