import subprocess,sys,json
mode=sys.argv[1] if len(sys.argv)>1 else 'local'
if mode=='inline':
    # moteur 3D intégré à la page : aucune dépendance réseau au lancement
    subprocess.run(['npx','esbuild','ui3.js','--bundle','--format=esm','--minify','--alias:three/addons=./node_modules/three/examples/jsm','--outfile=bundle.js','--log-level=warning'],check=True)
else:
    subprocess.run(['npx','esbuild','ui3.js','--bundle','--format=esm','--external:three','--external:three/addons/*','--outfile=bundle.js','--log-level=warning'],check=True)
im={"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}} if mode=='local' else {"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}
s=open('shell.html').read().replace('<script type="importmap">/*IMPORTMAP*/</script>','') if mode=='inline' else open('shell.html').read().replace('/*IMPORTMAP*/',json.dumps(im))
for k,f in [('CORE','core.js'),('RENDER','render.js'),('STORY','story.js'),('UI','bundle.js')]:
    s=s.replace('/*'+k+'*/',open(f).read().replace('</script>','<\\/script>'))
import base64,glob,os
blobs=''.join(f'<script type="text/plain" id="vdm-{os.path.basename(f)[:-4]}">'+base64.b64encode(open(f,'rb').read()).decode()+'</script>\n' for f in sorted(glob.glob('mq/*.glb')))
blobs+=''.join(f'<script type="text/plain" id="vds-{os.path.basename(f)[:-4]}">'+base64.b64encode(open(f,'rb').read()).decode()+'</script>\n' for f in sorted(glob.glob('snd/*.mp3')))
blobs+=''.join(f'<script type="text/plain" id="vdmu-{os.path.basename(f)[:-4]}">'+base64.b64encode(open(f,'rb').read()).decode()+'</script>\n' for f in sorted(glob.glob('mus/*.mp3')))
blobs+=''.join(f'<script type="text/plain" id="vdtx-{n}">'+base64.b64encode(open(n+'.png','rb').read()).decode()+'</script>\n' for n in ['patlas','satlas','flame'])
blobs+=''.join(f'<script type="text/plain" id="vdtx-{os.path.basename(f)[:-4]}">'+base64.b64encode(open(f,'rb').read()).decode()+'</script>\n' for f in sorted(glob.glob('tex/*.jpg')))
s=s.replace('</body>',blobs+'</body>') if '</body>' in s else s+blobs
out='index_local.html' if mode=='local' else 'valdragon3d.html'
open(out,'w').write(s);print(out,len(s))
