// Prépare un personnage Mixamo (GLB) pour l'arène, à la place de xbot.glb (demande dec1117-cage).
// Usage : node outils/prep_perso.mjs source.glb [sommets_visés=12000] [sortie=jeu/perso.glb]
// - animations retirées (les poses sont calculées par arene.js), textures retirées (la matière est peinte dans le shader),
// - vérifie que le squelette a tous les os mixamorig utilisés par les poses (CHILD dans arene.js),
// - simplifie jusqu'au nombre de sommets visé (xbot actuel : 11 294) puis compresse en meshopt,
// - liste les maillages (peau continue attendue : corps, plus short et tête séparés si le modèle les a).
// Un FBX Mixamo se convertit d'abord en GLB (valdragon/outils/ressources/mxbuild.py, FBXLoader + GLTFExporter dans Chrome).
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune,dedup,weld,simplify,meshopt} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder,MeshoptSimplifier} from 'meshoptimizer';
await MeshoptEncoder.ready;await MeshoptDecoder.ready;await MeshoptSimplifier.ready;
const [src,cible='12000',out='jeu/perso.glb']=process.argv.slice(2);
if(!src){console.error('usage : node outils/prep_perso.mjs source.glb [sommets] [sortie]');process.exit(2);}
const OS=['Hips','Spine','Spine1','Spine2','Neck','Head','LeftArm','LeftForeArm','LeftHand','RightArm','RightForeArm','RightHand',
 'LeftUpLeg','LeftLeg','LeftFoot','LeftToeBase','RightUpLeg','RightLeg','RightFoot','RightToeBase'];
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(src);const root=doc.getRoot();
const noms=new Set(root.listNodes().map(n=>n.getName().replace(/^mixamorig[0-9]*:?/,'')));
const manque=OS.filter(n=>!noms.has(n));
if(manque.length){console.error('os manquants pour les poses :',manque.join(', '));process.exit(1);}
for(const a of root.listAnimations())a.dispose();
for(const t of root.listTextures())t.dispose();
// coordonnées de texture inutiles (aucune image) : ≈ 15 % du poids en moins
for(const m of root.listMeshes())for(const p of m.listPrimitives())for(const k of p.listSemantics())if(/^TEXCOORD_/.test(k)){const a=p.getAttribute(k);p.setAttribute(k,null);a.dispose();}
const compte=()=>{let v=0;for(const m of root.listMeshes())for(const p of m.listPrimitives())v+=p.getAttribute('POSITION').getCount();return v;};
const v0=compte();const ratio=Math.min(1,+cible/v0);
const T=[prune(),dedup()];if(ratio<1)T.push(weld(),simplify({simplifier:MeshoptSimplifier,ratio,error:.002}));T.push(meshopt({encoder:MeshoptEncoder,level:'medium'}));
await doc.transform(...T);
for(const m of root.listMeshes())console.log('maillage',m.getName(),m.listPrimitives().map(p=>p.getAttribute('POSITION').getCount()).join('+'),'sommets');
await io.write(out,doc);
const {statSync}=await import('fs');
console.log(out,'sommets',v0,'→',compte(),'·',(statSync(out).size/1024).toFixed(0),'Kio · os des poses : tous présents');
