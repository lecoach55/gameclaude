# Parcours automatique : le joueur humain est joué par le robot à travers la vraie interface
# (fenêtres, villes, combats interactifs en mode automatique), puis sauvegarde → rechargement.
# python3 parcours.py jours [largeur hauteur] [dossier_captures]
import asyncio,sys,os,json,time
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page,capturer
from playwright.async_api import async_playwright
JEU=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
ROBOT='''()=>{if(window._rob)return;window._rob=setInterval(()=>{try{
 const ms=document.querySelectorAll('body > .modal');if(ms.length&&!(G&&G.fini&&!window._finVu&&(window._finVu=1))){const m=ms[ms.length-1];const b=m.querySelector('.fen > .btns .btn.or')||m.querySelector('.fen > .btns .btn');if(b)b.click();else if(m._fermer)m._fermer(0);}
 if(typeof CB!=='undefined'&&CB&&CB.attente&&!CB.auto){CB.auto=true;CB.attente(iaCombat(CB.C));}
 if(typeof VI!=='undefined'&&VI&&ECRAN==='ville'){VI.fermer();}
 if(G&&ECRAN==='aventure'&&G.joueurs[G.courant].humain&&!V.occupe&&!window._tour&&!G.fini){window._tour=1;V.occupe=true;tourIA(G.courant).then(()=>{V.occupe=false;window._tour=0;finTour();}).catch(e=>{TK.erreurs.push('robot '+e);window._tour=0;V.occupe=false;finTour();});}
}catch(e){TK.erreurs.push('robot: '+e);}},150);}'''
async def main():
    jours=int(sys.argv[1]);W=int(sys.argv[2]) if len(sys.argv)>2 else 1280;H=int(sys.argv[3]) if len(sys.argv)>3 else 800;cap=sys.argv[4] if len(sys.argv)>4 else None
    base=serveur(JEU,8782);t0=time.time()
    async with async_playwright() as p:
        fac=os.environ.get('FAC')
        nav=await navigateur(p);pg=await page(nav,base+('index.html?graine=11&taille=54&test=0&fac='+fac if fac else 'index.html'),W,H)
        if fac:await pg.wait_for_function("()=>ECRAN==='aventure'",timeout=60000)
        else:
            await pg.wait_for_timeout(800);await pg.click('#bTest');await pg.wait_for_timeout(200);await pg.wait_for_function("()=>ECRAN==='aventure'",timeout=60000)
        await pg.evaluate("()=>{ACCEL=25;V.rapide=true;TEST=false;}")  # TEST=false : on teste aussi la vraie sauvegarde
        await pg.evaluate(ROBOT)
        dern=0
        while True:
            await pg.wait_for_timeout(1000)
            j=await pg.evaluate("()=>G?G.jour:-1")
            if j>=0:
                lg=await pg.evaluate("()=>G.log.slice(-60).map(l=>'J'+l.j+' '+l.t).join('\\n')+'\\nfini:'+JSON.stringify(G.fini)+' heros:'+G.heros.map(h=>h.nom+'/'+h.j+'@'+h.x+','+h.y+' f'+Math.round(forceArmee(h.armee,h))).join(' ')")
            if j!=dern:
                dern=j
                if cap and j%5==0:await capturer(pg,f'{cap}/jour{j}.png')
            if j<0 or j>jours or time.time()-t0>900:break
        print(lg)
        etat=await pg.evaluate("()=>G?{jour:G.jour,fini:G.fini,combats:G.stats.combats,heros:G.heros.map(h=>h.nom+'/'+h.j+' n'+h.niv),villes:G.joueurs.map(p=>villesDe(p.id).length),res:G.joueurs[0].res}:null")
        print(json.dumps(etat,ensure_ascii=False))
        # sauvegarde / rechargement
        await pg.evaluate("()=>{clearInterval(window._rob);}")
        await pg.wait_for_timeout(1500)
        ok=await pg.evaluate("()=>{if(!G)return 'pas de partie';sauver();const a=serialiser();deserialiser(a);const b=serialiser();return a===b?'identique':'DIFFÉRENT '+a.length+' '+b.length;}")
        taille=await pg.evaluate("()=>(localStorage.getItem('bannieres-v1')||'').length")
        print('aller-retour',ok,'taille sauvegarde',taille)
        await pg.reload();await pg.wait_for_timeout(1500)
        vis=await pg.evaluate("()=>getComputedStyle(document.getElementById('bContinuer')).display")
        if vis!='none':
            await pg.click('#bContinuer');await pg.wait_for_function("()=>ECRAN==='aventure'",timeout=60000);await pg.wait_for_timeout(1500)
            print('reprise jour',await pg.evaluate("G.jour"))
            if cap:await capturer(pg,f'{cap}/reprise.png')
        print('erreurs',pg.erreurs,await pg.evaluate("TK?TK.erreurs:[]"),'durée',round(time.time()-t0),'s')
        await nav.close()
asyncio.run(main())
