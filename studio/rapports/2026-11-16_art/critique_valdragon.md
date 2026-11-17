# Valdragon — revue artistique du 16-17/11

Direction artistique, service du 16/11. Les captures ont été prises sur la version `main` construite localement (dossier `/home/claude/art/valdragon/t3d`, serveur sur le port 8713, rendu logiciel SwiftShader, qualité 2).

**Limites :**
- **Polices :** `fonts.googleapis.com` est bloqué dans le bac à sable. Toutes les captures montrent donc la police de secours (Times et Arial) à la place de Cinzel et d'Alegreya Sans.
- **Lumière :** le rendu logiciel ne reproduit pas exactement le GPU de Victor. La lumière est indicative ; la composition et les matières sont fiables.

## Captures (dossier `/home/claude/art/valdragon/`)

**Téléphone (390×844, ×2) :**
- `tel_titre.png`, `tel_histoire.png` (prologue), `tel_explo6.png`, `tel_explo10.png`
- `tel_combat2_sq+ar+gob.png`, `tel_boss8.png`, `tel_sac.png`

**Ordinateur (1280×800) :**
- `ordi_titre.png`, `ordi_explo2.png`, `ordi_explo10.png`, `ordi_explo14.png`
- `ordi_combat10_py+go+wy.png`, `ordi_effets.png`, `ordi_boss8.png`, `ordi_boss12.png`, `ordi_sac.png`

**Vitrine :** `vitrine.png`, une copie de `ordi_boss8.png` (Sylthra, entrée du combat de boss).

**Gros plans :** `zoom_mur_arene.png`, `zoom_mur_combat.png`, `zoom_trait_diagonal.png`.

**Planches de recherche :** `catalogue_sol.jpg`, `catalogue_tresor.jpg`, `catalogue_tissu.jpg`. Les vignettes de modèles Poly Haven ne s'affichent pas, car `cdn.polyhaven.com` est bloqué ; les noms ont été vérifiés par l'API.

## Verdict d'ensemble

**Ce qui fonctionne :**
- Les dragons photoréalistes (Drago) et les héros Mixamo.
- Les dalles Poly Haven en exploration.
- Le sac : icônes peintes et couleurs de rareté à la Diablo, propres sur les deux formats.

**Ce qui ne fonctionne pas :** le jeu est tiré vers le « jouet » par trois choses.
- Les **décors KayKit restés tels quels dans l'arène de combat** (mur du fond, trésor, champignons).
- Des **héros qui se fondent dans le sol** : leur contraste mesuré vaut environ 1,0.
- Des **écrans d'histoire en aplats vectoriels**.

L'arène est l'écran le plus vu du jeu, et c'est elle qui trahit le plus le réalisme. C'est donc là qu'il faut frapper d'abord.

---

## Les 5 changements, classés

### 1. Arène de combat : le mur du fond en « arc-en-ciel » et les bannières KayKit
- **Priorité :** 1
- **Coût pour la fluidité :** négligeable
- **Captures :**
  - `zoom_mur_arene.png` et `zoom_mur_combat.png`
  - Visible aussi dans `ordi_boss8.png`, `ordi_boss12.png`, `tel_combat2_sq+ar+gob.png` et la référence `references/normale/combat_F6.png`.

**Problème.** Le mur courbe du fond est fait de pièces `wall` KayKit. Dans `buildArena` (g3d.js, vers la ligne 431), leur géométrie est remplacée par une `BoxGeometry`. Ses UV par défaut (0 à 1) étalent alors **tout l'atlas KayKit** sur chaque bloc. On obtient des panneaux rouges, verts, violets et jaunes, et des planches de bois en bandes verticales : un patchwork de tapisserie de chambre d'enfant, présent dans tous les combats. Les bannières `banner_*` KayKit (motifs plats et saturés) renforcent l'effet.

**À obtenir (vérifiable) :**
- **Le mur :** une maçonnerie continue du biome, la même que dans les couloirs. Il faut appliquer `bioTex(tier,'w')` avec `grime(...)`, comme le fait déjà `pm` pour les piliers, et poser des UV à l'échelle du monde (environ 0,4 répétition par mètre). Plus aucune teinte saturée sur le mur.
- **Contrôle chiffré :** sur la capture de combat, la saturation moyenne du bandeau du mur doit être inférieure à 0,25, contre environ 0,45 aujourd'hui (cases rouges et vertes).
- **Les bannières :** des tentures en tissu sombre (une toile teintée selon le biome : bordeaux en crypte, ocre en forge, bleu acier au givre), sur un plan à quelques segments, avec un léger ondoiement dans le vertex shader, ou à défaut immobile.

**Ressources :**
- Les textures de mur du biome sont déjà dans le jeu (`tex/*_w_d.jpg`, `_n.jpg`) : zéro octet de plus.
- Pour les tentures : ambientCG **Fabric030** (toile de lin neutre, facile à teinter), en 512 px webp, environ 60 à 90 Ko.

**Coût.** Même nombre d'appels de dessin ; la texture de mur est déjà en mémoire.

### 2. Lisibilité des héros : Aldric et Maëlle sont des silhouettes noires sur un sol sombre
- **Priorité :** 1
- **Coût pour la fluidité :** négligeable
- **Captures :** `ordi_combat10_py+go+wy.png`, `ordi_effets.png`, `tel_combat2_sq+ar+gob.png` et `ordi_explo2.png` (Aldric et Maëlle quasi noirs, de dos).

**Mesures des références** (`references/normale/lisibilite.json`) : le contraste vaut **1,00** en combat F6, **1,01** au boss F8 et **1,02** en exploration F6. Autrement dit, les personnages ont exactement la luminance du sol, et le bord de silhouette se situe entre 25 et 30.

**À obtenir :** un liseré de contre-jour, une rim light chaude, discrète et de type fresnel, sur les héros et les monstres uniquement, dans la teinte de la lumière du biome.
- Contraste au moins égal à **1,3**.
- Bord au moins égal à **35**, sur les 6 scènes de `captures.py`.
- Sans effet de contour de dessin animé : pas de trait noir, pas de halo de plus de 2 px.
- Référence de rendu : Diablo IV et Baldur's Gate 3 en vue de dessus, où le héros se détache toujours par le haut des épaules et le casque.

**Ressources :** aucune. C'est un `onBeforeCompile` sur les matériaux des `SkinnedMesh` (calcul `pow(1-dot(N,V),3)` × couleur).

**Coût.** Quelques instructions par pixel, uniquement sur les personnages ; pas de passe en plus.

### 3. Trésor du dragon et champignons « jouets » dans les combats de boss
- **Priorité :** 2
- **Coût pour la fluidité :** modéré
- **Captures :** `ordi_boss8.png` et `ordi_boss12.png` (piles de pièces en crêpes orange, coffre `chest_gold` en bois de dessin animé), `ordi_effets.png` (champignons turquoise en aplats).

**Problème.** C'est le moment fort du jeu : un dragon photoréaliste en gros plan. Autour de lui, le décor le plus « Playmobil » du jeu. Le contraste de style saute aux yeux.

**À obtenir :**
- **Le coffre :** un vrai coffre de bois ferré.
- **L'or :** un tas de pièces métalliques qui accroche la lumière des braseros. Il peut être fait de pièces instanciées, petits cylindres plats posés en tas, avec un matériau or. Pas de piles régulières.
- **Les champignons :** dans les Cavernes fongiques, les remplacer par des racines photoscannées. Les points de lumière bioluminescents peuvent rester en sprites additifs. Hors cavernes, aucun champignon dans l'arène.

**Ressources (CC0) :**
- Poly Haven **treasure_chest** : 103 000 triangles, à simplifier à environ 3 % (3 000) avec `SIMP` dans `pack_phprops.mjs`, nœud nommé `chest_gold` pour qu'il remplace automatiquement la pièce KayKit.
- ambientCG **Metal048C** (or patiné) pour les pièces.
- Poly Haven **root_cluster_01**, **root_cluster_02** et **tree_stump_01** pour les cavernes.

**Coût.**
- Environ 3 000 triangles pour le coffre et environ 300 pièces instanciées (1 appel de dessin).
- Poids : environ 150 à 250 Ko.
- La page publiée pèse **15,5 Mo** sur 16 Mio : il reste environ 1,2 Mo. À vérifier avec `poids.py`.

### 4. Écran titre : la belle scène 3D est enterrée sous le texte
- **Priorité :** 2
- **Coût pour la fluidité :** négligeable
- **Captures :** `tel_titre.png` et `ordi_titre.png`.

**Problème.**
- **Sur téléphone :** les trois héros autour du feu et le dragon n'occupent que le quart bas de l'écran. Le dragon est recouvert par le bloc de règles et par les crédits.
- **Sur ordinateur :** les crédits passent en travers des personnages et sont illisibles (« Oscar Creativo » est coupé par le dragon). Ces crédits sont obligatoires : leur illisibilité est aussi un problème de licence (CC BY 4.0).
- **Polices :** Cinzel et Alegreya Sans viennent de Google Fonts, sans copie intégrée. Hors ligne ou au premier chargement lent, le titre s'affiche en Times gras, ce qui est le cas sur toutes mes captures. C'est contraire à la règle « aucune dépendance réseau » de la page publiée.

**À obtenir :**
- Le titre en haut, avec un bouton « Descendre » et un bouton secondaire « Comment jouer » qui déplie les règles.
- La scène 3D visible sur au moins 55 % de la hauteur sur téléphone, le dragon dégagé.
- Les crédits en bas de page, sur un bandeau sombre (fond `rgba(0,0,0,.6)`), corps 11-12 px, contraste supérieur ou égal à 4,5:1.
- **Polices intégrées en base64 :** Cinzel 600/800 et Alegreya Sans 400/700, sous-ensembles latin, environ 60 à 90 Ko. Cinzel Decorative n'est utilisé que pour deux titres et peut être retiré.

**Ressources :** les polices (licence OFL), à embarquer dans `build.py inline`.

**Coût.** Nul en rendu ; environ 80 Ko de poids.

### 5. Prologue et histoire : des illustrations en aplats vectoriels
- **Priorité :** 3
- **Coût pour la fluidité :** négligeable
- **Capture :** `tel_histoire.png`.

**Problème.** Les 5 scènes de `story.js` (`village`, `fondateurs`, `souffle`, `heritiers`, `coeur`) sont dessinées au canvas : sapins en triangles, puits en ellipse violette plate, fenêtres en carrés. C'est l'écran le plus « enfantin et carré » du jeu, et c'est le premier que voit un nouveau joueur.

**À obtenir :** 5 plans fixes rendus avec le moteur du jeu lui-même, fondus enchaînés avec un léger zoom lent (effet Ken Burns, à faire en CSS).
- Une margelle en vraie pierre (`medieval_blocks_03`, `castle_wall_slates`, déjà dans `tex/`).
- Les héros Mixamo de dos, éclairés par la lueur du puits.
- Un ciel nocturne.

**Ressources :**
- Poly Haven **dikhololo_night** ou **satara_night** (HDRI, utilisée seulement au moment du rendu, pas embarquée).
- Rendu avec `studio.py` (préréglage à ajouter), export en webp 540×960 à la qualité 70, environ 50 Ko par image, soit environ 250 Ko au total.

**Coût.** Nul à l'exécution, puisque ce sont des images ; environ 250 Ko de poids. Avec les points 3 et 4, cela fait environ 600 Ko, ce qui reste dans la marge.

---

## Remarques secondaires (hors classement)

**Trait diagonal sur tout l'écran en combat.** Il apparaît dans `zoom_trait_diagonal.png`, `ordi_effets.png` et `tel_combat2…`. C'est très probablement la couture des deux triangles du plan `groundFog` de 48×48 m (vfx.js) en rendu logiciel. À confirmer sur un vrai GPU (🐞 sur le Mac de Victor) avant d'y passer du temps. Au passage, ce brouillard est calculé par pixel (fbm à 4 octaves, deux fois) sur un plan qui couvre tout l'écran : c'est à signaler au technicien fluidité pour le Mac Intel.

**Effets.** L'orbe de givre est un disque flou plat (`ordi_effets.png`) et la brûlure une petite bouffée grise. Les effets ont moins de matière que les modèles. Il faudrait un sprite de flocons ou d'éclats, à tirer de `satlas.png`.

**Exploration sur ordinateur.** Le cadrage 16:10 montre beaucoup de noir non révélé (`ordi_explo2.png`) ; `ordi_explo10.png` et `ordi_explo14.png` sont presque entièrement noirs, avec une seule dalle éclairée sous Ysolde. C'est peut-être un effet de ma téléportation, puisque le téléphone sur le même étage est correct (`tel_explo10.png`). À reproduire avec `captures.py` avant de conclure.

**Interface.** Les onglets du sac mélangent emoji (🎒 📜) et glyphes (⚔ ✦). Les noms d'ennemis se chevauchent quand deux monstres sont côte à côte (« Chaman gobelinChaman gobelin » dans la référence `combat_F6`). L'ordre des tours est une rangée de pastilles à lettres (A M C C), alors que les portraits existent déjà (`G3.portrait`) : utiliser des vignettes de portraits.

## Ce qui pourrait être commun au studio

| Élément | Ce que Valdragon utilise |
|---|---|
| Typographies | Cinzel 600/800 (titres, noms), Cinzel Decorative 700 (deux titres), Alegreya Sans 400/700/800 (texte). Chargées par Google Fonts, non intégrées : une **trousse commune de polices en base64** servirait à tous les jeux « une page hors ligne ». |
| Palette d'interface | or `#f0c46a` (accent principal), or sombre `#d8b25a`, bronze `#6b5631`, parchemin `#e8dcc4`, texte secondaire `#b9a888`, fond `#000` et brun nuit (environ `#140f0a`). Rareté : gris, bleu `#5f86c8`, or `#e0b44a`, orange `#e0782a`. |
| Icônes | Objets peints au canvas (`icons.js` : dégradés acier, cuir, bois, gemmes), de bonne qualité et réutilisables pour Bannières et Trône de Braise. Les boutons de l'interface sont encore des emoji (🐞 🔊 🎒 📜). |
| Textures | Poly Haven et ambientCG préparées par `ph_tex2.py` (rugosité dans le bleu de `_n`). Le lot `tex/` couvre 4 biomes (crypte, caverne, forge, givre) plus la lave, la glace et le bois. |
| Sons | Bruitages Kenney (28) et musique générative (déjà reprise par Bannières). |
| Lumière | Brouillard exponentiel par biome, braseros en sprites additifs et 3 lumières ponctuelles, bloom. Pas de HDRI. |

**Question fermée pour Victor** (elle engage le style de tout le studio) : faut-il **retirer progressivement les pièces KayKit visibles (style « jouet ») au profit de décors photoréalistes Poly Haven, même si cela coûte du poids de page et un peu de fluidité ?**
- A. Oui, partout.
- B. Oui, seulement là où la caméra s'approche (combats, boss, titre) ; KayKit reste pour l'architecture vue de loin.
- C. Non, on garde le mélange actuel.

Recommandation : **B**. C'est le meilleur gain visuel par Mo, et le Mac Intel n'en souffre pas.
