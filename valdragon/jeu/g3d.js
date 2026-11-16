// ===== Valdragon 3D · moteur de rendu =====
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {mat,makeHero,makeMonster,makeMerchant,animate} from './models.js';
import {elTex,GRADE,gradePass,groundFog,lightRay,blob,smokeSys,smoke,smokeClear,updSmoke,lavaDecal} from './vfx.js';
import {grime,aoTexture,CUT} from './grime.js';
import {K,ready as kitReady,makeChar,animateG,pieceGeo,piece,playG,tintObj} from './kit.js';
/* ---------- fabrique de personnages : modèles importés si disponibles ---------- */
const RC=[0,0,0x7f9cff,0xffd84a,0xff9a3a];
// éclaircit les textures sombres des modèles réalistes (auto-illumination légère par la texture)
function mxLift(R,k=.13){R.mats.forEach(m=>{if(m.map&&!m.emissiveMap){m.emissiveMap=m.map;m.emissive=new THREE.Color(k,k*.94,k*.88);m.emissiveIntensity=1;m.userData.e0=m.emissive.clone();m.userData.ei0=1;m.needsUpdate=true;}});}
function heroM(cls,eq={}){if(!K.ok)return makeHero(cls,eq);let R;const gl=(eq.wr||0)>=2?RC[Math.min(4,eq.wr)]:null;
 const HX={guerrier:'hx_aldric',mage:'hx_ysolde',rodeuse:'hx_maelle'}[cls];
 if(K.g[HX]){const o={s:.98,set:'mx',kind:'hero',glow:gl,gsat:.92,gdk:1.35,gamt:.08};
  if(cls==='guerrier')Object.assign(o,{recol:{h:.75,to:.0,w:.12,s:1.1},gdk:1.75});
  if(cls==='mage')Object.assign(o,{wR:['staff'],wx:{staff:{p:[0,.38,.02],r:[0,0,0],s:.75}},recol:{h:.11,to:.74,w:.16,s:.6},gdk:.86,gsat:.8});
  
  R=makeChar(HX,o);R.mx=1;mxLift(R,{guerrier:.2,mage:.08,rodeuse:.15}[cls]);R.cls=cls;R.chargeCol=0xffd27a;R.root.add(blob(.42,.62));R.root.add(blob(.2,.55));return R;}
 if(!K.g.knight)return makeHero(cls,eq);
 if(cls==='guerrier'){const at=eq.at||0;R=makeChar('knight',{s:.56,kind:'hero',wR:['sword'],wL:[['sh0','sh0','sh1','sh2','sh3','sh3'][at]],glow:gl});}
 else if(cls==='mage')R=makeChar('mage',{s:.56,kind:'hero',wR:['staff'],wL:(eq.ar||0)>=2?['book']:[],glow:gl});
 else R=makeChar('rogue',{s:.56,kind:'hero',wL:['bow'],glow:gl});
 R.cls=cls;R.chargeCol=0xffd27a;R.root.add(blob(.42,.62));R.root.add(blob(.2,.55));return R;}
const ELH={fire:0,ice:3.2,poison:1.7,arcane:-1.85},ELC={fire:0xff8a2a,ice:0x9fe0ff,poison:0x9cff5a,arcane:0xd77aff};
// lueur des yeux pour les créatures (petite lumière + halo au niveau de la tête)
// halo additif à la place d'une vraie lumière : le nombre de lumières reste fixe (pas de recompilation des shaders)
function haloS(col,sc,op){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:col,blending:THREE.AdditiveBlending,depthWrite:false,opacity:op}));sp.scale.setScalar(sc);return sp;}
function eyeGlow(R,col,i=.9){let hb=null;R.model.traverse(b=>{if(!hb&&b.isBone&&/head$/i.test(b.name)&&!/top/i.test(b.name))hb=b;});if(!hb)return;const l=haloS(col,.16,.35*i);l.position.set(0,.07,.12);hb.add(l);
 [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.012,8,6),new THREE.MeshBasicMaterial({color:col}));e.position.set(s*.032,.07,.1);hb.add(e);});}
function monM(k,o={}){if(!K.ok||(k==='go'&&!K.g.hx_brute)){const R=makeMonster(k,o);if(K.ok)R.root.add(blob(k==='go'?.7:.6,.55));return R;}let R;const tier=EX.tier||0;
 switch(k){
  case'sp':R=makeChar('spider',{s:.0029,set:'none',proc:'spider',rotY:-Math.PI/2,hue:tier===3?3.4:tier===1?.25:0,gsat:.4,gdk:.55,gamt:.5,gsc:40,ghc:.4,gmet:.25});R.mats.forEach(m=>{m.roughness=.34;m.metalness=.15;m.color.multiply(new THREE.Color(.42,.36,.32));});break;
  case'go':// golem de pierre : base Warrok pétrifiée (peau minérale, fissures luisantes)
   R=makeChar('hx_brute',{s:.78,set:'mx',gsat:.08,gdk:.62,gamt:.7,gsc:5,ghc:.2,gmet:.05});mxLift(R,.08);eyeGlow(R,[0x8fd8ff,0x7fffb0,0xff7a2a,0x9fd8ff][tier],1.4);R.chargeCol=0x8fd8ff;break;
  case'gob':if(K.g.hx_brute){// brute (base Warrok) : peau selon le biome
    R=makeChar('hx_brute',{s:.56,set:'mx',hue:[.35,-.25,.9,2.6][tier],gsat:[.55,.75,.6,.5][tier],gdk:1.15,gamt:.18,ghc:.2,wR:['skaxe'],wx:{skaxe:{p:[0,.1,.02],s:.62}}});mxLift(R,.12);break;}
   if(!K.g.orc)return makeMonster(k,o);R=makeChar('orc',{s:.48,set:'qm'});break;
  case'ch':if(K.g.hx_brute){// chaman : plus petit, plus sombre, pagne teint, bâton d'os
    R=makeChar('hx_brute',{s:.47,set:'mx',hue:[-.6,.6,1.4,3.1][tier],gsat:.45,gdk:.95,gamt:.25,recol:{h:.0,to:.78,w:.12,s:.8},wR:['skstaff'],wx:{skstaff:{p:[0,.35,.02],s:.85}}});mxLift(R,.12);R.chargeCol=0x9f7aff;break;}
   if(!K.g.tribal)return makeMonster(k,o);R=makeChar('tribal',{s:.42,set:'qm'});break;
  case'py':if(K.g.hx_cult){// pyromancien : cultiste (base Vampire), écharpe teinte par biome, mains de braise
    R=makeChar('hx_cult',{s:.66,set:'mx',recol:{h:.0,to:[.06,.3,.03,.58][tier],w:.1,s:1.1},gsat:.85,gdk:1.2,gamt:.12});mxLift(R,.14);R.chargeCol=0xff7a2a;
    [R.handR,R.handL].forEach(h=>{if(!h)return;const e=haloS(tier===3?0x8ad0ff:0xff7a2a,.22,.55);e.position.y=.08;h.add(e);});break;}
   if(!K.g.demon)return makeMonster(k,o);R=makeChar('demon',{s:.44,set:'qm',hue:tier===3?2.6:0});break;
  case'sq':if(K.g.hx_aldric){// revenant : base Paladin, armure rouillée, lueur spectrale
    R=makeChar('hx_aldric',{s:1.02,set:'mx',style:{sp:[.32,0,.06]},hue:.45,gsat:.3,gdk:.55,gamt:.7,gsc:6,ghc:.3,recol:{h:.75,to:.08,w:.2,s:.4}});mxLift(R,.09);eyeGlow(R,[0x9fffd0,0x9fffd0,0xff7a3a,0x9fd8ff][tier]);R.chargeCol=0x9fffd0;break;}
   R=makeChar('skwar',{s:.56,set:'sk',gsat:.35,gdk:.82,gamt:.55,wR:['skblade'],wL:['skshield']});break;
  case'ar':if(K.g.hx_maelle){// archère morte-vivante : base Erika, peau cadavérique
    R=makeChar('hx_maelle',{s:.97,set:'mx',style:{sp:[.28,0,-.05]},hue:.55,gsat:.2,gdk:.5,gamt:.6,gsc:6});mxLift(R,.09);eyeGlow(R,[0x9fffd0,0x9fffd0,0xff7a3a,0x9fd8ff][tier]);R.set=Object.assign({},R.set,{shoot:'mx_bow',atk:'mx_bow'});R.chargeCol=0x9fffd0;break;}
   R=makeChar('skrog',{s:.56,set:'sk',gsat:.35,gdk:.82,gamt:.55,wR:['skxbow']});break;
  case'wy':if(K.g.hx_dragon){// dragonnet : jeune dragon réaliste, teinte par biome
    R=makeChar('hx_dragon',{s:.0016,set:'dr',ground:1,hue:[1.7,.9,0,3.2][tier],gsat:.6,gdk:1.05,gamt:.25,gsc:3});R.mats.forEach(m=>{if(/Eye/.test(m.name)){m.emissive=new THREE.Color(0xffc040);m.emissiveIntensity=1.6;m.userData.e0=m.emissive.clone();m.userData.ei0=1.6;}});mxLift(R,.07);break;}
   R=makeChar('drake',{s:.5,set:'fl',hue:[0,1.7,0,3.2][tier],y:-.25,gsat:.45,gdk:.7});break;
  case'boss':if(K.g.hx_dragon){// dragon réaliste (modèle d'Oscar Creativo, CC-BY), teinte et yeux selon l'élément
    const ec=ELC[o.el]||0xff8a2a;R=makeChar('hx_dragon',{s:.0041,set:'dr',ground:1,hue:ELH[o.el]||0,rimCol:ec,gsat:.42,gdk:1.1,gamt:.2,gsc:2,gmet:.12});
    R.mats.forEach(m=>{if(/Eye/.test(m.name)){m.emissive=new THREE.Color(ec);m.emissiveIntensity=2.4;m.userData.e0=m.emissive.clone();m.userData.ei0=2.4;}});mxLift(R,.11);
    R.scale=1;R.boss=1;R.chargeCol=ec;break;}
  R=makeChar('dragon',{s:1.12,set:'fl',hue:ELH[o.el]||0,y:-.15,rimCol:ELC[o.el]||0xff8a2a,gsat:.24,gdk:.6,gamt:.55,gsc:2.2,gmet:.15,ghc:.75});R.scale=1;R.boss=1;R.chargeCol=ELC[o.el]||0xff8a2a;break;
  default:return makeMonster(k,o);}
 R.k=k;R.kind='mon';R.root.add(k==='boss'?blob(2.2,.6):k==='wy'?blob(.4,.35):blob(.45,.62));if(k!=='wy'&&k!=='boss')R.root.add(blob(.22,.5));return R;}
function merchM(){if(!K.ok)return makeMerchant();let R;if(K.g.hx_cult){// Borin : marchand (base Vampire), habits brun chaud
 R=makeChar('hx_cult',{s:.86,kind:'npc',set:'mx',recol:{h:0,to:.07,w:.14,s:.55},gsat:.75,gdk:1.1,gamt:.15});mxLift(R,.12);R.mx=1;}else R=makeChar('barbarian',{s:.5,kind:'npc'});R.root.add(blob(.4,.55));
 if(R.handL){const lan=new THREE.Mesh(new THREE.BoxGeometry(.22,.3,.22),new THREE.MeshStandardMaterial({color:0xffd27a,emissive:0xffb040,emissiveIntensity:3}));lan.position.y=-.1;R.handL.add(lan);}return R;}
/* ---------- portraits 3D (rendus hors écran, mis en cache) ---------- */
const PORT={};let pScene=null,pCam=null,pRT=null;
function portrait(k){if(!K.ok||!renderer)return null;if(PORT[k])return PORT[k];
 if(!pScene){pScene=new THREE.Scene();pScene.add(new THREE.HemisphereLight(0xfff0e0,0x302028,1.5));const kl=new THREE.DirectionalLight(0xffe2c4,3.2);kl.position.set(1.6,2.2,3);pScene.add(kl);const rl=new THREE.DirectionalLight(0x8ab0ff,3);rl.position.set(-2.2,1.6,-2.5);pScene.add(rl);
  pCam=new THREE.PerspectiveCamera(26,1,.05,60);pRT=new THREE.WebGLRenderTarget(192,192,{samples:4});pRT.texture.colorSpace=THREE.SRGBColorSpace;}
 let R,look,pos;const hero=['guerrier','mage','rodeuse'].includes(k);
 if(hero){R=heroM(k,{});if(R.mx){look=new THREE.Vector3(0,1.6,0);pos=new THREE.Vector3(.28,1.66,.9);}else{look=new THREE.Vector3(0,1.08,0);pos=new THREE.Vector3(.45,1.18,1.35);}}
 else if(k==='borin'){R=merchM();if(R.mx){look=new THREE.Vector3(0,1.66,0);pos=new THREE.Vector3(.26,1.72,.82);}else{look=new THREE.Vector3(0,.88,0);pos=new THREE.Vector3(.4,.98,1.25);}}
 else if(k.startsWith('prop:')){const pr=fitObj(piece(k.slice(5),1),1.6);R={root:new THREE.Group(),prop:1};R.root.add(pr);look=new THREE.Vector3(0,.7,0);pos=new THREE.Vector3(1.2,1.6,2.6);}
 else if(k.startsWith('mon:')){R=monM(k.slice(4),{});R.root.updateMatrixWorld(true);const bb=new THREE.Box3();R.root.traverse(m=>{if(m.isMesh&&m.visible&&!(m.material&&m.material.transparent&&m.geometry.type==='PlaneGeometry')){if(m.isSkinnedMesh){m.computeBoundingBox();bb.union(m.boundingBox.clone().applyMatrix4(m.matrixWorld));}else{if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();bb.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld));}}});const hh=bb.max.y;look=new THREE.Vector3(0,hh*.55,0);pos=new THREE.Vector3(hh*.5,hh*.65,hh*1.9);}
 else{R=monM('boss',{el:k});look=new THREE.Vector3(0,2.4,1.0);pos=new THREE.Vector3(1.2,2.9,5.6);}
 R.root.traverse(o=>{if(o.isMesh&&o.material&&o.material.map&&o.material.transparent&&o.geometry.type==='PlaneGeometry')o.visible=false;});
 R.root.rotation.y=hero||k==='borin'?.25:-.2;if(!R.prop)anim(R,.4,.4,{walk:0,phase:0});pScene.environment=ENV;pScene.add(R.root);pCam.position.copy(pos);pCam.lookAt(look);
 const tm=renderer.toneMapping;renderer.setRenderTarget(pRT);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(pScene,pCam);
 const px=new Uint8Array(192*192*4);renderer.readRenderTargetPixels(pRT,0,0,192,192,px);renderer.setRenderTarget(null);renderer.setClearColor(0x000000,1);
 pScene.remove(R.root);purgeObj(R.root);
 const c=document.createElement('canvas');c.width=c.height=192;const cx=c.getContext('2d'),id=cx.createImageData(192,192);for(let y=0;y<192;y++)id.data.set(px.subarray((191-y)*768,(192-y)*768),y*768);cx.putImageData(id,0,0);
 PORT[k]=c;return c;}
function anim(R,dt,t,st){if(R.gl)animateG(R,dt,t,st);else animate(R,dt,t,st);}
const EXS=()=>K.ok?.7:1;
const TAU=Math.PI*2;
const BIO=[
 {floor:['#3b3a44','#2c2b33','#45444e'],mortar:'#121116',wall:['#4a4652','#2a2830'],fog:0x07060c,amb:0x2a2a40,light:0xffa050,acc:0x8a8aa0},
 {floor:['#3e3527','#2e271c','#4a4030'],mortar:'#120e08',wall:['#4d4030','#2a2218'],fog:0x050b0a,amb:0x1e3330,light:0xffb070,acc:0x5fe0ff},
 {floor:['#332825','#261c1a','#3e302c'],mortar:'#0e0806',wall:['#4a3a32','#241a16'],fog:0x0e0503,amb:0x3a1a10,light:0xff8040,acc:0xff6a1a},
 {floor:['#3a4a5e','#2c3a4c','#4a5c72'],mortar:'#101722',wall:['#5a6e88','#2c384a'],fog:0x060a14,amb:0x24324a,light:0xa8d0ff,acc:0xbfe4ff}];
let ENV=null,grade,flashV=0,hiQ=true,renderer,composer,rp,bloom,cam,scW,scB,clock,W=1,H=1,mode='explo';
const hr=(x,y,k=0)=>{let h=(x*374761393+y*668265263+k*1442695041)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return(h>>>0)/4294967296;};

/* ---------- textures procédurales ---------- */
const TX={};
function canvasTex(key,size,draw,rep=1){if(TX[key])return TX[key];const _k=1;const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep,rep);t.anisotropy=4;t.userData.keep=1;TX[key]=t;return t;}
function stoneTex(tier){const B=BIO[tier];return canvasTex('floor'+tier,256,(g,s)=>{g.fillStyle=B.mortar;g.fillRect(0,0,s,s);const n=4;for(let j=0;j<n;j++)for(let i=0;i<n;i++){const off=j%2?s/n/2:0;const x=i*s/n+off,y=j*s/n,w=s/n-4,h=s/n-4;
  const k=hr(i,j,tier);const gr=g.createLinearGradient(x,y,x+w,y+h);gr.addColorStop(0,B.floor[2]);gr.addColorStop(.5,B.floor[(k*2)|0]);gr.addColorStop(1,B.floor[1]);g.fillStyle=gr;
  [[x,y],[x-s,y]].forEach(([xx,yy])=>{g.fillRect(xx+2,yy+2,w,h);});}
 for(let i=0;i<900;i++){g.fillStyle=Math.random()<.5?'rgba(0,0,0,.18)':'rgba(255,255,255,.05)';g.fillRect(Math.random()*s,Math.random()*s,2,2);}
 g.strokeStyle='rgba(0,0,0,.35)';for(let i=0;i<6;i++){g.beginPath();let x=Math.random()*s,y=Math.random()*s;g.moveTo(x,y);for(let k=0;k<5;k++){x+=(Math.random()-.5)*30;y+=(Math.random()-.5)*30;g.lineTo(x,y);}g.stroke();}});}
function brickTex(tier){const B=BIO[tier];return canvasTex('wall'+tier,256,(g,s)=>{g.fillStyle=B.mortar;g.fillRect(0,0,s,s);const rows=8,bh=s/rows;for(let r=0;r<rows;r++){const off=r%2?bh:0;for(let x=-off;x<s;x+=bh*2){const k=Math.random();
  const gr=g.createLinearGradient(0,r*bh,0,r*bh+bh);gr.addColorStop(0,B.wall[0]);gr.addColorStop(1,B.wall[1]);g.fillStyle=gr;g.globalAlpha=.75+k*.25;g.fillRect(x+2,r*bh+2,bh*2-4,bh-4);g.globalAlpha=1;}}
 for(let i=0;i<700;i++){g.fillStyle=Math.random()<.5?'rgba(0,0,0,.2)':'rgba(255,255,255,.05)';g.fillRect(Math.random()*s,Math.random()*s,2,2);}});}
const glowTex=()=>canvasTex('glow',64,(g,s)=>{const r=g.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.6)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,s,s);});

/* ---------- libération mémoire GPU ---------- */
const TEXK=['map','emissiveMap','bumpMap','normalMap','alphaMap','roughnessMap','metalnessMap','aoMap'];
function purgeObj(root,seen=new Set()){root.traverse(o=>{if(o===pts||o.userData.keep)return;if(o.isInstancedMesh)o.dispose();if(o.isSkinnedMesh&&o.skeleton&&!seen.has(o.skeleton)){seen.add(o.skeleton);o.skeleton.dispose();}if(o.userData.R&&o.userData.R.mixer){o.userData.R.mixer.stopAllAction();o.userData.R.mixer.uncacheRoot(o.userData.R.model);}if(o.geometry&&!o.geometry.userData.keep&&!seen.has(o.geometry)){seen.add(o.geometry);o.geometry.dispose();}
 const ms=o.material?[].concat(o.material):[];ms.forEach(m=>{if(!m||m.userData.keep||seen.has(m))return;seen.add(m);TEXK.forEach(k=>{const t=m[k];if(t&&!t.userData.keep&&!seen.has(t)){seen.add(t);t.dispose();}});if(m.uniforms&&m.uniforms.map&&m.uniforms.map.value&&!m.uniforms.map.value.userData.keep){m.uniforms.map.value.dispose();}m.dispose();});});}
function purge(sc){if(sc===scW&&EX.key&&EX.key.shadow.map){EX.key.shadow.map.dispose();EX.key.shadow.map=null;}if(sc===scB&&BT.key&&BT.key.shadow.map){BT.key.shadow.map.dispose();BT.key.shadow.map=null;}purgeObj(sc);while(sc.children.length)sc.remove(sc.children[0]);}
function keepAll(){if(!K.ok)return;Object.values(K.g).forEach(gl=>gl.scene.traverse(o=>{if(o.geometry)o.geometry.userData.keep=1;[].concat(o.material||[]).forEach(m=>{m.userData.keep=1;TEXK.forEach(k=>{if(m[k])m[k].userData.keep=1;});});}));Object.values(K.geo).forEach(p=>{if(p&&p.geo)p.geo.userData.keep=1;});}
/* ---------- initialisation ---------- */
function init(container){renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(1.75,devicePixelRatio||1));renderer.debug.checkShaderErrors=false;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.domElement.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:0';container.prepend(renderer.domElement);
 // Perte de l'affichage 3D (GPU saturé, mise en veille…) : on demande au navigateur de le rendre, on recompile, et sinon on propose de relancer
 {const cv=renderer.domElement;let lostT=null;const box=()=>{let d=document.getElementById('glLost');if(!d){d=document.createElement('div');d.id='glLost';d.style.cssText='position:fixed;inset:0;z-index:99;display:none;align-items:center;justify-content:center;flex-direction:column;gap:14px;background:rgba(5,3,8,.82);color:#f0e0c0;font:16px Georgia,serif;text-align:center;padding:20px';d.innerHTML='<div>L\'affichage 3D s\'est interrompu.<br>Ta partie est sauvegardée.</div><button style="font:16px Georgia,serif;padding:10px 18px;border-radius:10px;border:1px solid #c9a050;background:#2a1c10;color:#ffe0a0">Relancer l\'affichage</button>';d.querySelector('button').onclick=()=>location.reload();document.body.appendChild(d);}return d;};
  cv.addEventListener('webglcontextlost',e=>{e.preventDefault();G3.lost=(G3.lost||0)+1;try{window.dispatchEvent(new Event('vd-save'));}catch(_){}clearTimeout(lostT);lostT=setTimeout(()=>{box().style.display='flex';},3000);},false);
  cv.addEventListener('webglcontextrestored',()=>{clearTimeout(lostT);const d=document.getElementById('glLost');if(d)d.style.display='none';hold=0;needComp=1;renderer.shadowMap.needsUpdate=true;},false);}
 cam=new THREE.PerspectiveCamera(42,1,.1,200);scW=new THREE.Scene();scB=new THREE.Scene();
 // MSAA dans la chaîne d'effets : sans cela l'anticrénelage du renderer est perdu (bords en escalier)
 composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:4}));rp=new RenderPass(scW,cam);composer.addPass(rp);bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.85,.5,.82);composer.addPass(bloom);grade=gradePass();composer.addPass(grade);/* une seule passe finale (tonalité + sRGB + étalonnage) */
 clock=new THREE.Clock();initParticles();
 {// carte d'environnement sombre (reflets des torches sur le métal)
  const es=new THREE.Scene();es.background=new THREE.Color(0x050403);const bm=c=>new THREE.MeshBasicMaterial({color:c,side:THREE.BackSide});const room=new THREE.Mesh(new THREE.BoxGeometry(20,8,20),bm(0x0c0a08));es.add(room);
  [[-6,2,-9,0xff9a40],[7,1.5,-8,0xff8a30],[-8,1,6,0x6a5a48],[0,6,0,0x302820]].forEach(([x,y,z,c])=>{const p=new THREE.Mesh(new THREE.SphereGeometry(1.1,12,8),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(3)}));p.position.set(x,y,z);es.add(p);});
  const pm=new THREE.PMREMGenerator(renderer);ENV=pm.fromScene(es,.04).texture;pm.dispose();scW.environment=ENV;scB.environment=ENV;}resize();addEventListener('resize',resize);}
function resize(){W=innerWidth;H=innerHeight;renderer.setSize(W,H);composer.setSize(W,H);bloom.resolution.set(W/(qLvl>=3?3:4.5),H/(qLvl>=3?3:4.5));cam.aspect=W/H;cam.updateProjectionMatrix();}

/* ---------- particules (partagées) ---------- */
const PMAX=2400;let pts,pPos,pCol,pSize,pTile,pRot,pData=[];
function initParticles(){const g=new THREE.BufferGeometry();pPos=new Float32Array(PMAX*3);pCol=new Float32Array(PMAX*3);pSize=new Float32Array(PMAX);
 g.setAttribute('position',new THREE.BufferAttribute(pPos,3));g.setAttribute('color',new THREE.BufferAttribute(pCol,3));g.setAttribute('size',new THREE.BufferAttribute(pSize,1));pTile=new Float32Array(PMAX);pRot=new Float32Array(PMAX);g.setAttribute('tile',new THREE.BufferAttribute(pTile,1));g.setAttribute('rot',new THREE.BufferAttribute(pRot,1));
 const at=elTex('patlas');const m=new THREE.ShaderMaterial({uniforms:{map:{value:at||glowTex()},atl:{value:at?1:0}},vertexShader:'attribute float size;attribute vec3 color;attribute float tile;attribute float rot;varying vec3 vC;varying float vT,vR;void main(){vC=color;vT=tile;vR=rot;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*300./-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform sampler2D map;uniform float atl;varying vec3 vC;varying float vT,vR;void main(){vec2 p=gl_PointCoord-.5;float c=cos(vR),s=sin(vR);p=clamp(mat2(c,-s,s,c)*p*1.02+.5,.01,.99);float a;if(atl>.5){vec2 uv=(vec2(mod(vT,4.),floor(vT/4.))+vec2(p.x,p.y))*.25;uv.y=1.-uv.y;a=texture2D(map,uv).r;}else a=texture2D(map,gl_PointCoord).a;vec3 pc=mix(vec3(dot(vC,vec3(.3,.59,.11))),vC,.72);pc=mix(pc,vec3(1.,.93,.8)*max(max(vC.r,vC.g),vC.b),a*a*.35);gl_FragColor=vec4(pc*a*1.55,a);}',blending:THREE.AdditiveBlending,depthWrite:false,transparent:true});
 pts=new THREE.Points(g,m);pts.frustumCulled=false;}
function part(o){if(pData.length>=PMAX)pData.shift();pData.push(Object.assign({vx:0,vy:0,vz:0,g:0,life:.8,size:.15,drag:.96,tile:0,rot:Math.random()*6.28,vr:0,col:new THREE.Color(0xffaa55)},o,{max:o.life||.8}));}
function burst(pos,col,n=20,sp=3,o={}){const c=new THREE.Color(col);for(let i=0;i<n;i++){const a=Math.random()*TAU,b=Math.random()*Math.PI-Math.PI/2,s=sp*(.3+Math.random()*.7);
 part(Object.assign({x:pos.x,y:pos.y,z:pos.z,vx:Math.cos(a)*Math.cos(b)*s,vy:Math.sin(b)*s*.8+sp*.3,vz:Math.sin(a)*Math.cos(b)*s,col:c,life:.4+Math.random()*.6,size:.12+Math.random()*.18,g:-4,tile:[0,5,9,14,0][(Math.random()*5)|0],vr:(Math.random()-.5)*6},o));}}
function updParticles(dt){let n=0;for(let i=pData.length-1;i>=0;i--){const p=pData[i];p.life-=dt;if(p.life<=0){pData.splice(i,1);continue;}p.vx*=p.drag;p.vz*=p.drag;p.vy=p.vy*p.drag+p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.rot+=p.vr*dt;if(p.y<.02&&p.g<0){p.y=.02;p.vy*=-.3;}}
 for(const p of pData){const a=Math.min(1,p.life/p.max*1.5);pPos[n*3]=p.x;pPos[n*3+1]=p.y;pPos[n*3+2]=p.z;pCol[n*3]=p.col.r*a;pCol[n*3+1]=p.col.g*a;pCol[n*3+2]=p.col.b*a;pSize[n]=p.size*(.5+.5*a)*(p.tile?1.6:1);pTile[n]=p.tile;pRot[n]=p.rot;n++;}
 pts.geometry.setDrawRange(0,n);pts.geometry.attributes.position.needsUpdate=pts.geometry.attributes.color.needsUpdate=pts.geometry.attributes.size.needsUpdate=pts.geometry.attributes.tile.needsUpdate=pts.geometry.attributes.rot.needsUpdate=true;}

/* ---------- lumières dynamiques (pool) ---------- */
// scintillement irrégulier (bruit 1D) plutôt qu'une sinusoïde régulière
const _fh=n=>{const s=Math.sin(n*127.1)*43758.5453;return s-Math.floor(s);};const vn1=x=>{const i=Math.floor(x),f=x-i,u=f*f*(3-2*f);return _fh(i)*(1-u)+_fh(i+1)*u;};
const flick=(t,i)=>.78+.16*vn1(t*6.3+i*17.1)+.08*vn1(t*17.7+i*5.3)-.05*(vn1(t*1.3+i*3.1)>.82?1:0);
// Nombre FIXE de lumières ponctuelles par scène : sinon chaque scène (étage, combat, marchand) recompile tous les shaders.
const NPL=6;
// échelle des textures de sol par biome (crypte, cavernes, forge, givre) : taille réelle des pierres
const FSC=[.22,.13,.16,.19];function padPL(sc){let n=0;sc.traverse(o=>{if(o.isPointLight)n++;});for(;n<NPL;n++){const l=new THREE.PointLight(0,0,1,2);l.position.set(0,-50,0);sc.add(l);}}
function lightPool(scene,n){const L=[];for(let i=0;i<n;i++){const l=new THREE.PointLight(0xffa050,0,6,2);l.userData.dec=10;scene.add(l);L.push(l);}return L;}

/* ===================== EXPLORATION ===================== */
const EX={};
function buildFloor(VD){endTitle();mode='explo';needComp=1;EX.lavas=[];EX.bats=null;EX.rats=null;EX.glows=[];keepAll();purge(scW);const tier=Math.floor((VD.F-1)/4)%4,B=BIO[tier];EX.tier=tier;
 scW.fog=new THREE.FogExp2(B.fog,.072);scW.background=new THREE.Color(B.fog);
 scW.add(new THREE.HemisphereLight(B.amb,0x080608,.55));scW.add(new THREE.AmbientLight(B.amb,.35));
 const Wd=VD.W,Hd=VD.H,cells=[],walls=[],pill=[];for(let y=0;y<Hd;y++)for(let x=0;x<Wd;x++){const v=VD.map[y*Wd+x];if(v===1||v===2||v===3||v===4)cells.push([x,y,v]);
  if(v===0){let n=false;for(let j=-1;j<=1&&!n;j++)for(let i=-1;i<=1;i++){const vv=VD.at(x+i,y+j);if(vv===1||vv===2||vv===3){n=true;break;}}if(n)walls.push([x,y]);}if(v===3)pill.push([x,y]);}
 EX.fog=null;EX.mapRef=VD.map;if(K.ok)kitWorld(VD,tier);else{
 const ft=stoneTex(tier);const fm=new THREE.MeshStandardMaterial({map:ft,bumpMap:ft,bumpScale:.04,roughness:.85});
 const fg=new THREE.PlaneGeometry(1,1);fg.rotateX(-Math.PI/2);EX.floor=new THREE.InstancedMesh(fg,fm,cells.length);EX.floor.receiveShadow=true;
 const wt=brickTex(tier);const wm=new THREE.MeshStandardMaterial({map:wt,bumpMap:wt,bumpScale:.05,roughness:.9});const wh=1.5;
 const wg=new THREE.BoxGeometry(1,wh,1);EX.walls=new THREE.InstancedMesh(wg,wm,walls.length);EX.walls.castShadow=true;EX.walls.receiveShadow=true;
 const m4=new THREE.Matrix4(),col=new THREE.Color();EX.cellIdx=new Int32Array(Wd*Hd).fill(-1);EX.wallIdx=new Int32Array(Wd*Hd).fill(-1);
 cells.forEach(([x,y,v],i)=>{m4.makeTranslation(x+.5,0,y+.5);EX.floor.setMatrixAt(i,m4);EX.floor.setColorAt(i,col.setRGB(0,0,0));EX.cellIdx[y*Wd+x]=i;});
 walls.forEach(([x,y],i)=>{m4.makeTranslation(x+.5,wh/2,y+.5);EX.walls.setMatrixAt(i,m4);EX.walls.setColorAt(i,col.setRGB(0,0,0));EX.wallIdx[y*Wd+x]=i;});
 scW.add(EX.floor,EX.walls);
 // piliers
 const pg=new THREE.CylinderGeometry(.32,.38,2.2,10);const pm=(()=>{const TW=bioTex(tier,'w');const m=new THREE.MeshStandardMaterial({map:TW?null:wt,roughness:.85});return TW?grime(m,{sc:1.4,amt:.25,sat:.9,dk:1,base:.6,rough:.2,tex:{d:TW.d,n:TW.n,s:[.42,.36,.42,.3][tier],b:1.5,wall:1}}):m;})();EX.pills=pill.map(([x,y])=>{const p=new THREE.Mesh(pg,pm);p.position.set(x+.5,1.1,y+.5);p.castShadow=p.receiveShadow=true;p.visible=false;p.userData.c=[x,y];scW.add(p);return p;});
 }
 // escalier
 const s=VD.stairs;const hole=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.05,20),new THREE.MeshBasicMaterial({color:0x000000}));hole.position.set(s.x+.5,.01,s.y+.5);scW.add(hole);
 EX.stairRing=new THREE.Mesh(new THREE.TorusGeometry(.5,.04,8,32),new THREE.MeshStandardMaterial({color:0x222222,emissive:0xffc060,emissiveIntensity:1.5}));EX.stairRing.rotation.x=-Math.PI/2;EX.stairRing.position.set(s.x+.5,.05,s.y+.5);scW.add(EX.stairRing);
 // torches et braseros
 EX.torches=[];const FT=elTex('flame')||glowTex();const halo=new THREE.SpriteMaterial({map:glowTex(),color:0xff8a30,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.3});const fl=new THREE.SpriteMaterial({map:FT,color:0xffa040,blending:THREE.AdditiveBlending,depthWrite:false});
 VD.lights.forEach(l=>{const g=new THREE.Group();g.position.set(l.x,l.k==='torch'?1.05:.0,l.k==='torch'?Math.floor(l.y)+.08:l.y);
  if(l.k==='torch'){if(K.ok){const tm=piece('torch_mounted',.3,false);g.add(tm);g.position.y=.98;g.position.z=Math.floor(l.y);}else g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(.06,.25,.06),mat(0x2a2018)),{}));}else{const b=new THREE.Mesh(new THREE.CylinderGeometry(.22,.12,.5,8),mat(0x3a3028,{std:{metalness:.5}}));b.position.y=.25;b.castShadow=true;g.add(b);g.position.y=0;}
  const f=new THREE.Sprite(fl);{const hs=new THREE.Sprite(halo);hs.scale.set(l.k==='torch'?.7:1.2,l.k==='torch'?.7:1.2,1);hs.position.y=l.k==='torch'?(K.ok?.22:.22):.6;if(K.ok&&l.k==='torch')hs.position.z=.15;g.add(hs);}f.scale.set(l.k==='torch'?.42:.7,l.k==='torch'?.55:.9,1);f.position.y=l.k==='torch'?.22:.65;if(K.ok&&l.k==='torch'){f.position.set(0,.24,.15);f.scale.set(.3,.42,1);}g.add(f);g.visible=false;g.userData={f,l,c:[l.x|0,(l.y|0)]};scW.add(g);EX.torches.push(g);});
 EX.tpool=lightPool(scW,qLvl>=2?4:2);
 // décor de biome
 EX.props=[];const add=(o,x,y)=>{o.position.x=x;o.position.z=y;o.visible=false;o.userData.c=[x|0,y|0];scW.add(o);EX.props.push(o);};
 VD.rooms.forEach((r,i)=>{for(let k=0;k<5;k++){const x=r.x+hr(i,k,1)*r.w,y=r.y+hr(i,k,2)*r.h;if(VD.solid(x,y))continue;const sel=hr(i,k,3);
  if(tier===1&&sel<.5){const g=new THREE.Group();for(let m=0;m<3;m++){const st=new THREE.Mesh(new THREE.CylinderGeometry(.03,.04,.2+m*.06,6),mat(0x8a8a7a));st.position.set((m-1)*.12,.1+m*.03,(m%2)*.08);g.add(st);const cp=new THREE.Mesh(new THREE.SphereGeometry(.1,12,6,0,TAU,0,Math.PI/2),mat(0x5a6a62,{em:0x3a8a90,ei:.35}));cp.position.set((m-1)*.12,.2+m*.06,(m%2)*.08);g.add(cp);}add(g,x,y);}
  else if(tier===3&&sel<.45){const g=new THREE.Group();for(let m=0;m<4;m++){const c=new THREE.Mesh(new THREE.OctahedronGeometry(.12,0),mat(0x8fa8b8,{em:0x3a6a8a,ei:.25,flat:1}));c.scale.set(.8,2+m*.6,.8);c.position.set((m-1.5)*.1,.25+m*.05,(m%2)*.07);c.rotation.z=(m-1.5)*.25;g.add(c);}add(g,x,y);}
  else if(tier===3&&sel<.75&&K.ok){const c=iceSheet(1.3+hr(i,k,5)*.8);c.rotation.z=hr(i,k,4)*3;c.userData.kind='glace';add(c,x,y);}
  else if(tier===2&&sel<.4){if(K.ok){const c=lavaDecal(1.5,1.25,i*7+k);c.rotation.z=hr(i,k,4)*3;c.userData.kind='lave';add(c,x,y);(EX.lavas=EX.lavas||[]).push(c);}else{const c=new THREE.Mesh(new THREE.PlaneGeometry(.9,.12),new THREE.MeshBasicMaterial({color:0xff6a1a}));c.rotation.x=-Math.PI/2;c.rotation.z=hr(i,k,4)*3;c.position.y=.015;add(c,x,y);}}
  else if(sel<.6){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.35,5),mat(0xcfc7b0));b.rotation.z=Math.PI/2;b.position.y=.03;g.add(b);if(sel<.5){const sk=new THREE.Mesh(new THREE.SphereGeometry(.08,8,6),mat(0xd8d0b8));sk.position.set(.18,.07,.05);g.add(sk);}g.rotation.y=sel*9;add(g,x,y);}}});
 // objets (coffres, tonneaux, sanctuaires)
 EX.objs=new Map();VD.obj.forEach(o=>EX.objs.set(o,makeObj(o)));
 // marchand
 EX.merch=merchM();EX.merch.root.scale.multiplyScalar(EXS());EX.merch.root.position.set(VD.merch.x,0,VD.merch.y);scW.add(EX.merch.root);EX.merchLight=new THREE.PointLight(0xffc070,2.2,4,1.5);EX.merchLight.position.set(VD.merch.x+.2,.9,VD.merch.y+.2);scW.add(EX.merchLight);
 // groupe et monstres
 EX.party=VD.P.heroes.map(h=>{const R=heroM(h.cls,eqOf(h));R.root.scale.multiplyScalar(EXS());scW.add(R.root);return R;});EX.trail=[];
  EX.packs=new Map();EX.packList=VD.E.slice();VD.E.forEach(addPackModel);_bf2(VD,B);
}
function addPackModel(e){{const R=monM(e.boss?'boss':e.k,{el:e.el});if(!needComp)warm(R.root,scW);if(e.boss)R.root.scale.setScalar(R.scale*.8);else R.root.scale.multiplyScalar(e.elite?1.15:1);R.root.scale.multiplyScalar(EXS());scW.add(R.root);EX.packs.set(e,R);
  if(e.elite){const ring=new THREE.Mesh(new THREE.RingGeometry(.45,.55,24),new THREE.MeshBasicMaterial({color:{rapide:0x7fe0ff,blinde:0xd0d0d0,vampire:0xff3a5a,ardent:0xff8a2a}[e.elite],transparent:true,opacity:.8,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.02;R.root.add(ring);}R.root.visible=false;return R;}}
function _bf2(VD,B){
 // lumière du groupe (projecteur avec ombres) + lanterne
 EX.key=new THREE.SpotLight(0xffd7a0,46,11,.78,.6,1.4);EX.key.castShadow=true;EX.key.shadow.mapSize.set(qLvl>=3?1024:512,qLvl>=3?1024:512);EX.key.shadow.bias=-.0008;scW.add(EX.key,EX.key.target);
 EX.lan=new THREE.PointLight(0xffc690,3.0,7.5,1.7);
 scW.add(pts);pData.length=0;scW.add(smokeSys());smokeClear();
 if(K.ok){EX.fogP=groundFog(26,new THREE.Color(B.fog).lerp(new THREE.Color(B.acc),.25).offsetHSL(0,0,.12),.28);EX.fogP.visible=hiQ;scW.add(EX.fogP);}else EX.fogP=null;
 EX.yaw=EX.yaw||0;EX.seenN=0;padPL(scW);rp.scene=scW;}

/* ---------- donjon modulaire (KayKit) ---------- */
const KFLOOR=[[['floor_tile_large',.94],['floor_tile_large_rocks',.045],['floor_tile_big_grate',.015]],[['floor_dirt_large',.85],['floor_dirt_large_rocky',.15]],[['floor_tile_large',.92],['floor_tile_big_grate',.03],['floor_tile_large_rocks',.05]],[['floor_tile_large',.93],['floor_tile_large_rocks',.07]]];
const KTINT=[[.6,.58,.63],[.47,.45,.41],[.62,.5,.45],[.4,.46,.58]];
const KWALL=[['wall',.8],['wall_cracked',.13],['wall_gated',.04],['wall_broken',.03]];
const KBAN=['banner_patternA_red','banner_shield_green','banner_triple_yellow','banner_patternB_blue'];
const KPROP=[['barrel_large','crates_stacked','candle_triple','trunk_large_A','rubble_half','sword_shield','barrel_small_stack','box_stacked'],['rubble_large','rubble_half','barrel_small_stack','box_stacked','trunk_large_A'],['keg_decorated','crates_stacked','barrel_large_decorated','coin_stack_medium','table_medium_decorated_A','barrel_large','box_stacked'],['rubble_large','trunk_large_A','box_stacked','candle_triple','rubble_half','bottle_A_green']];
const KROCK=[['Rock_1_A','Rock_1_E','Rock_2_A','Rock_3_A'],['Rock_1_A','Rock_1_E','Rock_1_J','Rock_2_C','Rock_2_F','Rock_3_E','Grass_1_A','Grass_2_B','Bush_1_A','Bush_2_C','Grass_1_A'],['Rock_1_J','Rock_2_A','Rock_3_A','Rock_1_E'],['Rock_1_A','Rock_1_E','Rock_2_C','Rock_3_Q','Rock_3_E']],KRT=[0x8a8494,0xb0a890,0x5a4a44,0xc8dcf0];
// hauteurs réelles visées (1 unité ≈ 1,5 m ; un héros ≈ 1,2)
const PH={barrel_large:.62,barrel_large_decorated:.62,keg_decorated:.55,crates_stacked:.95,box_stacked:.8,box_large:.5,barrel_small_stack:.75,trunk_large_A:.42,candle_triple:.42,rubble_half:.45,rubble_large:.6,sword_shield:.5,coin_stack_medium:.26,table_medium_decorated_A:.62,bottle_A_green:.2};
function fitH(o,h){const b=new THREE.Box3().setFromObject(o);const v=(b.max.y-b.min.y)||1;o.scale.multiplyScalar(h/v);return o;}
// mur plein (même encombrement que la pièce d'origine) : la texture photo en relief fait le détail, 12 triangles au lieu de ~500
function wallBox(name){const k='__box_'+name;if(K.geo[k])return K.geo[k];const pg=pieceGeo(name);if(!pg)return null;const g0=pg.geo;g0.computeBoundingBox();const bb=g0.boundingBox,sz=bb.getSize(new THREE.Vector3()),c=bb.getCenter(new THREE.Vector3());
 const fl=/^floor/.test(name);let g;if(fl){g=new THREE.BoxGeometry(4,sz.y,4);g.translate(0,c.y,0);const n=g.attributes.normal;for(let i=0;i<n.count;i++)n.setXYZ(i,0,1,0);/* côtés éclairés comme le dessus : pas de liseré sombre contre les dalles voisines */}else{g=new THREE.BoxGeometry(sz.x,sz.y,sz.z);g.translate(c.x,c.y,c.z);}return K.geo[k]={geo:g,mat:pg.mat};}
function fitObj(o,sz){const b=new THREE.Box3().setFromObject(o),v=b.getSize(new THREE.Vector3());const m=Math.max(v.x,v.y,v.z)||1;o.scale.multiplyScalar(sz/m);return o;}
const KPS={barrel_large:.17,crates_stacked:.2,candle_triple:.3,trunk_large_A:.2,rubble_half:.22,sword_shield:.22,barrel_small_stack:.22,box_stacked:.2,rubble_large:.2,keg_decorated:.2,barrel_large_decorated:.17,coin_stack_medium:.3,table_medium_decorated_A:.2,bottle_A_green:.3};
function pick(list,r){let a=0;for(const[n,w]of list){a+=w;if(r<a)return n;}return list[0][0];}
const THEMEC={salle:[1.02,.94,.84],biblio:[.97,.92,.84],reserve:[.92,.88,.82],tresor:[1.14,1.0,.74]};
/* ---------- petites créatures : chauves-souris, rats ---------- */
let batTex=null;function bTex(){if(batTex)return batTex;const c=document.createElement('canvas');c.width=128;c.height=64;const g=c.getContext('2d');g.fillStyle='#000';g.beginPath();g.moveTo(64,30);
 g.quadraticCurveTo(40,6,6,18);g.quadraticCurveTo(22,24,18,34);g.quadraticCurveTo(30,30,34,40);g.quadraticCurveTo(46,34,56,42);g.lineTo(64,38);g.lineTo(72,42);g.quadraticCurveTo(82,34,94,40);g.quadraticCurveTo(98,30,110,34);g.quadraticCurveTo(106,24,122,18);g.quadraticCurveTo(88,6,64,30);g.fill();
 g.beginPath();g.ellipse(64,36,7,10,0,0,7);g.fill();g.fillStyle='#ff4020';g.fillRect(60,30,3,2);g.fillRect(66,30,3,2);batTex=new THREE.CanvasTexture(c);batTex.userData.keep=1;return batTex;}
function initCritters(VD,tier){EX.bats=[];EX.rats=[];const near=()=>VD.rooms[(Math.random()*VD.rooms.length)|0];
 for(let i=0;i<5;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:bTex(),color:0x1a1418,transparent:true,depthWrite:false}));s.scale.set(.32,.16,1);s.visible=false;scW.add(s);const r=near();EX.bats.push({s,cx:r.cx+.5,cz:r.cy+.5,a:Math.random()*TAU,sp:1.6+Math.random(),rad:1+Math.random()*1.5,ph:Math.random()*6});}
 const rg=new THREE.SphereGeometry(.05,8,6);rg.scale(1,.8,1.9);const rm=new THREE.MeshStandardMaterial({color:tier===3?0xb8c0c8:0x5a4a40,roughness:.9});
 for(let i=0;i<(tier===2?2:4);i++){const g=new THREE.Group();const b=new THREE.Mesh(rg,rm);b.position.y=.045;g.add(b);const t=new THREE.Mesh(new THREE.CylinderGeometry(.006,.01,.16,4),new THREE.MeshStandardMaterial({color:0x8a6a60}));t.rotation.x=Math.PI/2.4;t.position.set(0,.03,-.13);g.add(t);
  const r=near();g.position.set(r.x+1.5,0,r.y+1.5);g.visible=false;scW.add(g);EX.rats.push({g,tx:g.position.x,tz:g.position.z,wait:Math.random()*3});}}
function updCritters(VD,dt,t){if(!EX.bats)return;const P=VD.P,vis=(x,z)=>VD.vis[(z|0)*VD.W+(x|0)];
 EX.bats.forEach(b=>{b.a+=dt*b.sp;const x=b.cx+Math.cos(b.a)*b.rad,z=b.cz+Math.sin(b.a*1.3)*b.rad;b.s.position.set(x,1.25+Math.sin(b.a*2.1)*.18,z);const f=Math.abs(Math.sin(t*22+b.ph));b.s.scale.set(.12+.22*f,.14,1);b.s.visible=!!vis(x,z);
  const d=Math.hypot(P.x-b.cx,P.y-b.cz);if(d>9||(d<1.5&&Math.random()<dt*2)){const rs=VD.rooms.filter(r=>{const e=Math.hypot(r.cx-P.x,r.cy-P.y);return e>2&&e<8;});const r=rs.length?rs[(Math.random()*rs.length)|0]:null;if(r){b.cx=r.cx+.5;b.cz=r.cy+.5;b.rad=1+Math.random()*2;}}});
 EX.rats.forEach(r=>{const g=r.g;const dx=r.tx-g.position.x,dz=r.tz-g.position.z,d=Math.hypot(dx,dz);const flee=Math.hypot(P.x-g.position.x,P.y-g.position.z)<1.3;
  if(d<.05||r.wait>0){r.wait-=dt;if(r.wait<=0||flee){for(let k=0;k<6;k++){const a=Math.random()*TAU,l=1+Math.random()*3,x=g.position.x+Math.cos(a)*l,z=g.position.z+Math.sin(a)*l;if(!VD.solid(x,z)&&!VD.solid((g.position.x+x)/2,(g.position.z+z)/2)){r.tx=x;r.tz=z;r.wait=0;break;}}if(r.wait<=0&&d<.05)r.wait=1+Math.random()*3;}}
  else{const sp=(flee?2.8:1.4)*dt;g.position.x+=dx/d*Math.min(sp,d);g.position.z+=dz/d*Math.min(sp,d);g.rotation.y=Math.atan2(dx,dz);if(d<.05)r.wait=.8+Math.random()*3;}
  g.visible=!!vis(g.position.x,g.position.z);if(Math.hypot(P.x-g.position.x,P.y-g.position.z)>12){const rs=VD.rooms.filter(q=>Math.hypot(q.cx-P.x,q.cy-P.y)<7);const q=rs[(Math.random()*rs.length)|0];if(q){g.position.set(q.x+1.2,0,q.y+1.2);r.tx=g.position.x;r.tz=g.position.z;}}});
 if((EX.tier===1||EX.tier===3)&&Math.random()<dt*3){const x=P.x+(Math.random()-.5)*6,z=P.y+(Math.random()-.5)*6;if(!VD.solid(x,z)&&vis(x,z))part({x,y:1.5,z,vy:-.5,life:1.2,size:.05,tile:9,col:new THREE.Color(EX.tier===3?0xd8ecff:0x9fd0ff).multiplyScalar(.8),g:-9,drag:1});}
 EX.glows&&EX.glows.forEach((s,i)=>{s.material.opacity=(s.userData.o0??(s.userData.o0=s.material.opacity))*(.85+.15*Math.sin(t*7+i*2.1));});}
const TXN=['crypt','cav','forge','frost'];function bioTex(tier,k){const n=TXN[tier]+'_'+k;const d=elTex(n+'_d'),nn=elTex(n+'_n');if(!d||!nn)return null;[d,nn].forEach(t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;});return{d,n:nn};}
let webTex=null;function cobweb(){if(webTex)return webTex;const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.strokeStyle='rgba(220,215,205,.45)';g.lineWidth=.8;
 const n=9,R=[];for(let i=0;i<n;i++){const a=i/(n-1)*Math.PI/2;R.push(a);g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(a)*128,Math.sin(a)*128);g.stroke();}
 for(let r=14;r<128;r+=11+Math.random()*6){g.beginPath();R.forEach((a,i)=>{const rr=r*(1+(Math.random()-.5)*.12);const x=Math.cos(a)*rr,y=Math.sin(a)*rr;if(i)g.quadraticCurveTo(Math.cos(a-.09)*rr*.9,Math.sin(a-.09)*rr*.9,x,y);else g.moveTo(x,y);});g.globalAlpha=.4+Math.random()*.4;g.stroke();}
 webTex=new THREE.CanvasTexture(c);webTex.userData.keep=1;return webTex;}
// plaque de glace (givre) : texture réelle ambientCG Ice003 (CC0), lisse et brillante, bord irrégulier
let iceA=null,iceM=null;function iceSheet(sz){if(!iceM){const tx=elTex('ice_d',true);if(tx){tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(.7,.7);}
  const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const gr=g.createRadialGradient(64,64,10,64,64,62);gr.addColorStop(0,'#fff');gr.addColorStop(.7,'#eee');gr.addColorStop(1,'#666');g.fillStyle=gr;g.beginPath();
  for(let i=0;i<=24;i++){const a=i/24*TAU,r=40+Math.sin(i*2.7)*13+Math.cos(i*1.3)*8+Math.sin(i*5.1)*4;g.lineTo(64+Math.cos(a)*r,64+Math.sin(a)*r);}g.fill();iceA=new THREE.CanvasTexture(c);iceA.userData.keep=1;
  iceM=new THREE.MeshStandardMaterial({map:tx,alphaMap:iceA,transparent:true,depthWrite:false,roughness:.06,metalness:.05,color:0xe8f4ff,emissive:0x1a2a38,opacity:.9,envMapIntensity:3});iceM.userData.keep=1;}
 const o=new THREE.Mesh(new THREE.PlaneGeometry(sz,sz*.8),iceM);o.rotation.x=-Math.PI/2;o.position.y=.035;o.receiveShadow=true;o.renderOrder=1;return o;}
function kitWorld(VD,tier){EX.tint=new Float32Array(VD.W*VD.H*3).fill(1);VD.rooms.forEach(r=>{const th=VD.obj.some(o=>o.t==='chest'&&o.gold&&o.x>=r.x&&o.x<r.x+r.w&&o.y>=r.y&&o.y<r.y+r.h)?'tresor':r.theme;r.th2=th;const c=THEMEC[th];if(!c)return;for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++){const k=(y*VD.W+x)*3;EX.tint[k]=c[0];EX.tint[k+1]=c[1];EX.tint[k+2]=c[2];}});
const Wd=VD.W,Hd=VD.H,fl=v=>v===1||v===2||v===3||v===4,isF=(x,y)=>fl(VD.at(x,y));const T=KTINT[tier],tc=new THREE.Color(T[0],T[1],T[2]);
 const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),pv=new THREE.Vector3(),sv=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);EX.fog=[];
 const sets={},CH=8;const put=(name,k,x,y,z,rot,sx,sy,sz,c)=>{const key=name+'|'+((x/CH)|0)+'|'+((z/CH)|0);(sets[key]=sets[key]||{name,list:[],c})['list'].push([k,x,y,z,rot,sx,sy,sz]);};
 const WH=.44;// murs : ~1,45 fois la taille d'un héros (≈ 2,6 m)
 for(let y=0;y<Hd;y++)for(let x=0;x<Wd;x++){const v=VD.map[y*Wd+x];if(!fl(v))continue;const k=y*Wd+x;
  put(pick(KFLOOR[tier],hr(x*3+7,y*5+11,11+tier)),k,x+.5,0,y+.5,((hr(x,y,12)*4)|0)*Math.PI/2,.25,.25,.25,'f');
  [[0,-1,0],[0,1,Math.PI],[-1,0,Math.PI/2],[1,0,-Math.PI/2]].forEach(([dx,dy,r],j)=>{if(isF(x+dx,y+dy))return;
   const cx=x+.5+dx*.625,cz=y+.5+dy*.625;put(pick(KWALL,hr(x,y,20+j)),k,cx,0,cz,r,.25,WH,.25,'w');
   // éboulis au pied des murs (roche photographiée Poly Haven), instanciés avec le sol
   if(K.piece.rock_scatter&&hr(x,y,40+j)<.22&&VD.map[k]===1){const n=1+((hr(x,y,41+j)*2.2)|0);for(let i=0;i<n;i++){const a=hr(x,y,42+j+i*3),b=hr(x,y,43+j+i*3),sc=.22+hr(x,y,44+j+i*3)*.4;
    const ox=x+.5+dx*(.34-sc*.15)+(dy?(a-.5)*.8:0),oz=y+.5+dy*(.34-sc*.15)+(dx?(b-.5)*.8:0);put('rock_scatter',k,ox,-.02,oz,a*TAU,sc,sc*(.7+b*.5),sc,'r');}}});}
 // masse rocheuse : dessus plein au niveau du haut des murs autour des salles (plus de « vide » coloré entre les couloirs)
 {const wp=pieceGeo('wall');let capY=1.7;if(wp){wp.geo.computeBoundingBox();capY=wp.geo.boundingBox.max.y*WH;}
  for(let y=0;y<Hd;y++)for(let x=0;x<Wd;x++){if(fl(VD.map[y*Wd+x]))continue;let best=-1,bd=9;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=Wd||Y>=Hd||!fl(VD.map[Y*Wd+X]))continue;const d=Math.max(Math.abs(dx),Math.abs(dy));if(d<bd){bd=d;best=Y*Wd+X;}}
   if(best>=0)put('__cap',best,x+.5,capY-.01,y+.5,0,1.002,1,1.002,'c');}}
 if(EX.aoT)EX.aoT.dispose();EX.aoT=aoTexture(VD);EX.aoT.userData.keep=0;
 const capG=(()=>{const g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);return g;})();const MC={};for(const key in sets){const S=sets[key],name=S.name,pg=S.c==='c'?(pieceGeo('wall')?{geo:capG,mat:pieceGeo('wall').mat}:null):S.c==='r'?pieceGeo(name):((S.c==='w'&&name!=='wall_gated')||(S.c==='f'&&/^floor_(tile|dirt)_large$/.test(name)))?wallBox(name):pieceGeo(name);if(!pg)continue;const mk=name+S.c;let m=MC[mk];if(!m){m=MC[mk]=pg.mat.clone();const TF=bioTex(tier,'f'),TW=bioTex(tier,'w');if(S.c==='r'){m.color.copy(tc).lerp(new THREE.Color(1,1,1),.5).multiplyScalar(1.15);}else if(S.c==='c'){const TW=bioTex(tier,'w');m.color.copy(tc).multiplyScalar(.55);grime(m,TW?{cut:1,sc:1.4,amt:.35,sat:.8,dk:.9,base:0,rough:.3,tex:{d:TW.d,n:TW.n,s:.3,b:1.5}}:{cut:1,sc:1.4,amt:.42,sat:.58,dk:.7,base:0,rough:.4});}else if(S.c==='f'){m.color.copy(tc);grime(m,TF?{sc:1.1,amt:.25,sat:.9,dk:1,base:0,rough:.2,ao:EX.aoT,tex:{d:TF.d,n:TF.n,s:FSC[tier],b:1.4}}:{sc:1.1,amt:.5,sat:.6,dk:.86,base:0,rough:.45,ao:EX.aoT});}else{m.color.copy(tc).lerp(new THREE.Color(1,1,1),.35);grime(m,TW?{cut:1,sc:1.4,amt:.25,sat:.9,dk:1,base:.5,rough:.2,tex:{d:TW.d,n:TW.n,s:[.42,.36,.42,.3][tier],b:1.5,wall:1}}:{cut:1,sc:1.4,amt:.42,sat:.58,dk:.86,base:.6,rough:.4});}}
  const im=new THREE.InstancedMesh(pg.geo,m,S.list.length);im.receiveShadow=true;im.castShadow=false;/* murs : pas d'ombre portée (lumière quasi verticale), une passe d'ombre bien plus légère */const ks=new Int32Array(S.list.length);
  S.list.forEach(([k,x,y,z,rot,sx,sy,sz],i)=>{q.setFromAxisAngle(up,rot);m4.compose(pv.set(x,y,z),q,sv.set(sx,sy,sz));im.setMatrixAt(i,m4);im.setColorAt(i,new THREE.Color(0,0,0));ks[i]=k;});
  im.computeBoundingSphere();scW.add(im);EX.fog.push({mesh:im,ks,c:new THREE.Color(1,1,1)});}
 // piliers
 EX.pills=[];for(let y=0;y<Hd;y++)for(let x=0;x<Wd;x++)if(VD.map[y*Wd+x]===3){if((tier===0||tier===3)&&K.piece.statue&&hr(x,y,91)<.45){/* crypte et givre : statue sur socle à la place d'un pilier (case déjà infranchissable) */
   const g=new THREE.Group(),pl=piece('pillar',1);pl.scale.set(.3,.075,.3);g.add(pl);const st=fitH(piece('statue',1),1.25);st.position.y=.3;{const rr=VD.rooms.find(r=>x>=r.x-1&&x<=r.x+r.w&&y>=r.y-1&&y<=r.y+r.h)||VD.rooms[0];st.rotation.y=Math.atan2(rr.cx-x,rr.cy-y)+(hr(x,y,92)-.5)*.4;}g.add(st);
   g.position.set(x+.5,0,y+.5);g.visible=false;g.userData.c=[x,y];g.userData.kind='statue';scW.add(g);EX.pills.push(g);}
  else{const p=piece('pillar',1);p.scale.set(.25,WH,.25);p.position.set(x+.5,0,y+.5);p.visible=false;p.userData.c=[x,y];scW.add(p);EX.pills.push(p);}}
 // bannières et accessoires le long des murs
 EX.kprops=[];const addP=(o,x,y)=>{o.visible=false;o.userData.c=[x|0,y|0];scW.add(o);EX.kprops.push(o);};
 EX.glows=[];const glow=(x,y,h,col,s,op)=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:col,blending:THREE.AdditiveBlending,depthWrite:false,opacity:op}));sp.scale.setScalar(s);sp.position.set(x,h,y);addP(sp,x,y);EX.glows.push(sp);return sp;};
 (VD.furn||[]).forEach((f,i)=>{if(f.k==='table'){const t=piece(hr(i,1)<.5?'table_long_tablecloth_decorated_A':'table_long_decorated_A',1);fitH(t,.62);t.scale.z=1.35;t.scale.x=.9;t.rotation.y=Math.PI/2;/* table de banquet sur ses 3 cases */t.position.set(f.x+.5,0,f.y+.5);addP(t,f.x,f.y);
   [-1,0,1].forEach(d=>[-1,1].forEach(s=>{if(hr(i,d+5,s+7)<.75){const c=fitH(piece('chair',1),.62);c.position.set(f.x+.5+d*.85,0,f.y+.5+s*.72);c.rotation.y=s>0?Math.PI:0;addP(c,f.x+d,f.y+s);}}));
   const cd=fitH(piece('candle_lit',1),.16);cd.position.set(f.x+.5,.46,f.y+.5);addP(cd,f.x,f.y);glow(f.x+.5,f.y+.5,.7,0xffb060,1.6,.55);}
  else if(f.k==='shelf'){const s=hr(i,2)<.5?fitH(piece('shelves',1),1.25):fitObj(piece('shelf_large',1),1.05);s.position.set(f.x+.5,0,f.y+.22);addP(s,f.x,f.y);if(hr(i,3)<.5){const cd=fitH(piece('candle_triple',1),.42);cd.position.set(f.x+.5,0,f.y+.75);addP(cd,f.x,f.y);glow(f.x+.5,f.y+.75,.3,0xffb060,.9,.45);}}
  else{const L=['crates_stacked','barrel_large','keg_decorated','box_large','barrel_small_stack'];const nm=L[(hr(i,4)*L.length)|0],o=fitH(piece(nm,1),PH[nm]||.7);o.position.set(f.x+.5,0,f.y+.5);o.rotation.y=hr(i,5)*TAU;addP(o,f.x,f.y);}});
 initCritters(VD,tier);
 // encadrements de portes : piliers de part et d'autre des ouvertures des salles
 VD.rooms.forEach(r=>{const edges=[[r.y-1,'h',r.x,r.x+r.w,r.y],[r.y+r.h,'h',r.x,r.x+r.w,r.y+r.h],[r.x-1,'v',r.y,r.y+r.h,r.x],[r.x+r.w,'v',r.y,r.y+r.h,r.x+r.w]];
  edges.forEach(([o,dir,a,b,bd])=>{let s=-1;for(let t=a;t<=b;t++){const open=t<b&&(dir==='h'?isF(t,o):isF(o,t));if(open&&s<0)s=t;if(!open&&s>=0){[s,t].forEach(e=>{const p=fitObj(piece('pillar_decorated',1),.95);p.scale.y*=1.85/.95;if(dir==='h')p.position.set(e,0,bd);else p.position.set(bd,0,e);p.rotation.y=dir==='h'?0:Math.PI/2;addP(p,dir==='h'?Math.min(e,Wd-1):bd,dir==='h'?bd:Math.min(e,Hd-1));});s=-1;}}});
  if(r.th2==='tresor'){for(let j=0;j<5;j++){const o=fitH(piece(['coin_stack_large','coin_stack_medium'][j%2],1),.28);const x=r.x+.6+hr(r.x,j,9)*(r.w-1.2),y=r.y+.6+hr(r.y,j,10)*(r.h-1.2);if(!isF(x|0,y|0)||VD.map[(y|0)*Wd+(x|0)]!==1)continue;o.position.set(x,0,y);addP(o,x,y);}glow(r.cx+.5,r.cy+.5,1.2,0xffc040,4.5,.28);}});

 VD.rooms.forEach((r,ri)=>{if(tier===2)return;const cs=[[r.x,r.y,0],[r.x+r.w-1,r.y,1],[r.x+r.w-1,r.y+r.h-1,2],[r.x,r.y+r.h-1,3]];cs.forEach(([x,y,q],j)=>{if(hr(ri,j,77)>.32||!isF(x,y))return;const ox=q===0||q===3?-1:1,oy=q<2?-1:1;if(isF(x+ox,y)||isF(x,y+oy))return;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(.55,.55),new THREE.MeshBasicMaterial({map:cobweb(),transparent:true,depthWrite:false,side:THREE.DoubleSide,opacity:.55}));m.material.userData.keep=0;
  m.position.set(x+.5+ox*.42,1.42,y+.5+oy*.42);m.userData.web=1;m.rotation.y=Math.atan2(ox,oy)+Math.PI;m.rotation.z=(q%2?1:-1)*.2;m.rotateY(Math.PI/4);addP(m,x,y);});});
 VD.rooms.forEach((r,ri)=>{let placed=0;for(let t=0;t<40&&placed<2+((r.w*r.h)>30?1:0)+((r.w*r.h)>56?1:0);t++){const x=(r.x+hr(ri,t,31)*r.w)|0,y=(r.y+hr(ri,t,32)*r.h)|0;if(!isF(x,y)||VD.map[y*Wd+x]===3)continue;
  const dirs=[[0,-1],[0,1],[-1,0],[1,0]].filter(([dx,dy])=>!isF(x+dx,y+dy));if(!dirs.length)continue;const [dx,dy]=dirs[(hr(ri,t,33)*dirs.length)|0];
  if(Math.abs(VD.stairs.x-x)+Math.abs(VD.stairs.y-y)<2||Math.abs(VD.merch.x-x-.5)+Math.abs(VD.merch.y-y-.5)<1.5)continue;
  if(hr(ri,t,34)<.3){const b=piece(KBAN[tier],.4,false);b.rotation.y=Math.atan2(-dx,-dy);b.position.set(x+.5+dx*.47,.5,y+.5+dy*.47);addP(b,x,y);}
  else{const L=KPROP[tier],n=L[(hr(ri,t,35)*L.length)|0];const o=fitH(piece(n,1),PH[n]||.5);{const bb=new THREE.Box3().setFromObject(o),w=Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z);if(w>.56)o.scale.multiplyScalar(.56/w);}o.rotation.y=hr(ri,t,36)*TAU;o.position.set(x+.5+dx*.3,0,y+.5+dy*.3);addP(o,x,y);}placed++;}});
 VD.rooms.forEach((r,ri)=>{const n=tier===1?4:2;let rk=0;for(let t=0;t<n*6&&rk<n;t++){const x=(r.x+hr(ri,t,51)*r.w)|0,y=(r.y+hr(ri,t,52)*r.h)|0;if(!isF(x,y)||VD.map[y*Wd+x]===3)continue;
  const dirs=[[0,-1],[0,1],[-1,0],[1,0]].filter(([dx,dy])=>!isF(x+dx,y+dy));if(dirs.length<(t<n*3?2:1))continue;rk++;const[dx,dy]=dirs.length?dirs[(hr(ri,t,53)*dirs.length)|0]:[0,0];
  if(Math.abs(VD.stairs.x-x)+Math.abs(VD.stairs.y-y)<2||Math.abs(VD.merch.x-x-.5)+Math.abs(VD.merch.y-y-.5)<1.5)continue;
  const L=KROCK[tier],nm=L[(hr(ri,t,54)*L.length)|0],grass=/Grass|Bush/.test(nm);const o=fitObj(tintObj(piece(nm,1,!grass),grass?0x9aa86a:KRT[tier]),grass?.32:.28+hr(ri,t,55)*.3);o.rotation.y=hr(ri,t,56)*TAU;
  o.position.set(x+.5+dx*.33+(hr(ri,t,57)-.5)*.3,0,y+.5+dy*.33+(hr(ri,t,58)-.5)*.3);addP(o,x,y);}});}
function eqOf(h){const arm=h.eq.armure,w=h.eq.arme,ATN=['Tunique','Brigandine','Cotte de mailles',"Plastron d'acier","Armure d'écailles",'Harnois runique'];return{at:arm?Math.max(0,ATN.indexOf(arm.bn)):0,ar:Math.max(arm?arm.rar:0,w?w.rar:0),wr:w?w.rar:0};}
function makeObj(o){const g=new THREE.Group();g.position.set(o.x,0,o.y);
 if(K.ok&&o.t==='brk'){const b=fitH(piece(o.k==='tonneau'?'barrel_large':'barrel_small',1),o.k==='tonneau'?.55:.42);b.rotation.y=(o.x*7.3+o.y*3.1)%TAU;g.add(b);}
 else if(K.ok&&o.t==='chest'){const cp=fitH(piece(o.gold?'chest_gold':'chest',1),.45);g.add(cp);let lid=null;cp.traverse(x=>{if(/_lid$/.test(x.name))lid=x;});
  if(lid&&lid.geometry){lid.geometry.computeBoundingBox();const bb=lid.geometry.boundingBox,hp=new THREE.Vector3((bb.min.x+bb.max.x)/2,bb.min.y,bb.min.z).applyMatrix4(lid.matrix);const pv=new THREE.Group();pv.position.copy(hp);lid.parent.add(pv);lid.position.sub(hp);pv.add(lid);g.userData.lidP=pv;g.userData.gold=o.gold;}if(o.gold){const l=haloS(0xffd070,1.1,.35);l.position.y=.45;g.add(l);}}
 else if(o.t==='brk'){if(o.k==='tonneau'){const b=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.45,10),mat(0x7a4f26));b.position.y=.22;b.castShadow=true;g.add(b);[.08,.36].forEach(y=>{const r=new THREE.Mesh(new THREE.TorusGeometry(.205,.015,4,16),mat(0x2a1a0a,{std:{metalness:.6}}));r.rotation.x=Math.PI/2;r.position.y=y;g.add(r);});}
  else{const b=new THREE.Mesh(new THREE.SphereGeometry(.2,10,8),mat(0xa8683a));b.scale.y=1.25;b.position.y=.24;b.castShadow=true;g.add(b);const n=new THREE.Mesh(new THREE.CylinderGeometry(.08,.11,.12,8),mat(0xa8683a));n.position.y=.52;g.add(n);}}
 else if(o.t==='chest'){const gm=o.gold?mat(0xd8a830,{std:{metalness:.8,roughness:.3}}):mat(0x7a4a22);const b=new THREE.Mesh(new THREE.BoxGeometry(.6,.35,.4),gm);b.position.y=.18;b.castShadow=true;g.add(b);
  const lid=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.6,10,1,false,0,Math.PI),gm);lid.rotation.z=Math.PI/2;lid.position.y=.35;g.add(lid);const lock=new THREE.Mesh(new THREE.BoxGeometry(.08,.1,.03),mat(0xe8dcc4,{std:{metalness:.8}}));lock.position.set(0,.3,.21);g.add(lock);
  if(o.gold){const l=haloS(0xffd070,1.1,.35);l.position.y=.45;g.add(l);}}
 else if(o.t==='shrine'){const c={fureur:0xff4a3a,bastion:0xe8e0d0,vie:0x7fff9a,arcane:0xb47aff}[o.k];if(K.ok){const b=fitH(piece('column',1),.72);g.add(b);}else{const b=new THREE.Mesh(new THREE.CylinderGeometry(.35,.5,.5,6),mat(0x6a6458,{flat:1}));b.position.y=.25;b.castShadow=true;g.add(b);}
  const cr=new THREE.Mesh(new THREE.OctahedronGeometry(.22,0),mat(c,{em:c,ei:2.2,flat:1}));cr.position.y=1.05;cr.scale.y=1.6;g.add(cr);g.userData.cr=cr;const l=haloS(c,1.6,.55);l.position.y=1.1;g.add(l);g.userData.l=l;}
 g.visible=false;scW.add(g);return g;}
let camYaw=0,camTarget=new THREE.Vector3(),camShake=0,camZoom=1;
function setYaw(y){EX.yaw=y;}
function updExplo(VD,dt,t,dirty){if(!EX.floor&&!EX.fog)return;const P=VD.P;
 if(hiQ&&Math.random()<dt*5){const a=Math.random()*6.28,d=.4+Math.random()*2.2;part({x:P.x+Math.cos(a)*d,y:.25+Math.random()*1.3,z:P.y+Math.sin(a)*d,vx:(Math.random()-.5)*.06,vy:(Math.random()-.4)*.04,vz:(Math.random()-.5)*.06,life:5+Math.random()*3,size:.022+Math.random()*.02,col:new THREE.Color(.22,.19,.15),g:0,drag:1,tile:0});}
 camYaw+=(EX.yaw-camYaw)*Math.min(1,dt*6);
 // brouillard de guerre
 if(dirty&&EX.fog){const col=new THREE.Color();for(const F of EX.fog){const ks=F.ks;for(let i=0;i<ks.length;i++){const k=ks[i],b=VD.vis[k]?1:VD.seen[k]?.42:0,T=EX.tint;F.mesh.setColorAt(i,col.setRGB(b*F.c.r*T[k*3],b*F.c.g*T[k*3+1],b*F.c.b*T[k*3+2]));}F.mesh.instanceColor.needsUpdate=true;}}
 if(dirty&&!EX.fog){const col=new THREE.Color(),Wd=VD.W;for(let k=0;k<VD.seen.length;k++){const s=VD.seen[k],v=VD.vis[k];const i=EX.cellIdx[k],j=EX.wallIdx[k];if(i<0&&j<0)continue;const b=v?1:s?.42:0;col.setRGB(b,b,b);if(i>=0)EX.floor.setColorAt(i,col);if(j>=0)EX.walls.setColorAt(j,col);}
  EX.floor.instanceColor.needsUpdate=true;EX.walls.instanceColor.needsUpdate=true;}
 if(dirty){const Wd=VD.W;
  const sv=(x,y)=>VD.seen[(y|0)*Wd+(x|0)],vv=(x,y)=>VD.vis[(y|0)*Wd+(x|0)];
  EX.pills.forEach(p=>p.visible=!!sv(...p.userData.c));if(EX.kprops)EX.kprops.forEach(p=>{p.visible=!!sv(...p.userData.c);if(p.visible&&p.userData.web){const rx=p.position.x-camTarget.x,rz=p.position.z-camTarget.z,al=rx*Math.sin(camYaw)+rz*Math.cos(camYaw);if(al>-.2&&al<4.4&&Math.hypot(rx-Math.sin(camYaw)*al,rz-Math.cos(camYaw)*al)<1.6)p.visible=false;}});EX.props.forEach(p=>p.visible=!!sv(...p.userData.c));EX.torches.forEach(g=>{g.visible=!!(sv(g.userData.c[0],g.userData.c[1])||sv(g.userData.c[0],g.userData.c[1]+1));});
  for(const[o,g]of EX.objs){if(g.userData.openT)continue;g.visible=VD.obj.includes(o)&&!!sv(o.x,o.y);if(!VD.obj.includes(o)&&g.parent){if(g.userData.lidP){g.userData.openT=.001;g.visible=true;}else{scW.remove(g);purgeObj(g);EX.objs.delete(o);}}}
  for(const e of VD.E)if(!EX.packs.has(e))addPackModel(e);
  for(const[e,R]of EX.packs){R.root.visible=VD.E.includes(e)&&!!vv(e.x,e.y);if(!VD.E.includes(e)){scW.remove(R.root);purgeObj(R.root);EX.packs.delete(e);}}}
 // torches les plus proches
 const near=EX.torches.filter(g=>g.visible).map(g=>({g,d:(g.position.x-P.x)**2+(g.position.z-P.y)**2})).sort((a,b)=>a.d-b.d).slice(0,EX.tpool.length);
 EX.tpool.forEach((l,i)=>{const n=near[i];if(!n){l.intensity=0;return;}const fl=flick(t,i);l.position.set(n.g.position.x,n.g.position.y+.35,n.g.position.z+(n.g.userData.l.k==='torch'?.25:0));l.color.setHex(BIO[EX.tier].light);l.intensity=(n.g.userData.l.k==='torch'?5:6.5)*fl;l.distance=n.g.userData.l.k==='torch'?6.5:8;
  if(Math.random()<dt*(n.g.userData.l.k==='torch'?1.2:2.5))smoke({x:n.g.position.x+(Math.random()-.5)*.08,y:n.g.position.y+(n.g.userData.l.k==='torch'?.45:.95),z:n.g.position.z+(n.g.userData.l.k==='torch'?.15:0),vy:.35+Math.random()*.2,vx:(Math.random()-.5)*.08,life:2.2,size:.25,grow:.35,a:.3,col:new THREE.Color(0x1c1814)});
  n.g.userData.f.scale.y=(n.g.userData.l.k==='torch'?(K.ok?.42:.55):.9)*fl;if(Math.random()<.15)part({x:n.g.position.x+(Math.random()-.5)*.1,y:n.g.position.y+.3,z:n.g.position.z,vy:.8+Math.random(),vx:(Math.random()-.5)*.2,life:.8,size:.06,col:new THREE.Color(0xffa040),g:0,tile:5});});
 // groupe
 // groupe : le meneur suit le joueur avec un léger amorti ; les suiveurs marchent sur sa trace, à distance constante
 {const L0=EX.party[0];const lp=L0&&L0.root.userData.vp||{x:P.x,y:P.y};
  const far2=Math.hypot(P.x-lp.x,P.y-lp.y)>2,k=far2?1:Math.min(1,dt*16);if(far2)EX.trail.length=0;const lx=lp.x+(P.x-lp.x)*k,ly=lp.y+(P.y-lp.y)*k;
  const last=EX.trail[EX.trail.length-1];if(!last||Math.hypot(lx-last.x,ly-last.y)>.04){EX.trail.push({x:lx,y:ly});if(EX.trail.length>160)EX.trail.shift();}
  const along=d=>{let rem=d;for(let i=EX.trail.length-1;i>0;i--){const a=EX.trail[i],b=EX.trail[i-1],l=Math.hypot(a.x-b.x,a.y-b.y);if(l>=rem){const f=rem/(l||1);return{x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f};}rem-=l;}return EX.trail[0]||{x:lx,y:ly};};
  EX.party.forEach((R,i)=>{const u=R.root.userData;let p;
   if(i===0)p={x:lx,y:ly};else{const tg=EX.trail.length>1?along(i*.8):{x:lx-(i===1?.5:-.5),y:ly+.5};const c=u.vp||tg;const dx=tg.x-c.x,dy=tg.y-c.y,dd=Math.hypot(dx,dy);
    if(dd>3){p=tg;}else{const v=Math.min(dd*7,5.6)*dt;p=dd>1e-4?{x:c.x+dx/dd*Math.min(dd,v),y:c.y+dy/dd*Math.min(dd,v)}:c;}}
   const prev=u.vp||p,vx=(p.x-prev.x)/Math.max(dt,1e-3),vy=(p.y-prev.y)/Math.max(dt,1e-3),sp=Math.hypot(vx,vy);u.vp={x:p.x,y:p.y};R.root.position.x=p.x;R.root.position.z=p.y;
   if(sp>.35){const a=Math.atan2(vx,vy);R.root.rotation.y+=(((a-R.root.rotation.y+Math.PI*3)%TAU)-Math.PI)*Math.min(1,dt*10);}
   R.spdS=(R.spdS||0)+(Math.min(sp,6)-(R.spdS||0))*Math.min(1,dt*10);R.walkS=(R.walkS||0)+(Math.min(1,R.spdS/1.2)-(R.walkS||0))*Math.min(1,dt*9);
   anim(R,dt,t,{walk:R.walkS,phase:i,spd:R.spdS});});}
 for(const[e,R]of EX.packs){R.root.position.x=e.x;R.root.position.z=e.y;const a=Math.atan2(P.x-e.x,P.y-e.y);if(e.aggro)R.root.rotation.y=a;const pv=R.root.userData.prev||{x:e.x,y:e.y},esp=Math.hypot(e.x-pv.x,e.y-pv.y)/Math.max(dt,1e-3);R.root.userData.prev={x:e.x,y:e.y};R.spdS=(R.spdS||0)+(esp-(R.spdS||0))*Math.min(1,dt*6);
  if(R.root.visible)anim(R,dt,t,{walk:e.aggro&&!e.boss?Math.min(1,R.spdS/.4):0,phase:e.ph||0,spd:R.spdS});}
 anim(EX.merch,dt,t,{walk:0});EX.merch.root.rotation.y=Math.atan2(P.x-VD.merch.x,P.y-VD.merch.y);
 for(const[o,g]of EX.objs)if(g.userData.openT){const u=g.userData;u.openT+=dt;const p=Math.min(1,u.openT/.5),e=1+2.7*Math.pow(p-1,3)+1.7*Math.pow(p-1,2);u.lidP.rotation.x=-1.9*e;
  if(u.openT<.9&&Math.random()<.6)part({x:g.position.x+(Math.random()-.5)*.2,y:.35,z:g.position.z+(Math.random()-.5)*.15,vy:1.2+Math.random()*1.2,vx:(Math.random()-.5)*.4,vz:(Math.random()-.5)*.4,life:.9,size:.09,tile:14,vr:3,col:new THREE.Color(u.gold?0xffd84a:0xfff0b0),g:-1});
  if(u.openT>2.6){const s=Math.max(0,1-(u.openT-2.6)*2);g.scale.setScalar(s);if(s<=0){scW.remove(g);purgeObj(g);EX.objs.delete(o);}}}
 for(const[o,g]of EX.objs)if(g.userData.cr){g.userData.cr.rotation.y+=dt;g.userData.cr.position.y=1.05+Math.sin(t*2)*.08;if(o.used){g.userData.cr.material=mat(0x444444);g.userData.l.visible=false;}}
 EX.stairRing.material.emissive.setHex(VD.bossAlive?0xff2010:0xffc060);EX.stairRing.material.emissiveIntensity=1.2+Math.sin(t*3)*.5;
 // caméra plongeante
 const tx=P.x,tz=P.y;camTarget.x+=(tx-camTarget.x)*Math.min(1,dt*6);camTarget.z+=(tz-camTarget.z)*Math.min(1,dt*6);camTarget.y=.6;
 const asp=W/H,far=(asp<.8?1.25:1)*(K.ok?.64:1),dist=7.4*far/camZoom,hgt=10.5*far*(K.ok?.82:1)/camZoom;cam.position.set(camTarget.x+Math.sin(camYaw)*dist,camTarget.y+hgt,camTarget.z+Math.cos(camYaw)*dist);
 if(camShake>0){camShake-=dt;cam.position.x+=(Math.random()-.5)*camShake*.6;cam.position.y+=(Math.random()-.5)*camShake*.6;}cam.lookAt(camTarget);CUT.p.value.copy(camTarget);CUT.d.value.set(Math.sin(camYaw),Math.cos(camYaw),1.55);cam.fov=W/H<.8?50:42;if(cam.view&&cam.view.enabled)cam.clearViewOffset();cam.aspect=W/H;cam.updateProjectionMatrix();
 if(EX.fogP){EX.fogP.position.x=camTarget.x;EX.fogP.position.z=camTarget.z;EX.fogP.material.uniforms.t.value=t;EX.fogP.material.uniforms.ctr.value.set(camTarget.x,camTarget.z);}
 EX.lavas.forEach(l=>l.material.uniforms.t.value=t);if(K.ok)updCritters(VD,dt,t);
 if(K.ok&&Math.random()<dt*7){const a=Math.random()*TAU,r=.5+Math.random()*2.5;part({x:P.x+Math.cos(a)*r,y:.3+Math.random()*1.2,z:P.y+Math.sin(a)*r,vx:(Math.random()-.5)*.08,vy:.03+Math.random()*.05,vz:(Math.random()-.5)*.08,life:3,size:.035,drag:1,col:new THREE.Color(BIO[EX.tier].light).multiplyScalar(.45),g:0});}
 EX.key.position.set(P.x-1.5,5.5,P.y+1.5);EX.key.target.position.set(P.x,0,P.y);EX.lan.position.set(P.x,1.3,P.y);EX.lan.intensity=3.2*(.95+.05*Math.sin(t*9));
 updSmoke(dt);updParticles(dt);}
function rotIn(mx,my){const c=Math.cos(camYaw),s=Math.sin(camYaw);return{mx:mx*c+my*s,my:-mx*s+my*c};}

/* ===================== ÉCRAN TITRE 3D ===================== */
const TT={};let scT=null;
function buildTitle(){if(!K.ok)return false;scT=new THREE.Scene();const B=BIO[0];scT.fog=new THREE.FogExp2(0x07050a,.06);scT.background=new THREE.Color(0x050307);
 scT.add(new THREE.HemisphereLight(0x3a3450,0x050405,.5));
 const tc=new THREE.Color(.5,.48,.55);const pg=pieceGeo('floor_tile_large');if(pg){const m=grime(pg.mat.clone(),{sc:1.1,amt:.5,sat:.6,dk:.86});m.color.copy(tc);const n=[];for(let j=-5;j<4;j++)for(let i=-5;i<5;i++)n.push([i*2+1,j*2+1]);const im=new THREE.InstancedMesh(pg.geo,m,n.length);const m4=new THREE.Matrix4(),q=new THREE.Quaternion();
  n.forEach(([x,z],k)=>{q.setFromAxisAngle(new THREE.Vector3(0,1,0),(hr(x,z,3)*4|0)*Math.PI/2);m4.compose(new THREE.Vector3(x,0,z),q,new THREE.Vector3(.5,.5,.5));im.setMatrixAt(k,m4);});im.receiveShadow=true;scT.add(im);}
 for(let i=0;i<11;i++){const a=Math.PI*1.12+i/10*Math.PI*.76,R0=8.5,w=piece(i===5?'wall_doorway':pick(KWALL,hr(i,9,1)),1);w.scale.set(.55,1.1,.55);w.position.set(Math.cos(a)*R0,0,Math.sin(a)*R0);w.rotation.y=-a-Math.PI/2;scT.add(w);
  if(i%3===1){const b=piece(KBAN[0],.55,false);b.position.set(Math.cos(a)*(R0-.35),2.1,Math.sin(a)*(R0-.35));b.rotation.y=-a-Math.PI/2;scT.add(b);}}
 [[-4.2,-3.5],[4.4,-3.2],[-6,1],[6.2,1.4]].forEach(([x,z],i)=>{const p=piece(i<2?'pillar_decorated':'pillar',1);p.scale.set(.5,1.1,.5);p.position.set(x,0,z);scT.add(p);});
 [['barrel_large',-3,1.8,.35],['crates_stacked',3.4,2.2,.4],['candle_triple',-1.9,2.6,.6],['sword_shield',2.2,-1.2,.45]].forEach(([n,x,z,s])=>{const o=piece(n,s);o.position.set(x,0,z);o.rotation.y=hr(x|0,z|0)*6;scT.add(o);});
 // feu de camp
 const fire=new THREE.Group();for(let i=0;i<9;i++){const a=i/9*TAU;const r=fitObj(tintObj(piece(['Rock_2_A','Rock_1_E','Rock_2_C'][i%3],1),0x8a8494),.32);r.position.set(Math.cos(a)*.55,0,Math.sin(a)*.55);r.rotation.y=a;fire.add(r);}
 for(let i=0;i<4;i++){const l=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,.8,6),mat(0x4a2e18));l.rotation.z=Math.PI/2;l.rotation.y=i*Math.PI/4;l.position.y=.08;fire.add(l);}
 const FTX=elTex('flame')||glowTex();TT.fl=[0,1,2].map(i=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:FTX,color:i?0xff7a20:0xffd070,blending:THREE.AdditiveBlending,depthWrite:false}));s.position.set((i-1)*.12,.45,0);fire.add(s);return s;});
 const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:0xff8a30,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.6}));halo.scale.setScalar(3);halo.position.y=.5;fire.add(halo);
 scT.add(fire);TT.light=new THREE.PointLight(0xff9a40,16,14,1.3);TT.light.position.set(0,1,0);TT.light.castShadow=qLvl>=1;TT.light.shadow.mapSize.set(qLvl>=2?512:256,qLvl>=2?512:256);scT.add(TT.light);
 // héros autour du feu
 TT.heroes=[['guerrier',-1.25,.35,.95],['mage',1.3,.45,-.95],['rodeuse',.15,1.45,-2.95]].map(([c,x,z,ry])=>{const R=heroM(c,{});R.root.position.set(x,0,z);R.root.rotation.y=ry;scT.add(R.root);return R;});
 // le dragon dans l'ombre
 TT.dragon=monM('boss',{el:'fire'});TT.dragon.root.position.set(0,0,-6.2);TT.dragon.root.scale.setScalar(1.5);TT.dragon.mats.forEach(m=>{m.color.multiplyScalar(.6);});TT.dragon.root.position.z=-5.2;scT.add(TT.dragon.root);
 const eyeL=new THREE.PointLight(0xff4010,4,6,1.5);eyeL.position.set(0,4.6,-4.6);scT.add(eyeL);TT.eye=eyeL;
 TT.fog=groundFog(24,new THREE.Color(0x2a2030),.28);scT.add(TT.fog);
 [[-2.6,-3,1.3,2.4,.07],[2.8,-2.6,1.1,2.1,.06]].forEach(([x,z,a,b,o])=>scT.add(lightRay(x,z,10,a*.35,b,new THREE.Color(0xa0b0ff),o)));
 TT.key=new THREE.SpotLight(0x9fb0ff,14,22,.5,.6,1.2);TT.key.position.set(-3,9,6);TT.key.target.position.set(0,0,-2);scT.add(TT.key,TT.key.target);
 scT.add(pts);pData.length=0;scT.add(smokeSys());smokeClear();TT.t=0;mode='title';rp.scene=scT;return true;}
function updTitle(dt,t){if(!scT)return;TT.t+=dt;const fl=flick(t,7);TT.light.intensity=16*fl;
 TT.fl.forEach((s,i)=>{const k=fl*(1-i*.18);s.scale.set(.55*k,.85*k+Math.sin(t*9+i)*.08,1);s.position.y=.42+i*.05;});
 if(Math.random()<dt*30)part({x:(Math.random()-.5)*.3,y:.4,z:(Math.random()-.5)*.3,vx:(Math.random()-.5)*.3,vy:1+Math.random()*1.4,vz:(Math.random()-.5)*.3,life:1.6,size:.06,tile:5,vr:4,col:new THREE.Color(0xffa040),g:0,drag:.99});
 if(Math.random()<dt*2.5)smoke({x:(Math.random()-.5)*.2,y:1.1,z:0,vy:.5,vx:.05,life:3.5,size:.5,grow:.6,a:.28,col:new THREE.Color(0x1a1512)});
 TT.heroes.forEach((R,i)=>anim(R,dt,t,{walk:0,phase:i*1.7}));anim(TT.dragon,dt,t,{walk:0,phase:0,charge:Math.sin(t*.5)>.7});TT.eye.intensity=3+2.5*Math.max(0,Math.sin(t*.5));
 TT.fog.material.uniforms.t.value=t;const por=W/H<.8,a=Math.sin(t*.12)*.32,R=por?10.5:8;cam.position.set(Math.sin(a)*R,(por?3.4:2.6)+Math.sin(t*.2)*.15,Math.cos(a)*R+.6);cam.fov=por?56:44;cam.aspect=W/H;if(cam.view&&cam.view.enabled)cam.clearViewOffset();cam.updateProjectionMatrix();cam.lookAt(0,por?4.7:2.4,-2.5);
 updSmoke(dt);updParticles(dt);}
function endTitle(){if(!scT)return;purge(scT);scT=null;}
/* ===================== COMBAT ===================== */
const BT={units:new Map(),fx:[]};
function buildArena(VD,B){mode='battle';needComp=1;CUT.p.value.set(1e5,0,1e5);keepAll();purge(scB);BT.units=new Map();BT.fx=[];const tier=Math.floor((VD.F-1)/4)%4,Bi=BIO[tier];BT.tier=tier;BT.uiS=BT.uiS||0;
 scB.fog=new THREE.FogExp2(Bi.fog,.048);scB.background=new THREE.Color(Bi.fog);
 scB.add(new THREE.HemisphereLight(Bi.amb,0x050405,.6));scB.add(new THREE.AmbientLight(Bi.amb,.3));
 const ft=stoneTex(tier).clone();ft.needsUpdate=true;ft.repeat.set(7,7);const fl=new THREE.Mesh(new THREE.CircleGeometry(9,48),new THREE.MeshStandardMaterial({map:ft,bumpMap:ft,bumpScale:.05,roughness:.85}));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;scB.add(fl);
 if(K.ok){fl.material.color.setRGB(.25,.25,.28);fl.visible=false;/* recouvert par les dalles : inutile de le dessiner */const T=KTINT[tier],tc=new THREE.Color(T[0],T[1],T[2]);const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),cells=[];
  for(let j=-6;j<6;j++)for(let i=-6;i<6;i++){const x=i*1.6+.8,z=j*1.6+.8-.5;if(Math.hypot(x,z+.5)<9.4)cells.push([x,z,i,j]);}
  const byN={};cells.forEach(c=>{const n=pick(KFLOOR[tier],hr(c[2]+40,c[3]+40,11));(byN[n]=byN[n]||[]).push(c);});
  for(const n in byN){const pg=/^floor_(tile|dirt)_large$/.test(n)?wallBox(n):pieceGeo(n);if(!pg)continue;const TFa=bioTex(tier,'f');const m=grime(pg.mat.clone(),TFa?{sc:1.1,amt:.25,sat:.9,dk:1,rough:.2,tex:{d:TFa.d,n:TFa.n,s:FSC[tier],b:1.5}}:{sc:1.1,amt:.5,sat:.6,dk:.86,rough:.45});m.color.copy(tc).multiplyScalar([1.3,.85,1.3,1.2][tier]);const im=new THREE.InstancedMesh(pg.geo,m,byN[n].length);im.receiveShadow=true;
   byN[n].forEach(([x,z,i,j],k)=>{q.setFromAxisAngle(up,((hr(i,j,12)*4)|0)*Math.PI/2);m4.compose(new THREE.Vector3(x,.0,z),q,new THREE.Vector3(.4,.4,.4));im.setMatrixAt(k,m4);});scB.add(im);}}
 const ring=new THREE.Mesh(new THREE.RingGeometry(5.6,5.9,64),new THREE.MeshStandardMaterial({color:0x0c0a08,roughness:1,transparent:true,opacity:.5}));ring.rotation.x=-Math.PI/2;ring.position.y=.01;scB.add(ring);
 // runes au sol
 const rc=document.createElement('canvas');rc.width=rc.height=512;const g=rc.getContext('2d');g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=3;g.beginPath();g.arc(256,256,240,0,TAU);g.stroke();g.beginPath();g.arc(256,256,200,0,TAU);g.stroke();g.font='28px serif';g.fillStyle='#fff';for(let i=0;i<24;i++){const a=i/24*TAU;g.save();g.translate(256+Math.cos(a)*220,256+Math.sin(a)*220);g.rotate(a+Math.PI/2);g.fillText('ᚠᚢᚦᚨᚱᚲᚷᚹ'[i%8],-8,8);g.restore();}
 const rt=new THREE.CanvasTexture(rc);const rm=new THREE.Mesh(new THREE.PlaneGeometry(11.5,11.5),new THREE.MeshBasicMaterial({map:rt,color:0x000000,transparent:true,opacity:.32,depthWrite:false}));rm.rotation.x=-Math.PI/2;rm.position.y=.015;scB.add(rm);BT.runes=rm;
 // piliers et braseros autour
 const wt=brickTex(tier);const pm=(()=>{const TW=bioTex(tier,'w');const m=new THREE.MeshStandardMaterial({map:TW?null:wt,roughness:.85});return TW?grime(m,{sc:1.4,amt:.25,sat:.9,dk:1,base:.6,rough:.2,tex:{d:TW.d,n:TW.n,s:[.42,.36,.42,.3][tier],b:1.5,wall:1}}):m;})();BT.lights=[];
 for(let i=0;i<10;i++){const a=i/10*TAU+Math.PI/10,x=Math.cos(a)*7.6,z=Math.sin(a)*7.6-.5;if(z>3.5)continue;if(K.ok){const p=piece(i%3===1?'pillar_decorated':'pillar',1);p.scale.set(.6,1.25,.6);p.position.set(x,0,z);p.rotation.y=-a-Math.PI/2;scB.add(p);}
  else{const p=new THREE.Mesh(new THREE.CylinderGeometry(.5,.6,6,10),pm);p.position.set(x,3,z);p.castShadow=p.receiveShadow=true;scB.add(p);
  const cap=new THREE.Mesh(new THREE.BoxGeometry(1.4,.3,1.4),pm);cap.position.set(x,6,z);scB.add(cap);}
  if(i%2===0){const br=new THREE.Mesh(new THREE.CylinderGeometry(.35,.18,.4,8),mat(0x3a3028,{std:{metalness:.6}}));br.position.set(x*.86,1.6,z*.86);scB.add(br);const f=new THREE.Sprite(new THREE.SpriteMaterial({map:elTex('flame')||glowTex(),color:Bi.light,blending:THREE.AdditiveBlending,depthWrite:false}));f.scale.set(.9,1.2,1);{const hs=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:Bi.light,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.5}));hs.scale.setScalar(1.8);hs.position.set(x*.86,2.0,z*.86);scB.add(hs);}f.position.set(x*.86,2.05,z*.86);scB.add(f);
   let l=null;if(i===0||i===4||i===8){l=new THREE.PointLight(Bi.light,13,13,2);l.position.set(x*.86,2.3,z*.86);scB.add(l);}BT.lights.push({l,f,x:x*.86,z:z*.86});}}
 // mur du fond
 const bw=new THREE.Mesh(new THREE.CylinderGeometry(10,10,8,48,1,true,Math.PI*1.1,Math.PI*.8),(()=>{const TW=bioTex(tier,'w');if(!TW)return new THREE.MeshStandardMaterial({map:(()=>{const t=wt.clone();t.needsUpdate=true;t.repeat.set(8,3);return t;})(),side:THREE.BackSide,roughness:.9});const m=new THREE.MeshStandardMaterial({side:THREE.BackSide,roughness:.9});return grime(m,{sc:1.4,amt:.25,sat:.9,dk:1,base:.6,rough:.2,tex:{d:TW.d,n:TW.n,s:[.42,.36,.42,.3][tier],b:1.5,wall:1}});})());bw.position.set(0,4,0);if(K.ok){bw.scale.set(1.25,1,1.25);if(!bw.material.userData.grime)bw.material.color.setRGB(.25,.25,.3);else bw.material.color.setRGB(.55,.55,.6);}scB.add(bw);
 if(K.ok){const R0=10.2,n=14;for(let i=0;i<n;i++){const a=Math.PI*1.08+i/(n-1)*Math.PI*.84,x=Math.cos(a)*R0,z=Math.sin(a)*R0-.5;const nm=i===Math.floor(n/2)?'wall_doorway':pick(KWALL,hr(i,3,tier));
   const w=piece(nm,1);if(nm!=='wall_gated'&&nm!=='wall_doorway')w.traverse(m=>{if(m.isMesh){m.geometry.computeBoundingBox();const bb=m.geometry.boundingBox,sz=bb.getSize(new THREE.Vector3()),c=bb.getCenter(new THREE.Vector3());const g=new THREE.BoxGeometry(sz.x,sz.y,sz.z);g.translate(c.x,c.y,c.z);m.geometry=g;}});w.scale.set(.6,1.15,.6);w.position.set(x,0,z);w.rotation.y=-a-Math.PI/2;scB.add(w);
   if(i%3===1){const b=piece(KBAN[tier],.6,false);b.position.set(Math.cos(a)*(R0-.4),2.2,Math.sin(a)*(R0-.4)-.5);b.rotation.y=-a-Math.PI/2;scB.add(b);}
   if(i%3===2){const tm=piece('torch_mounted',.8,false);tm.position.set(Math.cos(a)*(R0-.32),2.3,Math.sin(a)*(R0-.32)-.5);tm.rotation.y=-a-Math.PI/2;scB.add(tm);const f=new THREE.Sprite(new THREE.SpriteMaterial({map:elTex('flame')||glowTex(),color:Bi.light,blending:THREE.AdditiveBlending,depthWrite:false}));f.scale.set(.7,.95,1);f.position.copy(tm.position).add(new THREE.Vector3(-Math.cos(a)*.45,.65,-Math.sin(a)*.45));scB.add(f);}}
  {const RL=KROCK[tier];for(let i=0;i<(tier===1?16:8);i++){const a=Math.PI*.9+hr(i,61,tier)*Math.PI*1.2,r=6.6+hr(i,62,tier)*2.8;const nm=RL[(hr(i,63,tier)*RL.length)|0],grass=/Grass|Bush/.test(nm);const o=fitObj(tintObj(piece(nm,1,!grass),grass?0x9aa86a:KRT[tier]),grass?.7:.8+hr(i,64,tier)*1.1);o.position.set(Math.cos(a)*r,0,Math.sin(a)*r-.5);o.rotation.y=hr(i,65)*TAU;if(o.position.z<3.2)scB.add(o);}}
  const L=KPROP[tier];for(let i=0;i<9;i++){const a=Math.PI*1.05+hr(i,5,tier)*Math.PI*.9,r=7.9+hr(i,6,tier)*1.2;const nm=L[(hr(i,7,tier)*L.length)|0];const o=fitH(piece(nm,1),(PH[nm]||.5)*1.42);o.position.set(Math.cos(a)*r,0,Math.sin(a)*r-.5);o.rotation.y=hr(i,8)*TAU;scB.add(o);}
  if(VD.F%4===0)for(let i=0;i<5;i++){const o=piece(['coin_stack_large','coin_stack_medium','chest_gold'][i%3],i%3===2?.7:.8);o.position.set((hr(i,21)-.5)*9,0,-6+hr(i,22)*1.5);o.rotation.y=hr(i,23)*TAU;scB.add(o);}}
 // décor de biome
 for(let i=0;i<14;i++){const a=hr(i,7,tier)*TAU,r=5+hr(i,8,tier)*2.5,x=Math.cos(a)*r,z=Math.sin(a)*r-1;if(z>3)continue;
  if(tier===1){const cp=new THREE.Mesh(new THREE.SphereGeometry(.25,10,6,0,TAU,0,Math.PI/2),mat(0x3a4a44,{em:0x2a8a7a,ei:.35}));cp.position.set(x,.35,z);const st=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,.4,6),mat(0x8a8a7a));st.position.set(x,.18,z);scB.add(cp,st);}
  else if(tier===3){const c=new THREE.Mesh(new THREE.OctahedronGeometry(.3,0),mat(0x8fa8b8,{em:0x3a6a8a,ei:.25,flat:1}));c.scale.y=2.5;c.position.set(x,.6,z);c.rotation.z=(hr(i,9)-.5)*.6;scB.add(c);}
  else if(tier===2){const c=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.18),new THREE.MeshBasicMaterial({color:0xff6a1a}));c.rotation.x=-Math.PI/2;c.rotation.z=hr(i,9)*3;c.position.set(x,.02,z);scB.add(c);}
  else{const sk=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),mat(0xd8d0b8));sk.position.set(x,.1,z);const b=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.5,5),mat(0xcfc7b0));b.rotation.z=Math.PI/2;b.position.set(x+.2,.04,z+.1);scB.add(sk,b);}}
 if(VD.F%4===0){const c=new THREE.InstancedMesh(new THREE.CylinderGeometry(.06,.06,.02,8),mat(0xf2c14a,{std:{metalness:.9,roughness:.3}}),60),m4=new THREE.Matrix4();for(let i=0;i<60;i++){m4.makeTranslation((hr(i,1)-.5)*10,.01,(hr(i,2)-.5)*6-2.5);c.setMatrixAt(i,m4);}c.frustumCulled=false;scB.add(c);}// trésor du boss : 60 pièces en 1 appel au lieu de 60
 // lumière principale avec ombres + contre-jour
 BT.key=new THREE.SpotLight(0xffe0c0,62,26,.75,.5,1.3);BT.key.position.set(2.5,9,7);BT.key.target.position.set(0,0,-.8);BT.key.castShadow=true;BT.key.shadow.mapSize.set(qLvl>=2?1024:512,qLvl>=2?1024:512);BT.key.shadow.bias=-.0006;scB.add(BT.key,BT.key.target);
 BT.lavas=[];BT.rays=[];scB.add(smokeSys());smokeClear();
 if(K.ok){BT.fogP=groundFog(24,new THREE.Color(Bi.fog).lerp(new THREE.Color(Bi.acc),.35).offsetHSL(0,0,.06),.2);BT.fogP.position.set(0,0,-1);BT.fogP.visible=hiQ;scB.add(BT.fogP);
  [[3.4,-3.4,1.4,2.3,.09],[-3.6,-4.8,1.2,2.0,.08]].forEach(([x,z,r0,r1,op])=>{const ry=lightRay(x,z,11,r0*.35,r1,new THREE.Color(Bi.light).lerp(new THREE.Color(0xffffff),.5),op);ry.rotation.z=x*.03;scB.add(ry);BT.rays.push(ry);});
  if(tier===2)for(let i=0;i<5;i++){const a=hr(i,40)*TAU,r=4.5+hr(i,41)*2.5;const l=lavaDecal(2.4,1.6,i*13);l.position.set(Math.cos(a)*r,.03,Math.sin(a)*r-1);l.rotation.z=hr(i,42)*3;scB.add(l);BT.lavas.push(l);}}
 else BT.fogP=null;
 if(K.ok){const fill=new THREE.PointLight(0xffd8b0,18,11,1.6);fill.position.set(0,3.2,.6);scB.add(fill);}/* contre-jour : lumière ponctuelle lointaine sans atténuation (= directionnelle, mais même famille de shaders que l'exploration) */const rim=new THREE.PointLight(Bi.acc,.9,0,0);rim.position.set(-30,40,-80);scB.add(rim);
 BT.flash=lightPool(scB,1);BT.flash.forEach(l=>{l.decay=1.6;l.distance=8;});
 // décor du pourtour : pas d'ombre projetée (elle tomberait hors de l'arène) ; seuls les personnages en projettent
 scB.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh)o.castShadow=false;});
 // unités
 const foes=B.foes.filter(f=>!f.boss),n=foes.length,back=f=>['ar','py','ch'].includes(f.k);let fr=[],bk=[];
 if(n<=3&&!B.boss){fr=foes.filter(f=>!back(f));bk=foes.filter(back);if(!fr.length){fr=bk;bk=[];}}else{const s=foes.slice().sort((a,b)=>back(a)-back(b));const nf=Math.ceil(n/2);fr=s.slice(0,nf);bk=s.slice(nf);}
 const place=(arr,z,sp)=>arr.forEach((f,i)=>addUnit(f,(i-(arr.length-1)/2)*sp,z));
 if(B.boss){addUnit(B.foes.find(f=>f.boss),0,-3.6);place(foes,-1.2,1.6);}else{place(fr,-1.3,Math.min(1.9,7/fr.length));place(bk,-3.5,Math.min(2.1,7.5/Math.max(1,bk.length)));if(bk.length&&fr.length&&bk.length===fr.length){bk.forEach(f=>{const R=BT.units.get(f);if(R){R.home.x+=.85;R.root.position.x=R.home.x;}});}}
 [['mage',-2.2,3.1],['guerrier',0,2.4],['rodeuse',2.2,3.1]].forEach(([c,x,z])=>addUnit(VD.P.heroes.find(h=>h.cls===c),x,z));
 scB.add(pts);pData.length=0;padPL(scB);rp.scene=scB;BT.camT=0;BT.intro=1;BT.vic=null;BT.focus=null;BT.cine=B.boss?{t:0}:null;}
function addUnit(u,x,z){const R=u.side==='h'?heroM(u.cls,eqOf(u)):monM(u.boss?'boss':u.k,{el:u.el});if(u.elite)R.root.scale.multiplyScalar(1.15);
 R.root.position.set(x,0,z);R.root.rotation.y=u.side==='h'?Math.PI:0;R.home={x,z};R.st={walk:0,act:null,p:0,hit:0,dead:0,phase:Math.random()*5};R.off=new THREE.Vector3();
 if(u.elite){const ring=new THREE.Mesh(new THREE.RingGeometry(.5,.62,28),new THREE.MeshBasicMaterial({color:{rapide:0x7fe0ff,blinde:0xd0d0d0,vampire:0xff3a5a,ardent:0xff8a2a}[u.mods[0]],transparent:true,opacity:.9,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.03;R.root.add(ring);R.eRing=ring;}
 const sel=new THREE.Mesh(new THREE.RingGeometry(.48,.58,32),new THREE.MeshBasicMaterial({color:0xf0c46a,transparent:true,opacity:0,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false}));sel.rotation.x=-Math.PI/2;sel.position.y=.04;if(u.boss)sel.scale.setScalar(3);R.root.add(sel);R.sel=sel;
 scB.add(R.root);BT.units.set(u,R);if(R.gl&&u.side==='e'&&R.set.spawn)playG(R,'spawn',1);return R;}
function unitOf(u){let R=BT.units.get(u);if(!R&&u&&u.side==='e'){const B=window.VD.B;const n=[...BT.units.keys()].filter(x=>x.side==='e'&&!x.boss).length;R=addUnit(u,(n%2?1:-1)*(2.6+(n>>1)%2*1.3),-2.2+((n>>2)%2)*-1.2);}return R;}
const v3=new THREE.Vector3();
function worldPos(u,h=.9){const R=BT.units.get(u);if(!R)return new THREE.Vector3();const s=R.root.scale.y;return new THREE.Vector3(R.root.position.x,(u.boss?2.2:h)*s,R.root.position.z);}
function project(p){v3.copy(p).project(cam);return{x:(v3.x*.5+.5)*W,y:(-v3.y*.5+.5)*H,z:v3.z};}
function screenOf(u){const R=BT.units.get(u);if(!R)return null;const s=R.root.scale.y,foot=R.root.position.clone();foot.y=0;const f=project(foot),top=project(new THREE.Vector3(foot.x,(u.boss?(K.ok?3.9:3.4):1.7)*s,foot.z));const px=Math.abs(f.y-top.y);return{x:f.x,y:f.y,s:px/1.7,top:top.y};}
function hitTest(x,y){let best=null,bd=1e9;for(const[u,R]of BT.units){const sc=screenOf(u);if(!sc)continue;const cy=(sc.y+sc.top)/2,r=Math.max(30,(sc.y-sc.top)*.55);const d=Math.hypot(x-sc.x,y-cy);if(d<r&&d<bd){bd=d;best=u;}}return best;}
/* animations de combat */
function act(u,kind,tgt,dur=.42){const R=BT.units.get(u);if(!R)return;R.st.act=kind;R.st.p=0;R.actDur=dur;
 if(tgt&&['atk','slam','bite','spin','jump'].includes(kind)){const T=BT.units.get(tgt);if(T){const dx=T.root.position.x-R.home.x,dz=T.root.position.z-R.home.z,l=Math.hypot(dx,dz)||1,k=Math.max(0,l-(u.boss?2.2:tgt.boss?2.6:1.05));R.lunge={x:dx/l*k,z:dz/l*k};}}else R.lunge=null;}
function hit(u,src,crit){const R=BT.units.get(u);if(!R)return;R.st.hit=crit?1:.7;const S=BT.units.get(src);if(S){const dx=R.root.position.x-S.root.position.x,dz=R.root.position.z-S.root.position.z,l=Math.hypot(dx,dz)||1,k=(crit?.45:.22)*(u.boss?.3:1);R.kb={x:dx/l*k,z:dz/l*k,t:0};}
 R.flash=.2;}
function die(u){const R=BT.units.get(u);if(!R)return;R.dying=0;R.st.fallDir=Math.random()<.5?-1:1;}
function revive(u){const R=BT.units.get(u);if(!R)return;R.dying=null;R.st.dead=0;}
function updBattle(VD,dt,t){const B=VD.B;if(!B)return;
 for(const[u,R]of BT.units){const st=R.st;if(st.act){st.p+=dt/R.actDur;if(st.p>=1){st.act=null;st.p=0;}}
  let ox=0,oz=0;if(R.lunge&&st.act){const p=st.p;const q=p<.3?-.18*Math.sin(p/.3*Math.PI/2):p<.5?-.18+1.18*(1-Math.pow(1-(p-.3)/.2,3)):p<.65?1:1-((p-.65)/.35)**2*(3-2*(p-.65)/.35);ox=R.lunge.x*q;oz=R.lunge.z*q;}
  if(R.kb){R.kb.t+=dt;const f=Math.max(0,1-R.kb.t/.35)*Math.sin(Math.min(1,R.kb.t*8)*Math.PI/2);ox+=R.kb.x*f;oz+=R.kb.z*f;if(R.kb.t>.35)R.kb=null;}
  st.hit=Math.max(0,st.hit-dt*3);R.root.position.x=R.home.x+ox;R.root.position.z=R.home.z+oz;
  if(R.dying!=null){R.dying=Math.min(1,R.dying+dt*1.6);st.dead=R.dying*R.dying;}else if(u.dead&&u.side==='h'){st.dead=1;}
  st.charge=!!u.charge;st.walk=0;anim(R,dt,t,st);
  if(R.flash>0){R.flash-=dt;}R.root.traverse(o=>{if(o.isMesh&&o.material&&o.material.emissive&&!o.userData.keepE){if(o.userData.e0===undefined)o.userData.e0=o.material.emissiveIntensity;}});
  const isCur=B.cur===u&&!B.over;R.sel.material.opacity=isCur?.75+.25*Math.sin(t*6):R.selTarget?.55+.4*Math.sin(t*8):0;R.sel.material.color.setHex(R.selTarget?0x7fff8a:u.side==='h'?0xf0c46a:0xff5a3a);
  if(R.eRing)R.eRing.rotation.z+=dt;
  if(st.charge&&Math.random()<.5){const p=worldPos(u,.8);part({x:p.x+(Math.random()-.5)*.8,y:p.y*.3,z:p.z+(Math.random()-.5)*.8,vy:1.5+Math.random(),life:.7,size:.14,tile:6,vr:4,col:new THREE.Color(u.boss?{fire:0xff8a2a,ice:0x9fe0ff,poison:0x9cff5a,arcane:0xd77aff}[u.el]:0xff7a2a),g:0});}
  if(u.st&&u.st.burn>0&&Math.random()<.3){const p=worldPos(u,.6);part({x:p.x+(Math.random()-.5)*.4,y:p.y,z:p.z,vy:1.2,life:.5,size:.12,tile:1,col:new THREE.Color(0xff7a2a),g:0});}
  if(u.st&&u.st.poison>0&&Math.random()<.25){const p=worldPos(u,.6);part({x:p.x+(Math.random()-.5)*.4,y:p.y,z:p.z,vy:.7,life:.7,size:.14,tile:8,vr:1,col:new THREE.Color(0x7aff5a),g:0});}
  if(u.st&&u.st.gel>0&&Math.random()<.2){const p=worldPos(u,.8);part({x:p.x+(Math.random()-.5)*.5,y:p.y,z:p.z,vy:.2,life:.8,size:.09,tile:14,vr:2,col:new THREE.Color(0xbfe8ff),g:0});}}
 if(BT.fogP)BT.fogP.material.uniforms.t.value=t;BT.lavas.forEach(l=>l.material.uniforms.t.value=t);BT.rays.forEach((r,i)=>{r.material.opacity=r.userData.op*(.8+.2*Math.sin(t*.7+i*2));});
 if(BT.tier===3&&Math.random()<dt*6)part({x:(Math.random()-.5)*12,y:3+Math.random()*2,z:(Math.random()-.5)*8-1,vx:(Math.random()-.5)*.2,vy:-.35,life:4,size:.06,drag:1,tile:14,vr:.5,col:new THREE.Color(0xcfe8ff).multiplyScalar(.7),g:0});
 BT.lights.forEach((L,i)=>{if(Math.random()<dt*2.2)smoke({x:L.x,y:2.4,z:L.z,vy:.5+Math.random()*.3,vx:(Math.random()-.5)*.1,life:2.6,size:.45,grow:.5,a:.32,col:new THREE.Color(0x1a1612)});const f=flick(t,i+20);if(L.l)L.l.intensity=13*f;L.f.scale.set(.9*f,1.2*f,1);if(Math.random()<.3)part({x:L.x+(Math.random()-.5)*.2,y:2.1,z:L.z,vy:1+Math.random(),life:.7,size:.07,col:new THREE.Color(BIO[BT.tier].light),g:0});});
 
 BT.flash.forEach(l=>{l.intensity=Math.max(0,l.intensity-dt*l.userData.dec);});updSmoke(dt);
 // effets
 BT.fx=BT.fx.filter(f=>{f.t+=dt;const p=Math.min(1,f.t/f.d);f.upd(p,dt);if(p>=1){if(f.obj){scB.remove(f.obj);purgeObj(f.obj);}if(f.end)f.end();return false;}return true;});
 // caméra de combat
 BT.camT+=dt;const intro=Math.max(0,1-BT.camT/1.2),e=intro*intro,por=W/H<.8?1.3:1;cam.fov=W/H<.8?52:42;
 BT.uiS+=(Math.min(H*.45,BT.uiB||0)-BT.uiS)*Math.min(1,dt*4);const hv=H-BT.uiS*.85,kz=Math.pow(hv/H,.75);cam.aspect=W/hv;cam.setViewOffset(W,hv,0,0,W,H);cam.updateProjectionMatrix();const base=new THREE.Vector3(0,(6.6+e*4)*por*kz,(9.2+e*4)*por*kz),look=new THREE.Vector3(0,.6,-.8);
 const zz=BT.zoom||{z:1,x:0,y:1,zz:0};cam.position.copy(base).lerp(new THREE.Vector3(zz.x,zz.y+3.5,zz.zz+6),Math.min(.6,(zz.z-1)*4));const lk=look.clone().lerp(new THREE.Vector3(zz.x,zz.y,zz.zz),Math.min(.6,(zz.z-1)*4));
 cam.position.x+=Math.sin(t*.25)*.35;
 // cinématiques : entrée du dragon, focus sur grosses attaques, victoire
 const sm=x=>x*x*(3-2*x),L3=(a,b,k)=>a.clone().lerp(b,k);
 if(BT.cine){BT.cine.t+=dt;const c=BT.cine,T=c.t;const head=K.g.hx_dragon?new THREE.Vector3(0,1.1,-1.9):new THREE.Vector3(0,3.4,-3.4);let P,Lk,w;
  if(T<1.4){const k=sm(T/1.4);P=L3(new THREE.Vector3(-1.9,.8,1.6),new THREE.Vector3(1.3,1.7,1.9),k);Lk=L3(new THREE.Vector3(0,1.4,-3.2),head,k);w=1;}
  else if(T<2.6){const k=sm((T-1.4)/1.2);P=L3(new THREE.Vector3(1.2,1.8,1.8),new THREE.Vector3(3.2,3.4,4.2),k);Lk=L3(head,new THREE.Vector3(0,2.2,-2),k);w=1;}
  else{const k=sm(Math.min(1,(T-2.6)/.8));P=new THREE.Vector3(3.2,3.4,4.2);Lk=new THREE.Vector3(0,2.2,-2);w=1-k;if(T>3.4)BT.cine=null;}
  if(!c.roar&&T>.5){c.roar=1;camShake=Math.max(camShake,.5);}
  cam.position.lerp(P,w);lk.lerp(Lk,w);}
 if(BT.focus){const f=BT.focus;f.t+=dt;const q=f.t/f.d,w=q<.25?sm(q/.25):q>.75?sm((1-q)/.25):1;if(q>=1)BT.focus=null;else{cam.position.lerp(new THREE.Vector3(f.p.x+f.side*2.6,f.p.y+2.2,f.p.z+3.6),w*.75);lk.lerp(f.p,w*.75);}}
 if(BT.vic){BT.vic.t+=dt;const w=sm(Math.min(1,BT.vic.t/1.3));const por2=W/H<.8;cam.position.lerp(new THREE.Vector3(Math.sin(BT.vic.t*.3)*1.4,2.1,por2?-4.2:-2.6),w);cam.position.y+=Math.sin(w*Math.PI)*3.2;lk.lerp(new THREE.Vector3(0,1.0,2.7),w);}
 if(camShake>0){camShake-=dt;cam.position.x+=(Math.random()-.5)*camShake;cam.position.y+=(Math.random()-.5)*camShake;}cam.lookAt(lk);
 updParticles(dt);}
function focus(u,d=1.2,side=1){const p=u?worldPos(u,u.boss?1.6:.8):new THREE.Vector3(0,.8,-2);BT.focus={p,t:0,d,side};}
function victory(VD){BT.vic={t:0};VD.P.heroes.forEach(h=>{const R=BT.units.get(h);if(R&&R.gl&&!h.dead){playG(R,'raise',1.2);}});}
function flashLight(p,col,int=8,dec=16){const l=BT.flash.find(l=>l.intensity<.5)||BT.flash[0];l.position.copy(p);l.position.y+=.5;l.color.set(col);l.intensity=int;l.userData.dec=dec;}
function fxAdd(o){BT.fx.push(Object.assign({t:0},o));}
/* effets prêts à l'emploi */
const FX={
 projectile(src,tgt,col,d=.3,kind='orb',onHit){const a=worldPos(src,src.side==='h'?1.1:1),b=worldPos(tgt,.9);let obj;
  if(kind==='arrow'){obj=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.7,5),new THREE.MeshBasicMaterial({color:0xfff0d0}));}else{obj=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8),new THREE.MeshBasicMaterial({color:col}));const g=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:col,blending:THREE.AdditiveBlending,depthWrite:false}));g.scale.setScalar(1.1);obj.add(g);}
  scB.add(obj);const c=new THREE.Color(col);fxAdd({obj,d,upd:(p)=>{obj.position.lerpVectors(a,b,p);obj.position.y+=Math.sin(p*Math.PI)*(kind==='arrow'?.6:.4);if(kind==='arrow'){obj.lookAt(b);obj.rotateX(Math.PI/2);}else for(let i=0;i<3;i++)part({x:obj.position.x,y:obj.position.y,z:obj.position.z,vx:(Math.random()-.5)*.6,vy:(Math.random()-.5)*.6,vz:(Math.random()-.5)*.6,life:.35,size:.2,col:c,g:0,tile:c.r>.9&&c.g<.7?11:c.b>.9&&c.r<.8?14:c.g>.9&&c.r<.8?2:12,vr:5});},end:onHit});},
 explode(u,col,big=1){const p=worldPos(u,.8);burst(p,col,Math.round(40*big),5*big);burst(p,col,Math.round(10*big),2*big,{tile:2,size:.5*big,life:.6,g:0});for(let i=0;i<Math.round(5*big);i++)smoke({x:p.x+(Math.random()-.5)*.6*big,y:p.y*.7,z:p.z+(Math.random()-.5)*.6*big,vx:(Math.random()-.5)*.8,vy:.5+Math.random()*.6,vz:(Math.random()-.5)*.8,life:1.6+Math.random(),size:.6*big,grow:.9*big,a:.38,col:new THREE.Color(0x25201c)});flashLight(p,col,10*big,14);this.ring(u,col,.3,1.6*big,.5);},
 ring(u,col,r0,r1,d,y=.05){const p=worldPos(u);const m=new THREE.Mesh(new THREE.RingGeometry(.85,1,48),new THREE.MeshBasicMaterial({color:col,transparent:true,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(p.x,y,p.z);scB.add(m);
  fxAdd({obj:m,d,upd:p2=>{const r=r0+(r1-r0)*(1-Math.pow(1-p2,2));m.scale.setScalar(r);m.material.opacity=(1-p2)*.35;}});},
 groundRing(x,z,col,r0,r1,d){const m=new THREE.Mesh(new THREE.RingGeometry(.85,1,48),new THREE.MeshBasicMaterial({color:col,transparent:true,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.05,z);scB.add(m);fxAdd({obj:m,d,upd:p=>{m.scale.setScalar(r0+(r1-r0)*(1-Math.pow(1-p,2)));m.material.opacity=1-p;}});},
 slash(u,col=0xfff0d0,big=1){const p=worldPos(u,.9);const g=new THREE.TorusGeometry(.7*big,.05*big,4,24,2.2);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:col,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));m.position.copy(p);m.lookAt(cam.position);m.rotateZ(-.9+Math.random()*.4);scB.add(m);
  fxAdd({obj:m,d:.32,upd:q=>{m.material.opacity=1-q;m.scale.setScalar(.8+q*.4);m.rotateZ(.06);}});burst(p,col,10,2.5);},
 pillar(u,col,d=.9){const p=worldPos(u);const m=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,4,24,1,true),new THREE.MeshBasicMaterial({color:col,transparent:true,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false}));m.position.set(p.x,2,p.z);scB.add(m);
  fxAdd({obj:m,d,upd:q=>{m.material.opacity=Math.sin(q*Math.PI)*.55;m.scale.set(1-q*.3,1,1-q*.3);if(Math.random()<.8)part({x:p.x+(Math.random()-.5)*.8,y:Math.random()*.5,z:p.z+(Math.random()-.5)*.8,vy:2+Math.random()*2,life:.8,size:.12,col:new THREE.Color(col),g:0});}});flashLight(p,col,5,6);},
 bubble(u,col,d=1){const p=worldPos(u,.9);const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.9,1),new THREE.MeshBasicMaterial({color:col,wireframe:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));m.position.copy(p);scB.add(m);
  fxAdd({obj:m,d,upd:q=>{m.material.opacity=Math.sin(q*Math.PI)*.8;m.scale.setScalar(.6+.4*Math.min(1,q*3));m.rotation.y+=.03;}});},
 dome(d=1.1){const m=new THREE.Mesh(new THREE.SphereGeometry(3.6,32,16,0,TAU,0,Math.PI/2),new THREE.MeshBasicMaterial({color:0xf0c46a,transparent:true,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false,wireframe:false}));m.position.set(0,0,2.8);m.scale.y=.5;scB.add(m);
  fxAdd({obj:m,d,upd:q=>{m.material.opacity=Math.sin(q*Math.PI)*.22;}});this.groundRingAt(0,2.8,0xf0c46a,.5,3.6,.8);},
 groundRingAt(x,z,col,r0,r1,d){this.groundRing(x,z,col,r0,r1,d);},
 reticle(u){const p=worldPos(u);const m=new THREE.Mesh(new THREE.RingGeometry(.6,.72,4,1),new THREE.MeshBasicMaterial({color:0xff3a2a,transparent:true,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(p.x,.06,p.z);scB.add(m);
  fxAdd({obj:m,d:1,upd:q=>{m.material.opacity=Math.sin(q*Math.PI);m.rotation.z+=.04;m.scale.setScalar(1.6-q*.5);}});},
 meteor(u,onHit){const b=worldPos(u,.2),a=b.clone().add(new THREE.Vector3(-3,9,-2));const m=new THREE.Mesh(new THREE.DodecahedronGeometry(.3,0),new THREE.MeshBasicMaterial({color:0xffb040}));const g=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:0xff7a20,blending:THREE.AdditiveBlending,depthWrite:false}));g.scale.setScalar(2);m.add(g);scB.add(m);
  fxAdd({obj:m,d:.5,upd:q=>{m.position.lerpVectors(a,b,q*q);for(let i=0;i<4;i++)part({x:m.position.x,y:m.position.y,z:m.position.z,vx:(Math.random()-.5),vy:(Math.random()-.5),vz:(Math.random()-.5),life:.5,size:.3,col:new THREE.Color(0xff8a2a),g:0});},end:()=>{this.explode(u,0xff8a2a,1.3);shake(.5);if(onHit)onHit();}});},
 breath(u,col,d=.9){const a=worldPos(u,.0),R=BT.units.get(u);const head=new THREE.Vector3();if(R&&R.mouth)R.mouth.getWorldPosition(head);else head.copy(a).setY(2.5);const c=new THREE.Color(col);
  fxAdd({d,upd:q=>{for(let i=0;i<14;i++){const tx=(Math.random()-.5)*6,tz=3+Math.random()*.6;const s=6+Math.random()*4;const dx=tx-head.x,dy=1-head.y,dz=tz-head.z,l=Math.hypot(dx,dy,dz);part({x:head.x,y:head.y,z:head.z,vx:dx/l*s,vy:dy/l*s,vz:dz/l*s,life:.55,size:.35+Math.random()*.3,col:c,g:0,drag:.99});}
   if(Math.random()<.3)flashLight(new THREE.Vector3((Math.random()-.5)*4,.5,2.8),col,8,10);}});},
 shards(u){const p=worldPos(u,.9);burst(p,0xbfe8ff,30,4);for(let i=0;i<8;i++){const m=new THREE.Mesh(new THREE.OctahedronGeometry(.12,0),new THREE.MeshBasicMaterial({color:0xdff4ff,transparent:true}));m.scale.y=3;m.position.copy(p);const dir=new THREE.Vector3(Math.random()-.5,Math.random()*.6,Math.random()-.5).normalize();scB.add(m);
  fxAdd({obj:m,d:.5,upd:q=>{m.position.copy(p).addScaledVector(dir,q*1.4);m.lookAt(p);m.material.opacity=1-q;}});}flashLight(p,0x9fe0ff,6,10);},
 portal(u,col){const p=worldPos(u,0);this.groundRing(p.x,p.z,col,1.6,.2,.8);burst(new THREE.Vector3(p.x,.5,p.z),col,40,3);flashLight(p,col,8,8);},
 soul(u,col){const p=worldPos(u,.6);for(let i=0;i<20;i++)part({x:p.x+(Math.random()-.5)*.5,y:p.y,z:p.z+(Math.random()-.5)*.5,vy:1.5+Math.random()*2,life:1.1,size:.18,col:new THREE.Color(col),g:0});},
 hitSpark(u,col,crit){const p=worldPos(u,.9);burst(p,col,crit?30:14,crit?4:2.5);burst(p,0x6a0808,crit?10:5,2,{g:-9});flashLight(p,col,crit?6:3,20);}};
function shake(v){camShake=Math.max(camShake,v);}
function zoom(u,z,d){const p=u?worldPos(u,.8):new THREE.Vector3(0,.8,1);const o={z:1,x:p.x,y:p.y,zz:p.z};BT.zoom=o;fxAdd({d,upd:q=>{const e=q<.25?q/.25:1-(q-.25)/.75;o.z=1+(z-1)*e*e*(3-2*e);},end:()=>{o.z=1;}});}
function setTarget(fn){for(const[u,R]of BT.units)R.selTarget=fn?fn(u):false;}
// précompile tous les matériaux de la scène (même cachés par le brouillard) juste après sa construction
// Préparation des shaders SANS bloquer : compileAsync lance la compilation (en parallèle si le GPU le permet),
// et on n'affiche pas la nouvelle scène tant qu'elle n'est pas prête (au plus 4 s) -> plus de gel de plusieurs secondes.
let needComp=0,hold=0,holdT=0;
// compileAsync de three r160 plante (minuterie, erreur non rattrapable) si un matériau est jeté pendant la compilation :
// la promesse ne se résout alors jamais et l'image reste figée 4 s. Version sûre : un matériau sans programme compte comme prêt.
function compA(sc,c,tg){const mats=renderer.compile(sc,c,tg||null);if(!renderer.extensions.has('KHR_parallel_shader_compile'))return Promise.resolve();
 return new Promise(res=>{const t0=performance.now();const chk=()=>{try{mats.forEach(m=>{const q=renderer.properties.get(m).currentProgram;if(!q||q.isReady())mats.delete(m);});}catch(e){mats.clear();}
  if(!mats.size||performance.now()-t0>4000)res();else setTimeout(chk,10);};chk();});}
function precompile(sc,block){const hid=[];sc.traverse(o=>{if(!o.visible&&!o.isLight){hid.push(o);o.visible=true;}});let p=null;
 try{p=compA(sc,cam);}catch(e){}hid.forEach(o=>o.visible=false);
 if(p&&block){const id=++hold;holdT=performance.now();p.catch(()=>{}).then(()=>{if(hold===id)hold=0;});}}
function warm(obj,sc){if(!renderer)return;const v=obj.visible;obj.visible=true;try{compA(obj,cam,sc);}catch(_){}obj.visible=v;}
function render(t,dt){if(!renderer.shadowMap.autoUpdate&&(++shN%shEvery===0||needComp))renderer.shadowMap.needsUpdate=true;if(needComp&&rp&&rp.scene){needComp++;if(needComp===2)precompile(rp.scene,true);else if(needComp===20&&!hold)precompile(rp.scene,false);if(needComp>20&&!hold)needComp=0;}
 if(hold){if(performance.now()-holdT<4000)return;hold=0;}if(grade){const G=GRADE.tier[(mode==='battle'?BT.tier:mode==='title'?0:EX.tier)||0];grade.uniforms.tint.value.set(...G.tint);grade.uniforms.sat.value=G.sat;grade.uniforms.con.value=G.con;grade.uniforms.vig.value=G.vig*(mode==='battle'?1.1:1);grade.uniforms.t.value=(t*7)%100;grade.uniforms.asp.value=W/H;flashV=Math.max(0,flashV-(dt||.016)*3.5);grade.uniforms.flash.value=flashV;}composer.render(dt);}
function flash(v){flashV=Math.max(flashV,v);}
function setBloom(s){bloom.strength=s;}
let qLvl=-1,shFix=null,shEvery=1,shN=0;function setLevel(l){l=Math.max(0,Math.min(3,l));const shOld=renderer.shadowMap.enabled;qLvl=l;hiQ=l>=1;const dpr=devicePixelRatio||1;
 const pr=[Math.min(1,dpr),Math.min(1.3,dpr),Math.min(1.6,dpr),Math.min(2,dpr)][l];renderer.setPixelRatio(pr);composer.setPixelRatio(pr);const ns=l>=2?4:l>=1?2:0;[composer.renderTarget1,composer.renderTarget2].forEach(rt=>{if(rt.samples!==ns){rt.samples=ns;rt.dispose();}});bloom.enabled=l>=2;renderer.shadowMap.autoUpdate=l>=2;shEvery=l>=2?1:l>=1?2:4;if(shFix===null){shFix=l>=1;renderer.shadowMap.type=l>=2?THREE.PCFSoftShadowMap:THREE.PCFShadowMap;}renderer.shadowMap.enabled=shFix;if(ENV){scW.environment=l>=2?ENV:null;scB.environment=l>=2?ENV:null;}if(EX.fogP)EX.fogP.visible=l>=1;if(BT.fogP)BT.fogP.visible=l>=1;
 if(EX.key)EX.key.shadow.mapSize.set(l>=3?1024:512,l>=3?1024:512);resize();
 if(shOld!==renderer.shadowMap.enabled){scW.traverse(o=>{if(o.material)o.material.needsUpdate=true;});scB.traverse(o=>{if(o.material)o.material.needsUpdate=true;});}}
function setQuality(hi){setLevel(hi?2:0);}
export const G3={unfocus(){BT.focus=null;BT.zoom=null;},set camZoom(v){camZoom=v;},get camZoom(){return camZoom;},setQuality,init,buildFloor,updExplo,buildArena,updBattle,render,rotIn,setYaw,get yaw(){return EX.yaw||0;},project,screenOf,hitTest,act,hit,die,revive,FX,shake,zoom,setTarget,setBloom,part,burst,worldPos,get mode(){return mode;},get mapRef(){return EX.mapRef;},focus,victory,get cine(){return !!BT.cine;},buildTitle,updTitle,endTitle,portrait,setLevel,get level(){return qLvl;},flash,smoke,get kitErr(){return K.ok?null:(K.err||'inconnu');},setUiBottom(px){BT.uiB=Math.max(BT.uiB||0,px);},set mode(m){mode=m;rp.scene=m==='battle'?scB:scW;},
 exploBurst(x,y,col,n=20){burst(new THREE.Vector3(x,.5,y),col,n,3);},exploScreen(x,y,h=1.2){return project(new THREE.Vector3(x,h*(K.ok?.7:1),y));},refreshParty(VD){if(!EX.party)return;EX.party.forEach(R=>{scW.remove(R.root);purgeObj(R.root);});EX.party=VD.P.heroes.map(h=>{const R=heroM(h.cls,eqOf(h));R.root.scale.multiplyScalar(EXS());scW.add(R.root);return R;});},unitOf,ready:kitReady,isReady:()=>K.ok!==undefined&&kitDone};
let kitDone=false;kitReady.then(()=>{kitDone=true;});
window.G3=G3;G3._d=()=>({scW,scB,cam,renderer,composer,rp,bloom,grade,EX,BT,CUT,K,THREE});
