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


@controle('bureau.py : état, json, page')
def _():
    run(sys.executable, 'bureau/outils/bureau.py')
    e = json.loads(run(sys.executable, 'bureau/outils/bureau.py', 'json'))
    if len(e['jeux']) < 5:
        raise RuntimeError('trop peu de jeux détectés')
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
