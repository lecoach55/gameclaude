"""Petits décors de la carte (touffes d'herbe fleuries, souches, fougères) : bouquets composés de modèles Poly Haven (CC0), rendus en imposteurs 'h' (52°).
Usage : /home/claude/bpyenv/bin/python touffes.py <dossier_modeles> <sortie_dir>"""
import bpy, math, sys, json, mathutils, os, random
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector
from PIL import Image
M, OUTD = sys.argv[-2], sys.argv[-1]
# nom : liste de (modèle, nombre, échelle visée en m de haut, rayon de dispersion)
BOUQ = {
 'touffe_a': [('grass_medium_01', 9, .45, .5), ('celandine_01', 7, .25, .45)],
 'touffe_b': [('grass_medium_01', 8, .5, .5), ('flower_gazania', 6, .22, .4)],
 'touffe_c': [('grass_medium_01', 7, .45, .45), ('periwinkle_plant', 4, .25, .4), ('dandelion_01', 4, .3, .4)],
 'fougere_a': [('fern_02', 5, .6, .4), ('grass_medium_01', 4, .4, .4)],
 'souche_a': [('tree_stump_01', 1, .55, 0), ('fern_02', 3, .45, .45), ('grass_medium_01', 5, .4, .5)],
 'tronc_a': [('dead_tree_trunk_02', 1, .45, 0), ('grass_medium_01', 6, .35, .6), ('celandine_01', 3, .2, .5)],
}
meta = {}
def charger(mod):
    before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=f'{M}/{mod}/{mod}.gltf')
    new = [o for o in bpy.data.objects if o not in before]
    for o in new:
        for c in o.users_collection: c.objects.unlink(o)
    ms = [o for o in new if o.type == 'MESH']
    return ms
for nom, parts in BOUQ.items():
    bpy.ops.wm.read_homefile(use_empty=True); sc = bpy.context.scene; random.seed(hash(nom) % 1000)
    for mod, n, ht, rad in parts:
        ms = charger(mod); bpy.context.view_layer.update()
        o = max(ms, key=lambda m: len(m.data.vertices))  # une seule variante du modèle
        vs = [o.matrix_world @ v.co for v in o.data.vertices]
        cx = sum(v.x for v in vs) / len(vs); cy = sum(v.y for v in vs) / len(vs); z0 = min(v.z for v in vs); z = max(v.z for v in vs) - z0 or 1
        base = mathutils.Matrix.Translation((-cx, -cy, -z0)) @ o.matrix_world
        for i in range(n):
            a = random.random() * 6.28; d = rad * math.sqrt(random.random()); s = ht / z * random.uniform(.75, 1.25)
            c = bpy.data.objects.new(o.name + str(i), o.data); sc.collection.objects.link(c)
            c.matrix_world = mathutils.Matrix.Translation((math.cos(a) * d, math.sin(a) * d * .8, 0)) @ mathutils.Matrix.Rotation(random.random() * 6.28, 4, 'Z') @ mathutils.Matrix.Scale(s, 4) @ base
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in sc.objects if o.type == 'MESH' for c in o.bound_box]
    haut = max(p.z for p in pts); larg = max(p.x for p in pts) - min(p.x for p in pts); y0 = min(p.y for p in pts)
    d = Vector((-.75, -.45, .62)).normalized()
    ld = bpy.data.lights.new('s', 'SUN'); ld.energy = 4.5; ld.color = (1, .89, .75); ld.angle = math.radians(3)
    lo = bpy.data.objects.new('s', ld); lo.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler(); sc.collection.objects.link(lo)
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (.62, .72, .9, 1); bg.inputs[1].default_value = .6
    el = math.radians(52); cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cd.ortho_scale = max(larg, 1.0) * 1.3
    cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = (0, -50 * math.cos(el), 50 * math.sin(el) + haut * .4); cam.rotation_euler = (math.pi / 2 - el, 0, 0)
    R = 256; sc.render.resolution_x = sc.render.resolution_y = R
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 48; sc.cycles.use_denoising = True; sc.render.film_transparent = True
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
    png = f'/tmp/{nom}_brut.png'; sc.render.filepath = png; bpy.ops.render.render(write_still=True)
    pc = world_to_camera_view(sc, cam, Vector((0, y0, 0)))
    im = Image.open(png).convert('RGBA'); im.putalpha(im.getchannel('A').point(lambda v: 0 if v < 40 else v)); bb = im.getchannel('A').getbbox(); im = im.crop(bb)
    im.save(os.path.join(OUTD, f'{nom}_h.webp'), 'WEBP', quality=85, method=6)
    meta[f'{nom}_h'] = {'w': im.width, 'h': im.height, 'px': round(pc.x * R - bb[0], 1), 'py': round((1 - pc.y) * R - bb[1], 1), 'ppm': round(R / cd.ortho_scale, 3), 'haut': round(haut, 2), 'larg': round(larg, 2)}
    print('FINI', nom, meta[f'{nom}_h'], flush=True)
mp = os.path.join(OUTD, 'imp_blender.json'); old = json.load(open(mp)) if os.path.exists(mp) else {}; old.update(meta); json.dump(old, open(mp, 'w'), indent=0)
