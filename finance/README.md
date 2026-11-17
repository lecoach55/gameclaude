# Bureau d'analyse financière

Outils de l'analyse du portefeuille de Victor, pour que chaque séance reprenne où la précédente s'est arrêtée au lieu de repartir de zéro.

**Le dépôt est public : aucun montant, aucune valorisation, aucune donnée personnelle ici.** Les outils prennent le portefeuille en entrée à l'exécution, dans un fichier de travail rangé hors du dépôt (`/home/claude` ou le dossier temporaire de la session). Ce qui est versionné : le code des outils, les thèses d'investissement (faits publics sur les sociétés), et un journal de faits de marché.

## Les outils

### `outils/portefeuille.py` — poids, écarts, répartition
```bash
python3 finance/outils/portefeuille.py poids    mon-pf.json
python3 finance/outils/portefeuille.py repartir mon-pf.json --cto 500 --pea 150 --etf-pea WPEA
python3 finance/outils/portefeuille.py saveback mon-pf.json --montant 15
```
Format d'entrée : voir `outils/exemple-portefeuille.json` (chiffres inventés, à recopier hors dépôt).

Ce que l'outil garantit, et qu'un calcul à la main rate :
- la somme de la répartition **tombe juste à l'euro** (méthode des plus grands restes) ;
- une ligne déjà sur-pondérée reçoit **0 €** tant que d'autres manquent — rééquilibrage par les achats, jamais par la vente ;
- l'enveloppe PEA est convertie en **nombre entier de parts** : le PEA Trade Republic n'accepte pas les fractions d'action, et le reliquat non investi est affiché.

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
- **Rééquilibrage par les achats uniquement.** On n'allège jamais une ligne pour en acheter une autre.
- **Deux enveloppes.** PEA = socle ETF (MSCI World synthétique, `IE0002XZSHO1`), parts entières obligatoires. CTO = les lignes en direct + l'ETF S&P 500.
- **Une recommandation de vente exige une rupture de thèse argumentée**, jamais le seul niveau du cours.
- **Le silence est une réponse valable.** Les jours calmes, la veille n'envoie rien : chercher une « opportunité » quotidienne travaille contre la discipline qui a fait grossir le portefeuille.
- **Ne rien inventer.** Un chiffre non vérifié se dit non vérifié ; on indique où le trouver.

## Tâches programmées

Trois tâches alimentent ce dossier (heure de Paris) :
- veille quotidienne, du lundi au vendredi à 18h28, alertes seulement ;
- point hebdomadaire le dimanche à 18h22 ;
- préparation du plan du mois le 13 à 18h25.

Chacune doit, en repartant, laisser le dossier plus outillé qu'en arrivant : voir `FEUILLE_DE_ROUTE.md`.
