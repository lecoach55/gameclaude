"""Pré-rendu Cycles d'un modèle 3D en images de sprites, au format des studios de Bannières (pack.py → jeu/sprites3d.js).

  /home/claude/bpyenv/bin/python outils-communs/blender/planche_sprites.py modele.glb dossier --id loup [options]

Écrit dans `dossier` : <id>_idle0.png … <id>_die2.png (fond transparent, cadre fixe, même caméra orthographique que
bannieres/outils/studio/studio.js : u unités du monde = hauteur du cadre, plongée 0,42 rad) + <id>.json (format,
pixels par unité « pxu », animation utilisée pour chaque pose, triangles, durée). Ensuite, côté jeu :
  python3 bannieres/outils/studio/pack.py dossier bannieres/jeu/sprites3d.js --fusion
(pack.py prend pxu = 168/2,35 par défaut : un autre --format/--unites doit être ajouté à son dict PXU).

Angle : un GLB exporté par bannieres/outils/blender/export_glb.py n'est PAS tourné ; pour retrouver l'angle du jeu,
passer --rotation -28.6 (bêtes de quad.js) ou --rotation 61.4 (humanoïdes), comme rendreCreature de studio.js.

Poses : si le modèle a des animations (GLB de Mixamo, Quaternius, KayKit…), chaque pose prend celle dont le nom
correspond (idle|survey|stand…, attack|bite…, hit|hurt…, death|die…) ou celle donnée par --anim idle=Survey,atk=Run ;
sinon une pose de REMPLACEMENT du corps entier (respiration, élan en avant, recul, chute sur le flanc) — signalée.

Options :
  --id NOM              préfixe des images (défaut : nom du fichier)
  --format 168x168      cadre en pixels (défaut 168x168, celui de pack.py)
  --unites 2.35         unités du monde sur la hauteur du cadre (défaut 2.35)
  --hauteur H           ramène le modèle à H unités de haut (défaut : taille d'origine, ex. GLB exporté du studio)
  --rotation DEG        tourne le modèle autour de la verticale (studio Bannières : bêtes −28.6, humanoïdes 61.4)
  --comme-bannieres     cadre, unités et angle du studio de Bannières pour cet --id (lus dans bannieres/outils/studio/
                        quad.js et studio.py : loup 168×140 / 2,0 u / −28,6°, béhémoth 224×192 / 3,2 u…) : remplacement
                        à l'identique des images du jeu. Les options données en plus l'emportent.
  --poses idle:4,atk:4,hit:2,die:3   poses et nombre d'images (défaut celui-ci)
  --anim pose=Action,…  animation à prendre pour une pose
  --directions N        rend aussi la pose de repos sous N angles : <id>_dir0.png … (0 = de face, puis sens horaire)
  --echantillons 32     échantillons Cycles (débruités ; 16 suffit pour 168 px)
  --decimer N           réduit d'abord le modèle à ≈ N triangles (rendu plus rapide, aperçu du modèle allégé)
  --ombre               sol attrape-ombre (attention : l'ombre compte dans le point d'appui calculé par pack.py)
  --avant x|-x|y|-y     direction du regard du modèle tel qu'importé (défaut : deviné — axe horizontal le plus long,
                        côté le plus haut = la tête) ; sert aux poses de remplacement
  --exposition X        exposition (crans, défaut 0)
  --sans-centrer        garde la position x/y du modèle (sinon centre de sa boîte en 0)
  --flotte H            hauteur du bas du modèle au-dessus du sol, en unités (créatures volantes : « flotte » de studio.js) ;
                        sinon le bas de la boîte est posé au sol
"""
import argparse
import json
import math
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy_outils as B  # noqa: E402

import bpy  # noqa: E402
import mathutils  # noqa: E402

V = mathutils.Vector
INSTANTS = {'idle': [0, .25, .5, .75], 'atk': [.2, .4, .55, .75], 'hit': [.3, .6], 'die': [.35, .7, 1.0]}
MOTIFS = {'idle': r'idle|survey|stand|breath|repos|wait', 'atk': r'attack|atk|bite|strike|slash|punch|hit_?a|attaque',
          'hit': r'hit(?!_?a)|hurt|damage|react|touch|recul', 'die': r'death|die|dead|mort|fall'}


def instants(pose, n):
    if pose in INSTANTS and len(INSTANTS[pose]) == n:
        return INSTANTS[pose]
    if pose == 'idle':
        return [i / n for i in range(n)]
    if pose == 'die':
        return [(i + 1) / n for i in range(n)]
    return [(i + .5) / n for i in range(n)]


def lire_args(argv):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0], formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('modele'); ap.add_argument('sortie')
    ap.add_argument('--id'); ap.add_argument('--format'); ap.add_argument('--unites', type=float)
    ap.add_argument('--hauteur', type=float); ap.add_argument('--rotation', type=float)
    ap.add_argument('--comme-bannieres', action='store_true')
    ap.add_argument('--poses', default='idle:4,atk:4,hit:2,die:3'); ap.add_argument('--anim', default='')
    ap.add_argument('--directions', type=int, default=0); ap.add_argument('--echantillons', type=int, default=32)
    ap.add_argument('--decimer', type=int, default=0); ap.add_argument('--ombre', action='store_true')
    ap.add_argument('--exposition', type=float, default=0.0); ap.add_argument('--sans-centrer', action='store_true')
    ap.add_argument('--avant', choices=['x', '-x', 'y', '-y']); ap.add_argument('--flotte', type=float, default=0.0)
    a = ap.parse_args(argv)
    a.id = a.id or re.sub(r'\W+', '_', os.path.splitext(os.path.basename(a.modele))[0]).lower()
    if a.comme_bannieres:
        fw, fh, u, rot, d_ou = reglages_bannieres(a.id)
        a.format = a.format or f'{fw}x{fh}'
        a.unites = a.unites if a.unites is not None else u
        a.rotation = a.rotation if a.rotation is not None else rot
        print(f'studio de Bannières ({d_ou}) : {fw}×{fh}, {u} u, rotation {rot}°', flush=True)
    a.format = a.format or '168x168'
    a.unites = 2.35 if a.unites is None else a.unites
    a.rotation = a.rotation or 0.0
    m = re.fullmatch(r'(\d+)x(\d+)', a.format)
    if not m or int(m.group(1)) < 8 or int(m.group(2)) < 8:
        ap.error(f'--format attendu LxH en pixels (ex. 168x168), reçu {a.format!r}')
    a.fw, a.fh = int(m.group(1)), int(m.group(2))
    if a.unites <= 0:
        ap.error('--unites doit être > 0')
    a.poses_l = []
    for p in filter(None, a.poses.split(',')):
        nom, _, n = p.partition(':')
        try:
            n = int(n or 1)
        except ValueError:
            ap.error(f'--poses : nombre illisible dans {p!r}')
        if n < 1 or not re.fullmatch(r'[a-z0-9_]+', nom):
            ap.error(f'--poses : {p!r} (attendu nom:nombre, ex. idle:4)')
        a.poses_l.append((nom, n))
    a.anim_d = {}
    for p in filter(None, a.anim.split(',')):
        k, _, v = p.partition('=')
        if not v:
            ap.error(f'--anim : {p!r} (attendu pose=Action)')
        a.anim_d[k.strip()] = v.strip()
    if not a.poses_l and not a.directions:
        ap.error('rien à rendre (--poses vide et pas de --directions)')
    return a


def reglages_bannieres(cid):
    """(fw, fh, u, rotation°, source) de la créature dans le studio Three.js de Bannières : bêtes sculptées de quad.js
    (u, fw, fh propres, root.rotation.y = −0,5), sinon humanoïdes de studio.py (TAILLE ou 168×168 / 2,35, π/2 − 0,5)."""
    rac = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    q = os.path.join(rac, 'bannieres', 'outils', 'studio', 'quad.js')
    st = os.path.join(rac, 'bannieres', 'outils', 'studio', 'studio.py')
    if not os.path.isfile(q):
        raise SystemExit(f'--comme-bannieres : {q} introuvable')
    src = open(q, encoding='utf-8').read()
    m = re.search(rf'^\s*{re.escape(cid)}:\{{c:', src, re.M)
    if m:
        suiv = re.compile(r'^\s*\w+:\{c:', re.M).search(src, m.end())   # définition sur plusieurs lignes : jusqu'à la suivante
        bloc = src[m.start():suiv.start() if suiv else len(src)]
        r = re.findall(r'u:([0-9.]+),fw:(\d+),fh:(\d+)', bloc)
        r = r[-1] if r else None   # le cadre de la créature ferme sa définition
        if not r:
            raise SystemExit(f'--comme-bannieres : cadre (u, fw, fh) de « {cid} » illisible dans quad.js')
        return int(r[1]), int(r[2]), float(r[0]), round(math.degrees(-.5), 1), 'quad.js'
    taille = {}
    if os.path.isfile(st):
        t = re.search(r'^TAILLE=(\{.*\})', open(st, encoding='utf-8').read(), re.M)
        if t:
            taille = {k: v for k, v in eval(t.group(1), {}).items()}   # dict littéral de studio.py
    fw, fh, u = taille.get(cid, (168, 168, 2.35))
    return fw, fh, u, round(math.degrees(math.pi / 2 - .5), 1), 'studio.py'


def armatures():
    return [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']


def choisir_actions(poses, forcees, arms):
    """Pose → action Blender (ou None = remplacement). Les noms forcés introuvables sont une erreur. Seules comptent
    les actions qui animent un squelette : les autres (nœuds, clés de forme) sont rendues dans `ignorees`."""
    tout = list(bpy.data.actions)
    acts = [x for x in tout if action_utilisable(arms, x)]
    choisir_actions.ignorees = [x.name for x in tout if x not in acts]
    choix = {}
    for pose, _n in poses:
        if pose in forcees:
            cand = [a for a in acts if a.name == forcees[pose]] or [a for a in acts if forcees[pose].lower() in a.name.lower()]
            if not cand:
                raise SystemExit(f'--anim {pose}={forcees[pose]} : animation de squelette absente (présentes : '
                                 f'{", ".join(x.name for x in acts) or "aucune"}'
                                 + (f' ; non jouables, sans squelette : {", ".join(choisir_actions.ignorees)}' if choisir_actions.ignorees else '') + ')')
            choix[pose] = cand[0]
        else:
            motif = MOTIFS.get(pose)
            cand = [a for a in acts if motif and re.search(motif, a.name, re.I)]
            choix[pose] = cand[0] if cand else None
    return choix


def slot_pour(ar, act):
    """Emplacement (« slot », Blender 4.4+) de l'action qui anime CETTE armature : identifiant 'OB<nom>', sinon le seul
    emplacement d'objet. None si l'action ne la concerne pas (autre armature, clés de forme)."""
    slots = list(getattr(act, 'slots', []) or [])
    if not slots:
        return 'ancien'   # action d'avant les emplacements : s'applique telle quelle
    for sl in slots:
        if getattr(sl, 'identifier', '') == 'OB' + ar.name:
            return sl
    obj = [sl for sl in slots if getattr(sl, 'target_id_type', 'OBJECT') == 'OBJECT']
    return obj[0] if len(obj) == 1 else None


def action_utilisable(arms, act):
    """L'action anime-t-elle un squelette du modèle ? (les animations de nœuds ou de clés de forme ne sont pas jouées)"""
    if not arms:
        return False
    for ar in arms:
        sl = slot_pour(ar, act)
        if sl is None:
            continue
        if sl == 'ancien':
            return any(fc.data_path.startswith('pose.bones') for fc in getattr(act, 'fcurves', []))
        return True
    return False


def poser_action(arms, act, t):
    if act is None:
        for ar in arms:
            if ar.animation_data:
                ar.animation_data.action = None
            for pb in ar.pose.bones:
                pb.location = (0, 0, 0); pb.rotation_quaternion = (1, 0, 0, 0); pb.rotation_euler = (0, 0, 0); pb.scale = (1, 1, 1)
        bpy.context.scene.frame_set(0)
        return
    for ar in arms:
        sl = slot_pour(ar, act)
        ad = ar.animation_data or ar.animation_data_create()
        for tr in ad.nla_tracks:   # les pistes NLA de l'import se mélangeraient à l'action choisie
            tr.mute = True
        if sl is None:             # cette armature n'est pas animée par l'action : repos
            ad.action = None
            continue
        ad.action = act
        if sl != 'ancien' and hasattr(ad, 'action_slot'):
            ad.action_slot = sl
    f0, f1 = act.frame_range
    f = f0 + t * (f1 - f0)
    bpy.context.scene.frame_set(int(math.floor(f)), subframe=f - math.floor(f))


def deviner_avant(objs):
    """Regard du modèle tel qu'importé : axe horizontal le plus long de la boîte (corps d'une bête), orienté vers le
    bout le plus haut (la tête dépasse le dos et la queue chez presque toutes). Rend (vecteur, nom, sûr?)."""
    dg = bpy.context.evaluated_depsgraph_get()
    pts = []
    for o in objs:
        ev = o.evaluated_get(dg); me = ev.to_mesh()
        pas = max(1, len(me.vertices) // 4000)
        pts += [ev.matrix_world @ me.vertices[i].co for i in range(0, len(me.vertices), pas)]
        ev.to_mesh_clear()
    mn = V((min(p.x for p in pts), min(p.y for p in pts), 0)); mx = V((max(p.x for p in pts), max(p.y for p in pts), 0))
    ax = 0 if (mx.x - mn.x) >= (mx.y - mn.y) else 1
    long_, court = sorted([mx.x - mn.x, mx.y - mn.y], reverse=True)
    L = mx[ax] - mn[ax]
    haut_moins = max((p.z for p in pts if p[ax] < mn[ax] + .25 * L), default=0)
    haut_plus = max((p.z for p in pts if p[ax] > mx[ax] - .25 * L), default=0)
    signe = 1 if haut_plus >= haut_moins else -1
    v = V((0, 0, 0)); v[ax] = signe
    sur = long_ > 1.2 * court and abs(haut_plus - haut_moins) > .03 * max(1e-6, max(p.z for p in pts) - min(p.z for p in pts))
    return v, ('-' if signe < 0 else '') + 'xy'[ax], sur


def pose_remplacement(piv, base, avant, pose, t, h, flotte=0.0):
    """Mouvement du corps entier quand le modèle n'a pas d'animation pour cette pose. `avant` = direction du regard."""
    lat = avant.cross(V((0, 0, 1))).normalized()
    R = mathutils.Matrix.Identity(4); T = V((0, 0, 0)); S = V((1, 1, 1))
    s = math.sin(math.pi * t)
    if pose == 'idle':
        S = V((1 - .006 * math.sin(2 * math.pi * t), 1 - .006 * math.sin(2 * math.pi * t), 1 + .015 * math.sin(2 * math.pi * t)))
    elif pose == 'atk':
        R = mathutils.Matrix.Rotation(math.radians(-14 * s), 4, lat); T = avant * (.14 * h * s)
    elif pose == 'hit':
        R = mathutils.Matrix.Rotation(math.radians(10 * s), 4, lat); T = avant * (-.06 * h * s)
    elif pose == 'die':
        k = min(1.0, t) ** 1.5
        R = mathutils.Matrix.Rotation(math.radians(88 * k), 4, avant)
    else:
        S = V((1, 1, 1 + .01 * s))
    M = mathutils.Matrix.Translation(T) @ R @ base @ mathutils.Matrix.Diagonal(S.to_4d())
    piv.matrix_world = M
    bpy.context.view_layer.update()
    mn, _mx = B.boite(B.maillages())
    if abs(mn.z - flotte) > 1e-4:   # reste posé au sol (le flanc d'un corps couché, le bas d'un corps penché)
        piv.matrix_world = mathutils.Matrix.Translation(V((0, 0, flotte - mn.z))) @ M
        bpy.context.view_layer.update()


def main(argv):
    a = lire_args(argv)
    ch = B.Chrono()
    os.makedirs(a.sortie, exist_ok=True)
    sc = B.vider()
    objs = B.importer(a.modele)
    if not objs:
        raise SystemExit(f'aucun maillage rendu dans {a.modele}')
    tri0 = B.triangles(objs)
    tri = (tri0, tri0, [])
    if a.decimer:
        tri = B.decimer(objs, a.decimer)
    arms = armatures()
    choix = choisir_actions(a.poses_l, a.anim_d, arms) if a.poses_l else {}
    ignorees = getattr(choisir_actions, 'ignorees', [])
    if ignorees:
        B.dire(f'⚠ animations sans squelette non jouées (poses de remplacement à la place) : {", ".join(ignorees)}')
    # pose de référence pour la taille et le sol : repos (action de idle à t=0, sinon position de liaison)
    poser_action(arms, choix.get('idle'), 0)
    if a.avant:
        av0 = V({'x': (1, 0, 0), '-x': (-1, 0, 0), 'y': (0, 1, 0), '-y': (0, -1, 0)}[a.avant]); nom_av, sur = a.avant, True
    else:
        av0, nom_av, sur = deviner_avant(objs)
    piv, h = B.pivot(objs, a.rotation, a.hauteur, centrer=not a.sans_centrer)
    if a.flotte:
        piv.location.z += a.flotte; bpy.context.view_layer.update()
    base = piv.matrix_world.copy()
    avant = (mathutils.Matrix.Rotation(math.radians(a.rotation), 3, 'Z') @ av0).normalized()
    B.lumieres_studio(sc)
    B.camera_ortho(sc, a.fw, a.fh, a.unites)
    B.cycles(sc, a.echantillons)
    sc.view_settings.exposure = a.exposition
    if a.ombre:
        B.sol_ombre(sc, a.unites * 8)
    if h > a.unites * 1.15:
        B.dire(f'⚠ modèle haut de {h:.2f} unités pour un cadre de {a.unites} : il sera coupé (--hauteur ou --unites)')
    images, utilisees = [], {}
    for pose, n in a.poses_l:
        act = choix.get(pose)
        utilisees[pose] = act.name if act else 'remplacement'
        for i, t in enumerate(instants(pose, n)):
            poser_action(arms, act if act else choix.get('idle'), t if act else 0)
            if act:
                piv.matrix_world = base; bpy.context.view_layer.update()
            else:
                pose_remplacement(piv, base, avant, pose, t, h, a.flotte)
            images.append(B.rendre(sc, os.path.abspath(os.path.join(a.sortie, f'{a.id}_{pose}{i}.png'))))
        B.dire(f'{a.id} {pose} ×{n} ({utilisees[pose]}) {ch()} s')
    for d in range(a.directions):
        poser_action(arms, choix.get('idle') if choix else None, 0)
        r = mathutils.Matrix.Rotation(-2 * math.pi * d / a.directions, 4, 'Z')
        piv.matrix_world = r @ base; bpy.context.view_layer.update()
        images.append(B.rendre(sc, os.path.abspath(os.path.join(a.sortie, f'{a.id}_dir{d}.png'))))
    if a.directions:
        B.dire(f'{a.id} {a.directions} directions {ch()} s')
    infos = {'id': a.id, 'source': os.path.abspath(a.modele), 'fw': a.fw, 'fh': a.fh, 'u': a.unites,
             'pxu': round(a.fh / a.unites, 1), 'poses': dict(a.poses_l), 'animations': utilisees,
             'animations_du_modele': [x.name for x in bpy.data.actions], 'animations_ignorees': ignorees, 'directions': a.directions,
             'hauteur': round(h, 3), 'rotation': a.rotation, 'triangles': {'avant': tri[0], 'apres': tri[1]},
             'non_reduits': tri[2], 'avant': nom_av, 'echantillons': a.echantillons, 'images': len(images), 'secondes': ch()}
    with open(os.path.join(a.sortie, f'{a.id}.json'), 'w', encoding='utf-8') as f:
        json.dump(infos, f, ensure_ascii=False, indent=1)
    rempl = [p for p, v in utilisees.items() if v == 'remplacement']
    if rempl and not a.avant:
        B.dire(f'regard du modèle deviné : {nom_av}' + ('' if sur else ' (incertain : vérifier la planche, sinon --avant)'))
    B.dire(f'✓ {len(images)} images {a.fw}×{a.fh} dans {a.sortie} en {ch()} s'
           + (f' — poses de remplacement (pas d\'animation dans le modèle) : {", ".join(rempl)}' if rempl else ''))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
