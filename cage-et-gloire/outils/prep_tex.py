#!/usr/bin/env python3
"""Textures réalistes de l'arène (Poly Haven, CC0) → jeu/tex/*.jpg, intégrées par build.py.
usage : python3 outils/prep_tex.py [dossier_sources]  (télécharge via outils-communs/phget.py si absent)
- tapis : relief de toile (rough_linen, normal GL) 512 px, tuilé sur le tapis
- tapis en qualité Haute seulement (relief de toile recadré à 512 px du 1k)"""
import sys,os
from PIL import Image
D=os.path.dirname(os.path.abspath(__file__));J=os.path.join(D,'..','jeu','tex');os.makedirs(J,exist_ok=True)
src=sys.argv[1] if len(sys.argv)>1 else '/home/claude/assets/ph'
sys.path.insert(0,os.path.join(D,'..','..','outils-communs'))
L=[('rough_linen','nor_gl','tapis_n.jpg',512,80)]
for pid,m,out,px,q in L:
    p=os.path.join(src,f'{pid}_{m}.jpg')
    if not os.path.exists(p):
        import phget;os.makedirs(src,exist_ok=True);phget.get(pid,'1k',(m,),src)
    im=Image.open(p).convert('RGB');w,h=im.size;im=im.crop(((w-px)//2,(h-px)//2,(w+px)//2,(h+px)//2))  # recadré (pas réduit) : garde le relief
    im.save(os.path.join(J,out),quality=q,optimize=True);print(out,os.path.getsize(os.path.join(J,out))//1024,'Kio')
