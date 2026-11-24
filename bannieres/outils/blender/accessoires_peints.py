"""Accessoires de la place de ville propres à chaque faction (24/11) : à la place des tonneaux et caisses partout identiques.
Nécropole : pierres tombales, cercueil ; Forteresse (horde) : totem, tambour de guerre, séchoir à peaux ; Sylve : panier de pommes, souche à champignons.
Usage : ELEV=8 /home/claude/bpyenv/bin/python accessoires_peints.py dossier → lv_<nom>.webp + .json, puis outils/blender/accessoires_vers_imp.py les range dans jeu/imp (vue « b »)."""
import os, sys, math, random
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ville_peints.py')).read().split('# --- bâtiments')[0])
random.seed(4)
def sph(r, loc, M, s=(1, 1, 1), sub=3):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc); o = bpy.context.object; o.scale = s; bpy.ops.object.shade_smooth(); return ob(o, M)
def tordre(o, a=.03):  # irrégularité douce (bois, pierre usée)
    for v in o.data.vertices: v.co += Vector((noise.noise(v.co * 3) * a, noise.noise(v.co * 3 + Vector((5, 1, 2))) * a, noise.noise(v.co * 3 + Vector((1, 7, 3))) * a))
    return o
PT = lambda: mat('ptombe', (.7, .7, .68, 1), 'roche.jpg', .8, r=.95)
MOUSSE = lambda: mat('mousse', (.22, .3, .14, 1), r=1)
BOISF = lambda: mat('boisf', (.42, .3, .22, 1), 'bois.jpg', 2)
BOISC = lambda: mat('boisc', (.75, .56, .38, 1), 'poutre.jpg', 2)
PEAU = lambda: mat('peau', (.62, .45, .3, 1), 'enduit.jpg', 2, r=.9)
OS = lambda: mat('os', (.86, .82, .7, 1), r=.6)

# pierre tombale arrondie, penchée, un peu de mousse au pied
sc = scene(); P = PT()
o = boite((.6, .16, .75), (0, 0, .375), P); bpy.ops.object.modifier_add(type='BEVEL'); o.modifiers[0].width = .03; o.modifiers[0].segments = 2
cyl(.3, .16, (0, 0, .75), P, 24).rotation_euler = (math.pi / 2, 0, 0)
for oo in list(sc.objects):
    if oo.type == 'MESH': oo.rotation_euler.y += .08; oo.rotation_euler.x += .05
boite((.2, .04, .03), (0, -.09, .6), mat('grav', (.2, .2, .2, 1)))
sph(.12, (-.22, -.06, .03), MOUSSE(), (1.4, 1, .4)); sph(.09, (.2, -.07, .02), MOUSSE(), (1.3, 1, .4))
boite((.8, .5, .04), (0, -.3, .02), mat('terreb', (.3, .24, .18, 1), r=1))
rendre(sc, 'tombe_a', 300)
# croix de pierre
sc = scene(); P = PT()
boite((.16, .14, 1.0), (0, 0, .5), P); boite((.6, .1, .16), (0, 0, .72), P)
boite((.5, .4, .14), (0, 0, .07), P)
for oo in list(sc.objects):
    if oo.type == 'MESH': oo.rotation_euler.y -= .1
sph(.1, (.18, -.12, .14), MOUSSE(), (1.4, 1, .5))
rendre(sc, 'tombe_b', 300)
# cercueil de bois sombre, couvercle de travers
sc = scene(); B = BOISF()
bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=1, depth=.32, location=(0, 0, .16)); o = bpy.context.object; o.scale = (.95, .34, 1); ob(o, B)
for v in o.data.vertices:
    if v.co.x > .4: v.co.y *= .75
bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=1, depth=.07, location=(.08, -.05, .36), rotation=(0, 0, .12)); o = bpy.context.object; o.scale = (.97, .36, 1); ob(o, mat('boisf2', (.35, .25, .19, 1), 'bois.jpg', 2))
boite((.04, .3, .015), (-.25, -.05, .4), mat('fer', (.3, .3, .32, 1), r=.4, m=.8), (0, 0, .12)); boite((.4, .04, .015), (-.25, -.05, .41), mat('fer', (.3, .3, .32, 1), r=.4, m=.8), (0, 0, .12))
rendre(sc, 'cercueil', 300)
# totem de la horde : poteau sculpté, crâne cornu, plumes
sc = scene(); B = BOISC()
o = tordre(cyl(.16, 2.2, (0, 0, 1.1), B, 12, .13), .02)
for z, c in ((.55, (.4, .1, .06, 1)), (1.05, (.08, .16, .25, 1)), (1.5, (.45, .3, .08, 1))): cyl(.19, .12, (0, 0, z), mat('peint%d' % int(z * 10), c, r=.9), 12)
for s in (-1, 1): boite((.35, .06, .06), (s * .25, 0, 1.75), B, (0, s * .5, 0))
sph(.17, (0, -.04, 2.3), OS(), (.9, 1.1, 1)); sph(.1, (0, -.17, 2.22), OS(), (1, .8, .7))
for s in (-1, 1): cyl(.05, .35, (s * .2, 0, 2.48), OS(), 8, .005).rotation_euler = (0, s * .7, 0)
for s in (-1, 1): boite((.03, .02, .3), (s * .5, -.02, 1.6), mat('plume', (.75, .2, .12, 1), r=1), (0, s * .3, 0))
rendre(sc, 'totem', 340)
# tambour de guerre : fût de bois cerclé, peau tendue, cordes
sc = scene(); B = BOISC()
cyl(.45, .7, (0, 0, .35), B, 24, .38); cyl(.47, .05, (0, 0, .7), PEAU(), 24); cyl(.47, .05, (0, 0, .05), mat('fer', (.3, .3, .32, 1), r=.4, m=.8), 24)
for k in range(10):
    a = k / 10 * 2 * math.pi; boite((.015, .015, .62), (math.cos(a) * .43, math.sin(a) * .43, .37), mat('corde', (.6, .5, .32, 1), r=1), (0, 0, a))
for s in (-1, 1): cyl(.025, .5, (s * .2, -.2, .82), BOISF(), 8).rotation_euler = (.5, s * .4, 0)
rendre(sc, 'tambour', 300)
# séchoir à peaux : deux poteaux, traverse, peau tendue
sc = scene(); B = BOISC()
for s in (-1, 1): tordre(cyl(.06, 1.7, (s * .7, 0, .85), B, 8), .015)
cyl(.05, 1.6, (0, 0, 1.6), B, 8).rotation_euler = (0, math.pi / 2, 0)
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -.02, 1.0)); o = bpy.context.object; o.scale = (1.1, 1, 1.05); o.rotation_euler = (math.pi / 2, 0, 0); ob(o, PEAU())
bpy.ops.object.modifier_add(type='SUBSURF'); o.modifiers[0].levels = 4; o.modifiers[0].subdivision_type = 'SIMPLE'; bpy.ops.object.modifier_apply(modifier=o.modifiers[0].name); bpy.ops.object.shade_smooth()
for v in o.data.vertices:
    r2 = (v.co.x ** 2 + v.co.y ** 2); v.co.z += .04 * math.sin(v.co.x * 9) * math.cos(v.co.y * 7)
    if abs(v.co.x) > .42 and abs(v.co.y) > .4: v.co.x *= .9
rendre(sc, 'sechoir', 320)
# panier de pommes (osier)
sc = scene()
cyl(.35, .35, (0, 0, .175), mat('osier', (.72, .55, .3, 1), 'chaume.jpg', 4, r=.95), 20, .42)
for k in range(9):
    a = random.random() * 6.28; rr = random.random() * .24
    sph(.09, (math.cos(a) * rr, math.sin(a) * rr, .36 + random.random() * .05), mat('pom%d' % (k % 2), ((.55, .05, .03, 1), (.35, .45, .05, 1))[k % 2], r=.4), (1, 1, .9), 2)
rendre(sc, 'panier', 280)
# souche moussue avec champignons
sc = scene()
tordre(cyl(.42, .5, (0, 0, .25), mat('ecorce', (.55, .45, .36, 1), 'ecorce.jpg', 2), 16, .38), .04)
cyl(.37, .02, (0, 0, .5), mat('cerne', (.5, .38, .25, 1), r=.9), 16)
for k in range(5):
    a = -2.4 + k * .45; x, y = math.cos(a) * .44, math.sin(a) * .44
    h = .08 + random.random() * .08; cyl(.025, h, (x, y, h / 2), OS(), 8); sph(.07, (x, y, h), mat('chap', (.75, .3, .15, 1), r=.6), (1, 1, .55), 2)
sph(.2, (-.3, -.15, .05), MOUSSE(), (1.5, 1, .35))
rendre(sc, 'souche', 300)
