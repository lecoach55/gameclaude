import bpy,sys,math,mathutils
# fige un modèle à la pose de repos (armature appliquée puis supprimée), rotation optionnelle autour de X
src,dst,ang=sys.argv[-3],sys.argv[-2],float(sys.argv[-1])
bpy.ops.wm.read_homefile(use_empty=True);bpy.ops.import_scene.gltf(filepath=src)
import os
POSE=os.environ.get('POSE')
for a in bpy.data.objects:
    if a.type=='ARMATURE' and not POSE: a.data.pose_position='REST'; a.animation_data_clear()
if POSE: bpy.context.scene.frame_set(int(POSE))
bpy.context.view_layer.update()
for o in [o for o in bpy.data.objects if o.type=='MESH']:
    if o.data.shape_keys: o.shape_key_clear()
    bpy.context.view_layer.objects.active=o
    for m in list(o.modifiers):
        if m.type=='ARMATURE':
            with bpy.context.temp_override(object=o): bpy.ops.object.modifier_apply(modifier=m.name)
    mw=o.matrix_world.copy(); o.parent=None; o.matrix_world=mw
for a in [o for o in bpy.data.objects if o.type!='MESH' or o.name.startswith('Icosphere')]: bpy.data.objects.remove(a)
for ac in list(bpy.data.actions): bpy.data.actions.remove(ac)
R=mathutils.Matrix.Rotation(math.radians(ang),4,'X')
for o in bpy.data.objects: o.matrix_world=R@o.matrix_world
bpy.context.view_layer.update()
for o in bpy.data.objects: print('obj',o.name,[round(x,2) for x in o.dimensions],len(o.data.polygons))
bpy.ops.export_scene.gltf(filepath=dst)
