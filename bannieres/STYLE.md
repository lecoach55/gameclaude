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
