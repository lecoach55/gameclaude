#!/usr/bin/env python3
"""Budget de poids de la page publiée (limite 16 Mio) : qui prend la place, et ce qui semble inutilisé.
usage : python3 poids.py [valdragon3d.html]   (construire d'abord : python3 build.py inline)
Affiche par famille (modèles, textures, sons, musiques, code) puis les 15 plus gros éléments,
et signale les ressources intégrées dont le nom n'apparaît nulle part dans le code (candidates à retirer)."""
import re,sys,os
f=sys.argv[1] if len(sys.argv)>1 else 'valdragon3d.html'
s=open(f,encoding='utf-8').read();tot=len(s.encode())
items=[(m.group(1),len(m.group(2))) for m in re.finditer(r'<script type="text/plain" id="([^"]+)">(.*?)</script>',s,re.S)]
fam={'vdm-':'modèles 3D (mq/*.glb)','vdtx-':'textures (tex/, atlas)','vds-':'bruitages (snd/)','vdmu-':'musiques (mus/)'}
agg={};blob=0
for i,n in items:
    k=next((v for p,v in fam.items() if i.startswith(p)),'autres');agg[k]=agg.get(k,0)+n;blob+=n
agg['code (moteur 3D + jeu)']=tot-blob
M=1048576;print(f'Page : {tot/M:.2f} Mio sur 16 — marge {16-tot/M:.2f} Mio\n')
for k,v in sorted(agg.items(),key=lambda x:-x[1]):print(f'  {k:28s} {v/M:6.2f} Mio  {v/tot*100:4.1f} %')
print('\nLes 15 plus gros éléments (taille dans la page, base64 inclus) :')
for i,n in sorted(items,key=lambda x:-x[1])[:15]:print(f'  {i:28s} {n/1024:8.0f} Kio')
code=''.join(open(x,encoding='utf-8').read() for x in ['core.js','render.js','story.js','ui3.js','g3d.js','kit.js','vfx.js','grime.js','audio.js','mxanim.js'] if os.path.exists(x))
unused=[]
for i,n in items:
    name=re.sub(r'^vd(m|tx|s|mu)-','',i)
    base=re.sub(r'_[dn]$','',name)
    if name not in code and base not in code and not re.search(r"['\"`]"+re.escape(name.split('_')[0]),code):unused.append((i,n))
if unused:
    print('\nPeut-être inutilisés (nom absent du code — vérifier avant de retirer) :')
    for i,n in unused:print(f'  {i:28s} {n/1024:8.0f} Kio')
