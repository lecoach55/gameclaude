"""Enceinte de la Horde vue en ville (ELEV=8) : porte fortifiée en rondins (v_porte_h) et tour de guet (v_tour_h), rendues dans Blender.
Reprend les outils de ville_peints.py (scène, matériaux, rendu). Usage : ELEV=8 /home/claude/bpyenv/bin/python horde_peints.py dossier_sortie"""
import os, math
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ville_peints.py')).read().split('# tour de mage')[0]
exec(src)
import bpy
def rondins(x0, x1, y, h, M, r=.17, pointe=.35, alea=7):
    random.seed(alea); x = x0
    while x <= x1 + 1e-6:
        hh = h + random.uniform(-.15, .15); cyl(r, hh, (x, y + random.uniform(-.03, .03), hh / 2), M, 10)
        bpy.ops.mesh.primitive_cone_add(vertices=10, radius1=r, depth=pointe, location=(x, y, hh + pointe / 2)); ob(bpy.context.object, M)
        x += r * 1.9
def tour(x, y, h, M, CH, OS):
    # tour de guet : quatre poteaux, plateforme, garde-corps en rondins, toit de chaume pointu, cornes
    for sx in (-1, 1):
        for sy in (-1, 1): cyl(.13, h, (x + sx * .55, y + sy * .55, h / 2), M, 10)
    boite((1.5, 1.5, .14), (x, y, h * .62), M)
    for sy in (-1, 1): boite((1.5, .1, .5), (x, y + sy * .7, h * .62 + .3), M)
    for sx in (-1, 1): boite((.1, 1.5, .5), (x + sx * .7, y, h * .62 + .3), M)
    for k in range(-2, 3): boite((.09, .09, 1.9), (x, y - .6, h * .3), M, (0, (.55 if k % 2 else -.55), 0)) if k in (-1, 1) else None
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=1.35, depth=1.6, location=(x, y, h + .7), rotation=(0, 0, math.pi / 4)); ob(bpy.context.object, CH)
    for sx in (-1, 1):
        bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=.09, depth=.9, location=(x + sx * .55, y - .7, h + .35), rotation=(.3, -sx * .7, 0)); ob(bpy.context.object, OS)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=.13, location=(x, y - .78, h * .62 + .62)); ob(bpy.context.object, OS)

# porte : deux tours de guet, battants massifs, linteau, palissade en pointe sur les côtés, crânes et bannière
sc = scene(); B = BOIS(); R = mat('rondins', (.72, .52, .36, 1), 'ecorce.jpg', 2.5); CH = mat('chaume_h', (.95, .8, .55, 1), 'chaume.jpg', 1.3); OS = mat('os', (.8, .72, .58, 1), r=.6)
for sx in (-1, 1): tour(sx * 1.9, 0, 3.6, R, CH, OS)
boite((2.6, .25, 2.5), (0, -.05, 1.25), mat('porte', (.8, .56, .36, 1), 'poutre.jpg', 2))
for z in (.6, 1.9): boite((2.7, .3, .18), (0, -.22, z), mat('fer', (.22, .2, .2, 1), r=.4, m=.7))
boite((.04, .3, 2.5), (0, -.22, 1.25), mat('fente', (.05, .03, .02, 1)))
boite((4.4, .5, .45), (0, 0, 2.85), R)
for sx in (-1, 1): rondins(sx * 3.0 - (1.2 if sx < 0 else 0), sx * 3.0 + (0 if sx < 0 else 1.2), .1, 2.2, R, alea=3 + sx)
for x in (-.9, 0, .9): bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=.12, location=(x, -.3, 3.1)); ob(bpy.context.object, OS)
cyl(.05, 2.2, (0, 0, 4.1), B, 8); boite((.9, .03, .6), (.47, 0, 4.85), mat('banniere', (.4, .035, .02, 1), r=.9))
rendre(sc, 'v_porte_h', 560)

sc = scene(); MATS.clear(); B = BOIS(); R = mat('rondins', (.72, .52, .36, 1), 'ecorce.jpg', 2.5); CH = mat('chaume_h', (.95, .8, .55, 1), 'chaume.jpg', 1.3); OS = mat('os', (.8, .72, .58, 1), r=.6)
tour(0, 0, 4.2, R, CH, OS)
cyl(.05, 1.6, (.55, -.55, 5.9), B, 8); boite((.6, .03, .4), (.86, -.55, 6.4), mat('banniere', (.4, .035, .02, 1), r=.9))
rendre(sc, 'v_tour_h', 420)

# fort de la Horde vu de la ville (24/11) : grande halle de rondins sur une butte, toit de chaume pentu à cornes, trois hautes tours de guet,
# palissade pointue, crânes et bannières
if os.environ.get('FORT'):
    sc = scene(); MATS.clear(); B = BOIS(); R = mat('rondins', (.72, .52, .36, 1), 'ecorce.jpg', 2.5); CH = mat('chaume_h', (.95, .8, .55, 1), 'chaume.jpg', 1.3); OS = mat('os', (.55, .45, .32, 1), r=.6)
    T = mat('terre_f', (.55, .36, .22, 1), 'mur.jpg', 1)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(0, 1, 0)); o = bpy.context.object; o.scale = (6, 4.5, 1.2); ob(o, T)
    boite((5, 3, 2.4), (0, 1.2, 2.3), R)                                     # halle
    for sg in (-1, 1): boite((5.8, 2.3, .12), (0, 1.2 + sg * 1.05, 4.4), CH, (-sg * .85, 0, 0))
    for x in (-2.75, 2.75):
        bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=.16, depth=1.4, location=(x, -.2, 5.6), rotation=(0, -x / 6, 0)); ob(bpy.context.object, OS)
    boite((1.2, .1, 1.6), (0, -.32, 1.9), mat('porte_f', (.2, .12, .06, 1), 'poutre.jpg', 2))
    for x in (-3.8, 0, 3.8): tour(x, 3.2 if x == 0 else 2.0, 6.5 if x == 0 else 5.2, R, CH, OS)
    rondins(-5.2, -1.6, -1.2, 2.0, R, alea=31); rondins(1.6, 5.2, -1.2, 2.0, R, alea=32)
    for x in (-1, 1): cyl(.05, 3, (x * 1.4, -1.5, 2.2), B, 8); boite((.05, .6, 1.1), (x * 1.4, -1.5, 3.1), mat('banniere', (.4, .035, .02, 1), r=.9))
    rendre(sc, 'fortv_horde', 900)
