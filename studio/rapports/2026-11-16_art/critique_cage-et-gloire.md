# Cage & Gloire — revue artistique du 17/11/2026 (service du 16/11)

Construction : OK (`jeu/build.py` → `cg.html`, 1829 Kio). Captures : `outils/vues.py` (60 semaines de robot, 390×844 et 1280×800) + un script Playwright de combat 3D (présentation, rounds, coin, ralenti du KO, résultat) aux deux formats. Aucune erreur JS.
Rendu logiciel (swiftshader) : les img/s affichées dans les captures ne veulent rien dire.
Toutes les images : `/home/claude/art/cage-et-gloire/` (`tel_*.png`, `ordi_*.png`, `vitrine.png`, `zoom_portrait_*.png`, planches `catalogue_*.jpg`).

Hors périmètre (déjà au tableau, art-cage-et-gloire-20261117a + q-cage-et-gloire-1) : le modèle « jouet » des combattants. Ajouts à cette demande, plus bas.

---

## Changements classés

### 1. Lumière de retransmission et foule (arène) — priorité 1, coût négligeable à modéré
Captures : `ordi_combat_intro2.png`, `ordi_combat_combat12.png`, `vitrine.png`, `tel_combat_combat30.png` ; référence `references/07_combat_3.png`.
Problème :
- Le tapis est éclairé partout pareil, d'un gris-blanc plat, du centre jusqu'au grillage. Le projecteur principal (`SpotLight` à 9,5 m, angle π/5,4 ≈ 33°) couvre tout l'octogone, donc on ne voit pas de cercle de lumière. L'image a l'air d'un studio, pas d'un gala.
- La foule ne se voit presque plus : on ne distingue que du noir derrière le grillage, alors que dans `references/07_combat_3.png` on voyait des gradins peuplés. C'est une régression (brouillard `FogExp2 .034` + gradins `#0b0b0e`).
- Le vert de l'organisation (poteaux, rembourrages, bord du tapis, logo central) est saturé et de couleur unie. Résultat : un plateau de jeu de société.
À obtenir (vérifiable sur capture) :
- Un cercle de lumière : le centre du tapis à une luminance d'environ 85-90 %, qui descend à 55-60 % au pied du grillage, puis le tablier extérieur à moins de 25 %. On l'obtient sans lumière de plus, en peignant un dégradé radial (et quelques traces d'usure et de sueur) dans la texture canvas du tapis, et en resserrant le projecteur à environ π/7 avec une pénombre de 0,8.
- Une foule lisible en silhouettes : les têtes et les épaules des premiers rangs éclairées par la lumière qui déborde de la cage (luminance 15-25 %), puis un fondu vers le noir pour les rangs du haut. Il faut moins de brouillard sur les 3 premiers rangs, ou un `emissive` faible sur le haut de la texture foule.
- La couleur d'organisation imprimée sur le tapis à environ 55 % d'opacité, avec le grain de la toile (l'encre dans le tissu). Rembourrages en vinyle noir avec un seul liseré de couleur et un reflet doux (rugosité 0,45).
Ressources : texture canvas actuelle (`tapis_n`) ; ambientCG `Fabric030` / `Fabric019` (toile, CC0) pour la couleur ; Poly Haven `leather_white` / `brown_leather` (CC0) pour la rugosité du vinyle ; planches `catalogue_tissu.jpg`, `catalogue_sol.jpg`. Dégradé et usure : canvas généré, rien à télécharger.
Coût : négligeable pour le tapis et le vinyle (on peint une texture, sans appel de dessin ni lumière en plus). Modéré seulement si on éclaire la foule par une vraie lumière : à éviter, l'émissif suffit.

### 2. Cadrage de la caméra de retransmission, surtout sur téléphone — priorité 1, coût négligeable
Captures : `tel_combat_combat30.png`, `tel_combat_intro2.png`, `ordi_combat_intro.png`, `_choix.jpg` (6 moments d'un même combat).
Problème :
- Sur ordinateur, les combattants font 15 à 25 % de la hauteur de l'image dans la moitié des plans. Sur téléphone, environ 10 %, tassés dans le tiers du milieu.
- L'arbitre est souvent plus près de la caméra que les combattants et vole l'attention.
- La présentation « coin bleu » (`ordi_combat_intro.png`) cadre le dos et le bassin de l'arbitre, et le combattant présenté n'est pas dans l'image.
- Sur téléphone, les commentaires et la bannière couvrent le quart bas de l'écran (`tel_combat_combat30.png`, `tel_combat_intro2.png`), et le nom « GAUTHIER » est coupé par le chrono.
À obtenir :
- Une caméra de type téléobjectif (champ de 28-35° en reculant d'autant) : les deux combattants occupent 35-45 % de la hauteur sur ordinateur et au moins 30 % sur téléphone, avec le sol de la cage en perspective écrasée, comme à la télévision.
- L'arbitre toujours au second plan, hors du tiers central.
- La présentation : un plan taille ou poitrine du combattant annoncé, visage dans le tiers haut.
- Sur téléphone : 2 lignes de commentaire au maximum, sur un dégradé collé à la barre de contrôle. Le reste passe dans l'historique.
Ressources : aucune.
Coût : négligeable (même scène ; un champ plus serré dessine même moins de décor). Attention : un cadrage plus serré montre davantage le modèle « jouet ». À faire en même temps que la demande 20261117a, ou juste après.

### 3. Portraits : visages noirs (bug) puis style — priorité 1 pour le bug, 2 pour le style ; coût négligeable
Captures : `zoom_portrait_resultat.png`, `zoom_portrait_intro.png`, `ordi_combat_resultat.png`, `tel_combat_resultat.png`, le bandeau du haut des captures de combat (portrait de Gauthier en noir) ; style : `ordi_ecurie.png`, `ordi_precombat.png`.
Bug (PLAUSIBLE, cause probable trouvée dans le code) : dans le bandeau, la plaque de présentation et l'écran de résultat, la peau du visage et du torse n'est pas peinte. Il reste les oreilles, le nez, la bouche et une silhouette noire, avec un effet de cagoule. `portraits.js` nomme ses dégradés `'p'+seed` (+`g`/`b`/`s`/`l`). Le même combattant apparaît plusieurs fois dans la page, donc plusieurs `<linearGradient>` portent le même id, et `url(#…)` vise le premier, qui peut être caché ou retiré. À obtenir : des ids uniques par instance (compteur global), et la même peau partout. Le relecteur et le testeur doivent le confirmer.
Style : ces portraits vectoriels plats (traits de nez en V, lignes de clavicule) font illustration jeunesse. Sur ordinateur, l'affiche de l'écurie les agrandit à environ 1000 px de large et le défaut saute aux yeux.
À obtenir à court terme : affiche limitée à 380-420 px de haut sur ordinateur, éclairage latéral (dégradé sombre côté opposé à la lumière, liseré de couleur du coin), léger grain. À terme : des portraits pré-rendus en 3D sous la lumière de l'arène, comme dans Bannières (`bannieres/outils/studio/portraits.py` + `pack_portraits.py`), une fois le modèle remplacé (q-cage-et-gloire-1).
Écran de résultat : « DÉFAITE » est écrit dans l'or de la victoire. Il faut un gris chaud ou un rouge sourd, et l'or seulement pour une victoire.

### 4. Mise en page sur ordinateur et états vides — priorité 2, coût nul
Captures : `ordi_ecurie.png`, `ordi_offres.png`, `ordi_ligues.png`.
Problème :
- Écurie à 1280×800 : l'affiche du prochain combat prend tout l'écran. On ne voit ni « Cette semaine » ni le nom de la combattante, caché par le bouton « Semaine suivante ».
- Les pages tiennent sur une seule colonne étirée à environ 1040 px.
- « Offres » vide : une ligne de texte grise sur un grand vide noir.
À obtenir : à partir de 1100 px, une grille en 2 colonnes (affiche de 420 px de haut au maximum à gauche, actualités et finances à droite), avec la zone utile sous la barre « Semaine suivante ». États vides : une silhouette de cage en filigrane, la date du prochain gala de chaque organisation où l'écurie a un combattant, et un bouton vers « Combattants ».
Ressources : aucune. Coût : nul (CSS).

### 5. Icônes : sortir des emoji — priorité 2 à 3, coût nul
Captures : `tel_ecurie.png` (barre du bas), `tel_salle.png` (🏟 🧊 🎬), `tel_fiche.png` (traits 🫲 🧭), `tel_combattants.png` (🤖 🚑 📅).
Problème : toute l'iconographie est en emoji : navigation, traits, complexe, états, contrôles du combat. Leur dessin change selon l'appareil (sur Mac et iPhone, des emoji Apple brillants et colorés). Ils cassent l'ambiance sombre et dorée façon gala, et font jeu pour enfants.
À obtenir : un seul jeu d'icônes au trait (trait de 1,75 px, coins arrondis à 2 px), en `currentColor`, doré quand l'onglet est actif. Garder les drapeaux. Remplacer les pictogrammes du complexe par une petite illustration monochrome.
Ressources : Kenney « Game Icons » / « Board Game Icons » (CC0, Kenney est déjà crédité dans le studio) ; à défaut Tabler Icons (MIT, mention légère). game-icons.net est en CC BY 3.0 (crédit obligatoire) : à éviter si l'on veut rester en CC0.
Coût : nul, ou mieux qu'aujourd'hui (des SVG intégrés au lieu des polices emoji).

---

## À ajouter à la demande art-cage-et-gloire-20261117a (sans la répéter)
- L'arbitre est le même mannequin, peint en noir et sans visage. Il lui faut une chemise et un pantalon (matière tissu, plis), sinon il restera « jouet » même après le changement des combattants.
- Le ralenti du KO (`ordi_combat_ralenti.png`) : le dos plie en arrière comme un pantin, il faut une chute au poids. Les shorts violets et blancs sont d'une couleur unie électrique : en baisser la saturation (environ 70 %).
- Une ombre de contact sous les pieds des combattants (aussi visible que celle de l'arbitre), voir la tache bon marché d'`une-vie` (`cshad`).

## Commun au studio
- Polices réellement chargées : Bebas Neue (titres, chiffres) + Inter (texte), intégrées en base64 via @fontsource. Bon couple, à garder pour les jeux sportifs et modernes.
- Palette de l'interface : `#09090c` (fond), `#181a22` (panneaux), `#ecebe6` (texte), `#e9c46a` (or), `#e63946` (rouge), `#2fbf71` (vert), avec `#3d7bff` (bleu, coin bleu).
- Icônes : des emoji partout, comme dans plusieurs autres jeux du studio. C'est un choix qui engage tous les jeux (question ci-dessous).
- Textures : une seule texture Poly Haven versionnée (`jeu/tex/tapis_n.jpg`) ; la foule et le grillage sont générés en canvas. Fence003 (ambientCG, grillage à alpha) existe si l'on veut un grillage photoréaliste (`catalogue_grillage.jpg`), mais le grillage procédural suffit, à condition d'affiner le trait.
- Lumière : sans carte d'environnement (choix juste pour le Mac Intel), ACES 1,05, hémisphère, projecteur et deux lumières directionnelles. Un recette commune « gala ou scène nocturne » (dégradé peint dans le sol + émissif faible sur le public) servirait aussi à Président de Club.
- Sons : synthétisés (`son.js`), sans fichier.

**Question pour Victor (engage tous les jeux)** : pour les icônes (onglets, boutons, traits), préfères-tu
(A) garder les emoji (rien à faire, rendu différent selon l'appareil),
(B) un jeu d'icônes au trait commun à tout le studio (Kenney CC0), coloré à la teinte de chaque jeu,
(C) des icônes dessinées propres à chaque jeu (gravure pour les jeux médiévaux, trait pour les jeux modernes) ?
Recommandation : **B** pour les jeux modernes (Cage & Gloire, Président de Club, Wall Street, Une vie), **C** pour les jeux médiévaux.

## Non fait / limites
- Mesures de fluidité : impossibles ici (rendu logiciel). Les coûts annoncés sont estimés d'après le code.
- Pas de vue du complexe au niveau 5, du Grand Prix ni d'un écran de victoire avec ceinture (le robot à 60 semaines ne les atteint pas).
- Le bug des portraits n'est pas confirmé par un test DOM (cause probable lue dans `portraits.js`).
- La recherche d'HDRI n'a rien donné d'utile (sans aperçus) et n'est de toute façon pas souhaitable (pas de PMREM).
