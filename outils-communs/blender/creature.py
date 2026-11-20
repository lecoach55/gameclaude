"""Sculpte une créature animée dans Blender à partir d'une RECETTE (squelette + rayons + couleurs + mouvements), sans modèle
source : pour les bêtes qu'aucune source CC0 ne fournit (béhémoth dressé, monstres du jeu). Écrit un GLB avec squelette,
couleurs par sommet (COLOR_0) et animations nommées Idle / Attack / Hit / Death, que planche_sprites.py rend ensuite
comme n'importe quel modèle animé (poses prises dans ses animations, pas de pose de remplacement).

  /home/claude/bpyenv/bin/python outils-communs/blender/creature.py recette.json sortie.glb [--apercu apercu.png]
  puis : /home/claude/bpyenv/bin/python outils-communs/blender/planche_sprites.py sortie.glb dossier --id behemoth --comme-bannieres

Exemples de recettes : outils-communs/blender/recettes/ (behemoth_dresse.json : mi-ours mi-singe dressé façon Heroes III).

Repère de la recette : unités du monde (1 = hauteur d'un homme ≈ 1,8 m dans Bannières : comparer avec --hauteur),
X = vers l'avant (regard, comme les bêtes de quad.js), Y = côté gauche, Z = haut, sol en z = 0.

Recette (JSON) :
  "os": [{"nom": "bassin", "tete": [0,0,1.0], "queue": [0,0,1.4], "r": [0.42, 0.5]},
         {"nom": "torse", "parent": "bassin", "queue": [0.15,0,2.1], "r": 0.62},          tête = queue du parent si absente
         {"nom": "bras.L", "parent": "torse", "tete": [0.1,0.55,1.95], "queue": [...], "r": [0.25,0.2], "couleur": "#…"}]
      r = rayon à la tête et à la queue de l'os (un nombre = les deux) ; "aplati": 0.7 = section ovale (largeur × 0,7 en
      hauteur) ; un os « .L » est recopié en « .R » par symétrie (y → −y) ; "couleur" teinte la peau autour de l'os
      ("melange" 0-1, défaut 1) ; "segments": nombre de sommets intermédiaires (défaut : selon longueur / rayon).
  "pieces": [{"forme": "cone"|"sphere"|"cylindre", "os": "tete", "de": [x,y,z], "a": [x,y,z], "r": 0.08, "r2": 0.0,
              "couleur": "#5e5444", "rugosite": 0.5}]   cornes, griffes, crocs, yeux : rigides, suivent leur os ;
      recopiées de l'autre côté (y → −y) si leur os est « .L » ou si elles sont hors de l'axe sur un os central
      (cornes, yeux ; "symetrie": false pour une pièce unique).
  "peau": {"couleur": "#3e3730", "fonce": "#1a1612", "ventre": "#5a4e40", "taches": 0.35, "freq": 3.0,
           "relief": 0.03, "relief_freq": 9, "poil": 0.012, "rugosite": 0.85, "subdivision": 2, "triangles": 40000}
      relief = bosses (unités) ; poil = grain fin dans le sens du corps ; triangles = plafond après décimation.
  "animations": {"Idle": {"duree": 1.6, "cles": [{"t": 0, "os": {"torse": {"tangage": 4}}, "deplacement": [0,0,0]}, …]},
                 "Attack": …, "Hit": …, "Death": …}
      Rotations en degrés, axes du repère au repos, autour de la tête de l'os, relatives au parent :
      tangage = autour de Y (+ = penche vers l'avant / le bas), roulis = autour de X (+ = vers la droite), lacet = autour
      de Z (+ = tourne vers la gauche). "bras.*" = les deux côtés (roulis et lacet inversés à droite).
      deplacement = translation de l'os racine (unités du monde). Une animation « boucle » (Idle) doit finir comme elle commence.

Sortie : sortie.glb + sortie.json (triangles, os, animations, hauteur, secondes). Code 2 = recette invalide (message clair).
"""
import argparse
import json
import math
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import bmesh  # noqa: E402
import mathutils  # noqa: E402
from mathutils import noise  # noqa: E402

import bpy_outils as B  # noqa: E402

V = mathutils.Vector
AXES = {'tangage': (0, 1, 0), 'roulis': (1, 0, 0), 'lacet': (0, 0, 1)}


def refus(msg):
    print('recette invalide : ' + msg, file=sys.stderr, flush=True)
    raise SystemExit(2)


def couleur(h, defaut=(0.5, 0.5, 0.5)):
    if h is None:
        return defaut
    if isinstance(h, (list, tuple)):
        return tuple(float(x) for x in h[:3])
    h = str(h).lstrip('#')
    if len(h) != 6:
        refus(f'couleur « {h} » : attendu #rrggbb')
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb)   # sRGB → linéaire


def miroir_nom(n):
    return n[:-2] + '.R' if n.endswith('.L') else n


def miroir_pt(p):
    return [p[0], -p[1], p[2]]


def lire_os(rec):
    os_ = rec.get('os')
    if not isinstance(os_, list) or not os_:
        refus('"os" doit être une liste non vide')
    par_nom, liste = {}, []
    for o in os_:
        for k in ('nom', 'queue'):
            if k not in o:
                refus(f'os {o.get("nom", "?")} : « {k} » manquant')
        if o['nom'] in par_nom:
            refus(f'os « {o["nom"]} » en double')
        p = o.get('parent')
        if p is not None and p not in par_nom:
            refus(f'os « {o["nom"]} » : parent « {p} » inconnu (le déclarer avant)')
        if 'tete' not in o and p is None:
            refus(f'os racine « {o["nom"]} » : « tete » manquante')
        tete = list(o['tete']) if 'tete' in o else list(par_nom[p]['queue'])
        r = o.get('r', 0.1)
        r = [float(r), float(r)] if not isinstance(r, list) else [float(r[0]), float(r[-1])]
        d = dict(o, tete=tete, r=r, connecte='tete' not in o or (p is not None and V(tete) == V(par_nom[p]['queue'])))
        par_nom[o['nom']] = d; liste.append(d)
        if o['nom'].endswith('.L'):
            m = dict(d, nom=miroir_nom(o['nom']), tete=miroir_pt(tete), queue=miroir_pt(o['queue']),
                     parent=miroir_nom(p) if p else None)
            if m['nom'] in par_nom:
                refus(f'os « {m["nom"]} » déclaré ET recopié de « {o["nom"]} » : ne déclarer que le côté .L')
            if m['parent'] and m['parent'] not in par_nom:
                refus(f'os « {m["nom"]} » : parent « {m["parent"]} » inconnu')
            par_nom[m['nom']] = m; liste.append(m)
    racines = [o for o in liste if not o.get('parent')]
    if len(racines) != 1:
        refus(f'il faut exactement un os racine (sans parent) : {[o["nom"] for o in racines]}')
    return liste, par_nom


def corps(liste, peau):
    """Maillage « peau » : squelette en arêtes + modificateur Skin (rayons par sommet) + subdivision, appliqués."""
    bm = bmesh.new(); verts = {}   # clé = point arrondi → sommet partagé (articulations)
    rayons = {}
    chaine = {}   # os → ses sommets (pour accrocher un os enfant non connecté à son parent : une seule peau d'un tenant)

    def sommet(p, r, ap):
        k = tuple(round(c, 4) for c in p)
        if k not in verts:
            verts[k] = bm.verts.new(V(p)); rayons[k] = []
        rayons[k].append((r, ap))
        return verts[k]
    for o in liste:
        a, b = V(o['tete']), V(o['queue']); L = (b - a).length
        if L < 1e-4:
            refus(f'os « {o["nom"]} » de longueur nulle')
        n = int(o.get('segments', max(1, min(8, round(L / max(0.05, min(o['r']) * 0.9))))))
        prev = sommet(a, o['r'][0], o.get('aplati', 1.0)); chaine[o['nom']] = [prev]
        if o.get('parent') and not o['connecte']:   # épaule, cuisse, queue : arête vers le sommet le plus proche du parent
            pv = min(chaine[o['parent']], key=lambda v: (v.co - a).length)
            if pv is not prev:
                try:
                    bm.edges.new((pv, prev))
                except ValueError:
                    pass
        for i in range(1, n + 1):
            t = i / n
            cur = sommet(a.lerp(b, t), o['r'][0] * (1 - t) + o['r'][1] * t, o.get('aplati', 1.0))
            if cur is not prev:
                try:
                    bm.edges.new((prev, cur))
                except ValueError:
                    pass
            prev = cur; chaine[o['nom']].append(cur)
    me = bpy.data.meshes.new('peau'); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new('peau', me); bpy.context.scene.collection.objects.link(ob)
    sk = ob.modifiers.new('skin', 'SKIN'); sk.branch_smoothing = 0.6; sk.use_smooth_shade = True
    cles = [tuple(round(c, 4) for c in v.co) for v in me.vertices]
    for i, k in enumerate(cles):
        r = max(x[0] for x in rayons[k]); ap = min(x[1] for x in rayons[k])
        me.skin_vertices[0].data[i].radius = (r, r * ap)
    racine = V(liste[0]['tete'])
    i0 = min(range(len(cles)), key=lambda i: (V(cles[i]) - racine).length)
    me.skin_vertices[0].data[i0].use_root = True
    sub = ob.modifiers.new('sub', 'SUBSURF'); sub.levels = sub.render_levels = int(peau.get('subdivision', 2))
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    for m in list(ob.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)
    return ob


def relief(ob, peau):
    """Bosses (bruit fractal) et grain de poil, le long des normales ; écrit avant le squelette."""
    amp, f = float(peau.get('relief', 0.03)), float(peau.get('relief_freq', 9))
    poil = float(peau.get('poil', 0.0))
    me = ob.data
    for v in me.vertices:
        p = v.co * f
        d = amp * noise.fractal(p, 0.6, 2.0, 4)
        if poil:
            d += poil * noise.noise(V((v.co.x * 90, v.co.y * 90, v.co.z * 18)))   # stries allongées en hauteur
        v.co += v.normal * d
    me.update()


def decimer(ob, cible):
    tri = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    if cible and tri > cible:
        m = ob.modifiers.new('dec', 'DECIMATE'); m.ratio = cible / tri
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.modifier_apply(modifier=m.name)


def armature(liste):
    ad = bpy.data.armatures.new('squelette'); arm = bpy.data.objects.new('squelette', ad)
    bpy.context.scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm; arm.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    eb = {}
    for o in liste:
        b = ad.edit_bones.new(o['nom']); b.head, b.tail = V(o['tete']), V(o['queue'])
        b.roll = 0.0; eb[o['nom']] = b
        if o.get('parent'):
            b.parent = eb[o['parent']]; b.use_connect = bool(o['connecte'])
    bpy.ops.object.mode_set(mode='OBJECT')
    return arm


def lier(ob, arm):
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    sans = [v.index for v in ob.data.vertices if not v.groups]
    if sans:   # chaleur des os en échec par endroits (pièces fines) : os le plus proche
        for i in sans:
            p = ob.data.vertices[i].co
            nom = min(arm.data.bones, key=lambda b: geodist(p, b.head_local, b.tail_local)).name
            g = ob.vertex_groups.get(nom) or ob.vertex_groups.new(name=nom)
            g.add([i], 1.0, 'REPLACE')
    return len(sans)


def geodist(p, a, b):
    ab = b - a; t = max(0.0, min(1.0, (p - a).dot(ab) / max(1e-9, ab.length_squared)))
    return (a + ab * t - p).length


def colorier(ob, arm, liste, peau):
    """Couleurs par sommet (COLOR_0 du GLB) : robe tachetée, ventre plus clair dessous, teinte propre à certains os."""
    base, fonce = couleur(peau.get('couleur'), (.24, .2, .17)), couleur(peau.get('fonce'), (.05, .04, .03))
    ventre = couleur(peau.get('ventre'), base); tach, f = float(peau.get('taches', .35)), float(peau.get('freq', 3))
    teinte = {o['nom']: (couleur(o['couleur']), float(o.get('melange', 1))) for o in liste if o.get('couleur')}
    me = ob.data
    attr = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    groupes = {g.index: g.name for g in ob.vertex_groups}
    for v in me.vertices:
        n = noise.fractal(v.co * f, 0.55, 2.0, 3) * 0.5 + 0.5
        c = [b * (1 - tach * n) + fo * tach * n for b, fo in zip(base, fonce)]
        dessous = max(0.0, min(1.0, (-v.normal.z - 0.15) / 0.5))
        c = [x * (1 - dessous) + y * dessous for x, y in zip(c, ventre)]
        if teinte and v.groups:
            g = max(v.groups, key=lambda g: g.weight)
            nom = groupes.get(g.group)
            if nom in teinte:
                (tc, mel), w = teinte[nom], min(1.0, g.weight * 1.3)
                c = [x * (1 - mel * w) + y * mel * w for x, y in zip(c, tc)]
        attr.data[v.index].color = (*c, 1.0)
    me.color_attributes.active_color = attr
    mat = materiau('peau', rugosite=float(peau.get('rugosite', .85)), attribut='Col')
    me.materials.clear(); me.materials.append(mat)


def materiau(nom, rugosite=.8, attribut=None, rgb=None):
    m = bpy.data.materials.new(nom); m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Roughness'].default_value = rugosite
    if attribut:
        ca = m.node_tree.nodes.new('ShaderNodeVertexColor'); ca.layer_name = attribut
        m.node_tree.links.new(ca.outputs['Color'], bsdf.inputs['Base Color'])
    elif rgb:
        bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    return m


def pieces(ob, arm, rec):
    """Cornes, griffes, yeux : primitives rigides jointes au corps, entièrement liées à leur os."""
    pl = []
    for p in rec.get('pieces', []):
        pl.append(p)
        cote = p.get('os', '').endswith(('.L', '.R'))
        if p.get('os', '').endswith('.L') or (not cote and p.get('symetrie', True) and abs(p['de'][1]) > 1e-3):
            # courbure : décalage le long de l'axe x LOCAL de la pièce, qui change de sens dans le miroir (relecture du 20/11 : corne
            # droite recourbée vers l'avant, la gauche vers l'arrière)
            pl.append(dict(p, os=miroir_nom(p['os']), de=miroir_pt(p['de']), a=miroir_pt(p.get('a', p['de'])),
                           courbure=-float(p.get('courbure', 0.0))))
    n = 0; pointes = []
    for p in pl:
        if p.get('os') not in arm.data.bones:
            refus(f'pièce {p.get("forme")} : os « {p.get("os")} » inconnu')
        a, b = V(p['de']), V(p.get('a', p['de'])); r = float(p.get('r', .05)); d = (b - a)
        forme = p.get('forme', 'sphere')
        bm = bmesh.new()
        if forme == 'sphere':
            bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=r)
            if d.length > 1e-4:   # ellipsoïde étiré de « de » vers « a »
                for v in bm.verts:
                    v.co.z *= max(1.0, d.length / (2 * r))
        elif forme in ('cone', 'cylindre'):
            r2 = float(p.get('r2', 0.0 if forme == 'cone' else r))
            bmesh.ops.create_cone(bm, cap_ends=True, segments=14, radius1=r, radius2=max(r2, 0.002), depth=max(d.length, 1e-3))
        else:
            refus(f'pièce : forme « {forme} » inconnue (cone, sphere, cylindre)')
        courbe = float(p.get('courbure', 0.0))   # corne qui se recourbe : décalage croissant vers la pointe
        if courbe and forme == 'cone':
            for v in bm.verts:
                t = (v.co.z / max(d.length, 1e-3)) + 0.5
                v.co.x += courbe * d.length * t * t
        me = bpy.data.meshes.new('piece'); bm.to_mesh(me); bm.free()
        po = bpy.data.objects.new('piece', me); bpy.context.scene.collection.objects.link(po)
        axe = d.normalized() if d.length > 1e-4 else V((0, 0, 1))
        po.matrix_world = mathutils.Matrix.Translation((a + b) / 2) @ axe.to_track_quat('Z', 'Y').to_matrix().to_4x4()
        for pf in me.polygons:
            pf.use_smooth = True
        haut = max(me.vertices, key=lambda v: v.co.z)   # pointe (cône) ou haut de la pièce, en coordonnées du monde
        pointes.append([round(c, 3) for c in po.matrix_world @ haut.co])
        c = couleur(p.get('couleur'), (.3, .28, .25))
        at = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
        for i in range(len(me.vertices)):
            at.data[i].color = (*c, 1.0)
        g = po.vertex_groups.new(name=p['os']); g.add(list(range(len(me.vertices))), 1.0, 'REPLACE')
        if 'rugosite' in p:
            me.materials.append(materiau(f'piece{n}', rugosite=float(p['rugosite']), attribut='Col'))
        else:
            me.materials.append(ob.data.materials[0])
        bpy.ops.object.select_all(action='DESELECT')
        po.select_set(True); ob.select_set(True); bpy.context.view_layer.objects.active = ob
        bpy.ops.object.join(); n += 1
    return n, pointes


def rot_locale(arm, nom, r):
    """{tangage, roulis, lacet} (degrés, axes du repère au repos) → quaternion local de l'os."""
    q = mathutils.Quaternion()
    for k in ('lacet', 'tangage', 'roulis'):
        if k in r:
            q = mathutils.Quaternion(V(AXES[k]), math.radians(float(r[k]))) @ q
    inconnus = set(r) - set(AXES)
    if inconnus:
        refus(f'os « {nom} » : rotation {sorted(inconnus)} inconnue (tangage, roulis, lacet)')
    Bm = arm.data.bones[nom].matrix_local.to_quaternion()
    return Bm.inverted() @ q @ Bm


def animer(arm, liste, rec):
    anims = rec.get('animations') or {}
    racine = liste[0]['nom']
    faites = []
    arm.animation_data_create()
    for nom_a, an in anims.items():
        cles = sorted(an.get('cles', []), key=lambda c: c.get('t', 0))
        if not cles:
            refus(f'animation « {nom_a} » sans clés')
        duree = float(an.get('duree', max(c.get('t', 0) for c in cles) or 1))
        act = bpy.data.actions.new(nom_a); act.use_fake_user = True
        arm.animation_data.action = act
        tous = set()
        for c in cles:
            for k in c.get('os', {}):
                tous.update([k[:-2] + '.L', k[:-2] + '.R'] if k.endswith('.*') else [k])
        for k in tous:
            if k not in arm.pose.bones:
                refus(f'animation « {nom_a} » : os « {k} » inconnu')
        for c in cles:
            img = 1 + round(float(c.get('t', 0)) * 24)
            vus = {}
            for k, r in c.get('os', {}).items():
                if k.endswith('.*'):
                    vus[k[:-2] + '.L'] = r
                    vus[k[:-2] + '.R'] = {a: (-v if a in ('roulis', 'lacet') else v) for a, v in r.items()}
                else:
                    vus[k] = r
            for k in tous:   # os absent d'une clé = au repos à cette clé (sinon il garde la pose de la clé d'avant)
                pb = arm.pose.bones[k]; pb.rotation_mode = 'QUATERNION'
                pb.rotation_quaternion = rot_locale(arm, k, vus.get(k, {}))
                pb.keyframe_insert('rotation_quaternion', frame=img)
            pr = arm.pose.bones[racine]
            d = V(c.get('deplacement', (0, 0, 0)))
            pr.location = arm.data.bones[racine].matrix_local.to_3x3().inverted() @ d
            pr.keyframe_insert('location', frame=img)
        if nom_a.lower().startswith(('idle', 'repos')) and json.dumps(cles[0].get('os', {}), sort_keys=True) != json.dumps(cles[-1].get('os', {}), sort_keys=True):
            B.dire(f'⚠ animation « {nom_a} » : la dernière clé diffère de la première (boucle qui saute)')
        tr = arm.animation_data.nla_tracks.new(); tr.name = nom_a
        tr.strips.new(nom_a, 1, act)
        arm.animation_data.action = None
        for pb in arm.pose.bones:   # repos entre deux animations
            pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
        faites.append({'nom': nom_a, 'duree': duree, 'cles': len(cles), 'os': len(tous)})
    return faites


def apercu(chemin, ob):
    sc = bpy.context.scene
    B.lumieres_studio(sc); B.cycles(sc, echantillons=24)
    h = max((ob.matrix_world @ V(c)).z for c in ob.bound_box)
    B.camera_ortho(sc, 320, 320, max(1.0, h * 1.25))
    B.rendre(sc, chemin)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('recette'); ap.add_argument('sortie')
    ap.add_argument('--apercu', help='image PNG de la créature au repos (Cycles, 320×320)')
    a = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])
    t0 = time.time()
    try:
        rec = json.load(open(a.recette))
    except (OSError, ValueError) as e:
        refus(f'{a.recette} illisible : {e}')
    peau = rec.get('peau', {})
    B.vider()
    liste, _ = lire_os(rec)
    ob = corps(liste, peau)
    relief(ob, peau)
    decimer(ob, int(peau.get('triangles', 40000)))
    arm = armature(liste)
    sans = lier(ob, arm)
    colorier(ob, arm, liste, peau)
    npc, pointes = pieces(ob, arm, rec)
    ob.data.validate(clean_customdata=False)   # jointures des pièces : arêtes en double (« Mesh not valid » à l'export)
    faites = animer(arm, liste, rec)
    os.makedirs(os.path.dirname(os.path.abspath(a.sortie)) or '.', exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=os.path.abspath(a.sortie), export_format='GLB', use_selection=False,
                              export_animations=True, export_animation_mode='NLA_TRACKS', export_skins=True,
                              export_vertex_color='ACTIVE', export_apply=False)
    tri = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    zs = [(ob.matrix_world @ v.co).z for v in ob.data.vertices]
    info = {'recette': os.path.abspath(a.recette), 'glb': os.path.abspath(a.sortie), 'triangles': tri, 'os': len(liste),
            'pieces': npc, 'pointes': pointes, 'sommets_sans_poids': sans, 'animations': faites, 'hauteur': round(max(zs) - min(0, min(zs)), 3),
            'secondes': round(time.time() - t0, 1)}
    if a.apercu:
        apercu(os.path.abspath(a.apercu), ob); info['apercu'] = os.path.abspath(a.apercu)
        info['secondes'] = round(time.time() - t0, 1)
    json.dump(info, open(os.path.splitext(a.sortie)[0] + '.json', 'w'), ensure_ascii=False, indent=1)
    B.dire(f"créature : {tri} triangles, {len(liste)} os, {npc} pièces, animations {[x['nom'] for x in faites]}, "
           f"hauteur {info['hauteur']} u, {info['secondes']} s → {a.sortie}")


if __name__ == '__main__':
    main()
