# Captures des nouveautés « vie du hameau » : moutons, marchand, enfants, fiches (villageois, marché, champ)
# Usage : JEU=/tmp/h.html SAVE=/home/claude/save_v2.json CAPT=/tmp/c2 python3 nouveautes.py [temps]
import json, sys, os
from playwright.sync_api import sync_playwright
save = open(os.environ.get('SAVE', os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../jeu/test_save.json'))).read()
BASE = 'https://cdn.jsdelivr.net/npm/three@0.160.0/'
OUT = os.environ.get('CAPT', '/tmp/captures')
T = float(sys.argv[1]) if len(sys.argv) > 1 else None
def route(r): r.fulfill(path=os.environ.get('THREE', '/home/claude/deps/node_modules/three') + '/' + r.request.url[len(BASE):], content_type='application/javascript')
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 390, 'height': 780}, device_scale_factor=2)
    pg.route(BASE + '**', route)
    pg.add_init_script("localStorage.setItem('hameau3d_save_v3'," + json.dumps(save) + ");localStorage.setItem('hameau_q','haute');localStorage.setItem('hameau_tuto','1')")
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.environ.get('JEU', '/home/claude/hameau3d.html')); pg.wait_for_timeout(2000)
    pg.click('#bStart', timeout=150000)
    if T is not None: pg.evaluate("t=>{window.__S.time=t}", T)
    SEUL = os.environ.get('SEUL')
    def shot(name, wait=9000):
        if SEUL and name not in SEUL.split(','): return
        pg.wait_for_timeout(wait); pg.screenshot(path=f'{OUT}/n_{name}.png', timeout=240000)
    # 1. troupeau
    pg.evaluate("()=>{const S=window.__S,c=window.__cam;if(!S.sheep.length)return;let x=0,y=0;for(const a of S.sheep){x+=a.x;y+=a.y;}c.x=x/S.sheep.length;c.z=y/S.sheep.length;c.dist=9;}")
    shot('troupeau')
    # 2. marchand + fiche du marché (échanges)
    pg.evaluate("()=>{const S=window.__S,c=window.__cam,m=S.merchant&&S.bmap.get(S.merchant.mk);if(!m)return;c.x=m.x+1;c.z=m.y+1;c.dist=9;}")
    pg.wait_for_timeout(1500)
    pg.evaluate("()=>{const G=window.__merch&&window.__merch();if(!G)return;const c=window.__cam;c.x=G.position.x;c.z=G.position.z;c.dist=6.5;c.pitch=1.2;}")
    shot('chariot')
    pg.evaluate("()=>{const S=window.__S,m=S.merchant&&S.bmap.get(S.merchant.mk);if(m)window.__showInfo({x:m.x,y:m.y});}")
    shot('marchand',3000)
    # 3. un enfant suivi par la caméra + sa fiche
    pg.evaluate("()=>{const S=window.__S;const v=S.villagers.find(v=>S.isKid(v))||S.villagers[0];window.__showVillager(v);window.__cam.follow=v;window.__cam.dist=7;}")
    shot('enfant')
    # 4. un ancien
    pg.evaluate("()=>{const S=window.__S;const v=S.villagers.slice().sort((a,b)=>b.age-a.age)[0];window.__showVillager(v);window.__cam.follow=v;window.__cam.dist=7;}")
    shot('ancien')
    # 5. champs : fiche d'une case (fertilité)
    pg.evaluate("()=>{const S=window.__S;window.__cam.follow=null;let i=-1;for(let k=0;k<S.N;k++)if(S.zone[k]===S.Z.field){i=k;break;}if(i<0)return;window.__cam.x=i%S.W;window.__cam.z=(i/S.W|0);window.__cam.dist=12;window.__showInfo({x:i%S.W,y:i/S.W|0});}")
    shot('champ')
    print(json.dumps({'erreurs': errs[:6]}))
    b.close()
