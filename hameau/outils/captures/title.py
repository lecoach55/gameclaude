import os
from playwright.sync_api import sync_playwright
BASE='https://cdn.jsdelivr.net/npm/three@0.160.0/'
def route(r):r.fulfill(path=''+os.environ.get('THREE','/home/claude/deps/node_modules/three')+'/'+r.request.url[len(BASE):],content_type='application/javascript')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':390,'height':780},device_scale_factor=2);pg.route(BASE+'**',route)
    pg.add_init_script("localStorage.setItem('hameau_q','haute')")
    pg.goto('file://'+os.environ.get('JEU','/home/claude/hameau3d.html'));pg.wait_for_timeout(9000);pg.screenshot(path=os.environ.get('CAPT','/tmp/captures')+'/title.png',timeout=240000);b.close()
