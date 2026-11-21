"""Imposteur d'un modèle GLB (bâtiment de ville) rendu dans Blender (Cycles), vu presque de face (FORT_ELEV, défaut 8°).
Usage : /home/claude/bpyenv/bin/python imp_glb.py modele.glb sortie.webp [rotation_z_degres]
Même convention que imp_fort.py : caméra au sud, soleil = AMB.dir de rendu3d.js. Écrit aussi <sortie>.json (w, h, px, py = pied au centre de l'emprise, ppm, haut, larg)."""
import bpy, math, sys, json, os, mathutils
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
a = [x for x in sys.argv[sys.argv.index('--') + 1:]] if '--' in sys.argv else sys.argv[-3:]
SRC, OUT = a[0], a[1]; RZ = float(a[2]) if len(a) > 2 else 0
bpy.ops.wm.read_homefile(use_empty=True); sc = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=SRC)
for o in list(bpy.data.objects):
    if o.name.startswith('Icosphere') or o.type in ('CAMERA', 'LIGHT'): bpy.data.objects.remove(o)
roots = [o for o in bpy.data.objects if o.parent is None]
R = mathutils.Matrix.Rotation(math.radians(RZ), 4, 'Z')
for o in roots: o.matrix_world = R @ o.matrix_world
bpy.context.view_layer.update()
pts = [o.matrix_world @ Vector(c) for o in bpy.data.objects if o.type == 'MESH' for c in o.bound_box]
mn = Vector([min(p[i] for p in pts) for i in range(3)]); mx = Vector([max(p[i] for p in pts) for i in range(3)])
haut = mx.z - mn.z; larg = mx.x - mn.x; c = (mn + mx) / 2
d = Vector((-.75, -.45, .62)).normalized()
ld = bpy.data.lights.new('soleil', 'SUN'); ld.energy = 4.5; ld.color = (1, .89, .75); ld.angle = math.radians(3)
lo = bpy.data.objects.new('soleil', ld); lo.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler(); sc.collection.objects.link(lo)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (.62, .72, .9, 1); bg.inputs[1].default_value = .6
el = math.radians(float(os.environ.get('FORT_ELEV', '8'))); cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'
cd.ortho_scale = max(larg, haut * 1.05, mx.y - mn.y) * 1.25
cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (c.x, c.y - 100 * math.cos(el), c.z + 100 * math.sin(el)); cam.rotation_euler = (math.pi / 2 - el, 0, 0)
RES = int(os.environ.get('FORT_R', '900')); sc.render.resolution_x = sc.render.resolution_y = RES
sc.render.engine = 'CYCLES'; sc.cycles.samples = 48; sc.cycles.use_denoising = True; sc.render.film_transparent = True
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Base Contrast'
png = OUT.rsplit('.', 1)[0] + '_brut.png'; sc.render.filepath = png; bpy.ops.render.render(write_still=True)
p = world_to_camera_view(sc, cam, Vector((c.x, c.y, mn.z)))
from PIL import Image
im = Image.open(png).convert('RGBA'); bb = im.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox(); im = im.crop(bb)
px, py = p.x * RES - bb[0], (1 - p.y) * RES - bb[1]
im.save(OUT, 'WEBP', quality=84, method=6)
json.dump({'w': im.width, 'h': im.height, 'px': round(px, 1), 'py': round(py, 1), 'ppm': round(RES / cd.ortho_scale, 3), 'haut': round(haut, 2), 'larg': round(larg, 2)}, open(OUT + '.json', 'w'))
print('FINI', OUT, im.size)
