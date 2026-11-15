// Effet de chaque trait : taux de victoire contre un jumeau sans trait (node outils/traits.js)
const C=require('../jeu/combat.js'),D=require('../jeu/data.js');
let s=3;const r=()=>(s=(s*16807)%2147483647)/2147483647;
function mk(){const st=Object.keys(D.STYLES)[Math.floor(r()*7)];const at={};D.ATTRS.forEach(([k])=>at[k]=Math.round(62+(r()-.5)*14+(D.STYLES[st].b[k]||0)));return {nom:'X',style:st,at};}
const out=[];
for(const t in D.TRAITS){if(D.TRAITS[t].hors)continue;let w=0,n=3000,fin=0;
 for(let i=0;i<n;i++){const a=mk(),b=JSON.parse(JSON.stringify(a));a.traits=[t];const sw=i%2;const F=sw?[b,a]:[a,b];const x=C.simuler(F,{seed:i+11,rounds:i%3?3:5});
  const wa=x.res.w===(sw?1:0);if(wa)w++;else if(x.res.w<0)w+=.5;}
 out.push(t.padEnd(12)+(w/n*100).toFixed(1)+'%');}
console.log(out.join('\n'));
