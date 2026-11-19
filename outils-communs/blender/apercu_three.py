"""Aperçu de modèles GLB tels que Three.js r160 (le moteur des jeux) les affiche, côte à côte, même caméra et même lumière.
Sert à voir ce que change cuire_ao.py (ou une décimation) DANS le moteur du jeu, pas dans Blender.

  python3 outils-communs/blender/apercu_three.py a.glb [b.glb …] planche.png [--taille 480] [--angle 35]

Rend sur la sortie standard, pour chaque modèle : maillages, triangles, couleurs de sommets utilisées (vertexColors),
luminance moyenne de la silhouette. Chromium sans écran (SwiftShader) ; Three.js servi en local par routes.py.
Code 1 si un modèle ne se charge pas.
"""
import base64
import io
import json
import os
import sys
import tempfile

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(ICI))
from routes import brancher_sync  # noqa: E402

PAGE = r'''<!DOCTYPE html><html><body style="margin:0;background:#556644">
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
"three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
window.rendre = async (b64, T, ang) => {
  const r = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true}); r.setSize(T, T);
  r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.setClearColor(0x556644, 1);
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xfff2dc, 0x3a2c20, 1.1));
  const k = new THREE.DirectionalLight(0xffe6c8, 2.6); k.position.set(-3, 5, 4); sc.add(k);
  const c = new THREE.DirectionalLight(0x9ab8ff, 1.6); c.position.set(3, 3, -4); sc.add(c);
  const bin = Uint8Array.from(atob(b64), x => x.charCodeAt(0)).buffer;
  const L = new GLTFLoader();
  const d = new DRACOLoader(); d.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/'); L.setDRACOLoader(d);
  const g = await L.parseAsync(bin, '');
  const o = g.scene; sc.add(o);
  const bb = new THREE.Box3().setFromObject(o), ce = bb.getCenter(new THREE.Vector3()), di = bb.getSize(new THREE.Vector3());
  const R = Math.max(di.x, di.y, di.z);
  const cam = new THREE.PerspectiveCamera(30, 1, R / 100, R * 20);
  const a = ang * Math.PI / 180;
  cam.position.set(ce.x + R * 2.7 * Math.sin(.5), ce.y + R * 2.7 * Math.sin(a), ce.z + R * 2.7 * Math.cos(.5) * Math.cos(a));
  cam.lookAt(ce);
  let n = 0, tri = 0, vc = 0;
  o.traverse(m => { if (!m.isMesh) return; n++; const gm = m.geometry;
    tri += (gm.index ? gm.index.count : gm.attributes.position.count) / 3;
    [].concat(m.material).forEach(x => { if (x.vertexColors && gm.attributes.color) vc++; }); });
  r.render(sc, cam);
  const url = r.domElement.toDataURL('image/png'); r.dispose();
  return {url, maillages: n, triangles: Math.round(tri), vertexColors: vc};
};
window.pret = true;
</script></body></html>'''


def main(argv):
    if '-h' in argv or '--help' in argv or len([a for a in argv if not a.startswith('--')]) < 2:
        print(__doc__); return 0 if ('-h' in argv or '--help' in argv) else 2
    taille, ang = 480, 35.0
    pos = []
    i = 0
    while i < len(argv):
        if argv[i] in ('--taille', '--angle'):
            try:
                v = float(argv[i + 1])
            except (IndexError, ValueError):
                print(f'{argv[i]} attend un nombre'); return 2
            if argv[i] == '--taille':
                taille = int(v)
            else:
                ang = v
            i += 2; continue
        pos.append(argv[i]); i += 1
    modeles, sortie = pos[:-1], pos[-1]
    for m in modeles:
        if not os.path.isfile(m):
            print('introuvable :', m); return 2
        if not m.lower().endswith('.glb'):
            print('seuls les .glb (un seul fichier) sont pris :', m, '— passer un .gltf par cuire_ao.py --force 0'); return 2
    from PIL import Image, ImageChops, ImageDraw, ImageStat
    from playwright.sync_api import sync_playwright
    images, code = [], 0
    with tempfile.TemporaryDirectory() as tmp, sync_playwright() as p:
        page_f = os.path.join(tmp, 'apercu.html'); open(page_f, 'w').write(PAGE)
        b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        try:
            pg = b.new_page(viewport={'width': taille, 'height': taille})
            err = []
            pg.on('pageerror', lambda e: err.append(str(e)[:200]))
            brancher_sync(pg)
            pg.goto('file://' + page_f)
            pg.wait_for_function('window.pret === true', timeout=60000)
            for m in modeles:
                try:
                    r = pg.evaluate('([b, t, a]) => rendre(b, t, a)', [base64.b64encode(open(m, 'rb').read()).decode(), taille, ang])
                except Exception as e:   # noqa: BLE001 — un modèle illisible ne doit pas arrêter les autres
                    print(f'✗ {m} : {str(e)[:200]}'); code = 1; continue
                im = Image.open(io.BytesIO(base64.b64decode(r['url'].split(',', 1)[1]))).convert('RGB')
                fond = Image.new('RGB', im.size, (0x55, 0x66, 0x44))
                masque = Image.eval(ImageChops.difference(im, fond).convert('L'), lambda v: 255 if v > 6 else 0)
                lum = ImageStat.Stat(im.convert('L'), masque).mean[0] if masque.getbbox() else None
                print(f"{os.path.basename(m):32s} maillages {r['maillages']:3d}  triangles {r['triangles']:7d}  "
                      f"couleurs de sommets {'oui' if r['vertexColors'] else 'non'}  luminance {lum and round(lum, 1)}")
                d = ImageDraw.Draw(im); d.text((6, 6), os.path.basename(m), fill=(255, 255, 255))
                images.append(im)
            if err:
                print('erreurs JS :', err[:3]); code = 1
        finally:
            b.close()
    if images:
        pl = Image.new('RGB', (taille * len(images), taille))
        for k, im in enumerate(images):
            pl.paste(im, (k * taille, 0))
        os.makedirs(os.path.dirname(os.path.abspath(sortie)), exist_ok=True)
        pl.save(sortie); print('planche :', sortie)
    return code if images else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
