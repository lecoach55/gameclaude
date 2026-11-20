"""Fonctions communes aux scripts Blender du studio (module Python « bpy », Blender 5 dans le cloud).
Importé par planche_sprites.py, cuire_ao.py et rendu_studio.py ; à lancer avec /home/claude/bpyenv/bin/python
(installé par `sh outils-communs/blender/installer.sh`).

Conventions : Blender a Z en haut ; un GLB (Y en haut, face vers +Z) est importé face vers −Y, c'est-à-dire vers la
caméra des studios (placée du côté −Y). Une rotation de θ autour de l'axe Y de Three.js = θ autour de Z ici.
"""
import math
import os
import sys
import time

import bpy
import mathutils

V = mathutils.Vector


def vider():
    """Scène vide (pas de cube ni de lampe par défaut)."""
    bpy.ops.wm.read_homefile(use_empty=True)
    return bpy.context.scene


def importer(chemin):
    """Importe GLB/glTF, FBX ou OBJ. Rend la liste des maillages rendus (ceux cachés au rendu sont écartés)."""
    if not os.path.isfile(chemin):
        raise SystemExit(f'modèle introuvable : {chemin}')
    ext = os.path.splitext(chemin)[1].lower()
    avant = set(bpy.data.objects)
    if ext in ('.glb', '.gltf'):
        bpy.ops.import_scene.gltf(filepath=chemin)
    elif ext == '.fbx':
        bpy.ops.import_scene.fbx(filepath=chemin)
    elif ext == '.obj':
        bpy.ops.wm.obj_import(filepath=chemin)
    else:
        raise SystemExit(f'format non pris en charge : {ext} (glb, gltf, fbx, obj)')
    nouveaux = [o for o in bpy.data.objects if o not in avant]
    # 20/11 : un GLB à squelette fait créer par l'importeur glTF une « Icosphere » (forme d'affichage des os, rayon 1, en 0) ;
    # comptée comme maillage, elle posait le modèle 1 unité trop haut et le disait « coupé » (béhémoth 2,8 u lu 3,8 u)
    formes = {pb.custom_shape for o in nouveaux if o.type == 'ARMATURE' for pb in o.pose.bones if pb.custom_shape}
    for f in formes:
        f.hide_render = True; f.hide_viewport = True; f['studio'] = 1
    return [o for o in nouveaux if o.type == 'MESH' and not o.hide_render and o not in formes]


def maillages(scene=None):
    scene = scene or bpy.context.scene
    return [o for o in scene.objects if o.type == 'MESH' and not o.hide_render and not o.get('studio')]


def boite(objs):
    """Boîte englobante monde des maillages APRÈS déformation (squelette, modificateurs) : (min, max)."""
    dg = bpy.context.evaluated_depsgraph_get()
    mn, mx = V((1e18,) * 3), V((-1e18,) * 3)
    for o in objs:
        ev = o.evaluated_get(dg)
        try:
            me = ev.to_mesh()
        except RuntimeError:
            me = None
        pts = [ev.matrix_world @ v.co for v in me.vertices] if me is not None and len(me.vertices) else \
              [ev.matrix_world @ V(c) for c in ev.bound_box]
        if me is not None:
            ev.to_mesh_clear()
        for w in pts:
            mn = V(map(min, mn, w)); mx = V(map(max, mx, w))
    if mn.x > mx.x:
        raise SystemExit('aucun maillage visible dans le modèle')
    return mn, mx


def triangles(objs):
    n = 0
    for o in objs:
        o.data.calc_loop_triangles()
        n += len(o.data.loop_triangles)
    return n


def pivot(objs, rotation_deg=0.0, hauteur=None, centrer=True):
    """Regroupe le modèle sous un pivot posé au sol : centre de la boîte en x/y = 0 (si centrer), bas à z = 0,
    hauteur ramenée à `hauteur` unités si donnée, tourné de `rotation_deg` autour de la verticale.
    Le pivot sert ensuite aux poses de remplacement (corps entier). Rend (pivot, hauteur finale)."""
    sc = bpy.context.scene
    p = bpy.data.objects.new('PIVOT_STUDIO', None)
    p['studio'] = 1
    sc.collection.objects.link(p)
    racines = {o for o in sc.objects if o.parent is None and o is not p and not o.get('studio')}
    bpy.context.view_layer.update()
    for o in racines:
        mw = o.matrix_world.copy()
        o.parent = p
        o.matrix_parent_inverse = p.matrix_world.inverted()
        o.matrix_world = mw
    p.rotation_euler = (0, 0, math.radians(rotation_deg))
    bpy.context.view_layer.update()
    mn, mx = boite(objs)
    h = mx.z - mn.z
    k = (hauteur / h) if hauteur and h > 1e-9 else 1.0
    c = (mn + mx) / 2
    # déplacement appliqué aux enfants pour que le pivot reste à l'origine (les poses tournent autour du sol)
    for o in racines:
        o.matrix_world = mathutils.Matrix.Translation(V((-c.x if centrer else 0, -c.y if centrer else 0, -mn.z))) @ o.matrix_world
    p.scale = (k, k, k)
    bpy.context.view_layer.update()
    return p, h * k


def nettoyer(objs, fusion=1e-5):
    """Fusionne les sommets en double (coutures d'export) sans toucher aux normales personnalisées. Rend le nombre retiré."""
    import bmesh
    n = 0
    for o in objs:
        if o.data.users > 1:
            o.data = o.data.copy()
        bm = bmesh.new(); bm.from_mesh(o.data)
        avant = len(bm.verts)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=fusion)
        n += avant - len(bm.verts)
        bm.to_mesh(o.data); bm.free(); o.data.update()
    return n


def decimer(objs, cible):
    """Réduit l'ensemble à ≈ `cible` triangles (Decimate « collapse » appliqué, avant le squelette). Les maillages à
    clés de forme ne sont pas réduits (Blender refuse) : ils sont signalés. Rend (avant, après, ignorés)."""
    avant = triangles(objs)
    ignores = []
    if not cible or avant <= cible:
        return avant, avant, ignores
    ratio = max(0.01, cible / avant)
    for o in objs:
        if o.data.shape_keys:
            ignores.append(o.name); continue
        if o.data.users > 1:
            o.data = o.data.copy()
        m = o.modifiers.new('DECIMER_STUDIO', 'DECIMATE')
        m.ratio = ratio
        m.use_collapse_triangulate = True
        with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o]):
            bpy.ops.object.modifier_move_to_index(modifier=m.name, index=0)
            bpy.ops.object.modifier_apply(modifier=m.name)
    return avant, triangles(objs), ignores


def _soleil(sc, nom, depuis, force, coul, ang_deg):
    d = bpy.data.lights.new(nom, 'SUN'); d.energy = force; d.color = coul; d.angle = math.radians(ang_deg)
    o = bpy.data.objects.new(nom, d); o['studio'] = 1
    o.rotation_euler = (-V(depuis)).to_track_quat('-Z', 'Y').to_euler()
    sc.collection.objects.link(o)
    return o


def lumieres_studio(sc, force=1.0, ciel=0.6):
    """Lumière « peinture de jeu » reprise du studio Three.js de Bannières (clé chaude en haut à gauche, contre-jour
    froid derrière à droite, appoint chaud) + ciel doux. Positions Three.js (x, y, z) → Blender (x, −z, y)."""
    _soleil(sc, 'cle', (-3, -4, 5), 4.0 * force, (1.0, .90, .78), 6)
    _soleil(sc, 'contre', (3, 4, 3), 2.6 * force, (.66, .78, 1.0), 3)
    _soleil(sc, 'appoint', (4, -3, 1), 0.9 * force, (1.0, .85, .66), 10)
    w = bpy.data.worlds.new('ciel_studio'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']
    bg.inputs[0].default_value = (.60, .58, .52, 1); bg.inputs[1].default_value = ciel


def camera_ortho(sc, fw, fh, u, pitch=0.42, centre_z=None):
    """Caméra orthographique du studio de Bannières : cadre fw×fh px, `u` unités du monde = hauteur du cadre, vue
    plongeante de `pitch` radians, visée à 0,38·u au-dessus du sol (comme studio.js)."""
    cd = bpy.data.cameras.new('cam_studio'); cd.type = 'ORTHO'
    cd.sensor_fit = 'VERTICAL' if fw >= fh else 'HORIZONTAL'
    cd.ortho_scale = u if fw >= fh else u * fw / fh
    cd.clip_start, cd.clip_end = 0.1, 60
    cam = bpy.data.objects.new('cam_studio', cd); cam['studio'] = 1
    sc.collection.objects.link(cam); sc.camera = cam
    cz = u * .38 if centre_z is None else centre_z
    cam.location = (0, -math.cos(pitch) * 12, math.sin(pitch) * 12 + cz)
    cam.rotation_euler = (V((0, 0, cz)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.resolution_x, sc.render.resolution_y = fw, fh
    sc.render.pixel_aspect_x = sc.render.pixel_aspect_y = 1
    return cam


def cycles(sc, echantillons=32, debruiter=True, fils=0):
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = max(1, int(echantillons))
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.use_denoising = bool(debruiter)
    if debruiter:
        try:
            sc.cycles.denoiser = 'OPENIMAGEDENOISE'
        except TypeError:
            pass
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.render.resolution_percentage = 100
    if fils:
        sc.render.threads_mode = 'FIXED'; sc.render.threads = fils
    sc.view_settings.view_transform = 'AgX'
    try:
        sc.view_settings.look = 'AgX - Medium High Contrast'
    except TypeError:
        pass


def sol_ombre(sc, taille):
    """Sol attrape-ombre (ombre de contact semi-transparente)."""
    bpy.ops.mesh.primitive_plane_add(size=taille, location=(0, 0, 0))
    s = bpy.context.object; s.is_shadow_catcher = True; s['studio'] = 1
    return s


def rendre(sc, chemin):
    sc.render.filepath = chemin
    with open(os.devnull, 'w') as nul:   # Cycles écrit des centaines de lignes de progression
        fd = os.dup(1); os.dup2(nul.fileno(), 1)
        try:
            bpy.ops.render.render(write_still=True)
        finally:
            os.dup2(fd, 1); os.close(fd)
    return chemin


class Chrono:
    def __init__(self):
        self.t0 = time.time()

    def __call__(self):
        return round(time.time() - self.t0, 1)


def dire(*a):
    print(*a, flush=True)
    sys.stdout.flush()
