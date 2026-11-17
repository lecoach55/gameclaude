# Journal des corrections de méthode

Ce qui a été changé, pourquoi, et quand. Une erreur de méthode qui n'est pas écrite ici revient six mois plus tard sous une autre forme. À relire avant toute révision des règles.

---

## 17/11/2026 — révision après un portefeuille à +0

**Contexte.** Victor constate qu'il est à +0 après environ un an. Audit de tout ce qui avait été conseillé. Le +0 lui-même s'explique arithmétiquement (un quart du portefeuille versé 48 h avant une baisse de marché de 1,6 %, plus NVIDIA en recul) et n'est pas un échec de stratégie : sur douze mois, un portefeuille d'actions diversifié a environ une chance sur trois de finir plat. Mais l'audit a révélé quatre vraies erreurs de méthode.

### 1. Le partage de l'argent neuf contredisait le diagnostic

- **L'erreur.** Le diagnostic de fond disait : trop concentré sur la France, besoin d'un socle indiciel mondial. Les plans mensuels envoyaient pourtant 500 € sur le stock-picking du CTO et 150 € sur l'ETF monde du PEA, soit 77 % de l'argent neuf dans le problème et 23 % dans la solution.
- **La correction.** Versement mensuel inversé : **400 € PEA / 250 € CTO**. Règle inscrite dans `outils/cibles.json` : au moins 60 % de l'argent neuf va au socle indiciel.
- **Le garde-fou.** `portefeuille.py socle` mesure la part du socle (ETF monde + ETF S&P 500) sur l'ensemble PEA + CTO, avec un objectif de 50 %. Au 17/11/2026 : **23 %**. Un contrôle refuse désormais un `cibles.json` où le CTO recevrait plus que le PEA.

### 2. NVIDIA n'aurait pas dû entrer dans le portefeuille

- **L'erreur.** Trois raisons de fond, toutes connues à l'avance : exposition déjà obtenue via l'ETF S&P 500 (donc double achat du même risque), inéligibilité au PEA (donc coincée au CTO à 30 % de flat tax), et la ligne la plus volatile d'un portefeuille voulu défensif et à dividendes. Coût mesuré au 14/11/2026 : **−1,9 point** sur une performance de +3,6 %. Les huit autres lignes faisaient +6,1 %.
- **La correction.** Cible ramenée de 13,5 % à **9 %**. On ne vend pas sur le cours : la ligne est gelée (plus alimentée) et son poids se dilue à mesure que le reste grossit. La décision de vendre ou non se prend sur la thèse — croissance des centres de données, marge brute — jamais sur les −17 %.
- **Le garde-fou.** Un contrôle vérifie qu'une ligne au-dessus de sa cible ne reçoit rien, avec ou sans seuil.

### 3. Fausse précision des cibles

- **L'erreur.** Des cibles à la décimale (12,8 %, 10,5 %, 7,5 %) sur un portefeuille de 2 000 €, et un rééquilibrage mensuel visant des écarts de 0,3 point. Cela a produit un rituel qui donnait une impression de pilotage sans effet réel sur le résultat.
- **La correction.** Cibles arrondies au point, et **seuil de 2 points** : une ligne à moins de 2 points de sa cible ne reçoit rien. Effet immédiat sur le plan de décembre — au lieu de neuf miettes, tout va à la seule ligne qui compte vraiment.
- **Le garde-fou.** Un contrôle refuse toute cible non arrondie dans `cibles.json`.

### 4. Aucun étalon de mesure

- **L'erreur.** La plus grave, parce qu'elle est méthodologique. Des projections à 20 et 30 ans avaient été fournies — de l'arithmétique, pas des prévisions — et aucun repère pour juger le mois en cours. D'où la question « je suis à +0 » posée comme une inquiétude et non comme un fait : sans étalon, ce chiffre ne veut rien dire.
- **La correction.** Étalon inscrit dans `cibles.json` : **MSCI World en euros**, relevé aux mêmes dates que le portefeuille, intégré au point du dimanche. La formulation attendue est désormais « +X contre +Y pour le marché ».

### 5. Les règles étaient recopiées à trois endroits

- **L'erreur.** Poids cibles et montants mensuels étaient écrits en dur dans les trois tâches programmées. C'est exactement comme ça qu'une règle corrigée ici reste périmée ailleurs.
- **La correction.** `outils/cibles.json` est la source unique de vérité. Les outils et les tâches la lisent ; plus aucun chiffre d'allocation n'est recopié dans un texte de tâche.

### Ce qui n'a pas changé, et ne doit pas changer

Le refus du market timing. Le refus de vendre sur le niveau du cours. Le DCA maintenu dans les périodes de doute. Le signalement du problème fiscal PEA/CTO. C'est cette discipline qui a mené le portefeuille de 296 € à plus de 2 000 €, et le +0 de novembre n'est pas une raison d'y toucher.

### Risque restant, assumé

Bricks.co : 1 000 € illiquides, environ un tiers de l'exposition. L'analyse avait porté sur le rendement de 9 % plus sérieusement que sur le risque de perte en capital, qui est réel et que ce rendement ne rémunère pas entièrement. Position non augmentée, intérêts réinvestis seulement.
