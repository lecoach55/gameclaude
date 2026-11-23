"""Touffes d'herbe « peintes » (brins clairs à pointe dorée, fleurs de couleur), vue 52°, pour remplacer les touffes photo
Poly Haven (trop sombres et piquées à côté des arbres peints). Usage : /home/claude/bpyenv/bin/python touffes_peintes.py <sortie_dir>
Écrit touffe_<a..c>_h.webp + .webp.json (w, h, px, py, ppm, haut, larg)."""
import bpy, math, sys, json, os, random
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector
from PIL import Image
OUT = sys.argv[-1]; os.makedirs(OUT, exist_ok=True)
def mat_herbe():
    m = bpy.data.materials.new('herbe'); m.use_nodes = True; N = m.node_tree.nodes; L = m.node_tree.links; b = N['Principled BSDF']
    geo = N.new('ShaderNodeNewGeometry'); sep = N.new('ShaderNodeSeparateXYZ'); L.new(geo.outputs['Position'], sep.inputs[0])
    mr = N.new('ShaderNodeMapRange'); L.new(sep.outputs['Z'], mr.inputs[0]); mr.inputs[1].default_value = 0; mr.inputs[2].default_value = .42
    cr = N.new('ShaderNodeValToRGB'); e = cr.color_ramp.elements; e[0].color = (.05, .14, .02, 1); e[1].color = (.62, .68, .2, 1); e.new(.55).color = (.2, .42, .06, 1)
    L.new(mr.outputs[0], cr.inputs['Fac']); L.new(cr.outputs[0], b.inputs['Base Color']); b.inputs['Roughness'].default_value = .7
    b.inputs['Subsurface Weight'].default_value = .2
    return m
COUL = {'brun': (.22, .1, .04, 1), 'blanc': (1, 1, .95, 1), 'jaune': (1, .72, 0, 1), 'rose': (1, .18, .42, 1), 'mauve': (.45, .2, 1, 1), 'rouge': (.85, .12, .08, 1)}
def mat_fleur(c):
    m = bpy.data.materials.new(c); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = COUL[c]; b.inputs['Roughness'].default_value = .55; return m
ROSEAUX = os.environ.get('QUOI') == 'roseaux'
TOUFFES = {'r': ('brun', 'brun', 9, 60)} if ROSEAUX else {'a': ('jaune', 'blanc', 12, 90), 'b': ('rose', 'blanc', 9, 80), 'c': ('mauve', 'jaune', 11, 95)}
for nom, (c1, c2, nfl, nbr) in TOUFFES.items():
    bpy.ops.wm.read_homefile(use_empty=True); sc = bpy.context.scene; random.seed(hash(nom) % 1000)
    H = mat_herbe(); F1 = mat_fleur(c1); F2 = mat_fleur(c2); objs = []
    for k in range(nbr):  # brins : cônes fins inclinés vers l'extérieur
        a = random.random() * 6.283; d = random.random() ** .6 * .42; h = (.45 + random.random() * .35) if ROSEAUX else (.16 + random.random() ** 2 * .3)
        bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=.017, radius2=0, depth=h, location=(math.cos(a) * d, math.sin(a) * d * .8, h / 2))
        o = bpy.context.object; o.rotation_euler = (math.sin(a) * -.45 * d / .42 - .1, math.cos(a) * .45 * d / .42, 0); o.data.materials.append(H); objs.append(o)
    for k in range(nfl):
        a = random.random() * 6.283; d = random.random() ** .7 * .4
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=.032, location=(math.cos(a) * d, math.sin(a) * d * .8, (.55 + random.random() * .25) if ROSEAUX else (.12 + random.random() * .16)))
        o = bpy.context.object; o.scale.z = 2.6 if ROSEAUX else .5; o.data.materials.append(F1 if k % 3 else F2); objs.append(o)
    if ROSEAUX:  # petite flaque sous les roseaux
        bpy.ops.mesh.primitive_circle_add(vertices=32, radius=.5, fill_type='NGON', location=(0, 0, .005)); o = bpy.context.object; o.scale.y = .75
        W = bpy.data.materials.new('flaque'); W.use_nodes = True; bw = W.node_tree.nodes['Principled BSDF']; bw.inputs['Base Color'].default_value = (.02, .05, .05, 1); bw.inputs['Roughness'].default_value = .05; o.data.materials.append(W); objs.append(o)
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ v.co for o in objs for v in o.data.vertices]
    haut = max(p.z for p in pts); larg = max(p.x for p in pts) - min(p.x for p in pts)
    dd = Vector((-.75, -.45, .62)).normalized()
    ld = bpy.data.lights.new('s', 'SUN'); ld.energy = 4.5; ld.color = (1, .89, .75); ld.angle = math.radians(4)
    lo = bpy.data.objects.new('s', ld); lo.rotation_euler = (-dd).to_track_quat('-Z', 'Y').to_euler(); sc.collection.objects.link(lo)
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (.62, .72, .9, 1); bg.inputs[1].default_value = .7
    el = math.radians(52); cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cd.ortho_scale = max(larg, 1.0) * 1.3
    cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = (0, -50 * math.cos(el), 50 * math.sin(el) + haut * .4); cam.rotation_euler = (math.pi / 2 - el, 0, 0)
    R = 192; sc.render.resolution_x = sc.render.resolution_y = R
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 48; sc.cycles.use_denoising = True; sc.render.film_transparent = True
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
    png = f'/tmp/touffe_{nom}.png'; sc.render.filepath = png; bpy.ops.render.render(write_still=True)
    pc = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    im = Image.open(png).convert('RGBA'); im.putalpha(im.getchannel('A').point(lambda v: 0 if v < 50 else v)); bb = im.getchannel('A').getbbox(); im = im.crop(bb)
    nm = 'roseaux_a' if ROSEAUX else f'touffe_{nom}'
    im.save(f'{OUT}/{nm}_h.webp', 'WEBP', quality=88, method=6)
    meta = {'w': im.width, 'h': im.height, 'px': round(pc.x * R - bb[0], 1), 'py': round((1 - pc.y) * R - bb[1], 1), 'ppm': round(R / cd.ortho_scale, 3), 'haut': round(haut, 2), 'larg': round(larg, 2)}
    json.dump(meta, open(f'{OUT}/{nm}_h.webp.json', 'w')); print('FINI', nom, meta, flush=True)
