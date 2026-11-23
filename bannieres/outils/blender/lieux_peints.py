"""Petits lieux de la carte modélisés et rendus dans Blender (Cycles) : puits, sanctuaire, fontaine, autel, obélisque, pierre runique.
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
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in sc.objects if o.type == 'MESH' for c in o.bound_box]
    mn = Vector([min(p[i] for p in pts) for i in range(3)]); mx = Vector([max(p[i] for p in pts) for i in range(3)])
    haut = mx.z - mn.z; larg = mx.x - mn.x
    from bpy_extras.object_utils import world_to_camera_view
    el = math.radians(52); cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cd.ortho_scale = max(larg, mx.y - mn.y, haut) * 1.35
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
# puits : margelle de pierre, eau, deux poteaux, toit de tuiles, treuil et seau
sc = scene(); P = PIERRE(); B = BOIS()
cyl(.55, .5, (0, 0, .25), P, 32); cyl(.45, .52, (0, 0, .27), mat('int', (.05, .04, .03, 1), r=1), 32); cyl(.44, .02, (0, 0, .38), EAU(), 32)
for s in (-1, 1): boite((.08, .08, 1.0), (s * .5, 0, .85), B)
boite((1.15, .06, .06), (0, 0, 1.25), B)
for s in (-1, 1): boite((1.15, .5, .05), (0, s * .2, 1.42), TUILE(), (-s * .85, 0, 0))
cyl(.07, .9, (0, 0, 1.05), B, 12).rotation_euler = (0, math.pi / 2, 0)
cyl(.11, .16, (.15, 0, .72), mat('seau', (.45, .3, .18, 1), r=.8), 16)
rendre(sc, 'puits')
# sanctuaire : temple à colonnes sur trois marches, fronton, statue lumineuse
sc = scene(); P = PIERRE2()
for k, (w, d) in enumerate([(2.2, 1.6), (2.0, 1.4), (1.8, 1.2)]): boite((w, d, .12), (0, 0, .06 + k * .12), P)
for x in (-.75, -.25, .25, .75):
    for y in (-.48, .48): cyl(.09, 1.3, (x, y, 1.01), P, 16)
boite((1.95, 1.3, .14), (0, 0, 1.73), P)
for sg in (-1, 1): boite((2.05, .78, .08), (0, sg * .33, 1.97), mat('ardoise_s', (.8, .82, .9, 1), 'ardoise.jpg', 1.2), (-sg * .55, 0, 0))
cyl(.16, .5, (0, 0, .6), P, 16); bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=.16, location=(0, 0, .98)); ob(bpy.context.object, mat('orbe', (1, .85, .5, 1), r=.2, em=(1, .8, .4, 1)))
rendre(sc, 'sanctuaire')
# fontaine : bassin octogonal, colonne et vasque
sc = scene(); P = PIERRE2()
cyl(.95, .35, (0, 0, .17), P, 8); cyl(.85, .3, (0, 0, .21), EAU(), 8); cyl(.12, .9, (0, 0, .6), P, 16); cyl(.4, .12, (0, 0, 1.05), P, 16, .25)
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=.1, location=(0, 0, 1.2)); ob(bpy.context.object, P)
rendre(sc, 'fontaine')
# autel : table de pierre, flamme
sc = scene(); P = PIERRE()
boite((1.3, .9, .15), (0, 0, .075), P); boite((.9, .55, .55), (0, 0, .42), P); boite((1.05, .7, .1), (0, 0, .74), P)
cyl(.14, .45, (0, 0, 1.0), mat('flamme', (1, .5, .1, 1), r=.5, em=(1, .45, .08, 1)), 12, .0)
for s in (-1, 1): cyl(.05, .3, (s * .4, 0, .94), mat('bougie', (.95, .9, .75, 1), r=.6), 10)
rendre(sc, 'autel')
# obélisque : socle + aiguille gravée
sc = scene(); P = PIERRE2()
boite((.9, .9, .25), (0, 0, .125), P); boite((.6, .6, .2), (0, 0, .35), P)
cyl(.28, 2.4, (0, 0, 1.65), P, 4, .14).rotation_euler = (0, 0, math.pi / 4)
cyl(.14, .3, (0, 0, 3.0), mat('pyr', (1, .85, .45, 1), m=.9, r=.3), 4, 0).rotation_euler = (0, 0, math.pi / 4)
rendre(sc, 'obelisque')
# pierre runique : menhir et rune bleue lumineuse
sc = scene(); P = mat('menhir', (.7, .72, .75, 1), 'roche.jpg', 1.4)
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=.5, location=(0, 0, .9)); o = bpy.context.object; o.scale = (.55, .4, 1.8)
for v in o.data.vertices: v.co *= 1 + .12 * noise.noise(v.co * 3)
ob(o, P); bpy.ops.object.shade_smooth()
boite((.04, .02, .7), (0, -.22, 1.0), mat('rune', (.4, .85, 1, 1), em=(.3, .8, 1, 1)))
boite((.28, .02, .04), (.07, -.22, 1.12), MATS['rune'], (0, -.7, 0)); boite((.22, .02, .04), (.06, -.22, .9), MATS['rune'], (0, .7, 0))
rendre(sc, 'pierre')

# antre de créatures : butte rocheuse, entrée voûtée sombre, encadrement de poutres, deux torches
if os.environ.get('QUOI') == 'plus':
    pass
sc = scene(); R = mat('roche_a', (.75, .7, .62, 1), 'roche.jpg', .9); B = BOIS()
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=5, radius=1.4, location=(0, .3, 0)); o = bpy.context.object
for v in o.data.vertices:
    p = v.co.normalized(); v.co = p * 1.4 * (1 + .22 * noise.noise(p * 2.2) + .08 * noise.noise(p * 6)); v.co.z = max(v.co.z, -.05) * .75
ob(o, R); bpy.ops.object.shade_smooth()
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=.42, depth=.6, location=(0, -1.0, .32), rotation=(math.pi / 2, 0, 0)); ob(bpy.context.object, mat('noir', (.01, .008, .005, 1), r=1))
boite((1.0, .5, .65), (0, -1.0, .1), MATS['noir'])
for sx in (-1, 1): boite((.1, .12, 1.0), (sx * .5, -1.18, .5), B)
boite((1.2, .14, .12), (0, -1.18, 1.0), B)
for sx in (-1, 1):
    cyl(.035, .5, (sx * .75, -1.25, .55), B, 8); bpy.ops.mesh.primitive_cone_add(vertices=10, radius1=.08, depth=.22, location=(sx * .75, -1.25, .9)); ob(bpy.context.object, mat('feu', (1, .55, .1, 1), em=(1, .5, .1, 1)))
rendre(sc, 'antre')
# artefact : piédestal de pierre et calice doré lumineux
sc = scene(); P = PIERRE2()
cyl(.45, .15, (0, 0, .075), P, 8); cyl(.25, .7, (0, 0, .5), P, 8); cyl(.38, .12, (0, 0, .9), P, 8)
OR = mat('or_a', (1, .62, .15, 1), m=.9, r=.3, em=(.12, .07, .01, 1))
cyl(.06, .25, (0, 0, 1.08), OR, 12); cyl(.18, .28, (0, 0, 1.33), OR, 20, .08)
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=.06, location=(0, 0, 1.52)); ob(bpy.context.object, mat('gemme_a', (.2, .5, 1, 1), em=(.2, .5, 1, 1)))
rendre(sc, 'artefact')
