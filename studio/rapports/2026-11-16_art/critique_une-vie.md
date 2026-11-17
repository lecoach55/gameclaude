# Une vie parmi 8 milliards — revue de direction artistique (17/11/2026)

Version jugée : `une-vie/build/index.html` construit depuis `main` (850 687 octets, construction OK, aucune erreur JS pendant les captures).
Captures : `/home/claude/art/une-vie/tel_*.png` (390×844, ×2, qualité SD) et `ordi_*.png` (1280×800, qualité HD), vraies polices Fraunces + Inter injectées (Google Fonts est bloqué ici, polices prises dans @fontsource). Script : `/home/claude/art/une-vie/capt.py` (port 8716).
Écrans : accueil, tirage, naissance (fiche), bébé en 3D, enfance (12 ans), événement à choix, choix de priorité, foyers (ville1, maison3, villa4, nuit, deluge, rural0), arbre familial, fin de vie (scène + bilan).
Vitrine : `vitrine.png` (= `ordi_foyer_villa4.png`).

## Verdict d'ensemble
L'interface est le point fort : sombre, chaude, Fraunces + Inter bien dosées, hiérarchie claire, barres fines, journal en frise lisible. Le point faible est la 3D : une « maison de poupée » low-poly aux couleurs franches (herbe vert pomme, carrelage beige uni, voiture-boîte, arbres en boules et cônes, personnages-jouets de ~20 px CSS) qui fait **jeu pour enfants** à côté d'une interface et d'un propos adultes (mortalité infantile, deuil, dettes). Sur ordinateur, la mise en page reste celle du téléphone : la scène occupe 580×460 au centre d'un écran noir.

## Changements classés

### 1. Mise en page ordinateur à deux colonnes + carte d'identité allégée sur téléphone — priorité 1, coût modéré
- Problème : `ordi_foyer_villa4.png`, `ordi_accueil.png`, `ordi_naissance_fiche.png` : colonne de 580 px, ~55 % de l'écran du MacBook vide ; la scène 3D, cœur du jeu, est une vignette. Sur téléphone (`tel_foyer_maison3.png`), la carte d'identité couvre le tiers bas de la scène (≈140 px sur 460) et masque le jardin et souvent un personnage.
- À obtenir : au-delà de ~1000 px de large, scène 3D fixe à gauche sur toute la hauteur (≈ 58 % de la largeur), journal + choix à droite (colonne 440-480 px, défilante), carte d'identité en haut de la colonne droite (et non sur la scène). Accueil ordinateur : carte du monde en grand à gauche, titre + bouton à droite. Téléphone : carte d'identité repliée par défaut en un bandeau d'une ligne (nom, âge, 5 mini-barres) collé au bas de la scène, dépliable au toucher ; la scène gagne ~90 px. Vérifiable : à 1280×800, la scène fait ≥ 700×780 et aucune bande vide > 120 px de part et d'autre.
- Ressources : aucune (CSS `@media (min-width:1000px)` + `resize()` déjà prêt).
- Coût : modéré. Le canevas passe de ~0,27 à ~0,57 Mpx (×2,1 de pixels à remplir). Compenser : en HD sur grand canevas, plafonner `setPixelRatio` à 1,25 (au lieu de 1,6) — à faire valider par le technicien fluidité avec le banc 🧪 du MacBook (Iris Plus).

### 2. Matières réelles dans la maison et le jardin + rendu couleur filmique — priorité 1, coût modéré
- Problème : `tel_foyer_maison3.png`, `tel_bebe3d.png`, `tel_foyer_rural0.png` : sols en aplats (damier beige, carrelage uni), murs en plâtre lisse uniforme, herbe vert saturé sans variation à l'échelle de l'écran, case rurale = boîte marron. Rendu « plastique », sans tonemapping.
- À obtenir : 4 à 6 matières photographiques réduites en 512² (couleur seule, cuite dans la teinte par sommet comme le grain `woodUV` de la v19) : parquet (séjour/chambre aisés), carrelage (cuisine/salle d'eau), plâtre peint (murs intérieurs, légère nuance), terre battue + brique de terre/brique crue (foyer rural, bidonville), herbe tondue désaturée + terre/gravier pour les allées. Ajouter `R.outputEncoding=sRGBEncoding` + `R.toneMapping=ACESFilmicToneMapping` (exposition ≈ 1,0-1,1) et revoir les couleurs à la baisse (−10 à −20 % de saturation). Vérifiable : gros plan `gros_plan.py` à zoom 2 montre des lattes, des joints, un grain de plâtre ; histogramme de l'herbe centré sur une teinte vert-olive (≈ #6f8a4a) et non vert pomme (≈ #7fbf3f).
- Ressources CC0 (vérifiées au catalogue, planches `catalogue_sols_murs.jpg`, `catalogue_sol_ext.jpg`, `catalogue_rural.jpg`) : Poly Haven `wood_floor`, `laminate_floor_03`, `floor_tiles_06`, `painted_plaster_wall`, `white_plaster_02`, `brown_mud_dry`, `red_brick_03`, `concrete_floor_worn_001` ; ambientCG `WoodFloor051`, `Plaster001`, `Grass004` (ou `Grass001`), `Ground037`, `Ground054`, `Bricks060`. Récupération : `outils-communs/phget.py` ; réduction et intégration base64 dans une page unique : `cage-et-gloire/outils/prep_tex.py` + `jeu/build.py` (recadrer plutôt que réduire).
- Coût : modéré. +200 à 300 Ko de page (largement sous 16 Mio), +4 à 6 textures en mémoire GPU (512², ~1 Mo chacune avec mipmaps), aucun appel de dessin si on réutilise la maille fusionnée `VW` et sa variante de shader (Lambert + texture + couleur par sommet) ; le tonemapping est gratuit. Risque : un sampler par matière si on les sépare → préférer un atlas 1024² (4 cases).

### 3. Personnages adultes crédibles (proportions, silhouette, taille à l'écran) — priorité 2, coût modéré
- Problème : `tel_foyer_maison3.png` (gros plan) et `ordi_foyer_villa4.png` : figurines-jouets, tête énorme, membres en blocs, ~20 px CSS de haut ; on ne distingue ni l'âge ni l'humeur, sauf par les bulles emoji.
- À obtenir : proportions adultes (≈ 7 têtes ; enfant 5, bébé 4), épaules et bassin distincts, cou, membres effilés (le `TORSO` en LatheGeometry de la v18 va dans ce sens : l'étendre aux bras/jambes), cheveux en volumes, mains et pieds suggérés ; vieillissement visible (dos voûté, cheveux gris, canne déjà en place ?). Caméra : cadrage par défaut ~15 % plus serré sur la pièce de vie. Vérifiable : à 390 px de large, un adulte mesure ≥ 32 px CSS et l'on distingue homme/femme, enfant/adulte/aîné à l'œil.
- Ressources : option économique = géométrie procédurale améliorée (rien à télécharger) ; option haute = mannequin Xbot de Cage & Gloire (`cage-et-gloire/jeu/xbot.glb`, 623 Ko, Mixamo, régions vêtements/cheveux déjà calculées par `regions()` dans `arene.js`) + 3-4 animations Mixamo (marche, assis, porter un bébé) — crédit Mixamo à ajouter.
- Coût : procédural = négligeable à modéré (+quelques centaines de triangles par personne, toujours fusionnés). Xbot = fort pour cette page (squelettes animés × 4-8 personnages + animaux, +0,7 Mo) : à réserver à la HD et à mesurer.

### 4. Cadre de la scène : socle de maquette, arbres et véhicules — priorité 2, coût négligeable
- Problème : `tel_foyer_ville1.png`, `tel_foyer_deluge.png`, `ordi_foyer_villa4.png` : le terrain coupe brutalement les bords du cadre, pas d'horizon ni de fond ; arbres en sphères/cônes, palmiers en étoile, voiture-boîte : effet « Lego ».
- À obtenir : la parcelle posée sur un socle (tranche de terre de 0,3-0,5 m visible, bords légèrement arrondis) qui se détache sur un fond en dégradé du ciel du moment (reprendre `setSky`), avec un léger brouillard/vignette vers les bords. Arbres : 3-4 imposteurs (plans croisés) pré-rendus d'arbres réels ; voiture avec chanfreins, vitres sombres et roues en retrait. Vérifiable : aucune primitive sphère/cône visible à l'écran ; bords de parcelle lisibles dans toutes les scènes.
- Ressources : imposteurs `bannieres/outils/studio3d/imposteur.py` à partir des arbres Poly Haven `jacaranda_tree` (312 k tri, à pré-rendre seulement), `tree_small_02`, `island_tree_01` (palmier/tropiques), `fir_tree_01` ; plantes en pot `potted_plant_04` (6 k tri, simplifiable via `valdragon/outils/ressources/simp_kit.mjs`).
- Coût : négligeable (quelques quads texturés à la place des sphères ; une texture d'atlas 512² ; le socle = 1 maille).

### 5. Portraits et icônes : sortir du registre « émoji » — priorité 3, coût négligeable
- Problème : `tel_naissance_fiche.png`, `tel_arbre.png`, `tel_bilan.png` : portraits SVG en bonhommes ronds (yeux points, sourire en arc) ; puces d'en-tête et succès en emoji (🎯 ☀️ 🛡️ 👪 🍼 🌍) qui jurent avec Fraunces et changent d'aspect selon l'appareil.
- À obtenir : portraits pré-rendus à partir des personnages 3D du jeu eux-mêmes (cadrage buste, fond uni chaud, lumière de trois-quarts), pour que la fiche, l'arbre et le bilan montrent la même personne que la scène ; icônes d'interface en un seul jeu de pictogrammes au trait (1,5 px, couleur `--acc` ou `--mute`). Garder les drapeaux en emoji (ils sont informatifs). Vérifiable : plus aucun emoji dans `.chips`, `.ico`, `.grid` des succès.
- Ressources : `bannieres/outils/studio/portraits.py` + `pack_portraits.py` (portraits 3D) ; pictogrammes Lucide (licence ISC) ou Tabler (MIT) en SVG en ligne — ce ne sont pas des CC0 : mention de licence en pied de page.
- Coût : négligeable (SVG en ligne, quelques Ko ; portraits = petites images ou rendu unique hors image).

## Ce qui pourrait être commun au studio
- Typographies réellement chargées : Fraunces (titres, récit) + Inter (interface), depuis Google Fonts : hors ligne, la page retombe sur Georgia/system-ui. Proposition commune : intégrer les polices en woff2 sous-ensemble latin dans chaque page (≈ 60-90 Ko par famille, @fontsource), comme les textures.
- Palette : fond #0d0f13, carte #161920, encre #efeae2, accent ambre #e8a35c, gris #958f86, bon #7bc49a / mauvais #e5786a. Très proche des autres jeux sombres du studio : candidate pour un jeu de jetons CSS commun (`outils-communs/`).
- Icônes : emoji partout (+ drapeaux) ; à remplacer par un jeu SVG commun au studio.
- Textures : aucune photo aujourd'hui (grain de bois et herbe procéduraux) ; les matières de Valdragon/Bannières/Cage & Gloire (`prep_tex.py`) sont réutilisables.
- Sons : aucun (pas d'AudioContext) ; les bruitages Kenney du dépôt (`bannieres/jeu/snd`) et la musique générative `sons.js` pourraient accompagner naissance, choix réussi/échec, deuil.
- Lumière/ciel : hémisphère + soleil, ciel CSS selon l'âge/saison : bonne base, à prolonger par le fond de scène (changement 4).

## Question fermée pour Victor
Quel style pour la maison 3D ?
- A. Garder la maison de poupée stylisée actuelle (couleurs franches, formes simples) en la polissant.
- B. **Maquette d'architecte réaliste** : même caméra isométrique et même échelle, mais vraies matières (parquet, plâtre, brique crue), couleurs adoucies, personnages aux proportions adultes, parcelle sur socle. *Recommandé* : colle au propos adulte du jeu, reste léger pour le MacBook.
- C. Photoréalisme complet (modèles Poly Haven, personnages Mixamo animés, éclairage HDRI) : le plus beau en image fixe, mais coût fort sur Iris Plus et téléphone, et page bien plus lourde.

## Non fait / limites
- Pas de mesure de fluidité (machine sans GPU, revues parallèles) : les coûts sont estimés, à confirmer par le technicien fluidité.
- Aperçus des modèles Poly Haven indisponibles (cdn.polyhaven.com bloqué) : seuls les noms et nombres de triangles ont été vérifiés.
- `outils-communs/catalogue.py` plante sur certaines réponses d'ambientCG (`downloadFolders`/`previewImage` renvoyés en liste au lieu d'objet → `AttributeError`) ; contourné par une copie corrigée dans le dossier temporaire, dépôt non modifié.
- Les scènes forcées `villa4` / `deluge` en mode téléphone n'ont pas toujours montré piscine / eau (changement de foyer en fondu) ; les références du dépôt les montrent bien.
