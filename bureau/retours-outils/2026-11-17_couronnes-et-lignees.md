# Retours outils du 2026-11-17 — couronnes-et-lignees

- 2026-11-17 16:36 · cibles.py appelle regionSheet() (n'existe plus) ; references/3d/ absent (compare plante) ; captures.py force la 2D alors que la 3D est par défaut
- 2026-11-17 17:45 · sim.js : la commande de CLAUDE.md node -e "require('./sim.js').run('heur',1000)" n'affiche rien ; utiliser node sim.js ou console.log(fmt(...))
- 2026-11-17 21:48 · captures.py : references/3d toujours absent (compare impossible sans passer par l'ancienne version) ; 16 vues 3D = 15 Mo, trop lourd pour le dépôt : prévoir des JPEG ou une résolution réduite → corrigé le 18/11 par l'équipe Outils : `outils-communs/captures.py couronnes-et-lignees/outils/vues3d.json /tmp/cl3 --avant HEAD` compare à la révision sans références stockées (33 s) ; références légères `--format jpg --echelle 0.5` = 0,9 Mo au lieu de 15 Mo
