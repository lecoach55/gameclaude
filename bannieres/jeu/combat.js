'use strict';
/* =========================================================
   BANNIÈRES & SORTILÈGES — combat tactique sur grille hexagonale 15 × 11 (sans DOM)
   ========================================================= */
var CW=15,CH=11;
function hexVois(h){const q=h%CW,r=(h/CW)|0;const D=r&1?[[1,0],[-1,0],[1,-1],[0,-1],[1,1],[0,1]]:[[1,0],[-1,0],[0,-1],[-1,-1],[0,1],[-1,1]];const v=[];for(const [dq,dr] of D){const nq=q+dq,nr=r+dr;if(nq>=0&&nr>=0&&nq<CW&&nr<CH)v.push(nr*CW+nq);}return v;}
function hexCube(h){const q=h%CW,r=(h/CW)|0;const x=q-(r-(r&1))/2;return[x,r,-x-r];}
function hexDist(a,b){const A=hexCube(a),B=hexCube(b);return Math.max(Math.abs(A[0]-B[0]),Math.abs(A[1]-B[1]),Math.abs(A[2]-B[2]));}
var LIGNES=[[],[5],[2,8],[2,5,8],[0,4,6,10],[0,2,5,8,10],[0,2,4,6,8,10],[0,2,4,5,6,8,10]];

function creerCombat(A,D,o){o=o||{};const rng=creeRng(o.graine||12345);
 const C={piles:[],obst:new Set(),tour:1,fin:null,evts:[],cotes:[A,D],sort:[false,false],mana:[0,0],rng,terrain:o.terrain||'herbe',siege:o.siege||0,ville:o.ville||null,pid:1,moralBonus:[0,0],chance:[0,0],stats:[null,null]};
 // caractéristiques des camps
 for(let k=0;k<2;k++){const s=C.cotes[k];const h=s.heros;
  C.stats[k]=h?{att:statH(h,'att'),def:statH(h,'def'),pou:Math.max(1,statH(h,'pou')),comp:h.comp,sorts:h.sorts.filter(s=>SORTS[s].type!=='aventure'),nom:h.nom}:{att:0,def:0,pou:1,comp:{},sorts:[],nom:null};
  C.mana[k]=h?h.mana:0;C.moralBonus[k]=h?moralH(h):0;C.chance[k]=h?chanceH(h):0;}
 if(C.siege)C.stats[1].def+=[0,2,4,6][C.siege];
 // piles
 for(let k=0;k<2;k++){const arm=C.cotes[k].armee;const slots=[];arm.forEach((s,i)=>{if(s&&s.n>0)slots.push(i);});const L=LIGNES[slots.length]||LIGNES[7];
  slots.forEach((i,m)=>{const c=CRE[arm[i].c];C.piles.push({id:C.pid++,cote:k,slot:i,c:c.id,n:arm[i].n,n0:arm[i].n,pvh:c.pv,tirs:c.tirs||0,rip:c.sp.includes('riposte2')?2:1,eff:{},h:L[m]*CW+(k===0?0:CW-1),aJoue:false,attend:false,defend:false,moralFait:false});});}
 // moral : factions mélangées, anges, dragons d'os
 for(let k=0;k<2;k++){const ps=C.piles.filter(p=>p.cote===k);const facs=new Set(ps.map(p=>CRE[p.c].fac));let m=C.moralBonus[k];if(facs.size===1&&!facs.has('neutre'))m+=1;else if(facs.size>=3)m-=facs.size-2;
  if(ps.some(p=>CRE[p.c].sp.includes('mort'))&&ps.some(p=>!CRE[p.c].sp.includes('mort')))m-=1;if(ps.some(p=>CRE[p.c].sp.includes('moral')))m+=1;if(C.piles.some(p=>p.cote!==k&&CRE[p.c].sp.includes('peur')))m-=1;C.moralBonus[k]=Math.max(-3,Math.min(3,m));}
 // obstacles
 const nbo=rng.i(2,6);for(let t=0;t<60&&C.obst.size<nbo;t++){const q=rng.i(3,11),r=rng.i(0,CH-1);const h=r*CW+q;if(!C.piles.some(p=>p.h===h))C.obst.add(h);}
 C.pile=id=>C.piles.find(p=>p.id===id);
 C.vivants=k=>C.piles.filter(p=>p.n>0&&(k==null||p.cote===k));
 C.surCase=h=>C.piles.find(p=>p.n>0&&p.h===h);
 C.libre=h=>!C.obst.has(h)&&!C.surCase(h);
 C.vit=p=>{let v=CRE[p.c].vit;if(p.eff.hate)v+=3;if(p.eff.priere)v+=2;if(p.eff.lent)v=Math.ceil(v/2);if(p.eff.entrave)v-=2;return Math.max(1,v);};
 C.attaque=p=>CRE[p.c].att+C.stats[p.cote].att+(p.eff.fureur?4:0)+(p.eff.priere?2:0);
 C.defense=p=>{let d=CRE[p.c].def+C.stats[p.cote].def+(p.eff.pierre?4:0)+(p.eff.priere?2:0);if(p.defend)d=Math.round(d*1.3)+1;return d;};
 C.pvTotal=p=>p.n>0?(p.n-1)*CRE[p.c].pv+p.pvh:0;
 C.adjEnnemi=p=>hexVois(p.h).some(h=>{const q=C.surCase(h);return q&&q.cote!==p.cote;});
 C.peutTirer=p=>p.tirs>0&&!C.adjEnnemi(p);
 C.peutLancer=k=>!!C.cotes[k].heros&&!C.sort[k]&&C.stats[k].sorts.some(s=>SORTS[s].mana<=C.mana[k]);
 // portée de déplacement : Map case → {d, prev}
 C.portee=p=>{const M=new Map();const v=C.vit(p);if(CRE[p.c].vol){for(let h=0;h<CW*CH;h++){if(h===p.h||!C.libre(h))continue;const d=hexDist(p.h,h);if(d<=v)M.set(h,{d,prev:p.h});}return M;}
  const q=[p.h];const D=new Map([[p.h,{d:0,prev:-1}]]);while(q.length){const h=q.shift();const d=D.get(h).d;if(d>=v)continue;for(const n of hexVois(h)){if(D.has(n)||!C.libre(n))continue;D.set(n,{d:d+1,prev:h});q.push(n);}}
  D.delete(p.h);return D;};
 C.cheminVers=(p,h,M)=>{const ch=[h];if(CRE[p.c].vol)return[p.h,h];let x=M.get(h);while(x&&x.prev!==-1&&x.prev!==p.h){ch.push(x.prev);x=M.get(x.prev);}ch.push(p.h);return ch.reverse();};
 // dégâts
 C.degats=(a,c,opt={})=>{const A=CRE[a.c];let base;
  if(a.eff.beni)base=a.n*A.dmax;else if(a.eff.maudit)base=a.n*A.dmin*.8;else if(opt.moyenne)base=a.n*(A.dmin+A.dmax)/2;else{if(a.n<=10){base=0;for(let i=0;i<a.n;i++)base+=rng.i(A.dmin,A.dmax);}else{let s=0;for(let i=0;i<10;i++)s+=rng.i(A.dmin,A.dmax);base=s*a.n/10;}}
  const at=C.attaque(a),df=Math.round(C.defense(c)*(A.sp.includes('brise')?.6:1));let m=at>df?Math.min(4,1+.05*(at-df)):Math.max(.3,1-.025*(df-at));
  const cs=C.stats[a.cote].comp,cd=C.stats[c.cote].comp;
  if(opt.tir){m*=1+[0,.1,.25,.5][cs.archerie||0];if(opt.dist>10)m*=.5;}else{m*=1+.1*(cs.offense||0);if(A.tirs)m*=.5;if(c.eff.bouclier)m*=.8;}
  m*=1-.05*(cd.armure||0);if(opt.charge&&A.sp.includes('charge'))m*=1+.05*opt.charge;
  let d=base*m,chance=false,mal=false;if(!opt.moyenne){if(C.chance[a.cote]>0&&rng.f()<C.chance[a.cote]/24){d*=2;chance=true;}if(A.sp.includes('malefice')&&rng.f()<.25){d*=2;mal=true;}}
  return{d:Math.max(1,Math.round(d)),chance,mal};};
 C.blesser=(c,d)=>{const tot=C.pvTotal(c);const r=Math.max(0,tot-d);const pv=CRE[c.c].pv;const avant=c.n;c.n=r>0?Math.ceil(r/pv):0;c.pvh=r>0?r-(c.n-1)*pv:0;return avant-c.n;};
 C.frapper=(a,c,opt)=>{const r=C.degats(a,c,opt);const morts=C.blesser(c,r.d);C.evts.push({t:opt.tir?'tir':opt.riposte?'riposte':'attaque',a:a.id,c:c.id,d:r.d,morts,chance:r.chance,mal:r.mal});
  if(r.chance)C.evts.push({t:'chance',a:a.id});
  const A=CRE[a.c];if(A.sp.includes('drain')&&a.n>0){const avant=a.n;let tot=C.pvTotal(a)+r.d;const mx=a.n0*A.pv;tot=Math.min(tot,mx);a.n=Math.ceil(tot/A.pv);a.pvh=tot-(a.n-1)*A.pv;if(a.n>avant)C.evts.push({t:'drain',a:a.id,n:a.n-avant});}
  if(c.n>0&&!opt.riposte){if(A.sp.includes('poison')&&rng.f()<.3)c.eff.poison=3;if(A.sp.includes('entrave'))c.eff.entrave=Math.max(c.eff.entrave||0,2);}
  if(c.n<=0)C.evts.push({t:'mort',c:c.id});return r;};
 C.verifierFin=()=>{if(C.fin)return true;for(let k=0;k<2;k++)if(!C.vivants(k).length){C.fin={gagnant:1-k};C.evts.push({t:'fin',gagnant:1-k});return true;}if(C.tour>80){C.fin={gagnant:1};return true;}return false;};
 // ordre de jeu
 C.prochain=()=>{for(let garde=0;garde<400;garde++){if(C.verifierFin())return null;
  let l=C.vivants().filter(p=>!p.aJoue&&!p.attend).sort((a,b)=>C.vit(b)-C.vit(a)||(a.cote===(C.tour&1)?-1:1)||a.slot-b.slot);
  if(!l.length)l=C.vivants().filter(p=>!p.aJoue&&p.attend).sort((a,b)=>C.vit(a)-C.vit(b));
  if(!l.length){C.nouveauTour();continue;}
  const p=l[0];// début du tour de la pile
  if(!p.debutFait){p.debutFait=true;if(CRE[p.c].sp.includes('regen')&&p.pvh<CRE[p.c].pv){p.pvh=CRE[p.c].pv;C.evts.push({t:'regen',a:p.id});}
   if(p.eff.poison){const d=Math.max(1,Math.round(C.pvTotal(p)*.1));C.blesser(p,d);C.evts.push({t:'poison',a:p.id,d});if(p.n<=0){C.evts.push({t:'mort',c:p.id});continue;}}
   const m=C.moralBonus[p.cote];if(m<0&&!CRE[p.c].sp.includes('mort')&&rng.f()<-m/12){p.aJoue=true;C.evts.push({t:'moral',a:p.id,bon:false});continue;}}
  C.actif=p;return p;}return null;};
 C.nouveauTour=()=>{C.tour++;C.sort=[false,false];
  // tours de défense
  if(C.siege>=2){const nb=C.siege-1;const hab=C.ville?Object.keys(C.ville.bat).filter(b=>b.startsWith('hab')).length:3;for(let t=0;t<nb;t++){const cibles=C.vivants(0);if(!cibles.length)break;const c=cibles[rng.i(0,cibles.length-1)];const d=Math.round((25+12*hab)*(1-.05*(C.stats[0].comp.armure||0)));const morts=C.blesser(c,d);C.evts.push({t:'tour',c:c.id,d,morts});if(c.n<=0)C.evts.push({t:'mort',c:c.id});}}
  for(const p of C.piles){p.aJoue=false;p.attend=false;p.defend=false;p.debutFait=false;p.moralFait=false;p.rip=CRE[p.c].sp.includes('riposte2')?2:1;for(const e in p.eff){if(--p.eff[e]<=0)delete p.eff[e];}}
  C.evts.push({t:'tour',n:C.tour});};
 C.finAction=p=>{if(C.verifierFin())return;const m=C.moralBonus[p.cote];if(p.n>0&&m>0&&!p.moralFait&&!CRE[p.c].sp.includes('mort')&&rng.f()<m/24){p.moralFait=true;p.aJoue=false;p.attend=false;C.evts.push({t:'moral',a:p.id,bon:true});}else p.aJoue=true;C.actif=null;C.prochain();};
 // action principale
 C.agir=a=>{C.evts=[];const p=C.actif;if(!p||C.fin)return false;
  if(a.t==='sort'){if(!C.lancer(p.cote,a.s,a.h))return false;C.verifierFin();if(!C.fin&&p.n<=0){C.actif=null;C.prochain();}return true;}
  if(a.t==='fuir'){C.fin={gagnant:1-p.cote,fuite:true};C.evts.push({t:'fin',gagnant:1-p.cote,fuite:true});return true;}
  if(a.t==='attendre'){if(p.attend)return false;p.attend=true;C.actif=null;C.prochain();return true;}
  if(a.t==='defendre'){p.defend=true;C.evts.push({t:'defend',a:p.id});C.finAction(p);return true;}
  if(a.t==='bouger'){const M=C.portee(p);if(!M.has(a.h))return false;const ch=C.cheminVers(p,a.h,M);p.h=a.h;C.evts.push({t:'bouge',a:p.id,ch,vol:!!CRE[p.c].vol});C.finAction(p);return true;}
  if(a.t==='tirer'){const c=C.pile(a.cible);if(!c||c.n<=0||c.cote===p.cote||!C.peutTirer(p))return false;const dist=hexDist(p.h,c.h);C.frapper(p,c,{tir:1,dist});p.tirs--;
   if(CRE[p.c].sp.includes('doubletir')&&c.n>0&&p.tirs>0&&!C.fin){C.frapper(p,c,{tir:1,dist});p.tirs--;}C.finAction(p);return true;}
  if(a.t==='attaquer'){const c=C.pile(a.cible);if(!c||c.n<=0||c.cote===p.cote)return false;let dep=a.depuis==null?p.h:a.depuis;let charge=0;
   if(dep!==p.h){const M=C.portee(p);if(!M.has(dep))return false;charge=M.get(dep).d;const ch=C.cheminVers(p,dep,M);p.h=dep;C.evts.push({t:'bouge',a:p.id,ch,vol:!!CRE[p.c].vol});}
   if(hexDist(p.h,c.h)!==1)return false;
   C.frapper(p,c,{charge});
   // souffle : la case derrière
   if(CRE[p.c].sp.includes('souffle')){const A=hexCube(p.h),B=hexCube(c.h);const t=[2*B[0]-A[0],2*B[1]-A[1]];const r=t[1];const q=t[0]+(r-(r&1))/2;if(q>=0&&r>=0&&q<CW&&r<CH){const d=C.surCase(r*CW+q);if(d&&d.cote!==p.cote)C.frapper(p,d,{});}}
   if(c.n>0&&c.rip>0&&!CRE[p.c].sp.includes('sansriposte')&&p.n>0){c.rip--;C.frapper(c,p,{riposte:1});}
   C.finAction(p);return true;}
  return false;};
 // sorts
 C.ciblesSort=(k,s)=>{const S=SORTS[s];if(S.cible==='zone'){const r=[];for(let h=0;h<CW*CH;h++)if(!C.obst.has(h))r.push(h);return r;}return C.vivants().filter(p=>S.cible==='allie'?p.cote===k:p.cote!==k).map(p=>p.h);};
 C.puissanceSort=(k,s)=>{const S=SORTS[s];return Math.round((S.base+S.par*C.stats[k].pou)*(1+.1*(C.stats[k].comp.sorcellerie||0)));};
 C.lancer=(k,s,h)=>{const S=SORTS[s];if(C.sort[k]||!C.stats[k].sorts.includes(s)||C.mana[k]<S.mana)return false;if(!C.ciblesSort(k,s).includes(h))return false;
  C.mana[k]-=S.mana;C.sort[k]=true;const cible=C.surCase(h);const dur=1+C.stats[k].pou;const res=p=>CRE[p.c].sp.includes('resmagie');
  C.evts.push({t:'sort',s,h,k});
  if(S.type==='degats'){const zone=S.cible==='zone'?[h].concat(hexVois(h)):[h];for(const z of zone){const p=C.surCase(z);if(!p)continue;const d=Math.round(C.puissanceSort(k,s)*(res(p)?.6:1));const morts=C.blesser(p,d);C.evts.push({t:'degatsSort',c:p.id,d,morts,s});if(p.n<=0)C.evts.push({t:'mort',c:p.id});}}
  else if(S.type==='chaine'){let d=C.puissanceSort(k,s);let cur=cible;const vus=new Set();for(let n=0;n<4&&cur;n++){vus.add(cur.id);const dd=Math.round(d*(res(cur)?.6:1));const morts=C.blesser(cur,dd);C.evts.push({t:'degatsSort',c:cur.id,d:dd,morts,s});if(cur.n<=0)C.evts.push({t:'mort',c:cur.id});d=Math.round(d/2);
    const from=cur.h;cur=C.vivants(1-k).filter(p=>!vus.has(p.id)).sort((a,b)=>hexDist(a.h,from)-hexDist(b.h,from))[0];}}
  else if(S.type==='soin'){const pv=CRE[cible.c].pv;cible.pvh=Math.min(pv,cible.pvh+C.puissanceSort(k,s));for(const e of ['lent','maudit','poison','entrave'])delete cible.eff[e];C.evts.push({t:'soin',c:cible.id});}
  else if(S.type==='buff'){cible.eff[S.effet]=dur;if(S.effet==='beni')delete cible.eff.maudit;C.evts.push({t:'effet',c:cible.id,e:S.effet});}
  else if(S.type==='debuff'){if(res(cible)&&rng.f()<.4){C.evts.push({t:'resiste',c:cible.id});}else{cible.eff[S.effet]=dur;if(S.effet==='maudit')delete cible.eff.beni;C.evts.push({t:'effet',c:cible.id,e:S.effet});}}
  return true;};
 // bilan
 C.pvTues=(k,sansMorts)=>{let s=0;for(const p of C.piles)if(p.cote===k&&!(sansMorts&&CRE[p.c].sp.includes('mort')))s+=Math.max(0,p.n0-p.n)*CRE[p.c].pv;return s;};
 C.survivants=k=>C.vivants(k).reduce((s,p)=>s+p.n,0);
 C.pertes=k=>C.piles.filter(p=>p.cote===k&&p.n0>p.n).map(p=>({c:p.c,n:p.n0-Math.max(0,p.n)}));
 C.appliquer=()=>{for(let k=0;k<2;k++){const s=C.cotes[k];if(s.monstre)continue;const arm=s.armee;if(C.fin&&C.fin.fuite&&C.fin.gagnant!==k){continue;}
   for(const p of C.piles)if(p.cote===k)arm[p.slot]=p.n>0?{c:p.c,n:p.n}:null;
   // ne jamais laisser un héros vainqueur sans armée
   if(s.heros)s.heros.mana=C.mana[k];}};
 C.prochain();
 return C;}

// ---------- IA de combat ----------
function iaCombat(C){const p=C.actif;const k=p.cote;
 if(C.peutLancer(k)){const s=iaSort(C,k);if(s)return s;}
 const valeur=(c,morts)=>morts*CRE[c.c].val;
 const estime=(a,c,opt)=>{const d=C.degats(a,c,Object.assign({moyenne:1},opt)).d;const tue=Math.min(C.pvTotal(c),d);return tue/CRE[c.c].pv*CRE[c.c].val;};
 const ennemis=C.vivants(1-k);
 if(C.peutTirer(p)){let best=null,bs=-1;for(const c of ennemis){const s=estime(p,c,{tir:1,dist:hexDist(p.h,c.h)})*(CRE[p.c].sp.includes('doubletir')?1.8:1)+(CRE[c.c].tirs?CRE[c.c].val*.5:0);if(s>bs){bs=s;best=c;}}return{t:'tirer',cible:best.id};}
 const M=C.portee(p);let best=null,bs=-1e9;
 for(const c of ennemis){for(const h of hexVois(c.h)){if(h!==p.h&&!M.has(h))continue;const d=h===p.h?0:M.get(h).d;let s=estime(p,c,{charge:d});
   if(c.rip>0&&!CRE[p.c].sp.includes('sansriposte')){const restant=Math.max(0,C.pvTotal(c)-C.degats(p,c,{moyenne:1}).d);if(restant>0){const r=C.degats({c:c.c,n:Math.ceil(restant/CRE[c.c].pv),cote:c.cote,eff:c.eff},p,{moyenne:1,riposte:1}).d;s-=Math.min(C.pvTotal(p),r)/CRE[p.c].pv*CRE[p.c].val*.6;}}
   if(CRE[p.c].tirs&&p.tirs>0)s*=.5;s+=CRE[c.c].tirs?CRE[c.c].val*.3:0;if(s>bs){bs=s;best={t:'attaquer',cible:c.id,depuis:h===p.h?null:h};}}}
 if(best)return best;
 // s'approcher de l'ennemi le plus menaçant à portée
 if(!ennemis.length)return{t:'defendre'};
 let cible=ennemis.sort((a,b)=>hexDist(p.h,a.h)-hexDist(p.h,b.h))[0];
 if(CRE[p.c].tirs&&p.tirs>0)return{t:'defendre'};
 let bh=null,bd=hexDist(p.h,cible.h);for(const [h] of M){const d=hexDist(h,cible.h);if(d<bd){bd=d;bh=h;}}
 if(bh==null)return{t:'defendre'};
 // les défenseurs qui attendent un adversaire lent ne s'avancent pas sous les tirs ? on avance quand même
 return{t:'bouger',h:bh};}
function iaSort(C,k){let best=null,bv=0;const ennemis=C.vivants(1-k),amis=C.vivants(k);const valP=p=>p.n*CRE[p.c].val;
 for(const s of C.stats[k].sorts){const S=SORTS[s];if(S.mana>C.mana[k])continue;
  if(S.type==='degats'&&S.cible!=='zone'){for(const c of ennemis){const d=C.puissanceSort(k,s)*(CRE[c.c].sp.includes('resmagie')?.6:1);const v=Math.min(d,C.pvTotal(c))/CRE[c.c].pv*CRE[c.c].val;if(v>bv){bv=v;best={t:'sort',s,h:c.h};}}}
  else if(S.cible==='zone'){for(const c of ennemis){let v=0;for(const z of [c.h].concat(hexVois(c.h))){const q=C.surCase(z);if(!q)continue;const d=C.puissanceSort(k,s);const val=Math.min(d,C.pvTotal(q))/CRE[q.c].pv*CRE[q.c].val;v+=q.cote===k?-val*1.5:val;}if(v>bv){bv=v;best={t:'sort',s,h:c.h};}}}
  else if(S.type==='chaine'){for(const c of ennemis){const d=C.puissanceSort(k,s);const v=Math.min(d,C.pvTotal(c))/CRE[c.c].pv*CRE[c.c].val*1.6;if(v>bv){bv=v;best={t:'sort',s,h:c.h};}}}
  else if(S.type==='buff'){const f={beni:.15,hate:.12,bouclier:.1,pierre:.1,fureur:.12,priere:.22}[S.effet]||.1;for(const a of amis){if(a.eff[S.effet])continue;if(S.effet==='hate'&&CRE[a.c].tirs)continue;const v=valP(a)*f;if(v>bv){bv=v;best={t:'sort',s,h:a.h};}}}
  else if(S.type==='debuff'){const f={lent:.14,maudit:.12}[S.effet]||.1;for(const c of ennemis){if(c.eff[S.effet])continue;const v=valP(c)*f*(CRE[c.c].sp.includes('resmagie')?.6:1);if(v>bv){bv=v;best={t:'sort',s,h:c.h};}}}
  else if(S.type==='soin'){for(const a of amis){const manque=CRE[a.c].pv-a.pvh;if(manque<=0)continue;const v=Math.min(manque,C.puissanceSort(k,s))/CRE[a.c].pv*CRE[a.c].val*.5;if(v>bv){bv=v;best={t:'sort',s,h:a.h};}}}}
 return bv>40?best:null;}
if(typeof module!=='undefined')module.exports={};
