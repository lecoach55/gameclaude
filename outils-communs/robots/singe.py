#!/usr/bin/env python3
"""Singe commun : touche au hasard les vrais boutons d'un jeu web (téléphone et ordinateur) et relève ce qui casse.

usage : python3 outils-communs/robots/singe.py <jeu>/outils/singe.json [--secondes 60] [--graine 1]
                [--appareils telephone,ordinateur] [--sortie dossier] [--fichier page.html] [--couvrir] [--actions N]
                [--ordinateur 1280x800] [--telephone 360x740] [--sans-verrou] [--attente-max 1800]
Verrou machine (verrou.py, 18/11) : le singe passe avec les autres robots mais jamais pendant un banc ; il attend sa fin en le disant.
--images N (ou "images": N) : mode ÉCONOME pour la 3D lourde (rendu logiciel à plusieurs secondes par image) — horloge.js fige
  le temps après l'entrée et le singe ne joue que N images après chaque action (au lieu de laisser le jeu dessiner en continu
  pendant que les relevés attendent) ; chargement, entrée et relances restent en temps réel. Hameau : 4 → 39 actions en 2×45 s.
  Entre deux actions les minuteries du jeu n'avancent que de N × 16 ms : une animation d'interface de 300 ms demande ≈ 20 actions
  (les « clics sans effet » peuvent monter).
--ordinateur / --telephone LxH : format d'écran (défaut 1366x860 et 390x844 ; le studio prend 1280x800) ; aussi en réglage
  "ordinateur": "1280x800". Le téléphone est toujours tactile (has_touch, is_mobile), l'ordinateur toujours à la souris.
--appareils accepte aussi les formats communs d'appareils.py (19/11) : --appareils mac,telephone (fenêtre réelle du Mac de Victor,
  483×755 @2 ; mac-etroit, mac-moyen, mac-large, mac@1, 1000x700@2…).
Three.js chargé sur jsDelivr/unpkg (bloqués dans le bac à sable) : servi en local par outils-communs/routes.py (réglage "routes").
--actions N : s'arrête après N actions (au plus --secondes) — essais reproductibles quelle que soit la vitesse de la machine.
--couvrir (ou "couvrir": true) : mode EXPLORATEUR — touche d'abord les boutons jamais touchés sur l'écran affiché
  (poids 1/(1+n)², n = fois déjà touché sur cet écran) pour parcourir le plus d'écrans et de boutons possible.
Dans les deux modes : contenus coupés relevés à la première apparition de chaque écran, et couverture
  (boutons vus / touchés par écran, liste des jamais touchés) dans le rapport.
Rapport (écran + <sortie>/singe.json + captures) :
  erreurs JS (pageerror + console.error), avec les 5 dernières actions et une capture à la première occurrence ;
  blocages (plus rien de cliquable, ou écran figé alors qu'on clique) ; invariants du jeu violés ;
  contenus coupés par écran (sonde.debordements) ; clics SANS EFFET par bouton (l'écran et l'état n'ont pas bougé) ;
  progression (expression « etat » du jeu au début et à la fin).
Code de retour 1 s'il y a une erreur JS, un blocage ou un invariant violé (les débordements et clics sans effet sont informatifs).

Réglages (JSON, chemins relatifs au fichier de réglages) — seul « fichier » ou « dossier » est obligatoire :
  "fichier": "../build/index.html"    page ouverte en file://   — ou —  "dossier": "../jeu", "page": "index.html" (serveur local)
  "port": 8791, "requete": "?v3d=0"
  "stockage": {"cle": "valeur"}       localStorage préparé (nouvelle partie à chaque appareil)
  "init": "window.TEST_MONKEY=1"     script injecté avant le jeu
  "entree": ["Nouvelle partie", "#bGo", {"js": "demarrer()"}, {"attendre": 500}]   pour arriver dans la partie
  "pret": "ECRAN==='aventure'"        condition attendue après l'entrée (60 s)
  "eviter": ["Signaler", "Mesurer la fluidité", "mBanc"]   textes ou id jamais touchés (🐞, banc, effacer la partie…)
  "selecteur": ".carte,[data-v]"      éléments cliquables propres au jeu, en plus des boutons/liens/onglets
  "priorites": [{"motif": "semaine suivante", "poids": 0.3}]   probabilité de toucher ce bouton quand il est là (faire avancer la partie)
  "etat": "G.jour"                    progression : relevée au début/fin et ajoutée à l'empreinte (clic sans effet, blocage)
  "invariants": "[isFinite(G.or)||'or '+G.or].filter(x=>x!==true)"   liste de problèmes (vide = tout va bien)
  "avancer": {"toutes": 40, "pas": [{"js": "UI.warned=true"}, "#endTurn"]}   faire progresser la partie toutes les N actions (erreurs ignorées)
  "relance": {"si": "ECRAN==='accueil'", "entree": ["#bTest"]}       revenir dans la partie si le singe en sort
  "touches": ["Escape", " ", "ArrowLeft"]   touches tapées au hasard (5 % des actions)
  "hasard": 0.15                      part des tapotements en un point au hasard (carte, canvas)
  "glisser": 0.05                     part des glissés (caméra, carte)
  "pause": [40, 250]                  attente après chaque action (ms, au hasard)
  "erreurs_ignorees": ["Failed to load resource"]
  "ignorer_debordements": [".tbl-wrap"]
  "blocage": 60                       actions d'affilée sans aucun changement → blocage (capture, Échap)
  "ecran": "S.event?'événement':'onglet '+tab"   nom de l'écran affiché (défaut : __sonde.ecran(), fenêtre ouverte ou premier titre)
  "couvrir": true                     mode explorateur par défaut pour ce jeu
  "routes": {"https://cdn/lib/": "../vendor/"}   adresses servies en local (routes.py ; chemins relatifs aux réglages) ;
                                      Three.js du CDN l'est toujours par défaut ; "routes": false pour couper
  "ordinateur": "1280x800", "telephone": "390x844"   formats d'écran
  "images": 2                         mode économe (3D lourde) : 2 images jouées après chaque action, temps figé entre deux
  "visiter": [{"nom": "combat 3D", "si": "!document.getElementById('arene').classList.contains('cache')",
               "aller": [{"js": "…"}, "#bVoir"], "apres": 40, "encore": false, "essais": 3, "delai": 20, "obligatoire": true}]
                                      ÉTATS À ATTEINDRE (19/11, retour Cage : 1300 clics sans jamais entrer dans le combat 3D, sans que
                                      rien ne le dise) : à chaque action le singe note s'il est dans l'état « si » (actions, secondes,
                                      entrées, erreurs survenues dedans) ; s'il n'y est jamais allé après « apres » actions (défaut 40,
                                      ou --actions/3), il y va par les étapes « aller » (temps réel le temps d'y aller ; « encore » :
                                      y retourner chaque fois qu'il en est sorti depuis « apres » actions ; « essais » = forçages
                                      ratés tolérés), puis continue au hasard. Les attentes du forçage sont bornées par --secondes.
                                      Un état « obligatoire » (défaut) jamais atteint compte comme un échec (code 1), sauf si le run
                                      a été trop court pour tenter d'y aller (avertissement). NB : « aller » qui fait avancer le jeu par
                                      son moteur fausse la progression « etat » mesurée (le rapport le dit : forçages listés).
Délais (19/11) : l'entrée, « pret » et les étapes « aller » attendent selon la charge de la machine (patience.py : 60 s × facteur
  de charge, relu à l'échéance) — plus d'échec « pret » quand d'autres conversations chargent la machine.
"""
import asyncio, json, os, random, re, sys, time
from collections import Counter, defaultdict
ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(ICI))
from sonde import cliquer, debordements, resume, SONDE  # noqa: E402
HORLOGE = os.path.join(os.path.dirname(ICI), 'horloge.js')
from atelier import serveur, ARGS  # noqa: E402
from routes import brancher as brancher_routes, resume as resume_routes  # noqa: E402
import verrou  # noqa: E402
import patience  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402
from appareils import un_format, contexte, connus  # noqa: E402

APPAREILS = {'telephone': dict(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=1),
             'ordinateur': dict(viewport={'width': 1366, 'height': 860}, device_scale_factor=1)}


def args():
    a = sys.argv[1:]
    if not a or a[0].startswith('-'):
        print(__doc__); sys.exit(2)
    o = {'reglages': a[0], 'secondes': 60, 'graine': 1, 'appareils': 'telephone,ordinateur', 'sortie': None, 'fichier': None, 'couvrir': False, 'actions': 0,
         'ordinateur': None, 'telephone': None, 'images': None,
         'attente_max': None, 'sans_verrou': False}
    i = 1
    while i < len(a):
        k = a[i].lstrip('-')
        if k == 'couvrir':
            o['couvrir'] = True; i += 1
        elif k == 'sans-verrou':
            o['sans_verrou'] = True; i += 1
        elif k == 'attente-max' and i + 1 < len(a):
            o['attente_max'] = a[i + 1]; i += 2
        elif k in o and i + 1 < len(a):
            o[k] = a[i + 1]; i += 2
        else:
            print('option inconnue :', a[i]); sys.exit(2)
    o['secondes'] = float(o['secondes']); o['graine'] = int(o['graine']); o['actions'] = int(o['actions'])
    return o


def charger(o):
    R = json.load(open(o['reglages'], encoding='utf-8'))
    base = os.path.dirname(os.path.abspath(o['reglages']))
    if o['fichier']:
        R['fichier'] = os.path.abspath(o['fichier']); R.pop('dossier', None)
    elif R.get('fichier'):
        R['fichier'] = os.path.normpath(os.path.join(base, R['fichier']))
    if R.get('dossier'):
        R['dossier'] = os.path.normpath(os.path.join(base, R['dossier']))
    if not R.get('fichier') and not R.get('dossier'):
        raise SystemExit('réglages : « fichier » ou « dossier » obligatoire')
    if R.get('fichier') and not os.path.exists(R['fichier']):
        raise SystemExit(f"page introuvable : {R['fichier']} (construire le jeu d'abord ?)")
    R['_base'] = base
    R.setdefault('jeu', os.path.basename(os.path.dirname(base)) if os.path.basename(base) == 'outils' else os.path.basename(base))
    return R


def url_de(R):
    q = R.get('requete', '')
    if R.get('fichier'):
        return 'file://' + R['fichier'] + q
    return serveur(R['dossier'], int(R.get('port', 8799))) + R.get('page', 'index.html') + q


async def faire(pg, pas, delai=20):
    """Une étape d'entrée : texte de bouton, sélecteur CSS (#id, .classe, [attr]), {"js": …} ou {"attendre": ms}."""
    if isinstance(pas, dict):
        if 'js' in pas: await pg.evaluate(f"()=>{{{pas['js']}}}")
        if 'attendre' in pas: await pg.wait_for_timeout(int(pas['attendre']))
        if 'cliquer' in pas: await cliquer(pg, pas['cliquer'], delai=delai)
        return
    if re.match(r'^[#.\[]', pas):
        await pg.click(pas, timeout=delai * 1000)
    else:
        await cliquer(pg, pas, delai=delai)


async def entrer(pg, etapes, pret, delai=60):
    """Étapes d'entrée puis condition « pret » ; délais adaptés à la charge de la machine (patience.py : 60 s × facteur)."""
    for pas in etapes or []:
        await faire(pg, pas, delai=patience.delai(min(20, delai))); await pg.wait_for_timeout(150)
    if pret:
        await patience.attendre(pg, pret, delai, quoi='pret')


async def val(pg, expr, defaut=None):
    if not expr: return defaut
    try:
        return await pg.evaluate(f"()=>{{try{{return JSON.parse(JSON.stringify({expr}))}}catch(e){{return 'erreur : '+e.message}}}}")
    except Exception as e:
        return 'indisponible : ' + str(e)[:80]


def _norme(t):
    return re.sub(r'\d+', '#', str(t or '')).strip()[:40]


def _choix_neuf(rng, l, deja, ec):
    """Mode explorateur : tirage pondéré 1/(1+n)², n = fois où ce bouton a déjà été touché sur cet écran
    (×3 dans une fenêtre ouverte, ×0,5 s'il faut faire défiler pour l'atteindre)."""
    w = [(3 if x['dialogue'] else 1) * (0.5 if x['loin'] else 1) / (1 + deja[(ec, _norme(x['t']))]) ** 2 for x in l]
    return rng.choices(l, weights=w, k=1)[0]


async def un_appareil(p, R, nom, secondes, graine, sortie, couvrir=False, max_actions=0):
    rng = random.Random(f"{graine}-{nom}")
    nav = await p.chromium.launch(args=ARGS)
    ctx = await nav.new_context(**APPAREILS[nom], reduced_motion='reduce')
    jr = await brancher_routes(ctx, R.get('routes'), base=R['_base'])  # Three.js du CDN servi en local
    pg = await ctx.new_page()
    ign = [re.compile(x) for x in R.get('erreurs_ignorees', [])] + [re.compile(r'Failed to load resource|favicon')]
    erreurs, vues, journal = [], {}, []
    def err(t):
        t = str(t)[:300]
        if any(x.search(t) for x in ign): return
        erreurs.append(t)
    pg.on('pageerror', lambda e: err(e))
    pg.on('console', lambda m: err('console : ' + m.text) if m.type == 'error' else None)
    # confirmations acceptées, sauf celles qui effacent ou recommencent la partie (fausseraient la progression mesurée)
    DANGER = re.compile(r'effacer|supprimer|nouvelle partie|recommencer|réinitialiser|abandonner', re.I)
    pg.on('dialog', lambda d: asyncio.ensure_future(d.dismiss() if d.type == 'confirm' and DANGER.search(d.message) else d.accept()))
    sto = R.get('stockage') or {}
    await pg.add_init_script("try{if(!sessionStorage.getItem('__singe')){localStorage.clear();sessionStorage.setItem('__singe','1');%s}}catch(e){}"
                             % ';'.join(f"localStorage.setItem({json.dumps(k)},{json.dumps(v if isinstance(v, str) else json.dumps(v))})" for k, v in sto.items()))
    if R.get('init'): await pg.add_init_script(R['init'])
    econome = int(R.get('_images') or 0)           # mode économe : horloge figée entre les actions, N images jouées après chacune
    if econome:
        await pg.add_init_script(f"window.__HORLOGE_GRAINE={int(graine)};window.__HORLOGE_REEL=1;")
        await pg.add_init_script(path=HORLOGE)
    async def temps_reel(oui):
        if econome:
            try: await pg.evaluate('(o)=>{if(window.__horloge){__horloge.reel(o);if(!o)__horloge.coulant(true);}}', oui)
            except Exception: pass
    await pg.add_init_script(path=SONDE)
    t_ch = time.time()
    url0 = url_de(R)
    await pg.goto(url0, timeout=180000); await pg.wait_for_timeout(int(R.get('attente', 800)))
    await entrer(pg, R.get('entree'), R.get('pret'))
    await temps_reel(False)
    chargement = round(time.time() - t_ch, 1)
    etat0 = await val(pg, R.get('etat'))
    eviter = R.get('eviter', []) + ['Signaler un problème', 'Mesurer la fluidité', 'Mode test', '🐞', '🧪', 'mBug', 'mBanc', 'bBug', 'tkBug']
    prio = [(re.compile(x['motif'], re.I), float(x.get('poids', 0.3))) for x in R.get('priorites', [])]
    p_hasard, p_glisser, touches = float(R.get('hasard', 0.15)), float(R.get('glisser', 0.05)), R.get('touches', ['Escape'])
    pause = R.get('pause', [40, 250]); seuil_bloc = int(R.get('blocage', 60))
    W, H = APPAREILS[nom]['viewport']['width'], APPAREILS[nom]['viewport']['height']
    expr_emp = "()=>JSON.stringify([window.__sonde?__sonde.empreinte():''," + (f"(()=>{{try{{return {R['etat']}}}catch(e){{return null}}}})()" if R.get('etat') else 'null') + "])"
    n, sans_effet, touches_bouton, vides, figees, blocages, invar, deb = 0, Counter(), Counter(), 0, 0, [], Counter(), {}
    ecrans = set(); n_err = 0; relances = 0; rates = 0; sorties = []
    expr_ec = f"()=>{{try{{return String({R['ecran']})}}catch(e){{return '?'}}}}" if R.get('ecran') else "()=>window.__sonde?__sonde.ecran():'?'"
    offerts, deja, par_ecran = defaultdict(set), Counter(), Counter()   # couverture : boutons vus / touchés par écran
    ec = '?'; lentes = []; inatteignables = set()
    # « visiter » : états à atteindre (combat 3D, siège, boutique…), comptés à chaque action et forcés par « aller » s'ils tardent
    for v in (R.get('visiter') or []):
        if not v.get('si'): raise SystemExit(f"réglage « visiter » : « si » manquant dans {v}")
    VIS = [dict(v, nom=str(v.get('nom') or v['si'])[:40]) for v in (R.get('visiter') or [])]
    for v in VIS:
        v.update(_actions=0, _s=0.0, _entrees=0, _premiere=None, _dans=False, _forces=[], _erreurs=0, _dernier=0)
    expr_vis = "()=>[" + ",".join(f"(()=>{{try{{return !!({v['si']})}}catch(e){{return false}}}})()" for v in VIS) + "]"
    apres_def = max(5, max_actions // 3) if max_actions else 40
    async def visites():
        if not VIS: return []
        try: return await pg.evaluate(expr_vis)
        except Exception: return [False] * len(VIS)
    def reste():
        return secondes - (time.time() - t0)
    async def forcer(v):
        """Mène le jeu dans l'état v par ses étapes « aller » (temps réel le temps d'y aller), puis attend « si ».
        Chaque attente est bornée par le temps restant du singe (--secondes) : un forçage qui échoue ne fait pas déborder le run."""
        await temps_reel(True)
        try:
            for pas in v.get('aller', []):
                await faire(pg, pas, delai=max(2, min(patience.delai(10), reste()))); await pg.wait_for_timeout(100)
            await patience.attendre(pg, v['si'], max(2, min(float(v.get('delai', 20)), reste() / max(1, patience.facteur()))), quoi=v['nom'])
            v['_forces'].append(f'action {n} : oui')
            v['_entrees'] += 1; v['_dans'] = True
            if v['_premiere'] is None: v['_premiere'] = n
        except Exception as e:
            v['_forces'].append(f'action {n} : échec ({str(e)[:120]})')
        finally:
            await temps_reel(False)
        v['_dernier'] = n; journal.append('visiter ' + v['nom'])
    for v in VIS:                                   # une expression « si » fautive est une erreur de réglage, pas « jamais atteinte »
        try: await pg.evaluate(f"()=>!!({v['si']})")
        except Exception as e:
            if 'SyntaxError' in str(e) or 'Unexpected' in str(e): raise SystemExit(f"réglage « visiter » {v['nom']} : « si » illisible ({str(e)[:120]})")
    dans_avant = []
    t0 = time.time()
    while time.time() - t0 < secondes and (not max_actions or n < max_actions):
        try:
            if R.get('relance') and await val(pg, R['relance']['si'], False) is True:
                relances += 1
                await temps_reel(True)
                try: await entrer(pg, R['relance'].get('entree'), R['relance'].get('pret') or R.get('pret'), delai=15); await temps_reel(False)
                except Exception as e:
                    await temps_reel(False)
                    blocages.append({'quoi': 'relance impossible : ' + str(e)[:100], 'ecran': await val(pg, '__sonde.ecran()'), 'apres': list(journal), 'capture': ''})
                    if len(blocages) >= 5: break
            if VIS:
                dans_avant = await visites()
                for v, oui in zip(VIS, dans_avant):
                    if oui and not v['_dans']:
                        v['_entrees'] += 1
                        if v['_premiere'] is None: v['_premiere'] = n
                    v['_dans'] = oui
                    if oui: v['_dernier'] = n
                    elif v.get('aller') and n - v['_dernier'] >= int(v.get('apres', apres_def)) and (v['_entrees'] == 0 or v.get('encore')) \
                            and sum('échec' in x for x in v['_forces']) < int(v.get('essais', 3)) and reste() > 10:
                        await forcer(v)
                        dans_avant = await visites()                   # l'action qui suit compte dans l'état atteint
            av = await pg.evaluate(expr_emp)
            tout = await pg.evaluate("(o)=>__sonde.cibles(o)", {'sel': R.get('selecteur'), 'eviter': eviter, 'loin': True})
            c = [x for x in tout if not x['loin']]; loin = [x for x in tout if x['loin']]
            ec = _norme(await pg.evaluate(expr_ec)) or '?'
            par_ecran[ec] += 1
            for x in tout: offerts[ec].add(_norme(x['t']))
            if ec not in ecrans and len(ecrans) < 60:      # nouvel écran : contenus coupés relevés tout de suite
                ecrans.add(ec)
                try:
                    d = await debordements(pg, ignorer=R.get('ignorer_debordements', []))
                    if d: deb[ec] = resume(d, 3)
                except Exception:
                    pass
        except Exception as e:                          # page en train de se recharger, ou sortie du jeu (lien)
            journal.append('rechargement : ' + str(e)[:60]); await pg.wait_for_timeout(800); rates += 1
            if rates >= 5:                              # le jeu a été quitté : on y revient et on le note
                sorties.append(f'{pg.url[:100]} (après : {" → ".join(x for x in journal[-4:] if x)})')
                try:
                    await pg.goto(url0, timeout=60000); await pg.wait_for_timeout(int(R.get('attente', 800)))
                    await entrer(pg, R.get('entree'), R.get('pret'), delai=15); await temps_reel(False)
                except Exception as e2:
                    blocages.append({'quoi': 'retour dans le jeu impossible : ' + str(e2)[:100], 'ecran': '', 'apres': list(journal), 'capture': ''}); break
                rates = 0
            continue
        rates = 0
        t_a = time.time()                                # chrono de l'action seule (sans les relevés d'écran ni les débordements)
        r = rng.random(); action = None; bouton = None
        try:
            passer = False
            if couvrir:                                  # explorateur : un seul tirage sur tout l'écran, nouveautés d'abord
                ch = None
                if (c or loin) and (r >= p_hasard + p_glisser + 0.05 or not c):
                    for motif, poids in prio:
                        l = [x for x in c if motif.search(x['t'])]
                        if l and rng.random() < poids: ch = rng.choice(l); break
                    if ch is None:
                        ch = _choix_neuf(rng, c + loin, deja, ec)
                        if ch['loin']:
                            xy = await pg.evaluate("(i)=>__sonde.viser(i)", ch['i'])
                            if xy: ch['x'], ch['y'] = xy; c = c + [ch]
                            else:                        # inatteignable : son poids baisse, et il ne compte plus dans la couverture
                                k = (ec, _norme(ch['t'])); deja[k] += 1; inatteignables.add(k)
                                passer = True            # le défilement a pu déplacer les autres boutons : on recommence
            elif loin and (not [x for x in c if x['dialogue']] and [x for x in loin if x['dialogue']] or not c or rng.random() < 0.15):
                dl = [x for x in loin if x['dialogue']]
                ch = rng.choice(dl if dl and rng.random() < 0.8 else loin)
                xy = await pg.evaluate("(i)=>__sonde.viser(i)", ch['i'])
                if xy: ch['x'], ch['y'] = xy; c = c + [ch]
                else: ch = None
            else:
                ch = None
            if passer:
                action = None
            elif ch is not None or (c and r >= p_hasard + p_glisser + 0.05):
                for motif, poids in (prio if ch is None else []):
                    l = [x for x in c if motif.search(x['t'])]
                    if l and rng.random() < poids: ch = rng.choice(l); break
                if ch is None:
                    dl = [x for x in c if x['dialogue']]
                    ch = rng.choice(dl) if dl and rng.random() < 0.8 else rng.choice(c)
                bouton = ch['t']; action = 'bouton ' + bouton; touches_bouton[bouton] += 1; deja[(ec, _norme(bouton))] += 1
                loc = pg.locator(f'[data-sonde-i="{ch["i"]}"]')
                if ch['tag'] == 'SELECT':
                    opts = await loc.evaluate("e=>[...e.options].filter(o=>!o.disabled).map(o=>o.value)")
                    if opts: await loc.select_option(rng.choice(opts))
                elif ch['tag'] == 'INPUT' and ch['type'] in ('number', 'text', 'range', 'search', ''):
                    await loc.fill(str(rng.choice([1, 3, 10, 50, 0, -5, 99999, '1.5', 'abc'])) if ch['type'] != 'range' else str(rng.randint(0, 100)))
                elif APPAREILS[nom].get('has_touch'):
                    await pg.touchscreen.tap(ch['x'], ch['y'])
                else:
                    await pg.mouse.click(ch['x'], ch['y'])
            elif r < p_hasard or not c:
                x, y = rng.randrange(W), rng.randrange(H); action = f'tape {x},{y}'
                if APPAREILS[nom].get('has_touch'): await pg.touchscreen.tap(x, y)
                else: await pg.mouse.click(x, y)
                if not c: vides += 1
            elif r < p_hasard + p_glisser:
                x, y = rng.randrange(W), rng.randrange(H); dx, dy = rng.randint(-200, 200), rng.randint(-200, 200); action = f'glisse {x},{y}'
                await pg.mouse.move(x, y); await pg.mouse.down(); await pg.mouse.move(x + dx, y + dy, steps=5); await pg.mouse.up()
            elif r < p_hasard + p_glisser + 0.025:
                x, y = rng.randrange(W), rng.randrange(H); dy = rng.choice([-700, -300, 300, 700]); action = f'défile {dy}'
                await pg.mouse.move(x, y); await pg.mouse.wheel(0, dy)
            else:
                k = rng.choice(touches); action = 'touche ' + k; await pg.keyboard.press(k)
        except Exception as e:
            journal.append(f'{action} : {str(e)[:80]}')
        if c: vides = 0
        n += 1; journal.append(action); journal = journal[-6:]
        attente = rng.randint(int(pause[0]), int(pause[1]))
        if econome:                                    # les images de jeu ne tournent que maintenant (pas pendant les relevés)
            try: await pg.evaluate('(n)=>{if(!window.__horloge)return;__horloge.reel(false);__horloge.coulant(true);__horloge.avancer(n,1000/60)}', econome)  # refigé aussi après un rechargement
            except Exception: pass
            attente = min(attente, 60)
        await pg.wait_for_timeout(attente)
        try:
            ap = await pg.evaluate(expr_emp)
        except Exception:
            ap = None
        dt = time.time() - t_a - attente / 1000       # durée de l'action + relevés, sans la pause voulue
        for v, oui in zip(VIS, dans_avant):
            if oui: v['_actions'] += 1; v['_s'] += time.time() - t_a
        if action and dt > 0.4: lentes.append((round(dt * 1000), f'{ec} › {action}'))
        if ap is not None and ap == av:
            figees += 1
            if bouton: sans_effet[bouton] += 1
        else:
            figees = 0
        if len(erreurs) > n_err:
            for e in erreurs[n_err:]:
                cle = re.sub(r'\d+', '#', e)[:120]
                if cle not in vues:
                    vues[cle] = {'erreur': e, 'fois': 0, 'apres': list(journal), 'capture': f'{nom}_erreur_{len(vues) + 1}.png'}
                    try: await pg.screenshot(path=os.path.join(sortie, vues[cle]['capture']))
                    except Exception: pass
                vues[cle]['fois'] += 1
                for v, oui in zip(VIS, dans_avant):
                    if oui:
                        v['_erreurs'] += 1; vues[cle].setdefault('dans', [])
                        if v['nom'] not in vues[cle]['dans']: vues[cle]['dans'].append(v['nom'])
            n_err = len(erreurs)
        if vides >= 30 or figees >= seuil_bloc:
            quoi = 'plus rien de cliquable' if vides >= 30 else f'{figees} actions sans aucun changement'
            cap = f'{nom}_blocage_{len(blocages) + 1}.png'
            try: await pg.screenshot(path=os.path.join(sortie, cap))
            except Exception: pass
            blocages.append({'quoi': quoi, 'ecran': await val(pg, '__sonde.ecran()'), 'sous_le_doigt': await val(pg, '__sonde.dessus()'), 'boutons': await val(pg, '__sonde.boutons()'), 'etat': await val(pg, R.get('etat')), 'apres': list(journal), 'capture': cap})
            await pg.keyboard.press('Escape'); vides = figees = 0
            if len(blocages) >= 5: break
        av_r = R.get('avancer')
        if av_r and n % int(av_r.get('toutes', 40)) == 0:
            try:
                for pas in av_r.get('pas', []): await faire(pg, pas, delai=3)
                journal.append('avancer')
            except Exception as e:
                journal.append('avancer : ' + str(e)[:60])
        if n % 25 == 0:
            iv = await val(pg, R.get('invariants'), [])
            for x in (iv if isinstance(iv, list) else [f'invariants illisibles : {iv}'] if iv else []):
                invar[str(x)[:120]] += 1
    etat1 = await val(pg, R.get('etat'))
    try: await pg.screenshot(path=os.path.join(sortie, f'{nom}_fin.png'))
    except Exception: pass
    await nav.close()
    morts = [(b, k) for b, k in sans_effet.most_common() if touches_bouton[b] >= 3 and k == touches_bouton[b]]
    for k in inatteignables: offerts[k[0]].discard(k[1])
    vus_n = sum(len(v) for v in offerts.values())
    touches_n = sum(1 for e, v in offerts.items() for b in v if deja[(e, b)])
    jamais = [f'{e} › {b}' for e, v in sorted(offerts.items(), key=lambda kv: -par_ecran[kv[0]]) for b in sorted(v) if not deja[(e, b)]]
    visites_r = {v['nom']: {'vu': v['_entrees'] > 0, 'entrees': v['_entrees'], 'actions': v['_actions'], 'secondes': round(v['_s'], 1),
                            'premiere_action': v['_premiere'], 'forcages': v['_forces'], 'erreurs': v['_erreurs'],
                            'obligatoire': v.get('obligatoire', True) is not False,
                            # jamais atteint SANS avoir pu essayer d'y aller (run trop court : moins de « apres » actions) = avertissement
                            'non_tente': bool(v.get('aller')) and not v['_forces'] and v['_entrees'] == 0} for v in VIS}
    couverture = {'mode': 'explorateur' if couvrir else 'hasard', 'ecrans': len(offerts), 'boutons_vus': vus_n, 'boutons_touches': touches_n,
                  'pct': round(100 * touches_n / max(1, vus_n)), 'inatteignables': len(inatteignables),
                  'debordements_plafond': len(ecrans) >= 60, 'par_ecran': dict(par_ecran.most_common(30)), 'jamais_touches': jamais[:40]}
    return {'appareil': nom, 'secondes': round(time.time() - t0), 'chargement_s': chargement, 'actions': n, 'relances': relances,
            'etat_debut': etat0, 'etat_fin': etat1, 'boutons_distincts': len(touches_bouton), 'ecrans_vus': len(ecrans),
            'erreurs': list(vues.values()), 'blocages': blocages, 'sorties_du_jeu': sorties, 'invariants': dict(invar), 'debordements': deb,
            'sans_effet_pct': round(100 * sum(sans_effet.values()) / max(1, sum(touches_bouton.values()))),
            'boutons_jamais_efficaces': [f'{b} ({k}×)' for b, k in morts[:10]], 'couverture': couverture,
            'actions_lentes': [f'{ms} ms : {a}' for ms, a in sorted(lentes, reverse=True)[:8]],
            'plus_touches': touches_bouton.most_common(10), 'ecran': APPAREILS[nom]['viewport'],
            'routes': {'servis': jr['servis'], 'manquants': jr['manquants'][:10]}, 'visites': visites_r}


def format_ecran(t):
    m = re.match(r'^\s*(\d{3,4})\s*[x×X*]\s*(\d{3,4})\s*$', str(t))
    if not m: raise SystemExit(f'format d\'écran illisible : {t} (attendu 1280x800)')
    return {'width': int(m.group(1)), 'height': int(m.group(2))}


async def principal():
    o = args(); R = charger(o)
    R['_images'] = int(o['images'] if o['images'] is not None else R.get('images', 0) or 0)
    for nom in ('telephone', 'ordinateur'):
        f = o[nom] or R.get(nom)
        if f: APPAREILS[nom] = dict(APPAREILS[nom], viewport=format_ecran(f))
    sortie = o['sortie'] or os.path.join('/tmp', 'singe-' + R['jeu']); os.makedirs(sortie, exist_ok=True)
    res = []
    for nom in o['appareils'].split(','):
        nom = nom.strip().replace('é', 'e')
        if nom in APPAREILS: continue
        f = un_format(nom)  # formats communs (appareils.py) : mac, mac-large, mac@1, 1000x700@2…
        if f is None: raise SystemExit(f"appareil inconnu : {nom} (telephone, ordinateur, ou format commun : {connus()})")
        APPAREILS[nom] = contexte(f)
    # verrou machine (verrou.py) : avec les autres robots, jamais pendant un banc (il fausserait ses mesures)
    with verrou.tenir('robot', f"singe {R['jeu']}", True, float(o['attente_max'] or 1800), actif=not o['sans_verrou']):
        async with async_playwright() as p:
            for nom in o['appareils'].split(','):
                nom = nom.strip().replace('é', 'e')
                res.append(await un_appareil(p, R, nom, o['secondes'], o['graine'], sortie, couvrir=bool(o['couvrir'] or R.get('couvrir')), max_actions=o['actions']))
    rap = {'jeu': R['jeu'], 'graine': o['graine'], 'appareils': res}
    json.dump(rap, open(os.path.join(sortie, 'singe.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    grave = 0
    for r in res:
        manques = [k for k, v in r['visites'].items() if v['obligatoire'] and not v['vu'] and not v.get('non_tente')]
        g = len(r['erreurs']) + len(r['blocages']) + len(r['invariants']) + len(r['routes']['manquants']) + len(manques); grave += g
        print(f"{'ÉCHEC' if g else 'OK   '} {R['jeu']} · {r['appareil']} : {r['actions']} actions en {r['secondes']} s, {r['boutons_distincts']} boutons, "
              f"{r['ecrans_vus']} écrans · état {r['etat_debut']} → {r['etat_fin']} · {len(r['erreurs'])} erreur(s), {len(r['blocages'])} blocage(s), "
              f"{len(r['invariants'])} invariant(s) · clics sans effet {r['sans_effet_pct']} %")
        if r['routes']['servis'] or r['routes']['manquants']:
            print(f"   {resume_routes(dict(r['routes'], vides=0, refuses=0))}")
        for e in r['erreurs'][:5]: print(f"   erreur ×{e['fois']} : {e['erreur'][:160]}  (après : {' → '.join(x for x in e['apres'][-3:] if x)}){' dans ' + ', '.join(e['dans']) if e.get('dans') else ''} [{e['capture']}]")
        for k, v in r['visites'].items():
            f = (' ; forcé : ' + ', '.join(v['forcages'])) if v['forcages'] else ''
            print(f"   visite « {k} » : " + (f"✓ {v['entrees']} fois, {v['actions']} actions, {v['secondes']} s (dès l'action {v['premiere_action']}), {v['erreurs']} erreur(s){f}"
                                         if v['vu'] else f"✗ jamais atteinte{' — forçage non tenté (moins de « apres » actions) : avertissement' if v.get('non_tente') else ' (obligatoire)' if v['obligatoire'] else ''}{f}"))
        for b in r['blocages'][:3]: print(f"   blocage : {b['quoi']} sur « {b['ecran']} » ; sous le doigt : {b['sous_le_doigt']} [{b['capture']}]")
        for x in r['sorties_du_jeu'][:3]: print(f'   sorti du jeu vers {x}')
        for k, v in list(r['invariants'].items())[:3]: print(f'   invariant ×{v} : {k}')
        for k, v in list(r['debordements'].items())[:4]: print(f'   coupé sur « {k} » : {v}')
        if r['boutons_jamais_efficaces']: print('   jamais d\'effet : ' + ', '.join(r['boutons_jamais_efficaces'][:6]))
        cv = r['couverture']
        print(f"   couverture ({cv['mode']}) : {cv['boutons_touches']}/{cv['boutons_vus']} boutons touchés ({cv['pct']} %) sur {cv['ecrans']} écrans"
              + (' ; jamais touchés : ' + ', '.join(cv['jamais_touches'][:6]) if cv['jamais_touches'] else ''))
    print('rapport :', os.path.join(sortie, 'singe.json'))
    return 1 if grave else 0


if __name__ == '__main__':
    sys.exit(asyncio.run(principal()))
