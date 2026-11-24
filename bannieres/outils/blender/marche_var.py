"""Marchés propres aux factions (24/11) : Horde (étals de rondins sous peaux tendues, os, peaux et viande), Nécropole
(étals de pierre noire sous toiles déchirées violettes, crânes, fioles vertes), Sylve (étals de branches sous toits de
feuilles, fruits et champignons). Outils de ville_peints.py. Usage : ELEV=8 ROT=32 /home/claude/bpyenv/bin/python marche_var.py sortie"""
import os
D = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(D, 'ville_peints.py')).read().split('# tour de mage')[0])
import bpy
V = {'h': dict(pied=('rondin_m', (.62, .45, .3, 1), 'ecorce.jpg', 2.5), toiles=[(.22, .12, .06, 1), (.3, .17, .09, 1), (.18, .1, .05, 1)],
               objets=[(.85, .8, .7, 1), (.55, .12, .08, 1), (.6, .4, .22, 1)]),
     'n': dict(pied=('pierre_m', (.28, .28, .34, 1), 'mur2.jpg', 1.5), toiles=[(.1, .04, .14, 1), (.07, .065, .09, 1), (.12, .05, .16, 1)],
               objets=[(.85, .82, .72, 1), (.3, 1, .45, 1), (.4, .38, .45, 1)]),
     's': dict(pied=('branche_m', (.55, .42, .3, 1), 'ecorce.jpg', 2.5), toiles=[(.2, .45, .12, 1), (.3, .55, .15, 1), (.25, .5, .2, 1)],
               objets=[(.85, .2, .15, 1), (.95, .7, .2, 1), (.8, .7, .55, 1)])}
for k, v in V.items():
    sc = scene(); P = mat(*v['pied'])
    for i, x in enumerate((-1.5, 0, 1.5)):
        boite((1.2, .8, .7), (x, 0, .35), P)
        for sx in (-1, 1):
            for sy in (-1, 1): cyl(.05, 1.6, (x + sx * .55, sy * .35, .8), P, 8)
        for sg in (-1, 1): boite((1.35, .6, .04), (x, sg * .24, 1.75), mat(f't{k}{i}', v['toiles'][i], 'chaume.jpg' if k == 's' else 'poutre.jpg' if k == 'h' else None, 2, r=.95), (-sg * .5, 0, 0))
        for j in range(5):
            em = v['objets'][1] if (k == 'n' and j % 2) else None
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1 if k == 'n' else 2, radius=.09, location=(x - .4 + j * .2, -.25, .78)); ob(bpy.context.object, mat(f'o{k}{j}', v['objets'][j % 3], r=.5, em=em))
    for x in (-2.4, 2.4): cyl(.3, .6, (x, -.3, .3), mat('tonneau', (.55, .4, .25, 1), 'bois.jpg', 2), 16)
    rendre(sc, 'v_marche_' + k, 520)
