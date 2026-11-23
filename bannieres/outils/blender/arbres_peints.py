"""Arbres « peints » façon Heroes : houppiers ronds et denses (sphères bosselées + feuillage procédural), sapins en étages de cônes.
Rendu Cycles en imposteurs pour la carte (vue 52°, comme imp_glb.py). Usage : /home/claude/bpyenv/bin/python arbres_peints.py dossier_sortie
Écrit <nom>_h.webp + <nom>_h.webp.json (w, h, px, py, ppm, haut, larg)."""
import bpy, bmesh, math, sys, os, json, random
from mathutils import Vector, noise
OUT = sys.argv[-1]; os.makedirs(OUT, exist_ok=True); SUF = os.environ.get('SUF', 'h')  # h = carte (52°), b = ville (ELEV=8)
TX = '/home/claude/gameclaude/bannieres/jeu/tex3d/ecorce.jpg'

def scene_vide():
    bpy.ops.wm.read_homefile(use_empty=True); sc = bpy.context.scene
    d = Vector((-.75, -.45, .62)).normalized()
    ld = bpy.data.lights.new('soleil', 'SUN'); ld.energy = 4.2; ld.color = (1, .9, .76); ld.angle = math.radians(4)
    lo = bpy.data.objects.new('soleil', ld); lo.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler(); sc.collection.objects.link(lo)
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (.6, .72, .95, 1); bg.inputs[1].default_value = .75
    return sc

def mat_feuillage(nom, c1, c2, c3):
    m = bpy.data.materials.new(nom); m.use_nodes = True; N = m.node_tree.nodes; L = m.node_tree.links; b = N['Principled BSDF']
    tc = N.new('ShaderNodeTexCoord')
    vo = N.new('ShaderNodeTexVoronoi'); vo.inputs['Scale'].default_value = 7; L.new(tc.outputs['Object'], vo.inputs['Vector'])
    no = N.new('ShaderNodeTexNoise'); no.inputs['Scale'].default_value = 2.2; no.inputs['Detail'].default_value = 4; L.new(tc.outputs['Object'], no.inputs['Vector'])
    cr = N.new('ShaderNodeValToRGB'); e = cr.color_ramp.elements; e[0].color = c1; e[1].color = c2; e.new(.55).color = c3
    mx = N.new('ShaderNodeMath'); mx.operation = 'MULTIPLY_ADD'; mx.inputs[1].default_value = .6; L.new(no.outputs['Fac'], mx.inputs[0]); L.new(vo.outputs['Distance'], mx.inputs[2])
    L.new(mx.outputs[0], cr.inputs['Fac']); L.new(cr.outputs['Color'], b.inputs['Base Color'])
    bu = N.new('ShaderNodeBump'); bu.inputs['Strength'].default_value = 1.0; bu.inputs['Distance'].default_value = .25
    L.new(vo.outputs['Distance'], bu.inputs['Height']); L.new(bu.outputs['Normal'], b.inputs['Normal'])
    b.inputs['Roughness'].default_value = .8
    try:
        b.inputs['Subsurface Weight'].default_value = .15; b.inputs['Subsurface Radius'].default_value = (.3, .6, .2)
    except KeyError: pass
    return m

def mat_ecorce():
    m = bpy.data.materials.new('ecorce'); m.use_nodes = True; N = m.node_tree.nodes; L = m.node_tree.links; b = N['Principled BSDF']
    t = N.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(TX); L.new(t.outputs[0], b.inputs['Base Color']); b.inputs['Roughness'].default_value = .9
    return m

def boule(c, r, mat, graine, rug=.28):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=r, location=c); o = bpy.context.object
    for v in o.data.vertices:
        p = v.co.normalized(); k = 1 + rug * noise.noise(p * 2.3 + Vector((graine, graine * .7, 0))) + .12 * noise.noise(p * 6 + Vector((graine, 0, 0)))
        v.co = p * r * k
        v.co.z *= .82
    o.data.materials.append(mat); bpy.ops.object.shade_smooth(); return o

def tronc(h, r, mat):
    bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=r, radius2=r * .55, depth=h, location=(0, 0, h / 2)); o = bpy.context.object; o.data.materials.append(mat); bpy.ops.object.shade_smooth(); return o

def feuillu(graine, teintes):
    random.seed(graine); sc = scene_vide(); mf = mat_feuillage('f', *teintes); me = mat_ecorce()
    H = 2.2 + random.random() * .4; tronc(H, .16, me)
    for a in (-.6, .7):  # branches maîtresses
        bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=.08, radius2=.03, depth=1.2, location=(a * .5, 0, H - .1), rotation=(0, a * .9, 0)); bpy.context.object.data.materials.append(me)
    boule((0, 0, H + .9), 1.25, mf, graine)
    for k in range(7):
        ang = k / 7 * 6.28 + random.random() * .5; d = .75 + random.random() * .35
        boule((math.cos(ang) * d, math.sin(ang) * d * .9, H + .55 + random.random() * .7), .72 + random.random() * .3, mf, graine + k + 1)
    boule((0, 0, H + 1.7), .8, mf, graine + 20)
    return sc

def sapin(graine, teintes):
    random.seed(graine); sc = scene_vide(); mf = mat_feuillage('s', *teintes); me = mat_ecorce()
    tronc(1.0, .13, me); H = 4.2 + random.random() * .8; n = 6
    for k in range(n):
        z = .6 + k * (H - .6) / n; r = 1.25 * (1 - k / n) + .25
        bpy.ops.mesh.primitive_cone_add(vertices=28, radius1=r, radius2=r * .15, depth=(H - .6) / n * 1.7, location=(0, 0, z + (H - .6) / n * .7)); o = bpy.context.object
        for v in o.data.vertices:
            if v.co.z < 0:
                a = math.atan2(v.co.y, v.co.x); v.co.x *= 1 + .18 * math.sin(a * 9 + k); v.co.y *= 1 + .18 * math.sin(a * 9 + k); v.co.z -= .12 * abs(math.sin(a * 9 + k))
        o.data.materials.append(mf); bpy.ops.object.shade_smooth()
    return sc

def buisson(graine, teintes):
    random.seed(graine); sc = scene_vide(); mf = mat_feuillage('b', *teintes)
    boule((0, 0, .55), .75, mf, graine)
    for k in range(4):
        ang = k / 4 * 6.28 + random.random(); d = .55 + random.random() * .2
        boule((math.cos(ang) * d, math.sin(ang) * d * .8, .35 + random.random() * .2), .45 + random.random() * .2, mf, graine + k + 1)
    return sc

def jeune(graine, teintes):
    random.seed(graine); sc = scene_vide(); mf = mat_feuillage('j', *teintes); me = mat_ecorce()
    tronc(1.1, .07, me); boule((0, 0, 1.55), .62, mf, graine); boule((.3, .1, 1.3), .4, mf, graine + 3); boule((-.28, -.05, 1.35), .42, mf, graine + 5)
    return sc

def rendre(sc, nom):
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in sc.objects if o.type == 'MESH' for c in o.bound_box]
    mn = Vector([min(p[i] for p in pts) for i in range(3)]); mx = Vector([max(p[i] for p in pts) for i in range(3)])
    haut = mx.z - mn.z; larg = mx.x - mn.x
    from bpy_extras.object_utils import world_to_camera_view
    el = math.radians(float(os.environ.get('ELEV', '52'))); cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cd.ortho_scale = max(larg, haut * 1.05) * 1.2
    cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
    c = (mn + mx) / 2; cam.location = (c.x, c.y - 100 * math.cos(el), c.z + 100 * math.sin(el)); cam.rotation_euler = (math.pi / 2 - el, 0, 0)
    R = 360; sc.render.resolution_x = sc.render.resolution_y = R
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 48; sc.cycles.use_denoising = True; sc.render.film_transparent = True
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
    png = f'{OUT}/{nom}_brut.png'; sc.render.filepath = png; bpy.ops.render.render(write_still=True)
    p = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    from PIL import Image
    im = Image.open(png).convert('RGBA'); bb = im.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox(); im = im.crop(bb)
    px, py = p.x * R - bb[0], (1 - p.y) * R - bb[1]
    im.save(f'{OUT}/{nom}_{SUF}.webp', 'WEBP', quality=86, method=6)
    json.dump({'w': im.width, 'h': im.height, 'px': round(px, 1), 'py': round(py, 1), 'ppm': round(R / cd.ortho_scale, 3), 'haut': round(haut, 2), 'larg': round(larg, 2)}, open(f'{OUT}/{nom}_{SUF}.webp.json', 'w'))
    print('FINI', nom, im.size)

VERT = ((.012, .04, .008, 1), (.07, .19, .025, 1), (.22, .36, .05, 1))
VERT2 = ((.015, .045, .01, 1), (.1, .2, .03, 1), (.3, .36, .07, 1))
SAP = ((.008, .03, .015, 1), (.03, .1, .045, 1), (.09, .2, .07, 1))
QUOI = os.environ.get('QUOI')
OR3 = ((.06, .03, .0, 1), (.45, .26, .02, 1), (.95, .7, .15, 1))
for nom, f, g, t in [('arbre_or', feuillu, 7, OR3)] if QUOI == 'or' else [('arbuste_a', buisson, 21, VERT), ('arbuste_b', buisson, 25, VERT2), ('arbuste_c', buisson, 29, VERT), ('buisson_a', buisson, 33, VERT2), ('jeune_a', jeune, 41, VERT), ('jeune_b', jeune, 45, VERT2)] if QUOI == 'petits' else [
    ('feuillu_a', feuillu, 3, VERT), ('feuillu_b', feuillu, 11, VERT2), ('sapin_a', sapin, 5, SAP), ('sapin_b', sapin, 8, SAP), ('sapin_c', sapin, 13, SAP)]:
    rendre(f(g, t), nom)
