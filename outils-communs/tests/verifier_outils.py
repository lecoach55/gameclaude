#!/usr/bin/env python3
"""Contrôle des outils communs : à lancer avant de pousser une modification d'outil.
usage : python3 outils-communs/tests/verifier_outils.py [--reseau]
Chaque contrôle est rapide (quelques secondes) et dit OK / ÉCHEC avec la raison. Code de sortie 1 si un contrôle échoue.
--reseau ajoute les contrôles qui appellent Poly Haven (phget, catalogue)."""
import os, re, sys, subprocess, tempfile, time, json, shutil, importlib.util

RAC = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# verrou du banc propre au vérificateur : un vrai banc en cours (15 min sur Hameau) ne le bloque pas, et il ne bloque pas ce banc
os.environ['BANC_VERROU'] = os.path.join(tempfile.gettempdir(), f'banc-verificateur-{os.getpid()}.verrou')
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


if '--reseau' in sys.argv:
    @controle('phget.py : liste de fichiers Poly Haven')
    def _():
        spec = importlib.util.spec_from_file_location('phget', os.path.join(OC, 'phget.py'))
        m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
        if 'Diffuse' not in json.dumps(m.files('rock_wall')):
            raise RuntimeError('réponse inattendue')

try:
    os.remove(os.environ['BANC_VERROU'])
except OSError:
    pass
ok = sum(1 for r in RES if r[1])
for nom, bon, err, d in RES:
    print(f"{'OK    ' if bon else 'ÉCHEC '} {nom} ({d:.1f} s){'' if bon else ' — ' + err}")
print(f'\n{ok}/{len(RES)} contrôles réussis')
sys.exit(0 if ok == len(RES) else 1)
