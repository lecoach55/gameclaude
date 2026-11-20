import bpy,sys,mathutils,math
loup,gob,dst=sys.argv[-3],sys.argv[-2],sys.argv[-1]
bpy.ops.wm.read_homefile(use_empty=True)
def imp(f):
    av=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=f);nv=[o for o in bpy.data.objects if o not in av]
    for a in bpy.data.objects:
        if a in nv and a.type=='ARMATURE':
            if a.animation_data and a.animation_data.action: pass
    bpy.context.scene.frame_set(1);bpy.context.view_layer.update()
    ms=[o for o in nv if o.type=='MESH' and not o.name.startswith('Icosphere')]
    bpy.ops.object.select_all(action='DESELECT')
    for o in ms:
        if o.data.shape_keys: o.shape_key_clear()
        o.select_set(True)
    bpy.context.view_layer.objects.active=ms[0];bpy.ops.object.convert(target='MESH')
    for o in [o for o in nv if o.name in bpy.data.objects and (o.type!='MESH' or o.name.startswith('Icosphere'))]: bpy.data.objects.remove(o)
    for a in list(bpy.data.actions): bpy.data.actions.remove(a)
    ms=[o for o in bpy.data.objects if o in nv or o.name not in [x.name for x in av]]
    ms=[o for o in bpy.data.objects if o not in av]
    pts=[o.matrix_world@v.co for o in ms for v in o.data.vertices]
    mn=mathutils.Vector([min(p[i] for p in pts) for i in range(3)]);mx=mathutils.Vector([max(p[i] for p in pts) for i in range(3)])
    return ms,mn,mx
L,lmn,lmx=imp(loup)
print('loup',lmn,lmx)
G,gmn,gmx=imp(gob)
print('gob',gmn,gmx)
# gobelin : hauteur = 0.75 × hauteur du loup, posé au milieu du dos, enfoncé jusqu'aux hanches
hl=lmx.z-lmn.z;hg=gmx.z-gmn.z;k=hl*.8/hg
cx=(gmn.x+gmx.x)/2;cy=(gmn.y+gmx.y)/2
yd=lmn.y+(lmx.y-lmn.y)*float(sys.argv[-4])
M=mathutils.Matrix.Translation((0,yd,lmn.z+hl*.55))@mathutils.Matrix.Rotation(math.radians(float(sys.argv[-5])),4,'Z')@mathutils.Matrix.Scale(k,4)@mathutils.Matrix.Translation((-cx,-cy,-gmn.z))
for o in G:o.matrix_world=M@o.matrix_world
bpy.ops.export_scene.gltf(filepath=dst)
