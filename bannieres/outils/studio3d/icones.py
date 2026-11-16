# Icônes de ressources réalistes, modelées par le code : python3 icones.py → jeu/icones3d.js (IMGRES)
import asyncio,sys,os,base64,io,json
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../../outils-communs'))
from atelier import serveur,navigateur,page
from playwright.async_api import async_playwright
from PIL import Image
RAC=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
async def main():
    base=serveur(RAC,8801);out={}
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,base+'outils/studio3d/icones.html',300,300)
        await pg.wait_for_function('()=>window.rendre',timeout=30000)
        for n in ['or','bois','minerai','mercure','soufre','cristal','gemmes']:
            await pg.evaluate("([n,s])=>rendre(n,s)",[n,192]);await pg.wait_for_timeout(1500)# textures chargées
            u=await pg.evaluate("([n,s])=>rendre(n,s)",[n,192])
            im=Image.open(io.BytesIO(base64.b64decode(u.split(',')[1]))).convert('RGBA');im=im.resize((96,96),Image.LANCZOS)
            if len(sys.argv)>1:im.save(f'{sys.argv[1]}/{n}.png')
            b=io.BytesIO();im.save(b,'WEBP',quality=88);out[n]='data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode();print(n,len(b.getvalue())//1024,'Kio')
        await nav.close()
    open(os.path.join(RAC,'jeu','icones3d.js'),'w').write("'use strict';\n/* Icônes de ressources rendues en 3D (outils/studio3d/icones.py). */\nvar ICO3D="+json.dumps(out)+";\n")
asyncio.run(main())
