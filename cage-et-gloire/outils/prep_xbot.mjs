// Prépare le mannequin : animations retirées, maillage simplifié (ratio en argument), compression meshopt
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune,dedup,weld,simplify,meshopt} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptSimplifier} from 'meshoptimizer';
await MeshoptEncoder.ready;await MeshoptSimplifier.ready;
const ratio=+(process.argv[2]||1),out=process.argv[3]||'jeu/xbot.glb';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
const doc=await io.read('dl/Xbot.glb');
for(const a of doc.getRoot().listAnimations())a.dispose();
const T=[prune(),dedup()];if(ratio<1)T.push(weld(),simplify({simplifier:MeshoptSimplifier,ratio,error:.002}));T.push(meshopt({encoder:MeshoptEncoder,level:'medium'}));
await doc.transform(...T);
let v=0;for(const m of doc.getRoot().listMeshes())for(const p of m.listPrimitives())v+=p.getAttribute('POSITION').getCount();
await io.write(out,doc);console.log(out,'sommets',v);
