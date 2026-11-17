# Retours outils du 2026-11-17 — bannieres

- 2026-11-17 10:08 · perf.py : en rendu logiciel la carte 3D tombe à 1-2 img/s, le chiffre ne départage rien ; ajouté outils/prof3d.py (ms par image synchronisée, coût de chaque groupe de la scène, ombres, éclairage ciel) — un équivalent commun pour les jeux Three.js serait utile
- 2026-11-17 10:08 · serveur() d'atelier.py réutilise tout serveur déjà ouvert sur le port, même s'il sert un AUTRE dossier (copie « avant ») : mesures avant/après faussées sans le voir ; vérifier le dossier servi ou choisir un port libre
