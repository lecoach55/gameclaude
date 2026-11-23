"""Entrée de mine peinte (remplace le portail Sketchfab sombre) : colline de rochers peints moussus, boisage de rondins,
galerie noire, rails et wagonnet. Outils de lieux_peints.py (scène, rendu) et rochers_peints.py (blocs, roche).
Usage : ROT=25 /home/claude/bpyenv/bin/python mine_peinte.py dossier_sortie → lv_mine_entree.webp + .json"""
import os
D = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(D, 'lieux_peints.py')).read().split('\n# puits')[0])
_r = open(os.path.join(D, 'rochers_peints.py')).read()
exec('import bpy, bmesh, math\nfrom mathutils import noise, Vector\nVAR = ""\n' + _r[_r.index('def bloc('):_r.index('# a : gros bloc')])
sc = scene(); R = materiau(); B = BOIS(); BS = mat('bois_sombre', (.42, .3, .2, 1), 'poutre.jpg', 2)
NOIR = mat('galerie', (.01, .008, .006, 1), r=1); FER = mat('fer', (.3, .3, .32, 1), r=.4, m=.85)
for o in [bloc(3, 1.6, 1.2, 1.25, (0, .75, 0), .2), bloc(8, 1.0, .9, .8, (-1.25, .55, 0), 1.1), bloc(13, .95, .85, .7, (1.2, .6, 0), .5), bloc(19, .6, .55, .45, (-1.5, -.2, 0), 2)]:
    o.data.materials.append(R)
boite((.75, .5, .95), (0, -.25, .48), NOIR)                                  # galerie
for x in (-.48, .48): boite((.15, .15, 1.15), (x, -.45, .57), B)            # montants
boite((1.3, .18, .18), (0, -.45, 1.2), B)                                    # linteau
for x in (-.48, .48): boite((.08, .08, .55), (x * .62, -.47, .95), BS, (0, x * 1.5, 0))   # étais
boite((.04, .6, .04), (0, -1.0, .02), BS)
for x in (-.22, .22): boite((.035, 1.5, .035), (x, -1.0, .05), FER)          # rails
for k in range(6): boite((.6, .06, .03), (0, -.35 - k * .22, .02), BS)       # traverses
boite((.5, .38, .28), (0, -1.15, .3), BS)                                    # wagonnet
for x in (-.2, .2):
    for y in (-1.3, -1.0): cyl(.08, .05, (x * 1.15, y, .1), FER, 12).rotation_euler = (0, math.pi / 2, 0)
for k in range(5): bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=.09, location=(-.14 + k * .07, -1.15 + (k % 2) * .06, .47)); ob(bpy.context.object, mat('minerai_w', (.08, .075, .075, 1), r=.5, m=.5))
cyl(.03, 1.0, (.75, -.5, .5), BS, 8); cyl(.07, .12, (.75, -.5, 1.05), mat('lanterne', (1, .7, .3, 1), em=(1, .6, .2, 1)), 8)
rendre(sc, 'mine_entree', 520)
