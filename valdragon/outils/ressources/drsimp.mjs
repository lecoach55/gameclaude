import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {meshopt,dedup,weld,prune,center,simplify,join,flatten} from '@gltf-transform/functions';import {MeshoptEncoder,MeshoptSimplifier} from 'meshoptimizer';
await MeshoptEncoder.ready;await MeshoptSimplifier.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
const d=await io.read(process.argv[2]);const ratio=+process.argv[4]||.02;
for(const m of d.getRoot().listMeshes())for(const p of m.listPrimitives())for(const t of p.listTargets())p.removeTarget(t);
await d.transform(weld(),...(ratio<1?[simplify({simplifier:MeshoptSimplifier,ratio,error:.02,lockBorder:false})]:[]),center({pivot:'below'}),dedup(),prune(),meshopt({encoder:MeshoptEncoder,level:'medium'}));
let tris=0;for(const m of d.getRoot().listMeshes())for(const p of m.listPrimitives())tris+=(p.getIndices()?p.getIndices().getCount():p.getAttribute('POSITION').getCount())/3;console.log('tris',tris);
await io.write(process.argv[3],d);
