#!/usr/bin/env python3
"""Banc commun de fluidité : mêmes scènes, même graine, mesures au format de testkit.js, avant/après dans la même minute.

usage :
  python3 outils-communs/banc.py <jeu>/outils/banc.json [sortie.json]          une mesure de la version en cours
  python3 outils-communs/banc.py <jeu>/outils/banc.json --avant HEAD           AVANT (révision git) / APRÈS (dossier de travail), entrelacés
  python3 outils-communs/banc.py <jeu>/outils/banc.json --avant-dossier /tmp/ancien_jeu   (ou --avant-page fichier.html)
        --avant arrivee (ou chantier) = DÉBUT DU CHANTIER en cours (commit de `bureau.py arrivee <jeu>`) : les commits faits en route
        restent dans l'APRÈS (avec HEAD ils passaient dans l'AVANT : fausses alertes) ; sans chantier ouvert = HEAD
        --avant HEAD extrait TOUT le dépôt à cette révision (≈ 2 s : un jeu qui lit un autre dossier se construit) ;
        --avant-dossier accepte aussi la RACINE d'une copie du dépôt (git worktree) : on y sert le même chemin que les réglages
        (+ --construire : construit aussi dans cette copie). Page absente = arrêt immédiat (code 2) ; une version jamais prête
        n'est pas relancée aux tours suivants (avant : 180 s perdues à chaque passe).
  python3 outils-communs/banc.py --comparer avant.json apres.json              compare deux sorties déjà faites
options : --tours N (défaut 2 avec --avant : A B B A A B… ; 1 sinon) · --scenes a,b · --appareils telephone,ordinateur
          --plafond (mode "reel" seulement : images plafonnées à 60/s comme un écran ; défaut : sans plafond)
          --cpu 4 (ralenti processeur, remplace celui des réglages) · --construire (lance "construire" aussi pour la version en cours)
          --seuil 10 (%, écart minimal signalé) · --strict (code 1 si une scène ralentit au-delà du seuil et du bruit)
          --reference mesures/x.json (compare à une mesure enregistrée : moins fiable, autre minute / autre machine)
          --sans-verrou (par défaut, un seul banc à la fois par machine : le second attend la fin du premier, en le disant)
          --attente-max 1800 (s : abandon, code 3, si l'autre banc ne finit pas)
          --attente-navigateurs 600 (s : attente des navigateurs Chromium HORS VERROU actifs, robots des jeux lancés tels quels ;
                   0 = ne pas attendre ; ceux encore actifs au début ou à la fin sont notés dans la sortie : "navigateurs_hors_verrou")
          --gels tous|nom1,nom2 (seulement les gels) · --sans-gels
          --profil (+ --groupes 20, --images N) : CE QUI COÛTE dans chaque scène Three.js (profil3d.py : chaque groupe d'objets
                   masqué tour à tour, ombres, environnement, lumières, brouillard, résolution ½) ; une passe, sans avant/après
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
  "scenes": [{"nom":"zoom_engage", "js":"…placement…", "action":"vb.w*=0.9;applyVB(true)", "repetitions":12}]
       SCÈNE ACTION (jeux DOM/SVG qui redessinent sur un clic, pas à chaque image : ms/img ≈ 0 et les "chronos" ne voient que le JS) :
       chaque répétition = action + 1 image du jeu + mise en page + attente de l'AFFICHAGE (2 vraies images : peinture ET
       rastérisation comprises), page au repos entre deux. Un 1 px change à chaque mesure (sinon Chromium n'affiche rien et
       attend 16 ms). Le même trajet SANS action (« vide ») est mesuré en alternance et déduit. Rend ms (affichage net, médiane ;
       c'est lui qu'on compare), js_ms, principal_ms (temps du fil principal : JS + styles + mise en page + peinture, compteurs
       Chromium), raster_ms ≈ ms − principal_ms (dessin hors fil principal : gros SVG, filtres), vide_ms, pire, p95.
       Machine chargée (20/11) : chaque action est déduite du trajet vide de SA répétition (dérive annulée) ; si l'incertitude
       dépasse max(1 ms, 10 % de l'action), répétitions en plus jusqu'à "repetitions_max" (défaut 3 × repetitions ; noté
       repetitions_faites ; "non_converge": true si le plafond est atteint sans que l'incertitude baisse). Action vide sous charge :
       3,4-6,9 ms → ≈ 0-2 ms. incertitude_ms = erreur type de la médiane des différences appariées : sous 2 × incertitude, l'action
       ne se distingue pas de rien sur cette machine à cet instant. "methode_action": 2 (absent = mesure d'avant le 20/11 : vide
       déduit en bloc, ms surestimé sous charge). Sous charge une scène action peut durer jusqu'à 3 × plus longtemps.
       Action ASYNCHRONE : l'écrire en fonction fléchée qui rend la promesse (« ()=>charger() ») : elle est attendue (attente_ms à part) ;
       en instructions, une promesse n'est pas attendue. "delai_s": 60 = abandon d'une action sans fin (la page reste en attente :
       "seule": true sur les scènes suivantes si besoin). Bruit plus fort qu'une image
       figée : « plus lent » au-delà de 2×seuil ; viser --tours 3. Le navigateur prend alors --run-all-compositor-stages-before-draw
       (noté dans la sortie : "drapeaux").
       C&C 18/11 : render() = 5 ms de JS mais 14-25 ms jusqu'à l'affichage ; zoom engagé (applyVB(true)) 100-380 ms, invisible avant.
  "pret_max_s": 180              attente maximale de "pret" (s)
  "gels": [{"nom":"normale_haute", "avant":"G3.setLevel(1)", "avant_ms":1500, "js":"G3.setLevel(2)", "duree_ms":8000,
            "occupe":"G3.occupe", "stockage":{"cle":"valeur"}, "infos":"…"}]   (stockage du gel : ajouté à celui des réglages)
       GEL au changement (qualité, étage, entrée en combat) en TEMPS RÉEL, page neuve à chaque gel (prêt → entrée → avant → js).
       Rend : pire_en_jeu_ms (pire écart entre deux images hors préparation annoncée par "occupe" et l'image qui la suit),
       premiere_image_ms, regime_ms, prep_ms, programmes (WebGL linkProgram, tout moteur) dont programmes_en_jeu (compilés
       quand "occupe" est faux au moment même de la compilation : ceux qui gèlent l'écran ; doit être 0), compilation_ms (temps dans linkProgram/getProgramParameter :
       souvent faible, le pilote peut compiler au 1er dessin), pire_tache_ms. Avant/après : « plus lent » si programmes_en_jeu
       augmente, ou pire image en jeu +2×seuil ET +100 ms.
  "chronos": {"rendu_ms": "render()"}   instructions chronométrées (moyenne de 10 exécutions, en ms) après les scènes ; avant/après :
       « plus lent » seulement au-delà de 2×seuil, du bruit entre passes et de 0,3 ms, dans le même sens à chaque tour
  "seuil": 10                           % (défaut 10)
  "routes": {"https://exemple.cdn/lib/": "chemin/local/"}   adresses servies en local (routes.py ; chemins relatifs à la racine) ;
       par défaut Three.js sur jsDelivr/unpkg est TOUJOURS servi en local (copie téléchargée une fois) ; "routes": false pour couper
Sortie : {jeu, date, plafond, appareils:{nom:{scenes:{nom:{fps,bas1,pire,n,ms,med,p95,infos}}, gels:{nom:{…}}, chronos, chargement_ms, erreurs}}}
         + avec --avant : {avant, apres, ecarts} et un tableau lisible.  Valeurs RELATIVES (rendu logiciel) : comparer, pas conclure en absolu.
"""
import asyncio, json, os, re, sys, time, shutil, subprocess, tempfile, threading, functools, statistics, datetime
import http.server, socketserver
ICI = os.path.dirname(os.path.abspath(__file__))
RAC = os.path.dirname(ICI)
sys.path.insert(0, ICI)
from atelier import MESURE_JS, ARGS, ARGS_SANS_PLAFOND, HORLOGE  # noqa: E402
from routes import brancher as brancher_routes  # noqa: E402
from appareils import resoudre as resoudre_appareils  # noqa: E402
import profil3d  # noqa: E402

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
 return{fps:+(1000/Math.max(m,1e-3)).toFixed(1),bas1:+(1000/Math.max(q(.99),1e-3)).toFixed(1),pire:+s[s.length-1].toFixed(1),n:a.length,ms:+m.toFixed(3),med:+q(.5).toFixed(3),p95:+q(.95).toFixed(3),canvas:vis.length,...(tronque?{tronque:true}:{})};}"""

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
    if hors_depot(cfg):  # page construite à un chemin absolu (/home/claude/banc/…) : dossier créé d'office (retour Wall Street 18/11 :
        os.makedirs(lieu(cfg, racine)[0], exist_ok=True)  # FileNotFoundError sur une machine neuve)
    t0 = time.time()
    r = subprocess.run(c, shell=True, cwd=racine, capture_output=True, text=True, timeout=900)
    if r.returncode:
        raise RuntimeError(f'construction échouée ({c}) dans {racine} : {(r.stderr or r.stdout)[-400:]}')
    print(f'  construit en {time.time()-t0:.0f} s ({racine})', flush=True)


def extraire(rev, cfg):
    """Copie COMPLÈTE de la révision `rev` (git archive de tout le dépôt : ≈ 2 s, 136 Mo le 17/11) : un jeu qui lit un autre dossier
    (donjon 3D du Trône → valdragon/jeu) se construit comme dans le dépôt. Avant le 17/11 au soir : dossier du jeu + outils-communs
    seulement → « construction échouée ». node_modules (non versionnés) repris par lien depuis le dépôt de travail."""
    d = tempfile.mkdtemp(prefix='banc_avant_')
    r = subprocess.run(f'git -C {RAC} archive {rev} | tar -x -C {d}', shell=True, capture_output=True, text=True)
    if r.returncode or not os.listdir(d):
        shutil.rmtree(d, ignore_errors=True)
        raise RuntimeError(f'révision introuvable ({rev}) : {r.stderr[-200:]}')
    for racine, dirs, _ in os.walk(RAC):
        if '.git' in dirs:
            dirs.remove('.git')
        if 'node_modules' in dirs:
            src = os.path.join(racine, 'node_modules'); dst = os.path.join(d, os.path.relpath(src, RAC))
            if os.path.isdir(os.path.dirname(dst)) and not os.path.lexists(dst):
                os.symlink(os.path.realpath(src), dst)
            dirs.remove('node_modules')
    return d

ARRIVEE = ('arrivee', 'arrivée', 'chantier', 'debut', 'début')


def _git(*a):
    r = subprocess.run(['git', '-C', RAC, *a], capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else ''


def resoudre_avant(rev, jeu, dire=print):
    """Révision AVANT d'un --avant. « arrivee » (ou chantier, debut) = le DÉBUT DU CHANTIER en cours sur ce jeu : le commit qui a
    ouvert bureau/chantiers/<jeu>.md (bureau.py arrivee). Retour Cage & Gloire 18/11 : avec « HEAD », une équipe qui commite en
    route comparait sa version à elle-même moins le dernier commit (2 fausses alertes « plus lente », et un vrai ralentissement
    commité plus tôt devenait invisible). Sans chantier ouvert (ou arrivée pas encore commitée) : HEAD, en le disant.
    Avec « HEAD » explicite : avertit si des commits du chantier touchent déjà <jeu>/. Renvoie (révision, étiquette pour la sortie)."""
    if not rev:
        return rev, rev
    ch = f'bureau/chantiers/{jeu}.md'
    ouvert = os.path.exists(os.path.join(RAC, ch))
    objet = quand = ''
    if ouvert:
        try:
            for l in open(os.path.join(RAC, ch), encoding='utf-8'):
                if l.startswith('objet:'):
                    objet = l[6:].strip()
                elif l.startswith('depuis:'):
                    quand = l[7:].strip()
        except OSError:
            pass
    base, pourquoi = '', ''
    if ouvert:
        # le commit qui a écrit CETTE arrivée (ligne « depuis: » du fichier actuel) : un chantier ré-ouvert par-dessus un ancien
        # (bureau.py réécrit le fichier : modification, pas ajout) a sa propre base
        base = _git('log', '-1', '--format=%H', '-S', f'depuis: {quand}', '--', ch) if quand else ''
        if not base:
            base = _git('log', '-1', '--format=%H', '--diff-filter=A', '--', ch) if not quand else ''
        if not base or _git('show', f'HEAD:{ch}').find(f'depuis: {quand}') < 0:
            base, pourquoi = '', 'arrivée pas encore commitée'
        elif subprocess.run(['git', '-C', RAC, 'merge-base', '--is-ancestor', base, 'HEAD'], capture_output=True).returncode:
            base, pourquoi = '', "commit d'arrivée hors de l'historique de HEAD"
        else:
            gp = _git('rev-parse', '--git-path', 'shallow')
            try:  # clone superficiel : au commit limite, tous les fichiers paraissent « ajoutés » → base fausse
                lim = open(gp if os.path.isabs(gp) else os.path.join(RAC, gp)).read().split() if gp else []
            except OSError:
                lim = []
            if base in lim:
                base, pourquoi = '', "clone superficiel : l'arrivée est avant la limite (git fetch --unshallow)"
            elif subprocess.run(['git', '-C', RAC, 'diff', '--quiet', f'{base}^', base, '--', jeu], capture_output=True).returncode == 1:
                base = _git('rev-parse', f'{base}^') or base  # le commit d'arrivée touche aussi le jeu : AVANT = son parent
    else:
        pourquoi = 'aucun chantier ouvert sur ' + jeu
    n = int(_git('rev-list', '--count', f'{base}..HEAD', '--', jeu) or 0) if base else 0
    if rev.lower() in ARRIVEE:
        if not base:
            dire(f"--avant {rev} : {pourquoi} → comparaison à HEAD")
            return 'HEAD', f'{rev} = HEAD'
        dire(f"--avant {rev} : début du chantier « {objet} » (commit {base[:7]}{', ' + quand if quand else ''}) ; {n} commit(s) du chantier sur {jeu}/ comptés dans l'APRÈS")
        return base, f'{rev} {base[:7]}'
    if base and n and _git('rev-parse', rev) == _git('rev-parse', 'HEAD'):
        dire(f"⚠ --avant {rev} : {n} commit(s) de ce chantier touchent déjà {jeu}/ depuis l'arrivée ({base[:7]}) ; ils sont dans l'AVANT et leurs"
             f" effets ne seront pas vus → pour comparer au début du chantier : --avant arrivee")
    return rev, rev


def hors_depot(cfg):
    """Vrai si la page servie est à un chemin absolu hors du dépôt (construite par une commande qui y écrit en dur)."""
    c = cfg.get('fichier') or cfg.get('dossier') or '.'
    return os.path.isabs(c) and not os.path.abspath(c).startswith(RAC + os.sep)


MAX_DE_COTE = (3000, 400 * 2**20)  # dossier « propre à la page » : au plus 3 000 fichiers et 400 Mo


def dossier_propre(d, page=None):
    """Vrai si `d` paraît PROPRE À LA PAGE (dossier de sortie d'une seule construction, ex. /home/claude/banc/hameau) : ni la racine,
    ni la maison, ni /tmp, ni un dossier qui contient le dépôt ou un .git, petit, et AUCUNE autre page .html que `page` dans tout
    l'arbre (/home/claude/banc, qui sert Cage ET Wall Street ET Hameau, est donc partagé). Le 18/11, "fichier": "/home/claude/cg.html"
    faisait mettre de côté TOUT /home/claude (dépôt compris) puis plantait en le remettant (shutil.Error sur les liens)."""
    d = os.path.realpath(d)
    interdits = {os.path.realpath(x) for x in ('/', '/tmp', '/home', '/root', '/var', '/usr', os.path.expanduser('~'), tempfile.gettempdir())}
    if d in interdits or len(d.rstrip(os.sep).split(os.sep)) <= 2:
        return False
    rac = os.path.realpath(RAC)
    if rac == d or rac.startswith(d + os.sep) or os.path.exists(os.path.join(d, '.git')):
        return False
    page = os.path.normpath(page) if page else None
    n = taille = 0
    for r, dirs, fs in os.walk(d):
        if '.git' in dirs:
            return False
        n += len(fs)
        for f in fs:
            if f.lower().endswith(('.html', '.htm')) and os.path.relpath(os.path.join(r, f), d) != page:
                return False  # une autre page : dossier de sortie commun à plusieurs jeux
            try:
                taille += os.lstat(os.path.join(r, f)).st_size
            except OSError:
                pass
        if n > MAX_DE_COTE[0] or taille > MAX_DE_COTE[1]:
            return False
    return True


def _etat(d, rels=None):
    """{chemin relatif: (taille, mtime_ns, lien)} de tous les fichiers de d (liens vers des dossiers compris, non suivis),
    ou seulement des chemins `rels` (dossier partagé)."""
    e = {}
    def noter(rel):
        c = os.path.join(d, rel)
        try:
            st = os.lstat(c)
        except OSError:
            return
        if os.path.isdir(c) and not os.path.islink(c):
            return
        e[rel] = (st.st_size, st.st_mtime_ns, os.readlink(c) if os.path.islink(c) else None)
    if rels is not None:
        for rel in rels:
            noter(rel)
        return e
    for r, dirs, fs in os.walk(d):
        for f in fs + [x for x in dirs if os.path.islink(os.path.join(r, x))]:
            noter(os.path.relpath(os.path.join(r, f), d))
    return e


def _copier(src, dst, lien=None):
    """Copie d'un fichier ou d'un lien (remplace un fichier ou un lien à `dst` : plus de shutil.Error « déjà présent ») ; refuse
    d'écrire DANS un vrai dossier qui aurait pris la place du fichier. Un lien RELATIF copié ailleurs devient absolu (sinon il ne
    mène plus nulle part) ; lien = texte du lien à écrire tel quel (remise en place à l'endroit d'origine)."""
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.lexists(dst):
        if os.path.isdir(dst) and not os.path.islink(dst):
            raise RuntimeError(f'{dst} est devenu un dossier : non remplacé')
        os.unlink(dst)
    if lien is not None:
        os.symlink(lien, dst)
    elif os.path.islink(src):
        cible = os.readlink(src)
        os.symlink(cible if os.path.isabs(cible) else os.path.normpath(os.path.join(os.path.dirname(src), cible)), dst)
    else:
        shutil.copy2(src, dst)


def mettre_de_cote(d_ap, cfg, tmp, page=None):
    """Construction de l'AVANT pour une page à chemin absolu (la construction de la révision écrit au même endroit que l'APRÈS).
    Renvoie (dossier APRÈS à servir, dossier AVANT servi). Les fichiers surveillés que la construction a CHANGÉS, CRÉÉS ou
    SUPPRIMÉS sont copiés dans l'AVANT puis remis à l'état APRÈS (copie de côté), même si la construction échoue.
    - Dossier propre à la page (dossier_propre) : tout le dossier est surveillé (copie complète, servie comme APRÈS).
    - Dossier partagé (/home/claude/cg.html, /home/claude/banc/…) : SEULEMENT la page et les "sorties" des réglages (chemins
      relatifs au dossier de la page) ; rien d'autre n'est copié, remis ni effacé (une autre conversation peut y construire son jeu).
      APRÈS servi depuis le dossier lui-même (remis en place) ; AVANT = fichiers surveillés + liens vers tout le reste du dossier."""
    pg = _fichier_page('', page).lstrip('/') if page else None
    if pg and os.path.isdir(os.path.join(d_ap, pg)):
        pg = os.path.join(pg, 'index.html')
    propre = dossier_propre(d_ap, pg) if os.path.isdir(d_ap) else True
    suivis = None if propre else sorted({x for x in [pg] + list(cfg.get('sorties') or []) if x})
    ap, av = os.path.join(tmp, '.banc_apres'), os.path.join(tmp, '.banc_avant')
    os.makedirs(ap, exist_ok=True); os.makedirs(av, exist_ok=True)
    avant = _etat(d_ap, suivis) if os.path.isdir(d_ap) else {}
    # dossier partagé : relevé (sans copie) des autres fichiers du 1er niveau, pour DIRE si la construction en réécrit un
    voisins = {} if propre else {k: v for k, v in _etat(d_ap, [x for x in os.listdir(d_ap)]).items() if k not in avant}
    for rel in avant:
        _copier(os.path.join(d_ap, rel), os.path.join(ap, rel))
    change, rates = [], []
    try:
        construire(cfg, tmp)
    finally:
        apres = _etat(d_ap, suivis) if os.path.isdir(d_ap) else {}
        change = sorted(r for r in set(apres) | set(avant) if avant.get(r) != apres.get(r))
        try:
            for rel in change:  # 1) l'AVANT construit, copié à part (une copie ratée n'empêche pas la remise en place)
                if rel in apres:
                    try:
                        _copier(os.path.join(d_ap, rel), os.path.join(av, rel))
                    except Exception as e:
                        rates.append(f'{rel} : {e}')
        finally:
            for rel in change:  # 2) l'APRÈS reprend sa place, QUOI QU'IL ARRIVE (fichier changé, créé ou supprimé)
                try:
                    if rel in avant:
                        _copier(os.path.join(ap, rel), os.path.join(d_ap, rel), avant[rel][2])
                    elif propre:
                        os.unlink(os.path.join(d_ap, rel))
                except Exception as e:
                    print(f'  ⚠ {os.path.join(d_ap, rel)} non remis à l\'état APRÈS ({e}) ; copie de l\'APRÈS : {os.path.join(ap, rel)}', flush=True)
    if voisins:
        v2 = _etat(d_ap, list(voisins))
        touches = [k for k in voisins if v2.get(k) != voisins[k]]
        if touches:
            print(f'  ⚠ fichier(s) voisin(s) changé(s) pendant la construction de l\'AVANT, NON remis (peut-être une autre conversation ;'
                  f' si c\'est la construction du jeu : les ajouter à "sorties" dans les réglages) : {", ".join(touches[:6])}', flush=True)
    if rates:
        raise RuntimeError('AVANT incomplet, copie ratée : ' + ' | '.join(rates[:3]))
    if pg and pg not in change:
        print(f'  ⚠ la construction de l\'AVANT n\'a pas réécrit {pg} : AVANT = APRÈS pour cette page ?', flush=True)
    base = ap if propre else d_ap  # voisins non changés (ou non surveillés) : présents dans l'AVANT servi, par lien
    for r, dirs, fs in os.walk(base):
        for f in fs + dirs:
            rel = os.path.relpath(os.path.join(r, f), base)
            dst = os.path.join(av, rel)
            if rel in change or os.path.lexists(dst):
                continue
            if (f in dirs) and not os.path.islink(os.path.join(r, f)) and any(c.startswith(rel + os.sep) for c in change):
                continue  # dossier qui contient un fichier changé : on descend dedans
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            os.symlink(os.path.join(r, f), dst)
        dirs[:] = [x for x in dirs if not os.path.islink(os.path.join(r, x)) and any(c.startswith(os.path.relpath(os.path.join(r, x), base) + os.sep) for c in change)]
    if propre:
        print(f'  page hors du dépôt ({d_ap}) : APRÈS mis de côté ({len(avant)} fichiers), AVANT construit puis copié à part'
              f' ({len(change)} fichiers changés, créés ou supprimés, remis à l\'état APRÈS)', flush=True)
        return ap, av
    print(f'  page hors du dépôt dans un dossier PARTAGÉ ({d_ap}) : seuls {", ".join(suivis)} surveillés (réglage "sorties" pour'
          f' en ajouter), rien d\'autre n\'est copié ni touché ; {len(change)} changés par la construction de l\'AVANT, remis à l\'état APRÈS', flush=True)
    return d_ap, av


def assurer_page(cfg, d, p, nom, deja_construit=False):
    """Page absente mais réglages avec "construire" : construction lancée d'office (retour Cage & Gloire 18/11 : --avant HEAD sans
    --construire s'arrêtait « page APRÈS introuvable » sur une machine neuve). Puis verifier_page."""
    if not deja_construit and cfg.get('construire') and not os.path.isfile(_fichier_page(d, p)) and not os.path.isfile(os.path.join(_fichier_page(d, p), 'index.html')):
        print(f'  page {nom} absente ({_fichier_page(d, p)}) : construction lancée d\'office', flush=True)
        construire(cfg, RAC)
    verifier_page(d, p, nom)


def _fichier_page(dossier, page):
    return os.path.join(dossier, page.split('?')[0].split('#')[0])


def lieu_avant_dossier(cfg, dossier):
    """--avant-dossier accepte la RACINE d'une copie du dépôt (worktree, clone : on y prend le même chemin que dans les réglages)
    ou directement le dossier servi. Avant le 17/11 au soir, une racine de worktree était servie telle quelle : page 404 →
    « jeu jamais prêt » après 180 s, à chaque passe (Trône de Braise : 21 min pour rien). Renvoie (dossier servi, page, est_racine)."""
    dossier = os.path.abspath(dossier)
    d_rac, p_rac = lieu(cfg, dossier)
    rel = cfg.get('fichier') or cfg.get('dossier') or '.'
    if not os.path.isabs(rel) and rel not in ('.', '') and os.path.isdir(os.path.join(dossier, rel.split('/')[0])):
        return d_rac, p_rac, True  # racine d'une copie du dépôt (son premier dossier, ex. trone-de-braise/, existe)
    page = lieu(cfg, RAC)[1]
    return dossier, page, False


def verifier_page(dossier, page, nom):
    """Échec immédiat et clair si la page à ouvrir n'existe pas (au lieu d'attendre « jeu jamais prêt »)."""
    f = _fichier_page(dossier, page)
    if os.path.isdir(f):
        f = os.path.join(f, 'index.html')
    if not os.path.isfile(f):
        raise PageAbsente(f'page {nom} introuvable : {f}' + (' (page construite : ajouter --construire ?)' if '/build/' in f or 'build' in page else ''))


class PageIntrouvable(RuntimeError):
    pass


class PageAbsente(FileNotFoundError):
    pass


class JamaisPret(TimeoutError):
    pass


async def patienter(pg, ms, fige):
    """Attente de `ms` millisecondes de jeu : en mode figé, joue les images correspondantes (temps virtuel)."""
    if fige:
        n = max(1, round(ms / (1000 / 60)))
        for i in range(0, n, 30):
            await pg.evaluate('(k)=>window.__horloge.avancer(k,1000/60)', min(30, n - i))
            await pg.wait_for_timeout(5)
    else:
        await pg.wait_for_timeout(ms)


# Scène ACTION (18/11, retour Couronnes & Complots : « scènes sans requestAnimationFrame → 0,00 ms/img, seul render_ms compte ») :
# une action (clic, redessin, zoom engagé) mesurée jusqu'à l'AFFICHAGE. 2 vraies images : la 1re peint, la 2e attend que la 1re soit
# rastérisée et activée (vu sur C&C : avec 1 seule image, le dessin du SVG zoomé, ≈ 300 ms, passait dans l'action SUIVANTE).
# Un pixel change à chacune des 2 images (sans dégât à l'écran, Chromium attend le rythme de l'écran : 16 ms de plus, et des
# mesures en marches d'escalier).
ACTION_JS = """async([js,vide,fige])=>{const now=window.__vraiNow||performance.now.bind(performance),raf=window.__vraiRaf||requestAnimationFrame;
 let px=document.getElementById('__bancPx');if(!px){px=document.createElement('div');px.id='__bancPx';
  px.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;pointer-events:none;z-index:2147483647;opacity:.01';document.documentElement.appendChild(px);}
 const pixel=()=>{px.style.background=px.style.background==='rgb(0, 0, 1)'?'rgb(0, 0, 2)':'rgb(0, 0, 1)';};pixel();
 const image=(p)=>new Promise(r=>raf(()=>{if(p)pixel();r();}));const apres=()=>new Promise(r=>{const c=new MessageChannel();c.port1.onmessage=()=>r();c.port2.postMessage(0);});
 await image(1);let att=0;const t0=now();if(!vide){const f=(0,eval)('('+js+')');const r=f();if(r&&typeof r.then==='function'){const ta=now();await r;att=now()-ta;}}
 if(fige&&window.__horloge)window.__horloge.avancer(1,1000/60);void document.documentElement.offsetHeight;const t1=now();
 await image(1);await image();await apres();const t2=now();
 await image();await image();return [t2-t0,t1-t0,att];}"""


def incertitude(dif):
    """Erreur type de la médiane des différences appariées (1,25 × écart robuste ÷ √n). Écart robuste = le plus grand de la MAD
    et de l'écart interquartile ÷ 1,35 : en temps réel les durées tombent par paliers d'≈ 16,7 ms et la MAD seule peut valoir 0
    alors qu'un tiers des paires sont décalées d'une image (relecture du 20/11)."""
    if len(dif) < 2:
        return 0.0
    md = statistics.median(dif); t = sorted(dif); k = len(t)
    iqr = t[min(k - 1, (3 * k) // 4)] - t[k // 4]
    return 1.25 * max(1.4826 * statistics.median([abs(x - md) for x in dif]), iqr / 1.35) / k ** .5


async def mesurer_action(ctx, pg, s, fige):
    """Répétitions alternées vide / action (même trajet) ; renvoie une mesure au format du banc (ms = affichage net médian)."""
    n = max(4, int(s.get('repetitions', 12)))
    js = fn(s['action'])
    cdp = await ctx.new_cdp_session(pg)
    await cdp.send('Performance.enable')

    async def tache():
        m = await cdp.send('Performance.getMetrics')
        return next((x['value'] for x in m['metrics'] if x['name'] == 'TaskDuration'), 0) * 1000
    aff, jsm, fil, vaff, vfil, vjs, att = [], [], [], [], [], [], []
    delai = float(s.get('delai_s', 60))
    try:
        await pg.evaluate(ACTION_JS, [js, True, fige])  # chauffe (pixel créé, page au repos)
        # 20/11 : machine chargée (incertitude > max(1 ms, 10 %)) → répétitions en plus, par deux (ordre alterné gardé), jusqu'à 3 × n
        n_max = max(n, int(s.get('repetitions_max', 3 * n))); n_max = n + 2 * ((n_max - n) // 2)
        def bruyant():
            if len(aff) < 4:
                return False
            dif = [max(x - w, j - wj) for x, w, j, wj in zip(aff, vaff, jsm, vjs)]
            return incertitude(dif) > max(1.0, 0.1 * abs(statistics.median(dif)))
        i = 0
        while i < n or (i < n_max and ((i - n) % 2 == 1 or bruyant())):
            i += 1
            for vide in (True, False) if i % 2 == 1 else (False, True):  # ordre alterné : la dérive ne favorise ni l'un ni l'autre
                a = await tache()
                try:
                    r = await asyncio.wait_for(pg.evaluate(ACTION_JS, [js, vide, fige]), delai)
                except asyncio.TimeoutError:
                    raise RuntimeError(f'action sans fin après {delai:.0f} s ("delai_s") : attend-elle une image du jeu ? en temps figé les images'
                                       ' ne viennent pas seules : essayer "preparation": "reelle" ou "mode": "reel"') from None
                b = await tache()
                if vide:
                    vaff.append(r[0]); vfil.append(b - a); vjs.append(r[1])
                else:
                    aff.append(r[0]); jsm.append(r[1]); fil.append(b - a); att.append(r[2])
    finally:
        try:
            await cdp.send('Performance.disable'); await cdp.detach()
        except Exception:
            pass
    med = statistics.median
    v, vf, vj = med(vaff), med(vfil), med(vjs)
    # affichage net = attente d'affichage moins celle du trajet vide, jamais moins que le temps du JS + mise en page lui-même, moins
    # celui du trajet vide (l'image du jeu jouée à chaque fois : un jeu à boucle d'animation de 8 ms ne doit pas lire 8 ms pour une
    # action vide) ; sans ce plancher, une action longue « recouvre » l'attente de l'image : 102 ms de JS lus 90 ms (page factice)
    # 20/11 : différence APPARIÉE (action − trajet vide de la même répétition, mesurés l'un après l'autre) plutôt que − médiane de tous
    # les vides : machine chargée (autre conversation, rendus Blender), les vides dérivent de 3 à 17 ms et une action vide lisait
    # 3,4-6,9 ms au lieu de ≈ 0 (retour Outils 19/11 17:41) ; la dérive lente s'annule dans chaque paire
    net = sorted(max(0.0, x - w, j - wj) for x, w, j, wj in zip(aff, vaff, jsm, vjs))
    q = lambda k: net[min(len(net) - 1, int(len(net) * k))]
    ms = med(net)
    dif = [max(x - w, j - wj) for x, w, j, wj in zip(aff, vaff, jsm, vjs)]
    incert = incertitude(dif)
    converge = len(dif) < n_max or incert <= max(1.0, 0.1 * abs(med(dif)))
    princ = max(0.0, med(fil) - vf)
    attente = med(att)  # action asynchrone (« ()=>promesse ») : temps passé à attendre, ni JS ni dessin
    return {'ms': round(ms, 3), 'med': round(ms, 3), 'p95': round(q(.95), 2), 'pire': round(net[-1], 1), 'n': len(net),
            'fps': round(1000 / max(ms, 1e-3), 1), 'bas1': round(1000 / max(net[-1], 1e-3), 1), 'action': True,
            'js_ms': round(max(0.0, med([j - w for j, w in zip(jsm, att)]) - vj), 2), 'principal_ms': round(princ, 2), 'raster_ms': round(max(0.0, ms - princ - attente), 2),
            'incertitude_ms': round(incert, 2), 'methode_action': 2, 'repetitions_faites': len(net), **({} if converge else {'non_converge': True}),
            'vide_ms': round(v, 2), 'bruit_ms': round(1.4826 * med([abs(x - v) for x in vaff]), 2), **({'attente_ms': round(attente, 2)} if attente > 0.05 else {})}


async def une_passe(nav, cfg, base, page, app_nom, app, scenes, cpu_force=None, au_fil=None, profil=None):
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
        try:
            jr = await brancher_routes(ctx, cfg.get('routes'), base=RAC)  # Three.js du CDN servi en local (routes.py)
            pg = await ctx.new_page()
            pg.on('pageerror', lambda e: res['erreurs'].append(str(e)[:300]))
            cpu = cpu_force if cpu_force else app.get('cpu', 1)
            if cpu and float(cpu) > 1:
                cdp = await ctx.new_cdp_session(pg)
                await cdp.send('Emulation.setCPUThrottlingRate', {'rate': float(cpu)})
            fige = cfg.get('mode', 'fige') == 'fige'
            init = 'window.__banc=1;window.__vraiRaf=window.requestAnimationFrame.bind(window);' + (AVANT_JEU_FIGE if fige else '')
            if cfg.get('stockage'):
                init += 'try{localStorage.clear();' + ''.join(f'localStorage.setItem({json.dumps(k)},{json.dumps(v if isinstance(v, str) else json.dumps(v))});' for k, v in cfg['stockage'].items()) + '}catch(e){}'
            prep_reelle = fige and cfg.get('preparation') == 'reelle'  # chargement et mise en scène en temps réel, images mesurées figées
            attendre = lambda ms: patienter(pg, ms, fige and not prep_reelle)
            if fige:
                init += f"window.__HORLOGE_GRAINE={int(cfg.get('graine', 12345))};" + ('window.__HORLOGE_REEL=1;' if prep_reelle else '')
            elif cfg.get('graine') is not None:
                init += GRAINE_JS % int(cfg['graine'])
            await pg.add_init_script(init)
            if profil is not None:
                await pg.add_init_script(profil3d.INIT)  # moteurs et scènes Three.js annoncés par three.js lui-même (__THREE_DEVTOOLS__)
            if fige:
                await pg.add_init_script(path=HORLOGE)
                if cfg.get('coulant', True):
                    await pg.add_init_script('window.__horloge&&window.__horloge.coulant(true)')
            if cfg.get('init'):
                await pg.add_init_script(cfg['init'])
            t0 = time.time()
            rep = await pg.goto(base + page, timeout=180000, wait_until='load')
            if rep is not None and rep.status >= 400:
                raise PageIntrouvable(f'page introuvable (HTTP {rep.status}) : {base + page}')
            pret_max = float(cfg.get('pret_max_s', 180))
            if cfg.get('pret'):
                cond = '()=>{try{return !!(' + cfg['pret'] + ')}catch(e){return false}}'
                if fige:
                    while not await pg.evaluate(cond):
                        if time.time() - t0 > pret_max:
                            raise JamaisPret('jeu jamais prêt : ' + cfg['pret'] + ('' if prep_reelle else ' (essayer "preparation": "reelle")'))
                        if not prep_reelle and time.time() - t0 > 30 and not res.get('_lent'):
                            res['_lent'] = 1
                            print('    préparation lente en temps figé (un chargement découpé selon performance.now ?) : essayer "preparation": "reelle"', flush=True)
                        await attendre(100)
                else:
                    try:
                        await pg.wait_for_function(cond, timeout=pret_max * 1000, polling=100)
                    except Exception as e:
                        if 'Timeout' not in type(e).__name__ + str(e)[:40]:
                            raise
                        raise JamaisPret('jeu jamais prêt : ' + cfg['pret']) from None
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
                    if s.get('action'):
                        if prep_reelle:
                            await pg.evaluate('()=>{__horloge.reel(false);__horloge.coulant(true);__horloge.avancer(10,1000/60)}')
                        try:
                            m = await mesurer_action(ctx, pg, s, fige)
                        finally:
                            if prep_reelle:
                                await pg.evaluate('()=>{__horloge.coulant(false);__horloge.reel(true)}')
                    elif fige:
                        if prep_reelle:
                            await pg.evaluate('()=>{__horloge.reel(false);__horloge.coulant(true);__horloge.avancer(10,1000/60)}')  # refige + 10 images de chauffe
                        m = await pg.evaluate(MESURE_FIGE_JS, [s.get('images', cfg.get('images', 120)), 1000 / 60, s.get('budget_ms', cfg.get('budget_ms', 6000))])
                        if prep_reelle:
                            await pg.evaluate('()=>{__horloge.coulant(false);__horloge.reel(true)}')
                        if m.get('ms', 1) < 0.1:
                            m['note'] = "presque rien à chaque image : la scène ne s'anime pas par requestAnimationFrame (setInterval, ou rien ne bouge) ; jeu qui redessine sur un clic : scène \"action\" (coût jusqu'à l'affichage) ; boucle setInterval : \"mode\": \"reel\""
                            print('    note : ' + m['note'], flush=True)
                    else:
                        m = await pg.evaluate(MESURE_JS, s.get('duree_ms', 4000))
                    if s.get('infos'):
                        try:
                            m['infos'] = await pg.evaluate('()=>(' + s['infos'] + ')')
                        except Exception as e:
                            m['infos'] = 'erreur : ' + str(e)[:120]
                    if profil is not None and 'ms' in m and not s.get('action'):
                        if prep_reelle:
                            await pg.evaluate('()=>{__horloge.reel(false);__horloge.coulant(true)}')
                        try:
                            m['profil'] = await profil3d.profiler(pg, cfg, profil)
                        except Exception as e:
                            m['profil'] = {'erreur': str(e)[:300]}
                        if prep_reelle:
                            await pg.evaluate('()=>{__horloge.coulant(false);__horloge.reel(true)}')
                    res['scenes'][s['nom']] = m
                except Exception as e:
                    res['scenes'][s['nom']] = {'erreur': str(e)[:300]}
                    res['erreurs'].append(f"scène {s['nom']} : {str(e)[:200]}")
                print(f"    {app_nom:10s} {s['nom']:18s} {resume_mesure(res['scenes'][s['nom']])}" + (au_fil(s['nom'], res) if au_fil else ''), flush=True)
                if profil is not None and 'profil' in res['scenes'][s['nom']]:
                    print(profil3d.tableau(f"{app_nom} · {s['nom']}", res['scenes'][s['nom']]['profil']), flush=True)
            if gi == len(groupes) - 1:
                for nom, js in (cfg.get('chronos') or {}).items():
                    try:
                        res['chronos'][nom] = await pg.evaluate('()=>{const now=window.__vraiNow||performance.now.bind(performance);const f=()=>{' + js + '\n};f();const t=now();for(let i=0;i<10;i++)f();return +((now()-t)/10).toFixed(2)}')
                    except Exception as e:
                        res['chronos'][nom] = None
                        res['erreurs'].append(f'chrono {nom} : {str(e)[:200]}')
            if jr['manquants']:
                res['erreurs'].append('routes : fichier(s) introuvable(s) en local : ' + ', '.join(jr['manquants'][:3]))
        finally:
            await ctx.close()
    res.pop('_lent', None)
    return res


# Gel au changement (qualité, étage, écran) : mesuré en TEMPS RÉEL sur une page neuve (le temps figé l'absorbe dans la préparation).
# Compteur de programmes WebGL indépendant du moteur : linkProgram (et le temps passé dans linkProgram + getProgramParameter, où un
# rendu logiciel sans KHR_parallel_shader_compile paie la compilation). Les images où le jeu se dit « occupe » (préparation
# annoncée, écran de chargement) et celle qui suit sont comptées à part : seul le gel EN JEU est un défaut.
SONDE_GEL_INIT = """(()=>{const g=window.__gelBanc={links:[],linkMs:0};const now=()=>performance.now();
 for(const P of [window.WebGLRenderingContext,window.WebGL2RenderingContext]){if(!P)continue;const pr=P.prototype;
  const l=pr.linkProgram;pr.linkProgram=function(p){const t=now();let oc=false;try{oc=!!(g.occ&&g.occ());}catch(e){}const r=l.call(this,p);g.links.push([t,oc]);g.linkMs+=now()-t;return r;};
  const q=pr.getProgramParameter;pr.getProgramParameter=function(p,k){const t=now();const r=q.call(this,p,k);g.linkMs+=now()-t;return r;};}
 try{new PerformanceObserver(L=>{for(const e of L.getEntries())(g.lt=g.lt||[]).push([e.startTime,e.duration]);}).observe({entryTypes:['longtask']});}catch(e){}})();"""
SONDE_GEL_DEBUT = """(occ)=>{const g=window.__gelBanc;g.t0=performance.now();g.l0=g.links.length;g.ms0=g.linkMs;g.fr=[];g.fin=false;let last=g.t0,occP=false;
 const o=()=>{if(!occ)return false;try{return !!(0,eval)(occ)}catch(e){return false}};g.occ=o;
 const f=t=>{const n=performance.now();const oc=o();g.fr.push([last,n,oc||occP]);occP=oc;last=n;if(!g.fin)requestAnimationFrame(f);};requestAnimationFrame(f);}"""
SONDE_GEL_FIN = """()=>{const g=window.__gelBanc;g.fin=true;const fr=g.fr,links=g.links.slice(g.l0);
 const jeu=fr.filter(x=>!x[2]),prep=fr.filter(x=>x[2]),d=x=>x[1]-x[0];
 const enJeu=links.filter(x=>!x[1]).length;
 const reg=jeu.slice(-12).map(d).sort((a,b)=>a-b);const lt=(g.lt||[]).filter(x=>x[0]+x[1]>=g.t0);
 return {premiere_image_ms:fr.length?Math.round(d(fr[0])):null,pire_image_ms:Math.round(Math.max(0,...fr.map(d))),
  pire_en_jeu_ms:Math.round(Math.max(0,...jeu.map(d))),prep_ms:Math.round(prep.reduce((a,x)=>a+d(x),0)),
  regime_ms:reg.length?+reg[Math.floor(reg.length/2)].toFixed(1):null,images:fr.length,
  programmes:links.length,programmes_en_jeu:enJeu,compilation_ms:Math.round(g.linkMs-g.ms0),
  pire_tache_ms:Math.round(Math.max(0,...lt.map(x=>x[1])))};}"""


async def une_passe_gel(nav, cfg, base, page, app, gel, cpu_force=None):
    """Page neuve en temps réel → prêt → entrée → gel.avant → gel.js (le changement) → mesure pendant gel.duree_ms."""
    res = {'erreurs': []}
    ctx = await nav.new_context(viewport={'width': app.get('largeur', 390), 'height': app.get('hauteur', 780)},
                                device_scale_factor=app.get('dpr', 1), is_mobile=False)
    try:
        jr = await brancher_routes(ctx, cfg.get('routes'), base=RAC)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: res['erreurs'].append(str(e)[:300]))
        cpu = cpu_force if cpu_force else app.get('cpu', 1)
        if cpu and float(cpu) > 1:
            cdp = await ctx.new_cdp_session(pg)
            await cdp.send('Emulation.setCPUThrottlingRate', {'rate': float(cpu)})
        init = 'window.__banc=1;window.__bancGel=1;'
        stock = {**(cfg.get('stockage') or {}), **(gel.get('stockage') or {})}  # "stockage" du gel : ex. démarrer en Normale
        if stock:
            init += 'try{localStorage.clear();' + ''.join(f'localStorage.setItem({json.dumps(k)},{json.dumps(v if isinstance(v, str) else json.dumps(v))});' for k, v in stock.items()) + '}catch(e){}'
        init += GRAINE_JS % int(cfg.get('graine', 12345))  # même hasard avant/après (comme le temps figé)
        await pg.add_init_script(init)
        await pg.add_init_script(SONDE_GEL_INIT)
        if cfg.get('init'):
            await pg.add_init_script(cfg['init'])
        rep = await pg.goto(base + page, timeout=180000, wait_until='load')
        if rep is not None and rep.status >= 400:
            raise PageIntrouvable(f'page introuvable (HTTP {rep.status}) : {base + page}')
        if cfg.get('pret'):
            try:
                await pg.wait_for_function('()=>{try{return !!(' + cfg['pret'] + ')}catch(e){return false}}',
                                           timeout=float(cfg.get('pret_max_s', 180)) * 1000, polling=100)
            except Exception as e:
                if 'Timeout' not in type(e).__name__ + str(e)[:40]:
                    raise
                raise JamaisPret('jeu jamais prêt : ' + cfg['pret']) from None
        await pg.wait_for_timeout(cfg.get('pret_ms', 800))
        if cfg.get('entree'):
            await pg.evaluate(fn(cfg['entree']))
            await pg.wait_for_timeout(cfg.get('entree_ms', 500))
        if gel.get('avant'):
            await pg.evaluate(fn(gel['avant']))
        await pg.wait_for_timeout(gel.get('avant_ms', 1500))  # régime établi avant le changement
        await pg.evaluate(SONDE_GEL_DEBUT, gel.get('occupe') or '')
        await pg.evaluate(fn(gel['js']))
        await pg.wait_for_timeout(gel.get('duree_ms', 8000))
        m = await pg.evaluate(SONDE_GEL_FIN)
        if gel.get('infos'):
            try:
                m['infos'] = await pg.evaluate('()=>(' + gel['infos'] + ')')
            except Exception as e:
                m['infos'] = 'erreur : ' + str(e)[:120]
        res.update(m)
        if jr['manquants']:
            res['erreurs'].append('routes : fichier(s) introuvable(s) en local : ' + ', '.join(jr['manquants'][:3]))
    finally:
        await ctx.close()
    return res


def resume_gel(m):
    if 'erreur' in m:
        return 'ERREUR ' + m['erreur'][:80]
    return (f"pire image en jeu {m.get('pire_en_jeu_ms')} ms (régime {m.get('regime_ms')} ms) · programmes {m.get('programmes')}"
            f" dont {m.get('programmes_en_jeu')} en jeu · compilation {m.get('compilation_ms')} ms · préparation {m.get('prep_ms')} ms")


def _duree(s):
    s = int(s)
    return f'{s // 60} min {s % 60:02d} s' if s >= 60 else f'{s} s'


import verrou as _verrou  # noqa: E402
VERROU = _verrou.FICHIER


def verrouiller(attendre=True, attente_max=1800, attente_navigateurs=None):
    """Un seul banc à la fois sur la machine (deux bancs ensemble faussent les ms : charge 5-12 sur 2 cœurs, vu le 17/11), et
    depuis le 18/11 aucun ROBOT pendant un banc (captures, singe, étapes de verif.py, outils lancés par `verrou.py robot`) : le banc
    attend la fin des robots en cours, les nouveaux attendent derrière lui (verrou.py). Renvoie (jeton à fermer, secondes
    attendues) ; abandon (SystemExit, code 3) après attente_max secondes (--attente-max). BANC_VERROU=fichier : autre verrou."""
    if os.environ.get('VERROU_TENU') == 'robot':
        print('⚠ banc lancé sous un verrou « robot » (verrou.py robot -- …) : pas de verrou exclusif ; lancer le banc hors de verrou.py robot', flush=True)
    return _verrou.prendre('banc', f'{" ".join(os.path.basename(x) for x in sys.argv[1:3])}', attendre, attente_max,
                           attente_navigateurs=attente_navigateurs)


def _nav_meta(debut, fin):
    """Navigateurs hors verrou (verrou.py) : attente au début, actifs restants au début et à la fin ; avertit si la mesure en a souffert."""
    r = {}
    if debut.get('attendu_s'):
        r['attente_navigateurs_s'] = debut['attendu_s']
    deb = [{'pid': n['pid'], 'lanceur': n['lanceur'], 'cpu': n['cpu']} for n in debut.get('restants') or []]
    fn = [{'pid': n['pid'], 'lanceur': n['lanceur'], 'cpu': n['cpu']} for n in fin or []]
    if deb or fn:
        r['navigateurs_hors_verrou'] = {'debut': deb, 'fin': fn}
        print(f"⚠ navigateurs HORS VERROU actifs pendant la mesure ({_verrou.resume_navigateurs((debut.get('restants') or []) + (fin or []))}) :"
              " ms plus hautes et plus bruitées ; refaire le banc quand ils ont fini (verrou.py etat)", flush=True)
    return r


def charge():
    """Charge moyenne sur 1 min rapportée au nombre de cœurs (1,0 = machine pleine)."""
    try:
        return round(os.getloadavg()[0] / (os.cpu_count() or 1), 2)
    except OSError:
        return None


def resume_mesure(m):
    if 'erreur' in m:
        return 'ERREUR ' + m['erreur'][:80]
    if m.get('action'):
        return (f"{m.get('ms', 0):7.2f} ms{' ± ' + format(m['incertitude_ms'], '.1f') if m.get('incertitude_ms', 0) >= 0.5 else ''} par action jusqu'à l'affichage (JS {m.get('js_ms')} · fil principal {m.get('principal_ms')}"
                f" · dessin hors fil ≈ {m.get('raster_ms')}{' · attente ' + str(m['attente_ms']) if m.get('attente_ms') else ''} · pire {m.get('pire')} · vide déduit {m.get('vide_ms')})")
    t = f"{m.get('ms', 0):7.2f} ms/img  {m.get('fps', 0):6.1f} img/s  1 % bas {m.get('bas1', 0):6.1f}  pire {m.get('pire', 0):6.1f} ms"
    if m.get('pauses'):
        t += f"  pauses {m['pauses']} (max {m['pauseMax']} ms)"
    return t


async def mesurer_versions(cfg, versions, appareils, scenes, tours, plafond, cpu, partiel=None, gels=(), profil=None, veille=None, budget_calme=0.0, refaites=None):
    """versions = [(nom, base, page)] ; tours entrelacés A B B A A B… Renvoie {nom: [passes]} (une passe = {appareil: résultat}).
    partiel = fichier JSON réécrit après CHAQUE scène (mesures déjà faites, progression, temps restant estimé)."""
    from playwright.async_api import async_playwright
    out = {v[0]: [] for v in versions}
    total, fait, t0 = tours * len(versions) * len(appareils) * (len(scenes) + len(gels)), [0], time.time()
    abandon = {}  # (version, appareil) → erreur de préparation : page introuvable (1 échec) ou jamais prête (2 échecs) : plus relancée
    echecs = {}

    def noter_echec(cle, e):
        if isinstance(e, PageIntrouvable):
            abandon[cle] = str(e)[:300]
        elif isinstance(e, JamaisPret):
            echecs[cle] = echecs.get(cle, 0) + 1
            if echecs[cle] >= 2:  # un échec isolé peut venir d'une machine chargée ; deux de suite : la version ne démarre pas
                abandon[cle] = str(e)[:300]
    encours = {}
    budget = [float(budget_calme or 0)]  # secondes d'attente encore permises pour les navigateurs hors verrou (veille, 19/11 soir)
    refaites = refaites if refaites is not None else []  # passes et gels refaits (rempli pour l'appelant)

    async def calme(quoi):
        """Avant chaque passe et chaque gel : si un robot HORS VERROU tourne (veille), attendre sa fin (dans le budget)."""
        if veille is not None and budget[0] > 0 and veille.actifs:
            w = await asyncio.to_thread(veille.attendre_calme, budget[0], f'banc ({quoi})', lambda m: print('    ' + m, flush=True))
            budget[0] -= w

    def perturbee(t_debut):
        return veille.vus_depuis(t_debut) if veille is not None else []

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
        # scènes action : le compositeur attend la rastérisation avant d'afficher (sinon le dessin d'une action passe dans la suivante,
        # et chaque attente d'image coûte ≈ 15 ms au lieu de ≈ 5) ; drapeau mis SEULEMENT quand il y a des actions (mesures d'avant inchangées)
        actions = ['--run-all-compositor-stages-before-draw'] if any(s.get('action') for s in scenes) else []
        nav = await p.chromium.launch(args=ARGS + ([] if plafond else ARGS_SANS_PLAFOND) + actions)
        for t in range(tours):
            ordre = versions if t % 2 == 0 else list(reversed(versions))
            for nom, base, page in ordre:
                print(f'  tour {t+1}/{tours} · {nom}', flush=True)
                passe = {}
                out[nom].append(passe)  # rempli appareil par appareil (visible dans le fichier partiel)
                for an, a in appareils.items():
                    encours.clear(); encours.update({'version': nom, 'tour': t + 1, 'appareil': an})
                    f0 = fait[0]
                    if (nom, an) in abandon:
                        e = abandon[(nom, an)]
                        print(f'    {an:10s} non relancée : même échec aux tours précédents ({e[:90]})', flush=True)
                        passe[an] = {'scenes': {s['nom']: {'erreur': e} for s in scenes}, 'chronos': {}, 'erreurs': [f'passe {nom}/{an} : {e}'],
                                     **({'gels': {g['nom']: {'erreur': e} for g in gels}} if gels else {})}
                        fait[0] = f0 + len(scenes) + len(gels)
                        continue
                    for essai in (0, 1):  # veille (19/11 soir) : une passe pendant laquelle un robot hors verrou a tourné est refaite une fois
                        if scenes:
                            await calme(f'{nom}/{an}')
                        t_p = time.time()
                        try:
                            passe[an] = await une_passe(nav, cfg, base, page, an, a, scenes, cpu, au_fil, profil) if scenes else {'scenes': {}, 'chronos': {}, 'erreurs': []}
                        except Exception as e:  # jeu jamais prêt, erreur dans « entree »… : la passe est notée en erreur, le banc continue
                            err = f'passe {nom}/{an} : {str(e)[:250]}'
                            print('    ERREUR ' + err, flush=True)
                            passe[an] = {'scenes': {s['nom']: {'erreur': str(e)[:300]} for s in scenes}, 'chronos': {}, 'erreurs': [err]}
                            fait[0] = f0 + len(scenes)  # scènes de la passe ratée comptées comme faites (estimation du reste)
                            noter_echec((nom, an), e)
                            break
                        vus = perturbee(t_p) if scenes else []
                        if vus and essai == 0 and budget[0] > 0:
                            print(f"    ↻ {an} : navigateur(s) HORS VERROU actifs pendant cette passe ({_verrou.resume_navigateurs(vus)}) : mesure faussée, passe refaite après leur fin", flush=True)
                            refaites.append(f'{nom}/{an} tour {t + 1}'); fait[0] = f0
                            continue
                        if vus:
                            passe[an]['hors_verrou'] = _verrou.resume_navigateurs(vus)
                        break
                    if gels:
                        passe[an]['gels'] = {}
                        for g in gels:
                            if (nom, an) in abandon:
                                passe[an]['gels'][g['nom']] = {'erreur': abandon[(nom, an)]}
                            else:
                                for essai in (0, 1):  # veille (19/11 soir) : gel refait une fois si un robot hors verrou a tourné pendant
                                    await calme(f"{nom}/{an} gel {g['nom']}")
                                    t_p = time.time()
                                    try:
                                        r = await une_passe_gel(nav, cfg, base, page, a, g, cpu)
                                    except Exception as e:
                                        passe[an]['gels'][g['nom']] = {'erreur': str(e)[:300]}
                                        passe[an]['erreurs'].append(f"gel {g['nom']} : {str(e)[:200]}")
                                        noter_echec((nom, an), e)
                                        break
                                    vus = perturbee(t_p)
                                    if vus and essai == 0 and budget[0] > 0:
                                        print(f"    ↻ {an} gel {g['nom']} : navigateur(s) HORS VERROU actifs pendant le gel ({_verrou.resume_navigateurs(vus)}) : gel refait après leur fin", flush=True)
                                        refaites.append(f"{nom}/{an} gel {g['nom']} tour {t + 1}")
                                        continue
                                    if vus:
                                        r['hors_verrou'] = _verrou.resume_navigateurs(vus)
                                    passe[an]['erreurs'] += [x for x in r.pop('erreurs') if x not in passe[an]['erreurs']]
                                    passe[an]['gels'][g['nom']] = r
                                    break
                            print(f"    {an:10s} gel {g['nom'][:14]:14s} {resume_gel(passe[an]['gels'][g['nom']])}" + au_fil('gel ' + g['nom'], passe[an]), flush=True)
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
            for k in ('fps', 'bas1', 'pire', 'ms', 'med', 'p95', 'n', 'js_ms', 'principal_ms', 'raster_ms', 'vide_ms', 'bruit_ms', 'incertitude_ms', 'repetitions_faites', 'methode_action'):
                xs = [v[k] for v in ok if k in v]
                if xs:
                    m[k] = round(statistics.median(xs), 2)
            ms = [v['ms'] for v in ok]  # bruit = écart entre passes du temps moyen par image
            m['bruit'] = round((max(ms) - min(ms)) / max(1e-9, statistics.median(ms)) * 100, 1) if len(ms) > 1 else None
            m['valeurs'] = [round(v['ms'], 3) if 'ms' in v else None for v in vals]  # temps moyen de chaque passe, dans l'ordre des tours
            if ok[0].get('action'):
                m['action'] = True
            if any(v.get('non_converge') for v in ok):
                m['non_converge'] = True
            if ok[-1].get('note'):
                m['note'] = ok[-1]['note']  # avant le 18/11 la note (« presque rien à chaque image… ») n'était qu'à l'écran
            if any(v.get('pauses') for v in ok):
                m['pauses'] = max(v.get('pauses', 0) for v in ok)
            if 'infos' in ok[-1]:
                m['infos'] = ok[-1]['infos']
            if 'profil' in ok[-1]:
                m['profil'] = ok[-1]['profil']
            sc[s] = m
        ch, chv = {}, {}
        for c in passes[0][an].get('chronos', {}):
            xs = [p[an]['chronos'].get(c) for p in passes if p[an]['chronos'].get(c) is not None]
            ch[c] = round(statistics.median(xs), 2) if xs else None
            chv[c] = [p[an]['chronos'].get(c) for p in passes]  # valeur de chaque passe, dans l'ordre des tours (bruit, sens)
        gl = {}
        for g in passes[0][an].get('gels', {}):
            vals = [p[an].get('gels', {}).get(g, {}) for p in passes]
            ok = [v for v in vals if 'pire_en_jeu_ms' in v]
            if not ok:
                gl[g] = vals[0]; continue
            med = lambda xs: (lambda x: int(x) if float(x).is_integer() else round(x, 1))(statistics.median(xs))
            m = {k: (med([v[k] for v in ok if v.get(k) is not None]) if any(v.get(k) is not None for v in ok) else None)
                 for k in ('premiere_image_ms', 'pire_image_ms', 'pire_en_jeu_ms', 'prep_ms', 'regime_ms', 'programmes', 'programmes_en_jeu', 'compilation_ms', 'pire_tache_ms')}
            m['valeurs'] = [v.get('pire_en_jeu_ms') for v in vals]
            m['valeurs_prog'] = [v.get('programmes_en_jeu') for v in vals]
            if 'infos' in ok[-1]:
                m['infos'] = ok[-1]['infos']
            gl[g] = m
        ld = [p[an].get('chargement_ms') for p in passes if p[an].get('chargement_ms')]
        r[an] = {'scenes': sc, 'chronos': ch, **({'chronos_valeurs': chv} if chv else {}), **({'gels': gl} if gl else {}), 'chargement_ms': round(statistics.median(ld)) if ld else None,
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
            if b.get('action') and (max(a['ms'], b['ms']) < 1 or abs(b['ms'] - a['ms']) < 0.5):  # action presque vide : 0,00 ↔ 0,15 ms n'est pas +∞ %
                L.append({'appareil': an, 'scene': s, 'avant_ms': a['ms'], 'apres_ms': b['ms'], 'ecart_pct': 0, 'bruit_pct': None, 'verdict': 'égal (négligeable)', 'action': True})
                continue
            if max(a['ms'], b['ms']) < 0.1:  # presque rien par image (scène qui ne s'anime pas) : un écart de 0,02 ms n'est pas un ralentissement
                L.append({'appareil': an, 'scene': s, 'avant_ms': a['ms'], 'apres_ms': b['ms'], 'ecart_pct': 0, 'bruit_pct': None, 'verdict': 'égal (négligeable)'})
                continue
            d = (b['ms'] - a['ms']) / max(1e-9, a['ms']) * 100
            bruit = max(a.get('bruit') or 0, b.get('bruit') or 0)
            # action (attente d'affichage, rastérisation sur des fils partagés) : bien plus bruitée qu'une image en temps figé ; même
            # règle que les chronos : 2×seuil (C&C, même code, 3 tours : +19 % « plus lent » avec le seuil simple, 18/11)
            lim = max(seuil * (2 if b.get('action') else 1), bruit)
            # chaque tour doit aller dans le même sens (tours appariés A/B dans la même minute) : un seul tour à contre-sens = bruit
            paires = [(x, y) for x, y in zip(a.get('valeurs') or [], b.get('valeurs') or []) if x is not None and y is not None]
            meme_sens_lent = all(y > x for x, y in paires) if paires else True
            meme_sens_rapide = all(y < x for x, y in paires) if paires else True
            verdict = 'plus lent' if d > lim and meme_sens_lent else 'plus rapide' if d < -lim and meme_sens_rapide else 'égal (bruit)'
            e = {'appareil': an, 'scene': s, 'avant_ms': a['ms'], 'apres_ms': b['ms'], 'ecart_pct': round(d, 1), 'bruit_pct': bruit,
                 'avant_bas1': a.get('bas1'), 'apres_bas1': b.get('bas1'), 'verdict': verdict, **({'action': True} if b.get('action') else {})}
            if b.get('action') and a.get('methode_action') != b.get('methode_action'):   # --comparer avec une sortie d'avant le 20/11
                e['methode'] = 'différente (vide déduit en bloc d\'un côté : ms surestimé sous charge)'
            L.append(e)
            if verdict == 'plus lent':
                alertes.append(e)
        for c, vb in apres[an].get('chronos', {}).items():
            va = avant[an].get('chronos', {}).get(c)
            if va and vb:
                d = (vb - va) / va * 100
                # chrono = 10 exécutions d'une fonction (souvent < 1 ms) : très bruité (JIT, ramasse-miettes). « Plus lent » seulement
                # si l'écart dépasse 2×seuil ET le bruit mesuré entre passes ET 0,3 ms, et va dans le même sens à CHAQUE tour
                # (avant : tour_ms 0,65 → 1,15 ms « plus lent +77 % » sur un code identique, C&L 18/11)
                va_ = avant[an].get('chronos_valeurs', {}).get(c) or []
                vb_ = apres[an].get('chronos_valeurs', {}).get(c) or []
                paires = [(x, y) for x, y in zip(va_, vb_) if x is not None and y is not None] if len(va_) == len(vb_) else []
                xa = [x for x in va_ if x is not None]; xb = [x for x in vb_ if x is not None]
                bruit = max([(max(x) - min(x)) / max(1e-9, statistics.median(x)) * 100 for x in (xa, xb) if len(x) > 1] or [0])
                lim = max(seuil * 2, min(bruit, seuil * 4))  # bruit plafonné : une passe perturbée ne cache pas tout
                lent = d > lim and vb - va > 0.3 and all(y > x for x, y in paires)
                rapide = d < -lim and va - vb > 0.3 and all(y < x for x, y in paires)
                e = {'appareil': an, 'scene': 'chrono ' + c, 'avant_ms': va, 'apres_ms': vb, 'ecart_pct': round(d, 1), 'bruit_pct': round(bruit, 1) if bruit else None,
                     'verdict': 'plus lent' if lent else 'plus rapide' if rapide else 'égal (bruit)'}
                L.append(e)
                if e['verdict'] == 'plus lent':
                    alertes.append(e)
        for g, b in apres[an].get('gels', {}).items():
            a = avant[an].get('gels', {}).get(g)
            if not a:
                continue
            if 'pire_en_jeu_ms' not in a or 'pire_en_jeu_ms' not in b:
                e = {'appareil': an, 'scene': 'gel ' + g, 'avant_ms': a.get('pire_en_jeu_ms') or 0, 'apres_ms': b.get('pire_en_jeu_ms') or 0, 'ecart_pct': 0,
                     'bruit_pct': None, 'verdict': 'erreur après' if 'pire_en_jeu_ms' not in b else 'erreur avant', 'erreur': b.get('erreur') or a.get('erreur')}
                L.append(e)
                if 'pire_en_jeu_ms' not in b:
                    alertes.append(e)
                continue
            # temps réel : bruit fort. Plus lent = pire image en jeu +2×seuil ET +100 ms, ou programmes compilés en jeu en hausse
            va, vb = a['pire_en_jeu_ms'] or 0, b['pire_en_jeu_ms'] or 0
            d = (vb - va) / max(1, va) * 100
            pa, pb = a.get('programmes_en_jeu') or 0, b.get('programmes_en_jeu') or 0
            # programmes compilés en jeu : le signal le plus sûr ; il prime, s'il va dans le même sens à CHAQUE tour (pas un 0 ↔ 1 de hasard)
            pp = [(x, y) for x, y in zip(a.get('valeurs_prog') or [], b.get('valeurs_prog') or []) if x is not None and y is not None]
            prog_plus = pb > pa and all(y > x for x, y in pp)
            prog_moins = pb < pa and all(y < x for x, y in pp)
            tp = [(x, y) for x, y in zip(a.get('valeurs') or [], b.get('valeurs') or []) if x is not None and y is not None]
            t_plus = d > 2 * seuil and vb - va > 100 and all(y > x for x, y in tp)
            t_moins = d < -2 * seuil and va - vb > 100 and all(y < x for x, y in tp)
            # le temps net (chaque tour, +2×seuil et +100 ms) prime : moins de programmes mais un gel 2× plus long reste « plus lent »
            # (19/11, Bannières entree_combat 3420 → 7292 ms, programmes 4 → 1 : était annoncé « plus rapide »)
            verdict = ('plus lent' if t_plus or (prog_plus and not t_moins) else
                       'plus rapide' if t_moins or prog_moins else 'égal (bruit)')
            e = {'appareil': an, 'scene': 'gel ' + g, 'avant_ms': va, 'apres_ms': vb, 'ecart_pct': round(d, 1), 'bruit_pct': None,
                 'programmes_en_jeu': [pa, pb], 'verdict': verdict}
            L.append(e)
            if e['verdict'] == 'plus lent':
                alertes.append(e)
    return L, alertes


def tableau(L):
    t = [f"{'appareil':10s} {'scène':22s} {'avant':>9s} {'après':>9s} {'écart':>8s} {'bruit':>6s}  verdict   (ms par image en moyenne, plus bas = mieux)"]
    for e in L:
        br = f"{e['bruit_pct']:.0f} %" if e.get('bruit_pct') is not None else '  -'
        pe = f"   (programmes compilés en jeu {e['programmes_en_jeu'][0]} → {e['programmes_en_jeu'][1]})" if e.get('programmes_en_jeu') else ''
        t.append(f"{e['appareil']:10s} {e['scene'][:22]:22s} {e['avant_ms']:9.2f} {e['apres_ms']:9.2f} {e['ecart_pct']:+7.1f}% {br:>6s}  {e['verdict']}{' — DOUTEUX (robot hors verrou pendant la mesure)' if e.get('douteux') else ''}{' — méthode action différente (sortie d avant le 20/11)' if e.get('methode') else ''}{pe}")
    if any(e.get('action') for e in L):
        t.append('(action = ms par action jusqu\'à l\'affichage, vide déduit)')
    if any(e['scene'].startswith('gel ') for e in L):
        t.append('(gel = pire image EN JEU après le changement, temps réel, préparation annoncée exclue)')
    return '\n'.join(t)


def lire_args(argv):
    o = {'profil': False, 'groupes': None, 'images': None, 'tours': None, 'scenes': None, 'appareils': None, 'plafond': False, 'cpu': None, 'construire': False, 'seuil': None, 'sans_verrou': False, 'attente_max': None, 'attente_navigateurs': None,
         'strict': False, 'sans_gels': False, 'gels': None, 'avant': None, 'avant_dossier': None, 'avant_page': None, 'reference': None, 'comparer': None, 'pos': []}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a in ('--plafond', '--construire', '--strict', '--sans-verrou', '--sans-gels', '--profil'):
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
    if any(a in ('-h', '--help', '-?', '--aide') for a in argv):  # avant le 18/11 : « -h » lu comme fichier de réglages → FileNotFoundError
        print(__doc__); return 0
    o = lire_args(argv)
    if o['comparer']:
        a, b = (charger_sortie(f) for f in o['comparer'])
        L, al = ecarts(a, b, float(o['seuil'] or 10))
        print(tableau(L))
        return 1 if (o['strict'] and al) else 0
    if not o['pos']:
        print(__doc__); return 2
    reg = os.path.abspath(o['pos'][0]); sortie = o['pos'][1] if len(o['pos']) > 1 else None
    if not os.path.isfile(reg):
        print(f'banc : réglages introuvables : {o["pos"][0]} (attendu : <jeu>/outils/banc.json ; aide : banc.py -h)'); return 2
    try:
        cfg = json.load(open(reg))
    except ValueError as e:
        print(f'banc : réglages illisibles ({o["pos"][0]}) : {e}'); return 2
    seuil = float(o['seuil'] or cfg.get('seuil', 10))
    scenes = cfg.get('scenes') or []
    gels = cfg.get('gels') or []
    if o['sans_gels']:
        gels = []
    if o['gels']:
        scenes, gels = [], [g for g in (cfg.get('gels') or []) if o['gels'] in ('1', 'tous') or g['nom'] in o['gels'].split(',')]
    if o['scenes']:
        voulu = o['scenes'].split(',')
        scenes = [s for s in scenes if s['nom'] in voulu]
        gels = [g for g in gels if g['nom'] in voulu]
    if not scenes and not gels:
        sys.exit('aucune scène ne correspond : ' + (o['scenes'] or o['gels'] or '(réglages sans "scenes" ni "gels")'))
    try:  # formats communs (appareils.py) : --appareils mac,mac-large@1 même absents des réglages ; nom inconnu = erreur (avant : banc vide)
        appareils = resoudre_appareils(cfg.get('appareils'), o['appareils'], APPAREILS_DEFAUT)
    except ValueError as e:
        sys.exit(f'banc.py : {e}')
    jeu = cfg.get('jeu') or os.path.basename(os.path.dirname(os.path.dirname(reg)))
    o['avant'], etiquette_avant = resoudre_avant(o['avant'], jeu, lambda m: print(m, flush=True))
    avec_avant = bool(o['avant'] or o['avant_dossier'] or o['avant_page'])
    profil = None
    if (o['groupes'] or o['images']) and not o['profil']:
        sys.exit('--groupes / --images vont avec --profil (le nombre d\'images du banc se règle par "images" dans les réglages)')
    if o['profil']:
        if avec_avant:
            sys.exit("--profil : une seule version (pas de --avant) ; pour comparer, profiler chaque version à part")
        if cfg.get('mode', 'fige') != 'fige':
            sys.exit('--profil : mode figé seulement (ce jeu est réglé en "mode": "reel")')
        if not scenes:
            sys.exit('--profil : aucune scène à profiler (les gels ne se profilent pas)')
        if o['tours'] and o['tours'] != '1':
            print('--profil : une seule passe (--tours ignoré)', flush=True)
        gels, o['tours'] = [], '1'
        profil = {'groupes': int(o['groupes']) if o['groupes'] else None, 'images': int(o['images']) if o['images'] else None}
    tours = int(o['tours'] or (2 if avec_avant else 1))
    att_nav = float(o['attente_navigateurs']) if o['attente_navigateurs'] not in (None, '') else None  # None : VERROU_NAVIGATEURS ou 600
    verrou, attente_verrou = (None, 0) if o['sans_verrou'] else verrouiller(attente_max=float(o['attente_max'] or 1800), attente_navigateurs=att_nav)
    nav_debut = (getattr(verrou, 'navigateurs', None) or {}) if verrou else {}
    nav_fin = []
    # veille (19/11 soir) : navigateurs hors verrou relevés EN CONTINU ; le banc attend leur fin entre deux passes et refait une fois
    # une passe ou un gel pendant lequel l'un d'eux a tourné (budget d'attente = --attente-navigateurs ; VERROU_VEILLE=0 : sans veille)
    try:
        budget_calme = att_nav if att_nav is not None else float(os.environ.get('VERROU_NAVIGATEURS') or 600)
    except ValueError:
        budget_calme = 600.0
    # attente déjà faite au départ (verrouiller) comptée dans le budget ; abandonnée une fois (actifs restants) = plus d'attente
    budget_calme = 0.0 if nav_debut.get('restants') else max(0.0, budget_calme - float(nav_debut.get('attendu_s') or 0))
    veille = _verrou.Veille() if verrou and os.environ.get('VERROU_VEILLE', '1') != '0' else None
    refaites = []
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
        assurer_page(cfg, d_ap, p_ap, 'en cours' if not avec_avant else 'APRÈS', o['construire'])
        if avec_avant:
            if o['avant']:
                t1 = time.time()
                tmp = extraire(o['avant'], cfg)
                print(f"  révision {o['avant']} extraite en {time.time()-t1:.1f} s (dépôt complet)", flush=True)
                if hors_depot(cfg):
                    # page construite à un chemin ABSOLU (Cage & Gloire, Hameau, Wall Street : /home/claude/banc/…) : la construction
                    # de l'AVANT écrit au MÊME endroit. Avant le 17/11 au soir, elle écrasait l'APRÈS → avant = après, aucune alerte possible.
                    # Maintenant : l'APRÈS est mis de côté, l'AVANT construit puis copié à part, l'APRÈS remis en place.
                    d_ap, d_av = mettre_de_cote(d_ap, cfg, tmp, p_ap)
                    p_av = p_ap
                else:
                    construire(cfg, tmp)
                    d_av, p_av = lieu(cfg, tmp)
            elif o['avant_page']:
                d_av, p_av = os.path.dirname(os.path.abspath(o['avant_page'])), os.path.basename(o['avant_page'])
            else:
                d_av, p_av, racine = lieu_avant_dossier(cfg, o['avant_dossier'])
                if racine:
                    print(f"  --avant-dossier = racine d'une copie du dépôt : on sert {os.path.relpath(d_av, os.path.abspath(o['avant_dossier']))}/{p_av}", flush=True)
                    if o['construire']:
                        construire(cfg, os.path.abspath(o['avant_dossier']))
            verifier_page(d_av, p_av, 'AVANT')
        b_ap, s = servir(d_ap); serveurs.append(s)
        versions = [('apres' if avec_avant else 'mesure', b_ap, p_ap)]
        if avec_avant:
            b_av, s = servir(d_av); serveurs.append(s)
            versions = [('avant', b_av, p_av)] + versions
        print(f"{'Profil 3D' if profil is not None else 'Banc'} {jeu} · {len(scenes)} scènes{f' + {len(gels)} gel(s) en temps réel' if gels else ''} · {', '.join(appareils)} · {tours} tour(s) · {'' if not scenes else ('temps figé, préparation réelle' if cfg.get('preparation') == 'reelle' else 'temps figé') + ' : coût réel par image, GPU compris' if cfg.get('mode', 'fige') == 'fige' else ('temps réel, plafond 60 img/s' if o['plafond'] else 'temps réel sans plafond')}", flush=True)
        print(f'mesures au fil de l\'eau : {partiel}', flush=True)
        brut = asyncio.run(mesurer_versions(cfg, versions, appareils, scenes, tours, o['plafond'], o['cpu'], partiel, gels, profil,
                                            veille=veille, budget_calme=budget_calme, refaites=refaites))
    except PageAbsente as e:  # page absente : rien à mesurer, on le dit tout de suite (avant : 180 s d'attente par passe)
        print('banc : ' + str(e), flush=True)
        return 2
    finally:
        try:  # navigateurs hors verrou ACTIFS à la fin : un robot lancé pendant la mesure l'a peut-être faussée
            nav_fin = [n for n in _verrou.navigateurs(1.0) if n['actif']] if verrou else []
        except Exception:
            nav_fin = []
        if veille is not None:
            veille.arreter()
        if verrou:
            verrou.close()
        for s in serveurs:
            s.shutdown(); s.server_close()
        if tmp:
            shutil.rmtree(tmp, ignore_errors=True)
    meta = {'jeu': jeu, 'date': datetime.datetime.now().isoformat(timespec='seconds'), 'plafond': o['plafond'], 'tours': tours,
            'cpu': o['cpu'], 'duree_s': round(time.time() - t0), 'charge': {'debut': ch0, 'fin': charge(), **({'heritee': True} if attente_verrou > 1 else {})},
            'attente_verrou_s': round(attente_verrou), **_nav_meta(nav_debut, nav_fin), **({'drapeaux': ['--run-all-compositor-stages-before-draw']} if any(x.get('action') for x in scenes) else {})}
    perturbes = [(v, an, g, x) for v, ps in brut.items() for p in ps for an, pa in p.items()
                 for g, x in ([(None, pa.get('hors_verrou'))] + [(g, r.get('hors_verrou')) for g, r in (pa.get('gels') or {}).items()]) if x]
    pendant = sorted({f"{v}/{an}{' gel ' + g if g else ''} : {x}" for v, an, g, x in perturbes})
    # (appareil, scène) perturbés : une passe perturbée = ses scènes (pas ses gels, mesurés à part) ; un gel = « gel <nom> »
    douteux = {(an, 'gel ' + g) for v, an, g, x in perturbes if g} | {(an, sc) for v, ps in brut.items() for p in ps for an, pa in p.items()
                                                                   if pa.get('hors_verrou') for sc in list(pa.get('scenes') or {}) + ['chrono ' + c for c in pa.get('chronos') or {}]}

    def marquer(L):
        for e in L:
            if (e.get('appareil'), e.get('scene')) in douteux and e.get('verdict') in ('plus lent', 'plus rapide'):
                e['douteux'] = True  # verdict inchangé (lu par verif.py et d'autres) ; signalé dans le tableau
    if refaites:
        meta['passes_refaites'] = refaites
        print(f"\n↻ {len(refaites)} passe(s)/gel(s) refait(s) : un robot HORS VERROU tournait pendant la mesure ({', '.join(refaites[:6])})", flush=True)
    if pendant:
        meta.setdefault('navigateurs_hors_verrou', {})['pendant'] = pendant
        print(f"⚠ mesures encore faites avec un robot HORS VERROU actif (budget d'attente épuisé) : {' | '.join(pendant[:4])} ;"
              " écarts « DOUTEUX » : refaire le banc quand la machine est calme (verrou.py etat)", flush=True)
    code = 0
    if avec_avant:
        av, ap = fusion(brut['avant']), fusion(brut['apres'])
        L, al = ecarts(av, ap, seuil)
        marquer(L)
        out = {**meta, 'avant_rev': etiquette_avant or o['avant_dossier'] or o['avant_page'], 'avant': av, 'apres': ap, 'ecarts': L}
        print('\n' + tableau(L))
        if al:
            print(f"\n⚠ {len(al)} mesure(s) plus lente(s) au-delà de {seuil:.0f} % et du bruit : " + ', '.join(f"{e['appareil']}/{e['scene']} {e['ecart_pct']:+.0f} %" for e in al))
            code = 1 if o['strict'] else 0
        else:
            print(f'\nAucun ralentissement au-delà de {seuil:.0f} % et du bruit.')
    else:
        ap = fusion(brut['mesure'])
        out = {**meta, 'appareils': ap, **({'profil': True} if profil is not None else {})}
        if o['reference']:
            L, al = ecarts(charger_sortie(o['reference']), ap, seuil)
            marquer(L)
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
