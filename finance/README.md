# Bureau d'analyse financière

Outils de l'analyse du portefeuille de Victor, pour que chaque séance reprenne où la précédente s'est arrêtée au lieu de repartir de zéro.

**Le dépôt est public : aucun montant, aucune valorisation, aucune donnée personnelle ici.** Les outils prennent le portefeuille en entrée à l'exécution, dans un fichier de travail rangé hors du dépôt (`/home/claude` ou le dossier temporaire de la session). Ce qui est versionné : le code des outils, les règles d'allocation, les thèses d'investissement (faits publics sur les sociétés), et un journal de faits de marché.

**À lire avant de toucher aux règles : [`CORRECTIONS.md`](CORRECTIONS.md)** — ce qui a été corrigé, pourquoi, et quels garde-fous l'empêchent de revenir.

**Avant de proposer une nouvelle ligne : [`ETUDE_NOUVELLE_VALEUR.md`](ETUDE_NOUVELLE_VALEUR.md)** — l'étude est faite, les deux routes sont identifiées et le critère de départage est écrit. Ne pas la refaire ; la mettre à jour.

## Les outils

### `outils/cibles.json` — la source unique de vérité
Poids cibles, montants mensuels, seuil de rééquilibrage, objectif de socle indiciel, étalon de mesure. **Aucun de ces chiffres ne doit être recopié ailleurs** (ni dans un script, ni dans le texte d'une tâche programmée) : c'est ainsi qu'une règle corrigée restait périmée dans trois endroits sur quatre.

### `outils/portefeuille.py` — poids, écarts, répartition
```bash
python3 finance/outils/portefeuille.py poids    /home/claude/pf.json
python3 finance/outils/portefeuille.py repartir /home/claude/pf.json   # montants de cibles.json
python3 finance/outils/portefeuille.py socle    /home/claude/pf.json   # part du socle indiciel
python3 finance/outils/portefeuille.py saveback /home/claude/pf.json
```
Format d'entrée : voir `outils/exemple-portefeuille.json` (chiffres inventés, à recopier hors dépôt). Ne pas y remettre de clé `cibles` : elles viennent de `cibles.json`.

Ce que l'outil garantit, et qu'un calcul à la main rate :
- la somme de la répartition **tombe juste à l'euro** (méthode des plus grands restes) ;
- une ligne déjà sur-pondérée reçoit **0 €** tant que d'autres manquent — rééquilibrage par les achats, jamais par la vente ;
- les lignes à moins de **2 points** de leur cible ne reçoivent rien : cet écart est du bruit, le viser crée un rituel sans effet ;
- l'enveloppe PEA est convertie en **nombre entier de parts** : le PEA Trade Republic n'accepte pas les fractions d'action, et le reliquat non investi est affiché ;
- `socle` mesure la part du socle indiciel sur l'ensemble PEA + CTO, contre l'objectif de 50 %. C'est le seul chiffre qui dit si la correction du 17/11/2026 avance.

Validé le 17/11/2026 : reproduit à 1 € près le plan du 15 novembre calculé à la main.

### `outils/veille.py` — veille quotidienne et mémoire
```bash
python3 finance/outils/veille.py checklist              # ce qu'il faut vérifier aujourd'hui
python3 finance/outils/veille.py journal --jours 14     # ce qui a déjà été signalé
python3 finance/outils/veille.py alerte Safran "guidance relevée" --source https://...
```
`checklist` sort, ligne par ligne, la thèse, les indicateurs à suivre et les critères de rupture. Le `journal` (`journal/faits.jsonl`) évite de resignaler deux fois le même fait et donne l'historique d'une ligne.

### `outils/theses.json` — la mémoire du raisonnement
Une thèse et des critères de rupture par ligne, plus les surveillances ouvertes (luxe européen, remplacement de NVIDIA). **À mettre à jour à chaque analyse** : c'est ce fichier qui fait que l'analyse s'approfondit au lieu de se répéter.

### `outils/tests/verifier_finance.py`
```bash
python3 finance/outils/tests/verifier_finance.py   # doit être 13/13 au vert avant de pousser
```

## Méthode (à ne pas réinventer à chaque séance)

- **DCA le 15 du mois** + saveback le 1er. Le plan s'applique quel que soit le niveau des marchés : pas de market timing.
- **L'argent neuf va d'abord au socle indiciel.** Au moins 60 % du versement mensuel sur l'ETF monde du PEA, tant que le socle est loin de son objectif de 50 %.
- **Rééquilibrage par les achats uniquement.** On n'allège jamais une ligne pour en acheter une autre.
- **Deux enveloppes.** PEA = socle ETF (MSCI World synthétique, `IE0002XZSHO1`), parts entières obligatoires. CTO = les lignes en direct + l'ETF S&P 500.
- **Une recommandation de vente exige une rupture de thèse argumentée**, jamais le seul niveau du cours.
- **Toujours donner l'étalon.** Une performance se dit « +X contre +Y pour le MSCI World », jamais seule : un chiffre sans repère produit de l'inquiétude, pas une décision.
- **Juger la stratégie sur le montant versé par mois**, pas sur la performance du mois. À ce stade, la performance mensuelle est du bruit.
- **Le silence est une réponse valable.** Les jours calmes, la veille n'envoie rien : chercher une « opportunité » quotidienne travaille contre la discipline qui a fait grossir le portefeuille.
- **Ne rien inventer.** Un chiffre non vérifié se dit non vérifié ; on indique où le trouver.

## Tâches programmées

Trois tâches alimentent ce dossier (heure de Paris) :
- veille quotidienne, du lundi au vendredi à 18h28, alertes seulement ;
- point hebdomadaire le dimanche à 18h22 ;
- préparation du plan du mois le 13 à 18h25.

Chacune doit, en repartant, laisser le dossier plus outillé qu'en arrivant : voir `FEUILLE_DE_ROUTE.md`.
