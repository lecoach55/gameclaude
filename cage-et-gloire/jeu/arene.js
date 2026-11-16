// ===== Cage & Gloire · arène 3D (Three.js r160) : octogone, cage, foule, lumières, combattants animés par poses =====
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const A={ok:false,actif:false,vitesse:1,qual:1,rs:1};
// fusionne les objets statiques d'un groupe par matériau : quelques appels de dessin au lieu de dizaines
function fusion(g,dest){g.updateMatrixWorld(true);const par=new Map();g.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;let L=par.get(o.material);if(!L)par.set(o.material,L=[]);const ge=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone());ge.applyMatrix4(o.matrixWorld);for(const k of Object.keys(ge.attributes))if(!['position','normal','uv'].includes(k))ge.deleteAttribute(k);if(!ge.attributes.uv)return;L.push(ge);});
 for(const [m,L] of par){const ge=mergeGeometries(L,false);if(!ge)continue;const me=new THREE.Mesh(ge,m);me.matrixAutoUpdate=false;dest.add(me);}}
let R,S,C,canvas,base=null,clock=new THREE.Clock();
const PEAUX=['#f2cdb0','#e3b08c','#c98d66','#a86d48','#7b4b2e','#4f2f1c'];
const CHEV=['#1a1410','#2b1d14','#4a3020','#7a5630','#b8935a','#d9c39a'];
const V=(x,y,z)=>new THREE.Vector3(x,y,z).normalize();
const _q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_q3=new THREE.Quaternion(),_v=new THREE.Vector3(),_w=new THREE.Vector3();
const CHILD={LeftArm:'LeftForeArm',LeftForeArm:'LeftHand',RightArm:'RightForeArm',RightForeArm:'RightHand',LeftUpLeg:'LeftLeg',LeftLeg:'LeftFoot',RightUpLeg:'RightLeg',RightLeg:'RightFoot',LeftFoot:'LeftToeBase',RightFoot:'RightToeBase',Spine2:'Neck',Neck:'Head'};

/* ---------- textures réalistes intégrées (Poly Haven, CC0 ; outils/prep_tex.py) ---------- */
const TXI={};function texImg(nom,rep){if(A.qual<1)return null;const el=document.getElementById('tex-'+nom);if(!el)return null;let t=TXI[nom];
 if(!t){const im=new Image();t=TXI[nom]=new THREE.Texture(im);im.onload=()=>{t.needsUpdate=true;};im.src='data:image/jpeg;base64,'+el.textContent.trim();t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.NoColorSpace;t.anisotropy=4;t.userData.keep=1;}
 const c=t.clone();c.needsUpdate=true;c.repeat.set(rep,rep);return c;}
/* ---------- textures dessinées ---------- */
function cvTex(w,h,f){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');f(g,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function texSol(O){return cvTex(1024,1024,(g,w,h)=>{
 const cx=w/2,cy=h/2;const gr=g.createRadialGradient(cx,cy,60,cx,cy,520);gr.addColorStop(0,'#e9e8e2');gr.addColorStop(.7,'#d6d5cd');gr.addColorStop(1,'#c4c2b9');g.fillStyle=gr;g.fillRect(0,0,w,h);
 // grain de toile
 g.globalAlpha=.05;for(let i=0;i<9000;i++){g.fillStyle=Math.random()<.5?'#000':'#fff';g.fillRect(Math.random()*w,Math.random()*h,2,2);}g.globalAlpha=1;
 // lés de bâche (coutures) et traces de pas / glissades (usure de la toile)
 g.strokeStyle='rgba(60,55,45,.10)';g.lineWidth=2;for(let x=128;x<w;x+=192){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}
 for(let i=0;i<260;i++){const a=Math.random()*7,r=Math.pow(Math.random(),.7)*430,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;g.save();g.translate(x,y);g.rotate(Math.random()*7);
  g.fillStyle='rgba(70,60,48,'+(.025+Math.random()*.05)+')';g.beginPath();g.ellipse(0,0,8+Math.random()*26,3+Math.random()*7,0,0,7);g.fill();g.restore();}
 for(let i=0;i<14;i++){const a=Math.random()*7,r=Math.random()*400,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;const rg=g.createRadialGradient(x,y,2,x,y,30+Math.random()*40);rg.addColorStop(0,'rgba(90,80,62,.10)');rg.addColorStop(1,'rgba(90,80,62,0)');g.fillStyle=rg;g.fillRect(x-80,y-80,160,160);}
 // octogone intérieur coloré
 const oct=(r,col,lw)=>{g.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}g.closePath();g.strokeStyle=col;g.lineWidth=lw;g.stroke();};
 g.save();g.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;g.lineTo(cx+Math.cos(a)*505,cy+Math.sin(a)*505);}g.closePath();g.clip();
 g.fillStyle=O.c1;g.globalAlpha=.9;g.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;g.lineTo(cx+Math.cos(a)*512,cy+Math.sin(a)*512);}g.fill();
 g.globalAlpha=1;g.fillStyle='#ececE6';g.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;g.lineTo(cx+Math.cos(a)*450,cy+Math.sin(a)*450);}g.fill();g.restore();
 oct(450,O.c2,6);
 // logo central
 g.save();g.translate(cx,cy);g.fillStyle=O.c2;g.globalAlpha=.92;g.beginPath();g.arc(0,0,175,0,7);g.fill();g.globalAlpha=1;
 g.strokeStyle=O.c1;g.lineWidth=10;g.beginPath();g.arc(0,0,160,0,7);g.stroke();
 g.fillStyle=O.c1;g.font='bold 150px "Bebas Neue",Impact,sans-serif';g.textAlign='center';g.textBaseline='middle';const L=O.court;let fs=150;while(g.measureText(L).width>270&&fs>60){fs-=8;g.font='bold '+fs+'px "Bebas Neue",Impact,sans-serif';}
 g.fillText(L,0,6);g.fillStyle=O.acc||'#fff';g.font='34px "Bebas Neue",Impact,sans-serif';g.fillText('FIGHTING',0,-112);g.fillText('★ ★ ★',0,118);g.restore();
 g.save();g.globalCompositeOperation='multiply';for(let i=0;i<70;i++){const a=Math.random()*7,r=Math.random()*170;g.fillStyle='rgba(200,195,185,'+(.15+Math.random()*.2)+')';g.beginPath();g.ellipse(cx+Math.cos(a)*r,cy+Math.sin(a)*r,6+Math.random()*18,2+Math.random()*5,Math.random()*3,0,7);g.fill();}g.restore();
 // inscriptions de sponsors (fictifs)
 const sp=['CAGE & GLOIRE','IRON FUEL','NORDIK TAPE','VOLTA','KARBON GEAR','ATLAS GYM','RHINO WRAPS','PULSE'];
 g.font='44px "Bebas Neue",Impact,sans-serif';g.textAlign='center';
 for(let i=0;i<8;i++){const a=i*Math.PI/4;g.save();g.translate(cx+Math.cos(a)*310,cy+Math.sin(a)*310);g.rotate(a+Math.PI/2);g.fillStyle='rgba(20,20,26,.28)';g.fillText(sp[i],0,0);g.restore();}
 // sol extérieur sombre
 g.globalCompositeOperation='destination-over';g.fillStyle='#16161b';g.fillRect(0,0,w,h);});}
function texGrillage(){const t=cvTex(128,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='#fff';g.lineWidth=9;g.lineCap='round';g.lineJoin='round';
 g.beginPath();g.moveTo(0,h/2);g.lineTo(w/2,0);g.lineTo(w,h/2);g.lineTo(w/2,h);g.closePath();g.stroke();});t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.NoColorSpace;return t;}
function texEcran(O,txt){return cvTex(1024,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,O.c2);gr.addColorStop(.5,'#050507');gr.addColorStop(1,O.c2);g.fillStyle=gr;g.fillRect(0,0,w,h);
 g.fillStyle=O.c1;g.font='150px "Bebas Neue",Impact,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(txt||O.court,w/2,h/2+8);
 g.globalAlpha=.25;for(let y=0;y<h;y+=4){g.fillStyle='#000';g.fillRect(0,y,w,2);}});}
function texFoule(){return cvTex(512,512,(g,w,h)=>{g.clearRect(0,0,w,h);const rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
 // 4×4 spectateurs vus de face, éclairés par la cage (haut des têtes et des épaules plus clairs)
 for(let i=0;i<4;i++)for(let j=0;j<4;j++){const x=i*128+64+rnd(-6,6),y=j*128+70;
  const sk=pick(['#e9bf9f','#d6a27c','#b07a55','#87573a','#5e3b26','#f0cdb4']),cl=pick(['#1d2330','#5d1d24','#26382a','#c9c6bf','#1b3866','#3a2a48','#6f4214','#0e0e10','#7d7f86','#9b2a20','#ddd8cc','#203a40']);
  const hr=pick(['#17110c','#2c1d12','#4b3221','#7a5934','#b7955e','#888','#0a0a0a']);const bras=Math.random()<.22,tel=!bras&&Math.random()<.12,cas=Math.random()<.14;
  // buste
  let gr=g.createLinearGradient(0,y+8,0,y+60);gr.addColorStop(0,cl);gr.addColorStop(1,'#050506');g.fillStyle=gr;
  g.beginPath();g.moveTo(x-40,y+64);g.quadraticCurveTo(x-42,y+18,x-22,y+12);g.lineTo(x+22,y+12);g.quadraticCurveTo(x+42,y+18,x+40,y+64);g.closePath();g.fill();
  if(bras){const s=Math.random()<.5?-1:1;g.strokeStyle=cl;g.lineWidth=13;g.lineCap='round';g.beginPath();g.moveTo(x+s*28,y+22);g.quadraticCurveTo(x+s*44,y-10,x+s*34,y-48);g.stroke();g.fillStyle=sk;g.beginPath();g.arc(x+s*34,y-52,8,0,7);g.fill();
   if(Math.random()<.4){g.beginPath();g.moveTo(x-s*28,y+22);g.quadraticCurveTo(x-s*44,y-10,x-s*34,y-48);g.stroke();g.beginPath();g.arc(x-s*34,y-52,8,0,7);g.fill();}}
  // cou et tête
  g.fillStyle=sk;g.fillRect(x-7,y-2,14,16);gr=g.createRadialGradient(x-4,y-22,2,x,y-16,20);gr.addColorStop(0,sk);gr.addColorStop(1,'#00000000');
  g.beginPath();g.ellipse(x,y-16,15,19,0,0,7);g.fillStyle=sk;g.fill();g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(x,y-8,15,11,0,0,Math.PI);g.fill();
  // cheveux / casquette
  g.fillStyle=cas?pick(['#111','#9b1c1c','#1d3d7a','#ddd']):hr;g.beginPath();if(cas){g.ellipse(x,y-28,17,10,0,Math.PI,0);g.fill();g.fillRect(x-17,y-29,34,4);}
  else if(Math.random()<.85){g.ellipse(x,y-26,16,12,0,Math.PI*1.02,-.02);g.fill();if(Math.random()<.3){g.fillRect(x-16,y-26,6,30);g.fillRect(x+10,y-26,6,30);}}
  // téléphone allumé
  if(tel){g.fillStyle='rgba(150,180,215,.55)';g.fillRect(x+14,y-1,8,12);g.fillStyle='rgba(150,190,240,.12)';g.beginPath();g.arc(x+18,y+5,16,0,7);g.fill();}
  // reflet du haut (lumière de la cage)
  g.fillStyle='rgba(255,240,215,.16)';g.beginPath();g.ellipse(x,y-30,10,5,0,0,7);g.fill();g.fillRect(x-24,y+12,48,3);}});}
/* ---------- scène ---------- */
function construire(O){
 if(S){const vus=new Set();S.traverse(o=>{if(o.geometry&&!o.userData.keep)o.geometry.dispose();if(o.material&&!o.isSkinnedMesh)[].concat(o.material).forEach(m=>{if(!m||vus.has(m))return;vus.add(m);['map','alphaMap','normalMap'].forEach(k=>{const t=m[k];if(t&&!t.userData.keep&&t!==TBLOB)t.dispose();});m.dispose();});});}
 A.ledTex=null;S=new THREE.Scene();S.background=new THREE.Color('#06060a');S.fog=new THREE.FogExp2('#07070b',.034);
 const tSol=texSol(O);
 // sol de l'octogone
 const RO=4.7;const sol=new THREE.Mesh(new THREE.CircleGeometry(RO*1.08,8,Math.PI/8),new THREE.MeshStandardMaterial({map:tSol,color:'#c9c7c0',roughness:.72,metalness:0,normalMap:A.qual>=2?texImg('tapis_n',44):null,normalScale:new THREE.Vector2(.55,.55)}));
 sol.geometry.attributes.uv.array.forEach((v,i,a)=>{});
 // UV : projection plane
 {const p=sol.geometry.attributes.position,uv=sol.geometry.attributes.uv;for(let i=0;i<p.count;i++){uv.setXY(i,.5+p.getX(i)/(RO*2.16)*1.0,.5+p.getY(i)/(RO*2.16));}}
 sol.rotation.x=-Math.PI/2;sol.receiveShadow=true;S.add(sol);
 // plateforme
 const plat=new THREE.Mesh(new THREE.CylinderGeometry(RO*1.16,RO*1.2,.75,8,1,false,Math.PI/8),new THREE.MeshStandardMaterial({color:'#121216',roughness:.6,metalness:.3}));plat.position.y=-.38;S.add(plat);
 const bord=new THREE.Mesh(new THREE.CylinderGeometry(RO*1.165,RO*1.165,.08,8,1,true,Math.PI/8),new THREE.MeshStandardMaterial({color:O.c1,emissive:O.c1,emissiveIntensity:.6}));bord.position.y=-.03;S.add(bord);
 // poteaux, rembourrages, grillage
 const R1=RO*1.03;const pts=[];for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;pts.push(new THREE.Vector3(Math.cos(a)*R1,0,Math.sin(a)*R1));}
 const mPost=new THREE.MeshStandardMaterial({color:'#2a2b30',roughness:.35,metalness:.45});const mPad=new THREE.MeshStandardMaterial({color:new THREE.Color(O.c1).multiplyScalar(.85),roughness:.42});
 const tG=texGrillage();const mG=new THREE.MeshLambertMaterial({color:'#b4b9c1',alphaMap:tG,transparent:true,alphaTest:.12,side:THREE.DoubleSide,depthWrite:false});
 const H=1.95;const ST0=new THREE.Group();const mRail=new THREE.MeshStandardMaterial({color:'#121214',roughness:.36}),mBas=new THREE.MeshStandardMaterial({color:'#101013',roughness:.45});
 for(let i=0;i<8;i++){const p=pts[i],q=pts[(i+1)%8];
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,H+.15,10),mPost);post.position.set(p.x,H/2,p.z);ST0.add(post);
  const pad=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,1.5,14),mPad);pad.position.set(p.x,1.0,p.z);ST0.add(pad);
  const L=p.distanceTo(q),m=p.clone().add(q).multiplyScalar(.5),ang=Math.atan2(q.x-p.x,q.z-p.z);
  const pan=new THREE.Mesh(new THREE.PlaneGeometry(L,H-.25),mG);pan.position.set(m.x,(H-.25)/2+.22,m.z);pan.rotation.y=ang+Math.PI/2;tG.repeat.set(L*7,(H-.25)*7);ST0.add(pan);
  const rail=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,L,10),mRail);rail.position.set(m.x,H,m.z);rail.rotation.z=Math.PI/2;rail.rotation.y=ang+Math.PI/2;ST0.add(rail);
  const bas=new THREE.Mesh(new THREE.BoxGeometry(L,.22,.14),mBas);bas.position.set(m.x,.11,m.z);bas.rotation.y=ang+Math.PI/2;ST0.add(bas);}
 // la cage a un repère de texture commun : on fixe la répétition du grillage pour toutes les faces

 // gradins et foule
 const tF=texFoule();const mMarche=new THREE.MeshLambertMaterial({color:'#0b0b0e',side:THREE.BackSide});const IM=[],IC=[];
 const mat=new THREE.MeshLambertMaterial({map:tF,alphaTest:.5});
 mat.onBeforeCompile=sh=>{sh.uniforms.uT=FOULE.t;sh.uniforms.uE=FOULE.e;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT,uE;').replace('#include <begin_vertex>','#include <begin_vertex>\nfloat ph=float(gl_InstanceID)*1.731;transformed.y+=(sin(uT*(2.+fract(ph)*2.)+ph)*.03+max(0.,sin(uT*7.+ph*3.))*uE*.22);');};
 for(let rg=0;rg<9;rg++){const rr=RO*1.75+rg*1.05,hh=.2+rg*.62;const n=Math.round(rr*7.5*(A.qual===0?.6:1));
  const marche=new THREE.Mesh(new THREE.CylinderGeometry(rr+.55,rr+.55,.25,40,1,true),mMarche);marche.position.y=hh-.2;ST0.add(marche);
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(1,1,1);
  for(let k=0;k<n;k++){const a=k/n*Math.PI*2+rg*.13;const x=Math.cos(a)*rr,z=Math.sin(a)*rr;q.setFromAxisAngle(new THREE.Vector3(0,1,0),-a-Math.PI/2);m4.compose(new THREE.Vector3(x,hh+.3,z),q,sc);IM.push(m4.clone());const kr=1-rg/9*.62;IC.push(new THREE.Color().setHSL(.07+Math.random()*.05,.25,(.5+Math.random()*.3)*kr));}}
 {const im=new THREE.InstancedMesh(new THREE.PlaneGeometry(1.05,1.05),mat,IM.length);IM.forEach((m,k)=>{im.setMatrixAt(k,m);im.setColorAt(k,IC[k]);});S.add(im);}
 // bandeau lumineux (LED) au pied des gradins, aux couleurs de l'organisation
 if(A.qual>=1){const tb=cvTex(2048,64,(g,w,h)=>{g.fillStyle='#030305';g.fillRect(0,0,w,h);const sp=[O.court,'CAGE & GLOIRE','IRON FUEL',O.court,'VOLTA','NORDIK TAPE',O.court,'KARBON GEAR'];
  g.font='46px "Bebas Neue",Impact,sans-serif';g.textBaseline='middle';g.textAlign='center';sp.forEach((t,i)=>{const x=(i+.5)*w/sp.length;g.fillStyle=i%3===0?O.c1:(O.acc||'#e8e8e8');g.fillText(t,x,h/2+3);g.fillStyle=O.c2==='#000'?'#333':O.c2;g.fillRect(x+w/sp.length/2-3,10,3,h-20);});
  g.globalAlpha=.3;for(let x=0;x<w;x+=3){g.fillStyle='#000';g.fillRect(x,0,1,h);}});tb.wrapS=THREE.RepeatWrapping;tb.repeat.set(-3,1);A.ledTex=tb;
  const led=new THREE.Mesh(new THREE.CylinderGeometry(RO*1.75-.55,RO*1.75-.55,.42,64,1,true),new THREE.MeshBasicMaterial({map:tb,side:THREE.BackSide,fog:false}));led.position.y=.32;S.add(led);}
 // flashs d'appareils photo
 const nf=160,fg=new THREE.BufferGeometry(),fp=new Float32Array(nf*3);for(let k=0;k<nf;k++){const a=Math.random()*Math.PI*2,rg=Math.random()*9;fp[k*3]=Math.cos(a)*(RO*1.75+rg*1.05);fp[k*3+1]=.6+rg*.62;fp[k*3+2]=Math.sin(a)*(RO*1.75+rg*1.05);}
 fg.setAttribute('position',new THREE.BufferAttribute(fp,3));const fc=new Float32Array(nf*3);fg.setAttribute('color',new THREE.BufferAttribute(fc,3));
 // sprite rond : cœur blanc, halo bleuté et petite croix d'éclat (au lieu de carrés blancs)
 const tfl=cvTex(64,64,(g,w,h)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.12,'rgba(255,255,255,.95)');r.addColorStop(.3,'rgba(200,220,255,.35)');r.addColorStop(1,'rgba(160,190,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h);
  g.globalCompositeOperation='lighter';const l=g.createLinearGradient(0,32,64,32);l.addColorStop(0,'rgba(255,255,255,0)');l.addColorStop(.5,'rgba(255,255,255,.5)');l.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=l;g.fillRect(0,31,64,2);g.fillRect(31,0,2,64);});
 A.flash=new THREE.Points(fg,new THREE.PointsMaterial({size:.5,map:tfl,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));S.add(A.flash);
 // portique d'éclairage + écran géant
 const rig=new THREE.Group();rig.position.y=7.4;S.add(rig);
 const mT=new THREE.MeshStandardMaterial({color:'#222',metalness:.8,roughness:.35});const mLamp=new THREE.MeshBasicMaterial({color:'#fffbe8'});
 for(let i=0;i<8;i++){const a=i*Math.PI/4,b=(i+1)*Math.PI/4,r=4.2;const p=new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r),q=new THREE.Vector3(Math.cos(b)*r,0,Math.sin(b)*r);
  const L=p.distanceTo(q),m=p.clone().add(q).multiplyScalar(.5);const tr=new THREE.Mesh(new THREE.BoxGeometry(L,.25,.25),mT);tr.position.copy(m);tr.position.y+=7.4;tr.rotation.y=-Math.atan2(q.z-p.z,q.x-p.x);ST0.add(tr);
  for(let k=0;k<3;k++){const lp=p.clone().lerp(q,(k+1)/4);const lamp=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,.3,10),mLamp);lamp.position.copy(lp);lamp.position.y=7.2;ST0.add(lamp);}}
 fusion(ST0,S);
 const ecrTex=texEcran(O);A.ecrTex=ecrTex;const box=new THREE.Mesh(new THREE.BoxGeometry(3.6,.9,3.6),[0,1,2,3,4,5].map(i=>i===2||i===3?new THREE.MeshStandardMaterial({color:'#111'}):new THREE.MeshBasicMaterial({map:ecrTex})));box.position.y=2.1;rig.add(box);
 // cônes de lumière (atmosphère)
 const coneM=new THREE.MeshBasicMaterial({color:'#fff6dc',transparent:true,opacity:.022,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
 // faisceaux de projecteurs dans la brume (qualité Haute) : un seul objet fusionné
 if(A.qual>=2){const CG=new THREE.Group();const nb=6;for(let i=0;i<nb;i++){const a=i/nb*Math.PI*2+.4;const cone=new THREE.Mesh(new THREE.ConeGeometry(2.1,7.2,20,1,true),coneM);cone.position.set(Math.cos(a)*2.1,3.6,Math.sin(a)*2.1);cone.rotation.z=Math.cos(a)*.12;cone.rotation.x=-Math.sin(a)*.12;CG.add(cone);}fusion(CG,S);}
 // lumières
 S.add(new THREE.HemisphereLight('#c9d4ff','#20140c',.32));
 const key=new THREE.SpotLight('#fff1da',300,22,Math.PI/5.4,.55,1.6);key.position.set(0,9.5,0);key.target.position.set(0,0,0);
 A.key=key;
 if(A.qual>=2){key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0004;key.shadow.camera.near=4;key.shadow.camera.far=14;}S.add(key,key.target);
 const fill=new THREE.DirectionalLight('#ffe8d0',.7);fill.position.set(4,6,5);S.add(fill);
 const rimC=new THREE.DirectionalLight(new THREE.Color(O.c1).lerp(new THREE.Color('#8fb0ff'),.35),0.9);rimC.position.set(-5,3,-6);S.add(rimC);
 // combattants et arbitre
 A.f=[0,1].map(i=>{const h=perso();S.add(h.root);return h;});
 if(A.qual<2)A.f.forEach(h=>{h.blob=blob();S.add(h.blob);});
 A.arb=perso(true);S.add(A.arb.root);if(A.qual<2){A.arb.blob=blob();S.add(A.arb.blob);}
 // coins : tabourets et soigneurs (visibles entre les rounds)
 A.coins=[0,1].map(i=>{const g=new THREE.Group();const tab=new THREE.Mesh(new THREE.CylinderGeometry(.22,.26,.48,16),new THREE.MeshStandardMaterial({color:'#1a1a1f',roughness:.5}));tab.position.y=.24;g.add(tab);
  // matériel du coin (seau, bouteille, serviette, poche de glace) : un seul objet, couleurs par sommet
  {const L=[],add=(ge,x,y,z,col,ry=0)=>{ge=ge.toNonIndexed();ge.rotateY(ry);ge.translate(x,y,z);const c=new THREE.Color(col),n=ge.attributes.position.count,a=new Float32Array(n*3);for(let j=0;j<n;j++){a[j*3]=c.r;a[j*3+1]=c.g;a[j*3+2]=c.b;}ge.setAttribute('color',new THREE.BufferAttribute(a,3));ge.deleteAttribute('uv');L.push(ge);};
   add(new THREE.CylinderGeometry(.17,.13,.32,14,1,true),.48,.16,-.12,'#cfd2d6');add(new THREE.CircleGeometry(.165,14).rotateX(-Math.PI/2),.48,.27,-.12,'#5a6a78');
   add(new THREE.CylinderGeometry(.045,.045,.22,10),-.42,.11,-.05,i?'#2b55c9':'#c42a2a');add(new THREE.CylinderGeometry(.02,.03,.05,8),-.42,.245,-.05,'#eeeeee');
   add(new THREE.BoxGeometry(.38,.035,.26),0,.495,-.02,'#f1efe9',.3);add(new THREE.BoxGeometry(.16,.06,.12),-.25,.03,.22,'#8fb8d8',.6);
   const acc=new THREE.Mesh(mergeGeometries(L,false),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,side:THREE.DoubleSide}));g.add(acc);}
  const c=perso(true);const u=c.mat.userData.u;u.uTop.value.set(i?'#1d3f9e':'#9e1d26');u.uLeg.value.set('#202024');u.uSkin.value.set(['#e3b08c','#a86d48'][i]);u.uGlove.value.set(['#e3b08c','#a86d48'][i]);u.uHairOn.value=1;
  S.add(g,c.root);g.visible=false;c.root.visible=false;return {g,c};});
 A.O=O;}

/* ---------- personnages (Xbot recoloré par régions : peau, short, gants, cheveux) ---------- */
function vnzh(x,y,z){let h=Math.sin(x*12.9898+y*78.233+z*37.719)*43758.5453;return h-Math.floor(h);}
function vnz(x,y,z){const i=Math.floor(x),j=Math.floor(y),k=Math.floor(z);let fx=x-i,fy=y-j,fz=z-k;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);fz=fz*fz*(3-2*fz);const L=(a,b,t)=>a+(b-a)*t,h=vnzh;
 return L(L(L(h(i,j,k),h(i+1,j,k),fx),L(h(i,j+1,k),h(i+1,j+1,k),fx),fy),L(L(h(i,j,k+1),h(i+1,j,k+1),fx),L(h(i,j+1,k+1),h(i+1,j+1,k+1),fx),fy),fz);}
function regions(src){src.updateMatrixWorld(true);const BB=new THREE.Box3(),_p=new THREE.Vector3();const WP=new Map();src.traverse(o=>{if(o.isSkinnedMesh){const p=o.geometry.attributes.position,a=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){_p.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);a[i*3]=_p.x;a[i*3+1]=_p.y;a[i*3+2]=_p.z;BB.expandByPoint(_p);}WP.set(o,a);}});
 src.traverse(o=>{if(!o.isSkinnedMesh||o.geometry.userData.reg)return;const g=o.geometry;const p=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,nm=g.attributes.normal;
 const bones=o.skeleton.bones.map(b=>b.name.replace(/^mixamorig:?/,''));const bb=BB;const hgt=bb.max.y-bb.min.y;
 const JNT=/Joint/i.test(o.name+' '+(o.material&&o.material.name||''));const reg=new Float32Array(p.count);let hz0=1e9,hz1=-1e9;const hi=[];
 for(let i=0;i<p.count;i++){let bw=0,bi=0;for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(w>bw){bw=w;bi=si.getComponent(i,k);}}const n=bones[bi]||'';const W3=WP.get(o);const yn=(W3[i*3+1]-bb.min.y)/hgt;
  if(JNT&&yn>.55&&yn<.70&&(n==='Hips'||n==='Spine'||/UpLeg/.test(n)))reg[i]=1;else if(/Hand/.test(n))reg[i]=2;else if((n==='Hips'||/UpLeg/.test(n)||n==='Spine')&&yn>.405&&yn<(n==='Spine'||n==='Hips'?.675:.625))reg[i]=1;else if(n==='Head'||n==='HeadTop_End'){hi.push(i);const z=WP.get(o)[i*3+2];if(z<hz0)hz0=z;if(z>hz1)hz1=z;}
  else if(/Foot|Toe/.test(n))reg[i]=4;
  else if((/Spine|Shoulder/.test(n)||n==='LeftArm'||n==='RightArm')&&yn>=.6&&yn<.84)reg[i]=5;
  else if(/UpLeg|^LeftLeg|^RightLeg/.test(n))reg[i]=6;}
 const W4=WP.get(o);for(const i of hi){const yn=(W4[i*3+1]-bb.min.y)/hgt,zn=(W4[i*3+2]-hz0)/(hz1-hz0||1);if(yn>.965||(yn>.915&&zn<.45)||(yn>.94&&zn<.62))reg[i]=3;else if(yn<.918&&zn>.5)reg[i]=8;else reg[i]=7;}
 // position de repos en coordonnées communes aux deux maillages (x : gauche, y : hauteur 0-1, z : avant), pour le détail des matières
 const W5=WP.get(o),cx=(bb.min.x+bb.max.x)/2,cz=(bb.min.z+bb.max.z)/2,bp=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){bp[i*3]=(W5[i*3]-cx)/hgt;bp[i*3+1]=(W5[i*3+1]-bb.min.y)/hgt;bp[i*3+2]=(W5[i*3+2]-cz)/hgt;}
 // le bassin du mannequin (coque + rotule) faisait un « ballon » rouge sous le short : on l'aplatit vers l'axe du corps
 {const inv=o.matrixWorld.clone().invert(),q=new THREE.Vector3();for(let i=0;i<p.count;i++)if(reg[i]===1){const dx=(W5[i*3]-cx)/hgt,c=Math.exp(-dx*dx/.005)*Math.exp(-Math.pow((W5[i*3+1]-bb.min.y)/hgt-.555,2)/.005),k=1-.65*c,fz=(JNT?.72:.82)*k,y0=bb.min.y+.56*hgt;q.set(cx+(W5[i*3]-cx)*(JNT?.86:.95)*k,y0+(W5[i*3+1]-y0)*(1-.2*c),cz+(W5[i*3+2]-cz)*fz).applyMatrix4(inv);p.setXYZ(i,q.x,q.y,q.z);}p.needsUpdate=true;}
 // bruits basse fréquence (grain de peau, plis du tissu) calculés une fois par sommet sur le processeur
 const nzv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){const x=bp[i*3],y=bp[i*3+1],z=bp[i*3+2];nzv[i*2]=vnz(x*30,y*30,z*30);nzv[i*2+1]=vnz(x*70,y*16,z*70);}g.setAttribute('nzv',new THREE.BufferAttribute(nzv,2));
 g.setAttribute('reg',new THREE.BufferAttribute(reg,1));g.setAttribute('bp',new THREE.BufferAttribute(bp,3));g.userData.reg=1;});}
// matière des personnages : peau (relief des muscles, grain, visage), short MMA (plis, ceinture, bandes), gants ouverts et bandages,
// cheveux par coupe (chev 0-7), barbe en poils courts. Tout est calculé dans le shader à partir de la position de repos commune (attribut bp).
const GLSL_BRUIT=`
float hh(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
float nz(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hh(i),hh(i+vec3(1,0,0)),f.x),mix(hh(i+vec3(0,1,0)),hh(i+vec3(1,1,0)),f.x),f.y),mix(mix(hh(i+vec3(0,0,1)),hh(i+vec3(1,0,1)),f.x),mix(hh(i+vec3(0,1,1)),hh(i+vec3(1,1,1)),f.x),f.y),f.z);}
`;
const GLSL_PERSO=`
uniform vec3 uSkin,uShort,uGlove,uHair,uTop,uLeg,uAcc;uniform float uHairOn,uTopOn,uLegOn,uDmg,uSweat,uBarbe,uChev,uArb,uMus,uFem;uniform vec3 uRim;flat varying float vReg;varying vec3 vBP;varying vec2 vNz;
float g1(float x,float s){return exp(-x*x/(s*s));}
vec3 pnArb(vec3 sp,vec3 sn,vec2 dH,float fd){vec3 sx=normalize(dFdx(sp)),sy=normalize(dFdy(sp));vec3 r1=cross(sy,sn),r2=cross(sn,sx);float det=dot(sx,r1)*fd;vec3 gr=sign(det)*(dH.x*r1+dH.y*r2);return normalize(abs(det)*sn-gr);}
`;
const GLSL_COULEUR=`
vec3 P=vBP;float ax=abs(P.x);float gH=0.;float gR=-1.;float rr=floor(vReg+.5);
float fr=smoothstep(.0,.035,P.z),dos=smoothstep(.0,-.035,P.z);
// peau : teinte non uniforme (rougeurs, grain), plus rouge aux articulations et au visage
float n1=vNz.x,nF=vNz.y,nH=.5;
#ifdef CG_PROCHE
nH=nz(vec3(P.x*520.,P.y*90.,P.z*520.));
#endif
vec3 sk=uSkin*(.93+.12*n1);sk=mix(sk,sk*vec3(1.1,.86,.84),.3*smoothstep(.55,.9,n1*n1*1.4));
vec3 cc=sk;
#ifdef CG_PROCHE
if(rr==1.&&uArb<.5){ // short MMA : plis, ceinture élastique, bande latérale, ourlet
 float pl=nF;gH+=pl*1.1;vec3 s=uShort*(.84+.26*pl);
 float wb=smoothstep(.588,.592,P.y);s=mix(s,uShort*.35,wb);s=mix(s,uAcc,wb*step(.6,P.y)*(1.-step(.607,P.y)));
 float sd=(1.-smoothstep(.003,.0045,abs(ax-.1)))*(1.-wb)*step(P.y,.56)*(1.-smoothstep(.012,.025,abs(P.z)));s=mix(s,uAcc*.92,sd*.85);
 float hm=1.-smoothstep(.428,.432,P.y);s=mix(s,uShort*.55,hm);
 cc=s;gR=.86;}
else if(rr==1.)cc=uShort;
else if(rr==2.&&uArb<.5){ // gant MMA ouvert : bandages au poignet, sangle à scratch, coussin des phalanges, doigts nus
 if(ax<.404){cc=vec3(.80,.76,.68)*(.9+.12*nH);gR=.9;}
 else if(ax<.426){cc=uGlove;float v=step(.411,ax)*(1.-step(.419,ax));cc=mix(cc,uGlove*1.8+.06,v*.8);gR=.5;}
 else if(ax<.458){cc=uGlove*(1.08+.1*nH);gR=.32;gH+=sin((ax-.426)/.032*3.1416)*2.2;}
 else {cc=sk*vec3(1.04,.97,.95);gR=.6;}}
else if(rr==2.)cc=sk;
else if(rr==3.){ // cuir chevelu : coupe selon uChev (0 rasé, 1 tondeuse, 3 crête, sinon court/épais)
 float st=nH,dn=hh(floor(P*1400.));vec3 hc=uHair*(.85+.2*st);
 float cov=uChev<.5?0.:uChev<1.5?.55*smoothstep(.2,.7,dn+.2):uChev>2.5&&uChev<3.5?mix(.38*dn,1.,1.-smoothstep(.011,.016,ax)):1.;
 if(uHairOn<.5)cov=0.;cc=mix(sk*vec3(.97,.94,.93),hc,cov);gH+=st*.5*cov;gR=mix(.4,.62,cov);}
else if(rr==4.)cc=sk*.92;
else if(rr==5.&&uTopOn>.5&&P.y<.832){cc=uTop*(.88+.18*nF);gR=.8;}
else if(rr==6.&&uLegOn>.5){cc=uLeg*(.88+.16*nF);gR=.8;}
else if(rr==8.)cc=mix(sk,uHair,uBarbe*.7);
#else
// de loin : mêmes couleurs, sans le détail (deuxième variante du shader : le chemin détaillé n'existe pas)
 if(rr==1.){cc=uShort*(.84+.26*nF);gR=.86;if(uArb<.5){float wb=step(.59,P.y);cc=mix(cc,uShort*.35,wb);cc=mix(cc,uAcc*.92,step(abs(ax-.1),.004)*(1.-wb)*step(P.y,.56)*step(abs(P.z),.018)*.85);}}
 else if(rr==2.){cc=uArb>.5?sk:ax<.404?vec3(.80,.76,.68):ax<.458?uGlove:sk;gR=uArb<.5&&ax>=.404&&ax<.458?.35:-1.;}
 else if(rr==3.)cc=(uHairOn>.5&&uChev>.5)?mix(sk,uHair,uChev<1.5?.55:1.):sk;
 else if(rr==4.)cc=sk*.92;
 else if(rr==5.&&uTopOn>.5&&P.y<.832)cc=uTop;
 else if(rr==6.&&uLegOn>.5)cc=uLeg;
 else if(rr==8.)cc=mix(sk,uHair,uBarbe*.7);
#endif
#ifdef CG_GROS
// visage (avant de la tête) : arcades, sourcils, nez, bouche, barbe en poils courts
if(rr==7.||rr==8.){float ff=smoothstep(.02,.04,P.z);
 float de=length(vec2((ax-.0175)/.012,(P.y-.927)/.0068));cc*=mix(1.,mix(.65,1.,smoothstep(.45,1.15,de)),ff);
 cc=mix(cc,cc*.55,ff*(1.-smoothstep(.12,.32,de))*.8);
 float yb=.9405-(ax-.017)*.12;float br=(1.-smoothstep(.0018,.0032,abs(P.y-yb)))*smoothstep(.004,.008,ax)*(1.-smoothstep(.029,.033,ax));cc=mix(cc,uHair*.8,br*ff*(uFem>.5?.7:.9));
 gH+=ff*(g1(P.x,.0055)*smoothstep(.905,.915,P.y)*(1.-smoothstep(.928,.938,P.y))*1.2+g1(P.y-yb-.002,.004)*g1(ax-.017,.014)*1.5-(1.-smoothstep(.2,1.,de))*1.5);
 cc*=mix(1.,.82,ff*g1(P.y-.9045,.002)*g1(P.x,.007));
 if(uBarbe>.01){float bz=smoothstep(.912,.9,P.y)*smoothstep(.0,.02,P.z)+(1.-smoothstep(.94,.97,P.y))*(1.-smoothstep(.042,.05,ax))*step(.012,P.z)*smoothstep(.9,.89,P.y);
  bz=clamp(bz,0.,1.);float pp=hh(floor(P*1100.));cc=mix(cc,uHair*(.7+.4*pp),bz*uBarbe*smoothstep(.15,.6,pp+uBarbe*.5));gH+=bz*uBarbe*pp*.8;}
 cc=mix(cc,cc*vec3(.78,.55,.52),ff*(1.-smoothstep(.0012,.0024,abs(P.y-.8925)))*(1.-smoothstep(.011,.014,ax)));
 cc=mix(cc,cc*vec3(1.06,.9,.88),ff*g1(ax-.03,.012)*g1(P.y-.912,.012)*.6);}
#endif
#ifdef CG_PROCHE
// musculature (torse, dos, bras) en relief, seulement là où la peau est nue
if((rr==0.||rr==5.)&&uTopOn<.5&&uFem<.5){float m=uMus;
 float abz=smoothstep(.605,.62,P.y)*(1.-smoothstep(.725,.74,P.y))*(1.-smoothstep(.044,.052,ax));
 gH-=fr*m*abz*(g1(P.x,.0035)*3.+(g1(P.y-.648,.0032)+g1(P.y-.678,.0032)+g1(P.y-.708,.0032))*2.2*step(.005,ax));
 gH+=fr*m*abz*(1.-g1(P.x,.006))*1.2;
 float yp=.744+3.5*(ax-.055)*(ax-.055);gH-=fr*m*g1(P.y-yp,.0055)*smoothstep(.006,.018,ax)*(1.-smoothstep(.1,.115,ax))*3.;
 gH+=fr*m*smoothstep(yp,yp+.02,P.y)*(1.-smoothstep(.8,.83,P.y))*(1.-smoothstep(.09,.11,ax))*1.6;
 gH-=fr*m*g1(P.x,.004)*smoothstep(.73,.745,P.y)*(1.-smoothstep(.795,.81,P.y))*2.;
 gH-=dos*m*g1(P.x,.007)*smoothstep(.59,.61,P.y)*(1.-smoothstep(.81,.83,P.y))*2.;
 gH+=dos*m*g1(ax-.05,.025)*g1(P.y-.765,.025)*1.4;
 float ni=length(vec2(ax-.062,P.y-.752));cc=mix(cc,cc*vec3(.72,.56,.55),fr*(1.-smoothstep(.0035,.006,ni)));
 cc=mix(cc,cc*.6,fr*(1.-smoothstep(.002,.0035,length(vec2(P.x,P.y-.628)))));}

#endif
if((rr==7.||rr==8.)&&uDmg>.02){float k=smoothstep(.55,.8,fract(n1*3.7)+uDmg*.22);cc=mix(cc,vec3(.5,.09,.08),k*min(.8,uDmg*1.1));cc=mix(cc,vec3(.35,.18,.32),smoothstep(.6,.9,nF)*uDmg*.5);}
if((rr==5.||rr==0.)&&uDmg>.4)cc=mix(cc,vec3(.75,.25,.22),(uDmg-.4)*.35*nF);
vec4 diffuseColor=vec4(diffuse*cc,opacity);`;
// trois variantes compilées : « gros plan » (+ visage), « proche » (muscles, relief, détails du short et des gants) et « loin » (couleurs seules) ;
// chaque personnage passe de l'une à l'autre selon sa distance à la caméra (proches()), les deux partagent les mêmes uniformes
function matPerso(u0,niv){const m=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.62,metalness:0});
 if(niv&&A.qual>=1&&!window.NODET)m.defines=niv>1?{CG_PROCHE:1,CG_GROS:1}:{CG_PROCHE:1};
 m.userData.u=u0||{uSkin:{value:new THREE.Color('#e3b08c')},uShort:{value:new THREE.Color('#c22')},uGlove:{value:new THREE.Color('#111')},uHair:{value:new THREE.Color('#222')},uHairOn:{value:1},uTop:{value:new THREE.Color('#111')},uTopOn:{value:0},uLeg:{value:new THREE.Color('#111')},uLegOn:{value:0},uDmg:{value:0},uSweat:{value:0},uBarbe:{value:0},uRim:{value:RIM},
  uAcc:{value:new THREE.Color('#eee')},uChev:{value:2},uArb:{value:0},uMus:{value:1},uFem:{value:0}};
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,m.userData.u);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float reg;attribute vec3 bp;attribute vec2 nzv;flat varying float vReg;varying vec3 vBP;varying vec2 vNz;').replace('#include <begin_vertex>','#include <begin_vertex>\nvReg=reg;vBP=bp;vNz=nzv;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\n'+GLSL_BRUIT+GLSL_PERSO)
   .replace('vec4 diffuseColor = vec4( diffuse, opacity );',GLSL_COULEUR)
   .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n#ifdef CG_PROCHE\nnormal=pnArb(-vViewPosition,normal,vec2(dFdx(gH),dFdy(gH))*.12,faceDirection);\n#endif')
   .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n{float fr=1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.);fr=fr*fr;fr*=fr;totalEmissiveRadiance+=uRim*fr*(floor(vReg+.5)==1.?.3:.45)*diffuseColor.rgb;}')
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nif(gR>=0.)roughnessFactor=gR;float rq=floor(vReg+.5);if(rq==0.||rq==5.&&uTopOn<.5||rq==7.||rq==6.&&uLegOn<.5||rq==8.)roughnessFactor=mix(.5,.22,uSweat);');};
 return m;}
const RIM=new THREE.Color('#ffd9a8');let TBLOB=null;function blob(){if(!TBLOB)TBLOB=cvTex(64,64,(g,w,h)=>{const r=g.createRadialGradient(32,32,2,32,32,31);r.addColorStop(0,'rgba(0,0,0,.55)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,64,64);});
 const m=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.1),new THREE.MeshBasicMaterial({map:TBLOB,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.012;m.renderOrder=1;return m;}
function perso(arbitre){const root=SkeletonUtils.clone(base.scene);const mat=matPerso(null,2);const matL=matPerso(mat.userData.u,0),matP=matPerso(mat.userData.u,1);const mats=[];
 root.traverse(o=>{if(o.isSkinnedMesh){o.material=mat;o.castShadow=true;o.frustumCulled=false;}});
 const B={};root.traverse(o=>{if(o.isBone){const n=o.name.replace(/^mixamorig:?/,'');if(!B[n])B[n]=o;}});
 const rest={};for(const n in B)rest[n]={q:B[n].quaternion.clone(),p:B[n].position.clone()};
 root.updateMatrixWorld(true);const hip=new THREE.Vector3();B.Hips.getWorldPosition(hip);rest.Hips.h=hip.y;
 const g=new THREE.Group();g.add(root);
 const h={root:g,m:root,B,rest,mat,mats3:[matL,matP,mat],niv:2,pose:null,pos:new THREE.Vector3(),yaw:0,tilt:0,act:null,t:0,etat:'debout',arb:!!arbitre};
 if(arbitre){const u=mat.userData.u;u.uArb.value=1;u.uChev.value=2;u.uSkin.value.set('#c99372');u.uShort.value.set('#15151a');u.uGlove.value.set('#c99372');u.uHair.value.set('#2a2a2a');u.uTop.value.set('#1b1c22');u.uTopOn.value=1;u.uLeg.value.set('#141418');u.uLegOn.value=1;g.scale.setScalar(.97);}
 return h;}
function habiller(h,f,coinRouge){const u=h.mat.userData.u,a=f.app||{};u.uSkin.value.set(PEAUX[a.peau??1]);u.uShort.value.set(a.short||(coinRouge?'#c1121f':'#1d4ed8'));u.uGlove.value.set(a.gant||'#111');
 u.uHair.value.set(CHEV[a.cc??0]);u.uHairOn.value=(a.chev??1)===0?0:1;u.uChev.value=a.chev??2;u.uFem.value=f.sexe==='F'?1:0;u.uMus.value=({lo:.75,ml:.9})[f.div]??1;
 const sc=new THREE.Color(a.short||(coinRouge?'#c1121f':'#1d4ed8'));u.uAcc.value.set(sc.r*.3+sc.g*.55+sc.b*.15>.5?'#141414':'#f1efe9');u.uBarbe.value=f.sexe==='F'?0:[0,.35,.55,.92,.3,.7][a.barbe||0];const t=(f.sexe==='F')?.93:1;h.root.scale.setScalar(t*(({pl:.97,le:.98,mm:1,mo:1.01,ml:1.03,lo:1.05,fp:.95,fc:.97})[f.div]||1));
 if(f.sexe==='F'){u.uTop.value.set(a.short||'#111');u.uTopOn.value=1;}else u.uTopOn.value=0;}

/* ---------- poses ---------- */
// directions dans le repère du personnage (il regarde +Z, sa gauche est +X)
function aimL(h,n,dLoc){const B=h.B,b=B[n],c=B[CHILD[n]];if(!b||!c)return;
 const dir=_w.copy(dLoc).applyQuaternion(h.root.quaternion).normalize();
 b.updateMatrixWorld(true);b.getWorldPosition(_v);const cw=new THREE.Vector3();c.getWorldPosition(cw);const cur=cw.sub(_v).normalize();
 _q.setFromUnitVectors(cur,dir);b.getWorldQuaternion(_q2);const nw=_q.multiply(_q2);b.parent.getWorldQuaternion(_q3);b.quaternion.copy(_q3.invert().multiply(nw));b.updateMatrixWorld(true);}
function rotL(h,n,x,y,z){const b=h.B[n];if(!b)return;const e=new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z,'YXZ'));
 const rq=h.root.quaternion;const ew=rq.clone().multiply(e).multiply(rq.clone().invert());
 b.getWorldQuaternion(_q2);b.parent.getWorldQuaternion(_q3);b.quaternion.copy(_q3.invert().multiply(ew.multiply(_q2)));b.updateMatrixWorld(true);}
function appliquer(h,P){const B=h.B,rest=h.rest;for(const n in rest){B[n].quaternion.copy(rest[n].q);B[n].position.copy(rest[n].p);}
 h.root.updateMatrixWorld(true);
 if(P.hips){const hp=B.Hips;const wp=new THREE.Vector3();hp.getWorldPosition(wp);const k=rest.Hips.h*h.root.scale.x;
  wp.add(new THREE.Vector3(P.hips[0]*k,P.hips[1]*k,P.hips[2]*k).applyQuaternion(h.root.quaternion));hp.parent.worldToLocal(wp);hp.position.copy(wp);hp.updateMatrixWorld(true);}if(P.hr)rotL(h,'Hips',...P.hr);
 const sp=P.sp||[0,0,0];['Spine','Spine1','Spine2'].forEach(n=>rotL(h,n,sp[0]/3,sp[1]/3,sp[2]/3));if(P.hd)rotL(h,'Head',...P.hd);
 for(const n of ['lu','ll','ru','rl','la','lf','ra','rf']){if(P[n])aimL(h,MAP[n],P[n]);}
 if(P.lft)aimL(h,'LeftFoot',P.lft);if(P.rft)aimL(h,'RightFoot',P.rft);}
const MAP={lu:'LeftUpLeg',ll:'LeftLeg',ru:'RightUpLeg',rl:'RightLeg',la:'LeftArm',lf:'LeftForeArm',ra:'RightArm',rf:'RightForeArm'};
function lerpP(a,b,t){const o={};for(const k of new Set([...Object.keys(a),...Object.keys(b)])){const x=a[k],y=b[k];if(x===undefined){o[k]=y;continue;}if(y===undefined){o[k]=x;continue;}
 if(x.isVector3)o[k]=x.clone().lerp(y,t).normalize();else if(Array.isArray(x))o[k]=x.map((v,i)=>v+(y[i]-v)*t);else o[k]=t<.5?x:y;}return o;}
const ease=t=>t<0?0:t>1?1:t*t*(3-2*t);
const FT=V(0,-.3,1);
// garde orthodoxe
function garde(b,o={}){const s=Math.sin(b),c=Math.cos(b*.5);
 return Object.assign({hips:[0,-.075+s*.008,0],hr:[0,.42,0],sp:[.2+s*.02,-.3,0],hd:[-.12,-.1,0],
  la:V(.42,-.5,.75),lf:V(-.25,.95,.55),ra:V(-.42,-.62,.55),rf:V(.38,.95,.42),
  lu:V(.2,-1,.38),ll:V(.12,-1,-.12),ru:V(-.2,-1,-.3),rl:V(-.14,-1,-.6),lft:V(.05,-.3,1),rft:V(-.25,-.3,1)},o);}
const POSES={
 garde:b=>garde(b),
 jab:()=>garde(0,{la:V(.08,.12,1),lf:V(.04,.12,1),sp:[.25,-.15,0],hr:[0,.5,0],hd:[-.12,-.2,0]}),
 cross:()=>garde(0,{ra:V(-.05,.12,1),rf:V(-.02,.1,1),hr:[0,-.25,0],sp:[.32,-.4,0],ru:V(-.15,-1,-.42),rft:V(-.1,-.8,.6)}),
 hookA:()=>garde(0,{la:V(.9,.1,.3),lf:V(.15,.12,1),hr:[0,.75,0],sp:[.22,.2,0]}),
 hook:()=>garde(0,{la:V(.35,.12,1),lf:V(-.95,.12,.25),hr:[0,-.2,0],sp:[.22,-.75,0]}),
 upperA:()=>garde(0,{ra:V(-.35,-.85,.3),rf:V(-.05,.2,1),hips:[0,-.13,0],sp:[.15,.1,0]}),
 upper:()=>garde(0,{ra:V(-.15,-.2,1),rf:V(.05,1,.25),hips:[0,-.04,0],sp:[.05,-.5,0],hd:[-.2,0,0]}),
 lowkickA:()=>garde(0,{ru:V(-.55,-.7,.4),rl:V(-.6,-.75,.1),hr:[0,-.2,0]}),
 lowkick:()=>garde(0,{ru:V(-.1,-.6,.85),rl:V(.35,-.75,.6),hr:[0,-.85,0],sp:[.05,.3,-.12],la:V(.6,-.3,.6),ra:V(-.7,-.6,-.1),rf:V(-.3,.2,.9)}),
 bodykick:()=>garde(0,{ru:V(-.05,-.05,1),rl:V(.4,-.05,.9),hr:[0,-1.1,0],sp:[-.1,.45,-.3],lu:V(.05,-1,.05),ll:V(.05,-1,.02),ra:V(-.8,-.5,-.3),rf:V(-.5,-.2,.8),rft:V(.2,0,1)}),
 headkick:()=>garde(0,{ru:V(-.05,.6,.8),rl:V(.35,.75,.55),hr:[0,-1.2,.1],sp:[-.3,.5,-.45],lu:V(.05,-1,0),ll:V(.05,-1,0),ra:V(-.8,-.6,-.4),rf:V(-.5,0,.8),hips:[0,-.02,0],rft:V(.2,.4,1)}),
 knee:()=>garde(0,{ru:V(-.1,.15,1),rl:V(-.1,-1,.25),la:V(.3,.3,1),lf:V(-.4,.4,.8),ra:V(-.3,.3,1),rf:V(.4,.4,.8),sp:[.35,0,0],hr:[0,0,0],lu:V(.05,-1,-.1),ll:V(.05,-1,-.1)}),
 spin:()=>garde(0,{hr:[0,2.4,0],sp:[.1,.6,0],ra:V(-1,.15,.1),rf:V(-1,.15,.1)}),
 coupTete:()=>garde(0,{hd:[-.65,.35,.15],sp:[-.15,-.5,.1],hips:[0,-.07,-.04]}),
 coupCorps:()=>garde(0,{sp:[.55,-.3,0],hd:[.1,0,0],la:V(.3,-.8,.5),lf:V(-.4,.6,.6),hips:[0,-.1,0]}),
 coupJambe:()=>garde(0,{lu:V(.25,-1,.2),ll:V(.25,-1,.05),hips:[0,-.09,0],sp:[.15,-.1,.15]}),
 esquive:()=>garde(0,{sp:[.35,-.3,-.45],hd:[-.1,-.3,-.25],hips:[-.05,-.11,0]}),
 bloque:()=>garde(0,{la:V(.25,-.2,.95),lf:V(-.25,1,.12),ra:V(-.25,-.2,.95),rf:V(.25,1,.12),hd:[.25,0,0],sp:[.3,-.2,0]}),
 shoot:()=>garde(0,{hips:[0,-.3,.1],sp:[.85,0,0],hd:[-.6,0,0],lu:V(.2,-.6,.8),ll:V(.1,-.9,-.1),ru:V(-.15,-.35,-.9),rl:V(-.1,-.95,-.2),la:V(.35,-.4,.9),lf:V(-.2,-.3,1),ra:V(-.35,-.4,.9),rf:V(.2,-.3,1)}),
 sprawl:()=>garde(0,{hips:[0,-.35,-.25],sp:[1.05,0,0],lu:V(.3,-.4,-.9),ll:V(.3,-.3,-1),ru:V(-.3,-.4,-.9),rl:V(-.3,-.3,-1),la:V(.4,-.6,.7),lf:V(-.3,-.5,.8),ra:V(-.4,-.6,.7),rf:V(.3,-.5,.8),hd:[-.4,0,0],hr:[0,0,0]}),
 clinch:()=>garde(0,{la:V(.2,.55,.85),lf:V(-.5,.3,.8),ra:V(-.2,.55,.85),rf:V(.5,.3,.8),sp:[.35,0,0],hr:[0,.1,0],hd:[.2,0,0],lu:V(.15,-1,.15),ll:V(.12,-1,-.1),ru:V(-.15,-1,-.15),rl:V(-.12,-1,-.3)}),
 // sol : le haut est à genoux, le bas sur le dos (rotation de la racine gérée à part)
 haut:()=>({hips:[0,-.5,0],sp:[.75,0,0],hd:[-.4,0,0],lu:V(.4,-.45,.8),ll:V(.25,-.25,-1),ru:V(-.4,-.45,.8),rl:V(-.25,-.25,-1),la:V(.3,-.85,.45),lf:V(.05,-.9,.4),ra:V(-.3,-.85,.45),rf:V(-.05,-.9,.4),lft:V(0,0,-1),rft:V(0,0,-1)}),
 hautFrappe:()=>({hips:[0,-.42,0],sp:[.5,-.5,0],hd:[-.4,0,0],lu:V(.4,-.45,.8),ll:V(.25,-.25,-1),ru:V(-.4,-.45,.8),rl:V(-.25,-.25,-1),la:V(.3,-.85,.45),lf:V(.05,-.9,.4),ra:V(-.25,.4,.2),rf:V(.1,-.95,.35),lft:V(0,0,-1),rft:V(0,0,-1)}),
 hautFrappe2:()=>({hips:[0,-.5,0],sp:[.95,.3,0],hd:[-.4,0,0],lu:V(.4,-.45,.8),ll:V(.25,-.25,-1),ru:V(-.4,-.45,.8),rl:V(-.25,-.25,-1),la:V(.3,-.85,.45),lf:V(.05,-.9,.4),ra:V(-.15,-.8,.6),rf:V(-.05,-.9,.5),lft:V(0,0,-1),rft:V(0,0,-1)}),
 hautSoum:()=>({hips:[0,-.55,0],sp:[1,0,0],hd:[-.2,0,0],lu:V(.5,-.4,.75),ll:V(.3,-.2,-1),ru:V(-.5,-.4,.75),rl:V(-.3,-.2,-1),la:V(.25,-.6,.75),lf:V(-.9,-.1,.3),ra:V(-.25,-.6,.75),rf:V(.9,-.1,.3)}),
 bas:()=>({hips:[0,0,0],sp:[-.15,0,0],hd:[.45,0,0],lu:V(.5,-.2,.85),ll:V(.25,-.95,.2),ru:V(-.5,-.2,.85),rl:V(-.25,-.95,.2),la:V(.5,.2,.85),lf:V(-.2,.6,.75),ra:V(-.5,.2,.85),rf:V(.2,.6,.75)}),
 basProtege:()=>({hips:[0,0,0],sp:[-.05,0,0],hd:[.55,0,0],lu:V(.5,-.2,.85),ll:V(.25,-.95,.2),ru:V(-.5,-.2,.85),rl:V(-.25,-.95,.2),la:V(.3,.6,.75),lf:V(-.3,.9,.2),ra:V(-.3,.6,.75),rf:V(.3,.9,.2)}),
 basKO:()=>({sp:[.05,0,.1],hd:[0,.6,0],lu:V(.15,-1,.05),ll:V(.18,-1,0),ru:V(-.2,-1,.25),rl:V(-.25,-1,-.1),la:V(1,.2,-.1),lf:V(1,.5,0),ra:V(-1,-.3,.05),rf:V(-.6,-.8,0)}),
 assis:()=>({hips:[0,-.6,0],sp:[.4,0,0],hd:[.2,0,0],lu:V(.25,0,1),ll:V(.2,-.8,.4),ru:V(-.25,0,1),rl:V(-.2,-.8,.4),la:V(.4,-.8,-.4),lf:V(.3,-.9,-.1),ra:V(-.4,-.8,-.4),rf:V(-.3,-.9,-.1)}),
 victoire:()=>({hips:[0,0,0],sp:[-.2,0,0],hd:[-.45,0,0],la:V(.5,1,.1),lf:V(.3,1,.05),ra:V(-.5,1,.1),rf:V(-.3,1,.05),lu:V(.15,-1,0),ll:V(.12,-1,0),ru:V(-.15,-1,0),rl:V(-.12,-1,0)}),
 attente:b=>({hips:[0,-.01,0],sp:[.04+Math.sin(b)*.02,0,0],hd:[-.05,0,0],la:V(.22,-1,.05),lf:V(.18,-1,.25),ra:V(-.22,-1,.05),rf:V(-.18,-1,.25),lu:V(.1,-1,0),ll:V(.1,-1,-.02),ru:V(-.1,-1,0),rl:V(-.1,-1,-.02)}),
 tabouret:b=>({hips:[0,-.42,-.02],sp:[-.08+Math.sin(b)*.03,0,0],hd:[.05,0,0],lu:V(.3,-.05,1),ll:V(.22,-1,.12),ru:V(-.3,-.05,1),rl:V(-.22,-1,.12),la:V(.75,-.55,-.1),lf:V(.6,-.7,.2),ra:V(-.75,-.55,-.1),rf:V(-.6,-.7,.2),lft:V(0,-.3,1),rft:V(0,-.3,1)}),
 soigneur:b=>({hips:[0,-.22,0],sp:[.55,0,0],hd:[-.4,0,0],lu:V(.25,-1,.45),ll:V(.2,-1,-.35),ru:V(-.25,-1,.15),rl:V(-.2,-1,-.6),la:V(.2,-.3,.95),lf:V(.1,.2+Math.sin(b*2)*.4,1),ra:V(-.3,-.8,.4),rf:V(-.2,-.6,.8)}),
 arbitre:b=>({hips:[0,-.04,0],sp:[.2,0,0],hd:[-.15,0,0],la:V(.3,-.9,.35),lf:V(.25,-.5,.85),ra:V(-.3,-.9,.35),rf:V(-.25,-.5,.85),lu:V(.15,-1,0),ll:V(.12,-1,-.05),ru:V(-.15,-1,0),rl:V(-.12,-1,-.05)}),
 stop:()=>({hips:[0,-.1,0],sp:[.5,0,0],la:V(.4,.1,.9),lf:V(.3,.1,1),ra:V(-.4,.1,.9),rf:V(-.3,.1,1),lu:V(.25,-1,.2),ll:V(.2,-1,-.1),ru:V(-.25,-1,-.2),rl:V(-.2,-1,-.3)})
};

/* ---------- logique d'animation ---------- */
// chaque personnage suit une file de « clés » : {d:durée, p:fonction pose, to:{pos,yaw,etat}}
function joue(h,seq){h.seq=seq.map(k=>Object.assign({},k));h.st=0;h.from=h.cur||POSES.garde(0);}
const rnd=(a,b)=>a+Math.random()*(b-a);
function majPerso(h,dt,T){
 let P;
 if(h.seq&&h.seq.length){const k=h.seq[0];if(h.st===0){h.from=h.cur||h.from;if(k.go)k.go();}h.st+=dt;const t=ease(h.st/k.d);const tgt=k.p(T);P=lerpP(h.from,tgt,k.lin?h.st/k.d:t);
  if(h.st>=k.d){h.cur=tgt;h.seq.shift();h.st=0;h.from=tgt;}}
 else{P=(h.idle||POSES.garde)(T*4+(h.ph||0));h.from=P;}
 h.cur=P;
 if(h.blob){h.blob.position.set(h.pos.x,.012,h.pos.z);h.blob.visible=h.root.visible;}
 // position et orientation
 h.pos.lerp(h.tpos||h.pos,1-Math.pow(.004,dt));h.root.position.copy(h.pos);
 let dy=(h.tyaw??h.yaw)-h.yaw;while(dy>Math.PI)dy-=Math.PI*2;while(dy<-Math.PI)dy+=Math.PI*2;h.yaw+=dy*(1-Math.pow(.003,dt));
 h.tilt+=((h.ttilt||0)-h.tilt)*(1-Math.pow(.0015,dt));
 h.root.quaternion.setFromEuler(new THREE.Euler(h.tilt,h.yaw,0,'YXZ'));
 h.root.position.y=(h.ty||0);
 appliquer(h,P);}
function cible(h,x,z,yaw,o={}){h.tpos=new THREE.Vector3(x,0,z);if(yaw!==undefined)h.tyaw=yaw;if(o.tilt!==undefined)h.ttilt=o.tilt;if(o.y!==undefined)h.ty=o.y;}
// placement de base selon la position du combat
const ST={ang:0,dist:1.45,c:new THREE.Vector3(),pos:'S',top:-1,cage:0,fin:false};
function placer(force){const F=A.f;const a=ST.ang;const cx=ST.c.x,cz=ST.c.z;
 if(ST.pos==='S'||ST.pos==='C'){const d=ST.pos==='C'?.62:ST.dist;
  const x0=cx+Math.cos(a)*d/2,z0=cz+Math.sin(a)*d/2,x1=cx-Math.cos(a)*d/2,z1=cz-Math.sin(a)*d/2;
  cible(F[0],x0,z0,Math.atan2(x1-x0,z1-z0),{tilt:0,y:0});cible(F[1],x1,z1,Math.atan2(x0-x1,z0-z1),{tilt:0,y:0});
  F.forEach(h=>{h.idle=ST.pos==='C'?POSES.clinch:POSES.garde;});}
 else{const T=F[ST.top],B=F[1-ST.top];const yaw=a;
  // le bas est allongé sur le dos, la tête vers l'extérieur ; le haut à genoux entre ses jambes
  const bx=cx-Math.sin(yaw)*.1,bz=cz-Math.cos(yaw)*.1;
  cible(B,bx,bz,yaw+Math.PI,{tilt:-Math.PI/2+.12,y:.17});B.idle=POSES.bas;
  cible(T,cx+Math.sin(yaw)*.62,cz+Math.cos(yaw)*.62,yaw+Math.PI,{tilt:0,y:0});T.idle=POSES.haut;}
 if(force)F.forEach(h=>{h.pos.copy(h.tpos);h.yaw=h.tyaw;h.tilt=h.ttilt||0;});}
function arbitreSuit(dt){const h=A.arb;if(!h)return;const F=A.f;const m=F[0].pos.clone().add(F[1].pos).multiplyScalar(.5);
 const perp=new THREE.Vector3(-(F[1].pos.z-F[0].pos.z),0,F[1].pos.x-F[0].pos.x).normalize();if(perp.lengthSq()<.01)perp.set(1,0,0);
 const away=m.clone().sub(C?C.position:new THREE.Vector3(5,0,5));away.y=0;away.normalize().applyAxisAngle(new THREE.Vector3(0,1,0),.6);let tgt=m.clone().add(away.multiplyScalar(ST.pos==='G'?2:2.5));if(tgt.length()>3.9)tgt.setLength(3.9);
 if(!h.seq||!h.seq.length){if(h.lockT>0)h.lockT-=dt;else cible(h,tgt.x,tgt.z,Math.atan2(m.x-tgt.x,m.z-tgt.z),{tilt:0,y:0});}
 h.idle=POSES.arbitre;}
/* ---------- traduction des événements du moteur en animations ---------- */
function action(e,replay){const F=A.f;if(!replay&&['ko','gnpko','subw'].includes(e.k)){A.snap=instantane();A.lastE=e;}const a=e.a??0,d=1-a;const H=F[a],D=F[d];let dur=1.1;
 const sp=A.vitesse;
 const vers=(h,k)=>{};
 const posAvant=ST.pos;
 const nouvPos=e.pos?e.pos[0]:'S';const top=e.pos&&e.pos[0]==='G'?+e.pos[1]:-1;
 const frappe=(cle,arm,rec,touche,zone)=>{joue(H,[{d:.16,p:POSES[cle+'A']||POSES.garde},{d:.14,p:POSES[cle]},{d:.3,p:POSES.garde}]);
  if(touche){const rp=zone==='corps'?POSES.coupCorps:zone==='jambe'?POSES.coupJambe:POSES.coupTete;setTimeout(()=>{choc(D,zone);joue(D,[{d:.09,p:rp},{d:.45,p:POSES.garde}]);},Math.round(280/sp));}
  else{joue(D,[{d:.18,p:Math.random()<.5?POSES.esquive:POSES.bloque},{d:.4,p:POSES.garde}]);setTimeout(()=>{try{Son.souffle();}catch(e){}},Math.round(220/sp));}};
 switch(e.k){
  case 'round':try{Son.cloche(1);}catch(e){}coins(false);ST.pos='S';ST.c.set(0,0,0);ST.dist=1.6;ST.ang=Math.random()*Math.PI*2;F.forEach(h=>h.seq=[]);placer(true);cam('large');dur=1.2;break;
  case 'feint':ST.ang+=rnd(-.7,.7);ST.dist=rnd(1.35,1.75);ST.c.x+=rnd(-.4,.4);ST.c.z+=rnd(-.4,.4);ST.c.clampLength(0,2.2);dur=.9;break;
  case 'jab':case 'cross':case 'hook':case 'upper':case 'combo':case 'body':case 'spin':{const cle={combo:'cross',body:'hook'}[e.k]||e.k;ST.dist=1.15;placer();
   if(e.k==='combo'){joue(H,[{d:.12,p:POSES.jab},{d:.12,p:POSES.garde},{d:.13,p:POSES.cross},{d:.12,p:POSES.hookA},{d:.13,p:POSES.hook},{d:.3,p:POSES.garde}]);
    if(e.h)[260,520,760].forEach((ms,i)=>setTimeout(()=>{choc(D,'tete');joue(D,[{d:.08,p:POSES.coupTete},{d:.25,p:POSES.garde}]);},ms/sp));else joue(D,[{d:.2,p:POSES.bloque},{d:.5,p:POSES.bloque},{d:.3,p:POSES.garde}]);dur=1.3;}
   else{frappe(cle,0,0,e.h,e.z);dur=.95;}setTimeout(()=>{ST.dist=1.5;placer();},500/sp);break;}
  case 'lowkick':case 'bodykick':case 'headkick':{ST.dist=1.2;placer();joue(H,[{d:.16,p:POSES.lowkickA},{d:.18,p:POSES[e.k]},{d:.36,p:POSES.garde}]);
   if(e.h)setTimeout(()=>{choc(D,e.z);joue(D,[{d:.09,p:e.z==='jambe'?POSES.coupJambe:e.z==='corps'?POSES.coupCorps:POSES.coupTete},{d:.5,p:POSES.garde}]);},320/sp);else joue(D,[{d:.2,p:POSES.esquive},{d:.4,p:POSES.garde}]);
   setTimeout(()=>{ST.dist=1.55;placer();},600/sp);dur=1.1;break;}
  case 'counter':{const att=F[a],def=F[d];ST.dist=1.15;placer();joue(def,[{d:.14,p:POSES.jab},{d:.25,p:POSES.garde}]);joue(att,[{d:.18,p:POSES.esquive},{d:.12,p:POSES.cross},{d:.3,p:POSES.garde}]);
   setTimeout(()=>{choc(def,'tete');joue(def,[{d:.09,p:POSES.coupTete},{d:.5,p:POSES.garde}]);},330/sp);dur=1.1;setTimeout(()=>{ST.dist=1.5;placer();},600/sp);break;}
  case 'kd':{ if(posAvant==='G'){ST.pos='S';placer();}
   const v=e.k==='kd'&&e.a!==undefined?e.a:a;const Hh=F[v],Dd=F[1-v];ST.dist=1.15;placer();joue(Hh,[{d:.13,p:POSES.cross},{d:.3,p:POSES.garde}]);
   setTimeout(()=>{choc(Dd,'tete',2);flashs(1);cam('serre');joue(Dd,[{d:.1,p:POSES.coupTete},{d:.5,p:POSES.assis}]);Dd.ttilt=-.5;Dd.ty=0;},250/sp);
   setTimeout(()=>{if(nouvPos==='G'){ST.pos='G';ST.top=top;placer();F[1-top].idle=POSES.basProtege;}else{Dd.ttilt=0;joue(Dd,[{d:.5,p:POSES.garde}]);ST.pos='S';ST.dist=1.8;placer();}},1700/sp);dur=2.3;break;}
  case 'ko':case 'gnpko':{const v=a;const Hh=F[v],Dd=F[1-v];ST.fin=true;
   if(e.k==='gnpko'||posAvant==='G'){joue(Hh,[{d:.12,p:POSES.hautFrappe},{d:.12,p:POSES.hautFrappe2},{d:.12,p:POSES.hautFrappe},{d:.12,p:POSES.hautFrappe2}]);setTimeout(()=>{choc(Dd,'tete',2);joue(Dd,[{d:.4,p:POSES.basKO}]);},300/sp);}
   else{ST.dist=1.15;placer();const pp=/kick/.test(e.t)||Math.random()<.2?'headkick':'cross';joue(Hh,[{d:.14,p:pp==='headkick'?POSES.lowkickA:POSES.garde},{d:.16,p:POSES[pp]},{d:.4,p:POSES.garde}]);
    setTimeout(()=>{choc(Dd,'tete',3);flashs(1);cam('serre');Dd.ttilt=-Math.PI/2+.08;Dd.ty=.14;joue(Dd,[{d:.12,p:POSES.coupTete},{d:.6,p:POSES.basKO}]);Dd.idle=POSES.basKO;setTimeout(()=>{try{Son.chute();}catch(e){}},300/sp);},330/sp);}
   arbitreStop(1-v,700);setTimeout(()=>celebrer(v),1900/sp);dur=3.4;break;}
  case 'td':{setTimeout(()=>{try{Son.chute();Son.clameur(.4);}catch(e){}},480/sp);ST.dist=1.1;placer();joue(H,[{d:.22,p:POSES.shoot},{d:.25,p:POSES.shoot}]);joue(D,[{d:.25,p:POSES.garde},{d:.2,p:POSES.esquive}]);
   setTimeout(()=>{ST.pos='G';ST.top=top>=0?top:a;ST.ang=Math.atan2(D.pos.x-H.pos.x,D.pos.z-H.pos.z);ST.c.copy(D.pos);ST.c.clampLength(0,2.6);placer();choc(D,'corps',1.5);},480/sp);dur=1.6;cam('sol');break;}
  case 'tdf':{ST.dist=1.1;placer();joue(H,[{d:.22,p:POSES.shoot},{d:.4,p:POSES.shoot},{d:.4,p:POSES.garde}]);joue(D,[{d:.2,p:POSES.garde},{d:.25,p:POSES.sprawl},{d:.4,p:POSES.sprawl},{d:.4,p:POSES.garde}]);
   if(nouvPos==='G'){setTimeout(()=>{ST.pos='G';ST.top=top;placer();},900/sp);}else setTimeout(()=>{ST.dist=1.6;placer();},1000/sp);dur=1.5;break;}
  case 'clinch':ST.pos='C';placer();cam('moyen');dur=1;break;
  case 'cknee':{ST.pos='C';placer();joue(H,[{d:.18,p:POSES.knee},{d:.25,p:POSES.clinch}]);if(e.h)setTimeout(()=>{choc(D,'corps');joue(D,[{d:.1,p:POSES.coupCorps},{d:.35,p:POSES.clinch}]);},200/sp);dur=.9;break;}
  case 'sep':ST.pos='S';ST.dist=1.8;placer();dur=.8;break;
  case 'gnp':{if(ST.pos!=='G'){ST.pos='G';ST.top=a;placer();}joue(H,[{d:.14,p:POSES.hautFrappe},{d:.12,p:POSES.hautFrappe2},{d:.3,p:POSES.haut}]);
   joue(D,[{d:.12,p:POSES.basProtege},{d:.4,p:POSES.basProtege},{d:.3,p:POSES.bas}]);if(e.h)setTimeout(()=>choc(D,'tete'),260/sp);dur=1;cam('sol');break;}
  case 'ctrl':{if(ST.pos!=='G'){ST.pos='G';ST.top=a;}ST.ang+=rnd(-.25,.25);placer();dur=1;break;}
  case 'esc':{ST.pos='S';ST.dist=1.9;F.forEach(h=>{h.ttilt=0;h.ty=0;});placer();joue(D,[{d:.4,p:POSES.garde}]);dur=1.1;cam('large');break;}
  case 'sweep':{ST.top=e.a;ST.ang+=Math.PI;placer();dur=1.2;break;}
  case 'suba':case 'subw':{if(ST.pos!=='G'){ST.pos='G';ST.top=a;placer();}const T=F[ST.top],B=F[1-ST.top];
   joue(T,[{d:.4,p:POSES.hautSoum},{d:.9,p:POSES.hautSoum}]);joue(B,[{d:.3,p:POSES.basProtege},{d:.5,p:POSES.bas},{d:.4,p:POSES.basProtege}]);cam('serre');
   if(e.k==='subw'){ST.fin=true;arbitreStop(1-a,1500);setTimeout(()=>{tap(B);},700/sp);setTimeout(()=>celebrer(a),2300/sp);dur=3.6;}
   else{setTimeout(()=>{if(nouvPos==='S'){ST.pos='S';ST.dist=1.8;F.forEach(h=>{h.ttilt=0;h.ty=0;});placer();}},1300/sp);dur=1.8;}break;}
  case 'fin':{try{Son.cloche(3);Son.clameur(.5);}catch(e){}F.forEach((h,i)=>{h.seq=[];h.ttilt=0;h.ty=0;});ST.pos='S';ST.c.set(0,0,0);ST.ang=0;placer();
   const R1=4.2;cible(F[0],Math.cos(Math.PI/8*5)*R1*.8,Math.sin(Math.PI/8*5)*R1*.8,0);cible(F[1],-Math.cos(Math.PI/8*5)*R1*.8,-Math.sin(Math.PI/8*5)*R1*.8,Math.PI);F.forEach(h=>h.idle=POSES.attente);cam('large');dur=1.4;
   setTimeout(()=>coins(true),900/sp);break;}
  case 'res':{if(!ST.fin){F.forEach(h=>{h.seq=[];h.ttilt=0;h.ty=0;});ST.pos='S';ST.c.set(0,0,0);ST.dist=1.5;placer();F.forEach(h=>h.idle=POSES.attente);
    cible(A.arb,0,0,Math.atan2(0,1));A.arb.lockT=99;setTimeout(()=>{if(e.res.w>=0)celebrer(e.res.w,true);},900/sp);}dur=2.2;cam('moyen');break;}
 }
 return dur/sp;}
function instantane(){return {f:A.f.map(h=>({pos:h.pos.clone(),tpos:(h.tpos||h.pos).clone(),yaw:h.yaw,tyaw:h.tyaw,tilt:h.tilt,ttilt:h.ttilt||0,ty:h.ty||0,idle:h.idle,cur:h.cur})),a:{pos:A.arb.pos.clone(),tpos:(A.arb.tpos||A.arb.pos).clone(),yaw:A.arb.yaw,tyaw:A.arb.tyaw},st:{ang:ST.ang,dist:ST.dist,c:ST.c.clone(),pos:ST.pos,top:ST.top}};}
function restaurer(S0){A.f.forEach((h,i)=>{const x=S0.f[i];h.seq=[];h.pos.copy(x.pos);h.tpos=x.tpos.clone();h.yaw=x.yaw;h.tyaw=x.tyaw;h.tilt=x.tilt;h.ttilt=x.ttilt;h.ty=x.ty;h.idle=x.idle;h.cur=x.cur;h.from=x.cur;});
 const a=A.arb;a.seq=[];a.pos.copy(S0.a.pos);a.tpos=S0.a.tpos.clone();a.yaw=S0.a.yaw;a.tyaw=S0.a.tyaw;a.lockT=0;Object.assign(ST,{ang:S0.st.ang,dist:S0.st.dist,pos:S0.st.pos,top:S0.st.top,fin:false});ST.c.copy(S0.st.c);}
A.replay=function(){if(!A.snap)return 0;restaurer(A.snap);A.vitesse=.32;CAM.ang+=1.4;CAM.mode='serre';CAM.repl=1;const d=action(A.lastE,true);return d;};
A.finReplay=function(){A.vitesse=1;CAM.repl=0;};
A.degats=function(i,hd,sta){const u=A.f[i]&&A.f[i].mat.userData.u;if(!u)return;u.uDmg.value=Math.min(1,hd*1.1);u.uSweat.value=Math.min(1,.15+(100-sta)/90);};
A.intro=function(i){CAM.mode=i==null?'large':'portrait'+i;const k=A.key;if(!k)return;if(i==null){k.position.set(0,9.5,0);k.target.position.set(0,0,0);k.angle=Math.PI/5;k.intensity=260;}else{const p=A.f[i].pos;k.position.set(p.x*.5,8,p.z*.5);k.target.position.copy(p);k.angle=Math.PI/11;k.intensity=330;}k.target.updateMatrixWorld();};
function coins(on){if(!A.coins)return;A.coins.forEach((k,i)=>{k.g.visible=on;k.c.root.visible=on;if(!on)return;const h=A.f[i];const a=Math.PI/8*5+(i?Math.PI:0),R1=4.2*.86;
  const x=Math.cos(a)*R1,z=Math.sin(a)*R1;k.g.position.set(x,0,z);const yaw=Math.atan2(-x,-z);k.g.rotation.y=yaw;cible(h,x,z,yaw,{tilt:0,y:0});h.pos.set(x,0,z);h.yaw=yaw;h.idle=POSES.tabouret;h.seq=[];
  const cx=x*.6,cz=z*.6;k.c.pos.set(cx,0,cz);k.c.tpos=k.c.pos.clone();k.c.yaw=Math.atan2(x-cx,z-cz);k.c.tyaw=k.c.yaw;k.c.idle=POSES.soigneur;});
 if(on)cam('coin0');}
function choc(h,zone,k=1){try{Son.coup(k*(zone==='jambe'?.8:1)*(.85+Math.random()*.3),zone==='corps');if(k>=2)Son.clameur(k>=3?1:.7);}catch(e){}const p=new THREE.Vector3();(h.B[zone==='jambe'?'LeftLeg':zone==='corps'?'Spine1':'Head']||h.B.Head).getWorldPosition(p);
 for(let i=0;i<(k>1?14:7);i++){const s=etincelles.find(x=>x.life<=0);if(!s)break;s.life=.35+Math.random()*.25;s.p.copy(p);s.v.set(rnd(-1,1),rnd(-.2,1.4),rnd(-1,1)).multiplyScalar(1.2+k*.6);s.c.set(k>1?'#ffd0a0':'#fff2e0');}
 if(k>=2)A.shake=.18*k;}
const etincelles=[];const FOULE={t:{value:0},e:{value:0}};A.FOULE=FOULE;
// étincelles d'impact : un seul nuage de points (un appel de dessin)
let ETP=null;function initEtinc(){const n=40,g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3).fill(-99),3));g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(n*3),3));
 const tsp=cvTex(32,32,(c,w,h)=>{const r=c.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.35,'rgba(255,240,220,.8)');r.addColorStop(1,'rgba(255,200,150,0)');c.fillStyle=r;c.fillRect(0,0,w,h);});
 ETP=new THREE.Points(g,new THREE.PointsMaterial({size:.1,map:tsp,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));ETP.frustumCulled=false;S.add(ETP);
 for(let i=0;i<n;i++)etincelles.push({i,life:0,p:new THREE.Vector3(),v:new THREE.Vector3(),c:new THREE.Color()});}
function tap(h){const seq=[];for(let i=0;i<4;i++){seq.push({d:.1,p:()=>Object.assign(POSES.bas(),{ra:V(-.8,-.5,.2),rf:V(-.9,-.4,0)})},{d:.1,p:POSES.bas});}joue(h,seq);}
function arbitreStop(vers,ms){setTimeout(()=>{const h=A.arb,D=A.f[vers];const p=D.pos.clone();cible(h,p.x+.5,p.z+.5,Math.atan2(-.5,-.5),{tilt:0,y:0});h.lockT=6;joue(h,[{d:.35,p:POSES.stop},{d:1.5,p:POSES.stop}]);},ms/A.vitesse);}
function celebrer(v,decision){const h=A.f[v],L=A.f[1-v];h.ttilt=0;h.ty=0;h.seq=[];h.idle=POSES.victoire;
 const p=decision?new THREE.Vector3(-.5,0,.4):h.pos.clone().multiplyScalar(.6);cible(h,p.x,p.z,Math.PI*0+Math.atan2(-p.x,-p.z)+Math.PI);flashs(2);
 if(decision){cible(L,.6,-.2,-.6);L.idle=POSES.attente;const a=A.arb;cible(a,0,.15,0);a.lockT=99;a.seq=[];setTimeout(()=>{joue(a,[{d:.4,p:()=>Object.assign(POSES.arbitre(0),v===0?{ra:V(-.3,1,0),rf:V(-.2,1,0)}:{la:V(.3,1,0),lf:V(.2,1,0)})},{d:3,p:()=>Object.assign(POSES.arbitre(0),v===0?{ra:V(-.3,1,0),rf:V(-.2,1,0)}:{la:V(.3,1,0),lf:V(.2,1,0)})}]);},300);}}
function flashs(k){A.flashK=(A.flashK||0)+k;FOULE.e.value=Math.min(1,FOULE.e.value+.5*k);}
/* ---------- caméra ---------- */
const CAM={mode:'large',ang:.6,h:3.2,r:7.2,look:new THREE.Vector3(0,1,0),cur:new THREE.Vector3(6,3,6)};
function cam(m){CAM.mode=m;CAM.t=0;}
function majCam(dt){const F=A.f;const m=F[0].pos.clone().add(F[1].pos).multiplyScalar(.5);const port=innerHeight>innerWidth*1.1;
 // caméra de retransmission : de profil par rapport à l'axe des deux combattants, au-dessus du grillage
 const ax=Math.atan2(F[1].pos.z-F[0].pos.z,F[1].pos.x-F[0].pos.x);CAM.sw=(CAM.sw||0)+dt*.12;
 let want=ax+Math.PI/2+Math.sin(CAM.sw)*.55;const alt=want+Math.PI;
 const d1=Math.abs(Math.atan2(Math.sin(want-CAM.ang),Math.cos(want-CAM.ang))),d2=Math.abs(Math.atan2(Math.sin(alt-CAM.ang),Math.cos(alt-CAM.ang)));if(d2<d1)want=alt;
 if(!CAM.repl){let da=Math.atan2(Math.sin(want-CAM.ang),Math.cos(want-CAM.ang));CAM.ang+=da*(1-Math.pow(.25,dt));}else CAM.ang+=dt*.25;
 if(CAM.mode&&CAM.mode.startsWith('coin')){const h=F[+CAM.mode.slice(4)];const fw=new THREE.Vector3(Math.sin(h.yaw),0,Math.cos(h.yaw));const sd=new THREE.Vector3(fw.z,0,-fw.x);const p=h.pos.clone().addScaledVector(fw,3.3).addScaledVector(sd,1.7);p.y=2.1;
  CAM.cur.lerp(p,1-Math.pow(.05,dt));C.position.copy(CAM.cur);CAM.look.lerp(h.pos.clone().addScaledVector(fw,.4).setY(.85),1-Math.pow(.03,dt));C.lookAt(CAM.look);return;}
 if(CAM.mode&&CAM.mode.startsWith('portrait')){const h=F[+CAM.mode.slice(8)];const fw=new THREE.Vector3(Math.sin(h.yaw),0,Math.cos(h.yaw));const p=h.pos.clone().addScaledVector(fw,1.55);p.y=1.5;
  const sd=new THREE.Vector3(fw.z,0,-fw.x).multiplyScalar(.35);p.add(sd);CAM.cur.lerp(p,1-Math.pow(.02,dt));C.position.copy(CAM.cur);CAM.look.lerp(h.pos.clone().setY(1.35),1-Math.pow(.01,dt));C.lookAt(CAM.look);return;}
 const cfg={large:[6.4,3.7,.95],moyen:[4.7,2.9,.95],serre:[3.4,2.1,.85],sol:[4.1,3.3,.35]}[CAM.mode]||[6,3.5,1];
 let r=cfg[0]*(port?1.22:1),hh=cfg[1]*(port?1.1:1);
 const tgt=new THREE.Vector3(m.x+Math.cos(CAM.ang)*r,hh,m.z+Math.sin(CAM.ang)*r);
 CAM.cur.lerp(tgt,1-Math.pow(.12,dt));C.position.copy(CAM.cur);
 CAM.look.lerp(new THREE.Vector3(m.x,cfg[2],m.z),1-Math.pow(.02,dt));
 if(A.shake>0){C.position.x+=rnd(-1,1)*A.shake*.15;C.position.y+=rnd(-1,1)*A.shake*.15;A.shake-=dt;}
 C.lookAt(CAM.look);}
/* ---------- boucle ---------- */
let T=0,raf=0;
function boucle(){raf=requestAnimationFrame(boucle);if(!A.actif)return;const dt=Math.min(.05,clock.getDelta())*A.vitesse;T+=dt;
 FOULE.t.value=T;if(A.ledTex)A.ledTex.offset.x=(T*.015)%1;FOULE.e.value=Math.max(0,FOULE.e.value-dt*.35);
 A.f.forEach(h=>majPerso(h,dt,T));arbitreSuit(dt);majPerso(A.arb,dt,T);
 if(ETP){const P=ETP.geometry.attributes.position,Cc=ETP.geometry.attributes.color;let ch=false;for(const s of etincelles){if(s.life>0){s.life-=dt;s.p.addScaledVector(s.v,dt);s.v.y-=6*dt;const k=Math.max(0,Math.min(1,s.life*2.5));P.setXYZ(s.i,s.p.x,s.p.y,s.p.z);Cc.setXYZ(s.i,s.c.r*k,s.c.g*k,s.c.b*k);if(s.life<=0)P.setXYZ(s.i,0,-99,0);ch=true;}}if(ch){P.needsUpdate=true;Cc.needsUpdate=true;}}
 // flashs de la foule
 // flashs : nombre par seconde (≈3/s au calme, ≈45/s après un gros coup) et extinction en ~0,12 s, indépendants des img/s
 if(A.flash){const c=A.flash.geometry.attributes.color;const ps=(A.flashK>0?45:3)*dt/c.count,dec=Math.exp(-dt*25);for(let i=0;i<c.count;i++){const v=c.getX(i);const n=Math.random()<ps?.75+Math.random()*.25:v*dec;c.setXYZ(i,n,n,n*.97);}c.needsUpdate=true;if(A.flashK>0)A.flashK-=dt*1.5;}
 if(A.coins&&A.coins[0].c.root.visible)A.coins.forEach(k=>majPerso(k.c,dt,T));
 majCam(dt);proches();R.render(S,C);adapte();}
// niveau de détail des personnages selon leur distance à la caméra : visage < 2,9 m, muscles et matières < 4,3 m (invisibles de loin, coûteux en pixels)
const _pp=new THREE.Vector3(),_PL=[];function proches(){const L=_PL;L.length=0;L.push(A.f[0],A.f[1],A.arb);if(A.coins&&A.coins[0].c.root.visible)A.coins.forEach(k=>L.push(k.c));for(const h of L){if(!h)continue;_pp.copy(h.pos);_pp.y+=1.1;const d=C.position.distanceTo(_pp),m0=h.niv;
  // marge de 0,2 m pour ne pas clignoter autour des seuils
  const nv=d<(m0===2?3.1:2.8)?2:d<(m0>=1?4.5:4.1)?1:0;if(nv!==h.niv){h.niv=nv;const m=h.mats3[nv];h.m.traverse(o=>{if(o.isSkinnedMesh)o.material=m;});}}}
// résolution adaptative : si l'arène descend sous 40 img/s, on rend moins de pixels (mémorisé d'une partie à l'autre)
let AD={n:0,t:0,bas:0,haut:0};
function adapte(){if(A.qual===2||A.fige)return;const t=performance.now();AD.n++;if(!AD.t){AD.t=t;return;}if(t-AD.t<2000)return;const fps=AD.n*1000/(t-AD.t);AD.n=0;AD.t=t;A.fps=fps;if(document.hidden)return;
 if(fps<40){AD.bas++;AD.haut=0;}else if(fps>57){AD.haut++;AD.bas=0;}else{AD.bas=0;AD.haut=0;}
 if(AD.bas>=1&&A.rs>.55){A.rs=Math.max(.55,A.rs-.15);R.setPixelRatio(Math.max(.5,A.dprBase*A.rs));taille();AD.bas=0;try{localStorage.setItem('cg-rs',A.rs);}catch(e){}}
 else if(AD.haut>=3&&A.rs<1){A.rs=Math.min(1,A.rs+.1);R.setPixelRatio(Math.max(.5,A.dprBase*A.rs));taille();AD.haut=0;try{localStorage.setItem('cg-rs',A.rs);}catch(e){}}}
function taille(){if(!R)return;const w=canvas.clientWidth||innerWidth,h=canvas.clientHeight||innerHeight;R.setSize(w,h,false);C.aspect=w/h;C.fov=w<h?62:44;C.updateProjectionMatrix();}
/* ---------- API ---------- */
A.init=async function(cv,b64,qual){canvas=cv;A.qual=qual??1;
 R=new THREE.WebGLRenderer({canvas:cv,antialias:A.qual>=1,powerPreference:'high-performance'});try{A.rs=Math.min(1,Math.max(.55,+localStorage.getItem('cg-rs')||1));}catch(e){}A.dprBase=A.qual>=2?Math.min(devicePixelRatio,1.5):A.qual===1?Math.min(devicePixelRatio,1):.75;R.setPixelRatio(Math.max(A.qual===2?.5:.5,A.dprBase*(A.qual===2?1:A.rs)));R.outputColorSpace=THREE.SRGBColorSpace;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.05;
 R.shadowMap.enabled=A.qual>=2;R.shadowMap.type=THREE.PCFShadowMap;
 C=new THREE.PerspectiveCamera(44,1,.1,120);
 const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)).buffer;const L=new GLTFLoader();L.setMeshoptDecoder(MeshoptDecoder);
 base=await new Promise((res,rej)=>L.parse(bin,'',res,rej));regions(base.scene);
 base.scene.traverse(o=>{if(o.isSkinnedMesh)o.geometry.userData.keep=1;});
 addEventListener('resize',taille);A.ok=true;boucle();};
A.preparer=function(O,F){construire(O);etincelles.length=0;initEtinc();habiller(A.f[0],F[0],true);habiller(A.f[1],F[1],false);
 ST.pos='S';ST.c.set(0,0,0);ST.ang=0;ST.dist=4;ST.fin=false;A.f.forEach(h=>{h.seq=[];h.cur=null;h.ttilt=0;h.tilt=0;h.ty=0;h.ph=Math.random()*6;});
 const R1=3.4;cible(A.f[0],Math.cos(2.4)*R1,Math.sin(2.4)*R1,0);cible(A.f[1],-Math.cos(2.4)*R1,-Math.sin(2.4)*R1,Math.PI);A.f.forEach(h=>{h.pos.copy(h.tpos);h.yaw=Math.atan2(-h.pos.x,-h.pos.z);h.tyaw=h.yaw;h.idle=POSES.attente;});
 A.arb.pos.set(0,0,3);A.arb.tpos=A.arb.pos.clone();A.arb.yaw=Math.PI;A.arb.lockT=0;CAM.mode='large';CAM.cur.set(6,3.5,6);taille();
 // précompilation des shaders (évite un gel au premier coup sur Mac/ANGLE)
 try{const cv=[];S.traverse(o=>{if(!o.visible){cv.push(o);o.visible=true;}});R.compile(S,C);
  // variante « loin » des personnages aussi
  const hs=[...A.f,A.arb,...(A.coins||[]).map(k=>k.c)];if(A.qual>=1)for(const k of [0,1]){hs.forEach(h=>h.m.traverse(o=>{if(o.isSkinnedMesh)o.material=h.mats3[k];}));R.compile(S,C);R.render(S,C);}hs.forEach(h=>{h.m.traverse(o=>{if(o.isSkinnedMesh)o.material=h.mat;});h.niv=2;});
  cv.forEach(o=>o.visible=false);}catch(e){}};
A.action=action;A.demarrer=()=>{A.actif=true;clock.getDelta();taille();};A.arreter=()=>{A.actif=false;};A.taille=taille;A.cam=cam;
A.capture=()=>{R.render(S,C);return R.domElement.toDataURL('image/jpeg',.7);};
A.infos=()=>R?{calls:R.info.render.calls,tri:R.info.render.triangles,qual:A.qual,rs:A.rs,px:R.getPixelRatio(),fps:A.fps}:{};
A.fixer=px=>{A.fige=true;R.setPixelRatio(px);taille();};A.POSES=POSES;Object.defineProperty(A,"qualite",{get:()=>A.qual});A.ST=ST;A.placer=placer;A.CAM=CAM;A.perso=()=>A.f;A.coinsVue=coins;
window.Arene=A;
