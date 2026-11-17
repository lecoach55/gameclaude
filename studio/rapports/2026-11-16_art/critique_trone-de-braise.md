# Le Trône de Braise — revue artistique (17/11/2026)

Construction : `donjon3d/build.py` (12,9 Mio) et `jeu/build.py` (564 Kio) réussis dans une copie de travail (`/home/claude/art/tdb-work/g`, node_modules de cage-et-gloire, three 0.160.1). Dépôt non modifié.
Captures : `fumee.py` (port 8717) + script maison `/home/claude/art/tdb-work/scenes.py` (combat 2D forcé : 7 monstres autour du héros, Roi-Liche + serviteurs) + `vues3d.py` (crypte en 1280×800, antre en 390×844).
Toutes les images sont dans `/home/claude/art/trone-de-braise/` (`ordi_*`, `tel_*`, `vitrine.png` = combat 3D dans la crypte).

## Verdict d'ensemble
Deux jeux dans un : le **royaume** a une vraie direction (« table de guerre à la chandelle », nuit/lapis/or, Grenze Gotisch) propre et lisible ; le **donjon 3D** est réaliste (Mixamo, pierre Poly Haven, torches, étalonnage braise) et c'est ce qui se rapproche le plus de Diablo. Le **donjon 2D** détonne : personnages vectoriels « chibi » (chevalier à cape orange, goules vert pomme, golem en blocs), sol en carreaux unis, c'est exactement le « carré/enfantin » que Victor refuse. L'interface utilise massivement des emoji (⛑️ casque de secouriste à croix rouge, 🧪 éprouvette pour la potion, 👑 visage-emoji pour le souverain), qui cassent le sérieux médiéval.

## Changements classés

### 1. Gardiens et monstres du donjon 3D : des silhouettes crédibles et variées — priorité 1
- Captures : `ordi_donjon3d_gardien.png` (le Roi-Liche est un grand cultiste torse nu teinté bleu, sans couronne ni robe, debout bras ballants : on lit « catcheur pâle », pas « roi mort »), `ordi_donjon3d_combat.png` (crypte : 4 ennemis = la même armure noire, aucun mort-vivant alors que la crypte 2D a squelettes, archers, spectres), `ordi_donjon3d_combat.png` également : le panneau d'action couvre la moitié basse du groupe.
- À obtenir : (a) dans la crypte et les catacombes, au moins 2 silhouettes distinctes de morts-vivants (squelette os apparents, spectre translucide) ; (b) Roi-Liche : robe longue sombre déchirée, couronne, crâne/visage décharné, lueur froide aux yeux et aux mains, pose voûtée de lanceur de sorts (animation « cast » déjà utilisée par Bannières) ; (c) caméra de combat remontée ou panneau d'action replié pour que les pieds du groupe restent visibles (aucun héros coupé par l'interface à 1280×800). Vérifiable par `vues3d.py dossier crypte,catacombes` + gros plan.
- Ressources : **KayKit Character Pack : Skeletons** (Kay Lousberg, CC0 ; squelettes guerrier/mage/sbire déjà riggés, même famille que les décors KayKit déjà crédités — à télécharger hors de cette machine, itch.io) ; à défaut, le traitement « squelette » de Bannières (`bannieres/outils/studio/studio.js`, recoloration `hx_aldric` + yeux lumineux) et « liche » (`hx_cult` + bâton `skstaff`, yeux `0x7cf7a2`) à reprendre dans `g3d.js` ; couronne : maillage simple + matière or de `weapons.glb`. Spectre : matériau additif bleuté sur `hx_cult` (déjà fait pour le givre du Roi-Liche).
- Coût : **modéré** — un modèle KayKit low-poly (~1-2 k triangles) avec instanciation n'ajoute pas d'appels si les squelettes partagent un matériau ; un spectre transparent ajoute un tri et du remplissage (à surveiller sur Iris Plus). Poids : +0,5-1 Mio (la page 3D est à 12,9 Mio, limite 16 Mio).

### 2. Donjon 2D : personnages pré-rendus en 3D et sol en vraie pierre — priorité 2 (1 si le 2D reste un mode joué)
- Captures : `ordi_combat.png`, `ordi_boss.png`, `tel_combat.png`, `ordi_creation.png` (même chevalier-jouet sur la création de lignée).
- À obtenir : héros, monstres et boss en sprites pré-rendus (vue plongeante ~55°, 8 directions × repos/marche/attaque/mort), éclairés de 3/4 haut, ombre portée douce ; sol et murs en photo de pierre (joints irréguliers, salissure, mousse) mélangée à la teinte du type de donjon, plus aucune case unie visible. Critère : à 1280×800, aucun aplat > 40 px de couleur uniforme sur le sol éclairé ; personnages sans contour vectoriel.
- Ressources : sol et murs **déjà dans le dépôt** : `valdragon/jeu/tex/crypt_f_d.jpg`, `crypt_w_d.jpg`, `cav_*`, `forge_*`, `frost_*`, `wood_d.jpg` (Poly Haven CC0) — à cuire une fois dans `A.sol` (le pré-rendu existant de `rendu.js`) ; alternatives repérées par le catalogue : `monastery_stone_floor`, `cobblestone_floor_08`, `castle_wall_slates`, `rough_block_wall`, ambientCG `PavingStones150` (`catalogue_sol.jpg`). Personnages : chaîne de Bannières `bannieres/outils/studio` (`studio.py` + `pack.py` → atlas webp ; sprites existants `squelette`, `liche`, `spectre`, `ogre`, `zombie`, `troll`, `gobelin`, `archer`, `croise`, `h_chevalier`, `h_rodeur`, `h_necromancien`, `loup`, `wyverne`) à re-rendre en vue plongeante et 8 directions ; araignée : `valdragon/jeu/mq/spider.glb`.
- Coût : **négligeable à l'image** (le donjon met déjà corps et décors en cache, 8 directions × 4 poses : on remplace la source du cache) ; le sol cuit une fois ne change rien au remplissage. Poids **modéré** : +1,5 à 2,5 Mio de webp (page 2D à 564 Kio, très loin de la limite) et +0,2 s de décodage à l'entrée (à mesurer : l'à-coup d'entrée de 0,7 s est déjà signalé).

### 3. Icônes : remplacer les emoji par un jeu d'icônes gravées monochromes — priorité 2
- Captures : `ordi_sac.png` / `tel_sac.png` (⛑️ casque de secouriste, 🔨, 🧪), `ordi_dynastie.png` (souverain = emoji 👑 jaune), `ordi_diplomatie.png` (🎁🤝💍⚔️🪙🕯️ multicolores sur chaque bouton), dock du royaume (`ordi_royaume.png`), barre de compétences du donjon (🌀💨📯⚡).
- À obtenir : un seul style d'icône, trait gravé or `#d9ae4f` / vélin `#ece2c9` sur fond nuit, même épaisseur, rendu identique sur Mac et iPhone (les emoji changent d'aspect selon le système). Objets du sac : silhouette de l'objet réel colorée par la rareté (pas un emoji). Dynastie : portrait peint du souverain (voir Bannières `portraits3d.js`).
- Ressources : portraits **déjà dans le dépôt** : `bannieres/jeu/portraits3d.js` (Mixamo, genre respecté) et `bannieres/outils/studio/portraits.py` ; icônes : game-icons.net (CC BY 3.0, **crédit obligatoire**, pas CC0) ou dessin SVG maison ; à éviter : packs d'icônes Kenney (CC0 mais style cartoon).
- Coût : **négligeable** (SVG inline ou une planche sprite ; aucune incidence sur le rendu des scènes).

### 4. Donjon 2D sur téléphone : HUD qui se chevauche et héros trop petit — priorité 1 (correctif rapide)
- Captures : `tel_combat.png`, `tel_boss.png`, `tel_sac.png` (arrière-plan).
- Problèmes : les orbes de vie/mana sont coupées par le bas de l'écran et passent SOUS la barre de compétences (« 139 » et « 49 » écrits sur les cases 1 et potion) ; un « 6 » orphelin au bord gauche (libellé « Émeric · niveau 6 » rogné) ; mini-carte de 160 px qui mange un quart de la hauteur utile ; personnages de ~25 px de haut, monstres illisibles (araignée = tache noire sur sol sombre).
- À obtenir : à 390×844, orbes entières (≥ 72 px) à gauche et à droite AU-DESSUS ou de part et d'autre de la barre, aucun texte superposé ; mini-carte ≤ 96 px ; zoom de caméra tel que le héros fasse ≥ 44 px de haut ; liseré clair (bord) sur les monstres sombres.
- Ressources : aucune (CSS + facteur de zoom `TS`).
- Coût : **négligeable** (un zoom plus fort réduit même la surface de sol à dessiner).

### 5. Carte du royaume : matière de parchemin et relief cuits — priorité 3
- Capture : `ordi_royaume.png`, `tel_royaume.png`, `ordi_bataille.png`.
- Constat : propre et lisible, mais plate : aplats beiges unis, montagnes en petits triangles, forêts en points, châteaux en pictogrammes blancs identiques ; on dirait un plateau de jeu de société plutôt qu'une carte de campagne à la chandelle.
- À obtenir : grain de papier/vélin + taches et bords brunis, relief ombré (estompage) cuit dans le fond, montagnes et forêts dessinées à la plume (hachures), mer avec dégradé de profondeur et lignes de rivage ; châteaux différenciés par niveau. Les teintes des maisons restent en lavis par-dessus (lisibilité inchangée).
- Ressources : ambientCG `Paper001` (CC0), `book_pattern`/`brown_leather` Poly Haven pour le cadre (`catalogue_parchemin.jpg`) ; relief : bruit déjà présent dans `carte.js` (le `createImageData` de la ligne ~46) à transformer en estompage.
- Coût : **négligeable** (la carte est déjà un canvas pré-rendu en cache ×2 ; texture appliquée une fois) ; poids +150-300 Kio.

## Ce qui pourrait être commun au studio
- **Polices** réellement intégrées (base64, `jeu/polices/`, OFL) : Grenze Gotisch 500/700 (titres) + Alegreya Sans 400/700/800 (texte), aussi dans la page 3D ; bonne paire « médiéval sérieux », candidate pour tous les jeux médiévaux du studio (Couronnes ×2, Bannières, Valdragon, Sedes Petri).
- **Palette** (`style.css :root`) : nuit `#0e131b`, nuit2 `#161e2a`, lapis `#2b4a7d`, or `#d9ae4f`, braise `#e0612b`, vélin `#ece2c9` (+ sang `#a8322a`).
- **Icônes** : emoji partout (dock, sac, diplomatie, compétences) — même problème probable dans les autres jeux ; un jeu d'icônes SVG gravées commun (`outils-communs/icones/`) servirait tout le studio.
- **Textures/sons/lumière** : 3D sur textures Poly Haven de Valdragon (`valdragon/jeu/tex`), bruitages Kenney/Valdragon, pas d'HDRI (lumières ponctuelles + étalonnage `theme.js` « braise & lapis » par type de donjon — réutilisable) ; 2D : sons synthétisés (`sons.js`), lumière par images de lueur pré-calculées.

## Question fermée pour Victor
Le donjon 3D est désormais le mode par défaut. Que fait-on du donjon 2D temps réel ?
- A) On l'élève au niveau de la 3D (sprites pré-rendus + sol photo, changements 2 et 4) — environ une journée de travail.
- B) On le garde tel quel comme simple repli (WebGL absent), on ne corrige que le téléphone (changement 4).
- C) On le retire du menu.
Recommandation : **B** maintenant (le temps va aux gardiens 3D et aux icônes, que Victor voit à chaque partie), A seulement s'il joue encore le 2D par choix.

## Non fait / limites
- Aucune mesure de fluidité (machine sans GPU, revues parallèles) : les coûts sont estimés d'après le code (cache des corps, sol pré-rendu, carte en cache).
- Donjon 3D capturé seulement en crypte (ordinateur) et antre (téléphone) ; pas de comparaison chiffrée `compare.py` contre `references/`.
- KayKit Skeletons et game-icons.net non téléchargés ici (accès extérieur limité) : à récupérer et vérifier la licence au moment de l'intégration.
- Note outil : `atelier.serveur()` laisse tourner son `http.server` après la fin du script ; le suivant sur le même port sert alors l'ancien dossier (404 silencieux, `vues3d.py` attend 180 s). À signaler à l'équipe Outils.
