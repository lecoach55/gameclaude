# Rapport « vies trop semblables / déséquilibrées » à partir des vies simulées.
#   VIES=/tmp/vies.json CH=1 sh outils/sim.sh 4000 random > /tmp/sim.txt
#   python3 outils/rapport_vies.py /tmp/vies.json [/tmp/sim.txt] > rapport.md
import sys,json,random,math,collections,re
V=json.load(open(sys.argv[1]));N=len(V);random.seed(1)
avg=lambda a:sum(a)/len(a) if a else 0
def jac(a,b):
    a,b=set(a),set(b);return len(a&b)/max(1,len(a|b))
out=[]
P=lambda *x:out.append(' '.join(str(y) for y in x))
P(f"# Rapport des vies simulées ({N} vies)\n")
# --- 1. ressemblance
pairs=[(random.randrange(N),random.randrange(N)) for _ in range(20000)];J=[jac(V[i]['ev'],V[j]['ev']) for i,j in pairs if i!=j]
J.sort();P("## 1. Vies trop semblables\n")
P(f"- Ressemblance des événements entre deux vies au hasard (Jaccard) : médiane {J[len(J)//2]:.2f}, 90e centile {J[int(len(J)*.9)]:.2f}, part > 0,6 : {100*sum(x>.6 for x in J)/len(J):.1f} %")
sig=lambda v:(v['t'],v['j'],v['ed'],min(v['k'],3),v['pa'],v['a']//10,bool(v['ab']))
cs=collections.Counter(sig(v) for v in V)
P(f"- Profils « pays riche/pauvre × métier × études × enfants × couple × décennie de mort × exil » : {len(cs)} profils distincts ; le plus courant couvre {100*cs.most_common(1)[0][1]/N:.1f} % des vies {cs.most_common(1)[0][0]}")
seqs=collections.Counter(tuple(sorted(v['ev']))[:0] or tuple(v['ev'][:6]) for v in V)
# déroulés identiques : même suite des 6 premiers événements
dup=sum(c for s,c in seqs.items() if c>1)
P(f"- Débuts de vie identiques (6 premiers événements dans le même ordre) : {100*dup/N:.1f} % des vies partagent leur début avec une autre")
ev=collections.Counter(e for v in V for e in set(v['ev']))
P("- Événements quasi systématiques (> 50 % des vies) : "+", ".join(f"{e} {100*c/N:.0f} %" for e,c in ev.most_common() if c/N>.5))
P("- Événements quasi absents (< 1 % des vies) : "+", ".join(f"{e} {100*c/N:.1f} %" for e,c in sorted(ev.items(),key=lambda x:x[1]) if c/N<.01))
nev=[len(v['ev']) for v in V];P(f"- Événements distincts par vie : moyenne {avg(nev):.1f}, vies avec ≤ 5 événements : {100*sum(n<=5 for n in nev)/N:.1f} % (surtout morts jeunes : âge moyen {avg([v['a'] for v in V if len(v['ev'])<=5]):.0f})")
jobs=collections.Counter(v['j'] for v in V);P("- Métier final : "+", ".join(f"{k or 'aucun'} {100*c/N:.0f} %" for k,c in jobs.most_common()))
cz=collections.Counter(re.sub(r'(entouré.? des tiens|seul.? dans la nuit|ton |ta |, )','',v['c']).strip() for v in V)
P("- Causes de mort les plus fréquentes : "+", ".join(f"{k} {100*c/N:.0f} %" for k,c in cz.most_common(6)))
# --- 2. déséquilibres
P("\n## 2. Déséquilibres\n")
for lab,key in [("revenu du pays (1 pauvre → 4 riche)",'t'),("richesse de la famille (0 → 2)",'w'),("sexe",'sx')]:
    g=collections.defaultdict(list)
    for v in V:g[v[key]].append(v)
    P(f"- Par {lab} : "+" ; ".join(f"{k}: score {avg([x['s'] for x in L]):.1f}, âge {avg([x['a'] for x in L]):.0f} (n={len(L)})" for k,L in sorted(g.items(),key=lambda x:str(x[0]))))
g=collections.defaultdict(list)
for v in V:
    for t in v['tr']:g[t].append(v['s'])
tr=sorted((avg(L),t) for t,L in g.items());P(f"- Traits : du moins bon {tr[0][1]} ({tr[0][0]:.1f}) au meilleur {tr[-1][1]} ({tr[-1][0]:.1f}) — écart {tr[-1][0]-tr[0][0]:.1f} pts")
ach=collections.Counter(a for v in V for a in v['ac']);P("- Succès : "+", ".join(f"{k} {100*c/N:.1f} %" for k,c in ach.most_common()))
G=[v['g'] for v in V if v['a']>=18];names="Santé Bonheur Aisance Savoir Liens".split()
for i,n in enumerate(names):
    col=[x[i] for x in G];P(f"- Jauge {n} en fin de vie (adultes) : moyenne {avg(col):.0f}, à 0 : {100*sum(c<=0 for c in col)/len(col):.0f} %, à 100 : {100*sum(c>=100 for c in col)/len(col):.0f} %")
# --- 3. choix dominants (sortie CH de sim.sh)
if len(sys.argv)>2:
    P("\n## 3. Choix à fort écart de score (n ≥ 150, écart ≥ 6 pts entre options d'un même événement)\n")
    for line in open(sys.argv[2]):
        if ': ' not in line or ' n=' not in line:continue
        evn,rest=line.split(': ',1);opts=[]
        for o in rest.strip().split(' ; '):
            m=re.match(r'(.*) n=(\d+) ok=(\d+)% Δ=(-?[\d.]+)',o)
            if m:opts.append((m.group(1),int(m.group(2)),int(m.group(3)),float(m.group(4))))
        opts=[o for o in opts if o[1]>=150]
        if len(opts)>=2:
            hi=max(opts,key=lambda o:o[3]);lo=min(opts,key=lambda o:o[3])
            if hi[3]-lo[3]>=6:P(f"- {evn} : « {hi[0]} » {hi[3]:+.1f} vs « {lo[0]} » {lo[3]:+.1f} (n={hi[1]}/{lo[1]})")
print('\n'.join(out))
