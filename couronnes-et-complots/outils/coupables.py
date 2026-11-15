# Mesure le gain de chaque effet coûteux en le désactivant (zoom continu, 1440x900)
import asyncio,json,sys,os
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import navigateur,page,mesurer
from playwright.async_api import async_playwright
V={
 'aucun':"",
 'ombre_carte':"$('map').style.filter='none'",
 'textures':"document.querySelectorAll('#map rect[filter]').forEach(e=>e.remove())",
 'cote_rugueuse':"$('bCoast').removeAttribute('filter')",
 'ombres_blasons':"document.querySelectorAll('.tok .body').forEach(e=>e.removeAttribute('filter'))",
 'melange':"document.querySelectorAll('#map [style*=mix-blend]').forEach(e=>e.style.mixBlendMode='normal')",
 'tout':"$('map').style.filter='none';document.querySelectorAll('#map rect[filter]').forEach(e=>e.remove());$('bCoast').removeAttribute('filter');document.querySelectorAll('.tok .body').forEach(e=>e.removeAttribute('filter'))",
}
async def main():
    url='file://'+os.path.abspath(sys.argv[1])
    async with async_playwright() as p:
        nav=await navigateur(p)
        for k,js in V.items():
            pg=await page(nav,url,1440,900);await pg.wait_for_timeout(600);await pg.click('#go');await pg.wait_for_timeout(2500)
            if js:await pg.evaluate("()=>{"+js+"}")
            await pg.evaluate("()=>{let k=0;const f=()=>{k++;vb.w=VB0.w/(1.8+.5*Math.sin(k/20));vb.x=VB0.x+200+150*Math.sin(k/37);vb.y=VB0.y+120;applyVB();requestAnimationFrame(f)};requestAnimationFrame(f)}")
            print(k,json.dumps(await mesurer(pg,2500)),flush=True);await pg.close()
        await nav.close()
asyncio.run(main())
