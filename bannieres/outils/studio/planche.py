# Planche de contrôle : python3 planche.py dossier sortie.png [anims]
import sys,glob,os
from PIL import Image,ImageDraw
D,O=sys.argv[1],sys.argv[2];AN=(sys.argv[3] if len(sys.argv)>3 else 'idle0,atk1,atk2,hit0,die2').split(',')
ids=sorted(set(os.path.basename(f).split('_')[0] for f in glob.glob(D+'/*_idle0.png')))
rows=[]
for c in ids:
    ims=[Image.open(f'{D}/{c}_{a}.png').convert('RGBA') for a in AN if os.path.exists(f'{D}/{c}_{a}.png')]
    W=sum(i.width for i in ims);H=max(i.height for i in ims);r=Image.new('RGBA',(W+90,H),(96,128,72,255));x=90
    for i in ims:r.alpha_composite(i,(x,H-i.height));x+=i.width
    ImageDraw.Draw(r).text((4,4),c,fill=(255,255,255,255));rows.append(r)
cols=2;import math
n=math.ceil(len(rows)/cols);cw=max(r.width for r in rows)
o=Image.new('RGB',(cw*cols,sum(max(r.height for r in rows[i*cols:(i+1)*cols]) for i in range(n))),(0,0,0));y=0
for i in range(n):
    grp=rows[i*cols:(i+1)*cols];h=max(r.height for r in grp)
    for j,r in enumerate(grp):o.paste(r,(j*cw,y))
    y+=h
o.save(O);print(o.size)
