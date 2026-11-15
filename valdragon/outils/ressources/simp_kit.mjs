// Simplifie la géométrie d'un pack de décor (même aspect, moins de triangles)
import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {meshopt,weld,simplify,dedup,prune} from '@gltf-transform/functions';import {MeshoptEncoder,MeshoptDecoder,MeshoptSimplifier} from 'meshoptimizer';
await MeshoptEncoder.ready;await MeshoptDecoder.ready;await MeshoptSimplifier.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const [src,dst,ratio,err]=[process.argv[2],process.argv[3],+process.argv[4],+process.argv[5]];
const d=await io.read(src);const cnt=()=>{let t=0;for(const m of d.getRoot().listMeshes())for(const p of m.listPrimitives())t+=(p.getIndices()?p.getIndices().getCount():p.getAttribute('POSITION').getCount())/3;return t;};
const t0=cnt();
await d.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio,error:err,lockBorder:process.argv[6]==="lock"}),dedup(),prune(),meshopt({encoder:MeshoptEncoder,level:'medium'}));
console.log(src,'triangles',t0,'->',cnt());await io.write(dst,d);
