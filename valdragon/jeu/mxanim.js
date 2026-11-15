// ===== Valdragon · animations procédurales pour squelettes Mixamo (créées par code, pas de captures) =====
import * as THREE from 'three';
const V=(x,y,z)=>new THREE.Vector3(x,y,z).normalize();
const _q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_v=new THREE.Vector3(),_w=new THREE.Vector3();
const BN=['Hips','Spine','Spine1','Spine2','Neck','Head','LeftArm','LeftForeArm','LeftHand','RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','RightUpLeg','RightLeg','RightFoot'];
const CHILD={LeftArm:'LeftForeArm',LeftForeArm:'LeftHand',RightArm:'RightForeArm',RightForeArm:'RightHand',LeftUpLeg:'LeftLeg',LeftLeg:'LeftFoot',RightUpLeg:'RightLeg',RightLeg:'RightFoot',LeftHand:'LeftHandMiddle1',RightHand:'RightHandMiddle1',LeftFoot:'LeftToeBase',RightFoot:'RightToeBase'};
function rig(root){const B={};root.traverse(o=>{if(o.isBone){const n=o.name.replace(/^mixamorig:?/,'');if(!B[n])B[n]=o;}});return B;}
// oriente l'os b pour que la direction (b -> enfant) pointe vers dir (repère monde du personnage)
function aim(B,n,dir){const b=B[n],c=B[CHILD[n]];if(!b||!c)return;b.updateMatrixWorld(true);
 b.getWorldPosition(_v);c.getWorldPosition(_w);const cur=_w.sub(_v).normalize();_q.setFromUnitVectors(cur,dir);
 b.getWorldQuaternion(_q2);const nw=_q.multiply(_q2);const pq=new THREE.Quaternion();b.parent.getWorldQuaternion(pq);b.quaternion.copy(pq.invert().multiply(nw));b.updateMatrixWorld(true);}
function rot(B,n,x,y,z){const b=B[n];if(!b)return;const e=new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z,'YXZ'));
 // rotation exprimée dans le repère du personnage, appliquée par-dessus l'orientation actuelle
 const wq=new THREE.Quaternion();b.getWorldQuaternion(wq);const pq=new THREE.Quaternion();b.parent.getWorldQuaternion(pq);b.quaternion.copy(pq.invert().multiply(e.multiply(wq)));b.updateMatrixWorld(true);}
const mir=d=>new THREE.Vector3(-d.x,d.y,d.z);
// une pose = { hips:[dx,dy,dz], hr:[x,y,z] rotation des hanches, sp:[x,y,z] buste, hd:[x,y,z] tête, la/lf/ra/rf/lu/ll/ru/rl : directions }
function apply(B,rest,P){for(const n in rest){B[n].quaternion.copy(rest[n].q);B[n].position.copy(rest[n].p);}
 const H=B.Hips;if(P.hips)H.position.add(new THREE.Vector3(...P.hips).multiplyScalar(rest.Hips.h));H.updateMatrixWorld(true);
 if(P.hr)rot(B,'Hips',...P.hr);
 const sp=P.sp||[0,0,0];['Spine','Spine1','Spine2'].forEach(n=>rot(B,n,sp[0]/3,sp[1]/3,sp[2]/3));if(P.hd)rot(B,'Head',...P.hd);
 const L=[['LeftUpLeg',P.lu],['LeftLeg',P.ll],['RightUpLeg',P.ru],['RightLeg',P.rl],['LeftArm',P.la],['LeftForeArm',P.lf],['RightArm',P.ra],['RightForeArm',P.rf]];
 for(const [n,d] of L)if(d)aim(B,n,d.clone().normalize());
 if(P.lfoot)aim(B,'LeftFoot',P.lfoot);if(P.rfoot)aim(B,'RightFoot',P.rfoot);}
const DOWN=V(0,-1,0),FOOT=V(0,-.35,1);
function base(o={}){const s=o.spread??.18;return Object.assign({la:V(s,-1,.04),lf:V(s*.6,-1,.22),ra:V(-s,-1,.04),rf:V(-s*.6,-1,.22),lu:V(.07,-1,0),ll:V(.06,-1,-.04),ru:V(-.07,-1,0),rl:V(-.06,-1,-.04),lfoot:FOOT,rfoot:FOOT},o);}
const lerpP=(a,b,t)=>{const o={};for(const k of new Set([...Object.keys(a),...Object.keys(b)])){const x=a[k],y=b[k];if(x===undefined){o[k]=y;continue;}if(y===undefined){o[k]=x;continue;}
 if(x.isVector3)o[k]=x.clone().lerp(y,t).normalize();else o[k]=x.map((v,i)=>v+(y[i]-v)*t);}return o;};
const ease=t=>t*t*(3-2*t);
// définition des clips : liste de [temps, pose]
function walkPose(ph){const s=Math.sin(ph),c=Math.cos(ph);const sw=.42;
 const legL=V(.07,-1,s*sw),legR=V(-.07,-1,-s*sw);const kL=Math.max(0,c)*.9+.05,kR=Math.max(0,-c)*.9+.05;// genou fléchi pendant le retour de la jambe (pied en l'air), jambe tendue en appui
 return base({hips:[0,-.025+Math.abs(c)*.025,0],hr:[0,s*.08,0],sp:[.05,-s*.12,0],lu:legL,ll:V(.06,-1,s*sw-kL),ru:legR,rl:V(-.06,-1,-s*sw-kR),
  la:V(.16,-1,-s*.38),lf:V(.1,-1,-s*.3+.3),ra:V(-.16,-1,s*.38),rf:V(-.1,-1,s*.3+.3),lfoot:V(0,-.3+kL*.3,1),rfoot:V(0,-.3+kR*.3,1)});}
function runPose(ph){const s=Math.sin(ph),c=Math.cos(ph);const sw=1.0;// grande foulée de course
 const kL=Math.max(0,c)*1.8+.15,kR=Math.max(0,-c)*1.8+.15;
 return base({hips:[0,-.06+Math.abs(s)*.06,0],hr:[0,s*.14,0],sp:[.34,-s*.2,0],hd:[-.2,0,0],lu:V(.07,-1,s*sw+.18),ll:V(.06,-1,s*sw+.18-kL),ru:V(-.07,-1,-s*sw+.18),rl:V(-.06,-1,-s*sw+.18-kR),
  la:V(.2,-1,-s*.9),lf:V(.1,-.25+(-s)*.35,1),ra:V(-.2,-1,s*.9),rf:V(-.1,-.25+s*.35,1),lfoot:V(0,-.25+kL*.25,1),rfoot:V(0,-.25+kR*.25,1)});}
const CLIPS={
 run:{loop:1,d:.7,keys:t=>runPose(t/.7*Math.PI*2)},
 idle:{loop:1,d:3,keys:t=>{const b=Math.sin(t/3*Math.PI*2);return base({hips:[0,b*.004-.01,0],sp:[.03+b*.025,0,0],hd:[-b*.02,0,0],la:V(.2,-1,.06+b*.02),ra:V(-.2,-1,.06+b*.02)});}},
 walk:{loop:1,d:1,keys:t=>walkPose(t*Math.PI*2)},
 atk:{d:.9,keys:[[0,base()],[.32,base({sp:[-.1,.6,0],hr:[0,.25,0],ra:V(-.6,.75,-.35),rf:V(-.2,1,-.2),la:V(.5,-.6,.5),lf:V(.3,-.2,1),ru:V(-.2,-1,-.15),lu:V(.15,-1,.25)})],
  [.5,base({sp:[.25,-.7,0],hr:[0,-.3,0],ra:V(.35,-.35,1),rf:V(.6,-.6,.8),la:V(.4,-.8,-.2),lf:V(.3,-.9,.3),ru:V(-.2,-1,-.15),lu:V(.15,-1,.3)})],[.9,base()]]},
 spin:{d:1.2,keys:[[0,base()],[.3,base({hr:[0,1.2,0],sp:[0,.6,0],ra:V(-1,.3,0),rf:V(-1,.3,.2),la:V(1,-.3,0)})],[.65,base({hr:[0,-1.6,0],sp:[.1,-.6,0],ra:V(1,-.1,.5),rf:V(1,-.2,.6),la:V(.6,-.6,-.4)})],[1.2,base()]]},
 cast:{d:1.1,keys:[[0,base()],[.35,base({sp:[-.15,0,0],hd:[-.15,0,0],ra:V(-.4,.5,.6),rf:V(-.2,.9,.5),la:V(.4,.5,.6),lf:V(.2,.9,.5)})],
  [.6,base({sp:[.2,0,0],ra:V(-.15,.15,1),rf:V(-.05,.1,1),la:V(.15,.15,1),lf:V(.05,.1,1),lu:V(.1,-1,.2),ru:V(-.1,-1,-.15)})],[1.1,base()]]},
 raise:{d:1.2,keys:[[0,base()],[.45,base({sp:[-.2,0,0],hd:[-.3,0,0],ra:V(-.2,1,.15),rf:V(-.05,1,.1),la:V(.4,-.5,.4)})],[.8,base({sp:[-.2,0,0],hd:[-.3,0,0],ra:V(-.2,1,.15),rf:V(-.05,1,.1),la:V(.4,-.5,.4)})],[1.2,base()]]},
 bow:{d:1,keys:[[0,base()],[.3,base({hr:[0,.9,0],sp:[0,.3,0],la:V(.05,.15,1),lf:V(.03,.15,1),ra:V(-.7,.1,.6),rf:V(.5,.2,.8),lu:V(.15,-1,.15),ru:V(-.15,-1,-.15)})],
  [.6,base({hr:[0,.9,0],sp:[0,.3,0],la:V(.05,.15,1),lf:V(.03,.15,1),ra:V(-.9,.15,-.2),rf:V(.9,.3,.1),lu:V(.15,-1,.15),ru:V(-.15,-1,-.15)})],[.7,base({hr:[0,.9,0],sp:[0,.3,0],la:V(.05,.15,1),lf:V(.03,.15,1),ra:V(-.8,-.2,-.5),rf:V(-.4,-.5,-.6)})],[1,base()]]},
 block:{d:1,keys:[[0,base()],[.25,base({sp:[.2,0,0],hips:[0,-.06,0],la:V(.35,-.3,.8),lf:V(-.4,.6,.6),ra:V(-.4,-.6,.5),rf:V(-.2,.2,1),lu:V(.15,-1,.3),ll:V(.1,-1,-.1),ru:V(-.15,-1,-.2),rl:V(-.1,-1,-.3)})],
  [.75,base({sp:[.2,0,0],hips:[0,-.06,0],la:V(.35,-.3,.8),lf:V(-.4,.6,.6),ra:V(-.4,-.6,.5),rf:V(-.2,.2,1),lu:V(.15,-1,.3),ll:V(.1,-1,-.1),ru:V(-.15,-1,-.2),rl:V(-.1,-1,-.3)})],[1,base()]]},
 item:{d:1,keys:[[0,base()],[.4,base({sp:[-.1,0,0],hd:[-.35,0,0],ra:V(-.3,-.2,.9),rf:V(.4,.9,.2)})],[.7,base({sp:[-.1,0,0],hd:[-.35,0,0],ra:V(-.3,-.2,.9),rf:V(.4,.9,.2)})],[1,base()]]},
 hit:{d:.5,keys:[[0,base()],[.12,base({hips:[0,-.02,-.04],sp:[-.35,.15,.1],hd:[-.3,0,0],la:V(.6,-.6,-.3),ra:V(-.6,-.6,-.3)})],[.5,base()]]},
 die:{d:1.5,keys:[[0,base()],[.3,base({sp:[-.3,0,0],hd:[-.3,0,0],hips:[0,-.08,-.05],la:V(.7,-.3,-.3),ra:V(-.7,-.3,-.3),lu:V(.1,-1,.3),ru:V(-.1,-1,.3),ll:V(.1,-1,-.6),rl:V(-.1,-1,-.6)})],
  [.9,base({hips:[0,-.75,-.25],hr:[-1.45,0,0],sp:[-.1,0,0],hd:[-.2,.3,0],la:V(.9,0,-.3),lf:V(.8,.3,-.4),ra:V(-.9,.1,-.2),rf:V(-.7,.5,-.3),lu:V(.15,-.2,1),ll:V(.12,-.4,1),ru:V(-.15,-.2,1),rl:V(-.12,-.4,1)})],
  [1.5,base({hips:[0,-.82,-.3],hr:[-1.52,0,0],sp:[-.05,0,0],hd:[-.1,.4,0],la:V(.95,.05,-.2),lf:V(.8,.4,-.3),ra:V(-.95,.1,-.1),rf:V(-.7,.6,-.2),lu:V(.15,-.15,1),ll:V(.12,-.3,1),ru:V(-.18,-.15,1),rl:V(-.12,-.3,1)})]]},
};
const ALIAS={jump:'atk',slam:'atk',bite:'atk',shoot:'cast',summon:'cast',breath:'cast',taunt:'raise'};
export const MXSET={idle:'mx_idle',walk:'mx_run',atk:'mx_atk',spin:'mx_spin',jump:'mx_atk',cast:'mx_cast',shoot:'mx_cast',raise:'mx_raise',summon:'mx_cast',bow:'mx_bow',block:'mx_block',item:'mx_item',slam:'mx_atk',bite:'mx_atk',breath:'mx_cast',hit:'mx_hit',die:'mx_die',taunt:'mx_raise'};
// génère les clips pour un modèle (les orientations de repos diffèrent d'un personnage à l'autre)
export function mxClips(root,opts={}){const B=rig(root);if(!B.Hips)return[];root.updateMatrixWorld(true);
 const rest={};BN.forEach(n=>{if(B[n])rest[n]={q:B[n].quaternion.clone(),p:B[n].position.clone()};});const used=Object.keys(rest);
 rest.Hips.h=B.Hips.position.length()||1;
 // ajustements de style (mage : plus voûtée, archère : plus souple…)
 const st=opts.style||{};
 const clips=[];
 for(const k in CLIPS){const C=CLIPS[k];const fps=C.loop?15:20;const n=Math.max(2,Math.round(C.d*fps)+1);const times=[],Q={},Pp=[];used.forEach(b=>Q[b]=[]);
  const keyAt=t=>{if(typeof C.keys==='function')return C.keys(t);const K=C.keys;let i=0;while(i<K.length-2&&t>K[i+1][0])i++;const [t0,a]=K[i],[t1,b]=K[i+1];return lerpP(a,b,ease(Math.min(1,Math.max(0,(t-t0)/(t1-t0)))));};
  let fz0=1e9,fz1=-1e9;const fw=new THREE.Vector3();
  for(let i=0;i<n;i++){const t=i/(n-1)*C.d;let P=keyAt(C.loop&&i===n-1?0:t);if(st.sp)P=Object.assign({},P,{sp:(P.sp||[0,0,0]).map((v,j)=>v+st.sp[j])});apply(B,rest,P);times.push(t);
   if((k==='walk'||k==='run')&&B.LeftFoot){B.LeftFoot.getWorldPosition(fw);root.worldToLocal(fw);fz0=Math.min(fz0,fw.z);fz1=Math.max(fz1,fw.z);}
   used.forEach(b=>Q[b].push(...B[b].quaternion.toArray()));Pp.push(...B.Hips.position.toArray());}
  const tracks=used.map(b=>new THREE.QuaternionKeyframeTrack(B[b].name+'.quaternion',times,Q[b]));tracks.push(new THREE.VectorKeyframeTrack(B.Hips.name+'.position',times,Pp));
  const clip=new THREE.AnimationClip('mx_'+k,C.d,tracks);if(k==='walk'||k==='run')clip.userData={stride:2*(fz1-fz0)};clips.push(clip);}
 for(const n in rest){B[n].quaternion.copy(rest[n].q);B[n].position.copy(rest[n].p);}root.updateMatrixWorld(true);
 return clips;}

/* ---------- dragon (squelette Character Creator : Hip, Torso, Neck, Head, Lower_Jaw, Tail_xx, ailes l/rShoulder) ---------- */
export const DRSET={idle:'dr_idle',walk:'dr_walk',atk:'dr_bite',bite:'dr_bite',slam:'dr_slam',spin:'dr_slam',jump:'dr_slam',cast:'dr_breath',breath:'dr_breath',shoot:'dr_breath',summon:'dr_roar',raise:'dr_roar',taunt:'dr_roar',hit:'dr_hit',die:'dr_die',block:'dr_roar',item:'dr_roar'};
export function drClips(root){const B={};root.traverse(o=>{if(o.isBone&&!B[o.name])B[o.name]=o;});const body=root.children[0];if(!body||!B.Hip)return{clips:[],flip:false};
 body.name='drBody';const bq=body.quaternion.clone(),bp=body.position.clone();
 // le dragon regarde vers +Z ou -Z : on le détermine par la géométrie (tête plus haute que la queue n'est pas fiable), on garde l'orientation du fichier
 const H=600;const loc=(n,x,y,z)=>{const b=B[n];if(!b)return null;return b.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z)));};
 const tails=Object.keys(B).filter(n=>/^Tail_\d\d$/.test(n)).sort();const necks=['Neck_01','Neck_02','Neck_03'].filter(n=>B[n]);
 const D={
  idle:{loop:1,d:3,k:t=>{const b=Math.sin(t/3*6.283);return{pitch:b*.015,y:b*.006,jaw:.04+Math.max(0,b)*.06,nk:b*.05,tw:i=>Math.sin(t/3*6.283+i*.5)*.035,wg:b*.05};}},
  walk:{loop:1,d:1.2,k:t=>{const s=Math.sin(t/1.2*6.283);return{roll:s*.03,y:Math.abs(s)*.015,tw:i=>Math.sin(t/1.2*6.283+i*.45)*.05,jaw:.04};}},
  bite:{d:1,keys:[[0,{}],[.35,{pitch:-.12,z:-.05,jaw:.1,nk:-.1}],[.55,{pitch:.1,z:.22,y:-.02,jaw:.55,nk:.15}],[.7,{pitch:.06,z:.15,jaw:.05}],[1,{}]]},
  slam:{d:1.2,keys:[[0,{}],[.4,{pitch:-.25,y:.12,wg:.35}],[.65,{pitch:.12,y:-.02,z:.12,wg:-.25}],[1.2,{}]]},
  breath:{d:1.6,keys:[[0,{}],[.45,{pitch:-.22,y:.05,jaw:.2,nk:-.15,wg:.2}],[.7,{pitch:.08,z:.1,jaw:.65,nk:.12,wg:.15}],[1.25,{pitch:.08,z:.1,jaw:.65,nk:.12,wg:.15}],[1.6,{}]]},
  roar:{d:1.6,keys:[[0,{}],[.5,{pitch:-.35,y:.08,jaw:.7,nk:-.2,wg:.45}],[1.1,{pitch:-.35,y:.08,jaw:.7,nk:-.2,wg:.45}],[1.6,{}]]},
  hit:{d:.5,keys:[[0,{}],[.12,{pitch:-.12,z:-.08,jaw:.3,roll:.06}],[.5,{}]]},
  die:{d:2,keys:[[0,{}],[.5,{pitch:-.3,y:.06,jaw:.6,wg:.3}],[1.3,{roll:1.3,y:-.12,jaw:.4,wg:-.2}],[2,{roll:1.45,y:-.16,jaw:.3,wg:-.25}]]},
 };
 const clips=[];const P0=new THREE.Vector3();
 for(const k in D){const C=D[k];const n=Math.round(C.d*15)+1,times=[];const T={bq:[],bp:[]};const bones={};
  const at=t=>{if(C.k)return C.k(t);const K=C.keys;let i=0;while(i<K.length-2&&t>K[i+1][0])i++;const [t0,a]=K[i],[t1,b]=K[i+1];const u=ease(Math.min(1,Math.max(0,(t-t0)/(t1-t0))));const o={};
   for(const key of new Set([...Object.keys(a),...Object.keys(b)]))o[key]=(a[key]||0)+((b[key]||0)-(a[key]||0))*u;return o;};
  const push=(name,q)=>{if(!q)return;(bones[name]=bones[name]||[]).push(...q.toArray());};
  for(let i=0;i<n;i++){const t=i/(n-1)*C.d;const P=at(C.loop&&i===n-1?0:t);times.push(t);
   // mouvement du corps entier (repère du modèle : X = tangage, Z = roulis)
   const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(-(P.pitch||0),0,P.roll||0)).multiply(bq);T.bq.push(...q.toArray());
   T.bp.push(bp.x,bp.y+(P.y||0)*H,bp.z+(P.z||0)*H*3);
   // petites rotations locales (mâchoire, cou, queue, ailes)
   
   tails.forEach((nn,j)=>push(nn,loc(nn,0,0,P.tw?P.tw(j):0)));push('lShoulder',loc('lShoulder',0,0,P.wg||0));push('rShoulder',loc('rShoulder',0,0,-(P.wg||0)));}
  const tr=[new THREE.QuaternionKeyframeTrack('drBody.quaternion',times,T.bq),new THREE.VectorKeyframeTrack('drBody.position',times,T.bp)];
  for(const b in bones)tr.push(new THREE.QuaternionKeyframeTrack(B[b].name+'.quaternion',times,bones[b]));clips.push(new THREE.AnimationClip('dr_'+k,C.d,tr));}
 return{clips,flip:false};}
