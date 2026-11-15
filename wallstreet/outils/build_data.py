import json,math,sys
sys.path.insert(0,'.')
from meta import NAMES
c=json.load(open('calib.json')); m=json.load(open('market.json'))
# PER, rendement dividende %, croissance BPA % (ordres de grandeur début 2018)
F="""AAPL 17 1.5 10|MSFT 28 1.8 12|AMZN 90 0 25|GOOGL 30 0 15|FB 28 0 25|NFLX 100 0 35|NVDA 45 0.3 30|INTC 15 2.5 6|AMD 60 0 30|CSCO 16 3 4|ORCL 17 1.6 6|IBM 11 4 1|ADBE 45 0 22|CRM 80 0 25|QCOM 18 4 4|MU 6 0 10|PYPL 45 0 18|EBAY 18 0 7|EA 30 0 12|ATVI 35 0.5 14|DIS 16 1.6 7|NKE 30 1.2 10|SBUX 25 2 10|MCD 22 2.5 7|KO 22 3.4 4|PEP 21 3 5|PG 20 3.3 4|WMT 21 2.2 4|TGT 13 3.5 3|HD 22 2 10|COST 30 1 8|CMG 45 0 15|JPM 14 2.2 8|BAC 14 1.8 9|GS 12 1.2 7|MS 13 1.8 8|C 12 1.8 8|WFC 13 2.9 5|V 32 0.7 15|MA 33 0.6 16|AXP 16 1.4 8|BRK.B 20 0 7|XOM 20 4 5|CVX 22 3.8 5|SLB 30 2.8 8|CHK 8 0 0|BA 25 2 9|CAT 20 2 8|GE 18 3 -2|MMM 23 2.4 7|LMT 20 2.3 8|UPS 20 3 7|F 7 5 0|GM 6 3.8 2|JNJ 17 2.7 6|PFE 13 3.7 3|MRK 15 3.4 4|ABBV 14 3.5 10|AMGN 14 3 4|GILD 9 3 -3|BIIB 14 0 4|UNH 21 1.3 12|CVS 11 2.8 4|LLY 20 2.6 8|T 9 5.5 1|VZ 11 4.8 1|CMCSA 17 1.8 8|TWX 15 1.8 5|CBS 13 1.3 6|PCLN 25 0 15|MAR 25 1 10|TRIP 35 0 5|WYNN 30 1.5 10|MGM 20 1.4 8|DAL 10 2.2 5|AAL 9 0.9 3|LUV 13 1 6|EFX 22 1.3 8|HPQ 11 2.6 5|MAT 25 0 -5|HAS 18 2.5 6|KHC 14 3.5 2|FCX 12 1 10|NEM 25 1.5 3"""
fund={x.split()[0]:list(map(float,x.split()[1:])) for x in F.split('|')}
# cyclicité, sensibilité aux taux (+ = pénalisé par la hausse), sensibilité au pétrole
SEC={"Technologie":(0.9,5,0),"Semi-conducteurs":(1.4,5,0),"Distribution":(0.7,3,-0.1),"Médias":(0.8,3,0),
"Finance":(1.0,1,0),"Banque":(1.3,-3,0),"Jeux vidéo":(0.6,4,0),"Consommation":(0.3,5,-0.05),"Restauration":(0.6,3,-0.05),
"Énergie":(1.2,2,0.65),"Industrie":(1.3,3,-0.05),"Transport":(1.4,3,-0.3),"Automobile":(1.5,3,-0.1),"Santé":(0.2,3,0),
"Télécoms":(0.3,6,0),"Tourisme":(1.4,3,-0.2),"Matières premières":(1.6,2,0.35)}
st={}
for t,(n,s) in NAMES.items():
    k=c['stocks'][t]; series=[v for v in m['px'][t] if v]
    idio=k['idio']; j=k['jump']
    diff=math.sqrt(max(idio**2-4*j*j,(0.55*idio)**2))
    pe,dy,g=fund[t]
    st[t]=dict(n=n,s=s,b=k['beta'],i=round(diff,4),sg=k['sg'],j=j,p=series[-1],pe=pe,dy=dy/100,g=g/100,vol=k['vol'])
sec={s:dict(v=c['secvol'][s],cyc=a,rs=b,oil=o) for s,(a,b,o) in SEC.items()}
D=dict(stocks=st,sectors=sec,market=c['market'])
json.dump(D,open('simdata.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(json.dumps(D)))
