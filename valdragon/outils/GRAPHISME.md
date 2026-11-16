# Améliorer le graphisme de Valdragon : la chaîne d'outils

Tout se lance depuis le dossier de travail préparé (`sh valdragon/outils/preparer.sh /home/claude/t3d`, puis `cd /home/claude/t3d && sh srv.sh`).

## 1. Trouver des ressources (CC0)
- `python3 /home/claude/outils/catalogue.py "lava,magma" textures 24 /tmp/lave.jpg` : cherche dans Poly Haven et ambientCG, planche d'aperçus classée par popularité (`textures`, `models`, `hdris` ou `tous`).
  - Les vignettes rapides viennent de `cdn.polyhaven.com` et `acg-media.struffelproductions.com`. Si ces domaines ne sont pas autorisés, l'outil retombe sur la couleur 1k ou le zip 1K, ce qui est plus lent.
- Poly Haven : `outils-communs/phget.py`.
  - Textures : `python3 phget.py id1,id2 2k Diffuse,Displacement,Rough,AO`.
  - Modèles : `phget.model('wine_barrel_01')`.
- ambientCG : `curl -L -A valdragon-asset-tool/1.0 "https://ambientcg.com/get?file=<Id>_1K-JPG.zip"` (à décompresser avec `python3 -I`).
- Domaines déjà autorisés par Victor : `polyhaven.com`, `api.polyhaven.com`, `dl.polyhaven.org`, `ambientcg.com`, `acg-download.struffelproductions.com`.

## 2. Choisir et préparer
- `python3 /home/claude/outils/planche_modeles.py planche.png a.gltf b.glb …` : une vignette par modèle (ou par objet d'un .glb), avec sa taille en mètres et son nombre de triangles.
- Textures de sol et de mur par biome : `ph_tex2.py`.
  - Couleur multipliée par l'occlusion, relief.
  - **Rugosité dans le canal bleu de `_n`**.
  - Coulures et mousse ambientCG.
- Décors 3D : `pack_phprops.mjs` → `mq/phprops.glb`.
  - Le paquet suit des « recettes » (modèles, position, rotation, échelle), avec simplification par modèle (`SIMP`) et teinte (`TINT`), en textures webp 384 px.
  - Un nœud qui porte le nom d'une pièce KayKit la remplace automatiquement dans le jeu (taille ajustée par `fitH`).

## 3. Regarder
- `captures.py dossier 1` : les 6 scènes de référence. Écrit aussi `lisibilite.json`.
  - Contraste des personnages : `bord` mesure la netteté des silhouettes ; plus c'est haut, mieux c'est.
- `vue_haute.py sortie.png 2,6,10,14 0.42` : étages entiers révélés, vus de haut (architecture, habillage, vides).
- `gros_plan.py étage sortie.png 1.6 2 [cible]` : gros plan en haute qualité.
  - Cibles possibles : `statue`, `lave`, `glace`, `marchand`, `escalier`, `coffre` ou un nom de pièce (`barrel_large`…).
  - Pour qu'un nouvel élément soit trouvable, poser `obj.userData.kind='<nom>'`.

## 4. Comparer et vérifier
- `avant_apres.py [révision=HEAD]` : version GitHub contre dossier de travail, images côte à côte et banc mesuré dans la même minute, ce qui donne des écarts fiables.
  - Résultats dans `avant_apres/planche.jpg` et `perf.txt`.
  - Tous les outils de capture et de banc acceptent `VD_URL=…` pour viser une autre version.
- `verif.py rapide|complet` : une seule commande avant publication, avec un rapport `verif/rapport.html`.
  - Contenu : captures et comparaison aux références, lisibilité, banc contre `mesures/perf_ref.json`, sauvegarde, scénarios, poids de la page.
  - En mode complet, en plus : testeur exhaustif, blocages à l'entrée en combat, hors ligne.
- `poids.py` : budget de la page publiée (limite 16 Mio) par famille, les 15 plus gros éléments, et les ressources peut-être inutilisées.

## 5. Sur les appareils de Victor
- 🧪 Mode test → ▶ Banc. Le banc enregistre aussi la cadence maximale de l'écran et l'état de la batterie : un plafond de 30 img/s avec « limité par l'économie d'énergie » ne vient pas du jeu.
- Lecture : `db_list` sur `data/users/<id>`, documents `mesures_*`.

## Pièges connus
- Les rochers instanciés doivent être très simplifiés (`rock_scatter`, environ 250 triangles), sinon le nombre de triangles explose.
- `dedup()` fusionne deux maillages identiques : simplifier **avant** de dédoublonner.
- Une décalcomanie au sol doit être à y ≥ 0,03, sinon elle passe sous le dessus des dalles.
- Un même `lavaDecal` ou `iceSheet` sert à tous les étages : les marquer `userData.keep`.
- La lave est sans éclairage (`ShaderMaterial`) : lire la texture sans conversion sRGB, puis `pow(…,2.2)`.
