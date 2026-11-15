import {NodeIO} from '@gltf-transform/core';import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {meshopt,dedup,weld,prune,center} from '@gltf-transform/functions';import {MeshoptEncoder} from 'meshoptimizer';
await MeshoptEncoder.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
const d=await io.read(process.argv[2]);await d.transform(center({pivot:'below'}),dedup(),weld(),prune(),meshopt({encoder:MeshoptEncoder,level:'medium'}));await io.write(process.argv[3],d);
