import json,glob,statistics as st
D=[json.load(open(f)) for f in sorted(glob.glob('out_*.json'))]
N=sum(d['N'] for d in D)
def merge(key):
    out={}
    for d in D:
        for k,v in d['X'][key].items(): out.setdefault(k,[]).extend(v) if isinstance(v,list) else out.__setitem__(k,out.get(k,0)+v)
    return out
print("N",N)
tr=merge('trait');print("--- score par trait");[print(f"  {k:13s} {st.mean(v):.1f} (n={len(v)})") for k,v in sorted(tr.items(),key=lambda x:-st.mean(x[1]))]
sx={'m':[],'f':[]}
for d in D:
    for k in 'mf': sx[k]+=d['X']['sex'][k]
print("--- sexe",{k:round(st.mean(v),1) for k,v in sx.items()})
w=[[],[],[]]
for d in D:
    for i in range(3): w[i]+=d['X']['wealth'][i]
print("--- richesse famille",[round(st.mean(x),1) for x in w])
co=merge('country');print("--- pays (score, n)");print("  "+" | ".join(f"{k} {st.mean(v):.0f}" for k,v in sorted(co.items(),key=lambda x:-st.mean(x[1]))))
ach={}
for d in D:
    for k,v in d['X']['ach'].items(): ach[k]=ach.get(k,0)+v
print("--- succès % vies",{k:round(100*v/N,2) for k,v in sorted(ach.items(),key=lambda x:-x[1])})
ah={}
for d in D:
    for k,v in d['X']['ageHist'].items(): ah[int(k)]=ah.get(int(k),0)+v
print("--- âge au décès",{k:f"{100*v/N:.1f}%" for k,v in sorted(ah.items())})
bad={}
for d in D:
    for k,v in d['BAD'].items(): bad[k]=bad.get(k,0)+v
print("--- textes suspects",len(bad));[print("  ",v,k) for k,v in sorted(bad.items(),key=lambda x:-x[1])[:12]]
ev={}
for d in D:
    for k,v in d['M']['evLives'].items(): ev[k]=ev.get(k,0)+v
print("--- événements les plus rares (% vies)",sorted([(k,round(100*v/N,2)) for k,v in ev.items()],key=lambda x:x[1])[:12])
ca={}
for d in D:
    for k,v in d['M']['cause'].items(): ca[k]=ca.get(k,0)+v
print("--- causes",sorted([(k,round(100*v/N,1)) for k,v in ca.items()],key=lambda x:-x[1])[:20])
# choices: dominance on random workers only
ch={}
for d,f in zip(D,sorted(glob.glob('out_*.json'))):
    for k,o in d['M']['choice'].items():
        c=ch.setdefault(k,{'n':0,'s':0,'ok':0,'a':0});[c.__setitem__(x,c[x]+o[x]) for x in c]
byev={}
for k,o in ch.items():
    e,l=k.split(' | ',1)
    if e.startswith('S@'): e=e.split('@')[1][:2]+' '+e
    byev.setdefault(e.split(' ')[0] if not k.startswith('S@') else k.split(' | ')[0][:22],[]).append((l,o))
print("--- choix dominants / inutiles (|Δ| du score moyen entre options)")
rows=[]
for e,L in byev.items():
    L=[(l,o) for l,o in L if o['n']>=200]
    if len(L)<2: continue
    m=[(l,o['s']/o['n'],o['n']) for l,o in L]
    spread=max(x[1] for x in m)-min(x[1] for x in m)
    rows.append((spread,e,m))
for sp,e,m in sorted(rows,reverse=True)[:14]: print(f"  {sp:5.1f} {e}: "+" ; ".join(f"{l[:28]} {s:.1f}" for l,s,n in m))
print("  ...les moins décisifs:")
for sp,e,m in sorted(rows)[:10]: print(f"  {sp:5.1f} {e}: "+" ; ".join(f"{l[:28]} {s:.1f}" for l,s,n in m))
