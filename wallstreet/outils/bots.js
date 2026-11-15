// Robots joueurs sur les mêmes marchés : quelles stratégies gagnent ?
const E=require(process.argv[2]||'./engine.js');const D=require('./simdata.json');
const N=+process.argv[3]||12, YEARS=+process.argv[4]||8, CAP=50000, FEE=0.001;
function Bot(name,fn){return{name,fn,cash:CAP,pos:{},fees:0,pro:0,trades:0,mem:{}};}
const P=(G,t)=>E.P(G,t);
function val(G,b){let v=b.cash;for(const t in b.pos)v+=b.pos[t]*P(G,t);return v;}
function buy(G,b,t,amount){const p=P(G,t);const q=Math.floor(Math.min(amount,b.cash)/(p*(1+FEE)));if(q<1)return;const f=Math.max(1,q*p*FEE);if(q*p+f>b.cash)return;b.cash-=q*p+f;b.fees+=f;b.pos[t]=(b.pos[t]||0)+q;b.trades++;}
function sell(G,b,t,q){q=q==null?b.pos[t]:Math.min(q,b.pos[t]||0);if(!q)return;const p=P(G,t),f=Math.max(1,q*p*FEE);b.cash+=q*p-f;b.fees+=f;b.pos[t]-=q;if(!b.pos[t])delete b.pos[t];b.trades++;}
function rebalance(G,b,list){ // vend ce qui n'est pas dans la liste, équipondère la liste
  for(const t in b.pos)if(!list.includes(t))sell(G,b,t);
  if(!list.length)return;const tgt=val(G,b)/list.length;
  list.forEach(t=>{const cur=(b.pos[t]||0)*P(G,t);if(cur>tgt*1.15)sell(G,b,t,Math.floor((cur-tgt)/P(G,t)));});
  list.forEach(t=>{const cur=(b.pos[t]||0)*P(G,t);if(cur<tgt*0.85)buy(G,b,t,tgt-cur);});
}
const firmRate=F=>(F.ok+F.ko)?F.ok/(F.ok+F.ko):0;
const fresh=(G,t)=>{const r=G.st[t].rat,o=[];for(const k in r)if(r[k].day>G.day-126)o.push({k:+k,...r[k]});return o;};
const today=G=>G.news.filter(n=>n.day===G.day);
const POS_RUM=/fusion|relever ses objectifs/;
const bots=()=>[
 Bot('Ne rien faire (cash)',()=>{}),
 Bot('Indice : tout acheter et garder',(G,b,T)=>{if(!b.mem.done){T.forEach(t=>buy(G,b,t,CAP/T.length));b.mem.done=1;}}),
 Bot('Hasard (10 titres / mois)',(G,b,T)=>{if(G.day%21===0){const L=T.slice().sort(()=>Math.random()-0.5).slice(0,10);rebalance(G,b,L);}}),
 Bot('Momentum 6 mois (top 10)',(G,b,T)=>{if(G.day%21===0){const r=t=>{const a=G.st[t].p;return a[a.length-1]/a[a.length-127];};rebalance(G,b,T.slice().sort((x,y)=>r(y)-r(x)).slice(0,10));}}),
 Bot('PER le plus bas (top 10)',(G,b,T)=>{if(G.day%21===0)rebalance(G,b,T.slice().sort((x,y)=>G.st[x].pe-G.st[y].pe).slice(0,10));}),
 Bot('PER bas vs croissance (PEG)',(G,b,T)=>{if(G.day%21===0){const s=t=>G.st[t].pe/Math.max(0.01,G.st[t].gc*100);rebalance(G,b,T.slice().sort((x,y)=>s(x)-s(y)).slice(0,10));}}),
 Bot('Consensus analystes « Achat »',(G,b,T)=>{if(G.day%21===0){const L=T.filter(t=>{const r=fresh(G,t);return r.length>=2&&r.reduce((a,x)=>a+x.r,0)/r.length>=2.5;});rebalance(G,b,L.slice(0,15));}}),
 Bot('Suivre le meilleur cabinet',(G,b,T)=>{if(G.day%21===0){const best=G.firms.map((F,k)=>[firmRate(F),k]).sort((a,c)=>c[0]-a[0])[0][1];const L=T.filter(t=>{const r=G.st[t].rat[best];return r&&r.r===3&&r.day>G.day-126;});rebalance(G,b,L.slice(0,15));}}),
 Bot('Recherche Pro : 10 plus fortes décotes',(G,b,T)=>{if(G.day%21===0){{const c=Math.max(300,val(G,b)*0.0025);b.cash-=c;b.pro+=c;}const g=t=>G.st[t].fairNow*(1+G.st[t].fairNoise)/G.st[t].pe;rebalance(G,b,T.slice().sort((x,y)=>g(y)-g(x)).slice(0,10));}}),
 Bot('Pro : signal 12 séances avant (avant la fuite)',(G,b,T)=>{
   if(G.day%21===0){const c=Math.max(300,val(G,b)*0.0025);b.cash-=c;b.pro+=c;}
   for(const t in b.pos){if(G.st[t].lastEarnDay!=null&&G.day-G.st[t].lastEarnDay===3)sell(G,b,t);}
   T.filter(t=>G.st[t].earn-G.day===12&&G.st[t].proSig>0&&!b.pos[t]).slice(0,4).forEach(t=>buy(G,b,t,val(G,b)/10));
 }),
 Bot('Recherche Pro : signal avant résultats',(G,b,T)=>{
   if(G.day%21===0){{const c=Math.max(300,val(G,b)*0.0025);b.cash-=c;b.pro+=c;}}
   for(const t in b.pos){if(G.st[t].lastEarnDay!=null&&G.day-G.st[t].lastEarnDay===3)sell(G,b,t);}
   T.filter(t=>G.st[t].earn-G.day===2&&G.st[t].proSig>0&&!b.pos[t]).slice(0,5).forEach(t=>buy(G,b,t,val(G,b)/6));
 }),
 Bot('Indices avant résultats (gratuit)',(G,b,T)=>{
   for(const t in b.pos){if(G.st[t].lastEarnDay!=null&&G.day-G.st[t].lastEarnDay===3)sell(G,b,t);}
   today(G).filter(n=>n.cat==='societe'&&/meilleures|hausse|record/.test(n.title)&&/Enquête|fournisseurs|Fréquentation/.test(n.title)).forEach(n=>{if(!b.pos[n.tk])buy(G,b,n.tk,val(G,b)/6);});
 }),
 Bot('Rumeurs positives (sources sérieuses)',(G,b,T)=>{
   b.mem.h=b.mem.h||{};for(const t in b.mem.h){if(G.day-b.mem.h[t]>=20){sell(G,b,t);delete b.mem.h[t];}}
   today(G).filter(n=>n.cat==='rumeur'&&n.cred>=0.5&&POS_RUM.test(n.title)).forEach(n=>{if(!b.pos[n.tk]){buy(G,b,n.tk,val(G,b)/5);b.mem.h[n.tk]=G.day;}});
 }),
 Bot('Acheter la panique (peur > 30)',(G,b,T)=>{
   if(!b.mem.in&&G.macro.fear>30){T.forEach(t=>buy(G,b,t,b.cash/ (T.length)*1.0));b.mem.in=G.day;}
   if(b.mem.in&&G.day-b.mem.in>252){for(const t in b.pos)sell(G,b,t);b.mem.in=0;}
 }),
 Bot('Après résultats : acheter les belles surprises (45 j)',(G,b,T)=>{b.mem.h=b.mem.h||{};for(const t in b.mem.h)if(G.day-b.mem.h[t]>=45){sell(G,b,t);delete b.mem.h[t];}T.filter(t=>G.st[t].lastEarnDay===G.day&&G.st[t].lastSurp>0.03&&!b.pos[t]).slice(0,2).forEach(t=>{buy(G,b,t,val(G,b)/8);b.mem.h[t]=G.day;});}),
 Bot('Kevin : 2 plus fortes hausses sur 3 jours',(G,b,T)=>{if(Math.random()<0.08){for(const t in b.pos)sell(G,b,t);const r=t=>{const a=G.st[t].p;return a[a.length-1]/a[a.length-4];};const L=T.slice().sort((x,y)=>r(y)-r(x)).slice(0,6);const ch=[L[Math.floor(Math.random()*6)],L[Math.floor(Math.random()*6)]];ch.forEach(t=>buy(G,b,t,val(G,b)/2));}}),
 Bot('Day trader (achète les plus fortes hausses)',(G,b,T)=>{for(const t in b.pos)sell(G,b,t);const r=t=>{const a=G.st[t].p;return a[a.length-1]/a[a.length-2];};T.slice().sort((x,y)=>r(y)-r(x)).slice(0,5).forEach(t=>buy(G,b,t,b.cash/5));}),
];
const res={};
for(let s=0;s<N;s++){
  const G=E.init(D,'2026-11-09',CAP);const T=Object.keys(G.st);const B=bots();let tr=1;
  for(let d=0;d<252*YEARS;d++){
    const pv=T.map(t=>P(G,t));E.step(G);{const dv={};(G.divs||[]).forEach(x=>dv[x.t]=x.dv);const sp={};(G.splits||[]).forEach(x=>sp[x.t]=x.k);tr*=1+T.reduce((a,t,k)=>a+(P(G,t)+(dv[t]||0))*(sp[t]||1)/pv[k]-1,0)/T.length;}
    (G.splits||[]).forEach(x=>B.forEach(b=>{if(b.pos[x.t])b.pos[x.t]*=x.k;}));
    (G.divs||[]).forEach(x=>B.forEach(b=>{if(b.pos[x.t])b.cash+=b.pos[x.t]*x.dv;}));
    B.forEach(b=>b.fn(G,b,T));
  }
  const mk=tr;
  B.forEach(b=>{const v=val(G,b);const r=res[b.name]=res[b.name]||{cagr:[],vs:[],fees:[],trades:[],pro:[]};r.cagr.push(Math.pow(v/CAP,1/YEARS)-1);r.vs.push(Math.pow(v/CAP,1/YEARS)-Math.pow(mk,1/YEARS));r.fees.push(b.fees);r.trades.push(b.trades);r.pro.push(b.pro);});
}
const avg=a=>a.reduce((x,y)=>x+y)/a.length, pct=x=>(x*100).toFixed(1)+' %';
const rows=Object.entries(res).map(([k,r])=>({stratégie:k,'rendement/an':pct(avg(r.cagr)),'vs marché/an':pct(avg(r.vs)),'bat le marché':Math.round(r.vs.filter(x=>x>0).length/r.vs.length*100)+' %','pire partie':pct(Math.min(...r.cagr)),'frais moy.':Math.round(avg(r.fees)),'ordres':Math.round(avg(r.trades))}));
rows.sort((a,b)=>parseFloat(b['vs marché/an'])-parseFloat(a['vs marché/an']));
console.log(N+' marchés × '+YEARS+' ans, capital '+CAP+' $ (dividendes inclus partout, marché = indice équipondéré dividendes réinvestis)');console.table(rows);
