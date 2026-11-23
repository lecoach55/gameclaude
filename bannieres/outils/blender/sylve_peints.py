"""Maison-arbre de la Sylve (habitations et taverne), vue presque de face comme les autres bâtiments de ville.
Outils de ville_peints.py. Usage : ELEV=8 ROT=32 /home/claude/bpyenv/bin/python sylve_peints.py dossier_sortie → lv_v_cabane.webp"""
import os
D = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(D, 'ville_peints.py')).read().split('# tour de mage')[0])
_a = open(os.path.join(D, 'arbres_peints.py')).read()
exec('from mathutils import noise, Vector\n' + _a[_a.index('def mat_feuillage('):_a.index('def tronc(')])
import bpy, math, random
sc = scene(); random.seed(5)
EC = mat('ecorce_s', (.62, .5, .38, 1), 'ecorce.jpg', 1.6); B = BOIS(); BS = mat('bois_s', (.5, .36, .24, 1), 'poutre.jpg', 2)
F = mat_feuillage('feuilles_s', (.015, .05, .01, 1), (.1, .26, .04, 1), (.35, .52, .1, 1))
TOIT = mat('toit_s', (.55, .75, .45, 1), 'chaume.jpg', 1.3)
# tronc large aux racines évasées
cyl(.55, 4.2, (0, 0, 2.1), EC, 24, .38)
for k in range(6):
    a = k / 6 * math.pi * 2; bpy.ops.mesh.primitive_cone_add(vertices=10, radius1=.22, radius2=.05, depth=1.1, location=(math.cos(a) * .55, math.sin(a) * .55, .3), rotation=(math.sin(a) * 1.1, -math.cos(a) * 1.1, 0)); ob(bpy.context.object, EC)
# plateforme et maison ronde
cyl(1.25, .14, (0, 0, 2.2), BS, 24)
for k in range(12):
    a = k / 12 * math.pi * 2; cyl(.04, .45, (math.cos(a) * 1.2, math.sin(a) * 1.2, 2.5), B, 8)
cyl(1.22, .05, (0, 0, 2.72), B, 24)
cyl(.8, 1.0, (0, 0, 2.78), mat('murs_s', (.82, .7, .5, 1), 'poutre.jpg', 2.5), 24)
cyl(1.05, .95, (0, 0, 3.75), TOIT, 24, .08)
boite((.35, .05, .6), (0, -.8, 2.6), mat('porte_s', (.15, .09, .05, 1)))
for z in (2.95,): boite((.22, .05, .22), (.45, -.66, z), mat('fen_s', (1, .8, .4, 1), em=(1, .7, .3, 1)))
# échelle
for x in (-.18, .18): boite((.05, .05, 2.2), (x + .1, -1.32, 1.1), B, (-.12, 0, 0))
for k in range(7): boite((.4, .04, .04), (.1, -1.32 + k * .018, .25 + k * .3), B)
# houppier au-dessus
for (x, y, z, r) in [(0, .1, 5.0, 1.1), (-.9, .2, 4.6, .8), (.9, .3, 4.7, .85), (.2, .6, 5.6, .75), (-.4, -.3, 4.5, .6)]:
    o = boule((x, y, z), r, F, int(x * 10 + y * 7 + 3), rug=.3)
rendre(sc, 'v_cabane', 480)
