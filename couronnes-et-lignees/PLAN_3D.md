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
