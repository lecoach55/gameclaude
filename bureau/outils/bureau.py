#!/usr/bin/env python3
"""Le Bureau — état commun de tous les jeux de Victor, partagé entre conversations.

Usage (depuis la racine du dépôt) :
  python3 bureau/outils/bureau.py                 état du bureau (affiche le tableau)
  python3 bureau/outils/bureau.py arrivee JEU "ce que je viens faire"
  python3 bureau/outils/bureau.py depart  JEU "ce qui a été fait (chiffres)" [--outil "outil amélioré"]
  python3 bureau/outils/bureau.py page            fabrique bureau/build/index.html (page « Bureau » à publier)
  python3 bureau/outils/bureau.py outil JEU "outil : ce qui a gêné ou manqué"   retour pour l'équipe Outils
  python3 bureau/outils/bureau.py chrono JEU "nom de l'étape" -- commande …     lance une commande et note sa durée
  python3 bureau/outils/bureau.py chronos [jours=7]   étapes les plus coûteuses (temps total, fréquence, échecs)

JEU = nom du dossier (bannieres, valdragon, …) ou « commun » pour outils-communs / bureau.
Rien n'est poussé automatiquement : faire le commit et le push ensuite (voir bureau/README.md).
"""
import hashlib, json, os, re, subprocess, sys, datetime, glob, signal

# sortie coupée par head/less : se taire au lieu de planter (retour outil du 16/11)
if hasattr(signal, 'SIGPIPE'):
    signal.signal(signal.SIGPIPE, signal.SIG_DFL)

RAC = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
B = os.path.join(RAC, 'bureau')
PARIS = datetime.timezone(datetime.timedelta(hours=1))
IGNORE = {'bureau', 'outils-communs', '.git', 'node_modules'}

# Familles d'outils : un fichier appartient à la première famille dont un motif correspond.
FAMILLES = [
    ('fluidite',   'Fluidité (banc img/s)', r'^(perf|bprof|memtest)'),
    ('visuel',     'Captures et comparaison', r'^(captures?|capt|studio|refs|shots|nshots|kitshots|liveshots|sheetshots|radshot|vues?|vue_haute|compare|gros_plan|planche|title)'),
    ('robots',     'Robots testeurs', r'^(parcours|explore|agent|monkey|fumee|scen|gsim|qa|bot|fullgame|etroit|expe3d|mock|combat3d|evtest|asstest|formtest|lgtest|n1test|reptest|sptest|ytest|migtest|mistest|bilantest|kittest|modetest|pass1test|tuto)'),
    ('equilibre',  'Simulateurs d\'équilibre', r'^(sim|analyze|ab|hv|fs|bots|run3|calib|duel|audit|realsim|sweep|rivalsim|proprobe|peprobe|stats|fuzz|anH|spdrift|traits)'),
    ('sauvegarde', 'Sauvegarde et hors ligne', r'^(sauvegarde|reprise|nuage|hors_ligne|cloud)'),
    ('ressources', 'Fabrication de ressources', r'^(ph|tex|wood|rockfix|simp|pack|fbx|imposteur|portraits|prep_|three_entree|charger)'),
]
EXT = ('.py', '.js', '.mjs', '.cjs', '.sh')


def git(*a):
    try:
        return subprocess.run(['git', '-C', RAC, *a], capture_output=True, text=True, timeout=60).stdout.strip()
    except Exception:
        return ''


def md5(p):
    h = hashlib.md5()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def sans_export(p):
    """Contenu comparable d'une copie de testkit.js (les copies classiques retirent « export »)."""
    t = open(p, encoding='utf-8', errors='ignore').read()
    return re.sub(r'^export\s+', '', t, flags=re.M).strip()


def taille(d):
    t = 0
    for r, ds, fs in os.walk(d):
        ds[:] = [x for x in ds if x not in ('node_modules', '.git')]
        for f in fs:
            try: t += os.path.getsize(os.path.join(r, f))
            except OSError: pass
    return t


def sections_claude():
    """Nom affiché et slug de chaque jeu, lus dans CLAUDE.md (source de vérité)."""
    out = {}
    try:
        txt = open(os.path.join(RAC, 'CLAUDE.md'), encoding='utf-8').read()
    except OSError:
        return out
    for bloc in re.split(r'\n(?=## )', txt):
        m = re.match(r'## (.+?) \(`([\w-]+)/`\)', bloc)
        if not m:
            continue
        s = re.search(r'slug `([0-9a-f-]{36})`', bloc)
        out[m.group(2)] = {'nom': m.group(1).strip(), 'slug': s.group(1) if s else None}
    return out


def famille(nom):
    for k, _, motif in FAMILLES:
        if re.match(motif, nom, re.I):
            return k
    return 'autres'


def outils_du_jeu(d):
    res = {k: [] for k, _, _ in FAMILLES}; res['autres'] = []
    racine = os.path.join(RAC, d, 'outils')
    for r, ds, fs in os.walk(racine):
        ds[:] = [x for x in ds if x not in ('node_modules', 'app-bureau', 'patchs')]
        for f in fs:
            if f.endswith(EXT):
                rel = os.path.relpath(os.path.join(r, f), os.path.join(RAC, d))
                res[famille(f)].append(rel)
    return {k: sorted(v) for k, v in res.items()}


def lire_chantiers():
    out = []
    for p in sorted(glob.glob(os.path.join(B, 'chantiers', '*.md'))):
        if os.path.basename(p).upper().startswith('LISEZ'):
            continue
        txt = open(p, encoding='utf-8').read()
        get = lambda k: (re.search(rf'^{k}\s*:\s*(.+)$', txt, re.M) or [None, ''])[1].strip()
        out.append({'jeu': os.path.basename(p)[:-3], 'objet': get('objet'), 'depuis': get('depuis')})
    return out


def lire_journal(n=40):
    lignes = []
    for p in sorted(glob.glob(os.path.join(B, 'journal', '*.md'))):
        for l in open(p, encoding='utf-8'):
            m = re.match(r'- (\d{4}-\d\d-\d\d \d\d:\d\d) · ([\w-]+) · (.+)', l.strip())
            if m:
                lignes.append({'quand': m.group(1), 'jeu': m.group(2), 'quoi': m.group(3)})
    lignes.sort(key=lambda x: x['quand'], reverse=True)
    return lignes[:n]


def etat():
    noms = sections_claude()
    commun_tk = os.path.join(RAC, 'outils-communs', 'testkit.js')
    tk_ref = md5(commun_tk) if os.path.exists(commun_tk) else None
    jeux, gros = [], {}
    for d in sorted(os.listdir(RAC)):
        p = os.path.join(RAC, d)
        if d.startswith('.') or d in IGNORE or not os.path.isdir(p):
            continue
        info = noms.get(d, {})
        tk = sorted(glob.glob(os.path.join(p, '**', 'testkit*.js'), recursive=True))
        tk = [x for x in tk if 'node_modules' not in x]
        if not tk:
            tkst = 'absent'
        else:
            tkst = 'à jour' if all(sans_export(x) == sans_export(commun_tk) for x in tk) else 'version locale'
        # intégré au build (Hameau, Valdragon…) : le build lit outils-communs directement
        if tkst == 'absent':
            for b in glob.glob(os.path.join(p, '**', 'build*.py'), recursive=True) + glob.glob(os.path.join(p, '**', 'build*.mjs'), recursive=True):
                if 'node_modules' in b: continue
                try:
                    if 'testkit' in open(b, encoding='utf-8', errors='ignore').read():
                        tkst = 'lu au build'; break
                except OSError: pass
        if tkst == 'absent':  # trousse recopiée dans le code du jeu
            for q in glob.glob(os.path.join(p, 'jeu', '**', '*.*'), recursive=True):
                if 'node_modules' in q or not q.endswith(('.js', '.html')): continue
                try:
                    if re.search(r'Testkit|signalement_', open(q, encoding='utf-8', errors='ignore').read()):
                        tkst = 'intégré au code'; break
                except OSError: pass
        for r, ds, fs in os.walk(p):
            ds[:] = [x for x in ds if x != 'node_modules']
            for f in fs:
                q = os.path.join(r, f)
                try:
                    if os.path.getsize(q) > 200_000:
                        gros.setdefault(md5(q), []).append(os.path.relpath(q, RAC))
                except OSError: pass
        dern = git('log', '-1', '--format=%cs', '--', d)
        mess = git('log', '-1', '--format=%s', '--', d)
        jeux.append({
            'dossier': d, 'nom': info.get('nom') or d, 'slug': info.get('slug'),
            'dernier': dern, 'message': mess[:140],
            'commits': len([x for x in git('log', '--format=%h', '--', d).splitlines() if x]),
            'taille_mo': round(taille(p) / 1048576, 1),
            'testkit': tkst, 'readme': os.path.exists(os.path.join(p, 'README.md')),
            'outils': outils_du_jeu(d),
        })
    doublons = [v for v in gros.values() if len(v) > 1]
    # même nom d'outil présent dans plusieurs jeux = candidat à la mise en commun
    noms_outils = {}
    for j in jeux:
        for fam, fs in j['outils'].items():
            for f in fs:
                noms_outils.setdefault(os.path.basename(f), set()).add(j['dossier'])
    repetes = sorted(((n, sorted(s)) for n, s in noms_outils.items() if len(s) >= 3), key=lambda x: -len(x[1]))
    return {
        'genere': datetime.datetime.now(PARIS).strftime('%Y-%m-%d %H:%M'),
        'commit': git('log', '-1', '--format=%h %cs'),
        'jeux': jeux, 'chantiers': lire_chantiers(), 'journal': lire_journal(), 'retours_outils': lire_retours(),
        'familles': [{'id': k, 'nom': n} for k, n, _ in FAMILLES],
        'communs': sorted(os.path.basename(x) for x in glob.glob(os.path.join(RAC, 'outils-communs', '*')) if not x.endswith('.md')),
        'alertes': {
            'doublons': doublons,
            'outils_repetes': [{'outil': n, 'jeux': s} for n, s in repetes],
            'testkit_locaux': [j['dossier'] for j in jeux if j['testkit'] == 'version locale'],
            'sans_readme': [j['dossier'] for j in jeux if not j['readme']],
            'sans_slug': [j['dossier'] for j in jeux if not j['slug']],
        },
    }


def afficher(e):
    print(f"LE BUREAU — état au {e['genere']} (dépôt {e['commit']})\n")
    print('Chantiers en cours :')
    for c in e['chantiers'] or [{'jeu': '—', 'objet': 'aucun', 'depuis': ''}]:
        print(f"  • {c['jeu']} : {c['objet']} {('(depuis ' + c['depuis'] + ')') if c['depuis'] else ''}")
    print('\nJeux :')
    for j in e['jeux']:
        n = sum(len(v) for v in j['outils'].values())
        print(f"  {j['nom'][:34]:34} {j['dernier'] or '?':10} {j['commits']:3} commits {j['taille_mo']:5} Mo  outils {n:2}  testkit {j['testkit']}")
    a = e['alertes']
    print('\nÀ mutualiser (détecté automatiquement) :')
    for o in a['outils_repetes']:
        print(f"  • {o['outil']} existe en {len(o['jeux'])} copies : {', '.join(o['jeux'])}")
    for d in a['doublons']:
        print(f"  • fichier identique en double : {', '.join(d)}")
    if a['testkit_locaux']:
        print(f"  • testkit modifié localement (à reporter dans outils-communs ?) : {', '.join(a['testkit_locaux'])}")
    if a['sans_readme']:
        print(f"  • sans README : {', '.join(a['sans_readme'])}")
    if e.get('retours_outils'):
        print('\nRetours outils récents :')
        for r in e['retours_outils'][:5]:
            print(f"  {r['quand']} · {r['jeu']} · {r['quoi']}")
    print('\nDerniers passages :')
    for l in e['journal'][:8]:
        print(f"  {l['quand']} · {l['jeu']} · {l['quoi']}")


def maintenant():
    return datetime.datetime.now(PARIS).strftime('%Y-%m-%d %H:%M')


def journal(jeu, texte):
    jour = maintenant()[:10]
    # un fichier par jour ET par jeu : plusieurs conversations écrivent en même temps sans conflit git
    p = os.path.join(B, 'journal', f'{jour}_{jeu}.md')
    neuf = not os.path.exists(p)
    with open(p, 'a', encoding='utf-8') as f:
        if neuf:
            f.write(f'# Journal du {jour} — {jeu}\n\n')
        f.write(f'- {maintenant()} · {jeu} · {texte}\n')


def arrivee(jeu, objet):
    p = os.path.join(B, 'chantiers', f'{jeu}.md')
    if os.path.exists(p):
        print(f'⚠ Un chantier est déjà ouvert sur « {jeu} » :\n' + open(p, encoding='utf-8').read())
        print('Une autre conversation y travaille peut-être : se coordonner (petits commits, git pull --rebase avant chaque push).')
    with open(p, 'w', encoding='utf-8') as f:
        f.write(f'objet: {objet}\ndepuis: {maintenant()}\n')
    journal(jeu, f'arrivée — {objet}')
    print(f'Chantier ouvert : bureau/chantiers/{jeu}.md')


def depart(jeu, bilan, outil=None):
    p = os.path.join(B, 'chantiers', f'{jeu}.md')
    if os.path.exists(p):
        os.remove(p)
    journal(jeu, bilan)
    if outil:
        journal(jeu, f'outil partagé — {outil}')
    print('Chantier fermé, journal mis à jour.')


def retour_outil(jeu, texte):
    """Une friction d'outil (lent, cassé, manquant, sortie illisible) : l'équipe Outils les traite."""
    jour = maintenant()[:10]
    p = os.path.join(B, 'retours-outils', f'{jour}_{jeu}.md')
    os.makedirs(os.path.dirname(p), exist_ok=True)
    neuf = not os.path.exists(p)
    with open(p, 'a', encoding='utf-8') as f:
        if neuf:
            f.write(f'# Retours outils du {jour} — {jeu}\n\n')
        f.write(f'- {maintenant()} · {texte}\n')
    print('Retour noté :', os.path.relpath(p, RAC))


def chrono(jeu, etape, cmd):
    """Mesure la durée et le résultat d'une étape d'outillage (pour savoir quels outils ralentissent le travail)."""
    import time
    t0 = time.time()
    r = subprocess.run(cmd, shell=False)
    d = round(time.time() - t0, 1)
    p = os.path.join(B, 'retours-outils', 'chronos.jsonl')
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'a', encoding='utf-8') as f:
        f.write(json.dumps({'quand': maintenant(), 'jeu': jeu, 'etape': etape, 'commande': ' '.join(cmd)[:200],
                            'secondes': d, 'code': r.returncode}, ensure_ascii=False) + '\n')
    print(f'⏱ {etape} : {d} s (code {r.returncode})')
    sys.exit(r.returncode)


def lire_chronos(jours=7):
    """Regroupe chronos.jsonl par (jeu, étape) sur les `jours` derniers jours ; « studio (1) », « studio (2) » et « verifier (10 contrôles) » se regroupent par nom."""
    p = os.path.join(B, 'retours-outils', 'chronos.jsonl')
    if not os.path.exists(p):
        return []
    lim = (datetime.datetime.now(PARIS) - datetime.timedelta(days=jours)).strftime('%Y-%m-%d %H:%M')
    g = {}
    for l in open(p, encoding='utf-8'):
        try:
            c = json.loads(l)
        except ValueError:
            continue
        if c.get('quand', '') < lim:
            continue
        et = re.sub(r'\s*\(\d+[^)]*\)$', '', c.get('etape', '?')).strip()
        k = (c.get('jeu', '?'), et)
        x = g.setdefault(k, {'jeu': k[0], 'etape': et, 'fois': 0, 'total': 0.0, 'max': 0.0, 'echecs': 0, 'dernier': ''})
        s_ = float(c.get('secondes') or 0)
        x['fois'] += 1; x['total'] += s_; x['max'] = max(x['max'], s_); x['echecs'] += 1 if c.get('code') else 0
        x['dernier'] = max(x['dernier'], c.get('quand', ''))
    out = sorted(g.values(), key=lambda x: -x['total'])
    for x in out:
        x['moyenne'] = round(x['total'] / x['fois'], 1); x['total'] = round(x['total'], 1)
    return out


def afficher_chronos(jours=7):
    l = lire_chronos(jours)
    if not l:
        print('Aucun chrono noté (bureau.py chrono JEU "étape" -- commande).'); return
    tot = sum(x['total'] for x in l)
    print(f"Étapes chronométrées sur {jours} j : {sum(x['fois'] for x in l)} lancements, {tot / 60:.1f} min en tout\n")
    print(f"{'jeu':<22}{'étape':<38}{'fois':>5}{'total':>9}{'moy.':>8}{'max':>8}  échecs")
    for x in l[:25]:
        print(f"{x['jeu'][:21]:<22}{x['etape'][:37]:<38}{x['fois']:>5}{x['total']:>8.0f}s{x['moyenne']:>7.0f}s{x['max']:>7.0f}s  {x['echecs'] or ''}")
    lent = [x for x in l if x['moyenne'] >= 60]
    if lent:
        print('\nÀ accélérer en priorité (≥ 1 min par lancement) : ' + ', '.join(f"{x['jeu']}/{x['etape']}" for x in lent[:6]))
    ech = [x for x in l if x['echecs']]
    if ech:
        print('Échecs : ' + ', '.join(f"{x['jeu']}/{x['etape']} ({x['echecs']}/{x['fois']})" for x in ech[:6]))


def lire_retours(n=30):
    out = []
    for p in sorted(glob.glob(os.path.join(B, 'retours-outils', '*.md'))):
        jeu = os.path.basename(p)[11:-3]
        for l in open(p, encoding='utf-8'):
            m = re.match(r'- (\d{4}-\d\d-\d\d \d\d:\d\d) · (.+)', l.strip())
            if m:
                out.append({'quand': m.group(1), 'jeu': jeu, 'quoi': m.group(2)})
    out.sort(key=lambda x: x['quand'], reverse=True)
    return out[:n]


def page(e):
    modele = open(os.path.join(B, 'page', 'modele.html'), encoding='utf-8').read()
    data = json.dumps(e, ensure_ascii=False).replace('</', '<\\/')
    os.makedirs(os.path.join(B, 'build'), exist_ok=True)
    out = os.path.join(B, 'build', 'index.html')
    open(out, 'w', encoding='utf-8').write(modele.replace('/*ETAT*/null', data))
    print('Page fabriquée :', os.path.relpath(out, RAC), '— à publier (voir bureau/README.md, slug dans bureau/ARTEFACT.txt)')


if __name__ == '__main__':
    a = sys.argv[1:]
    cmd = a[0] if a else 'etat'
    if cmd == 'arrivee' and len(a) >= 3:
        arrivee(a[1], ' '.join(a[2:]))
    elif cmd == 'depart' and len(a) >= 3:
        o = None
        if '--outil' in a:
            i = a.index('--outil'); o = ' '.join(a[i + 1:]); a = a[:i]
        depart(a[1], ' '.join(a[2:]), o)
    elif cmd == 'outil' and len(a) >= 3:
        retour_outil(a[1], ' '.join(a[2:]))
    elif cmd == 'chrono' and '--' in a and len(a) >= 5:
        i = a.index('--'); chrono(a[1], ' '.join(a[2:i]), a[i + 1:])
    elif cmd == 'chronos':
        afficher_chronos(int(a[1]) if len(a) > 1 and a[1].isdigit() else 7)
    elif cmd == 'page':
        page(etat())
    elif cmd == 'json':
        print(json.dumps(etat(), ensure_ascii=False, indent=1))
    elif cmd in ('etat', 'état'):
        afficher(etat())
    else:
        print(__doc__)
