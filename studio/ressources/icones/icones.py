#!/usr/bin/env python3
"""Fabrique la planche de symboles SVG commune du studio (icônes au trait Lucide, licence ISC).

python3 studio/ressources/icones/icones.py [dossier lucide-static/icons] [noms supplémentaires,...]
  - sans argument : relit la liste NOMS et réécrit studio.svg à partir de `npm i lucide-static` (dossier courant ou /tmp).
Usage dans un jeu : coller studio.svg (≈ 25 Ko) une fois dans la page, puis
  <svg class="ico"><use href="#i-crown"/></svg>
  .ico{width:1.2em;height:1.2em;stroke:currentColor;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
Jeux médiévaux : couleur or (--or), trait 1.4 ; jeux modernes : couleur du texte, trait 1.8.
Licence ISC : garder la mention « Icônes Lucide (ISC) » dans les crédits du jeu.
"""
import sys, os, re
NOMS = """menu settings volume-2 volume-x bug flask-conical play pause fast-forward save x circle-help info map
swords sword shield crown castle scroll-text coins users heart trophy calendar chart-line trending-up trending-down
wallet house hammer wheat church skull gem backpack flag camera gauge zoom-in zoom-out maximize undo-2
chevron-right handshake landmark eye hourglass
truck car-taxi-front rocket tv mountain-snow plug-zap sun glasses book-open file-lock newspaper factory flame gavel""".split()

def trouver():
    for d in [sys.argv[1] if len(sys.argv) > 1 else '', 'node_modules/lucide-static/icons', '/tmp/node_modules/lucide-static/icons']:
        if d and os.path.isdir(d): return d
    sys.exit('lucide-static introuvable : npm i lucide-static')

def main():
    src = trouver(); noms = NOMS + (sys.argv[2].split(',') if len(sys.argv) > 2 else [])
    out = ['<svg xmlns="http://www.w3.org/2000/svg" style="display:none">',
           '<!-- Icônes Lucide (https://lucide.dev), licence ISC — voir LICENSE-lucide-ISC.txt -->']
    for n in noms:
        s = open(os.path.join(src, n + '.svg')).read()
        corps = re.search(r'<svg[^>]*>(.*)</svg>', s, re.S).group(1)
        corps = re.sub(r'<!--.*?-->', '', corps, flags=re.S)
        corps = re.sub(r'\s+', ' ', corps).strip()
        out.append(f'<symbol id="i-{n}" viewBox="0 0 24 24">{corps}</symbol>')
    out.append('</svg>')
    dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'studio.svg')
    open(dst, 'w').write('\n'.join(out) + '\n')
    print(dst, len(noms), 'icônes', os.path.getsize(dst), 'octets')

main()
