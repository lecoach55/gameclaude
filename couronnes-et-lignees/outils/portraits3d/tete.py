"""Rend une tête de test (orientation et qualité)."""
import os, sys, base64, json
from playwright.sync_api import sync_playwright
ICI = os.path.dirname(os.path.abspath(__file__)); JEU = os.path.join(ICI, '..', '..', 'jeu')
def b64(f, mime): return f'data:{mime};base64,' + base64.b64encode(open(os.path.join(ICI, 'src', f), 'rb').read()).decode()
def page():
    p = sync_playwright().start(); b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 600, 'height': 600}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    pg.add_init_script("localStorage.setItem('cl_3d','0')"); pg.goto('file://' + os.path.abspath(os.path.join(JEU, 'index.html'))); pg.wait_for_timeout(600)
    pg.evaluate("(a)=>{window.PSRC=a}", {'glb': b64('LeePerrySmith.glb', 'application/octet-stream'), 'peau': b64('peau.jpg', 'image/jpeg'), 'relief': b64('relief.jpg', 'image/jpeg')})
    pg.add_script_tag(path=os.path.join(ICI, 'portraits3d.js'))
    return p, b, pg, errs
if __name__ == '__main__':
    p, b, pg, errs = page(); L = json.loads(sys.argv[2]); os.makedirs(sys.argv[1], exist_ok=True)
    pg.evaluate("PORTRAIT.pret()"); pg.wait_for_timeout(1200)
    for n, d in L.items():
        u = pg.evaluate("(d)=>PORTRAIT.rendre(d)", d); pg.wait_for_timeout(50)
        open(os.path.join(sys.argv[1], n + '.png'), 'wb').write(base64.b64decode(u.split(',')[1]))
    print('erreurs', errs[-3:]); b.close(); p.stop()
