# Vérifie les gestes sur la carte : glisser (souris = doigt), molette, puis toucher une terre.
import sys, os
from playwright.sync_api import sync_playwright
html = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else 'index.html')
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox']+(['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] if os.environ.get('V3D')=='1' else [])); pg = b.new_page(viewport={'width': 390, 'height': 844})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('cl_guide','1');localStorage.setItem('cl_3d','"+('1' if os.environ.get('V3D')=='1' else '0')+"')"); pg.goto('file://' + html); pg.wait_for_timeout(800); pg.evaluate("startTest()")
    vb = lambda: pg.evaluate("document.getElementById('board').getAttribute('viewBox')")
    v0 = vb(); pg.mouse.move(200, 450); pg.mouse.down()
    for i in range(12): pg.mouse.move(200 - i * 8, 450 - i * 5)
    mid = pg.evaluate("document.getElementById('board').style.transform"); pg.mouse.up(); pg.wait_for_timeout(300)
    v1 = vb(); tr = pg.evaluate("document.getElementById('board').style.transform")
    pg.mouse.wheel(0, -300); pg.wait_for_timeout(400); v2 = vb()
    pg.mouse.click(195, 470); pg.wait_for_timeout(500); sheet = pg.evaluate("document.querySelector('#modal').innerText.slice(0,40)")
    ok = v1 != v0 and tr == '' and v2 != v1 and 'translate' in mid
    print('glisser:', v0, '->', v1, '| pendant:', mid[:40], '| après:', repr(tr), '| molette:', v2, '| toucher:', sheet.replace('\n', ' '), '| erreurs', errs)
    print('OK' if ok else 'ÉCHEC'); b.close()
