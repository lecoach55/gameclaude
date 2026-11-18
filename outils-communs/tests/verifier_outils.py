#!/usr/bin/env python3
"""Contrôle des outils communs : à lancer avant de pousser une modification d'outil.
usage : python3 outils-communs/tests/verifier_outils.py [--reseau]
Chaque contrôle est rapide (quelques secondes) et dit OK / ÉCHEC avec la raison. Code de sortie 1 si un contrôle échoue.
--reseau ajoute les contrôles qui appellent Poly Haven (phget, catalogue)."""
import os, re, sys, subprocess, tempfile, time, json, shutil, importlib.util

RAC = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# verrou du banc propre au vérificateur : un vrai banc en cours (15 min sur Hameau) ne le bloque pas, et il ne bloque pas ce banc
os.environ['BANC_VERROU'] = os.path.join(tempfile.gettempdir(), f'banc-verificateur-{os.getpid()}.verrou')
# un vrai robot d'un jeu qui tourne à côté (hors verrou) ne doit pas faire attendre les bancs du vérificateur (contrôle dédié plus bas)
os.environ.setdefault('VERROU_NAVIGATEURS', '0')
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


@controle('testkit.js : aucun lien de téléchargement direct (inopérant dans le visualiseur ; passer par claude.use("downloads"))')
def _():
    src = open(os.path.join(OC, 'testkit.js'), encoding='utf-8').read()
    for motif in ('.download=', '.download =', 'createObjectURL', 'showSaveFilePicker'):
        if motif in src:
            raise RuntimeError(f'motif interdit dans testkit.js : {motif}')


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
    for f in ('serveur', 'navigateur', 'page', 'mesurer', 'capturer', 'figer_page', 'avancer', 'attendre', 'cliquer', 'debordements'):
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
    b0=serveur(d,18798);h=[]
    async with async_playwright() as p:
        nav=await navigateur(p)
        for i,g in enumerate((7,7,8)):
            pg=await page(nav,b0+'index.html',200,200,figer=g);await pg.wait_for_timeout(200+600*i)
            r=await avancer(pg,40);f=os.path.join(d,f'{i}.png');await capturer(pg,f);h.append(hashlib.md5(open(f,'rb').read()).hexdigest());await pg.close()
        pg=await page(nav,b0+'index.html',200,200,figer=1)
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
    b0=serveur(d,18799)
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,b0+'index.html')
        r=await mesurer(pg,1500);print('MESURE',r);await nav.close()
asyncio.run(m())
'''
    out = run(sys.executable, '-c', code, OC, timeout=90)
    if 'MESURE' not in out:
        raise RuntimeError('pas de mesure : ' + out[-200:])


SONDE_JEU = """<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width"><body style="margin:0;overflow-x:hidden;font:14px sans-serif">
<aside id=aside style="overflow:auto;max-height:200px"><div id=fiche style="min-width:480px">Fiche trop large</div></aside>
<div class=tw style="overflow-x:auto"><table style="width:900px"><tr><td>tableau large voulu</td></tr></table></div>
<div class=tabs style="display:flex;overflow-x:auto">""" + ''.join(f'<button style="flex:none;width:90px">Onglet {i}</button>' for i in range(8)) + """</div>
<div id=tape style="overflow:hidden;white-space:nowrap"><span style="display:inline-block;animation:d 9s linear infinite">""" + 'AAPL 215 +1 % ' * 400 + """</span></div>
<style>@keyframes d{to{transform:translateX(-50%)}}</style>
<div id=nom style="width:120px;overflow:hidden;white-space:nowrap">Un nom beaucoup trop long pour sa case</div>
<div id=coupe-ok style="width:120px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">Un nom tronqué avec des points</div>
<div id=pied style="position:relative;left:300px;width:200px">Bouton à moitié hors écran</div>
<nav id=tiroir style="position:fixed;top:0;left:100%;width:250px">Menu fermé</nav>
<div id=case style="width:80px;overflow:hidden;white-space:nowrap">Monseigneur Bartholomé de Montfort-l'Amaury, comte palatin</div>
<div class=card style="width:200px;overflow:hidden;position:relative">Carte<i style="position:absolute;left:150px;width:120px;height:8px;background:gold"></i></div>
<svg width=120 height=40><g onclick="window.svg=1"><rect width=120 height=40 fill=#357 /><text x=10 y=25>Jouer sur la carte</text></g></svg>
<button id=pd>Pointeur</button><script>pd.addEventListener('pointerdown',()=>window.pdown=1)</script>
<button id=cache onclick="window.cache=1">Sous le voile</button><div id=voile style="position:fixed;inset:0;background:#0003"></div>
<script>setTimeout(()=>{const b=document.createElement('button');b.textContent='Naître';b.onclick=()=>window.ne=(window.ne||0)+1;document.body.prepend(b)},700);
setTimeout(()=>document.getElementById('voile').remove(),1500)</script>"""


@controle('sonde : débordements (bloc, coupé, bord vus ; tableau, onglets, bandeau, tiroir, « … » ignorés) et cliquer robuste (sync, async, figé)')
def _():
    code = r"""
import asyncio,sys,os,tempfile,re,time
sys.path.insert(0,sys.argv[1])
from sonde import cliquer,debordements,SONDE
from atelier import serveur,navigateur,page
from playwright.sync_api import sync_playwright
from playwright.async_api import async_playwright
d=tempfile.mkdtemp();open(os.path.join(d,'index.html'),'w',encoding='utf-8').write(sys.argv[2]);u='file://'+os.path.join(d,'index.html')
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':360,'height':780})
    pg.goto(u);pg.wait_for_timeout(300)
    deb=debordements(pg);print('DEB',sorted((x['genre'],x['sel'].split('>')[-1]) for x in deb))
    print('IGN',len(debordements(pg,ignorer=['#aside','#nom','#pied','#case'])))
    try:cliquer(pg,'Introuvable',delai=0.5);print('ABSENT non')
    except TimeoutError as e:print('ABSENT',('Onglet 3' in str(e)))
    print('CLIC',cliquer(pg,'naître'),pg.evaluate('window.ne'))
    print('VOILE',cliquer(pg,re.compile('^Sous le'),delai=5),pg.evaluate('window.cache'))
    print('SVG',cliquer(pg,'Jouer sur la carte',sel='g'),pg.evaluate('window.svg'))
    print('SOURIS',cliquer(pg,'Pointeur',souris=True),pg.evaluate('window.pdown'))
    b.close()
async def m():
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,u,figer=3)
        t0=time.time();await cliquer(pg,'Naître',delai=20);tv=(await pg.evaluate('__horloge.avancer(0,16)'))['t']
        print('FIGE',await pg.evaluate('window.ne'),len(await debordements(pg)),'VIRTUEL',tv<=(time.time()-t0)*1000*0.2+100,round(tv))
        await nav.close()
asyncio.run(m())
"""
    out = run(sys.executable, '-c', code, OC, SONDE_JEU, timeout=90)
    att = ["DEB [('bloc', 'aside#aside'), ('bord', 'div#pied'), ('coupe', 'div#case'), ('coupe', 'div#nom')]", 'IGN 0', 'ABSENT True', 'CLIC True 1', 'VOILE True 1', 'SVG True 1', 'SOURIS True 1', 'FIGE 1 4 VIRTUEL True']
    manque = [a for a in att if a not in out]
    if manque:
        raise RuntimeError('attendu ' + ' / '.join(manque) + ' ; obtenu : ' + out[-400:])


SINGE_JEU = """<!doctype html><meta charset=utf-8><style>body{margin:0;font:16px sans-serif}button{margin:6px;padding:10px}
#dlg{position:fixed;inset:40px;background:#fff;border:2px solid #333;overflow:auto}#voile{position:fixed;inset:0;background:#0003}</style>
<style>@keyframes d{to{transform:translateX(-50%)}}</style><div id=tape style="overflow:hidden;white-space:nowrap"><span style="display:inline-block;animation:d 9s linear infinite;animation-play-state:paused">""" + 'AAPL 215 +1 % ' * 300 + """</span></div>
<div id=onglets style="display:flex;overflow:hidden;width:300px">""" + ''.join(f'<span style="flex:none;width:60px">Onglet{i}</span>' for i in range(20)) + """</div>
<p id=phrase style="white-space:nowrap;overflow:hidden">""" + 'Une phrase très longue qui ne tient pas. ' * 40 + """</p>
<div id=jeu><h1>Partie</h1><button onclick="jour++">+1 mois</button><button>Mort</button><button onclick="null.x">Casser</button><button onclick="ouvrir()">Aide</button></div>
<div id=voile hidden></div><div id=dlg role=dialog hidden><h2>Aide</h2><div style="height:2000px">long texte</div><button onclick="bas++;fermer()">Tout en bas</button></div>
<script>window.jour=0;window.bas=0;function ouvrir(){voile.hidden=false;dlg.hidden=false}function fermer(){voile.hidden=true;dlg.hidden=true}</script>"""


@controle('sonde : cliquer(effet=) voit un clic sans effet ; cibles() ignore un bouton recouvert par une fenêtre et propose celui du bas ; bandeau défilant à l\'arrêt ignoré, barre d\'onglets et phrase coupées vues')
def _():
    code = r"""
import sys,os,tempfile
sys.path.insert(0,sys.argv[1])
from sonde import cliquer,ClicSansEffet,debordements,SONDE
from playwright.sync_api import sync_playwright
d=tempfile.mkdtemp();open(os.path.join(d,'index.html'),'w',encoding='utf-8').write(sys.argv[2])
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':700});pg.goto('file://'+os.path.join(d,'index.html'))
    print('BANDEAU',sorted(x['sel'].split('>')[-1] for x in debordements(pg)))
    try:cliquer(pg,'Mort',effet=True,delai_effet=0.5);print('MORT non')
    except ClicSansEffet as e:print('MORT vu','Mort' in str(e))
    print('EFFET',cliquer(pg,'+1 mois',effet='jour'),pg.evaluate('jour'))
    cliquer(pg,'Aide')
    try:cliquer(pg,'+1 mois',delai=0.5);print('RECOUVERT non')
    except TimeoutError:print('RECOUVERT vu')
    c=pg.evaluate("__sonde.cibles({loin:true})");print('CIBLES',sorted((x['t'],x['loin']) for x in c))
    print('DESSUS',pg.evaluate('__sonde.dessus()'))
    b.close()
"""
    out = run(sys.executable, '-c', code, OC, SINGE_JEU, timeout=60)
    att = ["BANDEAU ['div#onglets', 'p#phrase']", 'MORT vu True', 'EFFET True 1', 'RECOUVERT vu', "CIBLES [('Tout en bas', True)]", 'DESSUS div#dlg>div / div#voile']
    manque = [a for a in att if a not in out]
    if manque:
        raise RuntimeError('attendu ' + ' / '.join(manque) + ' ; obtenu : ' + out[-400:])


@controle('robots/singe.py : trouve l\'erreur JS, le bouton mort, atteint le bouton du bas d\'une fenêtre, code 1')
def _():
    with tempfile.TemporaryDirectory() as d:
        open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(SINGE_JEU)
        json.dump({'fichier': 'index.html', 'etat': "[jour,bas]", 'invariants': "jour<1e9?[]:['jour']", 'pause': [10, 40]}, open(os.path.join(d, 'singe.json'), 'w'))
        out = run(sys.executable, os.path.join(OC, 'robots', 'singe.py'), os.path.join(d, 'singe.json'), '--secondes', '5', '--appareils', 'ordinateur,telephone',
                  '--sortie', os.path.join(d, 'o'), attendu=1, timeout=90)
        r = json.load(open(os.path.join(d, 'o', 'singe.json')))
        for a in r['appareils']:
            pb = []
            if not any('reading \'x\'' in e['erreur'] and e['apres'][-1] == 'bouton Casser' for e in a['erreurs']): pb.append('erreur de « Casser » non vue')
            if not any(x.startswith('Mort') for x in a['boutons_jamais_efficaces']): pb.append('bouton mort non vu')
            if any(x.startswith('+1 mois') for x in a['boutons_jamais_efficaces']): pb.append('« +1 mois » dit sans effet')
            if not (a['etat_fin'][0] > 0 and a['etat_fin'][1] > 0): pb.append(f"progression {a['etat_fin']}")
            if a['blocages'] or a['invariants']: pb.append('blocage ou invariant inattendu')
            if pb:
                raise RuntimeError(a['appareil'] + ' : ' + ', '.join(pb) + ' ; ' + out[-300:])


BORD_JEU = """<!doctype html><meta charset=utf-8><style>body{margin:0;font:16px sans-serif}#m{position:fixed;inset:0;background:#0008}
#box{position:absolute;left:20px;right:20px;top:100px;height:300.7px;overflow:auto;background:#fff}#pad{height:270.6px}#f{display:block;width:100%;height:60px;border:0;margin:0}</style>
<p>fond</p><div id=m><div id=box><div id=pad>Bienvenue</div><button id=f onclick="document.getElementById('m').remove()">Fermer</button></div></div>
<div style="height:50px;overflow:hidden"><button id=fx style="position:fixed;left:10px;top:600px" onclick="this.textContent='Fixe ok'">Fixe</button></div>
<div style="max-height:0;overflow:hidden"><button>Replié</button></div>
<div id=sc style="position:fixed;left:0;top:640px;width:300px;height:50px;overflow:auto;border:20px solid #888;box-sizing:border-box"><div style="height:200px"><button id=bd style="margin-top:10px;width:250px;height:30px">Bordure</button></div></div>"""


@controle('sonde : cibles() vise la partie VISIBLE d\'un bouton coupé par le bord d\'une fenêtre qui défile (le vrai doigt le touche) ; bouton fixe dans un bloc coupé, accordéon replié, bordure')
def _():
    # piège vu sur Sedes Petri (« Gouverner l'Église » du message d'accueil) et Président de Club : centre arrondi hors de la fenêtre → clic perdu
    code = r"""
import sys,os,tempfile
from playwright.sync_api import sync_playwright
d=tempfile.mkdtemp();open(os.path.join(d,'index.html'),'w',encoding='utf-8').write(sys.argv[2])
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':700});pg.goto('file://'+os.path.join(d,'index.html'))
    pg.add_script_tag(path=os.path.join(sys.argv[1],'sonde.js'))
    c=[x for x in pg.evaluate("__sonde.cibles({loin:true})") if x['t']=='Fermer'][0]
    print('POINT',c['loin'],100<=c['y']<=400)
    pg.mouse.click(c['x'],c['y']);print('FERME',not pg.evaluate("!!document.getElementById('m')"))
    t={x['t']:x for x in pg.evaluate("__sonde.cibles({loin:true})")}
    print('FIXE', 'Fixe' in t and not t['Fixe']['loin'], pg.evaluate("__sonde.cliquer('Fixe')"), pg.evaluate("document.getElementById('fx').textContent"))
    print('REPLIE', 'Replié' not in t)
    b2=t.get('Bordure'); print('BORDURE', bool(b2) and (b2['loin'] or pg.evaluate("([x,y])=>document.elementFromPoint(x,y).id",[b2['x'],b2['y']])=='bd'))
    b.close()
"""
    out = run(sys.executable, '-c', code, OC, BORD_JEU, timeout=60)
    for a in ('POINT False True', 'FERME True', 'FIXE True True Fixe ok', 'REPLIE True', 'BORDURE True'):
        if a not in out:
            raise RuntimeError(f'attendu {a} ; obtenu : ' + out[-300:])


COUVRIR_JEU = """<!doctype html><meta charset=utf-8><style>button{margin:2px;font:14px sans-serif}</style><h1 id=t>Salle 0</h1><div id=b></div>
<script>let n=0;for(let i=1;i<=60;i++){const e=document.createElement('button');e.textContent='Salle '+String.fromCharCode(65+i%26,65+(i/26|0));e.onclick=()=>{n++;document.getElementById('t').textContent='Salle '+i};document.getElementById('b').appendChild(e)}</script>"""


@controle('robots/singe.py --couvrir : touche d\'abord les boutons jamais touchés (60 boutons, 90 actions : ≥ 51 distincts, ≈ 46 au hasard ; les nombres sont ignorés dans les noms), couverture dans le rapport')
def _():
    with tempfile.TemporaryDirectory() as d:
        open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(COUVRIR_JEU)
        json.dump({'fichier': 'index.html', 'etat': 'n', 'ecran': "'salle'", 'hasard': 0, 'glisser': 0, 'pause': [10, 30]}, open(os.path.join(d, 'singe.json'), 'w'))
        run(sys.executable, os.path.join(OC, 'robots', 'singe.py'), os.path.join(d, 'singe.json'), '--secondes', '40', '--actions', '90', '--appareils', 'ordinateur',
            '--couvrir', '--sortie', os.path.join(d, 'o'), timeout=60)
        a = json.load(open(os.path.join(d, 'o', 'singe.json')))['appareils'][0]
        cv, haut = a.get('couverture') or {}, a['plus_touches'][0][1] if a['plus_touches'] else 0
        attendu = 51   # 90 actions (nombre fixe, indépendant de la vitesse) : au hasard ≈ 45-47 boutons distincts ; explorateur ≈ 53-58
        if cv.get('mode') != 'explorateur' or a['actions'] != 90 or haut > 4 or a['boutons_distincts'] < attendu or cv.get('boutons_vus', 0) < 60:
            raise RuntimeError(f"mode {cv.get('mode')}, {a['actions']} actions, {a['boutons_distincts']} boutons distincts, le plus touché {haut}×, vus {cv.get('boutons_vus')}")


@controle('maj_testkit.py : versions (v1 → commune), manques, ajouts locaux refusés, fichier / bloc / intégrée / construite, copie mise à jour qui marche dans Chromium (tk = version)')
def _():
    spec = importlib.util.spec_from_file_location('maj_t', os.path.join(OC, 'maj_testkit.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    c = m.commun(); der = max(v for v, *_ in m.VERSIONS)
    if c['version'] != der or m.presentes(c['texte']) != {v for v, *_ in m.VERSIONS}:
        raise RuntimeError(f"testkit.js v{c['version']} : la table VERSIONS de maj_testkit.py (v{der}) ou les marques ne correspondent plus — "
                           f"marques présentes {sorted(m.presentes(c['texte']))}")
    vieux = "function Testkit(o){const TK={test:false};TK.base='x';const s={bas1:1};/*masquee*/TK.envoyer=async()=>0;TK.signaler=()=>TK.envoyer('signalement_'+1);return TK;}\nwindow.Testkit=Testkit;\n"
    with tempfile.TemporaryDirectory() as d:
        os.makedirs(os.path.join(d, 'outils-communs'))
        for f in ('testkit.js', 'maj_testkit.py'):
            shutil.copy(os.path.join(OC, f), os.path.join(d, 'outils-communs', f))
        def ecrire(rel, txt):
            q = os.path.join(d, rel); os.makedirs(os.path.dirname(q), exist_ok=True); open(q, 'w', encoding='utf-8').write(txt)
        ecrire('a/jeu/testkit.js', vieux)                                                     # fichier v2 sans export
        ecrire('b/jeu/testkit.js', vieux.replace('return TK;', 'TK.special=1;return TK;'))     # ajout local
        ecrire('c/jeu/index.html', '<script>/*TESTKIT-DEBUT*/\n' + vieux.replace("TK.base='x';", '') + '/*TESTKIT-FIN*/</script>')
        ecrire('d/jeu/app.js', 'let x=1;\n' + vieux + 'function jeu(){ const a={}; a.download=1; }\n')  # intégrée sans repères
        ecrire('e/jeu/build.py', "tk=open(COMMUNS+'/testkit.js').read()\n"); ecrire('e/jeu/page.html', vieux)  # construite
        ecrire('e/build/index.html', vieux); ecrire('a/build/x.html', vieux)                   # pages construites ignorées
        mt = os.path.join(d, 'outils-communs', 'maj_testkit.py')
        e = json.loads(run(sys.executable, mt, '--json'))
        r = {j: [(k['genre'], k['version'], k['remplacable'], k['ajouts']) for k in cs] for j, cs in e.items()}
        att = {'a': [('fichier', 2, True, [])], 'b': [('fichier', 2, True, ['TK.special'])], 'c': [('bloc', 1, True, [])],
               'd': [('intégrée', 2, False, [])], 'e': [('construite', 2, False, [])]}
        if r != att:
            raise RuntimeError('analyse inattendue : ' + json.dumps(r, ensure_ascii=False))
        if [x['nom'] for x in e['a'][0]['manques']][:1] != ['filtre des pauses']:
            raise RuntimeError('manques : ' + json.dumps(e['a'][0]['manques'], ensure_ascii=False)[:200])
        run(sys.executable, mt, 'a')                                  # sans --appliquer : rien ne change
        if open(os.path.join(d, 'a/jeu/testkit.js')).read() != vieux:
            raise RuntimeError('fichier modifié sans --appliquer')
        for j in 'acde':
            run(sys.executable, mt, j, '--appliquer', attendu=1 if j == 'd' else 0)
        run(sys.executable, mt, 'b', '--appliquer', attendu=1)
        if 'TK.special' not in open(os.path.join(d, 'b/jeu/testkit.js')).read():
            raise RuntimeError('ajout local écrasé sans --forcer')
        a2 = open(os.path.join(d, 'a/jeu/testkit.js')).read(); c2 = open(os.path.join(d, 'c/jeu/index.html')).read()
        if re.search(r'^export ', a2, re.M) or f'version:{der}' not in a2 or f'version:{der}' not in c2 or not c2.endswith('/*TESTKIT-FIN*/</script>'):
            raise RuntimeError('copie mise à jour incorrecte')
        if open(os.path.join(d, 'd/jeu/app.js')).read().count('function Testkit') != 1 or 'a.download' not in open(os.path.join(d, 'd/jeu/app.js')).read():
            raise RuntimeError('trousse intégrée modifiée')
        e2 = json.loads(run(sys.executable, mt, '--json'))
        if not (e2['a'][0]['a_jour'] and e2['c'][0]['a_jour']):
            raise RuntimeError('toujours périmées après mise à jour')
        page = '<body><canvas id=c></canvas><script src="testkit.js"></script><script>(async()=>{const TK=Testkit({jeu:"t",canvas:()=>c});' \
               'const r=await TK.banc([{nom:"s",preparer:async()=>{}}],400);document.title="OK "+r.tk+" "+TK.version+" "+(r.res[0].fps>0)})().catch(e=>document.title="ERR "+e)</script>'
        open(os.path.join(d, 'a/jeu/index.html'), 'w').write(page)
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            nav = p.chromium.launch(); pg = nav.new_page(); errs = []
            pg.on('pageerror', lambda x: errs.append(str(x)))
            pg.goto('file://' + os.path.join(d, 'a/jeu/index.html'))
            pg.wait_for_function('document.title.length>0', timeout=20000)
            ti = pg.title(); nav.close()
        if ti != f'OK {der} {der} true' or errs:
            raise RuntimeError(f'copie mise à jour dans Chromium : {ti} {errs[:2]}')
        # retouche locale non commitée (corps d'une fonction modifié : invisible à la comparaison d'API) → refus sans --forcer
        g = lambda *x: subprocess.run(['git', '-c', 'user.email=t@t', '-c', 'user.name=t', *x], cwd=d, capture_output=True, check=True)
        open(os.path.join(d, 'a/jeu/testkit.js'), 'w').write(vieux); g('init', '-q'); g('add', '-A'); g('commit', '-qm', 'x')
        open(os.path.join(d, 'a/jeu/testkit.js'), 'w').write(vieux.replace('bas1:1', 'bas1:2'))
        run(sys.executable, mt, 'a', '--appliquer', attendu=1)
        if 'bas1:2' not in open(os.path.join(d, 'a/jeu/testkit.js')).read():
            raise RuntimeError('retouche non commitée écrasée sans --forcer')
    # bureau.py ne doit jamais planter à cause de maj_testkit
    spec = importlib.util.spec_from_file_location('bureau_tk', os.path.join(RAC, 'bureau', 'outils', 'bureau.py'))
    b = importlib.util.module_from_spec(spec); spec.loader.exec_module(b)
    class Casse:
        def copies(self, d): raise FileNotFoundError('lien cassé')
        def lu_au_build(self, d): return None
    b._maj_testkit = lambda: Casse()
    st, info = b.etat_testkit('bannieres', os.path.join(RAC, 'bannieres'))
    if not st.startswith('inconnu') or info is not None:
        raise RuntimeError('bureau.py avec maj_testkit en panne : ' + st)


BANC_JEU = """<!doctype html><meta charset=utf-8><body style="margin:0"><canvas id=c width=300 height=200></canvas><script>
const g=document.getElementById('c').getContext('2d');let x=0,k=0;window.pret=false;setTimeout(()=>window.pret=true,200);
function f(){const t0=performance.now();while(performance.now()-t0<2){x++;}  /* travail découpé selon le temps : ne doit pas bloquer en temps figé */
 for(let i=0;i<TRAVAIL;i++)x+=Math.sqrt(i);k++;g.fillStyle='hsl('+(k%360)+',50%,50%)';g.fillRect(k%250,40,50,50);requestAnimationFrame(f);}requestAnimationFrame(f);
</script>"""


@controle('banc.py : avant/après entrelacé (même page → « égal », page 3× plus lourde → « plus lent » et code 1 avec --strict, scène qui plante → alerte), temps découpé sans blocage, --comparer, mesure au format testkit (bas1, pauses)')
def _():
    with tempfile.TemporaryDirectory() as d:
        for nom, w in (('leger', 150000), ('leger2', 150000), ('lourd', 450000)):
            os.makedirs(os.path.join(d, nom)); open(os.path.join(d, nom, 'index.html'), 'w').write(BANC_JEU.replace('TRAVAIL', str(w)))
        cfg = {'jeu': 'factice', 'dossier': os.path.join(d, 'leger'), 'page': 'index.html', 'pret': 'window.pret', 'pret_ms': 200,
               'images': 100, 'seuil': 15, 'scenes': [{'nom': 'jeu', 'attente_ms': 200}, {'nom': 'encore', 'attente_ms': 100}]}
        reg = os.path.join(d, 'banc.json'); json.dump(cfg, open(reg, 'w'))
        sb = os.path.join(OC, 'banc.py')
        for essai in range(2):  # machine partagée : un à-coup du système peut ralentir toute une passe ; une vraie fausse alerte revient
            subprocess.run([sys.executable, sb, reg, '--avant-dossier', os.path.join(d, 'leger2'), os.path.join(d, 'egal.json')], capture_output=True, text=True, timeout=150)
            e = json.load(open(os.path.join(d, 'egal.json')))
            if all(x['verdict'] == 'égal (bruit)' for x in e['ecarts']):
                break
        if any(x['verdict'] != 'égal (bruit)' for x in e['ecarts']) or len(e['ecarts']) != 2:
            raise RuntimeError('fausse alerte sur deux pages identiques : ' + json.dumps(e['ecarts'])[:300])
        m = e['apres']['telephone']['scenes']['jeu']
        if not all(k in m for k in ('fps', 'bas1', 'pire', 'n', 'ms', 'med', 'p95')) or m['n'] < 8:
            raise RuntimeError('mesure incomplète : ' + json.dumps(m))
        r = subprocess.run([sys.executable, sb, reg, '--avant-dossier', os.path.join(d, 'lourd'), '--tours', '2', os.path.join(d, 'gain.json')], capture_output=True, text=True, timeout=150)
        g = json.load(open(os.path.join(d, 'gain.json')))
        if r.returncode != 0 or not all(x['verdict'] == 'plus rapide' for x in g['ecarts']):
            raise RuntimeError('page 3× moins lourde non vue « plus rapide » : ' + json.dumps(g['ecarts'])[:300])
        # inverser : la version en cours est la lourde → plus lent, code 1 avec --strict
        cfg['dossier'] = os.path.join(d, 'lourd'); json.dump(cfg, open(reg, 'w'))
        r = subprocess.run([sys.executable, sb, reg, '--avant-dossier', os.path.join(d, 'leger'), '--strict', '--scenes', 'jeu', os.path.join(d, 'lourd.json')], capture_output=True, text=True, timeout=150)
        if r.returncode != 1 or 'plus lent' not in r.stdout:
            raise RuntimeError(f'ralentissement non signalé (code {r.returncode}) : ' + r.stdout[-300:])
        # une scène qui plante dans la version en cours = alerte (pas « aucun ralentissement »)
        os.makedirs(os.path.join(d, 'casse')); open(os.path.join(d, 'casse', 'index.html'), 'w').write(BANC_JEU.replace('TRAVAIL', '150000').replace('<script>', '<script>window.casse=1;', 1))
        cfg['dossier'] = os.path.join(d, 'casse'); cfg['scenes'][0]['js'] = "if(window.casse)throw new Error('scène cassée')"; json.dump(cfg, open(reg, 'w'))
        r = subprocess.run([sys.executable, sb, reg, '--avant-dossier', os.path.join(d, 'leger'), '--strict', '--tours', '1', '--scenes', 'jeu'], capture_output=True, text=True, timeout=150)
        if r.returncode != 1 or 'erreur après' not in r.stdout:
            raise RuntimeError(f'scène en erreur non signalée (code {r.returncode}) : ' + r.stdout[-300:])
        r = subprocess.run([sys.executable, sb, '--comparer', os.path.join(d, 'egal.json'), os.path.join(d, 'lourd.json'), '--strict'], capture_output=True, text=True, timeout=30)
        if 'plus lent' not in r.stdout or r.returncode != 1:
            raise RuntimeError('--comparer : ' + r.stdout[-300:])
    # atelier.mesurer : mêmes clés que testkit.js
    spec = importlib.util.spec_from_file_location('atelier_b', os.path.join(OC, 'atelier.py'))
    a = importlib.util.module_from_spec(spec); spec.loader.exec_module(a)
    for k in ('bas1', 'pauses', 'pauseMax', 'p95', 'seuil=Math.max(1000,8*', 'lent'):
        if k not in a.MESURE_JS:
            raise RuntimeError('atelier.mesurer sans ' + k)


@controle('horloge.js : modes reel (chargement en temps réel puis refigé) et coulant (une boucle « tant que < 5 ms » se termine, images toujours à t+pas)')
def _():
    code = r"""
import asyncio,sys,json
from playwright.async_api import async_playwright
JS='''()=>{const reel=n;__horloge.reel(false);__horloge.coulant(true);const t=__horloge.avancer(0).t,n0=n;const r=__horloge.avancer(3,10);
  let i=0;const t0=performance.now();while(performance.now()-t0<5)i++;return {reel,images:n-n0,ecart:r.t-t,boucle:i>0,n1:n};}'''
async def m():
    async with async_playwright() as p:
        nav=await p.chromium.launch();pg=await nav.new_page()
        await pg.add_init_script("window.__HORLOGE_REEL=1");await pg.add_init_script(path=sys.argv[1])
        await pg.goto("data:text/html,<script>window.n=0;(function f(){n++;requestAnimationFrame(f)})()</script>")
        await pg.wait_for_timeout(400)
        r=await pg.evaluate(JS)
        await pg.wait_for_timeout(300);r['n2']=await pg.evaluate("()=>n")
        print('R'+json.dumps(r));await nav.close()
asyncio.run(m())
"""
    out = run(sys.executable, '-c', code, os.path.join(OC, 'horloge.js'), timeout=60)
    r = json.loads(out.split('R', 1)[1])
    if r['reel'] < 5:
        raise RuntimeError('mode réel : pas d\'images toutes seules au chargement : ' + json.dumps(r))
    if r['images'] != 3 or not r['boucle']:
        raise RuntimeError('mode coulant : ' + json.dumps(r))
    if abs(r['ecart'] - 30) > 0.5:
        raise RuntimeError('images coulantes pas à t+pas (attendu 30 ms) : ' + json.dumps(r))
    if r['n2'] != r['n1']:
        raise RuntimeError('refigé : des images tournent encore toutes seules : ' + json.dumps(r))


@controle('bureau.py : état, json, page')
def _():
    run(sys.executable, 'bureau/outils/bureau.py')
    e = json.loads(run(sys.executable, 'bureau/outils/bureau.py', 'json'))
    if len(e['jeux']) < 5:
        raise RuntimeError('trop peu de jeux détectés')
    if 'testkit_perimes' not in e['alertes'] or any(j['testkit'] == 'version locale' for j in e['jeux']):
        raise RuntimeError('statut de la trousse non calculé par version (maj_testkit.py)')
    run(sys.executable, 'bureau/outils/bureau.py', 'page')


@controle('bureau.py chronos : regroupement des étapes « x (1) »/« x (2) », total, échecs, fenêtre de jours')
def _():
    spec = importlib.util.spec_from_file_location('bureau_t', os.path.join(RAC, 'bureau', 'outils', 'bureau.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    with tempfile.TemporaryDirectory() as d:
        os.makedirs(os.path.join(d, 'retours-outils')); m.B = d
        maint = m.maintenant()
        lignes = [{'quand': maint, 'jeu': 'a', 'etape': 'studio (1)', 'secondes': 20, 'code': 0},
                  {'quand': maint, 'jeu': 'a', 'etape': 'studio (2)', 'secondes': 30, 'code': 1},
                  {'quand': maint, 'jeu': 'b', 'etape': 'verifier (10 contrôles)', 'secondes': 5, 'code': 0},
                  {'quand': '2000-01-01 00:00', 'jeu': 'a', 'etape': 'studio', 'secondes': 999, 'code': 0}]
        open(os.path.join(d, 'retours-outils', 'chronos.jsonl'), 'w').write('\n'.join(json.dumps(x) for x in lignes) + '\nligne cassée\n')
        r = m.lire_chronos(7)
        if [(x['jeu'], x['etape'], x['fois'], x['total'], x['echecs']) for x in r] != [('a', 'studio', 2, 50.0, 1), ('b', 'verifier', 1, 5.0, 0)]:
            raise RuntimeError('regroupement inattendu : ' + json.dumps(r)[:300])
    run(sys.executable, 'bureau/outils/bureau.py', 'chronos')


LENT_JEU = """<body><canvas id=c width=50 height=50></canvas><script src="testkit.js"></script><script>
const att=ms=>{const t=performance.now();while(performance.now()-t<ms);};let mode='lent',k=0;
(function f(){k++;if(mode==='lent')att(1150);else if(mode==='pause'&&k%40===0)att(1600);else att(2);requestAnimationFrame(f)})();
(async()=>{const TK=Testkit({jeu:'t',canvas:()=>c});await new Promise(r=>setTimeout(r,300));
 const r1=await TK.mesurer(4000);mode='pause';await new Promise(r=>setTimeout(r,300));const r2=await TK.mesurer(2500);
 window.R={v:TK.version,lent:r1,pause:r2};})();</script>"""


@controle('testkit.js v7 : appareil où toutes les images dépassent 1 s → fps mesuré et lent:true (pas de banc vide ni « masquée ») ; image normale + vraie pause de 1,6 s → pause écartée ; atelier.mesurer pareil')
def _():
    code = r"""
import asyncio,sys,os,tempfile,shutil
sys.path.insert(0,sys.argv[1])
from atelier import serveur,navigateur,page,mesurer
from playwright.async_api import async_playwright
d=tempfile.mkdtemp();open(os.path.join(d,'index.html'),'w').write(sys.argv[2]);shutil.copy(os.path.join(sys.argv[1],'testkit.js'),d)
s=open(os.path.join(d,'testkit.js')).read().replace('export function','function');open(os.path.join(d,'testkit.js'),'w').write(s)
async def m():
    async with async_playwright() as p:
        nav=await navigateur(p);pg=await page(nav,serveur(d,18796)+'index.html',100,100)
        await pg.wait_for_function('window.R',timeout=40000,polling=200);R=await pg.evaluate('R');l,z=R['lent'],R['pause']
        print('V',R['v'],'LENT',bool(l.get('fps')) and l['fps']<1.2 and l.get('lent') is True and not l.get('masquee'),
              'PAUSE',z.get('pauses',0)>=1 and z['fps']>50 and not z.get('lent') and z['pire']<200)
        await pg.evaluate("mode='lent'");a=await mesurer(pg,2500);print('ATELIER',a['n']>=2 and 0<a['fps']<1.2 and a.get('lent') is True)
        await nav.close()
asyncio.run(m())
"""
    out = run(sys.executable, '-c', code, OC, LENT_JEU, timeout=120)
    if 'V 7 LENT True PAUSE True' not in out or 'ATELIER True' not in out:
        raise RuntimeError('images lentes mal comptées : ' + out[-300:])


@controle("atelier.serveur : ne réutilise pas un serveur qui sert un AUTRE dossier (ancien http.server ou atelier), réutilise le sien, démarre en < 0,5 s, reprend le port d'un dossier effacé, aucun serveur orphelin")
def _():
    code = r"""
import sys,os,tempfile,time,subprocess,urllib.request
sys.path.insert(0,sys.argv[1])
from atelier import serveur
A,B=tempfile.mkdtemp(),tempfile.mkdtemp();open(os.path.join(A,'index.html'),'w').write('avant');open(os.path.join(B,'index.html'),'w').write('apres')
lu=lambda b:urllib.request.urlopen(b+'index.html').read().decode()
t=time.time();a=serveur(A,18761);ta=time.time()-t;b=serveur(B,18761);a2=serveur(A,18761);b2=serveur(B,18761)
v=subprocess.Popen([sys.executable,'-m','http.server','18771'],cwd=A,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(0.8)
try:c=serveur(B,18771);c2=serveur(A,18771)
finally:v.kill()
import atelier,shutil
C=tempfile.mkdtemp();o=subprocess.Popen([sys.executable,'-c',atelier.SERVEUR_PY,'18781',C],start_new_session=True);time.sleep(0.8);shutil.rmtree(C)
e=serveur(A,18781);o.wait(5)
print('RES',lu(a),lu(b),a2==a,b2==b,b!=a,lu(c),c2.endswith(':18771/'),ta<0.5,'PERIME',e.endswith(':18781/') and lu(e)=='avant')
"""
    out = run(sys.executable, '-c', code, OC, timeout=60)
    if 'RES avant apres True True True apres True True PERIME True' not in out:
        raise RuntimeError('serveur : ' + out[-300:])
    import socket
    for p in (18761, 18762, 18772, 18781):  # serveurs des dossiers temporaires arrêtés à la sortie (pas d'orphelins qui glissent sur les ports des jeux)
        with socket.socket() as s:
            if s.connect_ex(('127.0.0.1', p)) == 0:
                raise RuntimeError(f'serveur orphelin resté sur le port {p}')


ROUTES_JEU = """<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width">
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
<script type="module">import * as THREE from 'three';import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {lib} from 'https://exemple.invalid/lib/lib.js';
window.T=THREE.REVISION+'/'+(typeof mergeVertices)+'/'+lib;
fetch('https://exemple.invalid/lib/absent.js').then(r=>window.absent=r.status,()=>window.absent='échec');
fetch('https://refus.invalid/x.js').then(()=>window.refus='servi',()=>window.refus='refusé');</script>
<button id=b onclick="window.n=(window.n||0)+1">Tape</button><script>window.frames_=0;(function f(){window.frames_++;requestAnimationFrame(f)})()</script>"""


@controle('routes.py : Three.js r160 du CDN (importmap + addons) servi en local, route en plus, fichier manquant listé, route refusée ; atelier.page(tactile=True) = vrai téléphone ; routes=False coupe')
def _():
    import asyncio
    sys.path.insert(0, OC)
    import routes as R_, atelier as A_
    if not R_.three_local():
        raise RuntimeError('three_local() : aucune copie de three')
    with tempfile.TemporaryDirectory() as d:
        os.makedirs(os.path.join(d, 'lib')); open(os.path.join(d, 'lib', 'lib.js'), 'w').write("export const lib='local';")
        open(os.path.join(d, 'index.html'), 'w').write(ROUTES_JEU)
        rt = {'https://exemple.invalid/lib/': os.path.join(d, 'lib'), 'https://refus.invalid/': None}

        async def essai():
            from playwright.async_api import async_playwright
            async with async_playwright() as p:
                nav = await A_.navigateur(p)
                pg = await A_.page(nav, 'file://' + os.path.join(d, 'index.html'), tactile=True, routes=rt)
                await pg.wait_for_function('window.T&&window.absent&&window.refus', timeout=60000, polling=100)
                r = await pg.evaluate("()=>[window.T,window.absent,window.refus,navigator.maxTouchPoints>0,matchMedia('(pointer:coarse)').matches]")
                j = pg.routes
                pg2 = await A_.page(nav, 'file://' + os.path.join(d, 'index.html'), routes=False)
                await pg2.wait_for_timeout(1500)
                r2 = await pg2.evaluate("()=>[window.T||null,navigator.maxTouchPoints]")
                await nav.close()
                return r, j, r2
        r, j, r2 = asyncio.run(essai())
        if r[0] != '160/function/local':
            raise RuntimeError(f'modules non servis en local : {r[0]} ; {R_.resume(j)}')
        if r[1] != 404 or not any('absent.js' in u for u in j['manquants']):
            raise RuntimeError(f'fichier manquant non signalé : {r[1]} {j}')
        if r[2] != 'refusé' or j['refuses'] < 1:
            raise RuntimeError(f'route null non refusée : {r[2]}')
        if not (r[3] and r[4]):
            raise RuntimeError('atelier.page(tactile=True) : pas un écran tactile')
        if r2[0] is not None or r2[1] != 0:
            raise RuntimeError(f'routes=False ou page par défaut : {r2}')
    # résolution : version lue dans l'adresse, unpkg, préfixe le plus long d'abord
    pr = R_.preparer({'https://cdn.jsdelivr.net/npm/three@0.160.0/build/': '/nulle/part/'})
    a, f = R_.resoudre('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js?x=1', pr)
    if (a, f) != ('manquant', '/nulle/part/three.module.js'):
        raise RuntimeError(f'préfixe le plus long non prioritaire : {a} {f}')
    for u in ('https://cdn.jsdelivr.net/npm/three@0.160.0/../../../etc/passwd', 'https://exemple.invalid/lib/%2e%2e/%2e%2e/etc/passwd'):
        a, f = R_.resoudre(u, R_.preparer({'https://exemple.invalid/lib/': tempfile.gettempdir()}))
        if a == 'fichier':
            raise RuntimeError(f'fichier hors du dossier routé servi : {u} → {f}')
    a, f = R_.resoudre('https://cdn.jsdelivr.net/npm/three@99.0.1/build/three.module.js', R_.preparer())  # version introuvable : manquant, pas de plantage
    if a != 'manquant':
        raise RuntimeError(f'version de three introuvable : {a}')
    a, f = R_.resoudre('https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js', R_.preparer())
    if a != 'fichier' or not f.endswith('examples/jsm/loaders/GLTFLoader.js'):
        raise RuntimeError(f'unpkg : {a} {f}')


SINGE3D_JEU = ROUTES_JEU.replace("import {lib} from 'https://exemple.invalid/lib/lib.js';", "const lib='x';")


@controle('robots/singe.py : Three.js du CDN servi (routes), --ordinateur 1280x800, mode économe --images 1 (1 image par action, pas des centaines)')
def _():
    with tempfile.TemporaryDirectory() as d:
        open(os.path.join(d, 'index.html'), 'w').write(SINGE3D_JEU)
        json.dump({'fichier': 'index.html', 'pret': 'window.T', 'etat': "[window.T,window.frames_,window.n||0]", 'pause': [10, 20], 'hasard': 0, 'glisser': 0,
                   'routes': {'https://refus.invalid/': None}}, open(os.path.join(d, 'singe.json'), 'w'))
        run(sys.executable, os.path.join(OC, 'robots', 'singe.py'), os.path.join(d, 'singe.json'), '--secondes', '20', '--actions', '12', '--appareils', 'ordinateur',
            '--ordinateur', '1280x800', '--images', '1', '--sortie', os.path.join(d, 'o'), timeout=120)
        a = json.load(open(os.path.join(d, 'o', 'singe.json')))['appareils'][0]
        if a['ecran'] != {'width': 1280, 'height': 800}:
            raise RuntimeError(f"format d'écran : {a['ecran']}")
        if a['routes']['servis'] < 2 or a['routes']['manquants'] or not str(a['etat_fin'][0]).startswith('160/'):
            raise RuntimeError(f"three non servi : {a['routes']} {a['etat_fin']}")
        im = a['etat_fin'][1] - a['etat_debut'][1]
        if not (a['actions'] >= 10 and im <= a['actions'] + 2):
            raise RuntimeError(f"mode économe : {im} images pour {a['actions']} actions (attendu ≈ 1 par action)")


@controle('banc.py : un seul banc à la fois (le second attend et le dit), fichier partiel écrit au fil des scènes puis effacé, temps restant, charge notée')
def _():
    import fcntl
    sys.path.insert(0, OC)
    import banc as B_
    with tempfile.TemporaryDirectory() as d:
        os.makedirs(os.path.join(d, 'j')); open(os.path.join(d, 'j', 'index.html'), 'w').write(BANC_JEU.replace('TRAVAIL', '150000'))
        cfg = {'jeu': 'factice', 'dossier': os.path.join(d, 'j'), 'page': 'index.html', 'pret': 'window.pret', 'pret_ms': 100, 'images': 60,
               'scenes': [{'nom': f's{i}', 'attente_ms': 400} for i in range(4)]}
        reg = os.path.join(d, 'banc.json'); json.dump(cfg, open(reg, 'w'))
        sortie = os.path.join(d, 'r.json'); partiel = sortie + '.partiel.json'
        verrou = open(B_.VERROU, 'a+'); fcntl.flock(verrou, fcntl.LOCK_EX)  # « un autre banc » tient la machine
        r = subprocess.run([sys.executable, os.path.join(OC, 'banc.py'), reg, '--attente-max', '3'], capture_output=True, text=True, timeout=60)
        if r.returncode != 3 or 'abandon' not in r.stdout:
            raise RuntimeError(f'--attente-max : code {r.returncode} ' + r.stdout[-200:])
        pr = subprocess.Popen([sys.executable, os.path.join(OC, 'banc.py'), reg, sortie], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        time.sleep(3)
        attendu = pr.poll() is None and not os.path.exists(partiel)
        fcntl.flock(verrou, fcntl.LOCK_UN); verrou.close()
        vu, t0 = None, time.time()
        while pr.poll() is None and time.time() - t0 < 120:
            if os.path.exists(partiel):
                try:
                    vu = json.load(open(partiel))
                except Exception:
                    pass
            time.sleep(0.05)
        out = pr.communicate(timeout=60)[0]
        if not attendu or 'un autre banc tourne' not in out:
            raise RuntimeError('le second banc n\'a pas attendu le premier : ' + out[-300:])
        if not vu or not vu.get('partiel') or vu['scenes_total'] != 4 or 'reste_estime_s' not in vu:
            raise RuntimeError(f'fichier partiel jamais vu pendant la mesure : {str(vu)[:200]}')
        if os.path.exists(partiel) or 'reste ≈' not in out:
            raise RuntimeError('partiel non effacé ou temps restant absent : ' + out[-300:])
        r = json.load(open(sortie))
        if 'charge' not in r or len(r['appareils']['telephone']['scenes']) != 4:
            raise RuntimeError('sortie incomplète : ' + json.dumps(r)[:300])

@controle('banc.py --avant : racine d\'une copie du dépôt servie au bon chemin (avant : 404 puis 180 s « jamais prêt »), page absente → code 2 tout de suite, version jamais prête non relancée, --avant HEAD extrait tout le dépôt et n\'écrase plus une page à chemin absolu ; gels : programmes compilés en jeu 24 → 0 vus, --strict code 1 si le gel revient')
def _():
    import shutil
    sb = os.path.join(OC, 'banc.py')
    for vieux in os.listdir(RAC):  # restes d'un contrôle interrompu brutalement
        if vieux.startswith('.verif_banc_'):
            shutil.rmtree(os.path.join(RAC, vieux), ignore_errors=True)
    jeu = tempfile.mkdtemp(dir=RAC, prefix='.verif_banc_')  # « jeu » dans le dépôt : réglages en chemin relatif comme les vrais
    copie = tempfile.mkdtemp(prefix='verif_copie_')           # « worktree » : même chemin relatif sous une autre racine
    rel = os.path.relpath(jeu, RAC)
    try:
        page = BANC_JEU.replace('TRAVAIL', '20000')
        open(os.path.join(jeu, 'index.html'), 'w').write(page)
        os.makedirs(os.path.join(copie, rel)); open(os.path.join(copie, rel, 'index.html'), 'w').write(page)
        cfg = {'jeu': 'factice', 'dossier': rel, 'page': 'index.html', 'pret': 'window.pret', 'pret_ms': 100, 'images': 20, 'scenes': [{'nom': 'a', 'attente_ms': 100}]}
        reg = os.path.join(copie, 'banc.json'); json.dump(cfg, open(reg, 'w'))
        t = time.time()
        r = subprocess.run([sys.executable, sb, reg, '--avant-dossier', copie, '--tours', '1', os.path.join(copie, 'o.json')], capture_output=True, text=True, timeout=120)
        o = json.load(open(os.path.join(copie, 'o.json')))
        if r.returncode or 'racine d\'une copie' not in r.stdout or 'ms' not in o['avant']['telephone']['scenes']['a'] or time.time() - t > 60:
            raise RuntimeError(f'racine de copie non servie (code {r.returncode}, {time.time()-t:.0f} s) : ' + r.stdout[-300:])
        vide = os.path.join(copie, 'vide'); os.makedirs(vide)
        t = time.time()
        r = subprocess.run([sys.executable, sb, reg, '--avant-dossier', vide], capture_output=True, text=True, timeout=60)
        if r.returncode != 2 or 'introuvable' not in r.stdout or time.time() - t > 10:
            raise RuntimeError(f'page absente non signalée tout de suite (code {r.returncode}) : ' + r.stdout[-300:])
        # version AVANT jamais prête : un seul essai de pret_max_s, pas un par tour
        os.makedirs(os.path.join(vide, rel)); open(os.path.join(vide, rel, 'index.html'), 'w').write(page.replace('window.pret', 'window.jamais'))
        cfg['pret_max_s'] = 3; json.dump(cfg, open(reg, 'w'))
        t = time.time()
        r = subprocess.run([sys.executable, sb, reg, '--avant-dossier', vide, '--tours', '3'], capture_output=True, text=True, timeout=120)
        if r.stdout.count('jamais prêt') < 1 or 'non relancée' not in r.stdout or time.time() - t > 40:
            raise RuntimeError(f'version jamais prête relancée ({time.time()-t:.0f} s) : ' + r.stdout[-400:])
        sys.path.insert(0, OC)
        import banc as B_
        d = B_.extraire('HEAD', {'dossier': 'outils-communs'})
        try:
            if not all(os.path.exists(os.path.join(d, x)) for x in ('bureau', 'outils-communs/banc.py', 'CLAUDE.md')):
                raise RuntimeError('--avant HEAD : copie partielle du dépôt : ' + ', '.join(sorted(os.listdir(d))[:8]))
        finally:
            shutil.rmtree(d, ignore_errors=True)
        # page construite à un chemin ABSOLU hors du dépôt (Cage & Gloire, Hameau, Wall Street) : --avant HEAD ne doit pas écraser
        # l'APRÈS. Ici la construction écrit une page lourde si le dossier non suivi `jeu` est absent (copie de HEAD), légère sinon.
        sortie = os.path.join(copie, 'abs'); os.makedirs(sortie)
        open(os.path.join(copie, 'leger.html'), 'w').write(BANC_JEU.replace('TRAVAIL', '150000'))
        open(os.path.join(copie, 'lourd.html'), 'w').write(BANC_JEU.replace('TRAVAIL', '450000'))
        F = os.path.join(sortie, 'page.html')
        ca = {'jeu': 'abs', 'fichier': F, 'pret': 'window.pret', 'pret_ms': 100, 'images': 60, 'scenes': [{'nom': 'a', 'attente_ms': 100}],
              'construire': f"if [ -d {rel} ]; then cp {copie}/leger.html {F}; else cp {copie}/lourd.html {F}; fi"}
        ra = os.path.join(copie, 'abs.json'); json.dump(ca, open(ra, 'w'))
        r = subprocess.run([sys.executable, sb, ra, '--avant', 'HEAD', '--construire', '--tours', '2', os.path.join(copie, 'abs_o.json')], capture_output=True, text=True, timeout=150)
        o = json.load(open(os.path.join(copie, 'abs_o.json')))
        if o['ecarts'][0]['verdict'] != 'plus rapide' or 'mis de côté' not in r.stdout or open(F).read() != open(os.path.join(copie, 'leger.html')).read():
            raise RuntimeError(f"page à chemin absolu : avant écrasé ou après non remis ({o['ecarts']}) : " + r.stdout[-300:])
        # gels : compilation en jeu (24 programmes au 1er dessin) contre préparation annoncée (window.occupe)
        g = open(os.path.join(OC, 'tests', 'gel_factice.html')).read()
        for nom, prep in (('prepare', 'true'), ('enjeu', 'false')):
            os.makedirs(os.path.join(copie, nom)); open(os.path.join(copie, nom, 'index.html'), 'w').write(g.replace('PREPARE', prep))
        cg = {'jeu': 'gel', 'dossier': os.path.join(copie, 'enjeu'), 'pret': 'window.pret', 'pret_ms': 100, 'scenes': [],
              'gels': [{'nom': 'qualite', 'js': 'changer()', 'occupe': 'window.occupe', 'avant_ms': 400, 'duree_ms': 2000}]}
        rg = os.path.join(copie, 'gel.json'); json.dump(cg, open(rg, 'w'))
        r = subprocess.run([sys.executable, sb, rg, '--avant-dossier', os.path.join(copie, 'prepare'), '--tours', '1', '--strict', os.path.join(copie, 'g.json')], capture_output=True, text=True, timeout=120)
        o = json.load(open(os.path.join(copie, 'g.json')))
        av, ap = o['avant']['telephone']['gels']['qualite'], o['apres']['telephone']['gels']['qualite']
        if r.returncode != 1 or av.get('programmes_en_jeu') != 0 or ap.get('programmes_en_jeu') != 24 or av.get('programmes') != 24 or not av.get('prep_ms'):
            raise RuntimeError(f'gel mal mesuré (code {r.returncode}) : avant {av} après {ap}')
    finally:
        shutil.rmtree(jeu, ignore_errors=True); shutil.rmtree(copie, ignore_errors=True)


@controle("captures.py : vues en JSON reproductibles (2 séries identiques), « occupe » attendu (avant : délai fixe = image de préparation), 🐞 caché, références JPEG ½ sans fausse alerte, --avant-dossier voit un changement (--strict code 1 sur alerte seule), vue en échec isolée, erreur JS au chargement rapportée, sortie nettoyée sans toucher aux fichiers étrangers ; compare.py apparie .jpg/.png (png d'abord), ignore planche_*")
def _():
    import numpy as np
    from PIL import Image
    sc = os.path.join(OC, 'captures.py')
    with tempfile.TemporaryDirectory() as d:
        page = open(os.path.join(OC, 'tests', 'captures_factice.html')).read()
        for nom, pg in (('jeu', page), ('autre', page.replace("window.VARIANTE='#2c2'", "window.VARIANTE='#22c'"))):
            os.makedirs(os.path.join(d, nom)); open(os.path.join(d, nom, 'index.html'), 'w').write(pg)
        vues = [{'nom': 'pret', 'js': 'preparer()', 'occupe': 'window.occupe'}, {'nom': 'sans_occupe', 'js': 'preparer()'},
                {'nom': 'casse', 'js': 'pasDeFonction()'}, {'nom': 'apres', 'js': 'window.occupe=false'}]
        cfg = {'jeu': 'factice', 'dossier': os.path.join(d, 'jeu'), 'pret': 'window.pret', 'pret_ms': 50, 'images': 16, 'pas': 162, 'vues': vues,
               'appareils': {'petit': {'largeur': 200, 'hauteur': 220}}}
        reg = os.path.join(d, 'vues.json'); json.dump(cfg, open(reg, 'w'))
        o1 = os.path.join(d, 'o1')
        r = subprocess.run([sys.executable, sc, reg, o1, '--stabilite', '--vues', 'pret,sans_occupe,apres'], capture_output=True, text=True, timeout=120)
        if r.returncode:
            raise RuntimeError('série : ' + (r.stderr or r.stdout)[-300:])
        b = json.load(open(os.path.join(o1, 'captures.json')))
        if any(v > 0.1 for v in b['stabilite'].values()) or len(b['stabilite']) != 3:
            raise RuntimeError(f"séries différentes : {b['stabilite']}")
        px = lambda f, xy: tuple(Image.open(os.path.join(o1, f)).convert('RGB').getpixel(xy))
        if px('pret.png', (5, 5))[1] < 150 or px('sans_occupe.png', (5, 5))[0] < 150:
            raise RuntimeError(f"occupe non attendu : pret {px('pret.png', (5, 5))}, sans_occupe {px('sans_occupe.png', (5, 5))}")
        if px('pret.png', (180, 200)) != px('pret.png', (130, 200)) or px('pret.png', (66, 10)) == (0, 255, 0):
            raise RuntimeError(f"bouton 🐞 ou voyant 🧪 de testkit visible sur la capture : {px('pret.png', (180, 200))} {px('pret.png', (66, 10))}")
        # références légères : JPEG à ½ ; la série PNG comparée à elles ne sonne pas
        rj = os.path.join(d, 'rj'); os.makedirs(rj)
        open(os.path.join(rj, 'perso.txt'), 'w').write('x'); open(os.path.join(rj, 'pret.png'), 'wb').write(b'ancienne')
        Image.new('RGB', (10, 10)).save(os.path.join(rj, 'planche_scenes.png'))
        run(sys.executable, sc, reg, rj, '--format', 'jpg', '--echelle', '0.5', '--vues', 'pret,apres', timeout=120)
        if not os.path.exists(os.path.join(rj, 'perso.txt')) or os.path.exists(os.path.join(rj, 'pret.png')):
            raise RuntimeError('nettoyage de la sortie : fichier étranger effacé, ou ancienne image de la vue laissée')
        im = Image.open(os.path.join(rj, 'pret.jpg'))
        if im.size != (100, 110) or os.path.exists(os.path.join(rj, 'pret.png')):
            raise RuntimeError(f'JPEG ½ : {im.size}')
        r = subprocess.run([sys.executable, sc, reg, os.path.join(d, 'o2'), '--comparer', rj, '--vues', 'pret,apres', '--strict'], capture_output=True, text=True, timeout=120)
        if r.returncode or 'ALERTES 0 / 2' not in r.stdout:
            raise RuntimeError('JPEG ½ contre PNG (planche_* ignorée) : fausse alerte ? ' + r.stdout[-300:])
        # --strict réagit à une ALERTE seule (aucune vue en échec) ; erreur JS du chargement rapportée
        r = subprocess.run([sys.executable, sc, reg, os.path.join(d, 'o4'), '--avant-dossier', os.path.join(d, 'autre'), '--vues', 'pret,apres', '--strict'], capture_output=True, text=True, timeout=180)
        if r.returncode != 1 or 'ALERTES 2 / 2' not in r.stdout or 'échec' in r.stdout:
            raise RuntimeError(f'--strict sur alerte seule (code {r.returncode}) : ' + r.stdout[-300:])
        cfg['page'] = 'index.html?erreur'; json.dump(cfg, open(reg, 'w'))
        r = subprocess.run([sys.executable, sc, reg, os.path.join(d, 'o5'), '--vues', 'apres', '--strict'], capture_output=True, text=True, timeout=120)
        if r.returncode != 1 or 'ERREUR_CHARGEMENT' not in r.stdout:
            raise RuntimeError(f'erreur JS au chargement non rapportée (code {r.returncode}) : ' + r.stdout[-300:])
        cfg['page'] = 'index.html'; json.dump(cfg, open(reg, 'w'))
        # avant/après : la copie « autre » dessine en bleu → alerte et code 1 avec --strict ; la vue cassée n'arrête pas les autres
        r = subprocess.run([sys.executable, sc, reg, os.path.join(d, 'o3'), '--avant-dossier', os.path.join(d, 'autre'), '--strict'], capture_output=True, text=True, timeout=180)
        c = json.load(open(os.path.join(d, 'o3', 'comparaison.json')))
        al = {s['nom'] for s in c['scenes'] if s['alerte']}
        if r.returncode != 1 or not {'pret', 'apres'} <= al or 'casse' not in r.stdout or 'échec' not in r.stdout or c['total'] != 3:
            raise RuntimeError(f'avant/après (code {r.returncode}, alertes {al}) : ' + r.stdout[-400:])



@controle('verif.py : une commande par jeu (construction toujours lancée, statuts ok/réserve/échec/délai/sautée, étape bloquante, captures relues, rapport) + ATELIER_PARAMS')
def _():
    sys.path.insert(0, OC)
    from atelier import ajouter_params
    for u, attendu in (('i.html', 'i.html?v3d=0'), ('i.html?graine=1&v3d=1#h', 'i.html?graine=1&v3d=0#h')):
        if ajouter_params(u, 'v3d=0') != attendu:
            raise RuntimeError(f'ajouter_params({u!r}) = {ajouter_params(u, "v3d=0")!r}, attendu {attendu!r}')
    # banc : un chrono bruité (code identique, tours à contre-sens) n'est plus « plus lent » ; un vrai ralentissement l'est
    import banc as _banc
    mk = lambda v: {'t': {'scenes': {}, 'chronos': {'tour_ms': statistics.median(v)}, 'chronos_valeurs': {'tour_ms': v}}}
    import statistics
    L, al = _banc.ecarts(mk([0.6, 0.7]), mk([1.3, 0.6]), 10)
    if al:
        raise RuntimeError(f'chrono bruité pris pour un ralentissement : {L}')
    L, al = _banc.ecarts(mk([2.0, 2.1]), mk([4.0, 4.2]), 10)
    if not al:
        raise RuntimeError(f'vrai ralentissement de chrono non vu : {L}')
    vf = os.path.join(OC, 'verif.py'); sc = os.path.join(OC, 'captures.py')
    chr_ = os.path.join(RAC, 'bureau', 'retours-outils', 'chronos.jsonl')
    with tempfile.TemporaryDirectory() as d:
        os.makedirs(os.path.join(d, 'jeu'))
        shutil.copy(os.path.join(OC, 'tests', 'captures_factice.html'), os.path.join(d, 'jeu', 'index.html'))
        vues = {'jeu': 'factice', 'dossier': os.path.join(d, 'jeu'), 'pret': 'window.pret', 'pret_ms': 50, 'images': 8, 'pas': 162,
                'vues': [{'nom': 'pret', 'js': 'preparer()', 'occupe': 'window.occupe'}], 'appareils': {'petit': {'largeur': 200, 'hauteur': 220}}}
        rv = os.path.join(d, 'vues.json'); json.dump(vues, open(rv, 'w'))
        run(sys.executable, sc, rv, os.path.join(d, 'refs'), timeout=120)
        marque = os.path.join(d, 'construit.txt')
        sonde_params = "import sys;sys.path.insert(0,%r);from atelier import ajouter_params;print(ajouter_params('i.html?a=1'))" % OC
        cfg = {'jeu': 'factice', 'construire': f'echo construit > {marque}', 'etapes': [
            {'nom': 'Commande juste', 'commande': "python3 -c \"print('bot 77% sur 1000')\"", 'ok_si': '77%', 'chiffres': r'bot (\d+%)'},
            {'nom': 'Parametres', 'commande': f'python3 -c "{sonde_params}"', 'params': 'v3d=0', 'ok_si': r'i\.html\?a=1&v3d=0'},
            {'nom': 'Reserve', 'commande': 'echo rien', 'ok_si': 'introuvable', 'reserve': True},
            {'nom': 'Trop long', 'commande': 'sleep 30', 'delai_s': 1, 'complet': True},
            {'nom': 'Captures', 'captures': rv, 'comparer': os.path.join(d, 'refs')},
            {'nom': 'Poids', 'poids': os.path.join(d, 'jeu', 'index.html'), 'max_mo': 0.0001},
            {'nom': 'Bloquant', 'commande': 'exit 3', 'bloquant': True},
            {'nom': 'Apres le bloquant', 'commande': 'echo jamais'}]}
        rg = os.path.join(d, 'verif.json'); json.dump(cfg, open(rg, 'w'))
        so = os.path.join(d, 'sortie')
        r = subprocess.run([sys.executable, vf, rg, '--sortie', so, '--sans-chrono'], cwd=RAC, capture_output=True, text=True, timeout=240)
        if r.returncode != 1:
            raise RuntimeError(f'code {r.returncode} au lieu de 1 : ' + (r.stdout + r.stderr)[-400:])
        v = {e['nom']: e for e in json.load(open(os.path.join(so, 'verif.json')))['etapes']}
        attendu = {'Construction': 'ok', 'Commande juste': 'ok', 'Parametres': 'ok', 'Reserve': 'reserve', 'Trop long': 'saute', 'Captures': 'ok',
                   'Poids': 'echec', 'Bloquant': 'echec', 'Apres le bloquant': 'saute'}
        vu = {k: x['statut'] for k, x in v.items()}
        if vu != attendu:
            raise RuntimeError(f'statuts {vu}')
        if not os.path.exists(marque) or '77%' not in v['Commande juste']['chiffres'] or '0 alerte(s) sur 1' not in v['Captures']['chiffres']:
            raise RuntimeError(f"construction ou chiffres : {v['Commande juste']['chiffres']} / {v['Captures']['chiffres']}")
        h = open(os.path.join(so, 'rapport.html'), encoding='utf-8').read()
        if 'problème à regarder' not in h or '<img src="img_' not in h or 'Bloquant' not in h:
            raise RuntimeError('rapport.html incomplet')
        # --etapes : la construction est TOUJOURS lancée (sinon on vérifie l'ancienne page) ; délai dépassé = tué vite
        os.remove(marque); t0 = time.time()
        r = subprocess.run([sys.executable, vf, rg, '--sortie', so, '--sans-chrono', '--complet', '--etapes', 'trop'], cwd=RAC, capture_output=True, text=True, timeout=60)
        v = {e['nom']: e['statut'] for e in json.load(open(os.path.join(so, 'verif.json')))['etapes']}
        if r.returncode != 1 or v != {'Construction': 'ok', 'Trop long': 'delai'} or not os.path.exists(marque) or time.time() - t0 > 20:
            raise RuntimeError(f'--etapes / délai : code {r.returncode}, {v}, {time.time()-t0:.0f} s')
        # --etapes qui ne désigne aucune étape du jeu : code 2 (pas « tout est bon » sur la seule construction)
        r = subprocess.run([sys.executable, vf, rg, '--sortie', so, '--sans-chrono', '--etapes', 'zzz'], cwd=RAC, capture_output=True, text=True, timeout=60)
        if r.returncode != 2:
            raise RuntimeError(f'--etapes sans correspondance : code {r.returncode}')
        # sortie dans le dépôt (ex. le dossier des réglages <jeu>/outils) : refusée, rien d'effacé
        r = subprocess.run([sys.executable, vf, rg, '--sortie', os.path.join(OC, 'tests'), '--sans-chrono'], cwd=RAC, capture_output=True, text=True, timeout=60)
        if r.returncode != 2 or not os.path.exists(os.path.join(OC, 'tests', 'captures_factice.html')):
            raise RuntimeError(f'sortie dans le dépôt acceptée (code {r.returncode})')
        # expression invalide dans les réglages : code 2 avant de lancer quoi que ce soit
        mauvais = dict(cfg, etapes=[{'nom': 'x', 'commande': 'true', 'chiffres': '('}]); rm_ = os.path.join(d, 'mauvais.json'); json.dump(mauvais, open(rm_, 'w'))
        r = subprocess.run([sys.executable, vf, rm_, '--sortie', so, '--sans-chrono'], cwd=RAC, capture_output=True, text=True, timeout=60)
        if r.returncode != 2 or 'invalide' not in r.stdout:
            raise RuntimeError(f'regex invalide : code {r.returncode} ' + (r.stdout + r.stderr)[-200:])
        # sortie qui ne vient pas de verif.py : jamais effacée
        autre = os.path.join(d, 'autre'); os.makedirs(autre); open(os.path.join(autre, 'a.txt'), 'w').write('x')
        r = subprocess.run([sys.executable, vf, rg, '--sortie', autre, '--sans-chrono'], cwd=RAC, capture_output=True, text=True, timeout=60)
        if r.returncode != 2 or not os.path.exists(os.path.join(autre, 'a.txt')):
            raise RuntimeError('dossier de sortie étranger effacé ou accepté')
        if os.path.exists(chr_) and d in open(chr_, encoding='utf-8').read():  # (une autre conversation peut écrire au même moment)
            raise RuntimeError('--sans-chrono a écrit dans chronos.jsonl')

@controle("profil3d.py (banc.py --profil) : moteur et scène Three.js trouvés sans réglage, forêt lourde en tête (≥ 50 % de l'image), ombres/brouillard/lumières/résolution essayés, objet remis visible par le jeu signalé, tout remis en place après le profil, bruit mesuré ; page sans three.js = erreur claire ; banc sans --profil inchangé (aucun crochet) ; --profil --avant et --images sans --profil refusés")
def _():
    three = next((os.path.join(RAC, c) for c in ('bannieres/jeu/lib/three.js', 'couronnes-et-lignees/jeu/three.js')
                  if os.path.exists(os.path.join(RAC, c)) and 'var THREE=' in open(os.path.join(RAC, c)).read(200)), None)
    if not three:
        raise RuntimeError('aucune copie globale de three.js (var THREE=…) trouvée dans le dépôt pour la page factice')
    pr = os.path.join(OC, 'profil3d.py')
    with tempfile.TemporaryDirectory() as d:
        shutil.copy(three, os.path.join(d, 'three.js'))
        page = open(os.path.join(OC, 'tests', 'profil3d_factice.html')).read().replace('FINESSE', '40').replace('NARBRES', '120')
        open(os.path.join(d, 'index.html'), 'w').write(page)
        open(os.path.join(d, 'vide.html'), 'w').write('<!doctype html><body><canvas></canvas><script>requestAnimationFrame(function f(){requestAnimationFrame(f)});window.pret=1</script>')
        etat = "({visibles:sc.children.every(o=>o.visible)&&foret.children.every(o=>o.visible),ombres:r.shadowMap.enabled,brouillard:!!sc.fog,lampe:lp.visible,pr:r.getPixelRatio()})"
        cfg = {'jeu': 'factice', 'dossier': d, 'page': 'index.html', 'pret': 'window.pret', 'pret_ms': 100, 'images': 10,
               'scenes': [{'nom': 'foret', 'attente_ms': 100}, {'nom': 'apres', 'attente_ms': 50, 'infos': etat}]}
        rg = os.path.join(d, 'banc.json'); json.dump(cfg, open(rg, 'w'))
        t = time.time()
        r = subprocess.run([sys.executable, pr, rg, os.path.join(d, 'o.json'), '--scenes', 'foret,apres'], capture_output=True, text=True, timeout=240)
        o = json.load(open(os.path.join(d, 'o.json')))['appareils']['telephone']['scenes']
        p = o['foret'].get('profil') or {}
        if r.returncode or 'variantes' not in p or not json.load(open(os.path.join(d, 'o.json'))).get('profil'):
            raise RuntimeError(f'profil absent (code {r.returncode}) : {p} ' + (r.stdout + r.stderr)[-300:])
        v = {x['nom']: x for x in p['variantes']}
        tete = p['variantes'][0]
        if tete['nom'] != 'foret/arbre' or tete['objets'] != 120 or tete['gain_pct'] < 50 or tete['appels_en_moins'] < 100:
            raise RuntimeError(f"forêt pas en tête : {tete} ; " + ', '.join(f"{x['nom']} {x['gain_pct']}" for x in p['variantes']))
        noms = ' | '.join(v)
        for att in ('sans ombres', 'sans brouillard', 'sans lumières ponctuelles', 'résolution ½', 'sol', 'roche'):
            if att not in noms:
                raise RuntimeError(f'variante « {att} » absente : {noms}')
        if not v.get('balise', {}).get('remis_par_le_jeu'):
            raise RuntimeError(f"objet remis visible par le jeu non signalé : {v.get('balise')}")
        if len(p.get('scenes', [])) != 1 or p['scenes'][0]['enfants'] != 9 or p.get('bruit_pct') is None or len(p.get('bases_ms', [])) < 3:
            raise RuntimeError(f"scène ou bruit mal relevés : {p.get('scenes')} bases {p.get('bases_ms')}")
        if o['apres'].get('infos') != {'visibles': True, 'ombres': True, 'brouillard': True, 'lampe': True, 'pr': 1}:
            raise RuntimeError(f"page pas remise en place après le profil : {o['apres'].get('infos')}")
        if 'foret/arbre' not in r.stdout or '◀' not in r.stdout:
            raise RuntimeError('tableau lisible absent : ' + r.stdout[-300:])
        if time.time() - t > 150:
            raise RuntimeError(f'profil trop lent : {time.time()-t:.0f} s')
        # page sans three.js : erreur claire, pas de plantage
        cv = dict(cfg, page='vide.html', scenes=[{'nom': 'v', 'attente_ms': 50}]); rv = os.path.join(d, 'vide.json'); json.dump(cv, open(rv, 'w'))
        r = subprocess.run([sys.executable, pr, rv, os.path.join(d, 'v.json')], capture_output=True, text=True, timeout=120)
        pv = json.load(open(os.path.join(d, 'v.json')))['appareils']['telephone']['scenes']['v'].get('profil', {})
        if r.returncode or 'aucun moteur Three.js' not in pv.get('erreur', '') or 'profil impossible' not in r.stdout:
            raise RuntimeError(f'page sans three.js : {pv} ' + r.stdout[-200:])
        # banc ordinaire : aucun crochet, aucune clé « profil » ; --profil avec --avant refusé
        cb = dict(cfg, scenes=[{'nom': 'apres', 'attente_ms': 50, 'infos': "typeof __profil3d==='undefined'&&typeof __THREE_DEVTOOLS__==='undefined'"}])
        rb = os.path.join(d, 'banc_ordinaire.json'); json.dump(cb, open(rb, 'w'))
        r = subprocess.run([sys.executable, os.path.join(OC, 'banc.py'), rb, os.path.join(d, 'b.json')], capture_output=True, text=True, timeout=120)
        b = json.load(open(os.path.join(d, 'b.json')))
        b = dict(b['appareils']['telephone']['scenes']['apres'], _marque=b.get('profil'))
        if r.returncode or 'profil' in b or 'ms' not in b or b.get('infos') is not True or b['_marque']:
            raise RuntimeError(f'banc ordinaire modifié : {b}')
        r = subprocess.run([sys.executable, pr, rg, '--avant', 'HEAD'], capture_output=True, text=True, timeout=30)
        if r.returncode == 0 or 'une seule version' not in r.stderr:
            raise RuntimeError('--profil --avant accepté : ' + (r.stdout + r.stderr)[-200:])
        r = subprocess.run([sys.executable, os.path.join(OC, 'banc.py'), rg, '--images', '5'], capture_output=True, text=True, timeout=30)
        if r.returncode == 0 or 'vont avec --profil' not in r.stderr:
            raise RuntimeError('--images sans --profil accepté en silence')

@controle("banc/captures --avant, page à chemin absolu (retour Cage 18/11 : /home/claude/cg.html recopiait tout /home/claude puis shutil.Error) : dossier PARTAGÉ → seulement la page (+ \"sorties\"), fichier d'une autre conversation ni effacé ni remis, APRÈS servi avec ses sous-dossiers ; dossier propre → tout suivi (sous-dossier, lien vers dossier), fichiers SUPPRIMÉS par la construction de l'AVANT remis (même si elle échoue) ; page absente + \"construire\" → construite d'office")
def _():
    sys.path.insert(0, OC)
    import banc as B_
    if B_.dossier_propre(RAC) or B_.dossier_propre(os.path.dirname(RAC)) or B_.dossier_propre('/') or B_.dossier_propre(tempfile.gettempdir()):
        raise RuntimeError('dépôt, son dossier parent, / ou /tmp pris pour un dossier propre à la page')
    with tempfile.TemporaryDirectory() as d:
        P = os.path.join(d, 'partage'); os.makedirs(os.path.join(P, '.git')); os.makedirs(os.path.join(P, 'assets'))
        open(os.path.join(P, 'page.html'), 'w').write('APRES'); open(os.path.join(P, 'voisin.png'), 'w').write('img')
        open(os.path.join(P, 'assets', 'x.js'), 'w').write('x'); os.symlink(os.path.join(P, 'assets'), os.path.join(P, 'lien'))
        open(os.path.join(P, 'autre.html'), 'w').write('AUTRE v1')
        tmp = os.path.join(d, 'tmp'); os.makedirs(tmp)
        # pendant la construction de l'AVANT, « une autre conversation » réécrit autre.html et crée la sienne
        cfg = {'construire': f"echo AVANT > {P}/page.html; echo AUTRE v2 > {P}/autre.html; echo z > {P}/sienne.html"}
        ap, av = B_.mettre_de_cote(P, cfg, tmp, 'page.html')
        if open(os.path.join(P, 'page.html')).read() != 'APRES':
            raise RuntimeError('dossier partagé : APRÈS non remis')
        if open(os.path.join(P, 'autre.html')).read().strip() != 'AUTRE v2' or not os.path.exists(os.path.join(P, 'sienne.html')):
            raise RuntimeError('dossier partagé : fichiers d\'une autre conversation ramenés en arrière ou effacés')
        if open(os.path.join(av, 'page.html')).read().strip() != 'AVANT' or open(os.path.join(av, 'assets', 'x.js')).read() != 'x' or open(os.path.join(av, 'voisin.png')).read() != 'img':
            raise RuntimeError('AVANT servi faux ou sans ses voisins / sous-dossiers')
        if os.path.realpath(ap) != os.path.realpath(P) or os.listdir(os.path.join(tmp, '.banc_apres')) != ['page.html']:
            raise RuntimeError(f'dossier partagé : APRÈS servi depuis {ap} (sans ses sous-dossiers ?) ou autres fichiers copiés')
        # dossier propre : sous-dossier et lien vers dossier suivis ; fichiers supprimés remis
        Q = os.path.join(d, 'banc', 'jeu'); os.makedirs(os.path.join(Q, 'img')); os.makedirs(os.path.join(d, 'ext'))
        open(os.path.join(Q, 'page.html'), 'w').write('APRES'); open(os.path.join(Q, 'img', 'a.png'), 'w').write('a2')
        open(os.path.join(Q, 'img', 'nouveau.png'), 'w').write('n'); open(os.path.join(d, 'ext', 't.jpg'), 'w').write('t')
        os.symlink('../../ext', os.path.join(Q, 'tex'))
        if not B_.dossier_propre(Q, 'page.html') or B_.dossier_propre(P, 'page.html'):
            raise RuntimeError('dossier propre / partagé mal reconnu')
        tmp2 = os.path.join(d, 'tmp2'); os.makedirs(tmp2)
        ap, av = B_.mettre_de_cote(Q, {'construire': f"rm -r {Q}/img; mkdir {Q}/img; echo AVANT > {Q}/page.html; echo a1 > {Q}/img/a.png"}, tmp2, 'page.html')
        if open(os.path.join(Q, 'img', 'a.png')).read() != 'a2' or open(os.path.join(av, 'img', 'a.png')).read().strip() != 'a1':
            raise RuntimeError('dossier propre : sous-dossier non suivi')
        if not os.path.exists(os.path.join(Q, 'img', 'nouveau.png')) or os.path.exists(os.path.join(av, 'img', 'nouveau.png')):
            raise RuntimeError('fichier supprimé par la construction de l\'AVANT : non remis, ou présent dans l\'AVANT')
        if not os.path.exists(os.path.join(ap, 'tex', 't.jpg')) or not os.path.exists(os.path.join(av, 'tex', 't.jpg')):
            raise RuntimeError('lien vers un dossier oublié')
        tmp3 = os.path.join(d, 'tmp3'); os.makedirs(tmp3)
        try:
            B_.mettre_de_cote(Q, {'construire': f"rm {Q}/page.html; exit 1"}, tmp3, 'page.html')
            raise RuntimeError('construction ratée non signalée')
        except RuntimeError as e:
            if 'échouée' not in str(e):
                raise
        if not os.path.exists(os.path.join(Q, 'page.html')) or open(os.path.join(Q, 'page.html')).read() != 'APRES':
            raise RuntimeError('construction ratée qui efface la page : APRÈS perdu')
        # page absente + "construire" : construite d'office (avant : « page APRÈS introuvable », code 2)
        F = os.path.join(d, 'neuf', 'p.html')
        B_.assurer_page({'construire': f'mkdir -p {os.path.dirname(F)} && echo ok > {F}'}, os.path.dirname(F), 'p.html', 'APRÈS')
        if not os.path.exists(F):
            raise RuntimeError('page absente non construite d\'office')
        try:
            B_.assurer_page({}, os.path.join(d, 'rien'), 'p.html', 'APRÈS'); raise RuntimeError('page absente sans "construire" acceptée')
        except B_.PageAbsente:
            pass


@controle("verrou.py : bancs seuls, robots ensemble (R1 ∥ R2 → banc → R3 arrivé pendant que le banc attendait : file d'attente), qui tient la machine dit ; captures.py attend un banc (--attente-max → code 3) et passe avec --sans-verrou ; verif.py : commande du jeu sous verrou robot, VERROU_TENU transmis")
def _():
    V = os.path.join(OC, 'verrou.py')
    env = dict(os.environ, BANC_VERROU=os.path.join(tempfile.gettempdir(), f'verrou-ctl-{os.getpid()}.verrou'))
    with tempfile.TemporaryDirectory() as d:
        log = os.path.join(d, 'log')
        def lance(mode, nom, s):
            return subprocess.Popen([sys.executable, V, mode, '--nom', nom, '--', 'sh', '-c', f'echo "$(date +%s.%N) debut {nom} $VERROU_TENU" >> {log}; sleep {s}; echo "$(date +%s.%N) fin {nom}" >> {log}'],
                                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env)
        r1 = lance('robot', 'R1', 1.5); time.sleep(0.4)
        r2 = lance('robot', 'R2', 1.5); time.sleep(0.4)
        b = lance('banc', 'B', 1); time.sleep(0.6)
        r3 = lance('robot', 'R3', 0.3)
        for p_ in (r1, r2, b, r3):
            p_.wait(timeout=30)
        ev = sorted((l.split() for l in open(log)), key=lambda x: float(x[0]))
        ordre = ' '.join(f'{x[1]}-{x[2]}' for x in ev)
        if ordre != 'debut-R1 debut-R2 fin-R1 fin-R2 debut-B fin-B debut-R3 fin-R3':
            raise RuntimeError('ordre : ' + ordre)
        if not all(x[3] in ('robot', 'banc') for x in ev if x[1] == 'debut'):
            raise RuntimeError('VERROU_TENU non transmis')
        sb, s3 = b.stdout.read(), r3.stdout.read()
        if 'des robots tournent' not in sb or 'R1' not in sb or 'un banc attend son tour' not in s3:
            raise RuntimeError('messages : ' + sb[-200:] + ' | ' + s3[-200:])
        # captures.py pendant un banc : attend (ici abandon après 2 s, code 3), --sans-verrou passe
        open(os.path.join(d, 'index.html'), 'w').write('<body style="background:#2c2"><script>window.pret=1</script>')
        reg = os.path.join(d, 'vues.json')
        json.dump({'jeu': 'factice', 'dossier': d, 'pret': 'window.pret', 'vues': [{'nom': 'v'}], 'appareils': {'p': {'largeur': 100, 'hauteur': 100}}}, open(reg, 'w'))
        bt = subprocess.Popen([sys.executable, V, 'banc', '--', 'sleep', '8'], env=env); time.sleep(0.6)
        try:
            r = subprocess.run([sys.executable, os.path.join(OC, 'captures.py'), reg, os.path.join(d, 'o'), '--attente-max', '2'], capture_output=True, text=True, timeout=60, env=env)
            if r.returncode != 3 or 'un banc mesure' not in r.stdout:
                raise RuntimeError(f'captures pendant un banc : code {r.returncode} ' + r.stdout[-200:])
            r = subprocess.run([sys.executable, os.path.join(OC, 'captures.py'), reg, os.path.join(d, 'o'), '--sans-verrou'], capture_output=True, text=True, timeout=60, env=env)
            if r.returncode or not os.path.exists(os.path.join(d, 'o', 'v.png')):
                raise RuntimeError('captures --sans-verrou : ' + (r.stdout + r.stderr)[-200:])
            # verif.py : la commande du jeu attend aussi le banc (attente_max_s 1 → abandon)
            vj = os.path.join(d, 'verif.json')
            json.dump({'jeu': 'factice', 'etapes': [{'nom': 'robot du jeu', 'commande': 'echo tenu=$VERROU_TENU', 'attente_max_s': 1}]}, open(vj, 'w'))
            r = subprocess.run([sys.executable, os.path.join(OC, 'verif.py'), vj, '--sortie', os.path.join(d, 'vs'), '--sans-chrono'], capture_output=True, text=True, timeout=60, env=env)
            if r.returncode != 1 or not os.path.exists(os.path.join(d, 'vs', 'rapport.html')) or 'machine tenue' not in open(os.path.join(d, 'vs', 'verif.json')).read():
                raise RuntimeError('verif.py : commande lancée pendant un banc, ou abandon sans rapport : ' + (r.stdout + r.stderr)[-200:])
            # un processus qui tient le verrou : ses enfants ne le reprennent pas (sinon : enfant derrière un banc qui attend le parent)
            sys.path.insert(0, OC)
            import verrou as V_
            ancien_v = os.environ['BANC_VERROU']; os.environ['BANC_VERROU'] = env['BANC_VERROU']
        finally:
            bt.wait(timeout=30)
        j, _a = V_.prendre('robot', 'parent')
        try:
            if os.environ.get('VERROU_TENU') != 'robot':
                raise RuntimeError('VERROU_TENU non posé par prendre()')
            r = subprocess.run([sys.executable, V, 'robot', '--attente-max', '3', '--', 'true'], capture_output=True, text=True, timeout=30)
            if r.returncode:
                raise RuntimeError('enfant d\'un tenant du verrou bloqué : ' + r.stdout[-200:])
        finally:
            j.close(); os.environ['BANC_VERROU'] = ancien_v
        if 'VERROU_TENU' in os.environ:
            raise RuntimeError('VERROU_TENU non rendu après close()')
        r = subprocess.run([sys.executable, os.path.join(OC, 'verif.py'), vj, '--sortie', os.path.join(d, 'vs'), '--sans-chrono'], capture_output=True, text=True, timeout=60, env=env)
        jr = os.path.join(d, 'vs', 'robot-du-jeu', 'journal.txt')
        if r.returncode or not os.path.exists(jr) or 'tenu=robot' not in open(jr).read():
            raise RuntimeError('verif.py : commande non lancée sous verrou robot : ' + (r.stdout + r.stderr)[-300:])
    for x in ('', '.file'):
        try:
            os.remove(env['BANC_VERROU'] + x)
        except OSError:
            pass
    shutil.rmtree(env['BANC_VERROU'] + '.qui', ignore_errors=True)


@controle('banc.py : scène « action » (jeux DOM/SVG : coût d\'un clic jusqu\'à l\'AFFICHAGE, dessin hors fil principal compris, vide déduit, plancher = JS), avant/après sensible au dessin, -h, réglages absents, dossier d\'une page à chemin absolu créé d\'office, pas d\'Infinity dans la sortie')
def _():
    sb = os.path.join(OC, 'banc.py')
    for outil in ('banc.py', 'captures.py', 'verif.py'):  # avant le 18/11 : « -h » lu comme un fichier de réglages (FileNotFoundError)
        if len(run(sys.executable, os.path.join(OC, outil), '-h')) < 200:
            raise RuntimeError(f'{outil} -h : pas d\'aide')
    out = run(sys.executable, sb, 'reglages_absents.json', attendu=2)
    if 'introuvables' not in out:
        raise RuntimeError('réglages absents : ' + out[-200:])
    src = os.path.join(OC, 'tests', 'action_factice.html')
    with tempfile.TemporaryDirectory() as d:
        page = os.path.join(d, 'nouveau', 'sous', 'p.html')  # dossier inexistant : la construction doit pouvoir y écrire
        cfg = {'jeu': 'factice', 'fichier': page, 'construire': f'cp {src} {page}', 'pret': 'window.pret', 'pret_ms': 100, 'images': 20,
               'appareils': {'ordinateur': {'largeur': 1024, 'hauteur': 700}},
               'scenes': [{'nom': 'repos', 'attente_ms': 100}, {'nom': 'rien', 'action': '0', 'attente_ms': 0, 'repetitions': 6},
                          {'nom': 'travail', 'action': 'travail(2e6)', 'attente_ms': 0, 'repetitions': 6},
                          {'nom': 'peindre', 'action': 'peindre()', 'attente_ms': 0, 'repetitions': 8}]}
        reg = os.path.join(d, 'banc.json'); json.dump(cfg, open(reg, 'w'))
        sortie = os.path.join(d, 'r.json')
        out = run(sys.executable, sb, reg, sortie, '--construire', timeout=180)
        def refus(x):
            raise RuntimeError(f'valeur non JSON dans la sortie : {x}')
        r = json.loads(open(sortie).read(), parse_constant=refus)['appareils']['ordinateur']['scenes']
        if 'action' not in r['repos'].get('note', ''):
            raise RuntimeError('scène sans image : la note ne propose pas « action » : ' + str(r['repos'])[:200])
        ri, tr, pe = r['rien'], r['travail'], r['peindre']
        if not all(x.get('action') for x in (ri, tr, pe)):
            raise RuntimeError('mesures action absentes : ' + json.dumps(r)[:300])
        if ri['ms'] > 3:
            raise RuntimeError(f"action vide : {ri['ms']} ms (le trajet vide n'est pas déduit)")
        if not (tr['js_ms'] > 5 and tr['ms'] >= 0.9 * tr['js_ms'] and tr['raster_ms'] < 0.5 * tr['ms']):
            raise RuntimeError(f"action JS : {tr}")
        if not (pe['ms'] > 6 and pe['ms'] > 4 * pe['js_ms'] and pe['js_ms'] < 5):  # presque pas de JS, beaucoup de dessin : compté
            raise RuntimeError(f"action de dessin : le dessin n'est pas compté (ms ≈ JS) : {pe}")
        # jeu à boucle d'animation (≈ 4e5 tours de calcul par image) : une action vide reste ≈ 0 (l'image du jeu est déduite) ;
        # action qui attend une image du jeu en temps figé : abandon après "delai_s" avec un message, pas un banc bloqué
        c2 = dict(cfg, parametres='?boucle=1', scenes=[{'nom': 'rien', 'action': '0', 'attente_ms': 0, 'repetitions': 6},
                                                       {'nom': 'bloque', 'action': '()=>new Promise(r=>requestAnimationFrame(r))', 'delai_s': 3, 'attente_ms': 0}])
        json.dump(c2, open(reg, 'w'))
        run(sys.executable, sb, reg, sortie, timeout=120)
        r = json.load(open(sortie))['appareils']['ordinateur']['scenes']
        if r['rien'].get('ms', 99) > 3 or 'sans fin' not in r['bloque'].get('erreur', ''):
            raise RuntimeError(f"boucle d'animation / action sans fin : {r}")
        # avant/après : AVANT = même page sans flou, 4 disques au lieu de 120 (dessin léger) ; le dessin plus lourd doit être vu, l'action vide rester « égale »
        av = os.path.join(d, 'avant'); os.makedirs(av)
        open(os.path.join(av, 'p.html'), 'w').write(open(src).read().replace('filter:blur(30px) drop-shadow(0 0 40px #000)', '').replace('i<120', 'i<4'))
        cfg['scenes'] = [x for x in cfg['scenes'] if x['nom'] in ('rien', 'peindre')]
        json.dump(cfg, open(reg, 'w'))
        r = subprocess.run([sys.executable, sb, reg, sortie, '--avant-page', os.path.join(av, 'p.html'), '--tours', '2', '--strict'],
                           capture_output=True, text=True, timeout=240)
        e = {x['scene']: x['verdict'] for x in json.load(open(sortie))['ecarts']}
        if r.returncode != 1 or e.get('peindre') != 'plus lent' or e.get('rien', '').startswith('plus'):
            raise RuntimeError(f'avant/après : code {r.returncode}, verdicts {e} ' + r.stdout[-300:])


ROBOT_HORS_VERROU = """import asyncio, sys
from playwright.async_api import async_playwright
async def m():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        if sys.argv[2] == 'occupe':
            await pg.set_content('<script>var x=0;(function f(){for(var i=0;i<3e6;i++)x+=i%7;setTimeout(f,0)})()</script>')
        print('pret', flush=True)
        await asyncio.sleep(float(sys.argv[1]))
asyncio.run(m())
"""


@controle("verrou.py : navigateurs HORS VERROU (robot d'un jeu lancé tel quel) — etat les liste (lanceur, % cpu, ACTIF/calme) au lieu de « machine libre » ; un banc attend la fin d'un navigateur actif, pas d'un calme ; --attente-navigateurs 0 = pas d'attente mais noté ; ses propres navigateurs exclus ; orphelin (lanceur disparu) signalé sans attente")
def _():
    V = os.path.join(OC, 'verrou.py')
    env = dict(os.environ, BANC_VERROU=os.path.join(tempfile.gettempdir(), f'verrou-nav-{os.getpid()}.verrou'))
    env.pop('VERROU_NAVIGATEURS', None)
    with tempfile.TemporaryDirectory() as d:
        rob = os.path.join(d, 'robot_du_jeu.py'); open(rob, 'w').write(ROBOT_HORS_VERROU)
        def lancer(s, quoi):
            p = subprocess.Popen([sys.executable, rob, str(s), quoi], stdout=subprocess.PIPE, text=True, env=env)
            if p.stdout.readline().strip() != 'pret':
                raise RuntimeError('robot factice : Chromium ne démarre pas')
            return p
        p = lancer(7, 'occupe')
        try:
            out = subprocess.run([sys.executable, V, 'etat'], capture_output=True, text=True, env=env, timeout=30).stdout
            if 'robot_du_jeu.py' not in out or 'ACTIF' not in out or 'machine libre' in out:
                raise RuntimeError('etat ne voit pas le navigateur actif hors verrou : ' + out[-300:])
            t = time.time()
            r = subprocess.run([sys.executable, V, 'banc', '--attente-navigateurs', '60', '--', 'echo', 'MESURE'], capture_output=True, text=True, env=env, timeout=90)
            dt = time.time() - t
            if r.returncode or 'HORS VERROU' not in r.stdout or 'terminés' not in r.stdout or dt < 3 or p.poll() is None:
                raise RuntimeError(f'le banc n\'a pas attendu la fin du navigateur actif ({dt:.1f} s, robot fini : {p.poll() is not None}) : ' + r.stdout[-300:])
        finally:
            p.kill(); p.wait()
        p = lancer(25, 'calme')  # page vide : présent mais calme → aucune attente
        try:
            t = time.time()
            r = subprocess.run([sys.executable, V, 'banc', '--', 'echo', 'MESURE'], capture_output=True, text=True, env=env, timeout=60)
            if r.returncode or 'MESURE' not in r.stdout or time.time() - t > 12 or 'HORS VERROU' in r.stdout:
                raise RuntimeError(f'navigateur calme : le banc a attendu ({time.time() - t:.1f} s) ' + r.stdout[-200:])
            out = subprocess.run([sys.executable, V, 'etat'], capture_output=True, text=True, env=env, timeout=30).stdout
            if '(calme)' not in out:
                raise RuntimeError('etat : navigateur calme non signalé : ' + out[-200:])
        finally:
            p.kill(); p.wait()
        p = lancer(25, 'occupe')
        try:
            t = time.time()
            r = subprocess.run([sys.executable, V, 'banc', '--attente-navigateurs', '0', '--', 'echo', 'MESURE'], capture_output=True, text=True, env=env, timeout=60)
            if r.returncode or time.time() - t > 12 or 'encore actifs' not in r.stdout:
                raise RuntimeError(f'--attente-navigateurs 0 : {time.time() - t:.1f} s ' + r.stdout[-200:])
        finally:
            p.kill(); p.wait()
    # navigateur ORPHELIN (lanceur disparu, rattaché au processus 1) : vu et signalé, jamais attendu
    nav = shutil.which('chromium') or next(iter(sorted(__import__('glob').glob('/opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell'))), None)
    if nav:
        d = tempfile.mkdtemp(prefix='verif-orphelin-')
        if True:
            h = os.path.join(d, 'o.html'); open(h, 'w').write('<script>var x=0;(function f(){for(var i=0;i<3e6;i++)x+=i%7;setTimeout(f,0)})()</script>')
            subprocess.run(f'setsid {nav} --headless --no-sandbox --remote-debugging-port=0 --user-data-dir={d}/u file://{h} >/dev/null 2>&1 &', shell=True)
            try:
                time.sleep(3)
                out = subprocess.run([sys.executable, V, 'etat'], capture_output=True, text=True, env=env, timeout=30).stdout
                t = time.time()
                r = subprocess.run([sys.executable, V, 'banc', '--attente-navigateurs', '60', '--', 'echo', 'MESURE'], capture_output=True, text=True, env=env, timeout=90)
                if 'ORPHELIN' not in out or 'machine libre' in out or time.time() - t > 15 or 'ORPHELIN' not in r.stdout:
                    raise RuntimeError(f'orphelin : etat {out[-200:]!r} ; banc {time.time() - t:.1f} s {r.stdout[-200:]!r}')
            finally:
                subprocess.run(['pkill', '-f', f'user-data-dir={d}/u']); time.sleep(1)
                shutil.rmtree(d, ignore_errors=True)
    # ses propres navigateurs (lancés par ce processus) ne comptent pas
    sys.path.insert(0, OC)
    import verrou as V_
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        b = pw.chromium.launch(); pg = b.new_page(); pg.set_content('<b>x</b>')
        if [n for n in V_.navigateurs(0.5) if n['lanceur_pid'] == os.getpid() or n['pid'] in (os.getpid(),)]:
            raise RuntimeError('le propre navigateur du processus est compté hors verrou')
        b.close()
    for x in ('', '.file'):
        try:
            os.remove(env['BANC_VERROU'] + x)
        except OSError:
            pass
    shutil.rmtree(env['BANC_VERROU'] + '.qui', ignore_errors=True)


@controle("banc.py / captures.py --avant arrivee : début du chantier en cours (commit qui a ouvert bureau/chantiers/<jeu>.md), commits faits en route dans l'APRÈS, chantier ré-ouvert = nouvelle base (ralentissement commité en route vu « plus lent », invisible avec HEAD qui avertit) ; arrivée non commitée ou aucun chantier = HEAD")
def _():
    if not shutil.which('git'):
        raise RuntimeError('git absent')
    with tempfile.TemporaryDirectory() as d:
        rac = os.path.join(d, 'depot'); os.makedirs(os.path.join(rac, 'bureau', 'chantiers')); os.makedirs(os.path.join(rac, 'jeu', 'outils'))
        shutil.copytree(OC, os.path.join(rac, 'outils-communs'), ignore=shutil.ignore_patterns('__pycache__', 'node_modules'))
        g = lambda *a: subprocess.run(['git', '-C', rac, '-c', 'user.name=t', '-c', 'user.email=t@t', *a], capture_output=True, text=True, check=True).stdout.strip()
        src = open(os.path.join(OC, 'tests', 'action_factice.html')).read()
        leger = src.replace('filter:blur(30px) drop-shadow(0 0 40px #000)', '').replace('i<120', 'i<4')
        open(os.path.join(rac, 'jeu', 'p.html'), 'w').write(leger)
        cfg = {'jeu': 'jeu', 'fichier': 'jeu/p.html', 'pret': 'window.pret', 'pret_ms': 100, 'images': 20,
               'appareils': {'ordinateur': {'largeur': 1024, 'hauteur': 700}},
               'scenes': [{'nom': 'peindre', 'action': 'peindre()', 'attente_ms': 0, 'repetitions': 8}]}
        json.dump(cfg, open(os.path.join(rac, 'jeu', 'outils', 'banc.json'), 'w'))
        g('init', '-q'); g('add', '-A'); g('commit', '-qm', 'départ')
        sys.path.insert(0, OC)
        import banc as B_
        ancien = B_.RAC
        try:
            B_.RAC = rac; dits = []
            if B_.resoudre_avant('arrivee', 'jeu', dits.append)[0] != 'HEAD' or 'aucun chantier' not in dits[-1]:
                raise RuntimeError('sans chantier : ' + str(dits))
            open(os.path.join(rac, 'bureau', 'chantiers', 'jeu.md'), 'w').write('objet: essai\ndepuis: 2026-11-18 21:00\n')
            if B_.resoudre_avant('arrivee', 'jeu', dits.append)[0] != 'HEAD' or 'pas encore commitée' not in dits[-1]:
                raise RuntimeError('arrivée non commitée : ' + str(dits))
            g('add', '-A'); g('commit', '-qm', 'arrivée (1er chantier)'); premier = g('rev-parse', 'HEAD')
            # chantier ré-ouvert par-dessus (bureau.py réécrit le fichier : modification, pas ajout) → base = la NOUVELLE arrivée
            open(os.path.join(rac, 'jeu', 'notes.txt'), 'w').write('entre deux chantiers'); g('add', '-A'); g('commit', '-qm', 'entre deux')
            open(os.path.join(rac, 'bureau', 'chantiers', 'jeu.md'), 'w').write('objet: essai 2\ndepuis: 2026-11-18 22:00\n')
            g('commit', '-qam', 'arrivée (ré-ouverture)'); arr = g('rev-parse', 'HEAD')
            if B_.resoudre_avant('arrivee', 'jeu', dits.append)[0] != arr or arr == premier:
                raise RuntimeError('chantier ré-ouvert : base = ancienne arrivée ' + str(dits[-1:]))
        finally:
            B_.RAC = ancien
        open(os.path.join(rac, 'jeu', 'p.html'), 'w').write(src)  # dessin 30× plus lourd, COMMITÉ en route
        g('commit', '-qam', 'ralentissement commité en route')
        open(os.path.join(rac, 'jeu', 'notes.txt'), 'w').write('travail en cours')
        sb = os.path.join(rac, 'outils-communs', 'banc.py'); reg = os.path.join(rac, 'jeu', 'outils', 'banc.json')
        verdicts = {}
        for rev in ('HEAD', 'arrivee'):
            so = os.path.join(d, f'{rev}.json')
            r = subprocess.run([sys.executable, sb, reg, so, '--avant', rev, '--tours', '2'], capture_output=True, text=True, timeout=300, cwd=rac)
            if r.returncode:
                raise RuntimeError(f'banc --avant {rev} : code {r.returncode} ' + (r.stderr or r.stdout)[-300:])
            o = json.load(open(so))
            verdicts[rev] = (o['ecarts'][0]['verdict'], o['avant_rev'], r.stdout)
        if verdicts['arrivee'][0] != 'plus lent' or not verdicts['arrivee'][1].startswith('arrivee ' + arr[:7]):
            raise RuntimeError(f"arrivee : {verdicts['arrivee'][:2]} " + verdicts['arrivee'][2][-300:])
        if verdicts['HEAD'][0] == 'plus lent' or "touchent déjà jeu/" not in verdicts['HEAD'][2]:
            raise RuntimeError(f"HEAD : {verdicts['HEAD'][:2]} (avertissement attendu) " + verdicts['HEAD'][2][-300:])


if '--reseau' in sys.argv:
    @controle('phget.py : liste de fichiers Poly Haven')
    def _():
        spec = importlib.util.spec_from_file_location('phget', os.path.join(OC, 'phget.py'))
        m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
        if 'Diffuse' not in json.dumps(m.files('rock_wall')):
            raise RuntimeError('réponse inattendue')

for _x in ('', '.file'):
    try:
        os.remove(os.environ['BANC_VERROU'] + _x)
    except OSError:
        pass
shutil.rmtree(os.environ['BANC_VERROU'] + '.qui', ignore_errors=True)
ok = sum(1 for r in RES if r[1])
for nom, bon, err, d in RES:
    print(f"{'OK    ' if bon else 'ÉCHEC '} {nom} ({d:.1f} s){'' if bon else ' — ' + err}")
print(f'\n{ok}/{len(RES)} contrôles réussis')
sys.exit(0 if ok == len(RES) else 1)
