const E=require('./engine.js');const D=require('./simdata.json');
const reg=(X,y)=>{// simple OLS with intercept, X array of arrays
 const n=y.length,k=X[0].length+1;const A=Array.from({length:k},()=>Array(k).fill(0)),b=Array(k).fill(0);
 for(let i=0;i<n;i++){const x=[1,...X[i]];for(let a=0;a<k;a++){b[a]+=x[a]*y[i];for(let c=0;c<k;c++)A[a][c]+=x[a]*x[c];}}
 for(let i=0;i<k;i++){let p=A[i][i];for(let j=i;j<k;j++)A[i][j]/=p;b[i]/=p;for(let r=0;r<k;r++)if(r!==i){const f=A[r][i];for(let j=i;j<k;j++)A[r][j]-=f*A[i][j];b[r]-=f*b[i];}}return b;};
let X=[],Y=[];
for(let s=0;s<4;s++){const G=E.init(D,'2026-11-09',50000);const T=Object.keys(G.st);
 for(let q=0;q<24;q++){const snap=T.map(t=>{const o=G.st[t];return{t,p:E.P(G,t),lpe:Math.log(o.pe),gap:Math.log(o.fairNow/o.pe),g:o.g,dy:o.dy,lf:Math.log(o.fair/o.fair0)};});const i0=G.idx[G.idx.length-1];
  const dv={};for(let d=0;d<126;d++){E.step(G);(G.divs||[]).forEach(x=>dv[x.t]=(dv[x.t]||0)+x.dv/ E.P(G,x.t));(G.splits||[]).forEach(x=>{const z=snap.find(y=>y.t===x.t);z.p/=x.k;});}
  const mk=G.idx[G.idx.length-1]/i0-1;const mlpe=snap.reduce((a,x)=>a+x.lpe,0)/snap.length;
  snap.forEach(x=>{const r=E.P(G,x.t)/x.p-1+(dv[x.t]||0)-mk;X.push([x.lpe-mlpe,x.gap,x.g,x.dy]);Y.push(r);});}}
console.log('coef [const, lnPE-moy, écart juste valeur, croissance g, rendement div] sur rendement relatif 6 mois:',reg(X,Y).map(v=>v.toFixed(3)).join(' '));
console.log('seul lnPE:',reg(X.map(x=>[x[0]]),Y).map(v=>v.toFixed(3)).join(' '));
