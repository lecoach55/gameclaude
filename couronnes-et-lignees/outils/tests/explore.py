# Testeur automatique : joue au doigt pendant N minutes en touchant au hasard les vrais boutons visibles
# (carte, actions, fiches, événements, cour, conseil, voisins, menus…). Relève les erreurs JavaScript,
# les blocages (rien ne change pendant 60 touches) et ce qui a été couvert.
# usage : python3 explore.py chemin/index.html [minutes=3] [graine=7]
import sys, os, random, json, time
from playwright.sync_api import sync_playwright
html = os.path.abspath(sys.argv[1]); minutes = float(sys.argv[2]) if len(sys.argv) > 2 else 3; rng = random.Random(int(sys.argv[3]) if len(sys.argv) > 3 else 7)
EVITER = ['Nouvelle maison', 'Tirer une autre maison', 'Fonder une nouvelle', 'Abandonner', 'Effets sonores', 'Musique', 'Revoir le guide', 'Mode test', 'Signaler', 'Passer en chronique libre', 'Chronique libre']
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox']+(['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] if os.environ.get('V3D')=='1' else []))
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
    pg.add_init_script("try{if(!sessionStorage.getItem('x')){localStorage.clear();sessionStorage.setItem('x','1')}localStorage.setItem('cl_guide','1');localStorage.setItem('cl_3d','"+('1' if os.environ.get('V3D')=='1' else '0')+"');localStorage.setItem('cl_sound',JSON.stringify({sfx:false,music:false}))}catch(e){}")
    pg.goto('file://' + html); pg.wait_for_timeout(700)
    pg.get_by_text('Fonder la maison').click(); pg.wait_for_timeout(800)
    t0 = time.time(); clics = 0; same = 0; last = ''; vus = {}; parties = 0; ans = set(); blocages = 0
    while time.time() - t0 < minutes * 60:
        st = pg.evaluate("JSON.stringify([S.turn,S.year,!!S.event,tab,document.querySelector('#modal').innerText.length,S.over])")
        if st == last: same += 1
        else: same = 0; last = st
        ans.add(pg.evaluate("S.year"))
        if pg.evaluate("S.over"):
            parties += 1; pg.evaluate("closeM();newGame()"); pg.wait_for_timeout(300)
            if pg.get_by_text('Fonder la maison').count(): pg.get_by_text('Fonder la maison').click(); pg.wait_for_timeout(400)
            continue
        if same > 60:
            blocages += 1; errs.append('BLOCAGE ' + st + ' | ' + pg.evaluate("document.querySelector('#modal').innerText.slice(0,200)")); pg.evaluate("closeM()"); same = 0
        cands = pg.evaluate("""(ev)=>{const v=[...document.querySelectorAll('#modal button, #modal .choice, .bar5 button, .ovl button, #app button, .tabs button, #board path[data-i]')].filter(e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height||r.bottom<0||r.top>innerHeight)return false;if(e.disabled||e.getAttribute('aria-disabled')==='true')return false;const t=(e.innerText||'').trim();return !ev.some(x=>t.includes(x));});
          return v.map((e,i)=>{e.dataset.ex=i;return [(e.innerText||e.getAttribute('aria-label')||e.tagName).trim().split('\\n')[0].slice(0,40),!!e.closest('#modal')];});}""", EVITER)
        if not cands: pg.evaluate("closeM()"); continue
        modal = [i for i, c in enumerate(cands) if c[1]]
        i = rng.choice(modal) if modal and rng.random() < 0.85 else rng.randrange(len(cands))
        nom = cands[i][0] or '?'; vus[nom] = vus.get(nom, 0) + 1
        try: pg.locator(f'[data-ex="{i}"]').first.click(timeout=2000)
        except Exception as e: pass
        clics += 1; pg.wait_for_timeout(rng.choice([60, 120, 250]))
    res = {'minutes': minutes, 'touches': clics, 'parties_finies': parties, 'annees_vues': len(ans), 'boutons_distincts': len(vus), 'blocages': blocages, 'erreurs': errs[:10]}
    print(json.dumps(res, ensure_ascii=False, indent=1))
    print('plus touchés :', sorted(vus.items(), key=lambda x: -x[1])[:15])
    b.close()
