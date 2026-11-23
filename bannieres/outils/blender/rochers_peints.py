"""Rochers « peints » façon Heroes (blocs arrondis, arêtes nettes, mousse sur le dessus), rendus dans Blender en imposteurs.
Remplacent les photos Poly Haven roc_a..d (trop réalistes à côté des arbres et montagnes peints).
Usage : ELEV=52 SUF=h /home/claude/bpyenv/bin/python rochers_peints.py <sortie_dir>   (b = ville : ELEV=8 SUF=b)
Écrit roc_<a..d>_<SUF>.webp + .webp.json (w, h, px, py, ppm, haut, larg ; pied = centre du socle)."""
import bpy, bmesh, math, sys, json, os, random
from bpy_extras.object_utils import world_to_camera_view
from mathutils import noise, Vector
from PIL import Image
OUT = sys.argv[-1]; os.makedirs(OUT, exist_ok=True); SUF = os.environ.get('SUF', 'h'); EL = float(os.environ.get('ELEV', '52'))
# VAR (23/11) : '' = roche moussue ; s = grès du désert ; n = enneigée ; l = basalte à fissures de lave
VAR = os.environ.get('VAR', '')

def bloc(seed, sx, sy, sz, pos=(0, 0, 0), rot=0):
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=5, radius=1)
    off = Vector((seed * 3.3, seed * 1.7, seed * .9))
    for v in bm.verts:
        p = v.co.copy()
        # facettes : bruit cellulaire grossier → plans de cassure ; détail fin
        f = noise.noise(p * .8 + off) * .32 + noise.noise(p * 1.9 + off * 2) * .1 + noise.fractal(p * 4 + off, .5, 2, 4) * .04
        p = p * (1 + f)
        p.x *= sx; p.y *= sy; p.z *= sz
        if p.z < -.15 * sz: p.z = -.15 * sz + (p.z + .15 * sz) * .15  # base aplatie, posée dans le sol
        v.co = p
    me = bpy.data.meshes.new('r'); bm.to_mesh(me); o = bpy.data.objects.new('roc', me)
    o.location = pos; o.rotation_euler = (0, 0, rot); bpy.context.scene.collection.objects.link(o)
    for pl in me.polygons: pl.use_smooth = True
    return o

def materiau():
    m = bpy.data.materials.new('roche_p'); m.use_nodes = True; N = m.node_tree.nodes; L = m.node_tree.links; b = N['Principled BSDF']
    geo = N.new('ShaderNodeNewGeometry'); sep = N.new('ShaderNodeSeparateXYZ'); L.new(geo.outputs['Normal'], sep.inputs[0])
    wv = N.new('ShaderNodeTexNoise'); wv.inputs['Scale'].default_value = 2.2; wv.inputs['Detail'].default_value = 6; L.new(geo.outputs['Position'], wv.inputs['Vector'])
    cr = N.new('ShaderNodeValToRGB'); e = cr.color_ramp.elements; e[0].position = .32; e[1].position = .7
    C0, C1, C2 = {'s': ((.09, .05, .02, 1), (.42, .26, .12, 1), (.22, .13, .06, 1)), 'l': ((.012, .01, .01, 1), (.07, .06, .055, 1), (.035, .03, .028, 1))}.get(VAR, ((.07, .06, .045, 1), (.3, .25, .18, 1), (.17, .145, .11, 1)))
    e[0].color = C0; e[1].color = C1; e.new(.5).color = C2
    L.new(wv.outputs['Fac'], cr.inputs['Fac'])
    vo = N.new('ShaderNodeTexVoronoi'); vo.feature = 'DISTANCE_TO_EDGE'; vo.inputs['Scale'].default_value = 1.4; L.new(geo.outputs['Position'], vo.inputs['Vector'])
    no = N.new('ShaderNodeTexNoise'); no.inputs['Scale'].default_value = 9; no.inputs['Detail'].default_value = 8; L.new(geo.outputs['Position'], no.inputs['Vector'])
    hb = N.new('ShaderNodeMath'); hb.operation = 'MULTIPLY_ADD'; hb.inputs[1].default_value = .35; L.new(no.outputs['Fac'], hb.inputs[0]); L.new(vo.outputs['Distance'], hb.inputs[2])
    bu = N.new('ShaderNodeBump'); bu.inputs['Strength'].default_value = .7; bu.inputs['Distance'].default_value = .08; L.new(hb.outputs[0], bu.inputs['Height']); L.new(bu.outputs['Normal'], b.inputs['Normal'])
    # fissures sombres (bords des cellules)
    fi = N.new('ShaderNodeMapRange'); L.new(vo.outputs['Distance'], fi.inputs[0]); fi.inputs[1].default_value = .0; fi.inputs[2].default_value = .025
    mf = N.new('ShaderNodeMixRGB'); mf.blend_type = 'MULTIPLY'; L.new(cr.outputs[0], mf.inputs[1]); mf.inputs[0].default_value = 1
    cf = N.new('ShaderNodeMixRGB'); L.new(fi.outputs[0], cf.inputs[0]); cf.inputs[1].default_value = (.55, .5, .48, 1); cf.inputs[2].default_value = (1, 1, 1, 1); L.new(cf.outputs[0], mf.inputs[2])
    # mousse sur le dessus
    pe = N.new('ShaderNodeMapRange'); L.new(sep.outputs['Z'], pe.inputs[0]); pe.inputs[1].default_value = .72; pe.inputs[2].default_value = .9
    mn = N.new('ShaderNodeTexNoise'); mn.inputs['Scale'].default_value = 4; L.new(geo.outputs['Position'], mn.inputs['Vector'])
    mm = N.new('ShaderNodeMapRange'); L.new(mn.outputs['Fac'], mm.inputs[0]); mm.inputs[1].default_value = .42; mm.inputs[2].default_value = .58
    mul = N.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; L.new(pe.outputs[0], mul.inputs[0]); L.new(mm.outputs[0], mul.inputs[1])
    mo = N.new('ShaderNodeMixRGB'); L.new(mul.outputs[0], mo.inputs[0]); L.new(mf.outputs[0], mo.inputs[1]); mo.inputs[2].default_value = {'n': (.9, .93, 1, 1), 's': (.3, .19, .09, 1), 'l': (.03, .025, .025, 1)}.get(VAR, (.09, .15, .035, 1))
    if VAR == 'n': pe.inputs[1].default_value = .58; pe.inputs[2].default_value = .74; mm.inputs[1].default_value = .3; mm.inputs[2].default_value = .4
    L.new(mo.outputs[0], b.inputs['Base Color']); b.inputs['Roughness'].default_value = .88
    if VAR == 'l':  # fissures incandescentes
        gl = N.new('ShaderNodeMapRange'); L.new(vo.outputs['Distance'], gl.inputs[0]); gl.inputs[1].default_value = .018; gl.inputs[2].default_value = 0
        L.new(gl.outputs[0], b.inputs['Emission Strength']); b.inputs['Emission Color'].default_value = (1, .2, 0, 1); gl.inputs[4].default_value = 3.5
    return m

# a : gros bloc unique ; b : bloc plat ; c : amas de trois ; d : rocher haut et étroit
FORMES = {
    'a': [(5, 1.15, 1, .85, (0, 0, 0), .3)],
    'b': [(9, 1.3, 1.05, .55, (0, 0, 0), 1.1), (12, .55, .5, .4, (1.05, -.35, 0), .4)],
    'c': [(14, .95, .85, .8, (-.45, .1, 0), .2), (21, .7, .65, .6, (.7, -.15, 0), 1.5), (27, .45, .45, .38, (.15, -.75, 0), .8)],
    'd': [(33, .7, .65, 1.25, (0, 0, 0), .6), (38, .45, .4, .35, (.6, -.3, 0), 2)],
}
d = Vector((-.75, -.45, .62)).normalized()
for nom, parts in FORMES.items():
    bpy.ops.wm.read_homefile(use_empty=True); sc = bpy.context.scene; mat = materiau()
    objs = []
    for (s, sx, sy, sz, p, r) in parts:
        o = bloc(s, sx, sy, sz, p, r); o.data.materials.append(mat); objs.append(o)
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ v.co for o in objs for v in o.data.vertices]
    larg = max(p.x for p in pts) - min(p.x for p in pts); haut = max(p.z for p in pts)
    ld = bpy.data.lights.new('s', 'SUN'); ld.energy = 4.5; ld.color = (1, .89, .75); ld.angle = math.radians(4)
    lo = bpy.data.objects.new('s', ld); lo.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler(); sc.collection.objects.link(lo)
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (.62, .72, .9, 1); bg.inputs[1].default_value = .6
    el = math.radians(EL); cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cd.ortho_scale = max(larg, haut * 1.3) * 1.25
    cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
    cz = haut * .35
    cam.location = (0, -50 * math.cos(el), 50 * math.sin(el) + cz); cam.rotation_euler = (math.pi / 2 - el, 0, 0)
    R = 384; sc.render.resolution_x = sc.render.resolution_y = R
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 48; sc.cycles.use_denoising = True; sc.render.film_transparent = True
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
    png = f'/tmp/roc_{nom}{VAR}_{SUF}.png'; sc.render.filepath = png; bpy.ops.render.render(write_still=True)
    pc = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    im = Image.open(png).convert('RGBA'); im.putalpha(im.getchannel('A').point(lambda v: 0 if v < 40 else v)); bb = im.getchannel('A').getbbox(); im = im.crop(bb)
    from PIL import ImageEnhance; a = im.getchannel('A'); im = ImageEnhance.Contrast(ImageEnhance.Brightness(im.convert('RGB')).enhance(.82 if VAR != 'l' else 1)).enhance(1.18).convert('RGBA'); im.putalpha(a)  # plus sombre et contrasté, comme les montagnes peintes
    im.save(f'{OUT}/roc_{nom}{VAR}_{SUF}.webp', 'WEBP', quality=86, method=6)
    meta = {'w': im.width, 'h': im.height, 'px': round(pc.x * R - bb[0], 1), 'py': round((1 - pc.y) * R - bb[1], 1), 'ppm': round(R / cd.ortho_scale, 3), 'haut': round(haut, 2), 'larg': round(larg, 2)}
    json.dump(meta, open(f'{OUT}/roc_{nom}{VAR}_{SUF}.webp.json', 'w')); print('FINI', nom, meta, flush=True)
