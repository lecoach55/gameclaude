import asyncio,sys,os,base64,json,glob,shutil,subprocess
sys.path.insert(0,'/home/claude/gameclaude/bannieres/outils/studio')
os.environ.setdefault('T3D','/home/claude/t3d')
import studio as S
from playwright.async_api import async_playwright
IDS=sys.argv[1].split(','); OUT=sys.argv[2]
EXTRA=r'''
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
W.exporterCreature=async(id,pn,t)=>{await ready;if(!renderer)init(64,64);const Qd=QDEFS[id];const R=Qd?Qd.c():fabriquer(id);scene.add(R.root);
 if(Qd)R.poser(pn,t);else pose(R,pn,t);R.root.updateMatrixWorld(true);
 // fige la pose : convertit les maillages animés en maillages statiques
 const g=new THREE.Group();const v=new THREE.Vector3();
 R.root.traverse(m=>{if(!m.isMesh)return;let geo=m.geometry.clone();
   if(m.isSkinnedMesh){const p=geo.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(m.geometry.attributes.position,i);m.applyBoneTransform(i,v);v.applyMatrix4(m.matrixWorld);p.setXYZ(i,v.x,v.y,v.z);}geo.deleteAttribute('skinIndex');geo.deleteAttribute('skinWeight');geo.computeVertexNormals();
     const mm=new THREE.Mesh(geo,m.material);g.add(mm);}
   else{geo.applyMatrix4(m.matrixWorld);const mm=new THREE.Mesh(geo,m.material);g.add(mm);}});
 scene.remove(R.root);
 const ex=new GLTFExporter();const buf=await ex.parseAsync(g,{binary:true});
 let s='';const b=new Uint8Array(buf);for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(s);};
'''
async def main():
    S.page()
    js=open('/home/claude/t3d/bs_studio.js').read()
    if 'exporterCreature' not in js: open('/home/claude/t3d/bs_studio.js','w').write(js+EXTRA)
    subprocess.run(['sh','/home/claude/t3d/srv.sh'])
    os.makedirs(OUT,exist_ok=True)
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':400,'height':400});err=[];pg.on('pageerror',lambda e:err.append(str(e)[:300]))
        await pg.goto('http://localhost:8765/bs_studio.html',timeout=120000)
        info=await pg.evaluate("()=>new Promise(r=>{const f=()=>window.studioPret?window.studioPret.then(r):setTimeout(f,100);f();})")
        print('ids',info['ids'],err[:3])
        for cid in IDS:
            d=await pg.evaluate("([id])=>exporterCreature(id,'idle',0)",[cid])
            open(f'{OUT}/{cid}.glb','wb').write(base64.b64decode(d)); print(cid,os.path.getsize(f'{OUT}/{cid}.glb'))
        await b.close()
asyncio.run(main())
