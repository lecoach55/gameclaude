"""Imposteur du fort de la carte (Bastion), rendu dans Blender (Cycles) à partir de Poly Haven modular_fort_01 (CC0).
Usage : /home/claude/bpyenv/bin/python imp_fort.py <dossier_modeles_polyhaven> <sortie.webp>
Même convention que outils/studio3d/imposteur.py (vue 'h' = 52°, caméra au sud, soleil = AMB.dir de rendu3d.js).
Écrit aussi <sortie>.json : w, h, px, py (pied), ppm, haut, larg.
"""
import bpy, math, sys, json, mathutils
from bpy_extras.object_utils import world_to_camera_view
M, OUT = sys.argv[-2], sys.argv[-1]
bpy.ops.wm.read_homefile(use_empty=True); sc = bpy.context.scene
before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=f'{M}/modular_fort_01/modular_fort_01.gltf')
F = {o.name: o for o in bpy.data.objects if o not in before and o.type == 'MESH'}
for o in list(F.values()) + [o for o in bpy.data.objects if o not in before and o.type != 'MESH']:
    for c in o.users_collection: c.objects.unlink(o)
def place(src, rz=0, s=1):
    o = bpy.data.objects.new(src.name + '_i', src.data); o.rotation_euler = (0, 0, rz); o.scale = (s, s, s); sc.collection.objects.link(o); return o
def caler(o, x, y):
    bpy.context.view_layer.update(); bb = [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]
    o.location.x += x - sum(v.x for v in bb) / 8; o.location.y += y - sum(v.y for v in bb) / 8; o.location.z -= min(v.z for v in bb)
def pl(src, x, y, rz=0, s=1): o = place(src, rz, s); caler(o, x, y); return o
def plw(x, y, rz, long): o = place(W, rz, 1); o.scale = (.75, long / 14.6, .75); caler(o, x, y); return o
T = F['modular_fort_01_tower_round']; W = F['modular_fort_01_wall_thick_straight_01']; G = F['modular_fort_01_wall_thin_gate_01']
for x, y in [(-10, -10), (10, -10), (-10, 10), (10, 10)]: pl(T, x, y, 0, .52)
plw(-10, 0, 0, 12.5); plw(10, 0, 0, 12.5); plw(0, 10, math.pi / 2, 12.5)
plw(-6.1, -10, math.pi / 2, 4.2); plw(6.1, -10, math.pi / 2, 4.2); pl(G, 0, -10, math.pi / 2, .75)
pl(T, 0, 2, 0, .62)
bpy.context.view_layer.update()
pts = [o.matrix_world @ mathutils.Vector(c) for o in sc.objects if o.type == 'MESH' for c in o.bound_box]
haut = max(p.z for p in pts); larg = max(p.x for p in pts) - min(p.x for p in pts)
# sol attrape-ombre (ombre de contact cuite dans l'image)
bpy.ops.mesh.primitive_plane_add(size=80); bpy.context.object.is_shadow_catcher = True
# lumière : AMB.dir three (-.75,.62,.45) -> blender (x, -z, y)
d = mathutils.Vector((-.75, -.45, .62)).normalized()
ld = bpy.data.lights.new('soleil', 'SUN'); ld.energy = 4.5; ld.color = (1, .89, .75); ld.angle = math.radians(3)
lo = bpy.data.objects.new('soleil', ld); lo.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler(); sc.collection.objects.link(lo)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (.62, .72, .9, 1); bg.inputs[1].default_value = .55
# caméra orthographique à 52° depuis le sud
el = math.radians(52); cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cd.ortho_scale = larg * 1.45
cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (0, -100 * math.cos(el), 100 * math.sin(el) + haut * .35); cam.rotation_euler = (math.pi / 2 - el, 0, 0)
R = 768; sc.render.resolution_x = sc.render.resolution_y = R
sc.render.engine = 'CYCLES'; sc.cycles.samples = 64; sc.cycles.use_denoising = True; sc.render.film_transparent = True
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Base Contrast'
png = OUT.rsplit('.', 1)[0] + '_brut.png'; sc.render.filepath = png; bpy.ops.render.render(write_still=True)
p = world_to_camera_view(sc, cam, mathutils.Vector((0, -15, 0)))
from PIL import Image
im = Image.open(png).convert('RGBA'); bb = im.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox(); im = im.crop(bb)
px, py = p.x * R - bb[0], (1 - p.y) * R - bb[1]
im.save(OUT, 'WEBP', quality=84, method=6)
json.dump({'w': im.width, 'h': im.height, 'px': round(px, 1), 'py': round(py, 1), 'ppm': round(R / cd.ortho_scale, 3), 'haut': round(haut, 2), 'larg': round(larg, 2)}, open(OUT + '.json', 'w'))
print('FINI', OUT, im.size)
