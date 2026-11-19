"""Planche avant/après de sprites : la créature telle qu'elle est dans le jeu et sa nouvelle version, image par image,
à la même échelle (pixels par unité du monde), posées sur le même sol. Python + Pillow, sans Blender.

  python3 outils-communs/blender/planche_avant_apres.py AVANT APRES planche.png --id loup[,roc…] [--fond herbe|clair|sombre]

AVANT / APRÈS : un fichier sprites3d.js (var SPR3D={…}, celui du jeu ou un autre) ou un dossier d'images
<id>_<pose><k>.png (sortie de planche_sprites.py ou du studio Three.js ; son <id>.json donne pxu, sinon 168/2,35).
Chaque ligne est mise à l'échelle commune la plus grande et alignée sur le point d'appui au sol.
Rend aussi, en texte : taille, nombre d'images par pose, part opaque, luminance moyenne, pour chaque côté.
Code 2 si une créature manque d'un côté.
"""
import base64
import glob
import io
import json
import os
import re
import sys

from PIL import Image, ImageDraw, ImageFont, ImageStat

POSES = ['idle', 'atk', 'hit', 'die']
PXU_DEFAUT = round(168 / 2.35, 1)
FONDS = {'herbe': (84, 102, 62), 'clair': (214, 204, 178), 'sombre': (34, 32, 30)}


def lire_js(chemin):
    s = open(chemin, encoding='utf-8').read()
    i = s.index('var SPR3D=') + len('var SPR3D=')
    return json.loads(s[i:s.rindex(';')])


def depuis_js(d, cid):
    v = d.get(cid)
    if not v:
        return None
    sheet = Image.open(io.BytesIO(base64.b64decode(v['img'].split(',', 1)[1]))).convert('RGBA')
    fr, k = [], 0
    for p in POSES + [p for p in v['n'] if p not in POSES]:
        for i in range(v['n'].get(p, 0)):
            fr.append((p, i, sheet.crop((k * v['w'], 0, (k + 1) * v['w'], v['h']))))
            k += 1
    return {'images': fr, 'pxu': v.get('pxu', PXU_DEFAUT), 'ax': v['ax'], 'ay': v['ay']}


def appui(im):
    """Point d'appui comme pack.py : bas de la silhouette (alpha > 40), milieu des pixels opaques des 7 dernières lignes."""
    a = im.split()[3].point(lambda x: 255 if x > 40 else 0)
    bb = a.getbbox()
    if not bb:
        return im.width / 2, im.height
    yb = bb[3] - 1
    bande = a.crop((0, max(0, yb - 6), im.width, yb + 1)).getbbox()
    return ((bande[0] + bande[2]) / 2 if bande else im.width / 2), yb


def depuis_dossier(d, cid):
    """Images <cid>_<pose><k>.png du dossier ; la pose est un mot sans « _ » : loup_garou_idle0.png n'est pas au loup."""
    motif = re.compile(rf'{re.escape(cid)}_([a-z]+)(\d+)\.png')
    trouves = {}
    for f in glob.glob(os.path.join(d, f'{cid}_*.png')):
        m = motif.fullmatch(os.path.basename(f))
        if m:
            trouves.setdefault(m.group(1), []).append((int(m.group(2)), f))
    fr = []
    for p in POSES + sorted(set(trouves) - set(POSES)):
        for i, f in sorted(trouves.get(p, [])):
            fr.append((p, i, Image.open(f).convert('RGBA')))
    if not fr:
        return None
    pxu = PXU_DEFAUT
    j = os.path.join(d, f'{cid}.json')
    if os.path.isfile(j):
        try:
            pxu = json.load(open(j, encoding='utf-8')).get('pxu', pxu)
        except (OSError, ValueError):
            pass
    ax, ay = appui(fr[0][2])
    return {'images': fr, 'pxu': pxu, 'ax': ax, 'ay': ay}


def charger(src, cid, cache={}):
    if os.path.isdir(src):
        return depuis_dossier(src, cid)
    if src not in cache:
        cache[src] = lire_js(src)
    return depuis_js(cache[src], cid)


def stats(c):
    ims = [im for _p, _i, im in c['images']]
    n = {}
    for p, _i, _im in c['images']:
        n[p] = n.get(p, 0) + 1
    op, lum = [], []
    for im in ims:
        a = im.split()[3]
        m = a.point(lambda x: 255 if x > 40 else 0)
        op.append(ImageStat.Stat(m).mean[0] / 255)
        if m.getbbox():
            lum.append(ImageStat.Stat(im.convert('L'), m).mean[0])
    w, h = ims[0].size
    return {'taille': f'{w}×{h}', 'images': n, 'opaque': round(sum(op) / len(op), 3),
            'luminance': round(sum(lum) / len(lum), 1) if lum else None, 'pxu': c['pxu']}


def planche(avant, apres, ids, sortie, fond='herbe'):
    lignes, rapport, manque = [], {}, []
    for cid in ids:
        A, P = charger(avant, cid), charger(apres, cid)
        if not A or not P:
            manque.append(f'{cid} ({"avant" if not A else "après"})')
            continue
        lignes.append((cid, 'AVANT', A)); lignes.append((cid, 'APRÈS', P))
        rapport[cid] = {'avant': stats(A), 'apres': stats(P)}
    if not lignes:
        return rapport, manque
    pxu = max(c['pxu'] for _i, _l, c in lignes)
    marge, tete = 8, 74
    rangs = []
    for cid, lib, c in lignes:
        k = pxu / c['pxu']
        ims = [(p, i, im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)) for p, i, im in c['images']]
        rangs.append((cid, lib, ims, c['ax'] * k, c['ay'] * k))
    cw = max(max(im.width for _p, _i, im in r[2]) for r in rangs) + marge
    haut = max(max(r[4] for r in rangs) + 0, 1)
    bas = max(max(im.height - r[4] for _p, _i, im in r[2]) for r in rangs)
    ch = int(haut + bas) + marge * 2
    ncol = max(len(r[2]) for r in rangs)
    W, H = tete + ncol * cw, len(rangs) * ch
    pl = Image.new('RGBA', (W, H), FONDS.get(fond, FONDS['herbe']) + (255,))
    d = ImageDraw.Draw(pl)
    try:   # police avec accents (la police par défaut de Pillow n'a pas « È »)
        fonte = ImageFont.truetype('DejaVuSans.ttf', 12)
    except OSError:
        try:
            fonte = ImageFont.load_default(size=12)
        except TypeError:
            fonte = ImageFont.load_default()
    for j, (cid, lib, ims, ax, ay) in enumerate(rangs):
        y0 = j * ch
        if j % 2 == 0 and j:
            d.line([(0, y0), (W, y0)], fill=(0, 0, 0, 160), width=2)
        d.text((6, y0 + 6), cid, fill=(255, 255, 255, 255), font=fonte)
        d.text((6, y0 + 20), lib, fill=(255, 236, 160, 255) if lib == 'APRÈS' else (220, 220, 220, 255), font=fonte)
        sol = y0 + marge + haut
        d.line([(tete, sol), (W, sol)], fill=(0, 0, 0, 70), width=1)
        for k, (p, i, im) in enumerate(ims):
            x = tete + k * cw + cw / 2
            pl.alpha_composite(im, (int(round(x - ax)), int(round(sol - ay))))
            d.text((tete + k * cw + 3, y0 + ch - 13), f'{p}{i}', fill=(255, 255, 255, 140), font=fonte)
    os.makedirs(os.path.dirname(os.path.abspath(sortie)), exist_ok=True)
    pl.convert('RGB').save(sortie)
    return rapport, manque


def main(argv):
    if len(argv) < 3 or argv[0] in ('-h', '--help'):
        print(__doc__); return 0 if argv and argv[0] in ('-h', '--help') else 2
    avant, apres, sortie = argv[:3]
    ids = None; fond = 'herbe'
    for opt in ('--id', '--fond'):
        if opt in argv and (argv.index(opt) + 1 >= len(argv) or argv[argv.index(opt) + 1].startswith('--')):
            print(f'{opt} attend une valeur'); return 2
    if '--id' in argv:
        ids = [x for x in argv[argv.index('--id') + 1].split(',') if x]
    if '--fond' in argv:
        fond = argv[argv.index('--fond') + 1]
        if fond not in FONDS:
            print(f'--fond inconnu : {fond} ({", ".join(FONDS)})'); return 2
    for s in (avant, apres):
        if not os.path.exists(s):
            print(f'introuvable : {s}'); return 2
    if not ids:
        src = apres if os.path.isdir(apres) else avant
        ids = sorted({os.path.basename(f)[:-len('_idle0.png')] for f in glob.glob(os.path.join(src, '*_idle0.png'))}) \
            if os.path.isdir(src) else sorted(lire_js(src))
    rapport, manque = planche(avant, apres, ids, sortie, fond)
    for cid, r in rapport.items():
        for cote in ('avant', 'apres'):
            s = r[cote]
            print(f'{cid:12s} {cote:5s} {s["taille"]:>9s}  pxu {s["pxu"]:5}  opaque {s["opaque"]:.3f}  luminance {s["luminance"]}  '
                  + ' '.join(f'{p}×{n}' for p, n in s['images'].items()))
    if rapport:
        print('planche :', sortie)
    if manque:
        print('⚠ créature absente :', ', '.join(manque))
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
