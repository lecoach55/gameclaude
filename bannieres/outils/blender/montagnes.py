"""Montagnes de la carte : relief procédural (bruit « crêtes ») habillé de textures Poly Haven (CC0), rendu en imposteurs 'h' (52°) dans Blender.
Usage : /home/claude/bpyenv/bin/python montagnes.py <dossier_textures> <sortie_dir> [neige]
Écrit mont_<a..f>[_n]_h.webp + imp_blender.json (même format que outils/studio3d/imposteur.py ; pied = avant du socle)."""
import bpy, bmesh, math, sys, json, mathutils, os, random
from bpy_extras.object_utils import world_to_camera_view
from mathutils import noise, Vector
from PIL import Image
TX, OUTD = sys.argv[-2] if sys.argv[-1] == 'neige' else sys.argv[-2], sys.argv[-1]
NEIGE = sys.argv[-1] == 'neige'
if NEIGE: TX, OUTD = sys.argv[-3], sys.argv[-2]
meta = {}
def relief(seed, pics):
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=150, y_segments=150, size=10)
    random.seed(seed); centres = [(random.uniform(-3, 3), random.uniform(-2, 2), random.uniform(.6, 1.0)) for _ in range(pics)]
    off = Vector((seed * 13.1, seed * 7.7, 0))
    for v in bm.verts:
        x, y = v.co.x, v.co.y; h = 0
        for cx, cy, a in centres:
            r = math.hypot(x - cx, (y - cy) * 1.15); h = max(h, a * max(0, 1 - r / 5.2) ** 1.6)
        rid = 1 - abs(noise.noise(Vector((x * .35, y * .35, 0)) + off)); rid = rid ** 2
        det = noise.fractal(Vector((x * .9, y * .9, 0)) + off, .55, 2.0, 5)
        h = h * (6.5 + 2.6 * rid + (2.2 * rid ** 3 if os.environ.get('PEINT') == '1' else 0)) + det * (.75 if os.environ.get('PEINT') == '1' else .45) * min(1, h * 3)
        edge = max(0, 1 - max(0, math.hypot(x, y * 1.2) - 6.5) / 2.5)
        v.co.z = h * edge - (1 - edge) * .6
    me = bpy.data.meshes.new('m'); bm.to_mesh(me); o = bpy.data.objects.new('mont', me); bpy.context.scene.collection.objects.link(o)
    for p in me.polygons: p.use_smooth = True
    return o
def materiau():
    m = bpy.data.materials.new('roche'); m.use_nodes = True; N = m.node_tree.nodes; L = m.node_tree.links; b = N['Principled BSDF']
    tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (.12, .12, .12); L.new(tc.outputs['Object'], mp.inputs[0])
    def img(f, nc=False):
        t = N.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(f); t.projection = 'BOX'; t.projection_blend = .3
        if nc: t.image.colorspace_settings.name = 'Non-Color'
        L.new(mp.outputs[0], t.inputs[0]); return t
    roc = img(f'{TX}/aerial_rocks_02_Diffuse.jpg'); herbe = img(f'{TX}/aerial_grass_rock_Diffuse.jpg'); neige = img(f'{TX}/snow_02_Diffuse.jpg')
    hs = N.new('ShaderNodeHueSaturation'); hs.inputs['Hue'].default_value = .56; hs.inputs['Saturation'].default_value = .85; L.new(herbe.outputs[0], hs.inputs['Color'])
    geo = N.new('ShaderNodeNewGeometry'); sep = N.new('ShaderNodeSeparateXYZ'); L.new(geo.outputs['Normal'], sep.inputs[0])
    pos = N.new('ShaderNodeSeparateXYZ'); L.new(geo.outputs['Position'], pos.inputs[0])
    nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1.2; L.new(geo.outputs['Position'], nz.inputs['Vector'])
    # herbe : pentes douces et bas des versants
    mh = N.new('ShaderNodeMath'); mh.operation = 'SUBTRACT'; L.new(sep.outputs['Z'], mh.inputs[0]); mh.inputs[1].default_value = .0
    hz = N.new('ShaderNodeMapRange'); L.new(pos.outputs['Z'], hz.inputs[0]); hz.inputs[1].default_value = 3.2; hz.inputs[2].default_value = .4
    pe = N.new('ShaderNodeMapRange'); L.new(sep.outputs['Z'], pe.inputs[0]); pe.inputs[1].default_value = .72; pe.inputs[2].default_value = .9
    mul = N.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; L.new(hz.outputs[0], mul.inputs[0]); L.new(pe.outputs[0], mul.inputs[1])
    mx = N.new('ShaderNodeMixRGB'); L.new(mul.outputs[0], mx.inputs[0]); L.new(roc.outputs[0], mx.inputs[1]); L.new(hs.outputs[0], mx.inputs[2])
    out = mx
    if NEIGE:
        sn = N.new('ShaderNodeMapRange'); L.new(pos.outputs['Z'], sn.inputs[0]); sn.inputs[1].default_value = 3.6; sn.inputs[2].default_value = 4.6
        sp = N.new('ShaderNodeMapRange'); L.new(sep.outputs['Z'], sp.inputs[0]); sp.inputs[1].default_value = .45; sp.inputs[2].default_value = .7
        m2 = N.new('ShaderNodeMath'); m2.operation = 'MULTIPLY'; L.new(sn.outputs[0], m2.inputs[0]); L.new(sp.outputs[0], m2.inputs[1])
        mx2 = N.new('ShaderNodeMixRGB'); L.new(m2.outputs[0], mx2.inputs[0]); L.new(mx.outputs[0], mx2.inputs[1]); L.new(neige.outputs[0], mx2.inputs[2]); out = mx2
    L.new(out.outputs[0], b.inputs['Base Color']); b.inputs['Roughness'].default_value = .92
    al = N.new('ShaderNodeMapRange'); L.new(pos.outputs['Z'], al.inputs[0]); al.inputs[1].default_value = .08; al.inputs[2].default_value = .55
    an = N.new('ShaderNodeMath'); an.operation = 'ADD'; L.new(al.outputs[0], an.inputs[0]); L.new(nz.outputs['Fac'], an.inputs[1]); an.inputs[1].default_value = 0
    ad = N.new('ShaderNodeMapRange'); L.new(an.outputs[0], ad.inputs[0]); ad.inputs[1].default_value = .55; ad.inputs[2].default_value = 1.15
    L.new(ad.outputs[0], b.inputs['Alpha'])
    nt = img(f'{TX}/aerial_rocks_02_nor_gl.jpg', True); nm = N.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = 1.2; L.new(nt.outputs[0], nm.inputs['Color']); L.new(nm.outputs[0], b.inputs['Normal'])
    return m
PEINT = os.environ.get('PEINT') == '1'  # 21/11 : roche procédurale « peinte » (strates, arêtes nettes) au lieu des photos aériennes floues
def materiau_peint():
    m = bpy.data.materials.new('roche_p'); m.use_nodes = True; N = m.node_tree.nodes; L = m.node_tree.links; b = N['Principled BSDF']
    geo = N.new('ShaderNodeNewGeometry'); sep = N.new('ShaderNodeSeparateXYZ'); L.new(geo.outputs['Normal'], sep.inputs[0])
    pos = N.new('ShaderNodeSeparateXYZ'); L.new(geo.outputs['Position'], pos.inputs[0])
    wv = N.new('ShaderNodeTexNoise'); wv.inputs['Scale'].default_value = .7; wv.inputs['Detail'].default_value = 7; wv.inputs['Roughness'].default_value = .62
    L.new(geo.outputs['Position'], wv.inputs['Vector'])
    cr = N.new('ShaderNodeValToRGB'); e = cr.color_ramp.elements; e[0].position = .3; e[1].position = .7; e[0].color = (.09, .075, .055, 1); e[1].color = (.36, .3, .22, 1); e.new(.5).color = (.2, .17, .13, 1)
    L.new(wv.outputs['Fac'], cr.inputs['Fac'])
    vo = N.new('ShaderNodeTexVoronoi'); vo.feature = 'DISTANCE_TO_EDGE'; vo.inputs['Scale'].default_value = 1.6; L.new(geo.outputs['Position'], vo.inputs['Vector'])
    no = N.new('ShaderNodeTexNoise'); no.inputs['Scale'].default_value = 3; no.inputs['Detail'].default_value = 8; L.new(geo.outputs['Position'], no.inputs['Vector'])
    hb = N.new('ShaderNodeMath'); hb.operation = 'MULTIPLY_ADD'; hb.inputs[1].default_value = .5; L.new(no.outputs['Fac'], hb.inputs[0]); L.new(vo.outputs['Distance'], hb.inputs[2])
    bu = N.new('ShaderNodeBump'); bu.inputs['Strength'].default_value = .85; bu.inputs['Distance'].default_value = .35; L.new(hb.outputs[0], bu.inputs['Height']); L.new(bu.outputs['Normal'], b.inputs['Normal'])
    pe = N.new('ShaderNodeMapRange'); L.new(sep.outputs['Z'], pe.inputs[0]); pe.inputs[1].default_value = .78; pe.inputs[2].default_value = .92
    hz = N.new('ShaderNodeMapRange'); L.new(pos.outputs['Z'], hz.inputs[0]); hz.inputs[1].default_value = 3.6; hz.inputs[2].default_value = .6
    mul = N.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; L.new(hz.outputs[0], mul.inputs[0]); L.new(pe.outputs[0], mul.inputs[1])
    mx = N.new('ShaderNodeMixRGB'); L.new(mul.outputs[0], mx.inputs[0]); L.new(cr.outputs[0], mx.inputs[1]); mx.inputs[2].default_value = (.16, .24, .06, 1)
    out = mx
    if NEIGE:
        sn = N.new('ShaderNodeMapRange'); L.new(pos.outputs['Z'], sn.inputs[0]); sn.inputs[1].default_value = 3.4; sn.inputs[2].default_value = 4.4
        sp = N.new('ShaderNodeMapRange'); L.new(sep.outputs['Z'], sp.inputs[0]); sp.inputs[1].default_value = .4; sp.inputs[2].default_value = .65
        m2 = N.new('ShaderNodeMath'); m2.operation = 'MULTIPLY'; L.new(sn.outputs[0], m2.inputs[0]); L.new(sp.outputs[0], m2.inputs[1])
        mx2 = N.new('ShaderNodeMixRGB'); L.new(m2.outputs[0], mx2.inputs[0]); L.new(mx.outputs[0], mx2.inputs[1]); mx2.inputs[2].default_value = (.85, .88, .95, 1); out = mx2
    L.new(out.outputs[0], b.inputs['Base Color']); b.inputs['Roughness'].default_value = .9
    nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1.2; L.new(geo.outputs['Position'], nz.inputs['Vector'])
    al = N.new('ShaderNodeMapRange'); L.new(pos.outputs['Z'], al.inputs[0]); al.inputs[1].default_value = .08; al.inputs[2].default_value = .55
    an = N.new('ShaderNodeMath'); an.operation = 'ADD'; L.new(al.outputs[0], an.inputs[0]); L.new(nz.outputs['Fac'], an.inputs[1])
    ad = N.new('ShaderNodeMapRange'); L.new(an.outputs[0], ad.inputs[0]); ad.inputs[1].default_value = .55; ad.inputs[2].default_value = 1.15
    L.new(ad.outputs[0], b.inputs['Alpha'])
    return m
for k, (seed, pics) in enumerate([(3, 2), (11, 3), (17, 1), (23, 2), (31, 3), (41, 1)]):
    nom = 'mont_' + 'abcdef'[k] + ('_n' if NEIGE else '')
    bpy.ops.wm.read_homefile(use_empty=True); sc = bpy.context.scene
    o = relief(seed, pics); o.data.materials.append(materiau_peint() if PEINT else materiau()); bpy.context.view_layer.update()
    pts = [o.matrix_world @ v.co for v in o.data.vertices if v.co.z > .3]
    larg = max(p.x for p in pts) - min(p.x for p in pts); prof = max(p.y for p in pts) - min(p.y for p in pts); haut = max(p.z for p in pts)
    d = Vector((-.75, -.45, .62)).normalized()
    ld = bpy.data.lights.new('s', 'SUN'); ld.energy = 4.5; ld.color = (1, .89, .75); ld.angle = math.radians(3)
    lo = bpy.data.objects.new('s', ld); lo.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler(); sc.collection.objects.link(lo)
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (.62, .72, .9, 1); bg.inputs[1].default_value = .55
    el = math.radians(52); cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cd.ortho_scale = 22
    cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = (0, -100 * math.cos(el), 100 * math.sin(el) + 2.5); cam.rotation_euler = (math.pi / 2 - el, 0, 0)
    R = 512; sc.render.resolution_x = sc.render.resolution_y = R
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 40; sc.cycles.use_denoising = True; sc.render.film_transparent = True
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast' if PEINT else 'AgX - Base Contrast'
    png = f'/tmp/{nom}_brut.png'; sc.render.filepath = png; bpy.ops.render.render(write_still=True)
    pc = world_to_camera_view(sc, cam, Vector((0, min(p.y for p in pts) + .4, 0)))
    im = Image.open(png).convert('RGBA'); im.putalpha(im.getchannel('A').point(lambda v: 0 if v < 60 else v)); bb = im.getchannel('A').getbbox(); im = im.crop(bb)
    im.save(os.path.join(OUTD, f'{nom}_h.webp'), 'WEBP', quality=82, method=6)
    meta[f'{nom}_h'] = {'w': im.width, 'h': im.height, 'px': round(pc.x * R - bb[0], 1), 'py': round((1 - pc.y) * R - bb[1], 1), 'ppm': round(R / 22, 3), 'haut': round(haut, 2), 'larg': round(larg, 2)}
    print('FINI', nom, meta[f'{nom}_h'], flush=True)
mp = os.path.join(OUTD, 'imp_blender.json'); old = json.load(open(mp)) if os.path.exists(mp) else {}; old.update(meta); json.dump(old, open(mp, 'w'), indent=0)
