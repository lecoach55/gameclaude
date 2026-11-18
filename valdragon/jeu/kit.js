// ===== Valdragon 3D · modèles importés (KayKit, Quaternius — CC0) =====
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import * as SU from 'three/addons/utils/SkeletonUtils.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {grime} from './grime.js';
import {elTex} from './vfx.js';
import {mxClips,MXSET,drClips,DRSET} from './mxanim.js';

export const K={ok:false,g:{},piece:{},geo:{}};
const FILES=['forest','spider','weapons','dungeon','phprops'];/* anciens personnages (secours) retirés : jamais utilisés, ils ralentissaient le lancement */
export let progress=0;
export const ready=(async()=>{
 try{const L=new GLTFLoader();let n=0;
  const b64=s=>{const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer;};
  L.setMeshoptDecoder(MeshoptDecoder);
  const one=async f=>{const el=document.getElementById('vdm-'+f);let buf;if(el){buf=b64(el.textContent.trim());el.textContent='';}else{const r=await fetch('mq/'+f+'.glb');if(!r.ok)throw new Error('modèle absent : '+f);buf=await r.arrayBuffer();}const g=await L.parseAsync(buf,'');n++;progress=n/FILES.length;return g;};
  const all=Promise.all(FILES.map(one));
  const res=await Promise.race([all,new Promise((_,rj)=>setTimeout(()=>rj(new Error('délai dépassé')),90000))]);
  FILES.forEach((f,i)=>K.g[f]=res[i]);
  // héros réalistes (optionnels : en cas d'échec, les anciens modèles restent)
  for(const f of ['hx_aldric','hx_maelle','hx_ysolde','hx_brute','hx_cult','hx_dragon']){try{if(document.getElementById('vdm-'+f)||location.protocol.startsWith('http'))K.g[f]=await one(f);}catch(e){console.warn('héros',f,e);}}
  const PT=(()=>{const t=['wood_d','wood_n','crypt_w_d','crypt_w_n'].map(n=>elTex(n));if(t.some(x=>!x))return null;t.forEach(x=>{x.wrapS=x.wrapT=THREE.RepeatWrapping;x.anisotropy=4;});return{wd:t[0],wn:t[1],sd:t[2],sn:t[3]};})();
  const MC={};for(const s of [K.g.dungeon.scene,K.g.weapons.scene,K.g.forest.scene])s.children.forEach(c=>{K.piece[c.name]=c;const cat=/banner/.test(c.name)?'b':/candle/.test(c.name)?'c':/pillar|wall|column|stair|arch|floor_tile/.test(c.name)?'s':'p';c.traverse(m=>{if(!m.isMesh||!m.material||Array.isArray(m.material))return;const ck=m.material.uuid+cat;if(!MC[ck]){MC[ck]=m.material.clone();MC[ck].userData={};if(cat==='b'){/* 18/11 : tentures teintes d'une seule couleur sourde (l'atlas KayKit les rendait « arc-en-ciel ») */MC[ck].map=null;MC[ck].color.setHex(BDYE[c.name]||0x4e1a16);MC[ck].roughness=.92;MC[ck].metalness=0;}}m.material=MC[ck];if(!m.material.userData.grime)grime(m.material,/banner/.test(c.name)?{cut:1,sc:2.2,amt:.45,sat:.8,dk:.8,base:.35,rough:.3,met:0}:/candle/.test(c.name)?{sc:1.5,amt:.3,sat:.6,dk:.56,base:0,rough:.5,met:0}:{prop:PT,pstone:cat==='s',cut:cat==='s',nowax:s!==K.g.forest.scene,sc:1.5,amt:.3,sat:.75,dk:.84,base:.45,rough:.4,met:.0});});});
  // décors photoréalistes Poly Haven : remplacent les pièces KayKit de même nom (matières PBR d'origine, légère usure)
  if(K.g.phprops)K.g.phprops.scene.children.slice().forEach(c=>{K.piece[c.name]=c;c.traverse(m=>{if(m.isMesh&&m.material&&!m.material.userData.grime){m.material.userData.ph=1;grime(m.material,{sc:1.5,amt:.18,sat:.85,dk:.9,base:.25,rough:0,met:0});}});});
  if(K.piece.chest_gold&&K.g.phprops){K.piece.chest_gold.traverse(m=>{if(m.isMesh){m.material=m.material.clone();m.material.color.multiply(new THREE.Color(1.3,1.02,.6));m.material.metalness=Math.max(m.material.metalness,.35);}});}
  coinPiles();
  K.ok=true;}catch(e){console.warn('Modèles 3D indisponibles, rendu procédural',e);K.ok=false;K.err=String(e&&e.message||e);}
 return K.ok;})();

const BDYE={banner_patternA_red:0x5a1c18,banner_shield_green:0x2e3a2a,banner_triple_yellow:0x5e4320,banner_patternB_blue:0x283245};
/* 18/11 : tas de pièces d'or en vrai métal (remplacent les « crêpes orange » KayKit coin_stack_*) : pièces fines inclinées, une seule géométrie fusionnée */
function coinPiles(){const M=new THREE.MeshStandardMaterial({color:0xe2ac4a,metalness:.72,roughness:.36,emissive:0x3a2406,emissiveIntensity:.6});M.userData.ph=1;/* or lisible même sous un éclairage froid (le reflet seul virait au vert dans les cavernes) */
 let sd=7;const rnd=()=>{sd=(sd*16807)%2147483647;return(sd-1)/2147483646;};
 const mk=(name,n,R,H)=>{const base=new THREE.CylinderGeometry(.075,.075,.016,7).toNonIndexed(),bp=base.attributes.position,bn=base.attributes.normal;const P=new Float32Array(bp.count*3*n),N=new Float32Array(bp.count*3*n);
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),v=new THREE.Vector3(),nm=new THREE.Matrix3();let o=0;
  for(let i=0;i<n;i++){const a=rnd()*Math.PI*2,r=R*Math.sqrt(rnd()),h=Math.max(0,H*(1-r/R)*(.55+.45*rnd()));e.set((rnd()-.5)*.9*(r/R+.2),rnd()*6.3,(rnd()-.5)*.9*(r/R+.2));q.setFromEuler(e);m4.compose(new THREE.Vector3(Math.cos(a)*r,h+.008,Math.sin(a)*r),q,new THREE.Vector3(1,1,1));nm.getNormalMatrix(m4);
   for(let k=0;k<bp.count;k++){v.fromBufferAttribute(bp,k).applyMatrix4(m4);P[o]=v.x;P[o+1]=v.y;P[o+2]=v.z;v.fromBufferAttribute(bn,k).applyMatrix3(nm).normalize();N[o]=v.x;N[o+1]=v.y;N[o+2]=v.z;o+=3;}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('normal',new THREE.BufferAttribute(N,3));g.computeBoundingBox();g.computeBoundingSphere();
  const mesh=new THREE.Mesh(g,M);mesh.name=name+'_tas';mesh.castShadow=true;const G=new THREE.Group();G.name=name;G.add(mesh);K.piece[name]=G;};
 mk('coin_stack_large',110,.62,.75);mk('coin_stack_medium',50,.42,.42);}
/* ---------- pièces de décor ---------- */
function deq(g){for(const n of Object.keys(g.attributes)){const a=g.attributes[n];if(a.isInterleavedBufferAttribute||a.normalized||!(a.array instanceof Float32Array)){const c=a.itemSize,arr=new Float32Array(a.count*c);for(let i=0;i<a.count;i++)for(let j=0;j<c;j++)arr[i*c+j]=a.getComponent?a.getComponent(i,j):[a.getX(i),a.getY(i),a.getZ(i),a.getW(i)][j];g.setAttribute(n,new THREE.BufferAttribute(arr,c));}}return g;}
// géométrie fusionnée d'une pièce (pour InstancedMesh), transformations internes appliquées
export function pieceGeo(name){if(K.geo[name])return K.geo[name];const p=K.piece[name];if(!p)return null;p.updateMatrixWorld(true);
 const inv=new THREE.Matrix4().copy(p.parent?p.parent.matrixWorld:new THREE.Matrix4()).invert();let geo=null,mat=null;
 p.traverse(o=>{if(o.isMesh&&!geo){geo=deq(o.geometry.clone());geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));mat=o.material;}});
 return K.geo[name]={geo,mat};}
export function tintObj(o,c){o.traverse(m=>{if(m.isMesh){m.material=m.material.clone();m.material.color.multiply(new THREE.Color(c));}});return o;}
export function piece(name,s=1,shadow=true){const p=K.piece[name];if(!p)return new THREE.Group();const o=p.clone(true);
 const g=new THREE.Group();g.add(o);g.scale.setScalar(s);g.traverse(m=>{if(m.isMesh){m.castShadow=shadow;m.receiveShadow=true;}});return g;}

/* ---------- personnages ---------- */
const HUE_GLSL=`vec3 vdHue(vec3 c,float h){const vec3 k=vec3(.57735);float ca=cos(h);return c*ca+cross(k,c)*sin(h)+k*dot(k,c)*(1.-ca);}`;
export const RIM={col:new THREE.Color(1,.85,.65),i:{value:.4}};
// 17/11 : liseré de contre-jour propre aux héros (plus large et plus froid que celui des monstres) pour détacher leur silhouette du sol sombre
export const RIMH={col:new THREE.Color(.95,.9,.82),i:{value:.7}};
// réglé par biome dans g3d.js (rimBiome) : crypte/cavernes .55 neutre chaud, forge .45 orangé, givre .22 (sur sol clair un liseré blanchit les héros)
function prepMat(m,o){if(o.grime===false)return prepMat0(m,o);return grime(prepMat0(m,o),{sc:o.gsc||4.5,amt:o.gamt??.3,sat:o.gsat??.72,dk:o.gdk??.9,base:0,rough:.3,met:o.gmet||0,hc:o.ghc||0,mat:o.set==='mx'?0:1,recol:o.recol||null});}
function prepMat0(m,o){m=m.clone();if(o.rim!==false&&m.isMeshStandardMaterial){const H=o.kind==='hero',hue={value:o.hue||0},rc={value:o.rimCol?new THREE.Color(o.rimCol):H?RIMH.col:RIM.col};
  m.onBeforeCompile=sh=>{sh.uniforms.vdH=hue;sh.uniforms.rimC=rc;sh.uniforms.rimI=H?RIMH.i:RIM.i;sh.fragmentShader='uniform float vdH;uniform vec3 rimC;uniform float rimI;\n'+HUE_GLSL+'\n'+sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n diffuseColor.rgb=vdHue(diffuseColor.rgb,vdH);').replace('#include <opaque_fragment>','float vdR=1.-abs(dot(normalize(normal),normalize(vViewPosition)));outgoingLight+=rimC*pow(vdR,'+(H?'3.0':'3.4')+')*rimI*'+(H?'mix(vec3(1.),diffuseColor.rgb*2.,.35)':'1.')+';\n#include <opaque_fragment>');};
  m.customProgramCacheKey=()=>H?'vdrimh':'vdrim';if(m.emissive){m.userData.e0=m.emissive.clone();m.userData.ei0=m.emissiveIntensity;}return m;}
 if(o.hue||o.sat!=null||o.dark){const hue={value:o.hue||0},sat={value:o.sat??1},dk={value:o.dark||1};
  m.onBeforeCompile=sh=>{sh.uniforms.vdH=hue;sh.uniforms.vdS=sat;sh.uniforms.vdD=dk;sh.fragmentShader='uniform float vdH;uniform float vdS;uniform float vdD;\n'+HUE_GLSL+'\n'+sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n diffuseColor.rgb=vdHue(diffuseColor.rgb,vdH);float vdL=dot(diffuseColor.rgb,vec3(.3,.59,.11));diffuseColor.rgb=mix(vec3(vdL),diffuseColor.rgb,vdS)*vdD;');};
  m.customProgramCacheKey=()=>'vdhue';}
 if(m.emissive){m.userData.e0=m.emissive.clone();m.userData.ei0=m.emissiveIntensity;}return m;}
const SETS={
 mx:MXSET,dr:DRSET,
 kk:{idle:'Idle_A',walk:'Walking_A',atk:'Melee_1H_Attack_Slice_Diagonal',spin:'Melee_2H_Attack_Spin',jump:'Melee_1H_Attack_Jump_Chop',cast:'Ranged_Magic_Spellcasting',shoot:'Ranged_Magic_Shoot',raise:'Ranged_Magic_Raise',summon:'Ranged_Magic_Summon',bow:'Ranged_Bow_Release',block:'Melee_Block',item:'Use_Item',slam:'Melee_1H_Attack_Chop',bite:'Melee_1H_Attack_Stab',breath:'Ranged_Magic_Spellcasting',hit:'Hit_A',die:'Death_A',taunt:'Interact'},
 none:{},
 sk:{idle:'Skeletons_Idle',walk:'Skeletons_Walking',atk:'Melee_1H_Attack_Chop',bow:'Ranged_2H_Shoot',cast:'Ranged_Magic_Spellcasting',slam:'Melee_1H_Attack_Chop',bite:'Melee_1H_Attack_Stab',block:'Melee_Block',hit:'Hit_A',die:'Skeletons_Death',taunt:'Skeletons_Taunt',spawn:'Skeletons_Awaken_Standing'},
 qm:{idle:'Idle',walk:'Walk',atk:'Weapon',cast:'Wave',bow:'Punch',slam:'Weapon',bite:'Punch',breath:'Wave',hit:'HitReact',die:'Death'},
 qp:{idle:'Punch',walk:'Walk',atk:'Punch',cast:'Wave',bow:'Punch',slam:'Punch',bite:'Punch',breath:'Wave',hit:'HitReact',die:'Death'},
 fl:{idle:'Flying_Idle',walk:'Fast_Flying',atk:'Headbutt',cast:'Punch',bow:'Punch',slam:'Headbutt',bite:'Headbutt',breath:'Punch',hit:'HitReact',die:'Death'}};
// file, set, height cible (unités du monde), options
const MONT={gsat:.52,gdk:.9,gamt:.4,ghc:.45};
export function makeChar(file,o={}){if((o.kind||'mon')==='mon')o=Object.assign({},MONT,o);const src=K.g[file];const model=SU.clone(src.scene);const mats=[];
 model.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;m.material=prepMat(m.material,o);mats.push(m.material);}});
 if(o.set==='dr'&&model.children[0])model.children[0].name='drBody'; if(o.rotY)model.rotation.y=o.rotY;if(o.set==='dr'&&K.drc&&K.drc[file]&&K.drc[file].flip)model.rotation.y+=Math.PI;const inner=new THREE.Group();inner.add(model);inner.scale.setScalar(o.s||1);if(o.y)inner.position.y=o.y;
 const root=new THREE.Group();root.add(inner);
 const R={root,inner,model,mats,gl:true,proc:o.proc,kind:o.kind||'mon',set:SETS[o.set||'kk']};
 R.mixer=new THREE.AnimationMixer(model);const clips=(o.set==='dr')?(K.drc=K.drc||{},K.drc[file]=K.drc[file]||drClips(src.scene)).clips:(o.set==='mx')?(K.mxc=K.mxc||{},K.mxc[file+(o.style?JSON.stringify(o.style):'')]=K.mxc[file+(o.style?JSON.stringify(o.style):'')]||mxClips(src.scene,{style:o.style})):['kk','sk'].includes(o.set||'kk')?K.g.anims.animations:src.animations;R.clips={};clips.forEach(c=>R.clips[c.name]=c);
 R.A={};const act=k=>{if(R.A[k])return R.A[k];const c=R.clips[R.set[k]];if(!c)return null;const a=R.mixer.clipAction(c);R.A[k]=a;return a;};R.act=act;
 ['idle','walk'].forEach(k=>{const a=act(k);if(a){a.play();a.setEffectiveWeight(k==='idle'?1:0);a.time=Math.random()*c0(a);}});
 R.mixer.update(0);
 if(o.ground){root.updateMatrixWorld(true);let mn=Infinity;const v=new THREE.Vector3();model.traverse(m=>{if(m.isSkinnedMesh){const p=m.geometry.attributes.position;for(let i=0;i<p.count;i+=7){v.fromBufferAttribute(p,i);m.applyBoneTransform(i,v);v.applyMatrix4(m.matrixWorld);if(v.y<mn)mn=v.y;}}});if(isFinite(mn)){const p=new THREE.Vector3(0,mn,0),p0=new THREE.Vector3(0,0,0);model.parent.worldToLocal(p);model.parent.worldToLocal(p0);model.position.y-=(p.y-p0.y);}}
 // armes
 const bone=n=>{let b=null;model.traverse(x=>{if(!b&&x.name&&x.name.replace(/[._]/g,'').toLowerCase()===n)b=x;});return b;};
 // proportions moins « chibi » : tête réduite, membres un peu allongés (appliqué après le mixer)
 R.fix=[];const HS={kk:.8,sk:.86}[o.set||'kk'];if(HS&&!o.proc){const hb=bone('head');if(hb)R.fix.push([hb,HS,HS,HS]);['upperarml','upperarmr'].forEach(n=>{const b=bone(n);if(b)R.fix.push([b,1.03,1.08,1.03]);});
  if(o.kind==='hero'||o.kind==='npc'){inner.scale.y*=1.05;}}
 R.applyFix=()=>{for(const [b,x,y,z] of R.fix)b.scale.set(x,y,z);};R.applyFix();
 R.handR=bone('handslotr')||bone('mixamorigrighthand');R.handL=bone('handslotl')||bone('mixamoriglefthand');
 if(o.hide)model.traverse(m=>{if(m.isMesh&&o.hide.test(m.material&&m.material.name||''))m.visible=false;});
 (o.wR||[]).forEach(w=>attach(R,R.handR,w,o));(o.wL||[]).forEach(w=>attach(R,R.handL,w,o));
 root.userData.R=R;return R;}
const c0=a=>a.getClip().duration;
function attach(R,b,name,o){if(!b||!K.piece[name])return;const w=K.piece[name].clone(true);w.traverse(m=>{if(m.isMesh){m.castShadow=true;m.material=prepMat(m.material,{});R.mats.push(m.material);
  if(o.glow){m.material.emissive=new THREE.Color(o.glow);m.material.emissiveIntensity=.35;m.material.userData.e0=m.material.emissive.clone();m.material.userData.ei0=.35;}}});if(o.wx&&o.wx[name]){const X=o.wx[name];if(X.p)w.position.set(...X.p);if(X.r)w.rotation.set(...X.r);if(X.s)w.scale.setScalar(X.s);}b.add(w);R.weapon=w;}

/* ---------- animation ---------- */
const tmpC=new THREE.Color();
export function animateG(R,dt,t,st){const w=st.walk||0;
 // déclencheurs
 const dead=(st.dead||0)>.02;
 if(dead&&!R.deadOn){R.deadOn=1;R.os=null;const a=R.act('die');if(a){a.reset();a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;a.timeScale=1.15;a.play();if(st.dead>=1)a.time=c0(a)-.01;R.dieA=a;}}
 if(!dead&&R.deadOn){R.deadOn=0;if(R.dieA){R.dieA.stop();R.dieA=null;}}
 if(!dead){
  if(st.act&&(st.act!==R.lastAct||st.p<(R.lastP||0)-.05)){shot(R,st.act,R.actDur||.45);}
  R.lastAct=st.act;R.lastP=st.p||0;
  const h=st.hit||0;if(h>(R.prevHit||0)+.25&&(!R.os||R.os.k==='hit'||R.os.t>R.os.d*.7))shot(R,'hit',.4);R.prevHit=h;}
 // poids
 let osW=0;if(R.os){R.os.t+=dt;const p=R.os.t/R.os.d;osW=Math.min(1,R.os.t/.08,Math.max(0,(1-p)/.18));if(p>=1){R.os.a.stop();R.os=null;osW=0;}else R.os.a.setEffectiveWeight(osW);}
 const dw=dead?0:1;const iA=R.A.idle,wA=R.A.walk;if(iA)iA.setEffectiveWeight((1-w)*(1-osW)*dw+1e-4);if(wA){wA.setEffectiveWeight(w*(1-osW)*dw);const sd=wA.getClip().userData&&wA.getClip().userData.stride;
  if(sd&&st.spd!==undefined){// cadence calée sur la vitesse réelle : pieds qui ne glissent plus
   const sc=(R.inner.scale.x||1)*(R.root.scale.x||1);wA.timeScale=Math.max(.35,Math.min(3.4,st.spd/Math.max(.05,sd*sc)*wA.getClip().duration))*(st.spd>.15?1:.35);}else wA.timeScale=.6+w*.7;}
 if(R.dieA)R.dieA.setEffectiveWeight(dead?1:0);
 R.mixer.update(dt);R.applyFix&&R.applyFix();
 // calage au sol : le point le plus bas des pieds (sur un cycle) touche le sol, sans flotter ni s'enfoncer
 if(R.toes===undefined){R.toes=[];R.model.traverse(b=>{if(b.isBone&&/(LeftToeBase|RightToeBase)$/.test(b.name))R.toes.push(b);});R.gy0=R.inner.position.y;R.gOff=0;R.gMin=null;}
 if(R.toes.length===2){if(dead){R.gOff+=(0-R.gOff)*Math.min(1,dt*4);}else{let m=1e9;for(const b of R.toes){b.updateWorldMatrix(true,false);m=Math.min(m,b.matrixWorld.elements[13]);}
  R.root.updateWorldMatrix(true,false);const e=R.root.matrixWorld.elements,sc=Math.hypot(e[4],e[5],e[6])||1,raw=(m-e[13])/sc-R.gOff;
  R.gMin=R.gMin===null?raw:Math.min(raw,R.gMin+dt*.35);const tg=Math.max(-.15,Math.min(.08,.016-R.gMin));R.gOff+=(tg-R.gOff)*Math.min(1,dt*8);}
  R.inner.position.y=R.gy0+R.gOff;}
 // lueurs : charge, coup reçu
 const fl=Math.max(0,(st.hit||0)-.35)*1.4,ch=st.charge&&!dead?.55+.45*Math.sin(t*12):0;
 if(fl>0||ch>0||R.glowOn){R.glowOn=fl>0||ch>0;const cc=R.chargeCol||0xff6a2a;
  for(const m of R.mats){if(!m.emissive)continue;if(!R.glowOn){m.emissive.copy(m.userData.e0||tmpC.setRGB(0,0,0));m.emissiveIntensity=m.userData.ei0??1;continue;}
   tmpC.setHex(cc).multiplyScalar(ch*.22);if(fl>0)tmpC.add(new THREE.Color(1,.92,.85).multiplyScalar(fl));m.emissive.copy(tmpC);m.emissiveIntensity=1;}}
 if(R.proc==='spider'){const ph=(st.phase||0)+t,w=st.walk||0,d=st.dead||0,p=st.p||0,a=st.act;let rx=-(st.hit||0)*.35,y=Math.abs(Math.sin(ph*22))*.035*w+Math.sin(ph*2.5)*.012;
  if(a==='bite'||a==='atk'||a==='slam'){rx+=Math.sin(Math.min(1,p)*Math.PI)*.45;y+=Math.sin(Math.min(1,p)*Math.PI)*.12;}
  R.inner.rotation.set(rx,Math.sin(ph*1.3)*.08,Math.sin(ph*22)*.05*w+d*Math.PI);R.inner.position.y=y+d*.16;R.model.scale.setScalar(1+Math.sin(ph*4)*.015);}
 if(R.float)R.inner.position.y=(R.baseY||0)+Math.sin((st.phase||0)+t*2)*.08;}
export function playG(R,k,dur=.6){shot(R,k,dur);}
function shot(R,k,dur){const a=R.act(k)||(k!=='hit'&&k!=='die'?R.act(['cast','shoot','raise','summon','item'].includes(k)?'cast':'atk'):null);if(!a)return;if(R.os&&R.os.a!==a)R.os.a.stop();a.reset();a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=false;
 const len=c0(a);const want=k==='hit'?Math.min(len,.55):['spin','raise','summon','taunt','spawn','block'].includes(k)?Math.min(len,1.3):Math.max(.6,Math.min(len,dur*1.9));a.timeScale=len/want;a.setEffectiveWeight(0);a.play();R.os={a,k,t:0,d:want};}
