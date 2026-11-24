"""Montagnes de lave (24/11) : à partir des montagnes normales (mont_X_h/_b), roche basaltique sombre et froide, veines de lave rougeoyantes
dans les creux bas et au pied. Remplace les montagnes brun-rouge unies qui détonnaient sur le sol de basalte.
Usage : python3 montagnes_lave.py jeu/imp"""
import sys, glob, os, numpy as np
from PIL import Image, ImageFilter
D = sys.argv[1]; rng = np.random.default_rng(3)
for f in sorted(glob.glob(f'{D}/mont_?_[hb].webp')):
    n = os.path.basename(f); v = n[-6]; base = n[:6]; out = f'{D}/{base}_l_{v}.webp'
    if not os.path.exists(out): continue
    im = Image.open(f).convert('RGBA'); a = np.asarray(im).astype(np.float32) / 255; rgb, al = a[..., :3], a[..., 3]; H, W = al.shape
    lum = rgb @ np.array([.3, .59, .11])
    bas = np.clip(lum * .48, 0, 1)[..., None] * np.array([.95, .88, .86]) + np.array([.05, .04, .04])  # basalte
    # veines : bruit fin seuillé, plus fréquentes en bas et dans les creux sombres
    def bruit(s):
        b = rng.random((H // s + 2, W // s + 2)).astype(np.float32)
        return np.asarray(Image.fromarray((b * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)).astype(np.float32) / 255
    nz = bruit(9) * .6 + bruit(22) * .4
    ridge = 1 - np.abs(nz - .5) * 2  # crêtes du bruit = fissures
    yy = np.linspace(0, 1, H)[:, None] * np.ones((1, W))
    bot = np.zeros(W)
    for x in range(W):
        ys = np.nonzero(al[:, x] > .5)[0]; bot[x] = ys.max() if len(ys) else H
    prox = np.clip(1 - (bot[None, :] - np.arange(H)[:, None]) / (H * .3), 0, 1)  # près du pied
    fis = np.clip((ridge - .94) / .05, 0, 1) * (prox ** 2 * .9 + (lum < .25) * .25) * (al > .5)
    glow = np.asarray(Image.fromarray((np.clip(fis, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255
    col = bas * (1 - glow[..., None] * .4) + glow[..., None] * np.array([1., .4, .1]) * .8 + fis[..., None] * np.array([1., .7, .3]) * .5
    res = np.dstack([np.clip(col, 0, 1), al])
    Image.fromarray((res * 255).astype(np.uint8)).save(out, 'WEBP', quality=88, method=6); print('ok', out)
