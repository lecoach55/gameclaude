# Couronnes & Complots

Jeu de conquête façon Risk avec Conseil, intrigues, pactes et Sacre (SVG, aucune dépendance réseau hors polices Google).
Artefact publié : slug `bb426884-b0bb-4943-a930-164fb4e5f790` (capacités db + user pour la trousse de test).

## Construire
```
cd couronnes-et-complots/jeu && npm i && node build.mjs     # → couronnes-et-complots.html (à publier)
```
`build.mjs` assemble `src.html` + carte générée (`mapgen.js`, graine fixe) + `outils-communs/testkit.js` + `game.js`.

## Outils (`outils/`, lancer avec `NODE_PATH=../jeu/node_modules`)
- `ab.cjs N parties nivA nivB fichier.html sortie.json` : A/B entre niveaux d'IA (rendu coupé, ~1 partie/s). `RULES='{...}'` teste une variante de règles (voir `RULES` dans game.js).
- `fs.cjs N parties niv1,niv2,… fichier.html sortie.json` + `anH.cjs` : statistiques détaillées (durées, édits, pactes, actions, sièges).
- `hv.cjs N parties heros adversaire fichier.html sortie.json` : un joueur (ex. `naif` = débutant simulé) contre N−1 IA, siège tournant.
- `perf.py fichier.html sortie.json` : banc de fluidité (tél. 390×780 et 1440×900) ; `coupables.py` / `couches.py` : coût de chaque effet / couche.
- `refs.py fichier.html dossier` puis `python3 ../../outils-communs/compare.py ../references/normale dossier planche.png` : non-régression visuelle.
- `fullgame.py` : partie humaine complète par vrais clics (détecte les blocages d'interface). `audit5.py` : captures à plusieurs tailles.

## Règles d'or
- Ne pas toucher à l'équilibre sans A/B (≥150 parties) ; la courbe de difficulté visée : débutant vs facile ≥ 55 %, vs rusée ≤ 30 %.
- Journal de tous les cycles : `jeu/JOURNAL.md`. Mesures : `mesures/`.
