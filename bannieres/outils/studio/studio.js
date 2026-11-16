// ===== Studio de sprites 3D pour Bannières & Sortilèges =====
// Réutilise les modèles et animations de Valdragon (Mixamo, dragon Drago CC BY, armes KayKit) pour pré-calculer
// les créatures en images, comme les sprites pré-rendus des Heroes classiques. Tourne dans le dossier préparé de Valdragon.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {K,ready,makeChar} from './kit.js';
import {QDEFS} from './bs_quad.js';
const W=window;
let renderer,scene,cam,ENV;
function init(FW,FH){renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(FW,FH);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.55;renderer.shadowMap.enabled=false;document.body.appendChild(renderer.domElement);
 scene=new THREE.Scene();const pm=new THREE.PMREMGenerator(renderer);ENV=pm.fromScene(new RoomEnvironment(),.04).texture;scene.environment=ENV;
 scene.add(new THREE.HemisphereLight(0xfff2dc,0x3a2c20,1.1));const key=new THREE.DirectionalLight(0xffe6c8,3.0);key.position.set(-3,5,4);scene.add(key);
 const rim=new THREE.DirectionalLight(0x9ab8ff,2.2);rim.position.set(3,3,-4);scene.add(rim);const fill=new THREE.DirectionalLight(0xffd8a8,.8);fill.position.set(4,1,3);scene.add(fill);}
function mxLift(R,k=.13){R.mats.forEach(m=>{if(m.map&&!m.emissiveMap){m.emissiveMap=m.map;m.emissive=new THREE.Color(k,k*.94,k*.88);m.emissiveIntensity=1;}});}
function boneBy(R,re){let b=null;R.model.traverse(x=>{if(!b&&x.isBone&&re.test(x.name))b=x;});return b;}
function eyeGlow(R,col,i=1){const hb=boneBy(R,/Head$/);if(!hb)return;[-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.014,8,6),new THREE.MeshBasicMaterial({color:col}));e.position.set(s*.032,.07,.1);hb.add(e);const h=new THREE.Mesh(new THREE.SphereGeometry(.03,8,6),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.35*i,blending:THREE.AdditiveBlending,depthWrite:false}));h.position.copy(e.position);hb.add(h);});}
function ailes(R,col,taille=1){const b=boneBy(R,/Spine2$/)||boneBy(R,/Spine1$/);if(!b)return;const sc=1/(R.inner.scale.x*(R.model.scale.x||1));
 const sh=new THREE.Shape();sh.moveTo(0,0);sh.bezierCurveTo(.25,.35,.7,.75,1.15,.95);sh.bezierCurveTo(1.0,.7,1.05,.55,.95,.45);sh.bezierCurveTo(.95,.3,.85,.2,.78,.12);sh.bezierCurveTo(.7,0,.55,-.12,.45,-.2);sh.bezierCurveTo(.3,-.25,.12,-.2,0,0);
 const g=new THREE.ExtrudeGeometry(sh,{depth:.03,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,curveSegments:16});const m=new THREE.MeshStandardMaterial({color:col,roughness:.55,metalness:0,emissive:new THREE.Color(col),emissiveIntensity:.18});R.mats.push(m);
 [-1,1].forEach(s=>{const w=new THREE.Mesh(g,m);w.scale.set(s*taille*sc*.62,taille*sc*.62,sc*.62);w.position.set(s*.05*sc,.12*sc,-.12*sc);w.rotation.set(-.25,s*-.55,s*.1);b.add(w);});}
function halo(R,col){const hb=boneBy(R,/HeadTop_End$/)||boneBy(R,/Head$/);if(!hb)return;const sc=1/(R.inner.scale.x*(R.model.scale.x||1));const t=new THREE.Mesh(new THREE.TorusGeometry(.13*sc,.012*sc,8,32),new THREE.MeshBasicMaterial({color:col}));t.rotation.x=Math.PI/2;t.position.y=.06*sc;hb.add(t);}
function fantome(R,col,op=.62){R.mats.forEach(m=>{m.transparent=true;m.opacity=op;m.depthWrite=true;m.emissive=new THREE.Color(col);m.emissiveIntensity=.55;});}
// définitions : fichier + options Valdragon (teintes « grime » : sat, sombre, recol) + ajouts
export const DEFS={
 croise:{f:'hx_aldric',o:{s:1,set:'mx',gsat:.9,gdk:1.5,gamt:.08,recol:{h:.75,to:.0,w:.12,s:1.1}},lift:.2,atk:'atk'},
 piquier:{f:'hx_aldric',o:{s:.92,set:'mx',gsat:.85,gdk:1.25,gamt:.12,recol:{h:.75,to:.62,w:.14,s:1.2},hide:/Shield|Sword/i,wR:['staff'],wx:{staff:{p:[0,.1,.02],s:.62}}},lift:.18,atk:'atk'},
 archer:{f:'hx_maelle',o:{s:.95,set:'mx',gsat:.85,gdk:1.2,gamt:.1,recol:{h:.33,to:.62,w:.12,s:.9}},lift:.15,atk:'bow',tir:1},
 elfe:{f:'hx_maelle',o:{s:.95,set:'mx',gsat:1,gdk:1.2,gamt:.08,hue:.25},lift:.17,atk:'bow',tir:1},
 moine:{f:'hx_cult',o:{s:.9,set:'mx',recol:{h:0,to:.09,w:.16,s:.5},gsat:.7,gdk:1.2,gamt:.12,wR:['staff'],wx:{staff:{p:[0,.2,.02],s:.36}}},lift:.15,atk:'cast',tir:1,aura:0xffe79a},
 ange:{f:'hx_ysolde',o:{s:1.02,set:'mx',recol:{h:.11,to:.14,w:.5,s:.15},gsat:.4,gdk:.8,gamt:.15,wR:['sword'],wx:{sword:{p:[0,.06,.02],s:.4}}},lift:.0,atk:'atk',ailes:0xe8e0d0,halo:0xffe58a,vol:1},
 vampire:{f:'hx_cult',o:{s:.95,set:'mx',gsat:.95,gdk:1.1,gamt:.1},lift:.14,atk:'atk',vol:1},
 liche:{f:'hx_cult',o:{s:.95,set:'mx',recol:{h:0,to:.75,w:.2,s:.7},gsat:.55,gdk:.8,gamt:.3,hue:.4,wR:['skstaff'],wx:{skstaff:{p:[0,.2,.02],s:.42}}},lift:.1,atk:'cast',tir:1,yeux:0x7cf7a2},
 squelette:{f:'hx_aldric',o:{s:.95,set:'mx',style:{sp:[.32,0,.06]},hue:.9,gsat:.15,gdk:1.35,gamt:.6,gsc:6,ghc:.5,recol:{h:.75,to:.3,w:.2,s:.2}},lift:.09,atk:'atk',yeux:0x9fffd0},
 chevnoir:{f:'hx_aldric',o:{s:1.08,set:'mx',gsat:.25,gdk:.42,gamt:.35,gmet:.3,recol:{h:.75,to:.98,w:.2,s:1.2}},lift:.06,atk:'atk',yeux:0xff4a3a},
 zombie:{f:'hx_brute',o:{s:.66,set:'mx',style:{sp:[.35,0,.08]},hue:1.2,gsat:.35,gdk:.75,gamt:.45,ghc:.2},lift:.1,atk:'atk',yeux:0xd8ff7a},
 spectre:{f:'hx_cult',o:{s:.95,set:'mx',hue:2.6,gsat:.3,gdk:1.4,gamt:.1},lift:.3,atk:'cast',fantome:0x9fd8ff,yeux:0x9ff7ff,vol:1,flotte:.25},
 gobelin:{f:'hx_brute',o:{s:.44,set:'mx',hue:.35,gsat:.6,gdk:1.15,gamt:.18,ghc:.2,wR:['dagger'],wx:{dagger:{p:[0,.06,.02],s:.45}}},lift:.12,atk:'atk'},
 orque:{f:'hx_brute',o:{s:.56,set:'mx',hue:.05,gsat:.55,gdk:1.0,gamt:.2,ghc:.2,wR:['skaxe'],wx:{skaxe:{p:[0,.1,.02],s:.3}}},lift:.12,atk:'atk',tir:1},
 troll:{f:'hx_brute',o:{s:.8,set:'mx',hue:2.4,gsat:.35,gdk:.9,gamt:.3,ghc:.2},lift:.1,atk:'atk'},
 nain:{f:'hx_brute',o:{s:.47,set:'mx',hue:-.5,gsat:.5,gdk:1.2,gamt:.15,ghc:.2,recol:{h:.0,to:.02,w:.12,s:.9},wR:['axe'],wx:{axe:{p:[0,.1,.02],s:.36}}},lift:.12,atk:'atk'},
 dragonvert:{f:'hx_dragon',o:{s:.0021,set:'dr',ground:1,hue:1.7,gsat:.65,gdk:1.05,gamt:.25,gsc:3},lift:.08,atk:'atk',dragon:1,yeux:0xffd84a},
 dragonos:{f:'hx_dragon',o:{s:.002,set:'dr',ground:1,hue:.3,gsat:.08,gdk:1.9,gamt:.5,gsc:4},lift:.12,atk:'atk',dragon:1,yeux:0x7cf7ff},
 h_chevalier:{f:'hx_aldric',o:{s:1,set:'mx',gsat:.95,gdk:1.5,gamt:.06,recol:{h:.75,to:.6,w:.12,s:1.2}},lift:.22},
 h_clerc:{f:'hx_ysolde',o:{s:1,set:'mx',gsat:.7,gdk:.75,gamt:.2,recol:{h:.11,to:.6,w:.5,s:.5},wR:['staff'],wx:{staff:{p:[0,.2,.02],s:.36}}},lift:.0,aura:0xffe79a},
 h_rodeur:{f:'hx_maelle',o:{s:1,set:'mx',gsat:.9,gdk:1.3,gamt:.08,recol:{h:.33,to:.3,w:.12,s:.9}},lift:.2},
 h_druide:{f:'hx_maelle',o:{s:1,set:'mx',gsat:.9,gdk:1.3,gamt:.08,hue:.3,wR:['staff'],wx:{staff:{p:[0,.2,.02],s:.36}}},lift:.2,aura:0x9aff9a},
 h_barbare:{f:'hx_brute',o:{s:.62,set:'mx',hue:.05,gsat:.6,gdk:1.1,gamt:.15,ghc:.2,wR:['skaxe'],wx:{skaxe:{p:[0,.1,.02],s:.3}}},lift:.15},
 h_chaman:{f:'hx_brute',o:{s:.6,set:'mx',hue:.35,gsat:.55,gdk:1.1,gamt:.15,ghc:.2,wR:['skstaff'],wx:{skstaff:{p:[0,.2,.02],s:.42}}},lift:.15,aura:0xff9a4a},
 h_chevmort:{f:'hx_aldric',o:{s:1.04,set:'mx',gsat:.3,gdk:.6,gamt:.3,gmet:.3,recol:{h:.75,to:.8,w:.2,s:1.1}},lift:.1,yeux:0x7cf7a2},
 h_necromancien:{f:'hx_cult',o:{s:1,set:'mx',recol:{h:0,to:.75,w:.2,s:.6},gsat:.6,gdk:1,gamt:.2,wR:['skstaff'],wx:{skstaff:{p:[0,.2,.02],s:.42}}},lift:.12,aura:0x7cf7a2},
 wyverne:{f:'hx_dragon',o:{s:.0015,set:'dr',ground:1,hue:.5,gsat:.55,gdk:.9,gamt:.3,gsc:3},lift:.07,atk:'atk',dragon:1,yeux:0xffb040},
};
function fabriquer(id){const D=DEFS[id];const R=makeChar(D.f,Object.assign({kind:'mon'},D.o));mxLift(R,D.lift||.12);
 if(D.ailes)ailes(R,D.ailes,1);if(D.halo)halo(R,D.halo);if(D.fantome)fantome(R,D.fantome);
 if(D.yeux&&!D.dragon)eyeGlow(R,D.yeux);if(D.yeux&&D.dragon)R.mats.forEach(m=>{if(/Eye/.test(m.name)){m.emissive=new THREE.Color(D.yeux);m.emissiveIntensity=2;}});
 if(D.aura&&R.weapon){const s=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8),new THREE.MeshBasicMaterial({color:D.aura}));s.position.y=.9;R.weapon.add(s);}
 return R;}
function pose(R,k,t){R.mixer.stopAllAction();const a=R.act(k)||R.act('idle');a.reset();a.play();a.setEffectiveWeight(1);a.paused=false;a.time=t*a.getClip().duration;R.mixer.update(0);a.time=t*a.getClip().duration;R.mixer.update(0);R.applyFix&&R.applyFix();}
// rend toutes les images d'une créature ; renvoie {frames:{anim:[dataURL]}, ...}
W.rendreCreature=async(id,opts)=>{await ready;const D=DEFS[id]||{};const Qd=QDEFS[id];const FW=opts.fw,FH=opts.fh;if(!renderer)init(FW,FH);renderer.setSize(FW,FH);
 const R=Qd?Qd.c():fabriquer(id);scene.add(R.root);R.root.rotation.y=Qd?-.5:Math.PI/2-.5;
 // échelle commune : u unités du monde = hauteur du cadre
 const U=opts.u;cam=new THREE.OrthographicCamera(-U*FW/FH/2,U*FW/FH/2,U*.5,-U*.5,.1,50);const pitch=.42;cam.position.set(0,Math.sin(pitch)*12+U*.38,Math.cos(pitch)*12);cam.lookAt(0,U*.38,0);
 const anims=opts.anims;const out={};let y0=null;
 for(const [nom,k,ts] of anims){out[nom]=[];for(const t of ts){if(Qd)R.poser(nom,t);else pose(R,k,t);R.root.position.y=D.flotte?D.flotte:0;R.root.updateMatrixWorld(true);
   renderer.setClearColor(0,0);renderer.clear();renderer.render(scene,cam);out[nom].push(renderer.domElement.toDataURL('image/png'));}}
 scene.remove(R.root);return out;};
W.mesurer=async(id)=>{await ready;if(!renderer)init(64,64);const R=fabriquer(id);scene.add(R.root);R.root.rotation.y=Math.PI/2-.5;pose(R,'idle',0);R.root.updateMatrixWorld(true);
 const bb=new THREE.Box3();const v=new THREE.Vector3();R.root.traverse(m=>{if(m.isSkinnedMesh){const p=m.geometry.attributes.position;for(let i=0;i<p.count;i+=5){v.fromBufferAttribute(p,i);m.applyBoneTransform(i,v);v.applyMatrix4(m.matrixWorld);bb.expandByPoint(v);}}else if(m.isMesh){m.geometry.computeBoundingBox();bb.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld));}});
 scene.remove(R.root);return [bb.min.x,bb.min.y,bb.min.z,bb.max.x,bb.max.y,bb.max.z].map(x=>+x.toFixed(2));};
W.studioPret=ready.then(ok=>({ok,err:K.err||null,ids:Object.keys(DEFS).concat(Object.keys(QDEFS)),q:Object.fromEntries(Object.entries(QDEFS).map(([k,v])=>[k,[v.fw,v.fh,v.u]]))}));
// ---------- portraits des héros (buste en 3/4) ----------
W.rendrePortrait=async(p)=>{await ready;const S=p.taille||128;if(!renderer)init(S,S);renderer.setSize(S,S);
 const R=makeChar(p.f,Object.assign({s:1,set:'mx',kind:'hero',gsat:.9,gdk:1.3,gamt:.08},p.o||{}));mxLift(R,p.lift||.16);if(p.cache)R.model.traverse(m=>{if(m.isMesh&&new RegExp(p.cache,'i').test(m.name))m.visible=false;});if(p.yeux)eyeGlow(R,p.yeux,.8);
 scene.add(R.root);R.root.rotation.y=p.rot??.42;pose(R,'idle',p.t??.15);R.root.updateMatrixWorld(true);
 const hb=boneBy(R,/Head$/);const h=new THREE.Vector3();hb.getWorldPosition(h);
 const cam2=new THREE.PerspectiveCamera(p.fov||24,1,.05,50);cam2.position.set(h.x+.08,h.y+.05+(p.dy||0),h.z+(p.d||.95));cam2.lookAt(h.x,h.y-.04+(p.dy||0),h.z);
 renderer.setClearColor(0,0);renderer.clear();renderer.render(scene,cam2);const u=renderer.domElement.toDataURL('image/png');scene.remove(R.root);return u;};
