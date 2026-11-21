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
