"""Scierie peinte (remplace la maison à pilotis trop réaliste) et puits revu (toit plus petit et plus haut : on voit l'eau),
avec les outils de lieux_peints.py. Usage : /home/claude/bpyenv/bin/python lieux_peints2.py dossier_sortie → lv_scierie, lv_puits."""
import os
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lieux_peints.py')).read()
exec(src.split('\n# puits')[0])
import bpy, math, random, mathutils
def tourner(sc, deg):  # vue de trois quarts, comme les autres bâtiments de la carte
    bpy.context.view_layer.update(); R = mathutils.Matrix.Rotation(math.radians(deg), 4, 'Z')
    for o in sc.objects:
        if o.type == 'MESH': o.matrix_world = R @ o.matrix_world

# --- scierie : hangar de planches au toit de bardeaux, roue à aubes sur un ruisseau, scie circulaire, rondins empilés
sc = scene(); P = PIERRE(); B = BOIS(); BS = mat('bois_sombre', (.45, .32, .22, 1), 'poutre.jpg', 2)
BARD = mat('bardeaux', (.7, .5, .34, 1), 'bois.jpg', 3); ECO = mat('ecorce', (.75, .55, .38, 1), 'ecorce.jpg', 3)
BOUT = mat('bout', (.95, .78, .52, 1), 'bois.jpg', 4); FER = mat('fer', (.55, .56, .6, 1), r=.35, m=.9)
boite((2.3, 1.5, .18), (0, .1, .09), P)                                   # socle de pierre
boite((1.9, 1.2, 1.0), (0, .25, .68), B)                                  # murs de planches
for x in (-.95, .95):
    for y in (-.35, .85): boite((.12, .12, 1.05), (x, y, .7), BS)         # poteaux d'angle
boite((.5, .04, .7), (-.35, -.36, .55), mat('porte', (.12, .08, .05, 1)))  # grande ouverture sombre
for sg in (-1, 1): boite((2.25, .95, .07), (0, .25 + sg * .4, 1.45), BARD, (-sg * .62, 0, 0))   # toit à deux pans
boite((2.3, .1, .1), (0, .25, 1.72), BS)                                  # faîtage
# ruisseau et roue à aubes sur le côté droit
boite((.45, 2.6, .04), (1.36, .1, .02), mat('ruisseau', (.04, .16, .22, 1), r=.08))
cyl(.62, .1, (1.15, .2, .72), BS, 32).rotation_euler = (0, math.pi / 2, 0)
cyl(.5, .12, (1.15, .2, .72), mat('creux', (.15, .1, .06, 1)), 32).rotation_euler = (0, math.pi / 2, 0)
for k in range(10):
    a = k / 10 * math.pi * 2; boite((.16, .07, .3), (1.15, .2 + math.cos(a) * .6, .72 + math.sin(a) * .6), B, (a, 0, 0))
cyl(.08, .35, (1.05, .2, .72), FER, 12).rotation_euler = (0, math.pi / 2, 0)
# scie circulaire sur son chevalet, tronc en cours de sciage
for x in (-.75, -.15): boite((.08, .5, .38), (x, -.72, .19), BS)
cyl(.16, 1.1, (-.45, -.72, .5), ECO, 16).rotation_euler = (0, math.pi / 2, 0)
cyl(.3, .025, (-.45, -.95, .5), FER, 32).rotation_euler = (0, math.pi / 2, 0)
# rondins empilés à gauche
random.seed(3)
for row, n in enumerate((4, 3, 2)):
    for k in range(n):
        x = -1.45 + (k + row * .5) * .3 - .45; o = cyl(.14, .95, (x, .35, .16 + row * .25), ECO, 14); o.rotation_euler = (math.pi / 2, 0, 0)
        cyl(.13, .02, (x, -.13, .16 + row * .25), BOUT, 14).rotation_euler = (math.pi / 2, 0, 0)
# sciure et planches posées
for k in range(3): boite((.75, .13, .035), (.5, -.75 + k * .05, .04 + k * .04), BOUT, (0, 0, .15 + k * .05))
tourner(sc, -32); rendre(sc, 'scierie', 460)

# --- puits : margelle de pierre, eau visible, toit de tuiles plus petit et plus haut, treuil et seau
sc = scene(); P = PIERRE(); B = BOIS()
cyl(.55, .5, (0, 0, .25), P, 32); cyl(.45, .5, (0, 0, .26), mat('int', (.05, .04, .03, 1), r=1), 32); cyl(.44, .02, (0, 0, .515), mat('eau_p', (.02, .09, .13, 1), r=.12), 32)
for s in (-1, 1): boite((.08, .08, 1.35), (s * .5, 0, 1.0), B)
boite((1.15, .06, .06), (0, 0, 1.45), B)
for s in (-1, 1): boite((1.2, .32, .05), (0, s * .13, 1.78), TUILE(), (-s * .72, 0, 0))
cyl(.06, .9, (0, 0, 1.15), B, 12).rotation_euler = (0, math.pi / 2, 0)
tourner(sc, 28); rendre(sc, 'puits')
