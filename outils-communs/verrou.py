#!/usr/bin/env python3
"""Verrou machine commun : les BANCS (mesures de vitesse) passent seuls, les ROBOTS (captures, singe, robots des jeux) passent
ensemble mais jamais pendant un banc.

Pourquoi (retours Hameau et Une vie, 18/11) : le verrou du banc ne couvrait que les bancs ; des captures et des robots lancés par
les agents du Studio pendant un banc donnaient un bruit de 69 à 315 % (Une vie), 90 % (Hameau) : mesures inexploitables.

  banc (exclusif)   : attend que les robots en cours finissent ; dès qu'il attend, les NOUVEAUX robots attendent derrière lui
                      (file d'attente : un banc n'attend jamais sans fin des robots qui se relaient).
  robot (partagé)   : attend qu'aucun banc ne tourne ni n'attende ; plusieurs robots en même temps = permis.

usage en ligne de commande (pour un outil propre à un jeu, sans toucher à son code) :
  python3 outils-communs/verrou.py robot -- python3 une-vie/outils/qa.py          robot : passe avec les autres robots
  python3 outils-communs/verrou.py banc  -- python3 sedes-petri/outils/perf.py   banc : seul sur la machine
  python3 outils-communs/verrou.py etat                                           qui tient la machine
options : --attente-max 1800 (s ; code 3 si dépassé) · --nom "texte affiché aux autres" · --attente-navigateurs 600 (banc : s)
Navigateurs HORS VERROU (18/11 soir) : un Chromium lancé par un outil qui ne prend pas le verrou (robot d'un jeu lancé tel quel) est
vu dans les processus ; `etat` le liste avec son lanceur et son % de processeur, et un BANC attend qu'il s'arrête ou se calme (au
plus --attente-navigateurs s, puis mesure quand même en le notant). VERROU_NAVIGATEURS=0 : ne pas attendre (seulement noter).
Variables : BANC_VERROU=fichier (autre verrou : le vérificateur des outils), VERROU_AUCUN=1 (aucun verrou, ex. un robot lancé par
un banc lui-même) ; les commandes lancées par `verrou.py` héritent de VERROU_TENU=banc|robot : un outil commun qui le voit ne
reprend pas le verrou (sinon un robot sous un banc s'attendrait lui-même).
En Python : with verrou.tenir('robot', 'captures hameau'): … · verrou.prendre(...) → (jeton, secondes attendues) · jeton.close()
"""
import os, sys, time, json, tempfile, subprocess, fcntl

FICHIER = os.environ.get('BANC_VERROU') or os.path.join(tempfile.gettempdir(), 'banc-commun.verrou')


def _chemins():
    f = os.environ.get('BANC_VERROU') or FICHIER
    return f, f + '.file', f + '.qui'


def _duree(s):
    s = int(s)
    return f'{s // 60} min {s % 60:02d} s' if s >= 60 else f'{s} s'


def _vivant(pid):
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False
    except PermissionError:
        return True


def qui():
    """Liste des tenants et des bancs en attente : [{pid, mode, nom, depuis, attend}] (processus morts retirés)."""
    d = _chemins()[2]
    l = []
    try:
        noms = os.listdir(d)
    except OSError:
        return l
    for n in noms:
        c = os.path.join(d, n)
        try:
            with open(c) as f:
                e = json.load(f)
        except Exception:
            continue
        if not _vivant(int(e.get('pid', 0))):
            try:
                os.remove(c)
            except OSError:
                pass
            continue
        l.append(e)
    return sorted(l, key=lambda e: e.get('depuis', 0))


# ---------------------------------------------------------------- navigateurs hors verrou (retour Bannières 18/11 soir)
# Le verrou ne voit que les outils qui le prennent. Un robot propre à un jeu lancé tel quel (parcours.py, monkey.py, agent2.js,
# script d'un testeur) fait tourner Chromium sans rien dire : avant, `etat` annonçait « machine libre » et un banc mesurait en même
# temps (bruit ×2). On regarde donc aussi les processus : tout Chromium principal dont le lanceur n'est ni nous, ni un de nos
# ancêtres (verif.py, vérificateur), ni un tenant du verrou, est « hors verrou » ; il est « actif » s'il consomme du processeur.
import re as _re

_NAV = _re.compile(r'(chrom(e|ium)[^/]*|headless[_-]shell[^/]*)$', _re.I)
SEUIL_ACTIF = 10.0  # % d'un cœur (navigateur + ses sous-processus) au-delà duquel un navigateur compte comme actif


def _procs():
    """{pid: (ppid, argv, ticks cpu)} lu dans /proc (vide hors Linux)."""
    r = {}
    try:
        pids = [int(p) for p in os.listdir('/proc') if p.isdigit()]
    except OSError:
        return r
    for p in pids:
        try:
            with open(f'/proc/{p}/stat') as f:
                s = f.read()
            champs = s[s.rindex(')') + 2:].split()
            with open(f'/proc/{p}/cmdline', 'rb') as f:
                argv = [a.decode('utf-8', 'replace') for a in f.read().split(b'\0') if a]
            r[p] = (int(champs[1]), argv, int(champs[11]) + int(champs[12]))
        except (OSError, ValueError, IndexError):
            continue
    return r


def _est_nav(argv):
    return bool(argv) and bool(_NAV.search(os.path.basename(argv[0]))) and not any(a.startswith('--type=') for a in argv)


def _est_pilote(argv):
    """Pilote de Playwright (node … cli.js run-driver) : on remonte au script qui l'a lancé."""
    return 'run-driver' in argv or any(a.endswith(('cli.js', 'playwright')) for a in argv[1:2])


def _ancetres(pid, P):
    l, vus = [], set()
    while pid in P and pid not in vus and pid > 1:
        vus.add(pid); pid = P[pid][0]; l.append(pid)
    return l


def _court(argv, n=90):
    a = [os.path.basename(argv[0])] + [x if len(x) < 60 else '…' + x[-40:] for x in argv[1:6]] if argv else ['?']
    s = ' '.join(a)
    return s if len(s) <= n else s[:n - 1] + '…'


def navigateurs(echantillon=2.0, sauf_pids=()):
    """Navigateurs Chromium principaux HORS VERROU : [{pid, lanceur, lanceur_pid, cpu (% d'un cœur, arbre compris), actif}].
    Exclus : ceux lancés par ce processus ou un de ses ancêtres, et ceux d'un tenant du verrou (qui() ; leurs enfants compris).
    echantillon=0 : pas de mesure du processeur (cpu None, actif None)."""
    P = _procs()
    if not P:
        return []
    moi = ({os.getpid(), *_ancetres(os.getpid(), P), *sauf_pids}) - {0, 1}  # 1 = init : jamais un lanceur (navigateurs orphelins)
    tenants = {e['pid'] for e in qui()}
    navs = []
    for p, (pp, argv, _) in P.items():
        if not _est_nav(argv) or (pp in P and _est_nav(P[pp][1])):
            continue
        anc = _ancetres(p, P)
        lanceur = next((a for a in anc if a in P and not _est_nav(P[a][1]) and not _est_pilote(P[a][1])), pp)
        if lanceur in moi or p in moi or tenants & ({p} | set(anc)):
            continue
        # orphelin : son lanceur a disparu (script tué par timeout, navigateur resté dans sa propre session) ; il ne s'arrêtera pas seul
        orphelin = lanceur <= 1 or lanceur not in P or (anc and anc[0] == 1)
        navs.append({'pid': p, 'lanceur_pid': lanceur, 'orphelin': bool(orphelin),
                     'lanceur': 'orphelin (lanceur disparu)' if orphelin else (_court(P[lanceur][1]) if lanceur in P else '?')})
    if not navs or not echantillon:
        for n in navs:
            n['cpu'] = n['actif'] = None
        return navs

    def arbre(racine, Q):  # ticks de tout l'arbre du navigateur (rendus, GPU…)
        enf = {}
        for p, (pp, _, _) in Q.items():
            enf.setdefault(pp, []).append(p)
        t, pile = 0, [racine]
        while pile:
            x = pile.pop()
            if x in Q:
                t += Q[x][2]; pile += enf.get(x, [])
        return t
    t0 = {n['pid']: arbre(n['pid'], P) for n in navs}
    debut = time.time(); time.sleep(echantillon); Q = _procs(); dt = time.time() - debut
    hz = os.sysconf('SC_CLK_TCK') if hasattr(os, 'sysconf') else 100
    for n in navs:
        if n['pid'] not in Q:
            n['cpu'], n['actif'] = 0.0, False; n['fini'] = True
            continue
        n['cpu'] = round(max(0.0, 100.0 * (arbre(n['pid'], Q) - t0[n['pid']]) / hz / dt), 1)
        n['actif'] = n['cpu'] >= SEUIL_ACTIF
    return [n for n in navs if not n.get('fini')]


def resume_navigateurs(navs):
    par = {}
    for n in navs:
        par.setdefault((n['lanceur_pid'], n['lanceur']), []).append(n)
    return ', '.join(f"{l} (pid {lp}{', ' + str(len(v)) + ' navigateurs' if len(v) > 1 else ''}"
                     f"{', ' + format(sum(x['cpu'] or 0 for x in v), '.0f') + ' % cpu' if v[0]['cpu'] is not None else ''})"
                     for (lp, l), v in par.items())


def attendre_navigateurs(attente_max=None, nom='banc', dire=print):
    """Attend que les navigateurs HORS VERROU actifs s'arrêtent ou se calment (2 relevés calmes de suite), au plus attente_max s.
    Les ORPHELINS (lanceur disparu) ne sont jamais attendus (ils ne s'arrêteront pas seuls) : signalés, à arrêter à la main.
    Renvoie {'attendu_s', 'restants': [...] (actifs encore là à l'abandon, orphelins actifs compris), 'calmes': [...]}.
    attente_max None = VERROU_NAVIGATEURS (secondes ; 0 = ne pas attendre, seulement relever) ou 600."""
    if attente_max is None:
        try:
            attente_max = float(os.environ.get('VERROU_NAVIGATEURS') or 600)
        except ValueError:
            attente_max = 600.0
    t, dit, calmes_de_suite, deja_actif = time.time(), 0.0, 0, False
    navs = navigateurs()
    orph = [n for n in navs if n.get('orphelin') and n['actif']]
    if orph:
        dire(f"⚠ {nom} : {len(orph)} navigateur(s) ORPHELIN(S) actif(s) (lanceur disparu, ne s'arrêteront pas seuls : pid "
             f"{', '.join(str(n['pid']) for n in orph)}, {sum(n['cpu'] or 0 for n in orph):.0f} % cpu) ; les arrêter : kill <pid> ; mesure faussée sinon")
    while True:
        actifs = [n for n in navs if n['actif'] and not n.get('orphelin')]
        if not actifs:
            calmes_de_suite += 1
            if calmes_de_suite >= 2 or not deja_actif or attente_max <= 0:
                return {'attendu_s': round(time.time() - t), 'restants': [n for n in navs if n['actif']], 'calmes': [n for n in navs if not n['actif']]}
        else:
            calmes_de_suite, deja_actif = 0, True
            if time.time() - t >= attente_max:
                dire(f"⚠ {nom} : {len(actifs)} navigateur(s) hors verrou encore actifs après {_duree(attente_max)} ({resume_navigateurs(actifs)}) ;"
                     " mesure lancée quand même : ms plus hautes et plus bruitées")
                return {'attendu_s': round(time.time() - t), 'restants': [n for n in navs if n['actif']], 'calmes': [n for n in navs if not n['actif']]}
            if not dit or time.time() - dit >= 60:
                dire(f"⏳ {nom} : le verrou est libre mais {len(actifs)} navigateur(s) tournent HORS VERROU ({resume_navigateurs(actifs)}) ;"
                     f" attente de leur fin pour ne pas fausser la mesure ({_duree(time.time() - t)} / {_duree(attente_max)} ;"
                     " --attente-navigateurs 0 pour ne pas attendre ; envelopper ces robots : verrou.py robot -- …)")
                dit = time.time()
        time.sleep(3)
        navs = navigateurs()


def _dire(mode, nom, attend):
    d = _chemins()[2]
    os.makedirs(d, exist_ok=True)
    c = os.path.join(d, f'{os.getpid()}-{mode}.json')
    with open(c, 'w') as f:
        json.dump({'pid': os.getpid(), 'mode': mode, 'nom': nom, 'depuis': time.time(), 'attend': attend}, f)
    return c


def _resume(sauf=None):
    l = [e for e in qui() if e['pid'] != (sauf or os.getpid())]
    if not l:
        return '?'
    return ', '.join(f"{'banc' if e['mode'] == 'banc' else 'robot'} {e.get('nom') or ''} (pid {e['pid']}{', en attente' if e.get('attend') else ''},"
                     f" {_duree(time.time() - e.get('depuis', time.time()))})".replace('  ', ' ') for e in l)


class Jeton:
    def __init__(self, fichiers, note, mode):
        self.fichiers, self.note, self.mode = fichiers, note, mode
        # les enfants de ce processus (commande "construire", outil commun appelé) ne reprennent pas le verrou : sinon un enfant
        # attendrait derrière un banc qui attend lui-même ce processus (interblocage jusqu'à --attente-max)
        self.env_avant = os.environ.get('VERROU_TENU')
        os.environ['VERROU_TENU'] = mode

    def close(self):
        if self.fichiers or self.note:
            if self.env_avant is None:
                os.environ.pop('VERROU_TENU', None)
            else:
                os.environ['VERROU_TENU'] = self.env_avant
        for f in self.fichiers:
            try:
                f.close()  # ferme = libère le flock
            except Exception:
                pass
        self.fichiers = []
        try:
            os.remove(self.note)
        except OSError:
            pass
        self.note = None

    def __enter__(self):
        return self

    def __exit__(self, *a):
        self.close()


def _attendre(f, op, mode, nom, t, attente_max, dit, attendre, outre='--sans-verrou'):
    """flock non bloquant en boucle ; redit qui tient la machine chaque minute ; SystemExit(3) après attente_max."""
    while True:
        try:
            fcntl.flock(f, op | fcntl.LOCK_NB)
            return dit
        except OSError:
            if not attendre:
                return None
            if time.time() - dit >= 60:
                autres = [e for e in qui() if e['pid'] != os.getpid()]
                bancs = [e for e in autres if e['mode'] == 'banc']
                if mode == 'banc' and (not autres or bancs):
                    tenu = f'un autre banc tourne sur cette machine ({_resume()})'
                elif mode == 'banc':
                    tenu = f'des robots tournent ({_resume()}) : le banc attend leur fin, les nouveaux robots attendent derrière lui'
                elif bancs and all(e.get('attend') for e in bancs):
                    tenu = f'un banc attend son tour ({_resume()}) : passage après lui'
                else:
                    tenu = f'un banc mesure sur cette machine ({_resume()})'
                print(f"⏳ {'banc' if mode == 'banc' else 'robot ' + (nom or '')} : {tenu} ; attente pour ne pas fausser les mesures"
                      f" ({_duree(time.time() - t)} ; {outre} pour passer outre)", flush=True)
                dit = time.time()
            if time.time() - t > attente_max:
                print(f"{'banc' if mode == 'banc' else 'robot'} : machine tenue depuis plus de {_duree(attente_max)} ({_resume()}) ;"
                      f" abandon (attente maximale, ou {outre})", flush=True)
                sys.exit(3)
            time.sleep(1)


def prendre(mode='robot', nom='', attendre=True, attente_max=1800, outre='--sans-verrou', attente_navigateurs=None):
    """mode 'banc' (seul sur la machine) ou 'robot' (avec les autres robots, jamais pendant un banc).
    Renvoie (Jeton à garder puis .close(), secondes attendues) ; (None, 0) si attendre=False et la machine est tenue,
    ou si VERROU_AUCUN=1, ou si ce processus est lancé sous un verrou (VERROU_TENU).
    Un BANC attend d'abord, AVANT de prendre la file (les robots des autres ne sont pas bloqués pendant ce temps), la fin des
    navigateurs Chromium HORS VERROU actifs (robots des jeux lancés tels quels ; au plus attente_navigateurs s, défaut
    VERROU_NAVIGATEURS ou 600), puis relève sans attendre ceux encore actifs une fois le verrou pris ;
    jeton.navigateurs = {'attendu_s', 'restants', 'calmes'} (à noter dans la sortie du banc)."""
    if mode not in ('banc', 'robot'):
        raise ValueError('mode : banc ou robot')
    if os.environ.get('VERROU_AUCUN') or os.environ.get('VERROU_TENU'):
        return None, 0
    principal, file_, _ = _chemins()
    t = time.time()
    nav0 = attendre_navigateurs(attente_navigateurs, f'banc {nom}'.strip(), lambda m: print(m, flush=True)) if mode == 'banc' and attendre else None
    t_verrou = time.time()
    fq = open(file_, 'a+')
    note = _dire(mode, nom, True)
    try:
        # 1) la file d'attente : un banc la garde pendant toute sa mesure (les nouveaux robots attendent derrière lui) ;
        #    un robot la prend un instant puis la rend (il ne passe pas devant un banc qui attend).
        dit = _attendre(fq, fcntl.LOCK_EX, mode, nom, t, attente_max, 0 if attendre else t, attendre, outre)
        if dit is None:
            fq.close(); os.remove(note)
            return None, 0
        fp = open(principal, 'a+')
        # 2) le verrou principal : exclusif pour un banc (attend la fin des robots déjà lancés), partagé pour un robot.
        dit = _attendre(fp, fcntl.LOCK_EX if mode == 'banc' else fcntl.LOCK_SH, mode, nom, t, attente_max, dit, attendre, outre)
        if dit is None:
            fp.close(); fq.close(); os.remove(note)
            return None, 0
        if mode == 'banc':
            fp.seek(0); fp.truncate(); fp.write(f'pid {os.getpid()}, {nom}'); fp.flush()  # lu par les anciens bancs (17/11)
            fichiers = [fp, fq]
        else:
            fq.close(); fichiers = [fp]
    except BaseException:
        try:
            os.remove(note)
        except OSError:
            pass
        raise
    _dire(mode, nom, False)
    attendu = time.time() - t
    if time.time() - t_verrou > 1:
        print(f'   … verrou libre après {_duree(time.time() - t_verrou)}', flush=True)
    j = Jeton(fichiers, note, mode)
    j.navigateurs = None
    if mode == 'banc':
        try:  # relevé sans attente une fois le verrou pris (un robot hors verrou a pu démarrer pendant l'attente des robots)
            n1 = attendre_navigateurs(0, '', lambda m: None)
        except BaseException:
            j.close(); raise
        j.navigateurs = {'attendu_s': (nav0 or {}).get('attendu_s', 0), 'restants': n1['restants'], 'calmes': n1['calmes']}
        if n1['restants']:
            print(f"⚠ banc {nom} : {len(n1['restants'])} navigateur(s) hors verrou actifs au départ de la mesure ({resume_navigateurs(n1['restants'])}) ;"
                  " ms plus hautes et plus bruitées", flush=True)
        elif j.navigateurs['attendu_s'] > 1:
            print(f"   … navigateurs hors verrou terminés après {_duree(j.navigateurs['attendu_s'])}", flush=True)
    return j, attendu


class tenir:
    """with verrou.tenir('robot', 'captures hameau', attendre=True, attente_max=1800) as attendu: …"""
    def __init__(self, mode='robot', nom='', attendre=True, attente_max=1800, actif=True, outre='--sans-verrou', attente_navigateurs=None):
        self.a = (mode, nom, attendre, attente_max, outre, attente_navigateurs); self.actif = actif; self.j = None

    def __enter__(self):
        if not self.actif:
            return 0
        self.j, attendu = prendre(*self.a)
        return attendu

    def __exit__(self, *a):
        if self.j:
            self.j.close()


def main(argv):
    if not argv or argv[0] in ('-h', '--help'):
        print(__doc__); return 0
    if argv[0] == 'etat':
        l = qui()
        print('verrou libre' if not l else '\n'.join(f"{e['mode']:5} pid {e['pid']} {e.get('nom','')} {'(attend) ' if e.get('attend') else ''}depuis {_duree(time.time()-e['depuis'])}" for e in l))
        navs = navigateurs()
        for n in navs:
            print(f"hors verrou : navigateur pid {n['pid']} {'ORPHELIN (lanceur disparu : kill ' + str(n['pid']) + ')' if n.get('orphelin') else 'lancé par ' + n['lanceur'] + ' (pid ' + str(n['lanceur_pid']) + ')'}, {n['cpu']:.0f} % cpu"
                  f"{(' — ACTIF : à arrêter, il fausse les bancs' if n.get('orphelin') else ' — ACTIF : un banc lancé maintenant l attendrait') if n['actif'] else ' (calme)'}".replace('l attendrait', "l'attendrait"))
        if not l and not any(n['actif'] for n in navs):
            print('machine libre')
        return 0
    mode = argv[0]
    if mode not in ('banc', 'robot') or '--' not in argv:
        print('usage : verrou.py banc|robot [--attente-max S] [--attente-navigateurs S] [--nom texte] -- commande …', file=sys.stderr); return 2
    i = argv.index('--'); opts, cmd = argv[1:i], argv[i + 1:]
    if not cmd:
        print('verrou.py : commande manquante après --', file=sys.stderr); return 2
    attente, nom, att_nav = 1800.0, ' '.join(os.path.basename(c) for c in cmd[:3]), None
    k = 0
    while k < len(opts):
        if opts[k] == '--attente-max':
            attente = float(opts[k + 1]); k += 2
        elif opts[k] == '--attente-navigateurs':
            att_nav = float(opts[k + 1]); k += 2
        elif opts[k] == '--nom':
            nom = opts[k + 1]; k += 2
        else:
            print(f'verrou.py : option inconnue {opts[k]}', file=sys.stderr); return 2
    with tenir(mode, nom, True, attente, outre='VERROU_AUCUN=1', attente_navigateurs=att_nav):
        return subprocess.call(cmd, env=dict(os.environ, VERROU_TENU=mode))


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
