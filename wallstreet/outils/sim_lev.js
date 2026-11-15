const E=require(process.argv[2]);const D=require('./simdata.json');
const N=6,Y=10;const out={lev1:[],lev2:[],cdown:[],cup:[],cbd:[],cbu:[],skew:[],vol:[],mu:[]};
const cc=(a,b)=>{const ma=a.reduce((x,y)=>x+y)/a.length,mb=b.reduce((x,y)=>x+y)/b.length;let s=0,sa=0,sb=0;for(let i=0;i<a.length;i++){s+=(a[i]-ma)*(b[i]-mb);sa+=(a[i]-ma)**2;sb+=(b[i]-mb)**2;}return s/Math.sqrt(sa*sb);};
for(let k=0;k<N;k++){const G=E.init(D,'2026-11-09',50000);const T=Object.keys(G.st);const r=[],S=T.map(()=>[]);
 for(let d=0;d<252*Y;d++){const p=T.map(t=>E.P(G,t));const i0=G.idx[G.idx.length-1];E.step(G);r.push(Math.log(G.idx[G.idx.length-1]/i0));const sp={};(G.splits||[]).forEach(x=>sp[x.t]=x.k);T.forEach((t,j)=>S[j].push(Math.log(E.P(G,t)*(sp[t]||1)/p[j])));}
 out.lev1.push(cc(r.slice(0,-1),r.slice(1).map(Math.abs)));out.lev2.push(cc(r.slice(0,-2),r.slice(2).map(Math.abs)));
 const avg=mask=>{const idx=r.map((x,i)=>mask(x)?i:-1).filter(i=>i>=0);let s=0,n=0;for(let a=0;a<T.length;a+=4)for(let b=a+1;b<T.length;b+=4){s+=cc(idx.map(i=>S[a][i]),idx.map(i=>S[b][i]));n++;}return s/n;};
 out.cdown.push(avg(x=>x<0));out.cup.push(avg(x=>x>0));out.cbd.push(avg(x=>x<-0.01));out.cbu.push(avg(x=>x>0.01));
 const m=r.reduce((a,b)=>a+b)/r.length,sd=Math.sqrt(r.reduce((a,b)=>a+(b-m)**2,0)/r.length);out.skew.push(r.reduce((a,b)=>a+((b-m)/sd)**3,0)/r.length);out.vol.push(sd*Math.sqrt(252));out.mu.push(m*252);}
const f=a=>(a.reduce((x,y)=>x+y)/a.length).toFixed(3);
console.log('levier lag1',f(out.lev1),'lag2',f(out.lev2),'| corr baisse',f(out.cdown),'hausse',f(out.cup),'| fortes baisses',f(out.cbd),'fortes hausses',f(out.cbu),'| skew',f(out.skew),'vol',f(out.vol),'mu',f(out.mu));
