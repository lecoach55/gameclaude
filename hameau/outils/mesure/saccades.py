"""Saccades par scène : programmes (shaders) compilés, image la plus lente, img/s.
Usage : JEU=/home/claude/hameau3d.html python3 saccades.py [sortie.json]
Reprend les 7 scènes du banc du mode test (village jour/nuit, hiver, vue large, gros plan, pluie, lac)
et les enchaîne DANS LE MÊME ORDRE que sur l'appareil de Victor (chaque changement de lumière/saison est compté).
"""
import os,sys,json
from playwright.sync_api import sync_playwright
D=os.path.dirname(os.path.abspath(__file__))
save=open(os.environ.get('SAVE',os.path.join(D,'../../jeu/test_save.json'))).read()
BASE='https://cdn.jsdelivr.net/npm/three@0.160.0/'
def route(r):r.fulfill(path=os.environ.get('THREE','/home/claude/deps/node_modules/three')+'/'+r.request.url[len(BASE):],content_type='application/javascript')
SC=[('village jour',30,29,22,874,0),('village nuit',30,29,22,893,0),('hiver',30,29,22,300,0),('vue large',28,28,60,874,0),('gros plan',33,26,8,874,0),('pluie',30,29,18,874,1),('lac (reflets)',37,21,11,874,0)]
Q=os.environ.get('Q','haute')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':int(os.environ.get('LARG',390)),'height':int(os.environ.get('HAUT',780))},device_scale_factor=1)
    pg.route(BASE+'**',route)
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('hameau3d_save_v3',"+json.dumps(save)+");localStorage.setItem('hameau_q','"+Q+"');localStorage.setItem('hameau_tuto','1')")
    pg.goto('file://'+os.environ.get('JEU','/home/claude/hameau3d.html'));pg.wait_for_timeout(2000);pg.click('#bStart',timeout=150000)
    pg.wait_for_timeout(4000)
    pg.evaluate("""()=>{window.__ft=[];let l=performance.now();const f=t=>{window.__ft.push(t-l);l=t;requestAnimationFrame(f);};requestAnimationFrame(f);
      const S=window.__S;window.__pause=()=>{};}""")
    out=[]
    for nom,x,z,d,t,rain in SC:
        r=pg.evaluate("""([x,z,d,t,rain])=>new Promise(res=>{const R=__renderer,p0=R.info.programs.length,c0=performance.now();window.__ft=[];
          const c=__cam;c.x=x;c.z=z;c.dist=d;c.pitch=0.92;__S.time=t;window.__rain=rain;
          setTimeout(()=>{const a=window.__ft.slice(),pr=R.info.programs.length;const pre=a.slice(0,Math.max(1,a.length>>2));const s=a.slice(a.length>>1);const m=s.reduce((u,v)=>u+v,0)/s.length;
            res({programmes:pr-p0,total:pr,pire_ms:Math.round(Math.max(...a)),img_s:+(1000/m).toFixed(1),appels:R.info.render.calls,tri:R.info.render.triangles});},6000);})""",[x,z,d,t,rain])
        r['scene']=nom;out.append(r);print(json.dumps(r,ensure_ascii=False),flush=True)
    print('erreurs',errs[:3])
    if len(sys.argv)>1:json.dump(out,open(sys.argv[1],'w'),ensure_ascii=False,indent=1)
    b.close()
