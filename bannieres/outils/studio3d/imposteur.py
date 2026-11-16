# Imposteurs d'arbres et de rochers rendus depuis les modèles Poly Haven (CC0) : python3 imposteur.py
# Écrit jeu/imp/<nom>_<vue>.webp + jeu/imp/imp.json (pied, échelle). Vues : 'h' = carte/combat (52°), 'b' = ville (8°).
import asyncio,sys,os,json,base64,io
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'../../../outils-communs'))
from atelier import serveur,navigateur,page
from playwright.async_api import async_playwright
from PIL import Image
RAC=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
PH='/home/claude/ph/mod'
SORTIE=os.path.join(RAC,'jeu','imp')
# nom : (modèle, options)
LISTE=json.load(open(os.path.join(os.path.dirname(__file__),'imposteurs.json')))
async def main():
    os.makedirs(SORTIE,exist_ok=True)
    if not os.path.exists(os.path.join(RAC,'ph')):os.symlink(PH,os.path.join(RAC,'ph'))
    base=serveur(RAC,8797);meta={}
    seul=sys.argv[1].split(',') if len(sys.argv)>1 else None
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,base+'outils/studio3d/imposteur.html',512,512)
        await pg.wait_for_function('()=>window.rendre',timeout=30000)
        for nom,(mod,o) in LISTE.items():
            if seul and nom not in seul:continue
            gl=[f for f in os.listdir(os.path.join(PH,mod)) if f.endswith('.gltf')][0]
            for vue,elev in (('h',52),('b',8)):
                r=await pg.evaluate('([u,o])=>rendre(u,o)',[f'/ph/{mod}/{gl}',dict(o,elev=elev,taille=o.get('taille',384))])
                im=Image.open(io.BytesIO(base64.b64decode(r['url'].split(',')[1]))).convert('RGBA')
                if o.get('sat') or o.get('lum'):
                    from PIL import ImageEnhance
                    a=im.getchannel('A');rgb=im.convert('RGB')
                    if o.get('sat'):rgb=ImageEnhance.Color(rgb).enhance(o['sat'])
                    if o.get('lum'):rgb=ImageEnhance.Brightness(rgb).enhance(o['lum'])
                    im=rgb.convert('RGBA');im.putalpha(a)
                bb=im.getbbox()
                if bb:im=im.crop(bb);px,py=r['pied'][0]-bb[0],r['pied'][1]-bb[1]
                f=f'{nom}_{vue}.webp';im.save(os.path.join(SORTIE,f),'WEBP',quality=82,method=6)
                meta[f'{nom}_{vue}']={'w':im.width,'h':im.height,'px':round(px,1),'py':round(py,1),'ppm':round(r['ppm'],3),'haut':round(r['haut'],2),'larg':round(r['larg'],2)}
                print(nom,vue,im.size,os.path.getsize(os.path.join(SORTIE,f))//1024,'Kio',flush=True)
        await nav.close()
    mp=os.path.join(SORTIE,'imp.json');old=json.load(open(mp)) if os.path.exists(mp) else {};old.update(meta);json.dump(old,open(mp,'w'),indent=0)
asyncio.run(main())
