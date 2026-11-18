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
options : --attente-max 1800 (s ; code 3 si dépassé) · --nom "texte affiché aux autres"
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


def prendre(mode='robot', nom='', attendre=True, attente_max=1800, outre='--sans-verrou'):
    """mode 'banc' (seul sur la machine) ou 'robot' (avec les autres robots, jamais pendant un banc).
    Renvoie (Jeton à garder puis .close(), secondes attendues) ; (None, 0) si attendre=False et la machine est tenue,
    ou si VERROU_AUCUN=1, ou si ce processus est lancé sous un verrou (VERROU_TENU)."""
    if mode not in ('banc', 'robot'):
        raise ValueError('mode : banc ou robot')
    if os.environ.get('VERROU_AUCUN') or os.environ.get('VERROU_TENU'):
        return None, 0
    principal, file_, _ = _chemins()
    t = time.time()
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
    if attendu > 1:
        print(f'   … machine libre après {_duree(attendu)}', flush=True)
    return Jeton(fichiers, note, mode), attendu


class tenir:
    """with verrou.tenir('robot', 'captures hameau', attendre=True, attente_max=1800) as attendu: …"""
    def __init__(self, mode='robot', nom='', attendre=True, attente_max=1800, actif=True, outre='--sans-verrou'):
        self.a = (mode, nom, attendre, attente_max, outre); self.actif = actif; self.j = None

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
        print('machine libre' if not l else '\n'.join(f"{e['mode']:5} pid {e['pid']} {e.get('nom','')} {'(attend) ' if e.get('attend') else ''}depuis {_duree(time.time()-e['depuis'])}" for e in l))
        return 0
    mode = argv[0]
    if mode not in ('banc', 'robot') or '--' not in argv:
        print('usage : verrou.py banc|robot [--attente-max S] [--nom texte] -- commande …', file=sys.stderr); return 2
    i = argv.index('--'); opts, cmd = argv[1:i], argv[i + 1:]
    if not cmd:
        print('verrou.py : commande manquante après --', file=sys.stderr); return 2
    attente, nom = 1800.0, ' '.join(os.path.basename(c) for c in cmd[:3])
    k = 0
    while k < len(opts):
        if opts[k] == '--attente-max':
            attente = float(opts[k + 1]); k += 2
        elif opts[k] == '--nom':
            nom = opts[k + 1]; k += 2
        else:
            print(f'verrou.py : option inconnue {opts[k]}', file=sys.stderr); return 2
    with tenir(mode, nom, True, attente, outre='VERROU_AUCUN=1'):
        return subprocess.call(cmd, env=dict(os.environ, VERROU_TENU=mode))


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
