#!/usr/bin/env python3
"""Banc commun de fluidité : mêmes scènes, même graine, mesures au format de testkit.js, avant/après dans la même minute.

usage :
  python3 outils-communs/banc.py <jeu>/outils/banc.json [sortie.json]          une mesure de la version en cours
  python3 outils-communs/banc.py <jeu>/outils/banc.json --avant HEAD           AVANT (révision git) / APRÈS (dossier de travail), entrelacés
  python3 outils-communs/banc.py <jeu>/outils/banc.json --avant-dossier /tmp/ancien_jeu   (ou --avant-page fichier.html)
  python3 outils-communs/banc.py --comparer avant.json apres.json              compare deux sorties déjà faites
options : --tours N (défaut 2 avec --avant : A B B A A B… ; 1 sinon) · --scenes a,b · --appareils telephone,ordinateur
          --plafond (mode "reel" seulement : images plafonnées à 60/s comme un écran ; défaut : sans plafond)
          --cpu 4 (ralenti processeur, remplace celui des réglages) · --construire (lance "construire" aussi pour la version en cours)
          --seuil 10 (%, écart minimal signalé) · --strict (code 1 si une scène ralentit au-delà du seuil et du bruit)
          --reference mesures/x.json (compare à une mesure enregistrée : moins fiable, autre minute / autre machine)
          --sans-verrou (par défaut, un seul banc à la fois par machine : le second attend la fin du premier, en le disant)
          --attente-max 1800 (s : abandon, code 3, si l'autre banc ne finit pas)
Au fil de l'eau : <sortie>.partiel.json (ou /tmp/banc-<jeu>.partiel.json) est réécrit après chaque scène (mesures faites, temps
restant estimé, aussi affiché à l'écran) et effacé à la fin ; la sortie note la charge de la machine au début et à la fin.

Réglages (JSON ; chemins relatifs à la racine du dépôt ; toutes les clés sauf "scenes" sont facultatives) :
  "jeu": "trone-de-braise",
  "dossier": "trone-de-braise/jeu", "page": "index.html?graine=9"    dossier servi en HTTP local (port libre) + page à ouvrir
  "fichier": "chemin/page.html"                                      raccourci : dossier = celui du fichier, page = son nom
  "construire": "python3 trone-de-braise/jeu/build.py"               commande lancée depuis la racine (pour --avant : dans la copie)
  "appareils": {"ordinateur": {"largeur":1280,"hauteur":800,"cpu":1,"dpr":1}}   (défaut : telephone 390×780)
  "stockage": {"cle":"valeur"}  localStorage préparé avant le chargement
  "init": "window.TEST=1"       JS injecté avant le chargement     "graine": 7   Math.random à graine dès le chargement
  "pret": "window.G&&G.ok"      condition JS à attendre (défaut : document chargé)     "pret_ms": 800   attente en plus
  "entree": "demarrer()"        JS lancé une fois prêt (fonction fléchée ou instructions)
  "mode": "fige"                défaut : temps figé (horloge.js), le banc joue chaque image et attend le GPU → coût RÉEL d'une image,
                                 reproductible ; "reel" : img/s en temps réel (rAF ; le GPU logiciel n'y est pas compté, bruit ±30 %)
  "preparation": "reelle"       chargement et mise en scène en temps réel, seules les images mesurées sont figées
                                 (pour un jeu qui découpe son chargement selon performance.now : sinon il peut sembler bloqué)
  "images": 120, "budget_ms": 6000   mode figé : images mesurées par scène, arrêt après ce temps réel (8 images au moins)
  "scenes": [{"nom":"carte", "js":"…", "attente_ms":1500, "duree_ms":4000, "infos":"R3.info()", "seule":false}]
       js = instructions pour se placer dans la scène ; infos = expression JS dont le résultat est joint (appels, triangles…) ;
       seule = true : page neuve pour cette scène (sinon les scènes s'enchaînent dans la même page, dans l'ordre)
  "chronos": {"rendu_ms": "render()"}   instructions chronométrées (moyenne de 10 exécutions, en ms) après les scènes
  "seuil": 10                           % (défaut 10)
  "routes": {"https://exemple.cdn/lib/": "chemin/local/"}   adresses servies en local (routes.py ; chemins relatifs à la racine) ;
       par défaut Three.js sur jsDelivr/unpkg est TOUJOURS servi en local (copie téléchargée une fois) ; "routes": false pour couper
Sortie : {jeu, date, plafond, appareils:{nom:{scenes:{nom:{fps,bas1,pire,n,ms,med,p95,infos}}, chronos, chargement_ms, erreurs}}}
         + avec --avant : {avant, apres, ecarts} et un tableau lisible.  Valeurs RELATIVES (rendu logiciel) : comparer, pas conclure en absolu.
"""
import asyncio, json, os, re, sys, time, shutil, subprocess, tempfile, threading, functools, statistics, datetime
import http.server, socketserver
ICI = os.path.dirname(os.path.abspath(__file__))
RAC = os.path.dirname(ICI)
sys.path.insert(0, ICI)
from atelier import MESURE_JS, ARGS, ARGS_SANS_PLAFOND, HORLOGE  # noqa: E402
from routes import brancher as brancher_routes  # noqa: E402

# Mode « figé » (défaut) : horloge.js fige le temps et le hasard ; le banc joue lui-même chaque image et chronomètre son coût réel
# (rappels requestAnimationFrame + mise en page forcée + attente du GPU par lecture d'1 pixel de chaque canvas AFFICHÉ créé par le jeu).
# Même état d'une passe à l'autre (même nombre d'images, même hasard) → bruit bien plus faible qu'en temps réel.
AVANT_JEU_FIGE = """window.__vraiNow=performance.now.bind(performance);
(()=>{const vus=new WeakSet(),l=[];window.__bancCtxAffiches=()=>{for(let i=l.length-1;i>=0;i--){const c=l[i].deref();if(!c)l.splice(i,1);}return l.map(r=>r.deref()).filter(c=>c&&c.canvas&&c.canvas.isConnected&&c.canvas.width>0);};
const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){const c=g.call(this,t,...a);if(c&&!vus.has(c)){vus.add(c);l.push(new WeakRef(c));}return c;};})();"""
MESURE_FIGE_JS = """async([n,pas,budget])=>{const now=window.__vraiNow,px=new Uint8Array(4);
 const vis=window.__bancCtxAffiches?window.__bancCtxAffiches():[];const sync=()=>{for(const c of vis){try{if(c.readPixels){c.readPixels(0,0,1,1,c.RGBA,c.UNSIGNED_BYTE,px);}else if(c.getImageData){c.getImageData(0,0,1,1);}}catch(e){}}void document.body.offsetHeight;};
 sync();const a=[],debut=now();let tronque=false;for(let i=0;i<n;i++){const t0=now();window.__horloge.avancer(1,pas);sync();a.push(now()-t0);if(i%10==9)await new Promise(r=>setTimeout(r,0));if(now()-debut>budget&&i>=7){tronque=i+1<n;break;}}
 const s=a.slice().sort((x,y)=>x-y),m=a.reduce((x,y)=>x+y,0)/a.length,q=k=>s[Math.min(s.length-1,Math.floor(s.length*k))];
 return{fps:+(1000/m).toFixed(1),bas1:+(1000/q(.99)).toFixed(1),pire:+s[s.length-1].toFixed(1),n:a.length,ms:+m.toFixed(3),med:+q(.5).toFixed(3),p95:+q(.95).toFixed(3),canvas:vis.length,...(tronque?{tronque:true}:{})};}"""

APPAREILS_DEFAUT = {'telephone': {'largeur': 390, 'hauteur': 780, 'cpu': 1, 'dpr': 1}}
GRAINE_JS = "(()=>{let a=%d;Math.random=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})();"


def fn(js):
    """Instructions ou fonction fléchée → fonction pour pg.evaluate."""
    j = js.strip()
    if re.match(r'^(async\s*)?(\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>', j):
        return j
    return '()=>{' + j + '\n}'


class _Silencieux(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def servir(dossier):
    """Serveur HTTP sur un port LIBRE (jamais celui d'une autre conversation) ; renvoie (base, serveur)."""
    h = functools.partial(_Silencieux, directory=dossier)
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), h)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return f'http://127.0.0.1:{srv.server_address[1]}/', srv


def lieu(cfg, racine):
    """(dossier absolu à servir, page) d'après les réglages, pour une racine de dépôt donnée."""
    if cfg.get('fichier'):
        f = os.path.join(racine, cfg['fichier'])
        return os.path.dirname(f), os.path.basename(f) + cfg.get('parametres', '')
    return os.path.join(racine, cfg.get('dossier', '.')), cfg.get('page', 'index.html')


def construire(cfg, racine):
    c = cfg.get('construire')
    if not c:
        return
    t0 = time.time()
    r = subprocess.run(c, shell=True, cwd=racine, capture_output=True, text=True, timeout=900)
    if r.returncode:
        raise RuntimeError(f'construction échouée ({c}) dans {racine} : {(r.stderr or r.stdout)[-400:]}')
    print(f'  construit en {time.time()-t0:.0f} s ({racine})', flush=True)


def extraire(rev, cfg):
    """Copie de la révision `rev` : le dossier du jeu + outils-communs (chemins relatifs intacts) ; node_modules repris par lien."""
    jeu_dir = (cfg.get('fichier') or cfg.get('dossier') or '.').split('/')[0]
    d = tempfile.mkdtemp(prefix='banc_avant_')
    for sous in [jeu_dir, 'outils-communs']:
        r = subprocess.run(f'git -C {RAC} archive {rev} {sous} | tar -x -C {d}', shell=True, capture_output=True, text=True)
        if r.returncode and sous == jeu_dir:
            raise RuntimeError(f'révision introuvable ({rev}) : {r.stderr[-200:]}')
    for racine, dirs, _ in os.walk(os.path.join(RAC, jeu_dir)):
        if 'node_modules' in dirs:
            src = os.path.join(racine, 'node_modules'); dst = os.path.join(d, os.path.relpath(src, RAC))
            if os.path.isdir(os.path.dirname(dst)) and not os.path.exists(dst):
                os.symlink(src, dst)
            dirs.remove('node_modules')
    return d


async def patienter(pg, ms, fige):
    """Attente de `ms` millisecondes de jeu : en mode figé, joue les images correspondantes (temps virtuel)."""
    if fige:
        n = max(1, round(ms / (1000 / 60)))
        for i in range(0, n, 30):
            await pg.evaluate('(k)=>window.__horloge.avancer(k,1000/60)', min(30, n - i))
            await pg.wait_for_timeout(5)
    else:
        await pg.wait_for_timeout(ms)


async def une_passe(nav, cfg, base, page, app_nom, app, scenes, cpu_force=None, au_fil=None):
    """Ouvre le jeu sur un appareil et mesure les scènes demandées. Renvoie {scenes, chronos, chargement_ms, erreurs}."""
    res = {'scenes': {}, 'chronos': {}, 'erreurs': []}
    groupes = []  # suites de scènes qui partagent une page
    for s in scenes:
        if s.get('seule') or not groupes:
            groupes.append([s])
        else:
            groupes[-1].append(s)
    for gi, groupe in enumerate(groupes):
        ctx = await nav.new_context(viewport={'width': app.get('largeur', 390), 'height': app.get('hauteur', 780)},
                                    device_scale_factor=app.get('dpr', 1), is_mobile=False)
        jr = await brancher_routes(ctx, cfg.get('routes'), base=RAC)  # Three.js du CDN servi en local (routes.py)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: res['erreurs'].append(str(e)[:300]))
        cpu = cpu_force if cpu_force else app.get('cpu', 1)
        if cpu and float(cpu) > 1:
            cdp = await ctx.new_cdp_session(pg)
            await cdp.send('Emulation.setCPUThrottlingRate', {'rate': float(cpu)})
        fige = cfg.get('mode', 'fige') == 'fige'
        init = 'window.__banc=1;' + (AVANT_JEU_FIGE if fige else '')
        if cfg.get('stockage'):
            init += 'try{localStorage.clear();' + ''.join(f'localStorage.setItem({json.dumps(k)},{json.dumps(v if isinstance(v, str) else json.dumps(v))});' for k, v in cfg['stockage'].items()) + '}catch(e){}'
        prep_reelle = fige and cfg.get('preparation') == 'reelle'  # chargement et mise en scène en temps réel, images mesurées figées
        attendre = lambda ms: patienter(pg, ms, fige and not prep_reelle)
        if fige:
            init += f"window.__HORLOGE_GRAINE={int(cfg.get('graine', 12345))};" + ('window.__HORLOGE_REEL=1;' if prep_reelle else '')
        elif cfg.get('graine') is not None:
            init += GRAINE_JS % int(cfg['graine'])
        await pg.add_init_script(init)
        if fige:
            await pg.add_init_script(path=HORLOGE)
            if cfg.get('coulant', True):
                await pg.add_init_script('window.__horloge&&window.__horloge.coulant(true)')
        if cfg.get('init'):
            await pg.add_init_script(cfg['init'])
        t0 = time.time()
        await pg.goto(base + page, timeout=180000, wait_until='load')
        if cfg.get('pret'):
            cond = '()=>{try{return !!(' + cfg['pret'] + ')}catch(e){return false}}'
            if fige:
                while not await pg.evaluate(cond):
                    if time.time() - t0 > 180:
                        raise TimeoutError('jeu jamais prêt : ' + cfg['pret'] + ('' if prep_reelle else ' (essayer "preparation": "reelle")'))
                    if not prep_reelle and time.time() - t0 > 30 and not res.get('_lent'):
                        res['_lent'] = 1
                        print('    préparation lente en temps figé (un chargement découpé selon performance.now ?) : essayer "preparation": "reelle"', flush=True)
                    await attendre(100)
            else:
                await pg.wait_for_function(cond, timeout=180000, polling=100)
        if gi == 0:
            res['chargement_ms'] = round((time.time() - t0) * 1000)
        await attendre(cfg.get('pret_ms', 800))
        if cfg.get('entree'):
            await pg.evaluate(fn(cfg['entree']))
            await attendre(cfg.get('entree_ms', 500))
        for s in groupe:
            try:
                if s.get('js'):
                    await pg.evaluate(fn(s['js']))
                await attendre(s.get('attente_ms', 1500))
                if fige:
                    if prep_reelle:
                        await pg.evaluate('()=>{__horloge.reel(false);__horloge.coulant(true);__horloge.avancer(10,1000/60)}')  # refige + 10 images de chauffe
                    m = await pg.evaluate(MESURE_FIGE_JS, [s.get('images', cfg.get('images', 120)), 1000 / 60, s.get('budget_ms', cfg.get('budget_ms', 6000))])
                    if prep_reelle:
                        await pg.evaluate('()=>{__horloge.coulant(false);__horloge.reel(true)}')
                    if m.get('ms', 1) < 0.1:
                        m['note'] = "presque rien à chaque image : la scène ne s'anime pas par requestAnimationFrame (setInterval, ou rien ne bouge) ; essayer \"mode\": \"reel\""
                        print('    note : ' + m['note'], flush=True)
                else:
                    m = await pg.evaluate(MESURE_JS, s.get('duree_ms', 4000))
                if s.get('infos'):
                    try:
                        m['infos'] = await pg.evaluate('()=>(' + s['infos'] + ')')
                    except Exception as e:
                        m['infos'] = 'erreur : ' + str(e)[:120]
                res['scenes'][s['nom']] = m
            except Exception as e:
                res['scenes'][s['nom']] = {'erreur': str(e)[:300]}
                res['erreurs'].append(f"scène {s['nom']} : {str(e)[:200]}")
            print(f"    {app_nom:10s} {s['nom']:18s} {resume_mesure(res['scenes'][s['nom']])}" + (au_fil(s['nom'], res) if au_fil else ''), flush=True)
        if gi == len(groupes) - 1:
            for nom, js in (cfg.get('chronos') or {}).items():
                try:
                    res['chronos'][nom] = await pg.evaluate('()=>{const now=window.__vraiNow||performance.now.bind(performance);const f=()=>{' + js + '\n};f();const t=now();for(let i=0;i<10;i++)f();return +((now()-t)/10).toFixed(2)}')
                except Exception as e:
                    res['chronos'][nom] = None
                    res['erreurs'].append(f'chrono {nom} : {str(e)[:200]}')
        if jr['manquants']:
            res['erreurs'].append('routes : fichier(s) introuvable(s) en local : ' + ', '.join(jr['manquants'][:3]))
        await ctx.close()
    res.pop('_lent', None)
    return res


def _duree(s):
    s = int(s)
    return f'{s // 60} min {s % 60:02d} s' if s >= 60 else f'{s} s'


VERROU = os.environ.get('BANC_VERROU') or os.path.join(tempfile.gettempdir(), 'banc-commun.verrou')


def verrouiller(attendre=True, attente_max=1800):
    """Un seul banc à la fois sur la machine (deux bancs ensemble faussent les ms : charge 5-12 sur 2 cœurs, vu le 17/11).
    Renvoie (fichier verrou ouvert à garder, secondes attendues). Attend que l'autre banc finisse en le redisant chaque minute ;
    abandonne (SystemExit, code 3) après attente_max secondes (--attente-max). BANC_VERROU=fichier : autre verrou (vérificateur)."""
    import fcntl
    f = open(VERROU, 'a+')
    t, dit = time.time(), 0
    while True:
        try:
            fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
            break
        except OSError:
            if not attendre:
                f.close()
                return None, 0
            if time.time() - dit >= 60:
                f.seek(0)
                qui = f.read().strip() or '?'
                print(f'⏳ un autre banc tourne sur cette machine ({qui}) : attente de sa fin pour ne pas fausser les mesures'
                      f' ({_duree(time.time() - t)} ; --sans-verrou pour passer outre)', flush=True)
                dit = time.time()
            if time.time() - t > attente_max:
                f.close()
                print(f'banc : un autre banc tient la machine depuis plus de {_duree(attente_max)} ; abandon (--attente-max, ou --sans-verrou)', flush=True)
                sys.exit(3)
            time.sleep(2)
    attendu = time.time() - t
    if attendu > 1:
        print(f'   … libre après {_duree(attendu)}', flush=True)
    f.seek(0); f.truncate(); f.write(f'pid {os.getpid()}, {" ".join(sys.argv[1:3])}'); f.flush()
    return f, attendu


def charge():
    """Charge moyenne sur 1 min rapportée au nombre de cœurs (1,0 = machine pleine)."""
    try:
        return round(os.getloadavg()[0] / (os.cpu_count() or 1), 2)
    except OSError:
        return None


def resume_mesure(m):
    if 'erreur' in m:
        return 'ERREUR ' + m['erreur'][:80]
    t = f"{m.get('ms', 0):7.2f} ms/img  {m.get('fps', 0):6.1f} img/s  1 % bas {m.get('bas1', 0):6.1f}  pire {m.get('pire', 0):6.1f} ms"
    if m.get('pauses'):
        t += f"  pauses {m['pauses']} (max {m['pauseMax']} ms)"
    return t


async def mesurer_versions(cfg, versions, appareils, scenes, tours, plafond, cpu, partiel=None):
    """versions = [(nom, base, page)] ; tours entrelacés A B B A A B… Renvoie {nom: [passes]} (une passe = {appareil: résultat}).
    partiel = fichier JSON réécrit après CHAQUE scène (mesures déjà faites, progression, temps restant estimé)."""
    from playwright.async_api import async_playwright
    out = {v[0]: [] for v in versions}
    total, fait, t0 = tours * len(versions) * len(appareils) * len(scenes), [0], time.time()
    encours = {}

    def au_fil(nom_scene, res):
        fait[0] += 1
        encours['scenes'] = res['scenes']
        ecoule = time.time() - t0
        reste = ecoule / fait[0] * (total - fait[0])
        if partiel:
            try:
                tmp = partiel + '.tmp'
                json.dump({'partiel': True, 'jeu': cfg.get('jeu'), 'scenes_faites': fait[0], 'scenes_total': total, 'ecoule_s': round(ecoule),
                           'reste_estime_s': round(reste), 'passes': out, 'en_cours': encours}, open(tmp, 'w'), ensure_ascii=False)
                os.replace(tmp, partiel)
            except Exception:
                pass
        return f'   [{fait[0]}/{total}, reste ≈ {_duree(reste)}]' if fait[0] < total else f'   [{fait[0]}/{total}]'
    async with async_playwright() as p:
        nav = await p.chromium.launch(args=ARGS + ([] if plafond else ARGS_SANS_PLAFOND))
        for t in range(tours):
            ordre = versions if t % 2 == 0 else list(reversed(versions))
            for nom, base, page in ordre:
                print(f'  tour {t+1}/{tours} · {nom}', flush=True)
                passe = {}
                out[nom].append(passe)  # rempli appareil par appareil (visible dans le fichier partiel)
                for an, a in appareils.items():
                    encours.clear(); encours.update({'version': nom, 'tour': t + 1, 'appareil': an})
                    f0 = fait[0]
                    try:
                        passe[an] = await une_passe(nav, cfg, base, page, an, a, scenes, cpu, au_fil)
                    except Exception as e:  # jeu jamais prêt, erreur dans « entree »… : la passe est notée en erreur, le banc continue
                        err = f'passe {nom}/{an} : {str(e)[:250]}'
                        print('    ERREUR ' + err, flush=True)
                        passe[an] = {'scenes': {s['nom']: {'erreur': str(e)[:300]} for s in scenes}, 'chronos': {}, 'erreurs': [err]}
                        fait[0] = f0 + len(scenes)  # scènes de la passe ratée comptées comme faites (estimation du reste)
        await nav.close()
    return out


def fusion(passes):
    """Plusieurs passes → médiane par scène (et écart relatif max-min / médiane = bruit)."""
    if not passes:
        return {}
    r = {}
    for an in passes[0]:
        sc = {}
        for s in passes[0][an]['scenes']:
            vals = [p[an]['scenes'].get(s, {}) for p in passes]
            ok = [v for v in vals if 'ms' in v]
            if not ok:
                sc[s] = vals[0]; continue
            m = {}
            for k in ('fps', 'bas1', 'pire', 'ms', 'med', 'p95', 'n'):
                xs = [v[k] for v in ok if k in v]
                if xs:
                    m[k] = round(statistics.median(xs), 2)
            ms = [v['ms'] for v in ok]  # bruit = écart entre passes du temps moyen par image
            m['bruit'] = round((max(ms) - min(ms)) / max(1e-9, statistics.median(ms)) * 100, 1) if len(ms) > 1 else None
            m['valeurs'] = [round(v['ms'], 3) if 'ms' in v else None for v in vals]  # temps moyen de chaque passe, dans l'ordre des tours
            if any(v.get('pauses') for v in ok):
                m['pauses'] = max(v.get('pauses', 0) for v in ok)
            if 'infos' in ok[-1]:
                m['infos'] = ok[-1]['infos']
            sc[s] = m
        ch = {}
        for c in passes[0][an].get('chronos', {}):
            xs = [p[an]['chronos'].get(c) for p in passes if p[an]['chronos'].get(c) is not None]
            ch[c] = round(statistics.median(xs), 2) if xs else None
        ld = [p[an].get('chargement_ms') for p in passes if p[an].get('chargement_ms')]
        r[an] = {'scenes': sc, 'chronos': ch, 'chargement_ms': round(statistics.median(ld)) if ld else None,
                 'erreurs': sorted({e for p in passes for e in p[an]['erreurs']})}
    return r


def ecarts(avant, apres, seuil):
    """Compare deux sorties fusionnées. Une scène est « plus lente » si ms/image augmente de plus que le seuil ET que le bruit mesuré."""
    L, alertes = [], []
    for an in apres:
        if an not in avant:
            continue
        for s, b in apres[an]['scenes'].items():
            a = avant[an]['scenes'].get(s)
            if not a:
                continue
            if 'ms' not in a or 'ms' not in b:
                e = {'appareil': an, 'scene': s, 'avant_ms': a.get('ms', 0), 'apres_ms': b.get('ms', 0), 'ecart_pct': 0, 'bruit_pct': None,
                     'verdict': 'erreur après' if 'ms' not in b else 'erreur avant', 'erreur': b.get('erreur') or a.get('erreur')}
                L.append(e)
                if 'ms' not in b:
                    alertes.append(e)
                continue
            d = (b['ms'] - a['ms']) / max(1e-9, a['ms']) * 100
            bruit = max(a.get('bruit') or 0, b.get('bruit') or 0)
            lim = max(seuil, bruit)
            # chaque tour doit aller dans le même sens (tours appariés A/B dans la même minute) : un seul tour à contre-sens = bruit
            paires = [(x, y) for x, y in zip(a.get('valeurs') or [], b.get('valeurs') or []) if x is not None and y is not None]
            meme_sens_lent = all(y > x for x, y in paires) if paires else True
            meme_sens_rapide = all(y < x for x, y in paires) if paires else True
            verdict = 'plus lent' if d > lim and meme_sens_lent else 'plus rapide' if d < -lim and meme_sens_rapide else 'égal (bruit)'
            e = {'appareil': an, 'scene': s, 'avant_ms': a['ms'], 'apres_ms': b['ms'], 'ecart_pct': round(d, 1), 'bruit_pct': bruit,
                 'avant_bas1': a.get('bas1'), 'apres_bas1': b.get('bas1'), 'verdict': verdict}
            L.append(e)
            if verdict == 'plus lent':
                alertes.append(e)
        for c, vb in apres[an].get('chronos', {}).items():
            va = avant[an].get('chronos', {}).get(c)
            if va and vb:
                d = (vb - va) / va * 100
                e = {'appareil': an, 'scene': 'chrono ' + c, 'avant_ms': va, 'apres_ms': vb, 'ecart_pct': round(d, 1), 'bruit_pct': None,
                     'verdict': 'plus lent' if d > seuil * 2 else 'plus rapide' if d < -seuil * 2 else 'égal (bruit)'}
                L.append(e)
                if e['verdict'] == 'plus lent':
                    alertes.append(e)
    return L, alertes


def tableau(L):
    t = [f"{'appareil':10s} {'scène':22s} {'avant':>9s} {'après':>9s} {'écart':>8s} {'bruit':>6s}  verdict   (ms par image en moyenne, plus bas = mieux)"]
    for e in L:
        br = f"{e['bruit_pct']:.0f} %" if e.get('bruit_pct') is not None else '  -'
        t.append(f"{e['appareil']:10s} {e['scene'][:22]:22s} {e['avant_ms']:9.2f} {e['apres_ms']:9.2f} {e['ecart_pct']:+7.1f}% {br:>6s}  {e['verdict']}")
    return '\n'.join(t)


def lire_args(argv):
    o = {'tours': None, 'scenes': None, 'appareils': None, 'plafond': False, 'cpu': None, 'construire': False, 'seuil': None, 'sans_verrou': False, 'attente_max': None,
         'strict': False, 'avant': None, 'avant_dossier': None, 'avant_page': None, 'reference': None, 'comparer': None, 'pos': []}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a in ('--plafond', '--construire', '--strict', '--sans-verrou'):
            o[a[2:].replace('-', '_')] = True
        elif a == '--comparer':
            o['comparer'] = (argv[i + 1], argv[i + 2]); i += 2
        elif a.startswith('--'):
            k = a[2:].replace('-', '_')
            if k not in o:
                sys.exit(f'option inconnue : {a}')
            o[k] = argv[i + 1]; i += 1
        else:
            o['pos'].append(a)
        i += 1
    return o


def charger_sortie(f):
    d = json.load(open(f))
    return d.get('apres') or d.get('appareils') or d


def main(argv):
    o = lire_args(argv)
    if o['comparer']:
        a, b = (charger_sortie(f) for f in o['comparer'])
        L, al = ecarts(a, b, float(o['seuil'] or 10))
        print(tableau(L))
        return 1 if (o['strict'] and al) else 0
    if not o['pos']:
        print(__doc__); return 2
    reg = os.path.abspath(o['pos'][0]); sortie = o['pos'][1] if len(o['pos']) > 1 else None
    cfg = json.load(open(reg))
    seuil = float(o['seuil'] or cfg.get('seuil', 10))
    scenes = cfg['scenes']
    if o['scenes']:
        voulu = o['scenes'].split(',')
        scenes = [s for s in scenes if s['nom'] in voulu]
        if not scenes:
            sys.exit('aucune scène ne correspond : ' + o['scenes'])
    appareils = cfg.get('appareils') or APPAREILS_DEFAUT
    if o['appareils']:
        appareils = {k: v for k, v in appareils.items() if k in o['appareils'].split(',')}
    jeu = cfg.get('jeu') or os.path.basename(os.path.dirname(os.path.dirname(reg)))
    avec_avant = bool(o['avant'] or o['avant_dossier'] or o['avant_page'])
    tours = int(o['tours'] or (2 if avec_avant else 1))
    verrou, attente_verrou = (None, 0) if o['sans_verrou'] else verrouiller(attente_max=float(o['attente_max'] or 1800))
    t0 = time.time()
    serveurs, tmp = [], None
    ch0 = charge()
    if attente_verrou > 1:
        print(f'   (charge {ch0} par cœur au départ : en partie héritée du banc précédent, moyenne sur 1 min)', flush=True)
    elif ch0 is not None and ch0 > 1.5:  # un banc seul ≈ 0,9 par cœur ; deux bancs ensemble : 2,5 à 6 (17/11)
        print(f'⚠ machine déjà chargée (charge {ch0:.2f} par cœur) : un autre travail lourd tourne ? les ms seront plus hautes et plus bruitées', flush=True)
    partiel = (os.path.abspath(sortie) if sortie else os.path.join(tempfile.gettempdir(), f'banc-{jeu}')) + '.partiel.json'
    try:
        if o['construire']:
            construire(cfg, RAC)
        d_ap, p_ap = lieu(cfg, RAC)
        b_ap, s = servir(d_ap); serveurs.append(s)
        versions = [('apres' if avec_avant else 'mesure', b_ap, p_ap)]
        if avec_avant:
            if o['avant']:
                tmp = extraire(o['avant'], cfg)
                construire(cfg, tmp)
                d_av, p_av = lieu(cfg, tmp)
            elif o['avant_page']:
                d_av, p_av = os.path.dirname(os.path.abspath(o['avant_page'])), os.path.basename(o['avant_page'])
            else:
                d_av, p_av = os.path.abspath(o['avant_dossier']), lieu(cfg, RAC)[1]
            b_av, s = servir(d_av); serveurs.append(s)
            versions = [('avant', b_av, p_av)] + versions
        print(f"Banc {jeu} · {len(scenes)} scènes · {', '.join(appareils)} · {tours} tour(s) · {('temps figé, préparation réelle' if cfg.get('preparation') == 'reelle' else 'temps figé') + ' : coût réel par image, GPU compris' if cfg.get('mode', 'fige') == 'fige' else ('temps réel, plafond 60 img/s' if o['plafond'] else 'temps réel sans plafond')}", flush=True)
        print(f'mesures au fil de l\'eau : {partiel}', flush=True)
        brut = asyncio.run(mesurer_versions(cfg, versions, appareils, scenes, tours, o['plafond'], o['cpu'], partiel))
    finally:
        if verrou:
            verrou.close()
        for s in serveurs:
            s.shutdown(); s.server_close()
        if tmp:
            shutil.rmtree(tmp, ignore_errors=True)
    meta = {'jeu': jeu, 'date': datetime.datetime.now().isoformat(timespec='seconds'), 'plafond': o['plafond'], 'tours': tours,
            'cpu': o['cpu'], 'duree_s': round(time.time() - t0), 'charge': {'debut': ch0, 'fin': charge(), **({'heritee': True} if attente_verrou > 1 else {})},
            'attente_verrou_s': round(attente_verrou)}
    code = 0
    if avec_avant:
        av, ap = fusion(brut['avant']), fusion(brut['apres'])
        L, al = ecarts(av, ap, seuil)
        out = {**meta, 'avant_rev': o['avant'] or o['avant_dossier'] or o['avant_page'], 'avant': av, 'apres': ap, 'ecarts': L}
        print('\n' + tableau(L))
        if al:
            print(f"\n⚠ {len(al)} mesure(s) plus lente(s) au-delà de {seuil:.0f} % et du bruit : " + ', '.join(f"{e['appareil']}/{e['scene']} {e['ecart_pct']:+.0f} %" for e in al))
            code = 1 if o['strict'] else 0
        else:
            print(f'\nAucun ralentissement au-delà de {seuil:.0f} % et du bruit.')
    else:
        ap = fusion(brut['mesure'])
        out = {**meta, 'appareils': ap}
        if o['reference']:
            L, al = ecarts(charger_sortie(o['reference']), ap, seuil)
            out['ecarts'] = L
            print('\nComparaison à la référence (autre minute : prudence) :\n' + tableau(L))
            code = 1 if (o['strict'] and al) else 0
    err = sorted({e for v in ([ap] + ([av] if avec_avant else [])) for a in v.values() for e in a['erreurs']})
    if err:
        print('\nErreurs JS : ' + ' | '.join(err[:5]))
    if sortie:
        os.makedirs(os.path.dirname(os.path.abspath(sortie)), exist_ok=True)
        json.dump(out, open(sortie, 'w'), indent=1, ensure_ascii=False)
        print('écrit :', sortie)
    try:
        os.remove(partiel)  # tout est dans la sortie (ou à l'écran) : le fichier partiel ne sert plus
    except OSError:
        pass
    print(f'durée : {time.time()-t0:.0f} s')
    return code


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
