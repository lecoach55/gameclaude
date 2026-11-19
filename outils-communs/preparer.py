#!/usr/bin/env python3
"""Préparer un poste de travail en une commande (machine neuve d'une conversation, ou après un « git pull »).

usage : python3 outils-communs/preparer.py [jeu…|tout] [--verifier] [--json] [--electron]
  sans jeu    : le socle commun seulement (Python, Node, Playwright + Chromium, caches communs)
  jeu…        : + les dépendances npm de ces jeux (dossier du dépôt : cage-et-gloire, valdragon…)
  tout        : + celles de tous les jeux
  --verifier  : ne rien installer, dire seulement ce qui manque (code 1 s'il manque quelque chose)
  --json      : résultat lisible par un programme sur la dernière ligne
  --electron  : inclut aussi les outils d'apps de bureau (president-de-club/outils/app-bureau, ~200 Mo)

Ce qu'il fait (rien n'est refait si c'est déjà là : deuxième lancement en quelques secondes) :
  socle  : python3, node, npm, git ; modules Python playwright, PIL, numpy (pip --break-system-packages si absent) ;
           Chromium de Playwright lancé pour de vrai. Il ne lance JAMAIS « playwright install » : Chromium est préinstallé et
           une autre version ne le trouverait plus (retour Valdragon du 16/11).
  caches : Three.js r160 dans ~/.cache/gameclaude (routes.py : pages qui chargent three sur un CDN bloqué) ;
           jsdom 24 commun dans ~/.cache/gameclaude/node (outils Node de Président de Club, Couronnes & Complots :
           NODE_PATH=~/.cache/gameclaude/node/node_modules, affiché à la fin).
  jeux   : « npm ci » (package-lock.json présent, jamais réécrit) ou « npm install » dans chaque dossier du jeu qui a un package.json et dont node_modules manque ou est plus vieux
           que package.json / package-lock.json.

Code de sortie : 0 si tout est prêt, 1 sinon (la ligne en ÉCHEC dit quoi faire)."""
import json, os, shutil, subprocess, sys, time

ICI = os.path.dirname(os.path.abspath(__file__))
RAC = os.path.dirname(ICI)
CACHE = os.path.join(os.path.expanduser('~'), '.cache', 'gameclaude')
NODE_COMMUN = os.path.join(CACHE, 'node')
PAQUETS_NODE_COMMUNS = {'jsdom': '24'}            # nom → version majeure voulue
MODULES_PY = {'playwright': 'playwright', 'PIL': 'pillow', 'numpy': 'numpy'}
IGNORES = ('node_modules', '.git', 'build', 'references', 'mesures', '__pycache__')
ELECTRON = ('app-bureau',)
LIGNES = []


def note(etape, etat, detail='', duree=0.0):
    LIGNES.append({'etape': etape, 'etat': etat, 'detail': detail, 's': round(duree, 1)})
    marque = {'ok': 'OK     ', 'fait': 'FAIT   ', 'manque': 'MANQUE ', 'echec': 'ÉCHEC  ', 'info': 'INFO   '}[etat]
    print(f"{marque} {etape}{' — ' + detail if detail else ''}{f' ({duree:.1f} s)' if duree >= 0.5 else ''}", flush=True)


def _cmd(cmd, cwd=None, timeout=600):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout)


def socle(verifier):
    for prog in ('python3', 'node', 'npm', 'git'):
        p = shutil.which(prog)
        if p:
            v = ''
            if prog in ('node', 'npm'):
                v = _cmd([prog, '-v']).stdout.strip()
            note(prog, 'ok', v)
        else:
            note(prog, 'echec', 'absent du PATH (indispensable : installer avant tout le reste)')
    import importlib.util
    manquants = [pip for mod, pip in MODULES_PY.items() if importlib.util.find_spec(mod) is None]
    if not manquants:
        note('modules Python', 'ok', ', '.join(MODULES_PY.values()))
    elif verifier:
        note('modules Python', 'manque', ', '.join(manquants))
    else:
        t = time.time()
        r = _cmd([sys.executable, '-m', 'pip', 'install', '--break-system-packages', '-q', *manquants])
        importlib.invalidate_caches()
        reste = [pip for mod, pip in MODULES_PY.items() if importlib.util.find_spec(mod) is None]
        note('modules Python', 'echec' if reste else 'fait',
             f"pip : {(r.stderr or r.stdout)[-200:]}" if reste else 'installés : ' + ', '.join(manquants), time.time() - t)
    t = time.time()
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            nav = p.chromium.launch()
            v = nav.version
            nav.close()
        note('Chromium (Playwright)', 'ok', v, time.time() - t)
    except Exception as e:
        note('Chromium (Playwright)', 'echec', f"{str(e).splitlines()[0][:200]} — ne PAS lancer « playwright install » : "
             "utiliser le Chromium préinstallé (require('playwright') / chromium.launch() sans option)", time.time() - t)


def caches(verifier):
    sys.path.insert(0, ICI)
    import routes
    t = time.time()
    d = routes.three_local(telecharger=False)
    if d:
        note('Three.js r160 (cache commun)', 'ok', d)
    elif verifier:
        note('Three.js r160 (cache commun)', 'manque', 'routes.py three')
    else:
        try:
            note('Three.js r160 (cache commun)', 'fait', routes.three_local(), time.time() - t)
        except Exception as e:
            note('Three.js r160 (cache commun)', 'echec', str(e)[:200], time.time() - t)
    nm = os.path.join(NODE_COMMUN, 'node_modules')
    manquants = []
    for nom, majeure in PAQUETS_NODE_COMMUNS.items():
        try:
            v = json.load(open(os.path.join(nm, nom, 'package.json')))['version']
            if v.split('.')[0] != majeure:
                manquants.append(nom)
        except Exception:
            manquants.append(nom)
    if not manquants:
        note('paquets Node communs', 'ok', f"{', '.join(PAQUETS_NODE_COMMUNS)} — NODE_PATH={nm}")
    elif verifier:
        note('paquets Node communs', 'manque', ', '.join(manquants))
    else:
        t = time.time()
        os.makedirs(NODE_COMMUN, exist_ok=True)
        if not os.path.exists(os.path.join(NODE_COMMUN, 'package.json')):
            open(os.path.join(NODE_COMMUN, 'package.json'), 'w').write('{"name":"gameclaude-commun","private":true}\n')
        r = _cmd(['npm', 'install', '--no-audit', '--no-fund', '--silent',
                  *[f'{n}@{PAQUETS_NODE_COMMUNS[n]}' for n in manquants]], cwd=NODE_COMMUN)
        note('paquets Node communs', 'echec' if r.returncode else 'fait',
             (r.stderr or r.stdout)[-200:] if r.returncode else f"{', '.join(manquants)} — NODE_PATH={nm}", time.time() - t)


def jeux_du_depot():
    return sorted(d for d in os.listdir(RAC) if os.path.isdir(os.path.join(RAC, d)) and not d.startswith('.')
                  and d not in ('bureau', 'studio', 'outils-communs') and
                  (os.path.isdir(os.path.join(RAC, d, 'jeu')) or os.path.isfile(os.path.join(RAC, d, 'README.md'))))


def dossiers_npm(jeu, electron):
    """Dossiers du jeu qui ont un package.json (hors node_modules, sorties, apps de bureau sauf --electron)."""
    out = []
    for racine, ds, fs in os.walk(os.path.join(RAC, jeu)):
        ds[:] = [d for d in ds if d not in IGNORES and not d.startswith('.')]
        if not electron and any(e in racine.split(os.sep) for e in ELECTRON):
            ds[:] = []
            continue
        if 'package.json' in fs:  # (s'il y a un lock : npm ci, voir npm_jeux)
            try:
                pj = json.load(open(os.path.join(racine, 'package.json')))
            except Exception:
                continue
            if pj.get('dependencies') or pj.get('devDependencies'):
                out.append(racine)
    return out


def a_jour(d):
    """node_modules présent et plus récent que package.json / package-lock.json (et chaque dépendance déclarée présente)."""
    nm = os.path.join(d, 'node_modules')
    temoin = os.path.join(nm, '.package-lock.json')
    if not os.path.isfile(temoin):
        return False
    t = os.path.getmtime(temoin)
    for f in ('package.json', 'package-lock.json'):
        p = os.path.join(d, f)
        if os.path.isfile(p) and os.path.getmtime(p) > t + 1:
            return False
    pj = json.load(open(os.path.join(d, 'package.json')))
    deps = {**pj.get('dependencies', {}), **pj.get('devDependencies', {})}
    return all(os.path.isfile(os.path.join(nm, n, 'package.json')) for n in deps)


def npm_jeux(jeux, verifier, electron):
    for jeu in jeux:
        if not os.path.isdir(os.path.join(RAC, jeu)):
            note(jeu, 'echec', f"dossier inconnu (jeux du dépôt : {', '.join(jeux_du_depot())})")
            continue
        ds = dossiers_npm(jeu, electron)
        if not ds:
            note(jeu, 'ok', 'aucune dépendance npm')
        for d in ds:
            rel = os.path.relpath(d, RAC)
            if a_jour(d):
                note(f'npm {rel}', 'ok', 'node_modules à jour')
            elif verifier:
                note(f'npm {rel}', 'manque', f'cd {rel} && npm install')
            else:
                t = time.time()
                # package-lock.json présent (suivi par git) : « npm ci » l'applique tel quel sans jamais le réécrire
                ci = os.path.isfile(os.path.join(d, 'package-lock.json'))
                r = _cmd(['npm', 'ci' if ci else 'install', '--no-audit', '--no-fund', '--silent'], cwd=d, timeout=900)
                if r.returncode == 0:   # npm ne retouche pas .package-lock.json s'il n'y a rien à faire : témoin rafraîchi
                    tm = os.path.join(d, 'node_modules', '.package-lock.json')
                    if os.path.isfile(tm):
                        os.utime(tm)
                note(f'npm {rel}', 'echec' if r.returncode else 'fait',
                     (r.stderr or r.stdout)[-200:] if r.returncode else ('installé (npm ci)' if ci else 'installé'), time.time() - t)


def main(argv):
    if '-h' in argv or '--help' in argv:
        print(__doc__)
        return 0
    verifier, en_json, electron = '--verifier' in argv, '--json' in argv, '--electron' in argv
    inconnues = [a for a in argv if a.startswith('-') and a not in ('--verifier', '--json', '--electron')]
    if inconnues:
        print(f"option inconnue : {' '.join(inconnues)}\n{__doc__}", file=sys.stderr)
        return 2
    jeux = [a.strip('/') for a in argv if not a.startswith('-')]
    if 'tout' in jeux:
        jeux = jeux_du_depot()
    t0 = time.time()
    socle(verifier)
    caches(verifier)
    npm_jeux(jeux, verifier, electron)
    total = time.time() - t0
    mauvais = [l for l in LIGNES if l['etat'] in ('echec', 'manque')]
    print(f"\n{'Poste prêt' if not mauvais else f'{len(mauvais)} point(s) à régler'} en {total:.1f} s"
          f"{' (vérification seule)' if verifier else ''}. Outils Node hors d'un jeu : "
          f"NODE_PATH={os.path.join(NODE_COMMUN, 'node_modules')}")
    if en_json:
        print(json.dumps({'pret': not mauvais, 's': round(total, 1), 'lignes': LIGNES}, ensure_ascii=False))
    return 1 if mauvais else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
