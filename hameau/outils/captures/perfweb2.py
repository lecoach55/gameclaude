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
    pg.add_init_script("localStorage.setItem('hameau3d_save_v3',"+json.dumps(save)+");localStorage.setItem('hameau_q','haute')")
    pg.goto('file://'+os.environ.get('JEU','/home/claude/hameau3d.html'));pg.wait_for_timeout(2000);pg.click('#bStart',timeout=150000)
    pg.evaluate("()=>{const c=window.__cam;c.x=30;c.z=29;c.dist=22}");pg.wait_for_timeout(5000)
    r=pg.evaluate("""()=>new Promise(res=>{let n=0,t0=performance.now();const f=()=>{n++;if(performance.now()-t0<8000)requestAnimationFrame(f);else{
      const info=__renderer.info;let inst=0,tri=0,meshes=0;__scene.traverse(o=>{if(o.isInstancedMesh){meshes++;inst+=o.count;const g=o.geometry;const vc=g.index?g.index.count:g.attributes.position.count;tri+=o.count*vc/3;}});
      const a=window.__natMs||[];const top=[];__scene.traverse(o=>{if(o.isInstancedMesh&&o.count){const g=o.geometry;const vc=g.index?g.index.count:g.attributes.position.count;top.push([o.count,Math.round(vc/3),Math.round(o.count*vc/3),o.material.type+(o.material.vertexColors?'vc':'')]);}});top.sort((a,b)=>b[2]-a[2]);res({top:top.slice(0,12),fps:n/8,calls:info.render.calls,triFrame:info.render.triangles,instMeshes:meshes,instances:inst,instTris:Math.round(tri),natMs:a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):-1,natMax:a.length?Math.round(Math.max(...a)):-1});}};requestAnimationFrame(f);})""")
    print(json.dumps(r));b.close()
