# Retours outils du 2026-11-17 — trone-de-braise

- 2026-11-17 17:45 · donjon3d/build.py : écrit dans /tmp/d3bundle.js (chemin commun), deux constructions en parallèle s'écrasent
- 2026-11-17 18:30 · banc.py --avant HEAD : la copie ne prend que le dossier du jeu + outils-communs ; le donjon 3D du Trône lit valdragon/jeu (patlas.png…) → construction échouée ; contourné par --avant-dossier (worktree)
- 2026-11-17 18:59 · banc.py --avant-dossier <worktree complet> : passe avant « jeu jamais prêt » (donjon3d.html) alors que la même page tourne avec gel3d.py ; 21 min pour n'avoir que l'après
