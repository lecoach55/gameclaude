# Singe : tapotements et clics au hasard pendant N secondes (ordinateur ou téléphone), on relève les erreurs.
# python3 monkey.py secondes [largeur hauteur] [graine]   (V3D=0 : carte 2D ; Q3D=0/1/2 : qualité 3D imposée)
import asyncio,sys,os,random,time
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../outils-communs'))
from atelier import serveur,navigateur,page
from playwright.async_api import async_playwright
JEU=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../jeu')
async def main():
    S=int(sys.argv[1]);W=int(sys.argv[2]) if len(sys.argv)>2 else 1280;H=int(sys.argv[3]) if len(sys.argv)>3 else 800;rs=int(sys.argv[4]) if len(sys.argv)>4 else 1
    random.seed(rs);base=serveur(JEU,8791)
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,base+'index.html?'+('v3d='+os.environ['V3D'] if 'V3D' in os.environ else '')+('&q3d='+os.environ['Q3D'] if 'Q3D' in os.environ else ''),W,H,acceleration=None)
        await pg.wait_for_timeout(800);await pg.click('#bTest');await pg.wait_for_function("()=>ECRAN==='aventure'",timeout=60000)
        await pg.evaluate("()=>{ACCEL=6;}")
        t0=time.time();n=0
        while time.time()-t0<S:
            r=random.random()
            try:
                if r<.55:await pg.mouse.click(random.randint(0,W-1),random.randint(0,H-1))
                elif r<.8:
                    bs=await pg.query_selector_all('button:visible')
                    if bs:await random.choice(bs).click(timeout=500)
                elif r<.9:await pg.keyboard.press(random.choice(['e','h','v',' ','Escape','ArrowLeft','ArrowDown']))
                else:
                    x,y=random.randint(0,W-1),random.randint(0,H-1);await pg.mouse.move(x,y);await pg.mouse.down();await pg.mouse.move(x+random.randint(-200,200),y+random.randint(-200,200),steps=4);await pg.mouse.up()
            except Exception as e:pass
            n+=1
            if n%50==0:
                st=await pg.evaluate("()=>({e:ECRAN,j:G?G.jour:null})")
                if st['e']=='accueil':
                    await pg.click('#bTest');await pg.wait_for_timeout(1500)
        err=pg.erreurs+await pg.evaluate("()=>TK?TK.erreurs:[]")
        print('actions',n,'écran',await pg.evaluate("ECRAN"),'jour',await pg.evaluate("G&&G.jour"),'erreurs',err[:8])
        await nav.close()
asyncio.run(main())
