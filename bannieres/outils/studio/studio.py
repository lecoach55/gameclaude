# Pré-calcule les créatures 3D en images (à lancer depuis le dossier préparé de Valdragon, par défaut /home/claude/t3d).
# python3 studio.py sortie_dir [ids séparés par des virgules]
import asyncio,sys,os,base64,json,glob,shutil,subprocess
from playwright.async_api import async_playwright
T3D=os.environ.get('T3D','/home/claude/t3d');ICI=os.path.dirname(os.path.abspath(__file__))
OUT=sys.argv[1];IDS=sys.argv[2].split(',') if len(sys.argv)>2 else None
# animations : (nom, clé Valdragon, instants 0..1 dans le clip)
ANIM=[('idle','idle',[0,.25,.5,.75]),('atk','atk',[.2,.4,.55,.75]),('hit','hit',[.3,.6]),('die','die',[.35,.7,1.0])]
TAILLE={'dragonvert':(288,224,3.3),'dragonos':(288,224,3.3),'wyverne':(224,176,2.6)}
def page():
    shutil.copy(os.path.join(ICI,'studio.js'),os.path.join(T3D,'bs_studio.js'));shutil.copy(os.path.join(ICI,'quad.js'),os.path.join(T3D,'bs_quad.js'))
    im={"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}
    blobs=''.join(f'<script type="text/plain" id="vdtx-{os.path.basename(f)[:-4]}">'+base64.b64encode(open(f,'rb').read()).decode()+'</script>\n' for f in sorted(glob.glob(T3D+'/tex/*.jpg')))
    blobs+=''.join(f'<script type="text/plain" id="vdtx-{n}">'+base64.b64encode(open(f'{T3D}/{n}.png','rb').read()).decode()+'</script>\n' for n in ['patlas','satlas','flame'])
    open(os.path.join(T3D,'bs_studio.html'),'w').write(f'<!DOCTYPE html><html><body style="margin:0;background:transparent"><script type="importmap">{json.dumps(im)}</script>{blobs}<script type="module" src="bs_studio.js"></script></body></html>')
async def main():
    page();subprocess.run(['sh',os.path.join(T3D,'srv.sh')])
    os.makedirs(OUT,exist_ok=True)
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':400,'height':400});err=[];pg.on('pageerror',lambda e:err.append(str(e)[:300]));pg.on('console',lambda m:err.append('c:'+m.text[:200]) if m.type=='error' else None)
        await pg.goto('http://localhost:8765/bs_studio.html',timeout=120000)
        info=await pg.evaluate("()=>new Promise(r=>{const f=()=>window.studioPret?window.studioPret.then(r):setTimeout(f,100);f();})")
        print('studio',info,err[:3])
        if os.environ.get('MESURE'):
            for cid in IDS or info['ids']:print(cid,await pg.evaluate("(id)=>mesurer(id)",cid))
            await b.close();return
        for cid in IDS or info['ids']:
            fw,fh,u=info['q'][cid] if cid in info['q'] else TAILLE.get(cid,(168,168,2.35))
            an=[a for a in ANIM]
            fr=await pg.evaluate("([id,o])=>rendreCreature(id,o)",[cid,{'fw':fw,'fh':fh,'u':u,'anims':an}])
            for nom,l in fr.items():
                for i,d in enumerate(l):open(f'{OUT}/{cid}_{nom}{i}.png','wb').write(base64.b64decode(d.split(',')[1]))
            print(cid,'ok',sum(len(l) for l in fr.values()),'images',err[-2:] if err else '')
        await b.close()
if __name__=="__main__":asyncio.run(main())
