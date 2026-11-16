"""Banque de portraits 3D : python3 banque.py [visages=5] [taille=160]
Écrit outils/portraits3d/banque/*.webp (+ masques du vêtement) et jeu/portraits3d.js (PORT3D)."""
import os, sys, base64, io, json, time
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import tete
ICI = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(ICI, 'banque'); os.makedirs(OUT, exist_ok=True)
NV = int(sys.argv[1]) if len(sys.argv) > 1 else 5; TW = int(sys.argv[2]) if len(sys.argv) > 2 else 160; TH = int(TW * 1.2)
p, b, pg, errs = tete.page(); pg.evaluate("PORTRAIT.pret()"); pg.wait_for_timeout(1500)
def rend(d, nom, masque=False):
    u = pg.evaluate("(d)=>PORTRAIT.rendre(d)", dict(d, taille=TW * 2, masque=masque))
    im = Image.open(io.BytesIO(base64.b64decode(u.split(',')[1]))).convert('L' if masque else 'RGBA').resize((TW, TH), Image.LANCZOS)
    f = os.path.join(OUT, nom + '.webp'); im.save(f, 'WEBP', quality=60 if masque else 70, method=6); return f
t0 = time.time(); n = 0
for sexe in 'MF':
    for age in range(4):
        for ep in ([0] if age == 0 else [0, 1, 2]):
            rend({'sexe': sexe, 'age': age, 'visage': 0, 'epoque': ep}, f'm_{sexe}{age}{ep}', True)
            for cour in ([0] if age == 0 else [0, 1]):
                for v in range(NV):
                    rend({'sexe': sexe, 'age': age, 'visage': v, 'epoque': ep, 'couronne': cour}, f'p_{sexe}{age}{ep}{cour}_{v}'); n += 1
    print(sexe, n, 'portraits', round(time.time() - t0), 's', errs[-2:])
b.close(); p.stop()
data = {'nv': NV, 'p': {}, 'm': {}}
for f in sorted(os.listdir(OUT)):
    if not f.endswith('.webp'): continue
    u = 'data:image/webp;base64,' + base64.b64encode(open(os.path.join(OUT, f), 'rb').read()).decode()
    if f.startswith('m_'): data['m'][f[2:-5]] = u
    else: data['p'][f[2:-5]] = u
dst = os.path.join(ICI, '..', '..', 'jeu', 'portraits3d.js')
open(dst, 'w').write('const PORT3D = ' + json.dumps(data, separators=(',', ':')) + ';\n')
print('portraits3d.js', os.path.getsize(dst) // 1024, 'Ko', 'banque', sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) // 1024, 'Ko')
