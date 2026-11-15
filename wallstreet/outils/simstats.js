// Statistiques de réalisme sur N parties longues
const E=require(process.argv[2]||'./engine.js');const D=require('./simdata.json');
const N=+process.argv[3]||10, YEARS=20;
const ac=(x,l)=>{const m=x.reduce((a,b)=>a+b)/x.length;let num=0,den=0;for(let i=0;i<x.length;i++){den+=(x[i]-m)**2;if(i>=l)num+=(x[i]-m)*(x[i-l]-m);}return num/den;};
let agg={};const add=(k,v)=>{(agg[k]=agg[k]||[]).push(v)};
const t0=Date.now();
for(let s=0;s<N;s++){
  const G=E.init(D,'2026-11-09',50000);const T=Object.keys(G.st);
  const lr=[],regs=[],stockR=T.map(()=>[]),rates=[],pes=[];let lastReg=G.macro.reg,regLen=0;const regDur={};
  let px0=T.map(t=>E.P(G,t)), pk=1, cur=1, bears=0, inBear=false, corr=0, inCorr=false;
  const newsCount={};let prevIdx=G.idx[G.idx.length-1];
  const expR=[];
  for(let d=0;d<252*YEARS;d++){
    const prev=T.map(t=>E.P(G,t));E.step(G);
    const i1=G.idx[G.idx.length-1];const r=Math.log(i1/prevIdx);prevIdx=i1;lr.push(r);
    if(G.macro.reg==='expansion')expR.push(r);
    T.forEach((t,k)=>stockR[k].push(Math.log(E.P(G,t)/prev[k])));
    cur*=Math.exp(r);pk=Math.max(pk,cur);
    if(!inBear&&cur/pk<0.8){bears++;inBear=true;} if(inBear&&cur>=pk*0.999)inBear=false;
    if(!inCorr&&cur/pk<0.9){corr++;inCorr=true;} if(inCorr&&cur>=pk*0.999)inCorr=false;
    if(G.macro.reg!==lastReg){(regDur[lastReg]=regDur[lastReg]||[]).push(regLen);regLen=0;lastReg=G.macro.reg;}regLen++;
    rates.push(G.macro.rate);
    G.news.filter(n=>n.day===G.day).forEach(n=>newsCount[n.cat]=(newsCount[n.cat]||0)+1);
  }
  const sd=Math.sqrt(lr.reduce((a,b)=>a+b*b,0)/lr.length);
  add('mu',lr.reduce((a,b)=>a+b)/lr.length*252);add('vol',sd*Math.sqrt(252));
  add('volExp',Math.sqrt(expR.reduce((a,b)=>a+b*b,0)/expR.length*252));
  add('ac1',ac(lr,1));add('acAbs1',ac(lr.map(Math.abs),1));add('acAbs5',ac(lr.map(Math.abs),5));add('acAbs20',ac(lr.map(Math.abs),20));
  add('d<-2/yr',lr.filter(x=>x<-0.02).length/YEARS);add('d<-3/yr',lr.filter(x=>x<-0.03).length/YEARS);add('d<-5/decade',lr.filter(x=>x<-0.05).length/YEARS*10);
  add('bears/decade',bears/YEARS*10);add('corrections/yr',corr/YEARS);
  // corr moyenne sur dernière 5 ans
  const L=1260, sub=stockR.map(a=>a.slice(-L)); const mean=a=>a.reduce((x,y)=>x+y)/a.length;
  const z=sub.map(a=>{const m=mean(a),s=Math.sqrt(mean(a.map(x=>(x-m)**2)));return a.map(x=>(x-m)/s);});
  let cs=0,cn=0;for(let i=0;i<z.length;i+=3)for(let j=i+1;j<z.length;j+=3){let c=0;for(let k=0;k<L;k++)c+=z[i][k]*z[j][k];cs+=c/L;cn++;} add('pairCorr',cs/cn);
  const tot=T.map(t=>Math.log(E.P(G,t)/px0[T.indexOf(t)])/YEARS*5); tot.sort((a,b)=>a-b);
  add('5y med',tot[Math.floor(tot.length/2)]);add('5y p10',tot[Math.floor(tot.length*.1)]);add('5y p90',tot[Math.floor(tot.length*.9)]);
  const pe=T.map(t=>G.st[t].pe).sort((a,b)=>a-b);add('PE med end',pe[45]);add('PE max end',pe[pe.length-1]);add('PE min end',pe[0]);
  const prices=T.map(t=>E.P(G,t)).sort((a,b)=>a-b);add('px min end',prices[0]);add('px max end',prices[prices.length-1]);
  add('rate mean',mean(rates));add('rate at 0 %',rates.filter(x=>x<0.0001).length/rates.length);add('rate max',Math.max(...rates));
  for(const k in regDur)add('dur '+k+' (mois)',mean(regDur[k])/21);
  for(const k in newsCount)add('news/jour '+k,newsCount[k]/(252*YEARS));
  add('save KB',JSON.stringify(G).length/1024);
}
const out={};for(const k in agg){const a=agg[k].slice().sort((x,y)=>x-y);out[k]=[+(a.reduce((x,y)=>x+y)/a.length).toFixed(3),+a[0].toFixed(3),+a[a.length-1].toFixed(3)];}
console.log('moyenne, min, max sur',N,'parties de',YEARS,'ans');console.table(out);console.log('ms/séance',((Date.now()-t0)/(N*252*YEARS)).toFixed(3));
