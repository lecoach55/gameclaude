#!/usr/bin/env python3
"""CSS @font-face intégrable (woff2 en base64) pour une page unique hors ligne.

python3 studio/ressources/polices/polices.py medieval|moderne|<famille>[,<famille>...] > polices.css
Familles : cinzel, alegreya, alegreya-sc, alegreya-sans, eb-garamond, grenze-gotisch, inter, barlow-condensed, jetbrains-mono
Jeux de polices du studio :
  medieval = Cinzel (titres) + Alegreya (texte) + Alegreya SC (petites capitales)         ≈ 215 Ko encodés
  medieval-sombre = Grenze Gotisch (titres) + Alegreya Sans (texte, interface)             ≈ 140 Ko
  moderne  = Barlow Condensed (titres) + Inter (texte) + JetBrains Mono (chiffres)        ≈ 215 Ko
Sous-ensemble « latin » (français complet : é è à ç œ « » …). Licence SIL OFL 1.1 : texte dans chaque dossier
(OFL.txt) ; une ligne « Polices : … (SIL OFL) » dans les crédits suffit.
"""
import sys, os, base64, glob, re
ICI = os.path.dirname(os.path.abspath(__file__))
NOMS = {'cinzel':'Cinzel','alegreya':'Alegreya','alegreya-sc':'Alegreya SC','alegreya-sans':'Alegreya Sans',
        'eb-garamond':'EB Garamond','grenze-gotisch':'Grenze Gotisch','inter':'Inter',
        'barlow-condensed':'Barlow Condensed','jetbrains-mono':'JetBrains Mono'}
JEUX = {'medieval':['cinzel','alegreya','alegreya-sc'],'medieval-sombre':['grenze-gotisch','alegreya-sans'],
        'moderne':['barlow-condensed','inter','jetbrains-mono']}
fams = []
for a in (sys.argv[1] if len(sys.argv) > 1 else 'medieval').split(','):
    fams += JEUX.get(a, [a])
for fam in fams:
    for f in sorted(glob.glob(os.path.join(ICI, fam, '*.woff2'))):
        poids, style = re.search(r'latin-(\d+)-(\w+)\.woff2', f).groups()
        b = base64.b64encode(open(f, 'rb').read()).decode()
        print(f"@font-face{{font-family:'{NOMS[fam]}';font-style:{style};font-weight:{poids};font-display:swap;"
              f"src:url(data:font/woff2;base64,{b}) format('woff2')}}")
