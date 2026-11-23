"""Mausolée de la Nécropole (variété parmi les cryptes), vu presque de face comme les autres bâtiments de ville.
Outils de ville_peints.py. Usage : ELEV=8 ROT=28 /home/claude/bpyenv/bin/python necro_peints.py dossier_sortie → lv_v_mausolee.webp"""
import os
D = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(D, 'ville_peints.py')).read().split('# tour de mage')[0])
import bpy, math
sc = scene()
PS = mat('pierre_n', (.3, .3, .38, 1), 'mur2.jpg', 1.2); PS2 = mat('pierre_n2', (.22, .22, .28, 1), 'mur2.jpg', 1.4)
TOIT = mat('ardoise_n', (.22, .24, .3, 1), 'ardoise.jpg', 1.4); FER = mat('fer_n', (.1, .1, .12, 1), r=.4, m=.8)
VERT = mat('lueur', (.4, 1, .55, 1), em=(.3, 1, .5, 1))
boite((2.4, 2.0, .25), (0, 0, .12), PS2)                                    # parvis
for k in range(3): boite((1.6 - k * .0, .3, .1), (0, -1.05 - k * .2, .05 + 0 * k), PS2)
boite((1.8, 1.5, 1.6), (0, .1, 1.05), PS)                                  # corps
for sg in (-1, 1): boite((2.0, .95, .08), (0, .1 + sg * .38, 2.05), TOIT, (-sg * .75, 0, 0))
for x in (-.65, .65):
    cyl(.12, 1.55, (x, -.75, 1.0), PS, 16)                                   # colonnes
    cyl(.07, .5, (x * 1.45, -1.0, .5), PS2, 8); cyl(.08, .14, (x * 1.45, -1.0, .82), VERT, 8)  # lanternes vertes
boite((.7, .06, 1.1), (0, -.66, .8), mat('ombre_n', (.02, .02, .03, 1)))  # porte sombre
for k in range(5): boite((.03, .04, 1.1), (-.28 + k * .14, -.7, .8), FER)   # grille
cyl(.06, .02, (0, -.73, 1.55), VERT, 16).rotation_euler = (math.pi / 2, 0, 0)  # œil de lueur
for x in (-1.1, 1.1):
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=.12, depth=.7, location=(x, .8, 2.3)); ob(bpy.context.object, PS)   # pinacles
# pierres tombales devant
for k, x in enumerate((-1.0, -.5, .55, 1.05)):
    boite((.28, .08, .38 + k % 2 * .1), (x, -1.6, .2), PS2, (0, (k - 1.5) * .08, 0))
rendre(sc, 'v_mausolee', 420)
