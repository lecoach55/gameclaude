#!/usr/bin/env python3
"""Catalogue de ressources gratuites (CC0) : cherche dans Poly Haven et ambientCG et fait une planche d'aperçus.
usage : python3 catalogue.py "mot1,mot2" [textures|models|hdris|tous] [max=24] [planche.jpg]
ex.   : python3 catalogue.py "lava,magma" textures 16 /tmp/lave.jpg
Les aperçus viennent des vignettes (cdn.polyhaven.com, acg-media.struffelproductions.com) si ces domaines sont autorisés,
sinon de la couleur 1k (Poly Haven) ou du fichier .png d'aperçu contenu dans le zip 1K (ambientCG) — plus lent.
Ensuite : phget.py (Poly Haven) ou  curl -L -A valdragon-asset-tool/1.0 "https://ambientcg.com/get?file=<Id>_1K-JPG.zip"."""
import sys,json,urllib.request,io,zipfile,os,re,concurrent.futures as cf
from PIL import Image,ImageDraw
UA=[('User-Agent','valdragon-asset-tool/1.0')];o=urllib.request.build_opener();o.addheaders=UA;urllib.request.install_opener(o)
def get(u,t=60):return urllib.request.urlopen(u,timeout=t).read()
mots=[m.strip().lower() for m in sys.argv[1].split(',')];typ=sys.argv[2] if len(sys.argv)>2 else 'textures';MX=int(sys.argv[3]) if len(sys.argv)>3 else 24;out=sys.argv[4] if len(sys.argv)>4 else '/tmp/catalogue.jpg'
res=[]
# Poly Haven
for t in (['textures','models','hdris'] if typ=='tous' else [typ]):
    d=json.loads(get('https://api.polyhaven.com/assets?t='+t))
    for k,v in d.items():
        txt=(k+' '+' '.join(v.get('tags',[]))+' '+' '.join(v.get('categories',[]))+' '+v.get('name','')).lower()
        if any(re.search(r'(^|[\s_])'+re.escape(m),txt) for m in mots):res.append({'src':'polyhaven','id':k,'type':t,'nom':v.get('name',k),'pop':v.get('download_count',0),'tri':v.get('polycount')})
# ambientCG
at={'textures':'Material','models':'3DModel','hdris':'HDRI'}
for t in (['textures','models','hdris'] if typ=='tous' else [typ]):
    for m in mots:
        try:d=json.loads(get(f'https://ambientcg.com/api/v2/full_json?q={m}&type={at[t]}&limit=40&include=imageData,downloadData'))
        except Exception:continue
        for a in d.get('foundAssets',[]):
            if not any(r['id']==a['assetId'] for r in res):res.append({'src':'ambientcg','id':a['assetId'],'type':t,'nom':a.get('displayName',a['assetId']),'pop':a.get('downloadCount',0),'img':a.get('previewImage',{}).get('256-PNG'),'zip':next((x['downloadLink'] for x in a.get('downloadFolders',{}).get('default',{}).get('downloadFiletypeCategories',{}).get('zip',{}).get('downloads',[]) if x['attribute']=='1K-JPG'),None)})
res.sort(key=lambda r:-(r['pop'] or 0));res=res[:MX]
def apercu(r):
    try:
        if r['src']=='polyhaven':
            try:return Image.open(io.BytesIO(get(f"https://cdn.polyhaven.com/asset_img/thumbs/{r['id']}.png?width=256&height=256",20)))
            except Exception:
                if r['type']=='textures':
                    f=json.loads(get('https://api.polyhaven.com/files/'+r['id']));return Image.open(io.BytesIO(get(f['Diffuse']['1k']['jpg']['url'])))
                return None
        try:return Image.open(io.BytesIO(get(r['img'],20)))
        except Exception:
            if r.get('zip'):
                z=zipfile.ZipFile(io.BytesIO(get(r['zip'],120)));n=[x for x in z.namelist() if x.endswith('.png') and '_' not in x]or[x for x in z.namelist() if x.endswith('Color.jpg')]
                return Image.open(io.BytesIO(z.read(n[0]))) if n else None
    except Exception:return None
with cf.ThreadPoolExecutor(8) as ex:ims=list(ex.map(apercu,res))
S=200;C=6;rows=(len(res)+C-1)//C;pl=Image.new('RGB',(C*S,rows*(S+30)),(24,22,20));d=ImageDraw.Draw(pl)
for i,(r,im) in enumerate(zip(res,ims)):
    x,y=(i%C)*S,(i//C)*(S+30)
    if im:im=im.convert('RGB');im.thumbnail((S,S));pl.paste(im,(x+(S-im.width)//2,y+(S-im.height)//2))
    d.text((x+3,y+S+2),r['id'][:30],fill=(255,225,170));d.text((x+3,y+S+15),f"{r['src']} · {r['type']}"+(f" · {r['tri']} tri" if r.get('tri') else ''),fill=(170,160,150))
pl.save(out,quality=85);print(f'{len(res)} résultats → {out}')
for r in res:print(f"  {r['src']:9s} {r['type']:8s} {r['id']}")
