# Captures de l'interface du donjon 2D (orbes, barre de compétences, nom du héros, mini-carte) sur trois formats,
# avec contrôle automatique des chevauchements entre éléments de l'interface.
# python3 hud2d.py dossier_sortie   → dossier/hud_<format>.png + chevauchements affichés (code 1 s'il y en a)
import asyncio,sys,os,json
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page,capturer
from playwright.async_api import async_playwright
JEU=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
FORMATS=[('telephone',390,844,True),('mac_panneau',449,800,False),('tablette',768,1024,False),('tel_paysage',844,390,True),('tel_se',375,667,True),('mac_912',912,755,False),('ordinateur',1280,800,False)]
SEL=['.orbe.vie','.orbe.mana','#hComp','#hNiv','#minicarte','#hLieu','.btns-d','#joy','#attq','.xp','#hBonus','#hAction']
CHEV="""(sel)=>{const R=[];const vis=e=>{if(!e)return null;const s=getComputedStyle(e);if(s.display==='none'||s.visibility==='hidden'||+s.opacity===0)return null;const r=e.getBoundingClientRect();return r.width&&r.height?r:null;};
 const B=sel.map(s=>[s,vis(document.querySelector(s))]).filter(x=>x[1]);const W=innerWidth,H=innerHeight;
 for(const[s,r]of B){if(r.left<-1||r.right>W+1||r.top<-1||r.bottom>H+1)R.push(s+' hors écran');}
 for(let i=0;i<B.length;i++)for(let j=i+1;j<B.length;j++){const a=B[i][1],b=B[j][1];const x=Math.min(a.right,b.right)-Math.max(a.left,b.left),y=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);if(x>2&&y>2)R.push(B[i][0]+' ∩ '+B[j][0]+' ('+Math.round(x)+'×'+Math.round(y)+')');}
 const t=document.querySelector('#hNiv');if(t&&vis(t)&&t.scrollWidth>t.clientWidth+1)R.push('#hNiv rogné');return R;}"""
async def main(out):
    os.makedirs(out,exist_ok=True);base=serveur(JEU,8773);tout={}
    async with async_playwright() as p:
        nav=await navigateur(p)
        for nom,w,h,tact in FORMATS:
            pg=await page(nav,base+'index.html?graine=21',w,h,tactile=tact);await pg.wait_for_timeout(600)
            await pg.evaluate("()=>{document.querySelector('#bNouvelle').click()}");await pg.wait_for_timeout(300)
            await pg.evaluate("()=>{const b=document.querySelector('#cMort button[data-v=\"1\"]');b&&b.click();document.querySelector('#cGo').click();JEU.G.options.d3=false;}");await pg.wait_for_timeout(300)
            for k in range(2): await pg.evaluate("()=>{const b=document.querySelector('#fen .pied .btn');b&&b.click()}");await pg.wait_for_timeout(250)
            await pg.evaluate("()=>{fermer();JEU.UI.sel='valsombre';panneau();document.querySelector('#panneau [data-a=\"expedition\"]').click();}");await pg.wait_for_timeout(1500)
            await pg.evaluate("()=>{const h=JEU.G.joueur.heros;h.nom='Émeric de Valsombre';h.points=2;document.querySelector('#hBonus').innerHTML='<span>⚡ Frénésie 12 s</span><span>🛡 Garde 8 s</span>';document.querySelector('#hAction').classList.add('on');}");await pg.wait_for_timeout(1500)
            r=await pg.evaluate(CHEV,SEL);tout[nom]=r
            await capturer(pg,os.path.join(out,f'hud_{nom}.png'));await pg.close()
    print(json.dumps(tout,ensure_ascii=False,indent=1));return sum(len(v) for v in tout.values())
if __name__=='__main__':
    n=asyncio.run(main(sys.argv[1] if len(sys.argv)>1 else '/tmp/tdb/hud'));sys.exit(1 if n else 0)
