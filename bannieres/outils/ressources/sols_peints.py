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
    ph = 2 * np.pi * (9 * x + 4 * y) + (moyen - .5) * 9 + (gros - .5) * 5
    rides = (np.sin(ph) * .5 + .5) ** 1.6
    h = rides * .6 + gros * .3 + fin * .1
    base = np.array([216, 176, 116.]); clair = np.array([240, 212, 156.]); ombre = np.array([176, 128, 76.])
    t = (rides * .55 + gros * .45)[..., None]
    rgb = ombre * (1 - t) + clair * t; rgb = rgb * .5 + base * .5 + (fin[..., None] - .5) * 14
    cailloux = (bruit(160, 4) > .86)[..., None]; rgb = np.where(cailloux, rgb * .78, rgb)
    sauver('sable', rgb, h, 7)
if 'neige' in QUOI:
    gros, moyen, fin = bruit(3, 11), bruit(9, 12), bruit(70, 13)
    # congères : crêtes vives soufflées par le vent (bandes périodiques déformées), creux bleutés, neige surtout blanche
    ph = 2 * np.pi * (3 * x + 5 * y) + (moyen - .5) * 7 + (gros - .5) * 6
    cr = np.sin(ph) * .5 + .5; crete = np.clip((cr - .55) * 3, 0, 1); creux = np.clip((.35 - cr) * 2.5, 0, 1) * (.4 + .6 * gros)
    h = cr * .6 + gros * .3 + fin * .1
    clair = np.array([248, 250, 255.]); mi = np.array([226, 233, 245.]); ombre = np.array([190, 205, 232.])
    rgb = mi + (clair - mi) * (crete[..., None] * .8 + gros[..., None] * .4) - (mi - ombre) * creux[..., None] + (fin[..., None] - .5) * 7
    paillettes = (bruit(200, 14) > .93)[..., None]; rgb = np.where(paillettes, np.minimum(rgb + 12, 255), rgb)
    sauver('neige', rgb, h, 6)
print('ok', QUOI)
