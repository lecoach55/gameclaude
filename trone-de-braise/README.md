# Le Trône de Braise

Le « jeu ultime » de Victor : un action-RPG façon Diablo (donjons en temps réel, butin, boss) imbriqué dans un jeu de royaume (carte de 20 provinces, 6 maisons rivales, batailles aux dés façon Risk, diplomatie, complots, dynastie avec héritiers, événements variés).
Artefact publié : slug `ad95fb12-6952-4fbd-8b8b-ff66978db6c6` (capacités db + user). Une seule page, sans dépendance, jouable hors ligne : `build/trone-de-braise.html` (double-clic sur Mac).

## Code (`jeu/`)
`data.js` (maisons, provinces, monstres, classes, objets) · `objets.js` (butin, statistiques du héros) · `monde.js` (géographie déterministe) · `donjon.js` (génération, combat, IA, boss, robot joueur — sans DOM, testable sous Node) · `royaume.js` (saisons, économie, guerres, IA des maisons, dynastie — sans DOM) · `evenements.js` (~35 événements) · `rendu.js` (donjons en Canvas 2D, lumière, personnages) · `carte.js` (carte du royaume, blasons) · `sons.js` (sons et musique synthétisés) · `nuage.js` (sauvegarde en ligne `partie`) · `ui.js` · `testkit.js`.
Construire : `python3 jeu/build.py` → `build/trone-de-braise.html`, à publier en `index.html` (publish_files).
Graine fixe : `index.html?graine=7`. Sauvegarde locale `tdb-v1` (ne pas changer la clé) + document en ligne `partie` (ne jamais le modifier).

## Outils (`outils/`)
- `sim_donjon.js classe nivHeros nivDonjon N [depart|magique]` : expéditions jouées par le robot. Repères 15/11/2026 : départ niveau 1 → 33 à 83 % de réussite selon la classe ; équipement magique au même niveau → 60 à 100 %.
- `sim_royaume.js N saisons` : parties complètes du royaume. Repère : robot naïf couronné dans ~57 % des parties en ~54 saisons, ~10 % de défaites.
- `fumee.py dossier` : parcours complet avec captures. `parcours.py` : non-régression (événement-combat, charge du champion, mort réelle + succession, reprise de sauvegarde, 10 saisons).
- `perf.py sortie.json [ralenti_cpu]` : banc reproductible (carte, combat, boss). Référence : `mesures/perf_base.json`.

## Équilibre
Ne pas toucher à la difficulté des combats ni au retour des monstres dans les donjons (« le mal revient ») sans le demander à Victor ; vérifier avec les deux simulateurs.

## Mesures sur les appareils de Victor
Écran titre → 🧪 Mode test (rien n’est sauvegardé) → ☰ → ▶ Banc. En jeu : ☰ ou Échap → 🐞 Signaler. Lire avec `db_whoami` + `db_list` (collection `data/users/<id>`) : `mesures_*`, `signalement_*`.
