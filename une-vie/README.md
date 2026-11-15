# Une vie parmi 8 milliards

Simulateur de vie (inspiré de « 1 sur 8 milliards ») avec scène 3D façon maison de poupée (Three.js r128, intégré).
Artefact publié : slug `b04fac4d-6c5d-4942-aea6-f931c43137b7` (capacités `db` + `user` pour la trousse de test).

## Fabriquer
- Source : `jeu/index_src.html` (moteur de jeu + module 3D `W3` + trousse de test), moteur 3D dans `jeu/vendor/three.min.js`.
- `python3 jeu/build.py` → `build/index.html` (fichier unique, ~0,8 Mo) à publier (`publish_files` as index.html).

## Outils (`outils/`)
- `sh outils/sim.sh 2000 random|smart|f:Équilibre` : non-régression du moteur de jeu (harness.js). Référence au 15/11 : âge moyen ~65, score ~56.
- `python3 outils/studio.py dossier [scènes]` : captures à graine fixe (rural0, ville1, appart2, maison3, villa4, nuit, hiver, automne, canicule, deluge, froid, arbre, bilan).
- `python3 ../outils-communs/compare.py references dossier planche.png` : comparaison avec `references/`.
- `python3 outils/perf.py mesures/x.json hd|sd` : banc reproductible (img/s relatives en rendu logiciel, appels, triangles).
- `qa.py` (3 vies complètes), `mob.py` (iPhone émulé), `heir.py` (dynastie), `banc_test.py` (mode 🧪 + 🐞).

## Règles
- Ne pas changer l'équilibre du jeu sans le demander à Victor ; vérifier avec `sim.sh`.
- Mode test 🧪 (accueil) : banc SD/HD → document `mesures_*` ; 🐞 → `signalement_*` (collection `data/users/<id>`, lire avec `db_list`). Le mode test ne sauvegarde pas les vies.
- Sur téléphone : qualité SD par défaut.
