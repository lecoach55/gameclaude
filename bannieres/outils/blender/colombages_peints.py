"""Maisons à colombages « peintes » du Bastion (remplacent les maisons Sketchfab trop photo), vues presque de face.
Rez-de-chaussée de pierre, étage en encorbellement blanc à poutres sombres, toit de tuiles pentu, cheminée, fenêtres éclairées.
Outils de ville_peints.py. Usage : ELEV=8 ROT=32 /home/claude/bpyenv/bin/python colombages_peints.py dossier → lv_col_a/b/c.webp"""
import os
D = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(D, 'ville_peints.py')).read().split('# tour de mage')[0])
import bpy, math, random

def maison(L, P, etages, toit_c, graine, lucarne=False, auvent=False):
    random.seed(graine)
    PI = mat('pierre_c', (.9, .85, .76, 1), 'mur.jpg', 1.4); EN = mat('enduit', (.98, .93, .8, 1), 'enduit.jpg', 1.5, r=.9)
    PO = mat('poutre_c', (.38, .24, .14, 1), 'poutre.jpg', 2); TU = mat('tuile_c', toit_c, 'tuile.jpg', 1.3)
    FEN = mat('fen_c', (.3, .22, .12, 1), r=.3, em=(.13, .08, .02, 1)); VO = mat('volet', (.25, .38, .22, 1), 'poutre.jpg', 2)
    h0 = 1.1; boite((L, P, h0), (0, 0, h0 / 2), PI)                                  # rez-de-chaussée en pierre
    boite((.5, .06, .85), (-L * .22, -P / 2 - .01, .43), mat('porte_c', (.35, .2, .1, 1), 'poutre.jpg', 2))
    boite((.62, .08, .1), (-L * .22, -P / 2 - .02, .9), PO)
    for x in (L * .2,): boite((.36, .05, .4), (x, -P / 2 - .01, .62), FEN); boite((.44, .07, .06), (x, -P / 2 - .03, .84), PO)
    z = h0
    for e in range(etages):                                                          # étages en encorbellement
        Le, Pe, he = L + .25 * (e + 1), P + .25 * (e + 1), 1.0
        boite((Le, Pe, he), (0, 0, z + he / 2), EN)
        f = -Pe / 2 - .015
        for x in [-Le / 2 + .04, Le / 2 - .04] + [(-Le / 2) + Le * k / 4 for k in (1, 2, 3)]: boite((.08, .05, he), (x, f, z + he / 2), PO)
        for zz in (z + .04, z + he - .04): boite((Le + .02, .05, .08), (0, f, zz), PO)
        for k in (0, 2): boite((.06, .04, he * 1.05), (-Le / 2 + Le * (k + .5) / 4, f - .005, z + he / 2), PO, (0, (.6 if k else -.6), 0))
        for k in (1, 3):
            x = -Le / 2 + Le * (k - .5) / 4 + Le / 8
            boite((.32, .05, .42), (x, f - .005, z + he * .55), FEN)
            for sx in (-1, 1): boite((.14, .04, .44), (x + sx * .24, f - .01, z + he * .55), VO)
        z += he
    Lt, Pt = L + .25 * etages + .3, P + .25 * etages + .3; ht = Lt * .55
    for sg in (-1, 1):                                                               # toit à deux pans (faîtage sur x)
        boite((Lt, Pt * .62, .1), (0, sg * Pt * .25, z + ht / 2 - .05), TU, (-sg * math.atan2(ht, Pt / 2), 0, 0))
    for sx in (-1, 1):                                                               # pignons triangulaires
        x = sx * (Lt / 2 - .2); Pg = Pt / 2 - .12
        me = bpy.data.meshes.new('pignon'); me.from_pydata([(x, -Pg, z), (x, Pg, z), (x, 0, z + ht - .3), (x - sx * .1, -Pg, z), (x - sx * .1, Pg, z), (x - sx * .1, 0, z + ht - .3)], [], [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)])
        o = bpy.data.objects.new('pignon', me); bpy.context.scene.collection.objects.link(o); ob(o, EN)
        boite((.06, .04, ht * .8), (x + sx * .01, 0, z + ht * .4), PO)
    boite((.32, .32, ht * .9), (L * .28, Pt * .15, z + ht * .6), PI)                   # cheminée
    if lucarne:
        boite((.5, .5, .45), (0, -Pt * .3, z + ht * .32), EN); boite((.26, .05, .26), (0, -Pt * .3 - .26, z + ht * .32), FEN)
        for sg in (-1, 1): boite((.62, .4, .06), (sg * .17, -Pt * .3, z + ht * .32 + .32), TU, (0, sg * .7, 0))
    if auvent:
        for sx in (-1, 1): cyl(.04, .9, (sx * L * .35, -P / 2 - .55, .45), PO, 8)
        boite((L * .85, .7, .06), (0, -P / 2 - .35, .95), mat('toile_c', (.75, .2, .15, 1), r=.9), (.35, 0, 0))

for nom, args in [('col_a', (2.2, 1.6, 1, (1, .62, .5, 1), 3, False, False)),
                  ('col_b', (2.8, 1.8, 2, (.9, .55, .45, 1), 7, True, False)),
                  ('col_c', (2.4, 1.7, 1, (.65, .6, .62, 1), 11, False, True))]:
    sc = scene(); maison(*args); rendre(sc, nom, 460)
