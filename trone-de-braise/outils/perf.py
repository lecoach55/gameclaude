# Banc reproductible (graine fixe) : images/s sur la carte et en donjon (combat automatique).
# python3 perf.py sortie.json [ralenti_cpu]   (valeurs RELATIVES : rendu logiciel ici)
import asyncio,sys,os,json
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page,mesurer
from playwright.async_api import async_playwright
JEU=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
async def main():
    out=sys.argv[1]; ral=float(sys.argv[2]) if len(sys.argv)>2 else 1
    base=serveur(JEU,8771); res={}
    async with async_playwright() as p:
        nav=await navigateur(p); pg=await page(nav,base+'index.html?graine=9',1280,800)
        if ral>1:
            cdp=await pg.context.new_cdp_session(pg); await cdp.send('Emulation.setCPUThrottlingRate',{'rate':ral})
        await pg.wait_for_timeout(800)
        fige='true' if os.environ.get('FIGE','1')=='1' else 'false'
        await pg.evaluate("()=>{ADAPT.fige="+fige+";TEST=true;G=nouvellePartie({classe:'arcaniste'});G.evts=[];entrerRoyaume();JEU.UI.sel='valsombre';panneau();}")
        await pg.wait_for_timeout(1000); res['carte']=await mesurer(pg,4000)
        for nom,js in [('donjon_combat',"JEU.UI.auto=true;lancerExpedition({type:'catacombes',niveau:5,etages:3,nom:'Banc'},()=>{});"),('boss',"JEU.UI.auto=true;lancerExpedition({type:'antre',niveau:6,etages:1,nom:'Banc',boss:'wyverne'},()=>{});const A=JEU.A;A.p.x=A.boss.x-4;A.p.y=A.boss.y;A.p.S.pvmax*=40;A.p.pv=A.p.S.pvmax;")]:
            await pg.evaluate("()=>{"+js+"}"); await pg.wait_for_timeout(2500)
            res[nom]=await mesurer(pg,5000)
            res[nom]['entites']=await pg.evaluate("()=>JEU.A?JEU.A.mobs.filter(m=>!m.mort).length+JEU.A.fx.length:0")
        res['erreurs']=pg.erreurs
        await nav.close()
    json.dump(res,open(out,'w'),indent=1,ensure_ascii=False); print(json.dumps(res,ensure_ascii=False))
asyncio.run(main())
