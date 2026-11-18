#!/usr/bin/env python3
"""Studio de captures commun : vues fixes d'un jeu décrites en JSON, reproductibles, comparées à une référence OU à une révision.

usage :
  python3 outils-communs/captures.py <jeu>/outils/vues.json [sortie]                  captures de la version en cours
  python3 outils-communs/captures.py <jeu>/outils/vues.json sortie --comparer <jeu>/references   + comparaison (compare.py)
  python3 outils-communs/captures.py <jeu>/outils/vues.json sortie --avant HEAD       AVANT (révision git) / APRÈS : aucune
        référence à garder dans le dépôt (révision extraite et construite à part, comme banc.py ; --avant-dossier, --avant-page)
  python3 outils-communs/captures.py <jeu>/outils/vues.json refs --format jpg --echelle 0.5   références LÉGÈRES (JPEG, ½ taille)
options : --vues a,b (les vues s'enchaînent dans la même page : un sous-ensemble ne part pas forcément du même état qu'une
          série complète ; pour une vue indépendante, "seule": true) · --appareils telephone,ordinateur · --construire · --seuil 6 (% de compare.py) · --strict (code 1 si
          alerte, image manquante, vue en échec, erreur JS ou vue instable) · --stabilite (chaque vue capturée DEUX fois : une vue
          qui change d'une série à l'autre donnerait de fausses alertes) · --format png|jpg · --echelle 1 · --qualite 85
          · --mode fige|reel (remplace celui des réglages) · --sans-verrou · --attente-max 1800 (s)
Verrou machine (verrou.py, 18/11) : les captures passent avec les autres robots mais jamais pendant un banc (elles fausseraient ses
  mesures : bruit 69-315 % vu chez Une vie) ; elles attendent sa fin en le disant.
Seules les images que la série refait sont remplacées dans la sortie (rien d'autre n'y est effacé).
Sortie (défaut /tmp/captures-<jeu>) : une image par vue (`nom.png`, ou `<appareil>_nom.png` s'il y a plusieurs appareils),
  captures.json (durée, erreurs, infos de chaque vue), et avec --comparer/--avant : planche.png + comparaison.json.

Réglages (JSON ; chemins relatifs à la racine du dépôt ; MÊMES clés de chargement que banc.json, qu'on peut recopier) :
  "jeu", "fichier" | "dossier"+"page", "construire", "stockage", "init", "graine" (12345), "pret", "pret_ms", "pret_max_s",
  "entree", "entree_ms", "preparation": "reelle", "routes"
  "appareils": {"telephone": {"largeur":390,"hauteur":844,"dpr":1,"tactile":true,"mouvement_reduit":true}}   (défaut : téléphone 390×780)
  "mode": "fige"     défaut : horloge.js (temps virtuel + hasard à graine) ; les images ne tournent que quand l'outil les joue → deux
                     séries identiques ; "reel" : temps réel (attentes en ms, pour un jeu qui ne tourne pas sur requestAnimationFrame)
  "masquer": ["#toast"]     éléments cachés avant chaque capture (le 🐞 et le voyant 🧪 de testkit.js le sont toujours)
  "css": "…"                CSS ajouté à la page ; "animations": "figer" (défaut : animations CSS amenées à leur fin, ou arrêtées
                            au début si elles sont infinies, juste avant la capture) | "garder"
  "avant_chaque": "closeM()"  JS lancé avant chaque vue
  "images": 16, "pas": 162    images jouées (temps figé) avant chaque capture : 16 × 162 ms ≈ 2,6 s de jeu
  "pause_ms": 120             attente RÉELLE après le js de chaque vue (setTimeout du jeu : fondus, fermetures de fenêtres)
  "vues": [{"nom":"plateau", "js":"setTab('plateau')", "attendre":"R3.pret", "occupe":"G3.occupe", "images":30, "pas":50,
            "attente_ms":2500 (mode reel), "pause_ms":300, "appareils":["telephone"], "seule":true, "clip":{"x":0,"y":0,"width":390,"height":470},
            "pleine_page":false, "infos":"G3.info()"}]
       js = instructions pour se placer dans la vue ; attendre = condition JS jouée image par image jusqu'à être vraie (60 s) ;
       occupe = expression vraie tant que le jeu prépare (shaders, chargement) : l'outil joue des images jusqu'à ce qu'elle soit
       fausse, AVANT et APRÈS les images de la vue (remplace les délais fixes trop courts : Trône de Braise, 17/11) ;
       seule = page neuve pour cette vue (sinon les vues s'enchaînent dans la même page, dans l'ordre) ; infos = expression JS
       jointe à captures.json (lisibilité, triangles…).
  "occupe": "…"   valeur par défaut de "occupe" pour toutes les vues
"""
import asyncio, io, json, os, shutil, subprocess, sys, tempfile, time
ICI = os.path.dirname(os.path.abspath(__file__))
RAC = os.path.dirname(ICI)
sys.path.insert(0, ICI)
import banc as B  # noqa: E402  (lieu, construire, extraire, servir… : mêmes règles de chargement et d'avant/après que le banc)
import verrou as V  # noqa: E402
from atelier import ARGS, HORLOGE  # noqa: E402
from routes import brancher as brancher_routes  # noqa: E402

APPAREILS_DEFAUT = {'telephone': {'largeur': 390, 'hauteur': 780, 'dpr': 1}}
# Bouton 🐞 et voyant 🧪 de testkit.js (z-index 9999 en ligne) : le voyant devient « 🧪 60 img/s · pire 17 ms » après 500 ms.
MASQUER_TK = """()=>{for(const e of document.querySelectorAll('body *')){const s=e.style;if(!s||!/^99999?$/.test(s.zIndex))continue;
 const t=(e.textContent||'').trim();if(t==='🐞'||/^Signaler un probl/.test(e.title||'')||(t.startsWith('🧪')&&t.length<80))e.style.setProperty('visibility','hidden','important');}}"""
# Animations CSS : finish() (fin atteinte, animationend déclenché plus tôt : reproductible) ; infinies : remises au début et en pause
# (elles le restent pour les vues suivantes de la même page).
FIGER_ANIM = """()=>{let n=0;for(const a of (document.getAnimations?document.getAnimations():[])){try{const t=a.effect&&a.effect.getTiming?a.effect.getTiming():{};
 if(t.iterations===Infinity){a.currentTime=0;a.pause();}else a.finish();n++;}catch(e){try{a.pause();}catch(_){}}}return n;}"""
COND = "()=>{try{return !!(%s)}catch(e){return false}}"
EXT = ('.png', '.jpg', '.jpeg', '.webp')  # mêmes extensions que compare.py
DELAI_EVAL = 300  # s : un appel JS (images jouées, condition) qui ne rend pas la main (boucle infinie du jeu) arrête la vue au lieu de tout bloquer


async def ev(pg, js, arg=None, delai=DELAI_EVAL):
    try:
        return await asyncio.wait_for(pg.evaluate(js, arg) if arg is not None else pg.evaluate(js), delai)
    except asyncio.TimeoutError:
        raise TimeoutError(f'le jeu ne rend plus la main après {delai} s ({js[:60]}…)') from None


def lire_args(argv):
    o = {'vues': None, 'appareils': None, 'construire': False, 'seuil': None, 'strict': False, 'stabilite': False, 'format': None,
         'echelle': None, 'qualite': None, 'mode': None, 'comparer': None, 'avant': None, 'avant_dossier': None, 'avant_page': None, 'pos': [],
         'sans_verrou': False, 'attente_max': None}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a in ('--construire', '--strict', '--stabilite', '--sans-verrou'):
            o[a[2:].replace('-', '_')] = True
        elif a.startswith('--'):
            k = a[2:].replace('-', '_')
            if k not in o or i + 1 >= len(argv):
                sys.exit(f'captures.py : option inconnue ou sans valeur : {a}')
            o[k] = argv[i + 1]; i += 1
        else:
            o['pos'].append(a)
        i += 1
    return o


def nom_fichier(vue, app, plusieurs, ext):
    return (f'{app}_' if plusieurs else '') + vue['nom'] + '.' + ext


def enregistrer(png, chemin, fmt, echelle, qualite):
    """Écrit la capture : PNG tel quel, ou réduite (échelle) et/ou en JPEG (références légères : ≈ 10× moins lourdes)."""
    if fmt == 'png' and echelle == 1:
        open(chemin, 'wb').write(png); return
    from PIL import Image
    im = Image.open(io.BytesIO(png)).convert('RGB')
    if echelle != 1:
        im = im.resize((max(1, round(im.width * echelle)), max(1, round(im.height * echelle))), Image.LANCZOS)
    if fmt == 'jpg':
        im.save(chemin, 'JPEG', quality=qualite, optimize=True)
    else:
        im.save(chemin, 'PNG', optimize=True)


async def jouer(pg, fige, n, pas):
    if fige:
        for i in range(0, n, 30):
            await ev(pg, '([k,p])=>window.__horloge.avancer(k,p)', [min(30, n - i), pas])
            await pg.wait_for_timeout(2)


async def attendre_cond(pg, cond, fige, vrai=True, delai=60, quoi='attendre'):
    """Joue des images (temps figé) ou attend (temps réel) jusqu'à ce que cond soit vraie (vrai=True) ou fausse. Renvoie le nombre d'images jouées."""
    t0, n = time.time(), 0
    js = COND % cond if vrai else "()=>{try{return !(%s)}catch(e){return true}}" % cond
    while not await ev(pg, js):
        if time.time() - t0 > delai:
            raise TimeoutError(f'{quoi} : « {cond} » toujours {"faux" if vrai else "vrai"} après {delai:.0f} s')
        if fige:
            await jouer(pg, True, 5, 1000 / 60); n += 5
        else:
            await pg.wait_for_timeout(100)
    return n


async def ouvrir(nav, cfg, base, page, app, fige, prep_reelle, erreurs):
    ctx = await nav.new_context(viewport={'width': app.get('largeur', 390), 'height': app.get('hauteur', 780)},
                                device_scale_factor=app.get('dpr', 1), has_touch=bool(app.get('tactile')), is_mobile=bool(app.get('tactile')),
                                reduced_motion='reduce' if app.get('mouvement_reduit') else 'no-preference')
    try:
        return await _ouvrir(ctx, cfg, base, page, fige, prep_reelle, erreurs)
    except BaseException:
        try:
            await ctx.close()
        except Exception:
            pass
        raise


async def _ouvrir(ctx, cfg, base, page, fige, prep_reelle, erreurs):
    jr = await brancher_routes(ctx, cfg.get('routes'), base=RAC)
    pg = await ctx.new_page()
    pg.on('pageerror', lambda e: erreurs.append(str(e)[:300]))
    init = 'window.__captures=1;'
    if cfg.get('stockage'):
        init += 'try{localStorage.clear();' + ''.join(f'localStorage.setItem({json.dumps(k)},{json.dumps(v if isinstance(v, str) else json.dumps(v))});' for k, v in cfg['stockage'].items()) + '}catch(e){}'
    if fige:
        init += f"window.__HORLOGE_GRAINE={int(cfg.get('graine', 12345))};" + ('window.__HORLOGE_REEL=1;' if prep_reelle else '')
    elif cfg.get('graine') is not None:
        init += B.GRAINE_JS % int(cfg['graine'])
    await pg.add_init_script(init)
    if fige:
        await pg.add_init_script(path=HORLOGE)
        if cfg.get('coulant', True):
            await pg.add_init_script('window.__horloge&&window.__horloge.coulant(true)')
    if cfg.get('init'):
        await pg.add_init_script(cfg['init'])
    t0 = time.time()
    rep = await pg.goto(base + page, timeout=180000, wait_until='load')
    if rep is not None and rep.status >= 400:
        raise B.PageIntrouvable(f'page introuvable (HTTP {rep.status}) : {base + page}')
    if cfg.get('pret'):
        try:
            await attendre_cond(pg, cfg['pret'], fige and not prep_reelle, delai=float(cfg.get('pret_max_s', 180)), quoi='jeu jamais prêt')
        except TimeoutError as e:
            raise B.JamaisPret(str(e) + ('' if prep_reelle or not fige else ' (essayer "preparation": "reelle")')) from None
    await B.patienter(pg, cfg.get('pret_ms', 800), fige and not prep_reelle)
    if cfg.get('entree'):
        await ev(pg, B.fn(cfg['entree']))
        await B.patienter(pg, cfg.get('entree_ms', 500), fige and not prep_reelle)
    if prep_reelle:
        await pg.evaluate('()=>{__horloge.reel(false);__horloge.coulant(true)}')
    if cfg.get('css'):
        await pg.add_style_tag(content=cfg['css'])
    return ctx, pg, jr, round((time.time() - t0) * 1000)


async def une_vue(pg, cfg, v, fige):
    """Se place dans la vue, attend qu'elle soit stable, renvoie (png, infos, images jouées)."""
    occ = v.get('occupe', cfg.get('occupe'))
    joue = 0
    if cfg.get('avant_chaque'):
        await ev(pg, B.fn(cfg['avant_chaque']))
    if v.get('js'):
        await ev(pg, B.fn(v['js']))
    await pg.wait_for_timeout(v.get('pause_ms', cfg.get('pause_ms', 120)))
    if v.get('attendre'):
        joue += await attendre_cond(pg, v['attendre'], fige, delai=float(v.get('delai_s', 60)))
    if occ:
        joue += await attendre_cond(pg, occ, fige, vrai=False, delai=float(v.get('delai_s', 120)), quoi='occupe')
    if fige:
        n = int(v.get('images', cfg.get('images', 16)))
        await jouer(pg, True, n, float(v.get('pas', cfg.get('pas', 162)))); joue += n
        if occ:  # une préparation lancée PENDANT ces images (shaders d'un effet) : on attend qu'elle finisse, puis 2 images
            k = await attendre_cond(pg, occ, fige, vrai=False, delai=float(v.get('delai_s', 120)), quoi='occupe')
            if k:
                await jouer(pg, True, 2, 1000 / 60); joue += k + 2
    else:
        await pg.wait_for_timeout(v.get('attente_ms', 1500))
    await ev(pg, MASQUER_TK)
    sel = list(cfg.get('masquer') or []) + list(v.get('masquer') or [])
    if sel:
        await ev(pg, "(l)=>{for(const s of l)for(const e of document.querySelectorAll(s))e.style.setProperty('visibility','hidden','important');}", sel)
    if cfg.get('animations', 'figer') == 'figer':
        await ev(pg, FIGER_ANIM)
    opts = {'timeout': 240000, 'animations': 'allow', 'caret': 'hide'}
    if v.get('clip'):
        opts['clip'] = v['clip']
    if v.get('pleine_page'):
        opts['full_page'] = True
    png = await pg.screenshot(**opts)
    infos = None
    if v.get('infos'):
        try:
            infos = await ev(pg, '()=>(' + v['infos'] + ')')
        except Exception as e:
            infos = 'erreur : ' + str(e)[:150]
    return png, infos, joue


async def une_serie(cfg, base, page, appareils, vues, sortie, fmt, echelle, qualite, mode, etiquette=''):
    """Capture toutes les vues sur tous les appareils dans `sortie`. Renvoie le compte rendu (par fichier)."""
    from playwright.async_api import async_playwright
    fige = mode == 'fige'
    prep_reelle = fige and cfg.get('preparation') == 'reelle'
    os.makedirs(sortie, exist_ok=True)
    plusieurs = len(appareils) > 1
    ext = 'jpg' if fmt == 'jpg' else 'png'
    cr = {'vues': {}, 'chargement_ms': {}, 'erreurs_page': []}
    erreurs = []
    async with async_playwright() as p:
        nav = await p.chromium.launch(args=ARGS)
        try:
            for an, app in appareils.items():
                mes = [v for v in vues if not v.get('appareils') or an in v['appareils']]
                ctx = pg = None
                for i, v in enumerate(mes):
                    f = nom_fichier(v, an, plusieurs, ext)
                    t0 = time.time(); errs = []; n0 = len(erreurs) if pg is not None else 0
                    r = {'appareil': an, 'vue': v['nom']}
                    try:
                        if pg is None or v.get('seule') or (i > 0 and mes[i - 1].get('seule')):
                            if ctx:
                                await ctx.close()
                            erreurs = []
                            n0 = 0  # erreurs du chargement, de "pret" et de "entree" : comptées avec cette vue
                            ctx, pg, jr, ms = await ouvrir(nav, cfg, base, page, app, fige, prep_reelle, erreurs)
                            cr['chargement_ms'].setdefault(an, ms)
                            if jr['manquants']:
                                cr['erreurs_page'].append('routes : introuvable(s) en local : ' + ', '.join(jr['manquants'][:3]))
                        png, infos, joue = await une_vue(pg, cfg, v, fige)
                        enregistrer(png, os.path.join(sortie, f), fmt, echelle, qualite)
                        errs = erreurs[n0:]
                        r.update({'fichier': f, 'images_jouees': joue, 'ko': round(os.path.getsize(os.path.join(sortie, f)) / 1024)})
                        if infos is not None:
                            r['infos'] = infos
                    except (B.PageIntrouvable, B.JamaisPret):
                        raise
                    except Exception as e:
                        r['echec'] = str(e).split('\n')[0][:300]
                        errs = erreurs[n0:]
                        if ctx is not None:  # page dans un état inconnu : la vue suivante repart d'une page neuve
                            try:
                                await ctx.close()
                            except Exception:
                                pass
                        ctx = pg = None
                    r['duree_s'] = round(time.time() - t0, 1)
                    if errs:
                        r['erreurs'] = errs
                    cr['vues'][f] = r
                    etat = ('ÉCHEC ' + r['echec'][:90]) if 'echec' in r else f"{r['ko']} ko" + (f" · ⚠ {len(errs)} erreur(s) JS : {errs[0][:80]}" if errs else '')
                    print(f"  {etiquette}{an:10s} {v['nom']:20s} {r['duree_s']:5.1f} s  {etat}", flush=True)
                if ctx:
                    await ctx.close()
        finally:
            await nav.close()
    return cr


def nettoyer(sortie, vues, appareils):
    """Retire seulement les images que CETTE série va refaire (même nom, toute extension lue par compare.py) : une vieille
    capture JPEG laissée à côté d'une PNG neuve serait comparée à sa place. Rien d'autre n'est touché (références, images du jeu)."""
    if not os.path.isdir(sortie):
        return
    plusieurs = len(appareils) > 1
    for an in appareils:
        for v in vues:
            if v.get('appareils') and an not in v['appareils']:
                continue
            base = nom_fichier(v, an, plusieurs, 'x')[:-2]
            for e in EXT:
                f = os.path.join(sortie, base + e)
                if os.path.isfile(f):
                    os.remove(f)


def comparer(ref, nouv, planche, seuil, jsonf):
    """compare.py (tolérant aux petits décalages) ; renvoie son résultat JSON."""
    cmd = [sys.executable, os.path.join(ICI, 'compare.py'), ref, nouv, planche, str(seuil), '--json', jsonf]
    r = subprocess.run(cmd, capture_output=True, text=True)
    print(r.stdout.rstrip())
    if r.returncode:
        raise RuntimeError('compare.py : ' + (r.stderr or r.stdout)[-300:])
    return json.load(open(jsonf))


def stabilite(a, b):
    """Écart EXACT entre deux séries de la même version : % de pixels qui diffèrent de plus de 8 niveaux. > 0,1 % = vue instable."""
    import numpy as np
    from PIL import Image
    res = {}
    for f in sorted(os.listdir(a)):
        if not f.lower().endswith(('.png', '.jpg')) or not os.path.exists(os.path.join(b, f)):
            continue
        x = np.asarray(Image.open(os.path.join(a, f)).convert('RGB'), dtype=np.int16)
        y = np.asarray(Image.open(os.path.join(b, f)).convert('RGB'), dtype=np.int16)
        res[f] = 100.0 if x.shape != y.shape else round(float((np.abs(x - y).max(-1) > 8).mean() * 100), 2)
    return res


def main(argv):
    o = lire_args(argv)
    if not o['pos']:
        print(__doc__); return 2
    reg = os.path.abspath(o['pos'][0])
    cfg = json.load(open(reg, encoding='utf-8'))
    jeu = cfg.get('jeu') or os.path.basename(os.path.dirname(os.path.dirname(reg)))
    sortie = os.path.abspath(o['pos'][1] if len(o['pos']) > 1 else os.path.join(tempfile.gettempdir(), f'captures-{jeu}'))
    vues = cfg.get('vues') or []
    if o['vues']:
        voulu = o['vues'].split(',')
        vues = [v for v in vues if v['nom'] in voulu]
    if not vues:
        sys.exit('captures.py : aucune vue ' + (f'ne correspond à {o["vues"]}' if o['vues'] else '(réglages sans "vues")'))
    noms = [v['nom'] for v in vues]
    if len(set(noms)) != len(noms):
        sys.exit('captures.py : deux vues portent le même nom')
    appareils = cfg.get('appareils') or APPAREILS_DEFAUT
    if o['appareils']:
        appareils = {k: v for k, v in appareils.items() if k in o['appareils'].split(',')}
        if not appareils:
            sys.exit('captures.py : aucun appareil ne correspond à ' + o['appareils'])
    fmt = (o['format'] or cfg.get('format', 'png')).lower().replace('jpeg', 'jpg')
    if fmt not in ('png', 'jpg'):
        sys.exit('captures.py : --format png ou jpg')
    echelle = float(o['echelle'] or cfg.get('echelle', 1)); qualite = int(o['qualite'] or cfg.get('qualite', 85))
    mode = o['mode'] or cfg.get('mode', 'fige')
    seuil = float(o['seuil'] or cfg.get('seuil', 6))
    avec_avant = bool(o['avant'] or o['avant_dossier'] or o['avant_page'])
    t0 = time.time(); tmp = None; serveurs = []; code = 0
    jeton = None if o['sans_verrou'] else V.prendre('robot', f'captures {jeu}', True, float(o['attente_max'] or 1800))[0]
    bilan = {'jeu': jeu, 'mode': mode, 'format': fmt, 'echelle': echelle, 'appareils': list(appareils)}
    try:
        if o['construire']:
            B.construire(cfg, RAC)
        d_ap, p_ap = B.lieu(cfg, RAC)
        B.assurer_page(cfg, d_ap, p_ap, 'APRÈS' if avec_avant else 'en cours', o['construire'])
        if avec_avant:
            if o['avant']:
                t1 = time.time(); tmp = B.extraire(o['avant'], cfg)
                print(f"  révision {o['avant']} extraite en {time.time()-t1:.1f} s", flush=True)
                if B.hors_depot(cfg):
                    d_ap, d_av = B.mettre_de_cote(d_ap, cfg, tmp, p_ap); p_av = p_ap
                else:
                    B.construire(cfg, tmp); d_av, p_av = B.lieu(cfg, tmp)
            elif o['avant_page']:
                d_av, p_av = os.path.dirname(os.path.abspath(o['avant_page'])), os.path.basename(o['avant_page'])
            else:
                d_av, p_av, racine = B.lieu_avant_dossier(cfg, o['avant_dossier'])
                if racine and o['construire']:
                    B.construire(cfg, os.path.abspath(o['avant_dossier']))
            B.verifier_page(d_av, p_av, 'AVANT')
        b_ap, s = B.servir(d_ap); serveurs.append(s)
        if o['comparer'] and os.path.realpath(o['comparer']) == os.path.realpath(sortie):
            sys.exit('captures.py : --comparer désigne le dossier de sortie (les références seraient remplacées)')
        nettoyer(sortie, vues, appareils)
        print(f"Captures {jeu} · {len(vues)} vue(s) · {', '.join(appareils)} · {'temps figé (horloge.js)' if mode == 'fige' else 'temps réel'} · {fmt}{'' if echelle == 1 else f' ×{echelle:g}'}", flush=True)
        if avec_avant:
            b_av, s = B.servir(d_av); serveurs.append(s)
            d_sav = os.path.join(sortie, 'avant')
            if os.path.isdir(d_sav) and os.listdir(d_sav) and not os.path.exists(os.path.join(d_sav, 'captures.json')):
                sys.exit(f'captures.py : {d_sav} existe et ne vient pas de captures.py : choisir un autre dossier de sortie')
            shutil.rmtree(d_sav, ignore_errors=True)
            print('AVANT :', flush=True)
            bilan['avant'] = asyncio.run(une_serie(cfg, b_av, p_av, appareils, vues, d_sav, fmt, echelle, qualite, mode, 'avant '))
            json.dump(bilan['avant'], open(os.path.join(d_sav, 'captures.json'), 'w'), ensure_ascii=False, indent=1)
            print('APRÈS :', flush=True)
        bilan['apres'] = asyncio.run(une_serie(cfg, b_ap, p_ap, appareils, vues, sortie, fmt, echelle, qualite, mode))
        if o['stabilite']:
            d_bis = tempfile.mkdtemp(prefix=f'captures-{jeu}-bis-')
            print('2e série (stabilité) :', flush=True)
            try:
                asyncio.run(une_serie(cfg, b_ap, p_ap, appareils, vues, d_bis, fmt, echelle, qualite, mode, 'bis   '))
                st = stabilite(sortie, d_bis)
            finally:
                shutil.rmtree(d_bis, ignore_errors=True)
            bilan['stabilite'] = st
            inst = {f: p for f, p in st.items() if p > 0.1}
            print(f"Stabilité : {len(st) - len(inst)}/{len(st)} vue(s) identiques d'une série à l'autre" + (' · ⚠ INSTABLES (fausses alertes probables) : ' + ', '.join(f'{f} {p:.1f} %' for f, p in inst.items()) if inst else ''))
            if inst and o['strict']:
                code = 1
        ref = o['comparer'] or (os.path.join(sortie, 'avant') if avec_avant else None)
        if ref:
            print(f"\nComparaison {'AVANT → APRÈS' if avec_avant else 'référence ' + ref + ' → nouvelle version'} :")
            # on ne compare QUE les images de cette série (une image d'une série précédente restée dans la sortie serait comparée
            # à tort) ; avec --vues, seulement les références de ces vues (les autres ne sont pas « absentes »)
            d_cmp = tempfile.mkdtemp(prefix='captures-cmp-')
            try:
                faits = [r['fichier'] for r in bilan['apres']['vues'].values() if r.get('fichier')]
                n_dir = os.path.join(d_cmp, 'n'); os.makedirs(n_dir)
                for f in faits:
                    os.symlink(os.path.join(sortie, f), os.path.join(n_dir, f))
                r_dir = ref
                if o['vues']:
                    voulus = {nom_fichier(v, an, len(appareils) > 1, 'x')[:-2] for an in appareils for v in vues if not v.get('appareils') or an in v['appareils']}
                    r_dir = os.path.join(d_cmp, 'r'); os.makedirs(r_dir)
                    for f in os.listdir(ref):
                        if os.path.splitext(f)[0] in voulus and f.lower().endswith(EXT):
                            os.symlink(os.path.abspath(os.path.join(ref, f)), os.path.join(r_dir, f))
                c = comparer(r_dir, n_dir, os.path.join(sortie, 'planche.png'), seuil, os.path.join(sortie, 'comparaison.json'))
            finally:
                shutil.rmtree(d_cmp, ignore_errors=True)
            bilan['comparaison'] = {k: c[k] for k in ('alertes', 'total', 'manquantes')}
            print('planche :', os.path.join(sortie, 'planche.png'))
            if o['strict'] and (c['alertes'] or c['manquantes'] or not c['total']):
                code = 1
    except B.PageAbsente as e:
        print('captures : ' + str(e)); return 2
    except (B.PageIntrouvable, B.JamaisPret) as e:
        print('captures : ' + str(e)); return 2
    finally:
        for s in serveurs:
            s.shutdown(); s.server_close()
        if tmp:
            shutil.rmtree(tmp, ignore_errors=True)
        if jeton:
            jeton.close()
    series = [bilan['apres']] + ([bilan['avant']] if avec_avant else [])
    echecs = [f'{f} : {r["echec"]}' for sr in series for f, r in sr['vues'].items() if 'echec' in r]
    err = sorted({e for sr in series for r in sr['vues'].values() for e in r.get('erreurs', [])} | {e for sr in series for e in sr['erreurs_page']})
    if echecs:
        print('\n⚠ vue(s) en échec : ' + ' | '.join(echecs[:6]))
    if err:
        print('⚠ erreurs JS : ' + ' | '.join(e[:120] for e in err[:5]))
    if o['strict'] and (echecs or err):
        code = 1
    poids = sum(os.path.getsize(os.path.join(sortie, r['fichier'])) for r in bilan['apres']['vues'].values() if r.get('fichier'))
    bilan.update({'duree_s': round(time.time() - t0), 'poids_ko': round(poids / 1024)})
    json.dump(bilan, open(os.path.join(sortie, 'captures.json'), 'w'), ensure_ascii=False, indent=1)
    print(f"\n{len(bilan['apres']['vues'])} image(s) → {sortie} ({poids/1048576:.1f} Mo) · durée {time.time()-t0:.0f} s")
    return code


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
