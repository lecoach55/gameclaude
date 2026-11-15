# Banc de performance reproductible (graine fixe) pour Couronnes & Complots, basé sur outils-communs/atelier.py
# usage : python3 perf.py fichier.html sortie.json
# Mesure (rendu logiciel : valeurs RELATIVES, pour comparer deux versions) :
#  - repos : carte affichée, rien ne bouge
#  - zoom  : zoom + déplacement continus (comme un doigt sur téléphone)
#  - ia    : tour d'IA à vitesse normale (combats, animations, journal)
#  - render_ms : coût JavaScript d'un render() complet
import asyncio,json,sys,os
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import navigateur,page,mesurer
from playwright.async_api import async_playwright
SEED="(()=>{let a=12345;Math.random=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})()"
async def banc(nav,url,w,h):
    pg=await page(nav,url,w,h);await pg.add_init_script(SEED);await pg.goto(url);await pg.wait_for_timeout(800)
    await pg.evaluate("()=>{$('np').value='4';$('np').dispatchEvent(new Event('change'))}");await pg.click('#go');await pg.wait_for_timeout(2500)
    r={'taille':f'{w}x{h}'}
    r['repos']=await mesurer(pg,3000)
    await pg.evaluate("()=>{window.__z=true;let k=0;const f=()=>{if(!window.__z)return;k++;const s=1+.5*Math.sin(k/20);vb.w=VB0.w/(1.3+s);vb.x=VB0.x+200+150*Math.sin(k/37);vb.y=VB0.y+120+90*Math.cos(k/29);applyVB();requestAnimationFrame(f)};requestAnimationFrame(f)}")
    r['zoom']=await mesurer(pg,3000)
    await pg.evaluate("()=>{window.__z=false;vb={...VB0};applyVB()}")
    r['render_ms']=await pg.evaluate("()=>{const t=performance.now();for(let i=0;i<20;i++)render();return +((performance.now()-t)/20).toFixed(2)}")
    await pg.evaluate("()=>{S.players[0].ai=true;S.players[0].lvl='normal';$('speed').value='320';if(!S.busy)aiTurn()}")
    await pg.wait_for_timeout(500)
    r['ia']=await mesurer(pg,4000)
    r['erreurs']=pg.erreurs;await pg.close();return r
async def main():
    f=os.path.abspath(sys.argv[1]);out=sys.argv[2]
    async with async_playwright() as p:
        nav=await navigateur(p);res=[]
        for w,h in [(390,780),(483,755),(1440,900)]:res.append(await banc(nav,'file://'+f,w,h))
        await nav.close()
    json.dump(res,open(out,'w'),indent=1);[print(json.dumps(x)) for x in res]
asyncio.run(main())
