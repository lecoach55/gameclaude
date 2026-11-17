#!/usr/bin/env python3
"""Routes communes : les pages de jeu qui chargent une bibliothèque sur un CDN (bloqué dans le bac à sable) la reçoivent en local.

Hameau charge Three.js r160 sur cdn.jsdelivr.net : sans cela, banc, singe et captures restent sur un écran noir. Avant, chaque outil
recopiait sa propre redirection (13 scripts de Hameau, chemin /home/claude/deps absent sur une machine neuve, banc.json patché par sed).

Python (Playwright async) :   from routes import brancher ;  await brancher(ctx_ou_page)            # routes par défaut
Python (Playwright sync)  :   from routes import brancher_sync ;  brancher_sync(pg)
Ligne de commande         :   python3 outils-communs/routes.py three [0.160.0]   → dossier local de three (téléchargé une fois)
                              python3 outils-communs/routes.py essai page.html   → ouvre la page, liste ce qui est servi / manque

Routes par défaut (ROUTES_DEFAUT) : https://cdn.jsdelivr.net/npm/three@<v>/… et https://unpkg.com/three@<v>/… → copie locale de
three <v> (cherchée dans $THREE, /home/claude/t3d, /home/claude/deps, puis ~/.cache/gameclaude ; sinon « npm pack three@<v> », ≈ 1 s,
une seule fois par machine). Les polices Google ne sont PAS redirigées (les références d'images ont été prises sans elles).

Routes en plus (réglage « routes » de banc.json / singe.json, ou argument routes=) : {"préfixe d'adresse": cible}
  cible = dossier ou fichier (chemin absolu, ou relatif à `base`) → le reste de l'adresse est cherché dans le dossier
        = "three" → copie locale de three (version lue dans l'adresse « three@x.y.z », sinon 0.160.0)
        = "" → réponse vide (200)       = null → requête refusée (échec immédiat au lieu d'un délai)
  "routes": false coupe tout (y compris les routes par défaut).
Chaque fichier servi porte Access-Control-Allow-Origin: * (scripts module chargés depuis file:// ou localhost).
Les routes sont posées sur la page (ou le contexte) passée : une route posée ensuite sur la même PAGE passe avant (Playwright essaie
les plus récentes d'abord), mais une route posée sur le CONTEXTE passe après celles d'une page.
Le journal (dict renvoyé) compte les fichiers servis et liste les manquants (404) : un manquant = route mal réglée.
"""
import mimetypes, os, re, shutil, subprocess, sys, tarfile, tempfile, urllib.parse

ICI = os.path.dirname(os.path.abspath(__file__))
THREE_DEFAUT = '0.160.0'
CACHE = os.path.join(os.path.expanduser('~'), '.cache', 'gameclaude')
_ECHECS = {}  # version → raison : un téléchargement raté n'est pas relancé à chaque requête
ROUTES_DEFAUT = {'https://cdn.jsdelivr.net/npm/three@': 'three', 'https://unpkg.com/three@': 'three'}
TYPES = {'.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm',
         '.css': 'text/css', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.ktx2': 'image/ktx2'}


def _version_de(d):
    try:
        import json
        return json.load(open(os.path.join(d, 'package.json'))).get('version')
    except Exception:
        return None


def three_local(version=THREE_DEFAUT, telecharger=True):
    """Dossier d'une copie de three <version> (avec build/ et examples/jsm/). Téléchargée une fois par machine si besoin."""
    cands = [os.environ.get('THREE'), '/home/claude/t3d/node_modules/three', '/home/claude/deps/node_modules/three',
             os.path.join(CACHE, f'three@{version}')]
    for d in cands:
        if d and os.path.isfile(os.path.join(d, 'build', 'three.module.js')) and _version_de(d) == version:
            return d
    if not telecharger:
        return None
    if version in _ECHECS:
        raise RuntimeError(_ECHECS[version])
    dest = os.path.join(CACHE, f'three@{version}')
    if os.path.isdir(dest):  # copie incomplète (téléchargement interrompu) : on la refait
        shutil.rmtree(dest, ignore_errors=True)
    os.makedirs(CACHE, exist_ok=True)
    tmp = tempfile.mkdtemp(prefix='three-', dir=CACHE)
    try:
        if not shutil.which('npm'):
            _ECHECS[version] = 'routes : npm absent, impossible de télécharger three (donner une copie avec THREE=dossier)'
            raise RuntimeError(_ECHECS[version])
        r = subprocess.run(['npm', 'pack', f'three@{version}', '--silent'], cwd=tmp, capture_output=True, text=True, timeout=180)
        tgz = [f for f in os.listdir(tmp) if f.endswith('.tgz')]
        if r.returncode or not tgz:
            _ECHECS[version] = (f'routes : impossible de télécharger three@{version} (npm pack) : {(r.stderr or r.stdout)[-300:]}')
            raise RuntimeError(f'routes : impossible de télécharger three@{version} (npm pack) : {(r.stderr or r.stdout)[-300:]}')
        with tarfile.open(os.path.join(tmp, tgz[0])) as t:
            membres = [m for m in t.getmembers() if m.name.startswith('package/') and '..' not in m.name and (m.isfile() or m.isdir())]
            try:
                t.extractall(tmp, members=membres, filter='data')
            except TypeError:  # Python < 3.12
                t.extractall(tmp, members=membres)
        if not os.path.isdir(dest):
            try:
                os.replace(os.path.join(tmp, 'package'), dest)  # atomique : deux outils lancés ensemble ne se gênent pas
            except OSError:
                pass
        print(f'routes : three@{version} copié dans {dest}', file=sys.stderr)
        return dest
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def preparer(routes=None, base=None):
    """Routes effectives [(préfixe, cible)] : défaut + réglages (un préfixe des réglages remplace celui du défaut). routes=False → []."""
    if routes is False:
        return []
    tout = dict(ROUTES_DEFAUT)
    for k, v in (routes or {}).items():
        if isinstance(v, str) and v not in ('', 'three') and base and not os.path.isabs(v):
            v = os.path.normpath(os.path.join(base, v))
        tout[k] = v
    return sorted(tout.items(), key=lambda kv: -len(kv[0]))  # le préfixe le plus long d'abord


def resoudre(url, routes):
    """(action, valeur) pour une adresse : ('fichier', chemin) | ('vide', None) | ('refus', None) | ('manquant', chemin) | (None, None)."""
    for pre, cible in routes:
        if not url.startswith(pre):
            continue
        reste = urllib.parse.unquote(url[len(pre):].split('?')[0].split('#')[0]).lstrip('/')
        if cible is None:
            return 'refus', None
        if cible == '':
            return 'vide', None
        if cible == 'three':
            m = re.match(r'^(\d+\.\d+(?:\.\d+)?)/(.*)$', reste) if pre.endswith('three@') else re.search(r'three@(\d+\.\d+(?:\.\d+)?)/(.*)$', urllib.parse.unquote(url.split('?')[0]))
            v, chemin = (m.group(1), m.group(2).lstrip('/')) if m else (THREE_DEFAUT, reste)
            if v.count('.') == 1:
                v += '.0'
            try:
                racine = three_local(v)
            except Exception as e:  # pas de réseau npm, version inconnue : fichier manquant (visible au journal), l'outil continue
                print(str(e)[:200], file=sys.stderr)
                return 'manquant', url
            if chemin.startswith('addons/'):
                chemin = 'examples/jsm/' + chemin[len('addons/'):]
            f = os.path.join(racine, chemin)
        elif os.path.isfile(cible):
            racine, f = None, cible
        else:
            racine, f = cible, os.path.join(cible, reste)
        f = os.path.normpath(f)
        if racine and os.path.commonpath([f, os.path.normpath(racine)]) != os.path.normpath(racine):
            return 'refus', None  # « .. » ou « // » : jamais un fichier hors du dossier routé
        return ('fichier', f) if os.path.isfile(f) else ('manquant', f)
    return None, None


def _motif(routes):
    return re.compile('^(?:' + '|'.join(re.escape(p) for p, _ in routes) + ')')


def _entetes(f):
    t = TYPES.get(os.path.splitext(f)[1].lower()) or mimetypes.guess_type(f)[0] or 'application/octet-stream'
    return {'content-type': t, 'access-control-allow-origin': '*', 'cache-control': 'no-store'}


def _journal():
    return {'servis': 0, 'vides': 0, 'refuses': 0, 'manquants': []}


async def brancher(cible, routes=None, base=None, journal=None):
    """Installe les routes sur un BrowserContext ou une Page Playwright (async). Renvoie le journal {servis, vides, refuses, manquants}."""
    R = preparer(routes, base)
    j = journal if journal is not None else _journal()
    if not R:
        return j

    async def h(route):
        a, f = resoudre(route.request.url, R)
        if a == 'fichier':
            j['servis'] += 1
            await route.fulfill(status=200, headers=_entetes(f), body=open(f, 'rb').read())
        elif a == 'vide':
            j['vides'] += 1
            await route.fulfill(status=200, headers={'access-control-allow-origin': '*'}, body=b'')
        elif a == 'refus':
            j['refuses'] += 1
            await route.abort()
        elif a == 'manquant':
            j['manquants'].append(route.request.url)
            await route.fulfill(status=404, headers={'access-control-allow-origin': '*'}, body=b'')
        else:
            await route.continue_()
    await cible.route(_motif(R), h)
    return j


def brancher_sync(cible, routes=None, base=None, journal=None):
    """Même chose pour Playwright synchrone (sync_api)."""
    R = preparer(routes, base)
    j = journal if journal is not None else _journal()
    if not R:
        return j

    def h(route):
        a, f = resoudre(route.request.url, R)
        if a == 'fichier':
            j['servis'] += 1
            route.fulfill(status=200, headers=_entetes(f), body=open(f, 'rb').read())
        elif a == 'vide':
            j['vides'] += 1
            route.fulfill(status=200, headers={'access-control-allow-origin': '*'}, body=b'')
        elif a == 'refus':
            j['refuses'] += 1
            route.abort()
        elif a == 'manquant':
            j['manquants'].append(route.request.url)
            route.fulfill(status=404, headers={'access-control-allow-origin': '*'}, body=b'')
        else:
            route.continue_()
    cible.route(_motif(R), h)
    return j


def resume(j):
    t = f"routes : {j['servis']} fichier(s) servi(s) en local"
    if j['vides']:
        t += f", {j['vides']} vide(s)"
    if j['refuses']:
        t += f", {j['refuses']} refusé(s)"
    if j['manquants']:
        t += f" · {len(j['manquants'])} MANQUANT(S) : " + ', '.join(j['manquants'][:3])
    return t


def _essai(page):
    from playwright.sync_api import sync_playwright
    sys.path.insert(0, ICI)
    from atelier import ARGS
    url = page if re.match(r'^(https?|file):', page) else 'file://' + os.path.abspath(page)
    with sync_playwright() as p:
        nav = p.chromium.launch(args=ARGS)
        pg = nav.new_page()
        err = []
        pg.on('pageerror', lambda e: err.append(str(e)[:200]))
        j = brancher_sync(pg)
        pg.goto(url, timeout=120000)
        pg.wait_for_timeout(3000)
        print(resume(j))
        print('erreurs JS :', err[:5] or 'aucune')
        nav.close()
        return 1 if (j['manquants'] or err) else 0


if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['three']:
        print(three_local(a[1] if len(a) > 1 else THREE_DEFAUT))
    elif a[:1] == ['essai'] and len(a) > 1:
        sys.exit(_essai(a[1]))
    else:
        print(__doc__)
        sys.exit(2)
