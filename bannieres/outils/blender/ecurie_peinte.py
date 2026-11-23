"""Écurie peinte de la carte (remplace le modèle Sketchfab) : grange de planches au toit de chaume, enclos, abreuvoir, foin.
Outils de lieux_peints.py. Usage : ROT=30 /home/claude/bpyenv/bin/python ecurie_peinte.py dossier_sortie → lv_ecurie.webp"""
import os
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lieux_peints.py')).read().split('\n# puits')[0])
import bpy, math
sc = scene(); P = PIERRE(); B = BOIS(); BS = mat('bois_sombre', (.42, .3, .2, 1), 'poutre.jpg', 2)
CH = mat('chaume', (1.15, .92, .55, 1), 'chaume.jpg', 1.3); FOIN = mat('foin', (.95, .78, .35, 1), 'chaume.jpg', 3)
boite((2.0, 1.3, .15), (0, .2, .07), P)
boite((1.8, 1.1, .95), (0, .25, .62), mat('planches', (.95, .72, .5, 1), 'bois.jpg', 2.5))
for x in (-.9, .9):
    for y in (-.3, .8): boite((.1, .1, 1.0), (x, y, .62), BS)
for sg in (-1, 1): boite((2.1, .85, .07), (0, .25 + sg * .36, 1.32), CH, (-sg * .68, 0, 0))
boite((.6, .05, .75), (-.3, -.31, .5), mat('porte_e', (.08, .05, .03, 1)))
for k in range(2): boite((.28, .03, .7), (-.45 + k * .3, -.34, .5), BS, (0, (k * 2 - 1) * .0, 0))
boite((.06, .04, .75), (-.3, -.35, .5), BS, (0, .9, 0))
# enclos devant
for x in (-.9, -.3, .3, .9): boite((.07, .07, .45), (x, -1.0, .22), BS)
for z in (.2, .38): boite((1.9, .04, .05), (0, -1.0, z), B)
# abreuvoir et foin
boite((.55, .22, .16), (.55, -.6, .1), BS); boite((.5, .17, .02), (.55, -.6, .17), mat('eau_e', (.05, .2, .3, 1), r=.1))
bpy.ops.mesh.primitive_uv_sphere_add(radius=.28, location=(1.25, -.25, .2)); o = bpy.context.object; o.scale.z = .75; ob(o, FOIN)
bpy.ops.mesh.primitive_cube_add(size=1, location=(1.12, .75, .16)); o = bpy.context.object; o.scale = (.4, .3, .3); ob(o, FOIN)
rendre(sc, 'ecurie', 420)
