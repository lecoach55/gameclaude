"""Imposteur du fort de la carte (Bastion), rendu dans Blender (Cycles) à partir de Poly Haven modular_fort_01 (CC0).
# FORT_ELEV : 52° (carte, défaut) ou ~8° (vue de la ville) ; FORT_R : résolution ; FORT_STYLE : bastion|horde|necropole|sylve
Usage : /home/claude/bpyenv/bin/python imp_fort.py <dossier_modeles_polyhaven> <sortie.webp>
Même convention que outils/studio3d/imposteur.py (vue 'h' = 52°, caméra au sud, soleil = AMB.dir de rendu3d.js).
Écrit aussi <sortie>.json : w, h, px, py (pied), ppm, haut, larg.
"""
import bpy, math, sys, json, mathutils, os
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
M, OUT = sys.argv[-2], sys.argv[-1]
STY = os.environ.get('FORT_STYLE', 'bastion')
# teinte des toits, des murs, de la roche ; hauteur relative des toits ; disposition
ST = {'bastion': dict(toit=(.55, .65, .95, 1), mur=None, roc=None, ht=3.2),
      'horde': dict(toit=(1.0, .42, .26, 1), mur=(.85, .62, .48, 1), roc=(.95, .68, .5, 1), ht=1.7),
      'necropole': dict(toit=(.2, .28, .26, 1), mur=(.38, .4, .45, 1), roc=(.42, .4, .46, 1), ht=5.2),
      'sylve': dict(toit=(.42, .78, .4, 1), mur=(1.0, .93, .8, 1), roc=(.85, .95, .75, 1), ht=2.6)}[STY]
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
TX = os.path.dirname(M.rstrip('/'))
def teinter(m, c):
    if not m or not m.use_nodes: return
    N = m.node_tree.nodes; L = m.node_tree.links; b = next((n for n in N if n.type == 'BSDF_PRINCIPLED'), None)
    if not b or not b.inputs['Base Color'].links: return
    src = b.inputs['Base Color'].links[0].from_socket; hs = N.new('ShaderNodeMixRGB'); hs.blend_type = 'MULTIPLY'; hs.inputs[0].default_value = 1; hs.inputs[2].default_value = c
    L.new(src, hs.inputs[1]); L.new(hs.outputs[0], b.inputs['Base Color'])
if ST['mur']:
    for m in {s.material for o in F.values() for s in o.material_slots if s.material}: teinter(m, ST['mur'])
def matimg(nom, f, nf=None, ech=1.0, teinte=None):
    m = bpy.data.materials.new(nom); m.use_nodes = True; N = m.node_tree.nodes; L = m.node_tree.links; b = N['Principled BSDF']
    tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (ech, ech, ech); L.new(tc.outputs['Object'], mp.inputs[0])
    t = N.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(f); t.projection = 'BOX'; t.projection_blend = .3; L.new(mp.outputs[0], t.inputs[0])
    if teinte:
        hs = N.new('ShaderNodeMixRGB'); hs.blend_type = 'MULTIPLY'; hs.inputs[0].default_value = 1; hs.inputs[2].default_value = teinte; L.new(t.outputs[0], hs.inputs[1]); L.new(hs.outputs[0], b.inputs['Base Color'])
    else: L.new(t.outputs[0], b.inputs['Base Color'])
    if nf:
        n = N.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(nf); n.image.colorspace_settings.name = 'Non-Color'; n.projection = 'BOX'; L.new(mp.outputs[0], n.inputs[0])
        nm = N.new('ShaderNodeNormalMap'); L.new(n.outputs[0], nm.inputs['Color']); L.new(nm.outputs[0], b.inputs['Normal'])
    b.inputs['Roughness'].default_value = .85; return m
ARD = matimg('ardoise', f'{TX}/roof_slates_02_Diffuse.jpg', f'{TX}/roof_slates_02_nor_gl.jpg', .5, ST['toit'])
ROC = matimg('roc', f'{TX}/rocky_terrain_02_Diffuse.jpg', f'{TX}/rocky_terrain_02_nor_gl.jpg', .12, ST['roc'])
# FORT_SOL (23/11) : butte de neige (n), de sable (s) ou de basalte (l) pour les châteaux posés sur ces terrains
SOL = os.environ.get('FORT_SOL', '')
if SOL: ROC = matimg('roc_' + SOL, f'{TX}/rocky_terrain_02_Diffuse.jpg', f'{TX}/rocky_terrain_02_nor_gl.jpg', .12, {'n': (2.6, 2.75, 3.0, 1), 's': (1.9, 1.35, .75, 1), 'l': (.3, .26, .25, 1)}[SOL])
if SOL:  # texture désaturée avant la teinte (la roche Poly Haven est verdâtre)
    N = ROC.node_tree.nodes; L = ROC.node_tree.links; mix = next(n for n in N if n.type == 'MIX_RGB'); tx = mix.inputs[1].links[0].from_socket
    hs = N.new('ShaderNodeHueSaturation'); hs.inputs['Saturation'].default_value = 0; L.new(tx, hs.inputs['Color']); L.new(hs.outputs[0], mix.inputs[1])
    mix.inputs[2].default_value = {'n': (2.3, 2.45, 2.75, 1), 's': (1.45, 1.05, .6, 1), 'l': (.28, .25, .24, 1)}[SOL]
# butte rocheuse
from mathutils import noise
bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=48, radius=1); bt = bpy.context.object
for v in bt.data.vertices:
    x, y, z = v.co; r = 17 + 3 * noise.noise(Vector((x * 2, y * 2, z * 2)))
    v.co = Vector((x * r, y * r * .95, max(-1, z) * 7 + 2.2 * noise.fractal(Vector((x * 3, y * 3, z * 3)), .6, 2, 4)))
    if v.co.z > 5.2: v.co.z = 5.2 + (v.co.z - 5.2) * .15
bt.data.materials.append(ROC); bpy.ops.object.shade_smooth()
FZ = 5.4
def pl(src, x, y, rz=0, s=1, sz=None):
    o = place(src, rz, s)
    if sz: o.scale = (s, s, sz)
    caler(o, x, y); o.location.z += FZ; return o
def plw(x, y, rz, long): o = place(W, rz, 1); o.scale = (.75, long / 14.6, .75); caler(o, x, y); o.location.z += FZ; return o
def toit(x, y, ztop, r, h):
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=r, depth=h, location=(x, y, ztop + h / 2)); c = bpy.context.object; c.data.materials.append(ARD)
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=r * .06, depth=h * .35, location=(x, y, ztop + h + h * .17)); bpy.context.object.data.materials.append(ARD)
def tour(x, y, s, sz):
    o = pl(T, x, y, 0, s, sz); bpy.context.view_layer.update(); bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
    r = (max(v.x for v in bb) - min(v.x for v in bb)) / 2; zt = max(v.z for v in bb); toit(x, y, zt - .2, r * .9, r * ST['ht'])
for x, y in [(-10, -10), (10, -10), (-10, 10), (10, 10)]: tour(x, y, .52, .52 * 2.1)
plw(-10, 0, 0, 12.5); plw(10, 0, 0, 12.5); plw(0, 10, math.pi / 2, 12.5)
plw(-6.1, -10, math.pi / 2, 4.2); plw(6.1, -10, math.pi / 2, 4.2); pl(G, 0, -10, math.pi / 2, .75)
if STY == 'horde': tour(0, 3, .75, .75 * 2.4); tour(-5, 5, .45, .45 * 2.6)
elif STY == 'necropole': tour(0, 3, .55, .55 * 4.6); tour(-4.5, 6, .28, .28 * 6.2); tour(5, 5.5, .28, .28 * 5.6); tour(0, 8, .22, .22 * 7)
else: tour(0, 3, .62, .62 * 3.4); tour(-4.5, 6, .3, .3 * 4.6); tour(5, 5.5, .32, .32 * 4.0)
if STY == 'sylve':
    import random; random.seed(3); bf = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=f'{M}/island_tree_02/island_tree_02.gltf')
    A = [o for o in bpy.data.objects if o not in bf and o.type == 'MESH']; arb = max(A, key=lambda o: len(o.data.vertices))
    for o in [o for o in bpy.data.objects if o not in bf]:
        for c in o.users_collection: c.objects.unlink(o)
    for x, y in [(-15, -4), (15, -2), (-13, 8), (14, 9), (-7, 14), (7, 14), (0, 15)]:
        o = place(arb, random.random() * 6.28, 1); bpy.context.view_layer.update(); bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
        k = random.uniform(9, 13) / (max(v.z for v in bb) - min(v.z for v in bb)); o.scale = (k, k, k); caler(o, x, y); o.location.z += 3.5
bpy.context.view_layer.update()
pts = [o.matrix_world @ mathutils.Vector(c) for o in sc.objects if o.type == 'MESH' for c in o.bound_box]
haut = max(p.z for p in pts); larg = max(p.x for p in pts) - min(p.x for p in pts)
# sol attrape-ombre (ombre de contact cuite dans l'image)

# lumière : AMB.dir three (-.75,.62,.45) -> blender (x, -z, y)
d = mathutils.Vector((-.75, -.45, .62)).normalized()
ld = bpy.data.lights.new('soleil', 'SUN'); ld.energy = 4.5; ld.color = (1, .89, .75); ld.angle = math.radians(3)
lo = bpy.data.objects.new('soleil', ld); lo.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler(); sc.collection.objects.link(lo)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (.62, .72, .9, 1); bg.inputs[1].default_value = .55
# caméra orthographique à 52° depuis le sud
el = math.radians(float(os.environ.get('FORT_ELEV', '52'))); cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cd.ortho_scale = max(larg, haut * 1.05) * 1.3
cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (0, -100 * math.cos(el), 100 * math.sin(el) + haut * .35); cam.rotation_euler = (math.pi / 2 - el, 0, 0)
R = int(os.environ.get('FORT_R', '1100')); sc.render.resolution_x = sc.render.resolution_y = R
sc.render.engine = 'CYCLES'; sc.cycles.samples = 64; sc.cycles.use_denoising = True; sc.render.film_transparent = True
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Base Contrast'
png = OUT.rsplit('.', 1)[0] + '_brut.png'; sc.render.filepath = png; bpy.ops.render.render(write_still=True)
p = world_to_camera_view(sc, cam, mathutils.Vector((0, -17, 0)))
from PIL import Image
im = Image.open(png).convert('RGBA'); bb = im.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox(); im = im.crop(bb)
px, py = p.x * R - bb[0], (1 - p.y) * R - bb[1]
im.save(OUT, 'WEBP', quality=84, method=6)
json.dump({'w': im.width, 'h': im.height, 'px': round(px, 1), 'py': round(py, 1), 'ppm': round(R / cd.ortho_scale, 3), 'haut': round(haut, 2), 'larg': round(larg, 2)}, open(OUT + '.json', 'w'))
print('FINI', OUT, im.size)
