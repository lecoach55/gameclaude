#!/usr/bin/env python3
"""Planche de tout le studio : une vignette par jeu + bande des 6 couleurs dominantes
+ luminance / saturation moyennes (pour comparer les « lumières » des jeux).

python3 studio/ressources/planche_studio.py <dossier_revue> sortie.jpg [motif=vitrine.png] [colonnes=4]
<dossier_revue>/<jeu>/<motif> ; écrit aussi sortie.json (couleurs et mesures par jeu).
Exemple : python3 studio/ressources/planche_studio.py /home/claude/art studio/rapports/2026-11-16_art_planche.jpg
          python3 studio/ressources/planche_studio.py /home/claude/art planche_tel.jpg tel_*.png 6
"""
import sys, os, glob, json, colorsys
from PIL import Image, ImageDraw, ImageFont

NOMS = {'bannieres':'Bannières & Sortilèges','cage-et-gloire':'Cage & Gloire','couronnes-et-complots':'Couronnes & Complots',
 'couronnes-et-lignees':'Couronnes & Lignées','hameau':'Hameau 3D','president-de-club':'Président de Club',
 'sedes-petri':'Sedes Petri','trone-de-braise':'Le Trône de Braise','une-vie':'Une vie parmi 8 milliards',
 'valdragon':'Valdragon','wallstreet':'Wall Street'}

def police(t):
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf']:
        if os.path.exists(p): return ImageFont.truetype(p, t)
    return ImageFont.load_default()

def mesures(im):
    p = im.convert('RGB').resize((160, 100))
    q = p.quantize(colors=6, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()[:18]; cnt = sorted(q.getcolors(), reverse=True)
    couleurs = ['#%02x%02x%02x' % tuple(pal[i*3:i*3+3]) for _, i in cnt]
    L = S = 0; px = list(p.get_flattened_data() if hasattr(p, 'get_flattened_data') else p.getdata())
    for r, g, b in px:
        h, l, s = colorsys.rgb_to_hls(r/255, g/255, b/255); L += l; S += s
    return couleurs, round(L/len(px), 3), round(S/len(px), 3)

def main():
    src, out = sys.argv[1], sys.argv[2]
    motif = sys.argv[3] if len(sys.argv) > 3 else 'vitrine.png'
    cols = int(sys.argv[4]) if len(sys.argv) > 4 else 4
    jeux = []
    for d in sorted(os.listdir(src)):
        f = sorted(glob.glob(os.path.join(src, d, motif)))
        if f and d in NOMS: jeux.append((d, f[0]))
    if not jeux: sys.exit('aucune image')
    W = 1280 // cols * 2 if cols <= 4 else 260
    im0 = Image.open(jeux[0][1]); H = int(W * im0.height / im0.width)
    bande, titre = 26, 34
    rows = (len(jeux) + cols - 1) // cols
    planche = Image.new('RGB', (cols*W + (cols+1)*12, rows*(H+bande+titre+12) + 12), '#15120f')
    dr = ImageDraw.Draw(planche); f1 = police(20 if W >= 400 else 15); f2 = police(13)
    info = {}
    for k, (d, f) in enumerate(jeux):
        im = Image.open(f).convert('RGB'); cou, L, S = mesures(im)
        info[d] = {'image': f, 'couleurs': cou, 'luminance': L, 'saturation': S}
        x = 12 + (k % cols)*(W+12); y = 12 + (k//cols)*(H+bande+titre+12)
        dr.text((x+2, y+6), NOMS[d], fill='#ecdfc0', font=f1)
        if W >= 400: dr.text((x+W-170, y+10), f'L {L:.2f}  S {S:.2f}', fill='#a89878', font=f2)
        planche.paste(im.resize((W, int(W*im.height/im.width))).crop((0, 0, W, H)), (x, y+titre))
        for i, c in enumerate(cou):
            dr.rectangle([x+i*W//6, y+titre+H, x+(i+1)*W//6-1, y+titre+H+bande], fill=c)
    planche.save(out, quality=88)
    json.dump(info, open(os.path.splitext(out)[0] + '.json', 'w'), ensure_ascii=False, indent=1)
    print(out, planche.size)

main()
