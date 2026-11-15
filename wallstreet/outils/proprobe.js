const E=require('./engine.js');const D=require('./simdata.json');
const acc={};const add=(k,v)=>(acc[k]=acc[k]||[]).push(v);
for(let s=0;s<8;s++){const G=E.init(D,'2026-11-09',50000);const T=Object.keys(G.st);const open={};
 for(let d=0;d<252*6;d++){E.step(G);const m=G.idx[G.idx.length-1];
  T.forEach(t=>{const o=G.st[t],de=o.earn-G.day;
   [12,2].forEach(L=>{if(de===L)open[t+L]={t,p:E.P(G,t),m,k:(o.proSig>0?'pro+':'pro-')+' J-'+L,k2:(o.hint>0&&o.hintDay<=G.day&&o.hintDay>G.day-20?'indice+':o.hint<0&&o.hintDay<=G.day&&o.hintDay>G.day-20?'indice-':'sans indice')+' J-'+L};});
   if(o.lastEarnDay!=null&&G.day-o.lastEarnDay===3)[12,2].forEach(L=>{const x=open[t+L];if(x){const r=E.P(G,t)/x.p-m/x.m;add(x.k,r);add(x.k2,r);delete open[t+L];}});
  });}}
for(const k of Object.keys(acc).sort()){const a=acc[k];console.log(k.padEnd(18),'n',a.length,'excès moyen',(a.reduce((x,y)=>x+y)/a.length*100).toFixed(2)+' %');}
