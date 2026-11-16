# Bannières & Sortilèges

Jeu de stratégie au tour par tour façon *Heroes of Might and Magic* : carte d'aventure, héros, villes à bâtir, créatures sur 7 niveaux, combats tactiques sur grille hexagonale, sorts, IA rivales. **Chaque partie se joue sur une carte générée au hasard** (taille, eau, monstres, 2 à 4 royaumes, graine rejouable).
Artefact publié : slug `c14c3c85-7570-4c24-845c-42239cee0f6a` (capacités db + user). Une seule page, sans dépendance, jouable hors ligne : `build/bannieres.html`.
Graphismes dessinés par le code (inspirés des captures fournies par Victor, sans les reproduire), plus des ressources reprises de Valdragon :
portraits des héros rendus en 3D (personnages Mixamo), bruitages Kenney (CC0), textures Poly Haven (CC0) pour le bois de l'interface et la pierre des murs.

## Code (`jeu/`)
`data.js` (4 factions — Bastion, Sylve, Nécropole, Horde — × 7 créatures, chacune avec sa version améliorée, + neutres, bâtiments, sorts, compétences, artefacts) · `carte.js` (générateur : zones Voronoï déformées, terrains, lacs, murs de relief, passages gardés, routes A*, mines/trésors/lieux, connexité) · `regles.js` (aventure, économie, héros, sauvegarde) · `combat.js` (combat hexagonal 15×11 + IA de combat) · `ia.js` (IA des royaumes, prédiction des combats par simulation) — ces 5 fichiers tournent sous Node.
`sprites.js` (créatures, héros, portraits, icônes) · `decor.js` (sol peint au pixel, forêts, montagnes, villes, mines, panoramas, champs de bataille) · `rendu.js` (carte 2D, brouillard, mini-carte, commandes tactiles) · `rendu3d.js` (carte, combats et villes en 3D) · `combat_ui.js` (combat ; tourné en portrait sur téléphone) · `ville_ui.js` · `ui.js` · `sons.js` · `nuage.js` (sauvegarde en ligne `partie`, gzip) · `testkit.js`.
Construire : `python3 jeu/build.py` → `build/bannieres.html`, à publier en `index.html` (publish_files). Graine fixe : `index.html?graine=7&taille=54`.
Sauvegarde locale `bannieres-v1` (ne pas changer la clé) + document en ligne `partie` (ne jamais le modifier).

## Outils (`outils/`)
- `sim_factions.js nbGraines [jours]` : équilibre des factions (chaque paire dans les deux sens). Repère 16/11/2026 (4 factions, 72 parties, 18 nulles) : Bastion 31 %, Sylve 36 %, Nécropole 53 %, Horde 31 % (équilibre parfait ≈ 37 %). `duel_factions.js` : duels d'armées à croissance égale.
- `sim_partie.js N taille joueurs jours` : parties complètes entre IA (repère 15/11/2026, petite carte 2 royaumes : victoire en 26–70 jours).
- `parcours.py jours [l h] [captures]` : le joueur humain est joué par le robot à travers la vraie interface (fenêtres, villes, combats), puis sauvegarde → aller-retour identique → rechargement « Continuer ».
- `scen.py` : siège d'une ville humaine par l'IA (combat interactif en défense), victoire.
- `fumee.py`, `capt.py dossier [l h]` (vues fixes, références dans `references/`, à comparer avec `outils-communs/compare.py`), `perf.py` (référence `mesures/perf_base.json`), `hors_ligne.py`.

## Studio 3D (`outils/studio/`)
Réutilise le dossier préparé de Valdragon (`sh valdragon/outils/preparer.sh /home/claude/t3d`) :
- `portraits.py dossier` : portraits des héros (une variante par nom, genre respecté), puis conversion en `jeu/portraits3d.js` (voir l'historique git du 16/11/2026).
- `studio.py dossier [ids]` + `pack.py` + `planche.py` : créatures pré-rendues en 3D (repos, attaque, blessure, mort). Écartés le 16/11 au matin, **repris le soir même** pour le passage au réalisme (humanoïdes et dragons seulement, voir plus haut). Les quadrupèdes construits par le code font toujours « jouets ».

## Graphismes 3D (16/11/2026) — `jeu/rendu3d.js` + `jeu/lib/three.js`
Three.js r160 (global `THREE`, avec RoomEnvironment) intégré à la page. Menu ☰ → « 🧊 Carte en 3D » (oui par défaut, mémorisé dans `bs-3d`) ; repli automatique sur l'ancien rendu 2D si WebGL manque.
- **Carte** : relief (sol peint `V.sol` posé sur un maillage), eau, montagnes enneigées, forêts et rochers instanciés par blocs de 9×9 cases (élagage), villes/mines/lieux construits en 3D par faction, créatures et héros en panneaux penchés (les dessins existants), brouillard injecté dans les shaders (`brume`). Le canevas 2D `#carte` reste au-dessus, transparent : il reçoit toujours les commandes ; `caseSous`, `centrer`, `zoomer`, glisser et mini-carte passent par `R3` quand `en3D()`.
- **Combat** : décor rendu **une seule fois** par combat (sol, lisière, montagnes, ville assiégée, obstacles détourés pour cacher les créatures derrière eux) ; `centreHex` = vraie projection de la caméra (`R3.camCombat`, orthographique en portrait). Les créatures restent dessinées.
- **Ville** : panorama 3D (`R3.panoVille`) rendu à chaque construction, mêmes zones cliquables, créatures devant leurs habitations.
- Qualité : 2 = ombres, 1 = sans ombres, 0 = image allégée ; baisse automatique si la médiane dépasse 27 ms par image (mémorisée dans `bs-q3d`). Paramètres de test : `?v3d=0` (2D), `?q3d=2` (qualité imposée).
- Mesures en rendu logiciel (`mesures/perf_3d_logiciel.json` vs `perf_2d_logiciel.json`) : la carte 3D y tombe à ~1 img/s, ce qui ne dit rien d'un vrai GPU ; juger avec le banc 🧪 sur les appareils de Victor. Les tests (`parcours`, `monkey`) sont donc plus lents en 3D ; `monkey.py` accepte `V3D=0` et `Q3D=0`.
- Avant/après : `mesures/avant_apres_3d.png`.

## Réalisme (16/11/2026, 2e passe) — ressources Poly Haven (CC0) et Mixamo
- `outils/ressources/ph_dl.py` télécharge textures et modèles Poly Haven (bruts dans `/home/claude/ph`, hors dépôt) ; `tex3d.py` en tire `jeu/tex3d/*.jpg` (512 px, teintes réglées : sols, roches, neige, murs, ardoises, tuiles, chaume, bois).
- `outils/studio3d/imposteur.py` (+ `imposteur.html`, liste `imposteurs.json`) rend les arbres et rochers Poly Haven (sapin, olivier, arbustes, arbres du désert, buisson, rochers moussus) en images détourées sous deux angles : `h` (carte/combat, 52°) et `b` (ville, 8°) → `jeu/imp/*.webp` + `imp.json` (pied, échelle).
- Carte : sol mélangé par case dans le shader (`matSol` : texture tableau, bords irréguliers, routes et rivières d'après un masque, lueur de la lave), forêts en imposteurs instanciés avec ombres, montagnes à crêtes en texture de roche triplanaire et neige selon la pente, eau à vagues animées, éclairage par un ciel (`envCiel`). Bâtiments en matières triplanaires (`PM`, `PT`, `PB`…).
- Combat et ville : mêmes sols, arbres et rochers ; ville : nuages et montagnes adoucis.
- Créatures : humanoïdes et dragons pré-rendus en 3D par `outils/studio` (modèles Mixamo de Valdragon, dragon « Drago » CC BY 4.0) → `jeu/sprites3d.js` (`pack.py` : couleurs relevées). Les créatures sans modèle réaliste (griffon, cavaliers, centaure, pégase, licorne, tréant, loups, roc, béhémoth) restent dessinées, avec contours fins et grain de matière (`LWK`, `eclairage`) ; les quadrupèdes construits par le code restent écartés (aspect « jouet »).
- Page : ~5,3 Mo. Crédits affichés sur l'accueil.

## Contenu ajouté la nuit du 15 au 16/11/2026
Horde (4e faction, portraits Warrok), 28 créatures améliorées (habitations améliorées, amélioration des troupes en ville), le Graal (obélisques, carte au trésor, merveille ; option de victoire), sorts d'aventure (Vision lointaine, Portail de ville), semaine de la créature, créatures qui proposent de rejoindre le héros, combat rapide contre les proies faciles, perspective et cadavres en combat, effets d'éclair et de boule de feu, rivières, musique générative et bruitages repris de Valdragon.

## Équilibre
Trêve des rivaux envers le joueur humain : jour 29 (paisibles), 15 (ambitieux), aucune (impitoyables). Ne pas changer la difficulté sans demander à Victor.

## Mesures sur les appareils de Victor
Accueil → 🧪 Mode test → ☰ → ▶ Banc ; ☰ → 🐞 Signaler. Lire avec `db_whoami` + `db_list` (`data/users/<id>`) : `mesures_*`, `signalement_*`.
