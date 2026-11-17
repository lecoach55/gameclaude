# Sedes Petri — revue artistique (16/11/2026)

Captures : `/home/claude/art/sedes-petri/` (`tel_*.png` 390×844, `ordi_*.png` 1280×800, graine 7, script `capt.py`, port 8714).
Écrans : accueil, accueil_bas, tableau (onglet Pontife), carte, carte_heresie, royaume, curie, chronique, evenement (relique), evenement_peste, rapport de saison, bilan de règne, conclave, conclave_vote (Habemus papam), fin (1517), menu.
Vitrine : `vitrine.png` (= `ordi_tableau.png`, 1198, carte + pontife).
Aucune régression par rapport à `sedes-petri/references/` (accueil identique au pixel près à l'œil).

## Verdict d'ensemble
La structure est solide et cohérente : palette parchemin / bordeaux / or tenue partout, hiérarchie claire, lettrines, eyebrows en capitales espacées, carte lisible avec noms latins des mers et rose des vents. Sur téléphone, tout tient, rien ne déborde.
Ce qui tire le jeu vers l'« enfantin » : les **images**. Les illustrations d'événements sont des silhouettes plates sur dégradé (une croix et une lune sur des dunes pour la relique, une couronne de clip-art pour 1198) et les portraits sont des pictogrammes quasi identiques. Le texte est d'un ton historique adulte ; l'image ne suit pas. C'est le premier chantier.

## Changements classés

### 1. Illustrations d'événements : remplacer les décors SVG plats par des œuvres médiévales du domaine public — priorité 1, coût fluidité négligeable
- Problème : `ordi_evenement.png` (bandeau 690×230 quasiment vide : soleil, croix, deux collines), `tel_evenement_peste.png`, `ordi_conclave.png` (arcades roses en aplat), `ordi_accueil.png` (4 cartes d'époque en pictogrammes), `tel_fin.png` (livre ouvert en clip-art).
- À obtenir : chaque bandeau = un détail recadré (ratio 3:1, 1200×400 max) d'une enluminure, fresque ou gravure d'époque, traité uniformément : léger virage vers le parchemin (sépia 15 %, contraste −5 %), vignettage doux, filet or + ombre interne comme un cadre de manuscrit. Garder les SVG actuels en repli pour les événements non couverts. Vérifiable : aucun bandeau d'événement fréquent (top 30 de `redondance.js`) sans image peinte ; un joueur doit reconnaître une scène (personnages, architecture), pas un symbole.
- Ressources (domaine public, PD-Art sur Wikimedia Commons ; à vérifier page par page, l'accès Commons est bloqué depuis le bac à sable) :
  - Papauté / Rome : Giotto, *Légende de saint François* (Assise) — « Le songe d'Innocent III », « Confirmation de la Règle » ; fragment de fresque de Giotto « Boniface VIII proclamant le Jubilé » (Latran) → `jubile` ; Ulrich Richental, *Chronique du concile de Constance* (vers 1460) → conclave, concile ; Froissart (BnF Fr. 2643) contient l'élection d'Urbain VI en 1378 → conclave, schisme.
  - Rois, guerres, sièges : *Grandes Chroniques de France* (BnF Fr. 2813 : sacres, conciles, expulsion des Albigeois de Carcassonne → hérésie cathare) ; Froissart (batailles, jacquerie).
  - Croisades : Sébastien Mamerot, *Passages d'outremer* (BnF Fr. 5594).
  - Peste : Bible de Toggenburg (1411), *Annales de Gilles Li Muisis* (enterrement des pestiférés à Tournai, 1349).
  - Saisons, paysans, neige (1073) : *Très Riches Heures du duc de Berry* (Limbourg) — février, octobre…
  - Villes (Rome, Constantinople, Venise, Avignon) : gravures de la *Chronique de Nuremberg* (Schedel, 1493), à colorer légèrement en sépia ; imprimerie : *Danse macabre* de Lyon (1499, premier atelier d'imprimeur figuré).
  - Mongols : Rashid al-Din, *Jami' al-tawarikh*.
- Poids : WebP qualité 70, 1200×400 ≈ 50-80 Ko ; 30 images ≈ 2 Mo (page actuelle 0,5 Mo, très loin des 16 Mio). Images statiques : aucun coût par image, seulement un décodage à l'ouverture de l'événement.
- Crédits : ajouter une ligne « Illustrations : manuscrits et fresques du domaine public (BnF, Wikimedia Commons) » et la cote de chaque œuvre dans le Codex.

### 2. Portraits des papes et cardinaux : quitter le pictogramme — priorité 1, coût négligeable
- Problème : `zoom_portraits.png` (3 candidats au conclave : même visage, même pose de face, yeux en traits, fond à rayures), `ordi_tableau.png` (pape à la tiare en « bonhomme »), `tel_royaume.png` (Henri IV). Les ajouts d'âge et de nation ne se voient pas.
- À obtenir : style « panneau gothique sur fond d'or » (Simone Martini, Giotto, Melozzo da Forlì « Sixte IV nommant Platina ») : visage de trois quarts, modelé (ombre sous la pommette, orbite, pli nasogénien qui se creuse avec l'âge), couleur chair tempera, contour brun fin plutôt que noir, fond doré poinçonné (motif répété) au lieu des rayures, vêtements à plis (mozette, camauro, galero, tiare à trois couronnes avec ombre). Vérifiable : sur la planche des 3 candidats, on doit distinguer l'âge (41/51/64 ans) et deux visages différents sans lire le texte.
- Deux voies : (a) enrichir le SVG procédural de `art.js` (3/4, dégradés de modelé, 4-5 formes de nez/mâchoire, rides par âge, fond or) — le moins cher, reste léger ; (b) pré-rendre un jeu de bustes 3D avec le pipeline de Bannières (`bannieres/outils/studio/portraits.py` + `pack_portraits.py`, Mixamo) en soutane rouge, ~24 variantes, puis filtre « peinture » — plus réaliste mais plus lourd (~1 Mo). Recommandation : (a) d'abord.
- Ressource texture pour l'or : ambientCG `Metal007` (CC0, or martelé) réduit à 256 px, ou motif SVG de poinçons.

### 3. Carte : d'une carte politique moderne à une carte de portulan sur vélin, et plus nette — priorité 2, coût modéré
- Problème : `ordi_carte.png`, `zoom_carte.png` : aplats saturés (rose Pologne, violet Hongrie/Byzance, bleu France) qui jurent avec le parchemin ; mer gris-vert uniforme ; aucun relief (Alpes, Pyrénées, Carpates absentes) ; raster 1000×800 étiré → flou sur l'écran Retina du MacBook (≈ ×1,6 en pixels réels) ; bande grise sous la carte en bas à gauche à 1280×800 (`ordi_tableau.png`, y > 765).
- À obtenir : couleurs des royaumes ramenées à des pigments médiévaux (vermillon #b0412e, ocre #c39a4a, lapis #3d5a8c, vert-de-gris #5f8a6e, terre de Sienne #8a5a3a, pourpre adouci #6e4a6e), saturation −25 % ; grain de vélin multiplié sur tout le raster (calculé une fois) ; mer couleur vert d'eau pâle avec lignes de rhumbs partant de la rose des vents ; petits monts hachurés à la plume sur les chaînes principales ; raster à 2× (devicePixelRatio, plafonné à 2) ; carte qui remplit la zone jusqu'en bas.
- Ressources : ambientCG `Paper001` (CC0) pour le grain ; Poly Haven `beige_wall_001` en alternative plus chaude. Référence de style : Atlas catalan (1375, BnF, domaine public), portulans de Pietro Vesconte.
- Coût : le grain et le relief se cuisent dans le raster existant (aucun coût par image). Le raster ×2 multiplie par 4 la préparation (`carte_prete_ms`, déjà en tâche de fond) et la mémoire (≈ 13 Mo) : à mesurer avec `perf.py` à CPU ×4 avant de valider ; à signaler au technicien fluidité.

### 4. Matières de l'interface : vélin, cuir et sceau de cire au lieu de dégradés unis — priorité 2, coût négligeable (et un gain)
- Problème : parchemin = dégradé crème lisse (`ordi_evenement.png`, `tel_menu.png`) ; barre du haut = dégradé bordeaux uni ; le gros bouton rouge (« Clore le printemps », « Ouvrir le conclave », « Nouvelle partie ») a un reflet radial brillant façon bonbon de jeu mobile (`tel_tableau.png`, `tel_bilan.png`).
- À obtenir : panneaux et fenêtres avec grain de vélin léger (tuile 512 px, multiply, opacité 0,25-0,35, bords légèrement plus sombres) ; barre du haut et onglets en cuir brun-rouge (`brown_leather`, Poly Haven, CC0, 512 px teinté) avec filet or double ; bouton principal mat façon sceau de cire (rouge #8b1a1a, bord irrégulier ou liseré estampé, sans reflet blanc), garder la rangée de sceaux.
- Fluidité : supprimer le `backdrop-filter: blur(3px)` de `#modal` (style.css l. 288) et assombrir un peu plus le voile (0,78) : le flou plein écran au-dessus de la carte est le seul effet coûteux de l'interface sur puce graphique Intel. À transmettre au technicien fluidité.

### 5. Typographie : embarquer les polices — priorité 2, coût négligeable
- Problème : Cinzel, Cinzel Decorative et EB Garamond viennent de Google Fonts ; dans le bac à sable (et donc dans toutes les captures et les références du dépôt) elles ne se chargent pas (`document.fonts` vide) : on voit Liberation Serif/Times en gras (`tel_accueil.png` : le titre « Sedes Petri » n'est pas en Cinzel Decorative). Hors ligne, Victor verrait la même chose. La revue visuelle juge donc une typographie que le joueur ne voit pas.
- À obtenir : woff2 hébergés avec la page (sous-ensemble latin + français, ≈ 100-150 Ko au total), `font-display: swap`. Licence SIL OFL (libre, pas CC0, mention dans les crédits). Vérifiable : `document.fonts` liste les trois familles en `loaded` dans `captures.py`, et références régénérées.

### Détails mineurs
- Écran de fin (`tel_fin.png`) : « 1 papes ont régné », « Aucun » isolé, sections vides (« La frise se dessinera… ») — états vides à soigner (accord singulier, masquer une section vide).
- Menu : mélange d'emoji (☁ 📜 🐞) et d'icônes SVG maison ; préférer les SVG maison (le jeu en a déjà un beau jeu : `i-key`, `i-cross`, sceaux).

## Commun au studio
- Polices réellement chargées : aucune dans l'environnement de test (Google Fonts bloqué) ; déclarées : Cinzel 500/700/900, Cinzel Decorative 700, EB Garamond 400/600/italique. Proposition studio : un dossier `outils-communs/polices/` en woff2 (OFL) pour tous les jeux médiévaux (Couronnes & Lignées, Couronnes & Complots, Trône de Braise, Bannières).
- Palette : fond #1a110b, bordeaux barre #45180f→#26100a, parchemin #efe2c2 / #e6d3a6, or #b8892d / #e2b53e, rouge #8b1a1a / #b3242b, encre #2b1d12.
- Icônes : SVG maison (symboles `i-*` dans map.js, `ICON` dans art.js) + quelques emoji dans le menu et le rapport.
- Textures : aucune (tout en dégradés CSS/SVG) ; Bannières a déjà `jeu/tex/bois.jpg`, `pierre.jpg`, `fond_cre.jpg` réutilisables.
- Sons : tout synthétisé (oscillateurs : cloche, accord, sceau ; plain-chant génératif). Les bruitages Kenney (CC0) de Valdragon/Bannières pourraient donner un vrai sceau, un parchemin, une cloche.

## Question pour Victor
Pour les illustrations des événements (et peut-être des portraits), quel style ?
- A. Œuvres médiévales réelles du domaine public (enluminures, fresques, gravures), recadrées et teintées — **recommandé** : authentique, adulte, gratuit, très léger pour la fluidité.
- B. Garder les dessins SVG du jeu mais beaucoup plus détaillés (ombres, personnages, architecture) — cohérent, mais long à produire et restera « dessiné ».
- C. Scènes 3D pré-rendues avec les personnages Mixamo du studio — plus « jeu vidéo », moins médiéval, plus lourd.

## Ce qui n'a pas pu être fait
- Pas d'accès à Wikimedia Commons ni à Google Fonts depuis le bac à sable : les œuvres proposées sont citées de mémoire (titres, cotes BnF) et doivent être vérifiées et téléchargées depuis une machine ayant accès ; rendu réel des polices non observé.
- Planches de recherche CC0 : `catalogue_parchemin.jpg` (Paper001, plâtres), `catalogue_matieres.jpg` (cuir, marbre, or Metal007).
