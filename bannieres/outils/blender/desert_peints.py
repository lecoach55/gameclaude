"""Végétation du désert « peinte » (palmier, cactus à bras, buisson sec), avec les outils de arbres_peints.py.
Remplace les arbustes photo desert_a/b/c. Usage : [ELEV=8 SUF=b] /home/claude/bpyenv/bin/python desert_peints.py dossier_sortie"""
import os
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'arbres_peints.py')).read()
exec(src.split('\nVERT = ')[0])
import bpy, math, random
from mathutils import Vector


def branche(p0, d, L, r, M, prof, g):  # branche récursive tordue
    if prof == 0 or L < .12: return
    p1 = p0 + d * L
    c = (p0 + p1) / 2; bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=r, radius2=r * .65, depth=L, location=c)
    o = bpy.context.object; o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler(); o.data.materials.append(M); bpy.ops.object.shade_smooth()
    random.seed(g)
    for k in range(2 if prof > 1 else 3):
        nd = (d * .8 + Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(0, .4)))).normalized()
        branche(p1, nd, L * random.uniform(.6, .78), r * .62, M, prof - 1, g * 7 + k + 1)
def arbre_mort(g):
    sc = scene_vide(); random.seed(g)
    M = bpy.data.materials.new('bois_mort'); M.use_nodes = True; b = M.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (.12, .1, .09, 1); b.inputs['Roughness'].default_value = .9
    t = M.node_tree.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(TX); mx = M.node_tree.nodes.new('ShaderNodeMixRGB'); mx.blend_type = 'MULTIPLY'; mx.inputs[0].default_value = 1; mx.inputs[2].default_value = (.35, .32, .3, 1)
    M.node_tree.links.new(t.outputs[0], mx.inputs[1]); M.node_tree.links.new(mx.outputs[0], b.inputs['Base Color'])
    branche(Vector((0, 0, 0)), Vector((.08, 0, 1)).normalized(), 1.0, .11, M, 6, g)
    return sc
def acacia(g):
    sc = scene_vide(); random.seed(g); E = mat_ecorce()
    F = mat_feuillage('acacia', (.02, .04, .005, 1), (.12, .2, .03, 1), (.33, .38, .08, 1))
    for sx in (-1, 1):
        bpy.ops.mesh.primitive_cone_add(vertices=10, radius1=.1, radius2=.06, depth=1.7, location=(sx * .25, 0, .8), rotation=(0, sx * .3, 0)); o = bpy.context.object; o.data.materials.append(E); bpy.ops.object.shade_smooth()
    for k, (x, y, r) in enumerate([(0, 0, .7), (-.75, .15, .5), (.75, -.05, .55), (.1, .45, .45), (-.2, -.45, .45)]):
        o = boule((x, y, 1.75), r, F, g + k, rug=.35); o.scale = (1.25, 1.25, .28)
    return sc
def palmier(g):
    sc = scene_vide(); random.seed(g); E = mat_ecorce()
    F = mat_feuillage('palme', (.02, .06, .01, 1), (.12, .3, .04, 1), (.36, .5, .1, 1))
    # tronc courbe : anneaux empilés qui se décalent
    x = y = 0; z = 0; h = 2.6; n = 14
    for k in range(n):
        t = k / n; r = .14 - .05 * t; x = .35 * t * t; zc = z + h / n / 2
        bpy.ops.mesh.primitive_cone_add(vertices=10, radius1=r * 1.12, radius2=r, depth=h / n * 1.05, location=(x, 0, zc), rotation=(0, .25 * t, 0)); o = bpy.context.object; o.data.materials.append(E); bpy.ops.object.shade_smooth()
        z += h / n
    top = Vector((x, 0, z))
    for k in range(9):  # palmes : nappes allongées qui retombent
        a = k / 9 * math.pi * 2 + random.random() * .3; L = 1.1 + random.random() * .3
        bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0)); o = bpy.context.object
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.subdivide(number_cuts=8); bpy.ops.object.mode_set(mode='OBJECT')
        for v in o.data.vertices:
            u = v.co.x + .5; w = v.co.y
            v.co.x = u * L; v.co.y = w * .32 * math.sin(math.pi * min(1, u * 1.1)) ; v.co.z = -u * u * .7 + abs(w) * .12
        o.rotation_euler = (0, 0, a); o.location = top; o.data.materials.append(F)
        mod = o.modifiers.new('s', 'SOLIDIFY'); mod.thickness = .02
    boule(top + Vector((0, 0, -.05)), .16, F, g)
    return sc
def cactus(g):
    sc = scene_vide(); random.seed(g)
    C = bpy.data.materials.new('cactus'); C.use_nodes = True; bC = C.node_tree.nodes['Principled BSDF']; bC.inputs['Base Color'].default_value = (.05, .15, .06, 1); bC.inputs['Roughness'].default_value = .7
    nzC = C.node_tree.nodes.new('ShaderNodeTexNoise'); nzC.inputs['Scale'].default_value = 40; buC = C.node_tree.nodes.new('ShaderNodeBump'); buC.inputs['Strength'].default_value = .35; C.node_tree.links.new(nzC.outputs['Fac'], buC.inputs['Height']); C.node_tree.links.new(buC.outputs['Normal'], bC.inputs['Normal'])
    def colonne(base, h, r):
        bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=r, depth=h, location=(base[0], base[1], base[2] + h / 2)); o = bpy.context.object
        for v in o.data.vertices:
            a = math.atan2(v.co.y, v.co.x); v.co.x *= 1 + .12 * math.cos(a * 8); v.co.y *= 1 + .12 * math.cos(a * 8)
        o.data.materials.append(C); bpy.ops.object.shade_smooth()
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=(base[0], base[1], base[2] + h)); o2 = bpy.context.object; o2.data.materials.append(C); bpy.ops.object.shade_smooth()
    colonne((0, 0, 0), 1.8, .2)
    for sx, z0, h in ((-1, .7, .7), (1, 1.0, .55)):
        bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=.13, depth=.35, location=(sx * .25, 0, z0), rotation=(0, math.pi / 2, 0)); o = bpy.context.object; o.data.materials.append(C); bpy.ops.object.shade_smooth()
        colonne((sx * .42, 0, z0), h, .13)
    return sc
def broussaille(g):
    sc = scene_vide(); random.seed(g); E = mat_ecorce()
    F = mat_feuillage('sec', (.03, .03, .01, 1), (.17, .17, .05, 1), (.4, .34, .12, 1))
    for k in range(7):
        a = random.random() * 6.28; d = random.random() * .3
        boule((math.cos(a) * d, math.sin(a) * d, .2 + random.random() * .12), .13 + random.random() * .06, F, g + k, rug=.5)
    for k in range(6):
        a = k / 6 * 6.28; bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=.012, depth=.42, location=(math.cos(a) * .18, math.sin(a) * .18, .3), rotation=(math.sin(a) * .7, -math.cos(a) * .7, 0)); bpy.context.object.data.materials.append(E)
    return sc
QUOI = os.environ.get('QUOI', 'desert')
for nom, f, g in ([('arbre_mort', arbre_mort, 9), ('acacia', acacia, 11)] if QUOI == 'autres' else [('desert_a', palmier, 3), ('desert_b', cactus, 5), ('desert_c', broussaille, 7)]):
    rendre(f(g), nom)
