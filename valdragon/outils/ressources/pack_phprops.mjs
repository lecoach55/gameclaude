// Décors photoréalistes Poly Haven (CC0) -> mq/phprops.glb
// Chaque nœud porte le NOM de la pièce KayKit qu'il remplace (le jeu les substitue automatiquement, taille ajustée par fitH).
// usage : node pack_phprops.mjs /home/claude/dl/models
import {NodeIO,Document} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {mergeDocuments,dedup,prune,weld,simplify,textureCompress,meshopt,unpartition} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptSimplifier} from 'meshoptimizer';import sharp from 'sharp';
await MeshoptEncoder.ready;await MeshoptSimplifier.ready;
const SRC=process.argv[2]||'/home/claude/dl/models';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
const D=Math.PI/180;
// [modèle, [x,y,z], rotation [x,y,z] en degrés, échelle]
const RECIPES={
 barrel_large:[['wine_barrel_01']],
 barrel_large_decorated:[['wine_barrel_01'],['brass_pot_01',[0,.87,0],[0,40,0]]],
 keg_decorated:[['wine_barrel_01',[0,.37,0],[0,0,90]]],
 barrel_small_stack:[['wine_barrel_01',[-.38,.37,0],[0,0,90]],['wine_barrel_01',[.38,.37,0],[0,0,90]],['wine_barrel_01',[0,1.0,0],[0,0,90]]],
 barrel_small:[['wooden_bucket_01']],
 crates_stacked:[['wooden_crate_02'],['wooden_crate_01',[0,.46,0],[0,80,0]]],
 box_stacked:[['wooden_crate_01'],['wooden_crate_01',[.05,.35,0],[0,25,0]]],
 box_large:[['wooden_crate_02',[0,0,0],[0,90,0]]],
 trunk_large_A:[['wooden_crate_01']],
 table_long_decorated_A:[['WoodenTable_01'],['ceramic_pot',[.5,.55,0],[0,30,0],.5]],
 table_long_tablecloth_decorated_A:[['WoodenTable_01'],['brass_pot_01',[-.5,.55,.05],[0,0,0],.8]],
 table_medium_decorated_A:[['WoodenTable_01',[0,0,0],[0,0,0],[.7,1,1]],['brass_pot_01',[.2,.55,0]]],
 chair:[['wooden_stool_02']],
 shelves:[['wooden_bookshelf_worn']],
 shelf_large:[['wooden_bookshelf_worn']],
 sword_shield:[['kite_shield',[0,.65,0],[-12,0,0]],['wooden_axe',[.3,.3,.12],[-15,20,-18]]],
 rubble_half:[['moon_rock_02',[0,0,0],[0,0,0],1.6],['moon_rock_02',[.3,0,.15],[0,120,10],1.0],['moon_rock_02',[-.2,0,.25],[0,220,0],.8]],
 statue:[['gothic_statue',[0,0,0],[0,180,0]]],
 rock_scatter:[['moon_rock_02#lo',[0,0,0],[0,0,0],1.6]],
 // 18/11 : coffres, bougeoirs et rochers « jouets » KayKit -> Poly Haven (le couvercle garde son nom *_lid pour l'animation d'ouverture)
 chest:[['treasure_chest']],
 chest_gold:[['treasure_chest']],/* teinte or posée dans kit.js (même géométrie, dédoublonnée) */
 candle_triple:[['brass_candleholders']],
 Rock_1_A:[['rock_07#lo']],Rock_1_E:[['rock_07#lo',[0,0,0],[0,140,0],[1,.8,1.2]]],Rock_1_J:[['rock_07#lo',[0,0,0],[0,250,0],[1.3,.7,1]]],
 Rock_2_A:[['moon_rock_02#lo',[0,0,0],[0,0,0],1.6],['moon_rock_02#lo',[.3,0,.15],[0,120,10],1.0]],Rock_2_C:[['moon_rock_02#lo',[0,0,0],[0,70,0],1.5],['moon_rock_02#lo',[-.25,0,.2],[0,200,0],.9]],Rock_2_F:[['rock_07#lo',[0,0,0],[0,40,0],[1.4,.6,1.4]]],
 Rock_3_A:[['rock_07#lo',[0,0,0],[0,90,0],[1,1.6,1]]],Rock_3_E:[['rock_07#lo',[0,0,0],[0,300,0],[.9,1.4,1.1]]],Rock_3_Q:[['rock_07#lo',[0,0,0],[0,180,0],[1.1,1.5,.9]]],
 rubble_large:[['moon_rock_02',[0,0,0],[0,0,0],2.4],['moon_rock_02',[.45,0,.2],[0,120,10],1.5],['moon_rock_02',[-.35,0,.35],[0,220,0],1.2],['moon_rock_02',[.1,0,-.4],[0,60,0],1.0]],
};
const SIMP={treasure_chest:.03,brass_candleholders:.06,'rock_07#lo':.014,gothic_statue:.12,'moon_rock_02#lo':.03,wine_barrel_01:.13,wooden_bookshelf_worn:.3,kite_shield:.25,moon_rock_02:.35,wooden_crate_01:.4,wooden_crate_02:.45,wooden_bucket_01:.45,wooden_stool_02:.25,ceramic_pot:.4,brass_pot_01:.4,wooden_axe:.5,WoodenTable_01:1};
const TINT={rock_07:[.62,.6,.58],gothic_statue:[.6,.6,.62],moon_rock_02:[.42,.4,.38],wooden_bookshelf_worn:[.5,.42,.36]};
const out=new Document();const scene=out.createScene('phprops');const cache={};
async function src(name){if(cache[name])return cache[name];const base=name.split('#')[0];const d=await io.read(`${SRC}/${base}/${base}.gltf`);
 const T=TINT[name]||TINT[base];if(T)d.getRoot().listMaterials().forEach(m=>{const f=m.getBaseColorFactor();m.setBaseColorFactor([f[0]*T[0],f[1]*T[1],f[2]*T[2],f[3]]);});
 const map=mergeDocuments(out,d);// copie dans le document de sortie
 const nodes=[];d.getRoot().listScenes()[0].traverse(n=>{if(n.getMesh()&&!/_lock$/.test(n.getName()))nodes.push({mesh:map.get(n.getMesh()),m:n.getWorldMatrix(),nm:n.getName()});});/* serrure du coffre retirée : elle resterait en l'air à l'ouverture */
 out.getRoot().listScenes().filter(s=>s!==scene).forEach(s=>s.dispose());
 nodes.forEach(n=>n.mesh.setName(name));return cache[name]=nodes;}
function mat4(t=[0,0,0],r=[0,0,0],s=1){const S=Array.isArray(s)?s:[s,s,s];const [a,b,c]=r.map(v=>v*D);
 const cx=Math.cos(a),sx=Math.sin(a),cy=Math.cos(b),sy=Math.sin(b),cz=Math.cos(c),sz=Math.sin(c);
 // R = Ry * Rx * Rz (rotation y en dernier)
 const R=[[cy*cz+sy*sx*sz,-cy*sz+sy*sx*cz,sy*cx],[cx*sz,cx*cz,-sx],[-sy*cz+cy*sx*sz,sy*sz+cy*sx*cz,cy*cx]];
 return [R[0][0]*S[0],R[1][0]*S[0],R[2][0]*S[0],0,R[0][1]*S[1],R[1][1]*S[1],R[2][1]*S[1],0,R[0][2]*S[2],R[1][2]*S[2],R[2][2]*S[2],0,t[0],t[1],t[2],1];}
function mul(a,b){const o=new Array(16).fill(0);for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let k=0;k<4;k++)o[j*4+i]+=a[k*4+i]*b[j*4+k];return o;}
for(const [name,parts] of Object.entries(RECIPES)){const root=out.createNode(name);scene.addChild(root);
 for(const [m,t,r,s] of parts){for(const n of await src(m)){const c=out.createNode(/_lid$/.test(n.nm)?n.nm:m).setMesh(n.mesh).setMatrix(mul(mat4(t,r,s),n.m));root.addChild(c);}}}
// simplification par modèle
for(const mesh of out.getRoot().listMeshes()){const ratio=SIMP[mesh.getName()]??.5;if(ratio>=1)continue;
 const tmp=new Document();} 
await out.transform(weld({tolerance:.0001}));
for(const [n,ratio] of Object.entries(SIMP)){if(ratio>=1)continue;
 const meshes=out.getRoot().listMeshes().filter(m=>m.getName()===n);
 const {simplifyPrimitive}=await import('@gltf-transform/functions');
 for(const m of meshes)for(const p of m.listPrimitives()){const b=p.getIndices().getCount();simplifyPrimitive(p,{simplifier:MeshoptSimplifier,ratio,error:.02,lockBorder:false});console.log(n,b/3,'->',p.getIndices().getCount()/3);}}
await out.transform(dedup(),prune(),unpartition(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[384,384],quality:70}),meshopt({encoder:MeshoptEncoder,level:'medium'}));
await io.write('mq/phprops.glb',out);
let tri=0;out.getRoot().listMeshes().forEach(m=>m.listPrimitives().forEach(p=>tri+=(p.getIndices()?p.getIndices().getCount():0)/3));
console.log('phprops.glb',(await import('fs')).statSync('mq/phprops.glb').size,'octets',Math.round(tri),'triangles',out.getRoot().listTextures().length,'textures');
