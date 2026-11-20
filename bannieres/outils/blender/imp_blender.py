"""Imposteurs de la carte (vue 'h' = 52°, caméra au sud, soleil = AMB.dir de rendu3d.js) rendus dans Blender (Cycles) depuis des modèles Poly Haven (CC0).
Usage : /home/claude/bpyenv/bin/python imp_blender.py <dossier_modeles> <sortie_dir> nom=modele:rotZdeg:etirZ[:teinte] ...
Écrit <sortie_dir>/<nom>_h.webp et <sortie_dir>/imp_blender.json (w, h, px, py = pied à l'avant du socle, ppm, haut, larg).
"""
import bpy, math, sys, json, mathutils, os
from bpy_extras.object_utils import world_to_camera_view
from PIL import Image
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
M, OUTD, items = args[0], args[1], args[2:]
meta = {}
for it in items:
    nom, spec = it.split('='); p = spec.split(':'); mod = p[0]; rz = float(p[1]) if len(p) > 1 else 0; ez = float(p[2]) if len(p) > 2 else 1; teinte = p[3] if len(p) > 3 else ''
    bpy.ops.wm.read_homefile(use_empty=True); sc = bpy.context.scene
    bpy.ops.import_scene.gltf(filepath=f'{M}/{mod}/{mod}.gltf')
    ms = [o for o in sc.objects if o.type == 'MESH']
    root = bpy.data.objects.new('r', None); sc.collection.objects.link(root)
    for o in sc.objects:
        if o.parent is None and o is not root: o.parent = root
    root.rotation_euler = (0, 0, math.radians(rz)); root.scale = (1, 1, ez); bpy.context.view_layer.update()
    pts = [o.matrix_world @ mathutils.Vector(c) for o in ms for c in o.bound_box]
    mn = mathutils.Vector([min(v[i] for v in pts) for i in range(3)]); mx = mathutils.Vector([max(v[i] for v in pts) for i in range(3)])
    root.location = (-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, -mn.z); bpy.context.view_layer.update()
    larg = mx.x - mn.x; prof = mx.y - mn.y; haut = mx.z - mn.z
    if teinte:
        for o in ms:
            for m in o.data.materials:
                if m and m.use_nodes:
                    b = m.node_tree.nodes.get('Principled BSDF')
                    if b and b.inputs['Base Color'].links:
                        l = b.inputs['Base Color'].links[0]; hs = m.node_tree.nodes.new('ShaderNodeHueSaturation')
                        hs.inputs['Saturation'].default_value = float(teinte); m.node_tree.links.new(l.from_socket, hs.inputs['Color']); m.node_tree.links.new(hs.outputs[0], b.inputs['Base Color'])
    d = mathutils.Vector((-.75, -.45, .62)).normalized()
    ld = bpy.data.lights.new('s', 'SUN'); ld.energy = 4.5; ld.color = (1, .89, .75); ld.angle = math.radians(3)
    lo = bpy.data.objects.new('s', ld); lo.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler(); sc.collection.objects.link(lo)
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (.62, .72, .9, 1); bg.inputs[1].default_value = .55
    el = math.radians(52); cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cd.ortho_scale = max(larg, prof, haut * 1.4) * 1.25
    cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = (0, -200 * math.cos(el), 200 * math.sin(el) + haut * .4); cam.rotation_euler = (math.pi / 2 - el, 0, 0)
    R = 512; sc.render.resolution_x = sc.render.resolution_y = R
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 48; sc.cycles.use_denoising = True; sc.render.film_transparent = True
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Base Contrast'
    png = f'/tmp/{nom}_brut.png'; sc.render.filepath = png; bpy.ops.render.render(write_still=True)
    pc = world_to_camera_view(sc, cam, mathutils.Vector((0, -prof / 2, 0)))
    im = Image.open(png).convert('RGBA'); bb = im.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox(); im = im.crop(bb)
    im.save(os.path.join(OUTD, f'{nom}_h.webp'), 'WEBP', quality=82, method=6)
    meta[f'{nom}_h'] = {'w': im.width, 'h': im.height, 'px': round(pc.x * R - bb[0], 1), 'py': round((1 - pc.y) * R - bb[1], 1), 'ppm': round(R / cd.ortho_scale, 3), 'haut': round(haut, 2), 'larg': round(larg, 2)}
    print('FINI', nom, im.size, meta[f'{nom}_h'], flush=True)
mp = os.path.join(OUTD, 'imp_blender.json'); old = json.load(open(mp)) if os.path.exists(mp) else {}; old.update(meta); json.dump(old, open(mp, 'w'), indent=0)
