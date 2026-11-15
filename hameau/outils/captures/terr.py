import os
import json
from playwright.sync_api import sync_playwright
save=open(os.environ.get('SAVE',os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../jeu/test_save.json'))).read()
BASE='https://cdn.jsdelivr.net/npm/three@0.160.0/'
def route(r):r.fulfill(path=''+os.environ.get('THREE','/home/claude/deps/node_modules/three')+'/'+r.request.url[len(BASE):],content_type='application/javascript')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':390,'height':780},device_scale_factor=1)
    pg.route(BASE+'**',route)
    pg.add_init_script("localStorage.setItem('hameau3d_save_v3',"+json.dumps(save)+")")
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)+' '+(e.stack or '')[:300]));pg.on('console',lambda m:errs.append(m.text))
    pg.goto('file://'+os.environ.get('JEU','/home/claude/hameau3d.html'));pg.wait_for_timeout(4000)
    print([e for e in errs if 'toNonIndexed' not in e][:6]); b.close()
