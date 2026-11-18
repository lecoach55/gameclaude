# ===== Atelier : fonctions communes pour tester n'importe quel jeu web (Playwright + Chromium sans écran) =====
# from atelier import serveur, navigateur, page, mesurer, capturer
import asyncio,os,subprocess,sys,time,urllib.error,urllib.parse,urllib.request
from playwright.async_api import async_playwright
HORLOGE=os.path.join(os.path.dirname(os.path.abspath(__file__)),'horloge.js')  # temps virtuel + hasard à graine (captures reproductibles)
if os.path.dirname(os.path.abspath(__file__)) not in sys.path:sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from routes import brancher as brancher_routes, resume as resume_routes, three_local  # Three.js du CDN servi en local
ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
# Serveur des outils : comme « python3 -m http.server » (listes de dossiers, types MIME), muet, et qui donne son dossier et son pid sur /__atelier_dossier.
SERVEUR_PY = r"""import functools,http.server,os,sys
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a):pass
    def do_GET(self):
        if self.path=='/__atelier_dossier':
            b=(os.path.realpath(sys.argv[2])+'\n'+str(os.getpid())).encode();self.send_response(200);self.send_header('Content-Type','text/plain; charset=utf-8')
            self.send_header('Content-Length',str(len(b)));self.end_headers();self.wfile.write(b);return
        super().do_GET()
http.server.ThreadingHTTPServer(('',int(sys.argv[1])),functools.partial(H,directory=sys.argv[2])).serve_forever()
"""
_SERVEURS=[]  # serveurs lancés par CE processus : fermer() les arrête ; ceux d'un dossier temporaire s'arrêtent seuls à la sortie
def _refus(e):
    r=getattr(e,'reason',e);return isinstance(r,ConnectionRefusedError)
def _qui_sert(base,dossier):
    """('libre'|'meme'|'autre'|'perime', pid). libre = rien n'écoute ; meme = sert CE dossier ; autre = un AUTRE dossier (copie « avant »,
    autre jeu) ou un serveur muet/inconnu ; perime = serveur d'atelier dont le dossier n'existe plus (dossier temporaire effacé) : à remplacer."""
    try:
        r=urllib.request.urlopen(base+'__atelier_dossier',timeout=2).read().decode().split('\n')
        d,pid=r[0],(int(r[1]) if len(r)>1 and r[1].isdigit() else None)
        if d==os.path.realpath(dossier):return 'meme',pid
        return ('perime' if pid and not os.path.isdir(d) else 'autre'),pid
    except urllib.error.HTTPError:pass  # 404 : ancien serveur « python3 -m http.server » → on compare des fichiers témoins
    except Exception as e:return ('libre' if _refus(e) else 'autre'),None  # délai dépassé, réponse bizarre : on n'y touche pas
    racine=[f for f in sorted(os.listdir(dossier)) if os.path.isfile(os.path.join(dossier,f)) and not f.startswith('.') and os.path.getsize(os.path.join(dossier,f))<=2_000_000]
    temoins=sorted(racine,key=lambda f:(f!='index.html',f))[:6]
    if not temoins:return 'autre',None  # rien pour vérifier : on ne réutilise pas
    for f in temoins:
        try:
            if urllib.request.urlopen(base+urllib.parse.quote(f),timeout=5).read()!=open(os.path.join(dossier,f),'rb').read():return 'autre',None
        except Exception:return 'autre',None
    return 'meme',None
def serveur(dossier,port=8765):
    """Sert un dossier en HTTP local et renvoie l'adresse de base À UTILISER (base+'index.html').
    Réutilise un serveur déjà ouvert seulement s'il sert CE dossier (avant : n'importe lequel → mesures avant/après faites sur la même copie
    sans le voir). Si le port sert un autre dossier, prend le port libre suivant et le dit sur la sortie d'erreur. Un serveur d'atelier
    dont le dossier a été effacé est arrêté et son port repris. Les serveurs d'un dossier sous /tmp (copies temporaires, brouillon)
    s'arrêtent à la fin du script qui les a lancés : un autre processus doit appeler serveur() lui-même."""
    dossier=os.path.abspath(dossier)
    for p in range(port,port+40):
        base=f'http://localhost:{p}/';q,pid=_qui_sert(base,dossier)
        if q=='meme':return base
        if q=='perime':
            try:os.kill(pid,15)
            except Exception:pass
            for _ in range(60):
                time.sleep(0.03);q,_p=_qui_sert(base,dossier)
                if q=='libre':break
        if q!='libre':continue
        pr=subprocess.Popen([sys.executable,'-c',SERVEUR_PY,str(p),dossier],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True)
        for _ in range(150):
            time.sleep(0.03);q,_p=_qui_sert(base,dossier)
            if q!='libre' or pr.poll() is not None:break
        if q=='meme':
            _SERVEURS.append((pr,dossier))
            if p!=port:print(f'atelier.serveur : le port {port} sert un autre dossier → {dossier} servi sur le port {p} (utiliser l\'adresse renvoyée)',file=sys.stderr)
            return base
        if pr.poll() is None:pr.kill()
    raise RuntimeError(f'atelier.serveur : aucun port libre de {port} à {port+39} pour {dossier}')
def fermer(dossier=None):
    """Arrête les serveurs lancés par ce processus (tous, ou celui d'un dossier)."""
    for pr,d in list(_SERVEURS):
        if dossier is None or os.path.abspath(dossier)==d:
            try:pr.terminate();pr.wait(3)
            except Exception:pass
            _SERVEURS.remove((pr,d))
import atexit as _atexit,tempfile as _tempfile
@_atexit.register
def _fermer_temporaires():
    tmp=os.path.realpath(_tempfile.gettempdir())+os.sep
    for pr,d in list(_SERVEURS):
        if os.path.realpath(d).startswith(tmp):fermer(d)
async def navigateur(p,plafond=True):
    """plafond=False : images non plafonnées à 60/s (vsync coupée) — pour un banc qui compare des coûts."""
    return await p.chromium.launch(args=ARGS+([] if plafond else ARGS_SANS_PLAFOND))
async def page(nav,url,largeur=390,hauteur=780,stockage=None,acceleration=None,figer=None,tactile=False,routes=None):
    """Ouvre une page neuve. stockage={cle:valeur} pré-remplit localStorage ; acceleration=3 accélère le temps (tests sans rendu).
    figer=graine (entier) : horloge virtuelle + Math.random à graine (horloge.js) ; les images ne tournent qu'avec avancer(pg,n).
    Avec figer, ne pas utiliser pg.wait_for_function sans polling=100 (il attend les images) : préférer attendre(pg, condition).
    tactile=True : vrai téléphone (has_touch, is_mobile : écran tactile, pg.touchscreen.tap, meta viewport respectée) ; défaut : souris.
    routes : Three.js chargé sur jsDelivr/unpkg est servi en local (routes.py, copie téléchargée une fois) ; {préfixe: dossier} en plus,
    routes=False pour couper. Journal des fichiers servis / manquants : pg.routes (resume_routes(pg.routes) pour l'afficher)."""
    if tactile:
        ctx=await nav.new_context(viewport={'width':largeur,'height':hauteur},has_touch=True,is_mobile=True,device_scale_factor=1)
        pg=await ctx.new_page()
        async def _fin(*_):
            try:await ctx.close()
            except Exception:pass  # navigateur déjà fermé
        pg.on('close',lambda *_:asyncio.ensure_future(_fin()))  # le contexte part avec la page
    else:
        pg=await nav.new_page(viewport={'width':largeur,'height':hauteur})
    pg.erreurs=[];pg.routes=await brancher_routes(pg,routes)
    pg.on('pageerror',lambda e:pg.erreurs.append(str(e)[:300]))
    if stockage:
        js=';'.join(f"localStorage.setItem({k!r},{v!r})" for k,v in stockage.items());await pg.add_init_script(f"try{{localStorage.clear();{js}}}catch(e){{}}")
    if figer is not None:await figer_page(pg,figer)
    if acceleration:await pg.add_init_script("(()=>{const r=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>r(t=>cb(t*%s));})()"%acceleration)
    await pg.goto(ajouter_params(url),timeout=180000);return pg
def ajouter_params(url,params=None):
    """Ajoute à l'adresse les paramètres de la variable d'environnement ATELIER_PARAMS (ex. « v3d=0&q3d=0 ») : un robot propre au jeu
    qui ouvre ses pages par atelier.page() se règle sans être modifié (ATELIER_PARAMS=v3d=0 python3 bannieres/outils/parcours.py 6).
    Un paramètre déjà dans l'adresse est remplacé ; l'ancre (#…) reste à la fin."""
    params=os.environ.get('ATELIER_PARAMS','') if params is None else params
    params=params.strip().lstrip('?&')
    if not params or url.startswith(('data:','about:','blob:','javascript:')):return url
    base,_,ancre=url.partition('#');chemin,_,req=base.partition('?')
    nouveaux=[p for p in params.split('&') if p]
    cles={p.split('=',1)[0] for p in nouveaux}
    garde=[p for p in req.split('&') if p and p.split('=',1)[0] not in cles]
    return chemin+'?'+'&'.join(garde+nouveaux)+('#'+ancre if ancre else '')
# Statistiques d'images au MÊME format que testkit.js (mesures réelles de Victor) : fps (moyenne hors pauses), bas1 (img/s du 1 % le plus lent),
# pire (ms, hors pauses), n ; + pauses / pauseMax si des images > 1 s ET > 8× la médiane ont été écartées (onglet caché, chargement),
# + lent:true si l'image médiane dépasse 125 ms (images > 1 s alors gardées : appareil très lent), + ms (ms/image moyen), med, p95.
MESURE_JS="""async(ms)=>{const a0=[];let lt=0,on=true;const f=t=>{if(lt)a0.push(t-lt);lt=t;if(on)requestAnimationFrame(f);};requestAnimationFrame(f);await new Promise(r=>setTimeout(r,ms));on=false;
 if(!a0.length)return{fps:0,bas1:0,pire:0,n:0};const o0=a0.slice().sort((x,y)=>x-y),seuil=Math.max(1000,8*o0[(o0.length-1)>>1]);const a=a0.filter(d=>d<seuil),pz=a0.length-a.length;const s=a.slice().sort((x,y)=>x-y),m=a.reduce((x,y)=>x+y,0)/a.length,q=k=>s[Math.min(s.length-1,Math.floor(s.length*k))];
 const o={fps:+(1000/m).toFixed(1),bas1:+(1000/q(.99)).toFixed(1),pire:+s[s.length-1].toFixed(1),n:a.length,ms:+m.toFixed(2),med:+q(.5).toFixed(2),p95:+q(.95).toFixed(2)};if(pz){o.pauses=pz;o.pauseMax=Math.round(Math.max(...a0));}if(seuil>1000)o.lent=true;return o;}"""
ARGS_SANS_PLAFOND=['--disable-gpu-vsync','--disable-frame-rate-limit']  # requestAnimationFrame n'est plus bloqué à 60 img/s : on mesure le COÛT d'une image
async def mesurer(pg,ms=5000):
    """Mesure les vraies images par seconde dans la page (rendu logiciel ici : valeur RELATIVE, utile pour comparer deux versions).
    Renvoie {fps, bas1, pire, n, ms, med, p95[, pauses, pauseMax, lent]} : mêmes clés que les mesures_* de testkit.js (fps, bas1, pire, n, pauses).
    lent:true = image médiane > 125 ms : les images > 1 s comptent alors (seules celles > 8× la médiane sont des pauses).
    Avec navigateur(p, plafond=False) les images ne sont plus plafonnées à 60/s : fps devient comparable même pour une scène légère."""
    return await pg.evaluate(MESURE_JS,ms)
async def capturer(pg,chemin):
    os.makedirs(os.path.dirname(chemin) or '.',exist_ok=True);await pg.screenshot(path=chemin)
async def figer_page(pg,graine=12345):
    """Injecte horloge.js dans une page Playwright pas encore chargée (utilisable sans le reste de l'atelier)."""
    await pg.add_init_script(f"window.__HORLOGE_GRAINE={int(graine)};");await pg.add_init_script(path=HORLOGE)
async def avancer(pg,images=60,pas=1000/60):
    """Joue exactement `images` images de `pas` ms en temps virtuel (page ouverte avec figer=…). Renvoie {t, images, enAttente}."""
    return await pg.evaluate("([n,p])=>window.__horloge.avancer(n,p)",[images,pas])
async def attendre(pg,condition,images_par_pas=5,pas=1000/60,delai=60):
    """Page figée : joue des images jusqu'à ce que `condition` (expression JS) soit vraie. Lève TimeoutError après `delai` s réelles."""
    t0=time.time()
    while not await pg.evaluate(f"()=>!!({condition})"):
        if time.time()-t0>delai:raise TimeoutError('attendre : condition jamais vraie : '+condition)
        await avancer(pg,images_par_pas,pas)
# Clics robustes et contenus coupés (sonde.py) : await cliquer(pg,'Jouer'), await debordements(pg)
import sys as _sys
if os.path.dirname(os.path.abspath(__file__)) not in _sys.path:_sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from sonde import cliquer, debordements, boutons, resume, ClicSansEffet  # noqa: E402
