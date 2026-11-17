# Couronnes & Complots — revue artistique (16-17/11)

Construction : `node build.mjs` OK (230 Ko). Captures Playwright à graine fixe (777), 0 erreur JS.
Captures dans `/home/claude/art/couronnes-et-complots/` : `ordi_*.png` (1280×800), `tel_*.png` (390×844), `vitrine.png` (carte, manche 10, Azur réclame la Couronne).
Écrans : accueil, debut_politique (Conseil), fiche_territoire (infobulle), attaque_visee, combat_des, combat_apres, combat_ia, conseil, ordre_du_jour, milieu (+ ordi_milieu_zoom, tel_carte_zoom), fin, fin_chronique.

**Attention polices** : depuis le bac à sable, fonts.googleapis.com est bloqué (403). Sans rien faire, le jeu s'affiche en Georgia/serif (versions dans `work/sans_police/`). Mes captures principales ont été faites en servant les vraies polices (IM Fell English SC, IM Fell English, Alegreya, tirées de @fontsource via npm). Conséquence : **les références `references/normale` ont été prises sans les polices du jeu** (voir `grand_zoom.png` : titres en serif ordinaire) ; elles ne montrent pas ce que voit Victor.

## Jugement d'ensemble
Bonne base, nettement au-dessus d'un « jeu de plateau web » : carte de cartographe sur table de noyer, cadre gravé, rose des vents, noms en italique Fell avec halo, écus colorés, bandes de bord de province façon carte ancienne, panneau sobre et chaud. Cohérent entre écrans (même cuir sombre + parchemin). Ce qui tire encore vers le « numérique / enfantin » : les aplats saturés hachés de rayures régulières, les écus plats à dégradé, les petits pictogrammes de relief (^ et ≡) qui deviennent des gribouillis au zoom, les dés en carrés CSS, et sur téléphone une carte réduite à un bandeau.

## Changements classés

### 1. Téléphone : rendre la carte au joueur — priorité 1, coût négligeable
- Capture : `tel_milieu.png`, `tel_debut_politique.png`, `tel_combat_des.png`.
- Problème : à 390×844 la carte occupe ~255 px de haut (30 % de l'écran), le panneau prend 60 %. Le bandeau de dés s'intercale sous la carte et pousse le panneau. La barre des Maisons est coupée (« Azur » tronqué, défilement horizontal). Le sélecteur de vitesse et les boutons texte de l'en-tête prennent une ligne entière.
- À obtenir : carte ≥ 55 % de la hauteur (≥ 470 px à 844) ; panneau en tiroir bas à poignée (replié : titre de phase + bouton principal ; déplié : contenu actuel), comme le tiroir parchemin de Couronnes & Lignées (`couronnes-et-lignees/references/guerre.png`). Les dés en surimpression dans le coin bas de la carte (comme sur ordinateur), pas dans le flux. Barre des Maisons : 4 écus de 28 px + nombre de territoires, sans défilement (les détails dans la fiche). En-tête sur une seule ligne : titre + 3 icônes.
- Vérifiable : `tel_*` → hauteur visible du `#board` ≥ 470 px ; aucune barre de défilement horizontale dans `#pbar` ; 0 nom couvert.
- Ressources : aucune (motif de tiroir de C&L).

### 2. Matière de la carte : du lavis sur papier plutôt que des aplats rayés — priorité 1, coût modéré
- Capture : `ordi_milieu_zoom.png` (rayures horizontales/verticales, points, couleurs pleines), essai : `essai_lavis_avant_apres.png` (à droite : teinte à 42 % + hachures à 25 %, injecté en CSS).
- Problème : chaque Maison = couleur saturée + motif mécanique (rayures parallèles parfaites, pois). Au zoom ça lit comme un clipart vectoriel. L'essai montre que le lavis plus léger rend immédiatement la « carte enluminée », mais Azur vire au gris et se confond avec Sinople : il faut revoir la palette, pas seulement l'opacité.
- À obtenir : aplats en lavis d'aquarelle (teinte claire au centre, plus dense en bord de province — la bande de bord existe déjà, la garder), grain de papier visible à travers, hachures supprimées ou réduites à une hachure à la plume irrégulière (traits de longueur et d'épaisseur variables) uniquement pour distinguer les Maisons sans couleur. Palette des Maisons à recaler pour un lavis : Vermeil #b8463a, Azur #2f4f8a (indigo, plus profond), Sinople #3e7a4e, Or #c49a2c, Pourpre #6b3f86 ; contrôle : écart de luminance entre deux Maisons voisines ≥ 15 % et test daltonien (les partitions d'écu restent le repère sans couleur).
- Ressources : ambientCG **Paper006** (papier kraft lisse) ou **Paper005** (froissé, plus marqué) — `curl -L -A valdragon-asset-tool/1.0 "https://ambientcg.com/get?file=Paper006_1K-JPG.zip"`, couleur seule, désaturée, cuite UNE fois en tuile 512 px (même méthode que `bakeTextures`/`bakeTable`), posée sous `#tint`. Planche : `catalogue_papier.jpg`.
- Coût : modéré. Ne PAS utiliser `mix-blend-mode: multiply` en direct sur `#tint` (calque composé en plus, cher sur Iris Plus pendant les zooms) : précalculer les couleurs de lavis et cuire le grain dans l'image de fond. À mesurer avec `outils/perf.py` (référence `mesures/perf_v5.json`/v8) → signaler au technicien fluidité.

### 3. Pions et symboles : écus émaillés et relief gravé — priorité 2, coût négligeable
- Capture : `ordi_milieu_zoom.png`, `tel_carte_zoom.png`.
- Problème : les écus sont plats (dégradé + reflet en bande), le chiffre posé dessus en blanc ; à côté de la typo Fell, ils font « icône d'application ». Les pictogrammes de relief (^ montagnes, ≡ marais, ∩∩ collines, sucettes-arbres) sont trop petits et trop simples : au zoom ×2,6 ce sont des gribouillis.
- À obtenir : écu à bordure métallique biseautée (or pour la Maison du joueur actif, étain pour les autres : deux traits clair/sombre de 1 px), champ émaillé avec léger grain, petite ombre portée cuite dans le symbole (pas de filtre CSS), chiffre dans un cartouche parchemin sous la pointe ou dans un médaillon, plus lisible que le blanc sur couleur. Ajouter un meuble héraldique par Maison (fleur, tour, coquille…) en plus de la partition : `couronnes-et-lignees/jeu/art.js` (`CHARGES`, `shieldSVG`) les a déjà dessinés. Relief : montagnes en gravure (contour + 3-4 hachures d'ombre côté est), forêts en bouquets de 3 arbres à la plume, marais en touffes de roseaux ; 1,5× plus grands, réutilisés par `<symbol>/<use>`.
- Ressources : `couronnes-et-lignees/jeu/art.js` (meubles héraldiques, SVG du dépôt). Pas de CC0 pertinent chez Poly Haven/ambientCG pour des pictogrammes gravés : à dessiner en SVG.
- Coût : négligeable (SVG statique, `<use>`).

### 4. Polices embarquées (et références à refaire) — priorité 2, coût négligeable
- Capture : `work/sans_police/ordi_debut_politique.png` vs `ordi_debut_politique.png`.
- Problème : les 3 polices viennent de Google Fonts. Hors ligne, dans un réseau filtré, ou dans nos outils, le jeu tombe en Georgia : titres sans petites capitales, noms de territoires sans l'italique Fell — la moitié de l'identité. Les références visuelles du jeu sont dans cet état.
- À obtenir : woff2 latin intégrés en base64 dans le build (comme `couronnes-et-lignees/jeu/fonts.css` et `trone-de-braise/jeu/polices/`) : IM Fell English SC 400, IM Fell English 400 + italique, Alegreya 400/600/700 + italique 400. Poids ≈ 270 Ko de woff2 (≈ 360 Ko en base64) ; on peut sous-ensembler (pyftsubset, latin + €/♛/⚜) pour descendre vers ~150 Ko. Puis refaire `references/normale`.
- Ressources : `@fontsource/im-fell-english-sc`, `@fontsource/im-fell-english`, `@fontsource/alegreya` (SIL OFL 1.1 — pas CC0 mais libre, licence à joindre). Copies déjà tirées dans `/home/claude/art/couronnes-et-complots/work/fonts/` (`gf.css` = CSS prête, base64). Alegreya existe déjà dans C&L (`fonts.css`).
- Coût : négligeable (page +~0,3 Mo, lue une fois).

### 5. Combat et fin de partie : du poids et de la cérémonie — priorité 3, coût négligeable
- Capture : `ordi_combat_des.png`, `tel_combat_des.png`, `ordi_fin.png`, `tel_fin.png`.
- Problème : les dés sont des carrés CSS rouges/gris à points blancs, sans volume ; le bandeau « Attaque / Défense » est une boîte grise. La fin de partie annonce un sacre avec un simple titre et un graphique de tableur (traits pleins/pointillés, axes 0/14/27).
- À obtenir : dés en os/ivoire (attaque) et corne sombre (défense) : arêtes arrondies, faces légèrement bombées (dégradé radial), points creusés (ombre interne), petite rotation aléatoire ±8° et rebond de 250 ms au lancer. Fin : grand écu du vainqueur (96 px) surmonté de la couronne, sceau de cire rouge avec l'initiale, bandeau « Maison Azur règne sur Valdorre » en Fell SC ; chronique tracée à l'encre brune sur le parchemin (traits légèrement irréguliers, couleurs de Maison en lavis), repères en médaillons gravés plutôt qu'emoji dans des cercles.
- Ressources : sceau et couronne en SVG (le blason de l'accueil existe déjà) ; aucune image lourde.
- Coût : négligeable (une animation courte, CSS transform).

## Petites remarques (hors classement)
- Sur ordinateur, au zoom, les boutons + − ⤢ couvrent le nom « Ostrel » (`ordi_milieu_zoom.png`) — déjà noté au cycle 14 pour le téléphone.
- Au zoom, les halos blancs pleins autour des écus sélectionnés (`ordi_milieu_zoom.png`, à gauche : Ravenne) sont trop durs : anneau doré fin + lueur douce.
- Le journal du tour IA est affiché deux fois (carte « Maison X joue » + journal en bas du panneau, `ordi_milieu.png`).
- Icônes mêlées : emoji (🔥 🗡 👑 🎲 🐞 🧪 🔇) dans le journal et l'en-tête, SVG ailleurs ; sur Mac les emoji couleur jurent avec la gravure. Préférer des pictogrammes SVG monochromes or/encre.
- Pas de fiche de territoire au toucher : l'infobulle ne s'ouvre qu'au survol de la souris (`mousemove`). Sur téléphone, la fiche (`tel_fiche_territoire.png`, forcée par script) n'apparaît jamais en jeu → à transmettre au game designer (appui long ou 2e appui).
- Bonne nouvelle : 0 erreur JS sur 2 parties complètes (16 manches) et deux tailles.

## Commun au studio
- Typographies réellement chargées (avec réseau) : IM Fell English SC (titres), IM Fell English (carte, italique), Alegreya (texte). C&L : UnifrakturMaguntia + Alegreya + Alegreya SC (embarquées) ; Trône de Braise : Grenze Gotisch + Alegreya Sans (embarquées). **Alegreya est le dénominateur commun** : un paquet commun `outils-communs/polices/` (woff2 + CSS base64 + OFL) éviterait la dépendance réseau partout.
- Palette dominante : table #17110d, panneau #211812, ligne #4a3828, or #d4a548, parchemin #efe1bf, encre #f1e5cc (+ sang #a8382f). Très proche de C&L (parchemin + or) — une palette « médiéval sombre » commune est à portée.
- Icônes : mélange emoji + SVG. Textures : noyer et papier calculés en feTurbulence (cuits une fois) ; Bannières a `jeu/tex/bois.jpg`, `pierre.jpg`. Sons : synthétisés (Web Audio), coupés par défaut ; Bannières/Valdragon ont des bruitages Kenney CC0 réutilisables (dés, parchemin).

**Question pour Victor** : pour les icônes de tous les jeux médiévaux du studio (Couronnes & Complots, Couronnes & Lignées, Bannières, Trône de Braise, Sedes Petri), préfères-tu
(a) des emoji (couleur, varient selon l'appareil), (b) des pictogrammes gravés monochromes or/encre dessinés pour le studio, ou (c) un mélange ?
Recommandation : (b), un jeu commun d'environ 30 pictogrammes SVG (couronne, épée, sceau, dé, bourse, tour, parchemin, crâne…) dans `outils-communs/`.

## Ce qui n'a pas pu être fait
- Google Fonts inaccessibles depuis le bac à sable : contourné en servant les mêmes polices (fontsource) ; les références du jeu restent sans polices.
- Pas de diplomatie « pacte » capturée en modale (la proposition passe par un menu du panneau) ; capturés : Conseil/vote, ordre du jour, révolte (tray « Intrigue »), trahison dans le journal.
- Pas de mesure de fluidité de l'essai de lavis (seulement une capture) : à mesurer par le technicien fluidité.
