# Textures de biome v2 (Poly Haven CC0, téléchargées par phget.py) : couleur (avec occlusion), relief, rugosité réelle.
# Le canal bleu de la carte de relief (_n) porte la RUGOSITÉ (z du relief est recalculé dans le shader).
# usage : python3 ph_tex2.py [dossier_sources]  -> tex/*_d.jpg, tex/*_n.jpg
import numpy as np, sys
from PIL import Image
from scipy import ndimage
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/assets/ph2'
N = 1024
def pnoise(n, freq, seed, octaves=5, pers=.5):
    r = np.random.default_rng(seed); out = np.zeros((n, n)); amp = 1; tot = 0
    for o in range(octaves):
        f = freq * 2 ** o; g = r.random((f, f)); g = np.pad(g, ((0, 1), (0, 1)), mode='wrap')
        z = ndimage.zoom(g, (n + n / f) / (f + 1), order=3, mode='grid-wrap')[:n, :n]
        out += z * amp; tot += amp; amp *= pers
    out /= tot; return (out - out.min()) / (out.max() - out.min() + 1e-9)
def img(p, mode='RGB'):
    return np.asarray(Image.open(p).convert(mode).resize((N, N), Image.LANCZOS), dtype=np.float32) / 255
def load(name, ao_k=.8):
    d = img(f'{SRC}/{name}_Diffuse.jpg'); h = img(f'{SRC}/{name}_Displacement.jpg', 'L')
    r = img(f'{SRC}/{name}_Rough.jpg', 'L'); ao = img(f'{SRC}/{name}_AO.jpg', 'L')
    if h.std() < .01: h = ndimage.gaussian_filter(ao, 1.5) * .7 + (d * [.3, .59, .11]).sum(-1) * .3  # relief absent : occlusion + luminance
    h = (h - h.min()) / (h.max() - h.min() + 1e-9)
    d = d * (ao[..., None] ** ao_k)          # occlusion des joints dans la couleur
    return d, h, r
def normal(h, s):
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * s; gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * s
    l = np.sqrt(gx * gx + gy * gy + 1); return np.stack([-gx / l * .5 + .5, -gy / l * .5 + .5], -1)
def grade(c, tint=(1, 1, 1), sat=1., gain=1., gamma=1.):
    L = (c * [.3, .59, .11]).sum(-1, keepdims=True); c = L + (c - L) * sat
    return np.clip((c * tint * gain) ** gamma, 0, 1)
def soft(m, lo, hi): return np.clip((m - lo) / (hi - lo), 0, 1)
def streaks(seed, amt=1.):
    # coulures d'humidité : champ aléatoire très étiré verticalement (taches longues et irrégulières)
    r = np.random.default_rng(seed); g = r.random((6, 96)); g = np.pad(g, ((0, 1), (0, 1)), mode='wrap')
    f = ndimage.zoom(g, ((N + N / 6) / 7, (N + N / 96) / 97), order=3, mode='grid-wrap')[:N, :N]
    m = soft(f, .62, .9) * (soft(pnoise(N, 6, seed + 1, 3), .25, .75) * .5 + .5)
    m = ndimage.gaussian_filter(m, (10, 2.5), mode='wrap')
    return np.clip(m * amt, 0, 1)
def save(name, d, h, r, s):
    Image.fromarray((np.clip(d, 0, 1) * 255).astype(np.uint8)).save(f'tex/{name}_d.jpg', quality=76, optimize=True)
    n = np.concatenate([normal(h, s), np.clip(r, 0, 1)[..., None]], -1)
    Image.fromarray((n * 255).astype(np.uint8)).resize((768, 768), Image.LANCZOS).save(f'tex/{name}_n.jpg', quality=78, optimize=True)
B = {}
# crypte : grands blocs de pierre, murs en moellons ; salpêtre et humidité
d, h, r = load('medieval_blocks_03'); damp = soft(pnoise(N, 3, 101, 4), .55, .8)[..., None]
c = grade(d, (.95, .95, 1.0), .6, .82, 1.08); c = c * (1 - damp * .3)
save('crypt_f', c, h, r * (1 - damp[..., 0] * .35), 9)
d, h, r = load('castle_wall_slates'); moss = (soft(pnoise(N, 4, 111, 4), .62, .82) * soft(1 - h, .3, .7))[..., None]
c = grade(d, (.95, .95, .98), .55, .85); c = c * (1 - moss) + c * np.array([.55, .68, .45]) * moss
lk = streaks(121, 1.)[..., None]; c = c * (1 - lk * .38)
save('crypt_w', c, h, r * (1 - lk[..., 0] * .55), 8)
# cavernes : roche incrustée dans la terre, parois rocheuses en strates ; humidité brillante
d, h, r = load('embedded_rock_floor'); wet = soft(pnoise(N, 4, 201, 5), .6, .82)[..., None]
c = grade(d, (1.0, .98, .9), .75, .95); c = c * (1 - wet * .25)
save('cav_f', c, h, r * (1 - wet[..., 0] * .5), 9)
d, h, r = load('rock_wall_10'); wet = soft(pnoise(N, 5, 211, 4), .6, .85)[..., None]
c = grade(d, (1.02, .97, .88), .75, .85); c = c * (1 - wet * .35)
lk = streaks(221, 1.)[..., None]; c = c * (1 - lk * .3) + np.array([.05, .09, .07]) * lk * .25
save('cav_w', c, h, r * (1 - np.maximum(wet[..., 0] * .45, lk[..., 0] * .6)), 10)
# forge : basalte en mosaïque, braises dans les joints profonds, suie
d, h, r = load('volcanic_rock_tiles'); deep = soft(1 - h, .8, .96) * soft(pnoise(N, 6, 301, 4), .5, .75)
soot = soft(pnoise(N, 3, 302, 4), .4, .75)[..., None]
c = grade(d, (1.08, .9, .82), .6, .95, 1.05); c = c * (1 - soot * .35)
c = c + np.array([1.0, .38, .08])[None, None, :] * deep[..., None] * .7
save('forge_f', c, h, r, 9)
d, h, r = load('rock_wall_16'); c = grade(d, (1.06, .88, .8), .6, .85, 1.05)
c = c * (1 - soft(pnoise(N, 4, 311, 4), .45, .8)[..., None] * .45)
save('forge_w', c, h, r, 8)
# givre : dalles de granit bleutées, givre dans les creux (plus lisse et brillant)
d, h, r = load('rock_tile_floor')
frost = np.clip(soft(1 - h, .5, .85) * .8 + soft(pnoise(N, 8, 401, 4), .6, .85) * .5, 0, 1)[..., None]
sparkle = (np.random.default_rng(402).random((N, N)) > .995)[..., None] * frost
c = grade(d, (.88, .95, 1.08), .45, .82); c = c * (1 - frost * .6) + np.array([.78, .86, .95]) * frost * .6 + sparkle * .3
save('frost_f', c, h * (1 - frost[..., 0] * .3), r * (1 - frost[..., 0] * .55), 9)
d, h, r = load('rock_wall_13'); gy = np.roll(h, 1, 0) - np.roll(h, -1, 0)
ledge = soft(ndimage.gaussian_filter(gy, 2), .002, .012)[..., None]
c = grade(d, (.86, .94, 1.1), .45, .95); c = c * (1 - ledge * .4) + np.array([.82, .9, .98]) * ledge * .45
save('frost_w', c, h, r * (1 - ledge[..., 0] * .5), 10)
print('ok')
