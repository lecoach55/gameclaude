import os
import json
from playwright.sync_api import sync_playwright
save=open(os.environ.get('SAVE',os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../jeu/test_save.json'))).read()
BASE='https://cdn.jsdelivr.net/npm/three@0.160.0/'
def route(r):r.fulfill(path=''+os.environ.get('THREE','/home/claude/deps/node_modules/three')+'/'+r.request.url[len(BASE):],content_type='application/javascript')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':390,'height':780},device_scale_factor=2);pg.route(BASE+'**',route)
    pg.add_init_script("localStorage.setItem('hameau3d_save_v3',"+json.dumps(save)+");localStorage.setItem('hameau_q','haute')")
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+os.environ.get('JEU','/home/claude/hameau3d.html'));pg.wait_for_timeout(2000);pg.click('#bStart',timeout=150000);pg.wait_for_timeout(4000)
    pg.click('#pPop');pg.wait_for_timeout(2500);pg.screenshot(path=os.environ.get('CAPT','/tmp/captures')+'/ui_panel.png',timeout=240000);pg.click('#pPop')
    pg.evaluate("()=>{const S=__S;const b=S.buildings.find(b=>b.type==='house'&&b.level>=2);window.__showB&&window.__showB(b)}")
    pg.click('#pMenu');pg.wait_for_timeout(2000);pg.screenshot(path=os.environ.get('CAPT','/tmp/captures')+'/ui_pause.png',timeout=240000)
    print(errs[:5]);b.close()
