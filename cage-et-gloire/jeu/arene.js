// ===== Cage & Gloire · arène 3D (Three.js r160) : octogone, cage, foule, lumières, combattants animés par poses =====
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

const A={ok:false,actif:false,vitesse:1,qual:1};
let R,S,C,canvas,base=null,clock=new THREE.Clock();
const PEAUX=['#f2cdb0','#e3b08c','#c98d66','#a86d48','#7b4b2e','#4f2f1c'];
const CHEV=['#1a1410','#2b1d14','#4a3020','#7a5630','#b8935a','#d9c39a'];
const V=(x,y,z)=>new THREE.Vector3(x,y,z).normalize();
const _q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_q3=new THREE.Quaternion(),_v=new THREE.Vector3(),_w=new THREE.Vector3();
const CHILD={LeftArm:'LeftForeArm',LeftForeArm:'LeftHand',RightArm:'RightForeArm',RightForeArm:'RightHand',LeftUpLeg:'LeftLeg',LeftLeg:'LeftFoot',RightUpLeg:'RightLeg',RightLeg:'RightFoot',LeftFoot:'LeftToeBase',RightFoot:'RightToeBase',Spine2:'Neck',Neck:'Head'};

/* ---------- textures dessinées ---------- */
function cvTex(w,h,f){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');f(g,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function texSol(O){return cvTex(1024,1024,(g,w,h)=>{
 const cx=w/2,cy=h/2;const gr=g.createRadialGradient(cx,cy,60,cx,cy,520);gr.addColorStop(0,'#f2f2ee');gr.addColorStop(1,'#d9d9d2');g.fillStyle=gr;g.fillRect(0,0,w,h);
 // grain de toile
 g.globalAlpha=.05;for(let i=0;i<9000;i++){g.fillStyle=Math.random()<.5?'#000':'#fff';g.fillRect(Math.random()*w,Math.random()*h,2,2);}g.globalAlpha=1;
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
 // inscriptions de sponsors (fictifs)
 const sp=['CAGE & GLOIRE','IRON FUEL','NORDIK TAPE','VOLTA','KARBON GEAR','ATLAS GYM','RHINO WRAPS','PULSE'];
 g.font='44px "Bebas Neue",Impact,sans-serif';g.textAlign='center';
 for(let i=0;i<8;i++){const a=i*Math.PI/4;g.save();g.translate(cx+Math.cos(a)*310,cy+Math.sin(a)*310);g.rotate(a+Math.PI/2);g.fillStyle='rgba(20,20,26,.28)';g.fillText(sp[i],0,0);g.restore();}
 // sol extérieur sombre
 g.globalCompositeOperation='destination-over';g.fillStyle='#16161b';g.fillRect(0,0,w,h);});}
function texGrillage(){const t=cvTex(128,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='#fff';g.lineWidth=7;g.lineCap='round';
 g.beginPath();g.moveTo(0,h/2);g.lineTo(w/2,0);g.lineTo(w,h/2);g.lineTo(w/2,h);g.closePath();g.stroke();});t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.NoColorSpace;return t;}
function texEcran(O,txt){return cvTex(1024,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,O.c2);gr.addColorStop(.5,'#050507');gr.addColorStop(1,O.c2);g.fillStyle=gr;g.fillRect(0,0,w,h);
 g.fillStyle=O.c1;g.font='150px "Bebas Neue",Impact,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(txt||O.court,w/2,h/2+8);
 g.globalAlpha=.25;for(let y=0;y<h;y+=4){g.fillStyle='#000';g.fillRect(0,y,w,2);}});}
function texFoule(){return cvTex(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);for(let i=0;i<4;i++)for(let j=0;j<4;j++){const x=i*64+32,y=j*64+38;
 const sk=['#e6b896','#c48b62','#8a5a3a','#5a3a24'][Math.floor(Math.random()*4)];const cl=['#202634','#5b1e22','#2b3d2a','#bbb','#1b3a6b','#3b2a4a','#704010','#0d0d0d'][Math.floor(Math.random()*8)];
 g.fillStyle=cl;g.beginPath();g.ellipse(x,y+22,22,18,0,0,7);g.fill();g.fillStyle=sk;g.beginPath();g.arc(x,y-6,12,0,7);g.fill();}});}

/* ---------- scène ---------- */
function construire(O){
 if(S){S.traverse(o=>{if(o.geometry&&!o.userData.keep)o.geometry.dispose();});}
 S=new THREE.Scene();S.background=new THREE.Color('#06060a');S.fog=new THREE.FogExp2('#07070b',.034);
 const tSol=texSol(O);
 // sol de l'octogone
 const RO=4.7;const sol=new THREE.Mesh(new THREE.CircleGeometry(RO*1.08,8,Math.PI/8),new THREE.MeshStandardMaterial({map:tSol,roughness:.85,metalness:0}));
 sol.geometry.attributes.uv.array.forEach((v,i,a)=>{});
 // UV : projection plane
 {const p=sol.geometry.attributes.position,uv=sol.geometry.attributes.uv;for(let i=0;i<p.count;i++){uv.setXY(i,.5+p.getX(i)/(RO*2.16)*1.0,.5+p.getY(i)/(RO*2.16));}}
 sol.rotation.x=-Math.PI/2;sol.receiveShadow=true;S.add(sol);
 // plateforme
 const plat=new THREE.Mesh(new THREE.CylinderGeometry(RO*1.16,RO*1.2,.75,8,1,false,Math.PI/8),new THREE.MeshStandardMaterial({color:'#121216',roughness:.6,metalness:.3}));plat.position.y=-.38;S.add(plat);
 const bord=new THREE.Mesh(new THREE.CylinderGeometry(RO*1.165,RO*1.165,.08,8,1,true,Math.PI/8),new THREE.MeshStandardMaterial({color:O.c1,emissive:O.c1,emissiveIntensity:.6}));bord.position.y=-.03;S.add(bord);
 // poteaux, rembourrages, grillage
 const R1=RO*1.03;const pts=[];for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;pts.push(new THREE.Vector3(Math.cos(a)*R1,0,Math.sin(a)*R1));}
 const mPost=new THREE.MeshStandardMaterial({color:'#18181d',roughness:.45,metalness:.2});const mPad=new THREE.MeshStandardMaterial({color:O.c1,roughness:.5});
 const tG=texGrillage();const mG=new THREE.MeshStandardMaterial({color:'#2a2a30',metalness:.7,roughness:.4,alphaMap:tG,transparent:true,alphaTest:.35,side:THREE.DoubleSide,depthWrite:false});
 const H=1.95;
 for(let i=0;i<8;i++){const p=pts[i],q=pts[(i+1)%8];
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,H+.15,10),mPost);post.position.set(p.x,H/2,p.z);post.castShadow=false;S.add(post);
  const pad=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,1.3,12),mPad);pad.position.set(p.x,.95,p.z);S.add(pad);
  const L=p.distanceTo(q),m=p.clone().add(q).multiplyScalar(.5),ang=Math.atan2(q.x-p.x,q.z-p.z);
  const pan=new THREE.Mesh(new THREE.PlaneGeometry(L,H-.25),mG);pan.position.set(m.x,(H-.25)/2+.22,m.z);pan.rotation.y=ang+Math.PI/2;tG.repeat.set(L*7,(H-.25)*7);S.add(pan);
  const rail=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,L,8),new THREE.MeshStandardMaterial({color:'#111',roughness:.4}));rail.position.set(m.x,H,m.z);rail.rotation.z=Math.PI/2;rail.rotation.y=ang+Math.PI/2;S.add(rail);
  const bas=new THREE.Mesh(new THREE.BoxGeometry(L,.22,.14),new THREE.MeshStandardMaterial({color:'#0d0d10',roughness:.6}));bas.position.set(m.x,.11,m.z);bas.rotation.y=ang+Math.PI/2;S.add(bas);}
 // gradins et foule
 const tF=texFoule();
 for(let rg=0;rg<9;rg++){const rr=RO*1.75+rg*1.05,hh=.2+rg*.62;const n=Math.round(rr*7.5);
  const marche=new THREE.Mesh(new THREE.CylinderGeometry(rr+.55,rr+.55,.25,48,1,true),new THREE.MeshStandardMaterial({color:'#0b0b0e',roughness:.9,side:THREE.BackSide}));marche.position.y=hh-.2;S.add(marche);
  const geo=new THREE.PlaneGeometry(.95,.95);const mat=new THREE.MeshLambertMaterial({map:tF,transparent:true,alphaTest:.5});
  mat.onBeforeCompile=sh=>{sh.uniforms.uT=FOULE.t;sh.uniforms.uE=FOULE.e;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT,uE;').replace('#include <begin_vertex>','#include <begin_vertex>\nfloat ph=float(gl_InstanceID)*1.731;transformed.y+=(sin(uT*(2.+fract(ph)*2.)+ph)*.03+max(0.,sin(uT*7.+ph*3.))*uE*.22);');};
  const im=new THREE.InstancedMesh(geo,mat,n);const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(1,1,1);
  for(let k=0;k<n;k++){const a=k/n*Math.PI*2+rg*.13;const x=Math.cos(a)*rr,z=Math.sin(a)*rr;q.setFromAxisAngle(new THREE.Vector3(0,1,0),-a-Math.PI/2);m4.compose(new THREE.Vector3(x,hh+.3,z),q,sc);im.setMatrixAt(k,m4);
   const c=new THREE.Color().setHSL(Math.random(),.15,.35+Math.random()*.35);im.setColorAt(k,c);}
  im.userData.rg=rg;S.add(im);A.foule=A.foule||[];}
 // flashs d'appareils photo
 const nf=160,fg=new THREE.BufferGeometry(),fp=new Float32Array(nf*3);for(let k=0;k<nf;k++){const a=Math.random()*Math.PI*2,rg=Math.random()*9;fp[k*3]=Math.cos(a)*(RO*1.75+rg*1.05);fp[k*3+1]=.6+rg*.62;fp[k*3+2]=Math.sin(a)*(RO*1.75+rg*1.05);}
 fg.setAttribute('position',new THREE.BufferAttribute(fp,3));const fc=new Float32Array(nf*3);fg.setAttribute('color',new THREE.BufferAttribute(fc,3));
 A.flash=new THREE.Points(fg,new THREE.PointsMaterial({size:.35,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));S.add(A.flash);
 // portique d'éclairage + écran géant
 const rig=new THREE.Group();rig.position.y=7.4;S.add(rig);
 const mT=new THREE.MeshStandardMaterial({color:'#222',metalness:.8,roughness:.35});
 for(let i=0;i<8;i++){const a=i*Math.PI/4,b=(i+1)*Math.PI/4,r=4.2;const p=new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r),q=new THREE.Vector3(Math.cos(b)*r,0,Math.sin(b)*r);
  const L=p.distanceTo(q),m=p.clone().add(q).multiplyScalar(.5);const tr=new THREE.Mesh(new THREE.BoxGeometry(L,.25,.25),mT);tr.position.copy(m);tr.rotation.y=-Math.atan2(q.z-p.z,q.x-p.x);rig.add(tr);
  for(let k=0;k<3;k++){const lp=p.clone().lerp(q,(k+1)/4);const lamp=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,.3,10),new THREE.MeshBasicMaterial({color:'#fffbe8'}));lamp.position.copy(lp);lamp.position.y=-.2;rig.add(lamp);}}
 const ecrTex=texEcran(O);A.ecrTex=ecrTex;const box=new THREE.Mesh(new THREE.BoxGeometry(3.6,.9,3.6),[0,1,2,3,4,5].map(i=>i===2||i===3?new THREE.MeshStandardMaterial({color:'#111'}):new THREE.MeshBasicMaterial({map:ecrTex})));box.position.y=2.1;rig.add(box);
 // cônes de lumière (atmosphère)
 const coneM=new THREE.MeshBasicMaterial({color:'#fff6dc',transparent:true,opacity:.022,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const cone=new THREE.Mesh(new THREE.ConeGeometry(2.4,7.2,24,1,true),coneM);cone.position.set(Math.cos(a)*1.9,3.6,Math.sin(a)*1.9);cone.rotation.z=Math.cos(a)*.1;cone.rotation.x=-Math.sin(a)*.1;S.add(cone);}
 // lumières
 S.add(new THREE.HemisphereLight('#c9d4ff','#20140c',.55));
 const key=new THREE.SpotLight('#fff4e0',A.qual>0?260:200,22,Math.PI/5,.45,1.6);key.position.set(0,9.5,0);key.target.position.set(0,0,0);
 A.key=key;A.spot=new THREE.SpotLight('#ffe7c2',0,9,Math.PI/9,.5,1.2);A.spot.position.set(0,7,0);S.add(A.spot,A.spot.target);
 if(A.qual>0){key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0004;key.shadow.camera.near=4;key.shadow.camera.far=14;}S.add(key,key.target);
 const fill=new THREE.DirectionalLight('#ffe8d0',.9);fill.position.set(4,6,5);S.add(fill);
 const c1=new THREE.Color(O.c1);[[6,2.2,0],[-6,2.2,0],[0,2.2,6],[0,2.2,-6]].forEach(p=>{const l=new THREE.PointLight(c1,9,11,1.6);l.position.set(...p);S.add(l);});
 const rimB=new THREE.DirectionalLight('#8fb0ff',.7);rimB.position.set(-5,4,-6);S.add(rimB);
 // combattants et arbitre
 A.f=[0,1].map(i=>{const h=perso();S.add(h.root);return h;});
 A.arb=perso(true);S.add(A.arb.root);
 // coins : tabourets et soigneurs (visibles entre les rounds)
 A.coins=[0,1].map(i=>{const g=new THREE.Group();const tab=new THREE.Mesh(new THREE.CylinderGeometry(.22,.26,.48,16),new THREE.MeshStandardMaterial({color:'#1a1a1f',roughness:.5}));tab.position.y=.24;g.add(tab);
  const c=perso(true);const u=c.mat.userData.u;u.uTop.value.set(i?'#1d3f9e':'#9e1d26');u.uLeg.value.set('#202024');u.uSkin.value.set(['#e3b08c','#a86d48'][i]);u.uGlove.value.set(['#e3b08c','#a86d48'][i]);u.uHairOn.value=1;
  S.add(g,c.root);g.visible=false;c.root.visible=false;return {g,c};});
 A.O=O;}

/* ---------- personnages (Xbot recoloré par régions : peau, short, gants, cheveux) ---------- */
function regions(src){src.updateMatrixWorld(true);const BB=new THREE.Box3(),_p=new THREE.Vector3();const WP=new Map();src.traverse(o=>{if(o.isSkinnedMesh){const p=o.geometry.attributes.position,a=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){_p.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);a[i*3]=_p.x;a[i*3+1]=_p.y;a[i*3+2]=_p.z;BB.expandByPoint(_p);}WP.set(o,a);}});
 src.traverse(o=>{if(!o.isSkinnedMesh||o.geometry.userData.reg)return;const g=o.geometry;const p=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,nm=g.attributes.normal;
 const bones=o.skeleton.bones.map(b=>b.name.replace(/^mixamorig:?/,''));const bb=BB;const hgt=bb.max.y-bb.min.y;
 const JNT=/Joint/i.test(o.name+' '+(o.material&&o.material.name||''));const reg=new Float32Array(p.count);let hz0=1e9,hz1=-1e9;const hi=[];
 for(let i=0;i<p.count;i++){let bw=0,bi=0;for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(w>bw){bw=w;bi=si.getComponent(i,k);}}const n=bones[bi]||'';const W3=WP.get(o);const yn=(W3[i*3+1]-bb.min.y)/hgt;
  if(JNT&&yn>.55&&yn<.71&&!/Hand|Arm/.test(n))reg[i]=1;else if(/Hand/.test(n))reg[i]=2;else if((n==='Hips'||/UpLeg/.test(n)||n==='Spine')&&yn>.405&&yn<(n==='Spine'||n==='Hips'?.675:.625))reg[i]=1;else if(n==='Head'||n==='HeadTop_End'){hi.push(i);const z=WP.get(o)[i*3+2];if(z<hz0)hz0=z;if(z>hz1)hz1=z;}
  else if(/Foot|Toe/.test(n))reg[i]=4;
  else if((/Spine|Shoulder/.test(n)||n==='LeftArm'||n==='RightArm')&&yn>=.6&&yn<.84)reg[i]=5;
  else if(/UpLeg|^LeftLeg|^RightLeg/.test(n))reg[i]=6;}
 const W4=WP.get(o);for(const i of hi){const yn=(W4[i*3+1]-bb.min.y)/hgt,zn=(W4[i*3+2]-hz0)/(hz1-hz0||1);if(yn>.965||(yn>.915&&zn<.45)||(yn>.94&&zn<.62))reg[i]=3;else reg[i]=7;}
 g.setAttribute('reg',new THREE.BufferAttribute(reg,1));g.userData.reg=1;});}
function matPerso(src){const m=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.62,metalness:0});
 m.userData.u={uSkin:{value:new THREE.Color('#e3b08c')},uShort:{value:new THREE.Color('#c22')},uGlove:{value:new THREE.Color('#111')},uHair:{value:new THREE.Color('#222')},uHairOn:{value:1},uTop:{value:new THREE.Color('#111')},uTopOn:{value:0},uLeg:{value:new THREE.Color('#111')},uLegOn:{value:0},uDmg:{value:0},uSweat:{value:0}};
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,m.userData.u);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float reg;varying float vReg;varying vec3 vPosL;').replace('#include <begin_vertex>','#include <begin_vertex>\nvReg=reg;vPosL=position;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uSkin,uShort,uGlove,uHair,uTop,uLeg;uniform float uHairOn,uTopOn,uLegOn,uDmg,uSweat;varying float vReg;varying vec3 vPosL;\nfloat hh(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}\nfloat nz(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hh(i),hh(i+vec3(1,0,0)),f.x),mix(hh(i+vec3(0,1,0)),hh(i+vec3(1,1,0)),f.x),f.y),mix(mix(hh(i+vec3(0,0,1)),hh(i+vec3(1,0,1)),f.x),mix(hh(i+vec3(0,1,1)),hh(i+vec3(1,1,1)),f.x),f.y),f.z);}')
   .replace('vec4 diffuseColor = vec4( diffuse, opacity );','vec3 cc=uSkin;float rr=floor(vReg+.5);if(rr==1.)cc=uShort;else if(rr==2.)cc=uGlove;else if(rr==3.&&uHairOn>.5)cc=uHair;else if(rr==4.)cc=uSkin*.92;else if(rr==5.&&uTopOn>.5)cc=uTop;else if(rr==6.&&uLegOn>.5)cc=uLeg;if(rr==7.&&uDmg>.02){float k=smoothstep(.55,.8,nz(vPosL*11./max(.01,length(vPosL)/1.6))+uDmg*.22);cc=mix(cc,vec3(.5,.09,.08),k*min(.8,uDmg*1.1));cc=mix(cc,vec3(.35,.18,.32),smoothstep(.6,.9,nz(vPosL*14.))*uDmg*.5);}if((rr==5.||rr==0.)&&uDmg>.4)cc=mix(cc,vec3(.75,.25,.22),(uDmg-.4)*.35*nz(vPosL*6.));vec4 diffuseColor=vec4(diffuse*cc,opacity);')
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nif(floor(vReg+.5)==2.)roughnessFactor=.35;float rq=floor(vReg+.5);if(rq==0.||rq==5.||rq==7.||rq==6.)roughnessFactor=mix(.55,.22,uSweat);');};
 return m;}
function perso(arbitre){const root=SkeletonUtils.clone(base.scene);const mat=matPerso();const mats=[];
 root.traverse(o=>{if(o.isSkinnedMesh){o.material=mat;o.castShadow=true;o.frustumCulled=false;}});
 const B={};root.traverse(o=>{if(o.isBone){const n=o.name.replace(/^mixamorig:?/,'');if(!B[n])B[n]=o;}});
 const rest={};for(const n in B)rest[n]={q:B[n].quaternion.clone(),p:B[n].position.clone()};
 root.updateMatrixWorld(true);const hip=new THREE.Vector3();B.Hips.getWorldPosition(hip);rest.Hips.h=hip.y;
 const g=new THREE.Group();g.add(root);
 const h={root:g,m:root,B,rest,mat,pose:null,pos:new THREE.Vector3(),yaw:0,tilt:0,act:null,t:0,etat:'debout',arb:!!arbitre};
 if(arbitre){const u=mat.userData.u;u.uSkin.value.set('#c99372');u.uShort.value.set('#15151a');u.uGlove.value.set('#c99372');u.uHair.value.set('#2a2a2a');u.uTop.value.set('#1b1c22');u.uTopOn.value=1;u.uLeg.value.set('#141418');u.uLegOn.value=1;g.scale.setScalar(.97);}
 return h;}
function habiller(h,f,coinRouge){const u=h.mat.userData.u,a=f.app||{};u.uSkin.value.set(PEAUX[a.peau??1]);u.uShort.value.set(a.short||(coinRouge?'#c1121f':'#1d4ed8'));u.uGlove.value.set(a.gant||'#111');
 u.uHair.value.set(CHEV[a.cc??0]);u.uHairOn.value=(a.chev??1)===0?0:1;const t=(f.sexe==='F')?.93:1;h.root.scale.setScalar(t*(({pl:.97,le:.98,mm:1,mo:1.01,ml:1.03,lo:1.05,fp:.95,fc:.97})[f.div]||1));
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
A.intro=function(i){CAM.mode=i==null?'large':'portrait'+i;if(!A.key)return;if(i==null){A.key.intensity=A.qual>0?260:200;A.spot.intensity=0;}else{A.key.intensity=60;const p=A.f[i].pos;A.spot.position.set(p.x*.6,7,p.z*.6);A.spot.target.position.copy(p);A.spot.intensity=240;}};
function coins(on){if(!A.coins)return;A.coins.forEach((k,i)=>{k.g.visible=on;k.c.root.visible=on;if(!on)return;const h=A.f[i];const a=Math.PI/8*5+(i?Math.PI:0),R1=4.2*.86;
  const x=Math.cos(a)*R1,z=Math.sin(a)*R1;k.g.position.set(x,0,z);const yaw=Math.atan2(-x,-z);cible(h,x,z,yaw,{tilt:0,y:0});h.pos.set(x,0,z);h.yaw=yaw;h.idle=POSES.tabouret;h.seq=[];
  const cx=x*.6,cz=z*.6;k.c.pos.set(cx,0,cz);k.c.tpos=k.c.pos.clone();k.c.yaw=Math.atan2(x-cx,z-cz);k.c.tyaw=k.c.yaw;k.c.idle=POSES.soigneur;});
 if(on)cam('coin0');}
function choc(h,zone,k=1){try{Son.coup(k*(zone==='jambe'?.8:1)*(.85+Math.random()*.3),zone==='corps');if(k>=2)Son.clameur(k>=3?1:.7);}catch(e){}const p=new THREE.Vector3();(h.B[zone==='jambe'?'LeftLeg':zone==='corps'?'Spine1':'Head']||h.B.Head).getWorldPosition(p);
 for(let i=0;i<(k>1?14:7);i++){const s=etincelles.find(x=>x.life<=0);if(!s)break;s.life=.35+Math.random()*.25;s.m.position.copy(p);s.v.set(rnd(-1,1),rnd(-.2,1.4),rnd(-1,1)).multiplyScalar(1.2+k*.6);s.m.visible=true;s.m.material.color.set(k>1?'#ffd0a0':'#fff2e0');}
 if(k>=2)A.shake=.18*k;}
const etincelles=[];const FOULE={t:{value:0},e:{value:0}};A.FOULE=FOULE;
function initEtinc(){for(let i=0;i<40;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.025,5,4),new THREE.MeshBasicMaterial({color:'#fff',transparent:true,blending:THREE.AdditiveBlending}));m.visible=false;S.add(m);etincelles.push({m,life:0,v:new THREE.Vector3()});}}
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
 FOULE.t.value=T;FOULE.e.value=Math.max(0,FOULE.e.value-dt*.35);
 A.f.forEach(h=>majPerso(h,dt,T));arbitreSuit(dt);majPerso(A.arb,dt,T);
 for(const s of etincelles){if(s.life>0){s.life-=dt;s.m.position.addScaledVector(s.v,dt);s.v.y-=6*dt;s.m.material.opacity=Math.max(0,s.life*2.5);if(s.life<=0)s.m.visible=false;}}
 // flashs de la foule
 if(A.flash){const c=A.flash.geometry.attributes.color;const base=A.flashK>0?.06:.012;for(let i=0;i<c.count;i++){const v=c.getX(i);const n=Math.random()<base?1:v*.78;c.setXYZ(i,n,n,n*.95);}c.needsUpdate=true;if(A.flashK>0)A.flashK-=dt*1.5;}
 if(A.coins&&A.coins[0].c.root.visible)A.coins.forEach(k=>majPerso(k.c,dt,T));
 majCam(dt);R.render(S,C);}
function taille(){if(!R)return;const w=canvas.clientWidth||innerWidth,h=canvas.clientHeight||innerHeight;R.setSize(w,h,false);C.aspect=w/h;C.fov=w<h?62:44;C.updateProjectionMatrix();}
/* ---------- API ---------- */
A.init=async function(cv,b64,qual){canvas=cv;A.qual=qual??1;
 R=new THREE.WebGLRenderer({canvas:cv,antialias:A.qual>0,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,A.qual>0?1.6:1));R.outputColorSpace=THREE.SRGBColorSpace;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.05;
 R.shadowMap.enabled=A.qual>0;R.shadowMap.type=THREE.PCFSoftShadowMap;
 C=new THREE.PerspectiveCamera(44,1,.1,120);
 const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)).buffer;const L=new GLTFLoader();L.setMeshoptDecoder(MeshoptDecoder);
 base=await new Promise((res,rej)=>L.parse(bin,'',res,rej));regions(base.scene);
 base.scene.traverse(o=>{if(o.isSkinnedMesh)o.geometry.userData.keep=1;});
 addEventListener('resize',taille);A.ok=true;boucle();};
A.preparer=function(O,F){construire(O);etincelles.length=0;initEtinc();habiller(A.f[0],F[0],true);habiller(A.f[1],F[1],false);
 ST.pos='S';ST.c.set(0,0,0);ST.ang=0;ST.dist=4;ST.fin=false;A.f.forEach(h=>{h.seq=[];h.cur=null;h.ttilt=0;h.tilt=0;h.ty=0;h.ph=Math.random()*6;});
 const R1=3.4;cible(A.f[0],Math.cos(2.4)*R1,Math.sin(2.4)*R1,0);cible(A.f[1],-Math.cos(2.4)*R1,-Math.sin(2.4)*R1,Math.PI);A.f.forEach(h=>{h.pos.copy(h.tpos);h.yaw=Math.atan2(-h.pos.x,-h.pos.z);h.tyaw=h.yaw;h.idle=POSES.attente;});
 A.arb.pos.set(0,0,3);A.arb.tpos=A.arb.pos.clone();A.arb.yaw=Math.PI;A.arb.lockT=0;CAM.mode='large';CAM.cur.set(6,3.5,6);taille();};
A.action=action;A.demarrer=()=>{A.actif=true;clock.getDelta();taille();};A.arreter=()=>{A.actif=false;};A.taille=taille;A.cam=cam;
A.capture=()=>{R.render(S,C);return R.domElement.toDataURL('image/jpeg',.7);};
A.infos=()=>R?{calls:R.info.render.calls,tri:R.info.render.triangles}:{};
A.POSES=POSES;A.ST=ST;A.placer=placer;A.CAM=CAM;A.perso=()=>A.f;
window.Arene=A;
