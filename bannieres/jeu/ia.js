'use strict';
/* =========================================================
   BANNIÈRES & SORTILÈGES — intelligence des royaumes rivaux (sans DOM)
   ========================================================= */
var IA_PRIO=['taverne','hab2','hab3','mairie','marche','hab4','citadelle','guilde1','hab5','hotelville','hab6','chateau','hab7','silo','guilde2','capitole','guilde3'];
function iaVille(v){const p=G.joueurs[v.prop];
 if(!v.construit){for(const b of IA_PRIO){if(!batDisponible(v,b).ok)continue;const c=batCout(b,v.fac);if(aDeQuoi(p.res,c)){
    // garder de quoi recruter les premiers jours de la semaine
    if(construire(v,b))break;}else if(b.startsWith('hab')||b==='mairie'||b==='citadelle')break;}}
 iaRecruter(v);}
function iaRecruter(v){const h=heroPar(G.hpos[idx(v.x,v.y)]);const dest=h&&h.j===v.prop?h.armee:v.garn;
 for(let n=6;n>=0;n--){if(!v.dispo[n])continue;recruter(v,n,v.dispo[n],dest)||(dest!==v.garn&&recruter(v,n,v.dispo[n],v.garn));}
 if(h&&h.j===v.prop){for(let k=0;k<7;k++){const s=v.garn[k];if(s&&ajouterTroupe(h.armee,s.c,s.n))v.garn[k]=null;}
  // garder une petite garnison si le héros s'en va : rien (simple)
 }}
function forceVille(v){const h=heroPar(G.hpos[idx(v.x,v.y)]);let f=forceArmee(v.garn)*(1+.12*niveauFort(v));if(h&&h.j===v.prop)f+=forceArmee(h.armee,h);return f;}
// trêve envers les joueurs humains selon le tempérament des rivaux (paisibles / ambitieux / impitoyables)
function iaTreve(j){const n=G.joueurs[j].ia?G.joueurs[j].ia.niveau:1;return[29,15,1][n];}
function iaEngager(j,seuil){const p=G.joueurs[j];if(p.res.or<seuil)return null;const v=villesDe(j).find(v=>v.bat.taverne&&!G.hpos[idx(v.x,v.y)]);if(!v)return null;const h=engager(v,0)||engager(v,1);if(h)iaRecruter(v);return h;}
async function tourIA(j){const p=G.joueurs[j];if(p.elim)return;
 if(!herosDe(j).length)iaEngager(j,2500);
 const reserve=herosDe(j).length?0:2500;
 for(const v of villesDe(j)){p.res.or-=reserve;iaVille(v);p.res.or+=reserve;}
 // engager un héros
 const nh=herosDe(j).length,voulu=1+(G.jour>5?1:0)+(G.jour>20?1:0)+(G.jour>40?1:0);
 if(nh<voulu)iaEngager(j,3500);
 for(const h of herosDe(j).slice()){if(G.fini)return;await iaHeros(h);}
 for(const v of villesDe(j))iaRecruter(v);}
// prédiction par simulation (copie des armées) : renvoie la part de valeur perdue (1 = défaite)
var IA_CACHE={};
function iaRisque(h,armee,heroAdv,opts){const cle=h.id+':'+G.jour+':'+h.mp+':'+JSON.stringify(armee)+':'+(heroAdv?heroAdv.id:'');if(IA_CACHE[cle]!=null)return IA_CACHE[cle];
 const cl=a=>a.map(s=>s?{c:s.c,n:s.n}:null);const hA=Object.assign({},h,{armee:cl(h.armee),bonus:Object.assign({},h.bonus)});const hD=heroAdv?Object.assign({},heroAdv,{armee:cl(heroAdv.armee),bonus:Object.assign({},heroAdv.bonus)}):null;
 let perte=0,n=0;for(let k=0;k<2;k++){const C=creerCombat({heros:hA,armee:cl(hA.armee),joueur:h.j},{heros:hD,armee:hD?cl(hD.armee):cl(armee),joueur:-1},Object.assign({graine:G.jour*97+k*13+h.id},opts||{}));
  for(let t=0;t<3000&&!C.fin;t++)C.agir(iaCombat(C));if(!C.fin||C.fin.gagnant!==0){perte+=1;}else{const v0=forceArmee(h.armee);let v1=0;for(const p of C.piles)if(p.cote===0&&p.n>0)v1+=p.n*CRE[p.c].val;perte+=Math.max(0,1-v1/v0);}n++;}
 const r=perte/n;if(Object.keys(IA_CACHE).length>4000)IA_CACHE={};IA_CACHE[cle]=r;return r;}
function iaValeur(h,o,dist){const p=G.joueurs[h.j];const fh=forceArmee(h.armee,h);
 switch(o.t){
  case 'res':return RES_VAL[o.res]*o.q;
  case 'coffre':return 1600;
  case 'artefact':return 1800*ARTS[o.art].rang;
  case 'mine':return o.prop===h.j?0:MINE_PROD[o.res]*RES_VAL[o.res]*(o.res==='or'?14:12)*(o.prop>=0?1.4:1);
  case 'bat':{const b=o.b,v=h.visites[o.id];switch(b){case 'moulin':return o.pris?0:700;case 'puits':return h.mana<manaMax(h)/2&&h.sorts.length&&!h.bonus.puits?300:0;case 'autel':return v?0:1600;case 'pierre':return v?0:1100;case 'arbre':return v?0:2600;case 'tour':return h.visites['t'+o.id]?0:250;case 'sanctuaire':return v?0:700;case 'ecurie':return h.bonus.ecurie?0:350;case 'feu':return 1300;case 'fontaine':return h.bonus.fontaine?0:150;case 'habitation':{const c=CRE[o.cre];const n=Math.min(o.dispo||0,peutPayer(p.res,c.cout));return n*c.val*.7;}}return 0;}
  case 'ville':{if(o.prop===h.j){let s=0;for(let n=0;n<7;n++)if(o.dispo[n]){const c=CRE[FAC[o.fac].crea[n]];s+=Math.min(o.dispo[n],peutPayer(p.res,c.cout))*c.val;}s+=forceArmee(o.garn);return s*.6+(h.mana<manaMax(h)/2&&o.bat.guilde1?200:0);}
   if(o.prop>=0&&G.joueurs[o.prop].humain&&G.jour<iaTreve(h.j))return 0;const fv=forceVille(o);if(fh<fv*1.1)return 0;const dh=heroPar(G.hpos[idx(o.x,o.y)]);const r=dh?iaRisque(h,null,dh,{siege:niveauFort(o)}):(o.garn.some(Boolean)?iaRisque(h,o.garn,null,{siege:niveauFort(o)}):0);return r<.45?9000*(1-r):0;}
  case 'monstre':{const fm=forceArmee(pileMonstre(o));if(fh<fm*.8)return 0;const r=iaRisque(h,pileMonstre(o));if(r>.3)return 0;return(200+CRE[o.cre].pv*o.n*.6+(o.passage?1500:0))*(1-r*2);}
 }return 0;}
async function iaHeros(h){const p=G.joueurs[h.j];const exclus=new Set();
 for(let it=0;it<14&&heroPar(h.id)&&h.mp>60&&!G.fini;it++){
  const D=distances(h);const fh=forceArmee(h.armee,h);const mm=mvtMax(h);let best=null,bs=0;
  const consid=o=>{const i=idx(o.x,o.y);if(exclus.has(i))return;const d=D[i];if(d===Infinity)return;let v=iaValeur(h,o,d);if(v<=0)return;
   // gardien sur le chemin final
   const z=G.zoc[i];if(z&&G.oi[z]&&G.oi[z]!==o){const m=G.oi[z];if(forceArmee(pileMonstre(m))>fh*1.2)return;if(iaRisque(h,pileMonstre(m))>.3)return;v+=200;}
   const jours=d/mm;const s=v/(1+jours*1.6)*(d<=h.mp?1.4:1);if(s>bs){bs=s;best={i,o};}};
  for(const o of G.objs)consid(o);
  for(const e of G.heros){if(e.j===h.j)continue;if(G.joueurs[e.j].humain&&G.jour<iaTreve(h.j))continue;const i=idx(e.x,e.y);const d=D[i];if(d===Infinity)continue;const fe=forceArmee(e.armee,e)*(villeSous(e)?1.3:1);if(fh>fe*1.1&&iaRisque(h,null,e,{siege:villeSous(e)&&villeSous(e).prop===e.j?niveauFort(villeSous(e)):0})<.4){const s=6000/(1+d/mm*1.6)*(d<=h.mp?1.4:1);if(s>bs){bs=s;best={i,o:null};}}}
  if(!best)break;
  const ch=chemin(h,best.i,{toutVoir:true});if(!ch){exclus.add(best.i);continue;}
  const avant=idx(h.x,h.y),mpAv=h.mp;await deplacer(h,ch.ch);
  if(!heroPar(h.id))return;
  if(idx(h.x,h.y)===avant&&h.mp===mpAv){exclus.add(best.i);continue;}
  if(best.o&&best.o.t==='bat'&&best.o.b==='tour')h.visites['t'+best.o.id]=1;
  if(best.o&&best.o.t==='ville'&&best.o.prop===h.j){iaVille(best.o);}
  if(idx(h.x,h.y)!==best.i&&ch.cout[0]>h.mp)break;}
}
if(typeof module!=='undefined')module.exports={};
