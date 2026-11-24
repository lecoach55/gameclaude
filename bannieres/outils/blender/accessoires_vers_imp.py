"""Range les accessoires rendus par accessoires_peints.py dans jeu/imp (vue « b » de la ville) : python3 accessoires_vers_imp.py /tmp/acc"""
import json, shutil, sys, os
src = sys.argv[1]; dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../jeu/imp')
meta = json.load(open(f'{dst}/imp.json'))
for n in ('tombe_a', 'tombe_b', 'cercueil', 'totem', 'tambour', 'sechoir', 'panier', 'souche'):
    shutil.copy(f'{src}/lv_{n}.webp', f'{dst}/{n}_b.webp'); meta[n + '_b'] = json.load(open(f'{src}/lv_{n}.webp.json'))
json.dump(meta, open(f'{dst}/imp.json', 'w'), separators=(',', ':'))
print('ok', len(meta))
