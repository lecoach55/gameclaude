# Sedes Petri — Le Trône de Pierre

Jeu de gestion : on incarne le pape de 1073 à 1517 (4 époques : 1073, 1198, 1294, 1378).
Artefact publié : slug `e403381b-4eb6-4956-af79-666fc1dc0712` (fichiers multiples, scripts classiques, aucune étape de construction).

## Code (`jeu/`)
`data.js` (carte, royaumes, scénarios, décrets, ordres) · `engine.js` (simulation pure, testable sous Node) · `events.js` (~100 événements) · `art.js` (blasons, portraits, scènes en SVG) · `map.js` (carte raster + calque SVG) · `ui.js` · `nuage.js` (sauvegarde en ligne, document `partie`) · `testkit.js` (copie de `outils-communs/testkit.js`).
Capacités déclarées : `db` + `user`. Ne jamais modifier le document `partie` d'un joueur.
Graine fixe pour les tests : `index.html?graine=7` (local uniquement).

## Outils (`outils/`)
- `sim2.js [sage,moyen,passif] N [difficulté]` : parties complètes par robots (équilibrage). Repères 15/11/2026 : passif → effondrement en 20-30 ans ; sage → autorité moyenne ~75 jusqu'en 1517.
- `fuzz.js N` : actions et choix au hasard sur des parties entières + invariants (aucune erreur attendue : `{}`).
- `stats.js`, `mapend.js`, `logdump.js` : fréquence des événements, carte finale, annales lisibles.
- `perf.py sortie.json [ralenti_cpu]` : banc reproductible (téléphone = CPU bridé ×4, Mac). Résultats dans `mesures/`. `chargement_ms` = accueil visible ; la carte se construit ensuite en tâche de fond (`carte_prete_ms`), et `mapPret()` la termine d'office avant toute partie (le moteur a besoin des voisinages).
- `captures.py dossier` + `../outils-communs/compare.py ../references dossier planche.png` : non-régression visuelle (9 vues).
- `monkey.py N [m]` : testeur d'interface au hasard (ordinateur, ou mobile avec `m`).
- `sauvegarde.py`, `modetest.py` : reprise de partie ; mode test + signalement.

## Mesures sur les appareils de Victor
Écran d'accueil → 🧪 Mode test (partie séparée, aucune sauvegarde) ; en jeu ☰ → 🐞 Signaler. Lire avec `db_list` (collection `data/users/<id>`) : `mesures_*`, `signalement_*`.
