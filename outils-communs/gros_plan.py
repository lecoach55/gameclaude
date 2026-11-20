#!/usr/bin/env python3
"""Planche « gros plan » AVANT / APRÈS : chaque vue en plein cadre, puis un gros plan trouvé tout seul sur ce qui change le plus,
et un verdict chiffré « est-ce que ça se voit sans planche ? ». Python + numpy + Pillow (scipy si présent), tout jeu.

  python3 outils-communs/gros_plan.py AVANT APRES [sortie] [options]
  python3 outils-communs/gros_plan.py SORTIE_DE_CAPTURES [sortie]       (dossier de captures.py --avant : sortie/avant ↔ sortie)

AVANT / APRES : deux images, ou deux dossiers appariés par nom (.png/.jpg/.webp, comme compare.py ; planche*.png ignorées).
Sortie (défaut /tmp/gros-plan) : <vue>.jpg (plein cadre côte à côte + gros plan agrandi, zone cerclée de rouge sur le plein cadre),
  index.html (page autonome à glissière avant/après, plein cadre et gros plan : à ouvrir ou à publier telle quelle),
  gros_plan.json (chiffres et verdict de chaque vue).
Options :
  --zones N            nombre de gros plans par vue (1 par défaut, au plus 3 ; zones qui ne se recouvrent pas)
  --zone x,y,l,h       gros plan imposé (en pixels de l'image APRÈS ; répétable)
  --ignorer x,y,l,h    zone à ne pas chercher ni compter (barre d'interface, texte qui change ; répétable ; en fraction si ≤ 1 : 0,0.9,1,0.1)
  --largeur N          largeur d'un panneau sur la planche (défaut 960 : deux panneaux = 1920 px)
  --strict             code 1 si une vue reste « discret » ou « aucun changement » (passe graphique qui doit se voir)
  --json f             chemin du JSON (défaut <sortie>/gros_plan.json)

Verdict (calculé sur l'image ramenée à 640 px de large, comme une fenêtre du Mac vue d'un coup d'œil ; ΔE = écart de couleur Lab,
  ≈ 2 juste perceptible côte à côte, 10 net, 25 autre couleur ; décalages de ±1 px tolérés) :
  surface   % de l'image changée nettement (ΔE > 10)
  fort      % changé franchement (ΔE > 25)
  palette   écart des 6 couleurs dominantes (ΔE moyen) : ambiance, teinte générale
  lum / sat écart de luminance (L, 0-100) et de saturation (chroma) moyennes
  objet     plus grande tache d'un seul tenant changée (ΔE > 15, % de l'image) : nouvelle silhouette, nouvel objet, ciel remplacé
            (une créature de combat refaite ≈ 0,5 %)
  → « saute aux yeux » : surface ≥ 30 %, ou palette ≥ 10, ou |lum| ≥ 8, ou objet ≥ 2 %
  → « discret »        : surface < 12 %, palette < 5, |lum| < 4 et objet < 0,4 %
  → sinon « visible en regardant » ; « aucun changement » si surface < 0,2 % et fort < 0,05 %.
  Repères mesurés (planches de bannieres/mesures) : passe lumière v16 (jugée trop discrète : « il faut chercher la différence »)
  = carte et combat « visible en regardant » (surface 11-12 %, palette 4-5), villes « saute aux yeux » (ciel photographié, tache 2,5 %) ;
  passe réalisme du 17/11 = « saute aux yeux » 8 vues sur 9 ; une seule créature refaite dans un combat = « visible en regardant ».
  C'est un indicateur, pas un jugement artistique : la planche et la page à glissière servent à regarder.
"""
import base64
import glob
import html as HTML
import io
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

try:
    from scipy import ndimage as ND
except Exception:  # scipy absent : taches approchées par groupes de blocs 4×4 (≈ −0,2 point sur « objet »)
    ND = None

EXT = ('.png', '.jpg', '.jpeg', '.webp')
TRAVAIL = 640
SEUIL_NET, SEUIL_OBJET, SEUIL_FORT = 10.0, 15.0, 25.0


# ---------------------------------------------------------------- entrées
def images(d):
    r = {}
    for x in sorted(os.listdir(d), key=lambda x: (os.path.splitext(x)[0], os.path.splitext(x)[1].lower() != '.png')):
        b, e = os.path.splitext(x)
        if e.lower() not in EXT or b == 'planche' or b.startswith('planche_') or b.endswith('_gros_plan'):
            continue
        if b not in r:
            r[b] = os.path.join(d, x)
    return r


def paires(av, ap):
    if os.path.isfile(av) and os.path.isfile(ap):
        return [(os.path.splitext(os.path.basename(ap))[0], av, ap)], []
    if not (os.path.isdir(av) and os.path.isdir(ap)):
        sys.exit(f'gros_plan.py : AVANT et APRÈS doivent être deux images ou deux dossiers ({av}, {ap})')
    A, B = images(av), images(ap)
    return [(n, A[n], B[n]) for n in A if n in B], sorted(set(A) ^ set(B))


def rect(s, W, H):
    v = [float(x) for x in s.replace(';', ',').split(',')]
    if len(v) != 4:
        sys.exit(f'gros_plan.py : rectangle attendu x,y,l,h : {s}')
    if all(0 <= x <= 1 for x in v):
        v = [v[0] * W, v[1] * H, v[2] * W, v[3] * H]
    return [int(round(x)) for x in v]


# ---------------------------------------------------------------- couleur
def lab(rgb):
    c = rgb.astype(np.float32) / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]], np.float32)
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883], np.float32)
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    L = 116 * f[..., 1] - 16
    return np.stack([L, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def palette(L, k=6, n=5000, depart=None):
    px = L.reshape(-1, 3)
    rng = np.random.default_rng(1)
    px = px[rng.choice(len(px), min(n, len(px)), replace=False)]
    # départ déterministe : quantiles de luminance, ou la palette de l'autre image (deux images presque pareilles donnent alors
    # presque la même palette : sans ça, k-moyennes partait ailleurs et lisait ΔE 2,7 entre deux captures sans changement)
    if depart is not None:
        c = depart.copy()
    else:
        o = np.argsort(px[:, 0]); c = px[o[np.linspace(0, len(px) - 1, k).astype(int)]].copy()
    for _ in range(12):
        lab_ = np.argmin(((px[:, None, :] - c[None]) ** 2).sum(-1), 1)
        for j in range(k):
            m = lab_ == j
            if m.any():
                c[j] = px[m].mean(0)
    w = np.bincount(lab_, minlength=k) / len(px)
    return c, w


def ecart_palette(pa, pb):
    (ca, wa), (cb, wb) = pa, pb
    d = np.sqrt(((ca[:, None, :] - cb[None]) ** 2).sum(-1))
    return float(0.5 * ((wa * d.min(1)).sum() + (wb * d.min(0)).sum()))


# ---------------------------------------------------------------- mesure
def mesurer(ia, ib, ignorer):
    W, H = ib.size
    w = min(TRAVAIL, W); h = max(1, round(H * w / W)); s = W / w
    A = np.asarray(ia.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1)), np.float32)
    B = np.asarray(ib.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1)), np.float32)
    LA, LB = lab(A), lab(B)
    D = np.full((h, w), 1e9, np.float32)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            D = np.minimum(D, np.sqrt(((np.roll(np.roll(LA, dy, 0), dx, 1) - LB) ** 2).sum(-1)))
    masque = np.ones((h, w), bool)
    for x, y, l, hh in ignorer:
        masque[max(0, int(y / s)):int((y + hh) / s) + 1, max(0, int(x / s)):int((x + l) / s) + 1] = False
    D = np.where(masque, D, 0)
    n = max(1, masque.sum())
    net, fort = D > SEUIL_NET, D > SEUIL_FORT
    objet = 0.0
    obj = D > SEUIL_OBJET
    if obj.any():
        if ND is not None:
            # taches franches rapprochées (sprite moucheté par la tolérance de ±1 px) réunies, poussières < 12 px ignorées
            lb, k = ND.label(ND.binary_closing(obj, iterations=3))
            if k:
                t = np.bincount(lb.ravel())[1:]; t = t[t >= 12]
                objet = float(t.max()) if len(t) else 0.0
        else:
            objet = float(plus_grand_groupe(obj, 4))
    if not masque.any():
        m = {'surface_pct': 0.0, 'fort_pct': 0.0, 'palette': 0.0, 'lum': 0.0, 'sat': 0.0, 'objet_pct': 0.0, 'de_moyen': 0.0}
        m['verdict'] = verdict(m)
        return m, D, s
    ma = masque[..., None]
    pb = palette(np.where(ma, LB, LB[masque].mean(0)) if not masque.all() else LB)
    pa = palette(np.where(ma, LA, LA[masque].mean(0)) if not masque.all() else LA, depart=pb[0])
    ca, cb = np.hypot(LA[..., 1], LA[..., 2]), np.hypot(LB[..., 1], LB[..., 2])
    m = {
        'surface_pct': round(100 * float(net.sum()) / n, 2),
        'fort_pct': round(100 * float(fort.sum()) / n, 2),
        'palette': round(ecart_palette(pa, pb), 2),
        'lum': round(float(LB[masque, 0].mean() - LA[masque, 0].mean()), 2),
        'sat': round(float(cb[masque].mean() - ca[masque].mean()), 2),
        'objet_pct': round(100 * objet / n, 2),
        'de_moyen': round(float(D[masque].mean()), 2),
    }
    m['verdict'] = verdict(m)
    return m, D, s


def plus_grand_groupe(M, b):
    """Sans scipy : blocs b×b à moitié pleins, groupes de blocs voisins (8-connexité), aire du plus grand en pixels."""
    h, w = M.shape; hb, wb = h // b, w // b
    if not hb or not wb:
        return 0
    G = M[:hb * b, :wb * b].reshape(hb, b, wb, b).mean((1, 3)) > 0.5
    vu = np.zeros_like(G); best = 0
    for y0, x0 in zip(*np.nonzero(G)):
        if vu[y0, x0]:
            continue
        pile = [(y0, x0)]; vu[y0, x0] = True; n = 0
        while pile:
            y, x = pile.pop(); n += 1
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < hb and 0 <= xx < wb and G[yy, xx] and not vu[yy, xx]:
                        vu[yy, xx] = True; pile.append((yy, xx))
        best = max(best, n)
    return best * b * b


def verdict(m):
    if m['surface_pct'] < 0.2 and m['fort_pct'] < 0.05:
        return 'aucun changement'
    if m['surface_pct'] >= 30 or m['palette'] >= 10 or abs(m['lum']) >= 8 or m['objet_pct'] >= 2:
        return 'saute aux yeux'
    if m['surface_pct'] < 12 and m['palette'] < 5 and abs(m['lum']) < 4 and m['objet_pct'] < 0.4:
        return 'discret'
    return 'visible en regardant'


def raisons(m):
    r = []
    if m['surface_pct'] >= 30: r.append(f"{m['surface_pct']:.0f} % de l'image change")
    if m['palette'] >= 10: r.append(f"palette ΔE {m['palette']:.0f}")
    if abs(m['lum']) >= 8: r.append(f"luminance {m['lum']:+.0f}")
    if m['objet_pct'] >= 2: r.append(f"objet {m['objet_pct']:.1f} %")
    return r


# ---------------------------------------------------------------- zones
def borner(z, W, H):
    x, y, l, h = z
    x = min(max(0, x), W - 1); y = min(max(0, y), H - 1)
    l = min(max(8, l), W - x); h = min(max(8, h), H - y)
    if l < 1 or h < 1:
        sys.exit(f'gros_plan.py : zone vide après bornage à l\'image {W}×{H} : {z}')
    return (x, y, l, h)


def zones(D, s, W, H, n, imposees):
    if imposees:
        return [borner(z, W, H) for z in imposees]
    h, w = D.shape
    S = np.clip(D - 6, 0, None)
    total = S.sum()
    if total < 1e-3:
        return []
    I = np.zeros((h + 1, w + 1), np.float64); I[1:, 1:] = S.cumsum(0).cumsum(1)
    ar = h / w
    pris = []
    for _ in range(n):
        best = None
        for f in (0.18, 0.25, 0.33, 0.45, 0.6):
            zw = max(8, int(w * f)); zh = max(8, int(min(h, zw * ar)))
            if zh > h or zw > w:
                continue
            pas = max(1, zw // 12)
            ys = np.arange(0, h - zh + 1, pas); xs = np.arange(0, w - zw + 1, pas)
            Y, X = np.meshgrid(ys, xs, indexing='ij')
            som = I[Y + zh, X + zw] - I[Y, X + zw] - I[Y + zh, X] + I[Y, X]
            j = np.unravel_index(np.argmax(som), som.shape)
            sc = som[j] / (zw * zh) ** 0.6
            if som[j] > 0 and (best is None or sc > best[0]):
                best = (sc, int(X[j]), int(Y[j]), zw, zh)
        if best is None or (pris and S.sum() < 0.15 * total):
            break
        pris.append(best[1:])
        _, x, y, zw, zh = best
        S[y:y + zh, x:x + zw] = 0  # ce qui est déjà montré ne compte plus pour le gros plan suivant
        I[1:, 1:] = S.cumsum(0).cumsum(1)
    return [(round(x * s), round(y * s), min(W, round(l * s)), min(H, round(hh * s))) for x, y, l, hh in pris]


# ---------------------------------------------------------------- dessin
def police(t):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(p, t)
        except Exception:
            pass
    return ImageFont.load_default()


COUL = {'saute aux yeux': (120, 220, 120), 'visible en regardant': (240, 200, 110), 'discret': (255, 120, 100), 'aucun changement': (170, 170, 170)}


def planche(nom, ia, ib, m, zs, larg):
    W, H = ib.size
    k = larg / W; ph = round(H * k)
    fa, fb = ia.resize((larg, ph), Image.LANCZOS), ib.resize((larg, ph), Image.LANCZOS)
    for im in (fa, fb):
        d = ImageDraw.Draw(im)
        for i, (x, y, l, h) in enumerate(zs):
            for e in range(3):
                d.rectangle((x * k - e, y * k - e, (x + l) * k + e, (y + h) * k + e), outline=(230, 40, 40))
            d.text((x * k + 6, y * k + 4), str(i + 1), fill=(255, 255, 255), font=police(22), stroke_width=2, stroke_fill=(150, 0, 0))
    gros = []
    for (x, y, l, h) in zs:
        zh = round(larg * h / l)
        gros.append((ia.crop((x, y, x + l, y + h)).resize((larg, zh), Image.LANCZOS), ib.crop((x, y, x + l, y + h)).resize((larg, zh), Image.LANCZOS), l))
    bande = 64; et = 34; gap = 8
    Ht = bande + et + ph + sum(et + g[0].height for g in gros) + gap
    C = Image.new('RGB', (2 * larg + gap, Ht), (16, 14, 12)); d = ImageDraw.Draw(C)
    v = m['verdict']
    d.text((10, 8), f"{nom} — {v.upper()}", fill=COUL[v], font=police(26))
    d.text((10, 40), f"surface changée {m['surface_pct']:.1f} %  ·  forte {m['fort_pct']:.1f} %  ·  palette ΔE {m['palette']:.1f}  ·  "
                     f"luminance {m['lum']:+.1f}  ·  saturation {m['sat']:+.1f}  ·  plus grand objet changé {m['objet_pct']:.1f} %",
           fill=(220, 210, 190), font=police(16))
    y = bande
    for lbl, x in (('AVANT', 0), ('APRÈS', larg + gap)):
        d.text((x + 10, y + 4), lbl + ' — plein cadre', fill=(240, 200, 120), font=police(22))
    y += et; C.paste(fa, (0, y)); C.paste(fb, (larg + gap, y)); y += ph
    for i, (ga, gb, l) in enumerate(gros):
        for lbl, x in (('AVANT', 0), ('APRÈS', larg + gap)):
            d.text((x + 10, y + 4), f"{lbl} — gros plan {i + 1} (×{larg / l:.1f})", fill=(240, 200, 120), font=police(22))
        y += et; C.paste(ga, (0, y)); C.paste(gb, (larg + gap, y)); y += ga.height
    return C, fa, fb, [(g[0], g[1]) for g in gros]


def b64(im, q=85):
    o = io.BytesIO(); im.convert('RGB').save(o, 'JPEG', quality=q, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(o.getvalue()).decode()


def page_html(vues):
    css = """:root{--fond:#14110e;--texte:#eadfca;--doux:#b8a888;--or:#e8b860;--ok:#7c7;--moy:#eb6;--ko:#f87}
@media (prefers-color-scheme: light){:root:not([data-theme="dark"]){--fond:#f4efe6;--texte:#2a2218;--doux:#6a5a40;--or:#9a6a10;--ok:#2a7a2a;--moy:#9a6a00;--ko:#b03020}}
body{margin:0;background:var(--fond);color:var(--texte);font:15px/1.45 system-ui,sans-serif}
main{max-width:1400px;margin:auto;padding:16px}h1{font-size:22px;color:var(--or)}h2{font-size:18px;margin:28px 0 4px}
.c{font-size:13px;color:var(--doux)}.g{position:relative;margin:10px 0;user-select:none;touch-action:pan-y}
:root[data-theme="light"]{--fond:#f4efe6;--texte:#2a2218;--doux:#6a5a40;--or:#9a6a10;--ok:#2a7a2a;--moy:#9a6a00;--ko:#b03020}
.g img{display:block;width:100%;height:auto}.g .ap{position:absolute;inset:0;clip-path:inset(0 0 0 50%)}
.g .barre{position:absolute;top:0;bottom:0;left:50%;width:2px;background:#fff;box-shadow:0 0 4px #000;pointer-events:none}
.g .t{position:absolute;top:6px;padding:2px 8px;background:#000a;color:#fff;font-size:13px;border-radius:4px}
input[type=range]{width:100%}.v-saute{color:var(--ok)}.v-visible{color:var(--moy)}.v-discret,.v-aucun{color:var(--ko)}"""
    js = """document.querySelectorAll('.g').forEach(g=>{const ap=g.querySelector('.ap'),b=g.querySelector('.barre');
function m(x){const r=g.getBoundingClientRect();let p=Math.min(100,Math.max(0,(x-r.left)/r.width*100));ap.style.clipPath='inset(0 0 0 '+p+'%)';b.style.left=p+'%'}
g.addEventListener('pointermove',e=>m(e.clientX));g.addEventListener('pointerdown',e=>m(e.clientX))});"""
    corps = []
    for v in vues:
        m = v['mesure']; cl = 'v-' + m['verdict'].split()[0]
        corps.append(f"<h2>{HTML.escape(v['nom'])} — <span class='{cl}'>{m['verdict']}</span></h2><div class='c'>surface changée {m['surface_pct']:.1f} % · "
                     f"forte {m['fort_pct']:.1f} % · palette ΔE {m['palette']:.1f} · luminance {m['lum']:+.1f} · saturation {m['sat']:+.1f} · "
                     f"objet {m['objet_pct']:.1f} %</div>")
        for titre, a, b in v['images']:
            corps.append(f"<div class='g'><img src='{a}' alt='avant'><img class='ap' src='{b}' alt='après'><div class='barre'></div>"
                         f"<span class='t' style='left:6px'>AVANT</span><span class='t' style='right:6px'>APRÈS</span></div><div class='c'>{titre}</div>")
    return (f"<!doctype html><html lang='fr'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
            f"<title>Avant / après</title><style>{css}</style></head><body><main><h1>Avant / après — gros plan</h1>"
            f"<p class='c'>Passer la souris (ou le doigt) sur une image : à gauche du trait l'AVANT, à droite l'APRÈS.</p>"
            + ''.join(corps) + f"</main><script>{js}</script></body></html>")


# ---------------------------------------------------------------- principal
def lire_args(argv):
    o = {'pos': [], 'zones': 1, 'zone': [], 'ignorer': [], 'largeur': 960, 'strict': False, 'json': None}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a in ('-h', '--help'):
            print(__doc__); sys.exit(0)
        if a == '--strict':
            o['strict'] = True
        elif a.startswith('--'):
            k = a[2:]
            if k not in o or i + 1 >= len(argv):
                sys.exit(f'gros_plan.py : option inconnue ou sans valeur : {a}')
            val = argv[i + 1]; i += 1
            if k in ('zone', 'ignorer'):
                o[k].append(val)
            elif k in ('zones', 'largeur'):
                try:
                    o[k] = int(val)
                except ValueError:
                    sys.exit(f'gros_plan.py : --{k} attend un nombre entier : {val}')
            else:
                o[k] = val
        else:
            o['pos'].append(a)
        i += 1
    return o


def principal(argv, etiquettes=None):
    """etiquettes = (avant, après) écrits dans le JSON à la place des chemins (captures.py : vrais dossiers, pas les liens temporaires)."""
    o = lire_args(argv)
    p = o['pos']
    mode_captures = len(p) == 1 or (len(p) == 2 and (not os.path.isdir(p[1]) or not images(p[1])))
    if mode_captures and os.path.isdir(os.path.join(p[0], 'avant')):
        av, ap, sortie = os.path.join(p[0], 'avant'), p[0], (p[1] if len(p) > 1 else os.path.join(p[0], 'gros_plan'))
    elif len(p) in (2, 3):
        av, ap, sortie = p[0], p[1], (p[2] if len(p) > 2 else '/tmp/gros-plan')
    else:
        print(__doc__); return 2
    ps, seules = paires(av, ap)
    if not ps:
        print('gros_plan.py : aucune image appariée entre', av, 'et', ap); return 2
    os.makedirs(sortie, exist_ok=True)
    for f in glob.glob(os.path.join(sortie, '*_gros_plan.jpg')):  # planches d'une série précédente (vue disparue depuis)
        os.remove(f)
    nz = max(1, min(3, o['zones'])); res = []; vues_html = []
    for nom, fa, fb in ps:
        ia, ib = Image.open(fa).convert('RGB'), Image.open(fb).convert('RGB')
        if ia.size != ib.size:
            ia = ia.resize(ib.size, Image.LANCZOS)
        W, H = ib.size
        ign = [rect(r, W, H) for r in o['ignorer']]
        m, D, s = mesurer(ia, ib, ign)
        zs = zones(D, s, W, H, nz, [rect(r, W, H) for r in o['zone']]) if m['verdict'] != 'aucun changement' or o['zone'] else []
        C, pa_, pb_, gros = planche(nom, ia, ib, m, zs, min(o['largeur'], max(W, 480)))
        f = os.path.join(sortie, nom + '_gros_plan.jpg'); C.save(f, 'JPEG', quality=88, optimize=True)
        res.append({'nom': nom, 'avant': os.path.join(etiquettes[0], os.path.basename(fa)) if etiquettes else fa,
                    'apres': os.path.join(etiquettes[1], os.path.basename(fb)) if etiquettes else fb, 'planche': f, 'zones': [list(z) for z in zs], **m})
        imgs = [('plein cadre', b64(ia if W <= 1400 else ia.resize((1400, round(H * 1400 / W)))), b64(ib if W <= 1400 else ib.resize((1400, round(H * 1400 / W)))))]
        imgs += [(f'gros plan {i + 1}', b64(a), b64(b)) for i, (a, b) in enumerate(gros)]
        vues_html.append({'nom': nom, 'mesure': m, 'images': imgs})
        print(f"{nom:24s} {m['verdict']:22s} surface {m['surface_pct']:5.1f} %  fort {m['fort_pct']:5.1f} %  palette {m['palette']:5.1f}  "
              f"lum {m['lum']:+5.1f}  sat {m['sat']:+5.1f}  objet {m['objet_pct']:4.1f} %" + (f"   ({', '.join(raisons(m))})" if raisons(m) else ''))
    open(os.path.join(sortie, 'index.html'), 'w', encoding='utf-8').write(page_html(vues_html))
    jf = o['json'] or os.path.join(sortie, 'gros_plan.json')
    comptes = {v: sum(r['verdict'] == v for r in res) for v in COUL}
    taille = os.path.getsize(os.path.join(sortie, 'index.html')) / 2 ** 20
    if taille > 12:
        print(f'⚠ index.html pèse {taille:.1f} Mo : trop lourd pour un artefact (16 Mio) ; ne garder que les vues utiles')
    json.dump({'avant': etiquettes[0] if etiquettes else av, 'apres': etiquettes[1] if etiquettes else ap, 'vues': res, 'seules_dun_cote': seules, 'verdicts': comptes}, open(jf, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    if seules:
        print("Images d'un seul côté (ignorées) :", ', '.join(seules))
    print('Verdicts :', ' · '.join(f'{k} {n}' for k, n in comptes.items() if n))
    print('Planches :', sortie, '(une image par vue + index.html à glissière)')
    if o['strict'] and (comptes['discret'] or comptes['aucun changement']):
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(principal(sys.argv[1:]))
