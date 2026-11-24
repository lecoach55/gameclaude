"""Piles de ressources de la carte rendues dans Blender (Cycles), vue 52° comme les autres imposteurs.
Usage : /home/claude/bpyenv/bin/python piles.py dossier_sortie  → pile_<res>_h.webp + .json (w, h, px, py, ppm, haut, larg)."""
import bpy, math, sys, os, json, random
from mathutils import Vector, noise
OUT = sys.argv[-1]; os.makedirs(OUT, exist_ok=True)
TX = '/home/claude/gameclaude/bannieres/jeu/tex3d/'
def scene():
    bpy.ops.wm.read_homefile(use_empty=True); sc = bpy.context.scene
    d = Vector((-.75, -.45, .62)).normalized()
    ld = bpy.data.lights.new('s', 'SUN'); ld.energy = 4.5; ld.color = (1, .9, .76); ld.angle = math.radians(4)
    lo = bpy.data.objects.new('s', ld); lo.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler(); sc.collection.objects.link(lo)
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (.45, .5, .35, 1); bg.inputs[1].default_value = .7
    return sc
def mat(nom, c, m=0, r=.5, em=None, tex=None, transm=0, ech=1):
    M = bpy.data.materials.new(nom); M.use_nodes = True; N = M.node_tree.nodes; L = M.node_tree.links; b = N['Principled BSDF']
    b.inputs['Base Color'].default_value = c; b.inputs['Metallic'].default_value = m; b.inputs['Roughness'].default_value = r
    if transm: b.inputs['Transmission Weight'].default_value = transm
    if em: b.inputs['Emission Color'].default_value = em; b.inputs['Emission Strength'].default_value = .6
    if tex:
        tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (ech, ech, ech); L.new(tc.outputs['Object'], mp.inputs[0])
        t = N.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(TX + tex); t.projection = 'BOX'; t.projection_blend = .3; L.new(mp.outputs[0], t.inputs[0])
        mx = N.new('ShaderNodeMixRGB'); mx.blend_type = 'MULTIPLY'; mx.inputs[0].default_value = 1; mx.inputs[2].default_value = c; L.new(t.outputs[0], mx.inputs[1]); L.new(mx.outputs[0], b.inputs['Base Color'])
    return M
def caillou(loc, r, M, g, rug=.35):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=r, location=loc); o = bpy.context.object
    for v in o.data.vertices:
        p = v.co.normalized(); v.co = p * r * (1 + rug * noise.noise(p * 1.7 + Vector((g, g * .3, 0)))); v.co.z *= .7
    o.data.materials.append(M); return o
def cristal(loc, h, r, M, rot):
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=r, radius2=r * .15, depth=h, location=loc, rotation=rot); o = bpy.context.object; o.data.materials.append(M)
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=r, radius2=0, depth=h * .35, location=(loc[0], loc[1], loc[2] + h * .65), rotation=rot); bpy.context.object.data.materials.append(M); return o
def socle():  # petite flaque de terre sombre sous la pile (ancre visuelle)
    bpy.ops.mesh.primitive_circle_add(vertices=40, radius=.55, fill_type='NGON', location=(0, 0, .005)); o = bpy.context.object
    o.data.materials.append(mat('terre', (.09, .07, .045, 1), r=1, tex='sol_terre.jpg', ech=.8)); return o
def rendre(sc, nom):
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in sc.objects if o.type == 'MESH' for c in o.bound_box]
    mn = Vector([min(p[i] for p in pts) for i in range(3)]); mx = Vector([max(p[i] for p in pts) for i in range(3)])
    haut = mx.z - mn.z; larg = mx.x - mn.x
    from bpy_extras.object_utils import world_to_camera_view
    el = math.radians(52); cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cd.ortho_scale = max(larg, mx.y - mn.y, haut) * 1.3
    cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
    c = (mn + mx) / 2; cam.location = (c.x, c.y - 100 * math.cos(el), c.z + 100 * math.sin(el)); cam.rotation_euler = (math.pi / 2 - el, 0, 0)
    R = 300; sc.render.resolution_x = sc.render.resolution_y = R
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 64; sc.cycles.use_denoising = True; sc.render.film_transparent = True
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
    png = f'{OUT}/{nom}_brut.png'; sc.render.filepath = png; bpy.ops.render.render(write_still=True)
    p = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    from PIL import Image
    im = Image.open(png).convert('RGBA'); bb = im.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox(); im = im.crop(bb)
    im.save(f'{OUT}/{nom}_h.webp', 'WEBP', quality=88, method=6)
    json.dump({'w': im.width, 'h': im.height, 'px': round(p.x * R - bb[0], 1), 'py': round((1 - p.y) * R - bb[1], 1), 'ppm': round(R / cd.ortho_scale, 3), 'haut': round(haut, 2), 'larg': round(larg, 2)}, open(f'{OUT}/{nom}_h.webp.json', 'w'))
    print('FINI', nom, im.size)
random.seed(4)
# 23/11 : couleurs franches (plus de verre laiteux ni d'émission qui délavait tout sous AgX), tas plus lisibles, ancrés au sol
def gemme(loc, r, M, rot):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=0, radius=r, location=loc, rotation=rot); o = bpy.context.object; o.scale.z = 1.3; o.data.materials.append(M); return o
# or (24/11) : monceau de pièces à bord sombre (chaque pièce se lit) et lingots
sc = scene(); OR = mat('or', (.85, .55, .12, 1), m=1, r=.22); ORS = mat('ors', (.45, .26, .05, 1), m=1, r=.4)
TOILE = mat('toile', (.85, .7, .48, 1), r=.95, tex='enduit.jpg', ech=2)
for k in range(190):
    a = random.random() * 6.28; d = random.random() ** .6 * .4; z = .2 * (1 - d / .42) ** 1.3 + .015
    x, y = math.cos(a) * d, math.sin(a) * d * .9
    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=.05, depth=.014, location=(x, y, z * random.uniform(.75, 1.05)), rotation=(random.uniform(-.7, .7), random.uniform(-.7, .7), 0))
    o = bpy.context.object; o.data.materials.append(OR); o.data.materials.append(ORS)
    for p in o.data.polygons:
        if abs(p.normal.z) < .5: p.material_index = 1
for x, y, rz in [(-.3, .22, .3), (.28, .25, -.4), (.33, -.12, .9)]:
    bpy.ops.mesh.primitive_cube_add(size=.1, location=(x, y, .035), rotation=(0, 0, rz), scale=(1.7, .75, .6)); bpy.context.object.data.materials.append(OR)
rendre(sc, 'pile_or')
