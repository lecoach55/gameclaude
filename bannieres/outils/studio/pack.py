# Assemble les images rendues en planches WebP intégrables : python3 pack.py dossier_images ../../jeu/sprites3d.js
# Chaque créature : une planche (une ligne d'images recadrées), le point d'appui au sol et l'échelle (pixels par unité du monde).
import sys,glob,os,json,base64,io
from PIL import Image,ImageFilter,ImageEnhance,ImageChops
D,OUT=sys.argv[1],sys.argv[2]
ANIMS=['idle','atk','hit','die']
PXU={'dragonvert':224/3.3,'dragonos':224/3.3,'wyverne':176/2.6}
def traiter(im):
    im=im.convert('RGBA');r,g,b,a=im.split();rgb=Image.merge('RGB',(r,g,b))
    import numpy as np;A=np.asarray(a,dtype=np.float32)>40;L=np.asarray(rgb.convert('L'),dtype=np.float32)[A].mean()/255 if A.any() else .5
    rgb=ImageEnhance.Color(rgb).enhance(1.4);rgb=ImageEnhance.Brightness(rgb).enhance(max(.9,min(1.3,.42/max(.05,L))));rgb=ImageEnhance.Contrast(rgb).enhance(1.1)
    # contour sombre doux (comme les créatures dessinées)
    a2=a.filter(ImageFilter.MaxFilter(3));contour=Image.new('RGBA',im.size,(24,14,6,0));contour.putalpha(a2.point(lambda v:int(v*.6)))
    corps=Image.merge('RGBA',(*rgb.split(),a));contour.alpha_composite(corps);return contour
res={}
for f in sorted(glob.glob(D+'/*_idle0.png')):
    cid=os.path.basename(f).split('_')[0];frames=[];nb={}
    for an in ANIMS:
        l=sorted(glob.glob(f'{D}/{cid}_{an}[0-9].png'));nb[an]=len(l);frames+= [traiter(Image.open(x)) for x in l]
    bb=None
    for im in frames:
        b=im.getbbox()
        if b: bb=b if bb is None else (min(bb[0],b[0]),min(bb[1],b[1]),max(bb[2],b[2]),max(bb[3],b[3]))
    x0,y0,x1,y1=bb;x0=max(0,x0-1);y0=max(0,y0-1);x1+=1;y1+=1
    # appui au sol : bas de la silhouette au repos, centre des pixels opaques des dernières lignes
    i0=frames[0];a=i0.split()[3];w,h=i0.size;px=a.load();yb=max(y for y in range(h) for x in range(w) if px[x,y]>40)
    xs=[x for y in range(max(0,yb-6),yb+1) for x in range(w) if px[x,y]>40];ax=(min(xs)+max(xs))/2
    fw,fh=x1-x0,y1-y0;sheet=Image.new('RGBA',(fw*len(frames),fh))
    for k,im in enumerate(frames):sheet.alpha_composite(im.crop((x0,y0,x1,y1)),(k*fw,0))
    buf=io.BytesIO();sheet.save(buf,'WEBP',quality=82,method=6)
    res[cid]={'w':fw,'h':fh,'ax':round(ax-x0,1),'ay':yb-y0,'n':nb,'pxu':round(PXU.get(cid,168/2.35),1),'img':'data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode()}
    print(cid,fw,fh,len(frames),len(buf.getvalue())//1024,'Kio')
open(OUT,'w').write("'use strict';\n/* Créatures pré-rendues en 3D (outils/studio : modèles de Valdragon — Mixamo, dragon « Drago » d'Oscar Creativo CC BY 4.0, armes KayKit CC0). Généré par pack.py. */\nvar SPR3D="+json.dumps(res,separators=(',',':'))+";\n")
print('total',os.path.getsize(OUT)//1024,'Kio')
