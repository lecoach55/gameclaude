"""Sapins enneigés (24/11) : à partir des imposteurs sapin_a/b/c (vues h et b), pose de la neige sur le dessus des branches.
Masque = pixels opaques dont le voisin du dessus est vide ou nettement plus sombre (bord supérieur des étages de branches), élargi vers le bas, modulé par du bruit.
Usage : python3 sapins_neige.py jeu/imp  → sapin_aN_h.webp … et entrées dans imp.json"""
import sys, json, numpy as np
from PIL import Image, ImageFilter
D = sys.argv[1]; meta = json.load(open(f'{D}/imp.json')); rng = np.random.default_rng(5)
for n in ('sapin_a', 'sapin_b', 'sapin_c'):
    for v in ('h', 'b'):
        im = Image.open(f'{D}/{n}_{v}.webp').convert('RGBA'); a = np.asarray(im).astype(np.float32) / 255
        rgb, al = a[..., :3], a[..., 3]; H, W = al.shape
        lum = rgb @ np.array([.3, .59, .11])
        k = max(2, H // 90)
        up_a = np.vstack([np.zeros((k, W)), al[:-k]]); up_l = np.vstack([np.zeros((k, W)), lum[:-k]])
        bord = (al > .5) & ((up_a < .3) | (up_l < lum - .11))
        m = Image.fromarray((bord * 255).astype(np.uint8))
        # la neige s'étale un peu vers le bas sous chaque bord
        ker = np.zeros((k * 5, 1)); ker[:k * 3] = 1
        mm = np.asarray(m).astype(np.float32) / 255
        acc = np.zeros_like(mm)
        for d in range(k * 2):
            acc[d:] = np.maximum(acc[d:], mm[:H - d] * (1 - d / (k * 2.2)))
        acc = np.asarray(Image.fromarray((acc * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(k * .5))).astype(np.float32) / 255
        bruit = np.asarray(Image.fromarray((rng.random((H // 6 + 1, W // 6 + 1)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)).astype(np.float32) / 255
        s = np.clip(acc * 1.4 * (.45 + .7 * bruit), 0, 1) * (al > .4)
        neige = np.array([.86, .9, .96]) * (.75 + .3 * lum[..., None] / max(lum.max(), 1e-3))
        out = rgb * (1 - s[..., None]) + neige * s[..., None]
        out = out * .92 + np.array([.02, .03, .05])  # froid
        res = np.dstack([np.clip(out, 0, 1), al])
        Image.fromarray((res * 255).astype(np.uint8)).save(f'{D}/{n}N_{v}.webp', 'WEBP', quality=88, method=6)
        meta[f'{n}N_{v}'] = meta[f'{n}_{v}']
json.dump(meta, open(f'{D}/imp.json', 'w'), separators=(',', ':')); print('ok')
