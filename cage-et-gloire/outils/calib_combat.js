// Calibrage du moteur de combat : taux d'arrêts, avantage du favori
const C=require('../jeu/combat.js'),D=require('../jeu/data.js');
let s=1;const r=()=>(s=(s*16807)%2147483647)/2147483647;
function mk(base){const st=Object.keys(D.STYLES)[Math.floor(r()*7)];const at={};D.ATTRS.forEach(([k])=>at[k]=Math.round(base+(r()-.5)*16+(D.STYLES[st].b[k]||0)));return {nom:'X',style:st,at};}
const ov=f=>{const a=f.at;return a.frappe*.2+a.puiss*.12+a.def*.14+a.lutte*.16+a.sol*.14+a.cardio*.12+a.menton*.12;};
for(const [b,gap,R] of [[50,0,3],[70,0,3],[80,0,3],[50,0,5],[80,0,5],[60,5,3],[60,10,3],[70,20,3]]){
 const m={};let fav=0,n=4000,rr=0;
 for(let i=0;i<n;i++){const A=mk(b+gap/2),B=mk(b-gap/2);const x=C.simuler([A,B],{seed:i+1,rounds:R});m[x.res.m]=(m[x.res.m]||0)+1;
  const f=ov(A)>=ov(B)?0:1;if(x.res.w===f)fav++;if(x.res.m!=='ud'&&x.res.m!=='sd'&&x.res.m!=='md'&&x.res.m!=='dr')rr+=x.res.r;}
 const fin=(m.ko||0)+(m.tko||0)+(m.sub||0);
 console.log('base',b,'écart',gap,'R',R,Object.entries(m).map(([k,v])=>k+':'+(v/n*100).toFixed(0)+'%').join(' '),'fav',(fav/n*100).toFixed(0)+'%','round moy fin',(rr/fin).toFixed(2));
}
const x=C.simuler([mk(60),mk(60)],{seed:5});console.log(x.ev.length,'événements');x.ev.slice(0,12).forEach(e=>console.log(e.r,e.b,e.k,e.t));console.log(JSON.stringify(x.res.stats));
