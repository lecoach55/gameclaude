#!/usr/bin/env python3
"""Contrôle des outils communs : à lancer avant de pousser une modification d'outil.
usage : python3 outils-communs/tests/verifier_outils.py [--reseau] [--modifies [RÉF]] [--seulement MOTIF] [--liste]
Chaque contrôle dit OK / ÉCHEC avec la raison. Code de sortie 1 si un contrôle échoue.
--reseau        ajoute les contrôles qui appellent Poly Haven (phget, catalogue).
--modifies [R]  pendant la mise au point : seulement les contrôles qui se servent d'un outil changé depuis R (défaut :
                origin/main, fichiers non commités compris ; « fichiers:banc.py,sonde.js » = liste donnée à la main), ou d'un outil qui l'importe (atelier.py changé → banc, captures, singe… aussi),
                plus les contrôles dont le texte a changé dans ce fichier. La passe COMPLÈTE (sans option) reste due avant de pousser.
--seulement M   seulement les contrôles dont le nom contient M (expression régulière, sans casse).
--liste         affiche les contrôles qui seraient lancés (et pourquoi), sans rien lancer."""
import ast, os, re, sys, subprocess, tempfile, time, json, shutil, importlib.util, inspect

RAC = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OC = os.path.join(RAC, 'outils-communs')


def _arg(opt, defaut=None):
    """Valeur qui suit `opt` (si elle ne commence pas par --), defaut si l'option est seule, None si absente."""
    if opt not in sys.argv:
        return None
    i = sys.argv.index(opt)
    return sys.argv[i + 1] if i + 1 < len(sys.argv) and not sys.argv[i + 1].startswith('--') else defaut


DOSSIERS_OUTILS = ('outils-communs', 'outils-communs/robots', 'outils-communs/blender', 'bureau/outils')


def _outils_communs():
    """Fichiers d'outils suivis par le vérificateur : chemin relatif à la racine → nom d'outil (sonde.py et sonde.js → « sonde »)."""
    out = {}
    for base in DOSSIERS_OUTILS:
        d = os.path.join(RAC, base)
        for f in sorted(os.listdir(d)) if os.path.isdir(d) else ():
            if f.endswith(('.py', '.js', '.html', '.sh')) and os.path.isfile(os.path.join(d, f)):
                out[f'{base}/{f}'] = os.path.splitext(f)[0]
    return out


def _mentionne(texte, stem, nom=''):
    """Le contrôle (ou l'outil) se sert-il de l'outil `stem` ? Nom de fichier (stem.py/.js/.html), import Python, ou nom de
    contrôle qui commence par l'outil (« sonde : … »). Un simple mot ne suffit pas : routes.preparer() n'est pas preparer.py."""
    s = re.escape(stem)
    return bool(re.search(rf'(?<![\w.-]){s}\.(py|js|html|sh)(?!\w)', texte)
                or re.search(rf'^\s*from\s+{s}\s+import\b', texte, re.M)
                or re.search(rf'^\s*import\s+(?:[\w.]+(?:\s+as\s+\w+)?\s*,\s*)*{s}\b', texte, re.M)
                or re.match(rf'(robots/)?{s}\b', nom))


def _dependances(chemin, stems):
    """Outils dont dépend VRAIMENT un outil Python : modules importés, et fichiers d'outil chargés par leur nom exact
    (chaîne « sonde.js », « …/banc.py ») ; docstrings, commentaires et messages d'aide ne comptent pas."""
    if not chemin.endswith('.py'):
        return set()
    try:
        arbre = ast.parse(open(chemin, encoding='utf-8').read())
    except (OSError, SyntaxError, ValueError):
        return set()
    out = set()
    for n in ast.walk(arbre):
        if isinstance(n, ast.Import):
            out |= {a.name.split('.')[0] for a in n.names}
        elif isinstance(n, ast.ImportFrom) and n.module:
            out.add(n.module.split('.')[0])
        elif isinstance(n, ast.Constant) and isinstance(n.value, str):
            m = re.fullmatch(r'(?:.*/)?([\w-]+)\.(?:py|js|html)', n.value)
            if m:
                out.add(m.group(1))
    return out & stems - {os.path.splitext(os.path.basename(chemin))[0]}


def _blocs_controles(src):
    """Texte de chaque contrôle d'une version du vérificateur : nom → bloc (décorateur + corps)."""
    out = {}
    for m in re.finditer(r"^@controle\((.+?)\)\s*\n(.*?)(?=^@controle\(|^if '--reseau'|\Z)", src, re.S | re.M):
        try:
            out[ast.literal_eval(m.group(1))] = m.group(0)
        except (ValueError, SyntaxError):
            out[m.group(1)] = m.group(0)
    return out


def selection_modifies(ref, verbeux=False):
    """(stems retenus, contrôles changés, raisons) pour --modifies : fichiers changés depuis ref + ceux qui les importent."""
    if ref.startswith('fichiers:'):   # liste explicite (essais du vérificateur lui-même) : fichiers:a.py,b.py
        connus = {os.path.basename(c): c for c in _outils_communs()}
        changes = {c if '/' in c else connus.get(c, f'outils-communs/{c}') for c in ref[9:].split(',') if c}
    else:
        r = subprocess.run(['git', 'diff', '--name-only', ref, '--'], cwd=RAC, capture_output=True, text=True)
        if r.returncode:
            raise SystemExit(f'--modifies : référence git inconnue « {ref} » ({r.stderr.strip()[:200]})')
        changes = set(r.stdout.split())
        r = subprocess.run(['git', 'ls-files', '--others', '--exclude-standard'], cwd=RAC, capture_output=True, text=True)
        changes |= set(r.stdout.split())
    par_chemin = _outils_communs()
    graines = {par_chemin[c] for c in changes if c in par_chemin}
    # fichier d'outil changé mais inconnu (supprimé, renommé, autre extension) : on ne sait pas quoi viser → tout lancer
    orphelins = sorted(c for c in changes if os.path.dirname(c) in DOSSIERS_OUTILS and c not in par_chemin
                       and not c.endswith(('.md', '.txt', '.json')))
    if orphelins:
        return None, set(), {'*': 'fichier(s) sans outil connu : ' + ', '.join(orphelins)}
    tests = {c for c in changes if c.startswith('outils-communs/tests/') and not c.endswith('verifier_outils.py')}
    for t in tests:  # page factice changée → contrôles qui la nomment
        graines.add(os.path.splitext(os.path.basename(t))[0])
    tous = set(par_chemin.values())
    deps = {}
    for rel, stem in par_chemin.items():
        deps.setdefault(stem, set()).update(_dependances(os.path.join(RAC, rel), tous))
    retenus, raisons, file = set(graines), {s: 'modifié' for s in graines}, list(graines)
    while file:  # fermeture : un outil qui en importe (ou en charge) un changé est touché aussi
        s = file.pop()
        for autre, d in deps.items():
            if autre not in retenus and s in d:
                retenus.add(autre); raisons[autre] = f'utilise {s}'; file.append(autre)
    blocs_changes = set()
    if 'outils-communs/tests/verifier_outils.py' in changes:
        r = subprocess.run(['git', 'show', f'{ref}:outils-communs/tests/verifier_outils.py'], cwd=RAC, capture_output=True, text=True)
        avant = _blocs_controles(r.stdout) if r.returncode == 0 else {}
        maintenant = _blocs_controles(open(os.path.abspath(__file__), encoding='utf-8').read())
        blocs_changes = {nom for nom, b in maintenant.items() if avant.get(nom) != b}
    return retenus, blocs_changes, raisons


SELECTION = None   # None = tout ; sinon fonction(nom, source) → raison (str) ou None
_MOTIF = _arg('--seulement')
if '--modifies' in sys.argv:
    _ref = _arg('--modifies', 'origin/main')
    _stems, _blocs, _raisons = selection_modifies(_ref)
    if _stems is None:
        print(f"--modifies {_ref} : {_raisons['*']} → passe COMPLÈTE", flush=True)
        _stems = None
    else:
        print(f"--modifies {_ref} : outils touchés = {', '.join(f'{s} ({_raisons[s]})' for s in sorted(_stems)) or 'aucun'}"
              f"{f' ; contrôles changés : {len(_blocs)}' if _blocs else ''}", flush=True)

    def _sel_modifies(nom, src, _s=_stems, _b=_blocs):
        if nom in _b:
            return 'contrôle changé'
        for s in sorted(_s):
            if _mentionne(src, s, nom):
                return s
        return None
    if _stems is not None:
        SELECTION = _sel_modifies
if '--seulement' in sys.argv and not _MOTIF:
    print('--seulement : motif manquant (ex. --seulement "^banc")', file=sys.stderr)
    sys.exit(2)
if _MOTIF:
    _prec = SELECTION
    SELECTION = lambda nom, src, _p=_prec: (re.search(_MOTIF, nom, re.I) and (_p(nom, src) if _p else 'motif')) or None
SAUTES = []
# verrou du banc propre au vérificateur : un vrai banc en cours (15 min sur Hameau) ne le bloque pas, et il ne bloque pas ce banc
os.environ['BANC_VERROU'] = os.path.join(tempfile.gettempdir(), f'banc-verificateur-{os.getpid()}.verrou')
# un vrai robot d'un jeu qui tourne à côté (hors verrou) ne doit pas faire attendre les bancs du vérificateur (contrôle dédié plus bas)
os.environ.setdefault('VERROU_NAVIGATEURS', '0')
RES = []


def controle(nom):
    def deco(f):
        if SELECTION is not None or '--liste' in sys.argv:
            try:
                src = inspect.getsource(f)
            except (OSError, TypeError):
                src = ''
            raison = SELECTION(nom, src) if SELECTION is not None else 'tout'
            if not raison or '--liste' in sys.argv:
                if raison:
                    print(f'  lancé  {nom[:110]}  [{raison}]')
                SAUTES.append(nom)
                return f
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


@controle("captures.py : vues en JSON reproductibles (2 séries identiques, animation CSS figée au temps 0 même machine chargée), « occupe » attendu (avant : délai fixe = image de préparation), 🐞 caché, références JPEG ½ sans fausse alerte, --avant-dossier voit un changement (--strict code 1 sur alerte seule), vue en échec isolée, erreur JS au chargement rapportée, sortie nettoyée sans toucher aux fichiers étrangers ; compare.py apparie .jpg/.png (png d'abord), ignore planche_*")
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
        # animation CSS infinie figée EXACTEMENT au temps 0 (carré droit) : avant le 19/11, pause en attente → ≈ 3° de rotation,
        # plus ou moins selon la charge (vue « instable » 2 fois sur 8 sous charge, échec de ce contrôle 2 passes sur 6)
        jaune = sum(1 for xx in range(0, 70) for yy in range(140, 200) if px('pret.png', (xx, yy)) == (255, 204, 0))
        if jaune != 1600 or px('pret.png', (10, 150)) != (255, 204, 0):
            raise RuntimeError(f'animation CSS pas figée au temps 0 : {jaune} px du carré droit sur 1600')
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



@controle('verif.py : une commande par jeu (construction toujours lancée, statuts ok/réserve/échec/délai/sautée, étape bloquante, captures relues avec gros plan, rapport) + ATELIER_PARAMS')
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
            {'nom': 'Captures', 'captures': rv, 'comparer': os.path.join(d, 'refs'), 'gros_plan': True},
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
        if not os.path.exists(marque) or '77%' not in v['Commande juste']['chiffres'] or '0 alerte(s) sur 1' not in v['Captures']['chiffres'] \
                or 'gros plan : 1 aucun changement' not in v['Captures']['chiffres']:
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


@controle('banc.py : scène « action » (jeux DOM/SVG : coût d\'un clic jusqu\'à l\'AFFICHAGE, dessin hors fil principal compris, vide déduit par paire, plancher = JS ; machine chargée : répétitions en plus et incertitude), avant/après sensible au dessin, -h, réglages absents, dossier d\'une page à chemin absolu créé d\'office, pas d\'Infinity dans la sortie')
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
        if ri['ms'] > (max(3, 2 * ri['incertitude_ms']) if ri.get('non_converge') else 3):  # 19/11 17:41 : 6,85 ms sous charge (vide déduit en bloc)
            raise RuntimeError(f"action vide : {ri['ms']} ms (le trajet vide n'est pas déduit) : {ri}")
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
        rr = r['rien']
        if rr.get('ms', 99) > (max(3, 2 * rr.get('incertitude_ms', 0)) if rr.get('non_converge') else 3) or 'sans fin' not in r['bloque'].get('erreur', ''):
            raise RuntimeError(f"boucle d'animation / action sans fin : {r}")
        # machine chargée vue de la page, sans hasard (créneaux de 300 ms chargés un sur deux) : vide déduit PAR PAIRE (20/11 ; avant :
        # médiane de tous les vides au milieu des deux créneaux → action vide 1,7-30 ms, 3 fois sur 5 > 3 ms), méthode notée
        c3 = dict(cfg, parametres='?secousses=1', scenes=[{'nom': 'rien', 'action': '0', 'attente_ms': 0, 'repetitions': 6}])
        json.dump(c3, open(reg, 'w'))
        vus = []
        for essai in range(2):   # 2e essai seulement si le plafond de répétitions est atteint sans converger (charge extrême)
            run(sys.executable, sb, reg, sortie, timeout=180)
            rs = json.load(open(sortie))['appareils']['ordinateur']['scenes']['rien']
            vus.append(rs)
            if rs.get('methode_action') != 2 or 'incertitude_ms' not in rs or rs.get('repetitions_faites', 0) < 6:
                raise RuntimeError(f"secousses : champs de la méthode 2 absents : {rs}")
            if rs['ms'] <= 3 or (rs.get('non_converge') and rs['ms'] <= 2 * rs['incertitude_ms'] and essai == 1):
                break
            if not rs.get('non_converge'):
                raise RuntimeError(f"action vide sous secousses : {rs['ms']} ms (attendu ≤ 3, vide déduit par paire) : {rs}")
        else:
            raise RuntimeError(f"action vide sous secousses (2 essais) : {vus}")
        # avant/après : AVANT = même page sans flou, 4 disques au lieu de 120 (dessin léger) ; le dessin plus lourd doit être vu, l'action vide rester « égale »
        av = os.path.join(d, 'avant'); os.makedirs(av)
        open(os.path.join(av, 'p.html'), 'w').write(open(src).read().replace('filter:blur(30px) drop-shadow(0 0 40px #000)', '').replace('i<120', 'i<4'))
        cfg['scenes'] = [x for x in cfg['scenes'] if x['nom'] in ('rien', 'peindre')]
        json.dump(cfg, open(reg, 'w'))
        vus = []
        for essai in range(2):  # machine chargée (2 cœurs, autre conversation) : bruit > écart réel (+130 % jugé « égal (bruit) »,
            # 1 passe sur 3 le 19/11) → un 2e essai ; un dessin NON compté donne ≈ 0 % aux deux essais et échoue toujours
            if os.path.exists(sortie):
                os.remove(sortie)   # un 2e essai qui planterait ne doit pas relire les verdicts du 1er
            r = subprocess.run([sys.executable, sb, reg, sortie, '--avant-page', os.path.join(av, 'p.html'), '--tours', '2', '--strict'],
                               capture_output=True, text=True, timeout=240)
            e = {x['scene']: x['verdict'] for x in json.load(open(sortie))['ecarts']} if os.path.exists(sortie) else {'sortie': 'absente'}
            vus.append(f'code {r.returncode}, verdicts {e}')
            if r.returncode == 1 and e.get('peindre') == 'plus lent' and not e.get('rien', '').startswith('plus'):
                break
            if 'bruit' not in e.get('peindre', '') and 'bruit' not in e.get('rien', '') and not e.get('rien', '').startswith('plus'):
                break   # verdict net mais faux sur le dessin : pas de 2e essai (« rien » plus lent = forcément du bruit : même action vide)
        else:
            raise RuntimeError('avant/après (2 essais) : ' + ' / '.join(vus) + ' ' + r.stdout[-300:])
        if not (r.returncode == 1 and e.get('peindre') == 'plus lent' and not e.get('rien', '').startswith('plus')):
            raise RuntimeError('avant/après : ' + ' / '.join(vus) + ' ' + r.stdout[-300:])


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
            verdicts[rev] = (o['ecarts'][0]['verdict'], o['avant_rev'], r.stdout, float(o['ecarts'][0].get('ecart_pct') or 0))
        if verdicts['arrivee'][0] != 'plus lent' or not verdicts['arrivee'][1].startswith('arrivee ' + arr[:7]):
            raise RuntimeError(f"arrivee : {verdicts['arrivee'][:2]} " + verdicts['arrivee'][2][-300:])
        # AVANT = APRÈS avec HEAD : sous charge (autres conversations), le bruit peut dépasser le seuil (retour du 19/11 : « plus lent »
        # une fois sur 3). Le vrai ralentissement vaut +180-230 % : on n'échoue que si HEAD voit plus de la moitié de celui d'arrivee.
        e_h, e_a = verdicts['HEAD'][3], verdicts['arrivee'][3]
        if (verdicts['HEAD'][0] == 'plus lent' and e_h > max(60, e_a / 2)) or "touchent déjà jeu/" not in verdicts['HEAD'][2]:
            raise RuntimeError(f"HEAD : {verdicts['HEAD'][:2]} {e_h:+.0f} % contre {e_a:+.0f} % (avertissement attendu) " + verdicts['HEAD'][2][-300:])


POLICES_FACTICE = """<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&display=swap" rel="stylesheet">
<style>/* @import url('https://fonts.googleapis.com/css2?family=Inter'); */h1{font-family:'Cinzel',serif;font-weight:700}p{font-family:'Cinzel',serif;font-weight:500}</style></head>
<body><h1>Le Trône</h1><p>Évêques, cœurs et « guillemets »</p><script>window.PRET=1;var lien='<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400" rel="stylesheet">';</script></body></html>"""


@controle('polices.py : adresses Google lues (ital/wght, plages variables, ancienne API)')
def _():
    spec = importlib.util.spec_from_file_location('polices', os.path.join(OC, 'polices.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    f = m.lire_adresse('css2', 'family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Cinzel+Decorative:wght@700&family=IM+Fell+English:ital@0;1&display=swap')
    attendu = [('EB Garamond', [400, 600], {0, 1}, None), ('Cinzel Decorative', [700], {0}, None), ('IM Fell English', [400], {0, 1}, None)]
    if [(x['nom'], x['poids'], x['italiques'], x['plage']) for x in f] != attendu:
        raise RuntimeError(f'css2 : {f}')
    v = m.lire_adresse('css2', 'family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800')[0]
    if v['plage'] != (400, 800) or not {'opsz', 'wdth'} <= v['axes']:
        raise RuntimeError(f'variable : {v}')
    v = m.lire_adresse('css2', 'family=Fraunces:opsz,wght@9..144,400;9..144,600')[0]
    if v['poids'] != [400, 600] or '_plage' not in v['axes']:  # opsz en plage → paquet variable
        raise RuntimeError(f'opsz : {v}')
    if f[0]['couples'] != [(0, 400), (0, 600), (1, 400)]:  # pas de produit croisé (600 italique non demandé)
        raise RuntimeError(f"couples : {f[0]['couples']}")
    a = m.lire_adresse('css', 'family=Roboto:400,700italic|Open+Sans')
    if [(x['nom'], x['poids'], x['italiques']) for x in a] != [('Roboto', [400, 700], {0, 1}), ('Open Sans', [400], {0})]:
        raise RuntimeError(f'ancienne API : {a}')


@controle('polices.py : lien Google remplacé par des @font-face intégrés (sans réseau), --verifier, famille introuvable = page intacte')
def _():
    with tempfile.TemporaryDirectory() as d:
        pg = os.path.join(d, 'p.html'); open(pg, 'w').write(POLICES_FACTICE)
        run(sys.executable, os.path.join(OC, 'polices.py'), pg, '--verifier', attendu=1)
        out = run(sys.executable, os.path.join(OC, 'polices.py'), pg, '--hors-ligne')
        h = open(pg).read()
        if h.count('data:font/woff2;base64,') != 2 or 'preconnect' in h or 'Cinzel' not in out or '<link href="https' in h.split('<script>')[0]:
            raise RuntimeError('remplacement incomplet : ' + out[-300:])
        # lien dans une chaîne JS et @import en commentaire CSS : jamais touchés (avant : chaîne JS coupée → erreur de syntaxe)
        if POLICES_FACTICE.split('<script>')[1] != h.split('<script>')[1] or "/* @import url('https://fonts.googleapis.com/css2?family=Inter'); */" not in h:
            raise RuntimeError('script ou commentaire modifié')
        if 'dans un <script>' not in run(sys.executable, os.path.join(OC, 'polices.py'), pg, '--verifier', attendu=1):
            raise RuntimeError('--verifier : lien du script non signalé')
        open(pg, 'w').write(h.replace("var lien='<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400\" rel=\"stylesheet\">';", ''))
        run(sys.executable, os.path.join(OC, 'polices.py'), pg, '--verifier')
        run(sys.executable, os.path.join(OC, 'polices.py'), pg)  # deuxième passage : rien à faire, code 0
        p2 = os.path.join(d, 'q.html'); src = POLICES_FACTICE.replace('Cinzel:wght@500;700', 'Police+Inexistante+Zz:wght@400')
        open(p2, 'w').write(src)
        env_home = dict(os.environ, HOME=d)  # cache vide, et --hors-ligne : aucun npm
        r = subprocess.run([sys.executable, os.path.join(OC, 'polices.py'), p2, '--hors-ligne'], capture_output=True, text=True, env=env_home, cwd=RAC)
        if r.returncode != 3 or open(p2).read() != src:
            raise RuntimeError(f'famille introuvable : code {r.returncode}, page modifiée ? {open(p2).read() != src}')


@controle('hors_ligne.py : réseau coupé → requête Google et police de repli vues ; après polices.py : 0 externe, police chargée ; erreur JS = code 1')
def _():
    with tempfile.TemporaryDirectory() as d:
        pg = os.path.join(d, 'p.html'); open(pg, 'w').write(POLICES_FACTICE)
        js = os.path.join(d, 'r.json')
        run(sys.executable, os.path.join(OC, 'hors_ligne.py'), pg, '--pret', 'window.PRET', '--secondes', '1', '--json', js, '--strict', '--sans-verrou', attendu=1)
        r = json.load(open(js))
        if 'fonts.googleapis.com' not in r['externes'] or r['polices_repli'] != ['Cinzel'] or r['erreurs'] or not r['pret']:
            raise RuntimeError(f"avant : externes {list(r['externes'])} repli {r['polices_repli']} erreurs {r['erreurs']}")
        run(sys.executable, os.path.join(OC, 'hors_ligne.py'), pg, '--secondes', '1', '--sans-verrou')  # sans --strict : réserve seulement
        run(sys.executable, os.path.join(OC, 'polices.py'), pg, '--hors-ligne')
        run(sys.executable, os.path.join(OC, 'hors_ligne.py'), pg, '--pret', 'window.PRET', '--secondes', '1', '--json', js, '--strict', '--sans-verrou')
        r = json.load(open(js))
        if r['externes'] or r['polices_repli'] or r['polices_chargees'] != ['Cinzel']:
            raise RuntimeError(f"après : externes {list(r['externes'])} repli {r['polices_repli']} chargées {r['polices_chargees']}")
        pm = os.path.join(d, 'm.html'); open(pm, 'w').write('<p>x</p><script src="absent.js"></script><img src="absent.png">')
        run(sys.executable, os.path.join(OC, 'hors_ligne.py'), pm, '--secondes', '1', '--sans-verrou', '--json', js, attendu=1)  # fichier local manquant
        if len([e for e in json.load(open(js))['erreurs'] if 'introuvable' in e]) != 2:
            raise RuntimeError(f"fichiers locaux manquants : {json.load(open(js))['erreurs']}")
        pe = os.path.join(d, 'e.html'); open(pe, 'w').write('<p>x</p><script>window.PRET=1;setTimeout(()=>nexistepas(),10)</script>')
        run(sys.executable, os.path.join(OC, 'hors_ligne.py'), pe, '--secondes', '1', '--sans-verrou', attendu=1)
        # étape "hors_ligne" de verif.py : chiffres repris dans le rapport
        vj = os.path.join(d, 'verif.json'); json.dump({'jeu': 'factice', 'etapes': [{'nom': 'Hors ligne', 'hors_ligne': pe, 'args': ['--secondes', '1', '--sans-verrou']}]}, open(vj, 'w'))
        sortie = os.path.join(d, 'sortie')
        r = subprocess.run([sys.executable, os.path.join(OC, 'verif.py'), vj, '--sortie', sortie, '--sans-chrono'], capture_output=True, text=True, timeout=180, cwd=RAC)
        v = json.load(open(os.path.join(sortie, 'verif.json')))
        e = v['etapes'][0]
        if r.returncode != 1 or e['statut'] != 'echec' or 'erreurs 1' not in e['chiffres']:
            raise RuntimeError(f"verif : code {r.returncode}, {e.get('statut')} « {e.get('chiffres')} »")


APERCU_JEU = """<!doctype html><meta name=viewport content="width=device-width"><style>body{margin:0;background:#223;color:#eee;font:16px sans-serif}
#c{width:100%;height:300px;display:block}.l{display:flex;gap:8px}@media (max-width:600px){.l{flex-direction:column}}</style>
<div class=l><b>A</b><b>B</b></div><canvas id=c></canvas><p id=e></p>
<script>const c=document.getElementById('c');c.width=c.clientWidth*devicePixelRatio;c.height=300*devicePixelRatio;
window.PRET=1;document.getElementById('e').textContent=innerWidth+'x'+innerHeight+'@'+devicePixelRatio;</script>"""


@controle("appareils.py : formats communs du Mac (483×755 @2…) ; anciens réglages inchangés ; --appareils mac dans banc/captures/singe/hors_ligne même absent des réglages ; nom inconnu = erreur (avant : banc vide en silence) ; aperçu : @media actives, Mpx des canvas, planche, étape verif")
def _():
    sys.path.insert(0, OC)
    import appareils as A
    if A.resoudre(None, 'mac', {}) != {'mac': {'largeur': 483, 'hauteur': 755, 'dpr': 2}}:
        raise RuntimeError(f"mac : {A.resoudre(None, 'mac', {})}")
    vieux = {'ordinateur': {'largeur': 1280, 'hauteur': 800, 'cpu': 1}}
    if A.resoudre(vieux) != vieux or A.resoudre(None, None, {'telephone': {'largeur': 390}}) != {'telephone': {'largeur': 390}}:
        raise RuntimeError('anciens réglages modifiés')
    r = A.resoudre({'o': 'mac-large@1', 'p': {'comme': 'mac', 'cpu': 4}}, 'p,o,1000x700@2')
    if r != {'p': {'largeur': 483, 'hauteur': 755, 'dpr': 2, 'cpu': 4}, 'o': {'largeur': 912, 'hauteur': 755, 'dpr': 1}, '1000x700@2': {'largeur': 1000, 'hauteur': 700, 'dpr': 2}}:
        raise RuntimeError(f'comme / @1 / format libre : {r}')
    try:
        A.resoudre(vieux, 'zzz'); raise RuntimeError('nom inconnu accepté')
    except ValueError:
        pass
    with tempfile.TemporaryDirectory() as d:
        open(os.path.join(d, 'index.html'), 'w').write(APERCU_JEU)
        base = {'jeu': 'factice', 'dossier': d, 'page': 'index.html', 'pret': 'window.PRET', 'appareils': {'telephone': {}}}
        # banc : --appareils mac@1 absent des réglages → mesuré au bon format ; nom inconnu → erreur claire
        rb = os.path.join(d, 'banc.json'); json.dump(dict(base, scenes=[{'nom': 's', 'attente_ms': 50, 'duree_ms': 300, 'infos': "innerWidth+'x'+innerHeight+'@'+devicePixelRatio"}]), open(rb, 'w'))
        run(sys.executable, os.path.join(OC, 'banc.py'), rb, os.path.join(d, 'b.json'), '--appareils', 'mac@1,telephone', '--sans-verrou', timeout=120)
        b = json.load(open(os.path.join(d, 'b.json')))['appareils']
        if list(b) != ['mac@1', 'telephone'] or b['mac@1']['scenes']['s'].get('infos') != '483x755@1':
            raise RuntimeError(f"banc --appareils mac@1 : {list(b)} {b.get('mac@1', {}).get('scenes')}")
        r = subprocess.run([sys.executable, os.path.join(OC, 'banc.py'), rb, '--appareils', 'zzz', '--sans-verrou'], capture_output=True, text=True, timeout=60)
        if r.returncode == 0 or 'appareil inconnu' not in r.stderr:
            raise RuntimeError('banc --appareils zzz : ' + (r.stdout + r.stderr)[-200:])
        # captures : image à dpr 2
        rc = os.path.join(d, 'vues.json'); json.dump(dict(base, vues=[{'nom': 'v'}]), open(rc, 'w'))
        run(sys.executable, os.path.join(OC, 'captures.py'), rc, os.path.join(d, 'c'), '--appareils', 'mac', '--sans-verrou', timeout=120)
        from PIL import Image
        if Image.open(os.path.join(d, 'c', 'v.png')).size != (966, 1510):
            raise RuntimeError(f"captures mac : {Image.open(os.path.join(d, 'c', 'v.png')).size}")
        # hors ligne --ecran mac ; singe --appareils mac
        run(sys.executable, os.path.join(OC, 'hors_ligne.py'), os.path.join(d, 'index.html'), '--ecran', 'mac', '--secondes', '0.3', '--sans-verrou')
        json.dump({'fichier': 'index.html', 'pret': 'window.PRET', 'pause': [10, 20]}, open(os.path.join(d, 'singe.json'), 'w'))
        run(sys.executable, os.path.join(OC, 'robots', 'singe.py'), os.path.join(d, 'singe.json'), '--secondes', '5', '--actions', '3', '--appareils', 'mac',
            '--sortie', os.path.join(d, 's'), '--sans-verrou', timeout=120)
        sa = json.load(open(os.path.join(d, 's', 'singe.json')))['appareils'][0]
        if sa['ecran'] != {'width': 483, 'height': 755}:
            raise RuntimeError(f"singe mac : {sa['ecran']}")
        # aperçu : à 483 px la règle max-width:600px est active, à 912 non ; canvas 912×300 @2 = 1,09 Mpx ; planche
        run(sys.executable, os.path.join(OC, 'appareils.py'), 'apercu', os.path.join(d, 'index.html'), '--formats', 'mac,mac-large', '--secondes', '0.2',
            '--sortie', os.path.join(d, 'a'), '--sans-verrou', timeout=120)
        ap = json.load(open(os.path.join(d, 'a', 'apercu.json')))['formats']
        if ap['mac']['actives'] != ['(max-width: 600px)'] or ap['mac-large']['actives'] or ap['mac-large']['mpx'] != 1.09 or not os.path.exists(os.path.join(d, 'a', 'planche.png')):
            raise RuntimeError(f"aperçu : {ap}")
        vj = os.path.join(d, 'verif.json'); json.dump({'jeu': 'factice', 'etapes': [{'nom': 'Mac', 'apercu': os.path.join(d, 'index.html'), 'args': ['--formats', 'mac', '--secondes', '0.2', '--sans-verrou']}]}, open(vj, 'w'))
        r = subprocess.run([sys.executable, os.path.join(OC, 'verif.py'), vj, '--sortie', os.path.join(d, 'v'), '--sans-chrono'], capture_output=True, text=True, timeout=180, cwd=RAC)
        e = json.load(open(os.path.join(d, 'v', 'verif.json')))['etapes'][0]
        if r.returncode or e['statut'] != 'ok' or '@media 1' not in e['chiffres'] or not e.get('images'):
            raise RuntimeError(f"verif apercu : code {r.returncode} {e}")

VISITE_JEU = """<!doctype html><meta charset=utf-8><body style="font:16px sans-serif">
<div id=menu><button onclick="jour++;this.textContent='+1 jour ('+jour+')'">+1 jour</button>
<button onclick="document.getElementById('bq').hidden=false;document.getElementById('menu').hidden=true">Boutique</button></div>
<div id=bq hidden><p>Boutique</p><button onclick="document.getElementById('bq').hidden=true;document.getElementById('menu').hidden=false">Retour</button></div>
<div id=arene hidden><p>Arène</p>""" + ''.join(f'<button onclick="if(window.CASSE)null.x;coups++">Coup {c}</button>' for c in 'ABCD') + """
<button onclick="document.getElementById('arene').hidden=true;document.getElementById('menu').hidden=false">Quitter</button></div>
<script>var jour=0,coups=0;function ouvrirArene(){document.getElementById('menu').hidden=true;document.getElementById('bq').hidden=true;document.getElementById('arene').hidden=false}</script>"""


@controle("robots/singe.py « visiter » : état sans bouton (arène) forcé par « aller » puis compté (actions, secondes, erreurs survenues dedans), état atteint au hasard (boutique) sans forçage, état obligatoire jamais vu = échec (code 1), facultatif ou run trop court pour le forcer = signalé sans échec, « si » manquant refusé ; « encore » y retourne ; délai « pret » qui suit la charge (patience)")
def _():
    with tempfile.TemporaryDirectory() as d:
        open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(VISITE_JEU)
        ar = {'nom': 'arène', 'si': "!document.getElementById('arene').hidden", 'aller': [{'js': 'ouvrirArene()'}], 'apres': 8, 'encore': True, 'essais': 5}
        bq = {'nom': 'boutique', 'si': "!document.getElementById('bq').hidden"}
        base = {'fichier': 'index.html', 'etat': 'jour', 'pause': [10, 30], 'hasard': 0, 'glisser': 0}
        json.dump(dict(base, init='window.CASSE=1', visiter=[ar, bq, {'nom': 'coffre', 'si': 'window.coffre'}]), open(os.path.join(d, 's1.json'), 'w'))
        out = run(sys.executable, os.path.join(OC, 'robots', 'singe.py'), os.path.join(d, 's1.json'), '--actions', '60', '--secondes', '60',
                  '--appareils', 'ordinateur', '--sortie', os.path.join(d, 'o1'), '--sans-verrou', attendu=1, timeout=120)
        a = json.load(open(os.path.join(d, 'o1', 'singe.json')))['appareils'][0]; v = a['visites']
        pb = []
        if not (v['arène']['vu'] and v['arène']['actions'] >= 2 and v['arène']['secondes'] >= 0 and v['arène']['forcages'][:1] == ['action 8 : oui']):
            pb.append(f"arène {v['arène']}")
        if not (v['boutique']['vu'] and not v['boutique']['forcages']): pb.append(f"boutique {v['boutique']}")
        if v['coffre']['vu'] or not v['coffre']['obligatoire'] or 'coffre » : ✗ jamais atteinte (obligatoire)' not in out: pb.append(f"coffre {v['coffre']}")
        if not any(e.get('dans') == ['arène'] for e in a['erreurs']) or v['arène']['erreurs'] < 1: pb.append(f"erreur dans l'arène non attribuée {a['erreurs'][:1]}")
        if pb: raise RuntimeError('; '.join(pb) + ' ; ' + out[-300:])
        # sans erreur, coffre facultatif, « encore » : code 0, l'arène revue après en être sortie, « pret » attendu (1,5 s) par patience
        json.dump(dict(base, entree=[{'js': 'setTimeout(()=>window.ok=1,1500)'}], pret='window.ok',
                       visiter=[dict(ar, apres=6), {'nom': 'coffre', 'si': 'window.coffre', 'obligatoire': False}]), open(os.path.join(d, 's2.json'), 'w'))
        r = subprocess.run([sys.executable, os.path.join(OC, 'robots', 'singe.py'), os.path.join(d, 's2.json'), '--actions', '60', '--secondes', '60',
                            '--appareils', 'ordinateur', '--sortie', os.path.join(d, 'o2'), '--sans-verrou'], capture_output=True, text=True, timeout=120,
                           cwd=RAC, env=dict(os.environ, PATIENCE='1'))
        a = json.load(open(os.path.join(d, 'o2', 'singe.json')))['appareils'][0] if os.path.exists(os.path.join(d, 'o2', 'singe.json')) else {}
        v = a.get('visites', {})
        if r.returncode or v.get('coffre', {}).get('vu') is not False or 'jamais atteinte' not in r.stdout or v['arène']['entrees'] < 2 \
                or 'obligatoire)' in r.stdout:
            raise RuntimeError(f"code {r.returncode} {v} " + (r.stdout + r.stderr)[-300:])
        # run trop court pour tenter le forçage (10 actions < apres 50) : avertissement, pas d'échec ; « si » manquant = erreur de réglage
        json.dump(dict(base, visiter=[dict(ar, apres=50)]), open(os.path.join(d, 's3.json'), 'w'))
        out = run(sys.executable, os.path.join(OC, 'robots', 'singe.py'), os.path.join(d, 's3.json'), '--actions', '10', '--appareils', 'ordinateur',
                  '--sortie', os.path.join(d, 'o3'), '--sans-verrou', timeout=90)
        if 'forçage non tenté' not in out: raise RuntimeError('run court : ' + out[-300:])
        json.dump(dict(base, visiter=[{'nom': 'x'}]), open(os.path.join(d, 's4.json'), 'w'))
        r = subprocess.run([sys.executable, os.path.join(OC, 'robots', 'singe.py'), os.path.join(d, 's4.json'), '--actions', '3', '--sans-verrou'],
                           capture_output=True, text=True, timeout=60, cwd=RAC)
        if r.returncode == 0 or '« si » manquant' not in r.stdout + r.stderr: raise RuntimeError('si manquant : ' + (r.stdout + r.stderr)[-200:])


PAS_JEU = """<!doctype html><meta charset=utf-8><body><button onclick="window.n=(window.n||0)+1">Plus</button><button onclick="window.m=1">Autre</button>
<script>window.tv=0;window.q=location.search;(function f(){window.tv=performance.now();requestAnimationFrame(f)})();</script>"""


@controle("robots/singe.py --pas / « pas » (19/11 soir, retour Bannières : fin de tour jamais finie en mode économe) : temps de jeu par image jouée (pas 250 → ≥ 150 ms de jeu par action, défaut ≤ 40), --requete remplace le réglage, pas absurde refusé")
def _():
    with tempfile.TemporaryDirectory() as d:
        open(os.path.join(d, 'index.html'), 'w').write(PAS_JEU)
        json.dump({'fichier': 'index.html', 'pret': 'window.tv>=0', 'etat': '[Math.round(window.tv),window.q]', 'pause': [10, 20], 'hasard': 0, 'glisser': 0,
                   'images': 1, 'requete': '?a'}, open(os.path.join(d, 's.json'), 'w'))
        res = {}
        for nom, extra in (('defaut', []), ('pas', ['--pas', '250', '--requete', '?q3d=0'])):
            run(sys.executable, os.path.join(OC, 'robots', 'singe.py'), os.path.join(d, 's.json'), '--actions', '12', '--secondes', '40',
                '--appareils', 'ordinateur', '--sortie', os.path.join(d, nom), '--sans-verrou', *extra, timeout=90)
            a = json.load(open(os.path.join(d, nom, 'singe.json')))['appareils'][0]
            res[nom] = ((a['etat_fin'][0] - a['etat_debut'][0]) / max(1, a['actions']), a['etat_fin'][1], a['actions'])
        if not (res['pas'][0] >= 150 and res['defaut'][0] <= 40 and res['pas'][2] >= 10):
            raise RuntimeError(f"temps de jeu par action (ms) : défaut {res['defaut']}, --pas 250 {res['pas']}")
        if res['defaut'][1] != '?a' or res['pas'][1] != '?q3d=0':
            raise RuntimeError(f"--requete : {res}")
        r = subprocess.run([sys.executable, os.path.join(OC, 'robots', 'singe.py'), os.path.join(d, 's.json'), '--pas', '0', '--sans-verrou'],
                           capture_output=True, text=True, timeout=60, cwd=RAC)
        if r.returncode == 0 or 'entre 1 et 2000' not in r.stdout + r.stderr:
            raise RuntimeError('--pas 0 accepté : ' + (r.stdout + r.stderr)[-200:])


@controle("banc.py veille (19/11 soir, retour Bannières : singe lancé PENDANT un banc de gels → +113 % au lieu de −6 %) : robot hors verrou démarré en pleine mesure → passe suspendue puis REFAITE après sa fin (passes_refaites, rien « pendant ») ; --attente-navigateurs 0 → pas d'attente, passe notée « pendant » et écart DOUTEUX ; Veille ignore ses propres navigateurs")
def _():
    env = dict(os.environ, BANC_VERROU=os.path.join(tempfile.gettempdir(), f'verrou-veille-{os.getpid()}.verrou'))
    env.pop('VERROU_NAVIGATEURS', None); env.pop('VERROU_VEILLE', None)
    with tempfile.TemporaryDirectory() as d:
        os.makedirs(os.path.join(d, 'j')); open(os.path.join(d, 'j', 'index.html'), 'w').write(BANC_JEU.replace('TRAVAIL', '100000'))
        cfg = {'jeu': 'factice', 'dossier': os.path.join(d, 'j'), 'page': 'index.html', 'pret': 'window.pret', 'pret_ms': 100, 'images': 400,
               'scenes': [{'nom': f's{i}', 'attente_ms': 300} for i in range(10)]}
        reg = os.path.join(d, 'banc.json'); json.dump(cfg, open(reg, 'w'))
        rob = os.path.join(d, 'robot_du_jeu.py'); open(rob, 'w').write(ROBOT_HORS_VERROU)
        bilans = {}
        for cas, extra in (('attend', []), ('zero', ['--attente-navigateurs', '0'])):
            sortie = os.path.join(d, cas + '.json'); partiel = sortie + '.partiel.json'
            pr = subprocess.Popen([sys.executable, os.path.join(OC, 'banc.py'), reg, sortie, *extra], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env)
            t0 = time.time()
            while not os.path.exists(partiel) and pr.poll() is None and time.time() - t0 < 60:
                time.sleep(0.1)
            time.sleep(1.0)   # en pleine passe (10 scènes × 400 images ≈ 15 s)
            rb = subprocess.Popen([sys.executable, rob, '14', 'occupe'], stdout=subprocess.PIPE, text=True, env=env)
            try:
                out = pr.communicate(timeout=240)[0]
            finally:
                rb.kill(); rb.wait()
            r = json.load(open(sortie)) if os.path.exists(sortie) else {}
            bilans[cas] = (out, r)
        out, r = bilans['attend']
        if not r.get('passes_refaites') or '↻' not in out or (r.get('navigateurs_hors_verrou') or {}).get('pendant') or 'suspendue' not in out:
            raise RuntimeError('robot en pleine mesure : passe non refaite ou encore notée « pendant » : ' + out[-500:])
        out, r = bilans['zero']
        if r.get('passes_refaites') or not (r.get('navigateurs_hors_verrou') or {}).get('pendant') or 'DOUTEUX' not in out:
            raise RuntimeError('--attente-navigateurs 0 : passe refaite ou robot non noté « pendant » : ' + out[-500:])
    # écart DOUTEUX dans le tableau (verdict lui-même inchangé : verif.py le lit)
    sys.path.insert(0, OC)
    import banc as B_
    t = B_.tableau([{'appareil': 'mac', 'scene': 'gel x', 'avant_ms': 1, 'apres_ms': 2, 'ecart_pct': 100, 'bruit_pct': None, 'verdict': 'plus lent', 'douteux': True}])
    if 'plus lent — DOUTEUX' not in t:
        raise RuntimeError('tableau : ' + t)
    # la veille d'un processus ne compte pas ses propres navigateurs
    import verrou as V_
    from playwright.sync_api import sync_playwright
    v = V_.Veille(echantillon=0.5, pause=0.1)
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(); pg = b.new_page(); pg.set_content('<script>var x=0;(function f(){for(var i=0;i<3e6;i++)x+=i%7;setTimeout(f,0)})()</script>')
            t0 = time.time(); time.sleep(2.5)
            if v.vus_depuis(t0):
                raise RuntimeError('Veille : propre navigateur compté hors verrou ' + str(v.vus_depuis(t0)))
            b.close()
    finally:
        v.arreter()
    for x in ('', '.file'):
        try:
            os.remove(env['BANC_VERROU'] + x)
        except OSError:
            pass
    shutil.rmtree(env['BANC_VERROU'] + '.qui', ignore_errors=True)


@controle("patience.py : facteur = charge ÷ cœurs (1 à 6) × PATIENCE, délai adapté, attendre() réussit sous charge là où la base seule échoue, échéance reculée si la charge monte pendant l'attente, message d'échec qui dit base/charge/attendu ; ligne de commande")
def _():
    sys.path.insert(0, OC)
    import patience as P
    from playwright.sync_api import sync_playwright
    vrai, env = P.charge, os.environ.get('PATIENCE')
    try:
        os.environ.pop('PATIENCE', None)
        P.charge = lambda: (0.3, 2)
        if P.facteur() != 1 or P.delai(60) != 60: raise RuntimeError(f'machine calme : {P.facteur()}')
        P.charge = lambda: (5.0, 2)
        if P.facteur() != 2.5 or P.delai(60) != 150: raise RuntimeError(f'charge 5/2 : {P.facteur()}')
        P.charge = lambda: (80.0, 2)
        if P.facteur() != 6: raise RuntimeError('plafond')
        os.environ['PATIENCE'] = '2'; P.charge = lambda: (0.0, 2)
        if P.facteur() != 2: raise RuntimeError('PATIENCE=2')
        os.environ.pop('PATIENCE')
        with sync_playwright() as p:
            nav = p.chromium.launch(); pg = nav.new_page()
            pg.set_content('<script>setTimeout(()=>window.ok1=1,1200)</script>')
            P.charge = lambda: (0.0, 2)
            try:
                P.attendre_sync(pg, 'window.ok1', 0.5, quoi='prêt'); raise RuntimeError('base seule : aurait dû échouer')
            except TimeoutError as e:
                if 'base 0.5 s' not in str(e) or '« prêt »' not in str(e): raise RuntimeError('message : ' + str(e))
            pg.set_content('<script>setTimeout(()=>window.ok2=1,1200)</script>')
            P.charge = lambda: (8.0, 2)                    # charge 4 : 0,5 s × 4 = 2 s > 1,2 s
            P.attendre_sync(pg, 'window.ok2', 0.5)
            pg.set_content('<script>setTimeout(()=>window.ok3=1,1200)</script>')
            vu = []
            def montee():                                  # calme au départ, chargée à l'échéance : l'attente se prolonge
                vu.append(1); return (0.0, 2) if len(vu) == 1 else (8.0, 2)
            P.charge = montee
            t = P.attendre_sync(pg, 'window.ok3', 0.5)
            if not 1.0 < t < 2.5: raise RuntimeError(f'échéance reculée : {t} s')
            nav.close()
    finally:
        P.charge = vrai
        if env is None: os.environ.pop('PATIENCE', None)
        else: os.environ['PATIENCE'] = env
    o = run(sys.executable, os.path.join(OC, 'patience.py'))
    if not o.startswith('facteur '): raise RuntimeError(o)
    r = subprocess.run([sys.executable, os.path.join(OC, 'patience.py'), '10'], capture_output=True, text=True, env=dict(os.environ, PATIENCE='3'))
    if float(r.stdout) < 30: raise RuntimeError('ligne de commande : ' + r.stdout)


@controle("verifier_outils.py --modifies / --seulement / --liste : un outil changé → ses contrôles et ceux des outils qui l'importent ou le chargent (banc.py → captures, profil3d, verif ; sonde.js → atelier → singe), pas les autres (polices.py → ses 2 + hors_ligne, ni banc ni singe) ; docstrings et routes.preparer() ignorés ; référence inconnue = erreur ; passe complète inchangée")
def _():
    V = os.path.abspath(__file__)

    def liste(*a):
        r = subprocess.run([sys.executable, V, '--liste', *a], cwd=RAC, capture_output=True, text=True, timeout=60)
        if r.returncode:
            raise RuntimeError(f"{' '.join(a)} → code {r.returncode} : {(r.stderr or r.stdout)[-300:]}")
        lances = [l.split('lancé', 1)[1].strip() for l in r.stdout.splitlines() if l.startswith('  lancé')]
        return ([x for x in lances if not x.startswith('verifier_outils.py')] if a else lances), r.stdout   # ce contrôle-ci nomme tous les outils
    tout, _o = liste()
    if len(tout) != len(_blocs_controles(open(V, encoding='utf-8').read())):
        raise RuntimeError(f'--liste seul : {len(tout)} contrôles listés')
    b, o = liste('--modifies', 'fichiers:banc.py')
    noms = ' | '.join(b)
    for doit in ('banc.py : avant/après', 'captures.py : vues', 'profil3d.py', 'verif.py : une commande'):
        if doit not in noms: raise RuntimeError(f'banc.py changé : « {doit} » non lancé ({len(b)} lancés)')
    for pas in ('polices.py', 'patience.py', 'bureau.py : état', 'robots/singe.py « visiter »'):
        if any(x.startswith(pas) for x in b): raise RuntimeError(f'banc.py changé : « {pas} » lancé à tort')
    if 'verif (utilise banc)' not in o: raise RuntimeError('raison absente : ' + o[:200])
    p, _o = liste('--modifies', 'fichiers:polices.py')
    if len(p) != 3 or not any(x.startswith("hors_ligne.py") for x in p) or any(x.startswith(("banc", "robots/singe")) for x in p):
        raise RuntimeError(f'polices.py changé : {len(p)} lancés {p}')
    sd, _o = liste('--modifies', 'fichiers:sonde.js')
    if not any(x.startswith('robots/singe.py') for x in sd) or not any(x.startswith('atelier.py') for x in sd):
        raise RuntimeError('sonde.js changé : atelier/singe non lancés')
    pr, _o = liste('--modifies', 'fichiers:preparer.py')   # « routes.preparer() » / « preparer: » dans d'autres contrôles ignorés
    if len(pr) != 1 or not pr[0].startswith('preparer.py'): raise RuntimeError(f'preparer.py changé : {pr}')
    tk, _o = liste('--modifies', 'fichiers:testkit.js')
    if not any(x.startswith('maj_testkit.py') for x in tk) or any(x.startswith('polices') for x in tk):
        raise RuntimeError(f'testkit.js changé : {tk}')
    so, o = liste('--modifies', 'fichiers:outils-communs/sonde.py')   # sonde.py ET sonde.js : même outil « sonde »
    if not any(x.startswith('atelier.py') for x in so): raise RuntimeError(f'sonde.py changé : {len(so)} lancés ({o[:150]})')
    tt, o = liste('--modifies', 'fichiers:outils-communs/disparu.py')   # outil supprimé/inconnu : tout
    if 'COMPLÈTE' not in o or len(tt) < len(tout) - 1: raise RuntimeError(f'outil inconnu : {len(tt)} lancés')
    r = subprocess.run([sys.executable, V, '--seulement', '--liste'], cwd=RAC, capture_output=True, text=True, timeout=60)
    if r.returncode != 2: raise RuntimeError(f'--seulement sans motif : code {r.returncode}')
    s1, _o = liste('--seulement', '^patience')
    if len(s1) != 1: raise RuntimeError(f'--seulement ^patience : {s1}')
    s2, _o = liste('--modifies', 'fichiers:banc.py', '--seulement', 'profil3d')
    if len(s2) != 1: raise RuntimeError(f'--modifies + --seulement : {s2}')
    r = subprocess.run([sys.executable, V, '--modifies', 'pas-une-ref-xyz', '--liste'], cwd=RAC, capture_output=True, text=True, timeout=60)
    if r.returncode == 0 or 'inconnue' not in r.stderr + r.stdout: raise RuntimeError('référence inconnue acceptée')
    av = 'x = 1\n' + '@controle(\'a.py : un\')\ndef _():\n    pass\n\n\n@controle("b.py : deux")\ndef _():\n    pass\n'
    ap = av.replace('    pass\n\n\n@controle("b', '    run(1)\n\n\n@controle("b')
    a1, a2 = _blocs_controles(av), _blocs_controles(ap)
    if set(a1) != {'a.py : un', 'b.py : deux'} or {n for n in a2 if a1.get(n) != a2[n]} != {'a.py : un'}:
        raise RuntimeError(f'contrôles changés mal repérés : {list(a1)}')


@controle("preparer.py : socle vérifié sans rien installer (--verifier --json), jamais « playwright install », jeu inconnu signalé, option inconnue = code 2, dossiers npm trouvés (apps Electron à part), node_modules à jour / absent / plus vieux que package.json")
def _():
    src = open(os.path.join(OC, 'preparer.py'), encoding='utf-8').read()
    if re.search(r"playwright['\"]?\s*,\s*['\"]install|playwright install chromium", src.replace('« playwright install »', '')):
        raise RuntimeError('preparer.py lance « playwright install »')
    r = subprocess.run([sys.executable, os.path.join(OC, 'preparer.py'), '--verifier', '--json'], cwd=RAC, capture_output=True, text=True, timeout=120)
    j = json.loads(r.stdout.strip().splitlines()[-1])
    etapes = {l['etape']: l['etat'] for l in j['lignes']}
    for e in ('python3', 'node', 'Chromium (Playwright)', 'Three.js r160 (cache commun)', 'paquets Node communs'):
        if e not in etapes: raise RuntimeError(f'étape absente : {e} ({list(etapes)})')
    if etapes['Chromium (Playwright)'] != 'ok': raise RuntimeError('Chromium non lancé : ' + r.stdout[-300:])
    if r.returncode != (0 if j['pret'] else 1): raise RuntimeError(f'code {r.returncode} pour pret={j["pret"]}')
    if any(l['etat'] == 'fait' for l in j['lignes']): raise RuntimeError('--verifier a installé quelque chose')
    r = subprocess.run([sys.executable, os.path.join(OC, 'preparer.py'), 'jeu-qui-n-existe-pas', '--verifier'], cwd=RAC, capture_output=True, text=True, timeout=120)
    if r.returncode != 1 or 'dossier inconnu' not in r.stdout: raise RuntimeError('jeu inconnu : ' + r.stdout[-200:])
    r = subprocess.run([sys.executable, os.path.join(OC, 'preparer.py'), '--bidule'], cwd=RAC, capture_output=True, text=True, timeout=30)
    if r.returncode != 2: raise RuntimeError(f'option inconnue : code {r.returncode}')
    spec = importlib.util.spec_from_file_location('preparer_t', os.path.join(OC, 'preparer.py'))
    P = importlib.util.module_from_spec(spec); spec.loader.exec_module(P)
    rel = lambda ds: sorted(os.path.relpath(d, RAC) for d in ds)
    if rel(P.dossiers_npm('cage-et-gloire', False)) != ['cage-et-gloire']: raise RuntimeError(rel(P.dossiers_npm('cage-et-gloire', False)))
    if rel(P.dossiers_npm('president-de-club', False)) != []: raise RuntimeError('app Electron prise sans --electron')
    if rel(P.dossiers_npm('president-de-club', True)) != ['president-de-club/outils/app-bureau']: raise RuntimeError('--electron')
    if 'valdragon' not in P.jeux_du_depot() or 'bureau' in P.jeux_du_depot(): raise RuntimeError(P.jeux_du_depot())
    with tempfile.TemporaryDirectory() as d:
        open(os.path.join(d, 'package.json'), 'w').write('{"dependencies":{"x":"1"}}')
        if P.a_jour(d): raise RuntimeError('sans node_modules : vu à jour')
        os.makedirs(os.path.join(d, 'node_modules', 'x'))
        open(os.path.join(d, 'node_modules', 'x', 'package.json'), 'w').write('{}')
        open(os.path.join(d, 'node_modules', '.package-lock.json'), 'w').write('{}')
        if not P.a_jour(d): raise RuntimeError('node_modules complet : vu périmé')
        t = time.time() + 30; os.utime(os.path.join(d, 'package.json'), (t, t))
        if P.a_jour(d): raise RuntimeError('package.json plus récent : vu à jour')
        os.utime(os.path.join(d, 'package.json'), (t - 60, t - 60))
        open(os.path.join(d, 'package.json'), 'w').write('{"dependencies":{"x":"1","y":"2"}}')
        os.utime(os.path.join(d, 'package.json'), (t - 60, t - 60))
        if P.a_jour(d): raise RuntimeError('dépendance y absente : vu à jour')


_FIXTURE_BLENDER = r"""
import bpy, math, sys
bpy.ops.wm.read_homefile(use_empty=True)
sortie, sorte = sys.argv[1], sys.argv[2]
def boite(nom, loc, dim):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.object; o.name = nom; o.scale = dim
    bpy.ops.object.transform_apply(scale=True); return o
if sorte == 'table':      # plateau sur 4 pieds : le dessous du plateau et le pied des pieds sont dans l'ombre
    ps = [boite('plateau', (0, 0, 1.0), (2, 1.2, .1))] + [boite(f'pied{i}', (x, y, .5), (.1, .1, 1)) for i, (x, y) in enumerate([(-.9, -.5), (.9, -.5), (-.9, .5), (.9, .5)])]
    ps.append(boite('sol', (0, 0, -.025), (3, 2, .05)))
    for o in ps: o.select_set(True)
elif sorte == 'noeud':    # décor animé par son nœud (pas de squelette) : action « Attack » sur l'objet
    o = boite('caisse', (0, 0, .5), (1, 1, 1)); o.animation_data_create()
    act = bpy.data.actions.new('Attack'); o.animation_data.action = act
    for f, z in ((1, .5), (20, 1.5)):
        o.location.z = z; o.keyframe_insert('location', frame=f)
    o.select_set(True)
else:                     # bête : corps long sur x, tête plus haute en +x, pattes ; un os, actions Idle et Attaque
    ps = [boite('corps', (0, 0, .6), (1.6, .5, .4)), boite('tete', (.95, 0, .95), (.4, .35, .35))] + \
         [boite(f'patte{i}', (x, y, .2), (.12, .12, .4)) for i, (x, y) in enumerate([(-.6, -.18), (.6, -.18), (-.6, .18), (.6, .18)])]
    for o in ps: o.select_set(True)
    bpy.context.view_layer.objects.active = ps[0]; bpy.ops.object.join(); corps = bpy.context.object
    bpy.ops.object.armature_add(location=(0, 0, 0)); ar = bpy.context.object
    corps.select_set(True); ar.select_set(True); bpy.context.view_layer.objects.active = ar
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    pb = ar.pose.bones[0]; pb.rotation_mode = 'XYZ'
    for nom, ang in (('Idle', 0), ('Attaque', 50)):
        act = bpy.data.actions.new(nom); ar.animation_data_create(); ar.animation_data.action = act
        for f, a in ((1, 0), (20, ang)):
            pb.rotation_euler = (0, math.radians(a), 0); pb.keyframe_insert('rotation_euler', frame=f)
        tr = ar.animation_data.nla_tracks.new(); tr.strips.new(nom, 1, act)
        ar.animation_data.action = None
    bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=sortie, export_format='GLB', export_animations=True, export_animation_mode='ACTIONS')
"""


def _bpy():
    """Python de Blender (bpy) : installé par outils-communs/blender/installer.sh s'il manque (≈ 40 s, une fois par machine)."""
    py = os.environ.get('BPY_PYTHON', '/home/claude/bpyenv/bin/python')
    if not (os.path.isfile(py) and subprocess.run([py, '-c', 'import bpy'], capture_output=True).returncode == 0):
        r = subprocess.run(['sh', os.path.join(OC, 'blender', 'installer.sh'), os.path.dirname(os.path.dirname(py))],
                           capture_output=True, text=True, timeout=600)
        if r.returncode:
            raise RuntimeError('installer.sh (Blender) en échec : ' + (r.stderr or r.stdout)[-300:])
    return py


def _glb_json(chemin):
    import struct
    b = open(chemin, 'rb').read()
    n = struct.unpack('<I', b[12:16])[0]
    return json.loads(b[20:20 + n])


@controle("blender/installer.sh, planche_sprites.py, cuire_ao.py, planche_avant_apres.py, apercu_three.py, rendu_studio.py : chaîne Blender de Bannières — poses prises dans les animations du modèle (Attaque ≠ Idle) ou remplacées (chute sur le flanc), regard deviné, images au cadre exact ; occlusion cuite dans COLOR_0 (dessous du plateau sombre), animations gardées, vue par Three.js ; planche avant/après dossier/sprites3d.js, créature absente = code 2 ; mauvaises options = code 2")
def _():
    from PIL import Image, ImageChops
    py = _bpy()
    BL = os.path.join(OC, 'blender')
    with tempfile.TemporaryDirectory() as d:
        fx = os.path.join(d, 'fixture.py'); open(fx, 'w').write(_FIXTURE_BLENDER)
        for sorte in ('bete', 'table', 'noeud'):
            run(py, fx, os.path.join(d, sorte + '.glb'), sorte, timeout=120)
        out = os.path.join(d, 'spr')
        o = run(py, os.path.join(BL, 'planche_sprites.py'), os.path.join(d, 'bete.glb'), out, '--id', 'bete', '--format', '64x48',
                '--unites', '2.4', '--poses', 'idle:2,atk:2,die:1', '--echantillons', '4', '--directions', '2', timeout=180)
        info = json.load(open(os.path.join(out, 'bete.json')))
        if info['animations'] != {'idle': 'Idle', 'atk': 'Attaque', 'die': 'remplacement'}:
            raise RuntimeError(f"animations choisies : {info['animations']}")
        if info['avant'] != 'x' or info['pxu'] != 20.0:
            raise RuntimeError(f"regard {info['avant']} (attendu x), pxu {info['pxu']} (attendu 20.0)")
        ims = {n: Image.open(os.path.join(out, f'bete_{n}.png')) for n in ('idle0', 'idle1', 'atk1', 'die0', 'dir0', 'dir1')}
        for n, im in ims.items():
            if im.size != (64, 48) or im.mode != 'RGBA' or not im.split()[3].getbbox():
                raise RuntimeError(f'image {n} : {im.size} {im.mode}, vide={not im.split()[3].getbbox()}')
        def diff(a, b):
            return sum(ImageChops.difference(ims[a].split()[3], ims[b].split()[3]).histogram()[40:])
        if diff('idle0', 'atk1') < 30 or diff('idle0', 'dir1') < 30:
            raise RuntimeError(f"attaque ou 2e direction identique au repos ({diff('idle0', 'atk1')}, {diff('idle0', 'dir1')} px)")
        bi, bd = ims['idle0'].split()[3].getbbox(), ims['die0'].split()[3].getbbox()
        if not (bd[3] - bd[1]) < (bi[3] - bi[1]) * .9:
            raise RuntimeError(f'chute de remplacement non couchée : hauteur {bd[3] - bd[1]} contre {bi[3] - bi[1]} debout')
        r = subprocess.run([py, os.path.join(BL, 'planche_sprites.py'), os.path.join(d, 'bete.glb'), out, '--anim', 'atk=Absente'],
                           capture_output=True, text=True, timeout=120)
        if r.returncode == 0 or 'Absente' not in r.stdout + r.stderr:
            raise RuntimeError('--anim atk=Absente accepté en silence')
        o = run(py, os.path.join(BL, 'planche_sprites.py'), os.path.join(d, 'noeud.glb'), out, '--id', 'noeud', '--format', '32x32',
                '--poses', 'atk:1', '--echantillons', '2', '--flotte', '.5', timeout=120)
        jn = json.load(open(os.path.join(out, 'noeud.json')))
        if jn['animations'] != {'atk': 'remplacement'} or not jn['animations_ignorees'] or 'sans squelette' not in o:
            raise RuntimeError(f"animation de nœud prise pour une animation de squelette : {jn['animations']} {jn['animations_ignorees']}")
        r = subprocess.run([py, os.path.join(BL, 'planche_sprites.py'), 'x.glb', out, '--format', '64'], capture_output=True, text=True)
        if r.returncode != 2:
            raise RuntimeError(f'--format 64 : code {r.returncode} (attendu 2)')
        # occlusion
        ao = os.path.join(d, 'table_ao.glb')
        run(py, os.path.join(BL, 'cuire_ao.py'), os.path.join(d, 'table.glb'), ao, '--echantillons', '16', timeout=180)
        ia = json.load(open(ao + '.json'))['occlusion']
        if not (ia['min'] < .6 and ia['moyenne'] < .97 and ia['part_assombrie'] > .05):
            raise RuntimeError(f'occlusion trop faible sous le plateau : {ia}')
        g = _glb_json(ao)
        if not all('COLOR_0' in pr['attributes'] for m in g['meshes'] for pr in m['primitives']):
            raise RuntimeError('COLOR_0 absent du GLB cuit')
        run(py, os.path.join(BL, 'cuire_ao.py'), os.path.join(d, 'bete.glb'), os.path.join(d, 'bete_ao.glb'), '--echantillons', '4', timeout=180)
        if len(_glb_json(os.path.join(d, 'bete_ao.glb')).get('animations', [])) < 2:
            raise RuntimeError('animations perdues par cuire_ao.py')
        r = subprocess.run([py, os.path.join(BL, 'cuire_ao.py'), ao, ao], capture_output=True, text=True)
        if r.returncode != 2:
            raise RuntimeError('sortie = entrée acceptée')
        # Three.js voit les couleurs de sommets
        o = run(sys.executable, os.path.join(BL, 'apercu_three.py'), ao, os.path.join(d, 'table.glb'), os.path.join(d, 'ap.png'), '--taille', '160', timeout=180)
        if _glb_json(ao).get('materials'):
            raise RuntimeError('matériau de cuisson laissé dans le GLB (aspect changé dans Three.js)')
        lg = [l for l in o.splitlines() if 'luminance' in l]
        if len(lg) != 2 or 'sommets oui' not in lg[0]:
            raise RuntimeError('apercu_three : ' + o[-300:])
        la, lb = (float(l.rsplit('luminance', 1)[1]) for l in lg)
        if not la < lb - 1:
            raise RuntimeError(f'occlusion invisible dans Three.js : luminance {la} (cuit) contre {lb} (brut)')
        # planche avant/après : dossier ↔ sprites3d.js fabriqué ici
        import base64, io
        fr = [Image.open(os.path.join(out, f'bete_{n}.png')) for n in ('idle0', 'idle1', 'atk0', 'atk1', 'die0')]
        sh = Image.new('RGBA', (64 * 5, 48))
        for k, im in enumerate(fr):
            sh.alpha_composite(im, (64 * k, 0))
        buf = io.BytesIO(); sh.save(buf, 'WEBP', lossless=True)
        js = os.path.join(d, 'sprites3d.js')
        open(js, 'w').write("'use strict';\nvar SPR3D=" + json.dumps({'bete': {'w': 64, 'h': 48, 'ax': 32, 'ay': 40, 'n': {'idle': 2, 'atk': 2, 'die': 1}, 'pxu': 20.0,
                            'img': 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()}}) + ';\n')
        o = run(sys.executable, os.path.join(BL, 'planche_avant_apres.py'), js, out, os.path.join(d, 'pl.png'), '--id', 'bete')
        lg = [l for l in o.splitlines() if l.startswith('bete')]
        if len(lg) != 2 or 'idle×2 atk×2 die×1' not in lg[0] or 'idle×2 atk×2 die×1' not in lg[1]:
            raise RuntimeError('planche_avant_apres : ' + o[-300:])
        if Image.open(os.path.join(d, 'pl.png')).size[0] < 5 * 64:
            raise RuntimeError('planche trop petite')
        run(sys.executable, os.path.join(BL, 'planche_avant_apres.py'), js, out, os.path.join(d, 'pl2.png'), '--id', 'bete,inconnue', attendu=2)
        shutil.copy(os.path.join(out, 'bete_idle0.png'), os.path.join(out, 'bete_garou_idle0.png'))   # autre créature au préfixe commun
        o = run(sys.executable, os.path.join(BL, 'planche_avant_apres.py'), out, out, os.path.join(d, 'pl3.png'), '--id', 'bete')
        if 'garou' in o or 'idle×2 ' not in o:
            raise RuntimeError('images de « bete_garou » mêlées à « bete » : ' + o[-200:])
        run(sys.executable, os.path.join(BL, 'planche_avant_apres.py'), out, out, os.path.join(d, 'pl4.png'), '--fond', 'violet', attendu=2)
        run(py, os.path.join(BL, 'rendu_studio.py'), os.path.join(d, 'table.glb'), os.path.join(d, 'studio.png'), '64', '4', timeout=120)
        if Image.open(os.path.join(d, 'studio.png')).size != (64, 64):
            raise RuntimeError('rendu_studio.py : image absente ou mauvaise taille')



@controle("blender/creature.py : créature sculptée d'après une recette (squelette + rayons) — GLB à squelette (os « .L » recopiés en « .R »), couleurs COLOR_0 vues au rendu, pièces hors de l'axe doublées, animations Idle/Attack/Death prises par planche_sprites (pas de remplacement) ; Icosphere des os ignorée (avant : modèle posé 1 u trop haut, « coupé ») ; recette fausse = code 2 avec le nom en cause")
def _():
    from PIL import Image, ImageChops, ImageStat
    py = _bpy()
    BL = os.path.join(OC, 'blender')
    rec = {'peau': {'couleur': '#2a8a2a', 'fonce': '#1a5a1a', 'ventre': '#3a9a3a', 'relief': .01, 'subdivision': 1, 'triangles': 4000},
           'os': [{'nom': 'bassin', 'tete': [0, 0, .5], 'queue': [0, 0, .8], 'r': [.25, .28]},
                  {'nom': 'torse', 'parent': 'bassin', 'queue': [.1, 0, 1.2], 'r': .3},
                  {'nom': 'tete', 'parent': 'torse', 'queue': [.4, 0, 1.3], 'r': [.16, .12]},
                  {'nom': 'bras.L', 'parent': 'torse', 'tete': [.1, .3, 1.1], 'queue': [.15, .5, .6], 'r': [.12, .09]},
                  {'nom': 'jambe.L', 'parent': 'bassin', 'tete': [0, .15, .5], 'queue': [0, .18, .05], 'r': [.14, .1]}],
           'pieces': [{'forme': 'cone', 'os': 'tete', 'de': [.3, .08, 1.38], 'a': [.25, .18, 1.6], 'r': .04, 'couleur': '#d0c0a0', 'courbure': .4}],
           'animations': {'Idle': {'duree': 1, 'cles': [{'t': 0}, {'t': .5, 'os': {'torse': {'tangage': -4}}}, {'t': 1}]},
                          'Attack': {'duree': .8, 'cles': [{'t': 0}, {'t': .4, 'os': {'torse': {'tangage': 35}, 'bras.*': {'tangage': -100}},
                                                                                 'deplacement': [.15, 0, 0]}, {'t': .8}]},
                          'Death': {'duree': 1, 'cles': [{'t': 0}, {'t': 1, 'os': {'bassin': {'tangage': -85}}, 'deplacement': [0, 0, -.3]}]}}}
    with tempfile.TemporaryDirectory() as d:
        rj = os.path.join(d, 'r.json'); json.dump(rec, open(rj, 'w'))
        glb = os.path.join(d, 'c.glb')
        o = run(py, os.path.join(BL, 'creature.py'), rj, glb, timeout=180)
        info = json.load(open(os.path.join(d, 'c.json')))
        g = _glb_json(glb)
        noms = sorted(a['name'] for a in g.get('animations', []))
        joints = len(g['skins'][0]['joints']) if g.get('skins') else 0
        if noms != ['Attack', 'Death', 'Idle'] or joints != 7 or info['pieces'] != 2 or not (1.3 < info['hauteur'] < 1.75):
            raise RuntimeError(f"GLB : animations {noms}, {joints} os (attendu 7), {info['pieces']} pièces (attendu 2), hauteur {info['hauteur']} — {o[-200:]}")
        if not all('COLOR_0' in pr['attributes'] for m in g['meshes'] for pr in m['primitives']):
            raise RuntimeError('COLOR_0 absent')
        (xa, ya, za), (xb, yb, zb) = info['pointes']   # corne recourbée et sa copie : pointes symétriques (avant : x opposés)
        if not (abs(xa - xb) < .01 and abs(ya + yb) < .01 and abs(za - zb) < .01 and abs(ya) > .05):
            raise RuntimeError(f"pièce recopiée non symétrique : {info['pointes']}")
        out = os.path.join(d, 'spr')
        o = run(py, os.path.join(BL, 'planche_sprites.py'), glb, out, '--id', 'c', '--format', '64x64', '--unites', '2.0',
                '--poses', 'idle:1,atk:2,die:1', '--echantillons', '4', timeout=240)
        ip = json.load(open(os.path.join(out, 'c.json')))
        if ip['animations'] != {'idle': 'Idle', 'atk': 'Attack', 'die': 'Death'} or 'coupé' in o or abs(ip['hauteur'] - info['hauteur']) > .1:
            raise RuntimeError(f"planche_sprites : {ip['animations']}, hauteur {ip['hauteur']} (créature {info['hauteur']}) — {o[-300:]}")
        im = {n: Image.open(os.path.join(out, f'c_{n}.png')) for n in ('idle0', 'atk1', 'die0')}
        r_, g_, b_ = ImageStat.Stat(im['idle0'].convert('RGB'), mask=im['idle0'].split()[3].point(lambda a: 255 if a > 200 else 0)).mean
        if not (g_ > r_ * 1.2 and g_ > b_ * 1.2):
            raise RuntimeError(f'couleurs de la recette perdues au rendu (vert attendu) : r {r_:.0f} v {g_:.0f} b {b_:.0f}')
        if sum(ImageChops.difference(im['idle0'].split()[3], im['atk1'].split()[3]).histogram()[40:]) < 30:
            raise RuntimeError('attaque identique au repos')
        bi, bd = im['idle0'].split()[3].getbbox(), im['die0'].split()[3].getbbox()
        if not (bd[3] - bd[1]) < (bi[3] - bi[1]) * .8:
            raise RuntimeError(f'Death non couchée : {bd} contre {bi}')
        for faute, mot in ((dict(rec, os=rec['os'] + [{'nom': 'x', 'parent': 'absent', 'queue': [0, 0, 1]}]), 'absent'),
                           (dict(rec, animations={'Idle': {'cles': [{'t': 0, 'os': {'aile': {'tangage': 3}}}]}}), 'aile'),
                           (dict(rec, animations={'Idle': {'cles': [{'t': 0, 'os': {'tete': {'pivot': 3}}}]}}), 'pivot'),
                           (dict(rec, os=rec['os'] + [{'nom': 'jambe.R', 'parent': 'bassin', 'tete': [0, -.15, .5], 'queue': [0, -.18, .05]}]), 'jambe.R')):
            json.dump(faute, open(rj, 'w'))
            r = subprocess.run([py, os.path.join(BL, 'creature.py'), rj, glb], capture_output=True, text=True, timeout=120)
            if r.returncode != 2 or mot not in r.stderr:
                raise RuntimeError(f'recette fausse ({mot}) : code {r.returncode} {r.stderr[-200:]}')



@controle("gros_plan.py : planche avant/après plein cadre + gros plan trouvé seul sur ce qui change (créature remplacée cadrée, 2e zone ailleurs), verdict (identique = aucun changement sans zone, assombrissement = saute aux yeux, petite créature = visible en regardant), --ignorer, --zone, --strict, dossier de captures (avant/ + images), page à glissière autonome ; captures.py --avant-dossier --gros-plan")
def _():
    import numpy as np
    from PIL import Image
    gp = os.path.join(OC, 'gros_plan.py')
    with tempfile.TemporaryDirectory() as d:
        rng = np.random.default_rng(3)
        base = np.clip(np.stack([60 + 30 * rng.random((400, 640)), 100 + 30 * rng.random((400, 640)), 50 + 20 * rng.random((400, 640))], -1), 0, 255)
        base = np.asarray(Image.fromarray(base.astype(np.uint8)).resize((640, 400)))
        A, B = os.path.join(d, 'avant'), os.path.join(d, 'apres'); os.makedirs(A); os.makedirs(B)
        av = base.copy(); av[200:240, 450:480] = (120, 110, 100)          # ancienne bête (grise)
        ap = base.copy(); ap[195:240, 452:482] = (200, 60, 40)            # nouvelle bête (rousse), même case
        ap[40:60, 60:80] = (230, 230, 230)                                # petit détail ailleurs (2e zone)
        Image.fromarray(av).save(os.path.join(A, 'bete.png')); Image.fromarray(ap).save(os.path.join(B, 'bete.png'))
        Image.fromarray(base).save(os.path.join(A, 'pareil.png')); Image.fromarray(base).save(os.path.join(B, 'pareil.jpg'))
        Image.fromarray((base * 0.6).astype(np.uint8)).save(os.path.join(B, 'sombre.png')); Image.fromarray(base).save(os.path.join(A, 'sombre.png'))
        Image.new('RGB', (9, 9)).save(os.path.join(B, 'planche.png'))
        o = os.path.join(d, 'o')
        r = subprocess.run([sys.executable, gp, A, B, o, '--zones', '2'], capture_output=True, text=True, timeout=120)
        if r.returncode:
            raise RuntimeError('gros_plan : ' + (r.stderr or r.stdout)[-300:])
        j = {v['nom']: v for v in json.load(open(os.path.join(o, 'gros_plan.json')))['vues']}
        if set(j) != {'bete', 'pareil', 'sombre'}:
            raise RuntimeError(f'paires : {sorted(j)}')
        if j['pareil']['verdict'] != 'aucun changement' or j['pareil']['zones']:
            raise RuntimeError(f"image identique (png ↔ jpg) : {j['pareil']['verdict']} {j['pareil']['zones']}")
        if j['sombre']['verdict'] != 'saute aux yeux':
            raise RuntimeError(f"assombrissement de 40 % : {j['sombre']}")
        b = j['bete']; z = b['zones']
        if b['verdict'] != 'visible en regardant' or len(z) != 2:
            raise RuntimeError(f'créature remplacée : {b}')
        x, y, l, h = z[0]
        if not (x <= 452 and x + l >= 482 and y <= 195 and y + h >= 240 and l <= 200):
            raise RuntimeError(f'gros plan 1 ne cadre pas la créature (452-482 × 195-240) : {z[0]}')
        x, y, l, h = z[1]
        if not (x <= 60 and x + l >= 80 and y <= 40 and y + h >= 60):
            raise RuntimeError(f'gros plan 2 ne cadre pas le détail (60-80 × 40-60) : {z[1]}')
        for f in ('bete_gros_plan.jpg', 'sombre_gros_plan.jpg', 'index.html'):
            if not os.path.getsize(os.path.join(o, f)):
                raise RuntimeError(f + ' vide')
        im = Image.open(os.path.join(o, 'bete_gros_plan.jpg'))
        if im.width != 2 * 640 + 8 or im.height < 400 + 2 * 300:
            raise RuntimeError(f'planche plein cadre + 2 gros plans : {im.size}')
        html = open(os.path.join(o, 'index.html')).read()
        if 'http://' in html or 'https://' in html or html.count('<img') < 12:  # bête 3 paires + sombre ≥ 2 + pareil 1
            raise RuntimeError('page à glissière : lien externe ou images manquantes')
        # --ignorer la case de la bête et le détail → plus rien ; --zone imposée ; --strict (aucun / discret → code 1)
        r = subprocess.run([sys.executable, gp, os.path.join(A, 'bete.png'), os.path.join(B, 'bete.png'), os.path.join(d, 'o2'),
                            '--ignorer', '440,185,60,70', '--ignorer', '0.05,0.05,0.12,0.15', '--strict'], capture_output=True, text=True, timeout=60)
        v = json.load(open(os.path.join(d, 'o2', 'gros_plan.json')))['vues'][0]
        if r.returncode != 1 or v['verdict'] != 'aucun changement':
            raise RuntimeError(f"--ignorer / --strict (code {r.returncode}) : {v['verdict']}")
        r = subprocess.run([sys.executable, gp, A, B, os.path.join(d, 'o3'), '--zone', '0,0,100,50', '--strict'], capture_output=True, text=True, timeout=60)
        if r.returncode != 1 or json.load(open(os.path.join(d, 'o3', 'gros_plan.json')))['vues'][0]['zones'] != [[0, 0, 100, 50]]:
            raise RuntimeError(f'--zone imposée / --strict avec une vue identique (code {r.returncode})')
        # dossier de captures.py --avant : <sortie>/avant ↔ <sortie>
        cap = os.path.join(d, 'cap'); shutil.copytree(B, cap); shutil.copytree(A, os.path.join(cap, 'avant'))
        run(sys.executable, gp, cap, timeout=60)
        if not os.path.exists(os.path.join(cap, 'gros_plan', 'bete_gros_plan.jpg')):
            raise RuntimeError('mode dossier de captures : planche absente')
        # branché dans captures.py
        page = open(os.path.join(OC, 'tests', 'captures_factice.html')).read()
        for nom, pg in (('jeu', page), ('autre', page.replace("window.VARIANTE='#2c2'", "window.VARIANTE='#22c'"))):
            os.makedirs(os.path.join(d, nom)); open(os.path.join(d, nom, 'index.html'), 'w').write(pg)
        cfg = {'jeu': 'factice', 'dossier': os.path.join(d, 'jeu'), 'pret': 'window.pret', 'pret_ms': 50, 'images': 4, 'pas': 162,
               'vues': [{'nom': 'pret', 'js': 'preparer()', 'occupe': 'window.occupe'}], 'appareils': {'petit': {'largeur': 200, 'hauteur': 220}}}
        reg = os.path.join(d, 'vues.json'); json.dump(cfg, open(reg, 'w'))
        r = subprocess.run([sys.executable, os.path.join(OC, 'captures.py'), reg, os.path.join(d, 'oc'), '--avant-dossier', os.path.join(d, 'autre'), '--gros-plan', '--sans-verrou'],
                           capture_output=True, text=True, timeout=180)
        gj = os.path.join(d, 'oc', 'gros_plan', 'gros_plan.json')
        if r.returncode or not os.path.exists(gj) or json.load(open(gj))['vues'][0]['verdict'] == 'aucun changement':
            raise RuntimeError(f'captures.py --gros-plan (code {r.returncode}) : ' + r.stdout[-300:])


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
if '--liste' in sys.argv:
    print(f'\n--liste : rien n\'a été lancé.')
    sys.exit(0)
if SELECTION is not None:
    print(f'\n{ok}/{len(RES)} contrôles réussis — {len(SAUTES)} sautés (sélection{" --modifies" if "--modifies" in sys.argv else ""}'
          f'{" --seulement" if _MOTIF else ""}) : la passe complète reste due avant de pousser.')
    if not RES and '--modifies' in sys.argv and _stems:
        print('Des outils ont changé mais aucun contrôle ne s\'en sert : en ajouter un (code 3).')
        sys.exit(3)
    if not RES:
        print('Aucun outil changé : rien à vérifier en ciblé.')
else:
    print(f'\n{ok}/{len(RES)} contrôles réussis')
sys.exit(0 if ok == len(RES) else 1)
