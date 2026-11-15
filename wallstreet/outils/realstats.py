import json,numpy as np
m=json.load(open('market.json'))
idx=np.array(m['idx']); r=np.diff(np.log(idx))
P=np.array([[np.nan if v is None else v for v in s] for s in m['px'].values()],float)
R=np.diff(np.log(P),axis=1)
ok=~np.isnan(R).any(axis=0)
C=np.corrcoef(R[:,ok]); n=C.shape[0]
avgc=(C.sum()-n)/(n*n-n)
def ac(x,l=1): x=x-x.mean(); return (x[l:]*x[:-l]).sum()/(x*x).sum()
print('avg pairwise corr',round(avgc,3))
print('idx ac1',round(ac(r),3),'ac sq1',round(ac(r**2),3),'ac abs1-20',[round(ac(np.abs(r),l),3) for l in (1,5,20)])
print('days<-2% per yr',round((r<-0.02).sum()/len(r)*252,2),'<-3%',round((r<-0.03).sum()/len(r)*252,2))
# stock 5y return dispersion
tot=np.array([np.nansum(x) for x in R]); print('5y log ret: median',round(np.median(tot),2),'p10',round(np.quantile(tot,.1),2),'p90',round(np.quantile(tot,.9),2),'share negative',round((tot<0).mean(),2))
# skew of stock daily returns
sk=[((x[~np.isnan(x)]-np.nanmean(x))**3).mean()/np.nanstd(x)**3 for x in R]; print('median skew',round(np.median(sk),2))
# cross-sectional dispersion of 1m returns
mr=[]; 
for i in range(21,R.shape[1],21): mr.append(np.nanstd(np.nansum(R[:,i-21:i],axis=1)))
print('1m cross-sec dispersion',round(np.mean(mr),3))
