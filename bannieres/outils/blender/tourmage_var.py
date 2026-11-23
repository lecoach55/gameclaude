"""Variantes de la tour de mage pour la Sylve (tour d'écorce et toit de feuilles, orbe vert) et la Nécropole (pierre noire, toit
d'ardoise sombre, orbe vert spectral). Outils de ville_peints.py. Usage : ELEV=8 ROT=32 /home/claude/bpyenv/bin/python tourmage_var.py sortie"""
import os
D = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(D, 'ville_peints.py')).read().split('# tour de mage')[0])
import bpy
for nom, mur, toit, orbe in [('v_tourmage_s', ('ecorce_t', (.7, .55, .4, 1), 'ecorce.jpg', 1.6), ('toit_f', (.35, .62, .25, 1), 'chaume.jpg', 1.3), (.5, 1, .45, 1)),
                             ('v_tourmage_n', ('pierre_t', (.32, .32, .4, 1), 'mur2.jpg', 1.2), ('toit_n', (.2, .22, .28, 1), 'ardoise.jpg', 1.2), (.35, 1, .55, 1))]:
    sc = scene(); P = mat(*mur)
    cyl(.9, .3, (0, 0, .15), P, 24); cyl(.7, 4.2, (0, 0, 2.4), P, 24, .6)
    for z in (1.6, 2.6, 3.5): boite((.18, .1, .3), (0, -.66, z), mat('fen', orbe, em=orbe))
    cyl(.85, .2, (0, 0, 4.55), P, 24); cyl(.9, 2.0, (0, 0, 5.6), mat(*toit), 24, 0)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=.28, location=(0, 0, 6.9)); ob(bpy.context.object, mat('orbe', orbe, r=.2, em=orbe))
    rendre(sc, nom)
