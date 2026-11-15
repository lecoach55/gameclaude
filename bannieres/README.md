# Bannières & Sortilèges

Jeu de stratégie au tour par tour façon *Heroes of Might and Magic* : carte d'aventure, héros, villes à bâtir, créatures sur 7 niveaux, combats tactiques sur grille hexagonale, sorts, IA rivales. **Chaque partie se joue sur une carte générée au hasard** (taille, eau, monstres, 2 à 4 royaumes, graine rejouable).
Artefact publié : slug `c14c3c85-7570-4c24-845c-42239cee0f6a` (capacités db + user). Une seule page, sans dépendance, jouable hors ligne : `build/bannieres.html`.
Graphismes dessinés par le code (inspirés des captures fournies par Victor, sans les reproduire), plus des ressources reprises de Valdragon :
portraits des héros rendus en 3D (personnages Mixamo), bruitages Kenney (CC0), textures Poly Haven (CC0) pour le bois de l'interface et la pierre des murs.

## Code (`jeu/`)
`data.js` (4 factions — Bastion, Sylve, Nécropole, Horde — × 7 créatures, chacune avec sa version améliorée, + neutres, bâtiments, sorts, compétences, artefacts) · `carte.js` (générateur : zones Voronoï déformées, terrains, lacs, murs de relief, passages gardés, routes A*, mines/trésors/lieux, connexité) · `regles.js` (aventure, économie, héros, sauvegarde) · `combat.js` (combat hexagonal 15×11 + IA de combat) · `ia.js` (IA des royaumes, prédiction des combats par simulation) — ces 5 fichiers tournent sous Node.
`sprites.js` (créatures, héros, portraits, icônes) · `decor.js` (sol peint au pixel, forêts, montagnes, villes, mines, panoramas, champs de bataille) · `rendu.js` (carte, brouillard, mini-carte, commandes tactiles) · `combat_ui.js` (combat ; tourné en portrait sur téléphone) · `ville_ui.js` · `ui.js` · `sons.js` · `nuage.js` (sauvegarde en ligne `partie`, gzip) · `testkit.js`.
Construire : `python3 jeu/build.py` → `build/bannieres.html`, à publier en `index.html` (publish_files). Graine fixe : `index.html?graine=7&taille=54`.
Sauvegarde locale `bannieres-v1` (ne pas changer la clé) + document en ligne `partie` (ne jamais le modifier).

## Outils (`outils/`)
- `sim_factions.js nbGraines [jours]` : équilibre des factions (chaque paire dans les deux sens). Repère 16/11/2026 (3 factions, 30 parties) : 50 / 50 / 45 %.
- `sim_partie.js N taille joueurs jours` : parties complètes entre IA (repère 15/11/2026, petite carte 2 royaumes : victoire en 26–70 jours).
- `parcours.py jours [l h] [captures]` : le joueur humain est joué par le robot à travers la vraie interface (fenêtres, villes, combats), puis sauvegarde → aller-retour identique → rechargement « Continuer ».
- `scen.py` : siège d'une ville humaine par l'IA (combat interactif en défense), victoire.
- `fumee.py`, `capt.py dossier [l h]` (vues fixes, références dans `references/`, à comparer avec `outils-communs/compare.py`), `perf.py` (référence `mesures/perf_base.json`), `hors_ligne.py`.

## Studio 3D (`outils/studio/`)
Réutilise le dossier préparé de Valdragon (`sh valdragon/outils/preparer.sh /home/claude/t3d`) :
- `portraits.py dossier` : portraits des héros (une variante par nom, genre respecté), puis conversion en `jeu/portraits3d.js` (voir l'historique git du 16/11/2026).
- `studio.py dossier [ids]` + `pack.py` + `planche.py` : créatures pré-rendues en 3D (repos, attaque, blessure, mort). **Essai écarté le 16/11/2026** : à la taille d'un combat, les modèles réalistes sombres se lisaient moins bien que les créatures dessinées et juraient avec elles ; les quadrupèdes construits par le code faisaient « jouets ». Le moteur sait encore les afficher (`SPR3D`, `dessiner3D`) si l'on veut y revenir.

## Contenu ajouté la nuit du 15 au 16/11/2026
Horde (4e faction, portraits Warrok), 28 créatures améliorées (habitations améliorées, amélioration des troupes en ville), le Graal (obélisques, carte au trésor, merveille ; option de victoire), sorts d'aventure (Vision lointaine, Portail de ville), semaine de la créature, créatures qui proposent de rejoindre le héros, combat rapide contre les proies faciles, perspective et cadavres en combat, effets d'éclair et de boule de feu, rivières, musique générative et bruitages repris de Valdragon.

## Équilibre
Trêve des rivaux envers le joueur humain : jour 29 (paisibles), 15 (ambitieux), aucune (impitoyables). Ne pas changer la difficulté sans demander à Victor.

## Mesures sur les appareils de Victor
Accueil → 🧪 Mode test → ☰ → ▶ Banc ; ☰ → 🐞 Signaler. Lire avec `db_whoami` + `db_list` (`data/users/<id>`) : `mesures_*`, `signalement_*`.
