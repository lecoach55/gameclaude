# Génère des textures de pierre réalistes et raccordables (diffuse + normal) pour Valdragon.
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
N = 512
rng = np.random.default_rng(7)

def pnoise(n, freq, seed, octaves=5, pers=.5):
    """bruit fractal périodique (somme de bruits de valeur interpolés, raccordable)"""
    r = np.random.default_rng(seed); out = np.zeros((n, n)); amp = 1; tot = 0
    for o in range(octaves):
        f = freq * 2 ** o
        g = r.random((f, f))
        g = np.pad(g, ((0, 1), (0, 1)), mode='wrap')
        z = ndimage.zoom(g, (n + n / f) / (f + 1), order=3, mode='grid-wrap')[:n, :n]
        out += z * amp; tot += amp; amp *= pers
    out /= tot; return (out - out.min()) / (out.max() - out.min() + 1e-9)

def voronoi(n, pts):
    """distances F1, F2 et identifiant de cellule, périodiques"""
    yy, xx = np.mgrid[0:n, 0:n] / n
    P = np.concatenate([pts + [dx, dy] for dx in (-1, 0, 1) for dy in (-1, 0, 1)])
    ids = np.tile(np.arange(len(pts)), 9)
    F1 = np.full((n, n), 9.); F2 = np.full((n, n), 9.); ID = np.zeros((n, n), int)
    for (px, py), i in zip(P, ids):
        d = np.hypot(xx - px, yy - py)
        m = d < F1; F2 = np.where(m, F1, np.minimum(F2, d)); ID = np.where(m, i, ID); F1 = np.where(m, d, F1)
    return F1, F2, ID

def normal_from_h(h, strength):
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * strength
    gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * strength
    nz = np.ones_like(h); l = np.sqrt(gx * gx + gy * gy + 1)
    return np.stack([(-gx / l) * .5 + .5, (-gy / l) * .5 + .5, nz / l * .5 + .5], -1)

def save(name, diff, h, strength):
    Image.fromarray((np.clip(diff, 0, 1) * 255).astype(np.uint8)).save(f'tex/{name}_d.jpg', quality=82)
    Image.fromarray((normal_from_h(h, strength) * 255).astype(np.uint8)).save(f'tex/{name}_n.jpg', quality=85)

def tint(base, var, ids, seed):
    r = np.random.default_rng(seed); k = ids.max() + 1
    w = (r.random(k) - .5); t = 1 + np.stack([w * .06, w * .02, -w * .06], -1) + (r.random((k, 3)) - .5) * var * .12; l = 1 + (r.random(k) - .5) * var * 2.2
    return np.array(base)[None, None, :] * t[ids] * l[ids][..., None]

def flagstone(name, base, seed, cells=25, mortar=.0045, rough=.6, dark=None):
    r0 = np.random.default_rng(seed); g = int(round(cells ** .5))
    pts = np.array([[(i + .5 + (r0.random() - .5) * .75) / g, (j + .5 + (r0.random() - .5) * .75) / g] for i in range(g) for j in range(g)]) % 1
    cells = len(pts)
    F1, F2, ID = voronoi(N, pts)
    edge = F2 - F1
    w = pnoise(N, 8, seed + 1, 4)
    gap = np.clip((edge - mortar * (0.5 + w)) / .008, 0, 1)            # 0 joint, 1 dalle
    bevel = np.clip(edge / .05, 0, 1) ** .6
    det = pnoise(N, 16, seed + 2, 6, .55); big = pnoise(N, 4, seed + 3, 3)
    pits = (pnoise(N, 64, seed + 4, 2) > .78) * .25
    cracks = np.exp(-((pnoise(N, 6, seed + 5, 3) - .5) ** 2) / .00006) * np.clip((pnoise(N, 3, seed + 6, 2) - .62) * 6, 0, 1) * .6
    h = gap * (.55 + .25 * bevel + .2 * det * rough) - pits * gap - cracks * .25 + (1 - gap) * .05 * det
    col = tint(base, .22, ID, seed)
    shade = (.62 + .38 * det) * (.8 + .3 * big) * (.68 + .32 * bevel)
    mort = np.array(dark or [b * .5 for b in base])[None, None, :] * (.7 + .5 * det[..., None])
    d = col * shade[..., None] * gap[..., None] + mort * (1 - gap[..., None])
    d *= (1 - cracks[..., None] * .55) * (1 - pits[..., None] * .8)
    grime = pnoise(N, 5, seed + 7, 4); d *= (.82 + .18 * grime[..., None])
    save(name, d, h, 6.0)

def bricks(name, base, seed, rows=8, cols=4, mortar=.0045):
    yy, xx = np.mgrid[0:N, 0:N] / N
    r = np.random.default_rng(seed)
    row = np.floor(yy * rows).astype(int)
    # chaque rangée décalée d'une quantité aléatoire, largeurs irrégulières
    off = r.random(rows); wv = pnoise(N, 4, seed + 9, 2)
    u = (xx * cols + off[row] + (wv - .5) * .6) % cols
    col_i = np.floor(u).astype(int); fu = u - col_i; fv = yy * rows - row
    ids = row * cols + col_i
    jag = (pnoise(N, 24, seed + 1, 3) - .5) * .05 + (pnoise(N, 8, seed + 11, 3) - .5) * .05
    e = np.minimum(np.minimum(fu, 1 - fu) / cols * rows * .5, np.minimum(fv, 1 - fv)) + jag
    gap = np.clip((e - mortar * rows) / .02, 0, 1)
    det = pnoise(N, 16, seed + 2, 6, .55); big = pnoise(N, 3, seed + 3, 3)
    chips = (pnoise(N, 20, seed + 4, 3) > .72) * np.clip(1 - e * 12, 0, 1)
    h = gap * (.6 + .3 * np.clip(e * 8, 0, 1) + .25 * det) - chips * .35
    colr = tint(base, .26, ids, seed)
    shade = (.6 + .4 * det) * (.8 + .3 * big)
    mort = np.array([b * .5 for b in base])[None, None, :] * (.7 + .5 * det[..., None])
    d = colr * shade[..., None] * gap[..., None] + mort * (1 - gap[..., None])
    d *= 1 - chips[..., None] * .35
    damp = np.clip((yy - .55) * 2.2, 0, 1) * pnoise(N, 6, seed + 8, 4)   # humidité vers le bas
    d *= (1 - damp[..., None] * .35)
    save(name, d, h, 5.0)

def rock(name, base, seed):
    a = pnoise(N, 4, seed, 7, .55); b = pnoise(N, 8, seed + 1, 6, .5)
    ridge = 1 - np.abs(b * 2 - 1)
    h = a * .6 + ridge ** 2 * .4
    strata = np.sin((np.mgrid[0:N, 0:N][0] / N * 18 + a * 6) * np.pi) * .5 + .5
    d = np.array(base)[None, None, :] * (.5 + .55 * h[..., None]) * (.88 + .12 * strata[..., None])
    moss = np.clip((pnoise(N, 5, seed + 3, 4) - .62) * 4, 0, 1) * (1 - h)
    d = d * (1 - moss[..., None] * .5) + np.array([.18, .2, .12])[None, None, :] * moss[..., None] * .5
    save(name, d, h, 9.0)

def dirt(name, base, seed):
    a = pnoise(N, 8, seed, 6, .55); pebble = (pnoise(N, 28, seed + 1, 2) > .8).astype(float)
    pebble = ndimage.gaussian_filter(pebble, 1.2)
    h = a * .5 + pebble * .6
    d = np.array(base)[None, None, :] * (.55 + .45 * a[..., None]) * (1 + pebble[..., None] * .12) * (.85 + .3 * pnoise(N, 3, seed + 5, 3)[..., None])
    save(name, d, h, 7.0)

import os; os.makedirs('tex', exist_ok=True)
flagstone('crypt_f', [.42, .40, .40], 11)
bricks('crypt_w', [.40, .38, .37], 12)
dirt('cav_f', [.34, .30, .24], 21)
rock('cav_w', [.36, .33, .28], 22)
flagstone('forge_f', [.36, .30, .27], 31, cells=20, dark=[.06, .04, .03])
bricks('forge_w', [.40, .30, .26], 32, rows=7, cols=3)
flagstone('frost_f', [.42, .46, .52], 41, cells=30)
rock('frost_w', [.42, .46, .52], 42)
print('ok')
