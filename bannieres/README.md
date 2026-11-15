# Bannières & Sortilèges

Jeu de stratégie au tour par tour façon *Heroes of Might and Magic* : carte d'aventure, héros, villes à bâtir, créatures sur 7 niveaux, combats tactiques sur grille hexagonale, sorts, IA rivales. **Chaque partie se joue sur une carte générée au hasard** (taille, eau, monstres, 2 à 4 royaumes, graine rejouable).
Artefact publié : slug `c14c3c85-7570-4c24-845c-42239cee0f6a` (capacités db + user). Une seule page, sans dépendance, jouable hors ligne : `build/bannieres.html`.
Graphismes entièrement dessinés par le code (inspirés des captures fournies par Victor, sans les reproduire).

## Code (`jeu/`)
`data.js` (3 factions × 7 créatures + neutres, bâtiments, sorts, compétences, artefacts) · `carte.js` (générateur : zones Voronoï déformées, terrains, lacs, murs de relief, passages gardés, routes A*, mines/trésors/lieux, connexité) · `regles.js` (aventure, économie, héros, sauvegarde) · `combat.js` (combat hexagonal 15×11 + IA de combat) · `ia.js` (IA des royaumes, prédiction des combats par simulation) — ces 5 fichiers tournent sous Node.
`sprites.js` (créatures, héros, portraits, icônes) · `decor.js` (sol peint au pixel, forêts, montagnes, villes, mines, panoramas, champs de bataille) · `rendu.js` (carte, brouillard, mini-carte, commandes tactiles) · `combat_ui.js` (combat ; tourné en portrait sur téléphone) · `ville_ui.js` · `ui.js` · `sons.js` · `nuage.js` (sauvegarde en ligne `partie`, gzip) · `testkit.js`.
Construire : `python3 jeu/build.py` → `build/bannieres.html`, à publier en `index.html` (publish_files). Graine fixe : `index.html?graine=7&taille=54`.
Sauvegarde locale `bannieres-v1` (ne pas changer la clé) + document en ligne `partie` (ne jamais le modifier).

## Outils (`outils/`)
- `sim_partie.js N taille joueurs jours` : parties complètes entre IA (repère 15/11/2026, petite carte 2 royaumes : victoire en 26–70 jours).
- `parcours.py jours [l h] [captures]` : le joueur humain est joué par le robot à travers la vraie interface (fenêtres, villes, combats), puis sauvegarde → aller-retour identique → rechargement « Continuer ».
- `scen.py` : siège d'une ville humaine par l'IA (combat interactif en défense), victoire.
- `fumee.py`, `capt.py dossier [l h]` (vues fixes, références dans `references/`, à comparer avec `outils-communs/compare.py`), `perf.py` (référence `mesures/perf_base.json`), `hors_ligne.py`.

## Équilibre
Trêve des rivaux envers le joueur humain : jour 29 (paisibles), 15 (ambitieux), aucune (impitoyables). Ne pas changer la difficulté sans demander à Victor.

## Mesures sur les appareils de Victor
Accueil → 🧪 Mode test → ☰ → ▶ Banc ; ☰ → 🐞 Signaler. Lire avec `db_whoami` + `db_list` (`data/users/<id>`) : `mesures_*`, `signalement_*`.
