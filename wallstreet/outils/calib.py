import json,math,sys
import numpy as np
sys.path.insert(0,'.')
from meta import NAMES
m=json.load(open('market.json'))
dates=m['dates']; idx=np.array(m['idx'])
mr=np.diff(np.log(idx))
out={}
R={}
for t,s in m['px'].items():
    a=np.array([np.nan if v is None else v for v in s],float)
    R[t]=np.diff(np.log(a))
# market stats
mstat={'vol':float(mr.std()*math.sqrt(252)),'mu':float(mr.mean()*252),
 'kurt':float(((mr-mr.mean())**4).mean()/mr.var()**2),
 'worst':float(mr.min()),'p01':float(np.quantile(mr,0.01))}
# beta & residual
res={}
for t,r in R.items():
    ok=~np.isnan(r); x=mr[ok]; y=r[ok]
    b=np.cov(x,y)[0,1]/x.var()
    e=y-b*x
    res[t]=(b,np.where(ok,r-b*mr,np.nan),y.mean()*252,y.std()*math.sqrt(252))
secs={}
for t in R: secs.setdefault(NAMES[t][1],[]).append(t)
for sec,ts in secs.items():
    M=np.vstack([res[t][1] for t in ts])
    for t in ts:
        others=[u for u in ts if u!=t]
        if others:
            sf=np.nanmean(np.vstack([res[u][1] for u in others]),axis=0)
            e=res[t][1]; ok=~np.isnan(e)&~np.isnan(sf)
            g=np.cov(sf[ok],e[ok])[0,1]/sf[ok].var()
            g=max(0,min(1.5,g)); ei=e[ok]-g*sf[ok]
            secvol=float(sf[ok].std()*math.sqrt(252))
        else:
            g=0; ei=res[t][1][~np.isnan(res[t][1])]; secvol=0
        sd=ei.std()
        q=np.sort(np.abs(ei))[::-1]
        years=len(ei)/252
        jump=float(q[:int(4*years)].mean())  # ~4 largest per year ~ earnings days
        kurt=float(((ei-ei.mean())**4).mean()/ei.var()**2)
        out[t]=dict(beta=round(float(res[t][0]),3),idio=round(float(sd*math.sqrt(252)),4),sg=round(float(g),3),
           jump=round(jump,4),kurt=round(kurt,1),vol=round(float(res[t][3]),4),mu=round(float(res[t][2]),4))
secvol={}
for sec,ts in secs.items():
    S=np.nanmean(np.vstack([res[t][1] for t in ts]),axis=0); secvol[sec]=round(float(np.nanstd(S)*math.sqrt(252)),4)
json.dump({'market':mstat,'stocks':out,'secvol':secvol},open('calib.json','w'),indent=0)
print(mstat); print(secvol)
for t in ['AAPL','NFLX','KO','JPM','XOM','CHK','AMD','JNJ']: print(t,out[t])
print('last prices',{t:[v for v in m['px'][t] if v][-1] for t in ['AAPL','AMZN','KO']})
