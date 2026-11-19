# Variantes de compétences — simulations appariées (19/11/2026, version publiée 1795085624-9c55)
sim.js + analyze.js, bot attentif (MIST 0,08), graines 1-2000 identiques avant/après. VARS=none redonne exactement les parties d'avant (md5 identique).

| Réglage | Défaites/partie | Défaite contre les dragons |
|---|---|---|
| Avant (sans variante) | 0,48 | 8,9 % |
| Variantes r | 0.45 | 8.4% |
| Variantes a | 0.48 | 8.9% |
| Variantes b | 0.47 | 9.1% |

(r = une variante sur deux selon la graine, a = toutes A, b = toutes B ; le bot ne monte que Fendoir, Boule de feu et Volée.)

Le repère historique 6,7 % = graines 1-200 seulement. Bruit par blocs de 200 graines AVANT : 6,7 · 8,8 · 8,3 · 10,9 · 7,9 · 9,7 · 10,5 · 9,2 · 7,9 · 9,3 %. Après (r) graines 1-200 : 8.9%.

## Contrôle compétence par compétence (ORD=<comp>,fendoir,feu,volee ; VARK=<comp>), défaite contre les dragons sans variante → A / B
Réglages intermédiaires, 600 graines (1-600) puis 900 (601-1500) pour Barrière, Provocation, Volée, Soin. Écart < 1,5 pt = bruit (écart-type de la différence ≈ 0,8 pt).
- Barrière (partagée à 40 %) : 9,5 → 9,6 / 9,6 (graines 601-1500)
- Provocation (Défi 18 énergie ; Cri 12 %→6 % ensuite) : 11,9 → 10,2 / 8,7 (avant passage à 6 %), puis B 10,2
- Volée (A 5×40 %, B 4×40 % + 20 % poison) : 9,6 → 8,5 (A à 40 %) / 8,7
- Soin A (+15 %, 22 énergie) : 8,9 → 8,9 (graines 601-1500)
- Marque 12,2 → 11,3 / 11,7 ; Givre 9,5 → 9,5 / 8,7 ; Rempart 10,8 → 9,4 / 9,5 ; Exécution 8,7 → 8,5 / 7,8 ; Météore 8,4 → 8,0 / 8,5 ; Poison 12,4 → 11,7 / 11,3 ; Tir fatal 9,1 → 9,0 / 8,9 ; Frappe 10,3 → 9,0 / 10,2 ; Tir 10,0 → 9,9 / 10,3 ; Fendoir 8,5 → 8,6 / 8,4 ; Feu 8,5 → 7,9 / 8,8 (1000 graines)
