import os
from playwright.sync_api import sync_playwright
BASE='https://cdn.jsdelivr.net/npm/three@0.160.0/'
def route(r):r.fulfill(path=''+os.environ.get('THREE','/home/claude/deps/node_modules/three')+'/'+r.request.url[len(BASE):],content_type='application/javascript')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':390,'height':780});pg.route(BASE+'**',route)
    pg.add_init_script("localStorage.setItem('hameau_q','eco')")
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+os.environ.get('JEU','/home/claude/hameau3d.html'));pg.wait_for_timeout(3000);pg.click('#bStart',timeout=150000);pg.wait_for_timeout(3000)
    r=[pg.evaluate("()=>window.__tuto().k")]
    pg.evaluate("()=>{const S=__S,h=S.hall;for(let k=0;k<3;k++)S.paint(1,h.x-2,h.y+k,3)}");pg.wait_for_timeout(2500);r.append(pg.evaluate("()=>window.__tuto().k"))
    pg.evaluate("()=>{const S=__S,h=S.hall;for(let k=0;k<3;k++)S.paint(2,h.x+5,h.y+k*3,3)}");pg.wait_for_timeout(2500);r.append(pg.evaluate("()=>window.__tuto().k"))
    pg.click('#tSkip',timeout=150000);pg.wait_for_timeout(1000);r.append(pg.evaluate("()=>[window.__tuto().on,localStorage.getItem('hameau_tuto')]"))
    print(r,errs[:4]);b.close()
