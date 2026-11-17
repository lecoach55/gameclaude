# Président de Club — revue artistique (16/11)

Version jugée : `president-de-club/jeu/index.html` (v37), copie locale avec les **vraies polices** (Big Shoulders Display, Barlow, JetBrains Mono via npm @fontsource, Google Fonts étant bloqué ici). Chrome, Playwright, 1280×800 et 390×844, densité ×1.
Captures : `/home/claude/art/president-de-club/ordi_*.png`, `tel_*.png`, `vitrine.png` (match en direct, R2, au moment d'un but). Script : `shots.py`.

## Impression d'ensemble
Le jeu a déjà une vraie direction : nuit de stade (verts très sombres), jaune projecteur, titres condensés type affichage de stade, cartes à filets fins, icônes au trait dans les onglets. Ça tient la comparaison avec une appli de club sérieuse et ce n'est pas enfantin. Les faiblesses sont ailleurs : **le match en direct** (le moment fort) est le plus pauvre et parfois illisible, **le téléphone** sacrifie la moitié de l'écran à l'en-tête, et quelques incohérences (emoji contre icônes au trait, chiffres formatés différemment) cassent le côté « vraie appli ».

## Changements classés

### 1. Match en direct : maillots qui se confondent + terrain trop petit sur téléphone — priorité 1, coût négligeable
- Captures : `ordi_match.png`, `vitrine.png`, `ordi_match_but.png` (US Clichy vert/blanc contre SO Ermont vert/blanc : les 20 joueurs de champ sont en **blanc**, impossible de savoir qui attaque ; les deux gardiens ont le même maillot jaune), `tel_match.png`, `tel_match_l1.png` (terrain ≈ 315×175 px, maillots ≈ 8 px, numéros illisibles ; le bandeau « BUT ! » chevauche le message « Occasion… »).
- Cause : `liveStart` ne compare les couleurs que par égalité stricte (`hc[0]===ac[0]`) après avoir passé le vert en couleur secondaire ; deux verts proches mais différents passent.
- À obtenir :
  - Règle « maillot extérieur » comme à la télé : si la distance de couleur (ΔE ou simple distance RGB < ~90, ou deux couleurs claires) entre les maillots principaux est trop faible, l'équipe à l'extérieur prend sa 2e couleur, sinon un maillot de rechange sombre (#1d2530 ou bordeaux #6b1f2a). Gardiens : jaune pour l'un, **cyan ou noir** pour l'autre. Vérifiable : sur 200 paires de clubs tirées au hasard, aucune paire avec distance < seuil (petit test Node).
  - Sur téléphone (largeur < 520 px) : **terrain vertical** (portrait, environ 340×480) au lieu d'une bande 16/9 ; maillots ≥ 14 px, numéros lisibles. Le « BUT ! » et le message d'action ne doivent jamais se superposer (message déplacé sous le grand titre pendant `bigT`).
- Ressources : aucune (code canvas existant).
- Coût : négligeable (même nombre de formes ; canvas déjà limité à DPR 2 et DPR 1 en mode allégé).

### 2. Téléphone : en-tête de 423 px sur 844 à chaque onglet + classement amputé — priorité 1, coût négligeable
- Captures : `tel_tdb.png`, `tel_effectif.png`, `tel_classement_l1.png`, `tel_stade_l1.png`, `tel_classement_defile.png`.
- Mesures : la barre d'onglets finit à 423 px ; `A.tab()` remonte en haut, donc **chaque** onglet s'ouvre avec la moitié de l'écran occupée par le même en-tête (écusson, gros bouton, 5 chiffres). Le tableau du classement fait 739 px dans 324 px : on voit #, club, J, G… mais **pas les points**, qui sont la seule colonne qui compte.
- À obtenir (référence : appli L'Équipe / OneFootball / FotMob) :
  - En-tête téléphone compact ≤ 150 px : écusson 36 px + nom + une ligne de puces ; les 5 indicateurs deviennent une rangée défilante de pastilles (34 px de haut) ; le bouton « Jouer la journée » devient une barre fixe en bas d'écran (56 px, au-dessus de la zone de geste iOS, `env(safe-area-inset-bottom)`). Le contenu de l'onglet doit commencer avant y = 230 px.
  - Classement téléphone : colonnes `# · écusson+club · J · Diff · Pts` seulement (V/N/D/BP/BC dans une ligne dépliée ou en mode paysage) ; **Pts toujours visible**, en gras. Vérifiable : `table.scrollWidth <= parent.clientWidth` à 390 px.
- Ressources : aucune.
- Coût : négligeable (attention : pas de `backdrop-filter` sur la barre fixe, fond opaque).

### 3. Match en direct : passer d'un schéma à une « retransmission » — priorité 2, coût modéré
- Captures : `vitrine.png`, `ordi_match_l1.png`.
- Constat : le tableau de score est réussi (vrai bandeau télé) ; le terrain dessous est un aplat vert à bandes, sans profondeur, des maillots-icônes, des confettis carrés blancs qui ressemblent à du bruit. Le journal en dessous répète parfois deux fois la même ligne (« 6' ARRÊT Mathis Le Goff… » ×2, `ordi_match.png`) : à transmettre au testeur.
- À obtenir :
  - Pelouse « vue caméra haute » : très légère perspective (trapèze, bas plus large de ~12 %), tonte en damier clair/foncé à 6 % d'écart, vignettage doux, halo des 4 projecteurs en soirée (dégradé radial précalculé une fois dans un canvas hors écran, pas à chaque image). Bord du terrain : piste/bâche sombre + panneaux LED des partenaires (noms déjà présents dans le jeu).
  - Joueurs : disque d'ombre portée + pastille ronde aux couleurs (ou le maillot actuel agrandi), numéro blanc ou noir selon contraste ; porteur du ballon souligné d'un anneau.
  - Confettis remplacés par des fumigènes/flashs dans les couleurs du club (quelques particules rondes floues), ou supprimés en mode allégé.
  - Bandeau des événements façon télé : barre basse avec minute dans un cartouche, icône SVG (but, carton, arrêt) à la place des étiquettes texte colorées.
- Ressources : texture d'herbe CC0 en option (`Grass004`/`Grass005` ambientCG, voir `catalogue_terrain.jpg`), réduite à 256 px en motif et colorée ; sinon tout en dégradés. Icônes de match : Tabler Icons (MIT) `ball-football`, `rectangle-vertical` (carton), `hand-stop`.
- Coût : modéré si le fond (pelouse + halos + panneaux) est dessiné **une seule fois** dans un canvas hors écran puis copié (`drawImage`) à chaque image ; fort si les dégradés sont recalculés à chaque image. À faire valider par le technicien fluidité (mesure `liveshots.py` : ms/image actuel à garder sous ~2 ms).

### 4. Unifier l'iconographie et les chiffres (emoji → icônes au trait) — priorité 2, coût négligeable
- Captures : `ordi_finances.png` (🤝 dans le titre, 👕 🔢 💰 dans le tableau des emplacements), `ordi_mercato.png` (🕵 « Cellule de recrutement »), à côté des icônes au trait des onglets ; chiffres « 36 k€ » et « 5795 € » côte à côte dans la même rangée.
- À obtenir : zéro emoji dans l'interface du jeu (hors 🐞/🧪 de la trousse de test) ; une seule famille d'icônes au trait 1,75 px, celle déjà utilisée par les onglets (style Lucide/Tabler). Montants : même règle partout dans une rangée d'indicateurs (≥ 10 000 → k€, sinon arrondi à la centaine avec espace fine insécable).
- Ressources : Lucide (ISC) ou Tabler Icons (MIT) : `handshake`, `shirt`, `binoculars`/`search`, `coins`, `trophy`, `megaphone`. À inclure en SVG en ligne (sprite `<symbol>`), pas de dépendance réseau.
- Coût : négligeable.

### 5. Stade vu du ciel et bilan de saison : plus de matière, moins de schéma — priorité 3, coût modéré (rendu ponctuel)
- Captures : `ordi_stade_l1.png`, `tel_stade_l1.png` (tribunes vert foncé parsemées de points blancs : on lit du bruit, pas une foule ; tribunes de la même couleur que la pelouse ; trois panneaux blancs vides à droite ; stade de L1 encore « Stade municipal 12 000 places »), `ordi_fin_saison.png`, `tel_fin_saison.png` (« 18ᴱ » : l'exposant passe en capitale avec la police d'affichage ; courbe de la saison minuscule, 3 graduations, aucune annotation).
- À obtenir :
  - Stade : gradins en béton gris chaud (#5d5a55 → #7a766f) avec rangées, sièges aux couleurs du club en motif, toiture semi-transparente sombre sur les tribunes couvertes, foule en points de 2 couleurs (club + neutres) **densité = affluence**. Parkings/buvette en matières (asphalte, bâche) plutôt qu'en rectangles vides ; emplacement vide = contour pointillé + libellé « À construire ».
  - Bilan : exposant en minuscule (`<sup>` hors `text-transform`), courbe du classement sur toute la largeur avec zones colorées (Europe / maintien / relégation) et 3 annotations (meilleure place, pire place, journée de bascule).
- Ressources : `Concrete034`, `Concrete042A` (ambientCG CC0) en petit motif 128 px pour les gradins, `concrete_floor_worn_001` (Poly Haven CC0) pour le parvis ; `catalogue_terrain.jpg`.
- Coût : modéré mais ponctuel (SVG/canvas statique dessiné à l'ouverture de l'onglet). Garder les motifs ≤ 128 px pour le poids de la page.

## Ce qui est bien et à garder
Typographie Big Shoulders + Barlow (sérieuse, très « stade »), tableau de score du match, en-tête aux couleurs du club, écussons générés, cartes à filets fins, prédiction V/N/D en barre, accueil avec l'échelle des divisions.

## Commun au studio
- Polices chargées : Big Shoulders Display (500-900, titres), Barlow (400-700, texte), JetBrains Mono (500-700, chiffres). Toutes OFL. **Dépendent de Google Fonts** : hors ligne / app de bureau / réseau filtré, on retombe sur Arial Narrow/Impact, ce qui change tout le caractère. Proposition commune : embarquer les woff2 latin + latin-ext en base64 (≈ 150-200 Kio pour ces 10 graisses, à réduire aux graisses utilisées).
- Palette dominante : #0c1410 (nuit), #13201a (pelouse sombre/carte), #2b4034 (filets), #e9efe5 (craie, texte), #f4c430 (projecteur, action), + #5ccf88 / #ff6a5c (bon/mauvais).
- Icônes : SVG au trait dans les onglets, mais emoji ailleurs (à unifier, cf. 4) ; sons : non examinés ici.
- Graphiques et tableaux : tableaux à filets, en-têtes en capitales espacées, colonnes chiffrées à droite ; graphiques fins une couleur (jaune) sur fond sombre — bonne base de « style tableau » pour Wall Street et Cage & Gloire.
- Question pour Victor : « Pour toutes les interfaces du studio (hors 3D), préfères-tu (a) icônes au trait SVG uniquement, (b) emoji partout, (c) mélange au cas par cas ? » Recommandation : **(a)**, plus adulte et identique sur Mac et téléphone (les emoji changent de dessin d'un appareil à l'autre).

## Non fait
- Pas de capture du mercato en négociation ni du profil joueur (sélecteur introuvable dans mon script).
- Pas de capture en densité ×2 (Retina) : le canvas du match gère déjà `devicePixelRatio` (≤ 2).
- Pas de mesure de fluidité (rôle du technicien).
