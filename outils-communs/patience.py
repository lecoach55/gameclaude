#!/usr/bin/env python3
"""Patience commune : des délais d'attente qui suivent la charge de la machine, au lieu des 60 s fixes.

Retours du terrain (18/11) : parcours.py et monkey.py de Bannières (attente fixe de 60 s), banc_test.py d'Une vie (65 s < 75-85 s
du banc) échouent ou rendent un résultat vide quand d'autres conversations chargent la machine (revues du Studio en parallèle).
Le testeur avait dû passer sa copie à 600 s… ce qui fait attendre 10 minutes un vrai blocage sur une machine calme.

Ici : délai = base × facteur, facteur = charge du processeur (la plus forte de la moyenne sur 1 min et des processus prêts à l'instant, ÷ nombre de cœurs, au moins 1, au plus 6),
multiplié par la variable PATIENCE si elle est donnée (PATIENCE=2 double tout ; PATIENCE=1 = machine supposée calme).
attendre() relit la charge à l'échéance : si la machine s'est chargée pendant l'attente, l'échéance recule (au plus base × 6 × PATIENCE).
Le message d'échec dit la base, la charge et le temps réellement attendu (on sait si c'est un blocage ou une machine saturée).

En Python :
    from patience import delai, attendre, attendre_sync, facteur
    await attendre(pg, "window.pret", 60, quoi="jeu prêt")        # Playwright asynchrone (lève TimeoutError expliqué)
    attendre_sync(pg, "G.fini", 60)                                # Playwright synchrone
    await pg.click('#go', timeout=delai(20) * 1000)                # simple délai adapté (secondes)
En ligne de commande :
    python3 outils-communs/patience.py            → facteur et charge, ex. « facteur 2.3 (charge 4.6 sur 2 cœurs) »
    python3 outils-communs/patience.py 60         → 60 s adaptées, ex. « 138 » (pour un script shell : timeout $(… 60))
"""
import os, sys, time

PLAFOND = 6.0


def charge():
    """(moyenne de charge sur 1 min, nombre de cœurs utilisables)."""
    try:
        n = len(os.sched_getaffinity(0))
    except (AttributeError, OSError):
        n = os.cpu_count() or 1
    try:
        l1 = os.getloadavg()[0]
    except (AttributeError, OSError):
        l1 = 0.0
    # la moyenne sur 1 min réagit lentement (une charge qui commence n'y vaut que 40 % au bout de 30 s) : on prend aussi les
    # processus prêts à tourner à l'instant (/proc/loadavg, moyenne de 5 relevés en 0,1 s, sans compter celui-ci)
    try:
        r = []
        for _ in range(5):
            with open('/proc/loadavg') as f:
                r.append(max(0, int(f.read().split()[3].split('/')[0]) - 1))
            time.sleep(0.02)
        l1 = max(l1, sum(r) / len(r))
    except (OSError, ValueError, IndexError):
        pass
    return l1, max(1, n)


def _patience_env():
    try:
        return max(0.1, float(os.environ.get('PATIENCE', '') or 1))
    except ValueError:
        return 1.0


def facteur(mesure=None):
    """Multiplicateur des délais : 1 sur une machine calme, jusqu'à 6 si la charge vaut 6 fois le nombre de cœurs (× PATIENCE).
    mesure = (charge, cœurs) déjà lue, pour afficher un facteur cohérent avec elle."""
    l1, n = mesure or charge()
    return round(min(PLAFOND, max(1.0, l1 / n)) * _patience_env(), 2)


def delai(base):
    """Délai adapté à la charge, en secondes (même unité que base)."""
    return round(float(base) * facteur(), 1)


def explication(base, attendu, f):
    l1, n = charge()
    return f"{attendu:.0f} s attendues (base {base:g} s × facteur {f:g} ; charge {l1:.1f} sur {n} cœurs)"


def _cond(expr):
    import re
    return expr if re.match(r'\s*(\(\s*\)\s*=>|function\s*\(|async\s)', expr) else f"()=>{{try{{return !!({expr})}}catch(e){{return false}}}}"


async def attendre(pg, expr, base=60, quoi=None, polling=200):
    """Attend que l'expression JS soit vraie, avec un délai qui suit la charge (relue à l'échéance).
    Lève TimeoutError avec un message qui dit la base, la charge et le temps attendu."""
    t0 = time.time(); f = facteur(); cond = _cond(expr)
    while True:
        reste = base * f - (time.time() - t0)
        if reste > 0:
            try:
                await pg.wait_for_function(cond, timeout=max(1, reste * 1000), polling=polling)
                return round(time.time() - t0, 1)
            except Exception as e:
                if 'Timeout' not in type(e).__name__ and 'Timeout' not in str(e)[:80]:
                    raise
        f2 = facteur()
        if f2 > f and base * f2 > time.time() - t0 + 0.5:
            f = f2; continue                              # la machine s'est chargée pendant l'attente : l'échéance recule
        raise TimeoutError(f"« {quoi or expr[:60]} » jamais vrai : " + explication(base, time.time() - t0, f))


def attendre_sync(pg, expr, base=60, quoi=None, polling=200):
    """Même chose avec Playwright synchrone."""
    t0 = time.time(); f = facteur(); cond = _cond(expr)
    while True:
        reste = base * f - (time.time() - t0)
        if reste > 0:
            try:
                pg.wait_for_function(cond, timeout=max(1, reste * 1000), polling=polling)
                return round(time.time() - t0, 1)
            except Exception as e:
                if 'Timeout' not in type(e).__name__ and 'Timeout' not in str(e)[:80]:
                    raise
        f2 = facteur()
        if f2 > f and base * f2 > time.time() - t0 + 0.5:
            f = f2; continue
        raise TimeoutError(f"« {quoi or expr[:60]} » jamais vrai : " + explication(base, time.time() - t0, f))


if __name__ == '__main__':
    a = [x for x in sys.argv[1:] if not x.startswith('-')]
    if a:
        try:
            print(f"{delai(float(a[0])):g}")
        except ValueError:
            print(__doc__); sys.exit(2)
    else:
        l1, n = m = charge()
        print(f"facteur {facteur(m):g} (charge {l1:.1f} sur {n} cœurs{', PATIENCE=' + os.environ['PATIENCE'] if os.environ.get('PATIENCE') else ''})")
