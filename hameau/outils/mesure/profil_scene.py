"""Profil processeur (JS) du passage à une scène du banc : quelles fonctions coûtent lors du changement nuit/hiver.
Usage : JEU=... python3 profil_scene.py 'hiver' [ms]  -> top 25 des fonctions (temps propre, ms)
Fenêtre minuscule (160×320) pour que le rendu logiciel ne masque pas le coût JS."""
import os,sys,json,collections
from playwright.sync_api import sync_playwright
D=os.path.dirname(os.path.abspath(__file__))
save=open(os.environ.get('SAVE',os.path.join(D,'../../jeu/test_save.json'))).read()
BASE='https://cdn.jsdelivr.net/npm/three@0.160.0/'
def route(r):r.fulfill(path=os.environ.get('THREE','/home/claude/deps/node_modules/three')+'/'+r.request.url[len(BASE):],content_type='application/javascript')
SC={'village jour':(30,29,22,874,0),'village nuit':(30,29,22,893,0),'hiver':(30,29,22,300,0),'vue large':(28,28,60,874,0),'gros plan':(33,26,8,874,0),'pluie':(30,29,18,874,1),'lac':(37,21,11,874,0)}
nom=sys.argv[1];ms=int(sys.argv[2]) if len(sys.argv)>2 else 5000
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':160,'height':320},device_scale_factor=1);pg.route(BASE+'**',route)
    pg.add_init_script("localStorage.setItem('hameau3d_save_v3',"+json.dumps(save)+");localStorage.setItem('hameau_q','"+os.environ.get('Q','haute')+"');localStorage.setItem('hameau_tuto','1')")
    pg.goto('file://'+os.environ.get('JEU','/home/claude/hameau3d.html'));pg.wait_for_timeout(2000);pg.click('#bStart',timeout=150000);pg.wait_for_timeout(5000)
    pg.evaluate("([x,z,d,t,r])=>{const c=__cam;c.x=x;c.z=z;c.dist=d;__S.time=t-30;}",list(SC['village jour']));pg.wait_for_timeout(3000)
    cdp=pg.context.new_cdp_session(pg);cdp.send('Profiler.enable');cdp.send('Profiler.setSamplingInterval',{'interval':200});cdp.send('Profiler.start')
    pg.evaluate("([x,z,d,t,r])=>{const c=__cam;c.x=x;c.z=z;c.dist=d;c.pitch=0.92;__S.time=t;window.__rain=r;}",list(SC[nom]));pg.wait_for_timeout(ms)
    prof=cdp.send('Profiler.stop')['profile'];b.close()
nodes={n['id']:n for n in prof['nodes']};self=collections.Counter()
dt=prof['timeDeltas'];
for s,d in zip(prof['samples'],dt):
    n=nodes[s];cf=n['callFrame'];self[(cf['functionName'] or '(anon)')+':'+str(cf['lineNumber'])]+=d/1000
tot=sum(self.values())
print('total %.0f ms'%tot)
for k,v in self.most_common(25):print('%7.0f  %s'%(v,k))
