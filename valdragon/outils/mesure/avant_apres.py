#!/usr/bin/env python3
"""Avant / après automatique : compare le jeu en cours (ce dossier) à une version enregistrée sur GitHub.
usage : python3 avant_apres.py [révision=HEAD] [niveau=1] [scènes perf="explo F2,explo F6,combat"]
- extrait valdragon/jeu de la révision demandée du dépôt /home/claude/gameclaude dans /tmp/vd_avant,
  la construit et la sert sur le port 8766 (le jeu en cours reste sur 8765) ;
- capture les 6 scènes de référence des deux côtés, mêmes graines ;
- mesure le banc sur les mêmes scènes, côte à côte et dans la même minute (écarts fiables malgré le rendu logiciel).
Produit avant_apres/planche.jpg (AVANT au-dessus, APRÈS dessous) et avant_apres/perf.txt."""
import subprocess,sys,os,json,time,shutil
from PIL import Image,ImageDraw
REV=sys.argv[1] if len(sys.argv)>1 else 'HEAD';LVL=sys.argv[2] if len(sys.argv)>2 else '1';SC=sys.argv[3] if len(sys.argv)>3 else 'explo F2,explo F6,combat'
REPO='/home/claude/gameclaude';OLD='/tmp/vd_avant';OUT='avant_apres';os.makedirs(OUT,exist_ok=True);HERE=os.getcwd()
def sh(c,**k):return subprocess.run(c,shell=True,capture_output=True,text=True,**k)
shutil.rmtree(OLD,ignore_errors=True);os.makedirs(OLD)
r=sh(f"git -C {REPO} archive {REV} valdragon/jeu | tar -x -C {OLD} --strip-components=2")
if r.returncode:print('révision introuvable :',r.stderr);sys.exit(1)
os.symlink(os.path.join(HERE,'node_modules'),os.path.join(OLD,'node_modules'))
print('construction de la version',REV,sh('python3 build.py local',cwd=OLD).stdout.strip())
srv=subprocess.Popen([sys.executable,'-m','http.server','8766','-d',OLD],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1.5)
if sh("pgrep -f 'http.server 8765'").returncode:sh('sh srv.sh');time.sleep(1.5)
try:
    env={**os.environ,'VD_URL':'http://localhost:8766/index_local.html'}
    for nom,url in [('avant','http://localhost:8766/index_local.html'),('apres','http://localhost:8765/index_local.html')]:
        e={**os.environ,'VD_URL':url};print('captures',nom,flush=True)
        subprocess.run(f'python3 captures.py {OUT}/{nom} {LVL}',shell=True,env=e,capture_output=True)
    perf={}
    for nom,url in [('avant','http://localhost:8766/index_local.html'),('apres','http://localhost:8765/index_local.html')]:
        e={**os.environ,'VD_URL':url};print('banc',nom,flush=True)
        subprocess.run(f'python3 perf.py {OUT}/perf_{nom}.json {LVL} "{SC}"',shell=True,env=e,capture_output=True)
        try:perf[nom]=json.load(open(f'{OUT}/perf_{nom}.json'))
        except Exception:perf[nom]={}
finally:srv.terminate()
# planche
ts=['explo_F2','explo_F6','explo_F10','explo_F14','combat_F6','boss_F8'];rows=[]
for nom in ['avant','apres']:
    ims=[Image.open(f'{OUT}/{nom}/{t}.png').convert('RGB') for t in ts if os.path.exists(f'{OUT}/{nom}/{t}.png')]
    if not ims:continue
    w,h=ims[0].size;r=Image.new('RGB',(w*len(ims),h+26),(14,12,10));d=ImageDraw.Draw(r);[r.paste(im,(i*w,26)) for i,im in enumerate(ims)]
    d.text((8,6),('AVANT ('+REV+')') if nom=='avant' else 'APRÈS (dossier de travail)',fill=(255,220,150));rows.append(r)
if rows:
    c=Image.new('RGB',(rows[0].width,sum(r.height for r in rows)));y=0
    for r in rows:c.paste(r,(0,y));y+=r.height
    c.thumbnail((2400,2400));c.save(f'{OUT}/planche.jpg',quality=85)
L=[]
for k in perf.get('apres',{}):
    a=perf.get('avant',{}).get(k);b=perf['apres'][k]
    if a:L.append(f"{k:14s} ms {a['ms']:6.0f} → {b['ms']:6.0f} ({(b['ms']-a['ms'])/a['ms']*100:+.0f} %)  appels {a['calls']} → {b['calls']}  triangles {a['tris']} → {b['tris']} ({(b['tris']-a['tris'])/max(1,a['tris'])*100:+.0f} %)")
for nom in ['avant','apres']:
    try:
        l=json.load(open(f'{OUT}/{nom}/lisibilite.json'));L.append(f"lisibilité {nom} : bord moyen {sum(v.get('bord',0) for v in l.values())/len(l):.1f}")
    except Exception:pass
open(f'{OUT}/perf.txt','w').write('\n'.join(L));print('\n'.join(L));print('planche :',os.path.abspath(f'{OUT}/planche.jpg'))
