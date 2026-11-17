# ===== Atelier : fonctions communes pour tester n'importe quel jeu web (Playwright + Chromium sans écran) =====
# from atelier import serveur, navigateur, page, mesurer, capturer
import asyncio,os,subprocess,time,urllib.request
from playwright.async_api import async_playwright
HORLOGE=os.path.join(os.path.dirname(os.path.abspath(__file__)),'horloge.js')  # temps virtuel + hasard à graine (captures reproductibles)
ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
def serveur(dossier,port=8765):
    """Sert un dossier en HTTP local (relance si besoin). Renvoie l'adresse de base."""
    base=f'http://localhost:{port}/'
    try:urllib.request.urlopen(base,timeout=1);return base
    except Exception:pass
    subprocess.Popen(['python3','-m','http.server',str(port)],cwd=dossier,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True);time.sleep(1);return base
async def navigateur(p,plafond=True):
    """plafond=False : images non plafonnées à 60/s (vsync coupée) — pour un banc qui compare des coûts."""
    return await p.chromium.launch(args=ARGS+([] if plafond else ARGS_SANS_PLAFOND))
async def page(nav,url,largeur=390,hauteur=780,stockage=None,acceleration=None,figer=None):
    """Ouvre une page neuve. stockage={cle:valeur} pré-remplit localStorage ; acceleration=3 accélère le temps (tests sans rendu).
    figer=graine (entier) : horloge virtuelle + Math.random à graine (horloge.js) ; les images ne tournent qu'avec avancer(pg,n).
    Avec figer, ne pas utiliser pg.wait_for_function sans polling=100 (il attend les images) : préférer attendre(pg, condition)."""
    pg=await nav.new_page(viewport={'width':largeur,'height':hauteur});pg.erreurs=[]
    pg.on('pageerror',lambda e:pg.erreurs.append(str(e)[:300]))
    if stockage:
        js=';'.join(f"localStorage.setItem({k!r},{v!r})" for k,v in stockage.items());await pg.add_init_script(f"try{{localStorage.clear();{js}}}catch(e){{}}")
    if figer is not None:await figer_page(pg,figer)
    if acceleration:await pg.add_init_script("(()=>{const r=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>r(t=>cb(t*%s));})()"%acceleration)
    await pg.goto(url,timeout=180000);return pg
# Statistiques d'images au MÊME format que testkit.js (mesures réelles de Victor) : fps (moyenne hors pauses), bas1 (img/s du 1 % le plus lent),
# pire (ms, hors pauses), n ; + pauses / pauseMax si des images > 1 s ont été écartées (onglet caché, chargement), + ms (ms/image moyen), med, p95.
MESURE_JS="""async(ms)=>{const a0=[];let lt=0,on=true;const f=t=>{if(lt)a0.push(t-lt);lt=t;if(on)requestAnimationFrame(f);};requestAnimationFrame(f);await new Promise(r=>setTimeout(r,ms));on=false;
 const a=a0.filter(d=>d<1000),pz=a0.length-a.length;if(!a.length)return{fps:0,bas1:0,pire:0,n:0,pauses:pz,pauseMax:Math.round(Math.max(0,...a0))};const s=a.slice().sort((x,y)=>x-y),m=a.reduce((x,y)=>x+y,0)/a.length,q=k=>s[Math.min(s.length-1,Math.floor(s.length*k))];
 const o={fps:+(1000/m).toFixed(1),bas1:+(1000/q(.99)).toFixed(1),pire:+s[s.length-1].toFixed(1),n:a.length,ms:+m.toFixed(2),med:+q(.5).toFixed(2),p95:+q(.95).toFixed(2)};if(pz){o.pauses=pz;o.pauseMax=Math.round(Math.max(...a0));}return o;}"""
ARGS_SANS_PLAFOND=['--disable-gpu-vsync','--disable-frame-rate-limit']  # requestAnimationFrame n'est plus bloqué à 60 img/s : on mesure le COÛT d'une image
async def mesurer(pg,ms=5000):
    """Mesure les vraies images par seconde dans la page (rendu logiciel ici : valeur RELATIVE, utile pour comparer deux versions).
    Renvoie {fps, bas1, pire, n, ms, med, p95[, pauses, pauseMax]} : mêmes clés que les mesures_* de testkit.js (fps, bas1, pire, n, pauses).
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
