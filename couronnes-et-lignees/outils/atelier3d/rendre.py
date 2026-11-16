"""Atelier 3D : rend les scènes d'événements de Couronnes & Lignées en WebP.
Usage : python3 rendre.py [scènes séparées par des virgules] [--ages] [--apercu]
Sortie : couronnes-et-lignees/jeu/scenes3d/<scène>_<âge>.webp + flags.json, puis jeu/scenes3d.js (embarqué par build.py)."""
import os, sys, json, base64, io, time
from playwright.sync_api import sync_playwright
from PIL import Image
ICI = os.path.dirname(os.path.abspath(__file__)); JEU = os.path.join(ICI, '..', '..', 'jeu'); OUT = os.path.join(JEU, 'scenes3d'); os.makedirs(OUT, exist_ok=True)
args = [a for a in sys.argv[1:] if not a.startswith('--')]
AGES = [0, 1, 2] if '--ages' in sys.argv else [0]
UNIQUE = {'cour', 'couronnement', 'nuit', 'peste'}  # une seule lumière quel que soit l'âge
def finir(im):
    # finition « peinture » : légère vignette et contraste doux
    from PIL import ImageFilter, ImageEnhance, ImageChops
    w, h = im.size; m = Image.new('L', (w, h), 0); px = m.load()
    import math
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            d = math.hypot((x - w / 2) / (w / 2), (y - h / 2) / (h / 2)); v = int(255 * max(0, min(1, 1 - 0.32 * max(0, d - 0.55) ** 1.5 * 2)))
            px[x, y] = v
            if x + 1 < w: px[x + 1, y] = v
            if y + 1 < h: px[x, y + 1] = v; px[min(x + 1, w - 1), y + 1] = v
    m = m.filter(ImageFilter.GaussianBlur(4)); dark = Image.new('RGB', (w, h), (18, 12, 8))
    im = Image.composite(im, dark, m)
    return ImageEnhance.Contrast(im).enhance(1.06)
fl_path = os.path.join(OUT, 'flags.json'); FL = json.load(open(fl_path)) if os.path.exists(fl_path) else {}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 800, 'height': 600}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    pg.add_init_script("localStorage.setItem('cl_3d','0');localStorage.setItem('cl_guide','1')")
    pg.goto('file://' + os.path.abspath(os.path.join(JEU, 'index.html'))); pg.wait_for_timeout(800)
    pg.add_script_tag(path=os.path.join(ICI, 'scenes3d.js'))
    kinds = args[0].split(',') if args else pg.evaluate('ATELIER.KINDS')
    for k in kinds:
        for era in ([0] if k in UNIQUE else AGES):
            t = time.time(); W, H = (1200, 1200) if k == 'titre' else (1440, 600)
            pg.evaluate(f"ATELIER.build('{k}', {era}, {W}, {H})"); pg.wait_for_timeout(1500)
            r = pg.evaluate("ATELIER.shot()"); pg.evaluate("ATELIER.dispose()")
            im = Image.open(io.BytesIO(base64.b64decode(r['url'].split(',')[1]))).convert('RGB').resize((W // 2, H // 2), Image.LANCZOS)
            im = finir(im)
            name = f'{k}_{era}'; im.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=72, method=6)
            hors = [f['pts'] for f in r['flags'] if any(x < W * 0.03 or x > W * 0.97 or y < H * 0.04 or y > H * 0.96 for x, y in f['pts'])]
            if hors: print('  ⚠ drapeau hors cadre', k, hors)
            FL[k] = [{'who': f['who'], 'pts': [[x // 2, y // 2] for x, y in f['pts']]} for f in r['flags']]
            print(name, round(time.time() - t, 1), 's', os.path.getsize(os.path.join(OUT, name + '.webp')) // 1024, 'Ko', errs[-3:])
    b.close()
json.dump(FL, open(fl_path, 'w'))
# embarquer : IMG3D = {scène: {e: [âge0, âge1, âge2], f: drapeaux}}
data = {}
for f in sorted(os.listdir(OUT)):
    if not f.endswith('.webp'): continue
    k, e = f[:-5].rsplit('_', 1); data.setdefault(k, {'e': [None, None, None], 'f': FL.get(k, [])})['e'][int(e)] = 'data:image/webp;base64,' + base64.b64encode(open(os.path.join(OUT, f), 'rb').read()).decode()
open(os.path.join(JEU, 'scenes3d.js'), 'w').write('const IMG3D = ' + json.dumps(data, separators=(',', ':')) + ';\n')
print('scenes3d.js', os.path.getsize(os.path.join(JEU, 'scenes3d.js')) // 1024, 'Ko')
