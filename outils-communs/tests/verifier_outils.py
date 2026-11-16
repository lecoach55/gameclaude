#!/usr/bin/env python3
"""Contrôle des outils communs : à lancer avant de pousser une modification d'outil.
usage : python3 outils-communs/tests/verifier_outils.py [--reseau]
Chaque contrôle est rapide (quelques secondes) et dit OK / ÉCHEC avec la raison. Code de sortie 1 si un contrôle échoue.
--reseau ajoute les contrôles qui appellent Poly Haven (phget, catalogue)."""
import os, sys, subprocess, tempfile, time, json, shutil, importlib.util

RAC = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OC = os.path.join(RAC, 'outils-communs')
RES = []


def controle(nom):
    def deco(f):
        t0 = time.time()
        try:
            f(); RES.append((nom, True, '', time.time() - t0))
        except Exception as e:
            RES.append((nom, False, str(e)[:300], time.time() - t0))
        return f
    return deco


def run(*cmd, attendu=0, cwd=RAC, timeout=120):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout)
    if r.returncode != attendu:
        raise RuntimeError(f"{' '.join(cmd)} → code {r.returncode} : {(r.stderr or r.stdout)[-300:]}")
    return r.stdout


@controle('testkit.js : syntaxe (module et copie classique sans export)')
def _():
    if not shutil.which('node'):
        raise RuntimeError('node absent')
    src = open(os.path.join(OC, 'testkit.js'), encoding='utf-8').read()
    with tempfile.TemporaryDirectory() as d:
        m = os.path.join(d, 'tk.mjs'); open(m, 'w').write(src); run('node', '--check', m)
        c = os.path.join(d, 'tk.js'); open(c, 'w').write('\n'.join(l[7:] if l.startswith('export ') else l for l in src.split('\n'))); run('node', '--check', c)


@controle('sauvegarde-en-ligne.js : syntaxe')
def _():
    with tempfile.TemporaryDirectory() as d:
        m = os.path.join(d, 's.mjs'); shutil.copy(os.path.join(OC, 'sauvegarde-en-ligne.js'), m); run('node', '--check', m)


@controle('compare.py : images identiques → aucune alerte, image changée → alerte')
def _():
    from PIL import Image, ImageDraw
    with tempfile.TemporaryDirectory() as d:
        a, b, c = (os.path.join(d, x) for x in 'abc'); [os.makedirs(x) for x in (a, b, c)]
        im = Image.new('RGB', (390, 780), (40, 60, 80)); ImageDraw.Draw(im).ellipse((100, 200, 300, 500), fill=(200, 160, 60))
        im.save(os.path.join(a, 'vue.png')); im.save(os.path.join(b, 'vue.png'))
        im2 = im.copy(); ImageDraw.Draw(im2).rectangle((0, 150, 390, 650), fill=(220, 30, 30)); im2.save(os.path.join(c, 'vue.png'))
        o1 = run(sys.executable, os.path.join(OC, 'compare.py'), a, b, os.path.join(d, 'p1.png'), attendu=None) if False else None
        r1 = subprocess.run([sys.executable, os.path.join(OC, 'compare.py'), a, b, os.path.join(d, 'p1.png')], capture_output=True, text=True)
        r2 = subprocess.run([sys.executable, os.path.join(OC, 'compare.py'), a, c, os.path.join(d, 'p2.png')], capture_output=True, text=True)
        if not os.path.exists(os.path.join(d, 'p1.png')) or not os.path.exists(os.path.join(d, 'p2.png')):
            raise RuntimeError('planche non produite : ' + (r1.stderr or r2.stderr)[-200:])
        if (r1.stdout + r1.stderr) == (r2.stdout + r2.stderr):
            raise RuntimeError('même sortie pour des images identiques et des images différentes')


@controle('atelier.py : import et fonctions attendues')
def _():
    spec = importlib.util.spec_from_file_location('atelier', os.path.join(OC, 'atelier.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    for f in ('serveur', 'navigateur', 'page', 'mesurer', 'capturer', 'figer_page', 'avancer', 'attendre'):
        if not hasattr(m, f):
            raise RuntimeError('fonction manquante : ' + f)


@controle('compare.py : --json et --strict (code 1 si alerte ou image manquante, 0 sinon)')
def _():
    from PIL import Image, ImageDraw
    with tempfile.TemporaryDirectory() as d:
        a, b, c = (os.path.join(d, x) for x in 'abc'); [os.makedirs(x) for x in (a, b, c)]
        im = Image.new('RGB', (390, 780), (40, 60, 80)); ImageDraw.Draw(im).ellipse((100, 200, 300, 500), fill=(200, 160, 60))
        for x in (a, b):
            im.save(os.path.join(x, 'vue.png')); im.save(os.path.join(x, 'autre.png'))
        im2 = im.copy(); ImageDraw.Draw(im2).rectangle((0, 150, 390, 650), fill=(220, 30, 30)); im2.save(os.path.join(c, 'vue.png'))
        cmp = os.path.join(OC, 'compare.py'); j = os.path.join(d, 'r.json'); pl = os.path.join(d, 'p.png')
        run(sys.executable, cmp, a, b, pl, '--json', j, '--strict')
        r = json.load(open(j))
        if r['alertes'] != 0 or r['total'] != 2 or r['manquantes']:
            raise RuntimeError('identiques : ' + json.dumps(r)[:200])
        run(sys.executable, cmp, a, c, pl, '--json', j, '--strict', attendu=1)
        r = json.load(open(j))
        if r['alertes'] != 1 or r['manquantes'] != ['autre'] or not r['scenes'][0]['alerte']:
            raise RuntimeError('changées : ' + json.dumps(r)[:200])
        run(sys.executable, cmp, a, c, pl)  # sans --strict : code 0 comme avant


HORLOGE_JEU = """<body style=margin:0><canvas id=c width=200 height=200></canvas><script>
const g=c.getContext('2d'),R=[...Array(30)].map(()=>[Math.random()*200,Math.random()*200]);let ang=0,last=performance.now();
(function f(t){const dt=t-last;last=t;ang+=dt*.002;g.fillStyle='#123';g.fillRect(0,0,200,200);g.fillStyle='#fc3';
for(const[x,y]of R){g.beginPath();g.arc(x+30*Math.cos(ang+x),y+30*Math.sin(ang+y),5,0,7);g.fill()}
g.fillText(new Date().toISOString(),5,190);requestAnimationFrame(f)})(last)</script>"""


@controle("horloge.js : captures identiques (figer + avancer), graine, erreurs remontées, attendre, Date()")
def _():
    code = r'''
import asyncio,sys,os,tempfile,hashlib
sys.path.insert(0,sys.argv[1])
from atelier import serveur,navigateur,page,avancer,capturer,attendre
from playwright.async_api import async_playwright
d=tempfile.mkdtemp();open(os.path.join(d,'index.html'),'w').write(sys.argv[2])
async def m():
    serveur(d,8798);h=[]
    async with async_playwright() as p:
        nav=await navigateur(p)
        for i,g in enumerate((7,7,8)):
            pg=await page(nav,'http://localhost:8798/index.html',200,200,figer=g);await pg.wait_for_timeout(200+600*i)
            r=await avancer(pg,40);f=os.path.join(d,f'{i}.png');await capturer(pg,f);h.append(hashlib.md5(open(f,'rb').read()).hexdigest());await pg.close()
        pg=await page(nav,'http://localhost:8798/index.html',200,200,figer=1)
        await pg.evaluate("window.k=0;requestAnimationFrame(function f(){k++;requestAnimationFrame(f);if(k===3)throw new Error('boum')})")
        await attendre(pg,'k>=12',delai=20);await pg.wait_for_timeout(100)
        dt=await pg.evaluate("typeof Date()==='string' && new Date() instanceof Date && Date.UTC(2020,0)>0")
        print('IMAGES',r['images'],'IDENTIQUES',h[0]==h[1],'GRAINE',h[0]!=h[2],'ERREUR',any('boum' in e for e in pg.erreurs),'DATE',dt);await nav.close()
asyncio.run(m())
'''
    out = run(sys.executable, '-c', code, OC, HORLOGE_JEU, timeout=90)
    if 'IMAGES 40 IDENTIQUES True GRAINE True ERREUR True DATE True' not in out:
        raise RuntimeError('captures non reproductibles : ' + out[-200:])


@controle('atelier.py : serveur local + page Playwright + mesure (jeu factice)')
def _():
    try:
        import playwright  # noqa
    except ImportError:
        raise RuntimeError('playwright absent (pip install playwright --break-system-packages && playwright install chromium)')
    code = r'''
import asyncio,sys,os,tempfile
sys.path.insert(0,sys.argv[1])
from atelier import serveur,navigateur,page,mesurer
from playwright.async_api import async_playwright
d=tempfile.mkdtemp();open(os.path.join(d,'index.html'),'w').write('<canvas id=c></canvas><script>let n=0;(function f(){n++;requestAnimationFrame(f)})()</script>')
async def m():
    serveur(d,8799)
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,'http://localhost:8799/index.html')
        r=await mesurer(pg,1500);print('MESURE',r);await nav.close()
asyncio.run(m())
'''
    out = run(sys.executable, '-c', code, OC, timeout=90)
    if 'MESURE' not in out:
        raise RuntimeError('pas de mesure : ' + out[-200:])


@controle('bureau.py : état, json, page')
def _():
    run(sys.executable, 'bureau/outils/bureau.py')
    e = json.loads(run(sys.executable, 'bureau/outils/bureau.py', 'json'))
    if len(e['jeux']) < 5:
        raise RuntimeError('trop peu de jeux détectés')
    run(sys.executable, 'bureau/outils/bureau.py', 'page')


if '--reseau' in sys.argv:
    @controle('phget.py : liste de fichiers Poly Haven')
    def _():
        spec = importlib.util.spec_from_file_location('phget', os.path.join(OC, 'phget.py'))
        m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
        if 'Diffuse' not in json.dumps(m.files('rock_wall')):
            raise RuntimeError('réponse inattendue')

ok = sum(1 for r in RES if r[1])
for nom, bon, err, d in RES:
    print(f"{'OK    ' if bon else 'ÉCHEC '} {nom} ({d:.1f} s){'' if bon else ' — ' + err}")
print(f'\n{ok}/{len(RES)} contrôles réussis')
sys.exit(0 if ok == len(RES) else 1)
