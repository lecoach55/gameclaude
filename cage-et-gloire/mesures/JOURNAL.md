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
