#!/usr/bin/env python3
"""Construit le donjon 3D au tour par tour du Trône de Braise (moteur repris de Valdragon).
Code : donjon3d/src (copie adaptée de valdragon/jeu) ; modèles, textures et bruitages : valdragon/jeu (non dupliqués).
Sortie : trone-de-braise/build/donjon3d.html (une page autonome, moteur Three.js intégré, sans musique enregistrée).
Préalable : node_modules (three + esbuild) dans src, par ex. lien vers /home/claude/t3d/node_modules
(sh valdragon/outils/preparer.sh /home/claude/t3d)."""
import subprocess, base64, glob, os, sys
ICI = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(ICI, 'src'); VJ = os.path.join(ICI, '../../valdragon/jeu')
OUT = os.path.join(ICI, '../build/donjon3d.html')
os.chdir(SRC)
subprocess.run(['npx', 'esbuild', 'ui3.js', '--bundle', '--format=esm', '--minify', '--alias:three/addons=./node_modules/three/examples/jsm', '--outfile=/tmp/d3bundle.js', '--log-level=warning'], check=True)
s = open('shell.html').read().replace('<script type="importmap">/*IMPORTMAP*/</script>', '')
s = s.replace('<title>Valdragon — Les Héritiers du Puits</title>', '<title>Le Trône de Braise — profondeurs</title>')
for k, f in [('CORE', 'core.js'), ('RENDER', 'render.js'), ('STORY', 'story.js'), ('UI', '/tmp/d3bundle.js')]:
    s = s.replace('/*' + k + '*/', open(f).read().replace('</script>', '<\\/script>'))
b64 = lambda p: base64.b64encode(open(p, 'rb').read()).decode()
blobs = ''.join(f'<script type="text/plain" id="vdm-{os.path.basename(f)[:-4]}">{b64(f)}</script>\n' for f in sorted(glob.glob(VJ + '/mq/*.glb')))
blobs += ''.join(f'<script type="text/plain" id="vds-{os.path.basename(f)[:-4]}">{b64(f)}</script>\n' for f in sorted(glob.glob(VJ + '/snd/*.mp3')))
blobs += ''.join(f'<script type="text/plain" id="vdtx-{n}">{b64(VJ + "/" + n + ".png")}</script>\n' for n in ['patlas', 'satlas', 'flame'])
blobs += ''.join(f'<script type="text/plain" id="vdtx-{os.path.basename(f)[:-4]}">{b64(f)}</script>\n' for f in sorted(glob.glob(VJ + '/tex/*.jpg')))
s = s.replace('</body>', blobs + '</body>') if '</body>' in s else s + blobs
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w').write(s); print(OUT, round(len(s) / 1048576, 2), 'Mio')
