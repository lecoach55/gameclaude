// ===== Studio : créatures sans modèle (chevaux, cavaliers, centaure, griffon, loup, tréant), construites en 3D par le code =====
import * as THREE from 'three';
import {grime} from './grime.js';
import {K,makeChar} from './kit.js';
const sph=new THREE.SphereGeometry(.5,28,18),cyl=new THREE.CylinderGeometry(.5,.5,1,16,1),cone=new THREE.ConeGeometry(.5,1,16);
function mat(c,o={}){const m=new THREE.MeshStandardMaterial({color:c,roughness:o.r??.62,metalness:o.m||0});if(o.em){m.emissive=new THREE.Color(o.em);m.emissiveIntensity=o.ei||1;}return o.brut?m:grime(m,{sc:o.sc||7,amt:o.amt??.22,sat:1,dk:1.02,base:0,rough:.25,met:0});}
function mesh(g,m,p=[0,0,0],s=[1,1,1],r=[0,0,0]){const o=new THREE.Mesh(g,m);o.position.set(...p);o.scale.set(...s);o.rotation.set(...r);return o;}
function piv(par,p=[0,0,0]){const g=new THREE.Group();g.position.set(...p);par.add(g);return g;}
// membre effilé : du pivot vers le bas
function os(par,len,r0,r1,m){const g=new THREE.CylinderGeometry(r1,r0,len,14,1);g.translate(0,-len/2,0);const o=new THREE.Mesh(g,m);par.add(o);return o;}
function tube(pts,r0,r1,m,par){const c=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));const g=new THREE.TubeGeometry(c,24,1,10,false);const pos=g.attributes.position,n=g.attributes.normal;
 // rayon décroissant le long du tube
 const seg=24,rad=10;for(let i=0;i<=seg;i++){const t=i/seg,r=r0+(r1-r0)*t;const cp=c.getPointAt(t);for(let j=0;j<=rad;j++){const k=i*(rad+1)+j;const v=new THREE.Vector3(pos.getX(k),pos.getY(k),pos.getZ(k)).sub(cp).multiplyScalar(r).add(cp);pos.setXYZ(k,v.x,v.y,v.z);}}
 pos.needsUpdate=true;g.computeVertexNormals();const o=new THREE.Mesh(g,m);par.add(o);return o;}
function aile(col,par,s,cote){const sh=new THREE.Shape();sh.moveTo(0,0);sh.bezierCurveTo(.25,.35,.7,.75,1.15,.95);sh.bezierCurveTo(1.0,.7,1.05,.55,.95,.45);sh.bezierCurveTo(.95,.3,.85,.2,.78,.12);sh.bezierCurveTo(.7,0,.55,-.12,.45,-.2);sh.bezierCurveTo(.3,-.25,.12,-.2,0,0);
 const g=new THREE.ExtrudeGeometry(sh,{depth:.02,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,curveSegments:16});g.rotateY(-Math.PI/2);// l'aile s'étend vers l'arrière (−x) et vers le haut
 const p=piv(par);const w=new THREE.Mesh(g,mat(col,{r:.7,amt:.15}));w.scale.set(s,s,s*cote);w.rotation.y=Math.PI/2;p.add(w);p.userData.cote=cote;return p;}
// ---------- quadrupède générique (avance vers +x) ----------
function quadrupede(o){const root=new THREE.Group(),corps=piv(root,[0,o.h,0]);const mc=mat(o.coul,{amt:o.amt}),mf=mat(o.fonce||o.coul,{amt:.3}),mcr=mat(o.crin||o.fonce||o.coul,{r:.9,amt:.15});
 const L=o.long,H=o.h;
 corps.add(mesh(sph,mc,[0,0,0],[L,o.ep*1.0,o.larg]));corps.add(mesh(sph,mc,[L*.32,.03,0],[L*.48,o.ep*1.08,o.larg*1.05]));corps.add(mesh(sph,mc,[-L*.3,.02,0],[L*.46,o.ep*1.02,o.larg*1.02]));
 // pattes : hanche → genou → sabot/patte
 const pattes=[];for(const [x,z,av] of [[L*.36,o.larg*.32,1],[L*.36,-o.larg*.32,1],[-L*.36,o.larg*.3,0],[-L*.36,-o.larg*.3,0]]){const h=piv(corps,[x,-o.ep*.2,z]);os(h,H*.5,o.cuisse,o.cuisse*.55,av?mc:mc);const g=piv(h,[0,-H*.5,0]);os(g,H*.46,o.cuisse*.5,o.cuisse*.38,mf);
  const pied=mesh(o.sabot?cyl:sph,o.sabot?mat(0x2a2218,{amt:.1}):mf,[o.sabot?0:.03,-H*.47,0],o.sabot?[o.cuisse*.9,.09,o.cuisse*.9]:[o.cuisse*1.1,.08,o.cuisse*.9]);g.add(pied);pattes.push({h,g,av});}
 // cou et tête
 const cou=piv(corps,[L*.48,o.ep*.25,0]);let tete=null;
 if(!o.sansTete){const ang=o.couAng??.9;cou.userData.base=-(Math.PI/2-ang);cou.rotation.z=cou.userData.base;const cg=new THREE.CylinderGeometry(o.couR*.72,o.couR,o.couL,14,1);cg.translate(0,o.couL/2,0);cou.add(new THREE.Mesh(cg,mc));
  tete=piv(cou,[0,o.couL,0]);tete.rotation.z=(Math.PI/2-ang)-(o.teteAng??.25);
  tete.add(mesh(sph,mc,[o.teteL*.15,0,0],[o.teteL*.7,o.teteH,o.teteH*.85]));tete.add(mesh(sph,mc,[o.teteL*.5,-o.teteH*.12,0],[o.teteL*.55,o.teteH*.72,o.teteH*.65]));
  if(o.museau)tete.add(mesh(cone,mc,[o.teteL*.8,-o.teteH*.08,0],[o.teteH*.55,o.teteL*.6,o.teteH*.5],[0,0,-Math.PI/2]));
  for(const z of [-1,1]){tete.add(mesh(cone,mc,[-o.teteL*.05,o.teteH*.55,z*o.teteH*.28],[o.oreille*.5,o.oreille,o.oreille*.35],[z*.2,0,.25]));
   tete.add(mesh(sph,mat(0x120c08,{r:.2,brut:1}),[o.teteL*.38,o.teteH*.18,z*o.teteH*.38],[.05,.05,.05]));}
  if(o.corne)tete.add(mesh(cone,mat(o.corne,{r:.3,m:.4,em:o.corne,ei:.25}),[o.teteL*.3,o.teteH*.85,0],[.05,.42,.05],[0,0,-.55]));
  if(o.crin){for(let k=0;k<7;k++){const t=k/6;cou.add(mesh(sph,mcr,[-o.couR*.75,o.couL*(.05+t*.95),0],[.08,.15,.07],[0,0,.3]));}}
  if(o.bec){tete.children.forEach(c=>c.scale.multiplyScalar(1));tete.add(mesh(cone,mat(0xe8b030,{r:.4}),[o.teteL*.75,-o.teteH*.1,0],[o.teteH*.45,o.teteL*.7,o.teteH*.4],[0,0,-Math.PI/2-.35]));}}
 // queue
 const queue=piv(corps,[-L*.52,o.ep*.15,0]);if(o.queue==='crin')tube([[0,0,0],[-.15,-.1,0],[-.28,-.45,0],[-.3,-.85,0]],.08,.03,mcr,queue);
 else if(o.queue==='touffe'){tube([[0,0,0],[-.25,-.05,0],[-.45,-.3,0],[-.55,-.6,0]],.05,.03,mc,queue);queue.add(mesh(sph,mf,[-.56,-.66,0],[.12,.16,.12]));}
 else if(o.queue==='loup')tube([[0,0,0],[-.25,-.1,0],[-.45,-.35,0],[-.55,-.6,0]],.11,.05,mc,queue);
 const ailes=o.ailes?[aile(o.ailes,piv(corps,[L*.15,o.ep*.45,o.larg*.3]),o.ailesT||1.3,1),aile(o.ailes,piv(corps,[L*.15,o.ep*.45,-o.larg*.3]),o.ailesT||1.3,-1)]:[];
 return{root,corps,pattes,cou,tete,queue,ailes,o};}
// poses du quadrupède : an = idle / atk / hit / die, t ∈ [0,1]
function poserQ(Q,an,t){const {corps,pattes,cou,tete,queue,ailes,o}=Q;const H=o.h;corps.position.set(0,H,0);corps.rotation.set(0,0,0);pattes.forEach(p=>{p.h.rotation.set(0,0,0);p.g.rotation.set(0,0,0);});queue.rotation.set(0,0,0);const cb=cou&&cou.userData.base!=null?cou.userData.base:0;if(cou)cou.rotation.z=cb;
 const ail=(a)=>ailes.forEach(w=>{w.rotation.set(0,0,0);w.rotation.x=w.userData.cote*a;});
 if(an==='idle'){const s=Math.sin(t*Math.PI*2);corps.position.y+=s*.015;if(cou)cou.rotation.z+=s*.04;queue.rotation.z=s*.15;ail(-.15-.12*s);}
 else if(an==='atk'){const k=Math.sin(t*Math.PI);if(o.cabre){corps.rotation.z=k*.5;corps.position.y+=k*.32;corps.position.x-=k*.25;pattes.forEach(p=>{if(p.av){p.h.rotation.z=k*1.1;p.g.rotation.z=-k*1.6;}else{p.h.rotation.z=-k*.45;}});ail(-.2-k*.8);}
  else{corps.position.x+=k*.35;corps.rotation.z=-k*.12;pattes.forEach(p=>{p.h.rotation.z=(p.av?-1:.6)*k*.5;});if(cou)cou.rotation.z-=k*.35;ail(-.2-k*.5);}}
 else if(an==='hit'){const k=Math.sin(t*Math.PI);corps.rotation.z=k*.15;corps.position.x-=k*.12;if(cou)cou.rotation.z+=k*.25;ail(-.4);}
 else if(an==='die'){const k=Math.min(1,t*1.15);corps.rotation.x=k*Math.PI/2*.95;corps.position.y=H-(H-o.larg*.45)*k;pattes.forEach((p,i)=>{p.h.rotation.z=k*(i%2?.4:-.3);p.g.rotation.z=k*.5;});if(cou)cou.rotation.z=cb-k*.6;ail(-.1-k*.6);}}
// ---------- squelette Mixamo : orientation des os ----------
function rig(root){const B={};root.traverse(o=>{if(o.isBone){const n=o.name.replace(/^mixamorig:?/,'');if(!B[n])B[n]=o;}});return B;}
const CH={LeftArm:'LeftForeArm',LeftForeArm:'LeftHand',RightArm:'RightForeArm',RightForeArm:'RightHand',LeftUpLeg:'LeftLeg',LeftLeg:'LeftFoot',RightUpLeg:'RightLeg',RightLeg:'RightFoot'};
const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_q=new THREE.Quaternion(),_q2=new THREE.Quaternion();
function viser(B,n,dir){const b=B[n],c=B[CH[n]];if(!b||!c)return;b.updateMatrixWorld(true);b.getWorldPosition(_a);c.getWorldPosition(_b);const cur=_b.sub(_a).normalize();_q.setFromUnitVectors(cur,dir.clone().normalize());b.getWorldQuaternion(_q2);const nw=_q.multiply(_q2);const pq=new THREE.Quaternion();b.parent.getWorldQuaternion(pq);b.quaternion.copy(pq.invert().multiply(nw));b.updateMatrixWorld(true);}
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
// cavalier assis : jambes de part et d'autre, bras armé ; dirs dans le repère monde (le cheval avance vers +x)
function asseoir(R,bras){const B=rig(R.model);R.model.updateMatrixWorld(true);
 viser(B,'LeftUpLeg',V(.55,-.35,.75));viser(B,'LeftLeg',V(-.1,-1,.25));viser(B,'RightUpLeg',V(.55,-.35,-.75));viser(B,'RightLeg',V(-.1,-1,-.25));
 bras(B);return B;}
// ---------- fabriques ----------
const CHEVAL={h:.95,long:1.05,ep:.5,larg:.42,cuisse:.12,couL:.55,couR:.16,teteL:.42,teteH:.2,oreille:.11,museau:0,queue:'crin',sabot:1,cabre:1};
export const QDEFS={
 cavalier:{c:()=>{const Q=quadrupede(Object.assign({},CHEVAL,{coul:0xe8e2d4,fonce:0xb8ae98,crin:0x6a5236}));
   // caparaçon bleu
   Q.corps.add(mesh(sph,mat(0x2f5fa8,{amt:.2}),[0,.02,0],[1.12,.56,.47]));
   const R=makeChar('hx_aldric',{s:.78,set:'mx',kind:'mon',gsat:.9,gdk:1.45,gamt:.08,recol:{h:.75,to:.62,w:.14,s:1.1},wR:['staff'],wx:{staff:{p:[0,.1,.02],s:.62}}});
   R.mixer.stopAllAction();R.root.rotation.y=Math.PI/2;R.root.position.set(.1,Q.o.h-.68,0);Q.corps.add(R.root);R.root.updateMatrixWorld(true);
   const pose=k=>asseoir(R,B=>{viser(B,'RightArm',V(.6,-.5,-.3+k*.3));viser(B,'RightForeArm',V(1,.2-k*.3,0));viser(B,'LeftArm',V(.3,-.8,.4));viser(B,'LeftForeArm',V(.8,-.2,.3));});
   return{root:Q.root,poser:(an,t)=>{poserQ(Q,an,t);Q.corps.updateMatrixWorld(true);pose(an==='atk'?Math.sin(t*Math.PI):0);}};},u:3.0,fw:200,fh:184},
 pegase:{c:()=>{const Q=quadrupede(Object.assign({},CHEVAL,{coul:0xeef2fa,fonce:0xc8d0e0,crin:0xb9c8e6,ailes:0xffffff,ailesT:1.4}));return{root:Q.root,poser:(an,t)=>poserQ(Q,an,t)};},u:3.2,fw:200,fh:200},
 licorne:{c:()=>{const Q=quadrupede(Object.assign({},CHEVAL,{coul:0xfbfbff,fonce:0xd8d8e8,crin:0xf0a8d0,corne:0xf3d36a}));return{root:Q.root,poser:(an,t)=>poserQ(Q,an,t)};},u:2.9,fw:192,fh:176},
 loup:{c:()=>{const Q=quadrupede({h:.42,long:.78,ep:.3,larg:.27,cuisse:.08,couL:.22,couR:.13,couAng:.6,teteAng:.55,teteL:.32,teteH:.15,oreille:.1,museau:1,queue:'loup',coul:0x7d7f86,fonce:0x55575e,amt:.35});return{root:Q.root,poser:(an,t)=>poserQ(Q,an,t)};},u:2.0,fw:160,fh:136},
 griffon:{c:()=>{const Q=quadrupede({h:.62,long:.92,ep:.42,larg:.38,cuisse:.11,couL:.32,couR:.16,couAng:1.0,teteAng:.6,teteL:.3,teteH:.17,oreille:.07,bec:1,queue:'touffe',coul:0xc99a4e,fonce:0x8a6a34,ailes:0xa8763a,ailesT:1.35,cabre:1});
   // tête et poitrail blancs d'aigle
   Q.tete.children.slice(0,2).forEach(m=>m.material=mat(0xf0e8d8,{amt:.2}));Q.corps.add(mesh(sph,mat(0xf0e8d8,{amt:.2}),[Q.o.long*.42,.08,0],[.42,.42,.36]));
   return{root:Q.root,poser:(an,t)=>poserQ(Q,an,t)};},u:2.9,fw:192,fh:184},
 centaure:{c:()=>{const Q=quadrupede(Object.assign({},CHEVAL,{coul:0x8a5a32,fonce:0x5a3a1e,crin:0x3a2412,sansTete:1,cabre:1}));
   const R=makeChar('hx_maelle',{s:.82,set:'mx',kind:'mon',gsat:1,gdk:1.2,gamt:.08,hue:.25});const B=rig(R.model);
   const replier=()=>{['LeftUpLeg','RightUpLeg'].forEach(n=>{if(B[n])B[n].scale.setScalar(.001);});};
   R.root.rotation.y=Math.PI/2;R.root.position.set(Q.o.long*.42,Q.o.h-.84+.05,0);Q.corps.add(R.root);
   return{root:Q.root,poser:(an,t)=>{poserQ(Q,an,t);const k={idle:'idle',atk:'bow',hit:'hit',die:'hit'}[an];R.mixer.stopAllAction();const a=R.act(k)||R.act('idle');a.reset();a.play();a.time=(an==='die'?.3:t)*a.getClip().duration;R.mixer.update(0);replier();}};},u:3.0,fw:192,fh:200},
 treant:{c:()=>{const root=new THREE.Group(),corps=piv(root,[0,0,0]);const ec=mat(0x6b4a2b,{sc:9,amt:.45}),fe=mat(0x4f8a2e,{sc:5,amt:.35});
   const tronc=piv(corps,[0,0,0]);const tg=new THREE.CylinderGeometry(.26,.38,1.7,14,6);tg.translate(0,.85,0);const p=tg.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);const a=Math.atan2(p.getZ(i),p.getX(i));const k=1+.12*Math.sin(a*5+y*3);p.setX(i,p.getX(i)*k);p.setZ(i,p.getZ(i)*k);}tg.computeVertexNormals();tronc.add(new THREE.Mesh(tg,ec));
   const jambes=[-1,1].map(z=>{const j=piv(corps,[0,.15,z*.17]);os(j,.3,.14,.18,ec);return j;});
   const bras=[-1,1].map(z=>{const b=piv(tronc,[0,1.3,z*.3]);b.rotation.x=z*.5;b.rotation.z=-.2;const o=os(b,.85,.11,.06,ec);[[-.2,.5],[.25,.75]].forEach(([r,y])=>{const r2=piv(b,[0,-y,0]);r2.rotation.z=r;os(r2,.3,.04,.02,ec);});b.add(mesh(sph,fe,[0,-.85,0],[.3,.26,.3]));return b;});
   for(const [x,y,z,s] of [[0,1.85,0,.75],[.15,1.65,.3,.5],[-.15,1.7,-.3,.55],[.2,2.15,-.1,.5],[-.25,2.0,.15,.5],[0,2.25,.2,.42]])tronc.add(mesh(sph,fe,[x,y,z],[s,s*.85,s]));
   for(const z of [-1,1]){tronc.add(mesh(sph,mat(0xd8ff7a,{em:0xd8ff7a,ei:1.6,brut:1}),[.27,1.32,z*.07],[.05,.06,.05]));}
   tronc.add(mesh(sph,mat(0x1a1008,{brut:1}),[.28,1.12,0],[.04,.07,.13]));
   return{root,poser:(an,t)=>{const s=Math.sin(t*Math.PI*2),k=Math.sin(t*Math.PI);tronc.rotation.set(0,0,0);bras.forEach((b,i)=>{b.rotation.z=-.2;});
    if(an==='idle'){tronc.rotation.z=s*.03;bras.forEach((b,i)=>b.rotation.z=-.2+s*.08*(i?1:-1));}
    else if(an==='atk'){tronc.rotation.z=-k*.25;bras[0].rotation.z=-.2-k*1.8;bras[1].rotation.z=-.2-k*1.5;}
    else if(an==='hit'){tronc.rotation.z=k*.15;}
    else if(an==='die'){tronc.rotation.z=-Math.min(1,t*1.1)*1.45;}}};},u:3.0,fw:176,fh:200},
};
