"""Greniers de ville propres à la faction (24/11) : la grange de bois du Bastion apparaissait aussi chez la Horde et la Sylve.
v_grenier_h : grenier rond en torchis sur pierres, chapeau de chaume (Horde) ; v_grenier_s : grenier tressé sur pilotis (Sylve) ; v_grenier_n : ossuaire de pierre à toit d'ardoise (Nécropole).
Usage : ELEV=8 ROT=32 /home/claude/bpyenv/bin/python greniers_var.py dossier → lv_<nom>.webp (à renommer mv_<nom>.webp dans jeu/imp)."""
import os, sys, math
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ville_peints.py')).read().split('# --- bâtiments')[0])
# Horde : deux greniers ronds en torchis sur pierres, chapeaux coniques de chaume, échelle
sc = scene(); TOR = mat('torchis', (.78, .5, .32, 1), 'enduit.jpg', 1.5, r=.95); CH = mat('chaume', (.95, .8, .55, 1), 'chaume.jpg', 1.3); B = BOIS()
for x, s in ((-.8, 1), (.9, .8)):
    for k in range(5):
        a = k / 5 * 6.28; cyl(.14 * s, .3 * s, (x + math.cos(a) * .55 * s, math.sin(a) * .55 * s, .15 * s), PIERRE(), 8)
    cyl(.7 * s, 1.3 * s, (x, 0, .3 * s + .65 * s), TOR, 24, .62 * s)
    cyl(.95 * s, 1.1 * s, (x, 0, 1.6 * s + .5 * s), CH, 24, .04)
    boite((.3 * s, .04, .35 * s), (x, -.66 * s, 1.0 * s), mat('trappe', (.3, .2, .12, 1), r=.9))
for sx in (-1, 1): boite((.05, .05, 1.4), (.0 + sx * .14, -.75, .65), B, (.35, 0, 0))
for j in range(5): boite((.3, .04, .04), (0, -.75 + .07 * j * .9, .2 + j * .25), B)
rendre(sc, 'v_grenier_h', 480)
# Sylve : grenier tressé sur pilotis de rondins, toit de chaume moussu
sc = scene(); EC = mat('ecorce', (.6, .48, .38, 1), 'ecorce.jpg', 2); OSI = mat('osier', (.72, .55, .32, 1), 'chaume.jpg', 3, r=.95); CHM = mat('chaumev', (.55, .62, .35, 1), 'chaume.jpg', 1.3)
for sx in (-1, 1):
    for sy in (-1, 1): cyl(.1, 1.2, (sx * .6, sy * .6, .6), EC, 10)
boite((1.7, 1.7, .12), (0, 0, 1.25), B := BOIS())
cyl(.85, 1.2, (0, 0, 1.9), OSI, 28, .78)
cyl(1.25, 1.3, (0, 0, 3.1), CHM, 28, .05)
for k in range(6): boite((.32, .04, .04), (-.95, -.6 + 0 * k, .2 + k * .2), B)
for sy in (-1, 1): boite((.05, .05, 1.35), (-.95, -.6 + sy * .14, .65), B)
rendre(sc, 'v_grenier_s', 480)
# Nécropole : ossuaire de pierre sombre, toit d'ardoise, porte de fer, crânes alignés
sc = scene(); P = mat('pierren', (.55, .55, .58, 1), 'mur3.jpg', 1); AR = mat('ardoise', (.6, .62, .7, 1), 'ardoise.jpg', 1.2)
boite((2.6, 1.8, .4), (0, 0, .2), P); boite((2.3, 1.5, 1.6), (0, 0, 1.2), P)
for sg in (-1, 1): boite((2.6, 1.15, .1), (0, sg * .45, 2.35), AR, (-sg * .85, 0, 0))
boite((2.3, .12, .2), (0, 0, 2.75), P)
boite((.6, .05, 1.0), (0, -.76, .9), mat('porten', (.16, .11, .08, 1), 'bois.jpg', 2, r=.9))
for z in (.6, 1.2): boite((.64, .06, .05), (0, -.78, z), mat('fer', (.1, .1, .11, 1), r=.6))
boite((.12, .12, .9), (0, -.3, 3.15), P); boite((.5, .12, .12), (0, -.3, 3.35), P)
rendre(sc, 'v_grenier_n', 480)
