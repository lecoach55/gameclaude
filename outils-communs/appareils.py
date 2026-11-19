#!/usr/bin/env python3
"""Formats d'écran communs : les VRAIES fenêtres du Mac de Victor, pour tous les outils (banc, captures, singe, hors ligne).

Pourquoi (19/11) : depuis la décision du 18/11, la cible est le MacBook Pro Intel de Victor. Ses mesures réelles (🧪, documents
mesures_* de 5 jeux, 15-17/11) montrent qu'il joue dans l'APP CLAUDE (panneau d'artefact), dans des fenêtres ÉTROITES à dpr 2 :
449×670, 483×755, 771×755, 912×755 — jamais le 1280×800 à dpr 1 que les outils appelaient « ordinateur ». À 483 px de large,
une page qui bascule en disposition téléphone sous 600-700 px montre à Victor sa version téléphone ; à dpr 2, un canvas plein
écran de 912×755 coûte 2,75 Mpx par image (2,7× le 1280×800 @1 des bancs).

Noms (utilisables partout : --appareils mac,mac-large · "appareils": ["mac", "telephone"] · {"ordi": "mac-large@1"} ·
{"ordi": {"comme": "mac", "cpu": 4}} · format libre « 1000x700@2 ») :
  mac          483×755 @2  panneau d'artefact de l'app Claude (le plus fréquent, 15-16/11 : Cage, Hameau, Valdragon)
  mac-etroit   449×670 @2  panneau étroit (toutes les mesures du 17/11 : Cage, Hameau, Trône, Valdragon)
  mac-moyen    771×755 @2  panneau élargi (Cage, Valdragon 15/11)
  mac-large    912×755 @2  panneau large (Trône de Braise 16/11)
  mac-plein   1440×790 @2  fenêtre agrandie sur l'écran 1440×900 (estimé : jamais mesuré)
  ordinateur  1280×800 @1  format d'atelier historique (gardé : références et bancs existants)
  telephone    390×780 @1  défaut historique du banc et des captures (souris)
  telephone-tactile 390×844 @1 tactile (singe, hors ligne --telephone)
Suffixe @1 / @2 : même disposition, autre densité (« mac@1 » = 4× moins de pixels : banc rapide en rendu logiciel, mêmes règles CSS).

usage :
  python3 outils-communs/appareils.py                         tableau des formats
  python3 outils-communs/appareils.py apercu <page.html | reglages.json> [--formats mac-etroit,mac,mac-moyen,mac-large]
          [--pret "cond JS"] [--entree "js"] [--secondes 3] [--sortie /tmp/apercu-<jeu>] [--construire] [--json f] [--sans-verrou]
     → ouvre la page dans chaque format et dit ce que VOIT Victor : planche côte à côte (planche.png) et, par format,
       les règles @media actives (« (max-width: 700px) » = disposition téléphone sur le Mac), les pixels réellement dessinés
       par les canvas (Mpx par image, coût du rendu), les contenus coupés (sonde) et les erreurs. Réglages : ceux du banc /
       des captures / du hors ligne ("fichier" ou "dossier"+"page", "pret", "entree", "stockage", "routes").
En Python : from appareils import resoudre, contexte, FORMATS
  resoudre(cfg.get('appareils'), demande='mac,telephone', defaut={...}) → {nom: {largeur, hauteur, dpr, [tactile, cpu, …]}}
  contexte(app) → arguments de nav.new_context (viewport, device_scale_factor, has_touch, is_mobile)
"""
import asyncio, json, os, re, sys, time

ICI = os.path.dirname(os.path.abspath(__file__))
RAC = os.path.dirname(ICI)

# Source : mesures_* (champ « ecran », testkit.js) lues le 19/11 sur Cage & Gloire, Hameau, Trône de Braise, Valdragon (11 mesures,
# Intel Iris Plus, app Claude pour Mac). Mettre à jour si les mesures réelles montrent d'autres fenêtres.
FORMATS = {
    'mac':               {'largeur': 483, 'hauteur': 755, 'dpr': 2, 'note': "panneau d'artefact de l'app Claude (le plus fréquent 15-16/11)"},
    'mac-etroit':        {'largeur': 449, 'hauteur': 670, 'dpr': 2, 'note': 'panneau étroit (mesures du 17/11)'},
    'mac-moyen':         {'largeur': 771, 'hauteur': 755, 'dpr': 2, 'note': 'panneau élargi (15/11)'},
    'mac-large':         {'largeur': 912, 'hauteur': 755, 'dpr': 2, 'note': 'panneau large (16/11)'},
    'mac-plein':         {'largeur': 1440, 'hauteur': 790, 'dpr': 2, 'note': 'fenêtre agrandie (estimée, jamais mesurée)'},
    'ordinateur':        {'largeur': 1280, 'hauteur': 800, 'dpr': 1, 'note': "format d'atelier historique"},
    'telephone':         {'largeur': 390, 'hauteur': 780, 'dpr': 1, 'note': 'défaut historique du banc et des captures'},
    'telephone-tactile': {'largeur': 390, 'hauteur': 844, 'dpr': 1, 'tactile': True, 'note': 'téléphone tactile (singe)'},
}
APERCU_DEFAUT = 'mac-etroit,mac,mac-moyen,mac-large'
_LIBRE = re.compile(r'^\s*(\d{3,4})\s*[x×X*]\s*(\d{3,4})\s*(?:@\s*([\d.]+))?\s*$')


def un_format(spec):
    """'mac' · 'mac@1' · '1000x700' · '1000x700@2' · 'téléphone' → dict (copie), ou None si inconnu."""
    s = str(spec).strip().lower().replace('é', 'e').replace('è', 'e')
    m = _LIBRE.match(s)
    if m:
        try:
            d = {'largeur': int(m.group(1)), 'hauteur': int(m.group(2)), 'dpr': float(m.group(3) or 1)}
        except ValueError:  # « 1000x700@. »
            return None
    else:
        nom, _, dpr = s.partition('@')
        if nom.strip() not in FORMATS:
            return None
        d = dict(FORMATS[nom.strip()])
        d.pop('note', None)
        if dpr:
            try:
                d['dpr'] = float(dpr)
            except ValueError:
                return None
    if float(d.get('dpr', 1)) <= 0:
        return None
    if float(d['dpr']).is_integer():
        d['dpr'] = int(d['dpr'])
    return d


def connus():
    return ', '.join(FORMATS) + ' (suffixe @1/@2, ou LxH@d)'


def _une_entree(nom, v):
    """Valeur d'une entrée "appareils" des réglages : dict (tel quel, ou {"comme": "mac", …} complété), chaîne (nom de format), None/{} (nom du format)."""
    if isinstance(v, str):
        d = un_format(v)
        if d is None:
            raise ValueError(f'appareil « {nom} » : format inconnu « {v} » (connus : {connus()})')
        return d
    if not v:  # {"mac": {}} ou {"mac": null} : le format du même nom
        d = un_format(nom)
        return {} if d is None else d  # nom commun (ordinateur, mac…) : son format ; nom inconnu : valeurs par défaut de l'outil, comme avant
    if isinstance(v, dict):
        if v.get('comme'):
            d = un_format(v['comme'])
            if d is None:
                raise ValueError(f'appareil « {nom} » : "comme" inconnu « {v["comme"]} » (connus : {connus()})')
            d.update({k: x for k, x in v.items() if k != 'comme'})
            return d
        return dict(v)
    raise ValueError(f'appareil « {nom} » : réglage illisible ({v!r})')


def resoudre(cfg_appareils=None, demande=None, defaut=None):
    """Appareils à utiliser, dans l'ordre : {nom: réglage}.
    cfg_appareils : "appareils" des réglages (dict nom→réglage|format, ou liste de noms) ; absent → defaut (comportement historique).
    demande : --appareils « a,b » : chaque nom est pris dans les réglages, sinon parmi les formats communs (mac, mac-large@1, 1000x700@2…).
    Lève ValueError (message en français) pour un nom inconnu — avant : filtre vide en silence (banc sans aucune mesure)."""
    if isinstance(cfg_appareils, (list, tuple)):
        base = {}
        for n in cfg_appareils:
            base[str(n)] = _une_entree(str(n), str(n))
    elif isinstance(cfg_appareils, dict) and cfg_appareils:
        base = {k: _une_entree(k, v) for k, v in cfg_appareils.items()}
    else:
        base = {k: dict(v) for k, v in (defaut or {'telephone': un_format('telephone')}).items()}
    if not demande:
        return base
    noms = [n.strip() for n in (demande.split(',') if isinstance(demande, str) else demande) if str(n).strip()]
    if not noms:
        raise ValueError(f'--appareils vide : « {demande} »')
    res = {}
    for n in noms:
        cle = n if n in base else n.replace('é', 'e') if n.replace('é', 'e') in base else None
        if cle:
            res[cle] = base[cle]
            continue
        d = un_format(n)
        if d is None:
            raise ValueError(f"appareil inconnu : « {n} » (réglages : {', '.join(base) or 'aucun'} ; formats communs : {connus()})")
        res[n] = d
    return res


def contexte(app, tactile=None):
    """Arguments de nav.new_context pour un appareil résolu."""
    t = bool(app.get('tactile')) if tactile is None else tactile
    return dict(viewport={'width': int(app.get('largeur', 390)), 'height': int(app.get('hauteur', 780))},
                device_scale_factor=float(app.get('dpr', 1)), has_touch=t, is_mobile=t)


def mpx(app):
    return app.get('largeur', 390) * app.get('hauteur', 780) * float(app.get('dpr', 1)) ** 2 / 1e6


def tableau():
    print('Formats d\'écran communs (outils-communs/appareils.py) :')
    for n, f in FORMATS.items():
        print(f"  {n:<18} {f['largeur']:>4}×{f['hauteur']:<4} @{f['dpr']}{' tactile' if f.get('tactile') else '        '}  {mpx(f):5.2f} Mpx plein écran  {f['note']}")
    print("Suffixe @1/@2 (même disposition, autre densité) ; format libre LxH@d. Aperçu : appareils.py apercu <page|reglages.json>")


# ---------- aperçu : ce que voit Victor dans chaque format ----------
INFOS_JS = r"""()=>{
 const actives=[],vues=new Set();
 const visite=(l,src)=>{for(const r of l){if(r.media&&r.conditionText!==undefined&&r.cssRules){const c=r.conditionText||r.media.mediaText;
   if(c&&!vues.has(c)){vues.add(c);if(/width|height|orientation|pointer|hover|aspect/.test(c)&&matchMedia(c).matches)actives.push(c);}}
   if(r.cssRules)try{visite(r.cssRules,src)}catch(e){}}};
 for(const s of document.styleSheets){try{visite(s.cssRules)}catch(e){}}
 const cv=[...document.querySelectorAll('canvas')].map(c=>{const b=c.getBoundingClientRect();return {l:c.width,h:c.height,css:Math.round(b.width)+'×'+Math.round(b.height),vis:b.width>0&&b.height>0}}).filter(c=>c.vis&&c.l*c.h>4096);
 const de=document.documentElement;
 return {ecran:innerWidth+'×'+innerHeight+' @'+devicePixelRatio,actives,media_total:vues.size,canvas:cv,
   mpx:+(cv.reduce((a,c)=>a+c.l*c.h,0)/1e6).toFixed(2),defile_x:de.scrollWidth>innerWidth+2?de.scrollWidth-innerWidth:0,
   tactile:matchMedia('(pointer:coarse)').matches};}"""


def _args_apercu(argv):
    o = {'pos': [], 'formats': APERCU_DEFAUT, 'pret': None, 'entree': None, 'secondes': 3.0, 'sortie': None, 'construire': False, 'json': None,
         'sans_verrou': False, 'attente_max': 1800.0}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a in ('--construire', '--sans-verrou'):
            o[a[2:].replace('-', '_')] = True
        elif a in ('-h', '--help'):
            print(__doc__); sys.exit(0)
        elif a.startswith('--'):
            k = a[2:].replace('-', '_')
            if k not in o or i + 1 >= len(argv):
                sys.exit(f'appareils.py apercu : option inconnue ou sans valeur : {a}')
            o[k] = float(argv[i + 1]) if k in ('secondes', 'attente_max') else argv[i + 1]; i += 1
        else:
            o['pos'].append(a)
        i += 1
    if not o['pos']:
        print(__doc__); sys.exit(2)
    return o


async def _apercu(o, formats, sortie):
    from playwright.async_api import async_playwright
    import hors_ligne as HL
    from routes import brancher as brancher_routes
    from sonde import debordements, resume
    cfg, fichier, dossier, page = HL.cible({'pos': o['pos'], 'construire': o['construire']})
    import atelier
    if fichier:
        if not os.path.exists(fichier):
            sys.exit(f'appareils.py apercu : page absente : {fichier}' + (' (--construire ?)' if cfg.get('construire') else ''))
        # servie en HTTP local et non en file:// : les feuilles de style file:// sont illisibles (SecurityError) → @media invisibles
        dossier, page = os.path.dirname(os.path.abspath(fichier)), os.path.basename(fichier)
    url = atelier.serveur(dossier).rstrip('/') + '/' + page.lstrip('/')
    pret = o['pret'] or cfg.get('pret')
    entree = o['entree'] if o['entree'] is not None else cfg.get('entree')
    res = {}
    async with async_playwright() as p:
        from atelier import ARGS
        nav = await p.chromium.launch(args=ARGS)
        for nom, app in formats.items():
            r = {'format': f"{app['largeur']}×{app['hauteur']} @{app.get('dpr', 1)}", 'erreurs': []}
            t0 = time.time()
            ctx = await nav.new_context(**contexte(app))
            try:
                await brancher_routes(ctx, cfg.get('routes'), base=RAC)
                if cfg.get('stockage'):
                    await ctx.add_init_script('try{localStorage.clear();' + ''.join(
                        f'localStorage.setItem({json.dumps(k)},{json.dumps(v if isinstance(v, str) else json.dumps(v))});' for k, v in cfg['stockage'].items()) + '}catch(e){}')
                pg = await ctx.new_page()
                pg.on('pageerror', lambda e, r=r: r['erreurs'].append(str(e)[:240]))
                await pg.goto(url, wait_until='load', timeout=180000)
                if pret:
                    try:
                        await pg.wait_for_function('()=>{try{return !!(' + pret + ')}catch(e){return false}}', timeout=float(cfg.get('pret_max_s', 120)) * 1000, polling=200)
                    except Exception:
                        r['erreurs'].append(f'jamais prêt : {pret[:80]}')
                if entree:
                    try:
                        await HL.entrer(pg, entree)
                    except Exception as e:
                        r['erreurs'].append(f'entree : {str(e)[:160]}')
                await pg.wait_for_timeout(o['secondes'] * 1000)
                r.update(await pg.evaluate(INFOS_JS))
                try:
                    d = await debordements(pg)
                    r['coupes'] = len(d); r['coupes_detail'] = resume(d, 4) if d else ''
                except Exception as e:
                    r['coupes'] = None; r['erreurs'].append(f'sonde : {str(e)[:120]}')
                r['image'] = os.path.join(sortie, f'{nom}.png')
                await pg.screenshot(path=r['image'], scale='css')  # pixels CSS : la planche compare les dispositions, pas la finesse
            except Exception as e:
                r['erreurs'].append(f'chargement : {str(e)[:200]}')
            finally:
                r['secondes'] = round(time.time() - t0, 1)
                await ctx.close()
            res[nom] = r
        await nav.close()
    atelier.fermer(dossier)  # serveur arrêté à la fin (le dossier servi peut être large : page construite dans /home/claude)
    return cfg, res


def planche(res, chemin, hauteur_max=520):
    from PIL import Image, ImageDraw
    ims = [(n, Image.open(r['image']).convert('RGB')) for n, r in res.items() if r.get('image') and os.path.exists(r['image'])]
    if not ims:
        return None
    k = min(1.0, hauteur_max / max(im.height for _, im in ims))
    ims = [(n, im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))))) for n, im in ims]
    W = sum(im.width for _, im in ims) + 12 * (len(ims) + 1); H = max(im.height for _, im in ims) + 46
    pl = Image.new('RGB', (W, H), (34, 34, 38)); d = ImageDraw.Draw(pl); x = 12
    for n, im in ims:
        r = res[n]
        d.text((x, 6), f"{n}  {r['format']}".replace('×', 'x'), fill=(235, 235, 235))
        d.text((x, 20), f"{r.get('mpx', 0)} Mpx" + (f" · @media {len(r.get('actives') or [])}" if r.get('actives') else '') + (' · ERREUR' if r['erreurs'] else ''), fill=(170, 200, 255))
        pl.paste(im, (x, 38)); x += im.width + 12
    pl.save(chemin); return chemin


def apercu(argv):
    o = _args_apercu(argv)
    try:
        formats = resoudre(None, o['formats'], {})
    except ValueError as e:
        sys.exit(f'appareils.py apercu : {e}')
    pa = os.path.abspath(o['pos'][0])
    rel = os.path.relpath(pa, RAC).split(os.sep) if pa.startswith(RAC + os.sep) else []
    base = rel[0] if len(rel) > 1 else os.path.splitext(os.path.basename(pa))[0]  # nom du jeu (dossier du dépôt) plutôt que « index »
    sortie = o['sortie'] or os.path.join('/tmp', 'apercu-' + base)
    os.makedirs(sortie, exist_ok=True)
    jeton = None
    if not o['sans_verrou']:
        import verrou
        jeton = verrou.prendre('robot', f'apercu {base}', True, o['attente_max'])[0]
    try:
        cfg, res = asyncio.run(_apercu(o, formats, sortie))
    finally:
        if jeton:
            jeton.close()
    pl = planche(res, os.path.join(sortie, 'planche.png'))
    jeu = cfg.get('jeu') or base
    print(f'Aperçu {jeu} — ce que voit Victor sur son Mac (app Claude, dpr 2) :')
    grave = 0
    for n, r in res.items():
        grave += bool(r['erreurs'])
        act = r.get('actives') or []
        print(f"  {n:<11} {r['format']:<13} canvas {r.get('mpx', '?')} Mpx/image · @media actives : {', '.join(act) if act else 'aucune'}"
              + (f" · défile en largeur +{r['defile_x']} px" if r.get('defile_x') else '')
              + (f" · {r['coupes']} contenu(s) coupé(s) : {r['coupes_detail']}" if r.get('coupes') else '')
              + (f" · ERREURS : {' | '.join(r['erreurs'][:2])}" if r['erreurs'] else '') + f"  ({r['secondes']} s)")
    largeurs = [r.get('actives') or [] for n, r in res.items() if n.startswith('mac')]
    if len({tuple(a) for a in largeurs}) > 1:
        print('  ⚠ la disposition change selon la fenêtre du Mac (règles @media différentes) : vérifier chaque format sur la planche')
    if any(re.search(r'max-width:\s*(\d+)', c) and int(re.search(r'max-width:\s*(\d+)', c).group(1)) >= 440 for a in largeurs for c in a):
        print('  ⚠ une règle « max-width » de disposition téléphone s\'applique dans une fenêtre du Mac : Victor y voit la version téléphone')
    if pl:
        print(f'  planche : {pl}')
    out = {'jeu': jeu, 'date': time.strftime('%Y-%m-%d %H:%M'), 'formats': res, 'planche': pl}
    json.dump(out, open(o['json'] or os.path.join(sortie, 'apercu.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return 1 if grave else 0


if __name__ == '__main__':
    sys.path.insert(0, ICI)
    a = sys.argv[1:]
    if not a:
        tableau(); sys.exit(0)
    if a[0] in ('-h', '--help'):
        print(__doc__); sys.exit(0)
    if a[0] == 'apercu':
        sys.exit(apercu(a[1:]))
    sys.exit(f'appareils.py : commande inconnue « {a[0]} » (rien = tableau, apercu <page>)')
