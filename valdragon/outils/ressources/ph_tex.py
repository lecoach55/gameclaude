# Textures de biome à partir des textures Poly Haven (CC0) de Victor, personnalisées.
# usage : python3 ph_tex.py  (lit /home/claude/assets/ph, écrit tex/*.jpg)
import numpy as np, sys
from PIL import Image
from scipy import ndimage
Image.MAX_IMAGE_PIXELS = None
SRC = '/home/claude/assets/ph'
N = 1024

def pnoise(n, freq, seed, octaves=5, pers=.5):
    r = np.random.default_rng(seed); out = np.zeros((n, n)); amp = 1; tot = 0
    for o in range(octaves):
        f = freq * 2 ** o; g = r.random((f, f)); g = np.pad(g, ((0, 1), (0, 1)), mode='wrap')
        z = ndimage.zoom(g, (n + n / f) / (f + 1), order=3, mode='grid-wrap')[:n, :n]
        out += z * amp; tot += amp; amp *= pers
    out /= tot; return (out - out.min()) / (out.max() - out.min() + 1e-9)

def load(name):
    d = Image.open(f'{SRC}/{name}/{name}_diff_4k.jpg').convert('RGB').resize((N, N), Image.LANCZOS)
    h = Image.open(f'{SRC}/{name}/{name}_disp_4k.png')
    h = np.asarray(h.convert('I;16') if h.mode not in ('L', 'I;16') else h, dtype=np.float32)
    h = np.asarray(Image.fromarray(h).resize((N, N), Image.BILINEAR), dtype=np.float32)
    h = (h - h.min()) / (h.max() - h.min() + 1e-9)
    return np.asarray(d, dtype=np.float32) / 255, h

def normal(h, strength):
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * strength
    gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * strength
    l = np.sqrt(gx * gx + gy * gy + 1)
    return np.stack([-gx / l * .5 + .5, -gy / l * .5 + .5, 1 / l * .5 + .5], -1)

def grade(c, tint=(1, 1, 1), sat=1., gain=1., gamma=1.):
    L = (c * [.3, .59, .11]).sum(-1, keepdims=True)
    c = L + (c - L) * sat
    return np.clip((c * tint * gain) ** gamma, 0, 1)

def save(name, d, h, strength):
    Image.fromarray((np.clip(d, 0, 1) * 255).astype(np.uint8)).save(f'tex/{name}_d.jpg', quality=80, optimize=True)
    Image.fromarray((normal(h, strength) * 255).astype(np.uint8)).save(f'tex/{name}_n.jpg', quality=82, optimize=True)

def soft(m, lo, hi): return np.clip((m - lo) / (hi - lo), 0, 1)

# --- crypte : dalles de pierre froides, salpêtre dans les joints, taches d'humidité
d, h = load('stone_tiles_02')
damp = soft(pnoise(N, 3, 101, 4), .55, .8)[..., None]
salt = (soft(1 - h, .55, .8) * soft(pnoise(N, 12, 102, 3), .5, .75))[..., None]
c = grade(d, (.94, .95, 1.0), .55, .74, 1.12)
c = c * (1 - damp * .35) + np.array([.5, .49, .46]) * salt * .14
save('crypt_f', c, h, 9)
d, h = load('stone_brick_wall_001')
moss = (soft(pnoise(N, 4, 111, 4), .62, .82) * soft(1 - h, .3, .7))[..., None]
c = grade(d, (.95, .95, .98), .5, .9)
c = c * (1 - moss) + c * np.array([.55, .68, .45]) * moss
save('crypt_w', c, h, 8)

# --- cavernes : pavés envahis de terre, roche brune
d, h = load('cobblestone_floor_001')
dirtm = soft(pnoise(N, 4, 201, 5) + (1 - h) * .35, .6, .75)[..., None]
dirt = np.asarray(Image.open('tex_proc/cav_f_d.jpg').convert('RGB').resize((N, N)), dtype=np.float32) / 255 * 1.05
c = grade(d, (1.02, .97, .88), .7, .85)
c = c * (1 - dirtm) + dirt * dirtm
h2 = h * (1 - dirtm[..., 0] * .7) + .3 * dirtm[..., 0]
save('cav_f', c, h2, 9)
d, h = load('rock_wall_12')
wet = soft(pnoise(N, 5, 211, 4), .6, .85)[..., None]
c = grade(d, (1.04, .96, .86), .75, .82)
c = c * (1 - wet * .4) + np.array([.08, .1, .06]) * wet * .2
save('cav_w', c, h, 10)

# --- forge : pierre noircie de suie, braises dans les fissures profondes
d, h = load('cobblestone_floor_001')
deep = soft(1 - h, .84, .97) * soft(pnoise(N, 6, 301, 4), .55, .78)
soot = soft(pnoise(N, 3, 302, 4), .4, .75)[..., None]
c = grade(d, (1.08, .86, .78), .55, .7, 1.1)
c = c * (1 - soot * .45)
c = c + np.array([1.0, .38, .08])[None, None, :] * deep[..., None] * .6
save('forge_f', c, h, 9)
d, h = load('rustic_stone_wall')
c = grade(d, (1.06, .86, .76), .6, .72, 1.1)
c = c * (1 - soft(pnoise(N, 4, 311, 4), .45, .8)[..., None] * .5)
save('forge_w', c, h, 8)

# --- abîme de givre : dalles bleutées, givre dans les creux et sur les arêtes
d, h = load('stone_tiles_02')
frost = np.clip(soft(1 - h, .5, .85) * .8 + soft(pnoise(N, 8, 401, 4), .6, .85) * .5, 0, 1)[..., None]
sparkle = (np.random.default_rng(402).random((N, N)) > .995)[..., None] * frost
c = grade(d, (.86, .95, 1.1), .45, .9)
c = c * (1 - frost * .7) + np.array([.78, .86, .95]) * frost * .7 + sparkle * .3
save('frost_f', c, h * (1 - frost[..., 0] * .3), 9)
d, h = load('rock_wall_12')
gy = np.roll(h, 1, 0) - np.roll(h, -1, 0)
ledge = soft(ndimage.gaussian_filter(gy, 2), .002, .012)[..., None]
c = grade(d, (.84, .94, 1.12), .4, .88)
c = c * (1 - ledge * .4) + np.array([.82, .9, .98]) * ledge * .4
save('frost_w', c, h, 10)
print('ok')
