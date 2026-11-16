# Comparaison d'images : référence vs nouvelle version. Signale les changements visuels involontaires.
# usage : python3 compare.py dossier_ref dossier_nouveau planche.png [seuil_pct]
import sys,os,numpy as np
from PIL import Image,ImageFilter,ImageDraw,ImageFont
ref,new,outp=sys.argv[1],sys.argv[2],sys.argv[3];SEUIL=float(sys.argv[4]) if len(sys.argv)>4 else 6
W,H=195,390
def prep(p):
    im=Image.open(p).convert('RGB').resize((W,H),Image.LANCZOS)
    # on ignore le haut et le bas (interface, textes animés)
    a=np.asarray(im.filter(ImageFilter.GaussianBlur(1.5)),dtype=np.float32);return im,a
def fin(pa,pb):
    # détail fin : à la taille réelle (≤ 720 px de large, proportions gardées), tolérance ±1 px.
    # Voit ce que la vue réduite ignore (taille d'un texte, petits pictogrammes). Informatif : ne déclenche pas d'alerte.
    A=Image.open(pa).convert('L');B=Image.open(pb).convert('L')
    w=min(720,A.width);h=round(A.height*w/A.width);A=A.resize((w,h),Image.LANCZOS);B=B.resize((w,h),Image.LANCZOS)
    a=np.asarray(A,dtype=np.float32);b=np.asarray(B,dtype=np.float32);d=np.full(a.shape,1e9,np.float32)
    for dy in (-1,0,1):
        for dx in (-1,0,1):d=np.minimum(d,np.abs(np.roll(np.roll(a,dy,0),dx,1)-b))
    return 100*(d[int(h*.08):int(h*.86)]>40).mean()
try:f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',11)
except:f=None
rows=[];tiles=[]
for n in sorted(os.listdir(ref)):
    if not n.endswith('.png') or not os.path.exists(os.path.join(new,n)):continue
    ia,a=prep(os.path.join(ref,n));ib,b=prep(os.path.join(new,n))
    m=np.zeros((H,W),bool);m[int(H*.08):int(H*.86),:]=True
    la=(a*[.299,.587,.114]).sum(-1);lb=(b*[.299,.587,.114]).sum(-1)
    # écart tolérant : pour chaque pixel, la meilleure correspondance dans un voisinage de ±3 px (balancement de caméra, animations)
    d=np.full((H,W),1e9,np.float32)
    for dy in range(-3,4):
        for dx in range(-3,4):
            d=np.minimum(d,np.abs(np.roll(np.roll(a,dy,0),dx,1)-b).max(-1))
    ch=(d>22)&m;pct=100*ch.sum()/m.sum();dl=lb[m].mean()-la[m].mean()
    alerte=pct>SEUIL or abs(dl)>4
    rows.append((n[:-4],pct,dl,alerte,fin(os.path.join(ref,n),os.path.join(new,n))))
    hm=np.zeros((H,W,3),np.uint8);hm[...,0]=np.clip(d*3,0,255);hm[...,1]=np.clip(d*1.2,0,255)*0;g=(np.asarray(ib.convert('L'))*.35).astype(np.uint8)
    hm=np.maximum(hm,np.stack([g,g,g],-1));tiles.append((n[:-4],ia,ib,Image.fromarray(hm),pct,dl,alerte))
C=Image.new('RGB',(W*3+10,(H+22)*len(tiles)+30),(16,14,12));dr=ImageDraw.Draw(C)
dr.text((6,6),'référence  |  nouvelle version  |  écarts (rouge)',fill=(240,200,120),font=f)
for i,(n,ia,ib,hm,pct,dl,al) in enumerate(tiles):
    y=30+i*(H+22);C.paste(ia,(0,y+18));C.paste(ib,(W+5,y+18));C.paste(hm,(2*W+10,y+18))
    dr.text((6,y+2),f'{n} : {pct:.1f} % de pixels changés, luminosité {dl:+.1f}'+('  ⚠ À VÉRIFIER' if al else '  ✓'),fill=(255,120,100) if al else (160,220,160),font=f)
C.save(outp)
print(f"{'scène':12s} {'changé':>8s} {'lum.':>6s}")
for n,p,dl,al,fp in rows:print(f'{n:12s} {p:7.1f}% {dl:+6.1f}  '+('⚠ À VÉRIFIER' if al else 'ok')+(f'   détail fin {fp:.1f}%' if fp>=.05 else ''))
if any(r[4]>=.3 and not r[3] for r in rows):print('Note : changements fins détectés (textes, petits détails) sans alerte : regarder la planche.')
print('ALERTES',sum(r[3] for r in rows),'/',len(rows))
