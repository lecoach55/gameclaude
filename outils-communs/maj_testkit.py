#!/usr/bin/env python3
"""Versions de la trousse de test (testkit.js) : quelle version a chaque jeu, ce qui lui manque, et mise à jour.

  python3 outils-communs/maj_testkit.py                 état de toutes les copies du dépôt (version, manques, ajouts locaux)
  python3 outils-communs/maj_testkit.py <jeu>           détail pour un jeu + ce que ferait la mise à jour
  python3 outils-communs/maj_testkit.py <jeu> --appliquer   met à jour les copies remplaçables du jeu
        (--forcer : même si la copie a des ajouts locaux, qui seraient perdus)
  python3 outils-communs/maj_testkit.py --json          état en JSON (utilisé par bureau.py)

Une copie est REMPLAÇABLE quand c'est un fichier testkit*.js à part (recopié tel quel, « export » retiré si la copie
n'en avait pas), ou un bloc entouré de /*TESTKIT-DEBUT*/ … /*TESTKIT-FIN*/ dans un fichier du jeu (modèle : Président
de Club). Une trousse recopiée dans le code sans ces repères est seulement signalée (ligne de début et de fin) :
l'équipe du jeu entoure le bloc des deux repères une fois, et les mises à jour suivantes se font en une commande.

Version d'une copie : le numéro « const TK={version:N » si présent (depuis la v6), sinon déduit des fonctions présentes
(table VERSIONS ci-dessous, de la plus ancienne à la plus récente). « Ajouts locaux » = fonctions TK.x, options o.x,
fonctions ou window.x que la copie a et que la version commune n'a pas : à reporter dans outils-communs avant de remplacer.
Ce script ne touche à rien sans --appliquer ; bureau.py ne fait que lire.
"""
import glob
import json
import os
import re
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
RAC = os.path.dirname(ICI)
COMMUN = os.path.join(ICI, 'testkit.js')
DEBUT, FIN = '/*TESTKIT-DEBUT*/', '/*TESTKIT-FIN*/'
IGNORE = {'outils-communs', 'bureau', 'studio', 'node_modules'}

# (version, nom court, ce que ça apporte, [motifs qui doivent tous être présents], [motifs qui doivent être absents])
VERSIONS = [
    (1, 'base', '🐞 signalement, compteur img/s, banc, 1 % le plus lent', [r'signalement_', r'bas1'], []),
    (2, 'base attendue', 'attend window.claude (10 s) et dit pourquoi la base manque (TK.base) ; mesure refaite si la page est masquée',
     [r"TK\.base\s*=", r'masquee'], []),
    (3, 'filtre des pauses', 'ignore les pauses > 1 s : des img/s qui ne s\'effondrent plus quand l\'onglet passe en arrière-plan',
     [r'pauses\s*:\s*pz'], []),
    (4, 'secours + DOM', 'domCapture (capture des jeux HTML), rapport de secours sans base (option secours), état du jeu joint au banc',
     [r'function\s+domCapture', r'TK\.rapport\s*=', r'o\.etat\)\s*out\.etat'], []),
    (5, 'sans lien direct', 'rapport de secours : « Copier tout » et « Enregistrer » via la capacité downloads (le lien direct ne marche pas dans le visualiseur)',
     [r"use\(\s*'downloads'\s*\)"], [r'\ba\.download\s*=']),
    (6, 'numérotée', 'numéro de version (TK.version) envoyé dans chaque mesure et signalement (champ tk)',
     [r'TK\s*=\s*\{\s*version\s*:\s*\d+'], []),
    (7, 'appareil lent', 'images toutes > 1 s gardées (pause = > 1 s ET > 8× la médiane, lent:true) : plus de banc vide ni de « masquée » à tort sur l\'appareil le plus lent',
     [r'seuil\s*=\s*Math\.max\(\s*1000\s*,\s*8\s*\*'], []),
]


def lire(p):
    return open(p, encoding='utf-8', errors='ignore').read()


def bloc_accolades(t, i):
    """Fin (exclue) du bloc { … } qui commence à la première accolade après i (comptage simple, chaînes comprises)."""
    j = t.find('{', i)
    if j < 0:
        return len(t)
    n = 0
    for k in range(j, len(t)):
        c = t[k]
        if c == '{':
            n += 1
        elif c == '}':
            n -= 1
            if n == 0:
                return k + 1
    return len(t)


def region_integree(t):
    """Texte de la trousse dans un fichier de jeu : fonction Testkit + svgCapture/domCapture, (début, fin) de Testkit."""
    m = re.search(r'function\s+Testkit\s*\(', t)
    if not m:
        return None, None
    fin = bloc_accolades(t, m.end())
    morceaux = [t[m.start():fin]]
    for nom in ('svgCapture', 'domCapture'):
        q = re.search(r'function\s+' + nom + r'\s*\(', t)
        if q:
            morceaux.append(t[q.start():bloc_accolades(t, q.end())])
    return '\n'.join(morceaux), (m.start(), fin)


def version_explicite(t):
    m = re.search(r'TK\s*=\s*\{\s*version\s*:\s*(\d+)', t)
    return int(m.group(1)) if m else None


def presentes(t):
    """Numéros de version dont toutes les marques sont dans le texte."""
    ok = set()
    for v, _, _, oui, non in VERSIONS:
        if all(re.search(x, t) for x in oui) and not any(re.search(x, t) for x in non):
            ok.add(v)
    return ok


def api(t):
    s = set()
    s |= {'TK.' + x for x in re.findall(r'\bTK\.(\w+)\s*=(?!=)', t)}
    s |= {'o.' + x for x in re.findall(r'\bo\.(\w+)', t)}
    s |= {'function ' + x for x in re.findall(r'\bfunction\s+(\w+)', t)}
    s |= {'window.' + x for x in re.findall(r'\bwindow\.(\w+)\s*=(?!=)', t)}
    return s


_COMMUN = None


def commun():
    global _COMMUN
    if _COMMUN is None:
        t = lire(COMMUN)
        _COMMUN = {'texte': t, 'version': version_explicite(t) or max(v for v, *_ in VERSIONS), 'api': api(t)}
    return _COMMUN


def analyser_texte(t):
    """Version, fonctions manquantes et ajouts locaux d'un texte de trousse."""
    c = commun()
    pres = presentes(t)
    ve = version_explicite(t)
    if ve is not None:
        v = ve
    else:
        v = 0
        for n, *_ in VERSIONS:
            if n in pres:
                v = n
            else:
                break
    manques = [{'version': n, 'nom': nom, 'gain': gain} for n, nom, gain, *_ in VERSIONS if n not in pres and n <= c['version']]
    ajouts = sorted(api(t) - c['api'])
    return {'version': v, 'derniere': c['version'], 'manques': manques, 'ajouts': ajouts,
            'a_jour': v >= c['version'] and not manques}


def norm(t):
    return re.sub(r'^export\s+', '', t, flags=re.M).strip()


def lu_au_build(jeu):
    """Fichier de construction du jeu qui lit outils-communs/testkit.js (la trousse est alors à jour à chaque construction)."""
    p = os.path.join(RAC, jeu)
    for b in sorted(glob.glob(os.path.join(p, '**', 'build*.py'), recursive=True) + glob.glob(os.path.join(p, '**', 'build*.mjs'), recursive=True)
                    + glob.glob(os.path.join(p, '**', 'build*.sh'), recursive=True)):
        if 'node_modules' in b:
            continue
        try:
            t = lire(b)
        except OSError:
            continue
        if re.search(r"outils-communs|COMMUNS", t) and 'testkit' in t:
            return os.path.relpath(b, RAC)
    return None


def copies(jeu):
    """Toutes les copies de la trousse dans un dossier de jeu."""
    p = os.path.join(RAC, jeu)
    out = []
    build = lu_au_build(jeu)
    vus = set()
    for f in sorted(glob.glob(os.path.join(p, '**', 'testkit*.js'), recursive=True)):
        if 'node_modules' in f:
            continue
        try:
            t = lire(f)
        except OSError:
            continue
        if not re.search(r'function\s+Testkit\s*\(', t):
            continue
        vus.add(f)
        d = analyser_texte(t)
        d.update({'fichier': os.path.relpath(f, RAC), 'genre': 'fichier', 'remplacable': True,
                  'identique': norm(t) == norm(commun()['texte']), 'export': bool(re.search(r'^export\s', t, re.M))})
        out.append(d)
    # trousse intégrée dans le code du jeu (sources seulement : pas les pages construites)
    for f in sorted(glob.glob(os.path.join(p, '**', '*.*'), recursive=True)):
        if f in vus or 'node_modules' in f or not f.endswith(('.js', '.html', '.mjs')):
            continue
        rel = os.path.relpath(f, p).split(os.sep)
        if rel[0] in ('build', 'dist', 'outils', 'references', 'mesures') or 'build' in rel[:-1]:
            continue
        try:
            t = lire(f)
        except OSError:
            continue
        if 'function Testkit' not in t and DEBUT not in t:
            continue
        if DEBUT in t and FIN in t.split(DEBUT, 1)[1]:
            if t.count(DEBUT) > 1:
                continue  # plusieurs repères : découpage ambigu, on ne touche à rien
            a = t.index(DEBUT); b = t.index(FIN, a)
            r = t[a + len(DEBUT):b]
            d = analyser_texte(r)
            d.update({'fichier': os.path.relpath(f, RAC), 'genre': 'bloc', 'remplacable': True,
                      'identique': norm(r) == norm(commun()['texte']),
                      'lignes': [t[:a].count('\n') + 1, t[:b].count('\n') + 1]})
        else:
            r, ab = region_integree(t)
            if r is None:
                continue
            a, b = ab
            d = analyser_texte(r)
            d.update({'fichier': os.path.relpath(f, RAC), 'genre': 'construite' if build else 'intégrée', 'remplacable': False,
                      'identique': False, 'lignes': [t[:a].count('\n') + 1, t[:b].count('\n') + 1]})
            if build:
                d['build'] = build
        out.append(d)
    return out


def jeux():
    return [d for d in sorted(os.listdir(RAC)) if not d.startswith('.') and d not in IGNORE and os.path.isdir(os.path.join(RAC, d))]


def resume(c):
    """Une ligne lisible pour une copie."""
    if c['a_jour']:
        s = f"v{c['version']} à jour"
    else:
        s = f"v{c['version']} → v{c['derniere']}"
        if c['manques']:
            s += ' (manque : ' + ', '.join(m['nom'] for m in c['manques']) + ')'
    if c['ajouts']:
        s += ' ; ajouts locaux : ' + ', '.join(c['ajouts'])
    return s


def etat_depot():
    out = {}
    for j in jeux():
        cs = copies(j)
        if cs:
            out[j] = cs
    return out


def commande(jeu):
    return f'python3 outils-communs/maj_testkit.py {jeu} --appliquer'


def non_commite(f):
    """Vrai si git voit des modifications non commitées dans ce fichier (une retouche locale qu'on écraserait)."""
    import subprocess
    try:
        r = subprocess.run(['git', 'status', '--porcelain', '--', f], cwd=RAC, capture_output=True, text=True, timeout=20)
        return r.returncode == 0 and bool(r.stdout.strip())
    except Exception:
        return False


def appliquer(jeu, forcer=False, essai=False):
    """Met à jour les copies remplaçables. Rend (faits, refus)."""
    c = commun()
    faits, refus, infos = [], [], []
    for k in copies(jeu):
        f = os.path.join(RAC, k['fichier'])
        if k['genre'] == 'construite':
            if not k['a_jour']:
                infos.append(f"{k['fichier']} : page construite par {k['build']}, qui lit la trousse commune — reconstruire le jeu suffit")
            continue
        if not k['remplacable']:
            l1, l2 = k['lignes']
            refus.append(f"{k['fichier']} : trousse intégrée au code (lignes {l1}-{l2}) sans repères — entourer le bloc de "
                         f"{DEBUT} … {FIN} (une fois, par l'équipe du jeu), puis relancer")
            continue
        if k['identique']:
            continue
        if not forcer and non_commite(f):
            refus.append(f"{k['fichier']} : modifications non commitées (git status) — les commiter ou les reporter d'abord (ou --forcer)")
            continue
        if k['ajouts'] and not forcer:
            refus.append(f"{k['fichier']} : ajouts locaux {', '.join(k['ajouts'])} — à reporter dans outils-communs/testkit.js d'abord (ou --forcer)")
            continue
        if k['genre'] == 'fichier':
            nouveau = c['texte'] if k['export'] else re.sub(r'^export\s+', '', c['texte'], flags=re.M)
        else:
            t = lire(f)
            tk = re.sub(r'^export\s+', '', c['texte'], flags=re.M)
            if f.endswith('.html') and '</script' in tk:
                refus.append(f"{k['fichier']} : la trousse contient « </script » — impossible à intégrer dans du HTML")
                continue
            a = t.index(DEBUT); b = t.index(FIN, a)
            nouveau = t[:a] + DEBUT + '\n' + tk.strip() + '\n' + t[b:]
        if not essai:
            open(f, 'w', encoding='utf-8').write(nouveau)
        faits.append(f"{k['fichier']} : v{k['version']} → v{c['version']}")
    return faits, refus, infos


def main(a):
    if '--json' in a:
        print(json.dumps(etat_depot(), ensure_ascii=False, indent=1))
        return 0
    noms = [x for x in a if not x.startswith('--')]
    c = commun()
    if not noms:
        print(f"Trousse commune : v{c['version']} ({os.path.relpath(COMMUN, RAC)})\n")
        for j, cs in etat_depot().items():
            for k in cs:
                print(f"  {j:22} {k['genre']:9} {resume(k)}")
                print(f"  {'':22} {'':9} {k['fichier']}")
        print('\nDétail et mise à jour : python3 outils-communs/maj_testkit.py <jeu> [--appliquer]')
        return 0
    jeu = noms[0].strip('/')
    if not os.path.isdir(os.path.join(RAC, jeu)):
        print('Dossier inconnu :', jeu)
        return 2
    cs = copies(jeu)
    if not cs:
        b = lu_au_build(jeu)
        if b:
            print(f'{jeu} : trousse lue au build ({b}) — toujours à jour (v{c["version"]}) après une construction.')
        else:
            print(f'{jeu} : pas de copie de la trousse commune (trousse propre au jeu, ou aucune — voir outils-communs/README.md).')
        return 0
    for k in cs:
        print(f"{k['fichier']} ({k['genre']}) : {resume(k)}")
        for m in k['manques']:
            print(f"   manque v{m['version']} {m['nom']} : {m['gain']}")
    faits, refus, infos = appliquer(jeu, forcer='--forcer' in a, essai='--appliquer' not in a)
    verbe = 'Mis à jour' if '--appliquer' in a else 'À mettre à jour (relancer avec --appliquer)'
    for x in faits:
        print(f'{verbe} : {x}')
    for x in infos:
        print('À reconstruire :', x)
    for x in refus:
        print('Non remplacé :', x)
    if '--appliquer' in a and faits:
        print('Changement :', ' ; '.join(f"git diff --stat -- {k['fichier']}" for k in cs if k['remplacable']))
        print('Ensuite : reconstruire le jeu, vérifier qu\'un 🐞 et un banc 🧪 arrivent (db_list), publier.')
    return 1 if refus and '--appliquer' in a else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
