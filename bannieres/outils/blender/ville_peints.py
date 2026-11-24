"""(base partagée) Petits lieux de la carte modélisés et rendus dans Blender (Cycles) : puits, sanctuaire, fontaine, autel, obélisque, pierre runique.
Usage : /home/claude/bpyenv/bin/python lieux_peints.py dossier_sortie → lv_<nom>.webp + .json (vue 52°, même convention que imp_glb.py)."""
import bpy, math, sys, os, json, random
from mathutils import Vector, noise
OUT = sys.argv[-1]; os.makedirs(OUT, exist_ok=True)
MATS = {}
TX = '/home/claude/gameclaude/bannieres/jeu/tex3d/'
def scene():
    MATS.clear(); bpy.ops.wm.read_homefile(use_empty=True); sc = bpy.context.scene
    d = Vector((-.75, -.45, .62)).normalized()
    ld = bpy.data.lights.new('s', 'SUN'); ld.energy = 4.5; ld.color = (1, .9, .76); ld.angle = math.radians(4)
    lo = bpy.data.objects.new('s', ld); lo.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler(); sc.collection.objects.link(lo)
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (.55, .62, .7, 1); bg.inputs[1].default_value = .8
    return sc
def mat(nom, c, tex=None, ech=1, r=.8, m=0, em=None, transm=0):
    if nom in MATS: return MATS[nom]
    M = bpy.data.materials.new(nom); M.use_nodes = True; N = M.node_tree.nodes; L = M.node_tree.links; b = N['Principled BSDF']
    b.inputs['Base Color'].default_value = c; b.inputs['Roughness'].default_value = r; b.inputs['Metallic'].default_value = m
    if transm: b.inputs['Transmission Weight'].default_value = transm
    if em: b.inputs['Emission Color'].default_value = em; b.inputs['Emission Strength'].default_value = 3
    if tex:
        tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (ech, ech, ech); L.new(tc.outputs['Object'], mp.inputs[0])
        t = N.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(TX + tex); t.projection = 'BOX'; t.projection_blend = .25; L.new(mp.outputs[0], t.inputs[0])
        mx = N.new('ShaderNodeMixRGB'); mx.blend_type = 'MULTIPLY'; mx.inputs[0].default_value = 1; mx.inputs[2].default_value = c; L.new(t.outputs[0], mx.inputs[1]); L.new(mx.outputs[0], b.inputs['Base Color'])
        bu = N.new('ShaderNodeBump'); bu.inputs['Strength'].default_value = .5; L.new(t.outputs[0], bu.inputs['Height']); L.new(bu.outputs['Normal'], b.inputs['Normal'])
    MATS[nom] = M; return M
def PIERRE(): return mat('pierre', (.95, .9, .82, 1), 'mur.jpg', 1.2)
def PIERRE2(): return mat('pierre2', (.85, .82, .78, 1), 'mur3.jpg', 1)
def BOIS(): return mat('bois', (.8, .62, .45, 1), 'poutre.jpg', 1.5)
def TUILE(): return mat('tuile', (1, .85, .8, 1), 'tuile.jpg', 1.2)
def EAU(): return mat('eau', (.1, .35, .5, 1), r=.05, transm=.3)
def ob(o, M): o.data.materials.append(M); return o
def cyl(r, h, loc, M, v=24, r2=None):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=h, location=loc)
    else: bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r, radius2=r2, depth=h, location=loc)
    o = bpy.context.object; bpy.ops.object.shade_smooth(); return ob(o, M)
def boite(s, loc, M, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.object; o.scale = s; return ob(o, M)
def rendre(sc, nom, R=380):
    bpy.context.view_layer.update()  # 23/11 : sinon la dernière pièce perd son échelle quand on tourne la scène
    rz = math.radians(float(os.environ.get('ROT', '0')))
    for o in sc.objects:
        if o.type == 'MESH': o.matrix_world = __import__('mathutils').Matrix.Rotation(rz, 4, 'Z') @ o.matrix_world
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in sc.objects if o.type == 'MESH' for c in o.bound_box]
    mn = Vector([min(p[i] for p in pts) for i in range(3)]); mx = Vector([max(p[i] for p in pts) for i in range(3)])
    haut = mx.z - mn.z; larg = mx.x - mn.x
    from bpy_extras.object_utils import world_to_camera_view
    el = math.radians(float(os.environ.get('ELEV', '52'))); cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cd.ortho_scale = max(larg, mx.y - mn.y, haut) * 1.35
    cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
    c = (mn + mx) / 2; cam.location = (c.x, c.y - 100 * math.cos(el), c.z + 100 * math.sin(el)); cam.rotation_euler = (math.pi / 2 - el, 0, 0)
    sc.render.resolution_x = sc.render.resolution_y = R
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 64; sc.cycles.use_denoising = True; sc.render.film_transparent = True
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
    png = f'{OUT}/{nom}_brut.png'; sc.render.filepath = png; bpy.ops.render.render(write_still=True)
    p = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    from PIL import Image
    im = Image.open(png).convert('RGBA'); bb = im.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox(); im = im.crop(bb)
    im.save(f'{OUT}/lv_{nom}.webp', 'WEBP', quality=88, method=6)
    json.dump({'w': im.width, 'h': im.height, 'px': round(p.x * R - bb[0], 1), 'py': round((1 - p.y) * R - bb[1], 1), 'ppm': round(R / cd.ortho_scale, 3), 'haut': round(haut, 2), 'larg': round(larg, 2)}, open(f'{OUT}/lv_{nom}.webp.json', 'w'))
    print('FINI', nom, im.size)

# --- bâtiments de ville vus presque de face (ELEV=8) ---
TOILE = lambda n, c: mat(n, c, r=.9)
# tour de mage : tour ronde de pierre, toit pointu violet, orbe lumineux, petites fenêtres éclairées
sc = scene(); P = PIERRE2()
cyl(.9, .3, (0, 0, .15), P, 24); cyl(.7, 4.2, (0, 0, 2.4), P, 24, .6)
for z in (1.6, 2.6, 3.5): boite((.18, .1, .3), (0, -.66, z), mat('fen', (1, .8, .4, 1), em=(1, .7, .3, 1)))
cyl(.85, .2, (0, 0, 4.55), P, 24); cyl(.9, 2.0, (0, 0, 5.6), mat('toitv', (.55, .35, .9, 1), 'ardoise.jpg', 1.2), 24, 0)
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=.28, location=(0, 0, 6.9)); ob(bpy.context.object, mat('orbe', (.75, .6, 1, 1), r=.2, em=(.6, .45, 1, 1)))
rendre(sc, 'v_tourmage', 520)
# marché : trois étals à toiles rayées, caisses, tonneaux
sc = scene(); B = BOIS()
for k, (x, c) in enumerate([(-1.5, (.8, .15, .12, 1)), (0, (.9, .75, .3, 1)), (1.5, (.15, .35, .7, 1))]):
    boite((1.2, .8, .7), (x, 0, .35), B)
    for sx in (-1, 1):
        for sy in (-1, 1): boite((.06, .06, 1.6), (x + sx * .55, sy * .35, .8), B)
    for sg in (-1, 1): boite((1.35, .6, .04), (x, sg * .24, 1.75), TOILE('t%d' % k, c), (-sg * .5, 0, 0))
    for j in range(5): bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=.09, location=(x - .4 + j * .2, -.25, .78)); ob(bpy.context.object, mat('fr%d' % j, [(.9, .2, .1, 1), (.95, .75, .1, 1), (.4, .7, .15, 1), (.9, .45, .1, 1), (.6, .1, .3, 1)][j], r=.5))
for x in (-2.4, 2.4): cyl(.3, .6, (x, -.3, .3), mat('tonneau', (.7, .5, .3, 1), 'bois.jpg', 2), 16)
rendre(sc, 'v_marche', 520)
# grenier : grange de bois sur socle de pierre, toit de chaume, sacs
sc = scene(); P = PIERRE(); B = BOIS()
boite((2.6, 1.8, .5), (0, 0, .25), P); boite((2.4, 1.6, 1.6), (0, 0, 1.3), mat('planches', (.85, .65, .45, 1), 'bois.jpg', 1.2))
for sg in (-1, 1): boite((2.8, 1.25, .1), (0, sg * .5, 2.55), mat('chaume', (1, .9, .7, 1), 'chaume.jpg', 1.2), (-sg * .75, 0, 0))
boite((.7, .05, 1.0), (0, -.81, .9), mat('porte', (.35, .22, .12, 1), r=.8))
for j in range(3): bpy.ops.mesh.primitive_uv_sphere_add(radius=.22, location=(-1.0 + j * .3, -1.05, .2)); o = bpy.context.object; o.scale.z = 1.3; ob(o, mat('sac', (.5, .4, .26, 1), 'chaume.jpg', 3))
rendre(sc, 'v_grenier', 520)

# hutte de la Horde : mur de rondins, toit conique de chaume, défenses d'os, peau tendue, totem
sc = scene(); B = BOIS()
cyl(1.2, .25, (0, 0, .12), PIERRE(), 24)
cyl(1.1, 1.3, (0, 0, .9), mat('rondins', (.75, .55, .38, 1), 'ecorce.jpg', 2.5), 24)
cyl(1.55, 1.8, (0, 0, 2.4), mat('chaume_h', (.95, .8, .55, 1), 'chaume.jpg', 1.3), 24, .05)
boite((.6, .05, .9), (0, -1.09, .7), mat('peau', (.3, .19, .1, 1), r=.95))
OS = mat('os_h', (.1, .075, .045, 1), r=.8)
for sx in (-1, 1):
    bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=.1, depth=1.1, location=(sx * .55, -1.15, 1.3), rotation=(.4, -sx * .5, 0)); ob(bpy.context.object, OS)
cyl(.12, 2.6, (1.5, -.3, 1.3), B, 10)
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=.22, location=(1.5, -.3, 2.7)); ob(bpy.context.object, OS)
for sx in (-1, 1):
    bpy.ops.mesh.primitive_cone_add(vertices=10, radius1=.06, depth=.5, location=(1.5 + sx * .18, -.3, 2.85), rotation=(0, sx * .6, 0)); ob(bpy.context.object, OS)
rendre(sc, 'v_hutte', 480)
