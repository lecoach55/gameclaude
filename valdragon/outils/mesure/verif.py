#!/usr/bin/env python3
"""Vérification complète avant publication — UNE commande, UN rapport.
usage : python3 verif.py [rapide|complet] [dossier_refs]
  rapide  : captures + comparaison + lisibilité + banc (3 scènes) + sauvegarde + scénarios + poids   (~12 min)
  complet : + testeur exhaustif (2 étages), hors ligne, blocages à l'entrée en combat                  (~25 min)
Écrit verif/rapport.html (planche avant/après, chiffres, verdicts) et verif/resume.txt ; code de sortie 1 si un test échoue.
Références : valdragon/references/normale (images + lisibilite.json) et valdragon/mesures/perf_ref.json."""
import subprocess,sys,os,json,time,re,html,shutil
from PIL import Image
MODE=sys.argv[1] if len(sys.argv)>1 else 'rapide'
REFS=sys.argv[2] if len(sys.argv)>2 else '/home/claude/gameclaude/valdragon/references/normale'
PREF=os.path.join(os.path.dirname(REFS.rstrip('/')),'..','mesures','perf_ref.json')
OUT='verif';os.makedirs(OUT,exist_ok=True)
R=[];T0=time.time()
def run(nom,cmd,timeout=900,ok=None):
    t=time.time()
    try:p=subprocess.run(cmd,shell=True,capture_output=True,text=True,timeout=timeout);out=p.stdout+p.stderr;code=p.returncode
    except subprocess.TimeoutExpired:out='DÉLAI DÉPASSÉ';code=-1
    good=(code==0) if ok is None else ok(out,code)
    R.append({'nom':nom,'ok':good,'s':round(time.time()-t),'detail':out[-1500:]});print(('✔' if good else '✘'),nom,f'({round(time.time()-t)} s)',flush=True);return out
# serveur local
if subprocess.run("pgrep -f 'http.server 8765'",shell=True,capture_output=True).returncode!=0:subprocess.run('sh srv.sh',shell=True);time.sleep(2)
run('Construction (local)','python3 build.py local')
# 1. captures + comparaison + lisibilité
run('Captures',f'python3 captures.py {OUT}/cap 1',timeout=900)
cmp=run('Comparaison aux références',f'python3 compare.py {REFS} {OUT}/cap {OUT}/planche.png',ok=lambda o,c:True)
alertes=re.search(r'ALERTES (\d+) / (\d+)',cmp);nal=int(alertes.group(1)) if alertes else -1
lis={};lref={}
try:lis=json.load(open(f'{OUT}/cap/lisibilite.json'));lref=json.load(open(os.path.join(REFS,'lisibilite.json')))
except Exception:pass
# 2. banc
run('Banc (explo F2, F6, combat)',f'python3 perf.py {OUT}/perf.json 1 "explo F2,explo F6,combat"',timeout=900)
perf={};pref={}
try:perf=json.load(open(f'{OUT}/perf.json'))
except Exception:pass
try:pref=json.load(open(PREF))
except Exception:pass
# 3. tests
run('Sauvegarde (cloud + reprise)','python3 sauvegarde.py',ok=lambda o,c:'continue' in o and 'Error' not in o)
run('Scénarios (défaite, respawn, boss, étage 17)','python3 scen.py',ok=lambda o,c:'ERRORS []' in o)
if MODE=='complet':
    run('Testeur exhaustif (étages 1 et 9, 2 min)','python3 explore.py 2 1,9',timeout=900,ok=lambda o,c:'tranche' in o and not re.search(r'(?i)pageerror|uncaught',o))
    run('Blocages (entrée en combat)','python3 blocages.py',timeout=400,ok=lambda o,c:'combat' in o)
# 4. poids + hors ligne
run('Construction (page publiée)','python3 build.py inline')
taille=os.path.getsize('valdragon3d.html')/1048576
R.append({'nom':f'Poids de la page : {taille:.2f} Mio (limite 16)','ok':taille<15.6,'s':0,'detail':''})
if MODE=='complet':run('Hors ligne (page publiée)','python3 hors_ligne.py',timeout=400,ok=lambda o,c:'continue True' in o)
run('Retour au mode local','python3 build.py local')
# rapport
def dperf():
    rows=[]
    for k,v in perf.items():
        o=pref.get(k);f=lambda a,b:(f'{(a-b)/b*100:+.0f} %' if b else '')
        rows.append(f"<tr><td>{k}</td><td>{v['ms']}</td><td>{v['calls']}</td><td>{v['tris']}</td><td>{f(v['ms'],o['ms']) if o else '—'}</td><td>{f(v['calls'],o['calls']) if o else '—'}</td><td>{f(v['tris'],o['tris']) if o else '—'}</td></tr>")
    return ''.join(rows)
def dlis():
    return ''.join(f"<tr><td>{k}</td><td>{v.get('perso')}</td><td>{v.get('entourage')}</td><td>{v.get('bord')}</td><td>{lref.get(k,{}).get('bord','—')}</td></tr>" for k,v in lis.items())
if os.path.exists(f'{OUT}/planche.png'):
    im=Image.open(f'{OUT}/planche.png');im.thumbnail((1400,1400));im.save(f'{OUT}/planche_web.jpg',quality=82)
ok_all=all(r['ok'] for r in R)
H=f"""<!DOCTYPE html><meta charset=utf-8><title>Vérification Valdragon</title><style>body{{font:14px sans-serif;background:#16120e;color:#eadfc8;margin:16px}}td,th{{border-bottom:1px solid #3a3026;padding:3px 8px;text-align:left}}.ok{{color:#8fd08f}}.ko{{color:#ff8a70}}img{{max-width:100%}}pre{{white-space:pre-wrap;font-size:11px;color:#aaa}}</style>
<h2>Vérification {('✔ tout est bon' if ok_all else '✘ problème à regarder')} — {time.strftime('%d/%m %H:%M')} ({MODE}, {round((time.time()-T0)/60)} min)</h2>
<table>{''.join(f"<tr><td class={'ok' if r['ok'] else 'ko'}>{'✔' if r['ok'] else '✘'}</td><td>{html.escape(r['nom'])}</td><td>{r['s']} s</td></tr>" for r in R)}</table>
<h3>Images : {nal} alerte(s) sur 6</h3><p>Une alerte = changement visuel à vérifier ou à assumer (mettre alors à jour les références).</p><img src="planche_web.jpg">
<h3>Banc (niveau Normale, rendu logiciel : comparer les écarts, pas les valeurs)</h3><table><tr><th>scène</th><th>ms</th><th>appels</th><th>triangles</th><th>Δ ms</th><th>Δ appels</th><th>Δ tri</th></tr>{dperf()}</table>
<h3>Lisibilité des personnages</h3><table><tr><th>scène</th><th>perso</th><th>entourage</th><th>bord</th><th>bord (réf.)</th></tr>{dlis()}</table>
<h3>Détails des échecs</h3>{''.join(f"<h4>{html.escape(r['nom'])}</h4><pre>{html.escape(r['detail'])}</pre>" for r in R if not r['ok'])}"""
open(f'{OUT}/rapport.html','w').write(H)
res=[f"{'✔' if r['ok'] else '✘'} {r['nom']}" for r in R]+[f'Images : {nal} alerte(s)']+[f"{k}: {v['ms']} ms, {v['calls']} appels, {v['tris']} tri" for k,v in perf.items()]
open(f'{OUT}/resume.txt','w').write('\n'.join(res));print('\n'.join(res));print('Rapport :',os.path.abspath(f'{OUT}/rapport.html'))
sys.exit(0 if ok_all else 1)
