"""Sols « peints » raccordables (sable à rides, neige à congères) pour remplacer les photos de tex3d (23-24/11).
Bruit périodique (FFT) → couleur + carte de relief _n. Usage : python3 sols_peints.py jeu/tex3d [sable,neige]"""
import sys, os, numpy as np
from PIL import Image
D = sys.argv[1]; QUOI = (sys.argv[2] if len(sys.argv) > 2 else 'sable,neige').split(',')
S = 512; rng = np.random.default_rng(7)
def bruit(echelle, graine):  # bruit périodique lissé : spectre filtré autour de la fréquence voulue
    r = np.random.default_rng(graine); w = r.standard_normal((S, S))
    f = np.fft.fftfreq(S)[:, None] ** 2 + np.fft.fftfreq(S)[None, :] ** 2
    g = np.exp(-f * (S / echelle) ** 2 * 8); n = np.real(np.fft.ifft2(np.fft.fft2(w) * g))
    return (n - n.min()) / (n.max() - n.min())
def normale(h, force):
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * force; gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * force
    n = np.dstack([-gx, -gy, np.ones_like(h)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
    return Image.fromarray(((n * .5 + .5) * 255).astype(np.uint8))
def sauver(nom, rgb, h, force):
    Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).save(os.path.join(D, f'sol_{nom}.jpg'), quality=90)
    normale(h, force).save(os.path.join(D, f'sol_{nom}_n.jpg'), quality=88)
y, x = np.mgrid[0:S, 0:S] / S
if 'sable' in QUOI:
    gros, moyen, fin = bruit(3, 1), bruit(10, 2), bruit(90, 3)
    # rides de sable : bandes diagonales périodiques (nombre entier de périodes) déformées par le bruit
    ph = 2 * np.pi * (23 * x + 10 * y) + (moyen - .5) * 14 + (gros - .5) * 8
    rides = (np.sin(ph) * .5 + .5) ** 1.6
    h = rides * .35 + gros * .5 + fin * .15
    base = np.array([216, 176, 116.]); clair = np.array([240, 212, 156.]); ombre = np.array([176, 128, 76.])
    t = (rides * .3 + gros * .7)[..., None]
    rgb = ombre * (1 - t) + clair * t; rgb = rgb * .5 + base * .5 + (fin[..., None] - .5) * 14
    cailloux = (bruit(160, 4) > .86)[..., None]; rgb = np.where(cailloux, rgb * .78, rgb)
    sauver('sable', rgb, h, 4)
if 'neige' in QUOI:
    gros, moyen, fin = bruit(3, 11), bruit(9, 12), bruit(70, 13)
    # congères : crêtes vives soufflées par le vent (bandes périodiques déformées), creux bleutés, neige surtout blanche
    ph = 2 * np.pi * (7 * x + 12 * y) + (moyen - .5) * 12 + (gros - .5) * 8
    cr = np.sin(ph) * .5 + .5; crete = np.clip((cr - .55) * 3, 0, 1); creux = np.clip((.35 - cr) * 2.5, 0, 1) * (.4 + .6 * gros)
    h = cr * .6 + gros * .3 + fin * .1
    clair = np.array([248, 250, 255.]); mi = np.array([226, 233, 245.]); ombre = np.array([190, 205, 232.])
    rgb = mi + (clair - mi) * (crete[..., None] * .25 + gros[..., None] * .7) - (mi - ombre) * (creux[..., None] * .25 + (1 - gros[..., None]) * .25) + (fin[..., None] - .5) * 7
    paillettes = (bruit(200, 14) > .93)[..., None]; rgb = np.where(paillettes, np.minimum(rgb + 12, 255), rgb)
    sauver('neige', rgb, h, 3)
if 'route' in QUOI:  # pavés irréguliers (Voronoï périodique) : pierres beiges arrondies, joints de terre
    from scipy.spatial import cKDTree
    n = 150; pts = rng.random((n, 2)) * S
    T = np.concatenate([pts + np.array([dx, dy]) * S for dx in (-1, 0, 1) for dy in (-1, 0, 1)])
    yy, xx = np.mgrid[0:S, 0:S]; q = np.dstack([xx, yy]).reshape(-1, 2) + (np.dstack([bruit(12, 21), bruit(12, 22)]).reshape(-1, 2) - .5) * 14
    d, i = cKDTree(T).query(q, k=2); bord = (d[:, 1] - d[:, 0]).reshape(S, S); cell = (i[:, 0] % n).reshape(S, S)
    pierre = np.clip(bord / 7, 0, 1) ** .6; teinte = np.random.default_rng(5).random(n)[cell]
    fin = bruit(80, 23); h = pierre * .8 + fin * .2
    c1 = np.array([196, 172, 132.]); c2 = np.array([168, 144, 108.]); joint = np.array([92, 72, 50.])
    base = c1 * (1 - teinte[..., None]) + c2 * teinte[..., None]
    rgb = joint * (1 - pierre[..., None]) + base * pierre[..., None] + (fin[..., None] - .5) * 18
    rgb = rgb * (.9 + .12 * pierre[..., None] * (1 - np.clip(np.gradient(h, axis=0) * 40, -1, 1)[..., None] * .5))
    sauver('route', rgb, h, 5)
if 'marais' in QUOI:  # herbe de marais (photo d'origine, gardée dans /tmp ou ressources) + petites flaques sombres à reflet
    src = os.environ.get('MARAIS_BASE', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sol_marais_base.jpg'))
    base = np.asarray(Image.open(src).convert('RGB').resize((S, S)), float) * np.array([.92, .95, .85])
    a, b2, fin = bruit(7, 31), bruit(16, 32), bruit(80, 33)
    flaque = np.clip((a * .55 + b2 * .45 - .6) * 9, 0, 1)
    bord = np.clip((a * .55 + b2 * .45 - .54) * 9, 0, 1) - flaque
    eau = np.array([30, 46, 44.]); vase = np.array([70, 62, 36.])
    reflet = np.clip((fin - .62) * 3, 0, 1)[..., None] * flaque[..., None]
    rgb = base * (1 - bord[..., None]) + vase * bord[..., None]
    rgb = rgb * (1 - flaque[..., None]) + (eau + reflet * 45) * flaque[..., None]
    h = (1 - flaque) * .7 + fin * .3
    sauver('marais', rgb, h, 3)
if 'lave' in QUOI:  # croûte de basalte en plaques irrégulières de tailles variées ; fissures noires d'épaisseur variable (le shader les fait rougeoyer)
    from scipy.spatial import cKDTree
    r2 = np.random.default_rng(41); n = 70; pts = r2.random((n, 2)) * S
    T = np.concatenate([pts + np.array([dx, dy]) * S for dx in (-1, 0, 1) for dy in (-1, 0, 1)])
    yy, xx = np.mgrid[0:S, 0:S]; q = np.dstack([xx, yy]).reshape(-1, 2) + (np.dstack([bruit(6, 42), bruit(6, 43)]).reshape(-1, 2) - .5) * 60 + (np.dstack([bruit(20, 44), bruit(20, 45)]).reshape(-1, 2) - .5) * 12
    d, i = cKDTree(T).query(q, k=2); bord = (d[:, 1] - d[:, 0]).reshape(S, S)
    larg = 1.5 + bruit(5, 46) * 6 * (bruit(14, 47) > .45)
    fis = np.clip(1 - bord / larg, 0, 1) ** 1.5
    fin = bruit(70, 48); gros = bruit(3, 49)
    crout = np.array([92, 84, 80.]) * (.75 + .5 * gros[..., None]) + (fin[..., None] - .5) * 30
    rgb = crout * (1 - fis[..., None]) + np.array([6, 4, 4.]) * fis[..., None]
    h = (1 - fis) * .8 + fin * .2
    sauver('lave', rgb, h, 4)
print('ok', QUOI)
