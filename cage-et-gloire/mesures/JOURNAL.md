# Journal — Cage & Gloire

## v1 — 15/11/2026
Création. Calibrage du combat (outils/calib_combat.js) :
```
base 50 écart 0 R 3 ud:50% sub:21% tko:14% sd:4% dr:1% ko:9% md:2% fav 60% round moy fin 2.06
base 70 écart 0 R 3 tko:11% sub:20% ud:54% sd:4% ko:8% md:2% dr:1% fav 61% round moy fin 2.06
base 80 écart 0 R 3 ud:54% sub:22% tko:11% sd:4% ko:6% md:2% dr:1% fav 62% round moy fin 2.07
base 50 écart 0 R 5 ko:16% sub:26% tko:25% ud:30% sd:2% dr:1% md:1% fav 62% round moy fin 2.86
base 80 écart 0 R 5 tko:20% ko:13% ud:33% sub:30% sd:3% dr:1% md:1% fav 61% round moy fin 3.00
```
Monde (outils/sim_monde.js 3 6) :
```
— graine 1 titres 5 V-D 113-90 max tier 4 erreurs 0 effectifs {"cfr":113,"hex":91,"ecc":92,"gla":93,"apx":106} combattants 788
— graine 2 titres 6 V-D 118-92 max tier 4 erreurs 0 effectifs {"cfr":118,"hex":93,"ecc":92,"gla":91,"apx":106} combattants 814
— graine 3 titres 2 V-D 86-74 max tier 3 erreurs 0 effectifs {"cfr":122,"hex":93,"ecc":93,"gla":90,"apx":106} combattants 814
TOTAL {"titres":13,"apex":2,"fail":0} 6.1s
```
Parcours au doigt (mobile 390×844) : aucune erreur. Arène : ≈ 70 appels de dessin, 151 000 triangles.

## v2 → v6 — nuit du 15 au 16/11/2026
Traits, camps, négociation, management, rivalités, Grand Prix, Top 15, prix, temple, succès, objectifs, sponsors, gala maison, entraînement délégué ; mise en scène (présentation, coins, marques, ralenti, sons).
Calibrage du combat sans traits : inchangé (≈ 52 % décisions). Effet des traits (outils/traits.js) : menton_fer  52.0% verre       46.0% machine     58.0% finisseur   51.8% tueur       51.1% diesel      55.2% explosif    55.6% gaucher     52.4% contreur    51.5% pressing    55.0% cage        50.2% gardes      53.9% rapide      51.7% 
Monde (sim_monde.js 4 8) :
```
— graine 1 titres 8 V-D 162-147 max tier 4 erreurs 0 effectifs {"cfr":99,"ecc":91,"hex":92,"gla":91,"apx":106} combattants 531
   objectifs/an: 1233312 commissions 20/22/28/22/21/24/22/28/21/29/30/30
— graine 2 titres 16 V-D 173-140 max tier 4 erreurs 0 effectifs {"cfr":99,"hex":92,"gla":90,"ecc":90,"apx":106} combattants 530
   objectifs/an: 2232332 commissions 20/19/20/22/20/25/30/25/22/30/30/30
— graine 3 titres 15 V-D 199-168 max tier 4 erreurs 0 effectifs {"cfr":97,"ecc":89,"hex":92,"gla":92,"apx":106} combattants 533
   objectifs/an: 2333223 commissions 18/20/19/18/18/19/27/20/19/20/30/29
— graine 4 titres 16 V-D 200-174 max tier 4 erreurs 0 effectifs {"cfr":98,"hex":94,"ecc":88,"gla":90,"apx":107} combattants 525
   objectifs/an: 2332232 commissions 22/23/21/22/21/23/21/28/22/22/25/24
TOTAL {"titres":55,"apex":4,"fail":0} 22.3s
```
Tests : evtest 32 événements + 8 spéciaux sans erreur ; parcours au doigt, vues, combat3d, sauvegarde (rechargement identique, 147 000 caractères compressés au lieu d'environ 1 Mo) sans erreur. Arène : 55-69 appels de dessin, ≈ 249 000 triangles avec les soigneurs.

## v8 — 16/11/2026 — fluidité (rapport du banc : ~17 img/s sur Mac Intel)
- Banc swiftshader 771x755@2 : avant 1000 ms/image (83-99 appels, 151 k triangles) ; après, même résolution 1,6 : 381-425 ms (×2,6) ; qualité Moyenne par défaut : 205-243 ms (×4,5), 22-24 appels, 70 k triangles ; Basse ~52 ms.
- Xbot simplifié à 45 %, décor fusionné, public instancié, éclairage réduit, ombres taches, résolution adaptative, menu Qualité 3D.
- Ajouts : Temps forts, récap « Cette semaine », 6 nouveaux événements (section jeunes, sparring, nutritionniste…). Équilibre combat inchangé ; sim_monde 3 graines 0 erreur ; evtest 39+8 0 erreur ; sauvegarde rechargée identique.

## v9 — 16/11/2026 — chasse aux bugs et enrichissement
- Banc réel v8 (Mac Intel Iris Plus, 483x755) : arène large 54,7 img/s, au sol 49,3 (contre ~17 en v7) ; « échanges serrés » 7,8 à cause d'un gel unique de 15 s (fenêtre cachée ou compilation de shaders) → précompilation + banc qui écarte les pauses.
- Simulations : audit 4×12 ans et 2×8 ans sans aucune incohérence ; sim_monde 3×12 ans 0 erreur ; 7 robots cliqueurs (≈ 5 500 clics, téléphone et ordinateur) : 1 erreur trouvée et corrigée (cote du pré-combat mise à jour après fermeture de la fenêtre).
- Constat : après ~6 ans la salle est au maximum et l'argent s'accumule (5-10 M€ à 12 ans) → complexe (4 bâtiments) comme objectif de fin de partie. Titres APEX très rares (1 en 36 années simulées) : signalé, non modifié.
- Banc swiftshader inchangé : 216 / 240 / 203 ms (perf_v9.json).
