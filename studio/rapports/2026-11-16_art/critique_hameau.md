# Hameau 3D — revue artistique (service du 16/11, passage du 17/11)

Construit depuis `main` (`python3 hameau/jeu/build.py`, 2 181 Ko), Three.js r160 servi en local, rendu logiciel (SwiftShader), qualité **Haute**, village de test (134 habitants, `test_save.json`) et partie neuve.
Captures : `/home/claude/art/hameau/` — `tel_*.png` (390×844 @2), `ordi_*.png` (1280×800), `hab/tel_*_zones.png` (mêmes vues avec l'outil Habitat actif, zones colorées), `vitrine.png`.
Planches de ressources : `catalogue_toits.jpg`, `catalogue_paves.jpg`, `catalogue_murs.jpg`, `catalogue_herbe.jpg`, `catalogue_feuillage.jpg`, `catalogue_arbres.jpg`, `catalogue_ciel.jpg`.

## Verdict d'ensemble
Le village développé, vu en oblique (`ordi_rasant.png`, `vitrine.png`), a du charme : colombages, lucarnes, lierre, chantiers, marché vivant, eau avec reflets. Mais **trois choses le tirent vers le jouet** : une herbe vert fluo uniforme, des toits presque tous bleu cobalt saturé, et des pavés huit fois trop gros. Ce sont aussi les trois choses les moins chères à corriger. La première image d'une partie neuve (`tel_debut_pan.png`) est la plus enfantine du jeu : tapis vert pomme, maison au toit bleu roi, arbres-boules blancs et roses.

Mesure (teinte/saturation moyennes des pixels verts) : partie neuve **113°, saturation 0,74** ; village jour ordi **94°, 0,67**. Une prairie d'été réaliste se situe vers **75-95°, 0,30-0,45** (la vue « large » de référence, voilée par la brume, est à 0,28).

## Les 5 changements, classés

### 1. Étalonner la palette : herbe naturelle, toits variés et rabattus — priorité 1, coût négligeable
- **Problème** : `tel_debut_pan.png` (herbe vert fluo, ombres de nuages vert sapin, toit bleu roi), `ordi_jour.png`, `ordi_rasant.png` (≈ 90 % des toits du même bleu cobalt), `tel_crepuscule.png` / `ordi_nuit.png` (la nuit pousse encore le bleu).
- **À obtenir** :
  - Herbe : teinte 78-92°, saturation moyenne ≤ 0,45 dans `tel_debut_pan` (vérifiable avec le petit script de mesure ci-dessous), avec une variation à grande échelle (plaques plus sèches ocre-olive #8f8a4a, plus grasses #4f6b2e) via un bruit basse fréquence dans la peinture du sol ; ombres de nuages −20 % de luminance sans changement de teinte.
  - Toits : ardoise gris-bleu rabattue (#5c636b → #3e444b, saturation ≤ 0,20) au lieu de `roofB` qui rend bleu roi sous le ciel ; mélanger par maison ardoise / tuile terre cuite patinée (#a0583a → #6e3a2a) / chaume, tirage déterministe par quartier pour éviter le patchwork ; le hall garde une couleur propre mais rabattue.
  - Étalonnage final : courbe légèrement en S + température chaude (+300 K) dans l'`OutputPass` ou un petit `ShaderPass` (une LUT 16³ suffit) ; Éco : même chose en ajustant directement les couleurs des matériaux (pas de passe).
- **Ressources** : référence de couleur Poly Haven `roof_slates_02`, `grey_roof_tiles_02`, `clay_roof_tiles_02`, `roof_09` (vieilles tuiles), `thatch_roof_angled` (planche `catalogue_toits.jpg`) — utiliser leurs albédos pour échantillonner la palette, même sans charger les textures. Herbe : ambientCG `Grass004`, Poly Haven `leafy_grass` (planche `catalogue_herbe.jpg`) pour la teinte.
- **Coût** : négligeable (couleurs de matériaux et de la peinture du sol ; la LUT = une lecture de texture plein écran, absorbée dans la passe de sortie existante en Haute/Ultra).

### 2. Pavés à la bonne échelle, bords de route et terre battue — priorité 1, coût modéré-faible
- **Problème** : `ordi_gros_plan.png` (chaque pavé est aussi large que le buste d'un villageois), `ordi_jour.png`, `tel_jour.png` (la place ressemble à un tapis de galets géants), `tel_hiver.png` / `ordi_nuit.png` (le motif domine la neige et la nuit). Cause : `groundCobble()` dessine ≈ 3 pavés par case dans le sol de 24 px/case (1344 px pour 56 cases) ; à cette résolution on ne peut pas faire mieux.
- **À obtenir** : 12-16 pavés par case (un pavé ≈ 1/5 de la hauteur d'un villageois), joints sombres et irréguliers, pavés usés plus clairs au centre de la voie, bordure qui se défait en terre battue et en cailloux sur 0,3 case, herbe qui reprend dans les joints des voies peu fréquentées. Le sol peint garde la forme (masque de route) ; le détail vient d'une **texture de détail en coordonnées monde** mélangée dans le shader du sol selon ce masque (canal libre du sol ou petite texture masque 56×56 lissée).
- **Ressources** : ambientCG `PavingStones070` (pavés irréguliers, gris-beige), Poly Haven `cobblestone_floor_04` (pavés + herbe dans les joints), `stony_dirt_path` pour la bordure (planche `catalogue_paves.jpg`). 512×512, couleur seule (+ éventuellement relief dans l'alpha), méthode d'intégration base64 : `cage-et-gloire/outils/prep_tex.py` + `jeu/build.py`.
- **Coût** : modéré-faible : une texture 512² (~120 Ko en JPEG intégré) et 1-2 lectures de plus dans le seul shader du sol ; aucun objet ni appel en plus. Mesurer avec le banc 🧪 « village jour » Moyenne.

### 3. Ancrer les maisons et donner de vraies matières aux murs — priorité 2, coût négligeable
- **Problème** : `ordi_gros_plan.png`, `tel_gros_plan.png` (les maisons sont posées sur un gazon parfaitement lisse, sans soubassement, sans terre ni ombre de contact ; l'étage en encorbellement repose sur des poteaux fins qui flottent), `ordi_rasant.png` (le soubassement en « briques » grises régulières lit comme du parpaing ; le torchis vert menthe pâle est froid ; les vitres jaune plein jour paraissent éclairées en plein midi).
- **À obtenir** : un anneau de terre battue / gravier de 0,3-0,5 case autour de chaque bâtiment (peint dans le sol, comme les chemins), une ombre de contact douce sous chaque maison (quad multiplicatif instancié), soubassement en moellons irréguliers de tailles variées (pierre calcaire chaude #b3a58c → #8a7d68) ; torchis crème chaud (#e9dcc0, variantes ocre #d9c39a et rose passé #d8b9a5) au lieu du menthe `wallL3 #dfe6cf` ; vitres sombres bleutées le jour avec un reflet de ciel, jaunes **seulement** de la tombée de la nuit à l'aube ; poteaux de l'encorbellement plus épais, avec un dé de pierre au sol.
- **Ressources** : Poly Haven `rustic_stone_wall_02` (moellons), `white_plaster_02` / `painted_plaster_wall` (planche `catalogue_murs.jpg`) comme modèles pour `stoneWallTex()` et `plasterTex()` (ou en vraie texture 256²) ; ombre de contact : recette `cshad` + texture `soft` de `une-vie/jeu/index_src.html` (catalogue du bureau).
- **Coût** : négligeable (peinture du sol déjà existante, un InstancedMesh d'ombres = 1 appel, textures de même taille que les actuelles).

### 4. Végétation moins « boules » : silhouettes dentelées et couleurs sobres — priorité 2, coût modéré
- **Problème** : `tel_debut_pan.png` (arbres-boules vert pomme, blancs et roses, comme des bonbons), `ordi_large.png` (forêts en grappes de sphères), `ordi_rasant.png` / `tel_rasant.png` (lierre en gros polygones plats vert vif), `ordi_jour.png` (rochers de carrière anguleux en polyèdres gris clair, haies-saucisses).
- **À obtenir** : feuillus à 3-5 masses irrégulières déformées par bruit (déjà amorcé le 16/11) **plus** une couronne de cartes de feuilles en découpe alpha sur le pourtour (silhouette dentelée) ; sapins en 4-5 étages à bord dentelé (piste du 16/11) ; arbres en fleurs limités au printemps et en teintes réalistes (blanc cassé #e8e2d6, rose très pâle), pas en été ; palette feuillage : 3 verts rabattus (#4d6b33, #5f7a3a, #3d5530) + 1 vert-jaune clair (#8a9a4a) pour les jeunes arbres ; lierre en petites feuilles (carte alpha) ; rochers de carrière : moins de facettes visibles (normales lissées comme les arbres) et une teinte chaude moussue sur le dessus.
- **Ressources** : ambientCG `LeafSet009`, `LeafSet010` (atlas de feuilles CC0, type « Atlas ») ; écorce ambientCG `Bark012` / `Bark014` (planche `catalogue_arbres.jpg`) ; imposteurs pour les arbres lointains : `bannieres/outils/studio3d/imposteur.py`. Les modèles d'arbres Poly Haven (`tree_small_02` 4,6 M tri, `fir_tree_01` 7,8 M tri) sont **inutilisables** tels quels : servir seulement de modèle pour pré-rendre des imposteurs.
- **Coût** : modéré : la découpe alpha augmente le coût de remplissage et les ombres (Intel Iris : garder `alphaTest`, pas d'`alphaToCoverage` hors Ultra, cartes seulement sur les arbres proches ; en Éco garder les volumes actuels). À faire valider par le technicien fluidité (banc « vue large » et « village jour »).

### 5. Lumière : une vraie heure dorée, une nuit lunaire, la neige qui garde le relief — priorité 2, coût négligeable
- **Problème** : `ordi_crepuscule.png` (soleil presque couché : l'image s'assombrit et se sature mais ne se réchauffe pas, aucune teinte orangée), `tel_crepuscule.png` / `hab/tel_soir_zones.png` (on passe de midi à la nuit bleu roi sans soir doré), `ordi_nuit.png` / `tel_nuit.png` (nuit bleu saturé, pavés bleu marine ; halos des lanternes en ellipses orange opaques, comme des autocollants au sol), `tel_hiver.png` / `hab/tel_hiver_zones.png` (toits enneigés en dalles blanches plates sans tuiles, sans bord ni épaisseur ; neige du sol gris-bleu avec les pavés géants dessous).
- **À obtenir** :
  - Heure dorée d'environ 1/8 de journée (soleil bas, ombres longues, lumière #ffc98a, ciel orangé à l'horizon) avant la nuit, et un lever symétrique.
  - Nuit : lumière de lune gris-bleu rabattue (saturation ≤ 0,25, pas de bleu roi), fenêtres et lanternes seules sources chaudes ; halos au sol en dégradé radial doux (bord à 0), plus petits, intensité ×0,6, et une touche de lumière sur le mur voisin.
  - Hiver : neige posée sur les tuiles (le relief des tuiles reste visible en ombré), bourrelet au faîtage et aux bords, ourlet de neige épais de 2-3 cm ; neige du sol qui recouvre les pavés (motif visible ≤ 20 %), traces de pas plus sombres sur les chemins.
  - Éclairage d'ambiance du ciel : remplacer le dégradé à 2 couleurs par l'HDRI `kloofendal_48d_partly_cloudy_puresky` (jour) pour le PMREM, `satara_night_no_lamps` (nuit) — une seule fois au chargement, pas de recalcul.
- **Ressources** : HDRI Poly Haven ci-dessus (planche `catalogue_ciel.jpg`, 1k suffit, ~1,5 Mo en .hdr : à convertir en JPG RGBM 512 pour rester léger) ; ou garder le ciel procédural et ne prendre que les couleurs de référence.
- **Coût** : négligeable pour les couleurs et halos ; HDRI : un PMREM de plus au chargement seulement (sans recalcul, ce qui va dans le sens de la piste « préchauffer nuit/hiver » du technicien fluidité).

## Ce qui va bien (à garder)
Colombages et lucarnes, tuiles irrégulières, fumées de cheminée, reflets dans l'eau, cartes crème de l'interface, jeu d'icônes SVG cohérent (34 symboles), barre de ressources en verre, tutoriel discret.

## Interface (remarques secondaires)
- Les boutons de qualité de l'écran titre gardent des emojis (💎 ✨ ⚖️ 🔋) et le menu pause un 🐞 et un 🧪, alors que tout le reste est en icônes SVG maison : `tel_titre.png`, `tel_menu.png`. À remplacer par des icônes du même jeu.
- Le logo « maison blanche sur carré vert arrondi » fait icône d'application ; un blason ou une petite gravure (maison à colombages, trait sépia) irait mieux avec le titre en serif.
- Téléphone : la bulle d'aide « Peins près du hall… » se superpose au bas du panneau population (graphique d'évolution caché) : `tel_population.png`.
- Zones peintes en pastels de confiserie (lilas, menthe, rose) : `hab/tel_jour_zones.png`, `tel_construction.png`. Les rabattre (ex. habitat #d39a6a, champs #cdb75e, forêt #6e9e6a, marché #c9799a) pour rester lisibles sans casser l'ambiance.

## Ce qui pourrait être commun au studio
- **Typographie** : aucune police chargée ; piles système `"Avenir Next","Segoe UI",Inter,system-ui` (texte) et `"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif` (titres). Sur Mac c'est très bien ; sur Android les titres retombent en Georgia/serif générique. Proposition studio : une serif de titre libre (ex. EB Garamond ou Cormorant, OFL) intégrée en base64 sous-ensemble latin (~40 Ko).
- **Palette d'interface** : crème #fbf5e6 / #f1e5c8, brun encre #3a2a14, vert action #5c8a3a (#6fa448 → #3f7a2e en dégradé), or #f3cf6b / #ffd970, rouge #c0463a, verre sombre rgba(18,26,18,.82). Cohérente, réutilisable telle quelle comme thème « médiéval clair » du studio.
- **Icônes** : 40 symboles SVG `<symbol>` maison (ressources, saisons, météo, outils) → candidats à une planche commune `outils-communs/icones.svg`.
- **Textures** : toutes procédurales (Canvas 2D : tuiles, chaume, planches, torchis, moellons, pavés) ; aucune photo. Les générateurs `roofTileTex`, `thatchTex`, `plankTex`, `plasterTex` sont réutilisables par Bannières et Couronnes & Lignées (3D).
- **Sons** : 100 % synthétisés en Web Audio (vent, pluie, oiseaux, grillons, carillons) — à mettre en commun à côté de `bannieres/jeu/sons.js`.
- **Lumière/ciel** : ciel procédural en dégradé + PMREM recalculé 6×/jour, brouillard couleur du ciel ; pas d'HDRI.

## Question fermée pour Victor
**Quelle direction d'image pour le Hameau ?**
- A. « Maquette réaliste » : palette rabattue, matières plus photo (pavés, moellons, ardoise), lumière dorée — le style de *Manor Lords* vu de haut. **(recommandé : c'est ce que tu demandes depuis le début, et les changements 1-3 y mènent pour presque rien en fluidité)**
- B. « Illustration peinte » : garder les formes douces, mais palette aquarelle et contours adoucis — style *Townscaper*/*Bad North*.
- C. Garder le style actuel (coloré, lisible) et ne corriger que les pavés et les emojis.

## Ce qui n'a pas pu être fait
- Rendu logiciel seulement (pas de GPU) : pas de mesure d'img/s fiable, coûts estimés d'après la structure (textures, passes, appels).
- Pas de capture en Moyenne/Éco ni de vrai coucher de soleil intermédiaire au-delà de `ordi_crepuscule.png` (le cycle passe très vite du jour à la nuit : `DAY=48`).
- Construction et menu pause capturés au téléphone seulement (`tel_construction.png`, `tel_menu.png`, `hab/`) : le rendu logiciel à 4 navigateurs en parallèle était trop lent pour la série ordinateur complète.
- Village « naissant » capturé au jour 1 seulement (pas de partie jouée jusqu'à 20-40 habitants).

## Mesure de l'herbe (pour vérifier le changement 1)
```
python3 - <<'E'
from PIL import Image;import colorsys
im=Image.open('tel_debut_pan.png').convert('RGB').crop((0,300,780,1150)).resize((200,200))
g=[colorsys.rgb_to_hsv(*[c/255 for c in p]) for p in im.getdata()];g=[x for x in g if .18<x[0]<.45]
print('teinte %.0f°  sat %.2f'%(sum(x[0] for x in g)/len(g)*360,sum(x[1] for x in g)/len(g)))
E
```
Aujourd'hui : 113°, 0,74. Cible : 78-92°, ≤ 0,45.
