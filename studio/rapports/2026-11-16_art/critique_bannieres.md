# Bannières & Sortilèges — revue artistique (17/11/2026)

Construction : `python3 bannieres/jeu/build.py` OK (page 7 101 Kio ; le README annonce encore ~5,8 Mo).
Captures : `capt.py` (graine 7, horloge figée, qualité 3D 2) en 1280×800 et 390×844, + accueil.
Comparaison avec `bannieres/references/` : 0,0 % d'écart sur les 7 vues ordinateur → aucune régression, l'état jugé est celui des références.
Fichiers : `/home/claude/art/bannieres/{ordi,tel}_<ecran>.png`, `vitrine.png` (= carte ordinateur), détails dans `preuves/`, planches CC0 `catalogue_*.jpg`.

## Impression d'ensemble
La carte d'aventure a franchi un vrai cap (sol peint texturé, ombres, forêts en imposteurs, château crédible) et l'accueil est séduisant.
Ce qui trahit encore le « jouet » : les bêtes sculptées, la composition des combats, des villes qui se ressemblent toutes, l'eau à bord net, et quelques lieux de la carte qui restent des formes provisoires (dôme marron, boîte noire, cubes colorés).

## Changements classés

### 1. Bêtes sculptées : des espèces qu'on reconnaît, des robes naturelles — priorité 1
- Problème : le loup des chevaucheurs se lit comme un **mouton** (toison blanche, museau court), le roc comme un **canard** (tête blanche, bec orange), le béhémoth comme un taureau en plastique orange vif, le centaure orange saturé.
  Captures : `preuves/combat_betes_droite.png`, `preuves/carte_scierie_bete.png`, `preuves/carte_eau_mine_brouillard.png` (centaure), `ordi_combat.png`.
- À obtenir (vérifiable sur une planche 64 px de haut, fond herbe) : loup = museau long + oreilles dressées + pelage gris-brun tiqueté (pas de blanc > 20 % de la surface), queue touffue basse ; roc = rapace sombre (bruns #4a3826 / #6b5238), bec crochu jaune terne, envergure ≥ 1,5× la longueur du corps ; béhémoth = cuir brun-noir ou gris ardoise, cornes ivoire, aucune teinte > 60 % de saturation ; centaure/chevaux : robes baie, alezan foncé, gris pommelé. Un inconnu doit nommer chaque bête sur la planche.
- Ressources : garder la chaîne `outils/studio/quad.js` (gabarits `G_LOUP`, `G_GRIFFON`, `G_BEHEMOTH`, couleurs dans `matPeau`) — le défaut est d'abord de proportions et de palette. Références de forme CC0 Poly Haven : `horse_head`, `bull_head`, `horse_statue_01` (sculptures, à rendre en vue de côté comme planche de proportions). Si on veut des modèles : animaux Quaternius (CC0, déjà crédités au studio) — mais polygones plats, à n'utiliser qu'avec le relief `matPeau`, sinon on gagne en anatomie et on perd en réalisme. Poly Haven n'a aucun animal entier.
- Coût fluidité : **négligeable** (images pré-rendues, même nombre de sprites ; surveiller seulement le poids de la page).

### 2. Combat : une créature par case, lisible, rien de coupé — priorité 1
- Problème : les piles se chevauchent en une colonne illisible (griffon dans les chevaux, ogres empilés), les compteurs sont des carrés rouges/violets criards et collés aux pieds du voisin ; au téléphone, béhémoth et dernières piles coupés aux bords.
  Captures : `preuves/combat_colonne_gauche.png`, `preuves/combat_betes_droite.png`, `preuves/tel_combat_bords_coupes.png`.
- À obtenir : chaque pile tient dans son hexagone (largeur ≤ 1,6 hex pour les grandes créatures, dessin ancré au centre bas de la case), ombre de contact elliptique douce sous chacune, tri en profondeur strict ; compteur = petite plaque sombre (#1a0f06 à 85 %) liseré or #c09a48, chiffre serif clair, posée devant les pieds ; couleur du camp portée par un fin anneau au sol plutôt que par le fond du compteur. Au téléphone, marge de cadrage ≥ ½ hex : aucune créature tranchée.
- Ressources : aucune nouvelle (code `combat_ui.js`, palette existante).
- Coût : **négligeable** (sprites et quelques ellipses 2D).

### 3. Villes : une identité par faction, des habitants posés au sol — priorité 2
- Problème : Horde et Nécropole reprennent la maison à colombages au toit rouge et les étals de fruits colorés du Bastion ; un béhémoth est debout sur un toit (Horde), troll et griffons flottent ; Nécropole = Bastion repeint de nuit avec une lune de dessin animé. Au téléphone, le tiers bas est un chemin vide.
  Captures : `preuves/ville_horde_maison_bastion.png`, `ordi_ville_necro.png`, `ordi_ville_horde.png`, `tel_ville_bastion.png`.
- À obtenir : aucun élément de décor commun entre factions hormis tonneaux/caisses ; Horde = palissade de rondins, huttes, peaux, feux ; Nécropole = pierre sombre, cimetière, arbres morts, lanternes verdâtres, pas d'étal de fruits, lune réaliste (texture, halo discret) ou ciel couvert ; Sylve = déjà mieux (toits cuivre). Toutes les créatures ont une ombre de contact et les pieds sur le sol. Téléphone : caméra plus basse/plus proche, la place occupe ≥ 55 % de la hauteur du panorama.
- Ressources CC0 (Poly Haven, via `phget.py` puis imposteurs `outils/studio3d/imposteur.py`) : `modular_fort_01` (fort en rondins → Horde), `gothic_statue`, `dead_tree_trunk`, `dead_tree_trunk_02`, `dead_quiver_trunk` (Nécropole), `tree_stump_01/02`, `kite_shield` (trophées), `Lantern_01`. Ciel : HDRI `kloofendal_48d_partly_cloudy_puresky` (jour), `belfast_sunset_puresky` (Horde), `kloppenheim_06_puresky` (nuit claire) — planche `catalogue_ciel.jpg`.
- Coût : **négligeable** en jeu (panorama rendu une fois par construction) ; modéré au chargement si on ajoute des imposteurs (prévoir ~150 Kio webp).

### 4. Eau et rivages de la carte — priorité 2
- Problème : la mer est un plan bleu roi uniforme qui coupe le sol au couteau : pas de plage, pas de dégradé de profondeur, pas d'écume ; le contour en escalier fait « carré ».
  Capture : `preuves/carte_eau_mine_brouillard.png`, `ordi_carte.png`.
- À obtenir : bande de sable/vase mouillée de 0,2-0,4 case le long de toute côte (sol assombri près de l'eau), eau turquoise-vert (#3c6e6a) sur les hauts-fonds → bleu nuit (#12303f) au large, liseré d'écume fin et animé lentement, contour arrondi (aucun angle droit visible à la distance de jeu normale).
- Ressources : `tex3d/sol_sable.jpg` existe déjà ; Poly Haven `coast_sand_rocks_02` ou `aerial_beach_01` (texture) si le sable actuel est trop clair ; `modular_wooden_pier` (ponton près des chantiers navals) ; `ship_pinnace` / `dutch_ship_medium` en imposteur pour les bateaux.
- Coût : **modéré-faible** — la bande de rivage se calcule dans le shader du sol (hauteur déjà connue, 0 texture en plus) ; la profondeur de l'eau demande une lecture de hauteur dans le shader de l'eau. En qualité Économie (`BS_LEGER`) : garder la bande de sable, couper l'écume. À faire valider par le technicien fluidité (`outils/prof3d.py`).

### 5. Lieux de la carte encore provisoires (mines, scierie, gemmes) — priorité 3
- Problème : la mine est un dôme marron lisse avec un rectangle noir, la scierie une boîte noire avec un tube, les gemmes des cubes de couleurs vives : ce sont les seuls objets « jouet » sur une carte par ailleurs crédible.
  Captures : `preuves/carte_eau_mine_brouillard.png`, `preuves/carte_scierie_bete.png`.
- À obtenir : mine = entrée creusée dans un affleurement de roche (matière roche triplanaire existante) avec cadre de poutres et wagonnet ; scierie = bâtiment à colombages, pile de grumes en imposteur, roue à aubes si une rivière est voisine ; gemmes = amas de cristaux translucides sur socle de roche, teinte par ressource mais saturation ≤ 70 %.
- Ressources : matières déjà dans `tex3d/` (`roche`, `poutre`, `bois`, `mur`), imposteurs existants (`tonneau`, `caisse`) ; Poly Haven `rock_moss_set_01`, `tree_stump_01`, `dry_branches_medium_01` (bûches).
- Coût : **négligeable** (géométrie fusionnée par matière comme les villes, imposteurs instanciés).

## Autres remarques (moins prioritaires)
- Téléphone : la date de la barre du haut est coupée (« Mois 1, semaine 1, ») — `preuves/tel_barre_date_coupee.png`. Correctif simple (abréger « M1 · S1 · J1 » ou passer à la ligne).
- Ordinateur : 330 px de panneau bois vide entre les portraits et la fiche du héros, avec des joints de planches qui se répètent (`ordi_carte.png`) — y mettre la liste des héros/villes ou réduire le panneau.
- Brouillard de guerre : bords noir-bleuté opaques ; un voile de nuages/parchemin désaturé serait plus noble que du noir.
- Boutons à emoji (🐎 🛡 🏰 ⌛ ⚔ 📖 🔨 🍺) à côté d'icônes de ressources rendues en 3D : deux styles qui se côtoient (voir question).
- Accueil : façades blanc pur et fenêtres noires en aplat → enduit cassé (#d9cfb8) et vitres sombres légèrement réfléchissantes.

## Ce qui pourrait être commun au studio
- Typographie : aucune police chargée ; pile système `"Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif` (Palatino sur le Mac de Victor, sérif de repli ailleurs). Petites capitales dorées pour le titre.
- Palette d'interface : brun nuit #140d08 / #1a0f06, bois #5a4020, bronze #7a5a24, or #b8903e / #c09a48, or clair #f6d77a, texte parchemin #f0e2c0.
- Icônes : emoji dans les boutons ; ressources en petites images rendues en 3D (`icones3d.js`).
- Matières : `jeu/tex/bois.jpg` (panneaux), `tex3d/*` (sols Poly Haven avec cartes normales, ardoise, chaume, enduit, roche) — directement réutilisables par Couronnes & Lignées 3D et le Trône de Braise.
- Sons : bruitages Kenney (CC0) + musique générative `sons.js` (déjà partagée avec Valdragon).
- Lumière : soleil + RoomEnvironment/`envCiel`, ciels peints par faction ; les HDRI Poly Haven ci-dessus pourraient devenir un jeu de ciels commun (jour / couchant / nuit).

## Question pour Victor (choix qui engage tout le jeu)
Icônes des boutons : (a) garder les emoji (rapide, mais aspect « appli de téléphone » et rendu différent entre Mac et Android) ; (b) icônes gravées monochromes or sur bois, en SVG, dessinées une fois pour tout le studio ; (c) petites icônes rendues en 3D comme les ressources.
Recommandation : (b) — lisible à 20 px, cohérent avec le cadre bois/or, et réutilisable par tous les jeux médiévaux du studio.

## Ce qui n'a pas pu être fait
- Pas de mesure de fluidité (rendu logiciel ici : ~1 img/s, non représentatif) ; les coûts sont estimés d'après le code.
- Aperçus des modèles Poly Haven absents des planches (vignettes du CDN non autorisées) : noms et nombres de triangles relevés par l'API.
- Pas de capture de siège ni de Graal (hors vues fixes de `capt.py`).
