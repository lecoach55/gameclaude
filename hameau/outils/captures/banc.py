import os
from playwright.sync_api import sync_playwright
BASE='https://cdn.jsdelivr.net/npm/three@0.160.0/'
def route(r):r.fulfill(path=''+os.environ.get('THREE','/home/claude/deps/node_modules/three')+'/'+r.request.url[len(BASE):],content_type='application/javascript')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':390,'height':780});pg.route(BASE+'**',route)
    pg.add_init_script("localStorage.setItem('hameau_q','haute')")
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));msg=[]
    pg.on('dialog',lambda d:(msg.append(d.message),d.accept()))
    pg.goto('file://'+os.environ.get('JEU','/home/claude/hameau3d.html'));pg.wait_for_timeout(3000)
    pg.click('#bTest',timeout=150000)
    for k in range(160):
        pg.wait_for_timeout(5000)
        if msg:break
    print(msg[:1]);print('save touchée:',pg.evaluate("()=>localStorage.getItem('hameau3d_save_v3')!==null"));print(errs[:4]);b.close()
