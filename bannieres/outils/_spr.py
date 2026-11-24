import asyncio,sys,os
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page
from playwright.async_api import async_playwright
JEU=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
async def main():
    base=serveur(JEU,8801)
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,base+'index.html?v3d=0',1400,500)
        await pg.wait_for_timeout(4000)
        await pg.evaluate("""async()=>{const ids=%s;const c=document.createElement('canvas');c.width=ids.length*140;c.height=200;const g=c.getContext('2d');g.fillStyle='#6a8a4a';g.fillRect(0,0,c.width,c.height);
          for(let i=0;i<ids.length;i++){try{const s=spriteCreature(ids[i],160);g.drawImage(s,i*140-10,10,160,160);}catch(e){}g.fillStyle='#fff';g.font='14px sans-serif';g.fillText(ids[i],i*140+10,190);}
          document.body.innerHTML='';document.body.appendChild(c);c.style.position='fixed';c.style.left='0';c.style.top='0';}"""%sys.argv[2])
        await pg.wait_for_timeout(500);await pg.screenshot(path=sys.argv[1])
        await nav.close()
asyncio.run(main())
