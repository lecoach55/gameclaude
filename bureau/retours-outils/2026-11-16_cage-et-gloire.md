# Retours outils du 2026-11-16 — cage-et-gloire

- 2026-11-16 12:39 · studio.py : la caméra oscille (CAM.sw aléatoire), les captures ne sont pas cadrées pareil d'une fois à l'autre → compare.py sonne toujours (64-72 %) ; il faudrait figer la caméra → corrigé le 16/11 par l'équipe Outils : `outils-communs/horloge.js` (une ligne à ajouter dans studio.py, demande au bureau)
- 2026-11-16 15:05 · parcours.py : se bloquait à vie sur un événement aléatoire (evaluate('avancer(1)') attendait la promesse de la fenêtre qui attend un clic) → corrigé avancer(1);0
