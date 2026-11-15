// Réplique des stratégies des rivaux (game.js) sur le moteur seul : qui gagne, et de combien ?
const E=require('./engine.js');const D=require('./simdata.json');const N=+process.argv[2]||30,Y=+process.argv[3]||3,FEE=0.001;
const variant=process.argv[4]||'actuel';
const wins={max:0,margaux:0,kevin:0},perf={max:[],margaux:[],kevin:[]};
for(let s=0;s<N;s++){const G=E.init(D,'2026-11-09',50000);const T=Object.keys(G.st);const P=t=>E.P(G,t);const ret=(t,n)=>{const a=G.st[t].p;return a[a.length-1]/a[Math.max(0,a.length-1-n)]-1;};
 const R=['max','margaux','kevin'].map(id=>({id,cash:50000,pos:{}}));const val=r=>{let v=r.cash;for(const t in r.pos)v+=r.pos[t]*P(t);return v;};
 const buy=(r,t,a)=>{const p=P(t);const q=Math.floor(Math.min(a,r.cash)/(p*(1+FEE)));if(q<1)return;const f=Math.max(1,q*p*FEE);if(q*p+f>r.cash)return;r.cash-=q*p+f;r.pos[t]=(r.pos[t]||0)+q;};
 const sell=(r,t)=>{const q=r.pos[t];if(!q)return;const p=P(t);r.cash+=q*p-Math.max(1,q*p*FEE);delete r.pos[t];};
 const reb=(r,L)=>{for(const t in r.pos)if(!L.includes(t))sell(r,t);const tg=val(r)/L.length;L.forEach(t=>{const c=(r.pos[t]||0)*P(t);if(c<tg*0.8)buy(r,t,tg-c);});};
 for(let d=0;d<252*Y;d++){E.step(G);(G.splits||[]).forEach(x=>R.forEach(r=>{if(r.pos[x.t])r.pos[x.t]*=x.k;}));(G.divs||[]).forEach(x=>R.forEach(r=>{if(r.pos[x.t])r.cash+=r.pos[x.t]*x.dv;}));
  R.forEach(r=>{
   if(r.id==='max'&&G.day%21===0){const m=t=>ret(t,126)-(variant==='nouveau'?0.5*ret(t,21):0);/*jeu = Max actuel*/reb(r,T.slice().sort((a,b)=>m(b)-m(a)).slice(0,10));}
   if(r.id==='margaux'&&G.day%(variant!=='actuel'?63:21)===0){
     if(variant!=='actuel'){const med={};T.forEach(t=>{const sc=D.stocks[t].s;(med[sc]=med[sc]||[]).push(G.st[t].pe);});for(const k in med){med[k].sort((a,b)=>a-b);med[k]=med[k][Math.floor(med[k].length/2)];}
       const sc=t=>G.st[t].pe/med[D.stocks[t].s];reb(r,T.filter(t=>G.st[t].dy>0.01).sort((a,b)=>sc(a)-sc(b)).slice(0,12));}
     else{const sc=t=>G.st[t].pe/Math.max(0.5,G.st[t].gc*100+G.st[t].dy*100);reb(r,T.filter(t=>G.st[t].dy>0.01).sort((a,b)=>sc(a)-sc(b)).slice(0,12));}}
   if(r.id==='kevin'&&Math.random()<0.08){for(const t in r.pos)sell(r,t);const L=T.slice().sort((a,b)=>ret(b,3)-ret(a,3)).slice(0,8).sort(()=>Math.random()-0.5).slice(0,4);const part=r.cash/4;L.forEach(t=>buy(r,t,part));}
  });}
 const v=R.map(r=>({id:r.id,v:val(r)})).sort((a,b)=>b.v-a.v);wins[v[0].id]++;R.forEach(r=>perf[r.id].push(Math.pow(val(r)/50000,1/Y)-1));}
const avg=a=>(a.reduce((x,y)=>x+y)/a.length*100).toFixed(1)+' %/an';
console.log(variant,'victoires',JSON.stringify(wins),'rendements',Object.fromEntries(Object.entries(perf).map(([k,a])=>[k,avg(a)])));
