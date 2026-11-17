# Retours outils du 2026-11-17 — studio-art

- 2026-11-17 13:40 · catalogue.py : plante (AttributeError) quand ambientCG renvoie downloadFolders ou previewImage sous forme de liste (vu par la revue Une vie) → corrigé le 17/11 (équipe Outils : dict ou liste acceptés)
- 2026-11-17 13:40 · atelier.py : serveur() laisse son http.server tourner après le script ; le script suivant sur le même port sert l'ancien dossier sans erreur (vues3d.py attend 180 s pour rien, revue Trône de Braise)
- 2026-11-17 13:40 · hameau/outils/captures/t14.py : attend Three.js dans /home/claude/deps, absent sur une machine neuve → corrigé le 17/11 (équipe Outils : outils-communs/routes.py fournit three sans /home/claude/deps (demande posée))
- 2026-11-17 13:40 · couronnes-et-lignees : references/3d annoncé par CLAUDE.md et le README mais absent du dépôt, aucune comparaison 3D possible
- 2026-11-17 13:40 · captures de référence prises sans les polices (Google Fonts bloqué dans le bac à sable) : couronnes-et-complots/references/normale, sedes-petri, valdragon ; les polices communes intégrées (studio/ressources/polices) règlent le problème
