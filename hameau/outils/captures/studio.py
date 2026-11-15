import json,sys,os
from playwright.sync_api import sync_playwright
BASE='https://cdn.jsdelivr.net/npm/three@0.160.0/'
def route(r):r.fulfill(path=''+os.environ.get('THREE','/home/claude/deps/node_modules/three')+'/'+r.request.url[len(BASE):],content_type='application/javascript')
lists=json.loads(sys.argv[1]);yaws=json.loads(sys.argv[2]);pre=sys.argv[3]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':900,'height':640},device_scale_factor=1)
    pg.route(BASE+'**',route)
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda d:d.accept())
    pg.add_init_script("localStorage.setItem('hameau_q','haute')")
    pg.goto('file://'+os.environ.get('JEU','/home/claude/hameau3d.html'));pg.wait_for_timeout(2500)
    pg.click('#bNew',timeout=150000) if pg.is_visible('#bNew') else pg.click('#bStart')
    pg.evaluate("()=>{for(const id of ['top','bottom','rot','toasts'])document.getElementById(id).style.display='none'}")
    k=0
    for L in lists:
        for y in yaws:
            pg.evaluate("([l,y])=>window.__studio(l,y)",[L,y]);pg.wait_for_timeout(2500)
            pg.screenshot(path=os.environ.get('CAPT','/tmp/captures')+f'/{pre}{k}.png');k+=1
    print(errs[:5]);b.close()
