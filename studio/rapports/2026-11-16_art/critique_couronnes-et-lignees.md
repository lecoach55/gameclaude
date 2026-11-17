# Couronnes & Lignées — revue artistique du 16-17/11/2026

Construction : `python3 build.py` OK (index.html 3,9 Mo). Captures : `outils/mesure/captures.py` adapté (taille d'écran en paramètre), 16 vues × téléphone 390×844 / ordinateur 1280×800 × 3D (par défaut) / 2D, plus des vues rapprochées de la carte. Aucune erreur JS.
Comparaison 2D avec `references/` : 0 alerte / 16 (pas de régression). **`references/3d/` n'existe pas dans le dépôt** (annoncé dans CLAUDE.md et README) : aucune comparaison 3D possible.

Fichiers : `tel_<ecran>.png`, `ordi_<ecran>.png` (3D), `*_2d.png` (carte dessinée), `tel_plateau_zoom*.png`, `ordi_plateau_zoom*.png`, `vitrine.png`, planches catalogue `catalogue_*.jpg`, `ressource_imposteurs_bannieres.jpg`.

## Verdict d'ensemble : ORANGE
L'interface (vélin, lapis, or, Alegreya + Unifraktur, blasons) est cohérente et soignée : c'est le point fort. La 3D, en revanche, n'est pas encore au niveau de la 2D qu'elle remplace par défaut : la carte dessinée est plus lisible et plus belle que la carte en relief (comparer `tel_plateau.png` / `tel_plateau_2d.png`, `ordi_plateau_zoom.png` / `ordi_plateau_zoom2d.png`). Les scènes pré-rendues ont des personnages-quilles qui font « jouet ».

## Changements classés

### 1. Carte 3D : peindre les territoires DANS le terrain, pas par-dessus (priorité 1, coût négligeable)
- Problème : `ordi_plateau_zoom.png`, `vitrine.png`, `tel_edifices.png`. La couche SVG pose un voile rouge (`fill-opacity .26` pour vos terres, `.45` + hachures pour le rival, app.js l. 975) AU-DESSUS du canevas 3D : vos propres châteaux, la capitale, les 7 édifices et la cathédrale paraissent délavés, presque transparents, alors que les châteaux voisins (sans voile) sont nets. Le terrain herbe/forêt devient une boue brun-orange uniforme.
- À obtenir : aucun aplat SVG sur la carte 3D ; la couleur de maison mélangée au terrain dans le shader (attribut de sommet « propriétaire », 15-20 % de teinte, déjà le mécanisme `splat`), recalculée quand les propriétaires changent (comme `buildSettlements`). Garder en SVG seulement les frontières, mais plus fines (1,2 au lieu de ~2,5) avec un liseré intérieur clair aux couleurs de la maison (style carte de campagne Total War / Crusader Kings III). Vérifiable : sur `ordi_plateau_zoom`, la capitale aussi contrastée que Malestroit ; l'herbe reste verte dans vos terres.
- Ressources : aucune (code). Coût : négligeable (un attribut de plus, rien par image).

### 2. Personnages des scènes pré-rendues : remplacer les quilles par des figures humaines (priorité 1, coût nul en jeu, ~+200-400 Ko)
- Problème : `tel_evenement_scene_zoom.png`, `references/planche_scenes3d.png` (tournoi, foire, noces, couronnement, port, village). Spectateurs = quilles colorées, cheval du tournoi = jouet blanc, chevalier rouge = tonneau. C'est exactement « enfantin » ; les décors (pierre, tuiles) sont corrects, les figures ruinent l'image. La bataille passe parce qu'elle est à contre-jour (`tel_bataille.png`).
- À obtenir : figures humaines à proportions réelles (1/7,5 tête), vêtements longs, poses variées (debout, bras levés, assis), chevaux réalistes. Silhouettes lisibles à 720×300. Vérifiable : plus aucune primitive capsule/cône visible sur la planche.
- Ressources : déjà dans le dépôt — chaîne de Bannières `bannieres/outils/studio/portraits.py` (modèles Valdragon Mixamo : `cavalier`, `h_chevalier`, `croise`, `piquier`, `archer`, `moine`, `h_clerc`), à poser dans l'atelier `outils/atelier3d/scenes3d.js` ; chevaux du `cavalier`. Crédit Mixamo à ajouter dans ☰ Crédits.
- Coût : nul pour la fluidité (images pré-rendues) ; poids de page modéré.

### 3. Arbres de la carte : imposteurs Poly Haven au lieu d'icosaèdres facettés (priorité 2, coût modéré)
- Problème : `ordi_edifices.png`, `ordi_plateau_zoom.png` : feuillus = boules à facettes, résineux = cônes à 7 pans. C'est le côté « carré » low-poly, en contradiction avec un terrain photographique.
- À obtenir : arbres en sprites pré-rendus (vue cavalière, éclairés comme la carte), 3 feuillus + 2 sapins, ombre portée douce sous chacun ; densité inchangée.
- Ressources : déjà faites dans Bannières — `bannieres/jeu/imp/feuillu_a/b_h.webp`, `sapin_a/b/c_*.webp` (Poly Haven `island_tree_01/02`, `fir_tree_01`, CC0), outil `bannieres/outils/studio3d/imposteur.py` pour les rendre sous l'angle cavalier. Alternative catalogue : `tree_small_02`, `fir_sapling_medium` (planche `catalogue_arbres.jpg`).
- Coût : modéré — quads instanciés en alpha-test (pas de transparence triée) : ~même nombre d'appels, un peu de remplissage en plus ; garder 28/45/70 arbres selon la qualité. À mesurer avec `perf.py` (glisse ≥ 55 img/s à CPU ×4).

### 4. Cadrage ordinateur et bord de mer (priorité 2, coût négligeable)
- Problème : `ordi_plateau.png` : l'île occupe un tiers de l'écran, entourée de vide bleu ; **le plan d'eau 3D est un rectangle dont les bords se voient** (bande plus claire de x≈365 à 920) ; jauges Stabilité/Menace étirées sur 670 px ; côte sans sable ni écume (trait brun SVG). `ordi_edifices.png`, `tel_edifices.png`, `vitrine.png` : la carte « objectif » (Atteindre 65 de prestige / Posséder 7 terres) recouvre la jauge Menace (2D et 3D).
- À obtenir : plan d'eau qui déborde largement le cadre (ou fond de page = couleur de la mer, avec un léger dégradé vers le large) ; `fitView` qui remplit ~80 % de la hauteur sur grand écran ; jauges limitées à ~280 px ; bande de sable/galets de 2-4 unités le long de la côte (mélange par hauteur dans le shader) et liseré d'écume ; carte objectif sous les jauges, jamais dessus.
- Ressources : `coast_sand_01` ou `coast_sand_rocks_02` (Poly Haven, CC0, planche `catalogue_cotes.jpg`), 256 px suffisent ; `jeu/tex3d/sable.jpg` existe déjà.
- Coût : négligeable (une texture 256 px de plus dans le mélange, une mise en page CSS).

### 5. Écran titre net et à la bonne échelle (priorité 2, coût nul)
- Problème : `ordi_titre.png`, `tel_titre.png` : image 600×600 agrandie à 1280 px (et 780 px en ×2) → floue, pixels visibles ; pierre à l'échelle fausse (moellons grands comme des portes), toits en cônes lisses, ciel peint flou. Première image vue par Victor.
- À obtenir : deux rendus (1600×1000 paysage, 900×1600 portrait), échelle de texture ×3-4 sur les murs, toits en ardoise texturée, ciel HDRI au crépuscule, légère brume de sol ; poids WebP ≤ 250 Ko chacun.
- Ressources : murs `castle_wall_slates` ou `medieval_blocks_03` (Poly Haven), ciel `belfast_sunset_puresky` ou `kloofendal_48d_partly_cloudy_puresky` (HDRI Poly Haven, planche `catalogue_ciel.jpg`), via `phget.py` ; atelier `outils/atelier3d/rendre.py`.
- Coût : nul (image fixe).

### Hors classement (connu, à garder en tête)
- Portraits 3D (`tel_cour_portraits_zoom.png`) : bonne idée, mais une seule tête scannée : Jeanne et Blanche sont des hommes voilés ; tous portent la même tunique rouge ; la couronne ressemble à un casque. Piste déjà notée dans PLAN_3D : tête féminine libre. Les petits pictos d'unités (chevalier/archer/piétaille) restent dessinés à plat au milieu de scènes 3D.

## Commun au studio
- Polices réellement chargées (woff2 intégrées dans `fonts.css`) : UnifrakturMaguntia (titres), Alegreya (texte), Alegreya SC (petites capitales). Bon trio « médiéval sérieux », réutilisable pour Sedes Petri, Bannières, Trône de Braise.
- Palette : lapis `#1c2f5e` / `#132246`, or `#c79b3d` (clair `#e8c15a`), vélin `#ecdfc0`, encre `#2b2016`, vermillon `#a8321f`, vert `#2f6b55`.
- Icônes : SVG procéduraux (`art.js` : blasons, portraits, pictos) ; quelques emoji dans les menus (🧪, 🐞, ☰). Sons : synthèse WebAudio (oscillateurs), aucun fichier.
- Textures : Poly Haven 256-512 px dans `tex3d.js` (mêmes familles que Bannières : planches, pierre, tuiles, chaume) ; un paquet commun « médiéval » dans `outils-communs/` éviterait les doublons. Lumière selon l'âge (3 ambiances) : idée à partager.

## Question pour Victor
Carte par défaut tant que les changements 1 et 3 ne sont pas faits :
(A) 3D en relief (actuel) ; (B) carte dessinée 2D par défaut, 3D au choix dans ☰ ; (C) 2D sur téléphone et Mac Intel, 3D sur grand écran puissant.
Recommandation : **B** maintenant (la 2D est aujourd'hui plus belle et plus lisible), puis **A** dès que les territoires sont peints dans le terrain et les arbres remplacés. Les scènes et portraits 3D peuvent rester.

## Non fait / limites
- `references/3d/` absent : pas de comparaison 3D automatique.
- Captures en rendu logiciel (SwiftShader) : ombres et fluidité réelles non jugées.
- La vue « edifices » de `captures.py` est très rapprochée sur ordinateur (fenêtre de 150 unités pour 1280 px) : étiquettes et pions démesurés, ce n'est pas un défaut du jeu à ce niveau de zoom, mais l'outil devrait adapter la fenêtre à la largeur.
