"""Bulles et alertes de la carte (bugs du 16/11) : python3 outils/tests/bulles.py jeu/index.html [sortie]
1) le conseil .tipx disparaît quand une fenêtre s'ouvre ou qu'on change d'onglet (et revient plus tard) ;
2) la pastille d'alerte (« … prépare l'invasion ») est entièrement visible, ne chevauche pas le conseil,
   et ouvre la liste des alertes. Téléphone (390×844, tactile) et ordinateur (1280×800), 2D et 3D (V3D=1)."""
import os, sys, json
from playwright.sync_api import sync_playwright

page_html = os.path.abspath(sys.argv[1]); out = sys.argv[2] if len(sys.argv) > 2 else '/tmp/bulles'
os.makedirs(out, exist_ok=True)
v3d = os.environ.get('V3D') == '1'
echecs, notes = [], []

def boite(pg, sel):
    return pg.evaluate("s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.left,y:r.top,r:r.right,b:r.bottom,w:innerWidth,h:innerHeight}}", sel)

with sync_playwright() as p:
    br = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    for nom, opts in [('tel', dict(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=1)),
                      ('ordi', dict(viewport={'width': 1280, 'height': 800}))]:
        ctx = br.new_context(**opts); pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.add_init_script("try{if(!sessionStorage.getItem('ok')){sessionStorage.setItem('ok','1');localStorage.clear();localStorage.setItem('cl_3d','" + ('1' if v3d else '0') + "');localStorage.setItem('cl_guide','1');localStorage.setItem('cl_sound',JSON.stringify({sfx:false,music:false}))}}catch(e){}")
        pg.goto('file://' + page_html); pg.wait_for_timeout(1500)
        pg.get_by_text('Fonder la maison').first.click(); pg.wait_for_timeout(1200)
        # un conseil : on force le premier conseil disponible (carte 3D en relief, ou le chantier en 2D)
        pg.evaluate("()=>{if(!(typeof R3!=='undefined'&&R3.on()))S.chantier=3;localStorage.setItem('cl_tips','{}');closeM();tab='plateau';render()}")
        pg.wait_for_timeout(1600)
        if not pg.query_selector('.tipx'): echecs.append(f'{nom}: aucun conseil affiché')
        k = pg.evaluate("()=>{const t=document.querySelector('.tipx');return t&&t.dataset.k}")
        # 1a) une fenêtre s'ouvre (comme un événement ou une terre) : le conseil s'efface
        pg.evaluate("()=>sheet('<h2>Essai</h2><button class=\"choice\" id=\"c1\" onclick=\"window.__c1=1\">Premier choix</button>', true)")
        pg.wait_for_timeout(300)
        if pg.query_selector('.tipx'): echecs.append(f'{nom}: conseil encore visible au-dessus de la fenêtre')
        try: pg.click('#c1', timeout=2000)
        except Exception as e: echecs.append(f'{nom}: 1er choix non touchable ({str(e)[:80]})')
        if not pg.evaluate('window.__c1===1'): echecs.append(f'{nom}: 1er choix sans effet')
        seen = pg.evaluate("()=>JSON.parse(localStorage.getItem('cl_tips')||'{}')")
        if k and seen.get(k): echecs.append(f'{nom}: conseil effacé mais noté comme lu')
        # 1b) il revient une fois la fenêtre fermée, puis s'efface au changement d'onglet
        pg.evaluate("()=>{closeM();render()}"); pg.wait_for_timeout(1600)
        if not pg.query_selector('.tipx'): echecs.append(f'{nom}: conseil non revenu après la fenêtre')
        pg.evaluate("()=>setTab('cour')"); pg.wait_for_timeout(300)
        if pg.query_selector('.tipx'): echecs.append(f'{nom}: conseil resté sur l\'onglet La cour')
        pg.evaluate("()=>setTab('plateau')"); pg.wait_for_timeout(1600)
        # 2) alerte d'invasion
        pg.evaluate("()=>{S.menace=80;S.army=10;render()}"); pg.wait_for_timeout(1600)
        b = boite(pg, '.achip2'); t = boite(pg, '.tipx')
        if not b: echecs.append(f'{nom}: pas de pastille d\'alerte')
        else:
            if b['x'] < 0 or b['y'] < 0 or b['r'] > b['w'] or b['b'] > b['h']: echecs.append(f'{nom}: pastille hors écran {b}')
            if t and not (t['b'] <= b['y'] or t['y'] >= b['b']): echecs.append(f'{nom}: conseil posé sur la pastille')
            txt = pg.inner_text('.achip2')
            notes.append(f"{nom}: pastille « {txt.strip()[:40]} » x {b['x']:.0f}→{b['r']:.0f} y {b['y']:.0f}→{b['b']:.0f} / {b['w']}×{b['h']}" + (f" ; conseil y {t['y']:.0f}→{t['b']:.0f}" if t else ''))
            pg.screenshot(path=f'{out}/{nom}_{"3d" if v3d else "2d"}_alerte.png')
            pg.click('.achip2'); pg.wait_for_timeout(500)
            if 'invasion' not in pg.inner_text('#modal'): echecs.append(f'{nom}: la pastille n\'ouvre pas les alertes')
        if errs: echecs.append(f'{nom}: erreurs JS {errs[:3]}')
        ctx.close()
    br.close()
print('\n'.join(notes))
print(json.dumps({'echecs': echecs}, ensure_ascii=False))
sys.exit(1 if echecs else 0)
