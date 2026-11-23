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
