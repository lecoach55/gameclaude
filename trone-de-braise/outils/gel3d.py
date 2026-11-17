#!/usr/bin/env python3
"""Gel de compilation au changement de qualité dans le donjon 3D (temps réel, rendu logiciel).
usage : python3 trone-de-braise/outils/gel3d.py [racine_du_depot] [sortie.json]
Démarre en Normale (comme le Mac de Victor), entre en expédition (entrée du banc_donjon3d.json), puis passe en Haute
et mesure : programmes de shader avant / après, programmes compilés À LA PREMIÈRE IMAGE MONTRÉE (ceux qui gèlent l'écran),
pire image EN JEU (hors préparation annoncée, G3.occupe), temps de préparation annoncé (prep_ms). Sans KHR_parallel_shader_compile (rendu logiciel) la compilation reste synchrone :
c'est le nombre de programmes compilés à la 1re image montrée qui prédit le gel sur le Mac."""
import json, sys, os, threading, http.server, functools, socketserver
from playwright.sync_api import sync_playwright
R = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = sys.argv[2] if len(sys.argv) > 2 else None
cfg = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'banc_donjon3d.json')))
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=R)
H.log_message = lambda *a: None
socketserver.TCPServer.allow_reuse_address = True
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), H); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
SONDE = """async(niv)=>{const d=G3._d(),r=d.renderer;const w=ms=>new Promise(k=>setTimeout(k,ms));
 const res={avant:r.info.programs.length,images:[]};let t0=performance.now(),last=t0,firstShown=null,progShown=null;
 const r0=d.renderer.render.bind(d.renderer);
 let shown=false;const comp=d.composer, cr=comp.render.bind(comp);
 comp.render=(dt)=>{const p=r.info.programs.length,a=performance.now();cr(dt);const b=performance.now();if(!shown){shown=true;firstShown=a-t0;res.prog_avant_1re=p;res.prog_apres_1re=r.info.programs.length;res.ms_1re=Math.round(b-a);}};
 let occP=false;res.prep_ms=0;const f=t=>{const n=performance.now(),dt=Math.round(n-last),oc=!!G3.occupe;res.trace=res.trace||[];if(dt>300)res.trace.push([Math.round(n-t0),dt,oc?1:0,occP?1:0]);if(oc||occP)res.prep_ms+=dt;else res.images.push(dt);occP=oc;last=n;if(n-t0<12000)requestAnimationFrame(f);};
 G3.setLevel(niv);const ts=performance.now();res.ms_setLevel=Math.round(ts-t0);requestAnimationFrame(f);
 while(performance.now()-t0<12000)await w(200);comp.render=cr;
 res.apres=r.info.programs.length;res.premiere_image_montree_ms=firstShown&&Math.round(firstShown);res.pire_en_jeu=Math.max(...res.images);
 res.compiles_a_la_1re=res.prog_apres_1re-res.prog_avant_1re;{const q=res.images.slice(-6).sort((a,b)=>a-b);res.regime_ms=q[3];}res.niveau=G3.level;res.mode=G3.mode;delete res.images;return res;}"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 560, 'height': 350})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('vd_q2','1');localStorage.setItem('vd_mute','1')}catch(e){};" + cfg.get('init', ''))
    pg.goto(f'http://127.0.0.1:{port}/trone-de-braise/{cfg["page"]}')
    pg.wait_for_function(cfg['pret'], timeout=180000); pg.wait_for_timeout(1000)
    pg.evaluate(f'({cfg["entree"]})()'); pg.wait_for_timeout(6000)
    pg.evaluate("window.__noAutoQ=1;G3.setLevel(1)"); pg.wait_for_timeout(8000)
    res = pg.evaluate(f'({SONDE})(2)'); res['erreurs'] = errs[:5]
    print(json.dumps(res, ensure_ascii=False))
    if OUT: json.dump(res, open(OUT, 'w'), ensure_ascii=False, indent=1)
    b.close()
srv.shutdown()
