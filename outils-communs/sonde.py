# ===== Sonde : clics robustes et recherche de contenus coupés, pour tous les robots Playwright (synchrones ou async) =====
# import sys; sys.path.insert(0, '…/outils-communs'); from sonde import cliquer, debordements, boutons, resume
#   synchrone : cliquer(pg, 'Naître')            async : await cliquer(pg, 'Naître')
# cliquer attend (10 s par défaut) qu'un bouton visible, actif et non recouvert contienne le texte, puis le clique.
# Si rien n'apparaît : TimeoutError qui liste les boutons visibles (au lieu de « Cannot read properties of undefined (reading 'click') »).
# Marche aussi avec une page figée par horloge.js (joue des images au lieu d'attendre).
# debordements(pg, ignorer=['.tbl-wrap']) : liste des contenus coupés (page, blocs qui défilent, overflow:hidden, bords d'écran).
import os, re, time
SONDE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sonde.js')
_JS = None


def _js():
    global _JS
    if _JS is None:
        _JS = open(SONDE, encoding='utf-8').read()
    return _JS


def _async(pg):
    return 'async_api' in type(pg).__module__


def _motif(m):
    """'texte' → chaîne ; re.compile(...) → RegExp JS."""
    if isinstance(m, re.Pattern):
        return {'re': m.pattern, 'i': bool(m.flags & re.I)}
    return {'t': str(m)}


_CLIC = """([m,o])=>{const s=window.__sonde;if(!s)return 'absente';const motif=m.re!=null?new RegExp(m.re,m.i?'i':''):m.t;
 return s.cliquer(motif,o)?'ok':'non';}"""
_CLIC_SOURIS = """([m,o])=>{const s=window.__sonde;if(!s)return 'absente';const motif=m.re!=null?new RegExp(m.re,m.i?'i':''):m.t;
 const r=s.cliquer(motif,Object.assign({},o,{viser:true}));return r||'non';}"""
_FIGEE = "()=>!!(window.__horloge&&window.__horloge.avancer)"


def _opts(dans, sel, force):
    o = {}
    if dans: o['dans'] = dans
    if sel: o['sel'] = sel
    if force: o['force'] = True
    return o


def cliquer(pg, motif, dans=None, sel=None, delai=10, force=False, apres=0, souris=False):
    """Clique le premier élément cliquable visible dont le texte contient `motif` (chaîne, insensible à la casse, ou re.compile).
    dans='#go' limite la recherche à un conteneur ; sel='tr[data-t]' change les éléments visés.
    Attend jusqu'à `delai` s qu'il apparaisse ; apres=ms attend après le clic. Renvoie True, ou lève TimeoutError.
    souris=True : vrai clic de souris/doigt au centre (pointerdown, mousedown…) au lieu de element.click().
    Page figée (horloge.js) : l'attente joue 1 image par 100 ms réelles (captures suivantes reproductibles)."""
    if _async(pg):
        return _cliquer_async(pg, motif, dans, sel, delai, force, apres, souris)
    m, o, t0 = _motif(motif), _opts(dans, sel, force), time.time()
    figee = None
    while True:
        r = pg.evaluate(_CLIC_SOURIS if souris else _CLIC, [m, o])
        if r == 'absente':
            pg.evaluate(_js()); r = 'non'
        if r != 'non':
            if souris: pg.mouse.click(r[0], r[1])
            if apres: pg.wait_for_timeout(apres)
            return True
        if time.time() - t0 > delai:
            raise TimeoutError(_message(motif, boutons(pg, dans)))
        if figee is None: figee = pg.evaluate(_FIGEE)
        pg.wait_for_timeout(100)                       # temps réel (minuteries du jeu)
        if figee: pg.evaluate("()=>__horloge.avancer(1,1000/60)")   # page figée : 1 image par tour, pas plus


async def _cliquer_async(pg, motif, dans, sel, delai, force, apres, souris):
    m, o, t0 = _motif(motif), _opts(dans, sel, force), time.time()
    figee = None
    while True:
        r = await pg.evaluate(_CLIC_SOURIS if souris else _CLIC, [m, o])
        if r == 'absente':
            await pg.evaluate(_js()); r = 'non'
        if r != 'non':
            if souris: await pg.mouse.click(r[0], r[1])
            if apres: await pg.wait_for_timeout(apres)
            return True
        if time.time() - t0 > delai:
            raise TimeoutError(_message(motif, await _boutons_async(pg, dans)))
        if figee is None: figee = await pg.evaluate(_FIGEE)
        await pg.wait_for_timeout(100)
        if figee: await pg.evaluate("()=>__horloge.avancer(1,1000/60)")


def _message(motif, liste):
    m = motif.pattern if isinstance(motif, re.Pattern) else motif
    return f"cliquer : aucun bouton visible et actif « {m} » ; boutons visibles : " + (' | '.join(liste) or '(aucun)')


_BOUTONS = "(d)=>window.__sonde?__sonde.boutons(d):null"


def boutons(pg, dans=None):
    """Textes des éléments cliquables visibles (diagnostic)."""
    if _async(pg):
        return _boutons_async(pg, dans)
    r = pg.evaluate(_BOUTONS, dans)
    if r is None:
        pg.evaluate(_js()); r = pg.evaluate(_BOUTONS, dans)
    return r


async def _boutons_async(pg, dans=None):
    r = await pg.evaluate(_BOUTONS, dans)
    if r is None:
        await pg.evaluate(_js()); r = await pg.evaluate(_BOUTONS, dans)
    return r


_DEB = "(o)=>window.__sonde?__sonde.debordements(o):null"


def debordements(pg, ignorer=(), tol=2, ellipses=False, verticaux=False, genres=('page', 'bloc', 'coupe', 'bord')):
    """Contenus coupés dans l'écran affiché. Renvoie une liste de {genre, sel, px, texte}.
    Par défaut garde les genres sûrs (page, bloc, coupe, bord) ; ajouter 'large' (tableau large dans un bloc qui défile, souvent voulu)
    ou ellipses=True / verticaux=True pour une revue plus fine. ignorer=['.tbl-wrap', '#carte'] : sélecteurs à ne pas signaler."""
    o = {'ignorer': list(ignorer), 'tol': tol, 'ellipses': ellipses, 'verticaux': verticaux}
    if _async(pg):
        return _deb_async(pg, o, genres)
    r = pg.evaluate(_DEB, o)
    if r is None:
        pg.evaluate(_js()); r = pg.evaluate(_DEB, o)
    return _filtre(r, genres, ellipses, verticaux)


async def _deb_async(pg, o, genres):
    r = await pg.evaluate(_DEB, o)
    if r is None:
        await pg.evaluate(_js()); r = await pg.evaluate(_DEB, o)
    return _filtre(r, genres, o['ellipses'], o['verticaux'])


def _filtre(r, genres, ellipses, verticaux):
    g = set(genres) | ({'ellipse'} if ellipses else set())
    return [x for x in r if x['genre'] in g]


def resume(liste, n=6):
    """Une ligne lisible par défaut : « bloc div#aside +26 px “Fiche…” ; … »."""
    return ' ; '.join(f"{x['genre']} {x['sel']} +{x['px']} px" + (f" « {x['texte'][:30]} »" if x['texte'] else '') for x in liste[:n]) + (f' ; … (+{len(liste) - n})' if len(liste) > n else '')
