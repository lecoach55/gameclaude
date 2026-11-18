#!/usr/bin/env python3
"""Télécharge les ressources CC0 de MakeHuman 1.x (maillage de base, squelette, poids, cibles de corps)
dans un dossier neuf. Licence : assets MakeHuman en CC0 1.0 (LICENSE.md, section C, du dépôt makehumancommunity/makehuman).
Usage : python3 -I outils/mh_dl.py dossier"""
import sys, os, urllib.request
BASE = 'https://raw.githubusercontent.com/makehumancommunity/makehuman/master/'
FICHIERS = ['LICENSE.md', 'makehuman/data/3dobjs/base.obj', 'makehuman/data/rigs/default.mhskel',
            'makehuman/data/rigs/default_weights.mhw'] + [
    'makehuman/data/targets/macrodetails/' + t for t in (
        'universal-male-young-maxmuscle-averageweight.target',
        'universal-male-young-averagemuscle-averageweight.target',
        'universal-male-young-maxmuscle-minweight.target',
        'universal-female-young-averagemuscle-averageweight.target',
        'universal-female-young-maxmuscle-averageweight.target',
        'universal-male-young-averagemuscle-minweight.target',
        'caucasian-male-young.target', 'caucasian-female-young.target', 'african-male-young.target', 'asian-male-young.target')]
d = sys.argv[1]
os.makedirs(d, exist_ok=True)
for f in FICHIERS:
    out = os.path.join(d, os.path.basename(f))
    try:
        with urllib.request.urlopen(BASE + f, timeout=60) as r:
            data = r.read()
        open(out, 'wb').write(data)
        print('ok', len(data), f)
    except Exception as e:
        print('ÉCHEC', f, e)
