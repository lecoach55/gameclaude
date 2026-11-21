import bpy,sys,numpy as np
# matériau non éclairé → Principled éclairé ; texture désaturée et teintée dans ses pixels (l'export glTF ignore les nœuds intermédiaires)
src,dst,sat,teinte=sys.argv[-4],sys.argv[-3],float(sys.argv[-2]),np.array([float(x) for x in sys.argv[-1].split(',')])
bpy.ops.wm.read_homefile(use_empty=True);bpy.ops.import_scene.gltf(filepath=src)
for o in list(bpy.data.objects):
    if o.name.startswith('Icosphere'): bpy.data.objects.remove(o)
fait=set()
for m in bpy.data.materials:
    N=m.node_tree.nodes;L=m.node_tree.links;t=next((n for n in N if n.type=='TEX_IMAGE'),None);out=next(n for n in N if n.type=='OUTPUT_MATERIAL')
    if not t: continue
    im=t.image
    if im.name not in fait:
        p=np.array(im.pixels[:]).reshape(-1,4);g=(p[:,:3]@np.array([.3,.59,.11]))[:,None]
        p[:,:3]=np.clip((g+(p[:,:3]-g)*sat)*teinte,0,1);im.pixels[:]=p.ravel();im.pack();fait.add(im.name)
    for n in [n for n in N if n.type in ('EMISSION','MIX_SHADER','BSDF_TRANSPARENT','LIGHT_PATH')]: N.remove(n)
    b=N.new('ShaderNodeBsdfPrincipled');L.new(t.outputs['Color'],b.inputs['Base Color']);L.new(t.outputs['Alpha'],b.inputs['Alpha']);b.inputs['Roughness'].default_value=.6;L.new(b.outputs[0],out.inputs['Surface'])
bpy.ops.export_scene.gltf(filepath=dst)
