# À mutualiser — pistes pour optimiser chaque jeu avec ce que les autres ont déjà

Relevé du 16/11/2026. Le bureau signale, il ne modifie pas les jeux : chaque piste se traite dans une conversation sur le jeu concerné, avec ses tests habituels. Cocher et dater quand c'est fait.
Les alertes automatiques à jour sont dans `python3 bureau/outils/bureau.py`.

## Priorité haute
- [ ] **Le Trône de Braise : trousse de test ancienne.** Sa copie de `testkit.js` n'attend pas `window.claude` : c'est le défaut qui a empêché Sedes Petri de recevoir mesures et signalements. Remplacer par `sed 's/^export //' outils-communs/testkit.js` (+ `window.Testkit=Testkit;`), reconstruire, vérifier qu'un 🐞 arrive bien (`db_list`).
- [ ] **Président de Club : pas de trousse de test.** Ni 🐞 ni banc sur les appareils de Victor. Intégrer `testkit.js` (modèle DOM : `couronnes-et-lignees/jeu/app.js`).

## Priorité moyenne
- [ ] **Bannières, Cage & Gloire, Sedes Petri : recopier le `testkit.js` commun** (filtre des pauses > 1 s ajouté au commun le 16/11, repris de Cage & Gloire). Gain : des img/s qui ne s'effondrent plus quand l'onglet passe en arrière-plan.
- [ ] **8 bancs `perf.py` différents.** Ceux de Trône de Braise / Bannières / Cage & Gloire s'appuient déjà sur `atelier.py`. Pour les autres, passer à `atelier.py` à la prochaine retouche ; à terme, un `outils-communs/banc.py` (scènes données par le jeu, sortie JSON commune) permettrait de comparer la fluidité de tous les jeux sur la même échelle.
- [ ] **5 `studio.py` / 3 `captures.py`** : même idée, un studio commun prenant une liste de vues.
- [ ] **Robots** : `explore.py` (3 versions), `parcours.py` (3), `monkey.py` (3). Le `monkey.py` de Bannières est le plus général : le passer dans `outils-communs/`.

## Poids du dépôt
- [ ] `three.js` r160 en double (Bannières et Couronnes & Lignées, 0,7 Mo chacun) : garder une copie dans `outils-communs/vendor/` et la lire au build.
- [ ] Une vie parmi 8 milliards est restée en Three.js r128 (les autres jeux 3D en r160) : à voir seulement si un outil 3D commun doit s'y brancher.

## Documentation
- [ ] Valdragon et Wall Street n'ont pas de README dans leur dossier (tout est dans `CLAUDE.md`).
- [ ] Couronnes & Complots, Couronnes & Lignées, Hameau, Président de Club, Sedes Petri, Une vie, Valdragon, Wall Street n'ont pas de `ARTEFACT.txt` : le slug n'est lisible que dans `CLAUDE.md` (le bureau le lit là).

## Fait
- [x] 16/11 — filtre des pauses de `cage-et-gloire/jeu/testkit.js` reporté dans `outils-communs/testkit.js`.
