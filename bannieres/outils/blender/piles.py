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
# or : monceau de pièces + lingots
sc = scene(); OR = mat('or', (.95, .6, .08, 1), m=.85, r=.25, em=(.1, .06, 0, 1))
for k in range(170):
    a = random.random() * 6.28; d = random.random() ** .6 * .4; z = .26 * (1 - d / .42) ** 1.3 + .015
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=.045, depth=.012, location=(math.cos(a) * d, math.sin(a) * d * .9, z * random.uniform(.75, 1.05)), rotation=(random.uniform(-.6, .6), random.uniform(-.6, .6), 0)); bpy.context.object.data.materials.append(OR)
for x, y, rz in [(-.3, .22, .3), (.28, .25, -.4), (.33, -.12, .9)]:
    bpy.ops.mesh.primitive_cube_add(size=.1, location=(x, y, .035), rotation=(0, 0, rz), scale=(1.7, .75, .6)); bpy.context.object.data.materials.append(OR)
rendre(sc, 'pile_or')
# bois : rondins couchés, vus de long
sc = scene(); EC = mat('ecorce', (.75, .6, .45, 1), r=.9, tex='ecorce.jpg', ech=2.2); BO = mat('bois_c', (.9, .7, .45, 1), r=.8, tex='bois.jpg', ech=4)
for rang, n in enumerate([4, 3, 2]):
    for k in range(n):
        y = (k - (n - 1) / 2) * .17; z = .085 + rang * .145
        bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=.08, depth=.75, location=(random.uniform(-.03, .03), y, z), rotation=(0, math.pi / 2, random.uniform(-.06, .06))); o = bpy.context.object; o.data.materials.append(EC)
        for s in (-1, 1):
            bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=.075, depth=.01, location=(s * .377, y, z), rotation=(0, math.pi / 2, 0)); bpy.context.object.data.materials.append(BO)
rendre(sc, 'pile_bois')
# minerai : tas de blocs de fer sombres à éclats métalliques
sc = scene(); RO = mat('roc', (.42, .4, .4, 1), r=.85, tex='roche.jpg', ech=1.5); FE = mat('fer', (.22, .2, .22, 1), m=.7, r=.35, tex='roche2.jpg', ech=1.5)
for k, (x, y, r) in enumerate([(0, 0, .24), (.24, .1, .16), (-.24, .08, .17), (.08, -.22, .14), (-.12, .25, .12), (.2, -.12, .1), (-.2, -.15, .11), (.02, .14, .13)]):
    caillou((x, y, r * .6 + (.08 if k == 7 else 0)), r, FE if k % 3 else RO, k * 3.1)
rendre(sc, 'pile_minerai')
# soufre : monticule jaune et cristaux
sc = scene(); SO = mat('soufre', (.7, .48, 0, 1), r=.55); SP = mat('soufre_p', (.6, .42, .05, 1), r=.95)
caillou((0, 0, .02), .2, SP, 1.2, .25)
for k in range(10):
    a = k / 10 * 6.28; cristal((math.cos(a) * .17, math.sin(a) * .15, .14), random.uniform(.2, .32), .05, SO, (math.cos(a) * .45, math.sin(a) * .45, 0))
rendre(sc, 'pile_soufre')
# cristal : grappe rouge sur roche
sc = scene(); CR = mat('cristal', (.85, .03, .08, 1), r=.1, transm=.25, em=(.25, 0, .02, 1)); RO3 = mat('roc3', (.35, .33, .32, 1), r=.9, tex='roche.jpg', ech=1.5)
caillou((0, 0, .06), .22, RO3, 4.2)
cristal((0, 0, .32), .5, .09, CR, (0, 0, 0))
for k in range(6):
    a = k / 6 * 6.28; cristal((math.cos(a) * .13, math.sin(a) * .12, .2), random.uniform(.25, .4), .06, CR, (math.cos(a) * .55, math.sin(a) * .55, 0))
rendre(sc, 'pile_cristal')
# gemmes : pierres taillées de couleurs profondes, en tas sur une pierre plate
sc = scene(); RO4 = mat('roc4', (.4, .37, .34, 1), r=.9, tex='roche.jpg', ech=1.5)
caillou((0, 0, -.02), .28, RO4, 2.2, .15)
cols = [(.75, 0, .04, 1), (0, .55, .12, 1), (.02, .1, .8, 1), (.4, .04, .7, 1), (.95, .7, 0, 1)]
GM = [mat('g%d' % k, c, r=.06, transm=.15, em=tuple(x * .18 for x in c[:3]) + (1,)) for k, c in enumerate(cols)]
for k in range(22):
    a = random.random() * 6.28; d = random.random() ** .7 * .22
    gemme((math.cos(a) * d, math.sin(a) * d * .9, .17 + (.2 - d) * .45 + random.random() * .03), random.uniform(.06, .085), GM[k % 5], (random.random(), random.random(), random.random()))
rendre(sc, 'pile_gemmes')
# mercure : fioles et bonbonne de verre argenté
sc = scene(); VE = mat('verre', (.07, .16, .2, 1), r=.06); HG = mat('hg', (.9, .92, .95, 1), m=1, r=.3); BO2 = mat('bouchon', (.45, .3, .18, 1), r=.8)
# 23/11 : caisse de bois sous les fioles et verre teinté, pour ne plus paraître blanc et plat sur la carte
CA = mat('caisse', (.85, .62, .42, 1), r=.85, tex='poutre.jpg', ech=2)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, .02, .04)); bpy.context.object.scale = (.78, .42, .08); bpy.context.object.data.materials.append(CA)
for x in (-.36, .36):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, .02, .1)); bpy.context.object.scale = (.05, .44, .14); bpy.context.object.data.materials.append(CA)
bpy.ops.mesh.primitive_uv_sphere_add(radius=.2, location=(0, 0, .2), segments=48, ring_count=24); bpy.context.object.data.materials.append(VE); bpy.ops.object.shade_smooth()
bpy.ops.mesh.primitive_cylinder_add(radius=.06, depth=.14, location=(0, 0, .44)); bpy.context.object.data.materials.append(VE)
bpy.ops.mesh.primitive_cylinder_add(radius=.05, depth=.06, location=(0, 0, .53)); bpy.context.object.data.materials.append(BO2)
for x, y in [(.28, .05), (-.26, .1)]:
    bpy.ops.mesh.primitive_cylinder_add(radius=.06, depth=.22, location=(x, y, .11)); bpy.context.object.data.materials.append(HG)
    bpy.ops.mesh.primitive_cylinder_add(radius=.04, depth=.05, location=(x, y, .245)); bpy.context.object.data.materials.append(BO2)
rendre(sc, 'pile_mercure')
