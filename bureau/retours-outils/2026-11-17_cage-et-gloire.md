# Retours outils du 2026-11-17 — cage-et-gloire

- 2026-11-17 11:16 · singe.py : « .carte » dans le sélecteur de singe.json → faux blocage (60 tapes sur des cartes inertes dans la fiche adverse) ; retiré du réglage, clics sans effet 26 % → 6 %
- 2026-11-17 11:16 · combat3d.py, sauvegarde.py, studio.py figés sur un seul format d'écran (sauvegarde.py écrit dans /tmp/acc_sauv.png) : prendre largeur/hauteur en paramètres comme parcours.py
- 2026-11-17 11:16 · references/headkick.png et sol.png ne correspondaient plus à la v11 publiée (11 et 27 % d'écart sans aucun changement) : refaites le 17/11 avec studio.py à horloge figée, + garde, coin, portrait1, ko
- 2026-11-17 16:36 · monkey.py n'entre jamais en combat 3D (images_en_combat = 0 sur 400 clics) ; sauvegarde.py écrit /tmp/acc_sauv.png en dur
