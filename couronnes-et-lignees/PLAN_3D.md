# Plan 3D — Couronnes & Lignées (lancé le 16/11/2026)

Demande de Victor : « passer en illustrations 3D pour que ce soit plus agréable à regarder ».
Choix de Victor : **approche mixte** (carte 3D en temps réel avec repli 2D automatique ; scènes et portraits pré-rendus en 3D) et **style réaliste**.

## Principe technique de la carte
- Three.js r160 (même build global que Bannières, `jeu/three.js`) sous la carte SVG existante.
- **Perspective cavalière** (vue des plans anciens) : projection oblique où le sol garde exactement les coordonnées de la carte SVG, et où les hauteurs se dessinent vers le haut. Ainsi la couche SVG au-dessus (frontières, couleurs des maisons, noms, pions, zones à toucher) reste alignée sans rien recoder, et toutes les commandes existantes (toucher une terre, glisser, pincer) continuent de marcher.
- Rendu à la demande (aucune image calculée quand rien ne bouge) ; pendant un geste, la même transformation CSS que la carte SVG ; dessin net à la fin du geste.
- Repli 2D : sans WebGL, si le rendu est trop lent, ou au choix dans ☰ (« Carte en 3D »), ou `?v3d=0`.

## Phases
1. **Fondations** (16/11, 8 h) : moteur intégré, terrain réaliste (textures Poly Haven : herbe, forêt, roche, sable, marais), relief, mer, rivières, forêts instanciées, châteaux provisoires, interrupteur 2D/3D, outils de captures 3D.
2. **Châteaux et édifices** (16/11, 12 h) : châteaux, villages, 7 édifices, cathédrale, pions d'armée, bannières, traités et front de guerre en 3D ; lumière selon l'âge ; ombres en qualité haute.
3. **Scènes pré-rendues** (16/11, 15 h 30) : les 15 scènes d'événements rendues en 3D hors ligne (WebP), repli SVG.
4. **Portraits 3D** (16/11, 19 h) : banque de bustes pré-rendus (chaîne de Bannières), choix déterministe par personnage, repli SVG.
5. **Finitions** (16/11, 23 h) : fluidité téléphone / Mac Intel, qualité automatique, prise en main, bilan.

## État
- **Phase 1 faite (16/11, 8 h 30)** — `jeu/rendu3d.js` (module `R3`), `jeu/three.js` (r160 global), `jeu/tex3d.js` (5 textures Poly Haven 512 px, 300 Ko, sources dans `jeu/tex3d/`).
  - Projection cavalière : matrice faite main (`project`), racine de scène en `scale(1,1,-1)` pour garder le bon sens des triangles malgré l'axe y vers le bas ; le sol est décalé de K·2,2 pour coller à la couche SVG.
  - Terrain : grille de 3,2 unités (2,5 en qualité haute), hauteurs = bruit + collines + lits de rivières (rivières de `MAP2.decor`), mélange de 4 textures par sommet (attribut `splat`, `onBeforeCompile`), mer transparente.
  - Forêts instanciées (feuillus + résineux), châteaux **provisoires** (donjon, tours, drapeau aux couleurs).
  - Intégration : `boardSVG` n'affiche plus le décor peint en 3D (classe `b3d`), garde frontières/noms/blasons/pions ; `applyView(live)` applique la même transformation au canevas ; `render()` attache le canevas à `.imm` et appelle `R3.sync`.
  - **Désactivée par défaut** tant que les édifices ne sont pas en 3D (sinon perte visuelle) : menu ☰ « Carte en 3D (essai) », clé `cl_3d`, paramètre `?v3d=1`.
  - Outils : `V3D=1` pour `captures.py`, `explore.py`, `geste.py` ; références 3D dans `references/3d/`.
  - Mesures (rendu logiciel) : construction de la scène 4 s, une image 27-32 ms ; rien n'est recalculé quand la carte ne bouge pas.

### Phase 2 (16/11, après-midi) — faite
- `rendu3d.js` : `buildSettlements` remplace les châteaux provisoires. Kit procédural (boîtes, cylindres, cônes, toits à deux pans `gable`, créneaux, bannières) avec coordonnées de texture « monde » (`wuv`, projection sur le plan dominant de chaque face).
- Matériaux Poly Haven CC0 256 px dans `tex3d.js` : pierre (castle_wall_varriation), taille (medieval_blocks_02), enduit (plastered_stone_wall), planches (brown_planks_05), tuiles (clay_roof_tiles), ardoise (grey_roof_tiles), chaume (thatch_roof_angled). `tex3d.js` = 419 Ko.
- Châteaux : capitale (enceinte crénelée, 4 tours, châtelet, donjon, logis), vos autres terres (courtine, 2 tours, donjon), seigneurs voisins (maison-forte), rival (pierre sombre). Bannières aux couleurs de la maison (`A.arms().robe`). Échelle ×1,3 à ×1,45.
- Villages : 1 maison par point de richesse (+3 capitale), chaume ou tuiles. Les 7 édifices (3 derniers par région, comme en 2D) et la cathédrale (échafaudages + grue pendant le chantier, flèches à la fin).
- Lumière selon l'âge (`setEra`), ombres en qualité 2 (grand écran non mobile), sinon qualité 1.
- **3D par défaut** (`cl_3d` absent = activée ; menu ☰ pour revenir au dessin). En cas d'échec WebGL : `R3.failed`, retrait du canvas, la carte 2D complète est redessinée.
- Première construction différée (40 ms) pour que l'interface s'affiche avant le calcul du terrain.
- Mesures (CPU ×4, rendu logiciel) : chargement 746 ms (avant 3D : 532), rendu plateau 8,9 ms, glisse 59 img/s ; le zoom mesuré juste après le chargement chevauche la construction 3D en rendu logiciel (`mesures/perf_3d_phase2.json`). Captures 2D : 0 alerte / 16 ; 3D : références mises à jour.
- Revue Studio : relecteur (ROUGE corrigé : perte du contexte WebGL → retour automatique à la carte dessinée), testeur ORANGE (reflet en cône sur la mer corrigé : eau en Lambert ; terres teintées plus fort). Version publiée 1794828978-a4d2.
- Reste pour plus tard : pions d'armée en 3D (les pions SVG restent, lisibles et touchables), front de guerre en relief.

### Phase 3 (16/11, fin d'après-midi) — faite
- Atelier `outils/atelier3d/` : `scenes3d.js` (constructeur de scènes, s'exécute dans la page construite et réutilise Three.js, `TEX3D` et le kit `R3.kit`) + `rendre.py` (Chrome en rendu logiciel, rendu 1440×600 → 720×300 Lanczos, vignette douce, WebP q72). Commande : `python3 outils/atelier3d/rendre.py [scènes] --ages`.
- 15 scènes + écran titre (600×600) : château, église, village, bataille, cour, mer, nuit, peste, tournoi, chantier, foire, noces, couronnement, siège, port. Ciel à nuages peints, ombres 4096, fumées en voiles, brume ; personnages, chevaux, tentes, étals, navires, trébuchet procéduraux.
- 3 lumières par âge (barons / cathédrales plus dorée / fléaux grise et brumeuse), sauf cour, couronnement, nuit, peste (une seule).
- Drapeaux de maison : rendus en blanc, leurs 4 coins projetés sont enregistrés (`scenes3d/flags.json`) ; dans le jeu, un polygone SVG en `mix-blend-mode:multiply` les teint aux couleurs de votre maison (`who: me`) ou de l'adversaire (`foe`).
- Intégration : `jeu/scenes3d.js` (IMG3D, 647 Ko) embarqué par `build.py` ; `SCENE.svg` → `svg3d()` si la 3D est choisie, sinon les scènes dessinées (inchangées : captures 2D 0/16 alerte).
- Textures enduit/chaume/tuiles éclaircies (maisons trop sombres sur la carte aussi).
- Revue Studio (relecteur + graphiste, ORANGE) appliquée : caméras resserrées (focale 27°), drapeaux tous dans le cadre (rendre.py signale « ⚠ drapeau hors cadre »), feuillage plus clair, silhouettes à épaules et bras, âges plus marqués, château du titre posé sur le relief.
- Réserves ORANGE pour la phase 5 : personnages encore simples (piste : pions pré-rendus de Bannières), « chantier » peu lisible comme cathédrale, cour et couronnement proches.
- Page 2,6 Mo (limite 16), IMG3D 705 Ko. Chargement 883 ms à CPU ×4 (630 avant). Version 1794841536-5f17. Planche : `references/planche_scenes3d.png`.
