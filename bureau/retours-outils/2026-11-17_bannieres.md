# Retours outils du 2026-11-17 — bannieres

- 2026-11-17 10:08 · perf.py : en rendu logiciel la carte 3D tombe à 1-2 img/s, le chiffre ne départage rien ; ajouté outils/prof3d.py (ms par image synchronisée, coût de chaque groupe de la scène, ombres, éclairage ciel) — un équivalent commun pour les jeux Three.js serait utile
- 2026-11-17 10:08 · serveur() d'atelier.py réutilise tout serveur déjà ouvert sur le port, même s'il sert un AUTRE dossier (copie « avant ») : mesures avant/après faussées sans le voir ; vérifier le dossier servi ou choisir un port libre → corrigé le 17/11 (équipe Outils, atelier.serveur vérifie le dossier)
- 2026-11-17 12:11 · testkit.js v6 (commun) : stats() écarte toutes les images > 1000 ms ; si une scène n'a que des images lentes, le banc renvoie fps/pire undefined — justement sur l'appareil le plus lent (vu au banc en rendu logiciel) → corrigé le 17/11 (équipe Outils, testkit v7)
- 2026-11-17 16:36 · parcours/scen/monkey servent jeu/ (sources) et non la page construite ; monkey.py plante si une fenêtre reste ouverte (#bTest intercepté) ; parcours.py sauvegarde pendant le tour de l'IA
- 2026-11-17 17:45 · parcours.py : ~2 min par jour de jeu en rendu logiciel même en Économie ; prévoir une option ?v3d=0 pour les robots
