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
