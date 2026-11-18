#!/usr/bin/env python3
"""Matières réalistes de la maquette (Poly Haven, CC0) → jeu/tex/<sorte>.jpg, intégrées par build.py (objet PHOTO).
usage : python3 une-vie/outils/prep_tex.py [dossier_sources]   (télécharge via outils-communs/phget.py si absent)
Chaque photo est réduite à 256 px (tuilage conservé), ramenée à la couleur moyenne de l'ancienne texture
dessinée (même équilibre de lumière que la v21) puis adoucie (saturation × ADOUCIR). « grass » et « grain »
restent en niveaux de gris (multipliés par la couleur par sommet / des saisons)."""
import sys,os,colorsys
from PIL import Image,ImageOps,ImageEnhance,ImageStat
D=os.path.dirname(os.path.abspath(__file__));J=os.path.join(D,'..','jeu','tex');os.makedirs(J,exist_ok=True)
src=sys.argv[1] if len(sys.argv)>1 else '/home/claude/assets/ph'
sys.path.insert(0,os.path.join(D,'..','..','outils-communs'))
ADOUCIR=.82
# sorte du jeu : (id Poly Haven, couleur moyenne visée = ancienne base, contraste, taille)
L={
 'wood':    ('wood_floor',          '#9c7149',1.0,256),
 'tiles':   ('marble_01',           '#ddd5c4',.45,256),
 'marble':  ('floor_tiles_06',      '#d8cfc0',.38,256),
 'dirt':    ('brown_mud_dry',       '#8b6a48',.9,256),
 'mud':     ('mud_cracked_dry_03',  '#b98458',.7,256),
 'concrete':('concrete_floor_02',   '#9c9a94',.9,256),
 'plaster': ('painted_plaster_wall','#e9e1d2',.8,256),
 'paint':   ('painted_plaster_wall','#c9d6c4',.8,256),
 'brick':   ('red_brick_03',        '#a35b45',.9,256),
 'asphalt': ('asphalt_02',          '#4a4b4f',.8,256),
 'tin':     ('corrugated_iron',     '#9aa3a8',1.0,256),
 'roof':    ('clay_roof_tiles_02',  '#94513d',.85,256),
 'grass':   ('aerial_grass_rock',   None,     .55,256),
}
def hexrgb(h):return tuple(int(h[i:i+2],16) for i in (1,3,5))
def adoucir(rgb):
    r,g,b=[c/255 for c in rgb];h,l,s=colorsys.rgb_to_hls(r,g,b);r,g,b=colorsys.hls_to_rgb(h,l,s*ADOUCIR);return tuple(round(c*255) for c in (r,g,b))
tot=0
for sorte,(pid,cible,contraste,px) in L.items():
    p=os.path.join(src,f'{pid}_Diffuse.jpg')
    if not os.path.exists(p):
        import phget;os.makedirs(src,exist_ok=True);phget.get(pid,'1k',('Diffuse',),src)
    im=Image.open(p).convert('RGB').resize((px,px),Image.LANCZOS)
    if cible is None:   # niveaux de gris clairs (multipliés par la teinte du jeu)
        g=ImageOps.grayscale(im);m=ImageStat.Stat(g).mean[0]
        g=g.point(lambda v:max(0,min(255,round(232+(v-m)*contraste))));im=Image.merge('RGB',(g,g,g))
    else:
        t=adoucir(hexrgb(cible));g=ImageOps.grayscale(im);m=ImageStat.Stat(im).mean;mg=ImageStat.Stat(g).mean[0]
        # garde la teinte propre de la photo (variations), recentre sur la couleur visée, contraste réglé
        bands=[]
        for k,b in enumerate(im.split()):
            mk=m[k];tk=t[k]
            bands.append(b.point(lambda v,mk=mk,tk=tk:max(0,min(255,round(tk+(v-mk)*contraste*tk/max(mk,1))))))
        im=Image.merge('RGB',bands)
    out=os.path.join(J,sorte+'.jpg');im.save(out,quality=80,optimize=True);n=os.path.getsize(out);tot+=n
    print(f'{sorte:9s} {pid:22s} {n//1024:3d} Kio')
print('total',tot//1024,'Kio')
