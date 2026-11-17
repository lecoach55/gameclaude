# Wall Street, séance par séance : revue artistique (16/11)

Construction : `sh wallstreet/jeu/build.sh` → `bourse.html` (248 Kio), OK, aucune erreur JS pendant les captures.
Captures : `/home/claude/art/wallstreet/` : `ordi_*.png` (1440×900), `tel_*.png` (390×844, ×2), `vitrine.png` (1280×800).
Réserve : Google Fonts est bloqué dans le bac à sable, les captures montrent donc les polices de secours (aucune police du jeu chargée), pas Bricolage, Schibsted ni Azeret.

## Verdict d'ensemble
La base est saine et déjà adulte sur ordinateur : papier « billet de banque », encre marine, or, vert et rouge de bourse bien dosés, chiffres tabulaires, tableau à palettes pour la date, mode sombre propre. Trois choses tirent encore vers l'enfantin ou l'amateur : (1) sur téléphone, l'écran est mangé par l'en-tête et les notifications ; (2) les illustrations d'événements et les avatars sont des pictos « flat » aux couleurs bonbon ; (3) la ville du bandeau ressemble à un dessin animé (soleil rond, nuages en bulles, fenêtres en damier). Le graphique d'un titre, cœur du jeu, n'a pas encore la précision d'une vraie application de bourse.

## Changements classés

### 1. Téléphone : rendre l'écran au jeu (priorité 1, coût négligeable)
Captures : `tel_marche.png`, `tel_graphique.png`, `tel_portef.png`, `tel_ordre.png`.
Problème : l'en-tête collant fait 182 px CSS sur 844 (logo + titre, puis date, puis deux boutons ronds, sur 3 lignes). En bas, la barre (≈ 70 px), la carte « Bilan de la semaine » (≈ 85 px) et jusqu'à deux toasts empilés (≈ 110 px) recouvrent le contenu. Il reste ≈ 40 % de l'écran pour le jeu, et les toasts masquent le formulaire d'achat et le graphique (`tel_graphique.png`).
À obtenir (vérifiable) :
- en-tête téléphone ≤ 56 px sur une seule ligne : logo 28 px, date au format court sur le tableau à palettes (« MAR 19 JANV »), bouton ☰ ; le bouton son passe dans le menu ;
- toasts : un seul visible à la fois, une ligne, posé juste au-dessus de la barre du bas, disparition en 3 s, jamais par-dessus un champ de saisie actif ;
- la carte « Bilan de la semaine » se replie en pastille dans la barre du bas (« Sem. +2,2 % · 4e ▼1 ») et ne s'ouvre qu'au toucher ;
- critère : ≥ 70 % de la hauteur visible pour le contenu à l'état normal ; le bouton « Acheter » toujours visible sans scroll quand la fiche est ouverte.
Ressource : aucune (CSS). Fluidité : négligeable (le `backdrop-filter` de l'en-tête peut même être retiré sur téléphone, ce qui fait un gain).

### 2. Événements, podium et rivaux : quitter le « flat bonbon » (priorité 1, coût négligeable)
Captures : `ordi_evenement.png`, `tel_evenement.png`, `ordi_bilan.png`, `tel_bilan.png`.
Problème : les 14 illustrations `ART` de `game.js` (camion blanc sur bandeau saumon, fusée, montagne, pièce…) utilisent la palette « Flat UI » (#f39c12, #6c5ce7, #e8735a, #74b9ff) étrangère au reste du jeu ; les avatars du podium sont des bonshommes de dessin animé. C'est le moment le plus enfantin du jeu, et il tombe au moment fort (événement, fin d'année).
À obtenir :
- événement en « dépêche d'agence » : bandeau couleur encre (#16233a, ou #0a0f19 en sombre), filet or, catégorie en petites capitales (« SOCIAL · AUTOMOBILE »), heure de la dépêche en Azeret Mono, valeurs touchées en pastilles de cotation (GM −2,1 %), pictogramme au trait fin 1,5 px couleur or à 48 px au lieu de l'illustration pleine ;
- podium : marches sobres (laiton, argent, bronze mat, pas de dégradé brillant), portraits des rivaux en buste, en costume, en duotone encre/papier (gravure de billet), cohérents avec le « papier de billet de banque » du thème ; les mêmes portraits dans le bandeau et l'onglet Rivaux.
Ressources : icônes Lucide (ISC) ou Phosphor (MIT), SVG en ligne, ≈ 0,5 Ko pièce ; portraits par la chaîne du studio (`bannieres/outils/studio/portraits.py` + `pack_portraits.py`, mannequins Mixamo) rendus en duotone 96 px webp ≈ 6-8 Ko chacun (crédit Mixamo à ajouter), ou à défaut monogrammes gravés.
Fluidité : négligeable.

### 3. Le bandeau-ville : de l'illustration enfantine à une vraie skyline (priorité 2, coût aujourd'hui modéré, ensuite plus faible)
Captures : `vitrine.png`, `ordi_marche.png`, `tel_marche.png`.
Problème : soleil en disque avec halo, nuages en bulles, bâtiments en rectangles plats avec grilles régulières de fenêtres jaunes : on dirait un jeu pour enfants. En plus le canevas `#sky` est redessiné à 30 img/s en continu (`skyLoop` dans `game.js`, une `fillRect` par fenêtre), même quand rien ne bouge : coût permanent sur MacBook Intel et batterie de téléphone. À signaler au technicien fluidité.
À obtenir :
- trois plans avec perspective atmosphérique (arrière-plan bleu-gris voilé, plan moyen, premier plan presque noir), silhouettes new-yorkaises (retraits Art déco, flèches, châteaux d'eau, antennes avec feu rouge clignotant), pas de nuages en bulles, lune ou soleil réduits à une lueur dans le dégradé ;
- fenêtres éclairées clairsemées et irrégulières (5-15 %, blanc chaud et blanc froid mêlés), reflet flou sur l'eau (East River) en bas ;
- la tour du joueur et celles des rivaux restent lisibles (seul repère de couleur : liseré du toit + étiquette), la mécanique ne change pas ;
- rendu : décor statique peint une fois dans un canevas hors écran, redessin seulement à chaque séance ; seuls le clignotement des antennes et le panneau lumineux bougent (≤ 4 img/s ou CSS). Plus de boucle à 30 img/s.
Ressources : dessin vectoriel maison (préférable : léger et coloré par le thème). Une photo CC0 a été cherchée (`catalogue_ville.jpg` : Poly Haven `canary_wharf`, `wide_street_01`) : déconseillé, c'est Londres, en projection panoramique, et lourd.
Fluidité : gain net après changement (de 30 redessins/s à quelques-uns par séance).

### 4. Graphique d'un titre crédible comme une vraie application (priorité 2, coût négligeable)
Captures : `ordi_graphique.png`, `tel_graphique.png`, `tel_ordre.png`.
Problème : graduations non rondes (215,63 / 198,88 / 182,14 / 165,39), aucun réticule ni lecture de valeur au doigt visible, case à cocher native bleue (seul bleu « système » du jeu), légende sur deux lignes sous le graphique qui mange la place sur téléphone, courbe un peu fine et dentelée en 1 an.
À obtenir :
- graduations rondes (pas 1-2-5 : 170, 180, 190, 200, 210) ; dernière valeur en étiquette colorée accrochée sur l'axe droit ;
- réticule vertical + infobulle date/cours au survol et au toucher maintenu ;
- volumes en barres discrètes (couleur `--line`) sous la courbe ; option ligne / chandeliers à partir de 3 mois ;
- trait 1,75 px, aire en dégradé 12 % → 0 ; moyenne 50 séances en tirets plus clairs ;
- légende en une ligne de pastilles cliquables (pas de case native) ; `accent-color:var(--ink)` partout.
Ressources : aucune. Fluidité : négligeable (canevas existant).

### 5. Typographie garantie et pastilles de valeurs (priorité 3, coût négligeable, +≈ 100 Kio)
Captures : `ordi_marche_long.png` (liste des 80 valeurs), `vitrine.png`.
Problème : les trois polices viennent de Google Fonts ; hors ligne ou si le lien est bloqué (cas du bac à sable), le jeu retombe sur Arial/Helvetica et le tableau à palettes sur une chasse fixe quelconque : l'identité disparaît. Les pastilles de valeurs (AAPL sur mauve pastel, etc.) ont des couleurs de bonbon sans rapport avec le secteur.
À obtenir : polices intégrées en woff2 sous-ensemble latin (Schibsted Grotesk 400/600, Bricolage Grotesque 700 étroit, Azeret Mono 600), ≈ 90-120 Kio en base64 ; pastilles en teintes de secteur désaturées (même famille que les points de secteur du panneau « Le marché aujourd'hui »), texte encre.
Ressources : Google Fonts, licence OFL (libre, redistribuable).
Fluidité : négligeable.

## Ce qui pourrait être commun au studio
- Typographies (déclarées, non vérifiables ici) : Bricolage Grotesque (titres, étroit), Schibsted Grotesk (texte), Azeret Mono (chiffres et tableau à palettes). Couple sobre et « presse financière » réutilisable pour Président de Club et les tableaux de gestion de Sedes Petri.
- Palette dominante : papier #eef0e8, surface #f8f9f4, encre #16233a, accent #1f3a5f, or #a67c2e, hausse #16784b / baisse #c0352b (sombre : #0f1726, #45c98c, #ff6d61).
- Icônes : mélange d'emoji (🐞, 🧪 dans le menu) et de SVG pleins « flat ». Proposition commune : un seul jeu d'icônes au trait (Lucide, ISC) pour tous les jeux à interface DOM/SVG.
- Sons : synthèse WebAudio (oscillateurs), pas de fichier.
- Graphiques : canevas maison ; une règle commune (graduations rondes, réticule, dernière valeur sur l'axe) servirait aussi à Président de Club et Cage & Gloire.

## Question à Victor (engage tout le jeu)
Pour le bandeau du haut, que préfères-tu ?
A) garder la ville illustrée mais en version sobre et réaliste (skyline new-yorkaise de nuit, statique, sans nuages de dessin animé) : recommandé, la mécanique « ma tour grandit » reste ;
B) une photo réelle de skyline (plus réaliste, mais plus lourde, figée, et la tour du joueur ne se voit plus) ;
C) supprimer la ville pour un bandeau « terminal » façon Bloomberg (chiffres, indices, mini-graphiques), le plus crédible mais le moins « jeu ».

## Non fait
- Polices du jeu non chargées dans le bac à sable : rendu typographique réel non vérifié.
- Le bouton ☰ rouvre l'écran d'accueil (`ordi_menu.png` = `ordi_accueil.png`) : pas de capture d'un menu distinct.
- Pas de mesure de fluidité (le coût de `skyLoop` est déduit du code, à mesurer par le technicien fluidité).
