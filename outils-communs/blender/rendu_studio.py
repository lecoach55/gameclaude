"""Rendu Cycles d'un modèle GLB en lumière de studio « peinture de jeu » (Blender 5 dans le cloud).
Usage : /home/claude/bpyenv/bin/python outils-communs/blender/rendu_studio.py modele.glb sortie.png [taille=512] [echantillons=64] [angle=35]
Fond transparent, lumière clé chaude + contre-jour froid + ciel, ombre de contact au sol (catcher), occlusion ambiante.
"""
import bpy, sys, math, mathutils
a = sys.argv[1:]
src, out = a[0], a[1]
taille = int(a[2]) if len(a) > 2 else 512
ech = int(a[3]) if len(a) > 3 else 64
ang = float(a[4]) if len(a) > 4 else 35
bpy.ops.wm.read_homefile(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
mn = mathutils.Vector((1e9,)*3); mx = -mn
for o in objs:
    for c in o.bound_box:
        w = o.matrix_world @ mathutils.Vector(c); mn = mathutils.Vector(map(min, mn, w)); mx = mathutils.Vector(map(max, mx, w))
ctr = (mn + mx) / 2; dim = max(mx - mn)
sc = bpy.context.scene
# sol attrape-ombre
bpy.ops.mesh.primitive_plane_add(size=dim * 6, location=(ctr.x, ctr.y, mn.z))
sol = bpy.context.object; sol.is_shadow_catcher = True
# lumières
def soleil(nom, rot, force, coul, ang_deg):
    d = bpy.data.lights.new(nom, 'SUN'); d.energy = force; d.color = coul; d.angle = math.radians(ang_deg)
    o = bpy.data.objects.new(nom, d); o.rotation_euler = [math.radians(r) for r in rot]; sc.collection.objects.link(o)
soleil('cle', (50, 0, 35), 4.0, (1.0, .92, .80), 6)
soleil('contre', (60, 0, 200), 2.5, (.70, .80, 1.0), 3)
w = bpy.data.worlds.new('ciel'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (.55, .62, .75, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .6
# caméra
cd = bpy.data.cameras.new('cam'); cd.lens = 70
cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam); sc.camera = cam
r = dim * 2.6; t = math.radians(ang)
cam.location = (ctr.x + r * math.cos(t) * .8, ctr.y - r * math.cos(t), ctr.z + r * math.sin(t))
cam.rotation_euler = (ctr - cam.location).to_track_quat('-Z', 'Y').to_euler()
sc.render.engine = 'CYCLES'; sc.cycles.samples = ech; sc.cycles.use_denoising = True
sc.render.film_transparent = True; sc.render.resolution_x = sc.render.resolution_y = taille
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
sc.render.filepath = out; bpy.ops.render.render(write_still=True)
print('rendu :', out)
