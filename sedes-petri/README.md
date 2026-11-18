# Sedes Petri — Le Trône de Pierre

Jeu de gestion : on incarne le pape de 1073 à 1517 (4 époques : 1073, 1198, 1294, 1378).
Artefact publié : slug `e403381b-4eb6-4956-af79-666fc1dc0712` (fichiers multiples, scripts classiques, aucune étape de construction).

## Code (`jeu/`)
`data.js` (carte, royaumes, scénarios, décrets, ordres) · `engine.js` (simulation pure, testable sous Node) · `events.js` (~100 événements) · `ambitions.js` (v18 : 18 ambitions de pontificat, 3 proposées à chaque couronnement ; réussite = gloire seulement via `S.ambGlory`, ligne dorée, mention au bilan ; tirage par un générateur à part, la partie est strictement identique à graine égale) · `art.js` (blasons, portraits « panneau gothique » de trois quarts sur fond d’or, âge lisible : cheveux, rides, cernes, bajoues ; scènes d’événements en SVG : 30 décors, ciel et sens variant selon une graine) · `map.js` (carte raster + calque SVG) · `ui.js` · `nuage.js` (sauvegarde en ligne, document `partie` ; attend `window.claude`, état visible dans ☰ Menu) · `codex.js` (notes historiques : décrets, ordres, hérésies) · `testkit.js` (copie de `outils-communs/testkit.js` sans `export`, chargée en script classique).
Capacités déclarées : `db` + `user`. Ne jamais modifier le document `partie` d'un joueur.
Graine fixe pour les tests : `index.html?graine=7` (local uniquement).

## Outils (`outils/`)
- `sim2.js [sage,moyen,passif] N [difficulté]` : parties complètes par robots (équilibrage). Repères 15/11/2026 : passif → effondrement en 20-30 ans ; sage → autorité moyenne ~75 jusqu'en 1517.
- `fuzz.js N` : actions et choix au hasard sur des parties entières + invariants, ambitions comprises (aucune erreur attendue : `{}`).
- Ambitions et équilibre (18/11/2026) : même graine, avec ou sans `ambitions.js` → 72 parties sage/moyen/passif strictement identiques hors gloire. Réussite d’un robot qui ne les poursuit pas : 13 % (croisade, paix, réforme ≈ 40-55 % ; union, vassaux < 5 %).
- `redondance.js [N] [robot] [sortie.json]` : ce que le joueur revoit trop souvent (événements, illustrations, textes, chronique). Repères 16/11/2026 : illustration la plus vue 96 % → 11 %, même image que l'événement précédent 93 % → 4 %, même texte revu en moins de 20 ans 28 % → 15 % (`mesures/redondance_*.json`). v17 (décision de Victor) : délai de retour de `simonie` et `eveque_roi` 6 → 10 saisons + 7 événements (appel_rome, commerce_infideles, double_election, ordre_militaire, mendiants, confrerie, faussaires) : ces deux événements 66 → 45 fois par partie, texte revu en moins de 20 ans 15,2 → 11,6 %, image la plus vue 11,3 → 8,7 % (`mesures/redondance_v17_*.json`). Équilibre : sans compensation, le robot moyen s'effondrait plus souvent (6/128 parties) car « Déposer l'évêque simoniaque » sortait moins ; les choix vertueux des nouveaux événements (juger vite, confirmer le plus digne, visiteur, châtier les faussaires) baissent donc un peu la corruption.
- `stats.js`, `mapend.js`, `logdump.js` : fréquence des événements, carte finale, annales lisibles.
- `banc.json` (banc commun, chronos `renderAll_ms` carte forcée, `renderAll_clic_ms` clic ordinaire, `curie_ms`) · `perf.py sortie.json [ralenti_cpu]` : banc reproductible (téléphone = CPU bridé ×4, Mac). Résultats dans `mesures/`. `chargement_ms` = accueil visible ; la carte se construit ensuite en tâche de fond (`carte_prete_ms`), et `mapPret()` la termine d'office avant toute partie (le moteur a besoin des voisinages).
- `captures.py dossier` + `../outils-communs/compare.py ../references dossier planche.png` : non-régression visuelle (9 vues).
- `monkey.py N [m]` : testeur d'interface au hasard (ordinateur, ou mobile avec `m`).
- `sauvegarde.py`, `modetest.py` : reprise de partie ; mode test + signalement.

## Mesures sur les appareils de Victor
Écran d'accueil → 🧪 Mode test (partie séparée, aucune sauvegarde) ; en jeu ☰ → 🐞 Signaler. Lire avec `db_list` (collection `data/users/<id>`) : `mesures_*`, `signalement_*`.
