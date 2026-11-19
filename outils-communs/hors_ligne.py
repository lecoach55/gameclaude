#!/usr/bin/env python3
"""Hors ligne commun : la page démarre-t-elle SANS RÉSEAU, avec SES polices ? (tout jeu, sans réglage)

usage :
  python3 outils-communs/hors_ligne.py page.html                     page ouverte par double-clic (file://), réseau coupé
  python3 outils-communs/hors_ligne.py <jeu>/outils/banc.json        mêmes réglages que le banc / les captures / le singe :
                                                                     "fichier" ou "dossier"+"page", "construire", "stockage", "pret", "entree"
options : --pret "window.G&&G.ok" (condition JS de démarrage, sinon celle des réglages, sinon : document chargé)
          --entree "demarrer()" · --secondes 6 (attente après le démarrage : chargements tardifs, polices)
          --ecran 1280x800 (défaut : ordinateur 1280×800, cible de Victor) · --telephone (390×844 tactile)
          --tolerer hote1,hote2 (adresses externes admises : la page a un repli) · --json sortie.json · --strict · --construire
          --polices (détail de toutes les familles vues) · --sans-verrou · --attente-max 1800
          --ignorer-console "motif" (expression régulière : console.error voulus hors ligne, ex. « nuage absent »)
Non vu : le texte dessiné dans un canvas (ctx.font) ; sa police Google reste visible dans les requêtes externes.
Verrou machine (verrou.py) : passe avec les autres robots, jamais pendant un banc.
Ce qu'il relève (réseau COUPÉ : seules file:, data:, blob: et le serveur local répondent ; Three.js du CDN n'est PAS servi en local,
exprès : c'est ce que voit Victor sans réseau) :
  · requêtes externes tentées, par hôte (polices Google, CDN, images…) ;
  · polices de REPLI : familles demandées par le CSS du texte affiché qui ne sont ni chargées par la page ni présentes sur la
    machine (le texte s'affiche alors en Times / Arial) ; polices déclarées en échec ;
  · fichiers LOCAUX introuvables (script, image, page voisine oubliés par la construction) : comptés comme erreurs ;
  · erreurs JS, démarrage (condition "pret" atteinte ou non).
Code de sortie : 0 démarre sans erreur (réserves : externes, repli, dites) · 1 erreur JS ou jamais prêt (--strict : aussi requête
externe non tolérée, police de repli, police en échec) · 2 page ou réglages illisibles.
Réparer les polices : python3 outils-communs/polices.py <page construite> (intègre les polices Google dans la page).
"""
import asyncio, json, os, re, subprocess, sys, time, urllib.parse

ICI = os.path.dirname(os.path.abspath(__file__))
RAC = os.path.dirname(ICI)
sys.path.insert(0, ICI)

GENERIQUES = {'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace',
              'ui-rounded', 'emoji', 'math', 'fangsong', '-apple-system', 'blinkmacsystemfont', 'inherit', 'initial', 'unset', 'revert',
              'revert-layer', ''}
# Familles livrées avec macOS (le Mac de Victor) : jamais comptées comme repli. Toute autre famille non intégrée à la page est un repli
# chez Victor, même si le bac à sable l'a (Inter, Roboto, Noto, DejaVu… y sont installées : noté « bac à sable seulement »).
SYSTEME = {'helvetica', 'helvetica neue', 'arial', 'arial narrow', 'arial black', 'times', 'times new roman', 'georgia', 'courier',
           'courier new', 'menlo', 'monaco', 'sf pro', 'sf pro text', 'sf pro display', 'sf mono', 'sf compact', 'new york',
           'apple color emoji', 'verdana', 'tahoma', 'trebuchet ms', 'palatino', 'book antiqua', 'baskerville', 'optima',
           'futura', 'avenir', 'avenir next', 'avenir next condensed', 'gill sans', 'didot', 'hoefler text', 'american typewriter',
           'lucida grande', 'impact', 'comic sans ms', 'iowan old style', 'charter', 'big caslon', 'copperplate', 'papyrus', 'skia',
           'rockwell', 'symbol', 'cochin', 'marker felt', 'chalkboard', 'zapfino', 'luminari', 'herculanum', 'trattatello',
           'phosphate', 'superclarendon', 'savoye let', 'snell roundhand', 'bradley hand', 'noteworthy', 'helvetica neue condensed'}

POLICES_JS = r"""()=>{
 const premiere=s=>(s||'').split(',').map(x=>x.trim().replace(/^["']|["']$/g,'')).filter(Boolean);
 const decl={};for(const f of document.fonts){const n=f.family.replace(/^["']|["']$/g,'');(decl[n]=decl[n]||[]).push(f.status);}
 const cv=document.createElement('canvas').getContext('2d'),T='mmmmmmmmmmlli WQ@#é 0123';
 const largeur=f=>{cv.font='72px '+f;return cv.measureText(T).width;};
 const dispo=n=>['monospace','serif','sans-serif'].some(g=>largeur(`"${n}",${g}`)!==largeur(g));
 const vus={};const tw=document.createTreeWalker(document.body||document.documentElement,NodeFilter.SHOW_TEXT);let k=0,t;
 while((t=tw.nextNode())&&k<20000){k++;if(!t.nodeValue.trim())continue;const e=t.parentElement;if(!e)continue;
  const r=e.getBoundingClientRect();if(!r.width||!r.height)continue;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||+cs.opacity===0)continue;
  const pile=premiere(cs.fontFamily);const p=pile[0]||'';const v=vus[p]=vus[p]||{n:0,pile:pile.slice(0,4).join(', '),ex:''};v.n++;
  if(!v.ex)v.ex=(e.id?'#'+e.id:e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.split(' ')[0]:''))+' « '+t.nodeValue.trim().slice(0,30)+' »';}
 // familles demandées par les feuilles de style (même si aucun texte affiché ne les utilise encore : titres d'un autre écran)
 const css=new Set();for(const sh of document.styleSheets){let rs;try{rs=sh.cssRules}catch(e){continue}
  const racine=getComputedStyle(document.documentElement),resoudre=f=>{const m=/^var\(\s*(--[\w-]+)/.exec(f);return m?premiere(racine.getPropertyValue(m[1]))[0]||'':f;};
  const parcours=l=>{for(const r of l){if(r.style&&r.style.fontFamily&&!(r instanceof CSSFontFaceRule))premiere(r.style.fontFamily).slice(0,1).map(resoudre).forEach(x=>x&&css.add(x));
   if(r.cssRules)parcours(r.cssRules)}};parcours(rs)}
 const fams={};for(const n of new Set([...Object.keys(vus),...css])){if(!n)continue;const st=decl[n]||[];
  fams[n]={texte:vus[n]?vus[n].n:0,pile:vus[n]?vus[n].pile:'',ex:vus[n]?vus[n].ex:'',declaree:st.length,chargee:st.includes('loaded'),
   echec:st.length>0&&st.every(s=>s==='error'),dispo:dispo(n)};}
 return fams;}"""


def fn(code):
    c = code.strip()
    return c if c.startswith(('()', 'async', 'function')) else '()=>{' + c + '}'


async def entrer(pg, entree):
    """"entree" du banc (JS) ou du singe (liste : texte ou sélecteur à cliquer, {"js": …}, {"attendre": ms})."""
    if isinstance(entree, str):
        await pg.evaluate(fn(entree)); return
    for x in entree:
        if isinstance(x, dict):
            if x.get('js'):
                await pg.evaluate(fn(x['js']))
            if x.get('attendre'):
                await pg.wait_for_timeout(float(x['attendre']))
        elif isinstance(x, str):
            loc = pg.locator(x) if x[:1] in '#.[' else pg.get_by_text(x, exact=False)
            await loc.first.click(timeout=15000)


def lire_args(argv):
    o = {'ignorer_console': None, 'sans_verrou': False, 'attente_max': 1800.0, 'pos': [], 'pret': None, 'entree': None, 'secondes': 6.0, 'ecran': '1280x800', 'telephone': False, 'tolerer': [],
         'json': None, 'strict': False, 'construire': False, 'polices': False}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a in ('--pret', '--entree', '--secondes', '--ecran', '--tolerer', '--json', '--attente-max', '--ignorer-console'):
            v = argv[i + 1]; i += 1
            o[a[2:].replace('-', '_')] = float(v) if a in ('--secondes', '--attente-max') else [h.strip() for h in v.split(',') if h.strip()] if a == '--tolerer' else v
        elif a in ('--strict', '--construire', '--telephone', '--polices', '--sans-verrou'):
            o[a[2:].replace('-', '_')] = True
        elif a in ('-h', '--help'):
            print(__doc__); sys.exit(0)
        else:
            o['pos'].append(a)
        i += 1
    return o


def cible(o):
    """→ (cfg, chemin du fichier ou None, dossier servi ou None, page)"""
    if not o['pos']:
        print(__doc__); sys.exit(2)
    a = o['pos'][0]
    p = a if os.path.isabs(a) else os.path.join(os.getcwd(), a)
    if not os.path.exists(p) and os.path.exists(os.path.join(RAC, a)):
        p = os.path.join(RAC, a)
    if not os.path.exists(p):
        sys.exit(f'hors_ligne.py : introuvable : {a}')
    cfg = {}
    if p.endswith('.json'):
        try:
            cfg = json.load(open(p, encoding='utf-8'))
        except ValueError as e:
            print(f'hors_ligne.py : réglages illisibles : {e}', file=sys.stderr); sys.exit(2)
        if o['construire'] and cfg.get('construire'):
            r = subprocess.run(cfg['construire'], shell=True, cwd=RAC)
            if r.returncode:
                sys.exit(f'hors_ligne.py : construction en échec (code {r.returncode})')
        if cfg.get('fichier'):
            f = cfg['fichier'] if os.path.isabs(cfg['fichier']) else os.path.join(RAC, cfg['fichier'])
            return cfg, f, None, None
        d = cfg.get('dossier')
        if not d:
            print('hors_ligne.py : réglages sans "fichier" ni "dossier"', file=sys.stderr); sys.exit(2)
        return cfg, None, d if os.path.isabs(d) else os.path.join(RAC, d), cfg.get('page', 'index.html')
    return cfg, p, None, None


async def verifier(o):
    from playwright.async_api import async_playwright
    cfg, fichier, dossier, page = cible(o)
    pret = o['pret'] or cfg.get('pret')
    entree = o['entree'] or cfg.get('entree')
    if fichier:
        if not os.path.exists(fichier):
            print(f'hors_ligne.py : page absente : {fichier}' + (' (--construire ?)' if cfg.get('construire') else ''), file=sys.stderr)
            return 2, {}
        url = 'file://' + os.path.abspath(fichier)
        nom = os.path.relpath(fichier, RAC) if fichier.startswith(RAC) else fichier
    else:
        import atelier
        base = atelier.serveur(dossier)
        url = base.rstrip('/') + '/' + page.lstrip('/')
        nom = os.path.relpath(os.path.join(dossier, page), RAC)
    local = urllib.parse.urlsplit(url).netloc
    ext, refus = {}, []
    erreurs = []
    R = {'page': nom, 'url': url, 'jeu': cfg.get('jeu', ''), 'date': time.strftime('%Y-%m-%d %H:%M')}
    async with async_playwright() as p:
        nav = await p.chromium.launch()
        if o['telephone']:
            ctx = await nav.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=1)
        else:
            L, H = (int(x) for x in o['ecran'].lower().split('x'))
            ctx = await nav.new_context(viewport={'width': L, 'height': H})

        async def route(r):
            u = r.request.url
            sp = urllib.parse.urlsplit(u)
            if sp.scheme in ('file', 'data', 'blob', 'about') or (sp.netloc == local and local):
                await r.continue_(); return
            h = sp.netloc or sp.scheme
            e = ext.setdefault(h, {'n': 0, 'types': set(), 'ex': u[:140]})
            e['n'] += 1; e['types'].add(r.request.resource_type)
            await r.abort('internetdisconnected')
        await ctx.route('**/*', route)
        init = ''
        if cfg.get('stockage'):
            init += 'try{localStorage.clear();' + ''.join(f'localStorage.setItem({json.dumps(k)},{json.dumps(v if isinstance(v, str) else json.dumps(v))});'
                                                       for k, v in cfg['stockage'].items()) + '}catch(e){}'
        if cfg.get('init'):
            init += cfg['init'] + ';'
        if init:
            await ctx.add_init_script(init)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: erreurs.append(str(e)[:300]))
        ign = re.compile(o['ignorer_console']) if o['ignorer_console'] else None
        pg.on('console', lambda m: erreurs.append('console : ' + m.text[:240]) if m.type == 'error' and 'net::ERR' not in m.text
              and 'Failed to load resource' not in m.text and not (ign and ign.search(m.text)) else None)
        def echec_requete(rq):  # fichier LOCAL manquant (script, image, page voisine) : erreur ; les externes coupés exprès sont à part
            sp = urllib.parse.urlsplit(rq.url)
            if (sp.scheme == 'file' or (local and sp.netloc == local)) and not any(rq.url[:160] in e for e in erreurs):
                erreurs.append(f'fichier local introuvable : {rq.url[:160]} ({rq.resource_type})')
        pg.on('requestfailed', echec_requete)
        pg.on('response', lambda rp: erreurs.append(f'fichier local introuvable : {rp.url[:160]} (HTTP {rp.status})')
              if local and rp.status >= 400 and urllib.parse.urlsplit(rp.url).netloc == local
              and not any(rp.url[:160] in e for e in erreurs) else None)
        t0 = time.time()
        try:
            await pg.goto(url, wait_until='load', timeout=120000)
        except Exception as e:
            erreurs.append(f'chargement : {str(e)[:200]}')
        R['pret'] = True
        if pret:
            try:
                await pg.wait_for_function('()=>{try{return !!(' + pret + ')}catch(e){return false}}', timeout=float(cfg.get('pret_max_s', 120)) * 1000, polling=200)
            except Exception:
                R['pret'] = False
        R['demarrage_s'] = round(time.time() - t0, 1)
        if R['pret'] and entree:
            try:
                await entrer(pg, entree)
            except Exception as e:
                erreurs.append(f'entree : {str(e)[:200]}')
        await pg.wait_for_timeout(o['secondes'] * 1000)
        try:
            await pg.evaluate('document.fonts.ready.then(()=>1)')
            fams = await pg.evaluate(POLICES_JS)
        except Exception as e:
            fams = {}; erreurs.append(f'polices : {str(e)[:200]}')
        await nav.close()
    R['erreurs'] = erreurs
    R['externes'] = {h: {'n': e['n'], 'types': sorted(e['types']), 'ex': e['ex']} for h, e in sorted(ext.items(), key=lambda x: -x[1]['n'])}
    tol = [h for h in R['externes'] if any(h == t or h.endswith('.' + t) for t in o['tolerer'])]
    R['externes_non_tolerees'] = [h for h in R['externes'] if h not in tol]
    repli, echec = [], []
    for n, f in fams.items():
        bas = n.lower()
        if bas in GENERIQUES:
            continue
        if f['declaree'] and f['echec']:
            echec.append(n)
        if not f['declaree'] and bas not in SYSTEME:  # déclarée mais pas encore chargée = chargée à l'usage : pas un repli
            repli.append(n)
    R['polices'] = fams
    R['polices_repli'] = sorted(repli, key=lambda n: -fams[n]['texte'])
    R['polices_echec'] = sorted(echec)
    R['polices_chargees'] = sorted(n for n, f in fams.items() if f['chargee'])
    R['polices_a_l_usage'] = sorted(n for n, f in fams.items() if f['declaree'] and not f['chargee'] and not f['echec'])
    grave = bool(erreurs) or not R['pret']
    strict = bool(R['externes_non_tolerees'] or repli or echec)
    R['ok'] = not grave and not (o['strict'] and strict)
    return (1 if grave or (o['strict'] and strict) else 0), R


def afficher(R, o):
    print(f"hors ligne — {R['page']}  ({'prêt' if R['pret'] else 'JAMAIS PRÊT'} en {R['demarrage_s']} s, réseau coupé)")
    if R['externes']:
        print(f"  requêtes externes tentées : {sum(e['n'] for e in R['externes'].values())} vers {len(R['externes'])} hôte(s)")
        for h, e in R['externes'].items():
            print(f"    {'(toléré) ' if h not in R['externes_non_tolerees'] else ''}{h:<28} ×{e['n']:<3} {','.join(e['types'])}  {e['ex']}")
        if any('script' in e['types'] for h, e in R['externes'].items() if h in R['externes_non_tolerees']):
            print('    ⚠ des SCRIPTS externes n\'ont pas pu se charger : sans réseau (app de bureau, train), la page peut rester vide')
    else:
        print('  requêtes externes : aucune')
    fams = R['polices']
    if R['polices_repli']:
        print(f"  POLICES DE REPLI ({len(R['polices_repli'])}) : le texte s'affiche dans une autre police que prévu")
        for n in R['polices_repli']:
            f = fams[n]
            print(f"    {n:<24} {f['texte']:>4} texte(s) affiché(s)" + (' [bac à sable seulement : absente du Mac]' if f['dispo'] else '') + (f"  pile « {f['pile']} »  ex. {f['ex']}" if f['texte'] else '  (feuille de style, aucun texte affiché à cet écran)'))
        if any(h.startswith('fonts.g') for h in R['externes']):
            print('    → réparer : python3 outils-communs/polices.py <page construite>   (polices Google intégrées dans la page)')
    for n in R['polices_echec']:
        print(f'  police déclarée EN ÉCHEC : {n}')
    if R['polices_chargees']:
        print(f"  polices de la page chargées : {', '.join(R['polices_chargees'])}"
              + (f" (+ intégrées, pas encore utilisées : {', '.join(R['polices_a_l_usage'])})" if R['polices_a_l_usage'] else ''))
    if o['polices']:
        for n, f in sorted(fams.items(), key=lambda x: -x[1]['texte']):
            print(f"    · {n:<24} texte {f['texte']:>4}  déclarée {f['declaree']}  chargée {f['chargee']}  machine {f['dispo']}")
    if R['erreurs']:
        print(f"  ERREURS ({len(R['erreurs'])}) :")
        for e in R['erreurs'][:8]:
            print('    ' + e)
    else:
        print('  erreurs JS : aucune')
    print('verdict : ' + ('OK' if R['ok'] else 'ÉCHEC') + ('' if R['ok'] else (' (jamais prêt)' if not R['pret'] else ' (erreurs)' if R['erreurs'] else ' (--strict : externes ou polices)')))


def main(argv):
    o = lire_args(argv)
    jeton = None
    if not o['sans_verrou']:
        import verrou
        jeton = verrou.prendre('robot', f"hors_ligne {os.path.basename(o['pos'][0]) if o['pos'] else ''}", True, o['attente_max'])[0]
    try:
        code, R = asyncio.run(verifier(o))
    finally:
        if jeton:
            jeton.close()
    if not R:
        return code
    afficher(R, o)
    if o['json']:
        with open(o['json'], 'w', encoding='utf-8') as f:
            json.dump(R, f, ensure_ascii=False, indent=1)
    return code


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
