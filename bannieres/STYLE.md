# Direction artistique de Bannières (Victor, 20/11/2026)

Victor a montré ses références (Heroes III et Heroes Olden Era), à ne pas recopier mais à égaler ou dépasser.
Aucune image n'est rangée ici : le dépôt est public et ces images ne sont pas libres de droits.

Il ne veut pas d'effet « jouet » (formes simples, propres et lisses). Il veut ceci :
- **Carte façon Heroes III** : chargée et dense. Des forêts de sapins serrées, des montagnes déchiquetées (brunes, ou enneigées en haut), des rivières sinueuses, des routes pavées. Beaucoup de petits objets partout : fleurs, souches, tas de ressources. Les verts sont profonds et saturés, le contraste fort, chaque objet porte une ombre nette.
- **Bâtiments** : plusieurs tours à flèches, posés sur une butte rocheuse, chargés de détails. Pas de cubes ni de cônes nus.
- **Créatures et héros façon Olden Era** : stylisés mais très détaillés. Métal poli avec liserés dorés, tissus aux couleurs franches (bleu roi, rouge, blanc), plumes, cuir, armures ornées, silhouettes fortes. Pour chaque unité, une version de base et une version améliorée plus dorée.
- **Écran de ville façon Heroes III** : panorama peint, bâtiments très détaillés, cadre d'interface riche (or, cuir).

Méthode : rendu dans Blender (Cycles, dans le cloud). Modèles Poly Haven CC0 ou relief procédural. Les images obtenues servent d'imposteurs sur la carte (`outils/blender/` : `imp_fort.py`, `montagnes.py`).

## Unités venues de Sketchfab (crédits obligatoires, CC BY 4.0)
Chaîne : recherche et import dans le Blender du Mac de Victor (pont MCP, clé Sketchfab dans le module) → export GLB dans ~/Documents/claude_blender → récupération par le pont → `outils-communs/blender/planche_sprites.py modele.glb dossier --id <unité> --comme-bannieres` → `outils/studio/pack.py dossier jeu/sprites3d.js --fusion`.
| Unité | Modèle | Auteur | Licence |
|---|---|---|---|
| ange | Corrupted Archangel Six Wings Boss (139d6f0185684ab9ae12fed7530c0696) | s8819296 | CC BY 4.0 |
| croise | The Forgotten Knight (d14eb14d83bd4e7ba7cbe443d76a10fd), --rotation 61 | dark_igorek | CC BY 4.0 |
| griffon | Griffin Non Animated (590f91391cea4443b167b35511845b17), --rotation 60 | ChristineDesigns | CC BY 4.0 |
| cavalier | 1964.88 Armor for Man and Horse (faca2ad557f64809b598c3a646a8804f), --rotation 90 | clevelandart | CC0 |
Attention : ne pas couper la sortie de pack.py avec « | head » (la fusion n'est alors pas écrite).
| piquier | Lord’s personal guard (b7cc646a8d8d4e768d978eb4fa52804f), --rotation 61 | Makkoy_tales | CC BY 4.0 |
| archer | Cult Member (0de7496d24ff4bef81a6937005ce34c1), flèches au sol retirées, --rotation 61 --hauteur 1.75 | DivyeSh.PanchAl | CC BY 4.0 |
| moine | Corrupted Monk - Ash-Grey Ritual Robes (b45845141ed74a0abc191ac528e3e869), --rotation 61 | s8819296 | CC BY 4.0 |
| gobelin | Goblin Warrior (852c928a166e471a8dc8e592ff25a21a), --rotation 61 | Batuhan13 | CC BY 4.0 |
| orque | Orc Warrior (21eaa407bf164cdea21135a1d1b2b8f3), socle pCylinder1 retiré, --rotation 61 | cmcentee72 | CC BY 4.0 |
| ogre | Green Ogre (e6e4c9a163c0457d9420562ff3bf9d82), --rotation 61 --hauteur 2.0 | s8819296 | CC BY 4.0 |
| cyclope | Cyclops Rig (e5cc86878c314f5bae6d7268bb7541d9), formes d'os retirées, --rotation 30 --hauteur 1.8 | SuperKapoo913 | CC BY 4.0 |
| squelette | Skeleton animated (9210377c7a514cf6b48a31b9d3991ff3), --rotation 30 --hauteur 1.45 | danielmclogan | CC BY 4.0 |
| liche | Lich (4ad4ece50273473ba1d843797b8f4fa6), --rotation 30 --hauteur 1.8 | Spinnee | CC BY 4.0 |
| vampire | Albine Vampire (96dc3c5227f746ab988e8fcbdb3f611b), --rotation 30 --hauteur 1.7 | Pebegou | CC BY 4.0 |
| centaure | Centaur (564621800fb24beaa6d49167034ae47c), sol et plantes retirés, --rotation 30 --hauteur 2.0 | grigoriyarx | CC BY 4.0 |
| elfe | Elf Archer (0897039da4ba44a7b398b812d9dcf354), --rotation 30 --hauteur 1.6 | infant2k4 | CC BY 4.0 |
| dragonvert | Green Dragon (62b512c628da4b16ba4a82cb0acdbc62), --rotation 120 --hauteur 2.6 | lionkinen | CC BY 4.0 |
| nain | Dwarf Warrior (b9fcc240bc0642649d39a8ca845b56aa), pose figée dans Blender (convert), redressé −90° en X, --rotation 61 --hauteur 1.3 | Northcliffe | CC BY 4.0 |
| treant | Treant - Week 2 (aa60f5de1ed94b2e96e46ad08cde4d5a), armature figée (POSE=1, /tmp/fige.py), --rotation 61 --hauteur 2.4 | Batuhan13 | CC BY 4.0 |
| chevnoir | Stylized Wraith Knight (3ebe97b7ffe248708ebe877eff81eab3), socle retiré, --rotation 180 --hauteur 1.9 | Babevid | CC BY 4.0 |
| dragonos | Bone Dragon (22da5db4892540f8ba7e3bbcbfabafe7), matériau non éclairé remplacé et texture désaturée couleur os (outils/blender/eclaire.py 0.15 1,.95,.85), --rotation 45 --hauteur 1.7 | witsanusuperball | CC BY 4.0 |
| spectre | Spectral Reaper (d5d445e5addf4f68a41967597bf543cc), --rotation 61 --hauteur 1.9 | Rignu | CC BY 4.0 |
| zombie | Cursed Undead Soldier Rig (b2e39de76b834d978adee5716aec814d), contrôles du squelette retirés, figé à l’image 5 de « Slash » (POSE=5 fige.py), --rotation 61 --hauteur 1.6 | SuperKapoo913 | CC BY 4.0 |
| roc | Eagle Neutral Flying Pose (1d1ca28411b942038ee0a5bd66e11417), --rotation -60 --hauteur 2.4 | s8819296 | CC BY 4.0 |
| loup | Black Wolf – Pale-Eyed Fierce Dark Predator (d14d5e0957f5450eb025a18635bb0d77), --rotation 61 --hauteur 1.3 | s8819296 | CC BY 4.0 |
| pegase | mythical winged horse (ade90f9948bf4a09b600b11cf487375c), --rotation 61 --hauteur 2.2 | rakeshsingh.tce | CC BY 4.0 |
| licorne | White Horse Free (ab8c0196f8994eb895be3bc7e4209521), pose figée (convert) + corne torsadée ajoutée dans Blender, --rotation 61 --hauteur 1.9 | kenchoo (corne : nous) | CC BY 4.0 |
| behemoth | Behemoth (b8675a25e9134ce5b82a6a61e94fd0e7), --rotation 61 --hauteur 2.4 | Vasian-Digital3D | CC BY 4.0 |
| chevloup | loup noir (s8819296) + gobelin (Batuhan13) assemblés par outils/blender/compose_cavalier.py -90 0.45, --rotation 61 --hauteur 1.7 | s8819296, Batuhan13 | CC BY 4.0 |

Remarques : les modèles à armature sortent souvent couchés ou minuscules ; figer la pose (convert dans Blender, ou fige.py) puis redresser. Le pont Blender du Mac ne doit pas servir à des aperçus (« look » rendu) : ils le bloquent plusieurs minutes. Les châteaux des 4 factions : `FORT_STYLE=bastion|horde|necropole|sylve` dans `outils/blender/imp_fort.py`.


## Bâtiments de ville (21/11) — `outils/blender/imp_glb.py` (vue à 8°, rotations entre parenthèses)
| bâtiment | modèle Sketchfab (UID) | auteur | licence |
|---|---|---|---|
| mairie et suivantes (Bastion, Sylve) | Medieval house (904038d693b945d4843decee87fb0eb5), 215° | sketh | CC BY 4.0 |
| habitations à pilotis | Medieval house (4ec56df1c24d422ea85d1cfbf21bbe8c), 145° et 35° | illya2878 | CC BY 4.0 |
| maisons de pierre | Medieval house (a8ad9d2723444b1b8ac054c232e61f12), ±35° | DoniTodorov | CC BY 4.0 |
| taverne, maison au lierre | Medieval House (1bea14d1a8a34b0b86a5374f256b47bf), socle retiré, ±35° | pierpapiercizo | CC BY 4.0 |
| Nécropole : habitations, taverne, mairie | Prieskorn Crypt (d873fa301fa449b99af9d33ec1f7717e), 0° | cadbimgroup | CC BY 4.0 |
La Horde garde ses yourtes construites (la hutte essayée gardait son socle de terre). Château au centre : `imp_fort.py` avec `FORT_ELEV=8 FORT_R=1400`.

## Lieux de la carte (21/11) — `imp_glb.py` avec `FORT_ELEV=52 FORT_R=700`
| lieu | modèle Sketchfab (UID) | auteur | licence |
|---|---|---|---|
| moulin | Windmill (92f751dab03e4a2792348a21b3673ec1), sol retiré, −30° | BlueHour | CC BY 4.0 |
| mines (sauf scierie) | Abandoned Mine Entrance Portal (3610d41ccd0e4b8e834ec73cb61a70f6), 0° | s8819296 | CC BY 4.0 |
| écurie | maison de pierre de DoniTodorov, 35° | DoniTodorov | CC BY 4.0 |
| tour de guet | Octagonal Medieval Stone Tower (b6d6934d02c44b01bf3cf1b0b3f2a994), 0° | Sereib | CC BY 4.0 |

## Harmonisation (21/11 soir)
- Arbres, sapins, buissons et jeunes arbres « peints » façon Heroes : `outils/blender/arbres_peints.py` (houppiers ronds bosselés, feuillage procédural, rendu Cycles). Carte : `ELEV=52 SUF=h` ; villes : `ELEV=8 SUF=b` ; petits végétaux : `QUOI=petits`. Remplacent les imposteurs Poly Haven dans `jeu/imp` (même noms) ; pour les buissons, `haut` de imp.json est corrigé pour garder la largeur d'origine.
- Touffes et végétation restantes éclaircies (moyenne visée ≈ 88) pour supprimer les taches noires.
- Forêts : 5-6 arbres plus grands par case au lieu de 9-12 petits.
- Essais écartés : filtre « peinture » Kuwahara (taches), rendu AgX sur la carte (sol délavé).
- Montagnes « peintes » (21/11 soir) : `PEINT=1 montagnes.py /home/claude/peint sortie [neige]` (roche procédurale, arêtes plus marquées, AgX contraste moyen-fort).
- Herbe du sol (`tex3d/sol_herbe.jpg`) adoucie (flou 1,2 px) et plus colorée (saturation ×1,3).
- Scierie de la carte : maison à pilotis (illya2878) rendue à 52°.

## 23/11
- Carte plus lumineuse (exposition 1,4, lumière du ciel 0,88, vignettage 0,18) ; eau bleue avec écume (shader de l'eau dans rendu3d.js).
- Piles de ressources : `outils/blender/piles.py` (or, bois, minerai, soufre, cristal, gemmes, mercure).
- Petits lieux : `outils/blender/lieux_peints.py` (puits, sanctuaire, fontaine, autel, obélisque, pierre runique).
- Villes : `outils/blender/ville_peints.py` avec `ELEV=8 ROT=32` (tour de mage, marché, grenier, hutte de la Horde).
- Créatures : liseré sombre et étalonnage commun appliqués à toutes les planches (`planche3D` dans sprites.js).
- Terrains adoucis (flou léger) et plus colorés.
- Essai écarté : liseré sur les imposteurs du décor (assombrit les forêts).
- À surveiller : `outils/villes_clics.py` ne retrouve plus les créatures devant les habitations depuis la v40 (les bâtiments, eux, restent bons) — probablement l'outil (différence de rendus), à vérifier.

## v50 (23/11) — rochers peints
- `outils/blender/rochers_peints.py` (ELEV=52 SUF=h pour la carte et le combat, ELEV=8 SUF=b pour la ville) : blocs arrondis à facettes, fissures fines, mousse sur le dessus, même soleil que le reste. Remplacent les photos Poly Haven `roc_a..d` (trop réalistes à côté des arbres et montagnes peints).
- `haut` des entrées roc_* de imp.json recalé pour garder l'encombrement des anciens rochers ×1,4 (planImp : échelle = ht/haut).
- Essai rejeté : soleil plus haut (≈ 55°) sur la carte, gain quasi nul et image un peu plus terne.

## v51 (23/11) — Horde en rondins
- `outils/blender/horde_peints.py` (ELEV=8) : porte fortifiée `v_porte_h` (deux tours de guet, battants cerclés de fer, crânes, bannière) et tour de guet `v_tour_h`, rendues avec les matériaux de ville_peints.py.
- Ville de la Horde : les tours carrées de l'enceinte deviennent des tours de guet Blender ; la palissade s'ouvre pour la porte ; l'hôtel de ville (conseil → capitole) devient une grande hutte Blender (v_hutte ×2,6) au lieu de la maison carrée.
- Essai rejeté : sol « terre rude » pour la Horde (différence invisible).
- v52 : allée de la Nécropole assombrie la nuit (essai rejeté : lumières de nuit plus fortes, gain invisible).

## v54 (23/11) — vérifications et harmonie
- Mesures réelles sur le Mac de Victor (Iris Plus, navigateur intégré, page servie par raw.githack.com depuis le dépôt) : calcul d'un tour d'ordinateur 26-69 ms, panorama de ville 0,8 s (0,3 s à chaud) → la mémoire des panoramas (v53) évite cette attente.
- `villes_clics.py` réparé (vide PANO_CACHE, ignore les pixels qui changent d'un rendu à l'autre) : il a révélé des créatures cachées derrière les maisons de devant. Les créatures des habitations du rang du milieu, du fond (hab7) et hab6 se tiennent maintenant sur la place (`PLACE` dans panoVille) : 28/28 visibles et cliquables en 1280×800 (13/28 avant) ; 21/28 au téléphone (bords de l'écran).
- `outils/blender/touffes_peintes.py` : touffes d'herbe peintes, claires, à fleurs (remplacent les touffes photo sombres).
- `piles.py` : mercure = bonbonne de verre teinté dans une caisse de bois (n'est plus une tache blanche).

## v55 (23/11) — scierie, puits, ressources
- `outils/blender/lieux_peints2.py` : scierie peinte (hangar de planches, roue à aubes, scie circulaire, rondins) à la place de la maison à pilotis ; puits au toit plus haut (on voit l'eau) ; vue de trois quarts (`tourner`).
- `piles.py` revu : couleurs franches (plus de verre laiteux ni d'émission délavée), monceau d'or, rondins couchés, minerai de fer sombre, soufre, rubis, gemmes taillées sur une pierre, mercure en caisse.
- Fougères sombres retirées des petites touffes de la carte.

## v56 (23/11) — terrains de combat
- `rochers_peints.py` VAR=s|n|l : grès du désert, rochers enneigés, basalte à fissures de lave (`rocT(ter,l)` choisit la variante sur la carte et en combat).
- `outils/blender/desert_peints.py` : palmier, cactus à bras, broussaille sèche (desert_a/b/c, h et b) à la place des arbustes photo.
- Combat sur la lave : sol de basalte sombre (couche lave seule), plus de palmiers, rochers de lisière plus petits.

## v57 (23/11) — arbres morts et acacias
- `desert_peints.py` QUOI=autres : `arbre_mort` (branches récursives, bois gris) et `acacia` (cime en ombrelle), h et b.
- Nécropole : arbres morts autour de la ville ; Horde : acacias de savane mêlés aux arbustes ; lave (carte/combat) : arbres morts. Plus aucun palmier ni cactus hors du désert.

## v58 (23/11) — bords de carte, lieux de trois quarts
- Au-delà du bord de la carte : noir (comme Heroes) au lieu d'une eau pâle répétée (`brume` : f × distance au bord quand bsN>1).
- `lieux_peints.py` ROT=30 : sanctuaire (temple de marbre blanc, toit de cuivre vert-de-gris, statue dorée), fontaine, autel, obélisque, pierre runique, antre, artefact vus de trois quarts ; `larg` d'origine gardée pour l'échelle.
- Pile de bois de trois quarts (on voit les bouts des rondins) ; désert : palmiers, cactus et broussailles seulement.

## v59 (23/11) — Sylve et mines
- `outils/blender/sylve_peints.py` (ELEV=8 ROT=32) : maison-arbre `v_cabane` (tronc à racines, plateforme, case ronde au toit vert, échelle, houppier) pour les habitations et la taverne de la Sylve.
- `outils/blender/mine_peinte.py` (ROT=25) : entrée de mine peinte (colline de rochers moussus, boisage, rails, wagonnet, lanterne) à la place du portail Sketchfab.

## v60 (23/11) — neige, mines selon le terrain
- `tex3d/sol_neige.jpg` adoucie (flou léger, contraste ½, plus claire, reflet bleuté) : neige nette au lieu d'un marbre gris.
- `mine_peinte.py` VAR=n|s|l : mines enneigées, de grès, de basalte ; choisies d'après le terrain de la case.
- Sylve : l'hôtel de ville devient une grande maison-arbre (v_cabane ×2,4).

## v61 (23/11) — marais
- `touffes_peintes.py` QUOI=roseaux : roseaux à quenouilles sur une petite flaque (`roseaux_a`), semés dans les marais à la place des troncs photo.
- `tex3d/sol_marais.jpg` un peu plus vert et plus clair.

## v62 (23/11) — châteaux selon le terrain
- `imp_fort.py` FORT_SOL=n|s|l : butte de neige, de sable ou de basalte (texture désaturée puis teintée) ; 12 images `fort_<fac>_h_<n|s|l>.webp`, choisies d'après la case du château (`fortImp(fac,sx)`). Page : 10,6 Mio.

## v63 (23/11) — Nécropole
- `outils/blender/necro_peints.py` (ELEV=8 ROT=28) : mausolée `v_mausolee` (pierre sombre, colonnes, grille, lueurs vertes, tombes) pour les habitations paires, entre les cryptes.
- Nécropole : uniquement des arbres morts ; premier plan (rochers, arbres) assombri pour la nuit.
- `ville_peints.py` : `view_layer.update()` avant la rotation (la dernière pièce gardait sinon sa taille 1×1×1).

## v64 (23/11) — ombres portées en combat
- `ombre3D` (sprites.js) : silhouette noire de la créature, couchée (transform 1,0,−.75,.32) vers l'arrière-droite, alpha .4, en plus de l'ombre de contact. `CB.sansOmbre` pour la couper.

## v65 (23/11) — portraits en ville
- Écran de ville (et éditeurs d'armées) : portrait du héros devant sa rangée, blason de la faction devant la garnison (`blasonVille`), comme dans Heroes.
- Essai rejeté : ombres portées des créatures sur la carte (panneau caché face au soleil) — aucune ombre visible dans le rendu, à reprendre.

## v66 (23/11) — lave rougeoyante
- Carte : fissures de lave rouge-orangé (émission (1,.16,.01)×1,8 au lieu de (1,.3,.03)×4, qui saturait en jaune-blanc), croûte plus sombre et plus brune ; petits arbres morts sur la lave au lieu des bûches photo.

## v67 (23/11) — écurie, huttes ; revue graphiste
- `outils/blender/ecurie_peinte.py` (ROT=−30) : écurie peinte (planches claires, chaume, enclos, abreuvoir, foin) à la place du modèle Sketchfab.
- Huttes de la Horde : défenses d'os et peau moins blanches (`ville_peints.py`).
- Revue graphiste (v66, ORANGE) — à faire ensuite, par ordre : 1) créatures Sketchfab trop « photo » et vampire en pose T (fige.py, eclaire.py) ; 2) sols photo neige/sable/eau à repeindre ; 3) rochers de lave en combat trop réguliers ; 4) maisons de ville Sketchfab, ciel HDRI et allée photo ; 5) tour de mage et marché identiques dans toutes les factions ; 6) huttes : défenses encore claires ; 7) sanctuaire, coffres et cristaux « jouet » ; 8) bâtons pâles flottants en combat sur la lave, ombres de palmiers sans arbre.
- v68 : rochers de lave à fissures rares et irrégulières (Voronoï large aux coordonnées déformées) ; plus de bûches photo flottantes en combat sur la lave (arbres morts seulement). Points 3 et 8 de la revue traités en partie.
- v69 : tours de mage propres à la Sylve (écorce, toit de feuilles, lueur verte) et à la Nécropole (pierre noire, lueur spectrale) — `outils/blender/tourmage_var.py`. Point 5 de la revue traité en partie (le marché reste commun).
- v70 : cristaux en prismes facettés irréguliers sur une pierre (piles.py).

## v71 (24/11) — sable et neige peints
- `outils/ressources/sols_peints.py` : textures raccordables générées (bruit périodique FFT) : sable à rides de vent et cailloux, neige à congères (crêtes blanches, creux bleutés, paillettes), avec cartes de relief `_n`. Remplacent les photos `sol_sable` (traces de pneus) et `sol_neige`.
- Combat sur la neige : couche secondaire = neige (plus de taches de terre).

## v72 (24/11) — maisons à colombages peintes, eau
- `outils/blender/colombages_peints.py` (ELEV=8 ROT=32) : trois maisons du Bastion (col_a/b/c : rez de pierre, étage en encorbellement à poutres sombres et volets verts, toit de tuiles rouges, pignons, cheminée, lucarne ou auvent) à la place des maisons Sketchfab (pierre/pilotis/lierre, toujours dans imp/ mais plus utilisées par le Bastion).
- Eau de la carte : scintillement plus rare et plus doux, vagues moins marquées.
- v73 : liche sans pose T — planche refaite avec l'animation du modèle (`planche_sprites.py liche_sf.glb … --comme-bannieres --rotation 30 --hauteur 1.8 --anim "idle=Take 001,atk=Take 001,hit=Take 001"`, puis pack.py --fusion). La pose T venait de la pose de repos.
- v74 : hôtel de ville du Bastion peint (`colombages_peints.py` → col_hv : grande maison à colombages + beffroi à horloge et toit d'ardoise, bannières bleues) à la place de l'église Sketchfab.
- v75 : marchés propres aux factions (`outils/blender/marche_var.py` : Horde en rondins sous peaux sombres, Nécropole en pierre noire à toiles violettes et fioles vertes, Sylve en branches sous toits de feuilles).
- v76 : retouches de couleur à l'affichage (`TEINTE3D` dans sprites.js, filtre appliqué une fois par planche) : ogre vert-gris au lieu de jaune plastique, tréant brun à feuillage vert-jaune au lieu d'orange, troll de pierre gris-vert.
- v77 : lacs et hauts-fonds moins pâles (eau peu profonde plus opaque, .93-.97) ; défenses des huttes de la Horde en bois sombre (matériau os_h).
- v78 : ciels de ville peints (cumulus dessinés au canevas : ombre bleutée, corps clair, bord doré, flous ; teintes par faction) au lieu de la photo HDRI. `window.CIEL_PHOTO=1` pour revenir à la photo. Essai rejeté : côtes adoucies par bruit sur la distance à l'eau (aucun effet sur les lacs, flaques parasites).
- v79 : dallage peint (`sols_peints.py route` : pavés irréguliers Voronoï périodique, joints de terre, relief) pour l'allée des villes et les routes de la carte, au lieu de la photo de terre battue.
- v80 : plus de troncs photo (« tronc_a », lus comme des bâtons noirs) semés dans la prairie.
- v81 : ombre de contact (ellipse douce, `ombrePied`) sous les monstres et les héros de la carte.
- v82 : ombre de contact aussi sous les coffres et les piles de ressources (essai de coffre peint rejeté : le modèle photo d'origine est plus réussi).
- v83 : fenêtre Construire illustrée (comme Heroes) : chaque carte montre le rendu Blender du bâtiment (`R3.imageBat`) et, pour les habitations, la créature produite ; en 2D, seulement la créature.
- v84 : troupes améliorées reconnaissables à un liseré doré fin (à l'intérieur du liseré sombre) dans planche3D.
- v85 : fiche du héros et fenêtre de montée de niveau : portrait plus grand encadré d'or, icônes des quatre caractéristiques.
- v86 : fort de la Horde en bois vu de la ville (\`horde_peints.py\` FORT=1 → fortv_horde : halle de rondins à toit de chaume et cornes, trois tours de guet, palissade) au lieu du château de pierre.
- Revue graphiste v83 (ORANGE), pistes : 1) échelle des rides de sable et des congères trop grande, transitions floues ; 2) piles trop grosses, or jaune plat, gemmes confettis ; 3) marais sans vase ni flaques, sanctuaires trop blancs ; 4) gros rochers et montagnes photo ; 5) liseré des créatures en ville, échelles incohérentes en combat ; 6) fenêtre Construire : même image par niveau, fond ciel bleu, icônes au trait.
- v87 : rides de sable et congères plus fines (×2,5) et moins contrastées, relief adouci ; piles de ressources ×0,72, or ocre, rubis et gemmes moins saturés.
- v88 : marais avec petites flaques sombres à reflet et bords de vase (`sols_peints.py marais`, base `outils/ressources/sol_marais_base.jpg`) ; sanctuaire en pierre patinée (enduit) et cuivre plus sombre.
- v89 : fenêtre Construire sur fond parchemin (plus de ciel bleu), bâtiments à niveaux (conseil→capitole, fort→château, guildes) dessinés de plus en plus grands.
- v90 : au-delà du bord de la carte, noir uni (le scintillement de l'eau ne transparaît plus).
- v91 : montagnes de la carte en roche peinte ocre-brun plus contrastée (montagnes.py PEINT=1, rampe de couleur et soleil plus chauds) au lieu du gris.
- v92 : en combat, échelle des créatures resserrée (hauteur 1,4+0,15×niveau au lieu de 1,05+0,2×niveau) : petites unités plus lisibles, grosses inchangées.
- v93 : icônes de l'interface en relief doré (remplissage léger, ombre portée, reflet) au lieu du simple trait.
- v94 : grenier de la Nécropole = grange Blender (plus la hutte ronde construite au code).
- v95 : sol de lave régénéré (`sols_peints.py lave` : plaques de basalte irrégulières, Voronoï fortement déformé, fissures d'épaisseur variable) : coulées incandescentes en grappes au lieu d'un carrelage.
- v96 : nuages de ville dessinés au quart de la taille puis agrandis avec un seul flou (ouverture de ville 1,2 s → mesurée sur le Mac).
- v97 : flaques du marais moins nombreuses et plus grandes (effet de pois en combat).
- v98 : rochers d'obstacle en combat légèrement assombris ; rides du sable encore atténuées (plus d'effet de veinage sous la grille).
- v99 : spectre et liche moins saturés (TEINTE3D).
- v100 : combat de siège : château Blender de la carte (même plongée ≈ 51° que la caméra de combat, butte selon le terrain) à droite du champ de bataille, au lieu du château construit au code. Essai rejeté : vue de ville (8°) en panneau, incohérente avec la plongée.
- v101 : terre battue et lande « peintes » (`sols_peints.py terre,rude` : photo d'origine gardée dans outils/ressources/bases, filtres médian + mode sur mosaïque 3×3 pour garder les raccords).

## v102 (24/11) — rivages adoucis
- Le champ « distance à l'eau » qui creuse le sol est flouté sur environ une case (deux passes) puis légèrement bruité : les côtes diagonales ne font plus d'escaliers de cases ; une case d'eau isolée reste de l'eau (vérifié : pas de flaque parasite sur la graine 7).
- Essai rejeté : herbe « peinte » (filtre médian + mode comme terre/lande) — à peine visible et plus plate que la photo.

## v103 (24/11) — créatures de la ville sans « autocollant »
- Les créatures posées devant leurs habitations (panorama de la ville) n'ont plus le liseré sombre ni le liseré doré de la carte et des combats : elles se fondent dans la scène éclairée (planche brute, `plancheBrute` dans sprites.js ; filtres de couleur TEINTE3D conservés). Clics toujours exacts (villes_clics 28/28).

## v104 (24/11) — accessoires de place propres à chaque faction
- `outils/blender/accessoires_peints.py` (ELEV=8) + `accessoires_vers_imp.py` : pierres tombales, croix et cercueil (Nécropole), totem, tambours de guerre et séchoir à peaux (Forteresse), souches à champignons et paniers de pommes (Sylve). Le Bastion garde tonneaux et caisses. Huit petites images ajoutées à l'atlas « b » (+60 Kio).

## v105 (24/11) — grenier propre à chaque faction
- `outils/blender/greniers_var.py` (ELEV=8 ROT=32) : greniers ronds en torchis sur pierres (Horde), grenier tressé sur pilotis à chaume moussu (Sylve), ossuaire de pierre à toit d'ardoise (Nécropole). La grange de bois du Bastion n'apparaît plus dans les autres villes.

## v106 (24/11) — écran d'accueil
- Fond (ville du Bastion en travelling) rendu une fois légèrement flou et assourdi (`blur ≈1,4 px`, saturation .9), vignette sombre sur les bords : le titre se détache comme devant un décor de théâtre.
- Halo du titre en dégradé « closest-side » (plus de rectangle sombre visible), titre sur une ligne à l'ordinateur ; marges réduites au téléphone.
- Essai rejeté : bruit plus fort sur les rivages (lacs moins rectilignes) — il comblait un chenal d'une case sur la graine 7 (eau dessinée en terre).

## v107 (24/11) — sols de combat neige et marais
- Neige : sol teinté gris-bleu (0xc4cad4), moins éblouissant (luminance du centre 227 → 200).
- Marais : herbe avec plaques de marais (au lieu du motif de flaques répété qui faisait « pois »), teinte olive sombre.

## v108 (24/11) — sapins enneigés
- `outils/ressources/sapins_neige.py` : versions enneigées des trois sapins (vues carte et ville), neige posée sur le bord supérieur des étages de branches avec du bruit, teinte un peu froide. Utilisées partout sur la neige (carte et combats) ; les feuillus verts du terrain enneigé sont remplacés par des arbres nus.

## v109 (24/11) — guilde, livre de sorts et taverne illustrés
- Médaillons de sorts (`iconeSort` dans sprites.js) : glyphe clair en relief sur un disque coloré par école (feu, foudre, lumière, terre, ténèbres, air), cerclé d'or ; dans la guilde des mages et le livre de sorts du combat.
- Taverne : portrait de la classe proposée sur chaque carte.
- (v110) Fiche du héros : médaillons devant les sorts connus. Combat : héros monté 30 % plus grand (comme le héros de Heroes III à côté de son armée).

## v111 (24/11) — fumée au-dessus des villes
- Cinq bouffées douces (sprites, sans écriture de profondeur) montent du donjon de chaque ville de la carte et se dissipent : la carte paraît habitée. Coût négligeable (5 sprites par ville).

## v112 (24/11) — coffres qui scintillent
- Éclat doré (étoile à quatre branches, mélange additif) qui s'allume brièvement sur chaque coffre de la carte, à un rythme propre à chacun : les coffres se repèrent d'un coup d'œil.

## v113 (24/11) — vol d'oiseaux
- Toutes les 46 s, un petit vol de cinq oiseaux (silhouettes en V qui battent des ailes, ombre légère au sol) traverse la vue de la carte dans une direction qui change à chaque passage (`animOiseaux` ; `window.OIS_K` fige leur position pour les captures).

## v114 (24/11) — ambiance animée des combats
- `ambianceCombat` (combat_ui.js) : flocons qui tombent en biais sur la neige, braises qui montent et clignotent sur la lave, lucioles qui s'allument au marais. Dessiné en 2D par-dessus le décor, quelques dizaines de points par image.
- Mesure sur le Mac (navigateur intégré, v113) : rendu de la carte 3,7 ms par image (3 ms avant fumée, oiseaux et éclats).

## v115 (24/11) — oiseaux dans le ciel des villes
- Un vol de cinq oiseaux traverse le ciel du panorama de la ville toutes les 28 s, en changeant de sens et de hauteur ; à la Nécropole ce sont des chauves-souris (battement plus rapide). Dessin 2D par-dessus le panorama, sans coût de rendu 3D.
- (v116) Combats sur herbe, terre et lande : une quinzaine de feuilles qui tournoient en traversant le champ de bataille.
- (v117) Les artefacts posés sur la carte scintillent aussi, comme les coffres.

## v118 (24/11 après-midi) — l'eau de la carte, refaite à fond
- **Bug trouvé et corrigé** : le relief de la terre ferme descendait par endroits sous le niveau de l'eau, ce qui dessinait de faux lacs et de fausses baies sur des cases où l'on marche (graine 7 : la baie et son îlot à droite du château ; graine 11 : le lac sous le château ; graine 23 : la mare au nord). Mesure avec le nouvel outil `outils/verif_rivages.py` sur 5 graines : avant, 78 à 224 centres de cases de terre sous l'eau, 3 à 17 cases d'eau hors de l'eau et 449 à 1 666 points de « faux lacs » par carte ; après : **0 partout**.
- Rive tracée à partir de la distance exacte au bord des cases d'eau (et plus de la distance entre centres de cases), coins arrondis par un flou léger, ondulation par du bruit, et une contrainte proportionnelle à la distance qui garantit que chaque case garde sa nature (les chenaux et isthmes d'une case restent justes). Plage en pente douce sur une demi-case.
- Fond de l'eau peint en sable (basalte sous la lave) quelle que soit la case ; sous l'eau, chaque case prend le terrain de la terre la plus proche : plus de « dents de scie » lave/fond le long des côtes.
- Le pied des montagnes et les routes ne relèvent plus le fond de l'eau.
- Réglage final : flou ≈ 0,9 case, bruit centré faible (le bruit fort butait sur la garde et redonnait des bords droits) ; lacs et baies aux contours arrondis.
- Outils : `verif_rivages.py [graines]` (code 1 si l'eau dessinée ne correspond pas aux cases), `capt_rivages.py dossier [graines] [zoom]` (planche de trois gros plans de côtes par graine), `capt_terrains.py` (combat par terrain). `R3._h(x,z)` donne la hauteur du sol.

## v120 (24/11 après-midi) — limites entre terrains
- Chaque terrain a une « appartenance » douce calculée sur la carte (distance exacte au bord des cases, coins arrondis par un flou, 4 points par case), envoyée au shader du sol dans deux textures (`bsMemA`, `bsMemB`). Le shader choisit le terrain par un softmax sur appartenance + bruit propre au terrain (2 octaves) + relief de la texture : limites ondulées et douces, centrées sur le vrai bord des cases (avant : coins d'un ancien maillage décalé, crêneaux sur les escaliers, neige qui « avalait » la lave).
- Coût : génération de la carte +70 ms (472 → 543 ms en rendu logiciel) ; 6 lectures de texture de plus par pixel du sol (à mesurer sur le Mac).
- Outil : `capt_transitions.py dossier [graines]` (trois gros plans de limites entre terrains par graine) ; `perf.py` accepte `JEU=` pour comparer une ancienne version.

## v121 (24/11 après-midi) — routes à la bonne place, rivières vivantes, ponts
- **Bug corrigé** : sur la carte 3D, routes et rivières étaient dessinées en miroir nord ↔ sud (le masque peint était une CanvasTexture retournée) : les routes pavées ne passaient pas sur les vraies cases de route (bonus de déplacement). `flipY=false` : chaque route est maintenant dessinée sur ses cases.
- Rivières : berges humides plus sombres, eau claire au bord et sombre au milieu, rides animées, écume le long des rives.
- Ponts de bois (tablier, garde-corps, poteaux) posés automatiquement là où une route croise une rivière, dans l'axe de la route (détection sur le masque : pixels route + rivière, axe principal des pixels de route autour).

## v122 (24/11 après-midi) — collines douces
- Relief vallonné selon le terrain (lande la plus vallonnée, puis neige, terre, sable, herbe, lave ; marais plat), jamais près de l'eau (le contrôle des rivages reste à 0 défaut) ni sous les objets posés à plat (villes, mines, lieux : cases occupées à plat, voisines adoucies). La lumière rasante dessine des creux et des bosses sur les grandes prairies.

## v123 (24/11 après-midi) — brouillard de guerre en nuées
- Les zones inexplorées ne sont plus d'un noir uni : nuées gris-violet sombres qui dérivent lentement (deux bruits animés), bord effiloché, liseré légèrement chaud à la limite. Les objets cachés (arbres, montagnes) sont retirés sous les nuées (pas de silhouette). Rien d'inexploré ne se lit sous les nuées. Combats et villes non concernés.

## v124 (24/11 après-midi) — minicarte peinte
- La minicarte n'est plus faite de carrés de couleur : couleurs fondues entre cases avec grain, côtes lisses (distance à l'eau interpolée) et eau en dégradé selon la profondeur, montagnes en relief éclairé par le haut-gauche, forêts en taches vert sombre, inexploré en nuées avec bord doux.

## v125 (24/11 après-midi) — flèches de chemin visibles
- **Bug corrigé** : les flèches du chemin du héros n'apparaissaient pas sur la carte 3D (InstancedMesh dont la sphère englobante était calculée à vide au premier rendu → toujours hors champ). `frustumCulled=false`.
- Flèches redessinées : pointe épaisse cerclée de sombre avec ombre, vertes si atteignables ce tour, rouges au-delà, la dernière plus grande.

## v126 (24/11 après-midi) — effets de sorts
- Orbes (flèche magique, tirs magiques) : halo lumineux avec traînée. Boule de feu : onde de choc au sol, boule de feu, 26 braises projetées en gerbe, fumée qui monte. Sorts d'aide et de malédiction : cercle de runes au sol qui tourne et colonne de lumière. Éclair : flash sur le sol à l'impact.
- Corps à corps : trait de taille blanc et éclats à l'impact ; troupe anéantie : nuage de poussière.

## v128 (24/11 après-midi) — bâtiment survolé cerclé d'or
- En ville, le bâtiment sous la souris (et la créature posée devant son habitation) est entouré d'un liseré doré lumineux qui pulse doucement, calculé sur sa vraie silhouette (passe d'identifiants), au lieu du rectangle pointillé.
- (v129) Carte, à la souris : cadre doré arrondi sur la case survolée (terrain libre) ; sur un objet ou un héros, le curseur devient une main.
- (v130) Nouvelle semaine : annonce sur un parchemin cerclé d'or avec la créature de la semaine (« Semaine du griffon », +3 griffons…), qui glisse et s'efface en 4 s ; bandeaux d'information en dégradé brun avec ombre.

## v131 (24/11 après-midi) — décor qui disparaissait en vue large
- **Bug important corrigé** : three r160 élimine les InstancedMesh hors champ avec une sphère calculée sur le plan unité, sans le décalage appliqué dans le shader des imposteurs. En vue large (et sur les bords de l'écran), des massifs entiers de montagnes et de forêts disparaissaient en ne laissant que leurs **ombres** (ces grandes taches sombres sur les plaines). La sphère englobante juste est maintenant donnée à l'instance (`im.boundingSphere`).
- Ombres des imposteurs : carte verticale face au soleil, sans l'inclinaison vers la caméra (ombres plus justes au pied des arbres). Arbres au pied des montagnes sans ombre portée.
- Ce bug touchait aussi la vue normale : jusqu'à 4,7 % de l'écran (montagnes, forêts) manquait selon la position de la caméra (mesure verif_culling sur la graine 11, version v130).
- Banc : appels de dessin 138 → 157 (carte), 399 → 425 (vue large) : ce sont les objets qui manquaient ; images/s inchangées dans le banc.
- Outil `outils/verif_culling.py [graines]` : rend 5 vues avec et sans élimination hors champ et compare (érosion pour ignorer les liserés du vent) ; code 1 si un objet manque. v130 : DÉFAUT (jusqu'à 4,7 %), v131 : 0 %.

## v132 (24/11 après-midi) — portée de déplacement en combat
- Les cases atteignables par la troupe active sont assombries (comme dans Heroes III) et cernées d'un liseré doré lumineux qui suit le contour de la zone (obstacles et troupes exclus). Vérifié à l'ordinateur et au téléphone (`dessinerCombat` sans erreur au tour du joueur). Outil `outils/verif_tour_combat.py [dossier]` : dessin du tour du joueur (portée, survol, modes sort) sur 3 terrains, ordinateur + téléphone ; code 1 si erreur (les robots jouent en automatique et ne passent pas par ce dessin).
- (v133) Vignettes de créatures recadrées sur leur silhouette (`vignetteCre`) avec fond brun dégradé : file d'initiative du combat, armée du héros dans le panneau, garnisons — les créatures remplissent leur case au lieu d'y flotter.
- (v134) Fin de combat : emblème dessiné en tête de la fenêtre — victoire : épées croisées dans une couronne de laurier dorée avec rayons ; défaite : bannière sombre déchirée et épée brisée (bannière grise si fuite).
