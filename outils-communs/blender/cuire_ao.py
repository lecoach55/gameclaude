"""Nettoie, allège et cuit l'occlusion ambiante d'un modèle dans ses couleurs de sommets, puis le réexporte en GLB pour
Three.js (Blender 5 dans le cloud, Cycles sur processeur).

  /home/claude/bpyenv/bin/python outils-communs/blender/cuire_ao.py entree.glb sortie.glb [options]

Les creux (aisselles, dessous du ventre, jointures des murs, pied des créneaux) s'assombrissent DANS le modèle : Three.js
l'affiche sans aucun calcul (GLTFLoader active vertexColors dès qu'il voit COLOR_0 ; la couleur de sommet multiplie la
couleur et la texture du matériau). Aucune UV ni texture en plus. Une couleur de sommet déjà présente est multipliée,
pas écrasée. Animations, squelette et matériaux gardés ; cuisson faite en position de repos.

Options :
  --decimer N        réduit d'abord à ≈ N triangles (Decimate collapse ; maillages à clés de forme laissés)
  --fusion D         fusionne les sommets à moins de D unités (défaut 1e-5 ; 0 = pas de nettoyage)
  --force F          intensité de l'occlusion, 0 à 1 (défaut 0.8 : 1 = noir au fond des creux)
  --distance D       portée de l'occlusion en unités du modèle (défaut : 15 % de sa plus grande dimension)
  --echantillons N   échantillons de cuisson (défaut 64)
  --draco            compresse les maillages (Draco) — le jeu doit alors charger DRACOLoader
Rend sur la sortie standard : triangles avant/après, occlusion moyenne et minimale, poids des fichiers, durée ;
et <sortie>.json avec les mêmes chiffres.
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy_outils as B  # noqa: E402

import bpy  # noqa: E402


def lire_args(argv):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0], formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('entree'); ap.add_argument('sortie')
    ap.add_argument('--decimer', type=int, default=0); ap.add_argument('--fusion', type=float, default=1e-5)
    ap.add_argument('--force', type=float, default=0.8); ap.add_argument('--distance', type=float)
    ap.add_argument('--echantillons', type=int, default=64); ap.add_argument('--draco', action='store_true')
    a = ap.parse_args(argv)
    if not 0 <= a.force <= 1:
        ap.error('--force entre 0 et 1')
    if not a.sortie.lower().endswith('.glb'):
        ap.error('la sortie doit être un .glb')
    if os.path.abspath(a.sortie) == os.path.abspath(a.entree):
        ap.error('la sortie doit être un autre fichier que l\'entrée')
    return a


def cuire(objs, distance, echantillons, force):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = echantillons
    sc.world = sc.world or bpy.data.worlds.new('monde')
    sc.world.light_settings.distance = distance
    sc.render.bake.target = 'VERTEX_COLORS'
    arms = [o for o in sc.objects if o.type == 'ARMATURE']
    etats = [(ar, ar.data.pose_position) for ar in arms]
    for ar in arms:
        ar.data.pose_position = 'REST'
    deja, ajoutes = {}, []
    for o in objs:
        if o.data.users > 1:
            o.data = o.data.copy()
        ca = o.data.color_attributes
        exist = ca.active_color.name if ca.active_color is not None else (ca[0].name if len(ca) else None)
        deja[o.name] = exist
        if 'AO_STUDIO' in ca:
            ca.remove(ca['AO_STUDIO'])
        ao = ca.new('AO_STUDIO', 'FLOAT_COLOR', 'CORNER')
        ca.active_color = ao
        if not o.data.materials:   # Cycles refuse de cuire un objet sans matériau
            o.data.materials.append(bpy.data.materials.new('sans_materiau')); ajoutes.append(o)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    try:
        bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
    finally:
        for ar, p in etats:
            ar.data.pose_position = p
        for o in ajoutes:   # retiré après la cuisson : le GLB garde le matériau par défaut de glTF, comme l'original
            o.data.materials.clear()
    tous = []
    for o in objs:
        ca = o.data.color_attributes
        ao = ca['AO_STUDIO']
        n = len(ao.data)
        vals = [0.0] * (n * 4)
        ao.data.foreach_get('color', vals)
        v = [1 - force * (1 - min(1.0, max(0.0, vals[i * 4]))) for i in range(n)]
        tous += v
        exist = deja[o.name]
        if exist and exist in ca:
            cible = ca[exist]
            if cible.domain != 'CORNER' or cible.data_type != 'FLOAT_COLOR':
                # convertit l'ancienne couleur au même domaine que l'occlusion pour multiplier coin par coin
                ca.active_color = cible
                with bpy.context.temp_override(object=o, active_object=o):
                    bpy.ops.geometry.color_attribute_convert(domain='CORNER', data_type='FLOAT_COLOR')
                cible = ca[exist]
            c = [0.0] * (n * 4)
            cible.data.foreach_get('color', c)
            for i in range(n):
                c[i * 4] *= v[i]; c[i * 4 + 1] *= v[i]; c[i * 4 + 2] *= v[i]
            cible.data.foreach_set('color', c)
            ca.remove(ca['AO_STUDIO'])
            ca.active_color = ca[exist]
        else:
            c = [0.0] * (n * 4)
            for i in range(n):
                c[i * 4] = c[i * 4 + 1] = c[i * 4 + 2] = v[i]; c[i * 4 + 3] = 1.0
            ao.data.foreach_set('color', c)
            ao.name = 'Color'
            ca.active_color = ao
        ca.render_color_index = ca.active_color_index
    return tous


def main(argv):
    a = lire_args(argv)
    ch = B.Chrono()
    B.vider()
    objs = B.importer(a.entree)
    if not objs:
        raise SystemExit(f'aucun maillage dans {a.entree}')
    tri0 = B.triangles(objs)
    fus = B.nettoyer(objs, a.fusion) if a.fusion > 0 else 0
    tri = B.decimer(objs, a.decimer) if a.decimer else (tri0, B.triangles(objs), [])
    mn, mx = B.boite(objs)
    dist = a.distance or max(mx - mn) * .15
    v = cuire(objs, dist, a.echantillons, a.force)
    os.makedirs(os.path.dirname(os.path.abspath(a.sortie)) or '.', exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=os.path.abspath(a.sortie), export_format='GLB', export_vertex_color='ACTIVE',
                              export_animations=True, export_draco_mesh_compression_enable=a.draco)
    infos = {'entree': os.path.abspath(a.entree), 'sortie': os.path.abspath(a.sortie),
             'triangles': {'avant': tri0, 'apres': tri[1]}, 'non_reduits': tri[2], 'sommets_fusionnes': fus,
             'occlusion': {'moyenne': round(sum(v) / len(v), 3), 'min': round(min(v), 3),
                           'part_assombrie': round(sum(1 for x in v if x < .9) / len(v), 3), 'force': a.force,
                           'distance': round(dist, 4)},
             'octets': {'avant': os.path.getsize(a.entree), 'apres': os.path.getsize(a.sortie)}, 'draco': a.draco,
             'secondes': ch()}
    with open(a.sortie + '.json', 'w', encoding='utf-8') as f:
        json.dump(infos, f, ensure_ascii=False, indent=1)
    o = infos['occlusion']
    B.dire(f"✓ {a.sortie} : {tri0} → {tri[1]} triangles, occlusion moyenne {o['moyenne']} (min {o['min']}, "
           f"{round(o['part_assombrie'] * 100)} % des coins assombris), {infos['octets']['avant'] // 1024} → "
           f"{infos['octets']['apres'] // 1024} Kio, {ch()} s" + (f" — non réduits (clés de forme) : {', '.join(tri[2])}" if tri[2] else ''))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
