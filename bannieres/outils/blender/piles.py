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
# or : tas de pièces + lingots
sc = scene(); OR = mat('or', (1, .55, .08, 1), m=.75, r=.32, em=(.35, .2, 0, 1))
for k in range(70):
    a = random.random() * 6.28; d = random.random() ** .7 * .42; z = .2 * (1 - d / .45) + .02
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=.05, depth=.012, location=(math.cos(a) * d, math.sin(a) * d * .9, z * random.uniform(.5, 1.1)), rotation=(random.uniform(-.7, .7), random.uniform(-.7, .7), 0)); bpy.context.object.data.materials.append(OR)
for x, y in [(-.18, .2), (.05, .26)]:
    bpy.ops.mesh.primitive_cube_add(size=.1, location=(x, y, .05), scale=(1.6, .7, .55)); bpy.context.object.data.materials.append(OR)
rendre(sc, 'pile_or')
# bois : rondins empilés
sc = scene(); EC = mat('ecorce', (.75, .6, .45, 1), r=.9, tex='ecorce.jpg', ech=2.2); BO = mat('bois_c', (.78, .6, .38, 1), r=.8)
for rang, n in enumerate([4, 3, 2]):
    for k in range(n):
        x = (k - (n - 1) / 2) * .18; z = .085 + rang * .15
        bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=.08, depth=.7, location=(x, 0, z), rotation=(math.pi / 2, 0, random.uniform(-.1, .1))); o = bpy.context.object; o.data.materials.append(EC)
        for s in (-1, 1):
            bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=.075, depth=.01, location=(x, s * .352, z), rotation=(math.pi / 2, 0, 0)); bpy.context.object.data.materials.append(BO)
rendre(sc, 'pile_bois')
# minerai : blocs de roche à veines
sc = scene(); RO = mat('roc', (.55, .52, .5, 1), r=.85, tex='roche.jpg', ech=1.5); FE = mat('fer', (.32, .26, .24, 1), m=.55, r=.45, tex='roche2.jpg', ech=1.5)
for k, (x, y, r) in enumerate([(0, 0, .26), (.26, .1, .17), (-.25, .08, .18), (.08, -.22, .15), (-.1, .26, .12)]):
    caillou((x, y, r * .6), r, RO if k % 2 == 0 else FE, k * 3.1)
rendre(sc, 'pile_minerai')
# soufre : cristaux jaunes sur roche
sc = scene(); SO = mat('soufre', (1, .85, .15, 1), r=.35, em=(.5, .4, 0, 1)); RO2 = mat('roc2', (.4, .36, .3, 1), r=.9, tex='roche2.jpg', ech=1.5)
caillou((0, 0, .1), .25, RO2, 1.2)
for k in range(9):
    a = k / 9 * 6.28; cristal((math.cos(a) * .17, math.sin(a) * .15, .15), random.uniform(.18, .32), .05, SO, (math.cos(a) * .5, math.sin(a) * .5, 0))
rendre(sc, 'pile_soufre')
# cristal : grappe rouge translucide
sc = scene(); CR = mat('cristal', (1, .12, .2, 1), r=.08, transm=.7, em=(.7, .05, .1, 1)); RO3 = mat('roc3', (.35, .33, .32, 1), r=.9, tex='roche.jpg', ech=1.5)
caillou((0, 0, .06), .22, RO3, 4.2)
cristal((0, 0, .32), .5, .09, CR, (0, 0, 0))
for k in range(6):
    a = k / 6 * 6.28; cristal((math.cos(a) * .13, math.sin(a) * .12, .2), random.uniform(.25, .4), .06, CR, (math.cos(a) * .55, math.sin(a) * .55, 0))
rendre(sc, 'pile_cristal')
# gemmes : pierres taillées de couleurs dans une coupelle
sc = scene(); BOL = mat('bol', (.5, .35, .2, 1), r=.7, tex='bois.jpg', ech=2)
bpy.ops.mesh.primitive_uv_sphere_add(radius=.3, location=(0, 0, .3)); o = bpy.context.object; o.scale.z = .55
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.object.mode_set(mode='OBJECT')
for v in o.data.vertices: v.select = v.co.z > .1
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.delete(type='VERT'); bpy.ops.object.mode_set(mode='OBJECT'); o.data.materials.append(BOL)
cols = [(.1, .3, 1, 1), (.1, .9, .3, 1), (1, .15, .5, 1), (1, .85, .1, 1), (.2, .9, 1, 1)]
for k in range(14):
    a = random.random() * 6.28; d = random.random() * .2
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=.06, location=(math.cos(a) * d, math.sin(a) * d, .26 + random.random() * .06)); g = bpy.context.object
    g.data.materials.append(mat('g%d' % k, cols[k % 5], r=.05, transm=.6, em=tuple(c * .6 for c in cols[k % 5][:3]) + (1,)))
rendre(sc, 'pile_gemmes')
# mercure : fioles et bonbonne de verre argenté
sc = scene(); VE = mat('verre', (.85, .92, 1, 1), r=.05, transm=.9); HG = mat('hg', (.85, .88, .92, 1), m=1, r=.08); BO2 = mat('bouchon', (.45, .3, .18, 1), r=.8)
bpy.ops.mesh.primitive_uv_sphere_add(radius=.2, location=(0, 0, .2)); bpy.context.object.data.materials.append(VE)
bpy.ops.mesh.primitive_uv_sphere_add(radius=.16, location=(0, 0, .17)); bpy.context.object.scale.z = .8; bpy.context.object.data.materials.append(HG)
bpy.ops.mesh.primitive_cylinder_add(radius=.06, depth=.14, location=(0, 0, .44)); bpy.context.object.data.materials.append(VE)
bpy.ops.mesh.primitive_cylinder_add(radius=.05, depth=.06, location=(0, 0, .53)); bpy.context.object.data.materials.append(BO2)
for x, y in [(.28, .05), (-.26, .1)]:
    bpy.ops.mesh.primitive_cylinder_add(radius=.06, depth=.22, location=(x, y, .11)); bpy.context.object.data.materials.append(VE)
    bpy.ops.mesh.primitive_cylinder_add(radius=.05, depth=.14, location=(x, y, .08)); bpy.context.object.data.materials.append(HG)
rendre(sc, 'pile_mercure')
