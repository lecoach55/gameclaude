"""Végétation du désert « peinte » (palmier, cactus à bras, buisson sec), avec les outils de arbres_peints.py.
Remplace les arbustes photo desert_a/b/c. Usage : [ELEV=8 SUF=b] /home/claude/bpyenv/bin/python desert_peints.py dossier_sortie"""
import os
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'arbres_peints.py')).read()
exec(src.split('\nVERT = ')[0])
import bpy, math, random
from mathutils import Vector

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
for nom, f, g in [('desert_a', palmier, 3), ('desert_b', cactus, 5), ('desert_c', broussaille, 7)]:
    rendre(f(g), nom)
